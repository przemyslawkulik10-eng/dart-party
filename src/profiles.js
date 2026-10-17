export const PROFILES_KEY='dart-party-profiles-v1';
export const validProfileId=id=>typeof id==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const normalized=name=>name.trim().toLocaleUpperCase('pl-PL');
export function loadProfiles(){
 const profiles=JSON.parse(localStorage.getItem(PROFILES_KEY)||'[]');
 if(!Array.isArray(profiles)||profiles.some(p=>!validProfileId(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>24||!Number.isFinite(p.createdAt))||new Set(profiles.map(p=>p.id)).size!==profiles.length||new Set(profiles.map(p=>normalized(p.name))).size!==profiles.length)throw new Error('Nie można odczytać profili. Nie nadpisujemy zapisów.');
 return profiles;
}
export function ensureProfiles(names){
 const profiles=loadProfiles();
 const selected=names.map(value=>{
  const name=String(value).trim();if(!name||name.length>24)throw new Error('Imię musi mieć od 1 do 24 znaków.');
  let profile=profiles.find(p=>normalized(p.name)===normalized(name));
  if(!profile){profile={id:crypto.randomUUID(),name,createdAt:Date.now()};profiles.push(profile);}
  return profile;
 });
 if(new Set(selected.map(p=>p.id)).size!==selected.length)throw new Error('Wybierz różnych graczy.');
 localStorage.setItem(PROFILES_KEY,JSON.stringify(profiles));return selected;
}
