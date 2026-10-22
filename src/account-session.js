export const SESSION_KEY='dart-party-player-session';
const MIGRATED_KEY=SESSION_KEY+':persistent-v1';

// Import the old tab session once. Keep the marker after logout so another
// old tab cannot bring back a session the player explicitly signed out of.
export function persistentSessionStorage(storage=localStorage,legacy=sessionStorage){
 if(!storage.getItem(MIGRATED_KEY)){
  const previous=legacy.getItem(SESSION_KEY);
  if(!storage.getItem(SESSION_KEY)&&previous)storage.setItem(SESSION_KEY,previous);
  storage.setItem(MIGRATED_KEY,'1');
 }
 legacy.removeItem(SESSION_KEY);
 return storage;
}
