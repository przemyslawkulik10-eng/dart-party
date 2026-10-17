import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mostUsedField} from '../src/interface-info.js';
test('frequent field counts darts rather than multipliers, respects undo and ties',()=>{
 const events=[{type:'dart',number:20,multiplier:3},{type:'next'},{type:'dart',number:17,multiplier:1},{type:'dart',number:20,multiplier:1}];
 assert.equal(mostUsedField(events),20);assert.equal(mostUsedField(events.slice(0,-1)),17);assert.equal(mostUsedField([]),null);
 assert.equal(mostUsedField([{type:'dart',number:25,multiplier:2}]),50);
 assert.equal(mostUsedField([{type:'dart',number:0,multiplier:1}]),0);
});
