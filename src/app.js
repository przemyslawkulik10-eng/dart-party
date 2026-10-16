import { DEFAULT_PLAYERS, TARGETS, createMatch, replay, recordDart, nextPlayer, undoDart, dartLabel, validateMatch } from './engine.js';
import { loadMatches, saveMatch } from './storage.js';
import { syncCloud, onCloudStatus, cloudEnabled } from './cloud.js';
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let names = [...DEFAULT_PLAYERS];
let mode = '501';
let doubleOut = false;
let match = null;
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
function update(next) { match = next; multiplier = 1; persist(match); renderGame(); }
function openModal(title, content) { $('#modal-content').innerHTML = `<div class="modal-heading"><h2>${title}</h2><button data-close aria-label="Zamknij">×</button></div>${content}`; if (!modal.open) modal.showModal(); $('[data-close]').onclick = () => modal.close(); }
function readNames() { names = [...document.querySelectorAll('[data-player-name]')].map(el => el.value); }
function renderSetup() {
  document.body.dataset.view = "setup";
  const latest = allMatches().find(m => replay(m).winner === null);
  $('#app').innerHTML = `${latest ? `<div class="resume-banner"><div><strong>Wasz mecz czeka.</strong><p>${latest.mode === 'cricket' ? 'Cricket' : latest.mode} · ${latest.names.length} graczy · runda ${replay(latest).round}</p></div><button class="primary" id="resume">Wznów mecz ↗</button></div>` : ''}
    <section class="hero"><div><div class="eyebrow">WIECZÓR NA WASZYCH ZASADACH</div><h1>Dobra ekipa.<br><em>Celny wieczór.</em></h1><p>Wybierzcie grę, ustawcie skład. Resztę policzymy za Was.</p></div><div class="hero-badge"><strong>3</strong><span>lotki w dłoni.<br>Cała gra przed Wami.</span></div></section>
    <div class="setup-grid"><section class="panel"><div class="section-heading"><div><div class="step">01 / WYBIERZ GRĘ</div><h2>W co dziś gramy?</h2></div><span class="pill">4 TRYBY</span></div><div class="mode-grid">${['501','301','201','cricket'].map(m => `<button class="mode ${mode===m?'selected':''}" data-mode="${m}" aria-pressed="${mode===m}"><strong>${m==='cricket'?'Cricket':m}</strong><span>${({501:'Klasyka dobrego wieczoru',301:'Krótsza droga do zera',201:'Szybka runda na rozgrzewkę',cricket:'Zamykaj pola. Zbieraj punkty.'})[m]}</span></button>`).join('')}</div><div class="rules-choice">${mode!=='cricket'?`<label class="switch"><input id="double-out" type="checkbox" ${doubleOut?'checked':''}> Zakończenie Double Out</label><span class="small muted">${doubleOut?'Ostatnia lotka ×2':'Dowolne trafienie'}</span>`:'<span class="small muted">Pola 15–20 + bull · standardowa punktacja</span>'}</div><p class="mode-description">${mode==='cricket'?'Traf pole 3 razy, aby je zamknąć. Kolejne trafienia dają punkty, dopóki ktoś z rywali ma to pole otwarte.':doubleOut?'Zejdź dokładnie do zera, kończąc podwójnym polem lub bull 50. Przekroczenie wyniku albo pozostawienie 1 cofa całą kolejkę.':'Zejdź dokładnie do zera. Możesz skończyć dowolnym trafieniem. Przekroczenie wyniku cofa punkty całej kolejki.'}</p></section>
    <section class="panel"><div class="section-heading"><div><div class="step">02 / WASZA EKIPA</div><h2>Kto staje przy tarczy?</h2></div><span class="pill">${names.length} / 6 GRACZY</span></div><div class="player-list">${names.map((name,i)=>`<div class="player-edit"><span class="avatar">0${i+1}</span><input data-player-name="${i}" aria-label="Imię gracza ${i+1}" maxlength="24" value="${esc(name)}"><button data-remove="${i}" aria-label="Usuń gracza ${i+1}" ${names.length<=2?'disabled':''}>−</button></div>`).join('')}</div><button id="add-player" class="add-player" ${names.length>=6?'disabled':''}>+ Dodaj gracza</button></section></div>
    <div class="setup-bottom"><p>Jeden tablet przy tarczy. Zapis po każdym rzucie.<br>Możecie wrócić do meczu w dowolnym momencie.</p><button id="start" class="primary start-button">Zaczynamy grę <span>↗</span></button></div>`;
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{readNames();mode=b.dataset.mode;renderSetup();});
  document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{readNames();names.splice(Number(b.dataset.remove),1);renderSetup();});
  $('#add-player').onclick=()=>{readNames(); if(names.length<6)names.push(''); renderSetup(); [...document.querySelectorAll('[data-player-name]')].at(-1)?.focus();};
  if($('#double-out'))$('#double-out').onchange=e=>{readNames();doubleOut=e.target.checked;renderSetup();};
  if($('#resume'))$('#resume').onclick=()=>{match=latest;multiplier=1;renderGame();};
  $('#start').onclick=()=>{readNames();try{update(createMatch(names,mode,doubleOut));}catch(e){toast(e.message);}};
}
function cricketTable(state) {
  return `<div class="cricket-board"><table aria-label="Tablica Cricket"><thead><tr><th>POLE</th>${state.players.map((p,i)=>`<th class="${i===state.current?'current-col':''}">${esc(p.name)}</th>`).join('')}</tr></thead><tbody>${TARGETS.map(n=>`<tr><td>${n===25?'BULL':n}</td>${state.players.map((p,i)=>`<td class="${i===state.current?'current-col':''} ${p.marks[n]===3?'closed':''}" aria-label="${esc(p.name)}, ${n===25?'bull':n}: ${p.marks[n]} z 3">${['·','╱','╳','⊗'][p.marks[n]]}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function renderGame() {
  document.body.dataset.view = "game";
  const state = replay(match), player = state.players[state.current], cricket = match.mode==='cricket', won = state.winner!==null, blocked = state.ready||won;
  const nextName = state.players[(state.current+1)%state.players.length].name;
  $('#app').innerHTML = `<div class="game-title"><div><div class="eyebrow">NIECH LECI!</div><h1>${cricket?'Cricket':`Gramy <span>${match.mode}</span>`}</h1><div class="game-meta"><span class="pill">RUNDA ${state.round}</span><span>${state.players.length} graczy · ${cricket?'Standard':match.doubleOut?'Double Out':'Zwykłe zakończenie'}</span></div></div><button id="new-game" class="subtle">+ Nowy mecz</button></div>
    ${won?`<section class="victory"><div><div class="eyebrow">MAMY ZWYCIĘZCĘ!</div><h2>${esc(state.players[state.winner].name)} wygrywa.</h2><p>${cricket?'Wszystkie pola zamknięte. Najlepszy wynik.':'Ostatnia lotka. Dokładnie zero.'} Dobry mecz, ekipo!</p></div><div class="actions"><button class="primary" id="rematch">Gramy rewanż ↗</button><button id="undo-win">Cofnij ostatni rzut</button></div></section>`:''}
    <section class="scoreboard" aria-label="Wyniki graczy">${state.players.map((p,i)=>`<article class="player-card ${state.current===i?'active':''}" ${state.current===i?'aria-current="true"':''}><div class="player-name">${esc(p.name)}</div><div class="player-score">${p.score}</div><div class="small muted">${won&&i===state.winner?'ZWYCIĘZCA':i===state.current?'← TERAZ RZUCA':cricket?`${TARGETS.filter(n=>p.marks[n]===3).length}/7 PÓL ZAMKNIĘTYCH`:`ŚR. ${p.darts?(p.scored/p.darts*3).toFixed(1):'—'}`}</div></article>`).join('')}</section>
    ${cricket&&won?cricketTable(state):''}
    ${!won?`<div class="play-grid"><section class="panel current-panel"><div class="turn-header"><div><div class="eyebrow">TERAZ PRZY TARCZY</div><h2>${esc(player.name)}</h2></div><span class="pill">${state.turn.length} / 3 LOTKI</span></div>${cricket?cricketTable(state):`<div class="giant-score">${player.score}</div><div class="score-caption">punktów do zwycięstwa</div>`}${state.bust?'<div class="bust-label">Przekroczony wynik — kolejka za 0</div>':''}<div class="darts">${[0,1,2].map(i=>`<div class="dart-slot ${state.turn[i]?'filled':''}"><small>LOTKA ${i+1}</small><strong>${state.turn[i]?dartLabel(state.turn[i]):'—'}</strong></div>`).join('')}</div><div class="turn-total"><span>${state.ready?'Kolejka zakończona':'Wpisz trafienie na klawiaturze'}</span><strong>${state.turnPoints} pkt w kolejce</strong></div></section><section class="panel keypad-panel"><div class="keypad-head"><h2>Gdzie trafiła lotka?</h2><div class="multiplier" aria-label="Mnożnik">${[1,2,3].map(m=>`<button data-mult="${m}" aria-label="Mnożnik ${m}" aria-pressed="${m===multiplier}" class="${m===multiplier?'selected':''}" ${blocked?'disabled':''}>×${m}</button>`).join('')}</div></div><div class="number-grid ${cricket?'cricket-keys':''}">${(cricket?[20,19,18,17,16,15]:Array.from({length:20},(_,i)=>i+1)).map(n=>`<button data-hit="${n}" aria-label="Trafienie ${n}" ${blocked?'disabled':''}>${n}</button>`).join('')}</div><div class="special-keys"><button data-special="25" ${blocked?'disabled':''}>BULL 25</button><button data-special="50" ${blocked?'disabled':''}>BULL 50</button><button data-special="0" ${blocked?'disabled':''}>PUDŁO / 0</button></div><div class="action-row"><button id="undo" class="subtle" ${match.events.some(e=>e.type==='dart')?'':'disabled'}>↶ Cofnij rzut</button><button id="next" class="primary next-button" ${state.ready?'':'disabled'}>${state.ready?`${esc(nextName)} →`:'Następny gracz →'}</button></div></section></div>`:''}
    <section class="recent"><h3>Ostatnie kolejki</h3><div class="recent-list">${state.visits.length?state.visits.slice(-6).reverse().map(v=>`<div class="recent-item"><strong>${esc(state.players[v.player].name)}</strong>${v.darts.map(dartLabel).join(' · ')}<b>${v.bust?'BUST':v.points+' pkt'}</b></div>`).join(''):'<p class="small">Pierwsza kolejka przed Wami. Powodzenia!</p>'}</div></section>`;
  $('#new-game').onclick=()=>{ match=null; renderSetup(); };
  if(won){$('#rematch').onclick=()=>{names=[...match.names.slice(1),match.names[0]];update(createMatch(names,match.mode,match.doubleOut));};$('#undo-win').onclick=()=>update(undoDart(match));}
  document.querySelectorAll('[data-mult]').forEach(b=>b.onclick=()=>{multiplier=Number(b.dataset.mult);renderGame();});
  document.querySelectorAll('[data-hit]').forEach(b=>b.onclick=()=>hit(Number(b.dataset.hit),multiplier));
  document.querySelectorAll('[data-special]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.special);hit(n===50?25:n,n===50?2:1);});
  if($('#undo'))$('#undo').onclick=()=>update(undoDart(match));
  if($('#next'))$('#next').onclick=()=>{try{update(nextPlayer(match));}catch(e){toast(e.message);}};
}
function hit(n,m) { try { update(recordDart(match,n,m)); if(navigator.vibrate) navigator.vibrate(15); }catch(e){toast(e.message);} }
function exportMatch() {
  const current=match||allMatches()[0]; if(!current){toast('Brak meczu do pobrania.');return;}
  const url=URL.createObjectURL(new Blob([JSON.stringify(current,null,2)],{type:'application/json'}));
  const link=document.createElement('a'); link.href=url;link.download=`dart-party-${current.mode}-${current.id.slice(0,8)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function showHistory() {
  const matches=allMatches();
  openModal('Zapisane mecze',`${storageError?'<p class="error">Nie można odczytać pamięci tabletu. Nie nadpisujemy zapisów.</p>':''}<p class="small muted">Mecze zapisują się automatycznie po każdym rzucie. Kopia pliku pozwala przenieść mecz na inne urządzenie.</p>${matches.length?matches.slice(0,50).map(m=>{const s=replay(m);return `<div class="saved-match"><div><strong>${m.mode==='cricket'?'Cricket':m.mode} · ${s.winner!==null?'Wygrywa '+esc(m.names[s.winner]):'Runda '+s.round}</strong><p>${esc(m.names.join(' · '))}</p><p>${new Date(m.updatedAt).toLocaleString('pl-PL')}</p></div><button data-load="${m.id}" class="${s.winner===null?'primary':''}">${s.winner===null?'Wznów':'Wynik'} ↗</button></div>`;}).join(''):'<div class="empty-state"><p>Jeszcze nie rozegraliście meczu.</p></div>'}<div class="dialog-actions"><button id="export">Pobierz kopię meczu</button><button id="import">Wczytaj z pliku</button>${cloudEnabled()?'<button id="sync">Synchronizuj</button>':''}</div><input type="file" accept=".json,application/json" id="import-file" hidden>`);
  document.querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>{match=matches.find(m=>m.id===b.dataset.load);multiplier=1;modal.close();renderGame();});
  $('#export').onclick=exportMatch;
  $('#import').onclick=()=>$('#import-file').click();
  $('#import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>3_000_000)throw new Error('Plik jest za duży.');const loaded=validateMatch(JSON.parse(await file.text()));const existing=allMatches().find(m=>m.id===loaded.id);if(existing){loaded.id=crypto.randomUUID();}loaded.updatedAt=new Date().toISOString();modal.close();update(loaded);toast('Wczytano mecz.');}catch{toast('Nieprawidłowy plik meczu.');}};
  if($('#sync'))$('#sync').onclick=async()=>{$('#sync').disabled=true;await syncCloud();showHistory();};
}
$('#history-button').onclick=showHistory;
$('.brand').onclick=e=>{e.preventDefault();match=null;renderSetup();};
$('#rules-button').onclick=()=>openModal('Jak gramy?',`<div class="modal-copy"><h3>501 / 301 / 201</h3><p>Każdy zaczyna od wybranej liczby punktów. Trzy lotki w kolejce, potem „Następny gracz”. Wygrywa pierwszy wynik równy zero. Przekroczenie zera anuluje punkty całej kolejki.</p><p><strong>Double Out:</strong> ostatnia lotka musi trafić w podwójne pole lub bull 50. Wynik 1 oraz zejście do zera bez podwójnego pola także anulują kolejkę. Start jest zawsze dowolny (Straight In).</p><h3>Cricket</h3><p>Gramy na polach 15–20 i bull. Trzy trafienia zamykają pole. ×2 liczy się jako dwa, ×3 jako trzy. Nadmiar trafień daje punkty, jeśli choć jeden rywal ma pole otwarte. Zdobyte punkty nigdy nie znikają po zamknięciu pola przez innych.</p><p>Wygrywa gracz, który zamknie wszystkie pola i ma co najmniej tyle punktów co każdy przeciwnik. Bull 25 to jedno trafienie, bull 50 to dwa. Pozostałe pola wpisuj jako „PUDŁO / 0”.</p><h3>Wpisywanie i zapis</h3><p>Wybierz ×2 lub ×3, a następnie numer. Mnożnik wraca do ×1 po każdym rzucie. Przyciski BULL zawsze oznaczają 25 i 50, niezależnie od mnożnika. „Cofnij rzut” przywraca stan sprzed ostatniej lotki, także po zmianie gracza i zwycięstwie.</p><p>Zapis na tablecie działa bez konta. Nie czyść danych przeglądarki, jeśli chcesz zachować mecze i dostęp do kopii w chmurze. Pobraną kopię JSON możesz wczytać na innym urządzeniu.</p></div>`);
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('Pełny ekran nie jest dostępny w tej przeglądarce.');}};
modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close();}});
onCloudStatus(text=>{if(!storageError)$('#save-status').textContent=text;});
renderSetup();
syncCloud().then(()=>{if(!match&&!document.querySelector('[data-player-name]:focus'))renderSetup();});
setInterval(()=>{if(!storageError)syncCloud();},60000);
