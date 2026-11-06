import {authorize} from '../../../lib/auth';
import {db,isSameOrigin,jsonError} from '../../../lib/server';
import {inspectionSchema} from '../../../lib/inspection-schema';
import {recordInspection} from '../../../lib/inspection-service';
import {BusinessError} from '../../../lib/business-error';
export async function POST(request:Request){
 const user=await authorize(request);if(user instanceof Response)return user;
 if(!isSameOrigin(request))return jsonError('Origem inválida.',403);
 if(Number(request.headers.get('content-length'))>1500000)return jsonError('Registro excede o limite.',413);
 const parsed=inspectionSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return jsonError('Revise os dados da vistoria antes de enviar.',400);
 const client=await db().connect();
 try{await client.query('BEGIN');const result=await recordInspection(client,parsed.data,user.id);await client.query('COMMIT');return Response.json({inspection:result.inspection},{status:result.existing?200:201,headers:{'Cache-Control':'no-store'}});}
 catch(error){await client.query('ROLLBACK').catch(()=>{});return jsonError(error instanceof BusinessError?error.message:'Falha ao receber a vistoria. Ela permanece salva neste aparelho.',error instanceof BusinessError?error.status:503);}
 finally{client.release();}
}
