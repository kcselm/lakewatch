# Lake water: colour and clarity, a morning breeze, ripple rings, wakes, reflections, shorelines, and steam fog

Date: 2026-09-30
Purpose: source data for the water round, `docs/superpowers/specs/2026-09-30-water-design.md`. The scene is Willow Lake, a Willamette Valley lowland pond, on a late-September morning with the sun 24° up. The eye is 1.6 m above the water, looking at water 10-65 m away (1.4-9° above the surface). The optics have 60°, 7.5° and 2° vertical fields of view. The wind in `data/locations/lake.json` blows toward 240° at strength 0.35, gustiness 0.5. The lake is about 90 m by 70 m, and the tree line on the far bank (z = −74) is 7-16 m tall.

How to read the citations: `[Key]` points to the References section at the end. "Snippet" means I only saw the claim in a search-engine excerpt or a secondary summary and could not read the page, so treat it as unverified. "Computed" means my own arithmetic on cited data or standard physics (constants: g = 9.81 m/s², σ = 0.0728 N/m, ρ = 998 kg/m³, ν = 1.0 × 10⁻⁶ m²/s, n = 1.333). "Estimate" means no source gives the number and I chose it, with the basis stated. "Set by eye" means a rendering choice with no physical source behind it.

---

## 1. Summary

- **The water is murky, olive to green-brown.** Late-summer Secchi depths on valley-floor lakes run from **0.2 m** (Sturgeon Lake, Sauvie Island, October) through **0.8 m** (Smith Lake) to **1.1 m** (Bybee Lake), with **0.85-1.0 m** at Fern Ridge. Transparency is lowest in August-October, from clay stirred up by wind and from algae [AOL]. Adopt **Z_SD ≈ 0.7 m**.
- **The bed disappears at about 0.3 m of depth** when you look from the vantage (Computed, section 2.3). The bench (4.5 cm) and the shelf (5-22 cm) show their bed, and the open water does not. For the alpha, use `alpha = 1 − exp(−depth / 0.06 m)`.
- **The breeze.** Strength 0.35 maps to **U₁₀ ≈ 2.8 m/s**: Beaufort 2, "small wavelets, crests glassy, no breaking" [SPC]. Ripples need about **1-1.7 m/s** to start [Paquier et al. 2016, Table I; Donelan & Plant 2009]. So the mean wind roughens the whole lake, and lulls let glassy patches open. Cat's paws are the other way round: patches of ripples that run at about the wind's own speed [Heiler & Kahma 2015].
- **Rings.** Capillary-gravity dispersion gives a minimum phase speed of **0.231 m/s at λ = 1.71 cm** and a minimum group speed of **0.178 m/s at λ = 4.4 cm** (Computed). A ring is an annulus. Its **inner, calm edge spreads at 0.178 m/s** whatever made it [Le Méhauté 1988]. Its outer edge spreads at the group speed of the longest wave the splash makes, **0.21 m/s for a bill dip, about 0.25 m/s for a heron's strike and about 0.35 m/s for a dive** (Computed from wavelength ≈ 2 × splash size, an Estimate). Today's 1.1 m/s is 3-5 times too fast.
- **Wakes.** Mallards swim at **0.35-0.70 m/s** and prefer **0.50 m/s** [Prange & Schmidt-Nielsen 1970]. Hull Froude numbers of 0.19-0.39 put the wake in the **Kelvin regime** (below Fr ≈ 0.5 [Rabaud & Moisy 2013]). The outer edge sits at **19.47°**, but the wake is dominated by transverse waves and looks narrower [Pethiyagoda et al. 2021]. **Below 0.23 m/s nothing makes a wake** [Raphaël & de Gennes 1996; Burghelea & Steinberg 2001], and that includes a grebe cruising at 0.15 m/s.
- **Fresnel.** Unpolarised reflectance is **0.86 at 1.4°, 0.72 at 3°, 0.53 at 6° and 0.39 at 9°** (Computed, full table in section 6.1). Schlick's approximation with F₀ = 0.02 and power 5 is within 0.05 of it everywhere.
- **Reflections streak vertically** because a slope tilts a reflected ray's elevation by 2s but its azimuth by only 2s·sin(grazing), so the streaks are **about 1/sin(grazing) times taller than they are wide**: 19× at 3° (Computed). On clean water the slope variance is **σ² = 0.003 + 0.00512·U** [Cox & Munk 1954], which gives an rms slope of about 7.5° at 2.8 m/s. That is more than the grazing angle, so rough water shows no image of the far bank, only smeared colour. **The far bank reflects only in calm patches.**
- **The wet band.** Wet soil reflects about **half** as much light as dry: an albedo of 0.30 dry against 0.14 wet [Idso et al. 1975, via Gascoin et al. 2009]. Capillary rise is **2.5 cm in fine gravel** and **over 1 m in silt** [Atterberg, via Lohman 1972]. Use **mud: 0.10 m, ×0.55** and **gravel: 0.03 m, ×0.70**.
- **Steam fog** is plausible at dawn but mostly gone by the scene's hour. Eugene averages **4.3 days of dense fog in September and 10.8 in October** [Rockey 1997]. Steam fog needs air **5-15 °C colder than the water** [Saunders 1964]. The late-September dawn gap is about 7-9 °C and closes to about 3 °C by 2.3 h after sunrise (Estimate).

---

## 2. Colour and clarity of valley lakes in late September

### 2.1 Secchi depths

| Lake | Secchi | Date | Notes | Source |
|---|---|---|---|---|
| Fern Ridge Lake (Lane Co.) | 1.0 m | 11 Aug 1981 | "mesotrophic, high turbidity"; "clearest in May and June, but by August turbidity has reduced transparency to a very low level", mostly clay from the shallow bottom, "suspended by wind action" | [AOL: Fern Ridge, 1985 page] |
| Fern Ridge Lake | ≈ 0.85 m | 25 Jun 2007 | NLA 2007; turbidity 13 NTU, chlorophyll-a about 6 µg/L (values read from a garbled PDF layout, so check before quoting) | [AOL: Fern Ridge, NLA 2007 page] |
| Smith Lake (Portland) | 0.8 m | 22 Jun 1982 | eutrophic; average depth 0.3 m; diatoms, "on occasion green algae are also very abundant"; waterfowl add nutrients | [AOL: Smith & Bybee] |
| Bybee Lake (Portland) | 1.1 m | 22 Jun 1982 | as above; "water transparency is limited" | [AOL: Smith & Bybee] |
| Sturgeon Lake (Sauvie Island) | 0.2 m | 11 Oct 1982 | "very high turbidity"; annual range 0.1-1.2 m, "average is at the lower end"; wind keeps the silt up; *Aphanizomenon* and *Anabaena* blooms | [AOL: Sturgeon] |
| Blue Lake (Multnomah Co.) | 0.8-4.0 m | 1980s | 0.8 m in summer algal blooms, 4.0 m when algae are low; "the more algae present in the lake, the more turbid and green it becomes" | [AOL: Blue Lake] |

I found no Secchi data for Baskett Slough, Ankeny, Finley or Talking Water Gardens. They are shallow managed marsh ponds of the same valley clay, so treat them like Smith and Bybee (Estimate). The pattern is the same everywhere: **shallow valley lakes are clearest in spring and murkiest from August to October.** A small pond stirred by wind, carp and waterfowl in late September belongs at the low end. **Adopt Z_SD = 0.7 m** (range 0.2-1.1).

### 2.2 Tint

The Forel-Ule scale runs from indigo-blue (1) to cola brown (21). Higher numbers go with more turbidity and lower Secchi depths [Garaba et al. 2015]. These lakes are turbid with clay and diatoms or green algae, so they sit in the **greenish-brown classes**, not blue-grey (Estimate; no FU reading was found for a valley lake). The body colour is olive: clay silt makes it brown, and chlorophyll pushes it green. Blue is absorbed first.

Suggested tints, **set by eye** from these descriptions and the FU class. They are not measured from a photo:

| Uniform | Today | Suggested | Meaning |
|---|---|---|---|
| `uShallow` | `#4f6f5c` (teal) | **`#5e5c42`** | water tinting a wet silt bed through about 10 cm |
| `uDeep` | `#1f3a44` (blue-teal) | **`#2e392d`** | optically deep water, no bed, no reflection |
| bed transmittance per metre of path (R, G, B) | none | **K ≈ (2.2, 1.9, 3.4) m⁻¹** | multiply the bed by `exp(−K · 1.5 · depth)` |

The K values are an Estimate: their mean matches Poole & Atkins' Kd ≈ 1.7 / Z_SD = 2.4 m⁻¹ [Poole & Atkins 1929], and blue is weighted about 1.6× as algal and humic water absorbs it. At the player's angles the body colour only matters where the reflection is dark or weak: within about 20 m (grazing above 4.5°, R < 0.63) and under the reflected tree line.

### 2.3 How deep the bed shows

The classical Secchi relation is **Z_SD = Γ / (c + K)**, with **Γ ≈ 8.7** for a white disc (reflectance 0.82 against water at 0.02, and an eye contrast threshold of 0.0066) [Tyler 1968, via Preisendorfer 1986]. A lake bed is a much duller target. For wet mud at about 0.10 against turbid water at about 0.03, its Γ is ln((0.10 − 0.03)/0.03 / 0.0066) ≈ **5.9** (Computed; the reflectances are an Estimate). So the bed vanishes at about **0.68 × Z_SD** of path.

From the vantage, the refracted ray runs at 48° from vertical for every grazing angle between 1° and 15° (Computed from Snell's law). So each metre of depth is about **1.5 m of path**. The bed therefore vanishes at a depth of about 0.68 × 0.7 / 1.5 ≈ **0.32 m** (Computed). The e-folding depth of the bed's contrast is 1 / ((8.7 / 0.7) × 1.5) ≈ **0.054 m**.

The surface reflection (0.4-0.86 at these angles) veils the bed further, so on screen use **`alpha = 1 − exp(−depth / 0.06)`** (set by eye, rounded up from 0.054 m). That gives:

- the bench (4.5 cm): alpha 0.53
- the shelf: 0.57 at its 5 cm shore edge and 0.97 at its 22 cm lake edge
- 0.3 m: 0.99, opaque

A heron standing in 10-18 cm shows its lower legs faintly and tinted, as the spec wants.

---

## 3. A morning lake at a light breeze

### 3.1 Mapping the game's 0.35

The game's strength is a 0..1 scale with no unit. I map it as **U₁₀ = 8 m/s × strength**, so 0.35 gives **2.8 m/s** (5.4 kt). That is mid-Beaufort 2, a light breeze of 4-6 kt: "small wavelets, crests glassy, no breaking". Force 1 (1-3 kt) is "scaly ripples, no foam crests", and force 0 is "smooth and mirror-like" [SPC]. The factor of 8 is an Estimate, chosen so that strength 1 lands at force 4-5. The shader already scales its wind term by `0.6 + 0.4·gust`, and with gustiness 0.5 the gust stays at or below 0.5. The mapping therefore puts local wind at about 1.7 m/s in lulls and about 2.2 m/s in the strongest gusts. That is too narrow for gusts: I suggest ±40% of the mean, 1.7-3.9 m/s (Estimate).

### 3.2 When ripples start

Onset thresholds for water in Paquier et al.'s review table [Paquier et al. 2016, Table I]:

- outdoors: 0.85 and 1.0-1.2 m/s in the older observations (Russell 1844; Jeffreys 1925)
- field, Donelan & Plant 2009: **1.7 m/s**
- laboratory, Donelan & Plant 2009: 1.5 m/s
- Kahma & Donelan 1988, measured on a tunnel's centreline: 2.9-3.4 m/s

The inception friction velocity is about 2 cm/s [Kahma & Donelan 1988]. Below the threshold the surface carries only **"wrinkles"**: streaky deformations 1-10 µm high that are elongated along the wind [Paquier et al. 2016]. Visually that is glassy. **Use about 1.5 m/s** as the local wind below which water goes glassy.

### 3.3 Calm patches and cat's paws

Heiler & Kahma [2015] describe the mechanism. Waves appear wherever the fluctuating local wind exceeds a critical speed. As the mean wind rises, the first rough patches (cat's paws) appear inside calm water, and later the calm patches shrink to the lulls. At 2.8 m/s against a threshold of about 1.5 m/s, **most of the lake is rippled, and glassy patches open in the lulls.**

Two kinds of glassy patch look different and move differently:

1. **Wind lulls, the negative of cat's paws.** They move with the air, at about the mean wind speed. Gust patterns under 1 km across travel at the background flow's speed [LiDAR gust study, Snippet]. Cat's paws on water carry "bursts" of stress separated by quiescent intervals [Dorman & Mollo-Christensen 1973]. They last **10-20 s** [Natural Navigator, Snippet, low trust].
   - Size: the wind carries the game's gust clock (value noise at 0.08 and 0.5 Hz scale, periods of about 12 s and 2 s) across the water. At 2.8 m/s, gust periods of 5-15 s give **patches about 15-40 m across** (Computed with Taylor's frozen-turbulence approximation). The fast octave adds 5-m scale texture.
   - **Drift: about 2.8 m/s downwind** (the mean wind).
2. **Surface-film slicks.** Organic films from algae and waterfowl damp capillary ripples. Oil slicks cut the mean square slope by a factor of 2-3 [Cox & Munk 1954]. They drift with the surface water, at roughly **3% of the wind speed, about 0.08 m/s**, and persist for minutes. The 3% is a standard figure (Wu 1983), not read, so treat it as Snippet. They are long, lazy streaks aligned with the wind. Size: 2-10 m wide and tens of metres long (Estimate).

**Shelter by the trees.** A windbreak reduces wind for 2-5 H upwind and up to 30 H downwind, most strongly at 2-10 H [Missouri CfA 2025]. The wind comes from about 60° (it blows toward 240°), so it crosses the far tree line (H = 7-16 m, 12 m behind the far waterline) obliquely at about 30°. Expect **a calmer strip along the far shore, 5-15 m wide** (Estimate), right where the herons wade and where the tree line should reflect best.

**How much is calm:** 15-25% of the open water at any moment, plus the sheltered strip (Estimate, no source found).

**The reeds' gust front** (`vegetation.ts`: `sin(along·0.35 − t·2.2)`) has an 18 m wavelength and moves at 2.2 / 0.35 = **6.3 m/s**, more than twice the 2.8 m/s wind (Computed). If the water is to share it, **ω ≈ 1.0 rad/s** (0.35 × 2.8) would move it at the wind's speed. This is a suggestion; the reeds' look was tuned by eye.

### 3.4 Ripple wavelengths

For fetch-limited wind waves, the JONSWAP relations [Hasselmann et al. 1973] with U = 2.8 m/s and a fetch of 60 m give (Computed):

- a peak frequency of about 3 Hz, so a **peak wavelength of about 0.18 m**
- a significant height of about **1 cm**

**Parasitic capillaries** of about 1-2 cm ride on the crests, near the 1.7 cm minimum-speed wavelength [Kudryavtsev et al. 1999, abstract].

**Anisotropy:** the up/downwind mean square slope is 1.0-1.9× the crosswind one (mean 1.34, and 1.16 on slicks) [Cox & Munk 1954]. Crests run across the wind, so noise should be stretched about **1.5:1 across the wind** for the 0.18 m octave, and close to isotropic for the capillary octave (Estimate).

**Pixel footprint** (Computed; 1080 px tall). At 30 m, one eye-view pixel covers about 0.55 m of water along the view and 0.03 m across it. Through the telescope at 63 m it covers about 0.08 m along and 0.002 m across. **So along the view, the 0.18 m octave is only resolved through the optics, and the 1-2 cm capillaries never are.** Their slope variance belongs in a blur or roughness term, not in the normal (the LEAN-mapping idea [Olano & Baker 2010, not re-read]).

---

## 4. Ripple rings

### 4.1 Dispersion

For deep water, ω² = gk + σk³/ρ. Speeds by wavelength (Computed):

| λ (cm) | 0.5 | 1.0 | **1.71** | 3.0 | **4.36** | 5 | 10 | 15 | 20 | 30 |
|---|---|---|---|---|---|---|---|---|---|---|
| phase speed c (m/s) | 0.315 | 0.248 | **0.231 (min)** | 0.249 | 0.28 | 0.295 | 0.401 | 0.487 | 0.561 | 0.686 |
| group speed c_g (m/s) | 0.448 | 0.309 | 0.232 | 0.186 | **0.178 (min)** | 0.179 | 0.212 | 0.250 | 0.285 | 0.345 |
| viscous decay time, clean (s) | 0.3 | 1.3 | 3.7 | 11 | 24 | 32 | 127 | 285 | 507 | 1140 |

The minimum phase speed is (4gσ/ρ)^¼ [Raphaël & de Gennes 1996]. On clean water, viscosity kills only the millimetre ripples. Surface films raise damping strongly in the centimetre band (they halve to third the mean square slope [Cox & Munk 1954]), so on a eutrophic pond rings fade in seconds, not minutes (Estimate).

### 4.2 What a ring looks like

Le Méhauté [1988] modelled rings from drop impacts. The waves cluster around the wavenumber of minimum group speed. Short, super-k_m ripples dominate near the source early on, and longer sub-k_m waves are all that is left farther out. The pattern is "a multiplicity of rings of amplitude increasing towards the drop", ended by a trailing wave, and **"the number of rings increases with time and distance."** Inside a radius of c_g,min · t there are no waves, so **a calm disc grows at 0.178 m/s** [Le Méhauté 1988; standard Cauchy-Poisson result].

The outer edge advances at the group speed of the longest wave the splash makes. That wavelength is of the order of the disturbance's size [Moisy & Rabaud 2014]. I take **λ_max ≈ 2 × the splash diameter** (Estimate). Individual crests move at the phase speed, which is about twice the group speed for these wavelengths, so crests are born at the back of the train, run forward through it, and die at its front.

At a light breeze, a ring is lost once its slope drops below that of the wind ripples. In 2-D a dispersive ring's amplitude falls roughly as 1/t (the energy spreads over an annulus whose radius and width both grow with t; Computed). So rings last longer in calm patches than in rough ones.

### 4.3 By event (Estimate, apart from the computed speeds)

| Event | Splash size | λ_max | Outer edge speed (Computed) | Inner calm edge | Crests seen | Visible life | Max radius |
|---|---|---|---|---|---|---|---|
| Bill dabble (duck) | 2-3 cm | 5 cm | 0.18-0.19 m/s | 0.178 m/s | 2 | 2.5 s | 0.45 m |
| Head dip (duck, coot) | 5-6 cm | 10 cm | **0.21 m/s** | 0.178 | 3 | 3.5 s | 0.75 m |
| Heron or egret strike | bill and head, 6-8 cm, fast | 15 cm | **0.25 m/s** | 0.178 | 3-4 | 4 s | 1.0 m |
| Tip-up, grebe roll or surfacing | 10-15 cm | 20-30 cm | 0.29-0.35 m/s | 0.178 | 4-5 | 5 s | 1.6 m |
| Grebe splash-dive, coot jump-dive | body, 15-20 cm | 30-40 cm | **0.35-0.40 m/s** | 0.178 | 5-6 | 6 s | 2.2 m |
| Grebe sinking | none | none | none | none | 0 | none | none; "without making a ripple" [Bent 1919, in the grebe doc] |

The coot document estimated a dive ring of 0.5-1 m, and the heron and egret documents estimated a strike ring radius of 0.15-0.18 m. Those were guesses against the old 1.1 m/s rings. The table above supersedes them.

---

## 5. Wakes

- **Duck speeds.** Mallards trained in a flume swam **0.35-0.70 m/s**, with a minimum cost of transport at **0.50 m/s**. Free ducks on a pond swam at about that speed. The **maximum sustainable 0.70 m/s is the hull speed** of a 0.33 m hull [Prange & Schmidt-Nielsen 1970]. The game's cruise speeds (mallard 0.48, others 0.40, coot wake above 0.3) sit inside this range. The grebe's 0.15 m/s cruise sits below the wake threshold, which matches its "no duck's wake".
- **Threshold.** A disturbance slower than c_min = 0.23 m/s radiates no waves [Raphaël & de Gennes 1996]. The wave drag switches on continuously above that speed, growing as √(V − V_c) [Burghelea & Steinberg 2001]. **Wake minimum speed: 0.23 m/s.** Fade the wake in over 0.23-0.30 m/s.
- **Kelvin or Mach.** Wakes keep the Kelvin angle of 19.47° below a hull Froude number of about 0.5 and narrow as 1/U above it [Rabaud & Moisy 2013]. A duck at 0.35-0.70 m/s with L = 0.33 m has **Fr = 0.19-0.39** (Computed), which is the **Kelvin regime**. The capillary "Mach-like" wake (angle ≈ c_g,min / U) applies only to objects smaller than the capillary length [Moisy & Rabaud 2014], not to ducks.
- **Low-Froude look.** At low Froude numbers the pattern is dominated by transverse waves, whose largest amplitudes lie on the centreline, and the apparent wake angle is **less** than Kelvin's [Pethiyagoda et al. 2021]. The outer edge where the water goes flat stays at the Kelvin angle at every Fr [Darmon et al. 2014].
  - Transverse wavelength, from c(λ) = U (Computed): **8 cm at 0.35 m/s, 16 cm at 0.50 m/s, 31 cm at 0.70 m/s**.
  - Draw a **half-angle of 19.5° at the edge**, with the brightest arms a little inside it (about 15°, Estimate) and a train of transverse crests behind the bird.
- **Length and fade.** Damping does not limit it: a 16 cm wave takes about 5 minutes to decay on clean water (Computed). The limit is contrast against the wind ripples. **Visible length about 3 m behind a duck at 0.5 m/s, fading with an e-folding distance of about 1.5 m.** Shorten it by up to 60% in rough water and lengthen it to 5 m in glassy patches (Estimate, no source).

---

## 6. Reflections

### 6.1 Fresnel reflectance of water (n = 1.333), unpolarised

Grazing angle is the angle above the surface. Values are Computed from the Fresnel equations.

| Grazing | 1° | 1.4° (65 m) | 2° | 3° (30 m) | 4° | 6° | 9° (10 m) | 15° | 30° | 60° | 90° |
|---|---|---|---|---|---|---|---|---|---|---|---|
| R (exact) | **0.896** | **0.858** | **0.804** | **0.722** | **0.649** | **0.525** | **0.385** | **0.212** | **0.060** | **0.021** | **0.020** |
| R_s / R_p | 0.92/0.87 | 0.90/0.82 | 0.85/0.76 | 0.79/0.66 | 0.73/0.57 | 0.62/0.43 | 0.49/0.28 | 0.31/0.11 | 0.12/0.00 | 0.03/0.01 | 0.02/0.02 |
| Schlick, F₀ 0.02, power 5 | 0.917 | 0.886 | 0.841 | 0.769 | 0.703 | 0.584 | 0.439 | 0.239 | 0.051 | 0.020 | 0.020 |

Today's shader uses `pow(1 − v·n, 3)` without the 0.02 floor and then mixes `0.35 + 0.55·fres`. Use Schlick with F₀ = 0.02 and power 5 instead: it tracks the exact curve within 0.06 (Computed).

On rippled water at grazing angles, facets tilted away from the eye are hidden and those tilted toward it are seen at steeper angles. So the far water's effective R saturates below the flat-water value (Cox & Munk's shadowing discussion; Estimate: cap at about 0.85).

### 6.2 Streaking and how much the image breaks up

A facet with slope s along the line of sight tilts the reflected ray's elevation by **2s**. A slope across the line of sight turns its azimuth by only about **2s·sin(g)**, where g is the grazing angle (Computed, from reflection geometry). So every reflected feature smears into a **vertical column about 1/sin(g) times taller than it is wide**: 6× at 9°, 19× at 3° and 41× at 1.4°. This is the familiar long, broken column under a lamp or a tree [Minnaert, *Light and Colour in the Open Air*, not re-read].

Slope statistics for a clean sea [Cox & Munk 1954], with U in m/s at 12.5 m:

- upwind: σ²_u = 0.000 + 3.16 × 10⁻³ U
- crosswind: σ²_c = 0.003 + 1.92 × 10⁻³ U
- total: **σ² = 0.003 + 5.12 × 10⁻³ U** (±0.004)
- oil slick, total: σ² = 0.008 + 1.56 × 10⁻³ U

At U = 2.8 m/s this gives a total σ² of 0.0173, an **rms slope of 0.13 rad (7.5°)**, and **0.094 rad along the wind** (Computed). A 60 m lake with 1 cm waves is probably below the open-sea values. I adopt **0.6 × Cox-Munk for the lake's rough patches** (Estimate), about **0.07 rad per axis**.

So in rough water the reflected ray scatters by ±8°, more than the whole 1.4-9° range of grazing angles. **No coherent image of the far bank survives; it becomes vertical smears of sky and tree colour.** In wrinkle-regime calm, the rms height is about 1-10 µm over wavelengths of centimetres [Paquier et al. 2016], so the slope is about **0.001 rad** (Computed, rough). That is a near-perfect mirror. The contrast between the two is the whole look: sharp tree reflections in the lulls and the sheltered strip, streaked colour elsewhere.

### 6.3 Distortion strength in screen space

The mirrored target has the camera's field of view, so the physically right offset in UV is:

```
uvOffset.y = 2 · s_along              / vFOV   (radians)
uvOffset.x = 2 · s_across · sin(g)    / hFOV
```

Here s is the normal's tilt (its xz component) resolved along and across the view. In UV per unit of slope that is **1.9 for the eye (60°), 15 for the binoculars (7.5°) and 57 for the telescope (2°)** (Computed).

With glassy slopes of 0.001 the offsets are 0.002 / 0.015 / 0.057 UV: a sharp image, faintly wobbling through the telescope. With rough slopes of 0.07 they are 0.13 UV for the eye, and far off the target through the optics.

**Recommendation:**

- Scale the offset by `2 / vFOV` so the view-space angle, not the screen fraction, stays constant.
- **Clamp it to ±0.15 UV.**
- Beyond about 0.1 UV, fade toward the sky-gradient fallback, blurred toward the average of sky and tree-line colour (set by eye).

Through the telescope over rough water this gives coloured streaks, not a reflection, and that is correct.

---

## 7. Shorelines

- **Darkening.** Soils and sand darken when wet. With water in place of air around the grains, scattering becomes more forward-directed, so light scatters more times and is absorbed more before it gets out [Twomey et al. 1986]. Total internal reflection in the water film adds to this [Lekner & Dorf 1988]. Visible-band reflectance saturates at low moisture, so the surface is fully dark well before it is saturated [Lobell & Asner 2002]. A loam's albedo fell from **0.30 dry to 0.14 wet** [Idso et al. 1975, via Gascoin et al. 2009], a factor of **0.47**. Adopt **×0.55 for mud**, which is already darker than that loam and dark-toned (Estimate from the 0.47).
- **How high the wet reaches.** Capillary rise after 72 days in samples of 41% porosity [Atterberg, via Terzaghi 1942 and Lohman 1972, Table 1]:
  - **fine gravel (2-5 mm): 2.5 cm**
  - very coarse sand: 6.5 cm; coarse sand: 13.5 cm; medium sand: 24.6 cm; fine sand: 42.8 cm
  - **silt: 105 cm**, and over 200 cm in fine silt (still rising)

  On silty valley mud the surface stays visibly wet well above the water. Evaporation dries its top where the sun reaches it, and in late September the water level is falling, which leaves a band of recently exposed damp mud [AOL: Fern Ridge, summer drawdown]. Wavelets about 1 cm high (section 3.4) wet another 1-2 cm by swash.
  - **Mud: full darkening (×0.55) at the waterline, easing out by 0.10 m above it.** Optionally add a fainter damp band (×0.8) up to 0.25 m (Estimate).
  - **Gravel: ×0.70 over 0.03 m** (capillary rise 2.5 cm plus swash; the darkening factor is an Estimate, since only the stones' surfaces wet).
  - Keep the grass tint out of the wet band.
- **The edge highlight.** The capillary length of water is √(σ/ρg) = **2.7 mm**, and a meniscus against a wetted surface rises at most √2 × that, about **3.8 mm** (Computed; standard capillarity). Waterproof feathers depress it instead. The bright line is sky reflected off the curved meniscus and the wet film. It is **2-5 mm wide in the world**, so at most one pixel through the telescope at 63 m (2 mm per pixel) and sub-pixel otherwise. Render it as about 1 px, or over the last centimetre of depth, broken up by ripple noise (set by eye). On a shore sloping 1:10, 1 cm of depth spans 10 cm horizontally.

---

## 8. Steam fog and valley fog (future round)

- **How common.** At Eugene (1961-90 normals), dense fog occurs on **4.3 days in September and 10.8 in October**, against 0.4-0.9 in summer. Fern Ridge reservoir and the Willamette are "the main source of local fog" [Rockey 1997]. The valley's fog season really begins in October; at PDX, October and November average about 6 fog days each [KOIN, Snippet]. Most valley fog is radiation fog [Mass 2021 blog, Snippet].
- **Steam fog** forms when air is **5-15 °C colder than the water**. The lower end of that range applies when the air is moist and the water fresh. It occurs "in winds from calm to gale" and is 1-1,500 m deep, often in columns or bands [Saunders 1964].
- **The scene's numbers.** Eugene's September normals are a daily minimum of **9.6 °C**, a maximum of 24.6 °C and a mean of 17.1 °C [Rockey 1997].
  - A shallow pond tracks the recent mean air temperature, so it is about **16-17 °C** in late September (Estimate).
  - The dawn gap is about 7-9 °C, enough for **wisps of steam over the water at sunrise on clear, calm mornings**.
  - The sun reaches 24° about **2.3 h after sunrise** at 44.5° N at the equinox (Computed). By then the air has warmed several degrees and the gap is about 3 °C, below the threshold. **Steam fog is essentially gone.**
- **Radiation fog.** Eugene's September fogs needed about 28 "energy units" of net radiation to clear (range 21-42, n = 5), against about 15 in summer [Yee & Bates 1969, Table 8]. That is roughly **2-3 h after sunrise** (Computed, rough, from a linear rise in net radiation). A late-September radiation fog would be lifting or in shreds at the scene's hour.
- **For a future mist round:** low, thin, patchy wisps (0.5-3 m) over the far water and in the sheltered strip, thinning to nothing. A bank of fog would be the wrong hour.

---

## 9. Numbers for the code

| Quantity | Value | Units | Source |
|---|---|---|---|
| Secchi depth adopted | 0.7 (range 0.2-1.1) | m | [AOL], section 2.1 |
| Alpha: `1 − exp(−depth / d)` | d = **0.06** | m | Computed 0.054 [Tyler 1968; Preisendorfer 1986], rounded by eye |
| Depth at which the bed vanishes (alpha ≥ 0.99) | 0.30 | m | Computed |
| Shallow tint `uShallow` | `#5e5c42` | sRGB | set by eye |
| Deep tint `uDeep` | `#2e392d` | sRGB | set by eye |
| Bed transmittance K (R, G, B), path × 1.5 | 2.2, 1.9, 3.4 | m⁻¹ | Estimate around [Poole & Atkins 1929] |
| Wet band, mud: height, darkening | **0.10**, ×**0.55** (optional damp band to 0.25 m, ×0.8) | m, factor | [Idso et al. 1975; Lohman 1972]; heights Estimate |
| Wet band, gravel: height, darkening | **0.03**, ×**0.70** | m, factor | [Lohman 1972] 2.5 cm; factor Estimate |
| Edge line | last 0.01 m of depth, about 1 px | m | Computed meniscus 3.8 mm; set by eye |
| Wind mapping | U₁₀ = 8 × strength, so **2.8** | m/s | Estimate; Beaufort 2 [SPC] |
| Ripple onset (glassy below) | 1.5 | m/s | [Paquier et al. 2016; Donelan & Plant 2009] |
| Ring inner calm edge speed | **0.178** | m/s | Computed; [Le Méhauté 1988] |
| Ring outer (leading-crest) speed | `0.178 + 0.22 · size²`, so 0.20 / 0.23 / 0.26 / 0.29 / 0.40 at size 0.3 / 0.5 / 0.6 / 0.7 / 1.0 | m/s | fitted to the section 4.3 table (Computed speeds, Estimate sizes) |
| Ring crest count | `2 + round(4 · size)` | crests | Estimate |
| Ring life | `2 + 4 · size`, so 3.2 / 4.0 / 4.4 / 4.8 / 6.0 s | s | Estimate |
| Ring max radius | outer speed × life, so 0.63 / 0.93 / 1.13 / 1.37 / 2.39 m | m | Computed |
| Ring amplitude | about `1 / (1 + t / 0.5 s)` × a smooth end at life | | Computed 1/t spreading; shape set by eye |
| Size per event | dabble 0.3; head dip 0.5; heron strike 0.6 and egret 0.5; tip-up, grebe roll or surfacing 0.5-0.7; dive 0.9-1.0; grebe sink 0 | 0..1 | mapped from section 4.3; most match today's values |
| Wake half-angle (outer edge) | **19.47** | ° | Kelvin; [Rabaud & Moisy 2013; Darmon et al. 2014] |
| Wake bright arms | about 15 | ° | Estimate [Pethiyagoda et al. 2021] |
| Wake minimum speed; full by | **0.23**; 0.30 | m/s | [Raphaël & de Gennes 1996; Burghelea & Steinberg 2001] |
| Wake visible length; e-fold | 3 (1.2 rough to 5 glassy); 1.5 | m | Estimate |
| Transverse wake wavelength | `2πU² / g`: 0.08 / 0.16 / 0.31 m at 0.35 / 0.5 / 0.7 m/s | m | Computed |
| Duck swim speeds | 0.35-0.70, preferred 0.50 | m/s | [Prange & Schmidt-Nielsen 1970] |
| Lull patches (glassy): scale, drift, life | 15-40 m, **2.8 m/s** downwind, 10-20 s | | Computed from the gust clock; drift [LiDAR, Snippet] |
| Slicks (glassy streaks): scale, drift | 2-10 m by tens of m, **0.08 m/s** | | Estimate; 3% drift (Wu 1983, Snippet) |
| Calm fraction of open water | 15-25%, plus a 5-15 m strip under the far tree line | | Estimate; shelter [Missouri CfA 2025] |
| Gust-front ω if it is to move at the wind speed | 1.0 (today 2.2) | rad/s | Computed |
| Ripple octave wavelengths | **0.9** (grouping, set by eye), **0.18** (wind-wave peak), **0.06**, **0.017** (capillary) | m | [Hasselmann et al. 1973] Computed; c_min wavelength |
| Octave stretch across the wind | 1.5:1 for 0.18 m, 1.2:1 for 0.06 m, 1:1 for 0.017 m | ratio | [Cox & Munk 1954] 1.34 mean; Estimate |
| Rms slope, rough patch, per axis | 0.07 | rad | 0.6 × [Cox & Munk 1954], Estimate |
| Rms slope, glassy patch | 0.001 | rad | Computed from [Paquier et al. 2016] |
| Fresnel | Schlick F₀ **0.02**, power **5**; exact 0.86 / 0.72 / 0.53 / 0.39 at 1.4 / 3 / 6 / 9° | | Computed |
| Fresnel cap on rough far water | 0.85 | | Estimate |
| Reflection distortion | `uv.y = 2·s_along / vFOV`, `uv.x = 2·s_across·sin(g) / hFOV`; **clamp ±0.15 UV**, fade to fallback past 0.1 | UV per rad | Computed; clamp set by eye |

### Test thresholds

- Alpha from depth: at most 0.6 at the bench (0.045 m), 0.5-0.7 at the shelf's shore edge (0.05 m), at least 0.95 at 0.22 m and at least 0.99 at 0.3 m.
- Wet band: mud at the waterline is 0.50-0.60 of dry mud, and at 0.10 m above it is at least 0.97 of dry. Gravel at the waterline is 0.65-0.75 of dry gravel. Below the water and above the band, `terrainColor` is unchanged.
- Rings: at size 0.5 the outer edge speed is between 0.2 and 0.3 m/s. No ring spreads faster than 0.45 m/s or slower than 0.178 m/s at any size. Life is at most 6 s at size 1, and the max radius at size 1 is 2-3 m. Re-run the ring-budget test at the new life (today's is 2.5 s × size, the new one 3-6 s, so about 2× more rings alive at once).
- Wake: zero below 0.23 m/s, a half-angle of 19.47° ± 0.1° at the edge, and at most 5% of peak at 5 m behind the bird.
- Floaters: every swimmer's cruise speed is within 0.30-0.70 m/s, or below 0.23 m/s for the grebe (which makes no wake).
- Fresnel helper: within 0.06 of the exact table from 1° to 90°, 0.02 at normal incidence and at least 0.85 at 1.4°.
- Reflection offset: at most 0.15 UV at any slope, and for a slope of 0.001 it is below 0.003 UV in the eye view.

---

## 10. Photo references

URLs only. These were not downloaded and must stay out of the repo. I did not open every image, so check the dates and conditions before tracing.

- Fern Ridge Reservoir, Commons category: https://commons.wikimedia.org/wiki/Category:Fern_Ridge_Reservoir
- Sturgeon Lake, Sauvie Island (turbid, shallow): https://commons.wikimedia.org/wiki/Category:Sturgeon_Lake_(Oregon) and https://commons.wikimedia.org/wiki/File:Sturgeon_Lake_(Oregon).jpg
- Smith and Bybee Wetlands: https://commons.wikimedia.org/wiki/Category:Smith_and_Bybee_Wetlands_Natural_Area
- Baskett Slough NWR, including a sunrise over the water: https://commons.wikimedia.org/wiki/Category:Baskett_Slough_National_Wildlife_Refuge and https://commons.wikimedia.org/wiki/File:Baskett_Slough_Sunrise_Danny_Spaulding_(31514314511).jpg
- Ankeny NWR: https://commons.wikimedia.org/wiki/Category:Ankeny_National_Wildlife_Refuge
- William L. Finley NWR: https://commons.wikimedia.org/wiki/Category:William_L._Finley_National_Wildlife_Refuge
- Steam fog on lakes (for the future round): https://commons.wikimedia.org/wiki/Category:Steam_fog
- Cox & Munk's glitter photographs (the streaking): https://userpages.umbc.edu/~martins/phys650/Cox%20and%20Munk%20Glint%20paper.pdf

---

## 11. Open questions and confidence

- **Tints are the weakest numbers:** set by eye from descriptions, with no photo or radiometry of a valley pond in late September. Check them against the Commons photos and adjust.
- **No valley lake has a published late-September Secchi reading that I could find.** The 0.7 m is an interpolation of June, August and October readings from the 1980s and 2007.
- **Calm-patch sizes and fractions, ring lifetimes and crest counts, and wake lengths** have no source. The physics fixes the speeds but not how long a ring or V stays visible against wind ripples.
- **Cox-Munk on a small lake:** open-ocean slopes, scaled by 0.6 by guess. Fetch-limited slope statistics for ponds were not found.
- Not read, cited through others: Kahma & Donelan's full paper (abstract only), Dorman & Mollo-Christensen (abstract only), Idso et al. 1975 (through Gascoin et al.), Wu 1983 (drift current), Minnaert, Olano & Baker.

---

## References

- **[AOL]** Johnson, D. M., R. R. Petersen, D. R. Lycan, J. W. Sweet, M. E. Neuhaus, and A. L. Schaedel. 1985. *Atlas of Oregon Lakes*. Oregon State University Press. Read through the Atlas of Oregon Lakes, Portland State University Center for Lakes and Reservoirs (https://oregonlakesatlas.org; API https://aol-backend.cloud.wdt.pdx.edu/api/lake/{reachcode}/): Fern Ridge Lake (17090003017645; 1985 page and the NLA 2007 summary page), Smith Lake and Bybee Lake (17090012006623, 17090012006624; 1985 page), Sturgeon Lake (17090012000320), Blue Lake, Multnomah Co. (17090012000361).
- **[Garaba et al. 2015]** Garaba, S. P., A. Friedrichs, D. Voß, and O. Zielinski. 2015. Classifying natural waters with the Forel-Ule colour index system. *Int. J. Environ. Res. Public Health* 12: 16096-16109. https://doi.org/10.3390/ijerph121215044 (read via Europe PMC).
- **[Preisendorfer 1986]** Preisendorfer, R. W. 1986. Secchi disk science: visual optics of natural waters. *Limnol. Oceanogr.* 31: 909-926. https://doi.org/10.4319/lo.1986.31.5.0909 . Abstract; Γ = 8.7 and Tyler's constants seen quoted (Snippet).
- **[Tyler 1968]** Tyler, J. E. 1968. The Secchi disc. *Limnol. Oceanogr.* 13: 1-6. Not read; through Preisendorfer 1986.
- **[Poole & Atkins 1929]** Poole, H. H., and W. R. G. Atkins. 1929. Photo-electric measurements of submarine illumination throughout the year. *J. Mar. Biol. Assoc. UK* 16: 297-324. Not read; the Kd = 1.7 / Z_SD rule is standard.
- **[SPC]** NOAA Storm Prediction Center. Beaufort wind force scale. https://www.spc.noaa.gov/faq/tornado/beaufort.html
- **[Paquier et al. 2016]** Paquier, A., F. Moisy, and M. Rabaud. 2016. Viscosity effects in wind wave generation. *Phys. Rev. Fluids* 1: 083901. arXiv:1611.01208 (Table I, Figs. 5-8).
- **[Kahma & Donelan 1988]** Kahma, K. K., and M. A. Donelan. 1988. A laboratory study of the minimum wind speed for wind wave generation. *J. Fluid Mech.* 192: 339-364. https://doi.org/10.1017/S0022112088001892 . Abstract only.
- **[Donelan & Plant 2009]** Donelan, M. A., and W. J. Plant. 2009. A threshold for wind-wave growth. *J. Geophys. Res.* 114: C07012. https://doi.org/10.1029/2008JC005238 . Abstract; thresholds through Paquier et al.
- **[Heiler & Kahma 2015]** Heiler, I., and K. Kahma. 2015. Moving fetch and cat's paws on calm sea surface. *Geophys. Res. Abstracts* 17: EGU2015-13180.
- **[Dorman & Mollo-Christensen 1973]** Dorman, C. E., and E. Mollo-Christensen. 1973. Observation of the structure on moving gust patterns over a water surface ("cat's paws"). *J. Phys. Oceanogr.* 3: 120-132. Abstract only (OpenAlex), with Dorman's 1971 MIT/WHOI thesis abstract.
- **[LiDAR gust study]** LiDAR-based detection of wind gusts: an experimental study of gust propagation speed and impact on wind power ramps. *J. Wind Eng. Ind. Aerodyn.* (2021). Snippet only.
- **[Natural Navigator]** Gooley, T. 2017. Cat's paws on water. https://www.naturalnavigator.com/news/2017/11/cats-paws-on-water/ . Snippet, low trust.
- **[Missouri CfA 2025]** University of Missouri Center for Agroforestry. 2025. *Training Manual for Applied Agroforestry Practices*, ch. 6, Windbreaks. https://centerforagroforestry.org/wp-content/uploads/2025/05/Chapter-6-Windbreaks-Agroforestry-Training-Manual-2025.pdf
- **[Hasselmann et al. 1973]** Hasselmann, K., et al. 1973. Measurements of wind-wave growth and swell decay during the Joint North Sea Wave Project (JONSWAP). *Dtsch. Hydrogr. Z.* A8(12). Standard fetch-limited relations; not re-read.
- **[Kudryavtsev et al. 1999]** Kudryavtsev, V., V. Makin, and B. Chapron. 1999. Coupled sea surface-atmosphere model 2. Spectrum of short wind waves. *J. Geophys. Res.* 104: 7625-7639. https://doi.org/10.1029/1999JC900005 . Abstract.
- **[Le Méhauté 1988]** Le Méhauté, B. 1988. Gravity-capillary rings generated by water drops. *J. Fluid Mech.* 197: 415-427. https://doi.org/10.1017/S0022112088003301 . Abstract.
- **[Raphaël & de Gennes 1996]** Raphaël, E., and P.-G. de Gennes. 1996. Capillary gravity waves caused by a moving disturbance: wave resistance. *Phys. Rev. E* 53: 3448-3455. https://doi.org/10.1103/PhysRevE.53.3448 . Abstract.
- **[Burghelea & Steinberg 2001]** Burghelea, T., and V. Steinberg. 2001. Onset of wave drag due to generation of capillary-gravity waves by a moving object as a critical phenomenon. *Phys. Rev. Lett.* 86: 2557-2560. https://doi.org/10.1103/PhysRevLett.86.2557 . Abstract.
- **[Prange & Schmidt-Nielsen 1970]** Prange, H. D., and K. Schmidt-Nielsen. 1970. The metabolic cost of swimming in ducks. *J. Exp. Biol.* 53: 763-777. https://doi.org/10.1242/jeb.53.3.763 . Abstract.
- **[Rabaud & Moisy 2013]** Rabaud, M., and F. Moisy. 2013. Ship wakes: Kelvin or Mach angle? *Phys. Rev. Lett.* 110: 214503. arXiv:1304.2653.
- **[Moisy & Rabaud 2014]** Moisy, F., and M. Rabaud. 2014. Mach-like capillary-gravity wakes. *Phys. Rev. E* 90: 023009. arXiv:1406.0422 (abstract).
- **[Darmon et al. 2014]** Darmon, A., M. Benzaquen, and E. Raphaël. 2014. Kelvin wake pattern at large Froude numbers. *J. Fluid Mech.* 738: R3. arXiv:1309.6751 (abstract).
- **[Pethiyagoda et al. 2021]** Pethiyagoda, R., T. J. Moroney, C. J. Lustri, and S. W. McCue. 2021. Kelvin wake pattern at small Froude numbers. *J. Fluid Mech.* 915: A126. arXiv:2009.04073 (abstract and introduction).
- **[Cox & Munk 1954]** Cox, C., and W. Munk. 1954. Measurement of the roughness of the sea surface from photographs of the sun's glitter. *J. Opt. Soc. Am.* 44: 838-850. Read: slope regressions (clean and slick), up/crosswind ratio, slick effects.
- **[Minnaert]** Minnaert, M. *Light and Colour in the Open Air* (reflections in rippled water). Not re-read.
- **[Olano & Baker 2010]** Olano, M., and D. Baker. 2010. LEAN mapping. *Proc. ACM I3D 2010*: 181-188. Not re-read.
- **[Twomey et al. 1986]** Twomey, S. A., C. F. Bohren, and J. L. Mergenthaler. 1986. Reflectance and albedo differences between wet and dry surfaces. *Appl. Opt.* 25: 431-437. Abstract.
- **[Lekner & Dorf 1988]** Lekner, J., and M. C. Dorf. 1988. Why some things are darker when wet. *Appl. Opt.* 27: 1278-1280. Abstract.
- **[Lobell & Asner 2002]** Lobell, D. B., and G. P. Asner. 2002. Moisture effects on soil reflectance. *Soil Sci. Soc. Am. J.* 66: 722-727. Abstract.
- **[Idso et al. 1975]** Idso, S. B., R. D. Jackson, R. J. Reginato, B. A. Kimball, and F. S. Nakayama. 1975. The dependence of bare soil albedo on soil water content. *J. Appl. Meteorol.* 14: 109-113. Not read; 0.30 dry and 0.14 wet through **[Gascoin et al. 2009]** Gascoin, S., et al. 2009. Sensitivity of bare soil albedo to surface soil moisture on the moraine of the Zongo glacier (Bolivia). *Geophys. Res. Lett.* 36: L02405 (Snippet).
- **[Lohman 1972]** Lohman, S. W. 1972. *Ground-Water Hydraulics*. USGS Professional Paper 708, Table 1 p. 3 (Atterberg's capillary-rise data, from Terzaghi 1942). https://pubs.usgs.gov/pp/0708/report.pdf
- **[Rockey 1997]** Rockey, C. C. D. 1997. *Climate of Eugene, Oregon*. NOAA Technical Memorandum NWS WR-248, NWS Forecast Office Portland. Local fog sources p. 1; temperature normals and dense-fog days pp. 84-85. https://www.weather.gov/media/wrh/online_publications/TMs/TM-248.pdf
- **[Yee & Bates 1969]** Yee, L., and E. Bates. 1969. *Applications of the Net Radiometer to Short-Range Fog and Stratus Forecasting at Eugene, Oregon*. ESSA Technical Memorandum WBTM WR 46. Section IV, Tables 7-8. https://www.weather.gov/media/wrh/online_publications/TMs/TM-46.pdf
- **[Saunders 1964]** Saunders, P. M. 1964. Sea smoke and steam fog. *Q. J. R. Meteorol. Soc.* 90: 156-165. https://doi.org/10.1002/qj.49709038405 . Abstract.
- **[KOIN]** KOIN 6 News. Fog season has entered the chat. https://www.koin.com/weather/fog-season-has-entered-the-chat-in-portland-oregon/ . Snippet.
- **[Mass 2021 blog]** Mass, C. Why is autumn so foggy in the Pacific Northwest? http://karl.weathertogether.net/2021/10/10/why-is-autumn-so-foggy-in-the-pacific-northwest/ . Snippet.
