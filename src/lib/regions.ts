import countries from '../data/countries.json' with { type: 'json' };
export const WORLD = { south: -90, north: 90, west: -180, east: 180 };
const PANAMA = { south: 4, north: 12, west: -85, east: -75 };
export const countryCodes = countries.map((c) => c.code);
export function regionFor(code: string) {
  if (code === 'WORLD') return { bounds: WORLD, view: { lat: 15, lng: 0, zoom: 2, key: 0 } };
  if (code === 'PA') return { bounds: PANAMA, view: { lat: 8.5, lng: -80, zoom: 6, key: 0 } };
  const c = countries.find((c) => c.code === code)!;
  return {
    bounds: {
      south: Math.max(-90, c.lat - 7),
      north: Math.min(90, c.lat + 7),
      west: c.lng - 10,
      east: c.lng + 10,
    },
    view: { lat: c.lat, lng: c.lng, zoom: c.zoom, key: 0 },
  };
}
