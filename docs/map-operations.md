# Map operations

The base map is [OpenFreeMap](https://openfreemap.org/): vector tiles built from OpenStreetMap data, style `https://tiles.openfreemap.org/styles/positron`, drawn by MapLibre GL JS inside the Leaflet map through `@maplibre/maplibre-gl-leaflet`. Earthquakes, warning areas, hazard points, embassies and the personal point stay Leaflet layers on top.

OpenFreeMap's public instance is free, needs no account or key, and states no limit on map views or requests; commercial use is allowed. It is provided as-is, with no SLA, and may go through Cloudflare. Read its [terms](https://openfreemap.org/tos/) before changing how the map loads. It replaced OpenStreetMap's own tile servers, whose [tile policy](https://operations.osmfoundation.org/policies/tiles/) does not allow heavy traffic.

- MapLibre and the base map load after the markers, in their own chunk, so the first screen never waits for them. They are not part of the offline copy: without a connection the markers and lists work and the map says its imagery did not load.
- Tiles load automatically only when the map is mounted and displayed. Do not prefetch areas, sweep zooms or store tiles; `src/sw.ts` never caches them.
- Keep the page's `strict-origin-when-cross-origin` Referer policy, so requests carry the origin without the page path. Never use `no-referrer`.
- Keep browser HTTP caching intact; no cache-busting parameters.
- Keep the attribution visible: "OpenFreeMap © OpenMapTiles Data from OpenStreetMap", plus "PB2002 (Bird, 2003)" for the plate lines.
- Place names follow the interface language when the tiles have them (`name:es`, `name:en`, `name:pt`), then the Latin-script and local names.
- A blocked or failing tile service is a provider problem, not absence of earthquakes. Do not evade blocks; the list remains available.

## Plate boundaries

`public/data/plates.json` holds the PB2002 plate boundaries (Bird, 2003) as converted to GeoJSON by Hugo Ahlenius (Nordpil), Open Data Commons Attribution 1.0, simplified to about 1 km by `scripts/simplify-plates.mjs`. They are drawn as a thin purple line under the markers, as context for where earthquakes cluster. They are not a fault, hazard or tsunami map, and Faro draws no conclusion from them.

## Capacity

OpenFreeMap has no published limit, but it is a donation-funded service without guarantees. For a large launch, consider a monthly donation or a self-hosted instance (its code and tiles are open), and keep the list usable when the map is not.
