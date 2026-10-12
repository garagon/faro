# Faro

[Español](../README.md) · [Privacy](../PRIVACY.md) · [Contributing](../CONTRIBUTING.md)

Faro is a responsive Spanish/English web app for earthquake information and personal travel preparation. Panama is the initial view; the USGS catalogue supports other regions.

**Status: early, pre-production release.** Earthquake records are published after an event. Faro is not an early-warning, prediction, emergency-dispatch or live family-tracking service.

## Run locally

Use Node.js 24 LTS and npm 11 or later. No account, API key or environment file is required.

```sh
git clone https://github.com/garagon/faro.git
cd faro
npm ci
npm run dev
```

Open the local URL printed by Vite. Development binds to `127.0.0.1`. Run `npm run check`, `npm run build`, and `npm run preview` to verify the application. The development and preview servers provide the IGC and NOAA adapters. A static frontend alone cannot serve those endpoints; Vite preview is not a production server. See [architecture](architecture.md).

## Features and limits

- Separate IGC/Panama and USGS/global catalogues, checked every 60 seconds in a visible tab.
- Automatically loaded map, filters, event list, magnitude, epicentre and explicit timestamps.
- International NOAA/PTWC tsunami products with source dates; no location-specific all-clear inferred from missing bulletins.
- Local trip profile, verified consular listings where covered, personal hotel plan and personal or work contacts (family, accommodation, insurer, consulate, employer, team coordinator, transport).
- Ready status messages as editable shortcuts, reviewed before manual sharing.
- Manually prepared status messages and sourced Spanish/English guidance.

Aftershocks are not inferred from proximity. Personal meeting points are not certified shelters. Emergency numbers and embassy records cover a limited set of countries. See [sources](data-sources.md).

Personal data stays in browser storage on the current device; there is no profile backend or analytics. Geolocation requires permission. External feed/map requests still reveal ordinary connection metadata; map requests identify the viewed area. Sharing and external directions are explicit user actions. See [privacy](../PRIVACY.md).

## Contribute and publish

`npm run check` runs formatting, lint, type checks, tests and the publication file scan. `npm run prepare:release` also builds the app and produces `artifacts/faro-source.tar.gz` with a SHA-256 manifest. Tests use synthetic fixtures and do not contact real emergency services.

Faro code uses Apache-2.0. Datasets and dependencies keep their own licenses; see [third-party notices](../THIRD_PARTY_NOTICES.md). [Publication readiness](release-readiness.md) is separate from production/emergency-use readiness.

## Extension points

| Change                     | Where to start                                          |
| -------------------------- | ------------------------------------------------------- |
| Earthquake source          | `src/catalogs/` and the shared `CatalogReader` contract |
| Polling and update states  | `src/hooks/useCatalogFeed.ts`                           |
| Geographic defaults        | `src/lib/regions.ts`                                    |
| Emergency contacts         | `src/lib/emergency.ts`                                  |
| Consular coverage          | `src/lib/embassies.ts`                                  |
| Institutions and resources | `src/lib/resources.ts`                                  |
| Safety guidance            | `src/components/SafetyGuide.tsx`                        |
| Personal data storage      | `src/lib/browserStorage.ts`                             |

The [extension guide](extending-faro.md) provides a reader example, integration steps and validation requirements. Keep independent catalogue state, original timestamps, source attribution and the browser-local privacy model. New coverage requires verified evidence; no fictional assistance facilities or safety claims.

## Common questions

**Is it realtime?** Polling runs every 60 seconds while visible; agencies may publish late. There is no early warning or streaming.

**Does it work globally?** USGS supports other regions. Local assistance depends on verified directory coverage.

**Can family track me?** You can manually share a prepared message. Remote tracking and automatic missed-check-in alerts are not implemented.

**Is it offline?** Downloaded text works offline; whole-app startup is not guaranteed offline.

Initial maintainer: [@garagon](https://github.com/garagon). Use synthetic data in issues, follow the [code of conduct](../CODE_OF_CONDUCT.md), and report vulnerabilities through [private reporting](https://github.com/garagon/faro/security/advisories/new).

## Contextual check-ins

The status composer keeps location, reachability and the next check-in time visible. Moving and help statuses reveal destination or assistance fields. Optional details include companions, an alternative contact and an explicitly selected earthquake report. The message language can differ from the interface language; free text is preserved as entered. The preview updates locally, and sharing stays disabled until the person confirms the current message. Prior history is never treated as current status.

## Country coverage

Local emergency numbers and national source links are configured for Panama, Chile, Colombia, Argentina, the United States, Mexico, Peru, Ecuador and Costa Rica. The global country selector does not imply a complete local directory. See [coverage and limitations](country-coverage.md) and [how to add a destination](extending-faro.md#add-or-improve-country-coverage).

See [emergency interactions and magnitude colors](emergency-ux.md) for message review, sharing safeguards and the distinction between magnitude, intensity and impact.

## Preparedness and local assistance

Faro includes a 14-item emergency-kit checklist saved in this browser, text export, and attributed ECA / ShakeOut earthquake instructions and supplementary Faro preparation graphics. Nearby pharmacy and hospital searches open Google Maps only on request; facility availability and road access are not verified. Consular cards support multiple offices per nationality, official directories, and separately labelled historical references. See [extension points](extending-faro.md#consular-assistance-healthcare-and-preparedness).
