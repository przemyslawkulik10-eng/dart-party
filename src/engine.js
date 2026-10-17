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

export function replay(match) {
  const start = match.mode === 'cricket' ? 0 : Number(match.mode);
  const state = {
    players: match.names.map(name => ({ name, score: start, openingTriples: [], marks: Object.fromEntries(TARGETS.map(n => [n, 0])), darts: 0, scored: 0 })),
    current: 0, round: 1, leg:1, legStarter:0, legWinner:null, legWins:match.names.map(()=>0), turn: [], turnStart: start, turnPoints: 0, ready: false, bust: false, winner: null, visits: [],
  };
  for (const event of match.events) {
    if (state.winner !== null) throw new Error('Mecz został zakończony.');
    if(event.type==='nextLeg'){
      if(state.legWinner===null)throw new Error('Najpierw zakończ leg.');
      state.leg++;state.legStarter=(state.legStarter+1)%state.players.length;state.current=state.legStarter;
      state.round=1;state.turn=[];state.turnStart=start;state.turnPoints=0;state.ready=false;state.bust=false;state.legWinner=null;state.visits=[];
      for(const p of state.players){p.score=start;p.marks=Object.fromEntries(TARGETS.map(n=>[n,0]));p.openingTriples=[];p.darts=0;p.scored=0;}
      continue;
    }
    if(state.legWinner!==null)throw new Error('Rozpocznij kolejny leg.');
    if (event.type === 'next') {
      if (!state.ready) throw new Error('Najpierw wpisz trzy rzuty.');
      state.visits.push({ player: state.current, round: state.round, darts: [...state.turn], bust: state.bust, points: state.bust ? 0 : state.turnPoints });
      state.current = (state.current + 1) % state.players.length;
      if (state.current === state.legStarter) state.round++;
      state.turn = []; state.turnPoints = 0; state.ready = false; state.bust = false;
      state.turnStart = state.players[state.current].score;
      continue;
    }
    if (event.type !== 'dart' || !validDart(event) || state.ready) throw new Error('Nieprawidłowy rzut.');
    const player = state.players[state.current];
    if(match.mode==='cricket' && match.cricketOpening==='two-triples' && event.number===20 && player.openingTriples.length<2)throw new Error('Najpierw traf potrójne w dwóch różnych polach 15–19. Dwudziestkę wpisz jako pudło.');
    player.darts++;
    state.turn.push({ number: event.number, multiplier: event.multiplier });
    const value = event.number * event.multiplier;
    if (match.mode === 'cricket') {
      if(event.multiplier===3 && event.number>=15 && event.number<=19 && !player.openingTriples.includes(event.number))player.openingTriples.push(event.number);
      if (TARGETS.includes(event.number)) {
        const before = player.marks[event.number];
        const extra = Math.max(0, before + event.multiplier - 3);
        player.marks[event.number] = Math.min(3, before + event.multiplier);
        if (state.players.some((p, i) => i !== state.current && p.marks[event.number] < 3)) {
          if(match.cricketScoring==='cutthroat') {
            for(const [i,opponent] of state.players.entries()) {
              if(i!==state.current && opponent.marks[event.number]<3){opponent.score+=extra*event.number;state.turnPoints+=extra*event.number;}
            }
          } else {player.score += extra * event.number;state.turnPoints += extra * event.number;}
        }
      }
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
    if(state.winner!==null){
      state.legWinner=state.winner;state.legWins[state.winner]++;
      if(state.legWins[state.winner]<(match.legsToWin||1))state.winner=null;
    }
  }
  return state;
}

export function recordDart(match, number, multiplier = 1) {
  const next = { ...match, events: [...match.events, { type: 'dart', number, multiplier }], updatedAt: new Date().toISOString() };
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
