"use client";
import {useEffect,useRef,useState} from 'react';
import {AlertTriangle,Check,LoaderCircle,Sparkles} from 'lucide-react';
import type {DashboardReading} from '../lib/dashboard-reader';
import {readPhoto} from '../lib/offline';
import {dashboardErrorMessage} from '../lib/dashboard-errors';
import {fuelLabel,km,type Draft,type Photo} from '../lib/model';

export function DashboardReader({photo,disabled,onApply}:{photo?:Photo;disabled:boolean;onApply:(patch:Partial<Pick<Draft,'odometer'|'fuel'>>)=>Promise<void>}){
  const [reading,setReading]=useState(false),[applying,setApplying]=useState(false),[result,setResult]=useState<DashboardReading>(),[error,setError]=useState(''),[applied,setApplied]=useState(false);
  const controller=useRef<AbortController|null>(null),active=useRef(true);
  useEffect(()=>{active.current=true;return()=>{active.current=false;controller.current?.abort();}},[]);
  useEffect(()=>{controller.current?.abort();setResult(undefined);setError('');setApplied(false);setReading(false);},[photo?.id,photo?.data,photo?.url]);
  async function read(){
    if(reading)return;
    setError('');setResult(undefined);setApplied(false);
    if(!photo||photo.demoSlot!==undefined){setError('Adicione uma foto real do painel, com o hodômetro visível, antes de iniciar a leitura.');return;}
    const current=new AbortController();controller.current=current;setReading(true);
    let timedOut=false;
    const timer=window.setTimeout(()=>{timedOut=true;current.abort();},55000);
    try{
      let image=photo.data;
      if(!image&&photo.url?.startsWith('/api/media/')){
        const downloaded=await fetch(photo.url,{signal:current.signal});if(!downloaded.ok)throw Error('Não foi possível abrir a foto salva. Adicione a foto novamente.');
        const blob=await downloaded.blob();image=await readPhoto(new File([blob],'painel.jpg',{type:blob.type}));
      }
      if(!image)throw Error('A foto não está disponível neste aparelho. Adicione a foto novamente.');
      const response=await fetch('/api/ai/dashboard',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image}),signal:current.signal});
      const data=await response.json().catch(()=>null);
      if(!response.ok)throw Error(data?.error||(response.status===413?'A foto é muito grande para leitura. Adicione a foto novamente.':'O serviço de leitura não respondeu corretamente. Tente novamente.'));
      if(!data||typeof data.text!=='string'||!(data.odometer===null||Number.isInteger(data.odometer))||!(data.fuel===null||Number.isInteger(data.fuel)))throw Error('A leitura chegou incompleta. Tente novamente.');
      if(active.current&&!current.signal.aborted)setResult(data);
    }catch(e){if(active.current&&(!current.signal.aborted||timedOut))setError(timedOut?'A leitura demorou além do esperado. Tente novamente com o aplicativo aberto.':dashboardErrorMessage(e));}
    finally{window.clearTimeout(timer);if(active.current&&controller.current===current)setReading(false);}
  }
  const hasValues=result&&(result.odometer!==null||result.fuel!==null);
  return <section className="dashboard-reader" aria-label="Leitura do painel">
    <button type="button" className="button secondary small" onClick={read} disabled={disabled||reading||applying}>
      {reading?<LoaderCircle size={14} className="spin"/>:<Sparkles size={14}/>}{reading?'Lendo painel…':error?'Tentar leitura novamente':result?'Ler painel novamente':'Ler painel com IA'}
    </button>
    <div aria-live="polite">
      {reading&&<p className="helper dashboard-reading-progress" role="status">Analisando a foto do hodômetro e do combustível. Mantenha o aplicativo aberto; a leitura pode levar alguns segundos.</p>}
      {error&&<div className="error-banner dashboard-reading-error" role="alert"><AlertTriangle size={17}/><div><strong>Não foi possível concluir a leitura.</strong><p>{error}</p><p>A foto e os valores atuais foram preservados.</p></div></div>}
      {result&&<div className="info-box ocr-result"><div><strong>{hasValues?'Confira a leitura sugerida':result.odometerDisplay?'Confira o número exibido no visor.':'Não foi possível identificar os números nesta foto.'}</strong><p>{result.text}</p>
        {hasValues?<span>{result.odometer!==null?km(result.odometer):result.odometerDisplay?'Quilometragem exige conferência':'Hodômetro não identificado'} · {result.fuel!==null?fuelLabel(result.fuel):'Combustível não identificado'}</span>:!result.odometerDisplay&&<p>Use uma foto mais próxima, com o painel aceso, nítido e sem reflexos, ou preencha os campos manualmente. Os valores atuais foram mantidos.</p>}
      </div>{hasValues&&!applied&&<button type="button" className="button primary small" disabled={disabled||applying} onClick={async()=>{setApplying(true);try{await onApply({...result.odometer!==null?{odometer:result.odometer}:{},...result.fuel!==null?{fuel:result.fuel}:{}});setApplied(true);}finally{setApplying(false);}}}>{applying?<LoaderCircle size={14} className="spin"/>:<Check size={14}/>} {result.odometer===null?'Confirmar combustível':result.fuel===null?'Confirmar quilometragem':'Confirmar leitura'}</button>}{applied&&<span className="dashboard-reading-applied"><Check size={15}/> {result.odometer===null?'Combustível aplicado ao rascunho':result.fuel===null?'Quilometragem aplicada ao rascunho':'Leitura aplicada ao rascunho'}</span>}</div>}
    </div>
  </section>;
}
