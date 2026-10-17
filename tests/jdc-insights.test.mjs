import {test} from 'node:test';
import assert from 'node:assert/strict';
import {jdcInsights} from '../src/jdc-insights.js';
import {createJdc,recordJdcDart,jdcTarget} from '../src/jdc.js';
const profile={id:'11111111-1111-4111-8111-111111111111',name:'TEST'},now=Date.UTC(2026,9,17),day=86400000;
function session(end,perfect=false){let s=createJdc(profile,false,end-1000);for(let i=0;i<57;i++){const t=jdcTarget(i);s=recordJdcDart(s,perfect?t.number:0,perfect?(t.phase===1?2:t.dart):1,end-56+i);}return s;}
test('empty means null accuracy; genuine zero hits mean 0 percent; 13 attempts never mark weakness',()=>{
 const empty=jdcInsights([],profile.id,30,now);assert.equal(empty.average,null);assert.equal(empty.doubles[0].accuracy,null);
 const rows=Array.from({length:13},()=>session(now-day));const s=jdcInsights(rows,profile.id,30,now);assert.equal(s.doubles[0].accuracy,0);assert.equal(s.doubles[0].attempts,13);assert.deepEqual(s.focus,[]);assert.match(s.reason,/za mało/);
});
test('period uses completion, includes boundary once, excludes future and unfinished; record remains lifetime',()=>{
 const rows=[session(now-31*day,true),session(now-30*day),session(now),session(now+1,true),createJdc(profile,false,now)];
 const s=jdcInsights(rows,profile.id,30,now);assert.equal(s.sessions,2);assert.equal(s.previousSessions,1);assert.equal(s.average,0);assert.equal(s.previousAverage,3380);assert.equal(s.delta,-3380);assert.equal(s.lifetimeBest,3380);
 const all=jdcInsights(rows,profile.id,'all',now);assert.equal(all.sessions,3);assert.equal(all.delta,null);
});
test('Shanghai 15 has two visits per routine, correct average and bonuses; all 57 account for points',()=>{
 const s=jdcInsights([session(now,true)],profile.id,30,now),r=s.shanghai.find(r=>r.number===15);
 assert.equal(r.visits,2);assert.equal(r.throws,6);assert.equal(r.bonuses,2);assert.equal(r.average,190);assert.equal(r.maximum,190);
 assert.equal(s.shanghai.reduce((a,r)=>a+r.points,0),2280);assert.equal(s.average,3380);
});
test('observed tied lowest fields are retained, not arbitrary weakest; all tied means no focus',()=>{
 const rows=Array.from({length:20},()=>session(now,true));for(const s of rows){s.darts[18]={...s.darts[18],number:0,multiplier:1};s.darts[19]={...s.darts[19],number:0,multiplier:1};}
 assert.deepEqual(jdcInsights(rows,profile.id,30,now).focus,[1,2]);assert.deepEqual(jdcInsights(Array.from({length:20},()=>session(now)),profile.id,30,now).focus,[]);
});
test('invalid period, duplicate history and mixed profiles rejected',()=>{
 const s=session(now);assert.throws(()=>jdcInsights([s],profile.id,7,now));assert.throws(()=>jdcInsights([s,s],profile.id,30,now));assert.throws(()=>jdcInsights([s],'other',30,now));
});
