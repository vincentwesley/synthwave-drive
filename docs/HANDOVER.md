# Handover

## Done (all committed on `main`)
- M1 scene: shader road, hills, sun, stars, bloom.
- M2 audio: file, drag-drop, mic and demo inputs, spectral-flux beat detector with unit tests, features.
- M3 UI: start overlay, controls, HUD, theme toggle, a11y (axe clean), credits card.
- M4 ship: `deploy.yml` (Pages, e2e gate), `ci.yml`, README with screenshots, CREDITS/NOTICE.
- Review pass applied (security and bug fixes). Checks: typecheck, 9 unit, build and 6 e2e pass (headless SwiftShader).

## Status
- Repo is **public** (owner OK 2026-10-14), pre-public gate passed. Pages enabled (source: GitHub Actions); live at https://vincentwesley.github.io/synthwave-drive/. Pushes to `main` redeploy after e2e passes.
- No owner steps left.

## Known issues / next
- Lighthouse on the live site (2026-10-15): performance 83, accessibility 100, best practices 100, SEO 100. Performance cost is the three.js bundle (about 500 kB+); code-splitting is the next lever. GitHub Pages cache headers can't be changed.
- Overdrive (surge) is only unit-tested; it has never been seen rendered (triggering it in e2e would need a debug hook in prod code).
- Not tested: a real mic, real iOS Safari (silent switch, `decodeAudioData`). Test on devices.
- `theme-color` meta is the dark colour even in light UI theme (cosmetic).
- Shader outputs need `pow(c, 2.2)` because `OutputPass` re-encodes sRGB.
- Analysis runs on a 16 ms `setInterval`, not rAF (SwiftShader fps).
- Ideas: offline pre-analysis for climax cues, three.js code-split.
