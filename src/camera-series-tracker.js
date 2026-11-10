export function createCameraSeriesTracker({maxTipDistance=.015}={}){
 if(!Number.isFinite(maxTipDistance)||maxTipDistance<=0||maxTipDistance>.1)throw Error('Nieprawidłowy zasięg śledzenia serii.');
 let tracks=[],nextId=1;
 const validPoint=value=>value&&Number.isFinite(value.x)&&Number.isFinite(value.y)&&value.x>=0&&value.x<=1&&value.y>=0&&value.y<=1;
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 function observe(entries,time){
  if(!Number.isFinite(time)||time<0)throw Error('Śledzenie serii wymaga czasu klatki.');
  const values=Array.isArray(entries)?entries.filter(entry=>validPoint(entry?.point)):[];
  if(!values.length){tracks=[];return {entries:[],orderKnown:true,changed:false};}
  const available=tracks.map(track=>({...track,matched:false})),result=[],nextTracks=[];
  for(const entry of values){
   let best=-1,bestDistance=Infinity;
   for(let index=0;index<available.length;index++){
    if(available[index].matched)continue;
    const current=distance(entry.point,available[index].point);
    if(current<=maxTipDistance&&current<bestDistance){best=index;bestDistance=current;}
   }
   if(best>=0){
    const track=available[best];track.matched=true;track.point={...entry.point};track.lastSeen=time;
    result.push({...entry,seriesId:track.id,appearedAt:track.started});nextTracks.push(track);
   }else{
    const track={id:nextId++,point:{...entry.point},started:time};
    result.push({...entry,seriesId:track.id,appearedAt:time});nextTracks.push(track);
   }
  }
  tracks=nextTracks;
  const byAppearance=[...result].sort((a,b)=>a.appearedAt-b.appearedAt||a.seriesId-b.seriesId);
  const orderKnown=byAppearance.every((item,index)=>index===0||item.appearedAt!==byAppearance[index-1].appearedAt);
  return {entries:byAppearance,orderKnown,changed:true};
 }
 function commit(entries){
  const ids=new Set((Array.isArray(entries)?entries:[]).map(entry=>entry.seriesId));
  tracks=tracks.filter(track=>!ids.has(track.id));
 }
 function clear(){tracks=[];}
 return {observe,commit,clear,get pending(){return tracks.map(({id,point,started})=>({id,point,started}));}};
}
