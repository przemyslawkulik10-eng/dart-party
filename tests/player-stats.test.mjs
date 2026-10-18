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

test('Cyferki stats isolate player throws, exclude unfinished games and export no opponent records',async()=>{
 const {createCyferki,chooseCyferki,throwCyferki,CYFERKI_FIELDS}=await import('../src/cyferki.js');
 const players=[profile,{id:other,name:'PRIVATE OPPONENT'}];
 let m=createCyferki(players,{scoring:'hits',progress:'player'},1000);
 m=chooseCyferki(m,7);m=throwCyferki(m,0);m=throwCyferki(m,1);m=throwCyferki(m,2);
 const data={profile,trainings:[],jdc:[],matches:[],cyferki:[m]};
 let st=playerStats(data);assert.equal(st.cyferkiResults[0].accuracy,67);assert.equal(st.cyferkiResults[0].closures,1);assert.equal(st.cyferkiSummary.active,1);assert.equal(st.cyferkiSummary.darts,0);
 for(const field of CYFERKI_FIELDS.filter(n=>n!==7)){m=chooseCyferki(m,field);if(field===25){m=throwCyferki(m,1);m=throwCyferki(m,2);}else m=throwCyferki(m,3);}
 st=playerStats({...data,cyferki:[m]});assert.equal(st.cyferkiSummary.completed,1);assert.equal(st.cyferkiSummary.active,0);assert.ok(st.cyferkiSummary.darts>0);
 const serialized=JSON.stringify(exportPlayer({...data,cyferki:[m]}));assert.ok(!serialized.includes('PRIVATE OPPONENT'));assert.ok(!serialized.includes(other));assert.ok(!serialized.includes('events'));
 assert.throws(()=>playerStats({...data,profile:{id:'33333333-3333-4333-8333-333333333333',name:'Other'}}));
});

test('team Cricket stats count only own darts but award both partners the team win',async()=>{
 const {configureCricketTeams,nextPlayer,replay}=await import('../src/engine.js');
 const ids=[profile.id,other,'33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444','55555555-5555-4555-8555-555555555555'];
 let m={...configureCricketTeams(createMatch(['A1','A2','B1','B2','C'],'cricket'),[0,0,1,1,2]),profileIds:ids};
 const pass=()=>{while(!replay(m).ready)m=recordDart(m,0);m=nextPlayer(m);};
 for(const n of [20,19,18])m=recordDart(m,n,3);
 pass();pass();pass();
 for(const n of [17,16,15])m=recordDart(m,n,3);
 pass();pass();pass();m=recordDart(m,25,2);m=recordDart(m,25);
 const stats=ids.map(id=>playerStats({profile:{id,name:'player'},trainings:[],jdc:[],matches:[m]}));
 assert.deepEqual(stats.map(s=>s.competitions[0].darts),[5,3,3,3,6]);
 assert.deepEqual(stats.map(s=>s.wins),[1,1,0,0,0]);
 assert.deepEqual(stats.map(s=>s.competitions[0].legWins),[1,1,0,0,0]);
 assert.ok(stats.every(s=>s.competitions[0].teamGame));
});
