import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {createTraining,recordTrainingDart} from '../src/training.js';
import {createMatch,recordDart,nextPlayer} from '../src/engine.js';
import {ensureProfiles,loadProfiles,PROFILES_KEY} from '../src/profiles.js';
import {buildCoachContext} from '../src/coach-context.js';
import {generateCoach} from '../server/coach.js';
import {createHandler,publicPath} from '../server/http.js';
const profileId='11111111-1111-4111-8111-111111111111',otherId='22222222-2222-4222-8222-222222222222';
function payload(){let s={...createTraining('PRIVATE NAME',5,1000),profileId};s=recordTrainingDart(s,20,1,2000);s=recordTrainingDart(s,1,1,3000);return {profileId,trainings:[s],matches:[]};}
const env={OPENAI_API_KEY:'test-key-not-real',OPENAI_MODEL:'configured-test-model'};
const advice={summary:'Dwie lotki to mała próbka.',focus:'Powtarzalność',exerciseId:'sector-20',tip:'Celuj w sektor 20.',reason:'To początek obserwacji.'};
const goodFetch=async()=>({ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(advice)}]}]})});
test('stable local identity uses IDs; corrupt profiles are never replaced',()=>{
 const db=new Map();globalThis.localStorage={getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,v)};
 const [p]=ensureProfiles(['Przemek']);assert.equal(ensureProfiles([' PRZEMEK '])[0].id,p.id);assert.equal(loadProfiles().length,1);
 assert.throws(()=>ensureProfiles(['Maciek',' MACIEK ']));assert.equal(loadProfiles().length,1);
 db.set(PROFILES_KEY,'corrupt');assert.throws(()=>ensureProfiles(['A']));assert.equal(db.get(PROFILES_KEY),'corrupt');
});
test('coach computes accuracy and strips names and profile identifiers from model context',()=>{
 const context=buildCoachContext(payload());assert.equal(context.training.accuracy,50);assert.equal(context.training.throws,2);
 assert.ok(!JSON.stringify(context).includes('PRIVATE'));assert.ok(!JSON.stringify(context).includes(profileId));
 assert.throws(()=>buildCoachContext({...payload(),profileId:otherId}));
 const p=payload();p.trainings.push(p.trainings[0]);assert.throws(()=>buildCoachContext(p));
});
test('only completed games included; counts all darts, preserves unknown intention',()=>{
 let m={...createMatch(['PRIVATE A','PRIVATE B'],'201'),profileIds:[profileId,otherId],sessionType:'competition'};
 assert.throws(()=>buildCoachContext({...payload(),matches:[m]}));
 for(let i=0;i<3;i++)m=recordDart(m,20,3);
 m=nextPlayer(m);for(let i=0;i<3;i++)m=recordDart(m,0,1);m=nextPlayer(m);m=recordDart(m,7,3);
 const c=buildCoachContext({...payload(),matches:[m]}).competition[0];assert.equal(c.throws,4);assert.equal(c.triples,4);assert.equal(c.won,true);assert.equal(c.targetKnown,false);
});
test('real adapter uses Responses API server secret, structured output, no name and store false',async()=>{
 let body;
 const report=await generateCoach(payload(),{env,fetchImpl:async(url,opts)=>{assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(opts.headers.Authorization,'Bearer test-key-not-real');body=JSON.parse(opts.body);return goodFetch();}});
 assert.equal(body.store,false);assert.equal(body.text.format.type,'json_schema');assert.equal(body.model,env.OPENAI_MODEL);assert.ok(!body.input.includes('PRIVATE'));assert.equal(report.evidence.trainingHits,1);assert.deepEqual(report.advice,advice);
});
test('missing key, provider errors, refusals and incomplete output never fake successful coaching',async()=>{
 await assert.rejects(generateCoach(payload(),{env:{},fetchImpl:()=>{throw new Error('must not call');}}),e=>e.status===503);
 await assert.rejects(generateCoach(payload(),{env,fetchImpl:async()=>({ok:false,status:401})}),e=>e.status===502&&!e.message.includes('test-key'));
 for(const data of [{status:'incomplete',output:[]},{status:'completed',output:[{content:[{type:'refusal',refusal:'no'}]}]}])await assert.rejects(generateCoach(payload(),{env,fetchImpl:async()=>({ok:true,json:async()=>data})}),e=>e.status===502);
});
async function request(handler,{method='POST',url='/api/coach',origin='http://127.0.0.1:4173',body=JSON.stringify(payload()),host='127.0.0.1:4173'}={}){
 const req=Readable.from([body]);Object.assign(req,{url,method,headers:{host,origin,'content-type':'application/json','x-dart-party':'coach'}});let result;
 const res={writeHead(status,headers){result={status,headers};},end(body){result.body=body;}};await handler(req,res);return result;
}
test('local endpoint rejects foreign origins, oversized bodies and rapid duplicate spend',async()=>{
 const h=createHandler({env,fetchImpl:goodFetch,now:()=>100000});
 assert.equal((await request(h,{origin:'https://attacker.example'})).status,403);
 assert.equal((await request(h,{host:'attacker.example'})).status,403);
 assert.equal((await request(h)).status,200);assert.equal((await request(h)).status,429);
 assert.equal((await request(createHandler({env,fetchImpl:goodFetch}),{body:'x'.repeat(256001)})).status,413);
 assert.equal((await request(createHandler({env:{}}))).status,503);
});
test('static server does not expose secrets, git, server source or traversal paths',()=>{
 for(const path of ['/.env.local','/.git/config','/server/coach.js','/src/../.env.local','/src/.secret','/database/schema.sql','/README.md'])assert.equal(publicPath(path),null,path);
 assert.equal(publicPath('/src/app.js'),'src/app.js');assert.equal(publicPath('/'),'index.html');
});

test('coach correctly assigns team Cricket darts and victory to both teammates',async()=>{
 const {configureCricketTeams,replay}=await import('../src/engine.js');
 const ids=[profileId,otherId,'33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444','55555555-5555-4555-8555-555555555555'];
 let m={...configureCricketTeams(createMatch(['A1','A2','B1','B2','C'],'cricket'),[0,0,1,1,2]),profileIds:ids};
 const pass=()=>{while(!replay(m).ready)m=recordDart(m,0);m=nextPlayer(m);};
 for(const n of [20,19,18])m=recordDart(m,n,3);pass();pass();pass();
 for(const n of [17,16,15])m=recordDart(m,n,3);pass();pass();pass();m=recordDart(m,25,2);m=recordDart(m,25);
 const c=ids.map(id=>buildCoachContext({profileId:id,trainings:[],matches:[m]}).competition[0]);
 assert.deepEqual(c.map(s=>s.throws),[5,3,3,3,6]);assert.deepEqual(c.map(s=>s.won),[true,true,false,false,false]);
});

test('AI can recommend new coach exercises only when the virtual coach context is supplied',async()=>{
 const {emptyCoach}=await import('../src/virtual-coach.js');
 const provider=async()=>({ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({...advice,exerciseId:'doubles'})}]}]})});
 assert.equal((await generateCoach({...payload(),virtualCoach:emptyCoach()},{env,fetchImpl:provider})).advice.exerciseId,'doubles');
 await assert.rejects(generateCoach(payload(),{env,fetchImpl:provider}),e=>e.status===502);
});
