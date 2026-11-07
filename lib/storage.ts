import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {db,safeId} from './server';
import type pg from 'pg';
export const dataDirectory=path.resolve(process.env.DATA_DIR||'.data');
export const mediaDirectory=path.join(dataDirectory,'uploads');
export function mediaPath(id:string){if(!safeId(id))throw Error('Identificador inválido.');return path.join(mediaDirectory,id)}
export async function saveMedia(id:string,bytes:Buffer,mime:string,userId:string){
 await fs.mkdir(mediaDirectory,{recursive:true});const hash=createHash('sha256').update(bytes).digest('hex');const previous=await db().query('SELECT sha256 FROM uploaded_media WHERE id=$1',[id]);
 if(previous.rows[0]){if(previous.rows[0].sha256!==hash)throw Error('Esta foto já foi recebida com outro conteúdo.');return}
 const temp=mediaPath(id)+'.'+randomUUID()+'.tmp';await fs.writeFile(temp,bytes,{flag:'wx',mode:0o600});try{await fs.rename(temp,mediaPath(id));await db().query('INSERT INTO uploaded_media(id,mime_type,byte_size,sha256,uploaded_by) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING',[id,mime,bytes.length,hash,userId])}finally{await fs.rm(temp,{force:true}).catch(()=>{})}
}
export async function mediaExists(id:string,queryable:Pick<pg.PoolClient,'query'>=db(),uploadedBy?:string){const result=await queryable.query('SELECT id FROM uploaded_media WHERE id=$1 AND ($2::uuid IS NULL OR uploaded_by=$2)',[id,uploadedBy||null]);if(!result.rowCount)return false;try{await fs.access(mediaPath(id));return true}catch{return false}}
