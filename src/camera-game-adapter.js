import {validDart} from './engine.js';

export const CAMERA_GAMES=Object.freeze(['501','301','201','cricket','cyferki','mnoznik','jdc','sector-20']);
export const CAMERA_MODES=Object.freeze([...CAMERA_GAMES,'bull-off']);
const canonicalGame=game=>({'mnoznik-sparing':'mnoznik','jdc-duel':'jdc',training:'sector-20'}[game]||game);
const text=value=>typeof value==='string'&&value.length>0&&value.length<=4096;
const copyDart=dart=>{
 if(!validDart(dart))throw new Error('Nieprawidłowe pole lotki. Popraw odczyt przed zatwierdzeniem.');
 return {number:dart.number,multiplier:dart.multiplier};
};
const copyDarts=darts=>{
 if(!Array.isArray(darts)||darts.length<1||darts.length>3)throw new Error('Zatwierdź od jednej do trzech odczytanych lotek. Brak odczytu nie oznacza pudła.');
 return Array.from(darts,copyDart);
};

/** Translate a confirmed physical dart to the EXISTING engine input; never writes a score. */
export function cameraDartInput(dart,{game,target,phase,twentyLocked=false,blocked=false}={}){
 const hit=copyDart(dart),mode=canonicalGame(game);
 if(!CAMERA_MODES.includes(mode))throw new Error('Nieznana gra kamery.');
 if(blocked)throw new Error('Poczekaj na swoją kolejkę lub wznów grę.');
 if(mode==='bull-off')return {value:hit.number===25?hit.number*hit.multiplier:0};
 if(mode==='cyferki'||mode==='mnoznik'&&phase==='hits'){
  if(!Number.isInteger(target)||!(target>=1&&target<=20||mode==='cyferki'&&target===25))throw new Error('Najpierw wybierz cel gry.');
  return {value:hit.number===target?hit.multiplier:0};
 }
 if(mode==='mnoznik'){
  if(phase!=='score')throw new Error('Nieznana faza Mnożnika.');
  return {value:hit.number*hit.multiplier};
 }
 if(mode==='cricket'&&twentyLocked&&hit.number===20)throw new Error('20 jest zablokowana. Potwierdź ten rzut jako pudło zgodnie z zasadami gry.');
 return hit;
}

/** revision must change after a dart, undo, next player, target change or new leg. */
export function cameraContextKey({game,sessionId,revision,player,generation=0}={}){
 if(!CAMERA_MODES.includes(canonicalGame(game))||!text(sessionId)||
  !(text(revision)||Number.isSafeInteger(revision)&&revision>=0)||
  !(text(player)||Number.isSafeInteger(player)&&player>=0)||
  !(text(generation)||Number.isSafeInteger(generation)&&generation>=0))throw new Error('Brak bieżącego kontekstu gry.');
 return JSON.stringify([game,sessionId,revision,player,generation]);
}

/** An in-memory review gate. Call confirm only from the user's confirmation action.
 * Capture IDs identify frames, not score labels: two S7 darts are both legitimate.
 * A caller must also compare current camera readiness and persist via the owning engine.
 */
export function createCameraReview({maxAgeMs=30000,now=Date.now}={}){
 if(!Number.isFinite(maxAgeMs)||maxAgeMs<=0||typeof now!=='function')throw new Error('Nieprawidłowy czas ważności odczytu.');
 let pending=null;
 const used=new Map();
 const clock=()=>{const time=now();if(!Number.isFinite(time))throw new Error('Nie można sprawdzić czasu odczytu.');return time;};
 function validateTime(capturedAt,time){
  if(!Number.isFinite(capturedAt)||capturedAt>time||time-capturedAt>maxAgeMs)throw new Error('Odczyt kamery wygasł. Rozpoznaj lotki ponownie.');
 }
 function retire(value){if(value)used.set(value.id,value.capturedAt);}
 const snapshot=()=>pending?{...pending,darts:pending.darts.map(copyDart)}:null;
 return {
  propose({id,contextKey,capturedAt,darts}={}){
   const time=clock();validateTime(capturedAt,time);
   for(const [key,at]of used)if(time-at>maxAgeMs)used.delete(key);
   if(!text(id)||!text(contextKey))throw new Error('Odczyt nie ma identyfikatora lub kontekstu gry.');
   if(used.has(id)||pending?.id===id)throw new Error('Ten odczyt został już obsłużony.');
   const next={id,contextKey,capturedAt,darts:copyDarts(darts)};
   retire(pending);pending=next;return snapshot();
  },
  confirm({id,contextKey,confirmed=false,darts}={}){
   if(confirmed!==true)throw new Error('Najpierw sprawdź i zatwierdź odczyt.');
   if(!pending||pending.id!==id||used.has(id))throw new Error('Brak nowego odczytu do zatwierdzenia.');
   validateTime(pending.capturedAt,clock());
   if(pending.contextKey!==contextKey)throw new Error('Gra lub kolejka zmieniła się. Rozpoznaj lotki ponownie.');
   const result=copyDarts(darts===undefined?pending.darts:darts);
   retire(pending);pending=null;return result;
  },
  reject(id){if(pending?.id!==id)return false;retire(pending);pending=null;return true;},
  clear(){retire(pending);pending=null;},
  get pending(){return snapshot();}
 };
}
