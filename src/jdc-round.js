import {validateJdc,jdcTarget,jdcStats,recordJdcDart,jdcGrade} from './jdc.js';
export const JDC_LEVELS=[[0,'Biały','#eee'],[150,'Fioletowy','#b586ed'],[300,'Żółty','#ffe047'],[450,'Zielony','#49cf91'],[600,'Niebieski','#48b9ff'],[700,'Czerwony','#ff6868'],[850,'Czarny','#8894a8'],[1250,'Złoty','#ffc452']];
export function roundTargets(s){validateJdc(s);const n=s.darts.length;return Array.from({length:n===57?0:3-n%3},(_,i)=>jdcTarget(n+i));}
export function commitRound(s,entries,now=Date.now()){
 const targets=roundTargets(s);if(!targets.length||entries.length!==targets.length)throw new Error('Nieprawidłowa liczba lotek.');
 return entries.reduce((next,d)=>{const value=d??{number:0,multiplier:1};let result=recordJdcDart(next,value.number,value.multiplier,now);if(d===null)result.darts.at(-1).unknownMiss=true;return result;},{...s,draft:undefined});
}
function turnScore(darts,number){return darts.reduce((sum,d)=>sum+(d.number===number?number*d.multiplier:0),0)+(darts.length===3&&darts.every(d=>d.number===number)&&new Set(darts.map(d=>d.multiplier)).size===3?100:0);}
export function maximumPossible(s){
 validateJdc(s);let total=0;
 for(let start=0;start<57;start+=3){const t=jdcTarget(start),fixed=s.darts.slice(start,start+3);
  if(t.phase===1){for(let k=0;k<3;k++){const goal=jdcTarget(start+k),d=fixed[k];total+=d?(d.number===goal.number&&d.multiplier===2?(goal.number===25?100:50):0):(goal.number===25?100:50);}continue;}
  function best(ds){if(ds.length===3)return turnScore(ds,t.number);return Math.max(...[1,2,3].map(multiplier=>best([...ds,{number:t.number,multiplier}])));}
  total+=best(fixed);
 }return total;
}
export function roundPrompt(s){const ts=roundTargets(s);if(!ts.length)return '';return ts[0].phase===1?`Teraz ${ts.map(t=>t.number===25?'środek BULL':'podwójne '+t.number).join(', ')}. Po jednej lotce na cel.`:`Teraz numer ${ts[0].number}. ${ts.length===3?'Trzy lotki':ts.length===1?'Pozostała jedna lotka':'Pozostały dwie lotki'}.`;}
export function roundFeedback(before,after){const a=jdcStats(before),b=jdcStats(after),shanghai=b.phases.some((p,i)=>p.shanghais>a.phases[i].shanghais),advance=JDC_LEVELS.findIndex(l=>l[1]===b.grade)>JDC_LEVELS.findIndex(l=>l[1]===a.grade);return {score:b.score-a.score,shanghai,advance,grade:b.grade,text:`${shanghai?`Jest! Shanghai! Brawo, ${after.name}! Sto punktów bonusu! `:''}Wynik kolejki: ${b.score-a.score} punktów.${advance?` Nowy poziom tej próby: ${b.grade}!`:''} ${b.complete?`Koniec próby. Łącznie ${b.score} punktów. Brawo!`:roundPrompt(after)}`};}
export function comparisonRows(s,history){
 const previous=history.filter(x=>x.id!==s.id&&x.profileId===s.profileId&&x.endedAt!==null&&x.endedAt<=s.createdAt);previous.forEach(validateJdc);
 function values(x){const rows=[];for(let i=0;i<57;i+=3){const t=jdcTarget(i);if(t.phase===1){if(i===18)rows.push({name:'Podwójne i BULL',value:jdcStats(x).phases[1].score});}else rows.push({name:`${t.phase===0?'Etap 1':'Etap 3'} · ${t.number}`,value:turnScore(x.darts.slice(i,i+3),t.number)});}return [{name:'Łączny wynik',value:jdcStats(x).score},...rows];}
 const old=previous.map(values);return values(s).map((r,i)=>{const mean=old.length?old.reduce((sum,rows)=>sum+rows[i].value,0)/old.length:null;return {...r,count:old.length,mean:mean===null?null:Math.round(mean*10)/10,delta:mean===null?null:Math.round((r.value-mean)*10)/10,percent:mean>0?Math.round((r.value-mean)/mean*1000)/10:null};});
}
export function levelPanel(score){const index=JDC_LEVELS.findIndex(l=>l[1]===jdcGrade(score)),next=JDC_LEVELS[index+1];return `<section class="jdc-levels" aria-label="Poziom wyniku tej próby">${JDC_LEVELS.map(([min,name,color],i)=>`<div class="${i===index?'active':''}" ${i===index?'aria-current="step"':''} style="--level-color:${color}"><strong>${name}</strong><small>${min}${JDC_LEVELS[i+1]?'–'+(JDC_LEVELS[i+1][0]-1):'+'}</small></div>`).join('')}<p>${next?`Do poziomu ${next[1]}: ${next[0]-score} pkt`:'Najwyższy poziom wyniku: złoty.'} · Poziom tej próby, nie stały ranking gracza.</p></section>`;}
export function hitLabel(d){return !d?'—':d.unknownMiss?'Nie trafiono celu · pole nieznane':d.number===0?'Poza tarczą':d.number===25?(d.multiplier===2?'BULL 50':'BULL 25'):`${({1:'S',2:'D',3:'T'})[d.multiplier]}${d.number}`;}
export function roundHistory(s){
 validateJdc(s);const rows=[];
 for(let i=0;i<s.darts.length;i+=3){const ts=Array.from({length:Math.min(3,s.darts.length-i)},(_,k)=>jdcTarget(i+k)),darts=s.darts.slice(i,i+3),phase=ts[0].phase;
 const bonus=phase!==1&&darts.length===3&&darts.every(d=>d.number===ts[0].number)&&new Set(darts.map(d=>d.multiplier)).size===3?100:0;
 const score=phase===1?darts.reduce((sum,d,k)=>sum+(d.number===ts[k].number&&d.multiplier===2?(ts[k].number===25?100:50):0),0):turnScore(darts,ts[0].number);
 rows.push({phase:phase+1,goal:phase===1?ts.map(t=>t.number===25?'BULL':`D${t.number}`).join(' → '):String(ts[0].number),hits:darts.map(hitLabel),score,bonus,complete:darts.length===3});
 }return rows;
}
export function historyPanel(s){return `<section class="jdc-comparison"><h2>Co dokładnie rzuciłeś</h2><table><thead><tr><th>Etap / cel</th><th>Lotka 1</th><th>Lotka 2</th><th>Lotka 3</th><th>Punkty</th><th>Bonus w wyniku</th></tr></thead><tbody>${roundHistory(s).map(r=>`<tr><th>${r.phase} · ${r.goal}${r.complete?'':' · w toku'}</th>${[0,1,2].map(i=>`<td>${r.hits[i]??'—'}</td>`).join('')}<td>${r.score}</td><td>${r.bonus?'+100 · Shanghai':'—'}</td></tr>`).join('')}</tbody></table><p>S = pojedyncza, D = podwójna, T = potrójna. Bonus jest już zawarty w punktach kolejki. Nieznane pole oznacza tylko zgłoszone nietrafienie celu.</p></section>`;}
