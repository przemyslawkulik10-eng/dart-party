// Keep unfinished activities blocked even when the player opens another screen.
const activities=new Set();
let notify=()=>{};
export function updateActivity(id,unfinished){
 if(unfinished)activities.add(id);else activities.delete(id);
 notify();
}
export function createUpdateChecker({version,fetchVersion,blocked,show,reload,online=()=>true}){
 let available=null,checking=false,applying=false;
 const render=()=>show(!!available&&!blocked(),applying);
 async function check(){
  if(checking||!online())return false;
  checking=true;
  try{
   const next=await fetchVersion();
   if(!/^[a-f0-9]{64}$/.test(next))return false;
   available=next!==version?next:null;
   render();return true;
  }catch{return false;}
  finally{checking=false;}
 }
 async function apply(){
  if(!available||blocked()||applying||!online())return;
  applying=true;render();
  // Recheck both the deployment and match state after the network request.
  const reachable=await check();
  if(reachable&&available&&!blocked()&&online())reload();
  applying=false;render();
 }
 return {check,apply,render};
}
export function initUpdates(){
 const version=document.querySelector('meta[name="app-build"]')?.content;
 if(!/^[a-f0-9]{64}$/.test(version||''))return; // Only built releases have an identity.
 const banner=document.createElement('aside');
 banner.className='app-update';banner.hidden=true;
 banner.setAttribute('aria-label','Aktualizacja aplikacji');
 banner.innerHTML='<div role="status"><strong>Dostępna jest nowa wersja aplikacji</strong><p>Możesz teraz bezpiecznie odświeżyć aplikację.</p></div><button type="button" class="primary">Aktualizuj</button>';
 document.body.append(banner);
 const button=banner.querySelector('button');
 const checker=createUpdateChecker({version,blocked:()=>activities.size>0,
  online:()=>navigator.onLine,
  fetchVersion:async()=>{
   const response=await fetch('/public/app-version.json',{cache:'no-store',signal:AbortSignal.timeout(10000)});
   if(!response.ok)throw new Error('Version unavailable');
   return (await response.json()).version;
  },
  show:(visible,busy)=>{banner.hidden=!visible;button.disabled=busy;button.textContent=busy?'Sprawdzanie…':'Aktualizuj';},
  reload:()=>location.reload()
 });
 notify=checker.render;
 button.onclick=checker.apply;
 const checkVisible=()=>{if(document.visibilityState==='visible')checker.check();};
 document.addEventListener('visibilitychange',checkVisible);
 window.addEventListener('online',checkVisible);
 window.addEventListener('focus',checkVisible);
 setInterval(checkVisible,60000);
 checker.check();
}
