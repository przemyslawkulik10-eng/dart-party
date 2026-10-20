import test from 'node:test';
import assert from 'node:assert/strict';
import {validateConversation,welcomeAnswer,afterLeg} from '../src/coach-conversation.js';
import {newCoachMatch} from '../src/coach-match.js';
test('conversation permits unknown level and no time limit without assuming beginner',()=>{
 const a=validateConversation({experience:'unknown',time:'open',start:'match'});
 assert.match(welcomeAnswer(a),/Nie musisz/);
 assert.throws(()=>validateConversation({...a,time:'999'}));
 assert.throws(()=>validateConversation({...a,experience:'expert'}));
});
test('first leg feedback preserves match and records all optional choices',()=>{
 const m=newCoachMatch('Przemek',201);
 for(const choice of ['warmup','play','exercises','finish']){
  const next=afterLeg(m,'warming',choice);
  assert.equal(next.coachFeedback.choice,choice);assert.equal(next.coachFeedback.feeling,'warming');assert.deepEqual(next.events,m.events);
  assert.deepEqual(JSON.parse(JSON.stringify(next)),next);
 }
 assert.equal(m.coachFeedback,undefined);assert.throws(()=>afterLeg(m,'bad','finish'));
});
test('saved answers survive reload, stay with their profile, and reject stale writes',async()=>{
 const {useAccount}=await import('../src/account-storage.js');
 const {ensureProfiles}=await import('../src/profiles.js');
 const {saveConversation,readConversation}=await import('../src/coach-conversation.js');
 const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};useAccount(null);
 const [a,b]=ensureProfiles(['A','B']);const value={experience:'returning',time:'15',start:'free'};
 const saved=saveConversation(a.id,null,value,null);assert.deepEqual(readConversation(a.id),saved);assert.equal(readConversation(b.id),null);
 assert.throws(()=>saveConversation(a.id,null,value,null),/innej karcie/);
 useAccount('11111111-1111-4111-8111-111111111111');assert.throws(()=>saveConversation(a.id,saved,value,null),/Konto/);useAccount(null);
});
