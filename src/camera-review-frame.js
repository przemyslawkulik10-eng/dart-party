import {detectDartChange} from './camera-difference.js';

// A pending proposal is writable only after a NEW unchanged, motion-free frame.
// The caller must call check again immediately before writing the reviewed dart.
export function createCameraReviewFrame({width=640,height=640}={}){
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<16||height<16||width*height>4e6)throw Error('Nieprawidłowy rozmiar klatki.');
 let reference=null,empty=null,previous=null,lastTime=null,stable=false;
 const copy=frame=>{
  if(!(frame instanceof Uint8Array||frame instanceof Uint8ClampedArray)||frame.length!==width*height)throw Error('Nieprawidłowa klatka potwierdzenia.');
  return new Uint8Array(frame);
 };
 const validTime=time=>{if(!Number.isFinite(time)||time<0)throw Error('Nieprawidłowy czas klatki.');};
 return {
  begin(frame,emptyReference,time){
   validTime(time);const saved=copy(frame),background=copy(emptyReference);
   reference=saved;previous=saved;empty=background;lastTime=time;stable=false;
  },
  check(frame,time){
   stable=false;validTime(time);const current=copy(frame);
   if(!reference)throw Error('Brak obrazu do potwierdzenia.');
   if(time<=lastTime)return {status:'stale',reason:'Poczekaj na nową klatkę przed zatwierdzeniem.'};
   const result=detectDartChange(reference,current,previous,{width,height,emptyReference:empty});
   previous=current;lastTime=time;stable=result.status==='empty';return result;
  },
  reset(){reference=empty=previous=null;lastTime=null;stable=false;},
  get stable(){return stable;}
 };
}
