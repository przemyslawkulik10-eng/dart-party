import {playerStats} from './player-stats.js';
const DAY=86400000;
export function returnPlan(data,now=Date.now()){
 playerStats(data); // Reject a mixed-profile history before calculating a recommendation.
 const times=[...data.trainings,...data.jdc].flatMap(s=>s.darts.map(d=>d.at)).filter(t=>Number.isFinite(t)&&t<=now);
 const lastAt=times.length?Math.max(...times):null;
 const daysAway=lastAt===null?null:Math.floor((now-lastAt)/DAY);
 const recentJdc=data.jdc.filter(s=>s.endedAt!==null&&s.endedAt<=now&&s.endedAt>=now-30*DAY);
 const recentTraining=data.trainings.filter(s=>s.endedAt!==null&&s.endedAt<=now&&s.endedAt>=now-30*DAY&&s.darts.length);
 const activeJdc=data.jdc.find(s=>s.endedAt===null),activeTraining=data.trainings.find(s=>s.endedAt===null);
 const freshStats=playerStats({...data,trainings:recentTraining,jdc:recentJdc,matches:[]});
 const returning=daysAway!==null&&daysAway>=30;
 return {lastAt,daysAway,returning,recentJdc:recentJdc.length,recentTraining:recentTraining.length,recentJdcAverage:freshStats.jdcAverage,
  title:lastAt===null?'Zacznij od własnego punktu odniesienia.':returning?'Wróć do tarczy w swoim tempie.':'Wybierz, na co masz dziś ochotę.',
  message:activeJdc?'Masz rozpoczętą próbę JDC. Możesz ją dokończyć — nie trzeba zaczynać od nowa.':recentJdc.length?'Masz już aktualny wynik JDC. Możesz wybrać krótkie ćwiczenie albo po prostu zagrać sparing.':'Jedna pełna próba JDC pozwoli zapisać obecną formę. Nie musisz poprawić rekordu ani kończyć jej bez przerwy.',
  primary:activeJdc?'jdc':recentJdc.length?'sector-20':'jdc',activeJdc:!!activeJdc,activeTraining:!!activeTraining};
}
export const RETURN_CHOICE_KEY='dart-party-return-choice-v1';
export function loadReturnChoice(profileId){
 const data=JSON.parse(localStorage.getItem(RETURN_CHOICE_KEY)||'{}');
 if(!data||typeof data!=='object'||Array.isArray(data)||Object.values(data).some(v=>typeof v!=='boolean'))throw new Error('Nie można odczytać ustawień planu.');
 return data[profileId]===true;
}
export function saveReturnChoice(profileId,enabled){
 loadReturnChoice(profileId);
 const data=JSON.parse(localStorage.getItem(RETURN_CHOICE_KEY)||'{}');
 localStorage.setItem(RETURN_CHOICE_KEY,JSON.stringify({...data,[profileId]:!!enabled}));
}
