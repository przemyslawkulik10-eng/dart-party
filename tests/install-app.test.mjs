import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/install-app.js',import.meta.url),'utf8');
function setup(standalone=false){
 const element=()=>({hidden:false,disabled:false,textContent:'',open:false,handlers:{},addEventListener(name,fn){this.handlers[name]=fn;}});
 const dialog=element(),status=element(),native=element(),trigger=element(),close=element(),guides={ios:element(),android:element(),desktop:element()},events={};
 dialog.showModal=()=>dialog.open=true;dialog.close=()=>dialog.open=false;dialog.querySelector=s=>guides[s.match(/"(.*?)"/)[1]];
 const nodes={'#install-dialog':dialog,'#install-status':status,'#install-native':native,'#install-close':close};
 vm.runInNewContext(source,{document:{querySelector:s=>nodes[s],querySelectorAll:()=>[trigger]},window:{matchMedia:()=>({matches:standalone,addEventListener(){}}),addEventListener:(name,fn)=>events[name]=fn},navigator:{userAgent:'test',platform:'test',maxTouchPoints:0}});
 return {dialog,status,native,trigger,close,events,guides};
}
test('unsupported browser opens instructions and QR without a fake installation action',()=>{
 const t=setup();t.trigger.handlers.click();assert.equal(t.dialog.open,true);assert.equal(t.native.hidden,true);assert.equal(t.guides.desktop.open,true);t.close.handlers.click();assert.equal(t.dialog.open,false);
});
test('native prompt is one use, cancellation keeps manual instructions available',async()=>{
 const t=setup();let prompts=0,prevented=false;
 t.events.beforeinstallprompt({preventDefault(){prevented=true;},async prompt(){prompts++;},userChoice:Promise.resolve({outcome:'dismissed'})});
 assert.equal(prevented,true);assert.equal(t.native.hidden,false);await t.native.handlers.click();
 assert.equal(prompts,1);assert.equal(t.native.hidden,true);assert.match(t.status.textContent,/anulowana/);await t.native.handlers.click();assert.equal(prompts,1);
});
test('installed app hides installation entry in standalone',()=>{
 const t=setup(true);assert.equal(t.trigger.hidden,true);assert.match(t.status.textContent,/innym urządzeniu/);assert.equal(t.native.hidden,true);
});
