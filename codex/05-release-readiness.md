# CODEX 05 — Release candidate and deployment handoff

Prerequisite: previous packages reviewed/approved. Inspect repository, docs, media manifest and outstanding issues; do not deploy or merge without explicit owner authorization.

1. Final browser/device smoke of home / partners / book / our-story / contact; deep links and refresh.
2. Confirm there is no fictional real booking, claimed inventory/pricing/availability, fabricated partnership, or false submission. List missing business data as an explicit launch checklist.
3. Fine-tune CSS responsive, reduced-motion, keyboard/focus, route semantics, posters, proper asset loading, media source variants, and no regressions to 17.125 room branch.
4. Prepare Render Static Site deployment plan: build `npm ci && npm run build` or equivalent; publish `dist`; SPA rewrite `/* -> /index.html` except real static assets; cache/version media; verify byte range media support; plan rollback. Do not assert domain or live URL not provided.
5. Prepare SEO metadata, share image from approved real footage, favicon using original licensed brand mark, robots/sitemap. Avoid duplicate H1 and fake business structured data. Prerender supporting content if feasible without disrupting cinematic runtime; otherwise document SPA SEO tradeoff.
6. CI GitHub Actions for checkout/node install, lint/typecheck/tests/build and Playwright smoke when runtime supports it. No secrets in frontend env; audit dependency advisories.
7. Write final QA report with complete test commands/results, screenshot diffs, approved and open issues, final media size table, copyright/license checklist, build instructions, staging validation and production release gates.
8. Make feature branch/commit/PR if remote is authorized; DO NOT auto-merge or publish production until owner signs off.

Return final handoff plus explicit launch blockers; make no claims of real availability, completed booking or partnership.
