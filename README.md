# RÜEGG HOTELS

A cinematic boutique hospitality website built with React, strict TypeScript, Vite, React Router and GSAP. Packages 01–02 established the homepage; Package 03 completes `/partners`, `/book`, `/our-story` and `/contact`; Package 03.5 adds `/experiences` and `/passport`. Package 04 makes the mobile Home immersive and hardens decoded still/video handoffs and restart behavior.

## Run locally

Requires Node **22.12+** and npm (validated with Node 24.13.0 / npm 11.6.2). Derived web media, the official logo and licensed fonts are tracked; original source videos and FFmpeg are not needed to run the site.

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/`. **Step inside** starts the native video journey: reception at **10.000 s**, hallway at **17.125 s**, Room V3 forward → B3 → reverse → hallway, then the genuine final Master frame at **23.375 s**. Reduced motion and Save-Data start a complete still-image alternative. **Back to Beginning** returns to the invitation from playback, pauses, room information, recovery and the menu, without autoplay.

On phones the shared 16:9 source plane covers the usable viewport, with chapter-aware framing shared by both media layers and the door hotspot. Desktop retains its full-frame compositions. Checkpoint stills remain the editorial pause mechanism: the outgoing video is held until the replacement image is decoded and painted; playback is revealed only after a valid video frame arrives.

## Explore the website

- `/partners`: nine curated example experiences; combine destination and category filters, expand details, or follow hotel-specific booking/contact links. Filter state survives browser navigation.
- `/book?hotel=agnes` (also `spalloni`, `schiebel`): choose dates and guests, select a room, review the sample total, optionally use example guest details, acknowledge the simulation and complete the reservation preview. The final reference has a `DEMO-RG-` prefix. Start another stay without refreshing.
- `/experiences?hotel=agnes`: a four-step personal planner for destination/date, interests, party/pace/duration and finishing preferences. Choose a seasonal recommendation, review its itinerary and sample group price, then complete a local `DEMO-EXP-` request preview. Copy the itinerary, edit or start again. Booking completion imports validated, non-personal stay context.
- `/passport`: manually collect a demo stamp for each home. Three stamps unlock **The Three Alpine Chapters**, an interactive itinerary collection with planning links and a copy action. Booking previews never award stamps. The only persisted data is `{ version: 1, stamps: [...] }` under `ruegg-passport-demo-v1`; reset is visible and blocked storage degrades to the current visit.
- `/our-story`: a warm family-hospitality narrative, the extra chair and three destinations, with booking links.
- `/contact`: validate an enquiry, review it locally, copy the formatted message, edit or start again. No recipient/backend is configured; the review and copy status explicitly say it has not been delivered.

### Reservation simulation

The owner-authorized sample model lives in `src/data/roomTypes.ts` and the pure `BookingProvider` adapter in `src/features/booking/bookingModel.ts`. It never calls external inventory or payment APIs. Rates use integer cents; stay total is nightly rate × nights, with no invented local taxes or fees.

| Hotel | Currency | Classic Double | Alpine Comfort | Mountain View |
| --- | --- | ---: | ---: | ---: |
| Agnes · Kandersteg | CHF | 146 | 178 | 214 |
| Spalloni · Splügen | CHF | 138 | 164 | 198 |
| Johann · Oberstdorf | EUR | 124 | 152 | 186 |

Sample rules: one room, 1–4 adults, 0–2 children, at most 4 guests; room capacities 2/3/4; 1–21 nights within the next 365 days; Mountain View minimum 2 nights. Nights of December 24–25 are unavailable, providing a deterministic empty-result path. These are demonstration rules and prices, not live property information. Results, checkout and the final status carry contextual disclosures. No cards, payments, personal-data transmission or browser persistence are implemented. Optional checkout details are cleared when the preview completes.

Both new features are linked directly from the cinematic Table finale, as restrained editorial actions below the three-hotel selector, and from the shared menu/footer. Local Circle details link to a relevant personalized plan. No planning requests are sent, and no real loyalty benefit is claimed.

## Checks and visual evidence

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e -- tests/browser/experiences-passport.spec.ts --project=desktop --project=mobile
npm run test:e2e -- tests/browser/pages.spec.ts
npm run test:e2e -- tests/browser/cinematic.spec.ts --project=desktop --project=mobile
npm run test:e2e -- tests/browser/cinematic-reliability.spec.ts --project=desktop --project=mobile
npm run preview
```

Playwright starts its own server when port 5173 is free. It uses Chromium and real native H.264 playback. Supporting-page tests cover 1440×900, 1920×1080, 390×844 and 375×812, including navigation, accessibility scans, filters, reservation completion and local enquiry copying. Evidence is in `docs/evidence/package-03/`; ignored HTML reports/traces are local only. Package 04 evidence is in `docs/evidence/package-04/`. Set `RUEGG_EVIDENCE_ROOT` to an ignored directory when re-running supporting-page captures without replacing historical evidence.

See [Package 04 report, viewport screenshots and transition recordings](docs/08-package-04-report.md), [Package 03.5 report and focused screenshots](docs/07-package-03-5-report.md), [Package 03 report](docs/06-package-03-report.md), [Package 02 report](docs/05-package-02-report.md), and [Package 01 report](docs/04-package-01-report.md). The reports record scope and review boundaries; later packages and production deployment require separate approval.

## Static hosting and deep links

`npm run build` produces `dist/`. A Render Static Site must publish that directory and configure the rewrite **`/*` → `/index.html` (Rewrite, not Redirect)** after any explicit asset rules. This serves direct requests to `/partners`, `/book?hotel=agnes`, `/our-story`, `/contact`, `/experiences` and `/passport` through React Router while existing assets remain static. MP4 delivery must support byte ranges. No production deployment or hosting account changes are performed by this package.

`VITE_MEDIA_BASE_URL` optionally sets an external media root at build time; it must contain `media/` and `posters/`. Local derived assets are the default. Fonts are self-hosted under OFL 1.1; their provenance and licenses are in `public/fonts/`.

## Original media (optional rebuild)

Preserve the originals in ignored `media/source/`: `master-original.mp4`, `room-v3-original.mp4`, `b0-reconstructed-original.png` and `Bordo.png`. Never add source videos to Git. The exact official seal is already tracked at `src/assets/ruegg-burgundy.png`.

Only rebuild when source media or encoding recipes change. FFmpeg/FFprobe must be on PATH, set through `FFMPEG` / `FFPROBE`, or present in ignored `.tools/`.

```powershell
npm run media:build
npm run media:verify
```

The scripts preserve originals and record hashes/probes in `public/media/manifest.v1.json`. See `docs/02-media.md` for source metadata and the accepted normalization/reverse recipe. Packages 03, 03.5 and 04 do not change videos, posters, recipes or cinematic timing.

## Working policy

Read `AGENTS.md`, `docs/*.md`, the current `codex/` package prompt and reference mockups before changes. The latest owner prompt supersedes older concept-only content rules and authorizes the local simulation above. Work from accepted main on a focused feature branch, run checks, capture evidence, commit/push and open a PR. Never force-push, merge or deploy without authorization.
