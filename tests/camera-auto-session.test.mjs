import test from 'node:test';
import assert from 'node:assert/strict';
import {createCameraAutoSession} from '../src/camera-auto-session.js';

const base={sourceKey:'iphone-calibration-1',contextKey:'revision-1',turnKey:'match-1-player-0-visit-0'};
const dart={status:'candidate',point:{x:.4,y:.6},field:{number:19,multiplier:1,nearWire:false},autoEligible:true};
const observe=(s,time,extra={})=>s.observe({...base,time,...extra});
function arm(s,start=0,extra={}){
 assert.equal(observe(s,start,{status:'empty',emptyBoard:true,...extra}).status,'waiting-empty');
 assert.equal(observe(s,start+.35,{status:'empty',emptyBoard:true,...extra}).status,'waiting-empty');
 assert.equal(observe(s,start+.7,{status:'empty',emptyBoard:true,...extra}).status,'armed');
}
function proposed(s,start=1,extra={}){
 assert.equal(observe(s,start,{...dart,...extra}).status,'tracking');
 assert.equal(observe(s,start+.35,{...dart,...extra}).status,'tracking');
 const result=observe(s,start+.7,{...dart,...extra});assert.equal(result.status,'ready');return result;
}

test('requires explicit original-empty board and three fresh stable frames',()=>{
 const s=createCameraAutoSession();
 assert.equal(observe(s,0,{status:'empty'}).status,'waiting-empty');
 assert.equal(observe(s,.35,dart).status,'waiting-empty');
 arm(s,1);
 observe(s,2,dart);observe(s,2.1,dart);
 assert.equal(observe(s,2.2,dart).status,'tracking');
 assert.equal(observe(s,2.7,dart).status,'ready');
});

test('ready token emits once, commits once, and never writes a game itself',()=>{
 const s=createCameraAutoSession();arm(s);const result=proposed(s);
 assert.deepEqual(result.dart,{number:19,multiplier:1});
 result.dart.number=20;assert.equal(observe(s,1.8,dart).status,'awaiting-commit');
 assert.equal(s.commit(result.token,{applied:true}).acceptedDarts,1);
 assert.throws(()=>s.commit(result.token,{applied:true}),/Brak bieżącej/);
 assert.equal(s.state.pendingToken,null);assert.equal(s.state.waitingForEmpty,false);
});

test('failed or uncertain application invalidates ownership and cannot retry a token',()=>{
 const s=createCameraAutoSession();arm(s);const result=proposed(s);
 assert.equal(s.commit(result.token,{applied:false}).status,'blocked');
 assert.equal(s.state.waitingForEmpty,true);
 assert.throws(()=>s.commit(result.token,{applied:true}),/Brak bieżącej/);
 assert.equal(observe(s,2,dart).status,'waiting-empty');
});

test('same-turn revision drops candidate but preserves accepted dart count',()=>{
 const s=createCameraAutoSession();arm(s);const first=proposed(s);s.commit(first.token,{applied:true});
 const second=proposed(s,2,{contextKey:'revision-2'});assert.equal(s.state.acceptedDarts,1);
 observe(s,2.8,{...dart,contextKey:'revision-3'});
 assert.throws(()=>s.commit(second.token,{applied:true}),/Brak bieżącej/);
 assert.equal(s.state.acceptedDarts,1);
});

test('third accepted dart waits for empty and a new turn; same repeated field remains valid',()=>{
 const s=createCameraAutoSession();arm(s);
 for(let i=0;i<3;i++){const p=proposed(s,1+i,{contextKey:`revision-${i+1}`});s.commit(p.token,{applied:true});}
 assert.equal(s.state.acceptedDarts,3);assert.equal(s.state.waitingForEmpty,true);
 assert.equal(observe(s,4,{status:'empty',emptyBoard:true,contextKey:'revision-3'}).status,'waiting-empty');
 observe(s,4.35,{status:'empty',emptyBoard:true,contextKey:'revision-3'});
 assert.equal(observe(s,4.7,{status:'empty',emptyBoard:true,contextKey:'revision-3'}).status,'waiting-turn');
 const next={contextKey:'revision-4',turnKey:'match-1-player-1-visit-1'};arm(s,5,next);
 assert.equal(s.state.acceptedDarts,0);assert.equal(proposed(s,6,next).status,'ready');
});

test('early completion and player change never carry a proposal into the next turn',()=>{
 const s=createCameraAutoSession();arm(s);const result=proposed(s);
 assert.equal(observe(s,1.8,{...dart,turnComplete:true}).status,'waiting-empty');
 assert.throws(()=>s.commit(result.token,{applied:true}),/Brak bieżącej/);
 assert.equal(observe(s,2,{...dart,turnKey:'next-turn',contextKey:'revision-2'}).status,'waiting-empty');
});

test('jitter beyond tolerance or a different field restarts the stability window',()=>{
 const s=createCameraAutoSession();arm(s);
 observe(s,1,dart);observe(s,1.35,dart);
 assert.equal(observe(s,1.7,{...dart,point:{x:.43,y:.6}}).status,'tracking');
 assert.equal(observe(s,2.05,{...dart,point:{x:.43,y:.6},field:{number:17,multiplier:1,nearWire:false}}).status,'tracking');
 assert.equal(observe(s,2.4,dart).status,'tracking');
});

test('wire uncertainty, absent eligibility, invalid points and zero never produce a score',()=>{
 const variants=[{autoEligible:false},{autoEligible:undefined},{field:{number:19,multiplier:1}},
  {field:{number:19,multiplier:1,nearWire:true}},{field:{number:0,multiplier:1,nearWire:false}},
  {field:{number:25,multiplier:3,nearWire:false}},{point:{x:NaN,y:.6}},{point:{x:-.1,y:.6}}];
 for(const extra of variants){const s=createCameraAutoSession();arm(s);
  for(const time of [1,1.35,1.7]){const result=observe(s,time,{...dart,...extra});assert.equal(result.status,'blocked');assert.equal(result.dart,undefined);}
  assert.equal(s.state.pendingToken,null);
 }
});

test('ambiguity, removal, light changes and loss revoke pending tokens without invented zero',()=>{
 for(const status of ['ambiguous','unstable','removed','lighting','lost','uninitialized','stale']){
  const s=createCameraAutoSession();arm(s);const p=proposed(s);
  const result=observe(s,1.8,{status});assert.equal(result.status,'blocked');assert.equal(result.dart,undefined);
  assert.throws(()=>s.commit(p.token,{applied:true}),/Brak bieżącej/);
 }
});

test('frozen or reversed time, source changes and long gaps cannot reuse stable frames',()=>{
 const s=createCameraAutoSession();arm(s);const p=proposed(s);
 assert.equal(observe(s,1.7,dart).status,'blocked');assert.throws(()=>s.commit(p.token,{applied:true}),/Brak bieżącej/);
 assert.equal(observe(s,2,dart).status,'tracking');
 assert.equal(observe(s,4,dart).status,'tracking');
 assert.equal(observe(s,3,dart).status,'blocked');assert.equal(s.state.waitingForEmpty,true);
 arm(s,5);const q=proposed(s,6);
 assert.equal(observe(s,7,{...dart,sourceKey:'another-camera'}).status,'waiting-empty');
 assert.throws(()=>s.commit(q.token,{applied:true}),/Brak bieżącej/);
});

test('pause retains accepted baseline ownership but discards partial and ready proposals',()=>{
 const s=createCameraAutoSession();arm(s);const p=proposed(s);s.pause();
 assert.equal(s.state.waitingForEmpty,false);assert.equal(s.state.pendingToken,null);
 assert.throws(()=>s.commit(p.token,{applied:true}),/Brak bieżącej/);
 const q=proposed(s,2);assert.notEqual(q.token,p.token);
 s.invalidate();assert.equal(s.state.waitingForEmpty,true);assert.equal(s.state.sourceKey,null);
});

test('invalid options and malformed ownership cannot weaken the gate',()=>{
 for(const config of [{minFrames:2},{minStableMs:699},{maxGapMs:0},{maxTipDistance:NaN}])assert.throws(()=>createCameraAutoSession(config),/parametry/);
 const s=createCameraAutoSession();arm(s);const p=proposed(s);
 assert.throws(()=>observe(s,NaN,dart),/tożsamości/);assert.equal(s.state.waitingForEmpty,true);
 assert.throws(()=>s.commit(p.token,{applied:true}),/Brak bieżącej/);
});

test('a whole turn seen at once is ready only when every dart stays stable',()=>{
 const s=createCameraAutoSession();arm(s);
 const darts=[
  {point:{x:.2,y:.2},field:{number:20,multiplier:1,nearWire:false},autoEligible:true},
  {point:{x:.5,y:.5},field:{number:19,multiplier:3,nearWire:false},autoEligible:true},
  {point:{x:.8,y:.8},field:{number:25,multiplier:2,nearWire:false},autoEligible:true}];
 assert.equal(observe(s,1,{status:'candidates',darts}).status,'tracking');
 // Reordered components are the same darts; a missing dart restarts the window.
 assert.equal(observe(s,1.35,{status:'candidates',darts:[...darts].reverse()}).status,'tracking');
 assert.equal(observe(s,1.7,{status:'candidates',darts:darts.slice(1)}).status,'tracking');
 observe(s,2.05,{status:'candidates',darts});
 assert.equal(observe(s,2.4,{status:'candidates',darts}).status,'tracking');
 const ready=observe(s,2.75,{status:'candidates',darts});
 assert.equal(ready.status,'ready');assert.equal(ready.darts.length,3);
 const commit=s.commit(ready.token,{applied:true});
 assert.equal(commit.acceptedDarts,3);assert.equal(commit.waitingForEmpty,true);
});
test('one ineligible dart blocks the entire series',()=>{
 const s=createCameraAutoSession();arm(s);
 const darts=[
  {point:{x:.2,y:.2},field:{number:20,multiplier:1,nearWire:false},autoEligible:true},
  {point:{x:.5,y:.5},field:{number:19,multiplier:1,nearWire:true},autoEligible:true}];
 for(const time of [1,1.35,1.7])assert.equal(observe(s,time,{status:'candidates',darts}).status,'blocked');
 assert.equal(observe(s,2,{status:'candidates',darts:[darts[0],{...darts[1],autoEligible:false}]}).status,'blocked');
 assert.equal(s.state.pendingToken,null);
});
