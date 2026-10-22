import {replay} from './engine.js';
import {playerMilestones,milestoneDartLabel} from './player-milestones.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function playerAchievements(data){
 const seen=new Set();
 const legacy140=(data.matches||[]).flatMap(match=>{
  if(seen.has(match.id))return [];
  seen.add(match.id);
  const player=match.profileIds?.indexOf(data.profile.id)??-1;
  if(player<0)return [];
  return replay(match).achievements.filter(a=>a.player===player&&a.kind==='140').map(({player,...a})=>({...a,matchId:match.id,mode:match.mode}));
 });
 return [...playerMilestones(data),...legacy140].sort((a,b)=>(Date.parse(b.at)||0)-(Date.parse(a.at)||0));
}

export function achievementsMarkup(data){
 const all=playerAchievements(data),years=new Map();
 for(const a of all){const year=a.at?String(new Date(a.at).getFullYear()):'Bez daty';if(!years.has(year))years.set(year,[]);years.get(year).push(a);}
 return `<section class="profile-history profile-achievements" aria-label="Historia osiągnięć"><h2>Moje 180, 170 i 140</h2><p>180 i 170 to suma trafień trzech lotek w jednej kolejce — we wszystkich zapisanych grach i treningach. 140 zapisujemy w meczach 501, 301 i 201.</p><div class="profile-kpis">${['180','170','140'].map(kind=>`<article><strong>${all.filter(a=>a.kind===kind).length}</strong><span>Kolejki ${kind} · od początku</span></article>`).join('')}</div><p>Historia pozostaje razem z zapisami gier, treningów i kopią konta. Cofnięcie rzutu koryguje osiągnięcia. Starsze rzuty bez zapisanej godziny oznaczamy „Brak dokładnej daty”.</p>${[...years].map(([year,rows])=>`<details><summary>${esc(year)} · 180: ${rows.filter(a=>a.kind==='180').length} · 170: ${rows.filter(a=>a.kind==='170').length} · 140: ${rows.filter(a=>a.kind==='140').length}</summary>${rows.map(a=>`<div class="saved-match"><div><strong>${a.kind} — kolejka</strong><p>${a.at?esc(new Date(a.at).toLocaleString('pl-PL')):'Brak dokładnej daty'} · ${esc(a.sourceLabel||a.mode)} · ${a.leg?`leg ${a.leg}, `:''}kolejka ${a.round}</p><p>${a.darts.map(milestoneDartLabel).join(' + ')}</p><small>Zapis: ${esc(a.matchId)}</small></div></div>`).join('')}</details>`).join('')||'<p>Twoje pierwsze 180, 170 lub 140 pojawi się tutaj automatycznie.</p>'}</section>`;
}
