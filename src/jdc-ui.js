import {ensureProfiles,loadProfiles} from './profiles.js';
import {dartLabel} from './engine.js';
import {createJdc,loadJdc,saveJdc,recordJdcDart,undoJdc,jdcTarget,jdcStats,jdcProgress,JDC_PHASES} from './jdc.js';
import {requestCoach,saveCoachReport} from './coach-client.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountJdc(root,{onExit,toast,names=[]}){
 let current=null,multiplier=1,request=null,disposed=false;
 const $=s=>root.querySelector(s);
 const safe=fn=>{try{fn();}catch(e){toast(e.message);}};
 function stop(){request?.abort();request=null;}
 function store(s){saveJdc(s);current=s;}
 function home(){
  stop();document.body.dataset.view='training';let history,profiles;
  try{history=loadJdc();profiles=loadProfiles();}catch(e){root.innerHTML='<section class="panel"><h1>Nie można odczytać JDC</h1><p>Zapis pozostaje zachowany.</p><button id="jdc-exit">Wróć</button></section>';$('#jdc-exit').onclick=onExit;toast(e.message);return;}
  root.innerHTML=`<section class="hero"><div><div class="eyebrow">TRENING · JDC CHALLENGE</div><h1>57 lotek.<br>Twój punkt odniesienia.</h1><p>Sprawdź celność na sektorach i podwójnych. Porównuj pełne próby na swoim profilu.</p></div><button id="jdc-exit">Wróć do treningów</button></section>
  <section class="panel"><h2>Trzy etapy, jedna próba</h2><ol><li>Shanghai 10–15 — po 3 lotki na numer.</li><li>D1–D20 i BULL — po 1 lotce na cel, również po pudle idziesz dalej.</li><li>Shanghai 15–20 — po 3 lotki na numer.</li></ol><p>Shanghai: wartość trafionego celu + 100 pkt za S/D/T w jednej kolejce. Double: 50 pkt za wskazane D, 100 pkt za środek BULL. Pozostałe pola nie punktują. Maksimum: 3380.</p>
  <div class="training-form"><label>Twoje imię<input id="jdc-name" maxlength="24" list="jdc-names" placeholder="Np. Przemek"></label><datalist id="jdc-names">${[...new Set([...names,...profiles.map(p=>p.name)])].map(n=>`<option value="${esc(n)}"></option>`).join('')}</datalist><button id="jdc-start" class="primary">Rozpocznij JDC →</button></div><label class="switch"><input id="jdc-coach-start" type="checkbox"> Wirtualny trener — chcę wskazówki</label><p class="small">Bez limitu czasu. Możesz zapisać próbę i wrócić później. Niepełna próba nie trafia do rekordów. Historia pozostaje na tym urządzeniu.</p></section>
  <section class="panel"><h2>Twoje próby JDC</h2>${history.map(s=>{const st=jdcStats(s);return `<div class="saved-match"><div><strong>${esc(s.name)} · ${st.score} pkt</strong><p>${new Date(s.createdAt).toLocaleDateString('pl-PL')} · ${st.complete?esc(st.grade):`${st.throws}/57 lotek · w toku`}</p></div><button data-jdc-open="${s.id}">${st.complete?'Wynik':'Wznów'}</button></div>`;}).join('')||'<p>Twoja pierwsza próba rozpocznie historię postępów.</p>'}</section>`;
  $('#jdc-exit').onclick=onExit;
  $('#jdc-start').onclick=()=>safe(()=>{const [p]=ensureProfiles([$('#jdc-name').value]);const active=history.find(s=>s.profileId===p.id&&s.endedAt===null);if(active){current=active;toast('Wznawiam Twoją rozpoczętą próbę.');}else store(createJdc(p,$('#jdc-coach-start').checked));multiplier=1;game();});
  root.querySelectorAll('[data-jdc-open]').forEach(b=>b.onclick=()=>{current=history.find(s=>s.id===b.dataset.jdcOpen);multiplier=1;current.endedAt===null?game():result();});
 }
 function game(){
  stop();const t=jdcTarget(current.darts.length),st=jdcStats(current),label=t.phase===1?(t.number===25?'BULL 50':`D${t.number}`):String(t.number);
  const advice=t.phase===1?'Masz jedną lotkę na ten cel. Następna lotka będzie już na kolejny podwójny numer.':'Punktuje tylko wskazany numer. S + D + T w tej kolejce daje dodatkowe 100 punktów.';
  root.innerHTML=`<div class="game-title jdc-title"><div><div class="eyebrow">JDC · ${esc(current.name)} · ETAP ${t.phase+1}/3</div><h1>Celuj w <span class="training-target">${label}</span></h1><p>${JDC_PHASES[t.phase]} · ${t.phase===1?'Jedna lotka na cel':`Lotka ${t.dart} z 3 na ten numer`}</p></div><strong class="jdc-score">${st.score}<small>punktów</small></strong></div>
  <div class="training-stats"><span><strong>${current.darts.length}/57</strong> zapisanych lotek</span><span>Następna lotka: <strong>${current.darts.length+1}</strong></span></div><progress class="jdc-progress" value="${current.darts.length}" max="57" aria-label="Postęp próby JDC"></progress>
  <section class="panel"><div class="keypad-head"><h2>W co trafiła lotka?</h2><div class="multiplier">${[1,2,3].map(m=>`<button data-jdc-mult="${m}" class="${multiplier===m?'selected':''}" aria-pressed="${multiplier===m}">×${m}</button>`).join('')}</div></div><p class="small">Wpisz faktyczne trafienie. Pudło celu też zapisujemy — dzięki temu poznasz swoją celność.</p><div class="number-grid">${Array.from({length:20},(_,i)=>i+1).map(n=>`<button data-jdc-hit="${n}">${n}</button>`).join('')}</div><div class="special-keys"><button data-jdc-special="25">BULL 25</button><button data-jdc-special="50">BULL 50</button><button data-jdc-special="0">POZA TARCZĄ / 0</button></div>
  <p class="training-last" role="status">${current.darts.length?`Ostatnia lotka: ${dartLabel(current.darts.at(-1))}`:'Wpisz pierwszą lotkę.'}</p><label class="switch"><input id="jdc-coach" type="checkbox" ${current.coachEnabled?'checked':''}> Wirtualny trener — chcę wskazówki</label>${current.coachEnabled?`<aside class="training-coach-advice">${advice}</aside><p class="small">To wskazówki zasad. Opcjonalna analiza AI jest dostępna po pełnej próbie.</p>`:''}<div class="training-actions"><button id="jdc-undo" ${current.darts.length?'':'disabled'}>↶ Cofnij rzut</button><button id="jdc-save">Zapisz i wróć</button></div></section>`;
  root.querySelectorAll('[data-jdc-mult]').forEach(b=>b.onclick=()=>{multiplier=Number(b.dataset.jdcMult);game();});
  const hit=(n,m)=>safe(()=>{store(recordJdcDart(current,n,m));current.endedAt===null?game():result();});
  root.querySelectorAll('[data-jdc-hit]').forEach(b=>b.onclick=()=>hit(Number(b.dataset.jdcHit),multiplier));
  root.querySelectorAll('[data-jdc-special]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.jdcSpecial);hit(n===50?25:n,n===50?2:1);});
  $('#jdc-coach').onchange=e=>safe(()=>{store({...current,coachEnabled:e.target.checked});game();});
  $('#jdc-undo').onclick=()=>safe(()=>{store(undoJdc(current));game();});
  $('#jdc-save').onclick=home;
 }
 function result(){
  stop();const st=jdcStats(current);let progress;try{progress=jdcProgress(current,loadJdc());}catch(e){toast(e.message);progress={count:0};}
  root.innerHTML=`<section class="panel training-result"><div class="eyebrow">JDC ZAKOŃCZONE · ${esc(current.name)}</div><h1>${st.score} pkt</h1><p>Poziom wyniku: <strong>${st.grade}</strong> · 57/57 lotek</p><p class="small">Poziom tej próby, nie oficjalny awans w akademii JDC.</p><div class="jdc-phases">${st.phases.map((p,i)=>`<div><h2>${p.name}</h2><strong>${p.score} pkt</strong><p>${p.hits}/${p.throws} trafień celu${i===1?'':` · ${p.shanghais} Shanghai`}</p></div>`).join('')}</div>
  <p>${progress.count?`Poprzednia próba: ${progress.last} pkt · zmiana: ${st.score-progress.last>0?'+':''}${st.score-progress.last} pkt. Wcześniejszy rekord: ${progress.best} pkt. Średnia poprzednich pełnych prób: ${progress.average} pkt (${progress.count} prób).`:'Pierwsza pełna próba na tym profilu — Twój punkt odniesienia.'}</p>
  <label class="switch"><input id="jdc-result-coach" type="checkbox" ${current.coachEnabled?'checked':''}> Wirtualny trener — chcę analizę</label>${current.coachEnabled?'<div class="training-ai"><button id="jdc-ai">Poproś trenera AI o analizę</button><p class="small">Do OpenAI wyślemy statystyki Twoich treningów i zakończonych meczów, bez imienia. Wymaga skonfigurowanej usługi AI.</p><div id="jdc-ai-response" role="status"></div></div>':''}
  <div class="training-actions"><button id="jdc-home" class="primary">Wróć do JDC</button><button id="jdc-correct">↶ Popraw ostatnią lotkę</button></div></section>`;
  $('#jdc-home').onclick=home;$('#jdc-correct').onclick=()=>safe(()=>{store(undoJdc(current));game();});
  $('#jdc-result-coach').onchange=e=>safe(()=>{store({...current,coachEnabled:e.target.checked});result();});
  if($('#jdc-ai'))$('#jdc-ai').onclick=async()=>{
   if(request)return;const controller=new AbortController();request=controller;$('#jdc-ai').disabled=true;$('#jdc-ai-response').textContent='Trener analizuje wyniki…';
   try{const report=await requestCoach(current,controller.signal);if(disposed||controller.signal.aborted)return;const a=report.advice;$('#jdc-ai-response').innerHTML=`<p>${esc(a.summary)}</p><p><strong>${esc(a.focus)}</strong></p><p>${esc(a.tip)}</p><p class="small">${esc(a.reason)}</p><p class="small">Podstawa: ${report.evidence.jdcSessions??0} pełnych prób JDC, ${report.evidence.trainingThrows} lotek ćwiczenia sektora 20 i ${report.evidence.completedMatches} zakończonych meczów.</p>`;safe(()=>saveCoachReport(current.profileId,current.id,report));}
   catch(e){if(!disposed&&!controller.signal.aborted)$('#jdc-ai-response').textContent=e.message;}
   finally{if(request===controller){request=null;if($('#jdc-ai'))$('#jdc-ai').disabled=false;}}
  };
 }
 home();return ()=>{disposed=true;stop();};
}
