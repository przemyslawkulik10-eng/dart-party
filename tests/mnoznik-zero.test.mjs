import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {createMnoznik,mnoznikState,throwMnoznik,skipMnoznikScore,undoMnoznik,canSkipMnoznik} from '../src/mnoznik.js';
import {createMnoznikSparing,mnoznikSparingState,throwMnoznikSparing,skipMnoznikSparingScore,undoMnoznikSparing} from '../src/mnoznik-sparing.js';
import {playerMilestones,milestoneCounts} from '../src/player-milestones.js';
import {undoHumanEvent} from '../src/game-coach.js';
globalThis.crypto??=webcrypto;
const profile=()=>({id:crypto.randomUUID(),name:'Gracz testowy'});
const hit=(m,n)=>throwMnoznik(m,n,2);
const multiHit=(m,n)=>throwMnoznikSparing(m,n,2);
test('zero skip is one reversible event, not three misses, survives reopening',()=>{
 let m=createMnoznik(profile(),1);
 assert.throws(()=>skipMnoznikScore(m,2));
 for(const n of [0,0,0])m=hit(m,n);
 const before=m;m=skipMnoznikScore(m,2);
 const s=mnoznikState(JSON.parse(JSON.stringify(m)));
 assert.equal(s.target,8);assert.equal(s.darts,3);assert.equal(s.skippedDarts,3);
 assert.equal(s.rounds[0].complete,true);assert.deepEqual(s.rounds[0].scores,[]);
 assert.deepEqual(undoMnoznik(m),before);
 assert.throws(()=>skipMnoznikScore(hit(before,60),2));
 let positive=createMnoznik(profile(),1);for(const n of [0,1,0])positive=hit(positive,n);
 assert.throws(()=>skipMnoznikScore(positive,2));
 assert.throws(()=>mnoznikState({...positive,events:[...positive.events,{type:'skip-score',at:2}]}));
});
test('six skipped zero rounds finish with only eighteen real darts and undo reopens final round',()=>{
 let m=createMnoznik(profile(),1);
 for(let r=0;r<6;r++){for(let d=0;d<3;d++)m=hit(m,0);m=skipMnoznikScore(m,2);}
 const s=mnoznikState(m);assert.equal(s.finished,true);assert.equal(s.darts,18);assert.equal(s.skippedDarts,18);assert.equal(s.total,0);
 assert.equal(canSkipMnoznik(mnoznikState(undoMnoznik(m))),true);
 assert.throws(()=>hit(m,0));assert.throws(()=>skipMnoznikScore(m,2));
});
for(const count of [2,6])test(`skip maintains correct turns and scoring with ${count} players`,()=>{
 let m=createMnoznikSparing(Array.from({length:count},profile),1);
 for(let r=0;r<6;r++){
  for(let p=0;p<count;p++)for(let d=0;d<3;d++)m=multiHit(m,p===0?0:1);
  assert.equal(mnoznikSparingState(m).current,0);
  const before=m;m=skipMnoznikSparingScore(m,2);
  assert.deepEqual(undoMnoznikSparing(m),before);
  assert.equal(mnoznikSparingState(m).current,1);
  for(let p=1;p<count;p++)for(let d=0;d<3;d++)m=multiHit(m,60);
 }
 const s=mnoznikSparingState(JSON.parse(JSON.stringify(m)));
 assert.equal(s.finished,true);assert.equal(s.totalDarts,18+(count-1)*36);
 assert.deepEqual(s.winners,Array.from({length:count-1},(_,i)=>i+1));
 assert.equal(s.states[1].total,3240);assert.equal(s.states[0].darts,18);
});
test('optional zero-point 180 and later 170 keep true timestamps and round numbers after skip',()=>{
 const p=profile();let m=createMnoznik(p,1);
 for(const n of [0,0,0])m=hit(m,n);m=skipMnoznikScore(m,2);
 for(const n of [0,0,0,60,60,60,1,1,1,60,60,50])m=hit(m,n);
 const data={profile:p,mnoznik:[m]};
 assert.deepEqual(milestoneCounts(data),{180:1,170:1});
 assert.deepEqual(playerMilestones(data).map(a=>[a.kind,a.round,a.at]),[['180',2,'1970-01-01T00:00:00.002Z'],['170',3,'1970-01-01T00:00:00.002Z']]);
 assert.deepEqual(milestoneCounts({...data,mnoznik:[undoMnoznik(m)]}),{180:1,170:0});
});
test('coach undo removes its replies and restores the human skip choice',()=>{
 let m={...createMnoznikSparing([profile(),profile()],1),coachMode:true};
 for(let d=0;d<6;d++)m=multiHit(m,0);
 const before=m;m=skipMnoznikSparingScore(m,2);m=skipMnoznikSparingScore(m,2);
 assert.deepEqual(undoHumanEvent(m,mnoznikSparingState,'mnoznik'),before);
});
