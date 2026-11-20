'use client';

import { useState } from 'react';
import { prefsStore, type Mode, type Prefs } from '@/lib/store';
import { hhmm, parseHhmm } from '@/lib/format';
import PostureFigure from './posture-figure';

const MODES: { value: Mode; title: string; body: string }[] = [
  {
    value: 'camera',
    title: 'Camera',
    body: 'Tracks posture and blinking. Video is analysed inside this tab and never uploaded.',
  },
  {
    value: 'timer',
    title: 'Timer only',
    body: 'No camera. Eye breaks and desk resets arrive on a schedule.',
  },
  {
    value: 'demo',
    title: 'Demo',
    body: 'Sliders stand in for the camera, to see how everything responds.',
  },
];

function Option({ name, checked, onChange, title, body }: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  body: string;
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-xl border border-rule bg-raised p-4 transition-colors hover:border-edge has-checked:border-accent has-checked:shadow-[inset_0_0_0_1px_var(--accent)] has-focus-visible:outline-2 has-focus-visible:outline-accent">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="check mt-1" />
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted">{body}</span>
      </span>
    </label>
  );
}

export default function Onboarding({ prefs }: { prefs: Prefs }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Prefs>({ ...prefs, mode: 'camera' });
  const set = (p: Partial<Prefs>) => setDraft({ ...draft, ...p });
  const finish = (p: Prefs) => prefsStore.set({ ...p, onboarded: true });

  const steps = [
    {
      title: 'How should Niskala keep watch?',
      body: (
        <div className="grid gap-3">
          {MODES.map((m) => (
            <Option key={m.value} name="mode" checked={draft.mode === m.value} onChange={() => set({ mode: m.value })} title={m.title} body={m.body} />
          ))}
        </div>
      ),
    },
    {
      title: 'When do you usually go to sleep?',
      body: (
        <div className="space-y-4">
          <label className="block">
            <span className="label block">Bedtime</span>
            <input
              type="time"
              value={hhmm(draft.bedtime)}
              onChange={(e) => {
                const m = parseHhmm(e.target.value);
                if (m !== null) set({ bedtime: m });
              }}
              className="field mt-1 text-lg"
            />
          </label>
          <p className="text-sm text-muted text-pretty">
            Two hours before this, the page starts to warm and Niskala suggests wrapping up instead of starting new work.
          </p>
        </div>
      ),
    },
    {
      title: 'How often should breaks come?',
      body: (
        <div className="space-y-5">
          <fieldset>
            <legend className="label mb-2">20-second eye break (the 20-20-20 rule)</legend>
            <div className="seg">
              {[
                [20, 'Every 20 min'],
                [30, 'Every 30 min'],
                [0, 'Off'],
              ].map(([v, l]) => (
                <label key={v} className="seg-item">
                  <input type="radio" name="eye" className="sr-only" checked={draft.eyeMin === v} onChange={() => set({ eyeMin: v as number })} />
                  {l}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label mb-2">60-second desk reset</legend>
            <div className="seg">
              {[
                [30, '30 min'],
                [50, '50 min'],
                [60, '60 min'],
                [0, 'Off'],
              ].map(([v, l]) => (
                <label key={v} className="seg-item">
                  <input type="radio" name="reset" className="sr-only" checked={draft.resetMin === v} onChange={() => set({ resetMin: v as number })} />
                  {l}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" className="check" checked={draft.sound} onChange={(e) => set({ sound: e.target.checked })} />
            Play a soft chime when a break is due
          </label>
        </div>
      ),
    },
  ];
  const last = step === steps.length - 1;

  return (
    <section aria-labelledby="setup-title" className="grid items-center gap-10 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <div className="mx-auto hidden aspect-square w-full max-w-lg rounded-2xl bg-surface lg:block">
        <PostureFigure posture={{ head: 0, torso: 0 }} />
      </div>
      <div className="enter" key={step}>
        <p className="label">
          Setup, {step + 1} of {steps.length}
        </p>
        <h1 id="setup-title" className="mt-1 mb-6 text-3xl">
          {steps[step].title}
        </h1>
        {steps[step].body}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {step > 0 && (
            <button type="button" className="btn" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={() => (last ? finish(draft) : setStep(step + 1))}>
            {last ? 'Open the workspace' : 'Continue'}
          </button>
          <button type="button" className="btn-quiet ml-auto" onClick={() => finish(prefs)}>
            Skip, use defaults
          </button>
        </div>
        <p className="mt-6 text-xs text-muted">Everything here can be changed later in the workspace.</p>
      </div>
    </section>
  );
}
