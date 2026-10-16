import type { Localized } from './i18n.ts';

// U.S. National Weather Service alerts. Names were checked against /alerts/types on 2026-10-13:
// an unknown name returns an empty list instead of an error, so they must stay exact.
export const NWS_TSUNAMI_EVENTS = ['Tsunami Warning', 'Tsunami Advisory', 'Tsunami Watch'] as const;
export const NWS_TROPICAL_EVENTS = [
  'Hurricane Warning',
  'Hurricane Watch',
  'Tropical Storm Warning',
  'Tropical Storm Watch',
  'Storm Surge Warning',
  'Storm Surge Watch',
  'Extreme Wind Warning',
  'Typhoon Warning',
  'Typhoon Watch',
] as const;
export const NWS_FLOOD_EVENTS = [
  'Flash Flood Warning',
  'Flash Flood Watch',
  'Flood Warning',
  'Flood Watch',
  'Flood Advisory',
  'Coastal Flood Warning',
  'Coastal Flood Watch',
  'Coastal Flood Advisory',
] as const;
type NwsEvent =
  | (typeof NWS_TSUNAMI_EVENTS)[number]
  | (typeof NWS_TROPICAL_EVENTS)[number]
  | (typeof NWS_FLOOD_EVENTS)[number];
const kinds = new Map<string, NwsAlert['kind']>([
  ...NWS_TSUNAMI_EVENTS.map((e) => [e, 'tsunami'] as const),
  ...NWS_TROPICAL_EVENTS.map((e) => [e, 'tropical'] as const),
  ...NWS_FLOOD_EVENTS.map((e) => [e, 'flood'] as const),
]);
// NWS covers U.S. states, territories and waters only. These are its valid territory areas.
export const NWS_COUNTRIES: readonly string[] = ['US', 'PR', 'VI', 'GU', 'AS', 'MP'];

/**
 * The mainland would return thousands of local flood products, so it gets tsunami, tropical and
 * flash flood warnings nationwide; territories get every listed event filtered by area.
 */
export function nwsUrl(country: string) {
  const all = country !== 'US';
  const events = [
    ...NWS_TSUNAMI_EVENTS,
    ...NWS_TROPICAL_EVENTS,
    ...(all ? NWS_FLOOD_EVENTS : (['Flash Flood Warning'] as const)),
  ];
  const params = new URLSearchParams({ event: events.join(',') });
  if (all) params.set('area', country);
  return `https://api.weather.gov/alerts/active?${params}`;
}

export type NwsAlert = {
  id: string;
  event: NwsEvent;
  kind: 'tsunami' | 'tropical' | 'flood';
  headline: string;
  area: string;
  sent: number;
  expires: number | null;
  sender: string;
  /** Flash flood warning tagged CATASTROPHIC: a flash flood emergency. */
  emergency: boolean;
};

const time = (s: unknown) => (typeof s === 'string' ? Date.parse(s) : NaN);
const text = (s: unknown, max: number) =>
  typeof s === 'string' ? s.replace(/\s+/g, ' ').trim().slice(0, max) : '';

/** Keeps actual (not test or exercise) alerts with a known event and a valid issue time. */
export function parseNws(value: unknown): NwsAlert[] {
  const d = value as { type?: unknown; features?: unknown } | null;
  if (!d || d.type !== 'FeatureCollection' || !Array.isArray(d.features))
    throw Error('Invalid NWS response');
  const alerts: NwsAlert[] = [];
  for (const feature of d.features) {
    const p = (feature as { properties?: Record<string, unknown> } | null)?.properties;
    if (!p) continue;
    const sent = time(p.sent);
    const ends = time(p.ends),
      expires = time(p.expires);
    const kind = typeof p.event === 'string' ? kinds.get(p.event) : undefined;
    if (p.status !== 'Actual' || !kind || typeof p.id !== 'string' || !Number.isFinite(sent))
      continue;
    const threat = (p.parameters as { flashFloodDamageThreat?: unknown } | undefined)
      ?.flashFloodDamageThreat;
    alerts.push({
      id: p.id,
      event: p.event as NwsEvent,
      kind,
      headline: text(p.headline, 300),
      area: text(p.areaDesc, 600),
      sent,
      expires: Number.isFinite(ends) ? ends : Number.isFinite(expires) ? expires : null,
      sender: text(p.senderName, 120),
      emergency:
        p.event === 'Flash Flood Warning' &&
        Array.isArray(threat) &&
        threat.some((x) => x === 'CATASTROPHIC'),
    });
  }
  return alerts.sort((a, b) => b.sent - a.sent);
}

// Spanish uses NWS/NHC terms: warning = aviso, watch = vigilancia, advisory = advertencia.
// Portuguese keeps the same three distinct words: aviso, vigilância, advertência.
export const nwsEventLabels: Record<NwsEvent, Localized> = {
  'Tsunami Warning': ['Aviso de tsunami', 'Tsunami warning', 'Aviso de tsunami'],
  'Tsunami Advisory': ['Advertencia de tsunami', 'Tsunami advisory', 'Advertência de tsunami'],
  'Tsunami Watch': ['Vigilancia de tsunami', 'Tsunami watch', 'Vigilância de tsunami'],
  'Hurricane Warning': ['Aviso de huracán', 'Hurricane warning', 'Aviso de furacão'],
  'Hurricane Watch': ['Vigilancia de huracán', 'Hurricane watch', 'Vigilância de furacão'],
  'Tropical Storm Warning': [
    'Aviso de tormenta tropical',
    'Tropical storm warning',
    'Aviso de tempestade tropical',
  ],
  'Tropical Storm Watch': [
    'Vigilancia de tormenta tropical',
    'Tropical storm watch',
    'Vigilância de tempestade tropical',
  ],
  'Storm Surge Warning': [
    'Aviso de marejada ciclónica',
    'Storm surge warning',
    'Aviso de maré de tempestade',
  ],
  'Storm Surge Watch': [
    'Vigilancia de marejada ciclónica',
    'Storm surge watch',
    'Vigilância de maré de tempestade',
  ],
  'Extreme Wind Warning': [
    'Aviso de vientos extremos',
    'Extreme wind warning',
    'Aviso de ventos extremos',
  ],
  'Typhoon Warning': ['Aviso de tifón', 'Typhoon warning', 'Aviso de tufão'],
  'Typhoon Watch': ['Vigilancia de tifón', 'Typhoon watch', 'Vigilância de tufão'],
  'Flash Flood Warning': [
    'Aviso de inundación repentina',
    'Flash flood warning',
    'Aviso de inundação repentina',
  ],
  'Flash Flood Watch': [
    'Vigilancia de inundación repentina',
    'Flash flood watch',
    'Vigilância de inundação repentina',
  ],
  'Flood Warning': ['Aviso de inundación', 'Flood warning', 'Aviso de inundação'],
  'Flood Watch': ['Vigilancia de inundación', 'Flood watch', 'Vigilância de inundação'],
  'Flood Advisory': ['Advertencia de inundación', 'Flood advisory', 'Advertência de inundação'],
  'Coastal Flood Warning': [
    'Aviso de inundación costera',
    'Coastal flood warning',
    'Aviso de inundação costeira',
  ],
  'Coastal Flood Watch': [
    'Vigilancia de inundación costera',
    'Coastal flood watch',
    'Vigilância de inundação costeira',
  ],
  'Coastal Flood Advisory': [
    'Advertencia de inundación costera',
    'Coastal flood advisory',
    'Advertência de inundação costeira',
  ],
};
