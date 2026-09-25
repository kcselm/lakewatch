# Detailed birds: design spec

Date: 2026-09-24
Status: draft for review
Amends: `2026-09-22-lakewatch-design.md` (art direction, BirdModel, PoseState)

## Purpose

Overhaul every bird so a player can really identify it. The first-round
birds are shape-and-colour-block stand-ins; through the telescope a
shorebird at mudflat range fills half the screen height, and what it shows
is a cone on a sphere on an ellipsoid. The bar this spec sets is the one
birders face: tell a Greater Yellowlegs from a Lesser Yellowlegs.

This round builds the pipeline and the first two birds on it. Every later
species should be mostly a new data file on the same pipeline.

Success looks like: from the vantage, through the telescope, a birder
separates the two yellowlegs by bill length against head, bill shape and
base colour, bulk, neck and breast streaking, and flank barring; and the
next species to convert needs a spec file, not a new builder.

## Scope of this spec

In scope:

- A second `BirdModel` implementation, the detailed builder: one skinned
  mesh per bird, lofted from a traced side profile, with jointed legs.
- A plumage painter that turns field-mark layers into a texture atlas.
- `PoseState` gains a stride; `wade` drives it.
- A dev-only model viewer.
- Greater Yellowlegs converted; Lesser Yellowlegs added to the catalog,
  the species list, and the cast; both in a new `shallows` zone.

Out of scope: converting any other species, species-specific motion
(Greater's running and bill-sweeping, Lesser's picking, the alarm bob),
flight-quality spread wings, skinned flocks, more than one plumage per
yellowlegs, normal maps or feather relief.

## Decisions made in brainstorming

| Decision | Choice |
|---|---|
| Visual target | Field-guide plate: exact structure, field-mark patterns painted procedurally, no photo textures |
| First birds | Greater and Lesser Yellowlegs together, so the ID test can be run |
| Motion | Jointed legs with a gait driven by today's wade; no new behaviours |
| Approach | Data-driven anatomy plus pattern layers (not a builder per species, not Blender) |
| Mesh | One `SkinnedMesh`, one material, one atlas per species and plumage |
| Units | Metres, from published measurement tables |
| Coexistence | Species opt in with a `detail` block; everything else keeps the block builder |
| Plumage | Juvenile for both yellowlegs (confirmed by the research; see The yellowlegs) |
| Cast | Two Greater, one Lesser, together in a new ankle-deep `shallows` zone about 22 m out |

## Changes to the Lakewatch design spec

- **Art direction test** changes from "a birder recognizes the species
  from shape and color blocks alone" to "from shape and field marks".
  Still stylized realism, still no photo textures; patterns are painted
  from data.
- **BirdModel** gets a third implementation next to procedural and GLTF:
  detailed. The interface itself does not change.
- **PoseState** gains two fields:

  ```ts
  /** metres walked so far; the model maps it to its own stride phase */
  strideDistance: number
  /** 0 standing .. 1 walking */
  gait: number
  ```

  `defaultPose()` sets both to 0. `wade` accumulates distance while
  stepping and eases `gait` toward 1, toward 0 otherwise. Every other
  behaviour leaves them alone, and the block builder ignores them.

The main spec is edited to match as part of this work.

## Architecture

```
src/birds/
  factory.ts     createBirdModel(spec, variant): detailed if spec.detail, else blocks
  detail/
    spec.ts      zod schema for the detail block
    profile.ts   station interpolation, arclength, mm-per-texel
    loft.ts      body-neck-head surface, UVs, skin weights
    bill.ts      bill geometry
    wing.ts      folded and spread wing geometry
    tail.ts      tail geometry
    legs.ts      leg and toe geometry
    rig.ts       skeleton, bone names, BirdParts mapping
    gait.ts      stride phase and 2-bone IK (pure)
    build.ts     buildDetailedBird: merge, material, pose()
  paint/
    atlas.ts     atlas region layout
    layers.ts    one function per layer type (pure pixel ops)
    painter.ts   paint(spec, variant) -> pixels; per-plumage DataTexture cache
src/viewer/      dev-only model viewer (viewer.html)
```

`spawn.ts` calls the factory instead of `buildBird`. `flock.ts` and
`placeholder.ts` keep calling `buildBird`: a converted species that flocks
falls back to blocks until flocks learn skinning (a later round). The old
block fields stay required on `SpeciesSpec` until every species converts,
then they go.

## Geometry and rig

### One skinned mesh

Each detailed bird is one `THREE.SkinnedMesh` with one
`MeshStandardMaterial` whose map is the species-and-plumage atlas: one
draw call per bird. Body, neck, and head are a single lofted surface
skinned across bones; bill, eyes, wings, tail, and legs are merged into the
same geometry and bound rigidly to their own bone.

Bones, all named, children of the group so `BirdParts` stays satisfied:

```
body
  neck (neckBase) -> neckMid -> head -> bill
  wingL, wingR            (spread wings)
  wingFoldL, wingFoldR    (folded wings)
  tail
  legs -> hipL -> tibiaL -> tarsusL -> toesL
       -> hipR -> tibiaR -> tarsusR -> toesR
```

`parts.body/neck/head/bill/wingL/wingR/tail/legs` map to the bones of those
names. Parts that must disappear (legs on a future swimmer, the folded wing
while spread, the spread wing while folded) collapse by scaling their bone
to near zero, since one mesh cannot hide part of itself.

### Profile loft

The spec gives a side profile traced from a reference photo as stations
along the spine, tail to bill base:

```ts
interface Station {
  label?: string        // 'vent', 'breast', 'nape', 'crown', 'eye', ...
  x: number; y: number  // spine point in the side view, metres, +x forward
  up: number            // surface height above the spine
  down: number          // surface depth below the spine
  halfWidth: number
}
```

`profile.ts` interpolates the stations with a centripetal Catmull-Rom spline
(spine point and the three sizes), and `loft.ts` sweeps a cross-section
along it: a superellipse whose upper half has height `up` and lower half
depth `down`, so a deep breast and a flat back are one station. Rings are
evenly spaced by arclength; the end rings close to a point.

UVs: u runs along the spine from tail to bill base; v runs around the ring
from the back's midline (0) down the side to the belly's midline (1), the
same on both sides, so left and right share texels and the bird is
symmetric with no seam. `profile.ts` also reports millimetres per texel at
every u, which the painter uses.

Skin weights blend body, neckBase, neckMid, and head by arclength between
the labelled stations the rig names, so the neck bends smoothly when
`neckExtend` tucks it.

### Bill

Lofted along a curve from its root (anchored inside the forehead) to the
tip. Its exposed length, from where it leaves the head surface to the tip,
equals `measurements.culmen` (the exposed culmen, measured the way the
sources measure it). Depth and width at the base come from
`measurements.billDepth` and `billWidth`; the spec adds a taper toward the
tip and `curve` (positive lifts the tip: Greater Yellowlegs' slight upturn
is a small positive number). UV u runs base to tip so a two-tone bill is a
gradient layer.

### Eye

A small sphere set into the side of the head at the station labelled
`eye`, at a given v, bound to the head bone, UV-mapped to the eye region of
the atlas (iris, pupil, catchlight painted).

### Wings

- **Folded:** a thin curved shell lying just outside the flank. Its shape
  is a traced outline, normalized from the wrist (bend of the wing) to the
  wingtip and scaled so wrist to tip equals `measurements.wingChord`. The
  primary projection past the tail tip is therefore an outcome, not an
  input, and the tests check it. The painter supplies the feather groups
  (scapulars, coverts, tertials, primaries).
- **Spread:** basic this round: a better planform than today's tapered
  plane, flapping from `wingSpread` and `wingPhase` as today, painted with
  the same upper-wing layers. Shown only while `wingSpread > 0.05`.

### Tail

A thin, slightly cupped fan rooted at the first (rearmost) station,
`measurements.tail` long, whose outline is `square`, `rounded`, `wedge`, or
`notched`, mostly hidden under the folded wingtips at rest.

### Legs and gait

Each leg is a chain: hip (inside the body, below the station the rig names
`hip`), tibia, the intertarsal joint that bends backward, tarsus, and a
foot of three forward toes and a hind toe. The tibia runs from the hip to
the joint and is sized so the bare part below the belly surface equals
`measurements.tibia`; tarsus and middle toe come from their measurements.
Segments are tapered tubes with a slight swelling at the joints.

`gait.ts` is pure:

- Step length is a fraction of leg length; the stride phase is
  `strideDistance / (2 * stepLength)`, so the phase advances exactly with
  distance travelled.
- During stance the foot target moves backward in model space at the rate
  the bird moves forward, so it stays fixed in the world. During swing it
  lifts on a short arc.
- An analytic 2-bone IK (law of cosines) solves tibia and tarsus angles to
  reach the foot target, with the joint always bending backward.
- `gait` blends between the standing pose and the walk cycle.

### Origin, center, radius

Standing birds keep the group origin at the feet; swimmers at the waterline
(as today). `center` and `radius` are computed from the skinned bounds at
rest pose, so targeting is unchanged.

## Plumage painting

### Atlas

One 1024 x 1024 RGBA atlas per species and plumage, split into regions:
skin (body, neck, head; the largest), folded wing, spread wing upper and
under, tail upper and under, bill, legs, eye. `atlas.ts` owns the layout.

### Anatomical coordinates

Layers never name pixels. On the skin a region is `from` one station label
`to` another, optionally with a `band` of v (0 = back midline, 1 = belly
midline). A point is a station label plus a v and an optional offset in
millimetres. Other parts use their own normalized coordinates (wing: base
to tip and leading to trailing edge; bill: base to tip).

All sizes are millimetres on the bird. The painter converts through the
loft's mm-per-texel, so a 3 mm spot is 3 mm on the thin neck and on the
wide belly.

### Layers

Applied in order, each with soft edges:

| Layer | Does | Example |
|---|---|---|
| `base` | back-to-belly colour gradient over a part or region | grey-brown above, white below |
| `fill` | flat colour over a region | pale lores |
| `spots` | seeded scatter of round spots | spangling |
| `bars` | parallel bars at an angle | flank barring |
| `streaks` | short strokes along the body axis | neck and breast streaking |
| `stripe` | a band between two anatomical points | supercilium, eye-line |
| `ring` | a ring around a point | eye-ring |
| `feathers` | tiled feather shapes with edge colour or pale notches | notched coverts and tertials |
| `gradient` | colour change along a part axis | bill pale at the base, dark at the tip |

The eye region paints iris, pupil, and a catchlight.

### Painter

- Pure TypeScript over a `Uint8ClampedArray`; Vitest runs it with no
  canvas.
- Each layer draws from its own seeded source (species code plus layer
  index), so a species looks the same on every load.
- Output is a `THREE.DataTexture` (sRGB, mipmaps, anisotropic filtering for
  low-angle telescope views), cached per species and plumage and shared by
  every bird of that kind.
- It paints at spawn, under the title card. Budget about 150 ms per atlas,
  shown on the dev overlay; over budget moves painting to a Web Worker.

### Memory

About 5.6 MB per atlas with mipmaps. Two atlases now; the full cast (about
25 plumages) would be about 140 MB, so later rounds may paint species only
ever seen far away at 512 x 512.

## Spec format

`SpeciesSpec` gains an optional `detail` block, validated in
`src/birds/detail/spec.ts`:

```ts
detail?: {
  measurements: {                // metres, the published values
    length, culmen, billDepth, billWidth, tarsus, tibia, toe, wingChord, tail
  }
  profile: Station[]
  rig: { neckBase: Label; neckMid: Label; head: Label; hip: Label }
  bill: { taper: number; curve: number }
  eye: { radius: number; v: number }
  wing: { wrist: [number, number]; outline: [number, number][] }  // wrist in metres, outline normalized
  tail: { shape: 'square' | 'rounded' | 'wedge' | 'notched' }
  stepLength?: number            // fraction of leg length, default 0.8
  plumage: Layer[]
  variants: Record<string, Layer[]>   // full layer list per variant
  sources: string[]              // measurement tables and tracing references
}
```

Every size lives in `measurements` once; the other blocks carry only shape.
The profile must label `occiput` (the back of the skull, where head length
is measured) and `eye`, plus the stations the rig names.

The schema rejects a label referenced but missing from `profile`, a
`detail.variants` key that is not one of the species' `variants`, and
non-positive sizes. Consistency that needs the built bird (bill tip to tail
tip within 5% of `measurements.length`) is a test over every detailed
species, not a schema rule. Exact field names are settled in the plan; the
shape is fixed here.

Variants hold whole layer lists, not patches. Species files are TypeScript,
so shared layers can be spread in, and each variant reads top to bottom.
Species files stay self-contained: `greyel.ts` beside `lesyel.ts` should
show exactly what separates the two.

## The yellowlegs

Every number and mark here comes from `docs/research/2026-09-24-yellowlegs.md`,
which cites its sources: Ridgway 1919 museum measurements (n = 31 and 25),
the USGS 2023 live-adult dataset (n = 11 and about 320), AVONET, Bent 1927,
All About Birds, and BirdWeb.

### Structure

Greater is about a 1.2x scale-up of Lesser everywhere except the bill,
which is about 1.55x. That one out-of-proportion part is why bill against
head is the classic mark.

| `measurements` | Greater | Lesser |
|---|---|---|
| `length` | 0.31 | 0.25 |
| `culmen` (exposed) | 0.056 | 0.036 |
| `billDepth` (base) | 0.0065 | 0.0043 |
| `billWidth` (base) | 0.0050 | 0.0030 |
| `tarsus` | 0.061 | 0.051 |
| `tibia` (bare part) | 0.035 | 0.029 |
| `toe` (middle, no claw) | 0.035 | 0.029 |
| `wingChord` | 0.188 | 0.155 |
| `tail` | 0.077 | 0.063 |

Metres. Head length (occiput to bill base) is not an input: it comes out of
the traced profile, and the tests hold it near 0.038 (Greater) and 0.0305
(Lesser).

Shape, per the sources: Greater's bill is thicker-based and faintly
upturned on the distal half (`curve` small and positive); Lesser's is thin
and straight (`curve` 0). The tail is nearly square in both. Wingtips sit at
or just past the tail tip, Lesser's a little further; no source gives a
number, so the wrist position and wing outline are traced from photos and
the projection is checked, not set. Greater is "large
and lanky", long-necked, heavy-chested; Lesser is "slender", "dainty", and
small-headed, with legs about 5% longer for its body size.

### Plumage: juvenile, both

By late September adult Lessers have left the Pacific Northwest and the
birds passing are juveniles. Greater juveniles peak continent-wide in late
September and keep juvenal plumage into October. Two juveniles is also the
fair comparison: same plumage stage, so the separating marks are
structure, bill, streaking, and flanks.

| Layer | Greater | Lesser |
|---|---|---|
| Bill | dark, a subtle grey base on the lower mandible | all dark |
| Neck and upper breast | crisp, dark streaks | fine, pale, blurred streaks over a grey-brown wash |
| Flanks | dusky bars | plain |
| Upperparts | brown-grey, bold white spots and notches | brown-grey, finer and more regular pale spots and notches |
| Tertials | white notches along the edges | pale notches along the edges |
| Face | white eye-ring, pale supraloral | the same, with a slightly darker cap |
| Legs | bright yellow | bright yellow |
| Rump and tail | white rump, barred tail, no wing stripe | the same |

### Field-guide text

Both species' `marks` are rewritten as a contrasting pair, since the guide
is where players learn the difference. The contrasts they carry:

- **size:** Greater tall and lanky, about twice the weight; Lesser slim and
  dainty, clearly smaller when the two stand together.
- **bill:** Greater's about one and a half times the head, thick-based,
  often faintly upturned, greyish at the base; Lesser's thin, straight, all
  dark, only a little longer than the head.
- **head:** both with a white eye-ring; Lesser small-headed with a slightly
  capped look.
- **body:** Greater with crisp dark streaks on neck and breast and barred
  flanks; Lesser with fine, blurry breast streaks and plain flanks.
- **legs:** both long and bright yellow; Lesser's longer for its size.

### Catalog and cast

- `data/species-allowlist.json` gains `"lesyel": ["wetland", "shoreline"]`;
  the allow-list, taxonomy, media, and build-birds steps bring in its
  photos, calls, and attribution. The harvest needs the user's API keys, so
  it runs only with their go-ahead.
- New zone `shallows`: `[[17, -9.5], [24, -9.5], [24, -10.6], [17, -10.6]]`,
  just past the mudflat's water edge, about 22 m from the vantage. The
  ground there runs from +0.05 to -0.13 m against water at 0: ankle-deep.
- Cast: `greyel` x2 and `lesyel` x1, both `wade` in `shallows`. Greater is
  the expected yellowlegs in the valley in fall and Lesser the scarcer one
  (the Willamette Valley checklist rates them "regularly" and
  "occasionally"; iNaturalist has 115 to 15 for 10 to 30 September). The
  old `greyel` entry on `far-shore` goes.
- Besides the per-behaviour wade check, the zone-terrain test holds
  `shallows` ground within -0.15 to +0.08 m, so the birds stand in water,
  not on it or under it.

### Acceptance: `yellowlegs.test.ts`

Measured on the built mesh at rest pose. Head is measured the way USGS
does: total head is bill tip to the rearmost point of the `occiput` ring
along the bill axis; head is total head minus culmen. Millimetres:

| Assertion | Greater | Lesser |
|---|---|---|
| Culmen | 52 to 61 | 30 to 41 |
| Culmen / head | 1.35 to 1.70 | 1.00 to 1.35 |
| Culmen / head, Greater minus Lesser | at least 0.20 | |
| Culmen / tarsus | 0.82 to 1.02 | 0.62 to 0.80 |
| Bill depth at base | 5.5 to 7.0 | 3.6 to 4.6 |
| Bill curve | tip rises, by at most one base depth | tip within 1 mm of straight |
| Tarsus | 55 to 68 | 45.5 to 59 |
| Wing chord | 180 to 205 | 147 to 170 |
| Tail | 71 to 83 | 55 to 67 |
| Total length | 290 to 330 | 230 to 270 |
| Wingtip past tail tip | 0 to 20 | 0 to 20 |
| Projection / wing chord | | at least Greater's |
| Wing, Greater / Lesser | 1.17 to 1.28 | |
| Culmen, Greater / Lesser | 1.45 to 1.65 | |

And on the painted atlas: Greater's bill base is lighter than its tip while
Lesser's bill is uniform; Greater's flank region carries bar contrast and
Lesser's is near-uniform; Greater's neck-streak contrast exceeds Lesser's.

### Known soft spots

- Bare tibia and primary projection have no measured source: tibia is set
  equal to the middle toe (Ridgway's genus note), projection follows from
  the traced wing. The projection bounds are loose on purpose, and the
  tests treat tibia as a sanity bound only.
- Juvenile bill colour is inferred from non-breeding descriptions.
- Measurements are adult. Three hatch-year Lessers measured in July and
  August had shorter bills (31.5 to 34.1 mm); whether juveniles close that
  gap by late September is unconfirmed, so the model uses adult means.
- Greater's bill-to-head ratio rests on 7 live birds; it agrees with the
  field guides' "about 1.5x".

## Dev viewer

A dev-only page at `/viewer.html` (Vite serves it; the production build
only includes `index.html`).

- **Two slots at true scale**, each with a species and plumage picker.
- **Camera:** orbit, with side, front, top, and three-quarter presets.
- **Light:** the game's `createLighting` over a neutral ground, with an
  optional shallow-water plane.
- **Pose:** sliders for `neckExtend`, lean, `wingSpread`, `wingPhase`; a
  walk toggle that advances `strideDistance` to check the gait for foot
  sliding.
- **Field view:** renders the pair at 22 m (the shallows) or 65 m (the far
  shore) through the telescope
  (2 degrees) or binoculars (7.5 degrees) at the game canvas resolution.
  This is the real check.
- **Authoring aids:** a reference photo behind the side view (local file,
  never committed) with opacity and scale; station points, labels, and
  spine; wireframe, skeleton, UV checker, flat atlas view.
- **Measurements** read from the built mesh (total length, culmen,
  bill-to-head ratio, tarsus), using the same functions as the tests.
- **Hot reload:** editing a species file rebuilds the model.

During implementation the viewer is also the feedback loop: Playwright
screenshots compared against the catalog's own credited reference photos.

## Testing

- **Contract suite** shared by both builders (moved out of
  `procedural.test.ts`): named parts in the group, standing feet at the
  origin, sensible `center` and `radius`, `pose()` moves wings and head, the
  head never inherits neck scale. A `partBox()` helper measures a part's
  geometry for either builder (for the detailed one, the skinned vertices
  bound to that part's bones). The block builder's folded-wing check stays
  block-only; the detailed wings have their own tests (the folded shell
  lies outside the flank, the projection bounds above).
- **every detailed species:** bill tip to tail tip within 5% of
  `measurements.length`; built culmen, tarsus, bare tibia, wing chord, and
  tail each match their measurement.
- **profile:** the spline passes through every station; arclength rises
  monotonically; labels resolve; mm-per-texel is right.
- **loft:** bounds match the traced profile; v = 0 lies on the back
  midline; skin weights sum to 1 and blend across the neck.
- **bill:** built length equals the culmen; positive curve raises the tip.
- **gait and IK:** IK reaches its target; the joint always bends backward;
  `gait = 0` gives the standing pose; over half a stride the stance foot
  stays fixed in world space while the group advances by `strideDistance`.
- **painter:** each layer changes pixels inside its region and none
  outside; output is deterministic per seed; a 3 mm spot measures the same
  on neck and belly.
- **schema:** the rejections listed under Spec format.
- **wade:** `strideDistance` grows by exactly the distance moved; `gait`
  rises while stepping and falls when still.
- **zones:** the `shallows` polygon passes the zone-terrain test.
- **`yellowlegs.test.ts`:** the goal as assertions (see The yellowlegs).

What tests cannot check is whether a birder can tell them apart. That is
the viewer's field view during the work, and finally the user at the
telescope in-game.

## Errors

Species specs are static and parsed at module load; `species.test.ts`
covers every file, so a bad `detail` block fails `npm test` and
`npm run build` with a readable zod message. There is no runtime fallback
to blocks for a detailed species: it would hide exactly the bugs this work
is about.

## Performance

- One draw call per detailed bird, plus its shadow pass.
- About 6k triangles per bird (loft about 2.5k, legs and toes about 1.5k,
  wings, bill, tail the rest); about 300k when all 50 or so birds convert.
- About 20 bones per bird, skinned on the GPU.
- The dev overlay adds paint time and texture memory. Acceptance: 60 fps
  on the integrated GPU, measured before and after.

## Build order (for the plan)

1. `PoseState` stride fields; `wade` drives them.
2. Detail schema and profile interpolation.
3. Loft, rig, skinning, `buildDetailedBird` with base colour only; the
   factory; the shared contract suite.
4. Dev viewer, early, so everything after is seen as it is built.
5. Bill, eye, wings, tail.
6. Legs, IK, gait.
7. Atlas, layers, painter.
8. Greater Yellowlegs `detail`: measurements, traced profile, plumage.
9. Lesser Yellowlegs: allow-list, harvest (needs the user's keys; ask
   first), species file with `detail`.
10. `shallows` zone and cast changes.
11. `yellowlegs.test.ts`, performance check, main spec amendments, the
    in-game telescope check with the user.

## Future rounds (not in this spec)

The remaining species, one family at a time; skinned flocks (geese and
pelicans); species-true motion (feeding styles, alarm bob, tip-ups);
multiple plumages per species; flight-quality wings.
