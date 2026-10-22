import {test} from 'node:test';
import assert from 'node:assert/strict';
import {playerMilestones,milestoneCounts,milestoneHistoryMarkup} from '../src/player-milestones.js';
import {createMatch,recordDart,nextPlayer,nextLeg,configureCricketTeams,cricketTeamOrder} from '../src/engine.js';
import {createTraining,recordTrainingDart,saveTraining} from '../src/training.js';
import {createJdc,recordJdcDart,jdcStats} from '../src/jdc.js';
import {createMnoznik,throwMnoznik,mnoznikState} from '../src/mnoznik.js';
import {createMnoznikSparing,throwMnoznikSparing} from '../src/mnoznik-sparing.js';
import {createCyferki,chooseCyferki,throwCyferki} from '../src/cyferki.js';
import {ensureProfiles,selectProfile,selectedProfile} from '../src/profiles.js';
import {useAccount,workspace,replaceWorkspace} from '../src/account-storage.js';
import {playerData} from '../src/player-stats.js';
import {homeMarkup} from '../src/home-ui.js';
const p={id:'11111111-1111-4111-8111-111111111111',name:'Gracz'},q={id:'22222222-2222-4222-8222-222222222222',name:'Drugi'};
const at=Date.parse('2026-10-22T10:00:00Z');
const ds=(points=180)=>[{number:20,multiplier:3,at},{number:20,multiplier:3,at:at+1000},{number:points===180?20:25,multiplier:points===180?3:2,at:at+2000}];
const data=extra=>({profile:p,...extra});
// Keep ordering assertions independent of how many throws fit in one millisecond.
const hit=(m,darts=ds())=>darts.reduce((m,d)=>{
 const next=recordDart(m,d.number,d.multiplier);
 next.events.at(-1).at=new Date(at+next.events.length*1000).toISOString();
 return next;
},m);
const match=(mode='501')=>({...createMatch([p.name,q.name],mode,false,'standard','standard',2),profileIds:[p.id,q.id]});
const training=(darts=ds())=>({...createTraining(p.name,15,at),profileId:p.id,darts:darts.map(d=>({...d,target:20}))});

test('training counts complete non-overlapping visits, dates final dart, undo and reload preserve truth',()=>{
 const s=training([...ds(),...ds(170),...ds().slice(0,2)]);
 assert.deepEqual(milestoneCounts(data({trainings:[s,s]})),{180:1,170:1});
 assert.equal(playerMilestones(data({trainings:[s]}))[0].at,'2026-10-22T10:00:02.000Z');
 assert.deepEqual(milestoneCounts(JSON.parse(JSON.stringify(data({trainings:[s]})))),{180:1,170:1});
 assert.deepEqual(milestoneCounts(data({trainings:[{...s,darts:s.darts.slice(0,5)}]})),{180:1,170:0});
 assert.equal(playerMilestones(data({trainings:[{...s,profileId:q.id}]})).length,0);
 assert.equal(playerMilestones(data({trainings:[training([{...ds()[0],unknownMiss:true},...ds().slice(1)])]})).length,0);
});
test('JDC counts actual darts, not bonus points or uncommitted draft',()=>{
 let j=createJdc(p,false,at);
 assert.equal(playerMilestones(data({jdc:[{...j,draft:ds()}]})).length,0);
 for(const d of ds())j=recordJdcDart(j,d.number,d.multiplier,d.at);
 assert.equal(jdcStats(j).score,0); // Off-target T20 still really happened.
 assert.deepEqual(milestoneCounts(data({jdc:[j]})),{180:1,170:0});
 let bonus=createJdc(p,false,at);
 for(const multiplier of [1,2,3])bonus=recordJdcDart(bonus,10,multiplier,at);
 assert.equal(jdcStats(bonus).score,160);
 assert.equal(playerMilestones(data({jdc:[bonus]})).length,0);
});
test('X01 and Cricket track the player UUID, actual darts and round, not awarded points',()=>{
 let m=nextPlayer(hit(match()));m=nextPlayer(hit(m));m=hit(m,ds(170));
 const rows=playerMilestones(data({matches:[m]}));
 assert.deepEqual(rows.map(r=>[r.kind,r.round]),[['170',2],['180',1]]);
 const cricket=hit(match('cricket'));
 assert.equal(playerMilestones(data({matches:[cricket]}))[0].kind,'180');
 assert.equal(playerMilestones(data({matches:[{...cricket,profileIds:[q.id,p.id]}]})).length,0);
 // A third-dart bust still records three real hits; an early bust cannot join the next visit.
 let bust=hit(match('201'),[{number:20,multiplier:1},{number:20,multiplier:1},{number:20,multiplier:1}]);
 bust=nextPlayer(hit(nextPlayer(bust),[{number:0,multiplier:1},{number:0,multiplier:1},{number:0,multiplier:1}]));
 bust=hit(bust);assert.equal(playerMilestones(data({matches:[bust]})).length,1);
});
test('new leg starter and Cricket team order attribute every visit to its thrower',()=>{
 let m=hit(match('201'));m=nextPlayer(hit(nextPlayer(m)));
 m=recordDart(m,7,3);m=nextLeg(m);m=hit(m);m=hit(nextPlayer(m));
 assert.equal(playerMilestones(data({matches:[m]})).length,2);
 assert.equal(playerMilestones(data({matches:[m]})).at(-1).leg,1);
 const players=[p,q,...Array.from({length:3},(_,i)=>({id:crypto.randomUUID(),name:'P'+i}))];
 let t={...configureCricketTeams(createMatch(players.map(p=>p.name),'cricket',false,'standard','standard'),[0,0,1,1,2]),profileIds:players.map(p=>p.id)};
 const order=cricketTeamOrder(t);
 for(let i=0;i<order.length;i++){t=hit(t);if(i<order.length-1)t=nextPlayer(t);}
 for(const player of players){const rows=playerMilestones({profile:player,matches:[t]});assert.equal(rows.length,player.id===players[4].id?2:1);assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);}
});
test('coach human achievements exclude opponent, drill early busts do not combine',()=>{
 const m=hit(nextPlayer(hit(match())));const {profileIds,...coach}=m;
 assert.equal(playerMilestones({profile:{...p,coachMatches:[coach]}}).length,1);
 const task={id:'drill',kind:'scoring',targets:Array(10).fill(20),goal:60,events:ds().map(d=>({...d,at:new Date(d.at).toISOString()}))};
 const checkout={...task,id:'checkout',kind:'checkout',targets:Array(10).fill(40)};
 assert.equal(playerMilestones({profile:{...p,virtualCoach:{plans:[{tasks:[task,checkout]}]}}}).length,1);
});
test('Mnożnik counts raw 180/170 and ignores multiplied total, including sparing opponents',()=>{
 const make=values=>values.reduce((m,v)=>throwMnoznik(m,v,at),createMnoznik(p,at));
 const fake=make([1,1,1,20,20,20]);assert.equal(mnoznikState(fake).total,180);
 assert.equal(playerMilestones(data({mnoznik:[fake]})).length,0);
 assert.deepEqual(milestoneCounts(data({mnoznik:[make([1,1,1,60,60,60,1,1,1,60,60,50])]})),{180:1,170:1});
 let m=createMnoznikSparing([p,q],at);
 for(const v of [1,1,1,1,1,1,60,60,50,60,60,60])m=throwMnoznikSparing(m,v,at);
 assert.deepEqual(milestoneCounts(data({mnoznikSparing:[m]})),{180:0,170:1});
});
test('Cyferki uses actual fields and does not merge consecutive players or rounds',()=>{
 let m=createCyferki([p,q],{scoring:'hits',progress:'player'},at);
 for(const n of [20,19,18,17,16,15])m=throwCyferki(chooseCyferki(m,n,at),3,at);
 assert.equal(playerMilestones(data({cyferki:[m]})).length,0);
});
test('durable account workspace restores milestones and isolates other accounts and guest',()=>{
 const values=new Map();globalThis.localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
 try{
 useAccount(p.id);const profile=ensureProfiles(['Test'])[0];selectProfile(profile.id);
 let s={...createTraining(profile.name,15,at),profileId:profile.id};
 for(const d of ds())s=recordTrainingDart(s,d.number,d.multiplier,d.at);saveTraining(s);
 assert.deepEqual(milestoneCounts(playerData(selectedProfile().id)),{180:1,170:0});
 const backup=JSON.parse(JSON.stringify(workspace()));
 useAccount(q.id);assert.equal(selectedProfile(),null);assert.equal(playerMilestones({profile:ensureProfiles(['Test'])[0]}).length,0);
 useAccount(null);assert.equal(selectedProfile(),null);
 useAccount(p.id);replaceWorkspace(backup);
 assert.equal(playerMilestones(playerData(selectedProfile().id))[0].at,'2026-10-22T10:00:02.000Z');
 saveTraining({...s,darts:s.darts.slice(0,2)});assert.equal(milestoneCounts(playerData(profile.id))[180],0);
 }finally{useAccount(null);delete globalThis.localStorage;}
});
test('history safely shows exact dates, missing legacy timestamps and empty state',()=>{
 const rows=playerMilestones(data({trainings:[training()]}));
 const markup=milestoneHistoryMarkup(rows);assert.match(markup,/datetime="2026-10-22T10:00:02.000Z"/);assert.match(markup,/Trening celności/);assert.match(markup,/T20 \+ T20 \+ T20/);
 assert.match(milestoneHistoryMarkup([{...rows[0],at:null,sourceLabel:'<script>'}]),/Brak dokładnej daty/);
 assert.doesNotMatch(milestoneHistoryMarkup([{...rows[0],sourceLabel:'<script>'}]),/<script>/);
 assert.match(milestoneHistoryMarkup([]),/Pierwsze trafienie/);
 assert.match(homeMarkup({profile:p,milestones:{180:1,170:0}}),/Moje 180: 1/);
 assert.match(homeMarkup({profile:p,milestones:null}),/brak odczytu/);
});
