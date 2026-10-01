# Belted Kingfisher: design spec

Date: 2026-09-30
Status: draft for review
Builds on: `2026-09-30-water-design.md` (rings sized by what made them, the
water's clarity), `2026-09-27-herons-design.md` (the head-hung part,
`headPitch`, the style's settings table, spacing handed out by the spawner),
`2026-09-26-swimmers-design.md` (per-version cast counts, the ring budget), and
`2026-09-24-detailed-birds-design.md` (the detailed builder, painter, and viewer)
Amends: `2026-09-22-lakewatch-design.md` (the hover behavior, the animation list,
the snag and the scene's perches, the call scheduler, the startup count)

## Purpose

The Belted Kingfisher is still a block model: a female on the snag at about
53 m. She flies straight out, hangs in the air, drops, and flies straight back.
Her plunge makes a ring and a sound, and nothing leaves the water. The
kingfisher is what a birder listens for on a valley lake in autumn. The rattle
comes first, then a blue-grey bird low over the water, then the hover and the
plunge.

This round makes it a detailed bird, and the first detailed bird that flies:

- **The bird:** a big head with a shaggy double crest, a heavy dagger bill,
  blue-grey above, a white collar, a blue-grey breast band, and on the female a
  rusty band and flanks below it. Tiny feet on a branch.
- **Wings:** a real spread wing, traced and painted, with the white patch at
  the base of the primaries. It bends at the wrist through the stroke, beats
  unevenly in flapping flight, and changes to a fast stroke with the tail
  fanned when it hovers.
- **Hunting:** mostly straight plunges from a perch, and sometimes a hover and
  a head-first plunge well out over the water. A splash of spray goes up, the
  bird goes under, and it comes up and flies off.
- **After a catch:** it flies back to a perch with a small fish held crosswise,
  beats it against the branch, turns it, and swallows it head first.
- **Between hunts:** it bobs its head, flicks its tail, raises and lowers its
  crest, and turns its head to watch the water.
- **Several perches:** the snag and two or three more around the shore, the
  nearest in binocular range. It moves between them in low flight over the
  water, rattling as it goes.

Success looks like this. The player hears a rattle, turns, and finds the bird
low over the water heading for the near perch. Through binoculars at about
30 m, it lands and bobs its head, and its crest, collar, and breast bands are
all clear. It turns its head, then drops straight into the water, and spray
goes up. It comes up, flies back with a fish, beats it on the branch, and
swallows it. Later, through the telescope, it hovers far out over the lake with
its wings a blur and its tail fanned, then plunges. Nothing snaps, the wings
don't read as flat paddles, and no pop shows as they fold on landing.

## Scope

In scope:

- The Belted Kingfisher (`belkin1`) gets a `detail` block: traced, measured,
  and painted, in the plumage versions late September calls for.
- **A perched posture** in the detailed builder: a detailed bird standing on a
  perch, its toes gripping it.
- **A detailed spread wing:** a traced planform, painted above and below,
  jointed at the shoulder, elbow, and wrist, with a wingbeat cycle that has a
  flapping stroke and a hovering stroke. A fold and unfold that doesn't pop
  against the folded wing. A tail that fans.
- `PoseState` gains a head turn (`headYaw`), a stroke blend, tail fan, crest
  raise, and a held fish. Each defaults to a value that changes no existing pose.
- A crest: a head-hung part, raised and lowered.
- A fish prop, held in the bill after a catch.
- The `hover` behaviour becomes a `kingfisher` behaviour: perching, perch
  plunges, hover plunges, catch handling, idles, and flights between perches.
- The scene's perches: the snag and new ones, one within binocular range, all
  in one `perches` zone.
- Spray: a small, general splash where a bird enters the water. Only the
  kingfisher uses it this round.
- The rattle tied to flight: the call scheduler takes calls a behaviour asks
  for.
- Two research documents, and the guide's `marks` text rewritten from them.
- Viewer controls for the wing, the tail fan, the head turn, the crest, the
  fish, and the perch.

Out of scope:

- Flight for any other detailed bird. The geese and pelicans stay block
  flyovers, and the herons and swimmers don't fly or flap.
- Spray for the grebe's dive, the coot's jump-dive, or the heron's strike.
- The bird under the water beyond a brief disappearance: no underwater swimming
  shown, no bubbles.
- Territorial chases and a second kingfisher (see "The cast").
- Disturbance: the bird flushing from the player.
- Birds and spray reflected in the water.
- Motion blur on the wings.
- A detailed Red-winged Blackbird or Marsh Wren, though the perched posture
  will serve them.

## Decisions made in brainstorming

| Decision | Choice |
|---|---|
| Flight | A real detailed spread wing, traced and painted, bending at the wrist, with flapping and hovering strokes, built general and proven on the kingfisher. Improving today's flat sheet (a paddle in the telescope) and a perch-only round were rejected |
| Perches | The snag and two or three more around the shore, with low flights between them. The snag alone was rejected |
| Nearest perch | Binocular range, 30–35 m. The research finds that honest for a still person, and 25 m at the edge. The far perches are at telescope distance |
| Pace | About 4 times the real rates, said so in the settings table. Real birds sit 6–16 minutes a perch and plunge 0.7–3 times an hour, so a player would wait 20–60 minutes for a plunge. The game's bird sits 1–4 minutes and plunges 10–15 times an hour |
| Behaviours | Perch plunges, hover plunges, catch handling, and perch idles, all four |
| Cast | One adult female, from the research's tally of the valley's September records; the male built alongside |
| Rattle | Tied to flight, not the timer |
| Head turn | `PoseState.headYaw` for every detailed bird, 0 by default. Only the kingfisher sets it this round |
| Other flying birds | The kingfisher only. The wing is built so others can use it later |
| Splash | Spray this round, general, used only by the kingfisher |
| Fish | A small fish prop, only after a catch |

## Changes to the Lakewatch design spec

In the Behaviors table, the `hover` row becomes:

```
| kingfisher | Perch over the water, watching, bobbing, flicking the tail; plunge from the perch, or fly out, hover, and plunge; come up and fly to a perch, beating and swallowing any fish; fly low between perches, rattling |
```

and the `perch` row's "Sit on the snag" becomes "Sit on a reed perch", since the
snag belongs to the kingfisher's perches.

In Animation, `kingfisher hover and dive` becomes `kingfisher flight, hover,
plunge, and fish handling`, and `spray where a kingfisher plunges` is added.

In Composition, the snag is joined by the kingfisher's other perches. In Audio,
bird calls are on the timer "except where a behaviour calls, as the
kingfisher's rattle in flight does".

The Bird models section notes that the kingfisher is detailed, perched, with a
spread wing, and points here. The title card's count takes its new total from
the atlases and species this round adds.

## Research

Two documents, written first and committed with the plan, in the form of the
earlier ones:

- `docs/research/2026-09-30-belted-kingfisher.md`
- `docs/research/2026-09-30-kingfisher-flight-and-plunge.md`

The species document supplies:

- **Measurements:** total length, exposed culmen, bill depth and width, tarsus,
  toes, wing chord, tail, crest length, and mass, with sources, and how the
  sexes differ.
- **Late-September plumage** in the Willamette Valley, and the mix of sexes and
  ages from an iNaturalist tally, as the earlier documents did. Juveniles are
  known to differ: males can show rusty in the breast band, and females a
  mottled band. The document decides which versions the cast needs.
- **Field marks** a birder uses at distance, for the guide's `marks` text.
- **Structure and posture:** the perched posture traced side-on, the crest
  lowered and raised, the head bob, the tail flick.
- **Behaviour:** perch times, how often each hunt is a perch plunge or a hover
  plunge, hover height and length, plunge angle and speed, time under water,
  catch rate, how a fish is handled and for how long, how often it changes
  perches and how far, flight speed and height, how often it rattles and
  when, and how close it tolerates a still person.
- **Territory:** how many kingfishers hold a lake this size in autumn, and how
  often an intruder is chased.
- **Tracing references,** kept in the scratchpad and never committed.
- **Test thresholds** and the style's settings.

The flight and plunge document supplies:

- **The spread wing:** planform (span, the chord along the span, where the
  wrist and the primaries' tips lie), from a traced top-down photo, and the
  upper- and underwing colours, the white patch, and how the primaries'
  tips separate.
- **Flapping flight:** wingbeat frequency, amplitude, how far the wrist folds
  on the upstroke, and the uneven rhythm of its flight.
- **Hovering:** wingbeat frequency and stroke plane, body angle, tail fan, how
  still the head holds, and how the bird holds a hover in wind.
- **Take-off and landing:** how the wing opens and closes, and how long each
  takes.
- **The plunge:** the path from perch and from hover, the wing shape as it
  goes in, the spray's height, spread, and life for a bird this size, and the
  ring (within the sizes `ripples.ts` has, a dive's by the water research).
- **The emergence:** how the bird leaves the water, and whether it shakes off
  in flight.

Both documents are written. Measurements, field marks, prey size, and the
territory are well sourced. The hover's kinematics come from the Pied
Kingfisher, the splash physics from spheres and wedges, and the entry speeds,
joint-angle tables, idle timings, and handling time are estimates, each marked.
Neither document could read Pyle or the full Birds of the World account.

The catalog already has the kingfisher's photos and its rattle, so no harvest is
needed. Every number the plan uses comes from these documents. Where a document
marks a number as an estimate or as chosen by eye, the species file and the
style's settings table say so.

## The perched posture

`posture: 'perched'` with a `detail` block becomes legal, and the schema's
refusal is lifted for it. A perched detailed bird is traced side-on on its
perch.

- The feet sit on the perch point, the toes curled around a branch of the
  perch's radius. The tarsus and toes are posed from the trace. The kingfisher's
  are tiny and barely show.
- Standing and swimming birds build as before, and every existing print stays
  unchanged.
- The perched bird's lean pivots over its feet, so a head bob or a lean to
  plunge doesn't lift it off the branch.

## The spread wing

### Planform and paint

- A species with flight gives a `wing` block in its `detail`: the planform
  traced from a top-down spread-wing photo, as a set of stations along the span
  (the chord's leading and trailing edges at each), with the wrist's station
  named.
- The upper and under faces get their own atlas regions and field-mark layers,
  such as the kingfisher's white patch at the primaries' bases and its barred
  flight feathers.
- The trailing edge of the hand is notched where the primaries' tips separate,
  as the research traces it.
- A species without a `wing` block keeps today's generic planform and its
  prints.

### Joints and the stroke

- The spread wing is skinned to three bones per side, the arm, forearm, and
  hand, with weights handing off across the elbow and the wrist as the neck's
  do.
- `wingPhase` runs the cycle as today. A new `PoseState.wingStroke` blends
  between two strokes: 0 = flapping flight, 1 = hovering. Each is a table of
  joint angles over the cycle, from the research. In the flapping stroke the
  hand folds at the wrist on the upstroke. In the hovering stroke the stroke
  plane tips toward horizontal and the amplitude grows to about 120°.
- **The glide:** flapping flight comes in bouts of 5–6 beats, then a short
  glide on half-closed wings. The glide is a held pose, not a third stroke: the
  behaviour holds `wingPhase` at the stroke's glide point and eases
  `wingSpread` to about half.
- **Frequencies:** about 7 Hz flapping and 8.5–9 Hz hovering, the hover's beat
  falling as the wind rises (8.5 Hz in the scene's 2.8 m/s). Each is capped at
  the frame rate ÷ 6, so a beat never has fewer than six frames and doesn't
  alias into flicker when the frame rate dips.
- `wingSpread` still runs 0 folded to 1 spread. Between them the elbow and
  wrist close, so the spread wing folds toward the body.

### Folding onto the body

Today the spread wing swaps for the folded shell as soon as `wingSpread` passes
0.05, and the swap pops.

- The spread wing closes to lie along the folded wing's place, and the swap
  happens where the two nearly coincide.
- A test measures the largest jump of any wing vertex at the swap. It must be
  under 1 pixel at the nearest perch through binoculars. The plan computes that
  distance in millimetres.

### The tail

`PoseState.tailSpread`, 0 closed to 1 fully fanned, spreads the tail about its
base to the research's hovering fan. At 0 nothing changes.

### Guards

- **Lengths kept:** in every stroke and fold, each wing bone keeps its length,
  and the planform's area changes only as the hand folds.
- **No pass-through:** no wing vertex goes inside the body's loft anywhere in
  either stroke, or in the fold.
- **Frames per beat:** at 60 fps the flapping stroke gets about 8.6 frames a
  beat and the hovering stroke about 7.1, and the cap holds every beat to at
  least six frames at any frame rate.
- **Existing birds untouched:** every existing species' geometry and pose
  prints are unchanged.

## The head and its parts

- `PoseState.headYaw`, in radians, positive turning the bill to the bird's
  left, default 0, turns the head bone about the neck's axis, after the neck
  shape and `headPitch`. Every existing behaviour leaves it at 0.
- **The crest:** a `crest` kind of head-hung part, as the heron's plume is: a
  shaggy tuft traced from the occiput, in two lobes. `PoseState.crestRaise`,
  0 lowered to 1 raised, swings it up about its base, within the research's
  range.
- **The fish:** a small painted fish mesh hung from the bill tip, sized from
  the research's typical prey. `PoseState.fish`, 0 hidden or 1 held, shows it,
  and `PoseState.fishTurn` swings it from crosswise to lengthwise, head first,
  for the swallow. Its geometry is built once and shared.

## The `kingfisher` behaviour

### Spec and context

`hover` is replaced by `kingfisher`, in `src/behavior/kingfisher.ts`, with its
settings in a table as the other styles have them. `hover.ts` and its tests go.
The context gains the perches (a list of world points with the direction each
faces the water), `onSplash`, and `onCall`.

### States

- **perch:** sits watching the water. Idles now and then: a head bob, a tail
  flick, the crest raised and lowered, the head turned slowly one way and back.
  It picks its next move at the research's rates.
- **perch plunge:** leans forward, drops off the perch head first on a curved
  path, the wings half-opening and closing again before it goes in, at 5–8 m/s.
- **flyout:** takes off and flies out over the water, with flapping flight, to a
  hover point 9–12 m up.
- **hover:** faces into the wind and holds position with `wingStroke` 1, the
  body tilted up 50–60° and the tail fanned 90–120°. The head holds still
  within about 5 mm; today's 0.15 m bob goes. A hover lasts 2–6 s. It may shift
  a few metres on a short U-shaped path and hover again, or give up and fly on.
- **hover plunge:** folds the wings and drops head first, going in at 7–10 m/s.
  Today's 14 m/s straight drop goes.
- **under:** at the surface: spray, a ring, the splash sound. It goes under and
  is hidden for about a second (0.5–1.5 s), and takes fish within about 15 cm
  of the surface.
- **emerge:** it comes up and takes off from the water, with a fish at the
  catch rate (0.5). No shake in the air: the research found no source for one.
- **fly:** flapping flight in bouts with glides, to a perch 40–100 m off, at
  9–13 m/s and 0.3–1.5 m over the water, on a path that eases its turns. Most
  flights between perches rattle.
- **land:** it slows, brakes with its wings, and folds them onto the perch.
- **handle:** after a catch, it beats the fish against the branch (quick head
  swings with `headYaw` and `headPitch`), turns it head first, and swallows,
  8–20 s in all.

### Pace

The research's rates are a wintering bird's: 6–16 minutes a perch, 4–7 flights
an hour, and 0.7–3.1 plunges an hour. The settings run about 4 times faster: a
perch bout of 1–4 minutes and 10–15 plunges an hour, about 0.65 of them from a
perch and 0.35 from a hover (chosen; no source counts them). The settings table
marks each sped-up number with the real one beside it. Everything within a
state (the hover's length, the plunge, the time under water, the handling)
keeps its real timing.

### Flight paths

- Paths are smooth curves with bounded turn rates and climbs, at the research's
  speeds. No straight lines with a heading that snaps.
- Every path keeps clear of the terrain, the reeds, the snag, and the trees by
  a margin, and stays over water except at the perch ends. Tests sample paths
  over long runs.
- A hover point is over water deep enough for a plunge, by the water depth
  bake, and inside the kingfisher's reach from the perches.

### Rings and spray

Each plunge starts one ring of size 0.9 (a 2.0 m reach, 5.6 s) and one spray.
Taking off from the water starts a ring of 0.6–0.7. The ring budget in `src/birds/cast.test.ts` adds
the kingfisher, and must still show nothing pushed out, re-measured at 60 fps
as the earlier rounds did.

### The rattle

The behaviour calls `onCall` when it leaves a perch for another or lands, at
the research's rate, and on about 1 plunge in 5. A rattle as it reaches or
leaves the near perch is in character, and that is where the player most often
hears it. The call
scheduler plays an asked-for call at once if the simultaneous-call cap allows,
with the sound moving with the bird. The kingfisher's timed calls go, or drop to
the research's rate for calls from a perch.

### Behaviour tests

With a seeded random source, as for the other styles:

- State transitions, and each state's length within its settings.
- The long-run shares of perch plunges and hover plunges, and the catch rate,
  inside the research's ranges.
- Every plunge ends in the water, deep enough by the depth bake, with one ring
  and one spray.
- A fish shows only after a catch, and the swallow ends it.
- Flight paths stay clear of the scene and never turn faster than the setting.
- No snapping: at 60 fps, every pose value changes by no more per frame than its
  state's easing allows.
- Flights between perches call at the research's rate.

## The perches

`perches`, a new zone kind: a list of named points, each with the height of the
perch, its radius, and the way it faces the water. The spawner hands the whole
list to the bird.

- **The snag** at (22, −48), about 53 m, as now, with its branch as the perch.
- **A near perch** 30–35 m out, a dead branch leaning out over the water
  or an old post near the shore.
- **One or two far perches:** a branch over the far bank's water, and perhaps a
  second on the side shore.

Each perch is a new world object built like the snag, low-poly and weathered,
with water deep enough below it for a plunge. The research's tolerated distance
sets the near one. Exact positions are settled in the plan against the
rendered scene and the views from the vantage. The reed perchers keep their own
point zones.

## Spray

`src/world/splash.ts`, beside `ripples.ts`:

- `onSplash(x, z, size)` starts a spray: a crown of droplets thrown up and out,
  falling back under gravity, and a brief white burst at the water. For the
  kingfisher, 1–3 mm droplets leave at 2–4 m/s, rise 0.3–0.7 m, spread
  0.2–0.6 m, and are back down within 0.5–0.8 s. A foam patch fades over about
  1 s. Two photos of a Belted Kingfisher leaving the water in Beaverton agree.
- Droplets are instanced, lit as water, and fade as they fall. Each is drawn
  at least 1 pixel across, since through binoculars a real droplet is smaller
  than a pixel. A small buffer
  holds a few sprays at once, and a full buffer drops the one nearest its end,
  as the rings do.
- Built general, sized by `size`, so the grebe and heron can use it later.
- It isn't in the mirror: the water reflects no birds or spray yet.

## The bird

### Belted Kingfisher (`belkin1`)

Traced side-on on a perch from a photo, with the crest lowered. The spread wing
is traced top-down from a flying or hovering photo, upper and under: a span of
0.53 m, a half-span of 1.47 × the wing chord, the wrist at 0.37 of it, and the
outer four or five primaries separated. Today's generic planform (1.78 and
0.42 × the wing chord) is too long and narrow for this bird. Both sexes are
blue-grey above with a white collar and a blue-grey breast band. The female adds
a rusty band and flanks, and rusty underwing coverts where the male's are white.
The white spot before the eye, the crest, and the wing's white patch (0.64–0.88
of the half-span) are painted.

Measured as the mean of the sexes, western race: exposed culmen 59.5 mm,
tarsus 11.4, middle toe 15.8, wing chord 164, tail 93, about 150 g, bill tip
to tail tip about 325 mm. The front toes are fused into one broad sole.

Two versions, both adult: `female` and `male`. Juveniles differ only by rusty
mottling in the breast band, 1–2 pixels through binoculars at 30 m, so they get
no version of their own.

### Atlas detail

The plan computes a pixel's footprint over the head at the nearest perch through
binoculars, and over the spread wing at the hover distances through the
telescope. Where the default atlas is coarser, the atlas is larger, as for the
herons.

### Guide text

The `marks` are rewritten from the research's field marks, for the versions the
player will see, and name the rattle and the hover.

## The cast

One bird, a `female`, and the cast entry moves from `snag` to the `perches`
zone. Of the valley's late-September records that could be sexed, 57% were
female; only one of 94 bird-days showed two birds together; and autumn
territories are held alone. The `male` is built for the guide and a later
round.

## Viewer

- Sliders for `wingSpread`, `wingStroke`, `wingPhase` (scrub or run at the
  species' frequency), `tailSpread`, `headYaw`, `crestRaise`, `fish`, and
  `fishTurn`.
- The bird on a perch prop, and a flight view that shows it against the
  spread-wing photo top-down.
- The field view at binocular distance (the near perch) and telescope distance
  (the snag and hovers) checks the bird as the player will see it.

## Testing

### Already in place

The geometry and pose fingerprints, the folded wing's clearance, the zone-terrain
tests, the ring budget, and the whole-cast tests. All of them keep passing, and
every existing species' prints stay unchanged.

### Builder

- A perched detailed bird's feet sit on the perch, and its lean pivots over
  them.
- The spread wing's guards: lengths, no pass-through, and the jump at the swap.
- The strokes blend, and at `wingStroke` 0 the stroke is the flapping table's.
- `tailSpread`, `headYaw`, `crestRaise`, and `fish` at their defaults change
  nothing.
- A head-hung crest and the fish move with the head.

### Species: `kingfisher.test.ts`

- Measurements against the research: bill tip to tail tip within 5% of total
  length, bill against head, the wing's span and chord.
- Plumage marks on the right versions: the collar, the breast band, the
  female's rusty band and flanks, the wing's white patch.
- On each perch, the feet on the branch.

### Behaviour

As in "Behaviour tests", above.

### Scene

- Each perch stands in the rendered terrain or water with water below it deep
  enough for a plunge.
- Spray: a spray's droplets rise and fall back within the research's height and
  life, and the buffer drops as it should when full.
- The call scheduler plays a call asked for, within the cap.
- The startup count gains the new atlases and species. The whole cast still
  builds within the cast tests' timeout.

### What tests cannot check

By eye, in the viewer for every task and in the game at the end: whether the
wing reads as a kingfisher's in each stroke, whether the hover looks like
hovering, whether the fold pops, whether the plunge and spray look right,
whether the fish handling looks natural, whether anything snaps, and the frame
rate on the user's integrated GPU. The user's check through binoculars and
telescope is the acceptance.

## Performance

One more detailed species, with an extra wing region in its atlas, and a spray
buffer. The plan records, as the earlier rounds did (headless Chromium on this
machine, two loads each, noted as saying little about a real GPU): the atlases'
count and memory, the time to Begin, the longest pause, and the frame rate with
the binoculars on the near perch and the telescope on a hover. It compares
them against the build before this round.

## Build order

1. Research: the two documents, written in parallel.
2. The perched posture, `headYaw`, `tailSpread`, the crest part, and the fish,
   proven in the viewer on a test bird, with the builder tests.
3. The spread wing: planform, joints, strokes, and the fold, proven on a test
   bird, with its guards.
4. The perches and the `perches` zone, with the scene tests.
5. Spray, and the call scheduler's asked-for calls.
6. The `kingfisher` behaviour, test first.
7. The Belted Kingfisher, detailed, with its tests: the worked example.
8. The cast, the main spec and README, performance, and the user's check.

The work runs on one branch in a worktree. The plan decides who does each task.

## Future rounds (not in this spec)

- Flight, take-off, and landing for the herons, swimmers, and shorebirds, using
  this wing.
- Detailed geese and pelicans on the flyovers.
- Spray for the grebe's dive, the coot's jump-dive, and the heron's strike.
- Territorial chases, a second kingfisher, and birds flushing from the player.
- Detailed reed perchers on the perched posture.
- Birds and spray reflected in the water.
