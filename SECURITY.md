# Security policy

Faro is pre-production software. Only the latest source tree is currently maintained; there is no stable support window or response-time guarantee.

## Report privately

Do not post secrets, real traveler data, GPS coordinates or detailed exploits in a public issue. Use [GitHub private vulnerability reporting](https://github.com/garagon/faro/security/advisories/new), also available under **Security → Report a vulnerability**. If that option is unavailable, ask the maintainer for a private reporting channel without including sensitive details. Initial maintainer: [@garagon](https://github.com/garagon).

Include a minimal reproduction, affected version, impact and a synthetic example. Do not access or alter other people's data to demonstrate an issue.

## Boundaries

- No user account, personal-data API, analytics or automatic message delivery is implemented.
- Browser localStorage is not encrypted storage. Anyone with access to that browser profile, or code executing in this origin, may read it.
- Official-source adapters fetch only fixed upstream hosts/paths, reject redirects, use timeouts, coalesce requests and bound downloaded document sizes.
- Upstream failures must stay visible. A failed feed cannot become an empty success or an all-clear.
- Map tiles are external and must comply with the provider's identification, attribution and caching requirements.

Before public hosting, configure HTTPS, response headers, abuse controls and operational checks as described in [release readiness](docs/release-readiness.md). A source review is not certification for emergency operations.
