'use client';

import { useCallback, useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from 'react';
import {
  BlinkCounter,
  DRIFT_THRESHOLD,
  LOW_BLINK_PER_MIN,
  ema,
  glowFrom,
  nightState,
  postureFrom,
  stepStrain,
  type Baseline,
  type FaceSample,
  type NightStage,
  type Posture,
} from './signals';
import {
  baselineStore,
  loadSessions,
  loadSyncedAt,
  saveSession,
  saveSyncedAt,
  type Prefs,
  type SessionSummary,
} from './store';
import { pushToSupabase, syncConfigured } from './sync';

export type Source = 'simulation' | 'camera';
export type Sim = { head: number; torso: number; blink: number; late: boolean };
type SyncResult = { state: 'ok'; at: string } | { state: 'error'; message: string };
export type SyncStatus = { state: 'off' | 'idle' } | SyncResult;

export type Snapshot = {
  posture: Posture | null;
  blinkRate: number | null;
  postureStrain: number;
  eyeStrain: number;
  driftFor: number;
  lowBlinkFor: number;
  blinkTotal: number | null;
  glow: number;
  night: { level: number; stage: NightStage; minutesToBed: number; clock: string };
  session: SessionSummary | null;
};

const TICK_MS = 250;
const SAVE_MS = 15_000;
const SYNC_MS = 60_000;
const MIN_SESSION_S = 30;

const INITIAL: Snapshot = {
  posture: { head: 0, torso: 0 },
  blinkRate: null,
  postureStrain: 0,
  eyeStrain: 0,
  driftFor: 0,
  lowBlinkFor: 0,
  blinkTotal: null,
  glow: 0,
  night: { level: 0, stage: 'day', minutesToBed: 0, clock: '' },
  session: null,
};

const pad = (n: number) => String(n).padStart(2, '0');

export function useMonitor({ source, sim, prefs, resetting }: {
  source: Source;
  sim: Sim;
  prefs: Prefs;
  resetting: boolean;
}) {
  const [snap, setSnap] = useState(INITIAL);
  const baseline = useSyncExternalStore(baselineStore.subscribe, baselineStore.get, baselineStore.server);
  const [syncResult, setSync] = useState<SyncResult | null>(null);
  const sync: SyncStatus = !syncConfigured || !prefs.sync ? { state: 'off' } : (syncResult ?? { state: 'idle' });
  const face = useRef({
    sample: null as FaceSample | null,
    at: 0,
    blinks: null as BlinkCounter | null,
  });
  const model = useRef({
    posture: null as Posture | null,
    postureStrain: 0,
    eyeStrain: 0,
    driftFor: 0,
    lowBlinkFor: 0,
    rateSum: 0,
    rateT: 0,
    session: null as SessionSummary | null,
    savedAt: 0,
    syncedAt: -Infinity,
    syncing: false,
  });

  const persist = useEffectEvent(() => {
    const s = model.current.session;
    if (!s || s.active_s < MIN_SESSION_S) return;
    const m = model.current;
    saveSession({
      ...s,
      updated_at: new Date().toISOString(),
      active_s: Math.round(s.active_s),
      slouch_s: Math.round(s.slouch_s),
      low_blink_s: Math.round(s.low_blink_s),
      late_s: Math.round(s.late_s),
      avg_blink: m.rateT > 0 ? Math.round((m.rateSum / m.rateT) * 10) / 10 : null,
    });
  });

  const pushSync = useEffectEvent(() => {
    const m = model.current;
    if (!syncConfigured || !prefs.sync || m.syncing) return;
    m.syncing = true;
    const startedAt = new Date().toISOString();
    const since = loadSyncedAt();
    const pending = loadSessions().filter((s) => !since || s.updated_at > since);
    pushToSupabase(pending, prefs)
      .then(() => {
        saveSyncedAt(startedAt);
        setSync({ state: 'ok', at: startedAt });
      })
      .catch((e: unknown) => setSync({ state: 'error', message: e instanceof Error ? e.message : String(e) }))
      .finally(() => (m.syncing = false));
  });

  const tick = useEffectEvent((now: number, dt: number) => {
    const f = face.current;
    const m = model.current;

    let target: Posture | null;
    let rate: number | null;
    if (source === 'simulation') {
      target = { head: sim.head, torso: sim.torso };
      rate = sim.blink;
    } else {
      const b = baselineStore.get();
      target = b && f.sample && now - f.at < 1000 ? postureFrom(f.sample, b) : null;
      rate = f.blinks?.rate(now) ?? null;
    }
    m.posture =
      target && m.posture
        ? { head: ema(m.posture.head, target.head, dt, 0.8), torso: ema(m.posture.torso, target.torso, dt, 0.8) }
        : target;

    const drift = m.posture ? Math.max(m.posture.head, m.posture.torso) : 0;
    const drifting = !resetting && drift > DRIFT_THRESHOLD;
    const lowBlink = !resetting && rate !== null && rate < LOW_BLINK_PER_MIN;
    m.postureStrain = stepStrain(m.postureStrain, drifting, dt, 10, 4);
    m.eyeStrain = stepStrain(m.eyeStrain, lowBlink, dt, 20, 6);
    m.driftFor = drifting ? m.driftFor + dt : 0;
    m.lowBlinkFor = lowBlink ? m.lowBlinkFor + dt : 0;

    const d = new Date();
    const nowMin = sim.late ? (prefs.bedtime + 40) % 1440 : d.getHours() * 60 + d.getMinutes();
    const night = nightState(nowMin, prefs.bedtime);

    const s = m.session;
    if (s && document.visibilityState === 'visible') {
      s.active_s += dt;
      s.source = source;
      if (drifting) s.slouch_s += dt;
      if (lowBlink) s.low_blink_s += dt;
      if (night.stage !== 'day') s.late_s += dt;
      if (rate !== null) {
        m.rateSum += rate * dt;
        m.rateT += dt;
      }
    }
    if (now - m.savedAt > SAVE_MS) {
      m.savedAt = now;
      persist();
    }
    if (now - m.syncedAt > SYNC_MS) {
      m.syncedAt = now;
      pushSync();
    }

    setSnap({
      posture: m.posture,
      blinkRate: rate,
      postureStrain: m.postureStrain,
      eyeStrain: m.eyeStrain,
      driftFor: m.driftFor,
      lowBlinkFor: m.lowBlinkFor,
      blinkTotal: source === 'camera' ? (f.blinks?.total ?? null) : null,
      glow: resetting ? 0 : 0.8 * Math.max(glowFrom(m.postureStrain), glowFrom(m.eyeStrain)),
      night: { ...night, clock: `${pad(Math.floor(nowMin / 60))}:${pad(nowMin % 60)}` },
      session: s && { ...s },
    });
  });

  useEffect(() => {
    model.current.session = {
      id: crypto.randomUUID(),
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      active_s: 0,
      resets: 0,
      slouch_s: 0,
      low_blink_s: 0,
      late_s: 0,
      avg_blink: null,
      source: 'simulation',
    };
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      // Background tabs throttle timers; cap dt so a long freeze is not read as sustained drift.
      tick(now, Math.min(1, (now - last) / 1000));
      last = now;
    }, TICK_MS);
    const onHide = () => {
      persist();
      pushSync();
    };
    window.addEventListener('pagehide', onHide);
    return () => {
      clearInterval(id);
      window.removeEventListener('pagehide', onHide);
      onHide();
    };
  }, []);

  useEffect(() => {
    // A new camera run starts a fresh blink window.
    face.current.sample = null;
    face.current.blinks = null;
  }, [source]);

  const onSample = useCallback((s: FaceSample | null, t: number) => {
    const f = face.current;
    f.blinks ??= new BlinkCounter(t);
    if (!s) return;
    f.sample = s;
    f.at = t;
    f.blinks.push(t, s.blink);
  }, []);

  const setBaseline = useCallback((b: Baseline) => baselineStore.set(b), []);

  const completeReset = useCallback(() => {
    const m = model.current;
    m.postureStrain = 0;
    m.eyeStrain = 0;
    if (m.session) m.session.resets++;
  }, []);

  // Used before wiping local data, so the pagehide save does not write this session back.
  const discardSession = useCallback(() => {
    model.current.session = null;
  }, []);

  return { snap, baseline, sync, onSample, setBaseline, completeReset, discardSession };
}
