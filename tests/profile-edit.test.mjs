import test from 'node:test';import assert from 'node:assert/strict';
import {ensureProfiles,selectProfile,selectedProfile,updateProfile,loadProfiles} from '../src/profiles.js';
import {profileActivity} from '../src/player-dashboard.js';
test('profile selection and editing preserve identity; invalid names and avatars do not change stored profiles',()=>{
 const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
 const [p,q]=ensureProfiles(['PRZEMEK','MACIEK']);selectProfile(p.id);const renamed=updateProfile(p.id,{name:'Kulik19',avatar:'bullseye',hometown:'Łódź',darts:'23 g',goal:'Regularny trening'});assert.equal(renamed.id,p.id);assert.equal(renamed.createdAt,p.createdAt);assert.equal(selectedProfile().name,'Kulik19');assert.equal(loadProfiles().length,2);
 assert.throws(()=>updateProfile(p.id,{name:'MACIEK'}));assert.throws(()=>updateProfile(p.id,{name:' '}));assert.throws(()=>updateProfile(p.id,{avatar:'../../bad'}));assert.equal(selectedProfile().name,'Kulik19');selectProfile(null);assert.equal(selectedProfile(),null);assert.throws(()=>selectProfile('missing'));assert.equal(loadProfiles()[1].id,q.id);delete globalThis.localStorage;
});
test('activity uses session creation dates, respects 14-day boundary and empty days',()=>{
 const now=new Date(2026,9,18,12).getTime();const data={matches:[{createdAt:new Date(2026,9,5).toISOString()},{createdAt:new Date(2026,9,4).toISOString()}],trainings:[{createdAt:now}],jdc:[]};const days=profileActivity(data,now);assert.equal(days.length,14);assert.equal(days[0].count,1);assert.equal(days[13].count,1);assert.equal(days.reduce((n,d)=>n+d.count,0),2);
});
