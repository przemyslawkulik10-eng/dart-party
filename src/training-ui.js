import {trainingProfile} from './training-profile.js';
import {remainingDarts} from './dart-progress.js';
import {trainingSummaryMarkup} from './training-summary.js';
import {updateActivity} from './app-update.js';
import {speakTraining,stopSpeech,playSound,soundEnabled} from './sound.js';
import {sectorPrompt,sectorResult} from './training-audio.js';
import {rulesPanel} from './game-rules.js';
import {mountJdc} from './jdc-ui.js';
import {ensureProfiles,loadProfiles} from './profiles.js';
import {requestCoach,saveCoachReport} from './coach-client.js';
import {TRAINING_TARGETS,trainingTargetLabel,createTraining,remainingTime,pauseTraining,resumeTraining,finishTraining,recordTrainingDart,trainingStats,trainingAdvice,loadTrainings,saveTraining} from './training.js';
import {dartLabel} from './engine.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const coachChoice=checked=>`<div class="training-coach"><label class="switch"><input id="training-coach" type="checkbox" ${checked?'checked':''}> Wirtualny trener — chcę wskazówki</label><p class="small">Bez zaznaczenia ćwiczysz samodzielnie. Możesz zmienić wybór w trakcie sesji.</p><p class="small muted">Podstawowe wskazówki są dostępne od razu. Analizę AI uruchamiasz osobnym przyciskiem; wymaga połączenia z usługą.</p></div>`;
const clock=ms=>`${Math.floor(Math.ceil(ms/1000)/60)}:${String(Math.ceil(ms/1000)%60).padStart(2,'0')}`;
export function mountTraining(root,{onExit,toast,names=[],initialName='',initialExercise=null,initialProfile=null}){
 const getProfile=trainingProfile(initialProfile);
 let current=null,timer=null,disposed=false,coachRequest=null,coachReport=null,jdcCleanup=null;
 const $=s=>root.querySelector(s);
 function stop(){clearInterval(timer);timer=null;if(coachRequest){coachRequest.abort();coachRequest=null;}}
 function safely(fn){try{fn();}catch(e){toast(e.message);}}
 function store(next){getProfile();saveTraining(next);current=next;}
 function home(){
  stopSpeech();jdcCleanup?.();jdcCleanup=null;stop();document.body.dataset.view='training';root.classList.remove('cricket-game','x01-game');
  let sessions,profiles,player;
  try{player=getProfile();sessions=loadTrainings().filter(s=>!player||s.profileId===player.id);profiles=loadProfiles();}catch(e){root.innerHTML='<section class="panel"><h1>Nie można odczytać treningów</h1><p>Istniejący zapis pozostaje zachowany.</p><button id="training-back">Wróć</button></section>';$('#training-back').onclick=onExit;toast(e.message);return;}
  const active=sessions.filter(s=>s.endedAt===null);
  root.innerHTML=`<section class="hero"><div><div class="eyebrow">TRENING · TWÓJ ROZWÓJ</div><h1>Przygotuj się do sparingu.</h1><p>Pełna próba JDC lub krótkie ćwiczenie celności. Wybierz swój trening.</p></div><button id="training-back">Wróć</button></section>
  <section class="panel jdc-entry"><div><div class="eyebrow">GŁÓWNY SPRAWDZIAN POSTĘPÓW</div><h2>JDC Challenge</h2><p>57 lotek · Shanghai, podwójne i BULL. Wynik, rekord i historia każdego etapu.</p></div><button id="open-jdc" class="primary">Trenuj JDC →</button></section>
  ${active.map(s=>`<div class="resume-banner"><div><strong>${esc(s.name)} · rozpoczęty trening</strong><p>${s.darts.length} lotek · ${clock(remainingTime(s))} do końca</p></div><button data-resume-training="${esc(s.id)}">Wznów trening</button></div>`).join('')}
  <section class="panel"><div class="eyebrow">TRENING JEDNEGO CELU</div><h2>Wybierz cel. Rzuć trzy lotki.</h2><p>Dla pól 15–20 trafienie pojedyncze, podwójne i potrójne liczy się jako jeden celny rzut. W treningu środka wybierasz 25 lub 50 — obie części BULL liczą się jako trafienie celu. Wpisuj każdą lotkę: trafienie celu albo „Poza celem”. Nie liczymy punktów.</p>
  ${coachChoice(false)}<div class="training-form">${player?`<div><span>Trenujesz jako</span><strong>${esc(player.name)}</strong><p class="small">Wynik zapisze się na Twoim profilu.</p></div>`:'<label>Twoje imię<input id="training-name" maxlength="24" list="training-names" placeholder="Np. Przemek"></label>'}<datalist id="training-names">${[...new Set([...names,...profiles.map(p=>p.name),...sessions.map(s=>s.name)])].map(n=>`<option value="${esc(n)}"></option>`).join('')}</datalist><label>Cel treningu<select id="training-target">${TRAINING_TARGETS.map(n=>`<option value="${n}">${n===25?'BULL — 25 / 50':n}</option>`).join('')}</select></label><label>Czas sesji<select id="training-duration"><option value="5">5 minut</option><option value="10">10 minut</option><option value="15" selected>15 minut</option></select></label><button id="training-start" class="primary">Znam cel — zaczynam →</button></div><p class="small">Możesz zrobić pauzę lub skończyć wcześniej. Treningi zapisują się na tym urządzeniu, osobno od meczów.</p></section>
  <section class="panel training-history"><h2>Ostatnie treningi</h2>${sessions.filter(s=>s.endedAt!==null).slice(0,12).map(s=>{const st=trainingStats(s);return `<div class="saved-match"><div><strong>${esc(s.name)} · ${st.accuracy??'—'}${st.accuracy===null?'':'%'}</strong><p>${st.hits}/${st.throws} trafień · ${trainingTargetLabel(s)} · ${new Date(s.createdAt).toLocaleDateString('pl-PL')}</p></div><button data-result="${esc(s.id)}">Wynik</button></div>`;}).join('')||'<p>Pierwsza sesja będzie początkiem Twojej historii.</p>'}</section>`;
  if($('#training-name'))$('#training-name').value=initialName;
  $('#training-back').onclick=onExit;
  $('#open-jdc').onclick=()=>{stop();jdcCleanup=mountJdc(root,{onExit:home,toast,names,initialName,initialProfile:player});};
  $('#training-start').onclick=()=>safely(()=>{const profile=getProfile()||ensureProfiles([$('#training-name').value.trim()])[0];if(active.some(s=>s.profileId===profile.id))throw new Error('Masz rozpoczęty trening. Wznów go z listy.');store({...createTraining(profile.name,Number($('#training-duration').value),Date.now(),$('#training-coach').checked),profileId:profile.id,inputMode:'target-only',target:Number($('#training-target').value)>=25?25:Number($('#training-target').value)});coachReport=null;game();playSound('turn');speakTraining(sectorPrompt(current));});
  root.querySelectorAll('[data-resume-training]').forEach(b=>b.onclick=()=>safely(()=>{coachReport=null;current=sessions.find(s=>s.id===b.dataset.resumeTraining);if(!remainingTime(current)){store(finishTraining(current));result(true);}else {store(resumeTraining(current));game();playSound('turn');speakTraining(sectorPrompt(current));}}));
  root.querySelectorAll('[data-result]').forEach(b=>b.onclick=()=>{current=sessions.find(s=>s.id===b.dataset.result);result();});
 }
 function renderAdvice(report){const a=report.advice;return `<div class="training-coach-advice"><strong>Trener AI · analiza z ${new Date(report.createdAt).toLocaleTimeString('pl-PL')}</strong><p>${esc(a.summary)}</p><p><strong>Cel: </strong>${esc(a.focus)}</p><p>${esc(a.tip)}</p><p class="small">${esc(a.reason)}</p><p class="small">Podstawa: ${report.evidence.trainingThrows} lotek treningowych i ${report.evidence.completedMatches} zakończonych meczów oraz ${report.evidence.jdcSessions??0} pełnych prób JDC.</p></div>`;}
 async function askCoach(){
  if(coachRequest)return;const controller=new AbortController();coachRequest=controller;const id=current.id;
  $('#ask-coach').disabled=true;$('#coach-response').textContent='Trener analizuje Twoje wyniki…';
  try{const report=await requestCoach(current,controller.signal);if(disposed||controller.signal.aborted||current.id!==id||!current.coachEnabled)return;coachReport=report;$('#coach-response').innerHTML=renderAdvice(report);safely(()=>saveCoachReport(current.profileId,current.id,report));}
  catch(e){if(!controller.signal.aborted && !disposed && $('#coach-response'))$('#coach-response').textContent=e.message;}
  finally{if(coachRequest===controller)coachRequest=null;if(!disposed && $('#ask-coach'))$('#ask-coach').disabled=false;}
 }
 function game(){
  updateActivity(current.id,true);
  stop();const stats=trainingStats(current),paused=current.runningSince===null;
  const count=current.darts.length,complete=count>0&&count%3===0,awaitingNext=complete&&current.nextRoundAt!==count;
  const offset=complete&&!awaitingNext?count:Math.floor(Math.max(0,count-1)/3)*3;
  const turn=current.darts.slice(offset);
  const label=d=>d.unknownMiss?'Poza celem':d.number>=15&&d.number<=20?`${d.multiplier}×${d.number}`:dartLabel(d);
  root.innerHTML=`<div class="game-title"><div><div class="eyebrow">TRENING · ${esc(current.name)}</div><h1>Celuj w <span class="training-target">${trainingTargetLabel(current)}</span></h1><p>${current.target===25?'Traf w środek: wybierz 25 lub 50. Obie części liczą się jako trafienie celu.':'Pojedyncze, podwójne lub potrójne '+current.target+' = po jednym trafieniu celu.'}</p></div><strong id="training-clock" class="training-clock" aria-label="Pozostały czas">${clock(remainingTime(current))}</strong></div>
  <div class="training-stats"><span>W celu: <strong>${stats.hits}</strong> · wpisane lotki: <strong>${stats.throws}</strong></span><span><strong>${stats.accuracy??'—'}${stats.accuracy===null?'':'%'}</strong> celności</span><span>${paused?'PAUZA':'SESJA TRWA'}</span></div>
  <section class="panel sector-entry">${remainingDarts({turn,ready:awaitingNext})}
  <div class="darts">${[0,1,2].map(i=>{const d=turn[i];return `<div class="dart-slot ${d?'filled':''}"><small>LOTKA ${i+1}</small><strong>${d?label(d):'—'}</strong></div>`;}).join('')}</div>
  ${awaitingNext?'<div class="training-round-ready" role="status"><h2>✓ Kolejka zapisana</h2><p>Te trzy lotki są zapisane. Zabierz je z tarczy. Gdy będziesz gotowy, naciśnij „Jeszcze raz”.</p><button id="training-next-round" class="primary">Jeszcze raz →</button></div>':'<p>Rzuć trzy lotki i wpisz wynik każdej. Wpisujesz lotkę '+(turn.length+1)+' z 3.</p>'}
  <div ${awaitingNext?'hidden':''}>
  <div class="keypad-head"><h2>Ta lotka trafiła w…</h2><button id="training-repeat">🔊 Przypomnij cel</button></div><div class="sector-buttons ${current.target===25?'bull-target':''}">${(current.target===25?(current.targetMultiplier?[current.targetMultiplier]:[1,2]):[1,2,3]).map(m=>`<button data-sector-hit="${m}" ${paused?'disabled':''}><strong>${current.target===25?(m===2?'BULL 50':'25'):m+'×'+current.target}</strong><span>${current.target===25?'Trafienie celu':['','Pojedyncza','Podwójna','Potrójna'][m]}</span></button>`).join('')}<button data-sector-miss ${paused?'disabled':''}><strong>Poza celem</strong><span>Inne pole lub poza tarczą</span></button></div>
  </div>${coachChoice(current.coachEnabled)}${current.coachEnabled?`<aside class="training-coach-advice" aria-label="Wskazówka trenera" role="status">${esc(trainingAdvice(current))}</aside><div class="training-ai"><button id="ask-coach">Poproś trenera AI o analizę</button><p class="small">Do OpenAI wyślemy statystyki Twoich treningów i zakończonych meczów, bez imienia. Gra działa również bez AI.</p><div id="coach-response" role="status">${coachReport?renderAdvice(coachReport):''}</div></div>`:''}<p class="training-last" role="status">${current.darts.length?`Ostatnia lotka: ${label(current.darts.at(-1))}`:'Wpisz pierwszą lotkę.'}</p><div class="training-actions"><button id="training-undo" ${current.darts.length?'':'disabled'}>↶ Cofnij rzut</button><button id="training-pause">${paused?'Wznów':'Pauza'}</button><button id="training-finish">Zakończ trening</button><button id="training-home">Zapisz i wróć</button></div><p class="small">Liczymy trafienia wybranego celu. „Poza celem” nie określa faktycznie trafionego pola.</p></section>`;
  if($('#training-next-round'))$('#training-next-round').onclick=()=>safely(()=>{store({...current,nextRoundAt:count});game();});
  $('#training-repeat').onclick=()=>{if(!soundEnabled()){toast('Włącz dźwięk przyciskiem u góry ekranu.');return;}playSound('turn');speakTraining(paused?'Trening wstrzymany. Wznów, kiedy będziesz gotowy.':sectorPrompt(current));};
  $('#training-coach').onchange=e=>safely(()=>{store({...current,coachEnabled:e.target.checked});if(!e.target.checked)coachReport=null;game();});
  if($('#ask-coach'))$('#ask-coach').onclick=askCoach;
  function hit(n,m,unknownMiss=false){if(awaitingNext)return;safely(()=>{if(!remainingTime(current)){store(finishTraining(current));result(true);return;}const next=recordTrainingDart(current,n,m);if(unknownMiss)next.darts[next.darts.length-1].unknownMiss=true;store(next);stopSpeech();game();playSound('hit');});}
  root.querySelectorAll('[data-sector-hit]').forEach(b=>b.onclick=()=>hit(current.target,Number(b.dataset.sectorHit)));
  $('[data-sector-miss]').onclick=()=>hit(0,1,true);
  $('#training-undo').onclick=()=>safely(()=>{store({...current,nextRoundAt:null,darts:current.darts.slice(0,-1)});game();speakTraining('Cofnięto ostatnią lotkę. '+(paused?'Trening wstrzymany.':sectorPrompt(current)));});
  $('#training-pause').onclick=()=>safely(()=>{store(paused?resumeTraining(current):pauseTraining(current));game();speakTraining(paused?sectorPrompt(current):'Pauza. Trening wstrzymany.');});
  $('#training-finish').onclick=()=>safely(()=>{store(finishTraining(current));result(true);});
  $('#training-home').onclick=()=>safely(()=>{store(pauseTraining(current));home();});
  if(!paused)timer=setInterval(()=>{if(disposed)return;const left=remainingTime(current);$('#training-clock').textContent=clock(left);if(!left){stop();safely(()=>{store(finishTraining(current));result(true);});}},500);
 }
 function result(announce=false){
  updateActivity(current.id,false);
  stop();if(announce){playSound('win');speakTraining(sectorResult(current));}const st=trainingStats(current);
  root.innerHTML=`<section class="panel training-result"><div class="eyebrow">TRENING ZAKOŃCZONY · ${esc(current.name)}</div><h1>Twój trening zapisany.</h1><p>Cel: ${trainingTargetLabel(current)} · czas aktywny ${clock(current.durationMs-current.remainingMs)}</p><div class="training-stats"><span>W celu: <strong>${st.hits}</strong> · wpisane lotki: <strong>${st.throws}</strong></span><span><strong>${st.accuracy??'—'}${st.accuracy===null?'':'%'}</strong> celności</span></div><p>${st.throws?'Wynik zapisany. Kolejna sesja pozwoli porównać celność.':'Sesja zapisana bez rzutów. Nie wyliczamy z niej celności.'}</p>${trainingSummaryMarkup(current)}<div class="training-actions"><button id="training-home" class="primary">Wybierz kolejny trening</button><button id="training-exit">Na dziś kończę</button></div></section>`;
  $('#training-home').onclick=home;$('#training-exit').onclick=onExit;
 }
 home();
 if(initialExercise==='jdc' && $('#open-jdc'))$('#open-jdc').click();
 return ()=>{stopSpeech();disposed=true;jdcCleanup?.();stop();if(current && current.endedAt===null && current.runningSince!==null)safely(()=>store(pauseTraining(current)));};
}
