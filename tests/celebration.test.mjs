import {test} from 'node:test';
import assert from 'node:assert/strict';
const spoken=[],notes=[];
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
globalThis.window={SpeechSynthesisUtterance, speechSynthesis:{cancel(){},getVoices:()=>[],speak:u=>spoken.push(u)},AudioContext:class{
 currentTime=0;state='running';destination={};
 createOscillator(){return {frequency:{},connect(){},start(){notes.push(1)},stop(){},disconnect(){}};}
 createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
}};
const {speakTurn,toggleSound}=await import('../src/sound.js');
test('X01 cheers for 100+, special maximum, no cheer for bust or Cricket; mute respected',()=>{
 for(const [score,bust,celebrate,expectedNotes] of [[99,false,true,0],[100,false,true,4],[140,false,true,4],[180,false,true,6],[100,true,true,0],[180,false,false,0]]){
  spoken.length=0;notes.length=0;
  speakTurn('PRZEMEK',score,bust,false,' Podpowiedź.',celebrate);
  assert.equal(notes.length,expectedNotes);
  assert.equal(spoken[0].rate,expectedNotes?1.02:1.06);
  assert.equal(/Brawo, przemek!/.test(spoken[0].text),expectedNotes>0);
  if(score===100&&expectedNotes)assert.match(spoken[0].text,/^Jeeest! Setka! Brawo, przemek!/);
  if(score===140&&expectedNotes)assert.match(spoken[0].text,/^Ooo, pięknie! 140 punktów!/);
  if(score===180&&expectedNotes)assert.match(spoken[0].text,/Maksimum!/);
  assert.match(spoken[0].text,/Podpowiedź\.$/);
 }
 toggleSound();spoken.length=0;notes.length=0;speakTurn('PRZEMEK',100,false,false,'',true);
 assert.equal(spoken.length,0);assert.equal(notes.length,0);
});
