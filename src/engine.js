import {validProfileId} from './profiles.js';
export const DEFAULT_PLAYERS = ['MACIEK', 'PRZEMEK', 'MANIEK', 'DAWID', 'JAREK', 'BEKO'];
export const TARGETS = [20, 19, 18, 17, 16, 15, 25];
export const MODES = ['501', '301', '201', 'cricket'];

export function createMatch(names, mode = '501', doubleOut = false, cricketScoring = 'standard', cricketOpening = 'standard', legsToWin = 1) {
  if(![1,2,3].includes(legsToWin))throw new Error('Nieprawidłowa liczba legów.');
  if (!['standard','two-triples'].includes(cricketOpening))throw new Error('Nieznana zasada otwarcia Cricket.');
  if (!['standard','cutthroat'].includes(cricketScoring)) throw new Error('Nieznana punktacja Cricket.');
  if (!MODES.includes(mode)) throw new Error('Nieznany tryb gry.');
  if (!Array.isArray(names) || names.length < 2 || names.length > 6) throw new Error('Wybierz od 2 do 6 graczy.');
  names = names.map(n => String(n).trim().slice(0, 24));
  if (names.some(n => !n) || new Set(names.map(n => n.toUpperCase())).size !== names.length) throw new Error('Każdy gracz musi mieć inne imię.');
  return { version: 1, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), names, mode, legsToWin, cricketOpening:mode==='cricket'?cricketOpening:'standard', cricketScoring: mode==='cricket'?cricketScoring:'standard', doubleOut: mode !== 'cricket' && !!doubleOut, events: [] };
}

export function validDart(dart) {
  return dart && Number.isInteger(dart.number) && [1, 2, 3].includes(dart.multiplier) &&
    ((dart.number === 0 && dart.multiplier === 1) || (dart.number >= 1 && dart.number <= 20) || (dart.number === 25 && dart.multiplier <= 2));
}
export const dartLabel = dart => dart.number === 0 ? 'PUDŁO' : dart.number === 25 ? (dart.multiplier === 2 ? 'BULL 50' : 'BULL 25') : `${dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : ''}${dart.number}`;

export function cricketTeamOrder(match) {
  if (!match.teams) return match.names.map((_, i) => i);
  validateCricketTeams(match);
  const groups = [0,1,2].map(team => match.teams.flatMap((t,i) => t===team ? [i] : []));
  const order=[0,1].flatMap(round => groups.map(members => members[round % members.length]));
  const first=order.indexOf(0);
  return [...order.slice(first),...order.slice(0,first)];
}
function validateCricketTeams(match) {
  if (match.teams === undefined) return;
  if (match.mode!=='cricket' || match.names.length!==5 || !Array.isArray(match.teams) || match.teams.length!==5 || match.teams.some(t=>![0,1,2].includes(t)) || [0,1,2].map(t=>match.teams.filter(v=>v===t).length).sort().join(',')!=='1,2,2') throw new Error('Cricket drużynowy wymaga dwóch par i jednego gracza solo.');
}
export function configureCricketTeams(match, teams) {
  if (match.events.length) throw new Error('Drużyny wybierz przed pierwszym rzutem.');
  const next = {...match, teams:[...teams], updatedAt:new Date().toISOString()};
  return validateMatch(next);
}

export function replay(match) {
  validateCricketTeams(match);
  const order = cricketTeamOrder(match);
  const teamOf = i => match.teams ? match.teams[i] : i;
  const representatives = match.names.map((_,i)=>i).filter((i,_,all)=>all.find(j=>teamOf(j)===teamOf(i))===i);
  const start = match.mode === 'cricket' ? 0 : Number(match.mode);
  const state = {
    players: match.names.map(name => ({ name, score: start, openingTriples: [], marks: Object.fromEntries(TARGETS.map(n => [n, 0])), darts: 0, scored: 0 })),
    current: 0, round: 1, leg:1, legStarter:0, legWinner:null, legWins:match.names.map(()=>0), turn: [], turnStart: start, turnPoints: 0, ready: false, bust: false, winner: null, visits: [], achievements: [],
  };
  let orderPosition = 0;
  state.current = order[0]; state.legStarter = order[0];
  const syncTeams = () => {
    if (!match.teams) return;
    for (const i of representatives) for (let j=0;j<state.players.length;j++) if(teamOf(j)===teamOf(i)) {
      state.players[j].marks = state.players[i].marks;
      state.players[j].score = state.players[i].score;
      state.players[j].openingTriples = state.players[i].openingTriples;
    }
  };
  syncTeams();
  for (const event of match.events) {
    if (state.winner !== null) throw new Error('Mecz został zakończony.');
    if(event.type==='nextLeg'){
      if(state.legWinner===null)throw new Error('Najpierw zakończ leg.');
      state.leg++;orderPosition=(state.leg-1)%order.length;state.legStarter=order[orderPosition];state.current=state.legStarter;
      state.round=1;state.turn=[];state.turnStart=start;state.turnPoints=0;state.ready=false;state.bust=false;state.legWinner=null;state.visits=[];
      for(const p of state.players){p.score=start;p.marks=Object.fromEntries(TARGETS.map(n=>[n,0]));p.openingTriples=[];p.darts=0;p.scored=0;}
      syncTeams();
      if(match.teams)state.winningTeam=null;
      continue;
    }
    if(state.legWinner!==null)throw new Error('Rozpocznij kolejny leg.');
    if (event.type === 'next') {
      if (!state.ready) throw new Error('Najpierw wpisz trzy rzuty.');
      state.visits.push({ player: state.current, round: state.round, darts: [...state.turn], bust: state.bust, points: state.bust ? 0 : state.turnPoints });
      orderPosition = (orderPosition + 1) % order.length;
      state.current = order[orderPosition];
      if ((match.teams && (state.visits.length % 3)===0) || (!match.teams && state.current === state.legStarter)) state.round++;
      state.turn = []; state.turnPoints = 0; state.ready = false; state.bust = false;
      state.turnStart = state.players[state.current].score;
      continue;
    }
    if (event.type !== 'dart' || !validDart(event) || state.ready) throw new Error('Nieprawidłowy rzut.');
    const player = state.players[state.current];
    if(match.mode==='cricket' && match.cricketOpening==='two-triples' && event.number===20 && [15,16,17,18,19].filter(n=>player.marks[n]===3).length<2)throw new Error('Najpierw zamknij dwa różne pola 15–19. Dwudziestkę wpisz jako pudło.');
    player.darts++;
    state.turn.push({ number: event.number, multiplier: event.multiplier });
    const value = event.number * event.multiplier;
    if (match.mode === 'cricket') {
      if(event.multiplier===3 && event.number>=15 && event.number<=19 && !player.openingTriples.includes(event.number))player.openingTriples.push(event.number);
      if (TARGETS.includes(event.number)) {
        const before = player.marks[event.number];
        const extra = Math.max(0, before + event.multiplier - 3);
        player.marks[event.number] = Math.min(3, before + event.multiplier);
        if (representatives.some(i => teamOf(i) !== teamOf(state.current) && state.players[i].marks[event.number] < 3)) {
          if(match.cricketScoring==='cutthroat') {
            for(const i of representatives) {
              const opponent=state.players[i];
              if(teamOf(i)!==teamOf(state.current) && opponent.marks[event.number]<3){opponent.score+=extra*event.number;state.turnPoints+=extra*event.number;}
            }
          } else {player.score += extra * event.number;state.turnPoints += extra * event.number;
            if(match.teams) for(const i of representatives) if(teamOf(i)===teamOf(state.current)) state.players[i].score=player.score;
          }
        }
      }
      syncTeams();
      if(match.cricketScoring==='cutthroat'){
        const winner=state.players.findIndex(candidate=>TARGETS.every(n=>candidate.marks[n]===3) && state.players.every(p=>candidate.score<=p.score));
        if(winner>=0)state.winner=winner;
      } else if (TARGETS.every(n => player.marks[n] === 3) && state.players.every(p => player.score >= p.score)) state.winner = state.current;
    } else {
      const remaining = player.score - value;
      const bust = remaining < 0 || (match.doubleOut && (remaining === 1 || (remaining === 0 && event.multiplier !== 2)));
      if (bust) {
        player.score = state.turnStart;
        player.scored -= state.turnPoints;
        state.turnPoints = 0;
        state.bust = true;
        state.ready = true;
      } else {
        player.score = remaining; player.scored += value; state.turnPoints += value;
        if (remaining === 0) state.winner = state.current;
      }
    }
    if (state.turn.length === 3) state.ready = true;
    // Derived from saved darts: undo removes an achievement and replay never duplicates it.
    if (match.mode !== 'cricket' && !state.bust && state.turn.length === 3) {
      const kind = [180,140].includes(state.turnPoints) ? String(state.turnPoints) :
        match.doubleOut && state.turnStart === 170 && state.winner === state.current ? '170' : null;
      if (kind) state.achievements.push({kind, player:state.current, leg:state.leg, round:state.round,
        at:typeof event.at === 'string' && Number.isFinite(Date.parse(event.at)) ? event.at : null,
        darts:state.turn.map(d=>({...d}))});
    }
    if(state.winner!==null){
      state.legWinner=state.winner;
      for(let i=0;i<state.legWins.length;i++) if(teamOf(i)===teamOf(state.winner))state.legWins[i]++;
      if(match.teams)state.winningTeam=teamOf(state.winner);
      if(state.legWins[state.winner]<(match.legsToWin||1))state.winner=null;
    }
  }
  return state;
}

export function recordDart(match, number, multiplier = 1) {
  const next = { ...match, events: [...match.events, { type: 'dart', number, multiplier, at: new Date().toISOString() }], updatedAt: new Date().toISOString() };
  replay(next);
  return next;
}
export function nextPlayer(match) {
  const next = { ...match, events: [...match.events, { type: 'next' }], updatedAt: new Date().toISOString() };
  replay(next);
  return next;
}
export function undoDart(match) {
  const events = [...match.events];
  if (['next','nextLeg'].includes(events.at(-1)?.type)) events.pop();
  if (events.at(-1)?.type === 'dart') events.pop();
  return { ...match, events, updatedAt: new Date().toISOString() };
}
export function validateMatch(match) {
  if (!match || match.version !== 1 || typeof match.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(match.id) || !MODES.includes(match.mode) || !Array.isArray(match.names) || match.names.length < 2 || match.names.length > 6 || match.names.some(n => typeof n !== 'string' || !n.trim() || n.length > 24) || new Set(match.names.map(n => n.toUpperCase())).size !== match.names.length || typeof match.doubleOut !== 'boolean' || !Array.isArray(match.events) || match.events.length > 20000 || !Number.isFinite(Date.parse(match.updatedAt)) || !Number.isFinite(Date.parse(match.createdAt))) throw new Error('Nieprawidłowy plik meczu.');
  if(match.profileIds!==undefined && (!Array.isArray(match.profileIds)||match.profileIds.length!==match.names.length||match.profileIds.some(id=>!validProfileId(id))||new Set(match.profileIds).size!==match.profileIds.length))throw new Error('Nieprawidłowe profile meczu.');
  if(match.sessionType!==undefined && match.sessionType!=='competition')throw new Error('Nieprawidłowy rodzaj sesji.');
  if(match.legsToWin!==undefined && ![1,2,3].includes(match.legsToWin))throw new Error('Nieprawidłowa liczba legów.');
  if(match.cricketOpening!==undefined && !['standard','two-triples'].includes(match.cricketOpening))throw new Error('Nieprawidłowa zasada otwarcia Cricket.');
  if(match.cricketScoring!==undefined && !['standard','cutthroat'].includes(match.cricketScoring))throw new Error('Nieprawidłowa punktacja Cricket.');
  replay(match);
  return match;
}

export function isShanghai(turn){
  return turn.length===3 && turn[0].number>=1 && turn[0].number<=20 && turn.every(d=>d.number===turn[0].number) && new Set(turn.map(d=>d.multiplier)).size===3 && turn.every(d=>[1,2,3].includes(d.multiplier));
}

export function nextLeg(match){
  const next={...match,events:[...match.events,{type:'nextLeg'}],updatedAt:new Date().toISOString()};replay(next);return next;
}

export function isThreeTriples(turn){
  return turn.length===3 && turn.every(d=>d.multiplier===3 && TARGETS.includes(d.number) && d.number!==25);
}

export function enableDoubleOut(match){
  if(match.mode==='cricket')throw new Error('Double Out dotyczy gier 501, 301 i 201.');
  if(match.doubleOut)return match;
  const next={...match,doubleOut:true,updatedAt:new Date().toISOString()};
  try{if(JSON.stringify(replay(match))!==JSON.stringify(replay(next)))throw new Error('changed');}
  catch{throw new Error('Zmiana naruszyłaby wcześniejsze wyniki. Zachowano mecz — Double Out wybierz przy nowym meczu.');}
  return next;
}
