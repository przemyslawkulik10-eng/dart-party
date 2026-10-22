import test from 'node:test';
import assert from 'node:assert/strict';
import {coachAudioCue} from '../src/coach-match-audio.js';
const base={winner:null,current:0,ready:false,players:[{name:'Przemek',score:501}],turnPoints:0};
test('coach audio speaks only at start, human visit end, return to human, and win',()=>{
 assert.match(coachAudioCue(base).text,/Przemek.*501/);
 assert.equal(coachAudioCue(base,base),null);
 const ready={...base,ready:true,turnPoints:60};assert.match(coachAudioCue(ready,base).text,/60/);
 assert.equal(coachAudioCue(ready,ready),null);
 const bot={...base,current:1};assert.equal(coachAudioCue(bot,ready),null);
 assert.equal(coachAudioCue({...bot,turnPoints:20},bot),null);
 assert.match(coachAudioCue(base,{...bot,ready:true,turnPoints:45}).text,/Trener: 45.*Twoja kolej/);
 const won={...base,winner:0};assert.equal(coachAudioCue(won,base).sound,'win');assert.equal(coachAudioCue(won,won),null);
 assert.match(coachAudioCue({...ready,bust:true},base).text,/Fura/);
});
