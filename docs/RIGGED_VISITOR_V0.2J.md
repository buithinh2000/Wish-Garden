# Wish Garden V0.2J — Licensed Rigged Visitor
Date: 2026-11-04
State: Public static PREVIEW, not a finished realistic 3D sanctuary.

## Asset provenance & licensing
- Model: Gobkit Free Character Pack Vol.3, "Priestess" GLB — 3D skinned character with separate named Idle, Walk and other clips.
- Direct free resource: https://gobkit.com/freebies/human003/Priestess.glb
- Official pack: https://gobkit.itch.io/gobkit-free-character-pack-vol-3
- Official free listing: https://gobkit.com/api/free
- License as published by creator: **CC0 1.0**, including commercial use. Keep provenance linked, though attribution is not required.
- Runtime: Three.js MIT-licensed three package version 0.180.0, bundled by esbuild 0.25.12 from project source `src/visitor-rig.js`.
- The model and bundle are packaged as local assets in GitHub Pages, not loaded from a third-party host by the end-user browser. No paid APIs.

## Implemented
1. Replaces earlier primitive round-body mesh, when supported, with a real rigged textured GLB visitor.
2. Plays named Idle/Walk animation clips via AnimationMixer, cross-fading across entry sequence.
3. Overrides arm bone rotations after sampling to rest arms naturally in idle and fold toward chest for a symbolic prayer pose.
4. Scales, darkens and repositions model to be secondary to the shrine; do not dominate the scene.
5. Keeps previous procedural WebGL avatar and then SVG as fallbacks if the new rig or WebGL is unavailable.
6. Honors reduced-motion, pauses animation in background tabs and has no dependency on personal prayer text.
7. Chromium test requires the rig to load on desktop and mobile, verifies prayer stages, privacy and export/deletion, and captures sanctuary + full-scene prayer posture screenshots.

## Honest visual appraisal
The selected CC0 rig is a low-poly fantasy character, not a photorealistic person. The small stylized priestess silhouette still looks game-like compared with the emotional research imagery. The prayer pose is a procedural joint approximation, not captured human motion. The forest is an image, not fully 3D. This delivery is a technical + scene-integration milestone only, pending real user visual acceptance.

## Security/privacy and operational boundaries
- The user's wish remains only in the local page; it is never sent to GitHub or an app server.
- Local storage is optional by explicit consent and is unencrypted.
- No real social counters, no monetized rituals, no tracking.
- Successful CI is not evidence of emotional impact, accessibility completeness or compatibility on every real mobile device.

## Next product gates
- Replace placeholder character with coherent mature art-direction and natural mocap-quality prayer motion under an appropriate license.
- Test visual screenshots in Safari/iOS and Android, frame time and memory.
- Preserve the quiet 4-phase sanctuary → writing → sky → peaceful completion ritual.
