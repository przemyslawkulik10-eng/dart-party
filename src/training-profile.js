import {selectedProfile,loadProfiles} from './profiles.js';
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
