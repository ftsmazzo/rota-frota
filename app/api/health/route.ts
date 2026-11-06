import fs from 'node:fs/promises';
import {db} from '../../../lib/server';
import {mediaDirectory} from '../../../lib/storage';
import path from 'node:path';
import {APP_RELEASE} from '../../../lib/release';
export const dynamic='force-dynamic';
export async function GET(){try{
 await db().query('SELECT 1');await fs.access(mediaDirectory,fs.constants.W_OK);
 const marker=async(name:string)=>fs.readFile(path.join(process.env.DATA_DIR||'/data',name),'utf8').then(JSON.parse).catch(()=>null);
 const check=await marker('deployment-check.json'),workflow=await marker('workflow-check.json');
 const result=(value:{release?:string;ok?:boolean}|null)=>value?.release===APP_RELEASE&&typeof value.ok==='boolean'?value.ok:null;
 return Response.json({status:'ok',release:APP_RELEASE,aiSelfCheck:result(check),workflowSelfCheck:result(workflow)},{headers:{'Cache-Control':'no-store'}});
}catch{return Response.json({status:'unavailable'},{status:503})}}
