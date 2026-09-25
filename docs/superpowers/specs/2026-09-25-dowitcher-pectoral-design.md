# Dowitcher and Pectoral: design spec

Date: 2026-09-25
Status: draft for review
Builds on: `2026-09-25-mudflat-birds-design.md` (foraging styles, peck reach) and
`2026-09-24-detailed-birds-design.md` (the detailed builder, painter, and viewer)
Amends: `2026-09-22-lakewatch-design.md` (the probe behavior, the cast)

## Purpose

Add the two shorebirds the mudflat round held back: a Long-billed Dowitcher
flock feeding belly-deep just past the yellowlegs, and Pectoral Sandpipers
feeding among the Least Sandpipers. Both are new to the game. They come in
through the harvest and are detailed from the start, with no block-model
stage.

Each brings an identification a birder makes at this lake in late September:

- **Pectoral beside Least:** the same streaky brown pattern, but twice the
  bulk, a longer neck, and a breast bib that stops at a sharp line.
- **Dowitcher:** a hunched, short-legged bird with a very long bill, feeding
  in a tight flock with a sewing-machine motion, its head going into the
  water again and again.

Success looks like this. Through the telescope, a player sees a knot of
dowitchers standing belly-deep in a loose line along the water's edge. Their
long bills stitch up and down, their heads dip under, and rings spread where
the bills go in. On the mudflat, a bigger, bibbed sandpiper walks and picks
among the Leasts. The legs step without sliding, and every bill reaches the
mud.

## Scope

In scope:

- Long-billed Dowitcher (`lobdow`) and Pectoral Sandpiper (`pecsan`):
  allow-listed, harvested, and given species files with `detail` blocks.
- A third foraging style, `dowitcher`, on `probe`.
- `probeDepth` on the detail block: how far the bill goes into the ground at
  the bottom of a reach.
- A new zone, `shallows-edge`, traced on the belly-deep contour. The
  `shallows` zone is trimmed to meet it.
- The zone-terrain tests sample the rendered terrain, not the smooth field.
- The viewer's "shallow water" checkbox becomes a water depth slider.
- A research document for both species.
- Cast entries: six dowitchers and two Pectorals.

Out of scope:

- Short-billed Dowitcher.
- A wet-grass margin for the Pectorals.
- Yellowlegs feeding styles and the alarm bob.
- A run gait distinct from the walk.
- Flight-quality wings.
- More than one plumage per species.
- Birds avoiding each other (none do today).
- Western Sandpiper.

## Decisions made in brainstorming

| Decision | Choice |
|---|---|
| Which dowitcher | Long-billed only: the expected dowitcher inland in late September |
| Dowitcher water | A new zone on the belly-deep contour of the existing terrain (about 3–7 cm of water), no heightfield change |
| Pectoral placement | The existing `mudflat`, with the Leasts |
| Where stitching lives | A third foraging style on `probe`, not a style on `wade` or a new behavior |
| Pectoral motion | The `sandpiper` style, unchanged, with its own cast entry and group |
| Counts | Six dowitchers, two Pectorals |
| Plumage | One per species, juvenile expected for both, confirmed by the research |
| Size dimorphism | One model per species at the mean of the sexes |
| Ripples | Each stitch stroke rings the water, rate-limited |
| Bill into the mud | A per-species `probeDepth` in the detailed builder, default 0 |

A correction made during brainstorming: the strip was first offered as 7–10
cm of water. A dowitcher's belly is about 5 cm off the ground, so at 10 cm
the bird would look like it was swimming. Belly-deep is about 3–7 cm, and the
research sets the exact band.

## Changes to the Lakewatch design spec

In the Behaviors table, the `probe` row becomes:

```
| probe | Forage in the species' style: a plover runs, stops dead, looks, and pecks, each bird on its own; a sandpiper walks and picks in a loose group that moves together; a dowitcher stands belly-deep in a tight flock and stitches, its bill going down and up and its head dipping into the water |
```

In Animation, after `sandpiper walk-and-pick`, add `dowitcher stitch`.

## Research

`docs/research/2026-09-25-long-billed-dowitcher-pectoral-sandpiper.md`, in
the same form as the Killdeer and Least research: every number cited,
computed values marked, paywalled snippets flagged as unverified. It must
supply:

- **Measurements** for `detail.measurements`: length, exposed culmen, bill
  depth and width at the base, tarsus, bare tibia, middle toe, wing chord,
  tail, and head length or total head.
  - Sources: Ridgway 1919 (Bull. U.S. Natl. Mus. 50, part 8), AVONET, and
    the USGS live-adult dataset where it has the species.
  - Sexes reported separately. Pectoral males run about 15–20% larger than
    females, and female dowitchers have longer bills.
  - The model uses the mean of the sexes.
  - Juvenile bills may be shorter than adult ones; note it where a source
    says so.
- **Late-September age** in the Willamette Valley for both. The expectation
  is juveniles, with adults passing earlier.
- **Field marks** of that plumage, each with a source, in the detail the
  painter needs: which feather groups, what colours, and how the marks run.
- **Structure:**
  - both: bill against head, bill droop, primary projection past the
    tertials, wingtips against the tail, and posture
  - dowitcher: the height of the belly and of the intertarsal joint when
    standing
- **Foraging numbers:**
  - dowitcher: stitch strokes per second, bout length, creep speed and
    distance, how often and how long it looks up, probe depth (how much of
    the bill goes in), flock spacing, and the water depths it feeds in
  - Pectoral: walking speed and peck rate, recorded against the `sandpiper`
    table
  - Where no source gives a number, the document says so and gives a value
    chosen by eye against a cited video, marked as such.
- **The depth band** for `shallows-edge`, from the published feeding depths
  and the belly and joint heights (see The scene).
- **Tracing references:** a side-on photo of each, legs visible. The
  harvested guide photo is used if it qualifies. Otherwise the research
  finds a Creative Commons photo, cites it with licence and URL, and never
  ships it. The pixel scale is taken from the bill.

## Harvest

- `data/species-allowlist.json` gains `"lobdow": ["wetland", "shoreline"]`
  and `"pecsan": ["wetland", "shoreline"]`.
- Then `harvest:allowlist`, `harvest:taxonomy`, `harvest:media`, and
  `build:birds`. This needs the user's eBird and xeno-canto keys and the
  network, so ask before running it.
- The harvested clips are checked by ear. The dowitcher needs at least one
  clip of its sharp *keek* call, which is how birders separate it from
  Short-billed.
- A clip that doesn't fit goes on the `rejected` list in
  `data/reviews.json`, and `harvest:media` re-runs to pull the next
  recording.
- The guide's `marks` text for each species is written from the research.

## The scene

### `shallows-edge`

A new polygon zone along the belly-deep contour, just past the shallows. Its
depth band is set by the research and checked against the built bird:

- **Shallow end:** deep enough to reach the intertarsal joint, within 10 mm.
  At the shallow end no bare tibia shows above the water.
- **Deep end:** at least the belly's height and below the folded wing's
  lowest point. At the deep end the water wets the belly but not the wing.

On the rendered terrain, a band of about 3–7 cm runs from x ≈ 17 to 25 at
z ≈ −10.1 to −10.7. It is 0.26–0.46 m wide and curves with the shore. The
polygon traces that band with enough points to follow the curve.

### `shallows`

The outer edge now follows the strip's inner edge, so the two zones don't
overlap. The yellowlegs keep the ankle-deep water nearer the bank. The
existing ankle-deep test stays.

### Cast

Two entries are added. Everything else is unchanged.

```json
{ "species": "lobdow", "behavior": "probe", "zone": "shallows-edge", "count": 6 },
{ "species": "pecsan", "behavior": "probe", "zone": "mudflat", "count": 2 }
```

Each cast entry already gets its own flock group, so the Pectorals feed as
their own loose pair among the Leasts.

## The `dowitcher` foraging style

### Spec and context

`FORAGING` in `src/birds/spec.ts` becomes
`['plover', 'sandpiper', 'dowitcher']`. `lobdow` sets `dowitcher` and
`pecsan` sets `sandpiper`. `speciesTraits` already passes the style into the
context, and `probe` treats a missing style as `sandpiper`, as today.

### `probe`

A third settings table in `STYLES` and a third state machine beside
`createPlover` and `createSandpiper`, sharing `createBody`. The table's
values come from the research; its field names are settled in the plan.

States:

- **`stitch`:** the feet stay still and the body is tipped forward. The bill
  cycles between a high point in the water (`reach` about 0.7, a table
  value) and the bottom of the probe (`reach` 1), several strokes a second,
  along sin². A bout lasts a few seconds.
- **`creep`:** a few centimetres to about 20 cm toward a spot near the flock
  target, with the stitch cycle carrying on while the feet step. This is
  most of a dowitcher's movement.
- **`look`:** now and then the head comes up to rest height for 1–3 s, then
  goes back down.
- **`follow`:** when the bird is more than a set distance from the flock
  target, it walks there with its head up. It never runs; it's in water.

This state was called `wade` in brainstorming. It is renamed so it can't be
confused with the `wade` behavior.

Motion rules:

- The stitch phase carries over between `stitch` and `creep`, so the bill
  never snaps.
- `look` and `follow` ease the bill out of the stitch band and back into it.
- The flock target works as the sandpiper's does, with a smaller radius
  (about 0.6 m) and slower retargeting. The six birds stay a tight knot, and
  the narrow zone draws it into a loose line.
- `PECK_BOTTOM.dowitcher` is the pose at the bottom of a stitch stroke.

### Ripples

At the bottom of a stitch stroke, `ctx.onRipple` fires at a point ahead of
the bird, where the bill meets the water. That point is set by a table value
along the heading.

Each bird rings the water at most once per table interval (about half a
second). This uses the ripple buffer `swim` and `hover` already feed.

### Water hides what's under it

The water shader is opaque at y = 0. A dowitcher's legs, and its head when
it goes under, disappear below the surface with no rendering work.

## The bill into the mud: `probeDepth`

The detail block gains an optional `probeDepth`, in metres like the other
lengths, default 0: how far below the ground the bill tip goes at the bottom
of a reach.

- `reachDown` in `src/birds/detail/build.ts` aims at y = −`probeDepth`, in
  group space, instead of y = 0. So do `neckSwing` and `headPitchToGround`
  in `reach.ts`. That covers the target and the rule that pitches the head
  back up when a lean would push the tip too deep.
- The dowitcher's value comes from the research. It probes to most of its
  bill length, so its head reaches the water or goes under at each stroke.
- Every other species keeps 0, so the Killdeer, Least, and yellowlegs are
  unchanged.
- The README's authoring notes gain `probeDepth`.

## The two birds

### Long-billed Dowitcher (`lobdow`), juvenile

- **Structure:**
  - bulky and front-heavy, short-legged and hunched
  - the bill about twice the head's length, straight with a slight droop at
    the tip
  - the wingtips about even with the tail
- **Marks:**
  - plain grey-washed neck and breast
  - dark cap, pale eyebrow, and a dark line through the eye
  - dark-centred scapulars with narrow rufous-buff fringes
  - tertials plain dark with thin pale edges and no internal markings (the
    mark that separates a juvenile from a juvenile Short-billed)
  - finely barred flanks
  - a barred tail
  - greenish-yellow legs
- **Tracing:** the research's reference, scaled by the culmen.

### Pectoral Sandpiper (`pecsan`), juvenile

- **Structure:**
  - clearly bigger than a Least, with a small head and a longer neck
  - the bill about the head's length, with a slight droop
  - the body full in front and tapering behind
- **Marks:**
  - a finely streaked brown breast bib that ends in a sharp line against
    the white belly
  - rufous-edged crown
  - white "braces" along the mantle
  - dark-centred scapulars with rufous, buff, and white fringes
  - faint pale eyebrow
  - yellow-ochre legs
  - bill dark at the tip and paler olive at the base
- **Tracing:** the research's reference, scaled by the culmen.

Where the research corrects any mark above, the research wins, and the
species file cites it.

## Viewer

- **Water depth:** the "shallow water" checkbox becomes a slider from 0 to
  10 cm, with 0 meaning off. The water plane sits at that height above the
  ground, so the dowitcher can be judged belly-deep. An old `water=1` hash
  reads as 3 cm, today's plane.
- **Pairs to use:** a dowitcher beside a Greater Yellowlegs, and a Pectoral
  beside a Least.
- **Field view:** the telescope at 22 m, which is about the distance to both
  the mudflat (about 21 m) and the strip (about 23 m).

## Testing

### Already in place

`species.test.ts` runs over every detailed species, so both birds are held
to:

- bill tip to tail tip within 5% of `measurements.length`
- built culmen, tarsus, bare tibia, wing chord, and tail matching their
  measurements
- no fold in the loft
- no bone turning more than 0.7 rad in a frame under its cast behavior (the
  dowitcher on its stitch, the Pectoral on the sandpiper walk)

The shared contract suite covers the built models.

### `dowitcher-pectoral.test.ts`

Measured on the built mesh at rest pose, with the helpers `mudflat.test.ts`
uses. New measures (belly height, intertarsal joint height, lowest point of
the folded wing) are added to `measure.ts` with tests. The research sets the
numeric bounds; the shape is fixed here.

| Assertion | Dowitcher | Pectoral |
|---|---|---|
| Culmen, total length, tarsus, wing chord, tail | within published ranges | within published ranges |
| Culmen / head | about 2 | about 1 |
| Bill shape | tip droops slightly below straight | tip droops slightly below straight |
| Against the built Least | — | total length 1.3–1.6× the Least's |
| Against `shallows-edge` | shallow end within 10 mm of the intertarsal joint; deep end at or above the belly and below the folded wing | — |

On the painted atlas:

- **Dowitcher:**
  - the tertial centres are uniform: low variance, no bars
  - the tail alternates dark and light along its length
  - the eyebrow is paler than the crown
  - the legs are greenish-yellow in hue
- **Pectoral:**
  - down the breast midline, brightness jumps from bib to belly within a few
    millimetres, so the bib's edge is sharp
  - the bib is streaked: high local contrast
  - the scapular fringes are warmer in hue than their centres
  - the legs are yellow in hue

Peck reach:

- The built dowitcher at `PECK_BOTTOM.dowitcher`, standing, has its bill tip
  `probeDepth` ± 5 mm below the ground.
- The Pectoral is held to the Least's sandpiper bounds: 8 mm below to 2 mm
  above.

### Behavior

- **`probe`, dowitcher style:**
  - `strideDistance` grows by exactly the distance moved
  - the feet are still during `stitch`
  - `reach` stays in the stitch band during `stitch` and `creep`
  - the flock converges on the shared target
  - ripples fire only at stroke bottoms, no more often than the table
    interval
  - the bird stays in the zone
  - the gust ruffle works when still
- The existing continuity test (`reach` never changes by more than 0.35 in a
  frame) loops over all three styles.
- **Schema:** `dowitcher` is accepted, and an unknown style is still
  rejected.

### Builder

- With `probeDepth` 0, every existing species' peck bottom is where it was
  before the change.
- With a `probeDepth` set on the test shorebird, the bill tip at full reach
  sits that far below the ground, within 1 mm.

### Zone terrain

- `zoneTerrain.test.ts` samples `terrainSurface`, which the birds stand on,
  instead of the smooth heightfield. Every existing zone already passes on
  the rendered surface.
- A `probe` entry's band depends on its species' style: plover and sandpiper
  keep damp, flat ground (−0.03 to 0.5), and dowitcher gets the research's
  belly-deep band.
- `shallows` and `shallows-edge` don't overlap.

### What tests cannot check

- The viewer's field view, in Playwright screenshots compared against the
  credited reference photos, during the work.
- Performance: six atlases (about 33 MB with mipmaps) and 19 detailed birds.
  The dev overlay reports each atlas's paint time.
- The user at the telescope:
  - 60 fps on their integrated GPU
  - whether the Pectoral reads as a bigger, bibbed Least
  - whether the dowitcher line reads as dowitchers: long bills stitching,
    heads dipping, rings on the water
  - whether the six birds look like a flock or a queue

## Known soft spots

- **The strip is narrow**, so the flock moves almost in one dimension. If it
  reads as a queue at the telescope, the fallback is an underwater bench:
  a flat shelf blended into the heightfield at about −5 cm, the way the
  mudflat shelf is blended at +8 cm.
- **One size per species:** the two Pectorals are the same mean size,
  although males are much bigger than females.
- **Scale rests on the culmen:** both birds are traced from photos, so their
  scale depends on the published culmen, and juvenile bills may run short of
  adult measurements.
- **Some stitch numbers will be chosen by eye**, and the research marks
  which.
- **Legs out of sight:** the dowitcher's legs are almost entirely underwater,
  so a gait fault may hide there. The viewer's depth slider at 0 is where
  it gets checked.

## Build order (for the plan)

1. Research document, with tracing references and the depth band.
2. Harvest (ask first), with the clips checked by ear.
3. `dowitcher` on the spec and in `probe`: states, stride, gait, flock, and
   ripples, test first.
4. `probeDepth` in the detailed builder.
5. `shallows-edge`, the shallows trim, and zone-terrain tests on the
   rendered surface.
6. Viewer water depth slider.
7. Pectoral Sandpiper `detail`: measurements, traced profile, plumage.
8. Long-billed Dowitcher `detail`: the same.
9. `dowitcher-pectoral.test.ts`.
10. Cast entries, main spec amendments, README, performance reading.
11. The user's telescope check.

## Future rounds (not in this spec)

- Short-billed Dowitcher beside the Long-billed.
- A wet-grass margin.
- Yellowlegs feeding styles and the alarm bob, on the same `foraging` field.
- A run gait.
- Birds keeping their distance from each other.
- The remaining species by family.
