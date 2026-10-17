import {test} from 'node:test';
import assert from 'node:assert/strict';
import {returnPlan,loadReturnChoice,saveReturnChoice,RETURN_CHOICE_KEY} from '../src/return-plan.js';
import {createTraining,recordTrainingDart,finishTraining} from '../src/training.js';
import {createJdc,recordJdcDart} from '../src/jdc.js';
const profile={id:'11111111-1111-4111-8111-111111111111',name:'Przemek'};
const now=Date.UTC(2026,9,17),day=86400000;
const data=()=>({profile,trainings:[],jdc:[],matches:[]});
function training(at){let s={...createTraining('Przemek',5,at),profileId:profile.id};s=recordTrainingDart(s,20,1,at+1);return finishTraining(s,at+2);}
function jdc(at){let s=createJdc(profile,false,at);for(let i=0;i<57;i++)s=recordJdcDart(s,0,1,at+1+i);return s;}
test('no history is unknown, not presumed long break; creating empty session is not activity',()=>{
 let d=data();assert.equal(returnPlan(d,now).daysAway,null);assert.equal(returnPlan(d,now).returning,false);assert.equal(returnPlan(d,now).primary,'jdc');
 d.jdc.push(createJdc(profile,false,now));assert.equal(returnPlan(d,now).lastAt,null);assert.equal(returnPlan(d,now).activeJdc,true);
});
test('real old activity shows return while 30-day stats exclude old results and future timestamps',()=>{
 const d=data();d.trainings=[training(now-100*day),training(now+day)];d.jdc=[jdc(now-60*day)];const p=returnPlan(d,now);
 assert.equal(p.returning,true);assert.equal(p.recentTraining,0);assert.equal(p.recentJdc,0);assert.equal(p.recentJdcAverage,null);assert.equal(p.primary,'jdc');
});
test('recent JDC proposes short practice; unfinished JDC gets resume priority',()=>{
 const d=data();d.jdc=[jdc(now-day)];let p=returnPlan(d,now);assert.equal(p.recentJdc,1);assert.equal(p.recentJdcAverage,0);assert.equal(p.primary,'sector-20');assert.equal(p.returning,false);
 d.jdc.push(createJdc(profile,false,now));p=returnPlan(d,now);assert.equal(p.primary,'jdc');assert.equal(p.activeJdc,true);
});
test('plan preference is opt-in per profile; corrupted settings preserved',()=>{
 const db=new Map();globalThis.localStorage={getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,v)};
 assert.equal(loadReturnChoice(profile.id),false);saveReturnChoice(profile.id,true);assert.equal(loadReturnChoice(profile.id),true);assert.equal(loadReturnChoice('other'),false);saveReturnChoice(profile.id,false);assert.equal(loadReturnChoice(profile.id),false);
 db.set(RETURN_CHOICE_KEY,'broken');assert.throws(()=>saveReturnChoice(profile.id,true));assert.equal(db.get(RETURN_CHOICE_KEY),'broken');
});
