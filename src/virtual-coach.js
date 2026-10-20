// Versioned, deterministic training. All measurements come from recorded darts.
import {validProfileId} from './profiles.js';
import {validDart} from './engine.js';
export const COACH_KINDS=['scoring','singles','doubles','checkout'];
export const COACH_LABELS={scoring:'Punktowanie',singles:'Pojedyncze pola',doubles:'Podwójne',checkout:'Zejścia Double Out'};
export const COACH_GOALS={balanced:'Równa gra',scoring:'Więcej punktów',finishing:'Pewniejsze kończenie'};
const nowISO=()=>new Date().toISOString();
const copy=x=>JSON.parse(JSON.stringify(x));
export const emptyCoach=()=>({version:1,revision:0,settings:{goal:'balanced',days:3},plans:[]});
function validTime(t){return typeof t==='string'&&Number.isFinite(Date.parse(t));}
export function taskState(task){
 if(!task||!COACH_KINDS.includes(task.kind)||!Array.isArray(task.targets)||task.targets.length!==10||task.targets.some(n=>!Number.isInteger(n)||(task.kind==='checkout'?![24,32,40,48,60].includes(n):n<1||n>20))||!Array.isArray(task.events)||task.events.length>30)throw Error('Nieprawidłowe ćwiczenie trenera.');
 let visit=0,turn=[],remaining=task.targets[0],hits=0,points=0,checkouts=0,attempts=0;const rounds=[],observations=[];
 for(const dart of task.events){
  if(visit>=10||!validDart(dart)||!validTime(dart.at))throw Error('Nieprawidłowy zapis lotek trenera.');
  const target=task.targets[visit],value=dart.number*dart.multiplier;
  turn.push(dart);
  if(task.kind==='checkout'){
   const rest=remaining-value,bust=rest<0||rest===1||(rest===0&&dart.multiplier!==2),won=rest===0&&!bust;
   if(won)checkouts++;
   if(!bust)remaining=rest;
   if(bust||won||turn.length===3){rounds.push({target,darts:[...turn],bust,won});visit++;turn=[];remaining=task.targets[visit];}
  }else{
   const hit=dart.number===target&&dart.multiplier===(task.kind==='doubles'?2:task.kind==='singles'?1:3);
   hits+=Number(hit);points+=value;attempts++;
   observations.push({target,hit});
   if(turn.length===3){rounds.push({target,darts:[...turn]});visit++;turn=[];remaining=task.targets[visit];}
  }
 }
 const complete=visit===10;
 const value=task.kind==='scoring'?(task.events.length?Math.round(points/task.events.length*30)/10:null):task.kind==='checkout'?checkouts:hits;
 return {visit,turn,remaining,target:task.targets[Math.min(visit,9)],complete,hits,points,checkouts,attempts,darts:task.events.length,rounds,observations,value,achieved:complete&&value>=task.goal,completedAt:complete?task.events.at(-1).at:null};
}
export function validateCoach(coach){
 if(!coach||coach.version!==1||!Number.isInteger(coach.revision)||coach.revision<0||!coach.settings||!Object.hasOwn(COACH_GOALS,coach.settings.goal)||!Number.isInteger(coach.settings.days)||coach.settings.days<1||coach.settings.days>7||!Array.isArray(coach.plans))throw Error('Nie można odczytać planów trenera. Zachowano zapis.');
 const ids=new Set();let active=0;
 for(const plan of coach.plans){
  if(!validProfileId(plan.id)||ids.has(plan.id)||!validTime(plan.createdAt)||![10,20,30].includes(plan.minutes)||!Array.isArray(plan.tasks)||plan.tasks.length!==plan.minutes/10)throw Error('Nieprawidłowy plan trenera.');
  ids.add(plan.id);let complete=true;
  for(const task of plan.tasks){
   if(!validProfileId(task.id)||ids.has(task.id)||typeof task.paused!=='boolean'||typeof task.reason!=='string'||!Number.isFinite(task.goal)||task.goal<0||task.goal>(task.kind==='scoring'?180:task.kind==='checkout'?10:30))throw Error('Nieprawidłowe zadanie trenera.');
   ids.add(task.id);complete=taskState(task).complete&&complete;
  }
  if(!complete){active++;if(plan!==coach.plans.at(-1))throw Error('Aktywny plan musi być ostatnim planem.');}
 }
 if(active>1)throw Error('Zapis zawiera więcej niż jeden aktywny plan.');
 return coach;
}
export function coachResults(coach){
 validateCoach(coach);
 return coach.plans.flatMap(plan=>plan.tasks.map(task=>({...task,state:taskState(task),planId:plan.id}))).filter(t=>t.state.complete).sort((a,b)=>Date.parse(b.state.completedAt)-Date.parse(a.state.completedAt));
}
export function activeCoachPlan(coach){return coach.plans.find(p=>p.tasks.some(t=>!taskState(t).complete))||null;}
const median=values=>{const v=[...values].sort((a,b)=>a-b),i=Math.floor(v.length/2);return v.length%2?v[i]:(v[i-1]+v[i])/2;};
function recentResults(coach,at){return coachResults(coach).filter(t=>Date.parse(t.state.completedAt)<=Date.parse(at)&&Date.parse(t.state.completedAt)>=Date.parse(at)-30*86400000);}
export function createCoachPlan(coach,minutes=20,at=nowISO()){
 validateCoach(coach);if(![10,20,30].includes(minutes)||!validTime(at))throw Error('Wybierz 10, 20 lub 30 minut.');
 if(activeCoachPlan(coach))throw Error('Dokończ rozpoczęty plan. Możesz wrócić do niego w dowolnym dniu.');
 const recent=recentResults(coach,at),priority=coach.settings.goal==='finishing'?['doubles','checkout','singles','scoring']:coach.settings.goal==='scoring'?['scoring','singles','doubles','checkout']:COACH_KINDS;
 // Cover missing skills first; then balance repetitions, using goal performance as a tie-break.
 const ranked=priority.map((kind,i)=>{const rows=recent.filter(t=>t.kind===kind);return {kind,i,rows,ratio:rows.length>=3?rows.slice(0,3).reduce((n,t)=>n+t.state.value/Math.max(1,t.goal),0)/3:1};}).sort((a,b)=>a.rows.length-b.rows.length||a.ratio-b.ratio||a.i-b.i);
 const tasks=ranked.slice(0,minutes/10).map(({kind,rows})=>{
  const enough=rows.length>=3;
  const baseline=enough?median(rows.slice(0,5).map(t=>t.state.value)):null;
  const goal=enough?Math.min(kind==='scoring'?180:kind==='checkout'?10:30,Math.max(1,kind==='scoring'?Math.round(baseline*1.05):Math.ceil(baseline+1))):({scoring:30,singles:12,doubles:3,checkout:2}[kind]);
  let targets=kind==='scoring'?Array(10).fill(20):kind==='singles'?[20,19,18,17,16,15,10,5,12,14]:kind==='doubles'?[16,8,20,10,12,6,4,2,18,9]:[32,40,24,48,60,32,40,24,48,60];
  let focus='';
  if(kind==='doubles'&&enough){
   const stats=new Map();for(const row of rows)for(const o of row.state.observations){const s=stats.get(o.target)||{n:o.target,hits:0,attempts:0};s.hits+=Number(o.hit);s.attempts++;stats.set(o.target,s);}
   const eligible=[...stats.values()].filter(s=>s.attempts>=20).sort((a,b)=>a.hits/a.attempts-b.hits/b.attempts);
   if(eligible.length>=2&&eligible[0].hits/eligible[0].attempts<eligible.at(-1).hits/eligible.at(-1).attempts){const weak=eligible[0];targets=[weak.n,...targets.slice(0,4),weak.n,...targets.slice(4,8)];focus=` D${weak.n}: ${weak.hits}/${weak.attempts} trafień — dodatkowa obserwacja. Cel jest orientacyjny, bo zestaw pól się zmienia.`;}
  }
  const reason=(enough?`Cel oparty na medianie ${Math.min(rows.length,5)} ostatnich ukończonych sesji tego ćwiczenia z 30 dni (${baseline}).`:`Poznajemy Twoją grę: ${rows.length}/3 sesje tego ćwiczenia z 30 dni. Cel startowy jest orientacyjny.`)+focus;
  return {id:crypto.randomUUID(),kind,targets,goal,reason,events:[],paused:true};
 });
 const next=copy(coach);next.plans.push({id:crypto.randomUUID(),createdAt:at,minutes,tasks});return validateCoach(next);
}
export function changeCoachTask(coach,taskId,action,dart=null,at=nowISO()){
 validateCoach(coach);const next=copy(coach),task=next.plans.flatMap(p=>p.tasks).find(t=>t.id===taskId);
 if(!task)throw Error('Nie znaleziono zadania.');
 const latest=next.plans.at(-1);if(!latest.tasks.includes(task))throw Error('Starszy plan jest zamknięty.');
 const state=taskState(task);
 if(action==='dart'){
  if(task.paused||state.complete)throw Error('Wznów zadanie przed wpisaniem lotki.');
  if(!validDart(dart)||!validTime(at))throw Error('Nieprawidłowa lotka.');
  task.events.push({number:dart.number,multiplier:dart.multiplier,at});if(taskState(task).complete)task.paused=true;
 }else if(action==='undo'){
  if(!task.events.length)throw Error('Brak lotki do cofnięcia.');task.events.pop();task.paused=true;
 }else if(action==='resume'){
  if(state.complete)throw Error('Ćwiczenie ukończone.');
  for(const t of next.plans.flatMap(p=>p.tasks))t.paused=true;
  task.paused=false;
 }else if(action==='pause')task.paused=true;
 else throw Error('Nieznana czynność.');
 return validateCoach(next);
}
export function coachSummary(coach,at=nowISO()){
 const all=coachResults(coach),recent=recentResults(coach,at);
 return COACH_KINDS.map(kind=>{const rows=recent.filter(t=>t.kind===kind),latest=rows.slice(0,3),previous=rows.slice(3,6);const mean=r=>r.length?Math.round(r.reduce((n,t)=>n+t.state.value,0)/r.length*10)/10:null;
 return {kind,sessions:rows.length,total:all.filter(t=>t.kind===kind).length,average:mean(latest),previous:previous.length===3?mean(previous):null,sufficient:latest.length===3,best:all.some(t=>t.kind===kind)?Math.max(...all.filter(t=>t.kind===kind).map(t=>t.state.value)):null};});
}
