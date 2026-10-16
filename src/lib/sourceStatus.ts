import { pick, type Lang } from './i18n.ts';
import { checkedLabel } from './time.ts';

/**
 * The state of one official source for the sources page. A source that answered long ago, or
 * while the device is offline, is "old data", never "working".
 */
export type SourceState = 'ok' | 'partial' | 'stale' | 'failed' | 'checking' | 'offline' | 'idle';

export function sourceState(s: {
  /** When the data was retrieved, on this device's clock; null if never. */
  checked: number | null;
  failed: boolean;
  partial?: boolean;
  /** The adapter served its previous copy. */
  stale?: boolean;
  online: boolean;
  now: number;
  /** Older than this counts as old data (a few polling cycles). */
  maxAge: number;
  /** Not polled now (another earthquake catalogue is selected). */
  idle?: boolean;
}): SourceState {
  if (s.idle) return 'idle';
  if (!s.checked) return s.failed ? 'failed' : s.online ? 'checking' : 'offline';
  if (s.failed) return 'failed';
  if (!s.online || s.stale || s.now - s.checked > s.maxAge) return 'stale';
  return s.partial ? 'partial' : 'ok';
}

/**
 * What one request leaves behind in the polling hooks. A failure keeps the time it was tried, so
 * a source that never answered can still say when Faro last asked; an answer clears it.
 */
export type Attempt = { failed: boolean; failedAt: number | null };
export const attemptResult = (ok: boolean, at: number): Attempt =>
  ok ? { failed: false, failedAt: null } : { failed: true, failedAt: at };

/**
 * When a source's data is from, in one grammar for every state line: "consultado 23:36" while
 * current, "último dato 23:36" when old or failing, "intento 23:30" when it failed with nothing
 * received. Lower case, to follow a source name or another part of the line; empty when there is
 * no time to give.
 */
export function sourceTime(s: {
  /** When the data shown was retrieved; null if nothing was received. */
  checked: number | null;
  /** The data can no longer be read as current (old, offline, or the source is failing). */
  old: boolean;
  /** When the last failed attempt was made. */
  failedAt?: number | null;
  now: number;
  lang: Lang;
}) {
  const t = (es: string, en: string, pt: string) => pick(s.lang, es, en, pt);
  if (s.checked) {
    const at = checkedLabel(s.checked, s.now, s.lang);
    return s.old
      ? t(`último dato ${at}`, `last data ${at}`, `último dado ${at}`)
      : t(`consultado ${at}`, `checked ${at}`, `consultado ${at}`);
  }
  if (!s.failedAt) return '';
  const at = checkedLabel(s.failedAt, s.now, s.lang);
  return t(`intento ${at}`, `tried ${at}`, `tentativa ${at}`);
}

/** A failing source: "No responde · último dato 23:36", or "· intento 23:30" with no data. */
export function failingLabel(s: {
  checked: number | null;
  failedAt?: number | null;
  now: number;
  lang: Lang;
}) {
  return [
    pick(s.lang, 'No responde', 'Not responding', 'Não responde'),
    sourceTime({ ...s, old: true }),
  ]
    .filter(Boolean)
    .join(' · ');
}

/** The first letter in upper case, for a time label that starts a line. */
export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
