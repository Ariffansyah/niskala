'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import type { Posture } from '@/lib/signals';
import { HEAD_MAX_DEG } from './posture-figure';

const STEP_S = 15;
const STEPS = [
  {
    title: 'Chin tucks',
    how: 'Keep your eyes level and glide your chin straight back, as if making a double chin.',
    cues: ['Chin back, hold', 'Release', 'Chin back, hold', 'Release', 'Chin back, hold', 'Release'],
  },
  {
    title: 'Shoulder rolls',
    how: 'Slow circles: lift toward your ears, squeeze back, drop down.',
    cues: ['Up', 'Back', 'Down', 'Up', 'Back', 'Down', 'Up', 'Back', 'Down'],
  },
  {
    title: 'Side neck stretch',
    how: 'Shoulders stay down. Let your head tip sideways under its own weight.',
    cues: ['Left ear toward left shoulder', 'Right ear toward right shoulder'],
  },
  {
    title: 'Far focus and full blinks',
    how: 'Look at the farthest thing you can see, ideally 6 m or more away. Close your eyes fully on each blink.',
    cues: ['Look far away', 'Blink fully, slowly', 'Look far away', 'Blink fully, slowly'],
  },
];
const TOTAL_S = STEP_S * STEPS.length;
const EYE_STEP = 3;

export default function DeskReset({ posture, blinkTotal, onDone, onExit }: {
  posture: Posture | null;
  blinkTotal: number | null;
  onDone: () => void;
  onExit: () => void;
}) {
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(true);
  const [eyeStartBlinks, setEyeStartBlinks] = useState<number | null>(null);

  const index = Math.min(STEPS.length - 1, Math.floor(t / STEP_S));
  const step = STEPS[index];
  const inStep = t - index * STEP_S;
  const cue = step.cues[Math.min(step.cues.length - 1, Math.floor(inStep / (STEP_S / step.cues.length)))];

  const goTo = (next: number) => {
    if (t >= TOTAL_S) return;
    next = Math.min(TOTAL_S, next);
    if (t < EYE_STEP * STEP_S && next >= EYE_STEP * STEP_S) setEyeStartBlinks(blinkTotal);
    setT(next);
    if (next >= TOTAL_S) onDone();
  };
  const advance = useEffectEvent((dt: number) => goTo(t + dt));

  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      advance((now - last) / 1000);
      last = now;
    }, 100);
    return () => clearInterval(id);
  }, [running]);

  let feedback: string | null = null;
  if (index === 0 && posture) {
    const deg = Math.round(posture.head * HEAD_MAX_DEG);
    feedback = deg <= 3 ? 'Head is back over your shoulders.' : `Head is ${deg}° forward of your upright pose. Draw it back a little more.`;
  } else if (index === EYE_STEP && blinkTotal !== null && eyeStartBlinks !== null) {
    const n = blinkTotal - eyeStartBlinks;
    feedback = `${n} ${n === 1 ? 'blink' : 'blinks'} counted. Aim for 8 or more.`;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm text-muted" aria-live="polite">
          Step {index + 1} of {STEPS.length}: <span className="text-ink">{step.title}</span>
        </p>
        <p className="text-sm tabular-nums text-muted">{Math.ceil(TOTAL_S - t)} s left</p>
      </div>

      <ol className="grid grid-cols-4 gap-1.5" aria-label="Reset progress">
        {STEPS.map((s, i) => {
          const fill = Math.min(1, Math.max(0, (t - i * STEP_S) / STEP_S));
          return (
            <li key={s.title} className="h-1.5 overflow-hidden rounded-full bg-rule">
              <span className="sr-only">{`${s.title}: ${fill === 1 ? 'done' : i === index ? 'in progress' : 'up next'}`}</span>
              <div
                className="h-full origin-left bg-accent transition-transform duration-100 ease-linear"
                style={{ transform: `scaleX(${fill})` }}
              />
            </li>
          );
        })}
      </ol>

      <div>
        <p className="text-2xl font-medium tracking-tight text-balance">{cue}</p>
        <p className="mt-2 text-sm text-muted">{step.how}</p>
        {feedback && <p className="mt-3 text-sm">{feedback}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause' : 'Resume'}
        </button>
        <button type="button" className="btn" onClick={() => goTo((index + 1) * STEP_S)}>
          {index === STEPS.length - 1 ? 'Finish' : 'Next step'}
        </button>
        <button type="button" className="btn-quiet" onClick={onExit}>
          Stop without finishing
        </button>
      </div>
    </div>
  );
}
