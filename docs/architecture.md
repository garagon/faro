# Architecture

## Project layout

- `src/App.tsx`: responsive application shell and screen orchestration.
- `src/components/`: maps, guidance, trip setup, local help, personal messages and contacts.
- `src/catalogs/`: typed source readers, with a shared `CatalogReader` contract.
- `src/hooks/`: reader integration and visible-tab polling.
- `src/lib/`: parsing, filters, geodesic calculations, validation and browser-storage helpers.
- `src/styles/`: shared layout and component styles. Preserve import order while simplifying existing cascade layers.
- `src/data/`, `public/data/`: attributed country and coastline datasets.
- `server/official.mjs`: fixed-path IGC and NOAA adapters; no personal-data API.
- `tests/`: Node tests with synthetic records and in-memory storage.
- `scripts/`: publication allowlist/scan, source export and dependency notices.

The app uses React, TypeScript, Vite, Leaflet, markercluster and Radix Dialog. Fonts are self-hosted through npm packages. There is no database, authentication service, remote profile store or telemetry. Older phone-frame demonstrations, device assets, design captures and local review logs are outside this project.

## Data flow

The browser fetches USGS directly (and the NWS alerts API only while a U.S. area is selected) and IGC, EMSC, NOAA/PTWC, GDACS, NHC, national CAP warnings and SINAPROC posts through same-origin adapters. Readers preserve source times and publication limits. Catalogues stay separate to avoid presenting duplicate records as additional events. Network failures retain an explicit error state; no success or all-clear is fabricated.

Adapter upstream URLs are fixed or constrained to an official product path. Adapters reject redirects, limit fetch duration and streamed response size, cache successful responses for 55 seconds and coalesce concurrent requests. IGC, EMSC and GDACS keep their last good response for up to 30 minutes when a refresh fails and return it marked `stale` with its `age`; the browser places that age on its own clock, so the copy is shown as older data. The browser polls catalogues every 60 seconds and GDACS every five minutes while visible. Polling is not streaming or early warning.

`/api/national` takes a `country` query parameter that must be one of the listed feeds (`NATIONAL_FEEDS`); any other value is answered with 400 and never reaches an upstream URL. Its responses are cached for ten minutes.

After a failed refresh an adapter does not ask the upstream again for 15–30 s (jittered) and serves its last good copy marked `stale`. Good answers carry `Cache-Control: public, max-age=0, s-maxage=30, stale-while-revalidate=30, stale-if-error=600`, so a CDN can absorb load; the browser subtracts the HTTP `Age` header when dating each answer. Two-step reads (a feed, then its messages) finish within about 15 s, under the browser's 20 s limit. Country borders load in a separate chunk after the app starts.

`/api/sinaproc` takes no parameters: it reads a fixed query of SINAPROC's WordPress REST API (the 12 latest posts), keeps the title, the opening lines without markup or dateline, the UTC publication time, the later edit time when there is one, and the link only on sinaproc.gob.pa, and leaves out posts in the drill categories. A list where nothing is readable fails instead of reading as empty. Responses are cached for ten minutes and the last good copy is kept, marked `stale`, for up to 30 minutes.

The situation screen (`HazardOverview`) summarizes each hazard from these sources with `src/lib/hazards.ts`: GDACS events count only if updated in the last 72 hours, tsunami status is "none" only when the NOAA check is complete and recent, and any missing or failed source is "not confirmed", never a safe state.

Same-origin catalogue adapters share `src/catalogs/adapter.ts`, which validates each row, restricts outbound report links to the agency's host and reads the response age.

### Offline application copy

`src/sw.ts` is built as a separate classic script (`dist/client/sw.js`). The `faro-offline-shell` plugin in `vite.config.ts` injects the hashed build file list and a version digest, and fails the build if the worker would need an import. Registration lives in `src/main.tsx` and only runs in production builds. `src/main.tsx` is deliberately small: the only render-blocking style is the loading screen (`src/styles/boot.css`, about 1 KB), so the static call button and first steps in `index.html` show while the application downloads; `src/start.tsx` (the app and its styles) is loaded with a dynamic import, and Vite applies its styles before it runs. If that chunk cannot load, the loading screen stays with its call button and says so. Routing is decided by `src/lib/offline.ts`: navigations try the network for four seconds and then open the stored app; stored build files are served from cache; the coastline file is cached after first use; everything else, including every `/api/` path and every other origin, always uses the network.

The last answers of the national warnings, SINAPROC and NOAA tsunami adapters are kept in localStorage (`faro-national-<country>`, `faro-sinaproc`, `faro-tsunami`), validated again when read and deleted after a week. Offline they are shown as old data with their retrieval time; an open tsunami threat stays on screen after an offline reload. Trip details use verified writes to localStorage. A failed write is visible and has no server fallback. GPS stays in memory except when the person explicitly saves coordinates. Changes in site origin create a separate storage namespace and do not automatically migrate personal data.

## Running and hosting

`npm run dev` and `npm run preview` install the adapter middleware. Successful adapter answers over 1 KB are gzipped when the client accepts it (the earthquake table drops from about 250 KB to about 30 KB per check). `npm run build` emits `dist/client`, including `/licenses/` with Faro's licence, the third-party notices and the dependency licence texts. There is currently **no production HTTP server or platform deployment configuration** in this source release.

A deployment must serve the frontend and provide GET `/api/igc`, `/api/emsc`, `/api/tsunami`, `/api/alerts`, `/api/storms`, `/api/national` and `/api/sinaproc` on the same origin using the exported middleware/adapter (`OFFICIAL_PATHS` in `server/official.mjs`). It must also serve `/sw.js` from the site root without long-lived caching, so new releases replace the offline copy. Do not deploy only the static directory and assume these endpoints exist. Do not expose Vite development/preview as a production server. Keep HTTPS, response headers, upstream monitoring and abuse controls in the chosen hosting integration.

The dev server binds to loopback. Testing a physical phone requires an intentionally configured trusted network or HTTPS deployment; granting network access is not part of source packaging.

## Remaining maintenance work

The application shell still coordinates several screens, and the CSS keeps ordered layers from iterative design. Both are readable and checked; gradual extraction and cascade consolidation remain reasonable follow-up work. Avoid a broad behavioral rewrite during release preparation. The coastline file was reduced from 7.7 MB to 1.8 MB (0.66 MB compressed) with `scripts/simplify-coastline.mjs`, which changes coast distances by at most 0.25 km in the checked places. Splitting the application chunk further (map, guide), accessibility with actual users and real-device testing remain production work.
