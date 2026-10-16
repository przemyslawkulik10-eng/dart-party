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
      const notes=kind==='win'?[523,659,784,1047]:kind==='turn'?[659,880]:[520];
      notes.forEach((frequency,i)=>{
        const start=context.currentTime+i*.16, duration=kind==='hit'?.065:kind==='win'&&i===3?.5:.14;
        const oscillator=context.createOscillator(),gain=context.createGain();
        oscillator.frequency.value=frequency;oscillator.type='sine';
        gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.18,start+.012);gain.gain.exponentialRampToValueAtTime(.001,start+duration);
        oscillator.connect(gain);gain.connect(context.destination);oscillator.start(start);oscillator.stop(start+duration+.02);
        oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
      });
    };
    if(context.state==='suspended')context.resume().then(play).catch(()=>{});else play();
  }catch{}
}

// Use the tablet's speech engine; never send player names to an app backend.
export function speakPlayer(playerName, victory=false){
  if(!enabled || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window))return;
  try{
    const speech=window.speechSynthesis;
    speech.cancel();
    const name=playerName.toLocaleLowerCase('pl-PL');
    const phrase=new SpeechSynthesisUtterance(`${victory?'Wygrywa':'Teraz rzuca'} ${name}${victory?'! Brawo!':'.'}`);
    phrase.lang='pl-PL';phrase.rate=1;phrase.pitch=1;phrase.volume=1;
    const voices=speech.getVoices();
    const polish=voices.filter(voice=>/^pl(?:-|_)/i.test(voice.lang)||voice.lang==='pl');
    const voice=polish.find(voice=>voice.localService)||polish[0];
    if(voice)phrase.voice=voice;
    speech.speak(phrase);
  }catch{ /* Scoring and the visual announcement remain available. */ }
}
// Prime voice discovery before the first user-triggered announcement.
try{window.speechSynthesis?.getVoices();}catch{}
