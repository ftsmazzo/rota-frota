export type Answer = "ok" | "issue" | "na";
import {getActiveDeparture} from './trips';
import {findingBlock,findingStatus} from './workflow';
export type Vehicle = { id:string; model:string; plate:string; year:string; color:string; odometer:number; unit:string; state:"available"|"out"|"attention"|"maintenance"; driver?:string; destination?:string; maintenanceAt:number; illustration:string };
export type Driver = { id:string; name:string; role:string; initials:string; color:string };
export type FindingResolution = {note:string;resolvedAt:string;resolvedBy:string};
export type FindingStatus='identified'|'assessment'|'referred'|'repairing'|'repaired'|'closed';
export type FindingEvent={id:string;status:FindingStatus;note:string;createdAt:string;actor:string;legacy?:boolean};
export type Finding = { id:string; area:string; description:string; severity:"low"|"medium"|"high"; x?:number; y?:number; resolved?:boolean; resolution?:FindingResolution; status?:FindingStatus; events?:FindingEvent[] };
export type Photo = { id:string; label:string; data?:string; url?:string; demoSlot?:number; takenAt:string };
export type Inspection = { id:string; vehicleId:string; driverId:string; kind:"departure"|"return"; startedAt:string; finishedAt:string; odometer:number; fuel:number; destination:string; answers:Record<string,Answer>; findings:Finding[]; notes:string; photos:Photo[]; driverSignature?:string; inspectorSignature?:string; inspectorName:string; confirmed:boolean; previousId?:string; linkNote?:{note:string;at:string;actor:string;originalPreviousId?:string}; demo?:boolean; pending?:boolean; syncError?:string; receivedAt?:string; audio?:string; location?:{lat:number;lng:number;accuracy:number} };
export type FleetData = {vehicles:Vehicle[]; drivers:Driver[]; inspections:Inspection[]};
export type Draft = Omit<Inspection,"finishedAt"|"confirmed"> & {step:number; updatedAt:string; findingDraft?:Partial<Finding>};
export const CHECKLIST = [
 {id:"lights",group:"Segurança",label:"Faróis, lanternas e setas",hint:"Confira o funcionamento da iluminação."},
 {id:"tires",group:"Segurança",label:"Pneus e estepe",hint:"Observe desgaste, cortes e pressão aparente."},
 {id:"brakes",group:"Segurança",label:"Freios e luzes de alerta",hint:"Registre qualquer anormalidade percebida."},
 {id:"kit",group:"Segurança",label:"Triângulo, macaco e chave de roda",hint:"Confirme os itens presentes no veículo."},
 {id:"glass",group:"Conservação",label:"Vidros e retrovisores",hint:"Procure trincas, riscos e peças danificadas."},
 {id:"body",group:"Conservação",label:"Lataria e pintura",hint:"Marque novas avarias no mapa do veículo."},
 {id:"clean",group:"Conservação",label:"Limpeza e bancos",hint:"Confira o estado de conservação interno."},
 {id:"wipers",group:"Funcionamento",label:"Limpadores e buzina",hint:"Verifique os comandos com segurança."},
 {id:"controls",group:"Funcionamento",label:"Vidros, ar e comandos",hint:"Confira os recursos aplicáveis ao veículo."},
 {id:"docs",group:"Documentação",label:"Documento e chave",hint:"Confirme a disponibilidade dos dois itens."},
];
export const PHOTO_LABELS=["Frente","Lateral direita","Traseira","Lateral esquerda","Painel e hodômetro","Detalhe da avaria"];
export const REQUIRED_PHOTOS=PHOTO_LABELS.slice(0,5);
export function shortDate(value:string){return new Date(value).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"});}
export function dateTime(value:string){return new Date(value).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"});}
export function km(value:number){return value.toLocaleString("pt-BR")+" km";}
export function fuelLabel(value:number){return ["Reserva","¼ tanque","½ tanque","¾ tanque","Cheio"][value]||"Não informado";}
export function inspectionCode(id:string){return "RT-"+id.replace(/[^a-z0-9]/gi,"").slice(-8).toUpperCase();}
export function openVehicleFindings(vehicleId:string,inspections:Inspection[]){return inspections.filter(i=>i.vehicleId===vehicleId).sort((a,b)=>b.finishedAt.localeCompare(a.finishedAt)).flatMap(inspection=>inspection.findings.filter(f=>findingStatus(f)!=='closed').map(finding=>({inspection,finding})));}
export function vehicleNeedsAttention(vehicleId:string,inspections:Inspection[]){return openVehicleFindings(vehicleId,inspections).some(({finding})=>findingBlock(finding)!==null);}
export function getVehicleState(v:Vehicle,inspections:Inspection[]){if(getActiveDeparture(v.id,inspections))return 'out';const pending=openVehicleFindings(v.id,inspections);if(pending.some(({finding})=>findingBlock(finding)==='maintenance'))return 'maintenance';if(pending.some(({finding})=>findingBlock(finding)==='attention'))return 'attention';if(!inspections.some(i=>i.vehicleId===v.id))return v.state;return 'available';}
export function validateInspection(i:Inspection,all:Inspection[]){
 const errors:string[]=[];
 if(!i.vehicleId||!i.driverId)errors.push("Selecione o veículo e o motorista.");
 if(!Number.isInteger(i.odometer)||i.odometer<0)errors.push("Informe uma quilometragem válida.");
 if(!i.destination.trim())errors.push("Informe o destino ou a atividade.");
 if(CHECKLIST.some(item=>!i.answers[item.id]))errors.push("Responda todos os itens do checklist.");
 if(REQUIRED_PHOTOS.some(label=>!i.photos.some(p=>p.label===label&&(p.data||p.url))))errors.push("Inclua as cinco fotos obrigatórias.");
 if(i.findings.length&&!i.photos.some(p=>p.label==="Detalhe da avaria"))errors.push("Inclua uma foto de detalhe da avaria.");
 if(Object.values(i.answers).includes("issue")&&!i.findings.length)errors.push("Descreva a ocorrência identificada no checklist.");
 if(!i.driverSignature||!i.inspectorSignature)errors.push("Colete as duas assinaturas de confirmação.");
 const previous=all.find(p=>p.id===i.previousId);if(previous&&i.odometer<previous.odometer)errors.push("A quilometragem de retorno é menor que a de saída.");return errors;
}
