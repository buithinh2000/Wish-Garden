# Wish Garden — Sanctuary Experience V0.1G
Date: 2026-11-04
Status: Preview, not production
Repository: buithinh2000/Wish-Garden

## Product intent
A peaceful non-denominational space where a person can express a hope, prayer or difficult feeling, release it symbolically and leave without being asked to interact with a feed or pay.

## Experience changes
- The garden now has a user-selectable **Twilight** or **Dawn** atmosphere. This is a visual preference, not a reward or spiritual ranking.
- The release view moves into the visible viewport so mobile visitors can witness the ritual.
- On completion, a constellation appears with a gentle message; visitors can skip immediately.
- The light ripple is illustrative, not a measurement of a supernatural phenomenon or community participation.
- Reduced-motion preference and manual motion toggle suppress nonessential motion; visitors can complete the ritual without animation.
- Text and controls are available in Vietnamese and English.

## Privacy invariants
- Default: release without saving.
- Optional: save locally on the device, unencrypted.
- No wish text sent to a backend; no external analytics.
- Export JSON and delete local entries.
- No real-time count of people praying: Collective Hope remains a future privacy-preserving server-side feature.

## Implementation and QA
- Static HTML/CSS/JS with original inline SVG scene. No paid service or shared BuiTai infrastructure.
- Tests enforce baseline privacy controls, no external requests, selected visual controls and compilable inline JavaScript.
- Hosted GitHub Pages workflow is the deployment gate. CI success verifies static-code checks and publish workflow, **not** full browser E2E or security audit.

## Further validation
- Test on actual mobile devices and Safari, Chrome and Firefox.
- Accessibility review: keyboard focus, speech-reader announcements, sufficient contrast, motion setting.
- Evaluate with 10–15 voluntary participants: emotional comfort, clarity, whether ritual feels respectful, and whether they want to return without engagement pressure.
- Do not collect sensitive prayer text as analytics. Use opt-in anonymous feedback only.
- Separate future research: Family Garden, 3D memories, construction economy and Life Engine.
