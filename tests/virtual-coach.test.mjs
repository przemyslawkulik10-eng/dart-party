import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyCoach,validateCoach,createCoachPlan,changeCoachTask,taskState,coachResults,coachSummary} from '../src/virtual-coach.js';
import {readCoach,writeCoach,saveProfileCoachReport} from '../src/virtual-coach-storage.js';
import {ensureProfiles,loadProfiles,PROFILES_KEY} from '../src/profiles.js';
import {useAccount,workspace,replaceWorkspace,appStorage} from '../src/account-storage.js';
import {buildCoachContext} from '../src/coach-context.js';
const at='2026-10-20T12:00:00.000Z';
const makeTask=kind=>({id:crypto.randomUUID(),kind,targets:Array(10).fill(kind==='checkout'?40:20),goal:kind==='scoring'?30:2,reason:'Pomiar',events:[],paused:false});
const planTask=kind=>({...emptyCoach(),plans:[{id:crypto.randomUUID(),createdAt:at,minutes:10,tasks:[makeTask(kind)]}]});
function hit(coach,n=20,m=1){return changeCoachTask(coach,coach.plans.at(-1).tasks[0].id,'dart',{number:n,multiplier:m},at);}
function finish(coach,n=20,m=1){while(!taskState(coach.plans.at(-1).tasks[0]).complete)coach=hit(coach,n,m);return coach;}
function memory(){const map=new Map();globalThis.localStorage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};useAccount(null);return map;}

test('plan is stable across JSON and settings changes; no second active plan',()=>{
 const c=createCoachPlan(emptyCoach(),30,at);assert.equal(c.plans[0].tasks.length,3);
 assert.deepEqual(c,validateCoach(JSON.parse(JSON.stringify(c))));assert.throws(()=>createCoachPlan(c,10,at));
 const changed={...c,settings:{goal:'finishing',days:2}};assert.deepEqual(changed.plans[0],c.plans[0]);
 assert.deepEqual(createCoachPlan({...emptyCoach(),settings:{goal:'finishing',days:2}},20,at).plans[0].tasks.map(t=>t.kind),['doubles','checkout']);
});
test('each hit is measured against declared single/double target, scoring counts real points',()=>{
 for(const [kind,mul] of [['singles',1],['doubles',2]]){
 let c=planTask(kind);c=hit(c,20,mul);c=hit(c,20,3);c=hit(c,19,mul);const s=taskState(c.plans[0].tasks[0]);assert.equal(s.hits,1);assert.equal(s.attempts,3);assert.equal(s.visit,1);
 }
 const c=hit(hit(hit(planTask('scoring'),20,3),19,1),0,1);assert.equal(taskState(c.plans[0].tasks[0]).value,79);
});
test('checkout handles single-zero bust, leave-one bust, overshoot, bull and valid doubles',()=>{
 for(const darts of [[[20,1],[20,1]],[[20,1],[19,1]],[[20,3]]]){
 let c=planTask('checkout');for(const [n,m] of darts)c=hit(c,n,m);
 const s=taskState(c.plans[0].tasks[0]);assert.equal(s.rounds[0].bust,true);assert.equal(s.checkouts,0);assert.equal(s.remaining,40);
 }
 let c=hit(planTask('checkout'),20,2);assert.equal(taskState(c.plans[0].tasks[0]).checkouts,1);
 c=planTask('checkout');c.plans[0].tasks[0].targets=Array(10).fill(60);c=hit(hit(c,10,1),25,2);assert.equal(taskState(c.plans[0].tasks[0]).checkouts,1);
});
test('checkout has ten attempts even when finishing early; undo reopens final attempt',()=>{
 let c=finish(planTask('checkout'),20,2),t=c.plans[0].tasks[0];assert.equal(taskState(t).darts,10);assert.equal(taskState(t).value,10);assert.equal(taskState(t).achieved,true);assert.throws(()=>hit(c));
 c=changeCoachTask(c,t.id,'undo');assert.equal(taskState(c.plans[0].tasks[0]).complete,false);assert.equal(c.plans[0].tasks[0].paused,true);assert.equal(coachResults(c).length,0);
 c=changeCoachTask(c,t.id,'resume');c=hit(c,20,2);assert.equal(coachResults(c).length,1);
});
test('pause blocks throws and resume works; full 30-dart drills cannot receive extra darts',()=>{
 let c=planTask('singles'),id=c.plans[0].tasks[0].id;c=changeCoachTask(c,id,'pause');assert.throws(()=>hit(c));c=changeCoachTask(c,id,'resume');c=finish(c);
 assert.equal(taskState(c.plans[0].tasks[0]).darts,30);assert.throws(()=>hit(c));assert.equal(coachResults(JSON.parse(JSON.stringify(c))).length,1);
});
test('new plans cover under-observed skills and preserve old completed goals',()=>{
 const c=finish(planTask('scoring')),goal=c.plans[0].tasks[0].goal,next=createCoachPlan(c,20,at);
 assert.deepEqual(next.plans[1].tasks.map(t=>t.kind),['singles','doubles']);assert.equal(next.plans[0].tasks[0].goal,goal);
 assert.throws(()=>changeCoachTask(next,c.plans[0].tasks[0].id,'undo'));
});
test('recent results exclude future and stale sessions; adaptation uses repeats, not a lone record',()=>{
 let c=emptyCoach();for(let i=0;i<3;i++){const completed=finish(planTask('scoring'));c.plans.push(completed.plans[0]);}
 const summary=coachSummary(c,at).find(s=>s.kind==='scoring');assert.equal(summary.average,60);assert.equal(summary.sufficient,true);assert.equal(summary.previous,null);
 assert.equal(coachSummary(c,'2026-01-01T00:00:00Z')[0].sessions,0);assert.equal(coachSummary(c,'2027-01-01T00:00:00Z')[0].sessions,0);
 // Equal coverage makes scoring eligible again; its goal is median 60 plus 5%.
 for(const kind of ['singles','doubles','checkout'])for(let i=0;i<4;i++)c.plans.push(finish(planTask(kind),0).plans[0]);
 const p=createCoachPlan(c,10,at).plans.at(-1);assert.equal(p.tasks[0].kind,'scoring');assert.equal(p.tasks[0].goal,63);
});
test('corrupt IDs, duplicated plans, bad timestamps and excessive events are rejected',()=>{
 for(const mutate of [c=>c.plans[0].id='<script>',c=>c.plans.push(c.plans[0]),c=>c.plans[0].tasks[0].events.push({number:20,multiplier:1,at:'bad'}),c=>c.settings.days=0,c=>c.plans[0].tasks[0].goal=Infinity]){
 const c=planTask('singles');mutate(c);assert.throws(()=>validateCoach(c));
 }
});
test('two profiles and guest/account are isolated; account snapshot includes plan and AI reports',()=>{
 memory();const [guest]=ensureProfiles(['Guest']);const guestPlan=writeCoach(guest.id,readCoach(guest.id),createCoachPlan(emptyCoach(),10,at));
 const a='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';useAccount(a);const [p,q]=ensureProfiles(['A','B']);
 const original=readCoach(p.id),next=writeCoach(p.id,original,createCoachPlan(original,20,at),a);assert.equal(readCoach(q.id).plans.length,0);
 saveProfileCoachReport(p.id,'test',{createdAt:1,advice:{summary:'wynik'}});
 const snapshot=structuredClone(workspace());replaceWorkspace({});replaceWorkspace(snapshot);assert.deepEqual(readCoach(p.id),next);assert.equal(loadProfiles()[0].coachReports.length,1);
 assert.throws(()=>writeCoach(p.id,original,next,a),/innej karcie/);
 useAccount(null);assert.deepEqual(readCoach(guest.id),guestPlan);assert.throws(()=>writeCoach(guest.id,guestPlan,guestPlan,a),/Konto/);
});
test('corrupt saved coach is not overwritten and storage failure does not advance state',()=>{
 const map=memory(),[p]=ensureProfiles(['P']);const profiles=loadProfiles();profiles[0].virtualCoach={invalid:true};appStorage.setItem(PROFILES_KEY,JSON.stringify(profiles));const raw=map.get(PROFILES_KEY);assert.throws(()=>readCoach(p.id));assert.equal(map.get(PROFILES_KEY),raw);
 memory();const [q]=ensureProfiles(['Q']),old=readCoach(q.id);globalThis.localStorage.setItem=()=>{throw Error('quota');};assert.throws(()=>writeCoach(q.id,old,createCoachPlan(old,10,at)),/quota/);assert.deepEqual(readCoach(q.id),old);
});
test('AI context contains computed coach summary without profile ID or raw darts',()=>{
 const profileId='11111111-1111-4111-8111-111111111111';const c=finish(planTask('scoring'));
 const context=buildCoachContext({profileId,trainings:[],matches:[],virtualCoach:c});assert.equal(context.virtualCoach.summary[0].total,1);
 const serialized=JSON.stringify(context);assert.ok(!serialized.includes(profileId));assert.ok(!serialized.includes(c.plans[0].id));assert.ok(!serialized.includes('events'));assert.equal(context.availableExercises.length,6);
});

test('legacy AI reports remain visible and only the matching profile joins the synced report history',async()=>{
 memory();const [p,q]=ensureProfiles(['P','Q']);
 appStorage.setItem('dart-party-coach-reports-v1',JSON.stringify([{profileId:p.id,sessionId:'old',createdAt:1,advice:{summary:'old own'}},{profileId:q.id,sessionId:'other',createdAt:2,advice:{summary:'other'}}]));
 const {profileCoachReports}=await import('../src/virtual-coach-storage.js');assert.equal(profileCoachReports(p.id).length,1);
 saveProfileCoachReport(p.id,'new',{createdAt:3,advice:{summary:'new'}});assert.equal(profileCoachReports(p.id).length,2);assert.equal(loadProfiles()[0].coachReports.length,2);assert.ok(!JSON.stringify(loadProfiles()[0]).includes('other'));
});
test('player dashboard counts coach work and exposes its history without turning it into a match win',async()=>{
 const {dashboardSummary,profileHistory}=await import('../src/player-dashboard.js');const c=finish(planTask('scoring'));
 const data={profile:{virtualCoach:c},trainings:[],jdc:[],matches:[]},st={competitions:[],cyferkiResults:[]};
 const summary=dashboardSummary(data,st);assert.equal(summary.sessions,1);assert.equal(summary.darts,30);assert.equal(summary.wins,0);assert.match(profileHistory(data,st)[0].label,/Coach/);
});
