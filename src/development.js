import {playerStats} from './player-stats.js';
import {validateTraining,trainingStats} from './training.js';
import {jdcInsights} from './jdc-insights.js';
const DAY=86400000;
// Product milestones, not official rankings or an estimate of tournament ability.
export function development(data,now=Date.now()){
 playerStats(data);
 data.trainings.forEach(validateTraining);
 jdcInsights(data.jdc,data.profile.id,'all',now);
 if(new Set(data.trainings.map(s=>s.id)).size!==data.trainings.length)throw new Error('Powtórzona sesja treningowa.');
 const trainings=data.trainings.filter(s=>s.endedAt!==null&&s.endedAt<=now&&s.darts.length);
 const jdc=data.jdc.filter(s=>s.endedAt!==null&&s.endedAt<=now);
 const stats=playerStats({...data,trainings,jdc,matches:data.matches.filter(m=>m.updatedAt<=now)});
 const precision=trainings.filter(s=>s.darts.length>=30&&trainingStats(s).hits/s.darts.length>=0.5).length;
 const criteria=[
  {name:'Poznaj swoją grę',description:'Ukończ jedną próbę JDC.',value:jdc.length,goal:1},
  {name:'Powtarzalny cel',description:'W 3 sesjach po minimum 30 lotek traf co najmniej połowę w sektor 20.',value:precision,goal:3},
  {name:'Sprawdź powtarzalność',description:'Ukończ 3 próby JDC — porównaj wyniki, nie tylko rekord.',value:jdc.length,goal:3},
  {name:'Sprawdź się w meczu',description:'Ukończ jeden sparing przypisany do profilu.',value:stats.completedMatches,goal:1}
 ];
 let stage=0;while(stage<criteria.length&&criteria[stage].value>=criteria[stage].goal)stage++;
 const badges=[
  {name:'Pierwszy punkt odniesienia',earned:jdc.length>=1,rule:'Jedna pełna próba JDC.'},
  {name:'Powtarzalny cel',earned:precision>=3,rule:criteria[1].description},
  {name:'Shanghai!',earned:stats.jdcResults.some(s=>s.phases.some(p=>p.shanghais>0)),rule:'S, D i T jednego numeru w kolejce JDC.'},
  {name:'Pierwszy sparing',earned:stats.completedMatches>0,rule:'Ukończony mecz zapisany na profilu.'}
 ];
 const recent=jdc.filter(s=>s.endedAt>=now-30*DAY);
 const insight=jdcInsights(data.jdc,data.profile.id,30,now);
 const reason=!recent.length?'Brak aktualnej pełnej próby JDC: zacznij od punktu odniesienia.':insight.reason;
 const sessions=[
  {title:'1 · Punkt odniesienia',exercise:'jdc',text:'2 minuty swobodnej rozgrzewki, potem JDC. Budżet 15 minut; jeśli nie skończysz 57 lotek, zapisz próbę i wróć do niej.'},
  {title:'2 · Celność',exercise:'sector-20',text:'2 minuty rozgrzewki, 10 minut sektora 20 i 3 minuty na spokojne zakończenie oraz wynik. Liczy się trafienie w cały sektor.'},
  {title:'3 · Powtórzenie',exercise:'sector-20',text:'Powtórz układ 2 + 10 + 3 minuty. Porównaj trafienia/liczbę lotek z poprzednią sesją; pojedynczy gorszy wynik nie oznacza cofnięcia.'},
  {title:'4 · Kontrola',exercise:'jdc',text:'Dokończ rozpoczęte JDC albo wykonaj kolejną próbę. Zarezerwuj do 15 minut i porównaj etapy, nie tylko sumę.'}
 ];
 return {criteria,stage,badges,reason,sessions,focus:insight.focus,trainingSessions:trainings.length};
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function developmentPanel(data,enabled){
 const d=development(data);
 return `<section class="panel"><div class="eyebrow">TWOJA DROGA</div><h2>${d.stage===d.criteria.length?'Fundament ukończony':`Etap ${d.stage+1}: ${esc(d.criteria[d.stage].name)}`}</h2><p>Etapy DART PARTY opisują wykonane zadania, nie oficjalny ranking sportowy. Historia i odznaki nie wygasają z powodu przerwy.</p><div class="return-options">${d.criteria.map((c,i)=>`<div><h3>${i<d.stage?'✓ ':''}${esc(c.name)}</h3><p>${esc(c.description)}</p><strong>${Math.min(c.value,c.goal)} / ${c.goal}</strong><progress max="${c.goal}" value="${Math.min(c.value,c.goal)}" aria-label="${esc(c.name)}"></progress></div>`).join('')}</div><h3>Twoje odznaki</h3><div class="return-options">${d.badges.map(b=>`<div><strong>${b.earned?'🏅 Zdobyta':'Do zdobycia'} · ${esc(b.name)}</strong><p>${esc(b.rule)}</p></div>`).join('')}</div>${enabled?`<h3>Twój tydzień · 4 × do 15 minut</h3><p>Rozłóż sesje na wybrane dni. To elastyczna propozycja, bez zaległości i kar. Plan opiera się na regułach aplikacji; trener AI pozostaje osobną opcją.</p><p>${esc(d.reason)}</p><div class="return-options">${d.sessions.map(s=>`<div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p><button data-development-exercise="${s.exercise}">Otwórz ćwiczenie</button></div>`).join('')}</div><p><strong>Weekend:</strong> dobrowolny sparing 301/501 lub Cricket z ekipą. Podpowiedzi zakończenia są dostępne od 170 punktów. Po meczu wróć do statystyk.</p><button data-development-exercise="competition">Przygotuj sparing</button>`:'<p>Włącz „Chcę prosty plan na dziś” powyżej, aby zobaczyć również propozycję tygodnia. Możesz grać bez planu.</p>'}</section>`;
}
