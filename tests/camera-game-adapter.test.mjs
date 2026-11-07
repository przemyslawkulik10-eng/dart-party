import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {CAMERA_GAMES,CAMERA_MODES,cameraDartInput,cameraContextKey,createCameraReview} from '../src/camera-game-adapter.js';
import {createCameraGameSession} from '../src/camera-game-session.js';
import {createMatch,recordDart,replay} from '../src/engine.js';
import {createCyferki,chooseCyferki,throwCyferki,cyferkiState} from '../src/cyferki.js';
import {createMnoznik,throwMnoznik,mnoznikState} from '../src/mnoznik.js';
import {createMnoznikSparing,throwMnoznikSparing,mnoznikSparingState} from '../src/mnoznik-sparing.js';
import {createJdc,jdcStats} from '../src/jdc.js';
import {commitRound} from '../src/jdc-round.js';
import {createTraining,recordTrainingDart,trainingStats} from '../src/training.js';
import {saveCyferki,loadCyferki} from '../src/cyferki.js';
import {saveMnoznik,loadMnoznik} from '../src/mnoznik.js';
import {saveMnoznikSparing,loadMnoznikSparing} from '../src/mnoznik-sparing.js';
globalThis.crypto??=webcrypto;
const dart=(number,multiplier=1)=>({number,multiplier});
const profiles=()=>['A','B'].map(name=>({id:crypto.randomUUID(),name}));
const context=revision=>cameraContextKey({game:'501',sessionId:'match-1',revision,player:0,generation:1});

test('camera fields reach all eight existing game engines without changing their scoring rules',()=>{
 assert.equal(CAMERA_GAMES.length,8);
 for(const game of ['501','301','201','cricket']){
  let m=createMatch(['A','B'],game);const d=cameraDartInput(dart(20,3),{game});m=recordDart(m,d.number,d.multiplier);
  const s=replay(m);assert.equal(s.players[0].darts,1);
  if(game==='cricket')assert.equal(s.players[0].marks[20],3);else assert.equal(s.players[0].score,Number(game)-60);
 }
 let c=chooseCyferki(createCyferki(profiles(),{scoring:'hits',progress:'player'},1),7,2);
 for(const d of [dart(19,3),dart(7),dart(7,2)])c=throwCyferki(c,cameraDartInput(d,{game:'cyferki',target:cyferkiState(c).target}).value,3);
 assert.equal(cyferkiState(c).scores[0],3);assert.deepEqual(cyferkiState(c).closed,[7]);
 let m=createMnoznik(profiles()[0],1);
 for(const d of [dart(7),dart(7,2),dart(7,3),dart(20,3),dart(25),dart(25,2)])m=throwMnoznik(m,cameraDartInput(d,{game:'mnoznik',...mnoznikState(m)}).value,2);
 assert.equal(mnoznikState(m).total,810);
 const j=createJdc(profiles()[0],false,1);
 const jdc=commitRound(j,[dart(10),dart(10,2),dart(10,3)].map(d=>cameraDartInput(d,{game:'jdc'})),2);
 assert.equal(jdcStats(jdc).score,160);assert.equal(j.darts.length,0);
 let training=createTraining('A',5,1);
 for(const d of [dart(20,3),dart(19)]){const value=cameraDartInput(d,{game:'sector-20'});training=recordTrainingDart(training,value.number,value.multiplier,2);}
 assert.deepEqual(trainingStats(training),{throws:2,hits:1,accuracy:50});assert.equal(training.darts[1].number,19);assert.equal(training.darts[1].unknownMiss,undefined);
});

test('Mnożnik sparing retains player and phase boundaries, bull has two marks',()=>{
 let m=createMnoznikSparing(profiles(),1);
 for(const d of [dart(7),dart(7),dart(19)])m=throwMnoznikSparing(m,cameraDartInput(d,{game:'mnoznik-sparing',...mnoznikSparingState(m)}).value,2);
 assert.equal(mnoznikSparingState(m).current,1);assert.equal(mnoznikSparingState(m).phase,'hits');
 assert.deepEqual(cameraDartInput(dart(25,2),{game:'cyferki',target:25}),{value:2});
 assert.deepEqual(cameraDartInput(dart(1),{game:'jdc-duel'}),dart(1));
});

test('invalid fields, unknown targets, blocked turns and locked cricket20 cannot silently change scores',()=>{
 for(const d of [null,dart(25,3),dart(50),dart(0,2),dart(21),dart('20'),dart(20,1.5)])assert.throws(()=>cameraDartInput(d,{game:'501'}));
 assert.throws(()=>cameraDartInput(dart(7),{game:'cyferki',target:null}));
 assert.throws(()=>cameraDartInput(dart(7),{game:'mnoznik',phase:'unknown',target:7}));
 assert.throws(()=>cameraDartInput(dart(7),{game:'501',blocked:true}));
 assert.throws(()=>cameraDartInput(dart(20,3),{game:'cricket',twentyLocked:true}));
 assert.deepEqual(cameraDartInput(dart(0),{game:'cricket',twentyLocked:true}),dart(0));
 assert.throws(()=>cameraDartInput(dart(7),{game:'unknown'}));
});

test('starting bull contest uses physical 25/50 and explicit off-bull hits as zero',()=>{
 assert.equal(CAMERA_GAMES.length,8);assert.equal(CAMERA_MODES.includes('bull-off'),true);
 assert.deepEqual(cameraDartInput(dart(25),{game:'bull-off'}),{value:25});
 assert.deepEqual(cameraDartInput(dart(25,2),{game:'bull-off'}),{value:50});
 assert.deepEqual(cameraDartInput(dart(20,3),{game:'bull-off'}),{value:0});
 assert.deepEqual(cameraDartInput(dart(0),{game:'bull-off'}),{value:0});
 assert.throws(()=>cameraDartInput(null,{game:'bull-off'}));
 assert.ok(cameraContextKey({game:'bull-off',sessionId:'contest',revision:1,player:0}));
});

test('review requires explicit confirmation, permits corrected fields and never deduplicates equal physical scores',()=>{
 const review=createCameraReview({now:()=>1000}),key=context(0),input=[dart(7),dart(7),dart(19)];
 const proposed=review.propose({id:'frame1',contextKey:key,capturedAt:900,darts:input});input[0].number=20;proposed.darts[1].number=20;
 assert.deepEqual(review.pending.darts,[dart(7),dart(7),dart(19)]);
 assert.throws(()=>review.confirm({id:'frame1',contextKey:key}));
 assert.deepEqual(review.confirm({id:'frame1',contextKey:key,confirmed:true,darts:[dart(17,3),dart(20,3),dart(17)]}),[dart(17,3),dart(20,3),dart(17)]);
 assert.equal(review.pending,null);
 assert.throws(()=>review.confirm({id:'frame1',contextKey:key,confirmed:true}));
 assert.throws(()=>review.propose({id:'frame1',contextKey:context(3),capturedAt:950,darts:[dart(7)]}));
 review.propose({id:'frame2',contextKey:context(3),capturedAt:950,darts:[dart(7)]});
 assert.deepEqual(review.confirm({id:'frame2',contextKey:context(3),confirmed:true}),[dart(7)]);
});

test('stale async reads cannot land in a different turn, camera generation, undo revision or game',()=>{
 let time=1000;const review=createCameraReview({now:()=>time,maxAgeMs:500}),key=context(0);
 review.propose({id:'frame1',contextKey:key,capturedAt:900,darts:[dart(7)]});
 for(const changed of [context(1),cameraContextKey({game:'501',sessionId:'match-1',revision:0,player:1,generation:1}),cameraContextKey({game:'501',sessionId:'match-1',revision:0,player:0,generation:2}),cameraContextKey({game:'cricket',sessionId:'match-1',revision:0,player:0,generation:1})])assert.throws(()=>review.confirm({id:'frame1',contextKey:changed,confirmed:true}));
 time=1401;assert.throws(()=>review.confirm({id:'frame1',contextKey:key,confirmed:true}));
 assert.throws(()=>review.propose({id:'old',contextKey:key,capturedAt:900,darts:[dart(7)]}));
 assert.throws(()=>review.propose({id:'future',contextKey:key,capturedAt:1500,darts:[dart(7)]}));
});

test('empty detection is not a miss; replacing, clearing and rejecting reviews prevents replay',()=>{
 const review=createCameraReview({now:()=>1000}),key=context(0);
 for(const darts of [[],[null],new Array(3),[dart(7),,dart(19)],[dart(7),dart(7),dart(7),dart(7)]])assert.throws(()=>review.propose({id:'bad',contextKey:key,capturedAt:950,darts}));
 review.propose({id:'one',contextKey:key,capturedAt:950,darts:[dart(7)]});
 assert.throws(()=>review.confirm({id:'one',contextKey:key,confirmed:true,darts:new Array(3)}));
 assert.throws(()=>review.confirm({id:'one',contextKey:key,confirmed:true,darts:[dart(7),,dart(19)]}));
 review.propose({id:'two',contextKey:key,capturedAt:950,darts:[dart(7)]});
 assert.throws(()=>review.propose({id:'one',contextKey:key,capturedAt:950,darts:[dart(7)]}));
 assert.equal(review.reject('wrong'),false);assert.equal(review.reject('two'),true);
 assert.throws(()=>review.propose({id:'two',contextKey:key,capturedAt:950,darts:[dart(7)]}));
 review.propose({id:'three',contextKey:key,capturedAt:950,darts:[dart(0)]});review.clear();
 assert.throws(()=>review.confirm({id:'three',contextKey:key,confirmed:true}));
 assert.throws(()=>review.propose({id:'three',contextKey:key,capturedAt:950,darts:[dart(0)]}));
});

test('actual Cyferki, Mnożnik and coach camera handlers persist through existing engines and reject obsolete renders',()=>{
 const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const cases=[
  {file:'cyferki-ui.js',match:chooseCyferki(createCyferki(profiles(),{scoring:'hits',progress:'player'},1),7,2),state:cyferkiState,save:saveCyferki,load:loadCyferki,hit:dart(7,2),check:m=>assert.equal(cyferkiState(m).scores[0],2)},
  {file:'mnoznik.js',match:createMnoznik(profiles()[0],1),state:mnoznikState,save:saveMnoznik,load:loadMnoznik,hit:dart(7,3),check:m=>assert.equal(mnoznikState(m).rounds[0].multiplier,3)},
  {file:'mnoznik-sparing.js',match:createMnoznikSparing(profiles(),1),state:mnoznikSparingState,save:saveMnoznikSparing,load:loadMnoznikSparing,hit:dart(7,2),check:m=>assert.equal(mnoznikSparingState(m).states[0].rounds[0].multiplier,2)},
  {file:'coach-match-ui.js',match:createMatch(['A','Trener'],'301'),state:replay,save:m=>data.set('coach',JSON.stringify(m)),load:()=>[JSON.parse(data.get('coach'))],hit:dart(20,3),check:m=>assert.equal(replay(m).players[0].score,241)}
 ];
 for(const entry of cases){
  const source=readFileSync(new URL('../src/'+entry.file,import.meta.url),'utf8');
  const start=source.indexOf('const applyHit='),end=source.indexOf(entry.file==='cyferki-ui.js'?"\n  root.querySelectorAll('[data-cy-hit]')":'const hit=',start);
  assert.ok(start>=0&&end>start,entry.file);
  const binding=source.split('\n').find(line=>line.trim().startsWith('bindCameraGame({'));
  assert.ok(binding,entry.file);
  const session=createCameraGameSession(),owner={isConnected:true};let renders=0;
  const state=entry.state(entry.match);
  const ctx=vm.createContext({match:entry.match,m:entry.match,s:state,active:{name:'A'},bot:false,done:false,disposed:false,root:{firstElementChild:owner},
   bindCameraGame:session.bindCameraGame,throwCyferki,cyferkiState,throwMnoznik,mnoznikState,throwMnoznikSparing,mnoznikSparingState,recordDart,
   playSound:()=>{},speakTraining:()=>{},cue:()=>'',multiplier:3,mult:3,game:()=>{renders++;},render:()=>{renders++;}});
  const store=next=>{entry.save(next);ctx.match=next;ctx.m=next;};ctx.store=store;ctx.save=store;
  vm.runInContext(source.slice(start,end),ctx);vm.runInContext(binding,ctx);
  const revision=session.getCameraGame().revision;
  session.applyCameraDart(entry.hit,revision);entry.check(entry.load()[0]);assert.equal(renders,1);
  assert.throws(()=>session.applyCameraDart(entry.hit,revision),/kolejka zmieniła/);
  assert.equal(ctx.multiplier===1||ctx.mult===1||entry.file==='cyferki-ui.js',true);
  owner.isConnected=false;assert.equal(session.getCameraGame(),null);
  owner.isConnected=true;ctx.disposed=true;vm.runInContext(binding,ctx);assert.equal(session.getCameraGame(),null);
  ctx.disposed=false;ctx.bot=true;
  if(entry.file!=='mnoznik.js'){vm.runInContext(binding,ctx);assert.equal(session.getCameraGame(),null);}
  ctx.bot=false;
  if(entry.file==='cyferki-ui.js'){ctx.s={...state,target:null};vm.runInContext(binding,ctx);assert.equal(session.getCameraGame(),null);ctx.s=state;}
  ctx.store=ctx.save=()=>{throw Error('Brak miejsca na zapis');};vm.runInContext(binding,ctx);
  const failedRevision=session.getCameraGame().revision;
  assert.throws(()=>session.applyCameraDart(entry.hit,failedRevision),/Brak miejsca na zapis/);
  assert.throws(()=>session.applyCameraDart(entry.hit,failedRevision),/kolejka zmieniła/);
  entry.check(entry.load()[0]);
 }
});
