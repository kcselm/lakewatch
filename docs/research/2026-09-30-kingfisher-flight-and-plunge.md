# Belted Kingfisher: the spread wing, flapping and hovering, take-off and landing, the plunge, spray, and emergence

Date: 2026-09-30
Purpose: source data for the spread wing, the strokes, and the `kingfisher` behaviour's flight, plunge, and spray in `docs/superpowers/specs/2026-09-30-kingfisher-design.md`. The bird is a Belted Kingfisher (`belkin1`) on Willow Lake, a Willamette Valley pond, on a late-September morning. Its perches stand 25-55 m from the vantage. The snag's perch point is 4.25 m above the water (`src/world/trees.ts`). Hovers are seen through the telescope (2° field, about 1.9 mm per pixel at 60 m on a 1080-pixel-tall view), the near perch through the binoculars (7.5°, about 3.7 mm per pixel at 30 m). The wind is about 2.8 m/s (`docs/research/2026-09-30-lake-water.md`, section 3.1).

The companion document `docs/research/2026-09-30-belted-kingfisher.md` owns the measurements, plumage versions, field marks, perched posture, and the behaviour's rates. This one owns how the bird flies and how it meets the water. Where the two overlap (wing chord, mass, hover height), the numbers here are only what the flight model needs, and the species document's values win if they differ.

How to read the citations: `[Key, p. N]` points to the References section. For the bioRxiv preprint of Katzir et al., `l. N` is the preprint's printed line number. "Snippet" means I saw the claim only in a search excerpt or a secondary summary and could not read the source; treat it as unverified. "Computed" means my arithmetic on cited data or standard physics (g = 9.81 m/s², ρ_air = 1.225 kg/m³, ρ_water = 998 kg/m³). "Estimate" means no source gives the number and I chose it, with the basis stated. "By eye" means read from a reference photo in section 9, named. **Cross-species** marks every number taken from a species other than the Belted Kingfisher.

---

## 1. Summary

- **Span about 0.53 m** for the valley's western birds (*caurina*): Audubon's eastern male spanned 20 in (508 mm) [Audubon 1831, p. 398], and western wings are about 4% longer [Ridgway 1914, pp. 409, 420] (Computed). **Wing area about 0.044 m² for both wings** (Computed from the trace, section 2.3), against Poole's 376 cm² for two eastern males of 155 g [Poole 1938, p. 516]. **Aspect ratio about 5.9, wing loading about 31 N/m²** (Computed).
- **The planform** (traced top-down, section 2.3): the arm wing is a broad, nearly parallel strip, chord about **0.43 of the half-span** (about 104 mm). The chord holds to mid-span and then narrows to a rounded-pointed tip formed by the 8th and 9th primaries [Ridgway 1914, p. 408]. **The wrist sits at about 0.37 of the half-span** (Computed from the hand's length). In the game's units the half-span is **1.47 × wingChord** and the root chord **0.60 × wingChord**. Today's generic planform uses 1.78 and 0.42 (`src/birds/detail/wing.ts`), too long and too narrow for this bird.
- **Colour:** upperwing blue-grey coverts with slate-black flight feathers. **The white patch** is the white-spotted basal half of the primaries [Ridgway 1914, p. 415]. On the spread wing it shows from about 0.64 to 0.88 of the half-span (by eye). Underwing coverts and axillars white, **rufous in the female** [Ridgway 1914, pp. 415-416]. Every flight feather and the tail are barred black and white below.
- **Flapping:** predicted cruising wingbeat **about 7 Hz** (Computed, Pennycuick's formulas: 6.8 and 7.2 Hz). The rhythm is uneven. "Five or six rapid strokes followed by a long glide on half-closed wings" [Bent 1940, p. 122]. Grinnell & Storer give "three quick beats followed by two executed in a more leisurely manner" for the western bird [Bent 1940, p. 130]. Flight is usually low; wingtips are "sometimes wetted" [Carey 1909, in Bent 1940, p. 122].
- **Hovering:** the only measured hover kinematics are for the Pied Kingfisher (**cross-species**). Its wingbeat runs **5.4-9.5 Hz, falling as the wind rises**, with an amplitude up to about 120-134° that does not change with wind. The eye moves only **4.3 ± 2.7 mm** while the wingtip sweeps 173 mm. The bird faces the wind, and its body tilts toward horizontal as the wind rises [Katzir et al. 2018, l. 192-211]. For a Belted Kingfisher in the scene's 2.8 m/s: **about 8.5 Hz, amplitude 120°, body 50-60° above horizontal, bill 60-90° down, tail fanned 90-120°** (Estimate and by eye). Hovers last "a few seconds" [Audubon 1831, p. 395; Bent 1940, p. 120] at "30 or 40 feet" (9-12 m) when scanning [Bent 1940, p. 120].
- **Frames per beat at 60 fps:** flapping at 7 Hz gets **8.6 frames**; hovering at 8.5 Hz gets **7.1 frames** (Computed). Both read as a beat, not flicker. Keep the hovering frequency at or under 10 Hz, which still gives 6 frames.
- **The plunge:** from a perch "obliquely" [Bent 1940, p. 120], or "like a falling stone in a nearly perpendicular line" [Carey 1909, in Bent 1940, p. 122]. From a hover "a straight or spiral dive directly downward" [Bent 1940, p. 120]. No measured entry speed exists for any kingfisher. Free fall from the snag's 4.25 m gives 9.1 m/s and from a 9 m hover 13.3 m/s (Computed). **Adopt 5-8 m/s from a perch and 7-10 m/s from a hover** (Estimate: the bird brakes and steers with half-open wings until just before entry). Most fish are caught **under 60 cm** down [Davis 1982b, via Birds of the World, Snippet]. Under water **0.5-1.5 s**, "sometimes for several seconds" [Bent 1940, p. 120].
- **The spray:** valley photos of a Belted Kingfisher leaving the water (Beaverton, OR) show a sheet **0.35-0.45 m high and 0.4-0.9 m wide**, with droplets flung to about **0.75 m** (by eye, section 6.3). Ballistic droplets 1-3 mm across thrown at 3-4 m/s reach 0.3-0.7 m and fall back in **0.5-0.8 s** (Computed with drag). The cavity behind a body this size seals at about **0.12 s** [Glasheen & McMahon 1996, abstract] (Computed).
- **Rings:** the plunge is a **size-0.9** ring in `ripples.ts`. Its leading crest runs at 0.36 m/s for 5.6 s, reaching 2.0 m. **Taking off from the water is size 0.6-0.7** (Estimate, section 6.5).

---

## 2. The spread wing

### 2.1 What the sources say

- **Wing shape and formula.** For the genus (Ridgway's *Streptoceryle*, now *Megaceryle*): "Wing moderate or rather long, pointed, the longest primaries exceeding distal secondaries by at least half the length of exposed culmen; eighth and ninth primaries longest, the tenth (outermost) shorter than seventh, sometimes equal to sixth" [Ridgway 1914, p. 408]. So there are **ten primaries**, and the tip is made by p8 and p9. Audubon's "third primary longest" [Audubon 1831, p. 397] counts from the outside: the same feather as p8.
- **The western race has longer, broader wings.** Grinnell named *caurina* as "size throughout greater, especially measurements of flight-feathers". "The secondary wing quills are proportionally longer in the northwestern birds ... the wing of *caurina* is broader." The gap from the longest secondary to the wingtip "averages only 27.3 mm., while in the eastern birds it averages 33.7 mm. ... The ratio to total wing length in the two cases is 17 and 22 per cent." [Grinnell 1910, in Bent 1940, p. 129]. The Willamette Valley lies in *caurina*'s range ("Western North America, east to and including Rocky Mountains") [Ridgway 1914, p. 420].
- **Wing chord.** Western males 159-169 mm (mean 163.1, n = 18), females 159-169.5 mm (165.5, n = 15). Eastern males 145-161 (156.3), females 150-165 (158.6) [Ridgway 1914, pp. 415-416, 420]. AVONET's six skins (Central America, presumably eastern wintering birds): wing 158.8 mm, **Kipp's distance 53.2 mm**, first secondary 105 mm, **hand-wing index 33.6**, mass 148 g [Tobias et al. 2022]. AVONET's Kipp's distance runs to the *first* secondary and Grinnell's gap to the *longest*, so the two do not conflict.
- **Span.** "Length 12¾ inches, extent of wings 20" for an eastern adult male [Audubon 1831, p. 398]. Sharker et al. list a mass of 0.14-0.17 kg and a length of 28-35 cm, from a field guide [Sharker et al. 2019, Table 1, p. 3].
- **Wing area.** "Eastern Belted Kingfisher, *Megaceryle a. alcyon*, male (av. 2): 155 g, 376 sq. cm, 2.45 sq. cm per gram" [Poole 1938, p. 516]. This is "the area of both wings, fully outstretched ... closely traced ... and ... measured accurately with a polar planimeter", without the body [p. 511].
- **Tail.** "Tail short, even, of twelve broad rounded feathers" [Audubon 1831, p. 397]. Western males 88-96.5 mm, females 88-101 mm [Ridgway 1914, p. 420].

### 2.2 Colour of the wing and tail

From the adult male's description [Ridgway 1914, p. 415]; the female differs only where stated [pp. 415-416].

| Part | Description (source words) | Notes for the paint |
|---|---|---|
| Upperwing coverts | "clear bluish gray", "very slender black shaft-streaks"; "wing-coverts and secondaries usually with a few minute irregular white markings" | the same blue-grey as the back |
| Secondaries, upper side | "portion of outer web next to shaft and most of inner web black"; Audubon: "secondaries blue on the outer web" [Audubon 1831, p. 397] | closed, they read blue-grey; spread, dark with blue-grey edges |
| Alula, primary coverts, primaries | "slate-black, the first edged with bluish gray, the second minutely tipped with white, the primaries with basal half, more or less, spotted with white" | **the white patch.** Audubon: "the base of the primaries barred with white" |
| Inner primaries, distal secondaries | "rather narrowly tipped with white" | a thin pale trailing edge |
| Underwing | "axillars, under wing-coverts, and greater part of basal half (more or less) of inner webs of primaries, immaculate white; inner webs of secondaries white basally, this sometimes broken into spots on distal portion" | white coverts; flight feathers barred |
| Female underwing | "sides, flanks, and axillars, cinnamon-rufous, the innermost under wing-coverts sometimes tinged or suffused with the same" | a rufous patch at the wing's base below (by eye, `belkin1-under-spread-5.jpg`) |
| Tail | middle pair "bluish gray with a median streak of black ... margined on each side by a greater or less number of small white spots"; the rest "slate-black ... the outer web ... broadly edged with bluish gray, the inner black portion spotted with white, the inner webs barred with white" | barred black and white below, blue-grey above |

**Measured on the reference photos (by eye):**

- **White patch, upperwing** (`belkin1-dorsal-low.jpg`): white blocks and bars across the primaries from about **0.64 to 0.88 of the half-span**, from just behind the leading edge to about two-thirds of the way back to the trailing edge. Outboard of 0.88 the primaries are plain slate-black. The patch is made of white bars on the inner webs and spots on the outer webs. Closed, it shows as a small white flash at the primaries' base.
- **Barring:** a loose inner secondary laid against a ruler measures **about 104 mm**, with about **7 white bars on the inner web, about 11 mm apart** (`belkin1-feather-ruler.jpg`, by eye, scaled from the ruler). The rectrices carry about **10-12 white spot pairs, about 8 mm apart** (`belkin1-under-spread-5.jpg`, scaled from the semispan).
- **What reads:** at 30 m through the binoculars (3.7 mm per pixel) a 11 mm bar period spans 3 pixels: barring reads as a mottled grey underwing, the white patch as a block. At 60 m through the telescope (1.9 mm per pixel) the bars resolve (Computed).

### 2.3 The planform, traced

**Reference.** The top-down trace is `belkin1-dorsal-low.jpg` (Dr. Liz Anna Kozik, iNaturalist 333912529, CC BY-NC). It shows a bird flying low over brush, seen from straight above, with both wings spread and the tail fanned. The bird's left wing (image right) lies flat to the camera, and the body axis runs straight down the frame. A ventral check comes from `belkin1-under-spread-5.jpg` (alchem30, iNaturalist 357796340, CC BY-NC): a female seen from below, mid-turn, with the hand slightly closed.

**Method.** I read points by hand on grid-overlaid crops in original-image pixels. The shoulder is where the leading edge meets the body (1000, 800). The tip is the end of the longest primary (1565, 780). The half-span is 565 px from shoulder to tip. The body's midline sits 58 px inboard of the shoulder, so the body is **0.10 of the half-span wide on each side**, about 46 mm across at the shoulders (Computed). Stations are fractions of the half-span `s` from the shoulder (0) to the tip (1). The leading and trailing edges are distances forward (+) and back (−) of the shoulder joint, as fractions of the half-span and as multiples of the wing chord. The second set uses half-span = 1.47 × wingChord: 242 mm against Ridgway's *caurina* mean of the sexes, 164.3 mm.

| s (of half-span) | LE (half-span) | TE (half-span) | Chord (half-span) | LE (× wingChord) | TE (× wingChord) | Chord (× wingChord) | Chord (mm) |
|---|---|---|---|---|---|---|---|
| 0.00 (shoulder) | +0.000 | −0.409 | 0.409 | +0.000 | −0.602 | 0.602 | 99 |
| 0.10 | −0.014 | −0.437 | 0.423 | −0.021 | −0.644 | 0.623 | 102 |
| 0.20 | −0.027 | −0.455 | 0.429 | −0.039 | −0.671 | 0.632 | 104 |
| 0.30 | −0.027 | −0.462 | 0.435 | −0.039 | −0.680 | 0.641 | 105 |
| **0.37 (wrist)** | −0.027 | −0.454 | 0.428 | −0.039 | −0.669 | 0.630 | 104 |
| 0.50 | −0.001 | −0.428 | 0.426 | −0.002 | −0.630 | 0.628 | 103 |
| 0.60 | +0.008 | −0.389 | 0.397 | +0.012 | −0.573 | 0.585 | 96 |
| 0.70 | +0.013 | −0.345 | 0.359 | +0.020 | −0.508 | 0.528 | 87 |
| 0.80 | +0.035 | −0.268 | 0.303 | +0.052 | −0.395 | 0.446 | 73 |
| 0.90 | +0.049 | −0.201 | 0.250 | +0.072 | −0.297 | 0.368 | 61 |
| 0.95 | +0.054 | −0.143 | 0.196 | +0.079 | −0.210 | 0.289 | 48 |
| 1.00 (tip, p8-p9) | +0.035 | +0.035 | 0 | +0.052 | +0.052 | 0 | 0 |

- **Area:** the mean chord is **0.371 of the half-span**, so one wing is 0.371 × 0.242² = 0.0217 m² and both are **0.0435 m²** (Computed). Poole's 376 cm² for eastern males, scaled by (164.3 / 157.5)² for the longer western wing, gives **409 cm²**, 6% less (Computed). The trace agrees with a planimeter on dead birds to within the spread of one photo.
- **The ventral check** (`belkin1-under-spread-5.jpg`) gives a mean chord of only 0.24-0.26 of the half-span, with the trailing edge further forward over the hand. That bird is turning with its hand partly closed and its wing tilted to the camera. Use it for the colour of the underside, not the outline.
- **The tip and the notched trailing edge** (by eye on both photos): the outer **4-5 primaries part at their tips** over the last 8-12% of the half-span. They leave narrow slots, about **15-25 mm deep**, between rounded feather ends. These are not the deep "fingers" of a hawk. Loose primaries (`belkin1-feathers-set.jpg`) show no marked emargination. P10 is short, ending about at p7 [Ridgway 1914, p. 408], so the leading edge near the tip is a little rounded. For the model, notch the trailing edge at about **s = 0.80, 0.86, 0.91, 0.95**, each notch 0.03-0.05 of the half-span deep (Estimate from the photos).
- **The wrist** is not visible on the dorsal photo. On the ventral photo a white mark at the bend of the wing sits at 0.34 of the half-span. Ridgway's "second [primary coverts] minutely tipped with white" puts a white mark there. From the measurements: the closed wing runs from the bend to the wingtip, 164 mm in *caurina*. The spread hand reaches about that far out, so the wrist sits at 242 − 155 ≈ 87 mm from the shoulder: **0.36 of the half-span** (Computed; 155 mm allows for the primaries' angle to the span). **Adopt s = 0.37.** The arm (humerus) and forearm split the 0-0.37 span; take the elbow at **s ≈ 0.17** (Estimate: in most birds the humerus is a little shorter than the ulna).
- **Sweep:** the leading edge runs nearly straight out from the shoulder, bowing 3% back of it at mid-arm and 5% forward of it near the tip. The flat, spread wing is close to unswept (by eye). The hand sweeps back as the wrist flexes.

### 2.4 Numbers for the wing

| Quantity | Value | Basis |
|---|---|---|
| Span, tip to tip | **0.53 m** (0.50-0.56) | Audubon 508 mm, eastern male [Audubon 1831, p. 398], × 1.043 for *caurina*'s longer wing [Ridgway 1914] (Computed) |
| Half-span, shoulder to tip | **0.242 m = 1.47 × wingChord** | (0.53 − 0.046) / 2 (Computed) |
| Body width at the shoulders | 0.046 m (0.10 of the half-span each side) | Traced |
| Root chord | **0.60 × wingChord** (99 mm) | Traced |
| Wrist | **s = 0.37** | Computed; the ventral photo gives 0.34 |
| Elbow | s ≈ 0.17 | Estimate |
| Area, both wings, no body | **0.0435 m²** (0.038-0.048) | Traced; Poole 376 cm² eastern (409 scaled) |
| Area with the body strip (Pennycuick's S) | 0.048 m² | + 0.046 × 0.099 m (Computed) |
| Aspect ratio b²/S | **5.9** | Computed |
| Wing loading | **31 N/m²** (150 g) | Computed |
| Hand-wing index; Kipp's distance | 33.6; 53.2 mm | [Tobias et al. 2022] |
| Primaries; longest | 10; p8 and p9 | [Ridgway 1914, p. 408] |
| Rectrices | 12 | [Audubon 1831, p. 397] |
| Separated tips | outer 4-5 primaries, slots 15-25 mm, notches at s ≈ 0.80/0.86/0.91/0.95 | By eye |
| White patch, upperwing | s 0.64-0.88, LE to about two-thirds chord | By eye; [Ridgway 1914, p. 415] |

---

## 3. Flapping flight

### 3.1 What the sources say

- **Rhythm.** "Its motions when on wing consist of a series of flaps, about five or six in number, followed by a direct glide, without any apparent undulation. It moves in the same way when flying closely over the water" [Audubon 1831, p. 395]. "The flight of the kingfisher is strong, swift, and graceful, usually low, but high above the treetops when traveling; often there are five or six rapid strokes followed by a long glide on half-closed wings" [Bent 1940, p. 122]. For the western race: "This bird's wing-beat is characteristic, three quick beats followed by two executed in a more leisurely manner, like this: one, two, three; four; five" [Grinnell & Storer 1924, in Bent 1940, p. 130].
- **Height.** "he skims so close over the water that their [the wings'] tips are sometimes wetted" [Carey 1909, in Bent 1940, p. 122]. Along a stream it flies "well below the treetops until he glides upward to alight on his accustomed perch" [Bent 1940, p. 122]. When it travels overland the flight "is performed high in the air" [Audubon 1831, p. 394].
- **Speed.** I found no measured speed for this species. Pied Kingfishers (**cross-species**, 80-100 g) cross a pond "in a fast, level flight, at an average speed of 10-12 m/sec" [Katzir et al. 2018, l. 171-172].
- **Wingbeat frequency.** No measured value for this species was found. Pennycuick fitted wingbeat frequency to mass, span, area, and air density across 32 species [Pennycuick 1990] and later 47 [Pennycuick 1996]. The 1996 equation "is also numerically correct as it stands, without requiring a multiplication factor" [Pennycuick 1996, abstract]. I could not open either paper. The forms below are as widely quoted, and their exponents are unverified:
  - 1990: f = 1.08 m^(1/3) g^(1/2) b^(−1) S^(−1/4) ρ^(−1/3)
  - 1996: f = m^(3/8) g^(1/2) b^(−23/24) S^(−1/3) ρ^(−3/8)
- **Upstroke flexion.** Black-billed Magpies (**cross-species**, a bird of similar mass with low-aspect-ratio wings) used a "vortex-ring gait during steady-speed flight at all speeds" (4-14 m/s). In that gait the wing is flexed strongly on the upstroke. Their "stroke-plane angles of the wingtip and wrist relative to the horizontal and the angle describing tail spread at mid-downstroke all decreased with increasing flight speed" [Tobalske & Dial 1996, abstract].

### 3.2 Computed

| Case | m | b | S | f (1990) | f (1996) |
|---|---|---|---|---|---|
| Adopted | 0.15 kg | 0.53 m | 0.048 m² | **6.8 Hz** | **7.2 Hz** |
| Small bird | 0.15 | 0.50 | 0.043 | 7.4 | 7.9 |
| Large wing | 0.15 | 0.56 | 0.053 | 6.3 | 6.6 |

Adopt **7 Hz** for flapping (6-8). Grinnell and Storer's "leisurely" beats: about **0.7 × that, 5 Hz** (Estimate). Today's species file has `wingbeatHz: 6`.

### 3.3 Adopted

| Quantity | Value | Basis |
|---|---|---|
| Wingbeat, quick beats | **7 Hz** (6-8) | Computed, Pennycuick |
| Wingbeat, leisurely beats | 5 Hz | Estimate from "three quick ... two ... leisurely" |
| Pattern | bouts of **5-6 beats** (3 quick, 2 slow), then a **glide of 0.3-0.8 s** on half-closed wings, with no undulation | [Audubon 1831; Bent 1940; Grinnell & Storer 1924]; glide length Estimate |
| Glide posture | wrist flexed 30-40°, elbow 25°, wings level to slight dihedral | "half-closed wings" [Bent 1940]; angles Estimate |
| Amplitude, flapping | **100°** (from +55° to −45° of the body's horizontal plane) | Estimate: magpie-like gait; today's flap is ±0.9 rad (103°) |
| Downstroke share of the cycle | 0.55 | Estimate |
| Upstroke span (span ratio) | **about 0.6** of the spread span: elbow about 55°, wrist about 60° at mid-upstroke | Estimate from the vortex-ring gait [Tobalske & Dial 1996] |
| Speed, cruising | **9 m/s** (8-11) | Estimate around the Pied Kingfisher's 10-12 m/s (**cross-species**) [Katzir et al. 2018] |
| Height over water, between perches | **0.3-1.5 m**, rising to the perch in a final glide | [Carey 1909; Bent 1940]; heights Estimate |

---

## 4. Hovering

### 4.1 What the sources say

**Belted Kingfisher.**
- "rising 30 or 40 feet into the air and scanning the water below it in more active pursuit of its prey, it may stop and hover for a few seconds, with rapidly vibrating wings, and then make a straight or spiral dive directly downward" [Bent 1940, p. 120].
- "it suddenly checks itself in its career, poises itself in the air, like a Sparrow-hawk or Kestril, and inspects the water beneath ... it continues poised for a few seconds, dashes spirally headlong into the water" [Audubon 1831, p. 395].
- "as he hovers, his body appearing absolutely motionless ... for indefinite periods of time" [Carey 1909, in Bent 1940, p. 122].

**Pied Kingfisher (cross-species: *Ceryle rudis*, 80-100 g, span 46 cm, wing length 19 cm, Israel fish ponds)** [Katzir et al. 2018]:
- Hovers last "from a few seconds to more than a minute", at "heights ranging between 0.5-12m, mostly with its bill pointing down (overall relative to the horizon 76.4° ± 9.2°; mean±sd)" (l. 169-174). It arrives in level flight and "would then halt abruptly and hover in midair" (l. 172-173). "Flight segments between hovering bouts frequently were of a shallow u-shape" (l. 174-175). A hover is a period in which the bird "moved less than one body length horizontally or vertically over many seconds" (l. 95-96).
- "Wing beat angular amplitude (range 9°-134°) was not correlated with wind velocity ... while wing beat frequency (range 5.4-9.5Hz) was significantly and negatively correlated with wind velocity (... N=42, R2= 0.725 ...) ... Wing beat amplitude was minimal at wind velocity of ca. 7m/sec and wing beat frequency was minimal at ca. 12-14m/s" (l. 192-197). "While the wings underwent displacements of up to ca. 120deg, the torso motion was reduced by an order of magnitude and the head movement was further reduced so that eye perturbation was of order 5mm" (l. 252-254). Elsewhere: "ca. 7-10 Hz" (l. 232).
- "the body tilt underwent periodic changes with wing beat cycles ... with increased wind velocity (up to ca. 12 m/s) the tilt became more horizontal. At wind velocities higher than 12 m/s, body tilt became more vertical again" (l. 198-204). The paper gives no tilt angles in degrees in its text.
- "the wingtip displacement (172.6 ± 72.7mm) [was] ca. two orders of magnitude greater than that of the breast or eye (respectively 8.4±4.6mm and 4.3±2.7mm). Eye horizontal displacement was of similar magnitude (3-5.9mm). The periodicity of wingtip position differed from that of the eye and breast by 180°" (l. 207-211).
- "During a given hovering episode, the tilt angle of the body, the head-bill and the tail were roughly unchanged. The bill in most hovering episode pointed down ... with the head partially rotated ... so that one eye gazed downwards. In the transition from a stationary hovering position to flight, the orientation of the head-bill first changed so that the bill first pointed in the direction of the ensuing flight, and the body followed" (l. 187-191).
- In wind, "the higher the wind velocity the higher the precision of facing it directly" (l. 183-184), and "the body orientation of the PKFs in the horizontal plane remained virtually unchanged" through a hover (l. 178-179).
- Head stabilisation is "similar to head stabilization of kestrels (Videler et al., 1983 ...)" (l. 255): **cross-species**, through Katzir et al.

### 4.2 Measured on the reference photos (by eye)

- **Body angle:** on `belkin1-hover-side.jpg` (Greg Lasley, Florida, male, wings at the top of the stroke) the line from the nape to the tail tip is **53° above horizontal**. The legs hang, and the tail is half-closed and pointing down.
- **Bill:** straight down on `belkin1-hover-front-1.jpg` and `-2.jpg` (Christopher J. Earle, Nisqually NWR, Washington, November). This matches the pied's 76° ± 9°.
- **Tail fan:** about **90-120°** on the hovering birds seen from in front or below (`belkin1-hover-front-1.jpg`, `belkin1-under-spread-2.jpg`). On the turning, braking female of `belkin1-under-spread-5.jpg` it measures **137-148°** between the outer rectrices (point read on a grid; the spread depends on where the hidden base is taken). That is the fan at its widest.
- **Wing at the top of the stroke** (`belkin1-hover-side.jpg`): both wings raised well above the back, the hands swept back and their primaries parted. Mid-downstroke (`belkin1-hover-front-1.jpg`), the wings are spread nearly flat, a little below the horizontal.

### 4.3 Adopted

| Quantity | Value | Basis |
|---|---|---|
| Hover wingbeat, calm (wind < 1 m/s) | **9 Hz** | **Cross-species:** the pied's maximum 9.5 Hz, × (150/84)^(−1/6) = 0.91 for geometric scaling [Pennycuick 1996, abstract] gives 8.6; rounded up (Computed) |
| Hover wingbeat at the scene's 2.8 m/s | **8.5 Hz** | Estimate, interpolating the pied's decline with wind |
| Hover wingbeat in a strong wind (8-12 m/s) | 6-7 Hz | **Cross-species** [Katzir et al. 2018] |
| Amplitude | **120°** total, the same in all winds | **Cross-species** [Katzir et al. 2018, l. 252-253] |
| Stroke plane (wingtip path, side view) | **about 20-30° from horizontal** | Estimate: the body at 55° turns a body-frame flap into a 35° world stroke plane, and the forward sweep on the downstroke flattens it further (section 8.2) |
| Body angle | **55°** above horizontal (50-60°) in light wind; flatter (35-45°) in strong wind | By eye 53°; trend [Katzir et al. 2018] |
| Bill | **60-90° below horizontal** (pied 76° ± 9°); the head turned so one eye looks down | [Katzir et al. 2018]; by eye |
| Tail fan | **100°** (90-120°) while hovering; up to 140° when braking | By eye |
| Head (eye) movement | **≤ 5 mm** while the wingtip moves about 0.2 m and the breast about 8 mm, the head and breast in anti-phase with the wingtip | **Cross-species** [Katzir et al. 2018, l. 207-211] |
| Facing | into the wind, and the heading holds through a hover | **Cross-species** [Katzir et al. 2018] |
| Hover height | **3-12 m**; Bent's scanning height 9-12 m | [Bent 1940, p. 120]; pied 0.5-12 m |
| Hover length | **2-6 s** each ("a few seconds") | [Audubon 1831; Bent 1940] |
| Shift between hover points | a **shallow U** of 2-10 m in 1-2 s, then hover again; the bill turns toward the new point first | Path [Katzir et al. 2018, l. 174-175, 190-191]; distances Estimate |
| Arrival | "halt abruptly" from level flight: 0.3-0.5 s of braking, body pitching up to 55°, tail fanning | [Katzir et al. 2018, l. 172-173]; times Estimate |
| Body bob per beat | ±4 mm vertical, in step with the downstroke | **Cross-species** [Katzir et al. 2018] |

**Holding a hover in wind.** At 2.8 m/s the scene's wind is about a third of the pied's minimum-power range. Face the wind, beat at 8.5 Hz, and hold the head still in world space. Let the body rise about 4 mm on each downstroke and sink on the upstroke. Through the telescope at 60 m that is 2 px for the body and under 3 px for the head: the head reads as fixed. **Today's `hover.ts` bobs the whole bird ±0.15 m at about 0.5 Hz (`Math.sin(bob * 3) * 0.15`).** That is about 40 times the observed body motion and should go.

---

## 5. Take-off and landing

No source times these for this species. Everything here is an Estimate from general bird flight and the photos, kept consistent with the wingbeat numbers above.

| Event | Sequence | Duration |
|---|---|---|
| **Take-off from a perch** | lean forward 0.1-0.2 s; drop off the branch while the wings open over **half a beat**, from folded to spread at the top of the first downstroke; 3-4 full-amplitude beats at 7-8 Hz while it drops 0.3-1 m and gains speed; then cruise | wings open in **0.07-0.10 s**; level flight within 0.5 s |
| **Landing on a perch** | a final glide upward to the perch [Bent 1940, p. 122]; then **2-3 braking beats** with the body pitched up 40-60°, the stroke swung forward, and the **tail fanned 100-140°** (by eye, `belkin1-under-spread-5.jpg` and `belkin1-dorsal-low.jpg`); the feet reach forward; touch down | braking **0.3-0.5 s** |
| **Folding on the perch** | the wings rise once, then close: elbow and wrist fold, the hand sweeping back over the arm, the whole wing lying along the flank; the tail closes; a tail flick and a crest raise often follow (see the species document) | fold **0.2-0.3 s** |

Folding in 0.2-0.3 s is 12-18 frames at 60 fps. That is room for the spec's "close to lie along the folded wing's place" before the swap.

---

## 6. The plunge, the spray, and the emergence

### 6.1 The path

- **From a perch.** "From such a perch the bird may dive obliquely into the water to seize the fish in its powerful bill" [Bent 1940, p. 120]. "Again, he drops like a falling stone in a nearly perpendicular line upon his fishy prey". "Sometimes, especially in water half a foot or less in depth, he dives while flying nearly parallel to its surface" [Carey 1909, in Bent 1940, p. 122]. When the water is rough it makes "an ineffectual effort" [Coues 1878, in Bent 1940, p. 122].
- **From a hover.** "a straight or spiral dive directly downward" [Bent 1940, p. 120]; "dashes spirally headlong into the water" [Audubon 1831, p. 395]. For the Pied Kingfisher the dive, "once begun, is ballistic" [Katzir et al. 2018, l. 79] (**cross-species**).
- **The call.** The rattle is given "occasionally just as he is about to make a plunge" [BBR 1874, p. 394].
- **Entry speed.** No kingfisher's entry speed has been measured that I could find. Crandell et al. dropped printed bill models from 75 cm and ran their flow models at 5 m/s, "approximately the same as for the physical simulations" [Crandell et al. 2019, sections 2.3, 2.5]. The popular figure of "up to 40 km/h" (11 m/s) appears in press coverage of Eliason et al. 2023, but not in the paper itself. A 150 g bird with folded wings has a terminal speed near 57 m/s (Computed for a 5.6 cm frontal diameter and C_D 0.3), so drag hardly slows it over a few metres. Free fall from rest (Computed):

| Drop | 2 m | 3 m | 4.25 m (the snag) | 6 m | 9 m | 12 m |
|---|---|---|---|---|---|---|
| Speed at the water | 6.3 m/s | 7.7 | 9.1 | 10.8 | 13.3 | 15.3 |

  The bird does not fall from rest in a straight line. A perch plunge starts outward and down with the wings half open, steering. A hover plunge from 9-12 m is often taken in stages or in a spiral (Bent, Audubon), and photos of plunging kingfishers show the wings open until the last moment. **Adopt 6 m/s (5-8) from a perch and 8 m/s (7-10) from a hover** (Estimate). Today's `DIVE_SPEED = 14` is fit only for a straight drop from 10 m.
- **Entry angle.** From a perch: **40-70° below horizontal** at entry, steepening along a curved path. From a hover: **75-90°**. Over very shallow water, a shallow skim. `belkin1-splash-1.jpg` (Beaverton, OR) shows a white disturbed track about **3.5 m long** on the water behind a bird lifting off, which fits a skimming entry (by eye).
- **Wing shape going in** (by eye on photos of plunging kingfishers; no measured source). The wings are half open while the bird steers, then swept back and folded against the body over the **last 0.1-0.2 s**: the elbows and wrists flex, and the hands lie back along the tail. The bill, head, and body line up with the path. The tail is closed. Folded wings at entry are what Sharker et al. describe for plunge divers generally, "folding their wings to minimize the impact force and conserve momentum" [Sharker et al. 2019, p. 1], and what Liang et al. found reduces peak impact in a model gannet (through [Sharker et al. 2019, p. 2]).
- **Why it enters cleanly.** Diving kingfishers have narrower, longer bills than terrestrial ones, and printed models of their bills decelerate less on entry. "Diving species have lower peak decelerations, and thus enter the water more quickly". Flow modelling shows "the morphology between the beak and head is a key site for reducing drag" [Crandell et al. 2019, abstract]. Sharker et al. dropped a printed Belted Kingfisher head (68.8 mm bill) into water at 4.4-23 m/s. They found the plunge divers' impact forces "well within the safe zone", and that "all birds pitch upward after impact" [Sharker et al. 2019, Table 2 p. 4, Fig. 3 p. 5].

### 6.2 Under the water

- **Depth.** "most fishes are caught less than 60 cm below the surface" [Davis 1982b, via Birds of the World, Snippet; not read]. Adopt **0.2-0.6 m** for the bill's deepest point (Estimate). The plunge needs water at least **0.4 m deep** (the scene's depth bake decides where).
- **Time.** "disappearing beneath the water sometimes for several seconds" [Bent 1940, p. 120]. **Adopt 0.5-1.5 s** hidden, rarely to 2.5 s (Estimate). Fewer than half of plunges are deep enough to hide the whole bird for long (Estimate).

### 6.3 The spray, observed (by eye)

Two valley photos by chatterton-blue, at Greenway Park, Beaverton, Oregon, a few kilometres from the scene's setting (`belkin1-splash-1.jpg`, 3 October 2025; `belkin1-splash-2.jpg`, 7 November 2025). Both show a kingfisher leaving the water. A plunge's own splash is similar but thrown more nearly straight up (Estimate).

| Photo | Scale | Sheet height | Sheet width | Highest drops | Notes |
|---|---|---|---|---|---|
| `belkin1-splash-2.jpg` | a second bird's spread wings, 0.53 m, at about the same distance: 2.25 mm/px | **0.37 m** | **0.87 m**, thrown sideways from a low exit | **0.75 m**, an arc of drops trailing up after the bird | two birds; a chase |
| `belkin1-splash-1.jpg` | the bird's length, about 0.32 m: 2.8 mm/px | **0.45 m** column | 0.4 m | 0.45 m | wings raised over the column; a 3.5 m white track behind |

A third, small photo (`belkin1-emerge-spray-1.jpg`, Brooklyn, NY) shows the same pattern: a bird lifting off with a burst of drops beneath it.

### 6.4 The spray, physics

- **A hydrophobic body always splashes.** Spheres must be "coated ... [to] create a hydrophobic surface condition with a contact angle of 150°-165°" to form a cavity at 2-6 m/s [Eshraghi et al. 2019, p. 1]. Plumage is water-repellent, so a cavity and a splash curtain form at any plunge speed. The curtain then "may splash outwards or dome over and close" [p. 1]. A dome is a "surface seal", which a slender, fast body makes less often.
- **How fast the sheet leaves.** For wedges, the splash tip speed is "linearly proportional to V, even at low entry speeds", rising with the wedge's bluntness [Vincent et al. 2017, Fig. 8 and eq. (6), p. 15]. Most of the ejected water moves slower than the tip. The thin, fast tip breaks into fine drops. **Cross-geometry:** spheres, disks, and wedges, not a bird.
- **The cavity seal.** For disks, "the period between impact and cavity closure ... [is] described by a single value of dimensionless time, τ = T_seal (g/r)^0.5, near 2.3" [Glasheen & McMahon 1996, abstract]. For the kingfisher's body radius of 25-30 mm this gives **T_seal ≈ 0.12-0.13 s** (Computed). The collapse throws a thin upward jet (a Worthington jet) and leaves a white patch of bubbles. I found no measured jet height for a body this size, so the jet is an Estimate.
- **Ballistic drops** (Computed: launch at 75° above horizontal, quadratic drag with a standard sphere drag curve). Height H, horizontal throw R, and time to fall back T:

| Launch speed | d = 0.5 mm | d = 1 mm | d = 2 mm | d = 4 mm | No drag |
|---|---|---|---|---|---|
| 2 m/s | H 0.13, R 0.10, T 0.32 | 0.16, 0.15, 0.36 | 0.18, 0.18, 0.38 | 0.18, 0.19, 0.39 | H 0.19 |
| 3 m/s | 0.23, 0.16, 0.44 | 0.32, 0.28, 0.51 | 0.38, 0.37, 0.55 | 0.41, 0.42, 0.58 | 0.43 |
| 4 m/s | 0.33, 0.22, 0.53 | 0.50, 0.41, 0.64 | **0.63, 0.59, 0.72** | 0.70, 0.71, 0.76 | 0.76 |
| 6 m/s | 0.52, 0.30, 0.67 | 0.88, 0.64, 0.85 | 1.22, 1.06, 1.00 | 1.46, 1.41, 1.09 | 1.71 |

  The photographed heights (0.35-0.75 m) match drops of 1-3 mm thrown at **3-4 m/s**, about half the entry speed (Computed against by-eye heights). The bulk of the crown leaves slower than the bird enters, as a streamlined bill would predict [Crandell et al. 2019].
- **Drop size.** A curtain's rim breaks into drops of about the rim's thickness or a little more. Eshraghi et al. measured the rim but give no size I could read. **Adopt 1-3 mm** (Estimate). These are sub-pixel at 30 m through the binoculars (3.7 mm per pixel), so render each as a bright point of at least 1 px, or as a small soft sprite (Computed).

### 6.5 The spray and ring, adopted

| Quantity | Plunge (entry) | Take-off from the water | Basis |
|---|---|---|---|
| Crown: droplets per spray | 60-120 | 40-80, many shed from the wings | Estimate (render count) |
| Launch ring radius | 0.04-0.08 m (the cavity's mouth) | 0.05-0.15 m around the body and wingtips | Estimate |
| Launch speed | **2-4 m/s**, a few to 5 m/s | 2-3.5 m/s, plus drops thrown off the wings at 1-3 m/s in the bird's direction | Computed against the photos |
| Launch angle | 60-85° above horizontal, inclined away from the bird's line of travel for an oblique entry | 45-80°, biased forward along the take-off | Estimate; the photos |
| Drop size | 1-3 mm | 1-3 mm | Estimate |
| Height | **0.3-0.7 m** (peak 0.7) | **0.35-0.75 m** | By eye; Computed |
| Spread | radius 0.2-0.6 m | 0.4-0.9 m across | By eye; Computed |
| Drops' life (up and back) | **0.5-0.8 s** | 0.5-0.9 s | Computed |
| Worthington jet | at **0.12 s**, a thin column 0.1-0.25 m high, gone by 0.4 s; optional | none | Seal time Computed; height Estimate |
| White burst at the water | a foam disc 0.15-0.3 m across, peak at 0.1 s, fading over **0.8-1.2 s** | 0.2-0.4 m across, fading over 1 s | Estimate |
| Ring (`ripples.ts` size) | **0.9**: crest at 0.356 m/s, 5.6 s, 6 crests, reach 2.0 m | **0.6-0.7**: 0.26-0.29 m/s, 4.4-4.8 s, 4-5 crests, reach 1.1-1.4 m | Mapped from the water research's table (section 4.3 there) |
| Sound | the existing splash | a softer one, or none | Existing |

**Placing the ring.** The water research sizes a ring by its λ_max ≈ 2 × the splash's diameter. A grebe's body-sized dive (15-20 cm) is size 0.9-1.0. The kingfisher's body is only 5 cm across, but its cavity and crown base are about 0.1-0.15 m, and it hits harder. So λ_max ≈ 0.25-0.30 m, an outer speed of 0.32-0.35 m/s, and **size 0.9** (Computed with the water research's dispersion table). Leaving the water stirs a similar area with less energy, so **0.6-0.7** (Estimate). The spec's "a smaller ring" holds.

### 6.6 The emergence

- **How it leaves.** It surfaces bill up, the wings come clear of the water first, and **2-4 strong, deep beats** lift it off (by eye on `belkin1-splash-1.jpg`: wings raised over a column of spray; and `belkin1-emerge-3.jpg`). It then climbs at a shallow angle and turns for a perch: "Having secured the fish, it flies with it to some favorite perch" [Bent 1940, p. 120]. After a miss, a hovering bird may "resume hovering" [Katzir et al. 2018, l. 175-176] (**cross-species**). The first beats are full amplitude (130°) at about 8 Hz, and the bird is level with full flight speed within about 1 s (Estimate).
- **Shaking off.** Kingfishers are often said to shake water off in flight, but I found no source that describes or times it for this species, and no photo in the sample shows it clearly. If used: a **0.2-0.3 s whole-body shiver** (body roll ±10-15° at about 10-12 Hz, the wings held up), once, in about a third of emergences, in the first 1-2 s of flight, throwing a few more drops (Estimate; low confidence).

---

## 7. Frames per beat at 60 fps

| Stroke | Frequency | Frames per cycle | Tip travel per frame (half-span 0.242 m) | Reads as |
|---|---|---|---|---|
| Flapping, quick | 7 Hz | **8.6** | 100° × 2 per cycle → 0.10 m/frame | a beat |
| Flapping, leisurely | 5 Hz | 12 | 0.07 m | a beat |
| Hover, scene's wind | 8.5 Hz | **7.1** | 120° × 2 → 0.14 m/frame | a beat, fast |
| Hover, calm | 9 Hz | 6.7 | 0.15 m | a beat |
| Hover, pied's maximum | 9.5 Hz | 6.3 | 0.16 m | a beat |

All Computed. Six or more frames per cycle samples a beat well past the Nyquist limit of 2. The down- and upstrokes each get 3-4 frames, which is enough to see the wing rise and fall. Through the telescope at 60 m the hovering tip jumps about **70 px a frame**: the wing will look strobed rather than blurred, since the spec rules out motion blur, but it will read as beating.

**Hazard:** if the game drops to 30 fps, a 9 Hz hover gets 3.3 frames a cycle and may alias into a slow wobble. **Suggested guard:** frequency ≤ frame rate / 6 at the design frame rate, so ≤ 10 Hz at 60 fps.

---

## 8. Numbers for the model

### 8.1 Joint angles, conventions

All angles are in degrees, in the body's frame, for the right wing (mirror for the left). Phase φ runs 0 to 1 with **φ = 0 at the top of the stroke**: the downstroke starts there. Interpolate the eight samples with a periodic cubic (Catmull-Rom) so that nothing snaps between them.

- **elev**: the arm's elevation above the body's horizontal plane (dorsal +).
- **sweep**: the arm swung forward (+) or back (−) of square to the body's axis.
- **elbow**: the forearm's flex against the arm in the wing's plane (0 straight; + folds the forearm back).
- **wrist**: the hand's flex against the forearm (0 straight; + sweeps the hand back).
- **twist**: the hand's pitch about its own span axis (+ leading edge up).

**These tables are Estimates.** They are built to match the sourced totals: 100° and 120° of amplitude, the upstroke span ratio of about 0.6, the hover stroke plane of 20-30°, and the body at 55°. Their shapes come from the photos in section 9. Tune them in the viewer against `belkin1-hover-side.jpg` (top of the stroke), `belkin1-hover-front-1.jpg` (mid-downstroke), and `belkin1-dorsal-low.jpg` (spread).

### 8.2 Flapping stroke (`wingStroke` 0), downstroke 0-0.55

| φ | 0 | 0.125 | 0.25 | 0.375 | 0.5 | 0.625 | 0.75 | 0.875 |
|---|---|---|---|---|---|---|---|---|
| elev | +55 | +38 | +8 | −25 | −42 | −30 | 0 | +35 |
| sweep | +3 | +10 | +12 | +8 | 0 | −10 | −15 | −6 |
| elbow | 15 | 8 | 8 | 10 | 18 | 45 | 55 | 35 |
| wrist | 10 | 3 | 3 | 6 | 18 | 55 | 60 | 35 |
| twist | −3 | −10 | −12 | −10 | −4 | +10 | +15 | +6 |

Body: pitched up about 5-10° in cruise, level in fast flight [Tobalske & Dial 1996, abstract: body angle decreases with speed]. Tail closed (`tailSpread` 0-0.1).

**Glide** (between bouts): elev 0 to +5, sweep −5, elbow 25, wrist 35, twist 0. Hold for 0.3-0.8 s (Estimate). Ease into it over a quarter-cycle from the top of a downstroke.

### 8.3 Hovering stroke (`wingStroke` 1), downstroke 0-0.5

| φ | 0 | 0.125 | 0.25 | 0.375 | 0.5 | 0.625 | 0.75 | 0.875 |
|---|---|---|---|---|---|---|---|---|
| elev | +60 | +45 | 0 | −45 | −60 | −40 | 0 | +40 |
| sweep | −15 | −5 | +8 | +18 | +20 | +10 | −5 | −15 |
| elbow | 10 | 5 | 5 | 8 | 15 | 35 | 40 | 25 |
| wrist | 8 | 0 | 0 | 5 | 15 | 40 | 45 | 25 |
| twist | +5 | −15 | −25 | −15 | 0 | +20 | +25 | +15 |

Body: pitched up **55°** (`lean.x` about −0.96 rad under today's convention, where + pitches the nose down). Bill **60-90° below horizontal**. The head and neck carry the difference, about 130° below the body's axis, through `headPitch` and the neck. Tail fanned to **100°** (`tailSpread` about 0.7 if 1 is 140°).

Why the sweep: with the body at 55°, a pure elevation stroke moves the tip along the body's dorsal-ventral line, 35° from horizontal in world space. Swinging the arm forward through the downstroke adds a forward-and-up component, flattening the path to about **18-25°** (Computed for the table's sweep). That is the "stroke plane tips toward horizontal" of the spec.

### 8.4 Blends and other poses

| Pose | Values |
|---|---|
| Stroke blend | interpolate each joint's table linearly in `wingStroke`; ease `wingStroke` 0 → 1 over **0.3-0.5 s** as the bird brakes into a hover, and 1 → 0 over 0.3 s as it leaves (Estimate; the arrival is "abrupt" [Katzir et al. 2018]) |
| Frequency blend | hz = 7 + (8.5 − 7) × wingStroke at the scene's wind; hover hz = 9 − 0.12 × wind (m/s), clamped to 6-9.5 (Estimate, **cross-species** trend [Katzir et al. 2018]) |
| Plunge, last 0.15 s | elev +10, sweep −40, elbow 90, wrist 110: wings swept back along the body; `wingSpread` → 0 at the surface |
| Plunge, steering (perch) | `wingSpread` 0.5-0.6, elev +20, elbow 40, wrist 50, held, with 0-2 small beats |
| Take-off first beats | flapping table at amplitude × 1.2 (130°), 8 Hz, 3-4 beats |
| Landing brake | hovering table, body pitched 40-60°, tail 100-140°, 2-3 beats |
| Fold on the perch | elbow and wrist to the folded wing's angles over 0.2-0.3 s, then the swap |

---

## 9. Tracing references

All files are in `C:\Users\kcsel\AppData\Local\Temp\claude\lakewatch-kingfisher\scratchpad\ref\belkin1-wing\`, outside the repo. They are tracing references only and are never committed. `sources.json` there lists each file's observation, photo id, licence, and attribution. Observations: `https://www.inaturalist.org/observations/<id>`; originals: `https://inaturalist-open-data.s3.amazonaws.com/photos/<photo id>/original.jpg`. The candidate pool was 490 research-grade iNaturalist records of *Megaceryle alcyon* whose description or tags mention flight or hovering (942 photos with CC0, CC BY, or CC BY-NC licences). All were viewed as contact sheets in the scratchpad's `flight/sheets/`.

| File | Observation / photo | Photographer, licence | Date, place | Use |
|---|---|---|---|---|
| `belkin1-dorsal-low.jpg` | 333912529 / 606266707 | Dr. Liz Anna Kozik, CC BY-NC | 7 Jan 2026, Naperville, IL | **the planform trace**: top-down, both wings spread, tail fanned; the upperwing white patch |
| `belkin1-dorsal-low-2.jpg` | 333912529 / 606266702 | Dr. Liz Anna Kozik, CC BY-NC | same | the same bird, a moment apart |
| `belkin1-under-spread-5.jpg` | 357796340 / 652630916 | alchem30, CC BY-NC | 1 May 2026, Chaplin, SK | **underside**, female: underwing barring, rufous axillars, the tail fan at its widest; the ventral planform check |
| `belkin1-under-spread-2.jpg` | 313858249 / 566821817 | criminy, CC BY | 11 Apr 2025, Dungeness NWR, WA | underside, hovering, tail fanned |
| `belkin1-under-spread-1.jpg` | 174705896 / 303541651 | Jay Pruett, CC BY | 25 Jan 2018, Havana area, Cuba | hovering from in front and below, wings at mid-downstroke |
| `belkin1-under-spread-3.jpeg`, `-4.jpg` | 124121105 / 210348555; 131008192 / 222879363 | John Brew, CC BY; Sinéad Tuttle-Lerner, CC BY | 2022, Seattle WA; Chester NJ | underside in flight (small) |
| `belkin1-hover-front-1.jpg`, `-2.jpg` | 23011535 / 35671515, 35671522 | Christopher J. Earle, CC BY-NC | 17 Nov 2018, Nisqually NWR, WA | **hovering**, bill straight down, tail fanned |
| `belkin1-hover-front-3.jpeg` | 17499046 / 26621800 | tnewman, CC BY-NC | 14 Oct 2018, Texas | hovering from in front |
| `belkin1-hover-side.jpg` | 184120 / 238838 | Greg Lasley, CC BY-NC | 21 Jan 2013, near Sanibel, FL | **hovering side-on**: body angle 53°, top of the stroke |
| `belkin1-hover-under-close-1.jpeg`, `-2.jpeg` | 240345225 / 428186398, 428186434 | (CC0) | 7 Sep 2024, Thunder Bay, ON | hovering from below, close |
| `belkin1-hover-under-barring.jpeg` | 63180215 / 101355556 | carolyncardilelovesbirds, CC BY-NC | 14 Oct 2020, South Padre Island, TX | underwing barring while hovering |
| `belkin1-under-close.jpg`, `belkin1-under-barring.jpg` | 260758734 / 468335825; 167491 / 223905 | jfredrick, CC BY-NC; Greg Lasley, CC BY-NC | 2023 FL; 2006 TX | underwing and tail close |
| `belkin1-upper-oblique.jpg`, `-whitepatch.jpeg`, `-whitepatch-2.jpg` | 369553606 / 675038097; 37543688 / 59537311; 21154819 / 32702453 | Wendy Feltham; Grigory Heaton; tailedfrog; all CC BY-NC | 2026 WA; 2020 CA; 2019 BC | the upperwing white patch in flight |
| `belkin1-low-over-water-female.jpg` | 400044749 / 734028163 | chatterton-blue, CC BY-NC | 11 Sep 2026, Beaverton, OR | **a valley female low over water**, September |
| `belkin1-flight-side.jpeg` | 105138666 / 176337815 | velodrome, CC BY | 2022, Newport Beach, CA | flapping, side-on |
| `belkin1-splash-1.jpg` | 319458018 / 577468924 | chatterton-blue, CC BY-NC | 3 Oct 2025, Beaverton, OR | **leaving the water**: spray column, skim track |
| `belkin1-splash-2.jpg`, `-3.jpg` | 326108654 / 590545874; 326108661 / 590545874 (one photo, two records) | chatterton-blue, CC BY-NC | 7 Nov 2025, Beaverton, OR | **exit splash** with a second bird for scale |
| `belkin1-emerge-spray-1.jpg`, `belkin1-emerge-2.jpg` | 95606087 / 158737950, 158741193 | Dilrukshan Priyantha Wijesinghe, CC BY | 18 Sep 2021, Brooklyn, NY | lifting off with spray (small) |
| `belkin1-emerge-3.jpg` | 358218 / 447074 | Eric Jacob, CC BY-NC | 11 Mar 2011, Goleta, CA | emergence |
| `belkin1-feathers-set.jpg` | 377341495 / 690023691 | Zenith Sclair, CC BY-NC | 1 Jul 2026, Pierce Co., WA | loose primaries and secondaries: barring, no emargination |
| `belkin1-feather-ruler.jpg` | 8066330 / 10690729 | Amanda Janusz, CC BY | 22 Sep 2017, Ottawa, IL | an inner secondary against a ruler: 104 mm, bar spacing |
| `belkin1-feathers-2.jpg`, `-3.jpg`, `-4.jpg` | 75199063 / 122993068; 305845993 / 551487460; 356505584 / 650153151 | Bert Harris; Lisa S. Jodwalis; heffalumps-and-ouzels; CC BY-NC | 2021-2026 | more loose feathers |

**Rejected:** `belkin1-under-spread-female.jpg` (Lyndsey, iNaturalist 69839773, CC BY) is painted over by hand. It is not a photograph to trace and is kept only so the rejection is on record.

**Which to trace:** the planform from `belkin1-dorsal-low.jpg`; the underwing paint from `belkin1-under-spread-5.jpg` and `belkin1-hover-under-close-1.jpeg`; the upperwing paint from `belkin1-dorsal-low.jpg` and `belkin1-upper-whitepatch-2.jpg`; the hover pose from `belkin1-hover-side.jpg` and `belkin1-hover-front-1.jpg`; the spray from `belkin1-splash-1.jpg` and `belkin1-splash-2.jpg`.

---

## 10. Suggested test thresholds

| Assertion | Value | Basis |
|---|---|---|
| Span, tip to tip, spread | 0.50-0.56 m | Section 2.4 |
| Half-span / wingChord | 1.40-1.55 | Traced 1.47 |
| Root chord / wingChord | 0.55-0.66 | Traced 0.60 |
| Chord at s = 0.8 / root chord | 0.65-0.80 | Traced 0.74 |
| Area of both spread wings | 0.038-0.048 m² | Traced 0.0435; Poole 0.0376-0.041 |
| Wrist station | 0.33-0.42 of the half-span | Computed 0.36-0.37 |
| White patch (upper face) | inside s 0.6-0.9; none inboard of 0.5 | By eye |
| Underwing coverts | white (male); white with rufous axillars (female) | [Ridgway 1914] |
| Flapping frequency | 6-8 Hz | Computed |
| Hovering frequency | 7.5-9.5 Hz at winds under 4 m/s, never above 10 Hz | **Cross-species**, Computed |
| Frames per hovering cycle at 60 fps | ≥ 6 | Section 7 |
| Hover amplitude (tip elevation, top to bottom) | 100-135° | **Cross-species** 120° |
| Flapping upstroke span (mid-upstroke tip distance / spread) | 0.5-0.75 | Estimate |
| Hover body angle | 45-65° above horizontal | By eye 53° |
| Head world movement while hovering | ≤ 6 mm per beat | **Cross-species** 4.3 ± 2.7 mm |
| Tail fan while hovering | 80-130° | By eye |
| Flight speed between perches | 7-11 m/s | Estimate |
| Height over water between perches (mid-flight) | 0.3-2 m | [Carey 1909; Bent 1940] |
| Entry speed, perch plunge / hover plunge | 4-9 / 6-11 m/s | Estimate around Computed free fall |
| Entry angle, perch / hover | 35-75° / 70-90° below horizontal | Sources and Estimate |
| Wings at entry | `wingSpread` 0 at y = 0 | Section 6.1 |
| Time hidden under water | 0.4-2.5 s | Estimate; "several seconds" [Bent 1940] |
| Spray: highest droplet | 0.25-0.8 m | By eye; Computed |
| Spray: every droplet back on the water | by 1.2 s | Computed |
| Plunge ring size | 0.85-0.95 | Section 6.5 |
| Take-off ring size | 0.5-0.7, and less than the plunge's | Section 6.5 |
| Hover length | 1.5-8 s | "a few seconds" |
| Hover height | 3-12 m | [Bent 1940]; **cross-species** |

---

## 11. What the spec might change

1. **The generic planform is wrong for this bird.** `SPAN` 1.78 and `ROOT_CHORD` 0.42 (`wing.ts`) would give a half-span of 0.29 m and a 69 mm root chord. The traced values are 0.242 m and 99 mm. The spec already has a species `wing` block; this confirms it is needed and gives its stations.
2. **A glide pose.** The flapping flight is bouts of 5-6 beats and a glide on half-closed wings. The spec has `wingSpread` and `wingStroke` but no held glide posture. Either the behaviour holds `wingPhase` with a partial `wingSpread`, or the stroke tables gain a glide row (section 8.2).
3. **Hover frequency should depend on the wind**, falling from about 9 Hz in calm air (**cross-species**). The scene's 2.8 m/s gives 8.5 Hz. The bird should face the wind while hovering.
4. **Body bob.** Today's `hover.ts` moves the bird ±0.15 m while hovering. The observed body motion is about ±4 mm, and the head stays still to within about 5 mm. Drop the bob, and hold the head steady in world space.
5. **Dive speed.** Today's 14 m/s straight-down dive is too fast for perch plunges from 4.25 m. Use 5-8 m/s from a perch and 7-10 m/s from a hover, on curved paths.
6. **Ring sizes:** the plunge is size 0.9, not 1.0, and the take-off 0.6-0.7.
7. **Spray droplets are sub-pixel** at binocular range. Render each as at least a 1-pixel bright point so the spray reads. Spray life is short (0.5-0.8 s for the drops, about 1 s for the foam), so the buffer needs only 2-3 sprays.
8. **The rattle on a plunge** is sourced ("occasionally just as he is about to make a plunge" [BBR 1874, p. 394]). The spec's "on some plunges if the research finds it" can stand at a low rate, about 1 in 5 (Estimate).
9. **The shake after emergence** has no source. Keep it optional and rare, or leave it out.

---

## 12. Open questions and confidence

| Section | Confidence | Why |
|---|---|---|
| Span, area, aspect ratio | **High** | Two independent primary measures (Audubon's extent, Poole's planimetry) agree with the trace to within 6% |
| Planform station table | **Medium** | One top-down photo, read by hand; the hand's fan and the tip shape vary with the stroke |
| Wrist position | **Medium** | Computed from wing length; one photo's white mark agrees |
| Notches and slots | **Low-medium** | By eye only; Pyle's and Ridgway's keys give the wing formula, not emargination |
| Colours and white patch | **High** for the pattern [Ridgway 1914]; **medium** for the stations of the patch (by eye) |
| Flapping frequency | **Medium** | Pennycuick's formulas, exponents not checked against the papers; no measured value for the species |
| Flapping rhythm | **High** for the pattern (three independent observers); **low** for glide length |
| Joint-angle tables | **Low** | Estimates shaped to sourced totals; to be tuned by eye |
| Hover kinematics | **Medium** | All measured values are for the Pied Kingfisher (**cross-species**), about half the mass; the Belted's own hover is described only as "a few seconds" with "rapidly vibrating wings" |
| Hover body angle and tail fan | **Medium-low** | By eye on a few photos |
| Take-off, landing, folding times | **Low** | Estimates |
| Entry speed | **Low-medium** | Free fall is Computed; the braking that lowers it is an Estimate; no kingfisher has been measured |
| Depth and time under water | **Low** | One snippet and one old general statement |
| Spray height and spread | **Medium** | Two valley photos, by eye, consistent with ballistic drops; the drop sizes and counts are Estimates |
| Worthington jet | **Low** | Seal time Computed from disks; jet height an Estimate |
| Rings | **Medium** | Mapped through the water research's own table |
| Shaking in flight | **Low** | No source found |

**Still to find:**
- A measured wingbeat frequency or slow-motion video of a Belted Kingfisher flapping and hovering. A frame count from Macaulay Library video would replace both Computed frequencies. I timed no videos: no video tools were available here.
- A measured entry speed and angle for any kingfisher plunge.
- Pyle (1997) and the Birds of the World account (Kelly et al.), which I could not read, for the secondary count, emarginations, and the "Locomotion" section.

**Cross-species substitutions, all of them:**
- Hover frequency, amplitude, body tilt trend, head and breast stabilisation, facing the wind, the U-shaped shifts between hovers, and the level-flight speed are all from the **Pied Kingfisher** [Katzir et al. 2018].
- Head stabilisation in hovering is likened to the **Common Kestrel's** [Videler et al. 1983, through Katzir et al.].
- The upstroke wing flexion (vortex-ring gait) and the drop in body angle, stroke plane, and tail spread with speed are from the **Black-billed Magpie and Rock Pigeon** [Tobalske & Dial 1996].
- Splash and cavity physics are from **spheres, disks, and wedges** [Eshraghi et al. 2019; Glasheen & McMahon 1996; Vincent et al. 2017].
- The bill-shape drag results pool **31 kingfisher species**, with the Pied Kingfisher as the diving species in the flow model [Crandell et al. 2019].
- Folded wings at entry are described for plunge divers in general, and the swept-wing impact result is for a model **gannet** [Sharker et al. 2019, through Liang et al. 2013].

---

## References

- **[Audubon 1831]** Audubon, J. J. 1831. *Ornithological Biography*, vol. I. Edinburgh: A. Black. "The Belted Kingsfisher", pp. 394-398 (flight and hovering p. 395; description p. 397; measurements p. 398). Read via Internet Archive OCR: https://archive.org/details/ornithologicalbi01audu
- **[BBR 1874]** Baird, S. F., T. M. Brewer, and R. Ridgway. 1874. *A History of North American Birds: Land Birds*, vol. II. Boston: Little, Brown. *Ceryle alcyon* pp. 392-395 (the rattle before a plunge p. 394). Read via Internet Archive OCR (CIHM microfiche cihm01317).
- **[Bent 1940]** Bent, A. C. 1940. *Life Histories of North American Cuckoos, Goatsuckers, Hummingbirds and Their Allies*. Bull. U.S. Natl. Mus. 176. Eastern Belted Kingfisher pp. 111-129 (food and hunting p. 120; behaviour and flight pp. 122-123); Western Belted Kingfisher pp. 129-130. Quotes within it from Carey 1909, Coues 1878, Grinnell 1910, and Grinnell & Storer 1924 are cited through it. Read via Internet Archive OCR: https://archive.org/details/bulletinunitedst1761940unit
- **[Carey 1909]** Carey, H. R. 1909. Not read; quoted in [Bent 1940, pp. 122-123].
- **[Grinnell 1910]** Grinnell, J. 1910. *Univ. Calif. Publ. Zool.* 5: 388 (description of *Ceryle alcyon caurina*). Not read; quoted in [Bent 1940, p. 129].
- **[Grinnell & Storer 1924]** Grinnell, J., and T. I. Storer. 1924. *Animal Life in the Yosemite*. Not read; quoted in [Bent 1940, p. 130].
- **[Ridgway 1914]** Ridgway, R. 1914. *The Birds of North and Middle America*, part VI. Bull. U.S. Natl. Mus. 50. Genus *Streptoceryle* pp. 407-409 (wing formula p. 408; key with means p. 409); *S. alcyon alcyon* pp. 415-420 (description and measurements pp. 415-417); *S. a. caurina* pp. 420-421. Read via Internet Archive OCR: https://archive.org/details/cu31924022528081
- **[Poole 1938]** Poole, E. L. 1938. Weights and wing areas in North American birds. *Auk* 55: 511-517. Method p. 511; Belted Kingfisher row p. 516. Read from the SORA PDF (via the Internet Archive's Wayback Machine): https://sora.unm.edu/sites/default/files/journals/auk/v055n03/p0511-p0517.pdf
- **[Tobias et al. 2022]** Tobias, J. A., et al. 2022. AVONET: morphological, ecological and geographical data for all birds. *Ecology Letters* 25: 581-597. https://doi.org/10.1111/ele.13898 . Data https://doi.org/10.6084/m9.figshare.16586228 : sheet AVONET1_BirdLife, rows for *Megaceryle alcyon*, *Ceryle rudis*, *Alcedo atthis*; sheet AVONET_Raw_Data, six *M. alcyon* skins (NHMUK, MMUM).
- **[Katzir et al. 2018]** Katzir, G., D. Berman, M. Nathan, and D. Weihs. 2018. Sustained hovering, head stabilization and vision through the water surface in the Pied kingfisher (*Ceryle rudis*). bioRxiv 409201, posted 7 September 2018; not peer reviewed. https://doi.org/10.1101/409201 . Read in full (PDF, line-numbered).
- **[Videler et al. 1983]** Videler, J. J., D. Weihs, and S. Daan. 1983. Intermittent gliding in the hunting flight of the kestrel, *Falco tinnunculus* L. *J. Exp. Biol.* 102: 1-12. Not read; cited through [Katzir et al. 2018].
- **[Pennycuick 1990]** Pennycuick, C. J. 1990. Predicting wingbeat frequency and wavelength of birds. *J. Exp. Biol.* 150: 171-185. https://doi.org/10.1242/jeb.150.1.171 . Not read; the equation as quoted in search results and secondary sources.
- **[Pennycuick 1996]** Pennycuick, C. J. 1996. Wingbeat frequency of birds in steady cruising flight: new data and improved predictions. *J. Exp. Biol.* 199: 1613-1618. https://doi.org/10.1242/jeb.199.7.1613 . Abstract read (via OpenAlex); the equation's exponents as widely quoted, not checked against the paper.
- **[Tobalske & Dial 1996]** Tobalske, B. W., and K. P. Dial. 1996. Flight kinematics of black-billed magpies and pigeons over a wide range of speeds. *J. Exp. Biol.* 199: 263-280. https://doi.org/10.1242/jeb.199.2.263 . Abstract only (via OpenAlex).
- **[Crandell et al. 2019]** Crandell, K. E., R. O. Howe, and P. L. Falkingham. 2019. Repeated evolution of drag reduction at the air-water interface in diving kingfishers. *J. R. Soc. Interface* 16: 20190125. https://doi.org/10.1098/rsif.2019.0125 . Read in full via PubMed Central (PMC6544885): abstract; methods 2.3 (75 cm drops, 1600 Hz accelerometer), 2.5 (CFD at 5 m/s); results 3.2-3.3.
- **[Sharker et al. 2019]** Sharker, S. I., S. Holekamp, M. M. Mansoor, F. E. Fish, and T. T. Truscott. 2019. Water entry impact dynamics of diving birds. *Bioinspir. Biomim.* 14: 056013. https://doi.org/10.1088/1748-3190/ab38cc . Read in full via West Chester University Digital Commons (bio_facpub 59): introduction pp. 1-2; Table 1 p. 3 (field-guide values from Alderfer 2008 and Perrins 2003); Table 2 p. 4; Fig. 3 p. 5. Liang et al. 2013 (bionic gannet) is cited through it.
- **[Eshraghi et al. 2019]** Eshraghi, J., S. Jung, and P. P. Vlachos. 2019. To seal or not to seal. arXiv:1912.05785. Read: introduction and methods (hydrophobic coating; impact speeds 2-6 m/s; sphere diameters 9.5-19 mm).
- **[Vincent et al. 2017]** Vincent, L., T. Xiao, D. Yohann, S. Jung, and E. Kanso. 2017. Fluid dynamics of diving wedges. arXiv:1707.09420v2. Read: section 4.1, Fig. 8, eq. (6).
- **[Glasheen & McMahon 1996]** Glasheen, J. W., and T. A. McMahon. 1996. Vertical water entry of disks at low Froude numbers. *Phys. Fluids* 8: 2078-2083. https://doi.org/10.1063/1.869010 . Abstract only (via OpenAlex).
- **[Aristoff & Bush 2009]** Aristoff, J. M., and J. W. M. Bush. 2009. Water entry of small hydrophobic spheres. *J. Fluid Mech.* 619: 45-78. https://doi.org/10.1017/S0022112008004382 . Abstract only; consulted for the regime, no number used.
- **[Davis 1982b]** Davis, W. J. 1982. Cited in the Birds of the World account of the Belted Kingfisher (Kelly, J. F., E. S. Bridge, and M. J. Hamas, "Diet and Foraging") for "most fishes are caught less than 60 cm below the surface". Snippet only; I read Davis's *Auk* 99: 353-362 territory paper, which does not contain the claim, so "1982b" may be another paper.
- **[Eliason et al. 2023]** Eliason, C. M., J. M. McCullough, S. J. Hackett, M. J. Andersen, et al. 2023. Genomic signatures of convergent shifts to plunge-diving behavior in birds. *Commun. Biol.* 6: 1069. https://doi.org/10.1038/s42003-023-05359-z . Read via PubMed Central (PMC10598022): it gives no dive speed; the "40 km/h" is from press coverage only.
- **[iNaturalist 2026]** iNaturalist API v1, `/observations`, taxon 2548 (*Megaceryle alcyon*), research grade, photo licences CC0 / CC BY / CC BY-NC, description or tags matching "hover", "flight", "flying", "wings", "spread"; queried 2026-09-30. The candidate list is in the scratchpad's `flight/flight.json`; the references used are in section 9.
- **Not read:** Pyle, P. 1997. *Identification Guide to North American Birds*, Part I (feather counts, emargination). Kelly, J. F., E. S. Bridge, and M. J. Hamas. Belted Kingfisher (*Megaceryle alcyon*), *Birds of the World*, beyond the public headings. Salyer, J. C., and K. F. Lagler. 1946. *Trans. Am. Fish. Soc.* 76: 97-117. Duez, C., et al. 2007. Making a splash with water repellency. *Nature Physics* 3: 180-183 (no abstract available; not used). Marston, J. O., et al. 2016. Crown sealing and buckling instability during water entry of spheres. *J. Fluid Mech.* 794: 506-529 (paywalled). Truscott, T. T., B. P. Epps, and J. Belden. 2014. Water entry of projectiles. *Annu. Rev. Fluid Mech.* 46: 355-378 (not reached).
