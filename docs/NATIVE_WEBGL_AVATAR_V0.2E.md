# Wish Garden — Native 3D Visitor V0.2E
Date: 2026-11-04
Status: Static preview, NOT production

## What changed
- Added a procedural 3D avatar rendered with **native WebGL 1**, without external libraries, API calls, authentication or paid services.
- Avatar uses real 3D triangular geometry: head, hair, robe, arms, legs, hands and feet. It is not a flat SVG image pretending to be 3D.
- Walking movement drives both 2.5D avatar position and an articulated 3D arm/leg gait. At the wishing tree, the character transitions into a prayer pose with hands joined.
- Visitor color variants (Moon, Warm, Light) update the 3D robe material.
- If WebGL cannot initialize or loses context, the original SVG visitor remains visible as fallback.
- Reduced-motion settings suppress repeated breathing and walking gait animation.

## Scope and limits
- The sanctuary remains a *layered cinematic 2.5D background*; there is not yet a navigable 3D environment with collision detection or a third-person camera.
- The WebGL person is a stylized low-poly original avatar, not a realistic rigged human or user-photo recreation.
- This is a proof of capability to validate interaction and performance. Visual QA on actual devices has not been completed.
- The game world does not need access to prayer text; no prayer text is transmitted.
- The default is release without saving. Optional unencrypted browser-only storage still has shared-device risks.

## QA
- CI source checks include compilation of **all** inline scripts, existence of WebGL geometry/draw path, fallback and motion handling, existing privacy controls and no external script/networking.
- CI deploy success verifies the GitHub Pages workflow, NOT a complete WebGL/browser compatibility audit.
- Next checks: WebGL context loss, browser memory, 30fps budget on mid-range Android, lighting, keyboard and screen-reader path.

## Roadmap not included
Real 3D terrain, walkable world with navigation, full humanoid rigging, avatar customization, Family Garden, marketplace, and Life Engine remain separate future evaluations.
