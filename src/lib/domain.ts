export type Quake = {
  id: string;
  source?: 'IGC' | 'USGS';
  lat: number;
  lng: number;
  depth: number;
  mag: number | null;
  place: string;
  time: number;
  updated: number;
  url: string;
  reviewed: boolean;
  magType: string;
};
export type Bounds = { south: number; north: number; west: number; east: number };
export type Feed = { events: Quake[]; generated: number };
const validDate = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n > 0 && n < 8.64e15;
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
export function parseFeed(raw: unknown): Feed {
  const d = record(raw);
  const metadata = record(d.metadata);
  if (
    d?.type !== 'FeatureCollection' ||
    !Array.isArray(d.features) ||
    !validDate(metadata.generated)
  )
    throw new Error('Respuesta de USGS no válida');
  const events: Quake[] = [];
  for (const feature of d.features) {
    const f = record(feature);
    const p = record(f.properties);
    const coordinates = record(f.geometry).coordinates;
    const c = Array.isArray(coordinates) ? coordinates.slice(0, 3) : [];
    if (!c.every(finite)) continue;
    if (
      typeof f?.id !== 'string' ||
      p?.type !== 'earthquake' ||
      !Array.isArray(c) ||
      !c.slice(0, 3).every(finite) ||
      c.length < 3 ||
      Math.abs(c[1]) > 90 ||
      Math.abs(c[0]) > 180 ||
      !validDate(p.time) ||
      !validDate(p.updated)
    )
      continue;
    let url = '';
    try {
      const u = new URL(typeof p.url === 'string' ? p.url : '');
      if (u.protocol === 'https:' && u.hostname === 'earthquake.usgs.gov') url = u.href;
    } catch {}
    events.push({
      id: f.id,
      lat: c[1],
      lng: c[0],
      depth: c[2],
      mag: finite(p.mag) ? p.mag : null,
      place: typeof p.place === 'string' ? p.place : 'Localización sin nombre',
      time: p.time,
      updated: p.updated,
      url,
      reviewed: p.status === 'reviewed',
      magType: typeof p.magType === 'string' ? p.magType : '',
    });
  }
  const unique = new Map<string, Quake>();
  for (const e of events) {
    const old = unique.get(e.id);
    if (!old || e.updated > old.updated) unique.set(e.id, e);
  }
  return { events: [...unique.values()], generated: metadata.generated };
}
export function inBounds(e: Quake, b: Bounds) {
  if (e.lat < b.south || e.lat > b.north) return false;
  if (b.east - b.west >= 360) return true;
  const norm = (n: number) => ((((n + 180) % 360) + 360) % 360) - 180;
  const w = norm(b.west),
    r = norm(b.east),
    x = norm(e.lng);
  return w <= r ? x >= w && x <= r : x >= w || x <= r;
}
export function filterEvents(
  events: Quake[],
  b: Bounds,
  hours: number,
  minMag: number,
  maxDepth: number,
  now: number,
) {
  return events
    .filter(
      (e) =>
        inBounds(e, b) &&
        e.time >= now - hours * 3600000 &&
        e.time <= now + 60000 &&
        (minMag === 0 || (e.mag !== null && e.mag >= minMag)) &&
        e.depth <= maxDepth,
    )
    .sort((a, b) => b.time - a.time);
}
export function distanceKm(a: [number, number], b: [number, number]) {
  const rad = (x: number) => (x * Math.PI) / 180;
  const dlat = rad(b[0] - a[0]),
    dlng = rad(b[1] - a[1]);
  return (
    6371 *
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin(dlat / 2) ** 2 +
          Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dlng / 2) ** 2,
      ),
    )
  );
}
export const FEED_URL =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';
