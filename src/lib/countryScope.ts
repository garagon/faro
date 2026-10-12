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
