import {coachAudioCue} from './coach-match-audio.js';
import {playSound,speakTraining,stopSpeech,soundEnabled,toggleSound} from './sound.js';
import {remainingDarts} from './dart-progress.js';
import {FEELING,afterLeg} from './coach-conversation.js';
import {appStorage,accountOwner} from './account-storage.js';
import {loadProfiles,PROFILES_KEY} from './profiles.js';
import {replay,recordDart,nextPlayer,validateMatch,dartLabel,TARGETS} from './engine.js';
import {newCoachMatch,coachThrow,undoHuman,matchInsight} from './coach-match.js';
import {updateActivity} from './app-update.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function readCoachMatches(id){const rows=loadProfiles().find(p=>p.id===id)?.coachMatches??[];if(!Array.isArray(rows))throw Error('Nie można odczytać meczów trenera.');rows.forEach(validateMatch);return rows;}
export function mountCoachMatch(root,{profile,mode,doubleOut,level,cricketScoring='standard',cricketOpening='standard',resume,conversation,onBack,onFinish=onBack,onExercises,toast}){
 const owner=accountOwner();let rows=readCoachMatches(profile.id),m=resume||{...newCoachMatch(profile.name,mode,doubleOut,level,cricketScoring,cricketOpening),coachSession:{id:crypto.randomUUID(),leg:1,phase:'warmup',conversation:conversation??null}},mult=1;
 let audioState=null,audioId=null;
 let timer=null,disposed=false,feeling=m.coachFeedback?.feeling??'unknown';
 const $=s=>root.querySelector(s),safe=f=>{try{f();}catch(e){cancel();toast(e.message);}};
 const refreshSound=()=>{const b=$('[data-coach-sound]');if(b){b.textContent=soundEnabled()?'Dźwięk: WŁ.':'Dźwięk: WYŁ.';b.setAttribute('aria-pressed',String(soundEnabled()));b.setAttribute('aria-label',soundEnabled()?'Wyłącz dźwięk':'Włącz dźwięk');}};
 window.addEventListener('dart-sound-change',refreshSound);
 const cancel=()=>{clearTimeout(timer);timer=null;};
 function save(next){
  if(owner!==accountOwner())throw Error('Konto zmieniło się. Otwórz ponownie trenera.');
  const profiles=loadProfiles(),p=profiles.find(p=>p.id===profile.id);if(!p)throw Error('Nie znaleziono profilu.');
  if(JSON.stringify(p.coachMatches??[])!==JSON.stringify(rows))throw Error('Mecz zmienił się w innej karcie. Otwórz ponownie trenera.');
  validateMatch(next);replay(next);const updated=[next,...rows.filter(r=>r.id!==next.id)];p.coachMatches=updated;appStorage.setItem(PROFILES_KEY,JSON.stringify(profiles));rows=updated;m=next;updateActivity(m.id,replay(m).winner===null);
 }
 function schedule(){
  cancel();const s=replay(m);if(disposed||s.winner!==null||(!s.ready&&s.current===0))return;
  timer=setTimeout(()=>safe(()=>{
   if(disposed||!root.isConnected)return;
   const current=replay(m);
   save(current.ready?nextPlayer(m):coachThrow(m));render();
  }),s.current===0?1200:s.ready?1400:950);
 }
 function reaction(s){
  if(s.winner!==null)return s.winner===0?'Ten leg jest Twój! Dzięki za grę.':'Ten leg dla mnie. Dzięki za wspólną grę!';
  if(m.mode==='cricket'){
   const closed=TARGETS.filter(n=>s.players[0].marks[n]===3).length;
   if(s.current===1)return s.ready?'Moja kolejka zapisana. Za chwilę Twoja tarcza.':'Teraz ja — zamykam pola albo zdobywam punkty.';
   if(s.ready)return `Twoja kolejka zapisana. Zamknięte pola: ${closed}/7. Teraz moja kolej.`;
   const target=TARGETS.find(n=>s.players[0].marks[n]<3&&(n!==20||m.cricketOpening!=='two-triples'||[15,16,17,18,19].filter(v=>s.players[0].marks[v]===3).length>=2));
   return target?`Możesz spróbować ${target===25?'BULL':target}. Do zamknięcia brakuje ${3-s.players[0].marks[target]} trafień. Ty wybierasz cel.`:'Pola zamknięte. Teraz liczy się wynik punktowy — szukaj pola, które rywal ma jeszcze otwarte.';
  }
  if(s.current===1)return s.bust?'Moja fura. Wracam do wyniku sprzed kolejki.':s.ready?`Moja kolejka: ${s.turnPoints} pkt. Za chwilę Twoja tarcza.`:s.turn.length?`${dartLabel(s.turn.at(-1))}. Jeszcze ${3-s.turn.length} ${s.turn.length===2?'lotka':'lotki'} dla mnie.`:'Teraz ja. Zobaczmy, co wpadnie.';
  if(s.bust)return 'Fura. Wynik zostaje — gramy dalej na luzie.';
  if(s.ready)return s.turnPoints>=100?`${s.turnPoints} punktów! Ale kolejka. Teraz spróbuję ja.`:`${s.turnPoints} punktów zapisane. Teraz moja kolej.`;
  return s.players[0].darts?'Tarcza jest Twoja. Rzucaj w swoim tempie.':'Zaczynasz! Wpisuj trafienia, a ja zagram po Twoich trzech lotkach.';
 }
 function render(){
  const s=replay(m),done=s.winner!==null,bot=s.current===1,insight=matchInsight(rows);
  if(audioId!==m.id){audioState=null;audioId=m.id;}
  const cue=coachAudioCue(s,audioState,m.mode);audioState=s;
  if(cue){if(cue.sound)playSound(cue.sound);speakTraining(cue.text,cue.sound==='win');}
  root.innerHTML=`<div class="virtual-coach coach-match"><header class="coach-heading"><div><p class="eyebrow">${m.coachSession?.phase==='play'?'GRAMY DALEJ':'GRAMY NA LUZIE'} · ${m.mode}</p><h1>${done?'Dzięki za grę!':bot?'Teraz rzucam ja.':'Twoja tarcza, '+esc(profile.name)+'!'}</h1><p>${m.mode==='cricket'?(m.cricketScoring==='cutthroat'?'Cricket: punkty rywalowi, niższy wynik wygrywa':'Cricket: punkty dla siebie, wyższy wynik wygrywa'):(m.doubleOut?'Kończymy na podwójnym':'Kończymy dowolnym polem')} · jeden leg</p></div><button data-back>${done?'Na dziś wystarczy':'Zapisz i zrób przerwę'}</button></header><section class="panel"><div class="coach-metrics coach-scoreboard">${s.players.map((p,i)=>`<article class="${!done&&s.current===i?'is-current':''}"><h2>${esc(p.name)}</h2><strong>${p.score}</strong><p>${done&&s.winner===i?'Wygrany leg':!done&&s.current===i?'Przy tarczy':p.darts+' lotek'}</p></article>`).join('')}</div>${m.mode==='cricket'?`<div class="panel"><h2>Zamknięcia · trzy trafienia na pole</h2><table><thead><tr><th>Pole</th><th>${esc(profile.name)}</th><th>Trener</th></tr></thead><tbody>${TARGETS.map(n=>`<tr><th>${n===25?'BULL':n}</th>${s.players.map(p=>`<td>${p.marks[n]===3?'✓':p.marks[n]+'/3'}</td>`).join('')}</tr>`).join('')}</tbody></table>${m.cricketOpening==='two-triples'?'<p>20 dostępne po zamknięciu dwóch pól 15–19.</p>':''}</div>`:''}<div class="coach-says" role="status" aria-live="polite"><span class="eyebrow">TRENER</span><p>${reaction(s)}</p><button data-coach-sound aria-pressed="${soundEnabled()}" aria-label="${soundEnabled()?'Wyłącz dźwięk':'Włącz dźwięk'}">Dźwięk: ${soundEnabled()?'WŁ.':'WYŁ.'}</button><button data-repeat-audio>🔊 Powtórz komunikat</button></div>
  ${done?'':`${remainingDarts(s)}<div class="coach-dart-slots" aria-label="Lotki w tej kolejce">${Array.from({length:3},(_,i)=>`<span class="${s.turn[i]?'has-dart':''}">${s.turn[i]?dartLabel(s.turn[i]):'·'}</span>`).join('')}</div>`}
  ${done?`<section class="coach-conversation">${m.mode==='cricket'?`<h2>Twój Cricket zapisany</h2><p>${TARGETS.filter(n=>s.players[0].marks[n]===3).length}/7 zamkniętych pól · ${s.players[0].score} pkt · ${s.players[0].darts} Twoich lotek.</p><p>Możesz powtórzyć mecz albo wybrać do ćwiczenia jedno z niezamkniętych pól.</p>`:''}<h2>${(m.coachSession?.leg??1)===1?'Pierwszy leg za nami. Jak Ci się rzuca?':'Jak Ci się teraz rzuca?'}</h2><div class="training-actions">${Object.entries(FEELING).map(([v,label])=>`<button data-feeling="${v}" aria-pressed="${v===feeling}">${label}</button>`).join('')}</div><p data-feeling-reply role="status">${feelingReply(feeling)}</p><div class="training-actions"><button data-next="warmup">Jeszcze rozgrzewka · ${m.mode}</button><button data-next="play">Gramy dalej · ${m.mode}</button><button data-next="exercises">Mam ochotę na ćwiczenia</button><button data-next="finish">Na dziś wystarczy</button></div><p class="small">${m.mode==='cricket'?'Cricket podsumowujemy według zamknięć i punktów. ':''}${insight.darts} Twoich lotek w X01 w ostatnich 30 dniach${insight.average!==null?' · średnia '+insight.average+' pkt / 3 lotki':''}. Poznaję Twoje punktowanie. To jeszcze nie diagnoza formy.</p></section>`:bot||s.ready?`<div class="coach-bot-stage"><span class="coach-presence" aria-hidden="true">◎</span><p>${bot?'Rzucam…':'Podchodzę do tarczy…'}</p><button data-skip-tempo>Pokaż następną lotkę od razu</button></div>`:`<div class="multiplier">${[1,2,3].map(v=>`<button data-mult="${v}" aria-pressed="${v===mult}" class="${v===mult?'selected':''}">×${v}</button>`).join('')}</div><div class="number-grid">${(m.mode==='cricket'?[15,16,17,18,19,20].map(n=>n-1):Array.from({length:20},(_,i)=>i)).map(i=>`<button data-hit="${i+1}">${i+1}</button>`).join('')}</div><div class="special-keys"><button data-special="25">BULL 25</button><button data-special="50">BULL 50</button><button data-special="0">PUDŁO / 0</button></div>`}
  <button data-undo ${m.events.some(e=>e.type==='dart')?'':'disabled'}>↶ Cofnij mój rzut</button><details><summary>Rzuty trenera</summary><p>${s.visits.filter(v=>v.player===1).map(v=>esc(v.darts.map(dartLabel).join(' · '))+' — '+v.points+' pkt'+(v.bust?' · FURA':'')).join('<br>')||'Brak zakończonych kolejek.'}</p></details></section></div>`;
  const leave=fn=>{cancel();stopSpeech();fn();};
  $('[data-coach-sound]').onclick=()=>{toggleSound();refreshSound();};
  $('[data-repeat-audio]').onclick=()=>{if(!soundEnabled()){toast('Włącz dźwięk przyciskiem obok komunikatu trenera.');return;}playSound('turn');speakTraining(done?reaction(s):s.current===0&&!s.ready&&m.mode!=='cricket'?`${profile.name}, Twoja kolej. Do końca ${s.players[0].score}.`:reaction(s));};
  const decide=choice=>safe(()=>{save(afterLeg(m,feeling,choice));if(choice==='finish')return leave(onFinish);if(choice==='exercises')return leave(onExercises);const session=m.coachSession||{id:crypto.randomUUID(),leg:1,conversation:null};save({...newCoachMatch(profile.name,m.mode,m.doubleOut,m.coachLevel,m.cricketScoring,m.cricketOpening),coachSession:{...session,leg:session.leg+1,phase:choice==='warmup'?'warmup':'play'}});feeling='unknown';render();});
  $('[data-back]').onclick=done?()=>decide('finish'):()=>leave(onBack);
  root.querySelectorAll('[data-mult]').forEach(b=>b.onclick=()=>{mult=+b.dataset.mult;render();});
  const hit=(n,x)=>safe(()=>{save(recordDart(m,n,x));playSound('hit');mult=1;render();});
  root.querySelectorAll('[data-hit]').forEach(b=>b.onclick=()=>hit(+b.dataset.hit,mult));root.querySelectorAll('[data-special]').forEach(b=>b.onclick=()=>{const n=+b.dataset.special;hit(n===50?25:n,n===50?2:1);});
  if($('[data-skip-tempo]'))$('[data-skip-tempo]').onclick=()=>safe(()=>{cancel();let next=m;if(s.ready)next=nextPlayer(next);if(replay(next).current===1&&!replay(next).ready)next=coachThrow(next);save(next);render();});
  $('[data-undo]').onclick=()=>safe(()=>{cancel();stopSpeech();save({...undoHuman(m),coachFeedback:undefined});audioState=replay(m);render();speakTraining('Cofnięto Twój rzut.');});
  if(done){root.querySelectorAll('[data-next]').forEach(b=>b.onclick=()=>decide(b.dataset.next));root.querySelectorAll('[data-feeling]').forEach(b=>b.onclick=()=>{feeling=b.dataset.feeling;root.querySelectorAll('[data-feeling]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('[data-feeling-reply]').textContent=feelingReply(feeling);});}
  schedule();
 }
 safe(()=>{if(!resume)save(m);render();});return ()=>{disposed=true;cancel();stopSpeech();window.removeEventListener('dart-sound-change',refreshSound);};
}
function feelingReply(feeling){return {warming:'Możemy dalej grać na luzie. Nie ma pośpiechu.',ready:'To co, kolejny leg? Jeśli wolisz, możesz wybrać ćwiczenie.',tired:'Możemy na dziś skończyć. Wynik już jest zapisany.',unknown:'Nie musisz oceniać swojej formy. Na co masz teraz ochotę?'}[feeling];}
