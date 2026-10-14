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

The title card's "Study the birds" opens the study screen, while the birds
get ready behind it: every species with a model, turned on a stage of its
own (drag to turn, scroll to zoom) in each plumage and in the poses its
model has (at rest, alert, in flight, drying its wings, ashore), with its
field marks, photo, calls, and where it is on the lake. Its choices are in
`src/study/study.ts`, its stage in `src/study/stage.ts`; while it is open the
lake stops drawing (`World.setHidden`).

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
tips the head. A swimming species that also stands sets `amphibious` (its legs are built standing, and
`PoseState.afloat` takes it from its float to its feet) and may set `waddle`, in degrees; a neck drawn down into its
feathers at rest may lengthen going erect or reaching (`neckStretch`, `reachStretch`), its base
handing off from the body at `rig.neckFrom` and turning about its throat side (`rig.neckBaseDepth`). A goose cast entry names the
zone its family walks out to (`ashore`) and its `groups`, a family first. A pelican gives `bill.pouch` (the pouch's lower outline, slack
and full; `PoseState.pouch` fills it) and `flight` (a wing to fly on: its
span, planform, wrist, fingered tips, wingbeat and glide; `PoseState.glide`
holds it still). A flyover flock of a detailed species is one skinned bird a
member, all on one mesh; its settings (speed, spacing, flap-and-glide bouts)
are in `src/behavior/flyover.ts`. A perched species (the Belted Kingfisher) gives `perch` (its branch's radius, and
`top`, where the traced photo's feet stand); its toes curl round the branch and its body leans about its feet. Its
`flight` block may add a `hover` stroke (`PoseState.wingStroke` blends it with the beat), a `pitch`, a swept
`glide`, and a `fold` that lays the spread wing along the folded one; `PoseState.legsUp` draws its legs up in
flight. A `crest` part is raised by `PoseState.crestRaise`, `fish` gives the length of a fish held in the bill
(`PoseState.fish`, `fishTurn`), `tail.fan` the angle of a fully fanned tail (`PoseState.tailSpread`), and
`PoseState.headYaw` turns the head. The kingfisher works a `perches` zone (named branches over the water) and
asks for its rattle through the call scheduler; its settings are in `src/behavior/kingfisher.ts`, and spray where a
bird plunges in `src/world/splash.ts`. A cast entry can give exact counts per
plumage version, for a flock of a detailed species too.
A detailed species may instead be made in Blender: an `authored` block (in
place of `detail`) names its `model`, its `versions`, and how it moves (the
same fields: `neck`, `neckShapes`, `neckStretch`, `amphibious`, `flight`'s
beat, glide, and `dry`, its wings held out to dry). Its scripts are in
`scripts/blender/<code>/`, sharing `scripts/blender/lib/gamebird.py` (the
game's skeleton, parts, landmarks, and export); build it headless with
`blender -b --factory-startup -P scripts/blender/<code>/build.py`, which
writes `public/models/<model>/`: `<model>.glb` (the mesh skinned to the
detailed builder's bones, a `_PART` for every vertex, `mark_*` landmarks,
no images) and each version's `<version>.color.webp`, `.normal.webp`, and
`.rough.webp`. The files are committed, so `npm run build` needs no Blender.
The models load at startup with the atlases, and before every test file
(`src/birds/models.setup.ts`). The Double-crested Cormorant is the first.
A perched bird raises its body (a negative `lean`) and props its tail on
the perch (`PoseState.tailProp`); a point zone's perches may be a list, one
for each bird (the stumps').
The water's look is set in `src/world/`: `waterDepth.ts` (the depth bake and
clarity), `ripples.ts` (ring speeds and lifetimes), `wake.ts`, `fresnel.ts`,
`floaters.ts` (the birds in the water), `mirror.ts`, and `water.ts`, each
number from `docs/research/2026-09-30-lake-water.md`.
`npm run dev`, then `/viewer.html`, opens the model viewer: any two
species at true scale, through the game's optics, over a reference photo.
On the dev server only, `window.__lakewatch` lists the birds in the scene
(`birds()`), turns the view to a point (`lookAt(x, y, z)`), so a capture
script can aim at a bird, and starts a spray on the water (`splash(x, z)`).

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
