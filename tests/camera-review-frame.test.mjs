import test from 'node:test';
import assert from 'node:assert/strict';
import {createCameraReviewFrame} from '../src/camera-review-frame.js';
const width=100,height=100,blank=()=>new Uint8Array(width*height).fill(180);
function dart(){const frame=blank();for(let x=55;x<=80;x++)for(let y=49;y<=51;y++)frame[y*width+x]=40;return frame;}
function setup(){const review=createCameraReviewFrame({width,height});review.begin(dart(),blank(),1);return review;}
test('proposal requires a newer unchanged frame, including a fresh confirmation-time capture',()=>{
 const review=setup();assert.equal(review.stable,false);
 assert.equal(review.check(dart(),1).status,'stale');assert.equal(review.stable,false);
 assert.equal(review.check(dart(),2).status,'empty');assert.equal(review.stable,true);
 assert.equal(review.check(dart(),2).status,'stale');assert.equal(review.stable,false);
 assert.equal(review.check(dart(),3).status,'empty');assert.equal(review.stable,true);
});
test('motion and a fallen dart prevent a previously stable proposal from being written',()=>{
 const review=setup();review.check(dart(),2);assert.equal(review.stable,true);
 const hand=dart();for(let y=10;y<50;y++)for(let x=10;x<50;x++)hand[y*width+x]=40;
 assert.equal(review.check(hand,3).status,'unstable');assert.equal(review.stable,false);
 assert.equal(review.check(hand,4).status,'ambiguous');assert.equal(review.stable,false);
 const fallen=setup();fallen.check(dart(),2);
 assert.equal(fallen.check(blank(),3).status,'unstable');assert.equal(fallen.stable,false);
 assert.equal(fallen.check(blank(),4).status,'removed');assert.equal(fallen.stable,false);
});
test('reset or malformed captures revoke stable status and caller mutation cannot rewrite reference',()=>{
 const review=createCameraReviewFrame({width,height}),frame=dart(),empty=blank();review.begin(frame,empty,1);frame.fill(0);empty.fill(0);
 assert.equal(review.check(dart(),2).status,'empty');assert.equal(review.stable,true);
 assert.throws(()=>review.check(dart(),NaN),/czas/);assert.equal(review.stable,false);
 assert.throws(()=>review.check(new Uint8Array(2),3),/klatka/);
 review.reset();assert.equal(review.stable,false);assert.throws(()=>review.check(dart(),4),/Brak obrazu/);
});
