import {createJdc,validateJdc,jdcStats,loadJdc,JDC_KEY} from './jdc.js';
export function createDuel(profiles,coach=false,now=Date.now()){
 if(profiles.length!==2||profiles[0].id===profiles[1].id)throw new Error('Wybierz dwóch różnych graczy.');
 const matchId=crypto.randomUUID();return profiles.map((p,seat)=>({...createJdc(p,coach,now),matchId,seat}));
}
export function duelPlayers(session,history){
 if(!session.matchId)return null;
 const players=history.filter(s=>s.matchId===session.matchId).sort((a,b)=>a.seat-b.seat);
 if(players.length!==2||players[0].seat!==0||players[1].seat!==1||players[0].profileId===players[1].profileId)throw new Error('Niepełny zapis pojedynku JDC.');
 players.forEach(validateJdc);return players;
}
export function nextPlayer(players){return players.filter(p=>p.darts.length<57).sort((a,b)=>a.darts.length-b.darts.length||a.seat-b.seat)[0]??null;}
export function previousPlayer(players){return players.filter(p=>p.darts.length>0).sort((a,b)=>b.darts.length-a.darts.length||b.seat-a.seat)[0]??null;}
export function duelResult(players){if(players.some(p=>p.darts.length<57))return null;const scores=players.map(p=>jdcStats(p).score);return scores[0]===scores[1]?{tie:true,winner:null}:{tie:false,winner:players[scores[0]>scores[1]?0:1]};}
export function saveNewDuel(players){const all=loadJdc();players.forEach(validateJdc);duelPlayers(players[0],players);if(players.some(p=>all.some(x=>x.id===p.id)))throw new Error('Pojedynek już zapisany.');localStorage.setItem(JDC_KEY,JSON.stringify([...players,...all]));}
