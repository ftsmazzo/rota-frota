import type pg from 'pg';
import {readData,canonical} from './server';
import {inspectionSchema} from './inspection-schema';
import {getVehicleState,validateInspection,type Inspection} from './model';
import {getActiveDeparture,latestOdometer} from './trips';
import {mediaExists} from './storage';
import {BusinessError} from './business-error';
const EVIDENCE_V2_ROLLOUT='2026-11-08T00:00:00-03:00';

export async function recordInspection(client:pg.PoolClient,inspection:Inspection,actorId:string){
 await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[inspection.vehicleId]);
 const existing=await client.query("SELECT payload FROM fleet_records WHERE id=$1 AND kind='inspection'",[inspection.id]);
 if(existing.rowCount){if(canonical(inspectionSchema.parse(existing.rows[0].payload))!==canonical(inspectionSchema.parse(inspection)))throw new BusinessError('Este registro já foi confirmado com outros dados. O original foi preservado.');return {inspection:existing.rows[0].payload as Inspection,existing:true};}
 if(inspection.evidenceVersion!==2&&Date.parse(inspection.startedAt)>=Date.parse(EVIDENCE_V2_ROLLOUT))throw new BusinessError('Atualize o aplicativo antes de enviar esta vistoria. As avarias novas exigem evidências individuais.',400);
 const data=await readData(client),vehicle=data.vehicles.find(v=>v.id===inspection.vehicleId);
 if(!vehicle||!data.drivers.some(d=>d.id===inspection.driverId))throw new BusinessError('Veículo ou motorista não encontrado.',400);
 const errors=validateInspection(inspection,data.inspections);if(errors.length)throw new BusinessError(errors.join(' '),400);
 const history=data.inspections.filter(i=>i.vehicleId===vehicle.id).sort((a,b)=>b.finishedAt.localeCompare(a.finishedAt)),active=getActiveDeparture(vehicle.id,data.inspections);
 if(inspection.finishedAt<inspection.startedAt||Date.parse(inspection.finishedAt)>Date.now()+600000)throw new BusinessError('Confira a data e a hora do aparelho antes de enviar.',400);
 if(history[0]&&inspection.finishedAt<history[0].finishedAt)throw new BusinessError('Há uma vistoria mais recente deste veículo. Solicite a conferência do administrador.');
 if(inspection.odometer<latestOdometer(vehicle,data.inspections))throw new BusinessError('A quilometragem é menor que a última leitura registrada para este veículo.',400);
 if(inspection.kind==='departure'){
   if(active)throw new BusinessError('Este veículo já possui uma saída aberta. Registre o retorno antes de iniciar outra utilização.');
   if(getVehicleState(vehicle,data.inspections)!=='available')throw new BusinessError('O veículo possui uma pendência de avaliação ou reparo e não está disponível para nova saída.');
   if(inspection.previousId)throw new BusinessError('Uma saída não pode ser vinculada como retorno.',400);
 }else{
   if(!inspection.previousId||!active||active.id!==inspection.previousId)throw new BusinessError('Vincule o retorno à saída que está aberta para este veículo.');
   if(inspection.finishedAt<active.finishedAt)throw new BusinessError('O retorno não pode ser anterior à saída.',400);
 }
 for(const photo of inspection.photos)if(photo.url!=='/api/media/'+photo.id||!await mediaExists(photo.id,client))throw new BusinessError('Uma foto ainda não foi recebida. O registro permanece no aparelho.',400);
 const stored={...inspection,receivedAt:new Date().toISOString()};
 await client.query("INSERT INTO fleet_records(id,kind,payload,updated_at,revision) VALUES($1,'inspection',$2,now(),1)",[inspection.id,JSON.stringify(stored)]);
 if(inspection.kind==='return')await client.query('INSERT INTO trip_links(return_id,departure_id,note,actor_id) VALUES($1,$2,$3,$4)',[inspection.id,inspection.previousId,'Vínculo registrado no retorno.',actorId]);
 await client.query("UPDATE fleet_records SET payload=jsonb_set(payload,'{odometer}',to_jsonb(GREATEST(COALESCE((payload->>'odometer')::numeric,0),$2::numeric))),updated_at=now(),revision=revision+1 WHERE id=$1 AND kind='vehicle'",[vehicle.id,inspection.odometer]);
 await client.query("INSERT INTO audit_events(actor_id,action,entity_id) VALUES($1,'inspection.created',$2)",[actorId,inspection.id]);
 return {inspection:stored,existing:false};
}
