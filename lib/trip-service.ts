import type pg from 'pg';
import {readData} from './server';
import {isTripPair} from './trips';
import {BusinessError} from './business-error';

export async function confirmTripLink(client:pg.PoolClient,value:{departureId:string;returnId:string;note:string},actor:{id:string;name:string}){
 const source=await client.query("SELECT payload FROM fleet_records WHERE id=$1 AND kind='inspection'",[value.returnId]);
 if(!source.rowCount)throw new BusinessError('Retorno não encontrado.',404);
 await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[source.rows[0].payload.vehicleId]);
 const data=await readData(client),departure=data.inspections.find(i=>i.id===value.departureId),returned=data.inspections.find(i=>i.id===value.returnId)!;
 if(!isTripPair(departure,returned))throw new BusinessError('O vínculo exige o mesmo veículo, saída anterior ao retorno e quilometragem coerente.',400);
 if(data.inspections.some(i=>i.id!==returned.id&&i.kind==='return'&&i.previousId===departure!.id))throw new BusinessError('Esta saída já possui outro retorno vinculado.');
 const taken=await client.query('SELECT return_id FROM trip_links WHERE departure_id=$1 AND return_id<>$2',[departure!.id,returned.id]);
 if(taken.rowCount)throw new BusinessError('Esta saída já está vinculada a outro retorno.');
 const linked=await client.query('INSERT INTO trip_links(return_id,departure_id,note,actor_id,corrected) VALUES($1,$2,$3,$4,true) ON CONFLICT(return_id) DO UPDATE SET departure_id=excluded.departure_id,note=excluded.note,actor_id=excluded.actor_id,corrected=true,created_at=now() RETURNING created_at',[returned.id,departure!.id,value.note,actor.id]);
 await client.query("INSERT INTO audit_events(actor_id,action,entity_id,details) VALUES($1,'trip.link_confirmed',$2,$3)",[actor.id,returned.id,JSON.stringify({departureId:departure!.id,note:value.note,originalPreviousId:source.rows[0].payload.previousId||null})]);
 return {departureId:departure!.id,returnId:returned.id,note:value.note,at:new Date(linked.rows[0].created_at).toISOString(),actor:actor.name,originalPreviousId:source.rows[0].payload.previousId};
}
