import {createMatch,configureCricketTeams,validateMatch} from './engine.js';

// Starting order only: bull-off throws never become match scoring events.
export function matchFromContest(contest,starter){
  if(!contest||!Array.isArray(contest.names)||!Number.isInteger(starter)||starter<0||starter>=contest.names.length)throw new Error('Wybierz rozpoczynającego gracza.');
  const order=[starter,...contest.names.map((_,i)=>i).filter(i=>i!==starter)];
  let next=createMatch(order.map(i=>contest.names[i]),contest.mode,contest.doubleOut,contest.cricketScoring,contest.cricketOpening,contest.legsToWin);
  if(contest.teams)next=configureCricketTeams(next,order.map(i=>contest.teams[i]));
  if(contest.profileIds)next.profileIds=order.map(i=>contest.profileIds[i]);
  if(contest.sessionType!==undefined)next.sessionType=contest.sessionType;
  return validateMatch(next);
}
