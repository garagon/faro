import type { Quake } from '../lib/domain.ts';
import type { CatalogReader } from './types.ts';

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** Accepts only complete IGC rows so one malformed record cannot break the UI. */
export function validIGCEvent(value: unknown): value is Quake {
  if (!value || typeof value !== 'object') return false;
  const e = value as Record<string, unknown>;
  return (
    e.source === 'IGC' &&
    typeof e.id === 'string' &&
    typeof e.place === 'string' &&
    typeof e.url === 'string' &&
    finite(e.time) &&
    finite(e.lat) &&
    Math.abs(e.lat) <= 90 &&
    finite(e.lng) &&
    Math.abs(e.lng) <= 180 &&
    finite(e.depth) &&
    (e.mag === null || finite(e.mag))
  );
}

export const igcReader: CatalogReader = {
  async read(signal: AbortSignal) {
    const response = await fetch('/api/igc', { signal, cache: 'no-cache' });
    if (!response.ok) throw Error('IGC unavailable');
    const data: unknown = await response.json();
    const events = (data as { events?: unknown })?.events;
    if (!Array.isArray(events)) throw Error('Invalid IGC response');
    const valid = events.filter(validIGCEvent);
    if (events.length > 0 && valid.length === 0) throw Error('Invalid IGC response');
    // The adapter caches for under a minute. Use the browser clock for freshness so a skewed
    // device clock cannot mark fresh data as outdated.
    return { events: valid, generated: 0, fetched: Date.now() };
  },
};
