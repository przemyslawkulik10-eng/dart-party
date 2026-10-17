import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createJdc,recordJdcDart,validateJdc,jdcStats,undoJdc} from '../src/jdc.js';
import {commitRound,maximumPossible,roundPrompt,roundFeedback,comparisonRows,roundHistory} from '../src/jdc-round.js';
const p={id:'11111111-1111-4111-8111-111111111111',name:'A'};
const empty=()=>createJdc(p,false,0);
function at(n){let s=empty();for(let i=0;i<n;i++)s=recordJdcDart(s,0,1,i+1);return s;}
test('maximum starts at 3380 and falls only for lost opportunities; end equals score',()=>{
 let s=empty();assert.equal(maximumPossible(s),3380);s=commitRound(s,[1,2,3].map(multiplier=>({number:10,multiplier})),1);assert.equal(maximumPossible(s),3380);
 s=commitRound(s,[null,null,null],2);assert.equal(maximumPossible(s),3214);
 const end=at(57);assert.equal(maximumPossible(end),0);assert.equal(maximumPossible(undoJdc(end)),60);
});
test('partial historic Shanghai is optimized honestly after duplicate singles',()=>{
 let s=empty();s=recordJdcDart(s,10,1,1);assert.equal(maximumPossible(s),3380);s=recordJdcDart(s,10,1,2);assert.equal(maximumPossible(s),3270);
 s=commitRound(s,[{number:10,multiplier:3}],3);assert.equal(jdcStats(s).score,50);
});
test('double rounds announce all three targets; final double group contains bull',()=>{
 assert.match(roundPrompt(at(18)),/podwójne 1, podwójne 2, podwójne 3/);
 let s=at(36);assert.match(roundPrompt(s),/podwójne 19, podwójne 20, środek BULL/);
 const max=maximumPossible(s);s=commitRound(s,[{number:19,multiplier:2},null,{number:25,multiplier:2}],50);assert.equal(jdcStats(s).score,150);assert.equal(maximumPossible(s),max-50);assert.match(roundPrompt(s),/numer 15/);
});
test('draft survives JSON, does not affect scoring, and overlong draft/round is rejected',()=>{
 const s={...empty(),draft:[{number:10,multiplier:1}]};validateJdc(JSON.parse(JSON.stringify(s)));assert.equal(jdcStats(s).score,0);assert.equal(maximumPossible(s),3380);
 assert.throws(()=>validateJdc({...s,draft:[null,null,null,null]}));assert.throws(()=>commitRound(s,[null]));
 const done=commitRound(s,[null,null,null],1);assert.equal(done.darts[0].unknownMiss,true);assert.equal(done.draft,undefined);assert.match(roundHistory(done)[0].hits[0],/pole nieznane/);
});
test('round feedback celebrates Shanghai and history preserves exact throws and bonus',()=>{
 const a=empty(),b=commitRound(a,[1,2,3].map(multiplier=>({number:10,multiplier})),1),f=roundFeedback(a,b);
 assert.equal(f.score,160);assert.equal(f.shanghai,true);assert.equal(f.advance,true);assert.doesNotMatch(f.text,/Za tę lotkę/);assert.deepEqual(roundHistory(b)[0].hits,['S10','D10','T10']);assert.equal(roundHistory(b)[0].bonus,100);
});
test('comparison excludes current and later sessions, separates both 15s, avoids infinity',()=>{
 const previous=at(57),s={...at(57),createdAt:100,endedAt:200};s.darts[0]={number:10,multiplier:1,at:101};
 const rows=comparisonRows(s,[previous,s,{...at(57),createdAt:300,endedAt:400}]);assert.equal(rows[0].count,1);assert.equal(rows[0].mean,0);assert.equal(rows[0].percent,null);assert.equal(rows.filter(r=>r.name.endsWith('· 15')).length,2);
});
