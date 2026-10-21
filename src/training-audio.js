import {trainingSummary} from './training-summary.js';
import {jdcTarget,jdcStats} from './jdc.js';
import {trainingStats,trainingTargetLabel,trainingHit} from './training.js';
export function sectorPrompt(s){return `${s.name}. Cel: ${trainingTargetLabel(s)}. Wpisuj każdą lotkę: trafienie celu albo poza celem.`;}
export function sectorTurn(s){
 const last=s.darts.slice(-3),hits=last.filter(d=>trainingHit({...d,target:d.target??20})).length;
 return `W tej kolejce: ${hits} trafień w cel.${hits===3?' Wszystkie trzy w celu.':''}`;
}
export function sectorResult(s){const st=trainingStats(s);return `Trening zakończony. ${s.name}. ${st.hits} trafień na ${st.throws} lotek.${st.accuracy===null?'':` Celność ${st.accuracy} procent.`} Wynik zapisany.${s.coachEnabled?' '+trainingSummary(s).observation:''}`;}
export function jdcPrompt(s){
 const t=jdcTarget(s.darts.length);if(!t)return '';
 return t.phase===1?`Teraz ${t.number===25?'środek BULL, 50':'podwójne '+t.number}. Jedna lotka.`:`Celuj w ${t.number}. Lotka ${t.dart} z trzech.`;
}
export function jdcAnnouncement(before,after){
 const old=jdcStats(before),st=jdcStats(after),delta=st.score-old.score;
 const shanghai=st.phases.some((p,i)=>p.shanghais>old.phases[i].shanghais);
 const prefix=shanghai?'Szanghaj! Brawo! Bonus sto punktów. ':'';
 const feedback=`${prefix}Za tę lotkę${shanghai?' wraz z bonusem':''}: ${delta} punktów. `;
 return feedback+(st.complete?`Próba JDC zakończona. ${after.name}. Łącznie ${st.score} punktów. Wynik zapisany.`:jdcPrompt(after));
}
