import test from 'node:test';
import assert from 'node:assert/strict';
import {appStorage,useAccount,workspace,replaceWorkspace,validateWorkspace} from '../src/account-storage.js';
const a='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',b='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
test('guest and two player accounts retain separate results',()=>{
 const map=new Map();globalThis.localStorage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
 const k='dart-party-matches-v1';useAccount(null);appStorage.setItem(k,'guest');useAccount(a);assert.equal(appStorage.getItem(k),null);appStorage.setItem(k,'player A');useAccount(b);assert.equal(appStorage.getItem(k),null);appStorage.setItem(k,'player B');useAccount(a);assert.equal(appStorage.getItem(k),'player A');appStorage.setItem('coach-extra','x');assert.equal(appStorage.getItem('coach-extra'),'x');appStorage.removeItem('coach-extra');assert.equal(appStorage.getItem('coach-extra'),null);replaceWorkspace({[k]:'remote A'});assert.equal(workspace()[k],'remote A');useAccount(b);assert.equal(appStorage.getItem(k),'player B');useAccount(null);assert.equal(appStorage.getItem(k),'guest');
});
test('account snapshot rejects unknown keys, non-string values and oversize data',()=>{
 for(const value of [null,[],{token:'secret'},{'dart-party-matches-v1':[]},{'dart-party-matches-v1':'x'.repeat(4000001)}])assert.throws(()=>validateWorkspace(value));
});
