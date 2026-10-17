import {test} from 'node:test';
import assert from 'node:assert/strict';
import {development,developmentPanel} from '../src/development.js';
import {createTraining,recordTrainingDart,finishTraining} from '../src/training.js';
import {createJdc,recordJdcDart} from '../src/jdc.js';
const profile={id:'11111111-1111-4111-8111-111111111111',name:'A'};
const empty=()=>({profile,trainings:[],jdc:[],matches:[]});
function session(hits,total,at=100){let s={...createTraining('A',5,at),profileId:profile.id};for(let i=0;i<total;i++)s=recordTrainingDart(s,i<hits?20:1,1,at+i+1);return finishTraining(s,at+total+1);}
function jdc(){let s=createJdc(profile,false,100);for(let i=0;i<57;i++)s=recordJdcDart(s,0,1,101+i);return s;}
test('no fabricated levels or badges for empty history; plan is optional',()=>{const d=development(empty(),1000);assert.equal(d.stage,0);assert.ok(d.badges.every(b=>!b.earned));assert.equal(d.sessions.length,4);assert.ok(!developmentPanel(empty(),false).includes('data-development-exercise'));});
test('precision milestone requires three full qualifying samples, not rounded percentages',()=>{const data=empty();data.jdc=[jdc()];data.trainings=[session(15,30),session(15,30),session(15,31)];assert.equal(development(data,1000).stage,1);data.trainings[2]=session(15,30);assert.equal(development(data,1000).stage,2);assert.equal(development(data,1000+365*86400000).stage,2);});
test('empty, unfinished and future sessions do not earn precision awards',()=>{const data=empty();data.trainings=[session(0,0),{...session(30,30),endedAt:null},session(30,30,2000)];assert.equal(development(data,1000).criteria[1].value,0);});
test('reject duplicate sessions and histories belonging to other profiles',()=>{const data=empty(),s=session(30,30);data.trainings=[s,s];assert.throws(()=>development(data,1000));data.trainings=[{...s,profileId:'22222222-2222-4222-8222-222222222222'}];assert.throws(()=>development(data,1000));});
