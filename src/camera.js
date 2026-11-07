import {calibrate,project,fieldAt,SECTORS} from './camera-geometry.js';
import {CameraSource,cameraError,readCameraSelection,saveCameraSelection,cameraOptions} from './camera-source.js';
import {imagePoint,viewZoom} from './camera-view.js';
import {CameraFrameGate} from './camera-health.js';
const $=id=>document.getElementById(id);
const video=$('video'),stage=$('stage'),overlay=$('overlay');
let points=[],matrix=null,mode='off',generation=0,watch=null;
let rotation=0,zoom=1,pan=[0,0],drag=null,suppressClick=false;
const frameGate=new CameraFrameGate();
let sourceMuted=false,frameReady=false,frameSize='',connectionTimer=null;
function refreshFrames(){
  const wasReady=frameReady;
  frameReady=mode==='live'&&frameGate.sample({time:video.currentTime,now:performance.now(),hidden:document.hidden,muted:sourceMuted||video.readyState<2});
  if(mode==='live'&&wasReady!==frameReady){
    status(frameReady?(matrix?'Obraz aktywny. Kalibracja zachowana.':'Obraz aktywny. Wskaż cztery punkty tarczy.'):'Oczekiwanie na świeży obraz. Kalibracja zachowana; odczyt wstrzymany.');
  }
  return frameReady;
}
function layoutView(){
  const nativeRatio=mode==='live'&&video.videoHeight?video.videoWidth/video.videoHeight:1;
  const swapped=rotation%180!==0,ratio=swapped?1/nativeRatio:nativeRatio;
  stage.style.aspectRatio=String(ratio);stage.style.setProperty('--view-ratio',ratio);
  const width=stage.clientWidth,height=stage.clientHeight,scene=$('scene');
  scene.style.width=`${swapped?height:width}px`;scene.style.height=`${swapped?width:height}px`;
  // Pan in screen coordinates; rotation/zoom affect video and overlay together.
  const limitX=width*(zoom-1)/2,limitY=height*(zoom-1)/2;
  pan=[Math.max(-limitX,Math.min(limitX,pan[0])),Math.max(-limitY,Math.min(limitY,pan[1]))];
  scene.style.transform=`translate(-50%,-50%) translate(${pan[0]}px,${pan[1]}px) rotate(${rotation}deg) scale(${zoom})`;
  $('zoom-value').textContent=`${Math.round(zoom*100)}%`;
  const active=['live','demo'].includes(mode);
  $('zoom-in').disabled=!active||zoom>=4;$('zoom-out').disabled=!active||zoom<=1;$('rotate').disabled=!active;$('fit').disabled=!active;
}
new ResizeObserver(layoutView).observe(stage);
const instructions=['1/4 · Wskaż zewnętrzny brzeg D20.','2/4 · Wskaż zewnętrzny brzeg D6.','3/4 · Wskaż zewnętrzny brzeg D3.','4/4 · Wskaż zewnętrzny brzeg D11.'];
const source=new CameraSource(navigator.mediaDevices,()=>stop('Połączenie kamery zakończone. Uruchom kamerę i skalibruj tarczę ponownie.'),paused=>{sourceMuted=paused;frameGate.reset(video.currentTime,performance.now());refreshFrames();});
let selectionStorage;try{selectionStorage=window.sessionStorage;}catch{/* storage is optional */}
let selection=readCameraSelection(selectionStorage),deviceRefresh=0;
function selectCamera(id,label){
  selection={id,label};saveCameraSelection(selectionStorage,selection);
  if(id&&![...$('device').options].some(o=>o.value===id))$('device').add(new Option(label||'Wybrana kamera',id));
  $('device').value=id;
}
selectCamera(selection.id,selection.label);
function status(text){$('status').textContent=text;}
function drawMarkers(mark=null){
  overlay.replaceChildren();
  [...points,...(mark?[mark]:[])].forEach(([x,y],i)=>{
    const group=document.createElementNS('http://www.w3.org/2000/svg','g');
    // Leave the selected wire visible. Labels must not cover the clicked point.
    const cross=document.createElementNS(group.namespaceURI,'path');
    const px=x*1000,py=y*1000,color=i<points.length?'#44cfff':'#fff';
    cross.setAttribute('d',`M ${px-10} ${py} H ${px-3} M ${px+3} ${py} H ${px+10} M ${px} ${py-10} V ${py-3} M ${px} ${py+3} V ${py+10}`);
    cross.setAttribute('fill','none');cross.setAttribute('stroke',color);cross.setAttribute('stroke-width','1.5');cross.setAttribute('vector-effect','non-scaling-stroke');
    const text=document.createElementNS(group.namespaceURI,'text');text.setAttribute('x',px+15);text.setAttribute('y',py-15);text.setAttribute('fill',color);text.setAttribute('stroke','#06152e');text.setAttribute('stroke-width','4');text.setAttribute('paint-order','stroke');text.setAttribute('font-size','20');text.textContent=i<points.length?String(i+1):'×';group.append(cross,text);overlay.append(group);
  });
}
function reset(){points=[];matrix=null;drawMarkers();$('result').textContent='Brak kalibracji';update();}
function update(){
  const active=mode==='live'||mode==='demo';
  $('guide').textContent=!active?'Najpierw uruchom kamerę lub ilustrację testową.':matrix?'Kalibracja gotowa. Wskaż środek BULL, a potem znane pola i sprawdź odczyt.':instructions[points.length];
  $('reset').disabled=!active;$('undo').disabled=!points.length;$('stop').disabled=mode==='off';$('start').disabled=mode==='starting';
  layoutView();
}
function stop(message='Kamera wyłączona.') {
  generation++;source.stop();clearInterval(watch);watch=null;clearTimeout(connectionTimer);connectionTimer=null;frameGate.reset();frameReady=false;sourceMuted=false;frameSize='';video.pause();video.srcObject=null;video.hidden=true;$('sample').hidden=true;$('empty').hidden=false;mode='off';rotation=0;zoom=1;pan=[0,0];drag=null;reset();$('preview-label').textContent='Podgląd · kamera wyłączona';status(message);
}
async function devices(){
  const refresh=++deviceRefresh;
  if(!navigator.mediaDevices?.enumerateDevices){status('Kamera wymaga zgodnej przeglądarki oraz HTTPS lub localhost. Otwórz tę próbę na Macu.');return;}
  try{
    const list=await navigator.mediaDevices.enumerateDevices();
    if(refresh!==deviceRefresh)return;
    $('device').replaceChildren(new Option('Domyślna kamera',''));
    cameraOptions(list,selection).forEach(d=>{const option=new Option(d.disabled?`${d.label} — nie do tarczy`:d.label,d.id);option.disabled=d.disabled;$('device').add(option);});
    $('device').value=selection.id;
  }catch(e){status(cameraError(e));}
}
$('start').onclick=async()=>{
  stop();
  if(!isSecureContext||!navigator.mediaDevices?.getUserMedia){status('Kamera wymaga HTTPS lub localhost. Otwórz tę próbę na Macu w Safari lub Chrome.');return;}
  const run=generation;mode='starting';update();status('Czekam na zgodę i obraz kamery…');
  connectionTimer=setTimeout(()=>{if(run===generation&&mode==='starting')stop('Brak odpowiedzi kamery przez 30 sekund. Sprawdź zgodę Safari i połączenie telefonu, potem naciśnij „Sprawdź kamerę”.');},30000);
  try{
    const stream=await source.start($('device').value);
    if(!stream||run!==generation)return;
    video.srcObject=stream;video.hidden=false;$('empty').hidden=true;
    // A real frame is needed before accepting calibration input.
    await video.play();
    if(run!==generation)return;
    clearTimeout(connectionTimer);connectionTimer=null;
    mode='live';frameSize=`${video.videoWidth}x${video.videoHeight}`;frameGate.reset(video.currentTime,performance.now());stage.style.aspectRatio=`${video.videoWidth} / ${video.videoHeight}`;reset();
    const track=stream.getVideoTracks()[0];$('preview-label').textContent=`Podgląd · ${track.label||'kamera'}`;
    selectCamera(track.getSettings().deviceId||selection.id,track.label||selection.label);
    status(`Obraz aktywny · ${video.videoWidth} × ${video.videoHeight}. Ustaw tarczę i wskaż cztery punkty.`);
    sourceMuted=track.muted;
    watch=setInterval(refreshFrames,250);
    await devices();
  }catch(e){if(run===generation){stop(cameraError(e));if(e.name==='DeskViewError')await devices();}}
};
$('stop').onclick=()=>stop();$('refresh').onclick=devices;
$('device').onchange=()=>{selectCamera($('device').value,$('device').selectedOptions[0]?.textContent||'');stop('Źródło zmienione. Naciśnij „Sprawdź kamerę”.');};
$('reset').onclick=reset;
$('undo').onclick=()=>{points.pop();matrix=null;drawMarkers();$('result').textContent='Brak kalibracji';update();};
video.addEventListener('resize',()=>{
  if(mode!=='live'||!video.videoWidth||!video.videoHeight)return;
  const next=`${video.videoWidth}x${video.videoHeight}`;if(next===frameSize)return;
  frameSize=next;frameGate.reset(video.currentTime,performance.now());frameReady=false;
  reset();status('Rozmiar obrazu zmieniony. Wykonaj kalibrację ponownie.');
});
overlay.addEventListener('click',event=>{
  if(suppressClick){suppressClick=false;return;}
  if(!['live','demo'].includes(mode))return;
  if(mode==='live'&&!refreshFrames()){status('Oczekiwanie na świeży obraz — nie kalibruj zatrzymanej klatki.');return;}
  const point=imagePoint(event.clientX,event.clientY,overlay.getBoundingClientRect(),rotation);
  if(matrix){
    try{const result=fieldAt(project(matrix,point));$('result').textContent=`${mode==='demo'?'Ilustracja · ':''}${result.label}${result.nearWire?' · Blisko drutu — sprawdź ręcznie':''}`;drawMarkers(point);}catch(e){$('result').textContent=e.message;}
    return;
  }
  points.push(point);
  if(points.length===4){try{matrix=calibrate(points);$('result').textContent='Sprawdź BULL i znane pola';status('Kalibracja gotowa. Sprawdź BULL i znane pola.');}catch(e){points.pop();status(e.message);}}
  drawMarkers();update();
});
$('rotate').onclick=()=>{rotation=(rotation+90)%360;pan=[0,0];layoutView();};
$('zoom-in').onclick=()=>{zoom=viewZoom(zoom+.25);layoutView();};
$('zoom-out').onclick=()=>{zoom=viewZoom(zoom-.25);layoutView();};
$('fit').onclick=()=>{zoom=1;pan=[0,0];layoutView();};
stage.addEventListener('pointerdown',event=>{
  suppressClick=false;
  if(zoom<=1||!['live','demo'].includes(mode)||event.button!==0)return;
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,pan:[...pan],moved:false};
});
stage.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(!drag.moved&&Math.hypot(dx,dy)<5)return;
  drag.moved=true;suppressClick=true;stage.setPointerCapture(event.pointerId);pan=[drag.pan[0]+dx,drag.pan[1]+dy];layoutView();
});
for(const type of ['pointerup','pointercancel'])stage.addEventListener(type,event=>{
  if(drag?.id===event.pointerId){suppressClick=drag.moved||type==='pointercancel';drag=null;if(stage.hasPointerCapture(event.pointerId))stage.releasePointerCapture(event.pointerId);}
});
function demo(){
  stop();mode='demo';$('empty').hidden=true;$('sample').hidden=false;$('preview-label').textContent='Ilustracja testowa · to nie obraz kamery';status('Ilustracja testowa. Kalibracja działa, kamera jest wyłączona.');
  const ctx=$('sample').getContext('2d'),scale=1.85;
  ctx.fillStyle='#06152e';ctx.fillRect(0,0,800,800);ctx.save();ctx.translate(400,400);ctx.scale(scale,scale);
  for(let i=0;i<20;i++){
    const a=-Math.PI/2-Math.PI/20+i*Math.PI/10,b=a+Math.PI/10;
    for(const [outer,inner,color] of [[170,162,i%2?'#27886e':'#c55060'],[162,107,i%2?'#d5d7c7':'#192635'],[107,99,i%2?'#27886e':'#c55060'],[99,15.9,i%2?'#d5d7c7':'#192635']]){
      ctx.beginPath();ctx.arc(0,0,outer,a,b);ctx.arc(0,0,inner,b,a,true);ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='#83949e';ctx.lineWidth=.5;ctx.stroke();
    }
    ctx.fillStyle='#f5f9ff';ctx.font='12px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(SECTORS[i]),190*Math.cos((a+b)/2),190*Math.sin((a+b)/2));
  }
  for(const [r,color]of[[15.9,'#27886e'],[6.35,'#c55060']]){ctx.beginPath();ctx.arc(0,0,r,0,2*Math.PI);ctx.fillStyle=color;ctx.fill();}
  ctx.restore();reset();
}
$('demo').onclick=demo;
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{status('Pełny ekran nie jest dostępny w tej przeglądarce.');}};
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'⛶ Wyjdź z pełnego ekranu':'⛶ Pełny ekran';});
document.addEventListener('visibilitychange',()=>{
  frameGate.reset(video.currentTime,performance.now());refreshFrames();
  if(!document.hidden&&mode==='live')void video.play().catch(()=>status('Dotknij podglądu, aby wznowić obraz kamery.'));
});
window.addEventListener('pagehide',()=>stop());
navigator.mediaDevices?.addEventListener('devicechange',devices);
void devices();

// Read-only bridge used by the separate local detector.
export function cameraSnapshot(){return {video,matrix,points:points.map(p=>[...p]),mode,generation,ready:refreshFrames()};}
