# Contributing

Small, focused pull requests are welcome. Read [architecture](docs/architecture.md), [privacy](PRIVACY.md) and [data sources](docs/data-sources.md) before changing behavior.

1. Use Node.js 24 LTS, install with `npm ci`, and run `npm run dev`.
2. Keep source in the existing component, hook, library and style directories. Type external data as `unknown` and validate before use.
3. Update Spanish, English and Brazilian Portuguese together (`t(es, en, pt)` and `Localized` tuples; the type checker flags a missing language). Keep instructions short and usable under stress. Show distances, depths, water and wind through `src/lib/units.ts`: English uses U.S. units (miles, feet, gallons, mph), Spanish and Portuguese metric; official texts keep their published units.
4. Add meaningful regression tests for behavior changes. Use synthetic people, contacts, locations and events. Never record or attach a traveler's real browser storage, GPS, messages, screenshots or network captures.
5. Build interface changes from the design system ([docs/design-system.md](docs/design-system.md)): compose `src/ui` components and tokens; do not add colour or size literals or per-screen overrides.
6. Run `npm run check`, `npm run build` and `npm audit`. For UI changes also inspect narrow mobile and desktop layouts, keyboard navigation, errors and empty states.
7. Describe the user-visible change, its validation and remaining limitations. Do not include machine paths or confidential logs.

## Safety-sensitive changes

Cite the responsible authority for emergency guidance, phone numbers and facilities. Record source, coverage, review date and any location uncertainty. Do not invent safe points, infer aftershock relationships, equate missing data with safety, or imply automatic rescue/notification.

Map providers have usage rules. Keep visible attribution and browser caching; do not strip Referer, bulk-download tiles or evade access blocks. See [map operations](docs/map-operations.md).

## Dependencies and licensing

Pin direct package versions and commit `package-lock.json`. Update the dependency inventory with `npm run notices` after dependency changes. Preserve licenses for copied data and assets. Contributions are accepted under Apache-2.0, except files already identified under a separate data/third-party license. Do not contribute material you cannot distribute.

## Security reports

Follow [SECURITY.md](SECURITY.md). Public issues are appropriate for ordinary bugs, not secrets, private data or exploit details.
