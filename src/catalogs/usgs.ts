import { FEED_URL, parseFeed } from '../lib/domain.ts';
import type { CatalogReader } from './types.ts';
const CACHE = 'faro-usgs-v1';
export const usgsReader: CatalogReader = {
  async read(signal: AbortSignal) {
    const response = await fetch(FEED_URL, { signal, cache: 'no-cache' });
    if (!response.ok) throw Error('USGS unavailable');
    const raw = await response.json(),
      feed = parseFeed(raw),
      fetched = Date.now();
    try {
      localStorage.setItem(CACHE, JSON.stringify({ raw, fetched }));
    } catch {}
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
