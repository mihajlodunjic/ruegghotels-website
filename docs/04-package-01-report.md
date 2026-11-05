# Package 01 implementation report

Prepared 2026-11-05. Scope: `codex/01-foundation-and-player.md` only. No deployment or merge. Package 02 has not started.

## Baseline and source verification

- Initial branch `main`, commit `66996b8` (`first commit`), synchronized with `origin/main` before branching.
- Authorized remote: `https://github.com/mihajlodunjic/ruegghotels-website.git`.
- Feature branch: `feat/ruegg-foundation-player`.
- README was tracked. The supplied AGENTS, docs, prompts, media directory and references were initially untracked. They were preserved; original videos/PNG are excluded from the commit.
- No app scaffold or dependencies existed. Environment: Windows PowerShell, Node 24.13.0, npm 11.6.2. FFmpeg/FFprobe 9.0.1 found in the local WinGet installation, copied into ignored `.tools/` for use. No source media was downloaded, replaced, regenerated or rewritten.
- FFprobe confirmed Master: 50,570,857 bytes, 1920×1080, H.264, 24 fps, 562 frames, 23.416667 s, no audio. V3: 36,168,419 bytes, 1920×1088, H.264, 125 source frames, 5.183333 s, VFR, no audio. B0: 3,345,690 bytes, 1665×944.
- Original SHA-256 values are stored in the manifest and were rechecked after conversion. `git check-ignore` confirms all three originals are excluded; `git ls-files media/source` is empty.

## Implemented behavior and decisions

- Strict TypeScript / React / Vite / React Router scaffold, modular CSS, shared keyboard-accessible native-dialog navigation, and truthful `/partners`, `/book`, `/our-story`, `/contact` skeletons plus 404. Booking query parameters choose the correct validated hotel, without a submit flow or fabricated inventory.
- `/` is the cinematic journey. A pure typed reducer guards all chapter transitions and interruptions. One imperative media controller owns playback, source switching, readiness, aborts, bounded seeks and stalled/error recovery.
- Native `requestVideoFrameCallback` monitoring plus timeupdate/seeked/ended guards. Reception candidate is exactly 10.000 s; fixed hallway is 17.125 s. Exact posters hide scheduling drift at chapter stops. Finale holds frame 561 at 23.375 s, never `duration`.
- B0 → original V3 forward → genuine B3 → optional information → separate reverse MP4 → B0/hallway decision. Returning never advances the master automatically. Direct hallway Continue bypasses the optional branch. Only master and one reusable branch video exist; never more than one plays.
- Stills remain underneath until the incoming video has a ready frame. Loading, rejected playback, failed media, seek timeout and stalled playback offer retry, still images and navigation. Abort/version ownership prevents stale tasks and play promises from disrupting a newer scene. Route return starts at the invitation without autoplay.
- Initial invitation, non-home routes, reduced-motion and Save-Data mode do not request MP4s. Reverse is not requested until Back to hallway. Static mode provides the same chapter/room/booking pathways. Source films have no audio, so no misleading sound toggle is shown.
- GSAP handles the brief editorial reveal only. It has no control over media state or time. Reduced motion disables reveals and video playback.
- Desktop invitation ~31.5% right, Welcome lower left, normalized right-door hotspot, optional 64/36 room split, finale 38% right preserving the communal table left. The media rectangle is itself exactly 16:9 using CSS containment, so source-relative hotspot coordinates scale with that same rectangle without viewport offsets or resize-listener drift. Mobile copy and controls sit outside the contained film.
- System Georgia is the temporary editorial serif; no font binaries were fetched. No Three.js, invented API, tracking, actual availability, partner identity, mailbox or telephone was added.

## Derived media outputs

Decimal MB. All MP4s: H.264 High level 4.1, yuv420p, constant 24 fps, no audio, faststart. See the complete [manifest](../public/media/manifest.v1.json).

| Output | Frames | Duration | Bytes | MB |
| --- | ---: | ---: | ---: | ---: |
| Master 1080p | 562 | 23.416667 s | 11,417,811 | 11.42 |
| Master 720p | 562 | 23.416667 s | 5,250,109 | 5.25 |
| V3 forward 1080p | 125 | 5.208333 s | 3,757,918 | 3.76 |
| V3 forward 720p | 125 | 5.208333 s | 1,749,917 | 1.75 |
| V3 reverse 1080p | 125 | 5.208333 s | 5,197,729 | 5.20 |
| V3 reverse 720p | 125 | 5.208333 s | 2,484,545 | 2.48 |

WebP posters: hero 292,418 bytes; reception 127,420; B0 hallway 260,198; B3 room 150,910; genuine finale 196,826. B0 was intentionally center-cropped to 16:9 without stretching.

The default FFmpeg fps filter would discard the last V3 source frame. `eof_action=pass` preserves it, with just 0.025 s added to the normalized duration. Its raw final-frame hash matched the cropped original final frame before encoding. Reverse CRF 22 was selected to keep both endpoints close to the forward frames; its desktop output is 0.20 MB above the approximate 5 MB target.

[Media QA](evidence/package-01/media-qa.json): reverse-first/B3 SSIM 0.989129 (1080p), 0.987574 (720p); reverse-last/forward-B0 0.975178 / 0.971120. The master/source average SSIM is 0.963828. These are measured encode comparisons, not a substitute for owner visual approval.

## Verification

| Command | Result |
| --- | --- |
| `npm run lint` | PASS, no warnings/errors |
| `npm run typecheck` | PASS, strict TypeScript |
| `npm test` | PASS, 29 tests in 2 files |
| `npm run build` | PASS, Vite production build |
| `npm run media:verify` | PASS, hashes/frame counts/codec/faststart and reverse endpoints |
| `npm run test:e2e` | PASS, 16/16 tests across four viewports (3.7 min); 4/4 core-flow captures refreshed after final spacing fixes; 4/4 accessibility/touch-target follow-ups passed |
| `npm audit` | 0 vulnerabilities after patched minimatch tooling override |

Unit coverage includes legal/illegal transitions, rapid repeated events, exact menu context, user pause, static branch progression, skip/replay, failures/retry, metadata cancellation, seek deadlines, frame callbacks and fallback timing, single branch reuse, rejected play, and stale play promise races.

Chromium tests use actual local MP4s at native speed; they assert exact 10 / 17.125 / 23.375 currentTime anchors, both branch choices, B3 information and reverse return, menu/pause/resume semantics, Replay, correct booking selection, route re-entry without autoplay, no initial/reduced-motion/non-home video downloads, deferred reverse request, no concurrent playback, keyboard focus and Escape, accessible static progression and axe checks. A first axe failure exposed a brand-label mismatch; it was fixed and rerun successfully.

## Screenshots and visual review

Six actual checkpoint captures per viewport: invitation, welcome, hallway, B3 before information, room information, finale. Captures wait for GSAP to finish before saving.

| Viewport | Invitation | Hallway | Finale |
| --- | --- | --- | --- |
| 1440×900 | [View](evidence/package-01/desktop-invitation.png) | [View](evidence/package-01/desktop-hallway.png) | [View](evidence/package-01/desktop-finale.png) |
| 1920×1080 | [View](evidence/package-01/full-hd-invitation.png) | [View](evidence/package-01/full-hd-hallway.png) | [View](evidence/package-01/full-hd-finale.png) |
| 390×844 | [View](evidence/package-01/mobile-invitation.png) | [View](evidence/package-01/mobile-hallway.png) | [View](evidence/package-01/mobile-finale.png) |
| 375×812 | [View](evidence/package-01/small-mobile-invitation.png) | [View](evidence/package-01/small-mobile-hallway.png) | [View](evidence/package-01/small-mobile-finale.png) |

Known directional deviations: Georgia instead of a final licensed editorial face; simplified chapter/footer navigation and button styling; desktop letterboxing at non-16:9 viewports preserves the whole source rather than cropping; the 16:9 B0 crop trims a few top/bottom pixels. These are functional foundation choices, not final Package 02 visual signoff.

## Files changed and delivery

- Application: `src/app`, `src/components`, `src/features/cinematic`, `src/data/hotels.ts`, `src/styles`, `src/main.tsx`.
- Tooling: package/lockfile, TypeScript, Vite, ESLint and Playwright configurations, `.gitignore`, `index.html`, favicon.
- Media: reproducible shell/Node build and verification scripts, six derived web MP4s, five WebPs and provenance/probe manifest. Local originals and binaries are ignored.
- Tests: reducer/controller unit suites, four-project browser suite, checkpoint screenshots and numerical media QA evidence. See the [complete changed-file list](evidence/package-01/changed-files.txt).
- Documentation: local-run instructions in README, this report; supplied AGENTS, prompts, specifications and mockups preserved and included as the implementation baseline.

Delivery is one coherent commit on `feat/ruegg-foundation-player`, pushed to the configured remote with a PR targeting `main`. The exact SHA and PR URL are returned in the delivery message. No merge or production deployment is authorized or performed.

## Limits and next action

No missing asset or Package 01 implementation blocker remains. Safari macOS, real iOS Safari, real Android, manual screen-reader behavior, constrained-network performance and Web Vitals have not been certified in this Windows Chromium run. No LCP/CLS/INP target is claimed. Live booking/contact endpoints, verified partners, final copy/font, domain and hosting remain intentionally unconfigured.

Owner: review the screenshots, reception frame at 10.000 s, and the local journey or PR. After review, Package 02 is the next recommended package for visual fidelity and responsive refinement. Stop here until that review.
