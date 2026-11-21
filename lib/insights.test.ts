import assert from 'node:assert/strict';
import { test } from 'node:test';
import { byDay, totals } from './insights.ts';
import type { SessionSummary } from './store.ts';

const session = (started: Date, over: Partial<SessionSummary>): SessionSummary => ({
  id: crypto.randomUUID(),
  started_at: started.toISOString(),
  updated_at: started.toISOString(),
  active_s: 0,
  resets: 0,
  eye_breaks: 0,
  slouch_s: 0,
  low_blink_s: 0,
  late_s: 0,
  avg_blink: null,
  source: 'camera',
  ...over,
});

test('sessions group by local day and empty days are zero-filled', () => {
  const now = new Date(2026, 10, 20, 15, 0);
  const days = byDay(
    [
      session(new Date(2026, 10, 20, 9, 0), { active_s: 600, slouch_s: 60, avg_blink: 10 }),
      session(new Date(2026, 10, 20, 13, 0), { active_s: 1800, slouch_s: 300, avg_blink: 18, resets: 2 }),
      session(new Date(2026, 10, 18, 22, 0), { active_s: 900, late_s: 900 }),
      session(new Date(2026, 9, 1, 10, 0), { active_s: 999 }), // outside the window
    ],
    7,
    now,
  );
  assert.equal(days.length, 7);
  assert.equal(days[6].key, '2026-11-20');
  assert.equal(days[6].active_s, 2400);
  assert.equal(days[6].resets, 2);
  assert.equal(days[6].blink, 16); // (10*600 + 18*1800) / 2400
  assert.equal(days[4].late_s, 900);
  assert.equal(days[5].active_s, 0);
  assert.equal(days[5].blink, null);

  const t = totals(days);
  assert.equal(t.active_s, 3300);
  assert.equal(t.activeDays, 2);
  assert.ok(Math.abs(t.leanShare - 360 / 3300) < 1e-9);
});

test('totals are safe with no data', () => {
  const t = totals(byDay([], 14, new Date(2026, 0, 1)));
  assert.equal(t.leanShare, 0);
  assert.equal(t.blink, null);
});
