import { validateMatch } from './engine.js';
const KEY = 'dart-party-matches-v1';
export function loadMatches() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error('Nie można odczytać zapisanych meczów.');
  return data.map(validateMatch).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export function saveMatch(match) {
  validateMatch(match);
  const all = loadMatches().filter(m => m.id !== match.id);
  localStorage.setItem(KEY, JSON.stringify([match, ...all]));
  return match;
}
export function mergeRemote(remote) {
  const local = loadMatches();
  const byId = new Map(local.map(m => [m.id, m]));
  for (const row of remote) {
    try {
      const match = validateMatch(row.state);
      const existing = byId.get(match.id);
      if (!existing || match.updatedAt > existing.updatedAt) byId.set(match.id, match);
    } catch { /* A malformed remote record must not erase local games. */ }
  }
  localStorage.setItem(KEY, JSON.stringify([...byId.values()]));
}
