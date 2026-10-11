# Privacy / Privacidad

Faro has no account system, analytics SDK, advertising, server-side personal profile or automatic family-tracking service. The application does not send saved trip fields to the earthquake adapters.

| Data                                           | Storage and transmission                                                                                  |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Language, destination, nationality             | Browser localStorage after an explicit save; language preference also stored locally                      |
| Hotel plan and optional meeting coordinates    | Browser localStorage after an explicit save                                                               |
| Personal contacts and prepared-message history | Browser localStorage; manual export/sharing only                                                          |
| GPS                                            | Browser permission; memory while enabled. Coordinates persist only if explicitly copied into a saved plan |
| Earthquake cache and saved regions             | Browser localStorage; no personal fields attached to source requests                                      |
| Session onboarding dismissal                   | Browser sessionStorage                                                                                    |

Each browser and site origin has a separate copy. Changing domain/port does not migrate it. Clearing site data or private browsing may remove it. This is not encrypted storage or a backup service. Deletion controls are provided in each relevant section; clearing site data removes the rest.

## Network connections

- USGS receives catalogue requests from the browser. IGC and NOAA are read through the same-origin server adapters. Normal host/network logs may contain IP addresses; production operators determine their own logging and retention.
- OpenStreetMap receives the visitor's IP, the web origin (Referer) and tile coordinates for the displayed area. Tiles load automatically when the map view opens. GPS is not attached as a request field, but centering a map around a location reveals its approximate viewed area to the map provider.
- Natural Earth coastline data and fonts are served with the app. Distance calculations run in the browser.
- Clipboard, device sharing, WhatsApp and external directions are explicit actions. The selected text or destination is passed to the chosen application. Faro does not confirm delivery or notify anyone automatically.

There are no push notifications or guaranteed reminders when the page is closed. Downloadable text remains usable offline; the entire app has no cold-start offline guarantee.

## En español

Los datos del viaje se guardan solo en el navegador de ese dispositivo. No se envían a un servidor de perfiles ni hay analítica. Las solicitudes a fuentes oficiales y mapas sí usan internet y revelan los metadatos normales de conexión. Al centrar el mapa, el proveedor conoce aproximadamente el área consultada. GPS requiere permiso. Compartir mensajes y abrir rutas son acciones manuales. Borrar los datos del sitio elimina la copia local; no hay sincronización ni respaldo remoto.

## Contributors

Do not commit browser storage dumps, actual traveler contacts, private locations, personal message text, environment files, credentials, screenshots or network captures. Publication uses a file allowlist and a heuristic secret/path scan; manual review remains necessary.

## Contact details in the trip profile

Onboarding can save your name, phone and email alongside the destination and nationality in browser storage. These fields do not create an account and are not submitted to a server. The status composer uses the saved name; phone and email are excluded unless you select their inclusion in the message. Review the preview before manually sharing. Deleting the trip profile removes these profile fields; copies in previously prepared messages remain in the separate message history until that history is deleted.
