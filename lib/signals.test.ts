import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BlinkCounter, driftOf, glowFrom, makeBaseline, nightState, postureFrom, stepStrain } from './signals.ts';

const base = { pitch: 2, roll: 0, iod: 100, cx: 320, noseY: 300 };
const face = (o: Partial<typeof base> = {}) => ({ ...base, blink: 0, ...o });

test('baseline is the median, so one bad frame does not skew it', () => {
  const s = (pitch: number) => face({ pitch });
  assert.equal(makeBaseline([s(1), s(2), s(90)]).pitch, 2);
});

test('upright pose reads as zero drift', () => {
  const p = postureFrom(face(), base);
  assert.equal(p.head + p.torso + Math.abs(p.side) + Math.abs(p.tilt), 0);
});

test('small head wobble stays inside the dead zone', () => {
  const p = postureFrom(face({ pitch: 5, roll: 2, cx: 330 }), base);
  assert.equal(p.head + Math.abs(p.side) + Math.abs(p.tilt), 0);
});

test('slouch and lean-in map to bounded drift', () => {
  const p = postureFrom(face({ iod: 120, noseY: 360 }), base);
  assert.ok(p.head > 0.7 && p.head <= 1, `head ${p.head}`);
  assert.ok(Math.abs(p.torso - 0.6) < 1e-9, `torso ${p.torso}`);
  assert.equal(postureFrom(face({ pitch: 60, iod: 300, noseY: 900 }), base).head, 1);
});

test('sideways lean and head tilt are signed toward the user', () => {
  // Leaning to the user's right moves the face toward the left of the raw camera frame.
  const right = postureFrom(face({ cx: 260 }), base);
  assert.ok(right.side > 0.5, `side ${right.side}`);
  assert.ok(postureFrom(face({ cx: 380 }), base).side < -0.5);
  // Head tipped toward the right shoulder turns the eye line anticlockwise in the raw frame.
  const tilt = postureFrom(face({ roll: -15 }), base).tilt;
  assert.ok(Math.abs(tilt - 0.6) < 1e-9, `tilt ${tilt}`);
  assert.equal(postureFrom(face({ roll: 90, cx: 0 }), base).tilt, -1);
  assert.equal(driftOf(postureFrom(face({ roll: 90 }), base)), 1);
});

test('strain needs a sustained condition before any glow', () => {
  let s = 0;
  for (let i = 0; i < 8; i++) s = stepStrain(s, true, 0.25, 10, 4); // a 2 s glance
  assert.equal(glowFrom(s), 0);
  for (let i = 0; i < 40; i++) s = stepStrain(s, true, 0.25, 10, 4); // 12 s total
  assert.equal(glowFrom(s), 1);
});

test('blink counter counts quick closures and ignores long ones', () => {
  const b = new BlinkCounter(0);
  assert.equal(b.push(100, 0.8), false);
  assert.equal(b.push(250, 0.1), true);
  b.push(1000, 0.9);
  assert.equal(b.push(2000, 0.1), false); // 1 s closure is a rest, not a blink
  assert.equal(b.rate(10_000), null);
  assert.equal(b.rate(30_000), 2); // 1 blink over 30 s
});

test('night stages follow bedtime and wrap past midnight', () => {
  const bed = 23 * 60;
  assert.deepEqual(nightState(18 * 60, bed), { level: 0, stage: 'day', minutesToBed: 300 });
  assert.equal(nightState(22 * 60 + 30, bed).stage, 'wind-down');
  assert.equal(nightState(22 * 60 + 30, bed).level, 1);
  assert.equal(nightState(60, bed).stage, 'late'); // 01:00, 2 h past bedtime
  assert.equal(nightState(9 * 60, bed).stage, 'day'); // next morning
  assert.equal(nightState(9 * 60, bed).level, 0);
});
