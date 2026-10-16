import { receivedAt } from '../lib/http.ts';
import type { CatalogId, Quake } from '../lib/domain.ts';
import type { CatalogReader } from './types.ts';

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** Accepts only complete adapter rows so one malformed record cannot break the UI. */
export function validAdapterEvent(
  value: unknown,
  source: CatalogId,
  hosts: readonly string[],
): value is Quake {
  if (!value || typeof value !== 'object') return false;
  const e = value as Record<string, unknown>;
  let url: URL;
  try {
    url = new URL(typeof e.url === 'string' ? e.url : '');
  } catch {
    return false;
  }
  return (
    e.source === source &&
    url.protocol === 'https:' &&
    hosts.includes(url.hostname) &&
    typeof e.id === 'string' &&
    typeof e.place === 'string' &&
    finite(e.time) &&
    finite(e.lat) &&
    Math.abs(e.lat) <= 90 &&
    finite(e.lng) &&
    Math.abs(e.lng) <= 180 &&
    finite(e.depth) &&
    (e.mag === null || finite(e.mag)) &&
    (e.authority === undefined || typeof e.authority === 'string')
  );
}

/** Milliseconds since the adapter retrieved its copy; unknown or implausible ages count as 0. */
export function responseAge(data: unknown): number {
  const age = (data as { age?: unknown } | null)?.age;
  return finite(age) && age >= 0 && age <= 24 * 3600000 ? age : 0;
}

/**
 * Reader for a same-origin adapter that returns `{ events, age }`. The last snapshot is kept in
 * localStorage under `cacheKey`, so a later visit without a connection shows it as older data.
 */
export function adapterReader(
  path: string,
  source: CatalogId,
  hosts: readonly string[],
  cacheKey: string,
): CatalogReader {
  return {
    async read(signal: AbortSignal) {
      const response = await fetch(path, { signal, cache: 'no-cache' });
      if (!response.ok) throw Error(`${source} unavailable`);
      const data: unknown = await response.json();
      const events = (data as { events?: unknown })?.events;
      if (!Array.isArray(events)) throw Error(`Invalid ${source} response`);
      const valid = events.filter((e) => validAdapterEvent(e, source, hosts));
      if (events.length > 0 && valid.length === 0) throw Error(`Invalid ${source} response`);
      // The adapter reports how old its copy is. Place that age on the browser clock so a skewed
      // device clock cannot mark fresh data as outdated, and a copy kept during an outage is
      // shown as older data instead of a new check.
      const fetched = receivedAt(response) - responseAge(data);
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ events: valid, fetched }));
      } catch {}
      return { events: valid, generated: 0, fetched };
    },
    cached() {
      const cache: unknown = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      const c = cache as { events?: unknown; fetched?: unknown } | null;
      // A copy dated in the future (clock change) is ignored rather than shown as current.
      if (!c || !Array.isArray(c.events) || !finite(c.fetched)) return null;
      if (c.fetched <= 0 || c.fetched > Date.now()) return null;
      const events = c.events.filter((e) => validAdapterEvent(e, source, hosts));
      return { events, generated: 0, fetched: c.fetched };
    },
  };
}
