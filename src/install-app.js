let installPrompt=null;
let installed=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const dialog=document.querySelector('#install-dialog');
const status=document.querySelector('#install-status');
const nativeButton=document.querySelector('#install-native');
const triggers=[...document.querySelectorAll('[data-install-app]')];
function update(){
 nativeButton.hidden=!installPrompt||installed;
 for(const button of triggers)button.textContent=installed?'Aplikacja zainstalowana · kod QR':'Zainstaluj aplikację';
 if(installed)status.textContent='Korzystasz z zainstalowanej aplikacji. Zeskanuj kod QR, aby otworzyć ją na innym urządzeniu.';
}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;update();});
window.addEventListener('appinstalled',()=>{installed=true;installPrompt=null;update();status.textContent='DART PARTY została zainstalowana. Znajdziesz ją wśród swoich aplikacji.';});
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
