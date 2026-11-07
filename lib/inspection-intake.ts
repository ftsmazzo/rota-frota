import type {Inspection,Vehicle} from './model';

export const PLATE_PHOTO_LABEL='Placa do veículo';
export type GeoCheckIn=
 | {status:'captured';capturedAt:string;lat:number;lng:number;accuracy:number}
 | {status:'unavailable';attemptedAt:string;reason:'permission_denied'|'position_unavailable'|'timeout'|'unsupported'|'unknown';justification:string};
export type InspectionIntake={version:1;platePhotoId:string;dashboardPhotoId:string;observedPlate:string;plateMethod:'ocr_confirmed'|'manual';plateConfirmedAt:string;checkIn:GeoCheckIn};
export type DraftIntake=Partial<Omit<InspectionIntake,'checkIn'>> & {version:1;checkIn?:GeoCheckIn};

export function normalizePlate(value:string){return value.toUpperCase().replace(/[^A-Z0-9]/g,'');}
export function validPlate(value:string){return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(normalizePlate(value));}
export function formatPlate(value:string){const plate=normalizePlate(value).slice(0,7);return plate.length>3?plate.slice(0,3)+'-'+plate.slice(3):plate;}
export function validateIntake(inspection:Pick<Inspection,'intake'|'photos'|'vehicleId'|'startedAt'> & Partial<Pick<Inspection,'finishedAt'>>,vehicle?:Vehicle){
 const intake=inspection.intake,errors:string[]=[];if(!intake){errors.push('Conclua a identificação inicial do veículo.');return errors;}
 const earliest=Date.parse(inspection.startedAt)-600000,finished=inspection.finishedAt?Date.parse(inspection.finishedAt):NaN,latest=Math.min(Date.now()+600000,Number.isFinite(finished)?finished+600000:Infinity),within=(value:string)=>{const time=Date.parse(value);return Number.isFinite(time)&&time>=earliest&&time<=latest;};
 const plate=inspection.photos.find(p=>p.id===intake.platePhotoId),panel=inspection.photos.find(p=>p.id===intake.dashboardPhotoId);
 if(!plate||plate.label!==PLATE_PHOTO_LABEL)errors.push('Inclua a foto da placa.');
 if(!panel||panel.label!=='Painel e hodômetro'||panel.id===plate?.id)errors.push('Inclua a foto do painel e hodômetro.');
 if(!validPlate(intake.observedPlate)||vehicle&&normalizePlate(intake.observedPlate)!==normalizePlate(vehicle.plate))errors.push('Confirme que a placa fotografada corresponde ao veículo selecionado.');
 if(!intake.plateConfirmedAt||!within(intake.plateConfirmedAt))errors.push('Confirme novamente a leitura da placa nesta vistoria.');
 if(!intake.checkIn)errors.push('Registre o check-in de localização ou justifique a indisponibilidade.');
 else if(intake.checkIn.status==='captured'){
  const g=intake.checkIn;if(!Number.isFinite(g.lat)||g.lat< -90||g.lat>90||!Number.isFinite(g.lng)||g.lng< -180||g.lng>180||!Number.isFinite(g.accuracy)||g.accuracy<1||!within(g.capturedAt))errors.push('O check-in de localização é inválido ou não pertence a esta vistoria.');
 }else if(!within(intake.checkIn.attemptedAt)||intake.checkIn.justification.trim().length<10)errors.push('Explique por que o GPS não pôde ser registrado nesta vistoria.');
 return errors;
}
