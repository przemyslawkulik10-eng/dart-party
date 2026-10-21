import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTraining,remainingTime,pauseTraining,resumeTraining,finishTraining,recordTrainingDart,trainingStats,loadTrainings,saveTraining,TRAINING_KEY} from '../src/training.js';
import {createMatch,recordDart,undoDart,validateMatch} from '../src/engine.js';
test('solo practice records actual hit and intended target, not multiplied hit count',()=>{
 let s=createTraining('PRZEMEK',15,1000);
 s=recordTrainingDart(s,20,3,2000);s=recordTrainingDart(s,1,1,3000);s=recordTrainingDart(s,0,1,4000);
 assert.deepEqual(trainingStats(s),{throws:3,hits:1,accuracy:33});
 assert.equal(s.darts[1].target,20);
 assert.deepEqual(trainingStats({...s,darts:s.darts.slice(0,-1)}),{throws:2,hits:1,accuracy:50});
 assert.equal(trainingStats(createTraining('A',5)).accuracy,null);
});
test('deadline survives JSON, pause excludes time away, finished practice rejects darts',()=>{
 let s=createTraining('A',5,1000);s=pauseTraining(s,61000);
 assert.equal(remainingTime(s,900000),240000);
 assert.throws(()=>recordTrainingDart(s,20,1,900000));
 s=resumeTraining(s,900000);s=JSON.parse(JSON.stringify(s));
 assert.equal(remainingTime(s,1140000),0);
 assert.throws(()=>recordTrainingDart(s,20,1,1140000));
 s=finishTraining(s,1140000);assert.equal(s.remainingMs,0);
 assert.throws(()=>resumeTraining(s,1200000));
});
test('practice saves separately and never overwrites corrupt storage',()=>{
 const map=new Map([['dart-party-matches-v1','untouched']]);
 globalThis.localStorage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 const s=createTraining('A',5,1000);saveTraining(s);saveTraining(recordTrainingDart(s,20,1,2000));
 assert.equal(loadTrainings().length,1);assert.equal(loadTrainings()[0].darts.length,1);
 assert.equal(map.get('dart-party-matches-v1'),'untouched');
 map.set(TRAINING_KEY,'broken');assert.throws(()=>saveTraining(s));assert.equal(map.get(TRAINING_KEY),'broken');
});
test('competition flag persists through darts, undo and JSON; old games remain untagged',()=>{
 const old=createMatch(['A','B'],'301');assert.equal(validateMatch(old).sessionType,undefined);
 let s={...old,sessionType:'competition'};s=recordDart(s,20,3);s=undoDart(s);
 assert.equal(validateMatch(JSON.parse(JSON.stringify(s))).sessionType,'competition');
 assert.throws(()=>validateMatch({...s,sessionType:'bad'}));
});

test('coach is opt-in, can be disabled, and survives saved sessions',async()=>{
 const {trainingAdvice,validateTraining}=await import('../src/training.js');
 let s=createTraining('A',5,1000);assert.equal(s.coachEnabled,false);assert.equal(trainingAdvice(s),'');
 const legacy={...s};delete legacy.coachEnabled;assert.equal(trainingAdvice(validateTraining(legacy)),'');
 s={...s,coachEnabled:true};for(const n of [20,1,20])s=recordTrainingDart(s,n,1,2000);
 assert.match(trainingAdvice(s),/2 trafień z 3/);
 assert.equal(validateTraining(JSON.parse(JSON.stringify(s))).coachEnabled,true);
 assert.equal(trainingAdvice({...s,coachEnabled:false}),'');
 assert.throws(()=>validateTraining({...s,coachEnabled:'yes'}));
});
