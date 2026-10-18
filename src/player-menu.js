import {selectedProfile,selectProfile,PROFILE_AVATARS,validAvatarImage} from './profiles.js';
export function mountPlayerMenu(container,{onNavigate,toast}){
 const wrapper=document.createElement('div');wrapper.className='player-account';
 wrapper.innerHTML='<button id="player-menu-toggle" class="player-menu-toggle" aria-expanded="false" aria-controls="player-menu-links"><img alt="" width="30" height="30" class="game-icon"><span></span></button><nav id="player-menu-links" class="player-menu-links" aria-label="Menu zawodnika" hidden><p data-current-profile></p><small>Profil lokalny · to urządzenie</small>'+[['profile','Mój profil'],['games','Moje gry'],['history','Historia rozgrywek'],['stats','Statystyki i treningi'],['settings','Edycja profilu'],['switch','Zmień zawodnika']].map(([key,label])=>`<button data-player-link="${key}">${label}</button>`).join('')+'</nav>';
 container.append(wrapper);const toggle=wrapper.querySelector('button'),nav=wrapper.querySelector('nav');
 const close=()=>{nav.hidden=true;toggle.setAttribute('aria-expanded','false');};
 function refresh(){try{const p=selectedProfile();toggle.querySelector('span').textContent=p?.name||'Zawodnik';toggle.querySelector('img').classList.toggle('has-photo',validAvatarImage(p?.avatarImage));toggle.querySelector('img').src=validAvatarImage(p?.avatarImage)?p.avatarImage:`/public/game-icons/${PROFILE_AVATARS.includes(p?.avatar)?p.avatar:'person-circle'}.svg`;wrapper.querySelector('[data-current-profile]').textContent=p?.name||'Wybierz lub dodaj gracza';}catch(e){toast(e.message);}}
 toggle.onclick=()=>{refresh();nav.hidden=!nav.hidden;toggle.setAttribute('aria-expanded',String(!nav.hidden));};
 wrapper.querySelectorAll('[data-player-link]').forEach(button=>button.onclick=()=>{try{const section=button.dataset.playerLink;close();if(section==='switch')selectProfile(null);onNavigate({tab:section==='switch'?'profile':section,pick:section==='switch'});}catch(e){toast(e.message);}});
 const outside=e=>{if(!wrapper.contains(e.target))close();},escape=e=>{if(e.key==='Escape'&&!nav.hidden){close();toggle.focus();}};
 document.addEventListener('click',outside);document.addEventListener('keydown',escape);window.addEventListener('dart-profile-change',refresh);refresh();
 return ()=>{document.removeEventListener('click',outside);document.removeEventListener('keydown',escape);window.removeEventListener('dart-profile-change',refresh);wrapper.remove();};
}
