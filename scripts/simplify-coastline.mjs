// Rebuilds public/data/coastline.json in a compact form for the "distance to the coast" estimate:
// Douglas–Peucker at 0.003° (about 330 m), coordinates on a 0.001° grid, each line stored as
// integer steps from the previous point. Faro rounds that distance to whole kilometres and
// compares it with 20 km, so the added error (well under 1 km) does not change what it says.
// Usage: node scripts/simplify-coastline.mjs <input.json> <output.json>
import { readFileSync, writeFileSync } from 'node:fs';

const [input, output] = process.argv.slice(2);
if (!input || !output) throw Error('Usage: simplify-coastline.mjs <input.json> <output.json>');
const TOLERANCE = 0.003;
const GRID = 1000;

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

const data = JSON.parse(readFileSync(input, 'utf8'));
if (!Array.isArray(data.lines) || data.format)
  throw Error('Expected the original [lng, lat] lines');
const lines = [];
for (const line of data.lines) {
  const grid = simplify(line, TOLERANCE).map(([x, y]) => [
    Math.round(x * GRID),
    Math.round(y * GRID),
  ]);
  const steps = [];
  let px = 0,
    py = 0;
  for (const [x, y] of grid) {
    if (steps.length && x === px && y === py) continue;
    steps.push(x - px, y - py);
    [px, py] = [x, y];
  }
  if (steps.length >= 4) lines.push(steps);
}
writeFileSync(
  output,
  JSON.stringify({
    source: data.source,
    scale: data.scale,
    retrieved: data.retrieved,
    format: 'delta-1e-3',
    simplified: `Douglas-Peucker ${TOLERANCE} degrees, ${1 / GRID} degree grid`,
    lines,
  }),
);
