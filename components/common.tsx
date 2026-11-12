"use client";
import React from "react";
import {X,Check,AlertTriangle,Search} from "lucide-react";
import type {Driver} from "../lib/model";

export function Badge({state}:{state:string}){
  const labels:Record<string,string>={available:"Disponível",out:"Em uso",attention:"Atenção",maintenance:"Em reparo"};
  return <span className={"badge "+(state==="available"?"green":state==="out"?"blue":"amber")}><i/>{labels[state]||state}</span>;
}

export function Avatar({driver,small=false}:{driver?:Driver;small?:boolean}){
  return <span className={"avatar "+(small?"small":"")} style={{background:driver?.color||"#e5ecdf"}}>{driver?.initials||"LF"}</span>;
}

export function Field({label,children,hint}:{label:string;children:React.ReactNode;hint?:string}){
  return <label className="field"><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>;
}

export function Modal({title,children,onClose}:{title:string;children:React.ReactNode;onClose:()=>void}){
  return (
    <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-drag-handle" aria-hidden="true" />
        <header>
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={20}/></button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}

export function SearchBox({value,onChange,placeholder="Buscar veículo, placa..."}:{value:string;onChange:(s:string)=>void;placeholder?:string}){
  return (
    <div className="searchbox">
      <Search size={17}/>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}/>
      {value&&<button className="icon-button" aria-label="Limpar busca" onClick={()=>onChange("")}><X size={15}/></button>}
    </div>
  );
}

export function DateInput({value,onChange,min,ariaLabel}:{value:string;onChange:(e:React.ChangeEvent<HTMLInputElement>)=>void;min?:string;ariaLabel?:string}){
  return (
    <div className="date-input-wrap">
      <input type="date" value={value} min={min} onChange={onChange} aria-label={ariaLabel} placeholder="Qualquer data"/>
      {!value&&<span className="date-placeholder" aria-hidden="true">Qualquer data</span>}
    </div>
  );
}
