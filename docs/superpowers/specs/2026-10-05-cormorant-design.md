# Double-crested Cormorant, round 1 (on the water and on the snag): design spec

Date: 2026-10-05
Status: draft for review
Builds on: `2026-09-30-canada-goose-design.md` (the amphibious bird, `afloat`),
`2026-09-30-pelican-design.md` (the flight wing, a bird built on a twin's mesh),
`2026-09-27-herons-design.md` (the neck chain, neck shapes, `headPitch`),
`2026-09-26-swimmers-design.md` (swim styles, divers hidden under water, the
ring budget), and `2026-09-24-detailed-birds-design.md` (the detailed builder,
painter, and viewer)
Amends: `2026-09-22-lakewatch-design.md` (the swim and perch behaviors, the
composition, the cast, the startup count, the bird models)

## Purpose

The Double-crested Cormorant is the dark, low-riding diver every valley lake has
in autumn, and the bird that stands on a dead stump with its wings hung out to
dry. The game doesn't have it at all yet.

It is also the first bird made outside the game. Every detailed bird so far is
lofted from rings and painted by code, and the rings fold where the body turns
into the neck and the neck into the head; a painted atlas of 512 pixels holds
only so much. This bird is modelled, textured, and weighted in Blender, exported
as a glTF, and posed in the game by the same skeleton and pose code as every
other detailed bird. The pilot (`scripts/blender/doccor/`, the research's
proportions) showed the shape and head gain over the lofted goose in the game's
own renderer.

This is the first of two cormorant rounds:

1. **This round:** the authored-bird pipeline; a cormorant that swims, dives and
   swallows fish on open water; and three that stand on stumps in the water,
   resting and drying their wings.
2. **Flight:** a cormorant flies low over the water at 5.2 Hz, a fisher patters
   off the water and flies to the stumps to dry, and a dry bird drops off to
   fish.

Success looks like this. Through the telescope at 30-40 m, three black birds
stand upright on the stumps, tails propped, necks in a loose S, and one of them
holds its wings out with the wrists up and the hands hanging. Out on the water a
fourth rides so low that only its neck and a dark streak of back show. It slides
under head first and is gone for twenty seconds; it comes up a few metres away,
and now and then with a fish held crosswise that goes down in a few forward
jerks. Close in, the head shows the hooked bill, the orange throat skin and the
turquoise eye, and the back is scaled bronze-brown with black edges. No ring of
the loft folds under the throat, because there are no rings.

## Scope

In scope:

- **Authored birds:** a detailed species can take its mesh, skin, and textures
  from a glTF made in Blender instead of the lofted profile and painted atlas.
  Everything after the mesh (bones, pose, wings, legs, `afloat`, flocks, the
  viewer, the measures) is shared with the lofted birds.
- **The Blender pipeline:** the pilot's scripts become a headless build
  (`blender -b -P`) that writes the mesh and one texture set per version, with
  the game's skeleton and weights. The output is committed; `npm run build`
  doesn't need Blender.
- The Double-crested Cormorant (`doccor`), detailed and authored, in two
  versions: `adult` and `juvenile`.
- **Perching on a detailed bird:** an amphibious bird stands on a perch above
  the water with its body raised, its tail propped on the wood, and its feet
  gripping, using `afloat` and the leg IK already there.
- **Wing-drying:** a held spread of the flight wing, wrists up and hands
  drooping, as a pose input.
- A `cormorant` style on `swim`: loafing, dive bouts, surfacing with a fish, and
  swallowing it.
- A `cormorant` style on `perch`: resting, the drying sessions, and slow flaps of
  the spread wings, facing into the wind.
- **Stumps:** a group of dead stumps standing in open water, each with a perch,
  and a zone on them.
- The cast: three on the stumps (two adults and a juvenile) and one fishing.
- The guide's `marks` from the research; viewer controls for the drying spread.

Out of scope:

- Flight of any kind, take-off, landing, and the fisher's trip to the stumps
  (round 2). Each bird keeps its place for the visit.
- Flyover flocks of cormorants. The valley photos show single fliers (research
  section 7.4).
- Fishing flocks: valley birds fish alone (research section 7.1).
- The head-shake after swallowing, and turning the head to the side, as for every
  bird so far.
- The fish itself as geometry: the swallow is told by the pose.
- Moving the lofted birds to Blender. Each later species chooses.

## Decisions made in brainstorming

| Decision | Choice |
|---|---|
| Rounds | Two: the water and the snag (this round), then flight and the exchange between them |
| Pipeline | Blender, chosen to look better than the lofted birds. The pilot was compared in the game's renderer beside the goose |
| Plug-in point | The game's own skeleton: the Blender armature has the builder's bone names and parents, so the pose code needs no new rig. A model with its own rig and its own animations was rejected: it would have to rebuild the neck chain, `afloat`, the leg IK, and the flock |
| Assets in the repo | The Blender scripts and their output are both committed. Generating the model in CI was rejected: every build and deploy would need Blender |
| Versions | Adult and juvenile in this round: 24 of the 52 birds the research could age were young |
| Round 1 cast | The research's four: three on stumps (two adults, one juvenile), one fishing |
| The exchange | Fixed roles this round (decided in drafting). The research's fisher flies to the snag to dry and a dry bird drops off to fish; that needs flight, so it waits for round 2 |

## Changes to the Lakewatch design spec

In the Behaviors table, the `swim` row gains:

```
The cormorant style: one bird loafs low in the water, then fishes in bouts of dives, sliding under head first and staying down about 22 s, surfacing a few metres on, now and then with a fish it swallows head first in forward-upward jerks
```

and the `perch` row gains:

```
The cormorant style: stands upright on a stump with its tail propped, rests with its neck drawn in or erect, and in drying sessions holds its wings out, wrists up and hands hanging, facing into the wind
```

In Animation, add `cormorant dive, swallow, wing-drying`.

In Composition, open water left of centre gains a cluster of dead stumps
standing in the water. In Components, Bird models gains authored birds: a
detailed species whose mesh, skin and textures come from a glTF made in Blender
(`scripts/blender/`, `public/models/`).

The title card's count gains one model per authored species and one texture set
per version.

## Research

`docs/research/2026-10-04-double-crested-cormorant.md`, written for this round,
supplies every number below. It is committed with the plan.

Its findings that set the design:

- **Size** (sections 2.7, 9): bill tip to tail tip 0.60 m swimming, 0.79 m
  stretched; culmen 57 mm; bill 17 mm deep, 12 wide, hooked 6 mm; wing chord
  315; tail 165 (12 feathers); tarsus 65; outer toe 86; wingspan 1.20 m; mass
  2.0 kg.
- **Floating awash** (section 6.2): the back 25 mm above the water, the crown
  165 mm, the tail flat on the water, about 80% of the body's depth under; the
  bill about 15° up.
- **Perched** (section 7.3): the body 35-45° above level, the tail down the
  perch as a prop; 0.57 m from perch to crown with the neck erect, 0.42 m drawn
  in; about a body width apart on a shared snag.
- **Diving** (section 7.1): a smooth forward slide head first, a small leap now
  and then; dives of 22 s (15-30), pauses of 12 s (8-20), bouts of 6-15 dives,
  then minutes of rest. Most surfacings bring nothing; a small fish is swallowed
  in 1-2 jerks, a large one (one catch in five) is juggled 3-15 s and swallowed
  in 4-5.
- **Wing-drying** (section 7.2): only when wet; a minute standing after landing,
  then bouts of 0.5-3 minutes, 2-4 of them, about 4-5 minutes in all, 10-60 s
  folded between; wings about three-quarters open, wrists at shoulder height or
  above, hands drooping, tail spread; facing into the wind (±20°), away from the
  sun in calm; slow flaps of the spread wings now and then. About one perched
  bird in ten is spreading at any moment.
- **Plumage** (sections 3.3, 4.1, 9): the adult black with a faint green gloss,
  a scaled grey-brown to bronze back, orange-yellow face and throat skin, a
  green-turquoise eye, no crests in September; the juvenile with a pale buff
  throat and breast shading to a dark belly, a grey-brown back with dark edges,
  and yellower skin.
- **Sound** (section 7.5): silent but for grunts at take-off and landing, which
  this round doesn't have.

## Authored birds

### The seam

`construct(spec)` makes a `Built` from the lofted profile; `buildDetailedBird`
makes the bones, the skinned mesh, and `pose()` from the `Built`. The pose code
needs from a `Built` only the 26 joints, the hip, knee, foot, bill tip and
direction, the first chain segment, the tibia and tarsus lengths, `ashore`, and
the body's length (for `headBob`). So the seam is the `Built`:

- `construct(spec)` for a lofted bird, as now.
- `authoredBuilt(spec, asset)` for an authored one: the joints read from the
  glTF armature by bone name, the geometry's skin indices remapped from the
  file's joint order to `BONE_NAMES`, the anatomy from named landmarks in the
  file, the leg lengths from the joints, and `ashore` computed as the builder
  does from the standing feet.
- `Built` carries `bodyLength` in place of reading `profile.length`; an authored
  bird has no `Profile`, and the code that needs one (the viewer's stations and
  spine, `crownNow`, the fold test) says so and skips it.

Bones keep the builder's rest convention (no rest rotation, each at its joint):
the Blender bones' own orientations are ignored. The inverse bind matrices are
made the way the lofted bird's are, from the rest joints.

### The asset

Per authored species, under `public/models/<code>/`:

- `<code>.glb`: the mesh, its skin (joints named as `BONE_NAMES`, weights at
  most four per vertex), its UVs, and empties for the landmarks (`billBase`,
  `billTip`, `tailRoot`, `tailTip`, `eyeL`, `eyeR`, `wrist`, `wingTip`). No
  images in it: the tests read it in Node, where images can't load.
- `<version>.color.webp`, `<version>.normal.webp`, `<version>.rough.webp`: one
  set per version, 1024 pixels square.
- Separate geometry for every part a pose hides or swaps, as the lofted birds
  have: the folded wings on `wingFoldL/R`, the spread wings on `wingL/R` and
  `handL/R`, the legs and feet on the leg bones.

Budget: at most 9,000 triangles and 1.5 MB for the mesh and all texture sets of
one species. The pilot was 16,000 triangles and 6 MB, because of 2048-pixel
PNGs and an undecimated wing and tail.

### Loading

The glb and its textures load at startup with the atlases, in `prepareBirds`, as
a third promise beside the painting and the folds, with its own count on the
title card. Once loaded, the `Built` is cached per species, so
`buildDetailedBird` stays synchronous and flocks share one mesh as they do now.
The material is a `MeshStandardMaterial` per version, with the colour, normal,
and roughness maps, cached as the painter caches atlases. The viewer awaits the
same loader before it builds.

In the species file, `detail.authored: { model: 'doccor' }` replaces `profile`,
`rings`, `bill`, `eye`, `wing.outline`, and the paint layers, which an authored
bird doesn't use; `rig`'s neck chain names bones, not stations. The schema says
which fields each kind needs.

### The Blender build

`scripts/blender/doccor/` keeps the pilot's parts (body, bill, folded wings,
tail, laid feathers, materials, bake, export) and adds:

- **Legs and feet:** a short black tarsus (65 mm) and totipalmate feet, all four
  toes webbed, the outer toe longest (86 mm), on the leg bones.
- **The flight wing:** a 1.20 m span from the research's chord and planform,
  laid as primary and secondary feathers, black-brown, on `wingL/R` and
  `handL/R`. Folded when hidden, as the pelican's is.
- **The rig:** an armature with the builder's bones at the cormorant's joints,
  and weights by part and by heat (automatic) inside each part.
- **Landmarks:** the empties named above.
- **The juvenile:** the same mesh, its own paint (`materials.py` takes a
  version), its own bake.
- **The scaled back, revised:** each laid feather rounder at the tip, with a
  softer black margin, so the bake reads as scales and not tiles. The pilot's
  feathers baked into rectangular tiles at game distance.
- **A driver,** `build.py`, running every step headless and writing the files.
  It records Blender's version in the glb's `asset.extras`.

## The cormorant

### `doccor`

- **Posture:** swimming and amphibious (built floating; `afloat` 0 stands it on
  its feet).
- **Measurements:** as the research's section 9, with `length` the traced 0.60 m.
- **Float:** the back 25 mm above the water at mid-body, the tail on the water.
- **Neck:** a six-joint chain, as the goose's, with the research's shapes: swim
  (upright, bill 15° up), erect (perched, crown 0.23 m above the shoulders), rest
  (a tight S, head on the shoulders), dive (stretched forward and down 30-45°),
  and swallow (bill 20-40° up).
- **Flight wing:** the span, chord, and wrist as the research gives them; used
  only for drying this round.
- **Versions:** `adult` (default) and `juvenile`.
- **Guide text:** from the research's field marks (section 4.2): long dark
  waterbird riding low, thick kinked neck, hooked bill, orange-yellow face, the
  juvenile pale-breasted.

## Perching

A perched cormorant is an amphibious bird at `afloat` 0 with its group on the
perch point. Three additions make it stand on wood:

- **The body raised:** `lean.x` negative tips the body up about the hips; at
  -0.7 rad it stands 40° above level. The legs hang from `root`, so the feet stay
  planted (the herons and the goose rely on this already).
- **The tail as a prop:** a new `PoseState.tailProp` (0-1) turns the tail down
  until its tip touches the perch's height under it, so the tail rests on the
  wood whatever the lean.
- **The grip:** the toes lie along the perch's top. A stump's top is flat, so
  the feet stand as on the ground; nothing new is needed while the perches are
  flat-topped.

The perch behaviour's existing loop flight is off for this style: the bird
doesn't fly this round.

## Wing-drying

A new `PoseState.dry` (0-1) holds the flight wings out from the folded wing:

- the humerus out and up from the shoulder, the wrist at shoulder height or
  above;
- the hand hanging down and out from the wrist, so the trailing edge droops;
- the wing about three-quarters open at 1.

The fold and spread geometry swap as `wingSpread` swaps them today, at
`dry > 0.05`. `wingPhase` with a small amplitude gives the slow flaps of a spread
wing. The pose is set by eye against the research's photos
(`doccor-spread-travis.jpg`, `doccor-spread.jpg`, the game's `doccor.jpg`), which
show the near wing reaching about 0.39 m from the shoulder to the tip.

## The `cormorant` style on `swim`

### States

- **Loaf:** floats low, neck upright, bill 15° up, drifting; minutes at a time.
- **Cruise:** swims slowly (an estimate of 0.3-0.5 m/s) to a new spot in its
  zone.
- **Dive:** the forward slide. The neck stretches forward and down, the body
  follows, arching, and the tail goes last, over about 1 s; one dive in five
  starts with a small leap. A ring at the entry. `submerged` once under, so the
  spawner hides it.
- **Under:** 22 s (uniform 15-30), moving toward a surfacing spot 3-10 m away
  that `clearAt` finds free, as the grebe's does.
- **Surface:** comes up head first, a ring; one surfacing in six brings a fish.
- **Swallow:** a small fish: 1-2 forward-upward jerks of the head over about 1 s.
  A large one (one in five catches): the head held level and worked for 3-15 s,
  then 4-5 jerks.
- **Pause:** 12 s (8-20) on the surface, then the next dive, for a bout of 6-15
  dives; then loaf.

The time budget follows the research's section 7.1: fishing in bouts, resting for
minutes between. The grebe's state machine is the template; the settings are the
cormorant's own.

### Rings

An entry ring, a surfacing ring, and a small ring for each swallow's jerk. One
fisher adds about one ring every 10 s to the budget's 64. `cast.test.ts`'s
ring list gains `doccor`.

## The `cormorant` style on `perch`

### States

- **Rest:** stands upright, `lean.x` about -0.7, tail propped, neck drawn in
  (rest) or erect, a little sway in the wind.
- **Drying session:** a minute standing, then bouts of spreading of 0.5-3
  minutes, 2-4 of them, 4-5 minutes in all, folded 10-60 s between. During a
  bout the bird turns to face the wind (within ±20°), and now and then flaps the
  spread wings slowly.

### How often

The research has only wet birds drying, and the birds on the stumps don't fish
this round. Each perched bird has a drying session every 25-45 minutes, its first
in the first 10 minutes of the visit, so a player who watches for a few minutes
sees one. Over a long visit a session of about 4.5 minutes every 35 minutes on
average has about one perched bird in nine spreading (computed), close to the
research's one in ten.

### Spacing

Each bird has its own perch on its own stump. Two birds never share one.

## The stumps

A cluster of three or four dead stumps standing in open water left of centre,
about 30-40 m from the vantage, in the telescope's range, and away from the
pelicans' far water and the near water's ducks. Each stump is a weathered trunk
rising 0.4-1.5 m out of the water with a flat or broken top, built like the snag
(`createSnag`), and each gives one perch point at its top.

- A point zone gives a bird a perch from `deps.perches`; the stumps fill
  `perches['stumps']` with a list, and the spawner hands each bird its own.
- A polygon zone, `cormorant-water`, on the open water near the stumps for the
  fisher.
- The stumps are on layer 0, so the water reflects them.

The plan places them against the terrain and the sightlines.

## The cast

```
{ "species": "doccor", "behavior": "perch", "zone": "stumps", "count": 3, "plumage": { "adult": 2, "juvenile": 1 } },
{ "species": "doccor", "behavior": "swim",  "zone": "cormorant-water", "count": 1, "plumage": "adult" }
```

The cormorant joins `SILENT` in `audio/calls.ts`: no grunts without take-off and
landing. A dive's entry plays the existing splash effect, quietly.

## Viewer

- The viewer loads authored species before it builds them.
- A `dry` slider, and `tailProp`.
- A perch: with `afloat` 0, a stump under the feet instead of the ground grid.

## Testing

### Already in place

The contract and per-species tests run for every detailed species. Where they
read the profile (the fold test, `crownNow`), an authored bird skips them, and
the test says so.

### The authored loader

- The glb's joints are exactly `BONE_NAMES` and its parents match `BONE_PARENT`.
- Each vertex's skin weights sum to 1, with at most four.
- The remapped skin moves each part with its own bone: posing `head` moves the
  bill's landmark; posing `wingFoldL` doesn't move the right wing.
- The `Built` has the same shape as a lofted one: the pose code runs on it
  unchanged.
- The texture sets exist for every version, at 1024 pixels.
- The budget: triangles and bytes, as above.

### Species: `cormorant.test.ts`

- `measure()` within the research's numbers, as `species.test.ts` holds other
  birds: length, culmen, bill depth, tarsus, wing chord, tail.
- Floating: the back 15-35 mm above the water, the crown 140-190 mm.
- Perched: at `afloat` 0 and `lean.x` -0.7, the feet on the perch's height and
  the crown 0.50-0.62 m above it with the neck erect; with `tailProp` 1 the
  tail's tip within 20 mm of the perch's height.
- Drying: at `dry` 1 the wrists above the shoulders and the wing tips below the
  wrists; the near wing 0.32-0.45 m from shoulder to tip.

### Behaviour

- The swim style, test first: dive and pause times within the research's ranges
  over a long run; hidden only while under; surfacing spots clear of other
  swimmers; swallows only after a catch, at about one surfacing in six.
- The perch style: the bird never leaves its perch; drying sessions start within
  the first 10 minutes and recur at the set interval; while spreading it faces
  into the wind within 20°.
- The ring budget with the cormorant.
- No bone turns more than 0.7 rad in a frame.

### Fingerprints

An authored bird's fingerprint hashes the glb's bytes and each texture set's,
in place of the geometry and atlas hashes, and the posed bones as for every
other bird.

### What tests cannot check

Whether the bird looks better than the lofted ones. The user's check in the
telescope and binoculars, beside the goose, is the acceptance, as the pilot's
comparison was.

## Performance

Four more birds and one model. The plan records the title card's count, the time
to Begin, the texture memory, and the frame rate through the telescope on the
stumps, against the build before this round.

## Known soft spots (expected)

- **Drying by schedule, not by wetness:** the stump birds haven't fished.
- **The drying pose by eye,** against photos, not measured.
- **Surface swimming speed is an estimate** (research section 12).
- **One size,** at the mean of the sexes.
- **Hand-weighted parts:** automatic weights inside each part may need touching
  up where the neck meets the body.
- **Body width an estimate** (0.12 m), from no top or rear view with a scale.

## Build order

1. Research: done (`docs/research/2026-10-04-double-crested-cormorant.md`).
   Pilot: done (`scripts/blender/doccor/`).
2. The `Built` seam: `bodyLength`, and the lofted birds unchanged (their
   fingerprints hold).
3. The authored loader, test first, on a small test glb made by the Blender
   driver; startup loading and the title card's count.
4. The Blender build: legs and feet, the flight wing, the rig and weights,
   landmarks, the revised feathers, both versions, the driver, the budget.
5. Perching and drying on the builder: `tailProp`, `dry`, proven in the viewer
   on the cormorant.
6. The stumps, their zone, and the cormorant's water.
7. The `swim` style, test first; then the `perch` style.
8. The cast, the main spec and README, performance, and the user's telescope
   check.

The work runs on one branch, `cormorants`, in a worktree. The plan decides who
does each task.

## Future rounds (not in this spec)

- **Round 2:** flight. 5.2 Hz continuous flapping at 14.5 m/s, low over the water
  (0.5-1.5 m), the neck straight with a slight bend at its base. The take-off: a
  1-2 s pattering run off the water, both feet striking together. Landing on the
  water with the tail as a brake; on a stump with a little hop. The fisher flies
  to the stumps after a bout and dries; a dry bird drops off to fish. Grunts at
  take-off and landing.
- Later: the head-shake after swallowing, and turning the head, with the other
  birds.
