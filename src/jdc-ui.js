import {roundTargets,commitRound,maximumPossible,roundPrompt,roundFeedback,levelPanel,comparisonRows,roundHistory,historyPanel} from './jdc-round.js';
import {speakTraining,stopSpeech,playSound,soundEnabled} from './sound.js';
import {rulesPanel} from './game-rules.js';
import {ensureProfiles,loadProfiles} from './profiles.js';
import {dartLabel,validDart} from './engine.js';
import {createJdc,loadJdc,saveJdc,undoJdc,jdcStats,jdcProgress} from './jdc.js';
import {requestCoach,saveCoachReport} from './coach-client.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountJdc(root,{onExit,toast,names=[],initialName=''}){
 let current=null,request=null,disposed=false;
 const $=s=>root.querySelector(s);
 const safe=fn=>{try{fn();}catch(e){toast(e.message);}};
 function stop(){request?.abort();request=null;}
 function store(s){saveJdc(s);current=s;}
 function home(){
  stopSpeech();stop();document.body.dataset.view='training';let history,profiles;
  try{history=loadJdc();profiles=loadProfiles();}catch(e){root.innerHTML='<section class="panel"><h1>Nie można odczytać JDC</h1><p>Zapis pozostaje zachowany.</p><button id="jdc-exit">Wróć</button></section>';$('#jdc-exit').onclick=onExit;toast(e.message);return;}
  root.innerHTML=`<section class="hero"><div><div class="eyebrow">TRENING · JDC CHALLENGE</div><h1>57 lotek.<br>Twój punkt odniesienia.</h1><p>Sprawdź celność na sektorach i podwójnych. Porównuj pełne próby na swoim profilu.</p></div><button id="jdc-exit">Wróć do treningów</button></section>
  <section class="panel"><h2>Trzy etapy, jedna próba</h2><ol><li>Shanghai 10–15 — po 3 lotki na numer.</li><li>D1–D20 i BULL — po 1 lotce na cel, również po pudle idziesz dalej.</li><li>Shanghai 15–20 — po 3 lotki na numer.</li></ol><p>Shanghai: wartość trafionego celu + 100 pkt za S/D/T w jednej kolejce. Double: 50 pkt za wskazane D, 100 pkt za środek BULL. Pozostałe pola nie punktują. Maksimum: 3380.</p>${rulesPanel({mode:'jdc'})}
  <div class="training-form"><label>Twoje imię<input id="jdc-name" maxlength="24" list="jdc-names" placeholder="Np. Przemek"></label><datalist id="jdc-names">${[...new Set([...names,...profiles.map(p=>p.name)])].map(n=>`<option value="${esc(n)}"></option>`).join('')}</datalist><button id="jdc-start" class="primary">Rozpocznij JDC →</button></div><label class="switch"><input id="jdc-coach-start" type="checkbox"> Wirtualny trener — chcę wskazówki</label><p class="small">Bez limitu czasu. Możesz zapisać próbę i wrócić później. Niepełna próba nie trafia do rekordów. Historia pozostaje na tym urządzeniu.</p></section>
  <section class="panel"><h2>Twoje próby JDC</h2>${history.map(s=>{const st=jdcStats(s);return `<div class="saved-match"><div><strong>${esc(s.name)} · ${st.score} pkt</strong><p>${new Date(s.createdAt).toLocaleDateString('pl-PL')} · ${st.complete?esc(st.grade):`${st.throws}/57 lotek · w toku`}</p></div><button data-jdc-open="${s.id}">${st.complete?'Wynik':'Wznów'}</button></div>`;}).join('')||'<p>Twoja pierwsza próba rozpocznie historię postępów.</p>'}</section>`;
  $('#jdc-name').value=initialName;
  $('#jdc-exit').onclick=onExit;
  $('#jdc-start').onclick=()=>safe(()=>{const [p]=ensureProfiles([$('#jdc-name').value]);const active=history.find(s=>s.profileId===p.id&&s.endedAt===null);if(active){current=active;toast('Wznawiam Twoją rozpoczętą próbę.');}else store(createJdc(p,$('#jdc-coach-start').checked));game();playSound('turn');speakTraining(roundPrompt(current));});
  root.querySelectorAll('[data-jdc-open]').forEach(b=>b.onclick=()=>{current=history.find(s=>s.id===b.dataset.jdcOpen);if(current.endedAt===null){game();playSound('turn');speakTraining(roundPrompt(current));}else result();});
 }
 function game(notice=null){
  stop();const targets=roundTargets(current),t=targets[0],st=jdcStats(current),draft=current.draft||[],double=t.phase===1;
  const label=double?targets.map(x=>x.number===25?'BULL':`D${x.number}`).join(' → '):String(t.number);
  root.innerHTML=`<div class="game-title jdc-title"><div><div class="eyebrow">JDC · ${esc(current.name)} · ETAP ${t.phase+1}/3</div><h1>Celuj w <span class="training-target">${label}</span></h1><p>${double?'Po jednej lotce na każde pole':'Shanghai · '+targets.length+' lotki do zatwierdzenia'}</p></div><div class="jdc-counters"><strong class="jdc-score">${st.score}<small>zdobyte punkty</small></strong><strong>${maximumPossible(current)}<small>maksymalny możliwy wynik końcowy</small></strong></div></div>
  ${notice?`<aside class="jdc-celebration ${notice.shanghai?'shanghai':''}" role="status"><strong>${notice.shanghai?'SHANGHAI! +100':`KOLEJKA: ${notice.score} PKT`}</strong><span>${notice.shanghai?`Wynik kolejki: ${notice.score} pkt · Brawo, ${esc(current.name)}!`:''}${notice.advance?` Nowy poziom: ${esc(notice.grade)}!`:''}</span></aside>`:''}
  ${levelPanel(st.score)}
  ${current.darts.length?`<details class="panel"><summary>Ostatnia zapisana kolejka: ${roundHistory(current).at(-1).hits.join(' · ')} — ${roundHistory(current).at(-1).score} pkt · pokaż historię</summary>${historyPanel(current)}</details>`:''}
  <section class="panel"><div class="keypad-head"><h2>${double?'Zaznacz trafione cele':'Zaznacz trafienia kolejki'}</h2><button id="jdc-repeat">Powtórz cele / sprawdź dźwięk</button></div>
  <div class="jdc-quick-hits">${double?targets.map((goal,i)=>`<button data-double="${i}" aria-pressed="${draft[i]?.number===goal.number&&draft[i]?.multiplier===2}" class="${draft[i]?.number===goal.number&&draft[i]?.multiplier===2?'selected':''}"><span>LOTKA ${i+1}</span><strong>${goal.number===25?'BULL':'D'+goal.number}</strong><small>${draft[i]?.number===goal.number&&draft[i]?.multiplier===2?'✓ TRAFIONA':'Kliknij, jeśli trafiona'} · ${goal.number===25?100:50} pkt</small></button>`).join(''):[1,2,3].map(m=>`<button class="${draft.some(d=>d?.number===t.number&&d.multiplier===m)?'selected':''}" data-shanghai="${m}" ${draft.length>=targets.length?'disabled':''}><span>${({1:'POJEDYNCZA',2:'PODWÓJNA',3:'POTRÓJNA'})[m]}</span><strong>${t.number}</strong><small>${'●'.repeat(draft.filter(d=>d?.number===t.number&&d.multiplier===m).length)}${'○'.repeat(3-draft.filter(d=>d?.number===t.number&&d.multiplier===m).length)}</small></button>`).join('')}</div>
  <div class="jdc-draft">${targets.map((goal,i)=>`<span class="${draft[i]?'filled':''}">Lotka ${i+1}: <b>${draft[i]?(draft[i].number===0?'poza tarczą':dartLabel(draft[i])):'nie trafiono celu'}</b></span>`).join('')}</div>
  <p>Wpisujesz całą kolejkę. Niezaznaczone lotki oznaczają brak trafienia celu — nie zgadujemy, w jakie pole trafiły. Wynik i lektor uruchomią się po zatwierdzeniu.</p>
  <details id="jdc-other"><summary>Wpisz dokładne pole nietrafionej lotki (opcjonalnie)</summary><label>Lotka <select id="jdc-slot">${targets.map((_,i)=>`<option value="${i}">${i+1}</option>`).join('')}</select></label><label>Pole <select id="jdc-number"><option value="0">Poza tarczą</option>${Array.from({length:20},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}<option value="25">BULL</option></select></label><label>Mnożnik <select id="jdc-multiple"><option value="1">Pojedyncza</option><option value="2">Podwójna</option><option value="3">Potrójna</option></select></label><button id="jdc-exact">Dodaj do kolejki</button></details>
  <div class="training-actions"><button id="jdc-miss">Żadna nie trafiła celu — zapisz 0 pkt</button><button id="jdc-confirm" class="primary">Zatwierdź kolejkę →</button><button id="jdc-clear">Wyczyść zaznaczenia</button><button id="jdc-undo" ${current.darts.length?'':'disabled'}>Cofnij zapisaną kolejkę</button><button id="jdc-save">Zapisz i wróć</button></div><p>${current.darts.length}/57 zatwierdzonych lotek. Zaznaczenia również zapisują się na tym urządzeniu.</p><label class="switch"><input id="jdc-coach" type="checkbox" ${current.coachEnabled?'checked':''}> Wirtualny trener — chcę wskazówki</label>${rulesPanel({mode:'jdc'})}</section>`;
  function setDraft(value){store({...current,draft:value});game();}
  root.querySelectorAll('[data-shanghai]').forEach(b=>b.onclick=()=>safe(()=>{if(draft.length>=targets.length)return;setDraft([...draft,{number:t.number,multiplier:Number(b.dataset.shanghai)}]);}));
  root.querySelectorAll('[data-double]').forEach(b=>b.onclick=()=>safe(()=>{const i=Number(b.dataset.double),goal=targets[i],next=Array.from({length:targets.length},(_,k)=>draft[k]??null);next[i]=draft[i]?.number===goal.number&&draft[i]?.multiplier===2?null:{number:goal.number,multiplier:2};setDraft(next);}));
  $('#jdc-exact').onclick=()=>safe(()=>{const i=Number($('#jdc-slot').value),n=Number($('#jdc-number').value),m=Number($('#jdc-multiple').value);if(!validDart({number:n,multiplier:m}))throw new Error('Nieprawidłowe pole lub mnożnik.');const next=Array.from({length:Math.max(draft.length,i+1)},(_,k)=>draft[k]??null);next[i]={number:n,multiplier:m};setDraft(next);});
  $('#jdc-clear').onclick=()=>safe(()=>setDraft([]));
  $('#jdc-repeat').onclick=()=>{if(!soundEnabled()){toast('Włącz dźwięk u góry ekranu.');return;}playSound('turn');speakTraining(roundPrompt(current));};
  function submitRound(entries){safe(()=>{const before=current,next=commitRound(current,entries);store(next);const notice=roundFeedback(before,current);current.endedAt===null?game(notice):result(notice);playSound(notice.shanghai?'shanghai':notice.advance||current.endedAt!==null?'win':'turn');speakTraining(notice.text,notice.shanghai||notice.advance);});}
  $('#jdc-confirm').onclick=()=>submitRound(targets.map((_,i)=>draft[i]??null));
  $('#jdc-miss').onclick=()=>submitRound(targets.map(()=>null));
  $('#jdc-undo').onclick=()=>safe(()=>{const count=current.darts.length%3||3;store({...current,draft:[],darts:current.darts.slice(0,-count),endedAt:null});game();speakTraining('Cofnięto kolejkę. '+roundPrompt(current));});
  $('#jdc-save').onclick=home;
  $('#jdc-coach').onchange=e=>safe(()=>{store({...current,coachEnabled:e.target.checked});game();});
 }
 function result(notice=null){
  stop();const st=jdcStats(current);let progress;try{progress=jdcProgress(current,loadJdc());}catch(e){toast(e.message);progress={count:0};}
  root.innerHTML=`<section class="panel training-result"><div class="eyebrow">JDC ZAKOŃCZONE · ${esc(current.name)}</div><h1>${st.score} pkt</h1><p>Poziom wyniku: <strong>${st.grade}</strong> · 57/57 lotek</p><p class="small">Poziom tej próby, nie oficjalny awans w akademii JDC.</p>${levelPanel(st.score)}${notice?.shanghai?'<aside class="jdc-celebration shanghai" role="status"><strong>SHANGHAI! +100</strong></aside>':''}<div class="jdc-phases">${st.phases.map((p,i)=>`<div><h2>${p.name}</h2><strong>${p.score} pkt</strong><p>${p.hits}/${p.throws} trafień celu${i===1?'':` · ${p.shanghais} Shanghai`}</p></div>`).join('')}</div>
  <p>${progress.count?`Poprzednia próba: ${progress.last} pkt · zmiana: ${st.score-progress.last>0?'+':''}${st.score-progress.last} pkt. Wcześniejszy rekord: ${progress.best} pkt. Średnia poprzednich pełnych prób: ${progress.average} pkt (${progress.count} prób).`:'Pierwsza pełna próba na tym profilu — Twój punkt odniesienia.'}</p>
  ${historyPanel(current)}
  <div class="jdc-comparison"><h2>Ta próba na tle wcześniejszych wyników</h2><table><thead><tr><th>Część</th><th>Teraz</th><th>Średnia wcześniej</th><th>Zmiana pkt</th><th>Zmiana %</th></tr></thead><tbody>${comparisonRows(current,loadJdc()).map(r=>`<tr><th>${r.name}</th><td>${r.value}</td><td>${r.mean??'—'} (${r.count} prób)</td><td>${r.delta===null?'—':r.delta>0?'+'+r.delta:r.delta}</td><td>${r.percent!==null?(r.percent>0?'+':'')+r.percent+'%':r.mean===0&&r.value>0?'Pierwsze punkty':'—'}</td></tr>`).join('')}</tbody></table><p>Pełne próby tego profilu zakończone przed rozpoczęciem obecnej. Jedna próba nie określa całej formy.</p></div>
  <label class="switch"><input id="jdc-result-coach" type="checkbox" ${current.coachEnabled?'checked':''}> Wirtualny trener — chcę analizę</label>${current.coachEnabled?'<div class="training-ai"><button id="jdc-ai">Poproś trenera AI o analizę</button><p class="small">Do OpenAI wyślemy statystyki Twoich treningów i zakończonych meczów, bez imienia. Wymaga skonfigurowanej usługi AI.</p><div id="jdc-ai-response" role="status"></div></div>':''}
  <div class="training-actions"><button id="jdc-home" class="primary">Wróć do JDC</button><button id="jdc-correct">↶ Popraw ostatnią lotkę</button></div></section>`;
  $('#jdc-home').onclick=home;$('#jdc-correct').onclick=()=>safe(()=>{store(undoJdc(current));game();speakTraining('Cofnięto ostatnią lotkę. '+roundPrompt(current));});
  $('#jdc-result-coach').onchange=e=>safe(()=>{store({...current,coachEnabled:e.target.checked});result();});
  if($('#jdc-ai'))$('#jdc-ai').onclick=async()=>{
   if(request)return;const controller=new AbortController();request=controller;$('#jdc-ai').disabled=true;$('#jdc-ai-response').textContent='Trener analizuje wyniki…';
   try{const report=await requestCoach(current,controller.signal);if(disposed||controller.signal.aborted)return;const a=report.advice;$('#jdc-ai-response').innerHTML=`<p>${esc(a.summary)}</p><p><strong>${esc(a.focus)}</strong></p><p>${esc(a.tip)}</p><p class="small">${esc(a.reason)}</p><p class="small">Podstawa: ${report.evidence.jdcSessions??0} pełnych prób JDC, ${report.evidence.trainingThrows} lotek ćwiczenia sektora 20 i ${report.evidence.completedMatches} zakończonych meczów.</p>`;safe(()=>saveCoachReport(current.profileId,current.id,report));}
   catch(e){if(!disposed&&!controller.signal.aborted)$('#jdc-ai-response').textContent=e.message;}
   finally{if(request===controller){request=null;if($('#jdc-ai'))$('#jdc-ai').disabled=false;}}
  };
 }
 home();return ()=>{stopSpeech();disposed=true;stop();};
}
