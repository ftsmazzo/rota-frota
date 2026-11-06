import {currentUser} from '../../../../lib/auth';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const user=await currentUser(request);return Response.json({user},{status:user?200:401,headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Serviço de acesso indisponível.'},{status:503})}}
