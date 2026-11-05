# RÜEGG HOTELS — Codex implementation handoff v1.0

**Prepared:** 2026-11-05. **Status:** approved visual direction, NOT implemented. **Language:** UI copy currently English drafts; user communication Serbian Latin; Codex prompts English.

This package contains the complete implementation blueprint and staged Codex prompts. It includes the 10 accepted-for-design-reference static mockups, but **not the large original videos**. The videos should be copied locally into `media/source/` as instructed below, or downloaded as the separate original-media pack. Notion is the durable source for approvals; docs in this package are the Codex-ready technical baseline.

## Read order

1. `AGENTS.md` — implementation policy and constraints.
2. `docs/01-blueprint.md` — architecture, UX state specification, routing, content, deployment.
3. `docs/02-media.md` — verified source metadata, poster and transcoding requirements.
4. `docs/03-qa.md` — acceptance tests, responsive / browser matrix, performance.
5. `references/mockups/` — desktop + mobile approved directional UI references, **not pixel-perfect implementation mandates**.
6. `codex/01-foundation-and-player.md` through `codex/05-release-readiness.md` — implementation packages, in order.

## Source asset naming

Copy these existing originals to `media/source/` in the repo before running the media step:

- `RUEGG_Cinematic_Master_1080p(1).mp4` — cinematic master, original; put under alias `master-original.mp4` for the implementation workflow (preserve an unchanged archival copy).
- `hallway to room.mp4` — accepted Room Branch V3, original; alias `room-v3-original.mp4`.
- `B0 Reconstructed(1).png` — accepted B0 pause reference; alias `b0-reconstructed-original.png`.

These are *local source files*, **not** remote Notion attachments and not invented assets. A reverse branch source was not supplied in the current chat. Codex should derive a reverse MP4 from the accepted forward branch using FFmpeg; no Dreamina regenerations.

## Git policy

Inspect the actual repo before changing anything. If none exists, bootstrap a **local** repository, but DO NOT create a remote or push without an explicitly authorized URL/account. Once the remote is provided: sync main, feature branch, changes, tests, one coherent commit, push, PR, stop for owner approval. Never auto-merge, force-push, or work directly on main unless the user explicitly changes the policy.

## Open decisions (do not fabricate)

Booking provider/real availability, contact destination, actual local partner identities and contractual relationships, final full copy/translations, final licensed font, remote repository/hosting and domain. Build visually complete honest demos or present disabled/inquiry flows where required; never claim real bookings or partnerships without data.
# ruegghotels-website
