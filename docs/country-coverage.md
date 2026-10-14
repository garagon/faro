# Country coverage

Last review of this coverage: October 13, 2026 (Central America and the Caribbean added). The `reviewedAt` fields keep the review date of each source. An editorial review does not guarantee that a site is available or that a service is operating. Some official sources blocked automated reading; their content was checked against the official search index. No test calls were made.

| Destination    | Numbers included                | Authority / preparedness                  | Linked seismic network          | Earthquakes in Faro |
| -------------- | ------------------------------- | ----------------------------------------- | ------------------------------- | ------------------- |
| Panama         | 911; backups 104, 103, 520-4426 | SINAPROC                                  | IGC · University of Panama      | IGC or USGS         |
| Chile          | 131, 132, 133                   | SENAPRED; evacuation maps                 | CSN · University of Chile       | USGS                |
| Colombia       | 123                             | UNGRD                                     | Colombian Geological Survey     | USGS                |
| Argentina      | 911, 100, 103                   | SINAGIR                                   | INPRES                          | USGS                |
| United States  | 911                             | Ready.gov · FEMA                          | USGS                            | USGS                |
| Mexico         | 911                             | Coordinación Nacional de Protección Civil | SSN · UNAM                      | USGS                |
| Peru           | 105, 116, 106                   | INDECI                                    | IGP · CENSIS                    | USGS                |
| Ecuador        | 911                             | Secretaría Nacional de Gestión de Riesgos | IG · EPN                        | USGS                |
| Costa Rica     | 911                             | Comisión Nacional de Emergencias          | RSN · University of Costa Rica  | USGS                |
| Guatemala      | 110, 122, 123, 1554, 125, 119   | CONRED                                    | INSIVUMEH                       | USGS · EMSC         |
| El Salvador    | 911, 132                        | Dirección General de Protección Civil     | MARN · Observatorio de Amenazas | USGS · EMSC         |
| Honduras       | 911                             | COPECO                                    | CENAOS · COPECO                 | USGS · EMSC         |
| Nicaragua      | 128, 115, 118                   | SINAPRED                                  | INETER                          | USGS · EMSC         |
| Dominican Rep. | 911 (partial)                   | COE; Defensa Civil guidance               | CNS · UASD                      | USGS · EMSC         |

- Short numbers are for calls within the country. Peru: SAMU 106 has regional coverage; the data and the interface point to the regional list on the official source. Argentina: SAME 107 is not presented as a national service.
- Panama: the official SUME page states that 911 transfers calls to police, fire and civil protection, so 911 is the only number listed.
- Links to national networks open their sites. Their data is not added to the USGS map. IGC and USGS keep separate catalogs; a national network may publish more small earthquakes.
- Map rectangles are approximate areas. Chile and Argentina use wider continental views; the United States starts on the contiguous states and says so explicitly. For Alaska, Hawaii, islands or other territories, pan the map and use "Search this area". Ecuador includes the Galápagos in its initial area. None of these rectangles represents jurisdiction, borders or risk.
- Consular assistance in Panama: 24 listings with current official sources (some only link to the agency) and 26 historical references from the October 2024 European directory, kept separate and without directions or phone numbers. Coverage is not exhaustive. There are seven documented building markers (Brazil added on 2026-10-13); Spain has no directions or marker because its temporary relocation is unconfirmed. For other destination and nationality combinations, official directories are shown when one is documented. No marker is added without a verified address.
- Shelters and volunteering: Faro has no confirmed operational availability. Institutional links are not a list of open centers.
- Other countries: the country selector and the USGS catalog are available; numbers and a local directory may be missing. The interface says so explicitly. Faro never invents a default emergency number.
- NOAA/PTWC: the configured international products and their coverage limits are kept. Changing country does not turn them into a local alert system. The destination's authority is linked and dates are shown in the device time zone.

All destinations can also use EMSC (worldwide, M2.5+) and show GDACS alerts for the selected country.

## Weather warnings (reviewed 2026-10-13)

Each destination links its national meteorological service's warnings page (`weatherAgency`): IMHPA (Panama), IMN (Costa Rica), INSIVUMEH (Guatemala), MARN Observatorio de Amenazas (El Salvador), CENAOS·COPECO (Honduras, home page; no dedicated warnings page), INETER (Nicaragua), INDOMET (Dominican Republic), SMN·CONAGUA (Mexico, home page; cyclone warnings are split by basin), IDEAM (Colombia), INAMHI (Ecuador, services host only), SENAMHI (Peru), Dirección Meteorológica de Chile and the NWS (United States). Argentina's SMN warnings page blocks automated reading, so it is not linked yet; its CAP feed is used.

Warnings in force are read from the CAP feeds of IMHPA, IMN, INDOMET, INAMHI and SMN Argentina. For Panama, the home also lists SINAPROC's latest posts (communiqués, prevention notices and incident reports) with their publication time. Guatemala and Honduras feeds are sporadic or stale; El Salvador, Nicaragua, Colombia, Peru, Chile and Mexico list no usable feed. NOAA's National Hurricane Center covers the Atlantic and eastern Pacific for the Central American and Caribbean destinations, Mexico, Colombia and the United States; Chile, Argentina, Peru and Ecuador are not typically affected by tropical cyclones.

## Central America and the Caribbean (reviewed 2026-10-13)

Each record was checked against official pages on 2026-10-13. No test calls were made.

- Guatemala: numbers from [CONRED's emergency list](https://conred.gob.gt/numeros-de-emergencia/). 123 is Guatemala City's municipal fire service; several fire services run their own stations. 120 (second police line) and 1520 (road assistance) were left out. INGUAT tourist assistance (1500) is a resource, not an emergency number. Health facility directory: MSPAS.
- El Salvador: 911 and 132 (medical emergencies) as listed together by the [Government of Canada](https://travel.gc.ca/assistance/embassies-consulates/el-salvador); no current Salvadoran page listing both was readable. 913 (fire) is confirmed by Bomberos but left out until one source lists the set. MARN's tsunami map is a hazard map and is labelled that way.
- Honduras: 911 from the [National Police](https://policianacional.gob.hn/) because the 911 system's own site did not load. CENAOS's online bulletin archive stops in March 2026; COPECO publishes newer bulletins on social media. No national Red Cross link: its listed domains did not resolve.
- Nicaragua: 128 (Cruz Blanca), 115 (fire) and 118 (police) from INTUR's visitor list. SINAPRED's announced line 100 is not on that list and was left out. The Nicaraguan Red Cross was dissolved in 2023 and is not linked. Health directory: MINSA Red de Salud.
- Dominican Republic: the 9-1-1 system covered 27 provinces (94.64 % of the population) in July 2026 according to the Presidency; the source does not list which, and the interface says so. COE declares alerts; Defensa Civil's earthquake guides and POLITUR tourist assistance are resources. The map preset includes Haiti.
- None of these destinations has an official, public evacuation-route map for travelers, so no `evacuation` link is set.

## Sources for the four added destinations

- Mexico: [911](https://www.gob.mx/911/articulos/servicio-de-atencion-de-llamadas-de-emergencias-9-1-1?idiom=es), [Civil Protection](https://www.gob.mx/sspc/acciones-y-programas/coordinacion-nacional-de-proteccion-civil-357857), [SSN](https://www.ssn.unam.mx/sismicidad/ultimos/).
- Peru: [numbers and regional scope](https://www.gob.pe/547-telefonos-de-emergencia), [INDECI](https://www.gob.pe/indeci), [CENSIS](https://censis.igp.gob.pe/).
- Ecuador: [ECU 911](https://www.ecu911.gob.ec/gestion-de-la-atencion-de-emergencias/), [Risk Management](https://www.gestionderiesgos.gob.ec/), [IG · EPN](https://www2.igepn.edu.ec/mapa-ultimos-sismos).
- Costa Rica: [911 system, Judicial Branch](https://diccionariousual.poder-judicial.go.cr/index.php/diccionario/sistema-de-emergencias-9-1-1), [CNE](https://www.cne.go.cr/), [RSN](https://rsn.ucr.ac.cr/).

## Extending

One typed file per destination plus one entry in the registry. See the [steps and tests](extending-faro.md#add-or-improve-country-coverage). Sources, dates and restrictions are part of the data; they must not be hidden in components or hard-coded text.

## Preparedness and healthcare

- Emergency kit: 14 base items plus hazard-specific items, a water calculation for the chosen people and days, and a list of what is missing grouped by shop with nearby searches. Downloadable in English, Spanish and Portuguese, based on SENAPRED with Ready.gov for the second water reference; the power bank is marked as a Faro addition. The during-the-earthquake instructions use ECA / ShakeOut material with attribution and its own terms of use; Faro's diagrams for the other topics are original.
- Panama: a dated summary of the official response to the 9 October 2026 M7.7 earthquake (SINAPROC, U.S. Department of State, USGS, Copernicus EMS), with how to help safely, shown until 8 November 2026 unless reviewed again.
- Pharmacies and hospitals: explicit Google Maps searches by area or approximate location, with city shortcuts per country in `src/data/careAreas.ts`. They are not an integration of availability, on-call hours or triage. Official links: MINSA in Panama and SENAPRED's Visor Preparado in Chile.
- Evacuation: SENAPRED links were corrected. No route, street, hotel exit or safe point was physically verified. Chilean evacuation maps are shown only for Chile.
- The diplomatic corps PDF linked by Panama's Foreign Ministry returned 404 during this review. It was not transcribed as a complete current list.

## U.S. citizens traveling abroad

Local help includes a nationality-specific State Department resource pack (sources checked October 12, 2026). Destination advisory links are verified for Panama, Colombia, Chile, Mexico, Costa Rica, Peru, Ecuador and Canada; other destinations lead to the official advisory directory. These links do not add a live alert feed or new embassy map markers. The Panama U.S. embassy card includes its officially listed main and after-hours consular telephone. General State Department fallback numbers distinguish callers outside the U.S./Canada from callers within those countries.
