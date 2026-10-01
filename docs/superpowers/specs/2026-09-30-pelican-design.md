# American White Pelican: design spec

Date: 2026-09-30
Status: built (see "Changed during implementation" and "Known soft spots"); not yet committed
Builds on: `2026-09-30-water-design.md` (reflections, the floaters, the Kelvin
wake, rings as waves), `2026-09-27-herons-design.md` (the neck chain, neck
shapes, `headPitch`, a part hung from the head), `2026-09-26-swimmers-design.md`
(the floating builder, swim styles, spacing on the water, per-version cast
counts, the ring budget), and `2026-09-24-detailed-birds-design.md` (the detailed
builder, painter, and viewer, whose future rounds name "skinned flocks (geese and
pelicans)" and "flight-quality wings")
Amends: `2026-09-22-lakewatch-design.md` (the swim and flyover behaviors, the
cast, the animation list, the startup count)

## Purpose

The American White Pelican is the largest bird in the game and the only one the
player sees just as nine blocks crossing the sky. This round makes it a detailed
bird, in the plumage a birder would see on a Willamette Valley lake in late
September, and shows it both ways a birder meets it: a small group on the water,
and a line of them in the air.

What this round brings:

- **On the water:** a huge white bird riding high, its neck in an S and its long
  orange bill resting down on its foreneck. The group swims abreast and dips
  their bills together, lifts them to drain, and tips up to swallow.
- **In the air:** long broad wings, white with black flight feathers, the neck
  folded back so the head rides on the shoulders. The line flaps and glides, and
  a bout of flapping passes down the line from the leader.
- **Age:** a first-autumn bird beside the adults, if the research finds them in
  the valley in late September, with its dusky head, neck and wing coverts.

Success looks like this. Through the telescope at 40–60 m, four pelicans swim in
a loose line on the open water, each leaving a wake and mirrored in the water
under it. They close up, dip their bills together, and lift them with the pouch
hanging full. Later a line of nine crosses the sky. Through binoculars the black
outer wing and white inner wing read from below, the wings bend at the wrist on
the downstroke, and the birds glide between bouts of flapping. No pelican snaps
from one pose to the next, and no existing bird changes.

## Scope

In scope:

- American White Pelican (`amwpel`) gets a `detail` block: traced, measured, and
  painted, with the plumage versions late September calls for.
- A pouch under the bill: part of the bill, with its own depth outline, that
  fills after a dip and drains.
- The pelican's neck as a chain, with the shapes it needs: the head back on the
  shoulders (at rest and in flight), the swimming S, erect, and the dip.
- A `pelican` foraging style on `swim`: loaf, cruise, and feed together by
  bill-dipping.
- A small group of pelicans on the water, in the cast alongside the flyover.
- A flight wing in the detailed builder: a planform traced from photos, an inner
  and an outer wing that bend at the wrist, and a glide. Species that don't ask
  for it keep today's spread wing unchanged.
- A flight posture: legs hidden, neck folded, the body level.
- A flyover flock of detailed, skinned birds for a species with a `detail`
  block. The Canada Goose stays a block flock.
- Flap-and-glide in the flyover, with a flapping bout that passes down the line.
- One research document, and the guide's `marks` text rewritten from it.
- Viewer controls for the pouch, the flight wing, and a view from below.

Out of scope:

- Taking off and landing. The pelicans on the water stay there, and the line in
  the sky passes over; the two never meet.
- Soaring in circles on a thermal. The flock crosses on a straight lane, as now.
- Sleeping with the bill laid back along the back, and preening: no bird turns
  its head sideways yet.
- Pelicans standing on the bank or a bar.
- The breeding adult's bill horn, crest, and bright bill, which September birds
  don't show.
- Fish in the bill, and splashes.
- Detailing the Canada Goose, and flight for any other detailed species.
- Brown Pelican.

## Decisions made in brainstorming

| Decision | Choice |
|---|---|
| Where | Both on the water and in the sky (the user's choice, 30 September) |
| Water and sky | Separate birds. The group on the water never flies, and the flock in the sky never lands |
| The flock's birds | One skinned bird per member, sharing one geometry and one atlas, shown only while the flock crosses. Instanced skinning with a bone texture was rejected: nine birds for under a minute at a time don't need it, and each would still need its own bones |
| The flight wing | Two bones a side (inner wing and hand), a planform given by the species. Today's single rigid triangle stays for every species without one |
| The neck | The herons' chain. The flight posture is its `hunch`, so flight needs no new neck work |
| The pouch | Part of the bill, on a bone of its own that deepens it. A separate cloth-like mesh was rejected |
| Behaviour on the water | One `pelican` style on `swim`, with a shared feeding bout the group joins, as the shovelers share a spin |
| Plumage | Honest to late September, as the research finds |
| Round structure | Research first; then the bird on the water; then the flight wing; then the flock; then the finish |

## Changes to the Lakewatch design spec

In the Behaviors table, the `swim` row gains: "a pelican loafs with its bill on
its foreneck, and the group swims abreast and dips their bills together". The
`flyover` row becomes:

```
| flyover | Flock enters at one sky edge on a timer, crosses in formation (pelican line, goose V), exits. A detailed species flies as skinned birds that flap and glide, the flapping passing down the line; a block species is instanced, per-bird wingbeat phase |
```

In Animation, the list gains `pelican bill-dip, drain, and swallow` and
`flap and glide`.

The example location file and the initial cast gain the pelicans on the water.
The Bird models section notes that the pelican is detailed, on the water and in
flight, and points here. The title card's count takes its new total from the
atlases and species this round adds.

## Research

One document, written first and committed with the plan, in the form of the
earlier ones: `docs/research/2026-09-30-american-white-pelican.md`. It supplies:

- **Measurements:** culmen, bill depth and width, the pouch's extent, tarsus,
  middle toe, wing chord, tail, wingspan, mass, and the model length in the
  swimming posture, with sources.
- **Late-September plumage** in the Willamette Valley and the mix of ages, from
  an iNaturalist tally; the species' status and flock sizes there in autumn, on
  the water and in the air.
- **Field marks** at distance, swimming and in flight, for the guide's `marks`.
- **Structure:** the bill's profile and the pouch at rest and full; how the neck
  is carried swimming, erect, dipping, and in flight; the folded wing on the
  water; the totipalmate feet.
- **How it floats:** where the waterline sits, and swimming speeds.
- **Foraging:** the dip's sequence and timing, dips a minute, catch rate,
  cooperative feeding (lines, synchrony), what a group does on a late-September
  morning, and spacing.
- **Flight:** wingspan and planform, which feathers are black above and below,
  the posture, wingbeat frequency, flap-and-glide timing, the wave down a line,
  airspeed, spacing in the line, and whether the birds call.
- **Tracing references** (swimming side-on, from below and above in flight,
  side-on in flight), kept in the scratchpad and never committed.
- **Test thresholds** and the settings for the style and the flyover.

Every number the plan uses comes from this document. Where it marks a number as
an estimate or chosen by eye, the species file and the settings tables say so.

## The bird on the water

### Model

The pelican is a swimmer built as the ducks are: a traced side profile, a
`float.waterline`, webbed feet, a folded wing, and painted layers. What it adds:

- **Size.** About three times a Mallard's length. Nothing in the builder is
  sized for a duck by a constant; the plan checks the folded wing's clearance
  constants and the mesh's ring counts hold at this size, and the reach solver's
  limits.
- **The bill** uses the bill `profile` (width and depth along it) and `hook` for
  the nail at the tip. It is long, flat, and nearly straight.
- **Feet.** `webbed` today joins the three front toes. A pelican's foot webs all
  four. At the telescope's range, under the water, this does not show; the
  pelican uses `webbed`, and the spec records it as a known soft spot.
- **Versions.** As the research finds: most likely `adult` (non-breeding) and
  `juvenile` (first autumn), with the cast giving counts of each.

### The pouch

`detail.bill` gains an optional `pouch`: the lower outline of the bill from its
base to near its tip, as depths below the bill's axis at rest and when full, and
how far back under the throat it runs.

- The pouch is built as the underside of the bill, on the bill's part in the
  atlas, so its colour is painted with the bill's.
- It hangs from a `pouch` bone, appended after every existing bone so no bone's
  index moves. The bone scales the pouch's depth between its rest and full
  outlines.
- `PoseState.pouch`, 0 to 1, default 0, sets it. Every existing behaviour leaves
  it at 0, and a species without a pouch ignores it.
- A bill with no `pouch` is built exactly as today.

### The neck

The pelican names `rig.neck` and `neckShapes` as the herons do:

- **`hunch`** (`neckExtend` 0): the neck folded back, the head on the shoulders,
  the bill resting along the foreneck. The loafing bird, and the bird in flight.
- **The trace** (0.5): the swimming S, the bill angled down.
- **`erect`** (1): the neck up, the bill nearer level. Alert, and the swallow
  with `headPitch`.
- **`strike`**: the dip. The neck stretched forward and down, the bill and head
  under the water.

The chain's guards from the herons round (lengths kept, no folds, no
pass-through at the tightest fold, wing clearance) run over the pelican too. The
pouch's full outline joins the pass-through test: a full pouch must not pass
through the foreneck in the shapes the style uses it in.

### The `pelican` style

`SWIM_STYLES` gains `pelican`. `swim` switches on it as it does on the others,
and the pelican sets `foraging: 'pelican'`. The style is built on
`createSwimmer`, so spacing, the bank, and the flock's target work as they do
for every swimmer.

States:

- **loaf:** floats, drifting with the wind, the neck at or near the `hunch`.
  The largest share of a late-September morning, if the research bears it out.
- **cruise:** swims to a spot near the flock's target at the species' speed, the
  neck in the traced S. Its wake comes from its speed, as every swimmer's does.
- **feed:** a bout the whole group joins, held on the flock's shared record as
  the shovelers' spin is:
  - *gather:* the birds swim to places abreast in a line, the research's spacing
    apart, facing the way the line will go.
  - *drive:* the line swims forward together at the driving speed.
  - *dip:* each bird reaches down (`reach` to 1 at the species' `reachAngle` and
    depth), holds its bill under, and lifts. The birds dip within a short
    window of each other, as the research times it. A ring starts where each
    bill enters the water.
  - *drain:* the bill comes up pointing down, `pouch` at 1 easing back to 0.
  - *swallow:* after a dip that catches, at the species' catch rate: the neck
    goes `erect` and `headPitch` tips the bill up, then eases back.
  - The line drives and dips a few times, then the bout ends and the birds go
    back to loafing or cruising.
- **alert:** the neck `erect`, the bill level, holding still.

A bird on its own (a cast of one, or a group of one) feeds alone with the same
dip. Settings, each marked as measured or chosen by eye: the shares and lengths
of loafing, cruising and feeding; speeds; the line's spacing; dips in a bout;
the dip's times, angle and depth; the synchrony window; catch rate; the
swallow's length and pitch; spacing to flockmates and to other swimmers.

### Rings and the water

Each dip starts one ring at the bill's entry, of the size the research gives.
The pelican joins the floaters as every swimmer does: a waterline contact, a
wake from its speed, and a reflection. The plan checks the floaters' contact
ellipse and the wake's width against a body this large, and the ring budget with
the pelicans added.

### Where they swim

A new polygon zone, `far-water`, on the far half of the open water, so the
pelicans are telescope birds and don't crowd the ducks nearer in. Its corners
are set on the rendered terrain in the plan, tested as the other zones are for
depth (deep enough that a dipping bill doesn't reach the bed) and for room
(the feeding line abreast fits across it). Swimmers already keep their distance
across zones, and a pelican's spacing to other swimmers is larger than a duck's.

The cast gains the group: a count the research supports for a small valley lake
(expected three to five), with counts per version.

## The bird in the air

### The flight wing

`detail` gains an optional `flight` block. With it, the builder builds the
spread wing from the species' own planform in place of today's triangle:

- **Planform:** the span from the shoulder to the tip, and an outline of leading
  edge and chord along it, traced from a photo of the bird from below. The tip
  may be fingered: a few separated primaries, given as a count and a depth, cut
  into the outline.
- **Two bones a side:** today's `wingR`/`wingL` at the shoulder carry the inner
  wing, and new `handR`/`handL` at the wrist carry the outer wing, appended after
  every existing bone. Weights hand off across the wrist over a short span so
  the wing bends without a crease.
- **Thickness:** the upper and under faces stay two thin sheets, as today, on
  the `wingSpread` and `wingUnder` atlas parts. The atlas regions are as they
  are; the plan checks that a pelican's black-and-white pattern has enough
  pixels along the span and enlarges the regions only if it does not.
- **Paint:** the species' layers paint the black primaries and outer
  secondaries and the white coverts on both faces, as the research maps them.
- **Flap:** the wingbeat drives both bones: the inner wing swings at the
  shoulder, and the hand lags it and bends down on the upstroke, by amounts the
  research's photos set. `PoseState.glide`, 0 to 1, default 0, eases the wings
  to the glide posture (held out, a little bowed) and stills the flap.
- A species with no `flight` block keeps today's spread wing, its geometry and
  pose prints unchanged. The Kingfisher and the perchers are block models and
  are untouched.

### The flight posture

`PoseState.flight`, 0 to 1, default 0. At 1 on a detailed bird: the legs are
hidden (a swimmer's already are at `paddle` 0), the folded wing is hidden and the
flight wing shown, and the body sits level about the shoulders. The behaviour
sets `neckExtend` 0 for the folded neck. The tail is as built.

### The flock

`buildFlockModel` stays for block species. A species with a `detail` block gets
a skinned flock instead:

- The builder builds the bird once. Each further member is a new skinned mesh
  and skeleton over the same geometry and material, so the flock costs one
  geometry and one atlas.
- A flock gives each member a version, by the cast's counts per version, so a
  juvenile can fly in the line.
- The flock's object is hidden while it waits, as now. While it crosses, each
  member is registered for targeting with its own model, as the birds on the
  water are, in place of today's proxies.
- The mirror already draws whatever is in the scene; the plan measures the
  flock's cost in it and leaves the flock out of the mirror if it costs frames
  and no crossing shows in the water from the vantage.

### The flyover

`createFlyover` gains, for a flock that asks for it:

- **Flap and glide:** the leader alternates bouts of flapping and gliding, of
  the research's lengths. Each bird behind starts and stops its bout a delay
  after the bird ahead, so the flapping passes down the line. Each member
  reports its `glide` as well as its `wingPhase`.
- **Speed and spacing** per flock, from the cast entry or the species' settings,
  in place of the fixed 14 m/s and 2.5 m, which the geese keep.
- **Height:** a gliding bird sinks a little and a flapping one regains it, within
  the bob the members already have.

The `line` formation is checked against the research (a line astern, an echelon,
or a shallow V) and its spacing set in wingspans.

### Sound

The research says whether flying pelicans call away from their colonies. If they
are silent, the scheduler's entry for `amwpel` goes, and the guide says so. The
wing sound, if any, is left for a later round.

## The guide

The pelican's `marks` text is rewritten from the research, covering both the
swimming bird and the bird in flight. The catalog already has its photo and
recording.

## The viewer

- A pouch slider.
- Flight: the flight posture, a flap scrubber, and glide.
- A camera from directly below and from above, for setting the planform and the
  black against the reference photos.
- The herons' neck controls already serve the pelican's chain.

## Testing

- **Measurements:** the built pelican against the research's thresholds (culmen,
  bill depth, tarsus, wing chord, length, the waterline's place on the body).
- **Neck:** the chain's guards over every shape, and the crown's height and the
  bill's angle in each against the research.
- **Pouch:** at 0 the bill's lower outline is the rest outline, and at 1 the
  full one; a bill without a pouch is unchanged to the vertex.
- **Flight wing:** the span tip to tip within the research's range; the wrist's
  place along it; no crease at the wrist through a whole beat (the hand-off's
  rings stay in order); the wing clears the body through a beat; with `glide` 1
  the wing is still.
- **Paint:** the atlas's outer wing is black and its inner wing white, above and
  below, at the spans the research gives; the bill orange; the versions differ
  where the research says they do.
- **Style:** seeded runs hold the shares of loafing, cruising and feeding; in a
  bout the birds line up abreast at the spacing, dip within the window, and ring
  the water once a dip; no bird leaves the zone or comes inside another's
  spacing.
- **Flyover:** the flapping bout reaches each bird the delay after the one
  ahead; every member glides and flaps in the research's proportions; the
  geese's crossing is unchanged.
- **Flock:** members share one geometry and one material; nothing is registered
  while the flock waits.
- **Existing birds untouched:** every existing species' geometry and pose prints
  are unchanged, with `pouch`, `glide` and `flight` at their defaults.

## Performance

Measured on the Iris Xe as the water round did, at the eye, binoculars and
telescope, with reflections on and off, against the build before this round:

- with the pelicans on the water and no flock crossing;
- while the pelican flock crosses.

Startup is measured too: one more species and one or two more atlases to paint,
and the flock's members to build. The target is no loss at the telescope and
binoculars, and no more than 2 fps at the eye while the flock crosses.

## Known risks

- **The pouch and the folded neck.** At rest the bill lies along the foreneck.
  The pouch, the throat and the breast meet there, and the skin may pass through
  itself. The `hunch` goes only as far as the guards allow.
- **Size.** The builder has only built birds up to a heron. Ring counts, the
  folded wing's clearing, and the atlas's pixels per millimetre all stretch on a
  1.5 m bird; the black flight feathers need a clean edge.
- **The folded wing.** A pelican's tertials and secondaries ride high over the
  back on the water. The folded wing's outline may not reach that shape, and the
  trace may have to carry it in the body's profile.
- **Two views of one bird.** The side trace fixes the body that the flight
  posture also uses. A body traced swimming may look wrong from below; the
  half-widths are checked against the photo from below.
- **Nine skinned birds.** Cheap on the water's evidence (the scene already runs
  about fifty), but they add to the mirror while they cross.
- **Synchrony that looks mechanical.** Birds dipping on the same frame look
  like a machine; the window and each bird's own timing must come from the
  research, not from a shared clock.

## Build order

1. Research: the pelican document, with the tracing references.
2. The shared pieces for the water: the pouch, the `far-water` zone, and the
   `pelican` style, proven on a block pelican and the test bird.
3. The pelican on the water: traced, measured, painted, its neck shapes set
   against photos, its versions, and its place in the cast.
4. The flight wing and the flight posture, in the builder and the viewer, and
   the pelican's planform and paint.
5. The skinned flock, and flap-and-glide in the flyover.
6. The finish: the main spec and README, the guide's text, performance, and the
   user's telescope check on the water and in the air.

The work runs on one branch in a worktree. The plan decides who does each task.

## Changed during implementation

- **The pouch is a morph target, not a bone.** A bone can only scale the slack
  outline; a full pouch needs a shape of its own. `bill.pouch` gives both
  outlines, the full one is the geometry's one morph target, and
  `PoseState.pouch` sets its weight. It has its own atlas part, `pouch`, in
  free space, so no shipped atlas moves.
- **No `PoseState.flight`.** A swimmer's legs are already hidden when it isn't
  paddling, and the open wing already replaces the folded one. The flyover sets
  `wingSpread` 1 and the species' flight neck. `PoseState` gains `pouch` and
  `glide` only.
- **Birds can share a mesh.** The builder is split into what a species shares
  (mesh, joints, anatomy at rest) and what each bird owns (bones, pose).
  `buildDetailedBird(spec, variant, twin)` builds a bird on its twin's mesh; the
  flock uses it. Every shipped bird's geometry and pose prints are unchanged.
- **The flock's birds are lit a little from within** (`SKY_LIGHT`, 0.3 of their
  own paint). Seen from below, a bird is all underside, which the sun never
  reaches: the first flock crossed the sky black. The birds on the water keep
  the plain material.
- **The folded wing is a band along the flank,** not the whole side. All of the
  side above the water is white, wing and body alike, so the body's own back
  carries the coverts and tertials, and the wing is the strip at the water where
  the black primaries show. The juvenile's scaled coverts are painted on the
  body's upper side.
- **Five on the water** (four adults, one juvenile) and nine adults in the
  sky, as the research's tally supports.
- **Loafing stands in for preening and sleeping,** which need a head turned
  back: 57% of the time, half of it with the head sunk on the shoulders.
- **The feeding line is 0.6 m between birds,** inside the research's 0.4–0.65 m.
  Swimmers' spacing is a circle, so flockmates otherwise keep 0.9 m (a bird's
  length), and close to 0.4 m only within a bout.
- **Bouts are 5–9 dips** (50–90 s), the short end of the research's 1–4
  minutes, so a whole drive fits the far water's length.
- **A dip is 0.3 m deep at 60°,** so the head goes under to the eye. The
  research's shallow dips (0.15–0.25 m) at this angle would leave the head dry.
- **A bird that catches holds its bill under longer** (2.0 s against 1.3 s),
  and each dip rings the water twice: as the bill goes in, and smaller as it
  drains.
- **No voice.** Adults are silent away from colonies: the pelican is left out
  of the call scheduler, and its flock crosses without the looping call a flock
  otherwise carries.
- **Wingbeat 2.7 Hz** (it was 1.6), 13 m/s, 3.5 m between birds, flapping
  2.2–3.3 s and gliding 1–2 s, each bird 0.3 s behind the one ahead.
- **A dev-only hook,** `window.__lakewatch`, lists the birds and turns the view
  to a point, so a capture script can aim at a bird. It exists only on the dev
  server.
- **No implementation plan document.** The shared pieces were proven in a
  scratch worktree (`pelican-scratch`, one commit a piece) and the bird traced
  there; this section and the tests are the record.

## Performance as built

Chromium driven by Playwright on this machine's Intel Iris Xe, 1280 × 720, frames
a second over 4 s, two or three loads each, with reflections on. The spread
between loads is as wide as any difference between the builds.

| | Eye | Binoculars | Telescope |
|---|---|---|---|
| Before this round (`b3f7ed0`) | 45–47 | 56–59 | 48–59 |
| This round, pelicans on the water, no flock crossing | 43–49 | 55–56 | 46–57 |

Not measured: the frame rate while the pelican flock crosses, and startup. The
whole suite's ring-budget test (two seeds, ten minutes of the whole cast) takes
about half as long again with 29 swimmers, each minding every other.

## Known soft spots

- **The feet are hidden in flight.** From below a real pelican's orange feet
  show, tucked under the tail.
- **The folded wings don't lift in an arch during a dip,** as the research's
  video shows them doing.
- **The tertials' ragged "sail" at the stern is not modelled;** the rump's
  outline is smooth.
- **The neck stretched for a dip is thin where it leaves the breast.** The
  chain keeps the neck's length and girth, and the photographed bird's neck
  is fluffed out with loose plumage at rest.
- **The full pouch bulges downward only,** not to the sides, and the lower jaw
  does not open.
- **The under-wing's black has straight edges** in the wing's own span and
  chord; real secondaries step. At the flock's 100 m and more it reads as the
  photos do.
- **Sunk loafing does not lay the bill across the breast.** The head sits on
  the shoulders with the bill forward, as in flight.
- **Set by eye:** the neck shapes (against the photos, not measured to them),
  the full pouch's outline, the wing's beat and glide angles, the sink in a
  glide, the bill's width beyond its base, and every paint colour.
- **The model's size rests on a culmen of 315 mm** on a bird of unknown sex;
  the sexes differ by a fifth.
- **Not checked by eye in the game:** the pelicans' reflections and wakes at
  telescope range, a whole feeding bout from gather to swallow, and the flock
  from start to finish of a crossing. The line on the water and the line in
  the sky were each looked at in a few stills.

## Future rounds (not in this spec)

- Taking off from and landing on the water, joining the two groups.
- Soaring on a thermal.
- The Canada Goose detailed, on the flight wing and the skinned flock.
- Head turned to the side: sleeping and preening.
- Totipalmate feet.
