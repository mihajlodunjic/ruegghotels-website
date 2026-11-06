# 01 — Complete technical blueprint

**Design status:** User approved composition direction and ten static mockups for next implementation reference. Not pixel-perfect final signoff. **Project type:** polished portfolio showcase with usable navigation, not live hospitality backend.

## A. Routes and page structure

- `/`: `CinematicHomePage`, full-height cinematic stage with five visible beats. No separate experience route.
- `/partners`: `PartnersPage` structured as editorial local ecosystem, with category and hotel/destination filters; unless verified, show clearly labelled illustrative partners/category examples, never assert active real commercial relationships.
- `/book`: `ReservationsPage` single hotel selection (Agnes Kandersteg CH, Spalloni Splügen CH, Johann Oberstdorf DE), travel dates, guests, stay/contact info. Demo mode must visibly say “Preview only — no request is sent” (or equivalent); no fake booking IDs, prices or success confirmations. When a real provider/endpoint is supplied, integrate separately.
- `/our-story`: family tradition, Anna/Markus/Lena narratives if sourced from brand strategy; avoid historically verifiable claims that have not been checked. Official promise and positioning slogan are permitted. No false archival AI imagery.
- `/contact`: useful contact channels and enquiry types; do not invent mailbox/telephone. Until endpoint/contact verified, avoid a fake submit flow; allow preview-only or known channel.
- 404 with route back to home, sitemap/robots, metadata, and route-level alt text.

Shared `SiteShell` with keyboard-accessible menu and Book route; homepage header changes contrast based on chapter and may be visually subdued while video plays.

## B. Cinematic media and chapters

Verified source: Master 23.416667s, 1920×1080, H.264 24 fps; Room Branch 5.183333s, 1920×1088, average 24.11576 fps and nominal 60/1 metadata. `B0 Reconstructed(1).png` 1665×944. Master file unoptimized ~50.57MB; Branch unoptimized ~36.17MB.

- Start in `INVITATION`: static exact intro poster, right ivory invitation (~32% desktop); user clicks Step Inside; reveal panel; start master playback from t=0 on user gesture.
- `MASTER_PLAYING_TO_WELCOME`: play until reception checkpoint approx 10.000s; freeze on QA-selected frame; show lower-left Welcome editorial with Continue and Our Story.
- `MASTER_PLAYING_TO_HALLWAY`: continue until exact media 17.125s (frame index 411 at 24fps); pause; reveal accepted B0 Reconstructed, synchronized door hotspot; options Explore Room or Continue to Table.
- `ROOM_ENTERING`: branch forward ~5.183s; end shows frame B3 held. `ROOM_AT_B3`: optional editorial info split, Back to Hallway, Explore Our Stays -> /book. Returning: close info panel, play separately derived reverse branch; at finish restore B0 and the hallway decision, then the user selects Continue. No auto-skip hallway choice.
- `MASTER_PLAYING_TO_FINALE`: main master resumes 17.125s toward end. Hold actual final decodable frame (do not seek past duration), then reveal burgundy finale on the RIGHT (~38%), leaving communal table left. List Agnes / Spalloni / Johann, each selects unified `/book?hotel=agnes|spalloni|schiebel`; Our Local Circle and Replay Journey.
- Opening global menu pauses current playback; close resumes only if it had been playing (not when user was in a pause). Route navigation may preserve a session-scoped chapter context, but must not autoplay when user returns without gesture.
- Skip experience leads directly to finale/static overview OR booking (two explicit choices). It must not force video downloads for alternate pages.

**No arbitrary new mandatory pause** besides reception, hallway and finale. Standard scroll controls content on other pages. On homepage allow mouse wheel 'advance' ONLY at paused beats as optional enhancement; explicit buttons must always work. Do not use scroll scrubbing or backward playing of the main master. Don't let wheel accidentally leave room states.

## C. Player state machine

Canonical discriminated union (illustrative types only; design requirement, not implementation code):

`INVITATION`, `MASTER_TO_WELCOME`, `WELCOME_PAUSED`, `MASTER_TO_HALLWAY`, `HALLWAY_PAUSED`, `ROOM_ENTERING`, `ROOM_AT_B3`, `ROOM_INFO_OPEN`, `ROOM_EXITING`, `MASTER_TO_FINALE`, `FINALE`, `USER_PAUSED`, `MENU_OPEN`, `MEDIA_ERROR`, `STATIC_FALLBACK`.

Track `resumeState`/`wasPlayingBeforeMenu`, `videoReady`, `reducedMotion`, `userHasInteracted`, `activeHotel`, `errorCode` explicitly. `USER_PAUSED`/`MENU_OPEN` overlays remember exact underlying state rather than losing branch/anchor. Avoid silent impossible transitions and race conditions.

Legal events: `START`, `WELCOME_REACHED`, `CONTINUE`, `HALLWAY_REACHED`, `ENTER_ROOM`, `ROOM_FINISHED`, `OPEN_ROOM_INFO`, `CLOSE_ROOM_INFO`, `BACK_TO_HALLWAY`, `REVERSE_FINISHED`, `MASTER_FINISHED`, `PAUSE`, `RESUME`, `OPEN_MENU`, `CLOSE_MENU`, `SKIP`, `REPLAY`, `PLAY_FAILED`, `MEDIA_STALLED`, `RETRY`, `ENTER_STATIC_MODE`. Unit test guards.

Use one `CinematicPlayerController` to own side effects: `play`, `pause`, `seek`, `switchSource`, `load`, `waitForReadyFrame`, abort/cancel stale tasks. On source transition keep a static poster/B0/B3 visible until confirmed ready frame; never hide the outgoing valid visual before the incoming one is ready.

## D. Components and directories

```text
src/
  app/                 App, router, app providers, error boundaries
  components/common/   BrandMark, NavMenu, EditorialPanel, CTA, Skip, LocaleToggle
  features/cinematic/
    CinematicHomePage.tsx
    CinematicStage.tsx
    useCinematicController.ts
    cinematicMachine.ts
    mediaController.ts
    chapterConfig.ts
    overlays/           Invitation, Welcome, Hallway, Room, TableFinale
    hotspot/            ResponsiveImageHotspot
    a11y/               StaticExperience, announcements
  pages/                Partners, Reservations, OurStory, Contact, NotFound
  content/              approvedBrandCopy, draftDisplayCopy, localizedCopy
  data/                 hotels, partners (verified/demonstration flag), reservationsDemo
  styles/               tokens.css, global.css, type.css, responsive.css
  lib/                  safeMediaPlay, browserCapabilities, routes, imageSpace
  tests/
public/
  posters/              hero, reception, hallway, room, finale in optimized formats
  media/                only derived optimized web variants
media/source/            NEVER COMMIT: unchanged originals
media/scripts/           documented reproducible FFmpeg commands
references/mockups/      approved directional PNG references
```

## E. Visual specifications (desktop relative to 1920×1080)

- Hero: invitation at x≈65–97%, y≈25–92%, ivory paper-like opaque surface, no heavy shadow. Preserve left mountains, left stone RÜEGG plaque, central doorway. Position exact boundaries against real first frame; adapt to shorter desktop viewports.
- Reception near 10s: compact editorial block lower-left x≈6–43%, y≈70–93%. Keep central portrait/book/chandelier, green chair and right reception counter. Copy 2 lines max plus two CTAs. If contrast poor, use a restrained opaque local surface, not glassmorphism.
- Hallway: no full-panel overlay. Right walnut door hotspot in **normalized source-image space**, SVG polygon or positioned DOM overlay recalculated from object-fit containment. Never put hotspot over left door or use viewport-fixed x/y. Bottom controls clear and focusable; do not occlude door handle.
- Room B3: whole room first. On explicit info action, contained B3 still/clip at ~64% and ivory panel at ~36%. Keep natural 16:9, don't stretch, preserve bed/window. `Back to Hallway` always available regardless of info panel state.
- Finale: reveal panel on right x≈62–100%, width ~38%, burgundy. Acknowledge possible cover of fireplace/right lounge, but not communal table in left half. Three selectable editorial rows, not generic cards. Link to `/book?hotel=...`.
- Typography: display a licensed editorial serif (GFS Didot only if suitable licensing/coverage, otherwise an approved equivalent), pragmatic readable sans for UI. Tokens from brand moodboard are **provisional**: burgundy #6A0F2B, olive #4A5034, warm brown #6B402B, ivory #F7F2E8, ember #C25A2E. Check real contrast on photographic overlays; no externally sourced font binaries in handoff.

## F. Mobile behavior (reference 390×844)

- Header with safe-area handling, 44+px tap targets; Book and Menu visible. Content below must avoid home indicator/safe areas.
- Static hero may use intentional crop and bottom editorial surface, but film itself should retain the full 16:9 composition on critical interactions.
- At width 390, contained 16:9 video is about 219px high; place contextual copy and large buttons below instead of placing long text over the video.
- On hallway do not rely solely on right-door hotspot: full frame plus Explore Room / Continue buttons. At B3 image above, editorial info below, Back immediately accessible. At finale table image above, burgundy three-hotel selector below; scroll content normally in the panel.
- Rotate/reflow and browser UI toolbars must not shift hotspots; use measured media content rectangle (`ResizeObserver`, `object-fit: contain` math). Honor `visualViewport` quirks without depending on custom layout JS when CSS safe areas suffice.

## G. Accessibility and errors

- Keyboard-only: skip to content, focus visible, Escape closes menus, Tab order predictable, every branch action available by button, no hover-only affordance.
- Screen reader: one logical page H1, labelled chapter and controls, polite announcements for state changes without narrating frames continuously, descriptions of imagery, no autoplay audio.
- `prefers-reduced-motion`: no auto-triggered video animations; accessible static chapter progression with meaningful links to partners/book/story/contact. Avoid meaningless wall of video controls.
- Support `saveData`/slow networks: posters and optional play; show clear load/retry/fallback; never black void.
- Handle `play()` rejection, waiting/stalled/error, seek timeouts, tab background, route changes, B0 mismatch, reverse playback initialization, back-forward navigation, multiple rapid clicks.

## H. Commercial/content constraints

- Confirmed names/places: Agnes — Kandersteg CH; Spalloni — Splügen CH; Johann — Oberstdorf DE. Main imaginary hotel is not any single bookable property.
- Partners page may use labelled demo categories/partner examples but no invented actual signed relationships or fabricated ratings/reviews.
- Reservations should use `Demo mode` flag until provider is integrated. It may implement date/guest/hotel choices, validation and a **non-submitting preview** of request. It must not collect and silently send personal information or display fake availability/payment confirmation. Use an explicit real backend/inbox only after details are supplied.
- Contact similarly requires a verified delivery endpoint; otherwise clear demonstrative state.
- Content currently English; DE/EN architecture possible; do not pretend translations are approved if absent.

## I. Delivery, SEO, privacy

- Vite SPA with client-side routing and host rewrite to `index.html` for deep links. Add semantic metadata and per-route titles/descriptions; static prerendering for non-cinematic pages can be a future improvement if SEO priority grows.
- Host on Render Static Site or another SPA-capable static host. Do not pick/claim a live domain/deployment without user confirmation. Configure caching: immutable hashed JS/CSS, cache versioned media, sensible posters. Need Range request support for efficient video seeking.
- No analytics, tracking scripts or cookie banners without purpose/consent. Create sensible privacy placeholder without invented legal text; review before publishing.
- Keep original media outside git; deploy only optimized derived formats. Hosting CDN/object storage optional after first functional version, not a prerequisite.

## J. Runtime/performance budgets (targets, not promises)

- Primary poster ideally <=250–350KB WebP/AVIF; meaningful first paint independent of media load.
- Initial master 1080p target roughly 10–15MB, mobile 720p roughly 4–7MB, subject to visual QA. Branch 1080p roughly 2–5MB; separate reverse similar. No quality sacrifice simply to hit arbitrary byte targets.
- Do not fetch reverse until room entry is likely/needed; load branch near hallway as bandwidth allows. Avoid simultaneous 3+ decoders.
- Targets on representative midrange mobile: LCP <=2.5s, CLS <=0.1, INP <=200ms where conditions make them meaningful, and reliably visible first frame/transitions. Measure rather than assert.

## K. Git and milestone plan

Use feature branch + PR workflow. If no remote exists, bootstrap locally and stop before publishing; do not assume a GitHub repo or account. Suggested packages:

- **01** foundation + media pipeline + first functional cinematic player and state machine, basic visual overlays; fundamental branch passes.
- **02** approved mockup visual fidelity, desktop/mobile geometry, editorial animations and nav.
- **03** Partners, Reservations, Our Story, Contact and shared content/data; demo-safe flows.
- **04** media performance, reliable pause/seek/switch/return, accessibility, reduced motion, broad automated tests.
- **05** cross-browser QA, fixes, release artifacts, deployment configuration and final handoff.

Each package is independently reviewable and does not auto-merge. Start immediately with `codex/01-foundation-and-player.md`, then inspect its report before sending the next prompt.
