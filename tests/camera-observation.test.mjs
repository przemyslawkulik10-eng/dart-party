import test from 'node:test';
import assert from 'node:assert/strict';
import {createCameraObservation} from '../src/camera-observation.js';
const width=100,height=100,empty=()=>new Uint8Array(width*height).fill(180),meta=(time,contextKey='game-1',sourceKey='source-calibration-crop-1')=>({time,contextKey,sourceKey});
function dart(){const frame=empty();for(let x=55;x<=80;x++)for(let y=49;y<=51;y++)frame[y*width+x]=40;return frame;}
function ready(){const gate=createCameraObservation({width,height});gate.setEmpty(empty(),meta(0));return gate;}
function proposal(gate){const frame=dart();assert.equal(gate.observe(frame,meta(1)).status,'waiting');return gate.observe(frame,meta(2));}
test('requires explicit empty reference and unique fresh frames before proposing',()=>{
 const gate=createCameraObservation({width,height});assert.equal(gate.observe(dart(),meta(0)).status,'uninitialized');
 gate.setEmpty(empty(),meta(0));assert.equal(gate.observe(dart(),meta(0)).status,'stale');
 const result=proposal(gate);assert.equal(result.status,'candidate');assert.equal(result.requiresReview,true);
 assert.equal(gate.observe(dart(),meta(2)).status,'stale');assert.equal(gate.pending,null);
 assert.throws(()=>gate.accept(result.id,{applied:true,contextKey:'game-1'}),/wygasł/);
});
test('only explicit successful game application advances baseline; no replay or outside mutation',()=>{
 const gate=ready(),result=proposal(gate);result.frame.fill(0);
 assert.throws(()=>gate.accept(result.id,{contextKey:'game-1'}),/zapisz/);
 assert.throws(()=>gate.accept(result.id,{applied:true,contextKey:'other'}),/wygasł/);
 assert.equal(gate.accept(result.id,{applied:true,contextKey:'game-1'}),true);
 assert.throws(()=>gate.accept(result.id,{applied:true,contextKey:'game-1'}),/wygasł/);
 assert.equal(gate.observe(dart(),meta(3)).status,'empty');
 assert.equal(gate.observe(empty(),meta(4)).status,'unstable');assert.equal(gate.observe(empty(),meta(5)).status,'removed');
});
test('game change discards proposals; source/calibration/crop or video reset invalidates all',()=>{
 const gate=ready(),result=proposal(gate);
 assert.equal(gate.observe(dart(),meta(3,'game-2')).status,'waiting');assert.equal(gate.pending,null);
 assert.throws(()=>gate.accept(result.id,{applied:true,contextKey:'game-1'}),/wygasł/);
 assert.equal(gate.observe(dart(),meta(4,'game-2','new-calibration')).status,'uninitialized');assert.equal(gate.ready,false);
 gate.setEmpty(empty(),meta(10));assert.equal(gate.observe(dart(),meta(9)).status,'uninitialized');
 gate.setEmpty(empty(),meta(0));gate.invalidate();assert.equal(gate.ready,false);
});
test('input validation, rejected candidate and replaced candidate cannot be accepted',()=>{
 const gate=ready(),first=proposal(gate);assert.equal(gate.reject(first.id),true);assert.equal(gate.reject(first.id),false);
 const second=gate.observe(dart(),meta(3));const third=gate.observe(dart(),meta(4));assert.notEqual(second.id,third.id);
 assert.throws(()=>gate.accept(second.id,{applied:true,contextKey:'game-1'}),/wygasł/);
 assert.throws(()=>gate.observe(dart(),meta(NaN)),/tożsamości/);assert.throws(()=>gate.observe(new Uint8Array(2),meta(5)),/klatka/);
});


test('two accepted objects falling out never become a new candidate, automatic zero or score correction',()=>{
 const gate=ready(),first=proposal(gate);gate.accept(first.id,{applied:true,contextKey:'game-1'});
 const both=dart();for(let x=55;x<=80;x++)for(let y=69;y<=71;y++)both[y*width+x]=40;
 assert.equal(gate.observe(both,meta(3)).status,'unstable');const second=gate.observe(both,meta(4));assert.equal(second.status,'candidate');
 gate.accept(second.id,{applied:true,contextKey:'game-1'});
 assert.equal(gate.observe(empty(),meta(5)).status,'unstable');const fallen=gate.observe(empty(),meta(6));
 assert.equal(fallen.status,'removed');assert.equal(gate.pending,null);assert.equal(fallen.candidate,undefined);assert.equal(fallen.score,undefined);
 assert.throws(()=>gate.accept(second.id,{applied:true,contextKey:'game-1'}),/wygasł/);
 assert.equal(gate.observe(empty(),meta(7)).status,'removed'); // no automatic rebaseline
 gate.setEmpty(empty(),meta(8));assert.equal(gate.observe(empty(),meta(9)).status,'waiting');assert.equal(gate.observe(empty(),meta(10)).status,'empty');
});


test('pause discards candidates and requires two fresh frames without losing accepted baseline',()=>{
 const gate=ready(),first=proposal(gate);gate.pause();assert.equal(gate.ready,true);assert.equal(gate.pending,null);
 assert.throws(()=>gate.accept(first.id,{applied:true,contextKey:'game-1'}),/wygasł/);
 assert.equal(gate.observe(dart(),meta(3)).status,'waiting');const next=gate.observe(dart(),meta(4));assert.equal(next.status,'candidate');
 gate.accept(next.id,{applied:true,contextKey:'game-1'});gate.pause();
 assert.equal(gate.observe(dart(),meta(5)).status,'waiting');assert.equal(gate.observe(dart(),meta(6)).status,'empty');
});
