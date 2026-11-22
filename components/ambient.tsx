import type { CSSProperties } from 'react';

// Slow background motion for the landing page: kawung outlines by day, stars by night. Decorative only,
// pure CSS, and still for anyone who asks for reduced motion (see .drift and .twinkle in globals.css).

type Spot = { top: string; left?: string; right?: string; size: string; turn: number; float: number };

// The logo's petals, outlined; the lit one keeps a faint kunyit fill.
const PETALS = [
  'M16.84 16.84A7.23 7.23 0 0 1 25.82 25.82A7.23 7.23 0 0 1 16.84 16.84Z',
  'M15.16 16.84A7.23 7.23 0 0 1 6.18 25.82A7.23 7.23 0 0 1 15.16 16.84Z',
  'M15.16 15.16A7.23 7.23 0 0 1 6.18 6.18A7.23 7.23 0 0 1 15.16 15.16Z',
];
const LIT = 'M16.84 15.16A7.23 7.23 0 0 1 25.82 6.18A7.23 7.23 0 0 1 16.84 15.16Z';

/** A few large kawung that turn and float slowly behind a light section, bleeding past its edges to the window's. */
export function Drift({ spots }: { spots: Spot[] }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 overflow-hidden">
      {spots.map((s, i) => (
        <div
          key={i}
          className="drift"
          style={{ top: s.top, left: s.left, right: s.right, width: s.size, '--turn': `${s.turn}s`, '--float': `${s.float}s` } as CSSProperties}
        >
          <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2" className="size-full" style={{ animationDirection: i % 2 ? 'reverse' : 'normal' }}>
            {PETALS.map((d) => (
              <path key={d} d={d} vectorEffect="non-scaling-stroke" />
            ))}
            <path d={LIT} vectorEffect="non-scaling-stroke" fill="var(--kunyit)" fillOpacity="0.5" />
          </svg>
        </div>
      ))}
    </div>
  );
}

// Park-Miller steps stay exact in doubles, so the server and every browser place the same stars.
function* lcg(seed: number) {
  for (;;) yield (seed = (seed * 16807) % 2147483647) / 2147483647;
}
const r = lcg(20271);
const next = () => r.next().value as number;
const STARS = Array.from({ length: 34 }, () => ({
  x: Math.round(next() * 1000) / 10,
  y: Math.round(next() * 1000) / 10,
  size: next() < 0.2 ? 3 : 2,
  period: Math.round(30 + next() * 40) / 10,
  delay: -Math.round(next() * 60) / 10,
}));

/** Sparse stars that twinkle out of step. The parent sets where they sit and how visible they are. */
export function Stars({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-x-0 ${className}`} style={style}>
      {STARS.map((s, i) => (
        <span
          key={i}
          className="twinkle absolute rounded-full bg-on-band"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, animationDuration: `${s.period}s`, animationDelay: `${s.delay}s` }}
        />
      ))}
    </div>
  );
}
