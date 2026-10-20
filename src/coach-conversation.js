import {accountOwner,appStorage} from './account-storage.js';
import {loadProfiles,PROFILES_KEY} from './profiles.js';
export const EXPERIENCE={unknown:'Wolę na razie pograć',new:'Zaczynam od zera',returning:'Wracam po przerwie',regular:'Gram regularnie'};
export const TIME={open:'Bez ustalania czasu',15:'Około 15 minut',30:'Około 30 minut'};
export const FEELING={warming:'Jeszcze łapię rytm',ready:'Rzuca mi się swobodnie',tired:'Czuję zmęczenie',unknown:'Nie chcę oceniać'};
export function validateConversation(value){
 if(!value||!Object.hasOwn(EXPERIENCE,value.experience)||!Object.hasOwn(TIME,value.time)||!['match','free'].includes(value.start))throw Error('Wybierz sposób rozpoczęcia gry.');
 return {experience:value.experience,time:value.time,start:value.start};
}
export function readConversation(id){const p=loadProfiles().find(p=>p.id===id);if(!p)throw Error('Nie znaleziono zawodnika.');return p.coachConversation??null;}
export function saveConversation(id,expected,value,owner){
 const answer=validateConversation(value);
 if(accountOwner()!==owner)throw Error('Konto zmieniło się. Otwórz ponownie trenera.');
 const all=loadProfiles(),p=all.find(p=>p.id===id);if(!p)throw Error('Nie znaleziono zawodnika.');
 if(JSON.stringify(p.coachConversation??null)!==JSON.stringify(expected))throw Error('Odpowiedzi zmieniły się w innej karcie. Otwórz ponownie trenera.');
 const next={...answer,at:new Date().toISOString()};p.coachConversation=next;appStorage.setItem(PROFILES_KEY,JSON.stringify(all));return next;
}
export function afterLeg(match,feeling,choice){
 if(!Object.hasOwn(FEELING,feeling)||!['warmup','play','exercises','finish'].includes(choice))throw Error('Wybierz, na co masz ochotę.');
 return {...match,coachFeedback:{feeling,choice,at:new Date().toISOString()}};
}
export function welcomeAnswer(answer){
 return answer.experience==='new'?'Zaczynamy spokojnie. W meczu odejmujemy trafione punkty do zera. Wybierz dowolne zakończenie, jeśli nie chcesz teraz ćwiczyć podwójnych.':answer.experience==='returning'?'Dajmy sobie czas na odzyskanie rytmu. Dawne wyniki nie wyznaczają dzisiejszych oczekiwań.':answer.experience==='regular'?'Ty znasz swój rytm. Wybierz przeciwnika i grę, na którą masz dziś ochotę.':'Poznamy się podczas gry. Nie musisz teraz odpowiadać.';
}
