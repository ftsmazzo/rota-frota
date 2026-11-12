"use client";
import {PageHeader, LiveDot, StatusBar} from "./ui";
import type {AppUser} from "../lib/auth-types";
import {useState,useEffect,useRef,useCallback} from "react";
import {LayoutDashboard,X,CarFront,ClipboardCheck,Users,FileText,ArrowUpRight,ArrowRight,ArrowLeft,Plus,ChevronRight,Check,Clock,MapPin,Activity,AlertTriangle,ShieldCheck,Sparkles,Wifi,WifiOff,RefreshCw,CloudCheck,CloudUpload,Menu,CheckCircle2,LoaderCircle,Settings2,Gauge,Route,Fuel} from "lucide-react";
import {makeDemoData} from "../lib/demo";
import {km,dateTime,shortDate,inspectionCode,getVehicleState,vehicleNeedsAttention,type FleetData,type Vehicle,type Inspection,type Draft} from "../lib/model";
import {loadLocal,saveLocal,syncInspection,syncRefueling,deleteAudioClip,type LocalState} from "../lib/offline";
import {CarIllustration} from "./visuals";
import {VehicleCard} from "./vehicle-card";
import {ThemeToggle} from "./theme-toggle";
import {InspectionCard} from "./inspection-card";
import {ReportCard} from "./report-card";
import {TeamCard} from "./team-card";
import {Report,PhotoView} from "./report";
import {Avatar,Badge,Modal,SearchBox} from "./common";
import {UserManager,ChangePassword} from "./user-manager";
import {LiveHero} from "./live-hero";
import {InspectionWizard} from "./wizard";
import {Assistant} from "./assistant";
import {PwaInstallHint} from "./pwa-install-hint";
import {FindingReview,VehicleFindings} from "./finding-review";
import {FuelPanel} from './fuel-panel';
import {RefuelingForm} from './refueling-form';
import {CatalogForm as AssistedCatalogForm} from './catalog-form';
import type {Refueling,RefuelingDraft} from '../lib/fuel';
import {TripsPanel} from "./trips-panel";
import {CountUp} from "./count-up";
import {TripDetail} from "./trip-detail";
import {buildTrips,getActiveDeparture,latestOdometer} from "../lib/trips";
type View="overview"|"fleet"|"inspections"|"team"|"reports"|"trips"|"fuel";
const NAV=[{id:"overview",label:"Visão geral",icon:LayoutDashboard},{id:"fleet",label:"Veículos",icon:CarFront},{id:"trips",label:"Utilizações",icon:Route},{id:"fuel",label:"Abastecimentos",icon:Fuel},{id:"inspections",label:"Vistorias",icon:ClipboardCheck},{id:"team",label:"Equipe",icon:Users},{id:"reports",label:"Relatórios",icon:FileText}] as const;
export default function FleetApp({user,onLogout}:{user:AppUser;onLogout:()=>Promise<void>}){
 const signedInDriver={id:user.id,name:user.name,role:user.role,initials:user.name.split(" ").map(s=>s[0]).slice(0,2).join(""),color:"#ddeaf0"};
 const [local,setLocal]=useState<LocalState>({data:{vehicles:[],drivers:[],inspections:[]}});const current=useRef(local),ready=useRef(false),syncing=useRef(false);
 const [userManager,setUserManager]=useState(false),[passwordModal,setPasswordModal]=useState(false),[resolution,setResolution]=useState<{inspection:Inspection;findingId:string;area:string}>();
 const [loaded,setLoaded]=useState(false),[view,setView]=useState<View>("overview"),[search,setSearch]=useState(""),[filter,setFilter]=useState("all"),[online,setOnline]=useState(true),[syncBusy,setSyncBusy]=useState(false),[storageError,setStorageError]=useState("");
 const [fuelOpen,setFuelOpen]=useState(false);
 const [tripId,setTripId]=useState<string>(),[report,setReport]=useState<Inspection>(),[wizard,setWizard]=useState(false),[assistant,setAssistant]=useState(false),[mobile,setMobile]=useState(false),[settings,setSettings]=useState(false),[catalog,setCatalog]=useState<"vehicle"|"driver">(),[vehicleDetail,setVehicleDetail]=useState<Vehicle>(),[toast,setToast]=useState(""),[aiReady,setAiReady]=useState(false),[offlineReady,setOfflineReady]=useState(false),[installEvent,setInstallEvent]=useState<any>();
 const notify=(text:string)=>{setToast(text);setTimeout(()=>setToast(""),4500)};
 const persist=useCallback(async(next:LocalState)=>{try{await saveLocal(next);current.current=next;setLocal(next);setStorageError("");return true}catch{setStorageError("O aparelho não conseguiu salvar os dados. Libere espaço antes de continuar.");return false}},[]);
 const synchronize=useCallback(async()=>{if(syncing.current||!navigator.onLine||!ready.current)return;syncing.current=true;setSyncBusy(true);try{for(const inspection of current.current.data.inspections.filter(i=>i.pending&&!i.demo).sort((a,b)=>a.finishedAt.localeCompare(b.finishedAt))){try{const synced=await syncInspection(inspection);await persist({...current.current,data:{...current.current.data,inspections:current.current.data.inspections.map(i=>i.id===synced.id?synced:i)}})}catch(error){await persist({...current.current,data:{...current.current.data,inspections:current.current.data.inspections.map(i=>i.id===inspection.id?{...i,syncError:(error as Error).message}:i)}});break;}}for(const record of (current.current.data.refuelings||[]).filter(r=>r.pending).sort((a,b)=>a.occurredAt.localeCompare(b.occurredAt))){try{const synced=await syncRefueling(record);await persist({...current.current,data:{...current.current.data,refuelings:(current.current.data.refuelings||[]).map(r=>r.id===synced.id?synced:r)}});}catch(error){await persist({...current.current,data:{...current.current.data,refuelings:(current.current.data.refuelings||[]).map(r=>r.id===record.id?{...r,syncError:(error as Error).message}:r)}});break;}}const response=await fetch("/api/data",{cache:"no-store"});if(response.ok){const remote=await response.json() as FleetData;const localOnly=current.current.data.inspections.filter(i=>i.pending||i.demo&&!remote.inspections.some(r=>r.id===i.id));const keptFuel=current.current.data.refuelings||[],remoteFuel=remote.refuelings||[];remote.refuelings=[...keptFuel.filter(r=>r.pending&&!remoteFuel.some(v=>v.id===r.id)),...remoteFuel.map(r=>({...r,photos:r.photos.map(p=>({...p,data:keptFuel.find(k=>k.id===r.id)?.photos.find(q=>q.id===p.id)?.data}))}))];const kept=current.current.data.inspections;remote.inspections=remote.inspections.map(i=>({...i,photos:i.photos.map(p=>({...p,data:kept.find(k=>k.id===i.id)?.photos.find(k=>k.id===p.id)?.data}))}));await persist({...current.current,data:{...remote,inspections:[...localOnly,...remote.inspections.filter(i=>!localOnly.some(l=>l.id===i.id))]},lastSync:new Date().toISOString()})}}catch{}finally{syncing.current=false;setSyncBusy(false)}},[persist]);
 useEffect(()=>{(async()=>{let saved:LocalState|undefined;try{saved=await loadLocal()}catch{setStorageError("O armazenamento local está indisponível neste navegador.")}const next=saved||{data:makeDemoData()};current.current=next;setLocal(next);setLoaded(true);ready.current=true;setOnline(navigator.onLine);if(!saved)await persist(next);void synchronize();fetch("/api/ai/status").then(r=>r.json()).then((r:any)=>setAiReady(!!r.configured)).catch(()=>{});if("serviceWorker" in navigator&&!['127.0.0.1','localhost'].includes(location.hostname))navigator.serviceWorker.register("/sw.js",{updateViaCache:"none"}).then(()=>navigator.serviceWorker.ready).then(()=>setOfflineReady(true)).catch(()=>{})})();const yes=()=>{setOnline(true);void synchronize()},no=()=>setOnline(false),visible=()=>{if(document.visibilityState==="visible")void synchronize()},install=(e:Event)=>{e.preventDefault();setInstallEvent(e)};window.addEventListener("online",yes);window.addEventListener("offline",no);window.addEventListener("beforeinstallprompt",install);document.addEventListener("visibilitychange",visible);return()=>{window.removeEventListener("online",yes);window.removeEventListener("offline",no);window.removeEventListener("beforeinstallprompt",install);document.removeEventListener("visibilitychange",visible)}},[persist,synchronize]);
 const data=local.data,sorted=[...data.inspections].sort((a,b)=>b.finishedAt.localeCompare(a.finishedAt)),pending=data.inspections.filter(i=>i.pending).length+(data.refuelings||[]).filter(r=>r.pending).length;
 const pendingFindings=sorted.flatMap(i=>i.findings.filter(f=>!f.resolved).map(f=>({i,f}))).sort((a,b)=>({high:0,medium:1,low:2}[a.f.severity]-{high:0,medium:1,low:2}[b.f.severity]));
 function openFindingReview(inspection:Inspection,finding:Inspection["findings"][number]){setTripId(undefined);setVehicleDetail(undefined);setReport(undefined);setResolution({inspection,findingId:finding.id,area:finding.area});}
 const counts={available:data.vehicles.filter(v=>getVehicleState(v,data.inspections)==="available").length,out:data.vehicles.filter(v=>getVehicleState(v,data.inspections)==="out").length,attention:data.vehicles.filter(v=>vehicleNeedsAttention(v.id,data.inspections)).length};
 const inspectionsToday=data.inspections.filter(i=>{const d=i.finishedAt||i.startedAt;if(!d)return false;const dt=new Date(d),now=new Date();return dt.getFullYear()===now.getFullYear()&&dt.getMonth()===now.getMonth()&&dt.getDate()===now.getDate();}).length;
 const activeDriversCount=data.drivers.filter(d=>data.vehicles.some(v=>sorted.find(i=>i.vehicleId===v.id)?.driverId===d.id&&getVehicleState(v,data.inspections)==="out")).length||counts.out;
 function navigate(next:View,status="all"){setView(next);setFilter(status);setSearch("");setMobile(false)}
 async function startInspection(vehicle?:Vehicle){if(current.current.draft){setWizard(true);return}const v=vehicle||data.vehicles.find(v=>getVehicleState(v,data.inspections)==="available")||data.vehicles[0];if(!v)return;const previous=getActiveDeparture(v.id,data.inspections);if(!previous&&getVehicleState(v,data.inspections)!=="available"){notify("O veículo possui pendências de avaliação ou reparo. Confira o acompanhamento antes de uma nova saída.");setVehicleDetail(v);return;}const draft:Draft={evidenceVersion:2,intake:{version:1},id:crypto.randomUUID(),vehicleId:v.id,driverId:previous?.driverId||data.drivers[0]?.id||"",kind:previous?"return":"departure",startedAt:new Date().toISOString(),odometer:latestOdometer(v,data.inspections),fuel:previous?.fuel??3,destination:previous?.destination||"",answers:{},findings:[],notes:"",photos:[],inspectorName:user.name,previousId:previous?.id,step:0,updatedAt:new Date().toISOString()};if(await persist({...current.current,draft}))setWizard(true)}
 async function startRefueling(vehicleId?:string){if(current.current.refuelingDraft){setFuelOpen(true);return;}const v=data.vehicles.find(v=>v.id===vehicleId)||data.vehicles[0];if(!v){notify('Cadastre um veículo antes de abastecer.');return;}const draft:RefuelingDraft={id:crypto.randomUUID(),vehicleId:v.id,driverId:data.drivers[0]?.id||'',occurredAt:new Date().toISOString(),odometer:latestOdometer(v,data.inspections),station:'',fuelType:'gasoline',liters:0,unitPrice:0,totalPaid:0,discount:0,fullTank:false,gapBefore:false,notes:'',photos:[]};if(await persist({...current.current,refuelingDraft:draft})){setVehicleDetail(undefined);setFuelOpen(true);}}
 async function updateRefueling(r:Refueling){await persist({...current.current,data:{...current.current.data,refuelings:(current.current.data.refuelings||[]).map(v=>v.id===r.id?r:v)}});void synchronize();}
 async function setDraft(draft:Draft){if(current.current.draft?.id!==draft.id)return false;return await persist({...current.current,draft:{...draft,updatedAt:new Date().toISOString()}})}
 async function finish(inspection:Inspection){const clips=current.current.draft?.voiceClips||[];if(await persist({...current.current,draft:undefined,data:{...current.current.data,inspections:[inspection,...current.current.data.inspections]}})){void Promise.allSettled(clips.map(clip=>deleteAudioClip(clip.id)));setWizard(false);notify(inspection.demo?"Exemplo salvo neste aparelho.":"Vistoria salva no aparelho. O envio será confirmado pelo sistema.");setTripId(inspection.previousId||inspection.id);void synchronize()}}
 const fleet=data.vehicles.filter(v=>(filter==="all"||(filter==="attention"?vehicleNeedsAttention(v.id,data.inspections):getVehicleState(v,data.inspections)===filter))&&[v.model,v.plate,v.unit].join(" ").toLowerCase().includes(search.toLowerCase()));
 const inspections=sorted.filter(i=>{const v=data.vehicles.find(v=>v.id===i.vehicleId),d=data.drivers.find(d=>d.id===i.driverId);return(filter==="all"||filter==="issues"&&i.findings.length>0||filter==="pending"&&i.pending||i.kind===filter)&&[v?.model,v?.plate,d?.name,i.destination].join(" ").toLowerCase().includes(search.toLowerCase())});
 async function handleDownloadReport(e: React.MouseEvent, i: Inspection) {
  e.stopPropagation();
  notify("Gerando PDF da vistoria…");
  try {
    const { downloadReport } = await import("../lib/pdf");
    await downloadReport(i, data);
  } catch {
    notify("Não foi possível gerar o PDF. Tente novamente.");
  }
}
function vehicleCard(v:Vehicle,index:number){return <VehicleCard key={v.id} vehicle={v} inspections={sorted} drivers={data.drivers} index={index} onOpenDetail={setVehicleDetail} onStartInspection={startInspection} getVehicleState={getVehicleState} vehicleNeedsAttention={vehicleNeedsAttention}/>;}
 function table(rows:Inspection[]){
  return (
    <div className="inspection-card-list">
      {rows.map((i, index) => {
        const v = data.vehicles.find(v => v.id === i.vehicleId);
        const driver = data.drivers.find(d => d.id === i.driverId);
        return (
          <InspectionCard
            key={i.id}
            inspection={i}
            vehicle={v}
            driver={driver}
            index={index}
            onOpen={() => setReport(i)}
          />
        );
      })}
      {!rows.length && (
        <div className="empty-state">
          <strong>Nenhum registro encontrado</strong>
          <p>Experimente outra busca ou registre uma nova vistoria.</p>
        </div>
      )}
    </div>
  );
}
 if(!loaded)return <div className="app-shell"><div className="main-shell" style={{marginLeft:0}}><header className="topbar"><div className="breadcrumb"><span className="brand-mark" style={{width:28,height:28,fontSize:24}}>r</span><strong>Preparando sua frota…</strong><LoaderCircle className="spin" size={16}/></div></header><main className="main-content"><div className="stats-grid">{[1,2,3,4].map(k=><div key={k} className="stat-card skeleton-card"><div className="skeleton-line" style={{width:"55%",height:13}}/><div className="skeleton-line" style={{width:"35%",height:28,margin:"10px 0"}}/><div className="skeleton-line" style={{width:"75%",height:12}}/></div>)}</div><div className="vehicle-grid">{[1,2,3].map(k=><div key={k} className="vehicle-card skeleton-card"><div className="skeleton-line" style={{width:"30%",height:13}}/><div className="skeleton-box" style={{height:92,margin:"12px 0"}}/><div className="skeleton-line" style={{width:"65%",height:16}}/><div className="skeleton-line" style={{width:"45%",height:13,margin:"8px 0 14px"}}/></div>)}</div></main></div></div>;
 return <div className="app-shell"><aside className={"sidebar " + (mobile ? "open" : "")}>
        <div className="sidebar-anim-item" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <a className="brand" href="#" onClick={e => { e.preventDefault(); navigate("overview"); }} style={{ display: "flex", alignItems: "center", gap: "10px", padding: 0, textDecoration: "none" }}>
            <span style={{ width: "40px", height: "40px", borderRadius: "12px", background: "var(--accent)", color: "var(--on-accent)", fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 700, fontSize: "30px", display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: "5px", boxSizing: "border-box", flexShrink: 0 }}>r</span>
            <span style={{ fontSize: "30px", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--on-brand)" }}>rota<span style={{ color: "var(--accent)" }}>.</span></span>
          </a>
          <button type="button" className="sidebar-close-btn" aria-label="Fechar menu" onClick={() => setMobile(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-anim-item sidebar-operation-card" style={{ animationDelay: ".05s" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--on-brand)" }}>Operação SST</span>
              <span style={{ fontSize: "12px", color: "var(--on-brand-2)" }}>Frota interna · {data.vehicles.length} veículos</span>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: 700, letterSpacing: ".12em", color: "var(--accent)" }}>
              <span className="live" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--accent)", color: "var(--accent)" }} />
              AO VIVO
            </span>
          </div>

          <div style={{ display: "flex", gap: "3px", height: "6px", width: "100%" }}>
            <span className="seg" style={{ flex: counts.available || (data.vehicles.length === 0 ? 1 : 0), display: counts.available > 0 || data.vehicles.length === 0 ? "block" : "none", borderRadius: "3px", background: "var(--accent)", animationDelay: ".3s" }} />
            <span className="seg" style={{ flex: counts.out || 0, display: counts.out > 0 ? "block" : "none", borderRadius: "3px", background: "#9cc4e4", animationDelay: ".4s" }} />
            <span className="seg" style={{ flex: counts.attention || 0, display: counts.attention > 0 ? "block" : "none", borderRadius: "3px", background: "#f0b96e", animationDelay: ".5s" }} />
          </div>

          <div style={{ display: "flex", gap: "14px", fontSize: "12px", color: "var(--on-brand-2)" }}>
            <span><b className="mono" style={{ color: "var(--on-brand)", fontFamily: "var(--font-mono)" }}>{counts.available}</b> livres</span>
            <span><b className="mono" style={{ color: "var(--on-brand)", fontFamily: "var(--font-mono)" }}>{counts.out}</b> na rua</span>
            <span><b className="mono" style={{ color: "var(--on-brand)", fontFamily: "var(--font-mono)" }}>{counts.attention}</b> atenção</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "0 1 auto", minHeight: 0 }}>
          <span className="sidebar-anim-item sidebar-nav-caption" style={{ animationDelay: ".1s" }}>GESTÃO DA FROTA</span>

          <nav>
            {NAV.map((item, index) => {
              const isActive = view === item.id;
              let chip: { label: string | number; color: string; bg: string; pulse?: boolean } | null = null;

              if (item.id === "fleet") {
                chip = { label: data.vehicles.length, color: "var(--on-brand)", bg: "var(--brand-soft)" };
              } else if (item.id === "trips" && counts.out > 0) {
                chip = { label: `${counts.out} na rua`, color: "#9cc4e4", bg: "#9cc4e41f", pulse: true };
              } else if (item.id === "inspections") {
                const pendingCount = pendingFindings.length > 0 ? pendingFindings.length : pending;
                if (pendingCount > 0) {
                  chip = {
                    label: `${pendingCount} ${pendingCount === 1 ? "pendente" : "pendentes"}`,
                    color: "#f0b96e",
                    bg: "#f0b96e1f"
                  };
                }
              } else if (item.id === "team") {
                chip = { label: data.drivers.length, color: "var(--on-brand)", bg: "var(--brand-soft)" };
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  className={"sidebar-anim-item sidebar-nav-item " + (isActive ? "active" : "")}
                  style={{ animationDelay: `${0.12 + index * 0.04}s` }}
                  onClick={() => navigate(item.id)}
                >
                  {isActive && <span className="shine" />}
                  <span className={"sidebar-item-icon-box " + (isActive ? "active" : "")}>
                    <item.icon size={19} />
                  </span>
                  <span className={"sidebar-item-label " + (isActive ? "active" : "")}>{item.label}</span>
                  {chip && (
                    <span className="sidebar-item-chip" style={{ color: chip.color, background: chip.bg }}>
                      {chip.pulse && <span className="live" style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />}
                      <span className="mono" style={{ fontFamily: "var(--font-mono)" }}>{chip.label}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-anim-item sidebar-copilot-card" style={{ animationDelay: ".5s" }}>
          <div className="sidebar-copilot-halo" />
          <div className="sidebar-copilot-inner">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "32px", height: "32px", borderRadius: "10px", background: "var(--accent)", color: "var(--on-accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Sparkles size={17} />
              </span>
              <span style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--on-brand)" }}>Copiloto Rota</span>
                <span style={{ fontSize: "12px", color: "var(--on-brand-2)" }}>Pergunte sobre a sua frota</span>
              </span>
            </div>
            <button
              type="button"
              className="sidebar-copilot-btn"
              onClick={() => {
                setAssistant(true);
                setMobile(false);
              }}
            >
              <span>Quais carros estão livres?</span>
              <span className="sidebar-copilot-arrow">
                <ArrowRight size={14} />
              </span>
            </button>
          </div>
        </div>

        <div className="sidebar-anim-item sidebar-footer" style={{ animationDelay: ".55s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <span style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--accent)", color: "var(--on-accent)", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {signedInDriver.initials.toUpperCase()}
            </span>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <strong style={{ fontSize: "14px", fontWeight: 600, color: "var(--on-brand)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.name}
              </strong>
              <button
                type="button"
                onClick={() => {
                  if (!pending || window.confirm("Há vistorias salvas apenas neste aparelho. Elas serão preservadas para o seu próximo acesso. Deseja sair?")) {
                    void onLogout();
                  }
                }}
                style={{ fontSize: "11px", color: "var(--on-brand-2)", background: "transparent", border: 0, padding: 0, textAlign: "left", cursor: "pointer" }}
              >
                Sair da conta
              </button>
            </div>
          </div>
          <ThemeToggle variant="sidebar" />
        </div>
      </aside>{mobile&&<button className="mobile-backdrop" aria-label="Fechar menu" onClick={()=>setMobile(false)}/>}
 <div className="main-shell"><header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" onClick={()=>setMobile(true)} aria-label="Abrir menu"><Menu size={22}/></button><span>Workspace</span><ChevronRight size={13}/><strong>{NAV.find(n=>n.id===view)?.label}</strong></div><div className="topbar-right"><span className="demo-label">Frota interna</span><button className={"connection-chip "+(!online?"offline":"")} onClick={()=>setSettings(true)}>{online?<Wifi size={14}/>:<WifiOff size={14}/>}<span>{!online?"Offline":pending?pending+" envio(s) pendente(s)":"Conectado"}</span></button><span className="top-divider"/><ThemeToggle variant="topbar"/><Avatar driver={signedInDriver} small/></div></header><main className="main-content">
 {storageError&&<div className="error-banner"><AlertTriangle size={18}/>{storageError}</div>}{!online&&<div className="offline-banner"><WifiOff size={16}/><span>Você está offline. As vistorias são salvas neste aparelho.</span><small>{local.lastSync?"Última atualização: "+dateTime(local.lastSync):"Histórico ainda não sincronizado"}</small></div>}
 {view === "overview" && (
  <div className="page-heading">
    <div>
      <div className="eyebrow">CUIDADO EM CADA PERCURSO</div>
      <h1>Sua frota, em boas mãos.</h1>
      <p>Uma visão clara dos veículos e da rotina da sua equipe.</p>
    </div>
  </div>
 )}
 {view === "fleet" && (
  <PageHeader
    eyebrow="GESTÃO DA FROTA"
    title="Cada veículo, um histórico."
    subtitle="Acompanhe disponibilidade, uso e condições de cada carro."
    summary={
      <div className="page-header-chip page-header-chip-status">
        <div className="page-header-chip-labels">
          <span className="chip-part available"><strong>{counts.available}</strong> {counts.available === 1 ? "livre" : "livres"}</span>
          <span className="chip-sep">·</span>
          <span className="chip-part out"><strong>{counts.out}</strong> na rua</span>
          <span className="chip-sep">·</span>
          <span className="chip-part attention"><strong>{counts.attention}</strong> atenção</span>
        </div>
        <StatusBar available={counts.available} out={counts.out} attention={counts.attention} height={6} />
      </div>
    }
  />
 )}
 {view === "trips" && (
  <PageHeader
    eyebrow="GESTÃO DA FROTA"
    title="Cada utilização, do início ao retorno."
    subtitle="Compare saída e retorno, acompanhe os quilômetros e consulte todo o histórico."
    summary={
      <div className="page-header-chip">
        <LiveDot color={counts.out > 0 ? "var(--info)" : "var(--muted)"} />
        <span><strong>{counts.out}</strong> na rua agora</span>
        <span className="chip-sep">·</span>
        <span><strong>{buildTrips(data.inspections).length}</strong> utilizações</span>
      </div>
    }
    actions={
      <button className="button primary new-inspection" onClick={()=>startInspection()}>
        <Plus size={18}/>{local.draft?"Continuar vistoria":"Nova vistoria"}
      </button>
    }
  />
 )}
 {view === "fuel" && (
  <PageHeader
    eyebrow="GESTÃO DA FROTA"
    title="Combustível sob controle."
    subtitle="Registre abastecimentos, acompanhe consumo e compare os preços pagos."
    summary={
      <div className="page-header-chip">
        <LiveDot color="var(--accent)" />
        <span><strong>{(data.refuelings || []).length}</strong> {(data.refuelings || []).length === 1 ? "abastecimento" : "abastecimentos"}</span>
        <span className="chip-sep">·</span>
        <span><strong>{data.vehicles.length}</strong> veículos</span>
      </div>
    }
  />
 )}
 {view === "inspections" && (
  <PageHeader
    eyebrow="GESTÃO DA FROTA"
    title="Vistorias sem complicação."
    subtitle="Da saída ao retorno, acompanhe cada conferência."
    summary={
      <div className="page-header-chip">
        <LiveDot color="var(--accent)" />
        <span><strong>{inspectionsToday}</strong> hoje</span>
        <span className="chip-sep">·</span>
        <span><strong>{data.inspections.length}</strong> total</span>
      </div>
    }
    actions={
      <button className="button primary new-inspection" onClick={()=>startInspection()}>
        <Plus size={18}/>{local.draft?"Continuar vistoria":"Nova vistoria"}
      </button>
    }
  />
 )}
 {view === "team" && (
  <PageHeader
    eyebrow="GESTÃO DA FROTA"
    title="Pessoas que movem a operação."
    subtitle="Motoristas e responsáveis pelas atividades da frota."
    summary={
      <div className="page-header-chip">
        <LiveDot color={activeDriversCount > 0 ? "var(--info)" : "var(--muted)"} />
        <span><strong>{activeDriversCount}</strong> na rua</span>
        <span className="chip-sep">·</span>
        <span><strong>{data.drivers.length}</strong> na equipe</span>
      </div>
    }
  />
 )}
 {view === "reports" && (
  <PageHeader
    eyebrow="GESTÃO DA FROTA"
    title="Tudo registrado. Bem apresentado."
    subtitle="Consulte e baixe os relatórios de cada vistoria."
    summary={
      <div className="page-header-chip">
        <LiveDot color="var(--accent)" />
        <span><strong>{data.inspections.length}</strong> {data.inspections.length === 1 ? "relatório" : "relatórios"}</span>
        {pendingFindings.length > 0 && (
          <>
            <span className="chip-sep">·</span>
            <span className="chip-part attention"><strong>{pendingFindings.length}</strong> {pendingFindings.length === 1 ? "pendência" : "pendências"}</span>
          </>
        )}
      </div>
    }
    actions={
      <button className="button primary new-inspection" onClick={()=>startInspection()}>
        <Plus size={18}/>{local.draft?"Continuar vistoria":"Nova vistoria"}
      </button>
    }
  />
 )}
 {view==="overview"&&<><div className="overview-hero"><LiveHero vehicles={data.vehicles} inspections={data.inspections} drivers={data.drivers} counts={counts} getVehicleState={getVehicleState} onStartInspection={()=>startInspection()}/><section className="ai-hero"><div className="ai-hero-top"><span><Sparkles size={23}/></span><span className="ai-tag">ASSISTENTE ROTA</span><ArrowUpRight size={18}/></div><h2>Menos digitação.<br/> Mais atenção.</h2><p>Transforme suas observações em informações organizadas, com ajuda de IA.</p><button className="text-button" onClick={()=>setAssistant(true)}>Conversar com o assistente <ArrowRight size={16}/></button></section></div>
 <div className="stats-grid">{[{icon:CarFront,label:"Veículos na frota",value:data.vehicles.length,sub:"Sua operação em um só lugar",status:"all",color:"neutral"},{icon:CheckCircle2,label:"Disponíveis",value:counts.available,sub:"Prontos para a próxima saída",status:"available",color:"green"},{icon:Route,label:"Em uso",value:counts.out,sub:"Em atividades com a equipe",status:"out",color:"blue"},{icon:AlertTriangle,label:"Precisam de atenção",value:counts.attention,sub:"Confira antes de liberar",status:"attention",color:"amber"}].map(s=><button className="stat-card" key={s.label} onClick={()=>navigate("fleet",s.status)}><div><span>{s.label}</span><span className={"stat-icon "+s.color}><s.icon size={18}/></span></div><strong><CountUp value={String(s.value).padStart(2,"0")}/></strong><small><i className={s.color}/>{s.sub}</small></button>)}</div>
 <div className="section-heading"><div><h2>De olho na frota</h2><span>Disponibilidade e condições dos veículos</span></div><button className="text-button" onClick={()=>navigate("fleet")}>Ver todos os veículos <ArrowRight size={15}/></button></div><div className="vehicle-grid overview-fleet">{data.vehicles.slice(0,3).map(vehicleCard)}</div><div className="overview-bottom"><section className="recent-panel"><div className="section-heading"><div><h2>Últimas vistorias</h2><span>Os registros mais recentes da operação</span></div><button className="icon-button" aria-label="Ver todas as vistorias" onClick={()=>navigate("inspections")}><ArrowUpRight size={19}/></button></div>{table(sorted.slice(0,4))}</section><aside className="attention-panel"><div className="attention-title"><span><Activity size={19}/></span><h2>Para acompanhar</h2></div>{pendingFindings.slice(0,2).map(({i,f})=><button className="attention-item" key={i.id+f.id} onClick={()=>openFindingReview(i,f)}><span className={"attention-dot "+f.severity}/><div><small>{data.vehicles.find(v=>v.id===i.vehicleId)?.model}</small><strong>{f.area}</strong><p>{f.description}</p><span>Acompanhar ocorrência <ArrowUpRight size={12}/></span></div></button>)}{!pendingFindings.length&&<p className="helper">Nenhum apontamento pendente.</p>}<div className="attention-note"><ShieldCheck size={17}/><span>O cuidado diário mantém a operação em movimento.</span></div></aside></div></>}
 {view==="fleet"&&<><div className="content-toolbar"><div className="tabs-wrap"><div className="tabs">{[["all","Todos",data.vehicles.length],["available","Disponíveis",counts.available],["out","Em uso",counts.out],["attention","Atenção",counts.attention]].map(([key,label,count])=><button key={key} className={filter===key?"selected":""} onClick={()=>setFilter(String(key))}>{label}<span>{count}</span></button>)}</div></div><button className="button secondary" onClick={()=>setCatalog("vehicle")} disabled={!online||user.role!=="admin"}><Plus size={15}/> Adicionar veículo</button></div><SearchBox value={search} onChange={setSearch} placeholder="Buscar veículo, placa..."/><div className="vehicle-grid full-fleet">{fleet.map(vehicleCard)}</div>{!fleet.length&&<div className="empty-state"><strong>Nenhum veículo encontrado.</strong></div>}</>}
 {(view==="inspections"||view==="reports")&&<>
  <div className="content-toolbar">
    <div className="tabs-wrap">
      <div className="tabs">
        {[["all","Todos"],["departure","Saídas"],["return","Retornos"],["issues","Com apontamentos"],["pending","Envios pendentes"]].map(([id,label])=>(
          <button key={id} className={filter===id?"selected":""} onClick={()=>setFilter(id)}>
            {label}
            {id==="pending"&&pending>0&&(
              <span className="tab-pending-chip">
                <LiveDot color="var(--warning)" />
                <span>{pending}</span>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
    <button className="button secondary" disabled={!online||syncBusy} onClick={()=>synchronize()}>
      <RefreshCw size={15} className={syncBusy?"spin":""}/> Atualizar
    </button>
  </div>
  <SearchBox value={search} onChange={setSearch} placeholder="Buscar veículo, placa..."/>
  {view==="inspections" ? (
    <section className="inspections-panel">
      {table(inspections)}
    </section>
  ) : (
    <div className="reports-grid">
      {inspections.map((i, index) => {
        const v = data.vehicles.find(v => v.id === i.vehicleId);
        const driver = data.drivers.find(d => d.id === i.driverId);
        return (
          <ReportCard
            key={i.id}
            inspection={i}
            vehicle={v}
            driver={driver}
            index={index}
            onOpen={() => setReport(i)}
            onDownload={handleDownloadReport}
          />
        );
      })}
      {!inspections.length && (
        <div className="empty-state">
          <strong>Nenhum relatório encontrado</strong>
          <p>Experimente outra busca ou registre uma nova vistoria.</p>
        </div>
      )}
    </div>
  )}
</>}
 {view==='fuel'&&<FuelPanel data={data} onAdd={startRefueling} admin={user.role==='admin'} online={online} onUpdated={updateRefueling}/>}
 {fuelOpen&&local.refuelingDraft&&<RefuelingForm draft={local.refuelingDraft} data={data} aiReady={aiReady} storageError={storageError} onChange={async draft=>{if(current.current.refuelingDraft?.id!==draft.id)return false;return persist({...current.current,refuelingDraft:draft});}} onClose={()=>setFuelOpen(false)} onSave={async value=>{const clips=current.current.refuelingDraft?.voiceClips||[];if(await persist({...current.current,refuelingDraft:undefined,data:{...current.current.data,refuelings:[value,...(current.current.data.refuelings||[]).filter(r=>r.id!==value.id)]}})){void Promise.allSettled(clips.map(clip=>deleteAudioClip(clip.id)));setFuelOpen(false);setView('fuel');notify('Abastecimento salvo no aparelho. Aguarde a confirmação do envio.');void synchronize();}else throw Error('Não foi possível salvar no aparelho.');}}/>}
 {view==="trips"&&<TripsPanel data={data} onOpen={setTripId}/>}
 {view==="team"&&<>
  <div className="content-toolbar">
    <span className="quiet">{data.drivers.length} pessoas na operação</span>
    <button className="button secondary" disabled={!online} onClick={()=>setCatalog("driver")}>
      <Plus size={15}/> Adicionar pessoa
    </button>
  </div>
  <div className="team-grid">
    {data.drivers.map((driver, index) => {
      const history = sorted.filter(i => i.driverId === driver.id);
      const active = data.vehicles.find(v => sorted.find(i => i.vehicleId === v.id)?.driverId === driver.id && getVehicleState(v, data.inspections) === "out");
      return (
        <TeamCard
          key={driver.id}
          driver={driver}
          activeVehicle={active}
          inspectionsCount={history.length}
          index={index}
          onViewHistory={() => {
            navigate("inspections");
            setSearch(driver.name);
          }}
        />
      );
    })}
  </div>
</>}
 <footer className="app-footer"><span>rota. <span>Cuidado em cada percurso.</span></span><span>{syncBusy?<><LoaderCircle size={12} className="spin"/> Atualizando…</>:local.lastSync?<><CloudCheck size={13}/> Atualizado às {new Date(local.lastSync).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</>:<><Clock size={13}/> Histórico local</>}<span className="footer-dot">·</span> Frota interna SST</span></footer></main></div><nav className="bottom-nav" aria-label="Navegação inferior"><button className={"bottom-nav-item "+(view==="overview"?"active":"")} onClick={()=>navigate("overview")}><LayoutDashboard size={20}/><span>Visão geral</span></button><button className={"bottom-nav-item "+(view==="fleet"?"active":"")} onClick={()=>navigate("fleet")}><CarFront size={20}/><span>Veículos</span></button><button className="bottom-nav-action" onClick={()=>startInspection()} aria-label="Registrar"><span className="bottom-nav-fab"><Plus size={22}/></span><span className="bottom-nav-action-label">Registrar</span></button><button className={"bottom-nav-item "+(view==="inspections"?"active":"")} onClick={()=>navigate("inspections")}><ClipboardCheck size={20}/><span>Vistorias</span></button><button className={"bottom-nav-item "+(mobile?"active":"")} onClick={()=>setMobile(true)}><Menu size={20}/><span>Mais</span></button></nav>
 {toast&&<div className="toast" role="status"><CheckCircle2 size={18}/>{toast}</div>}
 {wizard&&local.draft&&<InspectionWizard draft={local.draft} data={data} onChange={setDraft} onClose={()=>setWizard(false)} onFinish={finish} storageError={storageError} onDiscard={async()=>{const clips=current.current.draft?.voiceClips||[];if(await persist({...current.current,draft:undefined})){await Promise.allSettled(clips.map(clip=>deleteAudioClip(clip.id)));setWizard(false);notify("Rascunho descartado.")}}} aiReady={aiReady} notify={notify} onAssistant={()=>setAssistant(true)}/>}
 {tripId&&(()=>{const trip=buildTrips(data.inspections).find(t=>t.id===tripId);if(!trip)return null;return <TripDetail trip={trip} data={data} admin={user.role==="admin"} online={online} onClose={()=>setTripId(undefined)} onInspection={i=>{setTripId(undefined);setReport(i);}} onFinding={openFindingReview} onLinked={async link=>{const next={...current.current,data:{...current.current.data,inspections:current.current.data.inspections.map(i=>i.id===link.returnId?{...i,previousId:link.departureId,linkNote:{note:link.note,at:link.at,actor:link.actor,originalPreviousId:link.originalPreviousId}}:i)}};if(!await persist(next)){current.current=next;setLocal(next);}setTripId(link.departureId);void synchronize();}}/>;})()}
 {report&&<Report inspection={data.inspections.find(i=>i.id===report.id)||report} data={data} onReview={()=>{const i=data.inspections.find(i=>i.id===report.id)||report;const f=i.findings.find(f=>!f.resolved)||i.findings[0];if(f)openFindingReview(i,f);}} onOpenTrip={()=>{const trip=buildTrips(data.inspections).find(t=>t.departure?.id===report.id||t.returned?.id===report.id);if(trip){setReport(undefined);setTripId(trip.id);}}} onClose={()=>setReport(undefined)}/>}
 {assistant&&<Assistant data={data} draft={wizard?local.draft:undefined} configured={aiReady} online={online} onApply={async(suggestion)=>{if(!local.draft)return;await setDraft({...local.draft,...(suggestion.odometer!==null?{odometer:suggestion.odometer}:{}),...(suggestion.fuel!==null?{fuel:suggestion.fuel}:{}),...(suggestion.destination?{destination:suggestion.destination}:{}),findings:[...local.draft.findings,...suggestion.findings.map((f:any)=>({...f,id:crypto.randomUUID()}))]});notify("Sugestões aplicadas ao rascunho. Confira antes de confirmar.");setAssistant(false)}} onClose={()=>setAssistant(false)}/>}
 {settings&&<Modal title="Configurações" onClose={()=>setSettings(false)}><div className="environment-card"><ShieldCheck size={28}/><h3>Sua operação, bem cuidada.</h3><p>Os registros iniciais são fictícios. As fotos de exemplo foram geradas por IA. Novas vistorias usam os dados e as fotos inseridos pelo operador.</p></div><div className="settings-row"><span><CloudCheck size={17}/> Histórico central</span><b>{local.lastSync?"Conectado":"Aguardando conexão"}</b></div><div className="settings-row"><span><Sparkles size={17}/> Assistente via OpenRouter</span><b>{aiReady?"Ativo":"Não configurado"}</b></div><div className="settings-row"><span><ShieldCheck size={17}/> Coleta offline</span><b>{offlineReady?"Preparado neste navegador":"Abra a versão publicada para preparar"}</b></div><div className="settings-row"><span><CloudUpload size={17}/> Vistorias aguardando envio</span><b>{pending}</b></div><div className="settings-actions">{user.role==="admin"&&<><button className="button secondary" onClick={()=>{setSettings(false);setUserManager(true)}}>Gerenciar acessos</button><button className="button secondary" onClick={async()=>{notify("Gerando backup de dados e fotos…");const response=await fetch("/api/admin/backup",{method:"POST"});if(response.ok){const link=document.createElement("a");link.href="/api/admin/backup?download=latest";link.download="backup-rota.tar.gz";link.click()}else notify("Não foi possível gerar o backup agora.")}}>Baixar backup</button></>}<button className="button secondary" onClick={()=>{setSettings(false);setPasswordModal(true)}}>Alterar senha</button><button className="button secondary" onClick={()=>{if(!pending||window.confirm("Há vistorias salvas apenas neste aparelho. Elas serão preservadas para o seu próximo acesso. Deseja sair?"))void onLogout()}}>Sair da conta</button></div><p className="helper">O uso offline exige uma primeira abertura com conexão. O envio é retomado com o aplicativo aberto. Registros salvos apenas no aparelho ainda não são um backup no servidor.</p><PwaInstallHint/><div className="modal-actions"><button className="button secondary" onClick={async()=>{if(navigator.storage?.persist){const result=await navigator.storage.persist();notify(result?"Armazenamento persistente autorizado.":"O navegador não concedeu persistência. Sincronize regularmente.")}}}>Preparar armazenamento</button>{installEvent&&<button className="button primary" onClick={async()=>{await installEvent.prompt();setInstallEvent(undefined)}}>Instalar Rota</button>}</div></Modal>}
 {vehicleDetail&&<Modal title="Histórico do veículo" onClose={()=>setVehicleDetail(undefined)}><div className="vehicle-detail-hero"><CarIllustration type={vehicleDetail.illustration}/><h2>{vehicleDetail.model}</h2><span className="plate">{vehicleDetail.plate}</span><Badge state={getVehicleState(vehicleDetail,data.inspections)}/></div><div className="detail-kvs"><div><span>Unidade</span><strong>{vehicleDetail.unit}</strong></div><div><span>Hodômetro mais recente</span><strong>{km(sorted.find(i=>i.vehicleId===vehicleDetail.id)?.odometer||vehicleDetail.odometer)}</strong></div><div><span>Referência de manutenção</span><strong>{km(vehicleDetail.maintenanceAt)}</strong></div></div><VehicleFindings vehicle={vehicleDetail} inspections={sorted} onReview={openFindingReview}/><FuelPanel data={data} vehicleId={vehicleDetail.id} onAdd={startRefueling} admin={user.role==='admin'} online={online} onUpdated={updateRefueling}/><h3 className="small-title">Histórico completo de utilizações</h3><TripsPanel data={data} vehicleId={vehicleDetail.id} onOpen={id=>{setVehicleDetail(undefined);setTripId(id);}}/></Modal>}
 {userManager&&<UserManager currentId={user.id} onClose={()=>setUserManager(false)}/>} {passwordModal&&<ChangePassword onClose={()=>setPasswordModal(false)}/>} {resolution&&(()=>{const inspection=data.inspections.find(i=>i.id===resolution.inspection.id)||resolution.inspection;const finding=inspection.findings.find(f=>f.id===resolution.findingId);const vehicle=data.vehicles.find(v=>v.id===inspection.vehicleId);if(!finding||!vehicle)return null;return <FindingReview vehicle={vehicle} inspection={inspection} finding={finding} inspections={data.inspections} canResolve={user.role==="admin"} online={online} onClose={()=>{setResolution(undefined);setVehicleDetail(vehicle);}} onOpenReport={()=>{setResolution(undefined);setReport(inspection);}} onChanged={async updatedFinding=>{const next={...current.current,data:{...current.current.data,inspections:current.current.data.inspections.map(i=>i.id===inspection.id?{...i,findings:i.findings.map(f=>f.id===finding.id?updatedFinding:f)}:i)}};if(!await persist(next)){current.current=next;setLocal(next);}notify("Acompanhamento atualizado. A situação do veículo foi conferida.");void synchronize();}}/>;})()}
 {catalog&&<AssistedCatalogForm kind={catalog} onClose={()=>setCatalog(undefined)} onSave={async(item)=>{const key=catalog==="vehicle"?"vehicles":"drivers";await persist({...current.current,data:{...current.current.data,[key]:[item,...current.current.data[key]]}});setCatalog(undefined);notify("Cadastro adicionado à operação.")}}/>}</div>
}