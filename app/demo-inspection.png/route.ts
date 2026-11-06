import fs from 'node:fs/promises';
import path from 'node:path';
import {dataDirectory} from '../../lib/storage';
export async function GET(){try{return new Response(await fs.readFile(path.join(dataDirectory,'demo-inspection.png')),{headers:{'Content-Type':'image/png','Cache-Control':'public,max-age=86400'}})}catch{return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024"><rect width="100%" height="100%" fill="#e6eedd"/><text x="768" y="512" text-anchor="middle" fill="#738466" font-family="Arial" font-size="26">Fotos demonstrativas em preparação</text></svg>',{headers:{'Content-Type':'image/svg+xml','Cache-Control':'no-store'}})}}
