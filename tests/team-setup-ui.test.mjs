import test from 'node:test';
import assert from 'node:assert/strict';
import {validateTeamAssignments,teamSetupMarkup} from '../src/team-setup-ui.js';

test('Cricket team setup requires five explicit assignments into two pairs and one solo',()=>{
  for(const teams of [[0,1,0,1,2],[0,1,1,2,2],[0,0,1,2,2]])assert.deepEqual(validateTeamAssignments(teams),teams);
  for(const teams of [[0,0,0,1,2],[0,0,1,1,null],[0,0,1,1,3],[0,0,1,1],[0,0,1,1,'2']])assert.throws(()=>validateTeamAssignments(teams));
});

test('Cricket team setup preserves escaped names and leaves every assignment undecided',()=>{
  const html=teamSetupMarkup(['<name>','A&B','C','D','E']);
  assert.ok(html.includes('&lt;name&gt;'));
  assert.ok(html.includes('A&amp;B'));
  assert.equal((html.match(/<option value="">Wybierz drużynę<\/option>/g)||[]).length,5);
  assert.equal((html.match(/<select /g)||[]).length,5);
  assert.ok(!html.includes(' selected'));
});
