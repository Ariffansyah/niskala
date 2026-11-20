'use client';

import Link from 'next/link';
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { duration, hhmm, minutes, parseHhmm } from '@/lib/format';
import { SENSITIVITY, type Sensitivity } from '@/lib/signals';
import { chime } from '@/lib/sound';
import { clearAll, exportData, prefsStore, type Mode, type Prefs, type Warmth } from '@/lib/store';
import { syncConfigured } from '@/lib/sync';
import { useMonitor, type Routine, type Sim, type Snapshot } from '@/lib/use-monitor';
import { describeCameraError, startVision } from '@/lib/vision';
import CameraPanel, { type Camera } from './camera-panel';
import { openMiniMonitor, usePipSupported } from './mini-monitor';
import Onboarding from './onboarding';
import PostureFigure, { HEAD_MAX_DEG, TORSO_MAX_DEG } from './posture-figure';
import { ROUTINES } from '@/lib/routines';
import RoutineRunner from './routine';

const noop = () => () => {};

const SENSITIVITY_NOTE: Record<Sensitivity, string> = {
  gentle: 'Flags only a clear lean held for about 16 seconds.',
  balanced: 'Flags a moderate lean held for about 10 seconds.',
  strict: 'Flags a slight lean held for about 6 seconds.',
};

const CUE_TEXT: Record<Routine, [string, string]> = {
  eye: ['Time for a 20-second eye break.', 'Look at something far away and blink fully.'],
  reset: ['Time for the 60-second desk reset.', 'Neck, shoulders and eyes, guided step by step.'],
};

function statusLine(snap: Snapshot, mode: Mode, cameraOn: boolean, calibrated: boolean, routine: Routine | null) {
  if (routine) return 'Break in progress. The edge glow is paused until you finish.';
  if (mode === 'timer') return 'Timer mode: breaks arrive on schedule. Posture and blinking are not tracked.';
  if (mode === 'camera' && !cameraOn) return 'The camera is off. Start it under Tracking, or switch to timer mode.';
  if (mode === 'camera' && !calibrated) return 'Calibrate once so Niskala knows your upright pose.';
  if (mode === 'camera' && !snap.posture) return 'No face in view. Tracking resumes when you are back.';
  if (snap.glow > 0 && snap.driftFor === 0 && snap.lowBlinkFor === 0) return 'Back on track. The glow fades over a few seconds.';
  if (snap.glow > 0 && snap.postureStrain >= snap.eyeStrain)
    return `The edge is glowing because you have leaned forward for ${duration(snap.driftFor)}. Sit back, or take the 60-second reset.`;
  if (snap.glow > 0)
    return `The edge is glowing because you have blinked ${Math.round(snap.blinkRate ?? 0)} times a minute for ${duration(snap.lowBlinkFor)}. Blink fully a few times or look away.`;
  if (snap.driftFor > 0) return 'Forward lean noticed. The edge only glows if it lasts.';
  if (snap.lowBlinkFor > 0) return 'Blinking has slowed. The edge only glows if it stays low.';
  return 'Upright and blinking normally. Nothing to flag.';
}

function postureWord(drift: number, threshold: number) {
  if (drift < threshold * 0.45) return 'Upright';
  if (drift < threshold) return 'Shifting';
  return 'Leaning forward';
}

function nextBreak(snap: Snapshot) {
  if (snap.cue) return { value: 'Due now', detail: snap.cue === 'eye' ? 'eye break' : 'desk reset' };
  const opts = [
    snap.nextEyeS !== null ? { s: snap.nextEyeS, what: 'eye break' } : null,
    snap.nextResetS !== null ? { s: snap.nextResetS, what: 'desk reset' } : null,
  ].filter((o) => o !== null);
  if (!opts.length) return { value: 'Off', detail: 'no schedule' };
  const n = opts.reduce((a, b) => (b.s < a.s ? b : a));
  return { value: `In ${Math.max(1, Math.ceil(n.s / 60))} min`, detail: n.what };
}

function guidance(snap: Snapshot, bedtime: number) {
  const { stage, minutesToBed } = snap.night;
  if (stage === 'day') return `Warm shift starts at ${hhmm((bedtime + 1440 - 120) % 1440)}, two hours before your ${hhmm(bedtime)} bedtime.`;
  if (stage === 'wind-down')
    return `${minutesToBed} min to bedtime. Finish the task in front of you and leave new ones for tomorrow. Note where you stopped so restarting is quick.`;
  const ran = snap.session ? minutes(snap.session.active_s) : '';
  return `${-minutesToBed} min past your bedtime, ${ran} into this session. Bright screens this late push sleep back. Save your work and stop at the next clean break.`;
}

function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="py-7 first:pt-0" aria-label={title}>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-base">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Seg<T extends string | number>({ name, value, options, onChange }: {
  name: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="seg">
      {options.map(([v, label]) => (
        <label key={String(v)} className="seg-item">
          <input type="radio" name={name} checked={value === v} onChange={() => onChange(v)} className="sr-only" />
          {label}
        </label>
      ))}
    </div>
  );
}

function Slider({ label, value, max, unit, onChange }: {
  label: string;
  value: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-sm">
        {label}
        <span className="tabular-nums text-muted">
          {Math.round(value)}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range mt-1"
      />
    </label>
  );
}

function Readout({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="py-3 pr-4 sm:border-l sm:border-rule sm:pl-4 sm:first:border-l-0 sm:first:pl-0">
      <dt className="label">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold tabular-nums">{value}</dd>
      <dd className="text-[13px] text-muted tabular-nums">{detail}</dd>
    </div>
  );
}

function CueBanner({ cue, onStart, onSnooze }: { cue: Routine; onStart: () => void; onSnooze: () => void }) {
  const [title, body] = CUE_TEXT[cue];
  return (
    <div role="status" className="enter flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-cue bg-raised px-4 py-3">
      <p className="min-w-48 flex-1 text-sm">
        <span className="font-semibold">{title}</span> <span className="text-muted">{body}</span>
      </p>
      <div className="flex items-center gap-3">
        <button type="button" className="btn btn-primary btn-sm" onClick={onStart}>
          Start
        </button>
        <button type="button" className="btn-quiet" onClick={onSnooze}>
          In 5 min
        </button>
      </div>
    </div>
  );
}

export default function Workspace() {
  const prefs = useSyncExternalStore(prefsStore.subscribe, prefsStore.get, prefsStore.server);
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const pipSupported = usePipSupported();
  const [sim, setSim] = useState<Sim>({ head: 0, torso: 0, blink: 16, late: false });
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [camera, setCamera] = useState<Camera>({ state: 'off' });
  const [pip, setPip] = useState<Window | null>(null);
  const [lastBreak, setLastBreak] = useState<string | null>(null);
  const cameraRun = useRef<{ token: number; stop?: () => void }>({ token: 0 });

  const mode = prefs.mode;
  const cameraOn = camera.state === 'on';
  const mon = useMonitor({ mode, cameraOn, sim, prefs, routine, timerWindow: pip });
  const { snap } = mon;
  const calibrated = mon.baseline !== null;
  const update = (p: Partial<Prefs>) => prefsStore.set({ ...prefs, ...p });

  async function startCamera() {
    const token = ++cameraRun.current.token;
    setCamera({ state: 'starting' });
    try {
      const v = await startVision(mon.onSample);
      if (token !== cameraRun.current.token) return v.stop();
      cameraRun.current.stop = v.stop;
      setCamera({ state: 'on', video: v.video });
    } catch (e) {
      if (token === cameraRun.current.token) setCamera({ state: 'error', error: describeCameraError(e) });
    }
  }

  function stopCamera() {
    cameraRun.current.token++;
    cameraRun.current.stop?.();
    cameraRun.current.stop = undefined;
    setCamera({ state: 'off' });
  }

  function setMode(m: Mode) {
    if (m !== 'camera') stopCamera();
    update({ mode: m });
  }

  async function toggleMini() {
    if (pip) return pip.close();
    try {
      const w = await openMiniMonitor();
      w.addEventListener('pagehide', () => setPip(null), { once: true });
      setPip(w);
    } catch {}
  }

  function finishRoutine() {
    if (routine) mon.completeRoutine(routine);
    setLastBreak(snap.night.clock || null);
    setRoutine(null);
  }

  useEffect(() => {
    const run = cameraRun.current;
    return () => run.stop?.();
  }, []);

  useEffect(() => {
    // The video must sit in a visible document for frames to keep flowing while this tab is hidden.
    if (!pip || camera.state !== 'on') return;
    const holder = pip.document.createElement('div');
    holder.className = 'offscreen-video';
    holder.append(camera.video);
    pip.document.body.append(holder);
  }, [pip, camera]);

  useEffect(() => () => pip?.close(), [pip]);

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    const typing = e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"]');
    if (e.metaKey || e.ctrlKey || e.altKey || typing) return;
    if (e.key === 'Escape' && routine) setRoutine(null);
    else if (routine || !prefs.onboarded) return;
    else if (e.key === 'r') setRoutine('reset');
    else if (e.key === 'e') setRoutine('eye');
    else if (e.key === 'm' && pipSupported) toggleMini();
  });
  useEffect(() => {
    const h = (e: KeyboardEvent) => onKey(e);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const S = SENSITIVITY[prefs.sensitivity];
  const warmth = prefs.warmth === 'on' ? 1 : prefs.warmth === 'off' ? 0 : snap.night.level;
  const drift = snap.posture ? Math.max(snap.posture.head, snap.posture.torso) : 0;
  const tracked = mode === 'demo' || (mode === 'camera' && cameraOn);
  const session = snap.session;
  const next = nextBreak(snap);
  const status = statusLine(snap, mode, cameraOn, calibrated, routine);

  const runner = routine && (
    <RoutineRunner
      key={routine}
      kind={routine}
      posture={snap.posture}
      blinkTotal={snap.blinkTotal}
      onDone={finishRoutine}
      onExit={() => setRoutine(null)}
      compact={pip !== null}
    />
  );
  const overlays = (
    <>
      <div aria-hidden className="edge-glow" style={{ opacity: snap.glow }} />
      <div aria-hidden className="edge-cue" style={{ opacity: snap.cue && !routine ? 0.75 : 0 }} />
      <div aria-hidden className="warm-shift" style={{ opacity: warmth * 0.3 }} />
    </>
  );

  if (hydrated && !prefs.onboarded) {
    return (
      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-8">
        <Onboarding prefs={prefs} />
      </main>
    );
  }

  return (
    <>
      {overlays}
      <main className="mx-auto grid max-w-6xl gap-x-12 gap-y-10 px-4 pb-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <section aria-label="Live posture" className="min-w-0 self-start lg:sticky lg:top-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-sm font-medium text-muted">
              {mode === 'camera' ? (cameraOn ? 'Camera, analysed on this device' : 'Camera off') : mode === 'timer' ? 'Timer mode' : 'Demo mode'}
            </h1>
            <div className="flex gap-2">
              {!routine && (
                <button type="button" className="btn btn-sm" onClick={() => setRoutine('reset')}>
                  60-second reset
                </button>
              )}
              {pipSupported && (
                <button type="button" className="btn btn-sm" onClick={toggleMini} aria-pressed={pip !== null}>
                  {pip ? 'Close mini monitor' : 'Mini monitor'}
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-surface">
            <div className="mx-auto aspect-[1150/1180] max-h-[46vh] w-full max-w-xl lg:max-h-[58vh]">
              <PostureFigure posture={tracked ? snap.posture : null} />
            </div>
          </div>

          {routine ? (
            <div className="mt-5">
              {pip ? (
                <p className="text-sm text-muted">The {ROUTINES[routine].title.toLowerCase()} is running in the mini monitor.</p>
              ) : (
                runner
              )}
            </div>
          ) : (
            <>
              <div className="mt-4 space-y-3">
                {snap.cue && (
                  <CueBanner cue={snap.cue} onStart={() => setRoutine(snap.cue)} onSnooze={() => mon.snooze(snap.cue!)} />
                )}
                <p className="min-h-10 text-sm text-pretty">{status}</p>
              </div>
              <dl className="mt-2 grid grid-cols-2 border-t border-rule sm:grid-cols-4">
                <Readout
                  label="Posture"
                  value={tracked && snap.posture ? postureWord(drift, S.drift) : 'Not tracked'}
                  detail={
                    tracked && snap.posture
                      ? `torso ${Math.round(snap.posture.torso * TORSO_MAX_DEG)}°, head ${Math.round(snap.posture.head * HEAD_MAX_DEG)}°`
                      : 'needs camera or demo'
                  }
                />
                <Readout
                  label="Blink rate"
                  value={snap.blinkRate === null ? (tracked ? 'Measuring' : 'Not tracked') : `${Math.round(snap.blinkRate)} / min`}
                  detail={`low below ${S.lowBlink}`}
                />
                <Readout label="Next break" value={next.value} detail={next.detail} />
                <Readout
                  label="This session"
                  value={session ? minutes(session.active_s) : '0 min'}
                  detail={lastBreak ? `last break ${lastBreak}` : `${session?.resets ?? 0} resets, ${session?.eye_breaks ?? 0} eye breaks`}
                />
              </dl>
            </>
          )}
        </section>

        <aside className="divide-y divide-rule">
          <Section title="Tracking">
            <Seg<Mode>
              name="Tracking mode"
              value={mode}
              options={[
                ['camera', 'Camera'],
                ['timer', 'Timer only'],
                ['demo', 'Demo'],
              ]}
              onChange={setMode}
            />
            <div className="mt-5">
              {mode === 'camera' && (
                <CameraPanel
                  camera={camera}
                  onStart={startCamera}
                  onStop={stopCamera}
                  calibrated={calibrated}
                  calibrate={mon.calibrate}
                  previewElsewhere={pip !== null}
                />
              )}
              {mode === 'timer' && (
                <p className="text-sm text-muted">No camera in use. Eye breaks and desk resets follow the schedule below.</p>
              )}
              {mode === 'demo' && (
                <div className="space-y-4">
                  <Slider
                    label="Head forward"
                    value={sim.head * HEAD_MAX_DEG}
                    max={HEAD_MAX_DEG}
                    unit="°"
                    onChange={(v) => setSim({ ...sim, head: v / HEAD_MAX_DEG })}
                  />
                  <Slider
                    label="Torso slouch"
                    value={sim.torso * TORSO_MAX_DEG}
                    max={TORSO_MAX_DEG}
                    unit="°"
                    onChange={(v) => setSim({ ...sim, torso: v / TORSO_MAX_DEG })}
                  />
                  <Slider label="Blink rate" value={sim.blink} max={30} unit=" / min" onChange={(v) => setSim({ ...sim, blink: v })} />
                  <label className="flex items-center gap-3 text-sm">
                    <input type="checkbox" checked={sim.late} onChange={(e) => setSim({ ...sim, late: e.target.checked })} className="check" />
                    Late night (clock set 40 min past bedtime)
                  </label>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-sm text-muted">Show a break cue now:</span>
                    <button type="button" className="btn btn-sm" onClick={() => mon.triggerCue('eye')}>
                      Eye break
                    </button>
                    <button type="button" className="btn btn-sm" onClick={() => mon.triggerCue('reset')}>
                      Desk reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Section>

          <Section title="Breaks">
            <div className="space-y-4">
              <fieldset>
                <legend className="label mb-2">20-second eye break</legend>
                <Seg<number>
                  name="Eye break interval"
                  value={prefs.eyeMin}
                  options={[
                    [20, 'Every 20 min'],
                    [30, '30 min'],
                    [0, 'Off'],
                  ]}
                  onChange={(eyeMin) => update({ eyeMin })}
                />
              </fieldset>
              <fieldset>
                <legend className="label mb-2">60-second desk reset</legend>
                <Seg<number>
                  name="Desk reset interval"
                  value={prefs.resetMin}
                  options={[
                    [30, '30 min'],
                    [50, '50 min'],
                    [60, '60 min'],
                    [0, 'Off'],
                  ]}
                  onChange={(resetMin) => update({ resetMin })}
                />
              </fieldset>
              <div className="flex flex-wrap items-center gap-x-4">
                <label className="flex items-center gap-3 text-sm">
                  <input type="checkbox" className="check" checked={prefs.sound} onChange={(e) => update({ sound: e.target.checked })} />
                  Soft chime for cues
                </label>
                <button type="button" className="btn-quiet" onClick={chime}>
                  Play it
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-sm" disabled={routine !== null} onClick={() => setRoutine('eye')}>
                  Eye break now
                </button>
                <button type="button" className="btn btn-sm" disabled={routine !== null} onClick={() => setRoutine('reset')}>
                  Desk reset now
                </button>
              </div>
            </div>
          </Section>

          <Section title="Evening">
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <label>
                <span className="label block">Bedtime</span>
                <input
                  type="time"
                  value={hhmm(prefs.bedtime)}
                  onChange={(e) => {
                    const m = parseHhmm(e.target.value);
                    if (m !== null) update({ bedtime: m });
                  }}
                  className="field mt-1"
                />
              </label>
              <p>
                <span className="label block">Now</span>
                <span className="mt-1 inline-block py-1.5 tabular-nums">
                  {snap.night.clock || '--:--'}
                  {sim.late && mode === 'demo' && <span className="text-muted"> (simulated)</span>}
                </span>
              </p>
            </div>
            <fieldset className="mt-4">
              <legend className="label mb-2">Warm shift</legend>
              <Seg<Warmth>
                name="Warm shift"
                value={prefs.warmth}
                options={[
                  ['auto', 'By bedtime'],
                  ['on', 'On now'],
                  ['off', 'Off'],
                ]}
                onChange={(warmth) => update({ warmth })}
              />
            </fieldset>
            <p className="mt-4 text-sm text-pretty">{guidance(snap, prefs.bedtime)}</p>
            <p className="mt-2 text-[13px] text-muted">The tint covers Niskala only. Turn on your system night light for the whole screen.</p>
          </Section>

          <Section title="Sensitivity">
            <Seg<Sensitivity>
              name="Sensitivity"
              value={prefs.sensitivity}
              options={[
                ['gentle', 'Gentle'],
                ['balanced', 'Balanced'],
                ['strict', 'Strict'],
              ]}
              onChange={(sensitivity) => update({ sensitivity })}
            />
            <p className="mt-3 text-sm text-muted">{SENSITIVITY_NOTE[prefs.sensitivity]}</p>
          </Section>

          <Section
            title="Your data"
            aside={
              <Link href="/insights" className="link text-sm">
                See your history
              </Link>
            }
          >
            <p className="text-sm text-muted text-pretty">
              Saved in this browser: settings, your calibration and per-session totals. No images or face measurements are
              stored.
            </p>
            {syncConfigured && (
              <div className="mt-4 space-y-1">
                <label className="flex items-center gap-3 text-sm">
                  <input type="checkbox" className="check" checked={prefs.sync} onChange={(e) => update({ sync: e.target.checked })} />
                  Back up session totals and settings (anonymous)
                </label>
                <p className="pl-7 text-[13px] text-muted">
                  {mon.sync.state === 'off' && 'Off. Nothing leaves this browser.'}
                  {mon.sync.state === 'idle' && 'On. The first backup runs within a minute.'}
                  {mon.sync.state === 'ok' && `Backed up at ${new Date(mon.sync.at).toLocaleTimeString()}.`}
                  {mon.sync.state === 'error' && `Backup failed (${mon.sync.message}). Your data is still saved here.`}
                </p>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-x-5">
              <button
                type="button"
                className="btn-quiet"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(new Blob([exportData()], { type: 'application/json' }));
                  a.download = 'niskala-data.json';
                  a.click();
                  URL.revokeObjectURL(a.href);
                }}
              >
                Download my data
              </button>
              <button
                type="button"
                className="btn-quiet"
                onClick={() => {
                  if (!confirm('Delete calibration, settings and saved sessions from this browser?')) return;
                  mon.discardSession();
                  clearAll();
                  location.reload();
                }}
              >
                Delete local data
              </button>
              <button type="button" className="btn-quiet" onClick={() => update({ onboarded: false })}>
                Run setup again
              </button>
            </div>
          </Section>

          <p className="pt-6 text-[13px] text-muted">
            Keys: <kbd className="font-semibold text-ink">R</kbd> desk reset, <kbd className="font-semibold text-ink">E</kbd> eye
            break
            {pipSupported && (
              <>
                , <kbd className="font-semibold text-ink">M</kbd> mini monitor
              </>
            )}
            , <kbd className="font-semibold text-ink">Esc</kbd> stop a break.
          </p>
        </aside>
      </main>

      {pip &&
        createPortal(
          <>
            {overlays}
            <main className="flex h-dvh flex-col gap-3 p-3">
              <div className="min-h-0 flex-1 rounded-xl bg-surface">
                <PostureFigure posture={tracked ? snap.posture : null} />
              </div>
              {runner ||
                (snap.cue ? (
                  <CueBanner cue={snap.cue} onStart={() => setRoutine(snap.cue)} onSnooze={() => mon.snooze(snap.cue!)} />
                ) : (
                  <p className="text-[13px] leading-snug text-pretty">
                    <span className="font-semibold">{tracked && snap.posture ? postureWord(drift, S.drift) : 'Keeping time'}.</span>{' '}
                    <span className="text-muted">
                      {next.value === 'Off' ? 'Break schedule is off.' : `Next ${next.detail}: ${next.value.toLowerCase()}.`}
                    </span>
                  </p>
                ))}
            </main>
          </>,
          pip.document.body,
        )}
    </>
  );
}
