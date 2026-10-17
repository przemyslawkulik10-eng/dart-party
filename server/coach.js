import {buildCoachContext} from '../src/coach-context.js';
export class CoachError extends Error{constructor(status,message){super(message);this.status=status;}}
const schema={type:'object',additionalProperties:false,properties:{summary:{type:'string'},focus:{type:'string'},exerciseId:{type:'string',enum:['sector-20']},tip:{type:'string'},reason:{type:'string'}},required:['summary','focus','exerciseId','tip','reason']};
export const coachConfigured=(env=process.env)=>Boolean(env.OPENAI_API_KEY && env.OPENAI_MODEL);
export async function generateCoach(payload,{env=process.env,fetchImpl=fetch}={}){
 if(!coachConfigured(env))throw new CoachError(503,'Trener AI nie jest jeszcze skonfigurowany. Możesz trenować samodzielnie.');
 let context;try{context=buildCoachContext(payload);}catch(e){throw new CoachError(400,e.message);}
 const instructions='Jesteś polskim trenerem darta w DART PARTY. Otrzymujesz wyłącznie obliczone statystyki. Krótko, konkretnie i życzliwie: po jednym lub dwóch zdaniach na pole. Używaj tylko faktów w danych. Przy małej próbce lub braku danych wyraźnie powiedz, że to początek obserwacji, nie diagnoza. Nie zgaduj intencji rzutu, emocji, techniki ciała, chorób ani przyczyn błędów. Rozdziel trening od meczów. Nie nazywaj zer Cricket pudłami. Nie obiecuj poprawy i nie przyznawaj awansu. Wybierz wyłącznie dostępne ćwiczenie. Sesja ma trwać najwyżej 15 minut, bez presji ciągłego grania. Wyjaśnij, na czym opierasz wskazówkę. Nie wymyślaj nowych wyników ani procentów.';
 let response;
 try{response=await fetchImpl('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:env.OPENAI_MODEL,store:false,instructions,input:JSON.stringify(context),max_output_tokens:1200,text:{format:{type:'json_schema',name:'dart_coach',strict:true,schema}}}),signal:AbortSignal.timeout(25000)});}catch{throw new CoachError(502,'Nie udało się połączyć z trenerem AI. Twoje rzuty są nadal zapisane.');}
 if(!response.ok)throw new CoachError(response.status===429?429:502,response.status===429?'Limit usługi AI. Spróbuj później.':'Usługa AI nie zwróciła odpowiedzi. Sprawdź konfigurację serwera.');
 try{
  const data=await response.json();if(data.status!=='completed')throw new Error();
  const text=data.output?.flatMap(item=>item.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('');
  const advice=JSON.parse(text);if(advice.exerciseId!=='sector-20'||Object.keys(advice).length!==5||['summary','focus','tip','reason'].some(k=>typeof advice[k]!=='string'||!advice[k].trim()||advice[k].length>1000))throw new Error();
  return {version:1,provider:'OpenAI',model:env.OPENAI_MODEL,createdAt:Date.now(),advice,evidence:{trainingThrows:context.training.throws,trainingHits:context.training.hits,completedMatches:context.competition.length}};
 }catch{throw new CoachError(502,'Trener nie zwrócił poprawnej analizy. Spróbuj ponownie później.');}
}
