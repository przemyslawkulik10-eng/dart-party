// Isolated visual QA: run locally, then SERVE_DIR=<output> PORT=4192 npm run dev.
// This never touches the normal application's origin or a cloud account.
import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';
const out=process.argv[2]||'/tmp/dart-coach-layout';await mkdir(out,{recursive:true});
for(const p of ['index.html','styles.css','src','public'])await cp(p,`${out}/${p}`,{recursive:true});
await writeFile(`${out}/src/config.js`,"export const config={supabaseUrl:'',supabaseKey:''};\n");
const index=await readFile(`${out}/index.html`,'utf8');
await writeFile(`${out}/public/coach-frame.html`,index.replace('src="src/app.js"','src="/src/coach-qa-bootstrap.js"').replace('src="/src/app.js"','src="/src/coach-qa-bootstrap.js"').replace('href="styles.css"','href="/styles.css"'));
await writeFile(`${out}/src/coach-qa-bootstrap.js`, `
import {createCoachPlan,emptyCoach,changeCoachTask,taskState} from './virtual-coach.js';
const scene=new URL(location).searchParams.get('scene')||'home';
const names=['PRZEMEK-DŁUGIE-NAZWISKO','MACIEK','MANIEK','DAWID','JAREK','BEKO'];
const profiles=names.map((name,i)=>({id:'11111111-1111-4111-8111-'+String(i+1).padStart(12,'0'),name,createdAt:Date.now()}));
let coach=createCoachPlan({...emptyCoach(),settings:{goal:'finishing',days:3}},30);
for(const t of coach.plans[0].tasks){
 if(scene==='empty')break;
 if(t.kind==='singles'&&scene!=='completed')break;
 coach=changeCoachTask(coach,t.id,'resume');
 while(!taskState(coach.plans[0].tasks.find(x=>x.id===t.id)).complete){
 const s=taskState(coach.plans[0].tasks.find(x=>x.id===t.id));
 const dart=t.kind==='checkout'?(s.remaining<=40&&s.remaining%2===0?{number:s.remaining/2,multiplier:2}:{number:20,multiplier:1}):{number:s.target,multiplier:t.kind==='doubles'?2:1};
 coach=changeCoachTask(coach,t.id,'dart',dart);
 if(t.kind==='checkout'&&scene!=='completed')break;
 }
}
profiles[0].virtualCoach=scene==='empty'?emptyCoach():coach;
localStorage.setItem('dart-party-profiles-v1',JSON.stringify(profiles));
localStorage.setItem('dart-party-selected-profile-v1',profiles[0].id);
localStorage.setItem('dart-party-sound','off');
// Use the real app and its fullscreen header; open the selected profile and coach.
await import('./app.js');
const panel=document.querySelector('#enter-players');if(panel)panel.click();
const picker=document.querySelector('[data-profile-section="coach"]');if(picker)picker.click();
if(scene==='game')document.querySelectorAll('[data-coach-task]')[1]?.click();
`);
await writeFile(`${out}/public/coach-qa.html`, `<!doctype html><html><head><meta charset="utf-8"><title>Coach responsive QA</title><style>body{margin:0;background:#fff;color:#111;font:14px system-ui}iframe{display:block;border:0}pre{white-space:pre-wrap;max-width:650px;max-height:45px;overflow:auto;margin:0}</style></head><body><pre id="proof">Loading fixture</pre><iframe title="Coach fixture" allowfullscreen></iframe><script>
const q=new URL(location).searchParams,w=Number(q.get('w')||1180),h=Number(q.get('h')||820),frame=document.querySelector('iframe');frame.width=w;frame.height=h;frame.src='/public/coach-frame.html?page=profil&scene='+(q.get('scene')||'home');frame.onload=()=>setTimeout(()=>{const win=frame.contentWindow,doc=frame.contentDocument,fs=doc.querySelector('#fullscreen');document.querySelector('#proof').textContent=JSON.stringify({requested:[w,h],viewport:[win.innerWidth,win.innerHeight],scrollWidth:doc.documentElement.scrollWidth,clientWidth:doc.documentElement.clientWidth,noHorizontalOverflow:doc.documentElement.scrollWidth<=doc.documentElement.clientWidth,fullScreenVisible:!!fs&&fs.getBoundingClientRect().width>0,coachVisible:!!doc.querySelector('.virtual-coach'),scene:q.get('scene')||'home'},null,2);},200);
</script></body></html>`);
console.log(out);
