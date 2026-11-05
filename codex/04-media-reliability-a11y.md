# CODEX 04 — Media reliability, access and performance hardening

Prerequisite: package 03 approved; review current code, docs and media stats. Work on a feature branch, no silent changes to approved user flow.

Scope:

1. Recheck master 17.125 seek/frame, 10s reception and B3+reverse at real mobile bandwidth and mixed refresh rates. Use requestVideoFrameCallback where available plus fallback; ensure no black flashes on all switches.
2. Optimize web media exports if needed based on quality inspection, not simply size; compare poster/video transitions B0 original vs reconstructed; support direct switch and 180ms dissolve as a feature flag/test option, present evidence and recommend one without treating it as user-approved if not yet approved.
3. Playback resilient to `play()` reject, tab invisibility, repeated CTA taps, navigation mid-playback, delayed reverse load, onended not firing, fullscreen/layout measurement changes, source errors. Keep a valid still on screen and clear retry/skip path.
4. Prefetch only likely assets: light hero poster first, Master after gesture, Branch on approach to hallway, reverse near B3. Use saveData/network hints cautiously; never require `navigator.connection` (not universal).
5. Proper accessibility: skip links, live region for meaningful chapters, Esc/back, focus trap and restoration for modal menu, scroll locking during overlays, no trapped touch scroll, reduced-motion static chapter alternative, suitable contrast and visible focus, mobile 44px targets.
6. Ensure HTML5 video playsinline/iOS behavior; no hidden audio control that falsely promises audio from silent MP4s. Optional sound design is a separate unapproved scope.
7. Lighthouse/web-vitals measurements under specified throttling and sizes; document payload sizes, memory concerns, browser test evidence. Targets only, no fictional scores.
8. Automated: Vitest state/edge, Playwright desktop+mobile, axe, visual snapshots if stable. Manual Safari iOS + Android checklist with honest status.

No new video regeneration or Three.js. Produce tested bundle and detailed QA report. Commit/push/PR only to authorized remote; stop before merge.
