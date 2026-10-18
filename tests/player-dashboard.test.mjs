import test from 'node:test';
import assert from 'node:assert/strict';
import {createMnoznik,throwMnoznik,undoMnoznik} from '../src/mnoznik.js';
import {createMnoznikSparing,throwMnoznikSparing} from '../src/mnoznik-sparing.js';
import {playerStats,exportPlayer} from '../src/player-stats.js';
import {dashboardSummary,dashboardMarkup,multiplierResults} from '../src/player-dashboard.js';
import {linkLegacyMatch} from '../src/legacy-profiles.js';
import {ensureProfiles} from '../src/profiles.js';
import {createMatch,recordDart} from '../src/engine.js';
import {loadMatches,saveMatch} from '../src/storage.js';
const p={id:'11111111-1111-4111-8111-111111111111',name:'PRZEMEK',createdAt:1000},q={id:'22222222-2222-4222-8222-222222222222',name:'PRIVATE OPPONENT',createdAt:1000};
const data=()=>({profile:p,trainings:[],jdc:[],matches:[],cyferki:[]});
test('dashboard shows empty states and eight playable entries without invented results',()=>{const d=data(),st=playerStats(d),s=dashboardSummary(d,st);assert.equal(s.sessions,0);assert.equal(s.lastAt,null);const html=dashboardMarkup(d,st);assert.match(html,/Brak zapisanych wyników/);assert.equal((html.match(/class="profile-game"/g)||[]).length,8);});
test('Mnoznik counts own darts, completed solo and sparring separately; undo reduces totals; export has no opponents',()=>{
 let solo=createMnoznik(p,1000);for(let i=0;i<36;i++)solo=throwMnoznik(solo,i%6<3?1:20,1100+i);
 let multi=createMnoznikSparing([p,q],1000);for(let i=0;i<72;i++)multi=throwMnoznikSparing(multi,0,2000+i);
 const d={...data(),mnoznik:[solo],mnoznikSparing:[multi]},st=playerStats(d),s=dashboardSummary(d,st);
 assert.equal(s.darts,72);assert.equal(s.completed,1);assert.equal(s.wins,0);assert.equal(s.active,0);assert.equal(st.mnoznikResults[1].score,1080);assert.equal(st.mnoznikResults[0].draw,true);
 const undone={...d,mnoznik:[undoMnoznik(solo)]};assert.equal(dashboardSummary(undone,playerStats(undone)).darts,71);assert.equal(dashboardSummary(undone,playerStats(undone)).active,1);
 assert.ok(!JSON.stringify(exportPlayer(d)).includes('PRIVATE OPPONENT'));assert.ok(!JSON.stringify(exportPlayer(d)).includes(q.id));assert.throws(()=>multiplierResults({...d,profile:q}));
});
test('legacy assignment requires explicit distinct profiles, keeps throws and timestamp, and saves original backup',()=>{
 const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 const profiles=ensureProfiles(['Przemek','Maciek']);const m=recordDart(createMatch(['OLD A','OLD B'],'301'),20,3);saveMatch(m);
 assert.throws(()=>linkLegacyMatch(m.id,[profiles[0].id,profiles[0].id]));assert.equal(loadMatches()[0].profileIds,undefined);
 linkLegacyMatch(m.id,profiles.map(p=>p.id));const linked=loadMatches()[0];assert.deepEqual(linked.events,m.events);assert.equal(linked.updatedAt,m.updatedAt);assert.deepEqual(linked.profileIds,profiles.map(p=>p.id));assert.deepEqual(JSON.parse(store.get('dart-party-profile-links-backup-v1'))[0].match,m);assert.throws(()=>linkLegacyMatch(m.id,profiles.map(p=>p.id)));delete globalThis.localStorage;
});
