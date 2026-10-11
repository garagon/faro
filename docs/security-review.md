# Security Report

**Project:** Faro 0.1.0
**Stack:** React + TypeScript + Vite; Leaflet; fixed-source Node/Cheerio adapters; browser-local personal storage. No authentication, database, payments, AI service, uploads or user-data API.
**Scanned:** Active source, server, tests, configuration, publication scripts and bundled data/notices. Dependency/generated asset files were reviewed through provenance/license inventory rather than treated as application code.
**Date:** 2026-10-11

## Score: A

No critical or high findings in the reviewed publication scope; two deployment-oriented medium items remain. This bounded review and heuristic scan cannot establish the absence of every vulnerability.

## Open findings

### 1. Production HTTP controls are not implemented — MEDIUM

Location: `vite.config.ts` and `docs/architecture.md`. The project supplies local development/preview middleware, not a production server. No production CSP, HSTS or anti-framing policy can be claimed from it. Exposing a development server would expose capabilities not intended for public service.

Required change at deployment: use a production hosting integration, serve HTTPS, deny unnecessary files/routes, configure appropriate security headers and preserve OSM origin Referer. Keep development bound to loopback. There is no intentionally insecure production configuration to patch in this source release.

### 2. Upstream failure abuse controls need hosting integration — MEDIUM

Location: `server/official.mjs`, `cached`. Successful requests are cached and concurrent calls coalesced, but repeated failures are not protected by a public rate limiter/backoff policy. A public host needs request limits and outage backoff to protect itself and upstream providers. Do not infer that client-side 60-second polling limits arbitrary clients.

Required change at deployment: bounded public request rates, sensible upstream-failure backoff, provider monitoring and tests of error behavior. No external infrastructure was created in this preparation.

## Corrected during preparation

- Broad dev binding replaced by loopback in the independent publishable project.
- OSM `no-referrer` removed in both the current app and publication copy; an ordinary interactive zoom renders after correction. Only the origin is sent cross-origin; caching remains intact.
- Upstream document size is now bounded while reading, before collecting an arbitrarily large response. Regression tests cover declared and streamed oversize input and UTF-8 boundaries.
- Frontend tsunami/coastline fetches now have explicit deadlines.
- Untyped external catalogue parsing uses `unknown` validation; unused imports and broad `any` casts removed.
- Local machine paths, captures, design logs, device simulation and embedded image provenance metadata excluded from the publication copy.

## Review evidence

- Publication scanner reports paths/line numbers only; matching credential values are never echoed.
- No matching credentials or private filesystem paths found in allowed files. Test fixtures are synthetic; institutional addresses/phone numbers are intentionally public and attributed.
- No Git history exists in the prepared directory, so historical leak scanning is not applicable. Recheck if history is imported later.
- No cookie/session, SQL, auth, OAuth, payment, webhook, file-upload or AI/MCP surface exists in this application; those conditional checks are not applicable.
- React escapes text; map popup text uses DOM text content. SVG marker HTML comes from static React icon rendering, not untrusted HTML. USGS links are restricted to its HTTPS host; NOAA product paths are validated without executing upstream JavaScript; server redirects are rejected.
- Source errors return generic failure JSON rather than stack traces. Personal fields have no network fallback. Manual sharing and directions are explicit actions.
- npm dependency audit at review time: 0 critical, 0 high, 0 moderate, 0 low. This only covers known registry advisories.

## What's solid

- Personal data remains in browser storage, with verified writes and visible failures.
- Fixed source adapters and timestamp semantics avoid inventing successful or safe states.
- Tests and publication controls preserve privacy boundaries and licensing provenance.

## Top 3 actions

1. Create the repository from the reviewed clean tree, then configure private reporting and required CI checks.
2. Implement and validate production HTTP/abuse controls before public hosting.
3. Validate emergency tasks, source freshness and resource coverage with local operators and real devices.
