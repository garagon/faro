import type { Feed } from '../lib/domain.ts';

/** Source timestamps and retrieval time are separate; zero means not supplied. */
export type CatalogSnapshot = Feed & { fetched: number };

/** Stable reader instance shared with useCatalogFeed. No personal input is accepted. */
export type CatalogReader = {
  read: (signal: AbortSignal) => Promise<CatalogSnapshot>;
  cached?: () => CatalogSnapshot | null;
};
