import { CHECKLIST, type FleetData, type Inspection } from "./model";
export function makeDemoData():FleetData{
 const now=new Date();const date=(days:number,h:number,m=0)=>{const d=new Date(now);d.setDate(d.getDate()+days);d.setHours(h,m,0,0);return d.toISOString()};
 const vehicles:FleetData["vehicles"]=[
 {id:"v1",model:"Volkswagen Virtus",plate:"SST-1A01",year:"2024",color:"Branco",odometer:62347,unit:"Unidade Centro",state:"available",maintenanceAt:70000,illustration:"sedan"},
 {id:"v2",model:"Chevrolet Onix",plate:"SST-2B02",year:"2023",color:"Prata",odometer:48120,unit:"Unidade Centro",state:"out",driver:"d2",destination:"Visita técnica · Indústria Horizonte",maintenanceAt:50000,illustration:"hatch"},
 {id:"v3",model:"Fiat Strada",plate:"SST-3C03",year:"2024",color:"Branco",odometer:21750,unit:"Unidade Norte",state:"available",maintenanceAt:30000,illustration:"pickup"},
 {id:"v4",model:"Hyundai HB20",plate:"SST-4D04",year:"2023",color:"Cinza",odometer:56300,unit:"Unidade Centro",state:"attention",maintenanceAt:60000,illustration:"hatch"},
 {id:"v5",model:"Volkswagen Polo",plate:"SST-5E05",year:"2025",color:"Branco",odometer:12240,unit:"Unidade Norte",state:"out",driver:"d3",destination:"Treinamento · Unidade do cliente",maintenanceAt:20000,illustration:"hatch"},
 {id:"v6",model:"Renault Duster",plate:"SST-6F06",year:"2024",color:"Prata",odometer:35960,unit:"Unidade Centro",state:"available",maintenanceAt:40000,illustration:"suv"}];
 const drivers=[{id:"d1",name:"Marina Costa",role:"Técnica de segurança",initials:"MC",color:"#dcebdc"},{id:"d2",name:"Rafael Almeida",role:"Engenheiro de segurança",initials:"RA",color:"#e4e5f5"},{id:"d3",name:"Beatriz Santos",role:"Técnica de segurança",initials:"BS",color:"#f4e2ce"},{id:"d4",name:"Lucas Ferreira",role:"Coordenador operacional",initials:"LF",color:"#ddeaf0"}];
 const answers=Object.fromEntries(CHECKLIST.map(x=>[x.id,"ok"])) as Inspection["answers"];
 const signature="data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" width="360" height="100"><path d="M30 75 Q45 15 70 65 T110 40 Q100 85 135 65 T180 55 Q210 25 220 65 T285 45 M55 80 Q150 65 300 76" fill="none" stroke="#243c35" stroke-width="2"/></svg>');
 const make=(id:string,vehicleId:string,driverId:string,kind:Inspection["kind"],days:number,h:number,odometer:number,extra:Partial<Inspection>={}):Inspection=>({id,vehicleId,driverId,kind,startedAt:date(days,h,2),finishedAt:date(days,h,8),odometer,fuel:3,destination:"Visita técnica · Cliente Horizonte",answers:{...answers},findings:[],notes:"Veículo conferido para a atividade. Registro demonstrativo.",photos:Array.from({length:5},(_,n)=>({id:id+"-p"+n,label:["Frente","Lateral direita","Traseira","Lateral esquerda","Painel e hodômetro"][n],url:"/demo-inspection.png",demoSlot:n,takenAt:date(days,h,3+n)})),driverSignature:signature,inspectorSignature:signature,inspectorName:"Lucas Ferreira",confirmed:true,demo:true,receivedAt:date(days,h,9),...extra});
 const inspections=[
 make("demo-20261104-001","v1","d1","return",0,11,62347,{previousId:"demo-20261103-001",destination:"Avaliação de riscos · Cliente Horizonte",findings:[{id:"f1",area:"Porta traseira direita",description:"Risco superficial na pintura. Conferir com o registro de saída.",severity:"low",x:71,y:59}],answers:{...answers,body:"issue"},photos:Array.from({length:6},(_,n)=>({id:"demo-r-p"+n,label:["Frente","Lateral 1","Traseira","Lateral 2","Painel e hodômetro","Detalhe da avaria"][n],url:"/demo-inspection.png",demoSlot:n,takenAt:date(0,11,3)})),notes:"Retorno da visita técnica. Pequeno risco observado na porta traseira direita. Demais itens conferidos."}),
 make("demo-20261104-002","v2","d2","departure",0,8,48120,{destination:"Visita técnica · Indústria Horizonte"}),
 make("demo-20261104-003","v5","d3","departure",0,7,12240,{destination:"Treinamento · Unidade do cliente"}),
 make("demo-20261103-001","v1","d1","departure",-1,8,62259,{fuel:4}),
 make("demo-20261103-004","v4","d4","return",-1,17,56300,{findings:[{id:"f2",area:"Pneu dianteiro esquerdo",description:"Corte na lateral do pneu. Veículo aguardando avaliação da manutenção.",severity:"high",x:30,y:28}],answers:{...answers,tires:"issue"},notes:"Encaminhado para avaliação. Não liberar antes da conferência do responsável.",photos:[]}),
 make("demo-20261103-005","v3","d3","return",-1,16,21750),make("demo-20261102-006","v6","d4","return",-2,15,35960)];
 return {vehicles,drivers,inspections};
}
