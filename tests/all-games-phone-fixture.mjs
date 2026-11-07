// Isolated responsive QA. Run after build; all sessions use memory, never user storage.
import {readFile,writeFile} from 'node:fs/promises';
const base=process.argv[2]||'dist';
const html=(await readFile(base+'/index.html','utf8')).replace('src="/src/app.js"','src="/public/games-phone-frame.js"').replace('<script type="module" src="/src/install-app.js"></script>','').replace('<script type="module" src="/src/camera-game-panel.js"></script>','');
await writeFile(base+'/public/games-phone-frame.html',html);
await writeFile(base+'/public/games-phone-frame.js',String.raw`
const memory=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)}});
localStorage.setItem('dart-party-sound','off');
const q=new URLSearchParams(location.search),scene=q.get('scene')||'501',n=Number(q.get('players')||2),long=q.has('long');
if(q.has('camera'))await import('/public/games-camera-source.js');
await import('/src/camera-game-panel.js');
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
requestAnimationFrame(()=>requestAnimationFrame(()=>{
 const anchor=root.querySelector('.cricket-touch-duel,.coach-cricket-grid,.scoreboard,.coach-scoreboard,.cy-scores,.jdc-title,.training-position-grid')||root;window.scrollTo(0,anchor.getBoundingClientRect().top+window.scrollY);
 const rect=e=>{const r=e.getBoundingClientRect();return {width:r.width,height:r.height,x:r.x,right:r.right,y:r.y,bottom:r.bottom}};
 const visible=e=>e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0;
 const buttons=[...root.querySelectorAll('button,summary')].filter(visible).map(e=>({text:e.textContent.trim().slice(0,45),disabled:e.disabled,...rect(e)}));
 const overflow=[...root.querySelectorAll('*')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1||r.left< -1}).map(e=>({tag:e.tagName,class:e.getAttribute('class'),text:e.textContent.trim().slice(0,30),...rect(e)})).slice(0,12);
 parent.postMessage({scene,players:n,long,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,buttons,overflow,cameraGame:cameraSession.getCameraGame(),cameraButtonVisible:!![...document.querySelectorAll('button')].find(b=>b.textContent==='Kamera · odczytaj rzut'&&visible(b)),ready:true},location.origin);
}));
`);
await writeFile(base+'/public/games-camera-source.js',String.raw`
// Deterministic fixture only: canvas frames, no physical camera, no network or saved user data.
const memory=new Map();Object.defineProperty(window,'sessionStorage',{value:{getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)}});
const canvas=document.createElement('canvas');canvas.width=canvas.height=640;
const ctx=canvas.getContext('2d');const darts=[];let timer=null;
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
}
draw();
const qa=document.createElement('aside');qa.id='camera-qa-controls';qa.style.cssText='padding:12px;border:2px dashed #ffbe55;background:#10203a;color:white;position:relative;z-index:2';
qa.innerHTML='<strong>QA — syntetyczna kamera, tylko pamięć</strong><p>Kalibracja: niebieskie krzyżyki 20 → 6 → 3 → 11. Po zapamiętaniu pustego tła i uruchomieniu odczytu dodaj linię.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button id="qa-empty">QA: pusta tarcza</button><button id="qa-t20">QA: dodaj T20</button><button id="qa-s19">QA: dodaj S19</button></div><output id="camera-qa-context"></output><p id="camera-qa-frame">Pusta tarcza syntetyczna</p>';
document.body.prepend(qa);
const label=text=>{document.querySelector('#camera-qa-frame').textContent=text;draw();};
document.querySelector('#qa-empty').onclick=()=>{darts.length=0;label('Pusta tarcza syntetyczna');};
document.querySelector('#qa-t20').onclick=()=>{darts.push([320,187,320,126]);label('Dodano syntetyczną linię z końcem na T20');};
document.querySelector('#qa-s19').onclick=()=>{darts.push([294,400,276,455]);label('Dodano syntetyczną linię z końcem na S19');};
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
