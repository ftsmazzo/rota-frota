import fs from 'node:fs/promises';
import path from 'node:path';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import pg from 'pg';

export async function checkDeployment(){
  const {release}=JSON.parse(await fs.readFile('release.json','utf8'));
  const marker=path.join(process.env.DATA_DIR||'/data','deployment-check.json');
  const previous=await fs.readFile(marker,'utf8').then(JSON.parse).catch(()=>null);
  if(previous?.release===release&&previous.ok)return;
  const base='http://127.0.0.1:'+(process.env.PORT||3000);
  for(let attempt=0;attempt<10;attempt++){
    if(await fetch(base+'/api/health',{signal:AbortSignal.timeout(2000)}).then(r=>r.ok).catch(()=>false))break;
    if(attempt===9)throw Error('health_not_ready');
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
  const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:1,connectionTimeoutMillis:10000});
  const checks={},sessionId=randomUUID(),token=randomBytes(32).toString('base64url');
  try{
    const users=await pool.query("SELECT id FROM app_users WHERE role='admin' AND active=true AND must_change_password=false LIMIT 1");
    if(!users.rowCount){console.info(JSON.stringify({event:'deployment_check_skipped',reason:'initial_password_change',release}));return;}
    await pool.query("INSERT INTO app_sessions(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,now()+interval '5 minutes')",[sessionId,users.rows[0].id,createHash('sha256').update(token).digest('hex')]);
    const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    const authHeaders={Cookie:'rota_session='+token,Origin:process.env.APP_URL||base};
    const fleetResponse=await fetch(base+'/api/data',{headers:authHeaders,signal:AbortSignal.timeout(15000)});
    const fleet=await fleetResponse.json().catch(()=>null);
    checks['/api/data']=fleetResponse.ok&&Array.isArray(fleet?.vehicles)&&Array.isArray(fleet?.inspections);
    const missing=await fetch(base+'/api/findings/resolve',{method:'POST',headers:{...authHeaders,'Content-Type':'application/json'},body:JSON.stringify({inspectionId:'self-check-missing-'+randomUUID(),findingId:'missing',note:'Verificação de implantação sem alteração de registros.'}),signal:AbortSignal.timeout(15000)});
    checks['/api/findings/resolve']=missing.status===404&&typeof(await missing.json().catch(()=>null))?.error==='string';
    for(const route of ['/api/ai/dashboard','/api/ai']){
      const response=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',Cookie:'rota_session='+token,Origin:process.env.APP_URL||base},body:JSON.stringify({image,message:'Verificação de implantação com imagem vazia.'}),signal:AbortSignal.timeout(55000)});
      const value=await response.json().catch(()=>null);
      checks[route]=response.ok&&value?.odometer===null&&value?.fuel===null&&typeof value?.text==='string';
    }
    const ok=Object.values(checks).every(Boolean);
    await fs.writeFile(marker,JSON.stringify({release,ok,checks,at:new Date().toISOString()}),{mode:0o600});
    console.info(JSON.stringify({event:'deployment_check_completed',release,ok,checks}));
  }finally{
    await pool.query('DELETE FROM app_sessions WHERE id=$1',[sessionId]).catch(()=>{});
    await pool.end();
  }
}
