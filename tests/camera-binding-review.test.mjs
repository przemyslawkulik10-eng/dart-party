import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createCameraGameSession} from '../src/camera-game-session.js';
import {createJdc,saveJdc,loadJdc,jdcStats} from '../src/jdc.js';
import {roundTargets,commitRound,roundFeedback,roundPrompt} from '../src/jdc-round.js';
import {createMatch,recordDart,replay,isShanghai,isThreeTriples} from '../src/engine.js';
import {bullState} from '../src/bull-off.js';

test('JDC camera fills an exact gap and commits through the real round engine and storage',()=>{
 const data=new Map();globalThis.localStorage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};
 const source=readFileSync(new URL('../src/jdc-ui.js',import.meta.url),'utf8');
 const current={...createJdc({id:crypto.randomUUID(),name:'A'},false,1),draft:[{number:10,multiplier:1},null,{number:10,multiplier:3}]};
 const session=createCameraGameSession(),owner={isConnected:true};let rendered=0,failStorage=false;
 const ctx=vm.createContext({current,disposed:false,targets:roundTargets(current),bindCameraGame:session.bindCameraGame,$:()=>owner,
  commitRound,roundFeedback,roundPrompt,pair:()=>null,game:()=>rendered++,result:()=>rendered++,playSound:()=>{},speakTraining:()=>{}});
 ctx.store=next=>{if(failStorage)throw new Error('Zapis niedostępny');saveJdc(next);ctx.current=next;};
 const draftLine=source.split('\n').find(line=>line.trim().startsWith('function setDraft('));
 const commitStart=source.indexOf('  function commitRoundEntries('),commitEnd=source.indexOf("  $('#jdc-confirm')",commitStart);
 const bindingStart=source.indexOf('  bindCameraGame('),bindingEnd=source.indexOf('\n }\n function result',bindingStart);
 assert.ok(draftLine&&commitStart>=0&&commitEnd>commitStart&&bindingStart>=0&&bindingEnd>bindingStart);
 vm.runInContext(draftLine+'\n'+source.slice(commitStart,commitEnd),ctx);
 const bind=()=>vm.runInContext(source.slice(bindingStart,bindingEnd),ctx);
 bind();const revision=session.getCameraGame().revision;
 session.applyCameraDart({number:10,multiplier:2},revision);
 const saved=loadJdc()[0];assert.deepEqual(saved.darts.map(({number,multiplier})=>({number,multiplier})),[{number:10,multiplier:1},{number:10,multiplier:2},{number:10,multiplier:3}]);
 assert.equal(jdcStats(saved).score,160);assert.equal(rendered,1);
 assert.throws(()=>session.applyCameraDart({number:10,multiplier:2},revision),/zmieniła/);
 // Failed persistence cannot replace the current draft or report a successful camera write.
 ctx.current=current;failStorage=true;bind();const failed=session.getCameraGame().revision;
 assert.throws(()=>session.applyCameraDart({number:10,multiplier:2},failed),/Zapis niedostępny/);
 assert.equal(ctx.current,current);assert.equal(rendered,1);assert.equal(loadJdc()[0].darts.length,3);
 assert.throws(()=>session.applyCameraDart({number:10,multiplier:2},failed),/zmieniła/);
});

test('X01 camera reports storage failure while preserving the keyboard in-memory score without replay',()=>{
 const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8'),session=createCameraGameSession(),owner={isConnected:true};
 const notices=[];let fail=true,persisted=null,renders=0;
 const ctx=vm.createContext({match:createMatch(['A','B'],'501'),multiplier:1,storageError:false,syncingTimer:null,
  recordDart,replay,isShanghai,isThreeTriples,saveMatch:next=>{if(fail)throw Error('quota');persisted=next;},saveNotice:text=>notices.push(text),toast:text=>notices.push(text),
  clearTimeout:()=>{},setTimeout:()=>1,syncCloud:()=>{},renderGame:()=>renders++,playSound:()=>{},speakTurn:()=>{},speakCheckout:()=>{},finishAdvice:()=>'',navigator:{},
  bindCameraGame:session.bindCameraGame,$:()=>({firstElementChild:owner}),blocked:false,twentyLocked:false});
 const fn=(name,next)=>source.slice(source.indexOf('function '+name+'('),source.indexOf('function '+next+'('));
 vm.runInContext(fn('persist','update')+fn('update','openModal')+fn('hit','exportMatch'),ctx);
 const binding=source.split('\n').find(line=>line.includes('bindCameraGame({owner:')&&line.includes('game:match.mode'));
 const bind=()=>{ctx.state=replay(ctx.match);ctx.player=ctx.state.players[ctx.state.current];vm.runInContext(binding,ctx);return session.getCameraGame().revision;};
 const revision=bind();assert.throws(()=>session.applyCameraDart({number:20,multiplier:1},revision),/Wynik zmienił się na ekranie.*Nie dodawaj tej lotki ponownie/);
 assert.equal(replay(ctx.match).players[0].score,481);assert.equal(ctx.match.events.length,1);assert.equal(persisted,null);assert.equal(renders,1);assert.equal(ctx.storageError,true);
 assert.throws(()=>session.applyCameraDart({number:20,multiplier:1},revision),/zmieniła/);assert.equal(ctx.match.events.length,1);
 // A later successful keyboard save preserves that existing in-memory throw.
 fail=false;assert.equal(ctx.hit(19,1),true);assert.equal(persisted.events.length,2);assert.equal(replay(persisted).players[0].score,462);assert.equal(ctx.storageError,false);
});

test('bull-off camera distinguishes failed persistence from a scored in-memory throw',()=>{
 const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8'),session=createCameraGameSession(),owner={isConnected:true};
 let fail=true,saved=null;const contest={names:['A','B'],throws:[]};
 const ctx=vm.createContext({contest,contestKey:'bull',s:bullState(2,[]),won:false,bullState,
  appStorage:{setItem:(_key,value)=>{if(fail)throw Error('quota');saved=JSON.parse(value);},removeItem:()=>{}},updateActivity:()=>{},toast:()=>{},renderContest:()=>{},announcePlayer:()=>{},playSound:()=>{},
  bindCameraGame:session.bindCameraGame,$:()=>({firstElementChild:owner})});
 vm.runInContext(source.slice(source.indexOf('function saveContest('),source.indexOf('function beginContest(')),ctx);
 vm.runInContext(source.split('\n').find(line=>line.includes('const applyBull=')),ctx);
 const binding=source.split('\n').find(line=>line.includes('bindCameraGame({owner:')&&line.includes("game:'bull-off'"));
 vm.runInContext(binding,ctx);const revision=session.getCameraGame().revision;
 assert.throws(()=>session.applyCameraDart({number:25,multiplier:1},revision),/Wynik zmienił się na ekranie.*Nie dodawaj tej lotki ponownie/);
 assert.deepEqual(contest.throws,[25]);assert.equal(saved,null);
 assert.throws(()=>session.applyCameraDart({number:25,multiplier:1},revision),/zmieniła/);assert.deepEqual(contest.throws,[25]);
 fail=false;assert.equal(ctx.saveContest(),true);assert.deepEqual(saved.throws,[25]);
});
