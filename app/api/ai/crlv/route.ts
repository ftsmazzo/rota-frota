import {z} from 'zod';
import {authorize} from '../../../../lib/auth';
import {acquireAiCapacity} from '../../../../lib/ai-rate-limit';
import {isSameOrigin,jsonError,readJsonBody} from '../../../../lib/server';
import {readVehicleImage,validImageData} from '../../../../lib/vehicle-intelligence';
const input=z.object({image:z.string().min(32).max(6000000).regex(/^data:image\/(jpeg|png|webp);base64,/),consent:z.literal(true)}); 
export async function POST(request:Request){
 if(!isSameOrigin(request))return jsonError('Origem inválida.',403);const user=await authorize(request,{admin:true});if(user instanceof Response)return user;
 if(!process.env.OPENROUTER_API_KEY)return jsonError('A leitura por IA não está configurada.',503);const release=acquireAiCapacity(user.id);if(!release)return jsonError('Muitas leituras em sequência. Aguarde um minuto.',429);
 try{let body:unknown;try{body=await readJsonBody(request,6100000);}catch{return jsonError('A imagem excede o limite de leitura.',413);}const parsed=input.safeParse(body);if(!parsed.success||!validImageData(parsed.data.image))return jsonError('Envie uma foto válida do documento.',400);
  try{return Response.json(await readVehicleImage('document',parsed.data.image,{apiKey:process.env.OPENROUTER_API_KEY,model:process.env.OPENROUTER_VISION_MODEL||process.env.OPENROUTER_MODEL,signal:request.signal}),{headers:{'Cache-Control':'no-store'}});}catch(e){return jsonError((e as Error).message,502);}
 }finally{release();}
}
