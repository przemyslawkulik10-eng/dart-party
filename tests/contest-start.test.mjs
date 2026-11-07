import {test} from 'node:test';
import assert from 'node:assert/strict';
import {matchFromContest} from '../src/contest-start.js';
import {replay,validateMatch} from '../src/engine.js';

test('skip preserves teams, profiles and rules without inventing scoring throws',()=>{
 const draft={names:['Maciek','Przemek','Maniek','Dawid','Jarek'],mode:'cricket',doubleOut:false,cricketScoring:'cutthroat',cricketOpening:'two-triples',legsToWin:3,teams:[0,1,0,1,2],profileIds:Array.from({length:5},()=>crypto.randomUUID()),sessionType:'competition',throws:[25,0,50]};
 const original=structuredClone(draft);
 for(let starter=0;starter<5;starter++){
  const match=matchFromContest(draft,starter);
  assert.equal(match.names[0],draft.names[starter]);
  assert.deepEqual(match.events,[]);
  for(let i=0;i<5;i++){
   const before=draft.names.indexOf(match.names[i]);
   assert.equal(match.teams[i],draft.teams[before]);
   assert.equal(match.profileIds[i],draft.profileIds[before]);
  }
  const state=replay(validateMatch(JSON.parse(JSON.stringify(match))));
  assert.equal(state.current,0);
  assert.equal(state.players[0].name,draft.names[starter]);
  assert(state.players.every(p=>p.darts===0&&p.score===0&&Object.values(p.marks).every(n=>n===0)));
  assert.equal(match.cricketOpening,'two-triples');assert.equal(match.legsToWin,3);assert.equal(match.cricketScoring,'cutthroat');
 }
 assert.deepEqual(draft,original);
});
test('X01 direct start preserves starting score and Double Out',()=>{
 for(const mode of ['201','301','501']){
  const match=matchFromContest({names:['A','B'],mode,doubleOut:true,legsToWin:2},1);
  assert.deepEqual(match.names,['B','A']);assert.equal(replay(match).players[0].score,Number(mode));assert.equal(match.doubleOut,true);assert.deepEqual(match.events,[]);
 }
});
test('reject invalid starter without modifying draft',()=>{
 const draft={names:['A','B'],mode:'301'};
 for(const value of [-1,2,NaN,undefined,'0',.5])assert.throws(()=>matchFromContest(draft,value));
});
