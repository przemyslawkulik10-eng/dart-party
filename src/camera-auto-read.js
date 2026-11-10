const validField=field=>field&&Number.isFinite(field.number)&&Number.isFinite(field.multiplier)&&
 field.number!==0;

export function readFieldFromCrop(point,{readField,crop,videoWidth,videoHeight}){
 if(!point)return null;
 const fieldPoint=[(crop.x+point.x*crop.size)/videoWidth,(crop.y+point.y*crop.size)/videoHeight];
 return {point:fieldPoint,field:readField(fieldPoint)};
}

export function automaticReadFromDetection(found,context){
 const preview=value=>readFieldFromCrop(value,context);
 const entry=item=>{
  const verified=!!(item?.autoCandidate||item?.autoFallback);
  const read=verified?preview(item.autoCandidate):preview(item.autoFallback);
  return {
   point:read?.point??null,
   field:read?.field??null,
   autoEligible:verified&&validField(read?.field),
   verifiedPoint:verified?read:null,
   previewPoint:read
  };
 };
 if(found?.status==='candidates'){
  const entries=(found.candidates||[]).map(entry);
  return {
   kind:'series',
   entries,
   autoEligible:entries.length>1&&entries.every(item=>item.autoEligible),
   point:null,
   field:null,
   previewEntries:entries.map(item=>item.previewPoint).filter(Boolean)
  };
 }
 if(found?.status==='candidate'){
  const single=entry({autoEligible:found.autoEligible,autoCandidate:found.autoCandidate,autoFallback:found.autoFallback});
  return {
   kind:'single',
   entries:null,
   autoEligible:single.autoEligible,
   point:single.point,
   field:single.field,
   previewEntries:single.previewPoint?[single.previewPoint]:[]
  };
 }
 return {kind:'none',entries:null,autoEligible:false,point:null,field:null,previewEntries:[]};
}
