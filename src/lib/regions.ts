import countries from '../data/countries.json' with { type: 'json' };
import { destinationFor } from '../data/destinations/index.ts';
export const WORLD = { south: -90, north: 90, west: -180, east: 180 };
export const countryCodes = countries.map((c) => c.code);
export function regionFor(code: string) {
  const country = countries.find((c) => c.code === code);
  if (code === 'WORLD' || !country)
    return { bounds: WORLD, view: { lat: 15, lng: 0, zoom: 2, key: 0 } };
  const preset = destinationFor(code)?.region;
  if (preset) return { bounds: { ...preset.bounds }, view: { ...preset.view, key: 0 } };
  return {
    bounds: {
      south: Math.max(-90, country.lat - 7),
      north: Math.min(90, country.lat + 7),
      west: country.lng - 10,
      east: country.lng + 10,
    },
    view: { lat: country.lat, lng: country.lng, zoom: country.zoom, key: 0 },
  };
}
export function regionScope(code: string, lang: 'es' | 'en') {
  if (code === 'WORLD') return lang === 'es' ? 'Vista mundial' : 'Worldwide view';
  return (
    destinationFor(code)?.region.scope[lang === 'es' ? 0 : 1] ??
    (lang === 'es'
      ? 'Área aproximada alrededor del centro del país. Amplía el mapa para otras zonas.'
      : 'Approximate area around the country’s centre. Expand the map for other areas.')
  );
}
