import test from 'node:test';
import assert from 'node:assert/strict';
import { countryOnLand } from '../src/lib/countryScope.ts';
import { statusLocation } from '../src/lib/statusLocation.ts';
const now = 1_800_000_000_000;
const panama = { lat: 8.98, lng: -79.52, accuracy: 30, at: now - 1000 };
test('GPS in Panama overrides a saved Colombia trip, without consulting the browsed country', () => {
  assert.deepEqual(statusLocation(panama, 'CO', now), { country: 'PA', source: 'location' });
  assert.deepEqual(statusLocation({ ...panama, lat: 4.71, lng: -74.07 }, 'PA', now), {
    country: 'CO',
    source: 'location',
  });
});
test('without GPS only the saved trip can be suggested, explicitly as a saved destination', () => {
  assert.deepEqual(statusLocation(null, 'CO', now), { country: 'CO', source: 'trip' });
  assert.equal(statusLocation(null, undefined, now), null);
  assert.equal(statusLocation(null, 'WORLD', now), null);
});
test('stale, inaccurate or unrecognized fixes do not fall back to an unrelated trip', () => {
  for (const fix of [
    { ...panama, at: now - 300001 },
    { ...panama, at: now + 1 },
    { ...panama, accuracy: 20000 },
    { ...panama, accuracy: NaN },
    { ...panama, lat: NaN },
    { ...panama, lat: 0, lng: 0 },
  ])
    assert.equal(statusLocation(fix, 'CO', now), null);
});
test('offshore earthquake browsing areas are never used to locate a person', () => {
  assert.equal(countryOnLand({ lat: -33.5, lng: -72 }), null);
  assert.equal(countryOnLand({ lat: 91, lng: 0 }), null);
});
