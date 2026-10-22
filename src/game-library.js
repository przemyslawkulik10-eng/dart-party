import {appStorage} from './account-storage.js';
import {gameIcon} from './player-dashboard.js';
export const LIBRARY_GAMES = [
 {id:'501',title:'501',tag:'Pełny dystans',art:'501',icon:'bullseye',group:'party',description:'Klasyczny mecz. Wybierz liczbę legów i sposób zakończenia.',players:'2–6 graczy'},
 {id:'301',title:'301',tag:'Szybka rywalizacja',art:'301',icon:'bullseye',group:'party',description:'Krótsza droga do zera, te same emocje przy tarczy.',players:'2–6 graczy'},
 {id:'201',title:'201',tag:'Na rozgrzewkę',art:'201',icon:'bullseye',group:'party',description:'Krótki mecz na początek wspólnego wieczoru.',players:'2–6 graczy'},
 {id:'cricket',title:'Cricket',tag:'Celność i taktyka',art:'15–20',icon:'grid-3x3-gap',group:'party',description:'Zamykaj pola i bull. Wybierz punktację oraz zasady Waszej ekipy.',players:'2–6 graczy'},
 {id:'cyferki',title:'Cyferki',tag:'Wybierz swój cel',art:'01–20',icon:'grid-3x3-gap',group:'party',description:'21 pól do zdobycia. Trzy lotki i decyzja, w co celować.',players:'2–6 graczy'},
 {id:'mnoznik',title:'Mnożnik 7–12',tag:'Celność × punkty',art:'×',icon:'x-diamond',group:'both',description:'Trafienia w cel pomnóż przez zdobyte punkty. Zagraj solo lub w sparingu.',players:'Solo / 2–6 graczy'},
 {id:'jdc',title:'JDC Challenge',tag:'Sprawdź swoją formę',art:'57',icon:'trophy',group:'solo',description:'57 lotek: Shanghai, podwójne i bull. Zapisz wynik i porównaj swoje próby.',players:'Trening solo'},
 {id:'sector-20',title:'Sektor 20',tag:'Powtarzalność trafień',art:'20',icon:'bullseye',group:'solo',description:'Trening na 5, 10 lub 15 minut. Pracuj nad celnością w sektorze 20.',players:'Trening solo'}
];
const preferenceKey='dart-party-library-v1';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const known=id=>LIBRARY_GAMES.some(g=>g.id===id);
function readPreferences(){try{const data=JSON.parse(appStorage.getItem(preferenceKey)||'{}');return {favorites:Array.isArray(data.favorites)?[...new Set(data.favorites.filter(known))]:[],recent:Array.isArray(data.recent)?[...new Set(data.recent.filter(known))].slice(0,4):[]};}catch{return {favorites:[],recent:[]};}}
export function mountGameLibrary(root,{onPlay,onCoach,onHome,onProfile,onResume,latest,toast}){
 let preferences=readPreferences(),category='all',query='';
 const save=()=>{try{appStorage.setItem(preferenceKey,JSON.stringify(preferences));}catch{toast('Nie można zapisać ulubionych na tym urządzeniu.');}};
 function launch(id){if(!known(id))return;preferences.recent=[id,...preferences.recent.filter(x=>x!==id)].slice(0,4);save();onPlay(id);}
 root.innerHTML=`<div class="play-library"><nav class="home-nav" aria-label="Nawigacja"><button id="library-home">← Strona główna</button><span aria-current="page">GRAJ</span><button id="library-profile">Panel gracza →</button></nav><section class="library-hero"><div><div class="eyebrow">POLECAMY NA DZISIAJ · DART PARTY</div><h1>Celność.<br>Punkty.<br><em>Mnożnik.</em></h1><p>Trzy lotki w cel, trzy na punkty. Zagraj w Mnożnik 7–12 i sprawdź, ile potrafisz z nich wycisnąć.</p><div class="home-actions"><button class="primary" data-play="mnoznik">Zagraj w Mnożnik ↗</button><a class="library-browse" href="#library-catalog">Przeglądaj gry ↓</a></div></div><div class="library-poster" aria-hidden="true"><span>7 / 8 / 9 / 10 / 11 / 12</span><b>×</b><strong>TRAFIENIA<br>RAZY PUNKTY</strong><small>36 LOTEK · TWÓJ WYNIK</small></div></section>
 ${latest?`<section class="resume-banner"><div><strong>Wasz mecz czeka</strong><p>${esc(latest.mode)} · ${esc(latest.names.join(' · '))}</p></div><button id="library-resume" class="primary">Wznów mecz →</button></section>`:''}
 <section class="library-shortcuts"><div><div class="eyebrow">NA TYM URZĄDZENIU</div><h2>Ostatnio wybierane</h2><div id="library-recent"></div></div><div><div class="eyebrow">ZACHOWAJ POD RĘKĄ</div><h2>Twoje ulubione</h2><div id="library-favorites"></div></div></section>
 <section id="library-catalog"><div class="home-section-title"><div><div class="eyebrow">WYBIERZ SWÓJ NASTĘPNY CEL</div><h2>Gry i treningi</h2></div><span>8 dostępnych pozycji</span></div><div class="library-controls"><label for="library-search">Znajdź grę<input id="library-search" type="search" placeholder="Nazwa lub opis gry…" maxlength="100"></label><div class="library-filters" role="group" aria-label="Rodzaj rozgrywki">${[['all','Wszystkie'],['party','Ze znajomymi'],['solo','Trening solo'],['favorites','Ulubione']].map(([id,label])=>`<button data-category="${id}" aria-pressed="${id==='all'}">${label}</button>`).join('')}</div></div><p id="library-count" role="status" aria-live="polite"></p><div class="home-game-grid" id="library-results"></div></section><p class="library-note">Ulubione i ostatnio wybierane zapisujemy na tym urządzeniu. Wybranie gry otwiera jej ustawienia.</p></div>`;
 const $=s=>root.querySelector(s);
 function shortcuts(){
  for(const [key,id] of [['recent','library-recent'],['favorites','library-favorites']])$('#'+id).innerHTML=preferences[key].length?preferences[key].map(id=>`<button class="library-shortcut" data-play="${id}">${LIBRARY_GAMES.find(g=>g.id===id).title} ↗</button>`).join(''):`<p class="muted">${key==='recent'?'Wybierz pierwszą grę z biblioteki.':'Naciśnij gwiazdkę na karcie gry, aby ją tu przypiąć.'}</p>`;
 }
 function renderResults(){
  const normalized=query.trim().toLocaleLowerCase('pl');
  const games=LIBRARY_GAMES.filter(g=>(category==='all'||category==='favorites'&&preferences.favorites.includes(g.id)||g.group===category||g.group==='both'&&['party','solo'].includes(category))&&`${g.title} ${g.description} ${g.tag}`.toLocaleLowerCase('pl').includes(normalized));
  $('#library-count').textContent=`Wyświetlono: ${games.length} z ${LIBRARY_GAMES.length}`;
  $('#library-results').innerHTML=games.length?games.map(g=>{const favorite=preferences.favorites.includes(g.id),index=LIBRARY_GAMES.indexOf(g);return `<article class="library-card home-game-${index%6}"><button class="library-favorite" data-favorite="${g.id}" aria-pressed="${favorite}" aria-label="${favorite?'Usuń z ulubionych':'Dodaj do ulubionych'}: ${g.title}">${favorite?'★':'☆'}</button><button class="home-game" data-play="${g.id}"><span class="home-game-art" aria-hidden="true">${gameIcon(g.icon)}<b>${g.art}</b></span><span class="home-game-info"><small>${g.players}</small><strong>${g.title}</strong><span>${g.description}</span><b class="home-game-go">Wybierz grę ↗</b></span></button>${onCoach?`<button class="primary" data-library-coach="${g.id}">${['jdc','sector-20'].includes(g.id)?'Ćwicz':'Graj'} z trenerem · 1 osoba</button>`:''}</article>`;}).join(''):'<div class="library-empty"><h3>Nie znaleziono gry</h3><p>Zmień hasło lub pokaż całą bibliotekę.</p><button id="library-clear">Wyczyść filtry</button></div>';
  root.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===category)));
 }
 $('#library-search').oninput=e=>{query=e.target.value;renderResults();};
 const click=e=>{
  const button=e.target.closest('button');if(!button||!root.contains(button))return;
  if(button.dataset.libraryCoach){onCoach?.(button.dataset.libraryCoach);return;}
  if(button.dataset.play){launch(button.dataset.play);return;}
  if(button.dataset.favorite){const id=button.dataset.favorite;preferences.favorites=preferences.favorites.includes(id)?preferences.favorites.filter(x=>x!==id):[...preferences.favorites,id];save();shortcuts();renderResults();root.querySelector(`[data-favorite="${id}"]`)?.focus();return;}
  if(button.dataset.category){category=button.dataset.category;renderResults();return;}
  if(button.id==='library-clear'){query='';category='all';$('#library-search').value='';renderResults();$('#library-search').focus();}
  if(button.id==='library-home')onHome();
  if(button.id==='library-profile')onProfile();
  if(button.id==='library-resume')onResume();
 };
 root.addEventListener('click',click);shortcuts();renderResults();
 return ()=>root.removeEventListener('click',click);
}
