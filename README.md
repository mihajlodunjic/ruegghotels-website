## Package 01 — run locally

The cinematic foundation is implemented on the Package 01 feature branch. The homepage `/` is the experience. The other four routes are intentionally honest, accessible previews; no bookings or enquiries are submitted.

Requires Node **22.12+** (validated with Node 24.13.0) and npm. Derived web videos and posters are committed; FFmpeg is **not** needed to run the site.

```powershell
npm ci
npm run dev
```

Open the printed local URL, normally `http://127.0.0.1:5173/`. Start with **Step inside**; the film stops at reception (10.000 s), then at the hallway (17.125 s). Explore the right-hand room, open its optional information, return via reverse video, and choose Continue to the table. Skip to overview, booking, pause, menu and the still-image journey are also available. Reduced-motion and Save-Data preferences start the still-image journey without loading video.

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
```

Playwright uses actual H.264 playback at native speed. It captures six checkpoint screenshots at each configured desktop/mobile size in `docs/evidence/package-01/`. Its server starts automatically when port 5173 is free. HTML reports and failure traces stay ignored locally.

### Rebuild media only when originals or the encoding recipe change

Preserve the originals at the aliases below. They are ignored by Git. Install FFmpeg/FFprobe with H.264 and WebP support on `PATH`, or set `FFMPEG` and `FFPROBE` to full binary paths. This checkout also recognizes local ignored `.tools/ffmpeg.exe` and `.tools/ffprobe.exe`.

```powershell
npm run media:build
npm run media:verify
```

`media/scripts/build-media.sh` is the Git Bash/WSL/POSIX wrapper; the Node implementation also runs directly in PowerShell. The build records complete probes, byte counts and original/output SHA-256 hashes in `public/media/manifest.v1.json`. It never writes to `media/source/`. The optional `--branches-only` / `--reverse-only` script flags reuse unchanged upstream editions when tuning branch encodes. Verification checks hashes, frame counts, codec, faststart and reverse endpoints. Original files are needed for this optional verification command.

Master: 24 fps, H.264 High 4.1, CRF 28. Forward branch: center-crop 4 px at top/bottom, CRF 26. Reverse: encoded from normalized forward, CRF 22 with endpoint keyframes. `fps=24:eof_action=pass` retains the genuine final V3 source frame, giving 125 frames / 5.208333 s. Stills use exact frame indices; B0 uses the approved reconstruction, center-cropped without stretching.

`VITE_MEDIA_BASE_URL` can set a single external media origin/path at build time; its root must contain `media/` and `posters/`. By default all derived assets are served locally. A production SPA host needs an `index.html` fallback for deep links and byte-range support for MP4s. No host, domain, provider or analytics is configured in this package.

See [Package 01 implementation report](docs/04-package-01-report.md) and [media QA evidence](docs/evidence/package-01/media-qa.json). Package 02 requires owner review first.

---
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
