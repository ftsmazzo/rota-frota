import fs from 'node:fs/promises';
import path from 'node:path';
import {createReadStream} from 'node:fs';
import {Readable} from 'node:stream';
import {authorize} from '../../../../lib/auth';
import {jsonError,isSameOrigin} from '../../../../lib/server';
import {dataDirectory} from '../../../../lib/storage';
import {createBackup} from '../../../../scripts/backup.mjs';
export const dynamic='force-dynamic';
export async function GET(request:Request){const user=await authorize(request,{admin:true});if(user instanceof Response)return user;const url=new URL(request.url);try{const files=(await fs.readdir(path.join(dataDirectory,'backups'))).filter(n=>/^rota-photos-\d{4}-\d{2}-\d{2}\.tar\.gz$/.test(n)).sort().reverse();if(url.searchParams.get('download')==='latest'){if(!files[0])return jsonError('Nenhum backup disponível ainda.',404);const file=path.join(dataDirectory,'backups',files[0]);return new Response(Readable.toWeb(createReadStream(file)) as ReadableStream,{headers:{'Content-Type':'application/gzip','Content-Disposition':`attachment; filename="${files[0]}"`,'Cache-Control':'no-store'}})}return Response.json({files})}catch{return Response.json({files:[]})}}
export async function POST(request:Request){if(!isSameOrigin(request))return jsonError('Origem inválida.',403);const user=await authorize(request,{admin:true});if(user instanceof Response)return user;try{const file=await createBackup(true);return Response.json({ok:!!file})}catch{return jsonError('Não foi possível concluir o backup. Tente novamente.',503)}}
