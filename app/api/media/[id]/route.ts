import fs from 'node:fs/promises';
import {authorize} from '../../../../lib/auth';
import {db,safeId,jsonError} from '../../../../lib/server';
import {mediaPath} from '../../../../lib/storage';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){const user=await authorize(request);if(user instanceof Response)return user;const {id}=await params;if(!safeId(id))return jsonError('Foto inválida.',400);try{const {rows}=await db().query('SELECT mime_type FROM uploaded_media WHERE id=$1',[id]);if(!rows[0])return jsonError('Foto não encontrada.',404);return new Response(new Uint8Array(await fs.readFile(mediaPath(id))),{headers:{'Content-Type':rows[0].mime_type,'Cache-Control':'private,max-age=3600','X-Content-Type-Options':'nosniff'}})}catch{return jsonError('Foto não encontrada.',404)}}
