import {CameraSource,cameraError,cameraOptions,readCameraSelection,saveCameraSelection} from './camera-source.js';
import {CameraFrameGate} from './camera-health.js';
import {calibrate,project,fieldAt} from './camera-geometry.js';
import {imagePoint,viewZoom} from './camera-view.js';
import {toGray} from './camera-difference.js';
import {createCameraReviewFrame} from './camera-review-frame.js';
import {createCameraObservation} from './camera-observation.js';
import {getCameraGame,subscribeCameraGame,applyCameraDart} from './camera-game-session.js';
import {createCameraReview} from './camera-game-adapter.js';

// The camera lives outside #app: scoring re-renders must never replace its stream.
const app=document.getElementById('app');
const shell=document.createElement('div');shell.className='camera-game-shell';app.before(shell);shell.append(app);
const bar=document.createElement('div');bar.className='camera-game-bar';bar.hidden=true;
bar.innerHTML='<button type="button" class="primary" aria-expanded="false" aria-controls="camera-game-panel">Kamera · odczytaj rzut</button><span>Klawiatura pozostaje dostępna.</span>';
shell.before(bar);const launch=bar.querySelector('button');
const panel=document.createElement('section');panel.id='camera-game-panel';panel.hidden=true;panel.setAttribute('aria-label','Kamera — odczyt rzutu');
panel.innerHTML=`<div class="cg-heading"><h2>Kamera</h2><button type="button" data-cg="close" aria-label="Zamknij kamerę">×</button></div>
<div class="cg-left"><p class="cg-context" data-cg="context"></p><label>Kamera<select data-cg="device"><option value="">Domyślna kamera</option></select></label>
<div class="cg-actions"><button type="button" data-cg="start" class="primary">Uruchom kamerę</button><button type="button" data-cg="devices">Odśwież listę</button></div>
<div class="cg-stage" data-cg="stage"><div class="cg-scene" data-cg="scene"><video data-cg="video" autoplay muted playsinline hidden></video><div data-cg="markers"></div></div><p class="cg-empty" data-cg="empty">Podgląd pojawi się po uruchomieniu kamery.</p></div>
<div class="cg-actions"><button type="button" data-cg="rotate" disabled>Obróć 90°</button><button type="button" data-cg="minus" aria-label="Pomniejsz obraz" disabled>−</button><span data-cg="zoom">100%</span><button type="button" data-cg="plus" aria-label="Powiększ obraz" disabled>+</button></div>
<p class="cg-guide" data-cg="guide">Uruchom kamerę i wskaż cztery brzegi tarczy.</p><button type="button" data-cg="calibrate" disabled>Kalibruj ponownie</button></div>
<div class="cg-right"><p class="cg-note">Jedna nowa lotka naraz. Sprawdź propozycję i zatwierdź. Możesz też nadal używać klawiatury gry.</p>
<button type="button" data-cg="baseline" disabled>Pusta tarcza — zapamiętaj tło</button>
<div class="cg-actions"><button type="button" data-cg="read" class="primary" disabled>Rozpoznaj lotkę</button><button type="button" data-cg="stop" disabled>Zatrzymaj odczyt</button></div>
<p class="cg-status" data-cg="status" role="status" aria-live="polite">Kamera wyłączona.</p>
<output class="cg-result" data-cg="result" aria-live="polite">Brak odczytu</output>
<div class="cg-actions"><button type="button" data-cg="confirm" class="primary" disabled>Zatwierdź lotkę</button><button type="button" data-cg="correct" disabled>Popraw</button></div>
<div class="cg-correction" data-cg="correction" hidden><p>Wskaż grot na podglądzie albo wybierz rzeczywiste pole. Lotka, która wypadła, daje 0.</p><label>Pole<select data-cg="number"><option value="0">Pudło / lotka wypadła — 0</option>${Array.from({length:20},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}<option value="25">BULL</option></select></label><label>Mnożnik<select data-cg="multiple"><option value="1">Pojedyncza / BULL 25</option><option value="2">Podwójna / BULL 50</option><option value="3">Potrójna</option></select></label><button type="button" data-cg="correct-save">Użyj poprawki</button></div>
<p class="cg-note">Brak wykrycia nie oznacza 0. Po wyjęciu lotek zapamiętaj ponownie pustą tarczę. Ręczny wpis lub cofnięcie wymaga ponownego ustawienia tła. Wcześniej wpisaną lotkę, która wypadła, cofnij w grze.</p></div>`;
shell.append(panel);
const $=name=>panel.querySelector(`[data-cg="${name}"]`);
const video=$('video'),stage=$('stage'),scene=$('scene'),gate=new CameraFrameGate(),review=createCameraReview(),reviewFrame=createCameraReviewFrame();
const analysis=document.createElement('canvas');analysis.width=analysis.height=640;
const actx=analysis.getContext('2d',{willReadFrequently:true});
let observation=createCameraObservation(),emptyGray=null,points=[],matrix=null,crop=null,sourceVersion=0;
let live=false,muted=false,starting=false,armed=false,committing=false,pending=null;
let rotation=0,zoom=1,pan=[0,0],drag=null,suppressClick=false,connectionTimer=null,frameSize='',lastFrame=-1,lastRevision=null;
let storage;try{storage=sessionStorage;}catch{}
let selection=readCameraSelection(storage);
const guides=['Wskaż zewnętrzny brzeg D20 (góra).','Wskaż zewnętrzny brzeg D6 (prawo).','Wskaż zewnętrzny brzeg D3 (dół).','Wskaż zewnętrzny brzeg D11 (lewo).'];
const source=new CameraSource(navigator.mediaDevices,()=>stopCamera('Połączenie zakończone. Uruchom kamerę ponownie.'),value=>{muted=value;gate.reset(video.currentTime,performance.now());clearProposal();observation.pause();lastFrame=-1;buttons();});
function status(text){if($('status').textContent!==text)$('status').textContent=text;}
function ready(){return live&&gate.sample({time:video.currentTime,now:performance.now(),hidden:document.hidden,muted:muted||video.readyState<2});}
function key(game){return String(game.revision);}
function clearProposal(){pending=null;reviewFrame.reset();review.clear();$('result').textContent='Brak odczytu';$('correction').hidden=true;markers();}
function clearBaseline(message){armed=false;observation.invalidate();emptyGray=null;lastFrame=-1;clearProposal();if(message)status(message);buttons();}
function buttons(){
 const game=getCameraGame(),fresh=ready();
 $('start').disabled=starting;$('calibrate').disabled=!live;
 for(const name of ['rotate','minus','plus'])$(name).disabled=!live;
 $('baseline').disabled=!game||!matrix||!fresh;
 $('read').disabled=!game||!matrix||!fresh||!observation.ready||armed;
 $('stop').disabled=!armed;
 $('confirm').disabled=!pending||!reviewFrame.stable||!fresh||!game||pending.revision!==game.revision;
 $('correct').disabled=!pending;
 $('guide').textContent=matrix?'Kalibracja gotowa. Przed rzutami zapamiętaj pustą tarczę.':live?guides[points.length]:'Uruchom kamerę i wskaż cztery brzegi tarczy.';
}
function markers(mark=pending?.point){
 $('markers').replaceChildren();
 [...points,...(mark?[mark]:[])].forEach(([x,y],i)=>{const m=document.createElement('span');m.className='cg-marker';m.style.left=`${x*100}%`;m.style.top=`${y*100}%`;m.textContent=i<points.length?String(i+1):'×';$('markers').append(m);});
}
function layout(){
 const ratio=video.videoWidth&&video.videoHeight?video.videoWidth/video.videoHeight:1,swapped=rotation%180!==0;
 stage.style.aspectRatio=String(swapped?1/ratio:ratio);
 const w=stage.clientWidth,h=stage.clientHeight;
 scene.style.width=`${swapped?h:w}px`;scene.style.height=`${swapped?w:h}px`;
 pan=[Math.max(-w*(zoom-1)/2,Math.min(w*(zoom-1)/2,pan[0])),Math.max(-h*(zoom-1)/2,Math.min(h*(zoom-1)/2,pan[1]))];
 scene.style.transform=`translate(-50%,-50%) translate(${pan[0]}px,${pan[1]}px) rotate(${rotation}deg) scale(${zoom})`;
 $('zoom').textContent=`${Math.round(zoom*100)}%`;
}
new ResizeObserver(layout).observe(stage);
function resetCalibration(){points=[];matrix=null;crop=null;sourceVersion++;clearBaseline('Wskaż cztery punkty na zewnętrznym brzegu podwójnego pierścienia: 20, 6, 3, 11.');markers();buttons();}
function stopCamera(message='Kamera wyłączona.'){
 sourceVersion++;source.stop();clearTimeout(connectionTimer);connectionTimer=null;live=false;starting=false;gate.reset();video.pause();video.srcObject=null;video.hidden=true;$('empty').hidden=false;
 points=[];matrix=null;crop=null;frameSize='';rotation=0;zoom=1;pan=[0,0];clearBaseline(message);layout();
}
async function devices(){
 try{const list=await navigator.mediaDevices.enumerateDevices();$('device').replaceChildren(new Option('Domyślna kamera',''));for(const c of cameraOptions(list,selection)){const option=new Option(c.disabled?`${c.label} — nie do tarczy`:c.label,c.id);option.disabled=c.disabled;$('device').append(option);}$('device').value=selection.id;}catch{status('Lista kamer niedostępna. Sprawdź uprawnienia przeglądarki.');}
}
async function start(){
 stopCamera();if(!navigator.mediaDevices?.getUserMedia||!isSecureContext){status('Kamera wymaga HTTPS i zgody przeglądarki.');return;}
 starting=true;buttons();status('Czekam na zgodę i obraz kamery…');const run=sourceVersion;
 connectionTimer=setTimeout(()=>{if(run===sourceVersion&&starting)stopCamera('Brak obrazu przez 30 sekund. Sprawdź zgodę i połączenie telefonu.');},30000);
 try{const stream=await source.start($('device').value);if(!stream||run!==sourceVersion)return;
  video.srcObject=stream;video.hidden=false;await video.play();if(run!==sourceVersion)return;
  clearTimeout(connectionTimer);connectionTimer=null;live=true;starting=false;$('empty').hidden=true;frameSize=`${video.videoWidth}x${video.videoHeight}`;
  const track=stream.getVideoTracks()[0];muted=track.muted;selection={id:track.getSettings().deviceId||'',label:track.label};saveCameraSelection(storage,selection);gate.reset(video.currentTime,performance.now());resetCalibration();layout();await devices();
 }catch(e){if(run===sourceVersion)stopCamera(cameraError(e));}
}
function calibrationCrop(){
 const xs=points.map(p=>p[0]*video.videoWidth),ys=points.map(p=>p[1]*video.videoHeight);
 const size=Math.min(Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))*1.4,video.videoWidth,video.videoHeight);
 if(size<100)throw new Error('Tarcza za mała w obrazie. Ustaw kamerę bliżej.');
 return {x:Math.max(0,Math.min(video.videoWidth-size,(Math.min(...xs)+Math.max(...xs)-size)/2)),y:Math.max(0,Math.min(video.videoHeight-size,(Math.min(...ys)+Math.max(...ys)-size)/2)),size};
}
function capture(){actx.drawImage(video,crop.x,crop.y,crop.size,crop.size,0,0,640,640);return toGray(actx.getImageData(0,0,640,640).data);}
function metadata(game){return {time:video.currentTime,contextKey:key(game),sourceKey:`${sourceVersion}:${frameSize}:${JSON.stringify(points)}`};}
function showField(field){$('result').textContent=`Do sprawdzenia: ${field.label}${field.nearWire?' · blisko drutu':''}`;}
function verifyProposal(frame,time){
 const check=reviewFrame.check(frame,time);
 if(['removed','candidate','ambiguous','lighting'].includes(check.status)){
  clearBaseline('Obraz zmienił się przed zatwierdzeniem. Sprawdź, czy lotka nie wypadła. Wcześniej wpisane rzuty możesz cofnąć w grze.');return false;
 }
 if(check.status!=='empty')status(check.status==='unstable'?'Ruch w obrazie — zatwierdzenie wstrzymane. Poczekaj, aż tarcza będzie nieruchoma.':check.reason);
 else status('Obraz stabilny. Sprawdź zaznaczony grot i zatwierdź lotkę albo popraw pole.');
 buttons();return check.status==='empty';
}
function choosePoint(point){
 if(!ready())return;
 if(matrix){if(!pending||$('correction').hidden)return;const field=fieldAt(project(matrix,point));pending.dart={number:field.number,multiplier:field.multiplier};pending.point=point;showField(field);markers();return;}
 points.push(point);
 if(points.length===4){try{matrix=calibrate(points);crop=calibrationCrop();status('Kalibracja gotowa. Usuń lotki i zapamiętaj pustą tarczę.');}catch(e){points.pop();matrix=null;status(e.message);}}
 markers();buttons();
}
stage.addEventListener('click',event=>{if(suppressClick){suppressClick=false;return;}if(!live)return;try{choosePoint(imagePoint(event.clientX,event.clientY,scene.getBoundingClientRect(),rotation));}catch(e){status(e.message);}});
stage.addEventListener('pointerdown',e=>{suppressClick=false;if(zoom>1&&e.button===0)drag={id:e.pointerId,x:e.clientX,y:e.clientY,pan:[...pan],moved:false};});
stage.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<5)return;drag.moved=true;suppressClick=true;stage.setPointerCapture(e.pointerId);pan=[drag.pan[0]+dx,drag.pan[1]+dy];layout();});
for(const type of ['pointerup','pointercancel'])stage.addEventListener(type,e=>{if(drag?.id!==e.pointerId)return;suppressClick=drag.moved||type==='pointercancel';drag=null;if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);});
function syncGame(){
 const game=getCameraGame();bar.hidden=!game&&panel.hidden;
 $('context').textContent=game?`${game.label||'Bieżący gracz'} · ${game.game==='bull-off'?'walka o start':game.game}`:'Poczekaj na aktywną kolejkę gracza.';
 if(!committing&&lastRevision!==game?.revision){
  if(observation.ready||pending)clearBaseline('Stan gry zmienił się. Usuń lotki i zapamiętaj pustą tarczę przed kolejnym odczytem.');
 }
 lastRevision=game?.revision??null;buttons();
}
subscribeCameraGame(syncGame);
// This also handles leaving a game for a screen which does not bind camera input.
new MutationObserver(()=>{if(!getCameraGame()&&lastRevision!==null)syncGame();}).observe(app,{childList:true});
launch.onclick=()=>{panel.hidden=false;shell.classList.add('camera-open');launch.setAttribute('aria-expanded','true');syncGame();layout();void devices();$('start').focus();};
$('close').onclick=()=>{stopCamera();panel.hidden=true;shell.classList.remove('camera-open');launch.setAttribute('aria-expanded','false');bar.hidden=!getCameraGame();launch.focus();};
$('start').onclick=start;$('devices').onclick=devices;
$('device').onchange=()=>{selection={id:$('device').value,label:$('device').selectedOptions[0]?.textContent||''};saveCameraSelection(storage,selection);stopCamera('Źródło zmienione. Uruchom kamerę.');};
$('rotate').onclick=()=>{rotation=(rotation+90)%360;pan=[0,0];layout();};
$('plus').onclick=()=>{zoom=viewZoom(zoom+.25);layout();};$('minus').onclick=()=>{zoom=viewZoom(zoom-.25);layout();};
$('calibrate').onclick=resetCalibration;
$('baseline').onclick=()=>{try{const game=getCameraGame();if(!ready()||!matrix||!game)throw new Error('Poczekaj na obraz i aktywną kolejkę.');clearBaseline();emptyGray=capture();observation.setEmpty(emptyGray,metadata(game));lastFrame=video.currentTime;status('Puste tło zapamiętane. Włącz odczyt i rzuć jedną lotkę.');buttons();}catch(e){status(e.message);}};
$('read').onclick=()=>{if(!observation.ready||!getCameraGame())return;armed=true;status('Czekam na jedną nową lotkę. Punkty dodasz po sprawdzeniu i zatwierdzeniu.');buttons();};
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
document.addEventListener('visibilitychange',()=>{gate.reset(video.currentTime,performance.now());clearProposal();observation.pause();lastFrame=-1;buttons();if(document.hidden)status('Odczyt wstrzymany, gdy strona jest w tle.');else if(live)void video.play().catch(()=>status('Naciśnij „Uruchom kamerę”, aby odzyskać obraz.'));});
const ticker=setInterval(()=>{
 if(panel.hidden)return;
 buttons();if(!live||!armed||document.hidden)return;
 const game=getCameraGame();if(!game||!ready()){
  if(pending)clearProposal();observation.pause();
  status('Czekam na świeży obraz i aktywną kolejkę.');return;
 }
 if(video.currentTime===lastFrame)return;
 lastFrame=video.currentTime;
 try{
  const frame=capture();
  if(pending){
   if(Date.now()-pending.capturedAt>30000){clearBaseline('Odczyt wygasł. Zapamiętaj puste tło i rozpocznij ponownie.');return;}
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
 }catch(e){clearBaseline(`Odczyt zatrzymany: ${e.message}`);}
},350);
window.addEventListener('pagehide',()=>{clearInterval(ticker);stopCamera();});
