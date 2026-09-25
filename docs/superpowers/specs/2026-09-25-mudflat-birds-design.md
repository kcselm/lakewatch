# Mudflat birds: design spec

Date: 2026-09-25
Status: draft for review
Builds on: `2026-09-24-detailed-birds-design.md` (the detailed builder, painter, and viewer)
Amends: `2026-09-22-lakewatch-design.md` (the probe behavior)

## Purpose

Convert the two mudflat birds, Killdeer and Least Sandpiper, to detailed
birds, and give them their own way of feeding. They stand about 20 m from
the vantage, in the same telescope sweep as the detailed yellowlegs, and as
block models they now look out of place beside them.

This round is also the first test of the detailed-birds promise that the
next species "needs a spec file, not a new builder": two species with
nothing in common structurally with the yellowlegs, or with each other, on
the same pipeline.

The yellowlegs telescope check passed, and the user told the two apart
mainly by the Greater's upturned bill. Structure reads at 20 m; painted
marks read less. So this round puts structure first and checks every
separating mark in the viewer's field view at the bird's real distance, not
only in the atlas.

Success looks like: through the telescope, a player sees a big-headed,
short-billed plover with two black breast bands running, stopping dead, and
looking; and a tiny, hunched, rusty sandpiper with a fine drooping bill and
yellow-green legs walking and picking in a loose bunch; the legs step
without sliding, and every peck reaches the mud.

## Scope

In scope:

- Killdeer (`killde`) and Least Sandpiper (`leasan`) get `detail` blocks.
- A foraging style on the species spec, `plover` or `sandpiper`, that
  `probe` reads.
- `probe` drives `strideDistance` and `gait`, as `wade` does.
- A peck reaches the ground; the detailed builder's pose gains a head pitch
  if needed for that.
- The viewer's walk toggle gains a speed slider.
- A research document for both species.

Out of scope: Pectoral Sandpiper and dowitchers (the next spec: new
species, a harvest, a deeper feeding zone), yellowlegs feeding styles and
the alarm bob, a run gait distinct from the walk, flight-quality wings,
more than one plumage per species, Western Sandpiper (in the catalog, not
in the cast), new cast entries or counts.

## Decisions made in brainstorming

| Decision | Choice |
|---|---|
| Species this round | Killdeer and Least Sandpiper; Pectoral and dowitchers next round |
| Motion | Stepping legs plus per-species pacing, not the yellowlegs' styles |
| Where pacing lives | A foraging style on the species spec; `probe` holds a settings table per style (not a new behavior, not raw numbers per species) |
| Plumage | One per species: Least juvenile, Killdeer adult, confirmed by the research |
| Priority | Structure first; painted marks checked in the field view at distance |
| Killdeer tracing | A side-on Creative Commons photo found by the research, cited, never shipped; the guide keeps its current photo |
| Least tracing | The catalog photo (side-on, crouched, legs visible) |
| Builder and painter | No new layer types or geometry expected; any gap found while tracing is added with tests |

## Changes to the Lakewatch design spec

In the Behaviors table, the `probe` row becomes:

```
| probe | Forage the mudflat in the species' style: a plover runs, stops dead, looks, and pecks, each bird on its own; a sandpiper walks and picks in a loose group that moves together |
```

In Animation, `sandpiper run-stop-peck` becomes `plover run-stop-look-peck,
sandpiper walk-and-pick`.

## Research

`docs/research/2026-09-25-killdeer-least-sandpiper.md`, in the same form as
the yellowlegs research: every number cited, computed values marked,
paywalled snippets flagged as unverified. It must supply:

- **Measurements** for `detail.measurements` (length, exposed culmen, bill
  depth and width at the base, tarsus, bare tibia, middle toe, wing chord,
  tail), from Ridgway 1919 (Bull. U.S. Natl. Mus. 50, part 8, which covers
  both species), AVONET, and the USGS live-adult dataset where it has the
  species. Head length (occiput to bill base) where any source gives it or
  total head, since the bill-to-head bounds need it.
- **Late-September plumage** in the Willamette Valley: whether the Least
  Sandpipers passing are juveniles (expected: adults pass mainly in July
  and August), and whether juvenile Killdeer differ from adults at 20 m
  (expected: buff fringes only, both double-banded).
- **Field marks** of that plumage, each with a source, in the detail the
  painter needs (which feather groups, what colours, where the bands run).
- **Structure**: Killdeer's tail projection past the wingtips, eye size
  against head, bill against head; Least Sandpiper's bill droop, primary
  projection, and posture.
- **Foraging numbers** for the pacing tables: Killdeer run distance and
  speed, stop length, pecks per stop; Least Sandpiper walking speed, peck
  rate, run speed. Where no source gives a number, the document says so and
  gives a value chosen by eye against a cited video, marked as such.
- **Tracing reference** for Killdeer: a side-on photo under a Creative
  Commons licence, with the licence and URL, and the pixel scale taken from
  the bill.

## Foraging styles

### Spec and context

`SpeciesSpec` gains an optional field, validated by the zod schema in
`src/birds/spec.ts`:

```ts
/** how this species feeds when the cast puts it on `probe` */
foraging?: 'plover' | 'sandpiper'
```

`BehaviorContext` gains `foraging?: 'plover' | 'sandpiper'`; the spawner
fills it from the species spec, beside `wingbeatHz`. `probe` treats a
missing style as `sandpiper`. `killde` sets `plover`, `leasan` sets
`sandpiper`. `wade` ignores the field; the future yellowlegs round can
extend the same field to it.

### `probe`

One state machine, one settings table per style in `probe.ts`. The table's
values come from the research; the field names are settled in the plan.

**Plover** (states `run`, `look`, `peck`):

- `run`: a dash of about 0.5 to 2 m toward a random point in the zone, at
  running speed. Each bird picks its own targets; plovers ignore the
  cast's group target.
- `look`: a dead stop, body upright (`lean.x` slightly negative), neck at
  rest, for 1 to 3 s.
- After a look, either another `run` or a single `peck`: a quick tilt
  forward to the ground and back, under half a second, then `look` or
  `run`.

**Sandpiper** (states `walk`, `peck`, `run`):

- `walk`: a slow, steady walk toward a point near the group target, with a
  continuous peck cycle as it goes (the bill goes down and up while the
  feet keep stepping).
- `peck`: a few rapid probes on the spot.
- `run`: a short dash when the bird is more than a set distance from the
  group target, then back to `walk`.
- The group target works as today, so the five birds feed as a loose bunch
  that drifts across the mudflat.

**Both styles:**

- `pose.strideDistance` grows by exactly the distance moved after the zone
  clamp; `pose.gait` eases toward 1 while moving and toward 0 when still.
  The plover's gait falls fast enough that its legs stop when it stops.
- The gust ruffle (`lean.z` from the wind) applies whenever the bird is
  still, as today.

### The peck reaches the ground

At the bottom of each style's peck, the bill tip must reach the ground: the
Killdeer picks from the surface, and the Least probes a little into it.
`probe` exports each style's peck-bottom pose (`lean.x`, `neckExtend`) so
the test can apply it to the built bird.

If the detailed builder's current pose cannot get the bill there (today the
head counter-rotates to keep the bill level with the body), `pose()` tips
the head down as `neckExtend` rises past its rest value of 0.5, by an
amount set per model so the bill reaches the ground at the peck bottom.
That also lowers the yellowlegs' strike toward the water; the viewer check
covers it. The block builder is unchanged.

## The two birds

### Killdeer (`killde`), adult

- **Structure:** a plover: big rounded head, large eye, short straight bill
  well under the head's length, short neck, upright stance, long tail
  reaching well past the folded wingtips (tail shape `rounded` or `wedge`,
  per the research).
- **Marks:** two black breast bands with white between and below, the
  upper band continuing round the neck below a white collar; white
  forehead with a black bar across the forecrown; brown crown and cheek;
  white stripe behind the eye; red-orange ring round the eye; brown back
  and folded wing; orange-rufous rump and uppertail with a dark subterminal
  band and pale tips; pale flesh-grey legs.
- **Tracing:** the research's side-on reference, scaled by the culmen.

### Least Sandpiper (`leasan`), juvenile

- **Structure:** tiny (about 15 cm), hunched and horizontal, short neck,
  fine bill about the head's length with a slight droop at the tip
  (negative `curve`), wingtips about even with the tail.
- **Marks:** dark-centred back feathers and scapulars with bright rufous
  and pale edges, pale lines along the mantle; a buffy, finely streaked
  band across the breast, sharply darker than the white belly; a faint pale
  eyebrow; yellow-green legs; dark bill.
- **Tracing:** `public/media/photos/leasan.jpg`, scaled by the culmen.

### Guide text

The `marks` stay as they are except where the research corrects them.

### Cast

Unchanged: three Killdeer and five Least Sandpipers on `probe` in
`mudflat`.

## Viewer

The walk toggle gains a speed slider, from a slow walk to a Killdeer's run
speed, so the legs can be judged at the speed the game will drive them. If
the Killdeer's legs look too frantic at speed, the fix is the species'
`stepLength`, which the detail schema already has.

The rest of the viewer is used as it stands: true-scale pairs (a Killdeer
beside a Least, and each beside a Greater Yellowlegs), the field view at
20 m through the telescope and binoculars, and the reference-photo overlay
for tracing.

## Testing

### Already in place

`species.test.ts` runs over every detailed species, so both birds are held
to: bill tip to tail tip within 5% of `measurements.length`; built culmen,
tarsus, bare tibia, wing chord, and tail matching their measurements; no
fold in the loft. The shared contract suite covers the built models.

### `mudflat.test.ts`

Measured on the built mesh at rest pose, with the helpers `yellowlegs.test.ts`
uses. The research sets the numeric bounds; the shape is fixed here.

| Assertion | Killdeer | Least Sandpiper |
|---|---|---|
| Culmen, total length, tarsus, wing chord, tail | within published ranges | within published ranges |
| Culmen / head | clearly below 1 | about 1 |
| Bill shape | tip within 1 mm of straight | tip droops below straight |
| Tail tip past wingtips | clearly positive | about even |

On the painted atlas:

- Killdeer: a line down the breast midline from throat to belly reads dark,
  white, dark, white (two bands); the eye ring's hue is red-orange.
- Least Sandpiper: the scapular feather edges are warmer in hue than their
  centres; the breast band is darker than the belly; the legs are
  yellow-green in hue.

Peck reach, for every detailed species with a `foraging` style: the built
bird at its style's peck-bottom pose, standing (`gait` 0), has its
bill tip within 5 mm of the ground for the Killdeer, and between 8 mm below
and 2 mm above the ground for the Least.

### Behavior

- `probe`, both styles: `strideDistance` grows by exactly the distance
  moved; `gait` rises while moving and falls when still; the bird stays in
  the zone; the gust ruffle still works.
- Plover: every run is within the style's distance bounds; during `look`
  the bird does not move and `lean.x` is at most 0; the group target is not
  used.
- Sandpiper: position changes while `lean.x` cycles in `walk`; group
  members converge on the shared target, as today.
- Schema: an unknown `foraging` value is rejected; the spawner passes the
  species' style into the context.

### What tests cannot check

- The viewer's field view, in Playwright screenshots compared against the
  credited reference photos, during the work.
- Performance: four atlases (about 22 MB with mipmaps) and eleven detailed
  birds; the dev overlay reports each atlas's paint time.
- The user at the telescope: 60 fps on their integrated GPU; whether the
  Killdeer's bands and the Least's bill, legs, and rusty back read at 20 m;
  whether the two move like a plover and a sandpiper.

## Known soft spots

- Killdeer is traced from a photo the game does not ship; the scale comes
  from the culmen, so its accuracy rests on the published culmen.
- Some foraging numbers may be chosen by eye against video; the research
  marks which.
- Measurements are mostly from adults; juvenile Least Sandpipers in
  September may have slightly shorter bills, as the Lesser Yellowlegs did.
- The run uses the walk cycle at speed; `stepLength` is the only knob. A
  true run gait (shorter stance, longer stride) is a later round if the
  viewer shows it is needed.

## Build order (for the plan)

1. Research document (Killdeer tracing reference included).
2. `foraging` on the spec and the context; `probe` styles, stride, and
   gait, test first.
3. Peck reach: peck-bottom poses exported, the head pitch in the detailed
   pose if needed.
4. Viewer speed slider.
5. Killdeer `detail`: measurements, traced profile, plumage.
6. Least Sandpiper `detail`: the same.
7. `mudflat.test.ts`.
8. Main spec amendments, README if anything changed for players or
   authors, performance reading.
9. The user's telescope check.

## Future rounds (not in this spec)

Pectoral Sandpiper and dowitchers (harvest, a deeper feeding zone, a
stitching probe style); yellowlegs feeding styles and the alarm bob, on
the same `foraging` field; a run gait; the remaining species by family.
