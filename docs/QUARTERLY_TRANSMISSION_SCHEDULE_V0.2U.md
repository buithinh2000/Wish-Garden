# Wish Garden — Quarterly Free-Signal Ceremony schedule (V0.2U)
Date: 2026-11-05

## Decision
The owner elected to consolidate only one short, aggregate level-2 message **every three months**, instead of individual wishes or twice-yearly sending. This uses at most four transmissions per year, comfortably below SpaceSIO's advertised free quota of three text signals per month (140 characters/signal), **provided the free offer and terms remain available**.

## Proposed planning dates (NOT verified radio reservations)
- 30 March, 12:00 UTC
- 30 June, 12:00 UTC
- 30 September, 12:00 UTC
- 30 December, 12:00 UTC

The browser counts down to the next planning date. UTC avoids daylight-saving changes across user locales. These dates can change if a provider is unable to transmit. No operator booking has been made and no signal has yet been sent.

## Message type and truth
Level-2: a short project summary **without individual prayers**, names, emails or sensitive contents. Never publish an aggregate participation number without truthful independently collected opt-ins and a minimum cohort threshold.
Example for a proof-only pilot with NO user data: `WISH GARDEN | A MESSAGE OF PEACE, FAMILY, HEALTH AND HOPE FROM EARTH`.
A pilot phrase is not claimed to represent actual participating people.

## SpaceSIO free tier
Provider's official pricing: https://spacesio.com/features, free 3 text signals/month, up to 140 characters. Website free manual sending and a public proof page may be possible; integrated automation/API may require additional access. Validate operator, licence, signed receipt and actual RF before labeling any signal verified. Provider terms and quota can change.

## User privacy
Participation choice currently exists only in `localStorage` on the device and is not transmitted or centrally aggregated. Browser click does not constitute registration for a real radio batch. A future verified broadcasting integration requires a backend, opt-in process, proof and a separate release approval. Keep private daily stars independent from physical transmissions.

## Status labels
- **PLANNED** — countdown only, no operator
- **CONFIRMED BY OPERATOR** — operator accepted booking, still not transmitted
- **OPERATOR ATTESTED** — operator reports an RF emission with a dated record
- **INDEPENDENTLY VERIFIED** — third-party evidence validated, when possible
Never infer a positive state merely because the planning countdown reaches zero.

## Automated QA
Invariant test checks all four schedule entries and unverified status. Existing Chromium desktop/mobile smoke tests remain the release gate.
