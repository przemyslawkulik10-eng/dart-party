export const APP_VERSION='V 01.01';
export const APP_UPDATED='17.10.2026 · 20:47';
// Count recorded darts, not multipliers; undone darts are absent from events.
export function mostUsedField(events){
 const counts=new Map();let last=0;
 for(const e of events){if(e.type!=='dart')continue;const key=e.number===25&&e.multiplier===2?50:e.number;const row=counts.get(key)||{count:0,last:0};row.count++;row.last=last++;counts.set(key,row);}
 return [...counts].sort((a,b)=>b[1].count-a[1].count||b[1].last-a[1].last)[0]?.[0]??null;
}
