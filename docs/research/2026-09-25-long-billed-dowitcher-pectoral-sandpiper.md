# Long-billed Dowitcher and Pectoral Sandpiper: measurements, late-September plumage, field marks, structure, and foraging

Date: 2026-09-25
Purpose: source data for the detailed Long-billed Dowitcher (`lobdow`) and Pectoral Sandpiper (`pecsan`) models, the `dowitcher` foraging style, `probeDepth`, and the `shallows-edge` zone in `docs/superpowers/specs/2026-09-25-dowitcher-pectoral-design.md`. The player watches from 21-23 m through the telescope, on a Willamette Valley lake in late September: six dowitchers feed belly-deep in a narrow strip of water, and two Pectorals feed on the mudflat among Least Sandpipers.

Note added during planning: the strip became the `bench`, an underwater shelf 4.5 cm deep past the shallows, because the 3.5-5.5 cm band this document recommends is only 8-10 cm wide on the lake's existing terrain. Where this document says `shallows-edge`, read `bench`; the band and its geometry apply unchanged.

How to read the citations: `[Key, p. N]` points to the References section at the end. "Snippet" means the text was visible only as a search-engine excerpt of a paywalled page; I could not read the page, so treat it as unverified. "Computed" means my own arithmetic on cited data. "Photo-measured" means I measured it in pixels on a cited photo and scaled it by the published culmen (or, where stated, by the tarsus). "Estimate" means no source gives the number and I chose it, with the basis stated.

---

## 1. Summary

- **Measurements, mean of the sexes** (Ridgway 1919, 10 + 10 dowitchers, 8 + 15 Pectorals; mm):
  - Long-billed Dowitcher: wing 143, tail 56, exposed culmen **66**, tarsus 38.5, middle toe 27. Females have **17% longer bills** (71.3 against 61) [Ridgway 1919, p. 201].
  - Pectoral: wing 133, tail 59, culmen **27.5**, tarsus 27, middle toe 23. Males are 11-13% larger in wing and tail and "about 50% heavier" [Ridgway 1919, pp. 270-271; AAB-P].
  - Bill depth and width at the base: 7.1 × 4.5 and 4.8 × 3.4 [Tobias et al. 2022].
- **Both species are in the USGS live-bird dataset**, and its 50 dowitchers are **September juveniles** [USGS 2023]:
  - culmen / head **2.30** (n=39; 5th-95th percentile 2.04-2.58) for the dowitcher and **1.09** (0.92-1.23, n=32) for the Pectoral (computed). These are the design's "about 2" and "about 1".
  - **Juvenile bills are not short in September**: dowitcher juveniles 67.2 mm (n=49) against the adult mean 66.2; Pectoral juveniles 28.5 against 27.1-27.5.
- **Age: model juveniles of both.** In the Willamette Valley box, 40 of 44 ageable dowitcher records and all 30 ageable Pectoral records from 11 September to 12 October are juveniles. The only two adult dowitchers are on 20 September, in moult; all ageable July-August dowitchers are worn adults (appendix). BirdWeb: adult dowitchers "common from July into mid-September", juveniles "common through October"; of Pectorals, "Most of these birds are juvenile" [BirdWeb-D; BirdWeb-P].
- **Marks, with two corrections to the design:**
  - Juvenile Long-billed tertials are "dark gray with narrower buff edges and duller to no internal markings", against Short-billed's "tiger-striped" ones; "It is often erroneously stated that juvenal Long-billed tertials lack internal markings altogether" [Lee & Birch 2006, p. 39]. Paint them plain.
  - Tail: "the black bars are wider than the white ... sometimes even twice as wide" [Lee & Birch 2006, p. 39]; about 3-3.5 mm dark to 1-2 mm white on two photos.
  - The dowitcher's grey breast fades softly into the belly; the sharp edge is the Pectoral's, where the streaking stops within about **3 mm** (photo-measured).
  - Pectoral legs are olive-yellow or greenish-yellow, not ochre [Ridgway 1919, p. 270; Bent 1927, p. 176].
- **Structure:**
  - Dowitcher bill straight, the tip only **0.6-1.0 mm** below the base line, blunt and expanded in the terminal third. Pectoral tip **0.5-0.6 mm** below (photo-measured).
  - Dowitcher: no primary projection; tail tip **4-8 mm** past the wingtip. Pectoral: primaries **17-24 mm** past the tertials; tail about even with the wingtip (photo-measured).
  - Tail shape `rounded` for both [Ridgway 1919, pp. 196, 267-268].
- **Dowitcher heights, standing** (photo-measured on three photos): intertarsal joint **38 mm**, belly **45-53 mm**, folded wing's lower edge **14-25 mm above the belly** (at the belly line when the plumage is fluffed).
- **Depth band for `shallows-edge`: 3.5 to 5.5 cm.** This satisfies the design's geometry and contains AAB's "ideally about 2 inches". Real Long-billed Dowitchers feed deeper on average: 6.4 cm in fall and 4.2 cm in spring [Davis & Smith 2001, p. 488], up to the breast [Bent 1927, p. 120]. Only the model's dry-wing rule keeps the band shallower (section 7.4).
- **Foraging:**
  - The only timed study gives **1.0 jab or probe per second** (0.6-1.8), "mostly *L. griseus*" [Burton 1972, p. 66].
  - On CC video the bill makes **about 3 large strokes a second** and faster small ones, in bouts of 4-14 s. The head comes up for 1.5-3.5 s between bouts. The bird creeps at 2-2.5 cm/s in 2-3 cm steps (**Estimate**).
  - Probe depth: "one third to the full length of the bill" [Burton 1972, p. 65]; recommended **`probeDepth` 0.035 m** (**Estimate**). The head goes under at belly depth [Bent 1927, p. 110; video].
  - Flock spacing: about 0.3-0.5 m (**Estimate**, one video).
  - Pectoral: walks at ≈ 0.1-0.15 m/s (**Estimate**) and "moves about slowly while feeding, probing in the mud with rapid strokes" [Bent 1927, p. 176]. This is consistent with the `sandpiper` table; no peck rate could be counted.
- **Pectoral against the Least:** 1.42-1.56 in every Ridgway linear measure and 3x in mass. Traced total length with the body level is 0.184-0.196 m, **1.42-1.51x the Least model's 0.13 m**. An upright trace (0.163 m, 1.25x) would fail the design's 1.3-1.6 test, so trace the body level.
- **Tracing references** (scratchpad, not the repo):
  - Dowitcher: `lobdow-side.jpg` (Leighton, CC BY-NC, 0.145 mm/px, side-on checked by the tarsus) for the profile and heights; `lobdow-juv.jpg` (Lindsey, CC BY-NC, 0.241 mm/px) for the juvenile plumage; three more for checks, one of them local.
  - Pectoral: `pecsan-side.jpg` (ADJ82, CC BY-SA 4.0, 0.090 mm/px) for the profile; `pecsan-side-local.jpg` (Herlyn, Benton County, CC BY-NC, 0.150 mm/px) for the legs and local plumage; two more for plumage and colour.

---

## 2. Measurements

### 2.1 Ridgway 1919 (museum skins, adults, sexes separated)

Method as in the Killdeer and Least research [Ridgway 1901, pp. xv-xvi]: wing chord unflattened, tail from the bases of the middle rectrices, exposed culmen from the edge of the frontal feathering, tarsus from the heel joint, middle toe **without claw**. Immatures were excluded. Ridgway treats the Long-billed Dowitcher as a subspecies, *Limnodromus griseus scolopaceus*, and the Pectoral Sandpiper as *Pisobia maculata*. All values below are in mm.

| Species | Sex (n) | Wing | Tail | Exposed culmen | Tarsus | Middle toe (no claw) | Source |
|---|---|---|---|---|---|---|---|
| Long-billed Dowitcher | M (10) | 139-145 (141.1) | 50-56.5 (54.5) | 52-69.5 (61) | 33.5-40.5 (37.2) | 24-28 (26.3) | [Ridgway 1919, p. 201] |
| Long-billed Dowitcher | F (10) | 136-150 (145.4) | 56-61 (58.1) | 62-79 (71.3) | 36.5-42 (39.8) | 26-30 (27.7) | [Ridgway 1919, p. 201] |
| Long-billed Dowitcher | **mean of the sexes** | **143.3** | **56.3** | **66.2** | **38.5** | **27.0** | computed |
| Pectoral | M (8) | 137-146 (139.8) | 59-65 (62.4) | 26-29.5 (28.4) | 27-30 (27.7) | 21.5-24.5 (23.6) | [Ridgway 1919, pp. 270-271] |
| Pectoral | F (15) | 119.5-130 (125.8) | 51-60 (55.3) | 24-29 (25.8) | 24-26.5 (25.8) | 21-26.5 (22.5) | [Ridgway 1919, p. 271] |
| Pectoral | F (15), weighted mean of the regional sub-table | 125.8 | 55.3 | **26.6** | 25.8 | 22.4 | computed from [Ridgway 1919, p. 271] |
| Pectoral | **mean of the sexes** | **132.8** | **58.9** | **27.5** with the sub-table female (27.1 with the printed one) | **26.8** | **23.1** | computed |

The measurement lines were checked against the page scans (Cornell copy, leaves n222, n291 and n292). The OCR's Pectoral male wing "187-146" is "137-146" on the scan. The footnotes give ten male and ten female dowitchers, eight male and fifteen female Pectorals.

**Internal inconsistency (Pectoral females).** The regional sub-table on p. 271 (one Maryland, two Illinois, one North Dakota, one St. Paul Island, one St. Lawrence Island, nine mainland-Alaska females: 15 birds) reproduces the printed wing, tail, tarsus and toe means, but its culmen means average **26.6 mm**, against the printed **25.8** (computed). The USGS females below average 27.3 mm (n=19). I use 26.6 for the female culmen; the difference moves the mean of the sexes by 0.4 mm. The males' sub-table (one Pennsylvania, two Illinois, five Alaska) reproduces every printed male mean.

There is no regional sub-table for the dowitcher.

**Sexual dimorphism** (computed from the table):

| Ratio | Long-billed Dowitcher, F / M | Pectoral, M / F |
|---|---|---|
| Wing | 1.03 | 1.11 |
| Tail | 1.07 | 1.13 |
| Exposed culmen | **1.17** | 1.10 (1.07 with the sub-table female) |
| Tarsus | 1.07 | 1.07 |
| Middle toe | 1.05 | 1.05 |
| Mass | - | "Males are considerably larger and about 50% heavier than females" [AAB-P] |

- **Dowitcher:** the female is the larger bird, and the difference is mostly in the bill: female culmen 71.3 against male 61 mm. "The female of both species has a longer bill than the male, and the bill of the female Short-billed is the same length of that of the male Long-billed" [BirdWeb-D]. AAB: "females usually do have a bill that is impressively longer than Short-billed Dowitchers', but males often do not" [AAB-D-O].
- **Pectoral:** the male is the larger bird. Linear measures differ by 5-13% (wing 11%, tail 13%), and mass by about 50% [AAB-P]. A 50% mass difference is 1.14 in linear scale (computed, cube root). So the design's "males run about 15-20% larger" slightly overstates the linear difference; 10-13% is closer. Bent: "The males are much larger than the females, which is unusual among shore birds" [Bent 1927, p. 176].

Genus statements that set proportions:
- **Limnodromus** [Ridgway 1919, pp. 195-196]:
  - Size and bill: "Rather large, snipe-like Eroliine (?) (wing 135-150 mm.) with bill at least two-fifths (sometimes half) as long as wing, with the slightly expanded and punctulate terminal portion occupying one-third or more of its total length".
  - Bill: "Bill two-fifths to one-half as long as wing, straight, compressed for proximal two-thirds, the terminal third slightly but distinctly expanded, depressed, and minutely punctulate; culmen ascending basally, the base of bill much higher than wide; nostril sub-basal, small, longitudinally elliptical or linear; nasal groove extending to near middle of expanded terminal portion of maxilla".
  - Wing: "the longest primary (outermost) exceeding distal secondaries by about half the length of wing; tertials elongated, tapering distally but rounded at tips, the longest falling decidedly short of tip of longest primary".
  - Tail: "Tail between one-third and two-fifths as long as wing, very slightly rounded; rectrices, 12."
  - Legs: "Tarsus much shorter than exposed culmen, one-fourth as long as wing or very slightly less"; "bare portion of tibia decidedly shorter than middle toe without claw"; "middle toe about three-fourths as long as tarsus"; "hallux small and slender".
  - Coloration: "Lower back, rump, upper tail-coverts, and tail white, the first often immaculate, the rump spotted, the upper tail-coverts and tail barred with blackish".
  - The subspecies: "Similar in coloration to *L. griseus griseus* but larger, with decidedly longer bill, tarsi, and toes" [Ridgway 1919, p. 201].
- **Pisobia** [Ridgway 1919, pp. 267-268], as quoted in the Least research, plus the parts specific to the Pectoral:
  - "Bill straight, little if any longer than head (sometimes shorter) ... tapering distally in lateral profile ... the faintly decurved tip of maxilla".
  - Tail: "nearly truncate but inclining to slightly rounded ..., the middle pair of rectrices contracted terminally (**acuminate in *P. maculata*** and *P. acuminata*) and projecting, more or less, beyond the rest".
  - Tertials: in the larger species the elongated tertials are "acuminate", and relatively shorter than in the small species (footnote c).
  - Tibia: "bare portion of tibia about as long as first two phalanges of middle toe, or a little shorter".
  - Key to *maculata* [Ridgway 1919, p. 268]: "Median upper tail-coverts pointed at tip (subacuminate), the tail slightly rounded; tarsus not less than 24 (24-30), middle toe not less than 21 (21-25 mm.); rump and median upper tail-coverts sooty blackish ... foreneck and chest pale grayish brown conspicuously streaked with dusky brown."

### 2.2 USGS Alaska Science Center (live birds)

Dataset [USGS 2023]; statistics computed by me from `adultShorebird_morphologicalMeasurements_values.csv` (no recaptures in either species). **Both species are in the dataset**: its taxonomy file lists Long-billed Dowitcher (TSN 176679) and Pectoral Sandpiper (176653). Definitions from the metadata:
- Total head: "Length between tip of culmen and back of the shorebird's head".
- Exposed culmen: "measured diagonally from the most proximal unfeathered portion of the bill to the bill tip".
- Diagonal tarsus: "Length between the shorebird's intertarsal joint and the distal end of the last leg scale before the toes emerge".
- Wing: "flattened and straightened", so about 3-6% longer than Ridgway's chord.

Despite the file name, the dowitcher sample is **50 hatch-year birds** ("the shorebird hatched during the boreal summer in the calendar year in which captured") and one adult. The hatch-year birds were measured on the Yukon-Kuskokwim Delta (Angyoyaravak Bay 37, Kanaryarmiut 11, Old Chevak 1) between 25 August and 18 September, 2004-2008. None is sexed. That makes it a direct sample of the bird the game shows: a juvenile in September.

I excluded two records as data errors: dowitcher record 4010 (culmen 74.5, total head 94.2, so a head of 19.7 mm against 27.6-34.8 for the rest) and Pectoral record 10451 (culmen 16.6 mm against 25-31 for the rest).

| Measure | Long-billed Dowitcher, hatch-year, Sept (n=39-49) | Pectoral, all (n=20-36) | Pectoral, hatch-year, Sept-Oct (n=12-16) | Pectoral, adults (n=20; 19 sexed female) |
|---|---|---|---|---|
| Mass (g) | 115.7 +/- 14.5 (86-153), n=41 | 68.6 +/- 11.5 (54.3-98.6) | 75.5 +/- 13.3 (54.3-98.6) | 63.2 +/- 5.7 (54.3-79.1) |
| Wing, flattened | 151.2 +/- 4.0 (143-159), n=40 | 136.9 +/- 7.7 (126-152) | 143.2 +/- 6.4 (129-152) | 132.4 +/- 4.9 (126-144) |
| Diagonal tarsus | 44.1 (n=1) | 27.9 +/- 0.9 (26.0-29.3), n=20 | - | 27.9 +/- 0.9 (26.0-29.3) |
| Exposed culmen | **67.2 +/- 5.9 (57.9-78.7)**, n=49 | **27.9 +/- 1.4 (25.0-31.0)** | 28.5 +/- 1.8 (25.5-31.0) | 27.5 +/- 0.9 (25.0-29.1) |
| Total head | 97.0 +/- 6.9 (86.3-113.5), n=39 | 53.3 +/- 2.0 (50.0-58.1), n=32 | 54.8 +/- 2.0 (50.6-58.1) | 52.4 +/- 1.3 (50.0-55.7) |
| **Head = total head - culmen** | **29.4 +/- 1.3 (27.6-34.8)** | **25.5 +/- 1.2 (23.4-28.1)** | 26.5 +/- 1.1 (24.8-28.1) | 24.9 +/- 0.9 (23.4-26.7) |
| **Culmen / head** | **2.30 +/- 0.18 (1.97-2.79)**; 5th-95th percentile 2.04-2.58 | **1.09 +/- 0.07 (0.92-1.23)** | 1.07 +/- 0.09 (0.92-1.22) | 1.10 +/- 0.05 (1.00-1.23) |
| Culmen / total head | 0.70 +/- 0.02 | 0.52 +/- 0.02 | 0.52 | 0.52 |
| Culmen / diagonal tarsus | - | 0.99 +/- 0.04 | - | 0.99 |

All values computed; means are +/- SD. Notes:
- The one adult dowitcher (Lake Clark, 11 July 1997): culmen 58.9, total head 87.9, head 29.0, culmen / head 2.03, diagonal tarsus 38.3, wing 158, mass 111 g. A short-billed individual, probably a male.
- The Pectoral adults are breeding birds from the North Slope, Southcentral Alaska and Lake Clark (May-July); 19 are sexed female (by brood patch, wing length, size, or genetics). Only two males are in the whole sample, so the "all" column is female-weighted.
- The hatch-year Pectorals (Yukon-Kuskokwim Delta and Alaska Peninsula, 1 September-1 October) are unsexed. Their wings run 129-152, spanning both sexes.
- The dowitcher mass (116 g) is of fattening pre-migrants. Texas playa migrants averaged 95.9 +/- 0.6 g (SE, n=176), with a bill of 6.7 +/- 0.04 cm [Davis & Smith 2001, p. 490].
- A second live Pectoral sample: spring migrants collected in North Dakota had mass 76.1 +/- 13.0 g, tarsus 28.8 +/- 1.6 mm and culmen 28.2 +/- 1.3 mm (mean +/- SD, n=32, sexes pooled) [Eldridge et al. 2009, p. 251, Table 5].

### 2.3 AVONET (museum skins; small n)

From [Tobias et al. 2022], Supplementary dataset 1 (sheets `AVONET1_BirdLife` and `AVONET_Raw_Data`), with the raw rows checked. "Beak length culmen" runs from the tip to the base of the skull, so it is longer than the exposed culmen; width and depth are taken at the nostril.

| Measure | Long-billed Dowitcher (n=4: 2 M, 2 F; NHMUK, Canada and USA) | Pectoral (n=5: 3 F, 2 unsexed; NHMUK Brazil and Venezuela, 1 MMUM) |
|---|---|---|
| Beak, tip to skull | 70.7 (65.6-74.1) | 32.1 (30.9-33.4) |
| Beak, nostril to tip | 61.9 (55.7-66.0) | 23.1 (22.4-24.0), n=4 |
| **Beak width at nostril** | **4.5 (4.1-4.7)** | **3.4 (2.9-4.0)** |
| **Beak depth at nostril** | **7.1 (7.0-7.5)** | **4.8 (4.6-5.1)** |
| Tarsus | 38.6 (37.1-41.5) | 26.0 (25.2-26.8) |
| Wing | 145.5 (140-154) | 125.2 (119-130) |
| Kipp's distance | 74.2 (71-78) | 67.1 (58.3-73.6), n=4 |
| Hand-wing index | 51.0 | 53.4 |
| Tail | 56.5 (51-62) | 54.4 (50-68); 51.0 without the MMUM skin |
| Mass (Dunning 2008, via AVONET; not read) | 104.4 g | 79.7 g |

- The Pectoral skins are female-weighted: all five wings (119-130) fall within 0.5 mm of Ridgway's female range (119.5-130) and below every male (137-146), and the three sexed skins are female. So AVONET's Pectoral wing and tail are female values, not the mean of the sexes.
- The one MMUM Pectoral skin has a 68 mm tail, 8 mm longer than any Ridgway female; without it the tail is 51.0.
- The dowitcher bill depth (7.0-7.5) is the one number here that the model needs and no other source gives. It matches Ridgway's "base of bill much higher than wide" (depth 7.1 against width 4.5) and my photo measurement (section 2.7).

### 2.4 Head length and total head

**Both species have USGS total-head measurements**, so unlike the Killdeer no estimate is needed.
- **Long-billed Dowitcher:** head 29.4 mm and culmen / head **2.30** (n=39 September juveniles; 5th-95th percentile 2.04-2.58). The one adult: 2.03. That is the design's "about 2". AAB: "Front heavy, chunky shorebird with a long bill (twice as long as its head)" [AAB-D gallery caption]. Because female bills are 17% longer while heads barely differ, the ratio in a mixed flock ranges from about 2.0 (males) to 2.5 (females) (computed from Ridgway's culmens over the USGS head).
- **Pectoral:** head 25.5 mm and culmen / head **1.09** (0.92-1.23, n=32). Juveniles 1.07, adults 1.10. That is the design's "about 1", and Ridgway's genus "little if any longer than head".

**Relative head size (computed).** The Least research found head / mass^(1/3) nearly constant (6.5-7.0) across nine USGS shorebirds. On the same basis:
- Pectoral: 25.5 / 68.6^(1/3) = **6.23**; females alone 24.7 / 63.2^(1/3) = 6.21.
- Long-billed Dowitcher: 29.4 / 115.7^(1/3) = 6.04 with the fat September mass; 6.43 at the Texas 95.9 g.

Both are small-headed for their mass. For the Pectoral this supports the design's "small head" with a number; the dowitcher's low value is partly its fat.

**Photo ratios.** As in the Least research, a traced feathered outline gives lower ratios than callipers, because the rear of the head is taken where the crown runs into the hindneck (photo-measured, section 2.7):
- Long-billed Dowitcher: **2.1** (`lobdow-juv-2.jpg`, neck stretched), **1.7** (`lobdow-juv.jpg`, neck drawn in), **1.5** (`lobdow-side.jpg`, a fluffed February bird). The USGS 2.30 is the value to build to.
- Pectoral: **1.01** (`pecsan-side.jpg`), against the USGS 1.09.
- The advice from the earlier research stands: put the occiput station on the skull-level surface under a thin feather layer, and the built model will reproduce the USGS ratios.

### 2.5 Length, mass, and derived proportions

| Quantity | Long-billed Dowitcher | Pectoral | Source / note |
|---|---|---|---|
| Length | 29 cm | - | [AAB-D] |
| Length | 11-13 in (28-33 cm) | 9 in (23 cm) | [Audubon-D; Audubon-P]. Least: 5-6 in (13-15 cm) [Audubon-L] |
| Weight | 88-131 g | 41-105 g | [AAB-D; AAB-P] |
| Wingspan | 47-49 cm | - | [AAB-D] |
| Relative size | "Larger than a Lesser Yellowlegs, smaller than a Greater Yellowlegs" | "Larger than a Semipalmated Sandpiper, smaller than a Willet; similar in size to a Dunlin" | [AAB-D; AAB-P] |
| Shape | "A plump, medium-sized shorebird with a very long bill, relatively long legs, and short tail" | "A stout, medium-sized shorebird with a moderately long, fairly thick-based bill and long wings" | [AAB-D; AAB-P] |

**Length caution.** As in the earlier research, published lengths are stretched-specimen lengths. The model's `length` is bill tip to tail tip at rest. On four dowitcher photos this traces at 210-238 mm (section 2.7), against the published 280-330. The dowitcher's bill points 26-37° below level at rest in all four, which shortens the straight line.

**Proportions** (computed from Ridgway's means of the sexes):

| Ratio | Long-billed Dowitcher | Pectoral | Source statement |
|---|---|---|---|
| Culmen / wing | 0.46 | 0.21 | *Limnodromus*: "bill two-fifths to one-half as long as wing" |
| Tarsus / wing | 0.27 | 0.20 | *Limnodromus*: "one-fourth as long as wing or very slightly less" (0.27 is slightly more) |
| Culmen / tarsus | 1.72 | 1.03 (USGS 0.99) | *Limnodromus*: "tarsus much shorter than exposed culmen"; *Pisobia*: culmen "not longer (usually shorter) than tarsus" |
| Middle toe / tarsus | 0.70 | 0.86 | *Limnodromus*: "about three-fourths as long as tarsus" |
| Tail / wing | 0.39 | 0.44 | "between one-third and two-fifths"; "more than two-fifths" |

**Pectoral against Least** (computed; Least from the earlier research):

| Measure | Pectoral / Least |
|---|---|
| Wing | 132.8 / 85.9 = 1.55 |
| Tail | 58.9 / 37.7 = 1.56 |
| Culmen | 27.5 / 17.8 = 1.54 |
| Tarsus | 26.8 / 17.9 = 1.49 |
| Middle toe | 23.1 / 16.2 = 1.42 |
| Mass | 68.6 / 23.3 = 2.94 (USGS; cube root 1.43); 79.7 / 22.9 = 3.48 (Dunning; cube root 1.52) |
| Published length | 23 / 14 = 1.64 (Audubon, midpoint for Least) |
| Traced length | 0.196 / 0.13 = 1.51 (the side reference against the Least model) |

So "clearly bigger than a Least" is about 1.5x in every linear measure and 3x in mass. This fits the design's 1.3-1.6x.

### 2.6 Juvenile bills in autumn

The design asks whether juvenile bills run short. For both species, **the USGS September juveniles are not shorter-billed than adults**:
- Long-billed Dowitcher: hatch-year culmen **67.2 +/- 5.9 mm** (n=49, 25 August-18 September), against Ridgway's adult mean of the sexes 66.2 (males 61, females 71.3). The juvenile range (57.9-78.7) spans both adult sexes (52-79).
- Pectoral: hatch-year culmen **28.5 +/- 1.8** (n=16), against 27.5 +/- 0.9 in the (female) adults and Ridgway's mean of the sexes 27.1-27.5.

The juveniles are unsexed, so a skew toward females would hide a small juvenile shortfall. No source I could read says juvenile bills of either species are short in autumn. Lee & Birch show a first-winter Long-billed "presumably a male" whose bill "is on the short end of the spectrum" [Lee & Birch 2006, p. 38, Fig. 3], which is about sex, not age. **Scale the tracing photos by the adult mean of the sexes.**

The larger uncertainty in the photo scale is individual variation: the dowitcher culmen has an SD of 5.9 mm (9%), so any single dowitcher photo scaled by the mean culmen can be about 9% off. Section 2.7 checks the scale against the tarsus where the legs allow.

### 2.7 Measured on the reference photos (photo-measured)

Each photo was scaled by its exposed culmen chord, from the edge of the feathering on top of the bill to the tip, at the adult mean of the sexes: **66 mm** for the dowitcher and **27.5 mm** for the Pectoral. Coordinates are in each file's own pixels, x to the right and y down. Section 8 has the files, credits and licences.

Two methods were used beyond reading points off gridded enlargements:
- **Bill profile.** I sampled the bill's cross-section at 40 stations along the base-tip chord, found the dark bill's upper and lower edges in each luminance profile, and fitted the centreline. The tip droop is the tip's distance below the straight extension of the centreline over the proximal half. This works only where the bill is darker than a plain background; on three photos (sand grains on the bill, a pale bill base against grey water) it gave no usable result, and I say so below.
- **Tarsus check.** Where a standing leg is in the image plane, the ratio of culmen to tarsus in pixels tests whether the photo is side-on. Ridgway's means give 66.2 / 38.5 = **1.72** for the dowitcher.

**Long-billed Dowitcher.**

| Measure | `lobdow-side.jpg` (Leighton, Feb, standing) | `lobdow-juv.jpg` (Lindsey, juvenile, walking) | `lobdow-juv-2.jpg` (Littauer, juvenile, standing in water) | `lobdow-dry.jpg` (Baird, first-winter, standing on sand) |
|---|---|---|---|---|
| Culmen endpoints | base (1253, 367), tip (1655, 583) | base (887, 362), tip (668, 527) | base (947, 494), tip (1257, 647) | base (1881, 683), tip (2426, 1097) |
| Scale | 457 px, **0.145 mm/px** | 274 px, **0.241 mm/px** | 346 px, **0.191 mm/px** | 685 px, **0.096 mm/px** |
| Bill direction | 28° below level | 37° | 26° | 37° |
| Tarsus check | standing leg, joint (730, 1030) to foot (770, 1290): 263 px = 38.0 mm; culmen / tarsus in pixels **1.74** against 1.72, so the photo is side-on and the scale holds | not measurable (walking) | feet under water | tarsus to where an out-of-focus kelp stipe in front hides it: 23-28 mm, so about 10 mm of leg and foot is hidden |
| Bill tip to tail tip | 210 mm | 238 mm | 214 mm | 219 mm |
| Tail tip past the wingtip | **+4 mm** | **+6 to +8 mm** (tail raised while walking) | - | **+4 to +6 mm** |
| Longest tertial against the primary tips | covers them | covers them, within 2 mm | - | tertial 2 mm beyond the primary tips |
| Bill depth, from the profile | - | 6.5 mm at 35% of the bill | **7.0 mm** at 10% (AVONET 7.1); 4.3 at 50%; 3.8 at 70%; **3.7 at 90%**; 1.9 at 97.5% | - |
| Bill tip below the base line | no result (pale base) | **0.6-0.7 mm** | **1.0 mm**; the centreline bends in the distal ~30% | no result (sand grains) |
| Visible eye, diameter | 6-7 mm (dark rim included) | 5.2 mm | 5.0 mm, 6.6 with the dark rim | - |
| Culmen / head, feathered outline | 1.5 | 1.7 | 2.1 | - |
| Tail bars | upper tail seen edge-on: white ≈ 2 mm, dark ≈ 3 mm, repeat ≈ 5 mm (rough) | outer tail, seen obliquely: dark ≈ 3.5 mm, white ≈ 1.1 mm, repeat ≈ 4.6 mm | - | dark clearly wider than white |

The bill depth along the bill confirms Ridgway's "terminal third slightly but distinctly expanded": depth falls from 7.0 mm at the base to 3.8 mm at 70% of its length, then holds at 3.7 mm to 90% before the tip closes (Littauer photo).

**Leg, belly and wing heights of a standing dowitcher** (photo-measured; heights are vertical, above the sole of the standing foot):

| Height | `lobdow-side.jpg` (Leighton) | `lobdow-dry.jpg` (Baird), ground from the published tarsus | `lobdow-juv-3.jpg` (irishou), tarsus-scaled | `lobdow-juv.jpg` (Lindsey), walking |
|---|---|---|---|---|
| Ground | sole of the standing foot, y ≈ 1300, on a solid mound | hidden behind the stipe; placed where a 38.5 mm tarsus ends at the measured tilts (y ≈ 2310 for the near leg at 18°, 2357 for the far leg at 6°); I used y ≈ 2325, ± 1.5 mm in height | foot on a log, y ≈ 1347 | a film of water, y ≈ 783 |
| **Intertarsal joint** | **39 mm** (y 1030) | **38 mm** (y 1930) | **37 mm** (0.95 of the tarsus) | not measurable |
| Bare tibia, feathers to joint | 14.6 mm | - | 14.4 mm | - |
| **Lowest point of the belly** | **45 mm** (y 990, just behind the legs); 50 mm where the tibia leaves the feathers | **53 mm** (y 1772, behind the legs) | **50 mm** | **31 mm** above the water, legs flexed |
| **Lowest point of the folded wing** | ≈ **47 mm**: the lower edge of the wing meets the belly line at the rear (fluffed winter bird); wingtip ≈ 55 mm | wingtip **67 mm**; lower edge at mid-body **78 mm** | - | lower edge at mid-body **55 mm**, 24 mm above the belly |
| Wing bottom above the belly | ≈ 2 mm | 14 mm (tip) to 25 mm (mid-body) | - | 24 mm |

- If the Baird ground is taken instead at the top of the stipe (y ≈ 2210), every Baird height drops by 11 mm (joint 27, belly 42). That would make the tarsus 23-28 mm against Ridgway's 33.5-42, so I rejected it.
- `lobdow-juv-3.jpg` stands obliquely on a sloping log, so its culmen is foreshortened. I scaled it by its tarsus (278 px = 38.5 mm), which assumes the tarsus is in the image plane.
- The walking bird's legs are flexed and its body is tipped forward, so its belly is 14-22 mm lower than in the standing birds. A feeding dowitcher is closer to this.

**Summary for the model** (standing, rest pose): intertarsal joint **38 mm** (37-39), bare tibia about **15 mm**, lowest belly **45-53 mm** (mean ≈ 49), folded wing's lower edge **14-25 mm above the belly** when the plumage is sleeked, but down to the belly line when it is fluffed.

**Pectoral Sandpiper.**

| Measure | `pecsan-side.jpg` (ADJ82, juvenile, standing, body level) | `pecsan-side-local.jpg` (Herlyn, juvenile, standing upright) | `pecsan-juv.jpg` (Andrew C, juvenile, foraging) | `pecsan-juv-2.jpg` (scaup, juvenile, walking) |
|---|---|---|---|---|
| Culmen endpoints | base (1513, 772), tip (1285, 974) | base (863, 410), tip (709, 509) | base (1027, 942), tip (773, 1254) | base (745, 499), tip (648, 592) |
| Scale | 305 px, **0.090 mm/px** | 183 px, **0.150 mm/px** | 402 px, **0.068 mm/px** | 134 px, **0.205 mm/px** |
| Bill direction | 42° below level | 33° | 51° | 44° |
| Bill tip to tail tip | **196 mm** (body level, neck forward) | **163 mm** (body tilted, head drawn up over the breast) | 184 mm (head down) | - |
| Bill tip below the base line | **0.5-0.6 mm**, bend in the distal third | no result (pale bill base) | no result (pale bill base against blue) | - |
| Bill depth, from the profile | 5.0 mm at 35%, 4.2 at 50%, 2.5 at 90% | - | - | - |
| Primary tips past the longest buff-fringed tertial | **19-22 mm** | **17 mm** (9 mm if a thin-fringed feather ending further back is the longest tertial) | **≈ 24 mm** | - |
| Tail tip against the wingtip | the two pointed tips end within 1 mm of each other; I could not tell tail from primary | the dark tail tip ends ≈ 1 mm short of the primary tips | the tail's pointed central feather ends level with the primary tips, within about 2 mm | - |
| Visible eye, diameter | 4.5-5.8 mm (dark rim included) | 5.0 mm | 4.7 × 5.4 mm | - |
| Culmen / head, feathered outline | 1.01 | - | - | - |
| Bare tibia, feathers to joint | - | **11-13 mm** (far and near leg) | - | **10 mm** on both legs |
| Tarsus check | feet sunk in mud | 21-24 mm against 26.8: the legs are angled toward the camera or the scale is ≈ 10% small | - | - |

**The Pectoral's bib edge** (photo-measured on `pecsan-juv.jpg`):
- The streaked bib covers the throat, foreneck and breast. Its lower edge crosses the underside about **24 mm ahead of the front of the legs** and runs up and back to the bend of the wing.
- I sampled a path just inside the underside outline, 25 px windows. The local SD of luminance, which measures the streaking, is 25-35 on the bib and under 11 on the belly. It drops across about **40 px, 2.7 mm**. Mean luminance rises from about 175 to 220 over the same span.
- So the edge is sharp to within about 3 mm, which supports the design's test ("brightness jumps from bib to belly within a few millimetres").

**Posture changes the traced length.** The same species traces at 163 mm upright with the head drawn back (`pecsan-side-local.jpg`) and 196 mm with the body level and the neck forward (`pecsan-side.jpg`), a 20% difference; some of it may also be sex (males are 11% longer-winged). The Least model (0.13 m) was traced from a crouched bird with its body level. For the design's Pectoral-to-Least length test to compare like with like, trace the Pectoral with its body level (`pecsan-side.jpg`), or test the ratio on the wing chord instead (1.55 from Ridgway).

These are single photos, so treat each value as +/- 10%. Scale errors from bill-length variation are up to 9% (dowitcher) and 5% (Pectoral) per photo.

---

## 3. Late-September plumage and age in the Willamette Valley

### 3.1 Long-billed Dowitcher

**What the sources say.**
- Pacific Northwest timing: "Coastally, the first adult migrants start arriving from the north in July and are common from July into mid-September. Juveniles start migrating through in mid-August and are common through October ... In eastern Washington, they are rare in late June, but quickly become common in July and remain so through October" [BirdWeb-D]. "They come through Washington later in the fall than their shorter-billed relatives" [BirdWeb-D]. "In the Pacific Northwest and along the central California coast, Short-billeds (*caurinus*) arrive by late June, while Long-billeds arrive by mid-July (Paulson 1993, Roberson 2002)" [Lee & Birch 2006, p. 38].
- Juvenile arrival: "juvenile Long-billeds begin arriving at the very end of August (rarely so) and early September ... juvenal plumage in both species persists into late September and early October. By late October and early November, juveniles have largely molted into basic plumage, although remnants of juvenal-plumage tertials or coverts may still remain (sometimes even until January)" [Lee & Birch 2006, p. 36]. Bent: "A post juvenal molt, beginning in September and lasting until December or later, involves a change of the body plumage, sometimes the tail and some of the wing coverts and scapulars" [Bent 1927, p. 119].
- Adults in autumn: "First fall arrivals of adults in both species are largely in full but worn alternate plumage" [Lee & Birch 2006, p. 36]; "July and August birds are very black above, due to the wearing away of the buff edgings ... The complete postnuptial molt of adults begins in August and is often finished in September" [Bent 1927, p. 119]. Long-billeds "molt their primaries during migration" (Putnam 2005, in [Lee & Birch 2006, p. 38]).
- Washington records "from early August until into November" (Rathbun, in [Bent 1927, p. 120]); late departure dates include "Washington, Seattle, October 9, and Point Chehalis, October 19" [Bent 1927, p. 122].

**iNaturalist, Willamette Valley box** (taxon 3873, research grade, 43.8-45.8 N, 122.5-123.6 W, the box used for the Least; it reaches north to Vancouver, Washington) [iNat query 2026]:

| Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 8 | 11 | 21 | 42 | 51 | 0 | 56 | 58 | 54 | 63 | 14 | 8 |

Autumn passage runs from July to October with no single peak, as BirdWeb's adults-then-juveniles account would give. Life-stage annotations are nearly absent (1 "adult", 0 "juvenile" in September).

**Ageing of the photos** (listed in the appendix). All 62 research-grade records from 11 September to 12 October (2016-2026) were aged from their first photo; 27 by a sub-agent and 35 by me, on the same criteria:
- **Juvenile:** dark-centred scapulars with neat rufous or buff fringes; plain dark tertials with thin pale edges; grey, buff-washed neck and breast [Bent 1927, p. 119; Lee & Birch 2006, p. 39].
- **Adult:** rufous underparts or their remnants, often with plain grey basic feathers coming in [Bent 1927, p. 119; Lee & Birch 2006, p. 36].

Results:
- **18 records: juveniles**, 3 of them (6-12 October) with plain grey first-winter scapulars coming in among the juvenile ones.
- **22 records: probable juveniles** (distant or soft, but juvenile-patterned backs and buffy breasts).
- **2 records: adults**, both on 20 September (2020 and 2025): one bird with rufous-orange underparts, one moulting into grey basic plumage with rufous remnants on the lower belly.
- **2 records: plain grey birds** (14 and 26 September) that could be adults in basic plumage or juveniles well into their moult.
- **18 records: not ageable** (distant, backlit, in flight, fog).
- Of the 44 ageable records, **40 are juveniles or probable juveniles**; counting birds, juveniles outnumber the two adults by at least 40 to 1 (several records show flocks of 8-20 juvenile-type birds).

For contrast, a random sample of 9 records from 15 July to 20 August: **7 show worn adults with rufous underparts** (one a flock of about 10 with yellowlegs), 2 are not ageable, and **none shows a juvenile**. Several of these July birds feed belly-deep.

### 3.2 Pectoral Sandpiper

**What the sources say.**
- Washington: "Migrants are much more common in Washington in fall than spring. Fall visitors start showing up in the interior in small numbers in late June. Their numbers increase into July and August, and by mid-August they are common. By late October, numbers start tapering off ... Coastal birds start arriving in mid-July, but are uncommon through mid-August. From mid-August to October, they are common ... **Most of these birds are juvenile**" [BirdWeb-P].
- The adults leave first: "the adults appear to slip quietly away without collecting into flocks, as soon as the young are able to take care of themselves. As soon as the young have assumed the complete fall plumage, that is about the 10th of August, they gather in large flocks" (Murdoch, Point Barrow, in [Bent 1927, p. 177]).
- New England: "a few adults sometimes appear in July and more come in August; but the main flight, mostly young birds, comes in September and October" [Bent 1927, p. 177]. "It is not abundant and rather irregular on the Pacific coast south of Alaska" [p. 177].
- The juvenal plumage "is apparently worn all through the fall and winter or until the first prenuptial molt in February and March" [Bent 1927, p. 175], so a late-September juvenile is fresh. Adults' "body molt begins in August, but the wings are not molted until the bird reaches its winter home" [p. 175].
- AAB: "particularly in fall, when records span July through October and often later" [AAB-P-O].

**iNaturalist, Willamette Valley box** (taxon 3865) [iNat query 2026]:

| Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 0 | 0 | 1 | 3 | 1 | 8 | 28 | 48 | 11 | 1 | 0 |

A September peak: 48 of 101 records. No life-stage annotations in September.

**Ageing of the photos.** All 32 research-grade records from 11 September to 12 October (2013-2026) were aged, on these criteria [Ridgway 1919, p. 270; Bent 1927, p. 175; AAB-P]: a juvenile has neat rufous, buff and white fringes on the mantle and scapulars, white braces, and a crisp buff-washed, finely streaked bib; an adult in autumn is worn and faded, without braces.
- **22 records: juveniles** (three records with 2, 3 and 5 birds).
- **8 records: probable juveniles.**
- **No adults.**
- **2 records: not ageable** (in flight; distant).
- One record (5 October 2025) shows a Pectoral beside a Least Sandpiper, clearly the larger bird: the pairing the game shows.

### 3.3 Recommendation

- **Long-billed Dowitcher: model a juvenile.**
  - Adults pass in July and August in worn breeding plumage (7 of 7 ageable July-August records), and "into mid-September" on the coast [BirdWeb-D].
  - In late September the Willamette birds are juveniles: 40 of 44 ageable records from 11 September to 12 October, and the only two adults are on 20 September, in moult.
  - A late-September juvenile may already show a few plain grey first-winter scapulars; by October some birds are clearly moulting (section 4.1). One plumage, the fresh juvenile, is right for the game.
- **Pectoral Sandpiper: model a juvenile.**
  - "Most of these birds are juvenile" [BirdWeb-P], and all 30 ageable Willamette records from mid-September to mid-October are juveniles.
  - The two game birds should be one size, at the mean of the sexes, as the design says. The flocks the sources describe after August are "young birds" of both sexes.

---

## 4. Field marks of the recommended plumages

These are colour words from the sources; I have not invented hex values. "(photo)" marks my observation on the juvenile reference photos (`lobdow-juv.jpg`, `lobdow-juv-2.jpg`, `lobdow-juv-3.jpg`; `pecsan-juv.jpg`, `pecsan-side.jpg`, `pecsan-juv-2.jpg`). Two of the Pectoral photos were taken in low, warm sun, which pushes buff toward orange.

### 4.1 Long-billed Dowitcher, juvenile (sexes alike)

The base descriptions:
- Ridgway gives no separate juvenile for *scolopaceus* ("Similar in coloration to *L. griseus griseus*") [Ridgway 1919, p. 201]. For *griseus*: "Young.—Back, scapulars, and tertials variegated with black and light clay color, the latter chiefly on edges of the feathers; under parts dull whitish, more or less suffused with dull buff or pale clay color, especially on chest, which, together with sides, is usually more or less speckled with dusky; otherwise much like winter adults" [Ridgway 1919, pp. 197-198]. The winter adult: "Head, neck, back, scapulars, and wing-coverts nearly plain gray, the chest and sides also gray ... an indistinct whitish superciliary stripe" [p. 197].
- Bent, who covers both dowitchers under the Long-billed: "In fresh juvenal plumage in July in Alaska, the crown, back, and scapulars are black, broadly edged with 'cinnamon rufous' or 'hazel'; the throat, breast, and flanks are gray, the feathers broadly tipped with 'ochraceous tawny' and streaked with black or spotted with dusky; the tertials, innermost greater coverts, and the median coverts are edged with 'cinnamon buff.' These edgings are much browner in *scolopaceus* and paler buff in *griseus*" [Bent 1927, p. 119].
- "Fresh juveniles have blackish back feathers neatly edged rufous, buffy, or pale rusty. All plumages show long pale supercilium (eyebrow) and a white back between wings" [AAB-D]. Captions: "Juveniles are grayish overall with rusty edging on feathers"; "Juveniles have a grayish breast and are mottled brown and cinnamon above" [AAB-D gallery].
- "Juveniles in fall dark on upperparts, with very narrow pale feather edgings" [Audubon-D].
- "The juvenile Short-billed is brighter than the Long-billed, with light edging on its feathers. The Short-billed juvenile has bright edging and internal markings on the tertial feathers. The Long-billed juvenile is drabber and darker than the Short-billed" [BirdWeb-D].

By feather group:
- **Cap:** dark grey-brown, finely streaked darker, with little rufous (photo). Juvenile Short-billed has a dark brown crown of "chestnut ground coloration upon which are superimposed fine black streaks", and "On juvenal-plumage Long-bills, the crown is slightly grayer, showing slightly less contrast with the rest of the plumage" [Lee & Birch 2006, p. 39].
- **Supercilium:** whitish, from the base of the bill to a little behind the eye; brightest in front of the eye (photo). "In Long-billed, the supercilium is thinner" and "subtly straighter" than Short-billed's arched, front-flared one [Lee & Birch 2006, p. 35].
- **Loral and eye line:** a dark line from the base of the bill to the eye, continuing as a dusky smudge behind the eye; grey cheek (photo). Ridgway's breeding *griseus* has "lores thickly flecked with dusky, forming a broad (sometimes nearly 'solid') stripe from bill to eye" [Ridgway 1919, p. 197].
- **Neck and breast:** plain grey, a smooth grey hood from the chin to the lower breast, with only faint fine dusky speckling at the sides of the lower breast and, on fresh birds, a faint buff wash there (photo, all three juveniles). This is the "grayish breast" [AAB-D gallery] and Ridgway's chest "suffused with dull buff ... speckled with dusky". The grey ends softly against a white belly, well behind the bend of the wing (photo), not in a sharp line.
- **Mantle and scapulars:** dark brown-black centres with narrow rufous ("cinnamon rufous", "hazel") fringes; the upper scapulars have a rufous edge and small rufous notches; the lower scapulars are greyer with thin buff edges (photo) [Bent 1927, p. 119]. Short-billed's are "more strongly marked owing to brighter and bolder buff fringes" [Lee & Birch 2006, p. 39].
- **Wing coverts:** grey-brown with thin whitish-buff fringes. Juvenile greater coverts on Long-billed are "typically uniform gray" [Lee & Birch 2006, p. 39].
- **Tertials:** plain dark grey-brown with a thin buff or cinnamon edge (photo, `lobdow-juv.jpg`). "Fresh juvenal tertials on Short-billed are overall dark gray, but are fringed with contrasting buff/orange edges and are internally marked by strong buff/orange stripes, the latter giving a 'tiger-striped' appearance (see Paulson 1993). In contrast, Long-billed tertials are dark gray with narrower buff edges and duller to no internal markings. It is often erroneously stated that juvenal Long-billed tertials lack internal markings altogether" [Lee & Birch 2006, p. 39]. At 22 m, faint internal marks are invisible: paint them plain.
- **Flanks and undertail:** white, with dusky spots and short bars on the flanks, heaviest toward the rear; the undertail coverts white with bold blackish bars and chevrons (photo, `lobdow-juv.jpg`). Adults in basic plumage have flanks "washed with dusky or dark gray vertical bars", Short-billed "paler gray splotches or spots" [Lee & Birch 2006, p. 40].
- **Tail:** white, barred blackish across its whole length [Ridgway 1919, p. 196]. In *griseus* the bars and white interspaces are "of approximately equal width" [p. 197]; "on Long-billed, the black bars are wider than the white (or buff in alternate plumage) bars, sometimes even twice as wide" [Lee & Birch 2006, p. 39]. On two photos the dark bars measure about 3-3.5 mm and the white 1-2 mm, repeating every 4.5-5 mm (photo-measured, oblique views). That is about 12 dark bars along a 56 mm tail (computed; low confidence). Lee & Birch warn of overlap with Pacific Short-billed.
- **Back and rump:** a white wedge from the lower back to the rump, "often immaculate" on the lower back, the rump spotted and the uppertail coverts barred [Ridgway 1919, p. 196]; "a distinctive white blaze up their backs" in flight [BirdWeb-D]. **Hidden at rest**: none of the standing or walking photos shows any white on the back; the folded wings and tertials cover it (photo).
- **Underwing** (flight only): "axillars and under wing-coverts white with V-shaped bars of dusky" [Ridgway 1919, p. 196].
- **Legs:** "light yellowish olive or greenish olive (in life)" [Ridgway 1919, p. 197]; olive-yellow to greenish-yellow on the photos.
- **Bill:** "bill blackish, passing into olivaceous basally (in life)" [Ridgway 1919, p. 197]; on the photos, blackish with a dull olive-green base over the basal third to half.
- **Iris:** "dark brown" [Ridgway 1919, p. 197].

**Late September.** The post-juvenal moult begins in September [Bent 1927, p. 119]: "A post juvenal molt, beginning in September and lasting until December or later, involves a change of the body plumage, sometimes the tail and some of the wing coverts and scapulars." "Juvenal plumage in both species persists into late September and early October. By late October and early November, juveniles have largely molted into basic plumage" [Lee & Birch 2006, p. 36]. So a late-September juvenile may show a few plain grey first-winter scapulars among the juvenile ones (section 3).

### 4.2 Pectoral Sandpiper, juvenile

The base descriptions:
- Ridgway: "Young.—Similar to the summer adult but scapulars and outermost interscapulars margined terminally on outer webs with white, and the chest, etc., more buffy and more narrowly or less sharply streaked" [Ridgway 1919, p. 270]. The summer adult he refers to is quoted by feather group below [pp. 269-270].
- Bent: "The juvenal plumage is much like that of the summer adult, except that the feathers of the mantle, scapulars, and the median and lesser wing coverts are edged with brighter colors, 'tawny,' 'ochraceous-buff,' and creamy white; and the breast is more buffy or yellowish. This plumage is apparently worn all through the fall and winter or until the first prenuptial molt in February and March" [Bent 1927, p. 175].
- "Adults are patterned in brown, gold, and black above, with white belly and neat dark-brown rows of stipples on the breast that stop sharply at the white belly. Juveniles are similar but with some rusty-edged feathers above. The legs are yellowish" [AAB-P]. Juvenile caption: "Juvenile has a finely streaked breast that forms a sharp border with its white belly. Feathers on the back have rufous edging" [AAB-P gallery].
- "Described as a larger version of a Least Sandpiper ... heavily streaked breast, sharply contrasting clear, white belly, and yellowish legs. The bill droops and is black at the tip, and lighter brown at the base" [BirdWeb-P].

By feather group:
- **The bib:** a buff-washed foreneck and breast covered in fine dark brown streaks, short dashes arranged in rows (photo); "dull brownish white (inclining to pale buffy grayish brown on chest) distinctly streaked with dusky" in the adult [Ridgway 1919, p. 270], "more buffy and more narrowly or less sharply streaked" in the young. The chin and upper throat are paler, "immaculate white or buffy white" [p. 270].
  - **The edge:** "the dark markings on its neck end abruptly on the white breast, breaking up the outline" [Bent 1927, p. 176]; "Sharp contrast separates brown streaked breast from white belly" [Audubon-P]. On `pecsan-juv.jpg` the edge crosses the underside about 24 mm ahead of the front of the legs, on the lower breast, and climbs back and up to the bend of the wing. The streaking stops within about 3 mm (photo-measured, section 2.7). It is a clean horizontal-to-diagonal line, not a ragged fade.
- **Belly, flanks and undertail:** "rest of under parts immaculate white, or buffy white, the sides and flanks, however, usually with a few narrow shaft streaks of dusky" [Ridgway 1919, p. 270].
- **Crown:** a warm rufous-brown cap streaked with black (photo). In the adult "the black streaks, rather broader than the buffy drab ones" [Ridgway 1919, p. 269]; the juvenile's edges are the brighter "tawny" [Bent 1927, p. 175].
- **Supercilium:** "a superciliary stripe of dull white, narrowly streaked, especially posteriorly, with dusky" [Ridgway 1919, p. 270]; a faint whitish-buff eyebrow, clearest over the eye (photo).
- **Lores and cheek:** "an indistinct loral stripe of light grayish brown, minutely flecked with dusky, the upper portion of auricular region light brown narrowly streaked with dusky" [Ridgway 1919, p. 270]; a dusky loral smudge and finely streaked buff cheeks (photo).
- **Mantle "braces":** the white outer-web edges of the "scapulars and outermost interscapulars" [Ridgway 1919, p. 270] line up into two white lines along the sides of the mantle, converging forward into a V (photo, all three juveniles). Bent's "creamy white" edgings [Bent 1927, p. 175].
- **Scapulars:** black centres ("the black predominating on scapulars and interscapulars, in the form of central spots" [Ridgway 1919, p. 269]) with bright fringes: rufous ("tawny") on the upper scapulars, buff ("ochraceous-buff") and white ("creamy white") on the lower [Bent 1927, p. 175]; on the photos the fringes are warm rufous on the upper rows and whitish on the lowest.
- **Wing coverts:** grey-brown centres with buff fringes ("grayish brown or drab distinctly, but not sharply, margined with paler", brighter in the juvenile) [Ridgway 1919, p. 269; Bent 1927, p. 175].
- **Tertials:** dark brown, pointed ("acuminate" in the larger *Pisobia* [Ridgway 1919, p. 267, footnote c]), with rufous-buff fringes (photo).
- **Primaries:** blackish brown, projecting 17-24 mm beyond the longest tertial (photo-measured, three photos).
- **Rump and tail** (flight): "rump and median upper tail-coverts sooty black ... the lateral upper tail-coverts white with a median cuneate or sagittate streak of dusky"; "middle pair of rectrices dusky ... the rest of tail light grayish brown or pale drab" [Ridgway 1919, pp. 269-270]; "The pale-gray, almost white, tail with its dark, almost black, center and rump, is conspicuous in flight" [Bent 1927, p. 176].
- **Legs:** "dull greenish yellow or yellowish green in life" [Ridgway 1919, p. 270]; "short olive-yellow legs" [Bent 1927, p. 176]; "yellowish" [AAB-P; BirdWeb-P]. They read golden- to ochre-yellow on the sunlit photos, dull olive-yellow on the flat-light one (`pecsan-juv-2.jpg`).
- **Bill:** "bill blackish terminally, more brownish basally (where dull greenish yellow in life)" [Ridgway 1919, p. 270]; "black at the tip, and lighter brown at the base" [BirdWeb-P]. On the photos the basal half is pale olive-buff to yellowish-brown and the distal 40-50% blackish.
- **Iris:** "brown" [Ridgway 1919, p. 270].

**Corrections and refinements to the design's marks:**
- Dowitcher tertials: "plain dark with thin pale edges and **duller to no** internal markings". "No internal markings" is the common overstatement Lee & Birch correct; painting them plain is still right at 22 m.
- Dowitcher neck and breast: plain grey, with the grey ending softly against the white belly. It is not a bib with an edge; that contrast is the Pectoral's mark.
- Dowitcher flanks: spotted and short-barred, heaviest at the rear and on the undertail coverts. "Finely barred" is acceptable.
- Pectoral legs: the sources say olive-yellow or greenish-yellow, not "yellow-ochre". The painted colour should be a dull yellow with a slight green cast.
- Everything else in the design's two lists is supported.

---

## 5. Structure

### 5.1 Long-billed Dowitcher

- **Bill.**
  - Shape: "straight, compressed for proximal two-thirds, the terminal third slightly but distinctly expanded, depressed, and minutely punctulate; culmen ascending basally, the base of bill much higher than wide" [Ridgway 1919, p. 196]. The punctulate tip carries "many tactile receptors called Herbst corpuscles that allow dowitchers to locate prey by touch" [AAB-D-O].
  - Straightness: "On Short-billed, the bill begins to gently curve downward about one third of the way from the tip ... On Long-billed, the bill is typically very straight along most of its length" [Lee & Birch 2006, p. 35]. They add that both species "can temporarily alter the shape of their bills when feeding or probing".
  - How much droop: on two photos the tip sits **0.6-0.7 mm and 1.0 mm** below the extension of the proximal centreline, with the bend in the distal ~30% (photo-measured, section 2.7). That is 1-1.5% of the culmen: straight, with the slightest droop at the tip.
  - Depth: 7.0-7.1 mm at the base against a width of 4.5 [Tobias et al. 2022; photo], "much higher than wide".
  - Taper: blunt. Depth falls to 3.8 mm at 70% of the length and then holds at 3.7 mm to 90% before closing (photo-measured). Model it with a low `taper` and a rounded, slightly swollen tip, not the fine point of the Least or Pectoral.
- **Bill against head:** culmen / head **2.30** (USGS September juveniles), section 2.4. "Front heavy, chunky shorebird with a long bill (twice as long as its head)" [AAB-D gallery].
- **Primary projection:** none. "Tertials elongated, tapering distally but rounded at tips, the longest falling decidedly short of tip of longest primary" [Ridgway 1919, p. 196] describes the spread museum wing. At rest: "Note further that the primaries do not project beyond the longest tertial" and "the short primary projection" [Lee & Birch 2006, p. 40, Fig. 9 captions; also p. 38, Fig. 2]; Short-billed shows "the long primary projection" [p. 39, Fig. 5]. On all three photos where the rear is clear, the tertials cover the primary tips (photo).
- **Wingtip against tail:** the tail tip reaches **4-8 mm past the wingtip** (photo-measured on three photos: +4, +4 to +6, +6 to +8, the last with the tail raised). "Long-billed tends to have a longer tail, a more tapered or attenuated rear, and a slightly 'cocked' tail appearance", with the lower back showing "a slight indentation or concavity" [Lee & Birch 2006, p. 36]. The design's "wingtips about even with the tail" is right, with the tail slightly longer.
- **Tail shape:** "very slightly rounded" [Ridgway 1919, p. 196]. Use `rounded`. The tail is short: 56 mm, 0.39 of the wing.
- **Posture:**
  - "A plump, medium-sized shorebird with a very long bill, relatively long legs, and short tail" [AAB-D]; "chunky with a short neck and a very long bill" [Audubon-D].
  - "Front heavy, chunky shorebird with a round underbelly"; "Note rather hunchbacked profile while foraging"; "When foraging the back looks humped, unlike the flat-backed Short-billed Dowitcher. Note chunky, front-heavy posture" [AAB-D gallery captions].
  - At rest the neck is drawn in and the bill points 26-37° below level (photo, four birds). Between strokes, feeding birds "held the bill inclined at about 70° or 80° to the horizontal" [Burton 1972, p. 66].
- **Eye:** visible eye 5.0-5.2 mm across, 6-7 mm with the dark rim (photo-measured). Model `eye.radius` ≈ 2.7 mm.
- **Legs:**
  - Tarsus 38.5 mm (mean of the sexes), "much shorter than exposed culmen" [Ridgway 1919, p. 196]; culmen / tarsus 1.72.
  - Bare tibia "decidedly shorter than middle toe without claw" (27 mm) [Ridgway 1919, p. 196]; **14.4-14.6 mm** on two photos.
  - "Long-billeds have slightly longer legs than Short-billeds ... The effect ... is that in mixed flocks, Long-billeds are often seen wading in slightly deeper water" [Lee & Birch 2006, p. 36].
- **Heights above the ground when standing** (photo-measured, section 2.7):
  - (a) intertarsal joint **38 mm** (37-39, three photos);
  - (b) lowest point of the belly **49 mm** (45-53, three photos); a walking, flexed-legged bird carries it at 31 mm;
  - (c) lowest point of the folded wing **14-25 mm above the belly** when sleeked (two photos: 55-78 mm above the ground), but at the belly line on a fluffed February bird (47 mm).

### 5.2 Pectoral Sandpiper

- **Bill.**
  - "A stout, medium-sized shorebird with a moderately long, fairly thick-based bill" [AAB-P]; "The bill droops" [BirdWeb-P]; *Pisobia*: straight, "tapering distally in lateral profile", with a "faintly decurved tip" [Ridgway 1919, p. 267].
  - Droop: **0.5-0.6 mm** on `pecsan-side.jpg`, in the distal third (photo-measured). That is 2% of the culmen, the same proportion as the Least (0.3-0.45 mm on 18 mm).
  - Depth 4.8 mm and width 3.4 mm at the nostril [Tobias et al. 2022]. Taper to a fine point, as the Least.
- **Bill against head:** culmen / head **1.09** (USGS, n=32), section 2.4. Culmen / diagonal tarsus 0.99 (USGS).
- **Head and neck:**
  - Small head: head / mass^(1/3) = 6.2 against 6.5-7.0 for nine other shorebirds (computed, section 2.4).
  - Longer neck, stretched shape: "Might suggest Least Sandpiper ... but much larger, with more stretched-out shape" [Audubon-P]; "when they are disturbed, they stand upright with their necks extended, peering over the grass" [BirdWeb-P]; "Often it stands perfectly still with its head held high, watching an intruder" [Bent 1927, p. 176].
  - Body "stout" [AAB-P], full in the breast and tapering to long wingtips (photo).
- **Primary projection:** **17-24 mm** past the longest tertial (photo-measured, three photos). AAB: "long wings" [AAB-P]. Kipp's distance 67 mm, 54% of the wing [Tobias et al. 2022]. This separates it from the Least, which has "no extension past the tertials".
- **Wingtip against tail:** about even. On both photos the pointed central tail feathers and the primary tips end within 1-2 mm of each other (photo-measured).
- **Tail shape:** "the tail slightly rounded", with the middle pair "acuminate" and "projecting, more or less, beyond the rest" [Ridgway 1919, pp. 267-268]. Use `rounded`; `wedge` if the pointed centre should show in flight.
- **Eye:** visible eye 4.7-5.4 mm (photo-measured). Model `eye.radius` ≈ 2.5 mm.
- **Legs:** tarsus 26.8 mm (mean of the sexes); bare tibia "about as long as first two phalanges of middle toe, or a little shorter" [Ridgway 1919, p. 267], **10-13 mm** on two photos (photo-measured). "Short olive-yellow legs" [Bent 1927, p. 176].

---

## 6. Foraging

### 6.1 Long-billed Dowitcher (`dowitcher` style)

**What the sources say.**
- **The "sewing machine".**
  - "Long-billed Dowitchers probe deeply into mud or sand with an up-and-down motion likened to the needle of a sewing machine" [AAB-D]; "Has a distinctive sewing-machine-like feeding behavior"; "sewing-machine-like head motion while feeding" [AAB-D gallery].
  - "They walk along slowly, lifting their heads up and down like a sewing machine" [BirdWeb-D].
  - "Usually deliberate in its feeding, standing in one spot or moving forward slowly" [Audubon-D].
  - Bent, for both dowitchers: "Although not inclined to move about actively, their feeding motions are very rapid, as they probe in the mud or sand with quick, perpendicular strokes of their long bills, driving them in their full length again and again in rapid succession; while feeding in shallow water the whole head is frequently immersed and sometimes several strokes are made with the head under water" [Bent 1927, p. 110].
  - Bent, Washington fall birds (Rathbun): "they give the impression of being somewhat deliberate in their actions" [Bent 1927, p. 120].
- **The only timed study: Burton 1972**, Padre Island, Texas, April 1969, dowitchers "mostly *L. griseus*" (Short-billed), watched by telescope and timed from tape-recorded commentaries [Burton 1972, pp. 63-66]:
  - Two actions. "Jabs.—These are simple, brief movements in which the bill is thrust into the mud and immediately withdrawn." "Probes.—More prolonged movements in which the bill is thrust into the mud and held there for a short time, usually accompanied by a rapid up-and-down quivering action" [p. 65].
  - Timing: jabs "generally too rapid for accurate timing, though apparently under 0.5 seconds in duration. 103 probes timed averaged 1.7 seconds, with maxima of 4.1 and 7.3 seconds" [p. 65].
  - Depth: "Probes are generally deeper than jabs, mostly between one third and the full length of the bill (where depth of insertion could be clearly seen), whereas most jabs were to less than half the bill length" [p. 65].
  - **Rate: "The mean rate during 61 minutes of timed observations (Table 2) was 60.6 (min. 36, max. 110)" feeding movements per minute; 47.8% jabs, 52.2% probes (3694 movements)** [p. 66]. That is **1.0 per second** on average, 0.6-1.8 per second by the minute (computed). The per-minute rates cluster at 50-69 (38 of 61 minutes).
  - A caveat on the arithmetic (computed): 31.6 probes a minute at 1.7 s each would fill 54 s of every minute, leaving 6 s for 29 jabs and the lifts between them. The probe mean is probably inflated by the long, timeable probes.
  - Bouts and movement: "Most commonly, a bird would concentrate on a small area for about 30 seconds, probing around itself with pivoting movements of the body and a leisurely step or two; then walk on more briskly for a few seconds, and pause to repeat the process. Long series of jabs were sometimes made while walking steadily forwards; however, these could not be confused with the stitching of Stilt Sandpipers and *Calidris* spp., as the frequency of jabs was far less rapid, and the bill was raised well clear of the mud between each" [p. 66].
  - Bill angle: "Between feeding actions, dowitchers held the bill inclined at about 70° or 80° to the horizontal" [p. 66].
  - Burton's conclusion: "Dowitchers do not 'stitch' but employ isolated (though frequent) deep jabs and probes, which are often prolonged and vigorous" [p. 63]. In his terms "stitching" is a Stilt Sandpiper's or Dunlin's "very rapid series of shallow jabs"; his Stilt Sandpiper stitching sequences lasted 2.3 s on average (max 13.7, n=321) [p. 65].
  - From the comparison: "the jabs of dowitchers regularly penetrate to a third or more of their considerable bill length"; "Probes in both species are made with a similar quivering action, but Stilt Sandpipers never exhibit the vigor and forcefulness which is often shown by probing Dowitchers"; "since the head is fully raised and lowered between each one ... the amount of energy expended in proportion to the number of contacts with prey may well be greater in dowitchers" [Burton 1972, p. 67].
  - So in Burton's timing the dowitcher makes about one jab or probe a second, the bill raised "well clear" between jabs, with a fast quiver inside each probe. The video below shows how that looks from the side.
- **Head under water:**
  - "while feeding in shallow water the whole head is frequently immersed and sometimes several strokes are made with the head under water" [Bent 1927, p. 110].
  - "sometimes probing so deeply that their heads are underwater" [AAB-D-LH].
- **Time budget:** on Texas playas "Long-billed Dowitchers spent 77% of their time feeding in spring, but spent more time sleeping and less feeding in fall", and all four species "spent minimal time engaged in locomotion, body maintenance, alert, and aggressive behaviors" [Davis & Smith 1998, p. 266]. Dowitchers were in the fewest aggressive encounters of the four [p. 269]. So look-ups are brief and uncommon; the study gives no per-bout number.
- **Feeding method:** on the same playas the dowitchers' feeding-method diversity was 1.00 +/- 0.00 in both seasons [Davis & Smith 2001, p. 488, Table 2], which on their index means a single method; by the paper's definitions that is probing, the bill penetrating "the substrate or water surface greater than one-fourth the total length of the bill" rather than pecking at less than a quarter [p. 486]. The single-method reading is mine.
- **Flock:**
  - From Bent's Eastern Dowitcher account ("I have never been able to discover any differences in behavior between the two forms" [Bent 1927, p. 120]): "When a flock of dowitchers alights the birds are closely bunched, but they soon scatter out and begin to feed" [Bent 1927, p. 111].
  - "They are then often concentrated in compact groups or strung out in a long line, close to the edge of the water, probing in the soft mud with quick strokes of their long bills" [Bent 1927, p. 112].
  - "Flocks twitter at each other while feeding" [AAB-D-O].
  - When a feeding bird "seemed to lose a footing" in deep water "a retreat would be made into a more shallow part"; resting birds stood "on but one leg" [Bent 1927, p. 120].
  - **No source I could read gives nearest-neighbour distances.**
- **Water depth:** section 7.

**Video estimates (estimate, by eye).** No source gives stroke rates for Long-billed specifically, nor bout lengths, creep, look-ups or spacing, so these come from CC-licensed video.
- **Wikimedia Commons has no video of either species**, and Macaulay Library pages could not be opened by script. The clips are YouTube videos their uploaders licensed CC BY, plus one CC BY-NC-SA Flickr video. They were downloaded, frames extracted at the full frame rate, tiled into contact sheets and read by eye. Where noted, a simple dark-blob tracker followed the head.
- The clips:
  - [jerry24470 2026]: Tainan, Taiwan, 17 August 2026. One bird wading, three-quarter rear view. 1080p at 59.94 fps; 0-15 s.
  - [Possen 2022a]: breeding-plumage adult, side-on, fixed camera, shallow water. 1080p at 30 fps; 0-48.7 s.
  - [Possen 2022b]: same site and plumage. 1080p at 30 fps; 0-58.7 s at 2-6 fps.
  - [Possen 2024]: a bird belly-deep beside a female Northern Pintail. 1080p at 60 fps; 1.5-12.5 s.
  - [Pete 2017]: "Dowitcher sp." on wet mud at Iona, Vancouver, 29 April 2017. 640x360 at 59.94 fps; frames at 2 s and 8 s.
- **Two sizes of stroke.**
  - **Small strokes**, the bill staying in and the head bobbing a centimetre or two: about **6 per second** in [jerry24470 2026]. The head tracker counted 84 cycles in 13.7 s (6.1/s; windows 5.2-7.4/s), median interval 0.12-0.15 s. Small-amplitude cycles may include tracker noise; at 6.35-7.15 s the 60 fps sheet shows the head bobbing with the bill kept in.
  - **Large strokes**, the bill coming half or more out of the water: about **3-3.5 per second**. Tracker cycles of at least 10 px (about 5% of body length): 43 in 15 s. By eye in [Possen 2022a], 17.7-20.3 s: withdrawals at 17.82, 18.05, 18.23, 18.75, 19.20, 19.50 and 19.82 s, 7 in 2.0 s, at intervals of 0.10-0.52 s. At 1.0-4.9 s the tracker gives 4.2/s.
- **Bouts and look-ups** ([Possen 2022a] at 2 fps; [Possen 2022b] at 2-6 fps):
  - Stitching bouts between head-ups: **about 3.5-13.5 s** (in [Possen 2022a]: 0.6-13.5, 17.5-21, 21.5-35 and 43.5-48.5 s).
  - Full look-ups with the head at rest height: **about 1.5-3.5 s** (13.5-17 s and 35-38.5 s, the second with preening; one 0.5 s look at 21 s; 0-1.8 s in [Possen 2022b]).
  - Brief lifts of **0.3-0.5 s**, bill out but head still low, every **about 2-5 s** ([Possen 2022b]: at about 5.5, 9.5, 20.5, 24, 25.5, 27 and 29.5 s).
- **Creep while stitching** ([Possen 2022a], 1.0-4.0 s; the camera is fixed, a reed clump staying within ±2 px over 0-35 s; scale 0.42 mm/px from a 147 px culmen taken as 62 mm):
  - The body moved about 70 mm in 3 s while the bird kept stitching: **about 2-2.5 cm/s**.
  - Steps at about 1.2, 2.75 and 3.85 s: **one step every 1.1-1.5 s, each about 2-3 cm**. The bill stayed in the water through each step.
- **Head under water:**
  - Not in [Possen 2022a], in about 2-3 cm of water: at the bottom of a stroke the whole bill is under and the eye is only 3-5 mm above the surface.
  - Not in [jerry24470 2026]: the face reaches the water.
  - **Yes in [Possen 2024]**, belly-deep, level with the pintail's waterline: the head goes under at about 4.7-5.3 s and 8-10 s.
  - So the face touches the water at every stroke, and the head goes under when the water is belly-deep, as Bent and AAB say.
- **Probe depth** ([Possen 2022a], low confidence): the bill is fully under at every stroke bottom with the face at a surface about 2-3 cm up, so about **35-45 mm of a 62 mm bill (60-70%)** is in the mud. At a withdrawal about half the bill shows, so a large stroke moves the tip about **30 mm**.
- **Water in the clips:** [Possen 2022a] about 2-3 cm, 20-30 mm below the belly, covering the lower tarsus but not the joint; [jerry24470 2026] similar; [Possen 2024] belly-deep.
- **Flock spacing** ([Pete 2017], species not given, probably Long-billed at a fresh-water site in spring): three birds on wet mud stood 110-180 px apart centre to centre, against a body length of 110-120 px: **about 1-1.5 body lengths, 0.3-0.4 m**. Two birds at 2.0 s were about 0.5 m apart. Perspective ignored.

**Reconciling the rates.** Burton's ~1 movement per second counts whole jabs and probes, with the head "fully raised and lowered between each one". The video's 3-3.5 large strokes per second are partial withdrawals, the bill coming half out of the water; its ~6 small strokes per second are the head bobbing with the bill in, which is what Burton describes as the "rapid up-and-down quivering action" inside a probe. So the picture a birder calls a sewing machine is fast, small up-and-down strokes of the bill in the mud, several a second, broken every few seconds by a fuller lift. For the design's `stitch` state (the bill cycling between `reach` about 0.7 and 1, "several strokes a second"), the video's large strokes are the right unit: **about 3 per second**.

These are one to three birds, mostly spring adults at unstated sites, not late-September juveniles; treat them as settings, not measurements.

### 6.2 Pectoral Sandpiper (`sandpiper` style)

**What the sources say.**
- "It moves about slowly while feeding, probing in the mud with rapid strokes" [Bent 1927, p. 176].
- "Pectoral Sandpipers pick and probe in mud for insects and other invertebrates. They use both sight and touch to find prey as they walk slowly through wetlands. Mostly they forage in or near vegetation rather than in exposed areas" [AAB-P-LH].
- "Pectoral Sandpipers move along steadily with their heads down, picking up prey on the surface and probing lightly into the sand or mud" [BirdWeb-P].
- "Forages by picking up items from surface of ground, also by probing in mud or shallow water" [Audubon-P].
- Depth: spring migrants in North Dakota fed in water **22.6 +/- 17.8 mm (SD, n=32)** [Eldridge et al. 2009, p. 251]. That is ankle-deep for a 27 mm tarsus; the game's damp mudflat is at the dry end of this.
- Grouping: "It is often found in wisps or scattered flocks, the individuals widely separated and crouching in the grass" [Bent 1927, p. 175]. They "usually flock by themselves but are sometimes associated, purely fortuitously I believe, with other species ... such as Wilson snipe, Baird, least or semipalmated sandpipers" [p. 176].
- **No source I could read gives a Pectoral walking speed, step rate, or peck rate.**

**Video estimates (estimate, by eye).**
- The clips (all CC BY on YouTube):
  - [Jones 2026]: two juveniles at Carsington Water, Derbyshire, uploaded 18 September 2026. 1080p at 60 fps; 292.7-297.6 s and 317.7-320.7 s.
  - [Fossé 2012]: a juvenile at Ste-Gemmes-sur-Loire, France, 8 September 2012. 640x480 at 30 fps; 0-9 s.
  - [Fossé 2021]: Maine-et-Loire, France, 22 September 2021. 1080p at 25 fps; 45-61 s.
- **Feeding rhythm:** bill-down bouts rather than a steady peck rhythm.
  - In [Jones 2026] one juvenile kept its bill in shallow water for **at least 4.9 s** with only small head shifts and no lift, and again for at least 3 s. The other stood head-up and still for at least 4.9 s.
  - In [Fossé 2012], walking slowly on wet mud: bill-down bouts of **about 0.6-1.6 s** (0-0.57, 2.0-3.0, 5.0-6.6, 7.1-7.8, 8.0-8.6 s), separated by head-up pauses of **about 0.15-0.45 s**; about **3 steps per second** while walking with the head raised (1.0-1.9 s).
  - Discrete pecks inside the bill-down bouts could not be counted at these resolutions.
- **Walking speed:** in [Fossé 2021], 55-61 s, with the camera fixed (a pale stone within ±2 px), a feeding bird, probably the Pectoral (Dunlins are also present), walked about 4.7 of its own body lengths in 6 s with its head down: **about 0.15 m/s** at 0.2 m per body length. Low confidence in identity and scale.

**Against the `sandpiper` table** (walk 0.1 m/s, 2.5 pecks/s, probe bouts of 2-5 at 3/s):
- Walking speed: 0.1-0.15 m/s on the video, "moves about slowly" [Bent 1927, p. 176], "walk slowly" [AAB-P-LH]. **Fits.**
- Pecks: no count. The Pectorals hold the bill down longer than the table's stroke rhythm implies: bouts of 0.6-5 s broken by 0.15-0.45 s head-ups. "Probing in the mud with rapid strokes" [Bent 1927, p. 176] fits the table's 3 probes a second inside those bouts.
- The design keeps the `sandpiper` style unchanged for the Pectoral. At 22 m that reads acceptably. A longer on-the-spot bout (about 1-2 s) or a higher `probe.chance` would be closer to these clips (section 11).

---

## 7. The depth band for `shallows-edge`

### 7.1 What the sources say about feeding depth

| Source | Depth | Notes |
|---|---|---|
| [Davis & Smith 2001, p. 488, Table 2] | **Fall 6.36 +/- 0.27 cm (SE, n=64); spring 4.16 +/- 0.26 cm (n=92)** | Long-billed Dowitchers on Texas playas, 1993-1994. Five depth readings at random points on a transect through each collected bird's foraging area [p. 486]. The only measured, species-specific figure I found. Least Sandpipers in the same study: 1.06 (fall) and 1.19 (spring) cm |
| same, SD (computed) | fall ≈ 2.2 cm, spring ≈ 2.5 cm | SE × √n, assuming n is birds. A normal fall distribution puts the central 90% at about 2.8-9.9 cm |
| [AAB-D] | "They tend to forage in water less than about 3 inches deep" | < 7.6 cm |
| [AAB-D-LH] | "usually forage in water less than 3 inches deep, ideally about 2 inches deep" | ideal 5.1 cm |
| [AAB-D-O] | "wetlands with the right water level—about 3 inches deep or less" | |
| [Bent 1927, p. 120], S. F. Rathbun's notes from Washington, fall | "some would frequently wade up to their breasts into the shallow water, often so remaining until by some action they seemed to lose a footing and when this occurred a retreat would be made into a more shallow part" | qualitative; Long-billed |
| [Burton 1972, p. 66] | "The dowitchers were nearly all feeding in tidal pools, frequently up to belly depth; a few were watched feeding on exposed mud" | mostly Short-billed |
| [Lee & Birch 2006, p. 36] | "Long-billeds are often seen wading in slightly deeper water whereas Short-billeds are closer to the shore" | qualitative |
| [Audubon-D] | "Typically forages by wading in shallow water (sometimes walking on wet mud)" | qualitative |
| [WHC 2000, p. 5], "from Helmers 1992" | "Medium Sandpipers": wet mud to about 12 cm | guild bar read off a chart; species not named |
| Willamette Valley photos, 11 Sep-12 Oct (by eye; appendix) | from above the intertarsal joint with the belly dry (61069345), through just below the belly (315604676) and at the belly (183905360, 244826288), to the flanks (243856848) and the lower edge of the folded wing (244826304); a flock of about 10 feeding belly-deep with heads under water (223917370) | the local birds use the whole range from joint-deep to wing-deep |
| Willamette Valley photos, July-August | adults feeding belly-deep (230631065, 231759849, 178588631) | |

The design's "belly-deep is about 3-7 cm" and "a dowitcher's belly is about 5 cm off the ground" agree with these and with the photos (belly 45-53 mm, section 5.1).

### 7.2 The geometry

From section 5.1, for a standing bird at rest:
- Intertarsal joint: **38 mm** (37-39).
- Lowest point of the belly: **49 mm** (45-53).
- Lowest point of the folded wing: **63-74 mm** (belly + 14-25 mm) with sleeked plumage.

The design's rule:
- **Shallow end:** within 10 mm of the joint, so **28-48 mm**.
- **Deep end:** at least the belly, and below the wing, so **49-63 mm** (up to 53-74 at the extremes).

### 7.3 Recommendation

**Shallow end 3.5 cm, deep end 5.5 cm.**
- 35 mm is 3 mm below the joint: the tarsus is all but covered.
- 55 mm is 2 mm above the highest standing belly measured (53) and 8 mm below the lowest sleeked wing-bottom (63).
- Against the literature, the band contains AAB's "ideally about 2 inches" (5.1 cm) and Davis & Smith's spring mean (4.2 cm).
- A band of 2 cm is narrow, but the rendered terrain's 3-7 cm strip is only 0.26-0.46 m wide, and the zone polygon can follow the 3.5 and 5.5 cm contours inside it.
- **Check against the built model, not these numbers.** If the built belly is higher than 5.5 cm, raise the deep end to the belly plus 2 mm, keeping it at least 5 mm below the built wing's lowest point.

### 7.4 Where the geometry and the literature disagree

- **Real birds feed deeper than the design allows.** Davis & Smith's fall mean, 6.4 cm, is 1.5 cm above the standing belly and at or above the sleeked wing-bottom. Rathbun's birds waded "up to their breasts". So wild dowitchers often feed with the belly and flanks wet, which the design's "water wets the belly but not the wing" excludes. The recommended band holds only about a quarter of Davis & Smith's fall birds and a third of their spring birds (computed, normal assumption). It is the shallower half of real use, chosen because the model's wing must stay dry.
- **The feeding posture lowers the belly.** A walking, feeding bird with flexed legs and the body tipped forward carries its belly at 31 mm (photo-measured, section 2.7), against 45-53 standing. At 5.5 cm of water such a bird is belly-deep by 2 cm, which is what the design wants to show.
- **Fluffed plumage lowers the wing.** On the February bird the folded wing's lower edge lies at the belly line (47 mm). A model with a sleeked wing is needed for the band to satisfy both rules.
- **"At the shallow end no bare tibia shows above the water."** This does not match "deep enough to reach the intertarsal joint". The bare tibia is the part *above* the joint: about 15 mm from the joint up to the belly feathers (section 5.1). Water at the joint therefore leaves the whole bare tibia showing, and no bare tibia shows only when the water reaches the belly, at the deep end. I read the intended test as "no bare *tarsus* shows", that is, the shallow end at the joint within 10 mm. The spec should say which it means.

---

## 8. Tracing references

No guide photo has been harvested yet for either species (`data/birds.json` and `public/media/photos/` have neither code), so the harvested photo could not be checked; check it when the harvest runs. The photos below were downloaded to `C:\Users\kcsel\AppData\Local\Temp\claude\C--Users-kcsel-repo-lakewatch\bf7ba1c3-9318-4149-8065-d37e7f806d4e\scratchpad\ref\`, not to the repo. They are tracing references only and are never shipped. The `sources` line should credit the photographer and licence, as `greyel.ts` does.

### 8.1 Long-billed Dowitcher

**1. `lobdow-side.jpg` (recommended for the profile, legs and heights)**
- iNaturalist observation 118195363, photo 199669733, by **Les Leighton**. **CC BY-NC** ("(c) Les Leighton, some rights reserved (CC BY-NC)"). Research grade.
- Taken 16 February 2018 at Burnaby, British Columbia.
- Pages: https://www.inaturalist.org/observations/118195363 and https://www.inaturalist.org/photos/199669733
- Original: https://inaturalist-open-data.s3.amazonaws.com/photos/199669733/original.jpeg
- **2048x1538 px** (iNaturalist's full size).
- **What I checked:**
  - Standing still, relaxed and hunched: a rest posture. Strictly side-on: culmen / tarsus in pixels is 1.74 against Ridgway's 1.72.
  - The rear (standing) leg and its foot are fully visible on a solid mound of debris, dry above the water. The other foot is raised onto a higher lump, so trace the standing leg.
  - Bill clean and sharp against grey water; tail, tertials and wingtips separable.
  - **Plumage is first-winter (basic) grey**, so this photo is for structure only. The plumage is also fluffed against the cold, which drops the wing's lower edge to the belly line; draw the wing sleeker.
- Scale: culmen 457 px, **0.145 mm/px** at 66 mm. Tarsus check within 1%.

**2. `lobdow-juv.jpg` (recommended for the plumage)**
- iNaturalist observation 242236507, photo 431840531, by **Christopher Lindsey** (shearwater13). **CC BY-NC**. Research grade, annotated juvenile.
- Taken 14 September 2024 at Richland, Washington.
- Pages: https://www.inaturalist.org/observations/242236507 and https://www.inaturalist.org/photos/431840531
- Original: https://inaturalist-open-data.s3.amazonaws.com/photos/431840531/original.jpg
- **2048x1167 px**.
- **What I checked:**
  - A fresh juvenile two weeks before the game's date, a few hundred km east of the lake.
  - Side-on, walking through a film of water with one foot raised, head drawn in: the hunched feeding-walk posture.
  - Sharp enough to read the diagnostic tertials (plain grey-brown, thin buff edges, no internal marks), the dark-centred rufous-fringed scapulars, the grey hood, the barred tail with dark bars wider than white, the spotted and barred undertail, and the greenish-yellow legs.
  - Legs are mid-stride, so not for joint heights.
- Scale: culmen 274 px, **0.241 mm/px**.

**3. `lobdow-juv-2.jpg`**
- iNaturalist observation 59261872, photo 94678140, by **Richard Littauer**. **CC BY**. Research grade.
- Taken 11 September 2020 at Middlesex, Vermont. A Long-billed in Vermont is out of the main range, so the identification rests on the iNaturalist community; the plain grey breast and plain tertials fit.
- Pages: https://www.inaturalist.org/observations/59261872 and https://www.inaturalist.org/photos/94678140
- Original: https://inaturalist-open-data.s3.amazonaws.com/photos/94678140/original.jpg
- **2048x1365 px**.
- **What I checked:** standing still, side-on, neck raised (alert), feet under shallow water. The cleanest bill profile of the set against a plain background: used for bill depth along the bill and the tip droop. Juvenile scapulars and grey hood clear.
- Scale: culmen 346 px, **0.191 mm/px**; the bill depth at the base comes out 7.0 mm against AVONET's 7.1.

**4. `lobdow-dry.jpg` (second leg-height reference, on dry ground)**
- Wikimedia Commons "Limnodromus scolopaceus Mike Baird.jpg", by **Mike Baird** (Flickr 2982618942). **CC BY 2.0**.
- Taken 28 October 2008 at Morro Strand State Beach, California.
- Page: https://commons.wikimedia.org/wiki/File:Limnodromus_scolopaceus_Mike_Baird.jpg
- Original: https://upload.wikimedia.org/wikipedia/commons/8/89/Limnodromus_scolopaceus_Mike_Baird.jpg
- **3869x2579 px**.
- **What I checked:**
  - Standing still on dry sand, side-on, both legs straight, bill clean except for sand grains.
  - First-winter: grey body with retained juvenile coverts and scapulars.
  - **The feet are hidden** behind an out-of-focus kelp stipe in the foreground, so the ground line was placed from the published tarsus (section 2.7).
  - The species is the photographer's identification. Short-billed also occurs on outer beaches here; the long, straight bill and dark-barred tail fit Long-billed.
- Scale: culmen 685 px, **0.096 mm/px**.

**5. `lobdow-juv-3.jpg` (check only)**
- iNaturalist observation 317105980, photo 572970766, by **irishou**. **CC BY-NC**. Research grade.
- Taken 26 September 2025 at Steveston, Richmond, British Columbia: the right date and region.
- Pages: https://www.inaturalist.org/observations/317105980 and https://www.inaturalist.org/photos/572970766
- Original: https://inaturalist-open-data.s3.amazonaws.com/photos/572970766/original.jpg
- **2048x1536 px**.
- **What I checked:** a juvenile standing still on a log, feet visible, but oblique to the camera, so the bill is foreshortened. Used, scaled by the tarsus (**0.138 mm/px**), as a third joint and belly height. Good close view of the juvenile scapulars and leg colour.

**6. `lobdow-juv-local.jpg` (local plumage check)**
- iNaturalist observation 61157160, photo 97836472, by **Patricia** (insectology). **CC BY-NC**. Research grade.
- Taken 28 September 2020 at Forest Grove, Oregon: inside the Willamette Valley box, three days after the game's date.
- Pages: https://www.inaturalist.org/observations/61157160 and https://www.inaturalist.org/photos/97836472
- Original: https://inaturalist-open-data.s3.amazonaws.com/photos/97836472/original.jpeg
- **1944x2048 px**.
- **What I checked:** a juvenile standing still, side-on, neck raised, bill level, in shallow water over the feet. Rufous-fringed juvenile scapulars with a few plain grey first-winter feathers already among them, grey hood, plain tertials, barred tail. The image is soft (heavily processed), so it was not measured. It is the best evidence of what a Willamette bird looks like on the game's date, including the first post-juvenal moult.

**Which is better:** `lobdow-side.jpg` for the profile, legs and heights; `lobdow-juv.jpg` for the plumage and the feeding posture. Where they disagree (neck drawn in versus fluffed rest), trace the body from `lobdow-side.jpg` with the wing sleeked, and the head and bill angle from either.

### 8.2 Pectoral Sandpiper

**1. `pecsan-side.jpg` (recommended for tracing)**
- Wikimedia Commons "PectoralSandpiper-1OCT2016.jpg", by **ADJ82**, own work. **CC BY-SA 4.0**.
- Taken 1 October 2016 in Sacramento County, California.
- Page: https://commons.wikimedia.org/wiki/File:PectoralSandpiper-1OCT2016.jpg
- Original: https://upload.wikimedia.org/wikipedia/commons/d/de/PectoralSandpiper-1OCT2016.jpg
- **3823x2167 px**, the full original.
- **What I checked:**
  - A juvenile, standing side-on with the head up and the body level, on wet mud under a film of water. The same season and habitat as the game.
  - Bill sharp and fully visible: dark tip, pale base.
  - Braces, rufous crown, scapular fringes, and the bib edge all visible.
  - Both legs visible down to the mud, but the feet are sunk: use the tarsus length from the tables, not from the photo.
  - Warm morning light: colours read warmer than they are.
- Scale: culmen 305 px, **0.090 mm/px**.

**2. `pecsan-juv.jpg` (plumage)**
- Wikimedia Commons "Pectoral Sandpiper (Calidris melanotos) (29119997223).jpg", by **Andrew C** (Flickr 29119997223). **CC BY 2.0**.
- Taken 17 September 2016 at East Fork State Park, Bethel, Ohio.
- Page: https://commons.wikimedia.org/wiki/File:Pectoral_Sandpiper_(Calidris_melanotos)_(29119997223).jpg
- Original: https://upload.wikimedia.org/wikipedia/commons/4/44/Pectoral_Sandpiper_%28Calidris_melanotos%29_%2829119997223%29.jpg
- **3672x2448 px**.
- **What I checked:** a fresh juvenile, side-on, head lowered while foraging on a mossy rock in shallow water. The sharpest of the set: the bib and its edge, the white braces, the rufous and white scapular fringes, the plain primaries projecting past the tertials, and the pointed central tail feathers. Evening light, strongly warm. Used for the bib-edge measurement.
- Scale: culmen 402 px, **0.068 mm/px**.

**3. `pecsan-juv-2.jpg` (legs, true colour)**
- Wikimedia Commons "Calidris melanotos 225389663.jpg", from iNaturalist photo 225389663 (observation 132359936), by **scaup**. **CC BY 4.0**.
- Taken 25 August 2022 in Nova Scotia (45.67 N, 62.37 W).
- Page: https://commons.wikimedia.org/wiki/File:Calidris_melanotos_225389663.jpg
- Original: https://upload.wikimedia.org/wikipedia/commons/6/60/Calidris_melanotos_225389663.jpg
- **2048x1366 px**.
- **What I checked:** a juvenile walking through shallow water, side-on, both legs clear from the belly to the water, flat light. Used for the bare tibia (10 mm) and as the truest colour reference for the bill and legs.
- Scale: culmen 134 px, **0.205 mm/px**.

**4. `pecsan-side-local.jpg` (local; legs, feet and plumage)**
- iNaturalist observation 183730684, photo 320589592, by **Hendrik Herlyn** (actitis). **CC BY-NC**. Research grade.
- Taken 17 September 2023 at Philomath Sewage Ponds, Benton County, Oregon: inside the Willamette Valley box, on nearly the game's date.
- Pages: https://www.inaturalist.org/observations/183730684 and https://www.inaturalist.org/photos/320589592
- Original: https://inaturalist-open-data.s3.amazonaws.com/photos/320589592/original.jpeg
- **2048x1548 px**.
- **What I checked:** a crisp fresh juvenile standing still, side-on, on a mat of algae, **both legs and feet fully visible**. Bill, rufous crown, white braces, rufous and white scapular fringes, the bib edge and the yellow legs all sharp. The head is drawn up over the breast, so its straight bill-to-tail length (163 mm) is 20% shorter than the level-bodied `pecsan-side.jpg`. Use it for the legs, the bare tibia (11-13 mm) and the local plumage; trace the body from `pecsan-side.jpg`.
- Scale: culmen 183 px, **0.150 mm/px**.

**Which is better:** `pecsan-side.jpg` for tracing the profile (body level, still, the game's date and habitat), which keeps the Pectoral-to-Least length comparable; `pecsan-side-local.jpg` for the legs and the local plumage; `pecsan-juv.jpg` for the plumage pattern; `pecsan-juv-2.jpg` for colours.

---

## 9. Numbers for the model

These map to `detail.measurements` (metres) and the other `detail` fields, plus the extra quantities the tests need. All are the mean of the sexes.

| Field | Long-billed Dowitcher | Pectoral | How chosen |
|---|---|---|---|
| `length` (bill tip to tail tip, rest pose) | **0.22 m** | **0.195 m** | Traced: dowitcher 0.210-0.238 on four photos (bill 26-37° below level); Pectoral 0.196 with the body level, 0.184 head down, 0.163 upright with the head drawn back (section 2.7). Published stretched lengths (0.28-0.33 and 0.23 m) are 20-30% longer and would fail the 5% trace check. **If the traced profile differs, set `length` to the traced value** |
| `culmen` (exposed) | **0.066 m** | **0.0275 m** | Dowitcher: Ridgway 61 (M) and 71.3 (F), mean 66.2; USGS juveniles 67.2 (n=49). Pectoral: Ridgway 28.4 (M) and 26.6 (F, sub-table), mean 27.5; USGS 27.9 (n=36, mostly F). Juvenile bills are not short (section 2.6) |
| `billDepth` (at base) | **0.0072 m** | **0.0050 m** | AVONET at the nostril: 7.1 (7.0-7.5) and 4.8 (4.6-5.1); dowitcher photo 7.0 at 10% of the bill. Both nostrils are sub-basal |
| `billWidth` (at base) | **0.0045 m** | **0.0034 m** | AVONET at the nostril: 4.5 (4.1-4.7) and 3.4 (2.9-4.0) |
| `bill.curve` | **small negative**, acting on the distal ~30% | **small negative**, distal third, like the Least's −0.03 | Tip 0.6-1.0 mm (dowitcher) and 0.5-0.6 mm (Pectoral) below the base line (photo-measured); "typically very straight along most of its length" [Lee & Birch 2006, p. 35]; "faintly decurved tip" [Ridgway 1919, p. 267] |
| `bill.taper` | **blunt** (low; lower than the Killdeer's), depth held through the distal third | **fine point** (as the Least) | "terminal third slightly but distinctly expanded, depressed" [Ridgway 1919, p. 196]; depth 3.8-3.7 mm from 70% to 90% of the bill (photo-measured) |
| head (total head − culmen) | **0.029 m** | **0.0255 m** | USGS 29.4 (n=39 juveniles) and 25.5 (n=32). Gives culmen / head 2.28 and 1.08 |
| `tarsus` | **0.0385 m** | **0.027 m** | Ridgway 38.5 and 26.8; AVONET 38.6 and 26.0 (female-weighted); USGS Pectoral diagonal 27.9 |
| `tibia` (bare) | **0.015 m** | **0.011 m** | Dowitcher: "decidedly shorter than middle toe" (27) [Ridgway 1919, p. 196]; 14.4-14.6 on two photos. Pectoral: "about as long as first two phalanges of middle toe" [p. 267]; 10-13 on two photos. Medium confidence |
| `toe` (middle, no claw) | **0.027 m** | **0.023 m** | Ridgway means of the sexes, 27.0 and 23.1 |
| `wingChord` | **0.143 m** | **0.133 m** | Ridgway unflattened chord, 143.3 and 132.8. AVONET 145.5 and 125.2 (female-weighted); USGS flattened 151.2 (juveniles) and 136.9 |
| `tail` | **0.056 m** | **0.058 m** | Ridgway 56.3 and 58.9; AVONET 56.5 and 51-54 (female-weighted) |
| `tail.shape` | **`rounded`** | **`rounded`** (`wedge` as the alternative) | "very slightly rounded" [Ridgway 1919, p. 196]; "tail slightly rounded", middle pair "acuminate" and projecting [pp. 267-268] |
| tail tip past wingtip | **+0.004 to +0.008 m** | **about even, 0 to +0.002 m** | Photo-measured, section 2.7 |
| primary tips past the longest tertial | **none** (tertials cover the primaries) | **0.017-0.024 m** | [Lee & Birch 2006, p. 40]; photo-measured |
| `eye.radius` (visible eye) | ≈ **0.0027 m** | ≈ **0.0025 m** | Photo-measured visible eye 5.0-5.2 and 4.7-5.4 mm |
| intertarsal joint height, standing | **0.038 m** | - | Photo-measured, three photos, 37-39 mm |
| lowest belly height, standing | **0.049 m** (0.045-0.053) | - | Photo-measured, three photos |
| folded wing's lowest point, standing | **belly + 0.014 to 0.025 m** (≈ 0.063-0.074 m) | - | Photo-measured, two sleeked birds |
| `probeDepth` | **0.035 m** | 0 | Estimate: about half the culmen. Probes go "mostly between one third and the full length of the bill", jabs "to less than half" [Burton 1972, p. 65]; "driving them in their full length again and again" [Bent 1927, p. 110]. Section 11 |
| `stepLength` | **0.35** (a step of about 3 cm) | **0.7** (as the Least) | Dowitcher: creeping steps of 2-3 cm (video estimate, section 6.1). `stepLength` is a fraction of the model's full tibia plus tarsus; if that sum is not near 85 mm, choose the fraction that gives a 3 cm step. Estimate |
| mass (if used) | 0.096-0.116 kg | 0.063-0.080 kg | Dowitcher: Texas migrants 95.9 g [Davis & Smith 2001], Dunning 104.4 g, USGS September juveniles 115.7 g. Pectoral: USGS 68.6 g (female-weighted), Dunning 79.7 g; males about 50% heavier than females [AAB-P] |

**Colours** (source words; the painter picks the hex):

| Part | Long-billed Dowitcher, juvenile | Pectoral, juvenile |
|---|---|---|
| Bill | blackish, "passing into olivaceous basally" | "blackish terminally, more brownish basally (where dull greenish yellow in life)"; "black at the tip, and lighter brown at the base" |
| Iris | dark brown | brown |
| Legs | "light yellowish olive or greenish olive" | "dull greenish yellow or yellowish green"; "olive-yellow" |
| Cap | dark grey-brown, finely streaked, little rufous | rufous-brown ("tawny") streaked black |
| Face | whitish supercilium, bill to just behind the eye; dark loral line; grey cheek | faint dull-white supercilium, streaked behind; dusky lores; streaked buff cheek |
| Neck and breast | plain grey hood, faint dusky speckles and a faint buff wash at the lower breast sides, fading softly into the white belly | buff-washed, finely dark-brown-streaked bib, paler chin, ending in a sharp line on the lower breast |
| Upperparts | dark brown-black scapulars with narrow "cinnamon rufous" or "hazel" fringes; grey-brown coverts with thin buff fringes; plain grey-brown tertials with thin buff edges | black-centred mantle and scapulars with "tawny", "ochraceous-buff" and "creamy white" fringes; white braces along the mantle sides; dark tertials with rufous-buff fringes |
| Underparts | white belly; flanks spotted and short-barred dusky; undertail white with bold blackish bars | white belly and flanks, a few fine shaft streaks on the flanks |
| Rump and tail | white wedge up the back (hidden at rest); white tail barred blackish, dark bars wider than white | sooty-black rump and central tail, white sides; outer tail pale grey-brown |

---

## 10. Suggested test thresholds

All values are in mm. "Head" means total head minus exposed culmen, with total head measured from the bill tip to the rearmost head vertex along the bill axis, as `measure.ts` does and as USGS measures it.

| Assertion | Long-billed Dowitcher | Pectoral | Basis |
|---|---|---|---|
| Exposed culmen | 52-79 | 24-31 | Ridgway 52-79 and 24-29.5; USGS 57.9-78.7 and 25-31 |
| Total length | 200-300 | 155-235 | Traced 210-238 and 163-196 (photo-measured); published 280-330 and 230 are stretched lengths. Keep the lower bounds low for the hunched or upright rest pose |
| Tarsus | 33.5-42 | 24-30 | Ridgway ranges; AVONET and USGS diagonal within them |
| Wing chord | 136-159 | 119-152 | Ridgway 136-150 and 119.5-146; widened for USGS flattened wings (143-159; 126-152) |
| Tail | 50-62 | 50-68 | Ridgway 50-61 and 51-65; AVONET 51-62 and 50-68 |
| Middle toe (no claw) | 24-30 | 21-26.5 | Ridgway ranges |
| Bare tibia (sanity only) | 10-22 | 7-16 | Photo-measured 14.4-14.6 and 10-13; the dowitcher's must be under the toe (27) |
| Bill depth at base | 6.5-8.0 | 4.2-5.5 | AVONET nostril ranges, widened slightly; dowitcher photo 7.0 |
| **Culmen / head** | **1.9-2.8** | **0.9-1.25** | USGS 2.30 (1.97-2.79, n=39) and 1.09 (0.92-1.23, n=32). The design's "about 2" and "about 1". Both assume a skull-level head |
| Culmen / head, if the head is traced to the feathered outline | 1.4-2.2 | 0.9-1.15 | Photo-measured 1.5-2.1 and 1.01 |
| Culmen / tarsus | 1.5-2.0 | 0.85-1.15 | Ridgway 1.72 and 1.03; USGS Pectoral 0.99 (0.88-1.09) |
| **Bill tip rise (`billTipRise`)** | **−2.0 to −0.2** (tip below the base line) | **−1.2 to −0.2** | Photo-measured −0.6 to −1.0 and −0.5 to −0.6; "straight" with a "faintly decurved tip" |
| **Tail tip past wingtip** (= −`projection`) | **0 to +12** | **−4 to +4** | Photo-measured +4 to +8, and within 2 mm; the design's "about even with the tail" |
| Primary tips past the longest tertial (if tested) | −4 to +3 | 12-30 | Photo-measured 0 (covered) and 17-24 |
| Eye radius (if tested) | 2.3-3.2 | 2.1-2.9 | Photo-measured ± ~15% |
| Tail / wing | 0.33-0.45 | 0.38-0.50 | Ridgway 0.39 and 0.44; "between one-third and two-fifths"; "more than two-fifths" |
| **Pectoral total length / Least model (0.13 m)** | | **1.40-1.60** | Traced Pectoral with the body level 0.184-0.196 over 0.13 = 1.42-1.51; Ridgway linear ratios 1.42-1.56; published 23 / 14 = 1.64. The design's 1.3-1.6 contains these. **An upright trace (0.163 m, ratio 1.25) fails it**: trace the body level, as the Least was (section 2.7) |
| Pectoral / Least, wing chord | | 1.45-1.65 | Ridgway 1.55 |
| **Intertarsal joint height, standing** | **33-43** | - | Photo-measured 37-39 (three photos); tarsus 38.5 × cos(tilt) |
| **Lowest belly height, standing** | **42-56** | - | Photo-measured 45-53 (three photos); the design's "about 5 cm" |
| **Folded wing's lowest point, standing** | **at least belly + 8, and 55-80** | - | Photo-measured belly + 14-25 (sleeked); a fluffed bird reaches the belly line |
| **`shallows-edge` shallow end** | **35**; within 10 of the built joint | - | Section 7 |
| **`shallows-edge` deep end** | **55**; at least the built belly, and at least 5 below the built wing's lowest point | - | Section 7 |
| Peck reach: bill tip below ground at `PECK_BOTTOM.dowitcher` | `probeDepth` ± 5 = **30-40** | 8 below to 2 above (the Least's sandpiper bounds) | Section 11; the design's rule |

On the painted atlas, the design's checks are supported, with these values:
- Dowitcher tertial centres: uniform grey-brown, no bars (internal marks at most faint) [Lee & Birch 2006, p. 39].
- Dowitcher tail: alternating dark and light along its length, **dark bars wider than light**, about 3-3.5 mm dark to 1-2 mm light, repeating every 4.5-5 mm (photo-measured, rough).
- Dowitcher eyebrow paler than the crown: whitish against dark grey-brown.
- Dowitcher legs: greenish-yellow to olive in hue.
- Pectoral bib edge: the streak contrast ends within **about 3 mm** along the underside (photo-measured), so "within a few millimetres" can be set at ≤ 4 mm.
- Pectoral bib streaked: high local contrast (luminance SD 25-35 on the photo against under 11 on the belly).
- Pectoral scapular fringes warmer (rufous, buff) than the black centres; the lowest row edged white.
- Pectoral legs: yellow with a slight green cast ("olive-yellow").

---

## 11. Foraging settings

### 11.1 Long-billed Dowitcher (`dowitcher`)

The field names follow the design's states; the plan settles them.

| Setting | Value | Status |
|---|---|---|
| **`stitch`: strokes per second** | **3** (range 2-5), along sin² between the stroke top and the probe bottom | **Estimate** from video: large strokes 3-3.5/s by eye, small strokes ~6/s by tracker [Possen 2022a; jerry24470 2026]. Burton's timed rate of whole jabs and probes is 1.0/s (0.6-1.8) [Burton 1972, p. 66], mostly Short-billed |
| `stitch`: stroke top (`reach` high point) | the bill tip about 25-35 mm above the probe bottom, i.e. about at the mud surface: `reach` ≈ 0.7 as the design proposes | **Estimate**: "at a withdrawal about half the bill shows" (video, about 30 mm of tip travel). Jabs go in "to less than half the bill length" [Burton 1972, p. 65] |
| **`probeDepth`** | **0.035 m** (range 0.022-0.045), about half the culmen | **Estimate** within sources: probes "mostly between one third and the full length of the bill", jabs "to a third or more" [Burton 1972, pp. 65, 67]; "their full length" [Bent 1927, p. 110]; 35-45 mm on one video (low confidence). With the bill about 75° from level at the bottom, the bill base is then about 29 mm above the ground, so the face is at or under the surface anywhere in the 35-55 mm band (computed) |
| Bill angle while feeding | about 70-80° below level | **Sourced**: "Between feeding actions, dowitchers held the bill inclined at about 70° or 80° to the horizontal" [Burton 1972, p. 66] |
| `stitch` bout length | 4-14 s (mean ≈ 8) | **Estimate** from video (3.5-13.5 s) [Possen 2022a, 2022b]; Burton: "concentrate on a small area for about 30 seconds, probing around itself with pivoting movements of the body and a leisurely step or two" [Burton 1972, p. 66], which includes the creeps |
| Brief lift inside a bout | 0.3-0.5 s, every 2-5 s; the bill comes out of the water, the head stays low | **Estimate** from video [Possen 2022b] |
| **`look`: how often** | at the end of about half the bouts; roughly once every 10-20 s | **Estimate** from video; "minimal time" alert [Davis & Smith 1998, p. 266] |
| **`look`: duration** | 1.5-3.5 s | **Estimate** from video [Possen 2022a, 2022b]; the design's 1-3 s is close |
| **`creep`: speed** | ≈ 0.02-0.025 m/s, the stitch carrying on | **Estimate** from video, fixed camera [Possen 2022a] |
| `creep`: steps | one step every 1.1-1.5 s, 2-3 cm each | **Estimate** from video [Possen 2022a] |
| `creep`: distance | 0.03-0.20 m ("a leisurely step or two"), occasionally more | **Estimate**; [Burton 1972, p. 66]; the design's "a few centimetres to about 20 cm" |
| `follow`: speed | ≈ 0.12 m/s, head up, walking | **Estimate**; no source. "then walk on more briskly for a few seconds, and pause to repeat" [Burton 1972, p. 66]; about the Pectoral's feeding walk |
| `follow`: when | more than ≈ 0.8-1 m from the flock target | **Estimate**, from the design's 0.6 m flock radius |
| Flock: nearest-neighbour spacing | ≈ 0.3-0.5 m (1-1.5 body lengths) | **Estimate** from one video of "dowitcher sp." on mud [Pete 2017]. Qualitatively **sourced**: "closely bunched" on landing, then "scatter out"; "concentrated in compact groups or strung out in a long line, close to the edge of the water" [Bent 1927, pp. 111-112] |
| Flock radius | 0.6 m (the design's value) | consistent with the spacing above for six birds |
| Ripples | at the stroke bottom, no more often than every 0.3-0.5 s | **Estimate**: large strokes every 0.2-0.6 s on video; the design's "about half a second" is fine |
| Head under water | the face reaches the surface at every stroke; the head goes under at the deep end | **Sourced**, qualitatively: "the whole head is frequently immersed and sometimes several strokes are made with the head under water" [Bent 1927, p. 110]; [AAB-D-LH]; video [Possen 2024] |

### 11.2 Pectoral Sandpiper (`sandpiper`, as the Least)

| Setting | `sandpiper` table | Pectoral evidence | Status |
|---|---|---|---|
| Walk speed while feeding | 0.1 m/s | ≈ 0.15 m/s on one clip; "moves about slowly" | **Estimate** (video [Fossé 2021]); **sourced** qualitatively [Bent 1927, p. 176; AAB-P-LH]. Keep 0.1 |
| Pecks per second while walking | 2.5 | not countable; bill-down bouts of 0.6-1.6 s with 0.15-0.45 s head-ups | **Estimate** (video [Fossé 2012]). Keep 2.5 |
| Probe bout on the spot | 2-5 at 3/s | the bill held down for 3-5 s at a time on one clip; "probing in the mud with rapid strokes" | **Estimate** (video [Jones 2026]); **sourced** qualitatively [Bent 1927, p. 176]. Keep, or lengthen to 4-8 probes |
| Steps per second | - | ≈ 3 | **Estimate** (video [Fossé 2012]) |
| Grouping | flock radius 1.5 m | "wisps or scattered flocks, the individuals widely separated" [Bent 1927, p. 175] | **Sourced**, qualitatively. Two birds as their own loose pair among the Leasts, as the design has it |
| Alert posture | - | "stands perfectly still with its head held high"; "stand upright with their necks extended, peering over the grass" | **Sourced** [Bent 1927, p. 176; BirdWeb-P] |

---

## 12. Open questions and confidence

**High confidence**
- Ridgway's culmen, wing, tail, tarsus and toe for both species; AVONET and USGS agree within their sample biases (AVONET's Pectorals are female; USGS's dowitchers are juveniles).
- Culmen / head: 2.30 for the dowitcher (n=39) and 1.09 for the Pectoral (n=32), both from live-bird callipers [USGS 2023].
- Juvenile bills are not short in September in either species (USGS hatch-year samples).
- The sexual dimorphism: female dowitchers' bills 17% longer; male Pectorals about 11% larger in wing and about 50% heavier.
- The field-mark wording in section 4, quoted from Ridgway, Bent, AAB, BirdWeb, Audubon and Lee & Birch, and matching the photos.
- The dowitcher's feeding rate of about one movement a second, head raised between strokes, probes to a third or more of the bill [Burton 1972], though for mostly Short-billed birds.
- Long-billed feeding depth: 4.2 cm (spring) and 6.4 cm (fall) on average [Davis & Smith 2001].
- **Juveniles for both species in late September.** All written sources agree. In the Willamette box, 40 of 44 ageable dowitcher records and all 30 ageable Pectoral records from 11 September to 12 October are juveniles; the July-August dowitchers are all adults.

**Medium confidence**
- **Leg, belly and wing heights** (joint 38, belly 45-53, wing 14-25 above the belly). Three photos, one strictly side-on and checked by the tarsus; the second has its feet hidden and its ground inferred; the third is oblique and tarsus-scaled. The wing-bottom varies with how the bird holds its feathers.
- **The depth band** (3.5-5.5 cm): it follows from those heights and the design's rules, and sits in the shallower half of published use.
- **Bill depth at the base** of the dowitcher (7.1 mm): four skins plus one photo, in agreement.
- **Tail past the wingtip**, +4 to +8 mm (dowitcher) and about even (Pectoral): photos only; no source gives a number.
- **Pectoral primary projection** of 17-24 mm: three photos, with the longest tertial not always certain.
- **Tail shapes**: `rounded` for both, from Ridgway's "very slightly rounded" and "slightly rounded".
- **The Pectoral female culmen** (26.6 from Ridgway's sub-table against his printed 25.8; USGS 27.3).

**Low confidence or not verified**
- **Bill droop sizes** (0.6-1.0 mm and 0.5-0.6 mm): one or two photos each, at the limit of the method. Dowitchers "can temporarily alter the shape of their bills when feeding or probing" [Lee & Birch 2006, p. 35].
- **Bare tibia** (15 and 10-13 mm): two photos each, with soft feather edges.
- **Dowitcher tail-bar widths and count**: two oblique photos; Lee & Birch say only "wider ... sometimes even twice as wide" and warn of overlap.
- **`probeDepth`** (35 mm): an estimate inside Burton's "one third to the full length of the bill", for mostly Short-billed birds.
- **Photo scale.** A single dowitcher's culmen can be 9% off the mean (SD 5.9 mm). Only `lobdow-side.jpg` could be checked by its tarsus (within 1%).
- **Identification of two photos**: the Vermont juvenile (`lobdow-juv-2.jpg`) is out of the main range, and the Morro Bay bird (`lobdow-dry.jpg`) is on an outer beach where Short-billed also occurs. Both look right; neither was used for plumage alone.
- **All dowitcher stitch, bout, look-up, creep and spacing numbers** are video estimates from one to three birds, mostly spring adults at unstated sites (one in Taiwan), not late-September juveniles. The small-stroke rate (~6/s) rests on a head tracker that may count noise; the large-stroke rate (3-3.5/s) was checked by eye. The spacing clip is "dowitcher sp." on mud.
- **The Pectoral walking speed** (≈ 0.15 m/s) is from one clip where the bird's identity (Dunlins were present) and the scale are uncertain. No Pectoral peck rate could be counted.
- **Burton's timed rates** are for mostly Short-billed Dowitchers in tidal pools in April.
- **Ageing**: 27 of the 62 dowitcher records and all 32 Pectoral records were aged by a sub-agent (on stated criteria), the rest by me. iNaturalist photos favour close, bright birds, and several records show the same flock.
- **Snippet-only claims:** Isola et al. 2000's depth groups. Nothing else in this document rests on a snippet.

**Sources I could not read** (not relied on for any number)
- **Pitelka 1950**, the monograph that separated the two dowitchers, with measurements by age and the tail-bar ratios. Not found online.
- **Birds of the World** accounts for both species: Plumages, Measurements, Behavior and Movements are paywalled.
- **Paulson 1993**, **Pyle 2008**, **O'Brien et al. 2006**, **Chandler 1998**, **Wilds & Newlon 1983**: not online or lending-only. Paulson's tertial wording is quoted through Lee & Birch.
- Water-depth studies: **Isola et al. 2000** (snippet only), **Collazo et al. 2002**, **Baker 1979**, **Colwell & Taft 2000**, **Elphick & Oring 1998**, and **Helmers 1992** itself (seen only as the WHC chart). None of those I could open gives a dowitcher-specific depth.
- **Holmes & Pitelka 1968** and **Baker & Baker 1973** (feeding rates; Baker & Baker's dowitcher is Short-billed).
- Oregon status: **Marshall et al. 2003** (*Birds of Oregon*), **Oregon Birds**, and the eBird bar charts for the Willamette Valley counties (sign-in required) were not reached; the Oregon timing rests on BirdWeb (Washington), Lee & Birch, Bent and the iNaturalist records.
- **Macaulay Library** audio-visual assets could not be opened by script, so no Macaulay video was used.

**Worth doing if higher confidence is needed**
- Photograph or find a side-on juvenile Long-billed standing on bare mud with both feet visible, to confirm the joint and belly heights with a strictly side-on, culmen-and-tarsus-checked scale.
- Read Pitelka 1950 for juvenile measurements and tail-bar ratios.
- Time Long-billed Dowitchers specifically (Burton's were mostly Short-billed), in fresh water, at the Willamette depths.
- Measure the built model's joint, belly and wing heights and set the zone band from them (section 7.3).

---

## Appendix: iNaturalist records aged (Willamette Valley box)

The query was research grade, box 43.8-45.8 N, 122.5-123.6 W (as in the Least research), 11 September to 12 October of any year; I aged the first photo of each record by eye. "(sub-agent)" marks records aged by a sub-agent on the same criteria; I checked its criteria and results but did not re-view every photo.

**Long-billed Dowitcher (taxon 3873), 62 records**

| Record | Date | Result |
|---|---|---|
| 401413096 | 2026-09-12 | juveniles, 3 of 4 (1 not ageable) |
| 399775455 | 2026-09-12 | probable juvenile |
| 135674457 | 2022-09-14 | juvenile (sub-agent) |
| 314134843 | 2025-09-14 | plain grey, 2 birds: basic adults or moulting juveniles (sub-agent) |
| 95190266 | 2021-09-16 | juvenile (sub-agent) |
| 402316757 | 2026-09-16 | probable juvenile |
| 402321392 | 2026-09-16 | juvenile |
| 59962421 | 2020-09-17 | probable juveniles, 2 (sub-agent) |
| 401399019 | 2026-09-18 | probable juvenile (asleep) |
| 135872586 | 2022-09-18 | probable juveniles, 2; the observer crossed out a third, rufous bird (sub-agent) |
| 183905360 | 2023-09-18 | not ageable; water at the belly (sub-agent) |
| 60293105 | 2020-09-20 | **adult** (rufous-orange underparts) and 1 grey bird, not ageable (sub-agent) |
| 60293106 | 2020-09-20 | juvenile and 1 grey bird, not ageable (sub-agent) |
| 243856848 | 2021-09-20 | not ageable; water at the flanks (sub-agent) |
| 315604676 | 2025-09-20 | **adult**: grey basic feathers moulting in, rufous remnants on the lower belly; water just below the belly (sub-agent) |
| 315352510 | 2025-09-20 | probable juveniles, 3 |
| 402371396 | 2026-09-21 | not ageable: 3 birds, distant |
| 136113951 | 2022-09-22 | probable juvenile (sub-agent) |
| 185056773 | 2023-09-24 | probable juveniles, 9 (sub-agent) |
| 96309210 | 2021-09-26 | probable juveniles, 4 (sub-agent) |
| 316845281 | 2025-09-26 | plain grey scapulars with neat pale-fringed coverts: a moulting juvenile or a basic adult |
| 61069345 | 2020-09-27 | juvenile; water above the intertarsal joint, belly dry (sub-agent) |
| 244542758 | 2024-09-27 | probable juveniles, about 20 (sub-agent) |
| 317088189 | 2025-09-27 | juvenile |
| 61157422 | 2020-09-28 | not ageable: 7 birds, backlit (sub-agent) |
| 61157160 | 2020-09-28 | juvenile; `lobdow-juv-local.jpg` (sub-agent; I viewed it too) |
| 317454591 | 2025-09-28 | not ageable: distant |
| 317460729 | 2025-09-28 | juvenile |
| 185682230 | 2023-09-28 | juvenile (sub-agent) |
| 136963892 | 2022-09-29 | juveniles, 2 (sub-agent) |
| 261039474 | 2023-09-29 | not ageable: fog (sub-agent) |
| 244815808 | 2024-09-29 | not ageable (sub-agent) |
| 244773066 | 2024-09-29 | not ageable (sub-agent) |
| 244826288 | 2024-09-29 | probable juvenile; water at the belly (sub-agent) |
| 244826304 | 2024-09-29 | probable juvenile; water at the lower edge of the folded wing (sub-agent) |
| 317683224 | 2025-09-29 | probable juveniles, 2 |
| 96715105 | 2021-09-30 | juveniles, 8 or more of 10 (sub-agent) |
| 137518364 | 2022-09-30 | probable juvenile (sub-agent) |
| 343455440 | 2024-09-30 | not ageable (sub-agent) |
| 138673360 | 2016-10-01 | juvenile |
| 245512923 | 2024-10-02 | probable juveniles, about 8 |
| 61645671 | 2020-10-03 | juvenile |
| 186243940 | 2023-10-03 | not ageable: 2 birds, backlit |
| 137574870 | 2022-10-04 | probable juveniles, 3 |
| 245684571 | 2024-10-04 | probable juveniles, 3 |
| 319658715 | 2025-10-04 | not ageable: flock landing, silhouettes |
| 186356765 | 2023-10-05 | not ageable: distant |
| 186357163 | 2023-10-05 | not ageable: about 8 birds, distant |
| 97376215 | 2021-10-06 | juvenile, grey first-winter scapulars coming in |
| 223917370 | 2023-10-06 | not ageable: about 10 birds feeding belly-deep, several with the head under water |
| 186652799 | 2023-10-07 | not ageable: distant |
| 17429090 | 2018-10-07 | juvenile |
| 246429696 | 2024-10-08 | not ageable: 3 birds, glare |
| 29385474 | 2018-10-09 | probable juvenile |
| 34128418 | 2019-10-09 | probable juveniles, 2 |
| 138341925 | 2022-10-10 | probable juvenile |
| 62373325 | 2020-10-11 | juvenile, grey first-winter scapulars coming in |
| 247575940 | 2024-10-11 | probable juveniles, 2 |
| 321399605 | 2025-10-11 | not ageable: about 50 birds flushing |
| 320324498 | 2025-10-11 | not ageable: distant |
| 62426441 | 2020-10-12 | juvenile-type coverts with grey scapulars: moulting juvenile |
| 187927905 | 2023-10-12 | juvenile |

July-August comparison sample (15 July-20 August): 126831012 (2022-07-18), 127254027 (2022-07-21), 128243402 (2022-07-26, a flock of about 10), 230631065 (2024-07-20, 2 birds belly-deep), 231759849 (2024-07-25, 3 birds belly-deep), 178588631 (2023-08-09, 4 birds belly-deep) and 91463098 (2021-08-16) are worn adults with rufous underparts; 30403660 (2019-08-07) and 307848741 (2025-08-20) are not ageable.

**Pectoral Sandpiper (taxon 3865), 32 records** (aged by the sub-agent; I viewed 183730684)

| Record | Date | Result |
|---|---|---|
| 134626753 | 2022-09-11 | juvenile |
| 104770007 | 2021-09-12 | juvenile |
| 241331197 | 2024-09-12 | juvenile |
| 399775337 | 2026-09-12 | probable juvenile |
| 400057737 | 2026-09-13 | juveniles, 5 birds |
| 44341504 | 2013-09-14 | juvenile |
| 391961168 | 2025-09-14 | probable juvenile |
| 135214946 | 2022-09-15 | juveniles, 3 birds |
| 400609144 | 2025-09-15 | juvenile |
| 401029292 | 2026-09-15 | juvenile |
| 16655971 | 2018-09-16 | juvenile |
| 135627449 | 2022-09-16 | juvenile |
| 402346338 | 2026-09-16 | juvenile |
| 183730684 | 2023-09-17 | juvenile; `pecsan-side-local.jpg` |
| 242968806 | 2024-09-19 | juvenile |
| 135824512 | 2022-09-20 | juvenile |
| 95683373 | 2021-09-21 | juvenile |
| 97065504 | 2021-09-21 | juvenile |
| 402829436 | 2026-09-21 | juvenile |
| 317683237 | 2025-09-29 | probable juvenile |
| 317683243 | 2025-09-29 | probable juvenile (the same bird as the record above) |
| 319729341 | 2025-09-29 | not ageable: in flight |
| 138340643 | 2022-10-02 | not ageable: distant |
| 186072446 | 2023-10-03 | juvenile |
| 186072447 | 2023-10-03 | juveniles, 2 birds |
| 186072448 | 2023-10-03 | juvenile |
| 186243919 | 2023-10-03 | probable juvenile (same site and day as the three above) |
| 186333593 | 2023-10-05 | probable juvenile |
| 319213853 | 2025-10-05 | probable juvenile, beside a Least Sandpiper, which it clearly outsizes |
| 62087046 | 2020-10-08 | probable juvenile |
| 246728610 | 2024-10-09 | juvenile |
| 320262057 | 2025-10-11 | juvenile |

---

## References

- **[Ridgway 1919]** Ridgway, R. 1919. *The Birds of North and Middle America*, Part VIII. Bulletin of the United States National Museum 50(8).
  - Genus *Limnodromus* pp. 195-196; *L. griseus griseus* pp. 197-201 (winter adult and young pp. 197-198); *L. g. scolopaceus* pp. 201-204 (measurements p. 201).
  - Genus *Pisobia* pp. 266-268; key pp. 268-269; *P. maculata* pp. 269-276 (plumages pp. 269-270; measurements and regional sub-table pp. 270-271).
  - Read via Internet Archive OCR of the Cornell copy, https://archive.org/details/cu31924022528107 . Measurement lines and the Pectoral sub-table checked against the page scans (leaves n222, n291, n292; e.g. https://archive.org/download/cu31924022528107/page/n222.jpg). BHL record: https://www.biodiversitylibrary.org/bibliography/48566
- **[Ridgway 1901]** Ridgway, R. 1901. *The Birds of North and Middle America*, Part I. Bull. U.S. Natl. Mus. 50(1). Measurement methods, pp. xv-xvi. https://archive.org/details/cu31924090256870
- **[Bent 1927]** Bent, A. C. 1927. *Life Histories of North American Shore Birds*, Part 1. Bull. U.S. Natl. Mus. 142. https://archive.org/details/lifehistoriesofn00bent_3
  - Eastern Dowitcher (*Limnodromus griseus griseus*) pp. 106-115: Plumages (referred to the Long-billed) and Food p. 110; Behavior p. 111; Fall pp. 112-113.
  - Long-billed Dowitcher (*L. g. scolopaceus*) pp. 115-122: Plumages pp. 118-119; Behavior and Fall (S. F. Rathbun's Washington notes) pp. 119-120; Distribution pp. 121-122.
  - Pectoral Sandpiper (*Pisobia maculata*) pp. 169-181: Plumages pp. 174-175; Food and Behavior pp. 175-176; Field marks p. 176; Fall p. 177.
- **[USGS 2023]** Ruthrauff, D. R., T. L. Tibbitts, R. E. Gill Jr., and C. M. Handel. 2023. Adult shorebird morphological measurement data (ver. 3.0, November 2024). U.S. Geological Survey data release. https://doi.org/10.5066/P9KNRWXB (files: https://www.sciencebase.gov/catalog/item/6532f834d34ee4b6e05bb183). Statistics computed from `adultShorebird_morphologicalMeasurements_values.csv`; definitions from `..._metadata.xml`; species list in `..._taxonomy.csv`. The item also holds `shorebird_bodyImages.zip` (3.4 GB), not downloaded.
- **[Tobias et al. 2022]** Tobias, J. A., et al. 2022. AVONET: morphological, ecological and geographical data for all birds. *Ecology Letters* 25: 581-597. https://doi.org/10.1111/ele.13898 . Data: https://doi.org/10.6084/m9.figshare.16586228 ("AVONET Supplementary dataset 1.xlsx": sheets AVONET1_BirdLife and AVONET_Raw_Data; rows for *Limnodromus scolopaceus*, *L. griseus*, *Calidris melanotos*, *C. minutilla*).
- **[Dunning 2008]** Dunning, J. B. 2008. *CRC Handbook of Avian Body Masses*, 2nd ed. Not read; seen quoted in AVONET.
- **[Davis & Smith 2001]** Davis, C. A., and L. M. Smith. 2001. Foraging strategies and niche dynamics of coexisting shorebirds at stopover sites in the southern Great Plains. *The Auk* 118(2): 484-495. https://doi.org/10.1093/auk/118.2.484 (open: https://digitalcommons.usf.edu/auk/vol118/iss2/18). Methods p. 486; Table 2 p. 488; bill and mass p. 490.
- **[Davis & Smith 1998]** Davis, C. A., and L. M. Smith. 1998. Behavior of migrant shorebirds in playas of the Southern High Plains, Texas. *The Condor* 100(2): 266-276. https://doi.org/10.2307/1370267 (open: https://digitalcommons.usf.edu/condor/vol100/iss2/6). Abstract p. 266; aggression p. 269.
- **[Burton 1972]** Burton, P. J. K. 1972. The feeding techniques of Stilt Sandpipers and dowitchers. *Transactions of the San Diego Society of Natural History* 17(5): 63-68. https://doi.org/10.5962/bhl.part.19959 (read via https://archive.org/details/biostor-74490). Dowitchers "mostly *L. griseus*", Padre Island, Texas, April 1969. Methods p. 63; dowitcher section pp. 65-66; comparison p. 67.
- **[Eldridge et al. 2009]** Eldridge, J. L., G. L. Krapu, and D. H. Johnson. 2009. Feeding ecology of arctic-nesting sandpipers during spring migration through the prairie pothole region. *Journal of Wildlife Management* 73(2): 248-252. https://doi.org/10.2193/2006-416 (read via https://digitalcommons.unl.edu/usgsnpwrc/56). Table 5 p. 251.
- **[Lee & Birch 2006]** Lee, C.-T., and A. Birch. 2006. Advances in the field identification of North American dowitchers. *Birding* 38(5): 34-42. https://www.aba.org/birding_archive_files/v38n5p34.pdf . Bill and supercilium p. 35; body shape, legs, water depth, juvenile arrival and moult p. 36; Figs. 2-3 p. 38; tail pattern and juvenal field marks p. 39; basic-plumage flanks and Fig. 9 p. 40.
- **[WHC 2000]** Wildlife Habitat Council and NRCS. 2000. *Shorebirds*. Fish and Wildlife Habitat Management Leaflet. p. 5, "Typical foraging depths of various shorebirds (from Helmers 1992)". https://www.dnr.sc.gov/wildlife/species/coastalbirds/files/Brochures/ShorebirdManagementWHC.pdf . Helmers 1992 itself not read.
- **[AAB-D]** Cornell Lab of Ornithology. Long-billed Dowitcher Identification. All About Birds. https://www.allaboutbirds.org/guide/Long-billed_Dowitcher/id (accessed 2026-09-25). **[AAB-D-O]** .../Long-billed_Dowitcher/overview ; **[AAB-D-LH]** .../Long-billed_Dowitcher/lifehistory ; **[AAB-D gallery]** .../Long-billed_Dowitcher/photo-gallery (captions).
- **[AAB-P]** Cornell Lab of Ornithology. Pectoral Sandpiper Identification. All About Birds. https://www.allaboutbirds.org/guide/Pectoral_Sandpiper/id (accessed 2026-09-25). **[AAB-P-LH]** .../Pectoral_Sandpiper/lifehistory ; **[AAB-P gallery]** .../Pectoral_Sandpiper/photo-gallery (captions).
- **[BirdWeb-D]** Seattle Audubon Society. Long-billed Dowitcher. BirdWeb. https://birdweb.org/birdweb/bird/long-billed_dowitcher
- **[BirdWeb-P]** Seattle Audubon Society. Pectoral Sandpiper. BirdWeb. https://birdweb.org/birdweb/bird/pectoral_sandpiper
- **[Audubon-D]** National Audubon Society. Long-billed Dowitcher. Audubon Field Guide. https://www.audubon.org/field-guide/bird/long-billed-dowitcher . **[Audubon-P]** .../pectoral-sandpiper ; **[Audubon-L]** .../least-sandpiper (accessed 2026-09-25).
- **[AAB-P-O]** Cornell Lab of Ornithology. Pectoral Sandpiper Overview. All About Birds. https://www.allaboutbirds.org/guide/Pectoral_Sandpiper/overview (accessed 2026-09-25).
- **[iNat query 2026]** iNaturalist API v1, `/observations` and `/observations/histogram`, research grade. Taxon 3873 (Long-billed Dowitcher) and 3865 (Pectoral Sandpiper); bounding box 43.8-45.8 N, 122.5-123.6 W; monthly counts; life-stage annotation (term 1; values 2 = adult, 8 = juvenile). Queried 2026-09-25. Photos listed in the appendix were aged by me or by a sub-agent on the same criteria. Proxy data with observer and photographer bias.
- **[Patricia 2020]** Patricia (insectology). Long-billed Dowitcher, juvenile, Forest Grove, OR, 28 September 2020. iNaturalist observation 61157160, photo 97836472 (CC BY-NC). https://www.inaturalist.org/observations/61157160
- **[Herlyn 2023]** Herlyn, H. Pectoral Sandpiper, juvenile, Philomath Sewage Ponds, Benton County, OR, 17 September 2023. iNaturalist observation 183730684, photo 320589592 (CC BY-NC). https://www.inaturalist.org/observations/183730684
- **[Leighton 2018]** Leighton, L. Long-billed Dowitcher, Burnaby, BC, 16 February 2018. iNaturalist observation 118195363, photo 199669733 (CC BY-NC). https://www.inaturalist.org/observations/118195363
- **[Lindsey 2024]** Lindsey, C. (shearwater13). Long-billed Dowitcher, juvenile, Richland, WA, 14 September 2024. iNaturalist observation 242236507, photo 431840531 (CC BY-NC). https://www.inaturalist.org/observations/242236507
- **[Littauer 2020]** Littauer, R. Long-billed Dowitcher, juvenile, Middlesex, VT, 11 September 2020. iNaturalist observation 59261872, photo 94678140 (CC BY). https://www.inaturalist.org/observations/59261872
- **[irishou 2025]** irishou. Long-billed Dowitcher, juvenile, Steveston, Richmond, BC, 26 September 2025. iNaturalist observation 317105980, photo 572970766 (CC BY-NC). https://www.inaturalist.org/observations/317105980
- **[Baird 2008]** Baird, M. *Limnodromus scolopaceus Mike Baird.jpg*, Morro Strand State Beach, CA, 28 October 2008. CC BY 2.0. https://commons.wikimedia.org/wiki/File:Limnodromus_scolopaceus_Mike_Baird.jpg
- **[ADJ82 2016]** ADJ82. *PectoralSandpiper-1OCT2016.jpg*, Sacramento County, CA, 1 October 2016. CC BY-SA 4.0. https://commons.wikimedia.org/wiki/File:PectoralSandpiper-1OCT2016.jpg
- **[Andrew C 2016]** Andrew C. *Pectoral Sandpiper (Calidris melanotos) (29119997223).jpg*, East Fork State Park, Bethel, OH, 17 September 2016. CC BY 2.0. https://commons.wikimedia.org/wiki/File:Pectoral_Sandpiper_(Calidris_melanotos)_(29119997223).jpg
- **[scaup 2022]** scaup. *Calidris melanotos 225389663.jpg*, Nova Scotia, 25 August 2022 (iNaturalist observation 132359936). CC BY 4.0. https://commons.wikimedia.org/wiki/File:Calidris_melanotos_225389663.jpg
- **[jerry24470 2026]** jerry24470. *Long-billed dowitcher foraging Tainan 20260817*. YouTube, uploaded 9 September 2026; filmed 17 August 2026, Tainan, Taiwan. CC BY (YouTube "Creative Commons Attribution license (reuse allowed)"). 3840x2160 at 60 fps; the 1080p rendition at 59.94 fps examined, 0-15 s. https://www.youtube.com/watch?v=s6ccaEQu_P8
- **[Possen 2022a]** Possen, B. *Long-billed Dowitcher - Limnodromus scolopaceus - Grote grijze snip*. YouTube, uploaded 29 April 2022; place and date not stated; breeding-plumage adult. CC BY. 2560x1440 at 30 fps; 1080p examined, 0-48.7 s (2 fps overview; 30 fps at 0.5-5.5 s and 17.5-21 s). https://www.youtube.com/watch?v=JtTECV9s_NI
- **[Possen 2022b]** Possen, B. *Long-billed Dowitcher - Limnodromus scolopaceus - Grote grijze snip*. YouTube, uploaded 29 April 2022. CC BY. 1080p at 30 fps; 0-58.7 s at 2-6 fps. https://www.youtube.com/watch?v=I09-d8LvE4E
- **[Possen 2024]** Possen, B. *Long-billed dowitcher - Limnodromus scolopaceus - Grote grijze snip*. YouTube, uploaded 20 October 2024. CC BY. 1080p at 60 fps; 1.5-12.5 s at 10 fps. https://www.youtube.com/watch?v=oUAdB_BjsF0
- **[Pete 2017]** Pete (Flickr user doviende). *DSCN0479* ("Dowitcher sp."), Iona, Vancouver, British Columbia, 29 April 2017. CC BY-NC-SA 2.0. 640x360 at 59.94 fps. https://www.flickr.com/photos/93452626@N00/34289178986 ; mirror https://archive.org/details/Flickr-34289178986
- **[Jones 2026]** Jones, A. *Pectoral Sandpipers at Carsington Water in Derbyshire* (two juveniles). YouTube, uploaded 18 September 2026. CC BY. 3840x2160 at 60 fps; 1080p examined, 292.7-297.6 s and 317.7-320.7 s. https://www.youtube.com/watch?v=JU9JcAHmHnk
- **[Fossé 2012]** Fossé, A. *8.9.12 Bécasseau tacheté (Calidris melanotos, Pectoral Sandpiper)*. Juvenile, Ste-Gemmes-sur-Loire, Maine-et-Loire, France, 8 September 2012. CC BY. 640x480 at 30 fps; 0-9 s. https://www.youtube.com/watch?v=_Dl2erC9MH4
- **[Fossé 2021]** Fossé, A. *22.9.21 Bécasseau tacheté (ou B. à poitrine cendrée, Calidris melanotos, Pectoral Sandpiper)*. Maine-et-Loire, France, 22 September 2021. CC BY. 1080p at 25 fps; 45-61 s at 0.5-1 fps. https://www.youtube.com/watch?v=QN_9LZUxCMc
- Videos looked at but not used for numbers: Henise, D., *Long billed Dowitcher (Limnodromus scolopaceus) Video 2020-05-18 (1)*, Coquille Valley Wildlife Area, Oregon, CC BY, https://www.youtube.com/watch?v=fxkEA1eQqYY (the bird screened by grass); Yen, L.-K., *Long-billed Dowitcher | Yilan, Taiwan | 2025.10.25*, CC BY, https://www.youtube.com/watch?v=Ux9VYoH-g-k (distant); The Big Henken, *Pectoral Sandpiper, Rhode Island*, CC BY, https://www.youtube.com/watch?v=TD9-JUxXVpY (the camera follows the bird); Js Rp, *Bécasseau tacheté (Calidris melanotos), juvénile, Maillen, Belgique, 1/10/2021*, CC BY, https://www.youtube.com/watch?v=IQgJLn94ON4 (panning, facing the camera).
- **Not read (cited only as unread or snippet):** Pitelka, F. A. 1950. Geographic variation and the species problem in the shore-bird genus *Limnodromus*. *University of California Publications in Zoology* 50: 1-108 (not found online). Paulson, D. 1993. *Shorebirds of the Pacific Northwest* (quoted through Lee & Birch). Wilds, C., and M. Newlon. 1983. The identification of dowitchers. *Birding* 15: 151-166. Chandler, R. J. 1998. Dowitcher identification and ageing. *British Birds* 91: 93-106. Pyle, P. 2008. *Identification Guide to North American Birds*, Part II. O'Brien, M., R. Crossley, and K. Karlson. 2006. *The Shorebird Guide*. *Birds of the World* accounts for both species (Long-billed: Takekawa & Warnock, first published 2000), paywalled. Isola, C. R., M. A. Colwell, O. W. Taft, and R. J. Safran. 2000. *Waterbirds* 23: 196-203 (paywalled; snippet only). Safran, R. J., C. R. Isola, M. A. Colwell, and O. E. Williams. 1997. *Wetlands* 17: 407-415 (abstract only: shorebirds, dowitchers among them, used water under 10 cm). Taft, O. W., et al. 2002. *Journal of Applied Ecology* 39: 987-1001 (abstract only). Collazo et al. 2002 (*Waterbirds* special publication), Baker 1979 (*Oikos*), and Holmes & Pitelka 1968 (*Systematic Zoology*): not found open; not read.
