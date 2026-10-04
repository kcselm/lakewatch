# Canada Goose, round 1 (on the water and on the grass): design spec

Date: 2026-09-30
Status: draft for review
Builds on: `2026-09-27-herons-design.md` (the neck chain, neck shapes,
`headPitch`, the zone-terrain bands), `2026-09-26-swimmers-design.md` (the
detailed builder's float, the `dabbler` style, spacing handed out by the
spawner, the ring budget), `2026-09-30-water-design.md` (the birds in the water:
contact lines, the Kelvin wake), and `2026-09-24-detailed-birds-design.md` (the
detailed builder, painter, and viewer)
Amends: `2026-09-22-lakewatch-design.md` (the swim behavior, the composition and
terrain, the cast, the startup count)

## Purpose

The Canada Goose is the bird every visitor to a valley lake knows, and in the
game it is still only a block-model V that crosses the sky every few minutes.
This is the first of three goose rounds:

1. **This round:** a detailed goose that floats on the lake, walks out onto a
   grassy flat to graze, and walks back in. No flight.
2. **Flight:** the flyover V made of detailed geese with real wingbeats.
3. **Arrivals and departures:** a V that sets its wings and splashes down, and
   a family that tosses its heads and runs off the water into the air.

What this round brings is a goose that looks and lives like one:

- **The bird:** the resident Western Canada Goose (*Branta canadensis
  moffitti*), large, with a black stocking, a white chinstrap, a silvery-pale
  breast, a brown back with pale bars, and a white undertail.
- **The family:** a gander, a goose, and their three young of the year move
  together. They loaf and feed on the water, swim to the shore in a loose file,
  step out, and graze on a short-grass flat within a few metres of the water.
  After a while they walk back in.
- **Watching:** while they graze, every goose keeps its own rhythm of grazing
  with its head down and looking up. The gander looks up most and the young
  hardly at all, so one or two heads are usually up and now and then none.
  Nobody posts a sentinel, because the field studies find that geese don't.

Success looks like this. Through binoculars at 30–40 m, a family of five geese
grazes on the flat. The chinstraps catch the light as heads come up and go
down, never all together. The walk has the goose's slow, rolling step. A little
later the gander turns for the water, the others follow in a loose file, and
each one steps off the bank and settles to its float without a jump. On the
water the geese dip their heads and necks under, and now and then one tips up.
No goose stands in the water as if it were land, floats on the grass, or snaps
from one pose to the next.

## Scope

In scope:

- The Canada Goose (`cangoo`) gets a `detail` block: traced, measured, and
  painted in one version, `adult`.
- An **amphibious** detailed bird: one model that can float and stand, and moves
  smoothly between the two at the shore.
- The herons' neck chain on a swimming bird, with the shapes a goose needs.
- A waddle: the body rolls in time with the steps, set per species.
- A `goose` style on `swim`: feeding and loafing on the water, walking out
  through a named shore zone, grazing, and walking back. Each bird has its own
  head-down and head-up cycle, set by its role in the family.
- Families: a cast entry can give the group sizes, and the style knows each
  bird's role.
- A grassy flat on the right shore past the mudflat, a zone on it, grass on it,
  and zone-terrain tests.
- The water reads whether each bird is floating or standing from its pose, not
  from its cast behavior.
- The guide's `marks` rewritten from the research.
- Viewer controls for the float and the stand, and a walk that works for a
  swimming species.

Out of scope:

- Flight of any kind: the flyover keeps its block-model V and its 2.6 Hz
  wingbeat until round 2, though the research measured about 4 Hz.
- Takeoff, landing, and preflight head-tossing (round 3).
- The Cackling Goose. The research finds it scarce in late September and at its
  peak in late October. It belongs with an October or winter scene.
- The Dusky Canada Goose and other dark-breasted forms, which arrive mostly
  after October.
- Threat displays, chases, honking in chorus, and the white neck collars some
  valley geese carry.
- Preening on land, and sleeping with the bill tucked in.
- Flushing the geese: nothing in the game disturbs them yet.
- Goslings in down: by late September the young are full grown.

## Decisions made in brainstorming

| Decision | Choice |
|---|---|
| Rounds | Three: on the water and on the grass (this round), flight, then arrivals and departures |
| Where | On the lake, and on a grassy flat at mid-distance on the right shore past the mudflat, about 30–40 m from the vantage, a binocular view |
| Water and grass | One family walks out of the water to graze and later walks back in. Two fixed groups (swimmers who never land and grazers who never swim) were rejected: the walk in and out is the goose |
| Behaviours | Head-up vigilance and tipping up on the water. Threat displays and chases and honking in chorus are left for later |
| Vigilance | Every bird keeps its own grazing and alert cycle, set by its role. A posted sentinel who takes turns with the others was the first idea, but the field studies find no such coordination, so the research overruled it |
| Neck | The herons' neck chain, without a kink. The swimmers' two-bone neck would stretch and smear in the grazing and erect shapes |
| Rhythm | A repeating cycle of water and grass, so a player who stays sees both. Once a visit was closer to a real morning but easy to miss; a shortened cycle was rejected as false to the research |
| Cackling Goose | Not this round: scarce in late September (research section 3.4) |
| Round structure | Research first (done), then the amphibious builder proven in the viewer, the terrain, the style, the bird, and the finish |

## Changes to the Lakewatch design spec

In the Behaviors table, the `swim` row gains, after its existing styles:

```
The goose style: a family loafs, head-dips and now and then tips up on the water, swims to the shore in a loose file, steps out onto the grass, and grazes, each bird lifting its head to look about on its own rhythm (the gander most, the young least), then walks back in
```

In Animation, add `goose walk out, graze, look up, walk in`.

In Composition, the right shore past the mudflat gains a low grassy flat that
slopes gently into the water. In Components, Terrain gains the same flat, and
Vegetation gains short grass on it.

The Bird models section notes that the Canada Goose on the lake is detailed and
amphibious, and points here; the flyover stays a block model. The title card's
count ("Getting the birds ready… N of 38") gains one atlas and one species.

## Research

`docs/research/2026-09-30-canada-goose.md`, written for this round, supplies
every number below. It is committed with the plan. Where it marks a number as
an estimate or photo-measured, the species file and the style's settings say so.

Its findings that set the design:

- **Who is on the lake** (section 3): almost all resident *moffitti* in late
  September. The Duskies' mean arrival is 31 October to 14 November.
- **One version** (section 3.5): the young of the year are four to six months
  old, full grown, and only slightly duller. At 30–40 m they read as adults, and
  none of 120 local photos could be aged.
- **Measurements** (section 2.6): exposed culmen 56 mm, wing chord 489, tail
  151, tarsus 92, middle toe 82, from Aldrich's sexed *moffitti*; mass about
  4.0 kg (estimate). Traced length on a floating bird about 0.64 m.
- **Floating** (section 2.7, 6.1): back 0.13 m above the water, crown 0.24 m at
  rest, waterline length 0.50 m, draft about 0.06 m (photo-measured, medium to
  low confidence).
- **Neck shapes** (section 6.2): crown above the back 0.10–0.17 m floating at
  rest, about 0.23 m standing relaxed, 0.30–0.40 m erect; grazing with the neck
  leaving the body level and bending down 55–65° near the head, the bill about
  0.17 m ahead of the toes; tip-up with the body 75–80° from level. No kink.
- **The group** (section 7.5): about eight. A family of five (the pair and
  three young), and a loose unit of three that stays on the water near the
  shore.
- **Vigilance** (sections 7.4, 11.2): sourced bout means for the gander and the
  goose, estimates for the young, a longer head-up near the group's edge, and no
  coordination.
- **Order** (section 7.5): any bird may lead, but the family follows the
  gander's change of heading.
- **The shore** (section 7.6): banks over 0.5 m high and steeper than 60° stop
  geese; they graze within about 5–20 m of the water.

## The amphibious bird

### Why

Today the detailed builder fixes, at build time, whether a bird floats or
stands (`src/birds/detail/build.ts`). A floating bird's origin is its waterline
at mid-hull, and its legs fold back, hidden unless it paddles; `pose()` ignores
`gait` and `strideDistance`. A standing bird's origin is between its feet, and
its legs walk by two-bone IK. A goose needs both, and needs to pass from one to
the other in front of the player.

### The model

A species is **amphibious** when it has both `float` and the standing legs'
measurements (tarsus, tibia, toe). The Canada Goose is the only one. Every other
species builds and poses exactly as today, and its prints don't change.

`PoseState` gains **`afloat`**, 0 to 1:

- **1 (floating):** today's swimming pose. The origin is the waterline at
  mid-hull, the legs are folded and hidden unless `paddle` is above 0, and
  `gait` is ignored.
- **0 (standing):** today's standing pose. The origin is on the ground between
  the feet, the legs stand and walk by IK, and the webbed feet show.
- **Between:** the body's height above the origin blends between the two, and
  the legs blend from folded to standing. A goose stepping out of the water
  rises from its float to its standing height as the bed comes up under its
  feet.

The behavior sets the bird's world `y` and `afloat` together. On water deep
enough to float, `y` is 0 and `afloat` 1. On dry ground `y` is the ground and
`afloat` 0. In the strip between, where the bed is shallower than the floating
bird's draft plus its leg, the bird wades. Its feet are on the bed, its body
can't sink below its float, and `afloat` follows from the depth. The plan
settles the exact rule. What matters is that there is no jump in the body's
height or the legs' length from one frame to the next.

For an amphibious species the default is `afloat` 1, so it builds and shows as
a floating bird wherever nothing says otherwise.

### Legs and feet

- The standing legs come from the research's tarsus, tibia, and toe, with
  webbed feet, as the swimmers' feet are built today.
- Paddling while floating stays as it is.
- The legs are skinned once and the blend moves their bones: there is one
  mesh, not two models swapped at the shore.

### The waddle

`detail.waddle`, in degrees: how far the body rolls toward the planted foot at
full `gait`. The builder adds it in time with the stride it already tracks, so
the roll and the steps can't drift apart. The default is 0, so no existing
species changes. The goose's is 5° (research section 11.3, from one photo, low
confidence; tuned by eye).

### Guards

Tests over the amphibious species:

- **No jump:** stepping `afloat` from 1 to 0 in small steps, the body's height
  and every leg bone's position change smoothly, with no frame-to-frame jump
  beyond what the step size allows.
- **The float is today's:** at `afloat` 1 the posed bird matches a floating
  build of the same species.
- **Feet down:** at `afloat` 0 the feet are on the origin's ground plane,
  standing and walking, as the standing birds' are.
- **No skin through the water at the float:** at `afloat` 1 and `paddle` 0 the
  legs are hidden, as today.
- **Wing clearance:** the folded wing's test gains the goose's poses: floating
  at rest, erect, head-dip, tip-up, standing, walking with the waddle, and
  grazing.
- **Existing birds untouched:** every existing species' geometry and pose prints
  are unchanged.

## The neck

The goose takes the herons' chain (`rig.neck`, five or six joints, no kink),
traced in its floating rest posture. The traced posture should come from a
floating bird, because that is the pose the player sees most and the one the
float's tests measure.

Its shapes:

- **`hunch`:** loafing on the water, with the neck drawn down into a short S and
  the head over the breast (crown 0.10 m above the back).
- **`erect`:** alert, with the neck straight and upright and the bill near level
  (crown 0.30–0.40 m above the back).
- **`strike`:** the low reaching neck the goose grazes and head-dips with. It
  leaves the body nearly level and bends down near the head. With `reach`, the
  chain solver puts the bill on the grass about 0.17 m ahead of the toes, or
  under the water for a head-dip. On a goose the shape keeps the name `strike`,
  since the builder only knows it as the shape `reach` blends toward. The style
  names the states.

Standing relaxed (crown about 0.23 m above the back) sits between the trace and
`erect`, at a `neckExtend` the species file gives.

The herons' guards (lengths kept, no folds, no pass-through, wing clearance)
run over the goose's shapes too. The plan decides whether the goose's
`strike`, aimed at the ground rather than the water, needs `reachDepth`'s
negative case, as the heron's strike did.

## The `goose` style

### Spec and context

`FORAGING` gains `goose`, a style on `swim`. `createSwim` switches on it, as it
does for `coot` and `grebe`. The style has one settings table, the Canada
Goose's (research section 11), with each value marked sourced, computed, or
estimated.

The style swims as the other swimmers do, keeping clear of every other swimmer
and of its own flock at the flock spacing. On top of that, the family leaves
its water zone through the shore into its **ashore zone**, which the cast entry
names (see "The cast"), and comes back. No other style leaves its zone, and
none starts to.

### Roles

The cast entry gives the group sizes (here a family of five and a loose unit of
three). The style gives each bird a role from its place in its group:

- In a family: the first bird is the **gander**, the second the **goose**, and
  the rest **young**.
- In a loose unit, every bird is an **adult**, a paired bird without young.

Only a family goes ashore. A loose unit stays on the water near the shore, as
the research recommends.

Roles have no plumage of their own: there is one version.

### States on the water

As the `dabbler` style, from the goose's settings:

- **loaf:** drifting, with the neck in `hunch`, for minutes.
- **cruise:** swimming from spot to spot near the flock.
- **headDip:** the head and neck go under, the body level. Each dip starts a
  small ring.
- **tipUp:** the body tips up 75–80°, with the tail and feet in the air. Each
  starts a ring. Tip-ups are rarer than head-dips (about a quarter of feeding),
  because the local photos showed head-dips and no tip-ups.
- **preen:** for a short spell.
- **alert:** the neck goes `erect`.

The research's water shares (feeding 0.40, cruising 0.26, loafing 0.24,
preening 0.06, alert 0.04) set how often each state comes.

### Ashore and back

The family's cycle:

1. **On the water**, for 5–20 min (estimate), in the states above.
2. **To the shore:** the gander turns for a spot on the shore by the flat and
   holds the heading. The family follows in a loose file, 1–2 body lengths
   apart, at the cruise speed. Any bird may be in front (gander 0.4, goose 0.3,
   a young bird 0.3; estimates), but the family goes where the gander goes.
3. **Out:** each bird wades up the bank, and its `afloat` falls to 0 as the bed
   rises. It stands for 5–20 s, and some shake.
4. **To the grass:** a walk of 0.3–0.5 m/s, with steps of 0.14–0.18 m and the
   waddle, out to a spot 5–20 m from the water.
5. **Grazing**, for 20–60 min (estimate), spreading to 0.8–2 m apart (below).
6. **Back:** the gander turns for the water, and the family follows in file,
   wades in, and its `afloat` rises to 1. Back on the water, it loafs for a
   while and the cycle starts again.

A scene opens at a random point in the cycle, so the family is sometimes on the
grass when the player arrives.

The shore spot is chosen where the bank meets the water within the slope the
geese can walk (see "The flat"). The walk out and back follows the ground, with
`y` and `afloat` set as "The amphibious bird" describes.

### Grazing and looking up

On the grass each bird runs its own cycle, independent of the others:

- **head-down:** grazing with the neck in `strike` and `reach` on the grass,
  plucking at about 0.9 bites a second. Each bite is a small dip and pull of the
  bill. It takes a slow step now and then, every 2–4 s, drifting 0.03–0.08 m/s.
- **head-up:** standing still with the neck `erect` and the bill near level.

Bout lengths by role (research section 11.2):

| | Head-down | Head-up |
|---|---|---|
| Gander | 5–12 s (mean 8.4, sourced) | 4–12 s (mean 8.0, sourced) |
| Goose | 7–15 s (mean 10.7, sourced) | 3–8 s (mean 5.6, sourced) |
| Young | 15–40 s (estimate) | 1–3 s (estimate) |

A bird on the edge of the group, furthest from its centre, has head-up bouts
1.3 times as long (estimate; edge birds look up more). Nothing ties one bird's
bouts to another's.

What a family of five shows, computed by the research: about 77% of birds
head-down at a time, usually one or two heads up, and now and then none.

### Spacing

- On the water: the flock spacing 0.8 m within the family and 1.5 m to other
  birds (estimates; nothing measured).
- In file to and from the shore: 0.6–1.3 m between birds.
- On the grass: 0.8–2 m apart.
- The geese stay in the shared swimmers' list, so every other swimmer keeps
  clear of a goose on the water, as today.

### Rings

A head-dip and a tip-up each start a ring, as the dabblers' do, sized from the
research. Wading in and out starts one small ring at the bird's breast. Nothing
on the grass rings the water.

The ring budget (`src/birds/cast.test.ts`) adds the geese and must still show
nothing pushed out over its ten-minute runs. The plan re-measures the whole
cast at 60 fps (seeds 42, 7, and 11), as the earlier rounds did.

### Behaviour tests

With a seeded random source, as for the other styles:

- State transitions on the water, and each state's length within its settings.
- The cycle: the family leaves the water, grazes, and comes back, each stage
  within its time range. The loose unit never leaves the water.
- The family follows the gander. Over a long run the file's order varies, and
  the birds walk out where the gander turns.
- `y` and `afloat` agree with the ground everywhere a goose goes. A bird is
  never on dry ground with `afloat` above 0, nor on water deep enough to float
  with `afloat` 0.
- A goose ashore never leaves the ashore zone, and a goose on the water never
  leaves its water zone except by the shore.
- Vigilance: over a long run, each role's share of time head-up while grazing
  is within its range (gander about 0.49, goose about 0.34, young about 0.07).
  Two birds' bouts are uncorrelated.
- Spacing holds on the water and on the grass.
- No snapping: at 60 fps every pose value, `afloat` among them, changes by no
  more per frame than its state's easing allows.

## The water reads the pose

`src/world/floaters.ts` decides whether a bird in the water is a swimmer or a
wader from its cast behavior, which never changes. A goose on the grass would
pass as out of the water, but a goose wading in the shallows would be drawn as
a swimmer, and a goose cast as a swimmer and standing would be wrong.

Each bird's registry entry gains whether it floats this frame, from its pose
(`afloat` above one half). A floating bird gets the swimmer's contact line, and
its Kelvin wake when under way. A bird standing in the water gets the wader's
ring at its legs. Every existing bird's look doesn't change, since a swimmer's
`afloat` is always 1 and a wader's is 0.

## The flat

### The shape

A new shape in `lakeHeightfield`, blended in after the detail noise, as the
mudflat and bench are:

- A low grassy flat on the right shore past the mudflat. It is around x 28–42,
  z −6 to −22, about 30–40 m from the vantage, beyond the shorebirds' mudflat
  and bench. Exact coordinates are settled in the plan against the rendered
  surface.
- Its top is gently uneven, a few tens of centimetres above the water.
- On its lake side it slopes into the water at no more than about 1 in 4,
  well under the research's limit of 0.5 m high at 60°. It replaces the basin
  rim's step there, so the geese can walk in and out anywhere along it.
- Its edges sit on the terrain mesh's 2 m grid.
- It leaves the mudflat, the bench, and the shallows as they are, and their
  zone tests unchanged.

### The zones

- **`goose-flat`**, a convex polygon on the flat's top, within about 20 m of
  the water: the ashore zone.
- **`goose-water`**, a convex polygon of water off the flat, deep enough to
  float everywhere: the geese's water zone. It may overlap the open water. The
  geese keep clear of the other swimmers wherever the zones meet.
- The shore spot the family walks out at lies between the two, on the bank.

### Grass

Short grass on the flat: the instanced blades `createGrass` already draws,
scattered over the flat as the near bank is (`src/main.tsx`), but shorter. A
grazed sward is a few centimetres, so the geese's feet and bills show in it. The
terrain's colour on the flat is grass, not mud, down to the wet band at the
water.

### Zone-terrain tests

- `GROUND_OK` gains the `goose-flat`'s band: every sample over the zone on the
  rendered surface is above the water and below its top.
- Every sample over `goose-water` is deep enough for a goose to float, using the
  `swim` band.
- Along the shore between them, the rendered surface never rises more than the
  walkable slope over a step.
- The flat's surface is smooth, and the zones lie inside it, as the bench's
  tests hold.
- The existing zones keep their tests unchanged.

## The bird

### Canada Goose (`cangoo`)

Traced from a side-on photo of a floating goose (research section 8: `c1`,
`L10`, or `c4`), with the chain and its shapes set against the standing
(`L1`, `L2`), grazing (`E5`), and tip-up (`U6`) photos.

- One version, `adult`, painted as *moffitti*: a black head and neck (the
  stocking) ending in a clean line at the base of the neck; a white chinstrap
  from behind the eye under the jaw; a silvery-pale breast shading to brown
  flanks with pale bars; a brown back and wings, each feather pale-edged; a
  black tail over a white undertail and rump band; a black bill, legs, and feet.
  Colours from the research's field marks and photos.
- No neck ring and no collars.
- Webbed feet, the goose's own.
- `waddle` 5°.

The species file keeps its existing block spec's fields alongside the new
`detail` block, as the other converted species do, so the flyover's procedural
model still builds from them.

### Atlas detail

Through binoculars at 30 m, a pixel covers about 3.6 mm (research summary). Over
the head the atlas must be no coarser, so the chinstrap's edge holds. Where the
default atlas is coarser, the goose's is larger.

### Guide text

The `marks` are rewritten from the research's field marks: a very large
waterfowl with a long black neck and a white chinstrap, a pale breast, a brown
back with pale bars, a white undertail; grazing on lawns and fields by the
water; in a V overhead.

## The cast

A second `cangoo` entry, beside the flyover:

```
{ "species": "cangoo", "behavior": "swim", "zone": "goose-water", "ashore": "goose-flat", "count": 8, "groups": [5, 3] }
```

`ashore` and `groups` are new fields, and the plan settles their final names.

- The flyover entry stays as it is. Two entries for one species already work:
  each gets its own group key, and the flyover's procedural model makes no
  atlas.
- `validateCast` checks that a `goose`-style entry names an `ashore` polygon,
  that no other style does, and that `groups` sums to `count`.
- The call scheduler (`src/audio/calls.ts`) already calls for `cangoo` every
  15–45 s and skips flyovers, so the family's calls come from the birds on the
  lake. The plan checks that the rate sounds right with eight geese in reach.

## Viewer

- For an amphibious species, an `afloat` slider, and the walk working at
  `afloat` 0. Today a swimming species' walk does nothing.
- The `waddle` showing in the walk.
- The neck-shape presets as for the herons, with the reach aimed at the ground
  or the water.
- The field view at 30–40 m through binoculars, and the water slider, to check
  the goose as the player will see it, standing in the shallows as well as
  floating.

## Testing

### Already in place

The geometry and pose fingerprints, the folded wing's clearance, the neck
chain's guards, the zone-terrain tests, the ring budget, and the whole-cast
tests. All of them keep passing, and every existing species' prints stay
unchanged.

### Builder

- The amphibious guards, above.
- The waddle: at `gait` 0 there is no roll. At `gait` 1 the roll peaks at
  `waddle` toward the planted foot, once a step.
- The chain's guards over the goose's shapes.

### Species: `goose.test.ts`

- Measurements against the research: bill tip to tail tip floating against the
  traced 0.64 m, culmen, tarsus, and toe.
- Floating: back, crown, and tail tip above the water, and the draft, within the
  research's bounds.
- Standing height, and each shape's crown above the back against the research's
  measures.
- Grazing: the bill on the ground ahead of the toes by about the research's
  distance.
- Tip-up: the body's angle within 75–80°.
- Plumage marks: the chinstrap, the stocking's lower edge, the pale breast, and
  the white undertail.

### Behaviour

As in "Behaviour tests", above.

### Scene

- The flat and zone tests, above.
- The startup count gains the goose's atlas and species. The whole cast still
  builds within the cast tests' timeout.
- The floaters' test: a bird's swimmer or wader look follows `afloat`.

### What tests cannot check

These are checked by eye, in the viewer at binocular distance for every task
and in the game at the end:

- whether the goose reads as a goose afloat, standing, and grazing;
- whether the step out of the water and back in looks natural;
- whether the waddle is a goose's and not a duck's;
- whether the heads come up and go down like a real family's;
- whether anything snaps;
- the frame rate on the user's integrated GPU.

The user's binocular check is the acceptance.

## Performance

One more detailed species and atlas, eight more birds on the lake (45 in all,
the floaters' buffer holds 48), and grass on the flat. The plan records the
same measures as the herons round: the atlases' count and memory, the time to
Begin, the longest pause, and the frame rate with the binoculars on the flat.
It compares them against the build before this round, and the frame rate
against the water round's on the Iris Xe.

## Changed during implementation

From the plan's "Decisions made while planning" (`docs/superpowers/plans/2026-09-30-canada-goose.md`) and Task 6:

- **An amphibious bird says so, `detail.amphibious: true`**, and is built floating; standing, its root rises by the
  offset that puts its hips where a standing build puts them. Its legs grow from hidden as it comes ashore rather than
  switching on. `PoseState` gains exactly `afloat`; `BirdInstance` gains `floating`, read from the bird's own pose.
- **How `y` and `afloat` follow the ground** (`footing`): standing no deeper than `wade.stand`, floating from
  `wade.float`, the body on the water and the feet leaving the bed between.
- **The cast's new fields are `ashore` and `groups`**; the family and the loose unit are one flock; the way ashore is a
  straight line across a bank no steeper than 1 in 2; the family's water time starts when the last of them settles.
- **The rest pose is not the photo's.** The traced goose (`L10`) is calling, its head raised and its bill near level;
  the test holds the resting bill 10-30 degrees down and the crown no more than 280 mm above the water. The outline's
  head was turned 15 degrees down and carried forward and down, the upper neck bending to carry it, before tracing.
- **The head and the neck's base are fans of rings.** Where the body turns into the neck and the neck into the head,
  stations laid by eye or fitted folded the loft or passed its skin through itself. Each ring there runs straight out
  from one point outside the skin (above the back behind the hindneck; below the throat), the spine an arc about it,
  so the rings turn together and can't cross. The rear of the body was fitted to the outline as before.
- **The legs hang from `flank`, not the traced hip station.** On the standing and grazing photos the legs stand at
  0.60-0.65 of the body from the tail; the traced hip sat at 0.46.
- **The neck stretches (`neckStretch`, `reachStretch`), a builder change the user chose.** The plan kept the neck's
  length and asked the erect crown 250 mm above the back; the traced neck, drawn down into its feathers, reached at
  most 200-240 mm, as the test goose had. A chained neck may now lengthen as it goes erect (the goose's 2.4 times:
  crown 269 mm above the back) and as it reaches (1.7 times, to the grass). Default 1: no other bird moves.
- **The neck turns at its base about its throat side (`rig.neckBaseDepth` 0.8), and its skin hands off from the body
  close in (`rig.neckFrom`).** Grazing, the neck leaves the breast nearly level; turned about its spine it crushed the
  breast's front, and the default hand-off (0.08 of the spine) bent the whole chest with it. Both default to what was.
- **The style's built-bird settings:** `wade.stand` 0.155 m, `rings.ahead` 0.34 m, `neck.stand` 0.85 (crown 227 mm above
  the back) and `neck.walk` 0.75, `graze.lean` 0.5 and `graze.reachAngle` 1.5: the grazing photo's body is tipped well
  forward, and the bill then reaches the grass 0.24 m ahead of the toes (photo about 0.17, the test's bound 0.25). The
  60 fps style test's limit on `afloat` is now derived from `wade` (the band from standing to floating narrowed).
- **An amphibious bird's bare tibia is held to 8 mm, not 15%** (`species.test.ts`): built standing, its knee forward
  under a deep belly, 8.4 mm of its tibia shows below the belly against `measurements.tibia`'s 15 mm, which the builder
  lays along an upright tibia. The research's 15 mm is an estimate; its photos show the belly feathers nearly to the
  joint.
- **The call rate:** eight geese at a call every 15-45 s each made a call every 3.75 s on average. It was set to 60-180 s
  each (an estimate) from that arithmetic; it was not listened to in this session.
- **Performance** (headless Chromium on this machine, the production build): the title card counts 40 (24 atlases, 15
  folded wings, the cast); Begin enabled about 5.5 s after the page loaded; `atlases 24: 219 ms each, 32.0 MB`; 32 fps
  by eye and 41 through the binoculars, which could not be aimed at the flat headlessly. The water round recorded
  36-46 fps by eye and 50-59 through the binoculars on the Iris Xe; headless rates say little about a real GPU, and the
  build before this round was not measured beside it. The user's check in their own Chrome is the acceptance.

## Known soft spots

- **The ring budget** with the geese peaks at 56-61 of 64 at 60 fps (none pushed out, but little room left).
- **The step:** `stepLength` 0.65 of the builder's leg, about 0.11 m, against the research's 0.13-0.18 m: longer steps
  slide the stance foot.
- **The stretched neck keeps its resting girth:** erect, the goose's neck is as thick as the fluffed resting one (the
  photo's 61 mm), where a real alert goose's is slender. The black stocking hides the stretch itself.
- **The chinstrap is laid in bands between the head's stations**, so its edges step a little in the telescope.
- **The bill tip** lands 4.6 mm from the photo's, the bill's axis 17 degrees below level against the 22 the trace aimed
  at (the spine's last chord sets it).
- **The lawn's blades** read through the binoculars as dark arcs a few pixels long.
- **The geese on the water and the loose unit share one flock:** the family keeps 0.8 m from the loose unit, not 1.5.
- **The block flyover V**, unchanged until round 2.
- **Behaviour on estimates:** the tip-up's length and reach, swimming speed, spacing, the walk's speed, the waddle's
  size, the cycle's lengths, and the call rate. None is measured for the Canada Goose (research section 12).
- **Vigilance from elsewhere:** the bout lengths come from Cackling Geese with small goslings in Alaska in summer.
- **Floating heights from three photos**, mostly of birds that aren't from the Northwest; no top view for the beam.
- **One size**, at the mean of the sexes; the gander is about 6% larger.
- **No turning of the head to the side**, as for every bird so far.

## Build order

1. Research: done (`docs/research/2026-09-30-canada-goose.md`).
2. The amphibious bird, `afloat`, and the waddle, proven in the viewer on a test
   bird, with the builder tests.
3. The flat, its zones and grass, with the zone-terrain tests.
4. The water reading the pose (floaters).
5. The `goose` style, test first: the water states, the cycle ashore and back,
   grazing and vigilance, roles and families.
6. The Canada Goose, detailed, with its tests.
7. The cast, the main spec and README, performance, and the user's binocular
   check.

The work runs on one branch, `geese`, in a worktree. The plan decides who does
each task.

## Future rounds (not in this spec)

- **Round 2:** flight. The V made of detailed geese, with a wingbeat of about
  4 Hz, a vee angle of about 34°, and about 4 m between birds. Most flocks fly
  in lines, echelons, and J-shapes, not clean Vs (research section 7.8).
- **Round 3:** arrivals and departures. Preflight head-tossing for minutes, a
  short run off the water, and loud honking at takeoff. Set wings, a long glide,
  and a splashdown on arrival.
- The Cackling Goose, with an October or winter scene.
- Threat displays and chases, and honking in chorus.
- Preening on land and sleeping.
