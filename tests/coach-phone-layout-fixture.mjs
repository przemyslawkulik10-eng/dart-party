import {readFile,writeFile} from 'node:fs/promises';
const base=process.argv[2]||'dist';
const index=(await readFile(base+'/index.html','utf8')).replace('src="/src/app.js"','src="/public/phone-qa.js"').replace('<script type="module" src="/src/install-app.js"></script>','');
await writeFile(base+'/public/phone-frame.html',index);
await writeFile(base+'/public/phone-qa.js',`
const map=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)}});
const {ensureProfiles,selectProfile}=await import('/src/profiles.js');
const {newCoachMatch}=await import('/src/coach-match.js');
const {recordDart,nextPlayer}=await import('/src/engine.js');
const {mountCoachMatch}=await import('/src/coach-match-ui.js');
const q=new URLSearchParams(location.search),long=q.has('long'),p=ensureProfiles([long?'PRZEMEK-DŁUGIE-NAZWISKO':'PRZEMEK'])[0];selectProfile(p.id);localStorage.setItem('dart-party-sound','off');
await import('/src/app.js');
let resume;
if(q.has('done')){resume=newCoachMatch(p.name,'201',false,'calm');for(let i=0;i<3;i++)resume=recordDart(resume,20,3);resume=nextPlayer(resume);for(let i=0;i<3;i++)resume=recordDart(resume,0,1);resume=nextPlayer(resume);resume=recordDart(resume,7,3);}
document.body.dataset.view='training';mountCoachMatch(document.querySelector('#app'),{profile:p,mode:'301',doubleOut:false,level:'calm',resume,onBack(){},toast:console.error});
requestAnimationFrame(()=>requestAnimationFrame(()=>{
 const board=document.querySelector('.coach-scoreboard');if(!q.has('done'))board.scrollIntoView({block:'start'});
 const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right}};
 const controls=[...document.querySelectorAll('.coach-match button')].map(el=>({text:el.textContent,...rect(el)}));
 parent.postMessage({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scene:q.has('done')?'done':long?'long':'start',controls,panel:rect(document.querySelector('.coach-match>.panel')),scores:rect(board),bull:document.querySelector('[data-special="50"]')?rect(document.querySelector('[data-special="50"]')):null},location.origin);
}));
`);
const sizes=[[402,874],[390,844],[360,800],[320,568],[844,390],[1920,1080],[1180,820],[1024,768],[820,1180]];
await writeFile(base+'/public/phone-qa.html',`<!doctype html><meta charset="utf-8"><title>Telefon — trener 301</title><style>body{margin:0;background:#06152e;color:white;font:14px system-ui}iframe{border:0;display:block}pre{white-space:pre-wrap}section{display:inline-block;vertical-align:top;margin:8px}</style><pre id="proof"></pre>${sizes.flatMap(([w,h])=>['','long','done'].map(scene=>{const scale=w>900?.5:1;return `<section><h2>${w} × ${h} ${scene||'start'}</h2><div style="width:${w*scale}px;height:${h*scale}px;overflow:hidden"><iframe title="${w}-${scene||'start'}" width="${w}" height="${h}" src="/public/phone-frame.html?${scene}" style="transform:scale(${scale});transform-origin:0 0" allowfullscreen></iframe></div></section>`;})).join('')}<script>addEventListener('message',e=>{if(e.origin===location.origin)document.querySelector('#proof').textContent+=JSON.stringify(e.data)+'\\n'})</script>`);
