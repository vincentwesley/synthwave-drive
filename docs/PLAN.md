# Plan

Endless neon wireframe road. Beat detection on any loaded song drives the scene.

## Architecture
- `src/scene/`: `terrain.ts` (ShaderMaterial plane, vertex-displaced sides, flat road, `uTravel` scrolls the grid), `sun.ts`, `stars.ts`, `post.ts` (EffectComposer + UnrealBloomPass, half-res on mobile), `index.ts` (renderer, camera, loop, resize, DPR cap 2).
- `src/audio/`: `input.ts` (file, drag-drop, mic, demo -> AudioContext + AnalyserNode), `beat.ts` (pure spectral-flux onset detector + tempo, unit-tested), `features.ts` (smoothed bass/mid/high energy).
- `src/ui/`: start overlay, controls, HUD (BPM, beat dot), theme toggle.
- The audio features feed scene uniforms once per frame: `{beat, energy, bass, mid, high, bpm}`.

## Milestones
- M1 Scene: static-speed endless road, bloom, resize, reduced motion.
- M2 Audio: inputs, detector (Vitest), mapping, HUD.
- M3 Polish: start overlay, controls, 375px layout, theme toggle, credits card, axe.
- M4 Ship: Pages workflow, README with screenshots, CREDITS, HANDOVER.

## Done criteria
Root CLAUDE.md section 4, with screenshots read by me.
