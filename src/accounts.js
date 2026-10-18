import {createClient} from './vendor/supabase.js';
import {config} from './config.js';
import {useAccount,accountOwner,workspace,replaceWorkspace,validateWorkspace} from './account-storage.js';
let client,user=null,recovery=false;
export const accountsEnabled=()=>!!config.supabaseUrl&&!!config.supabaseKey;
export const accountUser=()=>user;
export const recoveringPassword=()=>recovery;
export function accountClient(){
 if(!accountsEnabled())throw Error('Logowanie wymaga skonfigurowanej chmury.');
 if(!client){client=createClient(config.supabaseUrl,config.supabaseKey,{auth:{storage:sessionStorage,storageKey:'dart-party-player-session',flowType:'implicit',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});client.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY')recovery=true;});}
 return client;
}
function fail(error){if(error){const messages={invalid_credentials:'Nieprawidłowy e-mail lub hasło.',email_not_confirmed:'Potwierdź adres e-mail przed logowaniem.',over_email_send_rate_limit:'Limit wysyłki e-maili. Spróbuj później.',email_address_not_authorized:'Wysyłka e-maili do zawodników nie jest jeszcze skonfigurowana.',weak_password:'Użyj mocniejszego hasła (minimum 10 znaków).'};throw Error(messages[error.code]||'Operacja konta nie powiodła się. Sprawdź połączenie i spróbuj ponownie.');}}
export async function initAccounts(){
 if(!accountsEnabled())return;
 try{const c=accountClient(),{data,error}=await c.auth.getUser();if(error||!data.user||data.user.is_anonymous)return;user=data.user;useAccount(user.id);}catch{useAccount(null);}
}
export async function login(email,password){const {data,error}=await accountClient().auth.signInWithPassword({email,password});fail(error);if(!data.user||data.user.is_anonymous)throw Error('Nieprawidłowe konto gracza.');user=data.user;useAccount(user.id);}
export async function signup(email,password){if(password.length<10)throw Error('Hasło musi mieć co najmniej 10 znaków.');const {error}=await accountClient().auth.signUp({email,password,options:{emailRedirectTo:location.origin+'/?page=konto'}});fail(error);}
export async function resetPassword(email){const {error}=await accountClient().auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/?page=konto'});fail(error);}
export async function changePassword(password){if(password.length<10)throw Error('Hasło musi mieć co najmniej 10 znaków.');const {error}=await accountClient().auth.updateUser({password});fail(error);recovery=false;}
export async function logout(){const {error}=await accountClient().auth.signOut({scope:'local'});fail(error);user=null;useAccount(null);}
const metaKey=id=>'dart-party-account-sync:'+id;
const json=x=>JSON.stringify(x);
function meta(id){try{return JSON.parse(localStorage.getItem(metaKey(id))||'null');}catch{return null;}}
export async function syncAccount({replaceLocal=false}={}){
 const id=accountOwner();if(!id||user?.id!==id)throw Error('Zaloguj się ponownie.');
 const c=accountClient(),{data:verified,error:authError}=await c.auth.getUser();fail(authError);if(verified.user?.id!==id)throw Error('Sesja konta zmieniła się.');
 const before=workspace(id),local=json(before),previous=meta(id);
 const {data:remote,error}=await c.from('dart_player_accounts').select('revision,payload').eq('owner_id',id).maybeSingle();fail(error);
 if(accountOwner()!==id)throw Error('Sesja konta zmieniła się.');
 const remoteData=remote?validateWorkspace(remote.payload):{};
 if(remote&&(replaceLocal||remote.revision!==previous?.revision)){
  const dirty=previous?local!==previous.baseline:Object.keys(before).length>0;
  if(dirty&&local!==json(remoteData)&&!replaceLocal)throw Error('Konflikt: na drugim urządzeniu zapisano inne wyniki. Pobierz kopię lokalną, a następnie wybierz „Wczytaj chmurę”.');
  if(json(workspace(id))!==local)throw Error('Wyniki zmieniły się podczas synchronizacji. Spróbuj ponownie.');
  if(dirty&&replaceLocal)localStorage.setItem('dart-party-account-backup:'+id+':'+Date.now(),local);
  replaceWorkspace(remoteData,id);localStorage.setItem(metaKey(id),json({revision:remote.revision,baseline:json(remoteData)}));return 'Pobrano dane konta z chmury.';
 }
 if(remote&&previous&&local===previous.baseline)return 'Dane konta są aktualne.';
 const {data:saved,error:writeError}=await c.rpc('save_dart_player_account',{expected_revision:remote?.revision||0,new_payload:before});fail(writeError);
 if(!saved?.length)throw Error('Dane zmieniły się na drugim urządzeniu. Spróbuj ponownie.');
 localStorage.setItem(metaKey(id),json({revision:saved[0].revision,baseline:local}));return 'Zapisano dane konta w chmurze.';
}
