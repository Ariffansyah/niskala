'use client';

import dynamic from 'next/dynamic';
import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { DRIFT_THRESHOLD, LOW_BLINK_PER_MIN } from '@/lib/signals';
import { clearAll, prefsStore, type Prefs, type Warmth } from '@/lib/store';
import { syncConfigured } from '@/lib/sync';
import { useMonitor, type Sim, type Snapshot, type Source } from '@/lib/use-monitor';
import DeskReset from './desk-reset';
import PostureFigure, { HEAD_MAX_DEG, TORSO_MAX_DEG } from './posture-figure';

const CameraPanel = dynamic(() => import('./camera-panel'), {
  ssr: false,
  loading: () => <p className="text-sm text-muted">Loading the on-device vision module…</p>,
});

const pad = (n: number) => String(n).padStart(2, '0');
const hhmm = (min: number) => `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`;

function duration(s: number) {
  s = Math.floor(s);
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.floor(s / 60)} min ${pad(s % 60)} s`;
  return `${Math.floor(s / 3600)} h ${pad(Math.floor(s / 60) % 60)} min`;
}

function statusLine(snap: Snapshot, source: Source, calibrated: boolean, resetting: boolean) {
  if (resetting) return 'Edge glow is paused while you reset.';
  if (source === 'camera' && !calibrated) return 'Calibrate to start tracking. Until then nothing is flagged.';
  if (source === 'camera' && !snap.posture) return 'No face in view. Tracking resumes when you are back.';
  if (snap.glow > 0 && snap.postureStrain >= snap.eyeStrain)
    return `The edge is glowing because you have leaned forward for ${duration(snap.driftFor)}. Sit back, or take the 60-second reset.`;
  if (snap.glow > 0)
    return `The edge is glowing because you have been blinking ${Math.round(snap.blinkRate ?? 0)} times a minute for ${duration(snap.lowBlinkFor)}. Blink fully a few times or look away.`;
  if (snap.driftFor > 0) return 'Forward lean noticed. The edge only glows if it lasts.';
  if (snap.lowBlinkFor > 0) return 'Blink rate is low. The edge only glows if it stays low.';
  return 'Upright and blinking normally. Nothing to flag.';
}

function postureWord(drift: number) {
  if (drift < 0.15) return 'Upright';
  if (drift < DRIFT_THRESHOLD) return 'Shifting';
  return 'Leaning forward';
}

function guidance(snap: Snapshot, bedtime: number) {
  const { stage, minutesToBed } = snap.night;
  const ran = snap.session ? duration(snap.session.active_s) : '';
  if (stage === 'day') return `Warm shift starts at ${hhmm((bedtime + 1440 - 120) % 1440)}, two hours before your ${hhmm(bedtime)} bedtime.`;
  if (stage === 'wind-down')
    return `${minutesToBed} min to bedtime. Finish the task in front of you and leave new ones for tomorrow. Note where you stopped so restarting is quick.`;
  return `${-minutesToBed} min past your bedtime, ${ran} into this session. Bright screens this late push back sleep. Save your work and stop when you reach a clean break.`;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="py-6 first:pt-0" aria-label={title}>
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Choice<T extends string>({ name, value, options, onChange }: {
  name: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="inline-flex rounded-md border border-edge p-0.5">
      {options.map(([v, label]) => (
        <label key={v} className="choice">
          <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} className="sr-only" />
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
        className="mt-2 w-full accent-accent"
      />
    </label>
  );
}

function Readout({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="py-3 pr-4 sm:border-l sm:border-rule sm:pl-4 sm:first:border-l-0 sm:first:pl-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-lg font-medium tabular-nums">{value}</dd>
      <dd className="text-xs text-muted tabular-nums">{detail}</dd>
    </div>
  );
}

export default function Workspace() {
  const [source, setSource] = useState<Source>('simulation');
  const [sim, setSim] = useState<Sim>({ head: 0, torso: 0, blink: 16, late: false });
  const prefs = useSyncExternalStore(prefsStore.subscribe, prefsStore.get, prefsStore.server);
  const [resetting, setResetting] = useState(false);
  const [lastReset, setLastReset] = useState<string | null>(null);

  const mon = useMonitor({ source, sim, prefs, resetting });
  const { snap } = mon;
  const calibrated = mon.baseline !== null;

  const updatePrefs = (p: Partial<Prefs>) => prefsStore.set({ ...prefs, ...p });

  const warmth = prefs.warmth === 'on' ? 1 : prefs.warmth === 'off' ? 0 : snap.night.level;
  const drift = snap.posture ? Math.max(snap.posture.head, snap.posture.torso) : 0;
  const torsoDeg = (snap.posture?.torso ?? 0) * TORSO_MAX_DEG;
  const headDeg = (snap.posture?.head ?? 0) * HEAD_MAX_DEG;
  const session = snap.session;

  return (
    <>
      <div aria-hidden className="edge-glow" style={{ opacity: snap.glow }} />
      <div aria-hidden className="warm-shift" style={{ opacity: warmth * 0.3 }} />

      <header className="mx-auto flex max-w-6xl flex-wrap items-baseline gap-x-6 gap-y-1 px-4 pt-6 pb-6 sm:px-8 sm:pt-8">
        <h1 className="text-xl font-semibold tracking-tight">Niskala</h1>
        <p className="max-w-xl text-sm text-muted">
          Posture, blink and bedtime cues for long screen sessions. The camera is read inside this tab and never uploaded.
        </p>
      </header>

      <main className="mx-auto grid max-w-6xl gap-x-12 gap-y-10 px-4 pb-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-label="Live posture" className="min-w-0">
          <div className="rounded-lg bg-surface">
            <div className="mx-auto aspect-[560/780] max-h-[48vh] w-full max-w-md lg:max-h-[62vh]">
              <PostureFigure posture={snap.posture} />
            </div>
          </div>
          <p className="mt-4 min-h-10 text-sm text-pretty">
            {statusLine(snap, source, calibrated, resetting)}
          </p>
          <dl className="mt-4 grid grid-cols-2 border-t border-rule sm:grid-cols-4">
            <Readout
              label="Posture"
              value={snap.posture ? postureWord(drift) : 'No reading'}
              detail={`torso ${Math.round(torsoDeg)}°, head ${Math.round(headDeg)}°`}
            />
            <Readout
              label="Blink rate"
              value={snap.blinkRate === null ? 'Measuring' : `${Math.round(snap.blinkRate)} / min`}
              detail={`low below ${LOW_BLINK_PER_MIN}`}
            />
            <Readout
              label="Session"
              value={session ? duration(session.active_s) : '0 s'}
              detail={`${duration(session?.slouch_s ?? 0)} leaning`}
            />
            <Readout
              label="Resets"
              value={String(session?.resets ?? 0)}
              detail={lastReset ? `last at ${lastReset}` : 'none yet'}
            />
          </dl>
        </section>

        <aside className="divide-y divide-rule">
          <Section title="Input">
            <Choice
              name="Input source"
              value={source}
              options={[
                ['simulation', 'Simulation'],
                ['camera', 'Camera'],
              ]}
              onChange={setSource}
            />
            <div className="mt-5">
              {source === 'camera' ? (
                <CameraPanel calibrated={calibrated} onSample={mon.onSample} onBaseline={mon.setBaseline} />
              ) : (
                <div className="space-y-5">
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
                  <Slider
                    label="Blink rate"
                    value={sim.blink}
                    max={30}
                    unit=" / min"
                    onChange={(v) => setSim({ ...sim, blink: v })}
                  />
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={sim.late}
                      onChange={(e) => setSim({ ...sim, late: e.target.checked })}
                      className="size-4 accent-accent"
                    />
                    Late night (clock set 40 min past bedtime)
                  </label>
                  <p className="text-xs text-muted">
                    Same pipeline as the camera: a lean past {Math.round(DRIFT_THRESHOLD * 100)}% of the range has to hold for a
                    few seconds before the edge reacts.
                  </p>
                </div>
              )}
            </div>
          </Section>

          <Section title="60-second reset">
            {resetting ? (
              <DeskReset
                posture={snap.posture}
                blinkTotal={snap.blinkTotal}
                onDone={() => {
                  mon.completeReset();
                  setResetting(false);
                  setLastReset(snap.night.clock || null);
                }}
                onExit={() => setResetting(false)}
              />
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted">
                  Chin tucks, shoulder rolls, a side neck stretch and far-focus blinking, 15 seconds each.
                </p>
                <button type="button" className="btn btn-primary" onClick={() => setResetting(true)}>
                  Start reset
                </button>
              </div>
            )}
          </Section>

          <Section title="Evening">
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <label className="text-sm">
                <span className="block text-muted">Bedtime</span>
                <input
                  type="time"
                  value={hhmm(prefs.bedtime)}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(':').map(Number);
                    if (Number.isFinite(h) && Number.isFinite(m)) updatePrefs({ bedtime: h * 60 + m });
                  }}
                  className="mt-1 rounded-md border border-edge bg-transparent px-2 py-1 tabular-nums"
                />
              </label>
              <p className="text-sm">
                <span className="block text-muted">Now</span>
                <span className="mt-1 inline-block py-1 tabular-nums">
                  {snap.night.clock || '--:--'}
                  {sim.late && ' (simulated)'}
                </span>
              </p>
            </div>
            <div className="mt-5">
              <p className="mb-2 text-sm text-muted">Warm shift</p>
              <Choice<Warmth>
                name="Warm shift"
                value={prefs.warmth}
                options={[
                  ['auto', 'By bedtime'],
                  ['on', 'On now'],
                  ['off', 'Off'],
                ]}
                onChange={(warmth) => updatePrefs({ warmth })}
              />
            </div>
            <p className="mt-4 text-sm text-pretty">{guidance(snap, prefs.bedtime)}</p>
            <p className="mt-2 text-xs text-muted">
              The tint covers this tab only. For the whole screen, turn on your system night light too.
            </p>
          </Section>

          <Section title="Your data">
            <p className="text-sm text-muted text-pretty">
              Kept in this browser: preferences, your calibration and per-session totals (time, resets, time leaning,
              average blink rate). No images or face measurements are saved.
            </p>
            {syncConfigured ? (
              <div className="mt-4 space-y-2">
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={prefs.sync}
                    onChange={(e) => updatePrefs({ sync: e.target.checked })}
                    className="size-4 accent-accent"
                  />
                  Back up session totals and settings (anonymous)
                </label>
                <p className="text-xs text-muted">
                  {mon.sync.state === 'off' && 'Off. Nothing leaves this browser.'}
                  {mon.sync.state === 'idle' && 'On. The first backup runs within a minute.'}
                  {mon.sync.state === 'ok' && `Backed up at ${new Date(mon.sync.at).toLocaleTimeString()}.`}
                  {mon.sync.state === 'error' && `Backup failed (${mon.sync.message}). Your data is still saved here.`}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-xs text-muted">Cloud backup is not set up for this deployment.</p>
            )}
            <button
              type="button"
              className="btn-quiet mt-4"
              onClick={() => {
                if (!confirm('Delete calibration, preferences and saved sessions from this browser?')) return;
                mon.discardSession();
                clearAll();
                location.reload();
              }}
            >
              Delete local data
            </button>
          </Section>
        </aside>
      </main>
    </>
  );
}
