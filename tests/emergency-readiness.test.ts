import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseFeed } from '../src/lib/domain.ts';
import { intensityLabel, pagerLabel, usgsEventLink } from '../src/lib/impact.ts';
import { offlineRoute, precacheList, PUBLIC_SHELL } from '../src/lib/offline.ts';
import { emergencyKinds, generalSteps, hazardSteps } from '../src/data/firstMinutes.ts';
import { responseAge, validAdapterEvent } from '../src/catalogs/adapter.ts';

const now = Date.parse('2026-10-13T12:00Z');
const usgs = (properties: Record<string, unknown>) =>
  parseFeed({
    type: 'FeatureCollection',
    metadata: { generated: now },
    features: [
      {
        id: 'us7000test',
        geometry: { coordinates: [-80, 7.5, 10] },
        properties: {
          type: 'earthquake',
          mag: 6.1,
          time: now - 60000,
          updated: now,
          url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us7000test',
          place: 'Panama',
          ...properties,
        },
      },
    ],
  }).events[0];

test('USGS impact products are kept as published and unknown values stay unknown', () => {
  const e = usgs({ alert: 'yellow', felt: 412, cdi: 6.3, mmi: 7.12, tsunami: 1 });
  assert.equal(e.source, 'USGS');
  assert.deepEqual(e.impact, { alert: 'yellow', felt: 412, cdi: 6.3, mmi: 7.12, tsunami: true });
  const unknown = usgs({ alert: 'purple', felt: null, cdi: 'x', mmi: 40, tsunami: '1' });
  assert.deepEqual(unknown.impact, {
    alert: null,
    felt: null,
    cdi: null,
    mmi: null,
    tsunami: false,
  });
});

test('intensity and PAGER labels use the published value, never a local estimate', () => {
  assert.equal(intensityLabel(7.12, 'en'), 'VII · Very strong');
  assert.equal(intensityLabel(6.3, 'es'), 'VI · Fuerte');
  assert.equal(intensityLabel(0.2, 'en'), 'I · Not felt');
  assert.equal(intensityLabel(11.6, 'en'), 'XII · Extreme');
  assert.equal(pagerLabel('orange', 'es'), 'Naranja');
});

test('event page sections are only derived from USGS event pages', () => {
  const page = 'https://earthquake.usgs.gov/earthquakes/eventpage/us7000test';
  assert.equal(usgsEventLink(page, 'tellus'), `${page}/tellus`);
  assert.equal(usgsEventLink(`${page}/`, 'shakemap'), `${page}/shakemap`);
  assert.equal(usgsEventLink('https://evil.example/earthquakes/eventpage/x', 'pager'), null);
  assert.equal(usgsEventLink(`${page}/executive`, 'pager'), null);
  assert.equal(usgsEventLink('', 'pager'), null);
});

test('offline storage never serves official data, maps or other sites from cache', () => {
  const origin = 'https://faro.example';
  const stored = new Set(precacheList(['assets/main-abc.js', 'assets/main-abc.css', 'sw.js']));
  const route = (url: string, mode = 'cors', method = 'GET') =>
    offlineRoute({ url, mode, method }, origin, stored);
  assert.equal(route(`${origin}/api/igc`), 'network');
  assert.equal(route(`${origin}/api/emsc`, 'navigate'), 'network');
  assert.equal(route('https://earthquake.usgs.gov/feed.geojson'), 'network');
  assert.equal(route('https://tile.openstreetmap.org/1/1/1.png'), 'network');
  assert.equal(route(`${origin}/assets/main-abc.js`, 'cors', 'POST'), 'network');
  assert.equal(route(`${origin}/`, 'navigate'), 'navigate');
  assert.equal(route(`${origin}/assets/main-abc.js`), 'precache');
  assert.equal(route(`${origin}/assets/main-abc.js?x=1`), 'network');
  assert.equal(route(`${origin}/data/coastline.json`), 'runtime');
  assert.ok(!stored.has('/sw.js'));
  for (const file of PUBLIC_SHELL) assert.ok(stored.has(file));
});

test('the offline worker is built as one classic script with an injected file list', async () => {
  const worker = await readFile(new URL('../src/sw.ts', import.meta.url), 'utf8');
  const config = await readFile(new URL('../vite.config.ts', import.meta.url), 'utf8');
  assert.match(worker, /\['__FARO_PRECACHE__'\]/);
  // Servers can send `Vary: Origin`; a lookup that respects it misses stored scripts offline.
  assert.match(worker, /ignoreVary: true/);
  assert.match(config, /single classic script/);
  // Registration lives in main.tsx so it never shares a chunk with the worker.
  const main = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(main, /lib\/offline/);
});

test('first-minute steps cover each hazard, are bilingual, cited and lead to existing actions', () => {
  assert.deepEqual(
    emergencyKinds.map((k) => k.id),
    ['earthquake', 'hurricane', 'flood'],
  );
  for (const kind of emergencyKinds) {
    const steps = [...hazardSteps[kind.id], ...generalSteps];
    assert.equal(new Set(steps.map((s) => s.id)).size, steps.length, kind.id);
    assert.ok(hazardSteps[kind.id].length >= 4, kind.id);
    for (const step of steps) {
      assert.ok(
        step.text.every((x) => x.trim().length > 10),
        step.id,
      );
      assert.equal(new URL(step.source.url).protocol, 'https:');
      assert.ok(!step.action || ['call', 'tsunami', 'status'].includes(step.action));
    }
  }
  assert.equal(hazardSteps.earthquake[0].id, 'shaking');
  // Calling the local number is always available, whatever the person selected.
  assert.equal(generalSteps[0].action, 'call');
});

test('adapter rows must link to their own agency and carry a plausible age', () => {
  const row = {
    id: 'emsc-1',
    source: 'EMSC',
    lat: 8,
    lng: -82,
    depth: 10,
    mag: 4.7,
    place: 'Panama-Costa Rica Border Region',
    time: now,
    updated: now,
    url: 'https://www.emsc-csem.org/Earthquake_information/earthquake.php?id=1',
    reviewed: false,
    magType: 'm',
    authority: 'UNA',
  };
  const hosts = ['www.emsc-csem.org', 'www.seismicportal.eu'];
  assert.equal(validAdapterEvent(row, 'EMSC', hosts), true);
  assert.equal(
    validAdapterEvent({ ...row, url: 'http://www.emsc-csem.org/x' }, 'EMSC', hosts),
    false,
  );
  assert.equal(validAdapterEvent({ ...row, url: 'https://evil.example/' }, 'EMSC', hosts), false);
  assert.equal(validAdapterEvent({ ...row, source: 'IGC' }, 'EMSC', hosts), false);
  assert.equal(validAdapterEvent({ ...row, authority: 5 }, 'EMSC', hosts), false);
  assert.equal(responseAge({ age: 90000 }), 90000);
  for (const age of [-1, '5', 1e12, null]) assert.equal(responseAge({ age }), 0);
});

test('adapter snapshots are kept locally and an unreadable or future copy is ignored', async () => {
  const store = new Map<string, string>();
  // Reading Node's own localStorage getter prints a warning; swap the property descriptor instead.
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    },
  });
  const { adapterReader } = await import('../src/catalogs/adapter.ts');
  const reader = adapterReader('/api/test', 'EMSC', ['www.emsc-csem.org'], 'faro-test-v1');
  const row = {
    id: 'emsc-1',
    source: 'EMSC',
    lat: 8,
    lng: -82,
    depth: 10,
    mag: 4.7,
    place: 'Panama',
    time: now,
    updated: now,
    url: 'https://www.emsc-csem.org/Earthquake_information/earthquake.php?id=1',
    reviewed: false,
    magType: 'm',
  };
  store.set('faro-test-v1', JSON.stringify({ events: [row, { id: 'bad' }], fetched: now }));
  assert.deepEqual(
    reader.cached?.()?.events.map((e) => e.id),
    ['emsc-1'],
  );
  store.set('faro-test-v1', JSON.stringify({ events: [row], fetched: Date.now() + 3600000 }));
  assert.equal(reader.cached?.(), null);
  if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
});

test('US territories show 911 and unknown places show no invented number', async () => {
  const { emergencyFor } = await import('../src/lib/emergency.ts');
  for (const code of ['PR', 'VI', 'GU', 'AS', 'MP'])
    assert.deepEqual(
      emergencyFor(code)?.numbers.map((n) => n.number),
      ['911'],
    );
  assert.equal(emergencyFor('ZZ'), undefined);
});

test('record ids work on pages without randomUUID', async () => {
  const { newId } = await import('../src/lib/id.ts');
  const original = crypto.randomUUID;
  try {
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });
    const a = newId();
    assert.match(a, /^[0-9a-f]{32}$/);
    assert.notEqual(a, newId());
  } finally {
    Object.defineProperty(crypto, 'randomUUID', { value: original, configurable: true });
  }
});

test('a disaster summary is shown at most 14 days after its last review', async () => {
  const { activeResponses } = await import('../src/data/responses.ts');
  for (const r of activeResponses) {
    const days = (Date.parse(r.showUntil) - Date.parse(r.reviewedAt)) / 86_400_000;
    assert.ok(days >= 0 && days <= 14, `${r.id}: ${days} days`);
  }
});

test('emergency numbers are re-reviewed at least every 90 days', async () => {
  // Fails on purpose once a directory goes stale, so a release cannot ship old numbers.
  const { destinations } = await import('../src/data/destinations/index.ts');
  for (const d of destinations) {
    if (!d.emergency) continue;
    const age = (Date.now() - Date.parse(d.emergency.reviewedAt)) / 86_400_000;
    assert.ok(age <= 90, `${d.code} emergency numbers reviewed ${Math.round(age)} days ago`);
  }
});
