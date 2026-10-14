/**
 * Offline routing for the service worker. Only Faro's own application files are stored.
 * Official reports, map tiles, external searches and every /api/ response always use the
 * network, so a stored copy can never be presented as a current official record.
 */
export type OfflineRoute = 'network' | 'navigate' | 'precache' | 'runtime';

// Same-origin static data that is too large to preload; stored after its first use.
export const RUNTIME_PATHS: readonly string[] = ['/data/coastline.json'];

// Public files preloaded with the build output so the shell and guidance open without a signal.
export const PUBLIC_SHELL: readonly string[] = [
  '/',
  '/manifest.webmanifest',
  '/faro-mark.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/illustrations/drop-cover-hold-es.png',
  '/illustrations/drop-cover-hold-en.png',
  '/about.html',
  '/privacy.html',
  '/pages.css',
];

export function offlineRoute(
  request: { method: string; url: string; mode?: string },
  origin: string,
  precached: ReadonlySet<string>,
): OfflineRoute {
  if (request.method !== 'GET') return 'network';
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return 'network';
  }
  if (url.origin !== origin || url.pathname.startsWith('/api/')) return 'network';
  if (request.mode === 'navigate') return 'navigate';
  if (url.search) return 'network';
  if (precached.has(url.pathname)) return 'precache';
  return RUNTIME_PATHS.includes(url.pathname) ? 'runtime' : 'network';
}

/** Build files worth storing: scripts, styles, fonts and images, without source maps. */
export function precacheList(files: readonly string[]): string[] {
  const built = files
    .filter((f) => /\.(js|css|woff2|png|svg|webp)$/.test(f) && f !== 'sw.js')
    .map((f) => `/${f.replace(/^\/+/, '')}`);
  return [...new Set([...PUBLIC_SHELL, ...built])].sort();
}
