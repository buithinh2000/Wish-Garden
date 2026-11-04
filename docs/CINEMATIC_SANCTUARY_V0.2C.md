# Wish Garden — Cinematic Sanctuary Asset Integration V0.2C
Date: 2026-11-04

## Product outcome
- The actual GitHub Pages website now uses licensed, high-resolution photographed environments instead of relying solely on flat SVG artwork.
- The entrance depicts a forest illuminated by hanging lanterns, with the praying visitor avatar in the foreground.
- The symbolic release view uses a colorful abstract cosmic background behind the interactive light and constellation.
- The original SVG remains embedded as a graceful fallback if static images cannot load.
- The experience still begins with a scene, not an immediate form; the ritual remains opt-in.

## Asset register
1. Forest: Kushan Janith, *Hanging lanterns illuminate dark trees at night*, Unsplash, https://unsplash.com/photos/hanging-lanterns-illuminate-dark-trees-at-night-BHw6GyO0gG0
   - Original source for build: https://images.unsplash.com/photo-1764798722469-a22f1752fc1c
2. Cosmos: *a colorful nebula in space*, artist **and machines**, Unsplash, https://unsplash.com/photos/a-colorful-nebula-in-space-behIk7IeMYY
   - Original source for build: https://images.unsplash.com/photo-1661777032455-5582bf3eba07
License reference: https://unsplash.com/license . Free commercial use with restrictions (not resale of unmodified standalone images). Attribution provided here as a courtesy.

These photo assets are downloaded by the CI workflow and included in the GitHub Pages artifact. They are not uploaded from a private user photo or taken from reference images of uncertain license.

## Technical and privacy boundaries
- Static front end. No user account, upload, service-side wish storage, or real Collective Hope counts.
- The wish release is symbolic; it does not imply any confirmed supernatural outcome.
- Wish text is not transmitted to a server. Browser-local persistence is optional, unencrypted, and explicitly selected.
- The avatar remains a lightweight illustrated figure, not yet a customizable 3D person or live animation.
- Full browser QA and screen-reader audit are still required for beta; GitHub Actions source checks and successful deploy alone do not prove visual quality.

## Follow-up improvements
1. Art-direct a coherent professional environment from licensed textures and modular scene assets.
2. Optimize background formats (WebP/AVIF) and deliver responsive sizes.
3. Introduce a rigged, user-selectable avatar with scene-responsive movement and prayer pose, retaining a lightweight fallback.
4. Add cinematic transition scenes without forcing camera movement for motion-sensitive visitors.
5. Assess user feedback: whether the sanctuary feels reassuring and respectful, not simply visually spectacular.
