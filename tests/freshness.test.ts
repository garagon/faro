import { test } from 'node:test';
import assert from 'node:assert/strict';
import { confirmFresh, type HazardStatus } from '../src/lib/hazards.ts';
import { nationalSignal } from '../src/lib/national.ts';
import { atLabel, checkedLabel } from '../src/lib/time.ts';

const none: HazardStatus = { key: 'tsunami', state: 'none', level: null, count: 0 };
const listed: HazardStatus = { key: 'tsunami', state: 'listed', level: 'review', count: 1 };
const now = Date.parse('2026-10-13T21:00:00Z');

test('a "none" is shown only while recent and online; otherwise it is not confirmed', () => {
  assert.equal(confirmFresh(none, now - 60_000, now, true, 180_000).state, 'none');
  assert.equal(confirmFresh(none, now - 600_000, now, true, 180_000).state, 'unknown');
  assert.equal(confirmFresh(none, now - 60_000, now, false, 180_000).state, 'unknown');
  assert.equal(confirmFresh(none, undefined, now, true, 180_000).state, 'unknown');
  assert.equal(confirmFresh(none, now - 600_000, now, true, 180_000).checked, now - 600_000);
});

test('a first answer still on its way is pending online and not confirmed offline', () => {
  const pending: HazardStatus = { key: 'tsunami', state: 'pending', level: null, count: 0 };
  assert.equal(confirmFresh(pending, undefined, now, true, 180_000).state, 'pending');
  assert.equal(confirmFresh(pending, undefined, now, false, 180_000).state, 'unknown');
});

test('a listed message stays listed even when old or offline', () => {
  const s = confirmFresh(listed, now - 3_600_000, now, false, 180_000);
  assert.equal(s.state, 'listed');
  assert.equal(s.level, 'review');
});

test('times from another day carry the date so yesterday never reads as today', () => {
  const today = now - 3_600_000;
  const yesterday = now - 26 * 3_600_000;
  assert.doesNotMatch(checkedLabel(today, now, 'en'), /Oct/);
  assert.match(checkedLabel(yesterday, now, 'en'), /Oct/);
  assert.match(atLabel(today, now, 'es'), /^las /);
  assert.match(atLabel(yesterday, now, 'es'), /^el \d+ oct/);
});

test('national warnings say "none" only from a complete, recent answer', () => {
  const base = { warnings: [], failed: false, partial: false, stale: false };
  assert.equal(nationalSignal(base), 'off');
  assert.equal(nationalSignal({ ...base, partial: true }), 'unconfirmed');
  assert.equal(nationalSignal({ ...base, stale: true }), 'unconfirmed');
  assert.equal(nationalSignal({ ...base, failed: true }), 'unconfirmed');
  assert.equal(nationalSignal({ ...base, warnings: null }), 'checking');
  assert.equal(nationalSignal({ ...base, warnings: null, stale: true }), 'offline');
  assert.equal(nationalSignal({ ...base, warnings: null, failed: true }), 'failed');
  // A warning in force is always shown, even from a partial or old answer.
  assert.equal(nationalSignal({ ...base, warnings: [{}], partial: true, stale: true }), 'on');
});

test('stored warnings come back with their original time and only for a week', async () => {
  const { reviveNational } = await import('../src/lib/national.ts');
  const { reviveCivil } = await import('../src/lib/civil.ts');
  const snapshot = { country: 'PA', agency: 'IMHPA', warnings: [], partial: false };
  const at = now - 3_600_000;
  assert.equal(reviveNational({ ...snapshot, fetched: at }, 'PA', now)?.fetched, at);
  // Another country, a future date or a copy older than a week is never shown.
  assert.equal(reviveNational({ ...snapshot, fetched: at }, 'CR', now), null);
  assert.equal(reviveNational({ ...snapshot, fetched: now + 60_000 }, 'PA', now), null);
  assert.equal(reviveNational({ ...snapshot, fetched: now - 8 * 86_400_000 }, 'PA', now), null);
  assert.equal(reviveNational('garbage', 'PA', now), null);
  const posts = { agency: 'SINAPROC', posts: [], stale: false };
  assert.equal(reviveCivil({ ...posts, fetched: at }, now)?.fetched, at);
  assert.equal(reviveCivil({ ...posts, agency: 'X', fetched: at }, now), null);
});

test('kept official copies older than a week, or unreadable, are deleted', async () => {
  const { pruneOfficialCopies } = await import('../src/lib/browserStorage.ts');
  const data = new Map<string, string>([
    ['faro-national-PA', JSON.stringify({ fetched: now - 3_600_000 })],
    ['faro-national-CR', JSON.stringify({ fetched: now - 8 * 86_400_000 })],
    ['faro-sinaproc', '{broken'],
    ['faro-tsunami', JSON.stringify({ fetched: now - 8 * 86_400_000 })],
    ['faro-usgs-v1', JSON.stringify({ raw: {}, fetched: now - 8 * 86_400_000 })],
    ['faro-igc-v1', JSON.stringify({ events: [], fetched: now - 60_000 })],
    ['faro-preferences-v1', JSON.stringify({ fetched: 0 })],
  ]);
  const storage = {
    get length() {
      return data.size;
    },
    key: (i: number) => [...data.keys()][i] ?? null,
    getItem: (k: string) => data.get(k) ?? null,
    removeItem: (k: string) => void data.delete(k),
  };
  assert.deepEqual(pruneOfficialCopies(now, storage).sort(), [
    'faro-national-CR',
    'faro-sinaproc',
    'faro-tsunami',
    'faro-usgs-v1',
  ]);
  // Personal data is never touched by this cleanup.
  assert.ok(data.has('faro-preferences-v1'));
  assert.ok(data.has('faro-national-PA'));
  assert.ok(data.has('faro-igc-v1'));
});
