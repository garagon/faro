import type { Bounds } from './domain.ts';
import { langTag, type Lang } from './i18n.ts';

/**
 * Faro does not store map tiles: Google's terms and the map providers' policies forbid it, and
 * so does AGENTS.md. For a map without signal, Faro opens the area in Google Maps, whose app
 * downloads it with its own offline-maps feature. The address carries only a rounded centre
 * (about 1 km) and a zoom, and opens only when the person taps it.
 */
export function googleMapsArea(view: { lat: number; lng: number; zoom: number }) {
  const { lat, lng, zoom } = view;
  if (![lat, lng, zoom].every(Number.isFinite) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
    return '';
  // City scale: a whole-country frame is too large to download in one piece.
  const z = Math.min(15, Math.max(11, Math.round(zoom)));
  const params = new URLSearchParams({
    api: '1',
    map_action: 'map',
    center: `${lat.toFixed(2)},${lng.toFixed(2)}`,
    zoom: String(z),
  });
  return `https://www.google.com/maps/@?${params}`;
}

/** The centre and approximate zoom of what Faro's map shows, for when there is no saved stay. */
export function boundsView(b: Bounds) {
  const width = b.east > b.west ? b.east - b.west : b.east - b.west + 360;
  const lng = b.west + width / 2;
  return {
    lat: (b.south + b.north) / 2,
    lng: lng > 180 ? lng - 360 : lng,
    zoom: Math.log2(360 / width),
  };
}

/** Google's own help page for offline maps, in the reader's language. */
export const offlineMapsHelp = (lang: Lang) =>
  `https://support.google.com/maps/answer/6291838?hl=${langTag(lang)}`;
