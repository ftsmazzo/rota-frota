"use client";
import {useRef} from 'react';
import {svgPointToPercent,type MapPoint} from '../lib/vehicle-map';

export function CarMap({onPoint,points=[],selected}:{onPoint?:(x:number,y:number)=>void;points?:{x?:number;y?:number}[];selected?:MapPoint}){
  const svg=useRef<SVGSVGElement>(null);
  return <div className={'car-map '+(onPoint?'interactive':'')} role={onPoint?'button':'img'} tabIndex={onPoint?0:undefined} aria-label="Mapa de avarias do veículo"
    onClick={onPoint?event=>{
      const element=svg.current,matrix=element?.getScreenCTM();if(!element||!matrix)return;
      const point=element.createSVGPoint();point.x=event.clientX;point.y=event.clientY;
      const local=point.matrixTransform(matrix.inverse()),percent=svgPointToPercent(local.x,local.y);
      if(percent)onPoint(percent.x,percent.y);
    }:undefined}
    onKeyDown={onPoint?event=>{
      const point=selected||{x:50,y:53};
      const movement:Record<string,MapPoint>={ArrowLeft:{x:-3,y:0},ArrowRight:{x:3,y:0},ArrowUp:{x:0,y:-3},ArrowDown:{x:0,y:3}};
      if(event.key==='Enter'||event.key===' '){event.preventDefault();onPoint(point.x,point.y);}
      else if(movement[event.key]){event.preventDefault();const delta=movement[event.key];onPoint(Math.max(0,Math.min(100,point.x+delta.x)),Math.max(0,Math.min(100,point.y+delta.y)));}
    }:undefined}>
    <svg ref={svg} viewBox="0 0 340 290" fill="none" aria-hidden="true">
      <text x="170" y="19" textAnchor="middle" fill="#819087" fontSize="12" letterSpacing="2">FRENTE</text>
      <path d="M112 65q4-24 58-24t58 24l12 38v123q-3 26-70 26t-70-26V103Z" fill="#eef2ed" stroke="#6c877b" strokeWidth="2"/>
      <path d="m114 103 12-36q44-16 88 0l12 36-15 22h-82Z" fill="#cedcd4" stroke="#6c877b"/>
      <path d="m125 210 7-27h76l8 27-9 17h-75Z" fill="#cedcd4" stroke="#6c877b"/>
      <rect x="131" y="129" width="78" height="48" rx="9" fill="#dfe8e0" stroke="#9aac9e"/>
      <path d="m108 119 17 13v44l-17 22Zm124 0-17 13v44l17 22Z" fill="#d0ddd4" stroke="#7c9585"/>
      <path d="M106 155h18m92 0h18M136 48v9m68-9v9M111 233l25 6m67 0 25-6" stroke="#7a9586" strokeWidth="3"/>
      <rect x="90" y="93" width="8" height="29" rx="3" fill="#4d6659"/><rect x="242" y="93" width="8" height="29" rx="3" fill="#4d6659"/>
      <rect x="90" y="195" width="8" height="29" rx="3" fill="#4d6659"/><rect x="242" y="195" width="8" height="29" rx="3" fill="#4d6659"/>
      <text x="170" y="278" textAnchor="middle" fill="#819087" fontSize="12" letterSpacing="2">TRASEIRA</text>
      {points.map((point,index)=>typeof point.x==='number'&&typeof point.y==='number'&&Number.isFinite(point.x)&&Number.isFinite(point.y)?<g key={index} className="car-map-pin" transform={`translate(${point.x*3.4} ${point.y*2.9})`} pointerEvents="none"><circle r="14" fill="#bd8c56" stroke="white" strokeWidth="2"/><text textAnchor="middle" dy="4" fill="white" fontSize="12" fontWeight="700">{index+1}</text></g>:null)}
      {selected&&<g className="car-map-selection" transform={`translate(${selected.x*3.4} ${selected.y*2.9})`} pointerEvents="none"><circle r="22" fill="#d6ec9a55" stroke="#1c4435" strokeDasharray="4 3"/><circle r="14" fill="#d6ec9a" stroke="#1c4435" strokeWidth="2"/><text textAnchor="middle" dy="4" fill="#173d32" fontSize="12" fontWeight="700">{points.length+1}</text></g>}
    </svg>
  </div>;
}
