# Package 03.5 — Personal Alpine Experiences & RÜEGG Passport

2026-11-06. Accepted main `e1a6a5f98e416159bbef7f8a629a20b5bc9e5bdc`; branch `feat/ruegg-experiences-passport`. Scope follows the owner's attached Package 03.5 brief and mandatory homepage integration update. No Package 04, deployment or merge.

## Delivered

- **`/experiences` — Your Mountains, Your Way.** An editorial landing and four-step consultation: hotel/activity date/optional stay, seven interests mapped to the existing four categories, adults/children/pace/duration/comfort considerations, then guidance/language/start/transport/budget/special interests. A visible preference summary follows the visitor. Results explain matches and alternatives; choosing one assembles a distinct itinerary, preparation notes and itemized sample quote. Visitors can edit, switch recommendation, copy, complete a `DEMO-EXP-000001` request preview or start again. Final status explicitly says nothing was sent, reserved or paid. No contact details or payment fields are required.
- **`/passport` — Three Alpine Homes. One Story.** A paper-book composition with three distinct typographic destination imprints, progress, explicit “Collect demo stamp” controls, persistence/reset and remaining destinations derived from valid state. At 3/3, **A Seat at Every Table** opens **The Three Alpine Chapters**: three seasonal experience suggestions, usable hotel-specific planning links and a copyable collection. It promises no real discounts, stays or tours.
- **Mandatory homepage integration.** The Table now includes **Design Your Alpine Experience → `/experiences`** and **Discover RÜEGG Passport → `/passport`** as serif editorial links. All three hotel choices remain primary. Local Circle and Replay remain accessible in a smaller secondary row. Spacing is refined within the same 38% burgundy desktop panel; the table image and mobile 16:9 composition are preserved. The existing reveal wrapper is reused; cinematic timing, controller, reducer, hooks, choreography and media are unchanged.
- **Connected site.** Both routes have metadata and appear in the existing menu/footer. The native dialog has active-route styling, scroll containment and a sticky close/logo row. Booking completion passes only hotel, arrival, departure, adults and children to the planner. Local Circle keeps its filters/layout/booking links and adds personalized planning paths. Planner, Passport and booking link back to one another.

The exact official seal, fonts, tokens and atmospheric posters are reused. No alternative logos, AI media, new dependencies, original source files or FFmpeg changes.

## Deterministic planning rules

The same nine `src/data/experiences.ts` records now have typed planning metadata: interests, seasons, pace, durations, family suitability, activity style, base sample prices, preparation and distinct itinerary stops. The original editorial catalogue is preserved.

`experiencePlanner.ts` validates URL context and configuration. Invalid hotel/guest/date/interest values, including prototype-property category names, are ignored safely. Imported activity dates fall inside a valid stay and before departure; all dates remain editable. Sample constraints: dates through 365 days, optional stay up to 21 nights, 1–8 adults, 0–4 children, total ≤10. Full-day plans begin in the morning. Special interests stay in transient component state.

Destination and suitable season are hard recommendation constraints. Gentle/mobility or relaxed preferences exclude more demanding outlines; family suitability is applied for children. Ranking adds 24 per matching interest, 16 for pace, 12 for duration, 8 for family fit, 10 for matching transport and 10 for staying within budget. A transport mismatch subtracts 12, over-budget subtracts 20. Stable ID ordering breaks ties. At most three results appear; mismatched duration, pace, interest, transport or budget is explained. A seasonal alternative is not represented as an exact match or live availability.

Sample quote = adult rate × adults + half adult rate × children + optional guided group fee, in integer cents. Duration factors are 1 / 1.5 / 2.5 for short / half / full; illustrative adult bases vary by experience. German sample amounts use an internal 85% factor and EUR; Swiss amounts use CHF. This is a local sample-price model, not an FX rate. Guided group fees are 80 / 120 / 180 in CHF (the same German factor applies). Example: half-day Agnes walking outline, 2 adults + 1 child, guided preference = **CHF 36 × 2 + CHF 18 + CHF 120 = CHF 210**. No statutory taxes are invented; food/equipment/transport arrangements are separate and unconfirmed.

Itineraries use experience-specific stops, the selected morning/afternoon start and actual offered duration. Family/rest and photography choices add relevant pauses. Preparation covers local access/conditions and explicitly avoids guaranteed safety, accessibility, guide assignments or transport. The pure typed reducer guards progression, stale selections and duplicate completion. Clipboard denial exposes a selected, readable text fallback.

## Passport persistence and privacy

`passportModel.ts` accepts only schema version 1 and the three known hotel IDs. Malformed JSON, unknown IDs, invalid versions/oversized arrays or unexpected fields are rejected; duplicates are removed. Only `{ "version": 1, "stamps": [...] }` is saved under **`ruegg-passport-demo-v1`**, after a deliberate collect/reset action. No names, emails, messages, payment details, booking IDs or preferences are persisted. Missing/denied storage retains an interactive passport for the current visit. Reset returns to 0/3 and locks the collection. A booking preview never grants a stamp. Real stay verification and commercial loyalty benefits are outside this package.

## Validation

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS, **67 tests / six files**, including 12 planning and five Passport cases alongside the 50 accepted tests.
- `npm run build`: PASS, 67 modules; JS 487.60 kB (154.41 kB gzip), CSS 89.34 kB (16.58 kB gzip); official PNG unchanged. No lockfile/dependency changes.
- `npm run test:e2e -- tests/browser/experiences-passport.spec.ts --project=desktop --project=mobile`: eight cases passed initially; two navigation cases exposed a test assumption about Back restoring the invitation. Chromium correctly restored the paused static finale. The test now accepts that safe state, with no player change.
- Focused rerun `--grep 'new routes, navigation'`: **4/4 PASS** at 1440×900, 1920×1080, 390×844 and 375×812, including new menu/footer links, active state, keyboard/scroll/Escape, both finale actions, three hotels, Local Circle, Replay, contained desktop panel and no overflow.
- Additional `--project=full-hd --project=small-mobile --grep 'experience planning imports|passport collects'`: **4/4 PASS**. Complete planner and Passport flows now pass at all four target sizes. Total: **16 unique new-feature browser cases**.
- Axe checks pass for the planner landing/results/itinerary, Passport empty/complete reward and static finale. Flow checks cover malformed queries, imported stay/party, invalid date, personalized stops, exact quote, acknowledgement, reference, copy/fallback, restart, storage validation/persistence/denial/reset and booking-to-planner/Local-Circle-to-planner/Passport-to-booking. They confirm no request writes or personal browser storage in the planner.
- `npm run test:e2e -- tests/browser/cinematic.spec.ts --project=desktop --project=mobile --grep 'approved master'`: **2/2 PASS**, native playback at **10.000 / 17.125 / 23.375 s**, forward V3 → B3 → information → closure → reverse → hallway → finale → hotel booking, with both new finale links visible.

## Focused evidence

Screenshots wait for fonts and scoped animations. Sixteen feature captures cover the requested states on desktop/mobile; four finales cover the target viewport matrix. Two menu captures show the expanded navigation. Draft visual iterations remain ignored locally.

| State | Desktop 1440×900 | Mobile 390×844 |
| --- | --- | --- |
| Experiences landing | [View](evidence/package-03-5/desktop-experiences-landing.png) | [View](evidence/package-03-5/mobile-experiences-landing.png) |
| Configurator | [View](evidence/package-03-5/desktop-experience-configurator.png) | [View](evidence/package-03-5/mobile-experience-configurator.png) |
| Recommendations | [View](evidence/package-03-5/desktop-experience-recommendations.png) | [View](evidence/package-03-5/mobile-experience-recommendations.png) |
| Itinerary | [View](evidence/package-03-5/desktop-experience-itinerary.png) | [View](evidence/package-03-5/mobile-experience-itinerary.png) |
| Request completion | [View](evidence/package-03-5/desktop-experience-complete.png) | [View](evidence/package-03-5/mobile-experience-complete.png) |
| Passport empty | [View](evidence/package-03-5/desktop-passport-empty.png) | [View](evidence/package-03-5/mobile-passport-empty.png) |
| Passport partial | [Book detail](evidence/package-03-5/desktop-passport-partial.png) | [Book detail](evidence/package-03-5/mobile-passport-partial.png) |
| Passport reward open | [View](evidence/package-03-5/desktop-passport-complete.png) | [View](evidence/package-03-5/mobile-passport-complete.png) |
| Table finale | [View](evidence/package-03-5/desktop-home-finale.png) | [View](evidence/package-03-5/mobile-home-finale.png) |
| Seven-link menu | [View](evidence/package-03-5/desktop-menu.png) | [View](evidence/package-03-5/mobile-menu.png) |

Additional finale evidence: [1920×1080](evidence/package-03-5/full-hd-home-finale.png), [375×812](evidence/package-03-5/small-mobile-home-finale.png).

No known blocking visual issue. Browser checks use Chromium; real-device Safari/iOS/Android and formal screen-reader certification remain unverified. Local demo activity outlines cannot establish current route conditions or real provider availability. Static hosting still requires the documented SPA rewrite for both new paths. Run `npm ci` then `npm run dev`; no production host was changed. Commit/PR are returned in the delivery message. Stop after Package 03.5 for review.
