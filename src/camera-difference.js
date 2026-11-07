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
 let moving=0,changed=0,reverted=0,baselineChanged=0;const mask=new Uint8Array(count);
 for(let i=0;i<count;i++){
  if(Math.abs(current[i]-previous[i]-motionShift)>motionThreshold)moving++;
  if(Math.abs(current[i]-reference[i]-lighting)>threshold){mask[i]=1;changed++;}
  if(Math.abs(reference[i]-emptyReference[i]-emptyBaselineShift)>threshold){
   baselineChanged++;
   if(Math.abs(current[i]-emptyReference[i]-emptyCurrentShift)<=threshold)reverted++;
  }
 }
 if(moving/count>maxMotionFraction)return {status:'unstable',reason:'Ruch w obrazie — poczekaj.',moving};
 // Reversion is not proof of removal, but cannot safely be treated as a new dart.
 // Detect it even if another object was added and the total changed area increased.
 if(reverted>=Math.max(3,Math.ceil(minChangedPixels/2)))return {status:'removed',reason:'Fragment obrazu wrócił do pustej tarczy — możliwe wyjęcie lub przesunięcie lotki. Nie zapisuj rzutu; sprawdź tarczę i ustaw nowe puste tło.',reverted,baselineChanged,changed};
 if(changed<minChangedPixels)return {status:'empty',reason:'Brak wyraźnej nowej zmiany. To nie oznacza rzutu za zero.',changed};
 if(changed/count>maxChangeFraction)return {status:'ambiguous',reason:'Zbyt duża zmiana — możliwa ręka lub przesunięcie kamery.',changed};
 const expanded=new Uint8Array(count);
 for(let i=0;i<count;i++)if(mask[i]){const x=i%width,y=Math.floor(i/width);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<width&&yy>=0&&yy<height)expanded[yy*width+xx]=1;}}
 const components=[],queue=new Int32Array(count);
 for(let start=0;start<count;start++)if(expanded[start]){
  let read=0,write=1;queue[0]=start;expanded[start]=0;const pixels=[];
  while(read<write){const i=queue[read++],x=i%width,y=Math.floor(i/width);if(mask[i])pixels.push([x,y]);
   for(const [xx,yy] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(xx>=0&&xx<width&&yy>=0&&yy<height){const n=yy*width+xx;if(expanded[n]){expanded[n]=0;queue[write++]=n;}}
  }
  if(pixels.length>=minChangedPixels)components.push(pixels);
 }
 if(components.length!==1)return {status:'ambiguous',reason:'Nie można odizolować jednej zmiany.',components:components.length,changed};
 const pixels=components[0];let mx=0,my=0;for(const [x,y] of pixels){mx+=x;my+=y;}mx/=pixels.length;my/=pixels.length;
 let xx=0,yy=0,xy=0;for(const [x,y] of pixels){xx+=(x-mx)**2;yy+=(y-my)**2;xy+=(x-mx)*(y-my);}
 const angle=.5*Math.atan2(2*xy,xx-yy),ux=Math.cos(angle),uy=Math.sin(angle);let lo=Infinity,hi=-Infinity;
 for(const [x,y] of pixels){const t=(x-mx)*ux+(y-my)*uy;lo=Math.min(lo,t);hi=Math.max(hi,t);}
 const trace=xx+yy,delta=Math.hypot(xx-yy,2*xy),elongation=(trace+delta)/Math.max(1,trace-delta);
 if(hi-lo<Math.max(8,Math.min(width,height)*.025)||elongation<2)return {status:'ambiguous',reason:'Zmiana nie przypomina wydłużonej lotki.',changed};
 if(pixels.some(([x,y])=>x<2||y<2||x>=width-2||y>=height-2))return {status:'ambiguous',reason:'Obiekt jest ucięty krawędzią obrazu.',changed};
 const endpoints=[lo,hi].map(t=>({x:Math.max(0,Math.min(1,(mx+t*ux)/(width-1))),y:Math.max(0,Math.min(1,(my+t*uy)/(height-1)))}));
 endpoints.sort((a,b)=>Math.hypot(a.x-center[0],a.y-center[1])-Math.hypot(b.x-center[0],b.y-center[1]));
 return {status:'candidate',candidate:endpoints[0],alternate:endpoints[1],changed,requiresReview:true,reason:'Propozycja końca zmienionego obiektu. Potwierdź rzeczywisty grot; cień lub piórko mogą dać błędny punkt.'};
}
