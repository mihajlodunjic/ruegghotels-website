# Cinematic Back to Beginning

Base: `origin/main` at `e61395734e1b646adb0c56de50cde31635b6cc04`. Branch: `feat/cinematic-rewind`. No merge or deployment.

## Behavior

Back to Beginning (including its menu and finale Replay Journey entry points) now dismisses editorial overlays and rewinds from the current media position. Reception uses 10s, hallway 17.125s and finale the genuine 23.375s frame. Active playback and user pause use the actual paused media clock. Room entry, B3/information and partial room exit first use the existing reverse-room footage at the matching position, then continue directly into reversed Master from the hallway. No forward checkpoint events run during rewind.

`REWINDING` is an explicit reducer state. Repeated commands are ignored; completion/failure uses the existing safe REPLAY reset. Finish rewind, Escape, menu/navigation, backgrounding and reduced-motion changes cancel asynchronous media work. Reverse readiness, seeks, frame/event listeners, watchdogs and pending play promises are guarded by cancellation. Rewind load/play/stall failures restore the invitation safely. Step Inside always requires a new gesture; forward playback never resumes automatically.

The controller reuses the two existing video elements. Each incoming source is loaded and sought on the inactive element, while the outgoing decoded frame/still stays visible. Presentation switches only when an incoming frame is ready; the existing decoded/painted hero handoff closes the rewind. Room information layout closes with a short Flip transition. Mobile focal positions follow the corresponding forward-media position in reverse; forward framing/timings remain unchanged.

## Speed and loading

Desktop first attempts positive `playbackRate = 5` on the full reverse edition. Setter rejection, clamping or observed media-clock progress below 3.5× after 600ms switches to an encoded 5× edition at ordinary 1× playback, starting from the last displayed reverse position. Four seconds without progress aborts safely. Metadata/seeks remain bounded by the controller's 12s readiness limit.

Mobile proactively uses the encoded 5× edition, avoiding a dependency on high-rate hardware decoding and reducing the reverse payload. The fallback also uses an encoded 5× edition derived from the existing room-reverse video. Both short editions retain genuine first/last frames at 24 FPS; their final sampling interval is slightly nonuniform to preserve the endpoint. No negative playbackRate, JavaScript backwards seeking loop, extra video element or new dependency is used.

Master reverse media is requested only after the reset gesture. Initial MP4 requests remain zero, verified in browser tests. The JS bundle grew by approximately 4.6KB uncompressed / 1.4KB gzip from the original build; existing CSS is unchanged. All media remains separately served. The optional VITE_MEDIA_BASE_URL root must also contain the new files if used externally.

## Media and reproducibility

FFmpeg/FFprobe **7.1.5** were available in the cloud environment. The builder uses four encoding threads, H.264 High/yuv420p, unchanged 1920×1080 aspect ratio, 24 FPS, a 24-frame GOP and faststart. Full reverse uses CRF 22; short 5× editions use CRF 18. Only the tracked optimized Master and room-reverse are inputs. Original media, forward editions and existing manifests/posters remain unchanged.

Run from the repository root:

```sh
node media/scripts/build-rewind.mjs
node media/scripts/verify-rewind.mjs
```

Hashes, exact sizes and frame counts are in `public/media/rewind-manifest.v1.json`. Full Master reverse has 562 frames / 23.416667s, short Master has 113 frames / 4.708333s, short room reverse has 25 frames / 1.041667s. Payloads are approximately 21.3MB, 11.5MB and 2.4MB respectively (see manifest for exact bytes).

Verification checks source/output SHA-256, H.264 structure, dimensions, 24 FPS, frame counts and faststart. SSIM for all 562 reversed Master frames against the optimized source is **0.987013**. First/last fast-edition comparisons against normal reverse footage exceed **0.97**. [Media QA](evidence/rewind/media-qa.json).

## Validation

Node 24.22.1 / npm 11.9.0 / system Chromium 156.0.8078.79 on Linux. The normal Playwright browser download is blocked by network policy. Validation uses the ignored `.tools/playwright.cloud.config.ts` prepared during environment setup, which selects `/usr/bin/chromium`. This local override is not required by other environments with a normal Playwright Chromium installation.

```sh
npm run lint
npm run typecheck
npm test
npm run build
RUEGG_REWIND_EVIDENCE=.tools/rewind-evidence npm run test:e2e -- --config=.tools/playwright.cloud.config.ts tests/browser/rewind.spec.ts --project=desktop --project=mobile
RUEGG_EVIDENCE_ROOT=.tools/rewind-regression npm run test:e2e -- --config=.tools/playwright.cloud.config.ts tests/browser/cinematic.spec.ts --project=desktop --project=mobile --grep 'approved master|skip, menu|rejected play'
RUEGG_EVIDENCE_ROOT=.tools/supporting-regression npm run test:e2e -- --config=.tools/playwright.cloud.config.ts tests/browser/pages.spec.ts tests/browser/experiences-passport.spec.ts --project=desktop
```

Lint, typecheck, **102 unit tests**, production build and media verification passed. The focused rewind suite passed **16 desktop/mobile cases**; after the last room-layout and play-rejection refinements, the **four affected room/fallback cases** passed again. Original cinematic regression passed **six cases**. Supporting-page regression passed **ten cases**, including booking, Experiences, Passport and contact. No failed check remains unresolved. The focused suite covers all anchors, live/paused/menu position, room info/partial entry/partial exit, native-event fallback, unsupported/silently clamped rates, repeated clicks, explicit interruption, late events, reverse loading failure, route exit and reduced motion. Samples check that a decoded still or ready visible video is always present, no intermediate editorial state appears, no more than one video plays and exactly two video elements remain. These DOM/readiness samples and screenshots do not establish pixel-level absence of every compositor flash.

## Device and environment limits

Desktop 1440×900 and mobile 390×844 are Chromium emulation, not physical iOS Safari or Android devices. Native 5× behavior cannot be certified for those devices. The mobile encoded timeline avoids their high-rate limitations; physical device checks should still inspect decode smoothness, slow networking, orientation, background/return and every handoff. The existing reconstructed hallway still has small intrinsic differences from the movie; that approved asset is unchanged.

GitHub HTTPS Git access works. The GitHub API request needed for PR creation returned `Forbidden` under the current network policy. `api.github.com` was added to the environment configuration draft without changing existing presets; a saved draft does not apply runtime access. No new credentials were requested or copied. The PR operation must be retried after the relevant environment network change is applied. No production setting was changed.

## Captures and measured playback

[Desktop rewind from finale](evidence/rewind/desktop-finale-rewinding.png) · [Mobile rewind from hallway](evidence/rewind/mobile-hallway-rewinding.png) · [Desktop room exit](evidence/rewind/desktop-room-info-rewinding.png) · [Mobile room exit](evidence/rewind/mobile-room-info-rewinding.png).

[Browser readiness and rate summary](evidence/rewind/browser-summary.json) records each scenario's sampled layers, states, simultaneous playback and observed camera speed. Rates are calculated from visible media-clock progress, scaled for encoded editions, over rAF wall time. The finale measured approximately **4.96×** on both desktop (native rate) and mobile (encoded timeline). They exclude initial preparation and the invitation entrance, and are observations from cloud Chromium under automation rather than physical-device guarantees. No new visual composition is proposed; the rewind dismisses the approved editorial panels and preserves their underlying film framing.
