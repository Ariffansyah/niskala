'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { minutes } from '@/lib/format';
import { byDay, totals, type Day } from '@/lib/insights';
import { exportData, sessionsStore } from '@/lib/store';

const noop = () => () => {};
const RANGES = [7, 14, 30] as const;
const SOURCE: Record<string, string> = { camera: 'Camera', timer: 'Timer', simulation: 'Demo' };

const dayLabel = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

function download() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([exportData()], { type: 'application/json' }));
  a.download = 'niskala-data.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="border-t border-rule pt-3">
      <dt className="label">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
      {detail && <dd className="text-[13px] text-muted">{detail}</dd>}
    </div>
  );
}

function Chart({ days }: { days: Day[] }) {
  const max = Math.max(...days.map((d) => d.active_s), 1);
  const every = days.length > 14 ? 5 : 1;
  return (
    <figure>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <span className="font-semibold">Minutes at the screen each day, and how many were spent leaning</span>
        <span className="flex gap-4 text-[13px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-accent" /> upright
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-alert" /> leaning forward
          </span>
        </span>
      </figcaption>
      <div className="mt-2 text-right text-[13px] text-muted tabular-nums" aria-hidden>
        {minutes(max)}
      </div>
      <ol className="flex h-48 items-end gap-[3px] border-b border-edge sm:gap-1.5" aria-hidden>
        {days.map((d) => {
          const h = (d.active_s / max) * 100;
          const lean = d.active_s ? (d.slouch_s / d.active_s) * 100 : 0;
          return (
            <li key={d.key} className="flex h-full flex-1 flex-col justify-end" title={`${dayLabel(d.date)}: ${minutes(d.active_s)}, ${pct(d.slouch_s, d.active_s)}% leaning`}>
              <div className="flex flex-col overflow-hidden rounded-t-[3px]" style={{ height: `${h}%` }}>
                <div className="flex-1 bg-accent" />
                <div className="bg-alert" style={{ height: `${lean}%` }} />
              </div>
            </li>
          );
        })}
      </ol>
      <ol className="mt-1.5 flex gap-[3px] text-center text-[11px] text-muted tabular-nums sm:gap-1.5" aria-hidden>
        {days.map((d, i) => (
          <li key={d.key} className="flex-1">
            {(days.length - 1 - i) % every === 0 ? d.date.getDate() : ''}
          </li>
        ))}
      </ol>
      <table className="sr-only">
        <caption>Daily screen time and time spent leaning forward</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Screen time</th>
            <th>Leaning forward</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.key}>
              <td>{dayLabel(d.date)}</td>
              <td>{minutes(d.active_s)}</td>
              <td>{minutes(d.slouch_s)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export default function InsightsView() {
  const sessions = useSyncExternalStore(sessionsStore.subscribe, sessionsStore.get, sessionsStore.server);
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const [range, setRange] = useState<(typeof RANGES)[number]>(14);

  if (!hydrated) return <p className="py-10 text-muted">Reading your history from this browser…</p>;

  const days = byDay(sessions, range, new Date());
  const t = totals(days);
  const active = days.filter((d) => d.active_s >= 600);
  const best = active.length > 1 ? active.reduce((a, b) => (b.slouch_s / b.active_s < a.slouch_s / a.active_s ? b : a)) : null;

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl">Your last {range} days</h1>
          <p className="mt-2 text-muted">From sessions saved in this browser. Nothing here was sent anywhere.</p>
        </div>
        <div role="radiogroup" aria-label="Range" className="seg">
          {RANGES.map((r) => (
            <label key={r} className="seg-item">
              <input type="radio" name="range" className="sr-only" checked={range === r} onChange={() => setRange(r)} />
              {r} days
            </label>
          ))}
        </div>
      </div>

      {t.activeDays === 0 ? (
        <div className="rounded-2xl bg-surface p-8 sm:p-10">
          <h2 className="text-xl">No sessions in this range yet</h2>
          <p className="mt-2 max-w-lg text-muted">
            Sessions longer than 30 seconds in the workspace are saved here automatically, in any mode.
          </p>
          <Link href="/app" className="btn btn-primary mt-6">
            Open the workspace
          </Link>
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-5">
            <Stat label="Screen time" value={minutes(t.active_s)} detail={`over ${t.activeDays} ${t.activeDays === 1 ? 'day' : 'days'}`} />
            <Stat label="Leaning forward" value={`${Math.round(t.leanShare * 100)}%`} detail={`${minutes(t.slouch_s)} in total`} />
            <Stat label="Breaks taken" value={String(t.resets + t.eye_breaks)} detail={`${t.resets} resets, ${t.eye_breaks} eye breaks`} />
            <Stat label="Average blink rate" value={t.blink === null ? 'None yet' : `${Math.round(t.blink)} / min`} detail="when measured" />
            <Stat label="After bedtime" value={minutes(t.late_s)} detail="including wind-down" />
          </dl>

          <Chart days={days} />

          {best && (
            <p className="max-w-2xl text-pretty">
              Your most upright day was <strong>{dayLabel(best.date)}</strong>, leaning for {pct(best.slouch_s, best.active_s)}% of{' '}
              {minutes(best.active_s)}.
            </p>
          )}

          <section>
            <h2 className="text-xl">Recent sessions</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-sm tabular-nums">
                <thead className="text-muted">
                  <tr className="border-b border-rule">
                    <th className="py-2 pr-4 font-medium">Started</th>
                    <th className="py-2 pr-4 font-medium">Length</th>
                    <th className="py-2 pr-4 font-medium">Leaning</th>
                    <th className="py-2 pr-4 font-medium">Breaks</th>
                    <th className="py-2 font-medium">Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(0, 12).map((s) => (
                    <tr key={s.id} className="border-b border-rule">
                      <td className="py-2.5 pr-4">
                        {new Date(s.started_at).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 pr-4">{minutes(s.active_s)}</td>
                      <td className="py-2.5 pr-4">{pct(s.slouch_s, s.active_s)}%</td>
                      <td className="py-2.5 pr-4">{s.resets + s.eye_breaks}</td>
                      <td className="py-2.5 text-muted">{SOURCE[s.source] ?? s.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <p className="text-sm text-muted">
        <button type="button" className="btn-quiet" onClick={download}>
          Download all my data (JSON)
        </button>
      </p>
    </div>
  );
}
