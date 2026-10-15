# Decisions

1. **Stack: Vite + TypeScript + three (pinned 0.186.x).** It matches the house defaults. Use named imports to keep the bundle small.
2. **Bloom: `UnrealBloomPass` on `EffectComposer`, half resolution on mobile.** It is the current WebGL path and adds no dependency. WebGPU `BloomNode` is skipped because mobile support is uneven.
3. **Scene: shader terrain and road, with the world static and a `uTravel` uniform scrolling the grid.** This gives an endless road without chunk management or seams. The vertex shader displaces the side terrain and leaves the road flat.
4. **Beat detection: homegrown spectral flux on the low band, adaptive threshold (mean + k·σ), refractory period.** Tempo is the median inter-onset interval. It is a pure function, so it can be unit-tested. We don't take on a library: the realtime options are licence-ambiguous and the others are offline only or copyleft.
5. **Scene response:** the beat triggers a grid pulse, a bloom flash, a sun throb and a camera bump. Speed follows smoothed energy. Mids shift the hue and highs make the stars twinkle.
6. **Inputs: file picker, drag-and-drop, mic and demo track.** Files stay in the browser. The mic is requested with echo cancellation, AGC and noise suppression off.
7. **Demo track: Fupi's CC0 "Synthwave House Loop" (OpenGameArt).** It is real music with a clean licence. It is credited in CREDITS.md.
8. **iOS:** set `navigator.audioSession.type = 'playback'` where available, and create the `AudioContext` inside the start gesture.
9. **UI chrome uses house tokens, dark by default.** The scene keeps its own neon palette because the brief calls for one. Reduced motion slows and dims the response and keeps the beat.
10. **Deploy: GitHub Pages via Actions with SHA-pinned actions.** The brief requires it, so it overrides the root Cloudflare default. Pages can't set headers, so the CSP goes in a `<meta>` tag. Vite `base` is `/synthwave-drive/`.
11. **The repo started private (house rule) and was made public on 2026-10-14 with the owner OK**, since Pages on a private repo needs Pro.
12. **Song profile and overdrive.** A slow (~8 s) average of bass/mid/high/energy sets each song's look: grid tilt, hill roughness and sun colour. A sustained energy jump (after a 10 s warm-up) triggers a bounded overdrive of extra speed, bloom and star streak. Road speed is tempo-locked to detected BPM.
13. **FPS quality tier.** Under about 45 fps for 3 s it halves bloom resolution, then drops DPR to 1. Tier-up waits 8 s, and the wait doubles after each failed tier-up. `?quality=0` pins full quality, used only by e2e (SwiftShader runs at about 6 fps).
14. **e2e gates deploy.** The Pages build runs the e2e suite. Timeout is 90 s and CI retries once, because the first SwiftShader test timed out on 2-core runners.
15. **`body[data-surge]`** mirrors the overdrive state. It is real UI state and lets e2e (and CSS) observe surge without a debug hook.
16. **Bloom is capped** (strength <= 1.1, threshold 0.4) after sampling frames across beat phases showed beat and surge frames whiting out. Judge look changes by the worst frame, not a single screenshot.
17. **Lazy scene import was tried and reverted.** It did not improve Lighthouse, and the score moves with software-GL cost, not load order.
