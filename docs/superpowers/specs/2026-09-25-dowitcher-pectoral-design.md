# Dowitcher and Pectoral: design spec

Date: 2026-09-25
Status: approved; amended during planning (see "Amended during planning")
and after the final review (motion rules, ripples, and known soft spots)
Builds on: `2026-09-25-mudflat-birds-design.md` (foraging styles, peck reach) and
`2026-09-24-detailed-birds-design.md` (the detailed builder, painter, and viewer)
Amends: `2026-09-22-lakewatch-design.md` (the probe behavior, the terrain, ripples, the cast)
Plan: `docs/superpowers/plans/2026-09-25-dowitcher-pectoral.md`

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

Success looks like this. Through the telescope, a player sees a loose flock
of dowitchers standing belly-deep on a shallow underwater bench just past the
yellowlegs. Their long bills stitch up and down, their heads dip, and small
rings spread where the bills go in. On the mudflat, a bigger, bibbed sandpiper walks and picks
among the Leasts. The legs step without sliding, and every bill reaches the
mud.

## Scope

In scope:

- Long-billed Dowitcher (`lobdow`) and Pectoral Sandpiper (`pecsan`):
  allow-listed, harvested, and given species files with `detail` blocks.
- A third foraging style, `dowitcher`, on `probe`.
- `probeDepth` on the detail block: how far the bill goes into the ground at
  the bottom of a reach.
- An underwater bench blended into the heightfield past the shallows, and a
  new zone, `bench`, on it.
- The zone-terrain tests sample the rendered terrain, not the smooth field.
- Rings on the water gain a size, so a bill going in makes a small ring.
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
| Dowitcher water | A new zone on the belly-deep contour of the existing terrain, no heightfield change. Superseded during planning by an underwater bench; see below |
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

## Amended during planning

The research and a scratch build changed these, each recorded in the plan's
"Decisions made while planning":

- **An underwater bench replaces the thin strip** (the user's decision).
  - The research set the dowitcher's water at 3.5–5.5 cm. On the existing
    terrain that band is only 8–10 cm wide, too narrow for a flock.
  - A flat shelf at −4.5 cm is blended into the heightfield over x 18–26,
    z −14 to −12, lined up with the terrain mesh's 2 m grid so it renders flat.
  - The `bench` zone on it is 7 m × 2.1 m, about 25 m from the vantage. The
    shallows are not trimmed.
- **Zones must be convex, and a dowitcher turns on the spot before it moves**,
  so it never needs the zone clamp.
- **The flock drifts** at most 1.2 m every 45 s rather than jumping anywhere
  in the zone. Its radius is 1 m, and a bird follows once more than 1.5 m from
  the target.
- **The stitch pose:**
  - the body is tipped forward 0.8 rad with the neck stretched
  - the bill rests on the mud at the top of a stroke and goes 27 mm in at the
    bottom
  - `probeDepth` is 0.027 m, inside the research's 22–45 mm; the model has no
    crouch, so 35 mm would bury the bill at rest
  - 3 strokes a second, in stitches of 2–5 s, with creeps of 3–10 cm between
    them and a 1.5–3.5 s look after 40% of stitches
- **Rings on the water come in sizes.** A dowitcher's ring is small (`size`
  0.4), short, faint, and at most one a second per bird, so six birds don't
  crowd the ducks' wakes out of the 32-ring buffer.
- **`probeDepth` raises the solvers' frame.** `reach.ts` does not change.
- **The sandpiper's peck leans 0.4.** The Pectoral's longer legs need it; the
  Least still lands exactly on the ground.
- **Three standing measures** are added to `measure.ts`: joint, belly, and
  the folded wing's lowest point.
- **Research corrections:**
  - Pectoral legs dull olive-yellow.
  - Dowitcher tertials have "duller to no" internal marks, painted plain.
  - The shallow-end rule reads "no bare *tarsus* shows"; the bare tibia sits
    above the joint.

## Changes to the Lakewatch design spec

In the Behaviors table, the `probe` row becomes:

```
| probe | Forage in the species' style: a plover runs, stops dead, looks, and pecks, each bird on its own; a sandpiper walks and picks in a loose group that moves together; a dowitcher stands belly-deep in a tight flock and stitches, its bill going down and up and its head dipping into the water |
```

In Animation, after `sandpiper walk-and-pick`, add `dowitcher stitch`.

The Terrain line gains "and a flat underwater bench past the shallows where
the dowitchers feed", and the Water line's ripple rings gain "and small, short
ones where a dowitcher's bill goes in".

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
- **The depth band** for the dowitcher's water, from the published feeding
  depths and the belly and joint heights (see The scene).
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

### The dowitcher's water

The dowitcher feeds in 3.5–5.5 cm of water (`STYLES.dowitcher.water`, from
the research). The band is checked against the built bird:

- **Shallow end:** deep enough to reach the intertarsal joint, within 10 mm.
  At the shallow end no bare tarsus shows above the water.
- **Deep end:** at least the belly's height, and at least 5 mm below the
  folded wing's lowest point. At the deep end the water wets the belly but not
  the wing.

### The bench and the `bench` zone

- **The bench:** a flat shelf 4.5 cm under the water, blended into the
  heightfield over x 18–26, z −14 to −12, easing back into the lake bed over
  a metre.
- **Grid alignment:** its edges sit on the terrain mesh's 2 m grid, so its
  top covers whole cells and renders flat.
- **What else changes:** the shelf can't be seen through the opaque water.
  Every existing zone still passes its band.
- **The zone:** `bench` is the rectangle x 18.5–25.5, z −11.8 to −13.9. It
  lies wholly inside the 3.5–5.5 cm band on the rendered terrain, about
  25 m from the vantage.
- **The shallows** keep their shape.

### Cast

Two entries are added. Everything else is unchanged.

```json
{ "species": "lobdow", "behavior": "probe", "zone": "bench", "count": 6 },
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

- **`stitch`:** the feet stay still and the body is tipped forward 0.8 rad,
  neck stretched. The bill cycles from the mud's surface (`reach` 0) to the
  bottom of the probe (`reach` 1), three strokes a second, along sin². A
  stitch lasts 2–5 s.
- **`creep`:** 3–10 cm toward a spot near the flock target at 2.5 cm/s,
  with the stitch cycle carrying on while the feet step. This is most of a
  dowitcher's movement.
- **`look`:** after 40% of stitches the head comes up to rest height for
  1.5–3.5 s, then goes back down.
- **`follow`:** when the bird is more than a set distance from the flock
  target, it walks there with its head up. It never runs; it's in water.

This state was called `wade` in brainstorming. It is renamed so it can't be
confused with the `wade` behavior.

Motion rules:

- The stitch phase carries over between `stitch` and `creep`, so the bill
  never snaps.
- `look` and `follow` ease the bill out of the stitch band and back into it.
- Every move turns on the spot first and then goes straight, so in a convex
  zone the bird never needs the zone clamp.
- With its bill in the mud (`creep`) the bird turns at no more than 2 rad/s,
  and aims within 60° of the way it faces, only as far as the zone reaches
  along that line. A spot further round is left to `follow`, which lifts the
  head and turns at the full 8 rad/s. (Added after the final review: a
  creeping bird had pivoted at 8 rad/s, a mean of 57° and up to 180°, with
  its bill down.)
- The flock target drifts at most 1.2 m every 45 s. The flock radius is 1 m,
  and a bird follows (head up, 0.12 m/s) once more than 1.5 m from the
  target.
- The drift holds only inside the zone. A target outside it goes straight to
  a point in the zone at the first retarget. (Added after the final review:
  the spawner seeds every group at the vantage, and the drift took about 14
  minutes to walk the target out to the bench, the six birds piled within
  centimetres at its near edge the whole time.)
- `PECK_BOTTOM.dowitcher` is the pose at the bottom of a stitch stroke.

### Ripples

At the bottom of a stitch stroke, `ctx.onRipple` fires at a point 12 cm
ahead of the bird, where the bill meets the water, at most once a second per
bird.

Rings on the water gain a `size` (default 1):
- `RippleBuffer.spawn(x, z, size)` keeps a ring `size` times as long, and
  the water shader scales its speed, width, and brightness by `size`.
- The dowitcher's rings are `size` 0.4: about 0.4 m across, gone in a
  second.
- Swimming and hovering birds keep full-size rings.
- When the buffer is full, a new ring replaces the one nearest the end of its
  own life (the largest `age / (RIPPLE_LIFE * size)`), not the oldest.

### Water hides what's under it

The water shader is opaque at y = 0. A dowitcher's legs, and its head when
it goes under, disappear below the surface with no rendering work.

## The bill into the mud: `probeDepth`

The detail block gains an optional `probeDepth`, in metres like the other
lengths, default 0: how far below the ground the bill tip goes at the bottom
of a reach.

- `reachDown` in `src/birds/detail/build.ts` aims at y = −`probeDepth`, in
  group space, instead of y = 0. It hands `neckSwing` and `headPitchToGround`
  its points raised by `probeDepth`, so their "meet y = 0" aims that far
  below the ground. That covers the target and the rule that pitches the
  head back up when a lean would push the tip too deep. `reach.ts` does not
  change.
- The dowitcher's value is 0.027 m: its bill goes about 40% of its length
  into the mud, and its face meets the water at each stroke.
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
  - tertials plain dark with thin pale edges and duller to no internal
    markings, painted plain (the mark that separates a juvenile from a
    juvenile Short-billed, whose tertials are tiger-striped)
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
  - dull olive-yellow legs
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
  the mudflat (about 21 m) and the bench (about 25 m).

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
| Culmen / head | about 2 (1.7–2.4, the traced feathered head) | about 1 (0.9–1.2) |
| Bill shape | tip droops slightly below straight | tip droops slightly below straight |
| Against the built Least | — | total length 1.4–1.6× the Least's |
| Standing heights | joint 33–43 mm, belly 42–56, folded wing 55–80 and at least 8 above the belly | — |
| Against its water | shallow end within 10 mm of the intertarsal joint; deep end at or above the belly and at least 5 mm below the folded wing | — |

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
  - the flock converges on the shared target, and its target never jumps
    further than its drift
  - ripples fire only at stroke bottoms, small, no more often than the table
    interval
  - the bird stays in the zone, and in a strip 0.3 m wide no frame moves it
    further than its pace (the clamp never fires)
  - the gust ruffle works when still
  - while creeping it turns no faster than 2 rad/s and stays within 60° of
    the heading the creep started from
  - a flock target seeded at the vantage is inside the zone after the first
    retarget, and six birds from such a group keep a mean nearest-neighbour
    distance above 0.2 m
- **Rings:** a small ring lives its share of a full ring's life, a ring packs
  its size for the shader, a full buffer drops the ring nearest the end of its
  own life, and `spawnCast` hands a ring's size on to the buffer.
- **The stitch against the research:** at `PECK_BOTTOM.dowitcher` the built
  dowitcher's bill tip is 22–45 mm below the ground.
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
- The `bench` zone is inside the band all over, and the bench renders flat
  on the terrain mesh.

### What tests cannot check

- The viewer's field view, in Playwright screenshots compared against the
  credited reference photos, during the work.
- Performance: six atlases (8.0 MB as the dev overlay counts them, against
  5.3 MB before) and 19 detailed birds. The dev overlay reports each atlas's
  paint time.
- The user at the telescope:
  - 60 fps on their integrated GPU
  - whether the Pectoral reads as a bigger, bibbed Least
  - whether the dowitcher line reads as dowitchers: long bills stitching,
    heads dipping, rings on the water
  - whether the six birds look like a flock or a queue

## Known soft spots

- **No spacing between birds:** two dowitchers can overlap now and then.
- **The bill at rest points 22.5° down**, against 26–37° on the photos. A
  steeper bill needs a tighter turn at the head, which creases the loft.
- **The dowitcher's folded wing is as long as its body.** Its front third is
  a sliver painted breast-grey, which shows as a faint line in close-ups.
- **The water band is the shallower half of real use:** Davis & Smith's fall
  birds fed at 6.4 cm on average, which would wet the model's wing.
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

Found while building and in the final review, and accepted for this round:

- **A notch under the dowitcher's chin** (resolved), 6.5–8.3 mm deep against
  the photo's throat, 24–34 mm above the ground.
  - Resolved: Task 5 of the swimmers round retraced the chin with section
    tilt, and the front outline is within 1.8 mm of the photo from the breast
    to the chin.
  - Cause: the loft's sections are perpendicular to the spine. Where the
    spine turns sharply, as it does with the head resting on the breast, the
    underside can't reach forward without creasing.
  - The best trace without a crease (the occiput's `down` at 24) leaves it at
    that depth.
  - The swimmer round (`2026-09-26-swimmers-design.md`, on `master`) adds a
    per-station section tilt and retraces the chin with it.
- **The tail hangs low.** The dowitcher's tail tip sits about 9 mm below the
  photo's, the tail running about 23.5° down.
  - The Greater Yellowlegs and the Pectoral show the same, so it is the
    builder's behaviour, not any one trace.
  - The swimmer round finds out why the builder's tail hangs low, and sets
    each swimmer's `tail.angle` from its trace.
- **The Pectoral's eye and forehead.**
  - The eyeball's centre is about 1.3 mm from the photo's pupil (1.0 mm back
    and 0.8 mm up; about 2.2 mm as rendered), against the plan's 1 mm.
  - The forehead is 1.3–2.9 mm full at the bill base.
  - Cause: both come from the plan's trace (the `eye` station, `eye.t`
    0.36), which was kept. The extra 0.3 mm is within hand-overlay error,
    and at 22 m 1.3 mm is 1–2 pixels at full zoom. The user's telescope check
    decides whether the eye needs retracing.
- **The ring buffer is too small for the whole cast.** With every swimmer on
  the water, its 32 rings are full in 92–97% of frames.
  - A full buffer now drops the ring nearest the end of its own life. The
    dowitchers' small rings go first, at about 70% of theirs.
  - The ducks' wakes still overflow the buffer on their own. Measured over
    5 minutes of the lake's cast, a duck's ring is dropped at about 1.7 s of
    its 2.5 s, against 1.6 s when the oldest went first.
  - The cure is a bigger buffer (the water shader's uniform array) or fewer
    wake rings per swimmer.

## Build order (as planned)

The research document came first and is committed with the plan. The plan's
tasks:

1. Rings on the water come in sizes.
2. `probeDepth` in the detailed builder, and the standing measures.
3. `dowitcher` on the spec and in `probe`: states, stride, gait, drifting
   flock, and rings, test first.
4. Viewer water depth slider.
5. The bench, the `bench` zone, and zone-terrain tests on the rendered
   surface.
6. Harvest (ask first), with the clips checked by ear.
7. Pectoral Sandpiper `detail`, and the sandpiper's peck lean.
8. Long-billed Dowitcher `detail`.
9. `dowitcher-pectoral.test.ts` and the cast entries.
10. Main spec amendments, README, performance reading, and the user's
    telescope check.

## Future rounds (not in this spec)

- Short-billed Dowitcher beside the Long-billed.
- A wet-grass margin.
- Yellowlegs feeding styles and the alarm bob, on the same `foraging` field.
- A run gait.
- Birds keeping their distance from each other.
- Section tilt in the loft, so the underside can follow a head resting on the
  breast and the dowitcher's chin can be retraced without a notch.
- The tail's angle: why the builder's tail hangs low, and a tail angle set
  from each species' trace.
- The remaining species by family.
