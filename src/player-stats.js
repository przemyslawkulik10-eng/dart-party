import {loadProfiles} from './profiles.js';
import {loadTrainings,trainingStats} from './training.js';
import {loadJdc,jdcStats} from './jdc.js';
import {loadMatches} from './storage.js';
import {replay} from './engine.js';
export function playerData(profileId){
 const profile=loadProfiles().find(p=>p.id===profileId);if(!profile)throw new Error('Nie znaleziono profilu gracza.');
 return {profile,trainings:loadTrainings().filter(s=>s.profileId===profileId),jdc:loadJdc().filter(s=>s.profileId===profileId),matches:loadMatches().filter(m=>m.profileIds?.includes(profileId))};
}
export function playerStats(data){
 const {profile,trainings,jdc,matches}=data;
 if(trainings.some(s=>s.profileId!==profile.id)||jdc.some(s=>s.profileId!==profile.id)||matches.some(m=>!m.profileIds?.includes(profile.id)))throw new Error('Dane należą do innego profilu.');
 const completedTraining=trainings.filter(s=>s.endedAt!==null),completedJdc=jdc.filter(s=>s.endedAt!==null).sort((a,b)=>a.createdAt-b.createdAt);
 const sector=completedTraining.reduce((a,s)=>{const st=trainingStats(s);return {throws:a.throws+st.throws,hits:a.hits+st.hits};},{throws:0,hits:0});
 sector.accuracy=sector.throws?Math.round(100*sector.hits/sector.throws):null;
 const jdcResults=completedJdc.map(s=>({id:s.id,date:s.createdAt,...jdcStats(s)}));
 const targets=new Map(),actualHits=new Map();let trainingDarts=0;
 function addActual(d){trainingDarts++;if(d.unknownMiss)return;const key=`${d.number}:${d.multiplier}`;actualHits.set(key,(actualHits.get(key)||0)+1);}
 for(const s of trainings)for(const d of s.darts)addActual(d);
 for(const s of jdc)for(const d of s.darts)addActual(d);
 // Per-double attempts in full JDC tests; never infer the intended target in matches.
 for(const s of completedJdc)for(let i=18;i<39;i++){const number=i===38?25:i-17,d=s.darts[i],row=targets.get(number)||{number,attempts:0,hits:0};row.attempts++;if(d.number===number&&d.multiplier===2)row.hits++;targets.set(number,row);}
 const doubles=[...targets.values()].map(r=>({...r,accuracy:Math.round(r.hits/r.attempts*100)}));
 const competitions=matches.map(m=>{const state=replay(m),index=m.profileIds.indexOf(profile.id);let current=0,starter=0,darts=0;for(const e of m.events){if(e.type==='next')current=(current+1)%m.names.length;else if(e.type==='nextLeg'){starter=(starter+1)%m.names.length;current=starter;}else if(e.type==='dart'&&current===index)darts++;}return {id:m.id,date:m.updatedAt,mode:m.mode,complete:state.winner!==null,won:state.winner===index,darts,legWins:state.legWins[index]};});
 const completedMatches=competitions.filter(m=>m.complete);
 const scored=jdcResults.map(s=>s.score);
 return {sector,jdcResults,jdcBest:scored.length?Math.max(...scored):null,jdcAverage:scored.length?Math.round(scored.reduce((a,b)=>a+b,0)/scored.length):null,jdcDelta:scored.length>1?scored.at(-1)-scored.at(-2):null,doubles,actualHits:[...actualHits].map(([key,count])=>({key,count})),trainingDarts,competitions,completedMatches:completedMatches.length,wins:completedMatches.filter(m=>m.won).length,trainingSessions:completedTraining.length,activeSessions:trainings.filter(s=>s.endedAt===null).length+jdc.filter(s=>s.endedAt===null).length};
}
// No auth tokens, keys or opponents' raw records in the player's portable export.
export function exportPlayer(data){
 const stats=playerStats(data);
 return {version:1,exportedAt:new Date().toISOString(),profile:data.profile,trainings:data.trainings,jdc:data.jdc,matchSummaries:stats.competitions,statistics:stats};
}
