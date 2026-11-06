# Package 03 — Complete hospitality pages

2026-11-06. Branch `feat/ruegg-functional-pages`, based on accepted main `060d0137e8e1826f05df51a01a594a7067cccae8`. Package 03 only; no merge, deployment, Package 04 or Package 05 work.

## Implemented experience

- **Our Local Circle `/partners`**: editorial mountain opening, nine curated example experiences, three destinations and four categories. Filters combine, persist in the query string and support browser Back. Each row expands useful detail and links to the appropriate stay/enquiry. Empty combinations offer a reset and a contact path. No named commercial provider or partnership claim is invented.
- **Reservations `/book`**: valid hotel query preselection, date range/clear/validation, adult/child controls, deterministic room offers, explicit selected state, desktop sticky summary, mobile single-column flow, optional example guest details, acknowledgement and a complete reservation preview. Starting another stay resets the flow. Invalid hotel identifiers leave an accessible choice rather than silently selecting a property.
- **Our Story `/our-story`**: family → welcome → mountains → belonging, the extra chair, an arched editorial table image, three hotel rows and a closing invitation. No historical dates, attributed quotations or invented biographies.
- **Contact `/contact`**: five enquiry categories, optional hotel preset, labelled fields, inline validation/focus, local review, clipboard action, edit and reset. If clipboard access fails, the prepared text is selected for manual copying. Completion accurately says the enquiry has not been delivered.
- **Shared shell**: adapted the existing header through an optional page variant; reused its native dialog/menu. Added a light shared footer, page-specific metadata, scoped GSAP entrances/section movement, reduced-motion handling and accessible 404. Existing official seal, self-hosted fonts, posters and warm palette are preserved. No new dependencies or generated imagery.

The latest owner prompt authorizes realistic mock room/rate/availability data and replaces earlier concept-only copy rules. Disclosures are contextual at results, checkout, final reservation status and enquiry review/copy. The homepage changes only two copy strings: the bedroom alt description and the former room disclaimer. Its controller, state machine, timing configuration, hooks, choreography, CSS, videos and posters are unchanged.

## Local simulation model

`src/data/hotels.ts`, `roomTypes.ts` and `experiences.ts` hold typed local data. Room/experience records explicitly carry illustrative provenance. `src/features/booking/bookingModel.ts` exposes a pure `BookingProvider` boundary and typed reducer; no network inventory, payment service or speculative endpoint exists.

| Hotel | Currency | Classic Double | Alpine Comfort | Mountain View |
| --- | --- | ---: | ---: | ---: |
| Agnes | CHF | 146 | 178 | 214 |
| Spalloni | CHF | 138 | 164 | 198 |
| Johann | EUR | 124 | 152 | 186 |

Amounts are sample nightly rates. Totals use integer cents × nights, with no modeled local taxes/fees. Rules: 1–21 nights within 365 days; one room; 1–4 adults, 0–2 children, total ≤4; category capacities 2/3/4; Mountain View minimum two nights. December 24–25 nights are closed in the sample calendar. Results are stable across renders.

Checkout does not require personal information or collect card details. Optional example details remain in transient component state and are cleared at completion. There is no browser storage or submission. The final reference is `DEMO-RG-000001` (incremented only for subsequent completions in the same mounted session), with **“No booking has been placed. No payment has been taken.”** The contact formatter/validator is separated in `src/lib/enquiry.ts`; no real recipient or transport is configured.

## Verification

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS, 50 tests across four files (29 accepted cinematic tests, 17 booking-model cases, four enquiry cases).
- `npm run build`: PASS; existing official PNG and local fonts included.
- Supporting Chromium: all **20 unique cases** pass at **1440×900, 1920×1080, 390×844 and 375×812**. Covered direct route loading, metadata, shared/mobile navigation, Back navigation, all three hotel URLs, unknown IDs, cleared/invalid dates, guests, capacity filtering, room selection, exact EUR 152 × 3 = EUR 456, checkout acknowledgement, final preview, restart, empty availability, guide filters/details/empty states, validation and real clipboard copying.
- Axe scans pass on the four supporting page layouts, selected room results and checkout. Page tests assert no runtime errors, no supporting-page MP4 requests and no horizontal overflow. Booking/contact tests assert no POST/PUT/PATCH/DELETE and no localStorage/sessionStorage entries.
- Initial audit findings (muted contrast and room-button visible/accessible-name mismatch) were fixed. A frozen browser clock interfered with GSAP's ticker in a test; the test now selects relative future dates without altering the runtime clock. Only affected cases were rerun: `npm run test:e2e -- tests/browser/pages.spec.ts --grep 'supporting pages|deterministic reservation'`, then `--grep 'deterministic reservation'`. The other 12 supporting cases had already passed.
- Homepage focused regression: `npm run test:e2e -- tests/browser/cinematic.spec.ts --project=desktop --project=mobile --grep 'approved master|skip, menu'`: PASS, four cases. Native-speed playback verifies **10.000 / 17.125 / 23.375 s**, V3 forward, B3, information closure before reverse, hallway return, finale-to-booking preselection and return. Reduced-motion/static traversal, keyboard/menu focus, route shell/404 and no-video requests also pass.
- No transcodes, source-media changes or dependency/lockfile changes. Original files remain ignored and outside Git history.

## Screenshot evidence

Full-page compositions and viewport crops are tracked in `docs/evidence/package-03/`. Captures wait for fonts and page/booking motion completion. Visual review covered each page at desktop/mobile and the reservation/contact progression.

| Viewport | Local Circle | Reservations | Our Story | Contact |
| --- | --- | --- | --- | --- |
| 1440×900 | [Full](evidence/package-03/desktop-partners.png) / [Fold](evidence/package-03/desktop-partners-fold.png) | [Full](evidence/package-03/desktop-book.png) / [Fold](evidence/package-03/desktop-book-fold.png) | [Full](evidence/package-03/desktop-story.png) / [Fold](evidence/package-03/desktop-story-fold.png) | [Full](evidence/package-03/desktop-contact.png) / [Fold](evidence/package-03/desktop-contact-fold.png) |
| 1920×1080 | [Full](evidence/package-03/full-hd-partners.png) / [Fold](evidence/package-03/full-hd-partners-fold.png) | [Full](evidence/package-03/full-hd-book.png) / [Fold](evidence/package-03/full-hd-book-fold.png) | [Full](evidence/package-03/full-hd-story.png) / [Fold](evidence/package-03/full-hd-story-fold.png) | [Full](evidence/package-03/full-hd-contact.png) / [Fold](evidence/package-03/full-hd-contact-fold.png) |
| 390×844 | [Full](evidence/package-03/mobile-partners.png) / [Fold](evidence/package-03/mobile-partners-fold.png) | [Full](evidence/package-03/mobile-book.png) / [Fold](evidence/package-03/mobile-book-fold.png) | [Full](evidence/package-03/mobile-story.png) / [Fold](evidence/package-03/mobile-story-fold.png) | [Full](evidence/package-03/mobile-contact.png) / [Fold](evidence/package-03/mobile-contact-fold.png) |
| 375×812 | [Full](evidence/package-03/small-mobile-partners.png) / [Fold](evidence/package-03/small-mobile-partners-fold.png) | [Full](evidence/package-03/small-mobile-book.png) / [Fold](evidence/package-03/small-mobile-book-fold.png) | [Full](evidence/package-03/small-mobile-story.png) / [Fold](evidence/package-03/small-mobile-story-fold.png) | [Full](evidence/package-03/small-mobile-contact.png) / [Fold](evidence/package-03/small-mobile-contact-fold.png) |

| Flow | Desktop | Mobile |
| --- | --- | --- |
| Room results/selection | [View](evidence/package-03/desktop-booking-rooms.png) | [View](evidence/package-03/mobile-booking-rooms.png) |
| Checkout | [View](evidence/package-03/desktop-booking-checkout.png) | [View](evidence/package-03/mobile-booking-checkout.png) |
| Complete preview | [View](evidence/package-03/desktop-booking-complete.png) | [View](evidence/package-03/mobile-booking-complete.png) |
| Enquiry review | [View](evidence/package-03/desktop-contact-review.png) | [View](evidence/package-03/mobile-contact-review.png) |
| Homepage room information | [View](evidence/package-03/home-desktop-room-info.png) | [View](evidence/package-03/home-mobile-room-info.png) |
| Homepage finale | [View](evidence/package-03/home-desktop-finale.png) | [View](evidence/package-03/home-mobile-finale.png) |

Additional booking/review screens exist at full-HD and small-mobile sizes; homepage evidence includes invitation, welcome, menu, hallway and B3 at desktop/mobile.

## Sources, scope and review notes

Read the local instructions/current package, technical/media/QA docs and Package 02 report; inspected the accepted homepage, mockups and available assets. Accessible Notion sources were consulted: [brand strategy](https://app.notion.com/p/40e01fbe876381a3b82ee10d7a584c65), [UX decisions](https://app.notion.com/p/40e01fbe8763815494b2c53d08b500c5), [technical blueprint](https://app.notion.com/p/40f01fbe876381a6865be73d962e65f7). They informed the caregiver-led tone and simple hospitality; no unsupported resort facilities or commercial partners were added.

Changed implementation: routing/metadata, header page variant, new supporting layout/footer, four page components and modular CSS, accessible 404, hotel/room/experience data, booking reducer/provider, enquiry validator/formatter and focused tests. README now documents the runnable app, sample model and static-host rewrite. Existing tokens/fonts/logo/media are reused.

No known blocking visual issue. Native date controls intentionally follow the browser/platform. Real-device Safari/iOS/Android checks and formal screen-reader certification were not performed in this package. Direct deep links pass locally; a Render Static Site must retain the documented `/*` → `/index.html` rewrite when deployed. No production host configuration was modified. Actual reservations, payments and delivered enquiries require future provider/recipient configuration and are outside this package.

Run `npm ci` then `npm run dev` for review. Commit SHA and PR URL are returned in the delivery message. Stop after Package 03 for owner review.
