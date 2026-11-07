import type {Photo,VoiceClip,VoiceTranscript} from './model';
import {localDay} from './trips';
export const FUEL_LABELS={gasoline:'Gasolina',ethanol:'Etanol',diesel:'Diesel',mixed:'Mistura / outro'};
export type FuelType=keyof typeof FUEL_LABELS;
export type Refueling={id:string;vehicleId:string;driverId:string;occurredAt:string;odometer:number;station:string;stationDocument?:string;fuelType:FuelType;liters:number;unitPrice:number;totalPaid:number;discount:number;fullTank:boolean;gapBefore:boolean;notes:string;photos:Photo[];voiceTranscripts?:VoiceTranscript[];pending?:boolean;syncError?:string;receivedAt?:string;voided?:{at:string;actor:string;reason:string}};
export type RefuelingDraft=Omit<Refueling,'pending'|'receivedAt'|'voided'> & {voiceClips?:VoiceClip[];editing?:Record<string,string>;fullTankAnswered?:boolean};
export type FuelCycle={start:Refueling;end:Refueling;distance:number;liters:number;cost:number;kmPerLiter:number;costPerKm:number;fuelType:FuelType};
export const money=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export const decimal=(n:number,digits=2)=>n.toLocaleString('pt-BR',{minimumFractionDigits:digits,maximumFractionDigits:digits});
export function parseDecimal(value:string){const s=value.trim();return Number(s.includes(',')?s.replace(/\./g,'').replace(',','.'):s);}
export function stationKey(r:Pick<Refueling,'station'|'stationDocument'>){return r.stationDocument?.replace(/\D/g,'')||r.station.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');}
export function fuelCycles(records:Refueling[]):FuelCycle[]{
 const cycles:FuelCycle[]=[],groups=new Map<string,Refueling[]>();
 for(const r of records.filter(r=>!r.pending)){const list=groups.get(r.vehicleId)||[];list.push(r);groups.set(r.vehicleId,list);}
 for(const list of groups.values()){let start:Refueling|undefined,litersMl=0,cents=0,types=new Set<FuelType>();
  for(const r of list.sort((a,b)=>a.occurredAt.localeCompare(b.occurredAt)||a.odometer-b.odometer||a.id.localeCompare(b.id))){
   if(r.voided||r.gapBefore||start&&r.odometer<start.odometer){start=undefined;litersMl=0;cents=0;types.clear();}if(r.voided)continue;
   if(start){litersMl+=Math.round(r.liters*1000);cents+=Math.round(r.totalPaid*100);types.add(r.fuelType);}
   if(r.fullTank){if(start&&r.odometer>start.odometer&&litersMl>0){const distance=r.odometer-start.odometer,liters=litersMl/1000;cycles.push({start,end:r,distance,liters,cost:cents/100,kmPerLiter:distance/liters,costPerKm:cents/100/distance,fuelType:types.size===1?[...types][0]:'mixed'});}start=r;litersMl=0;cents=0;types=new Set([r.fuelType]);}
  }
 }return cycles.sort((a,b)=>a.end.occurredAt.localeCompare(b.end.occurredAt));
}
export function fuelSummary(records:Refueling[],filters:{vehicleId?:string;fuelType?:string;from?:string;to?:string}={}){
 const matches=(r:Refueling)=>!r.voided&&(!filters.vehicleId||r.vehicleId===filters.vehicleId)&&(!filters.fuelType||r.fuelType===filters.fuelType)&&(!filters.from||localDay(r.occurredAt)>=filters.from)&&(!filters.to||localDay(r.occurredAt)<=filters.to);
 const selected=records.filter(matches),cycles=fuelCycles(records).filter(c=>matches(c.end)&&(!filters.fuelType||c.fuelType===filters.fuelType));
 const distance=cycles.reduce((a,c)=>a+c.distance,0),liters=cycles.reduce((a,c)=>a+c.liters,0),cycleCost=cycles.reduce((a,c)=>a+c.cost,0);
 const stations=new Map<string,{station:string;fuelType:FuelType;liters:number;total:number;count:number}>();
 for(const r of selected.filter(r=>!r.pending)){const key=stationKey(r)+':'+r.fuelType,v=stations.get(key)||{station:r.station,fuelType:r.fuelType,liters:0,total:0,count:0};v.liters+=r.liters;v.total+=r.totalPaid;v.count++;stations.set(key,v);}
 return {selected,cycles,distance,liters,spent:selected.filter(r=>!r.pending).reduce((a,r)=>a+r.totalPaid,0),kmPerLiter:liters?distance/liters:null,costPerKm:distance?cycleCost/distance:null,stations:[...stations.values()].sort((a,b)=>a.fuelType.localeCompare(b.fuelType)||a.total/a.liters-b.total/b.liters)};
}
