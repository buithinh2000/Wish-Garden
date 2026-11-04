# Wish Garden — Quarterly real-space ceremony: execution gate
Date: 2026-11-05
Status: PROPOSED ONLY. No third-party RF transmission, provider booking or aggregate upload completed.

## Decision
- Four **planning** checkpoints each year: March 30, June 30, September 30 and December 30 at 12:00 UTC. These dates are not guaranteed on-air dates and must never be described as actual scheduled transmissions.
- Preserve private, free, offline first-party wish release. A wish never automatically travels to any provider.
- Future space ceremony may carry only a consented, privacy-preserving aggregate statement; no individual wish text, person, email or sensitive categories.
- If the provider does not offer commercial/batch permission, no automated integration. No paid API, radio hardware or paid account.

## Actual status at this checkpoint
- Countdown/interest card exists in src/ceremony.js, rendered by index.html.
- Interest is stored *only on the local device*. It is not a submission or a globally verifiable count.
- No real transmission, independent radio log, active service contract, hosted secure consent service or verification receipt exists.
- The site must show “PROPOSED DATE · NO TRANSMISSION CONFIRMED” until authenticated evidence changes that status.

## Next test: a harmless public phrase, never a user wish
Example: `WISH GARDEN PEACE FOR ALL`
1. Verify candidate operator identity, terms of use for batch/nonprofit/commercial traffic, frequency/telecommunications authorisation and retention policy.
2. Confirm that “free” means no payment, sign-up fee or credits required *for the test*; confirm rate limits and operator availability in writing.
3. Explicitly consent to submitting only the harmless public test phrase. No account registration, submission or transmission is authorised by this document.
4. Collect operator receipt including station identity, date/time UTC, exact encoded phrase, transmission log / RF evidence and reference ID.
5. Seek independent RF receiver evidence when reasonably available. A provider queue screen or animation alone is not sufficient to say “transmitted”.
6. Only after independently reviewed proof, publish a factually limited record describing *exactly what* physically occurred. Distinguish an earth-based RF emission, satellite relay, and an eventual physical spacecraft payload.

## Provider shortlist (not integrations)
- NASA Dragonfly: free **name** registration for a **future** spacecraft mission, not a broadcast of wishes or quarterly batch. Official enrollment deadline January 15, 2027 (US EST), launch planned 2028. Not suitable for recurring RF.
- SpaceSpeak: free text service claimed publicly, but operational evidence, commercial use terms, batch limits and current service status require independent verification.
- gateto.space: provider advertises a limited free message/beta; not validated as repeatable quarterly traffic.
- Amateur-radio ISS APRS: real orbital repeater but licensed operation and restricted station capability; not an unrestricted public API. In Australia, amateur-radio qualification and operating rules apply.

## Release truth labels
PLANNING → PROVIDER_CONFIRMED → CONSENTED_AND_LOCKED → REQUEST_ACKNOWLEDGED → OPERATOR_ATTESTED → INDEPENDENTLY_VERIFIED.

The UI may show the next level **only with the evidence record**. Failure or deadline expiration → EXPIRED_OR_FAILED, never auto-success.

## Backlog, deliberately not represented as shipped
- An audited, consent-based backend for global aggregates, with deduplication, deletion, moderation and measurable minimum-cohort threshold.
- Provenance and signed receipt display for each ceremony.
- Independently verified provider and one no-cost pilot test using a harmless phrase.
- Hosted-origin QA; browser tests; legal/privacy policy and costs/limits review.

## Operator policy
No private user messages, identity or localStorage data leave the device without an explicit new opt-in. Never fake wish counts, a spacecraft launch, or a verified RF event.
