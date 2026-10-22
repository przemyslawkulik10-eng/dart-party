import test from 'node:test';
import assert from 'node:assert/strict';
import {completedResults,latestResultMarkup} from '../src/latest-result.js';
import {newCoachMatch,coachTurn,undoHuman} from '../src/coach-match.js';
import {recordDart} from '../src/engine.js';
const stats={jdcResults:[],competitions:[],cyferkiResults:[],mnoznikResults:[]};
test('coach win is visible first with human average, undo removes completed result',()=>{
 let m=newCoachMatch('Przemek',201);for(let i=0;i<3;i++)m=recordDart(m,20,3);m=coachTurn(m,()=>0.99);m=recordDart(m,7,3);
 const data={profile:{coachMatches:[m]},trainings:[],jdc:[]};
 const r=completedResults(data,stats);assert.equal(r.length,1);assert.match(r[0].result,/150.8/);assert.doesNotMatch(latestResultMarkup(data,stats),/NaN/);assert.match(latestResultMarkup(data,stats),/Luźne 201/);
 data.profile.coachMatches=[undoHuman(m)];assert.equal(completedResults(data,stats).length,0);
});
test('all result categories sort by completion rather than creation and omit unfinished games',()=>{
 const data={profile:{},trainings:[{id:'t',target:20,endedAt:5000,createdAt:1,darts:[]}],jdc:[{id:'j',endedAt:9000}]};
 const st={jdcResults:[{id:'j',score:500}],competitions:[{id:'x',date:8000,complete:true,mode:'501',won:true,darts:30,legWins:1},{id:'pending',date:10000,complete:false}],cyferkiResults:[{id:'c',date:7000,complete:true,score:10,hits:3,darts:6,accuracy:50,closures:1}],mnoznikResults:[{id:'m',date:6000,complete:true,kind:'solo',score:40,darts:36}]};
 assert.deepEqual(completedResults(data,st).map(x=>x.id),['j','x','c','m','t']);assert.ok(completedResults(data,st).every(x=>x.comment));
});
