import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { coastDistanceKm, decodeCoastline, segmentDistanceKm } from '../src/lib/coast.ts';
import { embassies, directionsUrl } from '../src/lib/embassies.ts';
test('coast distance handles segment interiors, endpoints, degenerate segments and dateline', () => {
  assert.ok(segmentDistanceKm([0, 1], [-1, 0], [1, 0]) > 110);
  assert.ok(segmentDistanceKm([0, 1], [-1, 0], [1, 0]) < 112);
  assert.ok(segmentDistanceKm([0, 0], [0, 0], [0, 0]) < 0.001);
  assert.ok(segmentDistanceKm([180, 0], [179, 0], [-179, 0]) < 0.001);
  assert.ok(segmentDistanceKm([2, 0], [0, 0], [1, 0]) > 110);
  assert.equal(coastDistanceKm(0, 0, []), null);
});
test('global dataset finds coast near Panama City, without falsely treating inland as safe', () => {
  const lines = decodeCoastline(
    JSON.parse(readFileSync(new URL('../public/data/coastline.json', import.meta.url), 'utf8')),
  );
  const distance = coastDistanceKm(8.98, -79.51, lines);
  assert.ok(distance !== null && distance < 10);
  const inland = coastDistanceKm(39, -98, lines);
  // The compact grid decodes back to coordinates; an unknown format fails instead of reading as no coast.
  assert.deepEqual(decodeCoastline({ format: 'delta-1e-3', lines: [[1000, -2000, 1, 1]] }), [
    [
      [1, -2],
      [1.001, -1.999],
    ],
  ]);
  assert.throws(() => decodeCoastline({ format: 'other', lines: [] }));
  assert.throws(() => decodeCoastline({ format: 'delta-1e-3', lines: [[1, 2, 3]] }));
  assert.ok(inland !== null && inland > 500);
});
test('embassy route contains destination and selected mode, never user location', () => {
  assert.ok(embassies.some((e) => e.nation === 'AR' && e.emergency === '+50766161112'));
  for (const e of embassies) {
    assert.equal(e.country, 'PA');
    assert.ok(e.lat > 8 && e.lat < 10 && e.lng < -79 && e.lng > -81);
    for (const mode of ['walking', 'driving'] as const) {
      const u = new URL(directionsUrl(e, mode));
      assert.equal(u.searchParams.get('travelmode'), mode);
      assert.ok(u.searchParams.get('destination')?.includes(e.address));
      assert.equal(u.searchParams.has('origin'), false);
    }
  }
});

test('nationality selects only the mission for the current host country', async () => {
  const { embassyFor } = await import('../src/lib/embassies.ts');
  assert.equal(embassyFor('PA', 'CO')?.id, 'co-pa');
  assert.equal(embassyFor('PA', 'US')?.id, 'us-pa');
  assert.equal(embassyFor('PA', ''), undefined);
  assert.equal(embassyFor('PA', 'BR'), undefined);
  assert.equal(embassyFor('CL', 'CO'), undefined);
});

test('consular fallback scopes Chile Panama notice and local directory correctly', async () => {
  const { consularFallback } = await import('../src/lib/embassies.ts');
  assert.match(consularFallback('PA', 'CL')!.url, /emergencia-panama/);
  assert.equal(consularFallback('CO', 'CL')!.url, 'https://www.chile.gob.cl/consulados');
  assert.match(consularFallback('CL', 'CO')!.url, /cancilleria.gov.co/);
  assert.match(consularFallback('CL', 'FR')!.url, /consulados-extranjeros/);
  assert.equal(consularFallback('CL', ''), null);
});
