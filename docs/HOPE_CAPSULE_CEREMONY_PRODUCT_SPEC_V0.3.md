# Wish Garden — Hope Capsule ceremony UX and truth-bound provider operation (V0.3 design)
Date: 2026-11-05
Status: product specification, not shipped; no transmission and no provider integration performed.

## Purpose
A private person's wish remains theirs. A separately consented theme can contribute to one public quarterly Hope Capsule: one short, project-owned aggregate RF message, with each participant seeing a personal journey and the public seeing only a shared package. This must feel emotionally meaningful without pretending a radio signal reached outer space.

## Explicit provider facts (verified on 2026-11-05)
SpaceSIO https://spacesio.com/features and https://spacesio.com/:
- Free Ground Control: 3 signals/month, 140 characters each, standard queue, 3 broadcasts per signal (first + two daily echoes).
- One public proof record per signal; provider describes SHA-256, station-signed confirmation, station/time/packet, visualized anatomy/sonification, origin and repeat logs. Example https://spacesio.com/t/408d23d8b851.
- Time capsules/scheduled gifts are advertised, **but availability on FREE tier and the exact transmission commitment have not been established**; no promised minute-level RF slot.
- Paid-plan MCP/API: not allowed for the zero-cost design. Do not automate browser scraping/submission.
- Terms https://spacesio.com/terms explicitly say low-powered ground radio, no guarantee of reaching space, no guarantee of reception, no guaranteed timing, and imagery/distance representations are illustrative.
- Privacy https://spacesio.com/privacy warns public/permanent transmission; provider may use submitted material for model training. NEVER submit a user's prayer, name, email, private quote or identifiable metadata.
- Provider attestation is not independent third-party RF detection. Label precisely.

## Public capsule vs private journey
PUBLIC /hope-capsules/<batch-id>:
- quarter, planned ceremony date (clearly unconfirmed), publicly approved aggregate text (<=140 chars), truthful verified aggregate count only if consent pipeline exists, evidence status and station-signed proof link AFTER it exists, actual RF time with time zone UTC, station, SHA-256, echo list and corrections.
- Never show participants, identifying star IDs or full user-generated wish text. Do not show fictional counts.

PRIVATE /my-journey:
- Private wish star saved by user choice, theme selected for that batch, distinct participation token, local consent receipt, contribution-state timeline, withdrawal available until lock.
- The interface MUST say: your private wish text was NOT included in the RF packet. It is your **selected theme** that may contribute to composing the aggregate message.
- Link participation token to a signed **batch inclusion receipt** only after server attests inclusion in a committed/locked aggregate (never fabricated from localStorage).
- For returning on other devices: optional account/passkey or securely exportable recovery token, not implicitly enabled. Local-only mode remains fully usable.

## State machine (source of truth; no time-driven success)
1. PLANNED: public countdown to proposed quarterly ceremony; not an operator reservation.
2. ACCEPTING_OPT_INS: new explicit informed consent and receipt; privacy copy and provider data handling disclosed.
3. LOCKED: cutoff passes; aggregate count reproducible; withdrawal no longer possible for current batch; public packet text content hash frozen. A new consent screen explains this irreversibility before lock.
4. SUBMISSION_REQUESTED: operator/manual sender submits project-only aggregate message, retains request reference; no claim that packet was radiated.
5. QUEUED: only if provider returns queue evidence; show status and request ref. Otherwise status remains request-acknowledged.
6. OPERATOR_ATTESTED: operator proof page reports signal went on air; save actual timestamp/station, raw signal receipt, hash, signature, echo status and provider URL. Do not claim outside atmosphere.
7. INDEPENDENTLY_VERIFIED: external RF witness or documented audit confirms the **specific event** and scope of corroboration, not arrival in space.
8. CANCELLED / FAILED / UNCONFIRMED: explicitly visible and persistent. No automatic animation of successful signal.

Each transition has actor, timestamp, evidence URL/hash and audit log. Ceremony animations are driven by actual state, never by countdown time alone. If the operator is late, ceremony happens as a reflective gathering while an honest 'Awaiting station confirmation' is shown; once actual proof arrives a later verified celebration is offered.

## User interaction phases
T-30d: theme selection and separate opt-in; show privacy comparison (my wish stays local vs theme joins package). No background enrollment.
T-7d: draft aggregate text shown, preview of sealed capsule, optional private reminder; can withdraw.
T-24h: estimated packaging preview; actual lock only after audited consent/dedup and announced cutoff; avoid misleading guaranteed scheduling.
T-0: public garden ceremony and collective visual. Real radio transmission panel says either 'Not yet submitted', 'Queued', or 'Operator reports sent', according to data. Replays distinguish visual simulation from telemetry. No fake live antenna, fake spectrum graph, computed distance or synthetic evidence.
T+ after proof: public capsule shows real issuance record; private view overlays 'Your selected theme was included' only if backed by inclusion receipt. Actual UTC time, station ID, per-echo logs as available. Provide 'How do we know?' explanation linking official proof and limitations.

## Low-cost v1 architecture (implementation backlog)
- First ship honest, static UI-only stepper and a reusable batch schema with a mock preview explicitly tagged DESIGN DEMO; **no simulated success in production**.
- Later consented backend: minimal pseudonymous participation records, cryptographic random receipt IDs, idempotent unique constraint per consenting participant/batch, anti-abuse without invasive fingerprints, encryption, retention/deletion policy and backups.
- Immutable public batch manifest {id, planned_utc, cutoff_utc, message, message_sha256, participant_count_or_null, status, provider, provider_request_id, operator_proof_url, actual_first_broadcast_utc, echoes[], audit[]}. Never ingest a public proof URL from arbitrary users without validation.
- Private receipt maps participant to locked batch by opaque ID; avoid public ledger of personal wish text.
- Optional signed manifest commitment/merkle-style inclusion, only when genuine audited participation exists; no fake 'blockchain proof'.
- Separate provider operator console: manual paste, submit, attach verified provider proof, choose statement of evidence level. Human final approval, no paid provider API, no direct user data to SpaceSIO.
- Browser UX accessibility: bilingual VI/EN, reduced-motion, time zones with UTC canonical, mobile-first, no dark pattern around donations or grief.

## Commercial model — future only
Keep private daily rituals and pooled quarterly public ceremony FREE. If later offering one individually commissioned broadcast, call it **Signal Issuance & Verification Fee** / **Phí phát tín hiệu và xác nhận**, with plain disclosure: pay for provider service/operation and evidence, NOT guaranteed delivery to outer space or to any recipient; show actual costs and refund/failure policy. Pricing/payment/checkout must be separately approved, compliant with provider licensing. No paid feature currently authorized.

## Provider timing/open questions
- Does the free plan permit scheduled release and public batch messages?
- From user click to QUEUED to first RF issuance, what is typical median/maximum wait? Is the timestamp only known *after* actual station confirmation?
- What timezone and reliability do all logs use? Is each echo explicitly dated?
- Can station Ed25519 key and proof data be independently verified/exported?
- Provider terms for a website's quarterly communal message, public proof linking, and limits. No integration until answered or narrowly tested with project-only phrase.

## Acceptance criteria
1. No wish leaves device on normal ritual and no private text in RF message.
2. Countdown expiration NEVER triggers success or fake telemetry.
3. Public proof and private inclusion are separate auditable facts.
4. Unable-to-prove signal = persistent unconfirmed status.
5. Free route remains usable; paid broadcasts only future optional SKU.
6. Unit + desktop/mobile browser tests cover no-consent, withdraw, lock, late station, failed station, confirmed first emission, echoes and unexpected provider metadata.
7. Public word choices never say 'reached space', 'received by aliens', or 'live broadcast' absent specific external proof.
