import test from 'node:test';
import assert from 'node:assert/strict';
import { isLang, langIndex, langTag, pick } from '../src/lib/i18n.ts';
import { boundsView, googleMapsArea, offlineMapsHelp } from '../src/lib/offlineMap.ts';

test('three interface languages, each with its own text and tag', () => {
  assert.equal(pick('es', 'hola', 'hello', 'olá'), 'hola');
  assert.equal(pick('en', 'hola', 'hello', 'olá'), 'hello');
  assert.equal(pick('pt', 'hola', 'hello', 'olá'), 'olá');
  assert.deepEqual(
    (['es', 'en', 'pt'] as const).map((l) => langIndex(l)),
    [0, 1, 2],
  );
  assert.equal(langTag('pt'), 'pt-BR');
  assert.equal(langTag('es'), 'es');
  assert.ok(isLang('pt') && isLang('es') && isLang('en'));
  assert.ok(!isLang('pt-BR') && !isLang('fr') && !isLang(undefined));
});

test('the offline map link opens a rounded area in Google Maps and nothing else', () => {
  const url = new URL(googleMapsArea({ lat: 8.983456, lng: -79.51987, zoom: 7 }));
  assert.equal(url.origin + url.pathname, 'https://www.google.com/maps/@');
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.get('map_action'), 'map');
  // About 1 km: the saved stay or map view is not sent precisely.
  assert.equal(url.searchParams.get('center'), '8.98,-79.52');
  // City scale, so the area can be downloaded in one piece.
  assert.equal(url.searchParams.get('zoom'), '11');
  assert.equal(googleMapsArea({ lat: 8.98, lng: -79.52, zoom: 18 }).endsWith('zoom=15'), true);
  assert.equal(googleMapsArea({ lat: 95, lng: 0, zoom: 12 }), '');
  assert.equal(googleMapsArea({ lat: Number.NaN, lng: 0, zoom: 12 }), '');
  assert.equal(new URL(offlineMapsHelp('pt')).searchParams.get('hl'), 'pt-BR');
});

test('without a saved stay, the offline area is the centre of what the map shows', () => {
  const view = boundsView({ south: 8.9, north: 9.1, west: -79.6, east: -79.4 });
  assert.ok(Math.abs(view.lat - 9) < 1e-9 && Math.abs(view.lng + 79.5) < 1e-9);
  // A 0.2° wide view is about zoom 11; a whole country is clamped to city scale in the link.
  assert.equal(Math.round(view.zoom), 11);
  const country = boundsView({ south: 7, north: 9.7, west: -83, east: -77 });
  assert.ok(googleMapsArea(country).endsWith('zoom=11'));
  // A view across the antimeridian keeps a valid longitude.
  assert.equal(boundsView({ south: -20, north: -10, west: 170, east: -170 }).lng, 180);
});
