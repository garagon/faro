import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parsePreferences,
  storePreferences,
  forgetPreferences,
  PREFERENCES_KEY,
  type Preferences,
} from '../src/lib/preferences.ts';
const codes = ['PA', 'AR', 'CL'];
const now = Date.now();
const value: Preferences = {
  version: 1,
  language: 'es',
  destination: 'PA',
  nationality: 'AR',
  savedAt: now,
};
function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}
test('profile restores known countries and language but strips unrelated data', () => {
  assert.deepEqual(
    parsePreferences({ ...value, gps: [8, -80], unneeded: 'unneeded' }, codes, now),
    value,
  );
  assert.equal(parsePreferences({ ...value, destination: 'WORLD' }, codes, now), null);
  assert.equal(parsePreferences({ ...value, nationality: 'ZZ' }, codes, now), null);
  assert.equal(parsePreferences({ ...value, language: 'xx' }, codes, now), null);
  assert.equal(parsePreferences({ ...value, version: 2 }, codes, now), null);
  assert.equal(parsePreferences({ ...value, savedAt: now + 1000 }, codes, now), null);
});
test('nationality is optional when saving, but an unknown country is still rejected', () => {
  assert.equal(parsePreferences({ ...value, nationality: '' }, codes, now)?.nationality, '');
  assert.equal(parsePreferences({ ...value, nationality: undefined }, codes, now), null);
  assert.equal(storePreferences({ ...value, nationality: '' }, codes, storage()).nationality, '');
  assert.throws(() => storePreferences({ ...value, nationality: 'ZZ' }, codes, storage()));
});
test('save verifies persistence and reports blocked storage', () => {
  const s = storage();
  storePreferences(value, codes, s);
  assert.deepEqual(parsePreferences(JSON.parse(s.getItem(PREFERENCES_KEY)!), codes), value);
  assert.throws(() =>
    storePreferences(value, codes, {
      setItem() {
        throw Error('Quota');
      },
      getItem: () => null,
    }),
  );
  assert.throws(() => storePreferences(value, codes, { setItem() {}, getItem: () => null }));
});
test('deleting preferences preserves contact and hotel storage; failed deletion is reported', () => {
  const s = storage();
  s.setItem('faro-hotel-v1', 'keep');
  s.setItem('faro-checkins-v1', 'keep');
  storePreferences(value, codes, s);
  forgetPreferences(s);
  assert.equal(s.getItem(PREFERENCES_KEY), null);
  assert.equal(s.getItem('faro-hotel-v1'), 'keep');
  assert.equal(s.getItem('faro-checkins-v1'), 'keep');
  assert.throws(() => forgetPreferences({ removeItem() {}, getItem: () => JSON.stringify(value) }));
});

test('all local records report failed writes/deletes without fallback', async () => {
  const { writeLocal, removeLocal } = await import('../src/lib/browserStorage.ts');
  const s = storage();
  for (const key of ['faro-hotel-v1', 'faro-checkins-v1', 'faro-contacts-v1', 'faro-zones-v1']) {
    writeLocal(key, 'saved', s);
    assert.equal(s.getItem(key), 'saved');
    assert.throws(() => writeLocal(key, 'new', { setItem() {}, getItem: () => 'saved' }));
    assert.throws(() =>
      writeLocal(key, 'new', {
        setItem() {
          throw Error('Quota exceeded');
        },
        getItem: () => 'saved',
      }),
    );
    assert.throws(() => removeLocal(key, { removeItem() {}, getItem: () => 'saved' }));
    removeLocal(key, s);
    assert.equal(s.getItem(key), null);
  }
});

test('contact profile is stored locally, normalized and restored without extra fields', () => {
  const s = storage();
  const details = {
    ...value,
    name: ' Alex Example ',
    phone: '+1 (202) 555-0123',
    email: ' alex@example.com ',
  };
  storePreferences(details, codes, s);
  const restored = parsePreferences(JSON.parse(s.getItem(PREFERENCES_KEY)!), codes);
  assert.deepEqual(restored, { ...details, name: 'Alex Example', email: 'alex@example.com' });
  assert.deepEqual(
    parsePreferences({ ...details, trackingId: 'omit', gps: [1, 2] }, codes),
    restored,
  );
  forgetPreferences(s);
  assert.equal(s.getItem(PREFERENCES_KEY), null);
});

test('contact fields reject invalid stored values while accepting legacy and optional fields', () => {
  assert.ok(parsePreferences(value, codes));
  assert.ok(parsePreferences({ ...value, name: '', phone: '', email: '' }, codes));
  for (const extra of [
    { name: 8 },
    { name: 'x'.repeat(81) },
    { name: 'Alex\nExample' },
    { phone: 'https://example.com' },
    { phone: '----' },
    { phone: '+1 202\n555 0123' },
    { phone: '123' },
    { phone: '1'.repeat(16) },
    { email: 'not-an-email' },
    { email: 'a@b' },
    { email: 'alex@example.com\nOther' },
    { email: 5 },
  ])
    assert.equal(parsePreferences({ ...value, ...extra }, codes), null);
});

test('site language persists independently of the trip profile', async () => {
  const { readSiteLanguage } = await import('../src/lib/preferences.ts');
  const s = storage();
  assert.equal(readSiteLanguage(undefined, s, ['es-PA', 'en']), 'es');
  assert.equal(readSiteLanguage(undefined, s, ['en-US', 'es']), 'en');
  assert.equal(readSiteLanguage(undefined, s, ['pt-BR']), 'pt');
  assert.equal(readSiteLanguage(undefined, s, ['fr-FR']), 'en');
  assert.equal(readSiteLanguage(undefined, s, []), 'en');
  assert.equal(readSiteLanguage('en'), 'en');
  assert.equal(readSiteLanguage('en', s), 'en');
  s.setItem('faro-lang', 'es');
  assert.equal(readSiteLanguage('en', s), 'es');
  s.setItem('faro-lang', 'en');
  assert.equal(readSiteLanguage(undefined, s), 'en');
  s.setItem('faro-lang', 'pt');
  assert.equal(readSiteLanguage('es', s), 'pt');
  s.setItem('faro-lang', 'invalid');
  assert.equal(readSiteLanguage('es', s), 'es');
  assert.equal(
    readSiteLanguage('en', {
      getItem: () => {
        throw Error('Blocked');
      },
    }),
    'en',
  );
});
