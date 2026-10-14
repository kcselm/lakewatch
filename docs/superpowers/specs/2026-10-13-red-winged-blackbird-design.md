# Red-winged Blackbird: design spec

Date: 2026-10-13
Status: built (see "Performance" as built, "Changed during implementation" and "Known soft spots"); the
user's check through the binoculars and telescope to come
Builds on: `2026-09-30-kingfisher-design.md` (the perched posture, `headYaw`,
`tailSpread`, `legsUp`, asked-for calls, the style's settings table),
`2026-09-26-swimmers-design.md` (per-version cast counts), and
`2026-09-24-detailed-birds-design.md` (the detailed builder, painter, and viewer)
Amends: `2026-09-22-lakewatch-design.md` (the perch behavior and a new
`blackbird` behavior, the reed bed, the animation list, the call scheduler, the
cast, the bird models, the startup count)

## Purpose

The Red-winged Blackbird is still a block model: one black box of a male at a
point 1.9 m up in the reed bed, 9.4 m from the player. That puts it below the
blade tips, on nothing, with no red anywhere, and singing every 8-25 s. It is
the bird nearest the player, and a birder on a valley lake in late September
knows it at once: the "check" from the cattails, a black bird clinging to a
swaying stalk, and now and then the gurgling song with the shoulders flared red.

This round makes it a detailed bird, lofted and painted in code like the
kingfisher, and gives it a reed bed to live in:

- **The bird:** a stocky songbird with a spike of a bill. The male is glossy
  black, fresh from the moult with rusty and buff edges on his back and wing
  feathers. His red shoulder is mostly covered at rest, so only the buff bar
  below it shows. The first-year male is browner and scaly, with orange,
  black-spotted shoulders. The female is a sixth smaller, dark brown and
  heavily streaked, with a buff eyebrow.
- **The reed bed:** cattail flowering stalks with their brown spikes, tules on
  the water side, and narrower leaves. A stalk the bird holds sways on its own
  physics and dips under the bird's weight. The bird rides it.
- **Perching on stems:** both feet round one upright stalk, one above the
  other; on top of a cattail spike; or straddling two stems.
- **The song spread:** with the song, the male fluffs out, uncovers and raises
  his red epaulets, holds his wings out and down, fans his tail, and opens his
  bill. Most autumn songs are given with a small spread or none; now and then a
  full one.
- **A group of five:** two adult males, a first-year male, and two females,
  spread through the bed. One male sings in bouts; the others check, preen,
  feed at the cattail heads, look about, and move between stems.

Success looks like this. The player hears a "check" from the reeds on the left,
raises the binoculars, and finds a black bird on a cattail spike at about 9 m,
swaying a little with the stalk. A buff bar shows on his folded wing. A brown,
streaky bird a few metres off is preening, and lower down a scaly male with an
orange shoulder clings sideways to a stalk. The black bird leans forward,
puffs up, and sings, and his shoulders flare red as the trill comes. In the
telescope the female's eyebrow and streaks are sharp, and the male's back shows
its rusty edges. The stalks don't slide out from under the feet, and nothing
pops when the spread opens or closes.

## Scope

In scope:

- The Red-winged Blackbird (`rewbla`) gets a `detail` block: traced, measured,
  and painted, in three versions: `male`, `firstYearMale`, and `female`.
- **Per-version size:** a version may be a scaled bird with its own leg
  lengths. Every existing species builds as before.
- **Perching on stems** in the detailed builder: each foot holds its own stem,
  of any angle and radius, given by the pose. There are three grips: one
  upright stem, a cattail top, and two stems.
- **The display's pose values:** `epaulet`, `epauletRaise`, `fluff`,
  `wingHold`, and `gape`. Each defaults to a value that changes no existing
  pose.
- **The reed bed rebuilt:** narrower leaves; instanced cattail flowering stalks
  with spikes, and tules on the water side, every one of them moved by a
  per-stem sway the CPU computes and the bird can ride.
- **The `blackbird` behaviour:** perching on stems, moving between them, idles
  (looking about, preening, feeding at a cattail head, tail flicks, fluffing),
  song bouts with the spread, and check calls.
- **Songs tied to the spread:** song cues marked on the song clips, a clip
  played from a cue, and the spread timed to the sound.
- **Calls:** the blackbirds' check calls replace the timed song. The singer's
  songs are asked for by the behaviour.
- The guide's `marks` rewritten from the research, and the block colours
  brought in line.
- **The cast:** five birds in the `reeds` zone. The `reed-perch` point becomes
  the singer's post.
- Viewer controls for the new pose values and a stem prop; the study screen's
  stalk and its song-spread pose.

Out of scope:

- **A traced flight wing,** and flights into and out of the bed. The five birds
  stay for the visit. A bird crossing the bed flutters on the generic spread
  wing every detailed bird already has (see "Decisions").
- Passing flocks of blackbirds, Brewer's Blackbirds, and starlings, and a bird
  dropping in from one.
- A hawk overhead, the alarm whistle, and the group flushing.
- The female's song and her chit series. Bathing.
- A short or growing tail on a bird finishing its moult.
- A detailed Marsh Wren. It stays a block bird at `reed-perch-2`.
- Reed canarygrass on the bed's fringe.
- Birds and stems reflected in the water.

## Decisions made in brainstorming

| Decision | Choice |
|---|---|
| Pipeline | Lofted in code like the kingfisher, traced from a photo and painted in TypeScript. Blender, the cormorant's pipeline, was weighed for the closeness of the bird and set aside |
| Cast | A few birds, the mix from the research: five, two `male`, one `firstYearMale`, two `female` (research, section 3.4). One male at a point, as now, was rejected; so was a flock coming and going |
| Behaviour | Real stems that sway with the bird on them, and the song spread with its idles. Model-only, and stems with a traced flight wing, were rejected |
| Female size | **Proposed, from the research:** the male's trace scaled by 0.85, with her own tarsus and toe. A second trace was set aside: her shape matches his within 2% |
| Moving in the bed | **Proposed:** climbing along a stem, stepping to one in reach, and a flutter of 0.5-5 m on the generic spread wing. Flights out of the bed wait for a flight round |
| Red at rest | **Proposed:** mostly the buff bar. The old sources say the red is usually covered at rest; the autumn photos show red on about 60% of males, but photographers favour showy birds. Each bird draws its own: buff bar only 40%, a narrow red band 25%, the whole patch 30%, nothing 5% |
| Song and display | **Proposed:** one singer, in bouts. The spread's grade mix is 35/35/20/10% (none, low, mid, full) for play, against the research's realistic 60/30/8/2% |
| Song clip | **Proposed:** XC703912 only, played song by song from cues. XC469000 is chatter, not song, and is never played with a spread |

## Changes to the Lakewatch design spec

In the Behaviors table, a row is added:

```
| blackbird | Cling to a cattail or tule stem, riding it as it sways; look about, preen, feed at a cattail head, flick the tail; climb, step and flutter between stems; check now and then; a singing male sings in bouts with the song spread |
```

and the `perch` row's "Sit on a reed perch" keeps the Marsh Wren.

In Composition, the reed bed is cattail with a strip of tule on the water side:
narrow leaves, flowering stalks with brown spikes standing at about the leaves'
tips, and round tule culms with rusty heads. In Animation, `stems swaying with
the birds on them` and `the red-winged blackbird's song spread` are added. In
Audio, the blackbirds' songs are asked for by their behaviour and played from
cues, as the kingfisher's rattle is asked for.

The Bird models section notes that the blackbird is detailed, perched on stems,
in three versions, the female a scaled bird, and points here. The title card's
count takes its new total from the atlases this round adds.

## Research

Two documents, written first and committed with the plan:

- `docs/research/2026-10-13-red-winged-blackbird.md`: the race (*caurinus*),
  measurements by sex, late-September plumage and ages, the iNaturalist tally
  and the cast, field marks and what reads at each distance, structure, the
  perched posture, behaviour in the reeds in autumn, song in autumn, calls,
  flight, tolerance, tracing references, numbers, test thresholds, settings.
- `docs/research/2026-10-13-blackbird-display-and-reeds.md`: the epaulet (its
  feathers, size, colours, how it is covered, how much shows in autumn), the
  song spread (grades, kinematics, timing against the song), song and display
  in late September, the reed bed's plants and sizes, the stems' bending and
  sway, how blackbirds grip and straddle stems, numbers, thresholds, settings.

Measurements, plumage, the race, the reed plants, and the spread's description
are well sourced. The stems' stiffness is inferred (no cattail stalk has been
measured), their damping is borrowed from field crops, and the spread's
kinematics come from two videos and a few photos. Autumn song and call rates,
perch bouts, idles, and the grade mix are estimates, each marked. Neither
document could read Pyle, Birds of the World, Orians and Christman 1968, or
Beletsky 1996.

Every number the plan uses comes from these documents. Where a document marks
a number as an estimate, computed, or chosen by eye, the species file and the
style's settings table say so.

## The reed bed

The bed stays where it is, the polygon x −16..−3, z −2..−14 (3.6 m to about
21 m from the player). Its leaves are today's instanced, shader-swayed blades,
narrowed. Its stems are new.

### Leaves

- Blades 10-23 mm wide at the base, not 60, tapering, with a slight twist so
  they don't all face the same way.
- Their tips at about the flowering spikes' height (1.8-2.0 m), so a bird on a
  spike stands clear of them and a bird lower on a stalk is half hidden.
- Late-September colours, yellow-green to tan (`#9aad5b`-`#adae67`), with
  some still green (`#4a6c35`).
- They keep today's lean, flutter, and gust front.

### Stalks and tules

- **Cattail flowering stalks:** a stalk tapering from 16 mm at the base to
  5-7 mm under the spike; the spike 15 cm long (5-25) and 28 mm thick (24-36),
  dark brown (`#8b7a68`), its top at 1.85-2.0 m; a bare axis 5-15 cm × 2-3 mm
  above it. About one spike in seven bursting into cotton (`#d2bea5`).
- **Density:** 2-6 flowering stalks per m², a few hundred in the bed. The plan
  sets the count against the frame rate. Every stalk is holdable, so there is no
  second, unholdable kind that a held one could drift away from.
- **Tules** along the water side (z −11..−14): round grey-green culms,
  1.8-2.5 m, 15 mm at the base to 5 mm at the top, with a rusty spikelet
  cluster (4-6 cm) pushed aside by its bract. Denser than the cattails (40-80
  culms per m², the plan thinning it for the frame rate). A tule folds under a
  blackbird above about 0.6-1 m, so it is held only between 0.6 and 1.2 m.

### Stems that carry a bird

Each stalk and tule sways as a damped oscillator at its top. The shape of the
whole stem follows from the top's displacement as a cantilever's does. The CPU
steps every oscillator each frame and writes each stem's top displacement into
an instanced attribute, and the vertex shader bends the stem from it. A bird's
feet read the same function on the CPU, so a held stem and the feet on it
can't part.

- **Wind:** driven by the gust front the leaves and water share
  (`gustFront`), at its phase across the bed. In the scene's 2.8 m/s a stalk's
  top leans about 2 cm, and 5 cm in a strong gust. That is far less than the
  leaves move (0.16-0.32 m at their tips).
- **Sway:** a stalk alone sways at about 1.5 Hz. With a female on top it sways
  at 0.7 Hz, and with a male at 0.55 Hz. The damping ratio is 0.12.
- **A bird's weight:** a bird on a stem adds its mass at its height, and the
  stem bends down and away by its lean: 5 cm under a female and 9 cm under a
  male at a stalk's top, and 1-2 cm at 1.4 m.
- **Landing and leaving:** a landing gives the stem the bird's momentum. The
  top swings 5-11 cm in 0.15-0.3 s, settles into its dip, and is within 1 cm
  in 4-5 s. A take-off springs it back past upright.
- **A tule** carries a bird lower and moves 1-5 cm under it.

The stems' stiffness is the research's inference (EI ≈ 0.12 N m² under the
spike). The plan sets it in one place, so it can be tuned by eye.

## Perching on stems

### Per-version size

A version may carry a size: a scale on the whole traced bird (profile, eye,
wing, tail, perch, parts) and overrides for any measurements, applied before
the bird is built. The `female` is the male at 0.85, with her own tarsus
(26.9 mm) and middle toe (19.1 mm). Every number downstream (the anatomy, the
measures, the legs) is the built bird's, so tests and behaviours read her true
size. A species without sizes, which is every species today, builds exactly as
now.

### Grips

Today's percher stands on a branch across the bird, its toes curled round it
along z. The pose now says what each foot holds: a point, the stem's axis
there, and its radius, in the bird's frame. Without it the percher stands on
its branch as today.

- **One upright stem:** both feet clasp the stem, one 1-3 cm above the other.
  The body is 50-70° from level and the tail hangs beside the stem.
- **A cattail top:** the feet clasp the top of the spike or the bare axis above
  it. The body is 45-60° from level, and the bill drops to about 48° below level
  to peer or feed over the spike.
- **Two stems:** a foot on each, 40-110 mm apart. The legs splay mostly at the
  ankle, and a leg may stand out nearly level. The body rolls toward the lower
  foot.

Each foot's toes wrap its stem: the three front toes round one side, the hind
toe round the other, each keeping its length along the curve, round a stem of
any angle. The legs reach each foot by the two-bone reach the walking gait
already has. The plan decides the order in which they bend at the hip, the
knee, and the ankle so a straddle splays at the ankle.

### The stem moves the bird

The behaviour holds the bird's feet on its stems every frame. The body takes
up part of the stem's motion: it counter-rotates about the feet, so the head
moves no more than a third as far as the feet do, as a bird steadies its head
on a swaying perch.

## The song spread

Five pose values, each 0 by default, which changes nothing:

- **`epaulet`, 0 covered to 1 bared:** how far the covering feathers are drawn
  off the shoulder of the folded wing. The scapulars come back and up, and the
  breast-side feathers come down.
  - 0: neither the red nor the buff shows (under 0.3 cm² side-on).
  - 0.15: only the buff bar, a strip 4-9 mm deep along the folded wing's lower
    forward edge.
  - 0.35: a red band 6-10 mm deep above the buff.
  - 0.6: the whole patch, about 39 × 19 mm of red over a 10 mm buff band
    (4.5-7.5 cm² of red side-on).
  - 1: as 0.6, with the scapulars lifted clear.
  The red and buff are painted on the wing under the covering feathers, never
  over them. A bird keeps its resting value until it sings, moves, or lands.
- **`epauletRaise`, 0 flat to 1 erected:** the lesser coverts lift off the wing
  and fan forward and out over the shoulder. Side-on the red's area grows
  1.25-1.6 times, and from the front each side shows 3-5 cm² of red standing
  proud of the body's outline.
- **`fluff`, −0.3 sleeked to 0 to 1 full:** the contour feathers raised over
  the body, nape, and crown. The side-on area grows 5-18% at 0.45, and the
  width from the front grows 30-50% at 1 together with the wings and
  epaulets.
- **`wingHold`, 0 on the flanks to 1 held out:** the folded wing lifted from
  the body at the shoulder and its tip dropped, without opening the flight
  feathers. At 1 the wing stands out about 30° seen from the front, and its tip
  falls to the feet's level or below and within 20 mm of the tail's outer tips.
  `wingSpread` and `dry` can't make this pose: both open the flight wing.
- **`gape`, 0 closed to 1 open:** the lower mandible dropped 30° at 1. The bill
  becomes two mandibles. The plan decides whether that is a split of the
  lofted bill or two parts.

The spread also uses what is there: `tailSpread` (`detail.tail.fan` 110°),
`tailTilt` lowered, `lean` hunched forward, `neckExtend` and `headPitch` for the
head thrust and the bill-tilt.

How `epaulet` uncovers the red is the plan's to settle. A cover of back-coloured
feathers hung over the shoulder and drawn back, or the folded wing's shoulder
tucked under the body's skin and brought out, are both possible. The plan
proves its choice on the test bird. The tests measure what shows side-on by
casting rays at 1 mm spacing against the posed bird and reading the paint where
they land.

### Grades

| Value | Rest | 0 (song only) | 1 (low) | 2 (mid) | 3 (full) | Bill-tilt |
|---|---|---|---|---|---|---|
| `epaulet` | its own | as at rest | ≥ 0.6 | 1 | 1 | 0.6 |
| `epauletRaise` | 0 | 0.1 | 0.5 | 0.8 | 1 | 0 |
| `fluff` | 0 | 0.1 | 0.45 | 0.7 | 1 | −0.3 |
| `wingHold` | 0 | 0 | 0.1 | 0.5 | 1 | 0 |
| `tailSpread` | 0 | 0.05 | 0.2 | 0.5 | 0.95 | 0 |
| `tailTilt` (rad) | rest | rest | −0.1 | −0.2 | −0.3 | rest |
| `lean.x` (rad, + forward) | rest | rest | +0.1 | +0.15 | +0.2 | −0.1 |
| `neckExtend` | 0.5 | 0.6 | 0.7 | 0.75 | 0.8 | 1 |
| `headPitch` (rad) | 0 | 0 | −0.15 | −0.05 | +0.1 | +0.75 |
| `gape` in the trill | 0 | 1 | 1 | 1 | 1 | 0 |

(Research, display document section 8.2: estimates shaped to the descriptions,
tuned against the named photos.)

### The envelope against the song

The spread runs off the sound's own clock:

- **Build:** from 0.3 s before the first note (0-0.5) to the trill's start, the
  values ease in. Fluff and the epaulet come first, then the raise, the wings,
  and the tail. The head thrusts forward over the first 0.15 s, and the gape
  follows the notes.
- **Hold:** through the trill (0.55-0.8 s), at the grade's values.
- **Release:** from the trill's end, everything eases back over 0.45 s
  (0.2-0.9). The tail flicks up 20-25° for 0.2 s as it closes.
- **After-song hold:** at grade 2 or 3, one time in four, the raise, the wings,
  and the fluff stay at 70% for 1-3 s before the release.

At 60 fps the build takes at least 18 frames.

### Guards

- Each new value at 0 changes no vertex of any existing species, and every
  existing geometry and pose print is unchanged.
- No vertex of the wings, the cover, or the raised coverts goes inside the
  body at any grade.
- The spread's values change by no more per frame than the envelope allows. No
  pop at the build's start or the release's end.

## The `blackbird` behaviour

### Spec and context

`blackbird`, in `src/behavior/blackbird.ts`, with its settings in a table as
the other styles have them. The spawner hands each bird the bed's stems (their
positions, heights, kinds, and radii) and the shared stem simulation. The
context gains `onCall` (as the kingfisher's), the call it asks for, and word of
when its song began.

### States

- **perch:** on a stem, in one of the grips. The perch choice:
  - cattail top 50%;
  - cattail stalk at 1.2-1.6 m 25%;
  - tule at 0.6-1.2 m 15%;
  - straddling two tules 10%.
  The body stands at the grip's angle. A bout lasts 20-120 s, and in it the bird
  does one of:
  - **alert** (0.50): head turns of 30-90° over 0.2-0.5 s, every 2-6 s;
  - **preening** (0.25): bouts of 10-60 s, the bill to the breast, flank,
    back, and under the wing, within what the neck can reach without
    passing through the body;
  - **feeding** (0.20): on a cattail top, peering over the spike, the bill
    thrust in and gaped 2-6 times, 0.5-1 s each;
  - **stretching** (0.05): a wing and leg down, or both wings up.
  Through all of them it flicks its tail (15-30° up, 0.2-0.3 s) every 10-40 s,
  more often just after landing, and fluffs (0.2-0.4) in long bouts on a cool
  morning.
- **climb:** up or down the same stem 0.1-0.5 m, foot over foot.
- **step:** to a stem in reach (≤ 0.12 m), through a straddle.
- **flutter:** to a stem 0.5-5 m off, on the generic spread wing at the
  species' 10 Hz (capped at the frame rate ÷ 6), low over the leaves, legs
  tucked, 4-8 m/s. It lands with the stem's dip.
- **sing:** the singer's song state. See below.

After a bout, a bird climbs (0.40), steps or flutters within 2 m (0.35),
flutters 2-5 m (0.20), or stays (0.05). No bird holds a stem nearer the player
than 5 m for more than a few seconds. Neighbours are kept 1-6 m apart, and two
birds don't hold one stem.

### Song

- **The singer:** the first `male`, his post the stalk nearest the old
  `reed-perch` point (−8, −5), 9.4 m out. He sings in bouts of 4-10 songs, one
  every 8-20 s, with 3-8 min between bouts. He sings more in the first part of
  the visit. Between songs he stays on or near his post.
- **The other adult male:** one or two songs about once in 20-30 min.
- **The first-year male:** one song about once in 30-60 min, at grade 0 or 1.
- **The females:** no song, no spread.
- **Each song's grade** is drawn from 35/35/20/10% (grades 0-3). That is
  compressed for play from the research's late-September 60/30/8/2%, so a
  player watching a bout sees a full spread. Another male within 5 m raises the
  grade by one.
- **Bill-tilt:** a male within 2 m of another male points his bill up for
  2-10 s, without song, now and then.

A song is a request: the behaviour asks for its next song cue. The spread runs
only if the cue plays, timed to it, and a song the call cap drops is skipped
without a spread.

### Calls

Each bird checks every 10-40 s when settled. It checks every 1-5 s for 10-30 s
after a flutter or a landing, and around the singer's bouts. The checks are
asked for by the behaviour and played from single-check cues. The timed `rewbla`
schedule (`every: [8, 25]`, `prefer: 'song'`) goes.

### Behaviour tests

With a seeded random source, as for the other styles:

- State transitions, and each state's length within its settings. The perch
  choice and idle shares over long runs, within their settings.
- Feet on their stems: every foot within 10 mm of its stem's surface every
  frame, while the stems sway and dip.
- The head moves no more than a third as far as the feet on a swaying stem.
- No bird nearer than 5 m to the player for more than a few seconds. No two on
  one stem. A tule held only at 0.6-1.2 m.
- Flutters stay over the bed and clear of the terrain and water. They never
  turn faster than their setting.
- Song: the singer's bouts and intervals within their settings, the grade mix
  over a long run within 5 points of 35/35/20/10, no spread without a song, and
  none from a female.
- No snapping: at 60 fps every pose value changes by no more per frame than its
  state's easing allows.

## Audio: songs tied to the spread

- **Cues:** a song clip carries cues, each a song's first note, its trill's
  start, and its end, in seconds. A call clip carries single-check cues. Cues
  are marked by hand from the clip's spectrogram and kept in a file beside the
  catalog, not in the generated `birds.json`, so a catalog rebuild keeps them.
- **XC703912** (the song clip): songs at 2.80, 5.18 and 9.38 s, their trills at
  3.05, 5.28 and 9.65 s (research). The third runs past the clip's end and is
  left out unless the plan finds it whole.
- **XC469000** is chatter with several birds behind it, not song. It is not
  played as the singer's song, and never with a spread.
- **Check calls** come from single checks cut by cue. The plan looks for a
  clean September check clip with a usable licence. XC676902 (CC BY-NC-SA 4.0)
  is the candidate. It checks XC678807 (a Victoria male, 4 October, 8 songs in
  50 s) as a second song clip. XC159672 and XC159674 are CC BY-NC-ND and are
  not used.
- **Playing a cue:** the call player plays a clip from a cue's start to its
  end, and it starts the sound at a time it reports back. The behaviour runs
  the spread against that time, so the spread leads the first note by
  0.3 s within a frame.
- **The cap:** asked-for songs and checks go through the scheduler and its
  simultaneous-call cap as the kingfisher's rattle does. A check is short, so
  five checking birds hold a slot only briefly.

## The bird

### Red-winged Blackbird (`rewbla`)

The race is the Northwestern Red-wing, *A. p. caurinus*, resident in the
valley. Traced side-on from the alert male on a sloping stub
(`rewbla-137083235-234055602.jpeg`, Jeff Harding, CC BY-NC, 0.39 mm a pixel).
It is lowered to the resting posture against the male at rest on a pole
(`rewbla-249411357-445838645.jpg`). The head and bill come from the sharpest
side-on heads, and the widths from a front-on male (58-63 mm across the breast,
fluffed).

- **Male**, measured on Ridgway's *caurinus*:
  - exposed culmen 20 mm, bill depth 11, width 7.5 (an estimate), a straight
    cone;
  - tarsus 29.5, middle toe 21.8;
  - wing chord 123, tail 92 (rounded);
  - eye 4.5 mm across, dark, 12 mm behind the culmen's base;
  - bill tip to tail tip about 206 mm as traced.
- **Female:** the male at 0.85, with her own tarsus and toe. She is about 175
  mm long.
- **Posture:** at rest, the body 35-40° above level, the bill 15-20° below,
  the breast 30-40 mm ahead of the feet. Alert, the body 45-50° and the bill
  10-15° below. The grips set the body's angle on stems.

### Versions and paint

- **`male`:** glossy black with a faint blue-green sheen. The back, scapulars,
  greater coverts, and tertials are edged rusty and buff (1-3 mm), and the crown
  and nape carry a few brown tips. On the folded wing, under the covering
  feathers, the red lesser coverts (`#dc3a1c`, shaded `#a82a14`) sit over the
  deep buff to ochraceous median coverts (`#d4a064`, 8-11 mm). The two blend
  over 2-3 mm. The bill, legs, and feet are black.
- **`firstYearMale`:** the male's size. Blackish, "much veiled with buffy and
  ferruginous edgings" all over and palest below, with a brown crown and a
  faint buff eyebrow. The shoulder is orange (`#d8691c`) with black bars and
  spots, over buff mottled black.
- **`female`:** dark brown above with deep chestnut and buff edges. Below,
  buff streaked dark brown (2-3 mm streaks, 4-6 mm apart), darkest on the belly
  and flanks. A long buff eyebrow 2.5-4 mm deep, a dark eye-line and cheek, a
  pale moustache, and a peach-buff throat. Two pale wing-bars. A trace of
  rusty-brown on the shoulder. The lower mandible is pale horn at the base.

All three are painted for the telescope at 5-10 m, where a pixel is
0.16-0.32 mm. The plan computes the texel size and enlarges the atlas only if
the skin's texels show there. It records that through the binoculars at 9.4 m a
pixel is 1.15 mm: the male's buff bar is 3-4 px deep there, and his fresh
edges show as a browner back, not as scallops.

### Guide text and block colours

The `marks` come from the research (species document, section 4.5). The size
is "robin-sized and stocky, the female a sixth smaller". The bill is "a sharp,
slender cone". Of the shoulder they say "at rest his red shoulder is often
hidden, leaving only a buff bar", not "red-and-yellow", which is the eastern
bird's. They describe the young male, the streaked female, the stems, the
"check", and the "conk-la-ree". The block `plumage` and `variants` follow the
paint, with a `firstYearMale`, and the female darker than today's.

## The cast

```
{ "species": "rewbla", "behavior": "blackbird", "zone": "reeds", "count": 5,
  "plumage": { "male": 2, "firstYearMale": 1, "female": 2 } }
```

The singer's post is the stalk nearest `reed-perch`, which stays as a point
zone for that. Tests that use `rewbla` because it is a block bird (`prewarm`
and `prepaint` say so) move to another block species; those that use it only as
a name keep it.

## Viewer and study screen

- **Viewer:** sliders for `epaulet`, `epauletRaise`, `fluff`, `wingHold`,
  `gape`, and a grade selector that runs the spread against the song clip. The
  bird is shown on a stalk, a cattail top, or two tules, with the stem swaying.
  The views are side-on and front-on against the reference photos, and the
  field view at 9.4 m through the binoculars and the telescope.
- **Study screen:** the blackbird on a cattail stalk instead of a branch, and a
  "Song spread" pose beside "At rest" and "Alert", which plays a song with it.

## Testing

### Already in place

The geometry and pose fingerprints, the folded wing's clearance, the perched
builder's tests, the zone-terrain tests, the call scheduler's, and the
whole-cast tests. All keep passing, and every existing species' prints stay
unchanged.

### Builder

- A version's size: the female's lengths 0.80-0.88 of the male's, her tarsus
  0.87-0.95. A species without sizes is unchanged.
- Grips: on one upright stem, a cattail top, and two stems, each foot's toes
  round its stem within 5 mm. The straddle's feet are 40-110 mm apart. The body
  stands at the grip's angle (50-70°, 45-60°).
- The spread's values at 0 change nothing, and the guards above hold.
- What shows side-on at each `epaulet` value, by the ray cast: the areas in "The
  song spread". `epauletRaise` grows the red 1.25-1.6 times. `fluff` 1 widens
  the front-on silhouette 1.3-1.5 times. `wingHold` 1 puts the wingtip at or
  below the feet. `tailSpread` 1 fans 100-120°.

### Species: `blackbird.test.ts`

- Measurements against the research, each version:
  - male / female: exposed culmen 18-22.5 / 15-19 mm; bill depth 9.5-12.5 /
    8-11; tarsus 27-31.5 / 25-28.5; wing chord 116-130 / 97-108;
  - length at rest 195-220 / 165-188;
  - culmen / wing 0.14-0.19 and tail / wing 0.70-0.82 for both;
  - eye 9-15 / 7.5-12.5 mm behind the culmen's base;
  - the bill 5-25° below level and the body 30-50° above at rest.
- Paint on the right versions:
  - male: black everywhere but the shoulder, the red's hue 4-14°, a buff (not
    yellow, not black) bar, rusty edges on the back;
  - first-year male: an orange shoulder (hue 18-30°) with black marks, a brown
    crown;
  - female: brown and streaked below, a pale eyebrow, a peach-buff throat, no
    black body.
- At rest, with the bird's own `epaulet` 0.15, no red shows side-on.
- Never folds its skin.

### Scene

- Every stalk stands in the bed, its spike at 1.85-2.0 m. Leaves are 10-23 mm
  wide.
- A stalk alone sways at 1.0-2.0 Hz, and with a male on top at 0.4-0.8 Hz.
  After 3 cycles a swing has fallen to 0.05-0.2 of the first. A male's landing
  swings the top 3-15 cm. In the scene's wind a stalk's top leans ≤ 6 cm, and
  less than half the leaves' lean at the same height.
- The shader's bent stem and the CPU's agree to within 1 mm at every height.
- Cues: a cue played starts within one frame of the time reported, and the
  spread's onset is 0-0.5 s before the first note. Full spread comes within
  ±0.15 s of the trill's start, and the release 0.2-0.9 s after its end.
- The startup count gains the new atlases. The whole cast still builds within
  the cast tests' timeout.

### What tests cannot check

These are checked by eye, in the viewer for every task and in the game at the
end:

- whether the bird reads as a red-wing at 9 m through the binoculars;
- whether the buff bar and the red read as they should;
- whether the spread looks like a song spread, and is in time with the song;
- whether the stems' sway and the landing dip look right;
- whether a straddle looks natural;
- whether the leaves read as cattail;
- whether anything pops;
- the frame rate on the user's integrated GPU.

The user's check through the binoculars and telescope is the acceptance.

## Performance

This round adds five detailed birds where there was one block bird, three
atlases, a few hundred instanced stalks and tules with an attribute rewritten
every frame, and narrower leaves. The plan records, as the earlier rounds did
(headless Chromium on this machine, two loads each, noted as saying little about
a real GPU):

- the atlases' count and memory;
- the time to Begin;
- the frame rate with the binoculars on the bed and the telescope on the
  singer.

It compares them against the build before this round, and thins the stems if
the frame rate falls.

As built, against the build before this round (`da452c5`), both production builds served side by side with the dev
hook switched on to aim the view (`lookAt`), two loads each, headless Chromium on this machine:

| | Before this round (da452c5) | This round |
|---|---|---|
| Title card's count | 49 | 54 (the three versions' atlases, and the folded wing placed for each of the two sizes) |
| Atlases | 28, 28 MiB (512² RGBA) | 31, 31 MiB |
| Begin enabled | 10.7, 10.8 s | 12.3, 11.9 s |
| By eye, the default view | 29.1, 31.7 fps | 28.7, 30.1 fps |
| Binoculars on the bed | 37.1, 35.9 fps | 35.0, 32.7 fps |
| Telescope on the singer (before: the block male at `reed-perch`) | 36.8, 36.6 fps | 35.9, 34.8 fps |

Begin comes about 1.3 s later and the bed in the binoculars costs 2-3 fps here, about 7%. The stems are not thinned:
headless rates say little about a real GPU, and the user's check on their own is what decides it.

## Changed during implementation

- **The cast entry names its post** (`"post": "reed-perch"`, a new optional field, validated as a point zone), rather
  than the spawner knowing `reed-perch` by name. The spawner hands each blackbird the reed bed's stems, its entry's
  group, its version and size, the post and the player's place, and refuses a blackbird without stems.
- **The shoulders' front-on width** under the full spread is tested at 1.3-2.1 times, not 1.3-1.5: the spec's figure
  came from one video's frames, while the full spread the research names for front-on (its wings out 30°) is about
  twice as wide at the shoulders. The model sits between them.
- **Riding the stem is measured from where the stem would settle.** The stem field gains `restAt`: the stem's axis
  bent by the wind's steady drag and the birds' weight, without its turbulence or swing. The body counter-rotates
  about the feet by 0.9 of the swing from that point (lean and roll, the head's lever the model's own 0.105 m a
  radian), so the head moves a third as far as the feet or less. Measured from where the feet sat a few seconds
  before, the bird's own weight settling the stem in the first seconds read as sway, and the head drifted with it.
  The straddle's roll toward the lower foot is taken from the settled stems too.
- **Feeding keeps the body at the top's angle**: it leans over the spike 0.08 rad (from 50° to 45°) and the bill
  drops to 48° below level; the first build tipped the whole body forward 0.6 rad, nearly level.
- **The tules stand on the bed's water side** (z about -7 to -10), not at z -11 to -14, where the ground is
  0.7-1.5 m under the water, below the reeds' band.
- **XC678807** is filed on xeno-canto as a female; its songs are a male's konk-la-ree, so it is used as his.
  XC469000, a run of chack notes, is retyped a call.
- **The study screen** shows no "Alert" pose for the blackbird (its neck isn't a chain that stretches): its poses are
  "At rest" and "Song spread". At rest it holds its shoulder at 0.15, the buff bar showing.
- **The dev hook** gains `inspect(id)`: a bird's behaviour and pose, to read what a bird is doing in the game.

## Known soft spots

- **The stalks are a little stiff**: alone they sway at 1.5-1.9 Hz, inside the 1.0-2.0 Hz asked but toward its top;
  the stiffness (0.12 N m²) is the research's estimate, inferred and not measured.
- **The singer's stalk top stands at about 2.7 m in the world** (its spike 1.85-2.0 m above ground that is itself
  about 0.8 m up), not at the old point's 1.9 m.
- **Feeding pitches the head 0.65 rad down** on a cattail top, past the viewer's slider (0.5); no fold showed in the
  game at the telescope's range, but it is the hardest the head turns.
- **The buff bar under a fully drawn red** shows as separate buff feather tips between the coverts, not one smooth
  band.
- **The bed costs 2-3 fps headless** with the binoculars on it (see "Performance"); not measured on a real GPU.
- **The grades' mix, the bouts and the idles' shares are estimates**, as the research marks them.

## Build order

1. Research: the two documents (done).
2. Per-version size and the grips: each foot on its own stem of any angle, the
   toes round it, the legs splayed. Proven on the test bird, with the builder
   tests.
3. The spread's values: `epaulet`, `epauletRaise`, `fluff`, `wingHold`, `gape`.
   Proven on the test bird, with the guards and the ray-cast measure.
4. The reed bed: the narrower leaves, the stalks and tules, and the stem
   simulation shared by the shader and the CPU. With the scene tests.
5. Audio: cues, playing from a cue at a reported time, the check cues, and the
   `rewbla` schedule replaced. With the licence checks on new clips.
6. The `blackbird` behaviour, test first.
7. The Red-winged Blackbird, detailed, in three versions, with its tests: the
   worked example.
8. The cast, the viewer and the study screen, the main spec and README,
   performance, and the user's check.

The work runs on this branch in this worktree. The plan decides who does each
task.

## Future rounds (not in this spec)

- A traced flight wing for the blackbird; birds leaving and joining the bed,
  and passing flocks with Brewer's Blackbirds and starlings dropping in.
- A hawk over the bed: the alarm whistle, the red covered, the group flushing.
- The female's chit series; bathing.
- A detailed Marsh Wren on the same stems.
- Reed canarygrass on the bed's fringe.
- Birds and stems reflected in the water.
