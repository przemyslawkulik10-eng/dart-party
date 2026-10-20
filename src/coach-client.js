import {saveProfileCoachReport} from './virtual-coach-storage.js';
import {loadJdc} from './jdc.js';
import {loadTrainings} from './training.js';
import {loadMatches} from './storage.js';
import {replay} from './engine.js';
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
export function saveCoachReport(profileId,sessionId,report){saveProfileCoachReport(profileId,sessionId,report);}
export async function requestVirtualCoach(profileId,virtualCoach,signal){
 const response=await fetch('/api/coach',{method:'POST',headers:{'Content-Type':'application/json','X-Dart-Party':'coach'},body:JSON.stringify({profileId,trainings:loadTrainings().filter(s=>s.profileId===profileId).slice(0,30),jdc:loadJdc().filter(s=>s.profileId===profileId&&s.endedAt!==null).slice(0,30),matches:loadMatches().filter(m=>m.profileIds?.includes(profileId)&&replay(m).winner!==null).slice(0,20),virtualCoach}),signal});
 let data;try{data=await response.json();}catch{throw Error('Usługa AI nie jest dostępna w tej wersji.');}
 if(!response.ok)throw Error(data.error||'Trener AI jest niedostępny.');
 if(!data.advice||data.provider!=='OpenAI')throw Error('Nieprawidłowa odpowiedź trenera.');
 return data;
}
