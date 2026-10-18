// Account data is one atomic local document. Guest data keeps its original keys.
export const ACCOUNT_KEYS=['dart-party-profiles-v1','dart-party-selected-profile-v1','dart-party-matches-v1','dart-party-training-v1','dart-party-jdc-v1','dart-party-cyferki-v1','dart-party-mnoznik-v1','dart-party-mnoznik-sparing-v1','dart-party-bull-off','dart-party-library-v1'];
let owner=null;
export const accountOwner=()=>owner;
export function useAccount(id){if(id!==null&&!/^[0-9a-f-]{36}$/i.test(id))throw Error('Nieprawidłowe konto.');owner=id;}
const key=id=>'dart-party-account-data:'+id;
export function validateWorkspace(data){if(!data||Array.isArray(data)||typeof data!=='object'||Object.entries(data).some(([k,v])=>!ACCOUNT_KEYS.includes(k)||typeof v!=='string')||JSON.stringify(data).length>4000000)throw Error('Nieprawidłowy lub zbyt duży zapis konta.');return data;}
export function workspace(id=owner){if(!id)return {};return validateWorkspace(JSON.parse(localStorage.getItem(key(id))||'{}'));}
export function replaceWorkspace(data,id=owner){if(!id)throw Error('Zaloguj się.');localStorage.setItem(key(id),JSON.stringify(validateWorkspace(data)));}
export const appStorage={
 getItem(k){if(!owner)return localStorage.getItem(k);return ACCOUNT_KEYS.includes(k)?workspace()[k]??null:localStorage.getItem(key(owner)+':extra:'+k);},
 setItem(k,v){if(!owner)return localStorage.setItem(k,v);if(!ACCOUNT_KEYS.includes(k)){localStorage.setItem(key(owner)+':extra:'+k,String(v));return;}replaceWorkspace({...workspace(),[k]:String(v)});},
 removeItem(k){if(!owner)return localStorage.removeItem(k);if(!ACCOUNT_KEYS.includes(k))return localStorage.removeItem(key(owner)+':extra:'+k);const data=workspace();delete data[k];replaceWorkspace(data);}
};
export function guestWorkspace(){return Object.fromEntries(ACCOUNT_KEYS.map(k=>[k,localStorage.getItem(k)]).filter(([,v])=>v!==null));}
