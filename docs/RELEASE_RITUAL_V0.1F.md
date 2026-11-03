# Wish Garden — Release Ritual V0.1F
Date: 2026-11-04
Status: preview implementation, not production-ready
Source of truth: index.html + tests/preview.test.mjs

## Experience contract
1. Visitor arrives in a tranquil illustrated garden.
2. They select an intention and write a prayer, wish or hope.
3. Default choice is **release without saving**; explicit alternative is local browser storage.
4. When sending, a symbolic light rises into a celestial view.
5. After the animation, a small constellation appears along with a gentle message.
6. Visitor can skip the animation, and the OS reduced-motion preference completes instantly.
7. The ritual makes no claim about supernatural outcomes, real-time people praying, or a physical signal received by the universe.

## Technical state machine
- IDLE: message editable; release disabled when trimmed text is empty.
- RELEASING: light animation active, reduced motion bypass available, pending completion timer (client only).
- COMPLETE: constellation and completion copy revealed; skip control hidden.
- START_AGAIN: a subsequent release cancels any previous timer and resets the scene.

## Privacy contract
- No network submission from the client.
- Default mode does not persist wish text.
- If the user opts to save, the text is stored only in unencrypted localStorage on that device.
- Export and delete actions available.
- Avoid entering sensitive personal data on shared devices.
- There is no real user-count or public community data.

## QA and open blockers
- Tests enforce script-free external integrations, default non-persistence, control existence, optional saving/deletion, reduced-motion and bilingual copy.
- GitHub Pages workflow must pass before calling the new revision deployed.
- Browser interaction verification on actual hosting origin, formal accessibility testing, mobile performance, threat model and moderation are still outstanding.
- A future public Collective Hope feature requires opt-in sharing, abuse prevention, genuine counts, moderation and privacy policy.

## Deferred roadmap
Family Garden, 3D homes, memory reconstruction, commerce and Life Engine are research directions only. No shared BuiTai systems or production credentials.
