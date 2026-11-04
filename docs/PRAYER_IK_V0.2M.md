# Wish Garden V0.2M — Measured two-hand prayer pose
Date: 2026-11-04
Scope: Wish Garden independent public preview.

## Problem and solution
Previous versions rotated shoulders/elbows by guessed angles, producing unnatural outward-pointing arms. The Maya rig's actual joint hierarchy was verified using a Chromium artifact of GLB skeleton names: `upperarm_l/r`, `lowerarm_l/r`, and `hand_l/r`.

Instead of cosmetic shoulder animation only, the new prayer pose uses a one-shot **cyclic coordinate descent (CCD) inverse-kinematics solver**:
- The character turns slightly toward the shrine.
- Both targets are set close together immediately in front of the chest.
- Shoulder and elbow joint quaternions are updated in each bone's actual parent coordinate system.
- The update is performed once when entering the prayer state, rather than solving every frame.
- In a real Chromium browser, the end-effector distance between `hand_l` and `hand_r` is measured. The automated gate requires the two hand joints to be less than 0.20 world units apart on both desktop (1280x800) and mobile (390x844).

The entry headline/buttons also disappear while the visitor is at the tree, ensuring the sanctuary remains visually quiet. Returning to the initial scene re-enables controls and does not erase an unsent wish draft.

## QA and release truth
- The browser test checks rigged civilian model rather than silently accepting a fallback model.
- Prior privacy invariants remain: default do not save, optional unencrypted local-only save, deletion/export and symbolic constellation ritual.
- Source files remain HTML/CSS/JS + Three.js static bundle, no backend or paid API.
- Actual screenshot review confirms arm pose is noticeably less like a T-pose, but shows the subject from behind so individual fingers are not clearly visible. This is **not** a photorealistic prayer motion or professional animation acceptance.
- Release still requires device testing across Safari iOS and lower-end Android, visual review and accessibility audit.

## Art-direction notes
Maintain an ordinary adult visitor, never return to a fantasy sorcerer, and do not conflate quantitative hand proximity with the emotional quality of prayer. Keep the soft sanctuary-to-cosmos journey short, grounded and uncommercialized.
