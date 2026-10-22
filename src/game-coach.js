// Virtual rivals have their own identity; never create a real player profile for a bot.
export const coachOpponent=()=>({id:crypto.randomUUID(),name:'Trener'});
export function coachHits(bull=false,random=Math.random){const r=random();return r<0.25?0:r<0.75?1:r<0.9?2:bull?2:3;}
export function coachPoints(random=Math.random){const r=random();return r<0.15?0:r<0.3?5:r<0.75?20:r<0.9?40:60;}
export function undoHumanEvent(match,state,kind){
 let last=-1;
 for(let i=0;i<match.events.length;i++){
  const before=state({...match,events:match.events.slice(0,i)});
  const actor=kind==='cyferki'&&match.events[i].type==='choose'?before.chooser:before.current;
  if(actor===0)last=i;
 }
 return last<0?match:{...match,events:match.events.slice(0,last)};
}
