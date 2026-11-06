import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {authorize} from '../../../../lib/auth';
import {isSameOrigin,jsonError} from '../../../../lib/server';
import {DashboardReadError,readDashboardImage} from '../../../../lib/dashboard-reader';

const input=z.object({image:z.string().min(32).max(6000000).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/)});
export async function POST(request:Request){
  const user=await authorize(request);if(user instanceof Response)return user;
  if(!isSameOrigin(request))return jsonError('Origem inválida.',403);
  if(!process.env.OPENROUTER_API_KEY)return jsonError('A conexão da IA ainda não foi configurada. Avise o administrador.',503);
  if(Number(request.headers.get('content-length'))>6100000)return jsonError('A foto é muito grande para leitura. Tente adicionar a foto novamente.',413);
  const parsed=input.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return jsonError('Escolha uma foto válida do painel para fazer a leitura.',400);
  const requestId=randomUUID(),started=Date.now();
  try{
    const result=await readDashboardImage(parsed.data.image,{
      apiKey:process.env.OPENROUTER_API_KEY,
      model:process.env.OPENROUTER_VISION_MODEL||process.env.OPENROUTER_MODEL,
      signal:request.signal,
    });
    console.info(JSON.stringify({event:'dashboard_read_completed',requestId,ms:Date.now()-started,odometerRead:result.odometer!==null,fuelRead:result.fuel!==null}));
    return Response.json(result,{headers:{'Cache-Control':'no-store'}});
  }catch(error){
    const failure=error instanceof DashboardReadError?error:new DashboardReadError('AI_INTERRUPTED','A leitura foi interrompida. A foto permanece salva; tente novamente.',502);
    console.error(JSON.stringify({event:'dashboard_read_failed',requestId,code:failure.code,status:failure.status,ms:Date.now()-started}));
    return Response.json({error:failure.message,code:failure.code,requestId},{status:failure.status,headers:{'Cache-Control':'no-store'}});
  }
}
