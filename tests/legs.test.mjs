import {test} from 'node:test';import assert from 'node:assert/strict';
import {createMatch,recordDart,replay,nextPlayer,nextLeg,undoDart,validateMatch} from '../src/engine.js';
const dart=(m,n,x=1)=>recordDart(m,n,x);
const finish=m=>{for(const [n,x] of [[20,3],[20,3],[20,3]])m=dart(m,n,x);m=nextPlayer(m);for(let i=0;i<3;i++)m=dart(m,0);m=nextPlayer(m);for(const [n,x] of [[20,3],[20,3],[1,1]])m=dart(m,n,x);return m;};
test('301 first to three legs, alternating starter, final only at third win',()=>{
 let m=createMatch(['A','B'],'301',false,'standard','standard',3);m=finish(m);let s=replay(m);assert.deepEqual(s.legWins,[1,0]);assert.equal(s.winner,null);assert.equal(s.legWinner,0);assert.throws(()=>dart(m,1));
 m=nextLeg(m);s=replay(m);assert.equal(s.current,1);assert.deepEqual(s.players.map(p=>p.score),[301,301]);assert.equal(s.round,1);
 // Pass B's opening turn, then A wins again.
 for(let i=0;i<3;i++)m=dart(m,0);m=nextPlayer(m);m=finish(m);assert.deepEqual(replay(m).legWins,[2,0]);
 m=nextLeg(m);assert.equal(replay(m).current,0);m=finish(m);assert.equal(replay(m).winner,0);assert.deepEqual(replay(m).legWins,[3,0]);assert.throws(()=>nextLeg(m));
 const undone=undoDart(m);assert.equal(replay(undone).winner,null);assert.deepEqual(replay(undone).legWins,[2,0]);assert.deepEqual(replay(validateMatch(JSON.parse(JSON.stringify(m)))),replay(m));
});
test('undo across leg boundary restores previous winning dart and score',()=>{let m=finish(createMatch(['A','B'],'301',false,'standard','standard',3));m=nextLeg(m);m=undoDart(m);const s=replay(m);assert.equal(s.leg,1);assert.equal(s.legWinner,null);assert.equal(s.players[0].score,1);assert.deepEqual(s.legWins,[0,0]);});
test('cannot start next leg early; old records stay single leg',()=>{const m=createMatch(['A','B'],'301');assert.throws(()=>nextLeg(m));delete m.legsToWin;assert.equal(replay(finish(m)).winner,0);});
