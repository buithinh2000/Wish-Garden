# Wish Garden — Visual QA and Avatar Interaction Gate V0.2G
Date: 2026-11-04
Repo: buithinh2000/Wish-Garden
Status: prototype, not production

## Concrete change
1. WebGL avatar now explicitly clears its animation-frame scheduling marker when a frame starts, preventing missed updates after switching from idle to prayer pose in reduced-motion mode.
2. Visitors can return from the prayer panel to the sanctuary without losing an unsent draft. The avatar resets to standing idle and the entry controls become active again.
3. Desktop (1280x800) and mobile (390x844) Chromium smoke runs capture three screenshots each: sanctuary, prayer panel, constellation.
4. Browser tests assert pose transitions when WebGL initializes, privacy defaults, draft persistence across returning, language switch, delete, and no JavaScript page errors.
5. GitHub Actions archives screenshots for 14 days as `wish-garden-visual-qa` even if later steps fail. This is test evidence; it is not a substitute for human visual design review.

## Visual quality truth
The current figure is a stylized procedural WebGL character, not a realistic rigged avatar; the forest and cosmos are photographic background layers, not navigable 3D spaces. Source code and passing CI cannot by themselves prove that the scene feels comforting, immersive or aesthetically finished. Real device visual review and user testing are still release blockers.

## Privacy boundary
No prayer text sent to backend; optional browser-local wish storage is unencrypted. Screenshots contain only synthetic test content. No real community counts or supernatural claims.

## Future art direction
Prioritize cohesive human-avatar and sanctuary design, camera positioning, mobile readability and motion. Do not expand into Family Garden, commerce, Life Engine or new social mechanisms in this iteration.
