import { useCatalogFeed } from './useCatalogFeed.ts';
import { emscReader } from '../catalogs/emsc.ts';

export function useEMSC(enabled = true) {
  return useCatalogFeed(emscReader, enabled);
}
