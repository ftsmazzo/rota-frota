import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
const root=process.cwd();
const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'rota-source-'));
try {
 const archive=path.join(temporary,'source.tgz');
 const included=['app','components','lib','public','scripts','migrations','instrumentation.ts','package.json','package-lock.json','tsconfig.json','next.config.ts','postcss.config.mjs','Dockerfile'];
 const result=spawnSync('tar',['--exclude=public/precache.json','-czf',archive,...included],{cwd:root,stdio:'inherit'});
 if(result.error||result.status!==0)throw Error('Não foi possível compactar o código. Instale tar e tente novamente.');
 const encoded=(await fs.readFile(archive)).toString('base64');
 const chunks=encoded.match(/.{1,16000}/g);
 const prefix=['FROM node:22-bookworm-slim AS source','WORKDIR /app',...chunks.map((chunk,index)=>`RUN node -e "require('node:fs').${index?'appendFileSync':'writeFileSync'}('/tmp/source.tgz',Buffer.from('${chunk}','base64'))"`),'RUN tar -xzf /tmp/source.tgz -C /app && rm /tmp/source.tgz'].join('\n');
 const dockerfile=(await fs.readFile('Dockerfile','utf8')).replace('COPY package*.json ./','COPY --from=source /app/package*.json ./').replace('COPY . .','COPY --from=source /app/ ./');
 const destination=path.join(root,'easypanel.inline.Dockerfile');
 await fs.writeFile(destination,prefix+'\n\n'+dockerfile);
 console.log('Arquivo inline gerado: '+destination);
} finally {await fs.rm(temporary,{recursive:true,force:true})}
