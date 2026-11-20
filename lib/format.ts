const pad = (n: number) => String(n).padStart(2, '0');

export const hhmm = (min: number) => `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`;

/** Minutes after midnight from an `<input type="time">` value, or null if incomplete. */
export function parseHhmm(v: string) {
  const [h, m] = v.split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
}

export function duration(s: number) {
  s = Math.floor(s);
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.floor(s / 60)} min ${pad(s % 60)} s`;
  return `${Math.floor(s / 3600)} h ${pad(Math.floor(s / 60) % 60)} min`;
}

/** Coarse duration for summaries: "45 min", "3 h 20 min". */
export function minutes(s: number) {
  if (s < 60) return `${Math.floor(s)} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`;
}
