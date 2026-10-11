import { useCatalogFeed } from './useCatalogFeed.ts';
import { usgsReader } from '../catalogs/usgs.ts';

export function useLiveFeed() {
  return useCatalogFeed(usgsReader);
}
