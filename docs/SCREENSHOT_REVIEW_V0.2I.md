# Wish Garden V0.2I — Visual correction based on actual browser screenshots
Date: 2026-11-04
Status: public preview

## Evidence-based correction
The V0.2H screenshots were inspected visually (1280x800 desktop and 390x844 mobile). The actual scene was almost black, with floating lantern/star geometry, an indistinct background and a blocky low-poly visitor. These issues were not detected by the pass/fail browser tests. Passing CI did not mean the result met the agreed emotional design goal.

## Corrections delivered
- Replaced the previous dark lantern photograph with a forest-at-night pagoda scene by Pramod Tiwari, listed as free under the Unsplash License.
  Source: https://unsplash.com/photos/a-pagoda-in-the-middle-of-a-forest-at-night-3BK2ROu9SFQ
  Image ID: photo-1726954531046-d033ef59ff0f
- The original line-art SVG is now hidden in the normal hero composition, because its visible lantern discs/trees were competing with the photograph.
- Removed the artificial ground-triangle path and oversized radial lantern circles, which obscured the scene.
- Rebalanced desktop/mobile hero overlays, brightness and avatar positioning while retaining existing interactive ritual.
- Added a browser gate requiring the photographic asset to load and the legacy art layer to be hidden.

## Asset and rights
Unsplash License: https://unsplash.com/license . This artwork is licensed by the upstream photographer; the project does not claim ownership or distribute the image as a standalone product.
The cosmos source remains unchanged and is separately attributed in docs/CINEMATIC_SANCTUARY_V0.2C.md.

## Known gaps
- Real-world photo with stylized low-poly WebGL character is still not a unified cinematic art style.
- No rigged natural human, no traversable 3D garden, no professional accessibility audit.
- No owner/artist review on the new screenshots yet; screenshots and browser tests can only prove the code loads and basic interactions work.
- Future iterations should review screenshots before further art changes; do not add uncontrolled visual effects.

## Privacy
No server transmission of wish text. Optional browser storage is not encrypted.
