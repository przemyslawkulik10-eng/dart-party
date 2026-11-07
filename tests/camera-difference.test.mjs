import test from 'node:test';
import assert from 'node:assert/strict';
import {toGray,detectDartChange} from '../src/camera-difference.js';
const width=100,height=100;
const frame=(v=180)=>new Uint8Array(width*height).fill(v);
function line(f,x1,x2,y){for(let x=x1;x<=x2;x++)for(let dy=-1;dy<=1;dy++)f[(y+dy)*width+x]=40;return f;}
const empty=frame(),options={width,height,emptyReference:empty};

test('difference needs stable fresh captures; absence never becomes a scored miss',()=>{
 assert.equal(detectDartChange(empty,empty,null,options).status,'waiting');
 assert.equal(detectDartChange(empty,empty,empty,options).status,'empty');
 const dart=line(frame(),55,80,50),before=dart.slice();
 assert.equal(detectDartChange(empty,dart,empty,options).status,'unstable');
 const result=detectDartChange(empty,dart,dart,options);
 assert.equal(result.status,'candidate');assert.equal(result.requiresReview,true);
 assert.ok(Math.abs(result.candidate.x-55/99)<.01);assert.ok(result.alternate.x>result.candidate.x);
 assert.equal(result.number,undefined);assert.equal(result.score,undefined);assert.deepEqual(dart,before);
});

test('accepted baseline permits another dart without interpreting the earlier dart again',()=>{
 const one=line(frame(),55,80,50),two=line(one.slice(),20,40,75);
 assert.equal(detectDartChange(one,one,one,options).status,'empty');
 const result=detectDartChange(one,two,two,options);assert.equal(result.status,'candidate');
 assert.ok(result.candidate.y>.7);assert.equal(result.changed,63);
});

test('one removed dart, multiple removals and partial removals cannot become new candidates',()=>{
 const one=line(frame(),55,80,50),two=line(one.slice(),20,40,75),partial=one.slice();
 for(let x=55;x<=60;x++)for(let dy=-1;dy<=1;dy++)partial[(50+dy)*width+x]=180;
 for(const [reference,current] of [[one,empty],[two,empty],[two,one],[one,partial]]){
  const result=detectDartChange(reference,current,current,options);
  assert.equal(result.status,'removed');assert.equal(result.candidate,undefined);assert.ok(result.reverted>=18);
 }
 // Replacing a dart elsewhere can grow the changed area; net pixel count is insufficient.
 const replaced=line(frame(),10,45,25);
 assert.equal(detectDartChange(one,replaced,replaced,options).status,'removed');
 const moved=line(frame(),55,80,60);
 assert.equal(detectDartChange(one,moved,moved,options).status,'removed');
});

test('large hands, multiple changes, clipping and lighting changes require another frame or review',()=>{
 const hand=frame();for(let y=10;y<70;y++)for(let x=10;x<70;x++)hand[y*width+x]=40;
 assert.equal(detectDartChange(empty,hand,hand,options).status,'ambiguous');
 const two=line(line(frame(),55,80,50),20,40,75);
 assert.equal(detectDartChange(empty,two,two,options).status,'ambiguous');
 assert.equal(detectDartChange(empty,frame(240),frame(240),options).status,'lighting');
 assert.equal(detectDartChange(empty,line(frame(),0,30,50),line(frame(),0,30,50),options).status,'ambiguous');
 assert.equal(detectDartChange(empty,frame(190),frame(190),options).status,'empty');
});

test('malformed RGBA and grayscale frames cannot silently produce valid image data',()=>{
 for(const invalid of [{},[],new Uint8Array(),new Uint8Array(3),'abcd',[NaN,0,0,255],[999,0,0,255],new Float32Array(4)])assert.throws(()=>toGray(invalid),/RGBA/);
 assert.deepEqual([...toGray(new Uint8ClampedArray([255,255,255,255,0,0,0,255]))],[255,0]);
 for(const invalid of [null,{},[],new Uint8Array(5),new Float32Array(10000)]){
  assert.throws(()=>detectDartChange(invalid,empty,empty,options),/klatka/);
  assert.throws(()=>detectDartChange(empty,invalid,empty,options),/klatka/);
  assert.throws(()=>detectDartChange(empty,empty,empty,{...options,emptyReference:invalid}),/klatka/);
 }
 assert.throws(()=>detectDartChange(empty,empty,{},options),/klatka/);
 assert.throws(()=>detectDartChange(empty,empty,empty,{width,height}),/początkowe/);
 for(const bad of [Infinity,NaN,0,15,100.5])assert.throws(()=>detectDartChange(empty,empty,empty,{...options,width:bad}),/rozmiar/);
});

test('NaN and invalid detector options cannot disable motion or ambiguity checks',()=>{
 const dart=line(frame(),55,80,50);
 for(const key of ['threshold','motionThreshold','maxMotionFraction','maxChangeFraction','minChangedPixels'])for(const value of [NaN,Infinity,-1,'30'])assert.throws(()=>detectDartChange(empty,dart,empty,{...options,[key]:value}),/parametry/);
 for(const center of [null,[],[.5],[.5,NaN],[.5,Infinity],[-.1,.5],[.5,1.1],new Array(2),[.5,.5,.5]])assert.throws(()=>detectDartChange(empty,dart,dart,{...options,center}),/parametry/);
 assert.throws(()=>detectDartChange(empty,dart,empty,{...options,maxMotionFraction:1}),/parametry/);
 assert.throws(()=>detectDartChange(empty,dart,empty,{...options,maxChangeFraction:1}),/parametry/);
 assert.equal(detectDartChange(empty,dart,empty,options).status,'unstable');
});
