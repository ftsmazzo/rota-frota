import {z} from 'zod';
import {authorize} from '../../../../lib/auth';
import {db,jsonError,isSameOrigin} from '../../../../lib/server';

const input=z.object({inspectionId:z.string().min(1).max(100),findingId:z.string().min(1).max(100),note:z.string().trim().min(10).max(2000)});
export async function POST(request:Request){
  if(!isSameOrigin(request))return jsonError('Origem inválida.',403);
  const user=await authorize(request,{admin:true});if(user instanceof Response)return user;
  const value=input.safeParse(await request.json().catch(()=>null));
  if(!value.success)return jsonError('Descreva a conferência realizada com pelo menos 10 caracteres.',400);
  const client=await db().connect();
  try{
    await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[value.data.inspectionId]);
    const {rows}=await client.query("SELECT payload FROM fleet_records WHERE id=$1 AND kind='inspection'",[value.data.inspectionId]);
    if(!rows[0]?.payload.findings.some((f:{id:string})=>f.id===value.data.findingId)){await client.query('ROLLBACK');return jsonError('Apontamento não encontrado.',404);}
    await client.query('ROLLBACK');return jsonError('Atualize o aplicativo para acompanhar avaliação, reparo e conferência final. Nenhum apontamento foi concluído.',409);
  }catch{await client.query('ROLLBACK').catch(()=>{});return jsonError('Não foi possível concluir o apontamento. Tente novamente.',503);}
  finally{client.release();}
}
