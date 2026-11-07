"use client";
import {useEffect,useRef,useState} from 'react';
import {Camera,Check,LoaderCircle,MapPin,Sparkles,AlertTriangle} from 'lucide-react';
import {PLATE_PHOTO_LABEL,formatPlate,normalizePlate,validPlate,type DraftIntake, type GeoCheckIn} from '../lib/inspection-intake';
import {readPhoto} from '../lib/offline';
import type {Draft,FleetData,Photo} from '../lib/model';
import {PhotoView} from './photo-view';
import {DashboardReader} from './dashboard-reader';
import {Field} from './common';

export function InspectionIntakeCard({draft,data,aiReady,onChange,onVehicle}:{draft:Draft;data:FleetData;aiReady:boolean;onChange:(patch:Partial<Draft>)=>Promise<void|boolean>;onVehicle:(id:string)=>Promise<void>}){
 const intake:DraftIntake=draft.intake||{version:1};const [plateBusy,setPlateBusy]=useState(false),[photoBusy,setPhotoBusy]=useState(false),[gpsBusy,setGpsBusy]=useState(false),[message,setMessage]=useState('');
 const latest=useRef({draft,intake});latest.current={draft,intake};const photoLock=useRef(false),plateRequest=useRef<AbortController|undefined>(undefined);
 const platePhoto=draft.photos.find(p=>p.id===intake.platePhotoId),panelPhoto=draft.photos.find(p=>p.id===intake.dashboardPhotoId);
 useEffect(()=>{plateRequest.current?.abort();},[platePhoto?.id,draft.vehicleId]);
 useEffect(()=>()=>plateRequest.current?.abort(),[]);
 const patchIntake=(patch:Partial<DraftIntake>)=>onChange({intake:{...latest.current.intake,...patch,version:1}});
 async function photo(file:File,label:string){
  if(photoLock.current)return;photoLock.current=true;setPhotoBusy(true);setMessage('');
  try{const dataUrl=await readPhoto(file),p:Photo={id:crypto.randomUUID(),label,data:dataUrl,takenAt:new Date().toISOString()},current=latest.current;
   const oldId=label===PLATE_PHOTO_LABEL?current.intake.platePhotoId:current.intake.dashboardPhotoId;if(label===PLATE_PHOTO_LABEL)plateRequest.current?.abort();
   await onChange({photos:[...current.draft.photos.filter(v=>v.id!==oldId),p],intake:{...current.intake,version:1,...(label===PLATE_PHOTO_LABEL?{platePhotoId:p.id,observedPlate:undefined,plateConfirmedAt:undefined,plateMethod:undefined}:{dashboardPhotoId:p.id})}});
  }catch(e){setMessage((e as Error).message);}finally{photoLock.current=false;setPhotoBusy(false);}
 }
 async function readPlate(){
  if(!platePhoto?.data)return;plateRequest.current?.abort();const controller=new AbortController();plateRequest.current=controller;const sourceId=platePhoto.id;setPlateBusy(true);setMessage('');
  try{const response=await fetch('/api/ai/plate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:platePhoto.data}),signal:controller.signal}),value=await response.json();if(!response.ok)throw Error(value.error);if(controller.signal.aborted||latest.current.intake.platePhotoId!==sourceId)return;if(!value.plate){setMessage('A placa não ficou legível. Aproxime a câmera ou digite os sete caracteres.');return;}const vehicle=data.vehicles.find(v=>normalizePlate(v.plate)===value.plate);await patchIntake({observedPlate:value.plate,plateMethod:'ocr_confirmed',plateConfirmedAt:new Date().toISOString()});if(vehicle&&vehicle.id!==latest.current.draft.vehicleId)await onVehicle(vehicle.id);setMessage(vehicle?'Placa confirmada: '+vehicle.model+'.':'A placa lida não está cadastrada. Confira o veículo selecionado ou faça o cadastro.');}catch(e){if((e as Error).name!=='AbortError')setMessage((e as Error).message);}finally{if(plateRequest.current===controller)setPlateBusy(false);}
 }
 function captureGps(){
  setGpsBusy(true);setMessage('');if(!navigator.geolocation){void patchIntake({checkIn:{status:'unavailable',attemptedAt:new Date().toISOString(),reason:'unsupported',justification:''}});setGpsBusy(false);return;}
  navigator.geolocation.getCurrentPosition(position=>{const checkIn:GeoCheckIn={status:'captured',capturedAt:new Date(position.timestamp).toISOString(),lat:position.coords.latitude,lng:position.coords.longitude,accuracy:position.coords.accuracy};void patchIntake({checkIn});setMessage('Localização registrada com precisão aproximada de '+Math.round(position.coords.accuracy)+' m.');setGpsBusy(false);},error=>{const reason=error.code===1?'permission_denied':error.code===2?'position_unavailable':error.code===3?'timeout':'unknown';void patchIntake({checkIn:{status:'unavailable',attemptedAt:new Date().toISOString(),reason,justification:''}});setMessage('Não foi possível obter o GPS. Informe a justificativa para continuar.');setGpsBusy(false);},{enableHighAccuracy:true,timeout:15000,maximumAge:30000});
 }
 const observed=intake.observedPlate||'',matches=validPlate(observed)&&normalizePlate(observed)===normalizePlate(data.vehicles.find(v=>v.id===draft.vehicleId)?.plate||'');
 return <section className="intake-card" aria-label="Captura inicial">
  <div className="section-heading"><div><span className="eyebrow">CAPTURA INICIAL</span><h3>Placa, painel e localização</h3></div><Camera size={22}/></div><p className="helper">Esses registros identificam o veículo e o ponto do check-in. O GPS é pontual e não acompanha o trajeto.</p>
  <div className="intake-grid"><article><h4>1. Placa</h4>{platePhoto&&<PhotoView photo={platePhoto}/>}<label className="button secondary camera-label"><Camera size={15}/>{photoBusy?'Processando…':platePhoto?'Substituir':'Fotografar'} placa<input className="camera-input" type="file" accept="image/*" capture="environment" disabled={photoBusy} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void photo(file,PLATE_PHOTO_LABEL)}}/></label><button type="button" className="button secondary" disabled={photoBusy||!platePhoto||!platePhoto.data||!aiReady||!navigator.onLine||plateBusy} onClick={readPlate}>{plateBusy?<LoaderCircle className="spin" size={15}/>:<Sparkles size={15}/>} Ler placa com IA</button><Field label="Placa observada"><input autoCapitalize="characters" autoCorrect="off" spellCheck={false} value={formatPlate(observed)} maxLength={8} onChange={e=>void patchIntake({observedPlate:normalizePlate(e.target.value),plateConfirmedAt:undefined,plateMethod:undefined})}/></Field><button type="button" className="button primary small" disabled={!matches} onClick={()=>void patchIntake({plateMethod:intake.plateMethod==='ocr_confirmed'?'ocr_confirmed':'manual',plateConfirmedAt:new Date().toISOString()})}><Check size={14}/> Confirmar placa</button>{observed&&!matches&&<p className="fuel-error"><AlertTriangle size={13}/> A placa não corresponde ao veículo selecionado.</p>}</article>
   <article><h4>2. Painel</h4>{panelPhoto&&<PhotoView photo={panelPhoto}/>}<label className="button secondary camera-label"><Camera size={15}/>{photoBusy?'Processando…':panelPhoto?'Substituir':'Fotografar'} painel<input className="camera-input" type="file" accept="image/*" capture="environment" disabled={photoBusy} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void photo(file,'Painel e hodômetro')}}/></label><DashboardReader photo={panelPhoto} disabled={photoBusy||!aiReady||!navigator.onLine} onApply={async patch=>{await onChange(patch)}}/></article>
   <article><h4>3. Check-in GPS</h4><button type="button" className="button secondary" disabled={gpsBusy} onClick={captureGps}>{gpsBusy?<LoaderCircle className="spin" size={15}/>:<MapPin size={15}/>} {intake.checkIn?.status==='captured'?'Atualizar localização':'Capturar localização'}</button>{intake.checkIn?.status==='captured'?<p className="info-box">Registrado em {new Date(intake.checkIn.capturedAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}, precisão aproximada {Math.round(intake.checkIn.accuracy)} m.</p>:intake.checkIn?.status==='unavailable'&&<Field label="Por que o GPS não pôde ser registrado?"><textarea rows={3} minLength={10} maxLength={1000} value={intake.checkIn.justification} onChange={e=>void patchIntake({checkIn:{...intake.checkIn as Extract<GeoCheckIn,{status:'unavailable'}>,justification:e.target.value}})}/></Field>}</article></div>
  {message&&<p className="info-box" role="status">{message}</p>}
 </section>;
}
