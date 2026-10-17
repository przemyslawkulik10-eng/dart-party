import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {CYFERKI_FIELDS,CYFERKI_KEY,createCyferki,cyferkiState,chooseCyferki,throwCyferki,undoCyferki,loadCyferki,saveCyferki} from '../src/cyferki.js';
globalThis.crypto??=webcrypto;
const profiles=(n=2)=>Array.from({length:n},(_,i)=>({id:crypto.randomUUID(),name:['Przemek','Mikołaj','Kasia','Dawid','Maciek','Jarek'][i]}));
const create=(progress='player',scoring='hits',n=2)=>createCyferki(profiles(n),{scoring,progress},1);
const select=(m,n)=>chooseCyferki(m,n,2);
const hit=(m,n)=>throwCyferki(m,n,3);
test('S7 D7 closes, last dart T9 closes, chooser hands target 2 to opponent',()=>{
 let m=select(create(),7);m=hit(hit(m,1),2);let s=cyferkiState(m);assert.deepEqual(s.closed,[7]);assert.equal(s.dartsLeft,1);assert.equal(s.current,0);assert.equal(s.scores[0],3);
 m=hit(select(m,9),3);s=cyferkiState(m);assert.equal(s.target,null);assert.equal(s.pendingNext,true);assert.equal(s.chooser,0);assert.equal(s.scores[0],6);
 m=select(m,2);s=cyferkiState(m);assert.equal(s.current,1);assert.equal(s.target,2);assert.equal(s.dartsLeft,3);assert.equal(s.marks[1][2]||0,0);
});
test('separate progress per player, 2 hits and miss do not close for next newcomer',()=>{
 let m=select(create('player','hits',3),2);for(let p=0;p<3;p++)m=hit(hit(hit(m,1),1),0);
 let s=cyferkiState(m);assert.deepEqual(s.closed,[]);assert.deepEqual(s.scores,[2,2,2]);assert.equal(s.current,0);assert.equal(s.marks[0][2],2);
 m=hit(m,1);s=cyferkiState(m);assert.deepEqual(s.closed,[2]);assert.equal(s.dartsLeft,2);assert.equal(s.scores[0],3);
});
test('three triples close three fields, next number picked by shooter for opponent',()=>{
 let m=create();for(const n of [2,9,1])m=hit(select(m,n),3);let s=cyferkiState(m);assert.deepEqual(s.closed,[2,9,1]);assert.equal(s.scores[0],9);assert.equal(s.current,0);assert.equal(s.pendingNext,true);m=select(m,20);assert.equal(cyferkiState(m).current,1);
});
test('turn-reset option, full scoring surplus, bull has no triple and closes at 3',()=>{
 let m=select(create('turn'),7);m=hit(hit(hit(m,1),1),0);m=hit(hit(hit(m,0),0),0);assert.equal(cyferkiState(m).marks[0][7]||0,0);m=hit(hit(m,2),3);assert.equal(cyferkiState(m).scores[0],7);
 let b=select(create(),25);assert.throws(()=>hit(b,3));b=hit(hit(b,1),2);assert.deepEqual(cyferkiState(b).closed,[25]);assert.equal(cyferkiState(b).dartsLeft,1);
});
test('every field closes once; final bull ends immediately and undo reopens it',()=>{
 let m=create('player','closures');for(const field of CYFERKI_FIELDS){m=select(m,field);if(field===25){while(!cyferkiState(m).finished)m=hit(m,2);}else m=hit(m,3);}
 const s=cyferkiState(m);assert.equal(s.finished,true);assert.equal(s.closed.length,21);assert.equal(s.scores.reduce((a,b)=>a+b,0),21);assert.deepEqual(s.winners,s.scores[0]>s.scores[1]?[0]:[1]);assert.throws(()=>hit(m,0));assert.throws(()=>select(m,20));assert.equal(cyferkiState(undoCyferki(m)).finished,false);
});
test('undo restores closure, chooser, turn and marks; JSON exactly replays for six players',()=>{
 let m=select(create('player','hits',6),7);m=hit(hit(m,1),2);const before=cyferkiState(m);m=select(m,9);assert.deepEqual(cyferkiState(undoCyferki(m)),before);m=hit(m,3);const after=cyferkiState(m);m=select(m,2);assert.equal(cyferkiState(m).current,1);assert.deepEqual(cyferkiState(undoCyferki(m)),after);assert.deepEqual(cyferkiState(JSON.parse(JSON.stringify(m))),cyferkiState(m));
 assert.throws(()=>select(m,7));assert.throws(()=>hit(m,4));assert.throws(()=>hit(create(),1));
});
test('storage stays separate and corrupt data is not overwritten',()=>{
 const data=new Map([['dart-party-jdc-v1','keep']]);globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 const m=select(create(),7);saveCyferki(m);saveCyferki(hit(m,1));assert.equal(loadCyferki().length,1);assert.equal(data.get('dart-party-jdc-v1'),'keep');data.set(CYFERKI_KEY,'broken');assert.throws(()=>saveCyferki(m));assert.equal(data.get(CYFERKI_KEY),'broken');
});
test('three-way tie reports every winner when each closes seven fields',()=>{
 let m=create('player','closures',3);for(const n of CYFERKI_FIELDS){m=select(m,n);m=hit(hit(hit(m,0),n===25?1:0),n===25?2:3);}
 const s=cyferkiState(m);assert.deepEqual(s.scores,[7,7,7]);assert.deepEqual(s.winners,[0,1,2]);
});
