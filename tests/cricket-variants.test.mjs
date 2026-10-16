import {test} from 'node:test';import assert from 'node:assert/strict';
import {createMatch,recordDart,nextPlayer,replay,undoDart,validateMatch,isShanghai,DEFAULT_PLAYERS} from '../src/engine.js';
const dart=(m,n,x=1)=>recordDart(m,n,x);
const pass=m=>{while(!replay(m).ready)m=dart(m,0);return nextPlayer(m);};
test('cutthroat full extras to each of five open opponents; undo and JSON',()=>{
 let m=createMatch(DEFAULT_PLAYERS,'cricket',false,'cutthroat');m=dart(m,17,3);m=dart(m,17);m=dart(m,17,2);
 assert.deepEqual(replay(m).players.map(p=>p.score),[0,51,51,51,51,51]);assert.equal(replay(m).turnPoints,255);
 assert.deepEqual(replay(validateMatch(JSON.parse(JSON.stringify(m)))),replay(m));
 assert.deepEqual(replay(undoDart(m)).players.map(p=>p.score),[0,17,17,17,17,17]);
});
test('closed opponents protected; partially closed target surplus; all closed target dead',()=>{
 let m=createMatch(['A','B','C'],'cricket',false,'cutthroat');m=dart(m,20,3);m=pass(m);m=dart(m,20,3);m=pass(m);m=dart(m,20);m=dart(m,20,3);
 assert.deepEqual(replay(m).players.map(p=>p.score),[0,0,0]);m=pass(m);m=dart(m,20,3);assert.deepEqual(replay(m).players.map(p=>p.score),[0,0,0]);
 let n=createMatch(['A','B','C'],'cricket',false,'cutthroat');n=dart(n,20);n=dart(n,20,3);assert.deepEqual(replay(n).players.map(p=>p.score),[0,20,20]);
 n=pass(n);n=dart(n,20,3);n=dart(n,20,2);assert.deepEqual(replay(n).players.map(p=>p.score),[0,20,60]);
});
test('bull excess goes to opponents',()=>{let m=createMatch(['A','B'],'cricket',false,'cutthroat');m=dart(m,25,2);m=dart(m,25,2);assert.deepEqual(replay(m).players.map(p=>p.score),[0,25]);});
test('lowest equal score and all fields closed wins, undo reopens',()=>{
 let m=createMatch(['A','B'],'cricket',false,'cutthroat');for(const n of [20,19,18,17,16,15]){if(replay(m).ready){m=pass(m);m=pass(m);}m=dart(m,n,3);}m=pass(m);m=pass(m);m=dart(m,25,2);m=dart(m,25);
 assert.equal(replay(m).winner,0);assert.equal(replay(undoDart(m)).winner,null);
});
test('closing all with higher score does not win in cutthroat',()=>{
 let m=createMatch(['A','B'],'cricket',false,'cutthroat');m=dart(m,20,3);m=dart(m,20);m=pass(m);
 for(const n of [20,19,18,17,16,15]){if(replay(m).ready){m=pass(m);m=pass(m);}m=dart(m,n,3);}m=pass(m);m=pass(m);m=dart(m,25,2);m=dart(m,25);assert.equal(replay(m).winner,null);
});
test('old saved Cricket remains standard; invalid variant rejected',()=>{let m=createMatch(['A','B'],'cricket');delete m.cricketScoring;m=dart(m,20,3);m=dart(m,20);assert.deepEqual(replay(validateMatch(m)).players.map(p=>p.score),[20,0]);assert.throws(()=>validateMatch({...m,cricketScoring:'bad'}));});
test('Shanghai all six permutations, no duplicates/bull/mixed targets',()=>{
 for(const order of [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]])assert(isShanghai(order.map(multiplier=>({number:17,multiplier}))));
 for(const turn of [[{number:17,multiplier:1},{number:17,multiplier:1},{number:17,multiplier:3}], [{number:17,multiplier:1},{number:18,multiplier:2},{number:17,multiplier:3}], [1,2,3].map(multiplier=>({number:25,multiplier}))])assert(!isShanghai(turn));
});
