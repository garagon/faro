import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseKit, kitItems, kitText } from '../src/data/emergencyKit.ts';
import { careSearchUrl, careCoordinates } from '../src/lib/nearbyCare.ts';
import {
  consularMissions,
  missionsFor,
  missionDirections,
  mappedMissions,
} from '../src/data/consularMissions.ts';

test('checklist storage rejects invalid JSON, unrecognized IDs and duplicates', () => {
  assert.deepEqual(parseKit('{bad'), []);
  assert.deepEqual(parseKit('{"water":true}'), []);
  assert.deepEqual(parseKit('["water","water",null,"private-note",42,"food"]'), ['water', 'food']);
  assert.equal(new Set(kitItems.map((i) => i.id)).size, kitItems.length);
});
test('downloadable kit includes all items, explicit checked state and source links in both languages', () => {
  for (const lang of ['es', 'en'] as const) {
    const result = kitText(lang, ['water']);
    for (const item of kitItems) assert.ok(result.includes(item.title[lang === 'es' ? 0 : 1]));
    assert.equal((result.match(/\[x\]/g) || []).length, 1);
    assert.ok(result.includes('https://www.senapred.gov.cl/kit-de-emergencia/'));
  }
});
test('health searches require an explicit area and encode it rather than injecting URL parameters', () => {
  assert.equal(careSearchUrl('hospital', ' ', 'es'), null);
  const url = new URL(careSearchUrl('pharmacy', 'Test Town & region=another', 'en')!);
  assert.equal(url.origin, 'https://www.google.com');
  assert.equal(url.searchParams.get('query'), 'pharmacies near Test Town & region=another');
  assert.equal(url.searchParams.has('region'), false);
  assert.ok(careSearchUrl('hospital', 'Test Town', 'es')!.includes('hospitales'));
});
test('nearby care uses only approximate finite coordinates', () => {
  assert.equal(careCoordinates(8.1234567, -79.9876543), '8.123, -79.988');
  assert.equal(careCoordinates(0, 0), '0.000, 0.000');
  for (const [lat, lng] of [
    [NaN, 1],
    [1, Infinity],
    [91, 0],
    [0, -181],
  ])
    assert.equal(careCoordinates(lat, lng), null);
});
test('mission directory has unique records, dated official sources and separates countries', () => {
  assert.equal(new Set(consularMissions.map((m) => m.id)).size, consularMissions.length);
  assert.ok(missionsFor('PA', 'CO').length > 1);
  assert.deepEqual(missionsFor('CL', 'CO'), []);
  for (const m of consularMissions) {
    assert.equal(new URL(m.source).protocol, 'https:');
    assert.match(m.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
    for (const phone of [m.phone, m.emergency]) if (phone) assert.match(phone, /^\+\d{7,15}$/);
  }
});
test('historic honorary listings never produce phone links, directions or map pins', () => {
  const archived = consularMissions.filter((m) => m.historical);
  assert.ok(archived.length > 20);
  for (const m of archived) {
    assert.equal(m.phone, undefined);
    assert.equal(m.emergency, undefined);
    assert.equal(m.map, undefined);
    assert.equal(missionDirections(m, 'walking'), null);
  }
});
test('consular directions preserve the selected transport and require a sourced address', () => {
  const co = missionsFor('PA', 'CO').find((m) => m.kind === 'consulate')!;
  const route = new URL(missionDirections(co, 'walking')!);
  assert.ok(route.searchParams.get('destination')!.includes('Posada del Rey'));
  assert.equal(route.searchParams.get('travelmode'), 'walking');
  assert.equal(route.searchParams.has('origin'), false);
  assert.equal(missionDirections(missionsFor('PA', 'EC')[0], 'driving'), null);
});
test('only sourced map coordinates are exposed for the selected nationality', () => {
  assert.equal(mappedMissions('PA', 'CA').length, 1);
  assert.deepEqual(mappedMissions('PA', 'CL'), []);
  for (const m of mappedMissions('PA', 'CA')) {
    assert.equal(m.nation, 'CA');
    assert.ok(m.mapSource);
  }
});

test('uncertain office moves are not offered as directions or map pins', () => {
  const es = missionsFor('PA', 'ES').find((m) => m.kind === 'embassy')!;
  assert.equal(missionDirections(es, 'walking'), null);
  assert.deepEqual(mappedMissions('PA', 'ES'), []);
});

test('historic directions are blocked independently of the publication year', () => {
  const record = { ...missionsFor('PA', 'CA')[0], historical: true, sourceDate: '2025-07' };
  assert.equal(missionDirections(record, 'driving'), null);
});
