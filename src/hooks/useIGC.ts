import { useCatalogFeed } from './useCatalogFeed.ts';
import { igcReader } from '../catalogs/igc.ts';

export function useIGC() {
  return useCatalogFeed(igcReader);
}
