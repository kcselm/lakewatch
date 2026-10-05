# Belted Kingfisher: measurements, late-September plumage, field marks, perched posture, and behaviour

Date: 2026-09-30
Purpose: source data for the detailed Belted Kingfisher (`belkin1`) model and its settings in the new `kingfisher` behaviour, in `docs/superpowers/specs/2026-09-30-kingfisher-design.md`. The scene: Willow Lake, Willamette Valley, Oregon, a late-September morning. The bird perches on the snag at about 53 m and on new perches around the shore, the nearest at about 25-35 m; it is seen through binoculars (7.5°: about 3.6 mm of bird per pixel at 30 m on a 1080-pixel-tall view) and the telescope (2°: about 1.7 mm per pixel at 53 m). The spread wing, the hover and the plunge's mechanics are in the companion document, `2026-09-30-kingfisher-flight-and-plunge.md`; this one gives the bird, its perched posture, and its habits.

How to read the citations: `[Key, p. N]` points to the References section at the end. "Snippet" means the text was visible only as a search-engine excerpt or an abstract; I could not read the page, so treat it as unverified. "Computed" means my own arithmetic on cited data. "Photo-measured" means I read points by hand on a grid laid over a cited photo and scaled them by the exposed culmen (59.5 mm, section 2.6) or, where the culmen's base can't be read, by the eye-to-bill-tip distance times 0.70 (section 5.1). "Estimate" means no source gives the number and I chose it, with the basis stated. "By eye" means a judgement from the photos without a measurement.

---

## 1. Summary

- **Measurements** (mean of the sexes, the western race *caurina*, which takes in Oregon; mm): exposed culmen **59.5**, bill depth at the feathering **16** and width **11** (both Estimates from AVONET's 13.4 × 9.5 at the nostril), tarsus **11.4**, middle toe **15.8**, wing chord **164**, tail **93**; skins 310 long; mass about **150 g**; wingspan about 530 (section 2.6). Females are 1-5% larger, which nobody could see.
- **The foot is syndactyl:** the middle toe joined to the outer for two phalanges and to the inner for one, making "a broad flattened sole" [Ridgway 1914, p. 406]. Tiny and mostly hidden on a perch.
- **Model length**, bill tip to tail tip in the traced perched posture: **about 325 mm** (photo-measured). The body axis is 31° from level, the bill 4° down when alert and 44° down when peering at the water (section 6).
- **The crest** stands about 20 mm above the eye's centre when sleeked and 30 mm raised, its feathers 20-25 mm proud of the head's outline and 30-40° up (photo; no published length).
- **Versions: `female` and `male`.** Of 101 valley records from 13 September to 12 October (94 bird-days), 27 bird-days were female and 20 male (**57% female**); 11 could be aged, about half juveniles (section 3.3). **Cast one bird, `female`** (section 3.4). Juveniles, with rusty mottling in the blue band, are a few pixels' difference at binocular range and are not worth two more versions for one bird.
- **Field marks:** the shape (big head, shaggy double crest, heavy black bill), blue-grey above, a white collar all round, a blue-grey breast band, the female's rufous band and flanks, the white patch in the outer wing in flight, the hover, the head-first plunge, and the loud dry rattle "often given in flight" (section 4). Through binoculars at 30 m (3.6 mm/px) the collar, the bands and the crest read; the white wing specks and tail bars don't.
- **Hunting:** from a perch, or hovering "a few seconds" 9-12 m up before a straight-down plunge [Bent 1940, p. 120]. No source counts the shares; **0.65 perch, 0.35 hover** is an Estimate. Fish are taken within about 15 cm of the surface; it is under water about a second. Catch success runs from 34% (marine adults) to 75-96% (a river in winter) (section 7.1); **0.5 adopted**. Fish average 58 mm and run 25-180 mm; a **fish prop of 80 mm**. The catch is beaten on the perch, turned, and swallowed head first.
- **Rates:** in winter it perches 6-16 minutes at a time, makes 4-7 flights an hour of 5-7 s, and dives 0.7-3.1 times an hour [Kelly 1998a]. The style **compresses these about 4×** for play (section 11): perch bouts of 1-4 minutes, 10-15 plunges an hour.
- **Flight** between perches is low over the water, at about 9-13 m/s (Estimate; travelling flight is measured at 16-18 m/s), 40-100 m at a time. **The rattle** comes when it moves between perches, on landing, when disturbed, sometimes before a plunge and after a catch; no rates exist, so they are Estimates.
- **Tolerance:** no flight-initiation distance exists for the species that I could find. It scolds and circles people and flies ahead of a person walking toward it, but birds on the valley's urban waters sit near still people. **A near perch at 30-35 m is honest; 25 m is at the edge** (Estimate).
- **Territory:** "In the autumn, birds of both sexes, including the young of the year, defend individual territories" [Davis 1982, p. 353], about 390 m of creek, or on lakes about half a mile of shore [Salyer & Lagler 1946, p. 99]. Willow Lake holds **one bird**; intruders are chased at once, but no rate of intrusion is known.

---

## 2. Measurements

The primary tables I could read are Ridgway's *Birds of North and Middle America*, Part VI (1914; sexed means for the western race *caurina*, which includes Oregon), Baird, Brewer & Ridgway's *History of North American Birds* (1874; one length and wing), and AVONET's six skins. Bent 1940 gives eggs and habits, no body measurements. Pyle's *Identification Guide* (1997), Palmer, and the Birds of the World measurement appendix (Kelly, Bridge & Hamas 2020) could not be read.

### 2.1 Ridgway 1914 (sexed skins, by race)

Ridgway puts the species in *Streptoceryle*. The race west of the Rockies, *S. a. caurina* (Grinnell 1910), is "Similar to *S. a. alcyon*, but averaging decidedly larger (except feet), and wing-tip relatively longer" [Ridgway 1914, p. 420]. Oregon lies in its range ("Western North America, east to and including Rocky Mountains; north to northern Alaska ... south to western Mexico" [p. 420]); Bent keeps the same split, *caurina* "found west of the Rocky Mountains and north to Alaska and Yukon" [Bent 1940, p. 127].

| Race (n) | Sex | Length (skins) | Wing | Tail | Exposed culmen | Tarsus | Middle toe | Source |
|---|---|---|---|---|---|---|---|---|
| **caurina** | **M** | 284-320 (306) | 159-169 (163.1) | 88-96.5 (92.1) | 55-64 (59.3) | 11-12.5 (11.4) | 14-16 (15.4) | [Ridgway 1914, p. 420] |
| **caurina** | **F** | 290-330 (315) | 159-169.5 (165.5) | 88-101 (93.3) | 53-71 (59.6) | 10.5-12 (11.4) | 15.5-17 (16.2) | same |
| alcyon (19) | M | 276-310 (295) | 145-161 (156.3) | 82-93.5 (87.7) | 53-61.5 (54.5) | 11-12 (11.9) | 14.5-17 (15.6) | [p. 415] |
| alcyon (28) | F | 270-320 (312) | 150-165 (158.6) | 81-96 (88.7) | 54.5-63 (58.7) | 10-12 (11) | 14.5-16 (15.6) | [pp. 415-416] |

- The sample sizes for *caurina* are in footnotes the scan's text layer lost; the table of individual males on p. 416 lists 14 *caurina* males (Alaska, British Columbia, California 4, Nevada, Montana, Colorado, Sonora, Chihuahua 2), among them "Four adult males from California (*S. a. caurina*)": wing 162.2, tail 92.1, culmen 60.2, tarsus 11.5, middle toe 16 [p. 416].
- The key gives the same means for the races ("wing averaging 163.1 in male, 165.5 in female; tail 92.1 in male, 93.3 in female; exposed culmen 58.7 in male, 59.6 in female" [p. 409]); the key's male culmen (58.7) differs from the species account's (59.3). I use 59.3.
- **Females are a little larger than males** in every measure but the tarsus: wing +1.5%, tail +1.3%, culmen +0.5%, middle toe +5%, skin length +3% (Computed). The difference is far below what a player could see.
- Genus: "Bill longer than head, stout, compressed, its depth at middle of nostrils equal to about one-fourth the length of exposed culmen and much greater than its width at same point; culmen straight or very nearly so to near tip where very slightly decurved ... Tail a little less to slightly more than three-fifths as long as wing, truncate or very slightly rounded. Tarsus as long as or longer than inner anterior toe without claw; lower portion of tibia naked for nearly the length of tarsus" [pp. 407-408]. "Feathers of crown, occiput, and nape narrow and elongated, forming a conspicuous crest when erected" [p. 408].

### 2.2 Baird, Brewer & Ridgway 1874

"Length of adult about 12.75 inches; wing, 6.00" (324 mm and 152 mm; Computed) [BBR 1874, p. 393]. "Western specimens are appreciably larger, especially those from the northwest coast" [p. 393]. The genus: "Bill long, straight, and strong, the culmen slightly advancing on the forehead and sloping to the acute tip; the sides much compressed; the lateral margins rather dilated at the base, and straight to the tip; the gonys long and ascending. Tail rather long and broad. Tarsi short and stout" [p. 391]; *Streptoceryle*: "Bill very stout and thick. Tarsus about equal to the hind toe; much shorter than the inner anterior ... the occipital feathers much elongated, linear, and distinct" [p. 391].

### 2.3 AVONET (museum skins; n = 6)

From [Tobias et al. 2022] (sheets `AVONET1_BirdLife` and `AVONET_Raw_Data`, the raw rows read): four NHMUK skins (Costa Rica 2, Honduras, Panama; all wintering birds, so probably the eastern race) and two MMUM skins of unstated origin; 3 males, 3 females.

| Measure | Species mean | Raw rows |
|---|---|---|
| Beak, tip to skull | 58.6 | 53.0-62.1 |
| Beak, nostril to tip | 44.8 | 44.1-47.0 |
| **Beak width at the nostril** | **9.5** | 9.3-9.8 |
| **Beak depth at the nostril** | **13.4** | 12.7-14.3 |
| Tarsus | 12.5 | 11.3-15.6 |
| Wing | 158.8 | 155-165 |
| Kipp's distance | 53.2 | 51.2-57.8 |
| Secondary 1 | 105 | 103.8-107.2 |
| Hand-wing index | 33.6 | |
| Tail | 94.3 | 82-118 |
| Mass (Dunning 2008, via AVONET; not read) | 148 g | |

Depth at the nostril is 1.4 times the width (Computed): a compressed dagger, as Ridgway says. Ridgway's "about one-fourth the length of exposed culmen" gives 14.9 mm at the middle of the nostrils for a 59.5 mm culmen (Computed), a little more than AVONET's 13.4.

### 2.4 Lengths and masses from other sources

| Quantity | Value | Source |
|---|---|---|
| Length | 11.0-13.8 in (28-35 cm) | [AAB-ID] |
| Weight | 4.9-6.0 oz (140-170 g) | [AAB-ID] |
| Wingspan | 18.9-22.8 in (48-58 cm) | [AAB-ID] |
| Relative size | "Smaller than an American Crow; larger than a Hairy Woodpecker"; "robin-sized" | [AAB-ID] |
| Shape | "stocky, large-headed birds with a shaggy crest on the top and back of the head and a straight, thick, pointed bill. Their legs are short and their tails are medium length and square-tipped" | [AAB-ID] |
| Proportions | "Its long, heavy bill and its large head with its prominent crest, contrasting with its diminutive feet and its short tail, seem entirely out of balance and give it a top-heavy appearance" | [Bent 1940, p. 111] |
| *caurina*'s wing | "the secondary wing quills are proportionally longer in the northwestern birds ... the wing of *caurina* is broader ... In the northwestern birds this interval [secondary tip to primary tip] averages only 27.3 mm., while in the eastern birds it averages 33.7 mm" (Grinnell 1910) | [Bent 1940, p. 129] |

No sexed masses could be read; Ridgway's larger female skins suggest the female is a few grams heavier, which is immaterial here.

**Length caution.** As with the herons, published lengths are skins, bill tip to tail tip laid out. A perched kingfisher holds its body tilted and its tail angled down, so the model's `length` (bill tip to tail tip in the traced posture) is measured on the trace: **325 mm** on the side-on male of section 6 (photo-measured), close to the skins' 306-315 mm because the kingfisher has no neck to fold.

### 2.5 The foot: syndactyl

Kingfishers' front toes are joined. Ridgway's family: "Feet relatively very small, the tarsus not longer (usually shorter) than inner anterior toe with claw, scutellate ... in front, granulated behind; lower portion of tibia naked ... hallux much shorter than inner toe, connected with inner anterior (second) toe, so as to form with it and the others a broad flattened sole, the surface of which is conspicuously granulated, the middle toe united to the outer for the whole of its first two phalanges, or more, to the inner for whole of the first phalanx; outer toe nearly as long as middle toe, the inner (without claw) reaching only to second articulation of middle toe; claws moderately large, rather sharp, the middle one somewhat expanded, but not pectinated, on inner edge" [Ridgway 1914, p. 406]. BBR describe the same "regular sole, which extends unbroken beneath the middle and outer as far as the latter are united. The inner toe is much shorter than the outer" [BBR 1874, p. 391]. "Two of its toes are fused together and act as a shovel" [BirdWeb]; "the short legs and shovellike feet are most useful in shoveling the loose soil from its nesting burrows" [Bent 1940, p. 111].

For the model: three toes forward, the middle and outer joined for most of their length (they read as one broad toe), the inner short, and a short hind toe; tarsus 11.4 mm, middle toe 15.8 mm (section 2.6). The legs are dark: "legs and feet livid slate color (in life)" [Ridgway 1914, p. 415]. On the photos the toes are dark grey to dull orange-grey and are mostly hidden by the belly feathers (photo).

### 2.6 Summary of adopted values (mean of the sexes, *caurina*)

| Measure | Value | Basis |
|---|---|---|
| Total length, skins (not the model's `length`) | **310 mm** (284-330) | Ridgway's *caurina* means, M 306, F 315 [p. 420]; BBR 324 mm; AAB 280-350 |
| Model length, bill tip to tail tip as traced | **about 325 mm** | Photo-measured, section 6 |
| Exposed culmen | **59.5 mm** (53-71) | Ridgway *caurina* M 59.3, F 59.6; AVONET tip-to-skull 58.6 |
| Bill depth at the feathering | **16 mm** | **Estimate**: Ridgway's rule gives 14.9 at the nostril, AVONET 13.4 at the nostril; the bill deepens toward its base; 15 mm photo-measured at the base on `belkin1-95479901-158514807.jpeg` |
| Bill width at the feathering | **11 mm** | **Estimate**: AVONET 9.5 at the nostril; "lateral margins rather dilated at the base" [BBR 1874, p. 391] |
| Tarsus | **11.4 mm** | Ridgway *caurina*, both sexes |
| Middle toe | **15.8 mm** | Ridgway *caurina* M 15.4, F 16.2 |
| Bare tibia | **about 8 mm** | **Estimate**: "lower portion of tibia naked for nearly the length of tarsus" [p. 408], mostly hidden in the belly feathers when perched |
| Wing chord | **164 mm** | Ridgway *caurina* M 163.1, F 165.5 |
| Tail | **93 mm** | Ridgway *caurina* M 92.1, F 93.3 |
| Wingspan | **about 530 mm** (480-580) | AAB midpoint; the flight document traces the wing |
| Mass | **150 g** (140-170) | [AAB-ID]; Dunning 148 g via AVONET |

Ratios for the tests (Computed): culmen / wing **0.36** (Ridgway's genus: "more than one-third but less than half" [p. 407]); tail / wing **0.57** ("a little less to slightly more than three-fifths" [p. 408]); bill depth / culmen **0.27**; tarsus / culmen **0.19**.

---

## 3. Late-September plumage and age in the Willamette Valley

### 3.1 What the sources say

**The sexes differ; the female is the brighter.**
- Adult male: "Above, including sides of head, clear bluish gray (nearly plumbeous), interrupted by a white collar across hindneck ... a conspicuous supraloral spot of white, and another but smaller white spot immediately beneath eye; posterior portion of malar region, sides of neck, chin, throat, and foreneck immaculate white ... a broad band of bluish gray across chest; rest of under parts white, the sides and flanks mostly bluish gray (usually intermixed or flecked with white)" [Ridgway 1914, p. 415].
- Adult female: "Similar to the adult male but with a band (sometimes incomplete or interrupted) across lower breast, together with sides, flanks, and axillars, cinnamon-rufous, the innermost under wing-coverts sometimes tinged or suffused with the same" [pp. 415-416].
- "The Belted Kingfisher is one of the few bird species in which the female is more brightly colored than the male" [AAB-Overview]. BBR 1874 still doubted it: some skins "marked female (perhaps erroneously) show no indication of the chestnut", which they put down to collectors' "guess-work" [BBR 1874, p. 393, footnote].

**Juveniles differ from adults in the breast band, and wear that plumage all autumn.**
- "Young male.—Similar to the adult male, but jugular band more or less tinged or intermixed with cinnamon or cinnamon-brown. Young female.—Similar to the adult female but jugular band largely (often mostly) cinnamon-rufous, or much intermixed with that color, instead of mostly or wholly bluish gray" [Ridgway 1914, p. 416].
- "In this plumage the young bird looks strikingly like the adult with only minor differences, and the sexes are alike. Young birds of both sexes, when fully fledged, have the pectoral band more or less heavily tipped or mixed with cinnamon, rufous or dull brown; this usually consists of narrow edgings in young males, but in young females many feathers are half or more brown; the rufous band of the female adult is only partially shown in the young female, mainly on the flanks, and it shows to some extent in nearly all young males, some having nearly as much as young females; the crest is darker than in adults, there is more white in the wing coverts, the white tips of the secondaries are more extensive, and the central tail feathers are spotted, as in the adult female. This juvenal plumage is also a first winter plumage, for it is worn without much change until spring. Young birds have a first, prenuptial molt early in spring ... between February and April. Adults have a complete postnuptial molt in August, September, and October" [Bent 1940, pp. 118-119]. ("The sexes are alike" there contradicts the rest of his paragraph and Ridgway; I read it as "nearly alike".)
- "Juveniles show irregular rusty spotting in the breast band" [AAB-ID]; "Immatures' upper breast band is a mix of rufous and slate gray" [AAB-ID gallery caption].
- **So in late September**: adults are in their complete moult, perhaps a little ragged; hatch-year birds (fledged in July) wear juvenal plumage, the blue band mottled rusty or brown in both sexes, the rufous lower band partial in young females, some rufous on the flanks of most young males. A young male with rufous flanks can look like a female at a distance (Bent: "some having nearly as much as young females").
- Pyle's in-hand criteria (Pyle 1997) could not be read; the ageing below rests on Ridgway and Bent.

**The sexes' winter ranges.** Males winter farther north than females. "Data from the Bird Banding Laboratory and Christmas Bird Counts indicated that northern populations of Belted Kingfishers (*Ceryle alcyon*) were composed of proportionately more males than southern populations during fall and winter" [Kelly 1998b, abstract only]; on a Colorado river in winter Kelly found "14 males and 2 females ... the winter population in my study area had a male-biased sex ratio" [Kelly 1998a, p. 76]. "Males are reluctant to leave their territories ... Females are more likely to migrate south" (Davis 1988, through [Landrum et al. 1993, PDF p. 11]; secondary). In Oregon the species is a "Permanent resident throughout State. Less common in winter" [Gabrielson & Jewett 1940, p. 367]; around Portland "A common permanent resident, observed every month in the year" [Jewett & Gabrielson 1929, p. 24]. The valley's mild climate need not show Colorado's male bias, and the tally below does not.

### 3.2 Subspecies

The valley's birds are *caurina* by every treatment I could read (section 2.1): larger, with a longer and broader wing, than eastern birds, and alike in colour. "In all other respects its habits are not materially different from those of the species elsewhere" [Bent 1940, p. 130]. Paint them from the species' descriptions.

### 3.3 iNaturalist, Willamette Valley box

Taxon 2548 (*Megaceryle alcyon*), research grade, with photos, box 43.8-45.8 N, 122.6-123.6 W (the heron and egret documents' box): 195 records in September and October of all years, **101 from 13 September to 12 October** (2017-2026; 64 in September, 37 in October) [iNat query 2026]. I sexed and aged **all 101** on their photos (the first three of each, at 1024 px, and the originals where the bird was small). Seven times an observer posted two or three records on one day at one place (records 7-8, 11-13, 17-18, 30-31, 33-34, 72-73, 78-79); all but 7-8 (a female and a male) are one bird. Counted once per observer-day per bird, there are **94 bird-days** (Computed).

Criteria: rufous on the flanks or a rufous band below the blue one = **female** (a young male with much rufous on the flanks would be misread as a female; Bent says some have "nearly as much as young females"); white flanks and belly with no rufous, seen clearly = **male**; the blue band mottled or washed rusty or brown = **juvenile**; the blue band clean blue-grey on a close photo = **adult**. Most birds could be sexed but not aged.

| Class (bird-days) | Records | Count |
|---|---|---|
| Female (rufous flanks or band) | listed in the appendix | **27** (one of them with a male, records 7 and 8) |
| Male (no rufous, flanks or belly seen) | appendix | **20** |
| Juvenile, sex not clear | 58, 90 | 2 |
| Not sexable (far, silhouetted, flying, flanks hidden, a camera screen) | appendix | 45 |

- **Sexes:** 27 females to 20 males among the 47 sexed bird-days: **57% female** (Computed). The difference is small and the sample biased: a female's rufous shows in flight and at a distance, a male needs a clear view of the flanks to be sure, so males are under-counted. Observers' own sex annotations on these records: 14 male, 9 female (their labels, not evidence).
- **Ages:** 11 bird-days could be aged. **Juveniles 6**: records 24 (female: the blue band heavily mottled brown, the rufous band broken into patches), 50 (male: the band washed brown, a small rufous spot on the flank, the crest raised), 58 (rusty spots in the band, hovering), 90 (dull, the band brownish, a buff wash on the flank), and probably 6 and 60 (females with brown-mottled bands). **Adults 5**: records 13, 26, 56, 81 (males with clean blue-grey bands) and probably 91 (a female, the band clean). So about **half and half**, from a sample far too small to say more.
- **Two birds together:** records 7 and 8 (one observer, 3 October 2020, the same spot in Portland) are a female and a male; no other record shows two kingfishers.
- **What the birds were doing:** perched on dead branches, snags, posts, pilings, rebar and wires, mostly 1-5 m up over or beside water (by eye); hovering (records 10, 58, 59); plunging from a perch (record 81, a sequence); coming up from the water with spray (records 72, 79); calling with the bill open (record 14). The appendix lists every record.

### 3.4 Recommendation

- **Versions: `female` and `male`** (adults). Both are blue-grey above with a white collar and a blue-grey band; the female adds the rufous band and flanks. The juvenile's difference, rusty mottling in the blue band, is a few pixels at binocular range (section 4.4) and does not justify two more versions for one bird.
- **Cast: one bird, `female`.** The valley's late-September records lean female (57% of sexed bird-days), today's block bird is a female, and the female shows both bands, so the guide's marks for both sexes can be checked on her. A seeded choice between `female` and `male` at about 60:40 would be as honest; it is the plan's call. A second bird is not justified (section 7, territory).
- If juveniles are wanted later, the `juvenile` paint is the adult's of the same sex with the blue band mottled rufous-brown (a young female's band mostly rufous-brown, her rufous lower band reduced to the flanks) [Ridgway 1914, p. 416; Bent 1940, p. 118].

---

## 4. Field marks of each recommended version

Colour words are the sources'; I have not invented hex values. "(photo)" marks my observation on the reference photos of section 8, with sizes in mm scaled by the culmen.

### 4.1 Both sexes

- "The kingfisher could hardly be mistaken for anything else. Its shape is distinctive, its large head and crest and its long, heavy bill are all out of proportion to its small body, short tail, and tiny feet. As it flies its great blue wings, its white collar, and its banded breast are unique. Its loud, rattling note proclaims it beyond doubt" [Bent 1940, p. 124].
- "These kingfishers are blue-gray above with fine, white spotting on the wings and tail. The underparts are white with a broad, blue breast band. Females also have a broad rusty band on their bellies. Juveniles show irregular rusty spotting in the breast band" [AAB-ID]. "In flight, note the large white patch in the outer wings" [AAB-ID gallery caption]. "Often hovers above water looking for fish. Males have a single blue-gray breast band" [AAB-ID gallery caption].
- "You'll probably hear a loud, rattling call before you see the kingfisher" [AAB-Overview]; "a dry rattle, often given in flight" [BirdWeb].
- "The Belted Kingfisher is a medium-sized, stocky bird with a large, crested head, and a long, solid bill ... slate blue coloring on its back with a white collar and belly marked by a slate blue band. Females [have] an additional rufous band and rufous coloring on the sides of the belly" [BirdWeb].

By region (the male; the female's differences in 4.2):

| Region | Colour (source words; photo) |
|---|---|
| Crown, crest, sides of head | "clear bluish gray (nearly plumbeous)" [Ridgway 1914, p. 415], the crest feathers with black shaft-streaks; dark slate-blue, near black in shade (photo) |
| Supraloral spot | "a conspicuous supraloral spot of white" [p. 415]: a white spot about 5 mm across in front of and above the eye (photo) |
| Spot under the eye | "another but smaller white spot immediately beneath eye" [p. 415]; often hidden (photo) |
| Chin, throat, foreneck, collar | "immaculate white", the collar "across hindneck" [p. 415]: a white ring, broad at the throat and narrowing behind, 12-20 mm deep at the side of the neck (photo) |
| Breast band | "a broad band of bluish gray across chest" [p. 415]; about 22 mm deep at the side (photo, `belkin1-95479901-158514807.jpeg`) |
| Belly and undertail | white [p. 415] |
| Sides and flanks | "mostly bluish gray (usually intermixed or flecked with white)" [p. 415]; under the folded wing they look grey-blue or white (photo) |
| Back, scapulars, wing coverts | bluish grey with "very slender black shaft-streaks"; coverts and secondaries "with a few minute irregular white markings" [p. 415]: fine white specks on the folded wing (photo) |
| Primaries | "slate-black, ... the primaries with basal half, more or less, spotted with white" [p. 415]: the white patch shows in flight, a white line or a few spots at the folded wing's edge (photo) |
| Tail | central pair "bluish gray with a median streak of black ... margined on each side by ... small white spots"; the others "slate-black ... the inner webs barred with white" [p. 415]: from below, dark with close white bars (photo) |
| Underwing | "axillars, under wing-coverts ... immaculate white" [p. 415] |
| Bill | "black, sometimes paler (grayish) basally, especially on mandible" [p. 415]: black, the lower mandible's base pale grey-horn (photo) |
| Iris | "dark brown" [p. 415] |
| Legs and feet | "livid slate color (in life)" [p. 415] |

### 4.2 `female`

As the male, plus "a band (sometimes incomplete or interrupted) across lower breast, together with sides, flanks, and axillars, cinnamon-rufous" [Ridgway 1914, pp. 415-416]; "a chestnut belly band and flanks" [AAB-ID gallery caption]. On the photos the rufous band lies just below the blue one with a white gap of 5-15 mm between them, is about as deep as the blue band at the sides, and narrows or breaks at the centre of the belly; the rufous flanks show below the folded wing in side view as a long rusty wedge from the breast to the thighs (photo, `belkin1-144456268-247931937.jpg`, `belkin1-320600467-579680123.jpg`, `belkin1-183117768-319414830.jpeg`). Bent adds that the adult female's central tail feathers are spotted [Bent 1940, p. 118].

### 4.3 `male`

As in 4.1: one blue-grey band, white below, the flanks blue-grey flecked white or white, no rufous anywhere [Ridgway 1914, p. 415; AAB-ID].

### 4.4 What reads at the pixel footprint

Pixel footprints (Computed, 1080-pixel-tall view): binoculars 3.0 / 3.6 / 4.3 mm per pixel at 25 / 30 / 35 m; telescope 1.7 mm at 53 m (the snag), 1.9 at 60 m, 2.3 at 70 m; the naked eye (60°) 32 mm per pixel at 30 m.

- **Binoculars at 30 m (3.6 mm/px).** The perched bird is about 90 px from bill tip to tail tip and 40 px tall. The bill (59 mm) is 16 px; the head and crest about 15-20 px across. **These read:** the white collar (3-5 px deep at the side, 8-10 px at the throat), the blue band (6 px), the female's rufous band and flanks (5-6 px, and a long wedge along the side), the crest's raggedness and how high it stands (the raised crest stands 3-4 px higher than the sleeked one), the head turn, the bob and the tail flick. **Marginal:** the white supraloral spot (5 mm: 1-2 px, a light dot); the juvenile's rusty mottling (blotches of 3-6 mm: 1-2 px, so a browner, uneven band rather than spots). **Do not read:** the white specks on the coverts and the tail's white bars (2-3 mm), which blur into a lighter, speckled grey.
- **Telescope at 53 m (1.7 mm/px).** About 190 px long. All of the above read better: the supraloral spot is 3 px, the tail's barring shows as fine pale bars when the tail is fanned, the juvenile's mottling would read as spots.
- **Telescope on a hover at 60-80 m (1.9-2.6 mm/px).** The spread wing (about 530 mm) is 200-275 px across; the white patch at the primaries' bases (section 5.3) reads clearly; the fanned tail's bars read; the female's rufous flanks show from below and from the side.
- **Naked eye at 30 m (32 mm/px).** The bird is a 10-px blob, the spread wing 16 px: what reads is the blue-grey and white pattern flashing, the flight, the hover and the splash. The rattle finds it.

### 4.5 Suggested guide `marks`

From the above, for the versions the player will see:

- size: "pigeon-sized but top-heavy: a big head and a heavy bill on a short body; about 33 cm"
- bill: "long, straight, heavy and pointed, black, pale at the base of the lower mandible"
- head: "a shaggy, ragged double crest, raised and lowered; blue-grey with a small white spot in front of the eye; a white collar all round the neck"
- body: "blue-grey above, white below with a broad blue-grey breast band; the female adds a rusty band below it and rusty flanks; juveniles show rusty mottling in the blue band. In flight, a white patch in the outer wing. Perches still over water, bobbing its head and flicking its tail; hovers on fast wingbeats with the bill down, then plunges head first. A loud, dry, wooden rattle, mostly in flight"
- legs: "tiny dark feet, almost hidden, gripping a branch, post or wire over the water"

---

## 5. Structure

### 5.1 Head and bill

- **Bill:** a straight, compressed dagger, "longer than head, stout ... culmen straight or very nearly so to near tip where very slightly decurved, forming a broad, sometimes flattened, ridge"; the gonys "ascending terminally" [Ridgway 1914, pp. 407-408]. Depth about a quarter of the culmen at the nostril. On the side-on photo the culmen is within 4° of the line from its base to the tip, and the depth falls to about half the base's at mid-length (photo, `belkin1-95479901-158514807.jpeg`).
- **Where the bill meets the head:** the forehead feathers come forward onto the culmen ("the culmen slightly advancing on the forehead" [BBR 1874, p. 391]). On the side-on male the culmen (264 px at the photo's scale) is **0.70 of the distance from the eye's centre to the bill tip** (377 px) (Computed); the eye sits about 25 mm behind the culmen's base, about 2 mm above the culmen's line (photo). That ratio scales the other photos.
- **The eye:** dark brown, set in the dark of the head; about 8-10 mm across as it shows (photo, `belkin1-183117768-319414830.jpeg` at 0.51 mm/px), so a model eye radius of **about 4.5 mm** (photo; Estimate within ±1 mm).
- **The supraloral spot:** white, about 5 mm across, just in front of and above the eye (photo).
- **The head:** big and flat-crowned when the crest is sleeked; the head from the culmen's base to the nape is about 45-50 mm (photo).

### 5.2 The crest

- "Feathers of crown, occiput, and nape narrow and elongated, forming a conspicuous crest when erected" [Ridgway 1914, p. 408]; "the occipital feathers much elongated, linear, and distinct" [BBR 1874, p. 391]; "a shaggy crest on the top and back of the head" [AAB-ID]. On the photos it is a ragged double tuft: one at the crown and one at the hind-crown/occiput, with a notch between them (photo, `belkin1-95479901-158514807.jpeg`, `belkin1-96834239-160928875.jpeg`).
- No source gives a crest length. Photo-measured, the top of the head above the eye's centre: **about 20 mm with the crest sleeked** (`belkin1-61703892-98765318.jpeg`), **22 mm relaxed and shaggy** (`belkin1-95479901-158514807.jpeg`), **30 mm raised** (`belkin1-95918124-159293929.jpeg`, the bird calling). Raised, the crest's longest feathers stand **20-25 mm proud of the head's outline**, pointing up and back at **about 30-40° above the head's axis**, and the tuft's rear tips lie **about 65 mm behind the eye**; sleeked, the feathers lie back along the nape, the rear of the head about 45 mm behind the eye (photo).
- So `crestRaise` 0 = the feathers lying back along the crown and nape, 1 = raised 30-40° and standing 20-25 mm proud (photo). The crest is never quite smooth: even sleeked, the nape's feather tips show as a ragged edge (by eye).

### 5.3 Body, wing, tail, legs

- **Body:** short, deep and stocky; a "trim, unique figure" [Bent 1940, p. 122].
- **Folded wing:** covers the side from the shoulder to the tail's base; the primaries' tips reach a little past the base of the tail, leaving most of the tail bare (by eye, `belkin1-61703892-98765318.jpeg`, `belkin1-95479901-158514807.jpeg`). *caurina*'s secondaries reach within 27 mm of the primaries' tip [Bent 1940, p. 129, quoting Grinnell 1910]. White specks on the coverts, a white line or spots at the folded primaries' base (photo).
- **Tail:** "truncate or very slightly rounded" [Ridgway 1914, p. 408], 93 mm, barred white below.
- **Legs and feet:** tiny, syndactyl (section 2.5); in the perched bird only the toes show, curled round the perch, and sometimes a few mm of tarsus (photo).

---

## 6. The perched posture

How these were measured: points read by hand on grid-overlaid photos, scaled by the culmen (`belkin1-95479901-158514807.jpeg`, 264 px for 59 mm: **0.224 mm/px**) or by the eye-to-tip distance times 0.70 elsewhere. Angles are in the photo's plane; the head-turned or foreshortened photos (`belkin1-400639376-735245876.jpg`, `belkin1-96834239-160928875.jpeg`) gave bill-tip-to-tail-tip lengths 10-20% long against their foreshortened bills and are not used for lengths.

| Measure | Photo | Value | Notes |
|---|---|---|---|
| **Bill tip to tail tip** | `belkin1-95479901-158514807.jpeg` | **325 mm** | 1452 px; the trace's `length` |
| Body axis (bill tip to tail tip) | same | 31° below level toward the tail | an alert, fairly upright perch |
| Back line (shoulder to tail tip) | same | 48° below level | |
| | `belkin1-183117768-319414830.jpeg` (female, hunched, peering down) | 34° below level | a lower, more horizontal hunting crouch |
| Tail | `belkin1-95479901-158514807.jpeg` | 26° below level | angled down past the perch |
| **Bill angle, alert** | same | **4° below level** | head up, watching |
| **Bill angle, peering down** | `belkin1-183117768-319414830.jpeg` | **44° below level** | the head lowered to look at the water before a plunge |
| Eye above the perch's top | `belkin1-95479901-158514807.jpeg` | 124 mm | |
| Top of the crest above the perch's top | same | 146 mm | the crest relaxed |
| Breast ahead of the feet | same | 48 mm | the body's weight over the feet |
| Tail tip behind / below the perch's top | same | 157 mm behind, 47 mm below | |
| **Plunge from the perch** | `belkin1-319707946-577953494.jpg` | **about 82° below level** (8° off vertical) | the body straight, bill first, wings half open, tail fanned, about one body length below the perch |

**The head bob, the tail flick, the crest.**
- "There to tilt his short tail nervously up and down and raise and lower his long crest a few times, as he sounds his battle cry again" (on landing) [Bent 1940, p. 122].
- "When a Belted Kingfisher suspects an intruder in its territory, it may land on a perch and heave its body up and down with its crest elevated, or fly back and forth along the water, rattling noisily until the intruder leaves. If threatened, it may scream, spread its wings, and raise the patch of white feathers next to each eye" [AAB-LH].
- "A Western Belted Kingfisher ... came to a perch on a bare limb overhanging some rapids in the river, and sat there motionless. The outline of the bird's body at once became indistinguishable from the light and shade of its background" (Grinnell & Storer 1924, in [Bent 1940, p. 130]).
- No source gives the bob's or the flick's size or timing. **Estimate** (by eye on the photos' postures, and as the heron's and grebe's idles were set): the bob, the head and fore-body dipped 10-15 mm and back in 0.3-0.5 s, once or in twos; the tail flick, the tail raised 20-30° and lowered in 0.2-0.4 s; the crest raised over 0.3 s and held for 1-5 s; the head turned slowly 30-60° one way and back over 1-3 s.

**The perches.**
- "It usually perches on some stake, snag, or pier standing in the water, or on some bare overhanging branch, where it can watch patiently for some passing fish" [Bent 1940, p. 120]; "I believe that it prefers to perch on a dead or leafless branch, where its view is unobstructed" [p. 111]. "A bare branch, telephone wire, or pier piling" [AAB-LH].
- The valley's photos (section 3.3): dead branches over water, snags and stump tops, posts and pilings, rebar and wire. Branch perches look **2-5 cm** across against the bird (by eye, scaled by the 59 mm bill); stump and post tops are flat.
- **Height.** "a cottonwood limb twenty feet above the water" (6 m) [Grinnell & Storer 1924, p. 314]; on a Texas river Belted Kingfishers perched at "550.8 cm ± 449.4 SD" against the Green Kingfisher's 142.3 cm [Chodacki & Skipper 2019, abstract only]; poles "4 feet or more in height ... provide excellent fishing and observation perches" [Salyer & Lagler 1946, p. 108]. The valley's photos: mostly **1-5 m** above water or bank (by eye). Perches **2-6 m** above the water suit the model; the snag's 3 m is honest.
- **Spacing.** "Davis (pers. comm.) estimates that 40 perches/km ... optimal" [Prose 1985, p. 12]: one every 25 m of shore.
- For the model: the snag's branch and a near perch of dead branch or post. A branch of **3-4 cm diameter** (radius 15-20 mm) suits the toes (middle toe 16 mm), and the toes curl over its top third (Estimate).

---

## 7. Behaviour

The quantitative studies are few, and none is from a lake in autumn. Davis's territory work (Indian Creek, southwestern Ohio) covers autumn; Kelly's time budget is a Colorado river in January and February; Booth et al. is marine. Salyer & Lagler's Michigan work covers lakes. Where they disagree I say so, and the style's settings (section 11) mark what is sourced and what is chosen.

### 7.1 What the sources say

**How it hunts: from a perch, or hovering.**
- "From such a perch the bird may dive obliquely into the water to seize the fish in its powerful bill; or, rising 30 or 40 feet into the air and scanning the water below it in more active pursuit of its prey, it may stop and hover for a few seconds, with rapidly vibrating wings, and then make a straight or spiral dive directly downward, disappearing beneath the water sometimes for several seconds. It is not always successful in its plunges ... but it is not easily discouraged and is always ready to try again" [Bent 1940, p. 120].
- "[It] either dives directly from his perch ... or flies along above the water until he sees his prey, when, hovering above it ... shoots down like an arrow" [Forbush 1927, p. 251].
- Carey (1909): "as he hovers, his body appearing absolutely motionless ... for indefinite periods of time. Sometimes, especially in water half a foot or less in depth, he dives while flying nearly parallel to its surface ... Again, he drops like a falling stone in a nearly perpendicular line upon his fishy prey" [Bent 1940, p. 122].
- "Fishing away from the edges generally requires hovering ... Hamas (pers. comm.) believes that 15 m is a reasonable estimate" of the width of shore water fished from perches [Prose 1985, p. 8].
- **Shares.** I found **no count of perch plunges against hover plunges**. On a marine shore adults spent 1.7% ± 0.6% of their time diving and 0.4% ± 0.4% hovering [Booth et al. 2021, p. 293, Table 1]. The photos (section 3.3) show 3 hovering birds and 1 plunge from a perch among 101 records. Section 11 chooses **perch plunges 0.65, hover plunges 0.35** (Estimate): perch-hunting is the rule, hovering the way it fishes open water more than 15 m from a perch.
- **Hover height and length.** "Rising 30 or 40 feet" (9-12 m) and "hover for a few seconds" [Bent 1940, p. 120]; over a wading egret "The kingfisher hovered over the egret for about 5-10 seconds, then flew off ... continued for about 2-3 minutes", once "for about one minute" [Meyerriecks & Nellis 1967, p. 237]. No measured hover heights. The flight document gives the hover's wingbeat and posture.
- **Plunge angle.** From a perch "obliquely" [Bent 1940, p. 120] to "nearly perpendicular" [p. 122]; the valley's perch-plunge photo shows about 82° below level (section 6). From a hover "directly downward" [p. 120]. Over shallow water, nearly flat [p. 122].

**Depth and time under.**
- "White (1953) suggested that most fish are caught in water < 60 cm deep ... Davis ... believes that fish generally are caught no more than 12 to 15 cm below the surface"; "The top 15 cm of water, where prey are actually caught" [Prose 1985, pp. 3, 10]. "Its fishing is confined to those individuals of its prey near the surface or in shoal water ... fishing success is not as good in deep pools" [Salyer & Lagler 1946, p. 100]. In autumn on an Ohio creek it fished riffles (5-15 cm deep) 71.3% of the time, shallow pools 20%, deep pools 8.7% (80 observations) [Davis 1982, pp. 354, 356].
- Time under water: "sometimes for several seconds" [Bent 1940, p. 120]; they "emerge almost instantly" [Gabrielson & Jewett 1940, p. 367]. No measurement. **Estimate: 0.5-1.5 s** hidden, the bird's body going no deeper than about 30 cm.

**Catch success and rate.**
- Marine shore, Washington: "adults 34% and n = 110; juveniles 14% and n = 108"; adults up to 50% at the best tides [Booth et al. 2021, p. 293].
- Colorado river in winter: successful dives per hour 0.6, 1.2, 2.5, 2.5 and failed dives 0.1, 0.4, 0.6, 0.1 for 0700-1000, 1000-1300, 1300-1600 and 1600-1800 h [Kelly 1998a, p. 80, Table 2]: success **75-96%** and **0.7-3.1 dives an hour** (Computed).
- "Dove three times and made two kills" [Meyerriecks & Nellis 1967, p. 237]; "they rarely make a plunge without accomplishing their object" [BBR 1874, p. 394].
- So success runs from a third (marine, tides) to most dives (a river in winter, where it plunged rarely and only at sure targets). **Adopted 0.5** for the game (Estimate inside the sourced 0.34-0.9).
- The dive rate is low: under four an hour in Kelly's winter birds; Salyer & Lagler saw territories "patrolled at intervals of 10 to 15 minutes" [p. 99]. A game bird hunting at that rate would plunge once in 20-60 minutes of play. Section 11 compresses this (and says so).

**Prey and its size (for the fish prop).**
- "Averages less than 3 inches and ranges from 1 to 7 inches ... 729 specimens ... Most ... less than 5 inches" [Salyer & Lagler 1946, p. 102]; "average about 2.3 inches" (58 mm) [p. 97, abstract].
- Fish "4-14 cm" were vulnerable; "Fish smaller than 4 cm and larger than 14 cm ... were never seen taken" [Davis 1982, p. 354]. Marine adults took fish of 10.6 ± 0.9 cm (n = 22), juveniles 6.0 ± 0.9 cm (n = 10) [Booth et al. 2021, p. 294]; "relatively large fish (11-13 cm long)" were preferred in Colorado [Kelly 1996, abstract only]. In semi-natural experimental streams "trout > 20.4 cm were not preyed upon" [Penaluna et al. 2016, abstract only]. "Preferably not over 6 inches long" [Bent 1940, p. 119].
- In a valley lake in September: small sunfish, perch, minnows and sculpins (by the habitats; no Oregon diet study read). **Fish prop: 80 mm long** (Estimate between Salyer & Lagler's 58 mm average and the 10-11 cm of Booth and Kelly), about 1.35 culmens, silvery olive.

**Handling the catch.**
- "Grasp a prey fish, forceps-fashion, with a lightning-like thrust aimed a little ahead of the middle of the body, fly to a perch, gradually turn the fish, and swallow it head first" [Salyer & Lagler 1946, pp. 102-103].
- "Having secured the fish, it flies with it to some favorite perch, where it beats the fish into insensibility, tosses it into the air, or otherwise adjusts it, so that it can swallow it head first and thus avoid any injury to its throat from the sharp spiny fins" [Bent 1940, p. 120]. A young bird would "carry it to his perch, whack it over the limb a few times, toss it in the air, catch it by the head as it came down and swallow it" (Bralliar 1922, in [Bent 1940, p. 117]).
- Small fish: "turns it head foremost, and swallows it at once"; larger: "beats it vigorously, holding it first by one end and then by the other" [Forbush 1927, p. 251]. "Thrashes it against its perch ... swallows it head foremost" [Dawson 1923, p. 1050].
- "Shaking prey" took 3.9% ± 1.6% of adult time on the marine shore [Booth et al. 2021, Table 1]. Kelly recorded handling time but printed no value [Kelly 1998a, p. 76]. **Estimate**: for an 8 cm fish, 3-8 beats against the branch over 3-10 s, a turn (sometimes a toss) of 1-2 s, and a swallow of 1-3 s with the head up: **8-20 s** in all.

**Perch time, perch changes, flights.**
- Colorado in winter: perch bouts of **15.7 min (SE 2.1)** at 0700-1000 h, 8.5, 7.1 and **5.7 min** later in the day; **4.1-7.2 flights an hour** of **5.0-6.7 s** each; 98-99% of the time perched [Kelly 1998a, p. 80, Table 2]. "Birds appeared to seek sunlit perches and only began to forage after basking on such a perch" [p. 82].
- Marine shore: perched 75.1% of the time (adults), 92.6% (juveniles) [Booth et al. 2021, p. 293].
- "It does not keep one perch very long, however, but soon goes rattling off down the river to the next favorable vantage point" [Grinnell & Storer 1924, p. 314].
- **Flight distance between perches**: 5-7 s of flight at 8-15 m/s is **40-100 m** (Computed from Kelly's durations and the speeds below).

**Flight speed and height.**
- Paced by a car: abreast at 40 mph (18 m/s) for 1.8 miles and followed at 45 mph for 0.4 mile with a tailwind of "one to three miles per hour"; it flew "between 10 and 15 feet above the water's surface" (3-4.6 m) [Burland 1947, p. 113], quoting McLean 1930's "steady level flight" of 36 mph (16 m/s).
- "As he skims so close over the water that their [the wings'] tips are sometimes wetted" (Carey, in [Bent 1940, p. 122]); "usually low, but high above the treetops when traveling; often there are five or six rapid strokes followed by a long glide on half-closed wings" [p. 122]; "three quick beats followed by two executed in a more leisurely manner" [Grinnell & Storer 1924, p. 314]. The flight document takes the wingbeat.
- So a travelling flight runs at 16-18 m/s; short perch-to-perch flights over a small lake, low over the water (0.5-4 m), are slower (Estimate **9-13 m/s**: they start and end at rest within 40-100 m).

**The rattle.**
- "A dry rattle, often given in flight" [BirdWeb]; "its loud, rattling cry is often heard, as it flies up and down, patrolling its chosen fishing ground" [Bent 1940, p. 111]; on landing it raises the crest and tilts the tail "as he sounds his battle cry again" [p. 122].
- "The cry of the Kingfisher, uttered when he is disturbed, or when moving from place to place, and occasionally just as he is about to make a plunge, is loud and harsh, and resembles the noise made by a watchman's rattle" [BBR 1874, p. 394]; it rattles "before he makes a plunge" and after a catch [Dawson 1923, p. 1050]; "this kingfisher's Rattle Call is given at the slightest disturbance" [Kelly et al. 2020, introduction].
- "A series of harsh, wooden, rattling notes of great carrying power"; "sometimes being quite soft and low" [Bent 1940, p. 123]. "Emits a short chatter (0.5 to 1.0 sec)" [Davis 1986, p. 505].
- No call rates anywhere. **Estimate** for section 11: most perch-to-perch flights rattle (0.8); some flyouts (0.3); a landing 0.3; a plunge 0.1; a catch 0.2; from a quiet perch once in 3-8 minutes.

**Tolerance of a still person.**
- **No flight-initiation distance for this species** was found in any source I could open (Blumstein 2006 and Blumstein et al. 2005 have none; the Livezey et al. 2016 supplement could not be read).
- What there is: "All larger animals, including man, cats, dogs, and larger birds are circled and scolded and often followed through the area" [Salyer & Lagler 1946, p. 99]. Walking a creek, "I forced the resident kingfisher(s) to fly ahead until the end of the territory was reached" [Davis 1982, p. 354]. A bird paced by a car "showed no alarm" at "10 or 12 yards" [Burland 1947, p. 113]. The young "can be approached and observed quite closely" [Salyer & Lagler 1946, p. 101]. They "are sensitive to disturbance, however, and may abandon territories if people begin frequenting the area" [AAB-LH].
- The valley's records come mostly from urban parks, greenways and city ponds (Portland, Beaverton, Forest Grove, Eugene); one bird sat on a building's window ledge (record 46); many photos are close, sharp portraits of birds at ease (section 3.3).
- **So**: a kingfisher moves away from a person walking toward it, rattles at people, and is wary near nests, but birds on urban-park waters sit tens of metres from people who stand still. **A perch at 30-35 m from a still observer is honest; 25 m is at the edge** (Estimate). On arriving at or leaving a perch near the player, a rattle is honest; staying there for many minutes is too. The near perch should face the water, side-on to the vantage, not toward it.

**Territory and how many birds hold a lake.**
- "In the autumn, birds of both sexes, including the young of the year, defend individual territories" [Davis 1982, p. 353]. Nonbreeding territories along an Ohio creek: **389 ± 93 m** of stream (n = 21), less than half the breeding pairs' 1,030 ± 219 m (n = 6) [p. 356]; "remarkably constant in size"; deserted in prolonged rain and "reestablished by the original owners with the original boundaries" [p. 359].
- On Michigan lakes "the longest territorial selection found was 1½ miles of shore, but the average comprises about ½ mile", and "invariably includes all or a portion of a small sheltered bay"; one territory was "about 35 acres of water and marsh" [Salyer & Lagler 1946, pp. 99-100].
- Illinois River sloughs, 27 September to 15 December: each bird "appeared to patrol or to hold dominion over a certain well-defined section", flying ahead of the boat and then circling "back to its own portion of the slough"; "No fights were noted" [Lincoln 1924, pp. 113-114].
- "Females are more territorial than males and defend larger winter territories" (Davis 1988, through [Landrum et al. 1993, PDF p. 11]; secondary).
- Willow Lake's open water is about 60 m across (the `open-water` zone) and its shore a few hundred metres: **one territory**. Two birds together are rare in the valley's records (one pair among 94 bird-days). **Cast one bird.**

**Chases.**
- "Invaders of the same species are violently set upon forthwith" [Salyer & Lagler 1946, p. 99]; "there ensues literally a rattling fight in the air which continues until the intruder beats an ignominious retreat" [Forbush 1927, p. 251]; pursuits "reckless and enduring" (Carey, in [Bent 1940, p. 123]).
- Chasing took 0.4% ± 0.3% of adults' time on a marine shore [Booth et al. 2021, Table 1]. The territory is "patrolled at intervals of 10 to 15 minutes" [Salyer & Lagler 1946, p. 99]. No rate of intrusions found. A future round's chases might come once or twice an hour (Estimate).

### 7.2 Video estimates

I timed no videos. The bob, flick, crest and handling times are estimates (sections 6 and 7.1).

---

## 8. Tracing references

All files are in `C:\Users\kcsel\AppData\Local\Temp\claude\lakewatch-kingfisher\scratchpad\ref\belkin1\`, not in the repo. They are tracing references only and are never shipped; the species file's `sources` must credit the photographer and licence of each one used. All are from the appendix's records (Willamette box, 13 September to 12 October), and all are CC BY-NC except where stated. File names are `belkin1-<observation>-<photo>.<ext>`.

| File | Photographer, licence | Date, place | Pixels | Scale | Use |
|---|---|---|---|---|---|
| `belkin1-95479901-158514807.jpeg` | Patricia (insectology), CC BY-NC | 19 Sep 2021, Forest Grove, OR | 2048 × 1536 | culmen (1233, 553) to (1497, 570): 264 px, **0.224 mm/px** | **the profile**: male, strictly side-on, facing right, alert on a stump, crest relaxed; bill, eye, feet and tail tip all sharp |
| `belkin1-61703892-98765318.jpeg` | Andy Frank, CC BY-NC | 4 Oct 2020, NE Portland, OR | 800 × 572 | eye-to-tip × 0.70, about 0.55 mm/px | male, side-on from behind, facing left, **crest sleeked**; the back, folded wing and tail's white bars |
| `belkin1-95918124-159293929.jpeg` | Patricia, CC BY-NC | 23 Sep 2021, Greenway, Beaverton, OR | 2042 × 1677 | eye-to-tip × 0.70, about 0.17 mm/px | male's head, **crest raised**, bill open, calling |
| `belkin1-96834239-160928875.jpeg` | Patricia, CC BY-NC | 1 Oct 2021, Forest Grove, OR | 1337 × 1215 | - | male side-on, crest raised high and ragged; the double crest |
| `belkin1-95480431-158515762.jpeg` | Patricia, CC BY-NC | 19 Sep 2021, Forest Grove, OR | 2048 × 1536 | - | male from the front on a thin branch: the collar, the band, the toes round the branch |
| `belkin1-136621488-233198557.jpeg`, `belkin1-244817765-436757981.jpeg` | Patricia; Pond Gators, CC BY-NC | 26 Sep 2022, 29 Sep 2024, Forest Grove, OR | 1749 × 1493; 2048 × 1536 | - | male, front: clean adult band |
| `belkin1-183117768-319414830.jpeg` | Andy Frank, CC BY-NC | 13 Sep 2023, N Portland, OR | 800 × 572 | eye-to-tip × 0.70, about 0.51 mm/px | **female side-on**, facing right, hunched and **peering down** (bill 44° down), crest lowered; the rufous flanks |
| `belkin1-400639376-735245876.jpg` | Steve Foss, CC BY-NC | 14 Sep 2026, NE Marine Dr, Portland, OR | 844 × 783 | - (head turned toward the camera) | female side-on, crest raised; the clean blue band, rufous band and flanks; **paint the female from it** |
| `belkin1-137092395-234073272.jpeg` | Patricia, CC BY-NC | 30 Sep 2022, Greenway, Beaverton, OR | 2048 × 1812 | - | female side-on, crest raised, rufous flanks |
| `belkin1-144456268-247931937.jpg` | Owen Gross, CC BY-NC | 6 Oct 2022, Reed, Portland, OR | 1249 × 986 | - | female, three-quarter front: both bands and the gap between them |
| `belkin1-320600467-579680055/085/123.jpg` | chatterton-blue, CC BY-NC | 11 Oct 2025, Greenway, Beaverton, OR | 2048 × 1365 etc. | - | female on a leaning post over water, both bands; one in flight |
| `belkin1-61235093-97974158.jpg`, `-97974148.jpg` | Andy Frank, CC BY-NC | 29 Sep 2020, N Portland, OR | 800 × 571 | - | female side-on, crest up; the band's side mottled brown (probably a juvenile) |
| `belkin1-242013000-431404674.jpg` | Ritch Pope, CC BY-NC | 14 Sep 2024, Lane County, OR | 2016 × 1362 | - | **juvenile male**: band washed brown, a rufous spot on the flank, crest raised |
| `belkin1-319707946-577953480/483/494.jpg` | Roderick Williams, CC BY-NC | 7 Oct 2025, Benton County, OR | 1416 × 1924 etc. | - | male perched (front and side) and **plunging from the perch**, about 82° below level, wings half open, tail fanned |
| `belkin1-246078879-439235697.jpeg` | Alice Pence, CC BY-NC | 19 Sep 2024, Cully, Portland, OR | 2048 × 1365 | - | **hovering**, from below: wings spread, tail fanned, rusty spots in the band (juvenile) |
| `belkin1-246355205-439782827.jpeg` | ollieelliot, CC BY-NC | 8 Oct 2024, Delta Ponds, Eugene, OR | 1620 × 1080 | - | female hovering, rufous flanks |
| `belkin1-319458018-577468924/926.jpg`, `belkin1-316921867-572633744/780.jpg` | chatterton-blue, CC BY-NC | 3 Oct and 26 Sep 2025, Greenway, Beaverton, OR | 2048 × 1365 | - | coming up from the water with spray, and taking off (for the flight document) |
| `belkin1-95479078-158513320.jpeg` | Patricia, CC BY-NC | 19 Sep 2021, Forest Grove, OR | 1630 × 1525 | - | male from the front on a post, bill pale at the base |

Originals: `https://inaturalist-open-data.s3.amazonaws.com/photos/<photo id>/original.<ext>`; observations: `https://www.inaturalist.org/observations/<id>`. The best juvenile female (record 24, observation 135575027) is all rights reserved and was not downloaded.

**Which to trace:** the profile from `belkin1-95479901-158514807.jpeg` (the crest relaxed; lower it against `belkin1-61703892-98765318.jpeg`, raise it against `belkin1-95918124-159293929.jpeg`). Paint the male from it and `belkin1-95480431-158515762.jpeg`; the female from `belkin1-400639376-735245876.jpg`, `belkin1-183117768-319414830.jpeg` and `belkin1-144456268-247931937.jpg`. The peering-down pose from `belkin1-183117768-319414830.jpeg`, the perch plunge from `belkin1-319707946-577953494.jpg`.

---

## 9. Numbers for the model

| Field | Value | How chosen |
|---|---|---|
| `length` | **0.325 m** | Photo-measured on the profile (section 6). **If the traced profile differs, set `length` to the traced value** |
| `culmen` / `billDepth` / `billWidth` | **0.0595 / 0.016 / 0.011 m** | Section 2.6 (depth and width Estimates) |
| `bill.taper` / `bill.curve` | **≈ 1.0 / ≈ −0.01** | a straight dagger, depth about half the base's at mid-length, the tip barely decurved (photo; Ridgway) |
| `tarsus` / `tibia` / `toe` | **0.0114 / 0.008 / 0.0158 m** | Section 2.6; the tibia an Estimate, hidden |
| Toes | three forward, middle and outer joined for two phalanges; inner short; hind toe short | [Ridgway 1914, p. 406] |
| `wingChord` / `tail` | **0.164 / 0.093 m** | Section 2.6; `tail.shape` `square` |
| `eye.radius` | **0.0045 m**, iris dark brown, about 25 mm behind the culmen's base | Section 5.1 |
| `parts` | a `crest` at the crown and occiput, two lobes, standing 20-25 mm proud when raised | Section 5.2 |
| `crestRaise` range | 0: lying along the nape; 1: 30-40° up from the head's axis | Section 5.2 |
| Bill angle at rest / peering | 4° / 44° below level | Section 6 |
| Perch | branch 3-4 cm across (radius 0.015-0.02 m), 2-6 m above the water | Section 6 |
| Fish prop | **80 mm** long, about 15 mm deep | Section 7.1 (Estimate) |
| Versions | `female`, `male` | Section 3.4 |

Colours by region: section 4.

---

## 10. Suggested test thresholds

All in mm unless stated; measured on the built model at rest unless stated.

| Assertion | Value | Basis |
|---|---|---|
| Exposed culmen | 53-66 | Ridgway *caurina* ranges, the means 59.3-59.6 |
| Bill depth at the feathering | 13-18 | AVONET 13.4 at the nostril; Ridgway's rule 14.9; photo 15 |
| Bill depth / width | 1.2-1.8 | AVONET 1.4 |
| Culmen / wing chord | 0.33-0.42 | Computed 0.36; Ridgway "more than one-third but less than half" |
| Tail / wing chord | 0.52-0.63 | Computed 0.57; "about three-fifths" |
| Tarsus | 10-13 | Ridgway |
| Wing chord | 155-172 | Ridgway *caurina* 159-169.5 |
| Length at rest (traced) | 300-345 | Photo 325; skins 284-330 |
| Eye centre behind the culmen's base | 18-32 | Photo 25 |
| Crest top above the eye, `crestRaise` 0 / 1 | 14-24 / 26-36 | Photo 20 / 30 |
| Bill angle at rest | 0-15° below level | Photo 4° |
| Feet on the perch: the toes' lowest point within 5 mm of the branch's top | yes | Spec |
| Breast ahead of the feet | 30-65 | Photo 48 |
| Painted atlas, `male`: the band blue-grey, the flanks and belly free of rufous; `female`: a rufous band below the blue one and rufous flanks | yes | Section 4 |
| Both: the white collar meets round the hindneck; the supraloral spot white | yes | Section 4 |
| Binocular field view at 30 m: collar, band and the female's rufous read | viewer check | Section 4.4 |

---

## 11. Style settings (`kingfisher`)

Rates are given per bird. "Compressed" marks a deliberate speed-up for play over the sourced rate.

| Setting | Value | Status |
|---|---|---|
| **Perch bout** (between moves) | **60-240 s** | **Estimate, compressed** about 4×: Kelly's bouts are 5.7-15.7 min in winter [Kelly 1998a]; mornings longest |
| After a perch bout | perch plunge 0.40, flyout to hover 0.22, move to another perch 0.30, stay (another bout) 0.08 | **Estimate**: tuned for plunges 0.65 / hovers 0.35 and flights every 2-4 min |
| **Plunges an hour** (what the shares and times give) | **about 10-15** | **Compressed** from 0.7-3.1 an hour [Kelly 1998a, Computed]; Salyer & Lagler's 10-15 min patrols |
| Peer before a perch plunge | 1-4 s, bill to 40-45° down | Photo 44° (section 6); Estimate time |
| Perch plunge | lean 0.2-0.4 s, drop **70-85° below level** | Photo 82°; "obliquely" to "nearly perpendicular" [Bent 1940, pp. 120, 122] |
| Flyout distance from the perch | **15-40 m** | Estimate: hovering fishes water beyond the 15 m fished from perches [Prose 1985, p. 8] |
| **Hover height** | **5-12 m** above the water | "30 or 40 feet" [Bent 1940, p. 120]; lower bound an Estimate |
| **Hover length** | **2-8 s** a hover; shift 2-5 m and hover again up to 2 times; give up 0.3 | "a few seconds" [Bent]; 5-10 s [Meyerriecks & Nellis 1967]; shares an Estimate |
| Hover plunge | straight down, 80-90° below level | "directly downward" [Bent 1940, p. 120] |
| Plunge speed at entry | about 7-14 m/s (perch 3 m to hover 10 m) | Computed, free fall √(2gh) ignoring drag; the flight document refines it |
| **Under water** | **0.5-1.5 s** hidden; no deeper than 0.3 m | "emerge almost instantly" [Gabrielson & Jewett 1940]; "several seconds" at most [Bent]; fish within 15 cm of the surface [Prose 1985] |
| Water under a plunge | at least 0.3 m deep by the depth bake | Estimate from the 15 cm prey depth and the body |
| **Catch rate** | **0.5** | Sourced range 0.34 [Booth et al. 2021] to 0.75-0.96 [Kelly 1998a, Computed]; Estimate inside it |
| **Fish** | 80 mm | Section 7.1 (Estimate) |
| **Handle** | beat 3-8 times over 3-10 s; turn 1-2 s; swallow 1-3 s, `headPitch` up 0.4-0.6 rad; **8-20 s** in all | Behaviour sourced [Salyer & Lagler 1946; Bent 1940; Forbush 1927]; times Estimate |
| After a catch, fly to | the nearest perch | "flies with it to some favorite perch" [Bent 1940, p. 120] |
| **Perch-to-perch flight** | **9-13 m/s**, **0.5-4 m** above the water, 40-100 m | Estimate below the 16-18 m/s travel speed [Burland 1947]; height [Burland 1947; Carey in Bent]; distance Computed from Kelly's 5-7 s flights |
| Flights an hour (all kinds) | 15-25 | **Compressed** from 4.1-7.2 [Kelly 1998a] |
| Idles on a perch | head bob every 5-20 s (dip 10-15 mm, 0.3-0.5 s); tail flick every 10-30 s (20-30°, 0.2-0.4 s); crest up for 1-5 s every 20-60 s; head turn 30-60° over 1-3 s every 10-30 s; all more often for 5 s after landing | Behaviour sourced [Bent 1940, p. 122]; sizes and rates Estimate |
| **Rattle**, asked for | perch-to-perch flight 0.8; flyout 0.3; landing 0.3; plunge 0.1; catch 0.2; from a quiet perch once every 3-8 min | Contexts sourced [BBR 1874, p. 394; Bent 1940, pp. 111, 122; Dawson 1923, p. 1050]; rates Estimate |
| Rattle length | 0.5-1.0 s from a perch; 1-3 s in flight | "short chatter (0.5 to 1.0 sec)" [Davis 1986, p. 505]; the flight length an Estimate |
| Nearest perch to the vantage | **30-35 m** | Estimate from section 7.1 (tolerance) |
| Perches | 3-4, 2-6 m above the water, 40-100 m apart, each over water at least 0.3 m deep | Sections 6, 7.1 |
| Count | 1 | Section 7.1 (territory) |

**A visit, as a script** (Estimate): land, rattle, crest up and tail flick → perch 1-4 min with bobs, flicks and head turns → peer down → plunge (spray, ring) → under 1 s → up and back to the perch (half the time with a fish: beat, turn, swallow, 8-20 s) → ... → after a few plunges, or after a hover plunge far out, fly low to another perch, rattling.

---

## 12. Open questions and confidence

- **Measurements: high.** Ridgway's sexed *caurina* means cover everything but the bill's depth and width (AVONET, at the nostril) and the crest (photo only).
- **Plumage and versions: high** for the sexes; **medium** for ages. Pyle 1997 was not read; Ridgway and Bent agree on the juvenile's band. Only 11 of 94 bird-days could be aged.
- **Sex mix: medium.** 57% female of 47 sexed bird-days, with a bias toward recognising females; the observers' own labels lean male.
- **Field marks: high.** The pixel reasoning is computed from the optics.
- **Posture: medium.** One sharp side-on photo gives the lengths; the others' scales rest on the 0.70 ratio from that photo, and two foreshortened photos gave lengths 10-20% long. Crest heights ±5 mm.
- **Bob, flick, crest timing, handling time: low** (estimates; no video timed).
- **Perch versus hover shares: low** (no count in any source).
- **Hover height and length: medium-low** (Bent's "30 or 40 feet" and "a few seconds"; one note's 5-10 s).
- **Catch rate: medium** (two studies, 34% and 75-96%, in very different places).
- **Dive and flight rates: medium** for the sourced rates, which come from a Colorado winter river; the game's rates are **compressed about 4×** and the spec should accept that or not.
- **Prey size: high** for the range; the 80 mm prop is a choice.
- **Tolerance: low-medium.** No flight-initiation distance exists for the species that I could find; the 30-35 m near perch rests on the urban valley records and the anecdotes.
- **Territory and cast of one: high** (Davis 1982; Salyer & Lagler 1946; the valley records).
- **Snippet-only or abstract-only claims:** Kelly 1996, Kelly 1998b, Chodacki & Skipper 2019, Penaluna et al. 2016; Davis 1988 and Davis's and Hamas's personal communications (through Prose 1985 and Landrum et al. 1993).

---

## Appendix: iNaturalist records sexed and aged (Willamette Valley box)

All 101 research-grade records with photos from 13 September to 12 October, box 43.8-45.8 N, 122.6-123.6 W, numbered 0-100 in order of observation id; each judged on its first three photos. Observation ids in brackets.

- **Female (27 records, 27 bird-days):** 6 (61235093, juvenile?), 7 (61629142), 10 (94897205, flying), 19 (97076869, flying), 20 (97314694), 21 (97697669), 22 (100871816), 24 (135575027, **juvenile**), 25 (136107054), 29 (137092395), 31 (137590874), 32 (138025250), 35 (138382910), 36 (144456268), 37 (183117768), 38 (183872900), 47 (204990271), 51 (242623893, flying), 53 (242968801), 59 (246355205, hovering), 60 (246430477, juvenile?), 69 (316789099), 70 (316802245), 71 (316835005), 83 (320103991), 84 (320600467), 91 (400639376, adult?).
- **Male (22 records, 20 bird-days):** 8 (61629259, with female 7), 9 (61703892), 11, 12, 13 (95479078, 95479901, 95480431; one bird, **adult**), 14 (95918124), 17 (96834239), 26 (136621488, **adult**), 27 (136710863), 33 (138049799), 42 (185373909), 48 (205183934, flying), 50 (242013000, **juvenile**), 56 (244817765, **adult**), 64 (247575916), 65 (256442676), 76 (318921368), 78 (319458004), 81 (319707946, **adult**, plunging), 85 (320732108, flying), 89 (343455417), 100 (404379800).
- **Juvenile, sex not clear (2):** 58 (246078879, hovering), 90 (400113950).
- **Not sexable (50 records, 45 bird-days):** 0-5, 15, 16, 18, 23, 28, 30, 34, 39-41, 43-46, 49, 52, 54, 55, 57, 61-63, 66-68, 72-75, 77, 79, 80, 82, 86-88, 92-99.
- **Same bird, same observer, same day:** 7-8 (a female and a male: two birds), 11-13, 17-18, 30-31, 33-34, 72-73, 78-79.

The records, with dates, places, observers and photo licences, are in the scratchpad's `inat/belkin1-sample.json`.

---

## References

- **[Ridgway 1914]** Ridgway, R. 1914. *The Birds of North and Middle America*, Part VI. Bull. U.S. Natl. Mus. 50. Alcedininae p. 406; genus *Streptoceryle* pp. 407-408; key p. 409; *S. alcyon alcyon* pp. 415-417 (adult male p. 415; adult female, young, measurements pp. 415-416); *S. a. caurina* p. 420. Read via Internet Archive OCR: https://archive.org/details/cu31924022528081
- **[BBR 1874]** Baird, S. F., T. M. Brewer, and R. Ridgway. 1874. *A History of North American Birds: Land Birds*, vol. II. Little, Brown, Boston. Alcedinidae and *Ceryle* pp. 391-392; *Ceryle alcyon* pp. 392-395. Read via Internet Archive OCR: https://archive.org/details/historyofnortham02bair
- **[Bent 1940]** Bent, A. C. 1940. *Life Histories of North American Cuckoos, Goatsuckers, Hummingbirds and Their Allies*. Bull. U.S. Natl. Mus. 176. Eastern Belted Kingfisher pp. 111-129 (habits p. 111; young p. 117; plumages pp. 118-119; food pp. 119-121; behavior pp. 122-123; voice pp. 123-124; field marks p. 124; distribution p. 127); Western Belted Kingfisher pp. 129-130. Read via Internet Archive OCR: https://archive.org/details/bulletinunitedst1761940unit
- **[Tobias et al. 2022]** Tobias, J. A., et al. 2022. AVONET: morphological, ecological and geographical data for all birds. *Ecology Letters* 25: 581-597. https://doi.org/10.1111/ele.13898 . Data: https://doi.org/10.6084/m9.figshare.16586228 (sheets AVONET1_BirdLife and AVONET_Raw_Data, rows for *Megaceryle alcyon*: NHMUK 4, MMUM 2).
- **[Dunning 2008]** Dunning, J. B. 2008. *CRC Handbook of Avian Body Masses*, 2nd ed. Not read; seen quoted in AVONET (148 g).
- **[Davis 1982]** Davis, W. J. 1982. Territory size in *Megaceryle alcyon* along a stream habitat. *Auk* 99: 353-362. Read in full (SORA / USF Digital Commons).
- **[Davis 1986]** Davis, W. J. 1986. Acoustic recognition in the Belted Kingfisher: cardiac response to playback vocalizations. *Condor* 88: 505-512. Read in full.
- **[Salyer & Lagler 1946]** Salyer, J. C., II, and K. F. Lagler. 1946 (issued 1949). The eastern belted kingfisher, *Megaceryle alcyon alcyon* (Linnaeus), in relation to fish management. *Trans. Am. Fish. Soc.* 76: 97-117. Read in full (University of Michigan Deep Blue reprint).
- **[Kelly 1998a]** Kelly, J. F. 1998. Behavior and energy budgets of Belted Kingfishers in winter. *J. Field Ornithol.* 69: 75-84. Read in full. Table 2 p. 80.
- **[Kelly 1998b]** Kelly, J. F. 1998. Latitudinal variation in sex ratios of Belted Kingfishers. *J. Field Ornithol.* 69. Abstract only (via OpenAlex).
- **[Kelly 1996]** Kelly, J. F. 1996. Effects of substrate on prey use by belted kingfishers (*Ceryle alcyon*): a test of the prey abundance hypothesis. *Can. J. Zool.* 74: 693-697. Abstract only.
- **[Kelly et al. 2020]** Kelly, J. F., E. S. Bridge, and M. J. Hamas. 2020. Belted Kingfisher (*Megaceryle alcyon*), version 1.0. In *Birds of the World*. Cornell Lab of Ornithology. Introduction only; the rest is paywalled.
- **[Booth et al. 2021]** Booth, H., L. Yruretagoyena, M. Kuruvilla, and D. L. Slager. 2021. On the marine feeding behavior and activity budgets of Belted Kingfishers. *Wilson J. Ornithol.* 133: 291-295. Read as the author's proof (pp. 1-5 = 291-295).
- **[Prose 1985]** Prose, B. L. 1985. *Habitat Suitability Index Models: Belted Kingfisher*. U.S. Fish and Wildlife Service Biological Report 82(10.87). 22 pp. Read in full (GovInfo scan). It cites White 1953 (Fish. Res. Board Can. Bull. 97) and personal communications from W. J. Davis and M. J. Hamas.
- **[Meyerriecks & Nellis 1967]** Meyerriecks, A. J., and D. W. Nellis. 1967. Egrets serving as "beaters" for Belted Kingfishers. *Wilson Bull.* 79: 236-237. Read in full.
- **[Lincoln 1924]** Lincoln, F. C. 1924. A "territory" note on the Belted Kingfisher. *Wilson Bull.* 36: 113-115. Read in full.
- **[Burland 1947]** Burland, L. J. 1947. Air speed of Belted Kingfisher. *Wilson Bull.* 59: 113. Read in full.
- **[Grinnell & Storer 1924]** Grinnell, J., and T. I. Storer. 1924. *Animal Life in the Yosemite*. University of California Press. Pp. 313-315. Read via Internet Archive.
- **[Dawson 1923]** Dawson, W. L. 1923. *The Birds of California*, vol. 2. Pp. 1049-1052. Read via Internet Archive.
- **[Forbush 1927]** Forbush, E. H. 1927. *Birds of Massachusetts and Other New England States*, Part II. Pp. 248-252. Read via Internet Archive.
- **[Gabrielson & Jewett 1940]** Gabrielson, I. N., and S. G. Jewett. 1940. *Birds of Oregon*. Oregon State College, Corvallis. Pp. 367-368. Read via HathiTrust (mdp.39015068570566).
- **[Jewett & Gabrielson 1929]** Jewett, S. G., and I. N. Gabrielson. 1929. Birds of the Portland area, Oregon. *Pacific Coast Avifauna* 19: 24. Read in full.
- **[Landrum et al. 1993]** Landrum, C. L., T. L. Ashwood, and D. K. Cox. 1993. *Belted Kingfishers as Ecological Monitors of Contamination: A Review*. ORNL/M-2533, Oak Ridge National Laboratory. Read via OSTI (unnumbered pages cited by PDF page); used for Davis 1988 (secondary).
- **[Chodacki & Skipper 2019]** Chodacki, G. D., and B. R. Skipper. 2019. Partitioning of foraging habitat by three kingfishers (Alcedinidae: Cerylinae) along the South Llano River, Texas, USA. *Waterbirds* 42: 231-. https://doi.org/10.1675/063.042.0211 . Abstract only (via OpenAlex).
- **[Penaluna et al. 2016]** Penaluna, B. E., J. B. Dunham, and D. L. G. Noakes. 2016. Instream cover and shade mediate avian predation on trout in semi-natural streams. *Ecology of Freshwater Fish* 25: 405-411. https://doi.org/10.1111/eff.12221 . Abstract only.
- **[AAB-ID]**, **[AAB-LH]**, **[AAB-Overview]** Cornell Lab of Ornithology. Belted Kingfisher: Identification (text and gallery captions), Life History, and Overview pages. All About Birds. https://www.allaboutbirds.org/guide/Belted_Kingfisher/id (accessed 2026-09-30). The Life History page credits Kelly, Bridge & Hamas 2009 (BNA).
- **[BirdWeb]** Seattle Audubon Society. Belted Kingfisher. BirdWeb. https://www.birdweb.org/birdweb/bird/belted_kingfisher
- **[iNat query 2026]** iNaturalist API v1, `/observations`, research grade, with photos, taxon 2548 (*Megaceryle alcyon*), box 43.8-45.8 N, 122.6-123.6 W, months 9-10, queried 2026-09-30; the 101 records from 13 September to 12 October are judged in the appendix. Proxy data with observer and photographer bias.
- **Not read (cited only as unread, snippet, or through another source):** Pyle, P. 1997. *Identification Guide to North American Birds*, Part I. Hamas, M. J. 1994. Belted Kingfisher. *The Birds of North America* 84. White, H. C. 1953. The eastern belted kingfisher in the Maritime Provinces. Fish. Res. Board Can. Bull. 97 (through Prose 1985). Davis, W. J. 1988. King of the stream. *Natural History* 97 (through Landrum et al.). Davis 1980 (MS thesis) and 1985 (PhD dissertation). Brooks, R. P., and W. J. Davis. 1987. Habitat selection by breeding Belted Kingfishers. *Am. Midl. Nat.* 117: 63-70 (abstract only; breeding habitat, not used). Kelly, J. F., and B. Van Horne. 1997 (*Ecography* 20; *Ecology* 78; abstracts only). Albano, D. J. 2000 (UMass PhD dissertation; known only as cited by Booth et al.). Hamas, M. J. 1975 (PhD dissertation, Univ. Minnesota; read by the literature search but used here only through Prose). Marshall, D. B., et al. 2003. *Birds of Oregon* (lending copy only). Livezey et al. 2016 (flight-initiation-distance supplement; not opened). Grinnell, J. 1910 (*caurina*'s description; through Ridgway and Bent).
