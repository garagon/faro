import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseKit,
  parseKitPlan,
  kitItems,
  kitItemsFor,
  kitText,
  shoppingList,
  waterLitres,
  waterShown,
  planSummary,
} from '../src/data/emergencyKit.ts';
import { careSearchUrl, careCoordinates } from '../src/lib/nearbyCare.ts';
import { langIndex } from '../src/lib/i18n.ts';
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
test('downloadable kit includes all items, explicit checked state and source links in every language', () => {
  for (const lang of ['es', 'en', 'pt'] as const) {
    const result = kitText(lang, ['water']);
    for (const item of kitItems) assert.ok(result.includes(item.title[langIndex(lang)]));
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
test('kit plan storage accepts only known values and falls back to one person for three days', () => {
  assert.deepEqual(parseKitPlan(null), { people: 1, days: 3, hazards: [] });
  assert.deepEqual(parseKitPlan('{bad'), { people: 1, days: 3, hazards: [] });
  assert.deepEqual(
    parseKitPlan('{"people":40,"days":4,"hazards":["flood","meteor","flood","volcano"]}'),
    { people: 1, days: 3, hazards: ['flood', 'volcano'] },
  );
  assert.deepEqual(parseKitPlan('{"people":3,"days":7,"hazards":[]}'), {
    people: 3,
    days: 7,
    hazards: [],
  });
});
test('water uses the SENAPRED baseline and the Ready.gov gallon, rounded up', () => {
  assert.deepEqual(waterLitres({ people: 1, days: 3 }), { minimum: 6, ready: 12 });
  assert.deepEqual(waterLitres({ people: 2, days: 3 }), { minimum: 12, ready: 23 });
});
test('English shows the water in U.S. gallons, never less than the liters', () => {
  assert.deepEqual(waterShown({ people: 1, days: 3 }, 'es'), { minimum: '6 L', ready: '12 L' });
  assert.deepEqual(waterShown({ people: 1, days: 3 }, 'en'), {
    minimum: '1.6 gal',
    ready: '3 gal',
  });
  assert.deepEqual(waterShown({ people: 2, days: 7 }, 'en'), {
    minimum: '7.4 gal',
    ready: '14 gal',
  });
  const summary = planSummary('en', { people: 1, days: 3, hazards: [] });
  assert.ok(summary.includes('1.6 gal') && summary.includes('3 gal') && !/\d L\b/.test(summary));
  assert.ok(!planSummary('pt', { people: 1, days: 3, hazards: [] }).includes('gal'));
});
test('hazard items appear only for their hazards and missing items group by shop', () => {
  const base = kitItemsFor({ hazards: [] }).map((item) => item.id);
  assert.ok(!base.includes('mask') && !base.includes('drybag'));
  assert.ok(kitItemsFor({ hazards: ['volcano'] }).some((item) => item.id === 'mask'));
  assert.ok(kitItemsFor({ hazards: ['flood'] }).some((item) => item.id === 'drybag'));
  const all = kitItems.map((item) => item.id);
  assert.deepEqual(shoppingList(all, { hazards: ['volcano', 'flood'] }), []);
  const shops = shoppingList(['water'], { hazards: [] });
  const supermarket = shops.find((s) => s.store === 'supermarket')!;
  assert.ok(!supermarket.items.some((item) => item.id === 'water'));
  assert.ok(supermarket.items.some((item) => item.id === 'food'));
  assert.ok(!shops.some((s) => s.items.some((item) => !item.store)));
  const text = kitText('es', ['water'], { people: 2, days: 3, hazards: ['volcano'] });
  assert.ok(text.includes('al menos 12 L'));
  assert.ok(text.includes('Farmacia: Medicamentos y recetas'));
  assert.ok(!text.includes('Bolsa impermeable'));
});
test('shop searches use the same encoded query as health searches', () => {
  const url = new URL(careSearchUrl('hardware', 'Test Town', 'es')!);
  assert.equal(url.searchParams.get('query'), 'ferreterías cerca de Test Town');
  assert.equal(careSearchUrl('atm', '', 'en'), null);
});
