import {loadMatches,saveMatch} from './storage.js';
import {loadProfiles} from './profiles.js';
const BACKUP_KEY='dart-party-profile-links-backup-v1';
export function linkLegacyMatch(matchId,profileIds){
 const match=loadMatches().find(m=>m.id===matchId);
 if(!match||match.profileIds)throw new Error('Mecz nie istnieje lub ma już przypisane profile.');
 const profiles=loadProfiles();
 if(!Array.isArray(profileIds)||profileIds.length!==match.names.length||new Set(profileIds).size!==profileIds.length||profileIds.some(id=>!profiles.some(p=>p.id===id)))throw new Error('Wybierz osobny profil dla każdego gracza.');
 const backups=JSON.parse(localStorage.getItem(BACKUP_KEY)||'[]');
 if(!Array.isArray(backups))throw new Error('Nie można odczytać kopii. Nic nie zmieniono.');
 localStorage.setItem(BACKUP_KEY,JSON.stringify([...backups,{savedAt:new Date().toISOString(),match}]));
 return saveMatch({...match,profileIds:[...profileIds]});
}
