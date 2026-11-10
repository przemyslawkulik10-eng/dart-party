import {accountOwner} from './account-storage.js';
import {cameraDartInput,cameraContextKey} from './camera-game-adapter.js';

// One active render owns the input. Re-rendering invalidates all earlier camera proposals.
export function createCameraGameSession({onListenerError=error=>console.error('Błąd widoku kamery:',error),getAccount=accountOwner}={}){
 let binding=null,sequence=0,applying=false;
 const listeners=new Set();
 function getCameraGame(){
  if(!binding||!binding.owner.isConnected||binding.blocked)return null;
  if(binding.account!==getAccount()){binding=null;sequence++;return null;}
  const {apply,owner,account,...context}=binding;return Object.freeze({...context});
 }
 function notifyListener(listener,state){try{listener(state);}catch(error){try{onListenerError(error);}catch(reportError){console.error('Nie udało się zgłosić błędu widoku kamery:',reportError);}}}
 function notify(){const state=getCameraGame();for(const listener of [...listeners])notifyListener(listener,state);}
 function bindCameraGame(value){
  if(value===null){binding=null;sequence++;notify();return null;}
  if(!value||typeof value.owner!=='object'||value.owner===null||typeof value.apply!=='function'||value.apply.constructor?.name==='AsyncFunction')throw new Error('Nieprawidłowe powiązanie kamery z grą.');
  const {owner,game,sessionId,player,label='',target,phase,turn,twentyLocked=false,blocked=false,score=null,apply}=value;
  cameraContextKey({game,sessionId,player,revision:sequence+1});
  binding={owner,game,sessionId,player,label,target,phase,turn,twentyLocked:!!twentyLocked,blocked:!!blocked,score:Number.isFinite(score)?score:null,apply,account:getAccount(),revision:++sequence};
  notify();return getCameraGame();
 }
 function applyCameraDart(dart,expectedRevision){
  const current=binding,active=getCameraGame();
  if(applying)throw new Error('Poprzedni odczyt jest jeszcze zapisywany.');
  if(!active||active.revision!==expectedRevision)throw new Error('Gra lub kolejka zmieniła się. Odczytaj lotkę ponownie.');
  // Validation cannot consume a proposal: the player may correct it and retry.
  const input=cameraDartInput(dart,active);
  applying=true;
  try{
   const result=current.apply(input);
   if(result&&typeof result.then==='function')throw new Error('Zapis z kamery musi być synchroniczny. Sprawdź stan gry przed kolejnym odczytem.');
   if(result===false)throw new Error('Gra nie przyjęła odczytu z kamery.');
   return input;
  }finally{
   applying=false;
   // A throwing handler could already have persisted data. Never replay that revision.
   // A handler that re-rendered owns a newer binding; leave that new state untouched.
   if(binding===current){binding={...current,revision:++sequence};notify();}
  }
 }
 function subscribeCameraGame(listener){
  if(typeof listener!=='function')throw new Error('Nieprawidłowy odbiorca kontekstu kamery.');
  listeners.add(listener);notifyListener(listener,getCameraGame());return ()=>listeners.delete(listener);
 }
 return {getCameraGame,bindCameraGame,applyCameraDart,subscribeCameraGame};
}
const session=createCameraGameSession();
export const {getCameraGame,bindCameraGame,applyCameraDart,subscribeCameraGame}=session;
