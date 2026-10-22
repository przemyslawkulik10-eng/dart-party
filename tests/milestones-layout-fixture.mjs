// Run after npm run build; local visual QA only. Does not read or write player data.
import {readFile,writeFile} from 'node:fs/promises';
const root='dist/public';
const page=(await readFile('dist/index.html','utf8')).replace('/src/app.js','/public/milestones-layout.js').replace('<script type="module" src="/src/install-app.js"></script>','');
await writeFile(`${root}/milestones-layout-child.html`,page);
await writeFile(`${root}/milestones-layout.js`,`
import {homeMarkup} from '/src/home-ui.js';
import {milestoneHistoryMarkup} from '/src/player-milestones.js';
document.body.dataset.view='home';
document.querySelector('#app').innerHTML=homeMarkup({profile:{name:'Zawodnik testowy'},milestones:{180:1234,170:123}});
if(new URLSearchParams(location.search).has('history')){
 document.querySelector('#modal-content').innerHTML='<div class="modal-heading"><h2>Moje 180 — 1</h2><button aria-label="Zamknij">×</button></div>'+milestoneHistoryMarkup([{kind:'180',sourceLabel:'Trening celności',at:'2026-10-22T10:35:53Z',round:1,darts:Array(3).fill({number:20,multiplier:3})}]);
 document.querySelector('#modal').showModal();
}
requestAnimationFrame(()=>requestAnimationFrame(()=>{
 const row=document.querySelector('.home-nav-row');
 if(!document.querySelector('#modal').open)row.scrollIntoView();
 const selector=document.querySelector('#modal').open?'#modal':'[data-home-milestone]';
 const boxes=[...document.querySelectorAll(selector)].map(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,right:r.right,overflow:el.scrollWidth>el.clientWidth};});
 parent.postMessage({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,boxes,history:document.querySelector('#modal').open},location.origin);
}));
`);
const sizes=[[1920,1080],[1180,820],[1024,768],[820,1180],[390,844]];
await writeFile(`${root}/milestones-layout.html`,`<!doctype html><meta charset="utf-8"><title>Test układu liczników</title><style>body{background:#06152a;color:white;font:16px system-ui}section{display:inline-block;vertical-align:top;margin:8px}iframe{border:0;transform-origin:0 0}pre{white-space:pre-wrap}</style><h1>Liczniki — rozmiary ekranów</h1><pre id="results"></pre><div>${[false,true].flatMap(history=>sizes.map(([w,h])=>{const scale=Math.min(600/w,500/h);return `<section><h2>${w} × ${h} ${history?'historia':'strona główna'}</h2><div style="width:${w*scale}px;height:${h*scale}px;overflow:hidden"><iframe title="${w} ${history?'historia':'liczniki'}" src="/public/milestones-layout-child.html${history?'?history':''}" width="${w}" height="${h}" style="transform:scale(${scale})"></iframe></div></section>`;})).join('')}</div><script>addEventListener('message',e=>{if(e.origin===location.origin)document.querySelector('#results').textContent+=JSON.stringify(e.data)+'\\n';});</script>`);
