import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  attemptResult,
  capitalize,
  failingLabel,
  sourceState,
  sourceTime,
} from '../src/lib/sourceStatus.ts';

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

test('a failed request keeps when it was tried; an answer clears it', () => {
  assert.deepEqual(attemptResult(false, now), { failed: true, failedAt: now });
  assert.deepEqual(attemptResult(true, now), { failed: false, failedAt: null });
});

test('the time beside a source says whether it is current, old or only an attempt', () => {
  const at = { now, lang: 'es' as const };
  assert.match(
    sourceTime({ ...at, checked: now - 60_000, old: false }),
    /^consultado \d{2}:\d{2}$/,
  );
  assert.match(
    sourceTime({ ...at, checked: now - 60_000, old: true }),
    /^último dato \d{2}:\d{2}$/,
  );
  // Nothing received: the time of the failed attempt, never "checked".
  assert.match(
    sourceTime({ ...at, checked: null, old: true, failedAt: now }),
    /^intento \d{2}:\d{2}$/,
  );
  assert.equal(sourceTime({ ...at, checked: null, old: false }), '');
  // Data from another day carries its date.
  assert.match(sourceTime({ ...at, checked: now - 30 * 3_600_000, old: true }), /oct/);
});

test('a failing source is never read as checked, in every language', () => {
  const failing = { checked: null, failedAt: now - 30_000, now };
  assert.match(failingLabel({ ...failing, lang: 'es' }), /^No responde · intento \d{2}:\d{2}$/);
  assert.match(failingLabel({ ...failing, lang: 'en' }), /^Not responding · tried \d{1,2}:\d{2}/);
  assert.match(failingLabel({ ...failing, lang: 'pt' }), /^Não responde · tentativa \d{2}:\d{2}$/);
  // With earlier data, the time of that data: it may have changed since.
  assert.match(
    failingLabel({ ...failing, checked: now - 600_000, lang: 'es' }),
    /^No responde · último dato \d{2}:\d{2}$/,
  );
  assert.equal(failingLabel({ checked: null, failedAt: null, now, lang: 'es' }), 'No responde');
  assert.equal(capitalize('último dato 23:36'), 'Último dato 23:36');
});
