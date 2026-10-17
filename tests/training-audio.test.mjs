import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createJdc,recordJdcDart} from '../src/jdc.js';
import {jdcPrompt,jdcAnnouncement,sectorTurn,sectorResult} from '../src/training-audio.js';
const profile={id:'11111111-1111-4111-8111-111111111111',name:'Przemek'};
function at(n){let s=createJdc(profile,false,0);for(let i=0;i<n;i++)s=recordJdcDart(s,0,1,i+1);return s;}
test('JDC announces next target at all phase boundaries, including single attempt bull',()=>{
 assert.match(jdcPrompt(at(0)),/10.*1 z trzech/);
 assert.match(jdcPrompt(at(18)),/podwójne 1.*Jedna lotka/);
 assert.match(jdcPrompt(at(38)),/BULL, 50.*Jedna lotka/);
 assert.match(jdcPrompt(at(39)),/15.*1 z trzech/);
 assert.equal(jdcPrompt(at(57)),'');
});
test('JDC announces actual award, Shanghai bonus and next target in one phrase',()=>{
 let s=at(0);s=recordJdcDart(s,10,1,1);s=recordJdcDart(s,10,2,2);
 const text=jdcAnnouncement(s,recordJdcDart(s,10,3,3));
 assert.match(text,/Szanghaj/);assert.match(text,/130 punktów/);assert.match(text,/Celuj w 11/);
 const bull=at(38);assert.match(jdcAnnouncement(bull,recordJdcDart(bull,25,2,39)),/100 punktów.*Celuj w 15/);
 assert.match(jdcAnnouncement(bull,recordJdcDart(bull,25,1,39)),/0 punktów/);
});
test('completion announces total without a nonexistent next dart; sector result has no invented accuracy',()=>{
 const s=at(56),text=jdcAnnouncement(s,recordJdcDart(s,20,3,57));
 assert.match(text,/zakończona.*60 punktów/);assert.doesNotMatch(text,/Celuj/);
 assert.doesNotMatch(sectorResult({name:'A',darts:[]}),/procent/);
 assert.match(sectorTurn({darts:[{number:20},{number:20},{number:20}]}),/Wszystkie trzy/);
});
test('training speech respects mute, replaces prior speech and supports cancellation',async()=>{
 let cancellations=0;const phrases=[];
 globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
 globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
 globalThis.window={SpeechSynthesisUtterance:globalThis.SpeechSynthesisUtterance,speechSynthesis:{cancel:()=>cancellations++,getVoices:()=>[],speak:p=>phrases.push(p)}};
 const {speakTraining,toggleSound,stopSpeech}=await import('../src/sound.js');
 speakTraining('Celuj w 10');assert.equal(phrases[0].text,'Celuj w 10');assert.equal(phrases[0].lang,'pl-PL');
 toggleSound();speakTraining('Nie czytaj');assert.equal(phrases.length,1);
 toggleSound();speakTraining('Celuj w 11');assert.equal(phrases.length,2);
 stopSpeech();assert.ok(cancellations>=4);
});
