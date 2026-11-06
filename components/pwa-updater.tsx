"use client";
import {useEffect,useState} from 'react';
import {LoaderCircle,RefreshCw} from 'lucide-react';
import {APP_RELEASE} from '../lib/release';
import {flushLocalWrites} from '../lib/offline';

export function PwaUpdater(){
  const [available,setAvailable]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  useEffect(()=>{
    if(['localhost','127.0.0.1'].includes(location.hostname))return;
    let active=true,checking=false;
    async function check(){
      if(checking||!navigator.onLine||document.visibilityState==='hidden')return;
      checking=true;
      try{
        const response=await fetch('/api/version',{cache:'no-store'});
        const data=await response.json().catch(()=>null);
        if(active&&response.ok&&typeof data?.version==='string')setAvailable(data.version!==APP_RELEASE);
        if('serviceWorker' in navigator){
          const registration=await navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'});
          await registration.update();
        }
      }catch{}finally{checking=false;}
    }
    void check();const tick=setInterval(check,120000);
    window.addEventListener('online',check);window.addEventListener('pageshow',check);document.addEventListener('visibilitychange',check);
    return()=>{active=false;clearInterval(tick);window.removeEventListener('online',check);window.removeEventListener('pageshow',check);document.removeEventListener('visibilitychange',check)};
  },[]);
  if(!available)return null;
  return <aside className="app-update" role="status"><RefreshCw size={19}/><div><strong>Nova versão disponível.</strong><p>{error||'Atualize o Rota para receber as melhorias. O rascunho salvo neste aparelho será preservado.'}</p></div><button className="button primary" disabled={busy} onClick={async()=>{
    if(!navigator.onLine){setError('Conecte-se à internet para atualizar.');return;}
    if(document.querySelector('.recording')){setError('Pare a gravação antes de atualizar.');return;}
    setBusy(true);setError('');try{await flushLocalWrites();window.location.reload();}catch{setError('Não foi possível confirmar o salvamento do rascunho. Continue a vistoria antes de atualizar.');setBusy(false);}
  }}>{busy?<LoaderCircle size={15} className="spin"/>:<RefreshCw size={15}/>} Atualizar</button></aside>;
}
