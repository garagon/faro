# Extending Faro

The extension boundaries are ordinary typed modules. You do not need a service account, plugin runtime or personal-data backend. Keep source adapters separate from presentation and retain the local-only privacy contract.

## Add an earthquake source

1. Add a module in `src/catalogs/` implementing `CatalogReader`. Start with `usgs.ts` for JSON or `igc.ts` for a same-origin adapter. Parse `unknown` input into the shared `Quake` shape; reject invalid responses instead of returning an empty success.
2. If browser CORS prevents direct access, add a fixed upstream adapter/route in `server/official.mjs`. Do not accept arbitrary upstream URLs. Preserve HTTPS, redirect rejection, timeout, streamed size limit, caching and request coalescing. Add parser fixtures to `tests/`.
3. Expose the reader through a small hook following `src/hooks/useIGC.ts`; the shared `useCatalogFeed` already handles visible-tab polling, aborts, retries, receipt history and cached data.
4. Wire the hook and selector in `src/App.tsx`, extending the source ID type and country default where needed. Add its coverage/source explanation in `InformationDialog`. Existing sources intentionally keep independent state; do not merge records from different agencies without an explicit deduplication policy.
5. Test malformed data, timestamp/timezone parsing, duplicate IDs, revisions, URL restrictions, failures and first-load behavior. Verify switching sources does not relabel an old record as newly received.

```ts
import type { CatalogReader } from './types.ts';
import { parseFeed } from '../lib/domain.ts';

// Example only: implementing this endpoint is part of adding the source.
export const regionalReader: CatalogReader = {
  async read(signal) {
    const response = await fetch('/api/regional', { signal });
    if (!response.ok) throw new Error('Regional source unavailable');
    const raw: unknown = await response.json();
    const feed = parseFeed(raw); // Replace if the agency does not use USGS-compatible GeoJSON.
    return { ...feed, fetched: Date.now() };
  },
};
```

A `Quake` carries ID, location, magnitude (nullable), depth, occurrence/revision times, source link and review state. Keep unknown values unknown. If the upstream supplies no catalogue generation time, use the existing documented `0` sentinel. Do not substitute fetch time for occurrence/revision time. Add new agency IDs to the source type deliberately.

## Add or improve country coverage

Country selection is already global. Geographic defaults live in `src/lib/regions.ts`; the country database is `src/data/countries.json` under ODbL-1.0. Approximate country-centered rectangles are not administrative borders.

- **Emergency numbers:** add a country entry in `src/lib/emergency.ts` with official source, agency and ES/EN labels. Retain subnational/domestic restrictions. Test unsupported countries and number scopes.
- **Embassies:** add a record in `src/lib/embassies.ts` with host country, represented nationality, bilingual name, official contact/source, approximate coordinates, address and applicable caveat. Never label a mission a shelter. Test `embassyFor` and outbound routes.
- **Institutions/volunteering:** add attributed records in `src/lib/resources.ts`. An institution link is not proof of a currently open assistance point.
- **Guidance:** edit the situation documents in `SafetyGuide.tsx`; provide matching Spanish/English and a responsible source. Keep local evacuation-map scope explicit.

Use the neighboring typed record as the schema example. Do not add fictional live directory records merely to demonstrate a format; test fixtures belong under `tests/`.

## Add a personal feature

Keep pure validation/storage helpers in `src/lib/` and UI in `src/components/`. Use `writeLocal`/`removeLocal` for verified mutations and visible failure states. Give each persisted format a versioned key and validate unknown data on read. Never attach the profile, nationality, contacts, notes or GPS to source requests.

A new upload, analytics SDK, account, cloud backup or remote tracking feature changes the privacy model and needs an explicit product decision and updated policy. Browser-local data is not encrypted and does not synchronize across origins/devices.

## Change the map

Map behavior is in `WebMap.tsx`. Keep user-selected epicenters independent of clusters, visible attribution, origin Referer, caching and list fallback. Switching providers also requires reviewing attribution, terms, privacy copy and host security policy. See [map operations](map-operations.md). Do not use browser-visible environment variables for private API credentials.

## Verification checklist

Run `npm run check` and `npm run build`. For new dependencies also run `npm run notices` and `npm audit`. Inspect desktop, 390 px and 320 px layouts, keyboard interactions, ES/EN, empty/error states and storage failures. No live emergency calls or messages are needed for tests. The CI job uses synthetic fixtures and does not depend on current earthquakes or upstream availability.
