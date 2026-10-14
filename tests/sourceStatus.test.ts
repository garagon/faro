import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sourceState } from '../src/lib/sourceStatus.ts';

const now = Date.parse('2026-10-14T05:00:00Z');
const base = { checked: now - 30_000, failed: false, online: true, now, maxAge: 180_000 };

test('a source is "working" only with a recent, complete answer while online', () => {
  assert.equal(sourceState(base), 'ok');
  assert.equal(sourceState({ ...base, partial: true }), 'partial');
  assert.equal(sourceState({ ...base, checked: now - 600_000 }), 'stale');
  assert.equal(sourceState({ ...base, online: false }), 'stale');
  assert.equal(sourceState({ ...base, stale: true }), 'stale');
});

test('never answered, failing, offline and paused sources say so', () => {
  assert.equal(sourceState({ ...base, checked: null }), 'checking');
  assert.equal(sourceState({ ...base, checked: null, online: false }), 'offline');
  assert.equal(sourceState({ ...base, checked: null, failed: true }), 'failed');
  // A failed refresh is reported even when an older answer is still shown.
  assert.equal(sourceState({ ...base, failed: true }), 'failed');
  assert.equal(sourceState({ ...base, idle: true }), 'idle');
});
