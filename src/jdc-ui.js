import {createDuel,duelPlayers,nextPlayer,previousPlayer,duelResult,saveNewDuel} from './jdc-duel.js';
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
 function pair(){return current?.matchId?duelPlayers(current,loadJdc()):null;}
 function scoreboard(){const ps=pair();if(!ps)return '';const outcome=duelResult(ps);return `<section class="panel jdc-duel"><div class="eyebrow">JDC · POJEDYNEK PRZY JEDNEJ TARCZY</div><h2>${outcome?(outcome.tie?'Remis!':'Wygrywa '+esc(outcome.winner.name)+'!'):'Teraz rzuca: '+esc(current.name)}</h2><div class="jdc-duel-scores">${ps.map(p=>`<div class="${p.id===current.id?'active':''}"><strong>${esc(p.name)}</strong><b>${jdcStats(p).score} pkt</b><span>${p.darts.length}/57 lotek</span>${outcome?`<button data-duel-result="${p.id}">Szczegóły ${esc(p.name)}</button>`:''}</div>`).join('')}</div><p>Po trzy lotki na zmianę. Każdy rozgrywa pełne 57 lotek. Wygrywa wyższy wynik.</p></section>`;}
 function openSession(session){current=session;const ps=pair();if(ps)current=nextPlayer(ps)||session;if(current.endedAt===null){game();speakTraining(current.name+'. '+roundPrompt(current));}else result();}
 function home(){
  root.classList.remove("jdc-playing");
  stopSpeech();stop();document.body.dataset.view='training';let history,profiles;
  try{history=loadJdc();profiles=loadProfiles();}catch(e){root.innerHTML='<section class="panel"><h1>Nie można odczytać JDC</h1><p>Zapis pozostaje zachowany.</p><button id="jdc-exit">Wróć</button></section>';$('#jdc-exit').onclick=onExit;toast(e.message);return;}
  root.innerHTML=`<section class="hero"><div><div class="eyebrow">TRENING · JDC CHALLENGE</div><h1>57 lotek.<br>Twój punkt odniesienia.</h1><p>Sprawdź celność na sektorach i podwójnych. Porównuj pełne próby na swoim profilu.</p></div><button id="jdc-exit">Wróć do treningów</button></section>
  <section class="panel"><h2>Trzy etapy, jedna próba</h2><ol><li>Shanghai 10–15 — po 3 lotki na numer.</li><li>D1–D20 i BULL — po 1 lotce na cel, również po pudle idziesz dalej.</li><li>Shanghai 15–20 — po 3 lotki na numer.</li></ol><p>Shanghai: wartość trafionego celu + 100 pkt za S/D/T w jednej kolejce. Double: 50 pkt za wskazane D, 100 pkt za środek BULL. Pozostałe pola nie punktują. Maksimum: 3380.</p>${rulesPanel({mode:'jdc'})}
  <div class="training-form"><label>Twoje imię<input id="jdc-name" maxlength="24" list="jdc-names" placeholder="Np. Przemek"></label><datalist id="jdc-names">${[...new Set([...names,...profiles.map(p=>p.name)])].map(n=>`<option value="${esc(n)}"></option>`).join('')}</datalist><label>Tryb<select id="jdc-mode"><option value="solo">Samodzielny trening</option><option value="duel">We dwoje przy jednej tarczy</option></select></label><label id="jdc-second-label" hidden>Drugi gracz<input id="jdc-second" maxlength="24" list="jdc-names" placeholder="Mikołaj"></label><button id="jdc-start" class="primary">Rozpocznij JDC →</button></div><label class="switch"><input id="jdc-coach-start" type="checkbox"> Wirtualny trener — chcę wskazówki</label><p class="small">Bez limitu czasu. Możesz zapisać próbę i wrócić później. Niepełna próba nie trafia do rekordów. Historia pozostaje na tym urządzeniu.</p></section>
  <section class="panel"><h2>Twoje próby JDC</h2>${history.filter(s=>!s.matchId||s.seat===0).map(s=>{const st=jdcStats(s),ps=s.matchId?duelPlayers(s,history):null;return `<div class="saved-match"><div><strong>${ps?ps.map(p=>esc(p.name)).join(' kontra '):esc(s.name)} · ${ps?ps.map(p=>jdcStats(p).score).join(' : '):st.score} pkt</strong><p>${new Date(s.createdAt).toLocaleDateString('pl-PL')} · ${st.complete?esc(st.grade):`${st.throws}/57 lotek · w toku`}</p></div><button data-jdc-open="${s.id}">${st.complete&&(!ps||ps.every(p=>p.endedAt!==null))?'Wynik':'Wznów'}</button></div>`;}).join('')||'<p>Twoja pierwsza próba rozpocznie historię postępów.</p>'}</section>`;
  $('#jdc-name').value=initialName;
  $('#jdc-exit').onclick=onExit;
  $('#jdc-mode').onchange=()=>{$('#jdc-second-label').hidden=$('#jdc-mode').value!=='duel';};
  $('#jdc-start').onclick=()=>safe(()=>{
   const duel=$('#jdc-mode').value==='duel';
   const entered=[$('#jdc-name').value.trim(),...(duel?[$('#jdc-second').value.trim()]:[])];
   if(duel&&(!entered[1]||entered[0].toLocaleLowerCase('pl')===entered[1].toLocaleLowerCase('pl')))throw new Error('Wpisz imiona dwóch różnych graczy.');
   const profiles=ensureProfiles(entered);
   if(duel){const active=history.find(s=>s.matchId&&s.seat===0&&duelPlayers(s,history).some(p=>p.endedAt===null)&&duelPlayers(s,history).every(p=>profiles.some(x=>x.id===p.profileId)));if(active){openSession(active);return;}const ps=createDuel(profiles,$('#jdc-coach-start').checked);saveNewDuel(ps);openSession(ps[0]);}
   else{const active=history.find(s=>!s.matchId&&s.profileId===profiles[0].id&&s.endedAt===null);if(active)openSession(active);else{store(createJdc(profiles[0],$('#jdc-coach-start').checked));openSession(current);}}
  });
  root.querySelectorAll('[data-jdc-open]').forEach(b=>b.onclick=()=>safe(()=>openSession(history.find(s=>s.id===b.dataset.jdcOpen))));
 }
 function game(notice=null){
  root.classList.add("jdc-playing");
  stop();const targets=roundTargets(current),t=targets[0],st=jdcStats(current),draft=current.draft||[],double=t.phase===1;
  const lastRound=current.darts.length?roundHistory(current).at(-1):null;
  const label=double?targets.map(x=>x.number===25?'BULL':`D${x.number}`).join(' → '):String(t.number);
  root.innerHTML=`${scoreboard()}<div class="game-title jdc-title"><div><div class="eyebrow">JDC · ${esc(current.name)} · ETAP ${t.phase+1}/3</div><h1>Celuj w <span class="training-target">${label}</span></h1><p>${double?'Po jednej lotce na każde pole':'Shanghai · '+targets.length+' lotki do zatwierdzenia'}</p></div><div class="jdc-counters"><strong class="jdc-score">${st.score}<small>zdobyte punkty</small></strong><strong>${maximumPossible(current)}<small>maksymalny możliwy wynik końcowy</small></strong></div></div>
  ${notice?`<aside class="jdc-celebration ${notice.shanghai?'shanghai':''}" role="status"><strong>${notice.shanghai?'SHANGHAI! +100':`KOLEJKA ${esc(notice.playerName||current.name)}: ${notice.score} PKT`}</strong><span>${notice.shanghai?`Wynik kolejki: ${notice.score} pkt · Brawo, ${esc(notice.playerName||current.name)}!`:''}${notice.advance?` Nowy poziom: ${esc(notice.grade)}!`:''}</span></aside>`:'<aside class="jdc-celebration jdc-ready" aria-hidden="true"></aside>'}

  <section class="panel"><div class="keypad-head"><h2>${double?'Zaznacz trafione cele':'Zaznacz trafienia kolejki'}</h2><button id="jdc-repeat">🔊 Powtórz cel</button></div>
  <div class="jdc-quick-hits">${double?targets.map((goal,i)=>`<button data-double="${i}" aria-pressed="${draft[i]?.number===goal.number&&draft[i]?.multiplier===2}" class="${draft[i]?.number===goal.number&&draft[i]?.multiplier===2?'selected':''}"><span>LOTKA ${i+1}</span><strong>${goal.number===25?'BULL':'D'+goal.number}</strong><small>${draft[i]?.number===goal.number&&draft[i]?.multiplier===2?'✓ TRAFIONA':'Kliknij, jeśli trafiona'} · ${goal.number===25?100:50} pkt</small></button>`).join(''):[1,2,3].map(m=>`<button class="${draft.some(d=>d?.number===t.number&&d.multiplier===m)?'selected':''}" data-shanghai="${m}" ${targets.every((_,i)=>draft[i])?'disabled':''}><span>${({1:'POJEDYNCZA',2:'PODWÓJNA',3:'POTRÓJNA'})[m]}</span><strong>${t.number}</strong><small>${'●'.repeat(draft.filter(d=>d?.number===t.number&&d.multiplier===m).length)}${'○'.repeat(3-draft.filter(d=>d?.number===t.number&&d.multiplier===m).length)}</small></button>`).join('')}</div>
  <div class="jdc-draft">${targets.map((goal,i)=>`<button data-miss-slot="${i}" aria-pressed="${draft[i]?.unknownMiss===true}" class="${draft[i]?.unknownMiss?'miss-selected':draft[i]?'filled':''}"><span>Lotka ${i+1}</span><strong>${draft[i]?.unknownMiss?'✓ Pudło':draft[i]?dartLabel(draft[i])+' · zaznacz pudło':'□ Pudło'}</strong></button>`).join('')}</div>
  <p class="jdc-help">Zaznacz trzy lotki i zatwierdź. Puste miejsca liczymy jako nietrafiony cel.</p>

  <div class="training-actions jdc-controls"><button id="jdc-miss">Żadna nie trafiła celu — zapisz 0 pkt</button><button id="jdc-confirm" class="primary">Zatwierdź kolejkę →</button><button id="jdc-clear">Wyczyść zaznaczenia</button><button id="jdc-undo" ${(pair()?previousPlayer(pair()):current.darts.length)?'':'disabled'}>Cofnij zapisaną kolejkę</button><button id="jdc-save">Zapisz i wróć</button></div><p>${current.darts.length}/57 zatwierdzonych lotek. Zaznaczenia również zapisują się na tym urządzeniu.</p>  <details id="jdc-other"><summary>Wpisz dokładne pole nietrafionej lotki (opcjonalnie)</summary><label>Lotka <select id="jdc-slot">${targets.map((_,i)=>`<option value="${i}">${i+1}</option>`).join('')}</select></label><label>Pole <select id="jdc-number"><option value="0">Poza tarczą</option>${Array.from({length:20},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}<option value="25">BULL</option></select></label><label>Mnożnik <select id="jdc-multiple"><option value="1">Pojedyncza</option><option value="2">Podwójna</option><option value="3">Potrójna</option></select></label><button id="jdc-exact">Dodaj do kolejki</button></details><label class="switch"><input id="jdc-coach" type="checkbox" ${current.coachEnabled?'checked':''}> Wirtualny trener — chcę wskazówki</label>${rulesPanel({mode:'jdc'})}</section><details class="jdc-extra"><summary>Szczegóły: poziomy i historia</summary>  ${levelPanel(st.score)}
  ${lastRound?`<details class="panel"><summary class="jdc-last-round"><span>Ostatnia zapisana kolejka: ${lastRound.hits.join(' · ')} — ${lastRound.score} pkt · pokaż historię</span><span class="jdc-dart-icons">${lastRound.hits.map(hit=>`<span class="jdc-dart-icon" title="${esc(hit)}"><svg viewBox="0 0 80 100" aria-hidden="true"><path d="M40 92V65" stroke="currentColor" stroke-width="3"/><path d="M34 65V39H46V65L40 72Z" fill="currentColor"/><path d="M34 45H46M34 51H46M34 57H46" stroke="#07162c" stroke-width="2"/><path d="M40 39V22" stroke="currentColor" stroke-width="4"/><path d="M40 5L17 12L20 32L40 23L60 32L63 12Z" fill="currentColor"/><path d="M40 6V23" stroke="#07162c" stroke-width="2"/></svg><b>${hit.startsWith('Nie trafiono')?'Pudło':esc(hit)}</b></span>`).join('')}</span></summary>${historyPanel(current)}</details>`:''}</details>`;
  function setDraft(value){store({...current,draft:value});game();}
  root.querySelectorAll('[data-shanghai]').forEach(b=>b.onclick=()=>safe(()=>{const i=targets.findIndex((_,k)=>!draft[k]);if(i<0)return;const next=targets.map((_,k)=>draft[k]??null);next[i]={number:t.number,multiplier:Number(b.dataset.shanghai)};setDraft(next);}));
  root.querySelectorAll('[data-double]').forEach(b=>b.onclick=()=>safe(()=>{const i=Number(b.dataset.double),goal=targets[i],next=Array.from({length:targets.length},(_,k)=>draft[k]??null);next[i]=draft[i]?.number===goal.number&&draft[i]?.multiplier===2?null:{number:goal.number,multiplier:2};setDraft(next);}));
  $('#jdc-exact').onclick=()=>safe(()=>{const i=Number($('#jdc-slot').value),n=Number($('#jdc-number').value),m=Number($('#jdc-multiple').value);if(!validDart({number:n,multiplier:m}))throw new Error('Nieprawidłowe pole lub mnożnik.');const next=Array.from({length:Math.max(draft.length,i+1)},(_,k)=>draft[k]??null);next[i]={number:n,multiplier:m};setDraft(next);});
  root.querySelectorAll('[data-miss-slot]').forEach(b=>b.onclick=()=>safe(()=>{const i=Number(b.dataset.missSlot),next=targets.map((_,k)=>draft[k]??null);next[i]=draft[i]?.unknownMiss?null:{number:0,multiplier:1,unknownMiss:true};setDraft(next);}));
  $('#jdc-clear').onclick=()=>safe(()=>setDraft([]));
  $('#jdc-repeat').onclick=()=>{if(!soundEnabled()){toast('Włącz dźwięk u góry ekranu.');return;}playSound('turn');speakTraining(roundPrompt(current));};
  function submitRound(entries){safe(()=>{const before=current,next=commitRound(current,entries.map(d=>d?.unknownMiss?null:d));store(next);const notice=roundFeedback(before,current),ps=pair(),following=ps?nextPlayer(ps):null;const completed=current;
   if(following){current=following;game({...notice,playerName:completed.name});}
   else current.endedAt===null?game(notice):result(notice);
   playSound(notice.shanghai?'shanghai':notice.advance||completed.endedAt!==null?'win':'turn');
   speakTraining(ps?(completed.name+'. '+(notice.shanghai?'Shanghai! Sto punktów bonusu! ':'')+'Wynik kolejki: '+notice.score+' punktów. '+(following?'Teraz '+following.name+'. '+roundPrompt(following):duelResult(ps).tie?'Koniec pojedynku. Remis!':'Wygrywa '+duelResult(ps).winner.name+'!')):notice.text,notice.shanghai||notice.advance);
  });}
  $('#jdc-confirm').onclick=()=>submitRound(targets.map((_,i)=>draft[i]??null));
  $('#jdc-miss').onclick=()=>submitRound(targets.map(()=>null));
  $('#jdc-undo').onclick=()=>safe(()=>{const ps=pair();if(ps){const previous=previousPlayer(ps);if(!previous)return;current=previous;}const count=current.darts.length%3||3;store({...current,draft:[],darts:current.darts.slice(0,-count),endedAt:null});game();speakTraining('Cofnięto kolejkę. '+current.name+'. '+roundPrompt(current));});
  $('#jdc-save').onclick=home;
  $('#jdc-coach').onchange=e=>safe(()=>{store({...current,coachEnabled:e.target.checked});game();});
 }
 function result(notice=null){
  root.classList.remove("jdc-playing");
  stop();const st=jdcStats(current);let progress;try{progress=jdcProgress(current,loadJdc());}catch(e){toast(e.message);progress={count:0};}
  root.innerHTML=`${scoreboard()}<section class="panel training-result"><div class="eyebrow">JDC ZAKOŃCZONE · ${esc(current.name)}</div><h1>${st.score} pkt</h1><p>Poziom wyniku: <strong>${st.grade}</strong> · 57/57 lotek</p><p class="small">Poziom tej próby, nie oficjalny awans w akademii JDC.</p>${levelPanel(st.score)}${notice?.shanghai?'<aside class="jdc-celebration shanghai" role="status"><strong>SHANGHAI! +100</strong></aside>':''}<div class="jdc-phases">${st.phases.map((p,i)=>`<div><h2>${p.name}</h2><strong>${p.score} pkt</strong><p>${p.hits}/${p.throws} trafień celu${i===1?'':` · ${p.shanghais} Shanghai`}</p></div>`).join('')}</div>
  <p>${progress.count?`Poprzednia próba: ${progress.last} pkt · zmiana: ${st.score-progress.last>0?'+':''}${st.score-progress.last} pkt. Wcześniejszy rekord: ${progress.best} pkt. Średnia poprzednich pełnych prób: ${progress.average} pkt (${progress.count} prób).`:'Pierwsza pełna próba na tym profilu — Twój punkt odniesienia.'}</p>
  ${historyPanel(current)}
  <div class="jdc-comparison"><h2>Ta próba na tle wcześniejszych wyników</h2><table><thead><tr><th>Część</th><th>Teraz</th><th>Średnia wcześniej</th><th>Zmiana pkt</th><th>Zmiana %</th></tr></thead><tbody>${comparisonRows(current,loadJdc()).map(r=>`<tr><th>${r.name}</th><td>${r.value}</td><td>${r.mean??'—'} (${r.count} prób)</td><td>${r.delta===null?'—':r.delta>0?'+'+r.delta:r.delta}</td><td>${r.percent!==null?(r.percent>0?'+':'')+r.percent+'%':r.mean===0&&r.value>0?'Pierwsze punkty':'—'}</td></tr>`).join('')}</tbody></table><p>Pełne próby tego profilu zakończone przed rozpoczęciem obecnej. Jedna próba nie określa całej formy.</p></div>
  <label class="switch"><input id="jdc-result-coach" type="checkbox" ${current.coachEnabled?'checked':''}> Wirtualny trener — chcę analizę</label>${current.coachEnabled?'<div class="training-ai"><button id="jdc-ai">Poproś trenera AI o analizę</button><p class="small">Do OpenAI wyślemy statystyki Twoich treningów i zakończonych meczów, bez imienia. Wymaga skonfigurowanej usługi AI.</p><div id="jdc-ai-response" role="status"></div></div>':''}
  <div class="training-actions"><button id="jdc-home" class="primary">Wróć do JDC</button>${current.matchId?'':'<button id="jdc-correct">↶ Popraw ostatnią lotkę</button>'}</div></section>`;
  root.querySelectorAll('[data-duel-result]').forEach(b=>b.onclick=()=>safe(()=>{current=pair().find(p=>p.id===b.dataset.duelResult);result();}));
  $('#jdc-home').onclick=home;if($('#jdc-correct'))$('#jdc-correct').onclick=()=>safe(()=>{store(undoJdc(current));game();speakTraining('Cofnięto ostatnią lotkę. '+roundPrompt(current));});
  $('#jdc-result-coach').onchange=e=>safe(()=>{store({...current,coachEnabled:e.target.checked});result();});
  if($('#jdc-ai'))$('#jdc-ai').onclick=async()=>{
   if(request)return;const controller=new AbortController();request=controller;$('#jdc-ai').disabled=true;$('#jdc-ai-response').textContent='Trener analizuje wyniki…';
   try{const report=await requestCoach(current,controller.signal);if(disposed||controller.signal.aborted)return;const a=report.advice;$('#jdc-ai-response').innerHTML=`<p>${esc(a.summary)}</p><p><strong>${esc(a.focus)}</strong></p><p>${esc(a.tip)}</p><p class="small">${esc(a.reason)}</p><p class="small">Podstawa: ${report.evidence.jdcSessions??0} pełnych prób JDC, ${report.evidence.trainingThrows} lotek ćwiczenia sektora 20 i ${report.evidence.completedMatches} zakończonych meczów.</p>`;safe(()=>saveCoachReport(current.profileId,current.id,report));}
   catch(e){if(!disposed&&!controller.signal.aborted)$('#jdc-ai-response').textContent=e.message;}
   finally{if(request===controller){request=null;if($('#jdc-ai'))$('#jdc-ai').disabled=false;}}
  };
 }
 home();return ()=>{root.classList.remove('jdc-playing');stopSpeech();disposed=true;stop();};
}
