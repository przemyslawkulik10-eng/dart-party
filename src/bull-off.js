// Replay the starting contest so undo also works across tie-break rounds.
export function bullState(count, throws) {
  let contenders=Array.from({length:count},(_,i)=>i), round=1, scores={}, slots=[], cursor=0, winner=null;
  for(const value of throws){
    if(winner!==null || ![0,25,50].includes(value)) throw new Error('Nieprawidłowy rzut o start.');
    slots.push(value); const player=contenders[Math.floor(cursor/3)];
    scores[player]=(scores[player]||0)+value; cursor++;
    if(cursor===contenders.length*3){
      const max=Math.max(...contenders.map(i=>scores[i]||0));
      const leaders=contenders.filter(i=>(scores[i]||0)===max);
      if(leaders.length===1) winner=leaders[0];
      else {contenders=leaders;round++;scores={};slots=[];cursor=0;}
    }
  }
  return {contenders,round,scores,winner,current:winner===null?contenders[Math.floor(cursor/3)]:winner,turn:slots.slice(Math.floor(cursor/3)*3),cursor};
}
