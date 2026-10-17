import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {createDuel,duelPlayers,nextPlayer,previousPlayer,duelResult,saveNewDuel} from '../src/jdc-duel.js';
import {commitRound} from '../src/jdc-round.js';
import {createJdc,loadJdc,saveJdc} from '../src/jdc.js';
globalThis.crypto??=webcrypto;
const profiles=()=>['Przemek','Mikołaj'].map(name=>({id:crypto.randomUUID(),name}));
test('JDC duel alternates 19 rounds each, survives JSON, ties and final winner',()=>{
 let ps=createDuel(profiles(),false,1);
 for(let i=0;i<38;i++){const active=nextPlayer(ps);assert.equal(active.seat,i%2);ps[active.seat]=commitRound(active,[null,null,null],i+2);ps=duelPlayers(ps[0],JSON.parse(JSON.stringify(ps)));assert.equal(previousPlayer(ps).seat,i%2);}
 assert.equal(nextPlayer(ps),null);assert.equal(duelResult(ps).tie,true);
 ps[1]={...ps[1],darts:ps[1].darts.slice(0,-3),endedAt:null};assert.equal(nextPlayer(ps).seat,1);
 ps[1]=commitRound(ps[1],[{number:20,multiplier:1},null,null],100);assert.equal(duelResult(ps).winner.name,'Mikołaj');
});
test('new duel preserves solo history and per-player saves; incomplete and duplicate rosters rejected',()=>{
 const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 const p=profiles(),solo=createJdc(p[0],false,1);saveJdc(solo);const ps=createDuel(p,false,2);saveNewDuel(ps);
 saveJdc(commitRound(ps[0],[null,null,null],3));const stored=loadJdc();assert.equal(stored.length,3);assert.equal(stored.find(x=>x.id===solo.id).darts.length,0);assert.equal(nextPlayer(duelPlayers(ps[0],stored)).seat,1);
 assert.throws(()=>createDuel([p[0],p[0]]));assert.throws(()=>duelPlayers(ps[0],[ps[0]]));assert.throws(()=>saveNewDuel(ps));
});
