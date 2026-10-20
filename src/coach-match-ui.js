import {appStorage,accountOwner} from './account-storage.js';
import {loadProfiles,PROFILES_KEY} from './profiles.js';
import {replay,recordDart,validateMatch,dartLabel} from './engine.js';
import {newCoachMatch,coachTurn,undoHuman,matchInsight} from './coach-match.js';
import {updateActivity} from './app-update.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function readCoachMatches(id){const rows=loadProfiles().find(p=>p.id===id)?.coachMatches??[];if(!Array.isArray(rows))throw Error('Nie można odczytać meczów trenera.');rows.forEach(validateMatch);return rows;}
export function mountCoachMatch(root,{profile,mode,doubleOut,level,resume,onBack,onExercises,toast}){
 const owner=accountOwner();let rows=readCoachMatches(profile.id),m=resume||newCoachMatch(profile.name,mode,doubleOut,level),mult=1;
 const $=s=>root.querySelector(s),safe=f=>{try{f();}catch(e){toast(e.message);}};
 function save(next){
  if(owner!==accountOwner())throw Error('Konto zmieniło się. Otwórz ponownie trenera.');
  const profiles=loadProfiles(),p=profiles.find(p=>p.id===profile.id);if(!p)throw Error('Nie znaleziono profilu.');
  if(JSON.stringify(p.coachMatches??[])!==JSON.stringify(rows))throw Error('Mecz zmienił się w innej karcie. Otwórz ponownie trenera.');
  validateMatch(next);replay(next);const updated=[next,...rows.filter(r=>r.id!==next.id)];p.coachMatches=updated;appStorage.setItem(PROFILES_KEY,JSON.stringify(profiles));rows=updated;m=next;updateActivity(m.id,replay(m).winner===null);
 }
 function render(){const s=replay(m),done=s.winner!==null,insight=matchInsight(rows);
 root.innerHTML=`<div class="virtual-coach"><header class="coach-heading"><div><p class="eyebrow">LUŹNA GRA Z TRENEREM · ${m.mode}</p><h1>${done?'Dzięki za grę!':'Gramy, '+esc(profile.name)+'!'}</h1><p>${m.doubleOut?'Kończymy na podwójnym':'Kończymy dowolnym polem'} · jeden leg · ${m.coachLevel==='strong'?'mocniejszy':m.coachLevel==='regular'?'regularny':'spokojny'} przeciwnik</p></div><button data-back>${done?'Na dziś wystarczy':'Zapisz i zrób przerwę'}</button></header><section class="panel"><div class="coach-metrics">${s.players.map((p,i)=>`<article><h2>${esc(p.name)}</h2><strong>${p.score}</strong><p>${p.darts} lotek${done&&s.winner===i?' · wygrany leg':''}</p></article>`).join('')}</div><p role="status">${done?'Wynik zapisany. Co masz ochotę zrobić dalej?':s.bust?'Fura — wynik sprzed kolejki zachowany.':s.ready?'Twoja kolejka gotowa. Teraz trener.':'Twoja kolej. Wpisuj faktyczne trafienia.'}</p><p>${s.turn.map(dartLabel).join(' · ')}</p>
 ${done?`<p>W ostatnich 30 dniach: ${insight.finished} ukończonych meczów, ${insight.darts} Twoich lotek, średnia ${insight.average??'—'} pkt / 3 lotki. To wstępna obserwacja punktowania, nie pełna ocena umiejętności. Nie znamy celu każdej lotki, więc nie wyliczamy skuteczności prób podwójnych.</p><div class="training-actions"><button data-rematch class="primary">Jeszcze jeden ${m.mode}</button><button data-exercises>Chcę zobaczyć ćwiczenia</button></div>`:s.ready?'<button data-turn class="primary">Kolej trenera</button>':`<div class="multiplier">${[1,2,3].map(v=>`<button data-mult="${v}" aria-pressed="${v===mult}" class="${v===mult?'selected':''}">×${v}</button>`).join('')}</div><div class="number-grid">${Array.from({length:20},(_,i)=>`<button data-hit="${i+1}">${i+1}</button>`).join('')}</div><div class="special-keys"><button data-special="25">BULL 25</button><button data-special="50">BULL 50</button><button data-special="0">PUDŁO / 0</button></div>`}<button data-undo ${m.events.some(e=>e.type==='dart')?'':'disabled'}>↶ Cofnij mój rzut</button><details><summary>Rzuty trenera</summary><p>${s.visits.filter(v=>v.player===1).map(v=>esc(v.darts.map(dartLabel).join(' · '))+' — '+v.points+' pkt'+(v.bust?' · FURA':'')).join('<br>')||'Brak zakończonych kolejek.'}</p></details></section></div>`;
 $('[data-back]').onclick=onBack;
 root.querySelectorAll('[data-mult]').forEach(b=>b.onclick=()=>{mult=+b.dataset.mult;render();});
 const hit=(n,x)=>safe(()=>{save(recordDart(m,n,x));mult=1;render();});
 root.querySelectorAll('[data-hit]').forEach(b=>b.onclick=()=>hit(+b.dataset.hit,mult));root.querySelectorAll('[data-special]').forEach(b=>b.onclick=()=>{const n=+b.dataset.special;hit(n===50?25:n,n===50?2:1);});
 if($('[data-turn]'))$('[data-turn]').onclick=()=>safe(()=>{save(coachTurn(m));render();});
 $('[data-undo]').onclick=()=>safe(()=>{save(undoHuman(m));render();});
 if(done){$('[data-rematch]').onclick=()=>safe(()=>{save(newCoachMatch(profile.name,m.mode,m.doubleOut,m.coachLevel));render();});$('[data-exercises]').onclick=onExercises;}
 }
 safe(()=>{if(!resume)save(m);render();});return ()=>{};
}
