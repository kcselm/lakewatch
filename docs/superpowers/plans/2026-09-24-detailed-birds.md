# Detailed Birds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the block-built Greater Yellowlegs with a field-guide-plate model (traced structure, published measurements, painted field marks, jointed legs) and add a Lesser Yellowlegs beside it, so a birder at the telescope can tell the two apart; build it as a pipeline the rest of the cast can convert to.

**Architecture:** A second `BirdModel` implementation, `buildDetailedBird`, turns a species' optional `detail` block into one `THREE.SkinnedMesh` per bird: a body-neck-head surface lofted along a traced side profile, plus bill, eyes, folded and spread wings, tail, and jointed legs, all bound to one skeleton whose bones are the `BirdParts`. A pure-TypeScript painter turns field-mark layers (placed by station labels and sized in millimetres) into one texture atlas per species and plumage, shared by every bird of that kind. `PoseState` gains a stride, `wade` drives it, and a 2-bone IK keeps each stance foot planted. A dev-only viewer at `/viewer.html` shows any two species at true scale, through the game's optics, over a reference photo.

**Tech Stack:** Vite 8, TypeScript 7, Vitest 5 (`environment: 'node'`), Three.js 0.186 (`SkinnedMesh`, `Skeleton`, `Bone`, `CatmullRomCurve3`, `DataTexture`, `OrbitControls` in the viewer), zod 4.

**Spec:** `docs/superpowers/specs/2026-09-24-detailed-birds-design.md` (read it first). Every number and mark for the two yellowlegs comes from `docs/research/2026-09-24-yellowlegs.md`.

**How this plan was checked:** every code block below ran in a scratch copy of the repo before the plan was written. With a stand-in catalog entry for `lesyel`, 351 tests passed, `tsc` was clean, `vite build` was clean and left the viewer out of `dist/`, the game ran with detailed yellowlegs in the shallows, and the viewer's field view showed the two species apart at 22 m through the telescope. If a step's output differs from what the plan says, stop and find out why rather than adjusting the test.

**Decisions made while planning (not in the spec, or refining it):**

- **The atlas is 512 x 512, not 1024.** At 22 m through the telescope a yellowlegs' skin spans about 400 screen pixels, and 512 texels already puts about 0.5 mm of skin in each one. The full juvenile plumage painted in about 100 ms warm at 512 (the 1024 atlas took 0.7 s warm and 5 s cold). Memory is about 1.4 MB per atlas with mipmaps. `ATLAS_SIZE` is one constant if a later round wants more.
- **The default step length is 0.45 of the leg's length, not 0.8.** With 0.8 the stance foot has to reach past the leg's full length, so the IK clamps and the foot slides. At 0.45 a Greater at wade pace walks at about 3 steps per second, which matches how briskly yellowlegs walk.
- **Bone names and parents.** The spec's diagram had `hipL/R` bones. The plan puts `tibiaL/R` at the hip joint instead, since that bone carries the tibia. The neck-base bone is named `neck` so it can serve directly as `parts.neck`. The legs hang from `root`, not `body`, so leaning the body to peck pivots it over the hips without swinging the planted feet.
- **Small additions to the detail block:**
  - `rig.tailBase`: the station where the tail roots, which sits inside the body
  - `wing.droop`: the chord's angle below straight back
  - `eye.t` and `eye.iris`: where on the head the eye sits, and its colour
  - legs get their colour from a `fill` layer on the `legs` part, like every other colour
- **Order of work.** The builder lands whole (Task 9), once its parts exist, and the viewer comes right after (Task 10). That is still before any species data is tuned, which is the point of having the viewer early.
- **The Greater's head stations follow an even arc from the nape to the bill base, not the photo's exact points.** The photo's head turns tighter than the throat is deep, and a loft through those points creases the chin by up to 2.6 mm. `worstFold` now catches this for every species.
- **Neck posing.** `neckExtend` = 0.5 is the traced posture. Tucking pulls the head down into the shoulders by shortening the neck bones' offsets. Extending lengthens them by up to 15% and tips the neck forward, so `wade`'s strike reaches out and down.
- **Found, not fixed.** The block builder applies `lean.x` as a roll (`body.rotation.x`), though `PoseState` documents it as a pitch. The detailed builder follows the documentation. The block builder is out of scope, so its behaviour is unchanged.

## Global Constraints

- 60 fps on an integrated GPU in Chrome, with every bird on screen. A detailed bird is one draw call (plus its shadow pass) and about 6k triangles. Painting stays around 150 ms per atlas or less, and the dev overlay shows the time.
- Art direction: field-guide plate. Exact structure and painted field marks, no photo textures on any mesh. Patterns come from data (`detail.plumage`).
- The `BirdModel` interface does not change. `PoseState` gains `strideDistance` and `gait`, and `defaultPose()` sets both to 0. The block builder ignores them.
- Units: every size in `detail.measurements` and `detail.profile` is in metres. Every pattern size in a layer is in millimetres on the bird.
- Species specs are validated when the module loads. A bad `detail` block fails `npm test` and `npm run build`. A detailed species never falls back to blocks at runtime.
- Media stays CC non-commercial with attribution in `data/birds.json`. Reference photos loaded into the viewer are never committed; the catalog's own photos are already committed and credited.
- Vitest runs in `environment: 'node'`: no DOM, no WebGL. Rendering is checked by eye in the viewer and the game, with Playwright screenshots where a step asks for them.
- The harvest (Task 12) needs the user's eBird and xeno-canto keys and the network. Ask before running it.
- Every commit leaves `npm test` green. Never commit `node_modules`, `.env`, `dist`, `data/raw`, `.wrangler`, or `.playwright-mcp`.

## Review Focus

Inputs the spec implies but no task's own tests would otherwise exercise, each pinned to a test in the owning task:

1. **A species traced with a neck-to-head turn tighter than its throat is deep.** This is the easiest mistake when tracing the next species, and the surface creases at the chin. `npm test` must fail and name the species (Task 5, `loft.test.ts` "catches a spine that turns too tightly"; Task 11, `species.test.ts` "no detailed species creases its body").
2. **A behaviour hands the model out-of-range pose values**, such as `approach` overshooting `neckExtend`, a `gait` above 1, or a negative `wingSpread`. The bird must clamp, never stretch, turn inside out, or go `NaN` (Task 7, `gait.test.ts` "clamps gait"; Task 9, `build.test.ts` "clamps out-of-range pose values").
3. **A layer whose region reaches the edge of its part**, which every `base` layer and every back-midline pattern does. It must paint the padding too, or at distance the mipmaps blend grey into the back and belly midlines (Task 8, `painter.test.ts` "paints only the part a layer names": the region mean includes the padding rows).
4. **Many birds of one kind.** Atlas cost must not grow with bird count: two Greaters, or twenty, paint once (Task 8, `painter.test.ts` "paints once per species and plumage"; Task 9, `build.test.ts` "shares one painted material").
5. **A pasted or hand-edited viewer link with junk values**, including a species code the catalog doesn't have (say, from before a rename). The viewer must fall back to its defaults, not throw from `getSpec` (Task 10, `state.test.ts` "keeps the defaults for anything missing or malformed" and "falls back from a species or plumage the catalog lacks").

---

### Task 1: A stride in PoseState, driven by wade

**Files:**
- Modify: `src/birds/model.ts`, `src/birds/procedural.ts`, `src/behavior/wade.ts`, `src/behavior/wade.test.ts`

**Interfaces:**
- Consumes: `PoseState`, `defaultPose` (`src/birds/model.ts`), `createWade` (`src/behavior/wade.ts`), `approach`, `clampToPolygon` (already imported by `wade.ts`).
- Produces:

```ts
// src/birds/model.ts, added to PoseState
/** metres walked so far; the model maps it to its own stride phase */
strideDistance: number
/** 0 standing .. 1 walking */
gait: number
// defaultPose() returns strideDistance: 0, gait: 0
```

`wade` adds the ground actually covered each step frame to `pose.strideDistance`, after clamping to the zone. It eases `pose.gait` toward 1 while stepping and toward 0 otherwise, at rate 8.

- [ ] **Step 1: Write the failing tests**

In `src/behavior/wade.test.ts`, insert these two tests before `it('strikes: neck extends fast then returns', () => {`:

```ts
  it('walks: strideDistance grows by exactly the ground covered, and gait rises only while stepping', () => {
    const c = createWade(ctx(4), 0, 0)
    const pose = defaultPose()
    let walked = 0, px = c.x, pz = c.z, sawStep = false
    for (let i = 0; i < 3000; i++) {
      c.update(1 / 30, pose)
      walked += Math.hypot(c.x - px, c.z - pz)
      px = c.x; pz = c.z
      if (c.state === 'step') sawStep = true
      if (c.state === 'still' && i > 60) expect(pose.gait).toBeLessThan(1)
    }
    expect(sawStep).toBe(true)
    expect(pose.strideDistance).toBeCloseTo(walked, 9)
  })
  it('eases gait to 1 while stepping and back to 0 when still', () => {
    const c = createWade(ctx(5), 0, 0)
    const pose = defaultPose()
    let guard = 0
    while (c.state !== 'step' && guard++ < 100000) c.update(1 / 30, pose)
    for (let i = 0; i < 15 && c.state === 'step'; i++) c.update(1 / 30, pose)
    expect(pose.gait).toBeGreaterThan(0.9)
    while (c.state === 'step' && guard++ < 100000) c.update(1 / 30, pose)
    for (let i = 0; i < 30; i++) c.update(1 / 30, pose)
    expect(pose.gait).toBeLessThan(0.05)
  })
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/behavior/wade.test.ts`
Expected: the two new tests FAIL. `pose.strideDistance` and `pose.gait` are `undefined`, so they come out as `NaN`.

- [ ] **Step 3: Add the fields**

In `src/birds/model.ts`, add to `PoseState` after `lean`:

```ts
  /** metres walked so far; the model maps it to its own stride phase */
  strideDistance: number
  /** 0 standing .. 1 walking */
  gait: number
```

and change `defaultPose()` to:

```ts
export function defaultPose(): PoseState {
  return { wingPhase: 0, wingSpread: 0, headBob: 0, neckExtend: 0.5, tailTilt: 0, lean: new THREE.Vector3(), strideDistance: 0, gait: 0 }
}
```

In `src/birds/procedural.ts`, change the first import to `import { defaultPose, type BirdModel, type BirdParts, type PoseState } from './model'`. Then replace the literal rest-pose call near the end of `buildBird`:

```ts
  pose({ wingPhase: 0, wingSpread: 0, headBob: 0, neckExtend: 0.5, tailTilt: 0, lean: new THREE.Vector3() })
```

with

```ts
  pose(defaultPose())
```

- [ ] **Step 4: Drive them from wade**

In `src/behavior/wade.ts`, in the `state === 'step'` branch, replace

```ts
        x += Math.cos(heading) * SPEED * dt
        z -= Math.sin(heading) * SPEED * dt
```

with

```ts
        const [px, pz] = [x, z]
        x += Math.cos(heading) * SPEED * dt
        z -= Math.sin(heading) * SPEED * dt
        ;[x, z] = clampToPolygon(x, z, zone.points)
        pose.strideDistance += Math.hypot(x - px, z - pz)
        pose.gait = approach(pose.gait, 1, 8, dt)
```

In the `strike` branch, after the `pose.neckExtend = ...` line, add `pose.gait = approach(pose.gait, 0, 8, dt)`. In the final `else` (still) branch, after its `pose.neckExtend = ...` line, add the same line. The clamp at the end of `update` stays as it is; clamping twice is harmless.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run src/behavior src/birds && npx tsc -p tsconfig.json`
Expected: all PASS, and `tsc` prints nothing. Every other `PoseState` literal in the code base already spreads `defaultPose()`.

- [ ] **Step 6: Commit**

```bash
git add src/birds/model.ts src/birds/procedural.ts src/behavior/wade.ts src/behavior/wade.test.ts
git commit -m "feat: PoseState gains a stride; wade walks it and eases gait"
```

---

### Task 2: The detail block: schema, SpeciesSpec, and a test bird

**Files:**
- Create: `src/birds/detail/spec.ts`, `src/birds/detail/fixture.ts`, `src/birds/detail/spec.test.ts`
- Modify: `src/birds/spec.ts`

**Interfaces:**
- Consumes: `parseSpeciesSpec`, `SpeciesSpec` (`src/birds/spec.ts`).
- Produces (`src/birds/detail/spec.ts`):

```ts
export const PARTS: readonly ['skin', 'wingFold', 'wingSpread', 'wingUnder', 'tail', 'tailUnder', 'bill', 'legs', 'eye']
export type Part = (typeof PARTS)[number]
export const stationSchema; export type Station = { label?: string; x: number; y: number; up: number; down: number; halfWidth: number }
export const whereSchema; export type Where       // { part: 'skin', from, to, band? } | { part: <other>, s?, t? }
export const skinPointSchema; export type SkinPoint // { at: label, t: 0..1, dx?: mm }
export const layerSchema; export type Layer       // discriminated on kind: base fill gradient spots bars streaks stripe ring feathers
export const detailSchema; export type DetailSpec
export function layersFor(detail: DetailSpec, variant?: string): Layer[]
```

- `SpeciesSpec` gains `detail?: DetailSpec`. The schema rejects a `detail.variants` key that isn't one of the species' `variants`.
- `src/birds/detail/fixture.ts` exports `TEST_DETAIL: DetailSpec` and `TEST_SPEC: SpeciesSpec`: a frozen test shorebird with the Greater's outline and measurements and a plain plumage. The builder's unit tests use it, so tuning the real species never breaks them.
- Schema error messages name the label without quotes (`unknown station label: knee`). zod's thrown message is JSON, and quotes inside it come out escaped.

- [ ] **Step 1: Write the failing test**

`src/birds/detail/spec.test.ts`:

```ts
import { detailSchema, layersFor } from './spec'
import { parseSpeciesSpec } from '../spec'
import { TEST_DETAIL, TEST_SPEC } from './fixture'

describe('detailSchema', () => {
  it('accepts the test fixture', () => {
    expect(detailSchema.parse(TEST_DETAIL).profile.length).toBe(14)
  })
  it('rejects a rig label missing from the profile', () => {
    const bad = { ...TEST_DETAIL, rig: { ...TEST_DETAIL.rig, hip: 'knee' } }
    expect(() => detailSchema.parse(bad)).toThrow(/unknown station label: knee/)
  })
  it('requires occiput and eye stations', () => {
    const profile = TEST_DETAIL.profile.map(s => (s.label === 'occiput' ? { ...s, label: 'back' } : s))
    expect(() => detailSchema.parse({ ...TEST_DETAIL, profile })).toThrow(/label: occiput/)
  })
  it('rejects a layer region that names an unknown station', () => {
    const plumage = [{ kind: 'fill', where: { part: 'skin', from: 'rear', to: 'chin' }, color: '#ffffff' }]
    expect(() => detailSchema.parse({ ...TEST_DETAIL, plumage })).toThrow(/label: chin/)
  })
  it('rejects a stripe or ring anchored to an unknown station', () => {
    const plumage = [{ kind: 'ring', at: { at: 'ear', t: 0.4 }, radius: 3, width: 1, color: '#ffffff' }]
    expect(() => detailSchema.parse({ ...TEST_DETAIL, plumage })).toThrow(/label: ear/)
  })
  it('rejects non-positive sizes', () => {
    const measurements = { ...TEST_DETAIL.measurements, culmen: 0 }
    expect(() => detailSchema.parse({ ...TEST_DETAIL, measurements })).toThrow(/culmen/)
  })
  it('needs at least four stations', () => {
    expect(() => detailSchema.parse({ ...TEST_DETAIL, profile: TEST_DETAIL.profile.slice(0, 3) })).toThrow()
  })
})

describe('SpeciesSpec with a detail block', () => {
  it('rejects a detail variant the species does not have', () => {
    const detail = { ...TEST_DETAIL, variants: { juvenile: TEST_DETAIL.plumage } }
    expect(() => parseSpeciesSpec({ ...TEST_SPEC, detail })).toThrow(/detail variant juvenile/)
  })
  it('accepts a detail variant the species has', () => {
    const detail = { ...TEST_DETAIL, variants: { adult: TEST_DETAIL.plumage } }
    expect(() => parseSpeciesSpec({ ...TEST_SPEC, variants: { adult: {} }, detail })).not.toThrow()
  })
})

describe('layersFor', () => {
  it('uses the variant list when there is one, else the base plumage', () => {
    const own = [{ kind: 'fill' as const, where: { part: 'bill' as const }, color: '#ffffff' }]
    const d = { ...TEST_DETAIL, variants: { adult: own } }
    expect(layersFor(d, 'adult')).toBe(own)
    expect(layersFor(d, 'juvenile')).toBe(d.plumage)
    expect(layersFor(d)).toBe(d.plumage)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/birds/detail/spec.test.ts`
Expected: FAIL, `Cannot find module './spec'` (or `./fixture`).

- [ ] **Step 3: Write the schema**

`src/birds/detail/spec.ts`:

```ts
import { z } from 'zod'

const hex = z.string().regex(/^#[0-9a-f]{6}$/i, 'expected #rrggbb')
const pos = z.number().positive()
const unit = z.number().min(0).max(1)
const range = z.tuple([unit, unit])

export const PARTS = ['skin', 'wingFold', 'wingSpread', 'wingUnder', 'tail', 'tailUnder', 'bill', 'legs', 'eye'] as const
export type Part = (typeof PARTS)[number]

export const stationSchema = z.object({
  label: z.string().min(1).optional(),
  /** spine point in the side view, metres, +x forward, +y up */
  x: z.number(),
  y: z.number(),
  /** surface height above the spine */
  up: pos,
  /** surface depth below the spine */
  down: pos,
  halfWidth: pos,
})
export type Station = z.infer<typeof stationSchema>

/** Where a layer paints: a span of the skin between two station labels, or a rectangle of another part. */
export const whereSchema = z.union([
  z.object({ part: z.literal('skin'), from: z.string(), to: z.string(), band: range.optional() }),
  z.object({ part: z.enum(['wingFold', 'wingSpread', 'wingUnder', 'tail', 'tailUnder', 'bill', 'legs', 'eye']), s: range.optional(), t: range.optional() }),
])
export type Where = z.infer<typeof whereSchema>

/** A point on the skin: a station label, a t (0 back midline .. 1 belly midline), an optional shift along the spine in mm. */
export const skinPointSchema = z.object({ at: z.string(), t: unit, dx: z.number().optional() })
export type SkinPoint = z.infer<typeof skinPointSchema>

const common = {
  /** region edge softness, mm */
  soft: z.number().min(0).optional(),
  opacity: unit.optional(),
}
/** pattern-element edge blur, mm */
const blur = z.number().min(0).optional()

export const layerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('base'), where: whereSchema, top: hex, side: hex, bottom: hex, ...common }),
  z.object({ kind: z.literal('fill'), where: whereSchema, color: hex, ...common }),
  z.object({ kind: z.literal('gradient'), where: whereSchema, axis: z.enum(['s', 't']), from: unit, to: unit, colorA: hex, colorB: hex, ...common }),
  z.object({ kind: z.literal('spots'), where: whereSchema, color: hex, size: pos, spacing: pos, jitter: unit.optional(), blur, ...common }),
  z.object({ kind: z.literal('bars'), where: whereSchema, color: hex, width: pos, spacing: pos, angle: z.number(), blur, ...common }),
  z.object({ kind: z.literal('streaks'), where: whereSchema, color: hex, length: pos, width: pos, spacing: pos, jitter: unit.optional(), blur, ...common }),
  z.object({ kind: z.literal('stripe'), from: skinPointSchema, to: skinPointSchema, width: pos, color: hex, blur, ...common }),
  z.object({ kind: z.literal('ring'), at: skinPointSchema, radius: pos, width: pos, color: hex, blur, ...common }),
  z.object({
    kind: z.literal('feathers'), where: whereSchema,
    /** feather length along the spine and width across it, mm */
    length: pos, width: pos,
    center: hex.optional(), edge: hex, edgeWidth: pos,
    notch: z.object({ color: hex, size: pos, count: z.number().int().positive() }).optional(),
    ...common,
  }),
])
export type Layer = z.infer<typeof layerSchema>

export const detailSchema = z.object({
  measurements: z.object({
    length: pos, culmen: pos, billDepth: pos, billWidth: pos,
    tarsus: pos, tibia: pos, toe: pos, wingChord: pos, tail: pos,
  }),
  profile: z.array(stationSchema).min(4),
  rig: z.object({ neckBase: z.string(), neckMid: z.string(), head: z.string(), hip: z.string(), tailBase: z.string() }),
  bill: z.object({ taper: pos, curve: z.number() }),
  eye: z.object({ radius: pos, t: unit, iris: hex }),
  wing: z.object({
    /** bend of the wing in the side view, metres */
    wrist: z.tuple([z.number(), z.number()]),
    /** chord direction, degrees below straight back */
    droop: z.number(),
    /** [s, height as a fraction of the chord], s from wrist (0) to tip (1) */
    outline: z.array(z.tuple([unit, z.number().min(0)])).min(3),
  }),
  tail: z.object({ shape: z.enum(['square', 'rounded', 'wedge', 'notched']), angle: z.number().optional() }),
  stepLength: pos.optional(),
  plumage: z.array(layerSchema),
  variants: z.record(z.string(), z.array(layerSchema)),
  sources: z.array(z.string().min(1)).min(1),
}).superRefine((d, ctx) => {
  const labels = new Set(d.profile.flatMap(s => (s.label ? [s.label] : [])))
  const need = (label: string, path: (string | number)[]) => {
    if (!labels.has(label)) ctx.addIssue({ code: 'custom', message: `unknown station label: ${label}`, path })
  }
  need('occiput', ['profile'])
  need('eye', ['profile'])
  for (const [k, v] of Object.entries(d.rig)) need(v, ['rig', k])
  const layers = (list: Layer[], path: (string | number)[]) => list.forEach((l, i) => {
    if ('where' in l && l.where.part === 'skin') { need(l.where.from, [...path, i, 'where', 'from']); need(l.where.to, [...path, i, 'where', 'to']) }
    if (l.kind === 'stripe') { need(l.from.at, [...path, i, 'from']); need(l.to.at, [...path, i, 'to']) }
    if (l.kind === 'ring') need(l.at.at, [...path, i, 'at'])
  })
  layers(d.plumage, ['plumage'])
  for (const [k, v] of Object.entries(d.variants)) layers(v, ['variants', k])
})
export type DetailSpec = z.infer<typeof detailSchema>

/** The layer list for a variant: the variant's own list when it has one, else the base plumage. */
export function layersFor(detail: DetailSpec, variant?: string): Layer[] {
  return (variant && detail.variants[variant]) || detail.plumage
}
```

- [ ] **Step 4: Add `detail` to SpeciesSpec**

In `src/birds/spec.ts`, add `import { detailSchema } from './detail/spec'` under the zod import. Then close `speciesSpecSchema` with the new field and a refinement: replace

```ts
  wingbeatHz: z.number().positive(),
})
```

with

```ts
  wingbeatHz: z.number().positive(),
  /** present when the species uses the detailed builder */
  detail: detailSchema.optional(),
}).superRefine((s, ctx) => {
  for (const k of Object.keys(s.detail?.variants ?? {})) {
    if (!(k in s.variants)) ctx.addIssue({ code: 'custom', message: `detail variant ${k} is not one of the species' variants`, path: ['detail', 'variants', k] })
  }
})
```

- [ ] **Step 5: Write the test bird**

`src/birds/detail/fixture.ts`:

```ts
import { parseSpeciesSpec, type SpeciesSpec } from '../spec'
import type { DetailSpec } from './spec'

/**
 * A test shorebird for the builder's unit tests: the Greater Yellowlegs outline and measurements with a
 * plain plumage, frozen here so species tuning never breaks the builder's own tests.
 */
export const TEST_DETAIL: DetailSpec = {
  measurements: {
    length: 0.31, culmen: 0.056, billDepth: 0.0065, billWidth: 0.005,
    tarsus: 0.061, tibia: 0.035, toe: 0.035, wingChord: 0.188, tail: 0.077,
  },
  profile: [
    { label: 'rear',     x: -0.0884, y: -0.0163, up: 0.0048, down: 0.0048, halfWidth: 0.0045 },
    { label: 'rump',     x: -0.0714, y: -0.0150, up: 0.0088, down: 0.0082, halfWidth: 0.0075 },
    { label: 'tailBase', x: -0.0442, y: -0.0102, up: 0.0184, down: 0.0170, halfWidth: 0.0150 },
    { label: 'hip',      x: 0,       y: 0,       up: 0.0333, down: 0.0333, halfWidth: 0.0220 },
    { label: 'flank',    x: 0.0306,  y: 0.0082,  up: 0.0360, down: 0.0374, halfWidth: 0.0235 },
    { label: 'breast',   x: 0.0544,  y: 0.0212,  up: 0.0278, down: 0.0306, halfWidth: 0.0210 },
    { label: 'neckBase', x: 0.0694,  y: 0.0456,  up: 0.0136, down: 0.0136, halfWidth: 0.0120 },
    { label: 'neckMid',  x: 0.0755,  y: 0.0728,  up: 0.0102, down: 0.0102, halfWidth: 0.0092 },
    { label: 'nape',     x: 0.0802,  y: 0.0979,  up: 0.0102, down: 0.0102, halfWidth: 0.0092 },
    { label: 'occiput',  x: 0.0883,  y: 0.1126,  up: 0.0109, down: 0.0095, halfWidth: 0.0105 },
    { label: 'crown',    x: 0.0947,  y: 0.1173,  up: 0.0136, down: 0.0122, halfWidth: 0.0112 },
    { label: 'eye',      x: 0.1002,  y: 0.1196,  up: 0.0129, down: 0.0122, halfWidth: 0.0110 },
    { label: 'lores',    x: 0.1131,  y: 0.1204,  up: 0.0082, down: 0.0068, halfWidth: 0.0068 },
    { label: 'billBase', x: 0.1201,  y: 0.1183,  up: 0.0033, down: 0.0033, halfWidth: 0.0025 },
  ],
  rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
  bill: { taper: 1.2, curve: 0.04 },
  eye: { radius: 0.0027, t: 0.45, iris: '#2a1f18' },
  wing: {
    wrist: [0.0496, 0.0483], droop: 19.4,
    outline: [[0, 0.05], [0.16, 0.17], [0.36, 0.18], [0.55, 0.16], [0.74, 0.094], [0.93, 0.036], [1, 0.01]],
  },
  tail: { shape: 'square' },
  plumage: [
    { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#655b4b', side: '#9a9384', bottom: '#f3f1eb' },
    { kind: 'fill', where: { part: 'wingFold' }, color: '#5a5142' },
    { kind: 'fill', where: { part: 'bill' }, color: '#26231f' },
    { kind: 'fill', where: { part: 'legs' }, color: '#e3c02a' },
  ],
  variants: {},
  sources: ['test fixture'],
}

export const TEST_SPEC: SpeciesSpec = parseSpeciesSpec({
  code: 'testbird', commonName: 'Test Shorebird', length: 0.31,
  body: { length: 1, height: 0.5, width: 0.42 }, neck: { length: 0.32, thickness: 0.12, angle: 65 },
  head: { size: 0.26 }, bill: { length: 0.36, thickness: 0.06, shape: 'pointed' },
  legs: { length: 0.75, thickness: 0.025 }, tail: { length: 0.12, angle: 0 }, wing: { length: 0.6, width: 0.28 },
  posture: 'standing', draft: 0,
  plumage: {
    crown: '#6a6252', cheek: '#a8a292', throat: '#f2f0ea', breast: '#d8d2c4', flank: '#eeeae0',
    back: '#6a6454', wing: '#736c5c', speculum: null, rump: '#f2f0ea', tail: '#c8c2b2',
    bill: '#2a2a2a', legs: '#e8c22a', eye: '#111111',
  },
  variants: {},
  marks: { size: 'a test shorebird', bill: 'a long test bill', head: 'a test head', body: 'a test body', legs: 'long test legs' },
  wingbeatHz: 5,
  detail: TEST_DETAIL,
})
```

- [ ] **Step 6: Run the tests**

Run: `npx vitest run src/birds && npx tsc -p tsconfig.json`
Expected: all PASS (including the existing `spec.test.ts` and `species.test.ts`), `tsc` clean.

- [ ] **Step 7: Commit**

```bash
git add src/birds/spec.ts src/birds/detail/spec.ts src/birds/detail/fixture.ts src/birds/detail/spec.test.ts
git commit -m "feat: an optional detail block on species specs, validated, with a test shorebird"
```

---

### Task 3: The traced profile

**Files:**
- Create: `src/birds/detail/profile.ts`, `src/birds/detail/profile.test.ts`

**Interfaces:**
- Consumes: `Station` (Task 2).
- Produces:

```ts
export const SQUARENESS = 2.2
export interface ProfileSample { point: THREE.Vector2; tangent: THREE.Vector2; normal: THREE.Vector2; up: number; down: number; halfWidth: number }
export interface Profile {
  readonly length: number                    // spine arclength, metres
  sampleAt(u: number): ProfileSample         // u: arclength fraction, 0 tail end .. 1 bill base
  uOf(label: string): number                 // throws on an unknown label
  halfPerimeter(u: number): number           // back midline to belly midline, one side, metres
}
export function sectionOffset(theta: number, up: number, down: number, halfWidth: number): { n: number; z: number }
export function createProfile(stations: readonly Station[]): Profile
```

- The spine is a centripetal `CatmullRomCurve3` through the station points. Sizes use a uniform Catmull-Rom with the same parameterisation, so every station's values are hit exactly.
- The normal is the tangent turned 90° counter-clockwise. That points up on a level body and back on a rising neck, so `up` is always the dorsal side.
- `sectionOffset`'s angle runs from the back midline (0) through the right side (+z) to the belly (π).

- [ ] **Step 1: Write the failing test**

`src/birds/detail/profile.test.ts`:

```ts
import { createProfile, sectionOffset } from './profile'
import { TEST_DETAIL } from './fixture'

const profile = createProfile(TEST_DETAIL.profile)

describe('createProfile', () => {
  it('passes through every station', () => {
    for (const st of TEST_DETAIL.profile) {
      const s = profile.sampleAt(profile.uOf(st.label!))
      expect(s.point.x).toBeCloseTo(st.x, 3)
      expect(s.point.y).toBeCloseTo(st.y, 3)
      expect(s.up).toBeCloseTo(st.up, 3)
      expect(s.down).toBeCloseTo(st.down, 3)
      expect(s.halfWidth).toBeCloseTo(st.halfWidth, 3)
    }
  })
  it('orders labels by arclength, first at 0 and last at 1', () => {
    const us = TEST_DETAIL.profile.map(s => profile.uOf(s.label!))
    expect(us[0]).toBe(0)
    expect(us[us.length - 1]).toBeCloseTo(1, 6)
    for (let i = 1; i < us.length; i++) expect(us[i]!).toBeGreaterThan(us[i - 1]!)
  })
  it('measures the spine: longer than the straight line from tail to bill base', () => {
    const a = TEST_DETAIL.profile[0]!, b = TEST_DETAIL.profile[TEST_DETAIL.profile.length - 1]!
    expect(profile.length).toBeGreaterThan(Math.hypot(b.x - a.x, b.y - a.y))
    expect(profile.length).toBeLessThan(0.35)
  })
  it('turns the normal from up on the body to back on the rising neck', () => {
    const body = profile.sampleAt(profile.uOf('hip'))
    expect(body.normal.y).toBeGreaterThan(0.9)
    const neck = profile.sampleAt(profile.uOf('neckMid'))
    expect(neck.normal.x).toBeLessThan(-0.8)
  })
  it('keeps sizes positive between stations', () => {
    for (let k = 0; k <= 200; k++) {
      const s = profile.sampleAt(k / 200)
      expect(Math.min(s.up, s.down, s.halfWidth)).toBeGreaterThan(0)
    }
  })
  it('throws on an unknown label', () => {
    expect(() => profile.uOf('knee')).toThrow(/knee/)
  })
  it('gives a half perimeter between half the ellipse bounds', () => {
    const s = profile.sampleAt(profile.uOf('hip'))
    const hp = profile.halfPerimeter(profile.uOf('hip'))
    expect(hp).toBeGreaterThan(s.up + s.down)
    expect(hp).toBeLessThan(s.up + s.down + 2 * s.halfWidth)
  })
})

describe('sectionOffset', () => {
  it('puts theta 0 on the back, pi/2 on the right side, pi on the belly', () => {
    expect(sectionOffset(0, 2, 3, 1)).toEqual({ n: 2, z: 0 })
    const side = sectionOffset(Math.PI / 2, 2, 3, 1)
    expect(side.n).toBeCloseTo(0, 6)
    expect(side.z).toBeCloseTo(1, 6)
    const belly = sectionOffset(Math.PI, 2, 3, 1)
    expect(belly.n).toBeCloseTo(-3, 6)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/birds/detail/profile.test.ts`
Expected: FAIL, `Cannot find module './profile'`.

- [ ] **Step 3: Implement**

`src/birds/detail/profile.ts`:

```ts
import * as THREE from 'three'
import type { Station } from './spec'

/** Cross-sections are superellipses: 2 is an ellipse, higher is boxier. */
export const SQUARENESS = 2.2

export interface ProfileSample {
  /** spine point in the side view */
  point: THREE.Vector2
  /** unit tangent, pointing toward the bill end */
  tangent: THREE.Vector2
  /** unit normal: the tangent turned 90 degrees counter-clockwise, so "up" for a level spine and "back" for a rising neck */
  normal: THREE.Vector2
  up: number
  down: number
  halfWidth: number
}

export interface Profile {
  /** spine arclength, metres */
  readonly length: number
  /** u is the arclength fraction: 0 at the first (tail) station, 1 at the last (bill base) */
  sampleAt(u: number): ProfileSample
  /** u of a labelled station; throws on an unknown label */
  uOf(label: string): number
  /** the cross-section's perimeter from back midline to belly midline (one side), metres */
  halfPerimeter(u: number): number
}

/**
 * Offset of a cross-section point from the spine, for angle theta: 0 is the back midline, pi/2 the right side (+z),
 * pi the belly midline, 3pi/2 the left side. n is along the profile normal, z across the body.
 */
export function sectionOffset(theta: number, up: number, down: number, halfWidth: number): { n: number; z: number } {
  const e = 2 / SQUARENESS
  const c = Math.cos(theta), s = Math.sin(theta)
  const n = Math.sign(c) * Math.abs(c) ** e * (c >= 0 ? up : down)
  const z = Math.sign(s) * Math.abs(s) ** e * halfWidth
  return { n, z }
}

/** Uniform Catmull-Rom on scalars, with the same end extrapolation THREE.CatmullRomCurve3 uses. */
function scalarAt(values: number[], t: number): number {
  const l = values.length
  const p = (l - 1) * t
  let i = Math.floor(p)
  let w = p - i
  if (w === 0 && i === l - 1) { i = l - 2; w = 1 }
  const v1 = values[i]!, v2 = values[i + 1]!
  const v0 = i > 0 ? values[i - 1]! : 2 * v1 - v2
  const v3 = i + 2 < l ? values[i + 2]! : 2 * v2 - v1
  const w2 = w * w, w3 = w2 * w
  return 0.5 * (2 * v1 + (-v0 + v2) * w + (2 * v0 - 5 * v1 + 4 * v2 - v3) * w2 + (-v0 + 3 * v1 - 3 * v2 + v3) * w3)
}

const DIVISIONS = 400

export function createProfile(stations: readonly Station[]): Profile {
  if (stations.length < 4) throw new Error('a profile needs at least 4 stations')
  const curve = new THREE.CatmullRomCurve3(stations.map(s => new THREE.Vector3(s.x, s.y, 0)), false, 'centripetal')
  curve.arcLengthDivisions = DIVISIONS
  const lengths = curve.getLengths(DIVISIONS)
  const length = lengths[DIVISIONS]!
  const ups = stations.map(s => s.up), downs = stations.map(s => s.down), widths = stations.map(s => s.halfWidth)
  const floor = Math.min(...ups, ...downs, ...widths) * 0.5

  const uAtT = (t: number): number => {
    const p = t * DIVISIONS
    const i = Math.min(Math.floor(p), DIVISIONS - 1)
    const w = p - i
    return (lengths[i]! * (1 - w) + lengths[i + 1]! * w) / length
  }
  const labels = new Map<string, number>()
  stations.forEach((s, i) => { if (s.label) labels.set(s.label, uAtT(i / (stations.length - 1))) })

  const p3 = new THREE.Vector3()
  function sampleAt(u: number): ProfileSample {
    // distance 0 is falsy, so three maps by the fraction u (the typings insist on a number)
    const t = curve.getUtoTmapping(THREE.MathUtils.clamp(u, 0, 1), 0)
    curve.getPoint(t, p3)
    const point = new THREE.Vector2(p3.x, p3.y)
    curve.getTangent(t, p3)
    const tangent = new THREE.Vector2(p3.x, p3.y).normalize()
    const normal = new THREE.Vector2(-tangent.y, tangent.x)
    return {
      point, tangent, normal,
      up: Math.max(floor, scalarAt(ups, t)),
      down: Math.max(floor, scalarAt(downs, t)),
      halfWidth: Math.max(floor, scalarAt(widths, t)),
    }
  }

  return {
    length,
    sampleAt,
    uOf(label) {
      const u = labels.get(label)
      if (u === undefined) throw new Error(`unknown station label "${label}"`)
      return u
    },
    halfPerimeter(u) {
      const { up, down, halfWidth } = sampleAt(u)
      let sum = 0
      let prev = sectionOffset(0, up, down, halfWidth)
      for (let k = 1; k <= 24; k++) {
        const o = sectionOffset((k / 24) * Math.PI, up, down, halfWidth)
        sum += Math.hypot(o.n - prev.n, o.z - prev.z)
        prev = o
      }
      return sum
    },
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/birds/detail/profile.test.ts && npx tsc -p tsconfig.json`
Expected: PASS, `tsc` clean.

- [ ] **Step 5: Commit**

```bash
git add src/birds/detail/profile.ts src/birds/detail/profile.test.ts
git commit -m "feat: the traced side profile, interpolated along the spine"
```

---

### Task 4: Atlas layout, bones, and the mesh assembler

**Files:**
- Create: `src/birds/paint/atlas.ts`, `src/birds/paint/atlas.test.ts`, `src/birds/detail/rig.ts`, `src/birds/detail/rig.test.ts`, `src/birds/detail/mesher.ts`, `src/birds/detail/mesher.test.ts`

**Interfaces:**
- Consumes: `Part` (Task 2).
- Produces:

```ts
// src/birds/paint/atlas.ts
export const ATLAS_SIZE = 512
export const PAD = 3
export interface Rect { x: number; y: number; w: number; h: number }
export const REGIONS: Record<Part, Rect>
export function atlasUV(part: Part, s: number, t: number): [number, number]
export function pixelST(part: Part, px: number, py: number): [number, number]

// src/birds/detail/rig.ts
export const BONE_NAMES   // root body neck neckMid head bill tail wingL wingR wingFoldL wingFoldR legs tibiaL tarsusL toesL tibiaR tarsusR toesR
export type BoneName
export const BONE_INDEX: Record<BoneName, number>
export const BONE_PARENT: Record<BoneName, BoneName | null>
export type Joints = Record<BoneName, THREE.Vector3>
export function createBones(joints: Joints): { bones: Record<BoneName, THREE.Bone>; list: THREE.Bone[] }

// src/birds/detail/mesher.ts
export type Weights = readonly (readonly [BoneName, number])[]
export class Mesher {
  readonly parts: Part[]
  get count(): number; get indexCount(): number
  vertex(p: THREE.Vector3, part: Part, s: number, t: number, weights: Weights): number
  tri(a: number, b: number, c: number): void          // counter-clockwise seen from the visible side
  quad(a: number, b: number, c: number, d: number): void
  position(i: number, target?: THREE.Vector3): THREE.Vector3
  translate(offset: THREE.Vector3): void
  geometry(): THREE.BufferGeometry                    // position, uv, skinIndex, skinWeight, index, normals
}
export function tube(m: Mesher, a: THREE.Vector3, b: THREE.Vector3, ra: number, rb: number, part: Part, s: number, t: number, weights: Weights, radial?: number): { indexFirst: number; indexCount: number }
export function signedVolume(g: THREE.BufferGeometry, first?: number, count?: number): number
```

- Part geometry is authored in part-local `(s, t)` coordinates, both 0..1, and `atlasUV` maps them into that part's region, inset by `PAD` texels. The painter fills the padding by repeating the edge, so mipmaps never bleed a neighbour's colour.
- `signedVolume` is how the tests prove a closed surface faces outward.

- [ ] **Step 1: Write the failing tests**

`src/birds/paint/atlas.test.ts`:

```ts
import { ATLAS_SIZE, REGIONS, atlasUV, pixelST } from './atlas'
import type { Part } from '../detail/spec'

describe('atlas', () => {
  it('maps part (s, t) inside the part region, padding kept clear', () => {
    for (const [part, r] of Object.entries(REGIONS) as [Part, (typeof REGIONS)[Part]][]) {
      const [u0, v0] = atlasUV(part, 0, 0)
      const [u1, v1] = atlasUV(part, 1, 1)
      expect(u0 * ATLAS_SIZE).toBeGreaterThan(r.x)
      expect(u1 * ATLAS_SIZE).toBeLessThan(r.x + r.w)
      expect(v0 * ATLAS_SIZE).toBeGreaterThan(r.y)
      expect(v1 * ATLAS_SIZE).toBeLessThan(r.y + r.h)
    }
  })
  it('round-trips a pixel centre to (s, t) and back', () => {
    const [s, t] = pixelST('bill', REGIONS.bill.x + 40, REGIONS.bill.y + 10)
    const [u, v] = atlasUV('bill', s, t)
    expect(u * ATLAS_SIZE).toBeCloseTo(REGIONS.bill.x + 40.5, 6)
    expect(v * ATLAS_SIZE).toBeCloseTo(REGIONS.bill.y + 10.5, 6)
  })
  it('keeps regions inside the texture and apart', () => {
    const rs = Object.values(REGIONS)
    for (const a of rs) {
      expect(a.x + a.w).toBeLessThanOrEqual(ATLAS_SIZE)
      expect(a.y + a.h).toBeLessThanOrEqual(ATLAS_SIZE)
      for (const b of rs) {
        if (a === b) continue
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
        expect(overlap).toBe(false)
      }
    }
  })
})
```

`src/birds/detail/rig.test.ts`:

```ts
import * as THREE from 'three'
import { BONE_NAMES, BONE_PARENT, createBones, type Joints } from './rig'

describe('createBones', () => {
  const joints = Object.fromEntries(BONE_NAMES.map((n, i) => [n, new THREE.Vector3(i * 0.01, i * 0.02, 0)])) as Joints
  const { bones, list } = createBones(joints)
  it('makes one named bone per name, in order', () => {
    expect(list.map(b => b.name)).toEqual([...BONE_NAMES])
  })
  it('parents every bone and puts it at its joint in rest pose', () => {
    const root = new THREE.Group()
    root.add(bones.root)
    root.updateMatrixWorld(true)
    for (const n of BONE_NAMES) {
      const parent = BONE_PARENT[n]
      expect(bones[n].parent).toBe(parent ? bones[parent] : root)
      expect(bones[n].getWorldPosition(new THREE.Vector3()).distanceTo(joints[n])).toBeLessThan(1e-9)
    }
  })
  it('hangs the legs from root, so the body can lean without swinging them', () => {
    expect(BONE_PARENT.legs).toBe('root')
    expect(BONE_PARENT.body).toBe('root')
  })
})
```

`src/birds/detail/mesher.test.ts`:

```ts
import * as THREE from 'three'
import { Mesher, signedVolume, tube } from './mesher'
import { BONE_INDEX } from './rig'

describe('Mesher', () => {
  it('stores position, atlas uv, and up to four bone weights per vertex', () => {
    const m = new Mesher()
    const i = m.vertex(new THREE.Vector3(1, 2, 3), 'bill', 0.5, 0.5, [['head', 0.25], ['bill', 0.75]])
    const g = m.geometry()
    expect(i).toBe(0)
    expect(m.position(0).toArray()).toEqual([1, 2, 3])
    const si = g.getAttribute('skinIndex') as THREE.BufferAttribute
    const sw = g.getAttribute('skinWeight') as THREE.BufferAttribute
    expect([si.getX(0), si.getY(0), si.getZ(0)]).toEqual([BONE_INDEX.head, BONE_INDEX.bill, 0])
    expect([sw.getX(0), sw.getY(0), sw.getZ(0)]).toEqual([0.25, 0.75, 0])
    expect(m.parts).toEqual(['bill'])
  })
  it('refuses a vertex with no weights or more than four', () => {
    const m = new Mesher()
    expect(() => m.vertex(new THREE.Vector3(), 'skin', 0, 0, [])).toThrow()
    expect(() => m.vertex(new THREE.Vector3(), 'skin', 0, 0, [['body', 0.2], ['neck', 0.2], ['head', 0.2], ['bill', 0.2], ['tail', 0.2]])).toThrow()
  })
  it('translates every vertex', () => {
    const m = new Mesher()
    m.vertex(new THREE.Vector3(1, 1, 1), 'skin', 0, 0, [['body', 1]])
    m.translate(new THREE.Vector3(1, -1, 0.5))
    expect(m.position(0).toArray()).toEqual([2, 0, 1.5])
  })
})

describe('tube', () => {
  it('is closed and faces outward in any direction', () => {
    for (const dir of [new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, 0.2, 0), new THREE.Vector3(0, 0, 1)]) {
      const m = new Mesher()
      const r = tube(m, new THREE.Vector3(), dir, 0.01, 0.005, 'legs', 0.5, 0.5, [['legs', 1]])
      expect(signedVolume(m.geometry(), r.indexFirst, r.indexCount)).toBeGreaterThan(0)
    }
  })
})

describe('signedVolume', () => {
  it('measures a closed mesh, negative when turned inside out', () => {
    const box = new THREE.BoxGeometry(1, 2, 3)
    expect(signedVolume(box)).toBeCloseTo(6, 9)
    const idx = box.getIndex()!
    for (let i = 0; i < idx.count; i += 3) { const a = idx.getX(i + 1); idx.setX(i + 1, idx.getX(i + 2)); idx.setX(i + 2, a) }
    expect(signedVolume(box)).toBeCloseTo(-6, 9)
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/birds/paint/atlas.test.ts src/birds/detail/rig.test.ts src/birds/detail/mesher.test.ts`
Expected: FAIL, missing modules.

- [ ] **Step 3: Implement**

`src/birds/paint/atlas.ts`:

```ts
import type { Part } from '../detail/spec'

/**
 * 512 texels puts about 0.5 mm of a yellowlegs' skin in each texel, as fine as the telescope shows it at 22 m
 * (about 400 screen pixels along the bird); a larger atlas costs paint time and memory for detail nobody sees.
 */
export const ATLAS_SIZE = 512
/** texels of edge-replicated padding inside every region, so mipmaps never bleed a neighbour's colour */
export const PAD = 3

export interface Rect { x: number; y: number; w: number; h: number }

/** Pixel rectangles; y counts rows from the bottom of the texture (DataTexture row 0 is v = 0). */
export const REGIONS: Record<Part, Rect> = {
  skin:       { x: 0,   y: 0,   w: 512, h: 256 },
  wingFold:   { x: 0,   y: 256, w: 256, h: 128 },
  wingSpread: { x: 256, y: 256, w: 256, h: 64 },
  wingUnder:  { x: 256, y: 320, w: 256, h: 64 },
  tail:       { x: 0,   y: 384, w: 128, h: 64 },
  tailUnder:  { x: 128, y: 384, w: 128, h: 64 },
  bill:       { x: 256, y: 384, w: 128, h: 32 },
  legs:       { x: 384, y: 384, w: 32,  h: 32 },
  eye:        { x: 416, y: 384, w: 32,  h: 32 },
}

/** Texture coordinates for part-local (s, t), both 0..1: s runs along the region's width, t up its height. */
export function atlasUV(part: Part, s: number, t: number): [number, number] {
  const r = REGIONS[part]
  const px = r.x + PAD + Math.min(Math.max(s, 0), 1) * (r.w - 2 * PAD)
  const py = r.y + PAD + Math.min(Math.max(t, 0), 1) * (r.h - 2 * PAD)
  return [px / ATLAS_SIZE, py / ATLAS_SIZE]
}

/** Part-local (s, t) of a pixel centre inside a region, clamped to 0..1 so the padding repeats the edge. */
export function pixelST(part: Part, px: number, py: number): [number, number] {
  const r = REGIONS[part]
  const s = (px + 0.5 - r.x - PAD) / (r.w - 2 * PAD)
  const t = (py + 0.5 - r.y - PAD) / (r.h - 2 * PAD)
  return [Math.min(Math.max(s, 0), 1), Math.min(Math.max(t, 0), 1)]
}
```

`src/birds/detail/rig.ts`:

```ts
import * as THREE from 'three'

export const BONE_NAMES = [
  'root', 'body', 'neck', 'neckMid', 'head', 'bill', 'tail',
  'wingL', 'wingR', 'wingFoldL', 'wingFoldR',
  'legs', 'tibiaL', 'tarsusL', 'toesL', 'tibiaR', 'tarsusR', 'toesR',
] as const
export type BoneName = (typeof BONE_NAMES)[number]

export const BONE_INDEX = Object.fromEntries(BONE_NAMES.map((n, i) => [n, i])) as Record<BoneName, number>

/**
 * The legs hang from root, not body, so leaning the body (pecking, tip-ups) pivots it over the hips without
 * swinging the planted feet.
 */
export const BONE_PARENT: Record<BoneName, BoneName | null> = {
  root: null, body: 'root', neck: 'body', neckMid: 'neck', head: 'neckMid', bill: 'head', tail: 'body',
  wingL: 'body', wingR: 'body', wingFoldL: 'body', wingFoldR: 'body',
  legs: 'root', tibiaL: 'legs', tarsusL: 'tibiaL', toesL: 'tarsusL', tibiaR: 'legs', tarsusR: 'tibiaR', toesR: 'tarsusR',
}

export type Joints = Record<BoneName, THREE.Vector3>

/** Bones at the given group-space joints, parented per BONE_PARENT, in rest pose (no rotation). */
export function createBones(joints: Joints): { bones: Record<BoneName, THREE.Bone>; list: THREE.Bone[] } {
  const bones = {} as Record<BoneName, THREE.Bone>
  for (const name of BONE_NAMES) {
    const b = new THREE.Bone()
    b.name = name
    bones[name] = b
  }
  for (const name of BONE_NAMES) {
    const parent = BONE_PARENT[name]
    const b = bones[name]
    if (parent) {
      b.position.copy(joints[name]).sub(joints[parent])
      bones[parent].add(b)
    } else {
      b.position.copy(joints[name])
    }
  }
  return { bones, list: BONE_NAMES.map(n => bones[n]) }
}
```

`src/birds/detail/mesher.ts`:

```ts
import * as THREE from 'three'
import { BONE_INDEX, type BoneName } from './rig'
import { atlasUV } from '../paint/atlas'
import type { Part } from './spec'

/** Up to four bone influences; weights should sum to 1. */
export type Weights = readonly (readonly [BoneName, number])[]

/** Collects vertices (position, atlas uv, skinning) and triangles for one skinned geometry. */
export class Mesher {
  private readonly pos: number[] = []
  private readonly uv: number[] = []
  private readonly skinIndex: number[] = []
  private readonly skinWeight: number[] = []
  private readonly index: number[] = []
  /** part of every vertex, for measurement and tests */
  readonly parts: Part[] = []

  get count(): number { return this.pos.length / 3 }
  get indexCount(): number { return this.index.length }

  vertex(p: THREE.Vector3, part: Part, s: number, t: number, weights: Weights): number {
    if (weights.length === 0 || weights.length > 4) throw new Error(`a vertex needs 1 to 4 bone weights, got ${weights.length}`)
    const [u, v] = atlasUV(part, s, t)
    this.pos.push(p.x, p.y, p.z)
    this.uv.push(u, v)
    for (let k = 0; k < 4; k++) {
      const w = weights[k]
      this.skinIndex.push(w ? BONE_INDEX[w[0]] : 0)
      this.skinWeight.push(w ? w[1] : 0)
    }
    this.parts.push(part)
    return this.count - 1
  }

  /** a, b, c counter-clockwise seen from the side the face should show */
  tri(a: number, b: number, c: number): void { this.index.push(a, b, c) }

  /** a, b, c, d counter-clockwise seen from the side the face should show */
  quad(a: number, b: number, c: number, d: number): void { this.tri(a, b, c); this.tri(a, c, d) }

  /** Vertex position by index. */
  position(i: number, target = new THREE.Vector3()): THREE.Vector3 {
    return target.set(this.pos[i * 3]!, this.pos[i * 3 + 1]!, this.pos[i * 3 + 2]!)
  }

  /** Move every vertex (the builder authors in the profile frame, then shifts into group space). */
  translate(offset: THREE.Vector3): void {
    for (let i = 0; i < this.pos.length; i += 3) {
      this.pos[i]! += offset.x
      this.pos[i + 1]! += offset.y
      this.pos[i + 2]! += offset.z
    }
  }

  geometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2))
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.skinIndex, 4))
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.skinWeight, 4))
    g.setIndex(this.index)
    g.computeVertexNormals()
    return g
  }
}

/**
 * A closed tapered tube from a to b (radius ra at a, rb at b), capped at both ends, every face outward.
 * Returns the index range it added, for volume checks.
 */
export function tube(
  m: Mesher, a: THREE.Vector3, b: THREE.Vector3, ra: number, rb: number,
  part: Part, s: number, t: number, weights: Weights, radial = 6,
): { indexFirst: number; indexCount: number } {
  const indexFirst = m.indexCount
  const w = b.clone().sub(a).normalize()
  const ref = Math.abs(w.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0)
  const u1 = w.clone().cross(ref).normalize()
  const u2 = w.clone().cross(u1)          // (u1, u2, w) is right-handed
  const ringAt = (c: THREE.Vector3, r: number) => {
    const out: number[] = []
    for (let j = 0; j < radial; j++) {
      const th = (j / radial) * Math.PI * 2
      const p = c.clone().addScaledVector(u1, Math.cos(th) * r).addScaledVector(u2, Math.sin(th) * r)
      out.push(m.vertex(p, part, s, t, weights))
    }
    return out
  }
  const ra_ = ringAt(a, ra), rb_ = ringAt(b, rb)
  for (let j = 0; j < radial; j++) {
    const j1 = (j + 1) % radial
    m.quad(ra_[j]!, ra_[j1]!, rb_[j1]!, rb_[j]!)
  }
  const ca = m.vertex(a, part, s, t, weights), cb = m.vertex(b, part, s, t, weights)
  for (let j = 0; j < radial; j++) {
    const j1 = (j + 1) % radial
    m.tri(ca, ra_[j1]!, ra_[j]!)
    m.tri(cb, rb_[j]!, rb_[j1]!)
  }
  return { indexFirst, indexCount: m.indexCount - indexFirst }
}

/** Signed volume of a closed triangle mesh; positive when every face points outward. */
export function signedVolume(g: THREE.BufferGeometry, first = 0, count?: number): number {
  const pos = g.getAttribute('position') as THREE.BufferAttribute
  const idx = g.getIndex()!
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
  const end = count === undefined ? idx.count : first + count
  let v = 0
  for (let i = first; i < end; i += 3) {
    a.fromBufferAttribute(pos, idx.getX(i))
    b.fromBufferAttribute(pos, idx.getX(i + 1))
    c.fromBufferAttribute(pos, idx.getX(i + 2))
    v += a.dot(b.clone().cross(c)) / 6
  }
  return v
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/birds/paint src/birds/detail && npx tsc -p tsconfig.json`
Expected: PASS, `tsc` clean.

- [ ] **Step 5: Commit**

```bash
git add src/birds/paint/atlas.ts src/birds/paint/atlas.test.ts src/birds/detail/rig.ts src/birds/detail/rig.test.ts src/birds/detail/mesher.ts src/birds/detail/mesher.test.ts
git commit -m "feat: atlas regions, the bird skeleton, and a skinned-mesh assembler"
```

---

### Task 5: The body-neck-head loft

**Files:**
- Create: `src/birds/detail/loft.ts`, `src/birds/detail/loft.test.ts`

**Interfaces:**
- Consumes: `Profile`, `sectionOffset` (Task 3); `Mesher`, `Weights` (Task 4).
- Produces:

```ts
export const RINGS = 64
export const RADIAL = 24
export interface LoftRig { neckBase: string; neckMid: string; head: string }
export interface LoftResult { first: number; count: number; indexFirst: number; indexCount: number; ringU: number[] }
export function ringT(theta: number): number
export function loftWeights(u: number, profile: Profile, rig: LoftRig): Weights
export function buildLoft(m: Mesher, profile: Profile, rig: LoftRig): LoftResult
export function worstFold(profile: Profile, rig: LoftRig): number       // metres; 0 when no ring folds back
```

- Each ring's vertex `j` sits at angle `j / RADIAL x 2π`, starting at the back midline.
- Texture `t` is the same on both sides (`ringT`), so there is no seam and no duplicated vertex.
- Skin weights hand off body → `neck` → `neckMid` → `head`, linearly between the rig's labelled stations, and always sum to 1.

- [ ] **Step 1: Write the failing test**

`src/birds/detail/loft.test.ts`:

```ts
import * as THREE from 'three'
import { buildLoft, loftWeights, ringT, worstFold, RINGS, RADIAL } from './loft'
import { createProfile } from './profile'
import { Mesher, signedVolume } from './mesher'
import { TEST_DETAIL } from './fixture'

const profile = createProfile(TEST_DETAIL.profile)

function built() {
  const m = new Mesher()
  const r = buildLoft(m, profile, TEST_DETAIL.rig)
  return { m, r, g: m.geometry() }
}

describe('ringT', () => {
  it('is 0 on the back, 1 on the belly, and the same on both sides', () => {
    expect(ringT(0)).toBe(0)
    expect(ringT(Math.PI)).toBe(1)
    expect(ringT(Math.PI / 2)).toBeCloseTo(ringT((3 * Math.PI) / 2), 9)
  })
})

describe('loftWeights', () => {
  it('always sums to 1 and hands off body -> neck -> neckMid -> head', () => {
    for (let k = 0; k <= 100; k++) {
      const w = loftWeights(k / 100, profile, TEST_DETAIL.rig)
      expect(w.reduce((a, [, x]) => a + x, 0)).toBeCloseTo(1, 9)
    }
    expect(loftWeights(0, profile, TEST_DETAIL.rig)).toEqual([['body', 1]])
    expect(loftWeights(1, profile, TEST_DETAIL.rig)).toEqual([['head', 1]])
    const mid = loftWeights((profile.uOf('neckBase') + profile.uOf('neckMid')) / 2, profile, TEST_DETAIL.rig)
    expect(mid.map(([b]) => b)).toEqual(['neck', 'neckMid'])
  })
})

describe('buildLoft', () => {
  it('makes RINGS x RADIAL vertices plus two cap points', () => {
    const { r } = built()
    expect(r.count).toBe(RINGS * RADIAL + 2)
    expect(r.ringU).toHaveLength(RINGS)
  })
  it('is a closed surface facing outward', () => {
    const { r, g } = built()
    expect(signedVolume(g, r.indexFirst, r.indexCount)).toBeGreaterThan(0)
  })
  it('spans the traced profile', () => {
    const { g } = built()
    g.computeBoundingBox()
    const b = g.boundingBox!
    const xs = TEST_DETAIL.profile.map(s => s.x)
    expect(b.min.x).toBeLessThan(Math.min(...xs))
    expect(b.max.x).toBeGreaterThan(Math.max(...xs))
    const hip = TEST_DETAIL.profile.find(s => s.label === 'hip')!
    expect(b.max.z).toBeCloseTo(Math.max(...TEST_DETAIL.profile.map(s => s.halfWidth)), 2)
    expect(b.min.y).toBeLessThan(hip.y - hip.down + 0.001)
  })
  it('puts t = 0 on the back midline (z = 0, above the spine)', () => {
    const { m, r } = built()
    const uv = m.geometry().getAttribute('uv') as THREE.BufferAttribute
    const i = r.first + Math.floor(RINGS / 3) * RADIAL      // a body ring, radial index 0
    const p = m.position(i)
    expect(p.z).toBeCloseTo(0, 9)
    const s = profile.sampleAt(Math.floor(RINGS / 3) / (RINGS - 1))
    expect(p.y).toBeGreaterThan(s.point.y)
    // skin v runs over the skin region's rows; the back midline is its first usable row
    const v0 = uv.getY(i), vBelly = uv.getY(i + RADIAL / 2)
    expect(v0).toBeLessThan(vBelly)
  })
  it('never folds a ring back over its neighbour (the neck turn is gentle enough)', () => {
    expect(worstFold(profile, TEST_DETAIL.rig)).toBe(0)
  })
  it('catches a spine that turns too tightly for its girth', () => {
    const tight = TEST_DETAIL.profile.map(s => (s.label === 'crown' ? { ...s, x: s.x - 0.012, y: s.y + 0.006 } : s))
    expect(worstFold(createProfile(tight), TEST_DETAIL.rig)).toBeGreaterThan(0.0005)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/birds/detail/loft.test.ts`
Expected: FAIL, `Cannot find module './loft'`.

- [ ] **Step 3: Implement**

`src/birds/detail/loft.ts`:

```ts
import * as THREE from 'three'
import { sectionOffset, type Profile } from './profile'
import { Mesher, type Weights } from './mesher'

export const RINGS = 64
export const RADIAL = 24

export interface LoftRig { neckBase: string; neckMid: string; head: string }

export interface LoftResult {
  /** first vertex and vertex count of the loft */
  first: number
  count: number
  /** first index and index count of the loft's triangles (a closed surface) */
  indexFirst: number
  indexCount: number
  /** arclength fraction of each ring */
  ringU: number[]
}

/** Texture t for a ring angle: 0 on the back midline, 1 on the belly midline, the same on both sides. */
export function ringT(theta: number): number {
  return theta <= Math.PI ? theta / Math.PI : (2 * Math.PI - theta) / Math.PI
}

/**
 * Skin weights along the spine: body until just before the neck base, then a linear hand-off
 * body -> neck -> neckMid -> head between the labelled stations. Always sums to 1.
 */
export function loftWeights(u: number, profile: Profile, rig: LoftRig): Weights {
  const kNB = profile.uOf(rig.neckBase), kNM = profile.uOf(rig.neckMid), kH = profile.uOf(rig.head)
  const kB = Math.max(0, kNB - 0.08)
  const blend = (a: 'body' | 'neck' | 'neckMid', b: 'neck' | 'neckMid' | 'head', lo: number, hi: number): Weights => {
    const w = (u - lo) / (hi - lo)
    return [[a, 1 - w], [b, w]]
  }
  if (u <= kB) return [['body', 1]]
  if (u < kNB) return blend('body', 'neck', kB, kNB)
  if (u < kNM) return blend('neck', 'neckMid', kNB, kNM)
  if (u < kH) return blend('neckMid', 'head', kNM, kH)
  return [['head', 1]]
}

/** The body-neck-head surface: RINGS cross-sections swept along the spine, closed at both ends. */
export function buildLoft(m: Mesher, profile: Profile, rig: LoftRig): LoftResult {
  const first = m.count
  const indexFirst = m.indexCount
  const ringU: number[] = []
  const ring: number[][] = []
  const p = new THREE.Vector3()
  for (let i = 0; i < RINGS; i++) {
    const u = i / (RINGS - 1)
    ringU.push(u)
    const s = profile.sampleAt(u)
    const weights = loftWeights(u, profile, rig)
    const row: number[] = []
    for (let j = 0; j < RADIAL; j++) {
      const theta = (j / RADIAL) * Math.PI * 2
      const o = sectionOffset(theta, s.up, s.down, s.halfWidth)
      p.set(s.point.x + s.normal.x * o.n, s.point.y + s.normal.y * o.n, o.z)
      row.push(m.vertex(p, 'skin', u, ringT(theta), weights))
    }
    ring.push(row)
  }
  // sides: theta runs counter-clockwise around the tangent, so (i,j) (i,j+1) (i+1,j+1) (i+1,j) faces outward
  for (let i = 0; i < RINGS - 1; i++) {
    for (let j = 0; j < RADIAL; j++) {
      const j1 = (j + 1) % RADIAL
      m.quad(ring[i]![j]!, ring[i]![j1]!, ring[i + 1]![j1]!, ring[i + 1]![j]!)
    }
  }
  // caps: a point a little beyond each end ring
  const s0 = profile.sampleAt(0), s1 = profile.sampleAt(1)
  const rear = m.vertex(new THREE.Vector3(
    s0.point.x - s0.tangent.x * Math.min(s0.up, s0.down) * 0.6,
    s0.point.y - s0.tangent.y * Math.min(s0.up, s0.down) * 0.6, 0), 'skin', 0, 0.5, loftWeights(0, profile, rig))
  const front = m.vertex(new THREE.Vector3(
    s1.point.x + s1.tangent.x * Math.min(s1.up, s1.down) * 0.3,
    s1.point.y + s1.tangent.y * Math.min(s1.up, s1.down) * 0.3, 0), 'skin', 1, 0.5, loftWeights(1, profile, rig))
  for (let j = 0; j < RADIAL; j++) {
    const j1 = (j + 1) % RADIAL
    m.tri(rear, ring[0]![j1]!, ring[0]![j]!)
    m.tri(front, ring[RINGS - 1]![j]!, ring[RINGS - 1]![j1]!)
  }
  return { first, count: m.count - first, indexFirst, indexCount: m.indexCount - indexFirst, ringU }
}

/**
 * The furthest any ring of the loft folds back over the ring before it, metres (0 when none do). A spine that
 * turns tighter than the section is deep on its inside creases the surface; species tests hold this at 0.
 */
export function worstFold(profile: Profile, rig: LoftRig): number {
  const m = new Mesher()
  const r = buildLoft(m, profile, rig)
  const t = new THREE.Vector3()
  let worst = 0
  for (let i = 0; i < RINGS - 1; i++) {
    const s = profile.sampleAt(r.ringU[i]!)
    t.set(s.tangent.x, s.tangent.y, 0)
    for (let j = 0; j < RADIAL; j++) {
      const step = m.position(r.first + (i + 1) * RADIAL + j).sub(m.position(r.first + i * RADIAL + j)).dot(t)
      worst = Math.max(worst, -step)
    }
  }
  return worst
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/birds/detail && npx tsc -p tsconfig.json`
Expected: PASS. If "never folds a ring back" fails, the fixture's stations were copied wrong: the head stations must be the arc-placed ones in Task 2's fixture.

- [ ] **Step 5: Commit**

```bash
git add src/birds/detail/loft.ts src/birds/detail/loft.test.ts
git commit -m "feat: loft the body, neck, and head along the traced spine"
```

---

### Task 6: Bill, eyes, wings, and tail

**Files:**
- Create: `src/birds/detail/bill.ts`, `src/birds/detail/wing.ts`, `src/birds/detail/tail.ts`, `src/birds/detail/parts.test.ts`

**Interfaces:**
- Consumes: `Profile`, `sectionOffset`, `SQUARENESS`, `ProfileSample` (Task 3); `Mesher` (Task 4); `ringT` (Task 5); `DetailSpec` (Task 2).
- Produces:

```ts
// bill.ts
export interface BillResult { base: THREE.Vector3; tip: THREE.Vector3; dir: THREE.Vector3; up: THREE.Vector3; baseRing: THREE.Vector3[]; indexFirst: number; indexCount: number }
export function billCenter(detail: DetailSpec, profile: Profile, sigma: number): { p: THREE.Vector2; tangent: THREE.Vector2 }
export function buildBill(m: Mesher, detail: DetailSpec, profile: Profile): BillResult
export function eyePlacement(detail: DetailSpec, profile: Profile): { center: THREE.Vector3; outward: THREE.Vector3 }
export function buildEyes(m: Mesher, detail: DetailSpec, profile: Profile): void
// wing.ts
export const SPAN = 1.78; export const ROOT_CHORD = 0.42
export function outlineAt(outline: readonly (readonly [number, number])[], s: number): number
export function bodySurfaceZ(profile: Profile, x: number, y: number): number
export interface FoldResult { wrist: THREE.Vector3; tip: THREE.Vector3 }
export function buildFoldedWings(m: Mesher, detail: DetailSpec, profile: Profile): FoldResult
export function shoulderAt(detail: DetailSpec, profile: Profile): THREE.Vector3
export function buildSpreadWings(m: Mesher, detail: DetailSpec, shoulder: THREE.Vector3): void
// tail.ts
export const ROOT_WIDTH = 0.55; export const TIP_SPREAD = 1.3
export function tipShape(shape: DetailSpec['tail']['shape'], t: number): number
export interface TailResult { root: THREE.Vector3; tip: THREE.Vector3; width: number }
export function buildTail(m: Mesher, detail: DetailSpec, profile: Profile): TailResult
```

- All results are in the profile frame. The builder moves everything into group space in Task 9.
- The bill's exposed length (the forehead to the tip) is exactly `measurements.culmen`. `curve` lifts the distal half so that the tip rises by `curve x culmen`.
- The folded wing's wrist-to-tip distance is exactly `measurements.wingChord`, and the tail is exactly `measurements.tail`. The primary projection falls out of these; it is not set.

- [ ] **Step 1: Write the failing test**

`src/birds/detail/parts.test.ts`:

```ts
import * as THREE from 'three'
import { createProfile } from './profile'
import { Mesher, signedVolume } from './mesher'
import { buildBill, billCenter, buildEyes, eyePlacement } from './bill'
import { buildFoldedWings, buildSpreadWings, shoulderAt, bodySurfaceZ, outlineAt } from './wing'
import { buildTail, tipShape } from './tail'
import { TEST_DETAIL } from './fixture'
import type { Part } from './spec'

const profile = createProfile(TEST_DETAIL.profile)

/** Average vertex normal of every vertex painted on `part`. */
function meanNormal(m: Mesher, g: THREE.BufferGeometry, part: Part, filter: (p: THREE.Vector3) => boolean = () => true): THREE.Vector3 {
  const n = g.getAttribute('normal') as THREE.BufferAttribute
  const sum = new THREE.Vector3()
  m.parts.forEach((p, i) => { if (p === part && filter(m.position(i))) sum.add(new THREE.Vector3().fromBufferAttribute(n, i)) })
  return sum.normalize()
}

describe('bill', () => {
  it('is culmen long from the forehead to the tip', () => {
    const m = new Mesher()
    const b = buildBill(m, TEST_DETAIL, profile)
    expect(b.tip.distanceTo(b.base)).toBeCloseTo(TEST_DETAIL.measurements.culmen, 3)
  })
  it('is closed and faces outward', () => {
    const m = new Mesher()
    const b = buildBill(m, TEST_DETAIL, profile)
    expect(signedVolume(m.geometry(), b.indexFirst, b.indexCount)).toBeGreaterThan(0)
  })
  it('lifts the tip by curve x length, and stays straight at curve 0', () => {
    const up = buildBill(new Mesher(), TEST_DETAIL, profile)
    const rise = up.tip.clone().sub(up.base).dot(up.up)
    expect(rise).toBeCloseTo(TEST_DETAIL.bill.curve * TEST_DETAIL.measurements.culmen, 4)
    const straight = buildBill(new Mesher(), { ...TEST_DETAIL, bill: { ...TEST_DETAIL.bill, curve: 0 } }, profile)
    expect(Math.abs(straight.tip.clone().sub(straight.base).dot(straight.up))).toBeLessThan(1e-6)
  })
  it('curves only over the distal half', () => {
    const mid = billCenter(TEST_DETAIL, profile, 0.5).p
    const flat = billCenter({ ...TEST_DETAIL, bill: { ...TEST_DETAIL.bill, curve: 0 } }, profile, 0.5).p
    expect(mid.distanceTo(flat)).toBeLessThan(1e-9)
  })
  it('is billDepth deep where it leaves the forehead', () => {
    const b = buildBill(new Mesher(), TEST_DETAIL, profile)
    const ys = b.baseRing.map(v => v.clone().sub(b.base).dot(b.up))
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(TEST_DETAIL.measurements.billDepth, 3)
  })
})

describe('eyes', () => {
  it('sit on either side of the head, facing out', () => {
    const { center, outward } = eyePlacement(TEST_DETAIL, profile)
    expect(center.z).toBeGreaterThan(0)
    expect(outward.z).toBeGreaterThan(0.5)
    const m = new Mesher()
    buildEyes(m, TEST_DETAIL, profile)
    const g = m.geometry()
    expect(meanNormal(m, g, 'eye', p => p.z > 0).z).toBeGreaterThan(0)
    expect(meanNormal(m, g, 'eye', p => p.z < 0).z).toBeLessThan(0)
  })
})

describe('folded wings', () => {
  it('reach wingChord from the wrist to the tip', () => {
    const f = buildFoldedWings(new Mesher(), TEST_DETAIL, profile)
    expect(f.tip.clone().setZ(0).distanceTo(f.wrist.clone().setZ(0))).toBeCloseTo(TEST_DETAIL.measurements.wingChord, 4)
  })
  it('lie outside the flank and face away from the body', () => {
    const m = new Mesher()
    buildFoldedWings(m, TEST_DETAIL, profile)
    m.parts.forEach((p, i) => {
      if (p !== 'wingFold') return
      const v = m.position(i)
      expect(Math.abs(v.z)).toBeGreaterThanOrEqual(bodySurfaceZ(profile, v.x, v.y))
    })
    const g = m.geometry()
    expect(meanNormal(m, g, 'wingFold', p => p.z > 0).z).toBeGreaterThan(0.5)
    expect(meanNormal(m, g, 'wingFold', p => p.z < 0).z).toBeLessThan(-0.5)
  })
  it('interpolates the outline', () => {
    expect(outlineAt([[0, 0.1], [1, 0.3]], 0.5)).toBeCloseTo(0.2, 9)
    expect(outlineAt([[0, 0.1], [1, 0.3]], 2)).toBe(0.3)
  })
})

describe('spread wings', () => {
  it('show their upper face up and their under face down, on both sides', () => {
    const m = new Mesher()
    buildSpreadWings(m, TEST_DETAIL, shoulderAt(TEST_DETAIL, profile))
    const g = m.geometry()
    for (const side of [1, -1]) {
      expect(meanNormal(m, g, 'wingSpread', p => p.z * side > 0).y).toBeGreaterThan(0.9)
      expect(meanNormal(m, g, 'wingUnder', p => p.z * side > 0).y).toBeLessThan(-0.9)
    }
  })
})

describe('tail', () => {
  it('is tail long from the tail base, pointing back', () => {
    const t = buildTail(new Mesher(), TEST_DETAIL, profile)
    expect(t.tip.distanceTo(t.root)).toBeCloseTo(TEST_DETAIL.measurements.tail, 4)
    expect(t.tip.x).toBeLessThan(t.root.x)
  })
  it('shows its upper face up and its under face down', () => {
    const m = new Mesher()
    buildTail(m, TEST_DETAIL, profile)
    const g = m.geometry()
    expect(meanNormal(m, g, 'tail').y).toBeGreaterThan(0.8)
    expect(meanNormal(m, g, 'tailUnder').y).toBeLessThan(-0.8)
  })
  it('shapes the tip: square flat, rounded and wedge longer in the middle, notched shorter', () => {
    expect(tipShape('square', 0.5)).toBe(0)
    expect(tipShape('rounded', 0.5)).toBeGreaterThan(tipShape('rounded', 0))
    expect(tipShape('wedge', 0.5)).toBeGreaterThan(tipShape('rounded', 0.5))
    expect(tipShape('notched', 0.5)).toBeLessThan(0)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/birds/detail/parts.test.ts`
Expected: FAIL, missing modules.

- [ ] **Step 3: Implement**

`src/birds/detail/bill.ts`:

```ts
import * as THREE from 'three'
import { sectionOffset, type Profile } from './profile'
import type { DetailSpec } from './spec'
import type { Mesher } from './mesher'
import { ringT } from './loft'

const RINGS = 16
const RADIAL = 12
/** the bill's root starts this fraction of its length inside the head */
const ROOT = 0.15

export interface BillResult {
  /** where the bill leaves the forehead (profile frame, z = 0) */
  base: THREE.Vector3
  tip: THREE.Vector3
  /** unit direction of the bill at its base, and the up normal of the side view */
  dir: THREE.Vector3
  up: THREE.Vector3
  /** the ring nearest sigma = 0, where the bill leaves the forehead */
  baseRing: THREE.Vector3[]
  indexFirst: number
  indexCount: number
}

/**
 * The bill's centreline in the side view for sigma in [-ROOT, 1] (0 = base, 1 = tip): straight along the
 * spine's final tangent, lifted over the distal half by `curve` x length at the tip.
 */
export function billCenter(detail: DetailSpec, profile: Profile, sigma: number): { p: THREE.Vector2; tangent: THREE.Vector2 } {
  const end = profile.sampleAt(1)
  const L = detail.measurements.culmen
  const k = detail.bill.curve * L
  const q = Math.max(0, (sigma - 0.5) / 0.5)
  const p = end.point.clone().addScaledVector(end.tangent, sigma * L).addScaledVector(end.normal, k * q * q)
  const dq = sigma > 0.5 ? (2 * q) / 0.5 : 0      // d(q^2)/dsigma
  const tangent = end.tangent.clone().multiplyScalar(L).addScaledVector(end.normal, k * dq).normalize()
  return { p, tangent }
}

export function buildBill(m: Mesher, detail: DetailSpec, profile: Profile): BillResult {
  const indexFirst = m.indexCount
  const { billDepth, billWidth } = detail.measurements
  const rings: number[][] = []
  for (let i = 0; i < RINGS; i++) {
    const sigma = -ROOT + ((1 + ROOT) * i) / RINGS         // the last ring stops short of the tip
    const { p, tangent } = billCenter(detail, profile, sigma)
    const normal = new THREE.Vector2(-tangent.y, tangent.x)
    const f = 1 - 0.85 * Math.max(0, sigma) ** detail.bill.taper
    const d = (billDepth / 2) * f, w = (billWidth / 2) * f
    const row: number[] = []
    for (let j = 0; j < RADIAL; j++) {
      const th = (j / RADIAL) * Math.PI * 2
      const n = Math.cos(th) * d, z = Math.sin(th) * w
      row.push(m.vertex(new THREE.Vector3(p.x + normal.x * n, p.y + normal.y * n, z), 'bill', Math.max(0, sigma), ringT(th), [['bill', 1]]))
    }
    rings.push(row)
  }
  for (let i = 0; i < RINGS - 1; i++) {
    for (let j = 0; j < RADIAL; j++) {
      const j1 = (j + 1) % RADIAL
      m.quad(rings[i]![j]!, rings[i]![j1]!, rings[i + 1]![j1]!, rings[i + 1]![j]!)
    }
  }
  const root = billCenter(detail, profile, -ROOT).p
  const tip2 = billCenter(detail, profile, 1).p
  const rootV = m.vertex(new THREE.Vector3(root.x, root.y, 0), 'bill', 0, 0.5, [['bill', 1]])
  const tipV = m.vertex(new THREE.Vector3(tip2.x, tip2.y, 0), 'bill', 1, 0.5, [['bill', 1]])
  for (let j = 0; j < RADIAL; j++) {
    const j1 = (j + 1) % RADIAL
    m.tri(rootV, rings[0]![j1]!, rings[0]![j]!)
    m.tri(tipV, rings[RINGS - 1]![j]!, rings[RINGS - 1]![j1]!)
  }
  const end = profile.sampleAt(1)
  const i0 = Math.round((ROOT * RINGS) / (1 + ROOT))
  return {
    baseRing: rings[i0]!.map(i => m.position(i)),
    base: new THREE.Vector3(end.point.x, end.point.y, 0),
    tip: new THREE.Vector3(tip2.x, tip2.y, 0),
    dir: new THREE.Vector3(end.tangent.x, end.tangent.y, 0),
    up: new THREE.Vector3(end.normal.x, end.normal.y, 0),
    indexFirst, indexCount: m.indexCount - indexFirst,
  }
}

/** Right-eye centre and outward direction (profile frame); the left eye mirrors z. */
export function eyePlacement(detail: DetailSpec, profile: Profile): { center: THREE.Vector3; outward: THREE.Vector3 } {
  const s = profile.sampleAt(profile.uOf('eye'))
  const { n, z } = sectionOffset(detail.eye.t * Math.PI, s.up, s.down, s.halfWidth)
  const surface = new THREE.Vector3(s.point.x + s.normal.x * n, s.point.y + s.normal.y * n, z)
  const ext = n >= 0 ? s.up : s.down
  const outward = new THREE.Vector3(s.normal.x * n / ext, s.normal.y * n / ext, z / s.halfWidth).normalize()
  return { center: surface.addScaledVector(outward, -detail.eye.radius * 0.35), outward }
}

/** Two eyes on the head bone; each maps its outward-facing hemisphere onto the eye region of the atlas. */
export function buildEyes(m: Mesher, detail: DetailSpec, profile: Profile): void {
  const r = detail.eye.radius
  const { center, outward } = eyePlacement(detail, profile)
  const e1 = new THREE.Vector3(1, 0, 0).addScaledVector(outward, -outward.x).normalize()
  const e2 = outward.clone().cross(e1)
  const sphere = new THREE.SphereGeometry(r, 12, 8)
  const pos = sphere.getAttribute('position') as THREE.BufferAttribute
  const idx = sphere.getIndex()!
  for (const side of [1, -1]) {
    const base = m.count
    for (let i = 0; i < pos.count; i++) {
      const q = new THREE.Vector3().fromBufferAttribute(pos, i)
      let a = q.dot(e1) / r, b = q.dot(e2) / r
      if (q.dot(outward) < 0) { const l = Math.hypot(a, b) || 1; a /= l; b /= l }
      const p = center.clone().add(q)
      if (side < 0) p.z = -p.z
      m.vertex(p, 'eye', 0.5 + 0.5 * a, 0.5 + 0.5 * b, [['head', 1]])
    }
    for (let i = 0; i < idx.count; i += 3) {
      const a = base + idx.getX(i), b = base + idx.getX(i + 1), c = base + idx.getX(i + 2)
      if (side > 0) m.tri(a, b, c)
      else m.tri(a, c, b)                 // mirroring z flips the winding
    }
  }
  sphere.dispose()
}
```

`src/birds/detail/wing.ts`:

```ts
import * as THREE from 'three'
import { SQUARENESS, type Profile, type ProfileSample } from './profile'
import type { DetailSpec } from './spec'
import type { Mesher } from './mesher'

const FOLD_S = 14
const FOLD_T = 5
const SPREAD_S = 10
const SPREAD_T = 4
/** gap between the folded wing and the flank, metres */
const GAP = 0.001
/** half the spacing between the two folded wings where they cross over the rump and tail, metres */
const MIN_Z = 0.003
/** the spread wing reaches this multiple of the wing chord out from the shoulder */
export const SPAN = 1.78
/** chord of the spread wing at its root, as a multiple of the wing chord */
export const ROOT_CHORD = 0.42

/** Folded-wing height (fraction of chord) at s, interpolated linearly through the outline. */
export function outlineAt(outline: readonly (readonly [number, number])[], s: number): number {
  if (s <= outline[0]![0]) return outline[0]![1]
  for (let i = 1; i < outline.length; i++) {
    const [s1, h1] = outline[i]!, [s0, h0] = outline[i - 1]!
    if (s <= s1) return h0 + ((h1 - h0) * (s - s0)) / (s1 - s0 || 1)
  }
  return outline[outline.length - 1]![1]
}

const tables = new WeakMap<Profile, ProfileSample[]>()

/** Spine samples over the body and lower neck (the wing never reaches the head), nearest in x to `x`. */
function nearestBodySample(profile: Profile, x: number): ProfileSample {
  let table = tables.get(profile)
  if (!table) {
    table = Array.from({ length: 121 }, (_, k) => profile.sampleAt((k / 120) * 0.6))
    tables.set(profile, table)
  }
  let best = table[0]!, bestD = Infinity
  for (const s of table) {
    const d = Math.abs(s.point.x - x)
    if (d < bestD) { bestD = d; best = s }
  }
  return best
}

/** Half-width of the body surface at side-view point (x, y), from the loft; 0 outside the body. */
export function bodySurfaceZ(profile: Profile, x: number, y: number): number {
  const best = nearestBodySample(profile, x)
  if (x < profile.sampleAt(0).point.x) return 0
  const dy = y - best.point.y
  const r = Math.abs(dy) / (dy >= 0 ? best.up : best.down)
  if (r >= 1) return 0
  return best.halfWidth * (1 - r ** SQUARENESS) ** (1 / SQUARENESS)
}

export interface FoldResult {
  /** right wing, profile frame */
  wrist: THREE.Vector3
  tip: THREE.Vector3
}

/**
 * Folded wings: a shell hugging each flank, hanging from the chord line (wrist to tip). The chord is
 * measurements.wingChord long and droops `droop` degrees below straight back; `outline` sets its height.
 */
export function buildFoldedWings(m: Mesher, detail: DetailSpec, profile: Profile): FoldResult {
  const chord = detail.measurements.wingChord
  const droop = THREE.MathUtils.degToRad(detail.wing.droop)
  const dir = new THREE.Vector2(-Math.cos(droop), -Math.sin(droop))
  const down = new THREE.Vector2(-dir.y, dir.x)
  const [wx, wy] = detail.wing.wrist
  const point = (s: number, t: number): THREE.Vector3 => {
    const h = outlineAt(detail.wing.outline, s) * chord
    const x = wx + dir.x * s * chord + down.x * t * h
    const y = wy + dir.y * s * chord + down.y * t * h
    return new THREE.Vector3(x, y, Math.max(bodySurfaceZ(profile, x, y) + GAP, MIN_Z))
  }
  for (const side of [1, -1] as const) {
    const bone = side > 0 ? 'wingFoldR' : 'wingFoldL'
    const grid: number[][] = []
    for (let i = 0; i < FOLD_S; i++) {
      const row: number[] = []
      for (let j = 0; j < FOLD_T; j++) {
        const s = i / (FOLD_S - 1), t = j / (FOLD_T - 1)
        const p = point(s, t)
        p.z *= side
        row.push(m.vertex(p, 'wingFold', s, t, [[bone, 1]]))
      }
      grid.push(row)
    }
    // s runs back, t runs down: (i,j) (i+1,j) (i+1,j+1) (i,j+1) faces +z; mirror for the left wing
    for (let i = 0; i < FOLD_S - 1; i++) {
      for (let j = 0; j < FOLD_T - 1; j++) {
        const a = grid[i]![j]!, b = grid[i + 1]![j]!, c = grid[i + 1]![j + 1]!, d = grid[i]![j + 1]!
        if (side > 0) m.quad(a, b, c, d)
        else m.quad(a, d, c, b)
      }
    }
  }
  return { wrist: point(0, 0), tip: point(1, 0) }
}

/** Right shoulder joint for the spread wing (profile frame): above the flank, just behind the wrist. */
export function shoulderAt(detail: DetailSpec, profile: Profile): THREE.Vector3 {
  const best = nearestBodySample(profile, detail.wing.wrist[0])
  return new THREE.Vector3(best.point.x, best.point.y + best.up * 0.5, best.halfWidth * 0.8)
}

/**
 * Spread wings, basic this round: a swept, pointed planform in the shoulder's horizontal plane reaching
 * SPAN x chord out along +-z, upper face on 'wingSpread' and under face on 'wingUnder'.
 */
export function buildSpreadWings(m: Mesher, detail: DetailSpec, shoulder: THREE.Vector3): void {
  const c = detail.measurements.wingChord
  const span = SPAN * c, root = ROOT_CHORD * c
  for (const side of [1, -1] as const) {
    const bone = side > 0 ? 'wingR' : 'wingL'
    for (const face of ['wingSpread', 'wingUnder'] as const) {
      const dy = face === 'wingSpread' ? 0.0003 : -0.0003
      const grid: number[][] = []
      for (let i = 0; i < SPREAD_S; i++) {
        const s = i / (SPREAD_S - 1)
        const chord = root * (1 - 0.85 * s ** 1.3)
        const le = 0.25 * root - 0.35 * root * s ** 1.5
        const row: number[] = []
        for (let j = 0; j < SPREAD_T; j++) {
          const t = j / (SPREAD_T - 1)
          const p = new THREE.Vector3(shoulder.x + le - chord * t, shoulder.y + dy, side * (shoulder.z + s * span))
          row.push(m.vertex(p, face, s, t, [[bone, 1]]))
        }
        grid.push(row)
      }
      // s runs out along +-z, t runs back: pick the winding that faces up for the upper face, down for the under
      const up = face === 'wingSpread'
      for (let i = 0; i < SPREAD_S - 1; i++) {
        for (let j = 0; j < SPREAD_T - 1; j++) {
          const a = grid[i]![j]!, b = grid[i]![j + 1]!, cc = grid[i + 1]![j + 1]!, d = grid[i + 1]![j]!
          if ((side > 0) === up) m.quad(a, b, cc, d)
          else m.quad(a, d, cc, b)
        }
      }
    }
  }
}
```

`src/birds/detail/tail.ts`:

```ts
import * as THREE from 'three'
import type { Profile } from './profile'
import type { DetailSpec } from './spec'
import type { Mesher } from './mesher'

const TAIL_S = 6
const TAIL_T = 7
/** tail width at the root, as a fraction of the body's full width at the tail base */
export const ROOT_WIDTH = 0.55
/** tail width at the tip, as a multiple of the root width */
export const TIP_SPREAD = 1.3

/** Extra length at the tip for t across the tail (0 = left edge, 1 = right edge), as a fraction of the tail length. */
export function tipShape(shape: DetailSpec['tail']['shape'], t: number): number {
  const c = 2 * t - 1
  switch (shape) {
    case 'rounded': return 0.08 * (1 - c * c)
    case 'wedge': return 0.15 * (1 - Math.abs(c))
    case 'notched': return -0.08 * (1 - c * c)
    default: return 0
  }
}

export interface TailResult {
  /** profile frame */
  root: THREE.Vector3
  /** middle of the tip edge */
  tip: THREE.Vector3
  width: number
}

/**
 * The tail: a thin, slightly cupped fan rooted at the tailBase station, measurements.tail long, pointing
 * straight back along the spine, lifted by `angle` degrees. Upper face 'tail', under face 'tailUnder'.
 */
export function buildTail(m: Mesher, detail: DetailSpec, profile: Profile): TailResult {
  const base = profile.sampleAt(profile.uOf(detail.rig.tailBase))
  const L = detail.measurements.tail
  const a = THREE.MathUtils.degToRad(detail.tail.angle ?? 0)
  const back = new THREE.Vector2(-base.tangent.x, -base.tangent.y)
  back.set(back.x * Math.cos(a) + back.y * Math.sin(a), -back.x * Math.sin(a) + back.y * Math.cos(a))
  const up = new THREE.Vector2(back.y, -back.x)
  const rootW = base.halfWidth * 2 * ROOT_WIDTH
  const point = (s: number, t: number, lift: number) => {
    const w = rootW * (1 + (TIP_SPREAD - 1) * s)
    const along = s * L * (1 + tipShape(detail.tail.shape, t))
    const cup = -0.12 * w * (2 * t - 1) ** 2 + lift
    return new THREE.Vector3(
      base.point.x + back.x * along + up.x * cup,
      base.point.y + back.y * along + up.y * cup,
      (t - 0.5) * w,
    )
  }
  for (const face of ['tail', 'tailUnder'] as const) {
    const grid: number[][] = []
    for (let i = 0; i < TAIL_S; i++) {
      const row: number[] = []
      for (let j = 0; j < TAIL_T; j++) {
        const s = i / (TAIL_S - 1), t = j / (TAIL_T - 1)
        row.push(m.vertex(point(s, t, face === 'tail' ? 0.0003 : -0.0003), face, s, t, [['tail', 1]]))
      }
      grid.push(row)
    }
    // s runs back, t runs toward +z: (i,j) (i+1,j) (i+1,j+1) (i,j+1) faces up
    for (let i = 0; i < TAIL_S - 1; i++) {
      for (let j = 0; j < TAIL_T - 1; j++) {
        const a_ = grid[i]![j]!, b = grid[i + 1]![j]!, c = grid[i + 1]![j + 1]!, d = grid[i]![j + 1]!
        if (face === 'tail') m.quad(a_, b, c, d)
        else m.quad(a_, d, c, b)
      }
    }
  }
  return { root: point(0, 0.5, 0), tip: point(1, 0.5, 0), width: rootW }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/birds/detail && npx tsc -p tsconfig.json`
Expected: PASS, `tsc` clean.

- [ ] **Step 5: Commit**

```bash
git add src/birds/detail/bill.ts src/birds/detail/wing.ts src/birds/detail/tail.ts src/birds/detail/parts.test.ts
git commit -m "feat: bill, eyes, folded and spread wings, and tail, built to the measurements"
```

---

### Task 7: Legs, IK, and the walk

**Files:**
- Create: `src/birds/detail/gait.ts`, `src/birds/detail/legs.ts`, `src/birds/detail/gait.test.ts`

**Interfaces:**
- Consumes: `Profile` (Task 3); `Mesher`, `tube` (Task 4); `DetailSpec` (Task 2).
- Produces:

```ts
// gait.ts (pure)
export interface V2 { x: number; y: number }
export const STANCE = 0.6
export function solveLeg(hip: V2, target: V2, a: number, b: number): { joint: V2; foot: V2 }
export function footOffset(phase: number, stride: number, lift: number): V2
export function legOffsets(strideDistance: number, gait: number, stepLength: number, lift: number): { left: V2; right: V2 }
// legs.ts
export const DEFAULT_STEP = 0.45
export interface LegLayout { hip: THREE.Vector3; bellyY: number; tibia: number; tarsus: number; toe: number; standHeight: number; footY: number; tarsusRadius: number; knee: THREE.Vector3; foot: THREE.Vector3 }
export function legLayout(detail: DetailSpec, profile: Profile): LegLayout
export function buildLegs(m: Mesher, layout: LegLayout): void
```

- The intertarsal joint always bends back, behind the hip-foot line.
- During stance a foot slides back exactly as fast as the bird walks forward (`strideDistance`), so it stays put in the world.
- `gait` is clamped to 0..1.

- [ ] **Step 1: Write the failing test**

`src/birds/detail/gait.test.ts`:

```ts
import { solveLeg, footOffset, legOffsets, STANCE } from './gait'
import { legLayout } from './legs'
import { createProfile } from './profile'
import { TEST_DETAIL } from './fixture'

const hip = { x: 0, y: 0 }
const a = 0.06, b = 0.06

describe('solveLeg', () => {
  it('reaches a target in range', () => {
    for (const target of [{ x: 0, y: -0.1 }, { x: 0.03, y: -0.09 }, { x: -0.04, y: -0.08 }]) {
      const { joint, foot } = solveLeg(hip, target, a, b)
      expect(foot.x).toBeCloseTo(target.x, 9)
      expect(foot.y).toBeCloseTo(target.y, 9)
      expect(Math.hypot(joint.x - hip.x, joint.y - hip.y)).toBeCloseTo(a, 9)
      expect(Math.hypot(foot.x - joint.x, foot.y - joint.y)).toBeCloseTo(b, 9)
    }
  })
  it('always bends the joint backward of the hip-foot line', () => {
    for (let x = -0.04; x <= 0.04; x += 0.01) {
      const target = { x, y: -0.1 }
      const { joint } = solveLeg(hip, target, a, b)
      // x of the hip-foot line at the joint's height
      const lineX = hip.x + ((target.x - hip.x) * (joint.y - hip.y)) / (target.y - hip.y)
      expect(joint.x).toBeLessThan(lineX)
    }
  })
  it('pulls an out-of-reach target in along the same line', () => {
    const { foot } = solveLeg(hip, { x: 0, y: -1 }, a, b)
    expect(foot.x).toBeCloseTo(0, 9)
    expect(foot.y).toBeCloseTo(-(a + b), 3)
  })
})

describe('footOffset', () => {
  it('slides back exactly as fast as the bird walks during stance', () => {
    const stride = 0.1
    for (let p = 0; p < STANCE - 0.05; p += 0.05) {
      const d0 = p * stride, d1 = (p + 0.05) * stride
      const x0 = footOffset(p, stride, 0.01).x, x1 = footOffset(p + 0.05, stride, 0.01).x
      expect(x1 - x0).toBeCloseTo(-(d1 - d0), 9)           // world x = distance + offset stays fixed
      expect(footOffset(p, stride, 0.01).y).toBe(0)
    }
  })
  it('lifts during swing and lands where stance begins', () => {
    expect(footOffset(STANCE + (1 - STANCE) / 2, 0.1, 0.01).y).toBeCloseTo(0.01, 9)
    expect(footOffset(0.9999999, 0.1, 0.01).x).toBeCloseTo(footOffset(0, 0.1, 0.01).x, 5)
  })
})

describe('legOffsets', () => {
  it('stands still at gait 0 however far the bird has walked', () => {
    const { left, right } = legOffsets(1.234, 0, 0.05, 0.01)
    for (const v of [left.x, left.y, right.x, right.y]) expect(v).toBeCloseTo(0, 12)
  })
  it('clamps gait into 0..1, whatever a behaviour hands it', () => {
    expect(legOffsets(0.03, 4, 0.05, 0.01)).toEqual(legOffsets(0.03, 1, 0.05, 0.01))
    expect(legOffsets(0.03, -2, 0.05, 0.01)).toEqual(legOffsets(0.03, 0, 0.05, 0.01))
  })
  it('keeps the feet half a stride out of phase', () => {
    const { left, right } = legOffsets(0, 1, 0.05, 0.01)
    expect(left.x).toBeCloseTo(0.1 * STANCE * 0.5, 9)        // left starts its stance
    expect(right.y).toBeGreaterThanOrEqual(0)
    expect(right.x).not.toBeCloseTo(left.x, 5)
  })
})

describe('legLayout', () => {
  const layout = legLayout(TEST_DETAIL, createProfile(TEST_DETAIL.profile))
  it('stands the hip at 92% of the leg reach, knee behind', () => {
    expect(layout.standHeight).toBeCloseTo(0.92 * (layout.tibia + layout.tarsus), 9)
    expect(layout.knee.x).toBeLessThan(layout.hip.x)
    expect(layout.hip.y - layout.foot.y).toBeCloseTo(layout.standHeight, 6)
  })
  it('hides part of the tibia in the body and shows measurements.tibia below the belly', () => {
    expect(layout.tibia - (layout.hip.y - layout.bellyY)).toBeCloseTo(TEST_DETAIL.measurements.tibia, 9)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/birds/detail/gait.test.ts`
Expected: FAIL, missing modules.

- [ ] **Step 3: Implement**

`src/birds/detail/gait.ts`:

```ts
export interface V2 { x: number; y: number }

/** fraction of a stride each foot spends on the ground */
export const STANCE = 0.6

/**
 * Analytic two-bone IK in the side view: hip to joint is `a` (tibia), joint to foot is `b` (tarsus). The
 * intertarsal joint always bends backward (-x of the hip-foot line), as a bird's does. An out-of-reach target
 * is pulled in along the hip-target line.
 */
export function solveLeg(hip: V2, target: V2, a: number, b: number): { joint: V2; foot: V2 } {
  let dx = target.x - hip.x, dy = target.y - hip.y
  const d0 = Math.hypot(dx, dy) || 1e-9
  const d = Math.min(Math.max(d0, Math.abs(a - b) + 1e-6), (a + b) * 0.9999)
  dx /= d0; dy /= d0
  const along = (a * a + d * d - b * b) / (2 * d)
  const across = Math.sqrt(Math.max(0, a * a - along * along))
  // of the two perpendiculars to the hip-foot line, take the one pointing back (-x)
  let px = -dy, py = dx
  if (px > 0 || (px === 0 && py < 0)) { px = -px; py = -py }
  return {
    joint: { x: hip.x + dx * along + px * across, y: hip.y + dy * along + py * across },
    foot: { x: hip.x + dx * d, y: hip.y + dy * d },
  }
}

const smooth = (w: number) => w * w * (3 - 2 * w)

/**
 * One foot's offset from its standing position at `phase` (0..1) of a stride `stride` metres long. During
 * stance the foot slides back exactly as fast as the bird moves forward, so it stays put in the world; during
 * swing it lifts on an arc and reaches forward again.
 */
export function footOffset(phase: number, stride: number, lift: number): V2 {
  const travel = stride * STANCE
  if (phase < STANCE) return { x: travel * (0.5 - phase / STANCE), y: 0 }
  const w = (phase - STANCE) / (1 - STANCE)
  return { x: travel * (-0.5 + smooth(w)), y: lift * Math.sin(Math.PI * w) }
}

/**
 * Both feet's offsets for a bird that has walked `strideDistance` metres, blended toward standing by `gait`
 * (0 standing, 1 walking). A stride is two steps; the feet are half a stride apart in phase.
 */
export function legOffsets(strideDistance: number, gait: number, stepLength: number, lift: number): { left: V2; right: V2 } {
  const stride = 2 * stepLength
  const phase = ((strideDistance / stride) % 1 + 1) % 1
  const g = Math.min(Math.max(gait, 0), 1)
  const of = (p: number) => { const o = footOffset(p, stride, lift); return { x: o.x * g, y: o.y * g } }
  return { left: of(phase), right: of((phase + 0.5) % 1) }
}
```

`src/birds/detail/legs.ts`:

```ts
import * as THREE from 'three'
import type { Profile } from './profile'
import type { DetailSpec } from './spec'
import { tube, type Mesher } from './mesher'
import { solveLeg } from './gait'

/** the hip joint sits this fraction of the belly depth below the spine */
const HIP_DEPTH = 0.35
/** hips sit this fraction of the body half-width out from the midline */
const HIP_SPREAD = 0.4
/** standing, the hip is this fraction of the leg's full reach above the foot */
const STAND = 0.92
/** tarsus diameter as a fraction of tarsus length */
const TARSUS_THICKNESS = 0.045
/** default step length as a fraction of leg length (tibia + tarsus) */
export const DEFAULT_STEP = 0.45

export interface LegLayout {
  /** right hip joint, profile frame; the left mirrors z */
  hip: THREE.Vector3
  /** belly surface height under the hip, profile frame */
  bellyY: number
  /** full tibia, hip to intertarsal joint (the hidden part plus measurements.tibia) */
  tibia: number
  tarsus: number
  toe: number
  /** hip height above the foot joint when standing */
  standHeight: number
  /** foot joint height above the ground (the toes' radius) */
  footY: number
  tarsusRadius: number
  /** standing positions, right leg, profile frame */
  knee: THREE.Vector3
  foot: THREE.Vector3
}

export function legLayout(detail: DetailSpec, profile: Profile): LegLayout {
  const s = profile.sampleAt(profile.uOf(detail.rig.hip))
  const hip = new THREE.Vector3(s.point.x, s.point.y - s.down * HIP_DEPTH, s.halfWidth * HIP_SPREAD)
  const bellyY = s.point.y - s.down
  const m = detail.measurements
  const tibia = (hip.y - bellyY) + m.tibia
  const standHeight = STAND * (tibia + m.tarsus)
  const tarsusRadius = (m.tarsus * TARSUS_THICKNESS) / 2
  const footY = tarsusRadius * 0.7
  const target = { x: hip.x, y: hip.y - standHeight }
  const { joint, foot } = solveLeg({ x: hip.x, y: hip.y }, target, tibia, m.tarsus)
  return {
    hip, bellyY, tibia, tarsus: m.tarsus, toe: m.toe, standHeight, footY, tarsusRadius,
    knee: new THREE.Vector3(joint.x, joint.y, hip.z),
    foot: new THREE.Vector3(foot.x, foot.y, hip.z),
  }
}

/** Toe directions in the ground plane for the right foot (+z outward); the left mirrors z. */
const TOES: { angle: number; length: number }[] = [
  { angle: -0.45, length: 0.8 },   // inner
  { angle: 0, length: 1 },         // middle
  { angle: 0.45, length: 0.8 },    // outer
]

/** Both legs in rest pose: tibia, a knob at the intertarsal joint, tarsus, three front toes and a hind toe. */
export function buildLegs(m: Mesher, layout: LegLayout): void {
  const r = layout.tarsusRadius
  for (const side of [1, -1] as const) {
    const B = side > 0
      ? { tibia: 'tibiaR', tarsus: 'tarsusR', toes: 'toesR' } as const
      : { tibia: 'tibiaL', tarsus: 'tarsusL', toes: 'toesL' } as const
    const mirror = (v: THREE.Vector3) => new THREE.Vector3(v.x, v.y, v.z * side)
    const hip = mirror(layout.hip), knee = mirror(layout.knee), foot = mirror(layout.foot)
    tube(m, hip, knee, r * 1.5, r * 1.1, 'legs', 0.5, 0.5, [[B.tibia, 1]])
    tube(m, knee.clone().add(new THREE.Vector3(0.6 * r, 0, 0)), knee.clone().add(new THREE.Vector3(-0.6 * r, 0, 0)), r * 1.25, r * 1.25, 'legs', 0.5, 0.5, [[B.tarsus, 1]])
    tube(m, knee, foot, r, r * 0.9, 'legs', 0.5, 0.5, [[B.tarsus, 1]])
    for (const toe of TOES) {
      const a = toe.angle * side
      const tip = foot.clone().add(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(layout.toe * toe.length))
      tube(m, foot, tip, r * 0.7, r * 0.45, 'legs', 0.5, 0.5, [[B.toes, 1]], 5)
    }
    const hind = foot.clone().add(new THREE.Vector3(-layout.toe * 0.25, layout.footY, 0))
    tube(m, foot, hind, r * 0.6, r * 0.4, 'legs', 0.5, 0.5, [[B.toes, 1]], 5)
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/birds/detail && npx tsc -p tsconfig.json`
Expected: PASS, `tsc` clean.

- [ ] **Step 5: Commit**

```bash
git add src/birds/detail/gait.ts src/birds/detail/legs.ts src/birds/detail/gait.test.ts
git commit -m "feat: jointed legs with two-bone IK and a walk that plants the stance foot"
```

---

### Task 8: The plumage painter

**Files:**
- Create: `src/birds/paint/layers.ts`, `src/birds/paint/layers.test.ts`, `src/birds/paint/painter.ts`, `src/birds/paint/painter.test.ts`

**Interfaces:**
- Consumes: `Layer`, `Where`, `SkinPoint`, `Part`, `DetailSpec`, `layersFor` (Task 2); `createProfile`, `Profile` (Task 3); `ATLAS_SIZE`, `PAD`, `REGIONS`, `pixelST` (Task 4); `SPAN`, `ROOT_CHORD`, `ROOT_WIDTH`, `TIP_SPREAD` (Task 6); `SpeciesSpec`.
- Produces:

```ts
// layers.ts
export type RGB = [number, number, number]
export function hexRGB(hex: string): RGB
export interface Frame { lengthMm: number; widthMm(s: number): number; uOf(label: string): number }
export interface Px { s: number; t: number; X: number; Y: number; pixelMm: number }
export interface Out { alpha: number; color: RGB }
export const DEFAULT_SOFT = 1; export const DEFAULT_BLUR = 0.3
export function smoothstep(e0: number, e1: number, x: number): number
export function band(x: number, lo: number, hi: number, soft: number): number
export function hash(ix: number, iy: number, seed: number): number
export function hashString(s: string): number
export function skinSpan(where, f: Frame): [number, number]
export function pointMm(pt: SkinPoint, f: Frame): [number, number]
export function spots(...); export function streaks(...); export function bars(...); export function feathers(...)
export interface CompiledLayer { sMask(s: number): number; tMask(t: number, widthMm: number): number; tRange(widthMm: number): [number, number]; shade(p: Px, out: Out): void; opacity: number }
export function compileLayer(layer: Layer, f: Frame, seed: number): CompiledLayer
// painter.ts
export const paintStats: { atlases: number; ms: number; bytes: number }
export function partFrames(detail: DetailSpec, profile: Profile): Record<Part, Frame>
export interface PaintInput { code: string; detail: DetailSpec; layers: Layer[]; profile: Profile }
export function paintAtlas(input: PaintInput): Uint8ClampedArray        // RGBA, ATLAS_SIZE², row 0 at v = 0
export function atlasTexture(pixels: Uint8ClampedArray): THREE.DataTexture
export function materialFor(spec: SpeciesSpec, variant?: string): THREE.MeshStandardMaterial   // cached per species and plumage
export function regionStats(pixels: Uint8ClampedArray, part: Part, s: [number, number], t: [number, number]): { mean: number; std: number; roughS: number; roughT: number }
```

How painting works:
- A layer compiles once: colours are parsed, labels resolved, and its region split into a per-column mask and a per-pixel mask.
- The painter skips columns and rows the layer can't touch. That, and the 512 atlas, is what keeps painting near 100 ms.
- A layer whose range reaches a region's edge paints straight through the padding (Review Focus 3).
- `regionStats`' roughness is the mean change between neighbouring texels. It picks up bars (change along `s`) and streaks (change around `t`) and ignores smooth colour gradients, so plumage tests can tell pattern from shading.

- [ ] **Step 1: Write the failing tests**

`src/birds/paint/layers.test.ts`:

```ts
import { band, hash, hashString, compileLayer, type Frame, type Px, type Out } from './layers'
import type { Layer } from '../detail/spec'

const LABELS: Record<string, number> = { a: 0.2, b: 0.6, c: 0.9 }
const frame: Frame = {
  lengthMm: 100,
  widthMm: () => 50,
  uOf: l => {
    const u = LABELS[l]
    if (u === undefined) throw new Error(l)
    return u
  },
}
const px = (s: number, t: number): Px => ({ s, t, X: s * 100, Y: t * 50, pixelMm: 0.2 })
const run = (layer: Layer, s: number, t: number) => {
  const L = compileLayer(layer, frame, 7)
  const out: Out = { alpha: 0, color: [0, 0, 0] }
  L.shade(px(s, t), out)
  return { alpha: out.alpha * L.sMask(s) * L.tMask(t, 50) * L.opacity, color: out.color }
}

describe('band', () => {
  it('is 1 inside, 0 well outside, and never fades at the part edge', () => {
    expect(band(0.5, 0.2, 0.8, 0.05)).toBe(1)
    expect(band(0.1, 0.2, 0.8, 0.05)).toBe(0)
    expect(band(0.2, 0.2, 0.8, 0.05)).toBeCloseTo(0.5, 9)
    expect(band(0, 0, 0.8, 0.05)).toBe(1)
    expect(band(1, 0.2, 1, 0.05)).toBe(1)
  })
})

describe('hash', () => {
  it('is stable, in [0, 1), and varies with its inputs', () => {
    expect(hash(3, 4, 5)).toBe(hash(3, 4, 5))
    const vals = Array.from({ length: 500 }, (_, i) => hash(i, i * 7, 11))
    expect(Math.min(...vals)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...vals)).toBeLessThan(1)
    expect(new Set(vals.map(v => v.toFixed(6))).size).toBeGreaterThan(490)
    expect(hashString('greyel')).not.toBe(hashString('lesyel'))
  })
})

describe('compileLayer', () => {
  const fill: Layer = { kind: 'fill', where: { part: 'skin', from: 'a', to: 'b', band: [0, 0.5] }, color: '#ff0000' }
  it('paints inside its region and nowhere outside', () => {
    expect(run(fill, 0.4, 0.2).alpha).toBe(1)
    expect(run(fill, 0.4, 0.2).color).toEqual([1, 0, 0])
    expect(run(fill, 0.1, 0.2).alpha).toBe(0)
    expect(run(fill, 0.8, 0.2).alpha).toBe(0)
    expect(run(fill, 0.4, 0.9).alpha).toBe(0)
  })
  it('accepts its span either way round', () => {
    const back: Layer = { ...fill, where: { part: 'skin', from: 'b', to: 'a', band: [0, 0.5] } }
    expect(run(back, 0.4, 0.2).alpha).toBe(1)
  })
  it('scales by opacity', () => {
    expect(run({ ...fill, opacity: 0.25 }, 0.4, 0.2).alpha).toBeCloseTo(0.25, 9)
  })
  it('grades base colour from top through side to bottom', () => {
    const base: Layer = { kind: 'base', where: { part: 'wingFold' }, top: '#000000', side: '#808080', bottom: '#ffffff' }
    expect(run(base, 0.5, 0).color[0]).toBeCloseTo(0, 9)
    expect(run(base, 0.5, 0.5).color[0]).toBeCloseTo(128 / 255, 9)
    expect(run(base, 0.5, 1).color[0]).toBeCloseTo(1, 9)
  })
  it('ramps a gradient between from and to and holds its ends', () => {
    const g: Layer = { kind: 'gradient', where: { part: 'bill' }, axis: 's', from: 0.2, to: 0.6, colorA: '#000000', colorB: '#ffffff' }
    expect(run(g, 0.1, 0.5).color[0]).toBe(0)
    expect(run(g, 0.4, 0.5).color[0]).toBeCloseTo(0.5, 9)
    expect(run(g, 0.9, 0.5).color[0]).toBe(1)
  })
  it('draws a ring around its point and not at the centre', () => {
    // the point sits at X = 60 mm, Y = 25 mm
    const ring: Layer = { kind: 'ring', at: { at: 'b', t: 0.5 }, radius: 3, width: 1, color: '#ffffff' }
    expect(run(ring, 0.63, 0.5).alpha).toBeCloseTo(1, 2)
    expect(run(ring, 0.6, 0.5).alpha).toBe(0)
  })
  it('draws a stripe between two points', () => {
    const stripe: Layer = { kind: 'stripe', from: { at: 'a', t: 0.5 }, to: { at: 'b', t: 0.5 }, width: 2, color: '#ffffff' }
    expect(run(stripe, 0.4, 0.5).alpha).toBeCloseTo(1, 6)
    expect(run(stripe, 0.4, 0.6).alpha).toBe(0)       // 5 mm off the line
    expect(run(stripe, 0.8, 0.5).alpha).toBe(0)       // past its end
  })
  it('is deterministic for a seed', () => {
    const spots: Layer = { kind: 'spots', where: { part: 'wingFold' }, color: '#ffffff', size: 2, spacing: 4 }
    const sample = () => Array.from({ length: 200 }, (_, i) => run(spots, (i % 20) / 20, Math.floor(i / 20) / 10).alpha)
    const a = sample()
    expect(sample()).toEqual(a)
    expect(a.some(v => v > 0.9)).toBe(true)
    expect(a.some(v => v === 0)).toBe(true)
  })
})
```

`src/birds/paint/painter.test.ts`:

```ts
import * as THREE from 'three'
import { paintAtlas, regionStats, partFrames, materialFor } from './painter'
import { ATLAS_SIZE } from './atlas'
import { createProfile } from '../detail/profile'
import { TEST_DETAIL, TEST_SPEC } from '../detail/fixture'
import type { Layer } from '../detail/spec'

const profile = createProfile(TEST_DETAIL.profile)
const paint = (layers: Layer[]) => paintAtlas({ code: 'testbird', detail: TEST_DETAIL, layers, profile })

describe('paintAtlas', () => {
  it('paints only the part a layer names', () => {
    const px = paint([{ kind: 'fill', where: { part: 'bill' }, color: '#ffffff' }])
    expect(px.length).toBe(ATLAS_SIZE * ATLAS_SIZE * 4)
    expect(regionStats(px, 'bill', [0, 1], [0, 1]).mean).toBeCloseTo(1, 2)
    expect(regionStats(px, 'tail', [0, 1], [0, 1]).mean).toBeCloseTo(0.5, 1)      // untouched: the base grey
  })
  it('is deterministic', () => {
    const layers: Layer[] = [{ kind: 'spots', where: { part: 'wingFold' }, color: '#ffffff', size: 2, spacing: 5 }]
    expect(Buffer.from(paint(layers)).equals(Buffer.from(paint(layers)))).toBe(true)     // toEqual on a million bytes is slow
  })
  it('keeps pattern sizes in millimetres: spots cover the same share of the thin neck as of the wide belly', () => {
    const px = paint([
      { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'billBase' }, color: '#000000' },
      { kind: 'spots', where: { part: 'skin', from: 'rear', to: 'billBase' }, color: '#ffffff', size: 3, spacing: 6, jitter: 0.3 },
    ])
    const neck = regionStats(px, 'skin', [profile.uOf('neckMid'), profile.uOf('nape')], [0, 1]).mean
    const body = regionStats(px, 'skin', [profile.uOf('hip'), profile.uOf('flank')], [0, 1]).mean
    expect(neck).toBeGreaterThan(0.1)
    expect(Math.abs(neck - body) / body).toBeLessThan(0.3)
  })
  it('paints the eye: dark pupil, a catchlight', () => {
    const px = paint([])
    expect(regionStats(px, 'eye', [0.45, 0.55], [0.45, 0.55]).mean).toBeLessThan(0.1)
    expect(regionStats(px, 'eye', [0.3, 0.42], [0.58, 0.7]).mean).toBeGreaterThan(0.8)
  })
  it('gives every part a frame in millimetres', () => {
    const f = partFrames(TEST_DETAIL, profile)
    expect(f.skin.lengthMm).toBeCloseTo(profile.length * 1000, 6)
    expect(f.bill.lengthMm).toBeCloseTo(TEST_DETAIL.measurements.culmen * 1000, 6)
    expect(f.wingFold.lengthMm).toBeCloseTo(TEST_DETAIL.measurements.wingChord * 1000, 6)
    expect(f.skin.widthMm(profile.uOf('hip'))).toBeGreaterThan(f.skin.widthMm(profile.uOf('nape')))
  })
})

describe('materialFor', () => {
  it('paints once per species and plumage', () => {
    expect(materialFor(TEST_SPEC)).toBe(materialFor(TEST_SPEC))
    expect((materialFor(TEST_SPEC).map as THREE.DataTexture).image.width).toBe(ATLAS_SIZE)
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/birds/paint`
Expected: the new files FAIL on missing modules; `atlas.test.ts` still passes.

- [ ] **Step 3: Implement**

`src/birds/paint/layers.ts`:

```ts
import type { Layer, Where, SkinPoint } from '../detail/spec'

export type RGB = [number, number, number]

export function hexRGB(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

/** How a part's (s, t) maps to millimetres on the bird. */
export interface Frame {
  /** mm along s (s = 0..1) */
  lengthMm: number
  /** mm across t (t = 0..1) at s */
  widthMm(s: number): number
  /** skin only: s of a station label */
  uOf(label: string): number
}

/** One pixel: part-local s, t; the same point in mm (X along, Y across); the pixel's footprint in mm. */
export interface Px { s: number; t: number; X: number; Y: number; pixelMm: number }

export interface Out { alpha: number; color: RGB }

export const DEFAULT_SOFT = 1
export const DEFAULT_BLUR = 0.3

export function smoothstep(e0: number, e1: number, x: number): number {
  if (e0 === e1) return x < e0 ? 0 : 1
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1)
  return t * t * (3 - 2 * t)
}

/** 1 inside [lo, hi], fading over +-soft; an edge on the part's own boundary (0 or 1) never fades. */
export function band(x: number, lo: number, hi: number, soft: number): number {
  const a = lo <= 0 ? 1 : smoothstep(lo - soft, lo + soft, x)
  const b = hi >= 1 ? 1 : 1 - smoothstep(hi - soft, hi + soft, x)
  return a * b
}

/** Integer hash to [0, 1), stable for (ix, iy, seed). */
export function hash(ix: number, iy: number, seed: number): number {
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iy | 0, 668265263) ^ Math.imul(seed | 0, 1274126177)
  h = Math.imul(h ^ (h >>> 13), 1103515245)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** The s range a skin `where` covers, lo <= hi. */
export function skinSpan(where: Extract<Where, { part: 'skin' }>, f: Frame): [number, number] {
  const a = f.uOf(where.from), b = f.uOf(where.to)
  return [Math.min(a, b), Math.max(a, b)]
}

/** A skin point in mm. */
export function pointMm(pt: SkinPoint, f: Frame): [number, number] {
  const u = f.uOf(pt.at)
  return [u * f.lengthMm + (pt.dx ?? 0), pt.t * f.widthMm(u)]
}

/** Coverage of a disc edge at distance d from its centre, radius r, softened by blur. */
const edge = (d: number, r: number, blur: number) => 1 - smoothstep(r - blur / 2, r + blur / 2, d)

export function spots(p: Px, size: number, spacing: number, jitter: number, blur: number, seed: number): number {
  const ci = Math.floor(p.X / spacing), cj = Math.floor(p.Y / spacing)
  let best = 0
  for (let i = ci - 1; i <= ci + 1; i++) {
    for (let j = cj - 1; j <= cj + 1; j++) {
      const cx = (i + 0.5 + (hash(i, j, seed) - 0.5) * jitter) * spacing
      const cy = (j + 0.5 + (hash(i, j, seed + 1) - 0.5) * jitter) * spacing
      const r = (size / 2) * (0.8 + 0.4 * hash(i, j, seed + 2))
      best = Math.max(best, edge(Math.hypot(p.X - cx, p.Y - cy), r, blur))
    }
  }
  return best
}

export function streaks(p: Px, length: number, width: number, spacing: number, jitter: number, blur: number, seed: number): number {
  const sx = length * 1.3, sy = spacing
  const ci = Math.floor(p.X / sx), cj = Math.floor(p.Y / sy)
  const e = blur / (width / 2)
  let best = 0
  for (let i = ci - 1; i <= ci + 1; i++) {
    for (let j = cj - 1; j <= cj + 1; j++) {
      const cx = (i + 0.5 + (hash(i, j, seed) - 0.5) * jitter) * sx
      const cy = (j + 0.5 + (hash(i, j, seed + 1) - 0.5) * jitter * 0.5) * sy
      const q = Math.hypot((p.X - cx) / (length / 2), (p.Y - cy) / (width / 2))
      best = Math.max(best, 1 - smoothstep(1 - e, 1 + e, q))
    }
  }
  return best
}

export function bars(p: Px, width: number, spacing: number, angleDeg: number, blur: number, seed: number): number {
  const a = (angleDeg * Math.PI) / 180
  let w = p.X * Math.cos(a) + p.Y * Math.sin(a)
  // a gentle wobble so bars are not ruled lines
  const k = Math.floor(p.Y / (spacing * 2))
  const f = p.Y / (spacing * 2) - k
  w += (hash(k, 0, seed) * (1 - f) + hash(k + 1, 0, seed) * f - 0.5) * spacing * 0.35
  const d = Math.abs(w - (Math.round(w / spacing - 0.5) + 0.5) * spacing)
  return edge(d, width / 2, blur)
}

function segmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const vx = bx - ax, vy = by - ay
  const l2 = vx * vx + vy * vy || 1e-12
  const h = Math.min(Math.max(((px - ax) * vx + (py - ay) * vy) / l2, 0), 1)
  return Math.hypot(px - ax - vx * h, py - ay - vy * h)
}

/** Overlapping feathers, tips pointing back (-X); the front-most feather covering a pixel shows. */
export function feathers(
  p: Px, L: number, W: number, edgeWidth: number, notch: { size: number; count: number } | undefined, blur: number, seed: number,
): { inside: boolean; fringe: number; notch: number } {
  const dx = L * 0.55, dy = W * 0.9
  const cj = Math.floor(p.Y / dy)
  let bestCx = -Infinity, q = 0, bx = 0, by = 0
  for (let j = cj - 1; j <= cj + 1; j++) {
    const off = (j & 1) * 0.5
    const ci = Math.floor(p.X / dx - off)
    for (let i = ci - 1; i <= ci + 2; i++) {
      const cx = (i + off + (hash(i, j, seed) - 0.5) * 0.15) * dx
      const cy = (j + 0.5) * dy
      const qq = ((p.X - cx) / (L / 2)) ** 2 + ((p.Y - cy) / (W / 2)) ** 2
      if (qq < 1 && cx > bestCx) { bestCx = cx; q = qq; bx = cx; by = cy }
    }
  }
  if (bestCx === -Infinity) return { inside: false, fringe: 0, notch: 0 }
  const inset = ((1 - Math.sqrt(q)) * Math.min(L, W)) / 2          // mm in from the feather's edge
  if (p.X >= bx) return { inside: true, fringe: 0, notch: 0 }      // only the rear edge shows
  const fringe = 1 - smoothstep(edgeWidth - blur / 2, edgeWidth + blur / 2, inset)
  let n = 0
  if (notch) {
    for (let k = 0; k < notch.count; k++) {
      const phi = Math.PI / 2 + (Math.PI * (k + 0.5)) / notch.count      // around the rear half
      const nx = bx + Math.cos(phi) * (L / 2 - notch.size * 0.6)
      const ny = by + Math.sin(phi) * (W / 2 - notch.size * 0.6)
      n = Math.max(n, edge(Math.hypot(p.X - nx, p.Y - ny), notch.size / 2, blur))
    }
  }
  return { inside: true, fringe, notch: n }
}

const mix = (out: RGB, a: RGB, b: RGB, w: number) => {
  out[0] = a[0] + (b[0] - a[0]) * w
  out[1] = a[1] + (b[1] - a[1]) * w
  out[2] = a[2] + (b[2] - a[2]) * w
}

/**
 * A layer compiled once per paint: colours parsed, labels resolved, and its region split into a per-column
 * mask and a per-pixel mask so the painter can skip whole columns and rows.
 */
export interface CompiledLayer {
  /** mask for a column at s; 0 skips the column */
  sMask(s: number): number
  /** mask for a pixel at t, given its column's width in mm */
  tMask(t: number, widthMm: number): number
  /** the t range worth visiting in a column of the given width */
  tRange(widthMm: number): [number, number]
  /** colour and coverage before masks and opacity; never allocates */
  shade(p: Px, out: Out): void
  opacity: number
}

export function compileLayer(layer: Layer, f: Frame, seed: number): CompiledLayer {
  const soft = layer.soft ?? DEFAULT_SOFT
  const blurOf = (p: Px) => Math.max('blur' in layer ? layer.blur ?? DEFAULT_BLUR : DEFAULT_BLUR, p.pixelMm)
  const where = 'where' in layer ? layer.where : null
  const sSoft = soft / f.lengthMm
  const [s0, s1] = !where ? [0, 1] : where.part === 'skin' ? skinSpan(where, f) : (where.s ?? [0, 1])
  const [t0, t1] = !where ? [0, 1] : where.part === 'skin' ? (where.band ?? [0, 1]) : (where.t ?? [0, 1])
  let tRange = (w: number): [number, number] => [Math.max(0, t0 - soft / w), Math.min(1, t1 + soft / w)]
  const base = {
    sMask: (s: number) => band(s, s0, s1, sSoft),
    tMask: (t: number, w: number) => band(t, t0, t1, soft / w),
    opacity: layer.opacity ?? 1,
  }
  const solid = (hex: string, cov: (p: Px) => number) => {
    const c = hexRGB(hex)
    return (p: Px, out: Out) => { out.color[0] = c[0]; out.color[1] = c[1]; out.color[2] = c[2]; out.alpha = cov(p) }
  }
  let shade: (p: Px, out: Out) => void
  switch (layer.kind) {
    case 'base': {
      const top = hexRGB(layer.top), side = hexRGB(layer.side), bottom = hexRGB(layer.bottom)
      const tmp: RGB = [0, 0, 0]
      shade = (p, out) => {
        mix(tmp, top, side, smoothstep(0.1, 0.45, p.t))
        mix(out.color, tmp, bottom, smoothstep(0.55, 0.85, p.t))
        out.alpha = 1
      }
      break
    }
    case 'fill':
      shade = solid(layer.color, () => 1)
      break
    case 'gradient': {
      const a = hexRGB(layer.colorA), b = hexRGB(layer.colorB)
      const span = layer.to - layer.from || 1e-9
      shade = (p, out) => {
        const x = layer.axis === 's' ? p.s : p.t
        mix(out.color, a, b, Math.min(Math.max((x - layer.from) / span, 0), 1))
        out.alpha = 1
      }
      break
    }
    case 'spots':
      shade = solid(layer.color, p => spots(p, layer.size, layer.spacing, layer.jitter ?? 0.6, blurOf(p), seed))
      break
    case 'streaks':
      shade = solid(layer.color, p => streaks(p, layer.length, layer.width, layer.spacing, layer.jitter ?? 0.6, blurOf(p), seed))
      break
    case 'bars':
      shade = solid(layer.color, p => bars(p, layer.width, layer.spacing, layer.angle, blurOf(p), seed))
      break
    case 'stripe': {
      const [ax, ay] = pointMm(layer.from, f), [bx, by] = pointMm(layer.to, f)
      const reach = layer.width + (layer.blur ?? DEFAULT_BLUR) + 1
      tRange = w => [Math.max(0, (Math.min(ay, by) - reach) / w), Math.min(1, (Math.max(ay, by) + reach) / w)]
      shade = solid(layer.color, p => edge(segmentDistance(p.X, p.Y, ax, ay, bx, by), layer.width / 2, blurOf(p)))
      break
    }
    case 'ring': {
      const [cx, cy] = pointMm(layer.at, f)
      const reach = layer.radius + layer.width + 1
      tRange = w => [Math.max(0, (cy - reach) / w), Math.min(1, (cy + reach) / w)]
      shade = solid(layer.color, p => edge(Math.abs(Math.hypot(p.X - cx, p.Y - cy) - layer.radius), layer.width / 2, blurOf(p)))
      break
    }
    case 'feathers': {
      const center = layer.center ? hexRGB(layer.center) : null
      const edgeC = hexRGB(layer.edge)
      const notchC = layer.notch ? hexRGB(layer.notch.color) : null
      shade = (p, out) => {
        out.alpha = 0
        const r = feathers(p, layer.length, layer.width, layer.edgeWidth, layer.notch, blurOf(p), seed)
        if (!r.inside) return
        // composite center, fringe, and notch locally (premultiplied "over")
        let c0 = 0, c1 = 0, c2 = 0, a = 0
        const over = (col: RGB, al: number) => {
          c0 = col[0] * al + c0 * (1 - al); c1 = col[1] * al + c1 * (1 - al); c2 = col[2] * al + c2 * (1 - al)
          a = al + a * (1 - al)
        }
        if (center) over(center, 1)
        if (r.fringe > 0) over(edgeC, r.fringe)
        if (notchC && r.notch > 0) over(notchC, r.notch)
        if (a === 0) return
        out.color[0] = c0 / a; out.color[1] = c1 / a; out.color[2] = c2 / a
        out.alpha = a
      }
      break
    }
  }
  return { ...base, tRange, shade }
}
```

`src/birds/paint/painter.ts`:

```ts
import * as THREE from 'three'
import { ATLAS_SIZE, PAD, REGIONS, pixelST } from './atlas'
import { compileLayer, hashString, hexRGB, pointMm, skinSpan, type Frame, type Out, type Px, type RGB } from './layers'
import { createProfile, type Profile } from '../detail/profile'
import { layersFor, PARTS, type DetailSpec, type Layer, type Part } from '../detail/spec'
import { SPAN, ROOT_CHORD } from '../detail/wing'
import { ROOT_WIDTH, TIP_SPREAD } from '../detail/tail'
import type { SpeciesSpec } from '../spec'

/** Running totals for the dev overlay. */
export const paintStats = { atlases: 0, ms: 0, bytes: 0 }

const BASE_GREY = hexRGB('#808080')

/** mm frames for every part: the skin from the profile, the rest from the measurements. */
export function partFrames(detail: DetailSpec, profile: Profile): Record<Part, Frame> {
  const m = detail.measurements
  const noLabels = (label: string): number => { throw new Error(`station label "${label}" used outside the skin`) }
  const perimeter = new Map<number, number>()
  const skinWidth = (s: number) => {
    const k = Math.round(s * 511)
    let v = perimeter.get(k)
    if (v === undefined) { v = profile.halfPerimeter(k / 511) * 1000; perimeter.set(k, v) }
    return v
  }
  const flat = (lengthMm: number, widthMm: (s: number) => number): Frame => ({ lengthMm, widthMm, uOf: noLabels })
  const foldH = Math.max(...detail.wing.outline.map(o => o[1])) * m.wingChord * 1000
  const spread = flat(SPAN * m.wingChord * 1000, s => ROOT_CHORD * m.wingChord * 1000 * (1 - 0.85 * s ** 1.3))
  const tailRoot = profile.sampleAt(profile.uOf(detail.rig.tailBase)).halfWidth * 2 * ROOT_WIDTH * 1000
  const tail = flat(m.tail * 1000, s => tailRoot * (1 + (TIP_SPREAD - 1) * s))
  return {
    skin: { lengthMm: profile.length * 1000, widthMm: skinWidth, uOf: l => profile.uOf(l) },
    wingFold: flat(m.wingChord * 1000, () => foldH),
    wingSpread: spread,
    wingUnder: spread,
    tail,
    tailUnder: tail,
    bill: flat(m.culmen * 1000, s => (Math.PI * (m.billDepth + m.billWidth) * 1000 / 4) * (1 - 0.85 * s ** detail.bill.taper)),
    legs: flat(10, () => 10),
    eye: flat(detail.eye.radius * 2000, () => detail.eye.radius * 2000),
  }
}

/** Pixel columns a layer can touch in its part's region (skin layers limited to their span). */
function columns(layer: Layer, part: Part, f: Frame): [number, number] {
  const r = REGIONS[part]
  const usable = r.w - 2 * PAD
  const toCol = (s: number) => r.x + PAD + s * usable
  const margin = (mm: number) => (mm / f.lengthMm) * usable + 2
  let lo = r.x, hi = r.x + r.w
  if (part === 'skin') {
    if ('where' in layer && layer.where.part === 'skin') {
      const [a, b] = skinSpan(layer.where, f)
      const m = margin((layer.soft ?? 1) * 2)
      lo = toCol(a) - m; hi = toCol(b) + m
    } else if (layer.kind === 'stripe') {
      const xs = [pointMm(layer.from, f)[0], pointMm(layer.to, f)[0]]
      lo = toCol(Math.min(...xs) / f.lengthMm) - margin(layer.width * 2)
      hi = toCol(Math.max(...xs) / f.lengthMm) + margin(layer.width * 2)
    } else if (layer.kind === 'ring') {
      const x = pointMm(layer.at, f)[0]
      lo = toCol(x / f.lengthMm) - margin(layer.radius + layer.width * 2)
      hi = toCol(x / f.lengthMm) + margin(layer.radius + layer.width * 2)
    }
  }
  return [Math.max(r.x, Math.floor(lo)), Math.min(r.x + r.w, Math.ceil(hi))]
}

function partOf(layer: Layer): Part {
  return 'where' in layer ? layer.where.part : 'skin'
}

/** Iris, pupil, and a catchlight in the eye region; outside the iris, dark. */
function paintEye(buf: Float32Array, iris: string): void {
  const r = REGIONS.eye
  const irisC = hexRGB(iris), dark: RGB = [0.05, 0.05, 0.05], light: RGB = [0.95, 0.95, 0.95]
  for (let py = r.y; py < r.y + r.h; py++) {
    for (let px = r.x; px < r.x + r.w; px++) {
      const [s, t] = pixelST('eye', px, py)
      const d = Math.hypot(s - 0.5, t - 0.5) * 2
      let c: RGB = d < 0.45 ? dark : d < 0.92 ? irisC : dark
      if (Math.hypot(s - 0.36, t - 0.64) < 0.12) c = light
      buf.set(c, (py * ATLAS_SIZE + px) * 3)
    }
  }
}

export interface PaintInput { code: string; detail: DetailSpec; layers: Layer[]; profile: Profile }

/** Paint an atlas: RGBA bytes, ATLAS_SIZE x ATLAS_SIZE, row 0 at v = 0. */
export function paintAtlas({ code, detail, layers, profile }: PaintInput): Uint8ClampedArray {
  const t0 = performance.now()
  const frames = partFrames(detail, profile)
  const buf = new Float32Array(ATLAS_SIZE * ATLAS_SIZE * 3)
  for (let i = 0; i < buf.length; i += 3) buf.set(BASE_GREY, i)
  paintEye(buf, detail.eye.iris)
  const base = hashString(code)
  const out: Out = { alpha: 0, color: [0, 0, 0] }
  const px: Px = { s: 0, t: 0, X: 0, Y: 0, pixelMm: 0 }
  layers.forEach((layer, li) => {
    const part = partOf(layer)
    const f = frames[part]
    const r = REGIONS[part]
    const [c0, c1] = columns(layer, part, f)
    const L = compileLayer(layer, f, (base + li * 7919) | 0)
    const usableW = r.w - 2 * PAD, usableH = r.h - 2 * PAD
    for (let x = c0; x < c1; x++) {
      const s = Math.min(Math.max((x + 0.5 - r.x - PAD) / usableW, 0), 1)
      const ms = L.sMask(s)
      if (ms === 0) continue
      const w = f.widthMm(s)
      px.s = s; px.X = s * f.lengthMm
      px.pixelMm = Math.max(f.lengthMm / usableW, w / usableH)
      const [ta, tb] = L.tRange(w)
      // a range that reaches the region's edge paints through the padding too
      const y0 = ta <= 0 ? r.y : Math.max(r.y, Math.floor(r.y + PAD + ta * usableH - 1))
      const y1 = tb >= 1 ? r.y + r.h : Math.min(r.y + r.h, Math.ceil(r.y + PAD + tb * usableH + 1))
      for (let y = y0; y < y1; y++) {
        const t = Math.min(Math.max((y + 0.5 - r.y - PAD) / usableH, 0), 1)
        const m = ms * L.tMask(t, w)
        if (m === 0) continue
        px.t = t; px.Y = t * w
        L.shade(px, out)
        const a = Math.min(out.alpha * m * L.opacity, 1)
        if (a <= 0) continue
        const k = (y * ATLAS_SIZE + x) * 3
        buf[k] = buf[k]! + (out.color[0] - buf[k]!) * a
        buf[k + 1] = buf[k + 1]! + (out.color[1] - buf[k + 1]!) * a
        buf[k + 2] = buf[k + 2]! + (out.color[2] - buf[k + 2]!) * a
      }
    }
  })
  const rgba = new Uint8ClampedArray(ATLAS_SIZE * ATLAS_SIZE * 4)
  for (let i = 0, j = 0; i < buf.length; i += 3, j += 4) {
    rgba[j] = buf[i]! * 255; rgba[j + 1] = buf[i + 1]! * 255; rgba[j + 2] = buf[i + 2]! * 255; rgba[j + 3] = 255
  }
  paintStats.atlases++
  paintStats.ms += performance.now() - t0
  paintStats.bytes += Math.round(rgba.length * 4 / 3)     // with mipmaps
  return rgba
}

export function atlasTexture(pixels: Uint8ClampedArray): THREE.DataTexture {
  const tex = new THREE.DataTexture(pixels, ATLAS_SIZE, ATLAS_SIZE, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

const materials = new Map<string, THREE.MeshStandardMaterial>()

/** One material (and one painted atlas) per species and plumage, shared by every bird of that kind. */
export function materialFor(spec: SpeciesSpec, variant?: string): THREE.MeshStandardMaterial {
  const key = `${spec.code}:${variant ?? ''}`
  let mat = materials.get(key)
  if (!mat) {
    const detail = spec.detail
    if (!detail) throw new Error(`${spec.code}: no detail block to paint`)
    const pixels = paintAtlas({ code: spec.code, detail, layers: layersFor(detail, variant), profile: createProfile(detail.profile) })
    mat = new THREE.MeshStandardMaterial({ map: atlasTexture(pixels), roughness: 0.85, metalness: 0 })
    materials.set(key, mat)
  }
  return mat
}

/**
 * Luminance (0..1) over part-local s and t ranges: mean, standard deviation, and roughness, the mean change
 * between neighbouring texels along s and along t. Roughness sees pattern (bars, streaks) and ignores smooth
 * gradients. For tests and the viewer.
 */
export function regionStats(pixels: Uint8ClampedArray, part: Part, s: [number, number], t: [number, number]): { mean: number; std: number; roughS: number; roughT: number } {
  const r = REGIONS[part]
  const lum = (x: number, y: number) => {
    const k = (y * ATLAS_SIZE + x) * 4
    return (0.2126 * pixels[k]! + 0.7152 * pixels[k + 1]! + 0.0722 * pixels[k + 2]!) / 255
  }
  const inside = (x: number, y: number) => {
    if (x < r.x || x >= r.x + r.w || y < r.y || y >= r.y + r.h) return false
    const [ps, pt] = pixelST(part, x, y)
    return ps >= s[0] && ps <= s[1] && pt >= t[0] && pt <= t[1]
  }
  let n = 0, sum = 0, sum2 = 0, ns = 0, ds = 0, nt = 0, dt = 0
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) {
      if (!inside(x, y)) continue
      const l = lum(x, y)
      n++; sum += l; sum2 += l * l
      if (inside(x + 1, y)) { ns++; ds += Math.abs(lum(x + 1, y) - l) }
      if (inside(x, y + 1)) { nt++; dt += Math.abs(lum(x, y + 1) - l) }
    }
  }
  const mean = sum / (n || 1)
  return { mean, std: Math.sqrt(Math.max(0, sum2 / (n || 1) - mean * mean)), roughS: ds / (ns || 1), roughT: dt / (nt || 1) }
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/birds/paint && npx tsc -p tsconfig.json`
Expected: PASS, `tsc` clean. "is deterministic" compares the buffers with `Buffer.equals`: `toEqual` over a million bytes takes about 5 s and times out.

- [ ] **Step 5: Commit**

```bash
git add src/birds/paint/layers.ts src/birds/paint/layers.test.ts src/birds/paint/painter.ts src/birds/paint/painter.test.ts
git commit -m "feat: paint field-mark layers into a per-species atlas, sized in millimetres"
```

---

### Task 9: The detailed builder, measurement, and the factory

**Files:**
- Create: `src/birds/detail/build.ts`, `src/birds/detail/measure.ts`, `src/birds/detail/build.test.ts`, `src/birds/factory.ts`, `src/birds/contract.testkit.ts`
- Modify: `src/birds/procedural.test.ts`, `src/birds/spawn.ts`, `src/hud/devOverlay.ts`

**Interfaces:**
- Consumes: everything from Tasks 2 to 8; `BirdModel`, `BirdParts`, `PoseState`, `defaultPose`; `buildBird`.
- Produces:

```ts
// build.ts
export interface Anatomy {
  billBase, billTip, billDir, billUp: THREE.Vector3; billBaseRing: THREE.Vector3[]
  tailRoot, tailTip, wrist, wingTip, hip, knee, foot: THREE.Vector3; bellyY: number
  head: THREE.Vector3[]                                         // skin vertices from the occiput forward
  stations: { label: string; position: THREE.Vector3 }[]
  spine: THREE.Vector3[]                                        // 101 points, tail to bill base
  closed: { name: string; indexFirst: number; indexCount: number }[]
}
export interface DetailedBirdModel extends BirdModel { mesh: THREE.SkinnedMesh; anatomy: Anatomy; profile: Profile; layout: LegLayout }
export function buildDetailedBird(spec: SpeciesSpec, variant?: string): DetailedBirdModel
// measure.ts
export interface Measures { length; culmen; head; billDepth; billTipRise; tarsus; tibia; wingChord; tail; projection: number }   // metres
export function measure(model: DetailedBirdModel): Measures
// factory.ts
export function createBirdModel(spec: SpeciesSpec, variant?: string): BirdModel
// contract.testkit.ts (imported by tests only; not named *.test.ts so vitest does not run it directly)
export function partBox(model: BirdModel, key: keyof BirdParts): THREE.Box3
export function birdModelContract(name: string, build: () => BirdModel): void
```

What the builder does:
- Builds the loft, bill, eyes, wings, tail, and legs in the profile frame.
- Shifts everything so the hips sit over the origin and the feet on y = 0.
- Makes one `SkinnedMesh` bound to one `Skeleton`, with `materialFor(spec, variant)`.
- Only standing birds this round. Other postures, an unknown variant, and a missing detail block all throw.

The generic `BirdModel` checks move from `procedural.test.ts` into `birdModelContract`, which now runs against both builders.

- [ ] **Step 1: Write the failing tests**

`src/birds/contract.testkit.ts`:

```ts
import * as THREE from 'three'
import { defaultPose, type BirdModel, type BirdParts } from './model'

/**
 * Bounding box of one part's geometry in world space. For a skinned model, the skinned vertices bound to the
 * part's bone or any bone under it; otherwise every mesh under the part.
 */
export function partBox(model: BirdModel, key: keyof BirdParts): THREE.Box3 {
  model.group.updateMatrixWorld(true)
  const part = model.parts[key]
  const box = new THREE.Box3()
  let skinned: THREE.SkinnedMesh | undefined
  model.group.traverse(o => { if (o instanceof THREE.SkinnedMesh) skinned = o })
  if (!skinned) return box.setFromObject(part, true)
  const under = new Set<THREE.Object3D>()
  part.traverse(o => under.add(o))
  const bones = skinned.skeleton.bones
  const index = skinned.geometry.getAttribute('skinIndex') as THREE.BufferAttribute
  const weight = skinned.geometry.getAttribute('skinWeight') as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (let i = 0; i < index.count; i++) {
    // the vertex's heaviest bone decides which part it belongs to
    let best = 0, bw = -1
    for (let k = 0; k < 4; k++) { const w = weight.getComponent(i, k); if (w > bw) { bw = w; best = index.getComponent(i, k) } }
    if (!under.has(bones[best]!)) continue
    skinned.getVertexPosition(i, v)
    box.expandByPoint(v.applyMatrix4(skinned.matrixWorld))
  }
  return box
}

/** What every BirdModel must do, whichever builder made it. `build` returns a standing bird. */
export function birdModelContract(name: string, build: () => BirdModel): void {
  describe(`${name}: BirdModel contract`, () => {
    it('names every part and keeps it under the group', () => {
      const m = build()
      for (const key of ['body', 'neck', 'head', 'bill', 'wingL', 'wingR', 'tail', 'legs'] as const) {
        expect(m.parts[key].name).toBe(key)
        let found = false
        m.group.traverse(o => { if (o === m.parts[key]) found = true })
        expect(found).toBe(true)
      }
    })
    it("stands a standing bird's feet on the origin", () => {
      const m = build()
      expect(Math.abs(partBox(m, 'legs').min.y)).toBeLessThan(0.02)
    })
    it('gives a centre above the feet and a radius on the scale of the bird', () => {
      const m = build()
      expect(m.center.y).toBeGreaterThan(0.02)
      expect(m.radius).toBeGreaterThan(0.05)
      expect(m.radius).toBeLessThan(2)
    })
    it('pose moves the wings and the head', () => {
      const m = build()
      const a = m.parts.wingL.rotation.x
      const h = m.parts.head.position.x
      m.pose({ ...defaultPose(), wingPhase: 0.25, wingSpread: 1, headBob: 0.2 })
      expect(m.parts.wingL.rotation.x).not.toBe(a)
      expect(m.parts.head.position.x).not.toBe(h)
    })
    it('lowers the head when the neck tucks, and never scales it', () => {
      const m = build()
      const headAt = (neckExtend: number) => {
        m.pose({ ...defaultPose(), neckExtend })
        m.group.updateMatrixWorld(true)
        const s = m.parts.head.getWorldScale(new THREE.Vector3())
        for (const c of [s.x, s.y, s.z]) expect(Math.abs(c - 1)).toBeLessThan(0.01)
        return m.parts.head.getWorldPosition(new THREE.Vector3()).y
      }
      expect(headAt(0)).toBeLessThan(headAt(1))
    })
  })
}
```

`src/birds/detail/build.test.ts`:

```ts
import * as THREE from 'three'
import { buildDetailedBird } from './build'
import { measure } from './measure'
import { signedVolume } from './mesher'
import { BONE_NAMES } from './rig'
import { TEST_SPEC, TEST_DETAIL } from './fixture'
import { parseSpeciesSpec } from '../spec'
import { defaultPose } from '../model'
import { birdModelContract } from '../contract.testkit'

birdModelContract('detailed builder', () => buildDetailedBird(TEST_SPEC))

describe('buildDetailedBird', () => {
  it('is one skinned mesh: one draw call per bird', () => {
    const m = buildDetailedBird(TEST_SPEC)
    const meshes: THREE.Mesh[] = []
    m.group.traverse(o => { if (o instanceof THREE.Mesh) meshes.push(o) })
    expect(meshes).toHaveLength(1)
    expect(meshes[0]).toBe(m.mesh)
    expect(m.mesh.skeleton.bones.map(b => b.name)).toEqual([...BONE_NAMES])
  })
  it('records its spine in group space, through every labelled station', () => {
    const m = buildDetailedBird(TEST_SPEC)
    expect(m.anatomy.spine).toHaveLength(101)
    for (const st of m.anatomy.stations) {
      const nearest = Math.min(...m.anatomy.spine.map(p => p.distanceTo(st.position)))
      expect(nearest, st.label).toBeLessThan(0.004)
    }
  })
  it('builds closed, outward-facing body and bill', () => {
    const m = buildDetailedBird(TEST_SPEC)
    for (const c of m.anatomy.closed) expect(signedVolume(m.mesh.geometry, c.indexFirst, c.indexCount), c.name).toBeGreaterThan(0)
  })
  it('shares one painted material between birds of the same kind', () => {
    expect(buildDetailedBird(TEST_SPEC).mesh.material).toBe(buildDetailedBird(TEST_SPEC).mesh.material)
  })
  it('builds to its measurements', () => {
    const r = measure(buildDetailedBird(TEST_SPEC))
    const m = TEST_DETAIL.measurements
    expect(r.culmen).toBeCloseTo(m.culmen, 3)
    expect(r.billDepth).toBeCloseTo(m.billDepth, 3)
    expect(r.tarsus).toBeCloseTo(m.tarsus, 3)
    expect(r.wingChord).toBeCloseTo(m.wingChord, 3)
    expect(r.tail).toBeCloseTo(m.tail, 3)
    expect(Math.abs(r.tibia - m.tibia) / m.tibia).toBeLessThan(0.15)
    expect(Math.abs(r.length - m.length) / m.length).toBeLessThan(0.05)
  })
  it('swaps the folded wing for the spread one as the wings open', () => {
    const m = buildDetailedBird(TEST_SPEC)
    const bones = Object.fromEntries(m.mesh.skeleton.bones.map(b => [b.name, b]))
    m.pose({ ...defaultPose(), wingSpread: 0 })
    expect(bones.wingFoldL!.scale.x).toBe(1)
    expect(bones.wingL!.scale.x).toBeLessThan(0.01)
    m.pose({ ...defaultPose(), wingSpread: 1 })
    expect(bones.wingFoldL!.scale.x).toBeLessThan(0.01)
    expect(bones.wingL!.scale.x).toBe(1)
  })
  it('plants the stance foot: it stays put in the world while the bird walks over it', () => {
    const m = buildDetailedBird(TEST_SPEC)
    const toes = m.mesh.skeleton.bones.find(b => b.name === 'toesR')!
    const stride = 2 * 0.45 * (m.layout.tibia + m.layout.tarsus)
    const xs: number[] = []
    for (const f of [0.55, 0.65, 0.75, 0.85]) {              // the right foot is in stance for these
      const d = f * stride
      m.group.position.x = d                                 // heading 0 walks along +x
      m.pose({ ...defaultPose(), strideDistance: d, gait: 1 })
      m.group.updateMatrixWorld(true)
      xs.push(toes.getWorldPosition(new THREE.Vector3()).x)
    }
    for (const x of xs) expect(x).toBeCloseTo(xs[0]!, 4)
  })
  it('keeps the feet down and the ankles bent back while standing', () => {
    const m = buildDetailedBird(TEST_SPEC)
    m.pose(defaultPose())
    m.group.updateMatrixWorld(true)
    const at = (n: string) => m.mesh.skeleton.bones.find(b => b.name === n)!.getWorldPosition(new THREE.Vector3())
    expect(at('tarsusR').x).toBeLessThan(at('tibiaR').x)      // intertarsal joint behind the hip
    expect(at('toesR').y).toBeCloseTo(m.layout.footY, 4)
  })
  it('clamps out-of-range pose values instead of breaking the bird', () => {
    const m = buildDetailedBird(TEST_SPEC)
    m.pose({ ...defaultPose(), neckExtend: 3, wingSpread: -1, gait: 4, strideDistance: 0.05, tailTilt: 0.3 })
    m.group.updateMatrixWorld(true)
    for (const b of m.mesh.skeleton.bones) {
      for (const v of [...b.position.toArray(), ...b.quaternion.toArray(), ...b.scale.toArray()]) expect(Number.isFinite(v), b.name).toBe(true)
    }
    const fold = m.mesh.skeleton.bones.find(b => b.name === 'wingFoldR')!
    expect(fold.scale.x).toBe(1)                               // wingSpread -1 reads as folded
    expect(m.parts.head.getWorldScale(new THREE.Vector3()).x).toBeCloseTo(1, 6)
  })
  it('refuses what it cannot build', () => {
    expect(() => buildDetailedBird(parseSpeciesSpec({ ...TEST_SPEC, posture: 'swimming' }))).toThrow(/standing/)
    expect(() => buildDetailedBird(TEST_SPEC, 'male')).toThrow(/variant/)
    expect(() => buildDetailedBird(parseSpeciesSpec({ ...TEST_SPEC, detail: undefined }))).toThrow(/detail/)
  })
})
```

Replace `src/birds/procedural.test.ts` with this version. Its generic checks now come from the contract suite; the block-only checks stay:

```ts
import * as THREE from 'three'
import { buildBird } from './procedural'
import { defaultPose } from './model'
import { parseSpeciesSpec } from './spec'
import { getSpec } from './species'
import { birdModelContract } from './contract.testkit'

/** The bounding box of an object's own geometry only, excluding its children (unlike Box3.setFromObject). */
function ownBox(o: THREE.Object3D): THREE.Box3 {
  const geo = (o as THREE.Mesh).geometry
  geo.computeBoundingBox()
  return geo.boundingBox!.clone().applyMatrix4(o.matrixWorld)
}

const standingCoot = () => parseSpeciesSpec({ ...getSpec('y00475'), posture: 'standing', legs: { length: 0.4, thickness: 0.05 } })
birdModelContract('block builder', () => buildBird(standingCoot()))

describe('buildBird', () => {
  const coot = getSpec('y00475')
  it('scales to the spec length', () => {
    const m = buildBird(coot)
    m.group.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(m.group)
    const len = box.max.x - box.min.x
    expect(len).toBeGreaterThan(coot.length * 0.8)
    expect(len).toBeLessThan(coot.length * 1.3)
    expect(m.radius).toBeGreaterThan(0.1)
  })
  it('sits a swimming bird with its body partly below the origin', () => {
    const m = buildBird(coot)
    m.group.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(m.parts.body)
    expect(box.min.y).toBeLessThan(0)
    expect(box.max.y).toBeGreaterThan(0)
  })
  it("sits a standing bird's body on its legs", () => {
    const standing = standingCoot()
    const m = buildBird(standing)
    m.group.updateMatrixWorld(true)
    // The body mesh's own geometry (not its subtree, which includes the legs down at y=0)
    // should sit with its underside at y = legLen, clear of the ground.
    const s = standing.length / (standing.body.length + standing.neck.length * 0.6 + standing.bill.length + standing.tail.length)
    const legLen = standing.legs.length * s
    expect(ownBox(m.parts.body).min.y).toBeCloseTo(legLen, 2)
  })
  it('folded wings hang down along the flanks', () => {
    const m = buildBird(coot)
    m.pose({ ...defaultPose(), wingSpread: 0 })
    m.group.updateMatrixWorld(true)
    // Use the body mesh's own geometry box, not Box3.setFromObject(body): the wings are
    // children of body, so a subtree box would trivially always contain the wing box.
    const bodyBox = ownBox(m.parts.body)
    const wingBox = new THREE.Box3().setFromObject(m.parts.wingL)
    expect(wingBox.max.y).toBeLessThanOrEqual(bodyBox.max.y + 0.01)
    const bodyCenterY = (bodyBox.min.y + bodyBox.max.y) / 2
    expect(wingBox.min.y).toBeLessThan(bodyCenterY)

    m.pose({ ...defaultPose(), wingSpread: 1, wingPhase: 0.25 })
    m.group.updateMatrixWorld(true)
    const bodyBox2 = ownBox(m.parts.body)
    const wingBox2 = new THREE.Box3().setFromObject(m.parts.wingL)
    expect(wingBox2.max.y).toBeGreaterThan(bodyBox2.max.y)
  })
  it("a standing bird's body centre sits well above its feet", () => {
    const heron = getSpec('grbher3')
    const m = buildBird(heron)
    expect(m.center.y).toBeGreaterThan(0.4)
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/birds/detail/build.test.ts src/birds/procedural.test.ts`
Expected: `build.test.ts` FAILs on missing modules. `procedural.test.ts` passes: the block builder already meets the contract.

- [ ] **Step 3: Implement the builder and measurement**

`src/birds/detail/build.ts`:

```ts
import * as THREE from 'three'
import { defaultPose, type BirdModel, type BirdParts, type PoseState } from '../model'
import type { SpeciesSpec } from '../spec'
import { createProfile, type Profile } from './profile'
import { Mesher } from './mesher'
import { buildLoft, RADIAL, type LoftResult } from './loft'
import { buildBill, buildEyes, type BillResult } from './bill'
import { buildFoldedWings, buildSpreadWings, shoulderAt } from './wing'
import { buildTail } from './tail'
import { buildLegs, legLayout, DEFAULT_STEP, type LegLayout } from './legs'
import { createBones, type Joints } from './rig'
import { legOffsets, solveLeg } from './gait'
import { materialFor } from '../paint/painter'

/** Key points of the built bird in group space at rest pose, for measurement and the viewer. */
export interface Anatomy {
  billBase: THREE.Vector3
  billTip: THREE.Vector3
  /** unit direction of the bill at its base, and its up normal */
  billDir: THREE.Vector3
  billUp: THREE.Vector3
  /** the bill's cross-section where it leaves the forehead */
  billBaseRing: THREE.Vector3[]
  tailRoot: THREE.Vector3
  tailTip: THREE.Vector3
  wrist: THREE.Vector3
  wingTip: THREE.Vector3
  hip: THREE.Vector3
  knee: THREE.Vector3
  foot: THREE.Vector3
  bellyY: number
  /** skin vertices from the occiput forward (the head) */
  head: THREE.Vector3[]
  /** every labelled station's spine point, and the spine itself (101 points, tail to bill base), for the viewer */
  stations: { label: string; position: THREE.Vector3 }[]
  spine: THREE.Vector3[]
  /** index ranges of the closed sub-meshes (loft, bill), for volume checks */
  closed: { name: string; indexFirst: number; indexCount: number }[]
}

export interface DetailedBirdModel extends BirdModel {
  mesh: THREE.SkinnedMesh
  anatomy: Anatomy
  profile: Profile
  layout: LegLayout
}

/** bone scale that hides a part: a skinned mesh cannot hide a piece of itself */
const HIDDEN = 1e-4

export function buildDetailedBird(spec: SpeciesSpec, variant?: string): DetailedBirdModel {
  const detail = spec.detail
  if (!detail) throw new Error(`${spec.code}: no detail block`)
  if (spec.posture !== 'standing') throw new Error(`${spec.code}: the detailed builder supports standing birds only (posture ${spec.posture})`)
  if (variant && !(variant in spec.variants)) throw new Error(`${spec.code}: unknown variant ${variant}`)
  const profile = createProfile(detail.profile)
  const layout = legLayout(detail, profile)

  const m = new Mesher()
  const loft: LoftResult = buildLoft(m, profile, detail.rig)
  const bill: BillResult = buildBill(m, detail, profile)
  buildEyes(m, detail, profile)
  const fold = buildFoldedWings(m, detail, profile)
  const shoulder = shoulderAt(detail, profile)
  buildSpreadWings(m, detail, shoulder)
  const tail = buildTail(m, detail, profile)
  buildLegs(m, layout)

  // profile frame -> group space: hips over the origin, feet on y = 0
  const offset = new THREE.Vector3(-layout.hip.x, layout.standHeight + layout.footY - layout.hip.y, 0)
  m.translate(offset)
  const at = (v: THREE.Vector3 | THREE.Vector2) => new THREE.Vector3(v.x, v.y, 'z' in v ? v.z : 0).add(offset)
  const spineAt = (label: string) => at(profile.sampleAt(profile.uOf(label)).point)
  const mirror = (v: THREE.Vector3) => new THREE.Vector3(v.x, v.y, -v.z)

  const hipMid = at(layout.hip).setZ(0)
  const hipR = at(layout.hip), kneeR = at(layout.knee), footR = at(layout.foot)
  const joints: Joints = {
    root: hipMid.clone(), body: hipMid.clone(), legs: hipMid.clone(),
    neck: spineAt(detail.rig.neckBase), neckMid: spineAt(detail.rig.neckMid), head: spineAt(detail.rig.head),
    bill: at(bill.base), tail: at(tail.root),
    wingFoldR: at(fold.wrist), wingFoldL: mirror(at(fold.wrist)),
    wingR: at(shoulder), wingL: mirror(at(shoulder)),
    tibiaR: hipR, tarsusR: kneeR, toesR: footR,
    tibiaL: mirror(hipR), tarsusL: mirror(kneeR), toesL: mirror(footR),
  }
  const { bones, list } = createBones(joints)

  const geometry = m.geometry()
  const mesh = new THREE.SkinnedMesh(geometry, materialFor(spec, variant))
  mesh.name = 'skin'
  mesh.castShadow = true
  const group = new THREE.Group()
  group.name = `bird:${spec.code}${variant ? ':' + variant : ''}`
  group.add(bones.root, mesh)
  group.updateMatrixWorld(true)
  mesh.bind(new THREE.Skeleton(list))

  const parts: BirdParts = {
    body: bones.body, neck: bones.neck, head: bones.head, bill: bones.bill,
    wingL: bones.wingL, wingR: bones.wingR, tail: bones.tail, legs: bones.legs,
  }

  const headStart = profile.uOf('occiput')
  const headVerts: THREE.Vector3[] = []
  loft.ringU.forEach((u, i) => {
    if (u < headStart) return
    for (let j = 0; j < RADIAL; j++) headVerts.push(m.position(loft.first + i * RADIAL + j))
  })
  const anatomy: Anatomy = {
    billBase: at(bill.base), billTip: at(bill.tip), billDir: bill.dir.clone(), billUp: bill.up.clone(),
    billBaseRing: bill.baseRing.map(v => v.clone().add(offset)),
    tailRoot: at(tail.root), tailTip: at(tail.tip),
    wrist: at(fold.wrist), wingTip: at(fold.tip),
    hip: hipR, knee: kneeR, foot: footR, bellyY: layout.bellyY + offset.y,
    head: headVerts,
    stations: detail.profile.flatMap(s => (s.label ? [{ label: s.label, position: spineAt(s.label) }] : [])),
    spine: Array.from({ length: 101 }, (_, k) => at(profile.sampleAt(k / 100).point)),
    closed: [
      { name: 'loft', indexFirst: loft.indexFirst, indexCount: loft.indexCount },
      { name: 'bill', indexFirst: bill.indexFirst, indexCount: bill.indexCount },
    ],
  }

  // rest angles of each leg, for turning IK solutions into bone rotations
  const hip2 = { x: hipR.x, y: hipR.y }
  const alpha0 = Math.atan2(kneeR.y - hipR.y, kneeR.x - hipR.x)
  const beta0 = Math.atan2(footR.y - kneeR.y, footR.x - kneeR.x)
  const stepLength = (detail.stepLength ?? DEFAULT_STEP) * (layout.tibia + layout.tarsus)
  const lift = layout.tarsus * 0.25
  const headRest = bones.head.position.clone()
  const neckMidRest = bones.neckMid.position.clone()
  const bodyLength = profile.length

  function setLeg(tibia: THREE.Bone, tarsus: THREE.Bone, toes: THREE.Bone, dx: number, dy: number) {
    const { joint, foot } = solveLeg(hip2, { x: footR.x + dx, y: footR.y + dy }, layout.tibia, layout.tarsus)
    const alpha = Math.atan2(joint.y - hip2.y, joint.x - hip2.x)
    const beta = Math.atan2(foot.y - joint.y, foot.x - joint.x)
    tibia.rotation.z = alpha - alpha0
    tarsus.rotation.z = (beta - beta0) - (alpha - alpha0)
    toes.rotation.z = -(beta - beta0)
  }

  function pose(st: PoseState) {
    // lean.x pitches the nose down, lean.z rolls; the body pivots over the hips
    bones.body.rotation.set(st.lean.z, 0, -st.lean.x)
    // neck: 0.5 is the traced rest posture. Tucking draws the head down into the shoulders; extending
    // lengthens the neck a little and tips it forward, so a strike reaches out and down.
    const ext = THREE.MathUtils.clamp(st.neckExtend, 0, 1)
    const k = ext < 0.5 ? 0.6 + 0.8 * ext : 1 + 0.3 * (ext - 0.5)
    const tip = -0.5 * (ext - 0.5)
    bones.neck.rotation.z = tip
    bones.head.rotation.z = -tip                       // keeps the bill level relative to the body
    bones.neckMid.position.copy(neckMidRest).multiplyScalar(k)
    bones.head.position.copy(headRest).multiplyScalar(k)
    bones.head.position.x += st.headBob * bodyLength
    bones.tail.rotation.z = st.tailTilt
    // wings: folded shell at rest, the spread planform once the wings open
    const spread = THREE.MathUtils.clamp(st.wingSpread, 0, 1)
    const open = spread > 0.05
    for (const b of [bones.wingFoldL, bones.wingFoldR]) b.scale.setScalar(open ? HIDDEN : 1)
    for (const b of [bones.wingL, bones.wingR]) b.scale.setScalar(open ? 1 : HIDDEN)
    const flap = Math.sin(st.wingPhase * Math.PI * 2) * 0.9 * spread
    bones.wingL.rotation.x = flap
    bones.wingR.rotation.x = -flap
    // legs
    const { left, right } = legOffsets(st.strideDistance, st.gait, stepLength, lift)
    setLeg(bones.tibiaR, bones.tarsusR, bones.toesR, right.x, right.y)
    setLeg(bones.tibiaL, bones.tarsusL, bones.toesL, left.x, left.y)
  }
  pose(defaultPose())
  group.updateMatrixWorld(true)

  const box = new THREE.Box3().setFromObject(group, true)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  mesh.computeBoundingSphere()
  mesh.boundingSphere!.radius *= 1.3            // poses reach a little past the rest bounds

  return {
    group, parts, pose, center, mesh, anatomy, profile, layout,
    radius: Math.max(size.x, size.y) * 0.5,
    dispose() { geometry.dispose() },
  }
}
```

`src/birds/detail/measure.ts`:

```ts
import type { DetailedBirdModel } from './build'

/** Field measurements of a built bird at rest pose, metres, taken the way the published tables take them. */
export interface Measures {
  /** bill tip to tail tip, straight line */
  length: number
  /** exposed culmen: where the bill leaves the forehead to the tip */
  culmen: number
  /** total head minus culmen; total head is bill tip to the rearmost point of the head along the bill axis */
  head: number
  /** bill depth where it leaves the forehead */
  billDepth: number
  /** how far the tip sits above the line of the bill's base (positive = upturned) */
  billTipRise: number
  tarsus: number
  /** bare tibia: from where it leaves the belly to the intertarsal joint */
  tibia: number
  /** wrist to wingtip */
  wingChord: number
  /** tail root to the middle of the tip */
  tail: number
  /** how far the folded wingtip reaches past the tail tip, along the tail */
  projection: number
}

export function measure(model: DetailedBirdModel): Measures {
  const a = model.anatomy
  const culmen = a.billTip.distanceTo(a.billBase)
  let totalHead = 0
  for (const v of a.head) totalHead = Math.max(totalHead, a.billTip.clone().sub(v).dot(a.billDir))
  let lo = Infinity, hi = -Infinity
  for (const v of a.billBaseRing) {
    const h = v.clone().sub(a.billBase).dot(a.billUp)
    lo = Math.min(lo, h); hi = Math.max(hi, h)
  }
  const drop = a.hip.y - a.knee.y
  const bare = drop > 0 ? Math.min(1, Math.max(0, (a.bellyY - a.knee.y) / drop)) : 0
  const tailAxis = a.tailTip.clone().sub(a.tailRoot).normalize()
  return {
    length: a.billTip.distanceTo(a.tailTip),
    culmen,
    head: totalHead - culmen,
    billDepth: hi - lo,
    billTipRise: a.billTip.clone().sub(a.billBase).dot(a.billUp),
    tarsus: a.knee.distanceTo(a.foot),
    tibia: a.hip.distanceTo(a.knee) * bare,
    wingChord: a.wrist.distanceTo(a.wingTip),
    tail: a.tailRoot.distanceTo(a.tailTip),
    projection: a.wingTip.clone().sub(a.tailTip).dot(tailAxis),
  }
}
```

`src/birds/factory.ts`:

```ts
import { buildBird } from './procedural'
import { buildDetailedBird } from './detail/build'
import type { BirdModel } from './model'
import type { SpeciesSpec } from './spec'

/** The detailed builder for species with a detail block, the block builder for everything else. */
export function createBirdModel(spec: SpeciesSpec, variant?: string): BirdModel {
  return spec.detail ? buildDetailedBird(spec, variant) : buildBird(spec, variant)
}
```

- [ ] **Step 4: Spawn through the factory; paint stats on the dev overlay**

In `src/birds/spawn.ts`, replace `import { buildBird } from './procedural'` with `import { createBirdModel } from './factory'`, and in `spawnCast` replace

```ts
      ? buildBird(getSpec(ind.species), ind.variant)
```

with

```ts
      ? createBirdModel(getSpec(ind.species), ind.variant)
```

`flock.ts` and `placeholder.ts` keep calling `buildBird`. A converted species that flocks falls back to blocks until flocks learn skinning; neither yellowlegs flocks.

Replace `src/hud/devOverlay.ts` with:

```ts
import { paintStats } from '../birds/paint/painter'

export interface DevStats { fps: number; birds: number; gust: number; mode: string; audio: string; calls: number }

export function createDevOverlay(root: HTMLElement, onToggle?: (visible: boolean) => void) {
  const el = document.createElement('pre')
  el.style.cssText = 'position:absolute;top:8px;left:8px;margin:0;padding:6px 8px;background:rgba(0,0,0,.5);color:#cfe;font:12px/1.4 monospace;display:none'
  root.appendChild(el)
  let visible = false
  addEventListener('keydown', e => {
    if (e.key === '`') {
      visible = !visible
      el.style.display = visible ? 'block' : 'none'
      onToggle?.(visible)
    }
  })
  let acc = 0, frames = 0, fps = 0
  return {
    update(dt: number, stats: Omit<DevStats, 'fps'>) {
      acc += dt; frames++
      if (acc >= 0.5) { fps = frames / acc; acc = 0; frames = 0 }
      if (visible) {
        const paint = paintStats.atlases
          ? `\natlases ${paintStats.atlases}: ${(paintStats.ms / paintStats.atlases).toFixed(0)} ms each, ${(paintStats.bytes / 1048576).toFixed(1)} MB`
          : ''
        el.textContent = `fps ${fps.toFixed(0)}\nbirds ${stats.birds}\ngust ${stats.gust.toFixed(2)}\nmode ${stats.mode}\naudio ${stats.audio}\ncalls ${stats.calls}${paint}`
      }
    },
  }
}
```

- [ ] **Step 5: Run everything**

Run: `npm test && npx tsc -p tsconfig.json`
Expected: all PASS, `tsc` clean. At this point `greyel` has no `detail`, so the game is unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/birds/detail/build.ts src/birds/detail/measure.ts src/birds/detail/build.test.ts src/birds/factory.ts src/birds/contract.testkit.ts src/birds/procedural.test.ts src/birds/spawn.ts src/hud/devOverlay.ts
git commit -m "feat: the detailed builder: one skinned, painted mesh per bird, behind the BirdModel seam"
```

---

### Task 10: The dev viewer

**Files:**
- Create: `viewer.html`, `src/viewer/viewer.css`, `src/viewer/state.ts`, `src/viewer/state.test.ts`, `src/viewer/main.ts`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `SPECIES`, `getSpec`; `createBirdModel` (Task 9); `DetailedBirdModel`, `measure` (Task 9); `paintAtlas` (Task 8); `createLighting`, `paletteFor`; `OPTICS`.
- Produces:

```ts
// state.ts
export const VIEWS: readonly ['side', 'front', 'top', 'three']
export const FIELD_VIEWS: { scope22, scope65, bino22, bino65: { label: string; distance: number; fov: number } }
export interface ViewerState { a; av; b; bv: string; view; field; neck; lean; spread; phase: number; walk; water; wire; skel; uv; atlas; stations: boolean }
export interface Catalog { has(code: string): boolean; variants(code: string): string[] }
export function parseState(hash: string, defaults: ViewerState, catalog?: Catalog): ViewerState
export function stateHash(s: ViewerState): string
```

Vite serves `viewer.html` in dev. The production build only includes `index.html`: `vite.config.ts` sets no `build.rollupOptions.input`, so there is nothing to change there. State lives in the URL hash, so reloading after an edit (Vite reloads the page when a species file changes) keeps the view. The viewer clones each detailed bird's material before toggling wireframe or the UV checker, so the game's shared material is never touched.

- [ ] **Step 1: Write the failing test**

`src/viewer/state.test.ts`:

```ts
import { parseState, stateHash, type ViewerState } from './state'

const DEFAULTS: ViewerState = {
  a: 'greyel', av: '', b: 'lesyel', bv: '', view: 'side', field: '',
  neck: 0.5, lean: 0, spread: 0, phase: 0, walk: false,
  water: false, wire: false, skel: false, uv: false, atlas: false, stations: false,
}

describe('viewer state', () => {
  it('round-trips through the hash', () => {
    const s: ViewerState = { ...DEFAULTS, a: 'mallar3', av: 'female', view: 'top', field: 'scope22', neck: 0.8, walk: true, wire: true }
    expect(parseState(stateHash(s), DEFAULTS)).toEqual(s)
  })
  it('keeps the defaults for anything missing or malformed', () => {
    const s = parseState('#view=sideways&field=scope99&neck=abc&spread=7', DEFAULTS)
    expect(s.view).toBe('side')
    expect(s.field).toBe('')
    expect(s.neck).toBe(0.5)
    expect(s.spread).toBe(1)             // clamped
  })
  it('falls back from a species or plumage the catalog lacks', () => {
    const catalog = { has: (c: string) => ['greyel', 'lesyel', 'mallar3'].includes(c), variants: (c: string) => (c === 'mallar3' ? ['male', 'female'] : []) }
    const s = parseState('#a=nosuchbird&b=mallar3&bv=juvenile', DEFAULTS, catalog)
    expect(s.a).toBe('greyel')
    expect(s.b).toBe('mallar3')
    expect(s.bv).toBe('')
    expect(parseState('#b=mallar3&bv=female', DEFAULTS, catalog).bv).toBe('female')
  })
  it('reads an empty hash as the defaults', () => {
    expect(parseState('', DEFAULTS)).toEqual(DEFAULTS)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/viewer`
Expected: FAIL, `Cannot find module './state'`.

- [ ] **Step 3: Implement the state**

`src/viewer/state.ts`:

```ts
import { OPTICS } from '../player/optics'

export const VIEWS = ['side', 'front', 'top', 'three'] as const
export type View = (typeof VIEWS)[number]

/** Field views: how the player sees the pair from the bank. */
export const FIELD_VIEWS = {
  scope22: { label: 'telescope, 22 m (shallows)', distance: 22, fov: OPTICS.telescope.fov },
  scope65: { label: 'telescope, 65 m (far shore)', distance: 65, fov: OPTICS.telescope.fov },
  bino22: { label: 'binoculars, 22 m', distance: 22, fov: OPTICS.binoculars.fov },
  bino65: { label: 'binoculars, 65 m', distance: 65, fov: OPTICS.binoculars.fov },
} as const
export type FieldView = keyof typeof FIELD_VIEWS | ''

/** Everything the viewer shows, kept in the URL hash so a reload (Vite's hot reload of a species file) restores it. */
export interface ViewerState {
  a: string; av: string
  b: string; bv: string
  view: View
  field: FieldView
  neck: number; lean: number; spread: number; phase: number
  walk: boolean
  water: boolean; wire: boolean; skel: boolean; uv: boolean; atlas: boolean; stations: boolean
}

const NUMBERS = ['neck', 'lean', 'spread', 'phase'] as const
const FLAGS = ['walk', 'water', 'wire', 'skel', 'uv', 'atlas', 'stations'] as const
const STRINGS = ['a', 'av', 'b', 'bv'] as const

/** What the viewer can show: species codes it knows, and each one's plumages. */
export interface Catalog { has(code: string): boolean; variants(code: string): string[] }

/**
 * Read a hash like "#a=greyel&b=lesyel&field=scope22&wire=1" over the defaults. Unknown or bad values keep the
 * default; a species the catalog lacks keeps the default species, and a plumage it lacks becomes the default one.
 */
export function parseState(hash: string, defaults: ViewerState, catalog?: Catalog): ViewerState {
  const p = new URLSearchParams(hash.replace(/^#/, ''))
  const s: ViewerState = { ...defaults }
  for (const k of STRINGS) { const v = p.get(k); if (v !== null) s[k] = v }
  if (catalog) {
    for (const [code, variant] of [['a', 'av'], ['b', 'bv']] as const) {
      if (!catalog.has(s[code])) { s[code] = defaults[code]; s[variant] = defaults[variant] }
      if (s[variant] && !catalog.variants(s[code]).includes(s[variant])) s[variant] = ''
    }
  }
  for (const k of NUMBERS) {
    const v = Number(p.get(k))
    if (p.has(k) && Number.isFinite(v)) s[k] = Math.min(Math.max(v, 0), 1)
  }
  for (const k of FLAGS) if (p.has(k)) s[k] = p.get(k) === '1'
  const view = p.get('view')
  if (view && (VIEWS as readonly string[]).includes(view)) s.view = view as View
  const field = p.get('field')
  if (field !== null && (field === '' || field in FIELD_VIEWS)) s.field = field as FieldView
  return s
}

export function stateHash(s: ViewerState): string {
  const p = new URLSearchParams()
  for (const k of STRINGS) p.set(k, s[k])
  p.set('view', s.view)
  p.set('field', s.field)
  for (const k of NUMBERS) p.set(k, String(s[k]))
  for (const k of FLAGS) p.set(k, s[k] ? '1' : '0')
  return '#' + p.toString()
}
```

Run: `npx vitest run src/viewer`
Expected: PASS.

- [ ] **Step 4: The page**

`viewer.html` (repo root, beside `index.html`):

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Lakewatch bird viewer</title>
    <link rel="stylesheet" href="/src/viewer/viewer.css" />
  </head>
  <body>
    <img id="ref" alt="" />
    <div id="stage"></div>
    <div id="labels"></div>
    <aside id="panel"></aside>
    <canvas id="atlas" width="512" height="512"></canvas>
    <script type="module" src="/src/viewer/main.ts"></script>
  </body>
</html>
```

`src/viewer/viewer.css`:

```css
html, body { margin: 0; height: 100%; overflow: hidden; background: #cfd8dc; font: 12px/1.4 system-ui, sans-serif; color: #1d2327; }
#stage { position: absolute; inset: 0; }
#stage canvas { display: block; }
#ref { position: absolute; left: 0; top: 0; transform-origin: 0 0; pointer-events: none; display: none; }
#labels { position: absolute; inset: 0; pointer-events: none; }
#labels span { position: absolute; transform: translate(4px, -50%); font: 10px monospace; color: #b3261e; white-space: nowrap; }
#panel { position: absolute; top: 8px; right: 8px; width: 260px; max-height: calc(100% - 16px); overflow: auto; background: rgba(255,255,255,.88); border-radius: 6px; padding: 8px 10px; }
#panel fieldset { border: 1px solid #c4ccd0; border-radius: 4px; margin: 0 0 8px; padding: 4px 8px 6px; }
#panel legend { font-weight: 600; padding: 0 4px; }
#panel label { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin: 2px 0; }
#panel input[type=range] { width: 120px; }
#panel select { max-width: 150px; }
#panel pre { margin: 4px 0 0; font: 11px/1.35 monospace; white-space: pre-wrap; }
#panel .row { display: flex; flex-wrap: wrap; gap: 4px; }
#atlas { position: absolute; left: 8px; bottom: 8px; width: 256px; height: 256px; border: 1px solid #888; image-rendering: pixelated; display: none; background: #808080; }
```

`src/viewer/main.ts`:

```ts
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createLighting } from '../world/lighting'
import { paletteFor } from '../world/palette'
import { SPECIES, getSpec, hasSpec } from '../birds/species'
import { createBirdModel } from '../birds/factory'
import { defaultPose, type BirdModel } from '../birds/model'
import type { DetailedBirdModel } from '../birds/detail/build'
import { measure } from '../birds/detail/measure'
import { createProfile } from '../birds/detail/profile'
import { layersFor } from '../birds/detail/spec'
import { paintAtlas } from '../birds/paint/painter'
import { ATLAS_SIZE } from '../birds/paint/atlas'
import { parseState, stateHash, FIELD_VIEWS, VIEWS, type ViewerState } from './state'

// Dev-only model viewer (npm run dev, then /viewer.html). Not part of the game build.

const DEFAULTS: ViewerState = {
  a: 'greyel', av: '', b: SPECIES['lesyel'] ? 'lesyel' : 'killde', bv: '', view: 'side', field: '',
  neck: 0.5, lean: 0, spread: 0, phase: 0, walk: false,
  water: false, wire: false, skel: false, uv: false, atlas: false, stations: false,
}
let state = parseState(location.hash, DEFAULTS, { has: hasSpec, variants: c => Object.keys(getSpec(c).variants) })
const save = () => history.replaceState(null, '', stateHash(state))
// a pasted or bookmarked link: start over from its state (replaceState above never fires this)
addEventListener('hashchange', () => location.reload())

// --- scene ---------------------------------------------------------------------------------------
const stage = document.getElementById('stage')!
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(1)
renderer.shadowMap.enabled = true
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.05
stage.appendChild(renderer.domElement)
const scene = new THREE.Scene()
const BACKGROUND = new THREE.Color('#cfd8dc')
scene.background = BACKGROUND
scene.add(createLighting(paletteFor('early-autumn', 'morning')).object)
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#8a8272', roughness: 1 }))
ground.receiveShadow = true
const grid = new THREE.GridHelper(4, 80, '#6f685a', '#7c7566')
grid.position.y = 0.0005
const water = new THREE.Mesh(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2),
  new THREE.MeshStandardMaterial({ color: '#6f8a93', roughness: 0.15, transparent: true, opacity: 0.55 }))
water.position.y = 0.03
scene.add(ground, grid, water)

const camera = new THREE.PerspectiveCamera(20, 1, 0.01, 500)
const controls = new OrbitControls(camera, renderer.domElement)

// --- birds ---------------------------------------------------------------------------------------
interface Slot {
  model: BirdModel
  base: THREE.Vector3
  skeleton?: THREE.SkeletonHelper
  /** a detailed bird's own copy of its material, so viewer toggles never touch the game's shared one */
  material?: THREE.MeshStandardMaterial
  painted?: THREE.Texture | null
}
let slots: Slot[] = []
let checker: THREE.DataTexture | null = null
/** the left bird's spine, drawn through its profile when stations are shown */
const spine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: '#b3261e', depthTest: false }))
spine.renderOrder = 1
scene.add(spine)

function checkerTexture(): THREE.DataTexture {
  if (checker) return checker
  const n = 256, data = new Uint8Array(n * n * 4)
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const on = ((x >> 4) + (y >> 4)) & 1
    data.set(on ? [230, 90, 60, 255] : [240, 240, 240, 255], (y * n + x) * 4)
  }
  checker = new THREE.DataTexture(data, n, n)
  checker.needsUpdate = true
  return checker
}

function build(): void {
  for (const s of slots) { scene.remove(s.model.group); if (s.skeleton) scene.remove(s.skeleton); s.model.dispose() }
  const models = [[state.a, state.av], [state.b, state.bv]].map(([code, v]) => createBirdModel(getSpec(code!), v || undefined))
  const gap = Math.max(...models.map(m => m.radius)) * 1.15
  slots = models.map((model, i) => {
    const base = new THREE.Vector3(i === 0 ? -gap : gap, 0, 0)
    model.group.position.copy(base)
    scene.add(model.group)
    const slot: Slot = { model, base }
    if ('mesh' in model) {
      const d = model as DetailedBirdModel
      slot.material = (d.mesh.material as THREE.MeshStandardMaterial).clone()
      slot.painted = slot.material.map
      d.mesh.material = slot.material
      slot.skeleton = new THREE.SkeletonHelper(d.mesh)
      scene.add(slot.skeleton)
    }
    return slot
  })
  const left = slots[0]!.model as Partial<DetailedBirdModel>
  spine.parent?.remove(spine)
  if (left.anatomy) {
    spine.geometry.setFromPoints(left.anatomy.spine)
    slots[0]!.model.group.add(spine)
  }
  paintAtlasPanel()
  applyLook()
  place()
}

function applyLook(): void {
  water.visible = state.water
  spine.visible = state.stations
  for (const s of slots) {
    if (s.skeleton) s.skeleton.visible = state.skel
    if (s.material) {
      s.material.wireframe = state.wire
      s.material.map = state.uv ? checkerTexture() : s.painted ?? null
      s.material.needsUpdate = true
    } else s.model.group.traverse(o => { if (o instanceof THREE.Mesh) (o.material as THREE.MeshStandardMaterial).wireframe = state.wire })
  }
  document.getElementById('atlas')!.style.display = state.atlas ? 'block' : 'none'
}

function paintAtlasPanel(): void {
  const spec = getSpec(state.a)
  const canvas = document.getElementById('atlas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  if (!spec.detail) { ctx.clearRect(0, 0, canvas.width, canvas.height); return }
  const px = paintAtlas({ code: spec.code, detail: spec.detail, layers: layersFor(spec.detail, state.av || undefined), profile: createProfile(spec.detail.profile) })
  const img = ctx.createImageData(ATLAS_SIZE, ATLAS_SIZE)
  for (let y = 0; y < ATLAS_SIZE; y++) img.data.set(px.subarray((ATLAS_SIZE - 1 - y) * ATLAS_SIZE * 4, (ATLAS_SIZE - y) * ATLAS_SIZE * 4), y * ATLAS_SIZE * 4)
  ctx.putImageData(img, 0, 0)
}

// --- camera --------------------------------------------------------------------------------------
function place(): void {
  const field = state.field ? FIELD_VIEWS[state.field] : null
  const w = field ? 1280 : innerWidth, h = field ? 720 : innerHeight
  renderer.setSize(w, h)
  camera.aspect = w / h
  const mid = slots.reduce((acc, s) => acc.add(s.model.center.clone().add(s.base)), new THREE.Vector3()).multiplyScalar(1 / slots.length)
  if (field) {
    camera.fov = field.fov
    camera.position.set(mid.x, 1.6, field.distance)
    camera.lookAt(mid)
    controls.enabled = false
  } else {
    camera.fov = 20
    // back off far enough to fit both birds side by side, with room for the panel
    const span = Math.abs(slots[0]!.base.x - slots[1]!.base.x) + 2 * Math.max(...slots.map(s => s.model.radius))
    const d = (span / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.5
    const at = { side: [0, 0, d], front: [d, 0, 0], top: [0, d, 0.001], three: [d * 0.6, d * 0.3, d * 0.75] }[state.view]
    camera.position.set(mid.x + at[0]!, mid.y + at[1]!, mid.z + at[2]!)
    controls.target.copy(mid)
    controls.enabled = true
    controls.update()
  }
  camera.updateProjectionMatrix()
}
addEventListener('resize', place)

// --- reference photo -----------------------------------------------------------------------------
const ref = document.getElementById('ref') as HTMLImageElement
const photo = { opacity: 0.5, scale: 1, x: 0, y: 0 }
function applyPhoto(): void {
  const on = !!ref.src && ref.style.display !== 'none'
  ref.style.opacity = String(photo.opacity)
  ref.style.transform = `translate(${photo.x}px, ${photo.y}px) scale(${photo.scale})`
  scene.background = on ? null : BACKGROUND
  ground.visible = grid.visible = !on
}

// --- panel ---------------------------------------------------------------------------------------
const panel = document.getElementById('panel')!
function group(title: string): HTMLFieldSetElement {
  const f = document.createElement('fieldset')
  const legend = document.createElement('legend')
  legend.textContent = title
  f.appendChild(legend)
  panel.appendChild(f)
  return f
}
function select(parent: HTMLElement, label: string, options: [string, string][], value: string, on: (v: string) => void) {
  const l = document.createElement('label')
  l.textContent = label
  const s = document.createElement('select')
  for (const [v, t] of options) s.add(new Option(t, v, false, v === value))
  s.onchange = () => on(s.value)
  l.appendChild(s)
  parent.appendChild(l)
  return s
}
function slider(parent: HTMLElement, label: string, value: number, on: (v: number) => void, min = 0, max = 1, step = 0.01) {
  const l = document.createElement('label')
  l.textContent = label
  const r = Object.assign(document.createElement('input'), { type: 'range', min: String(min), max: String(max), step: String(step), value: String(value) })
  r.oninput = () => on(Number(r.value))
  l.appendChild(r)
  parent.appendChild(l)
}
function check(parent: HTMLElement, label: string, value: boolean, on: (v: boolean) => void) {
  const l = document.createElement('label')
  l.textContent = label
  const c = Object.assign(document.createElement('input'), { type: 'checkbox', checked: value })
  c.onchange = () => on(c.checked)
  l.appendChild(c)
  parent.appendChild(l)
}
const set = (patch: Partial<ViewerState>, rebuild = false) => {
  state = { ...state, ...patch }
  save()
  if (rebuild) build()
  else { applyLook(); place() }
}

const species: [string, string][] = Object.values(SPECIES).map(s => [s.code, `${s.commonName}${s.detail ? ' *' : ''}`])
const variants = (code: string): [string, string][] => [['', '(default)'], ...Object.keys(getSpec(code).variants).map(v => [v, v] as [string, string])]
for (const key of ['a', 'b'] as const) {
  const g = group(key === 'a' ? 'Left bird' : 'Right bird')
  const vKey = key === 'a' ? 'av' : 'bv'
  let plumage: HTMLSelectElement | null = null
  select(g, 'species', species, state[key], v => {
    plumage?.replaceChildren(...variants(v).map(([val, t]) => new Option(t, val)))
    set({ [key]: v, [vKey]: '' }, true)
  })
  plumage = select(g, 'plumage', variants(state[key]), state[vKey], v => set({ [vKey]: v }, true))
}
const cam = group('Camera')
select(cam, 'view', VIEWS.map(v => [v, v] as [string, string]), state.view, v => set({ view: v as ViewerState['view'] }))
select(cam, 'field view', [['', 'off (orbit)'], ...Object.entries(FIELD_VIEWS).map(([k, f]) => [k, f.label] as [string, string])], state.field,
  v => set({ field: v as ViewerState['field'] }))
check(cam, 'shallow water', state.water, v => set({ water: v }))
const pose = group('Pose')
slider(pose, 'neck', state.neck, v => set({ neck: v }))
slider(pose, 'lean', state.lean, v => set({ lean: v }))
slider(pose, 'wing spread', state.spread, v => set({ spread: v }))
slider(pose, 'wing phase', state.phase, v => set({ phase: v }))
check(pose, 'walk', state.walk, v => set({ walk: v }))
const aids = group('Authoring')
check(aids, 'stations (left bird)', state.stations, v => set({ stations: v }))
check(aids, 'wireframe', state.wire, v => set({ wire: v }))
check(aids, 'skeleton', state.skel, v => set({ skel: v }))
check(aids, 'UV checker', state.uv, v => set({ uv: v }))
check(aids, 'atlas (left bird)', state.atlas, v => set({ atlas: v }))
const photoGroup = group('Reference photo (not saved)')
const file = Object.assign(document.createElement('input'), { type: 'file', accept: 'image/*' })
file.onchange = () => {
  const f = file.files?.[0]
  if (!f) return
  ref.src = URL.createObjectURL(f)
  ref.style.display = 'block'
  applyPhoto()
}
photoGroup.appendChild(file)
slider(photoGroup, 'opacity', photo.opacity, v => { photo.opacity = v; applyPhoto() })
slider(photoGroup, 'scale', photo.scale, v => { photo.scale = v; applyPhoto() }, 0.1, 4, 0.01)
slider(photoGroup, 'x', photo.x, v => { photo.x = v; applyPhoto() }, -1500, 1500, 1)
slider(photoGroup, 'y', photo.y, v => { photo.y = v; applyPhoto() }, -1500, 1500, 1)
check(photoGroup, 'show', true, v => { ref.style.display = v && ref.src ? 'block' : 'none'; applyPhoto() })
const readout = document.createElement('pre')
group('Measurements, mm').appendChild(readout)

// --- loop ----------------------------------------------------------------------------------------
const labels = document.getElementById('labels')!
const WALK_SPEED = 0.35          // wade's pace, m/s
const WALK_LOOP = 0.6            // metres before the walk starts over
let stride = 0
let last = performance.now()
const tmp = new THREE.Vector3()

function frame(): void {
  const now = performance.now()
  const dt = Math.min((now - last) / 1000, 0.1)
  last = now
  if (state.walk) stride += WALK_SPEED * dt
  const p = { ...defaultPose(), neckExtend: state.neck, wingSpread: state.spread, wingPhase: state.phase, strideDistance: stride, gait: state.walk ? 1 : 0 }
  p.lean.x = state.lean
  for (const s of slots) {
    s.model.group.position.copy(s.base)
    if (state.walk) s.model.group.position.x += stride % WALK_LOOP
    s.model.pose(p)
  }
  renderer.render(scene, camera)

  labels.replaceChildren()
  const a = slots[0]?.model as DetailedBirdModel | undefined
  if (state.stations && a?.anatomy) {
    for (const st of a.anatomy.stations) {
      tmp.copy(st.position).applyMatrix4(a.group.matrixWorld).project(camera)
      const el = document.createElement('span')
      el.textContent = `• ${st.label}`
      el.style.left = `${(tmp.x * 0.5 + 0.5) * renderer.domElement.width}px`
      el.style.top = `${(-tmp.y * 0.5 + 0.5) * renderer.domElement.height}px`
      labels.appendChild(el)
    }
  }
  readout.textContent = slots.map(s => {
    const name = s.model.group.name.replace('bird:', '')
    if (!('anatomy' in s.model)) return `${name}: block model`
    const m = measure(s.model as DetailedBirdModel)
    const f = (v: number) => (v * 1000).toFixed(1)
    return `${name}\n  length ${f(m.length)}  culmen ${f(m.culmen)}  head ${f(m.head)}\n  culmen/head ${(m.culmen / m.head).toFixed(2)}  culmen/tarsus ${(m.culmen / m.tarsus).toFixed(2)}\n  bill depth ${f(m.billDepth)}  tip rise ${f(m.billTipRise)}\n  tarsus ${f(m.tarsus)}  bare tibia ${f(m.tibia)}\n  wing ${f(m.wingChord)}  tail ${f(m.tail)}  projection ${f(m.projection)}`
  }).join('\n')
  requestAnimationFrame(frame)
}

build()
save()
frame()
```

Add `.playwright-mcp` to `.gitignore` on its own line. The screenshots the next step takes land there.

- [ ] **Step 5: Look at it**

Run `npm run dev`, then check the page in the browser. With Playwright, navigate and use `browser_take_screenshot`.

1. Open `http://localhost:5173/viewer.html#a=nosuchbird`. Expected: the page falls back to its defaults, `greyel` (still block-built) beside `killde`, and the console shows no errors.
2. Change the species and plumage pickers, the view, and the pose sliders. Each change updates the hash.
3. Pick "telescope, 22 m (shallows)" as the field view. Expected: the canvas becomes 1280 x 720, looking from 1.6 m up and 22 m away.

No species has a detail block until Task 11, so this step checks only the page's own behaviour. Stop the dev server afterwards.

- [ ] **Step 6: Run and commit**

Run: `npm test && npx tsc -p tsconfig.json && npx vite build`
Expected: all PASS, `tsc` clean, and `dist/` holds `index.html` and `assets/` only, with no `viewer.html`.

```bash
git add viewer.html src/viewer .gitignore
git commit -m "feat: dev-only bird viewer: true-scale pairs, field views, reference overlay, live measurements"
```

---

### Task 11: The Greater Yellowlegs, detailed

**Files:**
- Modify: `src/birds/species/greyel.ts`, `src/birds/species/species.test.ts`

**Interfaces:**
- Consumes: `buildDetailedBird`, `measure` (Task 9); `worstFold` (Task 5); `createProfile` (Task 3); `createBirdModel` (Task 9).
- Produces: `greyel` with a `detail` block (juvenile, late September) and rewritten field-mark text; species-level tests that every detailed species builds to its own measurements and never creases.

The starting outline is traced from the catalog's own photo, `public/media/photos/greyel.jpg` (© Quinten Wiegersma, CC BY; already credited in-game). It is a side-on Greater with a spangled back, standing in water. Scale: 0.68 mm per pixel, since the 56 mm bill spans 82.5 px. That same scale gives a wrist-to-wingtip of 188 mm, matching the published wing chord, and a bill-tip-to-tail-tip of about 305 mm against a published 310. The feet are underwater in the photo, so leg lengths come from the measurements. The head stations follow an even arc from the nape (see Decisions made while planning).

- [ ] **Step 1: Write the failing tests**

Replace `src/birds/species/species.test.ts` with:

```ts
import { SPECIES, getSpec, hasSpec } from './index'
import { createBirdModel } from '../factory'
import { buildDetailedBird } from '../detail/build'
import { measure } from '../detail/measure'
import { createProfile } from '../detail/profile'
import { worstFold } from '../detail/loft'
import { loadCatalog } from '../../catalog'
import { loadLocation } from '../../location'

describe('species specs', () => {
  it('has a spec for every species the lake casts', () => {
    for (const entry of loadLocation().cast) expect(hasSpec(entry.species), entry.species).toBe(true)
  })
  it('has specs for the birds that arrive with flyover, perch, and hover', () => {
    for (const code of ['cangoo', 'belkin1', 'rewbla', 'marwre']) expect(hasSpec(code), code).toBe(true)
  })
  it('every mark is a non-empty sentence fragment', () => {
    for (const spec of Object.values(SPECIES)) for (const [k, m] of Object.entries(spec.marks)) expect(m.length, `${spec.code}.${k}`).toBeGreaterThan(8)
  })
  it('every spec code exists in the catalog with the same common name', () => {
    const catalog = loadCatalog()
    for (const spec of Object.values(SPECIES)) {
      const bird = catalog.find(b => b.speciesCode === spec.code)
      expect(bird, spec.code).toBeDefined()
      expect(bird!.commonName).toBe(spec.commonName)
    }
  })
  it('every spec and variant builds without throwing', () => {
    for (const spec of Object.values(SPECIES)) {
      expect(() => createBirdModel(spec)).not.toThrow()
      for (const v of Object.keys(spec.variants)) expect(() => createBirdModel(spec, v)).not.toThrow()
    }
  })
  it('every detailed species builds to its own measurements', () => {
    for (const spec of Object.values(SPECIES)) {
      const d = spec.detail
      if (!d) continue
      const r = measure(buildDetailedBird(spec))
      const m = d.measurements
      expect(Math.abs(r.length - m.length) / m.length, `${spec.code} length`).toBeLessThan(0.05)
      for (const k of ['culmen', 'billDepth', 'tarsus', 'wingChord', 'tail'] as const) {
        expect(Math.abs(r[k] - m[k]) / m[k], `${spec.code} ${k}`).toBeLessThan(0.02)
      }
      expect(Math.abs(r.tibia - m.tibia) / m.tibia, `${spec.code} tibia`).toBeLessThan(0.15)
    }
  })
  it('no detailed species creases its body: the spine never turns tighter than the body is deep', () => {
    for (const spec of Object.values(SPECIES)) {
      if (spec.detail) expect(worstFold(createProfile(spec.detail.profile), spec.detail.rig), spec.code).toBe(0)
    }
  })
  it('mallard has male and female variants', () => {
    expect(Object.keys(getSpec('mallar3').variants).sort()).toEqual(['female', 'male'])
  })
  it('heron stands taller than it is long', () => {
    const h = getSpec('grbher3')
    expect(h.legs.length + h.neck.length).toBeGreaterThan(h.body.length)
  })
})
```

- [ ] **Step 2: Run to verify they still pass with no detailed species**

Run: `npx vitest run src/birds/species`
Expected: PASS. The new tests loop over detailed species and there are none yet. They take effect when `greyel` gains its detail block.

- [ ] **Step 3: The species file**

Replace `src/birds/species/greyel.ts` with:

```ts
import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'greyel',
  commonName: 'Greater Yellowlegs',
  length: 0.31,
  body: { length: 1, height: 0.5, width: 0.42 },
  neck: { length: 0.32, thickness: 0.12, angle: 65 },
  head: { size: 0.26 },
  bill: { length: 0.36, thickness: 0.06, shape: 'pointed' },
  legs: { length: 0.75, thickness: 0.025 },
  tail: { length: 0.12, angle: 0 },
  wing: { length: 0.6, width: 0.28 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#6a6252', cheek: '#a8a292', throat: '#f2f0ea', breast: '#d8d2c4', flank: '#eeeae0',
    back: '#6a6454', wing: '#736c5c', speculum: null, rump: '#f2f0ea', tail: '#c8c2b2',
    bill: '#2a2a2a', legs: '#e8c22a', eye: '#111111',
  },
  variants: {},
  marks: {
    size: 'a tall, lanky shorebird, about twice the weight of a Lesser Yellowlegs',
    bill: 'a long, thick-based bill about one and a half times the length of the head, often faintly upturned, greyish at the base',
    head: 'a white eye-ring on a finely streaked grey head',
    body: 'spangled brown-grey above; crisp dark streaks on the neck and breast and barred flanks',
    legs: 'long bright yellow legs',
  },
  wingbeatHz: 5,
  detail: {
    measurements: {
      length: 0.31, culmen: 0.056, billDepth: 0.0065, billWidth: 0.005,
      tarsus: 0.061, tibia: 0.035, toe: 0.035, wingChord: 0.188, tail: 0.077,
    },
    // traced from public/media/photos/greyel.jpg at 0.68 mm per pixel (the 56 mm bill spans 82.5 px), hip at (270, 307);
    // occiput to billBase follow an even arc from the nape, since the photo's own head turn is tighter than the
    // throat is deep and would crease the chin (species.test.ts holds every species' worst fold at 0)
    profile: [
      { label: 'rear',     x: -0.0884, y: -0.0163, up: 0.0048, down: 0.0048, halfWidth: 0.0045 },
      { label: 'rump',     x: -0.0714, y: -0.0150, up: 0.0088, down: 0.0082, halfWidth: 0.0075 },
      { label: 'tailBase', x: -0.0442, y: -0.0102, up: 0.0184, down: 0.0170, halfWidth: 0.0150 },
      { label: 'hip',      x: 0,       y: 0,       up: 0.0333, down: 0.0333, halfWidth: 0.0220 },
      { label: 'flank',    x: 0.0306,  y: 0.0082,  up: 0.0360, down: 0.0374, halfWidth: 0.0235 },
      { label: 'breast',   x: 0.0544,  y: 0.0212,  up: 0.0278, down: 0.0306, halfWidth: 0.0210 },
      { label: 'neckBase', x: 0.0694,  y: 0.0456,  up: 0.0136, down: 0.0136, halfWidth: 0.0120 },
      { label: 'neckMid',  x: 0.0755,  y: 0.0728,  up: 0.0102, down: 0.0102, halfWidth: 0.0092 },
      { label: 'nape',     x: 0.0802,  y: 0.0979,  up: 0.0102, down: 0.0102, halfWidth: 0.0092 },
      { label: 'occiput',  x: 0.0883,  y: 0.1126,  up: 0.0109, down: 0.0095, halfWidth: 0.0105 },
      { label: 'crown',    x: 0.0947,  y: 0.1173,  up: 0.0136, down: 0.0122, halfWidth: 0.0112 },
      { label: 'eye',      x: 0.1002,  y: 0.1196,  up: 0.0129, down: 0.0122, halfWidth: 0.0110 },
      { label: 'lores',    x: 0.1131,  y: 0.1204,  up: 0.0082, down: 0.0068, halfWidth: 0.0068 },
      { label: 'billBase', x: 0.1201,  y: 0.1183,  up: 0.0033, down: 0.0033, halfWidth: 0.0025 },
    ],
    rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
    bill: { taper: 1.2, curve: 0.04 },
    eye: { radius: 0.0027, t: 0.45, iris: '#2a1f18' },
    wing: {
      wrist: [0.0496, 0.0483], droop: 19.4,
      outline: [[0, 0.05], [0.16, 0.17], [0.36, 0.18], [0.55, 0.16], [0.74, 0.094], [0.93, 0.036], [1, 0.01]],
    },
    tail: { shape: 'square' },
    // juvenile, late September
    plumage: [
      // grey-brown above, white below
      { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#5f5647', side: '#8f887a', bottom: '#f4f2ed' },
      { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'breast', band: [0.7, 1] }, color: '#f5f3ee', soft: 5 },
      // paler, greyer neck and head with a whitish throat
      { kind: 'base', where: { part: 'skin', from: 'neckBase', to: 'billBase' }, top: '#6c6455', side: '#b1ab9d', bottom: '#f1efe9', soft: 6 },
      // crisp dark streaks down the neck onto the upper breast
      { kind: 'streaks', where: { part: 'skin', from: 'breast', to: 'eye', band: [0.3, 0.85] }, color: '#3e382e', length: 3.2, width: 0.9, spacing: 2.2, blur: 0.2, soft: 3 },
      // dusky bars on the flanks
      { kind: 'bars', where: { part: 'skin', from: 'tailBase', to: 'flank', band: [0.52, 0.72] }, color: '#5d574b', width: 1.0, spacing: 4, angle: 12, blur: 0.4, soft: 5, opacity: 0.6 },
      // spangled back and scapulars: dark feathers, white notches
      { kind: 'feathers', where: { part: 'skin', from: 'rear', to: 'neckBase', band: [0, 0.4] }, length: 9, width: 6, center: '#4a4236', edge: '#857d6d', edgeWidth: 0.8, notch: { color: '#f2efe6', size: 1.4, count: 4 }, soft: 3 },
      // darker crown, finely streaked white
      { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'lores', band: [0, 0.22] }, color: '#51493b', soft: 2 },
      { kind: 'streaks', where: { part: 'skin', from: 'occiput', to: 'lores', band: [0, 0.22] }, color: '#e6e2d8', length: 2.2, width: 0.5, spacing: 1.6, blur: 0.2, soft: 2 },
      // pale supraloral over dark lores, white eye-ring
      { kind: 'stripe', from: { at: 'lores', t: 0.28 }, to: { at: 'eye', t: 0.3 }, width: 1.6, color: '#efece4', blur: 0.4 },
      { kind: 'stripe', from: { at: 'billBase', t: 0.5 }, to: { at: 'eye', t: 0.45 }, width: 1.2, color: '#5a5245', blur: 0.4 },
      { kind: 'ring', at: { at: 'eye', t: 0.45 }, radius: 3.3, width: 1.0, color: '#f7f6f2', blur: 0.2 },
      // folded wing: notched coverts and tertials, dark primaries
      { kind: 'fill', where: { part: 'wingFold' }, color: '#554c3e' },
      { kind: 'feathers', where: { part: 'wingFold', s: [0, 0.64] }, length: 12, width: 8, center: '#4a4236', edge: '#8a8272', edgeWidth: 0.8, notch: { color: '#f1eee5', size: 1.6, count: 5 }, soft: 2 },
      { kind: 'fill', where: { part: 'wingFold', s: [0.64, 1] }, color: '#2e2923', soft: 4 },
      // spread wing: plain dark above, pale grey below
      { kind: 'gradient', where: { part: 'wingSpread' }, axis: 's', from: 0.5, to: 1, colorA: '#4e463a', colorB: '#2c2721' },
      { kind: 'fill', where: { part: 'wingUnder' }, color: '#b9b4aa' },
      // white tail with dark bars
      { kind: 'fill', where: { part: 'tail' }, color: '#f3f1ec' },
      { kind: 'bars', where: { part: 'tail', s: [0.25, 1] }, color: '#6a6254', width: 1.6, spacing: 5, angle: 0, blur: 0.4 },
      { kind: 'fill', where: { part: 'tailUnder' }, color: '#eeece6' },
      // dark bill with a grey base to the lower mandible
      { kind: 'fill', where: { part: 'bill' }, color: '#26231f' },
      { kind: 'gradient', where: { part: 'bill', t: [0.5, 1] }, axis: 's', from: 0.05, to: 0.45, colorA: '#7e807a', colorB: '#26231f' },
      { kind: 'fill', where: { part: 'legs' }, color: '#e3c02a' },
    ],
    variants: {},
    sources: [
      'Ridgway 1919, Bull. U.S. Natl. Mus. 50(8) p. 332 (culmen, tarsus, toe, wing, tail)',
      'Ruthrauff et al. 2023, USGS adult shorebird measurements (culmen, total head, tarsus)',
      'Tobias et al. 2022, AVONET (bill depth and width)',
      'All About Birds, Greater Yellowlegs identification (length, field marks)',
      'Bent 1927, Bull. U.S. Natl. Mus. 142 p. 325 (juvenal plumage)',
      'profile traced from public/media/photos/greyel.jpg (c) Quinten Wiegersma, CC BY',
    ],
  },
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test && npx tsc -p tsconfig.json`
Expected: all PASS. The spawn tests now build a detailed `greyel` on the far shore; Task 14 moves it to the shallows.

- [ ] **Step 5: Tune against the photo in the viewer**

1. Run `npm run dev` and open `http://localhost:5173/viewer.html#a=greyel&b=greyel&view=side&stations=1`.
2. Load `public/media/photos/greyel.jpg` as the reference photo. Set the scale so the photo's bill matches the model's, then line up the bill bases with x and y.
3. Compare the back line, the breast, the head, and the wing's lower edge. Adjust station `up`, `down`, `halfWidth`, the wing `outline`, and plumage layers; the page reloads with its state after each save.
4. Keep `npm test` green. Two tests guard the edits:
   - `every detailed species builds to its own measurements`: moving stations changes length and head, never the measured parts
   - `no detailed species creases its body`: if a head change folds the throat, spread the turn over more stations instead of tightening it
5. Check the field view at `telescope, 22 m`: the bill, eye-ring, neck streaks, and flank bars should read.
6. Take one Playwright screenshot of the side view with the photo overlaid, and one of the field view, for the task report. Screenshots stay out of git.

Expected result: the silhouette sits on the photo's outline along the back, breast, and crown within a few pixels at that scale; the head and bill proportions match; and the field view shows a streaked neck, a white eye-ring, and a faintly upturned bill with a grey base. The starting values already come close; tuning here is small.

- [ ] **Step 6: Commit**

```bash
git add src/birds/species/greyel.ts src/birds/species/species.test.ts
git commit -m "feat: Greater Yellowlegs as a field-guide plate: traced, measured, juvenile plumage"
```

---

### Task 12: Lesser Yellowlegs in the catalog (needs the user's keys)

**Files:**
- Modify: `data/species-allowlist.json`, `data/birds.json` (written by the harvest)
- Create: new files under `public/media/audio/` and `public/media/photos/` (written by the harvest)

**Interfaces:**
- Consumes: the existing harvest scripts (`harvest:allowlist`, `harvest:taxonomy`, `harvest:media`, `build:birds`), `.env` with `EBIRD_API_KEY` and `XC_API_KEY`, `data/raw/` (present locally, never committed).
- Produces: `lesyel` in `data/birds.json` with calls, a photo, and attribution; the credits screen and the call scheduler pick it up with no code change.

- [ ] **Step 1: Ask the user before going on**

This task calls eBird, xeno-canto, and iNaturalist with the user's keys and writes media into the repo. Stop and ask the user to confirm. If they would rather defer it, skip to Task 14's note on deferring; Tasks 13 and 14 need this catalog entry.

- [ ] **Step 2: Allow-list the species**

`data/species-allowlist.json` becomes:

```json
{
  "amwpel": ["wetland"],
  "leasan": ["wetland", "shoreline"],
  "wessan": ["wetland", "shoreline"],
  "greyel": ["wetland", "shoreline"],
  "lesyel": ["wetland", "shoreline"]
}
```

- [ ] **Step 3: Harvest**

```bash
npm run harvest:allowlist     # expected: "... candidates (1 added from the allow-list)"
npm run harvest:taxonomy      # one eBird taxonomy call
npm run harvest:media         # cached species print "(cached)"; lesyel downloads up to 3 clips and a photo
npm run build:birds           # probes every clip; writes data/birds.json
```

Then confirm:

```bash
node -e 'const b=require("./data/birds.json");const x=b.find(s=>s.speciesCode==="lesyel");console.log(x?x.commonName+" audio:"+x.audio.length+" photo:"+(x.photo?"y":"n")+" habitats:"+x.habitats.join(","):"MISSING")'
```

Expected: `Lesser Yellowlegs audio:3 photo:y habitats:wetland,shoreline` (the clip count may be lower). If it prints `MISSING`, stop and report to the user: without a catalog entry the location validator rejects `lesyel` in the cast.

`git status` should show only `data/species-allowlist.json`, `data/birds.json`, and new files under `public/media/`.

- [ ] **Step 4: Run and commit**

Run: `npm test`
Expected: all PASS. Nothing references `lesyel` yet.

```bash
git add data/species-allowlist.json data/birds.json public/media
git commit -m "feat: harvest the Lesser Yellowlegs: calls, photo, attribution"
```

---

### Task 13: The Lesser Yellowlegs, detailed, and the acceptance test

**Files:**
- Create: `src/birds/species/lesyel.ts`, `src/birds/species/yellowlegs.test.ts`
- Modify: `src/birds/species/index.ts`

**Interfaces:**
- Consumes: `SPEC` from `greyel.ts` (Task 11), `buildDetailedBird`, `measure` (Task 9), `paintAtlas`, `regionStats` (Task 8), `createProfile` (Task 3), the catalog entry (Task 12).
- Produces:
  - `lesyel` in `SPECIES`, as a juvenile with its own detail block
  - `yellowlegs.test.ts`, which asserts the research's published bounds (spec, "Acceptance") on the built models and their painted atlases

The Lesser's outline is the Greater's trace scaled by 0.81 in position and 0.79 in girth, with its own bill. Lesser is about a 1.2x scale-down everywhere but the bill (1.55x), and half the mass. The acceptance test holds both birds to the published ranges independently, so a later retrace can't drift out of them.

- [ ] **Step 1: Write the failing test**

`src/birds/species/yellowlegs.test.ts`:

```ts
import { parseSpeciesSpec } from '../spec'
import { SPEC as GREATER } from './greyel'
import { SPEC as LESSER } from './lesyel'
import { buildDetailedBird } from '../detail/build'
import { measure, type Measures } from '../detail/measure'
import { createProfile } from '../detail/profile'
import { paintAtlas, regionStats } from '../paint/painter'
import type { Part } from '../detail/spec'

// Bounds from docs/research/2026-09-24-yellowlegs.md, section 10 (Ridgway 1919, USGS 2023, AVONET, All About Birds).
// Millimetres; the head is total head (bill tip to the back of the head) minus the exposed culmen, as USGS measures it.

const greater = parseSpeciesSpec(GREATER), lesser = parseSpeciesSpec(LESSER)
const mm = (m: Measures): Record<keyof Measures, number> =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v * 1000])) as Record<keyof Measures, number>
const G = mm(measure(buildDetailedBird(greater)))
const L = mm(measure(buildDetailedBird(lesser)))

const within = (v: number, lo: number, hi: number) => {
  expect(v).toBeGreaterThanOrEqual(lo)
  expect(v).toBeLessThanOrEqual(hi)
}

describe('Greater and Lesser Yellowlegs: structure', () => {
  it('culmen', () => { within(G.culmen, 52, 61); within(L.culmen, 30, 41) })
  it('culmen against head: about 1.5x in Greater, a little over 1x in Lesser', () => {
    within(G.culmen / G.head, 1.35, 1.7)
    within(L.culmen / L.head, 1.0, 1.35)
    expect(G.culmen / G.head - L.culmen / L.head).toBeGreaterThanOrEqual(0.2)
  })
  it('culmen against tarsus: "nearly as long" in Greater, "decidedly shorter" in Lesser', () => {
    within(G.culmen / G.tarsus, 0.82, 1.02)
    within(L.culmen / L.tarsus, 0.62, 0.8)
  })
  it('bill depth at the base', () => { within(G.billDepth, 5.5, 7.0); within(L.billDepth, 3.6, 4.6) })
  it("Greater's bill turns up, at most one base depth; Lesser's is straight", () => {
    expect(G.billTipRise).toBeGreaterThan(0)
    expect(G.billTipRise).toBeLessThanOrEqual(G.billDepth)
    expect(Math.abs(L.billTipRise)).toBeLessThan(1)
  })
  it('tarsus', () => { within(G.tarsus, 55, 68); within(L.tarsus, 45.5, 59) })
  it('bare tibia (a sanity bound only)', () => { within(G.tibia, 30, 40); within(L.tibia, 25, 33) })
  it('wing chord', () => { within(G.wingChord, 180, 205); within(L.wingChord, 147, 170) })
  it('tail', () => { within(G.tail, 71, 83); within(L.tail, 55, 67) })
  it('total length', () => { within(G.length, 290, 330); within(L.length, 230, 270) })
  it('wingtips reach just past the tail, a little further in Lesser', () => {
    within(G.projection, 0, 20)
    within(L.projection, 0, 20)
    expect(L.projection / L.wingChord).toBeGreaterThanOrEqual(G.projection / G.wingChord)
  })
  it('Greater is about 1.2x Lesser, but its bill about 1.55x', () => {
    within(G.wingChord / L.wingChord, 1.17, 1.28)
    within(G.culmen / L.culmen, 1.45, 1.65)
  })
})

describe('Greater and Lesser Yellowlegs: plumage', () => {
  const paint = (spec: typeof greater) => {
    const d = spec.detail!
    const profile = createProfile(d.profile)
    const px = paintAtlas({ code: spec.code, detail: d, layers: d.plumage, profile })
    const skin = (from: string, to: string, t: [number, number]) => regionStats(px, 'skin', [profile.uOf(from), profile.uOf(to)], t)
    const part = (p: Part, s: [number, number], t: [number, number]) => regionStats(px, p, s, t)
    return { skin, part }
  }
  const g = paint(greater), l = paint(lesser)

  it("Greater's bill is paler at the base than the tip; Lesser's is dark throughout", () => {
    expect(g.part('bill', [0, 0.15], [0, 1]).mean).toBeGreaterThan(g.part('bill', [0.85, 1], [0, 1]).mean + 0.05)
    expect(Math.abs(l.part('bill', [0, 0.15], [0, 1]).mean - l.part('bill', [0.85, 1], [0, 1]).mean)).toBeLessThan(0.02)
  })
  it('Greater has barred flanks, Lesser plain ones', () => {
    // bars run across the body, so they show as change along the spine (s)
    const gf = g.skin('tailBase', 'flank', [0.55, 0.7]).roughS
    const lf = l.skin('tailBase', 'flank', [0.55, 0.7]).roughS
    expect(gf).toBeGreaterThan(3 * lf)
    expect(lf).toBeLessThan(0.01)
  })
  it("Greater's neck streaks are bolder than Lesser's", () => {
    // streaks run along the neck, so they show as change around it (t)
    expect(g.skin('neckBase', 'nape', [0.35, 0.75]).roughT).toBeGreaterThan(1.5 * l.skin('neckBase', 'nape', [0.35, 0.75]).roughT)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/birds/species/yellowlegs.test.ts`
Expected: FAIL, `Cannot find module './lesyel'`.

- [ ] **Step 3: The species file and the index**

`src/birds/species/lesyel.ts`:

```ts
import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'lesyel',
  commonName: 'Lesser Yellowlegs',
  length: 0.25,
  body: { length: 1, height: 0.48, width: 0.4 },
  neck: { length: 0.32, thickness: 0.11, angle: 65 },
  head: { size: 0.25 },
  bill: { length: 0.28, thickness: 0.045, shape: 'pointed' },
  legs: { length: 0.78, thickness: 0.022 },
  tail: { length: 0.12, angle: 0 },
  wing: { length: 0.62, width: 0.27 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#5e574a', cheek: '#aaa497', throat: '#f2f0ea', breast: '#d2ccbf', flank: '#f0ede5',
    back: '#655f50', wing: '#6e6758', speculum: null, rump: '#f2f0ea', tail: '#c8c2b2',
    bill: '#222020', legs: '#e8c22a', eye: '#111111',
  },
  variants: {},
  marks: {
    size: 'a slim, dainty shorebird, clearly smaller when it stands beside a Greater Yellowlegs',
    bill: 'a thin, straight, all-dark bill only a little longer than the head',
    head: 'a white eye-ring on a small head with a slightly capped look',
    body: 'finely spotted brown-grey above; fine, blurry streaks on the breast and plain white flanks',
    legs: 'long bright yellow legs, long for its size',
  },
  wingbeatHz: 6,
  detail: {
    measurements: {
      length: 0.25, culmen: 0.036, billDepth: 0.0043, billWidth: 0.003,
      tarsus: 0.051, tibia: 0.029, toe: 0.029, wingChord: 0.155, tail: 0.063,
    },
    // the Greater's traced outline at 0.81 (positions) and 0.79 (girth): Lesser is about a 1.2x scale-down
    // everywhere but the bill, and half the mass
    profile: [
      { label: 'rear',     x: -0.0716, y: -0.0132, up: 0.0038, down: 0.0038, halfWidth: 0.0036 },
      { label: 'rump',     x: -0.0578, y: -0.0122, up: 0.0070, down: 0.0065, halfWidth: 0.0059 },
      { label: 'tailBase', x: -0.0358, y: -0.0083, up: 0.0145, down: 0.0134, halfWidth: 0.0118 },
      { label: 'hip',      x: 0,       y: 0,       up: 0.0263, down: 0.0263, halfWidth: 0.0174 },
      { label: 'flank',    x: 0.0248, y: 0.0066, up: 0.0284, down: 0.0295, halfWidth: 0.0186 },
      { label: 'breast',   x: 0.0441, y: 0.0172, up: 0.0220, down: 0.0242, halfWidth: 0.0166 },
      { label: 'neckBase', x: 0.0562, y: 0.0369, up: 0.0107, down: 0.0107, halfWidth: 0.0095 },
      { label: 'neckMid',  x: 0.0612, y: 0.0590, up: 0.0081, down: 0.0081, halfWidth: 0.0073 },
      { label: 'nape',     x: 0.0650, y: 0.0793, up: 0.0081, down: 0.0081, halfWidth: 0.0073 },
      { label: 'occiput',  x: 0.0715, y: 0.0912, up: 0.0086, down: 0.0075, halfWidth: 0.0083 },
      { label: 'crown',    x: 0.0767, y: 0.0950, up: 0.0107, down: 0.0096, halfWidth: 0.0088 },
      { label: 'eye',      x: 0.0812, y: 0.0969, up: 0.0102, down: 0.0096, halfWidth: 0.0087 },
      { label: 'lores',    x: 0.0916, y: 0.0975, up: 0.0065, down: 0.0054, halfWidth: 0.0054 },
      { label: 'billBase', x: 0.0973, y: 0.0958, up: 0.0022, down: 0.0022, halfWidth: 0.0015 },
    ],
    rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
    bill: { taper: 0.9, curve: 0 },
    eye: { radius: 0.0023, t: 0.45, iris: '#2a1f18' },
    wing: {
      wrist: [0.0372, 0.0391], droop: 19.4,
      outline: [[0, 0.05], [0.16, 0.17], [0.36, 0.18], [0.55, 0.16], [0.74, 0.094], [0.93, 0.036], [1, 0.01]],
    },
    tail: { shape: 'square' },
    // juvenile, late September
    plumage: [
      { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#5c5546', side: '#958e80', bottom: '#f4f2ed' },
      { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'breast', band: [0.7, 1] }, color: '#f5f3ee', soft: 5 },
      { kind: 'base', where: { part: 'skin', from: 'neckBase', to: 'billBase' }, top: '#665f51', side: '#b7b1a4', bottom: '#f1efe9', soft: 6 },
      // a soft grey-brown wash on the breast, with fine, pale, blurry streaks
      { kind: 'fill', where: { part: 'skin', from: 'breast', to: 'neckMid', band: [0.4, 0.7] }, color: '#c9c3b6', soft: 5, opacity: 0.5 },
      { kind: 'streaks', where: { part: 'skin', from: 'breast', to: 'eye', band: [0.3, 0.8] }, color: '#80796b', length: 2.4, width: 0.6, spacing: 2.0, blur: 0.8, soft: 3, opacity: 0.6 },
      // finer, more regular spangling above
      { kind: 'feathers', where: { part: 'skin', from: 'rear', to: 'neckBase', band: [0, 0.4] }, length: 7, width: 5, center: '#4a4236', edge: '#857d6d', edgeWidth: 0.6, notch: { color: '#efe8da', size: 1.0, count: 5 }, soft: 3 },
      // a slightly darker cap, finely streaked
      { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'lores', band: [0, 0.26] }, color: '#4a4336', soft: 2 },
      { kind: 'streaks', where: { part: 'skin', from: 'occiput', to: 'lores', band: [0, 0.26] }, color: '#dcd7cc', length: 1.8, width: 0.4, spacing: 1.4, blur: 0.2, soft: 2, opacity: 0.8 },
      { kind: 'stripe', from: { at: 'lores', t: 0.28 }, to: { at: 'eye', t: 0.3 }, width: 1.3, color: '#efece4', blur: 0.4 },
      { kind: 'stripe', from: { at: 'billBase', t: 0.5 }, to: { at: 'eye', t: 0.45 }, width: 1.0, color: '#5a5245', blur: 0.4 },
      { kind: 'ring', at: { at: 'eye', t: 0.45 }, radius: 2.9, width: 0.9, color: '#f7f6f2', blur: 0.2 },
      { kind: 'fill', where: { part: 'wingFold' }, color: '#554c3e' },
      { kind: 'feathers', where: { part: 'wingFold', s: [0, 0.64] }, length: 9, width: 6.5, center: '#4a4236', edge: '#8a8272', edgeWidth: 0.6, notch: { color: '#eee8dc', size: 1.1, count: 6 }, soft: 2 },
      { kind: 'fill', where: { part: 'wingFold', s: [0.64, 1] }, color: '#2e2923', soft: 4 },
      { kind: 'gradient', where: { part: 'wingSpread' }, axis: 's', from: 0.5, to: 1, colorA: '#4e463a', colorB: '#2c2721' },
      { kind: 'fill', where: { part: 'wingUnder' }, color: '#b9b4aa' },
      { kind: 'fill', where: { part: 'tail' }, color: '#f3f1ec' },
      { kind: 'bars', where: { part: 'tail', s: [0.25, 1] }, color: '#6a6254', width: 1.3, spacing: 4, angle: 0, blur: 0.4 },
      { kind: 'fill', where: { part: 'tailUnder' }, color: '#eeece6' },
      // all-dark bill
      { kind: 'fill', where: { part: 'bill' }, color: '#221f1c' },
      { kind: 'fill', where: { part: 'legs' }, color: '#e6c22c' },
    ],
    variants: {},
    sources: [
      'Ridgway 1919, Bull. U.S. Natl. Mus. 50(8) p. 338 (culmen, tarsus, toe, wing, tail)',
      'Ruthrauff et al. 2023, USGS adult shorebird measurements (culmen, total head, tarsus)',
      'Tobias et al. 2022, AVONET (bill depth and width)',
      'All About Birds, Lesser Yellowlegs identification (length, field marks)',
      'Bent 1927, Bull. U.S. Natl. Mus. 142 p. 339 (juvenal plumage)',
      'outline scaled from the Greater Yellowlegs trace; retrace from the harvested lesyel photo',
    ],
  },
}
```

In `src/birds/species/index.ts`, add `import { SPEC as lesyel } from './lesyel'` after the `greyel` import, and append `lesyel` to the end of the `ALL` array (after `greyel`).

- [ ] **Step 4: Run the tests**

Run: `npm test && npx tsc -p tsconfig.json`
Expected: all PASS. `species.test.ts` now also checks that `lesyel` is in the catalog under the name "Lesser Yellowlegs", builds to its measurements, and doesn't crease.

- [ ] **Step 5: Retrace from the harvested photo, if it allows**

Read `public/media/photos/lesyel.jpg`. It is only useful if it shows a standing Lesser in side view. If it does:
1. Open `viewer.html#a=lesyel&b=greyel&view=side&stations=1` and load the photo.
2. Calibrate on the bill (36 mm).
3. Adjust the outline as in Task 11, Step 5, keeping `yellowlegs.test.ts` and `species.test.ts` green.
4. Update the `sources` line that says "retrace from the harvested lesyel photo" to name the photo and its attribution from `data/birds.json`.

If the photo is not side-on, keep the scaled outline and say so in the task report.

Then check the pair: open `viewer.html#a=greyel&b=lesyel&field=scope22&water=1`. Expected: at 22 m through the telescope, the Greater is plainly bigger, with a longer, faintly upturned, grey-based bill against a relatively smaller head, crisp neck streaks, and barred flanks. The Lesser is slimmer, with a short straight dark bill, a plainer blurred neck, and plain flanks. Take a Playwright screenshot for the task report.

- [ ] **Step 6: Commit**

```bash
git add src/birds/species/lesyel.ts src/birds/species/index.ts src/birds/species/yellowlegs.test.ts
git commit -m "feat: Lesser Yellowlegs, detailed; the Greater-vs-Lesser differences as tests"
```

---

### Task 14: The shallows

**Files:**
- Modify: `data/locations/lake.json`, `src/location/zoneTerrain.test.ts`

**Interfaces:**
- Consumes: `loadLocation`, `lakeHeightfield(7)`, `samplePolygon` (already in `zoneTerrain.test.ts`), the zone and cast schema.
- Produces:
  - a convex `shallows` zone, ankle-deep (ground from +0.05 to -0.13 m against water at 0), about 22 m from the vantage
  - 2 Greaters and 1 Lesser wading there
  - the old `far-shore` Greater entry removed

The field guide and identification list species from the cast, so `lesyel` appears there with no code change.

- [ ] **Step 1: Write the failing test**

In `src/location/zoneTerrain.test.ts`, insert before `it('the reeds zone matches the rendered reed bed bounds', () => {`:

```ts
  it('keeps the shallows ankle-deep, so the yellowlegs stand in water, not on it or under it', () => {
    const shallows = loc.zones['shallows']
    expect(shallows?.kind).toBe('polygon')
    if (shallows?.kind !== 'polygon') return
    for (const [x, z] of samplePolygon(shallows.points)) {
      const y = heightfield.sample(x, z)
      expect(y).toBeGreaterThanOrEqual(-0.15)
      expect(y).toBeLessThanOrEqual(0.08)
    }
  })

```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/location/zoneTerrain.test.ts`
Expected: FAIL, `expected undefined to be 'polygon'`.

- [ ] **Step 3: The zone and the cast**

In `data/locations/lake.json`, after the `"mudflat"` zone line, add:

```json
    "shallows":   { "kind": "polygon", "points": [[17, -9.5], [24, -9.5], [24, -10.6], [17, -10.6]] },
```

and in `cast` replace

```json
    { "species": "greyel",  "behavior": "wade",    "zone": "far-shore", "count": 1 },
```

with

```json
    { "species": "greyel",  "behavior": "wade",    "zone": "shallows",  "count": 2 },
    { "species": "lesyel",  "behavior": "wade",    "zone": "shallows",  "count": 1 },
```

Greater is the expected yellowlegs in the valley in fall and Lesser the scarcer one: the Willamette Valley checklist rates them "regularly" and "occasionally" detected, and iNaturalist has 115 records to 15 for 10–30 September.

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: all PASS. The run includes the location validator (convex zone, `lesyel` in the catalog with the `wetland` habitat), the zone-terrain checks for `wade` and the new ankle-depth test, and the spawn tests.

- [ ] **Step 5: See it in the game**

1. Run `npm run dev`, open `http://localhost:5173/`, click Begin, and open the dev overlay with the backtick key. It should list `atlases 2`, each painted in around 100–200 ms.
2. Turn right toward the mudflat, and raise the telescope (T) on the shallows just beyond it.
3. Expected: three yellowlegs wading, their legs stepping with no foot sliding, their feet under the waterline. The console shows no errors.

- [ ] **Step 6: Commit**

```bash
git add data/locations/lake.json src/location/zoneTerrain.test.ts
git commit -m "feat: the shallows: two Greater and a Lesser Yellowlegs wade past the mudflat"
```

**Deferring the harvest:** if the user deferred Task 12, do this task with only the `greyel` cast change and the zone, and leave `lesyel` out of the cast. Leave Task 13 undone and report it as waiting on the harvest.

---

### Task 15: The main spec, the README, performance, and the telescope check

**Files:**
- Modify: `docs/superpowers/specs/2026-09-22-lakewatch-design.md`, `README.md`

**Interfaces:**
- Consumes: the finished feature.
- Produces: the main spec and README describing what now exists; a measured frame rate; the user's own check at the telescope.

- [ ] **Step 1: Amend the main spec**

In `docs/superpowers/specs/2026-09-22-lakewatch-design.md`:

In the "Decisions already made" table, replace the "Bird models" row's choice with:
`Procedural geometry in code: block specs first, then a detailed builder (traced profile, measurements, painted field marks) species by species; GLTF behind the same interface remains possible`.

Replace the art-direction paragraph

```
Accurate proportions, silhouettes, and plumage blocks, simplified forms, no
photo textures. Colors are hand-picked palettes applied per part. Physically
based lighting with a warm-cool grade, soft shadows, light fog for depth.
The test for every asset: a birder recognizes the species from shape and
color blocks alone.
```

with

```
Accurate proportions, silhouettes, and field marks, simplified forms, no
photo textures. Birds are field-guide plates: structure traced and measured,
field marks painted from data. Physically based lighting with a warm-cool
grade, soft shadows, light fog for depth. The test for every asset: a
birder recognizes the species from shape and field marks; for birds, the
bar is telling a Greater Yellowlegs from a Lesser.
```

In the `PoseState` block under "The BirdModel seam", add two lines after `lean`:

```
  strideDistance: number; // metres walked; the model maps it to a stride
  gait: number;           // 0 standing .. 1 walking
```

Replace `Two implementations:` with `Three implementations:`, and add a bullet after **Procedural**:

```
- **Detailed**: `buildDetailedBird(spec, variant?)` for species with a
  `detail` block: one skinned mesh lofted from a traced side profile, built
  to published measurements, with jointed legs and a painted atlas of field
  marks. See `2026-09-24-detailed-birds-design.md`.
```

- [ ] **Step 2: README**

In `README.md`, replace

```
`src/birds/species/*.ts` are the procedural bird models.
```

with

```
`src/birds/species/*.ts` are the bird models: block specs for most species,
and for converted ones a `detail` block (traced profile, measurements,
field-mark layers) that the detailed builder turns into a skinned, painted
bird. `npm run dev`, then `/viewer.html`, opens the model viewer: any two
species at true scale, through the game's optics, over a reference photo.
```

- [ ] **Step 3: Performance**

1. Run `npm run build && npx vite preview`, open the game (Playwright is fine), click Begin, and open the dev overlay (backtick).
2. Record the `atlases` line. Expected: `atlases 2: ~100-200 ms each, ~2.7 MB`.
3. Headless frame rates say nothing about the user's integrated GPU, so the frame-rate check goes to the user in Step 6.

- [ ] **Step 4: Full build**

Run: `npm run build`
Expected: typecheck, every test, and the Vite build pass, and `dist/` has no `viewer.html`.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-09-22-lakewatch-design.md README.md
git commit -m "docs: the detailed builder in the design spec and README"
```

- [ ] **Step 6: Hand the telescope to the user**

The spec's last check can't be automated: whether a birder can tell the two apart in the game. Ask the user to:
1. run `npm run dev`
2. click Begin and open the dev overlay
3. read the frame rate with the naked eye and with the telescope on the shallows (acceptance: 60 fps on their integrated GPU)
4. say whether they can tell the Lesser from the Greaters, and by what

If the frame rate falls short, compare against the commit before Task 1: `git worktree add ../lakewatch-before <sha>`, then `npm install && npm run dev -- --port 5174` there. Report the two numbers without tuning blindly, and remove the worktree afterwards with `git worktree remove ../lakewatch-before`.

Whatever the user says about the birds is the acceptance result. Record it in the final report together with the screenshots from Tasks 11 and 13.
