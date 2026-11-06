import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import pg from 'pg';
const dataDir=path.resolve(process.env.DATA_DIR||'.data'),backupDir=path.join(dataDir,'backups');
let running=false;
export async function createBackup(force=false){if(running)return null;running=true;const stamp=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}),name='rota-photos-'+stamp+'.tar.gz',destination=path.join(backupDir,name),staging=path.join(backupDir,'staging-'+randomUUID());let pool;
 try{await fs.mkdir(backupDir,{recursive:true});if(!force){try{await fs.access(destination);return destination}catch{}}
 pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:1,connectionTimeoutMillis:10000});const records=await pool.query('SELECT id,kind,payload,updated_at,revision FROM fleet_records ORDER BY kind,id');if(!records.rowCount)return null;await fs.mkdir(staging,{recursive:true});const resolutions=await pool.query('SELECT * FROM finding_resolutions');const events=await pool.query('SELECT * FROM finding_events ORDER BY sequence');const tripLinks=await pool.query('SELECT * FROM trip_links');await fs.writeFile(path.join(staging,'data.json'),JSON.stringify({exportedAt:new Date().toISOString(),records:records.rows,resolutions:resolutions.rows,events:events.rows,tripLinks:tripLinks.rows}),{mode:0o600});
 const entries=['uploads'];try{await fs.access(path.join(dataDir,'demo-inspection.png'));entries.push('demo-inspection.png')}catch{}
 const temporary=destination+'.'+randomUUID()+'.tmp';await new Promise((resolve,reject)=>{const child=spawn('tar',['--exclude=*.tmp','-czf',temporary,'-C',dataDir,...entries,'-C',staging,'data.json'],{stdio:['ignore','ignore','pipe']});child.on('error',reject);child.on('exit',code=>code===0?resolve(null):reject(Error('Backup de fotos não concluído.')))});await fs.chmod(temporary,0o600);await fs.rename(temporary,destination);const archives=(await fs.readdir(backupDir)).filter(n=>/^rota-photos-\d{4}-\d{2}-\d{2}\.tar\.gz$/.test(n)).sort().reverse();for(const old of archives.slice(7))await fs.unlink(path.join(backupDir,old));return destination;
 }finally{await pool?.end();await fs.rm(staging,{recursive:true,force:true}).catch(()=>{});running=false}}
export function startBackups(){const run=()=>createBackup().then(p=>{if(p)console.log('Photo backup ready.')}).catch(()=>console.error('Photo backup will be retried.'));const first=setTimeout(run,60000);first.unref();const timer=setInterval(run,3600000);timer.unref()}
