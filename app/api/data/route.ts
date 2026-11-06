import {readData,jsonError} from '../../../lib/server';
import {authorize} from '../../../lib/auth';
export const dynamic='force-dynamic';
export async function GET(request:Request){const user=await authorize(request);if(user instanceof Response)return user;try{return Response.json(await readData(),{headers:{'Cache-Control':'no-store'}})}catch{return jsonError('Não foi possível carregar os registros. Os dados locais continuam disponíveis.',503)}}
