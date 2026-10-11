# Map operations

The default map requests `https://tile.openstreetmap.org/{z}/{x}/{y}.png` directly from the browser. The OSM community service is best-effort and has no availability guarantee. Read the [official tile policy](https://operations.osmfoundation.org/policies/tiles/) before hosting or increasing traffic.

- Tiles load automatically only when the map is mounted and displayed; mobile list mode does not fetch them.
- Use `strict-origin-when-cross-origin` so tile requests have a valid origin Referer without sending the page path or query string. Never use `no-referrer` on tiles.
- Keep browser HTTP caching intact. Do not add cache-busting query parameters, no-cache requests, bulk downloads, hidden zoom sweeps or offline prefetch.
- Wait for movement/zoom to settle before requesting a new tile view. Keep visible OpenStreetMap attribution.
- A 403 block is a provider/policy problem, not absence of earthquakes. Do not evade it by changing IPs, rotating identities or proxying anonymous requests. Correct the integration and follow the provider's resolution process. Existing cached error responses may remain until normal cache expiry.
- The list remains available if map imagery fails.

The initial prototype suppressed Referer and could receive 403 tiles. The current source corrects this and was checked with an ordinary interactive zoom. This does not guarantee service at every location, zoom or traffic level.

Before an emergency-use launch, select hosting/map service capacity and an operational contact appropriate for expected traffic. A configurable provider with proper attribution, terms and availability commitments is still a deployment decision; no account or paid map service is created by this project.
