let context;
let enabled=true;
try { enabled=localStorage.getItem('dart-party-sound')!=='off'; } catch {}
export const soundEnabled=()=>enabled;
export function toggleSound(){enabled=!enabled;try{localStorage.setItem('dart-party-sound',enabled?'on':'off');}catch{}if(enabled)playSound('turn');else {try{window.speechSynthesis?.cancel();}catch{}}return enabled;}
export function playSound(kind){
  if(!enabled)return;
  try{
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return;
    context??=new Audio();
    const play=()=>{
      const notes=kind==='shanghai'?[392,523,659,784,1047,1319]:kind==='win'?[523,659,784,1047]:kind==='turn'?[659,880]:[520];
      notes.forEach((frequency,i)=>{
        const start=context.currentTime+i*(kind==='shanghai'?.11:.16), duration=kind==='hit'?.065:((kind==='win'&&i===3)||(kind==='shanghai'&&i===5))?.5:.14;
        const oscillator=context.createOscillator(),gain=context.createGain();
        oscillator.frequency.value=frequency;oscillator.type=kind==='shanghai'?'triangle':'sine';
        gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.18,start+.012);gain.gain.exponentialRampToValueAtTime(.001,start+duration);
        oscillator.connect(gain);gain.connect(context.destination);oscillator.start(start);oscillator.stop(start+duration+.02);
        oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
      });
    };
    if(context.state==='suspended')context.resume().then(play).catch(()=>{});else play();
  }catch{}
}

function speak(text, excited=false){
  if(!enabled || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window))return;
  try{
    const speech=window.speechSynthesis;
    speech.cancel();
    const phrase=new SpeechSynthesisUtterance(text);
    phrase.lang='pl-PL';phrase.rate=excited?1.18:1.06;phrase.pitch=excited?1.22:1.05;phrase.volume=1;
    const polish=speech.getVoices().filter(voice=>/^pl(?:-|_)/i.test(voice.lang)||voice.lang==='pl');
    const voice=polish.find(voice=>voice.localService)||polish[0];
    if(voice)phrase.voice=voice;
    speech.speak(phrase);
  }catch{ /* Speech must never block the game. */ }
}
const fewPoints=n=>n%10>=2 && n%10<=4 && !(n%100>=12 && n%100<=14);
const pointWord=n=>n===1?'punkt':fewPoints(n)?'punkty':'punktów';
export function speakPlayer(playerName, victory=false, remaining=null){
  const name=playerName.toLocaleLowerCase('pl-PL');
  let points='';
  if(!victory && Number.isInteger(remaining) && remaining>0){
    points=` Do zwycięstwa ${remaining===1?'został':fewPoints(remaining)?'zostały':'zostało'} ${remaining} ${pointWord(remaining)}.`;
  }
  speak(`${victory?'Wygrywa':'Teraz rzuca'} ${name}${victory?'! Brawo!':'.'}${points}`,victory);
}
export function speakTurn(playerName, points, bust=false, cutthroat=false){
  const name=playerName.toLocaleLowerCase('pl-PL');
  speak(bust?`${name}. Przekroczony wynik. Kolejka za zero punktów.`:cutthroat?`${name}. Rywalom dopisano łącznie ${points} ${pointWord(points)}.`:`${name}. Wynik kolejki: ${points} ${pointWord(points)}.`);
}
// Prime voice discovery before the first user-triggered announcement.
try{window.speechSynthesis?.getVoices();}catch{}

export function speakShanghai(playerName, number, points, cutthroat=false, bust=false, victory=false){
  const outcome=victory?' I zwycięstwo!':bust?' Ale przekroczony wynik. Kolejka za zero.':cutthroat?` Rywalom dopisano łącznie ${points} ${pointWord(points)}!`:` ${points} ${pointWord(points)} w kolejce!`;
  speak(`Szanghaj! ${playerName.toLocaleLowerCase('pl-PL')}! Ale petarda! Pojedyncza, podwójna i potrójna ${number}!${outcome}`,true);
}
