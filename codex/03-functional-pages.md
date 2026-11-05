# CODEX 03 — Four supporting editorial/functional pages

Prerequisite: package 02 approved. Read project docs + existing code, inspect Git. No new separate hotel pages or `/experience` route.

Build polished, responsive, accessible pages consistent with cinematic styling:

- `/partners` — Our Local Circle: editorial intro, structured categories (restaurants, local guides, tours, outdoor activity providers), optional destination filtering Kandersteg/Splügen/Oberstdorf. Keep all named partners tagged `verified` vs `illustrative` in data; no invented active agreements, ratings or logos. If no verified dataset, use gracefully labeled concept/demo examples or generic categories rather than fabricated businesses.
- `/book` — one reservations UX for Agnes, Spalloni and Schiebel, reading validated `?hotel=...` query param safely. Dates, party size, intent and summary may be interactive, but **NO real availability/prices/payment/confirmation or silent personal-data submission**. Implement explicit demo preview mode until real booking provider is supplied; keep integration boundary clean via `BookingProvider` interface and no speculative endpoints.
- `/our-story` — editorial brand narrative based on documented family, mountain and belonging values. Clearly separate brand storytelling from independently verifiable history. Official promise and slogan are approved; use sample copy only if labelled draft.
- `/contact` — accessible inquiry UI using confirmed routes only. If no destination supplied, visible demo/non-submitting state; no imaginary contact email, telephone, addresses or fake sent confirmation.
- Shared responsive navigation/menu/footer, per-route document title/description, SPA deep-links, back navigation, empty/error states, logical tab order and basic accessibility.
- Route from cinematic finale to chosen hotel in /book, and from B3 optional Explore Our Stays.

Tests: components and validation, route pre-selection, no fake submissions, navigation/mobile/accessibility, build/lint/typecheck. Screenshots of all pages at mobile/desktop. Report content assumptions explicitly. Commit/push/PR only with known remote; no auto-merge.
