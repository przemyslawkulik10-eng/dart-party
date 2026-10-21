import {selectedProfile,loadProfiles,ensureProfiles} from './profiles.js';
import {accountOwner} from './account-storage.js';
// Bind a session to identity, never resolve an existing player by display name.
export function trainingProfile(initialProfile=null){
 const owner=accountOwner(),id=(initialProfile||selectedProfile())?.id;
 return ()=>{
  if(accountOwner()!==owner)throw Error('Konto zmieniło się. Otwórz trening ponownie.');
  if(!id)return null;
  const profile=loadProfiles().find(p=>p.id===id);
  if(!profile)throw Error('Profil zmienił się. Otwórz trening ponownie.');
  return profile;
 };
}

export function playerRoster(names,player){
 if(!player)return names;
 return [player.name,...names.filter(n=>n.trim().toLocaleUpperCase('pl-PL')!==player.name.toLocaleUpperCase('pl-PL'))].slice(0,6);
}
export function rosterProfiles(names,player){
 const profiles=ensureProfiles(player?[player.name,...names.slice(1)]:names);
 if(player)profiles[0]=player;
 return profiles;
}
