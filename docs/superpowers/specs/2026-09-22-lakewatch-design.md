# Lakewatch: design spec

Date: 2026-09-22
Status: draft for review

## Purpose

A first-person bird watching game for the browser. The player stands at a
vantage point on a Pacific Northwest lake, looks around, raises binoculars
or a telescope to study birds, identifies them from an in-game field guide,
and builds a life list.

It is a non-commercial portfolio piece, and a vehicle for learning the craft
of stylized 3D environments and assets. The environment and the birds are
the point. The game loop exists to give the player a reason to look closely.

Success looks like: a lake scene that feels alive at a glance (wind, water,
birds moving with species-true behavior, calls panning as you turn), and an
identification loop where a birder would say "yes, that's a coot."

## Scope of this spec

One location: a Willamette Valley freshwater lake in early autumn morning
light. The architecture makes a second location a data change, but only the
lake is built under this spec.

Out of scope for the first version: walking, multiple vantage points,
identification by ear, time-of-day progression, accounts or cloud saves,
screenshot tests.

## Decisions already made

| Decision | Choice |
|---|---|
| Platform | Browser, Vite + TypeScript, deployed to Cloudflare Pages |
| 3D | Three.js, imperative render loop |
| 2D overlay | Preact for the field guide and life list; plain DOM for the HUD |
| Bird models | Procedural geometry in code: block specs first, then a detailed builder (traced profile, measurements, painted field marks) species by species; and authored birds, made in Blender on the detailed builder's skeleton and loaded as glTF, posed by the same code (the Double-crested Cormorant first) |
| Media | Reuse the birdsong-quiz harvest pipeline (eBird, xeno-canto, iNaturalist), CC non-commercial with attribution |
| Movement | Fixed vantage point, look only |
| Identification | Field guide picker limited to the location's species |
| Optics masks | Single circle for both binoculars and telescope |
| Persistence | localStorage |

## Project layout

```
lakewatch/
  data/
    birds.json              catalog, built by scripts (committed)
    locations/lake.json     the lake scene as data
    species-allowlist.json  species to harvest beyond the hotspot sample
    ambience.json           ambience and effect manifest with attribution
  public/media/             harvested audio and photos (committed)
  scripts/                  harvest-* and build-birds, copied from birdsong-quiz
  src/
    main.ts                 boot: title card, audio unlock, start loop
    store/                  shared state (target, guide open, life list)
    world/                  terrain, water, vegetation, sky, lighting, wind
    birds/                  BirdModel interface, procedural builder, gltf loader
    birds/species/          one spec file per species
    behavior/               swim, wade, probe, perch, flyover, kingfisher, blackbird
    audio/                  ambience mixer, call scheduler, event sounds
    player/                 look controls, optics, reticle, identification
    ui/                     Preact: field guide, life list, cards, credits
    hud/                    plain DOM: reticle, mode, prompts, dev overlay
    location/               location loader and validator
  docs/superpowers/specs/
```

## Data

### Bird catalog

`data/birds.json` keeps the birdsong-quiz shape: species code, common and
scientific name, family, habitats, frequency, monthly presence, audio clips
with recordist and license, and one photo with attribution.

The harvest scripts are copied into this project so it owns its data. A new
`data/species-allowlist.json` lists species codes to harvest regardless of
the hotspot sample, so the lake can cast birds the sample missed. Initial
additions: American White Pelican, Least Sandpiper, Western Sandpiper,
Greater Yellowlegs.

The build step also produces game-ready audio: silence trimmed, loudness
normalized, short fades, a gentle high-pass to reduce recording hiss.

### Location file

`data/locations/lake.json` describes the scene as data.

```
{
  "id": "willow-lake",
  "name": "Willow Lake",
  "region": "Willamette Valley, Oregon",
  "habitat": "wetland",
  "season": "early-autumn",
  "timeOfDay": "morning",
  "vantage": { "position": [0, 1.6, 0], "heading": 20 },
  "wind": { "direction": 240, "strength": 0.35, "gustiness": 0.5 },
  "zones": {
    "open-water": { "kind": "polygon", "points": [...] },
    "reeds":      { "kind": "polygon", "points": [...] },
    "mudflat":    { "kind": "polygon", "points": [...] },
    "far-shore":  { "kind": "polygon", "points": [...] },
    "snag":       { "kind": "point",   "position": [...] },
    "perches":    { "kind": "perches", "perches": [{ "name": "snag", "on": "snag", "position": [...], "height": 4.07, "radius": 0.054, "facing": 180 }, ...] },
    "sky":        { "kind": "lane",    "from": [...], "to": [...], "altitude": [40, 80] }
  },
  "cast": [
    { "species": "y00475",  "behavior": "swim",    "zone": "open-water", "count": 6 },
    { "species": "mallar3", "behavior": "swim",    "zone": "open-water", "count": 4, "plumage": "mixed" },
    { "species": "grbher3", "behavior": "wade",    "zone": "far-shore",  "count": 1 },
    { "species": "leasan",  "behavior": "probe",   "zone": "mudflat",    "count": 5 },
    { "species": "belkin1", "behavior": "kingfisher", "zone": "perches", "count": 1, "plumage": "female" },
    { "species": "amwpel",  "behavior": "flyover", "zone": "sky",        "count": 9, "everySeconds": [120, 240], "plumage": { "adult": 9 } },
    { "species": "amwpel",  "behavior": "swim",    "zone": "far-water",  "count": 5, "plumage": { "adult": 4, "juvenile": 1 } },
    { "species": "cangoo",  "behavior": "flyover", "zone": "sky",        "count": 14, "everySeconds": [180, 360] }
  ],
  "ambience": ["water-lapping", "wind-reeds", "distant-frogs"]
}
```

The location loader validates the file with zod and applies the
**habitat cast check**: every cast species must carry the location's habitat
tag in the catalog, and every referenced zone must exist. Validation failure
is a build error, not a runtime fallback.

The initial lake cast, drawn from the catalog's wetland species plus the
allow-list: American Coot, Mallard, Gadwall, American Wigeon, Northern
Shoveler, Pied-billed Grebe, Great Blue Heron, Great Egret, Canada Goose,
Belted Kingfisher, Red-winged Blackbird, Marsh Wren, Killdeer, Least
Sandpiper, Greater Yellowlegs, American White Pelican. The field guide for
the location lists every catalog species tagged for the habitat, so the cast
is a subset of what the guide offers, which keeps the picker honest.

## The world

### Art direction: stylized realism

Accurate proportions, silhouettes, and field marks, simplified forms, no
photo textures. Birds are field-guide plates: structure traced and measured,
field marks painted from data. Physically based lighting with a warm-cool
grade, soft shadows, light fog for depth. The test for every asset: a
birder recognizes the species from shape and field marks; for birds, the
bar is telling a Greater Yellowlegs from a Lesser.

### Composition

The player stands on a low bank. Left foreground: reed bed. Right
foreground: mudflat curving away, and past it a low grassy flat that slopes gently into the
water, where the geese graze. Middle: open water, and left of centre a cluster of drowned stumps standing in it, where
the cormorants perch. Far side: a shallow
wading shelf along the waterline where the herons feed, a snag in the water, a gravel bar, a tree line under the sky.
The kingfisher's perches: a branch of the snag, and dead branches leaning out from the bank, the nearest about 33 m
out, in binocular range. In the reed bed, five red-winged blackbirds cling to the cattails and tules, their singer on
the stalk nearest `reed-perch`, 9.4 m out. Placement is designed
for three viewing distances: naked-eye foreground, binocular mid-water,
telescope far shore.

### Components

Each is a module with one job and an `update(dt, wind)` entry point.

- **Wind**: owns direction, base strength, and a gust curve from seeded
  noise. Exposes a small uniform block that every other component reads.
  Nothing animates independently of it.
- **Terrain**: heightfield mesh for bank, mudflat, far shore, and a flat
  underwater bench past the shallows where the dowitchers feed. A second
  shelf slopes from 5 to 22 cm deep along the far waterline, where the
  herons wade. Past the mudflat a low grassy flat slopes into the water at 1 in 4, where the geese walk out to graze.
  Vertex color by height and slope (mud, gravel, grass), and a
  band of wet ground above the waterline drawn by each fragment's height.
- **Water**: custom shader over a water-depth texture baked from the
  terrain. Colour and clarity by depth, so the bench, the shelf, and the rim
  read as shallows and the bed shows through them; a soft shoreline. A
  half-resolution planar reflection of the sky, far bank, trees, snag, reeds,
  and birds, rendered every other frame, distorted and smeared by the ripples
  and faded by Fresnel (off in settings falls back to a sky gradient). Ripple
  normals in four octaves whose direction and amplitude follow the wind,
  fading by pixel footprint; calm patches and cat's paws drifting downwind
  with the gust front the reeds share. Rings from the birds and a Kelvin V
  behind a swimmer bend the surface rather than brighten it, and every bird in
  the water has a contact line. See `2026-09-30-water-design.md`.
- **Vegetation**: instanced reed and grass blades with vertex-shader sway. A grazed lawn of short blades on the geese's flat.
  In the reed bed (`createReedBed`), cattail stalks with their spikes and tules stand among narrow cattail leaves; each
  stem is a damped oscillator swayed by the wind and the birds on it, its bend shared by the CPU and the shader, so a
  blackbird's feet stay on it; see `2026-10-13-red-winged-blackbird-design.md`.
  Gusts roll across the bed as a moving front rather than in sync. Noise
  tint so the bed is not uniform.
- **Stumps**: four drowned stumps standing in open water left of centre (`createStumps`), each top a cormorant's perch.
- **Trees and snag**: low-poly canopy clusters with subtle sway; far tree
  line as layered silhouettes fading into fog.
- **Sky**: gradient dome, sun disc, soft cloud billboards drifting with the
  wind. Contains the flyover lane.
- **Lighting and post**: one directional sun, hemisphere fill, fog, ACES
  tone mapping, subtle vignette. Season and time of day from the location
  file set sun angle, palette, and fog color.

### Performance

60 fps on an integrated GPU in Chrome. Fixed viewpoint means no LOD.
Reeds and flocks are instanced. The dev overlay shows frame time. The water's
mirror is a second render of the scene every other frame; the water spec
records what it costs, and Water reflections in settings turns it off.

## Birds

### The BirdModel seam

```
interface BirdModel {
  group: THREE.Group;
  parts: { body, neck, head, bill, wingL, wingR, tail, legs };
  pose(state: PoseState): void;
  dispose(): void;
}
interface PoseState {
  wingPhase: number;      // 0..1 cycle, 0 = wings level
  wingSpread: number;     // 0 folded .. 1 fully spread
  headBob: number;
  neckExtend: number;     // 0 tucked .. 1 stretched
  tailTilt: number;
  lean: THREE.Vector3;    // body lean, for wind and turning
  strideDistance: number; // metres walked; the model maps it to a stride
  gait: number;           // 0 standing .. 1 walking
  reach: number;          // 0 .. 1, a peck or strike reaching down; at 1 the bill tip is on the ground
}
```

Three implementations:

- **Procedural**: `buildBird(spec: SpeciesSpec, variant?)`. A spec gives
  body size and shape, neck length, bill length and shape, leg length, tail
  length, and plumage as colored regions (crown, cheek, throat, breast,
  flank, back, wing, speculum, rump, bill, legs, eye). Dimorphic species
  list plumage variants. One file per species in `src/birds/species/`.
- **Detailed**: `buildDetailedBird(spec, variant?)` for species with a
  `detail` block: one skinned mesh lofted from a traced side profile, built
  to published measurements, with jointed legs and a painted atlas of field
  marks. See `2026-09-24-detailed-birds-design.md`. The six swimmers float
  on a traced waterline; see `2026-09-26-swimmers-design.md`. The two
  herons bend a six-joint neck between named shapes; see
  `2026-09-27-herons-design.md`. The American White Pelican is detailed on
  the water and in flight, with a pouch under its bill and a wing to fly on;
  see `2026-09-30-pelican-design.md`.
 The Canada Goose on the lake is amphibious: it floats
  and stands, `afloat` passing it between the two at the shore; see `2026-09-30-canada-goose-design.md`. Its flyover
  stays a block model. The Belted Kingfisher is detailed and perched, its toes round a branch, with a spread wing
  that flaps, hovers, glides and folds onto the body, a crest it raises, and a fish it holds; see
  `2026-09-30-kingfisher-design.md`. The Red-winged Blackbird is detailed in three versions, a female the male scaled
  (`detail.sizes`), its toes round the stems it holds (`perch.stems`) and a song spread its pose opens (`detail.display`:
  `epaulet`, `epauletRaise`, `fluff`, `wingHold`, `gape`); see `2026-10-13-red-winged-blackbird-design.md`.
- **Authored**: a detailed species with an `authored` block (not `detail`) is made in Blender
  (`scripts/blender/<code>/`, built headless) on the detailed builder's skeleton: its glb (the mesh, its skin, a part
  for each vertex, and named landmarks) and each version's colour, normal, and roughness maps live in
  `public/models/<model>/`. They load at startup with the atlases; the loader reads the glb onto the builder's bones
  and anatomy, and the bird poses by the same code as a lofted one. The Double-crested Cormorant is the first; see
  `2026-10-05-cormorant-design.md`.

### Animation

Procedural curves blended into `PoseState` by the behavior: wingbeat,
coot head-pump, heron stalk, strike, swallow, and hunch, plover
run-stop-look-peck,
sandpiper walk-and-pick, dowitcher stitch, dabbler tip-up and head-dip,
shoveler skim and pair spin, coot jump-dive, grebe roll-under and sink,
pelican bill-dip, drain, and swallow, flap and glide, goose walk out, graze, look up, walk in, kingfisher flight,
hover, plunge, and fish handling, its head bob, tail flick, crest, and head turn, spray where a kingfisher plunges,
cormorant dive, swallow, and wing-drying, blackbird stem grips, climbs, steps, flutters, feeding at a cattail head,
and the song spread timed to each song's cue, the body riding the swaying stem so the head stays steady,
preen and wing-stretch idles.

### Behaviors

| Behavior | What it does |
|---|---|
| swim | Forage in the species' style: a dabbler cruises, loafs, dips its head, and upends; a shoveler skims with its bill in the water and spins in pairs; a coot pumps its head, pecks at the surface, and makes short jump-dives; a grebe dives and surfaces metres away, or sinks until only its head shows; a pelican loafs with its neck in an S or its head sunk on its shoulders, and the group swims abreast and dips their bills together; a cormorant loafs low in the water, then fishes in bouts of dives, sliding under head first and staying down about 22 s, surfacing a few metres on, now and then with a fish it swallows head first in forward-upward jerks. Swimmers keep their distance from each other |
| wade | Forage in the species' style: a heron stands in the shallows with its neck coiled, waits, stalks a slow step at a time, strikes, swallows with its head tipped up, and hunches between feeding bouts; herons keep their distance from each other. Other waders take slow steps along a shore zone, stand still for long stretches, and strike |
| probe | Forage in the species' style: a plover runs, stops dead, looks, and pecks, each bird on its own; a sandpiper walks and picks in a loose group that moves together; a dowitcher stands belly-deep in a tight flock and stitches, its bill going down and up and its head dipping into the water |
| perch | Sit on a reed perch, shuffle, stretch, short loop flight and return. A cormorant stands upright on a stump with its tail propped, rests with its neck drawn in or erect, and in drying sessions holds its wings out, wrists up and hands hanging, facing into the wind |
| flyover | Flock enters at one sky edge on a timer, crosses in formation (pelican line, goose V), exits. A detailed species flies as skinned birds that flap and glide, the flapping passing down the line; a block species is instanced, per-bird wingbeat phase |
| kingfisher | Perch over the water, watching, bobbing, flicking the tail; plunge from the perch, or fly out, hover, and plunge; come up and fly to a perch, beating and swallowing any fish; fly low between perches, rattling |
| blackbird | Cling to a cattail or tule stem, riding it as it sways; look about, preen, feed at a cattail head, flick the tail; climb, step and flutter between stems; check now and then; the singing male sings in bouts with the song spread, graded and timed to each song |

Each behavior is a small state machine with a seeded random source so it
is testable.

### Registry

Every spawned bird is registered with an id, species code, variant,
world position, apparent size helper, and current behavior state. The
reticle, identification, and call scheduler query the registry, never the
scene graph.

## Audio

Three.js positional audio, listener on the camera. Optics do not change
the sound.

- **Ambience**: looping layers from `data/ambience.json`, mixed in code.
  Wind-in-reeds gain follows the wind gust curve.
- **Bird calls**: each species has a call schedule (interval range, call
  versus song preference). Clips play positionally from the registry
  position. A cap on simultaneous calls, nearer birds win. A behaviour may also ask for a call, as the kingfisher's
  rattle in flight does; it plays within the same cap. A blackbird asks for a song or a check, played from cues marked
  on the clips (`data/cues.json`); a song is scheduled 0.4 s ahead and its start reported, so the spread meets the
  song. Red-winged blackbirds are never timed: they only call when asked.
- **Flock audio**: one moving source per flyover flock. A flock of a
  species that never calls here (the pelicans, silent away from their
  colonies) crosses in silence, and its birds are never scheduled to call.
- **Event sounds**: optics raise and lower, guide open and page turn,
  correct and incorrect, kingfisher splash, nearby wing flaps.

The title card starts the audio context on click. Attribution for every
clip appears on the guide entry and a credits screen.

## The player

### Looking

Click to capture the pointer, mouse to look, Esc to release. Touch drag
on mobile. Full yaw, pitch clamped. Sensitivity scales with field of view.

### Optics

| Mode | FOV | Mask | Feel |
|---|---|---|---|
| Naked eye | 60° | none | Free look |
| Binoculars (8x) | 7.5° | wide circle, soft edge | Hand sway, raise animation, focus pull from blur |
| Telescope (30x) | 2° | tighter circle, hard dark edge | Tripod-steady, slower panning |

Scroll wheel or keys cycle modes.

### Identification

1. With optics raised, a registered bird inside the center reticle whose
   apparent size exceeds a threshold becomes the target. Soft highlight
   and an "Identify" prompt. Too small: "Too far. Try the telescope."
2. On confirm, the scene pauses and the field guide opens, limited to the
   location's species, sorted by family. The target id is held in the
   store.
3. **Correct**: card with species name, reference photo, one field mark.
   Recorded as self-identified. **Wrong**: card names the guess as wrong
   and gives a contrasting hint built from the two species' field marks,
   then returns to the scene. After three misses the answer is revealed
   and recorded as seen, not self-identified.
4. An identified individual shows its name when targeted again. Other
   individuals of the same species can still be identified.

Field marks are a short per-species list in the species file (bill shape,
size, head pattern, and so on) used both for the correct card and for
hints.

## The life list

localStorage, keyed by a schema version so it can migrate.

- **Species records**: first seen date and location, self-identified
  count, revealed count, wrong-guess count. Never removed except by an
  explicit reset in settings.
- **Sightings journal**: the last 200 sightings with species, location,
  time of day, self-identified flag.

Shown in the field guide as full check (self-identified), hollow check
(revealed), or blank. The guide always shows photo and call, including
for unseen species. A life list screen groups seen species by family, shows
the journal, and a header such as "14 of 31 species at Willow Lake" with
accuracy.

## UI

- **Title card**: name, click to begin (unlocks audio), credits link.
  Begin waits while the birds' plumage atlases paint in a Web Worker, the
  folded wings are placed a species at a time, the authored birds' models and
  maps load, and the cast is built. One count covers them all: "Getting the
  birds ready… N of 49".
- **HUD** (plain DOM): reticle, current optic, prompt text, dev overlay
  toggle showing frame time, bird count, wind state, zone outlines.
- **Field guide** (Preact): species list with seen state, detail panel
  with photo, call playback, field marks, attribution, and a confirm
  button when opened for identification.
- **Result cards** (Preact): correct, wrong with hint, revealed.
- **Life list screen** (Preact).
- **Settings**: mouse sensitivity, volume per layer, water reflections, reset life list.

## Error handling

- Location or species validation failures stop the build with a message
  naming the entry.
- A missing or undecodable audio clip is skipped at build time, as in
  birdsong-quiz, so the runtime never schedules a clip that cannot play.
- WebGL unavailable: the title card explains and links the credits.
- localStorage unavailable: the game runs with an in-memory life list and
  a notice that progress will not be saved.

## Testing

Vitest for pure logic:

- Location validation and the habitat cast check.
- Species spec validation.
- Identification: target selection from apparent size, scoring, the
  three-miss reveal, hint generation.
- Life list storage round-trips and schema migration.
- Behavior state transitions with a seeded random source.
- Flock formation math (line and V positions, entry and exit).
- Wind gust curve determinism from a seed.

Rendering is checked by eye with the dev overlay. `npm run build` runs
typecheck and tests before Vite builds. Deploy is `wrangler pages deploy`.

## Build order (for the plan)

1. Project scaffold, location loader and validator, catalog copy.
2. World: wind, sky, terrain, water, vegetation, lighting. A still scene
   that already looks right.
3. Procedural bird builder and the first four species (coot, mallard,
   heron, sandpiper); swim, wade, probe behaviors; registry.
4. Player look, optics, reticle, target selection.
5. Field guide, identification flow, life list.
6. Audio: ambience, call scheduler, event sounds.
7. Flyover flocks, kingfisher hover, remaining species.
8. Title, settings, credits, deploy.

## Future ideas (not in this spec)

Identification by ear, more vantage points per location, a second
location (coastal shoreline or forest), time-of-day progression, seasonal
casts, Blender models replacing procedural ones.
