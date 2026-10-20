import {appStorage,accountOwner} from './account-storage.js';
import {loadProfiles,PROFILES_KEY} from './profiles.js';
import {emptyCoach,validateCoach} from './virtual-coach.js';
export function readCoach(profileId){const p=loadProfiles().find(p=>p.id===profileId);if(!p)throw Error('Nie znaleziono zawodnika.');return structuredClone(validateCoach(p.virtualCoach??emptyCoach()));}
export function writeCoach(profileId,expected,next,owner=accountOwner()){
 if(accountOwner()!==owner)throw Error('Konto zmieniło się. Otwórz ponownie trenera.');
 const profiles=loadProfiles(),p=profiles.find(p=>p.id===profileId);if(!p)throw Error('Nie znaleziono zawodnika.');
 const current=validateCoach(p.virtualCoach??emptyCoach());
 if(JSON.stringify(current)!==JSON.stringify(expected))throw Error('Plan zmienił się w innej karcie lub po synchronizacji. Otwórz ponownie trenera.');
 p.virtualCoach=validateCoach({...structuredClone(next),revision:current.revision+1});
 appStorage.setItem(PROFILES_KEY,JSON.stringify(profiles));return structuredClone(p.virtualCoach);
}
export function profileCoachReports(profileId){
 const p=loadProfiles().find(p=>p.id===profileId);if(!p)throw Error('Nie znaleziono zawodnika.');
 const legacy=JSON.parse(appStorage.getItem('dart-party-coach-reports-v1')||'[]');
 if(!Array.isArray(legacy)||(p.coachReports!==undefined&&!Array.isArray(p.coachReports)))throw Error('Nie można odczytać analiz trenera.');
 const seen=new Set();return [...(p.coachReports||[]),...legacy.filter(r=>r.profileId===profileId)].filter(r=>{const id=JSON.stringify([r.sessionId,r.createdAt]);if(seen.has(id))return false;seen.add(id);return true;}).sort((a,b)=>b.createdAt-a.createdAt);
}
export function saveProfileCoachReport(profileId,sessionId,report){
 const profiles=loadProfiles(),p=profiles.find(p=>p.id===profileId);if(!p)throw Error('Nie znaleziono zawodnika.');
 if(p.coachReports!==undefined&&!Array.isArray(p.coachReports))throw Error('Nie można odczytać analiz trenera.');
 p.coachReports=[{sessionId,...report},...profileCoachReports(profileId).filter(r=>r.sessionId!==sessionId||r.createdAt!==report.createdAt)].slice(0,100);
 appStorage.setItem(PROFILES_KEY,JSON.stringify(profiles));
}
