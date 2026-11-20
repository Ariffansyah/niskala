// Pure signal math shared by the camera and simulation paths. No DOM, no I/O.

export type FaceSample = {
  pitch: number; // head pitch, degrees
  iod: number; // inter-ocular distance, px
  noseY: number; // nose tip, px from top of frame
  blink: number; // 0..1, mean of both eyeBlink blendshapes
};

export type Baseline = { pitch: number; iod: number; noseY: number };

// 0 = matches the calibrated upright pose, 1 = at the figure's anatomical limit
export type Posture = { head: number; torso: number };

export const DRIFT_THRESHOLD = 0.35;
export const LOW_BLINK_PER_MIN = 10;

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function makeBaseline(samples: FaceSample[]): Baseline {
  return {
    pitch: median(samples.map((s) => s.pitch)),
    iod: median(samples.map((s) => s.iod)),
    noseY: median(samples.map((s) => s.noseY)),
  };
}

export function postureFrom(s: FaceSample, b: Baseline): Posture {
  // Pitch sign depends on camera mounting, so any sustained pitch change counts.
  const pitch = Math.max(0, Math.abs(s.pitch - b.pitch) - 4) / 18;
  // Leaning toward the screen makes the face larger in frame.
  const lean = (s.iod / b.iod - 1) / 0.25;
  // Slouching lowers the face; measured in eye-widths so it is distance independent.
  const drop = (s.noseY - b.noseY) / b.iod;
  return { head: clamp01(pitch + Math.max(0, lean)), torso: clamp01(drop) };
}

// Exponential smoothing with a time constant, so the result does not depend on frame rate.
export const ema = (prev: number, next: number, dt: number, tau: number) =>
  prev + (next - prev) * (1 - Math.exp(-dt / tau));

// Strain builds only while a condition holds and drains when it stops, which debounces glances.
export const stepStrain = (strain: number, active: boolean, dt: number, riseS: number, fallS: number) =>
  clamp01(active ? strain + dt / riseS : strain - dt / fallS);

// Glow stays dark for the first 30% of strain so short lapses never light the edge.
export const glowFrom = (strain: number) => clamp01((strain - 0.3) / 0.7);

export class BlinkCounter {
  private closed = false;
  private closedAt = 0;
  private times: number[] = [];
  private startedAt: number;
  total = 0;

  constructor(startedAt: number) {
    this.startedAt = startedAt;
  }

  /** Feed one frame; returns true when a blink completes. */
  push(t: number, score: number): boolean {
    if (!this.closed && score > 0.5) {
      this.closed = true;
      this.closedAt = t;
    } else if (this.closed && score < 0.3) {
      this.closed = false;
      // Longer closures are rests or looking down, not blinks.
      if (t - this.closedAt < 600) {
        this.times.push(t);
        this.total++;
        return true;
      }
    }
    return false;
  }

  /** Blinks per minute over the last 60 s, or null until 20 s of data exist. */
  rate(now: number): number | null {
    this.times = this.times.filter((x) => now - x < 60_000);
    const span = Math.min(60_000, now - this.startedAt);
    return span < 20_000 ? null : (this.times.length * 60_000) / span;
  }
}

export type NightStage = 'day' | 'wind-down' | 'late';

/** Warm-shift level and guidance stage from minutes-since-midnight and a bedtime. */
export function nightState(nowMin: number, bedMin: number) {
  // Signed minutes relative to bedtime, wrapped into [-12h, +12h).
  const d = ((((nowMin - bedMin + 720) % 1440) + 1440) % 1440) - 720;
  const awake = d < 480; // after 8 h past bedtime it is morning again
  const level = awake ? clamp01((d + 120) / 90) : 0;
  const stage: NightStage = !awake || d < -60 ? 'day' : d < 0 ? 'wind-down' : 'late';
  return { level, stage, minutesToBed: -d };
}
