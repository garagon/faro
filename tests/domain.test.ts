import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFeed, filterEvents, inBounds, distanceKm, type Quake } from '../src/lib/domain.ts';
const now = Date.parse('2026-10-11T12:00Z');
const feature = (id = 'x', overrides: Record<string, unknown> = {}) => ({
  id,
  geometry: { coordinates: [-80, 8, 10] },
  properties: {
    type: 'earthquake',
    mag: 4.5,
    time: now - 3600000,
    updated: now,
    url: 'https://earthquake.usgs.gov/earthquakes/eventpage/x',
    place: 'Test',
    status: 'reviewed',
    ...overrides,
  },
});
const feed = (features: unknown[]) => ({
  type: 'FeatureCollection',
  metadata: { generated: now },
  features,
});
test('rejects malformed feeds and dates instead of treating them as no danger', () => {
  assert.throws(() => parseFeed({}));
  assert.throws(() => parseFeed({ ...feed([]), metadata: { generated: 1e100 } }));
  assert.equal(parseFeed(feed([feature('x', { time: 1e100 })])).events.length, 0);
});
test('preserves coordinates, review and source but blocks untrusted outbound URLs', () => {
  const e = parseFeed(feed([feature('a', { url: 'https://evil.example/usgs' })])).events[0];
  assert.equal(e.lat, 8);
  assert.equal(e.lng, -80);
  assert.equal(e.reviewed, true);
  assert.equal(e.url, '');
});
test('same event revision never replaces a newer observation with an older one', () => {
  const e = parseFeed(
    feed([feature('a', { mag: 5, updated: now }), feature('a', { mag: 4, updated: now - 1000 })]),
  ).events;
  assert.equal(e.length, 1);
  assert.equal(e[0].mag, 5);
});
test('antimeridian and repeated-world bounds include both coasts without including Greenwich', () => {
  const q = parseFeed(feed([feature()])).events[0];
  assert.ok(inBounds({ ...q, lng: 179 }, { south: -90, north: 90, west: 170, east: 190 }));
  assert.ok(inBounds({ ...q, lng: -179 }, { south: -90, north: 90, west: 170, east: 190 }));
  assert.equal(inBounds({ ...q, lng: 0 }, { south: -90, north: 90, west: 170, east: 190 }), false);
  assert.ok(inBounds(q, { south: -90, north: 90, west: -270, east: 270 }));
});
test('filters omit expired, future, deep and low magnitude records', () => {
  const e = parseFeed(feed([feature()])).events[0];
  const list: Quake[] = [
    e,
    { ...e, id: 'old', time: now - 25 * 3600000 },
    { ...e, id: 'future', time: now + 3600000 },
    { ...e, id: 'small', mag: 2 },
    { ...e, id: 'deep', depth: 300 },
  ];
  assert.deepEqual(
    filterEvents(list, { south: 0, north: 20, west: -90, east: -70 }, 24, 4, 70, now).map(
      (e) => e.id,
    ),
    ['x'],
  );
});
test('unknown magnitude remains unknown; distance is approximately geodesic', () => {
  const e = parseFeed(feed([feature('n', { mag: null })])).events[0];
  assert.equal(e.mag, null);
  assert.ok(Math.abs(distanceKm([0, 0], [0, 1]) - 111.2) < 0.1);
});

test('all magnitudes includes valid negative magnitudes', () => {
  const q = {
    id: 'negative',
    lat: 0,
    lng: 0,
    depth: 1,
    mag: -0.5,
    place: 'Test',
    time: 100000000,
    updated: 100000000,
    url: '',
    reviewed: false,
    magType: 'ml',
  };
  const bounds = { south: -90, north: 90, west: -180, east: 180 };
  assert.equal(filterEvents([q], bounds, 24, 0, 800, 100000001).length, 1);
  assert.equal(filterEvents([q], bounds, 24, 2.5, 800, 100000001).length, 0);
});

// A received event may have happened much earlier; the two timestamps must stay separate.
import { createFeedTracker, ageLabel } from '../src/lib/feedUpdates.ts';
test('feed updates skip first load, keep event details, and survive unchanged polls', () => {
  const tracker = createFeedTracker();
  const old = parseFeed(feed([feature('old')])).events[0];
  const recent = { ...old, id: 'recent', place: 'Tonosí', mag: 4.2, time: now - 120000 };
  assert.deepEqual(tracker.observe([old], now), []);
  const updates = tracker.observe([recent, old], now + 60000);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].event.place, 'Tonosí');
  assert.equal(updates[0].event.mag, 4.2);
  assert.equal(updates[0].event.time, now - 120000);
  assert.equal(updates[0].receivedAt, now + 60000);
  assert.deepEqual(tracker.observe([recent, old], now + 120000), updates);
});
test('revisions and reappearing IDs do not become new earthquakes', () => {
  const tracker = createFeedTracker(),
    q = parseFeed(feed([feature()])).events[0];
  tracker.observe([q], now);
  assert.equal(tracker.observe([{ ...q, mag: 5 }], now + 60000).length, 0);
  tracker.observe([], now + 120000);
  assert.equal(tracker.observe([q], now + 180000).length, 0);
  const n = { ...q, id: 'another' };
  tracker.observe([q, n], now + 240000);
  const changes = tracker.observe([q, { ...n, mag: 5.1 }], now + 300000);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].receivedAt, now + 240000);
  assert.equal(changes[0].event.mag, 5.1);
});
test('late publications retain their occurrence time and respect geographic and magnitude filters', () => {
  const tracker = createFeedTracker(),
    q = parseFeed(feed([feature()])).events[0];
  tracker.observe([q], now);
  const late = { ...q, id: 'late', time: now - 10 * 3600000 };
  const outside = { ...q, id: 'outside', lat: 60, lng: 20 },
    small = { ...q, id: 'small', mag: 1 };
  const updates = tracker.observe([q, late, outside, small], now + 60000);
  const relevant = filterEvents(
    updates.map((u) => u.event),
    { south: 4, north: 12, west: -85, east: -75 },
    24,
    4,
    800,
    now + 60000,
  );
  assert.deepEqual(
    relevant.map((e) => e.id),
    ['late'],
  );
  assert.equal(updates.find((u) => u.event.id === 'late')?.event.time, late.time);
});
test('relative event ages remain explicit in both languages', () => {
  assert.equal(ageLabel(now - 120000, now, 'es'), 'hace 2 min');
  assert.equal(ageLabel(now - 7200000, now, 'en'), '2h ago');
});
