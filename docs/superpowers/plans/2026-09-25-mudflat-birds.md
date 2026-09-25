# Mudflat Birds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert Killdeer and Least Sandpiper to detailed, field-guide-plate birds on the existing pipeline, and give the mudflat's `probe` behavior two species-true feeding styles, a plover's and a sandpiper's, with legs that step and pecks that reach the mud.

**Architecture:** Species specs gain an optional `foraging` style that the spawner hands to the behavior. `probe` becomes two small state machines behind one factory, each with its own settings table, and both walk the legs by exactly the ground they cover. `PoseState` gains `reach`, and the detailed builder turns it into a neck swing and head pitch solved so the bill tip lands on the ground. Each bird is a new `detail` block (measurements, a traced profile, plumage layers) on the builder, painter, and viewer that the yellowlegs round built, plus two small gaps the tracing found: tails measured to their longest feather, and an eyelid ring painted on the eye.

**Tech Stack:** Vite 8, TypeScript 7, Vitest 5 (`environment: 'node'`), Three.js 0.186, zod 4.

**Spec:** `docs/superpowers/specs/2026-09-25-mudflat-birds-design.md` (read it first). Every number and mark for the two birds comes from `docs/research/2026-09-25-killdeer-least-sandpiper.md`. The detailed builder itself is in `docs/superpowers/specs/2026-09-24-detailed-birds-design.md` and its plan, `docs/superpowers/plans/2026-09-24-detailed-birds.md`.

**How this plan was checked:** every code block below ran in a scratch worktree of commit `8c012aa` before the plan was written. 528 tests passed (481 before), `tsc` was clean, and `vite build` was clean and left the viewer out of `dist/`. The game ran with four atlases at 66 ms each in the production build (5.3 MB). The viewer showed both birds traced onto their photos, their pecks reaching the ground, and their marks at 22 m through the telescope. If a step's output differs from what the plan says, stop and find out why rather than adjusting the test.

**Decisions made while planning (not in the spec, or refining it):**

- **`reach` is a `PoseState` field of its own, not `neckExtend` past 0.5.** The spec had the peck's reach ride on `neckExtend`. But `neckExtend` already means "stretched": flocks fly with it at 1, and the shared contract suite holds an extended neck's head above a tucked one's. `reach` (0..1) means "bill toward the ground"; pecks and the yellowlegs' strike set it, and the block builder ignores it.
- **The neck swings, not only the head.** Tipping the head alone left even a steeply leaning yellowlegs 4 cm short of its feet. The detailed pose now swings the neck forward and down (half at its base, half at mid-neck) until the bill would meet the ground pointing 63 degrees down, then tips the head so the tip lands exactly on it (`src/birds/detail/reach.ts`, pure and tested).
- **Peck leans.** A Least reaches the mud from a lean of 0.25 rad, so its peck leans 0.3. A Killdeer's short neck needs the body tipped 0.82 rad (47 degrees) with the neck stretched, which is how a plover dabs: tail up, head down.
- **Foraging numbers** are the research's section 10: plover runs of 0.3–1.2 m at 0.6 m/s, stops of 1–4 s, a dab after half of them; a sandpiper walking at 0.1 m/s, pecking 2.5 times a second, 2–5 probes on the spot, running at 0.4 m/s when more than 2 m from its flock. Most are estimates scaled from timed Ringed and Grey Plovers and one video; the research says which.
- **A plover turns on the spot, then dashes straight.** Turning while running made dashes longer than their distance.
- **`stepLength: 0.7` for both birds.** At 0.8 the stance foot starts to slide (the IK clamps); at 0.7 it stays put for every detailed species. That gives a walking Least 3.7 steps a second, matching the research's 3–4. A running Killdeer's legs still cycle about twice as fast as a real plover's, since the builder has no run gait; that stays a soft spot, as the spec says.
- **Killdeer's `length` is 0.22 m, not the published 25 cm.** Published lengths are neck-stretched specimens; both side-on photos, scaled by the culmen, measure 218–220 mm bill tip to tail tip.
- **The Killdeer is traced from the Homler photo, not the one the research preferred.** Both are side-on and agree on scale and length; the research's pick is a mid-stride bird with its head tipped down 31 degrees, while the Homler bird stands still and upright, which is the rest pose the model needs. Its mud-caked bill tip only makes the scale about 1 mm uncertain.
- **The Least is traced from the game's own photo**, which the research found is a spring adult: fine for structure. Its plumage comes from a juvenile reference photo.
- **Both traces run the spine low through the neck and head**, close to the throat. A plover's and a hunched sandpiper's head sits right on the neck, and a spine through the middle of the head creased the loft by up to 10 mm; the low spine creases nowhere.
- **The eyelid ring is painted on the eye, not the skin.** The painter measures skin in millimetres along the spine, and the low head spine turns so tightly that the crown side of the surface is stretched about 2.4 times, which turned a skin ring into a wide, low oval. `eye.lid` (a colour and a width) paints the ring on the eye's own rim instead.
- **A tail is measured to its longest feather.** The builder made a `wedge` tail's middle 15% longer than `measurements.tail`, which would fail the species measurement check for the Killdeer's graduated tail.
- **`regionStats` also returns the mean colour**, for the painted-mark checks on hue (eyelid, feather edges, legs).
- **Found, not fixed.** The Killdeer stands about 1 cm lower than its photo (4% of its height): the builder's upper leg is the belly depth plus the bare tibia, which undersizes a plover's long legs. A new leg model is out of scope.

## Global Constraints

- 60 fps on an integrated GPU in Chrome, with every bird on screen. A detailed bird is one draw call (plus its shadow pass) and about 6k triangles. Painting stays around 150 ms per atlas or less, and the dev overlay shows the time.
- Art direction: field-guide plate. Exact structure and painted field marks, no photo textures on any mesh. Patterns come from data (`detail.plumage`).
- The `BirdModel` interface does not change. `PoseState` gains `reach`, and `defaultPose()` sets it to 0. The block builder ignores it.
- Units: every size in `detail.measurements`, `detail.profile`, `detail.eye`, and `detail.wing.wrist` is in metres. Every pattern size in a layer (`width`, `radius`, `dx`, `length`, `spacing`) is in millimetres on the bird.
- Species specs are validated when the module loads. A bad `foraging` or `detail` block fails `npm test` and `npm run build`. A detailed species never falls back to blocks at runtime.
- Reference photos for tracing are downloaded outside the repo and never committed; each species' `sources` credits its photographer and licence. The catalog's own photos are already committed and credited.
- Vitest runs in `environment: 'node'`: no DOM, no WebGL. Rendering is checked by eye in the viewer and the game, with Playwright screenshots where a step asks for them.
- No harvest this round: no API keys, no network calls beyond downloading two reference photos.
- Every commit leaves `npm test` green. Never commit `node_modules`, `.env`, `dist`, `data/raw`, `.wrangler`, or `.playwright-mcp`.

## Review Focus

Inputs the spec implies but no task's own tests would otherwise exercise, each pinned to a test in the owning task:

1. **A plover in a patch smaller than its dash.** The zone edge must end a run, not trap the bird in `run` forever or make it jitter, and the legs must still walk exactly the ground covered (Task 3, `probe.test.ts` "keeps feeding in a patch smaller than its dash").
2. **A bird whose head can't reach the ground** (long legs, little lean). The bill must end pointing down, short of the ground, never flipped, stretched, or `NaN` (Task 2, `build.test.ts` "a short neck leaves it above the ground", and the clamp test with `reach` 5 and -1).
3. **A lean so deep it would push the bill under the ground.** The head must lift the bill back onto the ground rather than bury it (Task 2, `reach.test.ts` "lifts the bill back onto the ground").
4. **A species file whose step is too long for its legs.** The stance foot would slide in the game; `npm test` must fail and name the species (Task 6, `species.test.ts` "every detailed species keeps its stance foot planted").
5. **A hand-edited viewer link with a walking speed outside its range**, such as `speed=9` or `speed=0`. It must clamp to 0.05..2 m/s, not to the 0..1 the other sliders use (Task 4, `state.test.ts` "clamps the walking speed to its own range").

---

### Task 1: A foraging style on the species, handed to its behavior

**Files:**
- Modify: `src/birds/spec.ts`, `src/birds/spec.test.ts`, `src/behavior/types.ts`, `src/birds/spawn.ts`, `src/birds/spawn.test.ts`, `src/birds/species/killde.ts`, `src/birds/species/leasan.ts`

**Interfaces:**
- Consumes: `speciesSpecSchema` (`src/birds/spec.ts`), `BehaviorContext` (`src/behavior/types.ts`), `hasSpec`, `getSpec` (`src/birds/species/index.ts`, already imported by `spawn.ts`).
- Produces:

```ts
// src/birds/spec.ts
/** how a species feeds when the cast puts it on `probe` */
export const FORAGING = ['plover', 'sandpiper'] as const
export type Foraging = (typeof FORAGING)[number]
// SpeciesSpec gains:  foraging?: Foraging

// src/behavior/types.ts, BehaviorContext gains:
/** how a probing bird feeds; probe treats a missing style as sandpiper */
foraging?: Foraging

// src/birds/spawn.ts
/** What a species brings to its behavior: its wingbeat, and how it feeds. A species with no spec flaps at 5 Hz. */
export function speciesTraits(code: string): Pick<BehaviorContext, 'wingbeatHz' | 'foraging'>
```

`killde` is a `plover` and `leasan` a `sandpiper` from this task on, while both are still block models; the style belongs to the species, not to its model. Nothing reads the field until Task 3.

- [ ] **Step 1: Write the failing tests**

In `src/birds/spec.test.ts`, insert before `it('requires every field mark', () => {`:

```ts
  it('takes a foraging style, and rejects one it does not know', () => {
    expect(parseSpeciesSpec({ ...coot, foraging: 'plover' }).foraging).toBe('plover')
    expect(parseSpeciesSpec(coot).foraging).toBeUndefined()
    expect(() => parseSpeciesSpec({ ...coot, foraging: 'heron' })).toThrow(/foraging/)
  })
```

In `src/birds/spawn.test.ts`, change the first import to

```ts
import { expandCast, flockEntries, spawnCast, speciesTraits, DEFAULT_FLOCK_EVERY, type SpawnEvents } from './spawn'
```

and insert before `describe('flockEntries', () => {`:

```ts
describe('speciesTraits', () => {
  it("hands a behavior the species' wingbeat and foraging style", () => {
    expect(speciesTraits('killde')).toEqual({ wingbeatHz: 7, foraging: 'plover' })
    expect(speciesTraits('leasan')).toEqual({ wingbeatHz: 9, foraging: 'sandpiper' })
    expect(speciesTraits('greyel').foraging).toBeUndefined()
    expect(speciesTraits('nosuchbird')).toEqual({ wingbeatHz: 5 })
  })
})

```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/birds/spec.test.ts src/birds/spawn.test.ts`
Expected: the two new tests FAIL. zod strips the unknown `foraging` key, so the first reads `undefined` and `'heron'` does not throw; `speciesTraits` is not a function.

- [ ] **Step 3: The field, the context, and the traits**

In `src/birds/spec.ts`, insert before `export const MARK_KEYS`:

```ts
/** how a species feeds when the cast puts it on `probe` */
export const FORAGING = ['plover', 'sandpiper'] as const
export type Foraging = (typeof FORAGING)[number]

```

and in `speciesSpecSchema`, after `wingbeatHz: z.number().positive(),`, add

```ts
  foraging: z.enum(FORAGING).optional(),
```

In `src/behavior/types.ts`, add `import type { Foraging } from '../birds/spec'` after the `PoseState` import, and in `BehaviorContext`, after `wingbeatHz?: number`, add

```ts
  /** how a probing bird feeds; probe treats a missing style as sandpiper */
  foraging?: Foraging
```

In `src/birds/spawn.ts`, insert before `interface LiveBird {`:

```ts
/** What a species brings to its behavior: its wingbeat, and how it feeds. A species with no spec flaps at 5 Hz. */
export function speciesTraits(code: string): Pick<BehaviorContext, 'wingbeatHz' | 'foraging'> {
  if (!hasSpec(code)) return { wingbeatHz: 5 }
  const spec = getSpec(code)
  return { wingbeatHz: spec.wingbeatHz, foraging: spec.foraging }
}

```

and in `spawnCast`'s context literal replace

```ts
      wingbeatHz: hasSpec(ind.species) ? getSpec(ind.species).wingbeatHz : 5,
```

with

```ts
      ...speciesTraits(ind.species),
```

In `src/birds/species/killde.ts`, after `wingbeatHz: 7,` add `foraging: 'plover',`. In `src/birds/species/leasan.ts`, after `wingbeatHz: 9,` add `foraging: 'sandpiper',`.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/birds src/behavior && npx tsc -p tsconfig.json`
Expected: all PASS, and `tsc` prints nothing.

- [ ] **Step 5: Commit**

```bash
git add src/birds/spec.ts src/birds/spec.test.ts src/behavior/types.ts src/birds/spawn.ts src/birds/spawn.test.ts src/birds/species/killde.ts src/birds/species/leasan.ts
git commit -m "feat: a foraging style on the species; Killdeer is a plover, Least Sandpiper a sandpiper"
```

---

### Task 2: A peck that reaches the ground

**Files:**
- Create: `src/birds/detail/reach.ts`, `src/birds/detail/reach.test.ts`
- Modify: `src/birds/model.ts`, `src/birds/detail/gait.ts`, `src/birds/detail/build.ts`, `src/birds/detail/measure.ts`, `src/birds/detail/build.test.ts`, `src/behavior/wade.ts`, `src/behavior/wade.test.ts`

**Interfaces:**
- Consumes: `PoseState`, `defaultPose` (`src/birds/model.ts`); `buildDetailedBird`'s bones, `joints`, `bill`, `at()` and `group` (all in scope inside `buildDetailedBird`); `V2` (`src/birds/detail/gait.ts`); `approach` (already imported by `wade.ts`).
- Produces:

```ts
// src/birds/model.ts, added to PoseState after gait
/** 0 .. 1, how far a peck or strike has reached toward the ground; at 1 the bill tip is on it */
reach: number
// defaultPose() returns reach: 0

// src/birds/detail/gait.ts (was module-private)
/** smoothstep on 0..1 */
export const smooth: (w: number) => number

// src/birds/detail/reach.ts
export const PECK_BILL_ANGLE = -1.1          // radians below level at the bottom of a peck
export const MAX_NECK_SWING = 1.8
export interface Neck { base: V2; l1: number; a1: number; l2: number; a2: number; reach: number; tipAngle: number }
export function neckSwing(n: Neck, max?: number): number
export function headPitchToGround(head: V2, tip: V2): number

// src/birds/detail/measure.ts
/** Where the bill tip is now, in group space (the feet stand on y = 0), after the model's last pose(). */
export function billTipNow(model: DetailedBirdModel): THREE.Vector3
```

Why a field of its own, not `neckExtend`: `neckExtend` means "stretched" (a goose flies with it at 1, and the contract suite holds an extended neck's head above a tucked one's). `reach` means "bill toward the ground". The detailed builder reads it; the block builder ignores it.

How the detailed pose reaches: with the body leaned and the neck posed as today, `neckSwing` finds how far to swing the neck forward and down (half at its base, half at mid-neck, so it bends evenly) for the bill to meet the ground when it points 63 degrees down; then `headPitchToGround` tips the head so the tip lands exactly on the ground. If the lean already brings it there, the neck doesn't swing and the head only tips as far as needed, or lifts, if a deep lean would push the bill under. If even the full swing falls short, the bill ends straight down. `reach` blends from none to all of that through a smoothstep.

- [ ] **Step 1: Write the failing tests for the solver**

`src/birds/detail/reach.test.ts`:

```ts
import { neckSwing, headPitchToGround, MAX_NECK_SWING, type Neck } from './reach'

/** the bill tip's height for a neck swung by `s`, the way neckSwing models it */
const tipY = (n: Neck, s: number) => n.base.y + n.l1 * Math.sin(n.a1 - s / 2) + n.l2 * Math.sin(n.a2 - s) + n.reach * Math.sin(n.tipAngle)

// an upright neck: two 0.03 m segments from a base `baseY` up, and 0.04 m of head and bill pointing 63 degrees down
const neck = (baseY: number, a1 = 1.3, a2 = 1.4): Neck => ({ base: { x: 0, y: baseY }, l1: 0.03, a1, l2: 0.03, a2, reach: 0.04, tipAngle: -1.1 })

describe('neckSwing', () => {
  it('swings the neck just far enough for the bill tip to meet the ground', () => {
    const n = neck(0.03)
    const s = neckSwing(n)
    expect(s).toBeGreaterThan(0)
    expect(s).toBeLessThan(MAX_NECK_SWING)
    expect(tipY(n, s)).toBeCloseTo(0, 6)
  })
  it('does not swing when the tip already reaches', () => {
    expect(neckSwing(neck(0.03, -0.5, -0.5))).toBe(0)       // already reaching down
  })
  it('swings all the way when even that leaves the tip short', () => {
    expect(neckSwing(neck(0.1))).toBe(MAX_NECK_SWING)
  })
  it('takes the first swing that gets there, not a later one', () => {
    const n = neck(0.03)
    const s = neckSwing(n)
    for (let k = 0; k < 20; k++) expect(tipY(n, (s * k) / 20)).toBeGreaterThan(0)
  })
})

describe('headPitchToGround', () => {
  it('pitches the bill down onto the ground when it can reach', () => {
    const head = { x: 0, y: 0.03 }, tip = { x: 0.04, y: 0.03 }
    const p = headPitchToGround(head, tip)
    const a = Math.atan2(0, 0.04) - p
    expect(head.y + 0.04 * Math.sin(a)).toBeCloseTo(0, 9)
  })
  it('points the bill straight down when the ground is out of reach', () => {
    expect(headPitchToGround({ x: 0, y: 0.1 }, { x: 0.04, y: 0.1 })).toBeCloseTo(Math.PI / 2, 9)
  })
  it('lifts the bill back onto the ground when a deep lean would push it under', () => {
    const head = { x: 0, y: 0.01 }, tip = { x: 0.02, y: -0.01 }
    const p = headPitchToGround(head, tip)
    expect(p).toBeLessThan(0)
    const a = Math.atan2(-0.02, 0.02) - p
    expect(head.y + Math.hypot(0.02, 0.02) * Math.sin(a)).toBeCloseTo(0, 9)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/birds/detail/reach.test.ts`
Expected: FAIL, `Cannot find module './reach'` (or "Failed to resolve import").

- [ ] **Step 3: The solver**

`src/birds/detail/reach.ts`:

```ts
import type { V2 } from './gait'

/** where the bill points at the bottom of a peck or strike: 63 degrees below horizontal */
export const PECK_BILL_ANGLE = -1.1
/** the most the neck swings down to reach, radians */
export const MAX_NECK_SWING = 1.8

/** The neck at the moment of reaching, in group space: two segments from `base`, and what hangs off the end. */
export interface Neck {
  base: V2
  /** neck base to mid-neck, and mid-neck to the head joint: lengths and angles (radians, from +x) */
  l1: number; a1: number
  l2: number; a2: number
  /** head joint to bill tip, and that line's angle when the bill points at PECK_BILL_ANGLE */
  reach: number; tipAngle: number
}

/**
 * How far to swing the neck down (radians) so the bill tip meets the ground (y = 0). The swing turns the first
 * segment by half of it and the second by all of it, so the neck bends evenly along its length. Returns 0 if the tip
 * already reaches the ground, and `max` if even the full swing leaves it above.
 */
export function neckSwing(n: Neck, max = MAX_NECK_SWING): number {
  const y = (s: number) => n.base.y + n.l1 * Math.sin(n.a1 - s / 2) + n.l2 * Math.sin(n.a2 - s) + n.reach * Math.sin(n.tipAngle)
  if (y(0) <= 0) return 0
  // the first swing that gets there: scan for the sign change, then halve the bracket
  const steps = 24
  let lo = 0
  for (let i = 1; i <= steps; i++) {
    const hi = (max * i) / steps
    if (y(hi) <= 0) {
      let a = lo, b = hi
      for (let k = 0; k < 30; k++) { const m = (a + b) / 2; if (y(m) > 0) a = m; else b = m }
      return (a + b) / 2
    }
    lo = hi
  }
  return max
}

/**
 * How far to pitch the head down (radians; negative lifts it) so the bill tip, now at `tip`, swings about the head
 * joint `head` onto the ground (y = 0): down when it is short, up when a deep lean would push it under. If the
 * ground is further than the tip can swing, the bill ends pointing straight down.
 */
export function headPitchToGround(head: V2, tip: V2): number {
  const dx = tip.x - head.x, dy = tip.y - head.y
  const r = Math.hypot(dx, dy)
  if (r === 0) return 0
  return Math.atan2(dy, dx) - Math.asin(Math.min(1, Math.max(-1, -head.y / r)))
}
```

- [ ] **Step 4: Run the solver tests**

Run: `npx vitest run src/birds/detail/reach.test.ts`
Expected: 7 PASS.

- [ ] **Step 5: Write the failing tests for the pose and the strike**

In `src/birds/detail/build.test.ts`, change `import { measure } from './measure'` to `import { measure, billTipNow } from './measure'`. In `it('clamps out-of-range pose values instead of breaking the bird', ...)`, replace the two `cases` rows with

```ts
      [{ neckExtend: 3, wingSpread: -1, gait: 4, reach: 5 }, { neckExtend: 1, wingSpread: 0, gait: 1, reach: 1 }],
      [{ neckExtend: -2, wingSpread: 2.5, gait: -3, reach: -1 }, { neckExtend: 0, wingSpread: 1, gait: 0, reach: 0 }],
```

and insert before `it('refuses what it cannot build', () => {`:

```ts
  it('reaches the bill tip to the ground at full reach, whenever the neck is long enough', () => {
    const m = buildDetailedBird(TEST_SPEC)
    for (const lean of [0.8, 1.0]) {
      const p = defaultPose(); p.lean.x = lean; p.reach = 1
      m.pose(p)
      expect(billTipNow(m).y, `lean ${lean}`).toBeCloseTo(0, 4)
    }
  })
  it('reaches down smoothly: the tip falls as reach rises, and a short neck leaves it above the ground', () => {
    const m = buildDetailedBird(TEST_SPEC)
    const ys = [0, 0.25, 0.5, 0.75, 1].map(reach => { m.pose({ ...defaultPose(), reach }); return billTipNow(m).y })
    for (let i = 1; i < ys.length; i++) expect(ys[i]!).toBeLessThan(ys[i - 1]!)
    expect(ys.at(-1)!).toBeGreaterThan(0)                    // standing upright, a yellowlegs can't reach its feet
  })
  it('does nothing at reach 0: the rest pose is the traced bird', () => {
    const m = buildDetailedBird(TEST_SPEC)
    m.pose(defaultPose())
    expect(billTipNow(m).distanceTo(m.anatomy.billTip)).toBeLessThan(1e-9)
  })
```

In `src/behavior/wade.test.ts`, replace the whole `it('strikes: neck extends fast then returns', ...)` test with

```ts
  it('strikes: neck extends and reaches down fast, then returns', () => {
    const c = createWade(ctx(3), 0, 0)
    const pose = defaultPose()
    let guard = 0
    while (c.state !== 'strike' && guard++ < 100000) c.update(1 / 30, pose)
    expect(c.state).toBe('strike')
    c.update(0.15, pose)
    expect(pose.neckExtend).toBeGreaterThan(0.9)
    expect(pose.reach).toBeGreaterThan(0.9)
    while (c.state === 'strike' && guard++ < 100000) c.update(1 / 30, pose)
    for (let i = 0; i < 60; i++) c.update(1 / 30, pose)
    expect(pose.reach).toBeLessThan(0.05)
  })
```

- [ ] **Step 6: Run to verify they fail**

Run: `npx vitest run src/birds/detail/build.test.ts src/behavior/wade.test.ts`
Expected: the three new build tests and the strike test FAIL: `billTipNow` is not a function, and `pose.reach` is `undefined`. The clamp test still passes, since today's builder ignores `reach`; it guards the new code once it lands.

- [ ] **Step 7: The field, the helper, and the reach**

In `src/birds/model.ts`, add to `PoseState` after `gait`:

```ts
  /** 0 .. 1, how far a peck or strike has reached toward the ground; at 1 the bill tip is on it */
  reach: number
```

and in `defaultPose()` change `strideDistance: 0, gait: 0 }` to `strideDistance: 0, gait: 0, reach: 0 }`.

In `src/birds/detail/gait.ts`, replace `const smooth = (w: number) => w * w * (3 - 2 * w)` with

```ts
/** smoothstep on 0..1 */
export const smooth = (w: number) => w * w * (3 - 2 * w)
```

In `src/birds/detail/measure.ts`, add `import * as THREE from 'three'` as the first line, and append:

```ts

/** Where the bill tip is now, in group space (the feet stand on y = 0), after the model's last pose(). */
export function billTipNow(model: DetailedBirdModel): THREE.Vector3 {
  model.group.updateMatrixWorld(true)
  const toGroup = model.group.matrixWorld.clone().invert()
  // the bill bone sits at the bill base and carries no rotation at rest
  return model.anatomy.billTip.clone().sub(model.anatomy.billBase).applyMatrix4(model.parts.bill.matrixWorld).applyMatrix4(toGroup)
}
```

In `src/birds/detail/build.ts`, replace `import { legOffsets, solveLeg } from './gait'` with

```ts
import { legOffsets, solveLeg, smooth } from './gait'
import { neckSwing, headPitchToGround, PECK_BILL_ANGLE } from './reach'
```

After the line `const bodyLength = profile.length`, add:

```ts
  // for the reach: the bill tip from the head joint (the head bone carries no rotation at rest), and that line's
  // angle off the bill's own
  const headToTip = at(bill.tip).sub(joints.head)
  const tipReach = Math.hypot(headToTip.x, headToTip.y)
  const tipOffAxis = Math.atan2(headToTip.y, headToTip.x) - Math.atan2(bill.dir.y, bill.dir.x)
  const toGroup = new THREE.Matrix4()
  const pN = new THREE.Vector3(), pM = new THREE.Vector3(), pH = new THREE.Vector3(), pT = new THREE.Vector3()
  const inGroup = (b: THREE.Bone, out: THREE.Vector3) => b.getWorldPosition(out).applyMatrix4(toGroup)

  /**
   * A peck or strike reaching down (`w` 0..1): the neck swings forward and down, enough for the bill to meet the
   * ground (y = 0 in group space) when it points PECK_BILL_ANGLE below level, and then the head tips the bill onto
   * the ground: less far if it already reaches, straight down if even the full swing leaves it short, and back up
   * if a deep lean would push it under.
   */
  function reachDown(w: number) {
    group.updateMatrixWorld(true)
    toGroup.copy(group.matrixWorld).invert()
    inGroup(bones.neck, pN); inGroup(bones.neckMid, pM); inGroup(bones.head, pH)
    const swing = neckSwing({
      base: pN,
      l1: Math.hypot(pM.x - pN.x, pM.y - pN.y), a1: Math.atan2(pM.y - pN.y, pM.x - pN.x),
      l2: Math.hypot(pH.x - pM.x, pH.y - pM.y), a2: Math.atan2(pH.y - pM.y, pH.x - pM.x),
      reach: tipReach, tipAngle: PECK_BILL_ANGLE + tipOffAxis,
    })
    bones.neck.rotation.z -= (w * swing) / 2
    bones.neckMid.rotation.z = -(w * swing) / 2
    group.updateMatrixWorld(true)
    inGroup(bones.head, pH)
    pT.copy(headToTip).applyMatrix4(bones.head.matrixWorld).applyMatrix4(toGroup)
    bones.head.rotation.z -= w * headPitchToGround(pH, pT)
  }
```

In `pose()`, after `bones.head.position.x += st.headBob * bodyLength`, add:

```ts
    bones.neckMid.rotation.z = 0
    const reach = THREE.MathUtils.clamp(st.reach, 0, 1)
    if (reach > 0) reachDown(smooth(reach))
```

In `src/behavior/wade.ts`, drive `reach` with the strike. In the `step` branch, after `pose.neckExtend = approach(pose.neckExtend, 0.55, 2, dt)`, add `pose.reach = approach(pose.reach, 0, 3, dt)`. In the `strike` branch, after its `pose.neckExtend = ...` line, add

```ts
        pose.reach = approach(pose.reach, striking ? 1 : 0, striking ? 40 : 3, dt)
```

In the final (still) branch, after its `pose.neckExtend = ...` line, add `pose.reach = approach(pose.reach, 0, 3, dt)`.

- [ ] **Step 8: Run the tests**

Run: `npm test && npx tsc -p tsconfig.json`
Expected: all PASS, and `tsc` prints nothing. Every other `PoseState` in the code base spreads `defaultPose()`, so none needs the new field by hand. Task 4's viewer step is where the reach is first seen.

- [ ] **Step 9: Commit**

```bash
git add src/birds/model.ts src/birds/detail/gait.ts src/birds/detail/reach.ts src/birds/detail/reach.test.ts src/birds/detail/build.ts src/birds/detail/measure.ts src/birds/detail/build.test.ts src/behavior/wade.ts src/behavior/wade.test.ts
git commit -m "feat: PoseState gains reach; a detailed bird's peck swings the neck down until the bill meets the ground"
```

---

### Task 3: `probe`, in two styles

**Files:**
- Modify (rewrite): `src/behavior/probe.ts`, `src/behavior/probe.test.ts`

**Interfaces:**
- Consumes: `BehaviorContext.foraging` (Task 1); `PoseState.reach` (Task 2); `turnToward`, `approach`, `polygonOf` (`src/behavior/types.ts`); `randomPointInPolygon`, `clampToPolygon` (`src/location/zones.ts`); `Foraging` (`src/birds/spec.ts`).
- Produces:

```ts
// src/behavior/probe.ts
/** each style's settings, from the research's section 10 */
export const STYLES: {
  plover: {
    run: { speed: number; distance: [number, number] }
    look: { seconds: [number, number]; lean: number; neckExtend: number; peckChance: number }
    peck: { seconds: number; lean: number; neckExtend: number }
  }
  sandpiper: {
    walk: { speed: number; distance: [number, number]; pecksPerSecond: number }
    probe: { count: [number, number]; perSecond: number; chance: number }
    peck: { lean: number; neckExtend: number }
    run: { speed: number; whenFarther: number }
    flock: { radius: number; retargetSeconds: number }
  }
}
/** the pose at the bottom of each style's peck; Task 7's test applies it to the built birds */
export const PECK_BOTTOM: Record<Foraging, { lean: number; neckExtend: number; reach: number }>
export function createProbe(ctx: BehaviorContext, startX: number, startZ: number): BehaviorController   // signature unchanged
```

- A plover's `state` is `'run' | 'look' | 'peck'`; a sandpiper's is `'walk' | 'peck' | 'run'`. A context with no `foraging` feeds as a sandpiper.
- A plover ignores `ctx.group`; each bird picks its own spots, as Killdeer spread out when they feed.
- A sandpiper keeps today's shared group target, retargeted every 45 s, so the five Least Sandpipers feed as a loose bunch.
- Both styles add exactly the ground covered (after the zone clamp) to `pose.strideDistance`, and ease `pose.gait` toward 1 while moving and toward 0 when still (rate 10).

- [ ] **Step 1: Write the failing tests**

Replace `src/behavior/probe.test.ts` with:

```ts
import { createProbe, STYLES, PECK_BOTTOM } from './probe'
import { defaultPose, type PoseState } from '../birds/model'
import { makeRng } from '../catalog/rng'
import { pointInPolygon } from '../location/zones'
import type { BehaviorContext, BehaviorController } from './types'
import type { Foraging } from '../birds/spec'

const zone = { kind: 'polygon' as const, points: [[0, 0], [20, 0], [20, 10], [0, 10]] as [number, number][] }
const makeGroup = () => ({ targetX: 10, targetZ: 5, retargetAt: 0 })
const ctx = (seed: number, more: Partial<BehaviorContext> = {}): BehaviorContext => ({
  zone, rng: makeRng(seed), wind: () => ({ dirX: 0, dirZ: 0, effective: 0 }), ground: () => 0.05, group: makeGroup(), ...more,
})

interface Frame { state: string; moved: number; leanX: number; leanZ: number; reach: number; gait: number }

/** Run a controller for `seconds` at 30 fps, one record per frame, under the state it was in as the frame began. */
function record(c: BehaviorController, seconds: number, pose: PoseState = defaultPose()): Frame[] {
  const frames: Frame[] = []
  let px = c.x, pz = c.z
  for (let i = 0; i < seconds * 30; i++) {
    const state = c.state
    c.update(1 / 30, pose)
    expect(pointInPolygon(c.x, c.z, zone.points)).toBe(true)
    frames.push({ state, moved: Math.hypot(c.x - px, c.z - pz), leanX: pose.lean.x, leanZ: pose.lean.z, reach: pose.reach, gait: pose.gait })
    px = c.x; pz = c.z
  }
  return frames
}

/** Consecutive frames in the same state. */
function spells(frames: Frame[]): { state: string; frames: Frame[] }[] {
  const out: { state: string; frames: Frame[] }[] = []
  for (const f of frames) {
    if (out.at(-1)?.state === f.state) out.at(-1)!.frames.push(f)
    else out.push({ state: f.state, frames: [f] })
  }
  return out
}

describe('probe, either style', () => {
  for (const foraging of ['plover', 'sandpiper'] as const) {
    it(`${foraging}: walks its legs by exactly the ground it covers`, () => {
      const c = createProbe(ctx(1, { foraging }), 5, 5)
      const pose = defaultPose()
      const frames = record(c, 90, pose)
      const walked = frames.reduce((s, f) => s + f.moved, 0)
      expect(walked).toBeGreaterThan(1)
      expect(pose.strideDistance).toBeCloseTo(walked, 9)
    })
    it(`${foraging}: gait rises while it moves and falls when it stops`, () => {
      const frames = record(createProbe(ctx(2, { foraging }), 5, 5), 90)
      for (const s of spells(frames)) {
        const last = s.frames.at(-1)!
        if (s.frames.length < 15) continue
        if (s.frames.every(f => f.moved > 0)) expect(last.gait, s.state).toBeGreaterThan(0.9)
        if (s.frames.every(f => f.moved === 0)) expect(last.gait, s.state).toBeLessThan(0.05)
      }
    })
    it(`${foraging}: ruffles in a gust only while standing`, () => {
      const windy = ctx(3, { foraging, wind: () => ({ dirX: 0, dirZ: 0, effective: 1 }) })
      const frames = record(createProbe(windy, 5, 5), 90)
      const still = spells(frames).filter(s => s.frames.length > 20 && s.frames.every(f => f.moved === 0))
      expect(still.length).toBeGreaterThan(0)
      for (const s of still) expect(s.frames.at(-1)!.leanZ).toBeGreaterThan(0.015)
      for (const f of frames.filter(f => f.moved > 0)) expect(f.leanZ).toBeLessThan(0.035)
    })
  }
  it('feeds as a sandpiper when the species has no style', () => {
    const states = new Set(record(createProbe(ctx(4), 5, 5), 60).map(f => f.state))
    expect([...states].every(s => ['walk', 'peck', 'run'].includes(s))).toBe(true)
  })
})

describe('probe, plover', () => {
  const S = STYLES.plover
  const frames = record(createProbe(ctx(5, { foraging: 'plover' }), 5, 5), 300)
  const all = spells(frames)

  it('runs, stops to look, and sometimes pecks', () => {
    expect(new Set(frames.map(f => f.state))).toEqual(new Set(['run', 'look', 'peck']))
  })
  it('runs a short dash each time', () => {
    const runs = all.filter(s => s.state === 'run').map(s => s.frames.reduce((d, f) => d + f.moved, 0))
    expect(runs.length).toBeGreaterThan(10)
    for (const d of runs) expect(d).toBeLessThanOrEqual(S.run.distance[1] + 1e-6)
    expect(runs.reduce((a, b) => a + b, 0) / runs.length).toBeGreaterThan(S.run.distance[0])
  })
  it('stands still and upright while it looks', () => {
    for (const s of all.filter(s => s.state === 'look')) {
      for (const f of s.frames) expect(f.moved).toBe(0)
      if (s.frames.length > 15) expect(s.frames.at(-1)!.leanX).toBeLessThanOrEqual(0)
    }
  })
  it('reaches the bottom of its peck halfway through', () => {
    const pecks = all.filter(s => s.state === 'peck')
    expect(pecks.length).toBeGreaterThan(3)
    for (const s of pecks) {
      const bottom = s.frames.reduce((a, f) => (f.reach > a.reach ? f : a))
      expect(bottom.reach).toBeGreaterThan(0.97)
      expect(bottom.leanX).toBeCloseTo(PECK_BOTTOM.plover.lean, 1)
      expect(s.frames.at(-1)!.reach).toBeLessThan(0.3)
    }
  })
  it('keeps feeding in a patch smaller than its dash: the edge ends a run, never traps it', () => {
    const patch = { kind: 'polygon' as const, points: [[0, 0], [0.4, 0], [0.4, 0.4], [0, 0.4]] as [number, number][] }
    const c = createProbe({ ...ctx(12, { foraging: 'plover' }), zone: patch }, 0.2, 0.2)
    const pose = defaultPose()
    const seen: string[] = []
    let walked = 0, px = c.x, pz = c.z
    for (let i = 0; i < 60 * 30; i++) {
      c.update(1 / 30, pose)
      expect(pointInPolygon(c.x, c.z, patch.points)).toBe(true)
      walked += Math.hypot(c.x - px, c.z - pz); px = c.x; pz = c.z
      if (seen.at(-1) !== c.state) seen.push(c.state)
    }
    expect(seen.filter(s => s === 'run').length).toBeGreaterThan(5)
    expect(pose.strideDistance).toBeCloseTo(walked, 9)
  })
  it('feeds on its own: it leaves the flock target alone', () => {
    const group = makeGroup()
    record(createProbe(ctx(6, { foraging: 'plover', group }), 5, 5), 120)
    expect(group).toEqual(makeGroup())
  })
})

describe('probe, sandpiper', () => {
  it('walks and pecks as it goes, and stops for a few probes', () => {
    const frames = record(createProbe(ctx(7, { foraging: 'sandpiper' }), 10, 5), 240)
    const walking = frames.filter(f => f.state === 'walk' && f.moved > 0)
    expect(walking.length).toBeGreaterThan(600)
    expect(Math.max(...walking.map(f => f.reach))).toBeGreaterThan(0.95)
    expect(Math.min(...walking.map(f => f.reach))).toBeLessThan(0.05)
    const probes = spells(frames).filter(s => s.state === 'peck')
    expect(probes.length).toBeGreaterThan(3)
    for (const s of probes) for (const f of s.frames) expect(f.moved).toBe(0)
  })
  it('pecks with its body tipped forward to the peck-bottom lean', () => {
    const frames = record(createProbe(ctx(8, { foraging: 'sandpiper' }), 10, 5), 60)
    const deep = frames.filter(f => f.reach > 0.97)
    expect(deep.length).toBeGreaterThan(0)
    for (const f of deep.slice(5)) expect(f.leanX).toBeCloseTo(PECK_BOTTOM.sandpiper.lean, 1)
  })
  it('runs to catch up when the flock is far off, then walks again', () => {
    const group = { targetX: 18, targetZ: 8, retargetAt: 1e9 }
    const frames = record(createProbe(ctx(9, { foraging: 'sandpiper', group }), 2, 2), 60)
    expect(frames[0]!.state).toBe('run')
    expect(frames.at(-1)!.state).not.toBe('run')
  })
  it('keeps with the flock: members converge on the shared target', () => {
    const group = makeGroup()
    const a = createProbe(ctx(10, { foraging: 'sandpiper', group }), 1, 1)
    const b = createProbe(ctx(11, { foraging: 'sandpiper', group }), 19, 9)
    for (let t = 0; t < 40; t += 1 / 30) { a.update(1 / 30, defaultPose()); b.update(1 / 30, defaultPose()) }
    expect(Math.hypot(a.x - group.targetX, a.z - group.targetZ)).toBeLessThan(4)
    expect(Math.hypot(b.x - group.targetX, b.z - group.targetZ)).toBeLessThan(4)
  })
})

describe('PECK_BOTTOM', () => {
  it('has a style for every foraging kind, each reaching all the way', () => {
    for (const k of ['plover', 'sandpiper'] as Foraging[]) expect(PECK_BOTTOM[k].reach).toBe(1)
  })
})
```

The recorder files each frame under the state it was in as the frame began, since a frame that ends a run has already moved.

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/behavior/probe.test.ts`
Expected: FAIL. The file doesn't load, with `TypeError: Cannot read properties of undefined (reading 'plover')`: today's `probe.ts` exports no `STYLES`.

- [ ] **Step 3: The behavior**

Replace `src/behavior/probe.ts` with:

```ts
import type { BehaviorContext, BehaviorController } from './types'
import { turnToward, approach, polygonOf } from './types'
import { randomPointInPolygon, clampToPolygon } from '../location/zones'
import type { PoseState } from '../birds/model'
import type { Foraging } from '../birds/spec'

/**
 * How each foraging style moves, from docs/research/2026-09-25-killdeer-least-sandpiper.md, section 10 (most values
 * are estimates scaled from timed plovers and one video; see there). A plover hunts by eye: it runs a short way,
 * stops dead with its head up, and now and then tips forward for a single dab. A sandpiper feels for food: it walks
 * slowly with its bill going down and up, stops for a few quick probes, and runs to keep up with its flock.
 */
export const STYLES = {
  plover: {
    run: { speed: 0.6, distance: [0.3, 1.2] as [number, number] },
    look: { seconds: [1, 4] as [number, number], lean: -0.05, neckExtend: 0.55, peckChance: 0.5 },
    // a plover's short neck reaches the ground only with the body tipped well forward and the neck stretched
    peck: { seconds: 0.4, lean: 0.82, neckExtend: 1 },
  },
  sandpiper: {
    walk: { speed: 0.1, distance: [0.15, 0.6] as [number, number], pecksPerSecond: 2.5 },
    probe: { count: [2, 5] as [number, number], perSecond: 3, chance: 0.4 },
    peck: { lean: 0.3, neckExtend: 0.5 },
    run: { speed: 0.4, whenFarther: 2 },
    flock: { radius: 1.5, retargetSeconds: 45 },
  },
}

/** The pose at the bottom of each style's peck, for checking that the bill reaches the ground. */
export const PECK_BOTTOM: Record<Foraging, { lean: number; neckExtend: number; reach: number }> = {
  plover: { lean: STYLES.plover.peck.lean, neckExtend: STYLES.plover.peck.neckExtend, reach: 1 },
  sandpiper: { lean: STYLES.sandpiper.peck.lean, neckExtend: STYLES.sandpiper.peck.neckExtend, reach: 1 },
}

const TURN = 8                // rad/s
const GAIT_RATE = 10

export function createProbe(ctx: BehaviorContext, startX: number, startZ: number): BehaviorController {
  return (ctx.foraging ?? 'sandpiper') === 'plover' ? createPlover(ctx, startX, startZ) : createSandpiper(ctx, startX, startZ)
}

const between = (rng: () => number, [lo, hi]: [number, number]) => lo + rng() * (hi - lo)

/** Position, heading, and the moves both styles share: walking the legs, standing still, ruffling in the wind. */
function createBody(ctx: BehaviorContext, x: number, z: number) {
  const zone = polygonOf(ctx)
  return {
    zone, x, z, heading: ctx.rng() * Math.PI * 2,
    /** Move toward (tx, tz) at `speed`, inside the zone, walking the legs by exactly the ground covered. Returns the distance left. */
    moveToward(tx: number, tz: number, speed: number, dt: number, pose: PoseState): number {
      this.heading = turnToward(this.heading, Math.atan2(-(tz - this.z), tx - this.x), TURN * dt)
      const step = Math.min(speed * dt, Math.hypot(tx - this.x, tz - this.z))
      const [px, pz] = [this.x, this.z]
      ;[this.x, this.z] = clampToPolygon(this.x + Math.cos(this.heading) * step, this.z - Math.sin(this.heading) * step, zone.points)
      pose.strideDistance += Math.hypot(this.x - px, this.z - pz)
      pose.gait = approach(pose.gait, 1, GAIT_RATE, dt)
      pose.lean.z = approach(pose.lean.z, 0, 4, dt)
      return Math.hypot(tx - this.x, tz - this.z)
    },
    /** Stand: the legs settle, and a gust ruffles. */
    still(dt: number, pose: PoseState): void {
      pose.gait = approach(pose.gait, 0, GAIT_RATE, dt)
      pose.lean.z = approach(pose.lean.z, (ctx.wind().effective - 0.3) * 0.05, 2, dt)
    },
    /** Turn on the spot to face (tx, tz). */
    face(tx: number, tz: number): void { this.heading = Math.atan2(-(tz - this.z), tx - this.x) },
    /** A point `d` metres away, toward a random point in the zone. */
    pointAway(d: number): [number, number] {
      const [px, pz] = randomPointInPolygon(zone.points, ctx.rng)
      const len = Math.hypot(px - this.x, pz - this.z) || 1
      return clampToPolygon(this.x + ((px - this.x) / len) * d, this.z + ((pz - this.z) / len) * d, zone.points)
    },
  }
}

function createPlover(ctx: BehaviorContext, startX: number, startZ: number): BehaviorController {
  const S = STYLES.plover
  const b = createBody(ctx, startX, startZ)
  let state: 'run' | 'look' | 'peck' = 'look'
  let timer = between(ctx.rng, S.look.seconds)
  let [tx, tz] = [b.x, b.z]

  function run(): void {
    state = 'run'
    ;[tx, tz] = b.pointAway(between(ctx.rng, S.run.distance))
    b.face(tx, tz)                                              // a plover turns while it stands, then dashes straight
    timer = Math.hypot(tx - b.x, tz - b.z) / S.run.speed + 1     // a guard, in case the zone edge stops it short
  }
  function look(): void { state = 'look'; timer = between(ctx.rng, S.look.seconds) }

  return {
    name: 'probe',
    get state() { return state },
    get x() { return b.x }, get y() { return ctx.ground(b.x, b.z) }, get z() { return b.z }, get heading() { return b.heading },
    update(dt: number, pose: PoseState) {
      timer -= dt
      if (state === 'run') {
        pose.lean.x = approach(pose.lean.x, 0, 8, dt)
        pose.neckExtend = approach(pose.neckExtend, 0.5, 8, dt)
        pose.reach = approach(pose.reach, 0, 12, dt)
        if (b.moveToward(tx, tz, S.run.speed, dt, pose) < 0.01 || timer <= 0) look()
      } else if (state === 'look') {
        b.still(dt, pose)
        pose.lean.x = approach(pose.lean.x, S.look.lean, 8, dt)
        pose.neckExtend = approach(pose.neckExtend, S.look.neckExtend, 6, dt)
        pose.reach = approach(pose.reach, 0, 12, dt)
        if (timer <= 0) {
          if (ctx.rng() < S.look.peckChance) { state = 'peck'; timer = S.peck.seconds }
          else run()
        }
      } else {
        b.still(dt, pose)
        // one tilt down and back: the bottom, halfway through, is PECK_BOTTOM
        const down = Math.sin(Math.PI * Math.min(1, Math.max(0, 1 - timer / S.peck.seconds)))
        pose.lean.x = S.look.lean + (S.peck.lean - S.look.lean) * down
        pose.neckExtend = S.look.neckExtend + (S.peck.neckExtend - S.look.neckExtend) * down
        pose.reach = down
        if (timer <= 0) look()
      }
    },
  }
}

function createSandpiper(ctx: BehaviorContext, startX: number, startZ: number): BehaviorController {
  const S = STYLES.sandpiper
  const b = createBody(ctx, startX, startZ)
  const group = ctx.group ?? { targetX: startX, targetZ: startZ, retargetAt: Infinity }
  let state: 'walk' | 'peck' | 'run' = 'walk'
  let timer = 0
  let clock = 0
  let phase = 0
  let [tx, tz] = [b.x, b.z]

  /** a spot near the flock's shared target, which moves on now and then */
  function nearFlock(): [number, number] {
    if (clock >= group.retargetAt) {
      ;[group.targetX, group.targetZ] = randomPointInPolygon(b.zone.points, ctx.rng)
      group.retargetAt = clock + S.flock.retargetSeconds
    }
    const a = ctx.rng() * Math.PI * 2, r = ctx.rng() * S.flock.radius
    return clampToPolygon(group.targetX + Math.cos(a) * r, group.targetZ + Math.sin(a) * r, b.zone.points)
  }
  /** Walk a short way toward a spot near the flock, or run there if the flock has moved on. */
  function move(): void {
    const [nx, nz] = nearFlock()
    const far = Math.hypot(group.targetX - b.x, group.targetZ - b.z) > S.run.whenFarther
    state = far ? 'run' : 'walk'
    if (far) [tx, tz] = [nx, nz]
    else {
      const d = Math.hypot(nx - b.x, nz - b.z) || 1, len = Math.min(d, between(ctx.rng, S.walk.distance))
      ;[tx, tz] = [b.x + ((nx - b.x) / d) * len, b.z + ((nz - b.z) / d) * len]
    }
    timer = Math.hypot(tx - b.x, tz - b.z) / (far ? S.run.speed : S.walk.speed) + 1
  }
  function probe(): void {
    state = 'peck'
    timer = Math.round(between(ctx.rng, S.probe.count)) / S.probe.perSecond
    phase = 0
  }
  /** the bill going down and up, `perSecond` times a second, down for half of each */
  function pecking(perSecond: number, dt: number, pose: PoseState): void {
    phase += perSecond * dt
    pose.reach = Math.max(0, Math.sin(2 * Math.PI * phase))
    pose.lean.x = approach(pose.lean.x, S.peck.lean, 6, dt)
    pose.neckExtend = approach(pose.neckExtend, S.peck.neckExtend, 6, dt)
  }

  move()
  return {
    name: 'probe',
    get state() { return state },
    get x() { return b.x }, get y() { return ctx.ground(b.x, b.z) }, get z() { return b.z }, get heading() { return b.heading },
    update(dt: number, pose: PoseState) {
      clock += dt
      timer -= dt
      if (state === 'walk') {
        pecking(S.walk.pecksPerSecond, dt, pose)
        if (b.moveToward(tx, tz, S.walk.speed, dt, pose) < 0.01 || timer <= 0) {
          if (ctx.rng() < S.probe.chance) probe()
          else move()
        }
      } else if (state === 'peck') {
        b.still(dt, pose)
        pecking(S.probe.perSecond, dt, pose)
        if (timer <= 0) move()
      } else {
        pose.reach = approach(pose.reach, 0, 12, dt)
        pose.lean.x = approach(pose.lean.x, 0.1, 8, dt)
        pose.neckExtend = approach(pose.neckExtend, 0.5, 8, dt)
        if (b.moveToward(tx, tz, S.run.speed, dt, pose) < 0.01 || timer <= 0) move()
      }
    },
  }
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/behavior src/birds && npx tsc -p tsconfig.json`
Expected: all PASS (18 in `probe.test.ts`), and `tsc` prints nothing. The spawn tests still pass: the Killdeer and Least Sandpiper cast entries now run their own styles.

Nothing to see in the game yet. Killdeer and Least Sandpiper are still block models, which ignore stride, gait, and reach; Tasks 6 and 7 give them legs that step and pecks that reach.

- [ ] **Step 5: Commit**

```bash
git add src/behavior/probe.ts src/behavior/probe.test.ts
git commit -m "feat: probe in two styles: a plover runs, stops, looks, and dabs; a sandpiper walks and picks with its flock"
```

---

### Task 4: The viewer: a reach slider and a walking speed

**Files:**
- Modify: `src/viewer/state.ts`, `src/viewer/state.test.ts`, `src/viewer/main.ts`

**Interfaces:**
- Consumes: `PoseState.reach` (Task 2); `parseState`, `stateHash`, `ViewerState` (`src/viewer/state.ts`); the viewer's `slider` and `check` helpers (`src/viewer/main.ts`).
- Produces: `ViewerState` gains `reach: number` (0..1) and `speed: number` (walking speed in m/s, 0.05..2, default 0.35, wade's pace). Each number now has its own range; a value outside it is clamped to that range.

- [ ] **Step 1: Write the failing tests**

In `src/viewer/state.test.ts`, change the `DEFAULTS` line `neck: 0.5, lean: 0, spread: 0, phase: 0, walk: false,` to

```ts
  neck: 0.5, lean: 0, spread: 0, phase: 0, reach: 0, walk: false, speed: 0.35,
```

In `it('round-trips through the hash', ...)`, change the state to

```ts
    const s: ViewerState = { ...DEFAULTS, a: 'mallar3', av: 'female', view: 'top', field: 'scope22', neck: 0.8, reach: 0.6, walk: true, speed: 1.2, wire: true }
```

and insert after the `it('keeps the defaults for anything missing or malformed', ...)` test:

```ts
  it('clamps the walking speed to its own range, not 0..1', () => {
    expect(parseState('#speed=1.5', DEFAULTS).speed).toBe(1.5)
    expect(parseState('#speed=9', DEFAULTS).speed).toBe(2)
    expect(parseState('#speed=0', DEFAULTS).speed).toBe(0.05)
  })
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/viewer`
Expected: the round-trip and speed tests FAIL (`reach` and `speed` are not read from the hash), and `tsc` would reject the new `DEFAULTS` fields.

- [ ] **Step 3: The state**

In `src/viewer/state.ts`, change the `ViewerState` lines

```ts
  neck: number; lean: number; spread: number; phase: number
  walk: boolean
```

to

```ts
  neck: number; lean: number; spread: number; phase: number; reach: number
  walk: boolean
  /** walking speed, m/s */
  speed: number
```

Replace `const NUMBERS = ['neck', 'lean', 'spread', 'phase'] as const` with

```ts
/** each number's range: a value outside it is clamped */
const NUMBERS = {
  neck: [0, 1], lean: [0, 1], spread: [0, 1], phase: [0, 1], reach: [0, 1], speed: [0.05, 2],
} as const satisfies Record<string, readonly [number, number]>
const NUMBER_KEYS = Object.keys(NUMBERS) as (keyof typeof NUMBERS)[]
```

In `parseState`, replace

```ts
  for (const k of NUMBERS) {
    const v = Number(p.get(k))
    if (p.has(k) && Number.isFinite(v)) s[k] = Math.min(Math.max(v, 0), 1)
  }
```

with

```ts
  for (const k of NUMBER_KEYS) {
    const v = Number(p.get(k))
    if (p.has(k) && Number.isFinite(v)) s[k] = Math.min(Math.max(v, NUMBERS[k][0]), NUMBERS[k][1])
  }
```

and in `stateHash` replace `for (const k of NUMBERS) p.set(k, String(s[k]))` with `for (const k of NUMBER_KEYS) p.set(k, String(s[k]))`.

- [ ] **Step 4: The controls**

In `src/viewer/main.ts`, in `DEFAULTS`, change `neck: 0.5, lean: 0, spread: 0, phase: 0, walk: false,` to

```ts
  neck: 0.5, lean: 0, spread: 0, phase: 0, reach: 0, walk: false, speed: 0.35,
```

Replace `check(pose, 'walk', state.walk, v => set({ walk: v }))` with

```ts
slider(pose, 'reach', state.reach, v => set({ reach: v }))
check(pose, 'walk', state.walk, v => set({ walk: v }))
slider(pose, 'walk speed, m/s', state.speed, v => set({ speed: v }), 0.05, 2, 0.05)
```

Replace

```ts
const WALK_SPEED = 0.35          // wade's pace, m/s
const WALK_LOOP = 0.6            // metres before the walk starts over
```

with

```ts
const WALK_LOOP = 1.2            // metres before the walk starts over
```

and in `frame()` replace

```ts
  if (state.walk) stride += WALK_SPEED * dt
  const p = { ...defaultPose(), neckExtend: state.neck, wingSpread: state.spread, wingPhase: state.phase, strideDistance: stride, gait: state.walk ? 1 : 0 }
```

with

```ts
  if (state.walk) stride += state.speed * dt
  const p = { ...defaultPose(), neckExtend: state.neck, wingSpread: state.spread, wingPhase: state.phase, reach: state.reach, strideDistance: stride, gait: state.walk ? 1 : 0 }
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run src/viewer && npx tsc -p tsconfig.json`
Expected: all PASS, and `tsc` prints nothing.

- [ ] **Step 6: Check it in the viewer**

1. `npm run dev`, open `http://localhost:5173/viewer.html#a=greyel&b=lesyel&view=side`.
2. Set lean to 0.8 and drag reach from 0 to 1. Expected: both necks swing forward and down in one smooth bend, the heads tip, and at 1 the bill tips touch the ground plane. Nothing creases badly at the neck base, flips, or stretches. With lean 0, reach 1 leaves the bills pointing down, short of the ground: a standing yellowlegs can't reach its feet.
3. Tick walk, set speed to 1.2. Expected: the legs cycle faster, and the stance foot still doesn't slide.
4. Take one Playwright screenshot of each for the task report (not committed).

- [ ] **Step 7: Commit**

```bash
git add src/viewer/state.ts src/viewer/state.test.ts src/viewer/main.ts
git commit -m "feat: viewer reach slider and walking speed"
```

---

### Task 5: Two gaps the tracing found: tails to their longest feather, and an eyelid ring

**Files:**
- Modify: `src/birds/detail/tail.ts`, `src/birds/detail/parts.test.ts`, `src/birds/detail/spec.ts`, `src/birds/paint/painter.ts`, `src/birds/paint/painter.test.ts`

**Interfaces:**
- Consumes: `buildTail`, `tipShape` (`src/birds/detail/tail.ts`); `paintAtlas`, `regionStats` (`src/birds/paint/painter.ts`); `TEST_DETAIL` (`src/birds/detail/fixture.ts`).
- Produces:

```ts
// src/birds/detail/spec.ts, detail.eye gains
/** a bare eyelid ring, drawn on the eye's own rim: its colour, and its width in metres */
lid?: { color: string; width: number }

// src/birds/paint/painter.ts, regionStats also returns the region's mean colour, each channel 0..1
regionStats(...): { mean: number; std: number; roughS: number; roughT: number; rgb: [number, number, number] }
```

- `buildTail` scales a `rounded` or `wedge` tail so its middle (longest) feather is `measurements.tail` long. That is how tails are measured, and it is what `measure()` reads. `square` and `notched` tails are unchanged.
- The eyelid ring takes the outer `lid.width` of the eye's radius. The iris, pupil, and catchlight shrink inside it.

The Killdeer (Task 6) needs both: a graduated `wedge` tail 95 mm long, and an orange-red eyelid ring. A ring painted on the skin comes out as a wide, low oval on its tightly curved head.

- [ ] **Step 1: Write the failing tests**

In `src/birds/detail/parts.test.ts`, in `describe('tail', ...)`, insert after the first test (`'is tail long from the tail base, pointing back'`):

```ts
  it('is tail long to its longest feather, whatever the shape: a rounded or wedge tail keeps the published length', () => {
    for (const shape of ['square', 'rounded', 'wedge'] as const) {
      const t = buildTail(new Mesher(), { ...TEST_DETAIL, tail: { shape } }, profile)
      expect(t.tip.distanceTo(t.root), shape).toBeCloseTo(TEST_DETAIL.measurements.tail, 4)
    }
  })
```

In `src/birds/paint/painter.test.ts`, insert before `it('paints the eye: dark pupil, a catchlight', () => {`:

```ts
  it('paints a bare eyelid ring on the eye rim, with the iris and pupil shrunk inside it', () => {
    const lidded = paintAtlas({ code: 'testbird', detail: { ...TEST_DETAIL, eye: { ...TEST_DETAIL.eye, lid: { color: '#ff0000', width: 0.0006 } } }, layers: [], profile })
    const rim = regionStats(lidded, 'eye', [0.9, 0.94], [0.48, 0.52]).rgb       // d about 0.84, inside the lid
    expect(rim[0]).toBeGreaterThan(0.9)
    expect(rim[1]).toBeLessThan(0.1)
    expect(regionStats(paint([]), 'eye', [0.9, 0.94], [0.48, 0.52]).rgb[0]).toBeLessThan(0.3)   // no lid: iris
    expect(regionStats(lidded, 'eye', [0.46, 0.54], [0.46, 0.54]).mean).toBeLessThan(0.1)         // still a dark pupil
  })
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/birds/detail/parts.test.ts src/birds/paint/painter.test.ts`
Expected: both new tests FAIL.
- The tail test fails for `rounded` and `wedge`: their middles come out 8% and 15% longer than 0.077.
- The eyelid test fails with `TypeError: Cannot read properties of undefined (reading '0')`, since `regionStats` has no `rgb` yet.

- [ ] **Step 3: The tail**

In `src/birds/detail/tail.ts`, replace the first line of `buildTail`'s doc comment,

```ts
 * The tail: a thin, slightly cupped fan rooted at the tailBase station, measurements.tail long, pointing
```

with

```ts
 * The tail: a thin, slightly cupped fan rooted at the tailBase station, measurements.tail long to its longest
 * feather (the middle of a rounded or wedge tail, the outer ones of a square or notched one), pointing
```

and replace

```ts
  const rootW = base.halfWidth * 2 * ROOT_WIDTH
  const point = (s: number, t: number, lift: number) => {
    const w = rootW * (1 + (TIP_SPREAD - 1) * s)
    const along = s * L * (1 + tipShape(detail.tail.shape, t))
```

with

```ts
  const rootW = base.halfWidth * 2 * ROOT_WIDTH
  // a tail is measured to its longest feather, so a rounded or wedge tail's middle is measurements.tail long
  const longest = 1 + Math.max(0, tipShape(detail.tail.shape, 0.5))
  const point = (s: number, t: number, lift: number) => {
    const w = rootW * (1 + (TIP_SPREAD - 1) * s)
    const along = (s * L * (1 + tipShape(detail.tail.shape, t))) / longest
```

- [ ] **Step 4: The eyelid and the colour statistic**

In `src/birds/detail/spec.ts`, replace

```ts
  eye: z.object({ radius: pos, t: unit, iris: hex }),
```

with

```ts
  eye: z.object({
    radius: pos, t: unit, iris: hex,
    /** a bare eyelid ring, drawn on the eye's own rim: its colour, and its width in metres */
    lid: z.object({ color: hex, width: pos }).optional(),
  }),
```

In `src/birds/paint/painter.ts`, replace the whole `paintEye` function and its doc comment with

```ts
/**
 * Iris, pupil, and a catchlight in the eye region, inside a bare eyelid ring when the species has one; outside the
 * iris (or the lid), dark. The lid takes the outer part of the eye's radius, and the iris and pupil shrink inside it.
 */
function paintEye(buf: Float32Array, eye: DetailSpec['eye']): void {
  const r = REGIONS.eye
  const irisC = hexRGB(eye.iris), dark: RGB = [0.05, 0.05, 0.05], light: RGB = [0.95, 0.95, 0.95]
  const lidC = eye.lid ? hexRGB(eye.lid.color) : null
  const k = eye.lid ? 1 - Math.min(0.5, eye.lid.width / eye.radius) : 1
  for (let py = r.y; py < r.y + r.h; py++) {
    for (let px = r.x; px < r.x + r.w; px++) {
      const [s, t] = pixelST('eye', px, py)
      const d = Math.hypot(s - 0.5, t - 0.5) * 2
      let c: RGB = d < 0.45 * k ? dark : d < 0.92 * k ? irisC : lidC ?? dark
      if (Math.hypot(s - 0.5 + 0.14 * k, t - 0.5 - 0.14 * k) < 0.12 * k) c = light
      buf.set(c, (py * ATLAS_SIZE + px) * 3)
    }
  }
}
```

and in `paintAtlas` change `paintEye(buf, detail.eye.iris)` to `paintEye(buf, detail.eye)`. (`DetailSpec` is already imported for `PaintInput`.)

In `regionStats`, change the return type to

```ts
{ mean: number; std: number; roughS: number; roughT: number; rgb: [number, number, number] }
```

change `let n = 0, sum = 0, sum2 = 0, ns = 0, ds = 0, nt = 0, dt = 0` to

```ts
  let n = 0, sum = 0, sum2 = 0, ns = 0, ds = 0, nt = 0, dt = 0, red = 0, green = 0, blue = 0
```

after `n++; sum += l; sum2 += l * l`, add

```ts
      const k = (y * ATLAS_SIZE + x) * 4
      red += pixels[k]! / 255; green += pixels[k + 1]! / 255; blue += pixels[k + 2]! / 255
```

and replace the final `return { mean, std: ..., roughS: ..., roughT: ... }` with

```ts
  return {
    mean, std: Math.sqrt(Math.max(0, sum2 / (n || 1) - mean * mean)), roughS: ds / (ns || 1), roughT: dt / (nt || 1),
    rgb: [red / (n || 1), green / (n || 1), blue / (n || 1)],
  }
```

- [ ] **Step 5: Run the tests**

Run: `npm test && npx tsc -p tsconfig.json`
Expected: all PASS, and `tsc` prints nothing. The yellowlegs' tails are `square`, so nothing about them changes.

- [ ] **Step 6: Commit**

```bash
git add src/birds/detail/tail.ts src/birds/detail/parts.test.ts src/birds/detail/spec.ts src/birds/paint/painter.ts src/birds/paint/painter.test.ts
git commit -m "feat: tails measured to their longest feather; an eyelid ring painted on the eye; regionStats reports colour"
```

---

### Task 6: The Killdeer, detailed

**Files:**
- Modify: `src/birds/species/killde.ts`, `src/birds/species/species.test.ts`

**Interfaces:**
- Consumes:
  - `buildDetailedBird`, `measure` (the detailed builder)
  - `DEFAULT_STEP` (`src/birds/detail/legs.ts`)
  - `eye.lid` and the longest-feather tail (Task 5)
  - `stepLength` (already in the detail schema)
  - `foraging: 'plover'` (Task 1)
- Produces: `killde` with a `detail` block for the adult, and a species-level test that every detailed species keeps its stance foot planted at its own step length.

Everything comes from the research:
- Measurements: section 8.
- Marks: section 4.1.
- Tracing reference: section 7.1.

The block fields and the guide `marks` stay as they are. The research found the marks supported, and the block fields remain required until every species converts.

The trace is of the Homler photo, scaled by the culmen. Its profile and wing numbers came out of the scratch run described at the top of the plan. The loft never creases, the built bird matches the photo's outline, and it measures:

| Measure | Built |
|---|---|
| Length | 214 mm |
| Culmen | 20 mm |
| Culmen / head | 0.59 |
| Tail past the wingtips | 10 mm |
| Bare tibia | 15.4 mm |

- [ ] **Step 1: Write the new species-level test**

In `src/birds/species/species.test.ts`, add `import * as THREE from 'three'` as the first line, and after `import { worstFold } from '../detail/loft'` add

```ts
import { DEFAULT_STEP } from '../detail/legs'
import { defaultPose } from '../model'
```

Then insert before `it('does not take Object prototype names for species codes', () => {`:

```ts
  it('every detailed species keeps its stance foot planted at its own step length (too long a step slides the foot)', () => {
    for (const spec of Object.values(SPECIES)) {
      if (!spec.detail) continue
      const m = buildDetailedBird(spec)
      const toes = m.mesh.skeleton.bones.find(b => b.name === 'toesR')!
      const stride = 2 * (spec.detail.stepLength ?? DEFAULT_STEP) * (m.layout.tibia + m.layout.tarsus)
      const xs: number[] = []
      for (const f of [0.52, 0.6, 0.7, 0.8, 0.88, 0.98, 1.08]) {        // the right foot's whole stance
        const d = f * stride
        m.group.position.x = d
        m.pose({ ...defaultPose(), strideDistance: d, gait: 1 })
        m.group.updateMatrixWorld(true)
        xs.push(toes.getWorldPosition(new THREE.Vector3()).x)
      }
      expect(Math.max(...xs) - Math.min(...xs), spec.code).toBeLessThan(1e-4)
    }
  })
```

- [ ] **Step 2: Run it**

Run: `npx vitest run src/birds/species`
Expected: PASS for the two yellowlegs at the default step. From here on it guards every detailed species: at `stepLength` 0.8 a Killdeer's foot slides 1.4 mm, and the test fails naming it.

- [ ] **Step 3: The species file**

Replace `src/birds/species/killde.ts` with:

```ts
import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'killde',
  commonName: 'Killdeer',
  length: 0.25,
  body: { length: 1, height: 0.5, width: 0.45 },
  neck: { length: 0.18, thickness: 0.2, angle: 60 },
  head: { size: 0.34 },
  bill: { length: 0.14, thickness: 0.06, shape: 'pointed' },
  legs: { length: 0.38, thickness: 0.03 },
  tail: { length: 0.3, angle: 5 },
  wing: { length: 0.55, width: 0.25 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#6b5638', cheek: '#f3efe6', throat: '#1c1c1c', breast: '#f6f3ea', flank: '#efe9dc',
    back: '#7a6444', wing: '#6f5a3c', speculum: null, rump: '#c9782e', tail: '#3a3025',
    bill: '#1a1a1a', legs: '#d9c39a', eye: '#1a1a1a',
  },
  variants: {},
  marks: {
    size: 'robin-sized plover on long legs',
    bill: 'short thin black bill',
    head: 'brown cap, white forehead and collar, with two black bands across the breast',
    body: 'brown back, white belly, rusty orange rump and a long tail',
    legs: 'pale long legs; runs in short bursts and stops',
  },
  wingbeatHz: 7,
  foraging: 'plover',
  detail: {
    measurements: {
      length: 0.22, culmen: 0.020, billDepth: 0.0044, billWidth: 0.0035,
      tarsus: 0.035, tibia: 0.017, toe: 0.0215, wingChord: 0.160, tail: 0.095,
    },
    // traced from the Homler photo (see sources), in a copy 1000 px wide, at 0.318 mm per pixel (the 20.3 mm culmen
    // spans 64 px), hip at (448, 375). The spine runs low through the neck and head, near the throat, so neither the
    // breast-to-neck turn nor the head-to-bill turn creases; the eye's and lores' depths run to the chin line, since
    // a plover's throat runs straight down into its neck
    profile: [
      { label: 'rear',     x: -0.0789, y: -0.0067, up: 0.0079, down: 0.0013, halfWidth: 0.0041 },
      { label: 'rump',     x: -0.0614, y: -0.0054, up: 0.0118, down: 0.0051, halfWidth: 0.0072 },
      { label: 'tailBase', x: -0.0353, y: -0.0035, up: 0.0183, down: 0.0173, halfWidth: 0.0142 },
      { label: 'hip',      x: 0.0000, y: 0.0000, up: 0.0250, down: 0.0283, halfWidth: 0.0176 },
      { label: 'flank',    x: 0.0172, y: 0.0045, up: 0.0252, down: 0.0292, halfWidth: 0.0180 },
      { label: 'breast',   x: 0.0273, y: 0.0102, up: 0.0240, down: 0.0241, halfWidth: 0.0168 },
      { label: 'neckBase', x: 0.0340, y: 0.0172, up: 0.0223, down: 0.0163, halfWidth: 0.0154 },
      { label: 'neckMid',  x: 0.0391, y: 0.0239, up: 0.0227, down: 0.0099, halfWidth: 0.0139 },
      { label: 'nape',     x: 0.0423, y: 0.0315, up: 0.0234, down: 0.0069, halfWidth: 0.0129 },
      { label: 'occiput',  x: 0.0445, y: 0.0388, up: 0.0242, down: 0.0069, halfWidth: 0.0132 },
      { label: 'crown',    x: 0.0467, y: 0.0448, up: 0.0241, down: 0.0087, halfWidth: 0.0135 },
      { label: 'eye',      x: 0.0496, y: 0.0493, up: 0.0191, down: 0.0076, halfWidth: 0.0107 },
      { label: 'lores',    x: 0.0541, y: 0.0512, up: 0.0090, down: 0.0051, halfWidth: 0.0053 },
      { label: 'billBase', x: 0.0591, y: 0.0490, up: 0.0022, down: 0.0022, halfWidth: 0.0016 },
    ],
    rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
    bill: { taper: 0.6, curve: 0 },
    // the visible eye is 7.5-7.7 mm across inside a 1 mm orange-red eyelid ring
    eye: { radius: 0.0051, t: 0.39, iris: '#2b1a10', lid: { color: '#e0452a', width: 0.001 } },
    wing: {
      wrist: [0.0388, 0.0137], droop: 7.2,
      outline: [[0, 0.03], [0.1, 0.07], [0.25, 0.085], [0.45, 0.075], [0.65, 0.05], [0.85, 0.022], [1, 0.005]],
    },
    tail: { shape: 'wedge' },
    stepLength: 0.7,
    plumage: [
      // grey-brown above, white below
      { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#74604a', side: '#86735c', bottom: '#f7f6f2' },
      { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'neckBase', band: [0.55, 1] }, color: '#f7f6f2', soft: 4 },
      // ochraceous rump, mostly hidden under the folded wings at rest
      { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'rump', band: [0, 0.2] }, color: '#c8782f', soft: 2 },
      // back and scapulars: grey-brown feathers with slightly paler fringes
      { kind: 'feathers', where: { part: 'skin', from: 'tailBase', to: 'neckBase', band: [0, 0.45] }, length: 11, width: 8, center: '#6f5b45', edge: '#7e6a52', edgeWidth: 0.7, soft: 3 },
      // head: grey-brown crown, nape and cheeks; white throat
      { kind: 'base', where: { part: 'skin', from: 'nape', to: 'billBase' }, top: '#6f5b45', side: '#6f5b45', bottom: '#f7f6f2', soft: 3 },
      { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'billBase', band: [0.62, 1] }, color: '#f7f6f2', soft: 2 },
      // a white collar round the hindneck, then the upper black band, a full ring, broader at the front
      { kind: 'stripe', from: { at: 'nape', t: 0, dx: 4.5 }, to: { at: 'nape', t: 1, dx: 4.5 }, width: 5, color: '#f7f6f2', blur: 0.4 },
      { kind: 'stripe', from: { at: 'neckMid', t: 0, dx: 6.7 }, to: { at: 'neckMid', t: 1, dx: 6.7 }, width: 5.5, color: '#161412', blur: 0.4 },
      { kind: 'stripe', from: { at: 'neckMid', t: 0.5, dx: 6.7 }, to: { at: 'neckMid', t: 1, dx: 6.7 }, width: 8, color: '#161412', blur: 0.4 },
      // below a white bar, the broader lower band across the chest only, ending at the bend of the wing
      { kind: 'stripe', from: { at: 'neckBase', t: 0.5, dx: 1.4 }, to: { at: 'neckBase', t: 1, dx: 1.4 }, width: 9, color: '#161412', blur: 0.4 },
      // face: white forehead, black bar across the forecrown, black loral line, white stripe behind the eye
      { kind: 'fill', where: { part: 'skin', from: 'lores', to: 'billBase', band: [0, 1] }, color: '#f7f6f2', soft: 1.5 },
      { kind: 'stripe', from: { at: 'eye', t: 0, dx: 2.5 }, to: { at: 'eye', t: 0.24, dx: 2.5 }, width: 3, color: '#161412', blur: 0.3 },
      { kind: 'stripe', from: { at: 'eye', t: 0.31, dx: -1 }, to: { at: 'eye', t: 0.28, dx: -7 }, width: 2.2, color: '#f7f6f2', blur: 0.4 },
      { kind: 'stripe', from: { at: 'billBase', t: 0.5 }, to: { at: 'eye', t: 0.36, dx: 3 }, width: 1.3, color: '#161412', blur: 0.3 },
      // folded wing: grey-brown coverts and tertials with paler fringes, blackish primaries
      { kind: 'fill', where: { part: 'wingFold' }, color: '#6f5b45' },
      { kind: 'feathers', where: { part: 'wingFold', s: [0, 0.6] }, length: 12, width: 8, center: '#6c5842', edge: '#7c6850', edgeWidth: 0.7, soft: 2 },
      { kind: 'fill', where: { part: 'wingFold', s: [0.62, 1] }, color: '#2a2520', soft: 4 },
      // spread wing: dark with a white stripe; white below
      { kind: 'gradient', where: { part: 'wingSpread' }, axis: 's', from: 0.4, to: 1, colorA: '#6a5640', colorB: '#2a2520' },
      { kind: 'fill', where: { part: 'wingSpread', s: [0.25, 0.9], t: [0.58, 0.68] }, color: '#f2efe8', soft: 1 },
      { kind: 'fill', where: { part: 'wingUnder' }, color: '#f0ede6' },
      // tail: ochraceous-buff fading paler at the sides, grey-brown down the middle, a black subterminal bar and white tips
      { kind: 'fill', where: { part: 'tail' }, color: '#c98a4a' },
      { kind: 'gradient', where: { part: 'tail', t: [0, 0.3] }, axis: 't', from: 0, to: 0.3, colorA: '#e8d6bc', colorB: '#c98a4a' },
      { kind: 'gradient', where: { part: 'tail', t: [0.7, 1] }, axis: 't', from: 0.7, to: 1, colorA: '#c98a4a', colorB: '#e8d6bc' },
      { kind: 'fill', where: { part: 'tail', s: [0, 0.7], t: [0.38, 0.62] }, color: '#76624c', soft: 1 },
      { kind: 'fill', where: { part: 'tail', s: [0.72, 0.88] }, color: '#1a1614', soft: 0.5 },
      { kind: 'fill', where: { part: 'tail', s: [0.88, 1] }, color: '#f2efe8', soft: 0.5 },
      { kind: 'fill', where: { part: 'tailUnder' }, color: '#e8e2d8' },
      { kind: 'fill', where: { part: 'bill' }, color: '#161412' },
      { kind: 'fill', where: { part: 'legs' }, color: '#c9b3a0' },
    ],
    variants: {},
    sources: [
      'Ridgway 1919, Bull. U.S. Natl. Mus. 50(8) p. 100 (culmen, tarsus, toe, wing, tail); pp. 98-99 (bill, tail, and leg shape)',
      'Tobias et al. 2022, AVONET (bill depth and width)',
      'All About Birds, Killdeer identification (length, field marks)',
      'Bent 1929, Bull. U.S. Natl. Mus. 146 pp. 209-212 (plumage, feeding)',
      'profile traced from "Killdeer Heislerville.png" (c) Charles Homler, CC BY-SA 4.0, https://commons.wikimedia.org/wiki/File:Killdeer_Heislerville.png',
      'numbers and marks: docs/research/2026-09-25-killdeer-least-sandpiper.md',
    ],
  },
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test && npx tsc -p tsconfig.json`
Expected: all PASS, and `tsc` prints nothing. `species.test.ts` now holds the Killdeer to:
- its own measurements (length within 5%, culmen, bill depth, tarsus, wing chord and tail within 2%, bare tibia within 15%);
- no creases in the loft;
- a planted stance foot.

- [ ] **Step 5: Check it against the photo and at range, in the viewer**

1. Download the tracing reference, a CC BY-SA photo that is never committed, to a folder outside the repo: https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cb/Killdeer_Heislerville.png/3840px-Killdeer_Heislerville.png
2. Run `npm run dev` and open `http://localhost:5173/viewer.html#a=killde&b=leasan&view=side&stations=1`.
3. Load the photo as the reference. Set its scale so its bill matches the model's, then line up the bill bases with x and y.
   - Expected: the model's back, belly, head, tail, and wingtip sit on the photo's outline.
   - The legs stand about 1 cm short of the photo's feet; see the plan's decisions.
4. Set lean to 0.82, neck to 1, reach to 1.
   - Expected: the body tips forward, tail up, and the bill tip lands on the ground: the plover's dab.
5. Open `viewer.html#a=killde&b=leasan&field=scope22`.
   - Expected at 22 m through the telescope:
     - two black breast bands with white between;
     - the white collar;
     - the orange-red eye ring;
     - the white stripe behind the eye;
     - a plain grey-brown back;
     - the long tail with its black bar and white tip past the wingtips;
     - long pale legs.
6. Tick walk and set the speed to 0.6 (the Killdeer's run). Expected: the stance foot doesn't slide.
7. Take Playwright screenshots of the side view with the photo, the dab, and the field view for the task report. Screenshots stay out of git.

If a mark reads wrong, tune its layer. The species file's comments name each one. Keep `npm test` green; Task 7's `mudflat.test.ts` will hold the bands and the eye ring to the research.

- [ ] **Step 6: Commit**

```bash
git add src/birds/species/killde.ts src/birds/species/species.test.ts
git commit -m "feat: Killdeer as a field-guide plate: traced, measured, adult plumage; every detailed species keeps its feet planted"
```

---

### Task 7: The Least Sandpiper, detailed, and the acceptance test

**Files:**
- Create: `src/birds/species/mudflat.test.ts`
- Modify: `src/birds/species/leasan.ts`

**Interfaces:**
- Consumes:
  - `SPEC` from `killde.ts` (Task 6)
  - `buildDetailedBird`, `measure`, `billTipNow` (Task 2)
  - `paintAtlas`, `regionStats` with `rgb` (Task 5)
  - `REGIONS`, `pixelST`, `ATLAS_SIZE` (`src/birds/paint/atlas.ts`)
  - `createProfile`, `PECK_BOTTOM` (Task 3)
  - `foraging: 'sandpiper'` (Task 1)
- Produces:
  - `leasan` with a `detail` block for the juvenile;
  - `mudflat.test.ts`, which holds both birds to the research's section 9 on the built models, their painted atlases, and their pecks.

The trace is of the game's own photo, `public/media/photos/leasan.jpg`. It is a spring adult, used for structure only. The plumage follows the research's section 4.2 and the juvenile reference photo. The built bird measures:

| Measure | Built |
|---|---|
| Length | 127 mm |
| Culmen | 18 mm |
| Culmen / head | 0.98 |
| Bill tip | 0.5 mm below the line of its base |
| Wingtips against the tail | even |

The acceptance test holds each bird to its published range independently, so a later retrace can't drift out of it.

- [ ] **Step 1: Write the failing test**

`src/birds/species/mudflat.test.ts`:

```ts
import { parseSpeciesSpec, type SpeciesSpec } from '../spec'
import { SPECIES } from './index'
import { SPEC as KILLDEER } from './killde'
import { SPEC as LEAST } from './leasan'
import { buildDetailedBird } from '../detail/build'
import { measure, billTipNow, type Measures } from '../detail/measure'
import { createProfile } from '../detail/profile'
import { paintAtlas, regionStats } from '../paint/painter'
import { REGIONS, pixelST, ATLAS_SIZE } from '../paint/atlas'
import { PECK_BOTTOM } from '../../behavior/probe'
import { defaultPose } from '../model'

// Bounds from docs/research/2026-09-25-killdeer-least-sandpiper.md, section 9 (Ridgway 1919, USGS 2023, AVONET,
// All About Birds, photo-measured). Millimetres; the head is total head (bill tip to the back of the head along the
// bill axis) minus the exposed culmen, as USGS measures it.

const killdeer = parseSpeciesSpec(KILLDEER), least = parseSpeciesSpec(LEAST)
const mm = (m: Measures): Record<keyof Measures, number> =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v * 1000])) as Record<keyof Measures, number>
const K = mm(measure(buildDetailedBird(killdeer)))
const L = mm(measure(buildDetailedBird(least)))

const within = (v: number, lo: number, hi: number) => {
  expect(v).toBeGreaterThanOrEqual(lo)
  expect(v).toBeLessThanOrEqual(hi)
}

describe('Killdeer and Least Sandpiper: structure', () => {
  it('culmen', () => { within(K.culmen, 19, 23); within(L.culmen, 16, 21) })
  it('total length, bill tip to tail tip at rest (the hunched Least traces short of its stretched-specimen length)', () => {
    within(K.length, 200, 280); within(L.length, 115, 150)
  })
  it('tarsus', () => { within(K.tarsus, 32, 37); within(L.tarsus, 16, 21) })
  it('wing chord', () => { within(K.wingChord, 147, 170); within(L.wingChord, 82, 96) })
  it('tail', () => { within(K.tail, 82, 103); within(L.tail, 34, 42) })
  it('bill against head: much shorter in the plover, about equal in the sandpiper', () => {
    within(K.culmen / K.head, 0.55, 0.8)
    within(L.culmen / L.head, 0.8, 1.1)
    expect(L.culmen / L.head - K.culmen / K.head).toBeGreaterThanOrEqual(0.15)
  })
  it('bill against tarsus: the clearest plover-and-sandpiper difference in the measurements', () => {
    within(K.culmen / K.tarsus, 0.5, 0.68)
    within(L.culmen / L.tarsus, 0.85, 1.12)
  })
  it("Killdeer's bill is straight; the Least's droops at the tip", () => {
    expect(Math.abs(K.billTipRise)).toBeLessThan(1)
    within(L.billTipRise, -1, -0.2)
  })
  it("Killdeer's long tail reaches well past the wingtips; the Least's wingtips are about even with its tail", () => {
    within(-K.projection, 8, 30)
    within(-L.projection, -4, 4)
  })
  it('Killdeer is about 1.9x the Least in the wing, but only a little longer in the bill', () => {
    within(K.wingChord / L.wingChord, 1.75, 1.95)
    within(K.culmen / L.culmen, 1.0, 1.3)
  })
})

/** The atlas, and two ways to read it: a span of skin between station labels, or a rectangle of a part. */
function painted(spec: SpeciesSpec) {
  const d = spec.detail!
  const profile = createProfile(d.profile)
  const px = paintAtlas({ code: spec.code, detail: d, layers: d.plumage, profile })
  return {
    px, profile,
    skin: (from: string, to: string, t: [number, number]) => regionStats(px, 'skin', [profile.uOf(from), profile.uOf(to)], t),
  }
}

/** Every skin pixel between two station labels and inside a band of t, as [luminance, red minus blue]. */
function skinPixels(px: Uint8ClampedArray, u: [number, number], t: [number, number]): [number, number][] {
  const r = REGIONS.skin, out: [number, number][] = []
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) {
      const [s, tt] = pixelST('skin', x, y)
      if (s < u[0] || s > u[1] || tt < t[0] || tt > t[1]) continue
      const k = (y * ATLAS_SIZE + x) * 4
      const [R, G, B] = [px[k]! / 255, px[k + 1]! / 255, px[k + 2]! / 255]
      out.push([0.2126 * R + 0.7152 * G + 0.0722 * B, R - B])
    }
  }
  return out
}

describe('Killdeer and Least Sandpiper: plumage', () => {
  const k = painted(killdeer), l = painted(least)

  it('Killdeer: down the front of the breast, white, black, white, black, white (two bands)', () => {
    // slices from the belly up to the chin along the front midline; dark below 0.25, light above 0.7
    const u0 = k.profile.uOf('flank'), u1 = k.profile.uOf('lores'), n = 60
    const runs: string[] = []
    for (let i = 0; i < n; i++) {
      const lum = regionStats(k.px, 'skin', [u0 + ((u1 - u0) * i) / n, u0 + ((u1 - u0) * (i + 1)) / n], [0.9, 1]).mean
      const c = lum < 0.25 ? 'black' : lum > 0.7 ? 'white' : null
      if (c && runs.at(-1) !== c) runs.push(c)
    }
    expect(runs).toEqual(['white', 'black', 'white', 'black', 'white'])
  })
  it("Killdeer: the eyelid ring is orange-red", () => {
    const [r, g, b] = regionStats(k.px, 'eye', [0.9, 0.94], [0.48, 0.52]).rgb
    expect(r).toBeGreaterThan(0.7)
    expect(r).toBeGreaterThan(2 * g)
    expect(b).toBeLessThan(0.3)
  })
  it("Least: the back feathers' pale edges are rusty, warmer than their blackish centres", () => {
    const back = skinPixels(l.px, [l.profile.uOf('hip'), l.profile.uOf('neckBase')], [0.05, 0.4]).sort((a, b) => a[0] - b[0])
    const third = Math.floor(back.length / 3)
    const warmth = (xs: [number, number][]) => xs.reduce((s, p) => s + p[1], 0) / xs.length
    const darkest = warmth(back.slice(0, third)), lightest = warmth(back.slice(-third))
    expect(lightest).toBeGreaterThan(darkest + 0.15)
    expect(lightest).toBeGreaterThan(0.25)
  })
  it('Least: the buffy breast band is darker than the white belly', () => {
    expect(l.skin('breast', 'neckBase', [0.75, 1]).mean).toBeLessThan(l.skin('rump', 'flank', [0.75, 1]).mean - 0.1)
  })
  it('Least: the legs are yellow-green', () => {
    const [r, g, b] = regionStats(l.px, 'legs', [0, 1], [0, 1]).rgb
    expect(Math.min(r, g)).toBeGreaterThan(b + 0.15)
    within(r / g, 0.85, 1.15)
  })
})

describe('the peck reaches the ground', () => {
  // the Killdeer dabs at the surface; the Least may probe a little into it, never stop above it
  const bounds = { plover: [-5, 5], sandpiper: [-8, 2] } as const
  for (const spec of Object.values(SPECIES)) {
    if (!spec.detail || !spec.foraging) continue
    const style = spec.foraging
    it(`${spec.code} (${style}): at the bottom of its peck, the bill tip is on the ground`, () => {
      const m = buildDetailedBird(spec)
      const bottom = PECK_BOTTOM[style]
      const p = defaultPose(); p.lean.x = bottom.lean; p.neckExtend = bottom.neckExtend; p.reach = bottom.reach
      m.pose(p)
      within(billTipNow(m).y * 1000, bounds[style][0], bounds[style][1])
    })
  }
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/birds/species/mudflat.test.ts`
Expected: FAIL, `leasan: no detail block` (thrown while the file loads).

- [ ] **Step 3: The species file**

Replace `src/birds/species/leasan.ts` with:

```ts
import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'leasan',
  commonName: 'Least Sandpiper',
  length: 0.15,
  body: { length: 1, height: 0.55, width: 0.45 },
  neck: { length: 0.12, thickness: 0.16, angle: 45 },
  head: { size: 0.3 },
  bill: { length: 0.16, thickness: 0.05, shape: 'pointed' },
  legs: { length: 0.28, thickness: 0.02 },
  tail: { length: 0.15, angle: 0 },
  wing: { length: 0.4, width: 0.2 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#6e5a3a', cheek: '#a89070', throat: '#f0ece0', breast: '#c9b89a', flank: '#f0ece2',
    back: '#6a5636', wing: '#7a6440', speculum: null, rump: '#6a5636', tail: '#5a4830',
    bill: '#1f1f1f', legs: '#b8b03a', eye: '#111111',
  },
  variants: {},
  marks: {
    size: 'the smallest sandpiper, sparrow-sized',
    bill: 'a short thin bill with a slight droop',
    head: 'a brown head with a faint pale eyebrow',
    body: 'brown above with a streaked breast, crouched low',
    legs: 'yellow-green legs (the other small sandpipers have black legs)',
  },
  wingbeatHz: 9,
  foraging: 'sandpiper',
  detail: {
    measurements: {
      length: 0.13, culmen: 0.018, billDepth: 0.0034, billWidth: 0.0025,
      tarsus: 0.0185, tibia: 0.009, toe: 0.016, wingChord: 0.086, tail: 0.038,
    },
    // traced from public/media/photos/leasan.jpg (800 px) at 0.247 mm per pixel (the 18 mm culmen spans 73 px), hip
    // at (318, 258); the spine runs low through the short, hunched neck and the head, so the loft never creases
    profile: [
      { label: 'rear',     x: -0.0538, y: 0.0062, up: 0.0033, down: 0.0039, halfWidth: 0.0032 },
      { label: 'rump',     x: -0.0427, y: 0.0044, up: 0.0067, down: 0.0068, halfWidth: 0.0058 },
      { label: 'tailBase', x: -0.0217, y: 0.0015, up: 0.0126, down: 0.0113, halfWidth: 0.0096 },
      { label: 'hip',      x: 0.0000, y: 0.0000, up: 0.0171, down: 0.0162, halfWidth: 0.0110 },
      { label: 'flank',    x: 0.0128, y: 0.0000, up: 0.0178, down: 0.0176, halfWidth: 0.0117 },
      { label: 'breast',   x: 0.0227, y: 0.0010, up: 0.0175, down: 0.0143, halfWidth: 0.0111 },
      { label: 'neckBase', x: 0.0301, y: 0.0032, up: 0.0157, down: 0.0114, halfWidth: 0.0101 },
      { label: 'neckMid',  x: 0.0351, y: 0.0052, up: 0.0156, down: 0.0086, halfWidth: 0.0097 },
      { label: 'nape',     x: 0.0385, y: 0.0069, up: 0.0153, down: 0.0073, halfWidth: 0.0096 },
      { label: 'occiput',  x: 0.0410, y: 0.0079, up: 0.0145, down: 0.0072, halfWidth: 0.0092 },
      { label: 'crown',    x: 0.0435, y: 0.0084, up: 0.0135, down: 0.0067, halfWidth: 0.0083 },
      { label: 'eye',      x: 0.0459, y: 0.0086, up: 0.0111, down: 0.0064, halfWidth: 0.0072 },
      { label: 'lores',    x: 0.0487, y: 0.0082, up: 0.0054, down: 0.0055, halfWidth: 0.0044 },
      { label: 'billBase', x: 0.0511, y: 0.0072, up: 0.0015, down: 0.0015, halfWidth: 0.0011 },
    ],
    rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
    bill: { taper: 1.2, curve: -0.03 },
    eye: { radius: 0.0021, t: 0.38, iris: '#2a1c14' },
    wing: {
      wrist: [0.0264, 0.0131], droop: 4.1,
      outline: [[0, 0.06], [0.12, 0.2], [0.3, 0.23], [0.5, 0.2], [0.7, 0.12], [0.9, 0.045], [1, 0.01]],
    },
    tail: { shape: 'square' },
    stepLength: 0.7,
    plumage: [
      // dark above, white below
      { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#4e3b2a', side: '#a48c6c', bottom: '#f7f5ef' },
      { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'breast', band: [0.6, 1] }, color: '#f7f5ef', soft: 3 },
      // a buffy, indistinctly streaked breast band, ending cleanly against the white belly
      { kind: 'fill', where: { part: 'skin', from: 'breast', to: 'neckMid', band: [0.45, 1] }, color: '#cfb592', soft: 1.5 },
      { kind: 'streaks', where: { part: 'skin', from: 'breast', to: 'nape', band: [0.4, 0.95] }, color: '#8a7054', length: 1.6, width: 0.5, spacing: 1.4, blur: 0.5, soft: 1.5, opacity: 0.5 },
      // mantle and scapulars: blackish centres, bright rufous edges, some with white tips
      { kind: 'feathers', where: { part: 'skin', from: 'rump', to: 'neckBase', band: [0, 0.45] }, length: 7, width: 5.5, center: '#2e2219', edge: '#b96c33', edgeWidth: 1.3, notch: { color: '#efe9dd', size: 0.8, count: 1 }, soft: 2 },
      // the white tips line up into pale lines along the mantle
      { kind: 'stripe', from: { at: 'hip', t: 0.2 }, to: { at: 'neckBase', t: 0.16 }, width: 0.9, color: '#f0ebe0', blur: 0.4, opacity: 0.85 },
      // a dark cap streaked rufous
      { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'lores', band: [0, 0.24] }, color: '#3a2a1e', soft: 1.5 },
      { kind: 'streaks', where: { part: 'skin', from: 'nape', to: 'lores', band: [0, 0.24] }, color: '#b0662e', length: 1.4, width: 0.4, spacing: 1.0, blur: 0.2, soft: 1.5 },
      // pale supercilium, strongest in front; dark loral line; grey-brown cheek; pale throat
      { kind: 'stripe', from: { at: 'lores', t: 0.26 }, to: { at: 'occiput', t: 0.28 }, width: 1.4, color: '#e9e3d7', blur: 0.4 },
      { kind: 'stripe', from: { at: 'billBase', t: 0.5 }, to: { at: 'eye', t: 0.4 }, width: 0.8, color: '#4a3a2c', blur: 0.3 },
      { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'eye', band: [0.34, 0.55] }, color: '#9b8870', soft: 1.5 },
      { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'billBase', band: [0.7, 1] }, color: '#f1ede4', soft: 1.5 },
      // folded wing: coverts and tertials dark-centred with rufous-buff edges, blackish primaries
      { kind: 'fill', where: { part: 'wingFold' }, color: '#33271d' },
      { kind: 'feathers', where: { part: 'wingFold', s: [0, 0.75] }, length: 7, width: 5.5, center: '#33271d', edge: '#c69058', edgeWidth: 1.1, soft: 1.5 },
      { kind: 'fill', where: { part: 'wingFold', s: [0.8, 1] }, color: '#1f1915', soft: 3 },
      { kind: 'gradient', where: { part: 'wingSpread' }, axis: 's', from: 0.4, to: 1, colorA: '#5a4838', colorB: '#241d18' },
      { kind: 'fill', where: { part: 'wingUnder' }, color: '#ece8e0' },
      // tail: dusky down the middle, grey-brown outer feathers
      { kind: 'fill', where: { part: 'tail' }, color: '#8a7f72' },
      { kind: 'fill', where: { part: 'tail', t: [0.35, 0.65] }, color: '#3a3028', soft: 1 },
      { kind: 'fill', where: { part: 'tailUnder' }, color: '#d9d4cb' },
      { kind: 'fill', where: { part: 'bill' }, color: '#1c1a18' },
      { kind: 'fill', where: { part: 'legs' }, color: '#a09a3e' },
    ],
    variants: {},
    sources: [
      'Ridgway 1919, Bull. U.S. Natl. Mus. 50(8) p. 295 (culmen, tarsus, toe, wing, tail); p. 267 (bill and tail shape)',
      'Ruthrauff et al. 2023, USGS adult shorebird measurements (culmen, total head)',
      'Tobias et al. 2022, AVONET (bill depth and width)',
      'Bent 1927, Bull. U.S. Natl. Mus. 142 pp. 205-208 (juvenal plumage, leg colour)',
      'Cox 2008 (structure, feeding posture)',
      'profile traced from public/media/photos/leasan.jpg (c) Greg Lasley, CC BY-NC: a spring adult, traced for structure only',
      'juvenal plumage from "Least sandpiper (03342).jpg" (c) Rhododendrites, CC BY-SA 4.0, https://commons.wikimedia.org/wiki/File:Least_sandpiper_(03342).jpg',
      'numbers and marks: docs/research/2026-09-25-killdeer-least-sandpiper.md',
    ],
  },
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test && npx tsc -p tsconfig.json`
Expected: all PASS (17 in `mudflat.test.ts`), and `tsc` prints nothing. `species.test.ts` now also holds the Least to its measurements, no creases, and a planted foot.

- [ ] **Step 5: Check it against the photos and at range, in the viewer**

1. Open `http://localhost:5173/viewer.html#a=leasan&b=killde&view=side&stations=1`.
2. Load `public/media/photos/leasan.jpg` as the reference and match the bills.
   - Expected: the back, belly, head, tail, and wingtip sit on the photo's outline, and the feet stand on its mud line.
3. Download the juvenile plumage reference to a folder outside the repo: https://upload.wikimedia.org/wikipedia/commons/a/ae/Least_sandpiper_%2803342%29.jpg (CC BY-SA, never committed). Load it as the reference.
   - Expected plumage:
     - blackish back feathers with broad rusty edges and white tips;
     - a pale line along the mantle;
     - buff-edged coverts;
     - a dark cap streaked rufous;
     - a pale eyebrow;
     - a buffy, faintly streaked breast band ending cleanly at the white belly;
     - yellow-green legs.
4. Set lean to 0.3 and reach to 1. Expected: the neck bends down and the bill tip lands on the ground.
5. Tick walk, speed 0.1. Expected: short, quick steps with the stance foot planted.
6. Open `viewer.html#a=killde&b=leasan&field=scope22`.
   - Expected at 22 m:
     - the Least is plainly the smaller, hunched bird;
     - its back is rusty against the Killdeer's plain brown;
     - its eyebrow, buffy breast, and yellow-green legs read.
7. Take Playwright screenshots of the side view, the peck, and the field view for the task report.

- [ ] **Step 6: Commit**

```bash
git add src/birds/species/leasan.ts src/birds/species/mudflat.test.ts
git commit -m "feat: Least Sandpiper, detailed juvenile; the mudflat birds' structure, marks, and pecks as tests"
```

---

### Task 8: The main spec, performance, and the telescope check

**Files:**
- Modify: `docs/superpowers/specs/2026-09-22-lakewatch-design.md`

**Interfaces:**
- Consumes: the finished feature.
- Produces:
  - the main spec describing the new `probe` and `PoseState.reach`;
  - a measured paint time;
  - your own check at the telescope.

- [ ] **Step 1: Amend the main spec**

In `docs/superpowers/specs/2026-09-22-lakewatch-design.md`, in the Behaviors table, replace the row

```
| probe | Run-stop-peck along the mudflat in a loose group that moves together |
```

with

```
| probe | Forage the mudflat in the species' style: a plover runs, stops dead, looks, and pecks, each bird on its own; a sandpiper walks and picks in a loose group that moves together |
```

In Animation, replace `sandpiper run-stop-peck` with `plover run-stop-look-peck, sandpiper walk-and-pick`.

In the `PoseState` block, add a line after `gait`:

```
  reach: number;          // 0 .. 1, a peck or strike reaching down; at 1 the bill tip is on the ground
```

The README needs no change. It describes detail blocks and the viewer in general terms that still hold.

- [ ] **Step 2: Performance**

1. Run `npm run build && npx vite preview`, open the game (Playwright is fine), click Begin, and open the dev overlay with the backtick key.
2. Record the `atlases` line. Expected: `atlases 4: about 70 ms each, 5.3 MB` in the production build. The dev server paints slower, about 240 ms each.
3. Headless frame rates say nothing about your integrated GPU, so the frame-rate check goes to you in Step 5.

- [ ] **Step 3: Full build**

Run: `npm run build`
Expected: typecheck, every test, and the Vite build pass, and `dist/` has no `viewer.html`.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-09-22-lakewatch-design.md
git commit -m "docs: probe's foraging styles and PoseState.reach in the design spec"
```

- [ ] **Step 5: Hand the telescope to the user**

The spec's last check can't be automated. Ask the user to:
1. run `npm run dev`;
2. click Begin and open the dev overlay;
3. read the frame rate with the naked eye and with the telescope on the mudflat (acceptance: 60 fps on their integrated GPU);
4. say whether the marks read at about 20 m: the Killdeer's two bands, collar, and eye ring; the Least's small size, rusty back, drooping bill, and leg colour;
5. say whether the two move like a plover and a sandpiper:
   - the Killdeer: runs, dead stops with the head up, sudden dabs;
   - the Least: a slow walk, pecking all the while, in a loose bunch;
6. say whether the feet stay planted and the pecks reach the mud.

If the frame rate falls short, compare against the commit before Task 1:
1. `git worktree add ../lakewatch-before <sha>`
2. in the new worktree: `npm install && npm run dev -- --port 5199`
3. report the two numbers without tuning blindly
4. `git worktree remove ../lakewatch-before`

Whatever the user says is the acceptance result. Record it in the final report, together with the screenshots from Tasks 4, 6, and 7.
