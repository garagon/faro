import { destinations } from '../data/destinations/index.ts';
import type { Localized } from './i18n.ts';
export type { Lang } from './i18n.ts';
export type Resource = {
  name: string;
  category: Localized;
  description: Localized;
  url: string;
  country: string;
  reviewedAt: string;
};
export const resources: Resource[] = [
  ...destinations.flatMap((d) => d.resources.map((r) => ({ ...r, country: d.code }))),
  {
    name: 'USGS',
    country: '*',
    category: ['Fuente sísmica mundial', 'Global earthquake source', 'Fonte sísmica mundial'],
    description: [
      'Sismos publicados por USGS. La cobertura varía según la región.',
      'Earthquakes published by USGS. Coverage varies by region.',
      'Terremotos publicados pelo USGS. A cobertura varia conforme a região.',
    ],
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php',
    reviewedAt: '2026-10-11',
  },
];
export type HotelPlan = {
  name: string;
  meeting: string;
  notes: string;
  lat: string;
  lng: string;
  savedAt: number;
  country: string;
};
export function validPlan(x: unknown): x is HotelPlan {
  if (x === null || typeof x !== 'object' || Array.isArray(x)) return false;
  const p = x as Record<string, unknown>;
  return (
    !!p &&
    ['name', 'meeting', 'notes', 'lat', 'lng', 'country'].every((k) => typeof p[k] === 'string') &&
    Number.isFinite(p.savedAt)
  );
}
export function planCoordinates(p: HotelPlan | null): [number, number] | null {
  if (!p || !p.lat.trim() || !p.lng.trim()) return null;
  const lat = Number(p.lat),
    lng = Number(p.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    ? [lat, lng]
    : null;
}
