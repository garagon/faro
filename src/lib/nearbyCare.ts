export type CareKind = 'pharmacy' | 'hospital';
export function careSearchUrl(kind: CareKind, place: string, lang: 'es' | 'en') {
  const terms = {
    pharmacy: ['farmacias', 'pharmacies'],
    hospital: ['hospitales con urgencias', 'hospitals with emergency departments'],
  };
  if (!place.trim()) return null;
  const query = `${terms[kind][lang === 'es' ? 0 : 1]} ${lang === 'es' ? 'cerca de' : 'near'} ${place.trim()}`;
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query })}`;
}
export function careCoordinates(lat: number, lng: number): string | null {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    ? `${lat.toFixed(3)}, ${lng.toFixed(3)}`
    : null;
}
