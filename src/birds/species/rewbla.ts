import type { SpeciesSpec } from '../spec'
import type { Layer } from '../detail/spec'

// The Northwestern Red-wing, A. p. caurinus, in fresh late-September plumage: an adult male, a first-year male and a
// female (docs/research/2026-10-13-red-winged-blackbird.md, section 3.4; colours from its section 4 and the display
// research, docs/research/2026-10-13-blackbird-display-and-reeds.md, section 2.4). One traced bird; the female is the
// male at 0.85 with her own legs. Skin t: 0 the back's midline, 0.5 the widest, 1 the belly. The red and buff of the
// shoulder are painted on the folded wing, where the covering feathers hide them until the pose draws them back.

const BLACK = '#18171b', BLACK_TOP = '#1c1b20', BLACK_BELOW = '#141316'
const RED = '#dc3a1c', RED_SHADE = '#a82a14', BLEND = '#e27030', BUFF = '#d4a064'
const RUSTY = '#6a4226', BUFF_EDGE = '#9c7b52'

/** a chain of stripes through skin points, `width` mm at each */
const chain = (points: { at: string; t: number; dx?: number }[], widths: number[], color: string, blur = 1.5): Layer[] =>
  points.slice(1).map((to, i) => ({ kind: 'stripe', from: points[i]!, to, width: (widths[i]! + widths[i + 1]!) / 2, color, blur }))

/**
 * The shoulder, on the folded wing (s back from the wrist, t down from its top edge): the red lesser coverts a rounded
 * wedge back from the wrist along the wing, the buff median coverts a band across its rear end that spreads along its
 * lower edge at the rear corner, the two blended over 2-3 mm (display research, sections 2.2 and 8.4: red 39 × 19 mm
 * and a buff band 8-11 mm deep; its long axis along the folded wing, the buff at its rear end on the photos of the
 * male in the marsh and the male at rest, where the buff bar is all that shows)
 */
const SHOULDER = (red: string, shade: string, blend: string, buff: string): Layer[] => [
  { kind: 'fill', where: { part: 'wingFold', s: [0, 0.27], t: [0.05, 0.78] }, color: red, soft: 2 },
  { kind: 'gradient', where: { part: 'wingFold', s: [0, 0.27], t: [0.05, 0.78] }, axis: 't', from: 0.05, to: 0.78, colorA: red, colorB: shade, soft: 2, opacity: 0.5 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.25, 0.29], t: [0.06, 0.86] }, color: blend, soft: 1.2 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.27, 0.345], t: [0.06, 0.9] }, color: buff, soft: 1.2 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.18, 0.3], t: [0.74, 0.9] }, color: buff, soft: 1.2 },
]

/** The spread wing the generic flap uses: black, the red and buff at the shoulder along the leading edge. */
const SPREAD = (wing: string, under: string, shoulder: Layer[]): Layer[] => [
  { kind: 'fill', where: { part: 'wingSpread' }, color: wing },
  ...shoulder,
  { kind: 'fill', where: { part: 'wingUnder' }, color: under },
]

/**
 * The covering feathers (the cover over the shoulder, s along the wing, t down it): scapulars above, edged as the back
 * is, and breast-side feathers below; the coverts that rise from the shoulder, their colour shaded down them; and the
 * inside of the mouth
 */
const COVER = (base: string, center: string, edge: string, edgeWidth: number, below: string): Layer[] => [
  { kind: 'fill', where: { part: 'cover' }, color: base },
  { kind: 'fill', where: { part: 'cover', t: [0.55, 1] }, color: below, soft: 3 },
  { kind: 'feathers', where: { part: 'cover', t: [0, 0.6] }, length: 9, width: 8, center, edge, edgeWidth, jitter: 0.6, opacity: 0.9 },
]
const COVERTS = (color: string, shade: string): Layer[] => [
  { kind: 'fill', where: { part: 'coverts' }, color },
  { kind: 'gradient', where: { part: 'coverts' }, axis: 't', from: 0, to: 1, colorA: color, colorB: shade, opacity: 0.55 },
  { kind: 'feathers', where: { part: 'coverts' }, length: 7, width: 6, edge: shade, edgeWidth: 0.8, jitter: 0.5, opacity: 0.6 },
]
const MOUTH: Layer[] = [{ kind: 'fill', where: { part: 'mouth' }, color: '#5b3b3c' }]

/** The adult male: glossy black, fresh rusty and buff edges above, the red shoulder over a deep buff bar. */
const MALE: Layer[] = [
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: BLACK_TOP, side: BLACK, bottom: BLACK_BELOW },
  // a faint blue-green sheen on the head and back
  { kind: 'fill', where: { part: 'skin', from: 'tailBase', to: 'lores', band: [0, 0.38] }, color: '#1d2427', soft: 8, opacity: 0.6 },
  // the back and scapulars narrowly margined rusty, with buff among them (1-2 mm); a few brown tips on the crown and nape
  { kind: 'feathers', where: { part: 'skin', from: 'rump', to: 'neckMid', band: [0, 0.42] }, length: 9, width: 8, center: BLACK, edge: RUSTY, edgeWidth: 0.9, jitter: 0.6, opacity: 0.6 },
  { kind: 'spots', where: { part: 'skin', from: 'vent', to: 'neckMid', band: [0.05, 0.4] }, color: BUFF_EDGE, size: 1.2, spacing: 8, jitter: 0.9, blur: 0.6, opacity: 0.3 },
  { kind: 'spots', where: { part: 'skin', from: 'nape', to: 'lores', band: [0, 0.32] }, color: '#4f3726', size: 1.2, spacing: 4.5, jitter: 0.9, blur: 0.5, opacity: 0.55 },
  // the folded wing: black; the greater coverts and tertials edged rusty and buff (2-3 mm); the primaries black
  { kind: 'fill', where: { part: 'wingFold' }, color: BLACK },
  { kind: 'feathers', where: { part: 'wingFold', s: [0.34, 0.72], t: [0, 0.75] }, length: 16, width: 11, center: BLACK, edge: RUSTY, edgeWidth: 1.6, jitter: 0.4, opacity: 0.65 },
  { kind: 'feathers', where: { part: 'wingFold', s: [0.5, 0.78], t: [0, 0.45] }, length: 20, width: 9, center: BLACK, edge: BUFF_EDGE, edgeWidth: 1.2, jitter: 0.3, opacity: 0.4 },
  ...SHOULDER(RED, RED_SHADE, BLEND, BUFF),
  ...SPREAD(BLACK, '#2a2a2e', [
    { kind: 'fill', where: { part: 'wingSpread', s: [0, 0.3], t: [0, 0.35] }, color: RED, soft: 3 },
    { kind: 'fill', where: { part: 'wingSpread', s: [0, 0.3], t: [0.33, 0.48] }, color: BUFF, soft: 2 },
  ]),
  ...COVER(BLACK, BLACK, RUSTY, 0.9, BLACK),
  ...COVERTS(RED, RED_SHADE),
  ...MOUTH,
  { kind: 'fill', where: { part: 'tail' }, color: '#151417' },
  { kind: 'fill', where: { part: 'tailUnder' }, color: '#121114' },
  { kind: 'fill', where: { part: 'bill' }, color: '#1d1e20' },
  { kind: 'fill', where: { part: 'bill', s: [0, 0.6], t: [0, 0.35] }, color: '#33363a', soft: 4, opacity: 0.6 },
  { kind: 'fill', where: { part: 'legs' }, color: '#1a1a1c' },
]

/**
 * The first-year male: blackish, "much veiled with buffy and ferruginous edgings", palest below; a brown crown and a
 * faint buff eyebrow; the shoulder orange with black bars and spots over buff mottled black.
 */
const FIRST_YEAR: Layer[] = [
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#221b17', side: '#1f1916', bottom: '#2a221c' },
  { kind: 'feathers', where: { part: 'skin', from: 'rear', to: 'neckMid', band: [0, 0.5] }, length: 8, width: 7, center: '#211a16', edge: '#7a4a2a', edgeWidth: 1.3, jitter: 0.6 },
  { kind: 'feathers', where: { part: 'skin', from: 'rear', to: 'neckBase', band: [0.5, 1] }, length: 7, width: 6, center: '#241d18', edge: '#9c7a52', edgeWidth: 1.1, jitter: 0.7, opacity: 0.85 },
  { kind: 'feathers', where: { part: 'skin', from: 'neckBase', to: 'lores', band: [0.45, 1] }, length: 5, width: 5, center: '#231b17', edge: '#8a6a48', edgeWidth: 0.8, jitter: 0.7, opacity: 0.75 },
  // the crown and nape brown, streaked
  { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'lores', band: [0, 0.4] }, color: '#4a3524', soft: 4 },
  { kind: 'streaks', where: { part: 'skin', from: 'neckMid', to: 'lores', band: [0, 0.4] }, color: '#231812', length: 5, width: 0.8, spacing: 2.2, jitter: 0.6, blur: 0.4, opacity: 0.8 },
  ...chain([{ at: 'lores', t: 0.32, dx: 1 }, { at: 'eye', t: 0.3 }, { at: 'occiput', t: 0.34, dx: -2 }], [1.4, 1.8, 1.2], '#9c7a52', 1.2),
  { kind: 'fill', where: { part: 'wingFold' }, color: '#201915' },
  { kind: 'feathers', where: { part: 'wingFold', s: [0.28, 0.75], t: [0, 0.8] }, length: 15, width: 10, center: '#201915', edge: '#93623a', edgeWidth: 2.6, jitter: 0.4 },
  // the shoulder orange, every feather with a black subterminal bar or spot; the buff below mottled black
  ...SHOULDER('#d8691c', '#b4561a', '#d27a32', '#c99556'),
  { kind: 'spots', where: { part: 'wingFold', s: [0, 0.26], t: [0.06, 0.76] }, color: '#1a1412', size: 2.4, spacing: 4.4, jitter: 0.8, blur: 0.6, opacity: 0.85 },
  { kind: 'spots', where: { part: 'wingFold', s: [0.27, 0.345], t: [0.06, 0.9] }, color: '#1f1814', size: 2.2, spacing: 4.2, jitter: 0.9, blur: 0.6, opacity: 0.75 },
  ...SPREAD('#211a16', '#33302c', [
    { kind: 'fill', where: { part: 'wingSpread', s: [0, 0.3], t: [0, 0.35] }, color: '#d8691c', soft: 3 },
    { kind: 'spots', where: { part: 'wingSpread', s: [0, 0.3], t: [0, 0.35] }, color: '#1a1412', size: 2.4, spacing: 4.4, jitter: 0.8, blur: 0.6, opacity: 0.8 },
  ]),
  ...COVER('#211a16', '#211a16', '#8a5530', 1.6, '#2a221c'),
  { kind: 'feathers', where: { part: 'cover', t: [0.55, 1] }, length: 7, width: 6, center: '#241d18', edge: '#b48f60', edgeWidth: 1.4, jitter: 0.7 },
  ...COVERTS('#d8691c', '#b4561a'),
  { kind: 'spots', where: { part: 'coverts' }, color: '#1a1412', size: 2.4, spacing: 4.4, jitter: 0.8, blur: 0.6, opacity: 0.85 },
  ...MOUTH,
  { kind: 'fill', where: { part: 'tail' }, color: '#1d1714' },
  { kind: 'fill', where: { part: 'tailUnder' }, color: '#1a1512' },
  { kind: 'fill', where: { part: 'bill' }, color: '#1f1f21' },
  { kind: 'fill', where: { part: 'legs' }, color: '#1c1b1c' },
]

const F_BROWN = '#3a2a1e', F_DARK = '#2a1e16', F_CHESTNUT = '#6a3a20', F_BUFF = '#b88c5c', F_BELOW = '#d2a676'
const F_STREAK = '#4a2e1a'

/**
 * The female: dark brown above with deep chestnut and buff edges; buff below streaked dark brown (2-3 mm streaks 4-6
 * mm apart), darkest on the belly and flanks; a long buff eyebrow, a dark eye-line and cheek, a pale moustache and a
 * peach-buff throat; two pale wing-bars; a trace of rusty-brown on the shoulder; the lower mandible pale at its base.
 */
const FEMALE: Layer[] = [
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: F_BROWN, side: '#6a4e36', bottom: F_BELOW },
  // the underparts buff, the belly and flanks darker, streaked dark brown
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'eye', band: [0.55, 1] }, color: F_BELOW, soft: 6 },
  { kind: 'gradient', where: { part: 'skin', from: 'rear', to: 'neckBase', band: [0.5, 1] }, axis: 's', from: 0.1, to: 0.6, colorA: '#9e7a56', colorB: F_BELOW, soft: 6, opacity: 0.7 },
  { kind: 'streaks', where: { part: 'skin', from: 'vent', to: 'neckMid', band: [0.48, 1] }, color: F_STREAK, length: 9, width: 2.5, spacing: 5, jitter: 0.6, blur: 0.6 },
  // the upperparts dark brown with chestnut and buff edges
  { kind: 'feathers', where: { part: 'skin', from: 'rear', to: 'nape', band: [0, 0.45] }, length: 8, width: 7, center: F_DARK, edge: F_CHESTNUT, edgeWidth: 1.4, jitter: 0.6 },
  { kind: 'spots', where: { part: 'skin', from: 'rump', to: 'nape', band: [0.02, 0.42] }, color: F_BUFF, size: 1.3, spacing: 6, jitter: 0.9, blur: 0.5, opacity: 0.5 },
  // the crown dark brown, finely streaked
  { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'billBase', band: [0, 0.3] }, color: '#3b2a1e', soft: 3 },
  { kind: 'streaks', where: { part: 'skin', from: 'nape', to: 'lores', band: [0, 0.3] }, color: '#1f150e', length: 4, width: 0.7, spacing: 1.8, jitter: 0.5, blur: 0.4, opacity: 0.8 },
  // the face: a dark cheek and eye-line, the long buff eyebrow above, the pale moustache and dark malar below, a
  // peach-buff throat
  { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'lores', band: [0.32, 0.62] }, color: '#4a3424', soft: 2 },
  ...chain([{ at: 'billBase', t: 0.3 }, { at: 'lores', t: 0.3 }, { at: 'eye', t: 0.27 }, { at: 'crown', t: 0.3 }, { at: 'occiput', t: 0.34 }, { at: 'nape', t: 0.38 }], [2.4, 3, 3.4, 3.2, 2.8, 2.2], '#d3a46c', 0.8),
  ...chain([{ at: 'lores', t: 0.4 }, { at: 'eye', t: 0.4 }, { at: 'crown', t: 0.44 }, { at: 'occiput', t: 0.46 }], [1.4, 1.8, 1.8, 1.4], '#2a1c13', 0.6),
  ...chain([{ at: 'lores', t: 0.7 }, { at: 'eye', t: 0.7 }, { at: 'crown', t: 0.68 }, { at: 'occiput', t: 0.66 }], [2, 2.6, 2.6, 2], '#e0c08e', 0.8),
  ...chain([{ at: 'lores', t: 0.8 }, { at: 'eye', t: 0.8 }, { at: 'crown', t: 0.79 }, { at: 'occiput', t: 0.77 }], [0.8, 1, 1, 0.8], '#3a281b', 0.5),
  { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'billBase', band: [0.84, 1] }, color: '#dca06a', soft: 3 },
  { kind: 'fill', where: { part: 'wingFold' }, color: F_DARK },
  { kind: 'feathers', where: { part: 'wingFold', s: [0.25, 0.78], t: [0, 0.85] }, length: 14, width: 10, center: F_DARK, edge: F_CHESTNUT, edgeWidth: 2.2, jitter: 0.4 },
  // two pale wing-bars: the tips of the median and greater coverts
  { kind: 'fill', where: { part: 'wingFold', s: [0.05, 0.36], t: [0.82, 0.92] }, color: '#cdb08a', soft: 1 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.3, 0.5], t: [0.62, 0.72] }, color: '#c4a47c', soft: 1 },
  // the lesser coverts brownish-grey edged rusty-brown
  { kind: 'fill', where: { part: 'wingFold', s: [0, 0.27], t: [0.05, 0.78] }, color: '#4a3a30', soft: 2 },
  { kind: 'feathers', where: { part: 'wingFold', s: [0, 0.27], t: [0.05, 0.78] }, length: 6, width: 5, center: '#4a3a30', edge: '#6e3822', edgeWidth: 1.4, jitter: 0.5 },
  ...SPREAD(F_DARK, '#5a4a3c', []),
  // her cover reads as her wing's coverts: dark brown, edged chestnut, the median coverts' pale tips along its foot
  ...COVER(F_DARK, F_DARK, F_CHESTNUT, 2, F_DARK),
  { kind: 'feathers', where: { part: 'cover', t: [0.5, 1] }, length: 7, width: 6, center: F_DARK, edge: F_CHESTNUT, edgeWidth: 1.6, jitter: 0.5 },
  { kind: 'fill', where: { part: 'cover', t: [0.9, 1] }, color: '#cdb08a', soft: 1, opacity: 0.8 },
  ...COVERTS('#4a3a30', '#3a2c24'),
  { kind: 'feathers', where: { part: 'coverts' }, length: 6, width: 5, center: '#4a3a30', edge: '#6e3822', edgeWidth: 1.4, jitter: 0.5 },
  ...MOUTH,
  { kind: 'fill', where: { part: 'tail' }, color: '#33251a' },
  { kind: 'bars', where: { part: 'tail', t: [0, 1] }, color: '#4a3524', width: 1, spacing: 6, angle: 0, blur: 1, opacity: 0.3 },
  { kind: 'fill', where: { part: 'tailUnder' }, color: '#4a3a2c' },
  { kind: 'fill', where: { part: 'bill' }, color: '#2a2622' },
  { kind: 'fill', where: { part: 'bill', s: [0, 0.55], t: [0.55, 1] }, color: '#b79771', soft: 3, opacity: 0.9 },
  { kind: 'fill', where: { part: 'legs' }, color: '#3a3330' },
]

export const SPEC: SpeciesSpec = {
  code: 'rewbla',
  commonName: 'Red-winged Blackbird',
  length: 0.214,
  body: { length: 1, height: 0.55, width: 0.45 },
  neck: { length: 0.1, thickness: 0.18, angle: 45 },
  head: { size: 0.32 },
  bill: { length: 0.14, thickness: 0.08, shape: 'pointed' },
  legs: { length: 0.28, thickness: 0.025 },
  tail: { length: 0.35, angle: 5 },
  wing: { length: 0.42, width: 0.22 },
  posture: 'perched',
  draft: 0,
  plumage: {
    crown: '#1b1a1f', cheek: '#18171b', throat: '#18171b', breast: '#18171b', flank: '#18171b',
    back: '#1f1b1b', wing: '#18171b', speculum: null, rump: '#18171b', tail: '#151417',
    bill: '#1d1e20', legs: '#1a1a1c', eye: '#1a120c',
  },
  variants: {
    male: {},
    firstYearMale: { crown: '#4a3524', back: '#3a2a1e', wing: '#2a201a', breast: '#2a221c', flank: '#2a221c', speculum: '#d8691c' },
    female: {
      crown: '#3b2a1e', cheek: '#4a3424', throat: '#dca06a', breast: '#c49a6c', flank: '#8a6a4a',
      back: '#3e2c1f', wing: '#2c2017', rump: '#3e2c1f', tail: '#33251a', bill: '#2a2622', legs: '#3a3330',
    },
  },
  marks: {
    size: 'robin-sized and stocky: the male about 21 cm, the female a sixth smaller and slimmer',
    bill: 'a sharp, slender cone; black on the male, dark above and paler below on the female',
    head: 'the male all black; the female dark brown with a long buff eyebrow, a dark cheek, a pale moustache and a peach or buff throat',
    body: "the male glossy black; at rest his red shoulder is often hidden, leaving only a buff bar on the folded wing; in fresh autumn plumage his back and wing feathers are edged rusty and buff. Young males are browner and speckled, with orange, black-spotted shoulders. Females are dark brown, heavily streaked dark on buff below, edged chestnut above. Clings to upright cattail and reed stems, often swaying; flies in bursts of quick wingbeats. A low 'check'; the male's song a gurgling 'conk-la-ree', the shoulders flared red",
    legs: 'dark legs and long toes gripping an upright stem, often one foot above the other',
  },
  wingbeatHz: 10,
  detail: {
    measurements: {
      length: 0.214, culmen: 0.02, billDepth: 0.011, billWidth: 0.0075,
      tarsus: 0.0295, tibia: 0.005, toe: 0.0218, wingChord: 0.123, tail: 0.092,
    },
    // Traced from macrhybopsis's male at rest on a feeder pole (see sources; 2048 px, facing left, mirrored) at 0.21 mm
    // a pixel (eye to bill tip, 143 px for 30 mm; bill tip to tail tip 992 px, 208 mm). x runs from his feet (pixel 930)
    // and y from the pole's top under them (pixel row 795). The outline was cut from the photo by its colour (the black
    // bird and its grey-violet sheen against the beige wall), the crown, nape and back read by hand where the sheen
    // meets the wall. The spine runs straight through the body at 43° and turns on a short arc into the bill, 16° below
    // level; the neck and head's sections are read between points on the outline, back and throat, so they fan round
    // the throat (their tilts) and never cross. Widths from the front-on male (ben142's, 58-63 mm across the breast
    // fluffed; the head about 0.45 of the body's width)
    profile: [
      { label: 'rear',     x: -0.0546, y: 0.0021, up: 0.0117, down: 0.0074, halfWidth: 0.007 },
      { label: 'rump',     x: -0.0466, y: 0.0095, up: 0.0155, down: 0.0152, halfWidth: 0.013 },
      { label: 'vent',     x: -0.0374, y: 0.0183, up: 0.0173, down: 0.018,  halfWidth: 0.019 },
      { label: 'tailBase', x: -0.0277, y: 0.0275, up: 0.0223, down: 0.0219, halfWidth: 0.022 },
      { label: 'thigh',    x: -0.0202, y: 0.0342, up: 0.026,  down: 0.0413, halfWidth: 0.0245 },
      { label: 'belly',    x: -0.0122, y: 0.0414, up: 0.0315, down: 0.0317, halfWidth: 0.0265 },
      { label: 'hip',      x: -0.0042, y: 0.0487, up: 0.0293, down: 0.0317, halfWidth: 0.0275 },
      { label: 'flank',    x: 0.0025,  y: 0.0552, up: 0.0302, down: 0.0313, halfWidth: 0.0275 },
      { label: 'breast',   x: 0.0092,  y: 0.0619, up: 0.0307, down: 0.0299, halfWidth: 0.027,  tilt: 4 },
      { label: 'neckBase', x: 0.0168,  y: 0.0721, up: 0.0298, down: 0.0269, halfWidth: 0.025,  tilt: 10.1 },
      { label: 'neckMid',  x: 0.0241,  y: 0.083,  up: 0.0192, down: 0.0214, halfWidth: 0.021,  tilt: 7 },
      { label: 'nape',     x: 0.0296,  y: 0.0912, up: 0.0152, down: 0.0199, halfWidth: 0.018,  tilt: 7 },
      { label: 'occiput',  x: 0.0353,  y: 0.0977, up: 0.0113, down: 0.0181, halfWidth: 0.0155, tilt: 8.1 },
      { label: 'crown',    x: 0.0408,  y: 0.1013, up: 0.0116, down: 0.016,  halfWidth: 0.0135, tilt: 18.9 },
      { label: 'eye',      x: 0.0458,  y: 0.1026, up: 0.0112, down: 0.0133, halfWidth: 0.0125, tilt: 30 },
      {                    x: 0.0501,  y: 0.1025, up: 0.0124, down: 0.0102, halfWidth: 0.0115, tilt: 44.1 },
      { label: 'lores',    x: 0.0539,  y: 0.1016, up: 0.0084, down: 0.0068, halfWidth: 0.009,  tilt: 45.9 },
      { label: 'billBase', x: 0.0556,  y: 0.101,  up: 0.005,  down: 0.005,  halfWidth: 0.005,  tilt: 38 },
    ],
    rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
    // a straight, slender cone, the depth falling almost linearly to the tip (research 5.1: taper 0.9-1, no curve)
    bill: { taper: 0.95, curve: 0 },
    // dark brown, 4.5 mm across; its centre 13 mm behind the culmen's base, a third of the way up the eye's section
    eye: { radius: 0.0023, t: 0.39, iris: '#2a1a12' },
    // the folded wing: its wrist under the front of the shoulder patch (photo pixel 910, 390), its 123 mm chord down
    // the back at 54° to a tip about a third of the way along the visible tail; deepest, about a quarter of the chord,
    // over the shoulder and the forward flank (photo)
    wing: {
      wrist: [0.0042, 0.085], droop: 54,
      outline: [[0, 0.06], [0.12, 0.2], [0.3, 0.26], [0.5, 0.22], [0.7, 0.14], [0.88, 0.07], [1, 0.02]],
    },
    // "more or less rounded (sometimes nearly even)" (Ridgway); along the photo's tail, 41° below level; fanned to 110°
    // at tailSpread 1 (display research, section 8.1)
    tail: { shape: 'rounded', angle: 1.5, fan: 110 },
    // its toes take the stems it holds; with none, a stalk of 8 mm under the feet, its top the photo's perch top
    perch: { radius: 0.004, top: 0, stems: true },
    // The song spread (display research, sections 2.2, 3.3 and 8): the shoulder patch on the folded wing, the red
    // forward and the buff at its rear end, under a cover of scapulars and breast-side feathers 1.2 mm off it; the red
    // coverts turned 46 degrees forward and out about their front edge, lifted 8 off the wing, moved 4 mm forward and
    // 2 out and grown a tenth, so side-on the red grows about 1.5 times (1.25-1.6) and front-on each side shows 3-5 cm²
    // (Estimate, shaped to the videos and photos); the feathers fluffed 4.5 mm over the body and 2 over the head at 1;
    // the wings held 35 degrees out at the shoulder and their tips dropped 10, so at a full spread each tip is below the
    // feet and within 20 mm of the fanned tail's outer tips (research 3.3: out 25-35, the tips at the feet or touching
    // the tail's outer tips); the lower mandible dropped 30 degrees (25-35 in the trill)
    display: {
      shoulder: { s: [0, 0.35], t: [0.05, 0.9], margin: 0.06, gap: 0.0012 },
      coverts: { s: [0, 0.26], t: [0.06, 0.76], turn: 46, raise: 8, forward: 0.004, out: 0.002, grow: 1.1 },
      fluff: { body: 0.0045, head: 0.002 },
      hold: { out: 35, droop: 10 },
      gape: 30,
    },
    // the female is the male at 0.85 (research, sections 2.7-2.8: 0.83-0.85 in every length but the legs), with her own
    // tarsus and middle toe (Ridgway's caurinus, 26.9 and 19.1 mm), the visible tibia the male's
    sizes: { female: { scale: 0.85, measurements: { tarsus: 0.0269, toe: 0.0191, tibia: 0.005 } } },
    plumage: MALE,
    variants: { male: MALE, firstYearMale: FIRST_YEAR, female: FEMALE },
    sources: [
      'Ridgway 1902, Birds of North and Middle America part 2 pp. 319-341 (wing, tail, culmen, bill depth, tarsus, middle toe of caurinus by sex; plumages)',
      'van Rossem 1926, Condor 28 (caurinus by sex; the buff median coverts); Tobias et al. 2022, AVONET (bill at the nostril)',
      'profile, eye, folded wing, tail and perch traced from iNaturalist 249411357 (c) macrhybopsis, CC BY-NC, https://www.inaturalist.org/observations/249411357; checked against 137083235 (c) Jeff Harding, CC BY-NC',
      'widths from iNaturalist 407442685 (c) ben142, CC0',
      'numbers, marks and the other reference photos: docs/research/2026-10-13-red-winged-blackbird.md (section 8) and docs/research/2026-10-13-blackbird-display-and-reeds.md (section 7)',
    ],
  },
}
