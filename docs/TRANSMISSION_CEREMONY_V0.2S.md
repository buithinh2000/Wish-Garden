# Wish Garden V0.2S — Level-2 Aggregated Transmission Ceremony
Date: 2026-11-05
Status: public static preview feature, NOT a verified RF service.

## Owner choice
Four proposed planning milestones per year (30 March, 30 June, 30 September and 30 December, 12:00 UTC). The level-2 concept could eventually transmit **one aggregate statement** derived from genuine, explicitly opted-in batch topics/counts — never individual wish texts. Target dates are for **planning only**, not operator bookings or guarantees.

## Shipped without any paid service
- Bilingual planning card and countdown visible before opening the prayer panel.
- Explicit yellow/white notice: "PROPOSED DATE · NO TRANSMISSION CONFIRMED".
- Users may mark **one topic of interest** on their own device, and remove it. Duplicate topics on the same browser and batch are deduplicated.
- Only a tiny local record is stored in separate `wg-ceremony-interest-01` localStorage: `{id,batch,topic,at}`. No names, wish text, addresses, device identifier or account keys. The record is **not** submitted, uploaded, synced, or received by Wish Garden, nor is it an actual transmitted message. Existing prayer localStorage is unaffected.
- The counter clearly says **"On this device"**, never represents a global count.
- The archive states **no verified transmission**, and cannot be populated by animations or countdown completion.
- No backend, API, radio transmitter, provider account, payment, credentials, analytics, or network integration was added.

## Non-negotiable product truth
A static site cannot compute a truthful global aggregate from isolated browser storage. Therefore the current checkbox/button expresses local interest in a planned future ceremony — **not** registration in a globally counted batch. Before an actual ceremony, build an audited submission pipeline and obtain fresh user approval. Do not backfill anonymous counts by guessing.

## Proposed future aggregate text (EXAMPLE ONLY, NOT SENT)
`WISH GARDEN | 1248 OPTED-IN HOPES | PEACE 540 | FAMILY 320 | HEALTH 240 | FUTURE 148`
The numbers above are fictional to illustrate the encoding, never to show in the UI. In real use, include only observed verified submissions and perform idempotent deduplication.

## Proof-first operational states
- PLANNING (current; no station or booked date)
- PROVIDER_CONFIRMED (real broadcaster identified, licence/authorization checked)
- LOCKED (count reproducible, consent current, batch content finalized)
- TRANSMISSION_REQUESTED (operator acknowledged request)
- TRANSMITTED_OPERATOR_ATTESTED (timestamp/station/record provided)
- VERIFIED (evidence independently checked to the defined standard)
- FAILED/CANCELLED (must not claim sent)

**No verified state may be inferred from the passing of a countdown.** UI must say `not confirmed` until third-party evidence exists.

## Evidence record required before celebrating
Provider name/contact, legal authority to radiate, UTC timestamp, actual RF broadcast log or authenticated operator receipt, encoded message, reference ID, independent corroboration where possible, data/privacy policy, any cancellation/failure. Distinguish radio reaching space from satellite relay and future physical payload launch.

## Safety/privacy considerations
The daily prayer and personal star remain free and local. A future optional real transmission of summary counts needs new consent because today's offline interest has not left the user's device. Publishing even aggregated themes should use minimum cohort thresholds if privacy could be inferred from tiny batches. No sales funnel, crisis monetization, fabricated activity counts, or claims of supernatural effects.

## Acceptance tests
Node tests check first-party no-network script; Chromium at 1280 and 390 pixels verifies countdown, planning disclaimer, default no-storage, opt-in minimal storage, duplicate suppression and local deletion. Existing prayer star, privacy, no-save, VI/EN, motion and constellation E2E flows remain mandatory.
