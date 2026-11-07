export async function transcribeClip(blob:Blob){
 const context=new AudioContext();let decoded:AudioBuffer;
 try{decoded=await context.decodeAudioData(await blob.arrayBuffer());}catch{throw Error('Não foi possível abrir esta gravação. Ouça o áudio e tente gravar novamente.');}finally{await context.close();}
 if(decoded.duration>121)throw Error('Divida a vistoria em gravações de até 90 segundos.');
 const render=new OfflineAudioContext(1,Math.ceil(decoded.duration*16000),16000),source=render.createBufferSource();source.buffer=decoded;source.connect(render.destination);source.start();const mono=await render.startRendering(),samples=mono.getChannelData(0),buffer=new ArrayBuffer(44+samples.length*2),view=new DataView(buffer),word=(at:number,s:string)=>{for(let i=0;i<s.length;i++)view.setUint8(at+i,s.charCodeAt(i));};
 word(0,'RIFF');view.setUint32(4,36+samples.length*2,true);word(8,'WAVE');word(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,16000,true);view.setUint32(28,32000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);word(36,'data');view.setUint32(40,samples.length*2,true);samples.forEach((v,i)=>view.setInt16(44+i*2,Math.max(-1,Math.min(1,v))*32767,true));
 const form=new FormData();form.set('file',new Blob([buffer],{type:'audio/wav'}),'vistoria.wav');const r=await fetch('/api/ai/transcribe',{method:'POST',body:form}),v=await r.json().catch(()=>null);if(!r.ok||!v?.text)throw Error(v?.error||'A transcrição não foi concluída. Seu áudio permanece salvo.');return String(v.text);
}
