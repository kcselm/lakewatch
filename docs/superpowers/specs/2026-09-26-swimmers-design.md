# Swimmers: design spec

Date: 2026-09-26
Status: draft for review
Builds on: `2026-09-25-dowitcher-pectoral-design.md` (sized rings, `probeDepth`,
zones on the rendered terrain; branch `dowitcher-pectoral`, which merges before
this round's plan is written), `2026-09-25-mudflat-birds-design.md` (foraging
styles, peck reach), and `2026-09-24-detailed-birds-design.md` (the detailed
builder, painter, and viewer)
Amends: `2026-09-22-lakewatch-design.md` (the swim behavior, the cast, painting at
startup)

## Purpose

Every bird the player sees on the water is still a block model: 23 swimmers, the
nearest 10 m away, most of the birds in the scene. This round makes all six
swimming species detailed birds, each in the plumage a birder would actually see
on a Willamette Valley lake in late September, each feeding the way its species
feeds.

The identifications this brings:

- **Female Mallard beside female Gadwall:** the Mallard's orange bill with a dark
  saddle against the Gadwall's orange-sided bill with a dark culmen, the
  Gadwall's steeper forehead, smaller size, and white speculum patch.
- **Drakes in moult:** a Mallard drake part-way out of eclipse, a Wigeon drake
  with chestnut flanks but no white crown, and Shoveler drakes that are all still
  in eclipse. Most late-September ducks look female, and the player has to look
  past the colour to the shape and the bill.
- **How each one feeds:** Mallards upend, Gadwalls and Wigeons mostly dip and
  pick, Shovelers skim with their bills in the water and spin in pairs, Coots
  pump their heads and make short jump-dives, and Pied-billed Grebes vanish and
  come up metres away.

Success looks like this. Through binoculars at 10–20 m, a Mallard sits at its
true depth in the water. A drake's green head, white ring, chestnut breast, and
black curl read clearly, and a female's bill shows its dark saddle. A tip-up
lifts the tail and orange feet out of the water. Further out, through the
telescope, a pair of Shovelers spin with their bills in the water, and a grebe
rolls under and surfaces somewhere else. No bird stands in the water, overlaps
another, or pops from one pose to the next.

## Scope

In scope:

- Mallard (`mallar3`), Gadwall (`gadwal`), American Wigeon (`amewig`),
  Northern Shoveler (`norsho`), American Coot (`y00475`), and Pied-billed Grebe
  (`pibgre`) each get a `detail` block: traced, measured, and painted, with
  their late-September plumage versions.
- The detailed builder learns to swim: a waterline, a floating pivot, legs
  hidden while floating and paddling when shown.
- Builder features the six need: a bill width and depth profile, a hooked tip, a
  frontal shield, webbed and lobed feet, no tail, parts shown only on some
  plumage versions, and sections that can tilt where the spine turns sharply.
- Four foraging styles on `swim`: `dabbler`, `shoveler`, `coot`, `grebe`.
- Diving: a bird under the water is hidden and cannot be targeted.
- Swimmers keep their distance from each other.
- Cast entries give exact counts per plumage version.
- The painter moves into a Web Worker, and Begin waits for it.
- The viewer gains a float mode.
- The six research documents (already written) and the guide's `marks` text
  rewritten from them.

Out of scope:

- Flight for any of the six (none of them flies in the cast).
- Wigeon following and robbing Coots.
- Coot chases and splattering runs, and alarm dives (nothing in the game
  disturbs the birds).
- Wigeons grazing on land.
- Reflections of the birds in the water.
- Eurasian Wigeon, and feral or domestic-type Mallards.
- Converting the herons, the reed perchers, the Kingfisher, and the flyover
  flocks.

## Decisions made in brainstorming

| Decision | Choice |
|---|---|
| Which species | All six swimmers in one round |
| Behaviour | Species-true feeding styles on `swim`, as the shorebird rounds did on `probe` |
| Round structure | One phased spec: research first, then the shared pipeline proven on the Mallard, then the other five birds in parallel, then the finish |
| Workers | One subagent per bird, each in its own git worktree, merged one at a time |
| Plumage | Honest to late September, with moulting drakes and juveniles as the research finds them |
| Flock mix | Exact counts per plumage version in the cast, not a uniform random pick |
| Identification | By species: a female Mallard counts as a Mallard. The guide's `marks` text describes the versions the player will see |
| Painting | In a Web Worker, with Begin waiting until every atlas is ready |

## Decided since, from the research

- **The plumage versions** (below, per species), and the counts for each cast
  entry.
- **Three Pied-billed Grebes, not two,** so the scene shows the 2:1 mix of plain
  adults and striped juveniles.
- **No breeding-plumage Shoveler drake.** Every sexable drake in the Willamette
  photos from 11 September to 12 October is in eclipse. The drake the block
  model shows is not a late-September bird.
- **The Wigeon is a `dabbler`** with its own settings, not its own style.
- **The Coot's bill is not a duck bill:** narrow, taller than wide, and pointed,
  with a small autumn shield.
- **Swimmers keep their distance.** At 10 m two ducks passing through each other
  would be plain to see. Every style also has spacing of its own: Shoveler pairs
  spin 0.25 m apart, and grebes keep at least 10 m from each other.
- **Sections that tilt.** The dowitcher round found that the loft cannot follow
  a head resting on the breast: each ring is perpendicular to the spine, and
  where the spine turns sharply the underside can't reach forward without
  creasing, which left a 6–8 mm notch under the dowitcher's chin. A duck
  loafing with its head on its shoulders traces the same way.
- **Tails from the trace.** The dowitcher round also found the builder's tail
  hanging below the wing line on three species. Ducks carry the tail raised
  0–33°, so every swimmer sets `tail.angle` from its trace, and the plan finds
  out why the default hangs low.

## Changes to the Lakewatch design spec

In the Behaviors table, the `swim` row becomes:

```
| swim | Forage in the species' style: a dabbler cruises, loafs, dips its head, and upends; a shoveler skims with its bill in the water and spins in pairs; a coot pumps its head, pecks at the surface, and makes short jump-dives; a grebe dives and surfaces metres away, or sinks until only its head shows. Swimmers keep their distance from each other |
```

In Animation, add `tip-up, head-dip, skim, pair spin, coot head pump, jump-dive,
grebe roll-under and sink`.

The Bird models section notes that the six swimmers are detailed, and the
startup section that plumage atlases paint in a Web Worker behind the title
card.

## Research

The six documents are written and cited, in the dowitcher document's form:

- `docs/research/2026-09-25-mallard.md`
- `docs/research/2026-09-25-gadwall.md`
- `docs/research/2026-09-25-american-wigeon.md`
- `docs/research/2026-09-25-northern-shoveler.md`
- `docs/research/2026-09-25-american-coot.md`
- `docs/research/2026-09-25-pied-billed-grebe.md`

Each supplies measurements (section 9), late-September plumage and the mix from
an iNaturalist tally (section 3 and the appendix), field marks (section 4),
structure and the floating posture (sections 5 and 6), behaviour (section 7),
tracing references in the scratchpad, never committed (section 8), test
thresholds (section 10), and the style's settings (section 11). Every number
the plan uses comes from these documents. Where a document marks a number as an
estimate, the species file and the style table say so.

One source needs care: the Coot document cites a 2026 study of dive frequency
in Willamette Valley Coot flocks that it could read only as an abstract. No
number in this round rests on it.

## The builder learns to swim

### Floating

- Species with `posture: 'swimming'` build with the detailed builder. Today it
  refuses them (`src/birds/detail/build.ts`).
- The detail block gains `float: { waterline }`: the waterline's height in the
  traced side view, in metres, where the water meets the bird in the reference
  photo. The builder puts it at y = 0 in group space.
- The water is opaque, so everything below the waterline is hidden with no
  clipping. The hull below it is built from the trace and the research's draft,
  so a tip-up or a dive shows a whole bird.
- The research's heights above the water (back, crown, tail tip, wingtips,
  breast front) become tests (see Testing).

### The pivot

On a swimmer, the body bone sits on the waterline under the middle of the body,
not over the hips. `lean.x` pitches the body about that point, so a tip-up
lifts the stern and tail 0.10–0.15 m out of the water and puts the head and
breast under, as a real duck upends.

### Legs and feet

- Legs are built and rigged as today, folded back under the belly, and hidden by
  bone scale while the bird floats.
- They show, paddling, when a tip-up tilts the stern clear of the water, at the
  start of a coot's jump-dive, and as the kick of a grebe's roll-under.
- `PoseState` gains `paddle` (0 hidden .. 1 shown and paddling). Its stroke rate
  is the species' (about 2.4 strokes a second for a Mallard).
- `detail.feet` is `'webbed'` (a membrane between the three front toes) or
  `'lobed'` (flaps along each toe, the Coot's three-lobed middle toe and the
  grebe's lobes set far back). Without it, feet are today's plain toes.

### The bill

- **Profile.** An optional `bill.profile` lists points along the bill, each a
  fraction of the culmen with a width and depth as multiples of the base
  `billWidth` and `billDepth`. When present it replaces the single `taper`.
  - A Mallard's bill is narrowest at 20% of its length and widest at 58–74%.
  - A Shoveler's widens steadily to 1.79 times its base width at 75%.
  - A Coot's is taller than wide, narrowing to a point.
- **Hook.** An optional `bill.hook` drops the tip by a few millimetres over its
  last tenth: the ducks' nail (about 1 mm) and the grebe's hooked tip
  (1–1.5 mm). The nail's colour is paint.
- **Shield.** `bill.shield` builds the Coot's frontal shield: a plate from the
  bill's base up the forehead, blended into the head, with its own paint region.
  The research sets it at 9 mm long and 7 mm wide in late September, with a
  4 × 5 mm red-brown callus on adults, which is paint.
- A bill with no profile, hook, or shield builds exactly as today.

### Tail

`tail.shape` gains `'none'`. The grebe has no visible tail, only a hidden tuft
of about 30 mm. Its white stern puff is the rear of the loft, and those rings are
weighted to the tail bone, so `tailTilt` cocks the puff.

### Parts shown only on some versions

The Mallard drake's curl, two black loops about 20 mm high on the rump, exists
only on the `male` version. A part can name the versions it belongs to. It is
built on every bird of the species, bound to its own bone, and hidden by bone
scale on the others. Each version still gets its own atlas.

### Sections that tilt

A profile station may give its section a `tilt` in degrees, turning the ring
away from perpendicular to the spine. Where the spine turns sharply (a head
resting on the breast), tilted rings stay apart, and the underside can follow
the photo's throat without creasing. The default is 0, so every existing
species builds as today.

The dowitcher's chin is retraced with it in this round. If a scratch build shows
that tilt cannot remove the notch without creasing, the plan says so and the
notch stays a known soft spot.

### Everything else

The eyes, folded wing, painter, and atlas layout are unchanged. The six
shorebirds must build exactly as before: a geometry fingerprint of each is a
test.

## The `swim` styles

### Spec and context

`FORAGING` gains `'dabbler' | 'shoveler' | 'coot' | 'grebe'`. `swim` reads the
species' style, and a swimmer with none behaves as a `dabbler`. `validateCast`
rejects a probe style on a swimmer and a swim style on a prober. The plan
decides whether probe and swim styles become two types.

Each style is a settings table and a state machine beside a shared swimmer body,
the way `probe` shares `createBody` between its styles. The values come from the
research's section 11; the field names are settled in the plan.

### What every style shares

- **Cruise** toward a spot near the flock target, with wake rings as today.
- **Loaf:** drift with the wind, neck drawn in, sometimes asleep or preening.
- **Alert:** neck up for 1–4 s.
- **The flock:** birds of one cast entry share a group, as probers do today.
  Its target drifts a short way at a time (the dowitcher's drifting flock), and
  each style sets its own radius and spacing.
- **Spacing:** each swimmer steers away from any other swimmer in its zone,
  of any species, closer than its style's spacing. Flockmates use the style's
  own spacing: a Shoveler's tandem 0.2–0.35 m, a Mallard's 0.3–2 m.
- **Motion rules** from the shorebird rounds: nothing snaps, poses ease in and
  out, and no move leans on the zone clamp.

### `dabbler` (Mallard, Gadwall, Wigeon)

- **States:** cruise, loaf, alert, preen, `surfaceDabble` (bill at the surface,
  swimming slowly), `headDip` (head and neck under for 0.5–3 s), and `tipUp`.
- **Tip-up:** the body tilts 80–90° about the float pivot in 0.2–0.5 s, the tail
  goes up, the feet show and paddle, and it comes back level in 0.2–0.3 s. Tip-ups
  come in bouts of 2–15 with 1–5 s level between.
- **Per species** (research section 11):

  | | Mallard | Gadwall | Wigeon |
  |---|---|---|---|
  | Cruise speed | 0.48 m/s | 0.40 | 0.40 |
  | Feeding: surface / head-dip / tip-up | 10 / 45 / 45 | 50 / 38 / 12 | mostly surface and head-dips; tip-ups ≤ 10% |
  | Tip-up | 4 s (1.5–6) | 3.1 s (1.1–4.5) | 2–4 s, 70–90° |
  | Flock | loose group of four within 3–5 m, often two pairs | a pair 0.1–0.45 m apart, plus one | 0.3–1.0 m apart |

- **Rings:** at the start and end of each tip-up and head-dip, and every 1–2 s
  while dabbling, size by the research.

### `shoveler`

- **States:** cruise, loaf, `skim`, `circle`, and a rare `tipUp`.
- **Skim:** two kinds, half each. Travelling at 0.32 m/s with the head down for
  30–60 s, or pottering at 0.03 m/s with dips of about 1.75 s. The bill is held
  20–35° to the surface. No side-to-side sweep, only a slow wander of ±5–8°.
- **Circle:** two birds, nose to tail, their centres 0.25 m apart, turning about
  their midpoint once every 3.4 s. The direction is chosen per bout and kept.
  Bouts last 4–8 s, and now and then a minute or two. The heads stay under to
  the eye. The two birds share a spin record in the group, so the pair turns as
  one.
- **Tip-up:** about one per 10 minutes of feeding, 1–2.5 s, only 50–60°
  nose-down.

### `coot`

- **States:** cruise with the head pump, `peck`, `headDip`, a rare `tipUp`,
  `dive`, loaf, preen, and a tail flick when alert.
- **Head pump:** about 2.2 a second, only while moving. The head holds nearly
  still, then thrusts: the bill tip moves about 5 cm fore and aft and 2–3 cm up
  and down. `headBob` carries it, and the style computes the hold-then-thrust
  shape.
- **Speed:** feeding swim 0.2 m/s; travelling 0.4–0.5 m/s.
- **Peck:** 2.5 pecks a second in bouts of 2–8 s, the bill touching the water
  30–60 mm ahead of the breast.
- **Dive:** a jump start, head down 0.2–0.3 s and then a lunge that arcs the
  body near vertical with the tail and feet out as the head enters, under in
  about 0.5 s. It stays down 2.5 s on average (1.3–5.5), moves 0–1 m, and comes
  up back first. Dives come in bouts of 2–5, 10–25 s apart. A given bird
  starts a bout about once in 5–10 minutes.
- **Flock:** nearest neighbours 0.4–0.9 m.

### `grebe`

- **States:** cruise (0.15 m/s), `peer` (face in the water, about 1 s), `dive`,
  `under`, `resurface`, `sink` (periscope), and loaf.
- **Dive starts:**
  - **roll-under**, 70%: the face goes in, the back humps, the stern tips up
    20–30° showing the white undertail, gone in 0.4–0.65 s
  - **splash**, 15%: the stern puff rises, then the body is driven straight
    down
  - **sink**, 15%: down to back-awash in about 0.4 s, a pause, then under
  - never a duck-style forward leap
- **Under:** 7.6 s on average (2–15), travelling 3.7 m (0–12) about the current
  heading, then up with a ring, look about for 1–3 s, and pause 2–10 s. Bouts
  are 3–12 dives. About half the grebe's time is spent in bouts, so about 35%
  of it under water.
- **Sink-and-watch:** settle over 1–3 s until only the head and upper neck show
  (the back 45 mm under), hold 5–30 s, then rise or slide into a dive. About
  once every 3–6 minutes.
- **Spacing:** at least 10 m from other grebes.

### Diving and targeting

- A diving bird's controller reports its depth. `y` goes below the water, and
  the opaque surface hides it.
- A bird fully under the water is hidden and drops out of the targeting
  candidates (`pickTarget` works from registry positions, so otherwise the
  player could identify a bird they cannot see). An identification in progress
  on a bird that dives is dropped, the way it is when the bird leaves the
  reticle.
- Rings mark the start and end of every dive, sized by the research.

### Rings on the water

With 24 swimmers and six dowitchers sharing the 32-ring buffer, every ring rate
is budgeted in the plan: the steady count of live rings across the cast is
measured, and a swimmer's wake must not be pushed out before it fades. If the
budget can't be met, the plan raises the buffer and measures the shader cost.

## The six birds

The research sets the numbers. The versions and counts for each:

| Species | Versions | Cast |
|---|---|---|
| Mallard | `male` (breeding, with the curl), `maleMoult` (body nearly done, head speckled grey-brown, green only on the crown and nape, no ring, no curl), `female` (adult females and juveniles) | 4 in `near-water`: 1 male, 1 maleMoult, 2 female |
| Gadwall | `male` (93% of local drakes are already in breeding plumage), `female` | 3 in `open-water`: 1 male, 2 female |
| American Wigeon | `female` (the female-type: females, juveniles, and eclipse drakes with the wing hidden), `eclipse` (chestnut flanks, white forewing bar), `male` (white crown, green patch; 7% of drakes) | 5 in `open-water`: 3 female, 1 eclipse, 1 male |
| Northern Shoveler | `eclipse` (yellow to orange-yellow eye, blackish bill, greyish head, rufous scalloped flanks), `female` (dark eye, orange-sided bill) | 3 in `open-water`: 2 eclipse, 1 female |
| American Coot | `adult` (slate-black head, white bill with a dark band, red eye, small shield with a red-brown callus), `juvenile` (grey head, pale throat, greyish bill, small pale shield, brownish eye) | 6 in `near-water`: 4 adult, 2 juvenile |
| Pied-billed Grebe | `basic` (plain brown, buff throat, pale unringed bill), `juvenile` (striped face) | 3 in `open-water` (was 2): 2 basic, 1 juvenile |

Structure the builder must show, from the research:

- **Mallard:** traced length 0.36 m; culmen 53 mm; the female's bill saddle from
  about 8–20% to 80% of its length; a speculum mostly hidden on the water (a
  10–15 mm white fleck).
- **Gadwall:** 0.9 of the Mallard's length, 0.74 of its culmen, 0.79 of its bill
  width; a parallel-sided bill; a steeper forehead; the white speculum patch
  shows on about two-thirds of floating birds.
- **Wigeon:** a short blue-grey bill, 36 mm, black-tipped, parallel-sided with a
  round tip; a round head; a wedge tail raised 17–33°.
- **Shoveler:** the spoon bill (the width profile above); sits low in front, the
  back rising about 8° toward the tail.
- **Coot:** bill 31.8 mm without the shield; lobed toes; white undertail wedges
  that show when the tail lifts.
- **Grebe:** culmen 21 mm, deep, the top arching down to a small hook; no
  visible tail; rides low, the back only about 28 mm above the water when sleek.

Every species' guide `marks` text is rewritten from its research, describing the
versions the player will see. The Shoveler's says the drake is in eclipse, with a
yellow eye.

## The cast

- A cast entry's `plumage` may be a record of version to count, summing to
  `count`, for example `{ "male": 1, "maleMoult": 1, "female": 2 }`. The spawner
  assigns exactly those. `"male"`, `"female"`, and `"mixed"` keep working.
- `validateCast` checks that every named version exists and the counts sum to
  `count`.
- The six swimmers' entries change to the counts above. Every other entry is
  unchanged.
- The zones stay as they are: `near-water` for the Mallards and Coots,
  `open-water` for the rest.

## Painting in a Web Worker

- The painter is pure TypeScript over a pixel buffer. It moves into a Web
  Worker, which paints each species-and-version atlas and hands back the pixels.
- Begin waits, with a progress indicator on the title card, until every atlas
  the cast needs is ready, so a detailed bird never appears unpainted or falls
  back to blocks.
- The dev overlay still reports each atlas's paint time.
- The atlas count goes from 6 to 20. The dowitcher round measured 57–65 ms per
  atlas on this machine, so about 1.2 s of painting in all. The worker keeps
  the title card responsive while it runs.

## Viewer

- **Float mode** for swimmers: the water plane sits at the bird's waterline, as
  in the game.
- **See-through:** a toggle to show the hull under the water.
- **Pose controls:** tip-up, head-dip, skim, sink, dive depth, and paddle.
- **Versions:** any version of either bird, so a female Mallard can stand beside
  a female Gadwall.
- **Pairs to use:** female Mallard and female Gadwall; Wigeon beside Gadwall;
  Shoveler beside Mallard; Coot beside Grebe.
- **Field views:** binoculars at 15 m for the near water, and the telescope at
  30–40 m for the open water.

## The work, and who does it

1. **The shared pipeline and the Mallard,** task by task on the swimmers branch
   in its own worktree: cast counts, the swimming builder, the bill, feet, tail,
   version-only parts, tilt, the viewer, the four styles, diving and targeting,
   spacing, the painter worker, and then the Mallard as the worked example.
2. **The other five birds in parallel.** One agent per bird, each in its own
   worktree off the swimmers branch after the Mallard lands, using the most
   capable model. Its brief is the bird's research document and the Mallard's
   species file and tests as the pattern.
   - Each agent traces the profile from its chosen photo, scaled by the culmen,
     writes the `detail` block and each version's paint layers, and rewrites the
     `marks` text.
   - It adds a species test file, as `dowitcher-pectoral.test.ts` does.
   - It checks the bird in the viewer against its reference photo and at game
     distance, on its own dev-server port, saving screenshots.
   - Each agent edits only its own species file and test file. A bird that
     needs a builder change stops and reports; shared code changes only on the
     swimmers branch, one task at a time.
   - Each bird gets its own reviewer, and the birds merge one at a time with
     the full suite run after each.
3. **The finish:** cast counts, the main spec and README, a performance reading,
   and the user's look through the telescope.

## Testing

### Already in place

`species.test.ts` runs over every detailed species, so all six are held to their
measurements within 5%, no crease in the loft, and no bone turning more than
0.7 rad in a frame under their cast behaviour.

### Builder

- The waterline sits at y = 0 at rest.
- The legs are hidden while floating and shown in a full tip-up.
- The pivot: at full tip-up the stern is 0.10–0.15 m above the water.
- A bill profile is followed within 0.5 mm at each point. A hook drops the tip
  by its value. A shield exists only where it is specified.
- Webbed and lobed feet build closed meshes. `tail: 'none'` builds no tail
  geometry, and `tailTilt` still moves the stern.
- A version-only part is visible on its versions and hidden on the rest.
- A tilted station removes a crease that the untilted section has, on a test
  fixture.
- The six shorebirds' geometry fingerprints are unchanged.

### Species

One test file per swimmer, with bounds from its research's section 10:

- culmen, length, tarsus, wing chord, and tail within the published ranges
- heights above the water (back, crown, tail tip, wingtips) within the
  photo-measured ranges
- the bill profile's shape (for example, the Shoveler's widest point at 0.65–0.80
  of the culmen and 1.6–2.0 times the base width)
- field marks read off each version's atlas: the female Mallard's saddle, the
  Gadwall's white speculum, the Wigeon's white crown only on `male`, the
  Shoveler eclipse drake's yellow iris, the Coot's white bill and dark band, the
  juvenile grebe's stripes
- the pairs that must differ, differing: female Mallard against female Gadwall
  (bill pattern, speculum, size), Coot adult against juvenile

### Behaviour

For each style, over seeded simulations:

- time shares, bout lengths, and durations within the research's ranges
- birds stay inside their zone, and no frame moves one further than its pace
- nothing snaps: `reach`, `lean`, `paddle`, and `headBob` change smoothly
- the Shoveler pair turns as one, 0.25 m apart, in one direction per bout
- a grebe comes up 0–12 m from where it went down
- spacing: no two swimmers in a zone come closer than the smaller of their
  spacings, beyond a brief tolerance
- a bird under the water is not a targeting candidate
- the cast schema accepts counts per version and rejects counts that don't sum

### What tests cannot check

- The viewer's side and field views against the credited reference photos,
  during the work.
- Performance: 20 atlases and 24 more detailed birds, measured against the
  build before this round on the same machine.
- The user at the telescope and binoculars:
  - 60 fps on their integrated GPU
  - whether the ducks sit at the right depth and read as their species and sex
  - whether each style reads as its species: upending Mallards, dipping
    Gadwalls, spinning Shovelers, pumping Coots, vanishing grebes
  - whether any birds overlap or snap

## Known soft spots

- **Drafts are computed, not seen.** No reference photo shows a hull under the
  water. Each draft comes from buoyancy and an estimated body depth; the heights
  above the water are measured.
- **Behaviour rests on few birds.** Most timings come from a handful of birds on
  short videos, often in winter or spring, and each style table marks which.
- **Bill top views** rest on one or two museum skins each.
- **Photographer bias** in the plumage tallies: bright drakes and tame park birds
  are over-represented, and some juveniles are indistinguishable from females in
  photos.
- **The Shoveler's guide photo** shows a breeding drake in flight, which the
  player won't see on the lake.
- **One size per species,** at the mean of the sexes; drakes are larger.
- **Coots and grebes spend time under water,** so a player may find a grebe
  hard to identify; that is true to life.

## Build order

The research came first and is committed with the plan. The plan's tasks,
phase 1 in order:

1. Cast counts per plumage version.
2. The swimming builder: waterline, pivot, legs and `paddle`.
3. The bill profile, hook, and shield.
4. Webbed and lobed feet, `tail: 'none'`, and version-only parts.
5. Section tilt, and the dowitcher's chin retraced with it.
6. The viewer's float mode, see-through, and pose controls.
7. The shared swimmer body, spacing, and swim flocks.
8. `dabbler`.
9. `shoveler`, with the pair spin.
10. `coot`.
11. `grebe`.
12. Diving: hidden under the water and not targetable; the ring budget.
13. The painter in a Web Worker, and Begin waiting for it.
14. The Mallard, detailed, with its tests: the worked example.

Phase 2, in parallel: Gadwall, Wigeon, Shoveler, Coot, and Grebe, each detailed
with its tests.

Phase 3: the cast, the main spec and README, performance, and the telescope.

## Future rounds (not in this spec)

- Wigeons following Coots to rob them.
- Coot chases, and alarm dives when something disturbs the birds.
- Flight for the swimmers.
- Reflections of the birds in the water.
- The herons, the reed perchers, the Kingfisher, and the flyover flocks.
