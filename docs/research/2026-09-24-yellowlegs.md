# Greater vs Lesser Yellowlegs: measurements, field marks, and late-September plumage

Date: 2026-09-24
Purpose: source data for the detailed Greater Yellowlegs (`greyel`) and Lesser Yellowlegs (`lesyel`) models in `docs/superpowers/specs/2026-09-24-detailed-birds-design.md`, so that a player at 20-25 m through the telescope can separate them the way a birder does.

How to read the citations: `[Key, p. N]` points to the References section at the end. "Snippet" means the text was only visible as a search-engine excerpt of a paywalled page; I could not read the page itself, so treat it as unverified. Numbers marked "computed" are my own arithmetic on the cited raw data.

---

## 1. Summary

- **Greater is a ~1.2x linear scale-up of Lesser with a ~1.55x bill.** Wing, tarsus, tail, and middle toe all scale by 1.18-1.23; mass scales by about 2.0; exposed culmen scales by 1.55-1.58 (computed from [Ridgway 1919, pp. 332, 338] and [USGS 2023]). The bill is the one part that is out of proportion, which is why bill-vs-head is the classic mark.
- **Bill vs head, measured:** bill length divided by (total head minus bill) is **1.49 in Greater** (n=7, range 1.37-1.70) and **1.17 in Lesser** (n=285, central 95% 1.02-1.34) in live adults measured by USGS (computed from [USGS 2023]). This matches the field-guide wording "about 1.5x head" for Greater and "only slightly longer than the head" for Lesser [AAB-G; AAB-L; BOTW-L snippet]. There is real overlap at the extremes [Sibley 2012].
- **Exposed culmen:** Greater 52-61 mm (mean ~56), Lesser 30-41 mm (mean ~36); the ranges do not overlap [Ridgway 1919, pp. 332, 338; USGS 2023].
- **Bill shape and colour:** Greater's bill is thicker-based and slightly upturned; Lesser's is thin and straight [AAB-G; AAB-L; BirdWeb-G; BirdWeb-L]. Ridgway describes the genus bill as "very faintly if at all upturned", so Greater's upturn must be subtle [Ridgway 1919, p. 329]. Outside the breeding season Greater's bill often has a greyish base; Lesser's stays dark all year [BirdWeb-G; BirdWeb-L; BOTW-L snippet].
- **Juvenile field marks (late September):** both are brown-grey above with neat pale notches and spots on the scapulars, coverts, and tertials. Greater juveniles have crisp, darker streaks on the neck and upper breast and dusky barring on the flanks [Bent 1927, p. 325; AAB-G]. Lesser juveniles have finer, paler, blurred ("smudgy") breast streaking [BirdWeb-L; AAB-L; BOTW-L snippet]. None of the sources I could read mention flank barring on juvenile Lesser.
- **Structure:** Greater is "large and lanky" with a long neck and small head; Lesser is "slender and elegant" and "dainty" [AAB-G; AAB-L]. Relative to body mass, Lesser's legs are about 5% longer (computed), and Lesser's toes stick out further past the tail in flight [BirdWeb-L; BirdWeb-G]. In Greater the culmen is nearly as long as the tarsus; in Lesser it is "decidedly shorter" [Ridgway 1919, p. 329].
- **Plumage recommendation: model both species as juveniles**, which is what the design spec already says. In the Pacific Northwest, adult Lessers pass mainly in July and juveniles from late July to early October [BOTW-L movements snippet citing Paulson 1993; BirdWeb-L]. Alaska-breeding adults migrate through the interior Prairie Pothole Region [McDuffie et al. 2022]. Greater juveniles migrate from mid-August to mid-November and keep juvenal plumage "well into October" [Team eBird 2017; Bent 1927, p. 325]. An adult Greater in basic plumage is the only plausible alternative plumage for late September. If you want variety, it could be a rare variant.
- **Relative abundance in the Willamette Valley in fall:** Greater is the expected yellowlegs and Lesser the scarcer one. The regional checklist rates Greater "regularly detected" and Lesser "occasionally detected" in fall [WVBT 2009]. From 10-30 September, iNaturalist has 115 research-grade Greater records against 15 Lesser in a Willamette Valley bounding box (proxy data, [iNat query 2026]).

---

## 2. Measurements

### 2.1 Ridgway 1919 (museum skins, adults, sexes separated)

Method [Ridgway 1901, pp. xv-xvi]: wing measured with dividers from the bend to the tip of the longest primary (unflattened chord); tail measured from between the bases of the central rectrices to the tip; "exposed culmen" from the edge of the frontal feathering; tarsus from the heel joint to the lower end; middle toe **without claw**. Ridgway warns that collector sexing is unreliable and that immatures and worn birds were excluded [Ridgway 1901, p. xvi].

| Species | Sex (n) | Wing | Tail | Exposed culmen | Tarsus | Middle toe (no claw) | Source |
|---|---|---|---|---|---|---|---|
| Greater | M (20) | 180-198.5 (187.8) | 71-83 (76.9) | 52-61 (55.8) | 57-68 (60.7) | 32.5-40.5 (35.5) | [Ridgway 1919, p. 332] |
| Greater | F (11) | 180-197 (188.9) | 71-83 (76.6) | 53.5-58 (55.5) | 55-62.5 (59.4) | 33-37.5 (34.8) | [Ridgway 1919, p. 332] |
| Greater | pooled (31), computed | 188.2 | 76.8 | 55.7 | 60.2 | 35.3 | computed |
| Lesser | M (15) | 149-163 (153.5) | 61-67 (62.8) | 35-38 (36.4) | 45.5-55.5 (50.0) | 27-32 (28.8) | [Ridgway 1919, p. 338] |
| Lesser | F (10) | 149.5-157 (155.8) | 55-66 (63.2) | 30-39 (35.5) | 46.5-52 (50.3) | 28-30 (28.9) | [Ridgway 1919, p. 338] |
| Lesser | pooled (25), computed | 154.4 | 63.0 | 36.0 | 50.1 | 28.8 | computed |

All values are in mm. Ridgway's species key gives the same envelope: Greater has wing 180-199, culmen 52-61, tarsus 55-68; Lesser has wing 149-163, culmen 30-39, tarsus 45.5-55.5 [Ridgway 1919, p. 330]. There is one internal inconsistency: the Lesser female wing range is printed as 149.5-157, but the regional sub-table lists an Alaska female at 163 [Ridgway 1919, p. 338].

### 2.2 USGS Alaska Science Center (live adults, 1997-2021)

Dataset [USGS 2023]. The statistics below are computed by me from `adultShorebird_morphologicalMeasurements_values.csv`, excluding recaptures. Definitions come from the dataset metadata:
- **Total head**: "tip of culmen to back of the shorebird's head".
- **Exposed culmen**: measured "from the most proximal unfeathered portion of the bill to the bill tip".
- **Diagonal tarsus**: intertarsal joint to the last scale before the toes.
- **Wing**: flattened and straightened, so it reads about 3-4% longer than Ridgway's chord.

All birds are after-hatch-year birds at Alaska and Canadian breeding or staging sites. Greater were measured in June and September; Lesser in May-August. Lesser sex was mostly determined genetically.

| Species | Group (n) | Mass g | Wing (flat) | Diag. tarsus | Exposed culmen | Total head | Head = TH - EC | EC / head |
|---|---|---|---|---|---|---|---|---|
| Greater | all (7-12) | 170.1 +/- 12.0 (150.7-190.9), n=11 | 194.7 +/- 5.3 (185-205), n=12 | 62.3 +/- 2.2 (59.5-66.8), n=11 | 56.3 +/- 2.5 (52.5-60.7), n=11 | 93.7 +/- 3.0 (90.6-98.4), n=7 | 37.7 +/- 1.9 (33.9-39.6), n=7 | 1.49 +/- 0.12 (1.37-1.70), n=7 |
| Lesser | all (285-325) | 83.9 +/- 7.7 (62.0-129.9; 95%: 71.3-100.1) | 159.5 +/- 5.0 (95%: 150-169) | 52.7 +/- 3.0 (95%: 47.7-58.7) | 35.6 +/- 1.7 (31.1-41.3; 95%: 31.8-38.9) | 66.0 +/- 2.1 (95%: 61.3-69.6) | 30.5 +/- 1.5 (95%: 27.5-33.3) | 1.17 +/- 0.09 (95%: 1.02-1.34) |
| Lesser | male (99-110) | 80.8 +/- 5.6 (67.1-95.5) | 157.9 +/- 4.4 | 52.2 | 35.3 +/- 1.6 (31.1-39.1) | 65.5 +/- 2.2 | 30.3 | 1.17 |
| Lesser | female (95-107) | 87.2 +/- 7.3 (71.3-110.2) | 161.7 +/- 4.2 | 53.2 | 35.8 +/- 1.8 (31.3-41.3) | 66.3 +/- 2.0 | 30.5 | 1.18 |

Means are +/- SD. "95%" is the 2.5th-97.5th percentile. The Lesser tarsus extremes of 34.9 and 63.1 are obvious outliers, so use the percentiles. The Greater sample is small: 12 birds, mostly from Anchorage, with no sex assigned. Three hatch-year Lessers measured in late July and August had culmens of 31.5-34.1 and total heads of 61-63. That is shorter than adults, which suggests juvenile bills may still be short in early autumn (n=3 only).

### 2.3 AVONET (museum skins, NHMUK; small n)

[Tobias et al. 2022] gives species means from Supplementary dataset 1, with raw rows checked:
- **Greater** (n=4; 2 M, 2 F): beak tip to skull base 59.9; beak from nostril to tip 45.9; **beak width at nostril 4.75 (4.5-5.5)**; **beak depth at nostril 6.0 (5.8-6.3)**; tarsus 60.5; wing 194.5; **Kipp's distance 97.6**; first-secondary length 96.9; hand-wing index 50.2; tail 79.8.
- **Lesser** (n=5; 3 M, 2 F): beak to skull 41.4; nostril to tip 30.6; **width 2.9 (2.5-3.5)**; **depth 4.0 (3.8-4.5)**; tarsus 49.6; wing 152.6; **Kipp's 79.8**; first-secondary length 71.5; hand-wing index 52.8; tail 65.6. The tail mean is inflated by one 85 mm value; the other four are 57-64.
- **Mass** in AVONET is taken from Dunning (2008): Greater 161.7 g, Lesser 77.5 g. I saw these only as quoted by AVONET and did not read Dunning.

### 2.4 Length, wingspan, mass from other sources

| Quantity | Greater | Lesser | Source / note |
|---|---|---|---|
| Length | 29-33 cm | 23-27 cm | [AAB-G; AAB-L] |
| Length | avg 14 in (35.6 cm) | avg 10.5 in (26.7 cm) | [ADFG-G; ADFG-L]; no source given |
| Length | "29 to 40 cm" | 23-25 cm | Wikipedia. The Greater figure is cited to All About Birds, but AAB actually says 29-33, so it is misattributed; do not use. The Lesser figure is cited to BOTW: seen quoted, not verified |
| Wingspan | 60 cm | 59-64 cm | [AAB-G; AAB-L]. Greater's 60 cm is implausible: it is smaller than Lesser's upper value while Greater's wing is 22% longer |
| Wingspan | 28 in (71 cm) | 24 in (61 cm) | [ADFG-G; ADFG-L] |
| Mass | 128-219 g | 79.5-90.9 g | [AAB-G; AAB-L] |
| Mass | 170 g | 84 g | [BTO BirdFacts] |
| Mass | 161.7 g | 77.5 g | Dunning 2008 via [Tobias et al. 2022] |
| Mass | - | 87.7 +/- 6.8 g (tagged adults; >= 80 g required for tags) | [McDuffie et al. 2022] |
| Relative size | "About 50% larger than a Lesser Yellowlegs" | - | [AAB-G] |

Where these disagree:
- **Length:** I would use AAB's ranges (midpoints 31 and 25 cm). Their ratio of 1.24 matches the independent linear-scale ratio from wing and tarsus (1.20-1.22) and the cube root of the mass ratio (1.27). ADFG's 35.6 cm Greater is above every other range.
- **Wingspan:** I would use about 71-74 cm for Greater (ADFG 71 cm; Lesser's 61 cm times 1.22 gives 74) and 61 cm for Lesser.
- **Mass:** I would use 170 g and 84 g. USGS (n=11 and n=323) and BTO agree, and Dunning's lower means are within one SD.
- **Bill-to-head ratio:** the stated values range from about 1.3x to more than 1.5x for Greater (see section 3.1). I would use the USGS-derived 1.49 and 1.17, which come from actual measurements with a stated definition.

---

## 3. Bill and head

### 3.1 How sources state the bill:head relationship

| Source | Greater | Lesser | What "head" means |
|---|---|---|---|
| [AAB-G] photo caption | "slightly upturned bill more than 1.5x as long as the head" | - | not defined |
| [AAB-L] Size & Shape | - | "only slightly longer than the bird's head (shorter and straighter than Greater Yellowlegs' bill)" | not defined |
| [BOTW-L snippet] Field Identification | "about 1.5 x length of head" | "thin, straight bill that is only slightly longer than head" | not visible (paywalled) |
| [BirdWeb-G; BirdWeb-L] | "longer than the diameter of its head" | "not significantly longer than the diameter of its head" | "diameter" of head, i.e. side-view head length |
| [Wilson 2013] (secondary) | "Measurement of museum specimens indicates the bill averages about 1.3 times the length of the head" | "pretty close to the length of the head" | not defined; no source given for the specimens |
| [Sibley 2012] | bill "50 mm or more" | "40 mm or less" | Sibley uses relative length but warns that "the shortest-billed Greater ... and a long-billed Lesser" can have "essentially identical" relative bill length |

**Measured ratio (computed from [USGS 2023])**. I defined head length as total head minus exposed culmen. That is the distance from the back of the head to the edge of the feathering at the bill base, measured with calipers against the skull. This is the closest published measurement to the side-view head length that birders judge by eye.
- Greater: head **37.7 mm**, ratio **1.49** (1.37-1.70, n=7). Bill is 60% of total head.
- Lesser: head **30.5 mm**, ratio **1.17** (95%: 1.02-1.34, n=285). Bill is 54% of total head.
- The difference in means is 0.32, about 3 SD of the Lesser distribution.

**Why sources give 1.3x and "about 1x" as well as 1.5x and 1.17 (my inference, not sourced).** A head length judged by eye includes the nape feathering, which calipers compress. It may also start the bill at the gape or loral feathering rather than at the frontal feathering point. Adding 3 mm of visible head to the USGS head lengths gives 56.3/40.7 = 1.38 for Greater and 35.6/33.5 = 1.06 for Lesser. That brackets the lower published figures. For the model, define the ratio the way the USGS data define it, so the test and the source agree.

Ridgway expresses the same difference against the tarsus: the exposed culmen is "nearly as long as tarsus (*N. melanoleuca*) or decidedly shorter (*N. flavipes*)" [Ridgway 1919, p. 329]. The computed ratios are culmen/tarsus 0.93 for Greater and 0.72 for Lesser (Ridgway), or 0.90 and 0.67 with the USGS diagonal tarsus.

### 3.2 Shape

- **Genus** (both species): "Bill slender (its depth at base equal to less than one-eighth the length of exposed culmen), slightly compressed, very faintly if at all upturned for distal half" and "not distinctly recurved" [Ridgway 1919, p. 329]. On that bound, base depth is under about 7.0 mm in Greater and under about 4.5 mm in Lesser (computed from the pooled culmen).
- **Nasal groove:** extends "about two-fifths the distance [to the tip of the maxilla] in *N. melanoleucus*, nearly half the distance in *N. flavipes*" [Ridgway 1919, p. 329].
- **Greater:** "thick-based, slightly upturned bill" [AAB-G]; "may appear slightly upturned" [BirdWeb-G]; "long, often slightly upturned bill" [ODFW-G]; "thick at the base, often perceptibly upturned" [BOTW-L snippet]. [Wilson 2013] (secondary) adds that the tip is "somewhat blunted".
- **Lesser:** "straight and thin" [AAB-L]; "always appears straight, without the slight upturn sometimes seen on the bill of the Greater" [BirdWeb-L]. [Wilson 2013] (secondary) calls it "needle-like ... with a sharp tip".
- **Measured thickness** [Tobias et al. 2022], computed:
  - Depth at the nostril relative to bill length is about the same in both species: 0.100 in Greater, 0.098 in Lesser.
  - Width relative to length is higher in Greater: 0.079 against 0.070.
  - So "thicker-based" is mostly absolute thickness (6.0 vs 4.0 mm deep, 4.8 vs 2.9 mm wide), with a somewhat broader base in Greater. The sample is n=4 and n=5.

### 3.3 Colour by season and age

| | Greater | Lesser |
|---|---|---|
| Breeding adult | "bill blackish becoming more grayish, or dusky horn colored, basally" [Ridgway 1919, p. 331]; "solid black" in breeding plumage [BirdWeb-G] | "bill black, the basal portion of mandible more brownish" [Ridgway 1919, p. 338] |
| Nonbreeding | "may be lighter gray at the base" [BirdWeb-G]; "often two-toned (grayish at base) in nonbreeding birds" [BOTW-L snippet] | "does not become paler at the base during the winter; it is solid black year round" [BirdWeb-L]; "mostly dark in all seasons" [BOTW-L snippet]; "entirely dark" [AAB-L]; "only a hint of yellow-brown at the base" [Binns 2006] |
| Juvenile | No source I could read addresses juvenile bill colour directly. Juveniles are in a nonbreeding-type plumage, so a subtle grey base on the Greater's bill (strongest on the lower mandible) is the defensible choice. Low confidence. | All dark, optionally a faint brownish base to the lower mandible, following Ridgway and Binns |

**Legs:** "In all plumages, legs are appropriately bright yellow, occasionally orange in spring" [AAB-G]; Lesser "vivid yellow legs" [AAB-L]. No source I read describes duller legs in juveniles.

---

## 4. Primary projection and wingtip vs tail

- **Genus structure** [Ridgway 1919, p. 329]:
  - "the longest primary (outermost) exceeding distal secondaries by more than half the length of wing". This is Kipp's distance over 50% of the wing.
  - Elongated tertials "rather broad, though tapering terminally, the tip of longest falling considerably short of tip of fourth primary (counted from outside)". My reading: on a closed wing, at least the four outer primary tips (P7-P10) lie beyond the longest tertial.
  - Tail "about two-fifths as long as wing, very slightly rounded (nearly truncate)"; 12 rectrices.
- **Kipp's distance** (wing tip beyond the first secondary) [Tobias et al. 2022]: Greater 97.6 mm (50.2% of wing), Lesser 79.8 mm (52.8%). Lesser's wing is marginally more pointed. Both species share Ridgway's tail/wing ratio exactly: 0.408 (computed).
- **Wingtip vs tail tip at rest:** I found no primary source with numbers.
  - For Lesser, the "wings extend well beyond the tail at rest" (contrasted with Wood Sandpiper) [Binns 2006, secondary].
  - A birding-class note says Lesser has "slightly longer wing projection, goes past the tail a little more" than Greater [ABC Birding notes, secondary, low confidence].
  - Recommendation: both models show wingtips a little past the tail tip, Lesser proportionally a bit more. Set the exact `primaryProjection` from traced reference photos, not from these notes.
- **Legs past the tail in flight** (useful for spread-wing poses): "flight is strong and swift, with legs extending well beyond the tail" [AAB-G]. Lesser's "entire toes and tip of tarsus visible behind the tail" [BirdWeb-L]; in Greater "the toes do not project as far behind the tail" [BirdWeb-G].

---

## 5. Juvenile plumage (the late-September comparison)

### 5.1 Greater Yellowlegs, juvenile

- **Upperparts:** "the feathers of the back, scapulars, and wing-coverts are 'bister' or 'warm sepia,' spotted or notched with 'pinkish buff' or buffy white, whitest on the upper back and most buffy on the scapulars"; crown "'bister,' streaked with white" [Bent 1927, p. 325]. By migration "the buffy tints have mostly faded out to white" [Bent 1927, p. 325]. Ridgway: young are like winter adults "but gray of upper parts darker and more brownish, the white spotting tinged with light brownish buffy" [Ridgway 1919, p. 331]. AAB: "Juveniles are browner above with crisp markings" [AAB-G].
- **Tertials and coverts:** "The pattern of white spots along the edges of the tertials and coverts, separating the juvenile from the adult, is becoming less obvious by this late in the season" (caption to a late-October juvenile) [Kaufman/BSBO]. In late September the spotting should still be clear.
- **Neck and breast:** "the sides of the neck and upper breast are streaked with ... dusky" [Bent 1927, p. 325]. Juvenile Lesser's streaks are "paler and more blurred ... than in juvenile Greater" [BOTW-L snippet], and juvenile Lesser has "finer streaking" than juvenile Greater [BirdWeb-L]. So Greater's streaks are darker, crisper, and bolder.
- **Flanks:** "the flanks are barred with dusky" in the juvenal plumage [Bent 1927, p. 325]. AAB: "There is usually some barring on the flanks" (Greater, most of the year) [AAB-G]. ADFG lists "greater barring on their white sides" as a Greater mark [ADFG-G].
- **Face:** "bright, white eyering" [AAB-G]. For the supercilium, the only description I found is Ridgway's breeding adult, "indistinct broad superciliary stripe" [Ridgway 1919, p. 331]; no juvenile-specific statement found.
- **Moult timing:** the juvenal plumage "is worn for three months or more, well into October ... Beginning in October a partial postjuvenal molt takes place involving the body plumage, most of the scapulars, and some of the wing coverts" [Bent 1927, p. 325]. A late-September juvenile is therefore still in full juvenal plumage, slightly faded.

### 5.2 Lesser Yellowlegs, juvenile

- **Upperparts:** "In this fresh juvenal plumage the feathers of the crown are tipped with whitish, and those of the back, scapulars, and wing coverts are edged, tipped, or notched with pale buff to white" [Bent 1927, p. 339]. Ridgway: young like winter adults "but the paler markings on upper parts more or less tinged with dull ochraceous or pale brown or dull clay color" [Ridgway 1919, p. 338]. The BOTW snippet says "browner above with more regular and profuse pale spotting" and a "neatly scaled" look. AAB: "Juveniles often have fine spotting on the back and a cap-headed look" [AAB-L].
- **Tertials:** "First winter birds are separated from adults by pale versus dark brown notching on tertials" [BOTW-L snippet]. So juvenile tertials carry pale notches.
- **Neck and breast:** "less distinct markings on the breast, which tends to make the breast look smudgy" [AAB-L]; "finer streaking on their breasts than do juvenile Greater" [BirdWeb-L]; "indistinct streaking on breast", "paler and more blurred" [BOTW-L snippet].
- **Flanks:** no source I read describes flank barring on juvenile Lesser. In breeding adults: "the sides barred ... flanks nearly immaculate" [Ridgway 1919, p. 337]; "only a bit of barring on the flanks" [AAB-L]; "less barring on their white sides" than Greater [ADFG-L]. **Model recommendation:** plain or near-plain flanks on the juvenile Lesser, at most a faint grey wash. That makes juvenile flank barring a Greater-only mark (medium confidence).
- **Face:** "eyelids white" and "a broad loral stripe of grayish flecked with dusky, extending from bill to eye" (breeding adult) [Ridgway 1919, p. 337]; winter adults have a white "supraloral stripe" [Ridgway 1919, p. 338]; "white eyering" [AAB-L]. The supercilium is "short ... does not extend behind the eye" [Binns 2006, secondary]. The juvenile's "cap-headed look" [AAB-L] suggests a darker crown over the paler face.
- **Moult timing:** "Subsequent molts and plumages are similar to and very much like those of the greater yellow-legs" [Bent 1927, p. 339].

### 5.3 What separates the two juveniles at 20-25 m (synthesis)

1. **Bill.** Absolute length (56 vs 36 mm) and length relative to the head (about 1.5x vs about 1.2x). Greater's bill is thicker, faintly upturned, and has a greyish base; Lesser's is thin, straight, and dark.
2. **Neck and breast streaking.** Greater: crisp, dark, extending onto the upper breast. Lesser: fine, pale, blurred, a smudgy grey-brown wash.
3. **Flanks.** Greater: dusky bars. Lesser: plain.
4. **Bulk.** Greater is twice the mass: taller and heavier-chested. Lesser is slim, "dainty", and small-headed, with a slightly "capped" look.
5. **Upperparts.** Both species are brown-grey with pale notches, so this is not a separating mark. Greater's spots fade to white by migration and are bolder. Lesser's are finer and more "profuse" and regular. This one is subtle; do not rely on it.

At 22 m through the game's 2-degree telescope the field is 0.77 m wide (computed: 2 x 22 m x tan 1 degree). A 56 mm bill spans 7.3% of the frame width and a 36 mm bill 4.7%. At a 1280 px canvas that is about 93 px against 60 px, so the bill difference should read clearly.

---

## 6. Adult plumages (brief)

- **Greater, breeding:**
  - Crown mostly dark; mantle and scapulars "very dark sepia, almost black, notched or tipped with white spots"; breast and flanks "heavily and irregularly barred" [Bent 1927, p. 326].
  - Chest and upper breast "irregularly streaked and spotted", with sides, flanks, and under tail-coverts barred [Ridgway 1919, p. 331].
  - AAB: "heavy barring on the flanks, sometimes extending across the belly" [AAB-G].
- **Lesser, breeding:** "Breeding birds have variable amounts of streaking on the breast with only a bit of barring on the flanks" [AAB-L]. Ridgway describes "the chest spotted with dusky, and the sides barred with the same; flanks nearly immaculate" [Ridgway 1919, p. 337].
- **Greater, nonbreeding (basic):**
  - Upperparts light grey; the black markings are gone but the white spotting remains; foreneck and chest narrowly streaked; breast "nearly if not quite immaculate"; sides and flanks "irregularly marked with grayish" [Ridgway 1919, p. 331].
  - Back and scapulars "mainly plain 'wood brown,' with inconspicuous whitish edgings and notches" [Bent 1927, p. 326].
- **Lesser, nonbreeding:** upperparts grey, "sometimes nearly uniform", with small dusky and whitish edge spots; "head, neck, and chest nearly uniform light gray" [Ridgway 1919, p. 338]. AAB: "sparse streaking on the neck that often looks smudgy" [AAB-L].
- **Moulting adults in autumn:**
  - Greater adults undergo "the complete postnuptial molt of the body plumage ... in August and September, but the wings are not molted until winter" [Bent 1927, p. 326]. A late-September adult Greater is therefore mostly grey basic on the body, may keep a few worn dark-centred breeding feathers, and has worn primaries.
  - Lesser adults molt primaries on the wintering grounds ("molting their primaries in January and February") [Bent 1927, p. 339].
  - In September, "juveniles may not look as fresh ... and the adults may look more worn" [Kaufman/BSBO].

---

## 7. Structure and gestalt

- **Overall.** Ridgway, who kept both in one genus: "if it were not for the difference in size it would be almost impossible to distinguish them!" [Ridgway 1919, p. 330].
- **Scale factors, Greater/Lesser (computed):**

  | Measure | Ratio | Source |
  |---|---|---|
  | Wing | 1.22 | Ridgway; 1.22 in USGS |
  | Tail | 1.22 | Ridgway |
  | Tarsus | 1.20 | Ridgway; 1.18 in USGS |
  | Middle toe | 1.22 | Ridgway |
  | Head (TH - EC) | 1.24 | USGS |
  | Total head | 1.42 | USGS |
  | Culmen | 1.55 | Ridgway; 1.58 in USGS |
  | Mass | 2.03 | USGS |
  | Cube root of mass | 1.27 | computed from USGS |

- **Shared proportions** [Ridgway 1919, pp. 329-330]:
  - Tarsus is about one-third of the wing (computed: 0.320 Greater, 0.324 Lesser).
  - Tail is about two-fifths of the wing (computed: 0.408 both).
  - "Bare portion of tibia about as long as middle toe without claw".
  - Lateral toes shorter than the middle toe; hallux small and elevated.
  - A web between the outer and middle toes for about half the basal phalanx, and a very small inner web.
- **Legs relative to body.** "Relative to its size, the Lesser's legs are longer than those of the Greater Yellowlegs" [BirdWeb-L]. Computed: tarsus relative to body size (tarsus divided by the cube root of mass) is 11.4 for Lesser and 10.9 for Greater, about 5% longer in Lesser. Relative to the wing the two are equal.
- **Gestalt words from the sources:**
  - Greater: "Large and lanky ... very long legs, a long neck" [AAB-G]; "Slender, long-necked, and small-headed" [AAB-G caption]; "Tall and gangly ... Stands upright" [AAB-G caption]; "This tall, pale wader" [ODFW-G].
  - Lesser: "slender and elegant, medium-sized" [AAB-L]; "Dainty shorebird"; "Small-headed and dainty" [AAB-L captions]; "This small, remarkably delicate long-legged wader" [ODFW-L]; "slender, shapely head and neck" [Bent 1927, p. 343].
- **Secondary, low confidence.** One source describes Greater as "chunky, bulky" with a "relatively small head and thin neck", a neck that "frequently has a kink in it, like a heron", and a breastbone that "bulges from the chest" [Wilson 2013]. Class notes add "Big belly, Adam's apple" [ABC Birding notes]. These agree with the "heavier-chested Greater" impression but are not primary.

---

## 8. Late-September age mix in the Willamette Valley

### 8.1 What the sources say

**Continental pattern: adults move south before juveniles.**
- "As with all shorebirds, the southward migration of adults precedes the migration of juveniles" [Team eBird 2017].
- "There is often a full month between the peak passage of adults and the peak passage of juveniles" [Kaufman/BSBO].

**Greater Yellowlegs.**
- "adults peaking late June to mid-September and juveniles from mid-August to mid-November"; "still on the move into November while most Lessers have reached their wintering range by late October" [Team eBird 2017].
- In northern Ohio, adults peak in August; "Juveniles start to appear by about the first of August, and their peak numbers occur in late September" [Kaufman/BSBO].
- Alaska adults leave "(females first, then males) in late July. Juvenile yellowlegs often depart in October but may linger late into fall" [ADFG-G].
- The juvenal plumage is worn "well into October" [Bent 1927, p. 325].
- The species "winters on the coast and locally inland ... in flooded pastureland, especially in winter" [ODFW-G]. So some late-September adults may be early winterers.

**Lesser Yellowlegs.**
- Pacific Northwest: "low numbers of adults migrate through the Pacific Northwest in July, juveniles present in higher numbers from late July-early October" (Paulson 1993, quoted in [BOTW-L movements snippet]).
- Washington: "Most of the birds in Washington in July are adults, and the juveniles follow from late July into early October. Lesser Yellowlegs are fairly uncommon after the middle of October" [BirdWeb-L].
- Tracked adults: "The Prairie Pothole Region (PPR) supported lesser yellowlegs migrating from Alaska (100% of birds)"; "Individuals tagged in Alaska and Central Canada followed similar southbound migratory routes, stopping to refuel in the Prairie Pothole Region" [McDuffie et al. 2022]. So adults from the nearest breeding population go through the interior, not west of the Cascades. The same paper notes that "count data indicate that lesser yellowlegs are common in the Pacific Northwest during southbound migration (Paulson, 1993)", which fits a Pacific Northwest passage made up mainly of juveniles.
- Northern Ohio: adults peak mid-July to early August; juveniles peak late August to early September [Kaufman/BSBO].
- New England: "the adults usually depart before the end of August, and few young birds are left after the middle of September" [Bent 1927, p. 343].

**Willamette Valley specifically.**
- The Willamette Valley Birding Trail checklist (2009) scores detectability by season:
  - Greater: spring "regularly", summer "occasionally", fall "regularly", winter "rarely".
  - Lesser: spring, summer, and fall "occasionally", winter "very rarely" [WVBT 2009, pp. 44-45].
- Mid- and south-valley field notes for fall 2005: "Lesser Yellowlegs – High counts were six at FRR [Fern Ridge Reservoir] 2 Aug ... and five at BSNWR [Baskett Slough NWR] 5 Sep ... Lone stragglers were at Toketie Marsh BENT 3 Oct ... and FRR 5 Oct"; "Greater Yellowlegs – 47 along Greenhill Rd. LANE 25 Nov ... was a high count" [Oregon Birds 32(1), p. 38].
- iNaturalist research-grade records in a Willamette Valley box (43.8-45.8 N, 122.5-123.6 W), all years, queried 2026-09-24 [iNat query 2026]:
  - Greater by month: Jul 116, Aug 171, Sep 181, Oct 105, Nov 32.
  - Lesser by month: Jul 16, Aug 43, Sep 29, Oct 11, Nov 0.
  - For 10-30 September: 115 Greater against 15 Lesser.
  - Life-stage annotations are too sparse to give an age ratio: 2 "adult" and 0 "juvenile" among the 115 Greater, and "adult" is often used loosely.

### 8.2 Recommendation

- **Lesser:** model a **juvenile**. By late September the regional sources expect adults to be gone and the stragglers to be juveniles. Lesser is also the scarcer species at this date, peaking in August in the valley.
- **Greater:** model a **juvenile** as the default. Juveniles peak continent-wide in late September and still wear juvenal plumage then. A minority of Greaters present will be adults: late migrants or early winterers, in fresh grey basic body plumage with worn primaries. No source gives a Willamette Valley age ratio. If the game ever shows more than one Greater, an optional adult-basic variant is defensible, but it is not needed for the ID test.
- This matches the design spec's "Juvenile for both yellowlegs". Pairing two juveniles is the fair comparison: same plumage stage, so the separating marks are structure, bill, streaking, and flanks rather than age.

---

## 9. Numbers for the model

These map to `detail.measurements` in `2026-09-24-detailed-birds-design.md` (metres), plus the extra quantities the tests need.

| Field | Greater | Lesser | How chosen |
|---|---|---|---|
| `length` (bill tip to tail tip) | **0.31 m** | **0.25 m** | Midpoints of AAB 29-33 and 23-27 cm. The ratio of 1.24 agrees with the linear scale factors in section 7. Current `greyel.ts` has 0.33, the top of the AAB range |
| `culmen` (exposed) | **0.056 m** | **0.036 m** | Ridgway pooled means 55.7 (n=31) and 36.0 (n=25); USGS 56.3 (n=11) and 35.6 (n=324) |
| `billDepth` (at base) | **0.0065 m** | **0.0043 m** | AVONET depth at the nostril, 6.0 and 4.0 mm (n=4 and n=5), plus a small allowance for the base, kept under Ridgway's depth < culmen/8 bound (7.0 and 4.5 mm). Use 0.0060 and 0.0040 if you want measured values only |
| `bill.width` (at base) | **0.0050 m** | **0.0030 m** | AVONET width at the nostril: 4.75 and 2.9 mm |
| `bill.curve` | small positive (faint upturn on the distal half) | **0** (straight) | [Ridgway 1919, p. 329] "very faintly if at all upturned"; [AAB-G] "slightly upturned"; [AAB-L] "straight" |
| head length (TH - EC), for the bill:head check | **0.038 m** | **0.0305 m** | USGS computed means 37.7 (n=7) and 30.5 (n=285). This gives culmen/head = 1.47 and 1.18 |
| `tarsus` | **0.061 m** | **0.051 m** | Midpoint of museum (Ridgway 60.2, 50.1) and live diagonal tarsus (USGS 62.3, 52.7), rounded. Live tarsi run about 2 mm longer |
| `tibia` (exposed, bare) | **0.035 m** | **0.029 m** | [Ridgway 1919, p. 330]: "bare portion of tibia about as long as middle toe without claw". Set equal to the middle-toe means. Derived; low confidence |
| `toe` (middle, without claw) | **0.035 m** | **0.029 m** | Ridgway pooled means 35.3 and 28.8. If the mesh toe includes the claw, add a few mm; no claw data found |
| `wingChord` | **0.188 m** | **0.155 m** | Ridgway pooled unflattened chord 188.2 and 154.4, which is what the folded wing shows. Flattened live values are 194.7 and 159.5 (USGS) |
| `tail` | **0.077 m** | **0.063 m** | Ridgway pooled 76.8 and 63.0. Shape "very slightly rounded (nearly truncate)", so `square` or a barely `rounded` shape |
| `primaryProjection` | wingtip at or just past tail tip; at least P7-P10 tips beyond the longest tertial | same, proportionally a bit longer | Ridgway genus text plus secondary notes (section 4). Trace from photos; no numeric source |
| mass (if used) | 170 g | 84 g | USGS means (n=11, n=323); BTO gives 170 and 84 |
| wingspan (check only) | about 0.72 m | about 0.61 m | ADFG 71 cm and 61 cm; AAB Lesser 59-64 cm. AAB's Greater figure of 60 cm is rejected |

Plumage layers to separate the juveniles (section 5):

| Layer | Greater | Lesser |
|---|---|---|
| Bill | dark, subtle grey basal gradient | all dark |
| Neck and upper breast | crisp dark streaks | fine, pale, blurred streaks; grey-brown wash |
| Flanks | dusky bars | plain |
| Upperparts | brown-grey with white spots and notches (buff mostly faded) | brown-grey with finer, more regular pale spotting and notching; faint buff tinge acceptable |
| Tertials | white notches along the edges | pale notches along the edges |
| Face (both) | white eye-ring and pale supraloral | same, with a slightly darker "cap" |
| Legs (both) | bright yellow | bright yellow |
| Rump and tail (both, for flight) | white rump and uppertail coverts; barred tail; no wing stripe [Ridgway 1919, pp. 330-331; Bent 1927, p. 343] | same |

---

## 10. Suggested test thresholds

Assert that the built mesh sits inside published ranges, and that the two species are separated where the sources say they separate. All lengths are in mm; divide by 1000 for metres.

| Assertion | Greater | Lesser | Basis |
|---|---|---|---|
| Exposed culmen | 52-61 | 30-41 | Ridgway ranges 52-61 and 30-39; USGS 52.5-60.7 and 31.1-41.3. The ranges do not overlap |
| Culmen / head (head = total head - culmen) | 1.35-1.70 | 1.00-1.35 | USGS: Greater 1.37-1.70 (n=7); Lesser central 95% 1.02-1.34 (n=285) |
| Separation: ratio(Greater) - ratio(Lesser) | >= 0.20 | | Means differ by 0.32 |
| Culmen / tarsus | 0.82-1.02 | 0.62-0.80 | Ridgway 0.93 and 0.72; USGS 0.90 and 0.67; Ridgway's "nearly as long" vs "decidedly shorter" |
| Bill depth at base | 5.5-7.0 | 3.6-4.6 | AVONET nostril depth 5.8-6.3 and 3.8-4.5; Ridgway bound < culmen/8 |
| Bill depth ratio, Greater/Lesser | 1.3-1.7 | | AVONET 6.0/4.0 = 1.49 |
| Bill curve | > 0; tip rise at most about one base depth | about 0 (tip deviation < 1 mm) | Ridgway "very faintly ... upturned"; the "about one depth" cap is my heuristic |
| Tarsus | 55-68 | 45.5-59 | Ridgway 55-68 and 45.5-55.5; USGS central 95% for Lesser up to 58.7 |
| Exposed tibia | 30-40 | 25-33 | Plus or minus about 15% around the "equals middle toe" estimate. Low confidence; use as a sanity bound only |
| Middle toe (without claw) | 32-41 | 27-32 | Ridgway ranges |
| Wing chord | 180-205 | 147-170 | Ridgway chord ranges, widened to cover USGS flattened ranges |
| Tail | 71-83 | 55-67 | Ridgway ranges |
| Total length | 290-330 | 230-270 | AAB |
| Tarsus / wing, both | 0.29-0.36 | 0.29-0.36 | Ridgway "one-third"; 0.320 and 0.324 |
| Tail / wing, both | 0.37-0.45 | 0.37-0.45 | Ridgway "two-fifths"; 0.408 and 0.408 |
| Size ratio Greater/Lesser: wing | 1.17-1.28 | | Ridgway 1.22; USGS 1.22; AVONET 1.27 |
| Size ratio Greater/Lesser: culmen | 1.45-1.65 | | Ridgway 1.55; USGS 1.58; AVONET skull-based 1.45 |
| Size ratio Greater/Lesser: mass (if used) | 1.9-2.2 | | USGS 2.03; BTO 2.02; Dunning 2.09 |

Measure "head" on the mesh the way USGS does: total head is the bill tip to the rearmost point of the head surface, and the head is total head minus the exposed culmen. If the mesh adds a thick nape feather layer, the ratio will drop by about 0.05-0.1 (section 3.1); keep the feather layer thin or measure to the skull-equivalent surface.

---

## 11. Open questions and confidence

**High confidence**
- Culmen, wing, tail, tarsus, and middle-toe values and ranges: two independent datasets agree within about 2 mm.
- Lesser bill:head ratio (n=285).
- Mass ratio of about 2.
- Adults migrating before juveniles.
- Lesser in the Pacific Northwest in late September being juveniles.

**Medium confidence**
- **Greater bill:head ratio.** It rests on only n=7 live Alaska birds (1.37-1.70). It agrees with the "about 1.5x" and "more than 1.5x" statements but not with [Wilson 2013]'s unsourced 1.3x; section 3.1 gives a probable reason.
- **Bill depth at base.** Inferred from nostril-level measurements of 4-5 museum skins.
- **Juvenile flank barring.** Present in Greater [Bent 1927], absent in Lesser (no source says it is present).
- **Greater age mix.** Juveniles dominant in late September; there is no Willamette Valley age ratio.

**Low confidence or not verified**
- **Exposed tibia** comes from a single qualitative genus statement [Ridgway 1919, p. 330]. No measured values found.
- **Primary projection and wingtip vs tail:** no primary numeric source; secondary notes only.
- **Juvenile bill colour:** no readable source addresses it directly.
- **Juvenile bill length:** three hatch-year Lessers had culmens of 31.5-34.1 in July-August (USGS). The bill may not be full-grown by late September, and I could not confirm when juvenile bills reach adult length.
- **Greater wingspan:** AAB's 60 cm conflicts with scaling; ADFG's 71 cm has no stated source.
- **Snippet-only claims** from BOTW Field Identification and Movements (tagged "BOTW-L snippet"): the wording was visible only in search-engine excerpts attributed to those pages.

**Sources I could not read** (not relied on for any number here)
- **Birds of the World** (Elphick & Tibbitts; Tibbitts & Moskoff): Plumages, Molts and Structure; Measurements; Movements. Paywalled; only the introductions are free.
- **Pyle 2008**, *Identification Guide to North American Birds, Part II*: not online.
- **Prater, Marchant & Vuorinen 1977**, BTO Guide 17: not found online.
- **Lending-only on the Internet Archive:** Hayman, Marchant & Prater 1986 *Shorebirds*; Paulson 1993 *Shorebirds of the Pacific Northwest*; Paulson 2005 *Shorebirds of North America*; O'Brien, Crossley & Karlson 2006 *The Shorebird Guide*; Kaufman 1990 *Advanced Birding*; Marshall, Hunter & Contreras 2003 *Birds of Oregon: A General Reference*; Gilligan et al. 1994 *Birds of Oregon: Status and Distribution*.
- **Dunning 2008**: seen only as quoted by AVONET.
- **eBird bar charts and county data** for Benton, Linn, Lane, Marion, Polk, Yamhill, and Washington counties: the export requires sign-in. eBird age-tagged counts were not accessible.
- **Biodiversity Heritage Library** pages returned 403 to automated fetches. Ridgway was read from the Internet Archive OCR of the Cornell copy, and page numbers come from the scan's running heads.

**Worth doing if higher confidence is needed**
- Pull the BOTW Measurements tables with a subscription.
- Get a Willamette Valley eBird bar chart (weeks of September) to confirm relative abundance.
- Collect late-September Oregon photos from Macaulay Library, aged by eye, to estimate the Greater adult:juvenile ratio.

---

## References

- **[Ridgway 1919]** Ridgway, R. 1919. *The Birds of North and Middle America*, Part VIII. Bulletin of the United States National Museum 50(8). Government Printing Office, Washington. Genus *Neoglottis* pp. 329-330; *N. melanoleuca* pp. 330-337 (measurements p. 332); *N. flavipes* pp. 337-339 (measurements p. 338). Read via Internet Archive OCR: https://archive.org/details/cu31924022528107 . BHL record: https://www.biodiversitylibrary.org/bibliography/48566
- **[Ridgway 1901]** Ridgway, R. 1901. *The Birds of North and Middle America*, Part I. Bull. U.S. Natl. Mus. 50(1). "Note" on measurement methods, pp. xv-xvi. https://archive.org/details/cu31924090256870
- **[Bent 1927]** Bent, A. C. 1927. *Life Histories of North American Shore Birds*, Part 1. Bull. U.S. Natl. Mus. 142. Greater Yellowlegs pp. 321-336 (Plumages pp. 325-326; Field marks and Fall p. 330); Lesser Yellowlegs pp. 336-349 (Plumages p. 339; Field marks and Fall pp. 343-344). Read in the unabridged 1962 Dover reprint, which keeps the Bulletin 142 page numbers: https://archive.org/details/bwb_T5-BCJ-681 ; also https://archive.org/details/lifehistoriesofn0006unse
- **[USGS 2023]** Ruthrauff, D. R., T. L. Tibbitts, R. E. Gill Jr., and C. M. Handel. 2023. Adult shorebird morphological measurement data (ver. 3.0, November 2024). U.S. Geological Survey data release. https://doi.org/10.5066/P9KNRWXB (files: https://www.sciencebase.gov/catalog/item/6532f834d34ee4b6e05bb183). Statistics in this document were computed by me from `adultShorebird_morphologicalMeasurements_values.csv`.
- **[Tobias et al. 2022]** Tobias, J. A., et al. 2022. AVONET: morphological, ecological and geographical data for all birds. *Ecology Letters* 25: 581-597. https://doi.org/10.1111/ele.13898 . Data: https://doi.org/10.6084/m9.figshare.16586228 (v7, "AVONET Supplementary dataset 1.xlsx": sheets AVONET1_BirdLife and AVONET_Raw_Data).
- **[Dunning 2008]** Dunning, J. B. 2008. *CRC Handbook of Avian Body Masses*, 2nd ed. CRC Press. https://doi.org/10.1201/9781420064452 . Not read; values seen quoted in AVONET.
- **[AAB-G]** Cornell Lab of Ornithology. Greater Yellowlegs Identification. All About Birds. https://www.allaboutbirds.org/guide/Greater_Yellowlegs/id (accessed 2026-09-24).
- **[AAB-L]** Cornell Lab of Ornithology. Lesser Yellowlegs Identification. All About Birds. https://www.allaboutbirds.org/guide/Lesser_Yellowlegs/id (accessed 2026-09-24).
- **[BOTW-G]** Elphick, C. S., and T. L. Tibbitts. 2020. Greater Yellowlegs (*Tringa melanoleuca*), version 1.0. In *Birds of the World*. Cornell Lab of Ornithology. https://doi.org/10.2173/bow.greyel.01 . Paywalled; only the introduction read.
- **[BOTW-L]** Tibbitts, T. L., and W. Moskoff. 2020. Lesser Yellowlegs (*Tringa flavipes*), version 1.0. In *Birds of the World*. https://doi.org/10.2173/bow.lesyel.01 . Paywalled. "BOTW-L snippet" marks wording seen only in search-engine excerpts of https://birdsoftheworld.org/bow/species/lesyel/cur/identification and .../movement ; the Movements excerpt cites Paulson (1993).
- **[Paulson 1993]** Paulson, D. 1993. *Shorebirds of the Pacific Northwest*. University of Washington Press. Not read; quoted via BOTW-L and McDuffie et al. 2022.
- **[Sibley 2012]** Sibley, D. 2012. Why are Yellowlegs hard to identify? Sibley Guides blog, 26 July 2012. The live URL returns 404; archived copy: http://web.archive.org/web/20260515195146/https://www.sibleyguides.com/2012/07/why-are-yellowlegs-hard-to-identify/
- **[Wilson 2013]** Wilson, H. 2013. Yellowleg Identification. *Maine Birds* (Colby College blog), 29 Aug 2013; first published in the Portland Press Herald, 18 Aug 2013. Secondary; gives no source for its museum-specimen claim. http://web.archive.org/web/20170822212355/http://web.colby.edu:80/mainebirds/2013/08/29/yellowleg-identification/
- **[BirdWeb-G]** Seattle Audubon Society. Greater Yellowlegs. BirdWeb. https://birdweb.org/birdweb/bird/greater_yellowlegs
- **[BirdWeb-L]** Seattle Audubon Society. Lesser Yellowlegs. BirdWeb. https://birdweb.org/birdweb/bird/lesser_yellowlegs
- **[Team eBird 2017]** Team eBird. 2017. Greater Yellowlegs. eBird News, 15 Sep 2017. https://ebird.org/news/greyel
- **[Kaufman/BSBO]** Kaufman, K. Timing of Fall Shorebird Migration (northern Ohio). Black Swamp Bird Observatory. https://www.bsbo.org/timing-of-fall-shorebird-migration.html (undated; accessed 2026-09-24).
- **[ADFG-G]** Alaska Department of Fish and Game. Greater Yellowlegs Species Profile. https://www.adfg.alaska.gov/index.cfm?adfg=greateryellowlegs.main
- **[ADFG-L]** Alaska Department of Fish and Game. Lesser Yellowlegs Species Profile. https://www.adfg.alaska.gov/index.cfm?adfg=lesseryellowlegs.main
- **[McDuffie et al. 2022]** McDuffie, L. A., K. S. Christie, A. R. Taylor, E. Nol, C. Friis, C. M. Harwood, J. Rausch, B. Laliberte, C. Gesmundo, J. R. Wright, and J. A. Johnson. 2022. Flyway-scale GPS tracking reveals migratory routes and key stopover and non-breeding locations of lesser yellowlegs. *Ecology and Evolution* 12(11): e9495. https://doi.org/10.1002/ece3.9495 (full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC9646513/)
- **[ODFW-G]** Oregon Department of Fish and Wildlife. Greater yellowlegs. https://myodfw.com/wildlife-viewing/species/greater-yellowlegs
- **[ODFW-L]** Oregon Department of Fish and Wildlife. Lesser yellowlegs. https://myodfw.com/wildlife-viewing/species/lesser-yellowlegs
- **[WVBT 2009]** Willamette Valley Birding Trail. 2009. Willamette Valley Birding Checklist (guide pp. 44-45). http://www.oregonbirdingtrails.org/wvguide/Birding%20Checklist.pdf . The symbols rate ease of detection, not abundance.
- **[Oregon Birds 32(1)]** Oregon Birds 32(1), Spring 2006. Field Notes, Willamette Valley (period Aug-Nov 2005), pp. 36-38. https://oregonbirding.org/wp-content/uploads/2018/10/ob32.1.pdf
- **[iNat query 2026]** iNaturalist API v1, `/observations`, research grade: taxon 3892 (Greater) and 3893 (Lesser); bounding box 43.8-45.8 N, 122.5-123.6 W; monthly counts and 10-30 September counts with life-stage annotation (term 1, values 2 = adult and 8 = juvenile). Queried 2026-09-24. A proxy for relative encounter rate, with observer bias.
- **[BTO BirdFacts]** British Trust for Ornithology. Greater Yellowlegs and Lesser Yellowlegs BirdFacts (weights). https://www.bto.org/learn/about-birds/birdfacts/greater-yellowlegs ; https://www.bto.org/learn/about-birds/birdfacts/lesser-yellowlegs
- **[Binns 2006]** Binns, A. 2006. Lesser Yellowlegs / Wood Sandpiper. Delaware Valley Ornithological Club, Ornithological Studies. Secondary. http://web.archive.org/web/20171227073057/http://www.dvoc.org:80/OrnithStudy/Presentations/Presentations2006/LesserYellowlegsWoodSandpiper.htm
- **[ABC Birding notes]** "Ken's Class Notes" (tag: shorebird identification). ABC Birding. Informal secondary notes from a Washington shorebird class; low confidence. http://abcbirding.com/tag/shorebird-identification/
