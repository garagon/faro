import { FEED_URL, parseFeed } from '../lib/domain.ts';
import type { CatalogReader } from './types.ts';
const CACHE = 'faro-usgs-v1';
// Only the fields parseFeed reads: the stored copy is about a third of the raw feed and is
// validated again the same way when read back.
const KEEP = [
  'type',
  'mag',
  'place',
  'time',
  'updated',
  'url',
  'status',
  'magType',
  'alert',
  'felt',
  'cdi',
  'mmi',
  'tsunami',
];
// The offline copy is rewritten at most this often, not on every 60 s poll.
const WRITE_EVERY = 5 * 60 * 1000;
let lastWrite = 0;

export function slimFeed(raw: unknown) {
  const d = raw as { type?: unknown; metadata?: { generated?: unknown }; features?: unknown };
  const features = Array.isArray(d?.features) ? d.features : [];
  return {
    type: d?.type,
    metadata: { generated: d?.metadata?.generated },
    features: features.map((f: unknown) => {
      const feature = f as { id?: unknown; geometry?: unknown; properties?: unknown };
      const p = (feature?.properties ?? {}) as Record<string, unknown>;
      return {
        id: feature?.id,
        geometry: feature?.geometry,
        properties: Object.fromEntries(KEEP.filter((k) => k in p).map((k) => [k, p[k]])),
      };
    }),
  };
}

export const usgsReader: CatalogReader = {
  async read(signal: AbortSignal) {
    const response = await fetch(FEED_URL, { signal, cache: 'no-cache' });
    if (!response.ok) throw Error('USGS unavailable');
    const raw = await response.json(),
      feed = parseFeed(raw),
      fetched = Date.now();
    if (fetched - lastWrite >= WRITE_EVERY) {
      try {
        localStorage.setItem(CACHE, JSON.stringify({ raw: slimFeed(raw), fetched }));
        lastWrite = fetched;
      } catch {}
    }
    return { ...feed, fetched };
  },
  cached() {
    const cache = JSON.parse(localStorage.getItem(CACHE) || 'null');
    if (
      !cache ||
      !Number.isFinite(cache.fetched) ||
      cache.fetched <= 0 ||
      cache.fetched > Date.now()
    )
      return null;
    return { ...parseFeed(cache.raw), fetched: cache.fetched };
  },
};
