import test from 'node:test';
import assert from 'node:assert/strict';
import {newCoachMatch,coachTurn,undoHuman,matchInsight} from '../src/coach-match.js';
import {recordDart,replay} from '../src/engine.js';
test('coach plays a legal turn and correction removes reply without erasing previous human darts',()=>{
 let m=newCoachMatch('Przemek',201);for(let i=0;i<3;i++)m=recordDart(m,20,1);
 const reply=coachTurn(m,()=>0.5);assert.equal(replay(reply).current,0);assert.equal(replay(reply).players[1].darts,3);
 const undone=undoHuman(reply);assert.equal(replay(undone).players[0].darts,2);assert.equal(replay(undone).players[1].darts,0);
 assert.deepEqual(replay(JSON.parse(JSON.stringify(reply))),replay(reply));
});
test('straight finish, double-out bust and completed game cannot trigger bot',()=>{
 let m=newCoachMatch('Przemek',201);for(const [n,x] of [[20,3],[20,3],[20,3]])m=recordDart(m,n,x);
 m=coachTurn(m,()=>0.99);m=recordDart(m,7,3);assert.equal(replay(m).winner,0);assert.deepEqual(coachTurn(m),m);
 assert.equal(replay(undoHuman(m)).winner,null);
 let d={...m,doubleOut:true};assert.equal(replay(d).winner,null);assert.equal(replay(d).bust,true);
});
test('insight counts only human darts and no invented checkout percentage',()=>{
 let m=newCoachMatch('Przemek',501);for(let i=0;i<3;i++)m=recordDart(m,20,1);m=coachTurn(m,()=>0.5);
 assert.deepEqual(matchInsight([m]),{darts:3,finished:0,average:60});
});
test('an optional unfinished exercise plan can be left without losing darts',async()=>{
 const {emptyCoach,createCoachPlan,changeCoachTask,activeCoachPlan}=await import('../src/virtual-coach.js');
 let c=createCoachPlan(emptyCoach(),10);c=changeCoachTask(c,c.plans[0].tasks[0].id,'resume');c=changeCoachTask(c,c.plans[0].tasks[0].id,'dart',{number:20,multiplier:1});
 c={...c,plans:c.plans.map(p=>({...p,archived:true,tasks:p.tasks.map(t=>({...t,paused:true}))}))};
 assert.equal(activeCoachPlan(c),null);c=createCoachPlan(c,10);assert.equal(c.plans[0].tasks[0].events.length,1);assert.equal(c.plans.length,2);
});
