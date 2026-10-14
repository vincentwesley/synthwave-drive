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
- Bloom is half-res on mobile only (`post.ts`).
- Shader outputs need `pow(c, 2.2)` because `OutputPass` re-encodes sRGB.
- e2e beat test takes ~30-40 s because SwiftShader renders at ~6 fps. Analysis runs on a 16 ms `setInterval`, not rAF.
- Not tested: a real mic, real iOS Safari (silent switch and `decodeAudioData`). Test on devices after deploy.
- JS chunk is over 500 kB (three.js). Fine for the MVP.
- Ideas: pre-analysis for climax cues, per-song palette, FPS-based quality tier.
