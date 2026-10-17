import {validateJdc,jdcTarget,jdcStats} from './jdc.js';
export const INSIGHT_PERIODS=[30,90,180,365,'all'];
// A conservative product guard, not a statistical guarantee or skill grade.
export const MIN_DOUBLE_ATTEMPTS=20;
export function jdcInsights(sessions,profileId,period=30,now=Date.now()){
 if(!INSIGHT_PERIODS.includes(period))throw new Error('Nieprawidłowy okres analizy.');
 sessions.forEach(validateJdc);
 if(sessions.some(s=>s.profileId!==profileId)||new Set(sessions.map(s=>s.id)).size!==sessions.length)throw new Error('Nieprawidłowa historia gracza.');
 const complete=sessions.filter(s=>s.endedAt!==null&&s.endedAt<=now);
 const start=period==='all'?null:now-period*86400000;
 const selected=complete.filter(s=>start===null||s.endedAt>=start).sort((a,b)=>a.endedAt-b.endedAt);
 const previous=start===null?[]:complete.filter(s=>s.endedAt<start&&s.endedAt>=start-period*86400000);
 const doubles=Array.from({length:21},(_,i)=>({number:i===20?25:i+1,hits:0,attempts:0}));
 const shanghai=Array.from({length:11},(_,i)=>({number:i+10,visits:0,throws:0,hits:0,points:0,bonuses:0}));
 for(const s of selected){
  s.darts.forEach((d,i)=>{
   const t=jdcTarget(i);
   if(t.phase===1){const r=doubles[i-18];r.attempts++;if(d.number===t.number&&d.multiplier===2)r.hits++;}
   else{const r=shanghai[t.number-10];r.throws++;if(d.number===t.number){r.hits++;r.points+=d.number*d.multiplier;}if(t.dart===3){r.visits++;const turn=s.darts.slice(i-2,i+1);if(turn.every(x=>x.number===t.number)&&new Set(turn.map(x=>x.multiplier)).size===3){r.points+=100;r.bonuses++;}}}
  });
 }
 for(const r of doubles)r.accuracy=r.attempts?Math.round(r.hits/r.attempts*1000)/10:null;
 for(const r of shanghai){r.average=r.visits?Math.round(r.points/r.visits*10)/10:null;r.maximum=6*r.number+100;}
 const scores=selected.map(s=>jdcStats(s).score),oldScores=previous.map(s=>jdcStats(s).score);
 const average=values=>values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):null;
 const currentAverage=average(scores),previousAverage=average(oldScores);
 const eligible=doubles.filter(r=>r.attempts>=MIN_DOUBLE_ATTEMPTS);
 const lowest=eligible.length?Math.min(...eligible.map(r=>r.hits/r.attempts)):null;
 const candidates=eligible.filter(r=>r.hits/r.attempts===lowest).map(r=>r.number);
 const focus=candidates.length&&candidates.length<doubles.length?candidates:[];
 const reason=!selected.length?'Brak pełnych prób JDC w tym okresie. Jedna nowa próba da punkt odniesienia.':!eligible.length?`Na każde podwójne pole przypada ${selected.length} prób. To za mało, aby panel wskazał pole do dodatkowej obserwacji. Możesz spokojnie kontynuować JDC.`:focus.length?`Te pola mają najniższy odsetek trafień w wybranym okresie (${selected.length} prób na pole). To kierunek dalszej obserwacji, nie diagnoza trwałej słabości.`:'Wszystkie podwójne pola mają taki sam wynik. Dane nie wyróżniają jednego celu do dodatkowej obserwacji.';
 return {period,start,end:now,sessions:selected.length,previousSessions:previous.length,average:currentAverage,previousAverage,delta:currentAverage!==null&&previousAverage!==null?currentAverage-previousAverage:null,lifetimeBest:complete.length?Math.max(...complete.map(s=>jdcStats(s).score)):null,doubles,shanghai,focus,reason,minimumAttempts:MIN_DOUBLE_ATTEMPTS};
}
