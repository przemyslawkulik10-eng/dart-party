// Identity colours stay the same when the throwing order changes.
const PALETTE = [
  {name:'pomarańczowy',accent:'#ffc080',muted:'#29252a',active:'#65452e'},
  {name:'zielony',accent:'#b0dba1',muted:'#152d31',active:'#315943'},
  {name:'niebieski',accent:'#91ceff',muted:'#142d49',active:'#27537b'},
  {name:'fioletowy',accent:'#d8b3f2',muted:'#29263e',active:'#534366'},
  {name:'złoty',accent:'#efd28c',muted:'#2e2d2b',active:'#5e5335'},
  {name:'turkusowy',accent:'#97dfd6',muted:'#173035',active:'#2b5b60'},
];
const KNOWN = {jarek:0,jaco:0,jaroslaw:0,maciek:1,maciej:1,przemek:2,przemyslaw:2,maniek:3,mariusz:3,dawid:4};
export function playerColor(name) {
  const key=String(name??'').trim().toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
  let index=KNOWN[key];
  if(index===undefined){let hash=0;for(const c of key)hash=(hash*31+c.codePointAt(0))>>>0;index=hash%PALETTE.length;}
  return {...PALETTE[index]};
}
function paint(element,name,active=false){
  if(!element)return;
  const color=playerColor(name);
  element.classList.add('player-coloured');
  element.classList.toggle('player-colour-active',active);
  element.style.setProperty('--player-accent',color.accent);
  element.style.setProperty('--player-muted',color.muted);
  element.style.setProperty('--player-active',color.active);
}
export function applyPlayerColors(root,state){
  if(!root||!state?.players)return;
  root.querySelectorAll('.scoreboard .player-card').forEach((card,i)=>{
    if(state.players[i])paint(card,state.players[i].name,i===state.current);
  });
  root.querySelectorAll('.cricket-board tr').forEach(row=>{
    [...row.children].filter(cell=>!cell.classList.contains('field-col')).forEach((cell,i)=>{
      if(state.players[i])paint(cell,state.players[i].name,i===state.current);
    });
  });
  const current=state.players[state.current];
  if(current)root.querySelectorAll('.turn-header').forEach(header=>paint(header,current.name,true));
}
