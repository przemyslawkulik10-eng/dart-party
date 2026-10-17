import {createTraining,remainingTime,pauseTraining,resumeTraining,finishTraining,recordTrainingDart,trainingStats,trainingAdvice,loadTrainings,saveTraining} from './training.js';
import {dartLabel} from './engine.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const coachChoice=checked=>`<div class="training-coach"><label class="switch"><input id="training-coach" type="checkbox" ${checked?'checked':''}> Wirtualny trener — chcę wskazówki</label><p class="small">Bez zaznaczenia ćwiczysz samodzielnie. Możesz zmienić wybór w trakcie sesji.</p><p class="small muted">Na razie podstawowe wskazówki; trener AI będzie dostępny później.</p></div>`;
const clock=ms=>`${Math.floor(Math.ceil(ms/1000)/60)}:${String(Math.ceil(ms/1000)%60).padStart(2,'0')}`;
export function mountTraining(root,{onExit,toast,names=[]}){
 let current=null,multiplier=1,timer=null,disposed=false;
 const $=s=>root.querySelector(s);
 function stop(){clearInterval(timer);timer=null;}
 function safely(fn){try{fn();}catch(e){toast(e.message);}}
 function store(next){saveTraining(next);current=next;}
 function home(){
  stop();document.body.dataset.view='training';root.classList.remove('cricket-game','x01-game');
  let sessions;
  try{sessions=loadTrainings();}catch(e){root.innerHTML='<section class="panel"><h1>Nie można odczytać treningów</h1><p>Istniejący zapis pozostaje zachowany.</p><button id="training-back">Wróć</button></section>';$('#training-back').onclick=onExit;toast(e.message);return;}
  const active=sessions.filter(s=>s.endedAt===null);
  root.innerHTML=`<section class="hero"><div><div class="eyebrow">TRENING · PIERWSZY KROK</div><h1>Poznaj swoją celność.</h1><p>Jeden cel. Krótka sesja. Twój punkt odniesienia na kolejne treningi.</p></div><button id="training-back">Wróć</button></section>
  ${active.map(s=>`<div class="resume-banner"><div><strong>${esc(s.name)} · rozpoczęty trening</strong><p>${s.darts.length} lotek · ${clock(remainingTime(s))} do końca</p></div><button data-resume-training="${esc(s.id)}">Wznów trening</button></div>`).join('')}
  <section class="panel"><div class="eyebrow">CEL: SEKTOR 20</div><h2>Powtarzalność przed punktami</h2><p>Celuj w sektor 20. Każde trafienie w 20 — pojedyncze, podwójne lub potrójne — zaliczamy jako jeden celny rzut. Wpisuj faktycznie trafione pole, również gdy chybiłeś celu.</p>
  ${coachChoice(false)}<div class="training-form"><label>Twoje imię<input id="training-name" maxlength="24" list="training-names" placeholder="Np. Przemek"></label><datalist id="training-names">${[...new Set([...names,...sessions.map(s=>s.name)])].map(n=>`<option value="${esc(n)}"></option>`).join('')}</datalist><label>Czas sesji<select id="training-duration"><option value="5">5 minut</option><option value="10">10 minut</option><option value="15" selected>15 minut</option></select></label><button id="training-start" class="primary">Zacznij trening →</button></div><p class="small">Możesz zrobić pauzę lub skończyć wcześniej. Treningi zapisują się na tym urządzeniu, osobno od meczów.</p></section>
  <section class="panel training-history"><h2>Ostatnie treningi</h2>${sessions.filter(s=>s.endedAt!==null).slice(0,12).map(s=>{const st=trainingStats(s);return `<div class="saved-match"><div><strong>${esc(s.name)} · ${st.accuracy??'—'}${st.accuracy===null?'':'%'}</strong><p>${st.hits}/${st.throws} trafień w sektor 20 · ${new Date(s.createdAt).toLocaleDateString('pl-PL')}</p></div><button data-result="${esc(s.id)}">Wynik</button></div>`;}).join('')||'<p>Pierwsza sesja będzie początkiem Twojej historii.</p>'}</section>`;
  $('#training-back').onclick=onExit;
  $('#training-start').onclick=()=>safely(()=>{const name=$('#training-name').value.trim();if(active.some(s=>s.name.toLocaleLowerCase('pl-PL')===name.toLocaleLowerCase('pl-PL')))throw new Error('Masz rozpoczęty trening. Wznów go z listy.');store(createTraining(name,Number($('#training-duration').value),Date.now(),$('#training-coach').checked));multiplier=1;game();});
  root.querySelectorAll('[data-resume-training]').forEach(b=>b.onclick=()=>safely(()=>{current=sessions.find(s=>s.id===b.dataset.resumeTraining);if(!remainingTime(current)){store(finishTraining(current));result();}else {store(resumeTraining(current));game();}}));
  root.querySelectorAll('[data-result]').forEach(b=>b.onclick=()=>{current=sessions.find(s=>s.id===b.dataset.result);result();});
 }
 function game(){
  stop();const stats=trainingStats(current),paused=current.runningSince===null;
  root.innerHTML=`<div class="game-title"><div><div class="eyebrow">TRENING · ${esc(current.name)}</div><h1>Celuj w <span class="training-target">20</span></h1><p>Cały sektor 20. Rzucaj w swoim tempie.</p></div><strong id="training-clock" class="training-clock" aria-label="Pozostały czas">${clock(remainingTime(current))}</strong></div>
  <div class="training-stats"><span><strong>${stats.hits}/${stats.throws}</strong> trafień</span><span><strong>${stats.accuracy??'—'}${stats.accuracy===null?'':'%'}</strong> celności</span><span>${paused?'PAUZA':'SESJA TRWA'}</span></div>
  <section class="panel"><div class="keypad-head"><h2>W co trafiła lotka?</h2><div class="multiplier">${[1,2,3].map(m=>`<button data-training-mult="${m}" class="${multiplier===m?'selected':''}" aria-pressed="${multiplier===m}">×${m}</button>`).join('')}</div></div><div class="number-grid">${Array.from({length:20},(_,i)=>i+1).map(n=>`<button data-training-hit="${n}" ${paused?'disabled':''}>${n}</button>`).join('')}</div><div class="special-keys"><button data-training-special="25" ${paused?'disabled':''}>BULL 25</button><button data-training-special="50" ${paused?'disabled':''}>BULL 50</button><button data-training-special="0" ${paused?'disabled':''}>PUDŁO / 0</button></div>
  ${coachChoice(current.coachEnabled)}${current.coachEnabled?`<aside class="training-coach-advice" aria-label="Wskazówka trenera" role="status">${esc(trainingAdvice(current))}</aside>`:''}<p class="training-last" role="status">${current.darts.length?`Ostatnia lotka: ${dartLabel(current.darts.at(-1))}`:'Wpisz pierwszą lotkę.'}</p><div class="training-actions"><button id="training-undo" ${current.darts.length?'':'disabled'}>↶ Cofnij rzut</button><button id="training-pause">${paused?'Wznów':'Pauza'}</button><button id="training-finish">Zakończ trening</button><button id="training-home">Zapisz i wróć</button></div></section>`;
  $('#training-coach').onchange=e=>safely(()=>{store({...current,coachEnabled:e.target.checked});game();});
  function hit(n,m){safely(()=>{if(!remainingTime(current)){store(finishTraining(current));result();return;}store(recordTrainingDart(current,n,m));game();});}
  root.querySelectorAll('[data-training-hit]').forEach(b=>b.onclick=()=>hit(Number(b.dataset.trainingHit),multiplier));
  root.querySelectorAll('[data-training-special]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.trainingSpecial);hit(n===50?25:n,n===50?2:1);});
  root.querySelectorAll('[data-training-mult]').forEach(b=>b.onclick=()=>{multiplier=Number(b.dataset.trainingMult);game();});
  $('#training-undo').onclick=()=>safely(()=>{store({...current,darts:current.darts.slice(0,-1)});game();});
  $('#training-pause').onclick=()=>safely(()=>{store(paused?resumeTraining(current):pauseTraining(current));game();});
  $('#training-finish').onclick=()=>safely(()=>{store(finishTraining(current));result();});
  $('#training-home').onclick=()=>safely(()=>{store(pauseTraining(current));home();});
  if(!paused)timer=setInterval(()=>{if(disposed)return;const left=remainingTime(current);$('#training-clock').textContent=clock(left);if(!left){stop();safely(()=>{store(finishTraining(current));result();});}},500);
 }
 function result(){
  stop();const st=trainingStats(current);
  root.innerHTML=`<section class="panel training-result"><div class="eyebrow">TRENING ZAKOŃCZONY · ${esc(current.name)}</div><h1>Na dziś wystarczy.</h1><p>Cel: sektor 20 · czas aktywny ${clock(current.durationMs-current.remainingMs)}</p><div class="training-stats"><span><strong>${st.hits}/${st.throws}</strong> trafień</span><span><strong>${st.accuracy??'—'}${st.accuracy===null?'':'%'}</strong> celności</span></div><p>${st.throws?'Wynik zapisany. Kolejna sesja pozwoli porównać celność.':'Sesja zapisana bez rzutów. Nie wyliczamy z niej celności.'}</p><button id="training-home" class="primary">Wróć do treningów</button></section>`;
  $('#training-home').onclick=home;
 }
 home();
 return ()=>{disposed=true;stop();if(current && current.endedAt===null && current.runningSince!==null)safely(()=>store(pauseTraining(current)));};
}
