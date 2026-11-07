import test from 'node:test';
import assert from 'node:assert/strict';
import {calibrate,project,fieldAt,SECTORS} from '../src/camera-geometry.js';
import {CameraSource,cameraError,isDeskView,readCameraSelection,saveCameraSelection,cameraOptions} from '../src/camera-source.js';
import {imagePoint,viewZoom} from '../src/camera-view.js';
import {CameraFrameGate} from '../src/camera-health.js';
const front=[[.5,.1],[.9,.5],[.5,.9],[.1,.5]];
test('camera geometry: center, doubles, triples and all 20 sectors',()=>{
 const h=calibrate(front);const center=project(h,[.5,.5]);assert.ok(Math.hypot(...center)<1e-8);
 assert.equal(fieldAt(center).score,50);assert.equal(fieldAt([0,10]).score,25);assert.equal(fieldAt([0,180]).score,0);
 SECTORS.forEach((n,i)=>{for(const [r,m] of [[50,1],[103,3],[166,2]]){const a=i*Math.PI/10,result=fieldAt([r*Math.sin(a),-r*Math.cos(a)]);assert.equal(result.number,n);assert.equal(result.multiplier,m);assert.equal(result.nearWire,false);}});
});
test('camera geometry: known tilted perspective recovers independent interior points',()=>{
 const toImage=([x,y])=>{const d=1+.001*x+.0005*y;return [(.002*x+.0002*y+.5)/d,(.0001*x+.0018*y+.45)/d];};
 const h=calibrate([[0,-170],[170,0],[0,170],[-170,0]].map(toImage));
 for(const p of [[0,0],[32,-102],[-93,53],[0,166]])assert.ok(Math.hypot(...project(h,toImage(p)).map((v,i)=>v-p[i]))<1e-7);
});
test('camera geometry: rejects crossed, tiny, duplicate and invalid points',()=>{
 for(const p of [[front[0],front[2],front[1],front[3]],Array(4).fill([.5,.5]),[[.5,.49],[.51,.5],[.5,.51],[.49,.5]],[[NaN,.1],...front.slice(1)],[[2,.1],...front.slice(1)]])assert.throws(()=>calibrate(p));
});
test('camera geometry: wire warnings and non-finite rejection',()=>{
 assert.equal(fieldAt([0,-107]).nearWire,true);assert.equal(fieldAt([100*Math.sin(Math.PI/20),-100*Math.cos(Math.PI/20)]).nearWire,true);assert.throws(()=>fieldAt([NaN,0]));
});
test('camera geometry: sparse and malformed calibration never produces a score',()=>{
 const missing=front.map(p=>[...p]);delete missing[2][1];
 for(const points of [null,undefined,{},new Array(4),[front[0],,front[2],front[3]],missing,[null,...front.slice(1)],[[.5,.1,0],...front.slice(1)],[[.5,'0.1'],...front.slice(1)]]){
  assert.throws(()=>calibrate(points),/Wskaż cztery punkty/);
 }
 const h=calibrate(front),sparse=[...h];delete sparse[0];
 for(const matrix of [null,{},new Array(8),sparse,h.slice(1),[NaN,...h.slice(1)],[Infinity,...h.slice(1)]])assert.throws(()=>project(matrix,[.5,.5]),/Nieprawidłowa kalibracja/);
 for(const point of [null,{},new Array(2),[.5],[.5,.5,0],[.5,undefined],['.5',.5],[Infinity,0]]){
  assert.throws(()=>project(h,point),/Nieprawidłowa kalibracja/);assert.throws(()=>fieldAt(point),/Nieprawidłowy punkt/);
 }
 assert.throws(()=>project([Number.MAX_VALUE,0,0,0,1,0,0,0],[2,0]),/Punkt poza zakresem/);
 assert.throws(()=>project([1,0,0,0,1,0,-2,0],[.5,.5]),/Punkt poza zakresem/);
 assert.equal(fieldAt(project(h,[.5,.5])).score,50);
});
function fakeStream(){const track=new EventTarget();track.stopped=false;track.stop=()=>{track.stopped=true;};return {track,getTracks:()=>[track],getVideoTracks:()=>[track]};}
test('camera source: late permission after stop never leaves camera running',async()=>{
 let resolve;const source=new CameraSource({getUserMedia:()=>new Promise(r=>resolve=r)});const pending=source.start();source.stop();const stream=fakeStream();resolve(stream);assert.equal(await pending,null);assert.ok(stream.track.stopped);
});
test('camera source: mute preserves stream, unmute resumes, ended releases it',async()=>{
 const streams=[],pauses=[];let lost=0;const source=new CameraSource({getUserMedia:async c=>{assert.equal(c.audio,false);const s=fakeStream();streams.push(s);return s;}},()=>lost++,paused=>pauses.push(paused));
 await source.start();await source.start('iphone');assert.ok(streams[0].track.stopped);streams[0].track.dispatchEvent(new Event('ended'));assert.equal(lost,0);
 streams[1].track.dispatchEvent(new Event('mute'));assert.equal(lost,0);assert.equal(streams[1].track.stopped,false);assert.equal(source.stream,streams[1]);
 streams[1].track.dispatchEvent(new Event('unmute'));assert.deepEqual(pauses,[true,false]);
 streams[0].track.dispatchEvent(new Event('mute'));assert.deepEqual(pauses,[true,false]);
 streams[1].track.dispatchEvent(new Event('ended'));assert.equal(lost,1);assert.ok(streams[1].track.stopped);assert.equal(source.stream,null);
});
test('frame readiness rejects frozen frames and requires a fresh frame after tab or mute pause',()=>{
 const gate=new CameraFrameGate();const sample=(time,now,extra={})=>gate.sample({time,now,...extra});
 assert.equal(sample(10,0),false);assert.equal(sample(10.1,100),true);
 assert.equal(sample(10.1,4201),false);assert.equal(sample(11,4300),true);
 assert.equal(sample(11,4500,{hidden:true}),false);
 assert.equal(sample(11,10000),false);assert.equal(sample(11.1,10100),true);
 assert.equal(sample(12,10200,{muted:true}),false);assert.equal(sample(12,10300),false);
 assert.equal(sample(12.1,10400),true);gate.reset();assert.equal(sample(20,10500),false);
});
test('camera source: overlapping requests only retain newest stream',async()=>{
 const resolves=[];const source=new CameraSource({getUserMedia:()=>new Promise(r=>resolves.push(r))});const first=source.start(),second=source.start();const a=fakeStream(),b=fakeStream();resolves[1](b);await second;resolves[0](a);assert.equal(await first,null);assert.ok(a.track.stopped);assert.equal(source.stream,b);source.stop();assert.ok(b.track.stopped);
});
test('camera permission failures remain errors, not successful images',async()=>{
 const source=new CameraSource({getUserMedia:async()=>{throw Object.assign(new Error(),{name:'NotAllowedError'});}});await assert.rejects(source.start(),{name:'NotAllowedError'});assert.equal(source.stream,null);assert.match(cameraError({name:'NotAllowedError'}),/Brak zgody/);
});
test('Desk View is rejected even if provided as the default device',async()=>{
 for(const label of ['Kamera aplikacji Widok blatu (Warzywko)','iPhone Desk View Camera']){
  const stream=fakeStream();stream.track.label=label;
  const source=new CameraSource({getUserMedia:async()=>stream});
  await assert.rejects(source.start(),{name:'DeskViewError'});assert.ok(stream.track.stopped);assert.equal(source.stream,null);
 }
 assert.equal(isDeskView('Kamera (Warzywko)'),false);
});
test('selected physical camera survives refresh, reload and temporary disappearance',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const selected={id:'physical-iphone',label:'Kamera (Warzywko)'};
 saveCameraSelection(storage,selected);assert.deepEqual(readCameraSelection(storage),selected);
 const devices=[{kind:'videoinput',deviceId:'desk',label:'Widok blatu'},{kind:'videoinput',deviceId:'physical-iphone',label:selected.label}];
 assert.equal(cameraOptions(devices,selected).find(o=>o.id==='desk').disabled,true);
 assert.equal(cameraOptions([],selected)[0].id,selected.id);
 assert.equal(cameraOptions(devices,selected).filter(o=>o.id===selected.id).length,1);
 saveCameraSelection(storage,{id:'desk',label:'Widok blatu'});assert.equal(readCameraSelection(storage).id,'');
 assert.deepEqual(readCameraSelection(undefined),{id:'',label:''});assert.doesNotThrow(()=>saveCameraSelection(undefined,selected));
});
test('rotating, zooming and panning preserve calibrated field coordinates',()=>{
 const h=calibrate(front);
 for(const rotation of [0,90,180,270])for(const zoom of [1,1.25,2,4]){
  // Independent forward CSS transform of a non-square 640×360 image.
  const theta=rotation*Math.PI/180,cos=Math.round(Math.cos(theta)),sin=Math.round(Math.sin(theta));
  const bounds={left:130,top:-45,width:(rotation%180?360:640)*zoom,height:(rotation%180?640:360)*zoom};
  for(const point of [[.5,.5],[.5,.26],[.5,.89],[.8,.5]]){
   const x=(point[0]-.5)*640,y=(point[1]-.5)*360;
   const clientX=bounds.left+bounds.width/2+zoom*(cos*x-sin*y),clientY=bounds.top+bounds.height/2+zoom*(sin*x+cos*y);
   const recovered=imagePoint(clientX,clientY,bounds,rotation);
   assert.ok(Math.hypot(recovered[0]-point[0],recovered[1]-point[1])<1e-10);
   assert.equal(fieldAt(project(h,recovered)).score,fieldAt(project(h,point)).score);
  }
 }
 assert.equal(viewZoom(.5),1);assert.equal(viewZoom(5),4);
});
