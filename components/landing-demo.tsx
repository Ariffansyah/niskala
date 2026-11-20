'use client';

import { useEffect, useState } from 'react';
import PostureFigure, { HEAD_MAX_DEG, TORSO_MAX_DEG } from './posture-figure';

const THRESHOLD = 45;
// Shorter than the workspace's ~10 s so the effect shows up while someone is reading the page.
const HOLD_MS = 1500;

export default function LandingDemo() {
  const [v, setV] = useState(0);
  const [glow, setGlow] = useState(false);
  const leaning = v >= THRESHOLD;

  useEffect(() => {
    if (!leaning) return;
    const id = setTimeout(() => setGlow(true), HOLD_MS);
    return () => clearTimeout(id);
  }, [leaning]);

  const posture = { torso: v / 100, head: Math.min(1, (v / 100) * 1.15) };
  return (
    <figure className="min-w-0">
      <div aria-hidden className="edge-glow" style={{ opacity: glow ? 0.8 : 0 }} />
      <div className="rounded-3xl bg-surface p-2">
        <div className="mx-auto aspect-[1150/1180] max-h-[64vh] w-full">
          <PostureFigure posture={posture} />
        </div>
      </div>
      <figcaption className="mt-4 px-1">
        <label className="block">
          <span className="flex justify-between gap-4 text-sm">
            <span className="font-semibold">Drag to slouch</span>
            <span className="tabular-nums text-muted">
              torso {Math.round(posture.torso * TORSO_MAX_DEG)}°, head {Math.round(posture.head * HEAD_MAX_DEG)}°
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={v}
            onChange={(e) => {
              const n = Number(e.target.value);
              setV(n);
              if (n < THRESHOLD) setGlow(false);
            }}
            className="range mt-1"
          />
        </label>
        <p className="mt-1 min-h-12 text-sm text-muted text-pretty" aria-live="polite">
          {glow
            ? 'That warm edge is the whole alert. Sit the figure back up and it fades.'
            : leaning
              ? 'Hold it there for a moment.'
              : 'In the workspace your webcam drives this figure, and the edge glows only when a lean lasts.'}
        </p>
      </figcaption>
    </figure>
  );
}
