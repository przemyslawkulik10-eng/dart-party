import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createMatch,recordDart,replay} from '../src/engine.js';
import {checkout,checkoutAdvice,checkoutLabel,CHECKOUT_HINT_THRESHOLD} from '../src/checkout.js';
const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
test('actual hit handler returns triple selector to single before render: T20, S3, S17 in 301',()=>{
 const ctx=vm.createContext({match:createMatch(['A','B'],'301'),multiplier:3,recordDart,replay,isThreeTriples:()=>false,isShanghai:()=>false,playSound:()=>{},finishAdvice:()=>'',navigator:{},toast:message=>{throw new Error(message);}});
 let renderedMultiplier;
 ctx.update=next=>{ctx.match=next;renderedMultiplier=ctx.multiplier;};
 vm.runInContext(source.slice(source.indexOf('function hit(n,m)'),source.indexOf('function exportMatch()')),ctx);
 ctx.speakTurn=()=>{};
 vm.runInContext('hit(20,multiplier)',ctx);assert.equal(renderedMultiplier,1);
 vm.runInContext('hit(3,multiplier);hit(17,multiplier)',ctx);
 const state=replay(ctx.match);assert.equal(state.players[0].score,221);assert.deepEqual(state.turn.map(d=>d.multiplier),[3,1,1]);
});
test('checkout display and voice available at 170 in competition, hidden above 170',()=>{
 const ctx=vm.createContext({match:{mode:'301',doubleOut:true},competition:()=>true,checkout,checkoutAdvice,checkoutLabel,CHECKOUT_HINT_THRESHOLD});
 vm.runInContext(source.slice(source.indexOf('function finishAdvice(state)'),source.indexOf('function renderGame()')),ctx);
 const state={players:[{score:170}],current:0,turn:[],ready:false,legWinner:null};
 assert.match(ctx.scoreWithCheckout(state),/checkout-panel/);assert.ok(ctx.finishAdvice(state));
 state.players[0].score=171;assert.doesNotMatch(ctx.scoreWithCheckout(state),/checkout-panel/);
});
test('scoreboard shows waiting player 168 straight-out finish, active player uses remaining darts',()=>{
 const ctx=vm.createContext({match:{mode:'301',doubleOut:false},checkout,checkoutLabel,CHECKOUT_HINT_THRESHOLD});
 vm.runInContext(source.slice(source.indexOf('function playerCheckout(state,index)'),source.indexOf('function renderGame()')),ctx);
 const state={players:[{score:220},{score:168},{score:275}],current:2,turn:[],ready:false,legWinner:null};
 assert.match(ctx.playerCheckout(state,1),/T20 → T20 → T16/);assert.equal(ctx.playerCheckout(state,0),'');
 state.current=1;state.turn=[{},{}];assert.match(ctx.playerCheckout(state,1),/BRAK ZEJŚCIA/);
 ctx.match.doubleOut=true;state.turn=[];assert.match(ctx.playerCheckout(state,1),/BRAK ZEJŚCIA/);
 state.legWinner=0;assert.equal(ctx.playerCheckout(state,1),'');
});
test('enable Double Out preserves existing scores and refuses to rewrite earlier scoring',async()=>{
 const {enableDoubleOut}=await import('../src/engine.js');
 let m=createMatch(['A','B'],'301');m=recordDart(m,20,3);m=recordDart(m,20,3);m=recordDart(m,1,1);
 const next=enableDoubleOut(m);assert.equal(next.doubleOut,true);assert.deepEqual(replay(next),replay(m));assert.equal(m.doubleOut,false);
 // A remaining score of one would retroactively make the visit a bust.
 let one=createMatch(['A','B'],'201');one=recordDart(one,20,3);one=recordDart(one,20,3);
 const {nextPlayer}=await import('../src/engine.js');one=recordDart(one,20,3);one=nextPlayer(one);one=recordDart(one,0,1);one=recordDart(one,0,1);one=recordDart(one,0,1);one=nextPlayer(one);one=recordDart(one,20,1);
 assert.throws(()=>enableDoubleOut(one),/wcześniejsze wyniki/);assert.equal(one.doubleOut,false);
});
