import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMatch,recordDart,nextPlayer,nextLeg,undoDart,replay} from '../src/engine.js';
import {playerAchievements,achievementsMarkup} from '../src/player-achievements.js';
const ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222'];
const start=()=>({...createMatch(['A','B'],'301',true,'standard','standard',2),profileIds:ids});
const data=m=>({profile:{id:ids[0]},matches:[m]});
const darts=(m,ds)=>ds.reduce((m,[n,mul])=>recordDart(m,n,mul),m);
const pass=m=>nextPlayer(darts(m,[[0,1],[0,1],[0,1]]));
test('180 has original timestamp, survives reload, no duplicates and undo removes it',()=>{
 let m=darts(start(),[[20,3],[20,3],[20,3]]);const at=m.events.at(-1).at;
 assert.equal(playerAchievements(data(m))[0].at,at);
 assert.equal(playerAchievements({...data(m),matches:[m,m]}).length,1);
 m=JSON.parse(JSON.stringify(nextPlayer(m)));assert.equal(playerAchievements(data(m))[0].at,at);
 assert.equal(playerAchievements(data(undoDart(m))).length,0);
 assert.equal(playerAchievements({profile:{id:ids[1]},matches:[m]}).length,0);
});
test('170 counts checkout and ordinary visits, remains through next leg',()=>{
 let m=darts(start(),[[20,3],[19,3],[14,1]]);m=pass(nextPlayer(m));
 m=darts(m,[[20,3],[20,3],[25,2]]);
 assert.equal(replay(m).legWinner,0);assert.equal(playerAchievements(data(m))[0].kind,'170');
 assert.equal(playerAchievements(data(nextLeg(m))).length,1);
 assert.equal(playerAchievements(data(undoDart(m))).length,0);
 assert.equal(playerAchievements(data({...m,doubleOut:false})).length,1);
 assert.equal(playerAchievements(data(darts(start(),[[20,3],[20,3],[25,2]]))).length,1);
});
test('bust is excluded; legacy date is unknown; history spans years',()=>{
 let m=darts(start(),[[20,3],[20,3],[20,3]]);m=pass(nextPlayer(m));m=darts(m,[[20,3],[20,3]]);
 assert.equal(playerAchievements(data(m)).length,1);
 const legacy={...m,events:m.events.map(({at,...e})=>e)};
 assert.equal(playerAchievements(data(legacy))[0].at,null);
 assert.match(achievementsMarkup(data(legacy)),/Brak dokładnej daty/);
 const old={...m,id:crypto.randomUUID(),events:m.events.map(e=>({...e,at:'2020-01-02T12:30:00.000Z'}))};
 assert.equal(playerAchievements({...data(m),matches:[old,m]}).length,2);
 assert.match(achievementsMarkup({...data(m),matches:[old,m]}),/2020/);
});

test('140 records each valid full turn, supports order of hits, and undo corrects it',()=>{
 for(const ds of [[[20,3],[20,3],[20,1]],[[20,1],[20,3],[20,3]]]){
 const m=darts(start(),ds);
 assert.equal(playerAchievements(data(m))[0].kind,'140');
 assert.equal(playerAchievements(data(undoDart(m))).length,0);
 assert.match(achievementsMarkup(data(m)),/140 — kolejka/);
 }
});
