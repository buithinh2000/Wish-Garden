# Wish Garden V0.2K — Remove fantasy staff without replacing character rig
Date: 2026-11-04
Status: Public static preview

## Evidence-driven art correction
The user-facing character from the free Gobkit CC0 Priestess package had an unwanted magical staff and a conspicuously game-like silhouette. The asset contains only one skinned mesh; attempting to hide an object named "staff" does not work. We inspected the GLB 2.0 geometry, verified that the accessory is made of separate disconnected surface components, and implemented a deterministic preprocessing script.

## Code change
- `scripts/clean_visitor_glb.py` reads the GLB 2.0 position and index buffers using Python standard library only.
- It identifies verified disconnected accessory triangles in the source bind pose by their narrow position/extent around the staff (not by arbitrary object name).
- It rewrites 520 staff triangles as degenerate triangles; no skeletal rig, animation curve, joint weight, texture or vertex index is deleted.
- Safeguard: the build fails if the detected accessory count falls outside 450–600 triangles, to avoid silently mutilating an updated model.
- GitHub Actions applies this transformation only to the downloaded CC0 model at build time, then bundles the original Three.js player, runs desktop/mobile Chromium smoke and deploys Pages.
- Adjusted the in-scene walking button so it does not overlap the visitor and shortened bilingual text.

## Visual QA
Desktop (1280×800) and mobile (390×844) browser screenshots from workflow run `41826378069` were inspected: the staff is absent, while the visitor, shrine and scene remain visible. This is a meaningful correction but does **not** make the character photorealistic. The low-poly silhouette is still the largest remaining visual mismatch.

## Licensing and privacy
The source pack and CC0 terms are recorded in `docs/RIGGED_VISITOR_V0.2J.md`. Alterations do not change the need to respect the original asset provenance.
The model has no access to prayer text. Wish text is not network-transmitted; optional browser-local retention remains unencrypted.

## Remaining art/QA gates
- Source a natural-looking, appropriately licensed human avatar and natural praying animation, with a documented performance budget.
- Review screenshots *before* concluding art-quality improvements.
- Verify on Safari/iOS and Android hardware.
- Keep the 4-stage prayer ritual and no-storage default unchanged.
