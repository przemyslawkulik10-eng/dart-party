import test from 'node:test';
import assert from 'node:assert/strict';
import {trainingProfile} from '../src/training-profile.js';
import {ensureProfiles,selectProfile,updateProfile,loadProfiles} from '../src/profiles.js';
import {useAccount} from '../src/account-storage.js';
import {createTraining,saveTraining,loadTrainings} from '../src/training.js';
test('selected account profile owns training after rename and survives JSON reload',()=>{
 const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};
 const owner='11111111-1111-4111-8111-111111111111';useAccount(owner);
 const [p,other]=ensureProfiles(['Przemek','Inny']);selectProfile(p.id);
 const resolve=trainingProfile();updateProfile(p.id,{name:'Przemek nowy'});selectProfile(other.id);
 const player=resolve();assert.equal(player.id,p.id);assert.equal(player.name,'Przemek nowy');
 saveTraining({...createTraining(player.name),profileId:player.id});
 assert.equal(loadTrainings()[0].profileId,p.id);assert.equal(loadProfiles().length,2);
 useAccount(null);assert.throws(resolve,/Konto zmieniło/);assert.equal(loadTrainings().length,0);
 useAccount(owner);assert.equal(loadTrainings()[0].profileId,p.id);useAccount(null);
});
