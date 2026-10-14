import type { Localized } from './i18n.ts';

/** Countries whose meteorological service publishes an active CAP feed (checked 2026-10-13). */
export const NATIONAL_COUNTRIES: readonly string[] = ['PA', 'CR', 'DO', 'EC', 'AR'];

export type CapSeverity = 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown';
/** A national warning, worded as its agency published it. Faro does not classify it. */
export type NationalWarning = {
  id: string;
  event: string;
  headline: string;
  severity: CapSeverity;
  areas: string;
  sent: number;
  onset: number | null;
  expires: number;
  url: string;
  /** The agency's own text, line by line, as published. */
  description: string;
  instruction: string;
  /** Warning area rings as [lat, lng] pairs; empty when the message has none. */
  polygons: [number, number][][];
};
export type NationalSnapshot = {
  country: string;
  agency: string;
  warnings: NationalWarning[];
  partial: boolean;
  fetched: number;
  /** The adapter could not refresh and served its previous copy. */
  stale: boolean;
};

const SEVERITIES: readonly CapSeverity[] = ['Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown'];
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

function validWarning(value: unknown): NationalWarning | null {
  const w = value as Record<string, unknown> | null;
  if (
    !w ||
    typeof w.id !== 'string' ||
    typeof w.event !== 'string' ||
    !w.event.trim() ||
    !SEVERITIES.includes(w.severity as CapSeverity) ||
    !finite(w.sent) ||
    !finite(w.expires)
  )
    return null;
  let url = '';
  if (typeof w.url === 'string' && w.url) {
    try {
      if (new URL(w.url).protocol === 'https:') url = w.url;
    } catch {}
  }
  return {
    id: w.id,
    event: w.event,
    headline: typeof w.headline === 'string' ? w.headline : '',
    severity: w.severity as CapSeverity,
    areas: typeof w.areas === 'string' ? w.areas : '',
    sent: w.sent,
    onset: finite(w.onset) ? w.onset : null,
    expires: w.expires,
    url,
    description: typeof w.description === 'string' ? w.description.slice(0, 1200) : '',
    instruction: typeof w.instruction === 'string' ? w.instruction.slice(0, 600) : '',
    polygons: validPolygons(w.polygons),
  };
}

function validPolygons(value: unknown): [number, number][][] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 4)
    .map((ring) =>
      Array.isArray(ring)
        ? ring
            .filter(
              (p): p is [number, number] =>
                Array.isArray(p) &&
                p.length === 2 &&
                finite(p[0]) &&
                finite(p[1]) &&
                Math.abs(p[0]) <= 90 &&
                Math.abs(p[1]) <= 180,
            )
            .slice(0, 400)
        : [],
    )
    .filter((ring) => ring.length >= 4);
}

/**
 * Warnings whose own text mentions flooding or rising rivers. This reads the agency's words;
 * it does not judge where flooding is happening.
 */
/**
 * What the national-warnings row may say. "No warnings" only comes from a complete, recent
 * answer; partial, failed, old or offline answers with no warnings are "not confirmed".
 */
export type NationalSignal = 'checking' | 'offline' | 'failed' | 'unconfirmed' | 'on' | 'off';
export function nationalSignal(n: {
  warnings: readonly unknown[] | null;
  failed: boolean;
  partial: boolean;
  stale: boolean;
}): NationalSignal {
  if (!n.warnings) return n.failed ? 'failed' : n.stale ? 'offline' : 'checking';
  if (n.warnings.length) return 'on';
  return n.partial || n.stale || n.failed ? 'unconfirmed' : 'off';
}

const FLOOD_WORDS =
  /inundaci|crecida|desbord|niveles? de (?:los )?r[ií]os|r[ií]os y quebradas|flood|overflow/i;
export function floodWarnings(warnings: readonly NationalWarning[]) {
  return warnings.filter((w) =>
    FLOOD_WORDS.test([w.event, w.headline, w.description, w.instruction].join(' ')),
  );
}

/** Instruction lines without the bullets agencies type ("* No intente…"). */
export function instructionLines(text: string, max = 4) {
  return text
    .split('\n')
    .map((l) => l.replace(/^[\s*•\-–]+/, '').trim())
    .filter(Boolean)
    .slice(0, max);
}

/** Validates the adapter response for the requested country. */
export function parseNational(value: unknown, country: string, received = Date.now()) {
  const d = value as Record<string, unknown> | null;
  if (!d || d.country !== country || typeof d.agency !== 'string' || !Array.isArray(d.warnings))
    throw Error('Invalid national warnings response');
  const warnings = d.warnings.map(validWarning).filter((w): w is NationalWarning => !!w);
  if (d.warnings.length > 0 && warnings.length === 0)
    throw Error('Invalid national warnings response');
  const age = finite(d.age) && d.age >= 0 && d.age <= 24 * 3600000 ? d.age : 0;
  return {
    country,
    agency: d.agency,
    warnings,
    partial: d.partial === true,
    fetched: received - age,
    stale: d.stale === true,
  } satisfies NationalSnapshot;
}

/** Warnings still in force at `now`, most severe first. */
export function activeWarnings(warnings: readonly NationalWarning[], now: number) {
  const rank = (s: CapSeverity) => SEVERITIES.length - SEVERITIES.indexOf(s);
  return warnings
    .filter((w) => w.expires > now)
    .sort((a, b) => rank(b.severity) - rank(a.severity) || b.sent - a.sent);
}

/**
 * Agencies often publish event names in capitals ("LLUVIAS, TORMENTAS ELÉCTRICAS Y VIENTOS").
 * Only all-capital text is set in sentence case for reading; the words are not changed.
 */
export function readableEvent(event: string) {
  const letters = event.replace(/[^\p{L}]/gu, '');
  if (!letters || letters !== letters.toUpperCase()) return event;
  const lower = event.toLocaleLowerCase('es');
  return lower.charAt(0).toLocaleUpperCase('es') + lower.slice(1);
}

// CAP severity words; the agency's own event name is always shown as published.
export const severityLabels: Record<CapSeverity, Localized> = {
  Extreme: ['Extrema', 'Extreme', 'Extrema'],
  Severe: ['Grave', 'Severe', 'Grave'],
  Moderate: ['Moderada', 'Moderate', 'Moderada'],
  Minor: ['Menor', 'Minor', 'Menor'],
  Unknown: ['Sin indicar', 'Not stated', 'Não informada'],
};

/** A stored snapshot from an earlier visit is kept at most this long. */
export const KEEP_SNAPSHOT = 7 * 86400000;
/**
 * A stored snapshot, validated like a live answer and keeping its original retrieval time, so
 * warnings still in force can be shown offline as older data. Expired warnings are filtered
 * later by `activeWarnings`, exactly as for a live answer.
 */
export function reviveNational(value: unknown, country: string, now = Date.now()) {
  const v = value as { fetched?: unknown } | null;
  if (!v || !finite(v.fetched) || v.fetched > now || now - v.fetched > KEEP_SNAPSHOT) return null;
  try {
    return parseNational({ ...v, age: 0 }, country, v.fetched);
  } catch {
    return null;
  }
}
