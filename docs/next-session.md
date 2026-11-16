# Next session

## Before anything
Read docs/HANDOVER.md. Repo is public, Pages live.

## How to work here
Orchestrate (scout/builder). Headless Playwright only. Commands in CLAUDE.md.

## Current state
MVP complete (M1-M4), pushed to vincentwesley/synthwave-drive (public, Pages live), checks green.

## Known gaps
See HANDOVER.md: real-device/iOS testing, drag-drop and fullscreen untested, sun stripes faint.

Vin's Atelier draggable logo + sign-off live in the credits area (`src/brand/`, `tests/e2e/logo.spec.ts`), inside `<footer class="end">` (axe `region` fix, 2026-11-16 milestone check). e2e is slow under load (SwiftShader); BPM/overlay specs can time out when other Playwright runs share the machine.
