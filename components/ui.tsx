import type { ComponentType, ReactNode, SVGProps } from 'react';

// Presentational pieces with no hooks, usable from server and client components alike.
type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export function Badge({ tone = 'neutral', live = false, icon: Icon, children }: {
  tone?: 'neutral' | 'accent' | 'alert';
  /** A dot, only for a real live state such as the camera running. */
  live?: boolean;
  icon?: IconType;
  children: ReactNode;
}) {
  return (
    <span className={`badge badge-${tone}`}>
      {live && <span className="live-dot" aria-hidden />}
      {Icon && <Icon className="size-3.5" />}
      {children}
    </span>
  );
}

export function Meter({ label, value, threshold, hint }: { label: string; value: number; threshold: number; hint: string }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-[13px] text-muted tabular-nums">{hint}</span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="relative mt-2 h-2 overflow-hidden rounded-full bg-rule"
      >
        <div
          className={`h-full origin-left rounded-full transition-transform duration-300 ease-linear ${value >= threshold ? 'bg-alert' : 'bg-accent'}`}
          style={{ transform: `scaleX(${Math.max(0.02, value)})` }}
        />
        <span className="absolute inset-y-0 w-0.5 bg-ink/40" style={{ left: `${threshold * 100}%` }} aria-hidden />
      </div>
    </div>
  );
}

export function ProgressRing({ value, children, size = 120 }: { value: number; children: ReactNode; size?: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="8" className="stroke-rule" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className="stroke-accent transition-[stroke-dashoffset] duration-100 ease-linear"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value)}
        />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  );
}

/** One-line readout: label on the left, value on the right, detail inline rather than stacked. */
export function Stat({ icon: Icon, label, value, detail, tone, hue = 'hue-nila' }: {
  icon: IconType;
  label: string;
  value: string;
  detail?: string;
  tone?: 'alert';
  /** The topic's dye (see .hue-* in globals.css); strain overrides it. */
  hue?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${tone === 'alert' ? 'bg-alert/15 text-alert-ink' : `${hue} bg-hue-soft text-hue-ink`}`}>
        <Icon className="size-4" />
      </span>
      <span className="text-muted">{label}</span>
      <span className="ml-auto text-right">
        <span className={`font-bold tabular-nums ${tone === 'alert' ? 'text-alert-ink' : ''}`}>{value}</span>
        {detail && <span className="ml-2 text-muted tabular-nums">{detail}</span>}
      </span>
    </div>
  );
}
