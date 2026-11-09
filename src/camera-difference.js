// Original image-difference experiment. A candidate is a change, never a scored dart.
// All frames must share calibration, crop, dimensions and a fixed camera position.
const bytes=value=>value instanceof Uint8Array||value instanceof Uint8ClampedArray;
const finiteRange=(value,min,max)=>Number.isFinite(value)&&value>=min&&value<=max;
export function toGray(rgba){
 if(!bytes(rgba)||!rgba.length||rgba.length%4||rgba.length>16e6)throw new Error('Nieprawidłowa klatka RGBA.');
 const gray=new Uint8Array(rgba.length/4);
 for(let i=0;i<gray.length;i++)gray[i]=Math.round(.299*rgba[i*4]+.587*rgba[i*4+1]+.114*rgba[i*4+2]);
 return gray;
}
function shiftBetween(a,b){
 const bins=new Uint32Array(511);for(let i=0;i<a.length;i++)bins[b[i]-a[i]+255]++;
 let n=0;for(let i=0;i<bins.length;i++){n+=bins[i];if(n>=a.length/2)return i-255;}return 0;
}
// Isolated sensor/compression flicker is not evidence of a moving object.
// The same rule filters the change mask: supra-threshold noise must not block
// an empty board or fake a removal. Keep thin connected edges (two neighbours),
// including one-pixel dart shafts.
function supportedCount(mask,width,height){
 let total=0;
 for(let i=0;i<mask.length;i++)if(mask[i]){
  const x=i%width,y=Math.floor(i/width);let neighbours=0;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   if(!dx&&!dy)continue;
   const xx=x+dx,yy=y+dy;
   if(xx>=0&&xx<width&&yy>=0&&yy<height)neighbours+=mask[yy*width+xx];
  }
  if(neighbours>=2)total++;
 }
 return total;
}
// A conservative shape gate, NOT a probability or proof of a board-contact tip.
// The caller still needs fresh temporal agreement, field-boundary checks and
// real-device validation. Strong shadows/occlusion can mimic this silhouette.
function assessEndpointShape(pixels,{width,height,mx,my,ux,uy,lo,hi,endpoints,reference,current,lighting,threshold}){
 const length=hi-lo,bins=Array.from({length:10},()=>({min:Infinity,max:-Infinity,count:0,strong:0}));
 let strong=0;
 const strongThreshold=Math.min(254,Math.max(60,threshold*2));
 for(const [x,y] of pixels){
  const t=(x-mx)*ux+(y-my)*uy,s=-(x-mx)*uy+(y-my)*ux;
  const b=bins[Math.min(9,Math.max(0,Math.floor((t-lo)/length*10)))];
  b.min=Math.min(b.min,s);b.max=Math.max(b.max,s);b.count++;
  if(Math.abs(current[y*width+x]-reference[y*width+x]-lighting)>=strongThreshold){strong++;b.strong++;}
 }
 const widths=bins.map(b=>b.count?b.max-b.min+1:0);
 const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
 const endWidths=[median(widths.slice(0,3)),median(widths.slice(7))];
 const narrow=endWidths[0]<=endWidths[1]?0:1,profile=narrow===0?widths:[...widths].reverse();
 const near=median(profile.slice(0,3)),shoulder=median(profile.slice(3,6)),far=endWidths[1-narrow];
 // The scored end must be sharp. A dark flight and its soft shadow attached to a
 // bright tip diluted the whole-dart fraction below 0.7 and rejected real darts
 // („Zbyt słaby kontrast” on a silver tip over a black bed).
 const tipBins=narrow===0?[0,1,2]:[7,8,9];
 const tipStrong=tipBins.reduce((sum,index)=>sum+bins[index].strong,0),tipCount=tipBins.reduce((sum,index)=>sum+bins[index].count,0);
 const metrics={lengthPx:length,endpointWidthsPx:endWidths,shoulderWidthPx:shoulder,widthRatio:far/Math.max(1,near),strongFraction:strong/pixels.length,tipStrongFraction:tipCount?tipStrong/tipCount:0,supportPixels:pixels.length};
 const no=reason=>({autoEligible:false,autoCandidate:null,autoFallback:{...endpoints[narrow]},autoReason:reason,autoMetrics:metrics,tip:{...endpoints[narrow]},tipAlternate:{...endpoints[1-narrow]}});
 const margin=Math.max(4,Math.ceil(Math.min(width,height)*.01));
 if(length<Math.max(32,Math.min(width,height)*.05)||pixels.length<48||bins.some(b=>b.count<2))return no('Za mało szczegółów do niezależnego rozpoznania końca lotki.');
 if(pixels.some(([x,y])=>x<margin||y<margin||x>=width-margin||y>=height-margin))return no('Obiekt zbyt blisko brzegu kadru.');
 if(metrics.tipStrongFraction<.7)return no(`Zbyt słaby kontrast przy grocie — możliwy cień (${Math.round(metrics.tipStrongFraction*100)}%).`);
 if(metrics.widthRatio<2.5||near>Math.max(4,length*.08)||far<6)return no('Brak wyraźnej różnicy szerokości obu końców.');
 if(shoulder<near*1.3||profile[0]>profile[1]+1||profile[0]>near+1)return no('Brak dostatecznego zwężenia przy proponowanym grocie.');
 return {autoEligible:true,autoCandidate:{...endpoints[narrow]},autoReason:'Wąski, zwężający się koniec rozpoznany z kształtu; wymaga niezależnej kontroli stabilności i pola.',autoMetrics:metrics,tip:{...endpoints[narrow]},tipAlternate:{...endpoints[1-narrow]}};
}
/** emptyReference is the original EMPTY board; reference is the last accepted frame.
 * previous must be a distinct, fresh capture. Caller owns frame identity/readiness.
 * Never replace either reference automatically from an unreviewed candidate.
 */
export function detectDartChange(reference,current,previous,{width,height,emptyReference,threshold=30,motionThreshold=15,maxMotionFraction=.002,maxChangeFraction=.08,minChangedPixels=12,center=[.5,.5]}={}){
 const count=width*height;
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<16||height<16||count>4e6)throw new Error('Nieprawidłowy rozmiar klatki.');
 for(const a of [reference,current,emptyReference,...(previous==null?[]:[previous])])if(!bytes(a)||a.length!==count)throw new Error('Nieprawidłowa klatka szarości. Wymagane jest także początkowe tło pustej tarczy.');
 if(!finiteRange(threshold,1,254)||!finiteRange(motionThreshold,1,254)||!finiteRange(maxMotionFraction,0,.1)||!finiteRange(maxChangeFraction,0,.25)||maxChangeFraction===0||!Number.isSafeInteger(minChangedPixels)||minChangedPixels<3||minChangedPixels>count||!Array.isArray(center)||center.length!==2||!finiteRange(center[0],0,1)||!finiteRange(center[1],0,1))throw new Error('Nieprawidłowe parametry detektora zmian.');
 if(previous==null)return {status:'waiting',reason:'Potrzebne dwie kolejne nieruchome klatki.'};
 const lighting=shiftBetween(reference,current),motionShift=shiftBetween(previous,current),emptyCurrentShift=shiftBetween(emptyReference,current),emptyBaselineShift=shiftBetween(emptyReference,reference);
 if(Math.abs(lighting)>35||Math.abs(motionShift)>15||Math.abs(emptyCurrentShift)>35||Math.abs(emptyBaselineShift)>35)return {status:'lighting',reason:'Zmiana oświetlenia — sprawdź obraz i ustaw nowe puste tło.',lighting};
 // A real phone camera re-encodes and slightly refocuses between the empty
 // reference and the throw. On a physical board that produced 76 one-pixel
 // noise clusters plus the dart. The blur only CONFIRMS a change: a pixel must
 // cross the threshold raw and keep at least 2/3 of it after a 3x3 box blur, so
 // counts and endpoints stay raw while re-encoding flicker is rejected. A flat
 // 3x3 threshold kept thin low-contrast tips out; 2/3 measured on the physical
 // frames leaves one component (1177 px) and still keeps a 1 px, 80-contrast
 // shaft whose blurred delta is 27.
 const mean3=(src,x,y)=>{
  let sum=0,n=0;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const xx=x+dx,yy=y+dy;
   if(xx>=0&&xx<width&&yy>=0&&yy<height){sum+=src[yy*width+xx];n++;}
  }
  return Math.round(sum/n);
 };
 let rawMoving=0,changed=0,supportedChanged=0,reverted=0,baselineChanged=0;
 const rawMask=new Uint8Array(count),mask=new Uint8Array(count),motionMask=new Uint8Array(count),baselineMask=new Uint8Array(count);
 for(let i=0;i<count;i++){
  if(Math.abs(current[i]-previous[i]-motionShift)>motionThreshold){motionMask[i]=1;rawMoving++;}
  if(Math.abs(current[i]-reference[i]-lighting)>threshold){
   rawMask[i]=1;changed++;
   const x=i%width,y=(i/width)|0;
   if(Math.abs(mean3(current,x,y)-mean3(reference,x,y)-lighting)>threshold*2/3)mask[i]=1;
  }
  if(Math.abs(reference[i]-emptyReference[i]-emptyBaselineShift)>threshold)baselineMask[i]=1;
 }
 // Measured on the physical QA frames (empty board vs dart): the raw mask had
 // 5573 px in 77 components; after 3x3 confirmation the same pair gives one
 // 1177 px component at the dart. A pixel counts only with two neighbours in
 // the same mask (same rule as motion), so isolated flicker cannot block an
 // empty board or fake a removal.
 for(let i=0;i<count;i++){
  if(!mask[i]&&!baselineMask[i])continue;
  const x=i%width,y=Math.floor(i/width);
  let neighbours=0,baseNeighbours=0;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   if(!dx&&!dy)continue;
   const xx=x+dx,yy=y+dy;
   if(xx>=0&&xx<width&&yy>=0&&yy<height){
    const n=yy*width+xx;
    if(mask[n])neighbours++;
    if(baselineMask[n])baseNeighbours++;
   }
  }
  if(mask[i]&&neighbours>=2)supportedChanged++;
  if(baselineMask[i]&&baseNeighbours>=2){
   baselineChanged++;
   // Use a lower return threshold (hysteresis), rather than the new-object mask:
   // a one-level crossing is noise, but a low-contrast dart can disappear with
   // a change just BELOW the threshold that originally detected that dart.
   const returnThreshold=threshold/2;
   if(Math.abs(current[i]-reference[i]-lighting)>returnThreshold&&Math.abs(current[i]-emptyReference[i]-emptyCurrentShift)<=returnThreshold)reverted++;
  }
 }
 const moving=rawMoving/count>maxMotionFraction?supportedCount(motionMask,width,height):rawMoving;
 if(moving/count>maxMotionFraction)return {status:'unstable',reason:'Ruch w obrazie — poczekaj.',moving,rawMoving};
 // Reversion is not proof of removal, but cannot safely be treated as a new dart.
 // Detect it even if another object was added and the total changed area increased.
 // 12 px, nie 6: szum po re-encodingu dawał fałszywe „removed” na nieruchomej lotce.
 if(reverted>=12)return {status:'removed',reason:'Fragment obrazu wrócił do pustej tarczy — możliwe wyjęcie lub przesunięcie lotki. Nie zapisuj rzutu; sprawdź tarczę i ustaw nowe puste tło.',reverted,baselineChanged,changed};
 if(changed<minChangedPixels)return {status:'empty',reason:'Brak wyraźnej nowej zmiany. To nie oznacza rzutu za zero.',changed};
 if(supportedChanged<minChangedPixels)return {status:'empty',reason:'Brak zwartej nowej zmiany — pojedyncze piksele szumu zignorowane. To nie oznacza rzutu za zero.',changed,supportedChanged};
 if(changed/count>maxChangeFraction)return {status:'ambiguous',reason:'Zbyt duża zmiana — możliwa ręka lub przesunięcie kamery.',changed};
 // 2 px, nie 1: cienki grot na czarnym tle i lotka przecięta drutem dają dwie
 // zmiany; szersze sklejenie łączy je w jedną lotkę, zanim policzymy komponenty.
 const expandOnce=source=>{
  const out=new Uint8Array(count);
  for(let i=0;i<count;i++)if(source[i]){const x=i%width,y=Math.floor(i/width);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<width&&yy>=0&&yy<height)out[yy*width+xx]=1;}}
  return out;
 };
 const collect=expanded=>{
  const work=expanded.slice(),queue=new Int32Array(count),found=[];
  for(let start=0;start<count;start++)if(work[start]){
   let read=0,write=1;queue[0]=start;work[start]=0;const pixels=[];
   while(read<write){const i=queue[read++],x=i%width,y=Math.floor(i/width);if(mask[i])pixels.push([x,y]);
    for(const [xx,yy] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(xx>=0&&xx<width&&yy>=0&&yy<height){const n=yy*width+xx;if(work[n]){work[n]=0;queue[write++]=n;}}
   }
   if(pixels.length>=minChangedPixels)found.push(pixels);
  }
  return found;
 };
 let expanded=expandOnce(mask),components=collect(expanded);
 // A whole turn can add three darts; wires and low-contrast beds split a single
 // dart into pieces, so a real three-dart frame can produce more than three
 // components. Keep applying the same 2-px bridge until at most three pieces
 // remain. Different darts stay separate; a wrongly merged pair already fails
 // the shape gate above, so this cannot silently score half a dart.
 for(let pass=0;pass<3&&components.length>3;pass++){
  expanded=expandOnce(expanded);components=collect(expanded);
 }
 // Each component is read on its own. One turn can add up to three darts before
 // the next frame, so two or three shaped, unambiguous components are legitimate
 // candidates; one bad piece still rejects the whole frame.
 function analyzeComponent(pixels){
  let mx=0,my=0;for(const [x,y] of pixels){mx+=x;my+=y;}mx/=pixels.length;my/=pixels.length;
  let xx=0,yy=0,xy=0;for(const [x,y] of pixels){xx+=(x-mx)**2;yy+=(y-my)**2;xy+=(x-mx)*(y-my);}
  const angle=.5*Math.atan2(2*xy,xx-yy),ux=Math.cos(angle),uy=Math.sin(angle);let lo=Infinity,hi=-Infinity;
  for(const [x,y] of pixels){const t=(x-mx)*ux+(y-my)*uy;lo=Math.min(lo,t);hi=Math.max(hi,t);}
  const trace=xx+yy,delta=Math.hypot(xx-yy,2*xy),elongation=(trace+delta)/Math.max(1,trace-delta);
  if(hi-lo<Math.max(8,Math.min(width,height)*.025)||elongation<2)return {reason:'Zmiana nie przypomina wydłużonej lotki.'};
  if(pixels.some(([x,y])=>x<2||y<2||x>=width-2||y>=height-2))return {reason:'Obiekt jest ucięty krawędzią obrazu.'};
  const endpoints=[lo,hi].map(t=>({x:Math.max(0,Math.min(1,(mx+t*ux)/(width-1))),y:Math.max(0,Math.min(1,(my+t*uy)/(height-1)))}));
  return {shape:assessEndpointShape(pixels,{width,height,mx,my,ux,uy,lo,hi,endpoints,reference,current,lighting,threshold})};
 }
 // The flight floats in front of the board, so perspective can place it closer
 // to the bull than the tip. The narrower, tapering end is the tip; the board
 // field must be read there, not at the end nearest the center.
 const proposal='Propozycja grotu (węższego końca). Potwierdź rzeczywisty grot; cień lub piórko mogą dać błędny punkt.';
 if(components.length===1){
  const read=analyzeComponent(components[0]);
  if(read.reason)return {status:'ambiguous',reason:read.reason,changed};
  return {status:'candidate',candidate:{...read.shape.tip},alternate:{...read.shape.tipAlternate},changed,requiresReview:true,...read.shape,reason:proposal};
 }
 if(components.length>3)return {status:'ambiguous',reason:`Więcej niż trzy zmiany naraz (${components.length}) — usuń lotki i odczytaj kolejkę ponownie.`,components:components.length,changed};
 const reads=components.map(analyzeComponent),bad=reads.find(read=>read.reason);
 if(bad)return {status:'ambiguous',reason:bad.reason,components:components.length,changed};
 // Kapitan order 09.11: every stable change of 1–3 board objects is scored.
 // The certified tip wins when the shape gate agrees; otherwise the narrow end
 // is used. Motion, size, border, exit and wire gates still protect the score.
 return {status:'candidates',candidates:reads.map(read=>({candidate:{...read.shape.tip},alternate:{...read.shape.tipAlternate},autoEligible:true,autoCandidate:{...read.shape.autoCandidate??read.shape.autoFallback},autoFallback:{...read.shape.autoFallback},autoMetrics:read.shape.autoMetrics,tip:{...read.shape.tip}})),changed,requiresReview:true,reason:'Rozpoznano kilka lotek. Automat zapisze całą serię, gdy każda pozostanie stabilna.'};
}
