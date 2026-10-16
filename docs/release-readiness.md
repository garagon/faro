# Source publication readiness

## Update · 2026-10-13: emergency readiness

This update concerns the source, not certifying an emergency service. A public deployment exists separately from this repository; it must be redeployed, with the new adapter routes, before these changes are live.

Multi-hazard scope (same day): the activity screen became a situation screen with one card per hazard (earthquakes, tsunami, tropical cyclones, floods, volcanoes); warnings in force from national meteorological services with an alert feed (Panama, Costa Rica, Dominican Republic, Ecuador, Argentina); NOAA National Hurricane Center active cyclones; NWS hurricane and flood alerts for U.S. areas; GDACS points on the map; hurricane, flood and volcano guidance with original illustrations; a hazard choice in the emergency sheet; message reasons beyond earthquakes; and links to each destination's meteorological service.

Added: the emergency sheet (local number, cited first-minute actions, consular phones, saved meeting point), EMSC as a third catalogue, USGS impact products, GDACS alerts, NWS tsunami alerts for U.S. areas, family reunification links, five Central American and Caribbean destinations, U.S., Argentine and Brazilian coverage in Panama, offline opening through a service worker, original guide illustrations, a social preview image and a resilient IGC adapter (partial read, last good copy kept and marked stale, one-tap fallback to another catalogue).

Design and preparedness pass (same day): a one-column onboarding with only optional fields marked; the local help screen rebuilt as rows (emergency numbers, care search, official sources with their site, embassy contacts, family links) without nested or tinted cards; original technical diagrams with Spanish and English labels replacing the earlier figures (coast cross-section, street plan, storm floor plan, NHC watch and warning timeline, flood depth, post-storm hazards, ash fall, message example, hotel evacuation plan, post-earthquake exit); a kit that calculates water for the group, adds items by hazard and lists what is missing by shop with nearby searches; and a dated summary of the official response to the 9 October M7.7 earthquake in Panama with how to help safely. Labels no longer use tracked capitals.

Home and onboarding (same day, after review): the home is now ordered by need (call, "I'm OK" message and first steps; warnings; a map with one status row per hazard; the official response collapsed; detail in tabs) and setup no longer opens a blocking dialog: a card asks only for nationality. The earthquake detail shows magnitude and place as its header and readable time zones.

Trip, sharing and go bag (same day, after review): the profile dialog is gone; My trip holds a five-section optional form (about you, emergency contact, health, travel insurance, accommodation and dates) and the card it produces, shareable by WhatsApp, Telegram, SMS, email, the system share sheet or copy. Health enters the card only when chosen. The go bag is its own menu section. Every screen shares one 1,180 px content column.

Polish pass (same day): the emergency sheet (now a screen) leads with a large call button for the local number and separates its sections with hairlines instead of nested boxes; My status puts the three states first, then ready messages and the reason, in the app's chip style; the guide index uses readable type with the current topic highlighted; arrow glyphs appended to link text were replaced with the external-link icon or removed.

Product audit (same day): five audits (usability, wording, colour and type, reliability, emergency flows) were run with browser measurements, and the fixes below came from them.

- Emergency is a screen, not a popup. It opens from the red button in the sidebar or top bar, from "What to do now" and from My status. It is marked as the current page and keeps the steps beside the numbers on wide screens. Focus starts on the call button, or on the country question when none is set. The hazard choice is one tab stop with arrow keys.
- Floods: Panama's IMHPA warnings now keep the agency's instructions, description and warning area. A warning in force that mentions flooding or rising rivers changes the home flood row to "IMHPA warns of possible flooding", lists the instructions under the warning and shades the warned area on the map. The map note says it is the area the warning covers, not a map of flooded streets.
- Never "none" without a recent, complete answer. Tsunami, GDACS and national-warning rows say "not confirmed" when the answer is partial, failed, older than a few polling cycles or the device is offline. Earthquakes say "no data: offline" when the catalogue never answered. Times from another day carry the date. NOAA retrieval time follows the device clock through the adapter's `age`, like the other feeds.
- Failure states: an error boundary keeps the emergency numbers on screen if any view fails. Impossible stay dates are rejected and never break the card. A USGS feed with no recognisable record fails instead of reading as "no earthquakes". A request for another country never shows the previous country's answer. Blocked storage is reported. Deleting the trip removes each part separately. Record ids work without `crypto.randomUUID`. The country list is no longer a tab stop that dropped focus to the page. Puerto Rico, the US Virgin Islands, Guam, American Samoa and the Northern Mariana Islands show 911.
- Visual system (`src/styles/system.css`, loaded last): one secondary-text grey (#4f625c, 6.0:1 on the page). The smallest size is 12px. Guide steps are 16px in the ink colour. Red #b42318 only means "call", and status choices are marked the same way for every state. Field borders are at 3:1. There is one focus ring: dark on light surfaces, white on the dark sidebar. The earthquake dot in the home list is neutral, so a magnitude band never reads as a warning level.
- SINAPROC (Panama): the home lists the agency's latest communiqués, prevention notices and incident reports with their publication time, opening lines and a link, and states when the list could not be loaded or may be old. Drill posts are left out. Without an IMHPA flood warning in force, a post from the last 48 hours that mentions rain or flooding turns the flood row to "SINAPROC mentions rain or flooding", with its title and age; it is never called a warning in force.
- The home is a compact board (about 1,500 px on desktop and 2,700 px on a phone, from about 4,000 and 5,600): the three actions, "Official now" (IMHPA warnings and SINAPROC posts, one line each, opening in place; the flood row opens the matching warning), the map beside one row per hazard with the hazard name in its own column, and the official response as one row. The earthquake list, tsunami, cyclones and alerts moved to a detail page reached from each row, with a link back. Every block shares one card, heading and row style, and page titles share one type style.
- Sources & updates is a page, not a popup: a status board with one row per source for the place being viewed (responding, partial, old data, not responding, checking or offline; when it was last checked; how often Faro asks; link to the official site), then what each source publishes, how to read dates and coverage, location and privacy, and map licences. It opens from the sidebar, the footer, the home header and the earthquake list.
- The earthquake list is paged (20 per page, "Showing 21–40", previous, page numbers and next; "Page 2 of 4" on phones), and focus returns to the top of the list on each page. Rows end in a chevron, since they open the detail view rather than another site.
- Before the app starts, the static text in `index.html` shows as a quiet loading screen in both languages on the app's background, instead of unstyled HTML.
- Wording: the home actions read "Call 911", "Tell people how I am" and "What to do now". The status message names the earthquake as "earthquake mentioned … (source: IGC)" and says it does not describe how the person was affected. The menu says Guide.

Readiness fixes (2026-10-14), from four audits (product, design, reliability, content):

- Truthfulness:
  - The tsunami row is never "no threat messages" while a threat message has no closing message. Bulletin times are moved onto the device clock using the adapter clock, a message up to 10 minutes "ahead" still counts as recent, and an open threat older than 6 hours (up to 24) reads "not confirmed".
  - A recent threat shows a banner at the top of the home and the emergency screen. It names the ocean basin, says it may not apply to your coast, and repeats the natural-warning step.
  - Earthquake rows show "not updated since …" with the last known event when data is old, never a 24 h count.
  - The IMHPA feed fails on a maintenance page and is marked partial when more than 20 messages exist.
- Content:
  - Panama backup numbers: Policía 104, Bomberos 103 and SINAPROC 520-4426, each with its source.
  - Corrected first steps: all floodwater, gas, coast on foot with a third-floor fallback and waves for hours, aftershocks, stairs, and a landslide step.
  - A status message for family abroad that points to the embassy.
  - A flood health topic (leptospirosis, dengue, water) citing CDC, and a shelters pointer to SINAPROC.
  - The Costa Rica 911 source and the FTC link were corrected.
  - The response summary is reviewed and shown at most 14 days after each review, and shows embassy lines for other nationalities.
  - Emergency numbers fail CI after 90 days without review.
- Resilience:
  - The loading screen in `index.html` has a working "Call 911" link and first steps without JavaScript.
  - Country borders (1.4 MB) load after start; the main script went from 2.58 MB to 1.18 MB.
  - National warnings and SINAPROC posts are kept on the device and shown offline as "last data" until they expire.
  - The adapter waits 15–30 s after a failed refresh instead of retrying on every request. It sends `s-maxage=30, stale-if-error=600` on good answers, and the browser adds the HTTP `Age` header to each answer's age.
  - Two-step upstream reads finish within about 15 s.
  - The USGS offline copy keeps only parsed fields and is written every 5 minutes.
- Design:
  - On phones the hazard rows come before the map, and "Official now" follows the map.
  - The local emergency number is the only red button; every other number is white with a dark edge.
  - The magnitude scale has no red (6.0–6.9 violet, 7+ indigo).
  - The tsunami, cyclone and alert tabs are board cards with the status first.
  - Side stripes were removed, every control is at least 44 px and text at least 12 px.
  - In English, Spanish-only official text is marked "in Spanish". Warning expiry shows its time zone, and communiqués show their opening line. GDACS earthquake severity reads as "Magnitude 7.7, depth 13 km".
  - Status starts with the three choices; ready messages and the reason are one tap away.

Go bag and translation (2026-10-14):

- The go bag uses the board system: a plain warning line, figures without boxes, one list with hairlines, counters as text, and no tint on ticked items.
- English readers can translate Spanish-only warnings and posts on request: on the device when the browser offers it, otherwise with a Google Translate link for the text or the full page. Translations are labeled automatic, and "Show original" returns to the official Spanish.
- Remaining British spellings were changed to US English.

Reading under stress (2026-10-14):

- Status messages follow the American Red Cross "Safe and Well" statements and the FCC/FEMA advice:
  - Each message says when the person will write again, or that they will.
  - Low battery or a weak signal is followed by what it means for replies.
  - The closing asks people to reply by text instead of calling ("phone lines may be busy"). A help request asks for a reply as soon as it is seen.
  - The earthquake reference reads "For reference, the earthquake as reported by IGC: …".
- The disaster the place is living through comes right after the actions:
  - It is named by magnitude and place ("Magnitude 7.7 earthquake in southern Panama"), so the date is never read as a magnitude.
  - The date, with how long ago it was, sits on its own line, and the latest official picture is visible before opening.
  - A clear button opens the full response.
- "What is happening" shows whether Faro is checking the sources right now: live with the time of the last check, not updating, or offline with the time of the last data.
- Hazard rows state the plain fact first ("No tsunami threat messages"), with the source and time below.
- Official now is grouped by source. Each group has its check time, and each row shows the title, then the level and the expiry or publication time. Actions sit on one row when a message is open.
- International alerts start with a one-sentence answer and use titles like "Magnitude 7.7 earthquake in Panama". Each GDACS level is explained in plain words, and the date shows how long ago it was.
- Forms and layout:
  - Every select shares one style (44 px, the field border, one chevron).
  - The country bar is part of the page, with a labeled save button and a "My location" button. It reads the location once, works out the country on the device from the land borders and keeps nothing.
  - The nationality card no longer clips its country list or its title when the list opens.
  - Go-bag items have icons, and the water basis note sits on its own line.

Launch corrections (2026-10-14), from the product re-test and the sources audit:

- Tsunami:
  - The last NOAA answer is kept on the device (`faro-tsunami`). After an offline reload, an open threat stays on the home and emergency screens.
  - When the data is not current, the banner says "Not updated since …: there may be a newer message".
  - The banner leads with the natural-warning step: if you are on the coast and felt strong or long shaking, go on foot to high ground. On a 390 px phone, that line is visible above the bottom bar on the emergency screen.
  - An open threat older than six hours reads "Threat message not closed", with its issue time.
  - A recent cancellation or final message is named with its time, instead of "No threat messages".
- National warnings and SINAPROC:
  - The adapter's `stale` flag is honoured: during an outage, its previous copy never reads as "No warnings in force".
  - A copy older than 25 minutes is shown as last data.
  - When IMHPA cannot be read, the Floods row says so and points to its site, instead of "No international alerts".
- SINAPROC posts:
  - Posts keep the agency's later edit time apart from publication. An opened post shows "Last edited on its site: …", without interpreting what changed.
  - A quiet week names the date of the last post.
- The disaster card shows each agency's magnitude: 7.7 per USGS, 7.2 per Panama's IGC. Both were checked on 2026-10-14.
- Panama's Official now lists who reports water, power, roads and health, which Faro does not read: IDAAN, ENSA or Naturgy, MOP and MINSA. MOP and IDAAN did not answer when checked, so they are named without links.
- The earthquake monitor says "Source not responding" when the catalogue fails before any answer, and the tab shows no count instead of "0". Offline rows say "Offline".
- Status messages:
  - Every message without a set time ends with "I'll write again when I can", so a bare "I'm OK" still says what comes next.
  - The emergency screen links straight to the embassy.
  - Local help states who announces open shelters, outside the collapsed resources.
- Build and public pages:
  - The service worker version comes from the content of every cached file.
  - `FARO_SITE_URL` at build time makes the preview image, `og:url` and canonical absolute.
  - The manifest declares its language and separate `any` and `maskable` icons.
  - The about page has the same facts in both languages.

Portuguese, offline map and performance (2026-10-14):

- Brazilian Portuguese is a third interface language:
  - Every screen, status message, guide topic and destination record has Spanish, English and Portuguese text, and tests require all three.
  - The header switcher reads ES, EN, PT, and a Portuguese browser opens in Portuguese.
  - Official Spanish text can be translated into Portuguese on request, as in English. The ShakeOut graphic has no Portuguese edition, so Portuguese readers see the Spanish one, labelled as such.
  - The loading screen, about, privacy, manifest and `llms.txt` include Portuguese.
  - On phones narrower than 420 px the header shows the lighthouse mark without the word "Faro", so the three language buttons fit at 375 and 390 px.
- Offline map. Faro does not store map tiles: Google's terms, the map providers' policies and `AGENTS.md` rule it out.
  - Local help and My trip have a card that opens the area in Google Maps and gives that app's own offline-download steps and limits, as Google documents them. The area is the saved stay, or otherwise the centre of what Faro's map last showed.
  - The link carries only a centre rounded to about 1 km and a city-scale zoom (11–15). It opens only when tapped.
  - The pharmacy and hospital search says that searching needs a connection.
- Keyboard: a "Skip the map" link before the map moves focus past its markers to the map legend and actions.
- Performance:
  - The coastline file went from 7.7 MB to 1.8 MB (`scripts/simplify-coastline.mjs`, at most 0.25 km of change).
  - Adapter answers are gzip-compressed when the browser accepts it (IGC about 251 KB to 31 KB).
  - The entry script only registers the service worker and loads the app, so about 1.2 KB of CSS blocks the first paint.
  - The build publishes the licences at `/licenses/`, linked from the about page.

Final launch review (2026-10-14). Five independent reviews looked at the app as a person in a real emergency would use it: a walkthrough in the browser, safety content against the cited sources, network failures and offline use, accessibility under stress, and security, privacy and operations. None found a problem that could cause harm in the current code; all five asked for the fixes below.

- Safety content:
  - The coast step follows NOAA: on the beach or by the water, leave after any earthquake; elsewhere on the coast, after strong or long shaking. If high ground cannot be reached, go as high or as far from the sea as possible. The unsourced "third floor" and "use the stairs" were removed, and the gas step keeps only what the cited CDC page supports.
  - The home tsunami row reads "No NOAA threat messages in 6 h" and adds "Felt strong or long shaking on the coast? Go to high ground now". The same rule sits under the home actions, as on the loading screen. Offline, the tsunami panel no longer says "no messages".
  - The response card names the weekday correctly (Friday 9 October) and dates SINAPROC's figures instead of calling them the latest.
  - GDACS green reads "no international assistance expected", never "low impact".
  - The cyclone tab shows a count only from a current NHC answer.
- Numbers and messages:
  - SINAPROC's line is written `+507 520-4426`, so it connects from a foreign SIM. Its source is the SINAPROC homepage, where it is listed.
  - The emergency screen shows each country's note, and Panama's reads "if a call to 911 does not go through".
  - Nicaragua's 128 is labelled "Ambulance", as the cited sources support.
  - A help message without a place asks for one next to the field. The "I can't leave" message no longer promises a location it may not contain.
  - Offline, SMS comes first among the share options, with a note that it only needs a call signal.
  - The error fallback says so when it has no numbers for the country.
- Flows: "What to do now" opens the emergency screen on its first steps; the header button still starts on the call button. The hazard chosen there is kept, and "Full guide" opens that hazard. Changing country moves focus to the new number, or to the "no verified numbers" line.
- Accessibility: at 150–200 % zoom the top bar and menu wrap instead of leaving the screen. In landscape the sidebar scrolls and shows the emergency button after the logo. "Install" no longer covers "Save" at 761–900 px. Numbers do not break across lines. The profile button has a name. Connection changes and share feedback are announced. Spanish place names from IGC are marked `lang="es"`. High-contrast mode outlines the chosen hazard, screen and language.
- Server and offline copy:
  - A source past its 55 s lifetime is served at once while one refresh runs, so a slow IGC no longer holds every visitor. Tsunami bulletins are excluded.
  - Unknown query parameters get 400. `gzip;q=0` is honoured. HEAD works for uptime checks.
  - The service worker installs from the network, bypassing the HTTP cache, and leaves no partial copy when an install fails.
  - Kept earthquake copies are deleted after a week, as the privacy page says.
  - After a failed check the app tries again in 15 s. A hidden tab stops re-rendering every second. The live dot pulses three times instead of forever.

Launch hardening (2026-10-14, later):

- Offline copy: a release that installs but fails to start no longer replaces the working copy. Each copy is marked once a page has started from it; offline, the newest copy that started opens, and older copies are deleted only after the new one starts. Tested with a release whose start script throws: offline, the previous version opened; the next working release replaced both. The footer says "Available offline on this device" only after the copy is confirmed. Saving a trip asks the browser to keep the site's storage.
- A catalog whose newest record is more than a day old says so with the record's age, and the earthquake detail offers the other catalogs. The other catalogs are also offered when the data is old, not only when a request fails, and the earthquake tab shows no count from old data. Found live on 2026-10-14: IGC's table had no record after 10 October, then its site answered "Estamos en mantenimiento"; the adapter returned 502 and the app said "Not updated since …".
- Panama opens on EMSC while IGC is not publishing (`PANAMA_CATALOG` in `src/App.tsx`); IGC stays one tap away. Set it back to IGC once IGC's table updates again.
- SINAPROC's WhatsApp line (+507 6998-4809, listed on its homepage as available from any phone, 24 hours) sits with its phone numbers on the emergency and local help screens. It only opens a chat.
- The coast rule sits right after the call button on phones, so it is on the first screen at 320×568.
- First steps add FEMA's "In a multistory building, do not use elevators" (FEMA, Shelter-in-Place for Earthquake, November 2021).
- `about.html` and `privacy.html` load their style from `pages.css`, so the site runs under the Content-Security-Policy below with no violation (checked on every screen in Spanish and Portuguese).

Second product review (2026-10-14, evening). Four more reviews looked at a first visit in the middle of a crisis, every screen and flow, today's real data with other countries and everything Faro produces, and the visual design. All four said ready with fixes; none found anything that would put someone in danger. Fixed:

- Layout: on tablets and desktops the local-help numbers card and the home nationality card squeezed their text to one word per line; both now stack. The map legend shows a small copy of each symbol. Links inside sentences no longer open 44px gaps. Phone menu icons line up.
- Flows: the phone's Back button moves between Faro's screens (and closes an open earthquake sheet) instead of leaving the app. A nationality chosen on the emergency or local help screen is saved like the home card's. When the embassy has no verified phone, the screen says so and points to Local help instead of hiding the section. A ready message's reason no longer carries over to the next one. "Review message" also sits next to the share buttons. "Delete everything Faro saved in this browser" is in My trip.
- Truthfulness: the Panama response card follows SINAPROC communiqué #11 (data up to 13 October, 19:00), with SINAPROC's 7.5 next to USGS 7.7 and IGC 7.2. EMSC opens outside the U.S., where USGS read "none in 24 h" while EMSC listed the Costa Rica and Guatemala activity. In U.S. areas the flood and cyclone rows lead with NWS alerts and open the NWS tab. Failing sources read "Could not be checked" and the earthquake source is named when only it fails. The latest-earthquake card says a felt quake can take minutes to appear. GDACS levels never read as "low impact". The cyclone tab has no basin count. Searching a map area says so in the earthquake row.
- Content: the guide's coast step and download follow NOAA's beach rule; the downloaded guide carries the local numbers and its date; the trip card says 911 is "from a phone in Panama", and its saved image carries the same facts as the text card; go-bag water and food follow the plan; family-link and EU directory names are translated, and Spanish-only health pages are marked; the link preview describes every hazard.

Map, after comparing with SismoLive (2026-10-15). The Panama City municipality's SismoLive reads the same three catalogues (USGS, EMSC, IGC) and draws them on OpenFreeMap with plate boundaries. Two of its choices were adopted:

- Base map: OpenFreeMap vector tiles (OpenStreetMap data), drawn by MapLibre inside the existing Leaflet map, replace OpenStreetMap's own tile servers, whose policy did not allow launch traffic. OpenFreeMap is free, with no key, no stated request limit and no SLA. MapLibre loads after the markers, in its own chunk, and stays out of the offline copy. Place names follow the interface language. The network goes quiet once the visible tiles are drawn.
- Plate boundaries: PB2002 (Bird, 2003; GeoJSON by Hugo Ahlenius, Nordpil; ODC-By 1.0), simplified to about 1 km (21 KB compressed), drawn under the markers with a legend line and attribution. Context only, not a hazard map.

Not adopted, on purpose: estimated wave arrival times to cities (they read as an early warning and are computed after the fact), aftershock counts (an inferred relationship), sound alarms, analytics, and reports that send personal data. Merging the catalogues into one deduplicated list is left as a product decision, because Faro shows each catalogue as published.

Dependencies added: `maplibre-gl` 6.14.0 (BSD-3-Clause) and `@maplibre/maplibre-gl-leaflet` 0.1.4 (ISC); notices regenerated, `npm audit` reports 0 vulnerabilities. The site ran under the Content-Security-Policy below with no violation, including the map.

Validation on 2026-10-14: formatting, lint, strict types, 193 Node tests and the publication scan pass, and the production build passes. Every screen was checked in Spanish, English and Portuguese at 320, 390 and 1440 px with no horizontal overflow, no cut labels and no console errors. The header was measured from 320 to 1024 px in the three languages, and zoomed and landscape views at 195×422, 223×482, 260×562, 844×390 and 1280×720. With the network cut after a first visit to the production build, the app reopened with its emergency numbers. No dependency was added or changed. The adapter changes in `server/official.mjs` need a redeploy to reach production.

Known limits: font sizes are in pixels, so the phone's text-size setting has no effect (page zoom works). The USGS 7-day feed is polled every minute while the app is visible (about 10 MB per hour). Browsers may still clear site storage: Safari may do so for a site not added to the home screen after 7 days without use.

Validation on 2026-10-13: formatting, lint, strict types, 179 Node tests and the publication scan pass, and the production build passes. With the network cut after a first visit, the emergency screen, its numbers, the guidance image and the about page opened, and no `/api/` response was in the offline cache. Layouts were checked at 320, 390, 1440 and 1600 px in Spanish and English with no horizontal overflow. Contrast and size were measured on the audited elements, and keyboard order was checked on the emergency screen. No dependency was added or changed. The CAP parser change and the new `/api/sinaproc` adapter in `server/official.mjs` need a redeploy to reach production.

Before the next production release:

1. Build from the current source. Route all seven `/api/*` paths to `officialMiddleware` (one catch-all is simplest), and serve `/sw.js`, `/privacy.html` and `/licenses/` from the root, `/sw.js` and `index.html` without long-lived caching. On 2026-10-14 the public deployment was an older build in which five of the seven routes, `/sw.js` and `/privacy.html` returned 404. After deploying, request each route with GET.
2. Build with `FARO_SITE_URL` set to the production origin, so the preview image, `og:url` and canonical are absolute. Do not also inject them in a deployment script, or the pages carry two of each.
3. Before each deploy, open the production build (`npm run preview`) and confirm the app starts. Installed copies keep the last version that started, but new visitors would get the broken one.
4. Set response headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` (never `no-referrer`, which breaks map tiles), `Permissions-Policy: geolocation=(self)` and a Content-Security-Policy. The app runs without violations under `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self' https://earthquake.usgs.gov https://api.weather.gov https://tiles.openfreemap.org; worker-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`.
5. Confirm the CDN caches `/api/*` answers (a second request is a cache hit) and honours `stale-if-error`. Add rate limiting on `/api/*`.
6. Monitor each route: alert on 502s, or on `stale: true` for more than 10 minutes. IGC slowed below usable response times during the October 2026 Panama sequence; EMSC and USGS are the fallbacks.
7. Map capacity: the base map now comes from OpenFreeMap (free, no key, no stated request limit, no SLA). For a large launch consider a monthly donation or a self-hosted instance (see `docs/map-operations.md`).
8. Get written permission from IGC and SINAPROC to read their sites, as `THIRD_PARTY_NOTICES.md` notes.
9. Test on real iPhone and Android devices: installation, opening in airplane mode, calling links (including `+507 520-4426` from a foreign SIM) and sharing.

## Initial source publication · 2026-10-11

Reviewed 2026-10-11. Source is published at [garagon/faro](https://github.com/garagon/faro), under Apache-2.0. No production deployment had been created at that date.

## Prepared

- Apache-2.0 selected for application code, with LICENSE, NOTICE and separate data/dependency notices.
- Standalone responsive application with components, hooks, domain/storage libraries and styles in distinct directories.
- Uniform Prettier formatting, ESLint, strict TypeScript, unused-code checks, pinned direct dependencies and npm lockfile.
- README in Spanish and English, contributor guidance, privacy/security policies, community conduct, issue/PR templates and a CI workflow with read-only permissions and pinned action commits.
- Explicit publication file allowlist, heuristic secret/private-path scan, source archive and SHA-256 manifest. Installed modules, builds, environment secrets, captures, local reports and legacy phone simulation are excluded.
- No application account identifiers, credentials, private contact records or browser-storage exports found in the selected source. Public institutional addresses and numbers remain intentional attributed product data.
- The prototype image with embedded provenance metadata is replaced in this copy by a small source SVG. No binary capture or generator metadata is included.
- OSM origin Referer corrected; no cache busting, tile proxy workaround or bulk prefetch was added.

## Validation

- Formatting, lint, strict TypeScript and production build pass.
- 50 automated tests cover catalogue parsing, source restrictions, time semantics, geography, local storage failures, manual sharing eligibility, publication filtering and upstream response-size bounds.
- `npm audit` reports no known vulnerabilities at review time; this result must be refreshed after dependency changes.
- Browser checks of this separate copy: fresh onboarding, live catalogue rendering, automatic map imagery, language switching, current-message preparation and responsive layouts. Only synthetic personal state was used and no messages or emergency calls were sent.
- Large-bundle warning remains. This is a maintenance/performance limitation, not a claim of production performance.

## Repository configuration

The public repository was created from the reviewed source tree without importing prototype history. Maintainer/security contact is configured, private vulnerability reporting and vulnerability alerts are enabled. The CI workflow is published and its first hosted run passed. The `verify` check is required on the main branch; force pushes and branch deletion are disabled. Repository administrators retain their normal bypass authority.

## Before production use

1. Host the official-source API adapters alongside the frontend; a static deployment alone is incomplete.
2. Configure HTTPS, content/security headers, abuse limits, upstream health monitoring and a maintainer/operator contact.
3. Establish map-provider capacity and terms suitable for the expected traffic; community tile availability is not guaranteed.
4. Revalidate consular addresses, local emergency contacts and guidance with authoritative/local operators. Expand verified coverage only with evidence.
5. Test actual phones, assistive technology, constrained networks, storage failures and emergency tasks with users.
6. Improve initial bundle/coastline loading. Whole-app offline startup, background notification and remote family tracking are not implemented.

See [security review](security-review.md), [architecture](architecture.md) and [map operations](map-operations.md).
