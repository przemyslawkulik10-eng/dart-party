import {validDart} from './engine.js';
import {validProfileId} from './profiles.js';
export const JDC_KEY='dart-party-jdc-v1';
export const JDC_PHASES=['Shanghai 10–15','Double 1–20 + BULL','Shanghai 15–20'];
export function jdcTarget(index){
 if(!Number.isInteger(index)||index<0||index>=57)return null;
 if(index<18)return {phase:0,number:10+Math.floor(index/3),dart:index%3+1,total:3};
 if(index<39)return {phase:1,number:index===38?25:index-17,dart:1,total:1};
 return {phase:2,number:15+Math.floor((index-39)/3),dart:(index-39)%3+1,total:3};
}
export function createJdc(profile,coachEnabled=false,now=Date.now()){
 return validateJdc({version:1,kind:'jdc',id:crypto.randomUUID(),profileId:profile.id,name:profile.name,coachEnabled,createdAt:now,endedAt:null,darts:[]});
}
export function validateJdc(s){
 if(!s||s.version!==1||s.kind!=='jdc'||!validProfileId(s.id)||!validProfileId(s.profileId)||typeof s.name!=='string'||!s.name.trim()||s.name.length>24||typeof s.coachEnabled!=='boolean'||!Number.isFinite(s.createdAt)||!Array.isArray(s.darts)||s.darts.length>57||s.darts.some(d=>!validDart(d)||!Number.isFinite(d.at))||(s.darts.length===57?(!Number.isFinite(s.endedAt)||s.endedAt<s.createdAt):s.endedAt!==null))throw new Error('Nie można odczytać próby JDC. Zapis pozostaje zachowany.');
 if(s.draft!==undefined&&(!Array.isArray(s.draft)||s.draft.length>(s.darts.length===57?0:3-s.darts.length%3)||s.draft.some(d=>d!==null&&!validDart(d))))throw new Error('Nieprawidłowe zaznaczenia kolejki.');
 if(s.darts.some(d=>d.unknownMiss!==undefined&&(d.unknownMiss!==true||d.number!==0||d.multiplier!==1)))throw new Error('Nieprawidłowy zapis nietrafionego celu.');
 return s;
}
export function recordJdcDart(s,number,multiplier=1,now=Date.now()){
 validateJdc(s);if(s.endedAt!==null)throw new Error('Próba JDC jest zakończona.');
 if(!validDart({number,multiplier}))throw new Error('Nieprawidłowy rzut.');
 return validateJdc({...s,darts:[...s.darts,{number,multiplier,at:now}],endedAt:s.darts.length===56?now:null});
}
export function undoJdc(s){validateJdc(s);return {...s,darts:s.darts.slice(0,-1),endedAt:null};}
export function jdcGrade(score){return [[1250,'Złoty'],[850,'Czarny'],[700,'Czerwony'],[600,'Niebieski'],[450,'Zielony'],[300,'Żółty'],[150,'Fioletowy'],[0,'Biały']].find(([min])=>score>=min)?.[1];}
export function jdcStats(s){
 validateJdc(s);
 const phases=JDC_PHASES.map(name=>({name,score:0,throws:0,hits:0,shanghais:0}));
 s.darts.forEach((d,i)=>{
  const t=jdcTarget(i),p=phases[t.phase];p.throws++;
  const hit=d.number===t.number&&(t.phase!==1||d.multiplier===2);
  if(hit){p.hits++;p.score+=t.phase===1?(t.number===25?100:50):d.number*d.multiplier;}
  if(t.phase!==1&&t.dart===3){const turn=s.darts.slice(i-2,i+1);if(turn.every(x=>x.number===t.number)&&new Set(turn.map(x=>x.multiplier)).size===3){p.score+=100;p.shanghais++;}}
 });
 const score=phases.reduce((sum,p)=>sum+p.score,0);
 return {score,phases,throws:s.darts.length,complete:s.darts.length===57,grade:jdcGrade(score)};
}
export function loadJdc(){
 const data=JSON.parse(localStorage.getItem(JDC_KEY)||'[]');
 if(!Array.isArray(data))throw new Error('Nie można odczytać historii JDC.');
 const sessions=data.map(validateJdc);if(new Set(sessions.map(s=>s.id)).size!==sessions.length)throw new Error('Powtórzony zapis JDC.');
 return sessions.sort((a,b)=>b.createdAt-a.createdAt);
}
export function saveJdc(s){validateJdc(s);const all=loadJdc();localStorage.setItem(JDC_KEY,JSON.stringify([s,...all.filter(x=>x.id!==s.id)]));return s;}
export function jdcProgress(s,history){
 const previous=history.filter(x=>x.profileId===s.profileId&&x.id!==s.id&&x.endedAt!==null&&x.createdAt<=s.createdAt).sort((a,b)=>b.createdAt-a.createdAt);
 const scores=previous.map(x=>jdcStats(x).score);
 return {count:scores.length,best:scores.length?Math.max(...scores):null,last:scores[0]??null,average:scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):null};
}
