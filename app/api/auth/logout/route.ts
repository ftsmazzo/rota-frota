import {db,isSameOrigin,jsonError} from '../../../../lib/server';
import {digest,sessionToken,cookie} from '../../../../lib/auth';
export async function POST(request:Request){if(!isSameOrigin(request))return jsonError('Origem inválida.',403);await db().query('DELETE FROM app_sessions WHERE token_hash=$1',[digest(sessionToken(request))]);return Response.json({ok:true},{headers:{'Set-Cookie':cookie('',0)}})}
