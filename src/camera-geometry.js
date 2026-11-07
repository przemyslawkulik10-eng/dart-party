// Board coordinates in mm, origin at bull; y points down. No match writes.
export const SECTORS = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
const TARGETS = [[0,-170],[170,0],[0,170],[-170,0]];
const finiteVector=(value,length)=>Array.isArray(value)&&value.length===length&&Array.from(value).every(Number.isFinite);
export function calibrate(points) {
  if (!Array.isArray(points)||points.length!==4||!Array.from(points).every(p=>finiteVector(p,2)&&p.every(v=>v>=0&&v<=1))) throw new Error('Wskaż cztery punkty w obrębie obrazu.');
  const crosses = points.map((a,i) => {const b=points[(i+1)%4], c=points[(i+2)%4];return (b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);});
  if (!crosses.every(c=>c>0.002)) throw new Error('Punkty muszą otaczać tarczę w kolejności: 20, 6, 3, 11. Powiększ tarczę w kadrze.');
  const rows=[];
  points.forEach(([x,y],i)=>{const [u,v]=TARGETS[i];rows.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);});
  for(let col=0;col<8;col++) {
    let pivot=col;for(let r=col+1;r<8;r++)if(Math.abs(rows[r][col])>Math.abs(rows[pivot][col]))pivot=r;
    [rows[col],rows[pivot]]=[rows[pivot],rows[col]];
    const scale=rows[col][col];if(Math.abs(scale)<1e-10)throw new Error('Nie można wyznaczyć kalibracji. Wskaż punkty ponownie.');
    rows[col]=rows[col].map(v=>v/scale);
    for(let r=0;r<8;r++)if(r!==col){const factor=rows[r][col];rows[r]=rows[r].map((v,c)=>v-factor*rows[col][c]);}
  }
  const h=rows.map(r=>r[8]);
  if(!finiteVector(h,8))throw new Error('Nie można wyznaczyć kalibracji. Wskaż punkty ponownie.');
  // A projective horizon inside the selected quadrilateral is invalid.
  const denominators=points.map(([x,y])=>h[6]*x+h[7]*y+1);
  if(!denominators.every(d=>d>1e-6)&&!denominators.every(d=>d< -1e-6))throw new Error('Niestabilna kalibracja. Ustaw kamerę bliżej widoku na wprost.');
  return h;
}
export function project(h,point) {
  if(!finiteVector(h,8)||!finiteVector(point,2))throw new Error('Nieprawidłowa kalibracja lub punkt.');
  const [x,y]=point;
  const d=h[6]*x+h[7]*y+1;
  if(!Number.isFinite(d)||Math.abs(d)<1e-8)throw new Error('Punkt poza zakresem kalibracji.');
  const projected=[(h[0]*x+h[1]*y+h[2])/d,(h[3]*x+h[4]*y+h[5])/d];
  if(!projected.every(Number.isFinite))throw new Error('Punkt poza zakresem kalibracji.');
  return projected;
}
export function fieldAt(point) {
  if(!finiteVector(point,2))throw new Error('Nieprawidłowy punkt.');
  const [x,y]=point;
  const r=Math.hypot(x,y);
  const angle=(Math.atan2(x,-y)+2*Math.PI)%(2*Math.PI);
  const sectorIndex=Math.floor((angle+Math.PI/20)/(Math.PI/10))%20;
  const wire=Math.min(...[6.35,15.9,99,107,162,170].map(b=>Math.abs(r-b)))<1.5;
  const angleFromCenter=Math.abs(((angle+Math.PI/20)%(Math.PI/10))-Math.PI/20);
  const nearWire=wire || (r>15.9&&r<=170&&r*Math.sin(Math.PI/20-angleFromCenter)<1.5);
  if(r>170)return {number:0,multiplier:1,score:0,label:'Poza tarczą · 0',nearWire};
  if(r<=6.35)return {number:25,multiplier:2,score:50,label:'BULL · 50',nearWire};
  if(r<=15.9)return {number:25,multiplier:1,score:25,label:'BULL · 25',nearWire};
  const multiplier=r>=162?2:r>=99&&r<=107?3:1,number=SECTORS[sectorIndex];
  return {number,multiplier,score:number*multiplier,label:`${multiplier===3?'T':multiplier===2?'D':''}${number} · ${number*multiplier}`,nearWire};
}
