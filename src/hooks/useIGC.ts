import { useCatalogFeed } from './useCatalogFeed.ts';
import { igcReader } from '../catalogs/igc.ts';

export function useIGC(enabled = true) {
  return useCatalogFeed(igcReader, enabled);
}
