import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID,randomBytes,scryptSync} from 'node:crypto';
import pg from 'pg';
if(!process.env.DATABASE_URL)throw Error('DATABASE_URL não foi configurada.');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000,max:2});
const client=await pool.connect();
try{await client.query('SELECT pg_advisory_lock(724081)');await client.query('CREATE TABLE IF NOT EXISTS schema_migrations(version text PRIMARY KEY,applied_at timestamptz NOT NULL DEFAULT now())');
 for(const name of (await fs.readdir('migrations')).filter(s=>s.endsWith('.sql')).sort()){const exists=await client.query('SELECT version FROM schema_migrations WHERE version=$1',[name]);if(exists.rowCount)continue;await client.query('BEGIN');try{await client.query(await fs.readFile(path.join('migrations',name),'utf8'));await client.query('INSERT INTO schema_migrations(version) VALUES($1)',[name]);await client.query('COMMIT');console.log('Migration applied: '+name)}catch(error){await client.query('ROLLBACK');throw error}}
 const users=await client.query('SELECT id FROM app_users LIMIT 1');if(!users.rowCount){const password=process.env.INITIAL_ADMIN_PASSWORD;if(!password||password.length<12)throw Error('INITIAL_ADMIN_PASSWORD precisa ter ao menos 12 caracteres.');const salt=randomBytes(16).toString('hex'),hash='scrypt$'+salt+'$'+scryptSync(password,salt,64).toString('hex');await client.query('INSERT INTO app_users(id,email,full_name,password_hash,role,must_change_password) VALUES($1,$2,$3,$4,\'admin\',true)',[randomUUID(),(process.env.INITIAL_ADMIN_EMAIL||'admin@rota.local').toLowerCase(),process.env.INITIAL_ADMIN_NAME||'Administrador Rota',hash]);console.log('Initial administrator created.');}
 await client.query('DELETE FROM app_sessions WHERE expires_at<now()');
}finally{await client.query('SELECT pg_advisory_unlock(724081)').catch(()=>{});client.release();await pool.end()}
