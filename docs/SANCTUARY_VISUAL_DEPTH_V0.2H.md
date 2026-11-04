# Wish Garden V0.2H — Sanctuary Visual Depth
Date: 2026-11-04

## Delivery
The public GitHub Pages preview now uses a more coherent layered 2.5D environment with original CSS light blooms, ground mist, a perspective path and ground shadows anchoring the visitor to the environment. The invitation and headline have a tighter cinematic layout, with new mobile framing.

## Usability correction
The former sanctuary wrapper had `aria-hidden="true"` even though it contained focusable Enter, avatar appearance and Approach controls. That was an accessibility bug. The wrapper now has an accessible description, and its controls are no longer hidden from the accessibility tree.

## Boundaries
This remains a cinematic 2.5D environment and a procedural low-poly WebGL character. Photographic background images are integrated from licensed sources; no real world movement, physical navigation, rigged photorealistic character or production virtual-world infrastructure is claimed.

## Tests
Unit invariants and Chromium smoke validate the scene layers, screen-width layout, accessibility wrapper, wish ritual, user privacy defaults and reduced-motion path. Screenshots are archived in the Pages CI artifact for human review. A successful browser smoke cannot substitute for professional visual design review or real-device testing.

## Quality roadmap
Human art review of screenshots; a better integrated avatar with realistic rigging and praying animations; evaluate visual perception and performance on lower-end mobile browsers before introducing 3D free movement.
