import test from 'node:test';
import assert from 'node:assert/strict';
import {createCameraGameSession} from '../src/camera-game-session.js';
const config=apply=>({owner:{isConnected:true},game:'501',sessionId:'match-1',player:0,label:'Gracz 1',apply});
const dart={number:20,multiplier:3};
test('each render revises context and refuses stale or disconnected owners',()=>{
 const s=createCameraGameSession();let calls=0;const c=config(()=>calls++);
 const a=s.bindCameraGame(c);const b=s.bindCameraGame({...c,player:1});assert.ok(b.revision>a.revision);
 assert.throws(()=>s.applyCameraDart(dart,a.revision),/zmieniła/);assert.equal(calls,0);
 c.owner.isConnected=false;assert.equal(s.getCameraGame(),null);assert.throws(()=>s.applyCameraDart(dart,b.revision),/zmieniła/);
 c.owner.isConnected=true;s.bindCameraGame({...c,blocked:true});assert.equal(s.getCameraGame(),null);
 s.bindCameraGame(null);assert.equal(s.getCameraGame(),null);
});
test('mapping failure allows correction; successful application consumes its revision',()=>{
 const s=createCameraGameSession(),received=[];const c=config(x=>received.push(x));const a=s.bindCameraGame(c);
 assert.throws(()=>s.applyCameraDart({number:25,multiplier:3},a.revision),/Nieprawidłowe/);assert.equal(s.getCameraGame().revision,a.revision);
 assert.deepEqual(s.applyCameraDart(dart,a.revision),dart);assert.deepEqual(received,[dart]);
 assert.throws(()=>s.applyCameraDart(dart,a.revision),/zmieniła/);assert.equal(received.length,1);
 const b=s.bindCameraGame({...c,game:'cyferki',target:20});s.applyCameraDart(dart,b.revision);assert.deepEqual(received[1],{value:3});
});
test('rebind by existing handler is retained and double/reentrant replay is rejected',()=>{
 const s=createCameraGameSession();let a,newBinding,calls=0;
 a=s.bindCameraGame(config(()=>{calls++;assert.throws(()=>s.applyCameraDart(dart,a.revision),/zapisywany/);newBinding=s.bindCameraGame({...config(()=>{}),player:1});}));
 s.applyCameraDart(dart,a.revision);assert.equal(calls,1);assert.equal(s.getCameraGame().revision,newBinding.revision);assert.equal(s.getCameraGame().player,1);
 assert.throws(()=>s.applyCameraDart(dart,a.revision),/zmieniła/);
});
test('handler failures propagate and cannot replay partially applied work; async is forbidden',()=>{
 const s=createCameraGameSession();let calls=0;
 const a=s.bindCameraGame(config(()=>{calls++;throw new Error('storage-full');}));
 assert.throws(()=>s.applyCameraDart(dart,a.revision),/storage-full/);assert.equal(calls,1);assert.throws(()=>s.applyCameraDart(dart,a.revision),/zmieniła/);
 assert.throws(()=>s.bindCameraGame(config(async()=>{})),/powiązanie/);
 const b=s.bindCameraGame(config(()=>Promise.resolve()));assert.throws(()=>s.applyCameraDart(dart,b.revision),/synchroniczny/);
 const c=s.bindCameraGame(config(()=>false));assert.throws(()=>s.applyCameraDart(dart,c.revision),/nie przyjęła/);
});
test('subscription exposes immutable context without callback and unsubscribes',()=>{
 const s=createCameraGameSession(),events=[];const off=s.subscribeCameraGame(c=>events.push(c));
 const a=s.bindCameraGame(config(()=>{}));assert.equal(events[0],null);assert.equal(events[1].revision,a.revision);assert.equal(events[1].apply,undefined);assert.ok(Object.isFrozen(events[1]));
 s.applyCameraDart(dart,a.revision);assert.equal(events.length,3);off();s.bindCameraGame(null);assert.equal(events.length,3);
});

test('actual JDC camera hook fills the first empty draft slot and preserves existing entries',async()=>{
 const {readFileSync}=await import('node:fs'),{default:vm}=await import('node:vm');
 const source=readFileSync(new URL('../src/jdc-ui.js',import.meta.url),'utf8'),s=createCameraGameSession(),owner={isConnected:true};
 const existing={number:10,multiplier:2};let next;
 const ctx=vm.createContext({bindCameraGame:s.bindCameraGame,$:()=>owner,current:{id:'jdc-1',profileId:'p1',name:'A',endedAt:null,draft:[existing,null]},disposed:false,targets:[{},{},{}],setDraft:value=>{next=value;}});
 vm.runInContext(source.slice(source.indexOf('  bindCameraGame('),source.indexOf('\n }\n function result')),ctx);
 s.applyCameraDart({number:7,multiplier:1},s.getCameraGame().revision);
 assert.equal(next[0],existing);assert.deepEqual({...next[1]},{number:7,multiplier:1});assert.equal(next[2],null);
 ctx.disposed=true;assert.throws(()=>s.applyCameraDart(dart,s.getCameraGame().revision),/nie jest aktywna/);
});

test('actual training action rechecks pause/deadline and records raw off-target camera fields',async()=>{
 const {readFileSync}=await import('node:fs'),{default:vm}=await import('node:vm');
 const {createTraining,recordTrainingDart,remainingTime,finishTraining,pauseTraining}=await import('../src/training.js');
 const source=readFileSync(new URL('../src/training-ui.js',import.meta.url),'utf8');let saved=0,ended=0;
 const ctx=vm.createContext({current:createTraining('A',5),disposed:false,awaitingNext:false,remainingTime,finishTraining,recordTrainingDart,stopSpeech:()=>{},game:()=>{},playSound:()=>{},result:()=>ended++});
 ctx.store=next=>{ctx.current=next;saved++;};
 vm.runInContext(source.slice(source.indexOf('  function recordHit('),source.indexOf("  root.querySelectorAll('[data-sector-hit]')")),ctx);
 assert.equal(ctx.recordHit(7,2),true);assert.equal(ctx.current.darts[0].number,7);assert.equal(ctx.current.darts[0].multiplier,2);assert.equal(ctx.current.darts[0].unknownMiss,undefined);
 ctx.current=pauseTraining(ctx.current);assert.throws(()=>ctx.recordHit(20,1),/Wznów/);assert.equal(saved,1);
 ctx.current={...ctx.current,remainingMs:0};assert.equal(ctx.recordHit(20,1),false);assert.equal(ended,1);assert.equal(ctx.current.darts.length,1);
});


test('broken camera subscribers cannot interrupt a game write or mask its original error',()=>{
 const reported=[],states=[],s=createCameraGameSession({onListenerError:error=>reported.push(error.message)});let writes=0;
 s.subscribeCameraGame(()=>{throw new Error('broken-camera-view');});
 s.subscribeCameraGame(state=>states.push(state));
 const a=s.bindCameraGame(config(()=>{writes++;}));
 assert.deepEqual(s.applyCameraDart(dart,a.revision),dart);assert.equal(writes,1);
 assert.equal(states.length,3);assert.equal(reported.length,3);
 const b=s.bindCameraGame(config(()=>{throw new Error('storage-full');}));
 assert.throws(()=>s.applyCameraDart(dart,b.revision),/storage-full/);
 assert.equal(states.length,5);assert.equal(reported.length,5);
});


test('account change invalidates the camera binding even while its DOM stays connected',async()=>{
 const {useAccount,accountOwner}=await import('../src/account-storage.js');
 const previous=accountOwner(),a='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',b='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';let writes=0;
 try{
  useAccount(a);const s=createCameraGameSession(),owner={isConnected:true};const first=s.bindCameraGame({...config(()=>writes++),owner});
  useAccount(b);assert.equal(owner.isConnected,true);assert.equal(s.getCameraGame(),null);
  assert.throws(()=>s.applyCameraDart(dart,first.revision),/zmieniła/);assert.equal(writes,0);
  useAccount(a);assert.equal(s.getCameraGame(),null);
  const second=s.bindCameraGame({...config(()=>writes++),owner});useAccount(null);
  assert.throws(()=>s.applyCameraDart(dart,second.revision),/zmieniła/);assert.equal(writes,0);
 }finally{useAccount(previous);}
});
