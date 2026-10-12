import test from 'node:test';
import assert from 'node:assert/strict';
import { inCountryScope, hasCountryBoundary } from '../src/lib/countryScope.ts';
test('Colombia excludes the Panama events that used to dominate its rectangular view', () => {
  for (const event of [
    { lat: 7.5, lng: -80.4 },
    { lat: 7.3, lng: -80.8 },
    { lat: 8.98, lng: -79.52 },
  ]) {
    assert.equal(inCountryScope(event, 'CO'), false);
    assert.equal(inCountryScope(event, 'PA'), true);
  }
  assert.equal(inCountryScope({ lat: 4.71, lng: -74.07 }, 'CO'), true);
});
test('country view retains coastal earthquakes and distant islands without including other countries on land', () => {
  assert.equal(inCountryScope({ lat: -33.5, lng: -72 }, 'CL'), true);
  assert.equal(inCountryScope({ lat: 19.7, lng: -155.1 }, 'US'), true);
  assert.equal(inCountryScope({ lat: 61.2, lng: -149.9 }, 'US'), true);
  assert.equal(inCountryScope({ lat: 7.89, lng: -72.5 }, 'CO'), true);
  assert.equal(inCountryScope({ lat: 7.89, lng: -72.5 }, 'VE'), false);
  assert.equal(inCountryScope({ lat: 8, lng: -81 }, 'WORLD'), true);
  assert.equal(hasCountryBoundary('invalid'), false);
});
