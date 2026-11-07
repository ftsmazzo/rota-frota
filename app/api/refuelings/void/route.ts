import {z} from 'zod';
import {authorize} from '../../../../lib/auth';
import {db,isSameOrigin,jsonError} from '../../../../lib/server';
import {voidRefueling} from '../../../../lib/refueling-service';
import {BusinessError} from '../../../../lib/business-error';
export async function POST(request:Request){
 if(!isSameOrigin(request))return jsonError('Origem inválida.',403);const user=await authorize(request,{admin:true});if(user instanceof Response)return user;
 const parsed=z.object({id:z.string().uuid(),reason:z.string().trim().min(10).max(1000)}).safeParse(await request.json().catch(()=>null));if(!parsed.success)return jsonError('Informe o registro e o motivo da anulação.',400);
 const client=await db().connect();try{await client.query('BEGIN');const refueling=await voidRefueling(client,parsed.data.id,parsed.data.reason,user.id);await client.query('COMMIT');return Response.json({refueling});}catch(e){await client.query('ROLLBACK').catch(()=>{});return jsonError(e instanceof BusinessError?e.message:'Não foi possível anular o registro.',e instanceof BusinessError?e.status:503);}finally{client.release();}
}
