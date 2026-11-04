# Wish Garden — Private API Contract V0.2 (Draft)

**Status:** Implemented in an unmerged branch; not deployed; no identity provider, real database or production secret provisioned. Public GitHub Pages remains static and independent.

## Architecture decision
Use an isolated Cloudflare Worker and D1 backend for account-owned wish storage, only after selecting and configuring an independent OIDC identity provider. This does **not** use BuiTai accounts, BuiTai databases, BuiTai Cloudflare zones or any BuiTai runtime.

### Trust boundary
- Web browser: public, untrusted.
- Backend: HTTPS only, exact allowed browser Origin, validated RS256 JWT using configured OIDC JWKS; reject unknown/missing audience, issuer, expiry and invalid signatures.
- Database: D1. Wishes always queried/written by immutable owner subject (the JWT `sub` claim).
- No secret is stored in the public repository.
- Cross-origin restrictions are **not** authentication. Verified JWT and owner checks are mandatory on every private endpoint.

## API specification

| Route | Authorization | Behavior |
| --- | --- | --- |
| `GET /health` | none | Returns service readiness only, no secrets. |
| `POST /v1/wishes` | Bearer JWT | Create an owner-only wish; request `{topic, body}`, 1–700 characters, aggregate opt-in false. |
| `GET /v1/wishes` | Bearer JWT | Read owner's latest 100 wishes; no cross-user query. |
| `PATCH /v1/wishes/:uuid` | Bearer JWT | Set `state` and `aggregate_opt_in` explicitly. |
| `DELETE /v1/wishes/:uuid` | Bearer JWT | Delete an owner's wish. |
| `GET /v1/collective-hope` | Bearer JWT & feature flag | Only topic-level aggregate for opt-in wishes, at least 20 distinct accounts per topic in last 30 days; never display text or identifiers. Off by default. |

Topics: peace, family, health, future, remember, gratitude.
States: ongoing, fulfilled, released.

## Privacy, abuse and integrity
- **Public preview does not call this API** and the default wish ritual does not persist anything.
- Account storage requires explicit user action and clear UI copy before the browser sends sensitive text.
- 10 write/updates per authenticated subject per UTC hour is a coarse guard, not complete bot prevention.
- Aggregate uses unique accounts, NOT "people praying in real time". There is no way to claim human uniqueness from this algorithm alone.
- Collective Hope is disabled until account verification, moderation, independent security review and privacy approval exist.
- Never claim that a spiritual outcome is guaranteed or that the app transmits a physical energy signal to the universe.
- Need operational policy for encrypted backups, retention, abuse reports, access logs, privacy requests, breach response and regional regulatory review before public rollout.
- Authentication and persistence are dependencies to be configured later; this branch does not create an admin account or launch production services.

## Release checklist
1. Tests pass in PR on GitHub (not just local syntax).
2. Review OAuth/OIDC provider and configure AUTH_ISSUER, AUTH_AUDIENCE, AUTH_JWKS_URL without hardcoding credentials.
3. Confirm D1 database creation and migration in separately approved staging.
4. Penetration testing: token tampering, owner isolation, enumerations, CORS, rate limiting, input and Unicode, duplicate count, cache control, threat model.
5. Decide data retention and "right to delete"; review UX to prevent oversharing.
6. Confirm opt-in and moderators before public Collective Hope.
7. Only then connect browser preview behind appropriate user consent and release gate.

## Deferred scope
3D world, virtual home, Living Memories, avatar, Life Engine, monetization. These are recorded future directions, not launch requirements.
