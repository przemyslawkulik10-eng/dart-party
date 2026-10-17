import {test} from 'node:test';
import assert from 'node:assert/strict';
import {playerStats,exportPlayer} from '../src/player-stats.js';
import {createJdc,recordJdcDart,jdcTarget} from '../src/jdc.js';
import {createTraining,recordTrainingDart,finishTraining} from '../src/training.js';
import {createMatch,recordDart} from '../src/engine.js';
const profile={id:'11111111-1111-4111-8111-111111111111',name:'Przemek'},other='22222222-2222-4222-8222-222222222222';
function full(hit=false){let s=createJdc(profile,false,1000);for(let i=0;i<57;i++){const t=jdcTarget(i);s=recordJdcDart(s,hit?t.number:0,hit?(t.phase===1?2:t.dart):1,2000+i);}return s;}
test('player progress uses complete JDC and weighted sector accuracy; unfinished trials excluded from records',()=>{
 let s={...createTraining('Przemek',5,1000),profileId:profile.id};s=recordTrainingDart(s,20,1,1100);s=recordTrainingDart(s,1,1,1200);s=finishTraining(s,1300);
 let second={...createTraining('Przemek',5,1400),profileId:profile.id};second=recordTrainingDart(second,20,3,1500);second=finishTraining(second,1600);
 const data={profile,trainings:[s,second],jdc:[full(true),{...full(),createdAt:1500},createJdc(profile)],matches:[]};
 const st=playerStats(data);assert.equal(st.sector.accuracy,67);assert.equal(st.jdcBest,3380);assert.equal(st.jdcAverage,1690);assert.equal(st.jdcDelta,-3380);assert.equal(st.activeSessions,1);assert.equal(st.doubles.length,21);assert.ok(st.doubles.every(d=>d.attempts===2&&d.hits===1&&d.accuracy===50));assert.equal(st.trainingDarts,117);
});
test('match stats include only player darts and wins; export excludes opponent records and auth',()=>{
 let m={...createMatch(['Przemek','PRIVATE OPPONENT'],'201'),profileIds:[profile.id,other]};m=recordDart(m,20,3);m=recordDart(m,20,3);m=recordDart(m,20,3);
 const data={profile,trainings:[],jdc:[],matches:[m]},st=playerStats(data);assert.equal(st.completedMatches,0);assert.equal(st.competitions[0].darts,3);assert.equal(st.wins,0);
 const serialized=JSON.stringify(exportPlayer(data));assert.ok(!serialized.includes('PRIVATE OPPONENT'));assert.ok(!serialized.includes(other));assert.ok(!serialized.includes('events'));assert.ok(!serialized.includes('access_token'));
 assert.throws(()=>playerStats({...data,profile:{...profile,id:'33333333-3333-4333-8333-333333333333'}}));
});
