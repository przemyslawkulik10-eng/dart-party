import test from 'node:test';
import assert from 'node:assert/strict';
import {createMatch,configureCricketTeams,cricketTeamOrder,recordDart as hit,nextPlayer,nextLeg,replay,undoDart,validateMatch} from '../src/engine.js';
const make=(scoring='cutthroat',legs=1,opening='standard')=>configureCricketTeams(createMatch(['A1','A2','B1','B2','C'],'cricket',false,scoring,opening,legs),[0,0,1,1,2]);
const pass=m=>{while(!replay(m).ready)m=hit(m,0);return nextPlayer(m);};
test('two pairs and solo get equal team turns with alternating partners',()=>{
 let m=make();assert.deepEqual(cricketTeamOrder(m),[0,2,4,1,3,4]);
 const seen=[];for(let i=0;i<12;i++){seen.push(replay(m).current);m=pass(m);}
 assert.deepEqual(seen,[0,2,4,1,3,4,0,2,4,1,3,4]);assert.equal(replay(m).round,5);
});
test('partners share closures, opening and cutthroat receives points only once per team',()=>{
 let m=hit(hit(make('cutthroat',1,'two-triples'),17,3),15,3);m=hit(m,20,3);
 for(let i=0;i<3;i++)m=pass(m);
 assert.equal(replay(m).current,1);assert.equal(replay(m).players[1].marks[20],3);
 m=hit(m,20,3);const s=replay(m);
 assert.deepEqual(s.players.map(p=>p.score),[0,0,60,60,60]);assert.equal(s.turnPoints,120);
 assert.equal(s.players[0].darts,3);assert.equal(s.players[1].darts,1);
 const restored=replay(undoDart(m));assert.deepEqual(restored.players.map(p=>p.score),[0,0,0,0,0]);
});
test('standard scoring by second partner updates shared score and ignores partner as opponent',()=>{
 let m=hit(make('standard'),20,3);for(let i=0;i<3;i++)m=pass(m);
 m=hit(m,20,2);assert.deepEqual(replay(m).players.map(p=>p.score),[40,40,0,0,0]);
 assert.deepEqual(replay(validateMatch(JSON.parse(JSON.stringify(m)))),replay(m));
});
test('team leg and set wins include both partners, next leg and undo restore shared state',()=>{
 let m=make('cutthroat',2);
 const closeLeg=game=>{
  for(const n of [20,19,18,17,16,15,25,25]){
   let s=replay(game);while(![0,1].includes(s.current)){game=pass(game);s=replay(game);}
   if(s.ready){game=pass(game);while(![0,1].includes(replay(game).current))game=pass(game);}
   game=hit(game,n,n===25?2:3);
  }return game;
 };
 m=closeLeg(m);assert.equal(replay(m).winner,null);assert.deepEqual(replay(m).legWins,[1,1,0,0,0]);
 m=nextLeg(m);assert.equal(replay(m).current,2);assert.equal(replay(m).players[1].marks[20],0);
 m=closeLeg(m);assert.notEqual(replay(m).winner,null);assert.deepEqual(replay(m).legWins,[2,2,0,0,0]);
 assert.equal(replay(undoDart(m)).winner,null);assert.deepEqual(replay(undoDart(m)).legWins,[1,1,0,0,0]);
});
test('reject invalid team metadata and reassignment after a dart',()=>{
 for(const teams of [[0,0,0,1,2],[0,0,1,1,3],[0,1,2],null])assert.throws(()=>validateMatch({...make(),teams}));
 assert.throws(()=>configureCricketTeams(hit(make(),0),[0,1,0,1,2]));
 assert.throws(()=>validateMatch({...make(),mode:'301'}));
});
test('bull ordering keeps first named player first even when assigned team two',()=>{
 const m=configureCricketTeams(createMatch(['C','A1','A2','B1','B2'],'cricket'),[2,0,0,1,1]);
 assert.deepEqual(cricketTeamOrder(m),[0,2,4,0,1,3]);assert.equal(replay(m).current,0);
});
