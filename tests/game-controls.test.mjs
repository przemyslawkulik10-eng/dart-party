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
