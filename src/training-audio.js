import {jdcTarget,jdcStats} from './jdc.js';
import {trainingStats} from './training.js';
export function sectorPrompt(s){return `${s.name}. Celuj w sektor 20. Pojedyncze, podwójne i potrójne pole zaliczamy jako trafienie celu.`;}
export function sectorTurn(s){
 const last=s.darts.slice(-3),hits=last.filter(d=>d.number===20).length;
 return `Ostatnie trzy lotki: ${hits} trafień w sektor 20.${hits===3?' Brawo! Wszystkie trzy w celu.':''} Dalej celuj w sektor 20.`;
}
export function sectorResult(s){const st=trainingStats(s);return `Trening zakończony. ${s.name}. ${st.hits} trafień na ${st.throws} lotek.${st.accuracy===null?'':` Celność ${st.accuracy} procent.`} Wynik zapisany.`;}
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
