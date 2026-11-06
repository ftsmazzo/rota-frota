import pg from 'pg';
import type {FleetData,Inspection,FindingEvent} from './model';
const globalPool=globalThis as unknown as {rotaPool?:pg.Pool};
export function db(){if(!process.env.DATABASE_URL)throw Error('Banco de dados não configurado.');return globalPool.rotaPool??=new pg.Pool({connectionString:process.env.DATABASE_URL,max:10,idleTimeoutMillis:30000,connectionTimeoutMillis:10000,statement_timeout:30000,application_name:'rota-frota'});}
export async function readData(queryable:Pick<pg.PoolClient,'query'>=db()):Promise<FleetData>{
 const {rows}=await queryable.query("SELECT kind,payload FROM fleet_records WHERE kind IN ('vehicle','driver','inspection')");
 const events=await queryable.query('SELECT e.*,u.full_name AS actor_name FROM finding_events e LEFT JOIN app_users u ON u.id=e.actor_id ORDER BY e.sequence');
 const resolutions=await queryable.query('SELECT r.*,u.full_name AS actor_name FROM finding_resolutions r LEFT JOIN app_users u ON u.id=r.resolved_by');
 const links=await queryable.query('SELECT l.*,u.full_name AS actor_name FROM trip_links l LEFT JOIN app_users u ON u.id=l.actor_id');
 return {vehicles:rows.filter(r=>r.kind==='vehicle').map(r=>r.payload),drivers:rows.filter(r=>r.kind==='driver').map(r=>r.payload),inspections:rows.filter(r=>r.kind==='inspection').map(r=>{
   const original=r.payload as Inspection,link=links.rows.find(l=>l.return_id===original.id);
   const inspection:Inspection=link?{...original,previousId:link.departure_id,...link.corrected?{linkNote:{note:link.note,at:new Date(link.created_at).toISOString(),actor:link.actor_name||'Administrador',originalPreviousId:original.previousId}}:{}}:original;
   return {...inspection,findings:inspection.findings.map(f=>{
     let history:FindingEvent[]=events.rows.filter(e=>e.inspection_id===inspection.id&&e.finding_id===f.id).map(e=>({id:e.id,status:e.status,note:e.note,createdAt:new Date(e.created_at).toISOString(),actor:e.actor_name||'Administrador',legacy:e.legacy}));
     const legacy=resolutions.rows.find(e=>e.inspection_id===inspection.id&&e.finding_id===f.id);
     if(!history.length&&legacy)history=[{id:legacy.id,status:'closed',note:legacy.note,createdAt:new Date(legacy.created_at).toISOString(),actor:legacy.actor_name||'Administrador',legacy:true}];
     const last=history[history.length-1],status=last?.status||(f.resolved?'closed':'identified');
     return {...f,status,events:history,resolved:status==='closed',resolution:status==='closed'&&last?{note:last.note,resolvedAt:last.createdAt,resolvedBy:last.actor}:undefined};
   })};
 })};
}
export function jsonError(message:string,status=500){return Response.json({error:message},{status,headers:{'Cache-Control':'no-store'}})}
export function safeId(id:string){return /^[a-zA-Z0-9_-]{1,100}$/.test(id)}
export function isSameOrigin(request:Request){const origin=request.headers.get('origin');if(!origin)return true;return origin===process.env.APP_URL||origin===new URL(request.url).origin}
export function canonical(value:unknown):string{if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';return '{'+Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}';}
