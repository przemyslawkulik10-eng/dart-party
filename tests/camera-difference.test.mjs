import test from 'node:test';
import assert from 'node:assert/strict';
import {toGray,detectDartChange} from '../src/camera-difference.js';
const width=100,height=100;
const frame=(v=180)=>new Uint8Array(width*height).fill(v);
function line(f,x1,x2,y){for(let x=x1;x<=x2;x++)for(let dy=-1;dy<=1;dy++)f[(y+dy)*width+x]=40;return f;}
const empty=frame(),options={width,height,emptyReference:empty};
// An idealized steel tip, barrel, shaft and diamond flight, deliberately pointing
// independently of the bull. This checks geometry, not real-device accuracy.
function taperedDart({value=40,mirror=false,vertical=false,offset=0,blunt=false}={}){
 const f=frame();
 for(let x=15;x<=85;x++){
  const radius=x<30?(blunt?3:(x<21?0:1)):x<48?3:x<65?1:Math.max(2,Math.floor(11*(1-Math.abs(x-75)/11)));
  for(let y=50-radius;y<=50+radius;y++){
   const xx=(mirror?100-x:x)+offset;
   f[(vertical?xx:y)*width+(vertical?y:xx)]=value;
  }
 }
 return f;
}

test('morphology nominates the narrow tip independently of the bull and image orientation',()=>{
 for(const mirror of [false,true])for(const vertical of [false,true])for(const center of [[.05,.05],[.95,.95]]){
  const captured=taperedDart({mirror,vertical});
  const result=detectDartChange(empty,captured,captured,{...options,center});
  assert.equal(result.status,'candidate');assert.equal(result.autoEligible,true);assert.equal(result.requiresReview,true);
  const expected=(mirror?85:15)/99;
  assert.ok(Math.abs((vertical?result.autoCandidate.y:result.autoCandidate.x)-expected)<.015);
  assert.ok(Math.abs((vertical?result.autoCandidate.x:result.autoCandidate.y)-50/99)<.015);
  assert.ok(result.autoMetrics.widthRatio>=2.5);assert.equal(result.autoMetrics.strongFraction,1);
  assert.equal(result.confidence,undefined);assert.equal(result.score,undefined);
 }
 // Both the reviewed candidate and the automatic proposal are the narrow tip:
 // the bull position must never choose the read-out end (the flight floats in
 // front of the board and can project closer to the center than the tip).
 const captured=taperedDart(),result=detectDartChange(empty,captured,captured,{...options,center:[.95,.5]});
 assert.ok(result.candidate.x<.2);assert.ok(result.alternate.x>.8);assert.ok(result.autoCandidate.x<.2);
});

test('symmetric, weak-shadow, blunt or edge-clipped shapes are ineligible for automatic endpoint use',()=>{
 for(const captured of [line(frame(),15,85,50),taperedDart({value:135}),taperedDart({blunt:true}),taperedDart({offset:-12})]){
  const result=detectDartChange(empty,captured,captured,options);
  assert.equal(result.status,'candidate');assert.equal(result.autoEligible,false);assert.equal(result.autoCandidate,null);
  assert.equal(result.requiresReview,true);assert.ok(result.autoReason.length>0);
 }
});

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

test('isolated camera flicker does not block a stable board or connected dart',()=>{
 const noisy=frame();
 for(let y=5;y<=25;y+=4)for(let x=5;x<=21;x+=4)noisy[y*width+x]=160;
 assert.equal(detectDartChange(empty,noisy,empty,options).status,'empty');
 const dart=line(frame(),55,80,50),noisyDart=line(noisy.slice(),55,80,50);
 assert.equal(detectDartChange(empty,noisyDart,dart,options).status,'candidate');
 // Coherent movement still blocks a proposal, even a one-pixel-wide shaft.
 const thin=frame();for(let x=40;x<80;x++)thin[50*width+x]=40;
 assert.equal(detectDartChange(empty,thin,empty,options).status,'unstable');
});

test('small threshold crossings around an unchanged dart are not removal',()=>{
 const reference=line(frame(),55,80,50),current=reference.slice();
 for(let x=10;x<16;x++){reference[10*width+x]=149;current[10*width+x]=150;}
 const result=detectDartChange(reference,current,current,options);
 assert.equal(result.status,'empty');assert.equal(result.changed,0);
});

test('640px production frames tolerate isolated flicker but reject coherent hand motion',()=>{
 const width=640,height=640,empty=new Uint8Array(width*height).fill(180),current=empty.slice();
 const opts={width,height,emptyReference:empty};
 for(let y=4;y<140;y+=4)for(let x=4;x<140;x+=4)current[y*width+x]=160;
 assert.equal(detectDartChange(empty,current,empty,opts).status,'empty');
 for(let y=200;y<240;y++)for(let x=200;x<240;x++)current[y*width+x]=40;
 assert.equal(detectDartChange(empty,current,empty,opts).status,'unstable');
});

test('supra-threshold isolated noise is not change, removal or a board object',()=>{
 // Synthetic reproducer of the noise hypothesis, not a physical-camera
 // measurement: ~400 isolated pixels 35 levels below the board (above
 // threshold 30) previously gave ambiguous, components 0 and permanently
 // blocked the automatic empty-board check.
 const width=640,height=640,empty=new Uint8Array(width*height).fill(180),opts={width,height,emptyReference:empty};
 const noisy=new Uint8Array(empty);
 for(let y=4;y<height-4;y+=12)for(let x=4;x<width-4;x+=12)noisy[y*width+x]=145;
 const result=detectDartChange(empty,noisy,noisy,opts);
 assert.equal(result.status,'empty');assert.ok(result.changed>100);assert.ok(result.supportedChanged<12);
 // Exact handoff reproducer: ~360 isolated pixels on a 32 px grid. Before the
 // change-mask support filter this was ambiguous with components 0, so the
 // automatic session could never arm the empty board.
 const sparse=new Uint8Array(empty);
 for(let y=16;y<height-16;y+=32)for(let x=16;x<width-16;x+=32)sparse[y*width+x]=145;
 const sparseResult=detectDartChange(empty,sparse,sparse,opts);
 assert.equal(sparseResult.status,'empty');assert.ok(sparseResult.changed>300);assert.ok(sparseResult.supportedChanged<12);
 // Per-frame independent noise at disjoint pixels must not fake a removal.
 const again=new Uint8Array(empty);
 for(let y=6;y<height-4;y+=12)for(let x=6;x<width-4;x+=12)again[y*width+x]=145;
 assert.equal(detectDartChange(noisy,again,again,opts).status,'empty');
 // The same noise next to a connected dart still yields exactly one candidate.
 const withDart=new Uint8Array(noisy);
 for(let y=300;y<340;y++)withDart[y*width+300]=100;
 const found=detectDartChange(empty,withDart,noisy,opts);
 assert.equal(found.status,'candidate');assert.equal(found.components,undefined);
 assert.ok(found.changed>=120);assert.equal(found.supportedChanged,undefined);
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

test('a low-contrast dart returning close to empty is removed below the new-object threshold',()=>{
 // The dart differs by 31 from the board; local sensor noise after removal
 // leaves a difference of 1, so its return delta is only 30 (not > threshold).
 for(const [board,dartValue,returned] of [[180,149,179],[70,101,71]]){
  const background=frame(board),reference=background.slice(),current=background.slice();
  for(let x=55;x<=80;x++)for(let y=49;y<=51;y++){reference[y*width+x]=dartValue;current[y*width+x]=returned;}
  const config={width,height,emptyReference:background};
  assert.equal(detectDartChange(background,reference,reference,config).status,'candidate');
  const result=detectDartChange(reference,current,current,config);
  assert.equal(result.status,'removed');assert.equal(result.changed,0);assert.equal(result.reverted,78);
  assert.equal(result.candidate,undefined);
 }
});

test('flicker below 12 reverted pixels on a kept dart is not a removal',()=>{
 // A 3x3 patch flickering back to the empty board reverts 9 px. The old 6 px
 // gate reported 'removed' on a stationary dart and blocked confirmation.
 const board=frame(),reference=line(frame(),48,67,50),current=reference.slice();
 for(let x=48;x<=50;x++)for(let dy=-1;dy<=1;dy++)current[(50+dy)*width+x]=180;
 const config={width,height,emptyReference:board};
 assert.equal(detectDartChange(board,reference,reference,config).status,'candidate');
 assert.equal(detectDartChange(reference,current,current,config).status,'empty');
});

test('two fragments split by a thin gap form one dart instead of an ambiguous change',()=>{
 // A dark shaft on a black segment or across a wire splits the change into
 // pieces. A 3 px gap kept two components with 1 px dilation; 2 px bridges it.
 const board=frame(),dart=line(line(frame(),20,34,50),38,52,50);
 const result=detectDartChange(board,dart,dart,options);
 assert.equal(result.status,'candidate');assert.equal(result.components,undefined);
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

test('two or three separated darts in one frame become a candidate series',()=>{
 // A whole turn can reach the detector in one frame. Each dart must pass the
 // same shape gate on its own; the series is not saved when any piece is unsure.
 function drawDart(f,cy){
  for(let x=15;x<=85;x++){
   const radius=x<30?(x<21?0:1):x<48?3:x<65?1:Math.max(2,Math.floor(11*(1-Math.abs(x-75)/11)));
   for(let y=cy-radius;y<=cy+radius;y++)f[y*width+x]=40;
  }
  return f;
 }
 for(const rows of [[25,75],[16,50,84]]){
  const both=rows.reduce((f,cy)=>drawDart(f,cy),frame());
  const result=detectDartChange(empty,both,both,{...options,maxChangeFraction:.25});
  assert.equal(result.status,'candidates');assert.equal(result.candidates.length,rows.length);
  assert.equal(result.candidate,undefined);assert.equal(result.requiresReview,true);
  for(const item of result.candidates){
   assert.equal(item.autoEligible,true);assert.ok(item.autoCandidate);
   assert.ok(item.autoCandidate.x<.2);assert.ok(item.autoMetrics.widthRatio>=2.5);
  }
 }
 // One blunt fragment beside shaped darts blocks the whole series.
 const blunt=line(drawDart(frame(),75),20,40,25);
 const mixed=drawDart(blunt,75);
 assert.equal(detectDartChange(empty,mixed,mixed,{...options,maxChangeFraction:.25}).status,'ambiguous');
});
