import {CameraSource,cameraError,cameraOptions,readCameraSelection,saveCameraSelection} from './camera-source.js';
import {CameraFrameGate} from './camera-health.js';
import {calibrate,project,fieldAt} from './camera-geometry.js';
import {imagePoint,viewZoom} from './camera-view.js';
import {toGray,detectDartChange} from './camera-difference.js';
import {createCameraAutoSession} from './camera-auto-session.js';
import {createCameraReviewFrame} from './camera-review-frame.js';
import {createCameraObservation} from './camera-observation.js';
import {getCameraGame,subscribeCameraGame,applyCameraDart} from './camera-game-session.js';
import {createCameraReview} from './camera-game-adapter.js';
import {dartLabel} from './engine.js';

// The camera lives outside #app: scoring re-renders must never replace its stream.
const app=document.getElementById('app');
const shell=document.createElement('div');shell.className='camera-game-shell';app.before(shell);shell.append(app);
const bar=document.createElement('div');bar.className='camera-game-bar';
bar.innerHTML='<button type="button" class="primary" aria-expanded="false" aria-controls="camera-game-panel">Kamera · odczytaj rzut</button><span>Klawiatura pozostaje dostępna.</span>';
shell.before(bar);const launch=bar.querySelector('button');
const VERSION='01.19';
const panel=document.createElement('section');panel.id='camera-game-panel';panel.hidden=true;panel.setAttribute('aria-label','Kamera — odczyt rzutu');
panel.innerHTML=`<div class="cg-top"><h2>Kamera <span class="cg-version">v${VERSION}</span></h2><label class="cg-source"><span>Kamera</span><select data-cg="device"><option value="">Domyślna kamera</option></select></label><button type="button" data-cg="devices">Odśwież listę</button><button type="button" data-cg="close" aria-label="Zamknij kamerę">×</button></div>
<ol class="cg-steps" data-cg="steps"><li>1 · Źródło</li><li>2 · Kalibracja</li><li>3 · Pusta tarcza</li><li>4 · Odczyt</li></ol>
<div class="cg-stage" data-cg="stage"><div class="cg-scene" data-cg="scene"><video data-cg="video" autoplay muted playsinline hidden></video><div data-cg="markers"></div></div><div class="cg-reticle" data-cg="reticle" hidden></div><p class="cg-empty" data-cg="empty">Podgląd pojawi się po uruchomieniu kamery.</p></div>
<div class="cg-hud"><p class="cg-context" data-cg="context"></p><output class="cg-result" data-cg="result" aria-live="polite">Brak odczytu</output><p class="cg-status" data-cg="status" role="status" aria-live="polite">Kamera wyłączona.</p></div>
<p class="cg-guide" data-cg="guide">Uruchom kamerę i wskaż cztery brzegi tarczy.</p>
<div class="cg-actions"><button type="button" data-cg="start" class="primary">Uruchom kamerę</button></div>
<div class="cg-actions cg-view"><button type="button" data-cg="rotate" disabled>Obróć 90°</button><span class="cg-zoomgroup"><button type="button" data-cg="minus" aria-label="Pomniejsz obraz" disabled>−</button><span data-cg="zoom" class="cg-zoom">100%</span><button type="button" data-cg="plus" aria-label="Powiększ obraz" disabled>+</button></span><button type="button" data-cg="calibrate" disabled>Kalibruj ponownie</button></div>
<div class="cg-actions"><button type="button" data-cg="baseline" disabled>Pusta tarcza — zapamiętaj tło</button><button type="button" data-cg="probe" disabled>Sprawdź, czy widzę lotkę</button></div>
<div class="cg-actions"><button type="button" data-cg="read" class="primary" disabled>Rozpoznaj lotkę</button></div>
<div class="cg-actions"><button type="button" data-cg="stop" disabled>Zatrzymaj odczyt</button><button type="button" data-cg="confirm" class="primary" disabled>Zatwierdź lotkę</button><button type="button" data-cg="correct" disabled>Popraw</button></div>
<div class="cg-correction" data-cg="correction" hidden><p>Wskaż grot na podglądzie albo wybierz rzeczywiste pole. Lotka, która wypadła, daje 0.</p><label>Pole<select data-cg="number"><option value="0">Pudło / lotka wypadła — 0</option>${Array.from({length:20},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}<option value="25">BULL</option></select></label><label>Mnożnik<select data-cg="multiple"><option value="1">Pojedyncza / BULL 25</option><option value="2">Podwójna / BULL 50</option><option value="3">Potrójna</option></select></label><button type="button" data-cg="correct-save">Użyj poprawki</button></div>
<p class="cg-note">Kalibracja, widok i wybrana kamera zapisują się automatycznie — przetrwają zamknięcie karty. Test „Sprawdź, czy widzę lotkę” nic nie zapisuje. Brak wykrycia nie oznacza 0. Po wyjęciu lotek zapamiętaj ponownie pustą tarczę. Wcześniej wpisaną lotkę, która wypadła, cofnij w grze. Klawiatura gry pozostaje dostępna.</p>`;
shell.append(panel);
const $=name=>panel.querySelector(`[data-cg="${name}"]`);
// Automat na produkcji włączony decyzją Kapitana 09.11. ?cameraAuto=0 wyłącza go do prób.
const autoMode=new URLSearchParams(location.search).get('cameraAuto')!=='0';
const autoSession=createCameraAutoSession();let emptyPrevious=null,lastDiagnosticTime=-Infinity;
if(autoMode){
 $('read').textContent='Wznów automatyczne liczenie';
 panel.querySelector('.cg-note').textContent='Automatyczne liczenie: cała kolejka do trzech lotek. Pewny odczyt z kolejnych klatek zapisuje się sam, bez kliknięcia. Po trzeciej lotce gra przechodzi do następnego gracza — wyjmij wtedy wszystkie lotki. Niepewne trafienia zatrzymują zapis. Wcześniej wpisaną lotkę, która wypadła, cofnij w grze.';
}
const video=$('video'),stage=$('stage'),scene=$('scene'),gate=new CameraFrameGate(),review=createCameraReview(),reviewFrame=createCameraReviewFrame();
const analysis=document.createElement('canvas');analysis.width=analysis.height=640;
const actx=analysis.getContext('2d',{willReadFrequently:true});
let observation=createCameraObservation(),emptyGray=null,points=[],matrix=null,crop=null,sourceVersion=0;
let live=false,muted=false,starting=false,armed=false,probing=false,committing=false,pending=null;
let rotation=0,zoom=1,pan=[0,0],drag=null,suppressClick=false,connectionTimer=null,frameSize='',lastFrame=-1,lastRevision=null;
let longStorage;try{longStorage=localStorage;}catch{}
let selection=readCameraSelection(longStorage);
const guides=['Wskaż zewnętrzny brzeg D20 (góra).','Wskaż zewnętrzny brzeg D6 (prawo).','Wskaż zewnętrzny brzeg D3 (dół).','Wskaż zewnętrzny brzeg D11 (lewo).'];
// Calibration survives tab close, history restore and browser restarts.
const CAL_KEY='dart-camera-calibration-v1';
function saveCalibration(){
 try{
  if(!longStorage||points.length!==4||!matrix)return;
  longStorage.setItem(CAL_KEY,JSON.stringify({version:1,frameSize,points,rotation,zoom}));
 }catch{}
}
function clearSavedCalibration(){try{longStorage?.removeItem(CAL_KEY);}catch{}}
function restoreCalibration(){
 try{
  const saved=longStorage&&JSON.parse(longStorage.getItem(CAL_KEY)||'null');
  if(!saved||saved.version!==1||saved.frameSize!==frameSize||!Array.isArray(saved.points)||saved.points.length!==4)throw new Error('brak zapisu');
  points=saved.points.map(p=>[Number(p[0]),Number(p[1])]).filter(p=>p.every(v=>Number.isFinite(v)&&v>=0&&v<=1));
  if(points.length!==4)throw new Error('zły zapis');
  matrix=calibrate(points);crop=calibrationCrop();
  rotation=((Number(saved.rotation)||0)%360+360)%360;zoom=viewZoom(Number(saved.zoom)||1);pan=[0,0];
  clearProposal();observation.invalidate();autoSession.invalidate();emptyPrevious=null;emptyGray=null;lastFrame=-1;
  status('Kalibracja przywrócona z zapisu. Po wyjęciu lotek zapamiętaj pustą tarczę.');
 }catch{resetCalibration();}
}
const source=new CameraSource(navigator.mediaDevices,()=>stopCamera('Połączenie zakończone. Uruchom kamerę ponownie.'),value=>{muted=value;gate.reset(video.currentTime,performance.now());clearProposal();observation.pause();autoSession.pause();emptyPrevious=null;lastFrame=-1;buttons();});
function status(text){if($('status').textContent!==text)$('status').textContent=text;}
// Flaga „muted” bywa prawdziwa mimo płynących klatek Continuity, więc o gotowości
// decyduje wyłącznie świeżość klatek (gate sam wykrywa zastój po staleMs).
function ready(){return live&&gate.sample({time:video.currentTime,now:performance.now(),hidden:document.hidden});}
function key(game){return String(game.revision);}
function clearProposal(){pending=null;reviewFrame.reset();review.clear();$('result').textContent='Brak odczytu';$('correction').hidden=true;markers();}
function expireProposal(){
 // Nothing was written: the accepted board still belongs to this observation.
 // Retire the old proposal and reacquire using two fresh frames and a new ID.
 clearProposal();observation.pause();lastFrame=-1;
 status('Odczyt wygasł. Ponownie sprawdzam lotkę na świeżym obrazie.');buttons();
}
function clearBaseline(message){armed=false;probing=false;observation.invalidate();autoSession.invalidate();emptyPrevious=null;emptyGray=null;lastFrame=-1;clearProposal();if(message)status(message);buttons();}
function steps(){
 const chips=$('steps').children,index=!live?0:!matrix?1:!observation.ready?2:3;
 for(let i=0;i<chips.length;i++)chips[i].classList.toggle('cg-step-active',i===index);
}
function buttons(){
 const game=getCameraGame(),fresh=ready();
 $('start').disabled=starting;$('calibrate').disabled=!live;
 for(const name of ['rotate','minus','plus'])$(name).disabled=!live;
 $('baseline').disabled=!matrix||!fresh||probing;
 $('read').disabled=!game||!matrix||!fresh||!observation.ready||armed||probing;
 $('probe').textContent=probing?'Zatrzymaj test':'Sprawdź, czy widzę lotkę';
 $('probe').disabled=!probing&&(!game||!matrix||!fresh||!observation.ready||armed||!!pending);
 $('stop').disabled=!armed;
 $('confirm').disabled=!pending||!reviewFrame.stable||!fresh||!game||pending.revision!==game.revision;
 $('correct').disabled=!pending;
 $('guide').textContent=matrix?(observation.ready?(probing?'Test: połóż lotkę i przytrzymaj nieruchomo.':armed?'Czekam na nową lotkę.':autoMode?(game?'Puste tło zapamiętane. Automat liczy — rzucaj.':'Puste tło zapamiętane. Automat ruszy w meczu.'):'Puste tło zapamiętane. Naciśnij „Rozpoznaj lotkę”.'):'Kalibracja gotowa. Przed rzutami zapamiętaj pustą tarczę.'):live?guides[points.length]:'Uruchom kamerę i wskaż cztery brzegi tarczy.';
 steps();
}
function markers(mark=pending?.point){
 const extra=Array.isArray(mark)?(Array.isArray(mark[0])?mark:[mark]):[];
 $('markers').replaceChildren();
 [...points,...extra].forEach(([x,y],i)=>{const m=document.createElement('span');m.className='cg-marker';m.style.left=`${x*100}%`;m.style.top=`${y*100}%`;m.textContent=i<points.length?String(i+1):'×';$('markers').append(m);});
}
function layout(){
 const ratio=video.videoWidth&&video.videoHeight?video.videoWidth/video.videoHeight:1,swapped=rotation%180!==0;
 const r=swapped?1/ratio:ratio;
 const w=stage.clientWidth,h=stage.clientHeight;
 let cw=w,ch=w/r;if(ch>h){ch=h;cw=h*r;}
 scene.style.width=cw+'px';scene.style.height=ch+'px';
 pan=[Math.max(-cw*(zoom-1)/2,Math.min(cw*(zoom-1)/2,pan[0])),Math.max(-ch*(zoom-1)/2,Math.min(ch*(zoom-1)/2,pan[1]))];
 scene.style.transform=`translate(-50%,-50%) translate(${pan[0]}px,${pan[1]}px) rotate(${rotation}deg) scale(${zoom})`;
 $('zoom').textContent=`${Math.round(zoom*100)}%`;
 stage.classList.toggle('cg-hide-cursor',!!live&&!matrix);
}
new ResizeObserver(layout).observe(stage);
function resetCalibration(clearStored=false){points=[];matrix=null;crop=null;sourceVersion++;if(clearStored)clearSavedCalibration();clearBaseline('Wskaż cztery punkty na zewnętrznym brzegu podwójnego pierścienia: 20, 6, 3, 11.');markers();buttons();}
function stopCamera(message='Kamera wyłączona.'){
 sourceVersion++;source.stop();clearTimeout(connectionTimer);connectionTimer=null;live=false;starting=false;gate.reset();video.pause();video.srcObject=null;video.hidden=true;$('empty').hidden=false;
 points=[];matrix=null;crop=null;frameSize='';rotation=0;zoom=1;pan=[0,0];reticle.hidden=true;clearBaseline(message);layout();
}
async function devices(){
 try{
  let list=await navigator.mediaDevices.enumerateDevices();
  // Bez zgody przeglądarka ukrywa nazwy kamer. Jednorazowa próba otwiera okno
  // zgody, żeby lista pokazała realne źródła (FaceTime, iPhone) do wyboru.
  if(!list.some(d=>d.kind==='videoinput'&&d.label)){
   const probe=await navigator.mediaDevices.getUserMedia({video:true}).catch(()=>null);
   probe?.getTracks().forEach(t=>t.stop());
   list=await navigator.mediaDevices.enumerateDevices();
  }
  // „Kamera (#Przemek)” ma pierwszeństwo przed „Kamera (Warzywko)” i wbudowaną
  // FaceTime HD, także przed wcześniej zapisanym wyborem. Lista źródeł pochodzi
  // wyłącznie z macOS — telefonu niewidocznego w systemie nie da się dodać tutaj.
  if(!live&&!starting){
   const phones=list.filter(d=>d.kind==='videoinput'&&/warzywko|przemek/i.test(d.label));
   const phonePresent=phones.some(d=>d.deviceId===selection.id);
   const pick=phones.find(d=>/przemek/i.test(d.label))||phones.find(d=>/warzywko/i.test(d.label))||phones[0];
   if(pick&&selection.id!==pick.deviceId&&(!phonePresent||/przemek/i.test(pick.label)||/facetime/i.test(selection.label))){selection={id:pick.deviceId,label:pick.label};saveCameraSelection(longStorage,selection);}
  }
  $('device').replaceChildren(new Option('Domyślna kamera',''));for(const c of cameraOptions(list,selection)){const option=new Option(c.disabled?`${c.label} — nie do tarczy`:c.label,c.id);option.disabled=c.disabled;$('device').append(option);}$('device').value=selection.id;
 }catch{status('Lista kamer niedostępna. Sprawdź uprawnienia przeglądarki.');}
}
async function start(){
 stopCamera();if(!navigator.mediaDevices?.getUserMedia||!isSecureContext){status('Kamera wymaga HTTPS i zgody przeglądarki.');return;}
 // Świeża lista przed startem: telefon podłączony po otwarciu panelu wybierze się sam.
 await devices();
 starting=true;buttons();status('Czekam na zgodę i obraz kamery…');const run=sourceVersion;
 connectionTimer=setTimeout(()=>{if(run===sourceVersion&&starting)stopCamera('Brak obrazu przez 30 sekund. Sprawdź zgodę i połączenie telefonu.');},30000);
 try{const stream=await source.start($('device').value);if(!stream||run!==sourceVersion)return;
  video.srcObject=stream;video.hidden=false;await video.play();if(run!==sourceVersion)return;
  clearTimeout(connectionTimer);connectionTimer=null;live=true;starting=false;$('empty').hidden=true;frameSize=`${video.videoWidth}x${video.videoHeight}`;
  const track=stream.getVideoTracks()[0];muted=track.muted;selection={id:track.getSettings().deviceId||'',label:track.label};saveCameraSelection(longStorage,selection);gate.reset(video.currentTime,performance.now());restoreCalibration();layout();await devices();
 }catch(e){if(run===sourceVersion)stopCamera(cameraError(e));}
}
function calibrationCrop(){
 const xs=points.map(p=>p[0]*video.videoWidth),ys=points.map(p=>p[1]*video.videoHeight);
 // 2.0, nie 1.4: przy 1.4 lotka wbita w pierścień z numerami miała skrzydełko
 // poza kadrem („Obiekt jest ucięty krawędzią obrazu”); zmierzone 259 mm od
 // środka, 2.0 daje 340 mm zapasu aż do granic klatki kamery.
 const size=Math.min(Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))*2.0,video.videoWidth,video.videoHeight);
 if(size<100)throw new Error('Tarcza za mała w obrazie. Ustaw kamerę bliżej.');
 return {x:Math.max(0,Math.min(video.videoWidth-size,(Math.min(...xs)+Math.max(...xs)-size)/2)),y:Math.max(0,Math.min(video.videoHeight-size,(Math.min(...ys)+Math.max(...ys)-size)/2)),size};
}
function capture(){actx.drawImage(video,crop.x,crop.y,crop.size,crop.size,0,0,640,640);return toGray(actx.getImageData(0,0,640,640).data);}
function metadata(game){return {time:video.currentTime,contextKey:game?key(game):'panel-bez-gry',sourceKey:`${sourceVersion}:${frameSize}:${JSON.stringify(points)}`};}
function autoTurnKey(game){return JSON.stringify([game.game,game.sessionId,game.player,game.phase,game.target]);}
function seriesEntries(found){
 // Every detected component goes through calibration to its own board field.
 if(found.status!=='candidates')return null;
 return found.candidates.map(item=>{
  const tip=item.autoCandidate;
  const point=tip?[(crop.x+tip.x*crop.size)/video.videoWidth,(crop.y+tip.y*crop.size)/video.videoHeight]:null;
  return {point,field:point?fieldAt(project(matrix,point)):null,autoEligible:item.autoEligible===true};
 });
}
function autoObserve(frame,game){
 const meta=metadata(game);
 const emptyCheck=detectDartChange(emptyGray,frame,emptyPrevious,{width:640,height:640,emptyReference:emptyGray});
 emptyPrevious=frame;
 const found=observation.observe(frame,meta),emptyBoard=emptyCheck.status==='empty';
 if(meta.time-lastDiagnosticTime>=1){
  const describe=value=>Object.fromEntries(['status','reason','moving','rawMoving','changed','supportedChanged','components','reverted','lighting'].filter(k=>value[k]!==undefined).map(k=>[k,value[k]]));
  console.debug('camera-auto-diagnostic',JSON.stringify({time:meta.time,found:describe(found),empty:describe(emptyCheck),waitingForEmpty:autoSession.state.waitingForEmpty}));lastDiagnosticTime=meta.time;
 }
 if(found.status==='removed'&&!autoSession.state.waitingForEmpty){
  clearBaseline('Lotka zniknęła w trakcie kolejki. Automatyczny zapis zatrzymany. Sprawdź i cofnij wcześniej zapisane trafienie, jeśli lotka wypadła.');return;
 }
 const entries=seriesEntries(found);
 const tip=found.autoCandidate;
 const point=tip?[(crop.x+tip.x*crop.size)/video.videoWidth,(crop.y+tip.y*crop.size)/video.videoHeight]:null;
 const field=point?fieldAt(project(matrix,point)):null;
 const decision=autoSession.observe({...meta,turnKey:autoTurnKey(game),status:emptyBoard?'empty':found.status,emptyBoard,autoEligible:found.autoEligible===true,point:tip,field,darts:entries});
 if(decision.status==='armed'){
  // The original empty reference was matched on several fresh frames. This is
  // safe to reset after the previous player's darts have actually been removed.
  observation.setEmpty(frame,meta);clearProposal();
 }
 if(decision.status!=='ready'){
  const preview=entries?entries.map(entry=>entry.field).filter(value=>value&&value.number!==0):[];
  if(entries){if(preview.length)showField(preview[0]);markers(entries.map(entry=>entry.point).filter(Boolean));}
  else if(field){showField(field);markers(point);}
  status(found.status==='candidate'&&found.autoEligible!==true?found.autoReason:decision.status==='blocked'&&found.status!=='candidate'?found.reason||decision.reason:decision.reason);
  return;
 }
 // All gates use this fresh capture. Recheck the owner just before the write.
 const current=getCameraGame();
 if(!ready()||!current||current.revision!==game.revision){autoSession.invalidate();status('Kolejka zmieniła się. Czekam na pustą tarczę.');return;}
 const darts=Array.isArray(decision.darts)&&decision.darts.length?decision.darts:[decision.dart];
 const labels=[];
 committing=true;
 try{
  for(const raw of darts){
   const active=getCameraGame();
   if(!ready()||!active)throw new Error('Kolejka zmieniła się w trakcie zapisu serii.');
   const dart=active.game==='cricket'&&active.twentyLocked&&raw.number===20?{number:0,multiplier:1}:raw;
   applyCameraDart(dart,active.revision);
   labels.push(dartLabel(dart));
  }
  observation.accept(found.id,{applied:true,contextKey:meta.contextKey});
  const commit=autoSession.commit(decision.token,{applied:true});
  clearProposal();$('result').textContent=`Zapisano: ${labels.join(' · ')}`;
  if(entries)markers(entries.map(entry=>entry.point).filter(Boolean));else markers(point);
  status(commit.acceptedDarts>=3?'Trzy lotki zapisane. Gra przełącza gracza — wyjmij lotki, żeby automat ruszył dalej.':`Zapisano ${darts.length} ${darts.length===1?'lotkę':'lotki'} automatycznie. Rzuć następną.`);
 }catch(e){
  // A storage failure can happen after a handler changed the score: never retry.
  const saved=darts.length-labels.length;
  clearBaseline(`${saved?`Zapisano ${saved} z ${darts.length} lotek. `:''}Zapis automatyczny zatrzymany: ${e.message}`);
 }finally{committing=false;lastRevision=getCameraGame()?.revision??null;syncGame();}
}
function showField(field){$('result').textContent=`Do sprawdzenia: ${field.label}${field.nearWire?' · blisko drutu':''}`;}
function probeObserve(frame,game){
 const found=observation.observe(frame,metadata(game));
 if(found.status==='candidate'){
  const point=[(crop.x+found.candidate.x*crop.size)/video.videoWidth,(crop.y+found.candidate.y*crop.size)/video.videoHeight],field=fieldAt(project(matrix,point));
  observation.reject(found.id);observation.pause();probing=false;
  if(field.number===0){$('result').textContent='Brak odczytu';status('Kamera widzi nową zmianę, ale poza polem punktowym. Popraw kadr lub ustaw nowe puste tło.');}
  else if(found.autoEligible){$('result').textContent=`Test — widzę: ${field.label}`;status(`Kamera widzi lotkę: ${field.label}. Test — nic nie zapisano; zdejmij lotkę przed odczytem.`);}
  else{$('result').textContent=`Test — zmiana w ${field.label}`;status(`Kamera widzi nową zmianę w polu ${field.label}, ale kształt nie jest pewny. Test — nic nie zapisano; zdejmij lotkę przed odczytem.`);}
  buttons();return;
 }
 if(found.status==='removed'){probing=false;observation.pause();$('result').textContent='Brak odczytu';status('Kamera widzi zmianę, której nie ma na pustym tle — tło nie było puste. Ustaw nowe puste tło.');buttons();return;}
 if(found.status==='lighting'||found.status==='uninitialized'){probing=false;observation.pause();$('result').textContent='Brak odczytu';status(found.reason);buttons();return;}
 if(found.status==='empty'){status('Nie widzę nowej lotki — połóż ją w polu kamery. Naciśnij „Zatrzymaj test”, aby przerwać.');return;}
 if(found.status==='unstable'){status('Ruch w obrazie — przytrzymaj lotkę i telefon nieruchomo.');return;}
 if(found.status==='ambiguous'){status(`Test: ${found.reason}`);return;}
}
function verifyProposal(frame,time){
 const check=reviewFrame.check(frame,time);
 if(check.status==='removed'){
  status('Obraz zmienił się — sprawdź, czy lotka nie wypadła. Propozycja czeka; zatwierdź dopiero, gdy tarcza będzie nieruchoma.');return false;
 }
 if(check.status==='empty')status('Obraz stabilny. Sprawdź zaznaczony grot i zatwierdź lotkę albo popraw pole.');
 else if(check.status==='unstable')status('Ruch w obrazie — zatwierdzenie wstrzymane. Poczekaj, aż tarcza będzie nieruchoma.');
 else status('Obraz jeszcze się nie ustabilizował. Propozycja czeka — zatwierdź, gdy tarcza będzie nieruchoma.');
 buttons();return check.status==='empty';
}
function choosePoint(point){
 if(!ready()){status('Poczekaj na świeży obraz kamery — klatki jeszcze nie napływają.');return;}
 if(matrix){if(!pending||$('correction').hidden)return;const field=fieldAt(project(matrix,point));pending.dart={number:field.number,multiplier:field.multiplier};pending.point=point;showField(field);markers();return;}
 points.push(point);
 if(points.length===4){try{matrix=calibrate(points);crop=calibrationCrop();saveCalibration();status('Kalibracja gotowa. Usuń lotki i zapamiętaj pustą tarczę.');}catch(e){points.pop();matrix=null;status(e.message);}}
 markers();buttons();if(matrix)reticle.hidden=true;stage.classList.toggle('cg-hide-cursor',!!live&&!matrix);
}
stage.addEventListener('click',event=>{if(suppressClick){suppressClick=false;return;}if(!live)return;try{choosePoint(imagePoint(event.clientX,event.clientY,scene.getBoundingClientRect(),rotation));}catch(e){status(e.message);}});
stage.addEventListener('pointerdown',e=>{suppressClick=false;if(zoom>1&&e.button===0)drag={id:e.pointerId,x:e.clientX,y:e.clientY,pan:[...pan],moved:false};});
stage.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<5)return;drag.moved=true;suppressClick=true;stage.setPointerCapture(e.pointerId);pan=[drag.pan[0]+dx,drag.pan[1]+dy];layout();});
for(const type of ['pointerup','pointercancel'])stage.addEventListener(type,e=>{if(drag?.id!==e.pointerId)return;suppressClick=drag.moved||type==='pointercancel';drag=null;if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);});
const reticle=$('reticle');
function updateReticle(clientX,clientY){
 if(!live||matrix){reticle.hidden=true;return;}
 const rect=scene.getBoundingClientRect();
 const u=(clientX-rect.left)/rect.width,v=(clientY-rect.top)/rect.height;
 if(u<0||u>1||v<0||v>1){reticle.hidden=true;return;}
 const [x,y]=imagePoint(clientX,clientY,rect,rotation);
 const srect=stage.getBoundingClientRect();
 reticle.hidden=false;
 reticle.style.left=`${rect.left-srect.left+x*rect.width}px`;
 reticle.style.top=`${rect.top-srect.top+y*rect.height}px`;
}
stage.addEventListener('pointermove',e=>updateReticle(e.clientX,e.clientY));
stage.addEventListener('pointerleave',()=>{reticle.hidden=true;});
function syncGame(){
 const game=getCameraGame();launch.textContent=game?'Kamera · odczytaj rzut':'Kamera · wybierz kamerę';
 $('context').textContent=game?`${game.label||'Bieżący gracz'} · ${Number.isFinite(game.score)?`zostało ${game.score} pkt`:(game.game==='bull-off'?'walka o start':game.game)}`:'Poczekaj na aktywną kolejkę gracza.';
 if(!committing&&lastRevision!==game?.revision){
  if(observation.ready||pending){
   probing=false;
   if(autoMode){clearProposal();observation.pause();autoSession.invalidate();emptyPrevious=null;lastFrame=-1;status('Kolejka zmieniła się. Czekam na stabilną pustą tarczę.');}
   else clearBaseline('Stan gry zmienił się. Usuń lotki i zapamiętaj pustą tarczę przed kolejnym odczytem.');
  }
 }
 lastRevision=game?.revision??null;buttons();
}
subscribeCameraGame(syncGame);
// This also handles leaving a game for a screen which does not bind camera input.
new MutationObserver(()=>{if(!getCameraGame()&&lastRevision!==null)syncGame();}).observe(app,{childList:true});
launch.onclick=()=>{panel.hidden=false;shell.classList.add('camera-open');launch.setAttribute('aria-expanded','true');syncGame();layout();void devices();$('start').focus();};
$('close').onclick=()=>{stopCamera();panel.hidden=true;shell.classList.remove('camera-open');launch.setAttribute('aria-expanded','false');launch.focus();};
$('start').onclick=start;$('devices').onclick=devices;
$('device').onchange=()=>{selection={id:$('device').value,label:$('device').selectedOptions[0]?.textContent||''};saveCameraSelection(longStorage,selection);stopCamera('Źródło zmienione. Uruchom kamerę.');};
// iPhone w Continuity pojawia się i znika w trakcie pracy — lista ma podążać za systemem.
navigator.mediaDevices?.addEventListener?.('devicechange',()=>{if(!panel.hidden)void devices();});
$('rotate').onclick=()=>{rotation=(rotation+90)%360;pan=[0,0];layout();saveCalibration();};
$('plus').onclick=()=>{zoom=viewZoom(zoom+.25);layout();saveCalibration();};$('minus').onclick=()=>{zoom=viewZoom(zoom-.25);layout();saveCalibration();};
$('calibrate').onclick=()=>resetCalibration(true);
$('baseline').onclick=()=>{try{const game=getCameraGame();if(!ready()||!matrix)throw new Error('Poczekaj na świeży obraz kamery.');clearBaseline();emptyGray=capture();observation.setEmpty(emptyGray,metadata(game));lastFrame=video.currentTime;if(autoMode){armed=true;status(game?'Puste tło zapamiętane. Automat liczy całą kolejkę — rzucaj do trzech lotek.':'Puste tło zapamiętane. Automat ruszy po rozpoczęciu meczu.');}else status('Puste tło zapamiętane. Naciśnij „Rozpoznaj lotkę”, a potem wstaw lotkę. Test „Sprawdź, czy widzę lotkę” nic nie zapisuje.');buttons();}catch(e){status(e.message);}};
$('probe').onclick=()=>{
 if(probing){probing=false;observation.pause();$('result').textContent='Brak odczytu';status('Test zatrzymany. Nic nie zapisano.');buttons();return;}
 if(!ready()||!matrix||!observation.ready||armed||pending)return;
 observation.pause();probing=true;$('result').textContent='Test — czekam na lotkę';status('Połóż lotkę na tarczy. Sprawdzam, czy kamera ją widzi; nic nie zapiszę.');buttons();
};
$('read').onclick=()=>{if(!observation.ready||!getCameraGame()||probing)return;armed=true;status(autoMode?'Sprawdzam stabilność pustej tarczy przed automatycznym zapisem.':'Czekam na jedną nową lotkę. Punkty dodasz po sprawdzeniu i zatwierdzeniu.');buttons();};
$('stop').onclick=()=>clearBaseline('Odczyt zatrzymany. Przed wznowieniem zapamiętaj pustą tarczę.');
$('correct').onclick=()=>{if(!pending)return;$('correction').hidden=!$('correction').hidden;$('number').value=String(pending.dart.number);$('multiple').value=String(pending.dart.multiplier);if(!$('correction').hidden)$('number').focus();};
$('correct-save').onclick=()=>{if(!pending)return;const number=Number($('number').value),multiplier=number===0?1:Number($('multiple').value);if(number===25&&multiplier===3){status('BULL może mieć 25 albo 50 punktów.');return;}pending.dart={number,multiplier};$('correction').hidden=true;showField({label:number===0?'Pudło / wypadła · 0':number===25?`BULL · ${number*multiplier}`:`${['','S','D','T'][multiplier]}${number} · ${number*multiplier}`});buttons();};
$('confirm').onclick=()=>{
 const selected=pending,game=getCameraGame();if(!selected)return;
 try{
  if(!ready()||!game||game.revision!==selected.revision)throw new Error('Odczyt lub kolejka nieaktualne. Odczytaj lotkę ponownie.');
  if(!verifyProposal(capture(),video.currentTime))return;
  const darts=review.confirm({id:selected.id,contextKey:key(game),confirmed:true,darts:[selected.dart]});
  committing=true;applyCameraDart(darts[0],selected.revision);
  observation.accept(selected.id,{applied:true,contextKey:selected.contextKey});
  clearProposal();status('Lotka dodana do gry. Poczekaj na kolejny odczyt; po wyjęciu lotek zapamiętaj puste tło.');
 }catch(e){clearBaseline(e.message);}
 finally{committing=false;lastRevision=getCameraGame()?.revision??null;syncGame();}
};
video.addEventListener('resize',()=>{if(!live||!video.videoWidth||!video.videoHeight)return;const size=`${video.videoWidth}x${video.videoHeight}`;if(size!==frameSize){frameSize=size;resetCalibration();layout();}});
document.addEventListener('visibilitychange',()=>{gate.reset(video.currentTime,performance.now());probing=false;clearProposal();observation.pause();autoSession.pause();emptyPrevious=null;lastFrame=-1;buttons();if(document.hidden)status('Odczyt wstrzymany, gdy strona jest w tle.');else if(live)void video.play().catch(()=>status('Naciśnij „Uruchom kamerę”, aby odzyskać obraz.'));});
const ticker=setInterval(()=>{
 if(panel.hidden)return;
 buttons();if(!live||document.hidden)return;
 if(!armed&&!probing)return;
 const game=getCameraGame();if(!game||!ready()){
  if(pending)clearProposal();
  if(probing){
   if(!game){probing=false;observation.pause();status('Test przerwany — brak aktywnej kolejki.');buttons();}
   return;
  }
  observation.pause();autoSession.pause();emptyPrevious=null;
  status('Czekam na świeży obraz i aktywną kolejkę.');return;
 }
 if(video.currentTime===lastFrame)return;
 lastFrame=video.currentTime;
 try{
  const frame=capture();
  if(probing){probeObserve(frame,game);buttons();return;}
  if(autoMode){autoObserve(frame,game);buttons();return;}
  if(pending){
   if(Date.now()-pending.capturedAt>30000){expireProposal();return;}
   verifyProposal(frame,lastFrame);
   return;
  }
  const found=observation.observe(frame,metadata(game));
  if(found.status==='candidate'){
   const point=[(crop.x+found.candidate.x*crop.size)/video.videoWidth,(crop.y+found.candidate.y*crop.size)/video.videoHeight],field=fieldAt(project(matrix,point));
   if(field.number===0){observation.reject(found.id);status('Propozycja poza tarczą. Sprawdź ręcznie — nie wpisuję zera.');return;}
   const capturedAt=Date.now();review.propose({id:found.id,contextKey:key(game),capturedAt,darts:[field]});
   pending={...found,point,dart:{number:field.number,multiplier:field.multiplier},revision:game.revision,capturedAt};reviewFrame.begin(frame,emptyGray,lastFrame);markers();showField(field);status('Sprawdź zaznaczony grot. Zatwierdź lotkę albo popraw pole.');buttons();
  }else if(['removed','lighting','uninitialized'].includes(found.status))clearBaseline(found.reason);
  else status(found.reason);
 }catch(e){
  if(probing){probing=false;observation.pause();$('result').textContent='Brak odczytu';status(`Test zatrzymany: ${e.message}`);buttons();}
  else clearBaseline(`Odczyt zatrzymany: ${e.message}`);
 }
},350);
window.addEventListener('pagehide',()=>{clearInterval(ticker);stopCamera();});
