# Synthwave Drive
**Live: https://vincentwesley.github.io/synthwave-drive/**

An endless neon wireframe road that reacts to the beat of any song you load.

![Driving, desktop](docs/screenshots/playing-desktop-dark.png)

| Start overlay | Mobile |
|---|---|
| ![Start overlay](docs/screenshots/overlay-desktop-dark.png) | ![Mobile](docs/screenshots/playing-375-dark.png) |

## How it works
- Spectral-flux beat detection on the bass band finds the beat.
- Audio features (beat, energy, spectral balance) drive the shader uniforms of the three.js scene.
- Everything runs locally in your browser.

## Usage
Open the page, then press **Play demo track**, **Load a song** (any audio file), or **Use microphone**. You can also drag and drop an audio file anywhere on the page.

## What makes each drive different
- Road speed is locked to the tempo detected from the song's BPM.
- Bass lifts the hills.
- Palette and terrain come from the song's long-term spectrum, so each track looks different.
- When a section surges, the drive goes into overdrive.

## Browser support
Modern Chromium, Firefox and Safari. On iOS, playback with the silent switch on needs iOS 17+. Quality steps down automatically on slow GPUs.

## Develop
```
npm install --ignore-scripts
npm run dev        # dev server
npm run typecheck
npm test
npm run build
npm run e2e        # Playwright + axe
```
Node 24 (`.nvmrc`).

## Deploy
GitHub Pages via `.github/workflows/deploy.yml` on push to `main`. Vite base path is `/synthwave-drive/`.

## Privacy
Audio never leaves your device. No network calls, no analytics. Nothing is stored except your theme choice in `localStorage`. No secrets or env vars needed.

## Licence and credits
MIT, see `LICENSE`. Credits in `CREDITS.md`, third-party licences in `THIRD_PARTY_NOTICES.md`. Creator art is all rights reserved.

Provided as is, no warranty.
