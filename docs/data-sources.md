# Data sources and coverage

| Source                                                                                          | Integration                                                                        | Coverage and limitations                                                                                               |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [USGS](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php)                           | Public `all_week.geojson`, checked every 60 seconds in a visible tab               | Global catalogue; publication/review can be delayed. No aftershock relationship in this summary feed                   |
| [IGC / Universidad de Panamá](https://sismosgeociencias.up.ac.pa/)                              | Same-origin adapter parses the public table                                        | Panama/regional records. Not a contracted API; markup can change. Event revision time is not supplied                  |
| [NOAA/PTWC](https://www.tsunami.gov/?page=product_list)                                         | Same-origin adapter reads WEPA40, WEPA42, WECA41, WECA43 descriptors and bulletins | International Pacific/Caribbean products, not a complete local warning service. Original evaluation remains in English |
| [Natural Earth](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-coastline/) | Bundled generalized coastline, local distance calculation                          | Approximate mapping; not a hazard, inundation or evacuation map                                                        |
| [OpenStreetMap](https://www.openstreetmap.org/copyright)                                        | Browser tile requests for the visible map                                          | Best-effort external service; attribution, origin Referer and caching required                                         |

## Local assistance

The Panama mission directory in `src/data/consularMissions.ts` contains 24 records with current official source links and 26 historical references from the EU's October 2024 directory. Not every current-source record has an address or phone. Historical references are collapsed, dated, and never used for phone calls, routing or map pins. This is not an exhaustive diplomatic registry. An unsupported combination means Faro has no record, not that the country lacks representation. Six building markers have documented coordinates; Spain's marker and directions are withheld while a temporary move remains unconfirmed.

Nearby pharmacies and hospitals are explicit Google Maps searches, not live availability data. The user enters a place or requests approximate GPS coordinates; the query is sent only when they open a search. Official complementary sources are [MINSA's facilities directory](https://instalaciones.minsa.gob.pa/) and [SENAPRED's Visor Preparado](https://www.senapred.gov.cl/visor-preparado/).

The 14-item emergency checklist is based on [SENAPRED's emergency kit](https://www.senapred.gov.cl/kit-de-emergencia/) and [family preparation](https://senapred.cl/familia-preparada/). A power bank is an explicit Faro addition. Checklist marks stay in the browser. The original vector illustrations supplement written instructions; they are not official SENAPRED illustrations.

The emergency-number directory covers Panama, Chile, Colombia, Argentina, the United States, Mexico, Peru, Ecuador and Costa Rica with explicit source and geographic caveats. No global default number is invented. Some numbers apply only to a specific domestic jurisdiction, including SAMU coverage in Peru. See [country coverage](country-coverage.md) and the country modules in `src/data/destinations/`.

Guidance links to SENAPRED, CDC, NOAA and national/local authorities. Chilean evacuation maps apply to Chile; they do not identify safe locations in Panama. Institutions and volunteer links do not imply facilities are open or available.

## Updating records

Record an official source, applicable country/jurisdiction, review date and uncertainty. Retain source-issued dates separately from fetch time. Use synthetic test fixtures; do not commit a live cache as application data. A missing/failed source must remain visibly missing/failed. Have relevant authorities or qualified local operators validate safety-critical wording before deployment.

## Estado de los comunicados de tsunami

Los productos internacionales NOAA/PTWC consultados no equivalen a alertas locales. Faro distingue comunicados informativos, cierres o cancelaciones explícitos y registros reemplazados por uno posterior del mismo evento y cuenca. No infiere un cierre a partir de texto condicional o de una cancelación limitada a otra costa.

La ventana de seis horas organiza la presentación; no es un vencimiento oficial. Los mensajes anteriores se muestran en un archivo plegado, con emisión y estado del boletín. Los mensajes de amenaza recientes quedan como vigencia sin confirmar, enlazados a la actualización oficial. Una consulta fallida, parcial o con más de dos minutos no confirma vigencia. El archivo contiene los últimos productos recibidos, no toda la secuencia de cada evento.

Fuentes: [productos NOAA](https://www.tsunami.gov/?page=product_list) y [actualización y cancelación de avisos](https://www.weather.gov/safety/tsunami-alerts).
