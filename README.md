# Lakewatch

A first-person birdwatching game for the browser. You stand on the bank of a
Willamette Valley lake on an early-autumn morning, spot birds with binoculars
or a telescope, identify them from the field guide, and build a life list.

Non-commercial portfolio piece. All bird photos and recordings are Creative
Commons non-commercial and credited in-game.

## Stack

Vite + TypeScript, Three.js (world and procedural bird models), Preact (UI),
zod (data validation), Vitest (tests). Deployed to Cloudflare Pages.

## Getting started

    npm install
    npm run dev        # http://localhost:5173
    npm test
    npm run build      # typecheck + tests + vite build -> dist/

## Controls

| Key             | Action                          |
| --------------- | ------------------------------- |
| Click           | Look around (Esc releases)      |
| Scroll / B / T  | Binoculars / telescope          |
| E               | Identify                        |
| G               | Field guide                     |
| L               | Life list                       |
| O               | Settings                        |
| C               | Credits                         |
| `` ` ``         | Dev overlay                     |

If the frame rate is low, turn off **Water reflections** in Settings. That
gains 5–10 fps on an integrated GPU.

**Study the birds** on the title card opens a model viewer for every
modelled species, with its plumages, poses, field marks, photo and calls.

## Project layout

    src/            game code (world, birds, behavior, audio, ui, study, ...)
    src/birds/species/   one file per bird model
    data/           scene, bird catalog, song and call cues (cues.json), and ambience manifest
    public/media/   photos and audio (~20 MB, shipped with the site)
    public/models/  Blender-authored bird models (committed)
    scripts/        data harvest and Blender build scripts
    docs/           design specs and per-species research notes

Design docs are in `docs/superpowers/specs/`. Start with
`2026-09-22-lakewatch-design.md`. The detailed birds' model fields and
behavior are covered in their own specs and in `docs/research/`.

## Dev tools

These only work on the dev server:

- `/viewer.html` compares two species at true scale through the game's
  optics, over a reference photo. For the red-winged blackbird it also has
  the song spread's sliders, graded spreads played against a song, and
  stems to hold (a stalk, a cattail top, a tule, or two to straddle) that
  can sway.
- `window.__lakewatch` exposes `birds()`, `inspect(id)` (a bird's
  behaviour and pose), `lookAt(x, y, z)`, and `splash(x, z)` for capture
  scripts.

## Bird models

Most species are built procedurally from their spec in
`src/birds/species/`. Some are modelled in Blender instead (currently the
Double-crested Cormorant). To rebuild one:

    blender -b --factory-startup -P scripts/blender/<code>/build.py

This writes `public/models/<model>/`. The output is committed, so
`npm run build` doesn't need Blender.

## Data harvest

Needs `EBIRD_API_KEY` and `XC_API_KEY` in `.env` (copy `.env.example`).
The keys are only used by `scripts/` and never reach the browser.

    npm run harvest:all        # hotspots -> species -> taxonomy -> media -> build:birds
    npm run harvest:allowlist  # merge data/species-allowlist.json into data/raw/candidates.json
    npm run build:birds        # rebuild data/birds.json from data/raw
    npm run audio:process      # re-encode clips copied in from elsewhere

## Deploy

    npx wrangler login   # once
    npm run deploy
