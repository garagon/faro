import type { Quake } from '../lib/domain.ts';
import type { CatalogReader } from './types.ts';
export const igcReader: CatalogReader = {
  async read(signal: AbortSignal) {
    const response = await fetch('/api/igc', { signal, cache: 'no-cache' });
    if (!response.ok) throw Error('IGC unavailable');
    const data = await response.json();
    if (
      !Array.isArray(data.events) ||
      !Number.isFinite(data.fetched) ||
      !data.events.every(
        (event: Quake) =>
          event.source === 'IGC' &&
          Number.isFinite(event.time) &&
          Number.isFinite(event.lat) &&
          Number.isFinite(event.lng) &&
          typeof event.id === 'string',
      )
    )
      throw Error('Invalid IGC response');
    return { events: data.events as Quake[], generated: 0, fetched: data.fetched };
  },
};
