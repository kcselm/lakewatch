import type { SpeciesSpec } from '../spec'
import type { Layer } from '../detail/spec'

// The adult and the first-autumn juvenile share one traced bird and differ only in paint. Colours are the research's
// words (docs/research/2026-09-25-american-coot.md, sections 4 and 9), picked for a field-guide plate from the
// credited photos. Skin t: 0 the back's midline, about 0.5 the widest, 0.51-0.53 the water along the flank (0.7 at the
// breast), 1 the belly. The black of an adult's neck ends where the neck meets the body.

/** White undertail coverts: a wedge each side under the tail, and right across beneath it (u 0-0.10 on R1). */
const UNDERTAIL: Layer[] = [
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'tailBase', band: [0.46, 1] }, color: '#f3f2ee', soft: 2.5 },
]

/**
 * The tail: dark above; beneath, the white undertail coverts that reach nearly to its tip and flare out either side
 * (the builder spreads the tail as wide as the stern is at the tail base, wider than a coot's closed tail).
 */
const TAIL = (dark: string): Layer[] => [
  { kind: 'fill', where: { part: 'tail' }, color: dark },
  { kind: 'fill', where: { part: 'tailUnder' }, color: '#f3f2ee' },
  { kind: 'fill', where: { part: 'tailUnder', t: [0.3, 0.7], s: [0.8, 1] }, color: dark, soft: 2 },
]

/** The spread wing, seen only if it flies: slate, the secondaries broadly tipped white, a little white at the bend. */
const SPREAD = (slate: string): Layer[] => [
  { kind: 'fill', where: { part: 'wingSpread' }, color: slate },
  { kind: 'fill', where: { part: 'wingSpread', s: [0, 0.45], t: [0.86, 1] }, color: '#eeeeea', soft: 1.5 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0, 0.2], t: [0, 0.08] }, color: '#e6e6e2', soft: 1.5 },
  { kind: 'fill', where: { part: 'wingUnder' }, color: '#8b8e94' },
]

/** The iris, pupil, and catchlight repainted: the painter's own eye takes detail.eye.iris, the adult's red. */
const EYE = (iris: string): Layer[] => [
  { kind: 'fill', where: { part: 'eye', s: [0.07, 0.93], t: [0.07, 0.93] }, color: iris, soft: 0.4 },
  { kind: 'fill', where: { part: 'eye', s: [0.3, 0.7], t: [0.3, 0.7] }, color: '#0d0d0d', soft: 0.35 },
  { kind: 'fill', where: { part: 'eye', s: [0.29, 0.43], t: [0.57, 0.71] }, color: '#f2f2f2', soft: 0.15 },
]

/** The adult: jet-black head and neck over slate; a white bill banded maroon near the tip; a small white shield capped
 * with a dark red-brown callus; a red eye (detail.eye.iris). */
const ADULT: Layer[] = [
  // slate above, a faint olive-brown wash on the back; ashy grey washed slate below
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#56575c', side: '#63676e', bottom: '#80838a' },
  { kind: 'fill', where: { part: 'skin', from: 'rump', to: 'hip', band: [0, 0.3] }, color: '#58534d', soft: 8, opacity: 0.7 },
  // fresh autumn flank and side feathers, their pale grey tips in overlapping scallops
  { kind: 'feathers', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0.24, 0.56] }, length: 12, width: 10, center: '#62666d', edge: '#868990', edgeWidth: 1, soft: 3, opacity: 0.5 },
  // the black hood, down the neck to where it meets the body, the change soft over 10-15 mm
  { kind: 'fill', where: { part: 'skin', from: 'neckBase', to: 'billBase' }, color: '#141518', soft: 10 },
  ...UNDERTAIL,
  // the folded wing: slate, mostly hidden under the scapulars and flank feathers
  { kind: 'fill', where: { part: 'wingFold' }, color: '#5a5b60' },
  { kind: 'fill', where: { part: 'wingFold', s: [0.75, 1] }, color: '#56514b', soft: 2 },
  ...SPREAD('#595c63'),
  // the tail: dark slate-black
  ...TAIL('#1e1f22'),
  // white to ivory; a maroon band 3-8 mm from the tip, clearest below and on the sides; the tip greyish white
  { kind: 'fill', where: { part: 'bill' }, color: '#f1efe7' },
  { kind: 'fill', where: { part: 'bill', s: [0.75, 0.9] }, color: '#5e2b2a', soft: 0.8 },
  { kind: 'fill', where: { part: 'bill', s: [0.75, 0.9], t: [0, 0.18] }, color: '#f1efe7', soft: 0.6, opacity: 0.35 },
  { kind: 'fill', where: { part: 'bill', s: [0.92, 1] }, color: '#dcd9d0', soft: 0.5 },
  // the shield: white, continuous with the bill, capped by the dark red-brown callus, about 4 x 5 mm; the head's skin
  // under the shield's front edge is white too, so no dark seam shows between bill and shield
  { kind: 'fill', where: { part: 'shield' }, color: '#f2f1ea' },
  { kind: 'fill', where: { part: 'skin', from: 'lores', to: 'billBase', band: [0, 0.18] }, color: '#f2f1ea', soft: 0.8 },
  { kind: 'fill', where: { part: 'shield', s: [0.56, 1] }, color: '#5c2319', soft: 0.6 },
  // tarsi and toes greenish yellow, faded in autumn
  { kind: 'fill', where: { part: 'legs' }, color: '#a4ad4e' },
]

/** The first-autumn juvenile (Gullion's 80-100-day bird): a grey-brown head no darker than the body, a whitish throat
 * and foreneck, a dull grey bill without the band, a small pale shield and no callus, a brown eye. */
const JUVENILE: Layer[] = [
  // paler and browner than the adult: ashy olive-brown above, olive-buff grey below with whitish mottling
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#49463f', side: '#5c5953', bottom: '#9d998f' },
  { kind: 'feathers', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0.24, 0.56] }, length: 11, width: 9, center: '#5a5752', edge: '#88847c', edgeWidth: 1.1, soft: 3, opacity: 0.55 },
  { kind: 'spots', where: { part: 'skin', from: 'tailBase', to: 'neckBase', band: [0.55, 1] }, color: '#cfccc4', size: 1.4, spacing: 2.6, blur: 0.4, soft: 3, opacity: 0.6 },
  // the head and neck grey-brown, the crown darker, the feathers frosted with fine pale tips
  { kind: 'fill', where: { part: 'skin', from: 'neckBase', to: 'billBase' }, color: '#4f4d49', soft: 10 },
  { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'billBase', band: [0, 0.22] }, color: '#3a3835', soft: 3 },
  { kind: 'spots', where: { part: 'skin', from: 'neckMid', to: 'billBase', band: [0, 0.7] }, color: '#85827c', size: 0.6, spacing: 1.6, blur: 0.3, soft: 2, opacity: 0.35 },
  // the chin, throat and foreneck whitish grey, mottled
  { kind: 'fill', where: { part: 'skin', from: 'breast', to: 'billBase', band: [0.72, 1] }, color: '#bcb9b1', soft: 4 },
  { kind: 'spots', where: { part: 'skin', from: 'breast', to: 'billBase', band: [0.72, 1] }, color: '#8a867f', size: 0.9, spacing: 2, blur: 0.3, soft: 3, opacity: 0.45 },
  ...UNDERTAIL,
  { kind: 'fill', where: { part: 'wingFold' }, color: '#57534d' },
  ...SPREAD('#59564f'),
  ...TAIL('#2d2b28'),
  // pearl to olive grey, paler toward the tip; no band
  { kind: 'fill', where: { part: 'bill' }, color: '#8e928f' },
  { kind: 'gradient', where: { part: 'bill', s: [0.55, 1] }, axis: 's', from: 0.55, to: 0.95, colorA: '#8e928f', colorB: '#b9b8ae' },
  // a small, flat, pale shield (the shared shield's upper half painted as feathered forehead), no callus
  { kind: 'fill', where: { part: 'shield' }, color: '#a8a39a' },
  { kind: 'fill', where: { part: 'skin', from: 'lores', to: 'billBase', band: [0, 0.18] }, color: '#a8a39a', soft: 0.8 },
  { kind: 'fill', where: { part: 'shield', s: [0.5, 1] }, color: '#46423d', soft: 0.8 },
  { kind: 'fill', where: { part: 'legs' }, color: '#7d8869' },
  ...EYE('#94541f'),
]

export const SPEC: SpeciesSpec = {
  code: 'y00475',
  commonName: 'American Coot',
  length: 0.39,
  body: { length: 1, height: 0.62, width: 0.55 },
  neck: { length: 0.28, thickness: 0.16, angle: 55 },
  head: { size: 0.3 },
  bill: { length: 0.16, thickness: 0.09, shape: 'pointed' },
  legs: { length: 0.3, thickness: 0.05 },
  tail: { length: 0.12, angle: 10 },
  wing: { length: 0.55, width: 0.3 },
  posture: 'swimming',
  draft: 0.45,
  plumage: {
    crown: '#141414', cheek: '#1c1c1c', throat: '#222222', breast: '#2a2a2c', flank: '#2e2e30',
    back: '#1e1e20', wing: '#232325', speculum: null, rump: '#1e1e20', tail: '#1a1a1a',
    bill: '#f4f1e6', legs: '#9aa86a', eye: '#c8202a',
  },
  variants: {
    adult: {},
    juvenile: {
      crown: '#3a3835', cheek: '#4f4d49', throat: '#bcb9b1', breast: '#6a675f', flank: '#5c5953',
      back: '#49463f', wing: '#57534d', rump: '#49463f', tail: '#2d2b28', bill: '#8e928f', legs: '#7d8869', eye: '#94541f',
    },
  },
  marks: {
    size: 'chicken-sized and plump, smaller than a Mallard: a round head on an upright neck, and a low, level back',
    bill: 'adults: a short, pointed white bill with a dark band near the tip, running up the forehead into a small white shield capped with a dark red-brown spot; young birds: a dull grey bill and a small, flat, pale shield',
    head: 'adults: a jet-black head and neck and a red eye; young birds: a grey-brown head with a whitish throat and a brown eye. The head pumps back and forth as it swims',
    body: 'slate grey, with white wedges either side under a short tail; young birds paler and browner. Sometimes dives with a little leap, then bobs back up with weed in its bill',
    legs: 'lobed, not webbed, toes, seen as it leaps into a dive: yellow-green legs on adults, grey-green on young birds',
  },
  wingbeatHz: 5,
  foraging: 'coot',
  detail: {
    measurements: {
      length: 0.298, culmen: 0.0318, billDepth: 0.0155, billWidth: 0.011,
      tarsus: 0.0556, tibia: 0.02, toe: 0.074, wingChord: 0.183, tail: 0.052,
    },
    // Traced from Andy Reago & Chrissy McClarren's October adult (R1, see sources; 2154 px, facing right), scaled by the
    // bill without its shield: the culmen from the tip to where it meets the rising shield, 31.8 mm, is 131 px once the
    // view is allowed for (0.2426 mm per pixel); the shield would make the scale 25-40% wrong. The photo was taken from
    // about 20 degrees above the water, so it is not a side view: the fit compares the loft as that camera saw it (a
    // point H above the water and z toward the camera lands H cos 20 - z sin 20 above the midline water) with the
    // photo's outline above its near-side waterline, and the loft's own side view under the water with a keel. The
    // midline water level is y = 825 (the crown's, bill tip's and shield's reflections; the bow wave lifts the water at
    // the breast front to 808), and the near-side waterline dips 20 mm below it along the flank, which gives the 116 mm
    // beam. Seen from above, the silhouette's top is the far side of a broad back, so the back stands 29 mm above the
    // water at the midline where the research, reading the silhouette, has 35. Under the water, where no photo shows the
    // hull, the keel is 41 mm deep (the research's buoyancy draft is 39-44); the hull then displaces 0.57 L, a little
    // under the 0.64 kg bird, as the Mallard's is. Each station's up, down and tilt, the body's half-widths, and the
    // neck's and head's places were fitted by coordinate descent: the least area between outline and loft, no fold (with
    // 0.08 mm to spare), the eye on the photo's eye, and over the forehead the profile's smooth top (which the shield
    // follows) within 0.4 mm of the loft's chords, so the shield lies on the head.
    // The chin: R1's chin reaches forward under the bill, where the real lower mandible's base runs back toward the
    // gape; the builder's bill is symmetric and has no such base, so a chin traced to R1 jutted out as a lip under the
    // bill with water showing between them. So in the level side view the chin only recedes from the bill base's
    // bottom (nothing in front of it, no notch, no forward bump within 30 mm below it, no see-through gap), and it
    // falls short of R1's chin corner (7.4 and 4.6 mm at the two points under the bill, 0.7 mm by the throat, and 1.6-3.6
    // mm down the foreneck). The head's sections are
    // seeded so their lower ends step in order along the throat to the chin, and no ring bends the surface more than
    // 60 degrees on to the next (an earlier trace folded the throat back on itself under the crown: a visible crease).
    // The loft lies within 0.5 mm of the photo along the back, 0.5 mm over the crown and the back of the head, 1.1 mm
    // down the foreneck and breast (3.6 mm at worst, the throat a little slim), and 0.6 mm along the near-side
    // waterline. The bill's axis runs from half the base depth below the culmen's junction with the shield to the
    // photo's tip (lifted by the curve's 1.3 mm droop), 32.5 degrees down; lores sits on it, 2 mm behind the base, and
    // the base's up is half the bill's depth, so the shield runs straight on from the culmen
    profile: [
      { label: 'rear',       x: -0.10917, y: 0.00387, up: 0.001, down: 0.00325, halfWidth: 0.001 },
      { label: 'rump',       x: -0.09461, y: 0.00645, up: 0.00975, down: 0.011, halfWidth: 0.0255 },
      { label: 'tailBase',   x: -0.06186, y: 0.00129, up: 0.02025, down: 0.02925, halfWidth: 0.0445 },
      { label: 'hip',        x: 0, y: 0, up: 0.0245, down: 0.04225, halfWidth: 0.05625 },
      { label: 'flank',      x: 0.06065, y: 0, up: 0.022, down: 0.041, halfWidth: 0.0545 },
      { label: 'breast',     x: 0.11645, y: 0.0111, up: 0.02225, down: 0.03325, halfWidth: 0.02475, tilt: 15.5 },
      { label: 'neckBase',   x: 0.12688, y: 0.02608, up: 0.021, down: 0.01525, halfWidth: 0.026, tilt: -5.5 },
      { label: 'neckMid',    x: 0.123, y: 0.04673, up: 0.023, down: 0.01275, halfWidth: 0.019, tilt: -18 },
      { label: 'nape',       x: 0.11936, y: 0.07384, up: 0.01847, down: 0.02148, halfWidth: 0.017, tilt: -37.6 },
      { label: 'occiput',    x: 0.12251, y: 0.08649, up: 0.01829, down: 0.02853, halfWidth: 0.016, tilt: -28.6 },
      { label: 'crown',      x: 0.13052, y: 0.09294, up: 0.01741, down: 0.02872, halfWidth: 0.015, tilt: 15.6 },
      { label: 'eye',        x: 0.13998, y: 0.09165, up: 0.0173, down: 0.02351, halfWidth: 0.014, tilt: 29 },
      { label: 'lores',      x: 0.15074, y: 0.08792, up: 0.00925, down: 0.01385, halfWidth: 0.01, tilt: 6 },
      { label: 'billBase',   x: 0.15243, y: 0.08685, up: 0.00775, down: 0.0075, halfWidth: 0.006, tilt: -5 },
    ],
    // the neck joints sit low (at the breast and neck base stations), so the head pump's 5.8 cm thrust and 2.9 cm rise
    // bend the whole upright neck instead of crumpling its top 4 cm
    rig: { neckBase: 'breast', neckMid: 'neckBase', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
    bill: {
      // the tip droops 1.3 mm over the distal half ("gently but very distinctly decurved distally"); depth and width from
      // the research's section 5.2 (the W and C photos: 15.5 mm deep and 11 mm wide at the base, taller than wide beyond)
      curve: -0.04,
      profile: [[0, 1, 1], [0.25, 0.77, 0.82], [0.5, 0.5, 0.68], [0.75, 0.27, 0.43], [0.9, 0.13, 0.22], [1, 0.03, 0.06]],
      // the late-September shield: 9 mm up the forehead (R1's 9.1), 7 mm wide, 2.2 mm thick; the callus is paint
      shield: { length: 0.009, width: 0.007, thickness: 0.0022 },
    },
    // 5.2 mm across; the adult's red (the juvenile repaints its own); t puts it on R1's eye, as the camera saw it
    eye: { radius: 0.0026, t: 0.4, iris: '#d0161f' },
    // the folded wing mostly hidden under the scapulars and flank feathers: its tip under the rear tertials 22 mm above
    // the water, a strip 12 mm deep along the upper flank, its lower edge 11 mm above the water; nothing in front of 30%
    // of the chord, where the breast and flank feathers cover it (the builder's wing follows only the body's rear 60%)
    wing: {
      wrist: [0.117, 0.0213], droop: 0.6,
      outline: [[0, 0], [0.3, 0], [0.36, 0.05], [0.5, 0.065], [0.7, 0.065], [0.85, 0.05], [0.95, 0.02], [1, 0.005]],
    },
    // rooted at the tail base's spine point, 52 mm from the photo's tip, which the spine's own direction there reaches
    tail: { shape: 'rounded', angle: 0.1 },
    feet: 'lobed',
    lobeWidth: 0.01,
    // R1's midline water level (y = 825): the hip's spine point sits 2.6 mm above it
    float: { waterline: -0.0026 },
    plumage: ADULT,
    variants: { adult: ADULT, juvenile: JUVENILE },
    sources: [
      'Ridgway & Friedmann 1941, Birds of North and Middle America part IX, pp. 204-214 (bill proper, shield, wing, tail, tarsus; plumages)',
      'Eddleman & Knopf 1985, J. Field Ornithol. 56: 41-55 (wing, tail, tarsus, middle toe, bill at the feathering, head; ageing)',
      'Gullion 1951, Wilson Bull. 63: 157-166 (the frontal shield and callus); Gullion 1954, Auk 71: 366-412 (the juvenile)',
      'Tobias et al. 2022, AVONET (bill width and depth at the nostril); Bent 1926 (plumages, the jump-dive)',
      'profile traced from "American Coot (23859190368).jpg" (c) Andy Reago & Chrissy McClarren, CC BY 2.0, https://commons.wikimedia.org/wiki/File:American_Coot_(23859190368).jpg',
      'bill and shield from "American Coot - 49064927681.jpg" (c) Wildreturn, CC BY 2.0, https://commons.wikimedia.org/wiki/File:American_Coot_-_49064927681.jpg, and "American Coot (50934459198).jpg" (c) Channel City Camera Club / Susan T. Cook, CC BY 2.0, https://commons.wikimedia.org/wiki/File:American_Coot_(50934459198).jpg',
      'the juvenile from iNaturalist 319709142 (c) Roderick Williams, CC BY-NC, https://www.inaturalist.org/observations/319709142, and iNaturalist 184053560 (c) Sean Haight, CC0, https://www.inaturalist.org/observations/184053560',
      'adult and near-adult side by side from iNaturalist 187927896 (c) John Rakestraw, CC BY-NC, https://www.inaturalist.org/observations/187927896',
      'the height afloat checked on iNaturalist 62162915 (c) Patricia (insectology), CC BY-NC, https://www.inaturalist.org/observations/62162915',
      'the adult afloat, its colours checked, on iNaturalist 336069789 (c) notfresco, CC BY-NC, https://www.inaturalist.org/observations/336069789',
      'a second floating adult from the same session as the traced one, looked at alongside it: "American Coot (37712325421).jpg" (c) Andy Reago & Chrissy McClarren, CC BY 2.0, https://commons.wikimedia.org/wiki/File:American_Coot_(37712325421).jpg',
      'the head, bill and float line seen from near the water, looked at before tracing: iNaturalist 65727964 (c) philkahler, CC BY-NC, https://www.inaturalist.org/observations/65727964',
      'the lobed feet from "ACF0418-crop.jpg" (c) Pat Hansen, CC0, https://commons.wikimedia.org/wiki/File:ACF0418-crop.jpg',
      'numbers and marks: docs/research/2026-09-25-american-coot.md',
    ],
  },
}
