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

export function StatCard({ icon: Icon, label, value, detail, tone }: {
  icon: IconType;
  label: string;
  value: string;
  detail?: string;
  tone?: 'alert';
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-[13px] text-muted">
        <span className={`grid size-7 place-items-center rounded-lg ${tone === 'alert' ? 'bg-alert/15 text-alert-ink' : 'bg-surface text-accent'}`}>
          <Icon className="size-4" />
        </span>
        {label}
      </div>
      <p className="mt-3 text-xl font-bold tracking-tight tabular-nums">{value}</p>
      {detail && <p className="mt-0.5 text-[13px] text-muted tabular-nums">{detail}</p>}
    </div>
  );
}
