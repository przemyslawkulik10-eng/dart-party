import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bullState} from '../src/bull-off.js';
test('three darts each, highest sum starts, without adding points to game',()=>{
 const s=bullState(3,[25,25,0,50,25,0,0,0,0]);assert.equal(s.winner,1);
});
test('only tied leaders play again; scores reset; repeat ties and undo',()=>{
 const first=[50,0,0,25,25,0,0,0,0];
 let s=bullState(3,first);assert.deepEqual(s.contenders,[0,1]);assert.equal(s.round,2);assert.deepEqual(s.scores,{});
 const tie=[...first,0,0,0,0,0,0];assert.equal(bullState(3,tie).round,3);
 const finish=[...tie,0,0,0,25,0,0];assert.equal(bullState(3,finish).winner,1);
 assert.equal(bullState(3,finish.slice(0,-1)).winner,null);
 assert.equal(bullState(3,first.slice(0,-1)).round,1);
});
test('all zero sends all six to tie break',()=>{assert.equal(bullState(6,Array(18).fill(0)).contenders.length,6);});
