type Bucket={timestamps:number[];active:number;day:string;dailyCount:number};
type LimitState={buckets:Map<string,Bucket>;active:number};
const globalState=globalThis as unknown as {rotaAiLimitState?:LimitState};
const state=globalState.rotaAiLimitState??={buckets:new Map<string,Bucket>(),active:0};
globalState.rotaAiLimitState=state;

export function acquireAiCapacity(userId:string){
 const now=Date.now(),day=new Date(now).toISOString().slice(0,10),bucket=state.buckets.get(userId)||{timestamps:[],active:0,day,dailyCount:0};
 bucket.timestamps=bucket.timestamps.filter(at=>now-at<60_000);if(bucket.day!==day){bucket.day=day;bucket.dailyCount=0;}
 if(state.active>=6||bucket.active>=2||bucket.timestamps.length>=8||bucket.dailyCount>=200)return null;
 state.active++;bucket.active++;bucket.dailyCount++;bucket.timestamps.push(now);state.buckets.set(userId,bucket);
 if(state.buckets.size>500)for(const [key,value] of state.buckets)if(!value.active&&!value.timestamps.some(at=>now-at<60_000)&&value.day!==day)state.buckets.delete(key);
 let released=false;
 return ()=>{if(released)return;released=true;state.active=Math.max(0,state.active-1);const current=state.buckets.get(userId);if(current)current.active=Math.max(0,current.active-1);};
}
