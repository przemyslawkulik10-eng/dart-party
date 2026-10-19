import {accountOwner} from './account-storage.js';
import { config } from './config.js';
import { loadMatches, mergeRemote } from './storage.js';
const AUTH_KEY = 'dart-party-auth-v1';
const configured = !!config.supabaseUrl && !!config.supabaseKey;
let task = null;
const synced = new Map();
let again = false;
let sessionPromise;
let restored = false;
let listener = () => {};
export const onCloudStatus = fn => { listener = fn; };
export const cloudEnabled = () => configured;
async function api(path, { method = 'GET', body, token, headers = {} } = {}) {
  const res = await fetch(`${config.supabaseUrl}${path}`, {
    method, headers: { apikey: config.supabaseKey, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Zapis w chmurze niedostępny (${res.status}).`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
async function getSession() {
  const session = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  if (session && session.expires_at > Date.now() / 1000 + 120) return session;
  const data = session?.refresh_token
    ? await api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: session.refresh_token } })
    : await api('/auth/v1/signup', { method: 'POST', body: { data: {} } });
  if (!data?.access_token || !data?.user?.id) throw new Error('Nie udało się utworzyć sesji tabletu.');
  data.expires_at = data.expires_at || Math.floor(Date.now() / 1000) + data.expires_in;
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
  return data;
}
async function session() {
  if (!sessionPromise) sessionPromise = getSession().finally(() => { sessionPromise = null; });
  return sessionPromise;
}
export function syncCloud() {
  if (task) { again = true; return task; }
  task = runSync().finally(() => { task = null; });
  return task;
}
async function runSync() {
  if (accountOwner()) { listener('Konto gracza · synchronizuj w Koncie'); return; }
  if (!configured) { listener('Zapis na tablecie'); return; }
  if (!navigator.onLine) { listener('Zapis na tablecie · bez internetu'); return; }
  try {
    listener('Zapis na tablecie · synchronizacja…');
    const auth = await session();
    // Restore before uploading, so an empty browser never overwrites remote data.
    if (!restored) {
      const rows = await api('/rest/v1/dart_matches?select=state&order=updated_at.desc&limit=500', { token: auth.access_token });
      if(accountOwner())return;
      mergeRemote(rows || []);
      restored = true;
    }
    do {
      again = false;
      if(accountOwner())return;
      const batch = loadMatches();
      const before = JSON.stringify(batch);
      for (const match of batch) {
        const fingerprint = JSON.stringify(match);
        if (synced.get(match.id) === fingerprint) continue;
        await api('/rest/v1/dart_matches?on_conflict=id', { method: 'POST', token: auth.access_token, headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: { id: match.id, owner_id: auth.user.id, state: match, updated_at: match.updatedAt } });
        synced.set(match.id, fingerprint);
      }
      if (JSON.stringify(loadMatches()) !== before) again = true;
    } while (again);
    listener('Zapisano na tablecie i w chmurze');
  } catch { listener('Zapis na tablecie · chmura niedostępna'); }
}
addEventListener('online', syncCloud);
addEventListener('offline', () => listener('Zapis na tablecie · bez internetu'));
