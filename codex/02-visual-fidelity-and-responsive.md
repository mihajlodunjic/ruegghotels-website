# CODEX 02 — Visual fidelity and responsive cinematic UI

Prerequisite: Owner has reviewed package 01 and authorized continuation. Read `AGENTS.md`, docs, the prior report, and mockups (desktop_01..05/mobile_01..05). Inspect baseline branch/git state. Create a new feature branch from up-to-date main only when the prior approved merge exists, or continue according to the actual user-approved Git state; never assume a merge happened.

Implement all five scene compositions faithfully, but preserve actual video architecture and already tested state machine:

1. Hero original still: ivory invitation panel on RIGHT ~32% at 1920×1080, preserve left mountains/stone logo/central entrance; brand promise, Step Inside and Book CTA. Animated withdrawal reveals video. Avoid a new opaque overlay across entrance.
2. Welcome ~10s: LOWER LEFT restrained editorial typography/optional background with Continue + Our Story, preserving central portrait, book and counter. Confirm actual pause screenshot on current master; test exact 10.000 frame and propose adjustments without silently changing approved checkpoint.
3. Hallway 17.125s: B0 Reconstructed image, right walnut door outline from image-relative polygon, hover/focus/touch affordance; button alternatives. Respect aspect-ratio mismatch of B0 relative to 16:9. No glassmorphism/glow, no bulky overlay obscuring the door.
4. B3: hold whole room when branch finishes; opening info causes graceful layout shift to 64% visual / 36% ivory editorial on desktop. Keep Back to Hallway accessible even if panel is closed, and never run reverse while info overlay still animates.
5. Table finale: hold actual Master last frame and then burgundy right panel ~38%; preserve communal table left. Three hotel selection rows → unified /book with query selection; Our Local Circle and Replay.
6. Shared typographic system: licensed editorial serif (font loading with fallbacks) + readable sans. The palette from `docs/01-blueprint.md` is provisional; match mockup hierarchy and ensure contrast, 200% zoom and narrow widths.
7. Mobile 390×844: not a scaled desktop; contain critical 16:9 frames, controls/cards underneath, 44px buttons, safe areas and rotation. Specifically validate right door stays visible, and finale/room panels can scroll without advancing video. Header menu and Book stay accessible.
8. Use GSAP sparingly, scoped cleanup on unmount/route change, reduced-motion disabled/reduced transitions. No camera transformations, fake parallax or synthetic video changes.

QA: full state-machine regression, visual Playwright screenshots at 1920×1080, 1440×900, 390×844, 375×812, keyboard/focus and reduced motion. Report differences to references and rationale. Commit/push/PR only to existing authorized remote, never merge. Stop and request owner review.
