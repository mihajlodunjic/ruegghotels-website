# Package 02 — Home visual excellence

2026-11-06. Based on accepted main `2fa84b33e5b357ba59417444fb20d34b1903d018`. Branch: `feat/ruegg-home-visual-excellence`. Homepage/shared brand styling only; no Package 03 implementation, deployment or merge.

- Replaced the dark navigation strip and rectangular BOOK button with the official seal, a light compact navigation treatment, and an editorial menu with staggered entrances, close animation and native dialog focus handling.
- Introduced self-hosted Cormorant Garamond normal/italic and DM Sans, licensed under OFL 1.1. Three WOFF2 assets total 113,832 bytes; licenses and provenance are in `public/fonts/`. No font service is contacted at runtime. [Cormorant upstream license](https://github.com/google/fonts/blob/main/ofl/cormorantgaramond/OFL.txt), [DM Sans upstream license](https://github.com/google/fonts/blob/main/ofl/dmsans/OFL.txt).
- Added warm paper/burgundy/olive tokens, controlled type scales, softer action shapes, fine detail and generous composition-specific spacing. Hero invitation remains ~32% right; Welcome remains open lower-left; hallway uses a discreet source-aligned door cue; B3 starts with a small information dock; expanded room is 64/36; finale is 38% right with full destination names and editorial hotel rows.
- GSAP now handles invitation withdrawal, staggered type, contextual entrances, FLIP room layout changes, a brief unobstructed B3 hold, a 0.95 s unobstructed finale hold, navigation and arrow microinteractions. Reduced-motion mode has no animated reveal or film. Animation contexts/listeners/tweens and outgoing inert copies are cleaned up.
- Returning from expanded room information first dispatches the existing Close Information event, completes the layout restoration, then executes the visitor's pending Back command. This is UI sequencing only: the reducer, controller, timing config and media-controller hook are unchanged. The focused browser check explicitly verifies B3 stays paused during panel closure before reverse begins.
- Mobile uses a compact light header, complete 16:9 source images, controls outside the image, readable type and viewport-balanced spacing. Active playback fits without a page scroll. Landscape uses a contained source rectangle sized to the available height. Short desktop panels can scroll independently.

## Official logo

`media/source/Bordo.png` (case-insensitive Windows match for the owner's `bordo.png`) is copied byte-for-byte to tracked `src/assets/ruegg-burgundy.png`. SHA-256 for both: `8fe49546af4c0a3abf44fefaf9881ff1e982211f9d91f871d6497a46a8b88f8a`. The 4000×4000 RGBA artwork, original colors, proportions and transparency are preserved. The same asset appears in navigation, invitation, menu and favicon. The provisional SVG favicon was removed. Vite emits one hashed production PNG.

## Verification

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS, all 29 existing reducer/controller tests.
- `npm run build`: PASS; local fonts and hashed official logo included.
- Focused Chromium: desktop/mobile core journey and error recovery passed; desktop/mobile static/accessibility and playing-menu pause/resume passed (4 tests). An obsolete case-sensitive Explore Room locator was updated for the approved action capitalization.
- Follow-up desktop smoke: PASS, with GSAP target warnings now treated as failures; animation cleanup skips empty target lists.
- Final core journey capture: PASS, 4/4 required viewports (2.0 min), including the expanded-panel-close → reverse sequencing assertion. 28 final checkpoint/menu screenshots.
- Additional responsive checks: 30 static chapter/layout checks at 320×700, 375×812, 390×844, 844×390, 720×450 and 1024×600. No horizontal overflow; 16:9 media geometry and 44px controls pass. [Recorded checks](evidence/package-02/responsive-qa.json).
- Active mobile/landscape playback: four checks confirm no page scroll at 390×844, 375×812, 844×390 and 720×450. [Recorded checks](evidence/package-02/active-mobile-qa.json).
- Original/derived video files, posters and media recipes are unchanged; no repeated transcodes or media validation were needed. No dependency or lockfile changes.

## Screenshot evidence

Captures wait for local fonts and GSAP completion. The core flow runs with real native MP4 playback at the original speed and checks 10.000 / 17.125 / 23.375 s, forward V3, B3, reverse, hallway return and booking selection.

| Viewport | Invitation | Welcome | Choice | B3 | Room info | Finale | Menu |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | [View](evidence/package-02/desktop-invitation.png) | [View](evidence/package-02/desktop-welcome.png) | [View](evidence/package-02/desktop-hallway.png) | [View](evidence/package-02/desktop-room-b3.png) | [View](evidence/package-02/desktop-room-info.png) | [View](evidence/package-02/desktop-finale.png) | [View](evidence/package-02/desktop-menu.png) |
| 1920×1080 | [View](evidence/package-02/full-hd-invitation.png) | [View](evidence/package-02/full-hd-welcome.png) | [View](evidence/package-02/full-hd-hallway.png) | [View](evidence/package-02/full-hd-room-b3.png) | [View](evidence/package-02/full-hd-room-info.png) | [View](evidence/package-02/full-hd-finale.png) | [View](evidence/package-02/full-hd-menu.png) |
| 390×844 | [View](evidence/package-02/mobile-invitation.png) | [View](evidence/package-02/mobile-welcome.png) | [View](evidence/package-02/mobile-hallway.png) | [View](evidence/package-02/mobile-room-b3.png) | [View](evidence/package-02/mobile-room-info.png) | [View](evidence/package-02/mobile-finale.png) | [View](evidence/package-02/mobile-menu.png) |
| 375×812 | [View](evidence/package-02/small-mobile-invitation.png) | [View](evidence/package-02/small-mobile-welcome.png) | [View](evidence/package-02/small-mobile-hallway.png) | [View](evidence/package-02/small-mobile-room-b3.png) | [View](evidence/package-02/small-mobile-room-info.png) | [View](evidence/package-02/small-mobile-finale.png) | [View](evidence/package-02/small-mobile-menu.png) |

## Review notes

No known blocking visual issue. Source composition is retained with warm matte letterboxing when the desktop viewport differs from 16:9. Narrow/short viewports may scroll paused editorial content; active mobile playback remains contained. Real iOS/Android/Safari and formal screen-reader certification remain later QA gates.

Changed implementation: `SiteHeader`, new `BrandSeal`, homepage presentation/CSS, new `useEditorialMotion`, shared tokens/fonts, document font preloads/favicon, and the focused browser test's screenshot/motion checks. Supporting pages remain skeletons. Run `npm ci` then `npm run dev` to review locally.

Commit SHA and PR URL are returned in the delivery message. Stop after Package 02 for the owner's visual review.
