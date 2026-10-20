import {createMatch,replay,recordDart,nextPlayer,validateMatch} from './engine.js';
import {checkout} from './checkout.js';
export function newCoachMatch(name,mode,doubleOut=false,level='calm'){
 const m=createMatch([name,name.toLowerCase()==='trener'?'Trener wirtualny':'Trener'],String(mode),doubleOut);
 return {...m,coachLevel:level};
}
export function coachThrow(match,random=Math.random){
 const s=replay(match);if(s.current!==1||s.ready||s.winner!==null)return match;
 const target=checkout(s.players[1].score,3-s.turn.length,match.doubleOut)?.[0]||{number:20,multiplier:3};
 const accuracy={calm:0.18,regular:0.35,strong:0.55}[match.coachLevel]??0.18;
 const r=random();const d=r<accuracy?target:r<0.85?{number:r<0.6?target.number:5,multiplier:1}:{number:0,multiplier:1};
 return recordDart(match,d.number,d.multiplier);
}
export function coachTurn(match,random=Math.random){
 let m=match,s=replay(m);if(s.ready&&s.current===0)m=nextPlayer(m);
 while((s=replay(m)).current===1&&!s.ready&&s.winner===null)m=coachThrow(m,random);
 s=replay(m);if(s.ready&&s.winner===null)m=nextPlayer(m);return m;
}
// Rewind the opponent's reply and the most recent human dart as one correction.
export function undoHuman(match){
 let m={...match,events:[]},last=-1;
 match.events.forEach((e,i)=>{if(e.type==='dart'&&replay(m).current===0)last=i;m={...m,events:[...m.events,e]};});
 return last<0?match:{...match,events:match.events.slice(0,last),updatedAt:new Date().toISOString()};
}
export function matchInsight(matches){
 const recent=matches.filter(m=>Date.parse(m.updatedAt)>=Date.now()-30*86400000&&Date.parse(m.updatedAt)<=Date.now());
 let darts=0,points=0,finished=0;
 for(const m of recent){validateMatch(m);const s=replay(m);darts+=s.players[0].darts;points+=s.players[0].scored;if(s.winner!==null)finished++;}
 return {darts,finished,average:darts?Math.round(points/darts*30)/10:null};
}
