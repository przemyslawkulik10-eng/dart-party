import {validDart} from './engine.js';

// Temporal ownership gate only. Eligibility MUST come from a separately verified
// detector; repeated observations cannot turn a wrong tip into a correct one.
// time is video.currentTime (seconds), never wall-clock time for a frozen stream.
export function createCameraAutoSession({minFrames=3,minStableMs=700,maxTipDistance=.015,maxGapMs=1200}={}){
 if(!Number.isSafeInteger(minFrames)||minFrames<3||minFrames>100||
  !Number.isFinite(minStableMs)||minStableMs<700||!Number.isFinite(maxGapMs)||maxGapMs<=0||
  !Number.isFinite(maxTipDistance)||maxTipDistance<=0||maxTipDistance>.1)throw Error('Nieprawidłowe parametry automatycznego odczytu.');
 let source=null,context=null,turn=null,lastTime=null,sequence=0;
 let waitingForEmpty=true,acceptedDarts=0,candidate=null,emptyRun=null,pending=null,reason='Potrzebna stabilna pusta tarcza.';
 const text=value=>typeof value==='string'&&value.length>0&&value.length<=8192;
 const dropCandidate=()=>{candidate=null;pending=null;};
 function invalidate(message='Odczyt unieważniony. Potrzebna stabilna pusta tarcza.'){
  source=context=turn=lastTime=null;acceptedDarts=0;waitingForEmpty=true;dropCandidate();emptyRun=null;reason=message;
 }
 function pause(message='Odczyt wstrzymany. Poczekaj na świeże klatki.'){
  dropCandidate();emptyRun=null;reason=message;
 }
 const blocked=message=>{pause(message);return {status:'blocked',reason:message};};
 const stable=(run,time)=>run.frames>=minFrames&&(time-run.started)*1000>=minStableMs-1e-6;
 function observe(value={}){
  const {time,sourceKey,contextKey,turnKey,status,point,field,autoEligible=false,emptyBoard=false,turnComplete=false,darts}=value;
  if(!Number.isFinite(time)||time<0||!text(sourceKey)||!text(contextKey)||!text(turnKey)){
   invalidate('Brak tożsamości świeżej klatki lub kolejki.');throw Error(reason);
  }
  if(source!==sourceKey){invalidate('Źródło zmienione. Potrzebna stabilna pusta tarcza.');source=sourceKey;context=contextKey;turn=turnKey;}
  if(lastTime!==null&&time<=lastTime){
   if(time<lastTime){invalidate('Czas kamery cofnął się. Potrzebne nowe puste tło.');return {status:'blocked',reason};}
   return blocked('Brak nowej klatki.');
  }
  if(lastTime!==null&&(time-lastTime)*1000>maxGapMs)pause('Przerwa w obrazie. Sprawdzam od początku.');
  lastTime=time;
  if(turn!==turnKey){turn=turnKey;acceptedDarts=0;waitingForEmpty=true;emptyRun=null;dropCandidate();}
  if(context!==contextKey){context=contextKey;emptyRun=null;dropCandidate();}
  if(turnComplete){waitingForEmpty=true;dropCandidate();}
  if(['removed','lighting','uninitialized','lost'].includes(status)){
   waitingForEmpty=true;return blocked('Obraz lub lotki zmieniły się. Potrzebna stabilna pusta tarcza.');
  }
  if(!['empty','candidate','candidates'].includes(status))return blocked('Brak jednoznacznego nieruchomego odczytu.');
  if(waitingForEmpty){
   dropCandidate();
   // `empty` relative to the last accepted dart is NOT an empty board.
   if(status!=='empty'||emptyBoard!==true){emptyRun=null;reason='Czekam na pustą tarczę.';return {status:'waiting-empty',reason};}
   if(!emptyRun)emptyRun={started:time,frames:0};
   emptyRun.frames++;
   if(!stable(emptyRun,time)){reason='Sprawdzam stabilność pustej tarczy.';return {status:'waiting-empty',reason};}
   // A completed turn cannot start recording again under its old identity.
   if(turnComplete||acceptedDarts>=3){reason='Tarcza pusta. Czekam na następną kolejkę.';return {status:'waiting-turn',reason};}
   waitingForEmpty=false;emptyRun=null;reason='Gotowy na nową lotkę.';return {status:'armed',reason};
  }
  if(status==='empty'){dropCandidate();reason='Czekam na nową lotkę.';return {status:'waiting',reason};}
  // One dart arrives as `candidate`; a whole turn can arrive as `candidates`.
  // Every entry must pass the same rules on its own — one uncertain dart blocks
  // the entire series, so nothing is half-saved.
  const entries=Array.isArray(darts)&&darts.length?darts:[{point,field,autoEligible}];
  if(entries.length>3||(status==='candidates'&&entries.length<2)||(status==='candidate'&&entries.length!==1))return blocked('Brak jednoznacznego zestawu lotek.');
  const normalized=[];
  for(const entry of entries){
   const entryPoint=entry&&entry.point,entryField=entry&&entry.field;
   const validPoint=entryPoint&&Number.isFinite(entryPoint.x)&&Number.isFinite(entryPoint.y)&&entryPoint.x>=0&&entryPoint.x<=1&&entryPoint.y>=0&&entryPoint.y<=1;
   if(entry?.autoEligible!==true||!validPoint||!validDart(entryField)||entryField.number===0||entryField.nearWire!==false)return blocked('Propozycja wymaga ręcznego sprawdzenia grotu.');
   normalized.push({point:{x:entryPoint.x,y:entryPoint.y},dart:{number:entryField.number,multiplier:entryField.multiplier}});
  }
  const similar=(a,b)=>a.dart.number===b.dart.number&&a.dart.multiplier===b.dart.multiplier&&
   Math.hypot(a.point.x-b.point.x,a.point.y-b.point.y)<=maxTipDistance;
  const same=candidate&&candidate.items.length===normalized.length&&(()=>{
   const old=[...candidate.items];
   for(const item of normalized){const index=old.findIndex(value=>similar(value,item));if(index<0)return false;old.splice(index,1);}
   return true;
  })();
  if(!same){dropCandidate();candidate={started:time,frames:0,items:normalized};}
  candidate.frames++;
  if(pending)return {status:'awaiting-commit',reason:'Odczyt czeka na wynik zapisu.'};
  if(!stable(candidate,time)){reason='Sprawdzam zgodność kolejnych klatek.';return {status:'tracking',reason};}
  pending={token:`camera-auto-${++sequence}`,source,context,turn,darts:candidate.items.map(item=>({...item.dart}))};
  reason='Stabilna propozycja gotowa do zapisu.';
  return {status:'ready',token:pending.token,dart:{...pending.darts[0]},darts:pending.darts.map(dart=>({...dart})),sourceKey:source,contextKey:context,turnKey:turn,reason};
 }
 function commit(token,{applied=false}={}){
  if(!pending||pending.token!==token)throw Error('Brak bieżącej propozycji automatycznego odczytu.');
  if(applied!==true){invalidate('Zapis niepotwierdzony. Sprawdź wynik gry przed wznowieniem.');return {status:'blocked',reason};}
  acceptedDarts+=pending.darts.length;dropCandidate();emptyRun=null;waitingForEmpty=acceptedDarts>=3;
  reason=waitingForEmpty?'Kolejka zakończona. Czekam na pustą tarczę.':'Lotka zapisana. Czekam na następną.';
  return {status:'accepted',acceptedDarts,waitingForEmpty,reason};
 }
 return {observe,commit,invalidate,pause,get state(){return {sourceKey:source,contextKey:context,turnKey:turn,lastTime,acceptedDarts,waitingForEmpty,pendingToken:pending?.token??null,reason};}};
}
