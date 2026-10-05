import type { SpeciesSpec } from '../spec'
import type { Layer } from '../detail/spec'

// The three late-September versions share one traced bird and differ in paint (and the drake's curl). Colours are
// the research's words (docs/research/2026-09-25-mallard.md, sections 4 and 9), picked for a field-guide plate from
// the credited photos. Skin t: 0 the back's midline, about 0.2 the top of the side, 0.5 the widest, 0.55-0.6 the
// water along the flank (0.72 at the stern), 1 the belly.

/**
 * The drakes' stern: black above and below back to the tail base, and a narrow whitish band just in front of it where
 * the vermiculated flank ends (on the traced drake, between the grey and the black). The white outer tail feathers are
 * the tail's own paint.
 */
const STERN: Layer[] = [
  { kind: 'stripe', from: { at: 'tailBase', t: 0.3, dx: 9 }, to: { at: 'tailBase', t: 0.66, dx: 4 }, width: 6, color: '#e6e4df', blur: 4, opacity: 0.8 },
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'tailBase' }, color: '#121212', soft: 3 },
]

/**
 * The drakes' flank, white finely vermiculated with dusky so that it reads a cool silvery grey, paler toward the water;
 * the back above it grey-brown under the folded wing; and the mantle a warmer brown where the back meets the neck.
 */
const GREY_BODY: Layer[] = [
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#857868', side: '#c3c1bb', bottom: '#d2d0ca' },
  { kind: 'bars', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0.28, 1] }, color: '#7f7c75', width: 0.3, spacing: 0.9, angle: 80, blur: 0.3, opacity: 0.25 },
  { kind: 'fill', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0, 0.28] }, color: '#9b8f80', soft: 6 },
  { kind: 'bars', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0, 0.28] }, color: '#6f6457', width: 0.3, spacing: 0.9, angle: 80, blur: 0.3, opacity: 0.3 },
  { kind: 'fill', where: { part: 'skin', from: 'breast', to: 'neckBase', band: [0, 0.45] }, color: '#6a5543', soft: 6 },
]

/** A drake's chestnut breast, from the ring down to the water, its rear edge level with the front of the folded wing. */
const CHESTNUT: Layer[] = [
  { kind: 'fill', where: { part: 'skin', from: 'breast', to: 'neckMid', band: [0.33, 1] }, color: '#4e2118', soft: 4 },
]

/**
 * The folded wing as it shows on the water: the pale grey scapulars, finely vermiculated, shading softly to brown along
 * their lower edge where they lie over the flank; the long grey-brown tertials behind, browner on their lower webs; the
 * dark primary tips over the stern.
 */
const DRAKE_WING: Layer[] = [
  { kind: 'fill', where: { part: 'wingFold' }, color: '#b6ada0' },
  { kind: 'bars', where: { part: 'wingFold', s: [0.25, 0.75] }, color: '#857b70', width: 0.3, spacing: 0.9, angle: 80, blur: 0.3, opacity: 0.3 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.25, 0.78], t: [0.68, 1] }, color: '#7d5c43', soft: 4, opacity: 0.85 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.72, 0.9] }, color: '#8e8172', soft: 8 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.74, 0.88], t: [0.58, 1] }, color: '#664a35', soft: 3, opacity: 0.85 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.88, 1] }, color: '#2e2925', soft: 3 },
  // in front of the panel the wing is a line along the mantle into the head's feathers: the mantle's brown
  { kind: 'fill', where: { part: 'wingFold', s: [0, 0.27] }, color: '#6a5543', soft: 3 },
]

/** The spread wing, seen only if it flies: grey-brown, the speculum purplish blue between white bars. */
const SPREAD: Layer[] = [
  { kind: 'fill', where: { part: 'wingSpread' }, color: '#8a7d6c' },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.1, 0.45], t: [0.62, 0.92] }, color: '#3b3f9c', soft: 1.5 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.1, 0.45], t: [0.56, 0.62] }, color: '#f2f0ea', soft: 0.5 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.1, 0.45], t: [0.92, 1] }, color: '#f2f0ea', soft: 0.5 },
  { kind: 'fill', where: { part: 'wingUnder' }, color: '#e6e2da' },
]

/** The drakes' tail: its outer feathers white, the middle ash grey, its root under the black coverts. */
const DRAKE_TAIL: Layer[] = [
  { kind: 'fill', where: { part: 'tail' }, color: '#e7e5df' },
  { kind: 'fill', where: { part: 'tail', t: [0.3, 0.7] }, color: '#a29f98', soft: 3 },
  { kind: 'fill', where: { part: 'tail', s: [0, 0.22] }, color: '#1c1c1c', soft: 4 },
  { kind: 'fill', where: { part: 'tailUnder' }, color: '#e4e1da' },
  { kind: 'fill', where: { part: 'tailUnder', s: [0, 0.22] }, color: '#1c1c1c', soft: 4 },
]

/** The drake's head: metallic green, blackish on the crown, brightest on the cheek; the green runs down the neck to the ring. */
const GREEN_HEAD: Layer[] = [
  { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'billBase' }, color: '#17502a', soft: 1 },
  { kind: 'fill', where: { part: 'skin', from: 'neckBase', to: 'neckMid', band: [0, 0.62] }, color: '#17502a', soft: 1 },
  { kind: 'stripe', from: { at: 'neckBase', t: 0.3, dx: -7 }, to: { at: 'neckBase', t: 0.61, dx: 7.8 }, width: 12, color: '#17502a', blur: 0.5 },
  { kind: 'stripe', from: { at: 'neckBase', t: 0.63, dx: 5 }, to: { at: 'neckMid', t: 1, dx: 1 }, width: 6, color: '#17502a', blur: 0.5 },
  { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'lores', band: [0.3, 0.8] }, color: '#23803a', soft: 4 },
  { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'lores', band: [0, 0.2] }, color: '#0e3120', soft: 2.5 },
]

const MALE: Layer[] = [
  ...GREY_BODY,
  ...STERN,
  ...CHESTNUT,
  // the chestnut's pale autumn fringes, faint
  { kind: 'feathers', where: { part: 'skin', from: 'breast', to: 'neckBase', band: [0.4, 1] }, length: 7, width: 6, center: '#4e2118', edge: '#7a4a38', edgeWidth: 0.6, soft: 3, opacity: 0.3 },
  ...GREEN_HEAD,
  // the ring, from the side of the neck (incomplete behind, under the mantle) round to the throat
  { kind: 'stripe', from: { at: 'neckBase', t: 0.3, dx: -13.5 }, to: { at: 'neckBase', t: 0.61, dx: 1.3 }, width: 2.5, color: '#f2f1ec', blur: 0.4 },
  { kind: 'stripe', from: { at: 'neckBase', t: 0.61, dx: 1.3 }, to: { at: 'neckMid', t: 0.97, dx: -3 }, width: 2.5, color: '#f2f1ec', blur: 0.4 },
  ...DRAKE_WING,
  ...SPREAD,
  ...DRAKE_TAIL,
  { kind: 'fill', where: { part: 'curl' }, color: '#101410' },
  // brilliant lemon yellow to greenish yellow, a little olive at the base; the nail black, with a pale bluish sheen behind it
  { kind: 'fill', where: { part: 'bill' }, color: '#e0bf2e' },
  { kind: 'fill', where: { part: 'bill', s: [0, 0.18] }, color: '#c2b23c', soft: 3, opacity: 0.6 },
  { kind: 'fill', where: { part: 'bill', s: [0.82, 0.9], t: [0, 0.4] }, color: '#a3ab86', soft: 1, opacity: 0.5 },
  { kind: 'fill', where: { part: 'bill', s: [0.9, 1], t: [0, 0.45] }, color: '#1b1a17', soft: 0.5 },
  { kind: 'fill', where: { part: 'legs' }, color: '#e8662a' },
]

/** A drake part-way out of eclipse, as the local birds show it: the body nearly done, the head lagging. */
const MALE_MOULT: Layer[] = [
  ...GREY_BODY,
  // brown scalloped feathers scattered through the grey flank
  { kind: 'feathers', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0.32, 0.8] }, length: 13, width: 10, center: '#8b6c4c', edge: '#c3c1bb', edgeWidth: 3.5, soft: 3, opacity: 0.45 },
  ...STERN,
  ...CHESTNUT,
  // the chestnut mottled with brown, pale-fringed
  { kind: 'feathers', where: { part: 'skin', from: 'breast', to: 'neckMid', band: [0.35, 1] }, length: 9, width: 7, center: '#5c2d1c', edge: '#86664e', edgeWidth: 1.4, soft: 3 },
  // the head speckled grey-brown, a dark crown and line through the eye, green only on the crown and nape
  { kind: 'fill', where: { part: 'skin', from: 'neckBase', to: 'billBase', band: [0, 1] }, color: '#7c6a57', soft: 3 },
  { kind: 'spots', where: { part: 'skin', from: 'neckBase', to: 'billBase' }, color: '#3e3226', size: 0.9, spacing: 1.8, blur: 0.3, soft: 2, opacity: 0.7 },
  { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'lores', band: [0, 0.22] }, color: '#2d2820', soft: 1.5 },
  { kind: 'stripe', from: { at: 'lores', t: 0.45 }, to: { at: 'occiput', t: 0.36, dx: -3 }, width: 2, color: '#3a3026', blur: 0.6 },
  { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'eye', band: [0, 0.2] }, color: '#1d5530', soft: 1.5, opacity: 0.9 },
  ...DRAKE_WING,
  { kind: 'feathers', where: { part: 'wingFold', s: [0.3, 0.74], t: [0, 0.6] }, length: 12, width: 10, center: '#9a8a74', edge: '#c9bda9', edgeWidth: 1.5, soft: 2, opacity: 0.5 },
  ...SPREAD,
  ...DRAKE_TAIL,
  { kind: 'fill', where: { part: 'curl' }, color: '#101410' },
  // yellow to olive-yellow, the nail dark; legs dull orange
  { kind: 'fill', where: { part: 'bill' }, color: '#bfae3c' },
  { kind: 'fill', where: { part: 'bill', s: [0.9, 1], t: [0, 0.45] }, color: '#23211c', soft: 0.5 },
  { kind: 'fill', where: { part: 'legs' }, color: '#c9743a' },
]

/**
 * The adult female, standing in for the juveniles too: warm buff-brown, every feather dark-centred with a broad buff
 * edge, bolder and darker on the back; a buff head finely streaked, with a dark crown and a dark line through the eye;
 * an orange bill with a dark saddle.
 */
const FEMALE: Layer[] = [
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#4e3b2a', side: '#8a6d4e', bottom: '#c8ad86' },
  // flank feathers about 15 mm long: dark centres, broad buff edges
  { kind: 'feathers', where: { part: 'skin', from: 'rear', to: 'breast', band: [0.28, 1] }, length: 17, width: 10, center: '#4a3624', edge: '#c39d6c', edgeWidth: 2.6, soft: 3 },
  { kind: 'streaks', where: { part: 'skin', from: 'rear', to: 'breast', band: [0.3, 0.9] }, color: '#3a2a1c', length: 5, width: 1.2, spacing: 6, jitter: 0.9, blur: 0.5, soft: 3, opacity: 0.35 },
  { kind: 'feathers', where: { part: 'skin', from: 'rear', to: 'breast', band: [0.4, 1] }, length: 12, width: 8, center: '#5a4430', edge: '#d2b07f', edgeWidth: 2.2, soft: 3, opacity: 0.45 },
  // the back and scapular line, darker, the edges narrower and browner
  { kind: 'feathers', where: { part: 'skin', from: 'rump', to: 'neckMid', band: [0, 0.3] }, length: 16, width: 12, center: '#2e2219', edge: '#b08b5f', edgeWidth: 2.2, soft: 3 },
  // the undertail and the tail's whitish outer feathers along the stern
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'rump', band: [0.42, 0.56] }, color: '#e3d8c4', soft: 1.5 },
  { kind: 'streaks', where: { part: 'skin', from: 'rear', to: 'rump', band: [0.56, 1] }, color: '#6e5a44', length: 2, width: 0.6, spacing: 1.8, blur: 0.3, soft: 2, opacity: 0.7 },
  // the breast brown, spotted and streaked darker
  { kind: 'fill', where: { part: 'skin', from: 'breast', to: 'neckMid', band: [0.3, 1] }, color: '#a17f58', soft: 4 },
  { kind: 'spots', where: { part: 'skin', from: 'breast', to: 'neckMid', band: [0.3, 1] }, color: '#4a3422', size: 1.6, spacing: 3, blur: 0.4, soft: 3, opacity: 0.8 },
  // the head: buff streaked brown, a dark crown and a dark line through the eye, paler cheeks, a plain buff throat
  { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'billBase' }, color: '#b29a79', soft: 2 },
  { kind: 'streaks', where: { part: 'skin', from: 'neckMid', to: 'billBase', band: [0, 0.8] }, color: '#5a4630', length: 1.4, width: 0.4, spacing: 1.2, blur: 0.2, soft: 2, opacity: 0.55 },
  { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'lores', band: [0, 0.2] }, color: '#46362a', soft: 2 },
  { kind: 'stripe', from: { at: 'lores', t: 0.28 }, to: { at: 'occiput', t: 0.21, dx: -4 }, width: 1.8, color: '#d4c2a2', blur: 0.8, opacity: 0.6 },
  { kind: 'stripe', from: { at: 'lores', t: 0.39, dx: 4 }, to: { at: 'eye', t: 0.402 }, width: 1.6, color: '#3d2e21', blur: 0.6 },
  { kind: 'stripe', from: { at: 'eye', t: 0.402 }, to: { at: 'occiput', t: 0.34, dx: -6 }, width: 1.6, color: '#3d2e21', blur: 0.6 },
  { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'billBase', band: [0.82, 1] }, color: '#d8c5a0', soft: 2 },
  // the folded wing: dark-centred scapulars, plain grey-brown tertials with paler edges, and only a fleck of the
  // speculum, blue over its rear white bar, at the wing's lower edge (the flank feathers hide the rest)
  { kind: 'fill', where: { part: 'wingFold' }, color: '#6f5e4c' },
  { kind: 'feathers', where: { part: 'wingFold', s: [0.25, 0.74] }, length: 14, width: 11, center: '#3a2b1e', edge: '#bf9e72', edgeWidth: 2.5, soft: 2 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.74, 0.88] }, color: '#6b5b4b', soft: 6 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.74, 0.88], t: [0.85, 1] }, color: '#b59c7a', soft: 1.5 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.88, 1] }, color: '#3a322b', soft: 3 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.58, 0.62], t: [0.78, 0.87] }, color: '#33408a', soft: 0.6 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.58, 0.62], t: [0.87, 0.97] }, color: '#e8e4da', soft: 0.6 },
  ...SPREAD,
  { kind: 'fill', where: { part: 'tail' }, color: '#d9cdb6' },
  { kind: 'fill', where: { part: 'tail', t: [0.3, 0.7] }, color: '#7c6a55', soft: 2 },
  { kind: 'fill', where: { part: 'tail', s: [0, 0.22] }, color: '#5a4836', soft: 4 },
  { kind: 'fill', where: { part: 'tailUnder' }, color: '#e0d6c3' },
  // orange, with a dark saddle on the culmen from a tenth of the way out to four-fifths, deepest (half the side) at
  // 30-60%; dark spots on the basal third; the nail's tip dusky
  { kind: 'fill', where: { part: 'bill' }, color: '#d9862b' },
  { kind: 'fill', where: { part: 'bill', s: [0.1, 0.3], t: [0, 0.26] }, color: '#3a3026', soft: 2 },
  { kind: 'fill', where: { part: 'bill', s: [0.28, 0.6], t: [0, 0.44] }, color: '#3a3026', soft: 2 },
  { kind: 'fill', where: { part: 'bill', s: [0.58, 0.78], t: [0, 0.3] }, color: '#3a3026', soft: 2, opacity: 0.85 },
  { kind: 'spots', where: { part: 'bill', s: [0.05, 0.33], t: [0.3, 0.6] }, color: '#3a3026', size: 1.2, spacing: 3, blur: 0.4, opacity: 0.5 },
  { kind: 'fill', where: { part: 'bill', s: [0.96, 1], t: [0, 0.5] }, color: '#4a3a2c', soft: 0.5 },
  { kind: 'fill', where: { part: 'legs' }, color: '#e0773a' },
]

export const SPEC: SpeciesSpec = {
  code: 'mallar3',
  commonName: 'Mallard',
  length: 0.58,
  body: { length: 1, height: 0.5, width: 0.5 },
  neck: { length: 0.3, thickness: 0.17, angle: 50 },
  head: { size: 0.32 },
  bill: { length: 0.22, thickness: 0.12, shape: 'flat' },
  legs: { length: 0.22, thickness: 0.05 },
  tail: { length: 0.16, angle: 15 },
  wing: { length: 0.6, width: 0.32 },
  posture: 'swimming',
  draft: 0.4,
  plumage: {
    crown: '#1f6b3a', cheek: '#2a7d45', throat: '#f2f2f2', breast: '#5b2f1e', flank: '#b9b3a8',
    back: '#7a6a52', wing: '#8a7d68', speculum: '#2b4fd6', rump: '#2a2a2a', tail: '#3a3a3a',
    bill: '#e2c72e', legs: '#e8722a', eye: '#1a1a1a',
  },
  variants: {
    male: {},
    maleMoult: {
      crown: '#2a5a34', cheek: '#7c6a57', throat: '#8a7560', breast: '#6a3a24', flank: '#aca597',
      bill: '#bfae3c', legs: '#c9743a',
    },
    female: {
      crown: '#5a4a32', cheek: '#b59a6e', throat: '#c9b48c', breast: '#a68b62', flank: '#a68b62',
      back: '#6f5a3c', wing: '#7d684a', rump: '#8a7350', tail: '#c9bb9a', bill: '#d98a2e',
    },
  },
  marks: {
    size: 'a large, heavy dabbling duck, the biggest duck on the lake, sitting long and level',
    bill: 'a long, broad, flat bill: yellow on drakes, olive-yellow on a drake still moulting, orange with a dark saddle on females',
    head: 'drakes: glossy green over a thin white ring; a drake still moulting is speckled brown with green only on the crown and nape; females buff with a dark crown and a dark line through the eye',
    body: 'drakes: chestnut breast, pale grey sides, a black stern over a white-edged tail; a drake in full plumage has black curls above the tail, one still moulting none; females mottled brown with a whitish tail. Upends to feed, tail in the air',
    legs: 'orange feet, seen when it upends',
  },
  wingbeatHz: 6,
  foraging: 'dabbler',
  detail: {
    measurements: {
      length: 0.358, culmen: 0.053, billDepth: 0.0183, billWidth: 0.021,
      tarsus: 0.043, tibia: 0.01, toe: 0.051, wingChord: 0.28, tail: 0.087,
    },
    // traced from Stan Bousson's drake (see sources; 4296 px, facing right) at 0.1058 mm per pixel (the 53 mm culmen,
    // the mean of the sexes, spans 501 px), hip at (1500, 1640). The photo's outline was read by hand. Each station's
    // up, down, and tilt, and the neck and head stations' places, were fitted so that the loft's side view (its own 64
    // rings) covers the outline with the least area between them, the loft never folds, and the eye lands on the
    // photo's eye. Under the water, where no photo shows the hull, the outline is a keel 60 mm down, from where the water
    // meets the stern to where it meets the breast. The neck base sits at the top of the breast's bulge, so the breast
    // is body, not neck. The loft lies within 1 mm of the photo along the crown and the back of the head, and on
    // average within 1.5 mm along the back, the nape, the forehead, the chin, the breast, and the stern; at worst the
    // chin falls 2.6 mm short under the bill, and the rump stands 3 mm above the photo's under the tertials, where the
    // wing covers it. Lofted from 128 rings, that fit folded under the head between its 64: on the throat between the
    // nape and the occiput, and under the eye, where the eye's depth bulged out between the crown's and the lores',
    // inside the turn from the neck into the bill, and showed as a dark pit. The nape-to-lores depths and tilts were
    // refitted to the 64-ring trace's side view (within 33 mm² of it, the eye unmoved) so that no ring folds at 64 to
    // 160 rings
    profile: [
      { label: 'rear',     x: -0.1222, y: 0.0132, up: 0.0010, down: 0.0097, halfWidth: 0.0080 },
      { label: 'rump',     x: -0.0994, y: 0.0101, up: 0.0325, down: 0.0180, halfWidth: 0.0300 },
      { label: 'tailBase', x: -0.0634, y: 0.0000, up: 0.0500, down: 0.0382, halfWidth: 0.0520 },
      { label: 'hip',      x: 0.0000,  y: 0.0000, up: 0.0560, down: 0.0685, halfWidth: 0.0670 },
      { label: 'flank',    x: 0.0529,  y: 0.0000, up: 0.0532, down: 0.0742, halfWidth: 0.0670 },
      { label: 'breast',   x: 0.1011,  y: 0.0040, up: 0.0320, down: 0.0575, halfWidth: 0.0550, tilt: 4 },
      { label: 'neckBase', x: 0.1242,  y: 0.0195, up: 0.0270, down: 0.0410, halfWidth: 0.0340, tilt: 15.5 },
      { label: 'neckMid',  x: 0.1299,  y: 0.0280, up: 0.0328, down: 0.0195, halfWidth: 0.0270, tilt: -10.5 },
      { label: 'nape',     x: 0.1331,  y: 0.0358, up: 0.0290, down: 0.0295, halfWidth: 0.0220, tilt: -7 },
      { label: 'occiput',  x: 0.1344,  y: 0.0381, up: 0.0297, down: 0.0158, halfWidth: 0.0200, tilt: 10.5 },
      { label: 'crown',    x: 0.1407,  y: 0.0423, up: 0.0320, down: 0.0116, halfWidth: 0.0185, tilt: 17 },
      { label: 'eye',      x: 0.1519,  y: 0.0439, up: 0.0263, down: 0.0181, halfWidth: 0.0180, tilt: 2 },
      { label: 'lores',    x: 0.1587,  y: 0.0427, up: 0.0200, down: 0.0141, halfWidth: 0.0140, tilt: -1 },
      { label: 'billBase', x: 0.1659,  y: 0.0383, up: 0.0110, down: 0.0182, halfWidth: 0.0108, tilt: 8 },
    ],
    // twice the default: the head, drawn in on the shoulders, is a sixth of the spine, and needs the rings to stay round
    rings: 128,
    rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
    bill: {
      curve: 0,
      // the nail: the tip drops about a millimetre over the last tenth
      hook: 0.001,
      // broad and flat-topped, the sides squared off: not a round tube
      section: 3,
      // width from the NHMO skin's top view (narrowest at a fifth, widest 58-74% out at 1.07 times the base), depth
      // from three side views (a quarter of the base's at the nail), both scaled to the live birds' base
      profile: [
        [0, 0.99, 1], [0.2, 0.92, 1], [0.3, 0.95, 0.92], [0.4, 1.01, 0.81], [0.5, 1.01, 0.7], [0.58, 1.07, 0.64],
        [0.74, 1.07, 0.51], [0.8, 1.02, 0.42], [0.84, 0.97, 0.37], [0.87, 0.9, 0.33], [0.9, 0.81, 0.25],
        [0.93, 0.67, 0.25], [0.95, 0.61, 0.24], [0.97, 0.48, 0.22], [0.98, 0.4, 0.2], [1, 0.2, 0.15],
      ],
    },
    // the photo's eye: 7 mm across with its rim, the iris dark brown
    eye: { radius: 0.003, t: 0.402, iris: '#3b2415' },
    wing: {
      // the tip on the photo's primary tips over the stern, 62 mm above the water; the chord runs forward level with
      // the top of the tertial panel to a wrist hidden in the head's feathers. In front of 29% of the chord the wing
      // is a line with no height: in life the flank and breast feathers cover it, and the builder's wing only follows
      // the body over the first 60% of the spine, so a panel there would stand off the narrowing breast
      wrist: [0.157, 0.0349], droop: -2.5,
      outline: [
        [0, 0], [0.26, 0], [0.285, 0.025], [0.31, 0.05], [0.36, 0.078], [0.48, 0.09], [0.63, 0.078], [0.75, 0.093], [0.785, 0.1],
        [0.823, 0.073], [0.862, 0.044], [0.9, 0.016], [0.96, 0.006], [1, 0.003],
      ],
    },
    // raised 6.7 degrees above the spine at the tail base, so the tip lands on the photo's, 36 mm above the water; at
    // 0 the tail follows the spine, which runs nearly level there, and its tip would sit 10 mm lower
    tail: { shape: 'rounded', angle: 6.7 },
    feet: 'webbed',
    // the drake's curl: the two central uppertail coverts, loops about 20 mm high on the rump, top 53 mm above the water
    parts: [{ kind: 'curl', at: 'rear', dx: 0.005, height: 0.019, versions: ['male'] }],
    // where the water meets the bird on the photo's midline, at the stern and the breast (y = 1778)
    float: { waterline: -0.0146 },
    plumage: MALE,
    variants: { male: MALE, maleMoult: MALE_MOULT, female: FEMALE },
    sources: [
      'Söderquist et al. 2014, PLOS ONE 9(12) e115143 (culmen, bill width and depth at the nostrils, live wild birds)',
      'Baird, Brewer & Ridgway 1884, Water Birds of North America vol. 1 pp. 489-493 (tarsus, middle toe, wing; plumage)',
      'Tobias et al. 2022, AVONET (tail, bill width and depth)',
      'Johnsgard 1975 p. 222 and Kortright 1942 p. 383 (masses, for the draft by buoyancy); Guillemain et al. 2001 (eye to bill tip)',
      'Phillips 1923, A Natural History of the Ducks vol. 2 pp. 4-5; Kortright 1942 pp. 149-151 (plumages, soft parts, the curl)',
      'Millais 1902 pp. 19-26; Bent 1923 pp. 40-41; Pyle 2005 (the drakes\' moult out of eclipse, the curl\'s regrowth)',
      'bill top view from NHMO-BI-64916/1-P, Natural History Museum, University of Oslo, image 14188762, CC BY 4.0',
      'profile traced from "Drake Mallard (12972875845).jpg", Stan Bousson / USFWS Midwest, public domain, https://commons.wikimedia.org/wiki/File:Drake_Mallard_(12972875845).jpg',
      'female checked against "Stockente (19) (34183721334).jpg" (c) Kathy Büscher, CC BY 2.0, https://commons.wikimedia.org/wiki/File:Stockente_(19)_(34183721334).jpg',
      'female bill and colours from "Stockente (46) (34216838683).jpg" (c) Kathy Büscher, CC BY 2.0, https://commons.wikimedia.org/wiki/File:Stockente_(46)_(34216838683).jpg',
      'bill and head in side view from "Mallard 2025 11 15 03.jpg" (c) Alexis Lours, CC BY 4.0, https://commons.wikimedia.org/wiki/File:Mallard_2025_11_15_03.jpg',
      'the moulting drake from iNaturalist 136360466 (c) Fern Sibley Wexler, CC BY-NC, https://www.inaturalist.org/observations/136360466',
      'the moulting drake afloat from iNaturalist 185373900 (c) Zev D., CC BY-NC, https://www.inaturalist.org/observations/185373900',
      'numbers and marks: docs/research/2026-09-25-mallard.md',
    ],
  },
}
