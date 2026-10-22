// Local browser QA. In-memory storage only; never reads or changes player records.
import {readFile,writeFile} from 'node:fs/promises';
const base='dist/public';
const page=(await readFile('dist/index.html','utf8')).replace('/src/app.js','/public/panel-zero.js').replace('<script type="module" src="/src/install-app.js"></script>','');
await writeFile(`${base}/panel-zero-child.html`,page);
await writeFile(`${base}/panel-zero.js`,`
const memory=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)}});
const {ensureProfiles}=await import('/src/profiles.js');
const {createMnoznik,throwMnoznik,saveMnoznik}=await import('/src/mnoznik.js');
const {createMnoznikSparing,throwMnoznikSparing,saveMnoznikSparing,mountMnoznikSparing}=await import('/src/mnoznik-sparing.js');
const {mountPlayers}=await import('/src/players-ui.js');
const params=new URLSearchParams(location.search),count=Number(params.get('players')||2);
const players=ensureProfiles(Array.from({length:count},(_,i)=>'Testowy zawodnik długi '+i));
const p=players[0];let solo=createMnoznik(p,Date.now()-10000);
for(const n of [1,1,1,60,60,60,1,1,1,60,60,50])solo=throwMnoznik(solo,n);saveMnoznik(solo);
const app=document.querySelector('#app'),options={onExit(){},toast:message=>{document.querySelector('#toast').textContent=message;},initialProfile:p};
if(params.has('players')){
 let m=createMnoznikSparing(players);for(let d=0;d<count*3;d++)m=throwMnoznikSparing(m,0);saveMnoznikSparing(m);
 mountMnoznikSparing(app,options);app.querySelector('[data-load]').click();
}else mountPlayers(app,{...options,initialProfileId:p.id});
requestAnimationFrame(()=>requestAnimationFrame(()=>{
 const selectors=params.has('players')?'[data-skip-score],.cy-scores article':'[data-player-milestone]';
 const boxes=[...document.querySelectorAll(selectors)].map(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height,top:r.top,left:r.left,right:r.right,overflow:el.scrollWidth>el.clientWidth};});
 parent.postMessage({width:innerWidth,height:innerHeight,mode:params.get('players')||'panel',scrollWidth:document.documentElement.scrollWidth,boxes},location.origin);
}));
`);
const sizes=[[1920,1080],[1180,820],[1024,768],[820,1180],[390,844]];
await writeFile(`${base}/panel-zero-layout.html`,`<!doctype html><meta charset="utf-8"><title>Panel i mnożnik — test układu</title><style>body{background:#06152a;color:white;font:16px system-ui}section{display:inline-block;vertical-align:top;margin:8px}iframe{border:0;transform-origin:0 0}pre{white-space:pre-wrap}</style><h1>Panel i mnożnik — test układu</h1><pre id="results"></pre>${['', '?players=2','?players=6'].flatMap(mode=>sizes.map(([w,h])=>{const scale=Math.min(600/w,500/h);return `<section><h2>${w} × ${h} ${mode||'panel'}</h2><div style="width:${w*scale}px;height:${h*scale}px;overflow:hidden"><iframe title="${w} ${mode||'panel'}" src="/public/panel-zero-child.html${mode}" width="${w}" height="${h}" style="transform:scale(${scale})"></iframe></div></section>`;})).join('')}<script>addEventListener('message',e=>{if(e.origin===location.origin)document.querySelector('#results').textContent+=JSON.stringify(e.data)+'\\n';});</script>`);
