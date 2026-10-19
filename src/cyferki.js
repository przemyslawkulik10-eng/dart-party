import {appStorage} from './account-storage.js';
import {validProfileId} from './profiles.js';
export const CYFERKI_KEY='dart-party-cyferki-v1';
export const CYFERKI_FIELDS=[...Array.from({length:20},(_,i)=>20-i),25];
export function createCyferki(profiles,rules,now=Date.now()){
 const match={version:1,kind:'cyferki',id:crypto.randomUUID(),createdAt:now,players:profiles.map(({id,name})=>({id,name})),rules:{...rules},events:[]};
 cyferkiState(match);return match;
}
export function cyferkiState(m){
 if(!m||m.version!==1||m.kind!=='cyferki'||!validProfileId(m.id)||!Number.isFinite(m.createdAt)||!Array.isArray(m.players)||m.players.length<2||m.players.length>6||m.players.some(p=>!validProfileId(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>24)||new Set(m.players.map(p=>p.id)).size!==m.players.length||!['hits','closures'].includes(m.rules?.scoring)||!['player','turn'].includes(m.rules?.progress)||!Array.isArray(m.events))throw new Error('Nieprawidłowy zapis Cyferek. Dane pozostają zachowane.');
 const s={current:0,chooser:0,target:null,dartsLeft:3,closed:[],scores:m.players.map(()=>0),marks:m.players.map(()=>({})),closures:m.players.map(()=>0),turn:1,history:[],finished:false,winners:[],pendingNext:false};
 const advance=()=>{s.current=(s.current+1)%m.players.length;s.dartsLeft=3;s.turn++;if(m.rules.progress==='turn')s.marks[s.current]={};};
 for(const e of m.events){
  if(s.finished||!e||!Number.isFinite(e.at)||e.at<m.createdAt)throw new Error('Nieprawidłowa historia Cyferek.');
  if(e.type==='choose'){
   if(s.target!==null||!CYFERKI_FIELDS.includes(e.target)||s.closed.includes(e.target))throw new Error('Wybierz otwarte pole tylko po zamknięciu poprzedniego.');
   s.target=e.target;if(s.pendingNext){advance();s.pendingNext=false;}s.chooser=s.current;
  }else if(e.type==='throw'){
   if(s.target===null||!Number.isInteger(e.hits)||e.hits<0||e.hits>(s.target===25?2:3))throw new Error('Nieprawidłowe trafienie zadeklarowanego pola.');
   const player=s.current,target=s.target,old=s.marks[player][target]||0;
   const closed=old+e.hits>=3;s.marks[player][target]=Math.min(3,old+e.hits);s.dartsLeft--;
   const points=m.rules.scoring==='hits'?e.hits:Number(closed);s.scores[player]+=points;
   s.history.push({player,target,hits:e.hits,points,closed,turn:s.turn,dart:3-s.dartsLeft});
   if(closed){s.closed.push(target);s.closures[player]++;s.target=null;s.chooser=player;
    if(s.closed.length===CYFERKI_FIELDS.length){s.finished=true;const best=Math.max(...s.scores);s.winners=s.scores.flatMap((v,i)=>v===best?[i]:[]);}
    else if(s.dartsLeft===0)s.pendingNext=true;
   }else if(s.dartsLeft===0)advance();
  }else throw new Error('Nieznane zdarzenie Cyferek.');
 }
 return s;
}
function append(m,event,now){const next={...m,events:[...m.events,{...event,at:now}]};cyferkiState(next);return next;}
export const chooseCyferki=(m,target,now=Date.now())=>append(m,{type:'choose',target},now);
export const throwCyferki=(m,hits,now=Date.now())=>append(m,{type:'throw',hits},now);
export function undoCyferki(m){cyferkiState(m);return {...m,events:m.events.slice(0,-1)};}
export function loadCyferki(){const all=JSON.parse(appStorage.getItem(CYFERKI_KEY)||'[]');if(!Array.isArray(all))throw new Error('Nieprawidłowa historia Cyferek.');all.forEach(cyferkiState);if(new Set(all.map(m=>m.id)).size!==all.length)throw new Error('Powtórzony zapis Cyferek.');return all;}
export function saveCyferki(m){cyferkiState(m);const all=loadCyferki();appStorage.setItem(CYFERKI_KEY,JSON.stringify([m,...all.filter(x=>x.id!==m.id)]));return m;}
