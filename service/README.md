# Wish Garden V0.5 — Minimal opt-in API release checklist

**Status:** Source only. No Cloudflare Worker/D1 created, no live user collection, no SpaceSIO submission, no paid service.

## Architecture (one app, optional isolated API)
- Current site remains GitHub Pages and private local ritual stays fully usable.
- Optional Cloudflare Worker exposes only: `GET /api/v1/summary`, `POST /api/v1/participation`, `DELETE /api/v1/participation`, OPTIONS preflight.
- D1 stores **receipt hash**, quarterly batch ID, selected topic index, created/withdrawn UTC timestamps. **No wish text, account, name, email, geolocation or device fingerprint.**
- Client creates 32-byte cryptographic secret and stores it on that browser only; server stores SHA-256 of batch+secret and returns first 16 hex as a private reference code. Losing the secret means losing self-service withdrawal; do not promise recovery. Site only communicates with this API after the operator configures the public endpoint and user checks a separate consent box.
- Server checks exact allowed Origin and verifies Cloudflare Turnstile with a secret **and an exact, configured hostname**. No Turnstile secret, no write. Turnstile verification sends a token to Cloudflare; operator privacy disclosure must explain this. The provider may observe requester network metadata as part of standard hosting, but the D1 application does not persist it.
- No guarantee of one submission per person: **count opt-in receipts, not unique people.** Duplicate secret+batch is idempotent; additional secrets are possible. Turnstile mitigates abuse, not identity fraud.

## Live release gates (not performed)
1. Obtain explicit operator approval to create **one** Cloudflare Worker, **one** D1 database, and Turnstile site widget; no automatic deploy by PR merge.
2. Create D1 with Wrangler or Cloudflare UI; apply `service/schema.sql`. Database must be tested in staging first. Confirm D1 included quota and account restrictions.
3. Bind database as `DB`. Configure `ALLOWED_ORIGIN=https://buithinh2000.github.io` and secret `TURNSTILE_SECRET` via Cloudflare secret settings, plus `TURNSTILE_HOSTNAME=buithinh2000.github.io` as a Worker environment variable (never commit the secret).
4. Configure public runtime bootstrap `window.WG_PUBLIC_CONFIG={api:'https://<your-worker-host>',sitekey:'<public-site-key>'}` in first-party HTML **only after deployment verification**. Public site key is not a secret. No such config is committed yet.
5. Run approved origin and anti-abuse tests; verify consent, resubmission, withdrawal, cutoff and error handling on real D1. Check browser Network shows only the selected topic and opaque secret, never wish prose.
6. Publish clear privacy notice with recipient, retention, Turnstile, withdrawal limitations, data export and contact information. Set a retention/deletion procedure for old batches. This is a release blocker.
7. Test replay/concurrency and abuse controls before public invitation. For larger reach, implement rate limiting at Cloudflare account edge; Turnstile alone is not sufficient.
8. Only then enable opt-ins. **Do not** describe a registered interest as transmitted or included in a locked radio packet. Verified inclusion requires an audited lock/manifest step in a later version.
9. SpaceSIO remains a separate **manual** operator process for a public project phrase until independently verified. Do not send this D1 table or person-level data to the radio provider.

## Privacy and truth
- The public summary only reveals counts after 20 active opt-in receipts in a batch; small categories below 5 are omitted. Counts are submissions, not independently verified unique people.
- A 24h cutoff before each proposed quarterly date disables additions/withdrawals in that batch. The next planned date remains a **target**, not a station booking.
- There is no existing real RF receipt, space-delivery guarantee, confirmed on-air time or automatically scheduled provider API.
- The opt-in feature is unavailable until the operator deploys and configures it; this is intentional, not an error.

## Cost and vendor details
Cloudflare publishes Workers Free up to 100,000 requests/day and D1 Free allowance 5 million rows read/day, 100,000 rows written/day, 5 GB storage; subject to current terms and account restrictions. Verification with an actual billing/limits dashboard is required before any launch. No monthly paid infrastructure has been approved.

Sources: https://developers.cloudflare.com/workers/platform/limits/ and https://developers.cloudflare.com/d1/platform/pricing/

## Cloudflare credential boundary (Nov 2026)
A GitHub Actions deploy to Cloudflare Workers is **not** authorized by AWS OIDC. Cloudflare documents a scoped Cloudflare API token and account ID for CI, or the interactive Cloudflare dashboard/Wrangler OAuth setup. Do not save any token in git or invent an OIDC deployment path. This branch creates no Cloudflare resources. Source: https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/
