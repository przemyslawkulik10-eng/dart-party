import test from 'node:test';
import assert from 'node:assert/strict';
import {createUpdateChecker} from '../src/app-update.js';
const old='a'.repeat(64),fresh='b'.repeat(64);
function fixture(){
 const state={busy:true,remote:fresh,visible:false,reloads:0,online:true};
 const checker=createUpdateChecker({version:old,fetchVersion:async()=>{if(state.fail)throw Error();return state.remote;},blocked:()=>state.busy,show:v=>state.visible=v,reload:()=>state.reloads++,online:()=>state.online});
 return {state,checker};
}
test('new release stays hidden through game and between legs, appears after whole match',async()=>{
 const {state,checker}=fixture();await checker.check();assert.equal(state.visible,false);
 await checker.apply();assert.equal(state.reloads,0);
 checker.render();assert.equal(state.visible,false); // next leg, still busy
 state.busy=false;checker.render();assert.equal(state.visible,true);
 assert.equal(state.reloads,0);await checker.apply();assert.equal(state.reloads,1);
});
test('undo victory or start rematch hides pending update and prevents reload',async()=>{
 const {state,checker}=fixture();state.busy=false;await checker.check();state.busy=true;checker.render();
 assert.equal(state.visible,false);await checker.apply();assert.equal(state.reloads,0);
});
test('rechecks game state while update request is in flight',async()=>{
 let busy=false,reloads=0,finish;
 const checker=createUpdateChecker({version:old,blocked:()=>busy,show:()=>{},reload:()=>reloads++,fetchVersion:()=>new Promise(r=>finish=r)});
 const initial=checker.check();finish(fresh);await initial;
 const apply=checker.apply();busy=true;finish(fresh);await apply;assert.equal(reloads,0);
});
test('offline, failed, invalid or unchanged version never reloads',async()=>{
 const {state,checker}=fixture();state.busy=false;state.remote=old;await checker.check();assert.equal(state.visible,false);
 state.remote='bad';await checker.check();assert.equal(state.visible,false);
 state.remote=fresh;await checker.check();state.fail=true;await checker.apply();assert.equal(state.reloads,0);
 state.fail=false;state.online=false;await checker.apply();assert.equal(state.reloads,0);
});
