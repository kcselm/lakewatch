# Dowitcher and Pectoral Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Long-billed Dowitcher flock that stands belly-deep on an underwater bench past the yellowlegs and stitches, and two Pectoral Sandpipers feeding among the Least Sandpipers. Both are detailed birds on the existing pipeline, harvested into the catalog, and checked at 22–25 m through the game's optics.

**Architecture:** `probe` gains a third foraging style, `dowitcher`: stitch on the spot, creep a step or two, look up, and follow a flock whose target drifts a short way at a time. Every move is made by turning on the spot and then going straight, so the bird never needs the zone clamp. The detailed builder's reach gains a per-species `probeDepth`: the existing solvers work in a frame raised by it, so the bill goes into the mud. The heightfield gains a flat underwater bench lined up with the terrain mesh's 2 m grid, with a new `bench` zone on it. Zone tests move onto the rendered terrain. Rings on the water gain a size, so a bill going in makes a small, short ring rather than a duck's wake. Each bird is a new species file with a traced `detail` block.

**Tech Stack:** Vite 8, TypeScript 7, Vitest 5 (`environment: 'node'`), Three.js 0.186, zod 4.

**Spec:** `docs/superpowers/specs/2026-09-25-dowitcher-pectoral-design.md` (read it first, including its "Amended during planning" section). Every number and mark for the two birds comes from `docs/research/2026-09-25-long-billed-dowitcher-pectoral-sandpiper.md`. The detailed builder is in `docs/superpowers/specs/2026-09-24-detailed-birds-design.md`, and the foraging styles and peck reach are in `docs/superpowers/specs/2026-09-25-mudflat-birds-design.md` and `docs/superpowers/plans/2026-09-25-mudflat-birds.md`.

**How this plan was checked:**
- Every code block below ran in a scratch worktree of commit `67b95ba` before the plan was written, and the tasks were then replayed in order in a fresh worktree, with `npm test` green at every commit.
- The final state:
  - 602 tests passed (549 before).
  - `tsc` was clean.
  - `vite build` was clean and left the viewer out of `dist/`.
- The birds were checked three ways:
  - Traced onto their reference photos with a mesh overlay.
  - In the viewer's field view at 22 m, the dowitcher at rest and in its stitch pose over 4.5 cm of water.
  - In the production game through binoculars and telescope, with the flock stitching on the bench and small rings under the bills.
- The harvest was not run in the scratch copy. It used stand-in catalog entries for `lobdow` and `pecsan` (no audio, no photo), the way the Lesser Yellowlegs round did. Task 6 runs the real harvest.
- If a step's output differs from what the plan says, stop and find out why rather than adjusting the test.

**Decisions made while planning (not in the spec, or refining it):**

- **An underwater bench, not a thin strip.** The research set the dowitcher's water at 3.5–5.5 cm.
  - On the existing terrain that band is only 8–10 cm wide, and a convex strip for 3–7 cm is only 20–26 cm wide. Six birds with no spacing logic would walk through each other.
  - The user chose the spec's fallback: a flat shelf at −4.5 cm blended into the heightfield over x 18–26, z −14 to −12.
  - Its edges sit on the terrain mesh's 2 m grid (even coordinates), so its top covers whole cells and renders flat.
  - The `bench` zone on it is 7 m × 2.1 m, about 25 m from the vantage. Every existing zone still passes. The shallows are not trimmed.
- **Zones must be convex, and a dowitcher turns before it moves.**
  - `validateCast` requires convex polygons, because `clampToPolygon` walks toward the centroid in 5% steps.
  - In a narrow zone, a bird curving round while walking clips the edge, and the clamp jumps it up to 7 cm in a frame. That happened 33 times over 60 seeds of 300 s.
  - Turning on the spot first, then going straight (a straight line between two points in a convex zone stays inside), it happened zero times.
- **Dowitcher pacing** (research section 11; most values are estimates from short videos):
  - Stitch: 3 strokes a second.
  - The research's 4–14 s "bouts" are head-down time between looks, with creeping inside them. The model splits them into stitches of 2–5 s on the spot and creeps of 3–10 cm at 2.5 cm/s with the bill still working. A look (1.5–3.5 s, head up) follows 40% of stitches.
  - Measured over 3,600 simulated seconds on a bench-sized zone: head-down stretches between looks had a median of 8.6 s (10th percentile 2.9 s, 90th 25 s). Time shares were stitch 56%, creep 20%, look 17%, follow 7%. That puts 76% feeding against Davis & Smith's 77%.
- **The flock drifts.** Retargeting anywhere in the zone every 45 s had the birds walking head-up a quarter of the time.
  - The dowitcher's flock target instead moves at most 1.2 m every 45 s, after Burton's "concentrate on a small area for about 30 seconds, … then walk on more briskly for a few seconds".
  - A bird follows, head up at 0.12 m/s, when more than 1.5 m from the target.
  - The flock radius is 1 m, which gives the research's 0.3–0.5 m nearest-neighbour spacing for six birds.
  - The sandpiper's flock is unchanged.
- **The stitch pose.** The model has no crouch, so a dowitcher's head reaches the mud only with the body tipped well forward.
  - At lean 0.8 and neck 1, the bill tip rests on the mud at `reach` 0 and goes 27 mm in at `reach` 1. That is a 26 mm stroke (the research's video gives about 30).
  - So the stroke runs `reach` 0 → 1, and `probeDepth` is 0.027 m, inside the research's 22–45 mm range.
  - The research's 35 mm would need a lean that buries the bill even at `reach` 0.
- **`probeDepth` is done in the builder by raising the solvers' frame.** `reachDown` passes the neck base, head, and tip to `neckSwing` and `headPitchToGround` raised by `probeDepth`, so their "meet y = 0" aims that far below the ground. `reach.ts` does not change.
- **Rings on the water come in sizes.**
  - The ring buffer holds 32 rings, shared with 23 swimmers.
  - Duck-sized rings every half second from six dowitchers flooded the bench with metre-wide white bands, and would have pushed the ducks' wakes out of the buffer.
  - A ring's `size` (default 1) now scales its speed, life, width, and brightness. A dowitcher's bill makes a `size` 0.4 ring (about 0.4 m across, gone in a second), at most once a second per bird.
- **The sandpiper's peck leans 0.4, not 0.3.**
  - At 0.3 the Pectoral's bill stops 3.6 mm above the mud; its legs are longer for its reach.
  - The Least still lands exactly on the ground: the head lifts its bill back up when a lean would push it under.
- **Zone tests sample the rendered terrain** (`terrainSurface`), which the birds stand on. The smooth field differs by centimetres across a 2 m cell. The sampling step scales with the zone's narrow side, so a thin zone gets at least five samples across.
- **Three new standing measures** feed the depth-band test: the intertarsal joint's height, the belly's lowest point (the lowest loft vertex, which a hunched bird carries forward of its hips), and the folded wing's lowest point.
- **The Pectoral trace** (ADJ82's photo, 0.090 mm/px) fits the photo's outline. Two things differ:
  - Its bill points 27.5° down against the photo's 32°. A steeper tip needs a tighter turn at the head, which creases the throat.
  - The eye lands within 1 mm of the photo's.
- **The dowitcher trace** (Leighton's photo, 0.145 mm/px, a fluffed February bird) needed more work:
  - The pale face and breast match the grey water, so the silhouette was read by hand.
  - The head rests on the breast, so the head's depth below the spine was read off the throat line.
  - The back is trimmed 10% for a sleeker September bird.
  - The neck's spine runs straight at 40° to avoid creases, and a search for the steepest crease-free bill found 22.5° (the photos give 26–37°).
  - The head's rear was slimmed so the head measures 34.9 mm (culmen/head 1.89; the USGS skull-level mean is 2.30).
  - The eye lands within 0.5 mm of the photo's.
- **The dowitcher's folded wing runs the length of its body.**
  - Its wing chord (143 mm) equals its bill-base-to-tail-tip length (144 mm), so the wrist sits at the front of the breast, under the head.
  - Tail past the wingtip: 6.0 mm (the photos give +4 to +8).
  - The builder lays a folded wing's front on the body sample nearest in x, which on a hunched bird is the wrong section. The front of the wing stood off the breast as a flap.
  - A better surface lookup was tried and reverted, because it moved the shipped birds' wings by up to 6.7 mm. Instead the dowitcher's wing outline makes its front third a 1.5 mm sliver, painted breast-grey, as breast feathers cover the bend of the wing.
- **Bill taper 1.7 for the dowitcher.** The builder's taper is `1 − 0.85 σ^taper`, so a *higher* taper keeps the bill deep longer. The research's measured depths (7.1 mm at the base, 3.8 at 70% of the length) fit 1.7. Its "low taper" wording misread the formula.
- **Research corrections kept:**
  - Pectoral legs dull olive-yellow, not ochre.
  - Dowitcher tertials have "duller to no" internal marks, painted plain.
  - The spec's shallow-end wording becomes "no bare tarsus shows".
- **Performance**, production build against production build on the same machine (headless Chromium, three runs each):
  - Baseline: 4 atlases at 230–242 ms each, 5.3 MB.
  - With the new birds: 6 atlases at 208–213 ms each, 8.0 MB.
  - Per-atlas paint time is unchanged. Painting under the title card grows by about a third of a second.
  - The last round's 70 ms per atlas was measured on a faster setup. Headless frame rates say nothing about the user's GPU.
- **Found, not fixed:**
  - Birds still don't avoid each other; two dowitchers can overlap now and then.
  - The wing sliver shows as a faint line on the breast in close-ups.
  - The dowitcher at rest stands a little more upright than the photo, because of the straightened neck.

## Global Constraints

- **Frame rate:** 60 fps on an integrated GPU in Chrome, with every bird on screen. A detailed bird is one draw call (plus its shadow pass) and about 6k triangles. The dev overlay shows each atlas's paint time.
- **Art direction:** field-guide plate. Exact structure and painted field marks, no photo textures on any mesh. Patterns come from data (`detail.plumage`).
- **Interfaces:**
  - The `BirdModel` interface and `PoseState` do not change.
  - `BehaviorContext.onRipple` gains an optional third argument, `size`.
  - `RippleBuffer.spawn` gains an optional `size`, default 1.
  - Swimming and hovering birds keep `size` 1.
- **Units:** every size in `detail.measurements`, `detail.profile`, `detail.eye`, `detail.wing.wrist`, and `detail.probeDepth` is in metres. Every pattern size in a layer (`width`, `radius`, `dx`, `length`, `spacing`, `size`) is in millimetres on the bird.
- **Validation:** species specs are validated when the module loads, so a bad `foraging` or `detail` block fails `npm test` and `npm run build`. A detailed species never falls back to blocks at runtime.
- **Zones:** zones are convex polygons (`validateCast`). Zone tests sample `terrainSurface`, not the smooth heightfield.
- **Reference photos:** tracing photos are downloaded outside the repo and never committed. Each species' `sources` credits its photographer and licence.
- **Harvest:** only Task 6 calls the network. It needs the user's `EBIRD_API_KEY` and `XC_API_KEY` in `.env`. Ask the user before running it.
- **Tests:** Vitest runs in `environment: 'node'`: no DOM, no WebGL. Rendering is checked by eye in the viewer and the game, with Playwright screenshots where a step asks for them.
- **Commits:** every commit leaves `npm test` green. Never commit `node_modules`, `.env`, `dist`, `data/raw`, `.wrangler`, or `.playwright-mcp`.

## Review Focus

Inputs the spec implies but no task's own tests would otherwise exercise, each pinned to a test in the owning task:

1. **A dowitcher turning near the edge of a narrow zone.** The zone clamp must never jump it. Each frame it moves no further than its pace (Task 3, `probe.test.ts` "never leans on the zone clamp in a strip 0.3 m wide", 20 seeds × 300 s; it fails if the bird walks while turning).
2. **Many birds ringing the water at once.** A bill's ring must be small and short-lived, so six dowitchers don't crowd the swimmers' wakes out of the 32-ring buffer. A swimmer's ring must be unchanged (Task 1, `ripples.test.ts` "keeps a small ring … for its share of a full ring life" and "packs … with age and size"; Task 3, the ripple test checks the ring's size).
3. **A hand-kept viewer link from before the slider**, such as `#water=1`. It must show the old 3 cm plane, not 10 cm (Task 4, `state.test.ts` "reads the water as a depth in metres").
4. **A species with no `probeDepth`, or 0.** Its pecks must be exactly what they were (Task 2, `build.test.ts` "takes probeDepth 0 to mean the ground itself").
5. **The terrain mesh's grid moving** (a change to `SIZE`, `SEGMENTS`, or `Z_SHIFT` in `terrain.ts`). The bench would stop rendering flat and the flock would stand on a slope or in deep water (Task 5, `terrain.test.ts` "renders the dowitcher bench flat").

---

### Task 1: Rings on the water come in sizes

**Files:**
- Modify: `src/world/ripples.ts`, `src/world/ripples.test.ts`, `src/world/water.ts`, `src/behavior/types.ts`, `src/birds/spawn.ts`

**Interfaces:**
- Consumes: the existing `RippleBuffer`, `createWater`, `BehaviorContext`, `spawnCast`.
- Produces:

```ts
// src/world/ripples.ts
/** a ring on the water; `size` (0..1) scales how far it spreads, how long it lasts, and how bright it is */
export interface Ripple { x: number; z: number; age: number; size: number }
RippleBuffer.spawn(x: number, z: number, size = 1): void   // a ring lives RIPPLE_LIFE * size seconds
// pack(): slot 3 of each ring is its size (1 for an empty slot)

// src/behavior/types.ts, BehaviorContext:
/** a ring on the water at (x, z); `size` (0..1, default 1) for a smaller ring than a swimming bird's */
onRipple?: (x: number, z: number, size?: number) => void
```

- [ ] **Step 1: Write the failing tests**

In `src/world/ripples.test.ts`, replace the test `'packs into a float array with age and padding'` with:

```ts
  it('packs into a float array with age and size', () => {
    const r = new RippleBuffer(2)
    r.spawn(3, 4)
    const out = new Float32Array(8)
    r.pack(out)
    expect(Array.from(out.slice(0, 4))).toEqual([3, 4, 0, 1])
    expect(out[6]).toBe(99)   // empty slot age sentinel: never rendered
  })
  it('keeps a small ring, a bill going into the water, for its share of a full ring life', () => {
    const r = new RippleBuffer(4)
    r.spawn(0, 0, 0.4)
    r.spawn(1, 1)
    r.update(0.9)
    expect(r.rings.map(x => x.size)).toEqual([0.4, 1])
    r.update(0.2)                                    // 1.1 s: past the small ring's 0.4 x 2.5 s
    expect(r.rings.map(x => x.size)).toEqual([1])
    const out = new Float32Array(16)
    r.spawn(2, 2, 0.4)
    r.pack(out)
    expect(out[7]).toBeCloseTo(0.4, 6)
  })
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run src/world/ripples.test.ts`
Expected: the two tests above fail (slot 3 is 0; `size` is undefined).

- [ ] **Step 3: Give rings a size**

In `src/world/ripples.ts`, replace

```ts
export interface Ripple { x: number; z: number; age: number }
```

with

```ts
/** a ring on the water; `size` (0..1) scales how far it spreads, how long it lasts, and how bright it is */
export interface Ripple { x: number; z: number; age: number; size: number }
```

Then make these three replacements:
- `spawn(x: number, z: number): void {` → `spawn(x: number, z: number, size = 1): void {`
- `this.list.push({ x, z, age: 0 })` → `this.list.push({ x, z, age: 0, size })`
- `this.list = this.list.filter(r => r.age < RIPPLE_LIFE)` → `this.list = this.list.filter(r => r.age < RIPPLE_LIFE * r.size)`

In `pack`, replace `target[i * 4 + 3] = 0` with `target[i * 4 + 3] = r?.size ?? 1`.

In `src/world/water.ts`, in the fragment shader's ring loop, replace

```glsl
    if (r.z > ${RIPPLE_LIFE.toFixed(1)}) continue;
    float d = distance(p, r.xy);
    float radius = r.z * 1.1;
    float fade = 1.0 - r.z / ${RIPPLE_LIFE.toFixed(1)};
    ring += smoothstep(0.12, 0.0, abs(d - radius)) * fade * 0.6;
```

with

```glsl
    // w is the ring's size: a small one (a bill going in) spreads slower, fades sooner, and is fainter
    float life = ${RIPPLE_LIFE.toFixed(1)} * r.w;
    if (r.z > life) continue;
    float d = distance(p, r.xy);
    float radius = r.z * 1.1 * r.w;
    float fade = 1.0 - r.z / life;
    ring += smoothstep(0.12 * r.w, 0.0, abs(d - radius)) * fade * 0.6 * r.w;
```

In `createWater`, make these two replacements:
- `new THREE.Vector4(0, 0, 99, 0)` → `new THREE.Vector4(0, 0, 99, 1)`
- `rippleUniform[i]!.set(packed[i * 4]!, packed[i * 4 + 1]!, packed[i * 4 + 2]!, 0)` → `rippleUniform[i]!.set(packed[i * 4]!, packed[i * 4 + 1]!, packed[i * 4 + 2]!, packed[i * 4 + 3]!)`

In `src/behavior/types.ts`, replace

```ts
  onRipple?: (x: number, z: number) => void
```

with

```ts
  /** a ring on the water at (x, z); `size` (0..1, default 1) for a smaller ring than a swimming bird's */
  onRipple?: (x: number, z: number, size?: number) => void
```

In `src/birds/spawn.ts`, replace `onRipple: (x, z) => deps.ripples.spawn(x, z),` with `onRipple: (x, z, size) => deps.ripples.spawn(x, z, size),`.

- [ ] **Step 4: Run the tests**

Run: `npm test && npx tsc --noEmit -p .`
Expected: 550 tests pass; `tsc` is clean.

- [ ] **Step 5: Commit**

```bash
git add src/world/ripples.ts src/world/ripples.test.ts src/world/water.ts src/behavior/types.ts src/birds/spawn.ts
git commit -m "feat: rings on the water come in sizes; a small one spreads slower, fades sooner, and is fainter"
```

---

### Task 2: A bill that goes into the mud, and how high a wader stands

**Files:**
- Modify: `src/birds/detail/spec.ts`, `src/birds/detail/build.ts`, `src/birds/detail/wing.ts`, `src/birds/detail/measure.ts`, `src/birds/detail/build.test.ts`

**Interfaces:**
- Consumes: `buildDetailedBird`, `neckSwing`, `headPitchToGround` (unchanged), `TEST_SPEC`, `TEST_DETAIL` (`src/birds/detail/fixture.ts`).
- Produces:

```ts
// detailSchema gains:
/** how far below the ground the bill tip goes at the bottom of a reach, metres; a prober pushes its bill into the mud */
probeDepth: z.number().min(0).optional(),

// FoldResult gains:  low: number   // the folded wing's lowest point, profile frame y
// Anatomy gains:     bodyLowY: number; wingLowY: number   // group space, at rest
// Measures gains (metres above the ground, standing):
joint: number     // the intertarsal joint
belly: number     // the lowest point of the body
wingLow: number   // the lowest point of the folded wing
```

- [ ] **Step 1: Write the failing tests**

In `src/birds/detail/build.test.ts`, insert before `it('swaps the folded wing for the spread one as the wings open', () => {`:

```ts
  it('measures how high a wader stands: joint below belly below wing, the belly at its lowest point', () => {
    const m = buildDetailedBird(TEST_SPEC)
    const r = measure(m)
    expect(r.joint).toBeCloseTo(m.anatomy.knee.y, 9)
    expect(r.joint).toBeGreaterThan(0)
    expect(r.belly).toBeGreaterThan(r.joint)
    // the lowest point of the body, which a hunched bird carries forward of its hips; the loft's rings sample the
    // belly, so under the hips it may sit a fraction of a millimetre above the exact belly line
    expect(r.belly).toBeLessThanOrEqual(m.anatomy.bellyY + 0.001)
    expect(r.wingLow).toBeGreaterThan(r.belly)
  })
```

Insert before `it('does nothing at reach 0: the rest pose is the traced bird', () => {`:

```ts
  it('probes into the ground by probeDepth at full reach, and leaves the rest pose alone', () => {
    const deep = buildDetailedBird(parseSpeciesSpec({ ...TEST_SPEC, detail: { ...TEST_DETAIL, probeDepth: 0.02 } }))
    for (const lean of [0.8, 1.0]) {
      const p = defaultPose(); p.lean.x = lean; p.reach = 1
      deep.pose(p)
      expect(billTipNow(deep).y, `lean ${lean}`).toBeCloseTo(-0.02, 3)
      expect(billAngleNow(deep), `lean ${lean}`).toBeGreaterThanOrEqual(-Math.PI / 2 - 1e-6)
    }
    deep.pose(defaultPose())
    expect(billTipNow(deep).distanceTo(deep.anatomy.billTip)).toBeLessThan(1e-9)
  })
  it('takes probeDepth 0 to mean the ground itself: the same peck as no probeDepth at all', () => {
    const none = buildDetailedBird(TEST_SPEC)
    const zero = buildDetailedBird(parseSpeciesSpec({ ...TEST_SPEC, detail: { ...TEST_DETAIL, probeDepth: 0 } }))
    for (const reach of [0.3, 0.7, 1]) {
      const p = defaultPose(); p.lean.x = 0.8; p.reach = reach
      none.pose(p); zero.pose(p)
      expect(billTipNow(zero).distanceTo(billTipNow(none)), `reach ${reach}`).toBeLessThan(1e-12)
    }
  })
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run src/birds/detail/build.test.ts`
Expected: the first fails (`joint` is undefined), and the probe-depth test fails with the tip at about 0 m instead of −0.02 m. zod strips the unknown `probeDepth`, so the bird still pecks onto the ground.

- [ ] **Step 3: The schema field**

In `src/birds/detail/spec.ts`, after `stepLength: pos.optional(),` add:

```ts
  /** how far below the ground the bill tip goes at the bottom of a reach, metres; a prober pushes its bill into the mud */
  probeDepth: z.number().min(0).optional(),
```

- [ ] **Step 4: Reach aims below the ground**

In `src/birds/detail/build.ts`, after the line `const floor = -Math.PI / 2 + tipOffAxis` add:

```ts
  // a reach aims the bill tip this far below the ground; the solvers aim at y = 0, so they work in a frame raised by it
  const depth = detail.probeDepth ?? 0
```

Replace the doc comment on `reachDown` with:

```ts
  /**
   * A peck or strike reaching down (`w` 0..1), moving no more of the bird than it needs: the head tips the bill down,
   * and only if a bill pointing straight down still can't reach its mark (`probeDepth` below the ground, y = 0 in
   * group space) does the neck swing forward and down, just far enough for it to (or as far as MAX_NECK_SWING allows).
   * Then the head tips the bill onto the mark: back up if a deep lean would push it further, and never past straight
   * down, where it stops short if the mark is out of reach.
   */
```

In `reachDown`, replace `      base: pN,` with `      base: { x: pN.x, y: pN.y + depth },`, and replace

```ts
    bones.head.rotation.z -= Math.min(w * headPitchToGround(pH, pT, floor), tipLine - floor)
```

with

```ts
    const pitch = headPitchToGround({ x: pH.x, y: pH.y + depth }, { x: pT.x, y: pT.y + depth }, floor)
    bones.head.rotation.z -= Math.min(w * pitch, tipLine - floor)
```

- [ ] **Step 5: The standing heights**

In `src/birds/detail/wing.ts`, in `FoldResult`, after `tip: THREE.Vector3` add:

```ts
  /** the folded wing's lowest point, profile frame y */
  low: number
```

In `buildFoldedWings`, add `let low = Infinity` on the line before `for (const side of [1, -1] as const) {`. After `const p = point(s, t)` add `low = Math.min(low, p.y)`. Replace `return { wrist: point(0, 0), tip: point(1, 0) }` with `return { wrist: point(0, 0), tip: point(1, 0), low }`.

In `src/birds/detail/build.ts`, in `Anatomy`, after `bellyY: number` add:

```ts
  /** the lowest point of the body (the loft) and of the folded wing, at rest */
  bodyLowY: number
  wingLowY: number
```

Replace

```ts
  const headVerts: THREE.Vector3[] = []
  loft.ringU.forEach((u, i) => {
    if (u < headStart) return
```

with

```ts
  const headVerts: THREE.Vector3[] = []
  let bodyLowY = Infinity
  loft.ringU.forEach((u, i) => {
    for (let j = 0; j < RADIAL; j++) bodyLowY = Math.min(bodyLowY, m.position(loft.first + i * RADIAL + j).y)
    if (u < headStart) return
```

and after `hip: hipR, knee: kneeR, foot: footR, bellyY: layout.bellyY + offset.y,` add the line `    bodyLowY, wingLowY: fold.low + offset.y,`.

In `src/birds/detail/measure.ts`, at the end of `Measures` add:

```ts
  /** standing, how high above the ground: the intertarsal joint, the lowest point of the body, and of the folded wing */
  joint: number
  belly: number
  wingLow: number
```

and at the end of the object `measure` returns, after `projection: …,`, add:

```ts
    joint: a.knee.y,
    belly: a.bodyLowY,
    wingLow: a.wingLowY,
```

- [ ] **Step 6: Run the tests**

Run: `npm test && npx tsc --noEmit -p .`
Expected: 553 tests pass, the existing species' pecks and wings unchanged; `tsc` is clean.

- [ ] **Step 7: Commit**

```bash
git add src/birds/detail
git commit -m "feat: probeDepth: a prober's bill goes into the mud; measure how high a wader stands"
```

---

### Task 3: `probe`, the dowitcher's style

**Files:**
- Modify: `src/birds/spec.ts`, `src/birds/spec.test.ts`, `src/behavior/probe.ts`, `src/behavior/probe.test.ts`, `src/birds/species/mudflat.test.ts`

**Interfaces:**
- Consumes: `onRipple(x, z, size)` (Task 1); `probeDepth` (Task 2); `createBody`, `TURN`, `approach` (existing, in `probe.ts`).
- Produces:

```ts
// src/birds/spec.ts
export const FORAGING = ['plover', 'sandpiper', 'dowitcher'] as const

// src/behavior/probe.ts
STYLES.dowitcher = {
  stitch: { seconds: [2, 5], perSecond: 3, high: 0, lean: 0.8, neckExtend: 1 },
  creep: { speed: 0.025, distance: [0.03, 0.1] },
  look: { chance: 0.4, seconds: [1.5, 3.5] },
  follow: { speed: 0.12, whenFarther: 1.5 },
  dip: { seconds: 0.4 },
  ripple: { every: 1, ahead: 0.12, size: 0.4 },
  flock: { radius: 1, retargetSeconds: 45, drift: 1.2 },
  water: [0.035, 0.055],     // metres, shallowest to deepest: read by the zone test (Task 5) and the acceptance test (Task 9)
}
PECK_BOTTOM.dowitcher = { lean: 0.8, neckExtend: 1, reach: 1 }
// the dowitcher's states: 'stitch' | 'creep' | 'look' | 'follow'
```

The settings are the research's section 11, re-split as the "Decisions" section above says.

- [ ] **Step 1: Write the failing tests**

In `src/birds/spec.test.ts`, in `'takes a foraging style, and rejects one it does not know'`, after the `'plover'` line add:

```ts
    expect(parseSpeciesSpec({ ...coot, foraging: 'dowitcher' }).foraging).toBe('dowitcher')
```

In `src/behavior/probe.test.ts`, give `record` the zone to check against. Replace its first line with

```ts
function record(c: BehaviorController, seconds: number, pose: PoseState = defaultPose(), area = zone.points): Frame[] {
```

and, inside it, replace `expect(pointInPolygon(c.x, c.z, zone.points)).toBe(true)` with `expect(pointInPolygon(c.x, c.z, area)).toBe(true)`.

Replace

```ts
describe('probe, either style', () => {
  for (const foraging of ['plover', 'sandpiper'] as const) {
```

with

```ts
describe('probe, every style', () => {
  for (const foraging of ['plover', 'sandpiper', 'dowitcher'] as const) {
```

In `'moves the bill continuously: …'`, replace `for (const foraging of ['plover', 'sandpiper'] as const) {` with `for (const foraging of ['plover', 'sandpiper', 'dowitcher'] as const) {`. Leave the `'eases the bill into and out of every peck …'` test on its two styles; its rules are theirs.

In the `PECK_BOTTOM` test, replace `['plover', 'sandpiper'] as Foraging[]` with `['plover', 'sandpiper', 'dowitcher'] as Foraging[]`.

Insert before `describe('PECK_BOTTOM', () => {`:

```ts
describe('probe, dowitcher', () => {
  const S = STYLES.dowitcher
  // a patch of water about the size of the lake's bench, with a flock of its own
  const strip = { kind: 'polygon' as const, points: [[0, 0], [6, 0], [6, 1], [0, 1]] as [number, number][] }
  const dctx = (seed: number, more: Partial<BehaviorContext> = {}): BehaviorContext =>
    ctx(seed, { foraging: 'dowitcher', zone: strip, group: { targetX: 3, targetZ: 0.5, retargetAt: 0 }, ...more })
  const frames = record(createProbe(dctx(16), 1, 0.5), 300, defaultPose(), strip.points)
  const all = spells(frames)

  it('stitches, creeps, looks up, and follows its flock', () => {
    expect(new Set(frames.map(f => f.state))).toEqual(new Set(['stitch', 'creep', 'look', 'follow']))
  })
  it('keeps its feet still while it stitches', () => {
    const bouts = all.filter(s => s.state === 'stitch')
    expect(bouts.length).toBeGreaterThan(10)
    for (const s of bouts) for (const f of s.frames) expect(f.moved).toBe(0)
  })
  it('stitches with its bill in the water: once its head is down, reach runs between the high point and the bottom', () => {
    // the head takes S.dip.seconds to come down; after that, every frame of a bout stays in the stitch band
    const settle = Math.ceil(S.dip.seconds * 30)
    const bouts = all.filter(s => s.state === 'stitch' && s.frames.length > settle + 30)
    expect(bouts.length).toBeGreaterThan(5)
    for (const s of bouts) {
      const settled = s.frames.slice(settle)
      for (const f of settled) expect(f.reach).toBeGreaterThanOrEqual(S.stitch.high - 1e-6)
      expect(Math.max(...settled.map(f => f.reach))).toBeGreaterThan(0.97)
      expect(Math.min(...settled.map(f => f.reach))).toBeLessThan(S.stitch.high + 0.05)
    }
  })
  it('stitches as it creeps: the bill keeps going while the feet step', () => {
    const creeping = frames.filter(f => f.state === 'creep' && f.moved > 0)
    expect(creeping.length).toBeGreaterThan(100)
    expect(Math.max(...creeping.map(f => f.reach))).toBeGreaterThan(0.97)
  })
  it('creeps only a short way each time', () => {
    const creeps = all.filter(s => s.state === 'creep').map(s => s.frames.reduce((d, f) => d + f.moved, 0))
    expect(creeps.length).toBeGreaterThan(10)
    for (const d of creeps) expect(d).toBeLessThanOrEqual(S.creep.distance[1] + 1e-6)
  })
  it('lifts its head clear of the water to look, then puts it back', () => {
    const looks = all.filter(s => s.state === 'look' && s.frames.length > S.dip.seconds * 30 + 5)
    expect(looks.length).toBeGreaterThan(2)
    for (const s of looks) {
      for (const f of s.frames) expect(f.moved).toBe(0)
      expect(s.frames.at(-1)!.reach).toBeLessThan(0.02)
    }
  })
  it('pecks with its body tipped forward to the peck-bottom lean', () => {
    const deep = frames.filter(f => f.state === 'stitch' && f.reach > 0.97)
    expect(deep.length).toBeGreaterThan(0)
    for (const f of deep) expect(f.leanX).toBeCloseTo(PECK_BOTTOM.dowitcher.lean, 1)
  })
  it('rings the water ahead of it at the bottom of a stroke, no more often than its ripple interval', () => {
    const rings: { t: number; x: number; z: number; size?: number }[] = []
    let t = 0
    const c = createProbe(dctx(17, { onRipple: (x, z, size) => rings.push({ t, x, z, size }) }), 3, 0.5)
    const pose = defaultPose()
    for (let i = 0; i < 120 * 60; i++) {
      t = i / 60
      c.update(1 / 60, pose)
      if (rings.at(-1)?.t === t) {
        const r = rings.at(-1)!
        expect(pose.reach).toBeGreaterThan(0.95)
        expect(r.size).toBe(S.ripple.size)          // a bill's small ring, not a duck's wake
        expect(Math.hypot(r.x - c.x, r.z - c.z)).toBeCloseTo(S.ripple.ahead, 6)
        // ahead is where the bird faces: +x at heading 0, counter-clockwise seen from above (-z)
        expect(r.x - c.x).toBeCloseTo(Math.cos(c.heading) * S.ripple.ahead, 6)
        expect(r.z - c.z).toBeCloseTo(-Math.sin(c.heading) * S.ripple.ahead, 6)
      }
    }
    expect(rings.length).toBeGreaterThan(30)
    for (let i = 1; i < rings.length; i++) expect(rings[i]!.t - rings[i - 1]!.t).toBeGreaterThanOrEqual(S.ripple.every - 1e-9)
  })
  it('never leans on the zone clamp in a strip 0.3 m wide: every frame moves it no further than its pace', () => {
    // Flock spots near the edge get clamped to just inside it, so a bird that curved round while walking would clip
    // the edge and the clamp would jump it several centimetres. Turning on the spot first, it never does.
    const thin = { kind: 'polygon' as const, points: [[0, 0], [5, 0], [5, 0.3], [0, 0.3]] as [number, number][] }
    const pace = Math.max(S.creep.speed, S.follow.speed) / 30
    for (let seed = 1; seed <= 20; seed++) {
      const c = createProbe(dctx(seed, { zone: thin, group: { targetX: 2.5, targetZ: 0.15, retargetAt: 0 } }), 0.3, 0.15)
      const pose = defaultPose()
      let px = c.x, pz = c.z
      for (let i = 0; i < 300 * 30; i++) {
        c.update(1 / 30, pose)
        expect(pointInPolygon(c.x, c.z, thin.points)).toBe(true)
        const moved = Math.hypot(c.x - px, c.z - pz)
        if (moved > pace + 1e-9) expect.fail(`seed ${seed}, frame ${i}: moved ${moved.toFixed(4)} m`)
        px = c.x; pz = c.z
      }
    }
  })
  it('works one patch, then drifts a short way on: the flock target never jumps further than its drift', () => {
    const group = { targetX: 3, targetZ: 0.5, retargetAt: 0 }
    const c = createProbe(dctx(21, { group }), 3, 0.5)
    const pose = defaultPose()
    let [gx, gz] = [group.targetX, group.targetZ], moves = 0
    for (let i = 0; i < 600 * 30; i++) {
      c.update(1 / 30, pose)
      const jump = Math.hypot(group.targetX - gx, group.targetZ - gz)
      if (jump > 0) { moves++; expect(jump).toBeLessThanOrEqual(S.flock.drift + 1e-9) }
      ;[gx, gz] = [group.targetX, group.targetZ]
    }
    expect(moves).toBeGreaterThan(10)
  })
  it('keeps with the flock, closer than a sandpiper: members converge on the shared target', () => {
    const group = { targetX: 10, targetZ: 5, retargetAt: 1e9 }
    const a = createProbe(ctx(19, { foraging: 'dowitcher', group }), 1, 1)
    const b = createProbe(ctx(20, { foraging: 'dowitcher', group }), 19, 9)
    const pa = defaultPose(), pb = defaultPose()
    // a first stitch bout of a few seconds, then about 10 m at a wading walk
    for (let t = 0; t < 150; t += 1 / 30) { a.update(1 / 30, pa); b.update(1 / 30, pb) }
    expect(Math.hypot(a.x - group.targetX, a.z - group.targetZ)).toBeLessThan(S.follow.whenFarther + S.flock.radius)
    expect(Math.hypot(b.x - group.targetX, b.z - group.targetZ)).toBeLessThan(S.follow.whenFarther + S.flock.radius)
  })
})
```

In `src/birds/species/mudflat.test.ts`, the peck-reach bounds learn the new style. Replace

```ts
  // the Killdeer dabs at the surface; the Least may probe a little into it, never stop above it
  const bounds = { plover: [-5, 5], sandpiper: [-8, 2] } as const
```

with

```ts
  // The Killdeer dabs at the surface; a sandpiper may probe a little into it, never stop above it; a dowitcher pushes
  // its bill in to its probeDepth. Millimetres, bill tip height above the ground.
  const bounds = (spec: SpeciesSpec): [number, number] => {
    if (spec.foraging === 'plover') return [-5, 5]
    if (spec.foraging === 'dowitcher') { const d = (spec.detail?.probeDepth ?? 0) * 1000; return [-d - 5, -d + 5] }
    return [-8, 2]
  }
```

and `within(billTipNow(m).y * 1000, bounds[style][0], bounds[style][1])` with `within(billTipNow(m).y * 1000, ...bounds(spec))`.

In the same file, the foot-slip test gets a flock target that keeps moving, so a slow creeper covers ground in the time it has. Replace

```ts
        const c = createProbe({ zone: patch, rng: makeRng(seed), wind: () => ({ dirX: 0, dirZ: 0, effective: 0.3 }), ground: () => 0, foraging: spec.foraging }, 3, 1.25)
        const pose = defaultPose()
        let prev: THREE.Vector3[] | null = null, px = c.x, pz = c.z, ph = c.heading
        for (let i = 0; i < 60 * 30; i++) {
          c.update(1 / 30, pose)
```

with

```ts
        // a flock target that moves on every second, so even a slow creeper covers ground (a plover ignores it)
        const group = { targetX: 3, targetZ: 1.25, retargetAt: 0 }
        const c = createProbe({ zone: patch, rng: makeRng(seed), wind: () => ({ dirX: 0, dirZ: 0, effective: 0.3 }), ground: () => 0, foraging: spec.foraging, group }, 3, 1.25)
        const pose = defaultPose()
        let prev: THREE.Vector3[] | null = null, px = c.x, pz = c.z, ph = c.heading
        for (let i = 0; i < 60 * 30; i++) {
          if (i % 30 === 0) group.retargetAt = 0
          c.update(1 / 30, pose)
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npx vitest run src/behavior/probe.test.ts src/birds/spec.test.ts`
Expected: the schema test fails (`dowitcher` rejected). The dowitcher tests fail, since a missing style falls through to the sandpiper, and `STYLES.dowitcher` is undefined.

- [ ] **Step 3: The style**

In `src/birds/spec.ts`, replace `export const FORAGING = ['plover', 'sandpiper'] as const` with `export const FORAGING = ['plover', 'sandpiper', 'dowitcher'] as const`.

In `src/behavior/probe.ts`, add after the `clampToPolygon` import:

```ts
import type { PolygonZone } from '../location/schema'
```

Replace everything from the doc comment above `export const STYLES` through the line `const between = (rng: () => number, [lo, hi]: [number, number]) => lo + rng() * (hi - lo)` with:

```ts
/**
 * How each foraging style moves, from docs/research/2026-09-25-killdeer-least-sandpiper.md, section 10, and for the
 * dowitcher docs/research/2026-09-25-long-billed-dowitcher-pectoral-sandpiper.md, section 11 (most values are
 * estimates from timed plovers and short videos; see there). A plover hunts by eye: it runs a short way, stops dead
 * with its head up, and now and then tips forward for a single dab. A sandpiper feels for food: it walks slowly with
 * its bill going down and up, stops for a few quick probes, and runs to keep up with its flock. A dowitcher stands
 * belly-deep, tipped forward, and stitches: its bill goes in and out of the mud three times a second while it creeps a
 * step or two at a time, and now and then it lifts its head to look.
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
  dowitcher: {
    // tipped well forward, the bill rests on the mud at the top of a stroke (reach 0) and goes in to probeDepth at the bottom
    stitch: { seconds: [2, 5] as [number, number], perSecond: 3, high: 0, lean: 0.8, neckExtend: 1 },
    creep: { speed: 0.025, distance: [0.03, 0.1] as [number, number] },
    look: { chance: 0.4, seconds: [1.5, 3.5] as [number, number] },
    follow: { speed: 0.12, whenFarther: 1.5 },
    /** how long the head takes to go down into the water, or come up out of it */
    dip: { seconds: 0.4 },
    /** a small ring on the water, a bill going in, at most every `every` seconds, `ahead` metres in front of the bird */
    ripple: { every: 1, ahead: 0.12, size: 0.4 },
    /** the flock works one patch, then drifts a short way on to the next */
    flock: { radius: 1, retargetSeconds: 45, drift: 1.2 },
    /** the water it feeds in, shallowest to deepest, metres: up to its intertarsal joint at least, its wing kept dry */
    water: [0.035, 0.055] as [number, number],
  },
}

/** The pose at the bottom of each style's peck, for checking that the bill reaches the ground. */
export const PECK_BOTTOM: Record<Foraging, { lean: number; neckExtend: number; reach: number }> = {
  plover: { lean: STYLES.plover.peck.lean, neckExtend: STYLES.plover.peck.neckExtend, reach: 1 },
  sandpiper: { lean: STYLES.sandpiper.peck.lean, neckExtend: STYLES.sandpiper.peck.neckExtend, reach: 1 },
  dowitcher: { lean: STYLES.dowitcher.stitch.lean, neckExtend: STYLES.dowitcher.stitch.neckExtend, reach: 1 },
}

/** the fastest any style turns, rad/s */
export const TURN = 8
/** how fast the legs come up to a full stride when the bird sets off, and settle when it stops */
const GAIT_RISE = 30
const GAIT_FALL = 10

export function createProbe(ctx: BehaviorContext, startX: number, startZ: number): BehaviorController {
  switch (ctx.foraging ?? 'sandpiper') {
    case 'plover': return createPlover(ctx, startX, startZ)
    case 'dowitcher': return createDowitcher(ctx, startX, startZ)
    default: return createSandpiper(ctx, startX, startZ)
  }
}

const between = (rng: () => number, [lo, hi]: [number, number]) => lo + rng() * (hi - lo)
/** smoothstep: 0 to 1, starting and ending at zero speed */
const ease = (t: number) => t * t * (3 - 2 * t)

/**
 * A flock's shared target, which moves on now and then (anywhere in the zone, or, with `drift`, at most that many
 * metres), and spots near it for one bird.
 */
function createFlock(ctx: BehaviorContext, zone: PolygonZone, x: number, z: number, settings: { radius: number; retargetSeconds: number; drift?: number }) {
  const group = ctx.group ?? { targetX: x, targetZ: z, retargetAt: Infinity }
  return {
    group,
    /** a spot within `radius` of the shared target, moving the target on first if it is due */
    near(clock: number): [number, number] {
      if (clock >= group.retargetAt) {
        const [px, pz] = randomPointInPolygon(zone.points, ctx.rng)
        const d = Math.hypot(px - group.targetX, pz - group.targetZ)
        const k = settings.drift === undefined || d <= settings.drift ? 1 : settings.drift / d
        ;[group.targetX, group.targetZ] = [group.targetX + (px - group.targetX) * k, group.targetZ + (pz - group.targetZ) * k]
        group.retargetAt = clock + settings.retargetSeconds
      }
      const a = ctx.rng() * Math.PI * 2, r = ctx.rng() * settings.radius
      return clampToPolygon(group.targetX + Math.cos(a) * r, group.targetZ + Math.sin(a) * r, zone.points)
    },
    /** how far (px, pz) is from the shared target */
    distance(px: number, pz: number): number { return Math.hypot(group.targetX - px, group.targetZ - pz) },
  }
}
```

Replace the comment `/** Position, heading, and the moves both styles share: walking the legs, standing still, ruffling in the wind. */` with `/** Position, heading, and the moves every style shares: walking the legs, standing still, ruffling in the wind. */`.

In `createSandpiper`, the flock moves into `createFlock`, with the same random draws in the same order. Replace

```ts
  const group = ctx.group ?? { targetX: startX, targetZ: startZ, retargetAt: Infinity }
```

with `  const flock = createFlock(ctx, b.zone, startX, startZ, S.flock)`, and delete the whole `nearFlock` function (its doc comment and body). In `move()`, replace

```ts
    const [nx, nz] = nearFlock()
    const far = Math.hypot(group.targetX - b.x, group.targetZ - b.z) > S.run.whenFarther
```

with

```ts
    const [nx, nz] = flock.near(clock)
    const far = flock.distance(b.x, b.z) > S.run.whenFarther
```

At the end of the file, add:

```ts
function createDowitcher(ctx: BehaviorContext, startX: number, startZ: number): BehaviorController {
  const S = STYLES.dowitcher
  const b = createBody(ctx, startX, startZ)
  const flock = createFlock(ctx, b.zone, startX, startZ, S.flock)
  let state: 'stitch' | 'creep' | 'look' | 'follow' = 'stitch'
  let timer = between(ctx.rng, S.stitch.seconds)
  let clock = 0
  let phase = 0
  /** how far the head is down in the stitch posture, 0 (up, at rest) to 1 */
  let dip = 0
  let sinceRing = Infinity
  let facing = false
  let [tx, tz] = [b.x, b.z]

  function stitch(): void { state = 'stitch'; timer = between(ctx.rng, S.stitch.seconds) }
  function look(): void { state = 'look'; timer = between(ctx.rng, S.look.seconds) }
  /**
   * Creep a little way toward a spot near the flock, or follow it with the head up if it has moved on. Either way the
   * bird turns on the spot first and then goes straight, so in a convex zone it never strays out and needs the clamp.
   */
  function move(): void {
    const [nx, nz] = flock.near(clock)
    facing = false
    if (flock.distance(b.x, b.z) > S.follow.whenFarther) {
      state = 'follow'
      ;[tx, tz] = [nx, nz]
      timer = Math.PI / TURN + Math.hypot(tx - b.x, tz - b.z) / S.follow.speed + 1
    } else {
      state = 'creep'
      const d = Math.hypot(nx - b.x, nz - b.z) || 1, len = Math.min(d, between(ctx.rng, S.creep.distance))
      ;[tx, tz] = [b.x + ((nx - b.x) / d) * len, b.z + ((nz - b.z) / d) * len]
      timer = Math.PI / TURN + len / S.creep.speed + 1
    }
  }

  return {
    name: 'probe',
    get state() { return state },
    get x() { return b.x }, get y() { return ctx.ground(b.x, b.z) }, get z() { return b.z }, get heading() { return b.heading },
    update(dt: number, pose: PoseState) {
      clock += dt
      timer -= dt
      sinceRing += dt
      // the head goes down into the water to stitch and creep, and comes up to look and follow
      const down = state === 'stitch' || state === 'creep'
      dip = Math.min(1, Math.max(0, dip + (down ? dt : -dt) / S.dip.seconds))
      if (state === 'stitch') {
        b.still(dt, pose)
        if (timer <= 0) { if (ctx.rng() < S.look.chance) look(); else move() }
      } else if (state === 'look') {
        b.still(dt, pose)
        if (timer <= 0) stitch()
      } else {
        const speed = state === 'creep' ? S.creep.speed : S.follow.speed
        if (!facing) {
          b.still(dt, pose)
          facing = b.faceToward(tx, tz, dt)
          if (timer <= 0) stitch()
        } else if (b.moveToward(tx, tz, speed, dt, pose) < 0.01 || timer <= 0) stitch()
      }
      // The bill runs between the stitch's high point and the bottom, along sin^2, as far as the head is down. The
      // phase never resets, so a bout picks up where the last left off, and the head eases in and out (smoothstep).
      const before = phase - Math.floor(phase)
      phase += S.stitch.perSecond * dt
      const f = phase - Math.floor(phase)
      const k = ease(dip)
      pose.reach = k * (S.stitch.high + (1 - S.stitch.high) * Math.sin(Math.PI * f) ** 2)
      pose.lean.x = S.stitch.lean * k
      pose.neckExtend = 0.5 + (S.stitch.neckExtend - 0.5) * k
      // the bottom of a stroke (f crossing a half) rings the water where the bill goes in
      if (k > 0.99 && before < 0.5 && f >= 0.5 && sinceRing >= S.ripple.every) {
        sinceRing = 0
        ctx.onRipple?.(b.x + Math.cos(b.heading) * S.ripple.ahead, b.z - Math.sin(b.heading) * S.ripple.ahead, S.ripple.size)
      }
    },
  }
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test && npx tsc --noEmit -p .`
Expected: 568 tests pass, and the Killdeer and Least keep every peck, stride, and flock test. `tsc` is clean. The dowitcher's thin-strip test takes about half a second.

- [ ] **Step 5: Check that the thin-strip test bites**

In `createDowitcher`'s `move()`, temporarily change `facing = false` to `facing = true` (walking while turning) and run `npx vitest run src/behavior/probe.test.ts -t "zone clamp"`. Expected: it fails, naming a seed and frame where the bird moved over 5 mm in a frame (seed 9 in the scratch run). Undo the change and run it again: it passes.

- [ ] **Step 6: Commit**

```bash
git add src/birds/spec.ts src/birds/spec.test.ts src/behavior/probe.ts src/behavior/probe.test.ts src/birds/species/mudflat.test.ts
git commit -m "feat: probe's dowitcher style: stitch belly-deep, creep, look up, follow a drifting flock, ring the water"
```

---

### Task 4: The viewer: a water depth slider

**Files:**
- Modify: `src/viewer/state.ts`, `src/viewer/state.test.ts`, `src/viewer/main.ts`

**Interfaces:**
- Consumes: the viewer's `NUMBERS` and `FLAGS` tables.
- Produces: `ViewerState.water: number` (metres over the ground, 0 hides it; hash key `water`, clamped to 0..0.1; an old `water=1` reads as 0.03).

- [ ] **Step 1: Write the failing tests**

In `src/viewer/state.test.ts`, in `DEFAULTS`, replace `water: false,` with `water: 0,`. In the round-trip test, add `water: 0.045,` before `wire: true`. Insert before `it('falls back from a species or plumage the catalog lacks', () => {`:

```ts
  it('reads the water as a depth in metres, 0 to 10 cm, and an old on-off link as the 3 cm it used to show', () => {
    expect(parseState('#water=0.055', DEFAULTS).water).toBe(0.055)
    expect(parseState('#water=0.5', DEFAULTS).water).toBe(0.1)
    expect(parseState('#water=-1', DEFAULTS).water).toBe(0)
    expect(parseState('#water=1', DEFAULTS).water).toBe(0.03)
    expect(parseState('#water=0', DEFAULTS).water).toBe(0)
  })
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run src/viewer`
Expected: the round-trip and water tests fail.

- [ ] **Step 3: Water as a depth**

In `src/viewer/state.ts`, replace

```ts
  water: boolean; wire: boolean; skel: boolean; uv: boolean; atlas: boolean; stations: boolean
```

with

```ts
  /** depth of the water over the ground, metres; 0 hides it */
  water: number
  wire: boolean; skel: boolean; uv: boolean; atlas: boolean; stations: boolean
```

Make these replacements:
- In `NUMBERS`, `speed: [0.05, 2],` → `speed: [0.05, 2], water: [0, 0.1],`.
- `const FLAGS = ['walk', 'water', 'wire', 'skel', 'uv', 'atlas', 'stations'] as const` → `const FLAGS = ['walk', 'wire', 'skel', 'uv', 'atlas', 'stations'] as const`.

In `parseState`, after `const p = new URLSearchParams(hash.replace(/^#/, ''))` add:

```ts
  // water was once an on-off flag for a plane 3 cm up; an old link still shows it there
  if (p.get('water') === '1') p.set('water', '0.03')
```

In `src/viewer/main.ts`, make these changes:
- In `DEFAULTS`, replace `water: false,` with `water: 0,`.
- Delete the line `water.position.y = 0.03`.
- In `applyLook`, replace `water.visible = state.water` with the two lines `water.visible = state.water > 0` and `water.position.y = state.water`.
- Replace `check(cam, 'shallow water', state.water, v => set({ water: v }))` with `slider(cam, 'water depth, cm', state.water * 100, v => set({ water: v / 100 }), 0, 10, 0.5)`.

- [ ] **Step 4: Run the tests**

Run: `npm test && npx tsc --noEmit -p .`
Expected: 569 tests pass; `tsc` is clean.

- [ ] **Step 5: Commit**

```bash
git add src/viewer
git commit -m "feat: viewer water depth slider, 0-10 cm; old links keep their 3 cm plane"
```

---

### Task 5: The bench, and zones checked on the terrain the birds stand on

**Files:**
- Modify: `src/world/heightfield.ts`, `src/world/heightfield.test.ts`, `src/world/terrain.test.ts`, `src/location/zoneTerrain.test.ts`, `data/locations/lake.json`

**Interfaces:**
- Consumes: `terrainSurface` (`src/world/terrain.ts`), `STYLES.dowitcher.water` (Task 3), `getSpec`/`hasSpec`.
- Produces:

```ts
// src/world/heightfield.ts
export const BENCH = { depth: 0.045, x: [18, 26], z: [-14, -12] } as const
```

  and, in `lake.json`, the zone `"bench": { "kind": "polygon", "points": [[18.5, -11.8], [25.5, -11.8], [25.5, -13.9], [18.5, -13.9]] }`.

- [ ] **Step 1: Write the failing tests**

In `src/world/heightfield.test.ts`, import `BENCH`: replace the first line with `import { lakeHeightfield, terrainColor, valueNoise2, BENCH } from './heightfield'`. Insert before `it('rises on the far shore', () => {`:

```ts
  it('lays a flat bench under a few centimetres of water just past the shallows, where the dowitchers feed', () => {
    for (let x = BENCH.x[0]; x <= BENCH.x[1]; x += 0.5) {
      for (let z = BENCH.z[0]; z <= BENCH.z[1]; z += 0.25) expect(hf.sample(x, z), `(${x}, ${z})`).toBeCloseTo(-BENCH.depth, 9)
    }
    // it eases back into the lake bed within a metre: the shallows' own grid row and the deep water beyond are untouched
    const bare = (x: number, z: number) => hf.sample(x, z) !== -BENCH.depth
    expect(bare(22, BENCH.z[1] + 2)).toBe(true)
    expect(bare(22, BENCH.z[0] - 2)).toBe(true)
  })
```

In `src/world/terrain.test.ts`, replace `import { lakeHeightfield } from './heightfield'` with `import { lakeHeightfield, BENCH } from './heightfield'`.

The existing test `'is the height of the rendered mesh, not of the smooth field it samples'` casts about 460 rays against the 80,000-triangle terrain. With this round's heavier tests running alongside it, it nears Vitest's 5 s default and fails now and then (it did once in the replay). Give it room: replace the `})` that closes it with

```ts
  }, 20_000)   // about 460 rays against the 80,000-triangle terrain: near the 5 s default in a busy full run
```

Then insert before `it('matches the smooth field at the mesh vertices', () => {`:

```ts
  it('renders the dowitcher bench flat: its top covers whole cells of the mesh', () => {
    for (let x = BENCH.x[0]; x <= BENCH.x[1]; x += 0.25) {
      for (let z = BENCH.z[0]; z <= BENCH.z[1]; z += 0.25) expect(surface.sample(x, z), `(${x}, ${z})`).toBeCloseTo(-BENCH.depth, 6)
    }
  })
```

In `src/location/zoneTerrain.test.ts`, after the `lakeHeightfield` import add:

```ts
import { terrainSurface } from '../world/terrain'
import { getSpec, hasSpec } from '../birds/species'
import { STYLES } from '../behavior/probe'
```

Replace the `GROUND_OK` block, with its three-line comment, by:

```ts
const DOWITCHER_WATER = STYLES.dowitcher.water

// Ground-height bounds that make each behavior look right against the terrain: swimmers need
// real water, plovers and sandpipers damp flat ground (not standing water, not dry), a dowitcher
// water up to its belly, waders dry-ish ground clear of deep water. A prober's bounds follow its
// species' foraging style.
const GROUND_OK: Record<string, (y: number) => boolean> = {
  swim: y => y < -0.2,
  probe: y => y >= -0.03 && y <= 0.5,
  'probe:dowitcher': y => y >= -DOWITCHER_WATER[1] && y <= -DOWITCHER_WATER[0],
  wade: y => y > -0.3,
}
const styleOf = (species: string) => (hasSpec(species) ? getSpec(species).foraging : undefined)
const checkFor = (behavior: string, species: string) => {
  const style = behavior === 'probe' ? styleOf(species) : undefined
  return GROUND_OK[`${behavior}:${style}`] ?? GROUND_OK[behavior]
}
```

Replace

```ts
describe('zone polygons agree with the heightfield', () => {
  const loc = loadLocation()
  const heightfield = lakeHeightfield(7)
```

with

```ts
describe('zone polygons agree with the terrain the birds stand on', () => {
  const loc = loadLocation()
  // the rendered mesh, not the smooth field it samples every 2 m: the two differ by centimetres, which matters in
  // water a few centimetres deep
  const heightfield = terrainSurface(lakeHeightfield(7))
```

In the cast loop, replace

```ts
    const check = GROUND_OK[entry.behavior]
    if (!zone || zone.kind !== 'polygon' || !check) continue
    const key = `${entry.zone}:${entry.behavior}`
```

with

```ts
    const check = checkFor(entry.behavior, entry.species)
    if (!zone || zone.kind !== 'polygon' || !check) continue
    const style = entry.behavior === 'probe' ? styleOf(entry.species) : undefined
    const key = `${entry.zone}:${entry.behavior}:${style}`
```

and

```ts
    it(`${entry.zone} (${entry.behavior}) samples all agree with the terrain`, () => {
      const samples = samplePolygon(zone.points)
```

with

```ts
    it(`${entry.zone} (${entry.behavior}${style ? ', ' + style : ''}) samples all agree with the terrain`, () => {
      // at least five samples across the zone's narrow side, however thin the strip
      const [x0, x1, z0, z1] = bboxOf(zone.points)
      const samples = samplePolygon(zone.points, Math.min(0.5, Math.min(x1 - x0, z1 - z0) / 5))
```

Insert before `it('the reeds zone matches the rendered reed bed bounds', () => {`:

```ts
  it('keeps the bench belly-deep for a dowitcher, all over', () => {
    const bench = loc.zones['bench']
    expect(bench?.kind).toBe('polygon')
    if (bench?.kind !== 'polygon') return
    const samples = samplePolygon(bench.points, 0.1)
    expect(samples.length).toBeGreaterThan(1000)
    for (const [x, z] of samples) {
      const y = heightfield.sample(x, z)
      expect(y, `(${x}, ${z})`).toBeLessThanOrEqual(-DOWITCHER_WATER[0])
      expect(y, `(${x}, ${z})`).toBeGreaterThanOrEqual(-DOWITCHER_WATER[1])
    }
  })
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run src/world src/location`
Expected: the heightfield and terrain tests fail (`BENCH` is undefined), and the bench test fails (no `bench` zone). The existing zones pass on the rendered surface. The shallows' range there is −0.137 to +0.028 m, inside its ankle-deep bounds.

- [ ] **Step 3: The bench**

In `src/world/heightfield.ts`, after `function smooth(t: number) { return t * t * (3 - 2 * t) }` add:

```ts
/**
 * A flat shelf under the water just past the shallows, where the dowitchers feed belly-deep: `depth` metres down over
 * [x0, x1] by [z0, z1], easing back into the lake bed over a metre. Its edges sit on the terrain mesh's 2 m grid (even
 * coordinates), so its top covers whole cells and renders flat.
 */
export const BENCH = { depth: 0.045, x: [18, 26], z: [-14, -12] } as const

/** 1 over [a, b], easing to 0 within `margin` outside it */
function plateau(v: number, a: number, b: number, margin = 1): number {
  const rise = Math.min(1, Math.max(0, (v - (a - margin)) / margin))
  const fall = Math.min(1, Math.max(0, (b + margin - v) / margin))
  return smooth(rise) * smooth(fall)
}
```

In `lakeHeightfield`, after `y = y * (1 - mud) + 0.08 * mud` add:

```ts
      // Bench: blended the same way, so its top stays flat
      const bench = plateau(x, BENCH.x[0], BENCH.x[1]) * plateau(z, BENCH.z[0], BENCH.z[1])
      y = y * (1 - bench) - BENCH.depth * bench
```

In `data/locations/lake.json`, after the `"shallows"` zone add:

```json
    "bench":      { "kind": "polygon", "points": [[18.5, -11.8], [25.5, -11.8], [25.5, -13.9], [18.5, -13.9]] },
```

The polygon sits inside the band: on the rendered terrain, every row from z −11.68 to −14.00 is between 3.5 and 5.5 cm deep over x 18.5–25.5.

- [ ] **Step 4: Run the tests**

Run: `npm test && npx tsc --noEmit -p .`
Expected: 573 tests pass, including every existing zone on the rendered surface. `tsc` is clean.

- [ ] **Step 5: Commit**

```bash
git add src/world/heightfield.ts src/world/heightfield.test.ts src/world/terrain.test.ts src/location/zoneTerrain.test.ts data/locations/lake.json
git commit -m "feat: an underwater bench past the shallows, 4.5 cm deep, for the dowitchers; zones checked on the rendered terrain"
```

---

### Task 6: Harvest the two species

**Files:**
- Modify: `data/species-allowlist.json`, `data/birds.json` (written by the harvest)
- Create: new files under `public/media/audio/` and `public/media/photos/` (written by the harvest)
- Possibly modify: `data/reviews.json`

**Interfaces:**
- Consumes:
  - the harvest scripts (`harvest:allowlist`, `harvest:taxonomy`, `harvest:media`, `build:birds`)
  - `.env` with `EBIRD_API_KEY` and `XC_API_KEY`
  - `data/raw/` (present locally, never committed)
- Produces: catalog entries for `lobdow` and `pecsan` (habitats `wetland`, `shoreline`; a photo; calls), which `validateCast` needs before Task 9's cast entries.

This task calls eBird, xeno-canto, and iNaturalist. **Ask the user before running it.**

- [ ] **Step 1: Allow-list them**

In `data/species-allowlist.json`, add two entries:

```json
  "lobdow": ["wetland", "shoreline"],
  "pecsan": ["wetland", "shoreline"]
```

- [ ] **Step 2: Harvest**

```bash
npm run harvest:allowlist     # expected: "... candidates (2 added from the allow-list)"
npm run harvest:taxonomy      # one eBird taxonomy call
npm run harvest:media         # cached species print "(cached)"; lobdow and pecsan download up to 3 clips and a photo each
npm run build:birds
```

Expected: `data/birds.json` gains `lobdow` (Long-billed Dowitcher, *Limnodromus scolopaceus*) and `pecsan` (Pectoral Sandpiper, *Calidris melanotos*), each with a photo and clips.

- [ ] **Step 3: Listen to the clips**

Play each new clip under `public/media/audio/lobdow-*` and `pecsan-*`:
- The dowitcher needs at least one clip of its sharp *keek* flight or alarm call. That is how birders separate it from Short-billed.
- The Pectoral's clips should be its low, rough *krrip*.
- If a clip doesn't fit (the wrong call, heavy noise, another species louder), add its `XC…` id to the `rejected` list in `data/reviews.json`, run `npm run harvest:media && npm run build:birds` again, and listen to the replacement.

Look at the two photos in `public/media/photos/`. If either is side-on with the legs showing, note it for the tracing check in Tasks 7 and 8. The traces themselves come from the research's references either way.

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: 573 tests pass (the catalog tests read the new entries).

- [ ] **Step 5: Commit**

```bash
git add data/species-allowlist.json data/birds.json data/reviews.json public/media
git commit -m "feat: harvest the Long-billed Dowitcher and Pectoral Sandpiper: calls, photos, attribution"
```

---

### Task 7: The Pectoral Sandpiper, detailed

**Files:**
- Create: `src/birds/species/pecsan.ts`
- Modify: `src/birds/species/index.ts`, `src/behavior/probe.ts`

**Interfaces:**
- Consumes:
  - `foraging: 'sandpiper'` and `STYLES.sandpiper`
  - the detailed builder, painter, and viewer
  - `species.test.ts` (runs over every detailed species: measurements within 5%, no crease, stance foot planted)
  - `mudflat.test.ts` (peck reach and foot slip, over every detailed species with a style)
- Produces: `pecsan`, a juvenile, with a `detail` block; the sandpiper's peck leaning 0.4.

Everything comes from the research:
- Measurements: section 9.
- Marks: section 4.2.
- Tracing reference: section 8.2.

The trace is of ADJ82's photo, scaled by the culmen, with the silhouette read by a colour scan of the photo (blue-grey water, buff and brown bird). The loft never creases. The built bird matches the photo's outline, with the eye within 1 mm, and it measures:

| Measure | Built |
|---|---|
| Length | 198.1 mm |
| Culmen | 27.5 mm |
| Culmen / head | 0.99 |
| Tail past the wingtips | −1.7 mm |
| Bill tip below its base line | 0.55 mm |
| Length against the Least | 1.56× |

- [ ] **Step 1: The species file**

Create `src/birds/species/pecsan.ts`:

```ts
import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'pecsan',
  commonName: 'Pectoral Sandpiper',
  length: 0.22,
  body: { length: 1, height: 0.5, width: 0.42 },
  neck: { length: 0.2, thickness: 0.15, angle: 50 },
  head: { size: 0.26 },
  bill: { length: 0.2, thickness: 0.05, shape: 'pointed' },
  legs: { length: 0.32, thickness: 0.02 },
  tail: { length: 0.2, angle: 0 },
  wing: { length: 0.45, width: 0.2 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#7e4c26', cheek: '#b89a78', throat: '#f0e9dc', breast: '#cdb08c', flank: '#f4f1ea',
    back: '#5a4330', wing: '#6a4e36', speculum: null, rump: '#2e2620', tail: '#8e8274',
    bill: '#3a3026', legs: '#b3a84a', eye: '#111111',
  },
  variants: {},
  marks: {
    size: 'a medium sandpiper, half as long again as a Least',
    bill: 'a medium bill with a slight droop, dark at the tip and paler at the base',
    head: 'a rufous-streaked cap and a faint pale eyebrow',
    body: 'a finely streaked breast that stops in a sharp line against the white belly; white braces down the back',
    legs: 'dull yellow-olive legs',
  },
  wingbeatHz: 7,
  foraging: 'sandpiper',
  detail: {
    measurements: {
      length: 0.195, culmen: 0.0275, billDepth: 0.005, billWidth: 0.0034,
      tarsus: 0.027, tibia: 0.011, toe: 0.023, wingChord: 0.133, tail: 0.058,
    },
    // traced from "PectoralSandpiper-1OCT2016.jpg" (3823 px, facing left) at 0.090 mm per pixel (the 27.5 mm culmen
    // spans 305 px), hip at (2400, 1200); up and down measured along the spine normal to the bird's silhouette, the
    // spine low through the neck and head
    profile: [
      { label: 'rear',     x: -0.0846, y: 0.0081, up: 0.0029, down: 0.0031, halfWidth: 0.0026 },
      { label: 'rump',     x: -0.0684, y: 0.0063, up: 0.0064, down: 0.0048, halfWidth: 0.0048 },
      { label: 'tailBase', x: -0.0369, y: 0.0009, up: 0.0180, down: 0.0194, halfWidth: 0.0150 },
      { label: 'hip',      x: 0.0000, y: 0.0000, up: 0.0276, down: 0.0279, halfWidth: 0.0183 },
      { label: 'flank',    x: 0.0198, y: 0.0018, up: 0.0277, down: 0.0274, halfWidth: 0.0182 },
      { label: 'breast',   x: 0.0347, y: 0.0077, up: 0.0252, down: 0.0211, halfWidth: 0.0162 },
      { label: 'neckBase', x: 0.0461, y: 0.0153, up: 0.0209, down: 0.0135, halfWidth: 0.0127 },
      { label: 'neckMid',  x: 0.0529, y: 0.0234, up: 0.0158, down: 0.0103, halfWidth: 0.0104 },
      { label: 'nape',     x: 0.0565, y: 0.0306, up: 0.0107, down: 0.0100, halfWidth: 0.0087 },
      { label: 'occiput',  x: 0.0594, y: 0.0347, up: 0.0120, down: 0.0095, halfWidth: 0.0090 },
      { label: 'crown',    x: 0.0632, y: 0.0373, up: 0.0157, down: 0.0089, halfWidth: 0.0101 },
      { label: 'eye',      x: 0.0671, y: 0.0389, up: 0.0152, down: 0.0088, halfWidth: 0.0099 },
      { label: 'lores',    x: 0.0735, y: 0.0387, up: 0.0106, down: 0.0076, halfWidth: 0.0073 },
      { label: 'billBase', x: 0.0787, y: 0.0360, up: 0.0024, down: 0.0024, halfWidth: 0.0018 },
    ],
    rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
    bill: { taper: 1.2, curve: -0.02 },
    eye: { radius: 0.0025, t: 0.36, iris: '#2a1c14' },
    wing: {
      wrist: [0.0369, 0.0135], droop: 1.8,
      outline: [[0, 0.05], [0.12, 0.12], [0.3, 0.13], [0.5, 0.115], [0.7, 0.08], [0.85, 0.04], [1, 0.01]],
    },
    tail: { shape: 'rounded' },
    stepLength: 0.7,
    plumage: [
      // dark above, white below
      { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#57402c', side: '#b0916f', bottom: '#f6f4ee' },
      { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'flank', band: [0.55, 1] }, color: '#f6f4ee', soft: 2 },
      // the bib: buff, finely streaked in rows, stopping in a sharp line on the lower breast
      { kind: 'fill', where: { part: 'skin', from: 'flank', to: 'neckMid', band: [0.42, 1] }, color: '#d8c19e', soft: 0.5 },
      { kind: 'streaks', where: { part: 'skin', from: 'flank', to: 'nape', band: [0.4, 0.98] }, color: '#5a3e26', length: 1.8, width: 0.55, spacing: 1.3, blur: 0.2, soft: 0.5, opacity: 0.85 },
      { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'billBase', band: [0.72, 1] }, color: '#efe8da', soft: 1.2 },
      // mantle and scapulars: black centres, rufous fringes above, buff and white below
      { kind: 'feathers', where: { part: 'skin', from: 'rump', to: 'neckBase', band: [0, 0.34] }, length: 8, width: 6.5, center: '#23180f', edge: '#c0743a', edgeWidth: 1.4, soft: 2 },
      { kind: 'feathers', where: { part: 'skin', from: 'rump', to: 'breast', band: [0.3, 0.46] }, length: 8, width: 6.5, center: '#2a1d13', edge: '#d9c6a2', edgeWidth: 1.3, soft: 2 },
      // the white braces: outer scapular edges lining up into a V down each side of the mantle
      { kind: 'stripe', from: { at: 'tailBase', t: 0.2 }, to: { at: 'neckBase', t: 0.1 }, width: 1.4, color: '#f5f1e8', blur: 0.4 },
      // a rufous-brown cap streaked black
      { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'lores', band: [0, 0.24] }, color: '#83502a', soft: 1.5 },
      { kind: 'streaks', where: { part: 'skin', from: 'nape', to: 'lores', band: [0, 0.24] }, color: '#231710', length: 1.6, width: 0.45, spacing: 1.1, blur: 0.2, soft: 1.5 },
      // a faint pale eyebrow, dusky lores, streaked buff cheeks
      { kind: 'stripe', from: { at: 'lores', t: 0.3 }, to: { at: 'occiput', t: 0.32 }, width: 1.2, color: '#e6dccb', blur: 0.6, opacity: 0.55 },
      { kind: 'stripe', from: { at: 'billBase', t: 0.5 }, to: { at: 'eye', t: 0.42 }, width: 0.9, color: '#6a5440', blur: 0.3 },
      { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'eye', band: [0.34, 0.58] }, color: '#c3a47e', soft: 1.5 },
      { kind: 'streaks', where: { part: 'skin', from: 'occiput', to: 'lores', band: [0.34, 0.6] }, color: '#6b4d32', length: 1.2, width: 0.35, spacing: 1.1, blur: 0.2, soft: 1.5, opacity: 0.7 },
      // folded wing: coverts and tertials dark with rufous-buff fringes, blackish primaries
      { kind: 'fill', where: { part: 'wingFold' }, color: '#3a291b' },
      { kind: 'feathers', where: { part: 'wingFold', s: [0, 0.72] }, length: 9, width: 7, center: '#3a291b', edge: '#c78e5c', edgeWidth: 1.2, soft: 1.5 },
      { kind: 'fill', where: { part: 'wingFold', s: [0.76, 1] }, color: '#1d1611', soft: 3 },
      { kind: 'gradient', where: { part: 'wingSpread' }, axis: 's', from: 0.4, to: 1, colorA: '#5c4632', colorB: '#221a14' },
      { kind: 'fill', where: { part: 'wingUnder' }, color: '#ece8e0' },
      // tail: pale grey-brown, the pointed central pair dark
      { kind: 'fill', where: { part: 'tail' }, color: '#9a8e80' },
      { kind: 'fill', where: { part: 'tail', t: [0.35, 0.65] }, color: '#2b241e', soft: 1 },
      { kind: 'fill', where: { part: 'tailUnder' }, color: '#dfdad1' },
      // bill: blackish tip, paler olive-brown base
      { kind: 'fill', where: { part: 'bill' }, color: '#1c1a17' },
      { kind: 'fill', where: { part: 'bill', s: [0, 0.5] }, color: '#7d6c44', soft: 2 },
      { kind: 'fill', where: { part: 'legs' }, color: '#aea349' },
    ],
    variants: {},
    sources: [
      'Ridgway 1919, Bull. U.S. Natl. Mus. 50(8) pp. 267-270 (culmen, tarsus, toe, wing, tail; bill and tail shape; juvenal plumage)',
      'Ruthrauff et al. 2023, USGS adult shorebird measurements (culmen, total head)',
      'Tobias et al. 2022, AVONET (bill depth and width)',
      'Bent 1927, Bull. U.S. Natl. Mus. 142 pp. 175-176 (juvenal plumage, the bib edge, leg colour)',
      'profile traced from "PectoralSandpiper-1OCT2016.jpg" (c) ADJ82, CC BY-SA 4.0, https://commons.wikimedia.org/wiki/File:PectoralSandpiper-1OCT2016.jpg',
      'juvenal plumage from "Pectoral Sandpiper (Calidris melanotos) (29119997223).jpg" (c) Andrew C, CC BY 2.0, https://commons.wikimedia.org/wiki/File:Pectoral_Sandpiper_(Calidris_melanotos)_(29119997223).jpg',
      'numbers and marks: docs/research/2026-09-25-long-billed-dowitcher-pectoral-sandpiper.md',
    ],
  },
}
```

- [ ] **Step 2: Register it, and see the peck fall short**

In `src/birds/species/index.ts`, add `import { SPEC as pecsan } from './pecsan'` after the `lesyel` import, and add `pecsan` to the end of the `ALL` array (after `lesyel`).

Run: `npx vitest run src/birds/species`
Expected: one failure, `pecsan (sandpiper): at the bottom of its peck, the bill tip is on the ground`, with the tip 3.6 mm above the mud. At the sandpiper's lean of 0.3 the Pectoral's longer legs keep its bill short of the ground.

- [ ] **Step 3: The sandpiper's peck leans further**

In `src/behavior/probe.ts`, in `STYLES.sandpiper`, replace `    peck: { lean: 0.3, neckExtend: 0.5 },` with:

```ts
    // tipped far enough for the longer-legged Pectoral to reach the mud; the Least's head lifts its bill back onto it
    peck: { lean: 0.4, neckExtend: 0.5 },
```

- [ ] **Step 4: Run the tests**

Run: `npm test && npx tsc --noEmit -p .`
Expected:
- 577 tests pass.
- `pecsan` holds its measurements, never creases, keeps its stance foot planted, reaches the mud (tip at 0.0 mm), and slips under 2%.
- The Least's peck tip stays at 0.0 mm, inside its −8 to +2 bounds.
- `tsc` is clean.

- [ ] **Step 5: Check it against its photo and at 22 m**

1. Download the tracing reference, a CC BY-SA photo that is never committed, to a folder outside the repo: https://upload.wikimedia.org/wikipedia/commons/d/de/PectoralSandpiper-1OCT2016.jpg
2. Run `npm run dev` and open `/viewer.html#a=pecsan&b=leasan&view=side`.
3. Load the photo in "Reference photo" and scale it so the bills coincide. Expected: the outline of back, breast, head, and tail lies on the photo's. The eye sits on the photo's eye. The bill is a few degrees less steep (see the Decisions).
4. Switch to "telescope, 22 m". Expected: the Pectoral is clearly the bigger bird. Its buff, streaked front ends against a white belly, and it has a paler bill base and yellow legs. The Least beside it shows the same pattern, smaller.
5. Save a screenshot of each view.

- [ ] **Step 6: Commit**

```bash
git add src/birds/species/pecsan.ts src/birds/species/index.ts src/behavior/probe.ts
git commit -m "feat: Pectoral Sandpiper as a field-guide plate: traced, measured, juvenile; the sandpiper's peck leans far enough for it"
```

---

### Task 8: The Long-billed Dowitcher, detailed

**Files:**
- Create: `src/birds/species/lobdow.ts`
- Modify: `src/birds/species/index.ts`

**Interfaces:**
- Consumes:
  - `foraging: 'dowitcher'` and `STYLES.dowitcher` (Task 3)
  - `probeDepth` (Task 2)
  - the detailed builder, painter, and viewer, with the viewer's water slider (Task 4)
  - the shared species tests
- Produces: `lobdow`, a juvenile, with a `detail` block.

Everything comes from the research:
- Measurements: section 9.
- Marks: section 4.1.
- Tracing reference: section 8.1.

The Decisions section explains the trace. The loft never creases. The built bird matches the photo's outline, with the eye within 0.5 mm, and it measures:

| Measure | Built |
|---|---|
| Length | 219.7 mm |
| Culmen | 66.0 mm |
| Culmen / head | 1.89 |
| Tail past the wingtips | +6.0 mm |
| Bill tip below its base line | 0.8 mm |
| Intertarsal joint, belly, folded wing's lowest point | 35.7, 52.0, 61.2 mm above the ground |
| Bill tip at the bottom of a stitch | 27.0 mm into the mud |

- [ ] **Step 1: The species file**

Create `src/birds/species/lobdow.ts`:

```ts
import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'lobdow',
  commonName: 'Long-billed Dowitcher',
  length: 0.28,
  body: { length: 1, height: 0.6, width: 0.48 },
  neck: { length: 0.12, thickness: 0.2, angle: 50 },
  head: { size: 0.3 },
  bill: { length: 0.42, thickness: 0.05, shape: 'pointed' },
  legs: { length: 0.3, thickness: 0.025 },
  tail: { length: 0.18, angle: -10 },
  wing: { length: 0.5, width: 0.2 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#4f443a', cheek: '#948e86', throat: '#d6d2ca', breast: '#a39d95', flank: '#e6e2da',
    back: '#43362b', wing: '#665c52', speculum: null, rump: '#f2f0ea', tail: '#5a534c',
    bill: '#24221f', legs: '#9a9a48', eye: '#111111',
  },
  variants: {},
  marks: {
    size: 'a chunky shorebird, stockier than a yellowlegs, on short legs',
    bill: 'a very long, straight bill, about twice the length of the head',
    head: 'a dark cap and a long pale eyebrow',
    body: 'a plain grey neck and breast; dark above with narrow rusty edges; feeds with a sewing-machine motion',
    legs: 'short, greenish-yellow legs',
  },
  wingbeatHz: 6,
  foraging: 'dowitcher',
  detail: {
    measurements: {
      length: 0.22, culmen: 0.066, billDepth: 0.0072, billWidth: 0.0045,
      tarsus: 0.0385, tibia: 0.015, toe: 0.027, wingChord: 0.143, tail: 0.056,
    },
    // traced from Les Leighton's photo (see sources; 2048 px, facing right) at 0.145 mm per pixel (the 66 mm culmen
    // spans 456 px), hip at (760, 720); up and down measured along the spine normal to a hand-read silhouette, the
    // head's depth below the spine read off the throat line (the head rests on the breast), and the fluffed back
    // trimmed 10% for a bird in September
    profile: [
      { label: 'rear',     x: -0.0638, y: -0.0254, up: 0.0066, down: 0.0058, halfWidth: 0.0055 },
      { label: 'rump',     x: -0.0479, y: -0.0217, up: 0.0099, down: 0.0129, halfWidth: 0.0098 },
      { label: 'tailBase', x: -0.0290, y: -0.0145, up: 0.0141, down: 0.0248, halfWidth: 0.0156 },
      { label: 'hip',      x: 0.0000, y: 0.0000, up: 0.0288, down: 0.0423, halfWidth: 0.0235 },
      { label: 'flank',    x: 0.0116, y: 0.0099, up: 0.0288, down: 0.0530, halfWidth: 0.0270 },
      { label: 'breast',   x: 0.0232, y: 0.0196, up: 0.0264, down: 0.0548, halfWidth: 0.0284 },
      { label: 'neckBase', x: 0.0326, y: 0.0276, up: 0.0230, down: 0.0520, halfWidth: 0.0278 },
      { label: 'neckMid',  x: 0.0393, y: 0.0334, up: 0.0247, down: 0.0474, halfWidth: 0.0288 },
      { label: 'nape',     x: 0.0447, y: 0.0383, up: 0.0216, down: 0.0411, halfWidth: 0.0263 },
      { label: 'occiput',  x: 0.0494, y: 0.0428, up: 0.0193, down: 0.0119, halfWidth: 0.0131 },
      { label: 'crown',    x: 0.0544, y: 0.0461, up: 0.0211, down: 0.0126, halfWidth: 0.0138 },
      { label: 'eye',      x: 0.0596, y: 0.0479, up: 0.0227, down: 0.0124, halfWidth: 0.0144 },
      { label: 'lores',    x: 0.0670, y: 0.0484, up: 0.0135, down: 0.0095, halfWidth: 0.0092 },
      { label: 'billBase', x: 0.0711, y: 0.0467, up: 0.0034, down: 0.0034, halfWidth: 0.0022 },
    ],
    rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
    bill: { taper: 1.7, curve: -0.012 },
    eye: { radius: 0.0027, t: 0.38, iris: '#2a1c14' },
    wing: {
      // the folded wing runs the whole length of the body: the wrist sits at the front of the breast, under the head
      wrist: [0.055, 0.0252], droop: 21.6,
      // the front third is a sliver: on a hunched dowitcher the breast feathers cover the bend of the wing
      outline: [[0, 0.005], [0.22, 0.01], [0.34, 0.1], [0.5, 0.14], [0.7, 0.1], [0.85, 0.05], [1, 0.01]],
    },
    tail: { shape: 'rounded' },
    stepLength: 0.35,
    probeDepth: 0.027,
    plumage: [
      // dark above, white below
      { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#473a2f', side: '#8e877e', bottom: '#f2f0ea' },
      { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'flank', band: [0.62, 1] }, color: '#f3f1eb', soft: 3 },
      // a plain grey hood from the chin to the lower breast, fading softly into the white belly
      { kind: 'fill', where: { part: 'skin', from: 'flank', to: 'billBase', band: [0.4, 1] }, color: '#a19b93', soft: 4 },
      { kind: 'fill', where: { part: 'skin', from: 'flank', to: 'breast', band: [0.45, 0.8] }, color: '#b9a891', soft: 3, opacity: 0.4 },
      { kind: 'spots', where: { part: 'skin', from: 'flank', to: 'breast', band: [0.45, 0.85] }, color: '#665e56', size: 0.6, spacing: 2.6, blur: 0.3, soft: 2, opacity: 0.5 },
      // flanks spotted and short-barred, heaviest behind; undertail coverts barred boldly
      { kind: 'bars', where: { part: 'skin', from: 'tailBase', to: 'flank', band: [0.55, 0.8] }, color: '#5f5851', width: 0.7, spacing: 3.2, angle: 0, blur: 0.4, soft: 2, opacity: 0.45 },
      { kind: 'bars', where: { part: 'skin', from: 'rear', to: 'tailBase', band: [0.72, 1] }, color: '#27231f', width: 1, spacing: 2.6, angle: 0, blur: 0.3, soft: 1.5 },
      // mantle and upper scapulars: blackish centres with narrow rufous fringes; lower scapulars greyer, edged buff
      { kind: 'feathers', where: { part: 'skin', from: 'rump', to: 'neckBase', band: [0, 0.38] }, length: 9, width: 7, center: '#221a14', edge: '#8d5433', edgeWidth: 0.6, soft: 2 },
      { kind: 'feathers', where: { part: 'skin', from: 'rump', to: 'breast', band: [0.34, 0.5] }, length: 9, width: 7, center: '#4b423a', edge: '#c8b08a', edgeWidth: 0.8, soft: 2 },
      // a dark cap, a long whitish eyebrow brightest in front, a dark line through the eye, grey cheeks
      { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'lores', band: [0, 0.22] }, color: '#44392f', soft: 1.5 },
      { kind: 'streaks', where: { part: 'skin', from: 'nape', to: 'lores', band: [0, 0.22] }, color: '#28201a', length: 1.6, width: 0.45, spacing: 1.2, blur: 0.2, soft: 1.5 },
      { kind: 'stripe', from: { at: 'billBase', t: 0.34 }, to: { at: 'eye', t: 0.33 }, width: 1.8, color: '#ebe7df', blur: 0.5 },
      { kind: 'stripe', from: { at: 'eye', t: 0.33 }, to: { at: 'crown', t: 0.36, dx: -4 }, width: 1.3, color: '#dcd7cd', blur: 0.6, opacity: 0.6 },
      { kind: 'stripe', from: { at: 'billBase', t: 0.48 }, to: { at: 'eye', t: 0.42 }, width: 1.3, color: '#2c2622', blur: 0.4 },
      { kind: 'stripe', from: { at: 'eye', t: 0.42 }, to: { at: 'occiput', t: 0.45 }, width: 1.6, color: '#6a625a', blur: 0.6, opacity: 0.6 },
      { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'eye', band: [0.35, 0.6] }, color: '#8c867e', soft: 1.5 },
      // folded wing: grey-brown coverts with thin buff fringes; the tertials plain dark grey-brown with thin pale
      // edges and no bars (the Short-billed's are tiger-striped); they cover the primary tips
      { kind: 'fill', where: { part: 'wingFold' }, color: '#5c5249' },
      { kind: 'feathers', where: { part: 'wingFold', s: [0, 0.55] }, length: 9, width: 7, center: '#5c5249', edge: '#c9b99e', edgeWidth: 0.7, soft: 1.5 },
      { kind: 'fill', where: { part: 'wingFold', s: [0.55, 1] }, color: '#3c342e', soft: 2 },
      // the bend of the wing, under the breast feathers: grey like the breast
      { kind: 'gradient', where: { part: 'wingFold', s: [0, 0.35] }, axis: 's', from: 0.15, to: 0.35, colorA: '#a19b93', colorB: '#5c5249' },
      { kind: 'feathers', where: { part: 'wingFold', s: [0.55, 0.97] }, length: 16, width: 10, center: '#3c342e', edge: '#b8996e', edgeWidth: 0.6, soft: 1.5 },
      { kind: 'gradient', where: { part: 'wingSpread' }, axis: 's', from: 0.4, to: 1, colorA: '#5a5048', colorB: '#221d19' },
      { kind: 'fill', where: { part: 'wingUnder' }, color: '#e6e3dd' },
      // tail: white, barred blackish across its whole length, the dark bars wider than the white
      { kind: 'fill', where: { part: 'tail' }, color: '#efece6' },
      { kind: 'bars', where: { part: 'tail' }, color: '#1f1c19', width: 3.2, spacing: 4.8, angle: 0, blur: 0.3 },
      { kind: 'fill', where: { part: 'tailUnder' }, color: '#efece6' },
      { kind: 'bars', where: { part: 'tailUnder' }, color: '#1f1c19', width: 3.2, spacing: 4.8, angle: 0, blur: 0.3 },
      // bill blackish, olive at the base
      { kind: 'fill', where: { part: 'bill' }, color: '#1f1d1b' },
      { kind: 'fill', where: { part: 'bill', s: [0, 0.4] }, color: '#5c5a3c', soft: 3 },
      { kind: 'fill', where: { part: 'legs' }, color: '#999847' },
    ],
    variants: {},
    sources: [
      'Ridgway 1919, Bull. U.S. Natl. Mus. 50(8) pp. 196-201 (culmen, tarsus, toe, wing, tail; bill, tibia and tail shape; plumage)',
      'Ruthrauff et al. 2023, USGS shorebird measurements (September juveniles: culmen, total head)',
      'Tobias et al. 2022, AVONET (bill depth and width)',
      'Bent 1927, Bull. U.S. Natl. Mus. 142 pp. 110-120 (juvenal plumage, feeding)',
      'Lee & Birch 2006, Birding 38(4) pp. 34-42 (tertials, tail bars, structure)',
      'Burton 1972 (probe depth, bill angle while feeding)',
      'profile traced from iNaturalist photo 199669733 (c) Les Leighton, CC BY-NC, https://www.inaturalist.org/photos/199669733',
      'juvenal plumage from iNaturalist photo 431840531 (c) Christopher Lindsey, CC BY-NC, https://www.inaturalist.org/photos/431840531',
      'numbers and marks: docs/research/2026-09-25-long-billed-dowitcher-pectoral-sandpiper.md',
    ],
  },
}
```

- [ ] **Step 2: Register it**

In `src/birds/species/index.ts`, add `import { SPEC as lobdow } from './lobdow'` after the `pecsan` import, and add `lobdow` to the end of the `ALL` array (after `pecsan`).

- [ ] **Step 3: Run the tests**

Run: `npm test && npx tsc --noEmit -p .`
Expected:
- 581 tests pass.
- `lobdow` holds its measurements (length within 5% of 0.22 m) and never creases (`worstFold` exactly 0).
- It keeps its stance foot planted at a step length of 0.35.
- At the stitch's bottom (lean 0.8, neck 1, reach 1) the bill tip is 27.0 mm into the mud, inside `probeDepth` ± 5 mm.
- Its foot slips under 2% while it creeps and follows.
- `tsc` is clean.

- [ ] **Step 4: Check it against its photo, in water, and at 22 m**

1. Download the tracing reference, a CC BY-NC photo that is never committed, to a folder outside the repo: https://inaturalist-open-data.s3.amazonaws.com/photos/199669733/original.jpeg
2. Run `npm run dev` and open `/viewer.html#a=lobdow&b=greyel&view=side`.
3. Load the photo in "Reference photo" and scale it so the bills coincide. Expected:
   - The outline of back, breast, head, and tail lies on the photo's.
   - The eye sits on the photo's eye.
   - The bill is a few degrees less steep, and the photo's February bird is fluffier (see the Decisions).
4. Set water depth to 4.5 cm and switch to "telescope, 22 m". Expected: a chunky, short-legged bird with a very long straight bill, plain grey breast, dark back, and pale eyebrow, clearly unlike the yellowlegs beside it.
5. Set lean 0.8, neck 1, reach 1 (the bottom of a stitch). Expected: body tipped forward, tail up, the bill straight down into the ground.
6. Save a screenshot of each view.

- [ ] **Step 5: Commit**

```bash
git add src/birds/species/lobdow.ts src/birds/species/index.ts
git commit -m "feat: Long-billed Dowitcher as a field-guide plate: traced, measured, juvenile; its bill probes 27 mm into the mud"
```

---

### Task 9: The acceptance test, and the birds in the cast

**Files:**
- Create: `src/birds/species/dowitcher-pectoral.test.ts`
- Modify: `data/locations/lake.json`

**Interfaces:**
- Consumes:
  - `lobdow`, `pecsan`, `leasan`
  - `measure` with `joint`, `belly`, `wingLow` (Task 2)
  - `STYLES.dowitcher.water` (Task 3)
  - `paintAtlas`, `regionStats`, `REGIONS`, `pixelST`, `ATLAS_SIZE`
  - the harvested catalog entries (Task 6)
- Produces:
  - Each bird held to its published ranges independently, so a later retrace can't drift out of them.
  - The dowitcher's standing heights held to the water it feeds in.
  - Six dowitchers on the bench and two Pectorals on the mudflat.

- [ ] **Step 1: Write the acceptance test**

Create `src/birds/species/dowitcher-pectoral.test.ts`:

```ts
import { parseSpeciesSpec, type SpeciesSpec } from '../spec'
import { SPEC as DOWITCHER } from './lobdow'
import { SPEC as PECTORAL } from './pecsan'
import { SPEC as LEAST } from './leasan'
import { buildDetailedBird } from '../detail/build'
import { measure, type Measures } from '../detail/measure'
import { createProfile } from '../detail/profile'
import { paintAtlas, regionStats } from '../paint/painter'
import { REGIONS, pixelST, ATLAS_SIZE } from '../paint/atlas'
import type { Part } from '../detail/spec'
import { STYLES } from '../../behavior/probe'

// Bounds from docs/research/2026-09-25-long-billed-dowitcher-pectoral-sandpiper.md, section 10 (Ridgway 1919, USGS,
// AVONET, photo-measured). Millimetres; the head is total head (bill tip to the back of the head along the bill axis)
// minus the exposed culmen, as USGS measures it.

const dowitcher = parseSpeciesSpec(DOWITCHER), pectoral = parseSpeciesSpec(PECTORAL), least = parseSpeciesSpec(LEAST)
const mm = (m: Measures): Record<keyof Measures, number> =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v * 1000])) as Record<keyof Measures, number>
const D = mm(measure(buildDetailedBird(dowitcher)))
const P = mm(measure(buildDetailedBird(pectoral)))
const L = mm(measure(buildDetailedBird(least)))

const within = (v: number, lo: number, hi: number) => {
  expect(v).toBeGreaterThanOrEqual(lo)
  expect(v).toBeLessThanOrEqual(hi)
}

describe('Long-billed Dowitcher and Pectoral Sandpiper: structure', () => {
  it('culmen', () => { within(D.culmen, 52, 79); within(P.culmen, 24, 31) })
  it('total length, bill tip to tail tip at rest (traced, shorter than a stretched specimen)', () => {
    within(D.length, 200, 300); within(P.length, 155, 235)
  })
  it('tarsus', () => { within(D.tarsus, 33.5, 42); within(P.tarsus, 24, 30) })
  it('wing chord', () => { within(D.wingChord, 136, 159); within(P.wingChord, 119, 152) })
  it('tail', () => { within(D.tail, 50, 62); within(P.tail, 50, 68) })
  it('bill against head: about twice in the dowitcher, about equal in the Pectoral', () => {
    within(D.culmen / D.head, 1.7, 2.4)
    within(P.culmen / P.head, 0.9, 1.2)
    expect(D.culmen / D.head - P.culmen / P.head).toBeGreaterThanOrEqual(0.6)
  })
  it("both bills droop a little at the tip; the dowitcher's is straight for most of its length", () => {
    within(D.billTipRise, -2, -0.2)
    within(P.billTipRise, -1.2, -0.2)
  })
  it("the dowitcher's tail reaches a little past its wingtips; the Pectoral's wingtips are about even with its tail", () => {
    within(-D.projection, 0, 12)
    within(-P.projection, -4, 4)
  })
  it('the Pectoral is half as long again as the Least: bigger, with the same pattern', () => {
    within(P.length / L.length, 1.4, 1.6)
  })
  it('the dowitcher stands with its joint, belly, and folded wing at the heights the photos give', () => {
    within(D.joint, 33, 43)
    within(D.belly, 42, 56)
    within(D.wingLow, 55, 80)
    expect(D.wingLow).toBeGreaterThanOrEqual(D.belly + 8)
  })
  it('the water it feeds in reaches its joint at the shallow end and wets its belly, not its wing, at the deep end', () => {
    const [shallow, deep] = STYLES.dowitcher.water.map(v => v * 1000) as [number, number]
    expect(Math.abs(shallow - D.joint)).toBeLessThanOrEqual(10)
    expect(deep).toBeGreaterThanOrEqual(D.belly)
    expect(deep).toBeLessThanOrEqual(D.wingLow - 5)
  })
})

/** The atlas, and ways to read it: a span of skin between station labels, or every pixel of a part as [lum, r, g, b]. */
function painted(spec: SpeciesSpec) {
  const d = spec.detail!
  const profile = createProfile(d.profile)
  const px = paintAtlas({ code: spec.code, detail: d, layers: d.plumage, profile })
  const pixels = (part: Part, s: [number, number], t: [number, number]) => {
    const r = REGIONS[part], out: [number, number, number, number][] = []
    for (let y = r.y; y < r.y + r.h; y++) {
      for (let x = r.x; x < r.x + r.w; x++) {
        const [ps, pt] = pixelST(part, x, y)
        if (ps < s[0] || ps > s[1] || pt < t[0] || pt > t[1]) continue
        const k = (y * ATLAS_SIZE + x) * 4
        const [R, G, B] = [px[k]! / 255, px[k + 1]! / 255, px[k + 2]! / 255]
        out.push([0.2126 * R + 0.7152 * G + 0.0722 * B, R, G, B])
      }
    }
    return out
  }
  return { px, profile, pixels, u: (label: string) => profile.uOf(label) }
}
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
const std = (xs: number[]) => { const m = mean(xs); return Math.sqrt(mean(xs.map(x => (x - m) ** 2))) }

describe('Long-billed Dowitcher and Pectoral Sandpiper: plumage', () => {
  const d = painted(dowitcher), p = painted(pectoral)

  it("dowitcher: the tertials' centres are plain, with no bars (a juvenile Short-billed's are tiger-striped)", () => {
    const lum = d.pixels('wingFold', [0.6, 0.95], [0.2, 0.8]).map(q => q[0]).sort((a, b) => a - b)
    expect(std(lum.slice(0, Math.floor((lum.length * 2) / 3)))).toBeLessThan(0.03)
  })
  it('dowitcher: the tail is barred along its whole length, the dark bars wider than the white', () => {
    const runs: { dark: boolean; n: number }[] = []
    for (let i = 0; i < 120; i++) {
      const m = regionStats(d.px, 'tail', [i / 120, (i + 1) / 120], [0.45, 0.55]).mean
      const dark = m < 0.35 ? true : m > 0.6 ? false : runs.at(-1)?.dark
      if (dark === undefined) continue
      if (runs.at(-1)?.dark === dark) runs.at(-1)!.n++
      else runs.push({ dark, n: 1 })
    }
    const dark = runs.filter(r => r.dark).map(r => r.n), light = runs.filter(r => !r.dark).map(r => r.n)
    expect(dark.length).toBeGreaterThanOrEqual(8)
    expect(mean(dark)).toBeGreaterThan(1.4 * mean(light))
  })
  it("dowitcher: the eyebrow is pale against the dark cap", () => {
    const brow = d.pixels('skin', [d.u('eye'), d.u('billBase')], [0.3, 0.37]).map(q => q[0]).sort((a, b) => b - a)
    const cap = d.pixels('skin', [d.u('nape'), d.u('lores')], [0, 0.15]).map(q => q[0])
    expect(mean(brow.slice(0, Math.floor(brow.length / 3)))).toBeGreaterThan(mean(cap) + 0.4)
  })
  it('both: yellow legs, the dowitcher\'s greener than the Pectoral\'s', () => {
    const [dr, dg, db] = regionStats(d.px, 'legs', [0, 1], [0, 1]).rgb
    const [pr, pg, pb] = regionStats(p.px, 'legs', [0, 1], [0, 1]).rgb
    expect(Math.min(dr, dg)).toBeGreaterThan(db + 0.25)
    expect(Math.min(pr, pg)).toBeGreaterThan(pb + 0.25)
    within(dr / dg, 0.9, 1.15); within(pr / pg, 0.9, 1.15)
    expect(dg / dr).toBeGreaterThan(pg / pr)
  })
  it('Pectoral: the streaked bib is darker than the white belly', () => {
    const bib = regionStats(p.px, 'skin', [p.u('breast'), p.u('neckMid')], [0.6, 0.95])
    const belly = regionStats(p.px, 'skin', [p.u('rump'), p.u('hip')], [0.75, 1])
    expect(bib.mean).toBeLessThan(belly.mean - 0.15)
    expect(bib.roughS).toBeGreaterThan(belly.roughS + 0.05)
  })
  it("Pectoral: the bib stops in a sharp line: the underside goes from white to streaked within 4 mm", () => {
    // 0.5 mm slices of the front midline, from behind the flank station forward to the breast
    const len = p.profile.length * 1000, u0 = p.u('hip'), u1 = p.u('breast'), slice = 0.5 / len
    let lastWhite = -Infinity, firstBib = Infinity
    for (let u = u0; u < u1; u += slice) {
      const lum = p.pixels('skin', [u, u + slice], [0.88, 1]).map(q => q[0])
      if (!lum.length) continue
      const m = mean(lum), at = (u - u0) * len
      if (m > 0.9 && firstBib === Infinity) lastWhite = at
      if (m < 0.75 && firstBib === Infinity) firstBib = at
    }
    expect(firstBib).toBeLessThan(Infinity)
    expect(firstBib - lastWhite).toBeLessThanOrEqual(4)
  })
  it("Pectoral: the scapulars' fringes are warmer than their blackish centres", () => {
    const back = p.pixels('skin', [p.u('hip'), p.u('neckBase')], [0.05, 0.34]).sort((a, b) => a[0] - b[0])
    const third = Math.floor(back.length / 3)
    const warmth = (xs: typeof back) => mean(xs.map(q => q[1] - q[3]))
    expect(warmth(back.slice(-third))).toBeGreaterThan(warmth(back.slice(0, third)) + 0.15)
  })
})
```

- [ ] **Step 2: Run it**

Run: `npx vitest run src/birds/species/dowitcher-pectoral.test.ts`
Expected: 18 pass. In the scratch run the atlas gave:
- the tertials: 0.056 luminance change across the pattern, against the barred tail's 0.148
- the tail: 12 dark bars, 6–7 slices each against 3–4 for the white
- the Pectoral's bib edge: white to streaked within 2 mm

- [ ] **Step 3: Check that the plumage tests bite**

Temporarily add to `lobdow.ts`'s plumage, just before the `wingSpread` gradient:

```ts
      { kind: 'bars', where: { part: 'wingFold', s: [0.55, 0.97] }, color: '#c8a070', width: 1.2, spacing: 3.5, angle: 0, blur: 0.3 },
```

In `pecsan.ts`, change the bib fill's and the bib streaks' `soft: 0.5` to `soft: 8`. Run the test file. Expected: the tertial test and the bib-edge test fail. Undo both changes and run it again: 18 pass.

- [ ] **Step 4: The cast**

In `data/locations/lake.json`, after the `lesyel` cast entry add:

```json
    { "species": "lobdow",  "behavior": "probe",   "zone": "bench",     "count": 6 },
    { "species": "pecsan",  "behavior": "probe",   "zone": "mudflat",   "count": 2 },
```

- [ ] **Step 5: Run the tests**

Run: `npm test && npx tsc --noEmit -p .`
Expected: 602 tests pass, including:
- `bench (probe, dowitcher) samples all agree with the terrain`
- `mudflat (probe, sandpiper)` for the Pectorals
- `lobdow (probe): no bone turns more than 0.7 rad in a frame` and the same for `pecsan`

`tsc` is clean.

- [ ] **Step 6: Commit**

```bash
git add src/birds/species/dowitcher-pectoral.test.ts data/locations/lake.json
git commit -m "feat: six Long-billed Dowitchers on the bench and two Pectoral Sandpipers on the mudflat; their structure, heights, and marks as tests"
```

---

### Task 10: The main spec, the README, performance, and the telescope check

**Files:**
- Modify: `docs/superpowers/specs/2026-09-22-lakewatch-design.md`, `README.md`

**Interfaces:**
- Consumes: the finished feature.
- Produces:
  - the main spec describing the new style, the bench, and small rings
  - the README naming `probeDepth`
  - a measured paint time
  - the user's check at the telescope

- [ ] **Step 1: Amend the main spec**

In `docs/superpowers/specs/2026-09-22-lakewatch-design.md`, in the Behaviors table, replace the `probe` row with:

```
| probe | Forage in the species' style: a plover runs, stops dead, looks, and pecks, each bird on its own; a sandpiper walks and picks in a loose group that moves together; a dowitcher stands belly-deep in a tight flock and stitches, its bill going down and up and its head dipping into the water |
```

In Animation, replace `sandpiper walk-and-pick,` with `sandpiper walk-and-pick, dowitcher stitch,`.

In the component list, make two replacements:
- `- **Terrain**: heightfield mesh for bank, mudflat, far shore.` → `- **Terrain**: heightfield mesh for bank, mudflat, far shore, and a flat underwater bench past the shallows where the dowitchers feed.`
- `ripple rings spawned by swimming birds.` → `ripple rings spawned by swimming birds, and small, short ones where a dowitcher's bill goes in.`

- [ ] **Step 2: The README**

In `README.md`, after the sentence ending `turns into a skinned, painted bird.`, add:

```
A probing species can also set `probeDepth`, how far (in metres) its bill goes into the mud at the bottom of a peck.
```

- [ ] **Step 3: Performance**

1. Run `npm run build && npx vite preview`, open the game (Playwright is fine), click Begin, and open the dev overlay with the backtick key.
2. Record the `atlases` line. Expected: `atlases 6`, `8.0 MB`, and a per-atlas time close to the baseline's on the same machine. In the scratch run that was 208–213 ms per atlas against 230–242 ms for the 4-atlas baseline, headless.
3. If the machine differs, compare against the commit before Task 1 in a second worktree:
   1. `git worktree add ../lakewatch-before <sha>`
   2. In the new worktree: `npm install && npm run build && npx vite preview --port 5199`
   3. Read its overlay the same way, and report the two numbers.
   4. `git worktree remove ../lakewatch-before`

- [ ] **Step 4: Full build**

Run: `npm run build`
Expected: typecheck, every test, and the Vite build pass, and `dist/` has no `viewer.html`.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-09-22-lakewatch-design.md README.md
git commit -m "docs: the dowitcher's stitch, the bench, and small rings in the design spec; probeDepth in the README"
```

- [ ] **Step 6: Hand the telescope to the user**

The spec's last check can't be automated. Ask the user to:
1. run `npm run dev`;
2. click Begin and open the dev overlay;
3. read the frame rate with the naked eye, with binoculars on the bench, and with the telescope on the dowitchers and on the mudflat (acceptance: 60 fps on their integrated GPU);
4. say whether the dowitchers read as dowitchers at about 25 m:
   - long bills going down and up
   - heads dipping, bodies tipped forward
   - small rings where the bills go in
   - a flock rather than a queue or a pile
5. say whether the Pectoral reads as a bigger Least with a bib that stops in a line;
6. say whether the feet stay planted and the bills reach the mud.

Whatever the user says is the acceptance result. Record it in the final report, together with the screenshots from Tasks 7 and 8.
