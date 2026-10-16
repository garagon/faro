import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  attemptResult,
  capitalize,
  failingLabel,
  lineStamp,
  sourceLine,
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
  assert.match(failingLabel({ ...failing, lang: 'es' }), /^Sin respuesta · intento \d{2}:\d{2}$/);
  assert.match(failingLabel({ ...failing, lang: 'en' }), /^No response · tried \d{1,2}:\d{2}/);
  assert.match(failingLabel({ ...failing, lang: 'pt' }), /^Sem resposta · tentativa \d{2}:\d{2}$/);
  // With earlier data, the time of that data: it may have changed since.
  assert.match(
    failingLabel({ ...failing, checked: now - 600_000, lang: 'es' }),
    /^Sin respuesta · último dato \d{2}:\d{2}$/,
  );
  assert.equal(failingLabel({ checked: null, failedAt: null, now, lang: 'es' }), 'Sin respuesta');
  assert.equal(capitalize('último dato 23:36'), 'Último dato 23:36');
});

test('one closed vocabulary: checked, no response, offline, and checking in grey', () => {
  const at = { now, lang: 'es' as const, online: true, failed: false };
  const line = (s: Partial<Parameters<typeof sourceLine>[0]>) =>
    sourceLine({ ...at, checked: now - 60_000, ...s });
  assert.deepEqual(line({}).state, 'checked');
  assert.match(line({}).text, /^consultado \d{2}:\d{2}$/);
  // Before a first answer: checking, never a failure, and never amber.
  assert.deepEqual(line({ checked: null }), { state: 'checking', text: 'consultando…' });
  assert.equal(lineStamp('checking'), undefined);
  assert.equal(lineStamp('checked'), undefined);
  // Failing with nothing received: the time Faro tried.
  const tried = line({ checked: null, failed: true, failedAt: now - 30_000 });
  assert.equal(tried.state, 'failed');
  assert.match(tried.text, /^sin respuesta · intento \d{2}:\d{2}$/);
  assert.equal(lineStamp('failed'), 'error');
  // Failing, or an old copy, with data still on screen: the time of that data.
  assert.match(line({ failed: true, failedAt: now }).text, /^sin respuesta · último dato /);
  assert.match(line({ old: true }).text, /^sin respuesta · último dato /);
  // Offline: the last data, or nothing to date.
  assert.equal(line({ online: false }).state, 'offline');
  assert.match(line({ online: false }).text, /^sin conexión · último dato \d{2}:\d{2}$/);
  assert.equal(line({ online: false, checked: null }).text, 'sin conexión');
  assert.equal(lineStamp('offline'), 'stale');
  // The same three states in English and Portuguese.
  assert.match(line({ lang: 'en' }).text, /^checked \d{1,2}:\d{2}/);
  assert.match(line({ lang: 'en', online: false }).text, /^offline · last data /);
  assert.match(
    line({ lang: 'pt', checked: null, failed: true, failedAt: now }).text,
    /^sem resposta · tentativa /,
  );
  assert.match(line({ lang: 'pt', online: false }).text, /^sem conexão · último dado /);
});
