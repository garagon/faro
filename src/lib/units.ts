import type { Lang } from './i18n.ts';

/**
 * English shows U.S. customary units (miles, feet, gallons, mph); Spanish and Portuguese keep
 * metric. Values are stored and compared in metric, only what is shown changes. Official texts
 * keep the units they were published with.
 */
export const usUnits = (lang: Lang) => lang === 'en';

const KM_PER_MILE = 1.609344;
const M_PER_FOOT = 0.3048;
const L_PER_GALLON = 3.785411784;
const MPH_PER_KNOT = 1.150779;

/** Miles, rounded like the kilometers they replace. */
export const miles = (km: number) => Math.round(km / KM_PER_MILE);

/** A distance or depth given in km: "12 km" or "7 mi". */
export const distance = (km: number, lang: Lang) =>
  usUnits(lang) ? `${miles(km) || 0} mi` : `${Math.round(km) || 0} km`;

/** A published depth in full: "12.6 km", or in English "7.8 mi (12.6 km)" with the agency's figure. */
export const depthInFull = (km: number, lang: Lang) =>
  usUnits(lang) ? `${(km / KM_PER_MILE).toFixed(1)} mi (${km} km)` : `${km} km`;

/** A short length given in meters, such as location accuracy: "35 m", or "115 ft" and "1.9 mi". */
export function shortDistance(m: number, lang: Lang) {
  if (!usUnits(lang)) return `${Math.round(m)} m`;
  const feet = Math.round(m / M_PER_FOOT);
  if (feet < 1000) return `${feet} ft`;
  const mi = m / 1000 / KM_PER_MILE;
  return `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} mi`;
}

/** Water given in liters: "6 L", or U.S. gallons rounded up to a tenth so it never says less. */
export function volume(litres: number, lang: Lang) {
  if (!usUnits(lang)) return `${litres} L`;
  const gallons = Math.ceil(Math.round((litres / L_PER_GALLON) * 1000) / 100) / 10;
  return `${Number.isInteger(gallons) ? gallons : gallons.toFixed(1)} gal`;
}

/** Sustained wind given in knots, rounded to 5 as NHC advisories present it. */
export const windKmh = (kt: number) => Math.round((kt * 1.852) / 5) * 5;
export const windMph = (kt: number) => Math.round((kt * MPH_PER_KNOT) / 5) * 5;
export const wind = (kt: number, lang: Lang) =>
  usUnits(lang) ? `${windMph(kt)} mph` : `${windKmh(kt)} km/h`;
