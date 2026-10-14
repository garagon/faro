import { offlineRoute } from './lib/offline.ts';

// Replaced by the build with the hashed file list and its digest (see vite.config.ts).
const PRECACHE: string[] = ['__FARO_PRECACHE__'];
const SHELL = 'faro-shell-__FARO_VERSION__';
const RUNTIME = 'faro-runtime-v1';
const NAVIGATION_TIMEOUT = 4000;
// Stored files are Faro's own hashed build output. Servers may answer with `Vary: Origin`, and a
// module script request does not always carry the same headers as the install request, so the
// lookup ignores Vary; otherwise an offline start can miss a file that is stored.
const LOOKUP = { cacheName: SHELL, ignoreVary: true };
// Stored in a copy once a page has started from it on this device (see src/start.tsx). Until
// then the previous copy that did start is kept and used offline, so a release that installs but
// fails to start cannot replace a working offline copy.
const STARTED = '/__faro-started';

type ExtendableEvent = Event & { waitUntil(promise: Promise<unknown>): void };
type FetchEvent = ExtendableEvent & {
  request: Request;
  respondWith(response: Promise<Response>): void;
};
type MessageEvent = ExtendableEvent & {
  data: unknown;
  source: { postMessage(message: unknown): void } | null;
};
type Worker = {
  location: Location;
  skipWaiting(): Promise<void>;
  clients: { claim(): Promise<void> };
  addEventListener(type: 'install' | 'activate', listener: (e: ExtendableEvent) => void): void;
  addEventListener(type: 'fetch', listener: (e: FetchEvent) => void): void;
  addEventListener(type: 'message', listener: (e: MessageEvent) => void): void;
};
const worker = self as unknown as Worker;
const precached = new Set(PRECACHE);

worker.addEventListener('install', (event) => {
  // The whole set is stored together, so a stored page always has its matching scripts. Each file
  // is read from the server, never from the browser's HTTP cache, so an older index.html cannot
  // end up beside newer scripts. A failed install leaves no half-filled copy behind.
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => worker.skipWaiting())
      .catch(async (error: unknown) => {
        await caches.delete(SHELL);
        throw error;
      }),
  );
});

const olderShells = async () =>
  (await caches.keys()).filter((key) => key.startsWith('faro-shell-') && key !== SHELL);
const hasStarted = async (name: string) => !!(await (await caches.open(name)).match(STARTED));
/** The newest older copy that has started on this device, if any. */
async function lastStarted() {
  for (const name of (await olderShells()).reverse()) if (await hasStarted(name)) return name;
  return undefined;
}

worker.addEventListener('activate', (event) => {
  // Older copies go, except the last one known to start, which stays until this one has started.
  event.waitUntil(
    (async () => {
      const keep = (await hasStarted(SHELL)) ? undefined : await lastStarted();
      await Promise.all(
        (await olderShells()).filter((key) => key !== keep).map((key) => caches.delete(key)),
      );
      await worker.clients.claim();
    })(),
  );
});

worker.addEventListener('message', (event) => {
  const data = event.data as { type?: unknown; script?: unknown } | null;
  // Only a page running this version's own script confirms this version.
  if (data?.type !== 'faro-started' || typeof data.script !== 'string') return;
  if (!precached.has(data.script)) return;
  event.waitUntil(
    (async () => {
      await (await caches.open(SHELL)).put(STARTED, new Response('1'));
      await Promise.all((await olderShells()).map((key) => caches.delete(key)));
      // The page can now say that Faro opens on this device without a connection.
      event.source?.postMessage({ type: 'faro-offline-ready' });
    })(),
  );
});

async function navigate(request: Request) {
  // Prefer the current site; after a short wait or a failure, open the stored application.
  const network = fetch(request);
  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), NAVIGATION_TIMEOUT),
  );
  try {
    const response = await Promise.race([network, timeout]);
    if (response && response.ok) return response;
  } catch {}
  // A stored page (such as /about.html) opens as itself; any other route opens the app. The copy
  // is this version once it has started here, otherwise the last one that did.
  const shell = (await hasStarted(SHELL)) ? SHELL : ((await lastStarted()) ?? SHELL);
  const lookup = { cacheName: shell, ignoreVary: true };
  const page = new URL(request.url).pathname;
  const stored =
    (precached.has(page) && (await caches.match(page, lookup))) ||
    (await caches.match('/', lookup));
  return stored ?? network;
}

/** Scripts and styles of a kept older copy, when that copy is the one opened offline. */
async function olderAsset(request: Request) {
  try {
    return await fetch(request);
  } catch (error) {
    const stored = await caches.match(request, { ignoreVary: true });
    if (stored) return stored;
    throw error;
  }
}

const isOwnAsset = (request: Request) => {
  const url = new URL(request.url);
  return (
    request.method === 'GET' &&
    url.origin === worker.location.origin &&
    url.pathname.startsWith('/assets/') &&
    !url.search
  );
};

async function fromShell(request: Request) {
  return (await caches.match(request, LOOKUP)) ?? fetch(request);
}

async function runtime(request: Request) {
  const cache = await caches.open(RUNTIME);
  const stored = await cache.match(request, { ignoreVary: true });
  const update = fetch(request).then((response) => {
    if (response.ok) void cache.put(request, response.clone());
    return response;
  });
  if (stored) {
    update.catch(() => {});
    return stored;
  }
  return update;
}

worker.addEventListener('fetch', (event) => {
  const route = offlineRoute(event.request, worker.location.origin, precached);
  if (route === 'navigate') event.respondWith(navigate(event.request));
  else if (route === 'precache') event.respondWith(fromShell(event.request));
  else if (route === 'runtime') event.respondWith(runtime(event.request));
  else if (isOwnAsset(event.request)) event.respondWith(olderAsset(event.request));
});
