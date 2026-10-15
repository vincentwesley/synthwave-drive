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
- Lighthouse on the live site (2026-10-15, mobile emulation, software GL): accessibility 100, best practices 100, SEO 100, performance 64-67 (was 83 earlier the same day). TBT is dominated by SwiftShader running the shaders on the CPU, so it is not representative of real GPUs. Lazy-loading the scene was tried and did not help, and was reverted. Real levers: code-split three.js, cheaper shaders on low tiers. Re-measure on a real device before spending time here.
- Overdrive is covered by an e2e (quiet-then-loud fixture, `body[data-surge=1]`) and `docs/screenshots/playing-desktop-surge.png`. Bloom is capped (strength <= 1.1, threshold 0.4) so beat and surge frames never white out.
- Not tested: a real mic, real iOS Safari (silent switch, `decodeAudioData`). These need a device.
- Shader outputs need `pow(c, 2.2)` because `OutputPass` re-encodes sRGB.
- Analysis runs on a 16 ms `setInterval`, not rAF (SwiftShader fps).
- Ideas: offline pre-analysis for climax cues, three.js code-split.
