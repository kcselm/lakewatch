import type { SpeciesSpec } from '../spec'
import type { Layer } from '../detail/spec'

// The two late-September versions share one traced bird and differ only in paint: the drake still in eclipse, and the
// female-type (adult females and the young of both sexes). No drake is in breeding plumage before October. Colours are
// the research's words (docs/research/2026-09-25-northern-shoveler.md, sections 4 and 9), picked for a field-guide
// plate from the credited photos. Skin t: 0 the back's midline, about 0.2 the top of the side, 0.5 the widest, 0.55 the
// water along the flank (0.67 at the tail base, 0.82 at the breast), 1 the belly.

/** The spread wing, seen only if it flies: the powder-blue forewing, a white bar, the green speculum. */
const SPREAD = (forewing: string, speculum: string): Layer[] => [
  { kind: 'fill', where: { part: 'wingSpread' }, color: '#6f655b' },
  { kind: 'fill', where: { part: 'wingSpread', s: [0, 0.55], t: [0, 0.45] }, color: forewing, soft: 1.5 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.08, 0.5], t: [0.45, 0.55] }, color: '#efece6', soft: 0.5 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.08, 0.5], t: [0.55, 0.88] }, color: speculum, soft: 1 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.55, 1] }, color: '#4a423c', soft: 2 },
  { kind: 'fill', where: { part: 'wingUnder' }, color: '#dcd8d1' },
]

/**
 * The drake in eclipse: a female-like duck with a plain grey-brown head, a yellow eye and a blackish bill; a dark
 * back; rufous-chestnut flanks with dark scallops, strongest below the folded wing; a pale buff-white rear flank with a
 * whiter patch at its top, in front of the black-edged undertail; a grey-brown breast with bold dark scallops.
 */
const ECLIPSE: Layer[] = [
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#3d3129', side: '#93603d', bottom: '#b09678' },
  // the flanks: rufous-chestnut, each feather dark-centred
  { kind: 'fill', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0.28, 0.9] }, color: '#9b5733', soft: 5 },
  { kind: 'feathers', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0.3, 0.9] }, length: 11, width: 10, center: '#4f2c1b', edge: '#a95f35', edgeWidth: 2.2, soft: 4 },
  // the rear flank pale buff-white, its scallops showing through, and the whiter patch at its top before the stern
  { kind: 'stripe', from: { at: 'tailBase', t: 0.53, dx: -16 }, to: { at: 'tailBase', t: 0.52, dx: 36 }, width: 24, color: '#cabfaa', blur: 12, opacity: 0.8 },
  { kind: 'stripe', from: { at: 'tailBase', t: 0.47, dx: -12 }, to: { at: 'tailBase', t: 0.47, dx: 12 }, width: 14, color: '#e5dfd3', blur: 3 },
  // the stern: blackish undertail coverts with narrow pale edges, a black rump above
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'rump', band: [0.5, 1] }, color: '#2a231d', soft: 3 },
  { kind: 'feathers', where: { part: 'skin', from: 'rear', to: 'rump', band: [0.55, 1] }, length: 6, width: 6, center: '#241d17', edge: '#86725a', edgeWidth: 0.7, soft: 3 },
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'tailBase', band: [0, 0.34] }, color: '#231f1c', soft: 3 },
  // the back and scapulars dark brown, plain-edged, the long scapulars with pale shaft streaks
  { kind: 'fill', where: { part: 'skin', from: 'tailBase', to: 'neckBase', band: [0, 0.28] }, color: '#3a2e25', soft: 4 },
  { kind: 'streaks', where: { part: 'skin', from: 'tailBase', to: 'flank', band: [0.05, 0.28] }, color: '#8c7a64', length: 6, width: 0.6, spacing: 3.2, blur: 0.3, soft: 3, opacity: 0.55 },
  // the breast: grey-brown, bold dark U-shaped centres
  { kind: 'fill', where: { part: 'skin', from: 'flank', to: 'neckBase', band: [0.5, 1] }, color: '#86725e', soft: 4 },
  { kind: 'feathers', where: { part: 'skin', from: 'flank', to: 'neckBase', band: [0.5, 1] }, length: 9, width: 8, center: '#3f3026', edge: '#9d8870', edgeWidth: 1.7, soft: 4 },
  // the head and neck plain grey-brown, finely speckled, darkest on the crown and hindneck
  { kind: 'fill', where: { part: 'skin', from: 'neckBase', to: 'billBase' }, color: '#5d5750', soft: 3 },
  { kind: 'spots', where: { part: 'skin', from: 'neckBase', to: 'billBase' }, color: '#2d2925', size: 0.8, spacing: 1.6, blur: 0.3, soft: 2, opacity: 0.8 },
  { kind: 'spots', where: { part: 'skin', from: 'neckMid', to: 'billBase', band: [0.3, 1] }, color: '#9a9288', size: 0.5, spacing: 2.2, blur: 0.2, soft: 2, opacity: 0.5 },
  { kind: 'fill', where: { part: 'skin', from: 'neckBase', to: 'lores', band: [0, 0.2] }, color: '#302c28', soft: 2 },
  // the folded wing: blackish tertials, green-glossed, each with a white central stripe; the dark primaries
  { kind: 'fill', where: { part: 'wingFold' }, color: '#2a2521' },
  { kind: 'fill', where: { part: 'wingFold', s: [0.5, 0.86], t: [0.45, 0.8] }, color: '#1d2a24', soft: 2, opacity: 0.7 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.5, 0.85], t: [0.38, 0.46] }, color: '#e9e5dd', soft: 1 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.52, 0.86], t: [0.8, 0.88] }, color: '#e9e5dd', soft: 1 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.86, 1] }, color: '#3b3531', soft: 3 },
  ...SPREAD('#9db3c9', '#2f6e4a'),
  // the tail: dusky central feathers, the outer ones white
  { kind: 'fill', where: { part: 'tail' }, color: '#ebe6dd' },
  { kind: 'fill', where: { part: 'tail', t: [0.3, 0.7] }, color: '#5b534c', soft: 2 },
  { kind: 'fill', where: { part: 'tailUnder' }, color: '#e6e0d6' },
  // the bill blackish slate, a dull orange-brown cast at the base and along the lower edges; the nail dark
  { kind: 'fill', where: { part: 'bill' }, color: '#2e2f31' },
  { kind: 'fill', where: { part: 'bill', s: [0, 0.3], t: [0.55, 1] }, color: '#5f412b', soft: 3, opacity: 0.7 },
  { kind: 'fill', where: { part: 'bill', s: [0, 0.7], t: [0.75, 1] }, color: '#4d3a2c', soft: 3, opacity: 0.6 },
  { kind: 'fill', where: { part: 'bill', s: [0.9, 1], t: [0, 0.5] }, color: '#1c1c1c', soft: 0.5 },
  { kind: 'fill', where: { part: 'legs' }, color: '#e8622a' },
]

/**
 * The female, standing in for the young of both sexes: mottled buff-brown with bold dark centres, a plainer
 * greyish-buff head with a dark crown and a dark line through the eye, a dark brown eye, and an orange-sided bill.
 */
const FEMALE: Layer[] = [
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#554536', side: '#8c7862', bottom: '#c2ae93' },
  // bold dark-centred feathers with broad buff fringes, darker above
  { kind: 'feathers', where: { part: 'skin', from: 'rear', to: 'breast', band: [0.28, 1] }, length: 11, width: 9, center: '#46362a', edge: '#bca587', edgeWidth: 2, soft: 3 },
  { kind: 'feathers', where: { part: 'skin', from: 'rump', to: 'neckMid', band: [0, 0.3] }, length: 9, width: 8, center: '#33271e', edge: '#a88f72', edgeWidth: 1.1, soft: 3 },
  // the undertail buff, streaked dusky
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'rump', band: [0.42, 1] }, color: '#b89c78', soft: 2 },
  { kind: 'streaks', where: { part: 'skin', from: 'rear', to: 'rump', band: [0.56, 1] }, color: '#6b5642', length: 2, width: 0.6, spacing: 1.8, blur: 0.3, soft: 2, opacity: 0.7 },
  // the breast buff-brown, spotted and scalloped darker
  { kind: 'fill', where: { part: 'skin', from: 'breast', to: 'neckMid', band: [0.3, 1] }, color: '#9c8469', soft: 4 },
  { kind: 'spots', where: { part: 'skin', from: 'breast', to: 'neckMid', band: [0.3, 1] }, color: '#4a3422', size: 1.4, spacing: 2.6, blur: 0.3, soft: 3 },
  // the head: greyish buff streaked dusky, the crown and a line through the eye darkest, the throat and bill base palest
  { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'billBase' }, color: '#9c8263', soft: 2 },
  { kind: 'streaks', where: { part: 'skin', from: 'neckMid', to: 'billBase', band: [0, 0.85] }, color: '#4a3827', length: 1.4, width: 0.45, spacing: 1.1, blur: 0.2, soft: 2, opacity: 0.8 },
  { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'lores', band: [0, 0.22] }, color: '#3f3127', soft: 1.5 },
  // the line through the eye, read off the photo: from the lores, through the eye, to behind it
  { kind: 'stripe', from: { at: 'lores', t: 0.32, dx: -2.7 }, to: { at: 'eye', t: 0.405 }, width: 2, color: '#3a2c21', blur: 0.6 },
  { kind: 'stripe', from: { at: 'eye', t: 0.405 }, to: { at: 'nape', t: 0.34, dx: 3.4 }, width: 2.2, color: '#3a2c21', blur: 0.6 },
  { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'billBase', band: [0.8, 1] }, color: '#cdb99a', soft: 2 },
  // the dark brown eye, its pupil and catchlight (the painter's own iris is the drake's yellow)
  { kind: 'fill', where: { part: 'eye' }, color: '#3a2416' },
  { kind: 'fill', where: { part: 'eye', s: [0.37, 0.63], t: [0.41, 0.59] }, color: '#0e0c0b', soft: 0.3 },
  { kind: 'fill', where: { part: 'eye', s: [0.41, 0.59], t: [0.37, 0.63] }, color: '#0e0c0b', soft: 0.3 },
  { kind: 'fill', where: { part: 'eye', s: [0.3, 0.42], t: [0.58, 0.7] }, color: '#efefef', soft: 0.2 },
  // the folded wing: dark primaries, and long brownish, olive-washed tertials margined ashy buff
  { kind: 'fill', where: { part: 'wingFold' }, color: '#5d4d3e' },
  { kind: 'feathers', where: { part: 'wingFold', s: [0.45, 0.86] }, length: 14, width: 9, center: '#3b3226', edge: '#c9b48f', edgeWidth: 1.3, soft: 2 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.5, 0.85], t: [0.38, 0.45] }, color: '#d2c3a6', soft: 1, opacity: 0.8 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.52, 0.86], t: [0.8, 0.87] }, color: '#d2c3a6', soft: 1, opacity: 0.8 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.86, 1] }, color: '#3a312b', soft: 3 },
  ...SPREAD('#98a8b6', '#3d6b50'),
  // the tail grey-brown, becoming whiter at the sides
  { kind: 'fill', where: { part: 'tail' }, color: '#dbd0bf' },
  { kind: 'fill', where: { part: 'tail', t: [0.3, 0.7] }, color: '#7a6958', soft: 2 },
  { kind: 'fill', where: { part: 'tailUnder' }, color: '#dbd0bf' },
  // the bill's sides and lower mandible orange, the culmen ridge olive-grey finely spotted black, the nail dusky
  { kind: 'fill', where: { part: 'bill' }, color: '#d9822e' },
  { kind: 'fill', where: { part: 'bill', t: [0, 0.34] }, color: '#6d6852', soft: 2 },
  { kind: 'spots', where: { part: 'bill', s: [0.05, 0.9], t: [0, 0.3] }, color: '#2c2a22', size: 0.9, spacing: 2.6, blur: 0.3, opacity: 0.8 },
  { kind: 'fill', where: { part: 'bill', s: [0.93, 1], t: [0, 0.5] }, color: '#3b342b', soft: 0.5 },
  { kind: 'fill', where: { part: 'legs' }, color: '#e27a35' },
]

export const SPEC: SpeciesSpec = {
  code: 'norsho',
  commonName: 'Northern Shoveler',
  length: 0.48,
  body: { length: 1, height: 0.52, width: 0.5 },
  neck: { length: 0.25, thickness: 0.16, angle: 45 },
  head: { size: 0.3 },
  bill: { length: 0.26, thickness: 0.12, shape: 'flat' },
  legs: { length: 0.24, thickness: 0.045 },
  tail: { length: 0.14, angle: 8 },
  wing: { length: 0.6, width: 0.3 },
  posture: 'swimming',
  draft: 0.45,
  // the drake in eclipse, as every late-September drake is; no green head or white breast before October
  plumage: {
    crown: '#302c28', cheek: '#5d5750', throat: '#6a6259', breast: '#86725e', flank: '#9b5733',
    back: '#3a2e25', wing: '#2a2521', speculum: '#2f6e4a', rump: '#231f1c', tail: '#ebe6dd',
    bill: '#2e2f31', legs: '#e8622a', eye: '#eaae14',
  },
  variants: {
    eclipse: {},
    female: {
      crown: '#3f3127', cheek: '#9c8263', throat: '#cdb99a', breast: '#9c8469', flank: '#8c7862',
      back: '#5a4533', wing: '#5d4d3e', speculum: '#3d6b50', rump: '#6b5642', tail: '#dbd0bf', bill: '#d9822e',
      legs: '#e27a35', eye: '#3a2416',
    },
  },
  marks: {
    size: 'a medium dabbling duck, smaller than a Mallard, sitting low in front with its stern raised',
    bill: 'a huge spoon-shaped bill, longer than the head and broadest near the tip, held angled down at the water: blackish on drakes, orange-sided on females',
    head: 'in late September the drakes are still in eclipse: a plain grey-brown head with a yellow eye; females buff-brown with a dark crown and a dark eye; a short, thick neck',
    body: 'drakes: rufous flanks with dark scallops and a pale patch before the dark stern; females mottled buff-brown. Feeds with the bill skimming the surface film; pairs spin nose to tail',
    legs: 'orange feet, seldom seen: it rarely tips up',
  },
  wingbeatHz: 5.5,
  foraging: 'shoveler',
  detail: {
    measurements: {
      length: 0.3535, culmen: 0.0603, billDepth: 0.021, billWidth: 0.0165,
      tarsus: 0.036, tibia: 0.006, toe: 0.043, wingChord: 0.23, tail: 0.078,
    },
    // traced from Andrew Aldrich's relaxed female (see sources; 2048 px, facing right) at 0.298 mm per pixel (her 62 mm
    // culmen, from the forehead feathering to the nail, spans 207 px), hip at (900, 738). The bill's axis runs from the
    // middle of its 21 mm base to the photo's tip, 60.3 mm (measurements.culmen), 22 degrees below level, the culmen's
    // top edge 33 degrees below. At the mean of the sexes' 64 mm culmen every length would be 3% longer, the bird 365
    // mm bill tip to tail tip, over section 10's 280-360; at her own scale it is 354 mm. The outline was
    // read off the photo's plain water and checked on zoomed crops; under the crossed primaries, where the water shows
    // between them and the rump, the rump was read by hand. Each station's up, down, and tilt, and the neck and head
    // stations' places, were fitted so that the loft's side view (its own 64 rings) covers the outline with the least
    // area between them, the loft never folds, the eye lands on the photo's eye, the bill tip on the photo's, each head
    // ring's top on the crown's line, and the rings' ends through the neck and head run in smooth curves (the head
    // turns sharply on a short neck, and a ring whose end steps in behind its neighbours' creases the cheek and throat
    // though the side view never shows it). Under the water, where no photo shows the hull, the outline is a keel 43 mm
    // down, from where the water meets the stern to where it meets the breast. The occiput sits at the back of the
    // skull, 44 mm behind the bill's base along its axis (the research's 45 mm skull-level head), so the fluffed nape
    // behind it is the nape's ring. The loft lies on average within 0.5-0.6 mm of the photo along the back, the neck
    // and breast, the stern, and the back of the head and neck; 0.3 mm along the crown, 0.2 mm at the forehead, 1.1 mm
    // at the chin and throat (at worst 3 mm short in the corner under the chin), and 1 mm along the rump under the
    // primaries. As on the photo, the mantle stands 40 mm above the water and 13 mm below the top of the back, and the
    // back rises about 6 degrees from the mantle to the tertials (7.8-8.7 on the research's other two photos)
    profile: [
      { label: 'rear',     x: -0.1399, y: 0.0092,  up: 0.0108, down: 0.0158, halfWidth: 0.0100, tilt: -9.5 },
      { label: 'rump',     x: -0.1144, y: 0.0089,  up: 0.0189, down: 0.0195, halfWidth: 0.0320, tilt: 4 },
      { label: 'tailBase', x: -0.0872, y: 0.0049,  up: 0.0330, down: 0.0318, halfWidth: 0.0500 },
      { label: 'hip',      x: 0.0000,  y: 0.0000,  up: 0.0410, down: 0.0545, halfWidth: 0.0600 },
      { label: 'flank',    x: 0.0604,  y: -0.0028, up: 0.0338, down: 0.0440, halfWidth: 0.0580 },
      { label: 'breast',   x: 0.0837,  y: 0.0070,  up: 0.0222, down: 0.0437, halfWidth: 0.0500, tilt: 19 },
      { label: 'neckBase', x: 0.0878,  y: 0.0144,  up: 0.0218, down: 0.0383, halfWidth: 0.0320, tilt: -11 },
      { label: 'neckMid',  x: 0.0868,  y: 0.0370,  up: 0.0263, down: 0.0168, halfWidth: 0.0250, tilt: -26.5 },
      { label: 'nape',     x: 0.0921,  y: 0.0487,  up: 0.0323, down: 0.0270, halfWidth: 0.0220, tilt: -25.5 },
      { label: 'occiput',  x: 0.1010,  y: 0.0566,  up: 0.0300, down: 0.0288, halfWidth: 0.0190, tilt: -12.5 },
      { label: 'crown',    x: 0.1056,  y: 0.0578,  up: 0.0272, down: 0.0261, halfWidth: 0.0180, tilt: 4 },
      { label: 'eye',      x: 0.1109,  y: 0.0577,  up: 0.0250, down: 0.0232, halfWidth: 0.0170, tilt: 12 },
      { label: 'lores',    x: 0.1256,  y: 0.0524,  up: 0.0170, down: 0.0177, halfWidth: 0.0130, tilt: 10 },
      { label: 'billBase', x: 0.1340,  y: 0.0490,  up: 0.0105, down: 0.0120, halfWidth: 0.0084 },
    ],
    rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
    bill: {
      curve: 0,
      // the nail: the tip drops about a millimetre over the last tenth
      hook: 0.001,
      // section 9's table: s along the culmen, and the width and depth in mm, over the base's 16.5 and 21 (four
      // outlines for the width, one of them ruler-scaled; two side views and AVONET for the depth)
      profile: ([
        [0, 16.5, 21], [0.1, 18.0, 20.5], [0.2, 19.5, 19.3], [0.3, 21.2, 17.5], [0.4, 23.3, 16.3], [0.5, 25.4, 15.6],
        [0.6, 27.4, 15.2], [0.7, 28.9, 13.2], [0.75, 29.5, 11.5], [0.8, 28.9, 10], [0.85, 26.8, 8.5], [0.9, 23.6, 7],
        [0.93, 20.7, 6], [0.975, 10.6, 4], [1, 0, 2.5],
      ] as const).map(([s, w, d]): [number, number, number] => [s, w / 16.5, d / 21]),
    },
    // the photo's eye: 5.8 mm across; the painter's iris is the drake's yellow, and the female's layers paint hers dark
    eye: { radius: 0.0029, t: 0.401, iris: '#eaae14' },
    wing: {
      // the tip on the photo's primary tips, high over the rump, 59 mm above the water; the chord runs forward along the
      // top of the primaries and tertials, rising 4.7 degrees to the tip, to a wrist hidden in the neck. The panel is
      // the photo's: the primaries alone behind the tertials' tips, then the two long tertials down to the flank
      // feathers, 33 mm deep. In front of 40% of the chord the wing is a line with no height: in life the scapulars and
      // flank feathers cover it, and the builder's wing only follows the body over the first 60% of the spine
      wrist: [0.0901, 0.0288], droop: -4.7,
      outline: [
        [0, 0], [0.4, 0], [0.45, 0.03], [0.5, 0.1], [0.55, 0.12], [0.65, 0.132], [0.78, 0.144], [0.84, 0.13],
        [0.86, 0.06], [0.9, 0.042], [0.96, 0.02], [1, 0.003],
      ],
    },
    // pointed central feathers; raised 4.7 degrees above the spine at the tail base, so the tip lands on the photo's
    // central feathers, 31 mm above the water
    tail: { shape: 'wedge', angle: 4.7 },
    feet: 'webbed',
    // the undisturbed water, midway between the bird and its reflection (771-781 over the back and the head): y = 777,
    // where the breast and the stern meet it on the midline
    float: { waterline: -0.0116 },
    plumage: FEMALE,
    variants: { eclipse: ECLIPSE },
    sources: [
      'Phillips 1925, A Natural History of the Ducks vol. 3 p. 12; Johnsgard 2010, Waterfowl of North America pp. 289-290 (wing, culmen, tarsus, masses)',
      'Baird, Brewer & Ridgway 1884, The Water Birds of North America vol. 1 pp. 525-527; Kortright 1953 pp. 215-218 (the bill\'s widths, measurements, plumages, soft parts)',
      'Tobias et al. 2022, AVONET (tail, bill width and depth at the nostril)',
      'Bent 1923 pp. 138-140; Millais 1902 pp. 59-69; Pyle 2005; Leukering 2012 (the drakes\' eclipse into October, the female\'s dark eye)',
      'profile traced from iNaturalist 242326959 (c) Andrew Aldrich, CC BY-NC, https://www.inaturalist.org/observations/242326959',
      'the eclipse drake from iNaturalist 402522476 (c) Steve Foss, CC BY-NC, https://www.inaturalist.org/observations/402522476, and iNaturalist 138050612 (c) Patricia, CC BY-NC, https://www.inaturalist.org/observations/138050612',
      'the pair in one light from iNaturalist 244091348 (c) Ilya Burylov, CC BY-NC, https://www.inaturalist.org/observations/244091348',
      'the alert profile from iNaturalist 319457994 (c) chatterton-blue, CC BY-NC, https://www.inaturalist.org/observations/319457994',
      'the bill\'s width from iNaturalist 164545447 (c) Araceli Rodríguez-Casanova, CC BY-NC, https://www.inaturalist.org/observations/164545447, and "BecCanardDontFiltreur.jpg" by Lord Mountbatten, remade by Lamiot, CC BY 3.0, https://commons.wikimedia.org/wiki/File:BecCanardDontFiltreur.jpg',
      'numbers and marks: docs/research/2026-09-25-northern-shoveler.md',
    ],
  },
}
