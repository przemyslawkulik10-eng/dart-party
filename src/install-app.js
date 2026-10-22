let installPrompt=null;
const appModes=['standalone','minimal-ui','window-controls-overlay'].map(mode=>window.matchMedia(`(display-mode: ${mode})`));
const fullscreen=window.matchMedia('(display-mode: fullscreen)');
const inApp=()=>appModes.some(mode=>mode.matches)||navigator.standalone===true;
let installed=inApp();
try{installed=installed||localStorage.getItem('dart-party-installed')==='true';}catch{}
function rememberInstalled(){try{if(installed)localStorage.setItem('dart-party-installed','true');else localStorage.removeItem('dart-party-installed');}catch{}}
const dialog=document.querySelector('#install-dialog');
const status=document.querySelector('#install-status');
const nativeButton=document.querySelector('#install-native');
const triggers=[...document.querySelectorAll('[data-install-app]')];
function update(){
 const hideInstall=installed||inApp()||fullscreen.matches;
 nativeButton.hidden=!installPrompt||hideInstall;
 rememberInstalled();
 for(const button of triggers){button.hidden=hideInstall;button.textContent='Zainstaluj aplikację';}
 for(const card of document.querySelectorAll('.install-card'))card.hidden=hideInstall;
 if(installed)status.textContent='Korzystasz z zainstalowanej aplikacji. Zeskanuj kod QR, aby otworzyć ją na innym urządzeniu.';
}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();if(inApp()){installed=true;installPrompt=null;}else{installed=false;installPrompt=event;}update();});
window.addEventListener('appinstalled',()=>{installed=true;installPrompt=null;update();status.textContent='DART PARTY została zainstalowana. Znajdziesz ją wśród swoich aplikacji.';});
for(const mode of appModes)mode.addEventListener?.('change',()=>{if(inApp())installed=true;update();});
fullscreen.addEventListener?.('change',update);
async function promptInstall(){
 if(!installPrompt)return;
 const event=installPrompt;installPrompt=null;nativeButton.disabled=true;
 try{
  await event.prompt();
  const choice=await event.userChoice;
  status.textContent=choice.outcome==='accepted'?'Instalacja została zaakceptowana. Poczekaj na zakończenie przez przeglądarkę.':'Instalacja została anulowana. Nadal możesz grać w przeglądarce lub użyć instrukcji poniżej.';
 }catch{status.textContent='Nie udało się otworzyć instalacji. Skorzystaj z instrukcji poniżej.';}
 finally{nativeButton.disabled=false;update();}
}
for(const button of triggers)button.addEventListener('click',()=>{
 if(!installed)status.textContent='Dodaj DART PARTY do swoich aplikacji i otwieraj ją z własnej ikony.';
 update();if(!dialog.open)dialog.showModal();
 if(installPrompt&&!installed)promptInstall();
});
nativeButton.addEventListener('click',promptInstall);
document.querySelector('#install-close').addEventListener('click',()=>dialog.close());
const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const preferred=ios?'ios':/Android/.test(navigator.userAgent)?'android':'desktop';
dialog.querySelector(`[data-install-guide="${preferred}"]`).open=true;
update();
