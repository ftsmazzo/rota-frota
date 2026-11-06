import {jsPDF} from 'jspdf';
import {CHECKLIST,REQUIRED_PHOTOS,km,dateTime,fuelLabel,inspectionCode,type FleetData,type Inspection,type Photo} from './model';
import {priorFindings,type VehicleTrip} from './trips';
import {findingStatus,FINDING_STATUS_LABELS} from './workflow';
import {rasterize} from './pdf';
const photoAt=(i:Inspection|undefined,label:string)=>i?.photos.find(p=>p.label===label||(label==='Lateral direita'&&p.label==='Lateral 1')||(label==='Lateral esquerda'&&p.label==='Lateral 2'));
export function buildTripReport(trip:VehicleTrip,data:FleetData,media:Record<string,string>={}){
 const pdf=new jsPDF({unit:'mm',format:'a4',compress:true}),vehicle=data.vehicles.find(v=>v.id===trip.vehicleId)!,code='UT-'+trip.id.replace(/[^a-z0-9]/gi,'').slice(-8).toUpperCase();let y=0;
 const ink:[number,number,number]=[24,55,44],muted:[number,number,number]=[124,143,113],line:[number,number,number]=[224,232,215];
 const clean=(s:unknown)=>String(s).replace(/[^\u0009\u000a\u000d\u0020-\u00ff]/g,' ');
 const text=(s:unknown,x:number,yy:number,size=9,bold=false,color=ink)=>{pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(size);pdf.setTextColor(...color);pdf.text(clean(s),x,yy);};
 const header=(title:string,newPage=false)=>{if(newPage)pdf.addPage();text('rota.',16,22,27,true);text('GESTÃO DE FROTA',48,21,6,false,muted);text(code,159,17,8,true);text('UTILIZAÇÃO DO VEÍCULO',159,22,6,false,muted);pdf.setDrawColor(...line);pdf.line(16,30,194,30);text('SAÍDA, RETORNO E ACOMPANHAMENTO',16,41,7,true,muted);text(title,16,53,19);y=65;};
 const ensure=(height=10)=>{if(y+height>270)header('Continuação do histórico.',true);};
 const section=(title:string)=>{ensure(15);text(title,16,y,11,true);y+=9;};
 const paragraph=(value:string,size=8.5)=>{pdf.setFont('helvetica','normal');pdf.setFontSize(size);for(const l of pdf.splitTextToSize(clean(value),178) as string[]){ensure(5);text(l,16,y,size);y+=4.7;}y+=4;};
 header('Uma utilização, um registro completo.');
 pdf.setFillColor(240,246,232);pdf.roundedRect(16,y-3,178,23,2,2,'F');text(vehicle.model,21,y+5,15,true);text(vehicle.plate+' | '+vehicle.unit,21,y+13,8,false,muted);text(trip.status==='completed'?'ENCERRADA':trip.status==='active'?'EM USO':'VÍNCULO INCOMPLETO',143,y+8,7,true);y+=32;
 [trip.departure,trip.returned].forEach((i,index)=>{const x=16+index*94;text(index?'RETORNO':'SAÍDA',x,y,7,true,muted);text(i?dateTime(i.finishedAt):'Sem registro vinculado',x,y+7,9,true);text(i?data.drivers.find(d=>d.id===i.driverId)?.name||'Não informado':'Conferência necessária',x,y+14,8);text(i?km(i.odometer)+' | '+fuelLabel(i.fuel):'Distância não calculada',x,y+21,9,true);});y+=34;
 pdf.setFillColor(246,248,242);pdf.roundedRect(16,y-3,178,17,2,2,'F');text('QUILÔMETROS NESTA UTILIZAÇÃO',21,y+3,7,false,muted);text(trip.distance===null?'Aguardando vínculo / retorno':km(trip.distance),21,y+10,13,true);y+=25;
 paragraph('Atividade: '+(trip.departure?.destination||trip.returned?.destination||'Não informada'),8);
 section('Checklist comparado');text('ITEM',17,y,6.5,true,muted);text('SAÍDA',111,y,6.5,true,muted);text('RETORNO',155,y,6.5,true,muted);y+=7;
 const answer=(value?:string)=>value==='ok'?'Conforme':value==='issue'?'Atenção':value==='na'?'Não se aplica':'Sem registro';
 for(const item of CHECKLIST){ensure(8);const a=trip.departure?.answers[item.id],b=trip.returned?.answers[item.id];if(a&&b&&a!==b){pdf.setFillColor(249,244,229);pdf.rect(16,y-4,178,7,'F');}text(item.label,17,y,8);text(answer(a),111,y,8);text(answer(b),155,y,8);pdf.setDrawColor(...line);pdf.line(16,y+3,194,y+3);y+=7.5;}
 const labels=[...REQUIRED_PHOTOS,...(photoAt(trip.departure,'Detalhe da avaria')||photoAt(trip.returned,'Detalhe da avaria')?['Detalhe da avaria']:[])];
 for(let start=0;start<labels.length;start+=3){header('Comparativo fotográfico.',true);for(const label of labels.slice(start,start+3)){text(label,16,y,10,true);[trip.departure,trip.returned].forEach((i,index)=>{const x=16+index*94,p=photoAt(i,label);text(index?'RETORNO':'SAÍDA',x,y+6,6.5,true,muted);pdf.setFillColor(246,248,241);pdf.roundedRect(x,y+9,84,52,1,1,'F');const image=p&&media[p.id];if(image){const info=pdf.getImageProperties(image),scale=Math.min(82/info.width,50/info.height),w=info.width*scale,h=info.height*scale;pdf.addImage(image,'PNG',x+(84-w)/2,y+10+(50-h)/2,w,h);}else text(p?'Foto indisponível nesta cópia':'Sem foto neste registro',x+8,y+36,7,false,muted);});y+=70;}}
 header('Ocorrências e andamento.',true);
 paragraph('O encerramento da utilização registra o retorno. Avaliação, encaminhamento, reparo e conferência final são acompanhados separadamente. Este documento mostra o histórico disponível na data da emissão.');
 const groups=[{title:'Registradas até a saída',items:priorFindings(trip,data.inspections)},{title:'Registradas no retorno',items:trip.returned?trip.returned.findings.map(finding=>({inspection:trip.returned!,finding})):[]}];
 for(const group of groups){section(group.title);if(!group.items.length)paragraph('Nenhuma ocorrência encontrada nos registros disponíveis.');for(const {inspection,finding} of group.items){ensure(23);text(finding.area,16,y,10,true);y+=6;paragraph(finding.description);paragraph('Situação atual: '+FINDING_STATUS_LABELS[findingStatus(finding)]+' | Vistoria: '+inspectionCode(inspection.id),7.5);for(const event of finding.events||[]){ensure(13);text(FINDING_STATUS_LABELS[event.status]+(event.legacy?' - fluxo anterior':''),19,y,8.5,true);y+=5;paragraph(event.note,8);paragraph(event.actor+' | '+dateTime(event.createdAt),7);}}}
 section('Observações da saída');paragraph(trip.departure?.notes||'Sem observações.');section('Observações do retorno');paragraph(trip.returned?.notes||'Sem observações.');
 if(trip.returned?.linkNote){section('Conferência do vínculo');paragraph(trip.returned.linkNote.note);paragraph(trip.returned.linkNote.actor+' | '+dateTime(trip.returned.linkNote.at),7.5);}
 header('Confirmações dos envolvidos.',true);
 paragraph('Assinaturas coletadas nas vistorias originais. Cada confirmação se refere ao registro, às informações e às imagens da respectiva etapa.',8.5);
 for(const [i,label] of [[trip.departure,'Saída'],[trip.returned,'Retorno']] as const){
  section(label+(i?' · '+dateTime(i.finishedAt):' · Sem registro vinculado'));
  if(!i){paragraph('Sem assinaturas nesta etapa.');continue;}
  const sy=y;
  [[data.drivers.find(d=>d.id===i.driverId)?.name||'Motorista','Motorista','driverSignature'],[i.inspectorName,'Vistoriador','inspectorSignature']].forEach(([name,role,key],index)=>{
   const x=16+index*94,image=media[i.id+':'+key];pdf.setFillColor(246,248,242);pdf.roundedRect(x,sy,84,28,1,1,'F');
   if(image){const info=pdf.getImageProperties(image),scale=Math.min(78/info.width,25/info.height),w=info.width*scale,h=info.height*scale;pdf.addImage(image,'PNG',x+(84-w)/2,sy+(28-h)/2,w,h);}else text('Assinatura indisponível nesta cópia',x+4,sy+16,7,false,muted);
   pdf.setDrawColor(...line);pdf.line(x,sy+32,x+84,sy+32);pdf.setFontSize(8);const lines=pdf.splitTextToSize(clean(name),84) as string[];lines.slice(0,2).forEach((l,n)=>text(l,x,sy+39+n*4,8,true));text(role,x,sy+51,7,false,muted);
  });y+=62;
 }
 section('Referências e emissão');paragraph('Saída: '+(trip.departure?inspectionCode(trip.departure.id):'não vinculada')+' | Retorno: '+(trip.returned?inspectionCode(trip.returned.id):'não registrado'),8);paragraph('Emitido em '+dateTime(new Date().toISOString())+'. As vistorias individuais, fotos e assinaturas originais permanecem vinculadas ao veículo.',7.5);
 if(trip.departure?.demo||trip.returned?.demo)paragraph('DEMONSTRAÇÃO: dados fictícios. Imagens de exemplo podem ter sido geradas por IA.',7);
 if(trip.departure?.pending||trip.returned?.pending)paragraph('CÓPIA LOCAL: há registros aguardando recebimento pelo servidor.',7);
 const pages=pdf.getNumberOfPages();for(let n=1;n<=pages;n++){pdf.setPage(n);pdf.setDrawColor(...line);pdf.line(16,279,194,279);text('Rota - Cuidado em cada percurso',16,285,6.5,false,muted);text(code+' | '+n+' / '+pages,159,285,6.5,false,muted);}
 pdf.setProperties({title:'Utilização '+vehicle.model+' - '+code,subject:'Comparativo de saída, retorno e acompanhamento de ocorrências',author:'Rota',creator:'Rota Frota SST'});
 return pdf;
}
export async function downloadTripReport(trip:VehicleTrip,data:FleetData){const media:Record<string,string>={};for(const i of [trip.departure,trip.returned]){if(!i)continue;for(const photo of i.photos){const src=photo.data||photo.url;if(src)media[photo.id]=await rasterize(src,photo.demoSlot);}if(i.driverSignature)media[i.id+':driverSignature']=await rasterize(i.driverSignature);if(i.inspectorSignature)media[i.id+':inspectorSignature']=await rasterize(i.inspectorSignature);}buildTripReport(trip,data,media).save('utilizacao-'+trip.id.replace(/[^a-z0-9]/gi,'').slice(-12)+'.pdf');}
