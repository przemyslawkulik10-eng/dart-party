// Only one live stream may survive. Late permission responses are disposed of.
export class CameraSource {
  constructor(mediaDevices,onLost=()=>{},onPause=()=>{}) {this.mediaDevices=mediaDevices;this.onLost=onLost;this.onPause=onPause;this.version=0;this.stream=null;}
  stop() {this.version++;const old=this.stream;this.stream=null;old?.getTracks().forEach(t=>t.stop());}
  async start(deviceId='') {
    this.stop();const version=this.version;
    const video={width:{ideal:1920},height:{ideal:1080},frameRate:{ideal:30}};
    if(deviceId)video.deviceId={exact:deviceId};else video.facingMode={ideal:'environment'};
    const stream=await this.mediaDevices.getUserMedia({audio:false,video});
    if(version!==this.version){stream.getTracks().forEach(t=>t.stop());return null;}
    if(stream.getVideoTracks().some(t=>isDeskView(t.label))){
      stream.getTracks().forEach(t=>t.stop());
      throw Object.assign(new Error('Widok blatu'),{name:'DeskViewError'});
    }
    this.stream=stream;
    for(const track of stream.getVideoTracks()){
      track.addEventListener('ended',()=>{if(this.stream===stream){this.stop();this.onLost();}},{once:true});
      for(const event of ['mute','unmute'])track.addEventListener(event,()=>{
        if(this.stream===stream)this.onPause(event==='mute');
      });
    }
    return stream;
  }
}
export function cameraError(error) {
  if(error?.name==='DeskViewError')return 'Zatrzymano Widok blatu, który zniekształca obraz. Wybierz z listy zwykłą kamerę iPhone’a (bez „Widok blatu”) i naciśnij „Sprawdź kamerę”.';
  return ({NotAllowedError:'Brak zgody na kamerę. Zezwól na kamerę dla tej strony w ustawieniach przeglądarki.',NotFoundError:'Nie znaleziono kamery. Podłącz iPhone’a do Maca i sprawdź Kamerę Continuity.',NotReadableError:'Kamera jest zajęta lub niedostępna. Zamknij aplikację używającą kamery i spróbuj ponownie.',OverconstrainedError:'Wybrana kamera jest niedostępna. Odśwież listę i wybierz źródło ponownie.'})[error?.name] || `Nie udało się uruchomić obrazu (${error?.name || 'błąd'}). Spróbuj ponownie.`;
}
export function isDeskView(label='') {return /widok\s*blatu|desk\s*view/i.test(label);}
const selectionKey='dart-camera-source-v1';
export function readCameraSelection(storage){
  try{const value=JSON.parse(storage.getItem(selectionKey));return typeof value?.id==='string'&&typeof value?.label==='string'&&!isDeskView(value.label)?value:{id:'',label:''};}catch{return {id:'',label:''};}
}
export function saveCameraSelection(storage,selection){
  try{if(selection.id&&!isDeskView(selection.label))storage.setItem(selectionKey,JSON.stringify(selection));else storage.removeItem(selectionKey);}catch{/* Private browsing may disable session storage. */}
}
export function cameraOptions(list,selection){
  const options=list.filter(d=>d.kind==='videoinput'&&d.deviceId).map((d,i)=>({id:d.deviceId,label:d.label||`Kamera ${i+1} — nazwa po udzieleniu zgody`,disabled:isDeskView(d.label)}));
  if(selection.id&&!options.some(o=>o.id===selection.id))options.push({id:selection.id,label:`${selection.label||'Wybrana kamera'} — oczekiwanie na urządzenie`,disabled:false});
  return options;
}
