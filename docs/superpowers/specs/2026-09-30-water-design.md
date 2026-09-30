# Water: design spec

Date: 2026-09-30
Status: approved, 2026-09-30
Builds on: `2026-09-27-herons-design.md` (the wading shelf, the ring budget),
`2026-09-26-swimmers-design.md` (floating birds on a traced waterline, wakes as
rings), and `2026-09-25-dowitcher-pectoral-design.md` (sized rings, the bench)
Amends: `2026-09-22-lakewatch-design.md` (Components: Water, Terrain; the "no
reflection render pass" line; Performance)

## Purpose

Five rounds have made the birds field-guide accurate, but the water they stand
and float on is still the milestone-1 shader. Through the binoculars and the
telescope it is now the weakest thing in the frame. Baseline captures are in
`docs/research/water-baseline/`:

- `01-eye-heading.png`, `04-eye-near-shore.png`: an opaque blue sheet with a
  hard edge against the mud. Nothing on the far bank reflects, not the tree
  line, not the snag.
- `03-telescope-far-shallows.png`: a Great Blue Heron at 62 m standing in 10 cm
  of water that looks like painted glass. Its legs end at the surface, with no
  reflection and no sign of the shelf under it.
- `05-binoculars-ring.png`: at 8x, the ripples are soft blobs stretched sideways,
  and a ring is a white line painted on top rather than a wave in the water.
- `06-swimmers-and-far-waterline.png`: ducks and coots sit on the water with no
  reflection or contact line, as if pasted on. The four herons stand along a
  ruler-straight waterline.

Success looks like this. On an early-autumn morning with a light breeze, the far
tree line and the snag reflect as long, broken columns that sharpen in the calm
patches and smear where a gust runs across the water. The shallows are lighter
and browner than the open water, and through the telescope you can see a heron's
legs go down into the water toward the shelf. Each duck sits on its own dark
reflection with a thin bright line where it meets the water, and a moving duck
trails a V. A ring from a strike or a dive bends the reflections as it spreads
rather than drawing a white circle. None of it shimmers or crawls at any zoom,
and the frame rate holds.

## Scope

In scope:

- **Depth from the terrain.** A water-depth texture baked from the heightfield
  at startup replaces the hard-coded ellipse. It drives the colour, how clear the
  water is, and the shoreline.
- **See-through shallows.** The water blends over the bed where it is shallow
  (the bench, the shelf, the lake's rim) and goes opaque with depth.
- **The shoreline.** A soft edge where the water thins out, a faint bright line
  at the edge, and a band of wet, darker ground just above the waterline.
- **Reflections.** A planar reflection pass (a second, mirrored render) of the
  sky, the far bank, the trees and snag, the reeds, and every bird, flyovers
  included. The ripples distort it and the Fresnel term fades it. A setting turns
  it off.
- **Birds meeting the water.** A contact line and a slight darkening around every
  floating or wading bird, and a V-shaped wake behind a swimmer that is moving.
- **Rings as waves.** Ripple rings tilt the surface normal instead of adding
  brightness, so they show up as bends in the reflections and in the sun's
  glitter.
- **Ripples that hold up at a distance.** The ripple detail fades out by how much
  water each pixel covers, so the far water and the telescope view stop
  shimmering. The noise octaves and their scales are retuned from the research.
- **Calm patches and cat's paws.** A slow field of calm, glassy water and
  roughened patches drifting downwind, tied to the gust front the reeds already
  use.
- A research document on the water, written first.

Out of scope:

- Refraction (the bed bending under the surface) and caustics.
- Real wave geometry: the water stays a flat plane with shaded normals.
- Splashes, spray, and droplets.
- Water that changes with the time of day or the weather. The scene is always one
  morning.
- Underwater views.
- Shadows cast onto the water. Birds already get their darkening from contact
  and their reflections.

## Decisions made in review

| Decision | Choice |
|---|---|
| Reflections | A planar reflection pass at half resolution. The camera sits 1.6 m above a single flat water plane, which is exactly the case a mirrored camera renders correctly. It covers the birds, snag, trees, reeds, the far terrain, and the sky dome; the near grass is left out. A setting (Water reflections: on / off) falls back to today's sky-only shading. Screen-space reflections were rejected: blank at the bottom of the screen, where the telescope looks straight at the water and most of what should reflect is off-screen. Fake reflections of the tree line alone were rejected: no bird reflections, and those are what make a floating bird sit on the water |
| Morning mist | Left out of this round and listed under future rounds. The scene is at 24° sun elevation, which may be past the hour for steam fog; the research records what it finds |

Also decided:

| Decision | Choice |
|---|---|
| Depth source | A texture baked once from `lakeHeightfield` over the water's extent (about 10 cm per texel), not a depth pre-pass. The terrain never changes, so the bake is free after startup and the shader needs no extra render |
| Transparency | The water turns into a transparent material drawn after the terrain, and its alpha comes from depth. No refraction texture: the bed is already on screen behind the water |
| Wet ground | Drawn on the terrain by each fragment's height (a darker band above the water), from a pure `wetDarkening` with a GLSL twin, so its tests run in node. No decal or extra pass. (Planning moved this out of `terrainColor`: a 10 cm band on the mesh's 2 m grid would smear as a vertex colour) |
| Contact and wakes | One uniform array of the birds in the water (position, heading, speed, size), filled each frame from the registry, alongside the ripple array. Birds on land are left out. A cap, like the ring budget, with its own test |
| Round structure | Research first; depth and shoreline (the cheapest and most visible); reflections behind their setting; birds meeting the water; rings and distance; calm patches; the finish and the user's telescope check |

## Changes to the Lakewatch design spec

The Components entry for Water becomes:

```
- **Water**: custom shader over a water-depth texture baked from the heightfield.
  Colour and clarity by depth, so the bench, the shelf, and the rim read as
  shallows and the bed shows through them; a soft shoreline. A half-resolution
  planar reflection of the sky, far bank, trees, snag, reeds, and birds,
  distorted by the ripples and faded by Fresnel (off in settings falls back to a
  sky gradient). Ripple normals whose direction and amplitude follow the wind,
  fading by pixel footprint; calm patches and cat's paws drifting downwind with
  the gust front. Ripple rings and wakes bend the surface rather than brighten
  it, and every bird in the water has a contact line. See
  `2026-09-30-water-design.md`.
```

Terrain gains the wet band above the waterline. The Settings section gains
Water reflections. Performance gains the reflection pass (below).

## Research

One document, `docs/research/2026-09-30-lake-water.md`, in the form of the
earlier ones, answering:

- **Colour and clarity** of Willamette Valley lakes and ponds in late September:
  the typical Secchi depth (how deep you can see), tint (green-brown from algae
  and silt, or blue-grey), and how that sets the depth at which the bed stops
  showing.
- **What a morning lake looks like** at a 0.35 breeze: how often calm patches
  occur, their size and drift speed, and cat's-paw sizes, from photos and wind
  and wave references.
- **Ripple rings:** how fast a ring spreads from a duck dipping, a grebe diving,
  or a heron striking (capillary-gravity waves: the minimum phase speed is about
  0.23 m/s), how many crests follow, and how long they last. Today's rings spread
  at 1.1 m/s, which is probably too fast.
- **Wakes:** the Kelvin wedge (a half-angle of about 19.5°), how long a duck's V
  stays visible, and how its size depends on speed.
- **Reflections:** how far a reflection is stretched and broken up for a given
  ripple, and how Fresnel reflectance changes with viewing angle for the angles
  the player sees (1.6 m eye height, 10–65 m distance, so 1.4–9°).
- **Shorelines:** how wide and how dark the wet band is on mud and on gravel.
- **Steam fog:** whether it is common on valley lakes at that date and hour, to
  inform a future mist round.
- **Photo references** of a Pacific Northwest lake on an autumn morning, kept in
  the scratchpad and never committed.

Every number the plan uses comes from this document, marked where it is set by
eye.

## Depth, clarity, and the shoreline

`bakeWaterDepth(heightfield, bounds, texelSize)` returns a single-channel float
texture of `max(0, -surface(x, z))`, sampled from `terrainSurface` so it
matches the rendered mesh rather than the smooth field. Its bounds cover the
basin plus a margin: x from −44 to 48 and z from −70 to −2 at 10 cm is 920 × 680,
about 2.5 MB as a half-float. The research may allow a coarser grid.

In the shader:

- **Colour** mixes a shallow tint toward a deep tint over the depth the research
  gives, replacing the ellipse.
- **Alpha** rises from 0 at the waterline to opaque over the visibility depth, so
  the bench (4.5 cm) and the shelf (5–22 cm) show their bed and the middle of the
  lake doesn't. The bed seen through the water is tinted by the water's colour.
- **The edge:** over the last centimetre or so of depth, a faint bright line
  (the meniscus catching the sky) that breaks up with the ripple noise, so the
  waterline isn't ruler-straight.

The terrain gains a wet band, drawn by each fragment's height: mud darkens to
0.55 of dry at the water and dries over 10 cm, gravel darkens to 0.70 and dries
within 3 cm (research section 6). The band is already below the grass tint.

## Reflections

A `THREE.Camera` mirrored in the water plane (y = 0) renders into a half-size
render target each frame, clipped at the plane so nothing below the water
reflects. It draws only objects on a `reflect` layer: the sky dome, the terrain
beyond the water, the tree line, trees, snag, reeds, and every bird model. Grass
and the zone outlines stay off it. The water shader samples the target at its
screen position, offset by the ripple normal's xz times a strength the research
sets, and mixes it in by the existing Fresnel term. Where the offset reaches off
the target, it falls back to the sky gradient.

The target follows the optics: its field of view is the camera's, so the
telescope's reflections are as sharp as its view. It resizes with the window.
With the setting off, the pass is skipped and the shader uses today's sky
gradient; a uniform switches between the two, so there's no shader rebuild.

Birds reflect as they are, poses and all. A diving grebe underwater doesn't
reflect, because the clip plane removes it.

## Birds meeting the water

The registry gives, each frame, the birds whose feet or float are in the water:
swimmers, waders on the shelf, the shallows and the bench, and the dowitchers.
For each, x, z, heading, speed, and a size taken from its species' length. They
pack into `uFloaters[MAX_FLOATERS]` as the ripples do. The cast has 37 such
birds, so `MAX_FLOATERS` is 48, and a test holds the whole cast under it.

- **Contact:** a thin bright line and a slightly darker ring just outside it,
  scaled by size. For a wader, it's a small ring around each leg: two points a
  leg-spacing apart, from its species.
- **Wake:** for a swimmer moving faster than a threshold, a Kelvin wedge behind
  it at the half-angle the research gives. It bends the normal (not the colour)
  and fades with distance behind the bird and as the bird slows. It replaces the
  wake rings the swimmers made every 1.5 s: with the research's ring lifetimes,
  those would have overflowed the ring budget (see Rings as waves).

## Rings as waves

A ring becomes a short train of crests: a height profile across the ring's
radius whose derivative tilts the normal outward and inward. It no longer adds
white. The spreading speed (0.18–0.40 m/s), crest count, and life (2 + 4·size
s) come from the research. `RippleBuffer`'s API and every behaviour's `onRipple`
stay as they are. At those lifetimes, the whole cast peaked at 68–73 rings alive
at once with the swimmers still ringing their wakes, and at 46–48 without. So the
wake rings go (the V replaces them) and the cap rises from 32 to 64.

## Ripples at a distance

The surface noise gains a third, finer octave, and each octave fades out by the
pixel's footprint (from `fwidth` of the world position), so an octave smaller
than a pixel contributes nothing instead of aliasing. The sine hash becomes an
integer-style hash that holds up at large coordinates. Octave scales and
directions come from the research: the finer octaves spread more across the wind
than along it. The baseline's sideways-stretched blobs come from the low octave
alone dominating at grazing angles.

## Calm patches and cat's paws

A low-frequency noise field, drifting downwind at a speed tied to the wind's
strength, scales the ripple amplitude between near-glassy (reflections nearly
sharp) and rough. During a gust, the gust front the reeds already use
(`vegetation.ts`: `sin(along * 0.35 - uTime * 2.2)`) is shared through the wind
uniforms, so the patch of roughened water runs across the lake as the reeds
bend, not out of step with them. Today's wind streaks are folded into this field.

## Testing

Pure logic, test first, as before:

- `bakeWaterDepth`: zero on land, depth on the bench and shelf matching `BENCH`
  and `SHELF`, the deepest point near the basin's centre, and agreement with
  `terrainSurface` at sampled points.
- The wet band: darker just above the waterline, unchanged above the band and
  below the water.
- The floaters: which birds are in the water, packing and the cap, and the whole
  cast held under `MAX_FLOATERS` across seeds 42, 7, and 11.
- The wake: the wedge's half-angle and fade as pure functions mirrored from the
  shader, as `ripples.ts` is.
- The reflection setting: saved and loaded with the other settings, and applied.
- The ring budget at the new lifetimes and cap.

The shader itself is checked by eye, in the baseline's five framings and at the
same camera angles, with before-and-after pairs saved next to the baseline.

## Performance

The reflection pass is the cost: a second render of most of the scene at a
quarter of the pixels. The plan records, as the earlier rounds did (headless
Chromium, two loads each, noted as saying little about a real GPU): the frame
rate with the eye, with the binoculars, and with the telescope on the far
shallows, with reflections on and off, and the time to Begin with the bake
included. The user checks the frame rate on their integrated GPU. If the
reflection pass costs more than it should there, the fallbacks in order are: a
quarter-size target, leaving the reeds out, and reflections off by default.

## Known risks

- **Reflections of detailed birds cost a second skinned draw each.** With about
  70 birds, that doubles the birds' vertex work.
- **Transparent water changes the draw order.** Birds standing in the water must
  still draw correctly behind it. The legs under the surface should be tinted,
  not hidden or drawn on top.
- **The clip plane and the near plane:** the optics raise the near plane to 1 m.
  The mirrored camera must do the same, or reflections flicker at 65 m as the
  folded wings once did.
- **`fwidth` on some integrated GPUs** is coarse (2 × 2 pixel quads), which may
  leave a faint grid in the far water.

## Build order

1. Research: the water document.
2. Depth: the bake, colour, alpha, the shoreline edge, and the wet band, with
   their tests. Before-and-after captures.
3. Reflections: the mirrored camera, the layer, the render target, the setting,
   and performance recorded on and off.
4. Birds meeting the water: floaters, contact, and wakes.
5. Rings as waves, and ripples at a distance.
6. Calm patches and cat's paws, and the shared gust front.
7. The finish: the main spec and README, performance, the before-and-after set,
   and the user's telescope check.

The work runs on one branch, `water`, in a worktree. The plan decides who does
each task.

## Future rounds (not in this spec)

- Morning mist over the water.
- Refraction and caustics in the shallows.
- Splashes for a grebe's dive, a coot's jump-dive, and a heron's strike.
- Water that changes with the time of day, the season, and the weather.
