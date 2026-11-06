"use client";
import {useEffect,useState} from "react";
import {Smartphone} from "lucide-react";

export function PwaInstallHint(){
  const [visible,setVisible]=useState(false);
  useEffect(()=>{
    const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    const installed=window.matchMedia('(display-mode: standalone)').matches||(navigator as Navigator&{standalone?:boolean}).standalone;
    setVisible(ios&&!installed);
  },[]);
  if(!visible)return null;
  return <aside className="pwa-install-hint"><Smartphone size={20}/><div><strong>Instale o Rota no seu iPhone.</strong><p>No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início. Abra pelo ícone Rota para usar como aplicativo.</p></div></aside>;
}
