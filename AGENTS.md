# RÜEGG HOTELS — instructions for Codex

Read `README.md`, all `docs/*.md`, current package prompt in `codex/`, and mockups before modifying code.

## Non-negotiable product decisions

- Homepage `/` IS the cinematic experience: no separate `/experience`; no dedicated pages for the three hotels.
- Routes: `/`, `/partners`, `/book`, `/our-story`, `/contact` plus accessible 404 and legal/privacy if genuinely needed.
- Master camera path: exterior → reception → hallway → lounge → communal table, set within ONE imaginary brand hotel.
- Chapter stops: initial 0 s, APPROVED reception stop around 10.000 s (exact frame is subject to QA), FIXED hallway 17.125 s, final genuine last video frame ~23.375 s; separate Room V3 B3 at end.
- The 17.125s interactive room entry, B0 still, forward V3 → B3, reverse V3 → hallway, Continue main video behavior were previously tested and accepted. Do not change that flow.
- Approved hero is an ivory editorial invitation on the RIGHT (~32% desktop); Welcome content LOWER LEFT, B0 right-door hotspot, Room info 64/36 desktop split after optional activation, finale burgundy panel RIGHT (~38%) preserving the communal table LEFT; mobile keeps full 16:9 at critical pauses with controls outside video.
- No fake bookable rooms, pricing, confirmed partnerships or live booking confirmations. Do not identify generated reference spaces as actual hotel inventory.
- Preserve original video assets; transcode only derived web editions; no AI video generation.
- Videos are native HTMLVideoElement. GSAP only for UI transitions. Do not add Three.js unless a documented need is approved.
- All meaningful controls keyboard-accessible, focus visible, screen-reader labels, touch targets >=44 CSS px; reduced-motion alternative must work without video.

## Architecture and engineering

- React, TypeScript strict, Vite, React Router, CSS variables and modular CSS, GSAP where justified.
- Use a deterministic typed reducer/state-machine + media controller. Do not scatter booleans for all player modes or let animated components drive the canonical media state.
- Treat media events as async: `play()` can reject, seek may not complete instantly, switching media may stall. Fail gracefully to posters and controls, never black canvas.
- Avoid video decode memory waste: one playing video at a time, two video DOM elements maximum (master and branch), reusable still overlays, reverse delivered as a separate MP4.
- Use `requestVideoFrameCallback` when available to monitor frame time, backed by `timeupdate`/`seeking`/`seeked`/`ended`; never rely on timeupdate frequency alone for exact visual transitions.
- Keep local `media/source/` outside version control. Optimize web variants for deployment. Do not inline 49MB/35MB originals into JS bundles or commit them to git history.
- `src/data/` contains validated data and openly labelled demo examples. Do not make network calls to invented APIs.
- Add deterministic tests for state transitions and visual QA at mobile/desktop sizes.

## Workflow for every package

1. Inspect existing repository and report baseline, branch, changes, dependencies and media assets.
2. Implement only current package; avoid opportunistic unrelated refactors.
3. Run lint, typecheck, unit, build and relevant browser tests, and report exact command results.
4. Present updated screenshots and any known deviations from approved visual references.
5. Commit once per reviewed package, push feature branch only if an authorized remote exists, open PR when possible; STOP. **Do not merge** without user approval.
6. Return concise report: files changed, important decisions, tests, commit SHA/PR, blockers, and next package recommendation.
