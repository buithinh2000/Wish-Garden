# Wish Garden V0.2P — Sky of Wishes
Date: 2026-11-05
Status: public GitHub Pages preview, not a production wellbeing service

## Intent
The sky is a private, symbolic place for a visitor's own hopes. On sending a wish, a point of light ascends, blossoms once, then settles into a small star. The sky is intentionally quiet and does not represent or invent participation by other people.

## Actual interaction
- The current sanctuary offers **My Sky**, so a visitor can revisit memories without sending another wish.
- Sending a wish gives it a star in the current browsing session. Only wishes explicitly opted into **Save on this device** are persisted.
- Stars glow softly; the new star has an arrival pulse. When reduced motion is enabled, it settles immediately with no moving flare.
- Clicking or tapping a star opens a private card with the original words, selected theme and date. All wish words use `textContent`, never HTML rendering.
- After reload, only saved stars return. Deleting saved wishes removes those stars after reload as well.
- Existing old-format local wishes (without an ID or star coordinates) are mapped to deterministic positions without changing or uploading their contents.
- English/Vietnamese labels are supported. Stars have accessible button labels and a close control.

## Data contract
LocalStorage key: `wg-preview-local-01`.
An opt-in saved record:
```json
{"id":"random UUID","text":"sample wish","topic":0,"date":"2026-11-05T00:00:00.000Z"}
```
The star's location derives deterministically from its ID, so returning after refresh preserves its location. There is no central sky, registration, service API, sync, or public count.

## Privacy and integrity
- Words sent **without saving** are retained only in this open page's memory, not in localStorage.
- Words with opt-in saving are stored unencrypted in the local browser and may be readable on a shared device.
- No community prayers are shown. The decorative backdrop does not imply real-world participation.
- There is no claim that the prayer is received by a deity or that its outcome is guaranteed.
- Export and delete behavior remain available.

## Emotional art direction
The star should not resemble a video-game reward or notification. The moment has three measured gestures: rise, bloom once, become a quiet fixed point. The sky is open and readable, with gentle color differentiation by topic. Memory cards are restrained and free from likes, streaks and public reactions.

## Verification
GitHub Actions invariant tests cover privacy boundaries, safe text rendering and local bundle loading. Chromium desktop/mobile smoke tests cover unsaved session-only stars, saved stars after reload, click to view, deletion and absence after reload, bilingual controls and the existing prayer journey. CI success does not replace visual acceptance testing on iOS Safari or physical Android devices.

## Follow-up gates (not bundled here)
- Human review of sky screenshots, contrast, tap targets and motion, especially small screens.
- Improve flare timing/camera transition and subject-specific colour mapping.
- Consider separate private browser encrypted storage only after a security architecture decision. No public sky should launch without consent, moderation and deletion/privacy design.
