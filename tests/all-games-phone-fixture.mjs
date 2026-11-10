// Isolated responsive QA. Run after build; game sessions use memory, never user storage.
// Camera calibration persists in real localStorage by design (closing the tab keeps it).
import {readFile,writeFile} from 'node:fs/promises';
const base=process.argv[2]||'dist';
const html=(await readFile(base+'/index.html','utf8')).replace('src="/src/app.js"','src="/public/games-phone-frame.js"').replace('<script type="module" src="/src/install-app.js"></script>','').replace('<script type="module" src="/src/camera-game-panel.js"></script>','');
await writeFile(base+'/public/games-phone-frame.html',html);
await writeFile(base+'/public/games-phone-frame.js',String.raw`
const memory=new Map();let realStorage=null;try{realStorage=localStorage;}catch{}
const persistentKeys=new Set(['dart-camera-calibration-v1','dart-camera-source-v1']);
Object.defineProperty(window,'localStorage',{value:{
 getItem:k=>persistentKeys.has(k)?realStorage?.getItem(k)??null:memory.get(k)??null,
 setItem:(k,v)=>persistentKeys.has(k)?realStorage?.setItem(k,String(v)):memory.set(k,String(v)),
 removeItem:k=>persistentKeys.has(k)?realStorage?.removeItem(k):memory.delete(k)
}});
localStorage.setItem('dart-party-sound','off');
const q=new URLSearchParams(location.search),scene=q.get('scene')||'501',n=Number(q.get('players')||2),long=q.has('long');
if(q.get('camera')==='1')await import('/public/games-camera-source.js');
await import('/src/camera-game-panel.js');
if((q.get('cameraAuto')==='1'||q.get('qaCams')==='1')&&q.get('camera')!=='1')await import('/public/games-camera-diagnostics.js');
const {ensureProfiles,selectProfile}=await import('/src/profiles.js');
const profiles=ensureProfiles(Array.from({length:n},(_,i)=>long?'GRACZ-'+(i+1)+'-DŁUGIE-NAZWISKO':'GRACZ '+(i+1)));selectProfile(profiles[0].id);
const {createMatch,recordDart}=await import('/src/engine.js');
if(['501','301','201','cricket'].includes(scene)){const {saveMatch}=await import('/src/storage.js');saveMatch(createMatch(profiles.map(p=>p.name),scene,false,'standard','standard',3));}
await import('/src/app.js');
const root=document.querySelector('#app'),options={onExit(){},toast(t){document.querySelector('#toast').textContent=t},initialProfile:profiles[0]};
if(['501','301','201','cricket'].includes(scene))document.querySelector('#resume-home').click();
else {
 document.body.dataset.view='training';
 if(scene.startsWith('coach-')){const {mountCoachMatch}=await import('/src/coach-match-ui.js');mountCoachMatch(root,{profile:profiles[0],mode:scene.slice(6),doubleOut:false,level:'calm',onBack(){},toast:options.toast});}
 else if(scene==='cyferki') {const {createCyferki,chooseCyferki,saveCyferki}=await import('/src/cyferki.js');saveCyferki(chooseCyferki(createCyferki(profiles,{scoring:'hits',progress:'player'}),20));const {mountCyferki}=await import('/src/cyferki-ui.js');mountCyferki(root,options);root.querySelector('[data-cy-open]').click();}
 else if(scene.startsWith('mnoznik')){const solo=scene.includes('solo'),mod=await import(solo?'/src/mnoznik.js':'/src/mnoznik-sparing.js');let game=solo?mod.createMnoznik(profiles[0]):mod.createMnoznikSparing(profiles);if(scene.includes('score')||scene.includes('zero'))for(let i=0;i<3*(solo?1:profiles.length);i++)game=solo?mod.throwMnoznik(game,scene.includes('zero')?0:3):mod.throwMnoznikSparing(game,scene.includes('zero')?0:3);if(solo){mod.saveMnoznik(game);mod.mountMnoznik(root,options);}else{mod.saveMnoznikSparing(game);mod.mountMnoznikSparing(root,options);}root.querySelector('[data-load]').click();}
 else if(scene.startsWith('jdc')){const mod=await import('/src/jdc.js');let session=mod.createJdc(profiles[0]);const count=scene==='jdc-double'?18:scene==='jdc-result'?57:0;for(let i=0;i<count;i++)session=mod.recordJdcDart(session,0,1);if(scene==='jdc-duel'){const {createDuel,saveNewDuel}=await import('/src/jdc-duel.js');saveNewDuel(createDuel(profiles.slice(0,2)));}else mod.saveJdc(session);const {mountJdc}=await import('/src/jdc-ui.js');mountJdc(root,options);root.querySelector('[data-jdc-open]').click();}
 else if(scene==='sector'||scene==='bull'){const {mountTraining}=await import('/src/training-ui.js');mountTraining(root,options);if(scene==='bull')root.querySelector('#training-target').value='25';root.querySelector('#training-start').click();}
}
const cameraSession=await import('/src/camera-game-session.js');
if(q.has('camera'))cameraSession.subscribeCameraGame(game=>{const output=document.querySelector('#camera-qa-context');if(output)output.textContent=game?'Gra: '+game.game+' · gracz '+game.player+' · rewizja '+game.revision:'Brak aktywnego wejścia kamery';});
const camPick=q.get('cam');
if(camPick){
 const startPick=async()=>{try{
  const launch=document.querySelector('.camera-game-bar button');
  if(!launch||launch.hidden)return 'launch ukryty/brak';
  launch.click();
  const sel=document.querySelector('#camera-game-panel [data-cg="device"]');
  const video=document.querySelector('#camera-game-panel video[data-cg="video"]');
  const live=video&&!video.hidden&&video.srcObject&&video.readyState>=2;
  if(!live){
   const start=document.querySelector('#camera-game-panel [data-cg="start"]');
   if(start&&!start.disabled)start.click();
   return 'faza 1: start domyślnej kamery, by poznać nazwy';
  }
  const list=await navigator.mediaDevices.enumerateDevices();
  const labels=list.filter(d=>d.kind==='videoinput').map(d=>d.label||'(brak nazwy)').join('; ');
  const found=list.find(d=>d.kind==='videoinput'&&d.label&&d.label.toLowerCase().includes(camPick.toLowerCase()));
  if(!found)return 'brak '+camPick+' w: ['+labels+']';
  if(![...sel.options].some(o=>o.value===found.deviceId))return 'brak opcji dla '+found.deviceId+' (opcji: '+sel.options.length+')';
  sel.value=found.deviceId;sel.dispatchEvent(new Event('change'));
  document.title='KAMERA OK — '+found.label;
  const start=document.querySelector('#camera-game-panel [data-cg="start"]');
  if(start)start.click();
  return true;
 }catch(e){return 'błąd: '+e;}return '?';};
 const pickLoop=setInterval(()=>{startPick().then(ok=>{if(ok===true)clearInterval(pickLoop);else if(typeof ok==='string'&&!document.title.startsWith('KAMERA'))document.title='CAM: '+ok;});},1200);
 const liveLoop=setInterval(()=>{try{
  const video=document.querySelector('#camera-game-panel video[data-cg="video"]');
  const step=document.querySelector('#camera-game-panel ol[data-cg="steps"] li.cg-step-active')?.textContent||'';
  if(video&&video.readyState>=2&&!video.paused&&video.videoWidth>0&&/^KAMERA OK/.test(document.title)){document.title='KAMERA ŻYJE — '+video.videoWidth+'x'+video.videoHeight+' · '+step;clearInterval(liveLoop);}
 }catch(e){}},800);
}
requestAnimationFrame(()=>requestAnimationFrame(()=>{
 const anchor=root.querySelector('.cricket-touch-duel,.coach-cricket-grid,.scoreboard,.coach-scoreboard,.cy-scores,.jdc-title,.training-position-grid')||root;window.scrollTo(0,anchor.getBoundingClientRect().top+window.scrollY);
 const rect=e=>{const r=e.getBoundingClientRect();return {width:r.width,height:r.height,x:r.x,right:r.right,y:r.y,bottom:r.bottom}};
 const visible=e=>e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0;
 const buttons=[...root.querySelectorAll('button,summary')].filter(visible).map(e=>({text:e.textContent.trim().slice(0,45),disabled:e.disabled,...rect(e)}));
 const overflow=[...root.querySelectorAll('*')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1||r.left< -1}).map(e=>({tag:e.tagName,class:e.getAttribute('class'),text:e.textContent.trim().slice(0,30),...rect(e)})).slice(0,12);
 parent.postMessage({scene,players:n,long,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,buttons,overflow,cameraGame:cameraSession.getCameraGame(),cameraButtonVisible:!![...document.querySelectorAll('button')].find(b=>b.textContent==='Kamera · odczytaj rzut'&&visible(b)),ready:true},location.origin);
}));
`);
await writeFile(base+'/public/games-camera-diagnostics.js',String.raw`
// Local physical-camera QA only. Read existing video/visible calibration markers;
// never start another stream, alter scoring, write storage, or upload frame data.
import {toGray} from '/src/camera-difference.js';
const query=new URLSearchParams(location.search);
if(['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&(query.get('cameraAuto')==='1'||query.get('qaCams')==='1')&&query.get('camera')!=='1'){
 const qa=document.createElement('aside');qa.id='camera-physical-qa';qa.style.cssText='padding:12px;border:2px dashed #ffbe55;background:#10203a;color:white';
 qa.innerHTML='<strong>QA lokalne — diagnostyka fizycznej kamery</strong><p>6 świeżych klatek skalibrowanego kadru co około 350 ms. Dane pozostają w tej przeglądarce; plik JSON pobierzesz poniżej. Nie zmienia to meczu.</p><label>Opis próbki <select id="qa-physical-label"><option value="unspecified">Bez oznaczenia</option><option value="empty">Pusta tarcza</option><option value="dart">Lotka w tarczy</option></select></label> <button id="qa-physical-capture">QA: zbierz 6 klatek</button><p id="qa-physical-progress" role="status">Uruchom kamerę i skalibruj tarczę w panelu.</p><a id="qa-physical-download" hidden>Pobierz klatki JSON</a>';
 document.body.prepend(qa);
 const button=qa.querySelector('button'),label=qa.querySelector('select'),progress=qa.querySelector('[role="status"]'),link=qa.querySelector('a');
 let active=false,objectUrl=null,leaving=false;
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 function geometry(video){
  const markers=[...document.querySelectorAll('#camera-game-panel [data-cg="markers"] .cg-marker')].filter(m=>/^[1-4]$/.test(m.textContent)).sort((a,b)=>Number(a.textContent)-Number(b.textContent));
  if(markers.length!==4||markers.some((m,i)=>m.textContent!==String(i+1)))throw Error('Brak czterech punktów kalibracji.');
  const points=markers.map(m=>{
   if(!m.style.left.endsWith('%')||!m.style.top.endsWith('%'))throw Error('Nieprawidłowa pozycja znacznika.');
   return [parseFloat(m.style.left)/100,parseFloat(m.style.top)/100];
  });
  if(points.some(p=>p.some(v=>!Number.isFinite(v)||v<0||v>1)))throw Error('Znacznik kalibracji poza obrazem.');
  const sourceWidth=video.videoWidth,sourceHeight=video.videoHeight,xs=points.map(p=>p[0]*sourceWidth),ys=points.map(p=>p[1]*sourceHeight);
  const size=Math.min(Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))*2.0,sourceWidth,sourceHeight);
  if(size<100)throw Error('Brak obrazu lub tarcza zbyt mała do kadru detektora.');
  const crop={x:Math.max(0,Math.min(sourceWidth-size,(Math.min(...xs)+Math.max(...xs)-size)/2)),y:Math.max(0,Math.min(sourceHeight-size,(Math.min(...ys)+Math.max(...ys)-size)/2)),size};
  return {sourceWidth,sourceHeight,points,crop};
 }
 const frameHash=gray=>{let h=2166136261;for(let i=0;i<gray.length;i+=7){h^=gray[i];h=Math.imul(h,16777619);}return (h>>>0).toString(16);};
 const base64=bytes=>{let binary='';for(let offset=0;offset<bytes.length;offset+=8192)binary+=String.fromCharCode(...bytes.subarray(offset,offset+8192));return btoa(binary);};
 button.onclick=async()=>{
  if(active)return;active=true;button.disabled=true;label.disabled=true;link.hidden=true;
  if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}
  const report={schema:'dart-party-physical-frames-v1',createdAt:new Date().toISOString(),label:label.value,encoding:'gray8-base64',width:640,height:640,requestedFrames:6,intervalMs:350,frames:[]};
  try{
   const video=document.querySelector('#camera-game-panel video[data-cg="video"]');
   if(!video||video.readyState<2||video.paused||!video.srcObject)throw Error('Najpierw uruchom fizyczną kamerę w panelu.');
   const source=video.srcObject,initial=geometry(video),key=JSON.stringify(initial);Object.assign(report,initial);
   const canvas=document.createElement('canvas');canvas.width=canvas.height=640;const context=canvas.getContext('2d',{willReadFrequently:true});
   if(!context)throw Error('Przeglądarka nie udostępnia canvas 2D.');
   let lastFrameHash='';
   for(let i=0;i<6;i++){
    progress.textContent='Zbieram klatkę '+(i+1)+'/6…';if(i)await delay(350);
    if(video.srcObject!==source||JSON.stringify(geometry(video))!==key)throw Error('Kamera, rozdzielczość lub kalibracja zmieniła się podczas próbki.');
    const crop=initial.crop;context.drawImage(video,crop.x,crop.y,crop.size,crop.size,0,0,640,640);
    const gray=toGray(context.getImageData(0,0,640,640).data),currentHash=frameHash(gray);
    let min=255,max=0,sum=0;for(const value of gray){min=Math.min(min,value);max=Math.max(max,value);sum+=value;}
    report.frames.push({index:i,mediaTime:video.currentTime,videoCurrentTime:video.currentTime,capturedAt:new Date().toISOString(),performanceTime:performance.now(),sameAsPrevious:currentHash===lastFrameHash,panelStatus:document.querySelector('#camera-game-panel [data-cg="status"]')?.textContent||'',panelResult:document.querySelector('#camera-game-panel [data-cg="result"]')?.textContent||'',min,max,mean:sum/gray.length,pixels:base64(gray)});
    lastFrameHash=currentHash;
    progress.textContent='Zebrano '+report.frames.length+'/6 klatek.';
   }
  }catch(error){report.error=String(error.message||error);progress.textContent='Błąd: '+report.error+' Zebrano '+report.frames.length+'/6 klatek.';}
  finally{
   if(report.frames.length){objectUrl=URL.createObjectURL(new Blob([JSON.stringify(report)],{type:'application/json'}));link.href=objectUrl;link.download='dart-camera-'+report.label+'-'+report.createdAt.replace(/[:.]/g,'-')+'.json';link.textContent='QA: pobierz '+report.frames.length+' klatek JSON';link.hidden=false;if(!report.error)progress.textContent='Gotowe: 6 świeżych klatek. Pobierz lokalny plik JSON poniżej.';}
   active=false;button.disabled=false;label.disabled=false;
  }
 };
 addEventListener('pagehide',()=>{leaving=true;if(objectUrl)URL.revokeObjectURL(objectUrl);},{once:true});
}
`);
await writeFile(base+'/public/games-camera-source.js',String.raw`
// Deterministic fixture only: canvas frames, no physical camera, no network or saved user data.
const memory=new Map();Object.defineProperty(window,'sessionStorage',{value:{getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)}});
const canvas=document.createElement('canvas');canvas.width=canvas.height=640;
const ctx=canvas.getContext('2d');const darts=[],autoDarts=[];let timer=null;
const cameraQuery=new URLSearchParams(location.search),autoFixture=cameraQuery.get('camera')==='1'&&cameraQuery.get('cameraAuto')==='1';
// Idealized tapered silhouettes for automatic-path QA ONLY. These are not
// recordings and cannot establish real-camera recognition accuracy.
const autoShapes={t20:{x:320,y:187,angle:-Math.PI/2,label:'T20'},s19:{x:294,y:400,angle:Math.atan2(55,-18),label:'S19'},s18:{x:370,y:251,angle:Math.atan2(-69,50),label:'S18'},
 s20a:{x:314,y:146,angle:-Math.PI/2,label:'S20 #1'},s20b:{x:320,y:142,angle:-Math.PI/2-0.04,label:'S20 #2'},s20c:{x:327,y:148,angle:-Math.PI/2+0.04,label:'S20 #3'},
 s20d:{x:308,y:150,angle:-Math.PI/2,label:'S20 szer. #1'},s20e:{x:323,y:140,angle:-Math.PI/2-0.05,label:'S20 szer. #2'},s20f:{x:337,y:152,angle:-Math.PI/2+0.05,label:'S20 szer. #3'},
 s20g:{x:312,y:148,angle:-Math.PI/2+0.25,label:'S20 wach. #1'},s20h:{x:320,y:140,angle:-Math.PI/2,label:'S20 wach. #2'},s20i:{x:330,y:150,angle:-Math.PI/2-0.25,label:'S20 wach. #3'}};
function drawTaperedDart(shape){
 ctx.save();ctx.translate(shape.x,shape.y);ctx.rotate(shape.angle);ctx.fillStyle='#282828';
 for(let x=0;x<=70;x++){
  const radius=x<15?(x<6?0:1):x<33?3:x<50?1:Math.max(2,Math.floor(11*(1-Math.abs(x-60)/11)));
  ctx.fillRect(x,-radius,1,2*radius+1);
 }
 ctx.restore();
}
function draw(){
 ctx.fillStyle='#b4b4b4';ctx.fillRect(0,0,640,640);
 ctx.strokeStyle='#505050';ctx.lineWidth=1;
 for(const radius of [220,210,138,128,20,8]){ctx.beginPath();ctx.arc(320,320,radius,0,Math.PI*2);ctx.stroke();}
 for(let i=0;i<20;i++){const angle=i*Math.PI/10-Math.PI/2+Math.PI/20;ctx.beginPath();ctx.moveTo(320+20*Math.cos(angle),320+20*Math.sin(angle));ctx.lineTo(320+220*Math.cos(angle),320+220*Math.sin(angle));ctx.stroke();}
 ctx.fillStyle='#111';ctx.textAlign='center';ctx.font='bold 24px system-ui';
 for(const [text,x,y]of [['20',320,78],['6',568,328],['3',320,578],['11',70,328]])ctx.fillText(text,x,y);
 ctx.strokeStyle='#0055c8';ctx.lineWidth=2;
 for(const [x,y]of [[320,100],[540,320],[320,540],[100,320]]){ctx.beginPath();ctx.moveTo(x-7,y);ctx.lineTo(x+7,y);ctx.moveTo(x,y-7);ctx.lineTo(x,y+7);ctx.stroke();}
 ctx.fillStyle='#777';ctx.beginPath();ctx.arc(320,320,7,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#fff';ctx.lineWidth=6;ctx.lineCap='butt';
 for(const [x,y,endX,endY]of darts){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(endX,endY);ctx.stroke();}
 for(const shape of autoDarts)drawTaperedDart(shape);
}
draw();
const qa=document.createElement('aside');qa.id='camera-qa-controls';qa.style.cssText='padding:12px;border:2px dashed #ffbe55;background:#10203a;color:white;position:relative;z-index:2';
qa.innerHTML='<strong>QA — syntetyczna kamera, tylko pamięć</strong><p>Kalibracja: niebieskie krzyżyki 20 → 6 → 3 → 11. Po zapamiętaniu pustego tła i uruchomieniu odczytu dodaj linię.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button id="qa-empty">QA: pusta tarcza</button><button id="qa-t20">QA: dodaj T20</button><button id="qa-s19">QA: dodaj S19</button></div><output id="camera-qa-context"></output><p id="camera-qa-frame">Pusta tarcza syntetyczna</p>';
if(autoFixture){
 const autoControls=document.createElement('div');autoControls.style.cssText='display:flex;gap:8px;flex-wrap:wrap';
 for(const [key,shape]of Object.entries(autoShapes)){const button=document.createElement('button');button.id='qa-auto-'+key;button.textContent='QA AUTO: grot '+shape.label;autoControls.append(button);}
 qa.append(autoControls);
}
document.body.prepend(qa);
const label=text=>{document.querySelector('#camera-qa-frame').textContent=text;draw();};
document.querySelector('#qa-empty').onclick=()=>{darts.length=0;autoDarts.length=0;label('Pusta tarcza syntetyczna');};
document.querySelector('#qa-t20').onclick=()=>{darts.push([320,187,320,126]);label('Dodano syntetyczną linię z końcem na T20');};
document.querySelector('#qa-s19').onclick=()=>{darts.push([294,400,276,455]);label('Dodano syntetyczną linię z końcem na S19');};
if(autoFixture)for(const [key,shape]of Object.entries(autoShapes))document.querySelector('#qa-auto-'+key).onclick=()=>{
 if(autoDarts.includes(shape)){label('Sylwetka '+shape.label+' już jest w tarczy — wybierz inne pole lub wyczyść tarczę.');return;}
 autoDarts.push(shape);label('Dodano idealizowaną sylwetkę z grotem '+shape.label+'; to test syntetyczny, nie kamera fizyczna.');
};
const supported=typeof canvas.captureStream==='function';
Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{
 enumerateDevices:async()=>[{kind:'videoinput',deviceId:'qa-canvas',groupId:'qa',label:'QA syntetyczna tarcza'}],
 getUserMedia:async()=>{
  if(!supported)throw Object.assign(Error('Przeglądarka nie obsługuje canvas.captureStream.'),{name:'NotSupportedError'});
  const stream=canvas.captureStream(20),track=stream.getVideoTracks()[0];
  const getSettings=track.getSettings.bind(track);track.getSettings=()=>({...getSettings(),deviceId:'qa-canvas'});
  Object.defineProperty(track,'label',{value:'QA syntetyczna tarcza'});
  clearInterval(timer);timer=setInterval(draw,50);return stream;
 }
}});
addEventListener('pagehide',()=>clearInterval(timer),{once:true});
`);
await writeFile(base+'/public/games-phone-qa.html',String.raw`<!doctype html><meta charset="utf-8"><title>Gry — telefon QA</title><style>body{background:#06152e;color:#fff;font:14px system-ui;margin:8px}iframe{display:block;border:0}section{display:inline-block;vertical-align:top;margin:8px}pre{max-height:32px;overflow:auto;white-space:pre-wrap}</style><pre id="proof">[]</pre><div id="frames"></div><script>
const q=new URLSearchParams(location.search),scenes=(q.get('scenes')||'501,301,201,cricket,coach-301,coach-cricket,cyferki,mnoznik-solo-hits,mnoznik-solo-score,mnoznik-score,mnoznik-zero,jdc,jdc-double,jdc-result,sector,bull').split(','),sizes=(q.get('sizes')||'390x844').split(','),players=q.get('players')||2;
for(const size of sizes){const [w,h]=size.split('x').map(Number);for(const scene of scenes){const s=document.createElement('section');s.innerHTML='<h2>'+scene+' · '+size+' · '+players+' gr.</h2><iframe title="'+scene+'-'+size+'" width="'+w+'" height="'+h+'" src="/public/games-phone-frame.html?scene='+scene+'&players='+players+(q.has('long')?'&long':'')+'"></iframe>';const scale=Number(q.get('scale')||1);if(scale!==1){s.style.width=w*scale+'px';s.style.height=h*scale+50+'px';const f=s.querySelector('iframe');f.style.transform='scale('+scale+')';f.style.transformOrigin='0 0';}document.querySelector('#frames').append(s);}}
const results=[];addEventListener('message',e=>{if(e.origin===location.origin&&e.data.ready){results.push(e.data);document.querySelector('#proof').textContent=JSON.stringify(results)}});
</script>`);
console.log(base+'/public/games-phone-qa.html');
