// Synthetic QA only: never serve this bootstrap from the user's normal origin.
import {mkdir,cp,writeFile,readFile} from 'node:fs/promises';
const out='/tmp/dart-training-clarity';await mkdir(out,{recursive:true});
for(const p of ['index.html','styles.css','src','public'])await cp(p,`${out}/${p}`,{recursive:true});
await writeFile(`${out}/src/config.js`,"export const config={supabaseUrl:'',supabaseKey:''};\n");
const index=await readFile('index.html','utf8');
await writeFile(`${out}/public/clarity-qa.html`,index.replace('href="styles.css"','href="/styles.css"').replace('src="src/app.js"','src="/src/clarity-qa.js"').replace('src="/src/app.js"','src="/src/clarity-qa.js"'));
await writeFile(`${out}/src/clarity-qa.js`, `
import {mountTraining} from './training-ui.js';
import {ensureProfiles} from './profiles.js';
import {createTraining,finishTraining,saveTraining} from './training.js';
import {mountPlayers} from './players-ui.js';
import {mountMnoznik} from './mnoznik.js';
import {mountMnoznikSparing} from './mnoznik-sparing.js';
import {mountCyferki} from './cyferki-ui.js';
import {mountJdc} from './jdc-ui.js';
import {mountVirtualCoach} from './virtual-coach-ui.js';
const [profile]=ensureProfiles(['QA DŁUGIE-NAZWISKO']);
const scene=new URL(location).searchParams.get('scene');
const root=document.querySelector('#app'),options={onExit:()=>{root.innerHTML='<h1>QA — zakończono</h1>';},toast:s=>{document.querySelector('#qa-status').textContent=s;},names:['QA A','QA B','QA C','QA D','QA E','QA F'],initialName:profile.name,profile};
const status=document.createElement('p');status.id='qa-status';root.before(status);
let resultId=null;
if(scene==='result'||scene==='profile'){
 const now=Date.now(),s=createTraining(profile.name,15,now-900000,true);s.profileId=profile.id;s.darts=Array.from({length:31},(_,i)=>({number:i%3===2?0:20,multiplier:1,target:20,at:now-890000+i*1000,...(i%3===2?{unknownMiss:true}:{})}));saveTraining(finishTraining(s,now));resultId=s.id;
}
if(scene==='match'){const {createMatch}=await import('./engine.js');const {saveMatch}=await import('./storage.js');saveMatch(createMatch(['QA A','QA B'],'501'));await import('./app.js');}
else if(scene==='profile')mountPlayers(root,{...options,initialProfileId:profile.id,onExercise:(exercise,p)=>mountVirtualCoach(root,{...options,profile:p,initialMode:exercise.startsWith('coach-')?exercise.slice(6):'301'})});
else if(scene==='mnoznik')mountMnoznik(root,options);
else if(scene==='sparing')mountMnoznikSparing(root,options);
else if(scene==='cyferki')mountCyferki(root,options);
else if(scene==='jdc')mountJdc(root,options);
else if(scene==='coach')mountVirtualCoach(root,options);
else {mountTraining(root,options);if(scene==='result')[...document.querySelectorAll('[data-result]')].find(b=>b.dataset.result===resultId).click();}
`);
console.log(out);
