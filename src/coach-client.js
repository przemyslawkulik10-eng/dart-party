import {loadJdc} from './jdc.js';
import {loadTrainings} from './training.js';
import {loadMatches} from './storage.js';
import {replay} from './engine.js';
const KEY='dart-party-coach-reports-v1';
export async function requestCoach(session,signal){
 if(!session.coachEnabled)throw new Error('Włącz wirtualnego trenera, jeśli chcesz otrzymać analizę.');
 if(!session.profileId)throw new Error('Ta starsza sesja nie ma profilu. Rozpocznij nowy trening, aby użyć AI.');
 const trainings=loadTrainings().filter(s=>s.profileId===session.profileId).slice(0,30);
 const jdc=loadJdc().filter(s=>s.profileId===session.profileId&&s.endedAt!==null).slice(0,30);
 const matches=loadMatches().filter(m=>m.profileIds?.includes(session.profileId)&&replay(m).winner!==null).slice(0,20);
 const response=await fetch('/api/coach',{method:'POST',headers:{'Content-Type':'application/json','X-Dart-Party':'coach'},body:JSON.stringify({profileId:session.profileId,trainings,matches,jdc}),signal});
 let data;try{data=await response.json();}catch{throw new Error('Serwer trenera jest niedostępny. Uruchom aktualny serwer aplikacji.');}
 if(!response.ok)throw new Error(data.error||'Trener AI jest teraz niedostępny.');
 if(!data.advice || data.provider!=='OpenAI')throw new Error('Nieprawidłowa odpowiedź trenera.');
 return data;
}
export function saveCoachReport(profileId,sessionId,report){
 const reports=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(reports))throw new Error('Nie można odczytać zapisów analiz AI.');
 localStorage.setItem(KEY,JSON.stringify([{profileId,sessionId,...report},...reports].slice(0,100)));
}
