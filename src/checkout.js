export const CHECKOUT_HINT_THRESHOLD = 170;
const dart=(number,multiplier)=>({number,multiplier,points:number*multiplier});
const targets=[...Array.from({length:20},(_,i)=>[dart(i+1,1),dart(i+1,2),dart(i+1,3)]).flat(),dart(25,1),dart(25,2)];
const scoring=[...targets].sort((a,b)=>b.points-a.points||a.multiplier-b.multiplier);
const doubles=[20,16,18,12,10,8,14,6,4,2,1,3,5,7,9,11,13,15,17,19,25].map(n=>dart(n,2));
// Return one exact finish, using the fewest available darts; never suggest busts.
export function checkout(score, dartsLeft=3, doubleOut=false){
  if(!Number.isInteger(score)||score<1||!Number.isInteger(dartsLeft)||dartsLeft<1||dartsLeft>3)return null;
  const finals=doubleOut?doubles:targets;
  function search(remaining,count){
    if(count===1){const end=finals.find(d=>d.points===remaining);return end?[end]:null;}
    for(const d of scoring){
      const left=remaining-d.points;
      if(left<(doubleOut?2:1)||left>60*(count-1))continue;
      const tail=search(left,count-1);if(tail)return [d,...tail];
    }
    return null;
  }
  for(let count=1;count<=dartsLeft;count++){const route=search(score,count);if(route)return route;}
  return null;
}
export const checkoutLabel=d=>d.number===25?(d.multiplier===2?'BULL 50':'BULL 25'):`${d.multiplier===3?'T':d.multiplier===2?'D':'S'}${d.number}`;
export const checkoutWords=d=>d.number===25?`środek ${d.points}`:`${d.multiplier===3?'potrójna':d.multiplier===2?'podwójna':'pojedyncza'} ${d.number}`;
export function checkoutAdvice(score,dartsLeft,doubleOut,preview=false){
  if(score>CHECKOUT_HINT_THRESHOLD||score<1)return '';
  const route=checkout(score,dartsLeft,doubleOut);
  const lead=preview?' Na następną kolejkę.':'';
  return route?`${lead} Do końca: ${route.map(checkoutWords).join(', potem ')}.`:`${lead} Nie skończysz w ${dartsLeft===1?'jednej lotce':dartsLeft===2?'dwóch lotkach':'trzech lotkach'}.`;
}
