export function applyCameraSeries({darts,ownership,getGame,isFresh,toInput,apply}){
 if(!Array.isArray(darts)||darts.length<1||darts.length>3)throw Error('Automat zapisuje wyłącznie od jednej do trzech lotek.');
 const applied=[];
 try{
  for(const raw of darts){
   const game=getGame();
   if(!isFresh(game)||!game)throw Object.assign(new Error('Kolejka lub obraz zmieniły się w trakcie zapisu serii.'),{confirmedCount:applied.length,uncertain:applied.length>0});
   if(ownership&&!ownership.isCurrent(game,raw))throw Object.assign(new Error('Serię zatrzymano: odczyt nie należy już do bieżącej kolejki.'),{confirmedCount:applied.length,uncertain:applied.length>0});
   const dart=toInput(raw,game);
   try{
    apply(dart,game.revision);
   }catch(applyError){
    throw Object.assign(applyError,{
     confirmedCount:applied.length,
     attemptedCount:applied.length+1,
     pending:darts.length-applied.length,
     uncertain:true,
     applied:[...applied]
    });
   }
   applied.push(dart);
  }
  return {status:'complete',applied,pending:0};
 }catch(error){
  throw Object.assign(error,{
   confirmedCount:error.confirmedCount??applied.length,
   attemptedCount:error.attemptedCount??applied.length+1,
   pending:error.pending??darts.length-applied.length,
   uncertain:error.uncertain===true,
   applied:error.applied??[...applied]
  });
 }
}
