import test from 'node:test';
import assert from 'node:assert/strict';
import {trainingSummary,trainingSummaryMarkup} from '../src/training-summary.js';
import {remainingDarts} from '../src/dart-progress.js';
const dart=(n,extra={})=>({number:n,multiplier:1,target:20,...extra});
test('positions use their own denominator, including incomplete final turn',()=>{
 const s={darts:[dart(20),dart(5),dart(20),dart(20)]},before=JSON.stringify(s),r=trainingSummary(s);
 assert.deepEqual(r.positions.map(p=>[p.hits,p.throws,p.accuracy]),[[2,2,100],[0,1,0],[1,1,100]]);
 assert.equal(r.bestStreak,2);assert.equal(r.partial,1);assert.equal(JSON.stringify(s),before);
 assert.equal(r.start.throws,r.end.throws);assert.equal(r.hits,3);
});
test('unknown field misses remain different from actual off-board misses',()=>{
 const r=trainingSummary({darts:[dart(0,{unknownMiss:true}),dart(0),dart(5),dart(20,{multiplier:3})]});
 assert.equal(r.fields['Poza celem — pole niepodane'],1);assert.equal(r.fields['Poza tarczą'],1);assert.equal(r.fields.S5,1);assert.equal(r.fields.T20,1);assert.equal(r.hits,1);
});
test('observation requires samples and separation, uses actual weakest position without diagnosis',()=>{
 const darts=Array.from({length:30},(_,i)=>dart(i%3===2?5:20));
 assert.match(trainingSummary({darts}).observation,/3. lotką.*0 z 10/);
 assert.doesNotMatch(trainingSummary({darts:darts.slice(0,9)}).observation,/najrzadziej/);
 assert.doesNotMatch(trainingSummary({darts:Array.from({length:30},()=>dart(20))}).observation,/najrzadziej/);
});
test('empty summary has no invented accuracy and odd comparison drops middle dart',()=>{
 assert.equal(trainingSummary({darts:[]}).accuracy,null);
 assert.doesNotMatch(trainingSummaryMarkup({darts:[]}),/NaN|Infinity/);
 const r=trainingSummary({darts:[dart(20),dart(5),dart(20)]});assert.equal(r.start.hits,1);assert.equal(r.end.hits,1);
});
test('shared dart illustration consumes one per throw and closes early bust',()=>{
 for(let n=0;n<=3;n++){const html=remainingDarts({turn:Array(n)});assert.equal((html.match(/remaining-dart available/g)||[]).length,3-n);}
 assert.match(remainingDarts({turn:[{}],ready:true}),/Pozostałe lotki: 0/);
});
test('all selectable sectors and bull preserve target through save and statistics',async()=>{
 const {TRAINING_TARGETS,createTraining,recordTrainingDart,validateTraining,trainingStats}=await import('../src/training.js');
 for(const target of TRAINING_TARGETS){
  let s={...createTraining('QA',5,1000),target};
  s=recordTrainingDart(s,target,1,2000);s=recordTrainingDart(s,target,2,3000);s=recordTrainingDart(s,0,1,4000);
  assert.deepEqual(trainingStats(validateTraining(JSON.parse(JSON.stringify(s)))),{throws:3,hits:2,accuracy:67});
 }
 let bull={...createTraining('QA',5,1000),target:25,targetMultiplier:2};bull=recordTrainingDart(bull,25,1,2000);bull=recordTrainingDart(bull,25,2,3000);assert.equal(trainingStats(validateTraining(bull)).hits,1);
});
