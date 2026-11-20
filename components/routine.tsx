'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import type { Posture } from '@/lib/signals';
import { ROUTINES, type RoutineKind as Kind } from '@/lib/routines';
import { HEAD_MAX_DEG } from './posture-figure';

export default function RoutineRunner({ kind, posture, blinkTotal, onDone, onExit, compact = false }: {
  kind: Kind;
  posture: Posture | null;
  blinkTotal: number | null;
  onDone: () => void;
  onExit: () => void;
  compact?: boolean;
}) {
  const { title, steps } = ROUTINES[kind];
  const starts = steps.map((_, i) => steps.slice(0, i).reduce((a, s) => a + s.seconds, 0));
  const total = steps.reduce((a, s) => a + s.seconds, 0);

  const [t, setT] = useState(0);
  const [running, setRunning] = useState(true);
  const [stepBlinks, setStepBlinks] = useState<{ index: number; start: number | null }>({ index: 0, start: blinkTotal });

  const index = Math.max(0, starts.findLastIndex((s) => t >= s));
  const step = steps[index];
  const inStep = t - starts[index];
  const cue = step.cues[Math.min(step.cues.length - 1, Math.floor(inStep / (step.seconds / step.cues.length)))];

  const goTo = (next: number) => {
    if (t >= total) return;
    next = Math.min(total, next);
    const nextIndex = Math.max(0, starts.findLastIndex((s) => next >= s));
    if (nextIndex !== stepBlinks.index) setStepBlinks({ index: nextIndex, start: blinkTotal });
    setT(next);
    if (next >= total) onDone();
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
  if (step.check === 'head' && posture) {
    const deg = Math.round(posture.head * HEAD_MAX_DEG);
    feedback = deg <= 3 ? 'Head is back over your shoulders.' : `Head is ${deg}° forward. Draw it back a little more.`;
  } else if (step.check === 'blinks' && blinkTotal !== null && stepBlinks.start !== null) {
    const n = blinkTotal - stepBlinks.start;
    feedback = `${n} ${n === 1 ? 'blink' : 'blinks'} counted.`;
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-5'}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm text-muted" aria-live="polite">
          {steps.length > 1 ? `Step ${index + 1} of ${steps.length}: ` : `${title}: `}
          <span className="font-semibold text-ink">{step.title}</span>
        </p>
        <p className="text-sm tabular-nums text-muted">{Math.ceil(total - t)} s</p>
      </div>

      <ol className="flex gap-1.5" aria-label={`${title} progress`}>
        {steps.map((s, i) => {
          const fill = Math.min(1, Math.max(0, (t - starts[i]) / s.seconds));
          return (
            <li key={s.title} className="h-1.5 overflow-hidden rounded-full bg-rule" style={{ flexGrow: s.seconds }}>
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
        <p className={`${compact ? 'text-lg' : 'text-2xl sm:text-3xl'} font-semibold tracking-tight text-balance`}>{cue}</p>
        {!compact && <p className="mt-2 text-sm text-muted">{step.how}</p>}
        {feedback && <p className="mt-2 text-sm">{feedback}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={`btn ${compact ? 'btn-sm' : ''}`} onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause' : 'Resume'}
        </button>
        {steps.length > 1 && (
          <button type="button" className={`btn ${compact ? 'btn-sm' : ''}`} onClick={() => goTo(starts[index] + step.seconds)}>
            {index === steps.length - 1 ? 'Finish' : 'Next step'}
          </button>
        )}
        <button type="button" className="btn-quiet ml-1" onClick={onExit}>
          Stop
        </button>
      </div>
    </div>
  );
}
