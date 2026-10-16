# Privacy / Privacidad

Faro has no account system, analytics SDK, advertising, server-side personal profile or automatic family-tracking service. The application does not send saved trip fields to the earthquake adapters.

| Data                                                              | Storage and transmission                                                                                          |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Language, destination, nationality                                | Trip saved explicitly in localStorage; site language saved separately when selected                               |
| Hotel plan and optional meeting coordinates                       | Browser localStorage after an explicit save                                                                       |
| Emergency contact, health, insurance, stay                        | Browser localStorage (`faro-emergency-info-v1`) after an explicit save; all optional                              |
| Personal contacts and prepared-message history                    | Browser localStorage; manual export/sharing only                                                                  |
| GPS                                                               | Browser permission; memory while enabled. Coordinates persist only if explicitly copied into a saved plan         |
| "My location" (choose the country)                                | One reading after you tap it; the country is worked out on the device from land borders; nothing is kept          |
| Earthquake cache and saved regions                                | Browser localStorage (`faro-igc-v1`, `faro-emsc-v1`, `faro-usgs-v1`, kept up to 7 days); no personal fields sent  |
| Last official warnings, SINAPROC posts and NOAA tsunami bulletins | Browser localStorage (`faro-national-<country>`, `faro-sinaproc`, `faro-tsunami`); public data, kept up to 7 days |
| Setup card dismissal ("Not now")                                  | Browser localStorage (`faro-setup-card-v1`); holds only the word `dismissed`                                      |

Each browser and site origin has a separate copy. Changing domain/port does not migrate it. Clearing site data or private browsing may remove it. This is not encrypted storage or a backup service. Deletion controls are provided in each relevant section; clearing site data removes the rest.

## Network connections

- USGS receives catalogue requests from the browser. IGC, EMSC, NOAA/PTWC, GDACS, the National Hurricane Center, the national meteorological services' alert feeds and SINAPROC's published posts (Panama) are read through the same-origin server adapters, so those providers see the server, not the visitor. The national warnings request carries only the selected country code. Normal host/network logs may contain IP addresses; production operators determine their own logging and retention.
- The NWS alert API (api.weather.gov) receives a request from the browser only while a U.S. state or territory is selected (tsunami, hurricane and flood alerts). No personal field or location is attached.
- In the English interface, official text published only in Spanish can be translated on request. Where the browser offers on-device translation, "Translate here" sends nothing. "Translate with Google" and "Full page in English" open Google Translate with that public text or page only when tapped; Faro never adds personal data to them.
- "Did you feel it?" report forms (USGS, EMSC) and family reunification services (ICRC, IFRC, American Red Cross) are external links. Faro sends them nothing; anything entered there is governed by that provider.
- OpenFreeMap (vector map tiles built from OpenStreetMap data; its service may go through Cloudflare) receives the visitor's IP, the web origin (Referer) and tile coordinates for the displayed area. Tiles load automatically when the map view opens. The tectonic plate lines are served with the app. GPS is not attached as a request field, but centering a map around a location reveals its approximate viewed area to the map provider.
- Natural Earth coastline data and fonts are served with the app. Distance calculations run in the browser.
- Clipboard, device sharing, WhatsApp and external directions are explicit actions. The selected text or destination is passed to the chosen application. WhatsApp (`wa.me`), Telegram (`t.me`), SMS and email links carry the whole message inside the link, including anything the person added (name, location, phone, or health details when chosen). Faro does not confirm delivery or notify anyone automatically.

There are no push notifications or guaranteed reminders when the page is closed. Downloadable text remains usable offline.

## Offline application copy

After a first visit in a production build, a service worker stores Faro's own application files (scripts, styles, fonts, icons, guidance illustrations and the about page) in the browser's Cache Storage, and the coastline file after its first use. This lets the app open without a signal. It contains no personal data: the profile, contacts and plans remain in localStorage as described above. It never stores official reports, `/api/` responses, map tiles or any other site's responses. Clearing site data removes the copy. A new release replaces it once it has started on the device; until then the previous copy is kept for offline use. When the copy is ready, the footer says "Available offline on this device". When a trip is saved, Faro asks the browser to keep this site's storage instead of clearing it when space runs low (`navigator.storage.persist()`); the browser decides, and nothing is sent.

## En español

La versión completa, con la lista de datos y destinatarios, está también en la página [Privacidad y condiciones de uso](public/privacy.html) que se publica con la aplicación.

- **No hay cuentas ni analítica.** Lo que escribes (viaje, perfil, ficha con salud y seguro, plan, contactos, mensajes preparados, mochila, países guardados, idioma elegido) se guarda solo en el `localStorage` de este navegador y no se envía a ningún servidor de Faro. No está cifrado. Se borra desde Mi viaje y Mi estado (o todo junto con «Borrar todo lo que guardó Faro», al final de Viaje), o borrando los datos del sitio.
- **Datos públicos para abrir sin conexión:** la última copia de los sismos, de los avisos meteorológicos, de SINAPROC y de los boletines de tsunami de NOAA, como máximo durante 7 días. Se muestran como datos viejos, con su hora.
- **El servidor de Faro** consulta IGC, EMSC, NOAA/PTWC, GDACS, el NHC, los servicios meteorológicos nacionales y SINAPROC. Solo recibe el código del país. Faro no guarda registros propios; el proveedor de alojamiento puede registrar la IP y la hora según su política.
- **Desde tu navegador:** USGS (catálogo de sismos), el NWS solo para lugares de EE. UU. y OpenFreeMap, el mapa con datos de OpenStreetMap (tu IP y el área del mapa; su servicio puede pasar por Cloudflare).
- **Solo cuando tocas:** Google Maps (la zona o tu ubicación aproximada, para buscar hospitales, farmacias o tiendas; o el centro redondeado a ~1 km de tu alojamiento, de tu ubicación si la compartiste o del mapa, para guardarlo sin conexión), Google Translate (el texto oficial público o la página) y WhatsApp, Telegram, SMS o correo: el mensaje completo va dentro del enlace, incluido lo que hayas puesto (nombre, ubicación, teléfono o salud si lo elegiste). El WhatsApp de SINAPROC (Panamá) solo abre un chat con ese número; Faro no escribe ni envía nada.
- **Ubicación:** solo con permiso y en memoria. «Mi ubicación» la lee una vez y calcula el país en el dispositivo; no la guarda ni la envía.
- Tras la primera visita, el navegador guarda una copia de la aplicación (sin datos personales ni respuestas de `/api/`) para abrirla sin conexión.

## Contributors

Do not commit browser storage dumps, actual traveler contacts, private locations, personal message text, environment files, credentials, screenshots or network captures. Publication uses a file allowlist and a heuristic secret/path scan; manual review remains necessary.

## Contact details in the trip profile

My trip can save your name, phone and email alongside the destination and nationality in browser storage. These fields do not create an account and are not submitted to a server. The status composer uses the saved name; phone and email are excluded unless you select their inclusion in the message. Review the preview before manually sharing. Deleting the trip profile removes these profile fields; copies in previously prepared messages remain in the separate message history until that history is deleted.

## Downloaded travel cards

PNG and text travel cards are generated locally after an explicit download action. The complete contents can be previewed and include the saved profile and the selected destination’s contacts and hotel plan. GPS coordinates are excluded. A downloaded copy remains on the device outside browser storage; deleting data in Faro does not delete downloaded files. Apple Wallet is not yet enabled; see [integration requirements](docs/apple-wallet.md).

## Preparedness checklist and nearby healthcare

The trip form in My trip (name, nationality, phone, email, emergency contact, health, travel insurance, accommodation and dates) is optional field by field and is saved only when the person presses Save. Health details are sensitive: they stay in this browser and enter the shareable card only if the person ticks "include my health details". The card is sent only when the person taps WhatsApp, Telegram, SMS, email, "Other apps" or copy; each opens that app with the text and the person chooses the recipient there. Faro sends nothing itself. "Delete my details" removes the profile, the emergency details and the stay from this browser.

Emergency-kit checkmarks are stored only in `faro-emergency-kit-v1` in this browser, and can be cleared or downloaded from the kit section. The kit plan (number of people, days and the hazards the person selects) is stored in `faro-emergency-kit-plan-v1`; it holds no names or places and can be changed in the kit. Nearby healthcare and shop searches do not read or send the trip profile. Location is requested only on an explicit click; coordinates are rounded to three decimals for the search. The chosen place or approximate coordinates are sent to Google Maps only when the person opens a pharmacy, hospital or shop search. They are not stored by Faro. The offline-map link sends Google Maps only a centre rounded to about 1 km (the saved stay, the person's location if shared, or what Faro's map shows) and a zoom, when the person taps it; Faro never downloads or stores map tiles. The external provider has its own privacy policy.

The site language is selected with the ES/EN/PT controls outside onboarding. It persists independently of the trip profile; deleting the profile does not reset the site language. Older profiles remain readable.

## Home-screen installation

The install control uses the browser's installation prompt when available, or displays manual instructions. The manifest and icons are served from the same origin. No install analytics, personal-data transfer or push subscription is added. The offline application copy described above works with or without installation. Installing does not synchronize the browser profile with another device or domain; verify saved information after opening the installed app.
