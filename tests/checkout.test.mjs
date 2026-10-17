import {test} from 'node:test';import assert from 'node:assert/strict';
import {checkout,checkoutLabel,checkoutAdvice} from '../src/checkout.js';
test('170 double out, bogeys, 163 straight impossible, 180 straight allowed',()=>{
 assert.deepEqual(checkout(170,3,true).map(checkoutLabel),['T20','T20','BULL 50']);
 for(const s of [169,168,166,165,163,162,159])assert.equal(checkout(s,3,true),null);
 assert.equal(checkout(163,3,false),null);assert.equal(checkout(180,3,false).length,3);assert.equal(checkout(180,3,true),null);
});
test('all scores/darts/rules match exhaustive reachable sums and valid intermediate scores',()=>{
 const hits=[...Array.from({length:20},(_,i)=>[i+1,(i+1)*2,(i+1)*3]).flat(),25,50];
 for(const doubleOut of [false,true]){
 let exact=new Set(doubleOut?[...Array.from({length:20},(_,i)=>(i+1)*2),50]:hits),reachable=new Set();
 for(let darts=1;darts<=3;darts++){
 for(const n of exact)reachable.add(n);
 for(let score=1;score<=180;score++){
 const route=checkout(score,darts,doubleOut);assert.equal(Boolean(route),reachable.has(score),`${score}/${darts}/${doubleOut}`);
 if(route){assert(route.length<=darts);assert.equal(route.reduce((a,d)=>a+d.points,0),score);if(doubleOut)assert.equal(route.at(-1).multiplier,2);}
 }
 exact=new Set([...exact].flatMap(n=>hits.map(h=>h+n)));
 }
 }
});
test('one dart and invalid inputs',()=>{assert.equal(checkout(1,1,false)[0].points,1);assert.equal(checkout(1,3,true),null);assert.equal(checkout(100,1,true),null);assert.equal(checkout(40,1,true)[0].multiplier,2);assert.equal(checkout(40,0,true),null);});

test('spoken advice starts at 170 in both finish modes',()=>{
 for(const doubleOut of [false,true]){
  assert.match(checkoutAdvice(170,3,doubleOut),/Do końca:/);
  for(const score of [171,180])for(const preview of [false,true])assert.equal(checkoutAdvice(score,3,doubleOut,preview),'');
 }
});
