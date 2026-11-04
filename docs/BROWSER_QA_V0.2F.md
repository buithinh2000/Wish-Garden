# Wish Garden V0.2F — Browser QA and Performance Gate
Date: 2026-11-04
Project: Independent Wish-Garden repository (not BuiTai)

## What changed
1. Native WebGL renderer now pauses its requestAnimationFrame loop when the tab is backgrounded and resumes on visibilitychange, improving idle resource use.
2. A Chromium browser smoke runner tests the real HTML app at a local HTTP origin on desktop (1280x800) and mobile (390x844).
3. GitHub Pages workflow executes browser tests before upload/deploy. Failure blocks the publishing job.
4. CI runner pinned to Ubuntu 24.04 because Playwright 1.56.1 cannot install Chromium on the Ubuntu 26.04 runner encountered.

## Browser acceptance coverage
- Entry: prayer form initially hidden, opens when user chooses to enter.
- Default privacy: wishes are **not saved** without explicit consent.
- Ritual: full-screen sky appears; symbolic completion shown; return works.
- Language: English-to-Vietnamese switch.
- Local optional save: only user-selected wishes enter localStorage.
- Delete: saved local wishes can be removed.
- Both mobile and desktop runs assert no uncaught JavaScript page errors.

## Evidence
GitHub Actions run 41813608415 — successful browser smoke tests, asset package and Pages deployment at commit ea12dfe98ae65fe238a2c43d90e3191d68337a51.

## Not yet validated
- Visual quality and naturalness of procedural avatar on Safari, Android and physical phones.
- Full WebGL rendering correctness, performance/FPS under load, context restore and mobile heat/battery behavior.
- WCAG audit and screen-reader flow.
- Security audit, encrypted storage, server privacy controls, community real-count/moderation.
- This remains a **preview**, not an approved production release.

## Future priorities
1. Capture actual browser screenshots as CI artifacts for visual regression review.
2. Address WebGL projection and avatar art quality, ensure clear silhouettes on mobile.
3. Keep full-screen scene and wish ritual visually cohesive before introducing new features.
4. Evaluate a rigged 3D character only when asset licenses and performance budgets are verified.
