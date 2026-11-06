import {z} from 'zod';
import {authorize} from '../../../../lib/auth';
import {db,isSameOrigin,jsonError} from '../../../../lib/server';
import {recordFindingEvent} from '../../../../lib/finding-service';
import {BusinessError} from '../../../../lib/business-error';
const input=z.object({id:z.string().uuid(),inspectionId:z.string().min(1).max(100),findingId:z.string().min(1).max(100),status:z.enum(['identified','assessment','referred','repairing','repaired','closed']),note:z.string().trim().min(10).max(2000),expectedEventId:z.string().uuid().nullable(),confirmed:z.boolean().optional()});
export async function POST(request:Request){
 if(!isSameOrigin(request))return jsonError('Origem inválida.',403);const user=await authorize(request,{admin:true});if(user instanceof Response)return user;
 const parsed=input.safeParse(await request.json().catch(()=>null));if(!parsed.success)return jsonError('Escolha a etapa e descreva a atualização com pelo menos 10 caracteres.',400);
 const client=await db().connect();
 try{await client.query('BEGIN');const finding=await recordFindingEvent(client,parsed.data,user.id);await client.query('COMMIT');return Response.json({ok:true,finding},{headers:{'Cache-Control':'no-store'}});}
 catch(error){await client.query('ROLLBACK').catch(()=>{});return jsonError(error instanceof BusinessError?error.message:'Não foi possível registrar a atualização. Tente novamente.',error instanceof BusinessError?error.status:503);}
 finally{client.release();}
}
