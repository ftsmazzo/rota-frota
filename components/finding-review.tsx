"use client";
import {useRef,useState} from 'react';
import {CheckCircle2,ClipboardCheck,FileText,LoaderCircle} from 'lucide-react';
import {Badge,Field,Modal} from './common';
import {dateTime,getVehicleState,openVehicleFindings,type Finding,type FindingStatus,type Inspection,type Vehicle} from '../lib/model';
import {findingStatus,FINDING_STATUS_LABELS,FINDING_TRANSITIONS} from '../lib/workflow';

export function VehicleFindings({vehicle,inspections,onReview}:{vehicle:Vehicle;inspections:Inspection[];onReview:(inspection:Inspection,finding:Finding)=>void}){
 const [visible,setVisible]=useState(10),pending=openVehicleFindings(vehicle.id,inspections);
 const closed=inspections.filter(i=>i.vehicleId===vehicle.id).flatMap(inspection=>inspection.findings.filter(f=>findingStatus(f)==='closed').map(finding=>({inspection,finding}))).sort((a,b)=>(b.finding.resolution?.resolvedAt||b.inspection.finishedAt).localeCompare(a.finding.resolution?.resolvedAt||a.inspection.finishedAt));
 return <section className="vehicle-findings"><h3 className="small-title">Ocorrências do veículo</h3>
  {pending.length?<p className="helper">Acompanhe a avaliação, o reparo e a conferência final. Encaminhar para reparo mantém a ocorrência aberta.</p>:<div className="finding-complete"><CheckCircle2 size={18}/><span>Nenhuma ocorrência aberta.</span></div>}
  {pending.map(({inspection,finding})=><article className="pending-finding" key={inspection.id+'-'+finding.id}><span className="badge amber">{FINDING_STATUS_LABELS[findingStatus(finding)]}</span><strong>{finding.area}</strong><p>{finding.description}</p><small>Registrada em {dateTime(inspection.finishedAt)}</small><button className="button primary small" onClick={()=>onReview(inspection,finding)}><ClipboardCheck size={15}/> Atualizar acompanhamento</button></article>)}
  {!!closed.length&&<><h3 className="small-title">Ocorrências concluídas · {closed.length}</h3>{closed.slice(0,visible).map(({inspection,finding})=><article className="closed-finding" key={inspection.id+'-'+finding.id}><strong><CheckCircle2 size={15}/> {finding.area}</strong><p>{finding.resolution?.note||'Conferência registrada no histórico.'}</p>{finding.resolution&&<small>{finding.resolution.resolvedBy} · {dateTime(finding.resolution.resolvedAt)}</small>}<button className="text-button" onClick={()=>onReview(inspection,finding)}>Ver histórico ou reabrir</button></article>)}{visible<closed.length&&<button className="button secondary" onClick={()=>setVisible(n=>n+10)}>Carregar mais conclusões</button>}</>}
 </section>;
}

export function FindingReview({vehicle,inspection,finding,inspections,canResolve,online,onClose,onOpenReport,onChanged}:{vehicle:Vehicle;inspection:Inspection;finding:Finding;inspections:Inspection[];canResolve:boolean;online:boolean;onClose:()=>void;onOpenReport:()=>void;onChanged:(finding:Finding)=>Promise<void>}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[note,setNote]=useState(''),[target,setTarget]=useState<FindingStatus|''>('');
 const request=useRef<{signature:string;id:string}|undefined>(undefined);
 const status=findingStatus(finding),events=finding.events||[],head=events[events.length-1],closed=status==='closed';
 const projected=target?inspections.map(i=>i.id===inspection.id?{...i,findings:i.findings.map(f=>f.id===finding.id?{...f,status:target,resolved:target==='closed'}:f)}:i):inspections;
 return <Modal title="Acompanhamento da ocorrência" onClose={onClose}>
  <div className="finding-review-vehicle"><strong>{vehicle.model}</strong><span className="plate">{vehicle.plate}</span></div>
  <article className="pending-finding"><span className={'badge '+(closed?'green':'amber')}>{FINDING_STATUS_LABELS[status]}</span><strong>{finding.area}</strong><p>{finding.description}</p><small>Vistoria de {dateTime(inspection.finishedAt)}</small></article>
  {closed&&<div className="finding-complete"><CheckCircle2 size={20}/><p>A conferência foi concluída. O registro original e todas as atualizações continuam no histórico.</p></div>}
  {head?.legacy&&<div className="info-box">Esta conclusão veio do fluxo anterior. Se houve apenas encaminhamento para reparo, reabra a ocorrência abaixo para continuar o acompanhamento.</div>}
  <h3 className="small-title">Linha do tempo</h3><ol className="finding-timeline"><li><strong>Identificada</strong><p>{finding.description}</p><small>{inspection.inspectorName} · {dateTime(inspection.finishedAt)}</small></li>{events.map(event=><li key={event.id}><strong>{FINDING_STATUS_LABELS[event.status]}{event.legacy?' · fluxo anterior':''}</strong><p>{event.note}</p><small>{event.actor} · {dateTime(event.createdAt)}</small></li>)}</ol>
  {!canResolve?<div className="info-box">Um administrador registra as etapas de avaliação, reparo e conferência final. O histórico pode ser consultado por toda a equipe.</div>
  :<form onSubmit={async event=>{event.preventDefault();if(!target)return;setBusy(true);setError('');try{
    const values=new FormData(event.currentTarget),signature=JSON.stringify({target,note,head:head?.id||null});
    if(request.current?.signature!==signature)request.current={signature,id:crypto.randomUUID()};
    const response=await fetch('/api/findings/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:request.current.id,inspectionId:inspection.id,findingId:finding.id,status:target,note,expectedEventId:head?.id||null,confirmed:values.get('confirmed')==='on'})});
    const value=await response.json().catch(()=>null);if(!response.ok||!value?.finding)throw Error(value?.error||'Não foi possível salvar a atualização. Tente novamente.');
    await onChanged(value.finding);setNote('');setTarget('');request.current=undefined;
   }catch(e){setError((e as Error).message||'Falha de conexão. Tente novamente.');}finally{setBusy(false);}}}>
    <h3 className="small-title">{closed?'Reabrir acompanhamento':'Registrar próximo passo'}</h3>
    <Field label="Etapa"><select value={target} required onChange={e=>{setTarget(e.target.value as FindingStatus|'');setError('');}}><option value="">Selecione a próxima etapa</option>{FINDING_TRANSITIONS[status].map(next=><option key={next} value={next}>{FINDING_STATUS_LABELS[next]}</option>)}</select></Field>
    <Field label="O que foi realizado ou encaminhado?"><textarea required minLength={10} maxLength={2000} rows={4} value={note} onChange={e=>setNote(e.target.value)} placeholder="Registre a avaliação, o encaminhamento, o serviço executado ou a conferência final."/></Field>
    {target==='closed'&&<label className="resolution-confirm"><input type="checkbox" name="confirmed" required/><span>Confirmo que a correção ou avaliação foi concluída e que a conferência final foi realizada pelo responsável.</span></label>}
    {target&&<><div className="finding-next-status"><span>Veículo após esta atualização</span><Badge state={getVehicleState(vehicle,projected)}/></div>{target!=='closed'&&<p className="helper">A ocorrência continuará aberta. A utilização do veículo e o acompanhamento desta ocorrência são registros independentes.</p>}</>}
    {!online&&<div className="info-box">Conecte-se à internet para registrar a atualização.</div>}{error&&<div className="error-banner" role="alert">{error}</div>}
    <div className="modal-actions"><button type="button" className="button secondary" onClick={onOpenReport}><FileText size={15}/> Ver vistoria</button><button className="button primary" disabled={busy||!online||!target}>{busy?<LoaderCircle className="spin" size={16}/>:<ClipboardCheck size={16}/>} {target==='closed'?'Concluir conferência final':closed?'Reabrir ocorrência':'Registrar atualização'}</button></div>
  </form>}
 </Modal>;
}
