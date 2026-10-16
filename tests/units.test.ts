import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  depthInFull,
  distance,
  shortDistance,
  volume,
  wind,
  windKmh,
  windMph,
} from '../src/lib/units.ts';

test('English shows miles; Spanish and Portuguese keep kilometers', () => {
  assert.equal(distance(300, 'es'), '300 km');
  assert.equal(distance(300, 'pt'), '300 km');
  assert.equal(distance(300, 'en'), '186 mi');
  assert.equal(distance(70, 'en'), '43 mi');
  assert.equal(distance(12.647, 'en'), '8 mi');
  assert.equal(distance(-0.3, 'en'), '0 mi');
  assert.equal(distance(-0.3, 'es'), '0 km');
});

test('a published depth keeps the agency figure beside the miles', () => {
  assert.equal(depthInFull(10.5, 'es'), '10.5 km');
  assert.equal(depthInFull(10.5, 'en'), '6.5 mi (10.5 km)');
});

test('location accuracy reads in feet, then miles, in English', () => {
  assert.equal(shortDistance(35, 'es'), '35 m');
  assert.equal(shortDistance(35, 'en'), '115 ft');
  assert.equal(shortDistance(3000, 'en'), '1.9 mi');
  assert.equal(shortDistance(30000, 'en'), '19 mi');
});

test('water in gallons is rounded up, never down', () => {
  assert.equal(volume(6, 'es'), '6 L');
  assert.equal(volume(6, 'en'), '1.6 gal');
  assert.equal(volume(3.785411784 * 4, 'en'), '4 gal');
});

test('wind follows the NHC rounding to 5 in km/h and mph', () => {
  // NHC advisories: 65 kt is 75 mph and 120 km/h; 85 kt is 100 mph; 150 kt is 175 mph.
  assert.equal(windMph(65), 75);
  assert.equal(windKmh(65), 120);
  assert.equal(windMph(85), 100);
  assert.equal(windMph(150), 175);
  assert.equal(wind(35, 'en'), '40 mph');
  assert.equal(wind(35, 'pt'), '65 km/h');
});
