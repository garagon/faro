import { type Lang, type Localized } from './i18n.ts';
/** Active tropical cyclone from NOAA's National Hurricane Center (CPHC for central Pacific bins). */
export type Storm = {
  id: string;
  bin: string;
  name: string;
  classification: StormClass;
  intensityKt: number | null;
  pressureMb: number | null;
  lat: number;
  lng: number;
  advisory: string;
  issued: number;
  updated: number;
  /** The Spanish advisory slot was checked to name this storm. */
  spanish: boolean;
};
export type StormClass = 'TD' | 'STD' | 'TS' | 'STS' | 'HU' | 'TY' | 'PTC' | 'PC';
export type StormsSnapshot = { storms: Storm[]; fetched: number };

const CLASSES: readonly StormClass[] = ['TD', 'STD', 'TS', 'STS', 'HU', 'TY', 'PTC', 'PC'];
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

function validStorm(value: unknown): Storm | null {
  const s = value as Record<string, unknown> | null;
  if (
    !s ||
    typeof s.id !== 'string' ||
    !/^(al|ep|cp)\d{6}$/.test(s.id) ||
    typeof s.bin !== 'string' ||
    !/^(AT|EP|CP)[1-5]$/.test(s.bin) ||
    !CLASSES.includes(s.classification as StormClass) ||
    !finite(s.lat) ||
    Math.abs(s.lat) > 90 ||
    !finite(s.lng) ||
    Math.abs(s.lng) > 180
  )
    return null;
  return {
    id: s.id,
    bin: s.bin,
    name: typeof s.name === 'string' ? s.name.slice(0, 40) : '',
    classification: s.classification as StormClass,
    intensityKt: finite(s.intensityKt) ? s.intensityKt : null,
    pressureMb: finite(s.pressureMb) ? s.pressureMb : null,
    lat: s.lat,
    lng: s.lng,
    advisory:
      typeof s.advisory === 'string' && /^\d{1,3}[a-z]?$/i.test(s.advisory) ? s.advisory : '',
    issued: finite(s.issued) ? s.issued : 0,
    updated: finite(s.updated) ? s.updated : 0,
    spanish: s.spanish === true,
  };
}

/** An empty list is a valid answer: NHC has issued no forecast in the last 12 hours. */
export function parseStorms(value: unknown, received = Date.now()): StormsSnapshot {
  const d = value as { storms?: unknown; age?: unknown } | null;
  if (!d || !Array.isArray(d.storms)) throw Error('Invalid NHC response');
  const storms = d.storms.map(validStorm).filter((s): s is Storm => !!s);
  if (d.storms.length > 0 && storms.length === 0) throw Error('Invalid NHC response');
  const age = finite(d.age) && d.age >= 0 && d.age <= 24 * 3600000 ? d.age : 0;
  return { storms, fetched: received - age };
}

// NHC Spanish terms (its Spanish products use "huracán", "tormenta tropical", "pos-tropical").
export const stormClassLabels: Record<StormClass, Localized> = {
  HU: ['Huracán', 'Hurricane', 'Furacão'],
  TY: ['Tifón', 'Typhoon', 'Tufão'],
  TS: ['Tormenta tropical', 'Tropical storm', 'Tempestade tropical'],
  STS: ['Tormenta subtropical', 'Subtropical storm', 'Tempestade subtropical'],
  TD: ['Depresión tropical', 'Tropical depression', 'Depressão tropical'],
  STD: ['Depresión subtropical', 'Subtropical depression', 'Depressão subtropical'],
  PTC: ['Ciclón pos-tropical', 'Post-tropical cyclone', 'Ciclone pós-tropical'],
  PC: ['Ciclón tropical potencial', 'Potential tropical cyclone', 'Ciclone tropical potencial'],
};
export const basinLabels: Record<string, Localized> = {
  AT: ['Atlántico', 'Atlantic', 'Atlântico'],
  EP: ['Pacífico oriental', 'Eastern Pacific', 'Pacífico oriental'],
  CP: ['Pacífico central', 'Central Pacific', 'Pacífico central'],
};
export const basinOf = (s: Storm) => s.bin.slice(0, 2);
/** Central Pacific bins are issued by CPHC in Honolulu. */
export const issuerOf = (s: Storm) => (basinOf(s) === 'CP' ? 'CPHC' : 'NHC');

/**
 * Advisory page; the machine-translated Spanish one only when it was checked to name this storm.
 * NHC publishes nothing in Portuguese, so Portuguese readers get the original English advisory.
 */
export function advisoryUrl(s: Storm, lang: Lang) {
  const office = issuerOf(s) === 'CPHC' ? 'HFO' : 'MIA';
  const product = lang === 'es' && s.spanish && office === 'MIA' ? 'TAS' : 'TCP';
  return `https://www.nhc.noaa.gov/text/${office}${product}${s.bin}.shtml`;
}
export const graphicsUrl = (s: Storm) =>
  `https://www.nhc.noaa.gov/graphics_${s.bin.toLowerCase()}.shtml`;

/** Maximum sustained wind in km/h or mph, rounded to 5 as NHC advisories present it. */
export { wind, windKmh, windMph } from './units.ts';

export function position(s: Storm) {
  return `${Math.abs(s.lat).toFixed(1)}°${s.lat >= 0 ? 'N' : 'S'} ${Math.abs(s.lng).toFixed(1)}°${s.lng >= 0 ? 'E' : 'W'}`;
}

// Advisories come every six hours (three with coastal warnings); older ones may be superseded.
export const ADVISORY_STALE = 6.5 * 3600000;

/** Places in the NHC/CPHC forecast basins, where its storms are relevant context. */
export const NHC_REGION: readonly string[] = [
  'US',
  'CA',
  'MX',
  'GT',
  'BZ',
  'SV',
  'HN',
  'NI',
  'CR',
  'PA',
  'CO',
  'VE',
  'GY',
  'SR',
  'GF',
  'CU',
  'JM',
  'HT',
  'DO',
  'PR',
  'VI',
  'VG',
  'BS',
  'KY',
  'TC',
  'BM',
  'AG',
  'AI',
  'AW',
  'BB',
  'BL',
  'BQ',
  'CW',
  'DM',
  'GD',
  'GP',
  'KN',
  'LC',
  'MF',
  'MQ',
  'MS',
  'SX',
  'TT',
  'VC',
  'PM',
  'WORLD',
];
