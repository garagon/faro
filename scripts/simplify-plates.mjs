// Builds public/data/plates.json, the tectonic plate boundaries drawn on the map as context:
// PB2002 (Bird, 2003) as converted to GeoJSON by Hugo Ahlenius / Nordpil, Open Data Commons
// Attribution License 1.0. Douglas–Peucker at 0.02° and two decimals (about 1 km): a thin line at
// map scale, not a fault map. Each feature keeps only the two plate codes.
// Usage: node scripts/simplify-plates.mjs <PB2002_boundaries.json> <output.json>
import { readFileSync, writeFileSync } from 'node:fs';

const [input, output] = process.argv.slice(2);
if (!input || !output) throw Error('Usage: simplify-plates.mjs <input.json> <output.json>');
const TOLERANCE = 0.02;

function simplify(points, eps) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [x1, y1] = points[a],
      [x2, y2] = points[b];
    const dx = x2 - x1,
      dy = y2 - y1,
      len2 = dx * dx + dy * dy;
    let max = 0,
      at = -1;
    for (let i = a + 1; i < b; i++) {
      const [x, y] = points[i];
      const t = len2 ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / len2)) : 0;
      const d = Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
      if (d > max) [max, at] = [d, i];
    }
    if (max > eps) {
      keep[at] = 1;
      stack.push([a, at], [at, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const source = JSON.parse(readFileSync(input, 'utf8'));
if (source.type !== 'FeatureCollection' || !Array.isArray(source.features))
  throw Error('Expected a GeoJSON FeatureCollection');
const round = (n) => Math.round(n * 100) / 100;
const features = [];
let before = 0,
  after = 0;
for (const f of source.features) {
  const g = f.geometry;
  const lines =
    g?.type === 'LineString' ? [g.coordinates] : g?.type === 'MultiLineString' ? g.coordinates : [];
  for (const line of lines) {
    if (!line.every((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))) continue;
    before += line.length;
    const kept = simplify(line, TOLERANCE).map(([x, y]) => [round(x), round(y)]);
    // Rounding can repeat a point; consecutive duplicates are dropped.
    const clean = kept.filter(
      (p, i) => i === 0 || p[0] !== kept[i - 1][0] || p[1] !== kept[i - 1][1],
    );
    if (clean.length < 2) continue;
    after += clean.length;
    features.push({
      type: 'Feature',
      properties: { a: String(f.properties?.PlateA ?? ''), b: String(f.properties?.PlateB ?? '') },
      geometry: { type: 'LineString', coordinates: clean },
    });
  }
}
writeFileSync(
  output,
  JSON.stringify({
    type: 'FeatureCollection',
    source: 'PB2002, Bird (2003); GeoJSON by Hugo Ahlenius, Nordpil; ODC-By 1.0',
    features,
  }),
);
console.log(`${features.length} lines, ${before} → ${after} points`);
