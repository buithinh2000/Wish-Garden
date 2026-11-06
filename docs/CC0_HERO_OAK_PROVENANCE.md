# Wishing Tree visual asset — CC0 provenance

## Hero oak (new)
- Name: **Oak street tree, detailed leaves**
- Author: Innerscene (original model)
- Catalog: https://www.innerscene.com/tools/library/3d-parts/oak-street-tree-detailed-leaves-a273fef9
- License: **CC0 1.0**, free commercial use, adaptation and redistribution, no attribution required (credit preserved here voluntarily).
- Format: binary glTF / GLB, approximately 5.9 MB, approx. 9,450 foliage leaves.
- Asset download: https://files.innerscene.com/library/oak-street-tree-detailed-leaves-a273fef9/4a26d0fea7474835bf61/oak-detailed.glb
- The Pages workflow downloads and checks file signature/declared size and expected range. **A fixed SHA-256 is still required once a trusted release download has been independently obtained and hashed.** Until then the asset cannot be considered content-pinned. File source availability remains an external deployment dependency.

## Integration
- Runtime path: `assets/nature/wishing-oak-detailed.glb`.
- Replaces only the hero mesh at world coordinate `(0,-18)`. Keeps a geometry-based fallback if unavailable.
- Ground, wish-lights, ambient figures, walks, ritual events and visual effects remain independent.
- Kenney CC0 trees remain for background scenery. The hero oak is not a Kenney low-poly tree.

## Visual acceptance gate
Run Pages build and inspect screenshot/video on an actual desktop and phone browser (including glTF load errors). Check heroTreeSource = innerscene-cc0-oak-glb and heroTreeVisible = true via existing world debug state, default framing, wish light positions and mobile performance. Preserve reduced-motion behavior. Do not merge if live-preview evidence fails.
