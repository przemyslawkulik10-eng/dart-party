import test from 'node:test';
import assert from 'node:assert/strict';
import {newCoachMatch,coachThrow,undoHuman,matchInsight} from '../src/coach-match.js';
import {replay,recordDart,nextPlayer} from '../src/engine.js';
import {createCyferki,cyferkiState,chooseCyferki,throwCyferki,CYFERKI_FIELDS} from '../src/cyferki.js';
import {createMnoznikSparing,mnoznikSparingState,throwMnoznikSparing} from '../src/mnoznik-sparing.js';
import {coachOpponent,coachHits,coachPoints,undoHumanEvent} from '../src/game-coach.js';
for(const scoring of ['standard','cutthroat'])for(const opening of ['standard','two-triples'])test(`Cricket bot finishes legally: ${scoring}/${opening}`,()=>{
 let m=newCoachMatch('Przemek','cricket',false,'strong',scoring,opening);
 for(let i=0;i<300&&replay(m).winner===null;i++){
  const s=replay(m);m=s.ready?nextPlayer(m):s.current===0?recordDart(m,0,1):coachThrow(m,()=>0);
 }
 assert.equal(replay(m).winner,1);
 const restored=JSON.parse(JSON.stringify(m));assert.deepEqual(replay(restored),replay(m));
 const undone=undoHuman(restored);assert.equal(replay(undone).current,0);assert.equal(replay(undone).winner,null);
 assert.equal(matchInsight([m]).darts,0);
});
test('Cyferki bot respects chooser after closure on third dart; undo removes reply',()=>{
 let m={...createCyferki([{id:crypto.randomUUID(),name:'Przemek'},coachOpponent()],{scoring:'hits',progress:'player'}),coachMode:true};
 m=chooseCyferki(m,20);m=throwCyferki(m,1);m=throwCyferki(m,1);m=throwCyferki(m,1);
 assert.equal(cyferkiState(m).chooser,0);assert.equal(cyferkiState(m).pendingNext,true);
 m=chooseCyferki(m,19);assert.equal(cyferkiState(m).current,1);
 m=throwCyferki(m,3);assert.equal(cyferkiState(m).chooser,1);
 const u=undoHumanEvent(m,cyferkiState,'cyferki');assert.equal(cyferkiState(u).target,null);assert.equal(cyferkiState(u).chooser,0);
 for(let i=0;i<300&&!cyferkiState(m).finished;i++){const s=cyferkiState(m);m=s.target===null?chooseCyferki(m,CYFERKI_FIELDS.find(n=>!s.closed.includes(n))):throwCyferki(m,s.target===25?2:3);}
 assert.equal(cyferkiState(m).finished,true);
});
test('Mnożnik alternates complete bot turns and preserves human undo',()=>{
 let m={...createMnoznikSparing([{id:crypto.randomUUID(),name:'Przemek'},coachOpponent()]),coachMode:true};
 for(let i=0;i<6;i++)m=throwMnoznikSparing(m,1);
 const undone=undoHumanEvent(m,mnoznikSparingState,'mnoznik');assert.equal(undone.events.length,2);assert.equal(mnoznikSparingState(undone).current,0);
 while(!mnoznikSparingState(m).finished){const s=mnoznikSparingState(m);m=throwMnoznikSparing(m,s.phase==='hits'?coachHits(false,()=>0.8):coachPoints(()=>0.8));}
 assert.equal(m.events.length,72);assert.equal(mnoznikSparingState(m).states[0].darts,36);
});
