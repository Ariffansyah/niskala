import type { SessionSummary } from './store';

export type Day = {
  key: string; // local YYYY-MM-DD
  date: Date;
  active_s: number;
  slouch_s: number;
  low_blink_s: number;
  late_s: number;
  resets: number;
  eye_breaks: number;
  blink: number | null; // active-time weighted mean
};

const pad = (n: number) => String(n).padStart(2, '0');
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** The last `count` local days ending today, oldest first, with days that have no sessions as zeros. */
export function byDay(sessions: SessionSummary[], count: number, now: Date): Day[] {
  const days: Day[] = [];
  const index = new Map<string, Day & { blinkW: number; blinkT: number }>();
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const d = { key: dayKey(date), date, active_s: 0, slouch_s: 0, low_blink_s: 0, late_s: 0, resets: 0, eye_breaks: 0, blink: null, blinkW: 0, blinkT: 0 };
    index.set(d.key, d);
    days.push(d);
  }
  for (const s of sessions) {
    const d = index.get(dayKey(new Date(s.started_at)));
    if (!d) continue;
    d.active_s += s.active_s;
    d.slouch_s += s.slouch_s;
    d.low_blink_s += s.low_blink_s;
    d.late_s += s.late_s;
    d.resets += s.resets;
    d.eye_breaks += s.eye_breaks;
    if (s.avg_blink !== null) {
      d.blinkW += s.avg_blink * s.active_s;
      d.blinkT += s.active_s;
    }
  }
  return days.map((d) => {
    const { blinkW, blinkT, ...rest } = index.get(d.key)!;
    return { ...rest, blink: blinkT > 0 ? blinkW / blinkT : null };
  });
}

export function totals(days: Day[]) {
  const sum = (f: (d: Day) => number) => days.reduce((a, d) => a + f(d), 0);
  const active = sum((d) => d.active_s);
  const withBlink = days.filter((d) => d.blink !== null);
  return {
    active_s: active,
    slouch_s: sum((d) => d.slouch_s),
    leanShare: active > 0 ? sum((d) => d.slouch_s) / active : 0,
    late_s: sum((d) => d.late_s),
    resets: sum((d) => d.resets),
    eye_breaks: sum((d) => d.eye_breaks),
    activeDays: days.filter((d) => d.active_s > 0).length,
    blink: withBlink.length
      ? withBlink.reduce((a, d) => a + d.blink! * d.active_s, 0) / withBlink.reduce((a, d) => a + d.active_s, 0)
      : null,
  };
}
