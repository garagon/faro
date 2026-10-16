import boundaries from '../data/countryBoundaries.json' with { type: 'json' };
import { segmentDistanceKm } from './coast.ts';

type Polygon = number[][][];
const countries = boundaries as Record<string, Polygon[]>;
const wrap = (n: number) => ((((n + 180) % 360) + 360) % 360) - 180;
function inRing(lat: number, lng: number, ring: number[][]) {
  const anchor = ring[0][0];
  const x = wrap(lng - anchor);
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[i],
      [bx, by] = ring[j];
    const a = wrap(ax - anchor),
      b = wrap(bx - anchor);
    if (ay > lat !== by > lat && x < ((b - a) * (lat - ay)) / (by - ay) + a) inside = !inside;
  }
  return inside;
}
function onLand(lat: number, lng: number, polygons: Polygon[]) {
  return polygons.some(
    ([outer, ...holes]) => inRing(lat, lng, outer) && !holes.some((hole) => inRing(lat, lng, hole)),
  );
}
export function hasCountryBoundary(code: string) {
  return !!countries[code];
}
/**
 * Countries without a sea coast (the landlocked states, with Kosovo and the Vatican). Their
 * 100 km buffer below meets only neighbours' land, which is excluded, so it adds no sea. Azerbaijan,
 * Kazakhstan and Turkmenistan are not listed: their buffer reaches the Caspian Sea.
 */
const LANDLOCKED = new Set(
  (
    'AD AF AM AT BF BI BO BT BW BY CF CH CZ ET HU KG LA LI LS LU MD MK ML MN MW NE NP PY RS RW ' +
    'SK SM SS SZ TD TJ UG UZ VA XK ZM ZW'
  ).split(' '),
);
/** Whether the country view's 100 km buffer takes in sea, for the wording of its scope. */
export function reachesSea(code: string) {
  return hasCountryBoundary(code) && !LANDLOCKED.has(code);
}
/** Geographic browsing only: generalized borders + up to 100 km offshore, never a hazard zone. */
export function inCountryScope(event: { lat: number; lng: number }, code: string) {
  if (code === 'WORLD') return true;
  const polygons = countries[code];
  if (!polygons) return false;
  const { lat, lng } = event;
  if (onLand(lat, lng, polygons)) return true;
  const nearby = polygons.some(([ring]) =>
    ring.some((p, i) => i > 0 && segmentDistanceKm([lng, lat], ring[i - 1], p) <= 100),
  );
  if (!nearby) return false;
  // Nearby earthquakes on another country's land belong to that country's view.
  return !Object.entries(countries).some(
    ([other, land]) => other !== code && onLand(lat, lng, land),
  );
}

/** Approximate country on land only. Offshore browsing buffers are not a person's location. */
export function countryOnLand(point: { lat: number; lng: number }): string | null {
  if (
    !Number.isFinite(point.lat) ||
    !Number.isFinite(point.lng) ||
    Math.abs(point.lat) > 90 ||
    Math.abs(point.lng) > 180
  )
    return null;
  const matches = Object.entries(countries).filter(([, polygons]) =>
    onLand(point.lat, point.lng, polygons),
  );
  return matches.length === 1 ? matches[0][0] : null;
}
