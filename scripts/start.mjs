import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
const data=path.resolve(process.env.DATA_DIR||'.data');
await fs.mkdir(path.join(data,'uploads'),{recursive:true});await fs.mkdir(path.join(data,'backups'),{recursive:true});
if(process.getuid?.()===0){for(const dir of [data,path.join(data,'uploads'),path.join(data,'backups')])await fs.chown(dir,1000,1000);process.setgid('node');process.setuid('node')}
await import('./migrate.mjs');
const {startBackups}=await import('./backup.mjs');startBackups();
setTimeout(()=>import('./self-check.mjs').then(m=>m.checkDeployment()).catch(()=>console.error(JSON.stringify({event:'deployment_check_failed'}))),1500).unref();
const standalone=path.resolve('server.js');
const target=await fs.access(standalone).then(()=>standalone).catch(()=>null);
if(target){await import(target.startsWith('/')?'file://'+target:target)}else{const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','0.0.0.0','--port',process.env.PORT||'3000'],{stdio:'inherit',env:process.env});for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exit(code||0))}
