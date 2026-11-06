# Package 04 — cinematic mobile immersion and reliability

Prepared 2026-11-06. Base: accepted origin/main **d11c3eb9cb20393d510abfe304a1dd0783eda6b3**. Branch: **feat/ruegg-cinematic-mobile-reliability**. Scope: Package 04 and the owner's explicit video-to-static clarification. No merge, deployment or Package 05 work.

## Findings and changes

The former mobile layout placed a 16:9 picture beneath a separate header, with editorial content in document flow: approximately 219px of film height on a 390px phone. Home now uses a stable **100svh** stage and safe-area-aware overlay navigation/controls. This follows the latest owner direction, superseding the older mobile composition in AGENTS/blueprint. Supporting-page headers remain as approved.

Baseline native-playback traces reproduced two handoff problems:

- Completion assigned currentTime after pausing, starting another seek. Samples at Welcome, hallway and finale show seeking=true after the video was hidden.
- React changed the image URL and hid the video before the new DOM image decoded. Reverse-return/finale samples show zero image width with both videos hidden. A deliberately delayed reception image reproduced a sustained missing-layer interval.

The existing native controller retains the last valid paused video through resource preparation, decoding of the actual incoming DOM image and two paint opportunities. Two reusable image buffers preserve the outgoing still during preparation. Only then does presentation hide the video and release the checkpoint/editorial entrance. **No post-pause seek is issued.** On continuation, the poster remains until a valid decoded video frame is available; necessary anchor seeks occur underneath it. requestVideoFrameCallback remains primary, with native-event fallback and branch-last-frame completion if ended is absent.

Canonical anchors remain **10.000 / 17.125 / 23.375 seconds** and Room V3 forward → B3 → optional information → reverse → hallway is unchanged. Playback clocks can run slightly past an anchor before a callback arrives. Tests distinguish the clock, decoded frame and exact approved poster instead of forcing a visible corrective seek. No media, logo, font or dependency was replaced or regenerated.

## Mobile composition

| Moment | Decision |
| --- | --- |
| Invitation | Full-height exterior with entrance-focused crop; ivory editorial text/actions over the film; unchanged official seal on a small light backing. |
| Welcome | Portrait and open book remain above the lower editorial composition. |
| Hallway | Right-biased crop preserves the walnut door; normalized hotspot and explicit Explore Room control remain available. |
| B3 / information | Unobstructed hold, then optional dock and ivory information sheet. Landscape information reframes the still to retain both bed and mountain window, settling back before reverse. |
| Table | Full-scene hold, then compact upper burgundy panel on portrait phones, preserving the table foreground below. All hotels, Experiences, Passport, Local Circle and Replay remain keyboard/touch-scrollable. An arrow signals further choices. |

One aspect-correct source plane contains video, stills and door hotspot. A small typed focal configuration follows the existing film without changing scale, playback speed or camera footage. CSS owns geometry; decoded-frame callbacks only update the focal variable. Desktop retains the full frame, 64/36 information layout and 38% right finale. Overflow is contained within Home; body-wide scroll locking was removed. Panels and the native menu retain their own scrolling.

## Restart and loading

**Back to Beginning** is available after the opening invitation, including Master, forward/reverse, B3, information/closing, user pause, recovery, static chapters and menu. It shares REPLAY with finale Replay Journey: pause immediately, abort readiness/seek/image work, clear GSAP exits/deferred reverse, close overlays, clear chapter/readiness/hotel state, restore hero and focus Step Inside. A new gesture is required to play. Repeated resets and late callbacks cannot restart playback; the static preference is retained.

Initial loading requests only the hero poster and no MP4. Explicit playback prepares the next checkpoint; forward may warm on approach to the hallway, reverse only once B3 is visible. Save-Data/2G hints suppress speculative warming, without requiring navigator.connection. There are still only two video elements and at most one playing. Bounded waits, retry, still-image recovery and navigation remain available. Longer waits show a notice after 650ms; brief handoffs do not flash loading UI.

## Transition evidence

[Before recording](evidence/package-04/before-mobile.webm) · [After native-speed recording](evidence/package-04/after-mobile-journey.webm) · [Readiness/timing summary](evidence/package-04/transition-summary.json).

| Run | Distinct readiness samples | Checkpoint samples without decoded image or ready visible video |
| --- | ---: | ---: |
| Before 390×844 | 837 | 3 |
| Before 1440×900 | 839 | 4 |
| After 390×844 | 1263 | 0 |
| After 1440×900 | 1285 | 0 |
| After 844×390 | See summary | 0 |

Measured image-preparation/paint holds were **41–83ms**, with paused video retained throughout. The injected reception delay also retains it: [mobile](evidence/package-04/mobile-delayed-still-held-video.png), [desktop](evidence/package-04/desktop-delayed-still-held-video.png). Tests assert no playback-clock change during that handoff.

These are rAF DOM/readiness samples supported by viewport captures and recordings, **not pixel-level black-frame detection or display timing**. Baseline listeners attached before React created the videos; baseline evidence uses sampled seeking properties, not event counts. After traces include native events and decoded frame times.

B0 comparison: [held video](evidence/package-04/mobile-b0-video.png), [180ms dissolve midpoint](evidence/package-04/mobile-b0-dissolve-midpoint.png), [direct still](evidence/package-04/mobile-b0-direct.png). Blending visibly doubles architectural/handle edges, so the proposed default is a **direct handoff**. Comparison styling is diagnostic only. The reconstructed B0 and compressed footage retain small intrinsic texture/perspective differences; unchanged approved assets are not pixel-identical. No long fade conceals that limitation.

## Viewport screenshots

Captures show the actual viewport. The [matrix](evidence/package-04/viewport-matrix.json) checks all eight sizes for stage height, no horizontal/page overflow and reachability of every finale action. Portrait finale links require panel scrolling, without page scrolling.

| Viewport | Representative captures |
| --- | --- |
| 320×700 | [Invitation](evidence/package-04/320x700-invitation.png), [Welcome](evidence/package-04/320x700-welcome.png), [Hallway](evidence/package-04/320x700-hallway.png), [finale links](evidence/package-04/320x700-finale-links.png) |
| 375×812 | [Invitation](evidence/package-04/small-mobile-home-invitation.png), [B3](evidence/package-04/small-mobile-home-room-b3.png), [finale](evidence/package-04/small-mobile-home-finale.png) |
| 390×844 | [Before](evidence/package-04/before-mobile-invitation.png), [after](evidence/package-04/after-mobile-invitation.png), [active Master](evidence/package-04/mobile-active-master.png), [Welcome](evidence/package-04/after-mobile-welcome.png), [Hallway](evidence/package-04/after-mobile-hallway.png), [entry](evidence/package-04/mobile-room-entry.png), [B3](evidence/package-04/after-mobile-b3.png), [information](evidence/package-04/after-mobile-room-info.png), [finale](evidence/package-04/after-mobile-finale.png), [links](evidence/package-04/after-mobile-finale-links.png), [menu](evidence/package-04/mobile-menu.png), [reset](evidence/package-04/mobile-reset.png) |
| 430×932 | [Invitation](evidence/package-04/430x932-invitation.png), [finale links](evidence/package-04/430x932-finale-links.png) |
| 844×390 | [Invitation](evidence/package-04/after-landscape-invitation.png), [information](evidence/package-04/after-landscape-room-info.png), [return](evidence/package-04/after-landscape-return.png), [finale](evidence/package-04/after-landscape-finale.png) |
| 1024×600 | [Invitation](evidence/package-04/1024x600-invitation.png), [information](evidence/package-04/1024x600-room-info.png), [links](evidence/package-04/1024x600-finale-links.png) |
| 1440×900 | [Before](evidence/package-04/before-desktop-invitation.png), [after](evidence/package-04/after-desktop-invitation.png), [information](evidence/package-04/after-desktop-room-info.png), [finale](evidence/package-04/after-desktop-finale.png) |
| 1920×1080 | [Invitation](evidence/package-04/1920x1080-invitation.png), [finale](evidence/package-04/1920x1080-finale.png) |

## Checks and exact commands

Windows, Node 24.13.0 / npm 11.6.2, installed Chromium, actual local H.264 playback.

| Command | Final result |
| --- | --- |
| npm run lint | PASS, no warnings/errors |
| npm run typecheck | PASS |
| npm test | PASS, 83 tests / 7 files |
| npm run build | PASS, 69 modules; JS 494.33KB / 156.70KB gzip, CSS 95.01KB / 17.55KB gzip |

Focused browser commands:

```powershell
npm run test:e2e -- tests/browser/cinematic.spec.ts --project=desktop --project=mobile --grep 'approved master|skip, menu|rejected play'
npm run test:e2e -- tests/browser/cinematic.spec.ts --project=desktop --project=small-mobile --grep 'approved master|menu resumes'
npm run test:e2e -- tests/browser/cinematic-reliability.spec.ts --project=desktop --project=mobile
npm run test:e2e -- tests/browser/cinematic-reliability.spec.ts --project=desktop --project=mobile --grep 'reset and navigation|native-event fallback'
npm run test:e2e -- tests/browser/cinematic-reliability.spec.ts --project=desktop --grep 'reset and navigation'
$env:RUEGG_EVIDENCE_ROOT='.tools/supporting-regression04'
npm run test:e2e -- tests/browser/pages.spec.ts tests/browser/experiences-passport.spec.ts --project=desktop
```

Final coverage across those commands and focused reruns: **9 cinematic project/test combinations, 9 reliability combinations (one intentional duplicate-matrix skip), 10 supporting-feature tests passed.** Initial runs exposed obsolete seek/presentation expectations, a too-tight clock assertion, scroll-lock cleanup and a test attempting to reset an already-reset static invitation. Those were corrected. One desktop back-navigation retry passed when rerun without concurrent Vite source edits. No failing scenario remains unresolved.

Coverage includes native Master/forward/reverse/finale, both hallway choices, information/closing, Pause/Resume, menu restoration, reset during Master/forward/reverse/closing/loading/menu, repeated resets, late events, pending-seek cancellation (unit), rejected play, event fallback, orientation without source replacement, reduced-motion changes, route exit/back/forward, axe, focus/Escape and ≥44px controls. Supporting tests cover hotel preselection/booking completion, contact, filters, experiences/pricing and Passport persistence/unlock/blocked storage. Separate native-speed captures cover all five handoffs at 390×844, 844×390 and 1440×900.

## Performance

[Raw measurements](evidence/package-04/performance.json): production preview at localhost:4173, 390×844, cold cache, two single runs. Concurrent desktop automation and emulation are not real-device field data.

| Condition | LCP | CLS contribution without recent input | Start action → ready video | Largest observed Event Timing duration |
| --- | ---: | ---: | ---: | ---: |
| No throttle | 1.356s | 0 | 474ms | 72ms |
| 1.6Mbps down / 750Kbps up, 150ms latency, CPU 4× | 6.808s | 0 | 2549ms | 544ms |

The throttled sample **misses the 2.5s LCP goal**. Event duration is a diagnostic, **not INP**; the 200ms responsiveness goal is not certified. No Lighthouse or field Core Web Vitals pass is claimed. Initial transfers were approximately **1.125MB**, including unchanged 544KB official PNG and 292KB hero; the preview compressed JS/CSS. No initial MP4 was requested. Removing four eager poster requests avoids approximately **735KB** of initial poster payload. Phone media remains the existing 720p edition.

Baseline JS was 487.60KB / 154.41KB gzip, CSS 89.34KB / 16.58KB gzip. No dependencies were added. Image resources are bounded to current/likely-next cache entries plus two DOM buffers. GPU/bitmap memory was not profiled; no numerical memory improvement is claimed.

## Files, limitations and owner checks

Implementation: Home TSX/CSS, media controller, new stillFrames/mobileFraming, controller/motion hooks, shared chapter descriptions, the reducer's global REPLAY guard and the header's Home variant/menu restart. Tests: controller/reducer/image-buffer units, cinematic assertions, focused reliability/matrix suite and optional evidence-output roots in supporting suites. Documentation: README, this report and Package 04 evidence. No supporting product page or commercial data changed. Original source videos remain ignored and outside Git history.

**NOT VERIFIED on physical devices:** iOS Safari, Android Chrome, browser toolbar/safe-area changes, OS background/foreground behavior, refresh-rate differences, GPU memory and screen-reader operation. Owner checklist on both platforms:

1. Run Invitation → Welcome → door → B3 → information → reverse → table; inspect every handoff for flashes/alignment.
2. Rotate during playback/information and expand/collapse browser chrome; check subjects, header and reset.
3. Background/return, Pause/Resume and menu; confirm no unintended resume.
4. Reset during forward/reverse/loading and repeatedly; require a fresh Step Inside gesture.
5. Touch-scroll all finale links; test slow/failed networking and reduced motion.

Package 05 recommendation only: physical-device signoff, production cache/compression/range-delivery measurements and focused payload/interaction optimization against the measured throttled limits. No Package 05 implementation or deployment has begun. Review the PR and visual evidence before proceeding.
