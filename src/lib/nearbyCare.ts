import { langIndex, pick, type Lang, type Localized } from './i18n.ts';
/** Places Faro can search for nearby. The search runs on Google Maps only when the person taps. */
export type PlaceKind =
  'pharmacy' | 'hospital' | 'supermarket' | 'hardware' | 'electronics' | 'copies' | 'atm';
export type CareKind = PlaceKind;
export const placeTerms: Record<PlaceKind, Localized> = {
  pharmacy: ['farmacias', 'pharmacies', 'farmácias'],
  hospital: [
    'hospitales con urgencias',
    'hospitals with emergency departments',
    'hospitais com pronto-socorro',
  ],
  supermarket: ['supermercados', 'supermarkets', 'supermercados'],
  hardware: ['ferreterías', 'hardware stores', 'lojas de ferragens'],
  electronics: ['tiendas de electrónica', 'electronics stores', 'lojas de eletrônicos'],
  copies: ['papelerías y centros de copias', 'print and copy shops', 'papelarias e copiadoras'],
  atm: ['cajeros automáticos', 'ATMs', 'caixas eletrônicos'],
};
export function careSearchUrl(kind: PlaceKind, place: string, lang: Lang) {
  if (!place.trim()) return null;
  const query = `${placeTerms[kind][langIndex(lang)]} ${pick(lang, 'cerca de', 'near', 'perto de')} ${place.trim()}`;
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query })}`;
}
export function careCoordinates(lat: number, lng: number): string | null {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    ? `${lat.toFixed(3)}, ${lng.toFixed(3)}`
    : null;
}
