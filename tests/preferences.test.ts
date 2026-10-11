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
    parsePreferences({ ...value, gps: [8, -80], name: 'unneeded' }, codes, now),
    value,
  );
  assert.equal(parsePreferences({ ...value, destination: 'WORLD' }, codes, now), null);
  assert.equal(parsePreferences({ ...value, nationality: 'ZZ' }, codes, now), null);
  assert.equal(parsePreferences({ ...value, language: 'xx' }, codes, now), null);
  assert.equal(parsePreferences({ ...value, version: 2 }, codes, now), null);
  assert.equal(parsePreferences({ ...value, savedAt: now + 1000 }, codes, now), null);
});
test('legacy profiles with empty nationality can be recovered but cannot be saved incomplete', () => {
  assert.equal(parsePreferences({ ...value, nationality: '' }, codes, now)?.nationality, '');
  assert.equal(parsePreferences({ ...value, nationality: undefined }, codes, now), null);
  assert.throws(() => storePreferences({ ...value, nationality: '' }, codes, storage()));
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
