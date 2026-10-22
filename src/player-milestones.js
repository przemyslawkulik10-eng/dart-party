import {cricketTeamOrder,validDart,dartLabel} from './engine.js';
import {cyferkiState} from './cyferki.js';
import {taskState,COACH_LABELS} from './virtual-coach.js';
import {mnoznikState} from './mnoznik.js';

const timestamp=at=>{
 if(at===null||at===undefined)return null;
 const date=new Date(at);return Number.isFinite(date.getTime())?date.toISOString():null;
};
const value=d=>d.unknownMiss?null:validDart(d)?d.number*d.multiplier:Number.isInteger(d.points)?d.points:null;
export const milestoneDartLabel=d=>Number.isInteger(d.points)?`${d.points} pkt`:dartLabel(d);

// Rebuild from saved throws, never increment a separate counter. Reloads, imports,
// synchronization and undo therefore use the same durable source of truth.
export function playerMilestones(data){
 const profile=data.profile;if(!profile?.id)return [];
 const result=[],seen=new Set();
 const once=(type,id)=>{const key=`${type}:${id}`;if(seen.has(key))return false;seen.add(key);return true;};
 function add(darts,meta){
  if(darts.length!==3)return;
  const values=darts.map(value);if(values.includes(null))return;
  const points=values.reduce((sum,n)=>sum+n,0);if(![180,170].includes(points))return;
  result.push({...meta,kind:String(points),at:timestamp(darts[2].at),darts:darts.map(d=>({...d})),id:`${meta.source}:${meta.matchId}:${meta.leg??1}:${meta.round}`});
 }
 function matchRows(m,player,coach=false){
  if(player<0||!once('match',m.id))return;
  const order=cricketTeamOrder(m);let position=0,leg=1,round=1,visits=0,turn=[];
  for(const e of m.events){
   if(e.type==='next'){position=(position+1)%order.length;visits++;if(m.teams?visits%3===0:position===(leg-1)%order.length)round++;turn=[];}
   else if(e.type==='nextLeg'){leg++;position=(leg-1)%order.length;round=1;visits=0;turn=[];}
   else if(e.type==='dart'){
    turn.push(e);
    if(order[position]===player)add(turn,{source:'match',matchId:m.id,mode:m.mode,sourceLabel:`${m.mode==='cricket'?'Cricket':m.mode}${coach?' · z trenerem':''}`,leg,round});
   }
  }
 }
 for(const m of data.matches||[])matchRows(m,m.profileIds?.indexOf(profile.id)??-1);
 // These matches belong to the containing profile; seat 0 is the human.
 for(const m of profile.coachMatches||[])matchRows(m,0,true);
 for(const [source,label,rows] of [['training','Trening celności',data.trainings],['jdc','JDC Challenge',data.jdc]]){
  for(const s of rows||[]){
   if(s.profileId!==profile.id||!once(source,s.id))continue;
   for(let i=0;i+3<=s.darts.length;i+=3)add(s.darts.slice(i,i+3),{source,matchId:s.id,sourceLabel:label,round:i/3+1});
  }
 }
 for(const m of data.cyferki||[]){
  const player=m.players.findIndex(p=>p.id===profile.id);if(player<0||!once('cyferki',m.id))continue;
  const throws=m.events.filter(e=>e.type==='throw'),turns=new Map();
  cyferkiState(m).history.forEach((d,i)=>{
   if(d.player!==player)return;
   const turn=turns.get(d.turn)||[];
   turn.push({number:d.hits?d.target:0,multiplier:d.hits||1,at:throws[i].at});turns.set(d.turn,turn);
  });
  for(const [round,darts] of turns)add(darts,{source:'cyferki',matchId:m.id,sourceLabel:'Cyferki',round});
 }
 function multiplierRows(m,events,source){
  const s=mnoznikState({...m,kind:'mnoznik',profileId:profile.id,name:profile.name,events});
  for(const [i,r] of s.rounds.entries()){
   add(r.scoreDarts,{source,matchId:m.id,sourceLabel:source==='mnoznik'?'Mnożnik':'Mnożnik · sparing',round:i+1});
  }
 }
 for(const m of data.mnoznik||[])if(m.profileId===profile.id&&once('mnoznik',m.id))multiplierRows(m,m.events,'mnoznik');
 for(const m of data.mnoznikSparing||[]){
  const player=m.players.findIndex(p=>p.id===profile.id);if(player<0||!once('mnoznik-sparing',m.id))continue;
  multiplierRows(m,m.events.filter(e=>e.player===player),'mnoznik-sparing');
 }
 for(const plan of profile.virtualCoach?.plans||[])for(const task of plan.tasks){
  if(!once('coach-task',task.id))continue;
  taskState(task).rounds.forEach((r,i)=>add(r.darts,{source:'coach-task',matchId:task.id,sourceLabel:`Trener · ${COACH_LABELS[task.kind]}`,round:i+1}));
 }
 return result.sort((a,b)=>(Date.parse(b.at)||0)-(Date.parse(a.at)||0));
}

export function milestoneCounts(data){
 const rows=playerMilestones(data);
 return {180:rows.filter(a=>a.kind==='180').length,170:rows.filter(a=>a.kind==='170').length};
}

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const milestoneContext=a=>`${['training','jdc','coach-task','mnoznik'].includes(a.source)?'Podczas treningu':'Podczas gry'}: ${a.sourceLabel||a.mode||'Brak nazwy w starszym zapisie'}`;
export function milestoneHistoryMarkup(rows){
 return rows.length?`<ol class="milestone-history">${rows.map(a=>`<li><strong>${a.kind} · ${esc(milestoneContext(a))}</strong><p>${a.at?`<time datetime="${esc(a.at)}">${esc(new Date(a.at).toLocaleString('pl-PL',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}))}</time>`:'Brak dokładnej daty w starszym zapisie'}</p><p>${a.darts.map(milestoneDartLabel).map(esc).join(' + ')}</p></li>`).join('')}</ol>`:'<p class="milestone-empty">Pierwsze trafienie czeka na Ciebie. Gdy zapiszesz trzy lotki dające ten wynik, pojawi się tu data i godzina.</p>';
}

export function profileMilestonesMarkup(profile,rows){
 return `<section class="profile-milestones" aria-label="Moje trafienia 180 i 170"><div class="milestone-owner">${esc(profile.name)} · moje trafienia</div><div class="home-milestone-buttons">${['180','170'].map(kind=>{const count=rows.filter(a=>a.kind===kind).length;return `<button data-player-milestone="${kind}" aria-label="Moje ${kind}: ${count}. Pokaż daty i godziny"><span>Moje ${kind}</span><strong>${count}</strong><small>Daty i godziny →</small></button>`;}).join('')}</div></section>`;
}
