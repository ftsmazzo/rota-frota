export type MapPoint={x:number;y:number};
export function svgPointToPercent(x:number,y:number):MapPoint|null{
  if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>340||y<0||y>290)return null;
  return {x:Math.round(x/340*1000)/10,y:Math.round(y/290*1000)/10};
}
export function vehicleRegionAt(x:number,y:number){
  const left=x<40,right=x>60;
  const side=left?'esquerdo':'direito',doorSide=left?'esquerda':'direita';
  if(y<18)return 'Para-choque dianteiro';
  if(y>83)return 'Para-choque traseiro';
  if(left||right){
    if((x<29||x>71)&&y>=31&&y<=43)return 'Pneu dianteiro '+side;
    if((x<29||x>71)&&y>=66&&y<=79)return 'Pneu traseiro '+side;
    if(y<43)return 'Paralama dianteiro '+side;
    if(y<55)return 'Porta dianteira '+doorSide;
    if(y<68)return 'Porta traseira '+doorSide;
    return 'Paralama traseiro '+side;
  }
  if(y<27)return 'Capô';
  if(y<43)return 'Para-brisa';
  if(y<64)return 'Teto';
  if(y<79)return 'Vidro traseiro';
  return 'Porta-malas';
}
