import { useCatalogFeed } from './useCatalogFeed.ts';
import { usgsReader } from '../catalogs/usgs.ts';

export function useLiveFeed(enabled = true) {
  return useCatalogFeed(usgsReader, enabled);
}
