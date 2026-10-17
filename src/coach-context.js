import {jdcInsights} from './jdc-insights.js';
import {validateJdc,jdcStats} from './jdc.js';
import {validateTraining,trainingStats} from './training.js';
import {validateMatch,replay} from './engine.js';
import {validProfileId} from './profiles.js';
// Numbers are computed here. The language model interprets, never calculates scores.
export function buildCoachContext(payload){
 if(!payload || !validProfileId(payload.profileId)||!Array.isArray(payload.trainings)||payload.trainings.length>30||!Array.isArray(payload.matches)||payload.matches.length>20)throw new Error('Nieprawidłowe dane trenera.');
 const jdc=payload.jdc??[];
 if(!Array.isArray(jdc)||jdc.length>30)throw new Error('Nieprawidłowa historia JDC.');
 jdc.forEach(validateJdc);
 if(jdc.some(s=>s.profileId!==payload.profileId||s.endedAt===null)||new Set(jdc.map(s=>s.id)).size!==jdc.length)throw new Error('Analiza JDC wymaga pełnych prób wybranego gracza.');
 const jdcSessions=[...jdc].sort((a,b)=>a.createdAt-b.createdAt).map(s=>{const st=jdcStats(s);return {date:new Date(s.createdAt).toISOString().slice(0,10),score:st.score,grade:st.grade,phases:st.phases};});
 const practice=payload.trainings.map(validateTraining);
 const matches=payload.matches.map(validateMatch);
 if(practice.some(s=>s.profileId!==payload.profileId)||matches.some(m=>!m.profileIds?.includes(payload.profileId)))throw new Error('Dane muszą należeć do wybranego gracza.');
 if(new Set(practice.map(s=>s.id)).size!==practice.length||new Set(matches.map(m=>m.id)).size!==matches.length)throw new Error('Powtórzone sesje.');
 let throws=0,hits=0;
 const sessions=practice.sort((a,b)=>a.createdAt-b.createdAt).map(s=>{const st=trainingStats(s);throws+=st.throws;hits+=st.hits;return {date:new Date(s.createdAt).toISOString().slice(0,10),target:20,throws:st.throws,hits:st.hits,accuracy:st.accuracy,completed:s.endedAt!==null};});
 const competition=matches.map(m=>{
  const state=replay(m);if(state.winner===null)throw new Error('Analiza zawodów jest dostępna po zakończeniu meczu.');
  const idx=m.profileIds.indexOf(payload.profileId);let current=0,starter=0;const darts=[];
  for(const e of m.events){if(e.type==='next')current=(current+1)%m.names.length;else if(e.type==='nextLeg'){starter=(starter+1)%m.names.length;current=starter;}else if(e.type==='dart'&&current===idx)darts.push(e);}
  return {date:m.updatedAt.slice(0,10),mode:m.mode,scoring:m.cricketScoring||'standard',doubleOut:m.doubleOut,throws:darts.length,triples:darts.filter(d=>d.multiplier===3).length,recordedZeros:darts.filter(d=>d.number===0).length,won:state.winner===idx,targetKnown:false};
 });
 return {scope:'dart-training',jdc:{sessions:jdcSessions,completed:jdcSessions.length,last30Days:jdcInsights(jdc,payload.profileId,30)},training:{sessions,throws,hits,accuracy:throws?Math.round(hits/throws*100):null},competition,limitations:['Brak pomiaru techniki ciała.','Zamiar rzutu w meczu jest nieznany.','Zera w Cricket mogą oznaczać niepunktujące pola.','Historia ograniczona do 30 treningów sektora 20, 30 prób JDC i 20 zakończonych meczów.','Wynik próby JDC nie jest oficjalnym stopniem akademii.','JDC ma 57 lotek; nie przerywaj próby limitem czasu i nie porównuj surowych punktów różnych etapów jako celności.'],availableExercises:[{id:'sector-20',target:20,description:'Celowanie w cały sektor 20; maksymalnie 15 minut.'},{id:'jdc',description:'Pełna próba JDC: 57 lotek, z możliwością przerwy i wznowienia.'}]};
}
