# CODEX 01 — Foundation, media and functional cinematic player

You are the implementation engineer for the RÜEGG HOTELS cinematic showcase website. All user-facing site content is English; the owner communicates in Serbian Latin. Work from **this local repository**, not a guessed GitHub repo. Before editing, read `AGENTS.md`, `README.md`, `docs/01-blueprint.md`, `docs/02-media.md`, `docs/03-qa.md`, and reference desktop/mobile PNG mockups.

## Objective

Deliver a locally playable first implementation with the approved real cinematic journey and existing Room Branch V3 logic, not a generic landing page. This package is a functional foundation, not final pixel-perfect polish.

## Non-negotiable input media

Look for originals in `media/source/`: `master-original.mp4` (from `RUEGG_Cinematic_Master_1080p(1).mp4`), `room-v3-original.mp4` (from `hallway to room.mp4`), `b0-reconstructed-original.png` (from `B0 Reconstructed(1).png`). If they are absent, DO NOT fabricate footage, download replacements or insert unrelated sample videos. Implement the rest with documented media placeholders, and make missing assets a conspicuous blocker in the report. Never rewrite original files.

## Baseline and Git

1. Inspect files, `git status`, branch, origin, Node/npm and available ffmpeg/ffprobe.
2. If repository is empty/not initialized, scaffold React + TypeScript + Vite, initialize git locally and document status. If it exists, preserve its structure and changes.
3. If a known remote is connected, sync main and create a feature branch `feat/ruegg-foundation-player`; otherwise use a local feature branch and DO NOT invent/create remote, push, PR or claim CI.
4. No direct main commits, force push, automatic merge, or production deployment.

## Work

A. Scaffold strict TS React, React Router and five declared routes `/`, `/partners`, `/book`, `/our-story`, `/contact`. Non-home pages can be accessible skeletal placeholders during this package, with realistic brand shell and links, not fabricated content.

B. Add `src/features/cinematic` central typed reducer/state machine with explicit states/events and pure tests. Implement `INVITATION -> MASTER_TO_WELCOME -> WELCOME_PAUSED -> MASTER_TO_HALLWAY -> HALLWAY_PAUSED -> (ROOM_ENTERING -> ROOM_AT_B3 -> ROOM_EXITING -> HALLWAY_PAUSED) OR MASTER_TO_FINALE -> FINALE`. Also handle user pause, menu, replay, skip, play failed and static fallback; avoid states drifting out of sync.

C. Implement a single visible stage with master video and one reusable branch video, posters/stills, an imperative media controller. Implement robust timing with `requestVideoFrameCallback` if supported, with fallbacks and bounded seek. Reception ~10.000s is a **candidate**, hallway 17.125s exact. Branch lasts ~5.18s; reverse MP4 returns to the hallway. Do not replace the accepted room-entry logic with a different method. On each video switch hold previous still until new frame is ready. Never black flash or double playback.

D. Add `media/scripts/build-media.sh` reproducible FFmpeg conversion if source media/ffmpeg exist, building Master/Branch at 1080 and 720, 24fps constant, branch crop 1920x1088 to 1920x1080 with QA, faststart, reverse from normalized forward MP4, and posters (start/reception/B0/B3/finale). Include ffprobe output in media manifest. Prefer H.264/MP4 widely compatible; quality-test output sizes rather than preserving 50MB source. Generate originals unchanged. `media/source/` gitignored. On Windows document Git Bash/WSL or PowerShell alternative.

E. Implement basic Hero invitation, Welcome, Hallway choices, B3 info entry, Table finale with correct CTAs and routes. These may be schematic but need to use real frames, not stock images. Set `?hotel=agnes|spalloni|schiebel` on finale links to `/book`.

F. Include basic `prefers-reduced-motion` static accessible experience and loading/error placeholders. All controls must be keyboard-accessible. No app analytics, real booking, or new Three.js.

G. Add lint, typecheck, build, Vitest reducer tests and basic Playwright smoke for the critical branch. Strict not just happy path.

## Acceptance

- Homepage initially displays original poster and right editorial invitation, does not force Master load before gesture.
- Step Inside plays to reception checkpoint and waits for Continue.
- Continue plays to 17.125s; clickable right door or Explore Room plays forward V3; B3 holds; Back to Hallway plays reverse and returns to B0; Continue goes to table; finale rows route to correct single booking page.
- Direct Continue at hallway skips optional room, completing main film. Replay works.
- No source media in tracked git; H.264 derived outputs available or documented missing original blocker.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` pass, or exact blockers and logs reported.
- Browser screenshot of invitation, hallway and finale on desktop/mobile if Playwright works in the environment.

## Deliver report

List baseline and final branch/SHA, media build outputs/durations/sizes, screenshots, test commands/results, known issues, changed files, remote/PR (only if real), and exact action needed from owner. Do not merge. Stop after package 01.
