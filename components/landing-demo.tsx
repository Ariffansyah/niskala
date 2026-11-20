'use client';

import { useEffect, useState } from 'react';
import { sideWord } from '@/lib/format';
import { UPRIGHT } from '@/lib/signals';
import { IconLean, IconPosture } from './icons';
import PostureFigure, { FrontFigure, HEAD_MAX_DEG, SIDE_MAX_DEG, TORSO_MAX_DEG } from './posture-figure';

const THRESHOLD = 45;
// Shorter than the workspace's ~10 s so the effect shows up while someone is reading the page.
const HOLD_MS = 1500;

export default function LandingDemo() {
  const [slouch, setSlouch] = useState(0);
  const [lean, setLean] = useState(0);
  const [glow, setGlow] = useState(false);
  const off = Math.max(slouch, Math.abs(lean)) >= THRESHOLD;

  useEffect(() => {
    if (!off) return;
    const id = setTimeout(() => setGlow(true), HOLD_MS);
    return () => clearTimeout(id);
  }, [off]);

  const posture = {
    ...UPRIGHT,
    torso: slouch / 100,
    head: Math.min(1, (slouch / 100) * 1.15),
    side: lean / 100,
    tilt: (lean / 100) * 0.6,
  };
  const torsoDeg = Math.round(posture.torso * TORSO_MAX_DEG);
  const headDeg = Math.round(posture.head * HEAD_MAX_DEG);
  const sideDeg = Math.abs(Math.round(posture.side * SIDE_MAX_DEG));
  const change = (set: (n: number) => void, other: number) => (n: number) => {
    set(n);
    if (Math.max(Math.abs(n), Math.abs(other)) < THRESHOLD) setGlow(false);
  };

  return (
    <figure className="relative min-w-0">
      <div aria-hidden className="edge-glow" style={{ opacity: glow ? 0.8 : 0 }} />
      <div className="stage card relative overflow-hidden">
        <div className="mx-auto aspect-[1150/1180] max-h-[62vh] w-full">
          <PostureFigure posture={posture} />
        </div>
        <span className="chip absolute top-3 left-3">Tampak samping</span>
        <div className="card absolute top-3 right-3 w-[30%] p-1.5">
          <div className="aspect-[560/760] rounded-xl bg-surface">
            <FrontFigure posture={posture} />
          </div>
          <p className="mt-1 text-center text-[11px] font-semibold text-muted">Tampak depan</p>
        </div>
      </div>

      <div className="float-card absolute top-[38%] -left-8 hidden w-44 xl:block" aria-hidden>
        <p className="flex items-center gap-2 text-[12px] font-semibold text-muted">
          <IconPosture className="size-4 text-accent" /> Punggung
        </p>
        <p className="mt-1 text-2xl font-extrabold tracking-tight tabular-nums">{torsoDeg}°</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-rule">
          <div
            className={`h-full origin-left rounded-full transition-transform duration-300 ${slouch >= THRESHOLD ? 'bg-alert' : 'bg-accent'}`}
            style={{ transform: `scaleX(${Math.max(0.03, slouch / 100)})` }}
          />
        </div>
      </div>
      <div className="float-card absolute -right-6 bottom-[34%] hidden w-48 xl:block" aria-hidden>
        <p className="flex items-center gap-2 text-[12px] font-semibold text-muted">
          <IconLean className="size-4 text-accent" /> Pendar tepi
        </p>
        <p className={`mt-1 flex items-center gap-2 text-lg font-extrabold ${glow ? 'text-alert-ink' : ''}`}>
          <span className={`size-2.5 rounded-full ${glow ? 'bg-alert' : 'bg-edge'}`} />
          {glow ? 'Menyala' : off ? 'Menunggu…' : 'Padam'}
        </p>
      </div>

      <figcaption className="card mt-3 space-y-3 p-4">
        <label className="block">
          <span className="flex justify-between gap-4 text-sm">
            <span className="font-semibold">Geser untuk membungkuk</span>
            <span className="tabular-nums text-muted">
              punggung {torsoDeg}°, kepala {headDeg}°
            </span>
          </span>
          <input type="range" min={0} max={100} value={slouch} onChange={(e) => change(setSlouch, lean)(Number(e.target.value))} className="range mt-1" />
        </label>
        <label className="block">
          <span className="flex justify-between gap-4 text-sm">
            <span className="font-semibold">Geser untuk miring</span>
            <span className="tabular-nums text-muted">{lean === 0 ? 'tegak' : `${sideDeg}° ke ${sideWord(lean)}`}</span>
          </span>
          <input type="range" min={-100} max={100} value={lean} onChange={(e) => change(setLean, slouch)(Number(e.target.value))} className="range mt-1" />
        </label>
        <p className="min-h-10 text-sm text-muted text-pretty" aria-live="polite">
          {glow
            ? 'Pendar hangat di tepi itulah seluruh peringatannya. Tegakkan lagi, dan pendarnya memudar.'
            : off
              ? 'Tahan sebentar di posisi itu.'
              : 'Di ruang kerja, webcam-mu yang menggerakkan figur ini, dan tepi layar baru berpendar kalau posisi buruk bertahan lama.'}
        </p>
      </figcaption>
    </figure>
  );
}
