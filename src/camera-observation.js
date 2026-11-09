import {detectDartChange} from './camera-difference.js';

/** Frame ownership for the assisted detector; no camera, DOM, storage or game writes.
 * sourceKey must change with source, calibration, crop OR dimensions.
 * time is video.currentTime, never a wall-clock substitute for a frozen frame.
 */
export function createCameraObservation({width=640,height=640,center=[.5,.5]}={}){
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<16||height<16||width*height>4e6)throw new Error('Nieprawidłowy rozmiar klatki.');
 if(!Array.isArray(center)||center.length!==2||center.some(v=>!Number.isFinite(v)||v<0||v>1))throw new Error('Nieprawidłowy środek tarczy.');
 center=[...center];
 let empty=null,baseline=null,previous=null,pending=null,source=null,context=null,lastTime=null,sequence=0;
 const text=v=>typeof v==='string'&&v.length>0&&v.length<=8192;
 const copyFrame=frame=>{
  if(!(frame instanceof Uint8Array||frame instanceof Uint8ClampedArray)||frame.length!==width*height)throw new Error('Nieprawidłowa klatka obserwacji.');
  return new Uint8Array(frame);
 };
 function validate({time,contextKey,sourceKey}={}){if(!Number.isFinite(time)||time<0||!text(contextKey)||!text(sourceKey))throw new Error('Brak tożsamości świeżej klatki, gry lub kamery.');}
 function invalidate(){empty=baseline=previous=pending=null;source=context=lastTime=null;}
 function pause(){pending=null;previous=null;}
 function setEmpty(frame,meta){
  validate(meta);const saved=copyFrame(frame);empty=saved;baseline=saved.slice();previous=null;pending=null;
  source=meta.sourceKey;context=meta.contextKey;lastTime=meta.time;
  return {status:'ready',reason:'Puste tło przyjęte. Odczyt wymaga nowych nieruchomych klatek.'};
 }
 function snapshot(value){
  if(!value)return null;
  const copy={...value,frame:value.frame.slice()};
  if(value.candidate)copy.candidate={...value.candidate};
  if(value.alternate)copy.alternate={...value.alternate};
  if(value.autoCandidate)copy.autoCandidate={...value.autoCandidate};
  if(value.autoMetrics)copy.autoMetrics={...value.autoMetrics,endpointWidthsPx:[...value.autoMetrics.endpointWidthsPx]};
  if(value.candidates)copy.candidates=value.candidates.map(item=>({...item,candidate:{...item.candidate},alternate:{...item.alternate},autoCandidate:{...item.autoCandidate}}));
  return copy;
 }
 function observe(frame,meta){
  validate(meta);const captured=copyFrame(frame);
  if(!empty)return {status:'uninitialized',reason:'Najpierw ustaw puste tło.'};
  if(meta.sourceKey!==source){invalidate();return {status:'uninitialized',reason:'Kamera, kalibracja lub kadr zmieniły się. Ustaw nowe puste tło.'};}
  if(meta.time<lastTime){invalidate();return {status:'uninitialized',reason:'Strumień został uruchomiony ponownie. Ustaw nowe puste tło.'};}
  if(meta.time===lastTime){pending=null;return {status:'stale',reason:'Brak nowej klatki. Odczyt wstrzymany.'};}
  if(meta.contextKey!==context){pending=null;previous=null;context=meta.contextKey;}
  lastTime=meta.time;pending=null;
  const result=detectDartChange(baseline,captured,previous,{width,height,emptyReference:empty,center});previous=captured;
  if(result.status==='candidate'||result.status==='candidates'){
   pending={...result,id:`camera-frame-${++sequence}`,time:meta.time,contextKey:context,sourceKey:source,frame:captured};
   return snapshot(pending);
  }
  return result;
 }
 function accept(id,{applied=false,contextKey}={}){
  if(applied!==true)throw new Error('Najpierw zapisz zatwierdzony rzut w grze.');
  if(!pending||pending.id!==id||pending.contextKey!==contextKey)throw new Error('Odczyt wygasł lub gra zmieniła się.');
  baseline=pending.frame.slice();previous=pending.frame.slice();pending=null;return true;
 }
 function reject(id){if(!pending||pending.id!==id)return false;pending=null;return true;}
 return {setEmpty,observe,accept,reject,pause,invalidate,get pending(){return snapshot(pending);},get ready(){return !!empty;}};
}
