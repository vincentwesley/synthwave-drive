> Update at the end of any session that changed state. Keep it lean.

Continue work on **Synthwave Drive** (repo `vincentwesley/synthwave-drive`, deploy: GitHub Pages, not live yet).
Scaffold only (2026-10-14), no app logic. Only do what the owner asks.

## Before anything
1. Path: `C:\Coding Projects\synthwave-drive`. Read `CLAUDE.md` and `../CLAUDE.md`.

## How to work here
- Vite + TS, branch `main`, no remote yet. Checks: `npm run typecheck && npm test && npm run build && npm run e2e`.
- CSP lives in `index.html` meta (Pages sets no headers); widen only as needed.

## Current state
- Scaffold: house tokens + credits card wired, `src/main.ts` stub, CI, no tests yet.

## Known gaps / ideas
1. Everything: scene, audio file input, beat detection, tests.
2. Report outcomes in a line or two.
