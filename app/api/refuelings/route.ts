import {authorize} from '../../../lib/auth';
import {db,isSameOrigin,jsonError,readJsonBody} from '../../../lib/server';
import {refuelingSchema} from '../../../lib/refueling-schema';
import {recordRefueling} from '../../../lib/refueling-service';
import {BusinessError} from '../../../lib/business-error';
export async function POST(request:Request){
 if(!isSameOrigin(request))return jsonError('Origem inválida.',403);const user=await authorize(request);if(user instanceof Response)return user;
 let body:unknown;try{body=await readJsonBody(request,500_000);}catch{return jsonError('O registro de abastecimento excede o limite permitido.',413);}
 const parsed=refuelingSchema.safeParse(body);if(!parsed.success)return jsonError('Confira os dados do abastecimento: valores, data, veículo e responsável.',400);
 const client=await db().connect();try{await client.query('BEGIN');const refueling=await recordRefueling(client,parsed.data,user.id);await client.query('COMMIT');return Response.json({refueling},{headers:{'Cache-Control':'no-store'}});}catch(e){await client.query('ROLLBACK').catch(()=>{});return jsonError(e instanceof BusinessError?e.message:'Não foi possível receber o abastecimento.',e instanceof BusinessError?e.status:503);}finally{client.release();}
}
