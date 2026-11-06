import {z} from 'zod';
import {authorize} from '../../../../lib/auth';
import {db,isSameOrigin,jsonError} from '../../../../lib/server';
import {confirmTripLink} from '../../../../lib/trip-service';
import {BusinessError} from '../../../../lib/business-error';
const input=z.object({departureId:z.string().min(1).max(100),returnId:z.string().min(1).max(100),note:z.string().trim().min(10).max(2000)});
export async function POST(request:Request){
 if(!isSameOrigin(request))return jsonError('Origem inválida.',403);const user=await authorize(request,{admin:true});if(user instanceof Response)return user;
 const parsed=input.safeParse(await request.json().catch(()=>null));if(!parsed.success)return jsonError('Selecione saída, retorno e o motivo da conferência.',400);
 const client=await db().connect();
 try{
   await client.query('BEGIN');const link=await confirmTripLink(client,parsed.data,user);
   await client.query('COMMIT');return Response.json({ok:true,link},{headers:{'Cache-Control':'no-store'}});
 }catch(error){await client.query('ROLLBACK').catch(()=>{});return jsonError(error instanceof BusinessError?error.message:'Não foi possível registrar o vínculo.',error instanceof BusinessError?error.status:503);}
 finally{client.release();}
}
