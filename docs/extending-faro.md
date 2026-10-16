# Extending Faro

The extension boundaries are ordinary typed modules. You do not need a service account, plugin runtime or personal-data backend. Keep source adapters separate from presentation and retain the local-only privacy contract.

## Add an earthquake source

1. Add a module in `src/catalogs/` implementing `CatalogReader`. Start with `usgs.ts` for JSON fetched by the browser. For a same-origin adapter that returns `{ events, age }`, use `adapterReader` from `adapter.ts` with the agency's report host, as `igc.ts` and `emsc.ts` do; it validates rows and shows a copy kept during an outage as older data. Parse `unknown` input into the shared `Quake` shape; reject invalid responses instead of returning an empty success.
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

Country selection is global. Local help is intentionally partial. `src/data/destinations/` contains one typed module per destination. The same records drive emergency numbers, country source links, coastal authority links, local guide links, the map preset and supplementary resources. Do not add country-specific branches to UI components for ordinary directory additions.

1. Copy a small module such as `cr.ts` to a new ISO-3166 alpha-2 filename. Set its `code`.
2. Fill `emergency` only with officially sourced numbers. Retain territorial restrictions in the label and `note` (Spanish, English and Portuguese); never use a universal 911/112 fallback. Set `reviewedAt` to the actual evidence-review date, not today's date automatically.
3. Add `civilProtection`, `seismicAgency` and optionally `evacuation` with official URLs and review dates. These are external links, **not new automatically ingested earthquake sources**. Adding a feed still follows the adapter steps above.
4. Set a useful `region` rectangle and map view. These are approximate search presets, not borders or hazard zones. Describe excluded territories/islands explicitly in both `scope` strings. Presets may contain neighboring countries. Unconfigured countries use the documented centre-based fallback.
5. Add supplementary `resources` with ES/EN category and description. University and municipality links do not certify an open shelter or a volunteer vacancy.
6. Import the module and add it to the array in `src/data/destinations/index.ts`. No changes to the UI are required.
7. Run `npm run check` and `npm run build`. `tests/destinations.test.ts` checks every registered record for codes, duplicates, phone shape, content in all three languages, HTTPS attribution, dates and bounds. Add a regression for special territorial restrictions. Review the official content manually; schema tests cannot verify the truth of a phone number.
8. Verify the country search, help page, emergency screen, coast links, guide, image/text exports, unknown-country fallback and desktop/320px layouts. Update the coverage table in `docs/country-coverage.md`.

**Consular assistance separates local offices and outbound directories:** `src/data/consularMissions.ts` is the extensible mission registry (including the original building records from `src/lib/embassies.ts`); `src/data/consularDirectories.ts` stores official outbound directories by the traveler's nationality, usable across destinations. A directory link does not establish that an embassy exists at a local address. Add verified mission records to enable map markers; do not fabricate coordinates for a directory-only result.

The country-name/centre dataset remains `src/data/countries.json` under ODbL-1.0. Do not replace it with unlicensed scraped geography.

## Add a personal feature

Keep pure validation/storage helpers in `src/lib/` and UI in `src/components/`. Use `writeLocal`/`removeLocal` for verified mutations and visible failure states. Give each persisted format a versioned key and validate unknown data on read. Never attach the profile, nationality, contacts, notes or GPS to source requests.

A new upload, analytics SDK, account, cloud backup or remote tracking feature changes the privacy model and needs an explicit product decision and updated policy. Browser-local data is not encrypted and does not synchronize across origins/devices.

## Change the map

Map behavior is in `WebMap.tsx`. Keep user-selected epicenters independent of clusters, visible attribution, origin Referer, caching and list fallback. Switching providers also requires reviewing attribution, terms, privacy copy and host security policy. See [map operations](map-operations.md). Do not use browser-visible environment variables for private API credentials.

## Verification checklist

Run `npm run check` and `npm run build`. For new dependencies also run `npm run notices` and `npm audit`. Inspect desktop, 390 px and 320 px layouts, keyboard interactions, ES/EN, empty/error states and storage failures. No live emergency calls or messages are needed for tests. The CI job uses synthetic fixtures and does not depend on current earthquakes or upstream availability.

## Consular assistance, healthcare and preparedness

- Add missions to `src/data/consularMissions.ts`: destination, nationality, office type, source, check date, and source publication date where known. Several missions may serve one nationality. Only add phone numbers and addresses transcribed from the authority. An unknown coordinate remains absent. Mark historical references with `historical: true`, independently of `sourceDate`; they have no routing, map or phone action. A checked page is not a guarantee that a service operates.
- Add full official host-country consular directories to `destinationConsularDirectories`, and health directories to `src/data/healthDirectories.ts`. State gaps explicitly. Nearby Google Maps searches are manual external searches, not a verified facility feed.
- Add official evacuation-map links to a destination’s `evacuation` field. Never substitute a Google Maps route or university drill map for a public evacuation plan. Maps apply only to their jurisdiction.
- The kit catalog is `src/data/emergencyKit.ts`; keep stable IDs for local checkmarks and ES/EN copy. Each item that can be bought names a `store` kind from `src/lib/nearbyCare.ts`; hazard-specific items list their `hazards`. Instructions live in `SafetyGuide.tsx`. Earthquake protection uses attributed ECA / ShakeOut graphics in `public/illustrations/`; Faro's diagrams live in `SafetyIllustration.tsx`. Diagram labels must repeat what the written steps say: do not add thresholds, distances or claims that the text and its source do not state. Preserve the separate image usage terms in THIRD_PARTY_NOTICES.md.
- Official response summaries live in `src/data/responses.ts`. Write facts with their source and the time they refer to, link only to the publishing agencies, set `reviewedAt` and a `showUntil` no more than about a month ahead, and never call later earthquakes aftershocks or shelters safe. `tests/responses.test.ts` checks hosts, dates and wording.

## Support for travelers by nationality

`src/data/travelerSupport.ts` defines optional assistance packs by nationality, separate from the country being viewed. Packs exist for the United States (State Department contacts, STEP, passport replacement, insurance, crisis departure, missing-person assistance and business travel), Argentina (Cancillería emergency line, ViajAR, insurance, consular functions) and Brazil (Itamaraty emergency contact, ARB travel document, consular assistance and directory). A pack appears in Local help and the emergency screen when that nationality is selected and the destination differs from it. It is not inferred from language.

To add a nationality, supply titles, descriptions and actions in Spanish, English and Portuguese; verified telephone numbers with explicit caller-location scope; `contactTitle` and `contactNote` saying who may call; an official source and review date; and optionally verified destination-specific advisory links with their publisher (`advisories` is optional). `tests/travelerSupport.test.ts` restricts each pack's links to that government's official hosts. Unknown destinations use the official advisory directory, never another country's page. Domestic travelers do not receive their own abroad-only pack. Do not hardcode current advisory levels or imply that linked notices are ingested live.

These are ordinary external links opened by the traveler. No registration, auto-enrollment or profile transmission is performed. STEP registration happens on the government's site under its own privacy policy. Local emergency services remain the first contact for immediate physical assistance.
