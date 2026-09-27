# Herons: design spec

Date: 2026-09-27
Status: draft for review
Builds on: `2026-09-26-swimmers-design.md` (version-only parts, section tilt,
per-version cast counts, spacing handed out by the spawner, the ring budget),
`2026-09-25-dowitcher-pectoral-design.md` (sized rings, the bench, zones checked
on the rendered terrain), `2026-09-25-mudflat-birds-design.md` (foraging styles,
the reach), and `2026-09-24-detailed-birds-design.md` (the detailed builder,
painter, and viewer)
Amends: `2026-09-22-lakewatch-design.md` (the wade behavior, the animation list,
the far side of the scene, the startup count)

## Purpose

The two biggest birds on the lake are still block models: a Great Blue Heron and
a Great Egret on the far shore, the birds the telescope is there for. This round
makes both detailed birds, each in the plumage a birder would see on a
Willamette Valley lake in late September, each standing in the water and feeding
the way herons feed.

They are the only two herons in the guide, and white against blue-grey is an
easy call. What this round brings is a heron that looks and moves like one:

- **Great Blue Heron, adult:** a white crown and face bordered by a black stripe
  that runs back into plumes, a blue-grey body, rusty thighs, a shaggy foreneck.
- **Great Blue Heron, juvenile:** a dark crown, no plumes, duller, with rufous
  edges to the wing coverts. The research decides how many of each.
- **Great Egret:** all white, a yellow bill whose gape line runs back past the
  eye, black legs and feet, and no plumes in September.
- **The neck:** a heron's neck is most of its silhouette. It folds until the head
  sits on the shoulders, coils in an S while the bird hunts, stretches up when it
  is alert or swallowing, and uncoils in a strike.

Success looks like this. Through the telescope at 60–66 m, a Great Blue Heron
stands knee-deep with its neck coiled. It holds still for a long time, then
uncoils in a strike that breaks the water with a ring. It swallows with its head
tipped up, and between feeding bouts it hunches with its head on its shoulders.
The egret stalks more slowly and more often. Neither bird snaps from one pose to
the next, and no crease in the skin shows at telescope zoom.

## Scope

In scope:

- Great Blue Heron (`grbher3`) and Great Egret (`greegr`) each get a `detail`
  block: traced, measured, and painted, with the plumage versions late
  September calls for.
- A chain of neck bones in the detailed builder, posed by rotation between named
  neck shapes. Species without a chain keep today's neck unchanged.
- `PoseState.headPitch`, which tips the head up.
- A version-only part may hang from the head (the adult Great Blue Heron's
  plumes).
- A `heron` foraging style on `wade`, with settings per species.
- A wading shelf along the far waterline, a new `far-shallows` zone on it, and
  zone-terrain tests.
- Herons keep their distance from each other.
- Two research documents, and the guide's `marks` text rewritten from them.
- Viewer controls for the neck.

Out of scope:

- Flight for the herons.
- Feeding styles and the alarm bob for the yellowlegs, which keep today's `wade`.
- Preening, and a head turned to the side (the chain bends only in the side
  view; no bird turns its head sideways yet).
- Disturbance: herons flushing, alarm postures caused by anything in the game.
- A heron nearer the player, and herons resting on the bank.
- Breeding plumes and colours (lores, bill, legs), which September birds don't
  show.
- Reflections of the birds in the water.
- Any other heron species.

## Decisions made in brainstorming

| Decision | Choice |
|---|---|
| Which species | Great Blue Heron and Great Egret. The yellowlegs keep today's `wade` |
| Where | The far shore, as now, standing in the water on a new wading shelf at the waterline. Today's zone sits on the dry slope behind it |
| Flight | None. Wings stay folded, as with the swimmers |
| The neck | A chain of neck bones posed by rotation between named shapes. Two traced postures blended as morph targets (rubbery midway; more postures need more traces of one bird) and a wider scale on today's two-bone neck (the neck stretches, has no kink, and its marks smear) were rejected |
| Behaviour | One `heron` style on `wade`, with a settings table per species, as the Wigeon has within `dabbler` |
| Plumage | Honest to late September, as the research finds |
| Round structure | Research first; the shared pieces proven on the Great Blue Heron as the worked example; then the egret; then the finish |

## Changes to the Lakewatch design spec

In the Behaviors table, the `wade` row becomes:

```
| wade | Forage in the species' style: a heron stands in the shallows with its neck coiled, waits, stalks a slow step at a time, strikes, swallows with its head tipped up, and hunches between feeding bouts; herons keep their distance from each other. Other waders take slow steps along a shore zone, stand still for long stretches, and strike |
```

In Animation, `heron neck extend and strike` becomes `heron stalk, strike,
swallow, and hunch`.

In Composition, the far side gains a shallow wading shelf along the waterline,
where the herons feed. In Components, Terrain gains the same shelf beside the
dowitchers' bench.

The Bird models section notes that the herons are detailed, with a neck chain,
and points here. The title card's count ("Getting the birds ready… N of 33")
takes its new total from the atlases and species this round adds.

## Research

Two documents, written first and committed with the plan, in the form of the
earlier ones:

- `docs/research/2026-09-27-great-blue-heron.md`
- `docs/research/2026-09-27-great-egret.md`

Each supplies:

- **Measurements:** total length, exposed culmen, bill depth and width, tarsus,
  bare tibia, middle toe, wing chord, tail, and neck length, with sources.
- **Late-September plumage** in the Willamette Valley and the mix of ages, from
  an iNaturalist tally, as the swimmers' documents did.
- **Field marks** a birder uses at distance, for the guide's `marks` text.
- **Structure and posture:** a measure for each neck shape, such as the head's
  height above the back as a fraction of standing height, in the hunch, the
  hunting S, and erect; the bill's angle in each; where the neck's kink sits.
- **Behaviour:** wait lengths, stalking speed and step length, strike rate,
  strike duration and angle, catch rate, swallow length, feeding bouts and
  rests, how deep each wades, and how far apart birds feed.
- **Tracing references,** kept in the scratchpad and never committed.
- **Test thresholds** and the style's settings.

The Great Blue Heron document also records which subspecies the valley's birds
are (Pacific *fannini*, *herodias*, or intergrades), since it bears on how dark
they are. The catalog already has both species' photos and calls, so no harvest
is needed.

Every number the plan uses comes from these documents. Where a document marks a
number as an estimate or as chosen by eye, the species file and the style's
settings table say so.

## The neck chain

### The rig

`detail.rig` gains an optional `neck`: an ordered list of profile labels from the
neck base to the head, inclusive, which puts a joint at each of those stations
on the traced neck. A heron lists five to seven, one at the kink of its S.

- Without `neck`, a species keeps today's `neckBase → neckMid → head`, and its
  geometry and pose prints don't change.
- The chain's extra bones are appended to `BONE_NAMES`, after every existing
  bone, so no existing bone's index moves. A species using fewer joints parks the
  spares at the head joint, carrying no weight.
- The first joint is the `neck` bone and the last the `head` bone, so `parts.neck`
  and `parts.head` keep their meaning.

Exact field and bone names are settled in the plan; the shape is fixed here.

### Skin

Weights hand off linearly between consecutive joints by arclength, as they do
today between the three neck bones. The neck bends smoothly at every joint, and
nothing stretches.

### Shapes

A chain species names three neck shapes besides its traced posture: `hunch`,
`erect`, and `strike`.

- Each shape is one bend per joint, in degrees relative to the trace. The last
  joint's bend is the head's, so a shape sets where the bill points.
- The joints only rotate. The neck keeps its traced length in every shape, and
  its painted marks stay where they were painted.
- Shapes are set by overlaying photos in the viewer, against the research's
  measure for each posture.

### Driving the neck

- For a chain species, `neckExtend` runs 0 = `hunch`, 0.5 = traced, 1 = `erect`,
  blending the joint angles linearly between neighbouring shapes. For every other
  species it keeps today's meaning.
- A `reach` of `w` blends the current neck toward `strike` by `w`. Then the reach
  solver, generalised from today's two-link `neckSwing` to the chain, turns the
  base joint just far enough to put the bill tip on its mark (`reachDepth` plus
  the species' `probeDepth` below the surface, as today), with the bill no
  steeper than `reachAngle`. On a two-bone neck it behaves exactly as today.
- `PoseState.headPitch`, in radians, positive raising the bill, default 0, turns
  the head bone after the neck shape and the reach. Every existing behaviour
  leaves it at 0, so no existing pose changes. The swallow uses it.

### A part hung from the head

A version-only part names the bone it hangs from: the body, as the Mallard
drake's curl does, or the head. One on the head moves with the head and the
neck. The adult Great Blue Heron's plumes are such a part: a `plume` kind, a thin
tapered strand trailing back from the occiput, its length and droop from the
research. The curl's geometry and prints don't change.

### Guards

Tests over every chain species:

- **Lengths kept:** in every shape, and at the blends between them, each
  segment of the chain keeps its rest length to within 0.1 mm.
- **No folds:** the posed neck's rings, measured on the skinned vertices, stay in
  order along the spine. No ring crosses its neighbour inside the skin.
- **No pass-through at the tightest fold:** in the `hunch`, and in the strike's
  blend from it, no vertex of the neck's skin lies more than 3 mm inside another
  part of the loft. That is under 2 pixels at 60 m through the telescope. Each
  species' `hunch` goes only as far as this allows.
- **Wing clearance:** the folded wing's clearance test (`wing.test.ts`) gains
  the heron poses: the hunch, the hunting S, erect, the swallow, and a strike at
  the bottom. The swimmers round found neck-base skin swinging through the wing's
  front, and the heron's neck swings further.
- **Existing birds untouched:** every existing species' geometry and pose prints
  are unchanged.

## The `heron` style

### Spec and context

`FORAGING` gains `heron`. `wade` switches on `ctx.foraging` as `probe` and `swim`
do. With no style, a bird gets today's `wade` unchanged, so the yellowlegs and
their tests don't move. Both herons set `foraging: 'heron'`. The style keeps a
settings table per species (Great Blue Heron, Great Egret), looked up by species
code as `dabblerFor` does.

### States

- **wait:** stands in the water, `neckExtend` 0.5 (the traced S), for a long time.
  Now and then it turns slowly on the spot, or peers down with `headPitch`
  a little below 0.
- **stalk:** a slow step or a few toward a nearby point on the shelf, at the
  species' speed and step length, the neck staying coiled. The egret stalks more
  often and further than the Great Blue Heron.
- **strike:** a short draw-back (`neckExtend` dips toward the hunch), then `reach`
  eases to 1 at the species' `reachAngle` and `reachDepth` over the species'
  strike time (about 0.1 s), holds, and recovers. A ring starts where the bill
  enters the water.
- **swallow:** after a strike that catches, at the species' catch rate. The neck
  goes `erect` and `headPitch` tips the bill up for a second or two, then eases
  back to wait.
- **alert:** the neck goes `erect` with the bill level, and the bird holds still.
- **hunch:** between feeding bouts. `neckExtend` eases to 0 and the bird stands in
  the water for minutes, then goes back to wait or alert.

Feeding bouts (wait, stalk, strike, swallow, with the odd alert) alternate with
rests (hunch) in the split the research gives.

### Settings

Per species, each marked in the table as measured (with its source) or chosen by
eye: wait lengths, stalk frequency, speed and step length, strike rate,
draw-back and strike times, `reachAngle`, `reachDepth`, catch rate, swallow
length and `headPitch`, alert frequency and length, bout and rest lengths,
spacing, and the water band the style stands in.

### Rings

Each strike starts one ring at the bill's entry point, of the size the research
gives for a strike, within the sizes `ripples.ts` already has. Nothing else a
heron does makes rings: no footfall rings.

The ring budget in `src/birds/cast.test.ts` adds both herons to the species that
ring the water (its `RINGS` list), and must still show nothing pushed out of the
32-ring buffer over its ten-minute runs. The plan also re-measures the whole
cast's rings at 60 fps, as the swimmers round did (ten minutes each, seeds 42, 7,
and 11), since the test steps at 10 fps for speed. Today's peaks are 28–30, and a
heron strikes about once a minute.

### Spacing

The spawner hands each heron every other heron as its neighbours, as it does for
the swimmers. A heron starts clear of them and picks stalk targets that keep at
least its spacing. Two herons are held to the larger of their two spacings. The
research sets each species' spacing: Great Blue Herons defend feeding patches,
and egrets tolerate each other closer.

### Behaviour tests

With a seeded random source, as for the other styles:

- State transitions, and each state's length within its settings.
- A strike reaches the water at the species' angle and depth, and starts one ring.
- A swallow follows only a strike that caught.
- Spacing holds over a long run: no two herons closer than their spacing.
- No snapping: at 60 fps, every pose value changes by no more per frame than its
  state's easing allows, and the strike's descent takes at least six frames.
- The bird never leaves its zone.

## The shelf and `far-shallows`

### The shelf

A new shape in `lakeHeightfield`, blended in after the detail noise, as the bench
is, so its surface stays smooth.

- A strip of lake bed along the far waterline, a few metres wide and about 36 m
  long across the telescope's usual view.
- It slopes gently from about 5 cm deep at the shore to about 30 cm on its lake
  side, and eases back into the lake bed within a metre. The research's wading
  depths and leg lengths set the final band.
- Its edges sit on the terrain mesh's 2 m grid, as the bench's do, so it renders
  cleanly.
- It lies in front of today's steep bank, which rises about half a metre per
  metre from the waterline (around z = −64) to 3 m. The herons stand 60–66 m from
  the player, a little nearer than today's `far-shore` zone (71–78 m, up the
  slope), and still telescope distance.

Exact coordinates are settled in the plan, against the rendered surface.

### The zone

`far-shallows`, a polygon inset from the shelf's edges. The herons' cast entries
move to it. `far-shore`, left unused, is removed, and the test fixture that names
it (`src/birds/paint/prepaint.test.ts`) moves to the new zone.

### Zone-terrain tests

- `GROUND_OK` gains `wade:heron`, the heron style's water band, read from the
  style's settings as `probe:dowitcher` reads its band. Every sample over the
  zone, on the rendered surface, falls inside it.
- No sample in the zone is deeper than the shorter-legged heron's tarsus, so
  every heron shows bare tibia above the water.
- A test holds the shelf's surface smooth and the zone inside it, as the bench's
  tests do.
- The yellowlegs' shallows and the dowitchers' bench keep their tests unchanged.

Nothing else in the scene changes. The terrain's colour already shades mud at the
waterline, and the water already hides what is under it, as it does the
dowitchers' legs.

## The two birds

### Great Blue Heron (`grbher3`)

Traced in its hunting S from a side-on photo, with the neck chain and its three
shapes. The adult's occipital plumes are a version-only `plume` part hung from the
head. The shaggy foreneck and the back plumes are painted and traced into the
profile, with no geometry of their own. The juvenile gets a dark crown and
rufous-edged coverts, and no plumes. The versions, their colours, and their counts
come from the research.

### Great Egret (`greegr`)

The same pipeline: traced, chained, and shaped. All white; the yellow bill's gape
line running back past the eye is painted; black legs and feet. Juveniles and
non-breeding adults look alike in September, so it probably has one version; the
research confirms.

### Atlas detail

Through the telescope at 63 m, on a 1080-pixel-tall view, a pixel covers about
2 mm. Over each heron's head the atlas must be no coarser than that, so the Great
Blue Heron's crown stripe and the egret's gape line hold. `profile.ts` reports
millimetres per texel; where the default atlas is coarser, that species' atlas is
larger.

### Guide text

Each species' `marks` are rewritten from its research's field marks, for the
versions the player will see: no breeding plumes, and the juvenile Great Blue
Heron's dark crown.

## The cast

The research sets the counts and the plumage versions, and each cast entry gives
exact counts per version, as the swimmers' entries do. Expected: two to five
herons in all, perhaps an adult and a juvenile Great Blue Heron and one to three
egrets. Great Egrets gather after breeding in the Willamette Valley, so the
research may argue for more. The counts must fit the shelf with the style's
spacing.

## Viewer

- For chain species, sliders for `neckExtend`, `reach`, and `headPitch`, and a
  choice of the named shapes, so each shape can be set against its photo.
- The field view at telescope distance (60–66 m) and the water depth slider,
  both already there, check each heron as the player will see it.

## Testing

### Already in place

The geometry and pose fingerprints, the folded wing's clearance, the zone-terrain
tests, the ring budget, and the whole-cast tests. All of them keep passing, and
every existing species' prints stay unchanged.

### Builder

- The neck chain's guards (lengths, folds, pass-through, wing clearance), above.
- `neckExtend` blends between neighbouring shapes, and `reach` reaches the water
  at `reachAngle` on a chain.
- `headPitch` turns only the head, and at 0 changes nothing.
- A head-hung part moves with the head; a body-hung part (the curl) doesn't.

### Species: `herons.test.ts`

- Measurements against the research: bill tip to tail tip within 5% of total
  length, bill against head, tarsus, bare tibia.
- Standing height, and each shape's head height against the research's measure
  for that posture.
- Plumage marks on the right versions: the adult's white crown and black stripe,
  the juvenile's dark crown, the egret's gape line.
- The plumes shown on the adult only.
- Standing in `far-shallows`, each bird's feet are on the bed and its tibia above
  the water.

### Behaviour

As in "Behaviour tests", above.

### Scene

- The shelf and zone tests, above.
- The startup count gains the new atlases and species; the whole cast still
  builds within the cast tests' timeout.

### What tests cannot check

By eye, in the viewer at telescope distance for every task, and in the game at the
end: whether the neck reads as a heron's in every shape, whether the strike looks
fast and the swallow natural, whether the birds sit at the right depth, whether
anything snaps, and the frame rate on the user's integrated GPU. The user's
telescope check is the acceptance.

## Performance

Two more detailed species and their atlases. The plan records, as the swimmers
round did (headless Chromium on this machine, two loads each, noted as saying
little about a real GPU): the atlases' count and memory, the time to Begin, the
longest pause, and the frame rate with the telescope on the far shallows. It
compares them against the build before this round.

## Known soft spots (expected)

To be confirmed or corrected when the round lands:

- **Skin compresses inside the hunch.** The loft has no volume of its own, so the
  throat's skin folds inward where the neck folds tightest. The pass-through
  guard bounds it.
- **No preening,** and no head turned to the side.
- **One size per species,** at the mean of the sexes; male Great Blue Herons are
  larger.
- **Shapes are set by eye** against photos, within the research's posture
  measures.
- **Behaviour rests on few birds.** Heron studies mostly measure strike and catch
  rates in other seasons and regions; each number's source is marked.

## Build order

1. Research: the two documents, written in parallel.
2. The neck chain, `headPitch`, and the head-hung part, proven in the viewer on a
   test bird, with the builder tests.
3. The shelf and `far-shallows`, with the zone-terrain tests.
4. The `heron` style, test first.
5. The Great Blue Heron, detailed, with its tests: the worked example.
6. The Great Egret, detailed, with its tests.
7. The cast, the main spec and README, performance, and the user's telescope
   check.

The work runs on one branch, `herons`, in a worktree. The plan decides who does
each task.

## Future rounds (not in this spec)

- Flight for the herons, and for the other detailed birds.
- A head that turns to the side, and preening.
- Herons flushing with a croak when disturbed.
- Herons resting on the bank.
- Feeding styles and the alarm bob for the yellowlegs.
- The Kingfisher and the geese, which the neck chain will serve.
- The reed perchers and the flyover flocks.
