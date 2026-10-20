import {playerAchievements} from './player-achievements.js';
import {loadMnoznik} from './mnoznik.js';
import {loadMnoznikSparing} from './mnoznik-sparing.js';
import {multiplierResults} from './player-dashboard.js';
import {loadCyferki,cyferkiState} from './cyferki.js';
import {loadProfiles} from './profiles.js';
import {loadTrainings,trainingStats} from './training.js';
import {loadJdc,jdcStats} from './jdc.js';
import {loadMatches} from './storage.js';
import {replay,cricketTeamOrder} from './engine.js';
export function playerData(profileId){
 const profile=loadProfiles().find(p=>p.id===profileId);if(!profile)throw new Error('Nie znaleziono profilu gracza.');
 return {profile,mnoznik:loadMnoznik().filter(m=>m.profileId===profileId),mnoznikSparing:loadMnoznikSparing().filter(m=>m.players.some(p=>p.id===profileId)),trainings:loadTrainings().filter(s=>s.profileId===profileId),jdc:loadJdc().filter(s=>s.profileId===profileId),matches:loadMatches().filter(m=>m.profileIds?.includes(profileId)),cyferki:loadCyferki().filter(m=>m.players.some(p=>p.id===profileId))};
}
export function playerStats(data){
 const {profile,trainings,jdc,matches,cyferki=[]}=data;
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
 const competitions=matches.map(m=>{
  const state=replay(m),index=m.profileIds.indexOf(profile.id),order=cricketTeamOrder(m);
  let position=0,starter=0,darts=0;
  for(const e of m.events){
   if(e.type==='next')position=(position+1)%order.length;
   else if(e.type==='nextLeg'){starter=(starter+1)%order.length;position=starter;}
   else if(e.type==='dart'&&order[position]===index)darts++;
  }
  const won=state.winner!==null && (m.teams ? m.teams[state.winner]===m.teams[index] : state.winner===index);
  return {id:m.id,date:m.updatedAt,mode:m.mode,complete:state.winner!==null,won,darts,legWins:state.legWins[index],...(m.teams?{teamGame:true}: {})};
 });
 const completedMatches=competitions.filter(m=>m.complete);
 const cyferkiResults=cyferki.map(m=>{const state=cyferkiState(m),index=m.players.findIndex(p=>p.id===profile.id);if(index<0)throw new Error('Dane należą do innego profilu.');const darts=state.history.filter(d=>d.player===index),hits=darts.filter(d=>d.hits>0).length;return {id:m.id,date:m.events.at(-1)?.at??m.createdAt,rules:{...m.rules},complete:state.finished,won:state.finished&&state.winners.length===1&&state.winners[0]===index,draw:state.finished&&state.winners.length>1&&state.winners.includes(index),score:state.scores[index],closures:state.closures[index],darts:darts.length,hits,accuracy:darts.length?Math.round(100*hits/darts.length):null};});
 const finishedCyferki=cyferkiResults.filter(m=>m.complete);
 const cyferkiSummary={completed:finishedCyferki.length,active:cyferkiResults.length-finishedCyferki.length,wins:finishedCyferki.filter(m=>m.won).length,draws:finishedCyferki.filter(m=>m.draw).length,darts:finishedCyferki.reduce((n,m)=>n+m.darts,0),hits:finishedCyferki.reduce((n,m)=>n+m.hits,0),closures:finishedCyferki.reduce((n,m)=>n+m.closures,0)};
 cyferkiSummary.accuracy=cyferkiSummary.darts?Math.round(100*cyferkiSummary.hits/cyferkiSummary.darts):null;
 const scored=jdcResults.map(s=>s.score);
 return {achievements:playerAchievements(data),mnoznikResults:multiplierResults(data),cyferkiResults,cyferkiSummary,sector,jdcResults,jdcBest:scored.length?Math.max(...scored):null,jdcAverage:scored.length?Math.round(scored.reduce((a,b)=>a+b,0)/scored.length):null,jdcDelta:scored.length>1?scored.at(-1)-scored.at(-2):null,doubles,actualHits:[...actualHits].map(([key,count])=>({key,count})),trainingDarts,competitions,completedMatches:completedMatches.length,wins:completedMatches.filter(m=>m.won).length,trainingSessions:completedTraining.length,activeSessions:trainings.filter(s=>s.endedAt===null).length+jdc.filter(s=>s.endedAt===null).length};
}
// No auth tokens, keys or opponents' raw records in the player's portable export.
export function exportPlayer(data){
 const stats=playerStats(data);
 return {version:1,exportedAt:new Date().toISOString(),profile:data.profile,trainings:data.trainings,jdc:data.jdc,matchSummaries:stats.competitions,statistics:stats};
}
