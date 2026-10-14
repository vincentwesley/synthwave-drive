# Handover

## Done (all committed on `main`)
- M1 scene: shader road, hills, sun, stars, bloom.
- M2 audio: file, drag-drop, mic and demo inputs, spectral-flux beat detector with unit tests, features.
- M3 UI: start overlay, controls, HUD, theme toggle, a11y (axe clean), credits card.
- M4 ship: `deploy.yml` (Pages, e2e gate), `ci.yml`, README with screenshots, CREDITS/NOTICE.
- Review pass applied (security and bug fixes). Checks: typecheck, 9 unit, build and 6 e2e pass (headless SwiftShader).

## One-time steps for you
1. The repo is created **private** (house rule). GitHub Pages on a private repo needs GitHub Pro or Team. To go live, either upgrade, or make it public: run `_house/pre-public/CHECKLIST.md` and `check-identity.sh --public`, then give the OK.
2. Repo Settings, Pages, Source: **GitHub Actions**. Then push to `main` (or run the workflow) and the site appears at `https://vincentwesley.github.io/synthwave-drive/`.

## Known issues / next
- Sun stripes are faint, and bloom is half-res on mobile only. Tune in `src/scene/sun.ts` and `post.ts`.
- Shader outputs need `pow(c, 2.2)` because `OutputPass` re-encodes sRGB.
- e2e beat test takes ~30-40 s because SwiftShader renders at ~6 fps. Analysis runs on a 16 ms `setInterval`, not rAF.
- Not tested: drag-and-drop, fullscreen, a real mic, real iOS Safari (silent switch and `decodeAudioData`). Test on devices after deploy.
- JS chunk is over 500 kB (three.js). Fine for the MVP.
- Ideas: pre-analysis for climax cues, per-song palette, FPS-based quality tier.
