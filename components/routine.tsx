'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import { sideWord } from '@/lib/format';
import { ROUTINES, type RoutineKind as Kind } from '@/lib/routines';
import type { Posture } from '@/lib/signals';
import { IconCamera, IconCheck, IconNext, IconPause, IconPlay } from './icons';
import { HEAD_MAX_DEG, TILT_MAX_DEG } from './posture-figure';
import { ProgressRing } from './ui';

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
    feedback = deg <= 3 ? 'Kepala sudah sejajar bahu.' : `Kepala masih ${deg}° ke depan. Tarik sedikit lagi.`;
  } else if (step.check === 'tilt' && posture) {
    const deg = Math.round(posture.tilt * TILT_MAX_DEG);
    feedback = Math.abs(deg) < 4 ? 'Kepala masih tegak. Biarkan miring perlahan.' : `Kepala miring ${Math.abs(deg)}° ke ${sideWord(deg)}.`;
  } else if (step.check === 'blinks' && blinkTotal !== null && stepBlinks.start !== null) {
    feedback = `${blinkTotal - stepBlinks.start} kedipan terhitung.`;
  }

  return (
    <div className={compact ? 'space-y-3' : 'card space-y-5 p-5 sm:p-6'}>
      <div className="flex items-center gap-4 sm:gap-6">
        <ProgressRing value={t / total} size={compact ? 76 : 112}>
          <p className={`${compact ? 'text-lg' : 'text-3xl'} leading-none font-bold tabular-nums`}>{Math.ceil(total - t)}</p>
          <p className="mt-1 text-[11px] text-muted">detik</p>
        </ProgressRing>
        <div className="min-w-0" aria-live="polite">
          <p className="label">
            {title}
            {steps.length > 1 && ` · langkah ${index + 1} dari ${steps.length}`}
          </p>
          <p className={`${compact ? 'text-lg' : 'text-2xl sm:text-3xl'} mt-1 leading-tight font-bold tracking-tight text-balance`}>{cue}</p>
          {!compact && <p className="mt-2 text-sm text-muted text-pretty">{step.how}</p>}
        </div>
      </div>

      {steps.length > 1 && !compact && (
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Langkah">
          {steps.map((s, i) => {
            const done = t >= starts[i] + s.seconds;
            const current = i === index && !done;
            return (
              <li
                key={s.title}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] ${
                  current ? 'border-accent bg-accent-soft font-semibold text-ink' : done ? 'border-rule text-muted' : 'border-rule text-muted'
                }`}
              >
                <span className={`grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${done ? 'bg-accent text-on-accent' : 'bg-surface'}`}>
                  {done ? <IconCheck className="size-3" /> : i + 1}
                </span>
                <span className="leading-tight">{s.title}</span>
              </li>
            );
          })}
        </ol>
      )}

      {feedback && (
        <p className="flex items-center gap-2 text-sm">
          <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
            <IconCamera className="size-3.5" />
          </span>
          {feedback}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={`btn ${compact ? 'btn-sm' : ''}`} onClick={() => setRunning((r) => !r)}>
          {running ? <IconPause className="size-4" /> : <IconPlay className="size-4" />}
          {running ? 'Jeda' : 'Lanjut'}
        </button>
        {steps.length > 1 && (
          <button type="button" className={`btn ${compact ? 'btn-sm' : ''}`} onClick={() => goTo(starts[index] + step.seconds)}>
            <IconNext className="size-4" />
            {index === steps.length - 1 ? 'Selesai' : 'Langkah berikutnya'}
          </button>
        )}
        <button type="button" className={`btn btn-ghost ${compact ? 'btn-sm' : ''}`} onClick={onExit}>
          Hentikan
        </button>
      </div>
    </div>
  );
}
