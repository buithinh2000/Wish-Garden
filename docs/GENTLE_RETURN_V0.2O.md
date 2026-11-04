# Wish Garden V0.2O — Gentle return from prayer
Date: 2026-11-05
Status: static GitHub Pages preview

## User-facing improvement
After approaching the tree and praying, the visitor should not snap back abruptly when the user returns to the garden. V0.2O smoothly restores the Maya avatar from the final IK prayer pose to its standing idle pose over approximately 750 ms. The rig's shoulder and elbow quaternions are blended toward the animation-sampled idle target, while the gentle bow releases. A visual-QA screenshot is captured after the return.

The existing entrance remains: approach tree → slow hand joining and bow → private wish → symbolic cosmos → peaceful return. Form drafts remain in memory when leaving the prayer panel. No additional text is recorded or transmitted.

## Quality and accessibility gates
- Both 1280×800 desktop and 390×844 mobile Chromium tests run.
- Motion-enabled tests now exercise both the approach/prayer interpolation and the return-to-idle animation.
- With reduced motion, the character transitions directly to the endpoint pose.
- The feature remains progressive: Maya rig, procedural WebGL fallback, then SVG fallback.
- Automated screenshots prove rendering and interactions but are not a professional emotional-design review or physical-device FPS audit.

## Scope boundaries
No account, payment, backend, community counters, paid APIs, or wish transmission were introduced. Local persistence remains explicitly opt-in and unencrypted. The garden is still a photo-backed 2.5D sanctuary, not a freely navigable 3D world.
