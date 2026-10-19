import {selectedProfile,PROFILE_AVATARS,validAvatarImage} from './profiles.js';
export function mountPlayerMenu(container,{user,onNavigate,onLogout,toast}){
 if(!user){
  const link=document.createElement('a');link.href='/?page=konto';link.className='account-link account-entry';link.textContent='Zaloguj się';container.append(link);
  return ()=>link.remove();
 }
 const wrapper=document.createElement('div');wrapper.className='player-account';
 wrapper.innerHTML='<button id="player-menu-toggle" class="player-menu-toggle" aria-expanded="false" aria-controls="player-menu-links"><img alt="" width="30" height="30" class="game-icon"><span></span><b aria-hidden="true">▾</b></button><nav id="player-menu-links" class="player-menu-links" aria-label="Menu konta" hidden><small>Zalogowano</small><p data-account-email></p><button data-panel>Panel gracza</button><a href="/?page=konto">Ustawienia konta</a><button data-logout>Wyloguj się</button></nav>';
 container.append(wrapper);const toggle=wrapper.querySelector('button'),nav=wrapper.querySelector('nav');
 wrapper.querySelector('[data-account-email]').textContent=user.email||'';
 const close=()=>{nav.hidden=true;toggle.setAttribute('aria-expanded','false');};
 function refresh(){try{const p=selectedProfile();toggle.querySelector('span').textContent=p?.name||'Konto';toggle.querySelector('img').classList.toggle('has-photo',validAvatarImage(p?.avatarImage));toggle.querySelector('img').src=validAvatarImage(p?.avatarImage)?p.avatarImage:`/public/game-icons/${PROFILE_AVATARS.includes(p?.avatar)?p.avatar:'person-circle'}.svg`;}catch(e){toast(e.message);}}
 toggle.onclick=()=>{refresh();nav.hidden=!nav.hidden;toggle.setAttribute('aria-expanded',String(!nav.hidden));};
 wrapper.querySelector('[data-panel]').onclick=()=>{close();onNavigate();};
 const logout=wrapper.querySelector('[data-logout]');
 logout.onclick=async()=>{logout.disabled=true;logout.textContent='Wylogowywanie…';try{await onLogout();}catch(e){toast(e.message);logout.disabled=false;logout.textContent='Wyloguj się';}};
 const outside=e=>{if(!wrapper.contains(e.target))close();},escape=e=>{if(e.key==='Escape'&&!nav.hidden){close();toggle.focus();}};
 document.addEventListener('click',outside);document.addEventListener('keydown',escape);window.addEventListener('dart-profile-change',refresh);refresh();
 return ()=>{document.removeEventListener('click',outside);document.removeEventListener('keydown',escape);window.removeEventListener('dart-profile-change',refresh);wrapper.remove();};
}
