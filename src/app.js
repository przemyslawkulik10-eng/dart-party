import { mountTraining } from './training-ui.js';
import { CHECKOUT_HINT_THRESHOLD, checkout, checkoutLabel, checkoutAdvice } from './checkout.js';
import { playSound, soundEnabled, toggleSound, speakPlayer, speakTurn, speakShanghai, speakThreeTriples, speakCheckout } from './sound.js';
import { bullState } from './bull-off.js';
import { DEFAULT_PLAYERS, TARGETS, createMatch, replay, recordDart, nextPlayer, undoDart, dartLabel, validateMatch, isShanghai, isThreeTriples, nextLeg } from './engine.js';
import { loadMatches, saveMatch } from './storage.js';
import { syncCloud, onCloudStatus, cloudEnabled } from './cloud.js';
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let names = [...DEFAULT_PLAYERS];
let mode = '501';
let doubleOut = false;
let cricketScoring='cutthroat';
let cricketOpening='two-triples';
let legsToWin=1;
const cricketName=m=>m.cricketScoring==='cutthroat'?'Cricket · punkty przeciwnikom':'Cricket + dla siebie';
let section=null;
let disposeTraining=null;
function leaveTraining(){if(disposeTraining){disposeTraining();disposeTraining=null;}}
const competition=()=> (contest||match)?.sessionType==='competition';
let match = null;
let contest = null;
const contestKey = 'dart-party-bull-off';
let multiplier = 1;
let storageError = false;
let toastTimer;
let syncingTimer;
const modal = $('#modal');
function toast(text) { $('#toast').textContent = text; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 4000); }
function allMatches() { try { return loadMatches(); } catch { storageError = true; return []; } }
function persist(next) {
  try { saveMatch(next); storageError = false; $('#save-status').textContent = 'Zapisano na tablecie'; }
  catch { storageError = true; $('#save-status').textContent = 'Błąd zapisu — pobierz kopię'; toast('Brak zapisu na tablecie. Pobierz kopię meczu w „Zapisane mecze”.'); }
  if (!storageError) { clearTimeout(syncingTimer); syncingTimer = setTimeout(syncCloud, 500); }
}
function update(next) {
  const before=match?replay(match):null, after=replay(next);
  const sameTurn=match?.id===next.id && before && before.current===after.current && before.round===after.round && before.leg===after.leg;
  if(!sameTurn)multiplier=1;
  match=next;persist(match);renderGame();
}
function openModal(title, content) { $('#modal-content').innerHTML = `<div class="modal-heading"><h2>${title}</h2><button data-close aria-label="Zamknij">×</button></div>${content}`; if (!modal.open) modal.showModal(); $('[data-close]').onclick = () => modal.close(); }
function readNames() { names = [...document.querySelectorAll('[data-player-name]')].map(el => el.value); }
function renderHome(){
  leaveTraining();section=null;match=null;contest=null;if($('#sound-toggle'))renderSoundButton();document.body.dataset.view='home';
  $('#app').classList.remove('cricket-game','x01-game');
  const latest=allMatches().find(m=>replay(m).winner===null);
  $('#app').innerHTML=`<section class="hero"><div><div class="eyebrow">TWÓJ TRENING. WASZA RYWALIZACJA.</div><h1>Każdy rzut<br><em>ma znaczenie.</em></h1><p>W tygodniu pracujesz nad celnością. W weekend sprawdzacie się przy tarczy.</p></div></section><div class="entry-modes"><button id="enter-training" class="entry-mode"><span class="eyebrow">TWÓJ CZAS PRZY TARCZY</span><strong>Trening</strong><span>Jeden cel na początek. Krótka sesja i zapis Twoich trafień.</span><b>Zacznij od pierwszego ćwiczenia →</b></button><button id="enter-competition" class="entry-mode"><span class="eyebrow">WSPÓLNY SPARING</span><strong>Zawody</strong><span>Wyniki i kolejność graczy. Bez podpowiedzi i komentarzy.</span><b>Zbierz ekipę →</b></button></div>${latest?`<div class="resume-banner"><div><strong>Wasz mecz czeka</strong><p>${esc(latest.names.join(' · '))} · ${latest.mode==='cricket'?'Cricket':latest.mode}</p></div><button id="resume-home">Wznów mecz</button></div>`:''}`;
  $('#enter-competition').onclick=()=>{section='competition';match=null;contest=null;saveContest();renderSetup();};
  $('#enter-training').onclick=()=>{section='training';match=null;contest=null;saveContest();window.speechSynthesis?.cancel();disposeTraining=mountTraining($('#app'),{onExit:renderHome,toast,names});};
  if($('#resume-home'))$('#resume-home').onclick=()=>{match=latest;contest=null;multiplier=1;renderGame();};
}
function renderSetup() {
  leaveTraining();
  if(section!=='competition')return renderHome();
  $('#app').classList.remove('cricket-game','x01-game');
  document.body.dataset.view = "setup";
  const latest = allMatches().find(m => replay(m).winner === null);
  $('#app').innerHTML = `${latest ? `<div class="resume-banner"><div><strong>Wasz mecz czeka.</strong><p>${latest.mode === 'cricket' ? cricketName(latest) : latest.mode} · ${latest.names.length} graczy · runda ${replay(latest).round}</p></div><button class="primary" id="resume">Wznów mecz ↗</button></div>` : ''}
    <section class="hero"><div><div class="eyebrow">ZAWODY · BEZ PODPOWIEDZI</div><h1>Dobra ekipa.<br><em>Celny wieczór.</em></h1><p>Wybierzcie grę, ustawcie skład. Liczymy wyniki. Trener i komentarze pozostają wyłączone.</p></div><div class="hero-badge"><strong>3</strong><span>lotki w dłoni.<br>Cała gra przed Wami.</span></div></section>
    <div class="setup-grid"><section class="panel"><div class="section-heading"><div><div class="step">01 / WYBIERZ GRĘ</div><h2>W co dziś gramy?</h2></div><span class="pill">4 TRYBY</span></div><div class="mode-grid">${['501','301','201','cricket'].map(m => `<button class="mode ${mode===m?'selected':''}" data-mode="${m}" aria-pressed="${mode===m}"><strong>${m==='cricket'?'Cricket':m}</strong><span>${({501:'Klasyka dobrego wieczoru',301:'Krótsza droga do zera',201:'Szybka runda na rozgrzewkę',cricket:'Zamykaj pola. Dobijaj rywalom.'})[m]}</span></button>`).join('')}</div><div class="leg-choice"><label for="legs-to-win">Format meczu</label><select id="legs-to-win">${[1,2,3].map(n=>`<option value="${n}" ${legsToWin===n?'selected':''}>${n===1?'Pojedynczy leg':`Do ${n} wygranych legów · bez setów`}</option>`).join('')}</select></div><div class="rules-choice">${mode!=='cricket'?`<label class="switch"><input id="double-out" type="checkbox" ${doubleOut?'checked':''}> Zakończenie Double Out</label><span class="small muted">${doubleOut?'Ostatnia lotka ×2':'Dowolne trafienie'}</span>`:`<div class="cricket-scoring" aria-label="Punktacja Cricket">${[['standard','+ Dla siebie'],['cutthroat','+ Przeciwnikom · najmniej wygrywa']].map(([v,label])=>`<button data-scoring="${v}" class="${cricketScoring===v?'primary':''}" aria-pressed="${cricketScoring===v}">${label}</button>`).join('')}</div>`}</div>${mode==='cricket'?`<label class="switch opening-choice"><input id="cricket-opening" type="checkbox" ${cricketOpening==='two-triples'?'checked':''}> Nasze zasady: 20 po dwóch różnych potrójnych (15–19)</label>`:''}<p class="mode-description">${mode==='cricket'?(cricketScoring==='cutthroat'?'Zamknij pola 15–20 i bull. Nadmiarowe trafienia dopisują punkty każdemu rywalowi z otwartym polem. Wygrywa najniższy wynik przy zamkniętych polach.':'Zamknij pola 15–20 i bull. Nadmiarowe trafienia dodają punkty Tobie, dopóki rywal ma pole otwarte. Wygrywa najwyższy wynik przy zamkniętych polach.'):doubleOut?'Zejdź dokładnie do zera, kończąc podwójnym polem lub bull 50. Przekroczenie wyniku albo pozostawienie 1 cofa całą kolejkę.':'Zejdź dokładnie do zera. Możesz skończyć dowolnym trafieniem. Przekroczenie wyniku cofa punkty całej kolejki.'}</p></section>
    <section class="panel"><div class="section-heading"><div><div class="step">02 / WASZA EKIPA</div><h2>Kto staje przy tarczy?</h2></div><span class="pill">${names.length} / 6 GRACZY</span></div><div class="player-list">${names.map((name,i)=>`<div class="player-edit"><span class="avatar">0${i+1}</span><input data-player-name="${i}" aria-label="Imię gracza ${i+1}" maxlength="24" value="${esc(name)}"><button data-remove="${i}" aria-label="Usuń gracza ${i+1}" ${names.length<=2?'disabled':''}>−</button></div>`).join('')}</div><button id="add-player" class="add-player" ${names.length>=6?'disabled':''}>+ Dodaj gracza</button></section></div>
    <div class="setup-bottom"><p>Jeden tablet przy tarczy. Zapis po każdym rzucie.<br>Możecie wrócić do meczu w dowolnym momencie.</p><button id="start" class="primary start-button">Walka o start <span>↗</span></button></div>`;
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{readNames();mode=b.dataset.mode;legsToWin=mode==='301'?3:1;renderSetup();});
  document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{readNames();names.splice(Number(b.dataset.remove),1);renderSetup();});
  $('#add-player').onclick=()=>{readNames(); if(names.length<6)names.push(''); renderSetup(); [...document.querySelectorAll('[data-player-name]')].at(-1)?.focus();};
  document.querySelectorAll('[data-scoring]').forEach(b=>b.onclick=()=>{readNames();cricketScoring=b.dataset.scoring;renderSetup();});
  $('#legs-to-win').onchange=e=>{readNames();legsToWin=Number(e.target.value);renderSetup();};
  if($('#cricket-opening'))$('#cricket-opening').onchange=e=>{readNames();cricketOpening=e.target.checked?'two-triples':'standard';renderSetup();};
  if($('#double-out'))$('#double-out').onchange=e=>{readNames();doubleOut=e.target.checked;renderSetup();};
  if($('#resume'))$('#resume').onclick=()=>{match=latest;multiplier=1;renderGame();};
  $('#start').onclick=()=>{readNames();try{beginContest(names,mode,doubleOut,cricketScoring,cricketOpening,legsToWin);}catch(e){toast(e.message);}};
}
function saveContest() {
  try { if(contest)localStorage.setItem(contestKey,JSON.stringify(contest));else localStorage.removeItem(contestKey); }
  catch { toast('Nie udało się zapisać walki o start na tablecie.'); }
}
function beginContest(players, gameMode, out, scoring='standard', opening='standard', targetLegs=1, sessionType='competition') {
  const valid=createMatch(players,gameMode,out,scoring,opening,targetLegs);
  contest={sessionType,names:valid.names,mode:valid.mode,doubleOut:valid.doubleOut,cricketScoring:valid.cricketScoring,cricketOpening:valid.cricketOpening,legsToWin:valid.legsToWin,throws:[]};
  match=null;saveContest();renderContest();announcePlayer(contest.names[0]);
}
function renderContest() {
  leaveTraining();
  if($('#sound-toggle'))renderSoundButton();
  $('#app').classList.remove('cricket-game','x01-game');
  document.body.dataset.view='game';
  const s=bullState(contest.names.length,contest.throws), won=s.winner!==null;
  $('#app').innerHTML=`<div class="game-title"><div><div class="eyebrow">NAJPIERW WYŁANIAMY STARTUJĄCEGO</div><h1>Walka o start</h1><p>Każdy rzuca 3 lotki. Liczymy sumę: środek 25 lub 50, pozostałe pola 0.</p></div><button id="cancel-contest">Wróć do ustawień</button></div>
  <section class="scoreboard">${contest.names.map((name,i)=>`<article class="player-card ${i===s.current?'active':''}"><div class="player-name">${esc(name)}</div><div class="player-score">${s.contenders.includes(i)?s.scores[i]??0:'—'}</div><div class="small">${s.contenders.includes(i)?'W GRZE O START':'POZA DOGRYWKĄ'}</div></article>`).join('')}</section>
  <section class="panel bull-panel"><div class="eyebrow">${s.round===1?'PIERWSZA SERIA':`DOGRYWKA ${s.round-1} · TYLKO REMISUJĄCY`}</div><h2>${esc(contest.names[s.current])}${won?' zaczyna mecz!':' rzuca'}</h2>
  ${won?`<p>Kolejność: ${[contest.names[s.winner],...contest.names.filter((_,i)=>i!==s.winner)].map(esc).join(' → ')}</p><button class="primary" id="start-match">Rozpocznij ${contest.mode==='cricket'?'Cricket':contest.mode} →</button>`:`<div class="darts">${[0,1,2].map(i=>`<div class="dart-slot ${s.turn[i]!==undefined?'filled':''}"><small>LOTKA ${i+1}</small><strong>${s.turn[i]??'—'}</strong></div>`).join('')}</div><p>Po trzeciej lotce przechodzimy do kolejnego gracza. Remis oznacza nową serię trzech lotek.</p><div class="special-keys bull-keys"><button data-bull="0">POZA ŚRODKIEM / 0</button><button data-bull="25">BULL 25</button><button data-bull="50">BULL 50</button></div>`}
  <button id="undo-bull" ${contest.throws.length?'':'disabled'}>↶ Cofnij rzut</button></section>`;
  document.querySelectorAll('[data-bull]').forEach(b=>b.onclick=()=>{contest.throws.push(Number(b.dataset.bull));saveContest();renderContest();const next=bullState(contest.names.length,contest.throws);if(next.winner===null && (next.current!==s.current || next.round!==s.round))announcePlayer(contest.names[next.current]);else if(!competition())playSound('hit');});
  $('#undo-bull').onclick=()=>{contest.throws.pop();saveContest();renderContest();};
  $('#cancel-contest').onclick=()=>{names=contest.names;mode=contest.mode;doubleOut=contest.doubleOut;cricketScoring=contest.cricketScoring||'standard';cricketOpening=contest.cricketOpening||'standard';legsToWin=contest.legsToWin||1;contest=null;saveContest();renderSetup();};
  if(won)$('#start-match').onclick=()=>{
    const next=createMatch([contest.names[s.winner],...contest.names.filter((_,i)=>i!==s.winner)],contest.mode,contest.doubleOut,contest.cricketScoring,contest.cricketOpening,contest.legsToWin);
    next.sessionType=contest.sessionType;contest=null;saveContest();update(next);
  };
}
function cricketTable(state) {
  const columns=state.players.length===2?[0,null,1]:[null,...state.players.map((_,i)=>i)];
  const heading=i=>i===null?'<th class="field-col" scope="col">POLE</th>':`<th scope="col" class="${i===state.current?'current-col':''}">${esc(state.players[i].name)}</th>`;
  const cell=(i,n)=>{
    if(i===null)return `<td class="field-col">${n===25?'BULL':n}</td>`;
    const p=state.players[i];
    return `<td class="${i===state.current?'current-col':''} ${p.marks[n]===3?'closed':''}" aria-label="${esc(p.name)}, ${n===25?'bull':n}: ${p.marks[n]} z 3">${['·','╱','╳','⊗'][p.marks[n]]}</td>`;
  };
  return `<div class="cricket-board"><table aria-label="Tablica Cricket"><thead><tr>${columns.map(heading).join('')}</tr></thead><tbody>${TARGETS.map(n=>`<tr>${columns.map(i=>cell(i,n)).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function remainingDarts(state) {
  const count=state.ready?0:3-state.turn.length;
  return `<div class="remaining-darts" role="img" aria-label="Pozostałe lotki: ${count}">${[0,1,2].map(i=>`<svg class="remaining-dart ${i<count?'available':'used'}" viewBox="0 0 100 52" aria-hidden="true"><g transform="rotate(156 50 26)"><path d="M7 26 L29 26" stroke="#cdd8d1" stroke-width="2"/><path d="M29 22 L57 22 L61 26 L57 30 L29 30 Z" fill="#dce4df"/><path d="M34 22v8m5-8v8m5-8v8m5-8v8" stroke="#71877b" stroke-width="2"/><path d="M60 26H80" stroke="#4ff0cf" stroke-width="4"/><path d="M70 25L81 12L94 12L86 26L94 40L81 40L70 27" fill="#44cfff"/><path d="M73 26H91" stroke="#14639c" stroke-width="2"/></g></svg>`).join('')}</div>`;
}
function finishAdvice(state){
  if(competition()||match.mode==='cricket'||state.legWinner!==null||state.ready)return '';
  return checkoutAdvice(state.players[state.current].score,3-state.turn.length,match.doubleOut);
}
function scoreWithCheckout(state){
  const score=state.players[state.current].score,show=!competition()&&!state.ready&&score<=CHECKOUT_HINT_THRESHOLD,left=3-state.turn.length;
  const route=show?checkout(score,left,match.doubleOut):null;
  return `<div class="score-and-checkout ${show?'has-checkout':''}"><div class="score-value"><div class="giant-score">${score}</div><div class="score-caption">punktów do zwycięstwa</div></div>${show?`<aside class="checkout-panel" aria-label="Podpowiedź zakończenia"><div class="checkout-heading">${route?'MOŻESZ SKOŃCZYĆ':'PODPOWIEDŹ ZEJŚCIA'}</div><div class="checkout-rule">${match.doubleOut?'DOUBLE OUT':'ZWYKŁE ZAKOŃCZENIE'} · ${left} ${left===1?'LOTKA':'LOTKI'}</div>${route?`<ol class="checkout-route">${route.map(d=>`<li>${checkoutLabel(d)}</li>`).join('')}</ol>`:`<p class="checkout-unavailable">BRAK ZEJŚCIA W ${left} ${left===1?'LOTCE':'LOTKACH'}</p>`}<button id="speak-checkout" class="subtle">🔊 PODPOWIEDŹ</button><div class="checkout-legend">T = POTRÓJNA<br>D = PODWÓJNA<br>S = POJEDYNCZA</div></aside>`:''}</div>`;
}
function renderGame() {
  leaveTraining();
  if($('#sound-toggle'))renderSoundButton();
  document.body.dataset.view = "game";
  const state = replay(match), player = state.players[state.current], cricket = match.mode==='cricket', won = state.legWinner!==null, blocked = state.ready||won;
  $('#app').classList.toggle('cricket-game',cricket&&!won);
  $('#app').classList.toggle('x01-game',!cricket&&!won);
  const twentyLocked=cricket && match.cricketOpening==='two-triples' && player.openingTriples.length<2;
  const nextName = state.players[(state.current+1)%state.players.length].name;
  $('#app').innerHTML = `<div class="game-title"><div><div class="eyebrow">${competition()?'ZAWODY · BEZ PODPOWIEDZI':'NIECH LECI!'}</div><h1>${cricket?'Cricket':`Gramy <span>${match.mode}</span>`}</h1><div class="game-meta"><span class="pill">${(match.legsToWin||1)>1?`LEG ${state.leg} · DO ${match.legsToWin} WYGRANYCH · `:''}RUNDA ${state.round}</span><span>${state.players.length} graczy · ${cricket?cricketName(match):match.doubleOut?'Double Out':'Zwykłe zakończenie'}</span></div></div><button id="new-game" class="subtle">+ Nowy mecz</button></div>
    ${won?`<section class="victory"><div><div class="eyebrow">${state.winner!==null?'MAMY ZWYCIĘZCĘ MECZU!':'LEG ZAKOŃCZONY!'}</div><h2>${esc(state.players[state.legWinner].name)} wygrywa ${state.winner!==null?'mecz':'leg'}.</h2><p>${cricket?'Wszystkie pola zamknięte. Najlepszy wynik.':'Ostatnia lotka. Dokładnie zero.'} Dobry mecz, ekipo!</p></div><div class="actions">${state.winner!==null?'<button class="primary" id="rematch">Gramy rewanż ↗</button>':'<button class="primary" id="next-leg">Następny leg →</button>'}<button id="undo-win">Cofnij ostatni rzut</button></div></section>`:''}
    <section class="scoreboard" aria-label="Wyniki graczy">${state.players.map((p,i)=>`<article class="player-card ${state.current===i?'active':''}" ${state.current===i?'aria-current="true"':''}><div class="player-name">${esc(p.name)}</div><div class="player-score">${p.score}</div>${(match.legsToWin||1)>1?`<div class="leg-score">LEGI <strong>${state.legWins[i]}</strong> / ${match.legsToWin}</div>`:''}<div class="small muted">${won&&i===state.winner?'ZWYCIĘZCA':i===state.current?'← TERAZ RZUCA':cricket?`${TARGETS.filter(n=>p.marks[n]===3).length}/7 PÓL ZAMKNIĘTYCH`:`ŚR. ${p.darts?(p.scored/p.darts*3).toFixed(1):'—'}`}</div></article>`).join('')}</section>
    ${cricket&&won?cricketTable(state):''}
    ${!won?`<div class="play-grid"><section class="panel current-panel"><div class="turn-header"><div><div class="eyebrow">TERAZ PRZY TARCZY</div><h2>${esc(player.name)}</h2></div><span class="pill">${state.turn.length} / 3 LOTKI</span></div>${cricket?cricketTable(state):scoreWithCheckout(state)}${remainingDarts(state)}${state.bust?'<div class="bust-label">Przekroczony wynik — kolejka za 0</div>':''}<div class="darts">${[0,1,2].map(i=>`<div class="dart-slot ${state.turn[i]?'filled':''}"><small>LOTKA ${i+1}</small><strong>${state.turn[i]?dartLabel(state.turn[i]):'—'}</strong></div>`).join('')}</div><div class="turn-total"><span>${state.ready?'Kolejka zakończona':'Wpisz trafienie na klawiaturze'}</span><strong>${state.turnPoints} ${match.cricketScoring==='cutthroat'?'pkt dopisanych rywalom łącznie':'pkt w kolejce'}</strong></div></section><section class="panel keypad-panel"><div class="keypad-head"><h2>Gdzie trafiła lotka?</h2><div class="multiplier" aria-label="Mnożnik">${[1,2,3].map(m=>`<button data-mult="${m}" aria-label="Mnożnik ${m}" aria-pressed="${m===multiplier}" class="${m===multiplier?'selected':''}" ${blocked?'disabled':''}>×${m}</button>`).join('')}</div></div>${cricket&&match.cricketOpening==='two-triples'?`<p class="opening-status">${twentyLocked?`20 ZABLOKOWANA · ${player.openingTriples.length}/2 różnych potrójnych 15–19. Trafienie 20 wpisz jako 0.`:'20 ODBLOKOWANA ✓'}</p>`:''}<div class="number-grid ${cricket?'cricket-keys':''}">${(cricket?[20,19,18,17,16,15]:Array.from({length:20},(_,i)=>i+1)).map(n=>`<button data-hit="${n}" aria-label="Trafienie ${n}" ${blocked||(n===20&&twentyLocked)?'disabled':''}>${n}</button>`).join('')}</div><div class="special-keys"><button data-special="25" ${blocked?'disabled':''}>BULL 25</button><button data-special="50" ${blocked?'disabled':''}>BULL 50</button><button data-special="0" ${blocked?'disabled':''}>PUDŁO / 0</button></div><div class="action-row"><button id="undo" class="subtle" ${match.events.some(e=>e.type==='dart')?'':'disabled'}>↶ Cofnij rzut</button><button id="next" class="primary next-button" ${state.ready?'':'disabled'}>${state.ready?`${esc(nextName)} →`:'Następny gracz →'}</button></div></section></div>`:''}
    <section class="recent"><h3>Ostatnie kolejki</h3><div class="recent-list">${state.visits.length?state.visits.slice(-6).reverse().map(v=>`<div class="recent-item"><strong>${esc(state.players[v.player].name)}</strong>${v.darts.map(dartLabel).join(' · ')}<b>${v.bust?'BUST':v.points+(match.cricketScoring==='cutthroat'?' pkt rywalom łącznie':' pkt')}</b></div>`).join(''):'<p class="small">Pierwsza kolejka przed Wami. Powodzenia!</p>'}</div></section>`;
  $('.scoreboard').style.setProperty('--players',state.players.length);
  if(cricket&&!won){
    const grid=$('.play-grid');grid.classList.add('cricket-layout');
    if(state.players.length>3)grid.classList.add('many-players');
    const controls=document.createElement('div');controls.className='cricket-controls';
    const scores=$('.scoreboard');scores.classList.add(state.players.length===2?'two-players':'more-players');
    controls.append(scores,$('.keypad-panel'));grid.append(controls);
    const details=document.createElement('section');details.className='cricket-turn-details';
    details.append($('.current-panel .remaining-darts'),$('.current-panel .darts'),$('.current-panel .turn-total'));controls.append(details);
    const board=$('.current-panel .cricket-board');
    board.setAttribute('aria-label','Tabela trafień Cricket — wszyscy gracze');


  }
  $('#new-game').onclick=()=>{ match=null; renderSetup(); };
  if(won){if($('#next-leg'))$('#next-leg').onclick=()=>{update(nextLeg(match));announcePlayer();};if($('#rematch'))$('#rematch').onclick=()=>{beginContest(match.names,match.mode,match.doubleOut,match.cricketScoring,match.cricketOpening,match.legsToWin,match.sessionType);};$('#undo-win').onclick=()=>update(undoDart(match));}
  document.querySelectorAll('[data-mult]').forEach(b=>b.onclick=()=>{multiplier=Number(b.dataset.mult);renderGame();});
  document.querySelectorAll('[data-hit]').forEach(b=>b.onclick=()=>hit(Number(b.dataset.hit),multiplier));
  document.querySelectorAll('[data-special]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.special);hit(n===50?25:n,n===50?2:1);});
  if($('#speak-checkout'))$('#speak-checkout').onclick=()=>speakCheckout(finishAdvice(state));
  if($('#undo'))$('#undo').onclick=()=>update(undoDart(match));
  if($('#next'))$('#next').onclick=()=>{try{update(nextPlayer(match));announcePlayer();}catch(e){toast(e.message);}};
}
function announcePlayer(playerName=match.names[replay(match).current], victory=false, shanghai=null, legOnly=false, triples=false) {
  if(competition()){window.speechSynthesis?.cancel();return;}
  playSound(triples?'maximum':shanghai?'shanghai':victory?'win':'turn');
  const state=!victory && !contest && match && match.mode!=='cricket'?replay(match):null;
  if(triples)speakThreeTriples(playerName,victory,legOnly);else if(shanghai)speakShanghai(playerName,shanghai.number,shanghai.points,shanghai.cutthroat,shanghai.bust,victory,legOnly);else speakPlayer(playerName,victory,state?state.players[state.current].score:null,legOnly,state?finishAdvice(state):'');
  const name=playerName.toLocaleUpperCase('pl-PL');
  const overlay=document.createElement('dialog');
  overlay.className='player-announcement';
  overlay.setAttribute('aria-label',`${victory?'Wygrywa':'Teraz rzuca'} ${name}`);
  overlay.innerHTML=`<button class="announcement-continue" aria-label="${esc(name)} — ${victory?'zwycięzca meczu':'zaczynam rzucać'}"><span class="announcement-label">${triples?'TRZY POTRÓJNE!' :shanghai?'SZANGHAJ!':legOnly?'WYGRYWA LEG!':victory?'WYGRYWA!':'TERAZ RZUCA'}</span><strong class="announcement-name">${esc(name)}</strong><span class="announcement-hint">${triples?`ALE PETARDA! BRAWO!${victory?(legOnly?' · WYGRANY LEG!':' · ZWYCIĘSTWO!'):''}`:shanghai?`POJEDYNCZA · PODWÓJNA · POTRÓJNA ${shanghai.number}${victory?' · WYGRYWA!':''}`:victory?(legOnly?'BRAWO! ZA CHWILĘ NASTĘPNY LEG':'BRAWO! ZA CHWILĘ WYNIK MECZU'):'ZA CHWILĘ TWOJA KOLEJ →'}</span></button>`;
  document.body.append(overlay);
  let dismissTimer;
  overlay.addEventListener('close',()=>{clearTimeout(dismissTimer);window.removeEventListener('resize',fitName);overlay.remove();});
  overlay.querySelector('button').onclick=()=>overlay.close();
  overlay.showModal();
  const title=overlay.querySelector('.announcement-name');
  function fitName() {
  let size=Math.min(window.innerWidth*.24,window.innerHeight*.46);
  title.style.fontSize=`${size}px`;
  while(title.scrollWidth>title.clientWidth && size>24){size-=2;title.style.fontSize=`${size}px`;}
  }
  fitName();window.addEventListener('resize',fitName);
  dismissTimer=setTimeout(()=>{if(overlay.open)overlay.close();},3000);
}
function hit(n,m) {
  try {
    update(recordDart(match,n,m));const state=replay(match);
    if(competition())return;
    const triples=match.mode==='cricket' && isThreeTriples(state.turn);
    const shanghai=isShanghai(state.turn)?{number:state.turn[0].number,points:state.turnPoints,cutthroat:match.cricketScoring==='cutthroat',bust:state.bust}:null;
    if(state.legWinner!==null)announcePlayer(match.names[state.legWinner],true,state.legWinner===state.current?shanghai:null,state.winner===null,triples && state.legWinner===state.current);
    else if(triples)announcePlayer(match.names[state.current],false,null,false,true);
    else if(shanghai)announcePlayer(match.names[state.current],false,shanghai);
    else {playSound('hit');if(state.ready)speakTurn(match.names[state.current],state.turnPoints,state.bust,match.cricketScoring==='cutthroat',finishAdvice(state),match.mode!=='cricket');else if(finishAdvice(state))speakCheckout(finishAdvice(state));}
    if(navigator.vibrate)navigator.vibrate((shanghai||triples)?[100,60,100,60,200]:15);
  }catch(e){toast(e.message);}
}
function exportMatch() {
  const current=match||allMatches()[0]; if(!current){toast('Brak meczu do pobrania.');return;}
  const url=URL.createObjectURL(new Blob([JSON.stringify(current,null,2)],{type:'application/json'}));
  const link=document.createElement('a'); link.href=url;link.download=`dart-party-${current.mode}-${current.id.slice(0,8)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function showHistory() {
  const matches=allMatches();
  openModal('Zapisane mecze',`${storageError?'<p class="error">Nie można odczytać pamięci tabletu. Nie nadpisujemy zapisów.</p>':''}<p class="small muted">Mecze zapisują się automatycznie po każdym rzucie. Kopia pliku pozwala przenieść mecz na inne urządzenie.</p>${matches.length?matches.slice(0,50).map(m=>{const s=replay(m);return `<div class="saved-match"><div><strong>${m.mode==='cricket'?cricketName(m):m.mode} · ${s.winner!==null?'Wygrywa '+esc(m.names[s.winner]):'Runda '+s.round}</strong><p>${esc(m.names.join(' · '))}</p><p>${new Date(m.updatedAt).toLocaleString('pl-PL')}</p></div><button data-load="${m.id}" class="${s.winner===null?'primary':''}">${s.winner===null?'Wznów':'Wynik'} ↗</button></div>`;}).join(''):'<div class="empty-state"><p>Jeszcze nie rozegraliście meczu.</p></div>'}<div class="dialog-actions"><button id="export">Pobierz kopię meczu</button><button id="import">Wczytaj z pliku</button>${cloudEnabled()?'<button id="sync">Synchronizuj</button>':''}</div><input type="file" accept=".json,application/json" id="import-file" hidden>`);
  document.querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>{contest=null;saveContest();match=matches.find(m=>m.id===b.dataset.load);multiplier=1;modal.close();renderGame();});
  $('#export').onclick=exportMatch;
  $('#import').onclick=()=>$('#import-file').click();
  $('#import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>3_000_000)throw new Error('Plik jest za duży.');const loaded=validateMatch(JSON.parse(await file.text()));const existing=allMatches().find(m=>m.id===loaded.id);if(existing){loaded.id=crypto.randomUUID();}loaded.updatedAt=new Date().toISOString();modal.close();update(loaded);toast('Wczytano mecz.');}catch{toast('Nieprawidłowy plik meczu.');}};
  if($('#sync'))$('#sync').onclick=async()=>{$('#sync').disabled=true;await syncCloud();showHistory();};
}
$('#history-button').onclick=showHistory;
$('#other-game').onclick=()=>{leaveTraining();match=null;contest=null;saveContest();renderHome();};
$('.brand').onclick=e=>{e.preventDefault();if(contest){renderContest();return;}match=null;renderHome();};
$('#rules-button').onclick=()=>openModal('Jak gramy?',`<div class="modal-copy"><h3>Walka o start</h3><p>Każdy rzuca trzy lotki. Bull to 25 lub 50 punktów, pozostałe pola to 0. Najwyższa suma daje start. Remisujący liderzy rozgrywają kolejną serię trzech lotek od zera, aż zostanie jeden zwycięzca. Pozostali grają w kolejności z listy.</p><h3>501 / 301 / 201</h3><p>Każdy zaczyna od wybranej liczby punktów. Trzy lotki w kolejce, potem „Następny gracz”. Wygrywa pierwszy wynik równy zero. Przekroczenie zera anuluje punkty całej kolejki.</p><p><strong>Double Out:</strong> ostatnia lotka musi trafić w podwójne pole lub bull 50. Wynik 1 oraz zejście do zera bez podwójnego pola także anulują kolejkę. Start jest zawsze dowolny (Straight In).</p><h3>Cricket</h3><p>Gramy na polach 15–20 i bull. Trzy trafienia zamykają pole. ×2 liczy się jako dwa, ×3 jako trzy. Nadmiar trafień daje punkty, jeśli choć jeden rywal ma pole otwarte. Zdobyte punkty nigdy nie znikają po zamknięciu pola przez innych.</p><p>Wygrywa gracz, który zamknie wszystkie pola i ma co najmniej tyle punktów co każdy przeciwnik. Bull 25 to jedno trafienie, bull 50 to dwa. Pozostałe pola wpisuj jako „PUDŁO / 0”.</p><h3>Cricket · punkty przeciwnikom</h3><p>Nadmiarowe trafienia dopisują pełną wartość każdemu rywalowi, który nie zamknął tego pola. Gracz rzucający nie dostaje tych punktów. Wygrywa gracz z zamkniętymi wszystkimi polami i wynikiem nie wyższym od żadnego rywala. Podsumowanie kolejki pokazuje sumę punktów dopisanych wszystkim rywalom.</p><h3>Nasze zasady Cricket</h3><p>Każdy gracz odblokowuje dwudziestkę po potrójnych w dwóch różnych polach 15–19, np. T16 i T15. Trzy pojedyncze zamykają pole, ale nie zaliczają wymaganej potrójnej. Wcześniejsze trafienie w 20 liczy się jako pudło. Opcję wybieracie przed nowym meczem.</p><h3>Szanghaj</h3><p>Pojedyncza, podwójna i potrójna tego samego pola 1–20 w jednej kolejce, w dowolnej kolejności: okrzyk, fanfara i ekran celebracji. Punkty liczymy zgodnie z wybranym trybem.</p><h3>Legi</h3><p>Wybierz pojedynczy leg albo mecz do 2 lub 3 wygranych legów, bez setów. Po wygranym legu wybierz „Następny leg”: punkty wracają do wartości początkowej, wynik legów zostaje. Rozpoczynający zmienia się kolejno między graczami. Walka o start jest tylko przed pierwszym legiem.</p><h3>Wpisywanie i zapis</h3><p>Wybierz ×2 lub ×3, a następnie numer. Mnożnik pozostaje wybrany do końca kolejki; przy zmianie gracza wraca do ×1. Przyciski BULL zawsze oznaczają 25 i 50, niezależnie od mnożnika. „Cofnij rzut” przywraca stan sprzed ostatniej lotki, także po zmianie gracza i zwycięstwie.</p><p>Zapis na tablecie działa bez konta. Nie czyść danych przeglądarki, jeśli chcesz zachować mecze i dostęp do kopii w chmurze. Pobraną kopię JSON możesz wczytać na innym urządzeniu.</p></div>`);
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('Pełny ekran nie jest dostępny w tej przeglądarce.');}};
modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close();}});
onCloudStatus(text=>{if(!storageError)$('#save-status').textContent=text;});
try {
  const draft=JSON.parse(localStorage.getItem(contestKey));
  if(draft){createMatch(draft.names,draft.mode,draft.doubleOut,draft.cricketScoring,draft.cricketOpening,draft.legsToWin);bullState(draft.names.length,draft.throws);contest=draft;}
} catch {}
if(location.hash==='#nowe-301'){section='competition';contest=null;const previous=allMatches()[0];if(previous)names=[...previous.names];mode='301';legsToWin=3;history.replaceState(null,'',location.pathname+location.search);}
if(contest)renderContest();else renderSetup();
syncCloud().then(()=>{if(!contest&&!match&&document.body.dataset.view==='home')renderHome();});
setInterval(()=>{if(!storageError)syncCloud();},60000);

const soundButton=document.createElement('button');
soundButton.id='sound-toggle';
function renderSoundButton(){soundButton.disabled=competition();soundButton.textContent=competition()?'Zawody: cisza':soundEnabled()?'Dźwięk: WŁ.':'Dźwięk: WYŁ.';soundButton.setAttribute('aria-pressed',String(soundEnabled()));soundButton.setAttribute('aria-label',soundEnabled()?'Wyłącz dźwięk':'Włącz dźwięk');}
renderSoundButton();
soundButton.onclick=()=>{if(competition())return;toggleSound();renderSoundButton();};
document.querySelector('.top-actions').append(soundButton);
