import {appStorage} from './account-storage.js';
export const PROFILES_KEY='dart-party-profiles-v1';
export const validProfileId=id=>typeof id==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const normalized=name=>name.trim().toLocaleUpperCase('pl-PL');
export function loadProfiles(){
 const profiles=JSON.parse(appStorage.getItem(PROFILES_KEY)||'[]');
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
 appStorage.setItem(PROFILES_KEY,JSON.stringify(profiles));return selected;
}

const SELECTED_KEY='dart-party-selected-profile-v1';
export function selectedProfile(){const id=appStorage.getItem(SELECTED_KEY);return loadProfiles().find(p=>p.id===id)||null;}
export function selectProfile(id){if(id!==null&&!loadProfiles().some(p=>p.id===id))throw new Error('Nie znaleziono profilu.');if(id===null)appStorage.removeItem(SELECTED_KEY);else appStorage.setItem(SELECTED_KEY,id);}
export const PROFILE_AVATARS=['person-circle','bullseye','trophy','crosshair'];
export function updateProfile(id,changes){
 const all=loadProfiles(),index=all.findIndex(p=>p.id===id);if(index<0)throw new Error('Nie znaleziono profilu.');
 const name=String(changes.name??all[index].name).trim();if(!name||name.length>24)throw new Error('Pseudonim musi mieć od 1 do 24 znaków.');
 if(all.some(p=>p.id!==id&&normalized(p.name)===normalized(name)))throw new Error('Ten pseudonim należy już do innego gracza.');
 const next={...all[index],name};
 for(const [field,max] of [['hometown',60],['darts',80],['goal',140]]){const value=String(changes[field]??next[field]??'').trim();if(value.length>max)throw new Error('Wpisany opis jest zbyt długi.');next[field]=value;}
 next.avatar=changes.avatar??next.avatar??'person-circle';if(!PROFILE_AVATARS.includes(next.avatar))throw new Error('Wybierz avatar z listy.');
 if(changes.avatarImage!==undefined){if(changes.avatarImage!==''&&!validAvatarImage(changes.avatarImage))throw new Error('Wybierz zdjęcie PNG, JPG lub WebP do 500 KB.');next.avatarImage=changes.avatarImage;}
 all[index]=next;appStorage.setItem(PROFILES_KEY,JSON.stringify(all));return next;
}

export const validAvatarImage=value=>typeof value==='string'&&value.length<=700000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
