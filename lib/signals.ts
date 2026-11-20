// Pure signal math shared by the camera and simulation paths. No DOM, no I/O.

export type FaceSample = {
  pitch: number; // head pitch, degrees
  roll: number; // angle of the eye line in the raw camera image, degrees
  iod: number; // inter-ocular distance, px
  cx: number; // midpoint between the eyes, px from the left of the raw frame
  noseY: number; // nose tip, px from top of frame
  blink: number; // 0..1, mean of both eyeBlink blendshapes
};

export type Baseline = { pitch: number; roll: number; iod: number; cx: number; noseY: number };

// head/torso: 0 = calibrated upright pose, 1 = the figure's forward limit.
// side/tilt: -1..1, positive toward the user's right (the right of a mirror image).
export type Posture = { head: number; torso: number; side: number; tilt: number };
export const UPRIGHT: Posture = { head: 0, torso: 0, side: 0, tilt: 0 };

export type Sensitivity = 'gentle' | 'balanced' | 'strict';
// drift: share of the range that counts as leaning; riseS: seconds of sustained lean to full glow;
// lowBlink: blinks per minute below which eye strain builds.
export const SENSITIVITY: Record<Sensitivity, { drift: number; riseS: number; lowBlink: number }> = {
  gentle: { drift: 0.45, riseS: 16, lowBlink: 8 },
  balanced: { drift: 0.35, riseS: 10, lowBlink: 10 },
  strict: { drift: 0.25, riseS: 6, lowBlink: 12 },
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const clamp1 = (x: number) => Math.min(1, Math.max(-1, x));
// Shrinks |x| by `dead` so small wobble reads as zero, keeping the sign.
const deadZone = (x: number, dead: number) => Math.sign(x) * Math.max(0, Math.abs(x) - dead);

export function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function makeBaseline(samples: FaceSample[]): Baseline {
  const m = (f: (s: FaceSample) => number) => median(samples.map(f));
  return { pitch: m((s) => s.pitch), roll: m((s) => s.roll), iod: m((s) => s.iod), cx: m((s) => s.cx), noseY: m((s) => s.noseY) };
}

/** Side-camera sample, in degrees: 0 = vertical, positive = toward the screen the user faces. */
export type ProfileSample = {
  neck: number; // shoulder-to-ear line against vertical (forward head posture)
  trunk: number; // hip-to-shoulder line against vertical (slouch or lean)
};
export type ProfileBaseline = ProfileSample;
type Point = { x: number; y: number };

/** Neck and trunk angles from the body side facing the camera, pixel coordinates with y down. */
export function profileAngles(ear: Point, shoulder: Point, hip: Point, nose: Point): ProfileSample {
  // Works for a camera on either side: forward is whichever way the nose points from the ear.
  const facing = nose.x >= ear.x ? 1 : -1;
  const deg = (dx: number, dy: number) => (Math.atan2(dx, dy) * 180) / Math.PI;
  return {
    neck: deg(facing * (ear.x - shoulder.x), shoulder.y - ear.y),
    trunk: deg(facing * (shoulder.x - hip.x), hip.y - shoulder.y),
  };
}

export const makeProfileBaseline = (samples: ProfileSample[]): ProfileBaseline => ({
  neck: median(samples.map((s) => s.neck)),
  trunk: median(samples.map((s) => s.trunk)),
});

/** Side view sees forward lean directly but not sideways lean, so side and tilt stay 0. */
export function postureFromProfile(s: ProfileSample, b: ProfileBaseline): Posture {
  return {
    head: clamp01((s.neck - b.neck - 3) / 21),
    torso: clamp01((s.trunk - b.trunk - 2) / 18),
    side: 0,
    tilt: 0,
  };
}

/** Largest deviation of any axis, 0..1. */
export const driftOf = (p: Posture) => Math.max(p.head, p.torso, Math.abs(p.side), Math.abs(p.tilt));

export function postureFrom(s: FaceSample, b: Baseline): Posture {
  // Pitch sign depends on camera mounting, so any sustained pitch change counts.
  const pitch = Math.max(0, Math.abs(s.pitch - b.pitch) - 4) / 18;
  // Leaning toward the screen makes the face larger in frame.
  const lean = (s.iod / b.iod - 1) / 0.25;
  // Slouching lowers the face; measured in eye-widths so it is distance independent.
  const drop = (s.noseY - b.noseY) / b.iod;
  // The camera sees the user un-mirrored: leaning to their right moves the face left in the frame,
  // and tipping the head toward the right shoulder turns the eye line anticlockwise (negative).
  const shift = (s.cx - b.cx) / b.iod;
  return {
    head: clamp01(pitch + Math.max(0, lean)),
    torso: clamp01(drop),
    side: clamp1(-deadZone(shift, 0.12) / 0.8),
    tilt: clamp1(-deadZone(s.roll - b.roll, 3) / 20),
  };
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
