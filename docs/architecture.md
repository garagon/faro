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

The browser fetches USGS directly and IGC/NOAA through same-origin adapters. Readers preserve source times and publication limits. Catalogues stay separate to avoid presenting duplicate records as additional events. Network failures retain an explicit error state; no success or all-clear is fabricated.

IGC/NOAA upstream URLs are fixed or constrained to an official product path. Adapters reject redirects, limit fetch duration and streamed response size, cache successful responses for 55 seconds and coalesce concurrent requests. The browser polls every 60 seconds while visible. Polling is not streaming or early warning.

Trip details use verified writes to localStorage. A failed write is visible and has no server fallback. GPS stays in memory except when the person explicitly saves coordinates. Changes in site origin create a separate storage namespace and do not automatically migrate personal data.

## Running and hosting

`npm run dev` and `npm run preview` install the adapter middleware. `npm run build` emits `dist/client`. There is currently **no production HTTP server or platform deployment configuration** in this source release.

A deployment must serve the frontend and provide GET `/api/igc` and GET `/api/tsunami` on the same origin using the exported middleware/adapter. Do not deploy only the static directory and assume these endpoints exist. Do not expose Vite development/preview as a production server. Keep HTTPS, response headers, upstream monitoring and abuse controls in the chosen hosting integration.

The dev server binds to loopback. Testing a physical phone requires an intentionally configured trusted network or HTTPS deployment; granting network access is not part of source packaging.

## Remaining maintenance work

The application shell still coordinates several screens, and the CSS keeps ordered layers from iterative design. Both are readable and checked; gradual extraction and cascade consolidation remain reasonable follow-up work. Avoid a broad behavioral rewrite during release preparation. Map code splitting, coastline payload reduction, accessibility with actual users and real-device testing remain production work.
