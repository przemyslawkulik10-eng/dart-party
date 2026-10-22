// Announce game boundaries, not every render or every opponent dart.
export function coachAudioCue(state,previous=null){
 if(state.winner!==null)return previous?.winner===state.winner?null:{sound:'win',text:state.winner===0?'Ten leg jest Twój! Dzięki za grę.':'Ten leg dla trenera. Dzięki za grę. Gramy jeszcze czy robisz przerwę?'};
 if(!previous)return {sound:'turn',text:state.current===0?`${state.players[0].name}, Twoja kolej. Do końca ${state.players[0].score}.`:'Teraz rzuca trener.'};
 if(state.current===0&&state.ready&&!previous.ready)return {text:state.bust?'Fura. Wynik wraca do początku kolejki. Teraz trener.':`${state.turnPoints} punktów. Teraz trener.`};
 if(state.current===0&&previous.current===1)return {sound:'turn',text:`${previous.bust?'Trener: fura.':`Trener: ${previous.turnPoints} punktów.`} ${state.players[0].name}, Twoja kolej. Do końca ${state.players[0].score}.`};
 return null;
}
