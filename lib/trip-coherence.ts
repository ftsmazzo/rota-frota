import type {Inspection} from './model';
import type {VehicleTrip} from './trips';

export type CoherenceSignal={level:'info'|'review';message:string};
const rad=(n:number)=>n*Math.PI/180;
export function pointDistanceKm(a:{lat:number;lng:number},b:{lat:number;lng:number}){
 const dLat=rad(b.lat-a.lat),dLng=rad(b.lng-a.lng),x=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
const captured=(i?:Inspection)=>i?.intake?.checkIn?.status==='captured'?i.intake.checkIn:undefined;
export function analyzeTripCoherence(trip:VehicleTrip){
 const signals:CoherenceSignal[]=[];const out=trip.departure,back=trip.returned;
 if(!out||!back)return {status:'insufficient_data' as const,signals,disclaimer:'Análise baseada em check-ins pontuais; não representa rastreamento de rota.'};
 const elapsedHours=(Date.parse(back.finishedAt)-Date.parse(out.finishedAt))/3600000,distance=back.odometer-out.odometer;
 if(elapsedHours>0&&distance/elapsedHours>140)signals.push({level:'review',message:`A média implícita pelos registros é ${Math.round(distance/elapsedHours)} km/h. Confira horários e hodômetros.`});
 if(out.driverId!==back.driverId)signals.push({level:'info',message:'O responsável informado no retorno é diferente do registrado na saída.'});
 if(out.destination.trim().toLocaleLowerCase('pt-BR')!==back.destination.trim().toLocaleLowerCase('pt-BR'))signals.push({level:'info',message:'O destino ou atividade foi alterado entre saída e retorno.'});
 if(back.fuel>out.fuel)signals.push({level:'info',message:'O nível de combustível aumentou; confira se houve abastecimento durante a utilização.'});
 const a=captured(out),b=captured(back);
 if(a&&b){const separation=pointDistanceKm(a,b),minimum=Math.max(0,separation-(a.accuracy+b.accuracy)/1000);if(minimum>distance+3)signals.push({level:'review',message:`Os pontos de check-in estão separados por pelo menos ${minimum.toFixed(1)} km, acima dos ${distance} km registrados no hodômetro.`});else signals.push({level:'info',message:`Separação entre os check-ins: ${separation.toFixed(1)} km. Esse valor não é a distância percorrida.`});}
 else signals.push({level:'info',message:'Não há dois check-ins GPS capturados para comparar os pontos de saída e retorno.'});
 return {status:signals.some(s=>s.level==='review')?'review_recommended' as const:'no_automatic_alerts' as const,signals,disclaimer:'Análise baseada em check-ins pontuais e dados informados; não representa rastreamento de rota nem comprova desvios.'};
}
