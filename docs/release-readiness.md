# Source publication readiness

Reviewed 2026-10-11. This assessment concerns publishing the source, not certifying an emergency service. Source is published at [garagon/faro](https://github.com/garagon/faro), under Apache-2.0. No production deployment was created.

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
- 42 automated tests cover catalogue parsing, source restrictions, time semantics, geography, local storage failures, manual sharing eligibility, publication filtering and upstream response-size bounds.
- `npm audit` reports no known vulnerabilities at review time; this result must be refreshed after dependency changes.
- Browser checks of this separate copy: fresh onboarding, live catalogue rendering, automatic map imagery, language switching, current-message preparation and responsive layouts. Only synthetic personal state was used and no messages or emergency calls were sent.
- Large-bundle warning remains. This is a maintenance/performance limitation, not a claim of production performance.

## Repository configuration

The public repository was created from the reviewed source tree without importing prototype history. Maintainer/security contact is configured, private vulnerability reporting and vulnerability alerts are enabled. The CI workflow is prepared locally; publishing it requires the GitHub session to have workflow permission. Hosted CI and required branch checks remain pending until that permission is available.

## Before production use

1. Host the official-source API adapters alongside the frontend; a static deployment alone is incomplete.
2. Configure HTTPS, content/security headers, abuse limits, upstream health monitoring and a maintainer/operator contact.
3. Establish map-provider capacity and terms suitable for the expected traffic; community tile availability is not guaranteed.
4. Revalidate consular addresses, local emergency contacts and guidance with authoritative/local operators. Expand verified coverage only with evidence.
5. Test actual phones, assistive technology, constrained networks, storage failures and emergency tasks with users.
6. Improve initial bundle/coastline loading. Whole-app offline startup, background notification and remote family tracking are not implemented.

See [security review](security-review.md), [architecture](architecture.md) and [map operations](map-operations.md).
