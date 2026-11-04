# Wish Garden V0.2Q — Cinematic Star Release and Sky Quality
Date: 2026-11-05
Status: static public GitHub Pages preview; private wishes only.

## Objective
A wish released from the garden should feel like a quiet, sincere gesture rather than a game achievement: a small light ascends, blooms once, shrinks, then remains as a tappable star. All visible *interactive* stars represent the visitor's own session or explicitly saved local wishes.

## Changes delivered
- The rising flare is now attached to the same responsive sky coordinate field as the final memory stars, correcting previous mismatch between the flare's viewport percentages and the star-field inset on desktop/mobile.
- A trailing soft glow, one radiant bloom, then an inward settling animation replaces the previously blunt motion.
- Atmospheric gradient layers create restrained cloud-like light without fabricating any other users' prayers or social count.
- Real prayer stars are 44px tappable buttons while the visible light remains delicate and small. Buttons have keyboard focus styling.
- Reopening My Sky clears an in-progress flare rather than displaying a stale release animation.
- Reduced-motion preferences disable ambient breathing, trail and entrance animation. The memory star remains visible without motion.
- Existing cards use textContent, not HTML injection. No new network, analytics, user database, or paid API.

## Product boundaries
- Memory stars are the user's own only. Background atmosphere is purely decorative and is not presented as real community participation.
- Unsaved wishes last only for the current page session; only explicitly chosen local browser saves persist.
- LocalStorage remains unencrypted; it is not appropriate for sensitive content on a shared device. Export and deletion remain.
- Decorative visual motion cannot promise a supernatural result.

## Verification
Run Node invariant tests, Chromium desktop (1280x800) and mobile (390x844) browser journeys, verify clickable 44px stars, memory card view, save/refresh/delete, no-save privacy, and GitHub Pages deploy. Review captured screenshots before claiming cinema-grade visual quality. Safari/iOS physical-device testing remains outstanding.

## Next design gates
- Human review of sky screenshot focal point, card contrast, and mobile visibility.
- Optional ambient audio only as opt-in with zero autoplay, licensed assets and mute control.
- Community stars require explicit opt-in, moderation/privacy/delete design, a trusted backend and real activity evidence. Do not fake them.
