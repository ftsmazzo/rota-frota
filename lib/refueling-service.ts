import type pg from 'pg';
import type {Refueling} from './fuel';
import {stationKey} from './fuel';
import {readData,canonical} from './server';
import {refuelingSchema} from './refueling-schema';
import {mediaExists} from './storage';
import {BusinessError} from './business-error';
export async function recordRefueling(client:pg.PoolClient,value:Refueling,actorId:string){
 await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[value.vehicleId]);
 const existing=await client.query('SELECT payload,created_at FROM refueling_records WHERE id=$1',[value.id]);
 if(existing.rowCount){if(canonical(refuelingSchema.parse(existing.rows[0].payload))!==canonical(refuelingSchema.parse(value)))throw new BusinessError('Este abastecimento já foi recebido com outros dados.');return {...existing.rows[0].payload,receivedAt:new Date(existing.rows[0].created_at).toISOString()} as Refueling;}
 const data=await readData(client),vehicle=data.vehicles.find(v=>v.id===value.vehicleId);if(!vehicle||!data.drivers.some(d=>d.id===value.driverId))throw new BusinessError('Selecione veículo e responsável cadastrados.',400);
 if(Date.parse(value.occurredAt)>Date.now()+600000)throw new BusinessError('O abastecimento não pode estar no futuro.',400);
 const expected=Math.round(Math.round(value.liters*1000)*Math.round(value.unitPrice*1000)/10000)-Math.round(value.discount*100);
 if(Math.abs(expected-Math.round(value.totalPaid*100))>5)throw new BusinessError('Confira litros, preço por litro, desconto e total do combustível. A diferença é maior que R$ 0,05.',400);
 const records=(data.refuelings||[]).filter(r=>r.vehicleId===value.vehicleId&&!r.voided);
 if(records.some(r=>r.odometer===value.odometer&&r.fuelType===value.fuelType&&r.liters===value.liters&&r.totalPaid===value.totalPaid&&stationKey(r)===stationKey(value)&&Math.abs(Date.parse(r.occurredAt)-Date.parse(value.occurredAt))<600000))throw new BusinessError('Há um abastecimento semelhante neste horário. Confira o histórico para evitar duplicação.');
 const readings=[...data.inspections.filter(i=>i.vehicleId===value.vehicleId).map(i=>({at:i.finishedAt,odometer:i.odometer})),...records.map(r=>({at:r.occurredAt,odometer:r.odometer}))];
 const before=readings.filter(r=>r.at<=value.occurredAt),after=readings.filter(r=>r.at>=value.occurredAt);
 if(before.some(r=>r.odometer>value.odometer)||after.some(r=>r.odometer<value.odometer)||!readings.length&&value.odometer<vehicle.odometer)throw new BusinessError('O hodômetro não é coerente com os registros anteriores ou posteriores deste veículo.',400);
 for(const p of value.photos)if(p.url!=='/api/media/'+p.id||!await mediaExists(p.id,client,actorId))throw new BusinessError('Uma foto ainda não foi recebida por este usuário. O abastecimento permanece no aparelho.',400);
 const result=await client.query('INSERT INTO refueling_records(id,vehicle_id,driver_id,recorded_by,occurred_at,payload) VALUES($1,$2,$3,$4,$5,$6) RETURNING created_at',[value.id,value.vehicleId,value.driverId,actorId,value.occurredAt,JSON.stringify(value)]);
 await client.query("UPDATE fleet_records SET payload=jsonb_set(jsonb_set(payload,'{odometerBase}',COALESCE(payload->'odometerBase',payload->'odometer','0'::jsonb)),'{odometer}',to_jsonb(GREATEST(COALESCE((payload->>'odometer')::numeric,0),$2::numeric))),updated_at=now(),revision=revision+1 WHERE id=$1 AND kind='vehicle'",[value.vehicleId,value.odometer]);
 await client.query("INSERT INTO audit_events(actor_id,action,entity_id) VALUES($1,'refueling.created',$2)",[actorId,value.id]);return {...value,receivedAt:new Date(result.rows[0].created_at).toISOString()};
}
export async function voidRefueling(client:pg.PoolClient,id:string,reason:string,actorId:string){
 const source=await client.query('SELECT vehicle_id FROM refueling_records WHERE id=$1',[id]);if(!source.rowCount)throw new BusinessError('Abastecimento não encontrado.',404);
 await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[source.rows[0].vehicle_id]);
 const result=await client.query('UPDATE refueling_records SET voided_at=now(),voided_by=$2,void_reason=$3 WHERE id=$1 AND voided_at IS NULL RETURNING id',[id,actorId,reason]);
 if(!result.rowCount)throw new BusinessError('Este registro já está anulado.');
 await client.query("INSERT INTO audit_events(actor_id,action,entity_id,details) VALUES($1,'refueling.voided',$2,$3)",[actorId,id,JSON.stringify({reason})]);
 const data=await readData(client),vehicle=data.vehicles.find(v=>v.id===source.rows[0].vehicle_id)!;
 const base=(vehicle as typeof vehicle&{odometerBase?:number}).odometerBase??vehicle.odometer;
 const odometer=Math.max(base,...data.inspections.filter(i=>i.vehicleId===vehicle.id).map(i=>i.odometer),...(data.refuelings||[]).filter(r=>r.vehicleId===vehicle.id&&!r.voided).map(r=>r.odometer));
 await client.query("UPDATE fleet_records SET payload=jsonb_set(payload,'{odometer}',to_jsonb($2::numeric)),updated_at=now(),revision=revision+1 WHERE id=$1",[vehicle.id,odometer]);
 return data.refuelings!.find(r=>r.id===id)!;
}
