import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createJdc,jdcTarget,jdcStats,jdcGrade,recordJdcDart,undoJdc,validateJdc,loadJdc,saveJdc,jdcProgress,JDC_KEY} from '../src/jdc.js';
import {buildCoachContext} from '../src/coach-context.js';
const profile={id:'11111111-1111-4111-8111-111111111111',name:'PRIVATE NAME'};
const start=()=>createJdc(profile,false,1000);
const add=(s,n,m=1)=>recordJdcDart(s,n,m,2000+s.darts.length);
function full(perfect=false){let s=start();for(let i=0;i<57;i++){const t=jdcTarget(i);s=add(s,perfect?t.number:0,perfect?(t.phase===1?2:t.dart):1);}return s;}
test('JDC has 57 darts, repeated 15 and single attempt per double including bull',()=>{
 assert.deepEqual([0,17,18,37,38,39,56].map(i=>jdcTarget(i).number),[10,15,1,20,25,15,20]);
 assert.deepEqual([17,18,38,39].map(i=>jdcTarget(i).phase),[0,1,1,2]);assert.equal(jdcTarget(57),null);
 let s=start();for(let i=0;i<19;i++)s=add(s,0);assert.equal(jdcTarget(s.darts.length).number,2);
});
test('Shanghai awards actual target points and bonus for all six S/D/T permutations',()=>{
 for(const ms of [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]){let s=start();for(const m of ms)s=add(s,10,m);assert.equal(jdcStats(s).score,160);assert.equal(jdcStats(s).phases[0].shanghais,1);assert.equal(jdcStats(undoJdc(s)).phases[0].shanghais,0);}
 let s=start();s=add(s,10);s=add(s,10);s=add(s,10,3);assert.equal(jdcStats(s).score,50);
 s=start();s=add(s,11,3);s=add(s,10,2);s=add(s,10,3);assert.equal(jdcStats(s).score,50);
});
test('doubles score 50 only for correct D and bull 100 only for inner bull',()=>{
 let s=start();while(s.darts.length<18)s=add(s,0);s=add(s,1,2);s=add(s,2,1);s=add(s,4,2);assert.equal(jdcStats(s).score,50);
 while(s.darts.length<38)s=add(s,0);
 assert.equal(jdcStats(add(s,25,1)).score,50);assert.equal(jdcStats(add(s,25,2)).score,150);
});
test('perfect 3380 and zero complete, prohibit 58th dart, undo completion and JSON resume',()=>{
 const s=full(true),st=jdcStats(s);assert.equal(st.score,3380);assert.deepEqual(st.phases.map(p=>p.score),[1050,1100,1230]);assert.equal(st.grade,'Złoty');assert.equal(st.complete,true);
 assert.throws(()=>add(s,20,3));const u=undoJdc(JSON.parse(JSON.stringify(s)));assert.equal(u.endedAt,null);assert.equal(jdcTarget(u.darts.length).number,20);assert.equal(jdcStats(add(u,20,3)).score,3380);
 assert.equal(jdcStats(full()).score,0);assert.equal(jdcStats(full()).complete,true);
 assert.throws(()=>validateJdc({...s,endedAt:null}));assert.throws(()=>validateJdc({...start(),endedAt:2000}));
});
test('grade boundaries match JDC, progress excludes other players and incomplete/current trials',()=>{
 assert.deepEqual([0,149,150,299,300,449,450,599,600,699,700,849,850,1249,1250,3380].map(jdcGrade),['Biały','Biały','Fioletowy','Fioletowy','Żółty','Żółty','Zielony','Zielony','Niebieski','Niebieski','Czerwony','Czerwony','Czarny','Czarny','Złoty','Złoty']);
 const current={...full(),createdAt:1500},best=full(true),other={...full(true),profileId:'22222222-2222-4222-8222-222222222222'};
 assert.deepEqual(jdcProgress(current,[current,best,other,start()]),{count:1,best:3380,last:3380,average:3380});
});
test('save/resume stays separate, corrupt history never overwritten',()=>{
 const db=new Map();globalThis.localStorage={getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,v)};
 const s=add(start(),10,3);saveJdc(s);assert.deepEqual(loadJdc(),[s]);saveJdc(add(s,10));assert.equal(loadJdc().length,1);assert.equal(loadJdc()[0].darts.length,2);
 db.set(JDC_KEY,'broken');assert.throws(()=>saveJdc(s));assert.equal(db.get(JDC_KEY),'broken');
});
test('coach gets computed complete JDC phases without identity; rejects mixed profiles or incomplete trials',()=>{
 const payload={profileId:profile.id,trainings:[],matches:[],jdc:[full(true)]};const c=buildCoachContext(payload);
 assert.equal(c.jdc.completed,1);assert.equal(c.jdc.sessions[0].score,3380);assert.equal(c.jdc.sessions[0].phases[1].hits,21);assert.ok(!JSON.stringify(c).includes('PRIVATE'));assert.ok(!JSON.stringify(c).includes(profile.id));
 assert.throws(()=>buildCoachContext({...payload,jdc:[start()]}));assert.throws(()=>buildCoachContext({...payload,profileId:'22222222-2222-4222-8222-222222222222'}));assert.throws(()=>buildCoachContext({...payload,jdc:[payload.jdc[0],payload.jdc[0]]}));
});
