import { validDart } from './engine.js';
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
  return {...s,darts:[...s.darts,{number,multiplier,target:s.target,at:now}]};
}
export function trainingStats(s){
  const hits=s.darts.filter(d=>d.number===d.target).length;
  return {throws:s.darts.length,hits,accuracy:s.darts.length?Math.round(hits/s.darts.length*100):null};
}
export function validateTraining(s){
  if(s?.coachEnabled!==undefined && typeof s.coachEnabled!=='boolean')throw new Error('Nieprawidłowe ustawienie trenera.');
  if(!s || s.version!==1 || typeof s.id!=='string' || typeof s.name!=='string' || !s.name.trim() || s.name.length>24 || s.target!==20 || ![300000,600000,900000].includes(s.durationMs) || !Number.isFinite(s.remainingMs) || s.remainingMs<0 || s.remainingMs>s.durationMs || !Number.isFinite(s.createdAt) || !(s.runningSince===null||Number.isFinite(s.runningSince)) || !(s.endedAt===null||Number.isFinite(s.endedAt)) || !Array.isArray(s.darts) || s.darts.some(d=>!validDart(d)||d.target!==20||!Number.isFinite(d.at)))throw new Error('Nie można odczytać treningów.');
  return s;
}
export function loadTrainings(){
  const data=JSON.parse(localStorage.getItem(TRAINING_KEY)||'[]');
  if(!Array.isArray(data))throw new Error('Nie można odczytać treningów.');
  return data.map(validateTraining).sort((a,b)=>b.createdAt-a.createdAt);
}
export function saveTraining(s){
  validateTraining(s);
  const all=loadTrainings();
  localStorage.setItem(TRAINING_KEY,JSON.stringify([s,...all.filter(x=>x.id!==s.id)]));
  return s;
}

export function trainingAdvice(s){
  if(!s.coachEnabled)return '';
  if(s.darts.length<3)return 'Celuj w cały sektor 20. Na początek skup się na powtarzaniu tego samego celu, nie na potrójnych.';
  const last=s.darts.slice(-3),hits=last.filter(d=>d.number===d.target).length;
  return `Ostatnie 3 lotki: ${hits}/3 w sektor 20. ${hits===3?'Wszystkie w celu. W kolejnej serii spróbuj powtórzyć ten wynik.':'W kolejnej serii pozostań przy sektorze 20. Nie musisz przyspieszać.'}`;
}
