# Double-crested Cormorant, Round 1 (On the Water and on the Snag) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Double-crested Cormorant the first detailed bird made in Blender: modelled, textured, and weighted there on the game's own skeleton, exported as a glTF, and posed in the game by the same code as every lofted bird. One cormorant fishes on open water, sliding under for 22 s dives and swallowing what it catches; three stand upright on drowned stumps, their tails propped, drying their wings into the wind.

**Architecture:**
- **The seam:** the detailed builder's `Built` (what every bird of a species shares) becomes the line between how a mesh is made and how it is posed. It carries what `pose()` read from the loft (the body's length, the neck's first segment, the head's vertices), so a bird with no loft poses by the same code.
- **Authored birds:** a species with `authored` (not `detail`) takes its mesh, skin, landmarks, and each version's maps from `public/models/<model>/`. The loader reads the glb onto the builder's bones by name, sorts its vertices by part, and reads its anatomy from named landmarks. The models load at startup beside the atlases, each counted on the title card; the viewer loads one before it builds it.
- **Perching:** `PoseState.dry` holds a flight wing out in the species' drying pose; `PoseState.tailProp` rests the tail's tip on the perch under the feet. A perched cormorant is an amphibious bird at `afloat` 0 with its body raised.
- **The scene:** four drowned stumps in open water left of centre, each with a perch; the `stumps` and `cormorant-water` zones; a point zone's perches may be a list, each bird taking its own.
- **The behaviour:** one style, `cormorant`, on `swim` (a lone bird loafing low and fishing in bouts of dives) and on `perch` (upright on its stump, drying its wings in sessions).
- **The bird:** the Blender build (`scripts/blender/doccor/`), made headless from scripts, its output committed; the species file and its tests from the research.

**Tech Stack:** Vite 8, TypeScript 7, Vitest 5 (`environment: 'node'`), Three.js 0.186 (`GLTFLoader`), zod 4, Preact; Blender 5.2 headless (`blender -b -P`) for the models.

**Spec:** `docs/superpowers/specs/2026-10-05-cormorant-design.md`. Read it first.
- Every number and mark comes from the research, `docs/research/2026-10-04-double-crested-cormorant.md`: section 9 holds the numbers for the model, 7 the behaviour, 6.2 the float, 8 the tracing references. It is committed with this plan.
- The pilot (`scripts/blender/doccor/`, the scripts that made the comparison render beside the goose) is the start of the Blender build. It is committed with this plan.
- The detailed builder is described in `docs/superpowers/specs/2026-09-24-detailed-birds-design.md`; the amphibious bird and `afloat` in `docs/superpowers/specs/2026-09-30-canada-goose-design.md`; the flight wing in `docs/superpowers/specs/2026-09-30-pelican-design.md`.

## How this plan was checked

- **The research and the pilot came first.** The research is written and committed with this plan; the pilot's scripts
  made the cormorant the user compared with the goose in the game's renderer (`compare.html`, not committed).
- **Part 1 (Tasks 1-6)** was written in a scratch worktree of 5f1fb6c with the research, the spec, and the pilot's scripts committed on it (this plan's spec commit) with the research, the
  spec, and the pilot committed on it, one commit per task, with `npm test && npx tsc --noEmit -p .` green at every
  commit. Each task's edit blocks were generated from its commit, so the text is the code that ran: the test files'
  changes in Step 1, the rest in Step 2; each "replace" text appears exactly once in its file as the blocks before it
  leave it.
- **The assembled Part 1 was replayed in order** from this text alone by a script, on a fresh worktree of the same base:
  every edit applied verbatim, every "see it fail" step failed as written, every "see it pass" step passed, and the tree
  after each task matched the scratch commit's exactly (the test bird's glb, rebuilt by Blender from Step 1's script,
  aside: Blender writes it at the same size, not byte for byte, and the tests read it, not compare it).
  - The whole suite: 1235 at the base; Task 1: 1237 · Task 2: 1254 · Task 3: 1259 · Task 4: 1268 · Task 5: 1275 · Task 6: 1296.
- **The Blender side ran:** the test bird (Task 2) was built headless by `blender -b --factory-startup -P`, and three.js
  read it in Node (the loader's tests). The pilot's cormorant was built in Blender through the MCP connection, baked,
  exported, and shown beside the goose in the game's renderer.
- **Part 2 and Part 3** are written as procedures. The cormorant's species test file is given in full here, from its
  research's sections 2.7, 5, 6.2, 7.2, 7.3, and 9 and the spec's species tests. It was typechecked against the real
  APIs on top of Part 1, and it fails only because `doccor` isn't registered yet. It was not run against a model: the
  Blender build of Task 7 makes the first.
- If a step's output differs from what the plan says, stop and find out why rather than adjusting the test.

## Decisions made while planning

- **An authored bird is `spec.authored`, beside `detail`, not inside it** (Task 2). The spec put it at
  `detail.authored`, replacing the lofted fields. But the lofting code, the painter, and dozens of tests read the
  lofted fields off `detail` and would all have had to narrow a union. As a sibling, `detail` keeps its type exactly;
  `authored` holds only how the bird moves (the same fields with the same meanings: `neckShapes`, `neckStretch`,
  `stepLength`, `amphibious`, `flight`'s beat and glide, ...), plus `model`, `versions`, and `neck` (how many labels the
  model's chain has). `isDetailed(spec)` answers "detailed?" for both; a species has one or the other.
- **The `Built` carries `bodyLength`, `neckAlong`, and `anatomy.crown`** (Task 1). `pose()` read `profile.length` (a
  head pump's reach) and two stations (the neck chain's stretch); `crownNow` read the loft's rings. A lofted bird fills
  the new fields from its loft, so nothing moves (its fingerprints hold); an authored one from its joints and its
  head's vertices. `profile` becomes `Profile | null`: seven test sites that read a known lofted bird's profile say so
  with `!`.
- **The glb holds no images; each version's maps sit beside it** (Task 2). The tests read the glb in Node, where
  three.js can't decode an image. The maps are WebP, 1024 pixels, loaded by the browser's `TextureLoader`, unflipped
  (glTF's UVs).
- **A vertex says which part it is, in a `_PART` attribute** (Task 2): skin, bill, eye, wingFold, wingSpread, tail,
  legs. The loader sorts the vertices and triangles by part, so each part is one run of each (the measures read the
  bill's triangles as a lofted bird's), and finds the head's skin (the crown) and the body's from the bone each vertex
  leans on most. The spec had "named landmarks" only; a landmark can't tell a bill vertex from a head one.
- **The leg's lengths are the side view's** (Task 2): the builder's leg IK solves in the side view, and the model's hip,
  knee, and foot sit a few millimetres apart across the body. With the 3D lengths the test bird's soles stood 0.17 mm
  off the ground.
- **The Blender helpers are shared** (`scripts/blender/lib/gamebird.py`, Task 2): the skeleton (mirroring `rig.ts`),
  `tag` (a part and its weights), `mark`, `join`, `bind`, `export`, and primitives. The test bird and the cormorant
  both build with them. A cylinder is moved by transforming its mesh: an object's `matrix_world` isn't updated until
  the depsgraph is, which first left the test bird's neck, bill, and legs at the origin.
- **Authored models load as a third promise in `prepareBirds`** (Task 3), counted one step per model and one per
  version's maps, the total set before anything starts. `castModels` finds the species the way `castAtlases` does.
  Lofted birds' atlases and folds are counted as before; an authored bird has neither.
- **`dry` blends toward the species' `flight.dry`** (Task 4): each part of the wing swept back about the vertical, then
  raised or hung about the body's axis (three.js's XYZ order applies the sweep first). A species without `flight.dry`
  ignores `dry`, as a bird without a pouch ignores `pouch`. Drying opens the flight wing as `wingSpread` does, and a beat
  at a small `wingSpread` flaps it slowly.
- **`tailProp` turns the tail down until its tip is on y = 0** (Task 4), after the body has turned; a tail too short to
  reach points straight down (the test bird's 7 cm tail from 8 cm up does).
- **The viewer's lean reaches -0.9** (Task 4): a perched bird raises its body, the opposite of every pose so far.
- **The stumps are a fixed layout round the zone's point** (Task 5): `STUMPS` in `world/trees.ts`, four of them 0.55-1.4
  m out of the water at (-14, -30), 33 m from the vantage, in 2.4-3 m of water (the terrain's), standing on the bed.
  `cormorant-water` is the square of open water round them, short of the pelicans' far water, a metre deep or more all
  over.
- **A point zone's perches may be a list** (Task 5): each bird of the zone takes the next; more birds than perches is an
  error at spawn. A zone with one perch is shared as before.
- **One `foraging` style, `cormorant`, for both behaviours** (Task 6): `swim` and `perch` each pick their own by it. It
  is a swim style for `validateCast` (which only checks swim, probe, and wade), so a cormorant may perch.
- **The two styles are one task** (Task 6; the spec's build order had them apart): they share the file and its
  settings' source.
- **The swallow's jerks are bumps of `headPitch`** (Task 6), each up and back over half a second, so a test can count
  them; a large fish is worked with small turns of the head first. The neck rises a little in a swallow.
- **The perched cormorant dries on a schedule** (Task 6), as the spec decided: a session every 25-45 minutes, the first
  within 9 minutes; a session is a minute standing, then 2-4 bouts of spreading, 4-5 minutes in all, folded 10-60 s
  between. While it stands and spreads it turns into the wind, each bird a little either side.
- **Rings and splashes** (Task 6): a ring and a splash effect at each dive's entry, a ring at each surfacing, a small
  ring at each jerk of a swallow, and a small one every 2 s while it cruises.

## Global Constraints

- **Frame rate:** 60 fps on an integrated GPU in Chrome, with every bird on screen. A detailed bird is one draw call
  (plus its shadow pass), authored or lofted.
- **Art direction:** a field-guide plate. An authored bird's maps are baked from its modelled feathers and painted
  regions in Blender, never from photos.
- **Interfaces:**
  - `BirdModel` does not change.
  - `PoseState` gains exactly `dry` and `tailProp` (both default 0). With the defaults every existing species poses
    exactly as before.
- **Existing birds unchanged:** the geometry, pose, and atlas prints of the fifteen shipped detailed birds
  (`fingerprint.test.ts`) do not move in Part 1.
- **Units:** metres for every size, degrees for `neckShapes` and `flight.dry`, radians in `PoseState` and the styles'
  leans, seconds for times, minutes for the perched cormorant's sessions (`every`, `first`).
- **Assets:** an authored species' files live in `public/models/<model>/` and are committed: `npm run build` needs no
  Blender. Its scripts live in `scripts/blender/<code>/` and rebuild them exactly (`blender -b -P .../build.py`).
- **Budget:** an authored species' mesh at most 9,000 triangles; its glb and every version's maps 1.5 MB in all.
- **Reference photos:** downloaded outside the repo (the research's `lakewatch-ref/doccor/`), never committed. The
  species' `sources` credits each photographer and licence.
- **Tests:** Vitest runs in `environment: 'node'`: no DOM, no WebGL, no Worker, no image decoding. Rendering is checked
  by eye in the viewer and the game, with Playwright screenshots where a step asks.
- **Commits:** every commit leaves `npm test` and `npx tsc --noEmit -p .` green. Never commit `node_modules`, `.env`,
  `dist`, `data/raw`, `.wrangler`, `.playwright-mcp`, or `__pycache__`.
- **Worktrees:**
  - `npm ci` in each worktree. **Never a symlink or junction**: a forced worktree removal on Windows deletes through one.
  - **Never `git stash`**: the stash is shared by every worktree.
- **Line endings:** the repo's files are CRLF in the working copy (`core.autocrlf` is true). Edit with tools that keep them.

## Review Focus

Inputs the spec implies that no task's own feature tests would otherwise exercise, each pinned to a test in the owning task:

1. **Every existing bird.** No shipped bird's mesh, pose, or atlas moves; `dry` and `tailProp` at 0 change nothing.
   Tasks 1 and 4: the fingerprints.
2. **A model that doesn't fit the skeleton.** A missing bone, a bone under the wrong parent, a missing landmark, or a
   neck chain other than the species says is refused at load, naming what is wrong. Task 2: "the authored loader
   refuses a model that doesn't fit".
3. **A model that fails to load.** The title card says the birds could not be set up, as for an atlas. Task 3: "rejects
   when a file fails".
4. **A hand-kept viewer link from before this round.** It opens as it did, `dry` and `prop` at 0 and the lean in its old
   range. Task 4: the viewer's old-link test.
5. **A bird surfacing where another has just come up.** It swims on under water to a clear spot, as the grebe does.
   Task 6: "comes up 3-10 m from where it went down, in its water, clear of the other swimmers".
6. **The cast spawning more birds on the stumps than there are stumps.** An error at spawn. Task 5.

## Interfaces between the tasks

Collected here so an implementer of one task can see the names neighbouring tasks use.

- **`Built`** (Task 1): `profile: Profile | null`, `bodyLength: number`, `neckAlong: THREE.Vector3 | null`. **`Anatomy`**:
  `crown: number[]` (the head's skin vertices' indices). **`DetailedBirdModel.profile`**: `Profile | null`.
- **`detail/spec.ts`** (Task 2): `authoredSchema`, `type AuthoredSpec` (`model`, `versions`, `measurements`, `neck?`,
  `neckShapes?`, `neckStretch?`, `reachStretch?`, `stepLength?`, `probeDepth?`, `amphibious?`, `flock?`, `waddle?`,
  `flight?: { beat, glide, dry? }`, `sources`). **`birds/spec.ts`**: `SpeciesSpec.authored?`, `isDetailed(spec)`.
- **`detail/authored.ts`** (Task 2): `AUTHORED_PARTS`, `MARKS`, `parseGlb(bytes)`, `authoredBuilt(spec, scene)`,
  `storeAuthored(code, built)`, `authoredFor(spec)`, `authoredReady(code)`, `AuthoredMaps`, `storeAuthoredMaps(code,
  version, maps)`, `authoredMaterial(spec, variant?)`. **`detail/authored.testkit.ts`**: `loadAuthoredForTest(spec,
  path)`, `TEST_BIRD_GLB`. **`fixture.ts`**: `TEST_AUTHORED_SPEC` (code `testauthored`, model `testbird`).
- **`scripts/blender/lib/gamebird.py`** (Task 2): `BONE_NAMES`, `BONE_PARENT`, `PARTS`, `armature(name, joints)`,
  `tag(ob, part, weights)`, `mark(name, at)`, `join(objects, name)`, `bind(mesh, arm)`, `export(path, objects)`,
  `cylinder`, `ellipsoid`, `plate`, `clear(prefix)`.
- **`birds/models.ts`** (Task 3): `ModelLoader` (`model(spec)`, `maps(spec, version)`), `browserLoader`,
  `castModels(loc, specs?)`, `modelSteps(species)`, `loadModels(loc, opts)`, `ensureAuthored(spec, loader?)`.
  **`prepareBirds`** options gain `models?: ModelLoader`.
- **`PoseState`** (Task 4): `dry` (0..1), `tailProp` (0..1), both default 0. **`detailSchema.flight.dry?`**: `{
  shoulder, sweep, hand, handSweep }` degrees. **`ViewerState`**: `dry`, `prop`; `lean` from -0.9.
- **`world/trees.ts`** (Task 5): `STUMPS`, `createStumps(center, ground)` → `{ object, perches }`.
  **`SpawnDeps.perches`**: `Record<string, Vec3 | Vec3[]>`. **`lake.json`**: zones `stumps` (point, (-14, 0, -30)) and
  `cormorant-water`.
- **`behavior/cormorant.ts`** (Task 6): `CormorantSettings`, `CORMORANT`, `NECK`, `createCormorant(ctx, x, z, S?)`
  (states `loaf`, `cruise`, `dive`, `under`, `surface`, `handle`, `swallow`, `pause`); `CormorantPerchSettings`,
  `CORMORANT_PERCH`, `createCormorantPerch(ctx, P?)` (states `rest`, `session`, `spread`, `fold`). **`SWIM_STYLES`**
  gains `'cormorant'`.
- **`scripts/blender/doccor/build.py`** (Task 7): writes `public/models/doccor/doccor.glb` and each version's maps.
- **`species/doccor.ts`** (Task 8): `SPEC`, authored; **`cormorant.test.ts`** (`src/birds/species/`).

---

# Part 1: the shared pieces

### Task 1: The `Built` seam

**Files:**
- Modify: `src/birds/detail/build.ts`, `src/birds/detail/measure.ts`, `src/birds/detail/build.test.ts`,
  `src/birds/detail/neck.test.ts`, and seven test sites that read a lofted bird's profile (`swim.test.ts`,
  `goose.test.ts`, `grebe.test.ts`, `herons.test.ts`, `mallard.test.ts`, `pelican.test.ts`)

**Interfaces:**
- Consumes: `construct`, `buildDetailedBird`, `crownNow`.
- Produces: `Built.bodyLength`, `Built.neckAlong`, `Anatomy.crown`; `Built.profile` and `DetailedBirdModel.profile`
  become `Profile | null`.

`pose()` read the loft in two places: `profile.length`, for how far a head pump reaches, and the spine between the neck
chain's first two stations, the line its first segment stretches along. `crownNow` read the loft's rings from the
occiput forward. Each becomes a field of the `Built`, filled by `construct` from the loft exactly as before, so that a
bird made elsewhere can fill them from its own model. Nothing a lofted bird does changes.

- [ ] **Step 1: The failing tests**

In `src/birds/detail/build.test.ts`, replace:

```ts
      expect(nearest, st.label).toBeLessThan(0.004)
    }
  })
  it('builds closed, outward-facing body and bill', () => {
```

with:

```ts
      expect(nearest, st.label).toBeLessThan(0.004)
    }
  })
  it('hands the pose code what it reads from the loft in its Built: the body length, the neck, the crown', () => {
    const m = buildDetailedBird(TEST_SPEC)
    expect(m.built.bodyLength).toBe(m.profile!.length)
    // the test bird's neck has no chain
    expect(m.built.neckAlong).toBeNull()
    expect(m.anatomy.crown).toHaveLength(m.anatomy.head.length)
    const v = new THREE.Vector3()
    m.anatomy.crown.forEach((i, k) => expect(v.fromBufferAttribute(m.mesh.geometry.getAttribute('position') as THREE.BufferAttribute, i).distanceTo(m.anatomy.head[k]!)).toBeLessThan(1e-6))
  })
  it('builds closed, outward-facing body and bill', () => {
```

In `src/birds/detail/neck.test.ts`, replace:

```ts
    expect(() => detailSchema.parse({ ...detail, rig: { ...detail.rig, neckBaseDepth: 1.1 } })).toThrow()
  })
```

with:

```ts
    expect(() => detailSchema.parse({ ...detail, rig: { ...detail.rig, neckBaseDepth: 1.1 } })).toThrow()
  })
  it('stretches its first segment along the spine between its first two stations, wherever the base joint sits (Built.neckAlong)', () => {
    const detail = { ...TEST_HERON_DETAIL, rig: { ...TEST_HERON_DETAIL.rig, neckBaseDepth: 0.8 } }
    const m = buildDetailedBird({ ...TEST_HERON_SPEC, detail })
    const spine = (label: string) => m.anatomy.stations.find(s => s.label === label)!.position
    const [first, second] = TEST_HERON_DETAIL.rig.neck!
    expect(m.built.neckAlong!.distanceTo(spine(second!).clone().sub(spine(first!)))).toBeLessThan(1e-12)
  })
```

In `src/birds/detail/swim.test.ts`, replace:

```ts
  const L = m.profile.length, scale = L / 0.31
```

with:

```ts
  const L = m.profile!.length, scale = L / 0.31
```

In `src/birds/species/goose.test.ts`, replace:

```ts
  const last = Math.floor(model.profile.uOf(GOOSE.detail!.rig.neckBase) * (RINGS - 1))
```

with:

```ts
  const last = Math.floor(model.profile!.uOf(GOOSE.detail!.rig.neckBase) * (RINGS - 1))
```

In `src/birds/species/goose.test.ts`, replace:

```ts
    const cm = 0.03 / (built(GOOSE).model.profile.length)
```

with:

```ts
    const cm = 0.03 / (built(GOOSE).model.profile!.length)
```

In `src/birds/species/grebe.test.ts`, replace:

```ts
    const end = m.profile.sampleAt(1).point
    const eye = eyePlacement(GREBE.detail!, m.profile).center
```

with:

```ts
    const end = m.profile!.sampleAt(1).point
    const eye = eyePlacement(GREBE.detail!, m.profile!).center
```

In `src/birds/species/herons.test.ts`, replace:

```ts
  const last = Math.floor(model.profile.uOf(neckBase) * (RINGS - 1))
```

with:

```ts
  const last = Math.floor(model.profile!.uOf(neckBase) * (RINGS - 1))
```

In `src/birds/species/mallard.test.ts`, replace:

```ts
    const eye = eyePlacement(D, A.model.profile).center, tip = billCenter(D, A.model.profile, 1).p
```

with:

```ts
    const eye = eyePlacement(D, A.model.profile!).center, tip = billCenter(D, A.model.profile!, 1).p
```

In `src/birds/species/pelican.test.ts`, replace:

```ts
    expect(worstFold(A.model.profile, detail.rig)).toBe(0)
```

with:

```ts
    expect(worstFold(A.model.profile!, detail.rig)).toBe(0)
```

Run: `npx vitest run src/birds/detail/build.test.ts src/birds/detail/neck.test.ts`
Expected: FAIL: `built.bodyLength` and `built.neckAlong` are undefined, and `anatomy.crown` has no length.

- [ ] **Step 2: The fields, filled from the loft**

In `src/birds/detail/build.ts`, replace:

```ts
  head: THREE.Vector3[]
  /** how many rings the skin is lofted from: its first rings × RADIAL vertices are the loft's, ring by ring */
```

with:

```ts
  head: THREE.Vector3[]
  /** the same vertices' indices in the mesh's geometry, to find the crown as posed */
  crown: number[]
  /** how many rings the skin is lofted from: its first rings × RADIAL vertices are the loft's, ring by ring */
```

In `src/birds/detail/build.ts`, replace:

```ts
  anatomy: Anatomy
  profile: Profile
  layout: LegLayout
```

with:

```ts
  anatomy: Anatomy
  /** the lofted skin's spine and sections; an authored bird (made in Blender) has none */
  profile: Profile | null
  layout: LegLayout
```

In `src/birds/detail/build.ts`, replace:

```ts
export interface Built {
  profile: Profile; layout: LegLayout; geometry: THREE.BufferGeometry; joints: Joints; anatomy: Anatomy
  /** an amphibious bird's root offset standing: hips over the origin, feet on y = 0 */
  ashore: THREE.Vector3
}
```

with:

```ts
export interface Built {
  profile: Profile | null; layout: LegLayout; geometry: THREE.BufferGeometry; joints: Joints; anatomy: Anatomy
  /** an amphibious bird's root offset standing: hips over the origin, feet on y = 0 */
  ashore: THREE.Vector3
  /** the body's length along its spine, metres: how far a head pump reaches is a share of it */
  bodyLength: number
  /**
   * A chained neck's first segment as it stretches: from the base joint's station to the next along the spine (the
   * base joint itself may sit off the spine, rig.neckBaseDepth, but the neck lengthens along it); null without a chain
   */
  neckAlong: THREE.Vector3 | null
}
```

In `src/birds/detail/build.ts`, replace:

```ts
  const neckStart = profile.uOf(detail.rig.neckBase), neckY = spineAt(detail.rig.neckBase).y
  const headVerts: THREE.Vector3[] = []
  let bodyLowY = Infinity, backTopY = -Infinity
```

with:

```ts
  const neckStart = profile.uOf(detail.rig.neckBase), neckY = spineAt(detail.rig.neckBase).y
  const headVerts: THREE.Vector3[] = [], crown: number[] = []
  let bodyLowY = Infinity, backTopY = -Infinity
```

In `src/birds/detail/build.ts`, replace:

```ts
    if (u < headStart) return
    for (let j = 0; j < RADIAL; j++) headVerts.push(m.position(loft.first + i * RADIAL + j))
  })
```

with:

```ts
    if (u < headStart) return
    for (let j = 0; j < RADIAL; j++) {
      headVerts.push(m.position(loft.first + i * RADIAL + j))
      crown.push(loft.first + i * RADIAL + j)
    }
  })
```

In `src/birds/detail/build.ts`, replace:

```ts
    bodyLowY, wingLowY: fold.low + offset.y, backTopY, breastFront, waterline: { back: water[0], front: water[1] },
    head: headVerts, rings: loft.ringU.length,
    stations: detail.profile.flatMap(s => (s.label ? [{ label: s.label, position: spineAt(s.label) }] : [])),
```

with:

```ts
    bodyLowY, wingLowY: fold.low + offset.y, backTopY, breastFront, waterline: { back: water[0], front: water[1] },
    head: headVerts, crown, rings: loft.ringU.length,
    stations: detail.profile.flatMap(s => (s.label ? [{ label: s.label, position: spineAt(s.label) }] : [])),
```

In `src/birds/detail/build.ts`, replace:

```ts
  }
  return { profile, layout, geometry: m.geometry(), joints, anatomy, ashore }
}
```

with:

```ts
  }
  const neckAlong = chain ? spineAt(chain[1]!).sub(spineAt(chain[0]!)) : null
  return { profile, layout, geometry: m.geometry(), joints, anatomy, ashore, bodyLength: profile.length, neckAlong }
}
```

In `src/birds/detail/build.ts`, replace:

```ts
  const built = twin ? twin.built : construct(spec)
  const { profile, layout, geometry, joints, ashore } = built
  const swimming = spec.posture === 'swimming'
```

with:

```ts
  const built = twin ? twin.built : construct(spec)
  const { profile, layout, geometry, joints, ashore, bodyLength, neckAlong } = built
  const swimming = spec.posture === 'swimming'
```

In `src/birds/detail/build.ts`, replace:

```ts
  const hipMid = hipR.clone().setZ(0)
  const spineAt = (label: string) => anatomy.stations.find(s => s.label === label)!.position.clone()
  const chain = detail.rig.neck
  const { bones, list } = createBones(joints)
```

with:

```ts
  const hipMid = hipR.clone().setZ(0)
  const { bones, list } = createBones(joints)
```

In `src/birds/detail/build.ts`, replace:

```ts
  const neckMidRest = bones.neckMid.position.clone()
  // a chained neck's joints past its base: where each sits from the joint before as traced, and its stretch, the spine
  // between their stations (the base joint may sit off the spine, rig.neckBaseDepth, but the neck lengthens along it)
  const stretch = detail.neckStretch ?? 1, reachStretch = detail.reachStretch ?? 1
  const chainRest = (chainNames ?? []).slice(1).map((n, i) => [
    n, bones[n].position.clone(), i === 0 ? spineAt(chain![1]!).sub(spineAt(chain![0]!)) : bones[n].position.clone(),
  ] as const)
  const bodyLength = profile.length
  // for the reach: the bill tip from the head joint (the head bone carries no rotation at rest), and that line's
```

with:

```ts
  const neckMidRest = bones.neckMid.position.clone()
  // a chained neck's joints past its base: where each sits from the joint before as traced, and its stretch (the first
  // along the built neck's first segment, Built.neckAlong)
  const stretch = detail.neckStretch ?? 1, reachStretch = detail.reachStretch ?? 1
  const chainRest = (chainNames ?? []).slice(1).map((n, i) => [
    n, bones[n].position.clone(), i === 0 ? neckAlong!.clone() : bones[n].position.clone(),
  ] as const)
  // for the reach: the bill tip from the head joint (the head bone carries no rotation at rest), and that line's
```

In `src/birds/detail/measure.ts`, replace:

```ts
import type { DetailedBirdModel } from './build'
import { RADIAL } from './loft'

```

with:

```ts
import type { DetailedBirdModel } from './build'

```

In `src/birds/detail/measure.ts`, replace:

```ts
 * How high the top of the head is now, in group space (above the ground, or the water), after the model's last pose():
 * the highest point of the skin from the occiput forward. The loft's rings are the geometry's first vertices.
 */
```

with:

```ts
 * How high the top of the head is now, in group space (above the ground, or the water), after the model's last pose():
 * the highest point of the skin from the occiput forward (anatomy.crown).
 */
```

In `src/birds/detail/measure.ts`, replace:

```ts
  model.group.updateMatrixWorld(true)
  const rings = model.anatomy.rings
  const first = Math.ceil(model.profile.uOf('occiput') * (rings - 1))
  const v = new THREE.Vector3()
  let top = -Infinity
  for (let i = first * RADIAL; i < rings * RADIAL; i++) top = Math.max(top, model.mesh.getVertexPosition(i, v).y)
  return top
```

with:

```ts
  model.group.updateMatrixWorld(true)
  const v = new THREE.Vector3()
  let top = -Infinity
  for (const i of model.anatomy.crown) top = Math.max(top, model.mesh.getVertexPosition(i, v).y)
  return top
```

- [ ] **Step 3: See it pass, and every shipped bird unchanged**

Run: `npx vitest run src/birds/detail/build.test.ts src/birds/detail/neck.test.ts`
Expected: 53 tests pass.

Run: `npm test && npx tsc --noEmit -p .`
Expected: every test passes (1237), the fingerprints among them. No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/birds/detail src/birds/species
git commit -m "refactor: the Built carries what pose() read from the loft (bodyLength, neckAlong, anatomy.crown); profile is null for a bird with no loft (Task 1)"
```

---

### Task 2: Authored birds

**Files:**
- Create: `src/birds/detail/authored.ts`, `src/birds/detail/authored.test.ts`, `src/birds/detail/authored.testkit.ts`,
  `scripts/blender/lib/gamebird.py`, `scripts/blender/testbird/build.py`, `src/birds/detail/testbird.glb` (built)
- Modify: `src/birds/detail/spec.ts`, `src/birds/spec.ts`, `src/birds/detail/build.ts`, `src/birds/factory.ts`,
  `src/birds/detail/fixture.ts`, `.gitignore`

**Interfaces:**
- Consumes: Task 1's `Built`; `BONE_NAMES`, `BONE_PARENT`, `BONE_INDEX`, `NECK_BONES`, `chainBones` (`rig.ts`).
- Produces: see "Interfaces between the tasks".

An authored bird is made in Blender on the builder's skeleton and read into a `Built`:
- **The skeleton:** the glb's bones are exactly `BONE_NAMES`, parented as `BONE_PARENT`; each joint is its bone's head,
  in the model's own coordinates, which are the game's (Blender's +X forward, +Z up, the bird's left on +Y, exported
  with +Y up: the bird's right on +Z). The bones' orientations are ignored: the builder's bones carry no rest rotation.
- **The skin:** the skin indices are remapped from the file's joint order to `BONE_NAMES`; at most four weights a
  vertex, summing to 1.
- **The parts:** each vertex's `_PART` names its part; the loader sorts vertices and triangles by part, so each part is
  one run of each, and `anatomy.closed` names the runs.
- **The landmarks:** empties `mark_billBase`, `mark_billTip`, `mark_tailRoot`, `mark_tailTip`, `mark_wrist`,
  `mark_wingTip`, and, with a flight wing, `mark_flightTip` (all on the right side).
- **The anatomy:** the hip, knee, and foot are the right leg's joints; the head's vertices (the crown) are the skin's
  that lean most on `head`; the body's, on `body`; the bill's base ring, the bill's vertices within 1.5 mm of its base.
  A floating model's waterline is where y = 0 cuts its skin.
- **Built floating, standing on its legs:** an amphibious model floats on y = 0 with its legs modelled standing; `ashore`
  puts its hips over the origin and its soles on y = 0.
- **Refused** at load, naming what is wrong: no single skinned mesh, a missing or extra bone, a wrong parent, a missing
  landmark, no `_PART`, a neck chain other than `authored.neck` says.
- **The material:** one per species and version, the version's colour, normal, and roughness maps, once loaded; a plain
  grey without them (Node). The first version is the default.

The test bird is a small swimmer of primitives on the skeleton, built by Blender from a script, each part weighted wholly
to one bone so a test can tell which bone moves which part.

- [ ] **Step 1: The test bird and the failing tests**

Create `scripts/blender/lib/gamebird.py`:

```python
"""What every authored bird shares: the game's skeleton, its parts, its landmarks, and the export.

A bird for the game is one mesh skinned to an armature whose bones are the detailed builder's (src/birds/detail/rig.ts:
BONE_NAMES and BONE_PARENT), each bone's head at its joint. The game reads each joint from its bone's head and ignores
the bone's tail and roll. Every vertex carries `_PART`, the part it belongs to (PARTS below), and empties named
`mark_<name>` mark the landmarks the game measures from. The glb holds no images: the game loads each version's
textures beside it.

Blender's axes: +X forward, +Z up, the bird's left on +Y. The glTF export turns them into the game's: +X forward, +Y up,
the bird's right on +Z.
"""
import bpy
import bmesh
from mathutils import Matrix, Vector

# src/birds/detail/rig.ts, in order: the game checks the glb's bones against these
BONE_NAMES = [
    'root', 'body', 'neck', 'neckMid', 'head', 'bill', 'tail',
    'wingL', 'wingR', 'wingFoldL', 'wingFoldR',
    'legs', 'tibiaL', 'tarsusL', 'toesL', 'tibiaR', 'tarsusR', 'toesR',
    'curl', 'neck3', 'neck4', 'neck5', 'neck6', 'plume', 'handL', 'handR',
]
BONE_PARENT = {
    'root': None, 'body': 'root', 'neck': 'body', 'neckMid': 'neck', 'head': 'neck6', 'bill': 'head', 'tail': 'body',
    'wingL': 'body', 'wingR': 'body', 'wingFoldL': 'body', 'wingFoldR': 'body',
    'legs': 'root', 'tibiaL': 'legs', 'tarsusL': 'tibiaL', 'toesL': 'tarsusL', 'tibiaR': 'legs', 'tarsusR': 'tibiaR',
    'toesR': 'tarsusR', 'curl': 'body', 'neck3': 'neckMid', 'neck4': 'neck3', 'neck5': 'neck4', 'neck6': 'neck5',
    'plume': 'head', 'handL': 'wingL', 'handR': 'wingR',
}
# src/birds/detail/authored.ts: AUTHORED_PARTS, in order; a vertex's _PART is its index here
PARTS = ['skin', 'bill', 'eye', 'wingFold', 'wingSpread', 'tail', 'legs']
# a bone with no length of its own (one parked at another's joint) still needs a tail in Blender
STUB = 0.005


def clear(prefix):
    for o in [o for o in bpy.data.objects if o.name.startswith(prefix)]:
        bpy.data.objects.remove(o, do_unlink=True)


def armature(name, joints):
    """An armature with every game bone, its head at `joints[bone]` (Blender coordinates)."""
    missing = [b for b in BONE_NAMES if b not in joints]
    if missing:
        raise ValueError(f'joints missing: {missing}')
    data = bpy.data.armatures.new(name)
    ob = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    for o in bpy.context.scene.objects:
        o.select_set(o is ob)
    bpy.ops.object.mode_set(mode='EDIT')
    eb = {}
    for b in BONE_NAMES:
        e = data.edit_bones.new(b)
        e.head = Vector(joints[b])
        # the tail points at the first child with a joint of its own, else a stub straight up
        kids = [k for k, p in BONE_PARENT.items() if p == b and (Vector(joints[k]) - Vector(joints[b])).length > 1e-4]
        e.tail = Vector(joints[kids[0]]) if kids else Vector(joints[b]) + Vector((0, 0, STUB))
        e.use_deform = True
        eb[b] = e
    for b, p in BONE_PARENT.items():
        if p:
            eb[b].parent = eb[p]
            eb[b].use_connect = False
    bpy.ops.object.mode_set(mode='OBJECT')
    return ob


def tag(ob, part, weights):
    """Mark every vertex of `ob` as `part`, and weight it: `weights` is a bone name (all to it) or a function from a
    vertex's position to {bone: weight}."""
    if part not in PARTS:
        raise ValueError(f'unknown part {part}')
    me = ob.data
    attr = me.attributes.get('_PART') or me.attributes.new('_PART', 'FLOAT', 'POINT')
    for i in range(len(me.vertices)):
        attr.data[i].value = float(PARTS.index(part))
    groups = {}
    for v in me.vertices:
        w = {weights: 1.0} if isinstance(weights, str) else weights(ob.matrix_world @ v.co)
        for bone, x in w.items():
            if x <= 0:
                continue
            g = groups.get(bone) or ob.vertex_groups.get(bone) or ob.vertex_groups.new(name=bone)
            groups[bone] = g
            g.add([v.index], x, 'REPLACE')


def mark(name, at, collection_prefix='gamebird'):
    e = bpy.data.objects.new(f'mark_{name}', None)
    e.location = Vector(at)
    e.empty_display_size = 0.01
    bpy.context.scene.collection.objects.link(e)
    return e


def join(objects, name):
    for o in bpy.context.scene.objects:
        o.select_set(False)
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    ob = bpy.context.active_object
    ob.name = name
    ob.data.name = name
    return ob


def bind(mesh_ob, arm_ob):
    """Skin the mesh to the armature by its vertex groups (the weights `tag` gave)."""
    mesh_ob.parent = arm_ob
    mod = mesh_ob.modifiers.new('armature', 'ARMATURE')
    mod.object = arm_ob
    mod.use_vertex_groups = True


def export(path, objects):
    """Write the selected objects as a glb: the skinned mesh, its armature, and the landmarks; no images."""
    for o in bpy.context.scene.objects:
        o.select_set(False)
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format='GLB',
        use_selection=True,
        export_yup=True,
        export_apply=False,
        export_skins=True,
        export_all_influences=False,
        export_attributes=True,
        export_materials='NONE',
        export_animations=False,
        export_extras=True,
    )


def cylinder(name, a, b, r0, r1=None, sides=12):
    """A closed cylinder from a to b (Blender coordinates)."""
    a, b = Vector(a), Vector(b)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=sides, radius1=r0, radius2=r1 if r1 is not None else r0,
                          depth=(b - a).length)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    # the cone stands on z, centred on the origin: turn it onto a to b and move it there
    me.transform(Matrix.Translation((a + b) / 2) @ Vector((0, 0, 1)).rotation_difference(b - a).to_matrix().to_4x4())
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def ellipsoid(name, at, size, segments=24, rings=12):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segments, v_segments=rings, radius=1)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector(at), verts=bm.verts)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def plate(name, corners, thickness=0.002):
    """A thin closed plate through four corners (Blender coordinates), in order around it."""
    bm = bmesh.new()
    vs = [bm.verts.new(Vector(c)) for c in corners]
    f = bm.faces.new(vs)
    bmesh.ops.recalc_face_normals(bm, faces=[f])
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    moved = [e for e in r['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=f.normal * -thickness, verts=moved)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob
```

Create `scripts/blender/testbird/build.py`:

```python
"""The authored test bird: a small swimmer of primitives on the game's skeleton, for the loader's tests.

Built floating, its waterline on z = 0 (the game's y = 0) and the middle of its body over the origin; its legs built
standing, as an amphibious bird's are; a six-joint neck chain and a flight wing. Every part is weighted wholly to one
bone, so a test can tell which bone moves which part.

  blender -b -P scripts/blender/testbird/build.py

writes src/birds/detail/testbird.glb.
"""
import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'lib'))
import gamebird as g  # noqa: E402

OUT = os.path.join(HERE, '..', '..', '..', 'src', 'birds', 'detail', 'testbird.glb')

# Blender coordinates: +X forward, +Z up, the bird's left on +Y (the game's right side is Blender's -Y)
J = {
    'root': (0, 0, 0), 'body': (0, 0, 0),
    # a swimmer's hidden legs gather a quarter of the way up from the belly (-0.06) to the hips (-0.03)
    'legs': (0, 0, -0.0525),
    'neck': (0.12, 0, 0.03), 'neckMid': (0.125, 0, 0.07), 'neck3': (0.128, 0, 0.10), 'neck4': (0.13, 0, 0.125),
    'neck5': (0.135, 0, 0.145), 'neck6': (0.14, 0, 0.16), 'head': (0.15, 0, 0.17), 'bill': (0.18, 0, 0.17),
    'tail': (-0.15, 0, 0.02),
    'wingL': (0.04, 0.06, 0.04), 'wingR': (0.04, -0.06, 0.04),
    'handL': (0.04, 0.2, 0.04), 'handR': (0.04, -0.2, 0.04),
    'wingFoldL': (0.06, 0.055, 0.035), 'wingFoldR': (0.06, -0.055, 0.035),
    'tibiaL': (0, 0.03, -0.03), 'tarsusL': (0.01, 0.035, -0.10), 'toesL': (0, 0.035, -0.17),
    'tibiaR': (0, -0.03, -0.03), 'tarsusR': (0.01, -0.035, -0.10), 'toesR': (0, -0.035, -0.17),
    # no curl and no plume: parked at the body's pivot and the head, as the builder parks them
    'curl': (0, 0, 0), 'plume': (0.15, 0, 0.17),
}
MARKS = {
    'billBase': (0.18, 0, 0.17), 'billTip': (0.23, 0, 0.165),
    'tailRoot': (-0.15, 0, 0.02), 'tailTip': (-0.22, 0, 0.03),
    # the right side's (Blender's -Y): the folded wing's wrist and tip, and the flight wing's tip
    'wrist': (0.06, -0.055, 0.035), 'wingTip': (-0.12, -0.05, 0.04), 'flightTip': (0.0, -0.36, 0.04),
}


def neck_weights(p):
    """Each band of the neck to the joint below it."""
    chain = ['neck', 'neckMid', 'neck3', 'neck4', 'neck5', 'neck6']
    for name, nxt in zip(chain, chain[1:] + ['head']):
        if p.z < J[nxt][2]:
            return {name: 1.0}
    return {'neck6': 1.0}


def leg_weights(side):
    def w(p):
        if p.z > J['tarsus' + side][2]:
            return {'tibia' + side: 1.0}
        if p.z > J['toes' + side][2] + 0.004:
            return {'tarsus' + side: 1.0}
        return {'toes' + side: 1.0}
    return w


def build():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    parts = []
    body = g.ellipsoid('t.body', (0, 0, 0), (0.16, 0.07, 0.06))
    g.tag(body, 'skin', 'body')
    neck = g.cylinder('t.neck', J['neck'], J['head'], 0.022, 0.02)
    g.tag(neck, 'skin', neck_weights)
    head = g.ellipsoid('t.head', J['head'], (0.04, 0.028, 0.03))
    g.tag(head, 'skin', 'head')
    bill = g.cylinder('t.bill', MARKS['billBase'], MARKS['billTip'], 0.008, 0.002)
    g.tag(bill, 'bill', 'bill')
    eyes = [g.ellipsoid(f't.eye{s}', (0.165, y, 0.18), (0.006, 0.006, 0.006), 8, 6) for s, y in (('L', 0.025), ('R', -0.025))]
    for e in eyes:
        g.tag(e, 'eye', 'head')
    parts += [body, neck, head, bill, *eyes]
    for side, y in (('L', 1), ('R', -1)):
        fold = g.ellipsoid(f't.fold{side}', (-0.02, 0.06 * y, 0.03), (0.1, 0.008, 0.028))
        g.tag(fold, 'wingFold', 'wingFold' + side)
        inner = g.plate(f't.wing{side}', [(0.06, 0.06 * y, 0.04), (0.06, 0.2 * y, 0.04), (-0.04, 0.2 * y, 0.04), (-0.02, 0.06 * y, 0.04)])
        g.tag(inner, 'wingSpread', 'wing' + side)
        hand = g.plate(f't.hand{side}', [(0.06, 0.2 * y, 0.04), (0.0, 0.36 * y, 0.04), (-0.03, 0.34 * y, 0.04), (-0.04, 0.2 * y, 0.04)])
        g.tag(hand, 'wingSpread', 'hand' + side)
        leg = g.cylinder(f't.leg{side}', J['tibia' + side], J['tarsus' + side], 0.006)
        g.tag(leg, 'legs', leg_weights(side))
        shank = g.cylinder(f't.shank{side}', J['tarsus' + side], J['toes' + side], 0.004)
        g.tag(shank, 'legs', leg_weights(side))
        foot = g.plate(f't.foot{side}', [(0.04, 0.035 * y + 0.015, -0.168), (0.04, 0.035 * y - 0.015, -0.168), (-0.01, 0.035 * y - 0.005, -0.168), (-0.01, 0.035 * y + 0.005, -0.168)])
        g.tag(foot, 'legs', 'toes' + side)
        parts += [fold, inner, hand, leg, shank, foot]
    tail = g.plate('t.tail', [(-0.15, 0.03, 0.02), (-0.22, 0.04, 0.03), (-0.22, -0.04, 0.03), (-0.15, -0.03, 0.02)])
    g.tag(tail, 'tail', 'tail')
    parts.append(tail)
    mesh = g.join(parts, 'skin')
    arm = g.armature('testbird', J)
    g.bind(mesh, arm)
    marks = [g.mark(k, v) for k, v in MARKS.items()]
    for m in marks:
        m.parent = arm
    g.export(os.path.abspath(OUT), [arm, mesh, *marks])
    print('wrote', os.path.abspath(OUT), os.path.getsize(OUT), 'bytes')


build()
```

Create `src/birds/detail/authored.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import * as THREE from 'three'
import { authoredBuilt, authoredFor, authoredMaterial, parseGlb } from './authored'
import { loadAuthoredForTest, TEST_BIRD_GLB } from './authored.testkit'
import { buildDetailedBird, type DetailedBirdModel } from './build'
import { TEST_AUTHORED_SPEC, TEST_SPEC } from './fixture'
import { measure } from './measure'
import { BONE_NAMES } from './rig'
import { parseSpeciesSpec } from '../spec'
import { createBirdModel } from '../factory'
import { defaultPose, type PoseState } from '../model'

const S = TEST_AUTHORED_SPEC
const A = S.authored!
const fresh = async () => {
  const buf = readFileSync(TEST_BIRD_GLB)
  return parseGlb(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer)
}
const posed = (over: Partial<PoseState> = {}): PoseState => ({ ...defaultPose(), ...over })
/** every vertex of a part (anatomy.closed's run of its triangles), where the last pose put it */
function partNow(m: DetailedBirdModel, part: string): THREE.Vector3[] {
  m.group.updateMatrixWorld(true)
  const run = m.anatomy.closed.find(c => c.name === part)!
  const index = m.mesh.geometry.getIndex()!
  const seen = new Set<number>()
  for (let i = run.indexFirst; i < run.indexFirst + run.indexCount; i++) seen.add(index.getX(i))
  return [...seen].map(i => m.mesh.getVertexPosition(i, new THREE.Vector3()))
}

beforeAll(() => loadAuthoredForTest(S, TEST_BIRD_GLB))

describe('an authored bird in the schema', () => {
  it('accepts the test bird', () => {
    expect(A.model).toBe('testbird')
  })
  it('is lofted or authored, never both', () => {
    expect(() => parseSpeciesSpec({ ...S, detail: TEST_SPEC.detail })).toThrow(/not both/)
  })
  it('has textures for every variant, and each version is a variant', () => {
    expect(() => parseSpeciesSpec({ ...S, authored: { ...A, versions: ['adult'] } })).toThrow(/juvenile has no textures/)
    expect(() => parseSpeciesSpec({ ...S, authored: { ...A, versions: ['adult', 'juvenile', 'eclipse'] } })).toThrow(/eclipse/)
  })
  it('needs neckShapes, one bend per label, with a neck chain, and neither without one', () => {
    expect(() => parseSpeciesSpec({ ...S, authored: { ...A, neckShapes: undefined } })).toThrow(/neckShapes/)
    expect(() => parseSpeciesSpec({ ...S, authored: { ...A, neck: 6 } })).toThrow(/one bend per joint/)
    expect(() => parseSpeciesSpec({ ...S, authored: { ...A, neck: undefined } })).toThrow(/needs neck/)
  })
})

describe('the authored loader', () => {
  it('builds one skinned mesh on the builder\'s bones', () => {
    const m = buildDetailedBird(S)
    const meshes: THREE.Mesh[] = []
    m.group.traverse(o => { if (o instanceof THREE.Mesh) meshes.push(o) })
    expect(meshes).toEqual([m.mesh])
    expect(m.mesh.skeleton.bones.map(b => b.name)).toEqual([...BONE_NAMES])
    expect(m.profile).toBeNull()
  })
  it('is what the factory builds for an authored species', () => {
    expect((createBirdModel(S) as DetailedBirdModel).built).toBe(authoredFor(S))
  })
  it('puts each joint at its bone\'s head in the model, the bird\'s right on +z', () => {
    const j = authoredFor(S).joints
    expect(j.head.distanceTo(new THREE.Vector3(0.15, 0.17, 0))).toBeLessThan(1e-6)
    expect(j.tibiaR.distanceTo(new THREE.Vector3(0, -0.03, 0.03))).toBeLessThan(1e-6)
    expect(j.wingL.z).toBeLessThan(0)
  })
  it('weights every vertex to at most four bones, summing to 1', () => {
    const g = authoredFor(S).geometry
    const w = g.getAttribute('skinWeight')
    expect(w.itemSize).toBe(4)
    for (let i = 0; i < w.count; i++) expect(w.getX(i) + w.getY(i) + w.getZ(i) + w.getW(i)).toBeCloseTo(1, 5)
  })
  it('moves each part with its own bone: the skin\'s indices name the builder\'s bones', () => {
    const m = buildDetailedBird(S)
    const rest = partNow(m, 'bill').map(v => v.clone())
    m.pose(posed({ headPitch: 0.5 }))
    const moved = partNow(m, 'bill')
    expect(Math.max(...moved.map((v, k) => v.distanceTo(rest[k]!)))).toBeGreaterThan(0.01)
    // the wings open: both folded wings shrink to their wrists, and the flight wings reach out to their tips
    m.pose(posed({ wingSpread: 1, glide: 1 }))
    const j = authoredFor(S).joints
    for (const v of partNow(m, 'wingFold')) expect(Math.min(v.distanceTo(j.wingFoldL), v.distanceTo(j.wingFoldR))).toBeLessThan(0.001)
    const spread = partNow(m, 'wingSpread')
    expect(Math.max(...spread.map(v => Math.abs(v.z)))).toBeGreaterThan(0.3)
  })
  it('stands an amphibious bird on its feet at afloat 0: the soles on y = 0, the hips over the origin', () => {
    const m = buildDetailedBird(S)
    m.pose(posed({ afloat: 0 }))
    const legs = partNow(m, 'legs')
    expect(Math.min(...legs.map(v => v.y))).toBeCloseTo(0, 5)
    m.group.updateMatrixWorld(true)
    const hip = m.mesh.skeleton.bones.find(b => b.name === 'tibiaR')!.getWorldPosition(new THREE.Vector3())
    expect(hip.x).toBeCloseTo(0, 6)
    // afloat, as modelled: the legs hidden, gathered under the body
    m.pose(posed())
    expect(Math.min(...partNow(m, 'legs').map(v => v.y))).toBeGreaterThan(-0.06)
  })
  it('reads its anatomy from the landmarks and the parts', () => {
    const a = authoredFor(S).anatomy
    expect(a.billTip.distanceTo(new THREE.Vector3(0.23, 0.165, 0))).toBeLessThan(1e-6)
    expect(a.billBaseRing.length).toBeGreaterThan(3)
    expect(a.crown.length).toBeGreaterThan(0)
    // floating on y = 0: the water cuts the body's skin at both ends
    expect(a.waterline.back).toBeLessThan(-0.1)
    expect(a.waterline.front).toBeGreaterThan(0.1)
    expect(a.bodyLowY).toBeCloseTo(-0.06, 3)
    expect(a.flightWing!.tip.z).toBeGreaterThan(0.3)
  })
  it('measures as the model was made', () => {
    const r = measure(buildDetailedBird(S))
    expect(r.culmen).toBeCloseTo(Math.hypot(0.05, 0.005), 6)
    expect(r.tail).toBeCloseTo(Math.hypot(0.07, 0.01), 6)
    expect(r.tarsus).toBeCloseTo(Math.hypot(0.01, 0.07), 6)
    expect(r.draft).toBeCloseTo(0.06, 3)
  })
  it('shares one mesh between twins, and one material per version, the first version the default', () => {
    const a = buildDetailedBird(S, 'adult'), b = buildDetailedBird(S, 'juvenile', a)
    expect(b.mesh.geometry).toBe(a.mesh.geometry)
    expect(a.mesh.material).toBe(buildDetailedBird(S).mesh.material)
    expect(b.mesh.material).not.toBe(a.mesh.material)
    expect(authoredMaterial(S, 'juvenile')).toBe(b.mesh.material)
  })
  it('poses with the same code as a lofted bird: the neck chain bends and the head pumps', () => {
    const m = buildDetailedBird(S)
    m.pose(posed({ neckExtend: 0 }))
    m.group.updateMatrixWorld(true)
    const low = m.parts.head.getWorldPosition(new THREE.Vector3()).y
    m.pose(posed({ neckExtend: 1 }))
    m.group.updateMatrixWorld(true)
    expect(m.parts.head.getWorldPosition(new THREE.Vector3()).y).toBeGreaterThan(low)
  })
})

describe('the authored loader refuses a model that doesn\'t fit', () => {
  it('a neck chain other than authored.neck says', async () => {
    const short = parseSpeciesSpec({ ...S, authored: { ...A, neck: 6, neckShapes: { hunch: [0, 0, 0, 0, 0, 0], erect: [0, 0, 0, 0, 0, 0], strike: [0, 0, 0, 0, 0, 0] } } })
    expect(() => authoredBuilt(short, null as never)).toThrow()
    await expect(fresh().then(s => authoredBuilt(short, s))).rejects.toThrow(/neck6 has a length/)
  })
  it('a missing bone, or one under the wrong parent', async () => {
    const s1 = await fresh()
    s1.getObjectByName('plume')!.name = 'crest'
    expect(() => authoredBuilt(S, s1)).toThrow(/lacks plume/)
    const s2 = await fresh()
    s2.getObjectByName('wingL')!.attach(s2.getObjectByName('handR')!)
    expect(() => authoredBuilt(S, s2)).toThrow(/handR's parent is wingL/)
  })
  it('a missing landmark', async () => {
    const s = await fresh()
    s.getObjectByName('mark_tailTip')!.removeFromParent()
    expect(() => authoredBuilt(S, s)).toThrow(/mark_tailTip/)
  })
})
```

Create `src/birds/detail/authored.testkit.ts`:

```ts
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { SpeciesSpec } from '../spec'
import { authoredBuilt, authoredReady, parseGlb, storeAuthored } from './authored'

/** Load an authored species' model from disk for a test, as the game loads it at startup. */
export async function loadAuthoredForTest(spec: SpeciesSpec, path: string): Promise<void> {
  if (authoredReady(spec.code)) return
  const buf = readFileSync(path)
  const scene = await parseGlb(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer)
  storeAuthored(spec.code, authoredBuilt(spec, scene))
}

/** the Blender test bird, beside this file */
export const TEST_BIRD_GLB = fileURLToPath(new URL('./testbird.glb', import.meta.url))
```

In `src/birds/detail/fixture.ts`, replace:

```ts
  ...TEST_SPEC, code: 'testgoose', commonName: 'Test Goose', length: 0.69, posture: 'swimming', draft: 0.3, detail: TEST_GOOSE_DETAIL,
})

```

with:

```ts
  ...TEST_SPEC, code: 'testgoose', commonName: 'Test Goose', length: 0.69, posture: 'swimming', draft: 0.3, detail: TEST_GOOSE_DETAIL,
})

/**
 * A test bird made in Blender for the authored loader's tests: scripts/blender/testbird/build.py writes it, a small
 * swimmer of primitives (testbird.glb beside this file), floating with its legs standing, a six-joint neck chain, and a
 * flight wing. Each part is weighted wholly to one bone. Its numbers are the script's, not a species'.
 */
export const TEST_AUTHORED_SPEC: SpeciesSpec = parseSpeciesSpec({
  ...TEST_SPEC, detail: undefined, code: 'testauthored', commonName: 'Test Authored Bird', length: 0.45, posture: 'swimming', draft: 0.5,
  variants: { adult: {}, juvenile: {} },
  authored: {
    model: 'testbird',
    versions: ['adult', 'juvenile'],
    measurements: {
      length: 0.45, culmen: 0.05, billDepth: 0.016, billWidth: 0.016,
      tarsus: 0.07, tibia: 0.01, toe: 0.05, wingChord: 0.18, tail: 0.07,
    },
    neck: 7,
    neckShapes: { hunch: [-20, 10, 10, 0, 0, 0, 0], erect: [10, -5, -5, 0, 0, 0, 0], strike: [-30, -10, 0, 0, 0, 0, 0] },
    amphibious: true,
    flight: { beat: { shoulder: 40, lift: 5, hand: 20, lag: 0.1 }, glide: { shoulder: 3, hand: -5 } },
    sources: ['test fixture'],
  },
})

```

Build the test bird (Blender 5.2, headless; it writes `src/birds/detail/testbird.glb`, about 283 KB):

```bash
"/c/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --factory-startup -P scripts/blender/testbird/build.py
```

Expected: the last lines read `wrote ...\src\birds\detail\testbird.glb 283244 bytes`.

Run: `npx vitest run src/birds/detail/authored.test.ts`
Expected: FAIL: `./authored` doesn't exist.

- [ ] **Step 2: The schema, the loader, and the builder's authored path**

In `.gitignore`, replace:

```
.worktrees

```

with:

```
.worktrees
__pycache__

```

Create `src/birds/detail/authored.ts`:

```ts
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { SpeciesSpec } from '../spec'
import type { AuthoredSpec } from './spec'
import type { Anatomy, Built } from './build'
import type { LegLayout } from './legs'
import { BONE_INDEX, BONE_NAMES, BONE_PARENT, NECK_BONES, chainBones, type BoneName, type Joints } from './rig'

/**
 * The parts of an authored bird, in the order of the `_PART` vertex attribute's values (scripts/blender/lib/gamebird.py,
 * PARTS): each vertex says which part it belongs to, as the builder knows which it built.
 */
export const AUTHORED_PARTS = ['skin', 'bill', 'eye', 'wingFold', 'wingSpread', 'tail', 'legs'] as const
export type AuthoredPart = (typeof AUTHORED_PARTS)[number]
/** the landmarks the model marks with empties named mark_<name> */
export const MARKS = ['billBase', 'billTip', 'tailRoot', 'tailTip', 'wrist', 'wingTip'] as const

/** within this of the bill's base along the bill, a bill vertex is on its base ring (metres) */
const BASE_RING = 0.0015
/** a joint this close to the one before it along the neck is parked there, with no length (metres) */
const PARKED = 1e-4

/** Parse a glb (the bytes of <model>.glb) into its scene. Works without a DOM: the glb holds no images. */
export function parseGlb(bytes: ArrayBuffer): Promise<THREE.Group> {
  return new Promise((resolve, reject) => new GLTFLoader().parse(bytes, '', g => resolve(g.scene), reject))
}

/**
 * What every bird of an authored species shares, from its model: the skinned mesh in group space, its skin indices
 * remapped to the builder's bones (BONE_NAMES), each joint at its bone's head, and the anatomy the pose code and the
 * measures read, from the landmarks and the parts. The model is built as the builder builds: floating on y = 0 (a
 * swimmer) with its legs standing, or standing on y = 0.
 */
export function authoredBuilt(spec: SpeciesSpec, scene: THREE.Object3D): Built {
  const A = spec.authored
  if (!A) throw new Error(`${spec.code}: not an authored bird`)
  scene.updateMatrixWorld(true)
  const skins: THREE.SkinnedMesh[] = []
  scene.traverse(o => { if ((o as THREE.SkinnedMesh).isSkinnedMesh) skins.push(o as THREE.SkinnedMesh) })
  if (skins.length !== 1) throw new Error(`${spec.code}: the model has ${skins.length} skinned meshes, not one`)
  const skin = skins[0]!
  const fileBones = skin.skeleton.bones
  const names = fileBones.map(b => b.name)
  const missing = BONE_NAMES.filter(n => !names.includes(n))
  if (missing.length) throw new Error(`${spec.code}: the model's skeleton lacks ${missing.join(', ')}`)
  for (const b of fileBones) {
    if (!(b.name in BONE_INDEX)) throw new Error(`${spec.code}: the model has a bone the builder doesn't: ${b.name}`)
    const want = BONE_PARENT[b.name as BoneName]
    const got = b.parent && (b.parent as THREE.Bone).isBone ? b.parent.name : null
    if (got !== want) throw new Error(`${spec.code}: ${b.name}'s parent is ${got}, not ${want}`)
  }
  const joints = Object.fromEntries(fileBones.map(b => [b.name, b.getWorldPosition(new THREE.Vector3())])) as Joints
  const marks = Object.fromEntries(MARKS.map(n => {
    const o = scene.getObjectByName(`mark_${n}`)
    if (!o) throw new Error(`${spec.code}: the model has no landmark mark_${n}`)
    return [n, o.getWorldPosition(new THREE.Vector3())]
  })) as Record<(typeof MARKS)[number], THREE.Vector3>

  const geometry = groupSpace(skin, names)
  const pos = geometry.getAttribute('position') as THREE.BufferAttribute
  const at = (i: number) => new THREE.Vector3().fromBufferAttribute(pos, i)
  const ranges = partRanges(geometry)
  const verts = (p: AuthoredPart) => { const r = ranges.vertices[p]; return r ? Array.from({ length: r.count }, (_, k) => r.first + k) : [] }
  const strongest = (i: number) => {
    const si = geometry.getAttribute('skinIndex'), sw = geometry.getAttribute('skinWeight')
    let best = 0
    for (let k = 1; k < 4; k++) if (sw.getComponent(i, k) > sw.getComponent(i, best)) best = k
    return BONE_NAMES[si.getComponent(i, best)]!
  }

  // the neck chain: its joints, base to head, until the first one parked on the one before it
  const chain = A.neck === undefined ? null : chainBones(A.neck)
  if (chain) {
    const used = chain.length - 1
    NECK_BONES.forEach((n, k) => {
      if (k === 0) return
      const parked = joints[n].distanceTo(joints[NECK_BONES[k - 1]!]) < PARKED
      if (k < used && parked) throw new Error(`${spec.code}: ${n} is parked, but authored.neck says the chain uses it`)
      if (k >= used && !parked) throw new Error(`${spec.code}: ${n} has a length, but authored.neck says the chain stops before it`)
    })
  }

  const hipR = joints.tibiaR.clone(), kneeR = joints.tarsusR.clone(), footR = joints.toesR.clone()
  const legs = verts('legs').map(at)
  const sole = legs.length ? Math.min(...legs.map(v => v.y)) : footR.y
  const skinVerts = verts('skin')
  const bodyVerts = skinVerts.filter(i => strongest(i) === 'body')
  const headVerts = skinVerts.filter(i => strongest(i) === 'head')
  const bodyPts = bodyVerts.map(at)
  const under = bodyPts.filter(v => Math.abs(v.x - hipR.x) < 0.01)
  const bellyY = under.length ? Math.min(...under.map(v => v.y)) : Math.min(...bodyPts.map(v => v.y))
  const neckY = joints.neck.y
  const breastFront = bodyPts.filter(v => v.y < neckY).reduce((a, v) => (v.x > a.x ? v : a), new THREE.Vector3(-Infinity, 0, 0)).clone()
  const billDir = marks.billTip.clone().sub(marks.billBase).normalize()
  const billUp = new THREE.Vector3(-billDir.y, billDir.x, 0).normalize()
  const billBaseRing = verts('bill').map(at).filter(v => Math.abs(v.clone().sub(marks.billBase).dot(billDir)) < BASE_RING)
  const fold = verts('wingFold').map(at)
  const spread = ranges.vertices.wingSpread
  const flightTip = scene.getObjectByName('mark_flightTip')?.getWorldPosition(new THREE.Vector3()) ?? null
  if (A.flight && (!spread || !flightTip)) throw new Error(`${spec.code}: authored.flight needs the model's spread wing and its mark_flightTip`)
  const water = waterSpan(geometry, ranges.indices.skin)
  const swimming = spec.posture === 'swimming'
  const amphibious = swimming && !!A.amphibious

  const anatomy: Anatomy = {
    billBase: marks.billBase, billTip: marks.billTip, billDir, billUp, billBaseRing,
    tailRoot: marks.tailRoot, tailTip: marks.tailTip, wrist: marks.wrist, wingTip: marks.wingTip,
    hip: hipR, knee: kneeR, foot: footR, bellyY,
    bodyLowY: Math.min(...bodyPts.map(v => v.y)),
    wingLowY: fold.length ? Math.min(...fold.map(v => v.y)) : bellyY,
    backTopY: Math.max(...bodyPts.map(v => v.y)),
    breastFront, waterline: { back: water[0], front: water[1] },
    head: headVerts.map(at), crown: headVerts, rings: 0,
    stations: [], spine: [],
    closed: AUTHORED_PARTS.flatMap(p => (ranges.indices[p] ? [{ name: p, ...ranges.indices[p]! }] : [])),
    shield: null, pouch: null,
    flightWing: A.flight && spread ? { first: spread.first, count: spread.count, wrist: joints.handR.clone(), tip: flightTip! } : null,
    parts: [],
  }
  // the leg's segments as the builder's leg IK sees them, in the side view
  const tibia = Math.hypot(kneeR.x - hipR.x, kneeR.y - hipR.y), tarsus = Math.hypot(footR.x - kneeR.x, footR.y - kneeR.y)
  const layout: LegLayout = {
    hip: hipR, bellyY, tibia, tarsus, toe: A.measurements.toe,
    standHeight: hipR.y - footR.y, footY: footR.y - sole, tarsusRadius: (A.measurements.tarsus * 0.045) / 2,
    knee: kneeR, foot: footR, swimming: swimming && !amphibious,
  }
  // standing, the hips over the origin and the soles on y = 0
  const ashore = new THREE.Vector3(-hipR.x, -sole, 0)
  // the head pump's reach is a share of the body's length: tail root to bill base along the joints
  const line = [marks.tailRoot, joints.body, ...(chain ?? ['neck', 'neckMid', 'head'] as const).map(n => joints[n]), marks.billBase]
  const bodyLength = line.slice(1).reduce((s, p, k) => s + p.distanceTo(line[k]!), 0)
  const neckAlong = chain ? joints[chain[1]!].clone().sub(joints[chain[0]!]) : null
  geometry.deleteAttribute('_part')
  return { profile: null, layout, geometry, joints, anatomy, ashore, bodyLength, neckAlong }
}

/**
 * The skinned mesh's geometry in group space, its skin indices remapped from the file's joint order to BONE_NAMES, and
 * its vertices and triangles sorted by part, so each part is one run of each.
 */
function groupSpace(skin: THREE.SkinnedMesh, fileNames: string[]): THREE.BufferGeometry {
  const src = skin.geometry.clone()
  src.applyMatrix4(skin.matrixWorld)
  const partAttr = src.getAttribute('_part')
  if (!partAttr) throw new Error('the model has no _PART attribute')
  const n = src.getAttribute('position').count
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => partAttr.getX(a) - partAttr.getX(b) || a - b)
  const newIndex = new Uint32Array(n)
  order.forEach((old, k) => { newIndex[old] = k })
  const out = new THREE.BufferGeometry()
  for (const [name, attr] of Object.entries(src.attributes)) {
    const a = attr as THREE.BufferAttribute
    const size = a.itemSize
    const arr = name === 'skinIndex' ? new Uint16Array(n * size) : new Float32Array(n * size)
    order.forEach((old, k) => {
      for (let c = 0; c < size; c++) {
        const v = a.getComponent(old, c)
        arr[k * size + c] = name === 'skinIndex' ? BONE_INDEX[fileNames[v] as BoneName] : v
      }
    })
    out.setAttribute(name, new THREE.BufferAttribute(arr, size, name === 'normal' ? false : a.normalized && name !== 'skinIndex'))
  }
  const index = src.getIndex()
  const tris: number[][] = []
  if (index) for (let i = 0; i < index.count; i += 3) tris.push([newIndex[index.getX(i)]!, newIndex[index.getX(i + 1)]!, newIndex[index.getX(i + 2)]!])
  else for (let i = 0; i < n; i += 3) tris.push([newIndex[i]!, newIndex[i + 1]!, newIndex[i + 2]!])
  const p = out.getAttribute('_part')
  tris.sort((a, b) => p.getX(a[0]!) - p.getX(b[0]!))
  out.setIndex(tris.flat())
  out.computeBoundingSphere()
  return out
}

/** Each part's run of vertices and of triangle indices, once groupSpace has sorted them. */
function partRanges(g: THREE.BufferGeometry) {
  const p = g.getAttribute('_part'), index = g.getIndex()!
  const vertices: Partial<Record<AuthoredPart, { first: number; count: number }>> = {}
  const indices: Partial<Record<AuthoredPart, { indexFirst: number; indexCount: number }>> = {}
  for (let i = 0; i < p.count; i++) {
    const k = AUTHORED_PARTS[p.getX(i)]!
    const r = vertices[k] ?? (vertices[k] = { first: i, count: 0 })
    r.count++
  }
  for (let i = 0; i < index.count; i += 3) {
    const k = AUTHORED_PARTS[p.getX(index.getX(i))]!
    const r = indices[k] ?? (indices[k] = { indexFirst: i, indexCount: 0 })
    r.indexCount += 3
  }
  return { vertices, indices }
}

/** Where the plane y = 0 cuts the skin in the side view: its rearmost and frontmost x; 0, 0 if it misses. */
function waterSpan(g: THREE.BufferGeometry, run: { indexFirst: number; indexCount: number } | undefined): [number, number] {
  if (!run) return [0, 0]
  const pos = g.getAttribute('position'), index = g.getIndex()!
  let lo = Infinity, hi = -Infinity
  for (let i = run.indexFirst; i < run.indexFirst + run.indexCount; i += 3) {
    for (let k = 0; k < 3; k++) {
      const a = index.getX(i + k), b = index.getX(i + ((k + 1) % 3))
      const ya = pos.getY(a), yb = pos.getY(b)
      if ((ya < 0) === (yb < 0)) continue
      const x = pos.getX(a) + (pos.getX(b) - pos.getX(a)) * (ya / (ya - yb))
      lo = Math.min(lo, x); hi = Math.max(hi, x)
    }
  }
  return lo === Infinity ? [0, 0] : [lo, hi]
}

const builts = new Map<string, Built>()

/** Keep an authored species' Built, once its model has loaded, for every bird built of it. */
export function storeAuthored(code: string, built: Built): void {
  builts.set(code, built)
}

/** An authored species' Built; its model must have loaded (loadAuthored at startup, or the viewer's). */
export function authoredFor(spec: SpeciesSpec): Built {
  const b = builts.get(spec.code)
  if (!b) throw new Error(`${spec.code}: its model hasn't loaded (public/models/${spec.authored?.model}/)`)
  return b
}

/** True once an authored species' model has loaded. */
export function authoredReady(code: string): boolean {
  return builts.has(code)
}

export type { AuthoredSpec }

/** each version's maps, once loaded */
export interface AuthoredMaps { map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture }
const maps = new Map<string, AuthoredMaps>()
const materials = new Map<string, THREE.MeshStandardMaterial>()
const versionOf = (spec: SpeciesSpec, variant?: string) => variant ?? spec.authored!.versions[0]!

/** Keep a version's maps, once loaded, for authoredMaterial. */
export function storeAuthoredMaps(code: string, version: string, m: AuthoredMaps): void {
  maps.set(`${code}:${version}`, m)
  materials.delete(`${code}:${version}`)
}

/**
 * One material per authored species and version, shared by every bird of that kind: its colour, normal, and roughness
 * maps. Without them (Node, where no image loads) a plain grey stands in, so the tests can build the bird.
 */
export function authoredMaterial(spec: SpeciesSpec, variant?: string): THREE.MeshStandardMaterial {
  const key = `${spec.code}:${versionOf(spec, variant)}`
  let mat = materials.get(key)
  if (!mat) {
    const m = maps.get(key)
    mat = m
      ? new THREE.MeshStandardMaterial({ map: m.map, normalMap: m.normalMap, roughnessMap: m.roughnessMap, roughness: 1, metalness: 0 })
      : new THREE.MeshStandardMaterial({ color: '#555555', roughness: 0.8, metalness: 0 })
    materials.set(key, mat)
  }
  return mat
}
```

In `src/birds/detail/build.ts`, replace:

```ts
import { materialFor } from '../paint/painter'

```

with:

```ts
import { materialFor } from '../paint/painter'
import { authoredFor, authoredMaterial } from './authored'

```

In `src/birds/detail/build.ts`, replace:

```ts
/**
 * A detailed bird of a species, in one of its versions. With a `twin` (another bird of the same species, of any
 * version), it shares the twin's mesh and builds only its own bones: a flock's birds cost one mesh between them.
 */
export function buildDetailedBird(spec: SpeciesSpec, variant?: string, twin?: DetailedBirdModel): DetailedBirdModel {
  const detail = spec.detail
  if (!detail) throw new Error(`${spec.code}: no detail block`)
```

with:

```ts
/**
 * A detailed bird of a species, in one of its versions: lofted from its detail block, or made in Blender (`authored`,
 * its model loaded already). With a `twin` (another bird of the same species, of any version), it shares the twin's
 * mesh and builds only its own bones: a flock's birds cost one mesh between them.
 */
export function buildDetailedBird(spec: SpeciesSpec, variant?: string, twin?: DetailedBirdModel): DetailedBirdModel {
  // how it moves: the same fields either way
  const detail = spec.detail ?? spec.authored
  if (!detail) throw new Error(`${spec.code}: no detail block`)
```

In `src/birds/detail/build.ts`, replace:

```ts
  if (twin && twin.spec !== spec) throw new Error(`${spec.code}: a twin must be a bird of the same species`)
  const built = twin ? twin.built : construct(spec)
  const { profile, layout, geometry, joints, ashore, bodyLength, neckAlong } = built
```

with:

```ts
  if (twin && twin.spec !== spec) throw new Error(`${spec.code}: a twin must be a bird of the same species`)
  const built = twin ? twin.built : spec.authored ? authoredFor(spec) : construct(spec)
  const { profile, layout, geometry, joints, ashore, bodyLength, neckAlong } = built
```

In `src/birds/detail/build.ts`, replace:

```ts
  const amphibious = swimming && !!detail.amphibious
  const shown = (kind: string) => !!variant && !!detail.parts?.find(p => p.kind === kind)?.versions.includes(variant)
  const anatomy: Anatomy = { ...built.anatomy, parts: built.anatomy.parts.map(e => ({ ...e, shown: shown(e.kind) })) }
  const { pouch, flightWing } = anatomy
  const chainNames = detail.rig.neck ? chainBones(detail.rig.neck.length) : null
  const hipR = anatomy.hip, kneeR = anatomy.knee, footR = anatomy.foot
```

with:

```ts
  const amphibious = swimming && !!detail.amphibious
  const shown = (kind: string) => !!variant && !!spec.detail?.parts?.find(p => p.kind === kind)?.versions.includes(variant)
  const anatomy: Anatomy = { ...built.anatomy, parts: built.anatomy.parts.map(e => ({ ...e, shown: shown(e.kind) })) }
  const { pouch, flightWing } = anatomy
  const chainLabels = spec.detail ? spec.detail.rig.neck?.length : spec.authored!.neck
  const chainNames = chainLabels ? chainBones(chainLabels) : null
  const hipR = anatomy.hip, kneeR = anatomy.knee, footR = anatomy.foot
```

In `src/birds/detail/build.ts`, replace:

```ts

  const mesh = new THREE.SkinnedMesh(geometry, materialFor(spec, variant))
  mesh.name = 'skin'
```

with:

```ts

  const mesh = new THREE.SkinnedMesh(geometry, spec.authored ? authoredMaterial(spec, variant) : materialFor(spec, variant))
  mesh.name = 'skin'
```

In `src/birds/detail/spec.ts`, replace:

```ts

/** The layer list for a variant: the variant's own list when it has one, else the base plumage. */
```

with:

```ts

/**
 * A detailed bird made outside the game, in Blender (scripts/blender/): its mesh, skin, and each version's textures come
 * from public/models/<model>/, and only how it moves is set here. The model is built on the detailed builder's
 * skeleton (rig.ts), so it poses with the same code as a lofted bird. The fields mean what the same fields of a lofted
 * detail block mean.
 * - `model`: the folder under public/models/, holding <model>.glb (the mesh, its skin and landmarks, no images) and
 *   <version>.color.webp, <version>.normal.webp, <version>.rough.webp for each version.
 * - `versions`: the versions it has textures for, each one of the species' variants; the first is the default (a bird
 *   cast with no plumage).
 * - `neck`: how many labels the model's neck chain has, its base to its head (chainBones): the loader checks the model's
 *   joints against it.
 * - `flight`: a flight wing's wingbeat and glide; its planform is the model's.
 */
export const authoredSchema = z.object({
  model: z.string().regex(/^[a-z0-9-]+$/, 'a folder name under public/models/'),
  versions: z.array(z.string().min(1)).min(1),
  measurements: detailSchema.shape.measurements,
  neck: z.number().int().min(3).max(7).optional(),
  neckShapes: detailSchema.shape.neckShapes,
  neckStretch: detailSchema.shape.neckStretch,
  reachStretch: detailSchema.shape.reachStretch,
  stepLength: detailSchema.shape.stepLength,
  probeDepth: detailSchema.shape.probeDepth,
  amphibious: detailSchema.shape.amphibious,
  flock: detailSchema.shape.flock,
  waddle: detailSchema.shape.waddle,
  flight: z.object({ beat: detailSchema.shape.flight.unwrap().shape.beat, glide: detailSchema.shape.flight.unwrap().shape.glide }).optional(),
  sources: detailSchema.shape.sources,
}).superRefine((d, ctx) => {
  if (d.neck !== undefined) {
    if (!d.neckShapes) ctx.addIssue({ code: 'custom', message: 'a chained neck needs neckShapes', path: ['neckShapes'] })
    else for (const [k, v] of Object.entries(d.neckShapes)) {
      if (v.length !== d.neck) ctx.addIssue({ code: 'custom', message: `neckShapes.${k} needs one bend per joint (${d.neck})`, path: ['neckShapes', k] })
    }
  } else {
    for (const k of ['neckShapes', 'neckStretch', 'reachStretch'] as const) {
      if (d[k] !== undefined) ctx.addIssue({ code: 'custom', message: `${k} needs neck`, path: [k] })
    }
  }
  if (new Set(d.versions).size !== d.versions.length) ctx.addIssue({ code: 'custom', message: 'a version is named twice', path: ['versions'] })
})
export type AuthoredSpec = z.infer<typeof authoredSchema>

/** The layer list for a variant: the variant's own list when it has one, else the base plumage. */
```

In `src/birds/factory.ts`, replace:

```ts
import type { SpeciesSpec } from './spec'
```

with:

```ts
import { isDetailed, type SpeciesSpec } from './spec'
```

In `src/birds/factory.ts`, replace:

```ts
/** The detailed builder for species with a detail block, the block builder for everything else. */
```

with:

```ts
/** The detailed builder for detailed species (lofted or authored), the block builder for everything else. */
```

In `src/birds/factory.ts`, replace:

```ts
  return spec.detail ? buildDetailedBird(spec, variant) : buildBird(spec, variant)
```

with:

```ts
  return isDetailed(spec) ? buildDetailedBird(spec, variant) : buildBird(spec, variant)
```

In `src/birds/spec.ts`, replace:

```ts
import { z } from 'zod'
import { detailSchema } from './detail/spec'

```

with:

```ts
import { z } from 'zod'
import { detailSchema, authoredSchema } from './detail/spec'

```

In `src/birds/spec.ts`, replace:

```ts

/**
 * Whether a species' flyover flock flies as detailed birds: any detailed species, unless its detail block keeps its
 * flock to the block bird (`flock: 'block'`, a goose's until it has a wing to fly on).
 */
export const fliesDetailed = (spec: { detail?: { flock?: string } } | undefined): boolean => !!spec?.detail && spec.detail.flock !== 'block'

```

with:

```ts

/** Whether a species is a detailed bird: lofted by the detailed builder (`detail`) or made in Blender (`authored`). */
export const isDetailed = (spec: { detail?: unknown; authored?: unknown } | undefined): boolean => !!(spec?.detail || spec?.authored)

/**
 * Whether a species' flyover flock flies as detailed birds: any detailed species, unless it keeps its flock to the
 * block bird (`flock: 'block'`, a goose's until it has a wing to fly on).
 */
export const fliesDetailed = (spec: { detail?: { flock?: string }; authored?: { flock?: string } } | undefined): boolean =>
  isDetailed(spec) && (spec!.detail ?? spec!.authored)!.flock !== 'block'

```

In `src/birds/spec.ts`, replace:

```ts
  detail: detailSchema.optional(),
}).superRefine((s, ctx) => {
  // what the detailed builder refuses, refused at load
```

with:

```ts
  detail: detailSchema.optional(),
  /** present when the species is a detailed bird made in Blender (detail/spec.ts); never with `detail` */
  authored: authoredSchema.optional(),
}).superRefine((s, ctx) => {
  if (s.detail && s.authored) ctx.addIssue({ code: 'custom', message: `${s.code}: a bird is lofted (detail) or authored, not both`, path: ['authored'] })
  if (s.authored) {
    if (s.posture === 'perched') ctx.addIssue({ code: 'custom', message: `${s.code}: an authored bird stands or swims, not perched`, path: ['posture'] })
    if (s.authored.amphibious && s.posture !== 'swimming') ctx.addIssue({ code: 'custom', message: `${s.code}: an amphibious bird is built floating, so its posture is swimming`, path: ['posture'] })
    // every plumage the cast can ask for has textures
    for (const k of Object.keys(s.variants)) {
      if (!s.authored.versions.includes(k)) ctx.addIssue({ code: 'custom', message: `${s.code}: variant ${k} has no textures (authored.versions)`, path: ['authored', 'versions'] })
    }
    for (const v of s.authored.versions) {
      if (!(v in s.variants)) ctx.addIssue({ code: 'custom', message: `${s.code}: authored version ${v} is not one of the species' variants`, path: ['authored', 'versions'] })
    }
  }
  // what the detailed builder refuses, refused at load
```

- [ ] **Step 3: See it pass**

Run: `npx vitest run src/birds/detail/authored.test.ts`
Expected: 17 tests pass.

Run: `npm test && npx tsc --noEmit -p .`
Expected: every test passes (1254). No type errors.

- [ ] **Step 4: Commit**

```bash
git add .gitignore scripts/blender/lib scripts/blender/testbird src/birds
git commit -m "feat: authored birds: a detailed species made in Blender (spec.authored), its glb read onto the builder's bones and posed by the same code; the shared Blender helpers and a test bird (Task 2)"
```

---

### Task 3: Loading authored birds at startup, and in the viewer

**Files:**
- Create: `src/birds/models.ts`, `src/birds/models.test.ts`
- Modify: `src/birds/prewarm.ts`, `src/viewer/main.ts`

**Interfaces:**
- Consumes: Task 2's `parseGlb`, `authoredBuilt`, `storeAuthored`, `storeAuthoredMaps`, `authoredReady`.
- Produces: see "Interfaces between the tasks".

The cast's authored species load behind the title card while the atlases paint and the folds are placed: each model and
each of its versions' maps, all at once, each counted as it arrives in the title card's one count, whose total is set
before anything starts. The build waits for all three. A species loaded already is skipped; a file that fails rejects,
and the title card says the birds could not be set up. The viewer loads the pair's authored species before it builds
them, and marks an authored species with the lofted ones' `*`.

- [ ] **Step 1: The failing tests**

Create `src/birds/models.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import * as THREE from 'three'
import type { Location } from '../location/schema'
import { castModels, ensureAuthored, loadModels, type ModelLoader } from './models'
import { prepareBirds } from './prewarm'
import { authoredMaterial, authoredReady, parseGlb } from './detail/authored'
import { TEST_BIRD_GLB } from './detail/authored.testkit'
import { TEST_AUTHORED_SPEC } from './detail/fixture'
import { parseSpeciesSpec, type SpeciesSpec } from './spec'
import type { PaintWorker } from './paint/prepaint'

const loc = (cast: Location['cast']): Location => ({
  id: 'l', name: 'L', region: '', habitat: 'wetland', season: 'early-autumn', timeOfDay: 'morning',
  vantage: { position: [0, 1.6, 0], heading: 0 }, wind: { direction: 0, strength: 0.3, gustiness: 0.5 },
  zones: { w: { kind: 'polygon', points: [[0, 0], [1, 0], [1, 1]] } },
  cast, ambience: [],
})
/** the test bird under a code of its own, so each test loads it afresh (the loaded models are kept by code) */
const bird = (code: string): SpeciesSpec => parseSpeciesSpec({ ...TEST_AUTHORED_SPEC, code })
const glb = () => {
  const buf = readFileSync(TEST_BIRD_GLB)
  return parseGlb(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer)
}
/** a stand-in for the browser's loader: the test bird's model, and a blank texture for every map, each a tick later */
function stubLoader(log: string[] = []): ModelLoader {
  return {
    async model(spec) { log.push(`model ${spec.code}`); return glb() },
    async maps(spec, version) {
      log.push(`maps ${spec.code} ${version}`)
      const t = () => new THREE.Texture()
      return { map: t(), normalMap: t(), roughnessMap: t() }
    },
  }
}

describe('castModels', () => {
  it('names every authored species the cast needs, once each, and no lofted or block one', () => {
    const specs = { a1: bird('a1') }
    const got = castModels(loc([
      { species: 'a1', behavior: 'swim', zone: 'w', count: 1 },
      { species: 'a1', behavior: 'swim', zone: 'w', count: 2 },
      { species: 'pibgre', behavior: 'swim', zone: 'w', count: 1 },
      { species: 'rewbla', behavior: 'perch', zone: 'w', count: 1 },
    ]), { ...specs })
    expect(got.map(s => s.code)).toEqual(['a1'])
  })
})

describe('loadModels', () => {
  it('loads each model and each version\'s maps, counting each as it arrives, and keeps them for the builder', async () => {
    const spec = bird('a2'), log: string[] = [], counts: string[] = []
    await loadModels(loc([{ species: 'a2', behavior: 'swim', zone: 'w', count: 2 }]), {
      specs: { a2: spec }, loader: stubLoader(log), onProgress: (d, t) => counts.push(`${d} of ${t}`),
    })
    expect(log.sort()).toEqual(['maps a2 adult', 'maps a2 juvenile', 'model a2'])
    expect(counts).toEqual(['0 of 3', '1 of 3', '2 of 3', '3 of 3'])
    expect(authoredReady('a2')).toBe(true)
    expect(authoredMaterial(spec, 'juvenile').normalMap).toBeInstanceOf(THREE.Texture)
  })
  it('loads nothing for a species loaded already', async () => {
    const spec = bird('a3'), log: string[] = []
    await ensureAuthored(spec, stubLoader())
    await loadModels(loc([{ species: 'a3', behavior: 'swim', zone: 'w', count: 1 }]), { specs: { a3: spec }, loader: stubLoader(log) })
    expect(log).toEqual([])
  })
  it('rejects when a file fails', async () => {
    const failing: ModelLoader = { ...stubLoader(), async model() { throw new Error('404') } }
    await expect(loadModels(loc([{ species: 'a4', behavior: 'swim', zone: 'w', count: 1 }]), { specs: { a4: bird('a4') }, loader: failing })).rejects.toThrow(/404/)
  })
})

describe('prepareBirds with an authored bird', () => {
  const noWorker = (): PaintWorker => { throw new Error('no worker here') }
  it('counts its model and maps in the one count, and builds only once they have loaded', async () => {
    const spec = bird('a5'), counts: [number, number][] = []
    await prepareBirds(loc([{ species: 'a5', behavior: 'swim', zone: 'w', count: 1 }]), {
      specs: { a5: spec }, worker: noWorker, models: stubLoader(), next: async () => {},
      onProgress: (d, t) => counts.push([d, t]),
      build: () => expect(authoredReady('a5')).toBe(true),
    })
    // its model, its two versions' maps, and the build; no atlas and no fold for an authored bird
    expect(counts.every(([, t]) => t === 4)).toBe(true)
    expect(counts.at(-1)).toEqual([4, 4])
  })
})
```

Run: `npx vitest run src/birds/models.test.ts`
Expected: FAIL: `./models` doesn't exist.

- [ ] **Step 2: The loader and the count**

Create `src/birds/models.ts`:

```ts
import * as THREE from 'three'
import type { Location } from '../location/schema'
import { fliesDetailed, type SpeciesSpec } from './spec'
import { SPECIES } from './species'
import { expandCast } from './spawn'
import { makeRng } from '../catalog/rng'
import { authoredBuilt, authoredReady, parseGlb, storeAuthored, storeAuthoredMaps, type AuthoredMaps } from './detail/authored'

/** Where an authored bird's files are served from: public/models/<model>/ */
const modelUrl = (spec: SpeciesSpec, file: string) => `${import.meta.env?.BASE_URL ?? '/'}models/${spec.authored!.model}/${file}`

/** How an authored bird's files are fetched: the browser's own, or a test's stand-in. */
export interface ModelLoader {
  /** the parsed <model>.glb */
  model(spec: SpeciesSpec): Promise<THREE.Object3D>
  /** one version's colour, normal, and roughness maps */
  maps(spec: SpeciesSpec, version: string): Promise<AuthoredMaps>
}

/** Fetches a model and its maps from public/models/. The maps are laid out as glTF's UVs are (no flip). */
export const browserLoader: ModelLoader = {
  async model(spec) {
    const url = modelUrl(spec, `${spec.authored!.model}.glb`)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${spec.code}: ${url}: ${res.status}`)
    return parseGlb(await res.arrayBuffer())
  },
  async maps(spec, version) {
    const loader = new THREE.TextureLoader()
    const [map, normalMap, roughnessMap] = await Promise.all(['color', 'normal', 'rough'].map(k => loader.loadAsync(modelUrl(spec, `${version}.${k}.webp`))))
    for (const t of [map!, normalMap!, roughnessMap!]) { t.flipY = false; t.anisotropy = 4 }
    map!.colorSpace = THREE.SRGBColorSpace
    return { map: map!, normalMap: normalMap!, roughnessMap: roughnessMap! }
  },
}

/**
 * Every authored species the cast can need, once each, with all its versions: whatever `expandCast` would build, then
 * the flyover flocks' that fly as detailed birds. `specs` is the registry, or a test's own.
 */
export function castModels(loc: Location, specs: Record<string, SpeciesSpec> = SPECIES): SpeciesSpec[] {
  const seen = new Map<string, SpeciesSpec>()
  for (const ind of expandCast(loc, makeRng(1))) {
    const spec = specs[ind.species]
    if (spec?.authored) seen.set(spec.code, spec)
  }
  for (const entry of loc.cast) {
    const spec = specs[entry.species]
    if (entry.behavior === 'flyover' && spec?.authored && fliesDetailed(spec)) seen.set(spec.code, spec)
  }
  return [...seen.values()]
}

export interface LoadModelsOptions {
  specs?: Record<string, SpeciesSpec>
  loader?: ModelLoader
  /** called at the start and after each file set: a species' model, or one version's maps */
  onProgress?: (done: number, total: number) => void
}

/** How many steps loadModels counts for these species: each one's model, and each of its versions' maps. */
export const modelSteps = (species: SpeciesSpec[]): number =>
  species.filter(s => !authoredReady(s.code)).reduce((n, s) => n + 1 + s.authored!.versions.length, 0)

/**
 * Load every authored model the cast needs and each of its versions' maps, all at once, and keep them for the builder
 * (storeAuthored, storeAuthoredMaps), so building a bird loads nothing. Counts each model and each version's maps as
 * it arrives. A species loaded already is skipped. Rejects if any file fails.
 */
export async function loadModels(loc: Location, opts: LoadModelsOptions = {}): Promise<void> {
  const species = castModels(loc, opts.specs ?? SPECIES).filter(s => !authoredReady(s.code))
  await loadSpecies(species, opts)
}

/** Load one authored species (the viewer's, before it builds one), if it hasn't loaded. */
export async function ensureAuthored(spec: SpeciesSpec, loader: ModelLoader = browserLoader): Promise<void> {
  if (spec.authored && !authoredReady(spec.code)) await loadSpecies([spec], { loader })
}

async function loadSpecies(species: SpeciesSpec[], opts: LoadModelsOptions): Promise<void> {
  const loader = opts.loader ?? browserLoader
  const total = modelSteps(species)
  let done = 0
  opts.onProgress?.(done, total)
  const step = () => { done++; opts.onProgress?.(done, total) }
  await Promise.all(species.flatMap(spec => [
    loader.model(spec).then(scene => { storeAuthored(spec.code, authoredBuilt(spec, scene)); step() }),
    ...spec.authored!.versions.map(v => loader.maps(spec, v).then(m => { storeAuthoredMaps(spec.code, v, m); step() })),
  ]))
}
```

In `src/birds/prewarm.ts`, replace:

```ts
import { castAtlases, prepaint, type PrepaintOptions } from './paint/prepaint'

```

with:

```ts
import { castAtlases, prepaint, type PrepaintOptions } from './paint/prepaint'
import { castModels, loadModels, modelSteps, type ModelLoader } from './models'

```

In `src/birds/prewarm.ts`, replace:

```ts
  build?: () => void
}
```

with:

```ts
  build?: () => void
  /** fetches the authored birds' models and maps (models.ts: the browser's, by default) */
  models?: ModelLoader
}
```

In `src/birds/prewarm.ts`, replace:

```ts
 * Gets the cast's birds ready behind the title card. It paints every atlas the cast needs (`prepaint`, in the worker)
 * and, meanwhile, places every folded wing on the main thread (`placeFolds`). When both are done, it yields two frames,
 * so one draws the count, and runs `build`.
 *
 * `onProgress` gets one count over all of it: the atlases still to paint, the species, and the build. The total is set
 * before anything starts, so it never changes, and the count reaches it once, when the build is done. Rejects if any
```

with:

```ts
 * Gets the cast's birds ready behind the title card. It paints every atlas the cast needs (`prepaint`, in the worker)
 * and, meanwhile, places every folded wing on the main thread (`placeFolds`) and loads every authored bird's model and
 * maps (`loadModels`). When all are done, it yields two frames, so one draws the count, and runs `build`.
 *
 * `onProgress` gets one count over all of it: the atlases still to paint, the species, the models and their maps, and
 * the build. The total is set
 * before anything starts, so it never changes, and the count reaches it once, when the build is done. Rejects if any
```

In `src/birds/prewarm.ts`, replace:

```ts
  const atlases = { done: 0, total: 0 }
  const built = { done: 0, total: opts.build ? 1 : 0 }
  const report = () => opts.onProgress?.(
    atlases.done + folds.done + built.done,
    atlases.total + folds.total + built.total,
  )
```

with:

```ts
  const atlases = { done: 0, total: 0 }
  const models = { done: 0, total: modelSteps(castModels(loc, specs)) }
  const built = { done: 0, total: opts.build ? 1 : 0 }
  const report = () => opts.onProgress?.(
    atlases.done + folds.done + models.done + built.done,
    atlases.total + folds.total + models.total + built.total,
  )
```

In `src/birds/prewarm.ts`, replace:

```ts
  const placing = placeFolds(loc, { next, specs, onProgress: done => { folds.done = done; report() } })
  await Promise.all([painting, placing])
  if (!opts.build) return
```

with:

```ts
  const placing = placeFolds(loc, { next, specs, onProgress: done => { folds.done = done; report() } })
  const loading = loadModels(loc, { specs, loader: opts.models, onProgress: done => { models.done = done; report() } })
  await Promise.all([painting, placing, loading])
  if (!opts.build) return
```

In `src/viewer/main.ts`, replace:

```ts
import { parseState, stateHash, FIELD_VIEWS, VIEWS, type ViewerState } from './state'

```

with:

```ts
import { parseState, stateHash, FIELD_VIEWS, VIEWS, type ViewerState } from './state'
import { ensureAuthored } from '../birds/models'
import { isDetailed } from '../birds/spec'

```

In `src/viewer/main.ts`, replace:

```ts

function build(): void {
  for (const s of slots) { scene.remove(s.model.group); if (s.skeleton) scene.remove(s.skeleton); s.model.dispose() }
```

with:

```ts

/** Build the pair, once any authored bird among them has loaded its model and maps. */
function build(): void {
  Promise.all([state.a, state.b].map(c => ensureAuthored(getSpec(c)))).then(buildNow).catch(err => console.error(err))
}

function buildNow(): void {
  for (const s of slots) { scene.remove(s.model.group); if (s.skeleton) scene.remove(s.skeleton); s.model.dispose() }
```

In `src/viewer/main.ts`, replace:

```ts

const species: [string, string][] = Object.values(SPECIES).map(s => [s.code, `${s.commonName}${s.detail ? ' *' : ''}`])
const variants = (code: string): [string, string][] => [['', '(default)'], ...Object.keys(getSpec(code).variants).map(v => [v, v] as [string, string])]
```

with:

```ts

const species: [string, string][] = Object.values(SPECIES).map(s => [s.code, `${s.commonName}${isDetailed(s) ? ' *' : ''}`])
const variants = (code: string): [string, string][] => [['', '(default)'], ...Object.keys(getSpec(code).variants).map(v => [v, v] as [string, string])]
```

- [ ] **Step 3: See it pass**

Run: `npx vitest run src/birds/models.test.ts src/birds/prewarm.test.ts`
Expected: 13 tests pass.

Run: `npm test && npx tsc --noEmit -p .`
Expected: every test passes (1259). No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/birds src/viewer
git commit -m "feat: authored birds load at startup with the atlases, each model and version's maps counted on the title card; the viewer loads one before building it (Task 3)"
```

---

### Task 4: Perching: drying the wings and propping the tail

**Files:**
- Create: `src/birds/detail/perch.test.ts`
- Modify: `src/birds/model.ts`, `src/birds/detail/spec.ts`, `src/birds/detail/build.ts`, `src/birds/detail/fixture.ts`,
  `src/viewer/state.ts`, `src/viewer/main.ts`, `src/viewer/state.test.ts`

**Interfaces:**
- Consumes: the flight wing (`flyWings`), `tailTipNow`, Task 2's test bird.
- Produces: `PoseState.dry`, `PoseState.tailProp`; `flight.dry`; `ViewerState.dry`, `ViewerState.prop`.

- **`dry`** (0..1) holds a flight wing out in the species' drying pose, `flight.dry`: the inner wing swept back `sweep`
  degrees about the vertical and raised `shoulder` about the body's axis, the hand swept `handSweep` further and turned
  `hand` (negative: hanging). It opens the flight wing as `wingSpread` does; a beat at a small `wingSpread` adds a slow
  flap. A species without `flight.dry` ignores it.
- **`tailProp`** (0..1) turns the tail down from where `tailTilt` puts it toward resting its tip on y = 0, the perch under
  the feet, once the body has turned. A tail too short to reach points straight down.
- A perched bird is an amphibious one at `afloat` 0, its body raised by a negative `lean.x`; the legs hang from the root,
  so the feet stay planted.
- The viewer gets a **dry the wings** and a **tail propped** slider, and a lean that raises the body to -0.9.

- [ ] **Step 1: The failing tests**

In `src/birds/detail/fixture.ts`, replace:

```ts
    flight: { beat: { shoulder: 40, lift: 5, hand: 20, lag: 0.1 }, glide: { shoulder: 3, hand: -5 } },
```

with:

```ts
    flight: {
      beat: { shoulder: 40, lift: 5, hand: 20, lag: 0.1 }, glide: { shoulder: 3, hand: -5 },
      dry: { shoulder: 30, sweep: 25, hand: -60, handSweep: 20 },
    },
```

Create `src/birds/detail/perch.test.ts`:

```ts
import * as THREE from 'three'
import { buildDetailedBird, type DetailedBirdModel } from './build'
import { loadAuthoredForTest, TEST_BIRD_GLB } from './authored.testkit'
import { TEST_AUTHORED_SPEC, TEST_GOOSE_SPEC, TEST_SWIM_SPEC, TEST_SWIM_DETAIL } from './fixture'
import { tailTipNow } from './measure'
import { parseSpeciesSpec } from '../spec'
import { defaultPose, type PoseState } from '../model'

const posed = (over: Partial<PoseState> = {}): PoseState => ({ ...defaultPose(), ...over })
const at = (m: DetailedBirdModel, name: string) => {
  m.group.updateMatrixWorld(true)
  return m.mesh.skeleton.bones.find(b => b.name === name)!.getWorldPosition(new THREE.Vector3())
}
/** a perched bird: on its feet, its body raised 40 degrees */
const PERCHED = { afloat: 0, lean: new THREE.Vector3(-0.7, 0, 0) }

beforeAll(() => loadAuthoredForTest(TEST_AUTHORED_SPEC, TEST_BIRD_GLB))

describe('drying the wings (PoseState.dry)', () => {
  it('holds the flight wings out: the wrists raised above the shoulders, the hands hanging below the wrists', () => {
    const m = buildDetailedBird(TEST_AUTHORED_SPEC)
    m.pose(posed({ ...PERCHED, dry: 1 }))
    const tip = m.anatomy.flightWing!.tip.clone().sub(m.anatomy.flightWing!.wrist)
    const hand = m.mesh.skeleton.bones.find(b => b.name === 'handR')!
    const tipNow = tip.applyMatrix4(hand.matrixWorld)
    for (const side of ['L', 'R']) expect(at(m, `hand${side}`).y).toBeGreaterThan(at(m, `wing${side}`).y)
    expect(tipNow.y).toBeLessThan(at(m, 'handR').y)
    // the right wing on +z, the left mirroring it
    expect(at(m, 'handR').z).toBeCloseTo(-at(m, 'handL').z, 6)
    expect(at(m, 'handR').y).toBeCloseTo(at(m, 'handL').y, 6)
    // swept back from straight out
    expect(at(m, 'handR').x).toBeLessThan(at(m, 'wingR').x)
  })
  it('shows the spread wing and hides the folded one while drying, and folds again at 0', () => {
    const m = buildDetailedBird(TEST_AUTHORED_SPEC)
    const bone = (n: string) => m.mesh.skeleton.bones.find(b => b.name === n)!
    m.pose(posed({ dry: 1 }))
    expect(bone('wingFoldR').scale.x).toBeLessThan(0.01)
    expect(bone('wingR').scale.x).toBe(1)
    m.pose(posed({ dry: 0 }))
    expect(bone('wingFoldR').scale.x).toBe(1)
    expect(bone('wingR').scale.x).toBeLessThan(0.01)
  })
  it('flaps slowly while drying: a beat at a small spread moves the held wing', () => {
    const m = buildDetailedBird(TEST_AUTHORED_SPEC)
    m.pose(posed({ dry: 1, wingSpread: 0.2, wingPhase: 0.25 }))
    const up = at(m, 'handR').y
    m.pose(posed({ dry: 1, wingSpread: 0.2, wingPhase: 0.75 }))
    expect(up - at(m, 'handR').y).toBeGreaterThan(0.01)
  })
  it('is ignored by a bird whose flight wing has no drying pose', () => {
    const flight = {
      span: 0.4, outline: [[0, 0.05, -0.09], [0.45, 0.06, -0.08], [1, -0.02, -0.04]] as [number, number, number][], wrist: 0.45,
      beat: { shoulder: 35, lift: 5, hand: 25, lag: 0.15 }, glide: { shoulder: 4, hand: -8 },
    }
    const m = buildDetailedBird(parseSpeciesSpec({ ...TEST_SWIM_SPEC, detail: { ...TEST_SWIM_DETAIL, flight } }))
    m.pose(posed({ dry: 1 }))
    expect(m.mesh.skeleton.bones.find(b => b.name === 'wingFoldR')!.scale.x).toBe(1)
  })
})

describe('propping the tail (PoseState.tailProp)', () => {
  it('rests a raised body\'s tail tip on the perch under the feet', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    m.pose(posed({ ...PERCHED }))
    const free = tailTipNow(m).y
    m.pose(posed({ ...PERCHED, tailProp: 1 }))
    expect(tailTipNow(m).y).toBeCloseTo(0, 4)
    expect(free).not.toBeCloseTo(0, 2)
    // the tip stays behind the hips: the tail turns down, not round
    expect(tailTipNow(m).x).toBeLessThan(at(m, 'tibiaR').x)
  })
  it('turns part of the way at part of a prop, and not at all at 0', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    const tail = () => m.mesh.skeleton.bones.find(b => b.name === 'tail')!.rotation.z
    m.pose(posed({ ...PERCHED }))
    const none = tail()
    m.pose(posed({ ...PERCHED, tailProp: 1 }))
    const full = tail()
    m.pose(posed({ ...PERCHED, tailProp: 0.5 }))
    expect(tail()).toBeCloseTo((none + full) / 2, 9)
    m.pose(posed({ ...PERCHED, tailProp: 0 }))
    expect(tail()).toBe(none)
  })
  it('points a tail too short to reach the perch straight down (the authored test bird\'s, 7 cm from 8 cm up)', () => {
    const m = buildDetailedBird(TEST_AUTHORED_SPEC)
    m.pose(posed({ ...PERCHED, tailProp: 1 }))
    const root = at(m, 'tail'), tip = tailTipNow(m)
    expect(tip.x).toBeCloseTo(root.x, 6)
    expect(tip.y).toBeGreaterThan(0)
    expect(root.y - tip.y).toBeCloseTo(m.anatomy.tailTip.distanceTo(m.anatomy.tailRoot), 4)
  })
  it('keeps the feet planted on the perch as the body rises', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    m.pose(posed({ afloat: 0 }))
    const toes = at(m, 'toesR')
    m.pose(posed({ ...PERCHED, tailProp: 1 }))
    expect(at(m, 'toesR').distanceTo(toes)).toBeLessThan(1e-9)
  })
})
```

In `src/viewer/state.test.ts`, replace:

```ts
  neck: 0.5, lean: 0, spread: 0, phase: 0, reach: 0, depth: 0, angle: Math.PI / 2, paddle: 0, sink: 0, bob: 0, tail: 0, pitch: 0,
  pouch: 0, glide: 0, raise: 0, flap: false, afloat: 1,
  walk: false, speed: 0.35, water: 0, float: false, see: false, wire: false, skel: false, uv: false, atlas: false, stations: false,
```

with:

```ts
  neck: 0.5, lean: 0, spread: 0, phase: 0, reach: 0, depth: 0, angle: Math.PI / 2, paddle: 0, sink: 0, bob: 0, tail: 0, pitch: 0,
  pouch: 0, glide: 0, raise: 0, flap: false, afloat: 1, dry: 0, prop: 0,
  walk: false, speed: 0.35, water: 0, float: false, see: false, wire: false, skel: false, uv: false, atlas: false, stations: false,
```

In `src/viewer/state.test.ts`, replace:

```ts
    expect(parseState('#pouch=3&glide=-1&raise=500', DEFAULTS)).toMatchObject({ pouch: 1, glide: 0, raise: 80 })
  })
```

with:

```ts
    expect(parseState('#pouch=3&glide=-1&raise=500', DEFAULTS)).toMatchObject({ pouch: 1, glide: 0, raise: 80 })
  })
  it('round-trips the cormorant controls: on its feet, the body raised, the wings held out to dry, the tail propped', () => {
    const s: ViewerState = { ...DEFAULTS, a: 'doccor', afloat: 0, lean: -0.7, dry: 1, prop: 1 }
    expect(parseState(stateHash(s), DEFAULTS)).toEqual(s)
    expect(parseState('#lean=-2&dry=4&prop=-1', DEFAULTS)).toMatchObject({ lean: -0.9, dry: 1, prop: 0 })
  })
```

Run: `npx vitest run src/birds/detail/perch.test.ts src/viewer/state.test.ts`
Expected: FAIL: the drying tests find the folded wing still showing and the propped tail where `tailTilt` left it; the
viewer's new test finds `dry` and `prop` dropped from the link.

- [ ] **Step 2: The pose, the schema, and the viewer**

In `src/birds/detail/build.ts`, replace:

```ts
   * about the wrist, behind it by its lag. A glide holds both still at the glide's angles. Positive angles are up.
   */
  function flyWings(st: PoseState, spread: number) {
    const F = detail!.flight!
```

with:

```ts
   * about the wrist, behind it by its lag. A glide holds both still at the glide's angles. Positive angles are up.
   * Drying (`dry`) adds the species' drying pose: each part swept back about the vertical, then raised or hung about
   * the body's axis; a beat at a small `spread` flaps it slowly.
   */
  function flyWings(st: PoseState, spread: number, dry: number) {
    const F = detail!.flight!
```

In `src/birds/detail/build.ts`, replace:

```ts
    const beatH = F.beat.hand * Math.sin(phase - F.beat.lag * Math.PI * 2)
    const shoulder = THREE.MathUtils.degToRad(beatS + (F.glide.shoulder - beatS) * glide) * spread
    const hand = THREE.MathUtils.degToRad(beatH + (F.glide.hand - beatH) * glide) * spread
    bones.wingL.rotation.x = shoulder; bones.wingR.rotation.x = -shoulder
    bones.handL.rotation.x = hand; bones.handR.rotation.x = -hand
  }
```

with:

```ts
    const beatH = F.beat.hand * Math.sin(phase - F.beat.lag * Math.PI * 2)
    const D = F.dry ?? { shoulder: 0, sweep: 0, hand: 0, handSweep: 0 }
    const deg = THREE.MathUtils.degToRad
    const shoulder = deg(beatS + (F.glide.shoulder - beatS) * glide) * spread + deg(D.shoulder) * dry
    const hand = deg(beatH + (F.glide.hand - beatH) * glide) * spread + deg(D.hand) * dry
    bones.wingL.rotation.x = shoulder; bones.wingR.rotation.x = -shoulder
    bones.handL.rotation.x = hand; bones.handR.rotation.x = -hand
    // swept back: the left wing (on -z) turns positive about y, the right negative
    bones.wingL.rotation.y = deg(D.sweep) * dry; bones.wingR.rotation.y = -deg(D.sweep) * dry
    bones.handL.rotation.y = deg(D.handSweep) * dry; bones.handR.rotation.y = -deg(D.handSweep) * dry
  }

  const tailVec = anatomy.tailTip.clone().sub(anatomy.tailRoot)
  const tR = new THREE.Vector3(), tT = new THREE.Vector3()
  /**
   * The tail turned down (`prop` of the way) until its tip rests on y = 0, the ground or perch under the feet, once
   * the body has turned: a raised body's tail reaches down to the perch. A tail too short to reach turns as far as it
   * can, straight down.
   */
  function propTail(prop: number) {
    group.updateMatrixWorld(true)
    toGroup.copy(group.matrixWorld).invert()
    inGroup(bones.tail, tR)
    tT.copy(tailVec).applyMatrix4(bones.tail.matrixWorld).applyMatrix4(toGroup).sub(tR)
    const len = Math.hypot(tT.x, tT.y)
    if (len < 1e-9) return
    // the side view's angle of the tail now and with its tip on y = 0, both taken in the back half (pointing back)
    const now = Math.atan2(tT.y, tT.x)
    const want = Math.PI - Math.asin(THREE.MathUtils.clamp(-tR.y / len, -1, 1))
    let turn = want - (now < 0 ? now + 2 * Math.PI : now)
    turn = Math.atan2(Math.sin(turn), Math.cos(turn))
    bones.tail.rotation.z += prop * turn
  }
```

In `src/birds/detail/build.ts`, replace:

```ts
    bones.tail.rotation.z = -st.tailTilt
    // wings: folded shell at rest, the spread planform once the wings open
    const spread = THREE.MathUtils.clamp(st.wingSpread, 0, 1)
    const open = spread > 0.05
    for (const b of [bones.wingFoldL, bones.wingFoldR]) b.scale.setScalar(open ? HIDDEN : 1)
    for (const b of [bones.wingL, bones.wingR]) b.scale.setScalar(open ? 1 : HIDDEN)
    if (flightWing) flyWings(st, spread)
    else {
```

with:

```ts
    bones.tail.rotation.z = -st.tailTilt
    const prop = THREE.MathUtils.clamp(st.tailProp, 0, 1)
    if (prop > 0) propTail(prop)
    // wings: folded shell at rest, the spread planform once the wings open (to fly, or to dry)
    const spread = THREE.MathUtils.clamp(st.wingSpread, 0, 1)
    const dry = flightWing && detail!.flight?.dry ? THREE.MathUtils.clamp(st.dry, 0, 1) : 0
    const open = spread > 0.05 || dry > 0.05
    for (const b of [bones.wingFoldL, bones.wingFoldR]) b.scale.setScalar(open ? HIDDEN : 1)
    for (const b of [bones.wingL, bones.wingR]) b.scale.setScalar(open ? 1 : HIDDEN)
    if (flightWing) flyWings(st, spread, dry)
    else {
```

In `src/birds/detail/spec.ts`, replace:

```ts
   * - `glide`: the wing held still, degrees: the inner wing's angle above level, and the hand's from the inner wing's.
   * Painted as 'wingSpread' above and 'wingUnder' below: s along the span, t from the leading edge (0) to the trailing.
```

with:

```ts
   * - `glide`: the wing held still, degrees: the inner wing's angle above level, and the hand's from the inner wing's.
   * - `dry`: the wing held out to dry (a cormorant's), degrees: the inner wing swept `sweep` back and raised `shoulder`
   *   above level, the hand swept `handSweep` further back and turned `hand` from the inner wing's line (negative:
   *   hanging). PoseState.dry holds it; a bird without it ignores PoseState.dry.
   * Painted as 'wingSpread' above and 'wingUnder' below: s along the span, t from the leading edge (0) to the trailing.
```

In `src/birds/detail/spec.ts`, replace:

```ts
    glide: z.object({ shoulder: z.number().min(-30).max(30), hand: z.number().min(-45).max(45) }),
  }).optional(),
```

with:

```ts
    glide: z.object({ shoulder: z.number().min(-30).max(30), hand: z.number().min(-45).max(45) }),
    dry: z.object({
      shoulder: z.number().min(-30).max(80), sweep: z.number().min(0).max(80),
      hand: z.number().min(-90).max(30), handSweep: z.number().min(0).max(90),
    }).optional(),
  }).optional(),
```

In `src/birds/detail/spec.ts`, replace:

```ts
 *   joints against it.
 * - `flight`: a flight wing's wingbeat and glide; its planform is the model's.
 */
```

with:

```ts
 *   joints against it.
 * - `flight`: a flight wing's wingbeat, glide, and drying pose; its planform is the model's.
 */
```

In `src/birds/detail/spec.ts`, replace:

```ts
  waddle: detailSchema.shape.waddle,
  flight: z.object({ beat: detailSchema.shape.flight.unwrap().shape.beat, glide: detailSchema.shape.flight.unwrap().shape.glide }).optional(),
  sources: detailSchema.shape.sources,
```

with:

```ts
  waddle: detailSchema.shape.waddle,
  flight: z.object({
    beat: detailSchema.shape.flight.unwrap().shape.beat, glide: detailSchema.shape.flight.unwrap().shape.glide,
    dry: detailSchema.shape.flight.unwrap().shape.dry,
  }).optional(),
  sources: detailSchema.shape.sources,
```

In `src/birds/model.ts`, replace:

```ts
  glide: number
}
```

with:

```ts
  glide: number
  /**
   * 0 folded .. 1 held out to dry: a flight wing raised and opened in the species' drying pose (flight.dry, a
   * cormorant's), wingPhase and wingSpread adding a slow flap to it; a bird without one ignores it
   */
  dry: number
  /**
   * 0 .. 1: how far the tail turns down from where tailTilt puts it toward resting its tip on the ground or perch under
   * the feet (y = 0), as a prop; a perched cormorant's, its body raised
   */
  tailProp: number
}
```

In `src/birds/model.ts`, replace:

```ts
    paddle: 0, paddlePhase: 0, reachDepth: 0, reachAngle: Math.PI / 2, headPitch: 0, afloat: 1, pouch: 0, glide: 0,
  }
```

with:

```ts
    paddle: 0, paddlePhase: 0, reachDepth: 0, reachAngle: Math.PI / 2, headPitch: 0, afloat: 1, pouch: 0, glide: 0,
    dry: 0, tailProp: 0,
  }
```

In `src/viewer/main.ts`, replace:

```ts
  neck: 0.5, lean: 0, spread: 0, phase: 0, reach: 0, depth: 0, angle: Math.PI / 2, paddle: 0, sink: 0, bob: 0, tail: 0, pitch: 0,
  pouch: 0, glide: 0, raise: 0, flap: false, afloat: 1,
  walk: false, speed: 0.35, water: 0, float: false, see: false, wire: false, skel: false, uv: false, atlas: false, stations: false,
```

with:

```ts
  neck: 0.5, lean: 0, spread: 0, phase: 0, reach: 0, depth: 0, angle: Math.PI / 2, paddle: 0, sink: 0, bob: 0, tail: 0, pitch: 0,
  pouch: 0, glide: 0, raise: 0, flap: false, afloat: 1, dry: 0, prop: 0,
  walk: false, speed: 0.35, water: 0, float: false, see: false, wire: false, skel: false, uv: false, atlas: false, stations: false,
```

In `src/viewer/main.ts`, replace:

```ts
slider(pose, 'head pitch, deg', THREE.MathUtils.radToDeg(state.pitch), v => set({ pitch: THREE.MathUtils.degToRad(v) }), -30, 80, 1)
slider(pose, 'lean (tip-up 1.5)', state.lean, v => set({ lean: v }), 0, 1.6, 0.01)
slider(pose, 'tail up', state.tail, v => set({ tail: v }), -0.5, 1, 0.01)
```

with:

```ts
slider(pose, 'head pitch, deg', THREE.MathUtils.radToDeg(state.pitch), v => set({ pitch: THREE.MathUtils.degToRad(v) }), -30, 80, 1)
slider(pose, 'lean (tip-up 1.5, perched -0.7)', state.lean, v => set({ lean: v }), -0.9, 1.6, 0.01)
slider(pose, 'tail up', state.tail, v => set({ tail: v }), -0.5, 1, 0.01)
```

In `src/viewer/main.ts`, replace:

```ts
slider(pose, 'glide (a flight wing)', state.glide, v => set({ glide: v }))
slider(pose, 'raise, m', state.raise, v => set({ raise: v }), 0, 80, 1)
```

with:

```ts
slider(pose, 'glide (a flight wing)', state.glide, v => set({ glide: v }))
slider(pose, 'dry the wings (a flight wing)', state.dry, v => set({ dry: v }))
slider(pose, 'tail propped', state.prop, v => set({ prop: v }))
slider(pose, 'raise, m', state.raise, v => set({ raise: v }), 0, 80, 1)
```

In `src/viewer/main.ts`, replace:

```ts
    reachDepth: state.depth, reachAngle: state.angle, paddle: state.paddle, paddlePhase, headBob: state.bob, tailTilt: state.tail,
    headPitch: state.pitch, afloat: state.afloat, pouch: state.pouch, glide: state.glide,
    strideDistance: stride, gait: state.walk ? 1 : 0,
```

with:

```ts
    reachDepth: state.depth, reachAngle: state.angle, paddle: state.paddle, paddlePhase, headBob: state.bob, tailTilt: state.tail,
    headPitch: state.pitch, afloat: state.afloat, pouch: state.pouch, glide: state.glide, dry: state.dry, tailProp: state.prop,
    strideDistance: stride, gait: state.walk ? 1 : 0,
```

In `src/viewer/state.ts`, replace:

```ts
  field: FieldView
  /** lean is the body's pitch, radians: a peck's 0.8, a dabbler's tip-up about 1.5 */
  neck: number; lean: number; spread: number; phase: number; reach: number
```

with:

```ts
  field: FieldView
  /** lean is the body's pitch, radians: a peck's 0.8, a dabbler's tip-up about 1.5; negative raises it (a perched cormorant's -0.7) */
  neck: number; lean: number; spread: number; phase: number; reach: number
```

In `src/viewer/state.ts`, replace:

```ts
  pouch: number; glide: number
  /** how high the birds are lifted off the ground, metres: a flock crosses 40-80 m up */
```

with:

```ts
  pouch: number; glide: number
  /** a flight wing held out to dry, 0 folded .. 1 (a cormorant's), and the tail propped on the perch, 0 .. 1 */
  dry: number; prop: number
  /** how high the birds are lifted off the ground, metres: a flock crosses 40-80 m up */
```

In `src/viewer/state.ts`, replace:

```ts
const NUMBERS = {
  neck: [0, 1], lean: [0, 1.6], spread: [0, 1], phase: [0, 1], reach: [0, 1], speed: [0.05, 2], water: [0, 0.4],
  depth: [-0.4, 0.3], angle: [0, Math.PI / 2], paddle: [0, 1], sink: [0, 0.15], bob: [-0.2, 0.2], tail: [-0.5, 1],
  pitch: [-0.5, 1.4], afloat: [0, 1], pouch: [0, 1], glide: [0, 1], raise: [0, 80],
} as const satisfies Record<string, readonly [number, number]>
```

with:

```ts
const NUMBERS = {
  neck: [0, 1], lean: [-0.9, 1.6], spread: [0, 1], phase: [0, 1], reach: [0, 1], speed: [0.05, 2], water: [0, 0.4],
  depth: [-0.4, 0.3], angle: [0, Math.PI / 2], paddle: [0, 1], sink: [0, 0.15], bob: [-0.2, 0.2], tail: [-0.5, 1],
  pitch: [-0.5, 1.4], afloat: [0, 1], pouch: [0, 1], glide: [0, 1], raise: [0, 80], dry: [0, 1], prop: [0, 1],
} as const satisfies Record<string, readonly [number, number]>
```

- [ ] **Step 3: See it pass, and every shipped bird unchanged**

Run: `npx vitest run src/birds/detail/perch.test.ts src/viewer/state.test.ts`
Expected: 21 tests pass.

Run: `npm test && npx tsc --noEmit -p .`
Expected: every test passes (1268), the fingerprints among them. No type errors.

No shipped bird has a `flight.dry`, so the drying pose is first looked at on the cormorant, in Task 8.

- [ ] **Step 4: Commit**

```bash
git add src/birds src/viewer
git commit -m "feat: a perched detailed bird: PoseState.dry holds a flight wing out in the species' drying pose (flight.dry), PoseState.tailProp rests the tail's tip on the perch under the feet; the viewer's controls and a lean that raises the body (Task 4)"
```

---

### Task 5: The stumps

**Files:**
- Create: `src/world/stumps.test.ts`
- Modify: `src/world/trees.ts`, `src/birds/spawn.ts`, `src/main.tsx`, `data/locations/lake.json`,
  `src/birds/spawn.test.ts`, `src/location/zoneTerrain.test.ts`

**Interfaces:**
- Consumes: `createSnag`'s look, the terrain's `surface.sample`, the spawner's perches.
- Produces: `STUMPS`, `createStumps`; `SpawnDeps.perches` lists; zones `stumps`, `cormorant-water`.

Four drowned stumps stand in open water left of centre round (-14, -30), 33 m from the vantage, in the telescope's
range, away from the pelicans' far water and the near water's ducks. Each is a weathered trunk from the bed (2.4-3 m
down) to 0.55-1.4 m above the water, flat-topped where it broke, grey like the snag; the two tallest carry a broken side
branch. Each top is a perch, more than a metre from the next. The `stumps` zone's perches are the list; the spawner hands
each bird of the zone its own. `cormorant-water` is the square of open water round them, a metre deep or more all over.
The stumps are on layer 0, so the water reflects them.

- [ ] **Step 1: The failing tests**

In `src/birds/spawn.test.ts`, replace:

```ts
    expect(ripples.rings.map(r => r.size)).toEqual([STYLES.dowitcher.ripple.size])
  })
})

```

with:

```ts
    expect(ripples.rings.map(r => r.size)).toEqual([STYLES.dowitcher.ripple.size])
  })
})

describe('perches from a list (the stumps)', () => {
  const deps = (perches: Record<string, [number, number, number] | [number, number, number][]>) => ({
    registry: new BirdRegistry(), wind: new Wind({ direction: 0, strength: 0.3, gustiness: 0.5 }), ground: () => -1,
    ripples: new RippleBuffer(), seed: 3, perches,
  })
  const tops: [number, number, number][] = [[1, 0.9, 3], [2.7, 1.4, 3.8], [-0.4, 0.55, 4.3]]
  it('gives each bird of the zone its own perch, in the list\'s order', () => {
    const d = deps({ snag: tops })
    const world = spawnCast(loc([{ species: 'rewbla', behavior: 'perch', zone: 'snag', count: 3, plumage: 'male' }]), d)
    world.update(0.1, d.wind)
    const at = d.registry.all().map(b => `${b.model.group.position.x.toFixed(2)},${b.model.group.position.z.toFixed(2)}`)
    expect(at.sort()).toEqual(tops.map(([x, , z]) => `${x.toFixed(2)},${z.toFixed(2)}`).sort())
  })
  it('refuses more birds than perches', () => {
    expect(() => spawnCast(loc([{ species: 'rewbla', behavior: 'perch', zone: 'snag', count: 4, plumage: 'male' }]), deps({ snag: tops })))
      .toThrow(/more birds than its 3 perches/)
  })
  it('still shares one perch among every bird of a zone that has only one', () => {
    const d = deps({ snag: [1, 2, 3] })
    expect(() => spawnCast(loc([{ species: 'rewbla', behavior: 'perch', zone: 'snag', count: 2, plumage: 'male' }]), d)).not.toThrow()
  })
})

```

In `src/location/zoneTerrain.test.ts`, replace:

```ts
import type { Vec2 } from './schema'

```

with:

```ts
import type { Vec2 } from './schema'
import { STUMPS } from '../world/trees'

```

In `src/location/zoneTerrain.test.ts`, replace:

```ts

  it('the reeds zone matches the rendered reed bed bounds', () => {
```

with:

```ts

  it('stands the stumps the cormorants perch on in water, and keeps the water round them deep enough to dive in, all over', () => {
    const stumps = loc.zones['stumps']!
    expect(stumps.kind).toBe('point')
    if (stumps.kind !== 'point') return
    for (const s of STUMPS) expect(heightfield.sample(stumps.position[0] + s.dx, stumps.position[2] + s.dz)).toBeLessThan(-1)
    const water = loc.zones['cormorant-water']!
    expect(water.kind).toBe('polygon')
    if (water.kind !== 'polygon') return
    // a valley lake 1-5 m deep is fished to the bottom (research 7.1): a metre at least, so a dive goes under
    for (const [x, z] of samplePolygon(water.points)) expect(heightfield.sample(x, z), `(${x}, ${z})`).toBeLessThan(-1)
    // within a few metres of the stumps, so the fisher is seen from where the others perch
    const [cx, , cz] = stumps.position
    for (const [x, z] of water.points) expect(Math.hypot(x - cx, z - cz)).toBeLessThan(12)
  })
  it('the reeds zone matches the rendered reed bed bounds', () => {
```

Create `src/world/stumps.test.ts`:

```ts
import * as THREE from 'three'
import { createStumps, STUMPS } from './trees'

describe('the stumps', () => {
  const ground = (x: number, z: number) => -2.5 - 0.01 * x - 0.01 * z
  const { object, perches } = createStumps([-14, 0, -30], ground)
  it('gives one perch per stump, on its top, above the water', () => {
    expect(perches).toHaveLength(STUMPS.length)
    perches.forEach((p, i) => {
      expect(p.x).toBeCloseTo(-14 + STUMPS[i]!.dx, 9)
      expect(p.z).toBeCloseTo(-30 + STUMPS[i]!.dz, 9)
      expect(p.y).toBe(STUMPS[i]!.top)
      expect(p.y).toBeGreaterThan(0.4)
    })
  })
  it('stands each one on the bed, its top where its perch is', () => {
    object.updateMatrixWorld(true)
    const trunks = object.children.slice()
    perches.forEach(p => {
      const trunk = trunks.find(t => Math.hypot(t.position.x - p.x, t.position.z - p.z) < 1e-9)!
      const box = new THREE.Box3().setFromObject(trunk)
      expect(box.max.y).toBeCloseTo(p.y, 6)
      expect(box.min.y).toBeCloseTo(ground(p.x, p.z), 6)
    })
  })
  it('keeps two cormorants a body width apart or more, as they perch on a shared snag', () => {
    for (let i = 0; i < perches.length; i++) for (let j = i + 1; j < perches.length; j++) {
      expect(Math.hypot(perches[i]!.x - perches[j]!.x, perches[i]!.z - perches[j]!.z)).toBeGreaterThan(1)
    }
  })
})
```

Run: `npx vitest run src/world/stumps.test.ts src/birds/spawn.test.ts src/location/zoneTerrain.test.ts`
Expected: FAIL: `createStumps` and `STUMPS` don't exist, the zones are missing, and a perch list is taken as a point.

- [ ] **Step 2: The stumps, the zones, and the perches**

In `data/locations/lake.json`, replace:

```json
    "snag":       { "kind": "point",   "position": [22, 0, -48] },
    "reed-perch":   { "kind": "point", "position": [-8, 1.9, -5] },
```

with:

```json
    "snag":       { "kind": "point",   "position": [22, 0, -48] },
    "stumps":     { "kind": "point",   "position": [-14, 0, -30] },
    "cormorant-water": { "kind": "polygon", "points": [[-22, -24], [-6, -24], [-6, -34], [-22, -34]] },
    "reed-perch":   { "kind": "point", "position": [-8, 1.9, -5] },
```

In `src/birds/spawn.ts`, replace:

```ts
  events?: SpawnEvents
  /** world-space perch points by zone name; point zones not listed here perch at their own position */
  perches?: Record<string, Vec3>
}
```

with:

```ts
  events?: SpawnEvents
  /**
   * world-space perch points by zone name: one, which every bird of the zone shares, or a list, from which each bird
   * of the zone takes the next of its own (the stumps'); point zones not listed here perch at their own position
   */
  perches?: Record<string, Vec3 | Vec3[]>
}
```

In `src/birds/spawn.ts`, replace:

```ts
  const flocks: LiveFlock[] = []

```

with:

```ts
  const flocks: LiveFlock[] = []
  /** how many birds have taken a perch from each zone's list */
  const taken = new Map<string, number>()
  const perchFor = (name: string, fallback: Vec3): Vec3 => {
    const p = deps.perches?.[name]
    if (!p) return fallback
    if (!Array.isArray(p[0])) return p as Vec3
    const list = p as Vec3[], k = taken.get(name) ?? 0
    if (k >= list.length) throw new Error(`${name}: more birds than its ${list.length} perches`)
    taken.set(name, k + 1)
    return list[k]!
  }

```

In `src/birds/spawn.ts`, replace:

```ts
    const point = zone.kind === 'point'
    const perch: Vec3 | undefined = point ? (deps.perches?.[ind.zone] ?? zone.position) : undefined
    const model = hasSpec(ind.species)
```

with:

```ts
    const point = zone.kind === 'point'
    const perch: Vec3 | undefined = point ? perchFor(ind.zone, zone.position) : undefined
    const model = hasSpec(ind.species)
```

In `src/main.tsx`, replace:

```tsx
import { createReeds, createGrass } from './world/vegetation'
import { createTree, createSnag, createTreeLine } from './world/trees'
import { BirdRegistry } from './birds/registry'
```

with:

```tsx
import { createReeds, createGrass } from './world/vegetation'
import { createTree, createSnag, createStumps, createTreeLine } from './world/trees'
import { BirdRegistry } from './birds/registry'
```

In `src/main.tsx`, replace:

```tsx
}
const perches: Record<string, Vec3> = {}
const snagZone = loc.zones['snag']
```

with:

```tsx
}
const perches: Record<string, Vec3 | Vec3[]> = {}
const snagZone = loc.zones['snag']
```

In `src/main.tsx`, replace:

```tsx
  perches['snag'] = [snag.perchPoint.x, snag.perchPoint.y, snag.perchPoint.z]
}
```

with:

```tsx
  perches['snag'] = [snag.perchPoint.x, snag.perchPoint.y, snag.perchPoint.z]
}
const stumpsZone = loc.zones['stumps']
if (stumpsZone?.kind === 'point') {
  const stumps = createStumps(stumpsZone.position, (x, z) => surface.sample(x, z))
  world.scene.add(stumps.object)
  perches['stumps'] = stumps.perches.map(p => [p.x, p.y, p.z] as Vec3)
}
```

In `src/world/trees.ts`, replace:

```ts

/** Layered silhouettes on the far shore that fade into the fog. */
```

with:

```ts

/**
 * Drowned stumps standing in the water, where cormorants perch: each a weathered trunk from the bed (`ground`) up out of
 * the water, flat-topped where it broke, around `center`. `perches` are their tops' middles, one per stump, in STUMPS'
 * order.
 */
export const STUMPS: { dx: number; dz: number; top: number; radius: number }[] = [
  // offsets from the zone's point, metres; the top's height above the water; the trunk's radius at the top
  { dx: 0, dz: 0, top: 0.9, radius: 0.16 },
  { dx: 1.7, dz: 0.8, top: 1.4, radius: 0.2 },
  { dx: -1.4, dz: 1.3, top: 0.55, radius: 0.13 },
  { dx: 0.8, dz: -1.6, top: 1.15, radius: 0.17 },
]

export function createStumps(center: Vec3, ground: (x: number, z: number) => number): { object: THREE.Group; perches: THREE.Vector3[] } {
  const group = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({ color: '#8c8478', roughness: 1, flatShading: true })
  const perches: THREE.Vector3[] = []
  STUMPS.forEach((s, i) => {
    const x = center[0] + s.dx, z = center[2] + s.dz
    const bed = Math.min(ground(x, z), -0.2)
    const height = s.top - bed
    // wider toward the bed; a few sides, as the snag has
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(s.radius, s.radius * 1.5, height, 7), mat)
    trunk.position.set(x, bed + height / 2, z)
    trunk.rotation.y = i * 1.3
    trunk.castShadow = true
    group.add(trunk)
    // a broken-off side branch on the taller two, standing a little out of the trunk below the top
    if (s.top > 1) {
      const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 0.45, 5), mat)
      stub.position.set(x + s.radius * 0.9, s.top - 0.35, z)
      stub.rotation.z = -0.9
      stub.rotation.y = i * 1.3
      group.add(stub)
    }
    perches.push(new THREE.Vector3(x, s.top, z))
  })
  return { object: group, perches }
}

/** Layered silhouettes on the far shore that fade into the fog. */
```

- [ ] **Step 3: See it pass**

Run: `npx vitest run src/world/stumps.test.ts src/birds/spawn.test.ts src/location/zoneTerrain.test.ts`
Expected: 47 tests pass.

Run: `npm test && npx tsc --noEmit -p .`
Expected: every test passes (1275). No type errors.

- [ ] **Step 4: Look at it**

`npm run dev`, Begin, and look left of centre through the telescope: four grey stumps standing out of the water, their
reflections under them. Nothing perches on them until Task 8.

- [ ] **Step 5: Commit**

```bash
git add src/world src/birds/spawn.ts src/birds/spawn.test.ts src/main.tsx data/locations/lake.json src/location/zoneTerrain.test.ts
git commit -m "feat: drowned stumps standing in open water left of centre, each with its perch, the stumps and cormorant-water zones; a point zone's perches may be a list, each bird taking its own (Task 5)"
```

---

### Task 6: The `cormorant` styles

**Files:**
- Create: `src/behavior/cormorant.ts`, `src/behavior/cormorant.test.ts`
- Modify: `src/birds/spec.ts`, `src/behavior/swim.ts`, `src/behavior/perch.ts`

**Interfaces:**
- Consumes: `createSwimmer`, `pickByShare`, `mid`, `between`, `approach`, `ease`, `turnToward`, `perchOf`; Task 4's
  `dry` and `tailProp`.
- Produces: see "Interfaces between the tasks".

On **swim**, a lone bird (research 7.1: 20 of 21 swimming records single), modelled on the grebe's state machine with the
cormorant's own settings:
- **loaf** low in the water, the neck upright and the bill raised as modelled; **cruise** 2-6 m at 0.4 m/s;
- **fishing bouts** of 6-15 dives; after a bout, a rest of minutes;
- each **dive** a slide forward and under over a second, the bill reaching into the water and the body tipping nose down,
  the tail last, with a ring and a splash; one in five after a small leap;
- **under** 15-30 s (22 on average), coming up 3-10 m away in its water, clear of the others (swimming on to a clear
  spot for up to 5 s more if one has surfaced there);
- **up** head first with a ring; one surfacing in six brings a fish: a small one swallowed at once in 1-2 forward-upward
  jerks, a large one (one catch in five) worked in the bill for 3-15 s, then swallowed in 4-5;
- a **pause** of 8-20 s (12 on average) before the next dive.

About two-fifths of its time is under water.

On **perch**, upright on its stump, the body 40 degrees up and the tail propped, the neck drawn in or erect at rest,
changing every few minutes; a **drying session** every 25-45 minutes (the first within 9): a minute standing, turning into
the wind, then 2-4 bouts of spreading, 4-5 minutes in all, folded 10-60 s between, facing the wind within 20 degrees and
now and then flapping the spread wings slowly. It never leaves the perch. About one perched bird in nine is spreading over
a long visit.

- [ ] **Step 1: The failing tests**

Create `src/behavior/cormorant.test.ts`:

```ts
import * as THREE from 'three'
import { createCormorant, createCormorantPerch, CORMORANT, CORMORANT_PERCH, NECK } from './cormorant'
import { createSwim, companyOf } from './swim'
import { createPerch } from './perch'
import { defaultPose, type PoseState } from '../birds/model'
import { makeRng } from '../catalog/rng'
import { pointInPolygon } from '../location/zones'
import type { BehaviorContext, BehaviorController } from './types'

type Pt = [number, number]
// the cormorant's water by the stumps
const water = { kind: 'polygon' as const, points: [[-22, -24], [-6, -24], [-6, -34], [-22, -34]] as Pt[] }
// the lake's wind: toward 240 degrees, a light breeze
const WIND = { dirX: Math.sin(THREE.MathUtils.degToRad(240)), dirZ: -Math.cos(THREE.MathUtils.degToRad(240)), effective: 0.35 }
const ctx = (seed: number, more: Partial<BehaviorContext> = {}): BehaviorContext => ({
  zone: water, rng: makeRng(seed), wind: () => WIND, ground: () => -2.6, foraging: 'cormorant', species: 'doccor', ...more,
})
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

interface Frame { t: number; state: string; x: number; y: number; z: number; h: number; under: boolean; pose: PoseState }
interface Ring { t: number; x: number; z: number; size: number }

/** One fisher, alone or among `others` (fixed swimmers it keeps clear of), for `seconds` at `fps`. */
function fish(seed: number, seconds: number, fps: number, others: BehaviorController[] = []) {
  const rings: Ring[] = [], frames: Frame[] = [], splashes: number[] = []
  let t = 0
  const birds: BehaviorController[] = [...others]
  const bird = createCormorant(ctx(seed, {
    neighbours: () => birds,
    onRipple: (x, z, size) => rings.push({ t, x, z, size: size ?? 1 }),
    onEvent: name => { if (name === 'splash') splashes.push(t) },
  }), -14, -29)
  birds.push(bird)
  const pose = defaultPose()
  for (let i = 0; i < seconds * fps; i++) {
    t = i / fps
    bird.update(1 / fps, pose)
    frames.push({ t, state: bird.state, x: bird.x, y: bird.y, z: bird.z, h: bird.heading, under: !!bird.submerged, pose: { ...pose, lean: pose.lean.clone() } })
  }
  return { frames, rings, splashes, bird }
}
/** runs of consecutive frames where `test` holds; one still going at the last frame ends there (its `end` is the length) */
function runs(frames: Frame[], test: (f: Frame) => boolean) {
  const out: { start: number; end: number; seconds: number }[] = []
  let s = -1
  frames.forEach((f, i) => {
    if (test(f)) { if (s < 0) s = i }
    else if (s >= 0) { out.push({ start: s, end: i, seconds: f.t - frames[s]!.t }); s = -1 }
  })
  if (s >= 0) out.push({ start: s, end: frames.length, seconds: frames.at(-1)!.t - frames[s]!.t })
  return out
}

describe('the cormorant style on swim', () => {
  // an hour each on four seeds at 10 frames a second; twenty minutes at 60
  const hours = [1, 2, 3, 4].map(seed => fish(seed, 3600, 10))
  const fine = fish(9, 1200, 60)
  const dives = hours.flatMap(h => runs(h.frames, f => f.under).filter(r => r.start > 0 && r.end < h.frames.length).map(r => ({ h, ...r })))

  it('is what swim gives a cormorant, and keeps no flock', () => {
    const c = createSwim(ctx(1), -14, -29), pose = defaultPose(), states = new Set<string>()
    for (let i = 0; i < 1800 * 10; i++) { c.update(0.1, pose); states.add(c.state) }
    expect(states).toContain('under')
    expect(companyOf('cormorant').radius).toBe(Infinity)
  })
  it('stays under 22 s on average, 15-30 (research 7.1), longer only to come up clear of another bird', () => {
    expect(dives.length).toBeGreaterThan(150)
    for (const d of dives) {
      expect(d.seconds).toBeGreaterThanOrEqual(15 - 0.25)
      expect(d.seconds).toBeLessThanOrEqual(30 + CORMORANT.under.extra + 0.25)
    }
    expect(mean(dives.map(d => d.seconds))).toBeGreaterThan(20.5)
    expect(mean(dives.map(d => d.seconds))).toBeLessThan(23.5)
  })
  it('pauses 8-20 s on the surface between the dives of a bout, about 12 on average, and fishes in bouts of 6-15', () => {
    const pauses: number[] = [], bouts: number[] = []
    for (const h of hours) {
      const ds = runs(h.frames, f => f.under)
      let n = 1
      for (let i = 1; i < ds.length; i++) {
        const gap = h.frames[ds[i]!.start]!.t - h.frames[ds[i - 1]!.end]!.t
        // a gap longer than any pause and swallow is a rest between bouts
        if (gap < 40) { n++; if (!h.frames.slice(ds[i - 1]!.end, ds[i]!.start).some(f => f.state === 'swallow')) pauses.push(gap) }
        else { bouts.push(n); n = 1 }
      }
    }
    // the pause counts the surfacing and the dive's slide in, about 1.5 s
    for (const p of pauses) { expect(p).toBeGreaterThan(8); expect(p).toBeLessThan(20 + 2) }
    expect(mean(pauses)).toBeGreaterThan(11)
    expect(mean(pauses)).toBeLessThan(15)
    // the first and last bout of an hour are cut short by the hour's ends
    for (const b of bouts.slice(1, -1)) { expect(b).toBeGreaterThanOrEqual(6); expect(b).toBeLessThanOrEqual(15) }
  })
  it('spends about two-fifths of its time under water: fishing in bouts, resting for minutes between', () => {
    for (const h of hours) {
      const share = h.frames.filter(f => f.under).length / h.frames.length
      expect(share).toBeGreaterThan(0.25)
      expect(share).toBeLessThan(0.55)
    }
  })
  it('is hidden only all the way under, and goes under head first, the body tipped forward', () => {
    for (const h of hours) for (const f of h.frames) {
      if (f.under) expect(f.y).toBeLessThanOrEqual(-CORMORANT.entry.depth + 1e-9)
      else expect(f.y).toBeGreaterThan(-CORMORANT.entry.depth)
    }
    // just before it is gone: the bill reaching down into the water and the body pitched nose down
    const h = hours[0]!
    for (const d of runs(h.frames, f => f.under).slice(0, 20)) {
      const before = h.frames[d.start - 2]!
      expect(before.pose.reach).toBeGreaterThan(0.8)
      expect(before.pose.lean.x).toBeGreaterThan(0.3)
    }
  })
  it('comes up 3-10 m from where it went down, in its water, clear of the other swimmers', () => {
    const still: BehaviorController = { name: 'swim', state: 'loaf', x: -14, y: 0, z: -29, heading: 0, spacing: 1.5, update() {} }
    const h = fish(5, 3600, 10, [still])
    for (const d of runs(h.frames, f => f.under).filter(r => r.start > 0 && r.end < h.frames.length)) {
      const down = h.frames[d.start]!, up = h.frames[d.end]!
      expect(Math.hypot(up.x - down.x, up.z - down.z)).toBeLessThanOrEqual(10 + CORMORANT.under.speed * CORMORANT.under.extra + 1e-6)
      expect(pointInPolygon(up.x, up.z, water.points)).toBe(true)
      expect(Math.hypot(up.x - still.x, up.z - still.z)).toBeGreaterThanOrEqual(1.5 - 1e-6)
    }
  })
  it('brings up a fish about one surfacing in six, swallows a small one at once and handles a large one for 3-15 s first', () => {
    let surfacings = 0, catches = 0, large = 0
    for (const h of hours) {
      const ds = runs(h.frames, f => f.under).filter(r => r.end < h.frames.length)
      surfacings += ds.length
      for (const s of runs(h.frames, f => f.state === 'swallow')) catches++
      for (const s of runs(h.frames, f => f.state === 'handle')) {
        large++
        expect(s.seconds).toBeGreaterThanOrEqual(3 - 0.15)
        expect(s.seconds).toBeLessThanOrEqual(15 + 0.15)
        // a swallow follows the handling
        expect(h.frames[s.end]!.state).toBe('swallow')
      }
    }
    expect(catches / surfacings).toBeGreaterThan(0.1)
    expect(catches / surfacings).toBeLessThan(0.25)
    expect(large / catches).toBeGreaterThan(0.08)
    expect(large / catches).toBeLessThan(0.35)
  })
  it('swallows in forward-upward jerks of the head: 1-2 for a small fish, 4-5 for a large one', () => {
    const jerks = (from: number, to: number) => {
      let n = 0
      for (let i = from + 1; i < to; i++) {
        const [a, b, c] = [fine.frames[i - 1]!, fine.frames[i]!, fine.frames[i + 1]!].map(f => f.pose.headPitch)
        if (b! > a! && b! >= c! && b! > CORMORANT.swallow.jerk * 0.5) n++
      }
      return n
    }
    const sw = runs(fine.frames, f => f.state === 'swallow')
    expect(sw.length).toBeGreaterThan(0)
    for (const s of sw) {
      const big = fine.frames[s.start - 1]!.state === 'handle'
      const n = jerks(s.start, s.end)
      if (big) { expect(n).toBeGreaterThanOrEqual(4); expect(n).toBeLessThanOrEqual(5) }
      else { expect(n).toBeGreaterThanOrEqual(1); expect(n).toBeLessThanOrEqual(2) }
    }
  })
  it('rings the water as it goes under and comes up, and splashes as it goes', () => {
    const h = hours[0]!
    const ds = runs(h.frames, f => f.under).filter(r => r.start > 0 && r.end < h.frames.length)
    for (const d of ds.slice(0, 10)) {
      const near = (t: number, x: number, z: number) => h.rings.some(r => Math.abs(r.t - t) < 1.5 && Math.hypot(r.x - x, r.z - z) < 0.5)
      expect(near(h.frames[d.start]!.t, h.frames[d.start]!.x, h.frames[d.start]!.z)).toBe(true)
      expect(near(h.frames[d.end]!.t, h.frames[d.end]!.x, h.frames[d.end]!.z)).toBe(true)
    }
    expect(h.splashes.length).toBeGreaterThanOrEqual(ds.length)
  })
  it('stays in its water', () => {
    for (const h of hours) for (const f of h.frames) expect(pointInPolygon(f.x, f.z, water.points)).toBe(true)
  })
  it('never jumps between frames at 60 fps: its place and every part of its pose move smoothly', () => {
    for (let i = 1; i < fine.frames.length; i++) {
      const a = fine.frames[i - 1]!, b = fine.frames[i]!
      // under water it is hidden, and may move faster than it shows
      if (!a.under && !b.under) expect(Math.hypot(b.x - a.x, b.z - a.z)).toBeLessThan(0.05)
      expect(Math.abs(b.pose.neckExtend - a.pose.neckExtend)).toBeLessThan(0.08)
      expect(Math.abs(b.pose.lean.x - a.pose.lean.x)).toBeLessThan(0.08)
      expect(Math.abs(b.pose.reach - a.pose.reach)).toBeLessThan(0.15)
      expect(Math.abs(b.pose.headPitch - a.pose.headPitch)).toBeLessThan(0.12)
      if (!a.under && !b.under) expect(Math.abs(b.y - a.y)).toBeLessThan(0.05)
    }
  })
  it('floats low with its neck upright and its bill raised while loafing', () => {
    const loaf = hours[0]!.frames.filter(f => f.state === 'loaf')
    expect(loaf.length).toBeGreaterThan(100)
    for (const f of loaf.slice(-50)) { expect(f.pose.neckExtend).toBeCloseTo(NECK.loaf, 1); expect(f.y).toBeCloseTo(0, 9) }
  })
})

describe('the cormorant style on perch', () => {
  const PERCH: [number, number, number] = [-14, 0.9, -30]
  const into = Math.atan2(WIND.dirZ, -WIND.dirX)
  /** one bird on its stump for `seconds` at `fps` */
  function sit(seed: number, seconds: number, fps: number) {
    const bird = createPerch(ctx(seed, { zone: { kind: 'point', position: PERCH }, perch: PERCH }), PERCH[0], PERCH[2])
    const pose = defaultPose()
    pose.afloat = 0
    const frames: Frame[] = []
    for (let i = 0; i < seconds * fps; i++) {
      bird.update(1 / fps, pose)
      frames.push({ t: i / fps, state: bird.state, x: bird.x, y: bird.y, z: bird.z, h: bird.heading, under: false, pose: { ...pose, lean: pose.lean.clone() } })
    }
    return { frames, bird }
  }
  const long = [11, 12, 13].map(seed => sit(seed, 3 * 3600, 5))
  const fine = sit(19, 900, 60)
  const sessions = (frames: Frame[]) => runs(frames, f => f.state === 'session' || f.state === 'spread' || f.state === 'fold')

  it('is what perch gives a cormorant', () => {
    expect(createPerch(ctx(1, { perch: PERCH }), 0, 0)).toBeDefined()
    expect(long[0]!.frames.some(f => f.state === 'spread')).toBe(true)
    expect(createCormorantPerch).toBeDefined()
  })
  it('never leaves its perch', () => {
    for (const s of long) for (const f of s.frames) { expect(f.x).toBe(PERCH[0]); expect(f.y).toBe(PERCH[1]); expect(f.z).toBe(PERCH[2]) }
  })
  it('stands upright on it, the body 35-45 degrees up and the tail propped', () => {
    for (const f of long[0]!.frames.slice(100)) {
      expect(-f.pose.lean.x).toBeGreaterThan(THREE.MathUtils.degToRad(33))
      expect(-f.pose.lean.x).toBeLessThan(THREE.MathUtils.degToRad(47))
      expect(f.pose.tailProp).toBeGreaterThan(0.9)
    }
  })
  it('dries its wings within the first ten minutes, then every 25-45 minutes, about four to five minutes a session', () => {
    for (const s of long) {
      const ss = sessions(s.frames)
      expect(s.frames[ss[0]!.start]!.t).toBeLessThan(600)
      for (let i = 1; i < ss.length; i++) {
        const gap = s.frames[ss[i]!.start]!.t - s.frames[ss[i - 1]!.start]!.t
        expect(gap).toBeGreaterThanOrEqual(CORMORANT_PERCH.every[0] * 60 - 1)
        expect(gap).toBeLessThanOrEqual(CORMORANT_PERCH.every[1] * 60 + CORMORANT_PERCH.session.max + 1)
      }
      // spread, 2-4 bouts of 0.5-3 minutes each
      for (const ses of ss.slice(0, -1)) {
        const frames = s.frames.slice(ses.start, ses.end)
        const bouts = runs(frames, f => f.state === 'spread')
        expect(bouts.length).toBeGreaterThanOrEqual(2)
        expect(bouts.length).toBeLessThanOrEqual(4)
        for (const b of bouts) { expect(b.seconds).toBeGreaterThanOrEqual(30 - 0.3); expect(b.seconds).toBeLessThanOrEqual(180 + 0.3) }
        const spread = bouts.reduce((a, b) => a + b.seconds, 0)
        expect(spread).toBeGreaterThan(150)
        expect(spread).toBeLessThan(CORMORANT_PERCH.session.max)
      }
    }
  })
  it('has about one bird in nine with its wings spread over a long visit', () => {
    const share = mean(long.map(s => s.frames.filter(f => f.pose.dry > 0.5).length / s.frames.length))
    expect(share).toBeGreaterThan(0.06)
    expect(share).toBeLessThan(0.16)
  })
  it('faces into the wind, within 20 degrees, while its wings are spread', () => {
    for (const s of long) for (const f of s.frames.filter(f => f.state === 'spread' && f.pose.dry > 0.9)) {
      const off = Math.atan2(Math.sin(f.h - into), Math.cos(f.h - into))
      expect(Math.abs(off)).toBeLessThan(THREE.MathUtils.degToRad(20))
    }
  })
  it('flaps the spread wings slowly now and then, and holds them still the rest', () => {
    const spread = long[0]!.frames.filter(f => f.state === 'spread')
    const flapping = spread.filter(f => f.pose.wingSpread > 0.05)
    expect(flapping.length).toBeGreaterThan(0)
    expect(flapping.length).toBeLessThan(spread.length * 0.3)
  })
  it('rests with its neck drawn in or erect, changing now and then', () => {
    const necks = long[0]!.frames.map(f => f.pose.neckExtend)
    expect(Math.min(...necks)).toBeLessThan(0.3)
    expect(Math.max(...necks)).toBeGreaterThan(0.7)
  })
  it('never jumps between frames at 60 fps', () => {
    for (let i = 1; i < fine.frames.length; i++) {
      const a = fine.frames[i - 1]!, b = fine.frames[i]!
      expect(Math.abs(Math.atan2(Math.sin(b.h - a.h), Math.cos(b.h - a.h)))).toBeLessThan(0.05)
      expect(Math.abs(b.pose.dry - a.pose.dry)).toBeLessThan(0.05)
      expect(Math.abs(b.pose.neckExtend - a.pose.neckExtend)).toBeLessThan(0.05)
      expect(Math.abs(b.pose.lean.x - a.pose.lean.x)).toBeLessThan(0.05)
    }
  })
})
```

Run: `npx vitest run src/behavior/cormorant.test.ts`
Expected: FAIL: `./cormorant` doesn't exist.

- [ ] **Step 2: The styles and their wiring**

Create `src/behavior/cormorant.ts`:

```ts
import type { BehaviorContext, BehaviorController } from './types'
import { approach, between, ease, perchOf, turnToward, wrap } from './types'
import { createSwimmer, pickByShare, mid, type SwimSettings } from './swimmer'
import { pointInPolygon } from '../location/zones'
import type { PoseState } from '../birds/model'

type Range = readonly [number, number]

/** The Double-crested Cormorant's settings on the water. */
export interface CormorantSettings extends SwimSettings {
  /** its time: fishing bouts of `dives` dives; after a bout it rests (cruises or loafs) before it fishes again */
  bouts: { share: number; dives: Range }
  cruising: { share: number; range: Range; ring: { every: number; size: number } }
  loaf: { share: number; seconds: Range }
  /**
   * the dive: a smooth forward slide over `slide` seconds, the bill reaching forward into the water and the body
   * tipping nose down by `lean`, the tail last, until `depth` metres takes it all under; `leap` of the dives start
   * with a small leap, `leapHeight` up over `leapTime` seconds, before the slide
   */
  entry: { slide: number; lean: number; depth: number; leap: number; leapTime: number; leapHeight: number }
  /**
   * under water: `seconds`, uniform; coming up `distance` metres away (uniform), any way, in its water, swum at most
   * `speed` m/s; `tries` at a spot clear of the others. If another bird has come up near the spot meanwhile, it swims on
   * to the nearest clear one for up to `extra` seconds more, then comes up wherever it is.
   */
  under: { seconds: Range; distance: Range; speed: number; tries: number; extra: number }
  /** up head first in `rise` seconds; then on the surface `pause` seconds (mean `pauseMean`) before the next dive */
  resurface: { rise: number; pause: Range; pauseMean: number }
  /** how often a surfacing brings a fish, and how often a catch is a large one */
  catches: { share: number; large: number }
  /** a large fish held crosswise and worked into place for `seconds` before it is swallowed */
  handle: { seconds: Range }
  /** each forward-upward jerk of the head, `jerk` radians at its top over `each` seconds; how many for each size */
  swallow: { jerk: number; each: number; small: Range; large: Range }
  rings: { entry: number; up: number; swallow: number }
}

/**
 * From docs/research/2026-10-04-double-crested-cormorant.md, section 7.1 (the dives and the fish) and 6.2 (the swim).
 * Sourced: dives of 22 s (15-30), surface pauses of 12 s (8-20), bouts of 6-15 dives, one surfacing in six with a fish,
 * one catch in five a large one handled 3-15 s, small ones swallowed in 1-2 jerks and large ones in 4-5. The swim
 * speed (0.3-0.5 m/s), the distance under water, the shares, and the rest are estimates.
 */
export const CORMORANT: CormorantSettings = {
  cruise: { speed: 0.4, seconds: [10, 40] },
  turn: 1.0,
  // fishes alone (research 7.1: 20 of 21 swimming records single): no flock
  flock: { radius: Infinity, retargetSeconds: Infinity, drift: 0, whenFarther: Infinity, apart: 20 },
  spacing: { flock: 5, other: 1.5 },
  // the weights make about two-fifths of its time under water: a bout's dives are about three-fifths under, and it
  // rests about three and a half minutes between bouts (computed)
  bouts: { share: 0.6, dives: [6, 15] },
  cruising: { share: 0.12, range: [2, 6], ring: { every: 2, size: 0.35 } },
  loaf: { share: 0.28, seconds: [90, 240] },
  // a lone bird mostly slides under; a small leap now and then (research 7.1)
  entry: { slide: 1, lean: 0.6, depth: 0.5, leap: 0.2, leapTime: 0.5, leapHeight: 0.06 },
  under: { seconds: [15, 30], distance: [3, 10], speed: 1.5, tries: 24, extra: 5 },
  resurface: { rise: 0.4, pause: [8, 20], pauseMean: 12 },
  catches: { share: 1 / 6, large: 1 / 5 },
  handle: { seconds: [3, 15] },
  swallow: { jerk: 0.45, each: 0.5, small: [1, 2], large: [4, 5] },
  rings: { entry: 0.7, up: 0.5, swallow: 0.15 },
}

type State = 'loaf' | 'cruise' | 'dive' | 'under' | 'surface' | 'handle' | 'swallow' | 'pause'
/** the neck in each state: as modelled (upright, the bill 15 degrees up) loafing; up a little to look about */
export const NECK: Record<State, number> = { loaf: 0.5, cruise: 0.55, dive: 0.6, under: 0.6, surface: 0.7, handle: 0.6, swallow: 0.75, pause: 0.55 }
const step = (v: number, want: number, by: number) => (v < want ? Math.min(want, v + by) : Math.max(want, v - by))
const easeIn = (t: number) => t * t * t
/** a whole number between lo and hi, both included */
const count = (rng: () => number, [lo, hi]: Range) => Math.floor(between(rng, [lo, hi + 1]))

/**
 * The `cormorant` style on swim: a lone bird loafing low in the water, cruising, and fishing in bouts of dives. Each
 * dive is a slide forward and under, now and then after a small leap; it stays down about 22 s and comes up a few
 * metres on, head first, and sometimes with a fish: a small one swallowed at once in a jerk or two of the head, a large
 * one worked crosswise in the bill for seconds first, then swallowed in four or five.
 */
export function createCormorant(ctx: BehaviorContext, startX: number, startZ: number, S: CormorantSettings = CORMORANT): BehaviorController {
  const b = createSwimmer(ctx, startX, startZ, S)
  let state: State = 'loaf'
  let timer = 0, dives = 0, jerks = 0, onState = 0
  let [tx, tz] = [b.x, b.z]
  // how far down the bird is (negative: up, in a leap), easing from `from` to `to` over `over` seconds
  let depth = 0, from = 0, to = 0, over = 0, moved = 0, curve: (t: number) => number = ease
  let leaping = false
  let [ux, uz] = [0, 0], [wentX, wentZ] = [0, 0]
  let reach = 0, tip = 0, sinceRing = 0, clock = 0
  const ring = (size: number) => ctx.onRipple?.(b.x, b.z, size)
  const TABLE = {
    bout: { share: S.bouts.share, mean: mid(S.bouts.dives) * (mid(S.under.seconds) + S.resurface.pauseMean + 2) },
    cruise: { share: S.cruising.share, mean: mid(S.cruise.seconds) },
    loaf: { share: S.loaf.share, mean: mid(S.loaf.seconds) },
  }
  const REST = { cruise: TABLE.cruise, loaf: TABLE.loaf }
  function sinkTo(target: number, seconds: number, shape: (t: number) => number = ease): void {
    from = depth; to = target; over = seconds; moved = 0; curve = shape
  }
  const settled = () => moved >= over
  const go = (s: State, seconds = 0) => { state = s; timer = seconds; onState = 0 }

  function next(afterBout = false): void {
    const pick = afterBout ? pickByShare(ctx.rng, REST) : pickByShare(ctx.rng, TABLE)
    if (pick === 'bout') { dives = count(ctx.rng, S.bouts.dives); dive() }
    else if (pick === 'cruise') { go('cruise', between(ctx.rng, S.cruise.seconds)); [tx, tz] = spot() }
    else go('loaf', between(ctx.rng, S.loaf.seconds))
  }
  /** a spot a few metres off in its water, clear of the others if one of a few tries is */
  function spot(): [number, number] {
    let best: [number, number] = [b.x, b.z]
    for (let i = 0; i < 12; i++) {
      const a = ctx.rng() * Math.PI * 2, r = between(ctx.rng, S.cruising.range)
      const [px, pz] = [b.x + Math.cos(a) * r, b.z - Math.sin(a) * r]
      if (!pointInPolygon(px, pz, b.zone.points)) continue
      best = [px, pz]
      if (b.clearAt(px, pz, 0.5)) break
    }
    return best
  }
  function dive(): void {
    dives--
    go('dive')
    leaping = ctx.rng() < S.entry.leap
    if (leaping) sinkTo(-S.entry.leapHeight, S.entry.leapTime / 2)
    else { sinkTo(S.entry.depth, S.entry.slide, easeIn); ring(S.rings.entry); ctx.onEvent?.('splash', b.x, 0, b.z) }
  }
  function goUnder(): void {
    go('under', between(ctx.rng, S.under.seconds))
    ;[wentX, wentZ] = [b.x, b.z]
    ;[ux, uz] = surfacing()
    // a long way takes the time it takes
    timer = Math.max(timer, Math.hypot(ux - b.x, uz - b.z) / S.under.speed)
    if (Math.hypot(ux - b.x, uz - b.z) > 0.1) b.heading = Math.atan2(-(uz - b.z), ux - b.x)
  }
  /** where it will come up: as far as it draws, any way, in its water, and clear of the others if a try is */
  function surfacing(): [number, number] {
    let best: [number, number] = [b.x, b.z], bestRoom = -Infinity
    for (let i = 0; i < S.under.tries; i++) {
      const a = ctx.rng() * Math.PI * 2, d = between(ctx.rng, S.under.distance)
      const [px, pz] = [b.x + Math.cos(a) * d, b.z - Math.sin(a) * d]
      if (!pointInPolygon(px, pz, b.zone.points)) continue
      if (b.clearAt(px, pz, 1, true)) return [px, pz]
      const room = Math.min(...b.others().map(n => Math.hypot(n.x - px, n.z - pz) - b.spacingTo(n)))
      if (room > bestRoom) { bestRoom = room; best = [px, pz] }
    }
    return best
  }
  /** If the spot isn't clear any more, the nearest one that is and that it can still swim to in `seconds`. */
  function clearOfOthers(seconds: number): void {
    if (b.clearAt(ux, uz, 0, true)) return
    let best: [number, number] | null = null
    const reachable = S.under.speed * seconds
    for (let i = 1; i <= 12 && !best; i++) {
      const r = (reachable * i) / 12
      for (let k = 0; k < 16; k++) {
        const [px, pz] = [b.x + Math.cos((k * Math.PI) / 8) * r, b.z - Math.sin((k * Math.PI) / 8) * r]
        if (pointInPolygon(px, pz, b.zone.points) && b.clearAt(px, pz, 0.05, true) && (!best || Math.hypot(px - ux, pz - uz) < Math.hypot(best[0] - ux, best[1] - uz))) best = [px, pz]
      }
    }
    if (best) [ux, uz] = best
  }
  function resurface(): void {
    if (Math.hypot(b.x - wentX, b.z - wentZ) > 0.1) b.heading = Math.atan2(-(b.z - wentZ), b.x - wentX)
    go('surface')
    sinkTo(0, S.resurface.rise)
    ring(S.rings.up)
  }
  /** on the surface: a fish to deal with, or straight to the pause before the next dive */
  function afterSurfacing(): void {
    if (ctx.rng() < S.catches.share) {
      if (ctx.rng() < S.catches.large) { go('handle', between(ctx.rng, S.handle.seconds)); jerks = count(ctx.rng, S.swallow.large) }
      else { jerks = count(ctx.rng, S.swallow.small); go('swallow', jerks * S.swallow.each) }
    } else pause()
  }
  function pause(): void {
    // skewed toward the short end so its mean is `pauseMean`
    const [lo, hi] = S.resurface.pause
    go('pause', lo + (hi - lo) * ctx.rng() ** ((hi - S.resurface.pauseMean) / (S.resurface.pauseMean - lo)))
  }

  const self: BehaviorController = {
    name: 'swim',
    get state() { return state },
    get x() { return b.x }, get z() { return b.z }, get heading() { return b.heading },
    get y() { return -depth },
    get submerged() { return depth >= S.entry.depth },
    spacing: S.spacing.other,
    group: b.flock.group,
    update(dt: number, pose: PoseState) {
      clock += dt
      timer -= dt
      onState += dt
      moved += dt
      sinceRing += dt
      depth = settled() ? to : from + (to - from) * curve(moved / over)

      if (state === 'cruise') {
        b.swimTo(tx, tz, S.cruise.speed, dt)
        if (b.speed > 0.05 && sinceRing >= S.cruising.ring.every) { sinceRing = 0; ring(S.cruising.ring.size) }
        if (timer <= 0) next()
      } else if (state === 'loaf') {
        b.float(dt)
        if (timer <= 0) next()
      } else if (state === 'dive') {
        b.float(dt)
        // a leap: up, then down onto the water, then the slide
        if (leaping && settled() && to < 0) sinkTo(0, S.entry.leapTime / 2)
        else if (leaping && settled()) { leaping = false; sinkTo(S.entry.depth, S.entry.slide, easeIn); ring(S.rings.entry); ctx.onEvent?.('splash', b.x, 0, b.z) }
        else if (!leaping && settled()) goUnder()
      } else if (state === 'under') {
        const overdue = -timer
        const outOfTime = overdue >= S.under.extra
        if (overdue >= 0 && !outOfTime) clearOfOthers(S.under.extra - overdue)
        const left = Math.hypot(ux - b.x, uz - b.z)
        const by = Math.min(left, (left / Math.max(timer, dt)) * dt, S.under.speed * dt)
        if (left > 1e-9) { b.x += ((ux - b.x) / left) * by; b.z += ((uz - b.z) / left) * by }
        b.speed = 0
        if (outOfTime || (overdue >= 0 && left - by < 1e-9 && b.clearAt(ux, uz, 0, true))) resurface()
      } else if (state === 'surface') {
        b.float(dt)
        if (settled()) afterSurfacing()
      } else if (state === 'handle') {
        b.float(dt)
        if (timer <= 0) go('swallow', jerks * S.swallow.each)
      } else if (state === 'swallow') {
        b.float(dt)
        // a ring at the start of each jerk, the bill flicking at the water
        const k = Math.floor(onState / S.swallow.each), prev = Math.floor((onState - dt) / S.swallow.each)
        if (k !== prev && k < jerks) ring(S.rings.swallow)
        if (timer <= 0) pause()
      } else if (state === 'pause') {
        b.float(dt)
        if (timer <= 0) { if (dives > 0) dive(); else next(true) }
      }

      // posture, each part eased at a steady rate
      const diving = state === 'dive' && !leaping, down = state === 'under'
      // the bill reaches forward and down into the water as it slides under; under water it eases back, out of sight
      reach = step(reach, diving || (down && onState < 1) ? 1 : 0, dt / 0.4)
      tip = step(tip, diving ? 1 : 0, dt / (diving ? 0.5 : 1))
      const kReach = ease(reach)
      pose.reach = kReach
      pose.reachDepth = 0.15 * kReach
      pose.reachAngle = 0.7
      pose.lean.x = S.entry.lean * ease(tip)
      // the tail lies on the water, and goes in last
      pose.tailTilt = 0
      pose.paddle = 0
      // a swallow: forward-upward jerks of the head, each up and back over `each` seconds; a large fish worked in the
      // bill with small turns of the head first
      if (state === 'swallow') {
        const u = (onState % S.swallow.each) / S.swallow.each
        pose.headPitch = onState < jerks * S.swallow.each ? S.swallow.jerk * Math.sin(Math.PI * u) ** 2 : 0
      } else if (state === 'handle') pose.headPitch = 0.08 * Math.sin(clock * Math.PI * 3) * Math.min(1, onState)
      else pose.headPitch = approach(pose.headPitch, 0, 6, dt)
      pose.neckExtend = approach(pose.neckExtend, NECK[state], 3, dt)
      pose.headBob = 0
      pose.lean.z = 0
    },
  }
  b.self = self
  next()
  return self
}

/** A Double-crested Cormorant's settings on its perch. */
export interface CormorantPerchSettings {
  /** the body raised this far, radians (negative lean: nose up); the tail propped on the wood */
  lean: number
  /** minutes between the starts of its drying sessions; the first within `first` minutes of the visit */
  every: Range
  first: Range
  /**
   * a drying session: `settle` seconds standing first, then `bouts` bouts of spreading of `spread` seconds each,
   * `total` seconds of them in all, folded for `folded` seconds between; at most `max` seconds of spreading
   */
  session: { settle: number; bouts: Range; spread: Range; total: Range; folded: Range; max: number }
  /** while spread it faces into the wind within `wind` radians (each bird its own way, a little either side) */
  wind: number
  /** slow flaps of the spread wings: one bout every `every` seconds or so, `seconds` long, at `hz` */
  flaps: { every: Range; seconds: Range; hz: number; spread: number }
  /** resting, the neck drawn in (`low`) or erect (`high`), changing every `every` seconds */
  neck: { low: number; high: number; every: Range }
}

/**
 * From docs/research/2026-10-04-double-crested-cormorant.md, sections 7.2 and 7.3. Sourced: the body 35-45 degrees
 * up and the tail as a prop; bouts of 0.5-3 minutes, 2-4 of them, about 4-5 minutes in all; facing into the wind;
 * slow flaps now and then (Sellers 1995's Great Cormorants). The session's interval is the spec's: the birds on the
 * stumps don't fish this round, so they dry on a schedule, about one in nine spreading over a long visit.
 */
export const CORMORANT_PERCH: CormorantPerchSettings = {
  lean: -0.7,
  every: [25, 45],
  first: [0.5, 9],
  session: { settle: 60, bouts: [2, 4], spread: [30, 180], total: [240, 300], folded: [10, 60], max: 330 },
  wind: 0.17,
  flaps: { every: [20, 45], seconds: [2, 4], hz: 1.2, spread: 0.2 },
  neck: { low: 0.15, high: 0.85, every: [60, 300] },
}

type PerchState = 'rest' | 'session' | 'spread' | 'fold'

/**
 * The `cormorant` style on perch: stands upright on its stump, its tail propped, resting with its neck drawn in or
 * erect; in a drying session, a minute standing, then its wings held out, wrists up and hands hanging, facing into
 * the wind, in bouts with the wings folded between, now and then flapping them slowly. It never leaves the perch.
 */
export function createCormorantPerch(ctx: BehaviorContext, P: CormorantPerchSettings = CORMORANT_PERCH): BehaviorController {
  const [px, py, pz] = perchOf(ctx)
  let heading = ctx.rng() * Math.PI * 2
  let state: PerchState = 'rest'
  let timer = between(ctx.rng, P.first) * 60
  let nextSession = timer
  let clock = 0
  let bouts: number[] = [], bout = 0
  let neckWant = ctx.rng() < 0.5 ? P.neck.low : P.neck.high, neckIn = between(ctx.rng, P.neck.every)
  let flapIn = between(ctx.rng, P.flaps.every), flapping = 0, wingPhase = 0
  // each bird faces the wind its own way, a little either side of square into it
  const own = (ctx.rng() * 2 - 1) * P.wind * 0.5
  const into = () => { const w = ctx.wind(); return Math.atan2(w.dirZ, -w.dirX) + own }

  /** the session's bouts of spreading: `total` seconds split into 2-4, each within `spread` */
  function plan(): number[] {
    const n = count(ctx.rng, P.session.bouts), total = between(ctx.rng, P.session.total)
    const w = Array.from({ length: n }, () => 0.5 + ctx.rng())
    const sum = w.reduce((a, b) => a + b, 0)
    return w.map(x => Math.min(P.session.spread[1], Math.max(P.session.spread[0], (x / sum) * total)))
  }
  function go(s: PerchState, seconds: number): void { state = s; timer = seconds }

  return {
    name: 'perch',
    get state() { return state },
    get x() { return px }, get y() { return py }, get z() { return pz }, get heading() { return heading },
    update(dt: number, pose: PoseState) {
      clock += dt
      timer -= dt
      if (state === 'rest' && clock >= nextSession) {
        bouts = plan(); bout = 0
        nextSession = clock + between(ctx.rng, P.every) * 60
        go('session', P.session.settle)
      } else if (state === 'session' && timer <= 0) go('spread', bouts[bout]!)
      else if (state === 'spread' && timer <= 0) {
        bout++
        if (bout < bouts.length) go('fold', between(ctx.rng, P.session.folded))
        else go('rest', 0)
      } else if (state === 'fold' && timer <= 0) go('spread', bouts[bout]!)

      // turning: into the wind for a session (it squares up while it stands, before it spreads); now and then a shuffle
      // round while it rests
      if (state !== 'rest') heading = turnToward(heading, into(), 0.4 * dt)
      else heading = wrap(heading + Math.sin(clock * 0.05) * 0.02 * dt)

      // slow flaps of the spread wings, in short bouts
      const spread = state === 'spread'
      flapIn -= dt
      if (spread && flapIn <= 0 && flapping <= 0) { flapping = between(ctx.rng, P.flaps.seconds); flapIn = between(ctx.rng, P.flaps.every) }
      flapping -= dt
      const flap = spread && flapping > 0
      wingPhase = flap ? (wingPhase + P.flaps.hz * dt) % 1 : 0
      pose.wingPhase = wingPhase
      pose.wingSpread = flap ? P.flaps.spread : 0
      // the wings open or fold over a little over a second
      pose.dry = step(pose.dry, spread ? 1 : 0, dt / 1.2)

      // upright, the tail on the wood
      pose.lean.x = step(pose.lean.x, P.lean, dt * 0.5)
      pose.lean.z = approach(pose.lean.z, (ctx.wind().effective - 0.3) * 0.03, 2, dt)
      pose.tailProp = step(pose.tailProp, 1, dt)
      pose.tailTilt = 0
      // the neck: drawn in or erect at rest, changing now and then; in a loose S, the head up, while drying
      neckIn -= dt
      if (neckIn <= 0) { neckWant = neckWant === P.neck.low ? P.neck.high : P.neck.low; neckIn = between(ctx.rng, P.neck.every) }
      pose.neckExtend = step(pose.neckExtend, state === 'rest' ? neckWant : 0.6, dt * 0.5)
      pose.headPitch = 0
      pose.reach = 0
    },
  }
}
```

In `src/behavior/perch.ts`, replace:

```ts
import type { PoseState } from '../birds/model'

```

with:

```ts
import type { PoseState } from '../birds/model'
import { createCormorantPerch } from './cormorant'

```

In `src/behavior/perch.ts`, replace:

```ts

/** Sit on a perch; shuffle, stretch, and now and then fly a short loop and land back on it. */
export function createPerch(ctx: BehaviorContext, _startX: number, _startZ: number): BehaviorController {
  const [px, py, pz] = perchOf(ctx)
```

with:

```ts

/**
 * Sit on a perch; shuffle, stretch, and now and then fly a short loop and land back on it. A cormorant perches in its
 * own style: upright on its stump, drying its wings (cormorant.ts).
 */
export function createPerch(ctx: BehaviorContext, _startX: number, _startZ: number): BehaviorController {
  if (ctx.foraging === 'cormorant') return createCormorantPerch(ctx)
  const [px, py, pz] = perchOf(ctx)
```

In `src/behavior/swim.ts`, replace:

```ts
import { createPelican, PELICAN } from './pelican'
import type { Company } from './swimmer'
```

with:

```ts
import { createPelican, PELICAN } from './pelican'
import { createCormorant, CORMORANT } from './cormorant'
import type { Company } from './swimmer'
```

In `src/behavior/swim.ts`, replace:

```ts
    case 'pelican': return createPelican(ctx, startX, startZ)
    default: return createDabbler(ctx, startX, startZ, dabblerFor(ctx.species))
```

with:

```ts
    case 'pelican': return createPelican(ctx, startX, startZ)
    case 'cormorant': return createCormorant(ctx, startX, startZ)
    default: return createDabbler(ctx, startX, startZ, dabblerFor(ctx.species))
```

In `src/behavior/swim.ts`, replace:

```ts
export function companyOf(foraging?: Foraging, species?: string): Company {
  const S = foraging === 'shoveler' ? SHOVELER : foraging === 'coot' ? COOT : foraging === 'grebe' ? GREBE : foraging === 'goose' ? gooseFor(species) : foraging === 'pelican' ? PELICAN : dabblerFor(species)
  return { radius: S.flock.radius, retargetSeconds: S.flock.retargetSeconds, spacing: S.spacing, apart: S.flock.apart }
```

with:

```ts
export function companyOf(foraging?: Foraging, species?: string): Company {
  const S = foraging === 'shoveler' ? SHOVELER : foraging === 'coot' ? COOT : foraging === 'grebe' ? GREBE : foraging === 'goose' ? gooseFor(species) : foraging === 'pelican' ? PELICAN : foraging === 'cormorant' ? CORMORANT : dabblerFor(species)
  return { radius: S.flock.radius, retargetSeconds: S.flock.retargetSeconds, spacing: S.spacing, apart: S.flock.apart }
```

In `src/birds/spec.ts`, replace:

```ts
export const SWIM_STYLES = ['dabbler', 'shoveler', 'coot', 'grebe', 'goose', 'pelican'] as const
```

with:

```ts
export const SWIM_STYLES = ['dabbler', 'shoveler', 'coot', 'grebe', 'goose', 'pelican', 'cormorant'] as const
```

- [ ] **Step 3: See it pass**

Run: `npx vitest run src/behavior/cormorant.test.ts`
Expected: 21 tests pass (about two minutes: four hours of fishing and nine of perching at 10 and 5 frames a second).

Run: `npm test && npx tsc --noEmit -p .`
Expected: every test passes (1296). No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/behavior src/birds/spec.ts
git commit -m "feat: the cormorant styles: on swim, a lone bird loafing low and fishing in bouts of 22 s dives, a slide or a small leap under, up a few metres on, now and then with a fish swallowed head first in jerks; on perch, upright on its stump, tail propped, drying its wings into the wind in sessions (Task 6)"
```

---

# Part 2: the cormorant

Part 2 is written as procedures: the Blender build is made by looking, and the species' numbers come from what it makes.
Each step says what to do, what to look at, and which test holds it.

### Task 7: The Blender build

**Files:**
- Create: `scripts/blender/doccor/build.py`, `scripts/blender/doccor/rig.py`, `scripts/blender/doccor/legs.py`,
  `scripts/blender/doccor/flight.py`; `public/models/doccor/doccor.glb`, `public/models/doccor/{adult,juvenile}.{color,normal,rough}.webp` (built)
- Modify: the pilot's `scripts/blender/doccor/*.py`

**Interfaces:**
- Consumes: Task 2's `gamebird.py` and the loader's contract (bones, `_PART`, landmarks); the pilot.
- Produces: the cormorant's files, by `blender -b --factory-startup -P scripts/blender/doccor/build.py`.

The pilot's scripts made the body, neck, and head (a voxel-remeshed chain of ellipsoids, so nothing folds), the bill and
eyes, the folded wings and the tail, the laid feathers, the materials, the bake, and the export, by hand through the
Blender connection. This task makes them one headless build that writes the game's files, and adds what the game needs.

- [ ] **Step 1: The driver.** `build.py` runs every part's script in order from an empty scene (`--factory-startup`),
  with `sys.path` holding `scripts/blender/lib` and `scripts/blender/doccor`; each part's script becomes a module with a
  `build()` function rather than code that runs on `exec`. It records Blender's version in the glb's `asset.extras`
  (`export_extras`). A run from scratch takes a few minutes (the voxel remesh and the bake).

- [ ] **Step 2: Legs and feet** (`legs.py`). A short black tarsus (65 mm) from a knee hidden in the belly's feathers,
  standing, as an amphibious bird's legs are built: the soles about 0.12 m under the floating body, the hips at the
  research's legs (set far back: about 0.6 of the body from the breast). Totipalmate feet: four toes, all webbed, the
  outer longest (86 mm), the middle 72, the inner 55, the hind 40 turned forward and inward and webbed to the inner (the
  research's estimates, section 9). `_PART` legs; the tibia, tarsus, and toes weighted to their bones on each side.

- [ ] **Step 3: The flight wing** (`flight.py`). Half-span 0.60 m from the shoulder (the research's 1.20 m span less the
  body), chord from the research's planform (wing area 0.18 m², aspect ratio 8: about 0.15 m at the root, rounded at the
  tip), laid as overlapping primaries and secondaries (black-brown, `#1c1b1a` adult, `#2e2b26` juvenile), with coverts
  over their bases. The wrist at about 0.45 of the half-span. `_PART` wingSpread; the inner wing weighted to `wingL/R`,
  the hand to `handL/R`, blending across the wrist. Laid flat and straight out at rest, as the pelican's flight wing is.
  `mark_flightTip` at the right tip.

- [ ] **Step 4: The rig** (`rig.py`). The joints for `gamebird.armature`:
  - `root`, `body`: the origin (the body's middle on the water); `legs`: a quarter of the way up from the belly to the
    hips;
  - the neck chain: `neck` at the neck's base where it leaves the breast, then `neckMid`, `neck3` to `neck6` evenly up the
    neck to `head` at the occiput (`authored.neck` 7);
  - `bill` at the bill's base; `tail` at the tail's root;
  - `wingFoldL/R` at the folded wing's wrist; `wingL/R` at the shoulders; `handL/R` at the flight wing's wrist;
  - the legs' hip, knee, and foot on each side; `curl` parked at the body's pivot, `plume` at the head.
  Weights by part: each part's vertices to its own bones, the skin by heat (Blender's automatic weights) over the body,
  neck chain, head, and tail only, then smoothed where the neck meets the body. Every vertex's weights at most four,
  normalized. The landmarks (`mark_billBase`, `mark_billTip`, `mark_tailRoot`, `mark_tailTip`, `mark_wrist`,
  `mark_wingTip`, `mark_flightTip`).

- [ ] **Step 5: The scaled back, revised** (`feathers.py`). The pilot's feathers baked into rectangular tiles at game
  distance. Each laid feather rounder at the tip (the width closing over the last half of its length as a half
  ellipse), with a softer black margin (a ramp over the outer quarter, not a step), so the bake reads as scales.

- [ ] **Step 6: The juvenile** (`materials.py` takes a version). The research's colours (section 9): the crown and
  hindneck grey-brown `#6e6250`; the chin and throat `#e3c8ab`; the foreneck and breast `#d2b796` shading through
  `#8d855f` to a dark brown-black belly `#3a362d`; the back's feathers grey-brown `#8f8070` with dark edges `#3a332b`;
  the bare skin yellow `#f0c030`; the iris duller `#5f8f7a`; the bill pale horn with a dark ridge. The adult's as the
  pilot has them.

- [ ] **Step 7: The game mesh and the bake** (`bake.py`). The detailed parts decimated to at most 9,000 triangles in all
  (the body to about 5,500; the folded and flight wings, tail, bill, eyes, and legs light already); one atlas (smart UV
  project, packed); the colour, normal, and roughness baked per version at 1024 pixels in Cycles; written as WebP
  (`colour` at quality 85, the normal and roughness at 90). The export (`export.py`, through `gamebird.export`): the
  skinned mesh, the armature, and the landmarks; no images.

- [ ] **Step 8: Build it, and read it.** Run the build; it writes `public/models/doccor/`. Then, in Node:
  `npx vitest run src/birds/detail/authored.test.ts` still passes, and a scratch test (not committed) that runs
  `authoredBuilt` on the new glb with a minimal `authored` spec prints its triangle count, its joints, and its measures.
  The budget: the files at most 1.5 MB in all.

- [ ] **Step 9: Commit** the scripts and the built files:

```bash
git add scripts/blender/doccor public/models/doccor
git commit -m "feat: the cormorant's Blender build, headless: legs and totipalmate feet, the flight wing, the rig on the game's skeleton and its weights, the landmarks, rounder laid feathers, the juvenile; baked to 1024-pixel maps for each version and exported (Task 7)"
```

---

### Task 8: The Double-crested Cormorant

**Files:**
- Create: `src/birds/species/doccor.ts`, `src/birds/species/cormorant.test.ts`, `src/birds/models.setup.ts`
- Modify: `src/birds/species/index.ts`, `vite.config.ts`, `data/locations/lake.json`, `src/audio/calls.ts`,
  `src/birds/cast.test.ts`, `scripts/blender/doccor/*.py` (as tracing asks)

**Interfaces:**
- Consumes: Tasks 1-7.
- Produces: `doccor` in the registry, authored; the cast's four cormorants.

- [ ] **Step 1: The failing tests.** Create `src/birds/species/cormorant.test.ts`:

```ts
import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { getSpec } from './index'
import { within } from './swimmer.testkit'
import { buildDetailedBird, type DetailedBirdModel } from '../detail/build'
import { measure, crownNow, billAngleNow, tailTipNow } from '../detail/measure'
import { authoredFor } from '../detail/authored'
import { loadAuthoredForTest } from '../detail/authored.testkit'
import { defaultPose, type PoseState } from '../model'
import { CORMORANT_PERCH } from '../../behavior/cormorant'

// Bounds from docs/research/2026-10-04-double-crested-cormorant.md, sections 2.7, 5, 6.2, 7.2, 7.3, and 9, in mm and
// degrees. The cormorant is built in Blender (scripts/blender/doccor/), floating at rest, its waterline on y = 0; on its
// stump, its feet on y = 0. Its files are in public/models/doccor/.

const SPEC = getSpec('doccor')
const MODELS = fileURLToPath(new URL('../../../public/models/doccor/', import.meta.url))
const VERSIONS = ['adult', 'juvenile'] as const

type Patch = Partial<Omit<PoseState, 'lean'>> & { leanX?: number }
function posed(model: DetailedBirdModel, patch: Patch = {}): DetailedBirdModel {
  const { leanX = 0, ...rest } = patch
  const p: PoseState = { ...defaultPose(), ...rest }
  p.lean.set(leanX, 0, 0)
  model.pose(p)
  model.group.updateMatrixWorld(true)
  return model
}
const PERCHED: Patch = { afloat: 0, leanX: CORMORANT_PERCH.lean, tailProp: 1 }
const boneAt = (m: DetailedBirdModel, name: string) => m.mesh.skeleton.bones.find(b => b.name === name)!.getWorldPosition(new THREE.Vector3())
const deg = (rad: number) => (rad * 180) / Math.PI

/** A WebP's width and height, from its header (VP8, VP8L, or VP8X). */
function webpSize(path: string): [number, number] {
  const b = readFileSync(path)
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') throw new Error(`${path}: not a WebP`)
  const kind = b.toString('ascii', 12, 16)
  if (kind === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff]
  if (kind === 'VP8L') { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1] }
  if (kind === 'VP8X') return [b.readUIntLE(24, 3) + 1, b.readUIntLE(27, 3) + 1]
  throw new Error(`${path}: unknown WebP chunk ${kind}`)
}

beforeAll(() => loadAuthoredForTest(SPEC, `${MODELS}doccor.glb`))

describe('Double-crested Cormorant: the model', () => {
  it('is an authored bird, swimming and amphibious, in an adult and a juvenile version, the adult the default', () => {
    expect(SPEC.authored?.model).toBe('doccor')
    expect(SPEC.authored?.versions).toEqual([...VERSIONS])
    expect(SPEC.posture).toBe('swimming')
    expect(SPEC.authored?.amphibious).toBe(true)
    expect(SPEC.foraging).toBe('cormorant')
  })
  it('keeps to its budget: at most 9,000 triangles, and 1.5 MB for the model and every version\'s maps', () => {
    const g = authoredFor(SPEC).geometry
    expect(g.getIndex()!.count / 3).toBeLessThanOrEqual(9000)
    const files = ['doccor.glb', ...VERSIONS.flatMap(v => ['color', 'normal', 'rough'].map(k => `${v}.${k}.webp`))]
    const bytes = files.reduce((n, f) => n + statSync(`${MODELS}${f}`).size, 0)
    expect(bytes).toBeLessThanOrEqual(1.5 * 1024 * 1024)
  })
  it('has every version\'s colour, normal, and roughness maps, 1024 pixels square', () => {
    for (const v of VERSIONS) for (const k of ['color', 'normal', 'rough']) expect(webpSize(`${MODELS}${v}.${k}.webp`), `${v}.${k}`).toEqual([1024, 1024])
  })
  it('builds in both versions on one mesh', () => {
    const a = buildDetailedBird(SPEC, 'adult'), j = buildDetailedBird(SPEC, 'juvenile', a)
    expect(j.mesh.geometry).toBe(a.mesh.geometry)
    expect(j.mesh.material).not.toBe(a.mesh.material)
  })
})

describe('Double-crested Cormorant: structure (research 2.7, 5, 9)', () => {
  const M = measure(buildDetailedBird(SPEC))
  const mm = (v: number) => v * 1000
  it('measures as the research does: 0.60 m swimming, culmen 57, tarsus 65, wing 315, tail 165', () => {
    within(mm(M.length), 570, 630, 'length, bill tip to tail tip, swimming')
    within(mm(M.culmen), 55.9, 58.1, 'culmen')
    within(mm(M.billDepth), 15.5, 18.5, 'bill depth at the feather line')
    within(mm(M.tarsus), 63.7, 66.3, 'tarsus')
    within(mm(M.wingChord), 309, 321, 'wing chord')
    within(mm(M.tail), 162, 168, 'tail')
  })
  it('has a hooked bill: the nail curls 4-8 mm below the line of the culmen', () => {
    within(-mm(M.billTipRise), 4, 8, 'the hook')
  })
  it('has a head 0.165 m from the occiput to the bill tip, 2.9 culmens', () => {
    within(mm(M.head + M.culmen), 150, 180, 'head and bill')
  })
})

describe('Double-crested Cormorant: floating awash (research 6.2)', () => {
  const m = buildDetailedBird(SPEC)
  const M = measure(m)
  const mm = (v: number) => v * 1000
  it('rides low: the back 15-35 mm above the water, about four-fifths of the body\'s depth under', () => {
    within(mm(M.backAbove), 15, 35, 'back above the water')
    within(M.draft / (M.backAbove + M.draft), 0.7, 0.88, 'share of the depth under')
  })
  it('holds its neck up, the crown 140-190 mm above the water, its bill raised 5-25 degrees', () => {
    within(mm(M.crownAbove), 140, 190, 'crown above the water')
    within(deg(billAngleNow(posed(m))), 5, 25, 'the bill\'s angle')
  })
  it('lays its tail on the water: the tip within 10 mm of it', () => {
    within(mm(M.tailTipAbove), -10, 10, 'tail tip')
  })
  it('meets the water along 0.40-0.55 m with its tail', () => {
    within(mm(M.waterlineLength), 330, 520, 'waterline length (the body alone; the tail lies on the water past it)')
  })
})

describe('Double-crested Cormorant: perched (research 7.3)', () => {
  it('stands on its stump with its body 40 degrees up, its feet on the wood', () => {
    const m = posed(buildDetailedBird(SPEC), PERCHED)
    within(mm(Math.min(boneAt(m, 'toesR').y, boneAt(m, 'toesL').y)), 0, 15, 'the feet on the perch')
  })
  it('stands 0.50-0.62 m from perch to crown with its neck erect, 0.36-0.48 drawn in', () => {
    within(mm(crownNow(posed(buildDetailedBird(SPEC), { ...PERCHED, neckExtend: CORMORANT_PERCH.neck.high }))), 500, 620, 'erect')
    within(mm(crownNow(posed(buildDetailedBird(SPEC), { ...PERCHED, neckExtend: CORMORANT_PERCH.neck.low }))), 360, 480, 'drawn in')
  })
  it('props its tail on the perch: the tip within 20 mm of it', () => {
    within(mm(tailTipNow(posed(buildDetailedBird(SPEC), PERCHED)).y), -5, 20, 'tail tip above the perch')
  })
})

describe('Double-crested Cormorant: drying its wings (research 7.2)', () => {
  const m = posed(buildDetailedBird(SPEC), { ...PERCHED, dry: 1 })
  const tip = (side: 'L' | 'R') => {
    const a = authoredFor(SPEC).anatomy.flightWing!
    const local = a.tip.clone().sub(a.wrist)
    if (side === 'L') local.z = -local.z
    return local.applyMatrix4(m.mesh.skeleton.bones.find(b => b.name === `hand${side}`)!.matrixWorld)
  }
  it('raises its wrists to its shoulders or above, and hangs its hands below them', () => {
    for (const s of ['L', 'R'] as const) {
      expect(boneAt(m, `hand${s}`).y).toBeGreaterThanOrEqual(boneAt(m, `wing${s}`).y - 0.01)
      expect(tip(s).y).toBeLessThan(boneAt(m, `hand${s}`).y)
    }
  })
  it('opens each wing about three-quarters: 0.32-0.45 m from the shoulder to the tip (the photo\'s 0.39)', () => {
    within(mm(tip('R').distanceTo(boneAt(m, 'wingR'))), 320, 450, 'shoulder to tip')
  })
})

function mm(v: number): number { return v * 1000 }
```

Run: `npx vitest run src/birds/species/cormorant.test.ts`
Expected: FAIL: "No species spec for doccor".

- [ ] **Step 2: The species file.** `src/birds/species/doccor.ts`, registered in `index.ts`:
  - `code: 'doccor'`, `commonName: 'Double-crested Cormorant'`, `length: 0.6`, `posture: 'swimming'`, `draft` 0.8,
    `foraging: 'cormorant'`, `wingbeatHz: 5.2`; the block fields from the research's proportions (they are the block
    bird's, which no one sees once it is authored, but the schema needs them);
  - `variants: { adult: {}, juvenile: { ... } }` (the block plumage's colours from the research's table);
  - `marks` from the research's section 4.2: size "a long dark waterbird, between a duck and a goose, riding low",
    bill "a thin, hooked bill, about as long as the head, tilted up", head "a small head with an orange-yellow face and
    throat skin; a turquoise eye; no crests in autumn", body "black with a scaled bronze-brown back (adult), or brown with
    a pale buff throat and breast (juvenile)", legs "short black legs set far back; on a perch it stands upright on its
    tail";
  - `authored: { model: 'doccor', versions: ['adult', 'juvenile'], measurements (research 9), neck: 7, neckShapes: { hunch,
    erect, strike } (traced in Step 4), amphibious: true, flight: { beat (5.2 Hz's shapes, as the pelican's), glide,
    dry (set in Step 5) }, sources (each tracing photo's credit) }`.

- [ ] **Step 3: Load the models in the tests.** `src/birds/models.setup.ts`, a Vitest setup file (`vite.config.ts`'s
  `test.setupFiles`), loads every registered authored species' glb from `public/models/` with `loadAuthoredForTest`
  before the tests run, so any test that builds the whole cast (the ring budget, the cast's spawns) can build the
  cormorants. Without it they throw "its model hasn't loaded".

- [ ] **Step 4: Trace the neck.** In the viewer (`/viewer.html#a=doccor&float=1`), against the research's tracing photos
  (section 8): the swim shape at `neckExtend` 0.5 is as modelled; `erect` (1) puts the crown 0.23 m above the shoulders
  (perched, the research's 0.57 m from perch to crown); `hunch` (0) the tight S with the head on the shoulders (0.42 m);
  `strike` the dive's forward-and-down reach. If the model's rest shape can't reach the erect crown within the test's
  bounds by bending alone, give it `neckStretch` as the goose has, and record it.

- [ ] **Step 5: Set the drying pose.** `flight.dry`, against `doccor-spread-travis.jpg`, `doccor-spread.jpg`, and the
  game's `doccor.jpg`: wrists at shoulder height or above, hands hanging, the near wing 0.39 m from shoulder to tip. In the
  viewer at `afloat` 0, lean -0.7, `dry` 1, `tail propped` 1.

- [ ] **Step 6: See it pass.** `npx vitest run src/birds/species/cormorant.test.ts`: every test passes. A bound that
  misses means going back to the Blender build (Task 7's scripts) or the trace, not widening the bound; if a bound is
  wrong against the research, say so and change it with the research's section cited.

- [ ] **Step 7: The cast.** In `data/locations/lake.json`:

```json
    { "species": "doccor",  "behavior": "perch",   "zone": "stumps",    "count": 3, "plumage": { "adult": 2, "juvenile": 1 } },
    { "species": "doccor",  "behavior": "swim",    "zone": "cormorant-water", "count": 1, "plumage": "adult" }
```

  The cormorant joins `SILENT` in `src/audio/calls.ts` (no grunts without take-off and landing). `doccor` joins the ring
  budget's ringers in `src/birds/cast.test.ts`; run it on seeds 42, 7, and 11 at 60 fps and record the live rings' mean
  and peak against the 64.

- [ ] **Step 8: Look at it.** `npm run dev`, Begin: through the telescope at the stumps, three cormorants standing
  upright, tails propped, one drying its wings within the first minutes; the fisher on its water diving and coming up.
  Through the binoculars close in, beside the goose: the hooked bill, the orange face, the turquoise eye, the scaled back.
  Screenshot each with Playwright.

- [ ] **Step 9: Commit.**

```bash
git add src/birds src/audio data/locations/lake.json vite.config.ts scripts/blender/doccor public/models/doccor
git commit -m "feat: the Double-crested Cormorant, made in Blender: an adult and a bird of the year, amphibious, its neck traced, its drying pose set from the photos; three on the stumps and one fishing (Task 8)"
```

---

# Part 3: the finish

### Task 9: The main spec and README, performance, and the telescope

- [ ] **Step 1: The main spec.** `docs/superpowers/specs/2026-09-22-lakewatch-design.md` as this round's spec's "Changes
  to the Lakewatch design spec" section says: the swim and perch rows, the animation list, the composition and the
  stumps, the bird models (authored birds), the title card's count.
- [ ] **Step 2: The README.** How an authored bird is made (`scripts/blender/`, `blender -b -P`, what the glb must hold,
  where its files go) beside how a lofted one is.
- [ ] **Step 3: Performance.** As the goose round recorded: the title card's count, the time to Begin, the texture memory
  (the authored maps beside the atlases), and the frame rate through the telescope on the stumps, against the build before
  this round, headless and on the Iris Xe.
- [ ] **Step 4: The cormorant spec's "Changed during implementation" and "Known soft spots".**
- [ ] **Step 5: The user's telescope check.** The user looks at the cormorants in their own Chrome, beside the goose,
  and says whether the Blender bird looks better. That is the round's acceptance.
- [ ] **Step 6: Commit.**

```bash
git add docs README.md
git commit -m "docs: the cormorant in the design spec and README; what changed during implementation and the soft spots found; performance recorded (Task 9)"
```
