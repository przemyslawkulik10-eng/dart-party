import {appStorage} from './account-storage.js';
import {validProfileId} from './profiles.js';
import { validDart } from './engine.js';
export const TRAINING_TARGETS=[20,19,18,17,16,15,25];
export const trainingTargetLabel=s=>s.target===25?(s.targetMultiplier===2?'BULL 50':s.targetMultiplier===1?'25 — zewnętrzny pierścień':'BULL 25 / 50'):'sektor '+s.target;
export const trainingHit=d=>d.number===d.target&&(!d.targetMultiplier||d.multiplier===d.targetMultiplier);
export const TRAINING_KEY='dart-party-training-v1';
export function createTraining(name,minutes=15,now=Date.now(),coachEnabled=false){
  name=String(name).trim();
  if(!name || name.length>24)throw new Error('Podaj imię (do 24 znaków).');
  if(![5,10,15].includes(minutes))throw new Error('Wybierz czas treningu.');
  return {version:1,id:crypto.randomUUID(),name,coachEnabled:!!coachEnabled,target:20,durationMs:minutes*60000,remainingMs:minutes*60000,runningSince:now,createdAt:now,endedAt:null,darts:[]};
}
export function remainingTime(s,now=Date.now()){
  return Math.max(0,s.remainingMs-(s.runningSince===null?0:Math.max(0,now-s.runningSince)));
}
export function pauseTraining(s,now=Date.now()){
  return {...s,remainingMs:remainingTime(s,now),runningSince:null};
}
export function resumeTraining(s,now=Date.now()){
  if(s.endedAt!==null || remainingTime(s,now)===0)throw new Error('Trening zakończony.');
  return s.runningSince===null?{...s,runningSince:now}:s;
}
export function finishTraining(s,now=Date.now()){
  return {...pauseTraining(s,now),endedAt:s.endedAt??now};
}
export function recordTrainingDart(s,number,multiplier=1,now=Date.now()){
  if(s.endedAt!==null || s.runningSince===null || remainingTime(s,now)===0)throw new Error('Wznów trening przed wpisaniem rzutu.');
  if(!validDart({number,multiplier}))throw new Error('Nieprawidłowy rzut.');
  return {...s,darts:[...s.darts,{number,multiplier,target:s.target,...(s.targetMultiplier?{targetMultiplier:s.targetMultiplier}:{}),at:now}]};
}
export function trainingStats(s){
  const hits=s.darts.filter(d=>trainingHit(d)).length;
  return {throws:s.darts.length,hits,accuracy:s.darts.length?Math.round(hits/s.darts.length*100):null};
}
export function validateTraining(s){
  if(s?.profileId!==undefined&&!validProfileId(s.profileId))throw new Error('Nieprawidłowy profil treningu.');
  if(s?.coachEnabled!==undefined && typeof s.coachEnabled!=='boolean')throw new Error('Nieprawidłowe ustawienie trenera.');
  if(!s || s.version!==1 || typeof s.id!=='string' || typeof s.name!=='string' || !s.name.trim() || s.name.length>24 || ![20,19,18,17,16,15,25].includes(s.target) || ![300000,600000,900000].includes(s.durationMs) || !Number.isFinite(s.remainingMs) || s.remainingMs<0 || s.remainingMs>s.durationMs || !Number.isFinite(s.createdAt) || !(s.runningSince===null||Number.isFinite(s.runningSince)) || !(s.endedAt===null||Number.isFinite(s.endedAt)) || !Array.isArray(s.darts) || s.darts.some(d=>!validDart(d)||d.target!==s.target||!Number.isFinite(d.at)))throw new Error('Nie można odczytać treningów.');
  if(s.targetMultiplier!==undefined&&!(s.target===25&&[1,2].includes(s.targetMultiplier)))throw Error('Nieprawidłowy cel BULL.');
  if(s.darts.some(d=>d.targetMultiplier!==s.targetMultiplier))throw Error('Niespójny cel lotki.');
  return s;
}
export function loadTrainings(){
  const data=JSON.parse(appStorage.getItem(TRAINING_KEY)||'[]');
  if(!Array.isArray(data))throw new Error('Nie można odczytać treningów.');
  return data.map(validateTraining).sort((a,b)=>b.createdAt-a.createdAt);
}
export function saveTraining(s){
  validateTraining(s);
  const all=loadTrainings();
  appStorage.setItem(TRAINING_KEY,JSON.stringify([s,...all.filter(x=>x.id!==s.id)]));
  if(s.targetMultiplier!==undefined&&!(s.target===25&&[1,2].includes(s.targetMultiplier)))throw Error('Nieprawidłowy cel BULL.');
  if(s.darts.some(d=>d.targetMultiplier!==s.targetMultiplier))throw Error('Niespójny cel lotki.');
  return s;
}

export function trainingAdvice(s){
 if(!s.coachEnabled)return '';
 if(!s.darts.length)return `Cel: ${trainingTargetLabel(s)}. Każdą lotkę wpisz osobno. Nie musisz przyspieszać.`;
 const used=(s.darts.length-1)%3+1,last=s.darts.slice(-used),hits=last.filter(trainingHit).length;
 return `W tej kolejce: ${hits} trafień z ${last.length} wpisanych lotek w cel. ${used===3?'Kolejna seria, ten sam cel.':'Rzucaj w swoim tempie.'}`;
}
