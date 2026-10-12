# Country coverage

Last review of this coverage: October 12, 2026. The `reviewedAt` fields keep the review date of each source. An editorial review does not guarantee that a site is available or that a service is operating. Some official sources blocked automated reading; their content was checked against the official search index. No test calls were made.

| Destination   | Numbers included | Authority / preparedness                  | Linked seismic network         | Earthquakes in Faro |
| ------------- | ---------------- | ----------------------------------------- | ------------------------------ | ------------------- |
| Panama        | 911              | SINAPROC                                  | IGC · University of Panama     | IGC or USGS         |
| Chile         | 131, 132, 133    | SENAPRED; evacuation maps                 | CSN · University of Chile      | USGS                |
| Colombia      | 123              | UNGRD                                     | Colombian Geological Survey    | USGS                |
| Argentina     | 911, 100, 103    | SINAGIR                                   | INPRES                         | USGS                |
| United States | 911              | Ready.gov · FEMA                          | USGS                           | USGS                |
| Mexico        | 911              | Coordinación Nacional de Protección Civil | SSN · UNAM                     | USGS                |
| Peru          | 105, 116, 106    | INDECI                                    | IGP · CENSIS                   | USGS                |
| Ecuador       | 911              | Secretaría Nacional de Gestión de Riesgos | IG · EPN                       | USGS                |
| Costa Rica    | 911              | Comisión Nacional de Emergencias          | RSN · University of Costa Rica | USGS                |

- Short numbers are for calls within the country. Peru: SAMU 106 has regional coverage; the data and the interface point to the regional list on the official source. Argentina: SAME 107 is not presented as a national service.
- Panama: the official SUME page states that 911 transfers calls to police, fire and civil protection, so 911 is the only number listed.
- Links to national networks open their sites. Their data is not added to the USGS map. IGC and USGS keep separate catalogs; a national network may publish more small earthquakes.
- Map rectangles are approximate areas. Chile and Argentina use wider continental views; the United States starts on the contiguous states and says so explicitly. For Alaska, Hawaii, islands or other territories, pan the map and use "Search this area". Ecuador includes the Galápagos in its initial area. None of these rectangles represents jurisdiction, borders or risk.
- Consular assistance in Panama: 24 listings with current official sources (some only link to the agency) and 26 historical references from the October 2024 European directory, kept separate and without directions or phone numbers. Coverage is not exhaustive. There are six documented building markers; Spain has no directions or marker because its temporary relocation is unconfirmed. For other destination and nationality combinations, official directories are shown when one is documented. No marker is added without a verified address.
- Shelters and volunteering: Faro has no confirmed operational availability. Institutional links are not a list of open centers.
- Other countries: the country selector and the USGS catalog are available; numbers and a local directory may be missing. The interface says so explicitly. Faro never invents a default emergency number.
- NOAA/PTWC: the configured international products and their coverage limits are kept. Changing country does not turn them into a local alert system. The destination's authority is linked and dates are shown in the device time zone.

## Sources for the four added destinations

- Mexico: [911](https://www.gob.mx/911/articulos/servicio-de-atencion-de-llamadas-de-emergencias-9-1-1?idiom=es), [Civil Protection](https://www.gob.mx/sspc/acciones-y-programas/coordinacion-nacional-de-proteccion-civil-357857), [SSN](https://www.ssn.unam.mx/sismicidad/ultimos/).
- Peru: [numbers and regional scope](https://www.gob.pe/547-telefonos-de-emergencia), [INDECI](https://www.gob.pe/indeci), [CENSIS](https://censis.igp.gob.pe/).
- Ecuador: [ECU 911](https://www.ecu911.gob.ec/gestion-de-la-atencion-de-emergencias/), [Risk Management](https://www.gestionderiesgos.gob.ec/), [IG · EPN](https://www2.igepn.edu.ec/mapa-ultimos-sismos).
- Costa Rica: [911 system, Judicial Branch](https://diccionariousual.poder-judicial.go.cr/index.php/diccionario/sistema-de-emergencias-9-1-1), [CNE](https://www.cne.go.cr/), [RSN](https://rsn.ucr.ac.cr/).

## Extending

One typed file per destination plus one entry in the registry. See the [steps and tests](extending-faro.md#add-or-improve-country-coverage). Sources, dates and restrictions are part of the data; they must not be hidden in components or hard-coded text.

## Preparedness and healthcare

- Emergency kit: 14 items with a local checklist downloadable in English and Spanish, based on SENAPRED; the power bank is marked as a Faro addition. The during-the-earthquake instructions use ECA / ShakeOut material with attribution and its own terms of use; Faro's supplementary illustrations are original.
- Pharmacies and hospitals: explicit Google Maps searches by area or approximate location, with city shortcuts per country in `src/data/careAreas.ts`. They are not an integration of availability, on-call hours or triage. Official links: MINSA in Panama and SENAPRED's Visor Preparado in Chile.
- Evacuation: SENAPRED links were corrected. No route, street, hotel exit or safe point was physically verified. Chilean evacuation maps are shown only for Chile.
- The diplomatic corps PDF linked by Panama's Foreign Ministry returned 404 during this review. It was not transcribed as a complete current list.

## U.S. citizens traveling abroad

Local help includes a nationality-specific State Department resource pack (sources checked October 12, 2026). Destination advisory links are verified for Panama, Colombia, Chile, Mexico, Costa Rica, Peru, Ecuador and Canada; other destinations lead to the official advisory directory. These links do not add a live alert feed or new embassy map markers. The Panama U.S. embassy card includes its officially listed main and after-hours consular telephone. General State Department fallback numbers distinguish callers outside the U.S./Canada from callers within those countries.
