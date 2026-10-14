# Research (2026-10-14)

Items marked *unverified* were not confirmed against a primary source. Check them before relying on them.

## Prior art
| Reference | Licence | Reuse | Avoid |
|---|---|---|---|
| [Moukrea/retrowave-scene](https://github.com/Moukrea/retrowave-scene) | unverified (404 on fetch) | composition ideas: sun, grid, palette | copying code |
| [Synthwave scene tutorial (Better Programming)](https://betterprogramming.pub/synthwave-scene-my-coolest-three-js-project-yet-6359c38dfd08) | article | flat centre road, raised side terrain, scrolling terrain for endless motion | pasting code |
| [Maxime Heckel blog](https://blog.maximeheckel.com/) | all rights reserved (assumed) | shader-math landscape technique only | code |
| [todaylg/WebVR-Audio-Visualizer](https://github.com/todaylg/WebVR-Audio-Visualizer) | MIT | two-pass idea: pre-analysis for climax plus realtime beat | A-Frame stack |
| [Codrops audio-reactive particles](https://tympanus.net/codrops/2023/12/19/creating-audio-reactive-visuals-with-dynamic-particles-in-three-js/) | article | beat event emitted by a BPM manager drives visuals | pasting code |

## three.js
- `three` 0.186.1 (MIT) is current on npm.
- `UnrealBloomPass` via `three/addons/postprocessing/UnrealBloomPass.js` is current. It needs tone mapping enabled.
- `BloomNode` and `RenderPipeline` are WebGPU-only. We skip them because mobile WebGPU support is uneven.
- Mobile bloom: render at half resolution, and set the threshold above the grid's base luminance so only the neon lines bloom.

## Beat detection
- Homegrown spectral flux on `AnalyserNode` with an adaptive threshold. Use low `smoothingTimeConstant`, because smoothing blurs transients.
- Libraries considered:
  - `realtime-bpm-analyzer`: realtime, but Apache-2.0 on the current release and MIT on 4.0.2, so check the pinned version.
  - `web-audio-beat-detector`: MIT, offline `AudioBuffer` BPM only. Optional.
  - Meyda: feature extractor, not a beat tracker.
  - essentia.js (AGPL, models CC BY-NC-ND) and aubio (GPL): avoid.
- Autoplay: create or resume the `AudioContext` inside a click handler.
- iOS: Web Audio mutes with the silent switch by default. `navigator.audioSession.type = "playback"` fixes it from iOS 17. Test `decodeAudioData` on iOS.
- Mic: needs HTTPS. Request `echoCancellation`, `autoGainControl` and `noiseSuppression` as false for music (the browser defaults are unverified).

## Demo music (bundled)
- [Synthwave House Loop](https://opengameart.org/content/synthwave-house-loop) by Fupi. CC0, 1.2 MB OGG, about 114 BPM. This is the pick.
- Alternative: [Synth Wave April 3 2022](https://opengameart.org/content/synth-wave-april-3-2022) by Pro Sensory. CC0, 5.1 MB, credit requested.
- Avoid: FMA Elysium Sound (CC BY-NC-ND) and Pixabay (standalone redistribution barred).

## Delivery
| Action | Tag | SHA |
|---|---|---|
| actions/checkout | v7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| actions/setup-node | v7.1.0 | `949feb2413d6458794dcd2491c4babbbce0c15c1` |
| actions/configure-pages | v6.0.0 | `45bfe0192ca1faeb007ade9deae92b16b8254a0d` |
| actions/upload-pages-artifact | v5.0.0 | `fc324d3547104276b827a68afc52ff2a11cc49c9` |
| actions/deploy-pages | v5.0.1 | `368f82528645a54fb793d4d04e342629a3f51346` |

- Deploy job permissions: `pages: write`, `id-token: write`. Workflow level: `contents: read`. Environment `github-pages`.
- Pages limits: site up to 1 GB, soft 100 GB/month bandwidth, 10 minute deploy timeout.
- **Pages for private repos needs GitHub Pro or Team.** Free accounts need a public repo.
- Vite: `base: '/synthwave-drive/'` is the robust choice for a project page. `'./'` also works but has code-splitting caveats.
- Headless WebGL (flags *unverified*, so check with a renderer-info query): headless defaults to SwiftShader; try `--use-angle=swiftshader --enable-unsafe-swiftshader`, and don't pass `--disable-gpu`.
- Fake mic: `--use-fake-device-for-media-stream --use-fake-ui-for-media-stream --use-file-for-fake-audio-capture=<wav>`.

## What makes ours stand out
1. Everything is beat-driven: lane lines, sun, grid speed and camera, with a tempo-locked scroll.
2. Per-song terrain character: the shader's uniforms follow the song's energy and spectral balance.
3. Optional pre-analysis of the file to cue a set-piece at the climax.
4. Reduced motion slows and dims the response and keeps the beat.
5. A mobile budget with an FPS-based quality tier.

## Tooling
- In use this session: Playwright (headless e2e), context7 (three.js docs), chrome-devtools (perf traces), the `builder`/`scout` agents, and the `simplify`, `code-review` and `security-review` skills.
- Worth installing later: a `three` shader lint/format plugin and a Lighthouse CI step. Neither is needed for the MVP.
