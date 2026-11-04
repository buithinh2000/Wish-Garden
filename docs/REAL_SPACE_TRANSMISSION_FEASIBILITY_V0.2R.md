# Wish Garden — Real Space Transmission feasibility (research, NOT shipped)
Date: 2026-11-05
Status: Independent technical & ethics research; no purchasing, transmission, signup, or vendor integration.

## Executive decision
**Do not conflate a symbolic release of a private wish with a real transmission.** Preserve the existing free/local-only Star Sky. Consider an entirely optional Real Space Transmission feature only after independent verification, explicit consent, licensing review, price transparency and provider acknowledgements.

## What "send into space" actually means
1. **Satellite relay (Earth–space–Earth):** A payload is uplinked to an authorised communications satellite and relayed to a terminal on Earth. Ground Control RockBLOCK and Iridium Short Burst Data use this model. It is a verifiable satellite communication event, not a deep-space message.
2. **Directional radio emission into space:** An authorised Earth station aims an antenna skyward and broadcasts an encoded signal. This may physically propagate beyond Earth's atmosphere and is not guaranteed to arrive at or be detected by any distant star, spacecraft, or listener.
3. **ISS amateur radio:** ARISS operates educational contacts and amateur services, not an on-demand consumer prayer API. Transmitting requires appropriate privileges and following spectrum rules.

## Providers and factual findings
- **STAR BOTTLE** (https://starbottle.space/en/discover-starbottle/; https://starbottle.space/en/): company claims 2115 MHz S-band radio transmission via an 11 m Fucino dish in Italy, infrastructure involving M3Sat and Telespazio, and an operator-issued transmission certificate. As checked 2026-11-05, public text package is listed at **EUR 49** and next public launch **30 December 2026**. These are provider statements, not an independently witnessed RF reception by us. Verify technical authorisations, operating logs, message handling, integration interface, actual certificate and privacy terms before partner onboarding.
- **SpaceSpeak** (https://www.spacespeak.com/): promises to encode and broadcast text/audio/images through a transmitter. The surfaced page lacks clear independent proof, customer API, price, licence and receipts. Candidate for diligence only.
- **gateto.space** (https://gateto.space/): claims a free 32-character actual LoRa radio signal and in-game repeat via energy credits, but is a beta and public claims are not independently verified. Confirm station licence, link budget, actual frequency and proof before relying on it.
- **RockBLOCK** (https://docs.groundcontrol.com/iot/rockblock/support/faq; https://docs.groundcontrol.com/iot/rockblock/web-services/management-system): Iridium satellite IoT device and data platform. Requires commercial service, hardware/device and real receiver path. Unlike outward-directed radio, satellite relay normally returns data to Earth.
- **ARISS** (https://www.ariss.org/contact-the-iss.html; https://www.ariss.org/about-ariss-contacts.html): ISS amateur radio operation; mostly educational and licensed radio contacts. Not suitable for mass third-party consumer prayer uplinks.
- **NASA DSN** (https://www.jpl.nasa.gov/deep-space-network-now/): research and spacecraft mission communication infrastructure; no publicly verified ordinary consumer message-uplink service found.
- **Cosmic Echo** (https://www.cosmicecho.ai/send-message-to-space): commercial $29 promotional claims, but operator, antenna site, spectrum authorisation, proof, refund and data processing need careful verification. Do not assume validated radio transmission from sales copy.

## Australia regulatory consideration
ACMA (https://www.acma.gov.au/licences/earth-radio-licence ; https://www.acma.gov.au/licences/earth-licence-0) says an Earth radio licence is generally needed to operate an uplink station sending messages to satellites, and frequency coordination applies. Outsourcing transmission to an appropriately authorised foreign station changes who operates the transmitter, **not** our duty to verify lawful handling and responsible marketing. Never set up or transmit from an unlicensed improvised ground station as a shortcut.

## Hard product guardrails
- No automatic radio transmissions after an ordinary prayer. Default = **free, private, local-only symbolic star release**.
- A separate opt-in screen must clearly distinguish *symbolic release*, *satellite-relayed packet* and *outward-directed RF signal*. Only claims justified by evidence.
- Do not send complete sensitive prayers to providers by default. Offer a user-approved short neutral summary or encrypted commitment/hash only **if the provider and mode can support it**; a hash alone cannot let external observers read a prayer.
- Disclose up front: third-party provider identity, destination, jurisdiction, storage/retention, visibility, price, delivery limitations, cancellations/refunds, and what is recorded in a receipt. Never send without explicit user consent.
- Store receipts as user-accessible private records only when clearly authorized, with verified timestamps, station ID, batch/reference ID, direction/frequency as applicable, operator confirmation, and provider-signed proof if available.
- Record states as REQUESTED → ACCEPTED → SCHEDULED → TRANSMITTED (operator-attested) or FAILED/REFUNDED. “Sent into space” must not display merely because an animation completed or a purchase succeeded.
- A certificate is evidence of a provider's claim, not scientific proof that a listener anywhere received the message.
- Do not use unverifiable counters, imaginary transmissions, vulnerable-user pressure, claims of spiritual efficacy or premium upselling at moments of distress.

## Architectural options
**A. Research pilot with authorised provider (preferred):**
User opts in to send an explicitly selected message or short phrase; backend signs one-time consent, creates provider request, receives provider receipt, checks authenticity and shows separate star marker only once confirmed. First conduct a founder-funded, low-volume experiment; validate recording with independent evidence before offering paid consumer transmission.
**B. Satellite relay proof-of-concept:** use contracted RockBLOCK device and Iridium messaging to a controlled Earth terminal; this proves space relay, not an interstellar radio broadcast. Hardware and subscriptions add operational complexity and require transparent explanation.
**C. Own station:** Not appropriate for MVP. Involves licensing, RF engineering, equipment, interference coordination, spectrum compliance, telemetry and long-term maintenance.

## Research and acceptance gates
1. Request primary provider documentation, authorisation, station coordinates, emission schedule, RF power and beam pattern, third-party audit/log proof, API/contract, cost at scale, privacy/data retention, cancellation/refund policy.
2. Test one innocuous founder-origin message using explicit permission; no real user prayers in experiments.
3. Require dated operator receipt and independently verifiable radio or operational evidence. Reconcile planned vs actually transmitted events.
4. Conduct privacy and consumer-law review in Australia before any monetisation.
5. Build a demo UI clearly marked NOT LIVE/NOT SENT until above gates are satisfied.

## CEO recommendation
Continue V0.2Q sky visual and personal memory. Introduce the *concept* as a future opt-in only, not a working button claiming real RF. Of the choices, a reputable licensed space-message broadcaster is the closest conceptual fit; satellite relay is more instrumentable but semantically less meaningful for “send a wish outward.”
