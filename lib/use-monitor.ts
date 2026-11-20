'use client';

import { useCallback, useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from 'react';
import {
  BlinkCounter,
  SENSITIVITY,
  UPRIGHT,
  driftOf,
  ema,
  glowFrom,
  makeBaseline,
  nightState,
  postureFrom,
  stepStrain,
  type FaceSample,
  type NightStage,
  type Posture,
} from './signals';
import { chime } from './sound';
import {
  baselineStore,
  loadSyncedAt,
  saveSession,
  saveSyncedAt,
  sessionsStore,
  type Mode,
  type Prefs,
  type SessionSummary,
} from './store';
import { pushToSupabase, syncConfigured } from './sync';

export type { RoutineKind as Routine } from './routines';
import type { RoutineKind as Routine } from './routines';
export type Sim = { head: number; torso: number; side: number; tilt: number; blink: number; late: boolean };
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
  cue: Routine | null;
  nextEyeS: number | null;
  nextResetS: number | null;
  night: { level: number; stage: NightStage; minutesToBed: number; clock: string };
  session: SessionSummary | null;
};

const TICK_MS = 250;
const SAVE_MS = 15_000;
const SYNC_MS = 60_000;
const MIN_SESSION_S = 30;
const SNOOZE_S = 5 * 60;
const MIN_CALIBRATION_FRAMES = 20;

const INITIAL: Snapshot = {
  posture: UPRIGHT,
  blinkRate: null,
  postureStrain: 0,
  eyeStrain: 0,
  driftFor: 0,
  lowBlinkFor: 0,
  blinkTotal: null,
  glow: 0,
  cue: null,
  nextEyeS: null,
  nextResetS: null,
  night: { level: 0, stage: 'day', minutesToBed: 0, clock: '' },
  session: null,
};

const pad = (n: number) => String(n).padStart(2, '0');

export function useMonitor({ mode, cameraOn, sim, prefs, routine, timerWindow }: {
  mode: Mode;
  cameraOn: boolean;
  sim: Sim;
  prefs: Prefs;
  routine: Routine | null;
  /** The mini monitor window while it is open; its timers are not throttled when this tab is hidden. */
  timerWindow: Window | null;
}) {
  const [snap, setSnap] = useState(INITIAL);
  const baseline = useSyncExternalStore(baselineStore.subscribe, baselineStore.get, baselineStore.server);
  const [syncResult, setSync] = useState<SyncResult | null>(null);
  const sync: SyncStatus = !syncConfigured || !prefs.sync ? { state: 'off' } : (syncResult ?? { state: 'idle' });
  const face = useRef({
    sample: null as FaceSample | null,
    at: 0,
    blinks: null as BlinkCounter | null,
    collect: null as FaceSample[] | null,
  });
  const model = useRef({
    posture: null as Posture | null,
    postureStrain: 0,
    eyeStrain: 0,
    driftFor: 0,
    lowBlinkFor: 0,
    rateSum: 0,
    rateT: 0,
    sinceEye: 0,
    sinceReset: 0,
    forced: null as Routine | null,
    lastCue: null as Routine | null,
    chimed: false,
    session: null as SessionSummary | null,
    last: 0,
    savedAt: 0,
    syncedAt: -Infinity,
    syncing: false,
  });

  const persist = useEffectEvent(() => {
    const m = model.current;
    const s = m.session;
    if (!s || s.active_s < MIN_SESSION_S) return;
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
    const pending = sessionsStore.get().filter((s) => !since || s.updated_at > since);
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
    const S = SENSITIVITY[prefs.sensitivity];
    // With the mini monitor open the user can still see the cues, so time counts.
    const watched = document.visibilityState === 'visible' || timerWindow !== null;

    let target: Posture | null = null;
    let rate: number | null = null;
    if (mode === 'demo') {
      target = { head: sim.head, torso: sim.torso, side: sim.side, tilt: sim.tilt };
      rate = sim.blink;
    } else if (mode === 'camera' && cameraOn) {
      const b = baselineStore.get();
      target = b && f.sample && now - f.at < 1000 ? postureFrom(f.sample, b) : null;
      // Hidden tabs only get about one frame a second, too slow to see blinks.
      rate = watched ? (f.blinks?.rate(now) ?? null) : null;
    }
    const prev = m.posture;
    m.posture =
      target && prev
        ? {
            head: ema(prev.head, target.head, dt, 0.8),
            torso: ema(prev.torso, target.torso, dt, 0.8),
            side: ema(prev.side, target.side, dt, 0.8),
            tilt: ema(prev.tilt, target.tilt, dt, 0.8),
          }
        : target;

    const drift = m.posture ? driftOf(m.posture) : 0;
    const drifting = !routine && drift > S.drift;
    const lowBlink = !routine && rate !== null && rate < S.lowBlink;
    m.postureStrain = stepStrain(m.postureStrain, drifting, dt, S.riseS, 4);
    m.eyeStrain = stepStrain(m.eyeStrain, lowBlink, dt, S.riseS * 2, 6);
    m.driftFor = drifting ? m.driftFor + dt : 0;
    m.lowBlinkFor = lowBlink ? m.lowBlinkFor + dt : 0;

    if (watched && !routine) {
      m.sinceEye += dt;
      m.sinceReset += dt;
    }
    const eyeDue = m.forced === 'eye' || (prefs.eyeMin > 0 && m.sinceEye >= prefs.eyeMin * 60);
    const resetDue = m.forced === 'reset' || (prefs.resetMin > 0 && m.sinceReset >= prefs.resetMin * 60);
    const cue: Routine | null = routine ? null : resetDue ? 'reset' : eyeDue ? 'eye' : null;
    if (cue && cue !== m.lastCue && prefs.sound) chime();
    m.lastCue = cue;

    const glow = routine ? 0 : 0.8 * Math.max(glowFrom(m.postureStrain), glowFrom(m.eyeStrain));
    if (glow > 0.5 && !m.chimed) {
      if (prefs.sound) chime();
      m.chimed = true;
    } else if (glow === 0) m.chimed = false;

    const d = new Date();
    const nowMin = sim.late && mode === 'demo' ? (prefs.bedtime + 40) % 1440 : d.getHours() * 60 + d.getMinutes();
    const night = nightState(nowMin, prefs.bedtime);

    const s = m.session;
    if (s && watched) {
      s.active_s += dt;
      s.source = mode === 'demo' ? 'simulation' : mode === 'camera' && cameraOn ? 'camera' : 'timer';
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
      blinkTotal: mode === 'camera' && cameraOn ? (f.blinks?.total ?? null) : null,
      glow,
      cue,
      nextEyeS: prefs.eyeMin > 0 ? Math.max(0, prefs.eyeMin * 60 - m.sinceEye) : null,
      nextResetS: prefs.resetMin > 0 ? Math.max(0, prefs.resetMin * 60 - m.sinceReset) : null,
      night: { ...night, clock: `${pad(Math.floor(nowMin / 60))}:${pad(nowMin % 60)}` },
      session: s && { ...s },
    });
  });

  useEffect(() => {
    const now = new Date().toISOString();
    model.current.session = {
      id: crypto.randomUUID(),
      started_at: now,
      updated_at: now,
      active_s: 0,
      resets: 0,
      eye_breaks: 0,
      slouch_s: 0,
      low_blink_s: 0,
      late_s: 0,
      avg_blink: null,
      source: 'simulation',
    };
    const onHide = () => {
      persist();
      pushSync();
    };
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      onHide();
    };
  }, []);

  useEffect(() => {
    const w = timerWindow ?? window;
    model.current.last = performance.now();
    const id = w.setInterval(() => {
      const now = performance.now();
      // Background tabs throttle timers; cap dt so a long freeze is not read as sustained drift.
      tick(now, Math.min(1, (now - model.current.last) / 1000));
      model.current.last = now;
    }, TICK_MS);
    return () => {
      try {
        w.clearInterval(id);
      } catch {}
    };
  }, [timerWindow]);

  useEffect(() => {
    // A new camera run starts a fresh blink window.
    face.current.sample = null;
    face.current.blinks = null;
  }, [mode, cameraOn]);

  const onSample = useCallback((s: FaceSample | null, t: number) => {
    const f = face.current;
    f.blinks ??= new BlinkCounter(t);
    if (!s) return;
    f.sample = s;
    f.at = t;
    f.blinks.push(t, s.blink);
    f.collect?.push(s);
  }, []);

  /** Collects frames for `ms` and stores the median as the upright baseline. Resolves false if the face was rarely seen. */
  const calibrate = useCallback(
    (ms: number) =>
      new Promise<boolean>((resolve) => {
        face.current.collect = [];
        setTimeout(() => {
          const got = face.current.collect ?? [];
          face.current.collect = null;
          if (got.length < MIN_CALIBRATION_FRAMES) return resolve(false);
          baselineStore.set(makeBaseline(got));
          resolve(true);
        }, ms);
      }),
    [],
  );

  const completeRoutine = useCallback((kind: Routine) => {
    const m = model.current;
    m.forced = null;
    m.sinceEye = 0;
    m.eyeStrain = 0;
    if (kind === 'reset') {
      m.sinceReset = 0;
      m.postureStrain = 0;
    }
    if (m.session) m.session[kind === 'reset' ? 'resets' : 'eye_breaks']++;
  }, []);

  // Due again in exactly SNOOZE_S, whatever the schedule.
  const snooze = useCallback(
    (kind: Routine) => {
      const m = model.current;
      m.forced = null;
      if (kind === 'eye') m.sinceEye = prefs.eyeMin * 60 - SNOOZE_S;
      else m.sinceReset = prefs.resetMin * 60 - SNOOZE_S;
    },
    [prefs.eyeMin, prefs.resetMin],
  );

  /** Makes a cue due now, so the break flow can be tried without waiting for the schedule. */
  const triggerCue = useCallback((kind: Routine) => {
    model.current.forced = kind;
  }, []);

  // Used before wiping local data, so the pagehide save does not write this session back.
  const discardSession = useCallback(() => {
    model.current.session = null;
  }, []);

  return { snap, baseline, sync, onSample, calibrate, completeRoutine, snooze, triggerCue, discardSession };
}
