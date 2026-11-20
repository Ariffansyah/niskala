import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BlinkCounter, glowFrom, makeBaseline, nightState, postureFrom, stepStrain } from './signals.ts';

const base = { pitch: 2, iod: 100, noseY: 300 };

test('baseline is the median, so one bad frame does not skew it', () => {
  const s = (pitch: number) => ({ pitch, iod: 100, noseY: 300, blink: 0 });
  assert.equal(makeBaseline([s(1), s(2), s(90)]).pitch, 2);
});

test('upright pose reads as zero drift', () => {
  assert.deepEqual(postureFrom({ ...base, blink: 0 }, base), { head: 0, torso: 0 });
});

test('small head wobble stays inside the dead zone', () => {
  assert.equal(postureFrom({ ...base, pitch: 5, blink: 0 }, base).head, 0);
});

test('slouch and lean-in map to bounded drift', () => {
  const p = postureFrom({ pitch: 2, iod: 120, noseY: 360, blink: 0 }, base);
  assert.ok(p.head > 0.7 && p.head <= 1, `head ${p.head}`);
  assert.ok(Math.abs(p.torso - 0.6) < 1e-9, `torso ${p.torso}`);
  assert.equal(postureFrom({ pitch: 60, iod: 300, noseY: 900, blink: 0 }, base).head, 1);
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
