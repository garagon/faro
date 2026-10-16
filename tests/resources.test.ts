import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validPlan, planCoordinates, resources } from '../src/lib/resources.ts';
const plan = {
  name: 'Test',
  meeting: 'Reception instructions',
  notes: '',
  lat: '8.98',
  lng: '-79.52',
  savedAt: 1,
  country: 'PA',
};
test('hotel marker requires both finite coordinates in geographic range', () => {
  assert.deepEqual(planCoordinates(plan), [8.98, -79.52]);
  for (const p of [
    { ...plan, lat: '' },
    { ...plan, lng: '' },
    { ...plan, lat: '91' },
    { ...plan, lng: 'Infinity' },
    { ...plan, lng: '181' },
  ])
    assert.equal(planCoordinates(p), null);
  assert.deepEqual(planCoordinates({ ...plan, lat: '0', lng: '0' }), [0, 0]);
});
test('stored hotel data must have the expected shape before rendering', () => {
  assert.equal(validPlan(plan), true);
  assert.equal(validPlan(null), false);
  assert.equal(validPlan({ ...plan, notes: 123 }), false);
  assert.equal(validPlan({ ...plan, savedAt: 'yesterday' }), false);
});
test('resource directory contains official https sources, not fabricated shelter coordinates', () => {
  for (const r of resources) {
    assert.equal(new URL(r.url).protocol, 'https:');
    assert.equal('lat' in r, false);
    assert.equal(r.description.length, 3);
  }
  assert.ok(resources.some((r) => r.url.includes('utp.ac.pa')));
  assert.ok(resources.some((r) => r.url.includes('mupa.gob.pa')));
  // A national Red Cross society may be linked as an institution, never as a confirmed shelter
  // or service. Panama's listing was not verified and stays out.
  for (const r of resources.filter((r) => /cruzroja/i.test(r.url))) {
    assert.match(r.description[0], /No confirma/);
    assert.match(r.description[1], /does not confirm/);
  }
  assert.ok(!resources.some((r) => r.country === 'PA' && /cruzroja/i.test(r.url)));
});
