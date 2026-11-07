import {z} from 'zod';
import {authorize} from '../../../../lib/auth';
import {isSameOrigin,jsonError,readJsonBody} from '../../../../lib/server';
import {extractForm} from '../../../../lib/ai-forms';
import {acquireAiCapacity} from '../../../../lib/ai-rate-limit';
export async function POST(request:Request){
 if(!isSameOrigin(request))return jsonError('Origem inválida.',403);const user=await authorize(request);if(user instanceof Response)return user;
 const release=acquireAiCapacity(user.id);if(!release)return jsonError('Muitas interpretações em sequência. Aguarde um minuto e tente novamente.',429);
 try{
  let body:unknown;try{body=await readJsonBody(request,8_500_000);}catch{return jsonError('A imagem excede o limite de leitura.',413);}
  const parsed=z.object({kind:z.enum(['inspection','fuel']),text:z.string().min(3).max(12000).optional(),image:z.string().regex(/^data:image\/(jpeg|png|webp);base64,/).max(8000000).optional()}).safeParse(body);
  if(!parsed.success||!parsed.data.text&&!parsed.data.image||parsed.data.kind==='inspection'&&!parsed.data.text)return jsonError('Envie um relato ou uma foto de cupom válida.',400);
  try{return Response.json({proposal:await extractForm(parsed.data.kind,parsed.data)},{headers:{'Cache-Control':'no-store'}});}catch{return jsonError('Não foi possível interpretar os dados agora. A gravação e o rascunho permanecem no aparelho. Tente novamente.',502);}
 }finally{release();}
}
