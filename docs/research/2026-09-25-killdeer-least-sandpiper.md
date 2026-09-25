# Killdeer and Least Sandpiper: measurements, late-September plumage, field marks, structure, and foraging

Date: 2026-09-25
Purpose: source data for the detailed Killdeer (`killde`) and Least Sandpiper (`leasan`) models and the `plover` and `sandpiper` foraging styles in `docs/superpowers/specs/2026-09-25-mudflat-birds-design.md`. The player watches from about 20 m through the telescope, on a Willamette Valley lake in late September.

How to read the citations: `[Key, p. N]` points to the References section at the end. "Snippet" means the text was visible only as a search-engine excerpt of a paywalled page; I could not read the page, so treat it as unverified. "Computed" means my own arithmetic on cited data. "Photo-measured" means I measured it in pixels on a cited photo and scaled it by the published culmen. "Estimate" means no source gives the number and I chose it, with the basis stated.

---

## 1. Summary

- **Two different body plans.** The Killdeer is 1.9x the Least in wing and tarsus and 2.5x in tail, but only 1.14x in culmen (computed from [Ridgway 1919, pp. 100, 295]). The plover has a short bill on a big head. Its culmen is 0.58 of its tarsus; the Least's culmen equals its tarsus (1.00).
- **Killdeer measurements** (32 adults, [Ridgway 1919, p. 100]): wing 160, tail 95, exposed culmen 20.3, tarsus 34.9, middle toe 21.6 mm. AVONET's four skins agree except for the tail, at 86 mm [Tobias et al. 2022]. **Killdeer is not in the USGS live-shorebird dataset** [USGS 2023].
- **Least measurements** (38 adults, [Ridgway 1919, p. 295]): wing 86, tail 38, culmen 17.8, tarsus 17.9, middle toe 16.2 mm. USGS has 22 live breeding adults: culmen 18.2, total head 38.0, head (total head minus culmen) 19.8 mm (computed from [USGS 2023]).
- **Bill against head.**
  - Least: culmen / head = **0.92** (0.83-1.06, n=22; computed from [USGS 2023]). That is "about 1", matching Ridgway's genus text: "little if any longer than head (sometimes shorter)" [Ridgway 1919, p. 267].
  - Killdeer: no source gives head length. Ridgway says the bill is "much shorter than head" [Ridgway 1919, p. 98]. I estimate the head at 29-32 mm, giving culmen / head of about **0.63-0.70**. The estimate uses one skull [Skullsite] and head-to-mass scaling across nine USGS species, including three plovers (computed).
  - On photos, a fluffy feathered head gives lower ratios: Killdeer 0.54-0.57 and Least 0.69-0.80 (photo-measured).
- **Plumage: model an adult Killdeer and a juvenile Least**, as the design spec says.
  - Least: of 22 ageable iNaturalist photos from the Willamette Valley box between 11 September and 12 October, 17 are fresh juveniles and 4 are October birds with greyer backs. I could not age any as an adult, and all 13 ageable birds between 15 September and 5 October are juveniles (my ageing, section 3.1). July birds are worn adults.
  - Killdeer: the juvenal plumage is "similar to that of the adult" [Bent 1929, p. 209], and both are double-banded [BirdWeb-K; AAB-K]. At 20 m a juvenile differs only by amber-brown feather tips and a brownish wash on the white bar between the bands.
- **Structure.**
  - Killdeer tail: "much more than half as long as wing, graduated for more than one-sixth its length" [Ridgway 1919, p. 98]. Use the `wedge` tail shape. The tail tip reaches **15-19 mm past the folded wingtips** (photo-measured on two photos).
  - Least wing: "no extension past the tertials" [Cox 2008]. The wingtip is about even with the tail: the tail is 1 mm longer on a juvenile photo (photo-measured).
  - Least bill: "faintly decurved tip" [Ridgway 1919, p. 267]. On two photos the tip sits only about **0.3-0.5 mm** below the line of the bill base (photo-measured), with the bend in the distal ~40%.
  - Least posture: crouched, with knees sharply bent and the feet planted forward [Cox 2008].
- **Foraging.**
  - Neither species has published run, stop, or peck numbers that I could read.
  - Killdeer settings are scaled from Pienkowski's timed Ringed and Grey Plovers [Pienkowski 1980, p. 87]:
    - Ringed Plover: stops 1.95 s, runs 0.70 s over 0.32 m.
    - Grey Plover: stops 3.21 s, runs 1.29 s over 0.66 m.
    - Both run at about 0.5 m/s (computed).
  - Least:
    - Walking speed is "about 10 cm/s (Baker and Baker 1973)" [BOTW-L snippet].
    - Peck rate is my estimate from a CC video: about 2-3 bill contacts per second while walking.
    - For comparison, the Western Sandpiper grazes at 121 foraging actions per minute (2 per second) [Canham et al. 2023, citing Kuwae et al. 2008].
- **Tracing references** (downloaded to the scratchpad, not the repo):
  - `ref/killde-side.jpg`: Rhododendrites, CC BY-SA 4.0, 4218x3163, a clean side-on standing adult with the legs visible. It is a Commons Featured Picture. This is the better of the two Killdeer photos.
  - `ref/killde-side-2.jpg`: Charles Homler, CC BY-SA 4.0, 3840x2743. Also side-on, in a still, upright stance, but the bill tip is caked with mud.
  - `ref/leasan-juv.jpg`: Rhododendrites, CC BY-SA 4.0, 5597x4001, a juvenile Least. It is needed because **the game's `leasan.jpg` shows a spring adult** (Hornsby Bend, Texas, 25 April 2008).

---

## 2. Measurements

### 2.1 Ridgway 1919 (museum skins, adults, sexes separated)

Method [Ridgway 1901, pp. xv-xvi]:
- Wing: measured with dividers from the bend to the tip of the longest primary, unflattened.
- Tail: from between the bases of the middle rectrices to the tip.
- Exposed culmen: from the edge of the frontal feathering.
- Tarsus: from the heel joint to the lower end.
- Middle toe: **without claw**.

Immatures were excluded. All values below are in mm.

| Species | Sex (n) | Wing | Tail | Exposed culmen | Tarsus | Middle toe (no claw) | Source |
|---|---|---|---|---|---|---|---|
| Killdeer | M (18) | 154-167 (160.2) | 88-103 (95.6) | 19-23 (20.3) | 33-36.5 (34.6) | 20-23 (21.7) | [Ridgway 1919, p. 100] |
| Killdeer | F (14) | 147-170 (160.1) | 90-103 (94.9) | 19.5-22 (20.4) | 32-37 (35.2) | 20.5-22 (21.4) | [Ridgway 1919, p. 100] |
| Killdeer | pooled (32) | 160.2 | 95.3 | 20.3 | 34.9 | 21.6 | computed |
| Killdeer | western US M (13), means | 161 | 95.5 | 20.2 | 34.5 | 21.7 | [Ridgway 1919, p. 100] sub-table |
| Killdeer | western US F (11), means | 165 | 99.7 | 21.2 | 36.2 | 21.3 | [Ridgway 1919, p. 100] sub-table |
| Least | M (22) | 82-88 (85.5) | 35-40 (38.2) | 16-19 (17.2) | 16.5-19 (17.7) | 15-17 (16.0) | [Ridgway 1919, p. 295] |
| Least | F (16) | 83-91 (86.5) | 34-41 (37.1) | 17.5-20 (18.7) | 16-19 (18.1) | 15.5-17 (16.4) | [Ridgway 1919, p. 295] |
| Least | pooled (38) | 85.9 | 37.7 | 17.8 | 17.9 | 16.2 | computed |
| Least | Pacific-side US M (10, migrants), means | 85.9 | 38.2 | 16.9 | 17.8 | 16.2 | [Ridgway 1919, p. 295] sub-table |
| Least | California F (6, migrants), means | 88.2 | 38.5 | 18.5 | 18.4 | 16.5 | [Ridgway 1919, p. 295] sub-table |

OCR figures were checked against the page scans: the Killdeer western-female culmen reads 21.2, and the Least female tail reads 37.1.

Internal inconsistencies:
- **Killdeer females:** the summary line says 14 specimens, and the sub-table has 3 eastern and 11 western females (14). The sub-table means do not reproduce the summary: they give wing 163.8 against 160.1, tail 98.4 against 94.9, and culmen 21.0 against 20.4 (computed).
- **Least:** the footnotes say 22 males and 16 females, but the sub-table rows add up to 21 and 17.

Neither affects the recommended values by more than about 1 mm. The western-US Killdeers run about 1-2% larger than the pooled means.

The Least's females are longer-billed (18.7 against 17.2 mm). AAB says the same: "Females have longer bills than males and feed on larger items buried deeper in the mud" [AAB-L-LH].

Genus statements that set proportions:
- **Oxyechus** (Killdeer) [Ridgway 1919, pp. 98-99]:
  - Wing and tail: "tail much more than half as long as wing, graduated". The longest primary exceeds "distal secondaries by more than half the length of folded wing, and extending slightly beyond tips of longest tertials".
  - Bill: "Bill slender, much shorter than head, the exposed culmen about as long as middle toe without claw or slightly shorter; nasal groove extending about two-thirds the length of maxilla; terminal third (approximately) of culmen distinctly convex, the gonys slightly convex".
  - Legs: "Tarsus slender, more than one-fifth as long as wing"; "hallux absent"; "bare portion of tibia decidedly shorter than culmen".
- **Pisobia** (Least) [Ridgway 1919, p. 267]:
  - Bill: "Bill straight, little if any longer than head (sometimes shorter), the exposed culmen never longer (usually shorter) than tarsus, tapering distally in lateral profile ... nasal groove broad ... extending nearly to base of the faintly decurved tip of maxilla ... nostril sub-basal, small, linear".
  - Wing: the longest primary exceeds the distal secondaries "by half the length of wing or slightly more". In the small species (*P. minutilla* included) the tertials "have more or less broadly rounded tips, and are relatively longer, extending much more nearly to tips of the longest primaries than in the larger species" (footnote c).
  - Tail: "more than two-fifths as long as wing, nearly truncate but inclining to slightly rounded or slightly emarginate ..., the middle pair of rectrices contracted terminally ... and projecting, more or less, beyond the rest".
  - Tibia: "bare portion of tibia about as long as first two phalanges of middle toe, or a little shorter".
- **Least key** [Ridgway 1919, p. 269]: "Middle toe, with claw, longer than tarsus, decidedly longer than exposed culmen, the latter more than one-fifth as long as wing."

### 2.2 USGS Alaska Science Center (live adults)

Dataset [USGS 2023]. I computed the statistics below from `adultShorebird_morphologicalMeasurements_values.csv`, excluding recaptures. The definitions are those used in the yellowlegs research (total head is "tip of culmen to back of the shorebird's head"; the wing is flattened).

- **Killdeer is not in the dataset.** Its taxonomy file lists 35 species, and the only *Charadrius* are Semipalmated Plover and Lesser Sand-Plover.
- **Least Sandpiper, n=22.** All are after-hatch-year birds from Southcentral Alaska and Lake Clark NP, May-July 1997-2011. Sex is unknown for 20.

| Measure | Least Sandpiper, n=20-22 | Semipalmated Plover (plover proxy), AHY n=11 |
|---|---|---|
| Mass (g) | 23.3 +/- 3.6 (17.8-30.5) | 48.1 +/- 4.4 (40.2-55.5) |
| Wing, flattened | 90.3 +/- 2.7 (85-96) | 124.1 +/- 3.2 (117-128) |
| Diagonal tarsus | 19.4 +/- 0.7 (17.4-20.7) | 24.2 +/- 1.2 (22.8-26.5) |
| Exposed culmen | 18.2 +/- 1.3 (16.7-21.2) | 12.5 +/- 0.7 (11.2-13.5) |
| Total head | 38.0 +/- 1.3 (36.5-41.2) | 37.8 +/- 0.7 (37.1-39.0) |
| Head = total head - culmen | 19.8 +/- 0.5 (19.0-20.7) | 25.3 +/- 0.6 (24.3-26.3) |
| Culmen / head | **0.92 +/- 0.07 (0.83-1.06)** | **0.50 +/- 0.04 (0.43-0.55)** |
| Culmen / total head | 0.48 | 0.33 |
| Culmen / diagonal tarsus | 0.94 | 0.52 |

All values are computed. The sample is small (n=22) and consists of breeding-season adults. Live flattened wing and diagonal tarsus run 5% and 9% above Ridgway's skins, as they did for the yellowlegs.

### 2.3 AVONET (museum skins, NHMUK; small n)

These values come from [Tobias et al. 2022], Supplementary dataset 1 (sheets `AVONET1_BirdLife` and `AVONET_Raw_Data`), with the raw rows checked.

"Beak length culmen" in AVONET runs from the tip to the base of the skull, so it is longer than the exposed culmen. Width and depth are taken at the nostril.

| Measure | Killdeer (n=4: 2 M, 2 F, all USA) | Least (n=5: 3 M, 2 F; Peru, Ecuador) |
|---|---|---|
| Beak, tip to skull | 21.5 (20.7-22.5) | 20.3 (19.4-21.3) |
| Beak, nostril to tip | 13.1 (12.0-14.5) | 15.1 (14.5-15.9) |
| **Beak width at nostril** | **3.5 (3.3-3.8)** | **2.4 (2.0-2.8)** |
| **Beak depth at nostril** | **4.2 (3.7-4.5)** | **3.2 (2.9-3.5)** |
| Tarsus | 34.4 (33.0-36.5) | 18.4 (17.1-20.0) |
| Wing | 158.8 (153-165) | 86.4 (82-91) |
| **Kipp's distance** | **83.5 (80-86)** | **32.1 (29.4-36.6), n=4** |
| First secondary | 75.2 | 53.1 |
| Hand-wing index | 52.6 | 37.7 |
| **Tail** | **85.8 (82-90)** | **39.2 (37-41)** |
| Mass (Dunning 2008, via AVONET; not read) | 96.4 g | 22.9 g |

Where these disagree with Ridgway:
- **Killdeer tail:** AVONET gives 86 mm (n=4) against Ridgway's 95 mm (n=32, range 88-103). The difference is 10%. For the yellowlegs and the Least, AVONET's tails ran 2-4% *longer* than Ridgway's, so this is unexplained. The four skins may be worn.
- **Least Kipp's distance:** AVONET's 32 mm is 37% of the wing. Ridgway's genus text implies about half the wing. The two measures are not the same: AVONET measures to the first secondary, while Ridgway refers to the "distal secondaries". This does not affect the folded-wing model.

### 2.4 Head length and total head

**Least Sandpiper:** measured by [USGS 2023]. Total head 38.0 mm, head 19.8 mm, culmen / head 0.92 (n=22). No other source I found gives a head measurement.

**Killdeer: no source I could read gives head length or total head.** It is absent from USGS. AVONET measures the bill to the skull, not the head. BOTW's measurements table is paywalled. So the design's "clearly below 1" rests on the following:
- **Ridgway, qualitative:** "Bill slender, much shorter than head" [Ridgway 1919, p. 98].
- **One skull:** the bony skull, including the bony bill, is 48 mm long, and the cranium alone is 24 mm [Skullsite]. This is a single specimen of unknown sex and origin.
  - The one calibration I could make: the Black-bellied Plover skull on the same site is 68 mm, against a USGS total head of 69.0 mm (n=10). So total head ≈ skull + 1 mm (computed).
  - That gives a Killdeer total head of about 49 mm and a head of 49 - 20.3 ≈ 29 mm. Culmen / head ≈ **0.70** (computed; n=1).
- **Allometry:** across nine USGS species, head (total head minus culmen) divided by mass^(1/3) is remarkably constant (computed from [USGS 2023]):

  | Species | Head (mm) | Mass (g) | Head / mass^(1/3) |
  |---|---|---|---|
  | Black-bellied Plover | 40.0 | 226 | 6.57 |
  | American Golden-Plover | 34.8 | 141 | 6.70 |
  | Semipalmated Plover | 25.3 | 48 | 6.95 |
  | Dunlin | 24.9 | 55 | 6.54 |
  | Least Sandpiper | 19.8 | 23 | 6.92 |
  | Western Sandpiper | 21.4 | 29 | 7.00 |
  | Semipalmated Sandpiper | 21.0 | 27 | 7.03 |
  | Lesser Yellowlegs | 30.5 | 84 | 6.96 |
  | Greater Yellowlegs | 37.7 | 170 | 6.80 |

  The three plovers average 6.74. At 95 g (AVONET's 96 g; fall birds in Illinois 89-93 g [Smith et al. 2012]), a Killdeer head comes out at **30-32 mm**, and culmen / head at **0.64-0.68** (computed; an estimate by analogy).

- **Photos (feathered outline):** on the two reference photos, total head measured along the bill axis to the rearmost feathered point is 56-58 mm, and head is 35-38 mm, giving culmen / head of **0.54-0.57** (photo-measured; section 2.6).

**Why the photo ratios are lower (my inference).** Calipers compress the nape and crown feathers; a traced outline does not.
- On the Least, the same photo method gives 0.69 (adult photo) and 0.80 (juvenile photo), against the USGS 0.92.
- The feathered outline lowers the ratio by roughly 15-25% in both species.
- The previous round's advice stands: trace the occiput station at the skull-equivalent surface (a thin feather layer), and the model will reproduce the USGS-style ratios.

### 2.5 Length, mass, and derived proportions

| Quantity | Killdeer | Least | Source / note |
|---|---|---|---|
| Length | 20-28 cm | 13-15 cm | [AAB-K; AAB-L] |
| Weight | 75-128 g | 19-30 g | [AAB-K; AAB-L] |
| Wingspan | 46-48 cm | 27-28 cm | [AAB-K; AAB-L] |
| Mass, fall migrants (size-corrected) | 88.6-92.5 g (n≈35/yr) | 27.0-28.4 g (fat migrants) | [Smith et al. 2012], Illinois, July-August |
| Relative size | "Similar in size to American Robin, but with longer legs and wings" | "Tiny (our smallest shorebird)" | [AAB-K; AAB-L] |

**Length caution.** Published total lengths are specimen lengths, taken with the neck stretched. The model's `length` is the straight line from bill tip to tail tip at the rest pose. Section 2.6 gives the photo-measured living values, which are shorter, especially for the hunched Least.

**Proportions** (computed from Ridgway's pooled means):

| Ratio | Killdeer | Least | Source statement |
|---|---|---|---|
| Culmen / tarsus | 0.58 | 1.00 (USGS 0.94) | Pisobia: culmen "never longer (usually shorter) than tarsus" |
| Culmen / middle toe | 0.94 | 1.10 | Oxyechus: culmen "about as long as middle toe ... or slightly shorter" |
| Tail / wing | 0.60 (AVONET 0.54) | 0.44 (AVONET 0.45) | "much more than half"; "more than two-fifths" |
| Tarsus / wing | 0.218 | 0.208 | Oxyechus: "more than one-fifth" |
| Culmen / wing | 0.127 | 0.208 | Least key: "more than one-fifth" |

Scale factors, Killdeer / Least (computed from Ridgway):

| Measure | Ratio |
|---|---|
| Wing | 1.86 |
| Tarsus | 1.95 |
| Tail | 2.53 |
| Middle toe | 1.33 |
| Culmen | **1.14** |
| Mass | 3.3-4.2 (Illinois fall birds; Dunning) |

### 2.6 Measured on the reference photos (photo-measured)

I scaled each photo by its exposed culmen chord, from the edge of the feathering on top of the bill to the tip, taking Ridgway's pooled culmen (Killdeer 20.3 mm, Least 17.8-18.2 mm). Photo coordinates are in each file's own pixels.

**Killdeer.**

| Measure | `killde-side.jpg` (Rhododendrites) | `killde-side-2.jpg` (Homler, 3840 px rendition) |
|---|---|---|
| Culmen endpoints | base (3147, 678), tip (3406, 836) | base (2445, 815), tip (≈2667, 916); the tip is caked with mud |
| Scale | 303 px, 14.9 px/mm, 0.067 mm/px | ≈245 px, 12.1 px/mm, 0.083 mm/px |
| Bill direction | 31° below horizontal (the head is tipped down) | 24° below horizontal |
| Tarsus, scale check | 34.8 and 38 mm for the two legs, against Ridgway's 34.9; foreshortening differs between legs | - |
| Bill tip to tail tip (straight) | 220 mm | 218 mm |
| Tail tip past longest primary | **15 mm** | **19 mm** |
| Visible eye (dark iris and pupil), diameter | 7.7 mm | 7.5 mm |
| Orange eyelid ring, outer diameter | 9.7 mm | 9.5 mm |
| Total head along the bill axis, feathered | 58 mm | 56 mm |
| Head (total head minus culmen) | 38 mm | 35 mm |
| Culmen / head | 0.54 | 0.57 |
| Side-view head, bill base to rear of head, horizontal | 40 mm | 37.5 mm |
| Eye / side-view head | 0.19 | 0.20 |

On `killde-side-2.jpg`, the breast front along the midline, from the throat down (photo-measured):
- white throat;
- upper black band ≈ 10 mm deep at the front, narrowing to ≈ 5 mm on the side of the neck as it wraps round the hindneck;
- white bar ≈ 5 mm;
- lower black band ≈ 13 mm deep at the front, tapering to the sides and ending at the bend of the wing;
- white below.

`killde-side.jpg` (neck stretched) gives about 11, 8, and 16 mm.

**Least Sandpiper.**

| Measure | Game photo `leasan.jpg` (adult, April) | `leasan-juv.jpg` (juvenile, 30 Aug) |
|---|---|---|
| Culmen endpoints | original 1500 px: base (990, 417), tip (1096, 503). Game's 800 px file: (528, 223) to (585, 268) | base (4192, 1532), tip (4762, 1912) |
| Scale | 137 px (7.6 px/mm) in the original; 73 px in the game file, 0.247 mm/px | 685 px, 38 px/mm, 0.026 mm/px |
| Bill tip to tail tip (straight) | 126 mm | 113 mm |
| Visible eye, diameter | 4.1 mm | 3.9 mm |
| Culmen / head, feathered outline to the nape junction | 0.69 | 0.80 |
| Bill droop | 0.3 mm, centreline below the line of the bill base; the culmen outline sits 1.2 mm below its own base line because the bill tapers | 0.45 mm, centreline; the bend is in the distal ~40% |
| Wingtip against tail | tail and primary tips cannot be separated at this resolution | primary tips end ≈ 1 mm short of the tail tip; the longest tertials end 1-3 mm short of the primary tips |
| Bare tibia | - | 8.6 mm |
| Tarsus | 15-17 mm (legs angled; mud) | ≈15 mm (the leg is angled back, so it is foreshortened) |

These are single photos, so treat each value as +/- 10%.
- The Least tarsi measure 10-15% short of Ridgway, which suggests foreshortening or a slightly short juvenile bill. Section 11 discusses juvenile bill length.
- The Least straight-line lengths (113-126 mm) are well under AAB's 13-15 cm, because the bird is hunched.

---

## 3. Late-September plumage and age in the Willamette Valley

### 3.1 Least Sandpiper

**What the sources say.**
- Timing and moult:
  - Juveniles "arrive here [New England] in August and generally do not show much signs of molting before they leave here in September" [Bent 1927, p. 205].
  - "The complete postnuptial molt of adults begins in August and is mainly accomplished after the birds have migrated" [Bent 1927, p. 205].
  - Adults in fall "often show conspicuous gaps in the flight feathers caused by molt" [Cox 2008].
- Washington:
  - "Southbound birds begin to arrive in the latter half of June, becoming more common in July. They are usually common until September, when numbers begin to drop off" [BirdWeb-L].
  - "Pacific coast adult Least Sandpipers can arrive in Washington in late June with juveniles peaking in August and September" [Eastside Audubon 2019]. This is secondary and cites BOTW.
- Northern Ohio: first adults late June; "The first juveniles arrive in the latter part of July. The species is very common from late July through September, with good opportunities to compare the plumages of adults and juveniles" [Kaufman/BSBO]. That is a mixed-age passage in the interior East.
- Oregon specimen dates: the latest fall departure dates listed are "Portland, September 7, Netarts Bay, September 11, and Tillamook, September 15" [Bent 1927, p. 213].
- Willamette Valley detectability [WVBT 2009]: regularly in spring and fall, occasionally in summer and winter. So a few birds winter.
- Month totals, iNaturalist research-grade records in the same Willamette Valley box as the yellowlegs query [iNat query 2026]:

  | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
  |---|---|---|---|---|---|---|---|---|---|---|---|
  | 7 | 4 | 9 | 84 | 46 | 3 | 120 | 182 | 51 | 16 | 4 | 0 |

  Passage peaks in August, and numbers are falling by late September. Life-stage annotations are nearly absent: 1 "adult" and 0 "juvenile" in September.

**My ageing of iNaturalist photos** (listed in the appendix).

I downloaded the first photo of every Willamette-box record from 11 September to 12 October (26 records, 2016-2026) and aged them by eye. The criteria come from [Ridgway 1919, p. 295; Bent 1927, p. 205]:
- **Juvenile:** fresh, uniformly neat rufous and buff fringes on the scapulars and coverts; white tips on some scapulars; a buffy, faintly streaked breast.
- **Adult in late summer:** worn, dark-centred feathers with frayed fringes, a heavily streaked breast, and possibly moult.

Results:
- **17 records: fresh juveniles.** Three of the 17 are only "probable" because the bird is distant or blurred.
- **4 records: greyer, basic-looking backs with juvenile-type buff-fringed coverts.** All four are dated 6-11 October. They are most likely juveniles starting their partial post-juvenile moult [Bent 1927, p. 205], but I cannot exclude adults in basic plumage.
- **5 records: not ageable.** Two are distant, one is in flight, one shows no bird, and one has black legs, so the identification is doubtful.
- **No record looked like a worn or moulting adult.**
- Between **15 September and 5 October**, all **13 of 13** ageable records are juveniles.

For contrast, a random sample of 9 records from 1-25 July showed 8 worn breeding adults and 1 bird too distant to age.

This is a small, photographer-biased sample: fresh juveniles are photogenic, and some records are of the same flock. It agrees with every written source.

### 3.2 Killdeer

- **Resident and breeding.**
  - Willamette Valley: breeds; "regularly" detected in spring, summer, and fall and "very regularly" in winter [WVBT 2009].
  - Puget Trough: "C" (common) in all months [BirdWeb-K].
  - A pair may raise two broods [BirdWeb-K]; AAB gives 1-3 broods [AAB-K-LH].
  - So late-September birds are local adults and their young of the year, plus migrants.
- **Juveniles look like adults and are double-banded.**
  - "Adults and juveniles look the same year round, but young, downy chicks have a single breast band" [BirdWeb-K].
  - "Downy juveniles have a single breast band" [AAB-K]. The single band belongs to the downy chick.
  - Ridgway: "Young.—Similar to adults, but feathers of upper parts more or less distinctly margined with rusty, ochraceous, or buffy" [Ridgway 1919, p. 99].
  - Bent: "The juvenal plumage is similar to that of the adult, but the head markings are less distinct; the feathers of the nape are tipped with 'amber brown' and those of the back, scapulars, wing coverts and tertials are more or less broadly tipped or edged with the same ...; the intermediate white band on the breast is always more or less suffused with brownish" [Bent 1929, p. 209].
- **The juvenal look lasts through autumn.** "The post juvenal molt is apparently very limited and the first winter plumage is largely the juvenal plumage modified by wear" [Bent 1929, p. 209].
- **Adults are moulting in September.** "Adults have a complete postnuptial molt, mainly in August and September ... Nuptial and winter plumages are practically alike" [Bent 1929, p. 209]. A late-September adult looks like a spring adult, perhaps with worn or missing flight feathers.
- **No age ratio found.** iNaturalist annotations are too sparse (3 "adult", 0 "juvenile" in September). The September Killdeer photos I sampled were mostly phone pictures too small to age.

### 3.3 Recommendation

- **Least Sandpiper: model a juvenile.** In late September the Willamette passage is mostly or entirely juveniles.
  - The sources put adult passage in late June to August.
  - Adults moult after migrating, so any late adult would look worn or grey rather than bright.
  - My sample of 13 ageable birds from 15 September to 5 October are all juveniles.
- **Killdeer: model an adult.** Adults and juveniles share every mark the player uses: two bands, collar, face, and rump. Adults are presumably the majority of a resident population in autumn, though no ratio was found.
  - If the game later wants an optional juvenile variant, it needs only three changes:
    - amber-brown fringes on the nape, back, scapulars, coverts, and tertials;
    - a brownish wash over the white bar between the bands;
    - slightly softer head markings [Bent 1929, p. 209].
  - At 20 m, these are the least visible changes on the bird.

---

## 4. Field marks of the recommended plumages

These are colour words from the sources; I have not invented hex values. "(photo)" marks my observation on the cited reference photo.

### 4.1 Killdeer, adult (sexes alike)

The main description is [Ridgway 1919, p. 99] unless noted.
- **Upperparts:** the "general color of upper parts, including auricular region, grayish brown". AAB calls it "Brownish-tan on top" [AAB-K].
- **Head pattern, front to back:**
  - "a narrow stripe across lores (from bill to eye and including anterior edge of forehead)" is black. So a thin black line runs across the base of the bill and back to the eye (photo: it runs from the gape to the front of the eye).
  - The forehead is white.
  - The "fore part of crown" is black: a black bar across the forecrown, from above one eye to the other (photo).
  - The crown behind it is grey-brown.
  - The "supra-auricular area" is white: a white stripe from above and behind the eye back toward the nape (photo).
  - Ridgway also lists "a postocular streak also black". On both photos the black under the white stripe is only a narrow dark edge between it and the brown auriculars.
  - The auriculars (cheek) are grey-brown.
- **Eye:** "iris dark brown; eyelids orange-red or scarlet". This is the red-orange orbital ring. On the photos it is ≈ 1 mm wide and orange-red (photo).
- **Throat and collar:** "chin, throat, collar round hindneck and under parts immaculate white".
- **Bands:** the white underparts are "interrupted by a black collar completely encircling the lower neck and a broader black band across chest".
  - The upper band is a full ring. It runs round the hindneck just below the white collar and is narrower at the back (photo: ≈ 5 mm at the side, ≈ 10 mm at the front).
  - The lower band crosses the chest only. It is broader (≈ 13-16 mm at the front) and ends at the sides, under the bend of the wing (photo).
  - A white bar ≈ 5-8 mm deep separates the two bands (photo; section 2.6).
  - AAB: "The white chest is barred with two black bands, and the brown face is marked with black and white patches" [AAB-K].
- **Rump and tail:**
  - "rump and upper tail-coverts ochraceous, the latter paler, more buffy". AAB: "The bright orange-buff rump is conspicuous in flight" [AAB-K]. Bent: "long tail with buff-colored upper coverts and rump" [Bent 1929, p. 212].
  - Central rectrices: "middle rectrices grayish brown, darker subterminally and ochraceous at tip".
  - The rest of the tail: "otherwise mostly light ochraceous or ochraceous-buff, fading into white on lateral rectrices, broadly tipped with white and with a subterminal bar of black".
  - In short: an orange-rufous rump and base of tail, a black subterminal band, and white tips, whitest on the outer feathers.
- **Folded wing:** grey-brown coverts and tertials. The primaries are "blackish" and project as dark tips (photo). "Greater wing-coverts broadly tipped with white".
- **Spread wing:**
  - distal secondaries dusky with a white base and tip, the innermost wholly white;
  - proximal primaries with white on the outer webs.
  - This forms the "conspicuous white wing stripes" of BirdWeb [BirdWeb-K].
- **Bill:** "bill black" [Ridgway]; "short thin black bill" [the game's existing `marks`].
- **Legs:** "legs and feet pale pinkish gray to grayish yellow (in life)" [Ridgway]; "long straw-colored legs" [Bent 1929, p. 212]. On both photos they are pale pinkish flesh-tan (photo).

### 4.2 Least Sandpiper, juvenile

Ridgway describes the young against the summer adult: "Similar to summer adults but many of the scapulars and interscapulars margined terminally with white (these feathers without transverse markings), wing-coverts margined with buffy, and chest decidedly buffy and very indistinctly streaked" [Ridgway 1919, p. 295].

Bent: "darker and more richly colored above than in the spring adult; the feathers of the crown, back, scapulars and all wing coverts are broadly edged with rich, bright browns, 'hazel' or 'cinnamon rufous,' broadest and brightest on the back and scapulars; some scapulars are tipped with white; the throat is often faintly, but sometimes not at all, streaked with dusky" [Bent 1927, p. 205].

- **Mantle and scapulars:**
  - Blackish centres, from the summer-adult base: "scapulars and interscapulars blackish" [Ridgway 1919, p. 294].
  - Broad bright rufous edges ("hazel", "cinnamon rufous") [Bent 1927, p. 205].
  - White terminal tips on many of the upper scapulars and mantle feathers [Ridgway 1919, p. 295; Bent 1927, p. 205]. These line up into pale lines along each side of the mantle (photo, `leasan-juv.jpg`).
  - No cross-bars [Ridgway 1919, p. 295].
- **Wing coverts and tertials:**
  - Coverts are "margined with buffy" [Ridgway 1919, p. 295] or "broadly edged with rich, bright browns" [Bent 1927, p. 205].
  - On the photo, the coverts have dark centres with rufous-buff edges, slightly narrower and paler than the scapular edges. The long tertials are dark with rufous edges.
- **Crown:** feathers "broadly edged with rich, bright browns" [Bent 1927, p. 205] over the adult's "pileum ... broadly streaked with blackish" [Ridgway 1919, p. 294]. It reads as a rufous-streaked dark cap (photo).
- **Face:**
  - "a broad superciliary stripe of dull grayish whitish, distinct and nearly immaculate for anterior half, indistinctly and narrowly streaked with dusky for posterior (supra-auricular) portion".
  - "loral and auricular regions pale grayish brown, the former minutely flecked the latter narrowly streaked with dusky" [Ridgway 1919, p. 294, summer adult].
  - On the juvenile photo: a pale greyish-white supercilium, brightest in front of and just over the eye; a dark loral line from bill to eye; grey-brown cheeks.
- **Breast band:**
  - "chest decidedly buffy and very indistinctly streaked" [Ridgway 1919, p. 295].
  - AAB (nonbreeding, for comparison): "a smudgy brown breast" [AAB-L].
  - "The brown breast of the Least Sandpiper is a good field mark" [Eastside Audubon 2019].
  - Bent: the "darker streakings and wash of the breast help to distinguish the least from the lighter and grayer semipalmated" [Bent 1927, p. 208].
  - On the juvenile photo: a warm buff wash with fine blurred dusky streaks, heaviest at the sides of the breast. It covers the foreneck and breast and ends fairly abruptly against the white belly about level with the bend of the wing. The edge looks clean at normal viewing size.
  - Bent also notes that in juvenal Least the plumage "in front of the bend of the wing" is "light" [Bent 1927, p. 208]. The breast side there is not dark.
- **Underparts:** "rest of under parts immaculate white" [Ridgway 1919, p. 295].
- **Rump and tail** (for flight):
  - "rump and median upper tail-coverts (broadly) plain sooty black; lateral upper tail-coverts white" [Ridgway 1919, p. 294].
  - "whitish rumps bisected by a longitudinal black line" [AAB-L].
  - Central rectrices dusky; outer ones light greyish brown. On the juvenile the central rectrices have buff-rufous fringes (photo).
- **Bill:** "bill blackish" [Ridgway 1919, p. 295]; "Their bills are black" [AAB-L].
- **Iris:** "iris brown" [Ridgway 1919, p. 295].
- **Legs:**
  - Juvenile: "In the juvenal, there is more of a greenish tinge, and I have put the tarsi down as oil yellow, the toes shading into yellowish oil green" [Bent 1927, pp. 207-208].
  - Adult: "distinctly yellow with a faint greenish cast ... sulphine yellow ..., while the toes ... are citrine" [Bent 1927, p. 207].
  - AAB: "legs are yellowish-green (this can be obscured by mud at times)" [AAB-L].
  - Ridgway's skins: "legs and feet blackish (more or less olivaceous in life)" [Ridgway 1919, p. 295].
  - On the juvenile photo the legs are olive-yellow.
- **Overall:** "Juveniles have crisp plumage that is rustier than that of adults" [AAB-L]. BirdWeb: juveniles "may be brighter rufous than adults, especially in comparison to the faded fall breeding plumage of the adults" [BirdWeb-L].

**Corrections to the design spec's Least marks:**
- The breast band is buffy with *very indistinct*, fine blurred streaks, not crisp fine streaks.
- The white tips on the scapulars are what make the "pale lines along the mantle".

Everything else in the spec's list is supported. The existing guide `marks` for both species are supported and need no correction.

---

## 5. Structure

### 5.1 Killdeer

- **Head and eye.**
  - "the characteristic large, round head, large eye, and short bill of all plovers. They are especially slender and lanky, with a long, pointed tail and long wings" [AAB-K].
  - Plovers' "large eyes, set well to the sides of the head" [Pienkowski 1980, p. 85].
  - On the photos, the visible eye is 7.5-7.7 mm across: 0.37 of the culmen and about 0.2 of the side-view head. The orange eyelid ring is 9.5-9.7 mm outside (photo-measured, section 2.6).
  - For comparison, the Greater Yellowlegs model's eye is 5.4 mm across, 0.1 of its culmen (from `greyel.ts`).
- **Bill.**
  - Straight and short: "much shorter than head".
  - The "terminal third (approximately) of culmen distinctly convex, the gonys slightly convex" [Ridgway 1919, p. 98]. This is a plover bill, slightly swollen and blunt at the tip. The axis is straight, and only the upper outline arches over the last third.
  - The nostril is at the very base (photo), and the nasal groove runs about two-thirds of the maxilla [Ridgway 1919, p. 98].
  - Model: `curve` 0. The tip is blunter than the Least's (a smaller `taper`).
- **Bill against head.** Section 2.4 has the numbers.
- **Tail and wingtip.**
  - "Tail much more than half as long as wing" [Ridgway 1919, p. 98]: 95/160 = 0.60 (computed); AVONET gives 0.54.
  - Direct statements: AAB's "long, pointed tail" [AAB-K] and Bent's "long tail" [Bent 1929, p. 212]. I found no primary source that gives a number for the projection.
  - Photo-measured: the tail tip reaches **15 mm and 19 mm past the tip of the longest primary** on the two photos.
  - Computed from measurements (low confidence): the tail-past-wingtip distance is (wrist-to-tail-base distance) + (tail) − (wing chord × cos(wing droop)). No source gives the wrist-to-tail-base distance.
    - In the traced Greater Yellowlegs model it is 0.50 of the wing chord (from `greyel.ts`: wrist x 0.0496, tail base x −0.0442, chord 0.188).
    - Assuming the same fraction and a 12° droop: 80 + 95 − 156.5 ≈ **+18 mm**, which agrees with the photos.
    - With AVONET's 86 mm tail it would be ≈ +9 mm.
- **Tail shape.**
  - "graduated for more than one-sixth its length, the rectrices becoming slightly narrower distally, but with rounded tips" [Ridgway 1919, pp. 98-99]. So the outer rectrices are at least 16 mm shorter than the central pair, on a 95 mm tail.
  - In `tail.ts`, `wedge` makes the centre 0.15 of the tail length longer than the edges, and `rounded` makes it 0.08. **Use `wedge`**: it is the closer fit to "more than one-sixth" and to AAB's "pointed".
- **Wing.**
  - The longest primary exceeds the distal secondaries "by more than half the length of folded wing": AVONET's Kipp's distance is 83.5 of 159 = 53%.
  - The primary also extends "slightly beyond tips of longest tertials" [Ridgway 1919, p. 98].
  - On `killde-side.jpg` the longest visible tertial ends ≈ 20 mm short of the primary tips. That is more than "slightly", so a long tertial may be hidden. Trace what the photo shows.
- **Legs.** Long and pale, with no hind toe ("hallux absent") [Ridgway 1919, p. 99]. The bare tibia is "decidedly shorter than culmen", so under about 19 mm. On `killde-side.jpg` it measures 18-23 mm, but the feather edge on the belly is soft (photo-measured). Low confidence.

### 5.2 Least Sandpiper

- **Bill.**
  - Sources:
    - "thin-tipped, slightly decurved bills" [AAB-L].
    - "a thin slightly curved bill"; "thin, slightly drooped bill" [AAB-L photo captions].
    - "relatively short and fine-tipped, with a slight droop at the end" [BirdWeb-L].
    - "short bills that taper to a fine point" [Cox 2008].
    - "tapering distally in lateral profile ... the faintly decurved tip of maxilla" [Ridgway 1919, p. 267].
    - "the bill of the least sandpiper is slightly decurved, while that of the semipalmated is straight and stouter" [Bent 1927, p. 208].
  - How much: on two photos the tip lies **0.3 mm and 0.45 mm** below the line of the bill's base, measured on the centreline (photo-measured, section 2.6). The curvature is concentrated in the distal ~40% of the bill. That is only about 2-3% of the bill length.
  - The visible "droop" is mostly the upper outline curving down toward a fine tip as the bill tapers: 1.2 mm below its base line on the adult photo.
  - Model: a small negative `curve` acting on the distal half, with a fine `taper`.
- **Primary projection.**
  - "Primary extension is short in Least Sandpiper, with no extension past the tertials" [Cox 2008].
  - Ridgway's long, round-tipped tertials [Ridgway 1919, p. 267, footnote c].
  - On the juvenile photo, the primary tips end ≈ 1 mm short of the tail tip, and the longest tertials 1-3 mm short of the primary tips (photo-measured).
  - The same computation as for the Killdeer gives 43 + 38 − 84 ≈ −3 mm, i.e. the wingtip 3 mm past the tail (low confidence).
  - Model: wingtips about even with the tail, within a few mm.
- **Posture while feeding.**
  - "They typically feed from a crouched position, often almost brushing the ground with their breasts. Their 'knees' (the tibia-tarsus joint) are often bent sharply as they delicately pick food from the surface. Their feet can be planted so far forward that they appear to feed between their toes" [Cox 2008].
  - The Least crouches down "to pick up something that is right by his or her feet", unlike the "standard peeps" that bend and reach forward [Cox 2008].
  - The crouch "causes Least to take shorter, shuffling steps" [Cox 2008].
  - "walk with a hunched posture" [AAB-L-O]; "Tends to have a more crouched posture when foraging" [AAB-L caption].
  - "When foraging, they walk slowly with their heads down, picking at food on the surface rather than probing into the mud" [BirdWeb-L].
  - Both reference photos show a near-horizontal back, short neck, and bent knees.
- **Head and eye.** "small, rounded heads ... Their large, round eyes dominate the face and give the bird a wide-eyed appearance" [Cox 2008]. The visible eye is 3.9-4.1 mm across, 0.22 of the culmen (photo-measured).
- **Legs.** "The leg bones and joints are noticeably finer than those of other peeps" [Cox 2008]. The bare tibia is about as long as the first two phalanges of the middle toe [Ridgway 1919, p. 267]. With a 16 mm toe that is ≈ 9 mm (estimate); the juvenile photo gives 8.6 mm.
- **Tail.** "nearly truncate ... the middle pair of rectrices ... projecting, more or less, beyond the rest" [Ridgway 1919, p. 267]. **Use `square`**; use `rounded` if the slightly projecting centre should show in flight. The tail's own length is 38 mm [Ridgway 1919, p. 295].

---

## 6. Foraging

### 6.1 Killdeer (plover style)

**What the sources say about Killdeer.**
- "the killdeer has the usual plover habits when feeding of alternately running and then of standing still, as if to listen or look, always with head up, and of dabbing suddenly at the ground for its food. Like some other species of plover, it occasionally bobs or 'teeters' in a nervous manner. This varies from a slight bob of the head, which is first hitched up and then brought down, to a bob combined with a tilting up and down of the whole body on the hips. In swift running they excel" [Bent 1929, p. 210].
- "When they get out on bare ground their speed is really astonishing. I have had them run along the road ahead of my horse for quite a distance" (M. P. Skinner, in [Bent 1929, p. 211]).
- "In plover fashion and unlike sandpipers, the killdeer in feeding does not keep in a compact flock but spreads out irregularly" [Bent 1929, p. 211].
- Wintering pairs "might separate two or three hundred feet while feeding" (Skinner, in [Bent 1929, p. 213]).
- AAB:
  - "walking along the ground or running ahead a few steps, stopping to look around, and running on again" [AAB-K].
  - "run across the ground in spurts, stopping with a jolt every so often" [AAB-K-O].
  - "Both adults and juveniles habitually pause while walking to bob their heads up and back down" [AAB-K caption].
- "Killdeers have a 'running-stopping-bobbing' gait, and sometimes foot stir, vibrating the ground with a foot to stimulate movement from prey"; "individuals spread out while foraging" [BirdWeb-K].
- [BOTW-K snippet]: Killdeer "run short distance, stop, bob head, and run again"; "A characteristic search behavior employed in more terrestrial environments is to run quickly, stop, wait, and then run again."
- **No source I could read gives Killdeer run distances, speeds, stop durations, or peck rates.** Two behaviour studies I found do not report run or stop bouts:
  - a time-budget study of breeding Killdeer (Animal Behaviour 1988, paywalled);
  - the Illinois diet study [Smith et al. 2012].
  - I found no CC video of a foraging Killdeer. The three Killdeer videos on Wikimedia Commons show courtship, nest-scraping, and nest sitting, not foraging.

**The quantitative basis: Pienkowski's plovers.** [Pienkowski 1980] timed Ringed Plovers (*Charadrius hiaticula*, a congener) and Grey Plovers on intertidal flats at Lindisfarne, from tape-recorded sequences and cine film.

Table 1 [Pienkowski 1980, p. 87] (mean +/- SE; 345 and 315 observation cases for durations, 184 and 98 for distances):

| | Ringed Plover | Grey Plover |
|---|---|---|
| Time in each "up" (standing, searching) | 1.95 +/- 0.12 s | 3.21 +/- 0.19 s |
| Time for each run to the next "up" | 0.70 +/- 0.03 s | 1.29 +/- 0.05 s |
| Distance of each run | 3.16 +/- 0.24 paces = 0.32 m | 4.74 +/- 0.25 paces = 0.66 m |
| "Downs" (crouched waits) per minute | 0.33 | 1.23 |
| Foot-trembling | 18% of observations | once |

Other values in the thesis:
- **Pace length:** 10 cm (Ringed) and 14 cm (Grey), from cine film and tracks. The "normal" maximum is 3-4 paces to take prey [Pienkowski 1980, pp. 139-140].
- **Giving-up time** (an "up" followed by a run to a new site without prey): 1.77-2.21 s (Ringed) and 3.25-3.92 s (Grey) [Pienkowski 1980, p. 128, Table 9].
- **Waiting time before moving to take prey:** 1.42-2.03 s (Ringed) and 2.78-2.90 s (Grey). The shortest waits were before large prey [Pienkowski 1980, p. 128].
- **Pecking rate** of Ringed Plovers: 16.6-25.8 pecks per minute (site means) [Pienkowski 1980, p. 143, Table 19]. At least 90% of pecks took prey [Pienkowski 1980, p. 91].
- **Spacing:** plovers fed "in loose flocks with individuals separated by about ½ m to over 50 m" [Pienkowski 1980, p. 85].

Values computed from Table 1:

| | Ringed Plover | Grey Plover |
|---|---|---|
| Mean run speed | 0.32 / 0.70 = **0.46 m/s** | 0.66 / 1.29 = **0.51 m/s** |
| Step rate in a run | 4.5 paces/s | 3.7 paces/s |
| Stop-and-run cycles per minute | 60 / (1.95 + 0.70) ≈ 23 | ≈ 13 |

The Ringed Plover's 17-26 pecks per minute against ≈ 23 cycles per minute implies that in good conditions most stops end in a peck. Handling time is not included, so this is an upper bound (computed).

For comparison, a Semipalmated Plover study reports "Foraging rates reached an asymptote of 25 pecks per minute" [Rose & Nol 2010 snippet].

**Scaling to the Killdeer (estimate).** The Killdeer is between the two in size: tarsus 35 mm against Ringed 25 and Grey 45 [Tobias et al. 2022]; mass 95 g against 64 g and 250 g. Interpolating Table 1 on tarsus length (computed, an estimate):

| Quantity | Interpolated Killdeer value |
|---|---|
| Pace | ≈ 12 cm |
| Paces per run | ≈ 4 |
| Run | ≈ 0.48 m in ≈ 1.0 s (≈ 0.5 m/s) |
| Stop | ≈ 2.6 s |

Interpolating on log mass instead gives a 0.42 m run and a 2.3 s stop.

Bent and Skinner's "swift running" and "astonishing" speed on bare ground describe chase and escape runs. "Running ahead of my horse" suggests at least 1.5 m/s, but that is my inference.

### 6.2 Least Sandpiper (sandpiper style)

**What the sources say.**
- **Walking speed:** "During active winter foraging, it moves about 10 cm/s (Baker and Baker 1973)"; it "walks slowly while feeding and tends to remain in a relatively small area compared to other calidridines" [BOTW-L snippet].
  - Baker & Baker (1973) measured locomotion rate (distance/time) and peck or probe rate for each of eight foraging methods, in six species including the Least Sandpiper and Semipalmated Plover. The paper is paywalled and I could not read its tables.
- **Gait:** "shorter, shuffling steps" [Cox 2008]; "walk slowly with their heads down" [BirdWeb-L].
- **Feeding method:**
  - "picking at food on the surface rather than probing into the mud" [BirdWeb-L].
  - "They peck at prey on the surface and probe damp mud for buried prey" [AAB-L-LH].
  - "Here they snap up insects or probe diligently for larvae in the mud and shallow water" [Bent 1927, p. 206].
- **Grouping:**
  - "In all these places they spread out in an irregular fashion when feeding" [Bent 1927, p. 206].
  - "Least Sandpipers rarely form large, tightly packed flocks. Instead, they usually spread themselves out along muddy edges" [Cox 2008].
  - "They often gather in loose flocks ... but they tend to be in smaller groups" [AAB-L].
- **Temperament:** "Leasts often seem quite nervous, frequently glancing around and freezing in place at any sudden noise" [Cox 2008]. Yet they are "so diligent ... that they appear to take no notice of man if he remain quiet, and they run about almost at his feet" [Bent 1927, p. 206].
- **No source I could read gives a Least peck rate, run speed, or flock spacing.**

**Related species.** Western Sandpipers grazing biofilm make "121 foraging actions min⁻¹" (2.0 per second) [Canham et al. 2023, citing Kuwae et al. 2008; the original not read].

**Video estimate (estimate, by eye).**
- Clip: [Danese 2023], 14 September 2023, a juvenile Least foraging in a shallow algal pool; CC BY-SA 4.0 on Wikimedia Commons. I stepped through the 480p rendition frame by frame (30 fps) for 13.0-15.0 s.
- In the first second the bird walked continuously with its head low, making about 4 steps and 4-5 bill dips to the surface.
- In the second second it made one surface pick, then stood with the bill vertical in the water for a held probe of ≈ 0.25 s, then stepped on.
- Overall: roughly **2-3 bill contacts per second** while walking, **about 3-4 steps per second**, and short on-the-spot probing bouts. This is one bird over 2 s, so treat it as a rough setting.
- At ≈ 3 cm per shuffling step, 3-4 steps per second is 0.09-0.12 m/s, consistent with Baker & Baker's 10 cm/s.
- The clip pans with the bird, so I could not measure its ground speed directly.
- Two more CC clips of Least Sandpipers by the same author exist on Commons (10 August and 1 September 2025). The 1 September clip shows a juvenile standing side-on and is not useful for foraging rates.

---

## 7. Tracing references

### 7.1 Killdeer

The game's `public/media/photos/killde.jpg` is three-quarter front with the head turned, so it cannot be traced. Two Wikimedia Commons candidates were downloaded to `C:\Users\kcsel\AppData\Local\Temp\claude\C--Users-kcsel-repo-lakewatch\05ff6fa2-0ef2-455a-ac43-ae49fb38fd8f\scratchpad\ref\`.

**1. `killde-side.jpg` (recommended)**
- File: "Killdeer (20453).jpg", by Rhododendrites, own work. **CC BY-SA 4.0** (https://creativecommons.org/licenses/by-sa/4.0).
- Taken 12 May 2024 at South Cape May Meadows, New Jersey. A Commons Featured Picture.
- Page: https://commons.wikimedia.org/wiki/File:Killdeer_(20453).jpg
- Original: https://upload.wikimedia.org/wikipedia/commons/a/ad/Killdeer_%2820453%29.jpg
- **4218x3163 px**, the full-resolution original, 8.45 MB.
- **What I checked:**
  - Adult, standing, clean side-on profile of body and head.
  - Bill fully visible and crisp: a few dried mud flecks, tip clean.
  - Both legs and feet visible on gravel, mid-stride.
  - Tail and primary tips separable.
  - The head is tipped down: the bill points 31° below horizontal.
- Scale: culmen 303 px, **0.067 mm/px** at a 20.3 mm culmen. The tarsi check to within 0-9%.
- Best for tracing the profile and legs.

**2. `killde-side-2.jpg`**
- File: "Killdeer Heislerville.png", by Charles Homler d/b/a FocusOnWildlife, own work. **CC BY-SA 4.0**.
- Taken 9 April 2023 at Heislerville WMA, Maurice River, New Jersey.
- Page: https://commons.wikimedia.org/wiki/File:Killdeer_Heislerville.png
- The original is a 5800x4143 16-bit PNG of 121 MB. I downloaded the Commons **3840x2743** rendition (https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cb/Killdeer_Heislerville.png/3840px-Killdeer_Heislerville.png) and saved it as JPEG.
- **What I checked:**
  - Adult, side-on, standing still and upright, legs together: a truer rest pose.
  - The **bill tip is caked with mud**, which makes the culmen endpoint ≈ 1 mm uncertain.
  - The feet are partly hidden among twigs.
- Scale: ≈ 245 px culmen, ≈ 0.083 mm/px.
- Best for the breast bands and head pattern at rest.

**Which is better:** `killde-side.jpg` for tracing. It has the cleaner bill for the culmen scale, higher resolution, and legs and feet fully visible. Use `killde-side-2.jpg` as a cross-check of the rest posture and band widths. The two photos agree on length (218-220 mm) and tail projection (15-19 mm).

Both are share-alike. They are used only as tracing references and are never shipped, as the design says. The `sources` line should credit the photographer and licence, as `greyel.ts` does.

### 7.2 Least Sandpiper

**The game's photo is an adult.** `public/media/photos/leasan.jpg`, credited in `data/birds.json` to "(c) Greg Lasley, CC BY-NC", is iNaturalist photo 230314. That photo belongs to observation 173719, taken **25 April 2008** at Hornsby Bend, Austin, Texas (iNaturalist API).

A late-April Least is at least ten months old and is on spring passage, so it cannot be a juvenile. The plumage agrees:
- **Breast:** fine, distinct dusky streaks right across the breast and up the neck, as in the summer adult ("narrowly ... streaked with dusky") [Ridgway 1919, p. 294]. A juvenile's chest is "decidedly buffy and very indistinctly streaked" [Ridgway 1919, p. 295]. "Adults in spring are more brightly colored ... and the breast is more distinctly streaked than in fall" [Bent 1927, p. 205].
- **Head and throat:** streaked.
- **Mantle:** no white-tipped mantle lines.
- **Legs:** bright yellow, the adult's "sulphine yellow" [Bent 1927, p. 207] rather than the juvenile's greener "oil yellow".
- **Upperparts:** the rufous-edged, black-centred scapulars and tertials are the adult's fresh spring feathers.

The photo is side-on, crouched, with the legs visible, so it can still serve for **tracing structure**. Its scale is 0.247 mm/px in the game's 800 px file (culmen 73 px). The 1500x1000 original is at https://inaturalist-open-data.s3.amazonaws.com/photos/230314/original.jpg.

**Juvenile reference: `leasan-juv.jpg`**
- File: "Least sandpiper (03342).jpg", by Rhododendrites, own work. **CC BY-SA 4.0**.
- Taken 30 August 2025 at Jamaica Bay Wildlife Refuge, Queens, New York. A Commons Featured Picture.
- Page: https://commons.wikimedia.org/wiki/File:Least_sandpiper_(03342).jpg
- Original: https://upload.wikimedia.org/wikipedia/commons/a/ae/Least_sandpiper_%2803342%29.jpg
- **5597x4001 px**, the full-resolution original, 14.4 MB.
- **What I checked:**
  - A clean side-on profile of body and head; bill fully visible.
  - Only the near leg is visible; the far leg is hidden behind it.
- **It is a juvenile:**
  - Every scapular, covert, and tertial is at the same fresh stage, with even, broad rufous-buff edges.
  - The upper scapulars have white tips.
  - The breast is buffy with only faint blurred streaks.
  - The central rectrices have rufous fringes.
  - The legs are olive-yellow.
- Scale: culmen 685 px, ≈ 0.026 mm/px.
- Use it for the plumage pattern, and as a second trace of the bill droop and the wingtip-to-tail relation.

A second possible juvenile source, not downloaded, is the video "20250901 least sandpiper wethersfield cove wm.webm" by Paul Danese (CC BY-SA 4.0). A frame from it shows a juvenile standing side-on.

---

## 8. Numbers for the model

These map to `detail.measurements`, in metres, plus the extra quantities the tests need.

| Field | Killdeer | Least | How chosen |
|---|---|---|---|
| `length` (bill tip to tail tip, rest pose) | **0.22 m** | **0.13 m** | See the length note below |
| `culmen` (exposed) | **0.020 m** | **0.018 m** | Ridgway pooled 20.3 (n=32) and 17.8 (n=38); USGS Least 18.2 (n=22). A juvenile Least's bill may be ≈ 0.5-1 mm shorter (section 11) |
| `billDepth` (at base) | **0.0044 m** | **0.0034 m** | AVONET depth at the nostril, 4.2 (3.7-4.5) and 3.2 (2.9-3.5), plus a small allowance for the base. Both nostrils are basal or sub-basal, so the base is only slightly deeper |
| `billWidth` (at base) | **0.0035 m** | **0.0025 m** | AVONET width at the nostril, 3.5 and 2.4 |
| `bill.curve` | **0** (straight; blunt, slightly convex tip) | **small negative**, acting on the distal ~40% | [Ridgway 1919, pp. 98, 267]; the Least tip droop is 0.3-0.5 mm (photo-measured) |
| `bill.taper` | blunter than the Least | fine point | "terminal third of culmen distinctly convex" against "taper to a fine point" [Ridgway; Cox 2008] |
| head (total head − culmen) | ≈ **0.030 m** (estimate) | **0.020 m** | USGS Least 19.8 (n=22); Killdeer estimated at 29-32 (section 2.4). Gives culmen / head ≈ 0.68 and 0.90 |
| `tarsus` | **0.035 m** | **0.0185 m** | Killdeer: Ridgway 34.9, AVONET 34.4. Least: midpoint of Ridgway 17.9 and USGS diagonal 19.4 (live tarsi run longer), rounded down; AVONET 18.4 |
| `tibia` (bare) | **0.017 m** | **0.009 m** | Killdeer: "decidedly shorter than culmen" [Ridgway 1919, p. 99]; the photo gives 18-23 mm with a soft feather edge. Least: "about as long as first two phalanges of middle toe" [Ridgway 1919, p. 267], ≈ 9 mm; the juvenile photo gives 8.6. Low confidence for both |
| `toe` (middle, no claw) | **0.0215 m** | **0.016 m** | Ridgway pooled 21.6 and 16.2 |
| `wingChord` | **0.160 m** | **0.086 m** | Ridgway unflattened chord 160.2 and 85.9. AVONET 158.8 and 86.4; USGS flattened Least 90.3 |
| `tail` | **0.095 m** | **0.038 m** | Ridgway 95.3 (n=32) and 37.7. AVONET's Killdeer 85.8 (n=4) is 10% shorter and unexplained. Use 0.090 as a compromise only if the traced tail will not fit |
| tail shape | **`wedge`** | **`square`** (`rounded` as the alternative) | Killdeer "graduated for more than one-sixth its length"; Least "nearly truncate", central pair projecting slightly |
| tail tip past wingtip | **+0.015 to +0.019 m** | about even (tail ≈ +0.001 m) | Photo-measured, section 2.6 |
| `eye.radius` (visible eye) | ≈ **0.0038 m** | ≈ **0.0020 m** | Photo-measured visible eye diameters 7.5-7.7 and 3.9-4.1 mm |
| orbital ring | orange-red, outer radius ≈ 0.0048 m, ≈ 1 mm wide | none distinct (a thin pale eyelid) | Ridgway "eyelids orange-red or scarlet"; photos |
| run `stepLength` (if used) | ≈ 0.12 m (estimate) | ≈ 0.03 m walking shuffle, ≈ 0.05 m running (estimate) | Killdeer interpolated from Pienkowski's 10 and 14 cm paces; Least from ≈ 3 steps/s at 10 cm/s |
| mass (if used) | 0.090-0.096 kg | 0.023-0.028 kg | Illinois fall birds and Dunning [Smith et al. 2012; Tobias et al. 2022]; USGS breeding Least 23.3 g |

**Length.**
- Killdeer: the two traced side views give 0.218-0.220 m when scaled by the culmen, inside AAB's 0.20-0.28 m. AAB's midpoint, 0.24 m, is a stretched-specimen length and would be 9% longer than the trace, which fails the 5% check in `species.test.ts`.
- Least: the game photo traces at 0.126 m and the juvenile photo at 0.113 m. AAB gives 0.13-0.15 m. Setting 0.13 m keeps the model inside AAB's lower bound and within 5% of a trace of the game photo.
- **If the traced profile comes out shorter, set `length` to the traced value.** The published totals assume a stretched neck (section 2.5).

**Colours** (source words; the painter picks the hex):

| Part | Killdeer, adult | Least, juvenile |
|---|---|---|
| Bill | black | blackish |
| Iris | dark brown | brown |
| Eyelid ring | orange-red or scarlet | - |
| Legs | pale pinkish grey to greyish yellow; "straw-colored"; pale flesh-tan on the photos | oil yellow tarsi, yellowish oil-green toes; yellowish-green (AAB) |
| Upperparts | greyish brown | blackish centres with bright rufous ("hazel", "cinnamon rufous") and buff edges; white scapular tips forming mantle lines |
| Underparts | white; black upper collar-band all round the neck; broader black chest band; white bar between | white belly; buffy breast band, very indistinctly streaked, ending cleanly at the belly |
| Head | white forehead, black forecrown bar, black loral line, white supra-auricular stripe, grey-brown crown and cheek, white collar round the hindneck | rufous-streaked dark cap; dull greyish-white supercilium, strongest in front; dark lores; grey-brown cheek |
| Rump and tail | ochraceous rump and uppertail coverts; tail ochraceous with a black subterminal bar and white tips, central pair grey-brown | sooty-black central rump and uppertail coverts with white sides; dusky central rectrices with rufous fringes |

---

## 9. Suggested test thresholds

All values are in mm. "Head" means total head minus exposed culmen. Total head is measured from the bill tip to the rearmost head vertex along the bill axis, as `measure.ts` does and as USGS measures it.

| Assertion | Killdeer | Least | Basis |
|---|---|---|---|
| Exposed culmen | 19-23 | 16-21 | Ridgway 19-23 and 16-20; USGS Least 16.7-21.2 |
| Total length | 200-280 | 115-150 | AAB 200-280 and 130-150. Least lowered to 115 because a hunched live bird traces at 113-126 (photo-measured); keep 130-150 if the Least model is traced with the neck up |
| Tarsus | 32-37 | 16-21 | Ridgway 32-37 and 16-19; USGS Least diagonal 17.4-20.7; AVONET within both |
| Wing chord | 147-170 | 82-96 | Ridgway 147-170 and 82-91; widened for USGS flattened Least (85-96) |
| Tail | 82-103 | 34-42 | Ridgway 88-103 and 34-41; AVONET 82-90 and 37-41 |
| Middle toe (no claw) | 20-23 | 15-17 | Ridgway ranges |
| Bare tibia (sanity only) | 13-22 | 7-11 | Estimates around 17 and 9 (section 8) |
| Bill depth at base | 3.6-5.0 | 2.8-4.2 | AVONET nostril ranges, widened upward for the base |
| **Culmen / head** | **0.55-0.80** | **0.80-1.10** | Least: USGS 0.92 (0.83-1.06, n=22). Killdeer: estimated 0.63-0.70 (one skull; allometry). Both assume a skull-level head (thin feather layer at the occiput) |
| Separation: Least ratio − Killdeer ratio | ≥ 0.15 | | Expected 0.2-0.3 |
| Culmen / head, if the head is traced to the fluffed outline | 0.45-0.65 | 0.65-0.90 | Photo-measured 0.54-0.57 and 0.69-0.80. Use only if the occiput is placed on the feather outline |
| Culmen / tarsus | 0.50-0.68 | 0.85-1.12 | Ridgway 0.58 and 1.00; USGS Least 0.94. The clearest plover-against-sandpiper bill mark in the data |
| Bill tip rise (`billTipRise`) | \|rise\| < 1.0 (straight) | −1.0 to −0.2 (tip below the base line) | Ridgway "straight"/"faintly decurved tip"; Least photo-measured −0.3 and −0.45 on the centreline |
| Tail tip past wingtip (= −`projection`) | +8 to +30 | −4 to +4 | Killdeer photos +15 and +19 (+18 computed); Least juvenile photo +1; "no extension past the tertials" |
| Eye radius (if tested) | 3.3-4.3 | 1.7-2.3 | Photo-measured ± ~12% |
| Tail / wing | 0.50-0.66 | 0.38-0.50 | Ridgway 0.60 and 0.44; AVONET 0.54 and 0.45 |
| Size ratio Killdeer / Least: wing | 1.75-1.95 | | Ridgway 1.86; AVONET 1.84 |
| Size ratio Killdeer / Least: culmen | 1.0-1.3 | | Ridgway 1.14 |

On the painted atlas, the design's checks are supported as written:
- Killdeer midline, throat to belly: white, black (≈ 10 mm), white (≈ 5-8 mm), black (≈ 13-16 mm), white.
- Killdeer eye-ring hue: orange-red.
- Least: rufous scapular edges warmer than the blackish centres; buffy breast darker than the white belly; legs yellow-green.

---

## 10. Foraging settings

### 10.1 Killdeer (`plover`)

| Setting | Value | Status |
|---|---|---|
| Run distance | 0.3-1.2 m, mean ≈ 0.5 m; occasionally to 2 m (relocation) | **Estimate.** Interpolated from Pienkowski's mean runs, 0.32 m (Ringed) and 0.66 m (Grey) [Pienkowski 1980, p. 87]. The design's 0.5-2 m is on the long side of this |
| Run speed | ≈ 0.6 m/s while foraging (0.45-0.9); ≥ 1.5 m/s when chased | **Estimate.** Plover mean run speeds 0.46 and 0.51 m/s (computed from [Pienkowski 1980, p. 87]); "swift running" and "astonishing" speed [Bent 1929, pp. 210-211] |
| Steps per second in a run | ≈ 4 | **Computed** from Pienkowski: 4.5 (Ringed), 3.7 (Grey) |
| Stop (look) duration | 1-4 s, mean ≈ 2.5 s | **Estimate.** Plover means 1.95 s and 3.21 s; giving-up times 1.8-3.9 s [Pienkowski 1980, pp. 87, 128] |
| Chance of a peck after a stop | ≈ 0.5 (0.4-0.7) | **Estimate.** Ringed Plover arithmetic (17-26 pecks/min against ≈ 23 stop-run cycles/min) allows up to ≈ 0.8 in good conditions. No Killdeer data |
| Pecks per stop | 1 (a single dab) | **Sourced**, qualitatively: "dabbing suddenly at the ground" [Bent 1929, p. 210] |
| Peck duration (down and up) | 0.3-0.5 s | **Estimate**; matches the design's "under half a second" |
| Head bob on stopping | occasional | **Sourced**, qualitatively [Bent 1929, p. 210; AAB-K caption] |
| Foot-trembling | occasional, standing on one leg | **Sourced**, qualitatively [BirdWeb-K]; 18% of Ringed Plover observations [Pienkowski 1980, p. 87] |
| Spacing | each bird on its own, metres to tens of metres apart | **Sourced**, qualitatively [Bent 1929, pp. 211, 213; BirdWeb-K] |

### 10.2 Least Sandpiper (`sandpiper`)

| Setting | Value | Status |
|---|---|---|
| Walk speed while feeding | ≈ 0.10 m/s | **Sourced but unverified:** "about 10 cm/s (Baker and Baker 1973)" [BOTW-L snippet]. Consistent with my video estimate |
| Steps per second (walking) | ≈ 3-4, short shuffling steps | **Estimate** from video [Danese 2023]; "shorter, shuffling steps" [Cox 2008] |
| Pecks per second while walking | ≈ 2.5 (range 1-4) | **Estimate** from video (one bird, 2 s). Western Sandpiper grazing: 2.0/s [Canham et al. 2023] |
| `peck` bout on the spot | 2-5 rapid probes; a held probe ≈ 0.25 s | **Estimate** from video |
| Run speed | ≈ 0.4 m/s (0.3-0.6) | **Estimate**; no source. About 3-6x the walk |
| When it runs | when more than ≈ 1.5-2 m from the group target; short dashes of 0.3-1 m | **Estimate**; the loose, irregular spread is sourced [Bent 1927, p. 206; Cox 2008; AAB-L] |
| Nearest-neighbour spacing | ≈ 0.5-2 m | **Estimate**; sources say only "loose", "spread out in an irregular fashion", "rarely ... tightly packed" |
| Pause and look up | frequent brief glances, freezing at noises | **Sourced**, qualitatively [Cox 2008] |

---

## 11. Open questions and confidence

**High confidence**
- Ridgway's culmen, wing, tarsus, and toe for both species. Ridgway, AVONET, and (for the Least) USGS agree within about 1-2 mm.
- Least culmen / head of about 0.9 (USGS, n=22), and the Killdeer's bill being much shorter than its head.
- The juvenile Least is the late-September plumage in the Willamette Valley. All written sources agree, and all 13 of my ageable photos from mid-September to early October are juveniles.
- Adult and juvenile Killdeers are both double-banded and nearly alike.
- The field-mark wording in section 4. It is quoted from Ridgway, Bent, and AAB and matches the reference photos.

**Medium confidence**
- **Killdeer tail length:** Ridgway 95 mm (n=32) against AVONET 86 mm (n=4). I recommend Ridgway.
- **Killdeer tail past the wingtip:** two photos (15 and 19 mm) and an assumption-based computation (18 mm). No published value.
- **Tail shapes:** `wedge` for the Killdeer rests on Ridgway's "graduated for more than one-sixth". `square` for the Least is a judgment on "nearly truncate".
- **Bill depth at the base:** inferred from nostril-level measurements of 4-5 skins.
- **Least wingtip about even with the tail:** one statement [Cox 2008] and one photo.

**Low confidence or not verified**
- **Killdeer head length.** No measurement exists in any source I could read. The 29-32 mm estimate rests on one skull [Skullsite] and on allometry across species. The culmen / head bounds are wide for that reason.
- **All foraging numbers except the Least's walking speed.** Killdeer values are scaled from Ringed and Grey Plovers. Least peck and step rates come from 2 s of one video. The walking speed itself is snippet-only.
- **Bare tibia** for both species: qualitative genus statements plus photos with soft feather edges.
- **Least bill droop size** (0.3-0.5 mm). It comes from two photos at the limit of resolution, and perspective can bias it.
- **Photo lengths and scale.** The Least tarsi measured 10-15% short of Ridgway on both photos, so the Least photo scale may be ≈ 10% off. The Killdeer photos checked well.
- **Juvenile Least bill length.** Many juvenile shorebirds reach full bill length only in their first winter, "so some fall migrants will have relatively short bills" [Cox 2008, said of Semipalmated]. No Least-specific data found. A late-September juvenile could be ≈ 0.5-1 mm under the adult 18 mm.
- **Snippet-only claims:**
  - [BOTW-L snippet]: the 10 cm/s walking speed and "walks slowly ... small area".
  - [BOTW-K snippet]: the run-stop wording.
  - [Rose & Nol 2010 snippet]: 25 pecks per minute for the Semipalmated Plover.

**Sources I could not read** (not relied on for any number unless flagged)
- **Birds of the World:** Jackson & Jackson (Killdeer) and Nebel & Cooper (Least). Plumages, Measurements, Behavior, and Movements are paywalled.
- **Baker & Baker 1973**, *Ecological Monographs* 43: 193-212: locomotion and peck rates by foraging method, including the Least Sandpiper and Semipalmated Plover. Paywalled; this is the best missing source for the sandpiper settings.
- **Pienkowski 1983**, *Animal Behaviour* 31: 244-264: the published version of the thesis chapter I used. Paywalled.
- **Rose & Nol 2010**, *Waterbirds* 33: Semipalmated Plover foraging. Paywalled; snippet only.
- **Paulson 1993** and **Paulson 2005**, Pyle 2008, Hayman et al. 1986, O'Brien et al. 2006: lending-only or not online.
- **eBird bar charts** for the Willamette Valley counties: sign-in required.
- **The Killdeer time-budget paper** (Animal Behaviour 1988): paywalled.

**Worth doing if higher confidence is needed**
- Read Baker & Baker (1973) for Least and Semipalmated Plover locomotion and peck rates.
- Measure a Killdeer's total head on a specimen, or find a banding dataset with head-bill length.
- Film or find a CC video of a foraging Killdeer on open mud to time runs and stops.
- Pull BOTW's Killdeer measurements table to resolve the tail discrepancy.

---

## Appendix: iNaturalist records aged (Least Sandpiper, Willamette Valley box)

The query was taxon 3864, research grade, box 43.8-45.8 N, 122.5-123.6 W; I aged the first photo of each record by eye.

| Record | Date | Result |
|---|---|---|
| 376194237 | 2016-09-15 | juvenile, 2 birds |
| 138673359 | 2016-10-01 | juvenile |
| 16439642 | 2018-09-11 | juvenile |
| 54581665 | 2019-09-11 | juvenile |
| 60154140 | 2020-09-19 | juvenile |
| 94949370 | 2021-09-15 | juvenile |
| 94949695 | 2021-09-15 | juvenile |
| 94949943 | 2021-09-15 | juvenile |
| 95371456 | 2021-09-18 | juvenile, 2 birds |
| 135214940 | 2022-09-15 | juvenile |
| 135627440 | 2022-09-16 | juvenile |
| 135959522 | 2022-09-17 | probable juvenile |
| 314031566 | 2025-09-14 | probable juvenile, distant |
| 399785754 | 2026-09-12 | juvenile |
| 401407581 | 2026-09-15 | juvenile |
| 401408247 | 2026-09-15 | probable juvenile |
| 402323011 | 2026-09-16 | juvenile |
| 34281315 | 2019-10-08 | greyer mantle, juvenile-type coverts (moulting juvenile or basic adult) |
| 62086488 | 2020-10-08 | greyer mantle, juvenile-type coverts |
| 62373232 | 2020-10-11 | greyer mantle, juvenile-type coverts |
| 97376213 | 2021-10-06 | greyer mantle, juvenile-type coverts |
| 8149886 | 2017-09-23 | not ageable: distant |
| 137983146 | 2022-10-07 | not ageable: no bird visible |
| 321886098 | 2025-09-20 | not ageable: in flight |
| 317454590 | 2025-09-28 | not ageable: distant |
| 319219064 | 2025-10-06 | not ageable: black legs, identification doubtful |

July comparison sample (1-25 July): 300278097, 172958106, 380153753, 297333369, 300787869, 174802301, 228261411, 174763602, and 230574810. Eight of the nine are worn breeding adults with heavily streaked breasts; one is too distant to age.

---

## References

- **[Ridgway 1919]** Ridgway, R. 1919. *The Birds of North and Middle America*, Part VIII. Bulletin of the United States National Museum 50(8).
  - Genus *Oxyechus* pp. 98-99; *O. vociferus vociferus* pp. 99-103 (measurements p. 100).
  - Genus *Pisobia* pp. 266-268 (description p. 267); key pp. 268-269; *P. minutilla* pp. 294-296 (measurements p. 295).
  - Read via Internet Archive OCR of the Cornell copy, https://archive.org/details/cu31924022528107 . The measurement tables were checked against the page scans (leaves 121 and 316). BHL record: https://www.biodiversitylibrary.org/bibliography/48566
- **[Ridgway 1901]** Ridgway, R. 1901. *The Birds of North and Middle America*, Part I. Bull. U.S. Natl. Mus. 50(1). Measurement methods, pp. xv-xvi. https://archive.org/details/cu31924090256870
- **[Bent 1927]** Bent, A. C. 1927. *Life Histories of North American Shore Birds*, Part 1. Bull. U.S. Natl. Mus. 142. Least Sandpiper (as *Pisobia minutilla*, by C. W. Townsend) pp. 202-214.
  - Plumages p. 205; Food pp. 205-206; Behavior pp. 206-207; Field marks pp. 207-208; Fall pp. 208-209; Distribution pp. 209-213.
  - https://archive.org/details/lifehistoriesofn00bent_3
- **[Bent 1929]** Bent, A. C. 1929. *Life Histories of North American Shore Birds*, Part 2. Bull. U.S. Natl. Mus. 146. Killdeer (as *Oxyechus vociferus*, by C. W. Townsend) pp. 202-215.
  - Plumages p. 209; Food pp. 209-210; Behavior pp. 210-211; Field marks and Fall p. 212; Winter p. 213.
  - https://archive.org/details/lifehistoriesofn00bent_4
- **[USGS 2023]** Ruthrauff, D. R., T. L. Tibbitts, R. E. Gill Jr., and C. M. Handel. 2023. Adult shorebird morphological measurement data (ver. 3.0, November 2024). U.S. Geological Survey data release. https://doi.org/10.5066/P9KNRWXB (files: https://www.sciencebase.gov/catalog/item/6532f834d34ee4b6e05bb183). I computed the statistics from `adultShorebird_morphologicalMeasurements_values.csv`; the species list is in `..._taxonomy.csv`.
- **[Tobias et al. 2022]** Tobias, J. A., et al. 2022. AVONET: morphological, ecological and geographical data for all birds. *Ecology Letters* 25: 581-597. https://doi.org/10.1111/ele.13898 . Data: https://doi.org/10.6084/m9.figshare.16586228 ("AVONET Supplementary dataset 1.xlsx": sheets AVONET1_BirdLife and AVONET_Raw_Data; rows for *Charadrius vociferus*, *Calidris minutilla*, *C. hiaticula*, *C. semipalmatus*, *Pluvialis squatarola*).
- **[Dunning 2008]** Dunning, J. B. 2008. *CRC Handbook of Avian Body Masses*, 2nd ed. Not read; seen quoted in AVONET.
- **[Pienkowski 1980]** Pienkowski, M. W. 1980. *Aspects of the ecology and behaviour of Ringed and Grey Plovers* Charadrius hiaticula *and* Pluvialis squatarola. Doctoral thesis, Durham University.
  - https://etheses.durham.ac.uk/7868/ (PDF: https://etheses.durham.ac.uk/id/eprint/7868/1/7868_4865.PDF)
  - Page numbers are the thesis's own: general feeding behaviour p. 85; Table 1 p. 87; peck success p. 91; Table 9 p. 128; Table 17 and pace lengths pp. 139-140; Table 19 p. 143.
- **[Masero et al. 2007]** Masero, J. A., S. M. Estrella, and J. M. Sánchez-Guzmán. 2007. Behavioural plasticity in foraging mode of typical plovers. *Ardea* 95(2). https://doi.org/10.5253/078.095.0208 . Checked; it reports peck rates of plovers using a sandpiper-like mode, not run-stop timings, so it was not used for settings.
- **[Rose & Nol 2010]** Rose, M., and E. Nol. 2010. Foraging behavior of non-breeding Semipalmated Plovers. *Waterbirds* 33(1). https://doi.org/10.1675/063.033.0107 . Snippet only.
- **[Baker & Baker 1973]** Baker, M. C., and A. E. M. Baker. 1973. Niche relationships among six species of shorebirds on their wintering and breeding ranges. *Ecological Monographs* 43: 193-212. https://doi.org/10.2307/1942194 . Not read; quoted via [BOTW-L snippet].
- **[Canham et al. 2023]** Canham, R., J. Rourke, and R. C. Ydenberg. 2023. The exploitation of biofilm by migrant western sandpipers (*Calidris mauri*). *Heliyon* 9: e17268. https://doi.org/10.1016/j.heliyon.2023.e17268 . The 121 actions/min figure is cited there to Kuwae et al. 2008, *Ecology* 89: 599-606 (not read).
- **[Smith et al. 2012]** Smith, R. V., J. D. Stafford, A. P. Yetter, M. M. Horath, C. S. Hine, and J. P. Hoover. 2012. Foraging ecology of fall-migrating shorebirds in the Illinois River Valley. *PLoS ONE* 7: e45121. https://doi.org/10.1371/journal.pone.0045121 (Table 2, size-corrected body mass).
- **[Cox 2008]** Cox, C. 2008. Identification of North American peeps: a primer on structure and behavior. *Birding* 40(4): 32-40 (July/August 2008). Read as a PDF at https://www.naturebob.com/sites/default/files/Identification%20of%20North%20American%20Peeps.pdf
- **[Skullsite]** Skullsite bird skull collection. *Charadrius vociferus* (Killdeer): skull length 48 mm, cranium 24 mm (one specimen). https://skullsite.com/skullpage/charadrius-vociferus-killdeer/ ; calibration against *Pluvialis squatarola* (68 mm): https://skullsite.com/skullpage/pluvialis-squatarola-grey-plover/
- **[AAB-K]** Cornell Lab of Ornithology. Killdeer Identification. All About Birds. https://www.allaboutbirds.org/guide/Killdeer/id (accessed 2026-09-25). **[AAB-K-LH]** .../Killdeer/lifehistory ; **[AAB-K-O]** .../Killdeer/overview
- **[AAB-L]** Cornell Lab of Ornithology. Least Sandpiper Identification. All About Birds. https://www.allaboutbirds.org/guide/Least_Sandpiper/id (accessed 2026-09-25). **[AAB-L-LH]** .../Least_Sandpiper/lifehistory ; **[AAB-L-O]** .../Least_Sandpiper/overview
- **[BirdWeb-K]** Seattle Audubon Society. Killdeer. BirdWeb. https://birdweb.org/birdweb/bird/killdeer
- **[BirdWeb-L]** Seattle Audubon Society. Least Sandpiper. BirdWeb. https://birdweb.org/birdweb/bird/least_sandpiper
- **[BOTW-K snippet]** Jackson, B. J. S., and J. A. Jackson. Killdeer (*Charadrius vociferus*). *Birds of the World*, Cornell Lab of Ornithology. https://birdsoftheworld.org/bow/species/killde/cur/behavior and .../foodhabits . Paywalled; wording seen only in search excerpts.
- **[BOTW-L snippet]** Nebel, S., and J. M. Cooper. Least Sandpiper (*Calidris minutilla*). *Birds of the World*. https://birdsoftheworld.org/bow/species/leasan/cur/behavior . Paywalled; the 10 cm/s wording was seen only in search excerpts.
- **[Eastside Audubon 2019]** Eastside Audubon Society. Least Sandpiper (Bird of the Month). *Corvid Crier*, 26 Aug 2019. https://www.eastsideaudubon.org/corvid-crier/2019/8/26/least-sandpiper . Secondary; cites Nebel & Cooper.
- **[Kaufman/BSBO]** Kaufman, K. Timing of Fall Shorebird Migration (northern Ohio). Black Swamp Bird Observatory. https://www.bsbo.org/timing-of-fall-shorebird-migration.html (accessed 2026-09-25).
- **[WVBT 2009]** Willamette Valley Birding Trail. 2009. Willamette Valley Birding Checklist. http://www.oregonbirdingtrails.org/wvguide/Birding%20Checklist.pdf . The symbols rate ease of detection by season, not abundance. Killdeer (breeds): regularly in spring, summer, and fall, very regularly in winter. Least Sandpiper: regularly in spring and fall, occasionally in summer and winter.
- **[iNat query 2026]** iNaturalist API v1, `/observations`, research grade. Taxon 3864 (Least Sandpiper) and 4793 (Killdeer); bounding box 43.8-45.8 N, 122.5-123.6 W; monthly counts; life-stage annotation (term 1; values 2 = adult, 8 = juvenile). Queried 2026-09-25. Photos listed in the appendix were aged by me. Proxy data with observer bias.
- **[Lasley 2008]** Lasley, G. Least Sandpiper, Hornsby Bend, Austin, Texas, 25 April 2008. iNaturalist observation 173719, photo 230314 (CC BY-NC). The game's `leasan.jpg`. https://www.inaturalist.org/photos/230314
- **[Rhododendrites 2024]** Rhododendrites. *Killdeer (20453).jpg*, South Cape May Meadows, NJ, 12 May 2024. CC BY-SA 4.0. https://commons.wikimedia.org/wiki/File:Killdeer_(20453).jpg
- **[Homler 2023]** Homler, C. (FocusOnWildlife). *Killdeer Heislerville.png*, Heislerville WMA, NJ, 9 April 2023. CC BY-SA 4.0. https://commons.wikimedia.org/wiki/File:Killdeer_Heislerville.png
- **[Rhododendrites 2025]** Rhododendrites. *Least sandpiper (03342).jpg*, Jamaica Bay Wildlife Refuge, NY, 30 August 2025. CC BY-SA 4.0. https://commons.wikimedia.org/wiki/File:Least_sandpiper_(03342).jpg
- **[Danese 2023]** Danese, P. *20230914 least sandpipers point meadows keeney cove.webm*, Glastonbury, CT, 14 September 2023, 49 s. CC BY-SA 4.0. https://commons.wikimedia.org/wiki/File:20230914_least_sandpipers_point_meadows_keeney_cove.webm . Frames 13.0-15.0 s were examined at 30 fps from the 480p rendition.
