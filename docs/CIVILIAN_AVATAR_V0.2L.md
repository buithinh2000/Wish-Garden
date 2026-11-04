# Wish Garden V0.2L — Civilian human visitor and mobile 3D budget
Date: 2026-11-04
Status: Public preview; not production ready.

## Visual improvement
- Default advanced visitor replaces the earlier fantasy Priestess with **Maya**, a civilian adult in ordinary clothes, based on MakeHuman/MPFB assets, with a real skinned skeleton and seven named locomotion animations (including Idle_Standing and Walk_Relaxed).
- Original creator and model source: https://www.innerscene.com/tools/library/3d-parts/locomotion-collection-maya-3d-person-animated-1499b2fd
- Direct licensed model (for reproducible build): https://files.innerscene.com/library/locomotion-collection-maya-3d-person-animated-1499b2fd/565cfb8a45b8a67a79c4/locomotion-collection-maya-3d-person-animated.glb
- Innerscene describes its Maya model as **CC0 / public domain** and adapted from MakeHuman CC0 assets. We do not claim model authorship.
- Three.js is MIT licensed; esbuild is MIT licensed; GLTF Transform is MIT licensed.

## Rigging and animation
- The first-party Three.js player loads civilian Maya before the previous Gobkit rig; failure can trigger the Gobkit fallback.
- CI **asserts** the actual active character source is `civilian-maya` during both desktop and mobile Chromium tests, so releases cannot silently pass using only the old model.
- Fixed character placement by centering and scaling from the skinned mesh bounding box; the full body is now visible in screenshots instead of cutting off the lower legs.
- Normal standing posture has naturally lowered arms. Prayer gesture uses joint rotations for the actual MakeHuman `upperarm_l/r` and `lowerarm_l/r` bones. **This pose is an approximation**, not verified professional motion capture; visual review remains required.

## Performance budget
- Original 20+ MB GLB has large embedded PNG textures.
- GitHub Actions resizes textures to max 1024px and transcodes to WebP with glTF Transform while retaining the rig and animation clips, enforcing a hard compressed asset limit of 12 MB.
- Model is hosted within the same static GitHub Pages artifact and is not fetched from a third-party site by an end user.
- Existing procedural WebGL and SVG visitors remain fail-safe alternatives.

## Product and privacy boundaries
- No account, backend write, analytics, social activity or paid API introduced.
- Private wish text is never transmitted to a server; optional local browser storage is unencrypted.
- The scene remains a 2.5D photo-backed sanctuary with a 3D visitor — not a free-roaming 3D world. The default character is female and is not a personalized likeness of the user yet.

## QA gates
- Chromium desktop 1280x800 and mobile 390x844 smoke: entry, civilian model active, ritual, return, bilingual interface, default no-saving, optional saving and deletion.
- Human visual review of archived screenshots is required before treating prayer posture or visual consistency as accepted.
- Safari/iOS, Android hardware battery/performance and professional accessibility review remain unverified.
