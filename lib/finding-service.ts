import type pg from 'pg';
import {readData} from './server';
import {BusinessError} from './business-error';
import {FINDING_TRANSITIONS} from './workflow';
import type {FindingStatus} from './model';

export type FindingUpdate={id:string;inspectionId:string;findingId:string;status:FindingStatus;note:string;expectedEventId:string|null;confirmed?:boolean};
export async function recordFindingEvent(client:pg.PoolClient,value:FindingUpdate,actorId:string){
 const source=await client.query("SELECT payload FROM fleet_records WHERE id=$1 AND kind='inspection'",[value.inspectionId]);
 if(!source.rows[0]?.payload.findings.some((f:{id:string})=>f.id===value.findingId))throw new BusinessError('Apontamento não encontrado.',404);
 await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[source.rows[0].payload.vehicleId]);
 await client.query("INSERT INTO finding_events(id,inspection_id,finding_id,status,note,actor_id,legacy,created_at) SELECT r.id,r.inspection_id,r.finding_id,'closed',r.note,r.resolved_by,true,r.created_at FROM finding_resolutions r WHERE r.inspection_id=$1 AND r.finding_id=$2 AND NOT EXISTS(SELECT 1 FROM finding_events e WHERE e.inspection_id=r.inspection_id AND e.finding_id=r.finding_id) ON CONFLICT(id) DO NOTHING",[value.inspectionId,value.findingId]);
 const duplicate=await client.query('SELECT * FROM finding_events WHERE id=$1',[value.id]);
 if(duplicate.rowCount){const e=duplicate.rows[0];if(e.inspection_id!==value.inspectionId||e.finding_id!==value.findingId||e.status!==value.status||e.note!==value.note||e.actor_id!==actorId)throw new BusinessError('Esta atualização já foi recebida com outros dados.');}
 else{
   const last=await client.query('SELECT id,status FROM finding_events WHERE inspection_id=$1 AND finding_id=$2 ORDER BY sequence DESC LIMIT 1',[value.inspectionId,value.findingId]);
   const head=last.rows[0],current:FindingStatus=head?.status||(source.rows[0].payload.findings.find((f:{id:string})=>f.id===value.findingId)?.resolved?'closed':'identified');
   if((head?.id||null)!==value.expectedEventId)throw new BusinessError('O apontamento foi atualizado por outra pessoa. Atualize os dados antes de continuar.');
   if(!FINDING_TRANSITIONS[current].includes(value.status))throw new BusinessError('Essa etapa não está disponível a partir da situação atual.');
   if(value.status==='closed'&&!value.confirmed)throw new BusinessError('Confirme a conferência final antes de concluir o apontamento.',400);
   await client.query('INSERT INTO finding_events(id,inspection_id,finding_id,status,note,actor_id) VALUES($1,$2,$3,$4,$5,$6)',[value.id,value.inspectionId,value.findingId,value.status,value.note,actorId]);
   await client.query("INSERT INTO audit_events(actor_id,action,entity_id,details) VALUES($1,'finding.status_changed',$2,$3)",[actorId,value.inspectionId,JSON.stringify({findingId:value.findingId,status:value.status,eventId:value.id})]);
 }
 const data=await readData(client);return data.inspections.find(i=>i.id===value.inspectionId)!.findings.find(f=>f.id===value.findingId)!;
}
