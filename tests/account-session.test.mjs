import test from 'node:test';
import assert from 'node:assert/strict';
import {SESSION_KEY,persistentSessionStorage} from '../src/account-session.js';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};};

test('old tab login is moved once without touching game data',()=>{
 const storage=memory(),legacy=memory();legacy.setItem(SESSION_KEY,'synthetic-session');storage.setItem('game','result');
 persistentSessionStorage(storage,legacy);
 assert.equal(storage.getItem(SESSION_KEY),'synthetic-session');assert.equal(legacy.getItem(SESSION_KEY),null);assert.equal(storage.getItem('game'),'result');
 storage.removeItem(SESSION_KEY);legacy.setItem(SESSION_KEY,'stale-tab-session');
 persistentSessionStorage(storage,legacy);
 assert.equal(storage.getItem(SESSION_KEY),null);assert.equal(legacy.getItem(SESSION_KEY),null);
});
test('existing persistent account wins over an old tab account',()=>{
 const storage=memory(),legacy=memory();storage.setItem(SESSION_KEY,'new-account');legacy.setItem(SESSION_KEY,'old-account');
 persistentSessionStorage(storage,legacy);assert.equal(storage.getItem(SESSION_KEY),'new-account');assert.equal(legacy.getItem(SESSION_KEY),null);
});
test('failed persistent write keeps the old tab session',()=>{
 const storage=memory(),legacy=memory();legacy.setItem(SESSION_KEY,'synthetic-session');storage.setItem=()=>{throw Error('Storage unavailable');};
 assert.throws(()=>persistentSessionStorage(storage,legacy),/Storage unavailable/);assert.equal(legacy.getItem(SESSION_KEY),'synthetic-session');
});
