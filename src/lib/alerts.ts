import { inBounds, type Bounds } from './domain.ts';
import { pick, type Lang, type Localized } from './i18n.ts';

export type AlertType = 'EQ' | 'TC' | 'FL' | 'VO' | 'DR' | 'WF';
export type AlertLevel = 'green' | 'orange' | 'red';
/** A GDACS event: an automatic estimate of humanitarian impact, not a local warning. */
export type HazardAlert = {
  id: string;
  type: AlertType;
  level: AlertLevel;
  name: string;
  region: string;
  countries: string[];
  from: number;
  to: number;
  modified: number;
  current: boolean;
  severity: string;
  lat: number | null;
  lng: number | null;
  url: string;
};
export type AlertsSnapshot = { events: HazardAlert[]; partial: boolean; fetched: number };

const TYPES: readonly AlertType[] = ['EQ', 'TC', 'FL', 'VO', 'DR', 'WF'];
const LEVELS: readonly AlertLevel[] = ['green', 'orange', 'red'];
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const coordinate = (n: unknown, max: number) => (finite(n) && Math.abs(n) <= max ? n : null);

function validAlert(value: unknown): HazardAlert | null {
  if (!value || typeof value !== 'object') return null;
  const e = value as Record<string, unknown>;
  let url: URL;
  try {
    url = new URL(typeof e.url === 'string' ? e.url : '');
  } catch {
    return null;
  }
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'www.gdacs.org' ||
    typeof e.id !== 'string' ||
    !TYPES.includes(e.type as AlertType) ||
    !LEVELS.includes(e.level as AlertLevel) ||
    typeof e.name !== 'string' ||
    !finite(e.from) ||
    !finite(e.to) ||
    !Array.isArray(e.countries)
  )
    return null;
  return {
    id: e.id,
    type: e.type as AlertType,
    level: e.level as AlertLevel,
    name: e.name,
    region: typeof e.region === 'string' ? e.region : '',
    countries: e.countries.filter(
      (c): c is string => typeof c === 'string' && /^[A-Z]{2}$/.test(c),
    ),
    from: e.from,
    to: e.to,
    modified: finite(e.modified) ? e.modified : e.to,
    current: e.current !== false,
    severity: typeof e.severity === 'string' ? e.severity : '',
    lat: coordinate(e.lat, 90),
    lng: coordinate(e.lng, 180),
    url: url.href,
  };
}

/** Validates the adapter response; malformed records are dropped, a malformed body throws. */
export function parseAlerts(value: unknown, received = Date.now()): AlertsSnapshot {
  const d = value as { events?: unknown; partial?: unknown; age?: unknown } | null;
  if (!d || !Array.isArray(d.events)) throw Error('Invalid GDACS response');
  const events = d.events.map(validAlert).filter((e): e is HazardAlert => !!e);
  if (d.events.length > 0 && events.length === 0) throw Error('Invalid GDACS response');
  const age = finite(d.age) && d.age >= 0 && d.age <= 24 * 3600000 ? d.age : 0;
  return { events, partial: d.partial === true, fetched: received - age };
}

const rank: Record<AlertLevel, number> = { red: 3, orange: 2, green: 1 };
export const ALERT_WINDOW = 14 * 86400000;
// GDACS updates an ongoing event at least daily; older items are recent history, not current.
export const ACTIVE_WINDOW = 72 * 3600000;

/**
 * Events for the selected country: listed as affected, or (for offshore events without a
 * country) located inside its map preset. Worldwide shows only Orange and Red.
 */
export function alertsFor(
  events: readonly HazardAlert[],
  country: string,
  bounds: Bounds,
  now: number,
) {
  return events
    .filter((e) => e.current || now - e.to <= ALERT_WINDOW)
    .filter((e) =>
      country === 'WORLD'
        ? e.level !== 'green'
        : e.countries.includes(country) ||
          (e.countries.length === 0 &&
            e.lat !== null &&
            e.lng !== null &&
            inBounds({ lat: e.lat, lng: e.lng }, bounds)),
    )
    .sort((a, b) => {
      const active = (e: HazardAlert) => (now - e.to <= ACTIVE_WINDOW ? 1 : 0);
      return active(b) - active(a) || rank[b.level] - rank[a.level] || b.to - a.to;
    });
}

/**
 * Readable subject for an event. GDACS names are English ("Earthquake in Panama") and the type is
 * shown separately. Cyclones and volcanoes keep their proper name (SIMON-26, Kanlaon); other
 * events use localized country names, shortened when many countries are affected.
 */
export function alertSubject(
  e: HazardAlert,
  regionName: (code: string) => string | undefined,
  lang: Lang = 'es',
) {
  const proper =
    e.name.replace(
      /^(earthquake|flood|drought|forest fires?|tropical cyclone|eruption)\s+(in\s+)?/i,
      '',
    ) || e.name;
  if (e.type === 'TC' || e.type === 'VO' || e.countries.length === 0) return proper;
  const names = e.countries.map((c) => regionName(c) ?? c);
  if (names.length <= 3) return names.join(', ');
  const more = names.length - 3;
  return `${names.slice(0, 3).join(', ')} ${pick(lang, `y ${more} más`, `and ${more} more`, `e mais ${more}`)}`;
}

export const alertTypeLabels: Record<AlertType, Localized> = {
  EQ: ['Sismo', 'Earthquake', 'Terremoto'],
  TC: ['Ciclón tropical', 'Tropical cyclone', 'Ciclone tropical'],
  FL: ['Inundación', 'Flood', 'Inundação'],
  VO: ['Volcán', 'Volcano', 'Vulcão'],
  DR: ['Sequía', 'Drought', 'Seca'],
  WF: ['Incendio forestal', 'Wildfire', 'Incêndio florestal'],
};
// Wording from the GDACS guidelines: the level concerns the need for international assistance.
export const alertLevelLabels: Record<AlertLevel, Localized> = {
  green: ['Verde · impacto moderado', 'Green · moderate impact', 'Verde · impacto moderado'],
  orange: [
    'Naranja · posible desastre local',
    'Orange · potential local disaster',
    'Laranja · possível desastre local',
  ],
  red: [
    'Roja · posible desastre grave',
    'Red · potentially severe disaster',
    'Vermelho · possível desastre grave',
  ],
};

/**
 * GDACS writes earthquake severity as "Magnitude 7.7M, Depth:12.647km". Shown in the reader's
 * language with rounded depth; any other wording is shown exactly as published.
 */
export function readableSeverity(text: string, lang: Lang) {
  const m = text.match(/^Magnitude\s+([\d.]+)\s*M,\s*Depth:\s*([\d.]+)\s*km$/i);
  if (!m) return text;
  const depth = Math.round(Number(m[2]));
  return pick(
    lang,
    `Magnitud ${m[1]}, profundidad ${depth} km`,
    `Magnitude ${m[1]}, depth ${depth} km`,
    `Magnitude ${m[1]}, profundidade ${depth} km`,
  );
}

/**
 * A title that needs no decoding: "Sismo de magnitud 7.7 en Panamá", "Ciclón tropical Melissa".
 * Built only from what GDACS published (type, magnitude, name, countries). Portuguese puts the
 * place after a colon ("Terremoto de magnitude 7.7: Panamá"): its "em" contracts with the
 * country's article, which is not known here.
 */
export function alertTitle(
  e: HazardAlert,
  regionName: (code: string) => string | undefined,
  lang: Lang,
) {
  const subject = alertSubject(e, regionName, lang);
  if (e.type === 'EQ') {
    const mag = e.severity.match(/Magnitude\s+([\d.]+)/i)?.[1];
    return mag
      ? pick(
          lang,
          `Sismo de magnitud ${mag} en ${subject}`,
          `Magnitude ${mag} earthquake in ${subject}`,
          `Terremoto de magnitude ${mag}: ${subject}`,
        )
      : pick(lang, `Sismo en ${subject}`, `Earthquake in ${subject}`, `Terremoto: ${subject}`);
  }
  const [es, en, pt] = alertTypeLabels[e.type];
  if (e.type === 'TC' || e.type === 'VO') return `${pick(lang, es, en, pt)} ${subject}`;
  return pick(lang, `${es} en ${subject}`, `${en} in ${subject}`, `${pt}: ${subject}`);
}

/**
 * The level in one line for compact rows. It names what GDACS measures, the need for
 * international assistance, so "green" never reads as "low danger" for people on the ground.
 */
export const alertLevelShort: Record<AlertLevel, Localized> = {
  green: [
    'GDACS verde: no se prevé ayuda internacional',
    'GDACS green: no international assistance expected',
    'GDACS verde: não se prevê ajuda internacional',
  ],
  orange: [
    'GDACS naranja: podría requerir ayuda internacional',
    'GDACS orange: may need international assistance',
    'GDACS laranja: pode precisar de ajuda internacional',
  ],
  red: [
    'GDACS roja: probablemente requiera ayuda internacional',
    'GDACS red: likely needs international assistance',
    'GDACS vermelho: provavelmente precisará de ajuda internacional',
  ],
};

/** What each GDACS level means, in plain words (GDACS: need for international assistance). */
export const alertLevelMeaning: Record<AlertLevel, Localized> = {
  green: [
    'Impacto estimado: bajo (alerta verde). No se espera que necesite ayuda internacional.',
    'Estimated impact: low (green alert). International assistance is not expected to be needed.',
    'Impacto estimado: baixo (alerta verde). Não se espera que precise de ajuda internacional.',
  ],
  orange: [
    'Impacto estimado: medio (alerta naranja). Podría requerir ayuda internacional.',
    'Estimated impact: medium (orange alert). It may need international assistance.',
    'Impacto estimado: médio (alerta laranja). Pode precisar de ajuda internacional.',
  ],
  red: [
    'Impacto estimado: alto (alerta roja). Probablemente requiera ayuda internacional.',
    'Estimated impact: high (red alert). It likely needs international assistance.',
    'Impacto estimado: alto (alerta vermelho). Provavelmente precisará de ajuda internacional.',
  ],
};
