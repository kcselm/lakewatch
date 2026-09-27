import type { SpeciesSpec } from '../spec'
import type { Layer } from '../detail/spec'

// Two late-September versions share one traced bird and differ only in paint: the drake, already in full breeding
// plumage (93% of the local drakes photographed from 11 September to 12 October), and the female, standing in for the
// juveniles and the few drakes still moulting, which read as females at 15-60 m. Colours are the research's words
// (docs/research/2026-09-25-gadwall.md, sections 4 and 9), picked for a field-guide plate from the credited photos,
// the female's in the flat light of Alexis Lours's November bird. Skin t: 0 the back's midline, about 0.35 the top of
// the flank where the folded wing's lower edge lies, 0.56 the water along the flank (0.6-0.7 at the stern and the
// breast), 1 the belly.

/** The spread wing, seen only if it flies: grey-brown, black greater coverts, and the white inner secondaries. */
const spread = (chestnut: boolean): Layer[] => [
  { kind: 'fill', where: { part: 'wingSpread' }, color: chestnut ? '#6f6a64' : '#6a5e52' },
  ...(chestnut ? [{ kind: 'fill', where: { part: 'wingSpread', s: [0.05, 0.4], t: [0.1, 0.45] }, color: '#7a3a1e', soft: 2 } as Layer] : []),
  { kind: 'fill', where: { part: 'wingSpread', s: [0.05, 0.45], t: [0.45, 0.62] }, color: '#1c1c1d', soft: 1, opacity: chestnut ? 1 : 0.8 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.05, chestnut ? 0.3 : 0.25], t: [0.62, 0.95] }, color: '#f2f0ea', soft: 0.8 },
  { kind: 'fill', where: { part: 'wingUnder' }, color: '#e8e5df' },
]

/**
 * The drake in late September: a slate bill, a plain, finely speckled grey-brown head with a darker crown, a scaled
 * blackish breast, grey sides vermiculated so finely they read as one mid-grey, and a black stern cut off square.
 */
const MALE: Layer[] = [
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#6b635a', side: '#8d8984', bottom: '#d9d5ce' },
  // the sides finely vermiculated grey
  { kind: 'fill', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0.3, 1] }, color: '#8e8a85', soft: 4 },
  { kind: 'bars', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0.3, 0.9] }, color: '#5f5a55', width: 0.35, spacing: 1, angle: 0, blur: 0.3, opacity: 0.35 },
  // the back, where it shows between the folded wings: pale grey under the tertials, grey-brown at the mantle
  { kind: 'fill', where: { part: 'skin', from: 'tailBase', to: 'flank', band: [0, 0.32] }, color: '#aaa298', soft: 4 },
  { kind: 'fill', where: { part: 'skin', from: 'flank', to: 'neckBase', band: [0, 0.32] }, color: '#8a8077', soft: 4 },
  { kind: 'bars', where: { part: 'skin', from: 'flank', to: 'neckBase', band: [0, 0.32] }, color: '#5a524b', width: 0.35, spacing: 1, angle: 0, blur: 0.3, opacity: 0.4 },
  // the long scapulars in front of the folded wing, grey with cinnamon margins
  { kind: 'streaks', where: { part: 'skin', from: 'hip', to: 'mantle', band: [0.08, 0.36] }, color: '#b98556', length: 9, width: 1.3, spacing: 2.6, blur: 0.3, soft: 3, opacity: 0.7 },
  // the breast greyish black, each feather with a whitish crescent: scaled
  { kind: 'fill', where: { part: 'skin', from: 'breast', to: 'neckMid', band: [0.28, 1] }, color: '#4a4441', soft: 4 },
  { kind: 'feathers', where: { part: 'skin', from: 'breast', to: 'neckMid', band: [0.28, 1] }, length: 5, width: 5, center: '#433d3a', edge: '#d8d0c8', edgeWidth: 0.7, soft: 3 },
  // the stern: black above and below, from the tail back to where the grey flank stops square
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'tailBase' }, color: '#161617', soft: 2 },
  // the head: pale grey-brown, speckled dusky, the crown darker; the colour runs down the back of the neck
  { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'billBase' }, color: '#9b8a78', soft: 3 },
  { kind: 'fill', where: { part: 'skin', from: 'neckBase', to: 'neckMid', band: [0, 0.35] }, color: '#8b7c6c', soft: 3 },
  { kind: 'spots', where: { part: 'skin', from: 'neckMid', to: 'billBase' }, color: '#4c4238', size: 0.6, spacing: 1.3, blur: 0.2, soft: 2, opacity: 0.7 },
  { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'lores', band: [0, 0.22] }, color: '#6a5a4c', soft: 2 },
  // the folded wing: long grey scapulars with cinnamon margins in front, the pale silver-grey tertials behind, the
  // white speculum at the rear of the flank with a thin dark edge above (the black coverts barely show on a drake at
  // rest), the dark primary tips
  { kind: 'fill', where: { part: 'wingFold' }, color: '#b5aea5' },
  { kind: 'fill', where: { part: 'wingFold', s: [0.36, 0.56], t: [0, 0.85] }, color: '#9a9189', soft: 2 },
  { kind: 'streaks', where: { part: 'wingFold', s: [0.36, 0.56], t: [0.05, 0.85] }, color: '#b98556', length: 9, width: 1.3, spacing: 2.6, blur: 0.3, opacity: 0.75 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.5, 0.95], t: [0, 0.62] }, color: '#cdc7bf', soft: 3 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.5, 0.62], t: [0.73, 0.78] }, color: '#2a2826', soft: 0.5, opacity: 0.8 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.5, 0.62], t: [0.78, 1] }, color: '#f3f1ec', soft: 1 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.9, 1] }, color: '#3b3733', soft: 3 },
  ...spread(true),
  // the tail brownish grey, narrowly edged whitish; the coverts over and under it are the stern's black
  { kind: 'fill', where: { part: 'tail' }, color: '#8b847c' },
  { kind: 'fill', where: { part: 'tail', t: [0, 0.14] }, color: '#d8d3cb', soft: 1 },
  { kind: 'fill', where: { part: 'tail', t: [0.86, 1] }, color: '#d8d3cb', soft: 1 },
  { kind: 'fill', where: { part: 'tailUnder' }, color: '#7d7770' },
  // bluish black, with a trace of dull orange along the edge at the base; the nail black
  { kind: 'fill', where: { part: 'bill' }, color: '#3a3e44' },
  { kind: 'fill', where: { part: 'bill', s: [0, 0.45], t: [0.72, 1] }, color: '#9a6a3a', soft: 1, opacity: 0.35 },
  { kind: 'fill', where: { part: 'bill', s: [0.9, 1] }, color: '#1e1e20', soft: 0.5 },
  { kind: 'fill', where: { part: 'legs' }, color: '#e6962f' },
]

/**
 * The adult female, standing in for the juveniles: scalloped brown and buff, a buffy head streaked dusky with a darker
 * crown and a faint eye-line, a whitish throat, and the bill that separates her from a female Mallard: a dark grey
 * ridge unbroken from the feathers to the nail over a neat orange side panel, spotted dark along its upper edge.
 */
const FEMALE: Layer[] = [
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#4f3f31', side: '#8f7458', bottom: '#e0d5c2' },
  // dark-centred feathers broadly margined buff, darker over the back
  { kind: 'feathers', where: { part: 'skin', from: 'rear', to: 'breast', band: [0.25, 1] }, length: 11, width: 9, center: '#4b3a2b', edge: '#c8a678', edgeWidth: 1.4, soft: 3 },
  { kind: 'feathers', where: { part: 'skin', from: 'rump', to: 'neckBase', band: [0, 0.3] }, length: 9, width: 8, center: '#3a2d22', edge: '#ad8c63', edgeWidth: 1.2, soft: 3 },
  // the undertail buff, spotted and barred brown
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'rump', band: [0.45, 1] }, color: '#d9cbb3', soft: 2 },
  { kind: 'spots', where: { part: 'skin', from: 'rear', to: 'rump', band: [0.45, 1] }, color: '#5a4634', size: 1.3, spacing: 2.6, blur: 0.3, soft: 2, opacity: 0.8 },
  // the breast brown, its feathers dark-centred and buff-edged, finer than the flank's
  { kind: 'fill', where: { part: 'skin', from: 'breast', to: 'neckMid', band: [0.3, 1] }, color: '#a88a66', soft: 4 },
  { kind: 'feathers', where: { part: 'skin', from: 'breast', to: 'neckMid', band: [0.3, 1] }, length: 6, width: 6, center: '#5d4836', edge: '#c9aa80', edgeWidth: 1.3, soft: 3 },
  // the head pale buffy, streaked dusky, darker on the crown; a faint dark line through the eye; chin and throat whitish
  { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'billBase' }, color: '#a8957c', soft: 3 },
  { kind: 'streaks', where: { part: 'skin', from: 'neckBase', to: 'billBase', band: [0, 0.85] }, color: '#57473a', length: 1.4, width: 0.4, spacing: 1.2, blur: 0.2, soft: 2, opacity: 0.7 },
  { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'lores', band: [0, 0.22] }, color: '#56473a', soft: 1.5 },
  { kind: 'stripe', from: { at: 'billBase', t: 0.5 }, to: { at: 'eye', t: 0.46 }, width: 1.3, color: '#4a3c30', blur: 0.6, opacity: 0.55 },
  { kind: 'stripe', from: { at: 'eye', t: 0.46 }, to: { at: 'occiput', t: 0.42, dx: -3 }, width: 1.3, color: '#4a3c30', blur: 0.6, opacity: 0.55 },
  { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'billBase', band: [0.82, 1] }, color: '#d6c9b3', soft: 2 },
  // the folded wing: dark-centred, buff-edged scapulars, grey-brown tertials with paler tips, the white speculum under
  // the black greater coverts at the rear of the flank, the dark primary tips
  { kind: 'fill', where: { part: 'wingFold' }, color: '#8a7968' },
  { kind: 'feathers', where: { part: 'wingFold', s: [0.36, 0.75] }, length: 12, width: 7, center: '#4a3a2c', edge: '#c3a47a', edgeWidth: 1.4, soft: 2 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.62, 0.93], t: [0, 0.6] }, color: '#9a8b7b', soft: 3 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.86, 0.92], t: [0, 0.6] }, color: '#cdbfa6', soft: 1.5, opacity: 0.7 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.45, 0.62], t: [0.58, 0.72] }, color: '#1d1b1a', soft: 1 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.47, 0.61], t: [0.72, 1] }, color: '#f2f0ea', soft: 1 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.9, 1] }, color: '#3f3831', soft: 3 },
  ...spread(false),
  // the tail dusky, marked buffy at the tips
  { kind: 'fill', where: { part: 'tail' }, color: '#6e5c4a' },
  { kind: 'fill', where: { part: 'tail', s: [0.82, 1] }, color: '#d6c6ad', soft: 1.5, opacity: 0.8 },
  { kind: 'fill', where: { part: 'tailUnder' }, color: '#cdbfa8' },
  // dull orange with the ridge dark grey from the feathers to the nail: over the upper third of the side at the base,
  // widening over the distal third to half the side, the nail and tip all dark; dark spots along the orange's upper
  // edge in the basal two-thirds. On the bill t runs from the culmen (0) to the chin (1), 0.5 at the side's edge
  { kind: 'fill', where: { part: 'bill' }, color: '#d4843a' },
  { kind: 'fill', where: { part: 'bill', s: [0, 0.36], t: [0, 0.34] }, color: '#3a383c', soft: 0.8 },
  { kind: 'fill', where: { part: 'bill', s: [0.34, 0.63], t: [0, 0.38] }, color: '#3a383c', soft: 0.8 },
  { kind: 'fill', where: { part: 'bill', s: [0.61, 0.76], t: [0, 0.44] }, color: '#3a383c', soft: 0.8 },
  { kind: 'fill', where: { part: 'bill', s: [0.74, 0.87], t: [0, 0.52] }, color: '#3a383c', soft: 0.8 },
  { kind: 'fill', where: { part: 'bill', s: [0.85, 1] }, color: '#2e2c2e', soft: 0.8 },
  { kind: 'spots', where: { part: 'bill', s: [0.05, 0.62], t: [0.34, 0.52] }, color: '#2f2a26', size: 1.3, spacing: 2.6, blur: 0.3, opacity: 0.85 },
  { kind: 'fill', where: { part: 'legs' }, color: '#d49a48' },
]

export const SPEC: SpeciesSpec = {
  code: 'gadwal',
  commonName: 'Gadwall',
  length: 0.51,
  body: { length: 1, height: 0.55, width: 0.5 },
  neck: { length: 0.3, thickness: 0.16, angle: 50 },
  head: { size: 0.3 },
  bill: { length: 0.17, thickness: 0.09, shape: 'flat' },
  legs: { length: 0.25, thickness: 0.045 },
  tail: { length: 0.15, angle: 10 },
  wing: { length: 0.6, width: 0.3 },
  posture: 'swimming',
  draft: 0.45,
  plumage: {
    crown: '#4a3f35', cheek: '#6b5f52', throat: '#7a6d5e', breast: '#6e6258', flank: '#7d746a',
    back: '#5e564d', wing: '#6a625a', speculum: '#f2f2ee', rump: '#1a1a1a', tail: '#2a2825',
    bill: '#2b2b2b', legs: '#e0a13a', eye: '#1a1a1a',
  },
  variants: {
    male: {},
    female: {
      crown: '#5a4a36', cheek: '#a08a6a', throat: '#b8a888', breast: '#a4906f', flank: '#9c8767',
      back: '#6e5a42', wing: '#7a6650', rump: '#7a6650', tail: '#6b5a45', bill: '#c9862d',
    },
  },
  marks: {
    size: 'a medium dabbling duck, a tenth smaller than a Mallard, sitting low and flat on the water',
    bill: 'a narrow, parallel-sided bill, shorter than a Mallard\'s: slate on drakes; on females a dark grey ridge unbroken to the tip over a neat orange side panel',
    head: 'a square head with a steep forehead: plain grey-brown and finely speckled on drakes; buffy, streaked, with a darker crown on females',
    body: 'drakes: a finely scaled dark breast, plain grey sides, and a crisp black stern; females scalloped brown and buff. A small white patch in the wing often shows at the rear of the flank. Feeds mostly with the head under water, tipping up less than a Mallard',
    legs: 'orange-yellow feet, seen when it tips up',
  },
  wingbeatHz: 5,
  foraging: 'dabbler',
  detail: {
    measurements: {
      length: 0.312, culmen: 0.041, billDepth: 0.015, billWidth: 0.0165,
      tarsus: 0.039, tibia: 0.004, toe: 0.046, wingChord: 0.257, tail: 0.08,
    },
    // traced from kitsun3's drake (see sources; 2048 px, facing right) at 0.1691 mm per pixel (the 41 mm culmen, the
    // mean of the sexes, spans 243 px from the feathers to the nail's tip), hip at (866, 962). The photo's outline was
    // read by hand. Each section was first laid across the outline as a rib: square to the body, fanning up and back
    // round the nape through the short, drawn-in neck and forward again through the big round head, never crossing;
    // then each station's up, down and tilt were fitted so the loft's side view (its own 64 rings) covers the outline
    // with the least area between them, the loft never folds, the eye lands on the photo's eye, the breast's front on
    // the photo's, and the head's top on the photo's crown. An extra station at the mantle spreads the turn up into
    // the neck, so the back runs on to the nape without a dip. Under the water, where no photo shows the hull, the
    // outline is a keel 55 mm down, from where the water meets the stern to where it meets the breast. The loft lies
    // within 0.5 mm of the photo on average along the back, the back of the head, the chin, and the breast, 0.6 mm at
    // the crown, 0.9 mm at the forehead, and 1.1 mm under the stern; at worst it fills the nape notch 4 mm high, and
    // the rump under the tertials is drawn by hand from the black uppertail coverts to the back
    profile: [
      { label: 'rear',     x: -0.1101, y: 0.0046, up: 0.0067, down: 0.0055, halfWidth: 0.0070 },
      { label: 'rump',     x: -0.0856, y: 0.0024, up: 0.0163, down: 0.0111, halfWidth: 0.0270 },
      { label: 'tailBase', x: -0.0497, y: 0.0000, up: 0.0368, down: 0.0331, halfWidth: 0.0470 },
      { label: 'hip',      x: 0.0000,  y: 0.0000, up: 0.0506, down: 0.0597, halfWidth: 0.0610 },
      { label: 'flank',    x: 0.0450,  y: 0.0003, up: 0.0540, down: 0.0706, halfWidth: 0.0610, tilt: 4.8 },
      { label: 'mantle',   x: 0.0720,  y: 0.0046, up: 0.0531, down: 0.0693, halfWidth: 0.0570, tilt: 8.8 },
      { label: 'breast',   x: 0.0911,  y: 0.0139, up: 0.0512, down: 0.0666, halfWidth: 0.0500, tilt: 11.7 },
      { label: 'neckBase', x: 0.1030,  y: 0.0265, up: 0.0493, down: 0.0583, halfWidth: 0.0310, tilt: 2.7 },
      { label: 'neckMid',  x: 0.1072,  y: 0.0358, up: 0.0328, down: 0.0247, halfWidth: 0.0245, tilt: -2.9 },
      { label: 'nape',     x: 0.1097,  y: 0.0433, up: 0.0348, down: 0.0285, halfWidth: 0.0200, tilt: -7.6 },
      { label: 'occiput',  x: 0.1123,  y: 0.0477, up: 0.0370, down: 0.0315, halfWidth: 0.0185, tilt: 6.1 },
      { label: 'crown',    x: 0.1199,  y: 0.0528, up: 0.0370, down: 0.0206, halfWidth: 0.0175, tilt: 29.4 },
      { label: 'eye',      x: 0.1309,  y: 0.0519, up: 0.0378, down: 0.0162, halfWidth: 0.0170, tilt: 38.8 },
      { label: 'lores',    x: 0.1439,  y: 0.0455, up: 0.0178, down: 0.0154, halfWidth: 0.0130, tilt: 16.3 },
      { label: 'billBase', x: 0.1493,  y: 0.0419, up: 0.0078, down: 0.0078, halfWidth: 0.0090, tilt: 0.3 },
    ],
    rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
    bill: {
      // the culmen gently concave in the middle, straight before and behind; the small nail hooks down at the tip
      curve: 0,
      hook: 0.0012,
      // width from the NHMO skin's top view (parallel-sided within 1-2% from the base to 13 mm behind the tip, widest
      // 55-60% out, then a round tip: 0.66 of full width 7% of the culmen behind it); depth from the traced drake,
      // falling fast over the concave base, then slowly to about half the base's behind the nail
      profile: [
        [0, 1, 1], [0.1, 1, 0.93], [0.2, 1, 0.84], [0.3, 1.005, 0.76], [0.4, 1.01, 0.71], [0.57, 1.015, 0.64],
        [0.66, 1.005, 0.62], [0.72, 0.985, 0.6], [0.76, 0.955, 0.58], [0.8, 0.925, 0.56], [0.84, 0.875, 0.52],
        [0.88, 0.79, 0.46], [0.93, 0.66, 0.38], [0.97, 0.45, 0.3], [1, 0.2, 0.15],
      ],
    },
    // the photo's eye: 7 mm across with its rim, 26.5 mm from the culmen's base; the iris dark brown
    eye: { radius: 0.0033, t: 0.46, iris: '#3b2415' },
    wing: {
      // the tip on the photo's primary tips, 43 mm above the water; the chord runs forward along the top of the
      // tertials and scapulars to a wrist hidden in the head's feathers. The January drake's long alternate tertials
      // stand up to 10 mm above the chord over the stern; a late-September drake still carries the shorter basic ones,
      // so the wing is not built to them. In front of 36% of the chord the wing is a line with no height: there the
      // chord runs above the back, the scapulars (painted on the skin) and the breast and flank feathers cover the
      // wing, and the builder's wing follows the body only over the first 60% of the spine
      wrist: [0.1255, 0.0684], droop: 9,
      outline: [[0, 0], [0.36, 0], [0.4, 0.09], [0.46, 0.11], [0.55, 0.11], [0.67, 0.08], [0.8, 0.058], [0.9, 0.03], [0.96, 0.01], [1, 0.003]],
    },
    // a pointed, wedge-shaped tail, raised 3.1 degrees above the spine at the tail base so the tip lands on the photo's,
    // 21.5 mm above the water
    tail: { shape: 'wedge', angle: 3.1 },
    feet: 'webbed',
    // where the water meets the bird on the photo's midline, at the stern and the breast (y = 1048)
    float: { waterline: -0.0145 },
    plumage: FEMALE,
    variants: { male: MALE },
    sources: [
      'Ridgway 1887, A Manual of North American Birds pp. 94-95, and Baird, Brewer & Ridgway 1884, Water Birds of North America vol. 1 p. 507 (culmen, bill width, tarsus, middle toe, wing)',
      'Phillips 1923, A Natural History of the Ducks vol. 2 pp. 139-140 (measurements, plumages)',
      'Tobias et al. 2022, AVONET (bill width and depth at the nostril, tail)',
      'Kortright 1942 pp. 175-177 and p. 383 (plumages, soft parts, masses for the draft by buoyancy); Oring 1968, The Auk 85: 355-380 (moults, bill and feet)',
      'Kaufman 2020, Identifying Gadwall, BirdWatching (the female\'s bill, the speculum, the forehead)',
      'bill top view from NHMO-BI-64976/1-P, Natural History Museum, University of Oslo, CC BY',
      'profile traced from iNaturalist 260052279 (photo 466938296) (c) kitsun3 (Jake Szapiro), CC BY-NC, https://www.inaturalist.org/observations/260052279',
      'female checked against iNaturalist 293519344 (photo 528298088) (c) Andrea Carpio, CC BY-NC, https://www.inaturalist.org/observations/293519344',
      'female plumage, bill and speculum from iNaturalist 327644138 (photo 593618582) (c) Alexis Lours, CC BY, https://www.inaturalist.org/observations/327644138',
      'the late-September drake from iNaturalist 402482832 (photo 738866996) (c) John Sullivan, CC BY-NC, https://www.inaturalist.org/observations/402482832',
      'the October drake and female from iNaturalist 62161070 and 62160988 (c) Patricia (insectology), CC BY-NC, https://www.inaturalist.org/observations/62161070',
      'numbers and marks: docs/research/2026-09-25-gadwall.md',
    ],
  },
}
