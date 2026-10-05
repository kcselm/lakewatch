# Canada Goose, Round 1 (On the Water and on the Grass) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Canada Goose a detailed bird in its late-September plumage that floats on the lake, walks out onto a new grassy flat to graze, and walks back in: one amphibious model passing smoothly between its float and its feet, a goose's waddle, and a family whose every bird keeps its own rhythm of grazing and looking up.

**Architecture:**
- **The builder:** an amphibious detailed bird, built floating with its legs built standing. `PoseState.afloat` (1 floating, 0 on its feet) raises the root from the float to the standing height, turns the body about its hips rather than the water, and blends each leg bone from folded to the IK stance. `detail.waddle` rolls the body toward the planted foot in time with the stride. Every existing bird builds and poses exactly as before.
- **The water:** each bird's registry entry reads whether it floats this frame from its pose, so a goose wading out gets the wader's ring and a goose on the water the swimmer's contact line and wake.
- **The behaviour:** a `goose` style on `swim`. On the water each goose swims as a dabbler, from the goose's own settings. A family (the cast entry's first group) turns for the shore after its gander, wades out in a loose file with its `y` and `afloat` taken from the ground, stands, walks out, and grazes, each bird keeping its own head-down and head-up bouts by its role; then it walks back in. A loose unit stays on the water.
- **The scene:** a low grassy flat on the right shore past the mudflat, sloping into the water at 1 in 4 where the basin's rim stood a metre high, a grazed lawn on it, the `goose-flat` and `goose-water` zones, and eight geese in the cast.
- **The bird:** the Canada Goose traced, measured, and painted by a procedure, held to a test file written here from its research.

**Tech Stack:** Vite 8, TypeScript 7, Vitest 5 (`environment: 'node'`), Three.js 0.186, zod 4, Preact.

**Spec:** `docs/superpowers/specs/2026-09-30-canada-goose-design.md`. Read it first.
- Every number and mark comes from the research, `docs/research/2026-09-30-canada-goose.md`: section 9 holds the numbers for the model, 10 the test thresholds, 11 the style's settings, and 8 the tracing references. It is committed with this plan.
- The detailed builder is described in `docs/superpowers/specs/2026-09-24-detailed-birds-design.md`, its swimming additions in `docs/superpowers/specs/2026-09-26-swimmers-design.md`, and the neck chain in `docs/superpowers/specs/2026-09-27-herons-design.md`.
- The herons' plan, `docs/superpowers/plans/2026-09-27-herons.md`, shows the conventions this one follows; the swimmers' plan, `docs/superpowers/plans/2026-09-26-swimmers.md`, Task 14, is the fullest account of tracing a bird in the viewer.

## How this plan was checked

- **The research came first.** `docs/research/2026-09-30-canada-goose.md` is written and committed with this plan; its photo measurements were read on the tracing references of its section 8.
- **Part 1 (Tasks 1-5)** was written in a scratch worktree of `da1d261` (this plan's spec commit) with the research committed on it, one commit per task, with `npm test && npx tsc --noEmit -p .` green at every commit and the style's and the flat's numbers taken from the research. Each task's edit blocks were generated from its commit, so the text is the code that ran.
- **The assembled Part 1 was replayed in order** from this text alone by a script, on a fresh worktree of `da1d261` with the research committed: every edit applied verbatim (each replaced text appears exactly once), every "see it fail" step failed as written, every "see it pass" step passed, and the tree after each task matched the scratch commit's exactly. Test counts in the text are the replay's.
  - The whole suite: 1064 at the base; Task 1: 1083 · Task 2: 1084 · Task 3: 1086 · Task 4: 1113 · Task 5: 1123.
- **While planning, the goose was looked at, not just tested:**
  - The test goose (Task 1's fixture, given to `cangoo` in an uncommitted scratch edit) in the viewer, side-on: afloat on the lake; standing on its feet beside a Mallard; half afloat in 12 cm of water, its legs half unfolded; grazing with the body tipped 0.3 rad; and walking from the front, the body rolling toward the planted foot. Nothing jumped on the afloat slider.
  - The block geese of Task 5 through the game's binoculars at the flat, about 40 m off: the flat's lawn and its slope to the water, the gentle bank behind it, and the family grazing on it, still block swimmers (no legs), as they stay until Task 6. The water time was shortened in an uncommitted scratch edit to see them walk out.
- **The ring budget was run with the geese at 60 frames a second**, ten minutes each on seeds 42, 7, and 11 (the whole cast's ringers, as `src/birds/cast.test.ts` gathers them): without the geese the live rings averaged 33-35 and peaked at 52-56 of the 64; with the eight geese on the water all the time (the test's ground is a metre down everywhere, so they never find a bank) 37-39 and 57-60; with them going ashore on the real terrain 37-38 and 56-61. Nothing was pushed out in any run.
- **Part 2 and Part 3** are written as procedures. The goose's test file is given in full here, from its research's section 10 and the spec's species tests. It and Task 6's edits to the shared tests were typechecked against the real APIs on top of Part 1; the test file fails only because `cangoo` has no `detail` block yet. Run against the test goose (given to `cangoo` in an uncommitted scratch edit), it ran every test to an answer: ten passed and nine failed on the test goose's untraced shape, among them the ones that need tracing (the erect crown, the graze, the neck's folds in a head-dip).
- If a step's output differs from what the plan says, stop and find out why rather than adjusting the test.

## Decisions made while planning

- **An amphibious bird says so: `detail.amphibious: true`** (Task 1). The spec defined one as "a species with both `float` and the standing legs' measurements", but every detail block has a tarsus, tibia, and toe, so every swimmer would have qualified. The flag needs `float`, and the species' posture stays `swimming`.
- **An amphibious bird is built floating, and stands by moving its root** (Task 1). Its mesh, its waterline, and its pivot are exactly a floating build's, so at `afloat` 1 it is that build (the test holds every loft vertex to a nanometre). Standing, the root rises by `ashore`, the offset that puts the hips over the origin and the feet on y = 0 where a standing build of the same bird puts them, and the body turns about its hips (a test holds the loft, the bill, and the legs to a standing build's, to a micrometre, standing, walking, and grazing). Between, the root rises in proportion to `afloat`, the body's pivot moves from the water to the hips, and each leg bone's turn blends from the IK stance to the swimmer's fold.
- **The legs grow as the bird comes ashore rather than switching on** (Task 1). Afloat with its feet still, the legs are hidden by bone scale, as a swimmer's are; a switch at `afloat` just under 1 would have jumped every leg bone 0.12 m. They grow to full size over the first quarter of the way ashore, folded and under the water, so no bone jumps, which the spec's guard asks.
- **How `y` and `afloat` follow the ground** (Task 4, `footing`): no deeper than `wade.stand` (the built bird's float waterline above its feet, about 0.14-0.16 m) the goose stands on the bed, `afloat` 0; from `wade.float` (0.2 m, the swim zones' band) down it floats, `afloat` 1, `y` 0; between, its body stays on the water while its feet leave the bed and fold, `afloat` rising with the depth and `y` rising from the bed to the surface. The spec had the feet on the bed all through the strip between; with that, the legs would have had to reach further than they stand, and fold at once at the strip's deep edge.
- **The waddle rolls a standing bird too** (Task 1). It is a detail field like any other; every shipped bird's is 0, so nothing moves.
- **`PoseState` gains exactly `afloat`** (default 1). **`BirdInstance` gains `floating`** (Task 3), read from the bird's own pose, which the spawner now registers with it; the spawner sets `afloat` 0 on every bird not cast to swim, so a heron's, a yellowlegs', and a dowitcher's look is what it was.
- **The goose swims as a dabbler by handing the dabbler its body** (Task 4). `createDabbler` takes an optional swimmer's body, made by default exactly as before (the same random draws in the same order, so every dabbler swims as it did); the goose makes its own, hands it to a dabbler while on the water, moves it itself ashore, and makes a new dabbler each time it comes back in, after a loaf.
- **The cast's new fields are `ashore` and `groups`** (Task 4). The first group is a family (a pair and at least one young), every later one a loose unit of adults; an entry without `groups` is one family. `validateCast` holds a goose entry to an `ashore` polygon that exists, no other entry to `ashore` or `groups`, and `groups` to the count.
- **The family and the loose unit are one flock** (Task 4): one flock target and 0.8 m between any two of the eight on the water, 1.5 m from every other swimmer. The spec's "1.5 m to other birds" is read as birds of other species and flocks; the research gives the whole group of eight a 3 m flock radius.
- **The way ashore is a straight line across the bank** (Task 4, `findCrossing`): from a spot 0.5 m inside the water zone, square to its nearest edge, to a spot 0.5 m inside the ashore zone, its ground no steeper than 1 in 2 at any 0.25 m step and its gap no wider than 8 m (banks over 0.5 m and 60 degrees stop geese, Cooper 1998). The family queues for it in file; a bird wading out starts from wherever it left the file, within a metre of the crossing's water end, so the zone test allows 1.05 m off the line.
- **The settings the built bird decides live in the style's table** (Tasks 4 and 6), as the heron's `strike.ahead` did: the standing `neck.stand` (the spec had "a `neckExtend` the species file gives"), `wade.stand`, `rings.ahead`, `graze.lean` and `graze.reachAngle`. Task 6 sets each from the traced bird, and its test holds the first three to it.
- **The style comes before the flat, and the cast entry comes with the flat** (Tasks 4 and 5; the spec's build order had the flat, then the water, then the style, with the cast in the finish). The flat's zone tests read the style's `wade.float` and `findCrossing`; the zone tests walk the cast, the ring budget runs the cast, and the geese could only be seen on the flat with the entry in place. Task 7 keeps the rest of the finish.
- **The flat** (Task 5): `FLAT = { x: [30, 44], z: [-24, -8], top 0.3 m, rough 0.08 m, slope 1 in 4 }`, its shoreline the line through (27.6, -10) and (43.8, -26), which is the basin's rim where the old bank stood a metre high and runs along the terrain mesh's cell diagonals. It is blended in after the bench, as the bench and the mudflat are. Its lake sides ease back within a metre; its land sides over 4 m, because a metre there left a 1.2 m wall behind the flat that the binoculars showed plainly. `goose-flat` is `[[31, -9], [43, -9], [43, -22.6], [31, -10.9]]`, 32-49 m from the vantage (its middle 39 m); `goose-water` is `[[28, -14.5], [35, -21.5], [32, -27], [24, -20]]`; the bank between them is 4-5 m wide.
- **The flat's lawn** (Task 5): `Heightfield.lawn(x, z)` marks the flat's dry ground, `terrainColor` takes it as a third argument so the ground there is grass however low it lies, and `createGrass` takes a blade height and width: the lawn's are 6 cm and 12 mm, out of the mirror as the near grass is.
- **The geese's step is as long as the built leg allows** (Tasks 1 and 6). The research's `stepLength` of 1.3-1.6 divided its 0.13-0.18 m step by the bare tibia and tarsus (0.107 m); the builder's leg runs from the hip inside the body, 0.17 m on the test goose, and steps longer than 0.11 m (`stepLength` 0.65) slide its stance foot. Task 6 picks the goose's from its own leg; the planted-foot test decides.
- **The neck keeps its length, so the erect crown comes from the slack in the traced S** (Task 6). With the test goose's five-joint neck in a gentle S the crown rose 150 mm above the back at rest and 179 mm erect; a six-joint S with more slack reached 236 mm (255 mm with the body tipped up 0.15 rad) before its bends folded the skin 5 mm. The goose test asks 250-450 mm. Task 6 traces the floating S with what slack the photos show and may tip the body up on the alert, as the herons' Task 6 did; if it can't reach 250 mm inside the guards, it stops and reports. A neck that lengthens as it straightens (a goose's does, inside its feathers) was not added: the spec's guards keep lengths, and the black stocking would hide the stretch.
- **The family's water time gates on every bird being back** (Task 4): the gander's clock starts the next trip only when all five swim as dabblers again, so a stage's length runs from when the last of them settles.
- **The call rate is checked in Task 7, not changed blind.** The scheduler calls for each goose every 15-45 s; with eight in reach that is a call every 3.75 s on average. Task 7 listens and, if it is too often for a loafing family, lengthens `cangoo`'s to 60-180 s (an estimate; the research found no call rate).

## Global Constraints

- **Frame rate:** 60 fps on an integrated GPU in Chrome, with every bird on screen. A detailed bird is one draw call (plus its shadow pass).
- **Art direction:** field-guide plate. Exact structure and painted field marks; no photo textures on any mesh. Patterns come from data (`detail.plumage`).
- **Interfaces:**
  - `BirdModel` does not change.
  - `PoseState` gains exactly `afloat` (default 1). With the defaults every existing species poses exactly as before.
- **Existing birds unchanged:** the geometry, pose, and atlas prints of the fourteen shipped detailed birds (`fingerprint.test.ts`) do not move in Part 1. Part 2 adds the goose's prints.
- **Units:** metres for every size in `detail` and the style's settings, degrees for `neckShapes` and `waddle`, radians in `PoseState` and the style's leans, millimetres for pattern sizes in a layer, seconds for times.
- **Validation:** species specs are validated when the module loads; a detailed species never falls back to blocks at runtime. `validateCast` checks a style's behaviour and the goose's fields.
- **Zones:** convex polygons. Zone tests sample `terrainSurface`, the rendered mesh.
- **Reference photos:** downloaded outside the repo, in the scratchpad's `ref/cangoo/`, and never committed. The species' `sources` credits each photographer and licence.
- **Tests:** Vitest runs in `environment: 'node'`: no DOM, no WebGL, no Worker. Rendering is checked by eye in the viewer and the game, with Playwright screenshots where a step asks.
- **Commits:** every commit leaves `npm test` and `npx tsc --noEmit -p .` green. Never commit `node_modules`, `.env`, `dist`, `data/raw`, `.wrangler`, or `.playwright-mcp`.
- **Worktrees:**
  - `npm ci` in each worktree. **Never a symlink or junction**: a forced worktree removal on Windows deletes through one.
  - **Never `git stash`**: the stash is shared by every worktree.
- **Line endings:** the repo's files are CRLF in the working copy (`core.autocrlf` is true). Edit with tools that keep them.

## Review Focus

Inputs the spec implies that no task's own feature tests would otherwise exercise, each pinned to a test in the owning task:

1. **Every existing bird, and `afloat` on them.** No shipped bird's mesh, pose, or atlas moves; a standing bird and a swimmer pose exactly as they did whatever `afloat` says. Task 1: the fingerprints, and "every other bird ignores afloat".
2. **A hand-kept viewer link from before this round.** It opens as it did, the new `afloat` at its default 1. Task 2: the viewer's old-link test (its defaults now carry `afloat: 1`).
3. **A goose that turns for the shore in the middle of a tip-up or a head-dip.** The pose eases out of it without a jump. Task 4: the 60 fps test over every bird and every phase, which caught exactly this (a head coming up out of the water in one frame) while planning.
4. **A family crowding at the shore.** No two of the family come closer than 0.4 m on the bank, nor closer than the flock's spacing on the water, and none ever leaves its zones but by its crossing. Task 4: the spacing and zone tests over three families' two hours of short trips.
5. **A bank too steep to climb.** The family finds no crossing and stays on the water. Task 4: `findCrossing`'s cliff test and the no-ashore test.
6. **The whole cast's rings with eight geese that never go ashore.** No ring is pushed out before it fades. Task 5: the ring budget with the geese in it.

---

## Interfaces between the tasks

Collected here so an implementer of one task can see the names neighbouring tasks use.

- **`PoseState.afloat`** (Task 1): 0..1, default 1; ignored by every bird that isn't amphibious.
- **`detailSchema`** (Task 1): `amphibious?: boolean` (needs `float`; the species' posture `swimming`), `waddle?: number` (degrees, 0-20, default 0).
- **`build.ts`** (Task 1): `LEGS_OUT = 0.25`; the amphibious bird's `ashore` root offset; `legTurns(dx, dy)`, `standUp(a)`, `amphibiousLegs(st, a)`, `waddleRoll(st, a)` inside `buildDetailedBird`.
- **`fixture.ts`** (Task 1): `TEST_GOOSE_DETAIL`, `TEST_GOOSE_SPEC` (code `testgoose`, a five-joint neck, `stepLength` 0.65, `waddle` 5).
- **`ViewerState`** (Task 2): `afloat` (0..1, default 1); `FIELD_VIEWS.bino35`; neck-shape presets `graze` and `head-dip`.
- **`BirdInstance.floating`** (Task 3): the registered pose's `afloat` above one half; `BirdRegistry.add({ ..., pose? })`.
- **`birds/spec.ts`** (Task 4): `SWIM_STYLES` gains `'goose'`.
- **`location/schema.ts`** (Task 4): a cast entry's `ashore?: string` and `groups?: number[]`.
- **`behavior/types.ts`** (Task 4): `BehaviorContext.ashore?: Zone`, `BehaviorContext.unit?: { unit: GooseUnit; place: number }`.
- **`behavior/swimmer.ts`** (Task 4): `type Swimmer`. **`behavior/dabbler.ts`**: `createDabbler(ctx, x, z, S?, b?)`.
- **`behavior/goose.ts`** (Task 4): `GooseSettings` (a `DabblerSettings` with `rings.wade`, `wade { stand, float }`, `trip`, `graze`, `neck { stand, walk }`, `shore { slope, gap }`); `CANADA_GOOSE`; `gooseFor(species?)`; `GooseUnit`; `gooseUnits(groups)`; `placeIn(units, index)`; `roleOf(unit, place)`; `footing(ground, wade)`; `Crossing`; `findCrossing(water, ashore, ground, S, rng, near?)`; `nearestIn(x, z, points)`; `GooseController` (`role`, `phase`, `spot`, `goOut()`, `goBack()`); `createGoose(ctx, x, z, S?)`. Phases: `water`, `file`, `wadeOut`, `stand`, `walk`, `graze`, `walkBack`, `wadeIn`, `settle`; grazing states `headDown` and `headUp`.
- **`birds/spawn.ts`** (Task 4): `Individual` gains `ashore?`, `groups?`, `index?`.
- **`world/heightfield.ts`** (Task 5): `FLAT`, `flatShoreDistance(x, z)`, `Heightfield.lawn?(x, z)`, `lakeHeightfield(seed, { bench?, shelf?, flat? })`, `terrainColor(y, slope, lawn = 0)`. **`world/vegetation.ts`**: `createGrass(points, wind, { height?, width? })`.
- **`data/locations/lake.json`** (Task 5): zones `goose-flat`, `goose-water`; the cast entry `{ "species": "cangoo", "behavior": "swim", "zone": "goose-water", "ashore": "goose-flat", "count": 8, "groups": [5, 3] }`.
- **`goose.test.ts`** (Task 6, `src/birds/species/`): its `POSES` (the style's poses at their fullest), `backNow`, `crownAboveBack`, and the kit's `built`, `atlas`, `within`, `draftShare`.

---

# Part 1: the shared pieces

### Task 1: The amphibious bird, `afloat`, and the waddle

**Files:**
- Create: `src/birds/detail/amphibious.test.ts`
- Modify: `src/birds/model.ts`, `src/birds/spec.ts`, `src/birds/detail/spec.ts`, `src/birds/detail/build.ts`,
  `src/birds/detail/fixture.ts`

**Interfaces:**
- Consumes: `buildDetailedBird`, `legLayout`, `solveLeg`, `legOffsets`, `STANCE`, `SWIM_TIBIA`, `SWIM_TARSUS`, `billTipNow`,
  `TEST_SPEC`, `TEST_SWIM_SPEC`.
- Produces:

```ts
// src/birds/model.ts, PoseState (default 1): an amphibious bird's 1 floating .. 0 on its feet; every other bird ignores it
afloat: number

// detailSchema
amphibious?: boolean      // a swimmer that also stands and walks; needs float, and the species' posture is swimming
waddle?: number           // degrees, 0..20: the body's roll toward the planted foot at a full walk; default 0

// src/birds/detail/fixture.ts
export const TEST_GOOSE_DETAIL: DetailSpec, TEST_GOOSE_SPEC: SpeciesSpec      // code 'testgoose'
```

How an amphibious bird poses:
- **Built floating.** Its mesh, waterline, and pivot are a floating build's: the traced waterline on y = 0, the middle of
  the body at the water over the origin. Its legs are built standing, from `measurements`, with webbed feet.
- **`afloat` 1** is that floating build exactly: the legs folded back as a swimmer's are built (the tibia straight down,
  the tarsus and the toes trailing), hidden by bone scale unless `paddle` is above 0, and following the body; `gait`
  ignored.
- **`afloat` 0** is a standing build: the root moves by `ashore`, the offset that puts the hips over the origin and the
  feet on y = 0 exactly where a standing build of the same bird puts them; the body turns about its hips; the legs
  stand and walk by IK from the root.
- **Between,** the root moves in proportion, the body's pivot moves from the water to the hips, the legs follow the body
  in proportion, and each leg bone's turn blends linearly from the IK stance to the fold. The legs grow from their hidden
  scale to full size over the first `LEGS_OUT` (a quarter) of the way ashore, still folded and under the water, so no
  bone jumps as they appear (a decision made while planning: a switch would have moved every leg bone 0.12 m in one step).
- **The waddle:** at a full walk the body rolls `waddle` degrees toward the planted foot when it is mid-stance, once a
  step, from the same stride phase the legs keep; in proportion to `gait`, and to how far the bird is on its feet. Every
  shipped bird's waddle is 0, and with it the roll isn't even added, so nothing moves.

The test goose is about a Canada Goose's size: 0.69 m bill tip to tail tip floating, the back 137 mm above the water, the
crown 287 mm, a draft of 64 mm; a five-joint neck in a gentle S; a tarsus of 92 mm and a toe of 82 mm. Its neck shapes
and its paint are set by eye for the builder's tests, not traced. Its `stepLength` is the longest its leg (0.17 m from the
hip, inside the body, to the foot) takes without its stance foot sliding: 0.65, steps of 0.11 m.

- [ ] **Step 1: The test goose and the failing tests**

Create `src/birds/detail/amphibious.test.ts`:

```ts
import * as THREE from 'three'
import { buildDetailedBird, type DetailedBirdModel } from './build'
import { detailSchema } from './spec'
import { billTipNow } from './measure'
import { RINGS, RADIAL } from './loft'
import { STANCE } from './gait'
import { TEST_GOOSE_DETAIL, TEST_GOOSE_SPEC, TEST_SPEC, TEST_SWIM_SPEC } from './fixture'
import { parseSpeciesSpec } from '../spec'
import { defaultPose, type PoseState } from '../model'

type Patch = Partial<Omit<PoseState, 'lean'>> & { leanX?: number; leanZ?: number }
function posed(patch: Patch = {}): PoseState {
  const { leanX = 0, leanZ = 0, ...rest } = patch
  const p: PoseState = { ...defaultPose(), ...rest }
  p.lean.set(leanX, 0, leanZ)
  return p
}

const LEGS = ['legs', 'tibiaL', 'tarsusL', 'toesL', 'tibiaR', 'tarsusR', 'toesR']
const bone = (m: DetailedBirdModel, name: string) => m.mesh.skeleton.bones.find(b => b.name === name)!
const boneAt = (m: DetailedBirdModel, name: string) => { m.group.updateMatrixWorld(true); return bone(m, name).getWorldPosition(new THREE.Vector3()) }
/** the loft's skin as the last pose() left it: the geometry's first RINGS x RADIAL vertices */
const loft = (m: DetailedBirdModel) => {
  m.group.updateMatrixWorld(true)
  return Array.from({ length: RINGS * RADIAL }, (_, i) => m.mesh.getVertexPosition(i, new THREE.Vector3()))
}
const maxApart = (a: THREE.Vector3[], b: THREE.Vector3[]) => Math.max(...a.map((v, i) => v.distanceTo(b[i]!)))

/** The test goose as a plain swimmer, and as a standing bird: the two builds an amphibious bird blends between. */
const FLOATING = parseSpeciesSpec({ ...TEST_GOOSE_SPEC, detail: { ...TEST_GOOSE_DETAIL, amphibious: false } })
const STANDING = parseSpeciesSpec({ ...TEST_GOOSE_SPEC, posture: 'standing', detail: { ...TEST_GOOSE_DETAIL, amphibious: false } })

describe('an amphibious bird in the schema', () => {
  it('accepts the test goose, and needs a waterline to float on', () => {
    expect(detailSchema.parse(TEST_GOOSE_DETAIL).amphibious).toBe(true)
    expect(() => detailSchema.parse({ ...TEST_GOOSE_DETAIL, float: undefined })).toThrow(/amphibious bird needs float/)
  })
  it('is built floating, so its posture is swimming', () => {
    expect(() => parseSpeciesSpec({ ...TEST_GOOSE_SPEC, posture: 'standing' })).toThrow(/amphibious bird is built floating/)
  })
  it('waddles no more than 20 degrees, and not at all unless it says so', () => {
    expect(() => detailSchema.parse({ ...TEST_GOOSE_DETAIL, waddle: 25 })).toThrow()
    expect(() => detailSchema.parse({ ...TEST_GOOSE_DETAIL, waddle: -1 })).toThrow()
    expect(detailSchema.parse(TEST_SPEC.detail!).waddle).toBeUndefined()
  })
})

describe('an amphibious bird afloat', () => {
  const FLOAT_POSES: Record<string, Patch> = {
    rest: {},
    loafing: { neckExtend: 0 },
    alert: { neckExtend: 1 },
    'head-dip': { reach: 1, neckExtend: 1, reachDepth: 0.2, leanX: 0.1 },
    'tip-up, paddling': { leanX: 1.36, tailTilt: 0.4, paddle: 1, paddlePhase: 0.3 },
    // a walk asked of a floating bird changes nothing: gait is ignored afloat
    'walking, ignored': { gait: 1, strideDistance: 0.1 },
  }
  it('is the floating build of the same bird: its body, its bill, and its legs\' joints where that bird has them', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC), f = buildDetailedBird(FLOATING)
    for (const [name, patch] of Object.entries(FLOAT_POSES)) {
      m.pose(posed(patch)); f.pose(posed(patch))
      expect(maxApart(loft(m), loft(f)), name).toBeLessThan(1e-9)
      expect(billTipNow(m).distanceTo(billTipNow(f)), name).toBeLessThan(1e-9)
      for (const b of LEGS) expect(boneAt(m, b).distanceTo(boneAt(f, b)), `${name}: ${b}`).toBeLessThan(1e-9)
      expect(bone(m, 'legs').scale.x, name).toBe(bone(f, 'legs').scale.x)
    }
  })
  it('hides its legs under the water while it floats with its feet still, and grows them back as it comes ashore', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    m.pose(posed())
    expect(bone(m, 'legs').scale.x).toBeLessThan(0.01)
    m.group.updateMatrixWorld(true)
    const index = m.mesh.geometry.getAttribute('skinIndex') as THREE.BufferAttribute
    const legBones = new Set(LEGS.map(n => m.mesh.skeleton.bones.indexOf(bone(m, n))))
    let legVerts = 0
    for (let i = 0; i < index.count; i++) {
      if (!legBones.has(index.getX(i))) continue
      legVerts++
      expect(m.mesh.getVertexPosition(i, new THREE.Vector3()).y).toBeLessThan(0)
    }
    expect(legVerts).toBeGreaterThan(100)
    for (const patch of [{ paddle: 0.5 }, { afloat: 0.75 }, { afloat: 0 }]) {
      m.pose(posed(patch))
      expect(bone(m, 'legs').scale.x, JSON.stringify(patch)).toBe(1)
    }
    // and in between they grow, still folded under the water, so nothing jumps as they appear
    m.pose(posed({ afloat: 0.9 }))
    expect(bone(m, 'legs').scale.x).toBeCloseTo(0.4, 9)
  })
})

describe('an amphibious bird on its feet', () => {
  const STAND_POSES: Record<string, Patch> = {
    rest: {},
    alert: { neckExtend: 1 },
    'walking, a stride in': { gait: 1, strideDistance: 0.07 },
    'easing into a walk': { gait: 0.4, strideDistance: 0.13 },
    grazing: { reach: 1, reachAngle: 1.2, leanX: 0.3 },
  }
  it('stands where the standing build of the same bird stands: the body, the bill, and the legs, walking and grazing', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC), s = buildDetailedBird(STANDING)
    for (const [name, patch] of Object.entries(STAND_POSES)) {
      m.pose(posed({ ...patch, afloat: 0 })); s.pose(posed(patch))
      // the skin is stored in float32, a different number for each build's frame: to a micrometre
      expect(maxApart(loft(m), loft(s)), name).toBeLessThan(1e-6)
      expect(billTipNow(m).distanceTo(billTipNow(s)), name).toBeLessThan(1e-6)
      for (const b of LEGS.slice(1)) expect(boneAt(m, b).distanceTo(boneAt(s, b)), `${name}: ${b}`).toBeLessThan(1e-6)
    }
  })
  it('plants its stance foot as it walks: the foot stays put in the world while the bird walks over it', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    const stride = 2 * TEST_GOOSE_DETAIL.stepLength! * (m.layout.tibia + m.layout.tarsus)
    m.pose(posed({ afloat: 0 }))
    const xs: number[] = []
    // the walk starts from the neutral phase: the right foot's whole stance is 0.2 to 0.8 of a stride
    for (const f of [0.22, 0.3, 0.4, 0.5, 0.58, 0.68, 0.78]) {
      m.group.position.x = f * stride
      m.pose(posed({ afloat: 0, gait: 1, strideDistance: f * stride }))
      xs.push(boneAt(m, 'toesR').x)
    }
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(1e-4)
  })
  it('has its feet on the origin\'s ground plane, the hips over the origin', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    m.pose(posed({ afloat: 0 }))
    for (const toes of ['toesL', 'toesR']) expect(boneAt(m, toes).y).toBeCloseTo(m.layout.footY, 6)
    expect(boneAt(m, 'tibiaR').x).toBeCloseTo(0, 9)
    // and the bill reaches the ground in a graze
    m.pose(posed({ afloat: 0, reach: 1, reachAngle: 1.2, leanX: 0.3 }))
    expect(billTipNow(m).y).toBeCloseTo(0, 3)
  })
})

describe('between afloat and on its feet', () => {
  /** every bone's place, and the bill tip's, at each of `steps` + 1 even steps of afloat from 1 to 0 */
  function sweep(steps: number, patch: Patch = {}): THREE.Vector3[][] {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    return Array.from({ length: steps + 1 }, (_, k) => {
      m.pose(posed({ ...patch, afloat: 1 - k / steps }))
      m.group.updateMatrixWorld(true)
      return [...m.mesh.skeleton.bones.map(b => b.getWorldPosition(new THREE.Vector3())), billTipNow(m)]
    })
  }
  /** the furthest any one point moves in a step */
  const worstStep = (frames: THREE.Vector3[][]) => Math.max(...frames.slice(1).map((f, k) => maxApart(f, frames[k]!)))

  for (const [name, patch] of Object.entries({ standing: {}, walking: { gait: 1, strideDistance: 0.05 }, alert: { neckExtend: 1 } } as Record<string, Patch>)) {
    it(`moves every bone smoothly, ${name}: no step of afloat moves anything more than its share of the way`, () => {
      const coarse = worstStep(sweep(100, patch)), fine = worstStep(sweep(200, patch))
      // the body rises about 0.15 m over the whole way, and the legs, 0.12 m long, grow out over its first quarter: a
      // hundredth of the way moves nothing more than a centimetre
      expect(coarse).toBeLessThan(0.01)
      // and half the step moves it half as far: a jump would move as far however fine the steps
      expect(fine).toBeLessThan(0.6 * coarse)
    })
  }
  it('raises the body from its float to its standing height in proportion to afloat', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    const hip = (afloat: number) => { m.pose(posed({ afloat })); return boneAt(m, 'body').y }
    const [afloat, half, ashore] = [hip(1), hip(0.5), hip(0)]
    expect(ashore - afloat).toBeGreaterThan(0.1)
    expect(half).toBeCloseTo((afloat + ashore) / 2, 9)
  })
  it('holds afloat to 0..1', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    const bones = () => m.mesh.skeleton.bones.map(b => [...b.position.toArray(), ...b.quaternion.toArray(), ...b.scale.toArray()])
    for (const [wild, tame] of [[3, 1], [-2, 0]]) {
      m.pose(posed({ afloat: wild, gait: 1, strideDistance: 0.03 })); const got = bones()
      m.pose(posed({ afloat: tame, gait: 1, strideDistance: 0.03 })); const want = bones()
      got.forEach((row, i) => row.forEach((v, k) => expect(v).toBeCloseTo(want[i]![k]!, 12)))
    }
  })
})

describe('the waddle', () => {
  const W = THREE.MathUtils.degToRad(TEST_GOOSE_DETAIL.waddle!)
  /** the body's roll and which foot is planted, every 1% of two strides of a full walk, from a quarter of one in */
  function walk(afloat: number) {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    const stride = 2 * TEST_GOOSE_DETAIL.stepLength! * (m.layout.tibia + m.layout.tarsus)
    m.pose(posed({ afloat }))                                 // standing still first: the walk starts from its neutral phase
    return Array.from({ length: 201 }, (_, k) => {
      m.pose(posed({ afloat, gait: 1, strideDistance: (0.25 + k / 100) * stride }))
      const [l, r] = [boneAt(m, 'toesL').y, boneAt(m, 'toesR').y]
      return { roll: bone(m, 'body').rotation.x, planted: Math.abs(l - r) < 1e-9 ? 0 : l < r ? -1 : 1 }
    })
  }
  it('rolls the body toward the planted foot at a full walk, peaking at the waddle once a step', () => {
    const frames = walk(0)
    expect(Math.max(...frames.map(f => f.roll))).toBeCloseTo(W, 3)
    expect(Math.min(...frames.map(f => f.roll))).toBeCloseTo(-W, 3)
    // positive rolls toward +z, the right foot: whenever it rolls more than half way, it rolls toward the foot on the ground
    for (const f of frames) if (Math.abs(f.roll) > W / 2) expect(Math.sign(f.roll)).toBe(f.planted)
    // two peaks a stride, so four over two strides
    let peaks = 0
    for (let k = 1; k < frames.length - 1; k++) {
      const [a, b, c] = [frames[k - 1]!.roll, frames[k]!.roll, frames[k + 1]!.roll].map(Math.abs)
      if (b! > W * 0.99 && b! >= a! && b! > c!) peaks++
    }
    expect(peaks).toBe(4)
  })
  it('rolls with the stride the legs keep: the left foot mid-stance at STANCE / 2 of it', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    const stride = 2 * TEST_GOOSE_DETAIL.stepLength! * (m.layout.tibia + m.layout.tarsus)
    m.pose(posed({ afloat: 0 }))
    // standing still re-anchors the stride at its neutral phase, STANCE / 2: the left foot mid-stance, rolled toward
    m.pose(posed({ afloat: 0, gait: 1, strideDistance: 0 }))
    expect(bone(m, 'body').rotation.x).toBeCloseTo(-W, 9)
    m.pose(posed({ afloat: 0, gait: 1, strideDistance: stride / 2 }))
    expect(bone(m, 'body').rotation.x).toBeCloseTo(W, 9)
    expect(STANCE / 2).toBeCloseTo(0.3, 9)
  })
  it('does not roll standing still or afloat, and rolls in proportion between', () => {
    expect(Math.max(...walk(1).map(f => Math.abs(f.roll)))).toBe(0)
    expect(Math.max(...walk(0.5).map(f => f.roll))).toBeCloseTo(W / 2, 3)
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    m.pose(posed({ afloat: 0, gait: 0, strideDistance: 0.1, leanZ: 0.05 }))
    expect(bone(m, 'body').rotation.x).toBe(0.05)
  })
  it('rolls a standing bird too, when its species says so', () => {
    const waddler = buildDetailedBird(parseSpeciesSpec({ ...TEST_SPEC, detail: { ...TEST_SPEC.detail!, waddle: 4 } }))
    waddler.pose(posed({ gait: 1, strideDistance: 0 }))
    expect(bone(waddler, 'body').rotation.x).toBeCloseTo(-THREE.MathUtils.degToRad(4), 9)
  })
})

describe('every other bird ignores afloat', () => {
  for (const [name, spec] of [['a standing bird', TEST_SPEC], ['a swimmer', TEST_SWIM_SPEC]] as const) {
    it(`${name} poses exactly as it did, whatever afloat says`, () => {
      const m = buildDetailedBird(spec)
      const bones = () => { m.group.updateMatrixWorld(true); return m.mesh.skeleton.bones.map(b => b.matrixWorld.clone()) }
      for (const patch of [{}, { gait: 1, strideDistance: 0.04 }, { reach: 1, leanX: 0.5 }, { paddle: 1, paddlePhase: 0.2 }] as Patch[]) {
        m.pose(posed(patch)); const as = bones()
        m.pose(posed({ ...patch, afloat: 0 })); const zero = bones()
        as.forEach((mat, i) => expect(mat.equals(zero[i]!), JSON.stringify(patch)).toBe(true))
      }
    })
  }
})
```

In `src/birds/detail/fixture.ts`, replace:

```ts
  ...TEST_SPEC, code: 'testheron', commonName: 'Test Heron', length: 0.8, detail: TEST_HERON_DETAIL,
})

```

with:

```ts
  ...TEST_SPEC, code: 'testheron', commonName: 'Test Heron', length: 0.8, detail: TEST_HERON_DETAIL,
})

/**
 * A test goose for the amphibious builder: about a Canada Goose's size (docs/research/2026-09-30-canada-goose.md,
 * sections 2 and 6: a 0.64 m bird floating with its back 0.13 m above the water, its crown about 0.25 m, a draft of
 * 0.06 m; tarsus 92 mm, toe 82 mm), its neck a five-joint chain in a short S, floating on its waterline 35 mm below the
 * traced spine and standing on webbed feet, with a waddle. Its shapes are set by eye for the builder's tests, not traced.
 */
export const TEST_GOOSE_DETAIL: DetailSpec = {
  measurements: {
    length: 0.69, culmen: 0.056, billDepth: 0.024, billWidth: 0.022,
    tarsus: 0.092, tibia: 0.015, toe: 0.082, wingChord: 0.489, tail: 0.151,
  },
  profile: [
    { label: 'rear',     x: -0.235, y: 0.050, up: 0.006, down: 0.020, halfWidth: 0.020 },
    { label: 'rump',     x: -0.220, y: 0.045, up: 0.028, down: 0.050, halfWidth: 0.055 },
    { label: 'tailBase', x: -0.195, y: 0.035, up: 0.050, down: 0.075, halfWidth: 0.085 },
    { label: 'hip',      x: -0.030, y: 0.000, up: 0.100, down: 0.095, halfWidth: 0.120 },
    { label: 'flank',    x: 0.080,  y: 0.000, up: 0.098, down: 0.095, halfWidth: 0.120 },
    { label: 'breast',   x: 0.155,  y: 0.010, up: 0.072, down: 0.088, halfWidth: 0.100, tilt: 6 },
    { label: 'neckBase', x: 0.215,  y: 0.062, up: 0.028, down: 0.058, halfWidth: 0.048, tilt: 10 },
    { label: 'neckLow',  x: 0.238,  y: 0.112, up: 0.025, down: 0.030, halfWidth: 0.030 },
    { label: 'neckUp',   x: 0.225,  y: 0.175, up: 0.024, down: 0.026, halfWidth: 0.025 },
    { label: 'nape',     x: 0.240,  y: 0.215, up: 0.022, down: 0.023, halfWidth: 0.023 },
    { label: 'occiput',  x: 0.262,  y: 0.226, up: 0.022, down: 0.020, halfWidth: 0.023 },
    { label: 'crown',    x: 0.277,  y: 0.229, up: 0.024, down: 0.020, halfWidth: 0.024 },
    { label: 'eye',      x: 0.291,  y: 0.226, up: 0.020, down: 0.020, halfWidth: 0.023 },
    { label: 'lores',    x: 0.304,  y: 0.219, up: 0.014, down: 0.016, halfWidth: 0.016 },
    { label: 'billBase', x: 0.312,  y: 0.215, up: 0.011, down: 0.012, halfWidth: 0.011 },
  ],
  rig: {
    neckBase: 'neckBase', neckMid: 'neckLow', head: 'occiput', hip: 'hip', tailBase: 'tailBase',
    neck: ['neckBase', 'neckLow', 'neckUp', 'nape', 'occiput'],
  },
  neckShapes: {
    hunch: [-10, 20, -15, 0, 5],
    erect: [25, -36, 32, 43, -43],
    strike: [-20, -37, 15, 30, -20],
  },
  bill: { taper: 0.8, curve: -0.01 },
  eye: { radius: 0.005, t: 0.4, iris: '#2a1c12' },
  wing: {
    wrist: [0.1, 0.05], droop: 8,
    outline: [[0, 0], [0.25, 0.05], [0.4, 0.09], [0.6, 0.09], [0.8, 0.06], [0.95, 0.02], [1, 0.005]],
  },
  tail: { shape: 'rounded', angle: 5 },
  feet: 'webbed',
  float: { waterline: -0.035 },
  amphibious: true,
  waddle: 5,
  // the longest step this leg (0.17 m from hip to foot) takes without its stance foot sliding: 0.11 m
  stepLength: 0.65,
  plumage: [
    { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#6b5d4c', side: '#8a7b66', bottom: '#d9d2c4' },
    { kind: 'fill', where: { part: 'skin', from: 'neckBase', to: 'billBase' }, color: '#161616' },
    { kind: 'fill', where: { part: 'wingFold' }, color: '#6a5e4e' },
    { kind: 'fill', where: { part: 'bill' }, color: '#141414' },
    { kind: 'fill', where: { part: 'legs' }, color: '#1a1a1a' },
  ],
  variants: {},
  sources: ['test fixture'],
}

export const TEST_GOOSE_SPEC: SpeciesSpec = parseSpeciesSpec({
  ...TEST_SPEC, code: 'testgoose', commonName: 'Test Goose', length: 0.69, posture: 'swimming', draft: 0.3, detail: TEST_GOOSE_DETAIL,
})

```

Run: `npx vitest run src/birds/detail/amphibious.test.ts`
Expected: FAIL: 15 of the 19 tests fail: the schema drops `amphibious` and `waddle`, so the test goose builds as a plain swimmer, and nothing reads `afloat` yet.

- [ ] **Step 2: `afloat`, `amphibious`, the waddle, and the builder**

In `src/birds/detail/build.ts`, replace:

```ts
import { buildLegs, legLayout, DEFAULT_STEP, type LegLayout } from './legs'
```

with:

```ts
import { buildLegs, legLayout, DEFAULT_STEP, SWIM_TIBIA, SWIM_TARSUS, type LegLayout } from './legs'
```

In `src/birds/detail/build.ts`, replace:

```ts
const PADDLE_SWING = 0.5
```

with:

```ts
const PADDLE_SWING = 0.5
/**
 * An amphibious bird's legs, hidden afloat, grow to their full size over this much of afloat's way from 1 toward 0, so
 * nothing jumps as they appear: still folded, under the water, as the bird starts to wade
 */
const LEGS_OUT = 0.25
```

In `src/birds/detail/build.ts`, replace:

```ts
  const profile = createProfile(detail.profile)
  const layout = legLayout(detail, profile, swimming)
```

with:

```ts
  // a swimmer that also stands: built floating, its legs built standing; `afloat` takes it from the one to the other
  const amphibious = swimming && !!detail.amphibious
  const profile = createProfile(detail.profile)
  const layout = legLayout(detail, profile, swimming && !amphibious)
```

In `src/birds/detail/build.ts`, replace:

```ts
  } else offset = new THREE.Vector3(-layout.hip.x, layout.standHeight + layout.footY - layout.hip.y, 0)
```

with:

```ts
  } else offset = new THREE.Vector3(-layout.hip.x, layout.standHeight + layout.footY - layout.hip.y, 0)
  // An amphibious bird is built floating. Standing, its root moves by `ashore`, which puts its hips over the origin and
  // its feet on y = 0, exactly where a standing build of the same bird puts them.
  const ashore = new THREE.Vector3(-layout.hip.x, layout.standHeight + layout.footY - layout.hip.y, 0).sub(offset)
```

In `src/birds/detail/build.ts`, replace:

```ts
  const lift = layout.tarsus * 0.25
```

with:

```ts
  const lift = layout.tarsus * 0.25
  /** how far a walk rolls the body toward the planted foot, radians */
  const waddle = THREE.MathUtils.degToRad(detail.waddle ?? 0)
```

In `src/birds/detail/build.ts`, replace:

```ts
  function setLeg(tibia: THREE.Bone, tarsus: THREE.Bone, toes: THREE.Bone, dx: number, dy: number) {
```

with:

```ts
  function setLeg(tibia: THREE.Bone, tarsus: THREE.Bone, toes: THREE.Bone, dx: number, dy: number) {
    ;[tibia.rotation.z, tarsus.rotation.z, toes.rotation.z] = legTurns(dx, dy)
  }

  const legsRest = bones.legs.position.clone()

  /** The leg bones' turns that put a foot at (dx, dy) from where it stands: tibia, tarsus, and toes, which stay level. */
  function legTurns(dx: number, dy: number): [number, number, number] {
```

In `src/birds/detail/build.ts`, replace:

```ts
    tibia.rotation.z = alpha - alpha0
    tarsus.rotation.z = (beta - beta0) - (alpha - alpha0)
    toes.rotation.z = -(beta - beta0)
  }

  const legsRest = bones.legs.position.clone()
```

with:

```ts
    return [alpha - alpha0, (beta - beta0) - (alpha - alpha0), -(beta - beta0)]
  }

  // An amphibious bird's legs folded as a swimmer's are built: the tibia straight down, the tarsus and the toes trailing
  // back in line with it (the toes turned from lying along the ground)
  const FOLD: [number, number, number] = [SWIM_TIBIA - alpha0, (SWIM_TARSUS - beta0) - (SWIM_TIBIA - alpha0), beta0]
  const pivotAshore = hipMid.clone()
  const turned = new THREE.Vector3(), follow = new THREE.Quaternion()

  /**
   * An amphibious bird's root and body, before the neck reaches: at afloat 1 as built, floating; toward 0 the root rises
   * by `ashore` to its standing height, and the body's turns pivot over the hips rather than on the water.
   */
  function standUp(a: number) {
    const s = 1 - a
    bones.root.position.copy(ashore).multiplyScalar(s)
    // the body turns about a point blended from its float pivot (the root) to over its hips: it sits where it turns that
    // point to, less the turn
    turned.copy(pivotAshore).multiplyScalar(s)
    bones.body.position.copy(turned).sub(turned.clone().applyQuaternion(bones.body.quaternion))
  }

  /**
   * An amphibious bird's legs: standing and walking by IK, as a standing bird's, at afloat 0; folded as a swimmer's
   * at 1, going wherever the body goes, and paddling; each bone's turn blended between the two.
   */
  function amphibiousLegs(st: PoseState, a: number) {
    const paddle = THREE.MathUtils.clamp(st.paddle, 0, 1)
    // hidden afloat, they unfold to their full size by LEGS_OUT of the way ashore, under the water
    bones.legs.scale.setScalar(paddle > 0 ? 1 : Math.max(HIDDEN, Math.min(1, (1 - a) / LEGS_OUT)))
    follow.identity().slerp(bones.body.quaternion, a)
    bones.legs.quaternion.copy(follow)
    turned.copy(legsRest).applyQuaternion(bones.body.quaternion).add(bones.body.position)
    bones.legs.position.copy(legsRest).lerp(turned, a)
    const { left, right } = legOffsets(st.strideDistance + anchor, st.gait, stepLength, lift)
    const stroke = paddle * PADDLE_SWING * Math.sin(st.paddlePhase * Math.PI * 2)
    for (const [leg, at, sign] of [[[bones.tibiaR, bones.tarsusR, bones.toesR], right, 1], [[bones.tibiaL, bones.tarsusL, bones.toesL], left, -1]] as const) {
      const stand = legTurns(at.x, at.y)
      const fold = [FOLD[0] + sign * stroke, FOLD[1] + sign * stroke, FOLD[2]]
      leg.forEach((b, k) => { b.rotation.z = stand[k]! * (1 - a) + fold[k]! * a })
    }
  }

  /**
   * How far a walk rolls the body toward the planted foot, radians (positive rolls it toward +z, the right foot): at a
   * full walk the species' waddle when a foot is mid-stance, once a step; nothing standing still, or afloat.
   */
  function waddleRoll(st: PoseState, a: number): number {
    const g = THREE.MathUtils.clamp(st.gait, 0, 1) * (1 - a)
    const phase = (((st.strideDistance + anchor) / (2 * stepLength)) % 1 + 1) % 1
    // the left foot (legOffsets' first) is mid-stance at STANCE / 2 of the stride, the right half a stride later
    return -waddle * g * Math.cos(2 * Math.PI * (phase - STANCE / 2))
  }
```

In `src/birds/detail/build.ts`, replace:

```ts
    // lean.x pitches the nose down, lean.z rolls; the body pivots over the hips (a swimmer's on the water, mid-body)
    bones.body.rotation.set(st.lean.z, 0, -st.lean.x)
```

with:

```ts
    // an amphibious bird: 1 afloat, 0 on its feet (every other bird is as it was built)
    const a = amphibious ? THREE.MathUtils.clamp(st.afloat, 0, 1) : 1
    // the stride starts over from the neutral phase whenever the bird stands still
    if (THREE.MathUtils.clamp(st.gait, 0, 1) < 0.02) anchor = neutral - st.strideDistance
    // lean.x pitches the nose down, lean.z rolls, and a walk with a waddle rolls the body toward the planted foot; the
    // body pivots over the hips (a swimmer's on the water, mid-body)
    bones.body.rotation.set(waddle > 0 && (!swimming || amphibious) ? st.lean.z + waddleRoll(st, swimming ? a : 0) : st.lean.z, 0, -st.lean.x)
    if (amphibious) standUp(a)
```

In `src/birds/detail/build.ts`, replace:

```ts
    if (swimming) { paddleLegs(st); return }
    if (THREE.MathUtils.clamp(st.gait, 0, 1) < 0.02) anchor = neutral - st.strideDistance
```

with:

```ts
    if (amphibious) { amphibiousLegs(st, a); return }
    if (swimming) { paddleLegs(st); return }
```

In `src/birds/detail/spec.ts`, replace:

```ts
  float: z.object({ waterline: z.number() }).optional(),
```

with:

```ts
  float: z.object({ waterline: z.number() }).optional(),
  /**
   * A swimmer that also stands and walks (a goose): one bird, built floating on its waterline, with its legs built
   * standing from `measurements`, so `PoseState.afloat` takes it from its float (1) to its feet (0). Needs `float`.
   */
  amphibious: z.boolean().optional(),
  /**
   * How far the body rolls toward the planted foot at a full walk, degrees, once a step and in time with it (a goose's
   * waddle). Default 0: no roll.
   */
  waddle: z.number().min(0).max(20).optional(),
```

In `src/birds/detail/spec.ts`, replace:

```ts
  } else if (d.neckShapes) ctx.addIssue({ code: 'custom', message: 'neckShapes needs rig.neck', path: ['neckShapes'] })
```

with:

```ts
  } else if (d.neckShapes) ctx.addIssue({ code: 'custom', message: 'neckShapes needs rig.neck', path: ['neckShapes'] })
  if (d.amphibious && !d.float) ctx.addIssue({ code: 'custom', message: 'an amphibious bird needs float, its waterline', path: ['amphibious'] })
```

In `src/birds/model.ts`, replace:

```ts
  headPitch: number
```

with:

```ts
  headPitch: number
  /**
   * an amphibious bird (a goose): 1 floating, its waterline on the origin and its legs folded away (paddling if
   * `paddle` says so); 0 standing on its feet on the origin's ground, walking with `gait`; between, the body's height
   * and the legs blend from the one to the other. Every other bird ignores it
   */
  afloat: number
```

In `src/birds/model.ts`, replace:

```ts
    paddle: 0, paddlePhase: 0, reachDepth: 0, reachAngle: Math.PI / 2, headPitch: 0,
```

with:

```ts
    paddle: 0, paddlePhase: 0, reachDepth: 0, reachAngle: Math.PI / 2, headPitch: 0, afloat: 1,
```

In `src/birds/spec.ts`, replace:

```ts
  if (s.detail && s.posture === 'swimming' && !s.detail.float) ctx.addIssue({ code: 'custom', message: `${s.code}: a swimming bird's detail block needs detail.float, its waterline`, path: ['detail', 'float'] })
```

with:

```ts
  if (s.detail && s.posture === 'swimming' && !s.detail.float) ctx.addIssue({ code: 'custom', message: `${s.code}: a swimming bird's detail block needs detail.float, its waterline`, path: ['detail', 'float'] })
  if (s.detail?.amphibious && s.posture !== 'swimming') ctx.addIssue({ code: 'custom', message: `${s.code}: an amphibious bird is built floating, so its posture is swimming`, path: ['posture'] })
```

- [ ] **Step 3: See it pass, and every shipped bird unchanged**

Run: `npx vitest run src/birds/detail/amphibious.test.ts`
Expected: 19 tests pass.

Run: `npm test && npx tsc --noEmit -p .`
Expected: every test passes (1083), the fingerprints among them: the fourteen shipped detailed birds build and
pose exactly as before. No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/birds/model.ts src/birds/spec.ts src/birds/detail
git commit -m "feat: an amphibious detailed bird: built floating with its legs built standing, PoseState.afloat raising it from its float to its feet and blending the legs from folded to IK; a waddle that rolls the body toward the planted foot in time with the stride (Task 1)"
```

---

### Task 2: The viewer's goose controls

**Files:**
- Modify: `src/viewer/state.ts`, `src/viewer/main.ts`, `src/viewer/state.test.ts`

**Interfaces:**
- Consumes: Task 1's `afloat` and waddle.
- Produces:

```ts
// ViewerState gains afloat (0..1, default 1); FIELD_VIEWS gains bino35, binoculars at 35 m (the geese on the flat)
// the neck-shape picker gains 'graze' (afloat 0, the reach at the grass) and 'head-dip' (afloat 1, the reach 25 cm under)
```

The viewer gets what setting a goose against its photos needs:
- an **afloat** slider: 1 floats the bird on its waterline (use "float (the lake)"), 0 stands it on its feet, and between
  it wades (set the water depth to suit);
- the **walk** works for an amphibious bird at `afloat` 0, with its waddle (a swimmer's walk still does nothing: its legs
  only paddle);
- **graze** and **head-dip** presets beside the herons' neck shapes, the reach aimed at the grass or under the water;
- the **binoculars at 35 m**, the distance of the flat.

An old link reads as it did, with `afloat` at its default 1, which every bird but an amphibious one ignores.

- [ ] **Step 1: The failing tests**

In `src/viewer/state.test.ts`, replace:

```ts
  walk: false, speed: 0.35, water: 0, float: false, see: false, wire: false, skel: false, uv: false, atlas: false, stations: false,
```

with:

```ts
  afloat: 1, walk: false, speed: 0.35, water: 0, float: false, see: false, wire: false, skel: false, uv: false, atlas: false, stations: false,
```

In `src/viewer/state.test.ts`, replace:

```ts
  })
  it('reads a hand-kept link from before the swimmers exactly as it read then, the new controls at rest', () => {
```

with:

```ts
  })
  it('round-trips the goose controls: half afloat, walking, through the binoculars at the flat; afloat held to 0..1', () => {
    const s: ViewerState = { ...DEFAULTS, a: 'cangoo', b: 'mallar3', field: 'bino35', afloat: 0.3, walk: true, speed: 0.4, reach: 1, depth: 0.25 }
    expect(parseState(stateHash(s), DEFAULTS)).toEqual(s)
    expect(parseState('#afloat=2', DEFAULTS).afloat).toBe(1)
    expect(parseState('#afloat=-1', DEFAULTS).afloat).toBe(0)
  })
  it('reads a hand-kept link from before the swimmers exactly as it read then, the new controls at rest', () => {
```

Run: `npx vitest run src/viewer`
Expected: FAIL: the goose controls' round trip fails (`afloat` isn't read from the hash yet); the other 10 viewer tests pass.

- [ ] **Step 2: The controls**

In `src/viewer/main.ts`, replace:

```ts
  walk: false, speed: 0.35, water: 0, float: false, see: false, wire: false, skel: false, uv: false, atlas: false, stations: false,
```

with:

```ts
  afloat: 1, walk: false, speed: 0.35, water: 0, float: false, see: false, wire: false, skel: false, uv: false, atlas: false, stations: false,
```

In `src/viewer/main.ts`, replace:

```ts
// a chained neck's shapes, to set each against its photo: the hunch, the trace, erect, and the bottom of a strike
```

with:

```ts
// a chained neck's shapes, to set each against its photo: the hunch, the trace, erect, and the bottom of a strike; for
// a goose, the strike's reach aimed at the grass on its feet (graze) or under the water afloat (head-dip)
```

In `src/viewer/main.ts`, replace:

```ts
  swallow: { neck: 1, reach: 0, pitch: 0.9 }, strike: { neck: 0.5, reach: 1, lean: 0.5, pitch: 0 },
```

with:

```ts
  swallow: { neck: 1, reach: 0, pitch: 0.9 }, strike: { neck: 0.5, reach: 1, lean: 0.5, pitch: 0 },
  graze: { neck: 0.5, reach: 1, depth: 0, angle: 1.2, lean: 0.3, pitch: 0, afloat: 0, float: false },
  'head-dip': { neck: 1, reach: 1, depth: 0.25, angle: Math.PI / 2, lean: 0.1, pitch: 0, afloat: 1, float: true },
```

In `src/viewer/main.ts`, replace:

```ts
})
slider(pose, 'neck', state.neck, v => set({ neck: v }))
```

with:

```ts
})
slider(pose, 'afloat (1 floating, 0 on its feet: a goose)', state.afloat, v => set({ afloat: v }))
slider(pose, 'neck', state.neck, v => set({ neck: v }))
```

In `src/viewer/main.ts`, replace:

```ts
    headPitch: state.pitch,
```

with:

```ts
    headPitch: state.pitch, afloat: state.afloat,
```

In `src/viewer/state.ts`, replace:

```ts
  bino22: { label: 'binoculars, 22 m', distance: 22, fov: OPTICS.binoculars.fov, near: OPTICS.binoculars.near },
```

with:

```ts
  bino22: { label: 'binoculars, 22 m', distance: 22, fov: OPTICS.binoculars.fov, near: OPTICS.binoculars.near },
  bino35: { label: 'binoculars, 35 m (the geese on the flat)', distance: 35, fov: OPTICS.binoculars.fov, near: OPTICS.binoculars.near },
```

In `src/viewer/state.ts`, replace:

```ts
  pitch: number
```

with:

```ts
  pitch: number
  /** an amphibious bird (a goose): 1 floating on its waterline, 0 standing on its feet, and between */
  afloat: number
```

In `src/viewer/state.ts`, replace:

```ts
  pitch: [-0.5, 1.4],
```

with:

```ts
  pitch: [-0.5, 1.4], afloat: [0, 1],
```

- [ ] **Step 3: See it pass**

Run: `npx vitest run src/viewer && npx tsc --noEmit -p .`
Expected: 11 tests pass. No type errors.

Run: `npm test`
Expected: every test passes (1084).

- [ ] **Step 4: Look at it**

No species is amphibious until Task 6, so look with the test goose: in `src/birds/species/cangoo.ts`, import
`TEST_GOOSE_DETAIL` from `../detail/fixture` and give the spec `detail: TEST_GOOSE_DETAIL`. **Don't commit this edit**;
undo it after looking. `npm run dev`, then:
- `/viewer.html#a=cangoo&b=mallar3&float=1`: the goose floats on its waterline beside a Mallard.
- Untick float and drag afloat from 1 to 0: the body rises to its standing height and the legs unfold to its feet,
  nothing jumping. At 0.5 with the water at 12 cm it wades, the legs half unfolded.
- At afloat 0, tick walk and switch to the front view: the body rolls toward each planted foot in turn.
- Pick graze and head-dip from the neck shapes.

Then undo the edit to `cangoo.ts` (`git checkout src/birds/species/cangoo.ts`).

- [ ] **Step 5: Commit**

```bash
git add src/viewer
git commit -m "feat: the viewer's goose controls: afloat, a walk on its feet with the waddle, graze and head-dip presets, and binoculars at 35 m (Task 2)"
```

---

### Task 3: The water reads the pose

**Files:**
- Modify: `src/birds/registry.ts`, `src/birds/spawn.ts`, `src/world/floaters.ts`, `src/world/floaters.test.ts`

**Interfaces:**
- Consumes: Task 1's `afloat`.
- Produces:

```ts
// src/birds/registry.ts
BirdInstance.floating: boolean       // the registered pose's afloat above one half; false for a bird with no pose
BirdRegistry.add({ ..., pose?: Readonly<Pick<PoseState, 'afloat'>> })
```

`src/world/floaters.ts` drew a bird in the water as a swimmer or a wader by its cast behaviour, which never changes. A
goose wading out with its feet on the bed would have kept a swimmer's contact line and wake. Now each bird's registry
entry reads whether it floats this frame from its own pose, which the spawner registers with it: a bird that floats gets
the swimmer's contact line, and its Kelvin wake when under way; one standing in the water gets the wader's ring at its
legs.

`defaultPose()` floats (`afloat` 1), so the spawner sets `afloat` 0 on the pose of every bird not cast to swim. A
swimmer's `afloat` stays 1 and a wader's 0, so every existing bird looks as it did; the whole-cast floaters test is
unchanged and passes.

- [ ] **Step 1: The failing tests**

In `src/world/floaters.test.ts`, replace:

```ts
function bird(id: number, x: number, y: number, z: number, behavior = 'swim', visible = true): BirdInstance {
```

with:

```ts
function bird(id: number, x: number, y: number, z: number, behavior = 'swim', visible = true, floating = behavior === 'swim'): BirdInstance {
```

In `src/world/floaters.test.ts`, replace:

```ts
  return { id, species: 'mallar3', behavior, identified: false, model: { group, center: new THREE.Vector3(), radius: 0.3 }, position: group.position }
```

with:

```ts
  return { id, species: 'mallar3', behavior, identified: false, model: { group, center: new THREE.Vector3(), radius: 0.3 }, position: group.position, floating }
```

In `src/world/floaters.test.ts`, replace:

```ts
    expect(t.floaters.map(f => f.wading)).toEqual([false, true])
```

with:

```ts
    expect(t.floaters.map(f => f.wading)).toEqual([false, true])
  })
  it('reads floating or wading from whether the bird floats this frame, not from its behaviour: a goose wading out stands', () => {
    const t = new FloaterTracker()
    // two geese cast to swim: one floating, one wading up the bank with its feet on the bed; and a heron
    t.update([bird(1, 0, 0, -20), bird(2, 0, -0.1, -20, 'swim', true, false), bird(3, 0, -0.15, -61, 'wade')], water, 1 / 60)
    expect(t.floaters.map(f => f.wading)).toEqual([false, true, true])
  })
  it('takes whether a bird floats from its pose, as its behaviour sets it each frame', () => {
    const registry = new BirdRegistry()
    const model = { group: new THREE.Group(), center: new THREE.Vector3(), radius: 0.4 }
    const pose = { afloat: 1 }
    const goose = registry.add({ species: 'cangoo', behavior: 'swim', model, pose })
    const flyer = registry.add({ species: 'cangoo', behavior: 'flyover', model })
    expect([goose.floating, flyer.floating]).toEqual([true, false])
    for (const [afloat, floating] of [[0.51, true], [0.5, false], [0, false]] as const) {
      pose.afloat = afloat
      expect(goose.floating, `afloat ${afloat}`).toBe(floating)
    }
```

Run: `npx vitest run src/world/floaters.test.ts`
Expected: FAIL: 2 of the 7 fail: the goose wading out is drawn as a swimmer, and the registry's entries have no `floating`.

- [ ] **Step 2: The registry, the spawner, and the floaters**

In `src/birds/registry.ts`, replace:

```ts
import type * as THREE from 'three'
```

with:

```ts
import type * as THREE from 'three'
import type { PoseState } from './model'
```

In `src/birds/registry.ts`, replace:

```ts
  readonly position: THREE.Vector3
```

with:

```ts
  readonly position: THREE.Vector3
  /**
   * whether it floats this frame, from its pose: `afloat` above one half (a goose wading out has its feet on the bed and
   * floats no longer). A bird registered without a pose (a flyover's member) never floats
   */
  readonly floating: boolean
```

In `src/birds/registry.ts`, replace:

```ts
  add(inst: Omit<BirdInstance, 'id' | 'identified' | 'position'>): BirdInstance {
```

with:

```ts
  /** `pose` is the bird's own, which its behaviour sets each frame: the registry reads whether it floats from it */
  add({ pose, ...inst }: Omit<BirdInstance, 'id' | 'identified' | 'position' | 'floating'> & { pose?: Readonly<Pick<PoseState, 'afloat'>> }): BirdInstance {
```

In `src/birds/registry.ts`, replace:

```ts
      get position() { return model.group.position },
```

with:

```ts
      get position() { return model.group.position },
      get floating() { return pose !== undefined && pose.afloat > 0.5 },
```

In `src/birds/spawn.ts`, replace:

```ts
    deps.registry.add({ species: ind.species, variant: ind.variant, model, behavior: ind.behavior })
    object.add(model.group)
    birds.push({ controller, pose: defaultPose(), model })
```

with:

```ts
    // a swimmer floats until its behaviour says otherwise (a goose ashore); every other bird stands
    const pose = defaultPose()
    if (ind.behavior !== 'swim') pose.afloat = 0
    deps.registry.add({ species: ind.species, variant: ind.variant, model, behavior: ind.behavior, pose })
    object.add(model.group)
    birds.push({ controller, pose, model })
```

In `src/world/floaters.ts`, replace:

```ts
 * surface, and over water (`depthAt` > 0). A swimmer floats; anything else in the water (a heron, a yellowlegs, a
 * dowitcher) stands. Each one's velocity is measured from its steps and smoothed, so the water shader can draw its wake.
```

with:

```ts
 * surface, and over water (`depthAt` > 0). One that floats this frame (its pose's `afloat`: a swimmer, a goose on the
 * water) gets a swimmer's contact line and wake; anything else in the water (a heron, a yellowlegs, a dowitcher, a goose
 * wading out) stands. Each one's velocity is measured from its steps and smoothed, so the water shader can draw its wake.
```

In `src/world/floaters.ts`, replace:

```ts
      if (this.list.length < this.max) this.list.push({ id: b.id, x: p.x, z: p.z, vx, vz, heading: b.model.group.rotation.y, radius: b.model.radius, wading: b.behavior !== 'swim' })
```

with:

```ts
      if (this.list.length < this.max) this.list.push({ id: b.id, x: p.x, z: p.z, vx, vz, heading: b.model.group.rotation.y, radius: b.model.radius, wading: !b.floating })
```

- [ ] **Step 3: See it pass**

Run: `npx vitest run src/world/floaters.test.ts && npx tsc --noEmit -p .`
Expected: 7 tests pass. No type errors.

Run: `npm test`
Expected: every test passes (1086).

- [ ] **Step 4: Commit**

```bash
git add src/birds/registry.ts src/birds/spawn.ts src/world/floaters.ts src/world/floaters.test.ts
git commit -m "feat: the water reads each bird's pose, not its cast behaviour: a bird that floats this frame (afloat above one half) gets the swimmer's contact line and wake, any other in the water the wader's ring (Task 3)"
```

---

### Task 4: The `goose` style on `swim`

**Files:**
- Create: `src/behavior/goose.ts`, `src/behavior/goose.test.ts`
- Modify: `src/birds/spec.ts`, `src/behavior/types.ts`, `src/behavior/swimmer.ts`, `src/behavior/dabbler.ts`,
  `src/behavior/swim.ts`, `src/location/schema.ts`, `src/location/validate.ts`, `src/birds/spawn.ts`,
  `src/birds/species/cangoo.ts`, `src/birds/spec.test.ts`, `src/location/validate.test.ts`, `src/birds/spawn.test.ts`

**Interfaces:**
- Consumes: Task 1's `afloat`; Task 3's spawner; `createSwimmer`, `createDabbler`, `pickByShare`, `approach`,
  `between`, `turnToward`, `wrap`, `pointInPolygon`, `randomPointInPolygon`, `clampToPolygon`.
- Produces: see "Interfaces between the tasks", above, for `goose.ts`, the cast's `ashore` and `groups`, and the
  context's `ashore` and `unit`.

What the style does:
- **On the water**, each goose swims as a dabbler from the Canada Goose's settings (research section 11.1): loafing with
  the neck drawn in, cruising, head-dips, tip-ups (a quarter of its feeding), surface feeding, preening, and alert with
  the neck erect, each by the research's shares. Each head-dip and tip-up starts a ring, as a dabbler's does.
- **Roles** from the cast's `groups`: the first group is a family (the gander, his mate, and their young), each later one
  a loose unit of adults. Only a family goes ashore.
- **The trip,** on the gander's clock: after 5-20 min on the water, once the whole family is swimming, the gander picks a
  way across the shore (`findCrossing`) and the order of a file (a leader by the research's shares, gander 0.4, goose
  0.3, a young bird 0.3; the young in the middle, a parent at the rear). Every bird swims to the crossing in the file,
  each a gap of 0.6-1.3 m behind the bird ahead, and wades up the bank, its `y` and `afloat` from the ground under it
  (`footing`), ringing the water once at its breast as it crosses afloat's half-way. It stands 5-20 s further up the
  bank, half of them shaking, then walks at 0.3-0.5 m/s to its own spot near the family's grazing spot, 5-20 m from the
  water.
- **Grazing** for 20-60 min from when the gander starts: each bird alternates head-down bouts (the neck reaching to the
  grass, the bill biting 0.9 times a second, a slow step every 2-4 s) and head-up bouts (the neck erect), each drawn from
  its role's range (research section 11.2): the gander's 5-12 s down and 4-12 s up, the goose's 7-15 and 3-8, the young's
  15-40 and 1-3. A bird on the edge of the grazing group, furthest from its middle, keeps its head up 1.3 times as long.
  Nothing ties one bird's bouts to another's.
- **Back:** the gander picks the crossing nearest him and a new file; the family walks to it in file, wades in, swims out
  a little, loafs, and swims on as dabblers.
- **A scene opens at a random point in the cycle:** the first bird made decides, by the cycle's mean times, whether the
  family is on the grass (each bird at its spot, its bouts under way) or on the water, and how much of the stage is left.

Every pose value eases toward what a phase asks at a fixed rate, so nothing snaps: a goose that turns for the shore with
its head under the water brings it up over a few frames, as the 60 fps test checks (it caught exactly that while
planning). The settings are the research's section 11, each marked sourced, computed, or estimated. Those the built
bird decides (`wade.stand`, `rings.ahead`, `neck.stand`, and the graze's lean and reach angle) are estimates until Task 6
sets them from the traced goose.

Spacing: on the water the swimmers' own (0.8 m between any two of the entry's eight, 1.5 m from every other swimmer,
which keeps clear of a goose wherever it is); on the bank the file's least gap, a bird waiting for one it would come
nearer than 0.6 m to (and never nearer than 0.45 m); on the grass each bird's spot 0.8-2 m from the others. The geese
stay in the shared swimmers' list.

`validateCast` holds a goose entry to an `ashore` polygon that exists, no other entry to `ashore` or `groups`, `groups`
to the entry's count, and its first group to a pair and at least one young. `cangoo` feeds as a goose from this task on;
its flyover entry is untouched (validateCast ties a style to swim, probe, and wade only). There is no swimming goose in
the cast until Task 5, so nothing in the game changes yet.

- [ ] **Step 1: The failing tests**

Create `src/behavior/goose.test.ts`:

```ts
import {
  createGoose, gooseUnits, placeIn, roleOf, footing, findCrossing, gooseFor, CANADA_GOOSE,
  type GooseController, type GooseSettings, type GooseUnit,
} from './goose'
import { createSwim, companyOf } from './swim'
import { defaultPose, type PoseState } from '../birds/model'
import { makeRng } from '../catalog/rng'
import { pointInPolygon } from '../location/zones'
import type { BehaviorContext } from './types'

type Pt = [number, number]
/** the water zone, deep everywhere, and the grass across a 3 m bank from it, as the lake's are laid out */
const WATER = { kind: 'polygon' as const, points: [[-20, -10], [2, -10], [2, 10], [-20, 10]] as Pt[] }
const GRASS = { kind: 'polygon' as const, points: [[5, -10], [25, -10], [25, 10], [5, 10]] as Pt[] }
/** the bed: 1 in 4 up from the deep water to a flat 0.3 m above it, meeting the water at x = 4 */
const ground = (x: number) => Math.min(0.3, Math.max(-1.5, (x - 4) * 0.25))
const S = CANADA_GOOSE
/** the same goose on short trips, for the tests that need many of them */
const QUICK: GooseSettings = { ...S, trip: { ...S.trip, water: [60, 120], grass: [120, 240], settle: [10, 20] } }

/** the pose values a test reads, kept only when it asks: the whole cast's pose every frame is too much to hold */
type Kept = Pick<PoseState, 'neckExtend' | 'reach' | 'reachDepth' | 'reachAngle' | 'tailTilt' | 'paddle' | 'headBob' | 'gait' | 'afloat'> & { leanX: number; leanZ: number }
interface Frame { t: number; phase: string; state: string; x: number; z: number; y: number; afloat: number; pose?: Kept }
interface Ring { t: number; bird: number; x: number; z: number; size: number }

/**
 * A family of five and a loose unit of three, as the cast's groups [5, 3] make them, for `seconds` at `fps`: every
 * goose's frames, the rings each starts, and the family's crossings as they were chosen.
 */
function run(seed: number, seconds: number, fps = 10, settings: GooseSettings = S, keepPose = false) {
  const units = gooseUnits([5, 3])
  const group = { targetX: -8, targetZ: 0, retargetAt: 60 }
  const geese: GooseController[] = []
  const rings: Ring[] = []
  let t = 0
  for (let i = 0; i < 8; i++) {
    const ctx: BehaviorContext = {
      zone: WATER, ashore: GRASS, unit: placeIn(units, i), group, rng: makeRng(seed * 1000 + i),
      wind: () => ({ dirX: 1, dirZ: 0, effective: 0.3 }), ground: x => ground(x), neighbours: () => geese, species: 'cangoo',
      onRipple: (x, z, size) => rings.push({ t, bird: i, x, z, size: size ?? 1 }),
    }
    geese.push(createGoose(ctx, -8 - (i % 4), -2 + 1.2 * Math.floor(i / 4), settings))
  }
  const poses = geese.map(() => defaultPose())
  const frames: Frame[][] = geese.map(() => [])
  const crossings: { t: number; stage: string; water: Pt; land: Pt; order: number[] }[] = []
  let crossing = units[0]!.crossing
  for (let k = 0; k < seconds * fps; k++) {
    t = k / fps
    geese.forEach((g, i) => g.update(1 / fps, poses[i]!))
    if (units[0]!.crossing !== crossing) {
      crossing = units[0]!.crossing
      crossings.push({ t, stage: units[0]!.stage, water: crossing!.water, land: crossing!.land, order: [...units[0]!.order] })
    }
    geese.forEach((g, i) => {
      const p = poses[i]!
      const pose = keepPose ? {
        neckExtend: p.neckExtend, reach: p.reach, reachDepth: p.reachDepth, reachAngle: p.reachAngle, tailTilt: p.tailTilt,
        paddle: p.paddle, headBob: p.headBob, gait: p.gait, afloat: p.afloat, leanX: p.lean.x, leanZ: p.lean.z,
      } : undefined
      frames[i]!.push({ t, phase: g.phase, state: g.state, x: g.x, z: g.z, y: g.y, afloat: p.afloat, pose })
    })
  }
  return { geese, units, frames, rings, crossings, unit: units[0]! }
}

/** runs of frames in which `test` holds: their first and last frames */
function spells(frames: Frame[], test: (f: Frame) => boolean): Frame[][] {
  const out: Frame[][] = []
  let cur: Frame[] = []
  for (const f of frames) {
    if (test(f)) cur.push(f)
    else if (cur.length) { out.push(cur); cur = [] }
  }
  if (cur.length) out.push(cur)
  return out
}

/** distance from p to the segment a-b */
function toSegment(p: Pt, a: Pt, b: Pt): number {
  const [dx, dz] = [b[0] - a[0], b[1] - a[1]]
  const k = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz)))
  return Math.hypot(p[0] - a[0] - k * dx, p[1] - a[1] - k * dz)
}

describe('goose units and roles', () => {
  it('makes the first group a family and every later one a loose unit, and places each bird of the entry in its unit', () => {
    const units = gooseUnits([5, 3])
    expect(units.map(u => [u.family, u.size])).toEqual([[true, 5], [false, 3]])
    expect([0, 4, 5, 7].map(i => { const { unit, place } = placeIn(units, i); return [units.indexOf(unit), place] })).toEqual([[0, 0], [0, 4], [1, 0], [1, 2]])
    expect(() => placeIn(units, 8)).toThrow()
  })
  it('gives the family a gander, his mate, and young, and the loose unit adults', () => {
    const units = gooseUnits([5, 3])
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(i => { const { unit, place } = placeIn(units, i); return roleOf(unit, place) }))
      .toEqual(['gander', 'goose', 'young', 'young', 'young', 'adult', 'adult', 'adult'])
    expect(roleOf(undefined, 0)).toBe('adult')
    expect(run(1, 1).geese.map(g => g.role)).toEqual(['gander', 'goose', 'young', 'young', 'young', 'adult', 'adult', 'adult'])
  })
})

describe('footing', () => {
  it('floats on deep water, stands on dry ground and in shallow water, and wades between, with no jump', () => {
    expect(footing(-0.5, S.wade)).toEqual({ y: 0, afloat: 1 })
    expect(footing(-S.wade.float, S.wade)).toEqual({ y: 0, afloat: 1 })
    expect(footing(0.2, S.wade)).toEqual({ y: 0.2, afloat: 0 })
    expect(footing(-0.1, S.wade)).toEqual({ y: -0.1, afloat: 0 })
    let prev = footing(0.4, S.wade)
    for (let g = 0.4; g >= -0.5; g -= 0.001) {
      const now = footing(g, S.wade)
      // the origin drops from the bed to the surface faster than the bed falls, while the body stays on the water
      expect(Math.abs(now.y - prev.y)).toBeLessThan((0.001 * S.wade.stand) / (S.wade.float - S.wade.stand) + 1e-9)
      expect(Math.abs(now.afloat - prev.afloat)).toBeLessThan(0.001 / (S.wade.float - S.wade.stand) + 1e-9)
      prev = now
    }
  })
})

describe('findCrossing', () => {
  it('joins a spot in the water zone, deep enough to float, to a dry spot on the grass, up a bank it can walk', () => {
    const rng = makeRng(3)
    for (let i = 0; i < 20; i++) {
      const c = findCrossing(WATER, GRASS, x => ground(x), S, rng)!
      expect(pointInPolygon(c.water[0], c.water[1], WATER.points)).toBe(true)
      expect(pointInPolygon(c.land[0], c.land[1], GRASS.points)).toBe(true)
      expect(ground(c.water[0])).toBeLessThanOrEqual(-S.wade.float)
      expect(ground(c.land[0])).toBeGreaterThan(0)
      expect(Math.hypot(c.land[0] - c.water[0], c.land[1] - c.water[1])).toBeLessThan(S.shore.gap + 2)
    }
  })
  it('finds none where the bank is a step it cannot climb, and picks the nearest of its tries to a spot', () => {
    const cliff = (x: number) => (x < 4 ? -1 : 0.6)
    expect(findCrossing(WATER, GRASS, x => cliff(x), S, makeRng(3))).toBeNull()
    const c = findCrossing(WATER, GRASS, x => ground(x), S, makeRng(3), [5.5, 9])!
    expect(Math.hypot(c.land[0] - 5.5, c.land[1] - 9)).toBeLessThan(3)
  })
})

describe('the goose style: the family\'s cycle', () => {
  // two families for three hours each, with the research's times
  const long = [1, 2].map(seed => run(seed, 3 * 3600))
  it('leaves the water, grazes, and comes back, each stage within its time range; the loose unit never leaves the water', () => {
    let trips = 0
    for (const r of long) {
      const g = r.frames[0]!
      // the water: from the whole family being back on it to the gander turning for the shore
      const onWater = spells(g, f => f.phase === 'water')
      for (const s of onWater.slice(1, -1)) {
        expect(s.at(-1)!.t - s[0]!.t).toBeGreaterThanOrEqual(S.trip.water[0] - 1)
        // the gander's water time runs from when the last of the family is back in
        expect(s.at(-1)!.t - s[0]!.t).toBeLessThanOrEqual(S.trip.water[1] + 200)
      }
      // the grass: from the gander starting to graze to his turning back
      const grazing = spells(g, f => f.phase === 'graze')
      for (const s of grazing.slice(1, -1)) {
        trips++
        expect(s.at(-1)!.t - s[0]!.t).toBeGreaterThanOrEqual(S.trip.grass[0] - 1)
        expect(s.at(-1)!.t - s[0]!.t).toBeLessThanOrEqual(S.trip.grass[1] + 1)
      }
      // every bird of the family grazes and swims each trip; the loose unit only swims
      for (const f of r.frames.slice(0, 5)) expect(new Set(f.map(x => x.phase))).toEqual(new Set(['water', 'file', 'wadeOut', 'stand', 'walk', 'graze', 'walkBack', 'wadeIn', 'settle']))
      for (const f of r.frames.slice(5)) expect(new Set(f.map(x => x.phase))).toEqual(new Set(['water']))
    }
    expect(trips).toBeGreaterThanOrEqual(2)
  })
})

describe('the goose style: on short trips', () => {
  // three families for two hours each, on short trips: about forty trips out and back
  const runs = [3, 4, 5].map(seed => run(seed, 2 * 3600, 10, QUICK))
  it('follows the gander: the file\'s order varies, and every bird walks out and back where he turned', () => {
    const leaders: Record<string, number> = { gander: 0, goose: 0, young: 0 }
    for (const r of runs) {
      for (const c of r.crossings) leaders[r.geese[c.order[0]!]!.role]!++
      for (const f of r.frames.slice(0, 5)) {
        for (const x of f) {
          if (x.phase !== 'wadeOut' && x.phase !== 'wadeIn') continue
          const now = [...r.crossings].reverse().find(c => c.t <= x.t)!
          expect(toSegment([x.x, x.z], now.water, now.land), `${x.phase} at ${x.t}`).toBeLessThan(1.05)
        }
      }
    }
    const n = leaders.gander! + leaders.goose! + leaders.young!
    expect(n).toBeGreaterThan(30)
    // the shares of the lead (gander 0.4, goose 0.3, a young bird 0.3), each within 0.15
    expect(leaders.gander! / n).toBeGreaterThan(0.25); expect(leaders.gander! / n).toBeLessThan(0.55)
    expect(leaders.goose! / n).toBeGreaterThan(0.15); expect(leaders.goose! / n).toBeLessThan(0.45)
    expect(leaders.young! / n).toBeGreaterThan(0.15); expect(leaders.young! / n).toBeLessThan(0.45)
  })
  it('sets y and afloat from the ground wherever it goes: never afloat on dry ground, never on its feet in deep water', () => {
    for (const r of runs) {
      for (const f of r.frames) {
        for (const x of f) {
          const g = ground(x.x)
          if (x.phase === 'water' || x.phase === 'file' || x.phase === 'settle') {
            if (g > -S.wade.float || x.y !== 0 || x.afloat !== 1) expect.fail(`${x.phase} at ${x.t}: y ${x.y}, afloat ${x.afloat} over ${g}`)
          } else {
            const want = footing(g, S.wade)
            if (Math.abs(x.y - want.y) > 1e-12 || Math.abs(x.afloat - want.afloat) > 1e-12) expect.fail(`${x.phase} at ${x.t}: y ${x.y}, afloat ${x.afloat} over ${g}`)
          }
          if (g > 0 && x.afloat > 0) expect.fail(`afloat ${x.afloat} on dry ground at ${x.t}`)
          if (g <= -S.wade.float && x.afloat < 1) expect.fail(`afloat ${x.afloat} in water ${-g} m deep at ${x.t}`)
        }
      }
    }
  })
  it('keeps to its zones: ashore in the ashore zone, on the water in its water zone, and between them only on its crossing', () => {
    for (const r of runs) {
      r.frames.forEach((f, i) => {
        for (const x of f) {
          if (pointInPolygon(x.x, x.z, WATER.points)) continue
          if (i >= 5) expect.fail(`a loose adult out of the water at ${x.t}`)
          if (pointInPolygon(x.x, x.z, GRASS.points)) continue
          const now = [...r.crossings].reverse().find(c => c.t <= x.t)!
          if (toSegment([x.x, x.z], now.water, now.land) > 1.05) expect.fail(`${x.phase} at (${x.x}, ${x.z}), off its crossing, at ${x.t}`)
        }
      })
    }
  })
  it('keeps its spacing: no two of the family closer than the file\'s least gap on the bank, nor the flock\'s on the water', () => {
    for (const r of runs) {
      for (let k = 0; k < r.frames[0]!.length; k++) {
        for (let i = 0; i < 8; i++) {
          for (let j = i + 1; j < 8; j++) {
            const [a, b] = [r.frames[i]![k]!, r.frames[j]![k]!]
            const d = Math.hypot(a.x - b.x, a.z - b.z)
            const swimming = a.phase === 'water' && b.phase === 'water'
            if (d < (swimming ? S.spacing.flock - 0.1 : 0.4)) expect.fail(`${a.phase} ${i} and ${b.phase} ${j} ${d.toFixed(2)} m apart at ${a.t}`)
          }
        }
      }
    }
  })
  it('grazes spread 0.8-2 m apart: each grazing bird\'s nearest neighbour mostly within the spread', () => {
    let n = 0, within = 0
    for (const r of runs) {
      for (let k = 0; k < r.frames[0]!.length; k += 10) {
        const grazing = r.frames.slice(0, 5).map(f => f[k]!).filter(x => x.phase === 'graze')
        if (grazing.length < 5) continue
        for (const a of grazing) {
          const nearest = Math.min(...grazing.filter(b => b !== a).map(b => Math.hypot(a.x - b.x, a.z - b.z)))
          n++
          if (nearest >= S.trip.spread[0] - 0.2 && nearest <= S.trip.spread[1] + 0.5) within++
        }
      }
    }
    expect(n).toBeGreaterThan(1000)
    expect(within / n).toBeGreaterThan(0.9)
  })
  it('rings the water once at its breast as it wades out and once as it wades in, and never while it grazes', () => {
    for (const r of runs) {
      r.frames.slice(0, 5).forEach((f, i) => {
        const wades = r.rings.filter(x => x.bird === i && x.size === S.rings.wade)
        const crossings = [...spells(f, x => x.phase === 'wadeOut'), ...spells(f, x => x.phase === 'wadeIn')]
        let inside = 0
        for (const s of crossings) {
          const n = wades.filter(x => x.t >= s[0]!.t - 0.05 && x.t <= s.at(-1)!.t + 0.05).length
          inside += n
          // one each, but for a crossing the run's end cuts short
          if (s.at(-1) === f.at(-1)) expect(n).toBeLessThanOrEqual(1)
          else expect(n, `goose ${i}, ${s[0]!.phase} at ${s[0]!.t}`).toBe(1)
        }
        expect(inside, `goose ${i}`).toBe(wades.length)
        for (const ring of r.rings.filter(x => x.bird === i)) {
          const at = f[Math.round(ring.t * 10)]!
          if (at.phase === 'graze' || at.phase === 'walk' || at.phase === 'stand') expect.fail(`a ring while it ${at.phase}s at ${ring.t}`)
        }
      })
      // the loose unit rings only as a dabbler does
      const sizes = new Set(r.rings.filter(x => x.bird >= 5).map(x => x.size))
      for (const s of sizes) expect([S.rings.headDip, S.rings.tipUp, S.rings.dabble]).toContain(s)
    }
  })
})

describe('the goose style: grazing and looking up', () => {
  // three families grazing for two hours each: the water a minute, the grass longer than the run
  const grazer: GooseSettings = { ...S, trip: { ...S.trip, water: [30, 60], grass: [1e5, 1e5] } }
  const runs = [6, 7, 8].map((seed, i) => run(seed, 2 * 3600, 10, grazer, i === 0))
  const up = (x: Frame) => x.state === 'headUp'
  it('keeps each role\'s share of time head-up while grazing: the gander about 0.49, his mate 0.34, the young 0.07', () => {
    const share: Record<string, [number, number]> = { gander: [0, 0], goose: [0, 0], young: [0, 0] }
    for (const r of runs) r.frames.slice(0, 5).forEach((f, i) => {
      const g = f.filter(x => x.phase === 'graze')
      const s = share[r.geese[i]!.role]!
      s[0] += g.filter(up).length; s[1] += g.length
    })
    const of = (role: string) => share[role]![0] / share[role]![1]
    // the bouts give 0.485, 0.333, and 0.068; the edge bird's longer looks raise each a little
    expect(of('gander')).toBeGreaterThan(0.44); expect(of('gander')).toBeLessThan(0.58)
    expect(of('goose')).toBeGreaterThan(0.3); expect(of('goose')).toBeLessThan(0.43)
    expect(of('young')).toBeGreaterThan(0.05); expect(of('young')).toBeLessThan(0.11)
  })
  it('keeps each bird\'s bouts its own: two birds\' heads come up no more together than chance', () => {
    for (const r of runs) {
      const both = (i: number, j: number) => {
        const k = r.frames[i]!.map((x, n) => [x, r.frames[j]![n]!] as const).filter(([a, b]) => a.phase === 'graze' && b.phase === 'graze')
        const pa = k.filter(([a]) => up(a)).length / k.length, pb = k.filter(([, b]) => up(b)).length / k.length
        const pab = k.filter(([a, b]) => up(a) && up(b)).length / k.length
        // the correlation of the two head-up records
        return (pab - pa * pb) / Math.sqrt(pa * (1 - pa) * pb * (1 - pb))
      }
      for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) expect(Math.abs(both(i, j)), `${i} and ${j}`).toBeLessThan(0.12)
    }
  })
  it('shows a family mostly head-down: usually one or two heads up, now and then none', () => {
    const heads: number[] = []
    for (const r of runs) {
      for (let k = 0; k < r.frames[0]!.length; k++) {
        const f = r.frames.slice(0, 5).map(x => x[k]!)
        if (f.every(x => x.phase === 'graze')) heads.push(f.filter(up).length)
      }
    }
    const share = (test: (n: number) => boolean) => heads.filter(test).length / heads.length
    // about 77% of birds head-down at a time (research section 11.2, computed)
    const down = 1 - heads.reduce((a, b) => a + b, 0) / (5 * heads.length)
    expect(down).toBeGreaterThan(0.72); expect(down).toBeLessThan(0.82)
    expect(share(n => n === 1 || n === 2)).toBeGreaterThan(0.55)
    expect(share(n => n === 0)).toBeGreaterThan(0.1)
    expect(share(n => n >= 4)).toBeLessThan(0.05)
  })
  it('grazes head-down with its bill on the grass, biting, and stands head-up with its neck erect', () => {
    const g = runs[0]!.frames[0]!.filter(x => x.phase === 'graze')
    const downs = g.filter(x => x.state === 'headDown' && x.pose!.reach > 0.99)
    const ups = g.filter(x => x.state === 'headUp' && x.pose!.neckExtend > 0.99)
    expect(downs.length).toBeGreaterThan(1000)
    expect(ups.length).toBeGreaterThan(1000)
    expect(Math.max(...downs.map(x => x.pose!.reachDepth))).toBeGreaterThan(S.graze.bite * 0.8)
    for (const x of downs) expect(x.pose!.reachAngle).toBeCloseTo(S.graze.reachAngle, 2)
    for (const x of ups) expect(x.pose!.reach).toBeLessThan(0.01)
  })
})

describe('the goose style: moving smoothly', () => {
  it('at 60 fps no part of the pose, afloat among them, jumps in a frame', () => {
    // A tip-up comes back level in 0.4 s along smoothstep: at most 1.5 x 1.36 / 0.4 / 60 = 0.085 rad a frame, and the
    // bill reaches the water, and points down, in 0.3 s: 1.5 / 0.3 / 60 = 0.083 of the way (the dabbler's easing). Wading,
    // afloat changes with the depth under a bird walking at most 0.5 m/s up a 1 in 4 bank. A snap would move the
    // whole range at once.
    const most: Record<keyof Kept, number> = {
      neckExtend: 0.05, reach: 0.1, reachDepth: 0.04, reachAngle: 0.1, tailTilt: 0.05, paddle: 0.1, headBob: 0.01, gait: 0.12, afloat: 0.04,
      leanX: 0.1, leanZ: 0.1,
    }
    const r = run(10, 20 * 60, 60, QUICK, true)
    r.frames.forEach((f, i) => {
      for (let k = 1; k < f.length; k++) {
        const [a, b] = [f[k - 1]!, f[k]!]
        for (const [key, limit] of Object.entries(most) as [keyof Kept, number][]) {
          // the steepest the bill may point means nothing while it isn't reaching
          if (key === 'reachAngle' && (a.pose!.reach < 0.01 || b.pose!.reach < 0.01)) continue
          const d = Math.abs(b.pose![key] - a.pose![key])
          if (d > limit) expect.fail(`goose ${i}: ${key} changed by ${d.toFixed(4)} at ${b.t.toFixed(2)} s (${a.phase} to ${b.phase})`)
        }
        if (Math.abs(b.y - a.y) > 0.012) expect.fail(`goose ${i}: y changed by ${Math.abs(b.y - a.y).toFixed(4)} at ${b.t.toFixed(2)} (${a.phase} to ${b.phase})`)
      }
      expect(new Set(f.map(x => x.phase)).size, `goose ${i}`).toBeGreaterThan(i < 5 ? 5 : 0)
    })
  }, 120_000)
})

describe('the goose style: where the scene opens', () => {
  it('opens at a random point in the cycle: some families grazing, more of them than on the water, as the cycle\'s times run', () => {
    const starts = Array.from({ length: 60 }, (_, seed) => run(100 + seed, 0.1).geese[0]!.phase)
    const grazing = starts.filter(p => p === 'graze').length / starts.length
    // the grass is 40 of the cycle's 52.5 minutes on average
    expect(grazing).toBeGreaterThan(0.6); expect(grazing).toBeLessThan(0.92)
    expect(new Set(starts)).toEqual(new Set(['graze', 'water']))
  })
  it('opens a grazing family on the grass, standing on the ground, spread about', () => {
    const r = [...Array(10).keys()].map(s => run(200 + s, 0.1)).find(x => x.geese[0]!.phase === 'graze')!
    for (const g of r.geese.slice(0, 5)) {
      expect(pointInPolygon(g.x, g.z, GRASS.points)).toBe(true)
      expect(g.y).toBe(ground(g.x))
    }
  })
})

describe('the goose style on swim', () => {
  it('is what swim gives a species that feeds as a goose, and keeps company as a goose', () => {
    const ctx = (): BehaviorContext => ({ zone: WATER, rng: makeRng(8), wind: () => ({ dirX: 1, dirZ: 0, effective: 0.3 }), ground: () => -2, foraging: 'goose', species: 'cangoo' })
    const trace = (c: ReturnType<typeof createSwim>) => {
      const pose = defaultPose(), out: string[] = []
      for (let i = 0; i < 60 * 30; i++) { c.update(1 / 30, pose); if (i % 30 === 0) out.push(`${c.state} ${c.x.toFixed(6)} ${pose.lean.x.toFixed(6)}`) }
      return out
    }
    expect(trace(createSwim(ctx(), 0, 0))).toEqual(trace(createGoose(ctx(), 0, 0)))
    expect(companyOf('goose', 'cangoo')).toEqual({ radius: S.flock.radius, retargetSeconds: S.flock.retargetSeconds, spacing: S.spacing, apart: undefined })
    expect(gooseFor('cangoo')).toBe(CANADA_GOOSE)
  })
  it('without an ashore zone or a family, swims as a loose adult and never leaves the water', () => {
    const units: GooseUnit[] = gooseUnits([5])
    const c = createGoose({ zone: WATER, rng: makeRng(2), wind: () => ({ dirX: 0, dirZ: 0, effective: 0 }), ground: () => -2, unit: placeIn(units, 0) }, -5, 0, QUICK)
    const pose = defaultPose()
    for (let i = 0; i < 3600; i++) { c.update(1, pose); expect(c.phase).toBe('water') }
  })
})
```

In `src/birds/spawn.test.ts`, replace:

```ts

describe('spawnCast divers', () => {
```

with:

```ts

describe('spawnCast geese', () => {
  // the geese's water across a 3 m bank, 1 in 4, from their grass, as on the lake, with Mallards on the same water
  const shore: Location = {
    ...loc([
      { species: 'cangoo', behavior: 'swim', zone: 'w', ashore: 'flat', count: 8, groups: [5, 3] },
      { species: 'mallar3', behavior: 'swim', zone: 'w', count: 4 },
    ]),
    zones: {
      w: { kind: 'polygon', points: [[-20, -10], [2, -10], [2, 10], [-20, 10]] },
      flat: { kind: 'polygon', points: [[5, -10], [25, -10], [25, 10], [5, 10]] },
    },
  }
  const ground = (x: number) => Math.min(0.3, Math.max(-1.5, (x - 4) * 0.25))
  it('hands a goose its ashore zone, its group sizes, and its place in the entry', () => {
    const out = expandCast(shore, makeRng(1))
    expect(out.slice(0, 8).map(b => [b.ashore, b.groups, b.index])).toEqual([0, 1, 2, 3, 4, 5, 6, 7].map(i => ['flat', [5, 3], i]))
    expect(out.slice(8).every(b => b.ashore === undefined && b.index === undefined)).toBe(true)
  })
  it('sends the family ashore by the cast\'s groups and keeps the loose unit on the water, the Mallards clear of every goose afloat', () => {
    for (const seed of [1, 2]) {
      const d = { registry: new BirdRegistry(), wind: new Wind({ direction: 0, strength: 0.3, gustiness: 0.5, seed: 1 }), ground: (x: number) => ground(x), ripples: new RippleBuffer(), seed }
      const world = spawnCast(shore, d)
      const geese = d.registry.bySpecies('cangoo'), ducks = d.registry.bySpecies('mallar3')
      const ashore = geese.map(() => false)
      let gap = Infinity
      for (let i = 0; i < 2 * 3600 * 10; i++) {
        world.update(1 / 10, d.wind)
        geese.forEach((g, k) => { if (g.position.x > 5) ashore[k] = true })
        // a goose floating on its water, against every Mallard: the larger of the two birds' spacing, the goose's
        for (const g of geese) {
          if (!g.floating || g.position.x > 1.5) continue
          for (const m of ducks) gap = Math.min(gap, Math.hypot(g.position.x - m.position.x, g.position.z - m.position.z) - otherOf('cangoo'))
        }
      }
      expect(ashore, `seed ${seed}`).toEqual([true, true, true, true, true, false, false, false])
      expect(gap, `seed ${seed}`).toBeGreaterThan(-0.1)
    }
  }, 120_000)
})

/** metres a swimmer of this species keeps from any bird not of its flock: its style's `other` spacing */
const otherOf = (code: string) => companyOf(speciesTraits(code).foraging, code).spacing.other

describe('spawnCast divers', () => {
```

In `src/birds/spec.test.ts`, replace:

```ts
    for (const style of ['dabbler', 'shoveler', 'coot', 'grebe'] as const) expect(parseSpeciesSpec({ ...coot, foraging: style }).foraging).toBe(style)
```

with:

```ts
    for (const style of ['dabbler', 'shoveler', 'coot', 'grebe', 'goose'] as const) expect(parseSpeciesSpec({ ...coot, foraging: style }).foraging).toBe(style)
```

In `src/location/validate.test.ts`, replace:

```ts
  })
  describe('plumage counts', () => {
```

with:

```ts
  })
  describe('the goose style', () => {
    const specs = { cangoo: { variants: {}, foraging: 'goose' as const }, mallar3: { variants: {}, foraging: 'dabbler' as const } }
    const catalog = [bird('cangoo', ['wetland']), bird('mallar3', ['wetland'])]
    const one = (entry: Partial<CastEntry>): Location => ({
      ...loc,
      zones: { ...loc.zones, flat: { kind: 'polygon', points: [[2, 0], [3, 0], [3, 1]] }, snag: { kind: 'point', position: [0, 0, 0] } },
      cast: [{ species: 'cangoo', behavior: 'swim', zone: 'water', count: 8, ashore: 'flat', groups: [5, 3], ...entry }],
    })
    it('passes a goose entry with a polygon to walk out to and groups that add up to its count', () => {
      expect(validateCast(one({}), catalog, specs)).toEqual([])
      expect(validateCast(one({ groups: undefined }), catalog, specs)).toEqual([])
    })
    it('needs a goose entry to name an ashore polygon that exists', () => {
      expect(validateCast(one({ ashore: undefined }), catalog, specs)).toEqual(['cast[0]: cangoo feeds as a goose, so it needs an ashore zone to walk out to'])
      expect(validateCast(one({ ashore: 'meadow' }), catalog, specs)).toEqual(['cast[0]: ashore zone meadow does not exist'])
      expect(validateCast(one({ ashore: 'snag' }), catalog, specs)).toEqual(['cast[0]: ashore needs a polygon zone, snag is point'])
    })
    it('needs groups to add up to the count, the first a family', () => {
      expect(validateCast(one({ groups: [5, 2] }), catalog, specs)).toEqual(['cast[0]: groups add up to 7, not the count of 8'])
      expect(validateCast(one({ groups: [2, 6] }), catalog, specs)).toEqual(['cast[0]: the first group is a family, a pair and at least one young, not 2'])
    })
    it('lets no other style go ashore or keep groups', () => {
      expect(validateCast(one({ species: 'mallar3', count: 8 }), catalog, specs)).toEqual([
        'cast[0]: only the goose style goes ashore; mallar3 has no use for flat',
        'cast[0]: only the goose style keeps groups; mallar3 swims in one flock',
      ])
    })
  })
  describe('plumage counts', () => {
```

Run: `npx vitest run src/behavior/goose.test.ts src/location/validate.test.ts src/birds/spec.test.ts src/birds/spawn.test.ts`
Expected: FAIL: `goose.test.ts` fails to load (`Cannot find module './goose'`), and 6 of the other three files' tests fail: `goose` is no foraging style yet, and a cast entry keeps no `ashore` or `groups`.

- [ ] **Step 2: The style, its settings, and its wiring**

In `src/behavior/dabbler.ts`, replace:

```ts
import { createSwimmer, pickByShare, mid, type SwimSettings } from './swimmer'
```

with:

```ts
import { createSwimmer, pickByShare, mid, type SwimSettings, type Swimmer } from './swimmer'
```

In `src/behavior/dabbler.ts`, replace:

```ts
 * farther from the flock than `whenFarther` swims back to it first.
 */
export function createDabbler(ctx: BehaviorContext, startX: number, startZ: number, S: DabblerSettings = MALLARD): BehaviorController {
  const b = createSwimmer(ctx, startX, startZ, S)
```

with:

```ts
 * farther from the flock than `whenFarther` swims back to it first. A style that swims as a dabbler on the water and
 * does more besides (the goose's) hands it its own swimmer's body `b`, and takes it back.
 */
export function createDabbler(ctx: BehaviorContext, startX: number, startZ: number, S: DabblerSettings = MALLARD, b: Swimmer = createSwimmer(ctx, startX, startZ, S)): BehaviorController {
```

Create `src/behavior/goose.ts`:

```ts
import type { BehaviorContext, BehaviorController } from './types'
import { approach, between, polygonOf, turnToward, wrap } from './types'
import { createSwimmer, type Swimmer } from './swimmer'
import { createDabbler, type DabblerSettings } from './dabbler'
import { pointInPolygon, randomPointInPolygon, clampToPolygon } from '../location/zones'
import type { PolygonZone } from '../location/schema'
import type { PoseState } from '../birds/model'
import type { Rng } from '../catalog/types'

type Range = readonly [number, number]
type Pt = [number, number]

/** A goose's place in its unit: in a family the gander, his mate, or one of their young; in a loose unit, an adult. */
export type GooseRole = 'gander' | 'goose' | 'young' | 'adult'
type Grazer = Exclude<GooseRole, 'adult'>

/**
 * A goose's settings: on the water a dabbler's, from its own numbers; then the family's trip ashore and back, its
 * grazing, and how it wades, walks, and stands.
 */
export interface GooseSettings extends DabblerSettings {
  /** ring sizes: a dabbler's, and the one ring a goose starts at its breast as it wades out or in */
  rings: DabblerSettings['rings'] & { wade: number }
  /**
   * How it meets the bed, metres of water: no deeper than `stand` it stands on its feet (afloat 0), and from `float`
   * down it floats (afloat 1); between, its feet leave the bed and fold as afloat rises with the depth. `stand` is the
   * built bird's float waterline above its feet, standing.
   */
  wade: { stand: number; float: number }
  /**
   * The family's trip: seconds on the water between trips, and grazing on each; who leads the file out and back (the
   * share of trips each leads); the file's gaps, metres; the stand on the bank after wading out, seconds, and the
   * chance of a shake; the walk's speed, m/s; where the family grazes, metres from the water; how far apart the birds
   * graze, metres; and the loaf on the water after wading back in, seconds
   */
  trip: {
    water: Range; grass: Range
    lead: Record<Grazer, number>
    file: Range
    stand: Range; shake: number
    walk: Range
    fromWater: Range
    spread: Range
    settle: Range
  }
  /**
   * Grazing: bites a second, each a dip of the bill `bite` metres into the sward; a slow step now and then, drifting
   * at `step.speed`; the body tipped `lean` and the bill no steeper than `reachAngle` below level; each role's
   * head-down and head-up bouts, seconds; and how much longer a bird on the edge of the group keeps its head up
   */
  graze: {
    bites: number; bite: number
    step: { every: Range; speed: Range }
    lean: number; reachAngle: number
    bouts: Record<Grazer, { down: Range; up: Range }>
    edge: number
  }
  /** neckExtend standing relaxed (between the trace and erect) and walking */
  neck: { stand: number; walk: number }
  /** the shore it will walk: the steepest rise, metres a metre, and the widest gap between the two zones, metres */
  shore: { slope: number; gap: number }
}

/**
 * The Canada Goose, from docs/research/2026-09-30-canada-goose.md, section 11 (behaviour in section 7). Sourced: the
 * water time budget's proportions (Zoghby 2013), that the gander's change of heading leads the family (Raveling 1969a),
 * the gander's and goose's head-down and head-up bout means (Sedinger & Raveling 1990), that no bird times its bouts
 * by another's (the same), and the bite rate (Heuermann et al. 2011, computed). Everything else is an estimate the
 * research marks as such: the feeding split, every length of time, the speeds, the spacings, the tip-up, the young's
 * bouts, the edge bird's longer looks, and the waddle's place in the walk.
 */
export const CANADA_GOOSE: GooseSettings = {
  // 0.5 m/s (0.4-0.6), the Mallard's by hull length; cruise bouts as the Mallard's (estimate)
  cruise: { speed: 0.5, seconds: [4, 14] },
  // slower to turn than the Mallard's 1.2 for a longer hull (estimate)
  turn: 0.8,
  // eight birds within about 3 m (estimate)
  flock: { radius: 3, retargetSeconds: 60, drift: 3, whenFarther: 6 },
  // 0.8 m in the flock, just over the 0.64 m length; 1.5 m from other birds (estimates: nothing measured)
  spacing: { flock: 0.8, other: 1.5 },
  // feeding 0.40, cruising 0.26, loafing 0.24, preening 0.06, alert 0.04: Zoghby 2013's daytime scans without flying
  // and walking (sourced in proportion)
  cruising: { share: 0.26 },
  loaf: { share: 0.24, seconds: [20, 120] },
  preen: { share: 0.06, seconds: [10, 40] },
  // mean alert bouts 5.6-8.0 s (Sedinger & Raveling 1990): 2-8 here, the neck erect
  alert: { share: 0.04, seconds: [2, 8] },
  // head-dips 0.6, tip-ups 0.25, at the surface 0.15 (estimate; the local photos showed head-dips and no tip-ups)
  feeding: { share: 0.4, split: { surface: 0.15, headDip: 0.6, tipUp: 0.25 } },
  // grazing the surface slowly, the bill about 30 degrees down (estimate)
  surface: { seconds: [5, 20], speed: 0.1, reachAngle: 0.5, lean: 0.05 },
  // 2-6 dips of 2-5 s, 1-3 s up between, the head and neck 0.30 m under (the erect neck's length), the body tipped 0.1
  // rad and the tail 0.1 (estimates)
  headDip: { dips: [2, 6], seconds: [2, 5], gap: [1, 3], depth: 0.3, lean: 0.1, tail: 0.1 },
  // 3-8 s (the Mallard's 4.2 s mean lengthened for a larger bird), 1-3 a bout, 3-10 s level between; 78 degrees (photo
  // 75-80); 2 strokes a second; 0.5 s over and 0.4 s back (estimates)
  tipUp: { count: [1, 3], seconds: [3, 8], gap: [3, 10], lean: 1.36, tail: 0.3, strokes: 2, down: 0.5, up: 0.4 },
  // ring sizes (estimates): a goose's swirls larger than a Mallard's; `ahead` is where the bill goes in, about the
  // bill tip's reach in front of the middle of the body (Task 6 sets it from the built bird)
  rings: { tipUp: 0.8, headDip: 0.6, dabble: 0.3, dabbleEvery: [1, 2], ahead: 0.35, wade: 0.4 },
  // standing, the float's waterline is about 0.14 m above the feet (belly 0.07-0.10 m up, plus the 0.06 m draft); it
  // floats where the water is as deep as the swim zones (0.2 m: the draft and the leg, 0.17) (estimates; Task 6 sets
  // `stand` from the built bird)
  wade: { stand: 0.14, float: 0.2 },
  trip: {
    // 5-20 min on the water, 20-60 min grazing (estimates; a family fed "for over an hour", Kortright 1942)
    water: [300, 1200], grass: [1200, 3600],
    // any bird may lead: the gander 0.4, the goose 0.3, a young bird 0.3 (estimates)
    lead: { gander: 0.4, goose: 0.3, young: 0.3 },
    // a loose file 1-2 body lengths apart (estimate)
    file: [0.6, 1.3],
    // standing 5-20 s on the bank, and half of them shake (estimates)
    stand: [5, 20], shake: 0.5,
    // 0.3-0.5 m/s (estimate), steps of 0.14-0.18 m at 2-3 a second (Nudds & Codd 2012, computed)
    walk: [0.3, 0.5],
    // within 5-20 m of the water (lawns by the water: Smith et al. 1999; broods within 5 m: Eberhardt 1987)
    fromWater: [5, 20],
    // 0.8-2 m apart grazing (estimate)
    spread: [0.8, 2],
    // a loaf on the water after coming back in (estimate)
    settle: [20, 90],
  },
  graze: {
    // 0.9 bites a second (0.8-1.0, computed for a 4 kg goose on a short lawn), each a small dip and pull of the bill
    bites: 0.9, bite: 0.012,
    // a slow step every 2-4 s, drifting 0.03-0.08 m/s (estimate)
    step: { every: [2, 4], speed: [0.03, 0.08] },
    // the body tipped forward a little and the bill steeply down onto the grass (estimates; Task 6 sets them from the
    // built bird against the grazing photo)
    lean: 0.15, reachAngle: 1.2,
    // the gander's and the goose's means sourced (8.4 and 10.7 s down, 8.0 and 5.6 s up), their ranges and the young's
    // bouts estimates: head-up about 0.49 of the time, 0.34, and 0.07
    bouts: {
      gander: { down: [5, 12], up: [4, 12] },
      goose: { down: [7, 15], up: [3, 8] },
      young: { down: [15, 40], up: [1, 3] },
    },
    // edge birds look up for longer (Inglis & Lazarus 1981): 1.3 times (estimate)
    edge: 1.3,
  },
  // standing relaxed, the crown about 0.23 m above the back, between the trace (0.5) and erect (1); walking a little
  // lower (estimates; Task 6 sets `stand` from the built bird)
  neck: { stand: 0.7, walk: 0.6 },
  // banks over 0.5 m high and steeper than 60 degrees stop geese (Cooper 1998); this walks no steeper than 1 in 2,
  // across no more than 8 m of bank between its water and its grass
  shore: { slope: 0.5, gap: 8 },
}

/** The goose settings for a species: the Canada Goose's for every goose so far. */
export function gooseFor(_species?: string): GooseSettings {
  return CANADA_GOOSE
}

/** A straight way across the shore: from `water`, a spot in the water zone, to `land`, a spot in the ashore zone. */
export interface Crossing { water: Pt; land: Pt }

/**
 * A goose's unit, shared by its members: a family (the gander, his mate, and their young) that goes ashore together,
 * or a loose unit of adults that stays on the water. The family's trip is driven by its gander's clock.
 */
export interface GooseUnit {
  readonly family: boolean
  readonly size: number
  /** the members as they are made, by place */
  readonly members: GooseController[]
  /** the family on the water, ashore (walking out and grazing), or on the way back */
  stage: 'water' | 'out' | 'back'
  /** the gander's clock, and when the stage's time is up on it */
  clock: number
  until: number
  /** the trip's way across the shore, the order of the file (places), and where the family grazes */
  crossing: Crossing | null
  order: number[]
  graze: Pt | null
  /** where the family starts: decided by the first bird made, so a scene opens at a random point in the cycle */
  start: 'water' | 'grass' | null
}

/**
 * The units of a cast entry's `groups`: the first a family, each later one a loose unit of adults. A bird's place in
 * the entry picks its unit and its place in it (`placeIn`).
 */
export function gooseUnits(groups: readonly number[]): GooseUnit[] {
  return groups.map((size, i) => ({
    family: i === 0, size, members: [], stage: 'water', clock: 0, until: 0, crossing: null, order: [], graze: null, start: null,
  }))
}

/** The unit and place of the `index`th bird of an entry whose units are `units`. */
export function placeIn(units: readonly GooseUnit[], index: number): { unit: GooseUnit; place: number } {
  let i = index
  for (const unit of units) {
    if (i < unit.size) return { unit, place: i }
    i -= unit.size
  }
  throw new Error(`goose ${index} is past the entry's groups`)
}

/** A goose's role from its unit and place. */
export function roleOf(unit: GooseUnit | undefined, place: number): GooseRole {
  if (!unit?.family) return 'adult'
  return place === 0 ? 'gander' : place === 1 ? 'goose' : 'young'
}

/**
 * Where a goose meets the bed at ground height `ground` (the water's surface is y = 0): its y and afloat. No deeper
 * than `stand` it stands on the bed; from `float` down it floats on the surface; between, the body stays on the water
 * while the feet leave the bed, so y rises from the bed to the surface as afloat does, with no jump at either end.
 */
export function footing(ground: number, wade: GooseSettings['wade']): { y: number; afloat: number } {
  const depth = -ground
  if (depth <= wade.stand) return { y: ground, afloat: 0 }
  if (depth >= wade.float) return { y: 0, afloat: 1 }
  const afloat = (depth - wade.stand) / (wade.float - wade.stand)
  return { y: -(1 - afloat) * wade.stand, afloat }
}

/** how far inside its zone each end of a crossing lies, metres */
const INSET = 0.5
/** a crossing's bank is walked in steps this long, metres, to check its slope */
const STEP = 0.25

/**
 * A way across the shore between `water` and `ashore`: a spot just inside the water zone, deep enough to float, and
 * one just inside the ashore zone, dry, joined by a straight line no steeper than `shore.slope` at any step and no
 * longer than `shore.gap` outside the two zones. With `near`, the one whose land end is nearest it of a few tries;
 * else the first. Null if none of the tries is walkable.
 */
export function findCrossing(water: PolygonZone, ashore: PolygonZone, ground: (x: number, z: number) => number, S: GooseSettings, rng: Rng, near?: Pt): Crossing | null {
  let best: Crossing | null = null, bestD = Infinity
  for (let i = 0; i < 24; i++) {
    const t = randomPointInPolygon(ashore.points, rng)
    const edge = nearestIn(t[0], t[1], water.points)
    const d = Math.hypot(t[0] - edge[0], t[1] - edge[1])
    if (d < 1e-6) continue
    const ux = (t[0] - edge[0]) / d, uz = (t[1] - edge[1]) / d
    const w: Pt = [edge[0] - ux * INSET, edge[1] - uz * INSET]
    if (!pointInPolygon(w[0], w[1], water.points)) continue
    // where the line from the water's edge toward t enters the ashore zone
    let s = 0
    while (s < d && !pointInPolygon(edge[0] + ux * s, edge[1] + uz * s, ashore.points)) s += 0.05
    if (s > S.shore.gap) continue
    const land: Pt = [edge[0] + ux * (s + INSET), edge[1] + uz * (s + INSET)]
    if (!pointInPolygon(land[0], land[1], ashore.points)) continue
    if (!walkable(w, land, ground, S)) continue
    const c = { water: w, land }
    if (!near) return c
    const dn = Math.hypot(land[0] - near[0], land[1] - near[1])
    if (dn < bestD) { best = c; bestD = dn }
  }
  return best
}

/** the nearest point of a convex polygon to (x, z): the point itself if it lies inside */
export function nearestIn(x: number, z: number, points: PolygonZone['points']): Pt {
  if (pointInPolygon(x, z, points)) return [x, z]
  let best: Pt = [points[0]![0], points[0]![1]], bestD = Infinity
  points.forEach(([ax, az], i) => {
    const [bx, bz] = points[(i + 1) % points.length]!
    const [dx, dz] = [bx - ax, bz - az]
    const k = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)))
    const p: Pt = [ax + k * dx, az + k * dz]
    const d = Math.hypot(x - p[0], z - p[1])
    if (d < bestD) { best = p; bestD = d }
  })
  return best
}

/** whether the straight line from `w` (deep enough to float) to `l` (dry) rises no steeper than the shore allows */
function walkable(w: Pt, l: Pt, ground: (x: number, z: number) => number, S: GooseSettings): boolean {
  if (ground(w[0], w[1]) > -S.wade.float || ground(l[0], l[1]) <= 0) return false
  const len = Math.hypot(l[0] - w[0], l[1] - w[1])
  const n = Math.max(1, Math.ceil(len / STEP))
  let prev = ground(w[0], w[1])
  for (let k = 1; k <= n; k++) {
    const y = ground(w[0] + ((l[0] - w[0]) * k) / n, w[1] + ((l[1] - w[1]) * k) / n)
    if (Math.abs(y - prev) > S.shore.slope * (len / n)) return false
    prev = y
  }
  return true
}

/** A goose, as its unit and the tests see it: a swimmer's controller, its role, and what it is doing ashore. */
export interface GooseController extends BehaviorController {
  readonly role: GooseRole
  /** where it is in the family's trip: 'water' while it swims as a dabbler */
  readonly phase: Phase
  /** its own grazing spot, this trip */
  readonly spot: Pt
  /** the family's gander starts each bird on the trip out, and back */
  goOut(): void
  goBack(): void
}

type Phase = 'water' | 'file' | 'wadeOut' | 'stand' | 'walk' | 'graze' | 'walkBack' | 'wadeIn' | 'settle'

/** how fast the pose eases toward what a phase asks, per second */
const NECK_RATE = 2.5
const REACH_RATE = 3
const LEAN_RATE = 3
const GAIT_RATE = 6
/** the fastest it turns on its feet, rad/s, and how nearly it must face its way before it steps off */
const TURN_LAND = 1.5
const FACING = 0.3
/** a spot is reached this close, metres */
const ARRIVE = 0.05
/** a goose held up by another this long, seconds, walks on regardless */
const PATIENCE = 3
/** the nearest it ever walks up to one of its family, metres */
const HARD = 0.45
/** a shake on the bank: how long, seconds, as it settles to stand */
const SHAKE = 1

/**
 * The `goose` style on `swim`. On the water each bird swims as a dabbler, from the goose's own settings. A family (its
 * cast entry's first group) also goes ashore: after its time on the water its gander turns for the shore and holds the
 * heading, and the family follows in a loose file, wades up the bank (its y and afloat from the ground), stands a
 * while, walks out to graze, each bird keeping its own head-down and head-up rhythm by its role, and after its time on
 * the grass walks back in, in file, and loafs before swimming on. A loose unit stays on the water. Every goose stays in
 * the shared swimmers' list, so the other swimmers keep clear of it.
 */
export function createGoose(ctx: BehaviorContext, startX: number, startZ: number, S: GooseSettings = gooseFor(ctx.species)): GooseController {
  const water = polygonOf(ctx)
  const ashore = ctx.ashore?.kind === 'polygon' ? ctx.ashore : undefined
  const unit = ctx.unit?.unit
  const place = ctx.unit?.place ?? 0
  const role = roleOf(unit, place)
  const b: Swimmer = createSwimmer(ctx, startX, startZ, S)
  const family = unit?.family && ashore ? unit : undefined
  const gander = family !== undefined && place === 0

  let phase: Phase = 'water'
  let mind: BehaviorController | null = null
  let y = 0
  let afloat = 1
  let timer = 0
  /** a walk's spot, and the stand's; the bird's own grazing spot */
  let tx = b.x, tz = b.z
  let spot: Pt = [b.x, b.z]
  let walkSpeed = between(ctx.rng, S.trip.walk)
  let gap = between(ctx.rng, S.trip.file)
  let held = 0
  // grazing: whether the head is down, the bout's end, the next step, the bite's phase, and a step under way
  let down = true
  let boutLeft = 0
  let stepIn = 0
  let stepLeft = 0
  let biteAt = 0
  let shake = 0
  let paddlePhase = 0

  const controller: GooseController = {
    name: 'swim',
    get state() { return phase === 'water' ? mind!.state : phase === 'graze' ? (down ? 'headDown' : 'headUp') : phase },
    get phase() { return phase },
    get x() { return b.x }, get y() { return y }, get z() { return b.z }, get heading() { return b.heading },
    get spot() { return spot },
    spacing: S.spacing.other,
    group: b.flock.group,
    role,
    update,
    goOut() { phase = 'file'; gap = between(ctx.rng, S.trip.file); walkSpeed = between(ctx.rng, S.trip.walk) },
    goBack() { phase = 'walkBack'; gap = between(ctx.rng, S.trip.file); held = 0 },
  }
  b.self = controller
  unit?.members.push(controller)
  const members = () => (unit?.members ?? []).filter(m => m !== controller)

  /** the dabbler that swims this bird on the water, made again each time it comes back in */
  function swimAsDabbler(): void {
    mind = createDabbler(ctx, b.x, b.z, S, b)
    b.self = controller
    phase = 'water'
  }

  // where the family opens the scene: the first bird made decides, by the shares of the cycle's means
  if (family && family.start === null) {
    const w = (S.trip.water[0] + S.trip.water[1]) / 2, g = (S.trip.grass[0] + S.trip.grass[1]) / 2
    family.start = ctx.rng() < g / (w + g) ? 'grass' : 'water'
    if (family.start === 'grass') {
      family.stage = 'out'
      family.graze = grazeCentre()
      family.until = ctx.rng() * between(ctx.rng, S.trip.grass)
    } else family.until = ctx.rng() * between(ctx.rng, S.trip.water)
  }
  if (family?.start === 'grass') {
    spot = grazeSpot()
    ;[b.x, b.z] = spot
    phase = 'graze'
    startBout(ctx.rng() < 0.5)
    ;({ y, afloat } = footing(ctx.ground(b.x, b.z), S.wade))
  } else swimAsDabbler()

  /** a point in the ashore zone `fromWater` metres from the water zone, where the family grazes */
  function grazeCentre(): Pt {
    let best = randomPointInPolygon(ashore!.points, ctx.rng)
    for (let i = 0; i < 40; i++) {
      const p = randomPointInPolygon(ashore!.points, ctx.rng)
      const e = nearestIn(p[0], p[1], water.points)
      const d = Math.hypot(p[0] - e[0], p[1] - e[1])
      if (d >= S.trip.fromWater[0] && d <= S.trip.fromWater[1]) { best = p; break }
    }
    return best
  }
  /** this bird's own spot near the family's grazing centre, clear of the spots of those placed before it */
  function grazeSpot(): Pt {
    const c = family!.graze!
    const taken = members().map(m => m.spot)
    let best: Pt = clampToPolygon(c[0], c[1], ashore!.points)
    for (let i = 0; i < 60; i++) {
      const a = ctx.rng() * Math.PI * 2, r = Math.sqrt(ctx.rng()) * S.trip.spread[1] * 1.2
      const p = clampToPolygon(c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, ashore!.points)
      best = p
      if (taken.every(q => Math.hypot(q[0] - p[0], q[1] - p[1]) >= S.trip.spread[0] + 0.1)) break
    }
    return best
  }

  /**
   * The order of a file, by places: a leader by the lead shares, then the young, and the parents at the rear: when one
   * parent leads the other brings up the rear, and when a young bird leads, the goose and then the gander
   */
  function fileOrder(): number[] {
    const places = family!.members.map((_, i) => i)
    const young = places.filter(i => i >= 2)
    for (let i = young.length - 1; i > 0; i--) { const j = Math.floor(ctx.rng() * (i + 1)); [young[i], young[j]] = [young[j]!, young[i]!] }
    const r = ctx.rng() * (S.trip.lead.gander + S.trip.lead.goose + S.trip.lead.young)
    if (r < S.trip.lead.gander || young.length === 0 && r < S.trip.lead.gander + S.trip.lead.young) return [0, ...young, 1]
    if (r < S.trip.lead.gander + S.trip.lead.goose) return [1, ...young, 0]
    return [...young, 1, 0]
  }

  /** the gander's part: the family's clock, and when the trip starts, turns at the grass, and is over */
  function lead(): void {
    const f = family!
    const all = f.members
    if (f.stage === 'water') {
      if (f.clock < f.until || all.some(m => m.phase !== 'water')) return
      const c = findCrossing(water, ashore!, ctx.ground, S, ctx.rng)
      if (!c) { f.until = f.clock + between(ctx.rng, S.trip.water); return }
      f.stage = 'out'; f.crossing = c; f.order = fileOrder(); f.graze = grazeCentre(); f.until = Infinity
      for (const m of all) m.goOut()
    } else if (f.stage === 'out') {
      if (f.until === Infinity) {
        if (phase === 'graze') f.until = f.clock + between(ctx.rng, S.trip.grass)
        return
      }
      if (f.clock < f.until) return
      const c = findCrossing(water, ashore!, ctx.ground, S, ctx.rng, [b.x, b.z])
      if (!c) { f.until = f.clock + 60; return }
      f.stage = 'back'; f.crossing = c; f.order = fileOrder()
      for (const m of all) m.goBack()
    } else if (all.every(m => m.phase === 'water')) {
      f.stage = 'water'; f.until = f.clock + between(ctx.rng, S.trip.water)
    }
  }

  /** the bird ahead of this one in the file, if any */
  function ahead(): GooseController | undefined {
    const f = family!
    const k = f.order.indexOf(place)
    return k > 0 ? f.members[f.order[k - 1]!] : undefined
  }

  /** a file's place for this bird: its gap behind the bird ahead, on the far side of it from where the file is going */
  function behind(a: GooseController, to: Pt, zone: PolygonZone): Pt {
    const d = Math.hypot(to[0] - a.x, to[1] - a.z)
    return d < 1e-6 ? to : nearestIn(a.x - ((to[0] - a.x) / d) * gap, a.z - ((to[1] - a.z) / d) * gap, zone.points)
  }

  /**
   * One step on its feet toward (px, pz) at `speed`, straight for it, so a walk between two spots in a zone stays in
   * it: it turns first and steps off once it faces the way. It waits for a family member it would come within the
   * file's least gap of; after PATIENCE it walks on, though never within HARD of one, and after twice that it steps
   * aside. Returns the distance left.
   */
  function walkTo(px: number, pz: number, speed: number, dt: number, pose: PoseState, keepIn?: PolygonZone['points']): number {
    const d = Math.hypot(px - b.x, pz - b.z)
    if (d < ARRIVE) return d
    const want = Math.atan2(-(pz - b.z), px - b.x)
    b.heading = turnToward(b.heading, want, TURN_LAND * dt)
    if (Math.abs(wrap(want - b.heading)) > FACING) return d
    const step = Math.min(d, speed * dt)
    let nx = b.x + ((px - b.x) / d) * step, nz = b.z + ((pz - b.z) / d) * step
    const closing = (least: number) => members().some(m => {
      const now = Math.hypot(m.x - nx, m.z - nz)
      return now < least && now < Math.hypot(m.x - b.x, m.z - b.z)
    })
    if (closing(S.trip.file[0])) {
      held += dt
      if (held < PATIENCE) return d
      if (held > 2 * PATIENCE) {
        // aside, square to its way, on the side away from the nearest of the family
        const n = members().reduce((a, m) => (Math.hypot(m.x - b.x, m.z - b.z) < Math.hypot(a.x - b.x, a.z - b.z) ? m : a))
        const side = Math.sign((px - b.x) * (n.z - b.z) - (pz - b.z) * (n.x - b.x)) || 1
        nx = b.x + (side * (pz - b.z) / d) * step; nz = b.z - (side * (px - b.x) / d) * step
        if (keepIn && !pointInPolygon(nx, nz, keepIn)) return d
      }
      if (closing(HARD)) return d
    } else held = 0
    pose.strideDistance += Math.hypot(nx - b.x, nz - b.z)
    b.x = nx; b.z = nz
    return Math.hypot(px - b.x, pz - b.z)
  }

  /** set y and afloat from the ground under the bird, and ring the water at its breast as it wades out or in */
  function meetGround(): void {
    const was = afloat
    ;({ y, afloat } = footing(ctx.ground(b.x, b.z), S.wade))
    if ((was > 0.5) !== (afloat > 0.5)) ctx.onRipple?.(b.x + Math.cos(b.heading) * 0.2, b.z - Math.sin(b.heading) * 0.2, S.rings.wade)
  }

  function startBout(isDown: boolean): void {
    down = isDown
    const bouts = S.graze.bouts[role === 'adult' ? 'goose' : role]
    boutLeft = between(ctx.rng, down ? bouts.down : bouts.up)
    // a bird on the edge of the grazing group, furthest from its middle, looks up for longer
    if (!down && onEdge()) boutLeft *= S.graze.edge
    stepIn = between(ctx.rng, S.graze.step.every)
  }
  function onEdge(): boolean {
    const grazing = (family?.members ?? []).filter(m => m.phase === 'graze' || m === controller)
    if (grazing.length < 3) return false
    const cx = grazing.reduce((s, m) => s + m.x, 0) / grazing.length, cz = grazing.reduce((s, m) => s + m.z, 0) / grazing.length
    const far = (m: { x: number; z: number }) => Math.hypot(m.x - cx, m.z - cz)
    return grazing.every(m => far(m) <= far(controller))
  }

  /** a slow grazing step's way: on its heading, or toward the family if it has drifted off, or away from one too close */
  function stepWay(): Pt {
    const others = (family?.members ?? []).filter(m => m !== controller && m.phase === 'graze')
    let [dx, dz] = [Math.cos(b.heading + (ctx.rng() - 0.5)), -Math.sin(b.heading + (ctx.rng() - 0.5))]
    const nearest = others.reduce<GooseController | null>((n, m) => (!n || Math.hypot(m.x - b.x, m.z - b.z) < Math.hypot(n.x - b.x, n.z - b.z) ? m : n), null)
    if (nearest) {
      const d = Math.hypot(nearest.x - b.x, nearest.z - b.z)
      if (d > S.trip.spread[1]) [dx, dz] = [(nearest.x - b.x) / d, (nearest.z - b.z) / d]
      else if (d < S.trip.spread[0] + 0.1) [dx, dz] = [(b.x - nearest.x) / d, (b.z - nearest.z) / d]
    }
    return [b.x + dx, b.z + dz]
  }

  function update(dt: number, pose: PoseState): void {
    if (gander) { family!.clock += dt; lead() }
    if (phase === 'water') {
      mind!.update(dt, pose)
      y = 0; afloat = 1
      pose.afloat = 1
      pose.gait = approach(pose.gait, 0, GAIT_RATE, dt)
      return
    }
    let neck = S.neck.walk, reach = 0, lean = 0, gaitWant = 0
    const f = family!
    const c = f.crossing!
    switch (phase) {
      case 'file': {
        // on the water to the shore: the leader straight for the crossing, the rest each behind the bird ahead
        const a = ahead()
        const [px, pz] = a && a.phase === 'file' ? behind(a, c.water, water) : c.water
        const lag = a ? Math.hypot(a.x - b.x, a.z - b.z) : 0
        b.swimTo(px, pz, S.cruise.speed * (a && lag > gap * 1.5 ? 1.3 : 1), dt)
        neck = 0.6
        const clear = !a || (a.phase !== 'file' && Math.hypot(a.x - b.x, a.z - b.z) >= gap)
        if (Math.hypot(c.water[0] - b.x, c.water[1] - b.z) < 1 && clear) { phase = 'wadeOut'; held = 0 }
        break
      }
      case 'wadeOut': {
        const a = ahead()
        const tooClose = a && a.phase === 'wadeOut' && Math.hypot(a.x - b.x, a.z - b.z) < gap
        if (!tooClose) walkTo(c.land[0], c.land[1], walkSpeed, dt, pose)
        meetGround()
        neck = S.neck.walk
        gaitWant = tooClose ? 0 : 1 - afloat
        if (Math.hypot(c.land[0] - b.x, c.land[1] - b.z) < ARRIVE) {
          // it steps on up the bank to stand in the file, the leader furthest on
          const k = f.order.indexOf(place)
          const ux = c.land[0] - c.water[0], uz = c.land[1] - c.water[1], ul = Math.hypot(ux, uz)
          const on = 1 + (f.order.length - 1 - k) * 0.9
          ;[tx, tz] = clampToPolygon(c.land[0] + (ux / ul) * on, c.land[1] + (uz / ul) * on, ashore!.points)
          phase = 'stand'; timer = between(ctx.rng, S.trip.stand); shake = ctx.rng() < S.trip.shake ? SHAKE : 0
        }
        break
      }
      case 'stand': {
        const left = walkTo(tx, tz, walkSpeed, dt, pose, ashore!.points)
        meetGround()
        if (left < ARRIVE) {
          timer -= dt
          neck = S.neck.stand
          shake = Math.max(0, shake - dt)
          if (timer <= 0) { phase = 'walk'; spot = grazeSpot(); [tx, tz] = spot }
        } else { neck = S.neck.walk; gaitWant = 1 }
        break
      }
      case 'walk': {
        const left = walkTo(tx, tz, walkSpeed, dt, pose, ashore!.points)
        meetGround()
        gaitWant = 1
        if (left < ARRIVE) { phase = 'graze'; startBout(true) }
        break
      }
      case 'graze': {
        boutLeft -= dt
        if (boutLeft <= 0) startBout(!down)
        if (down) {
          neck = 0.5; reach = 1; lean = S.graze.lean
          // a slow step now and then
          stepIn -= dt
          if (stepIn <= 0 && stepLeft <= 0) { stepLeft = between(ctx.rng, S.graze.step.speed) * between(ctx.rng, S.graze.step.every); [tx, tz] = stepWay(); stepIn = between(ctx.rng, S.graze.step.every) }
        } else { neck = 1; stepLeft = 0 }
        if (stepLeft > 0) {
          const [px, pz] = nearestIn(tx, tz, ashore!.points)
          const x0 = b.x, z0 = b.z
          walkTo(px, pz, 0.25, dt, pose, ashore!.points)
          stepLeft -= Math.hypot(b.x - x0, b.z - z0) || dt * 0.25
          gaitWant = 1
        }
        meetGround()
        break
      }
      case 'walkBack': {
        const a = ahead()
        const [px, pz] = a && a.phase === 'walkBack' ? behind(a, c.land, ashore!) : c.land
        walkTo(px, pz, walkSpeed, dt, pose, ashore!.points)
        meetGround()
        gaitWant = 1
        const clear = !a || (a.phase !== 'walkBack' && Math.hypot(a.x - b.x, a.z - b.z) >= gap)
        if (Math.hypot(c.land[0] - b.x, c.land[1] - b.z) < 0.3 && clear) { phase = 'wadeIn'; held = 0 }
        break
      }
      case 'wadeIn': {
        const a = ahead()
        const tooClose = a && a.phase === 'wadeIn' && Math.hypot(a.x - b.x, a.z - b.z) < gap
        if (!tooClose) walkTo(c.water[0], c.water[1], walkSpeed, dt, pose)
        meetGround()
        gaitWant = tooClose ? 0 : 1 - afloat
        if (Math.hypot(c.water[0] - b.x, c.water[1] - b.z) < ARRIVE) {
          // out a little from the shore, then a loaf
          const ux = c.water[0] - c.land[0], uz = c.water[1] - c.land[1], ul = Math.hypot(ux, uz)
          ;[tx, tz] = clampToPolygon(b.x + (ux / ul) * 2.5, b.z + (uz / ul) * 2.5, water.points)
          phase = 'settle'; timer = between(ctx.rng, S.trip.settle)
        }
        break
      }
      case 'settle': {
        b.swimTo(tx, tz, S.cruise.speed * 0.6, dt)
        y = 0; afloat = 1
        neck = 0.15
        timer -= dt
        if (timer <= 0) { swimAsDabbler(); pose.afloat = 1; return }
        break
      }
    }
    // bites while the head is down: a quick dip and pull of the bill, `bites` a second
    biteAt = (biteAt + S.graze.bites * dt) % 1
    const bite = phase === 'graze' && down ? Math.max(0, Math.sin(biteAt * Math.PI * 2)) ** 4 * S.graze.bite : 0
    pose.afloat = afloat
    pose.neckExtend = approach(pose.neckExtend, neck, NECK_RATE, dt)
    pose.reach = approach(pose.reach, reach, REACH_RATE, dt)
    // a bite is quick; a head coming up out of the water, as the bird turns for the shore mid-dip, is not
    pose.reachDepth = approach(pose.reachDepth, bite, phase === 'graze' && down ? 30 : REACH_RATE, dt)
    pose.reachAngle = approach(pose.reachAngle, reach > 0 ? S.graze.reachAngle : Math.PI / 2, REACH_RATE, dt)
    pose.lean.x = approach(pose.lean.x, lean, LEAN_RATE, dt)
    // a shake: a quick roll from side to side
    pose.lean.z = approach(pose.lean.z, phase === 'stand' && shake > 0 && shake < SHAKE ? 0.12 * Math.sin(shake * Math.PI * 8) : 0, 12, dt)
    pose.tailTilt = approach(pose.tailTilt, 0, LEAN_RATE, dt)
    pose.paddle = approach(pose.paddle, 0, 4, dt)
    paddlePhase = (paddlePhase + S.tipUp.strokes * dt) % 1
    pose.paddlePhase = paddlePhase
    pose.headBob = approach(pose.headBob, 0, 4, dt)
    pose.gait = approach(pose.gait, gaitWant, GAIT_RATE, dt)
  }

  return controller
}
```

In `src/behavior/swim.ts`, replace:

```ts
import { createGrebe, GREBE } from './grebe'
```

with:

```ts
import { createGrebe, GREBE } from './grebe'
import { createGoose, gooseFor } from './goose'
```

In `src/behavior/swim.ts`, replace:

```ts
    case 'grebe': return createGrebe(ctx, startX, startZ)
```

with:

```ts
    case 'grebe': return createGrebe(ctx, startX, startZ)
    case 'goose': return createGoose(ctx, startX, startZ)
```

In `src/behavior/swim.ts`, replace:

```ts
  const S = foraging === 'shoveler' ? SHOVELER : foraging === 'coot' ? COOT : foraging === 'grebe' ? GREBE : dabblerFor(species)
```

with:

```ts
  const S = foraging === 'shoveler' ? SHOVELER : foraging === 'coot' ? COOT : foraging === 'grebe' ? GREBE : foraging === 'goose' ? gooseFor(species) : dabblerFor(species)
```

In `src/behavior/swimmer.ts`, replace:

```ts
}

/**
 * Pick the next activity so that over time each takes its `share` of the bird's time: a spell of mean length `mean`
```

with:

```ts
}

/** A swimmer's body, as createSwimmer makes it: a style moves it with its moves, or sets its place itself. */
export type Swimmer = ReturnType<typeof createSwimmer>

/**
 * Pick the next activity so that over time each takes its `share` of the bird's time: a spell of mean length `mean`
```

In `src/behavior/types.ts`, replace:

```ts
import type { Foraging } from '../birds/spec'
```

with:

```ts
import type { Foraging } from '../birds/spec'
import type { GooseUnit } from './goose'
```

In `src/behavior/types.ts`, replace:

```ts
  neighbours?: () => readonly Neighbour[]
```

with:

```ts
  neighbours?: () => readonly Neighbour[]
  /** the goose style: the zone its family walks out to graze, across the shore from its own (the cast's `ashore`) */
  ashore?: Zone
  /** the goose style: its unit (a family, or a loose unit of adults, from the cast's `groups`) and its place in it */
  unit?: { unit: GooseUnit; place: number }
```

In `src/birds/spawn.ts`, replace:

```ts
import { heronStart, heronFor } from '../behavior/heron'
```

with:

```ts
import { heronStart, heronFor } from '../behavior/heron'
import { gooseUnits, placeIn, type GooseUnit } from '../behavior/goose'
```

In `src/birds/spawn.ts`, replace:

```ts
export interface Individual { species: string; variant?: string; behavior: Behavior; zone: string; groupKey: string }
```

with:

```ts
/**
 * One bird of the cast. A goose entry's birds also carry its `ashore` zone and its `groups` (without them, one family of
 * the whole entry), and each its `index` in the entry, which places it in its unit.
 */
export interface Individual {
  species: string; variant?: string; behavior: Behavior; zone: string; groupKey: string
  ashore?: string; groups?: number[]; index?: number
}
```

In `src/birds/spawn.ts`, replace:

```ts
    for (const variant of versionsFor(entry, rng)) {
      out.push({ species: entry.species, variant, behavior: entry.behavior, zone: entry.zone, groupKey: `cast${i}` })
    }
```

with:

```ts
    versionsFor(entry, rng).forEach((variant, index) => {
      const goose = entry.groups || entry.ashore ? { ashore: entry.ashore, groups: entry.groups ?? [entry.count], index } : {}
      out.push({ species: entry.species, variant, behavior: entry.behavior, zone: entry.zone, groupKey: `cast${i}`, ...goose })
    })
```

In `src/birds/spawn.ts`, replace:

```ts
  const herons: BehaviorController[] = []
```

with:

```ts
  const herons: BehaviorController[] = []
  /** each goose entry's units, by its group key: its family and its loose units */
  const units = new Map<string, GooseUnit[]>()
```

In `src/birds/spawn.ts`, replace:

```ts
      neighbours: swim ? () => swimmers : heron ? () => herons : undefined,
```

with:

```ts
      neighbours: swim ? () => swimmers : heron ? () => herons : undefined,
      // a goose: the zone its family walks out to, and its unit and place in it
      ashore: swim && ind.ashore ? loc.zones[ind.ashore] : undefined,
      unit: swim && ind.index !== undefined ? unitOf(ind) : undefined,
```

In `src/birds/spawn.ts`, replace:

```ts
    birds.push({ controller, pose, model })
```

with:

```ts
    birds.push({ controller, pose, model })
  }

  function unitOf(ind: Individual): { unit: GooseUnit; place: number } {
    if (!units.has(ind.groupKey)) units.set(ind.groupKey, gooseUnits(ind.groups!))
    return placeIn(units.get(ind.groupKey)!, ind.index!)
```

In `src/birds/spec.ts`, replace:

```ts
export const SWIM_STYLES = ['dabbler', 'shoveler', 'coot', 'grebe'] as const
```

with:

```ts
export const SWIM_STYLES = ['dabbler', 'shoveler', 'coot', 'grebe', 'goose'] as const
```

In `src/birds/species/cangoo.ts`, replace:

```ts
  wingbeatHz: 2.6,
```

with:

```ts
  wingbeatHz: 2.6,
  foraging: 'goose',
```

In `src/location/schema.ts`, replace:

```ts
  formation: z.enum(['line', 'vee']).optional(),
```

with:

```ts
  formation: z.enum(['line', 'vee']).optional(),
  /** the goose style only: the polygon zone its family walks out to graze, across the shore from `zone` */
  ashore: z.string().min(1).optional(),
  /**
   * the goose style only: the entry's birds in their units, in order, summing to `count`: the first a family (a pair
   * and its young), each later one a loose unit of adults
   */
  groups: z.array(z.number().int().min(1)).min(1).optional(),
```

In `src/location/validate.ts`, replace:

```ts
    }
    const zone = loc.zones[entry.zone]
```

with:

```ts
    }
    errors.push(...checkGoose(loc, entry, i, style === 'goose' && entry.behavior === 'swim'))
    const zone = loc.zones[entry.zone]
```

In `src/location/validate.ts`, replace:

```ts

/** Every ambience id the location names must be a layer in the manifest, once. */
```

with:

```ts

/**
 * The goose style's fields: a goose entry names a polygon zone its family walks out to (`ashore`), and only a goose
 * entry names one or gives `groups`, which add up to its count, the first (the family) a pair and at least one young.
 */
function checkGoose(loc: Location, entry: Location['cast'][number], i: number, goose: boolean): string[] {
  const errors: string[] = []
  if (!goose) {
    if (entry.ashore !== undefined) errors.push(`cast[${i}]: only the goose style goes ashore; ${entry.species} has no use for ${entry.ashore}`)
    if (entry.groups !== undefined) errors.push(`cast[${i}]: only the goose style keeps groups; ${entry.species} swims in one flock`)
    return errors
  }
  if (entry.ashore === undefined) errors.push(`cast[${i}]: ${entry.species} feeds as a goose, so it needs an ashore zone to walk out to`)
  else {
    const zone = loc.zones[entry.ashore]
    if (!zone) errors.push(`cast[${i}]: ashore zone ${entry.ashore} does not exist`)
    else if (zone.kind !== 'polygon') errors.push(`cast[${i}]: ashore needs a polygon zone, ${entry.ashore} is ${zone.kind}`)
  }
  if (entry.groups) {
    const sum = entry.groups.reduce((a, b) => a + b, 0)
    if (sum !== entry.count) errors.push(`cast[${i}]: groups add up to ${sum}, not the count of ${entry.count}`)
    if (entry.groups[0]! < 3) errors.push(`cast[${i}]: the first group is a family, a pair and at least one young, not ${entry.groups[0]}`)
  }
  return errors
}

/** Every ambience id the location names must be a layer in the manifest, once. */
```

- [ ] **Step 3: See it pass**

Run: `npx vitest run src/behavior/goose.test.ts src/location/validate.test.ts src/birds/spec.test.ts src/birds/spawn.test.ts && npx tsc --noEmit -p .`
Expected: 71 tests pass, the goose style's 21 among them. No type errors. The goose tests take about a minute: they run families for hours of game time.

Run: `npm test`
Expected: every test passes (1113).

- [ ] **Step 4: Commit**

```bash
git add src/behavior src/birds/spec.ts src/birds/spec.test.ts src/birds/spawn.ts src/birds/spawn.test.ts src/birds/species/cangoo.ts src/location
git commit -m "feat: the goose style on swim: a dabbler on the water from the goose's own settings; the family turns for the shore after the gander, wades out in a loose file with its y and afloat from the ground, grazes with each bird's own head-down and head-up rhythm by its role, and walks back in; a loose unit stays on the water; ashore and groups in the cast (Task 4)"
```

---

### Task 5: The flat, its zones and lawn, and the geese in the cast

**Files:**
- Modify: `src/world/heightfield.ts`, `src/world/terrain.ts`, `src/world/vegetation.ts`, `src/world/floaters.ts`,
  `src/main.tsx`, `data/locations/lake.json`, `src/world/heightfield.test.ts`, `src/world/floaters.test.ts`,
  `src/location/zoneTerrain.test.ts`, `src/birds/cast.test.ts`

**Interfaces:**
- Consumes: Task 4's `CANADA_GOOSE.wade.float` and `findCrossing`, and the goose style.
- Produces: see "Interfaces between the tasks" for `FLAT`, `flatShoreDistance`, `Heightfield.lawn`, `terrainColor`'s
  lawn, `createGrass`'s options, the two zones, and the cast entry.

Where it goes: past the mudflat the basin's rim runs diagonally from about (27.6, -10) to (43.8, -26), and the bank
there stood a metre above the water in one step (both read on the rendered surface while planning). The flat is blended
in after the bench, over x 30-44 and z -24 to -8:
- its top is 0.3 m above the water, gently uneven by up to 4 cm either way;
- on its lake side it slopes into the water at 1 in 4 square to the rim's line, until it meets the lake bed, which it
  never digs below; the line runs along the terrain mesh's cell diagonals, so the rendered slope is that plane;
- it eases back into the ground within a metre on its lake sides and over 4 m on its land sides, where the ground
  behind it stands a metre higher (eased within a metre there, the binoculars showed a wall);
- it leaves the mudflat, the bench, and the shallows exactly as they were (a test holds the ground over x 16-28, z -16
  to -5, to the last bit).

Its dry ground is lawn: the terrain is grass-coloured there however low it lies, down to the wet band at the water, and
a grazed sward of short blades, 6 cm tall and 12 mm wide, is scattered over it, out of the mirror as the near grass is.

`goose-flat` lies on the flat's top, 32-49 m from the vantage; `goose-water` lies off it, deeper than the swim band's
20 cm everywhere; the bank between is 4-5 m wide, and every way across it the style finds rises no steeper than 1 in 3
on the rendered surface. The zone tests check both zones against the terrain, the ashore zone through the cast's new
`ashore` field.

The cast gains the geese: a family of five and a loose unit of three on `goose-water`, going ashore to `goose-flat`. They
are block birds (a swimming block, with no legs) until Task 6, so on the grass they look like decoys set out on a lawn.
Their head-dips and tip-ups join the whole cast's ring budget. The floaters' buffer holds 48; the cast now has at most 45
in the water.

- [ ] **Step 1: The failing tests**

In `src/birds/cast.test.ts`, replace:

```ts
 * Everything on the lake that rings the water: the 24 swimmers, each in the style its species file names, the six
 * dowitchers, the Kingfisher, whose dives ring too, and the herons' strikes.
```

with:

```ts
 * Everything on the lake that rings the water: the 32 swimmers, each in the style its species file names, the six
 * dowitchers, the Kingfisher, whose dives ring too, and the herons' strikes. The geese never find a bank to walk up
 * here (the ground is a metre down everywhere), so they spend all their time on the water, dipping and tipping up: the
 * most they can ring it.
```

In `src/birds/cast.test.ts`, replace:

```ts
  const RINGS = ['y00475', 'mallar3', 'gadwal', 'amewig', 'norsho', 'pibgre', 'lobdow', 'belkin1', 'grbher3', 'greegr']
```

with:

```ts
  const RINGS = ['y00475', 'mallar3', 'gadwal', 'amewig', 'norsho', 'pibgre', 'lobdow', 'belkin1', 'grbher3', 'greegr', 'cangoo']
```

In `src/birds/cast.test.ts`, replace:

```ts
    // (seeds 42 and 7), the live rings averaged 28-29 and peaked at 46-48 of the 64, with nothing pushed out.
```

with:

```ts
    // (seeds 42 and 7), the live rings averaged 28-29 and peaked at 46-48 of the 64, with nothing pushed out. With the
    // eight geese on the water all the time, at 60 frames a second (seeds 42, 7, and 11), they averaged 37-39 and peaked
    // at 57-60, 3-6 more than without the geese, with nothing pushed out (goose round, Task 5).
```

In `src/location/zoneTerrain.test.ts`, replace:

```ts
import { HERON_WATER } from '../behavior/heron'
```

with:

```ts
import { HERON_WATER } from '../behavior/heron'
import { CANADA_GOOSE, findCrossing } from '../behavior/goose'
import { FLAT } from '../world/heightfield'
import { makeRng } from '../catalog/rng'
```

In `src/location/zoneTerrain.test.ts`, replace:

```ts
  wade: y => y > -0.3,
```

with:

```ts
  wade: y => y > -0.3,
  // a goose's grass: above the water, no higher than the flat's top
  ashore: y => y > 0.05 && y <= FLAT.top + FLAT.rough / 2,
```

In `src/location/zoneTerrain.test.ts`, replace:

```ts
    seen.add(key)
```

with:

```ts
    seen.add(key)

    if (entry.ashore && !seen.has(`${entry.ashore}:ashore`)) {
      seen.add(`${entry.ashore}:ashore`)
      const ashore = loc.zones[entry.ashore]!
      it(`${entry.ashore} (ashore, from ${entry.zone}) samples all agree with the terrain`, () => {
        expect(ashore.kind).toBe('polygon')
        if (ashore.kind !== 'polygon') return
        const samples = samplePolygon(ashore.points, 0.25)
        expect(samples.length).toBeGreaterThan(1000)
        for (const [x, z] of samples) expect(GROUND_OK.ashore!(heightfield.sample(x, z)), `(${x}, ${z})`).toBe(true)
      })
    }
```

In `src/location/zoneTerrain.test.ts`, replace:

```ts
  })
  it('keeps the bench belly-deep for a dowitcher, all over', () => {
```

with:

```ts
  })
  it('keeps the geese\'s water deep enough for a goose to float, all over, and their flat dry and on the flat\'s top', () => {
    const water = loc.zones['goose-water'], flat = loc.zones['goose-flat']
    expect([water?.kind, flat?.kind]).toEqual(['polygon', 'polygon'])
    if (water?.kind !== 'polygon' || flat?.kind !== 'polygon') return
    for (const [x, z] of samplePolygon(water.points, 0.25)) expect(heightfield.sample(x, z), `(${x}, ${z})`).toBeLessThanOrEqual(-CANADA_GOOSE.wade.float)
    for (const [x, z] of flat.points) {
      expect(x).toBeGreaterThanOrEqual(FLAT.x[0]); expect(x).toBeLessThanOrEqual(FLAT.x[1])
      expect(z).toBeGreaterThanOrEqual(FLAT.z[0]); expect(z).toBeLessThanOrEqual(FLAT.z[1])
    }
  })
  it('lets the geese walk up and down the bank between their water and their flat: no steeper than 1 in 3 at any step', () => {
    const water = loc.zones['goose-water'], flat = loc.zones['goose-flat']
    if (water?.kind !== 'polygon' || flat?.kind !== 'polygon') throw new Error('no goose zones')
    // every way across the shore the style finds, over many tries, on the rendered surface
    const rng = makeRng(5)
    let found = 0, worst = 0
    for (let i = 0; i < 200; i++) {
      const c = findCrossing(water, flat, (x, z) => heightfield.sample(x, z), CANADA_GOOSE, rng)
      if (!c) continue
      found++
      const len = Math.hypot(c.land[0] - c.water[0], c.land[1] - c.water[1]), n = Math.ceil(len / 0.25)
      for (let k = 1; k <= n; k++) {
        const at = (j: number) => heightfield.sample(c.water[0] + ((c.land[0] - c.water[0]) * j) / n, c.water[1] + ((c.land[1] - c.water[1]) * j) / n)
        worst = Math.max(worst, Math.abs(at(k) - at(k - 1)) / (len / n))
      }
    }
    expect(found).toBe(200)
    expect(worst).toBeLessThan(1 / 3)
  })
  it('keeps the flat smooth under the geese: no step of 0.25 m over its zone rises more than 2 cm', () => {
    const flat = loc.zones['goose-flat']
    if (flat?.kind !== 'polygon') throw new Error('no goose-flat')
    for (const [x, z] of samplePolygon(flat.points, 0.25)) {
      expect(Math.abs(heightfield.sample(x + 0.25, z) - heightfield.sample(x, z)), `(${x}, ${z})`).toBeLessThan(0.02)
      expect(Math.abs(heightfield.sample(x, z + 0.25) - heightfield.sample(x, z)), `(${x}, ${z})`).toBeLessThan(0.02)
    }
  })
  it('keeps the bench belly-deep for a dowitcher, all over', () => {
```

In `src/world/floaters.test.ts`, replace:

```ts
      expect(most).toBeLessThanOrEqual(37)
```

with:

```ts
      expect(most).toBeLessThanOrEqual(45)
```

In `src/world/heightfield.test.ts`, replace:

```ts
import { lakeHeightfield, terrainColor, valueNoise2, wetDarkening, WET, BENCH, SHELF } from './heightfield'
```

with:

```ts
import { lakeHeightfield, terrainColor, valueNoise2, wetDarkening, flatShoreDistance, WET, BENCH, SHELF, FLAT } from './heightfield'
```

In `src/world/heightfield.test.ts`, replace:

```ts
  })
  it('rises on the far shore', () => {
```

with:

```ts
  })
  it('lays a grassy flat on the right shore past the mudflat: its top a few tens of centimetres up, gently uneven', () => {
    const top: number[] = []
    for (let x = FLAT.x[0]; x <= FLAT.x[1]; x += 0.5) {
      for (let z = FLAT.z[0]; z <= FLAT.z[1]; z += 0.5) {
        if (flatShoreDistance(x, z) * FLAT.slope >= FLAT.top + FLAT.rough) top.push(hf.sample(x, z))
      }
    }
    expect(top.length).toBeGreaterThan(400)
    expect(Math.min(...top)).toBeGreaterThanOrEqual(FLAT.top - FLAT.rough / 2)
    expect(Math.max(...top)).toBeLessThanOrEqual(FLAT.top + FLAT.rough / 2)
    expect(Math.max(...top) - Math.min(...top)).toBeGreaterThan(FLAT.rough / 4)
  })
  it('slopes the flat into the water at 1 in 4 square to its shore, where the old bank stood a metre high', () => {
    const without = lakeHeightfield(1, { flat: false })
    let ramp = 0
    for (let x = FLAT.x[0]; x <= FLAT.x[1]; x += 0.25) {
      for (let z = FLAT.z[0]; z <= FLAT.z[1]; z += 0.25) {
        const s = flatShoreDistance(x, z)
        // on the slope: below the top, above the lake bed it meets
        if (s * FLAT.slope > Math.min(without.sample(x, z), 0) && s * FLAT.slope < FLAT.top - FLAT.rough / 2) {
          ramp++
          expect(hf.sample(x, z), `(${x}, ${z})`).toBeCloseTo(s * FLAT.slope, 9)
        }
      }
    }
    expect(ramp).toBeGreaterThan(300)
    // the old bank: a metre's step at the basin's rim, now gone
    expect(without.sample(38, -16) - without.sample(36, -18)).toBeGreaterThan(0.8)
  })
  it('eases the flat back into the ground within a metre on its lake sides and a gentler slope on its land sides, and leaves the mudflat, the bench, and the shallows as they were', () => {
    const without = lakeHeightfield(1, { flat: false })
    const around: [number, number][] = [[FLAT.x[0] - 2, -16], [FLAT.x[1] + FLAT.back + 1, -16], [37, FLAT.z[0] - 2], [37, FLAT.z[1] + FLAT.back + 1]]
    for (const [x, z] of around) expect(hf.sample(x, z), `(${x}, ${z})`).toBe(without.sample(x, z))
    expect(hf.sample(FLAT.x[1] + 0.5, -14)).not.toBe(without.sample(FLAT.x[1] + 0.5, -14))
    // behind it, the ground rises back to the old bank's height no steeper than 1 in 2
    for (let x = FLAT.x[1]; x < FLAT.x[1] + FLAT.back + 1; x += 0.25) expect(Math.abs(hf.sample(x + 0.25, -14) - hf.sample(x, -14)), `x ${x}`).toBeLessThan(0.125)
    for (let x = 16; x <= 28; x += 0.5) for (let z = -16; z <= -5; z += 0.5) expect(hf.sample(x, z), `(${x}, ${z})`).toBe(without.sample(x, z))
  })
  it('makes the flat\'s dry ground lawn, and nowhere else', () => {
    expect(hf.lawn!(38, -12)).toBe(1)
    expect(hf.lawn!(30, -20)).toBe(0)                      // out in the lake
    expect(hf.lawn!(0, 0)).toBe(0)                         // the near bank: grass by its height, not lawn
    expect(lakeHeightfield(1, { flat: false }).lawn!(38, -12)).toBe(0)
  })
  it('rises on the far shore', () => {
```

In `src/world/heightfield.test.ts`, replace:

```ts
    expect(g2).toBeGreaterThan(r2)
```

with:

```ts
    expect(g2).toBeGreaterThan(r2)
  })
  it('is grass on a lawn, however low it lies', () => {
    const [r, g] = terrainColor(0.3, 0)
    expect(r).toBeGreaterThan(g)
    const [lr, lg, lb] = terrainColor(0.3, 0, 1)
    expect(lg).toBeGreaterThan(lr)
    expect(lg).toBeGreaterThan(lb)
```

Run: `npx vitest run src/world/heightfield.test.ts src/location/zoneTerrain.test.ts`
Expected: FAIL: 8 of the 36 fail: there is no `FLAT`, no lawn, and no goose zone yet.

- [ ] **Step 2: The flat, the zones, the lawn, and the geese**

In `data/locations/lake.json`, replace:

```json
    "far-shallows": { "kind": "polygon", "points": [[-15, -63.7], [19, -63.7], [19, -60.3], [-15, -60.3]] },
```

with:

```json
    "far-shallows": { "kind": "polygon", "points": [[-15, -63.7], [19, -63.7], [19, -60.3], [-15, -60.3]] },
    "goose-flat":  { "kind": "polygon", "points": [[31, -9], [43, -9], [43, -22.6], [31, -10.9]] },
    "goose-water": { "kind": "polygon", "points": [[28, -14.5], [35, -21.5], [32, -27], [24, -20]] },
```

In `data/locations/lake.json`, replace:

```json
    { "species": "cangoo",  "behavior": "flyover", "zone": "sky", "count": 14, "everySeconds": [150, 360], "formation": "vee" },
```

with:

```json
    { "species": "cangoo",  "behavior": "flyover", "zone": "sky", "count": 14, "everySeconds": [150, 360], "formation": "vee" },
    { "species": "cangoo",  "behavior": "swim",    "zone": "goose-water", "ashore": "goose-flat", "count": 8, "groups": [5, 3] },
```

In `src/main.tsx`, replace:

```tsx
import { lakeHeightfield } from './world/heightfield'
```

with:

```tsx
import { lakeHeightfield, FLAT } from './world/heightfield'
```

In `src/main.tsx`, replace:

```tsx
world.add(grass)
```

with:

```tsx
world.add(grass)
// the geese's flat: a grazed lawn a few centimetres tall, so their feet and bills show in it; out of the mirror, as the
// near grass is, since a sward this short barely shows in it
const lawnPoints = scatterInBand(heightfield, { minY: 0.02, maxY: 0.4, bounds: [FLAT.x[0], FLAT.x[1], FLAT.z[0], FLAT.z[1]], count: 9000, seed: 14 })
const lawn = createGrass(lawnPoints.filter(p => (heightfield.lawn?.(p.x, p.z) ?? 0) > 0.5), world.wind, { height: 0.06, width: 0.012 })
lawn.object.layers.set(NO_REFLECT)
world.add(lawn)
```

In `src/world/floaters.ts`, replace:

```ts
/** The cast has 37 birds in the water: 24 swimmers, four herons, three yellowlegs, and six dowitchers. */
```

with:

```ts
/** The cast has 45 birds in the water: 32 swimmers (eight of them geese, which go ashore), four herons, three yellowlegs, and six dowitchers. */
```

In `src/world/heightfield.ts`, replace:

```ts
  sample(x: number, z: number): number
```

with:

```ts
  sample(x: number, z: number): number
  /** how much of the ground at (x, z) is lawn, 0..1, whatever its height: the geese's grazed flat. Unset, none */
  lawn?(x: number, z: number): number
```

In `src/world/heightfield.ts`, replace:

```ts

/** the shelf's surface at z: its plane, held beyond its edges */
```

with:

```ts

/**
 * A low grassy flat on the right shore past the mudflat, where the geese graze: over [x0, x1] by [z0, z1] its top is
 * `top` metres above the water, gently uneven by up to half `rough` either way, and on its lake side it slopes into the
 * water at `slope` (1 in 4) square to its shoreline, the line through `shore`'s two points (the basin's rim, where the
 * old bank stood a metre high), until it meets the lake bed. Its edges sit on the terrain mesh's 2 m grid. It eases
 * back into the ground within a metre on its lake sides (x0, z0), and within `back` metres on its land sides (x1, z1),
 * where the ground behind it stands a metre higher, so the bank there rises as a slope and not a wall.
 */
export const FLAT = { x: [30, 44], z: [-24, -8], shore: [[27.6, -10], [43.8, -26]], slope: 0.25, top: 0.3, rough: 0.08, back: 4 } as const

/** how far (x, z) lies landward of the flat's shoreline, metres (negative: out in the lake) */
export function flatShoreDistance(x: number, z: number): number {
  const [[ax, az], [bx, bz]] = FLAT.shore
  const [dx, dz] = [bx - ax, bz - az], len = Math.hypot(dx, dz)
  // the landward normal: +x, +z of the shore's line
  return ((x - ax) * -dz + (z - az) * dx) / len
}

/** the flat's surface: its gently uneven top, its slope down into the lake, and the lake bed where that lies higher */
function flatAt(x: number, z: number, under: number, seed: number): number {
  const top = FLAT.top + (valueNoise2(x * 0.25, z * 0.25, seed + 31) - 0.5) * FLAT.rough
  return Math.min(top, Math.max(flatShoreDistance(x, z) * FLAT.slope, Math.min(under, 0)))
}

/** the shelf's surface at z: its plane, held beyond its edges */
```

In `src/world/heightfield.ts`, replace:

```ts
/** 1 over [a, b], easing to 0 within `margin` outside it */
function plateau(v: number, a: number, b: number, margin = 1): number {
  const rise = Math.min(1, Math.max(0, (v - (a - margin)) / margin))
  const fall = Math.min(1, Math.max(0, (b + margin - v) / margin))
```

with:

```ts
/** 1 over [a, b], easing to 0 within `margin` outside it below a and `beyond` outside it above b */
function plateau(v: number, a: number, b: number, margin = 1, beyond = margin): number {
  const rise = Math.min(1, Math.max(0, (v - (a - margin)) / margin))
  const fall = Math.min(1, Math.max(0, (b + beyond - v) / beyond))
```

In `src/world/heightfield.ts`, replace:

```ts
 * The lake's ground; `bench: false` leaves out the dowitchers' bench and `shelf: false` the herons' shelf, to compare the
 * ground around them.
 */
export function lakeHeightfield(seed: number, { bench: withBench = true, shelf: withShelf = true }: { bench?: boolean; shelf?: boolean } = {}): Heightfield {
  return {
```

with:

```ts
 * The lake's ground; `bench: false` leaves out the dowitchers' bench, `shelf: false` the herons' shelf, and `flat:
 * false` the geese's flat, to compare the ground around them.
 */
export function lakeHeightfield(seed: number, { bench: withBench = true, shelf: withShelf = true, flat: withFlat = true }: { bench?: boolean; shelf?: boolean; flat?: boolean } = {}): Heightfield {
  const flatShare = (x: number, z: number) => (withFlat ? plateau(x, FLAT.x[0], FLAT.x[1], 1, FLAT.back) * plateau(z, FLAT.z[0], FLAT.z[1], 1, FLAT.back) : 0)
  return {
    // the flat's dry ground is lawn
    lawn(x, z) { return flatShare(x, z) * Math.min(1, Math.max(0, flatShoreDistance(x, z) / 0.5)) },
```

In `src/world/heightfield.ts`, replace:

```ts
      y = y * (1 - bench) - BENCH.depth * bench
```

with:

```ts
      y = y * (1 - bench) - BENCH.depth * bench
      // Flat: blended the same way, over the basin's rim and the bank behind it
      const flat = flatShare(x, z)
      if (flat > 0) y = y * (1 - flat) + flatAt(x, z, y, seed) * flat
```

In `src/world/heightfield.ts`, replace:

```ts
/** rgb 0..1 by height and slope: mud at the waterline, gravel where steep, grass above. */
export function terrainColor(y: number, slope: number): [number, number, number] {
```

with:

```ts
/** rgb 0..1 by height and slope: mud at the waterline, gravel where steep, grass above, and grass on a lawn's share. */
export function terrainColor(y: number, slope: number, lawn = 0): [number, number, number] {
```

In `src/world/heightfield.ts`, replace:

```ts
  const t = Math.min(1, Math.max(0, (y - 0.15) / 0.9))
```

with:

```ts
  const t = Math.max(lawn, Math.min(1, Math.max(0, (y - 0.15) / 0.9)))
```

In `src/world/terrain.ts`, replace:

```ts
    const [r, g, b] = terrainColor(y, slope)
```

with:

```ts
    const [r, g, b] = terrainColor(y, slope, hf.lawn?.(x, z) ?? 0)
```

In `src/world/vegetation.ts`, replace:

```ts
export function createGrass(points: ScatterPoint[], wind: Wind): WorldModule & { object: THREE.InstancedMesh } {
  const mat = makeMaterial(wind, new THREE.Color('#5f7a2e'), new THREE.Color('#9a9448'))
  const object = instanced(points, bladeGeometry(1, 0.05), mat, 0.5)
```

with:

```ts
/**
 * Grass: blades `height` metres tall at their mean scale (the near bank's, half a metre) and `width` wide at the root;
 * a grazed lawn's are a few centimetres.
 */
export function createGrass(points: ScatterPoint[], wind: Wind, { height = 0.5, width = 0.05 }: { height?: number; width?: number } = {}): WorldModule & { object: THREE.InstancedMesh } {
  const mat = makeMaterial(wind, new THREE.Color('#5f7a2e'), new THREE.Color('#9a9448'))
  const object = instanced(points, bladeGeometry(1, width), mat, height)
```

- [ ] **Step 3: See it pass**

Run: `npx vitest run src/world src/location src/birds/cast.test.ts && npx tsc --noEmit -p .`
Expected: 136 tests pass. No type errors.

Run: `npm test`
Expected: every test passes (1123): the zone tests, the ring budget with the geese striking the water for ten
minutes on two seeds, and the whole cast's floaters.

- [ ] **Step 4: Look at it**

`npm run dev`, click Begin, turn right to the shore past the mudflat, about 70 degrees right of the view you begin
with, and raise the binoculars (B). The flat lies low beyond the mudflat, its lawn green to the water's edge and its
bank behind rising as a slope; the geese swim off it or graze on it, block birds still.

- [ ] **Step 5: Commit**

```bash
git add data/locations/lake.json src/main.tsx src/world src/location/zoneTerrain.test.ts src/birds/cast.test.ts
git commit -m "feat: a grassy flat on the right shore past the mudflat, sloping into the water at 1 in 4 where the bank stood a metre high, a grazed lawn on it, and the goose-flat and goose-water zones; eight geese on the lake, a family of five and a loose unit of three, their dips and tip-ups in the ring budget (Task 5)"
```

---

# Part 2: the goose

**How the goose is made:**
- **Model:** the most capable one. Tracing and painting from photographs is judgment work.
- **Method:** the swimmers plan's "How the Mallard was traced" (`docs/superpowers/plans/2026-09-26-swimmers.md`, Task
  14), and the herons plan's Task 6 for the neck chain:
  - **The photo and the scale:** the research's floating profile (section 8, `L10`, checked against `c4`), scaled by the
    culmen (56.4 mm).
  - **The outline:** read by hand on 1:1 crops with a 25-100 px grid, drawn back on the photo to check it.
  - **The fit:** by coordinate descent. The Mallard's scripts are in
    `C:\Users\kcsel\AppData\Local\Temp\claude\C--Users-kcsel-repo-lakewatch\ff180096-d59e-4123-9d78-d643c834d997\scratchpad\plan\mallard-work\`
    (the outline, the fit, photo point to skin coordinates, the overlays). Copy them into the goose's own scratchpad
    folder and adapt them; never into the repo. The fit minimises the area between the loft's side view and the outline
    with `worstFold` held at 0, and pulls the eye onto the photo's.
  - **The paint:** the adult's layers from the research's section 4, placed through photo point to skin coordinates.
  - **The text:** the `marks` rewritten for what the player sees in late September, and `sources` crediting every photo
    used and the research document. Tracing photos stay in the scratchpad and are never committed.
- **What's new for a goose:**
  - **Afloat and on its feet.** `amphibious: true` with `float.waterline` where the water meets the trace on `L10`; the
    legs come from `measurements` (tarsus 92 mm, bare tibia 15 mm, toe 82 mm) and stand on webbed feet. Set each standing
    shape against `L1` (standing relaxed) and `L2` (standing alert) with the viewer's afloat at 0.
  - **The neck chain:** five or six stations from the neck's base to the occiput, with no kink (research section 6.2),
    and `rig: { ..., neckMid: <the second>, head: 'occiput', neck: [those] }`. The chain keeps its length, so the erect
    crown comes only from the slack in the traced S: trace the floating rest's S with all the slack the photos show (its
    crown 0.15-0.17 m above the back). With the test goose, a gentle S reached 179 mm erect and a deeper one 236 mm (255
    mm with the body tipped up 0.15 rad) before its bends folded the skin; the test asks 250 mm. If the traced bird can't
    reach it inside the guards with an alert lean (a style setting, as the herons' was), stop and report.
  - **The shapes:** `hunch` (loafing, the head drawn down over the breast, crown about 0.10 m above the back), `erect`
    (the neck straight up, the bill near level), and `strike` (the low reaching neck the goose grazes and head-dips with:
    the neck leaving the body nearly level and bending down 55-65 degrees near the head, `E5`). The goose's strike is
    aimed at the ground or under the water, so `reachDepth` is never negative: no new case. Keep the strike doing most of
    the bending, and the body's lean (the style's `headDip.lean`, `graze.lean`) helping, so the reach's swing about the
    neck's base stays small: the test goose's naive strike, swung down 90 degrees from the breast, passed the throat 15-25
    mm into the breast in a head-dip.
  - **The waddle:** 5 degrees (research section 11.3, one photo, low confidence); watch the walk from behind in the viewer
    and tune it by eye.
  - **The step:** `stepLength` as long as the built leg takes without its stance foot sliding (the species test holds the
    foot to 0.1 mm), aiming at the research's 0.13-0.18 m step. The test goose's leg allowed 0.11 m; the research's
    1.3-1.6 divided by the bare leg (0.107 m), not the builder's hip-to-foot leg.
  - **The style's settings from the built bird**, each with a comment giving the measured value, in `CANADA_GOOSE`
    (`src/behavior/goose.ts`): `wade.stand` (the root's rise standing, the float waterline's height above the feet),
    `rings.ahead` (the bill tip's x at the bottom of a head-dip), `neck.stand` (the `neckExtend` that stands the crown
    about 0.23 m above the back, `L1`), and `graze.lean` and `graze.reachAngle` (the grazing pose against `E5`, the bill
    on the grass 100-250 mm ahead of the toes). The test holds the first three to the built bird.
  - **The atlas's detail:** through the binoculars at 30 m a screen pixel covers about 3.6 mm of bird; the default atlas
    gives the test goose's 0.72 m of skin 1.4 mm a texel along the spine, and finer round it, so the chinstrap's edge
    holds without a larger atlas. Check the traced goose's (`profile.ts`'s length over the skin region's 506 texels); if
    it comes out coarser than 3.6 mm over the head, stop and report: an atlas size per species is a shared painter
    change.
  - **The block spec's fields stay** alongside the `detail` block, as every converted species keeps them: the flyover's
    V still builds from them until round 2.
- **Tests first:** write the test file, see it fail because the species has no `detail` block, then trace until it and
  every shared test pass (`species.test.ts`, the fingerprints, the folded wing's clearance, the whole-cast ring budget).
- **Stop and report** rather than bend a trace or loosen a bound: a correctly traced bird that falls outside a
  photo-measured bound, a shape that can't reach its bound inside the guards, or a builder, painter, behaviour, or viewer
  change the bird needs. The controller decides whether the bound moves or the code changes.
- **Review:** a reviewer checks the goose against this brief, its test file, and its screenshots before Part 3 begins.

---

### Task 6: The Canada Goose, detailed

**Files:**
- Create: `src/birds/species/goose.test.ts`
- Modify: `src/birds/species/cangoo.ts`; `src/behavior/goose.ts` (`CANADA_GOOSE`'s `wade.stand`, `rings.ahead`,
  `neck.stand`, `graze.lean`, `graze.reachAngle`, and the alert's lean if one is needed); `src/birds/detail/fingerprint.test.ts`
  (its prints); `src/birds/detail/wing.test.ts` (its poses); `src/birds/species/species.test.ts` (the planted-foot test)

**Interfaces:**
- Consumes: the amphibious builder, `afloat`, and the waddle (Task 1); the viewer's goose controls (Task 2); the goose
  style's settings (Task 4); the neck chain, `neckShapes`, `crownNow`; `built`, `atlas`, `within`, `draftShare` from
  `swimmer.testkit.ts`; `posedFold`, `passThrough`, `posedRings` from `neck.testkit.ts`.
- Produces: `cangoo` with a `detail` block, one plumage (the adult's), `amphibious`, a five- or six-joint neck, `waddle` 5,
  webbed feet, rewritten `marks`; the style's built-bird settings.

Port 5231. Research: `docs/research/2026-09-30-canada-goose.md`.
- **Photos** (section 8, in the scratchpad's `ref/cangoo/`):
  - `L10`: the floating profile (side-on, sharp); `c4`: the floating body, a check
  - `L1`: standing relaxed; `L2`: standing alert (a Northwest bird); `L8`: walking, the S-neck; `L7`: the waddle's roll
  - `L11`: the head and bill, the chinstrap; `E5`: grazing; `M4`, `M11`: the floating alert neck; `U6`: the tip-up
  - Paint from `L11`, `L1`, and the local records 13, 20, and 59
- **Numbers:** section 9. **Marks:** section 4. **Shapes:** section 6.
- **Particular to it:**
  - One version, the adult, painted as *moffitti* (`detail.plumage` and no `variants`, as the egret's): a black head
    and neck ending in a clean line at the neck's base; a white chinstrap from behind the eye down under the jaw to the
    throat; a silvery-pale breast shading to brown-grey flanks
    barred pale; a brown back and wings, each feather pale-edged; a black tail over a white undertail and a white band
    over the tail; black bill, legs, and feet. No neck ring, no collar.
  - `length` (the detail's) is the traced floating length, about 0.64 m; the block spec's 0.95 is the stretched length
    the flyover's V is built to, and stays.
  - The guide's `marks`: a very large waterfowl with a long black neck and a white chinstrap, a pale breast, a brown back
    with pale bars, a white undertail; grazing on lawns and fields by the water; in a V overhead.

- [ ] **Step 1: Write the failing test**

Create `src/birds/species/goose.test.ts`:

```ts
import * as THREE from 'three'
import { SPEC as GOOSE } from './cangoo'
import { SPEC as MALLARD } from './mallar3'
import { built, atlas, within, draftShare } from './swimmer.testkit'
import { crownNow, billAngleNow, billTipNow, tailTipNow } from '../detail/measure'
import { posedFold, passThrough, posedRings } from '../detail/neck.testkit'
import { RINGS } from '../detail/loft'
import type { DetailedBirdModel } from '../detail/build'
import { defaultPose, type PoseState } from '../model'
import { CANADA_GOOSE as S } from '../../behavior/goose'
import { NECK } from '../../behavior/dabbler'

// Bounds from docs/research/2026-09-30-canada-goose.md, section 10 (the published tables and the photos of section 6),
// in mm and degrees. The goose is built at rest afloat, its waterline on y = 0; standing, its feet on y = 0. Each of its
// poses is the goose style's own, from its settings, at its fullest.

type Patch = Partial<Omit<PoseState, 'lean'>> & { leanX?: number }
function pose(model: DetailedBirdModel, patch: Patch): void {
  const { leanX = 0, ...rest } = patch
  const p: PoseState = { ...defaultPose(), ...rest }
  p.lean.set(leanX, 0, 0)
  model.pose(p)
}

/** The goose style's poses, afloat and on its feet, at their fullest. */
const POSES: Record<string, Patch> = {
  rest: {},
  loaf: { neckExtend: NECK.loaf },
  alert: { neckExtend: NECK.alert },
  'head-dip': { leanX: S.headDip.lean, tailTilt: S.headDip.tail, reach: 1, reachDepth: S.headDip.depth, reachAngle: Math.PI / 2, neckExtend: NECK.headDip },
  'tip-up': { leanX: S.tipUp.lean, tailTilt: S.tipUp.tail, paddle: 1, neckExtend: NECK.tipUp },
  standing: { afloat: 0, neckExtend: S.neck.stand },
  walking: { afloat: 0, gait: 1, strideDistance: 0.1, neckExtend: S.neck.walk },
  grazing: { afloat: 0, neckExtend: 0.5, reach: 1, reachAngle: S.graze.reachAngle, leanX: S.graze.lean },
  'looking up': { afloat: 0, neckExtend: 1 },
}

/** The top of the back as posed, mm: the highest skin point from the tail to the neck's base (the rig's `neckBase`). */
function backNow(model: DetailedBirdModel): number {
  const rings = posedRings(model)
  const last = Math.floor(model.profile.uOf(GOOSE.detail!.rig.neckBase) * (RINGS - 1))
  let top = -Infinity
  for (let i = 0; i <= last; i++) for (const v of rings[i]!) top = Math.max(top, v.y)
  return top * 1000
}

/** The crown above the top of the back, mm, in a pose. */
function crownAboveBack(model: DetailedBirdModel, patch: Patch): number {
  pose(model, patch)
  return crownNow(model) * 1000 - backNow(model)
}

const boneAt = (m: DetailedBirdModel, name: string) => {
  m.group.updateMatrixWorld(true)
  return m.mesh.skeleton.bones.find(b => b.name === name)!.getWorldPosition(new THREE.Vector3())
}
const deg = (rad: number) => (rad * 180) / Math.PI

describe('Canada Goose: structure', () => {
  const G = built(GOOSE), D = built(MALLARD, 'male')
  it('culmen, bill depth, and the bill against the tarsus', () => {
    within(G.M.culmen, 50, 63, 'culmen')
    within(G.M.billDepth, 18, 30, 'bill depth')
    within(G.M.culmen / G.M.tarsus, 0.52, 0.7, 'culmen / tarsus')
  })
  it('tarsus, middle toe, wing chord, tail, and length floating', () => {
    within(G.M.tarsus, 84, 100, 'tarsus')
    within(G.model.layout.toe * 1000, 75, 90, 'middle toe')
    within(G.M.wingChord, 450, 520, 'wing chord')
    within(G.M.tail, 125, 175, 'tail')
    within(G.M.length, 580, 700, 'length')
  })
  it('the eye 70-100 mm from the bill tip', () => {
    const eye = G.model.anatomy.stations.find(s => s.label === 'eye')!.position
    within(eye.distanceTo(G.model.anatomy.billTip) * 1000, 70, 100, 'eye to bill tip')
  })
  it('against the Mallard: a bill a little longer, a bird nearly twice as long', () => {
    within(G.M.culmen / D.M.culmen, 0.95, 1.2, 'culmen')
    within(G.M.length / D.M.length, 1.6, 2, 'length')
  })
  it('floats and stands: amphibious, on webbed feet, with a waddle and a chained neck', () => {
    const d = GOOSE.detail!
    expect(d.amphibious).toBe(true)
    expect(d.feet).toBe('webbed')
    expect(d.waddle).toBe(5)
    expect(d.rig.neck!.length).toBeGreaterThanOrEqual(5)
    expect(d.rig.neck!.length).toBeLessThanOrEqual(6)
  })
})

describe('Canada Goose: floating', () => {
  const G = built(GOOSE)
  it('rides as the photos show: the back, the crown, and the tail tip above the water, and the waterline\'s length', () => {
    within(G.M.waterlineLength, 440, 540, 'waterline length')
    within(G.M.backAbove, 110, 150, 'back above the water')
    within(G.M.crownAbove, 200, 280, 'crown above the water')
    within(G.M.tailTipAbove, 80, 130, 'tail tip above the water')
  })
  it('sits as deep as its weight floats it: the draft, and its share of the body\'s depth', () => {
    within(G.M.draft, 50, 80, 'draft')
    within(draftShare(G.M), 0.25, 0.4, 'draft / body depth')
  })
  it('holds its head as the photos do at rest: the crown above the back, the bill pointing down', () => {
    within(G.M.crownAbove - G.M.backAbove, 80, 190, 'crown above the back')
    pose(G.model, POSES.rest!)
    within(-deg(billAngleNow(G.model)), 10, 30, 'bill below level')
  })
})

describe('Canada Goose: the neck and its poses', () => {
  const { model } = built(GOOSE)
  it('lifts the crown above the back as the photos do: alert on the water, standing relaxed', () => {
    within(crownAboveBack(model, POSES.alert!), 250, 450, 'erect')
    within(crownAboveBack(model, POSES.standing!), 180, 280, 'standing relaxed')
  })
  it('stands 450-560 mm from its feet to its crown', () => {
    pose(model, POSES.standing!)
    within(crownNow(model) * 1000, 450, 560, 'standing height')
  })
  it('grazes with the bill on the grass, about 0.17 m ahead of its toes', () => {
    pose(model, POSES.grazing!)
    const tip = billTipNow(model)
    expect(Math.abs(tip.y)).toBeLessThan(0.005)
    const toes = Math.max(boneAt(model, 'toesR').x, boneAt(model, 'toesL').x) + model.layout.toe
    within((tip.x - toes) * 1000, 100, 250, 'bill ahead of the toes')
  })
  it('tips up 65-90 degrees, the stern and the tail out of the water and the head under', () => {
    within(deg(S.tipUp.lean), 65, 90, 'body from level')
    pose(model, POSES['tip-up']!)
    expect(tailTipNow(model).y).toBeGreaterThan(0.2)
    expect(billTipNow(model).y).toBeLessThan(-0.15)
  })
  it('folds no ring and passes no skin through skin in any of its poses', () => {
    for (const [name, patch] of Object.entries(POSES)) {
      pose(model, patch)
      expect(posedFold(model, 0.3) * 1000, name).toBeLessThan(0.1)
      expect(passThrough(model, 0.3).depth * 1000, name).toBeLessThan(3)
    }
  })
})

describe('Canada Goose: the style fits the bird', () => {
  const { model } = built(GOOSE)
  it('stands on the bed where its float\'s waterline meets the water: the style\'s wading depth is the built bird\'s, to 1 cm', () => {
    pose(model, POSES.standing!)
    // standing, the root has risen by the float's waterline's height above the feet
    expect(Math.abs(boneAt(model, 'root').y - S.wade.stand)).toBeLessThan(0.01)
  })
  it('rings the water where its bill goes in at the bottom of a head-dip, to 5 cm', () => {
    pose(model, POSES['head-dip']!)
    expect(Math.abs(billTipNow(model).x - S.rings.ahead)).toBeLessThan(0.05)
  })
})

describe('Canada Goose: plumage', () => {
  const a = atlas(GOOSE)
  const d = GOOSE.detail!
  it('a black stocking: the head and neck near-black above and behind the cheek, ending in a clean line at the neck\'s base', () => {
    expect(a.stats('skin', [a.u(d.rig.neckBase) + 0.02, a.u('occiput')], [0, 1]).mean).toBeLessThan(0.12)
    expect(a.stats('skin', [a.u('occiput'), a.u('billBase')], [0, 0.3]).mean).toBeLessThan(0.12)
    // within 3 cm along the spine either side of the line, black in front and pale behind, low on the neck
    const cm = 0.03 / (built(GOOSE).model.profile.length)
    expect(a.stats('skin', [a.u(d.rig.neckBase) + cm / 2, a.u(d.rig.neckBase) + cm], [0.7, 1]).mean).toBeLessThan(0.15)
    expect(a.stats('skin', [a.u(d.rig.neckBase) - cm, a.u(d.rig.neckBase) - cm / 2], [0.7, 1]).mean).toBeGreaterThan(0.45)
  })
  it('a white chinstrap from behind the eye down under the jaw to the throat', () => {
    expect(a.stats('skin', [a.u('occiput'), a.u('eye')], [0.55, 0.85]).mean).toBeGreaterThan(0.8)
    expect(a.stats('skin', [a.u('eye'), a.u('billBase')], [0.88, 1]).mean).toBeGreaterThan(0.75)
  })
  it('a pale breast, at least three times as bright as the neck', () => {
    const neck = a.stats('skin', [a.u(d.rig.neckBase) + 0.02, a.u('occiput') - 0.02], [0, 1]).mean
    const breast = a.stats('skin', [a.u('breast') - 0.02, a.u('breast') + 0.02], [0.6, 1]).mean
    expect(breast).toBeGreaterThanOrEqual(3 * neck)
  })
  it('a white undertail', () => {
    expect(a.stats('skin', [0, a.u('rump')], [0.6, 1]).mean).toBeGreaterThan(0.8)
  })
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run src/birds/species/goose.test.ts`
Expected: FAIL: the file fails to load with `cangoo: no detail block`.

- [ ] **Step 3: The shared tests learn about a detailed goose**

The folded wing's clearance test holds every detailed species in the poses the game uses; a goose's come from its
style's settings, afloat and on its feet. The planted-foot test walks every standing species; an amphibious one walks
on its feet.

In `src/birds/detail/wing.test.ts`, replace:

```ts
import { heronFor } from '../../behavior/heron'
```

with:

```ts
import { heronFor } from '../../behavior/heron'
import { CANADA_GOOSE } from '../../behavior/goose'
```

In `src/birds/detail/wing.test.ts`, replace:

```ts
}

/**
 * The poses the game puts each detailed bird in, from its behaviour's own settings, at their fullest: every feeding
```

with:

```ts
}

/** a goose's poses, from its style's settings: afloat as a dabbler, and on its feet standing, walking, and grazing */
const goose = (): Record<string, Patch> => {
  const S = CANADA_GOOSE
  return {
    'tip-up': tipUp(S, DABBLER_NECK.tipUp),
    'head-dip': headDip(S, DABBLER_NECK.headDip),
    'surface dabble': reach(DABBLER_NECK.surfaceDabble, S.surface.reachAngle, 0, S.surface.lean),
    alert: { neckExtend: DABBLER_NECK.alert },
    loaf: { neckExtend: DABBLER_NECK.loaf },
    standing: { afloat: 0, neckExtend: S.neck.stand },
    'walking, the waddle at its full roll': { afloat: 0, gait: 1, strideDistance: 0, neckExtend: S.neck.walk },
    grazing: { ...reach(0.5, S.graze.reachAngle, 0, S.graze.lean), afloat: 0 },
    'looking up': { afloat: 0, neckExtend: 1 },
  }
}

/**
 * The poses the game puts each detailed bird in, from its behaviour's own settings, at their fullest: every feeding
```

In `src/birds/detail/wing.test.ts`, replace:

```ts
  greegr: heron('greegr'),
```

with:

```ts
  greegr: heron('greegr'),
  cangoo: goose(),
```

In `src/birds/species/species.test.ts`, replace:

```ts
      if (!spec.detail || spec.posture === 'swimming') continue             // a swimmer's legs paddle; they never walk
```

with:

```ts
      // a swimmer's legs paddle and never walk; an amphibious bird's walk on its feet, afloat 0
      if (!spec.detail || (spec.posture === 'swimming' && !spec.detail.amphibious)) continue
```

In `src/birds/species/species.test.ts`, replace:

```ts
        m.pose({ ...defaultPose(), strideDistance: d, gait: 1 })
```

with:

```ts
        m.pose({ ...defaultPose(), strideDistance: d, gait: 1, afloat: 0 })
```

Until the goose is traced, the wing test's "covers every detailed species" fails (it lists `cangoo`, which isn't
detailed yet); everything else passes.

- [ ] **Step 4: Trace, shape, and paint the Canada Goose**

In `src/birds/species/cangoo.ts`, add the `detail` block by the method above, keeping `foraging: 'goose'` and every
block-spec field. Set the style's built-bird settings in `CANADA_GOOSE`, each with a comment giving the measured value.

Add the species' prints to `src/birds/detail/fingerprint.test.ts` as the herons' were added: run the file, check that
only the new species fails, and record its `geometry` and `poses` prints in `EXPECTED`, and its atlas print for `cangoo`
in `EXPECTED_ATLAS` (it has no versions in `variants`, so one print), with a comment naming this task. No other
species' prints may change.

- [ ] **Step 5: Run the tests**

Run: `npm test && npx tsc --noEmit -p .`
Expected: every test passes: `goose.test.ts`'s nineteen; for `cangoo`, `species.test.ts`'s measurements within 5%, no
crease, the stance foot planted, and no bone turning more than 0.7 rad in a frame under the goose style (afloat: the
species test runs the style without a family, so it swims); the folded wing's clearance in its nine poses; the
fingerprints; the ring budget. `tsc` is clean.

- [ ] **Step 6: Check that a plumage test and a shape test bite**

Temporarily paint the chinstrap black (a fill of `#141414` over the skin from `occiput` to `billBase`) and run the file.
Expected: "a white chinstrap" fails. Undo it; it passes. Then set the `erect` shape's bends to all zeros and run it.
Expected: "lifts the crown above the back" fails. Undo it; it passes.

- [ ] **Step 7: Check it by eye**

Run `npx vite --port 5231 --strictPort` and open `/viewer.html` with Playwright. Screenshots go in the scratchpad's
`plan/goose-shots/`, and the report states the measured offsets from the photos.
- The side view afloat against `L10`: outline, eye, bill within about 3 mm (a 0.64 m bird).
- Standing (afloat 0) against `L1`; alert against `L2`; grazing against `E5`; the tip-up against `U6`; the head against
  `L11`.
- The afloat slider from 1 to 0 and back, the water at 12 cm: the step out of the water reads as a goose's.
- The walk from the front and from behind: the waddle reads as a goose's, not a duck's.
- Through the binoculars at 35 m (`field=bino35`), beside a Mallard: the chinstrap, the black stocking, the pale
  breast, the white undertail.
- In the game: the binoculars on the flat; watch the family wade out, stand, walk, and graze, and later walk back in.

- [ ] **Step 8: Commit**

```bash
git add src/birds/species/cangoo.ts src/birds/species/goose.test.ts src/behavior/goose.ts src/birds/detail/fingerprint.test.ts src/birds/detail/wing.test.ts src/birds/species/species.test.ts
git commit -m "feat: the Canada Goose as a field-guide plate: traced, measured, the resident Western goose of late September; amphibious, floating on its waterline and standing on webbed feet with a waddle; its neck a chain bent into the hunch, the floating S, erect, and the reach to the grass or under the water"
```

---

# Part 3: the finish

### Task 7: The main spec and README, the call rate, performance, and the binoculars

**Files:**
- Modify: `docs/superpowers/specs/2026-09-22-lakewatch-design.md`, `README.md`,
  `docs/superpowers/specs/2026-09-30-canada-goose-design.md` (its "Changed during implementation" and "Known soft
  spots"); `src/audio/calls.ts` (only if Step 1 says so)

- [ ] **Step 1: The call rate**

The geese have been in the cast since Task 5. `src/audio/calls.ts` gives each goose a call every 15-45 s and skips the
flyovers; with eight on the lake that is a call every 3.75 s on average. `npm run dev`, Begin, and listen for two
minutes facing the flat. If the geese call too often for a family loafing and grazing, set `cangoo` to
`{ every: [60, 180], prefer: 'call' }` with a comment that it is an estimate (eight birds, a call every 15 s), and run
`npx vitest run src/audio`. Expected: every test passes.

- [ ] **Step 2: Amend the main spec**

In `docs/superpowers/specs/2026-09-22-lakewatch-design.md`:
- In the Behaviors table, at the end of the `swim` row's text (after `Swimmers keep their distance from each other`) add
  `. The goose style: a family loafs, head-dips and now and then tips up on the water, swims to the shore in a loose
  file, steps out onto the grass, and grazes, each bird lifting its head to look about on its own rhythm (the gander
  most, the young least), then walks back in`.
- In Animation, after `grebe roll-under and sink,` add ` goose walk out, graze, look up, walk in,`.
- In Composition, after `mudflat curving away` add `, and past it a low grassy flat that slopes gently into the
  water, where the geese graze`.
- In Components, after the Terrain item's `herons wade.` add ` Past the mudflat a low grassy flat slopes into
  the water at 1 in 4, where the geese walk out to graze.`; in the Vegetation item, after `instanced reed and grass
  blades with vertex-shader sway.` add ` A grazed lawn of short blades on the geese's flat.`
- In Bird models, after `` `2026-09-27-herons-design.md`. `` add `` The Canada Goose on the lake is amphibious: it floats
  and stands, `afloat` passing it between the two at the shore; see `2026-09-30-canada-goose-design.md`. The flyover
  stays a block model. ``
- In UI, replace `"Getting the birds ready… N of 38"` with the count the title card now shows (read it in Step 4; one
  more atlas and one more species: 40).

- [ ] **Step 3: The README**

In `README.md`, after the sentence that ends `tips the head.` add: `` A swimming species that also stands sets `amphibious` (its legs are built standing, and
`PoseState.afloat` takes it from its float to its feet) and may set `waddle`, in degrees. A goose cast entry names the
zone its family walks out to (`ashore`) and its `groups`, a family first. ``

- [ ] **Step 4: Performance**

1. Run `npm run build && npx vite preview --port 5197 --strictPort`, open the game with Playwright, and note the title
   card's count and when Begin enables.
2. Click Begin, open the dev overlay with the backtick key, and raise the binoculars on the flat.
3. Record the `atlases` line (the count, the MB, the per-atlas ms), the longest pause while Begin waits, and the headless
   frame rate with the binoculars on the flat. Headless frame rates say little about a real GPU; report them as such.
4. Compare against the build before this round on the same machine: `git worktree add ../lakewatch-before da1d261`,
   then `npm ci && npm run build && npx vite preview --port 5198 --strictPort` in it; read the same numbers; stop both
   servers and `git worktree remove ../lakewatch-before`. Check first that the before-worktree holds no link:
   `Get-ChildItem -Attributes ReparsePoint -Recurse -Depth 3` finds nothing.
5. Record the numbers in the goose spec's "Changed during implementation", with the water round's frame rate on the Iris
   Xe beside them for the user's check in Step 8.

- [ ] **Step 5: The spec's record**

In `docs/superpowers/specs/2026-09-30-canada-goose-design.md`, add a "Changed during implementation" section before
"Known soft spots, expected", from this plan's "Decisions made while planning" and whatever Task 6 reported, and turn
"Known soft spots, expected" into "Known soft spots" with what the round actually found, among them:
- the ring budget's peak with the geese, 56-61 of 64 at 60 fps (none pushed out, but little room left);
- the step the built leg allows against the research's;
- the erect crown the traced S reaches with its length kept;
- the lawn's blades, which read through the binoculars as dark arcs a few pixels long;
- the geese on the water and the loose unit share one flock: the family keeps 0.8 m from the loose unit, not 1.5;
- the block flyover V, unchanged until round 2.

- [ ] **Step 6: Full build**

Run: `npm run build`
Expected: typecheck, every test, and the Vite build pass, and `dist/` has no `viewer.html`.

- [ ] **Step 7: Commit**

```bash
git add docs/superpowers/specs/2026-09-22-lakewatch-design.md README.md docs/superpowers/specs/2026-09-30-canada-goose-design.md src/audio/calls.ts
git commit -m "docs: the Canada Goose in the design spec and README; performance recorded; the call rate checked with eight geese on the lake"
```

- [ ] **Step 8: Hand the binoculars to the user**

The spec's last checks can't be automated. Ask the user to run `npm run dev`, click Begin, open the dev overlay, and
report:
1. The frame rate with the binoculars on the flat, the family on it. The target is 60 fps on their integrated GPU.
2. Whether the goose reads as a Canada Goose afloat, standing, and grazing: the chinstrap catching the light, the black
   stocking, the pale breast, the white undertail.
3. Whether the step out of the water and back in looks natural, and the waddle a goose's and not a duck's.
4. Whether the heads come up and go down like a real family's: one or two up most of the time, never all together for
   long, and now and then none.
5. Whether anything snaps, or a goose stands in the water as if it were land or floats on the grass.

Whatever the user says is the acceptance result. Record it in the final report, with the screenshots from Task 6.
