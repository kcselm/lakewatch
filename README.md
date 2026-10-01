# Lakewatch

A first-person bird watching game for the browser: stand on the bank of a
Willamette Valley lake on an early-autumn morning, look around, raise
binoculars or a telescope, identify what you see from the field guide, and
build a life list. Non-commercial portfolio piece; every bird photo and
recording is Creative Commons non-commercial and credited in-game.

Vite + TypeScript, Three.js for the world and birds (procedural models),
Preact for the guide and life list, zod-validated data files, Vitest for
the pure logic. Design spec: `docs/superpowers/specs/2026-09-22-lakewatch-design.md`.

## Run

    npm install
    npm run dev        # http://localhost:5173
    npm test
    npm run build      # typecheck + tests + vite build -> dist/

Keys: click to look (Esc releases the mouse), scroll or B/T for optics,
E identify, G guide, L life list, O settings, C credits, backtick dev overlay.
Settings has Water reflections: the water's mirrored render of the scene,
on by default; off, the water reflects only a sky gradient and the frame
rate at eye level comes back up by 5-10 fps on an integrated GPU.

## Data

`data/locations/lake.json` is the scene: zones, cast, wind, ambience.
`data/birds.json` is the catalog (species, media, attribution), built by the
harvest scripts. `data/ambience.json` is the ambience manifest.
`src/birds/species/*.ts` are the bird models: block specs for most species,
and for converted ones a `detail` block (traced profile, measurements,
field-mark layers) that the detailed builder turns into a skinned, painted
bird. A probing species can also set `probeDepth`, how far (in metres) its
bill goes into the mud at the bottom of a peck. A swimming species sets
`float.waterline` (where the water meets it in its traced side view), and
may use a bill `profile`, `hook`, `section` (a squarer, flat-topped bill) or
`shield`, `feet` (`webbed` or `lobed`),
`tail.shape: 'none'`, `parts` only some plumage versions have, and a station
`tilt`, and `rings`, the loft's cross-sections (64 unless set; the Mallard
uses 128 to keep its short head round). A heron can give `rig.neck` (its neck's joints, three to seven
station labels) and `neckShapes` (the hunch, erect, and strike, in degrees
per joint), and a `plume` part hung from the head. `PoseState.headPitch`
tips the head. A pelican gives `bill.pouch` (the pouch's lower outline, slack
and full; `PoseState.pouch` fills it) and `flight` (a wing to fly on: its
span, planform, wrist, fingered tips, wingbeat and glide; `PoseState.glide`
holds it still). A flyover flock of a detailed species is one skinned bird a
member, all on one mesh; its settings (speed, spacing, flap-and-glide bouts)
are in `src/behavior/flyover.ts`. A cast entry can give exact counts per
plumage version, for a flock of a detailed species too.
The water's look is set in `src/world/`: `waterDepth.ts` (the depth bake and
clarity), `ripples.ts` (ring speeds and lifetimes), `wake.ts`, `fresnel.ts`,
`floaters.ts` (the birds in the water), `mirror.ts`, and `water.ts`, each
number from `docs/research/2026-09-30-lake-water.md`.
`npm run dev`, then `/viewer.html`, opens the model viewer: any two
species at true scale, through the game's optics, over a reference photo.
On the dev server only, `window.__lakewatch` lists the birds in the scene
(`birds()`) and turns the view to a point (`lookAt(x, y, z)`), so a capture
script can aim at a bird.

### Harvest

Needs `EBIRD_API_KEY` and `XC_API_KEY` in `.env` (copy `.env.example`).
Keys are read only by `scripts/` and never reach the browser.

    npm run harvest:all              # hotspots -> species -> taxonomy -> media -> build:birds
    npm run harvest:allowlist        # fold data/species-allowlist.json into an existing data/raw/candidates.json
    npm run build:birds              # rebuild data/birds.json from data/raw (probes every clip with ffmpeg)
    npm run audio:process            # one-time: re-encode legacy clips through the game-ready chain

Clips the harvest writes are already game-ready (high-pass, loudness
normalised, faded). `audio:process` exists for media copied from elsewhere.

## Deploy

Cloudflare Pages via wrangler:

    npx wrangler login               # once
    npm run deploy

Media under `public/media` ships with the site (about 20 MB).
