import type { Checkin, SessionSummary } from './store';

export type Day = {
  key: string; // local YYYY-MM-DD
  date: Date;
  active_s: number;
  tracked_s: number; // active time with posture measured (camera or demo, not timer)
  slouch_s: number;
  low_blink_s: number;
  late_s: number;
  resets: number;
  eye_breaks: number;
  trainings: number;
  breaths: number;
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
    const d = { key: dayKey(date), date, active_s: 0, tracked_s: 0, slouch_s: 0, low_blink_s: 0, late_s: 0, resets: 0, eye_breaks: 0, trainings: 0, breaths: 0, blink: null, blinkW: 0, blinkT: 0 };
    index.set(d.key, d);
    days.push(d);
  }
  for (const s of sessions) {
    const d = index.get(dayKey(new Date(s.started_at)));
    if (!d) continue;
    d.active_s += s.active_s;
    if (s.source !== 'timer') d.tracked_s += s.active_s;
    d.slouch_s += s.slouch_s;
    d.low_blink_s += s.low_blink_s;
    d.late_s += s.late_s;
    d.resets += s.resets;
    d.eye_breaks += s.eye_breaks;
    d.trainings += s.trainings;
    d.breaths += s.breaths;
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

export const GOAL = 70;
const MIN_TRACKED_S = 300;

/** 0-100 from the tracked time spent upright (three quarters) and blinking normally (one quarter); null under five tracked minutes. */
export function dayScore(d: Day) {
  if (d.tracked_s < MIN_TRACKED_S) return null;
  const lean = Math.min(1, d.slouch_s / d.tracked_s);
  const dry = Math.min(1, d.low_blink_s / d.tracked_s);
  return Math.round(100 * (1 - 0.75 * lean - 0.25 * dry));
}

/** Days in a row that met the goal, counting back from today; today only adds, it never breaks the run while it is still going. */
export function streak(days: Day[]) {
  let n = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const s = dayScore(days[i]);
    if (s !== null && s >= GOAL) n++;
    else if (i < days.length - 1) break;
  }
  return n;
}

export type MissionId = 'eye' | 'reset' | 'breath' | 'train' | 'score';
export type Mission = { id: MissionId; label: string; have: number; need: number; done: boolean };

/** A small daily checklist that ties the breaks, the breathing pause, posture training and the score together. */
export function missions(d: Day): Mission[] {
  const list = [
    { id: 'eye' as const, label: 'Istirahat mata 3 kali', have: d.eye_breaks, need: 3 },
    { id: 'reset' as const, label: 'Stretching 2 kali', have: d.resets, need: 2 },
    { id: 'breath' as const, label: 'Jeda napas sekali', have: d.breaths, need: 1 },
    { id: 'train' as const, label: 'Latihan postur sekali', have: d.trainings, need: 1 },
    { id: 'score' as const, label: `Skor ${GOAL} ke atas`, have: dayScore(d) ?? 0, need: GOAL },
  ];
  return list.map((m) => ({ ...m, done: m.have >= m.need }));
}

export const missionsDone = (d: Day) => missions(d).filter((m) => m.done).length;

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
    trainings: sum((d) => d.trainings),
    breaths: sum((d) => d.breaths),
    missionDays: days.filter((d) => missions(d).every((m) => m.done)).length,
    activeDays: days.filter((d) => d.active_s > 0).length,
    blink: withBlink.length
      ? withBlink.reduce((a, d) => a + d.blink! * d.active_s, 0) / withBlink.reduce((a, d) => a + d.active_s, 0)
      : null,
  };
}

/** The mean of the three areas, so one number can sit on a day. */
export const painOf = (c: Checkin) => (c.neck + c.back + c.eyes) / 3;

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/**
 * Discomfort on days that met the score goal against days that did not, over the given days. Only days with both a
 * score and a check-in count, and each side needs two of them before the comparison means anything.
 */
export function painByScore(days: Day[], checkins: Checkin[]) {
  const byDay = new Map(checkins.map((c) => [c.day, c]));
  const good: number[] = [];
  const low: number[] = [];
  for (const d of days) {
    const c = byDay.get(d.key);
    const s = dayScore(d);
    if (!c || s === null) continue;
    (s >= GOAL ? good : low).push(painOf(c));
  }
  const ready = good.length >= 2 && low.length >= 2;
  return { good: { n: good.length, mean: mean(good) }, low: { n: low.length, mean: mean(low) }, ready };
}

/** Each area's mean over the check-ins that fall on the given days, or null with none. */
export function painAverages(days: Day[], checkins: Checkin[]) {
  const keys = new Set(days.map((d) => d.key));
  const inRange = checkins.filter((c) => keys.has(c.day));
  return {
    n: inRange.length,
    neck: mean(inRange.map((c) => c.neck)),
    back: mean(inRange.map((c) => c.back)),
    eyes: mean(inRange.map((c) => c.eyes)),
  };
}
