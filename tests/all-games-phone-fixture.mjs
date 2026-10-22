// Isolated responsive QA. Run after build; all sessions use memory, never user storage.
import {readFile,writeFile} from 'node:fs/promises';
const base=process.argv[2]||'dist';
const html=(await readFile(base+'/index.html','utf8')).replace('src="/src/app.js"','src="/public/games-phone-frame.js"').replace('<script type="module" src="/src/install-app.js"></script>','');
await writeFile(base+'/public/games-phone-frame.html',html);
await writeFile(base+'/public/games-phone-frame.js',String.raw`
const memory=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)}});
localStorage.setItem('dart-party-sound','off');
const q=new URLSearchParams(location.search),scene=q.get('scene')||'501',n=Number(q.get('players')||2),long=q.has('long');
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
requestAnimationFrame(()=>requestAnimationFrame(()=>{
 const anchor=root.querySelector('.cricket-touch-duel,.coach-cricket-grid,.scoreboard,.coach-scoreboard,.cy-scores,.jdc-title,.training-position-grid')||root;window.scrollTo(0,anchor.getBoundingClientRect().top+window.scrollY);
 const rect=e=>{const r=e.getBoundingClientRect();return {width:r.width,height:r.height,x:r.x,right:r.right,y:r.y,bottom:r.bottom}};
 const visible=e=>e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0;
 const buttons=[...root.querySelectorAll('button,summary')].filter(visible).map(e=>({text:e.textContent.trim().slice(0,45),disabled:e.disabled,...rect(e)}));
 const overflow=[...root.querySelectorAll('*')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1||r.left< -1}).map(e=>({tag:e.tagName,class:e.getAttribute('class'),text:e.textContent.trim().slice(0,30),...rect(e)})).slice(0,12);
 parent.postMessage({scene,players:n,long,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,buttons,overflow,ready:true},location.origin);
}));
`);
await writeFile(base+'/public/games-phone-qa.html',String.raw`<!doctype html><meta charset="utf-8"><title>Gry — telefon QA</title><style>body{background:#06152e;color:#fff;font:14px system-ui;margin:8px}iframe{display:block;border:0}section{display:inline-block;vertical-align:top;margin:8px}pre{max-height:32px;overflow:auto;white-space:pre-wrap}</style><pre id="proof">[]</pre><div id="frames"></div><script>
const q=new URLSearchParams(location.search),scenes=(q.get('scenes')||'501,301,201,cricket,coach-301,coach-cricket,cyferki,mnoznik-solo-hits,mnoznik-solo-score,mnoznik-score,mnoznik-zero,jdc,jdc-double,jdc-result,sector,bull').split(','),sizes=(q.get('sizes')||'390x844').split(','),players=q.get('players')||2;
for(const size of sizes){const [w,h]=size.split('x').map(Number);for(const scene of scenes){const s=document.createElement('section');s.innerHTML='<h2>'+scene+' · '+size+' · '+players+' gr.</h2><iframe title="'+scene+'-'+size+'" width="'+w+'" height="'+h+'" src="/public/games-phone-frame.html?scene='+scene+'&players='+players+(q.has('long')?'&long':'')+'"></iframe>';const scale=Number(q.get('scale')||1);if(scale!==1){s.style.width=w*scale+'px';s.style.height=h*scale+50+'px';const f=s.querySelector('iframe');f.style.transform='scale('+scale+')';f.style.transformOrigin='0 0';}document.querySelector('#frames').append(s);}}
const results=[];addEventListener('message',e=>{if(e.origin===location.origin&&e.data.ready){results.push(e.data);document.querySelector('#proof').textContent=JSON.stringify(results)}});
</script>`);
console.log(base+'/public/games-phone-qa.html');
