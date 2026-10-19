import {addPasswordVisibility} from './password-visibility.js';
import {mountAuthPanel} from './auth-panel.js';
import {accountUser,accountsEnabled,recoveringPassword,login,signup,logout,resetPassword,changePassword,syncAccount} from './accounts.js';
import {workspace} from './account-storage.js';
import {ensureProfiles,selectProfile,selectedProfile} from './profiles.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountAccount(root,{bootstrap=true,message=""}={}){
 document.body.dataset.view='account';
 const user=accountUser();
 if(!user&&accountsEnabled()){mountAuthPanel(root,{login,signup,resetPassword,onLogin:()=>location.assign('/?page=konto')});return;}
 root.innerHTML=`<section class="account-panel"><a href="/">← Strona główna</a><p class="eyebrow">DART PARTY · TWOJE KONTO</p><h1>${user?'Ustawienia konta':'Wracaj do swojej gry'}</h1><p>${user?'Tutaj zarządzasz synchronizacją wyników, kopią danych i logowaniem. Pseudonim i statystyki znajdziesz w Profilu gracza.':'Możesz nadal grać jako gość. Konto ma oddzielny profil i historię.'}</p><p role="status" id="account-status" aria-live="polite"></p>${!accountsEnabled()?'<p>Logowanie nie jest dostępne w tej wersji lokalnej.</p>':user?`<p>Zalogowano: <strong>${esc(user.email||'gracz')}</strong></p>${recoveringPassword()?'<form id="password-form"><label>Nowe hasło<input name="password" type="password" autocomplete="new-password" minlength="10" required></label><button class="primary">Zapisz nowe hasło</button></form>':''}<div class="account-actions"><button id="account-sync" class="primary">Synchronizuj wyniki</button><button id="account-download">Pobierz kopię lokalną</button><button id="account-pull">Wczytaj chmurę</button></div><p class="small muted">Synchronizuj po zakończeniu gry i przed zmianą urządzenia. Wczytanie chmury zastępuje lokalną wersję konta; przedtem zachowamy kopię na tym urządzeniu. Dane gościa pozostają oddzielnie.</p>${selectedProfile()?'<a href="/?page=profil">Przejdź do profilu gracza →</a>':'<form id="profile-form"><label>Twój pseudonim<input name="nickname" maxlength="24" required autocomplete="nickname"></label><button>Utwórz profil gracza</button></form>'}<hr><button id="account-logout">Wyloguj z tego urządzenia</button>`:''}</section>`;
 addPasswordVisibility(root);
 const status=root.querySelector('#account-status');status.textContent=message;
 async function run(action){const buttons=[...root.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);status.textContent='Proszę czekać…';try{status.textContent=await action()||'Gotowe.';}catch(e){status.textContent=e.message;}finally{buttons.forEach(b=>b.disabled=false);}}
 if(!user)return;
 async function refreshAccount(options){const result=await syncAccount(options);mountAccount(root,{bootstrap:false,message:result});return result;}
 root.querySelector('#account-sync').onclick=()=>run(()=>refreshAccount());
 root.querySelector('#account-pull').onclick=()=>run(()=>refreshAccount({replaceLocal:true}));
 root.querySelector('#account-download').onclick=()=>run(async()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(workspace(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='dart-party-konto-kopia.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return 'Pobrano kopię lokalnych danych konta.';});
 root.querySelector('#account-logout').onclick=()=>run(async()=>{await logout();location.assign('/');});
 const pf=root.querySelector('#profile-form');if(pf)pf.onsubmit=e=>{e.preventDefault();run(async()=>{const [p]=ensureProfiles([pf.elements.nickname.value]);selectProfile(p.id);location.assign('/?page=profil');});};
 if(bootstrap&&!recoveringPassword()){if(pf)pf.hidden=true;run(()=>refreshAccount());}
 const pass=root.querySelector('#password-form');if(pass)pass.onsubmit=e=>{e.preventDefault();run(async()=>{await changePassword(pass.elements.password.value);pass.remove();return 'Hasło zostało zmienione.';});};
}
