import type { Baseline } from './signals';

// Everything here is local to the browser. Only `SessionSummary` and `Prefs`
// are ever synced (see sync.ts); the calibration baseline never leaves the device.

export type Warmth = 'auto' | 'on' | 'off';
export type Prefs = { bedtime: number; warmth: Warmth; sync: boolean };
export const DEFAULT_PREFS: Prefs = { bedtime: 23 * 60, warmth: 'auto', sync: false };

// snake_case so rows go to Supabase unchanged
export type SessionSummary = {
  id: string;
  started_at: string;
  updated_at: string;
  active_s: number;
  resets: number;
  slouch_s: number;
  low_blink_s: number;
  late_s: number;
  avg_blink: number | null;
  source: 'camera' | 'simulation';
};

const KEY = {
  prefs: 'niskala:prefs',
  baseline: 'niskala:baseline',
  sessions: 'niskala:sessions',
  syncedAt: 'niskala:synced-at',
};
const MAX_SESSIONS = 50;

// Storage can throw (private mode, quota, blocked cookies); the app must keep working without it.
function read<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// Shaped for useSyncExternalStore: the server snapshot is the fallback, so the
// prerendered shell never depends on what this browser has stored.
function stored<T>(key: string, fallback: T, parse: (v: T | null) => T = (v) => v ?? fallback) {
  const listeners = new Set<() => void>();
  let cache: { v: T } | null = null;
  return {
    subscribe(cb: () => void) {
      listeners.add(cb);
      return () => void listeners.delete(cb);
    },
    get: () => (cache ??= { v: parse(read<T>(key)) }).v,
    server: () => fallback,
    set(v: T) {
      cache = { v };
      write(key, v);
      listeners.forEach((l) => l());
    },
  };
}

export const prefsStore = stored<Prefs>(KEY.prefs, DEFAULT_PREFS, (v) => ({ ...DEFAULT_PREFS, ...v }));
export const baselineStore = stored<Baseline | null>(KEY.baseline, null);

export const loadSessions = () => read<SessionSummary[]>(KEY.sessions) ?? [];

export function saveSession(s: SessionSummary) {
  const rest = loadSessions().filter((x) => x.id !== s.id);
  write(KEY.sessions, [s, ...rest].slice(0, MAX_SESSIONS));
}

export const loadSyncedAt = () => read<string>(KEY.syncedAt);
export const saveSyncedAt = (iso: string) => write(KEY.syncedAt, iso);

export function clearAll() {
  try {
    Object.values(KEY).forEach((k) => localStorage.removeItem(k));
  } catch {}
}
