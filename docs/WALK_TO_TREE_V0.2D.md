# Wish Garden V0.2D — Walk to the Tree
Date: 2026-11-04
Status: GitHub Pages preview only

## Scope
- Adds a visible invitation to approach the wishing tree within the scene.
- Both the scene interaction and primary Enter button initiate the same walkthrough.
- The visitor avatar translates slightly toward the tree with a brief eased movement.
- Once arrival finishes, the prayer panel opens and keyboard focus moves to the wish field.
- If reduced motion is enabled, entry completes immediately without the walking delay.

## Product boundaries
This is a layered 2.5D sprite movement, not free-roaming 3D or a rigged animated character. The current visitor silhouette remains an SVG illustration. The preview has no backend and no real Collective Hope user counts. Wishes are not submitted to any network. Optional localStorage is not encrypted.

## Engineering notes
- In-memory `approachTimer` guards against double clicks during transition.
- `walking` and `arrived` are separate CSS states.
- Native buttons support keyboard initiation.
- Test invariants cover the interaction hook, transition, keyboard focus and motion reduction.
- GitHub Actions success covers source tests plus publishing, not full live-origin browser QA.

## Next gates
- Validate scene and avatar positioning on mobile and desktop screenshot captures.
- Add accessible way to revisit the sanctuary after opening the prayer panel.
- Evaluate a licensed rigged avatar and terrain for genuine 3D later; do not label current work as 3D.
