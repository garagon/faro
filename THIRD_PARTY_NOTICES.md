# Third-party notices

Apache-2.0 applies to Faro application code. It does not replace the licenses or terms of data, fonts, icons, libraries or remote map services.

| Material                             | Source                                                                                                           | License / treatment                                                                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/countries.json`            | [world-countries 5.1.0 / mledoze](https://github.com/mledoze/countries)                                          | Derived country database: **ODbL-1.0**, retained in `licenses/ODbL-1.0.txt`                                                                             |
| `public/data/coastline.json`         | [Natural Earth, 1:10m coastline](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-coastline/) | [Public domain](https://www.naturalearthdata.com/about/terms-of-use/); converted to rounded coordinate lines, accessed 2026-10-11                       |
| DM Sans, DM Serif Display            | [Fontsource](https://fontsource.org/) packages pinned in lockfile                                                | SIL Open Font License 1.1; license text retained in dependency notices                                                                                  |
| Phosphor icons                       | `@phosphor-icons/react`                                                                                          | MIT                                                                                                                                                     |
| React, Radix, Cheerio, markercluster | Their pinned npm packages                                                                                        | MIT                                                                                                                                                     |
| Leaflet                              | [Leaflet](https://leafletjs.com/)                                                                                | BSD-2-Clause                                                                                                                                            |
| OpenStreetMap displayed tiles        | [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)                                            | Attribution stays visible; [tile usage policy](https://operations.osmfoundation.org/policies/tiles/) applies. Tiles are not included in this repository |
| Faro mark                            | `public/faro-mark.svg`                                                                                           | Simple project-authored SVG, Apache-2.0; no embedded generator metadata                                                                                 |

## Country database

The included database retains ISO country codes, Spanish names, approximate centers and regions from `world-countries`, with application-specific zoom hints. It is distributed as a separate derivative database under ODbL-1.0; it is **not relicensed under Apache-2.0**. The full derived database is supplied in JSON form. Coordinates are approximate map centers, not official boundaries or emergency jurisdictions. Changes to this dataset must preserve its attribution and database license.

## Software notices

[Dependency inventory](docs/dependencies.json) lists the versions and license identifiers from `package-lock.json`, including optional platform packages. `licenses/dependencies.txt` retains available license/notice texts from packages installed on the development platform. Run `npm run notices` after changing dependencies; platform-specific packages also distribute their own notices through npm. Keep these notices with distributed builds.

## Official sources

Source links identify USGS, NOAA, IGC/Universidad de Panamá, SENAPRED and other public agencies. Faro does not claim their names, logos, data or materials as its own. Guidance is summarized and linked; full agency publications and scraped catalogue snapshots are not bundled. Runtime access to each service remains subject to that provider's policies. See [data sources](docs/data-sources.md).

## Country boundaries

`src/data/countryBoundaries.json` is derived from Natural Earth 1:50m countries v5.1.2, public domain. Processing and geographic limitations are documented in `docs/country-geography.md`.

## Earthquake protective action illustrations

`public/illustrations/drop-cover-hold-es.png` and `drop-cover-hold-en.png` are unmodified Earthquake Country Alliance / ShakeOut graphics. ECA makes these available for campaigns and outreach: https://www.earthquakecountry.org/graphics/ . Original downloads are listed at https://www.earthquakecountry.org/languages/ . Retrieved 2026-10-12.

These graphics retain the provider's usage terms and are **not relicensed under Apache-2.0**. Faro includes them for public earthquake-preparedness education, with visible attribution and a link to the original resource. Their presence does not imply endorsement of Faro or Oktsec.
