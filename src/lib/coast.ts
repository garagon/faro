export type CoastLine = number[][];
const R = 6371,
  rad = (x: number) => (x * Math.PI) / 180;
function bearing(a: number[], b: number[]) {
  const dl = rad(b[0] - a[0]),
    p = rad(a[1]),
    q = rad(b[1]);
  return Math.atan2(
    Math.sin(dl) * Math.cos(q),
    Math.cos(p) * Math.sin(q) - Math.sin(p) * Math.cos(q) * Math.cos(dl),
  );
}
function arc(a: number[], b: number[]) {
  const x =
    Math.sin(rad(b[1] - a[1]) / 2) ** 2 +
    Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(rad(b[0] - a[0]) / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(x)));
}
export function segmentDistanceKm(point: number[], a: number[], b: number[]) {
  const d = arc(a, b);
  if (d < 1e-12) return arc(point, a) * R;
  const ap = arc(a, point),
    delta = bearing(a, point) - bearing(a, b);
  const along = Math.atan2(Math.sin(ap) * Math.cos(delta), Math.cos(ap));
  if (along < 0 || along > d) return Math.min(arc(point, a), arc(point, b)) * R;
  return Math.abs(Math.asin(Math.max(-1, Math.min(1, Math.sin(ap) * Math.sin(delta))))) * R;
}
export function coastDistanceKm(lat: number, lng: number, lines: CoastLine[]) {
  let min = Infinity;
  const point = [lng, lat];
  for (const line of lines)
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1],
        b = line[i];
      min = Math.min(min, segmentDistanceKm(point, a, b));
    }
  return Number.isFinite(min) ? min : null;
}

/**
 * Lines from `public/data/coastline.json`: the compact form (each line as integer steps on a
 * 0.001° grid, see scripts/simplify-coastline.mjs) or plain [lng, lat] pairs. Anything else fails.
 */
export function decodeCoastline(data: unknown): CoastLine[] {
  const d = data as { format?: unknown; lines?: unknown } | null;
  if (!d || !Array.isArray(d.lines)) throw Error('Invalid coastline');
  if (d.format === undefined) return d.lines as CoastLine[];
  if (d.format !== 'delta-1e-3') throw Error('Unknown coastline format');
  return (d.lines as unknown[]).map((steps) => {
    if (!Array.isArray(steps) || steps.length % 2) throw Error('Invalid coastline');
    const line: CoastLine = [];
    let x = 0,
      y = 0;
    for (let i = 0; i < steps.length; i += 2) {
      x += steps[i];
      y += steps[i + 1];
      line.push([x / 1000, y / 1000]);
    }
    return line;
  });
}
