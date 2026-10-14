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
 * the back above it the scapulars' pale vermiculated grey, as the folded wing's panel is (the wing lies on the side of
 * the back, its top edge about a fifth of the way down the skin, and the two read as one panel from the side), darker
 * grey-brown only along the midline; and the mantle a warmer brown where the back meets the neck.
 */
const GREY_BODY: Layer[] = [
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#857868', side: '#c3c1bb', bottom: '#d2d0ca' },
  { kind: 'bars', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0.28, 1] }, color: '#7f7c75', width: 0.3, spacing: 0.9, angle: 80, blur: 0.3, opacity: 0.25 },
  { kind: 'fill', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0, 0.3] }, color: '#b2a99b', soft: 6 },
  { kind: 'fill', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0, 0.07] }, color: '#857868', soft: 4 },
  { kind: 'bars', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0, 0.3] }, color: '#857b70', width: 0.3, spacing: 0.9, angle: 80, blur: 0.3, opacity: 0.3 },
  { kind: 'fill', where: { part: 'skin', from: 'breast', to: 'neckBase', band: [0, 0.45] }, color: '#6a5543', soft: 6 },
]

/** A drake's chestnut breast, from the ring down to the water, its rear edge level with the front of the folded wing. */
const CHESTNUT: Layer[] = [
  { kind: 'fill', where: { part: 'skin', from: 'breast', to: 'neckMid', band: [0.33, 1] }, color: '#4e2118', soft: 4 },
]

/**
 * The folded wing as it shows on the water: the pale grey scapulars, finely vermiculated, shading softly to chestnut-brown
 * toward their lower edge, where the flank's grey feathers lie over them (so no line shows where the wing ends); the long
 * grey-brown tertials behind, browner on their lower webs; the dark primary tips over the stern.
 */
const DRAKE_WING: Layer[] = [
  { kind: 'fill', where: { part: 'wingFold' }, color: '#b6ada0' },
  { kind: 'bars', where: { part: 'wingFold', s: [0.3, 0.75] }, color: '#857b70', width: 0.3, spacing: 0.9, angle: 80, blur: 0.3, opacity: 0.3 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.36, 0.78], t: [0.5, 0.88] }, color: '#7d5c43', soft: 5, opacity: 0.75 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.34, 0.76], t: [0.88, 1] }, color: '#c3c1bb', soft: 1.5 },
  { kind: 'bars', where: { part: 'wingFold', s: [0.34, 0.76], t: [0.88, 1] }, color: '#7f7c75', width: 0.3, spacing: 0.9, angle: 80, blur: 0.3, opacity: 0.25 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.72, 0.9] }, color: '#8e8172', soft: 8 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.74, 0.88], t: [0.58, 1] }, color: '#664a35', soft: 3, opacity: 0.85 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.88, 1] }, color: '#2e2925', soft: 3 },
  // in front of the panel the wing is a line along the mantle into the head's feathers: the mantle's brown, fading into
  // the scapulars' grey where the panel begins
  { kind: 'fill', where: { part: 'wingFold', s: [0, 0.36] }, color: '#6a5543', soft: 8 },
]

/** The spread wing, seen only if it flies: grey-brown, the speculum purplish blue between white bars. */
const SPREAD: Layer[] = [
  { kind: 'fill', where: { part: 'wingSpread' }, color: '#8a7d6c' },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.1, 0.45], t: [0.62, 0.92] }, color: '#3b3f9c', soft: 1.5 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.1, 0.45], t: [0.56, 0.62] }, color: '#f2f0ea', soft: 0.5 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.1, 0.45], t: [0.92, 1] }, color: '#f2f0ea', soft: 0.5 },
  { kind: 'fill', where: { part: 'wingUnder' }, color: '#e6e2da' },
]

/** The drakes' tail: its outer feathers white, the middle ones ash grey (what shows from above), its root under the black coverts. */
const DRAKE_TAIL: Layer[] = [
  { kind: 'fill', where: { part: 'tail' }, color: '#e7e5df' },
  { kind: 'fill', where: { part: 'tail', t: [0.28, 0.72] }, color: '#86827b', soft: 3 },
  { kind: 'fill', where: { part: 'tail', s: [0, 0.22] }, color: '#1c1c1c', soft: 4 },
  { kind: 'fill', where: { part: 'tailUnder' }, color: '#e4e1da' },
  { kind: 'fill', where: { part: 'tailUnder', s: [0, 0.22] }, color: '#1c1c1c', soft: 4 },
]

/** A point on the skin: a station, the way round from the back (t), and mm along the spine from the station (dx). */
type At = [at: string, t: number, dx?: number]
/** stripes along a line of skin points, one straight run from each to the next */
const along = (line: At[], width: number, color: string, more: { blur?: number; opacity?: number } = {}): Layer[] =>
  line.slice(1).map(([at, t, dx], i) => {
    const [at0, t0, dx0] = line[i]!
    return { kind: 'stripe', from: { at: at0, t: t0, ...(dx0 ? { dx: dx0 } : {}) }, to: { at, t, ...(dx ? { dx } : {}) }, width, color, ...more }
  })

/**
 * The drake's collar on the skin, from the throat back up the side of the neck to where it goes under the mantle: the
 * traced drake's, 14 mm above the water's midline at the throat and 21 mm at the back. The rings of the head and neck
 * fan round the throat, so the line crosses them on the slant.
 */
const COLLAR: At[] = [['neckBase', 0.742, 4.7], ['neckBase', 0.626, 3.2], ['neckBase', 0.538, 0.9], ['neckBase', 0.475, -2.7], ['neckBase', 0.39, -8.1], ['neckBase', 0.348, -11.8]]
/** the collar's line moved `by` round the neck, toward the throat */
const belowCollar = (by: number): At[] => COLLAR.map(([at, t, dx]) => [at, Math.min(1, t + by), dx])

/**
 * The head and neck down toward the collar, in one colour: everything ahead of the neck's middle ring, the hind neck
 * above it, and a band along the collar's line.
 */
const headArea = (color: string): Layer[] => [
  { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'billBase' }, color, soft: 1 },
  { kind: 'fill', where: { part: 'skin', from: 'neckBase', to: 'neckMid', band: [0, 0.5] }, color, soft: 1 },
  // 9 mm above the collar, 18 mm wide
  ...along([['crown', 0.841, 3], ['nape', 0.664, -0.7], ['neckMid', 0.51, -1.7], ['neckMid', 0.41, -4.7], ['neckBase', 0.295, 3.8]], 18, color, { blur: 0.5 }),
]

/** The drake's head: metallic green, blackish on the crown, brightest on the cheek; the green runs down the neck to the ring. */
const GREEN_HEAD: Layer[] = [
  ...headArea('#17502a'),
  // down to the collar: the green taken a little past it, then the chestnut laid back below it, in bands along its line
  // (on the skin, a tenth of the way round the neck apart). Behind the neck base the mantle's brown comes down to the
  // ring, as the traced drake's mantle feathers lie over the back of his neck
  { kind: 'fill', where: { part: 'skin', from: 'neckBase', to: 'neckMid', band: [0.45, 0.82] }, color: '#17502a', soft: 1 },
  ...[0.055, 0.155, 0.255].flatMap(by => along(belowCollar(by), 9, '#4e2118', { blur: 0.5 })),
  { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'lores', band: [0.3, 0.75] }, color: '#23803a', soft: 4 },
  { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'lores', band: [0, 0.19] }, color: '#0e3120', soft: 2.5 },
  { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'occiput', band: [0, 0.1] }, color: '#0e3120', soft: 2.5 },
]

/**
 * A dark line from the bill's base through the eye to the back of the head (the female's and the moulting drake's),
 * traced on the female (photo 2) and drawn across the head's fanned rings in short straight runs; and the paler line
 * above it.
 */
const EYE_LINE = (color: string, width: number): Layer[] =>
  along([['billBase', 0.403, -1.9], ['lores', 0.441, -1.2], ['eye', 0.42, 0.3], ['crown', 0.391, 0.2], ['crown', 0.34, -6.1], ['occiput', 0.256, -0.1], ['nape', 0.159, 0.6]], width, color, { blur: 0.6 })
const BROW: Layer[] = along([['lores', 0.352, 2.6], ['eye', 0.347, 0.6], ['crown', 0.32, -0.3], ['occiput', 0.259, 4.9], ['occiput', 0.162, -1.1]], 1.8, '#d4c2a2', { blur: 0.8, opacity: 0.6 })

const MALE: Layer[] = [
  ...GREY_BODY,
  ...STERN,
  ...CHESTNUT,
  ...GREEN_HEAD,
  // the chestnut's pale autumn fringes, faint
  { kind: 'feathers', where: { part: 'skin', from: 'breast', to: 'neckBase', band: [0.55, 1] }, length: 7, width: 6, center: '#4e2118', edge: '#7a4a38', edgeWidth: 0.6, soft: 3, opacity: 0.3 },
  // the ring, along the collar from the throat back up the side of the neck (incomplete behind, under the mantle)
  ...along(COLLAR.slice(0, 5), 2.3, '#f2f1ec', { blur: 0.9 }),
  ...DRAKE_WING,
  ...SPREAD,
  ...DRAKE_TAIL,
  { kind: 'fill', where: { part: 'curl' }, color: '#101410' },
  // brilliant lemon yellow to greenish yellow, a little olive at the base; the nail a small black cap on top of the tip,
  // with a pale bluish sheen behind it
  { kind: 'fill', where: { part: 'bill' }, color: '#e0bf2e' },
  { kind: 'fill', where: { part: 'bill', s: [0, 0.18] }, color: '#c2b23c', soft: 3, opacity: 0.6 },
  { kind: 'fill', where: { part: 'bill', s: [0.84, 0.91], t: [0, 0.3] }, color: '#a3ab86', soft: 1, opacity: 0.5 },
  { kind: 'fill', where: { part: 'bill', s: [0.91, 1], t: [0, 0.3] }, color: '#1b1a17', soft: 0.5 },
  { kind: 'fill', where: { part: 'legs' }, color: '#e8662a' },
]

/** A drake part-way out of eclipse, as the local birds show it: the body nearly done, the head lagging. */
const MALE_MOULT: Layer[] = [
  ...GREY_BODY,
  // brown scalloped feathers scattered through the grey flank
  { kind: 'feathers', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0.32, 0.8] }, length: 13, width: 9, center: '#8b6c4c', edge: '#c3c1bb', edgeWidth: 3.5, soft: 3, opacity: 0.3, jitter: 0.7 },
  ...STERN,
  ...CHESTNUT,
  // the chestnut mottled with brown, pale-fringed
  { kind: 'feathers', where: { part: 'skin', from: 'breast', to: 'neckMid', band: [0.35, 1] }, length: 9, width: 7, center: '#5c2d1c', edge: '#86664e', edgeWidth: 1.4, soft: 3, opacity: 0.85, jitter: 0.6 },
  // the head speckled grey-brown, a dark crown and line through the eye, green only on the crown and nape
  ...headArea('#7c6a57'),
  { kind: 'spots', where: { part: 'skin', from: 'neckBase', to: 'billBase', band: [0, 0.85] }, color: '#3e3226', size: 0.9, spacing: 1.8, blur: 0.3, soft: 2, opacity: 0.7 },
  { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'lores', band: [0, 0.19] }, color: '#2d2820', soft: 1.5 },
  ...EYE_LINE('#3a3026', 2),
  { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'eye', band: [0, 0.2] }, color: '#1d5530', soft: 1.5, opacity: 0.9 },
  ...DRAKE_WING,
  { kind: 'feathers', where: { part: 'wingFold', s: [0.3, 0.74], t: [0, 0.6] }, length: 12, width: 10, center: '#9a8a74', edge: '#c9bda9', edgeWidth: 1.5, soft: 2, opacity: 0.5 },
  ...SPREAD,
  ...DRAKE_TAIL,
  { kind: 'fill', where: { part: 'curl' }, color: '#101410' },
  // yellow to olive-yellow, the nail dark; legs dull orange
  { kind: 'fill', where: { part: 'bill' }, color: '#bfae3c' },
  { kind: 'fill', where: { part: 'bill', s: [0.91, 1], t: [0, 0.3] }, color: '#23211c', soft: 0.5 },
  { kind: 'fill', where: { part: 'legs' }, color: '#c9743a' },
]

/**
 * The adult female, standing in for the juveniles too: warm buff-brown, every feather dark-centred with a broad buff
 * edge, bolder and darker on the back; a buff head finely streaked, with a dark crown and a dark line through the eye;
 * an orange bill with a dark saddle.
 */
const FEMALE: Layer[] = [
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#4e3b2a', side: '#8a6d4e', bottom: '#c8ad86' },
  // the flank's long feathers, lying loosely in rows (not a ruled grid of scales): dark centres, broad buff edges
  { kind: 'feathers', where: { part: 'skin', from: 'rear', to: 'breast', band: [0.28, 1] }, length: 24, width: 11, center: '#4a3624', edge: '#c39d6c', edgeWidth: 3, soft: 3, jitter: 0.6 },
  { kind: 'streaks', where: { part: 'skin', from: 'rear', to: 'breast', band: [0.3, 0.9] }, color: '#3a2a1c', length: 5, width: 1.2, spacing: 6, jitter: 0.9, blur: 0.5, soft: 3, opacity: 0.35 },
  { kind: 'feathers', where: { part: 'skin', from: 'rear', to: 'breast', band: [0.4, 1] }, length: 16, width: 8, center: '#5a4430', edge: '#d2b07f', edgeWidth: 2.4, soft: 3, opacity: 0.45, jitter: 0.8 },
  // the back and scapular line, darker, the edges narrower and browner
  { kind: 'feathers', where: { part: 'skin', from: 'rump', to: 'neckMid', band: [0, 0.3] }, length: 26, width: 12, center: '#2e2219', edge: '#b08b5f', edgeWidth: 2, soft: 3, jitter: 0.85 },
  { kind: 'streaks', where: { part: 'skin', from: 'rump', to: 'neckMid', band: [0, 0.3] }, color: '#a8875c', length: 7, width: 1.4, spacing: 7, jitter: 0.9, blur: 0.6, soft: 3, opacity: 0.45 },
  // the undertail and the tail's whitish outer feathers along the stern, buff and soft-edged
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'rump', band: [0.44, 0.58] }, color: '#dccdb0', soft: 3, opacity: 0.8 },
  { kind: 'streaks', where: { part: 'skin', from: 'rear', to: 'rump', band: [0.56, 1] }, color: '#6e5a44', length: 2, width: 0.6, spacing: 1.8, blur: 0.3, soft: 2, opacity: 0.7 },
  // the breast brown, spotted and streaked darker
  { kind: 'fill', where: { part: 'skin', from: 'breast', to: 'neckMid', band: [0.3, 1] }, color: '#a17f58', soft: 4 },
  { kind: 'spots', where: { part: 'skin', from: 'breast', to: 'neckMid', band: [0.3, 1] }, color: '#4a3422', size: 1.6, spacing: 3, blur: 0.4, soft: 3, opacity: 0.8 },
  // the head: buff streaked brown, a dark crown and a dark line through the eye, paler cheeks, a plain buff throat
  ...headArea('#b29a79'),
  { kind: 'spots', where: { part: 'skin', from: 'neckBase', to: 'billBase', band: [0, 0.8] }, color: '#5a4630', size: 0.7, spacing: 1.3, jitter: 0.9, blur: 0.25, soft: 2, opacity: 0.5 },
  { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'lores', band: [0, 0.19] }, color: '#46362a', soft: 2 },
  ...BROW,
  ...EYE_LINE('#3d2e21', 1.8),
  { kind: 'fill', where: { part: 'skin', from: 'crown', to: 'billBase', band: [0.85, 1] }, color: '#d8c5a0', soft: 2.5, opacity: 0.8 },
  // the folded wing: dark-centred scapulars, plain grey-brown tertials with paler edges, and only a fleck of the
  // speculum, blue over its rear white bar, at the wing's lower edge (the flank feathers hide the rest)
  { kind: 'fill', where: { part: 'wingFold' }, color: '#6f5e4c' },
  { kind: 'feathers', where: { part: 'wingFold', s: [0.3, 0.74] }, length: 24, width: 11, center: '#3a2b1e', edge: '#bf9e72', edgeWidth: 2.2, soft: 2, jitter: 0.85 },
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
    // the mean of the sexes, spans 501 px), hip at (1500, 1640). The body, to the neck base, was read by hand: each
    // station's up, down, and tilt, and its place, fitted so that the loft's side view covers the outline with the
    // least area between them. Under the water, where no photo shows the hull, the outline is a keel 60 mm down, from
    // where the water meets the stern to where it meets the breast. The neck base sits at the top of the breast's
    // bulge, so the breast is body, not neck. The loft lies on average within 1.5 mm of the photo along the back, the
    // breast, and the stern; the rump stands 3 mm above the photo's under the tertials, where the wing covers it.
    //
    // The neck and head were refitted. Fitted to the side view alone, their first stations put the spine through the
    // lower third of the head, and their depths below it swung from one station to the next (12 to 41 mm): the side
    // view matched, but the head had pits under the eye and at the gape, a crease down the neck, and a groove where it
    // met the back. Now the head's outline is the photo's own (the bird told from the water by its colours), and the
    // rings of the neck and head fan round the throat, where the chin meets the breast: each a straight line from the
    // chin, throat, or front of the breast to the hind neck or the head, its two ends stepping evenly along the two
    // outlines, the spine through about the middle of each, turning about 10 degrees ahead of them. The eye's ring
    // passes through the photo's eye, and the last ring's spine point lies on the bill's line, so the bill is where it
    // was; the bill base's own ring leans 13 degrees, not 8, so the face's last rings turn more gently into it. From
    // the neck's middle on, the stations are every 2.5 mm along the spine, most of them unlabelled, and were evened
    // out until no ring folds at 64, 96, 128, or 160 rings (at 192, 0.04 mm). Their x and y are to a hundredth of a
    // millimetre: each ring's angle follows the spine's, and stations 2.5 mm apart rounded to a tenth of a millimetre
    // turned some a degree and folded them. The loft lies on average within 0.5 mm of the photo over the head and
    // the hind neck (1.5 mm before), at worst 4.8 mm at the forehead's foot over the bill; and within 1.3 mm along
    // the chin, throat and breast front (0.9 before), at worst 3 mm in the corner under the chin, which it rounds
    profile: [
      { label: 'rear',     x: -0.12220, y:  0.01320, up:  0.0010, down:  0.0097, halfWidth:  0.0080 },
      { label: 'rump',     x: -0.09940, y:  0.01010, up:  0.0325, down:  0.0180, halfWidth:  0.0300 },
      { label: 'tailBase', x: -0.06340, y:  0.00000, up:  0.0500, down:  0.0382, halfWidth:  0.0520 },
      { label: 'hip',      x:  0.00000, y:  0.00000, up:  0.0560, down:  0.0685, halfWidth:  0.0670 },
      { label: 'flank',    x:  0.05290, y:  0.00000, up:  0.0532, down:  0.0742, halfWidth:  0.0670 },
      { label: 'breast',   x:  0.10110, y:  0.00400, up:  0.0320, down:  0.0575, halfWidth:  0.0550, tilt: 4.0 },
      { label: 'neckBase', x:  0.12420, y:  0.01950, up:  0.0270, down:  0.0410, halfWidth:  0.0340, tilt: 15.5 },
      { label: 'neckMid',  x:  0.12989, y:  0.02863, up:  0.0284, down:  0.0211, halfWidth:  0.0270, tilt: -8.5 },
      {                    x:  0.13080, y:  0.03091, up:  0.0282, down:  0.0215, halfWidth:  0.0243, tilt: -18.7 },
      { label: 'nape',     x:  0.13169, y:  0.03319, up:  0.0284, down:  0.0219, halfWidth:  0.0227, tilt: -19.3 },
      {                    x:  0.13283, y:  0.03535, up:  0.0285, down:  0.0224, halfWidth:  0.0216, tilt: -16.7 },
      { label: 'occiput',  x:  0.13430, y:  0.03730, up:  0.0290, down:  0.0228, halfWidth:  0.0209, tilt: -12.9 },
      {                    x:  0.13604, y:  0.03903, up:  0.0298, down:  0.0233, halfWidth:  0.0206, tilt: -11.1 },
      {                    x:  0.13788, y:  0.04065, up:  0.0296, down:  0.0238, halfWidth:  0.0202, tilt: -11.8 },
      {                    x:  0.13980, y:  0.04217, up:  0.0293, down:  0.0243, halfWidth:  0.0199, tilt: -12.0 },
      {                    x:  0.14187, y:  0.04346, up:  0.0286, down:  0.0248, halfWidth:  0.0195, tilt: -9.9 },
      { label: 'crown',    x:  0.14410, y:  0.04447, up:  0.0276, down:  0.0252, halfWidth:  0.0191, tilt: -7.0 },
      {                    x:  0.14644, y:  0.04518, up:  0.0266, down:  0.0253, halfWidth:  0.0188, tilt: -3.5 },
      {                    x:  0.14887, y:  0.04552, up:  0.0256, down:  0.0253, halfWidth:  0.0186, tilt: 0.6 },
      { label: 'eye',      x:  0.15131, y:  0.04550, up:  0.0247, down:  0.0250, halfWidth:  0.0183, tilt: 4.1 },
      {                    x:  0.15374, y:  0.04518, up:  0.0238, down:  0.0244, halfWidth:  0.0177, tilt: 7.9 },
      {                    x:  0.15611, y:  0.04456, up:  0.0234, down:  0.0235, halfWidth:  0.0170, tilt: 13.5 },
      { label: 'lores',    x:  0.15831, y:  0.04351, up:  0.0228, down:  0.0224, halfWidth:  0.0158, tilt: 19.9 },
      {                    x:  0.16031, y:  0.04210, up:  0.0225, down:  0.0207, halfWidth:  0.0145, tilt: 24.7 },
      {                    x:  0.16221, y:  0.04055, up:  0.0221, down:  0.0192, halfWidth:  0.0131, tilt: 22.7 },
      { label: 'billBase', x:  0.16590, y:  0.03830, up:  0.0110, down:  0.0182, halfWidth:  0.0108, tilt: 13.0 },
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
      // from three side views (a quarter of the base's at the nail), both scaled to the live birds' base: the measured
      // points (0, 0.2, 0.3, 0.4, 0.5, 0.58, 0.74, 0.8, 0.84, 0.87, 0.9, 0.93, 0.95, 0.97, 0.98, 1), joined by a monotone
      // cubic and read at the builder's own rings along the bill and halfway between them (bill.ts: 16 from 0.15 of the
      // culmen inside the head), so the rings fall evenly, 1.9 mm apart. Joined by straight lines at the measured points,
      // each point left a crease round the bill, and a ring of its own between the builder's: the bill showed in bands
      profile: [
        [0, 0.990, 1.000], [0.0296875, 0.978, 1.000], [0.065625, 0.962, 1.000], [0.101562, 0.946, 1.000], [0.1375, 0.932, 1.000],
        [0.173437, 0.922, 1.000], [0.209375, 0.920, 0.999], [0.245312, 0.928, 0.976], [0.28125, 0.942, 0.939], [0.317187, 0.959, 0.903],
        [0.353125, 0.987, 0.864], [0.389062, 1.008, 0.822], [0.425, 1.010, 0.781], [0.460937, 1.010, 0.740], [0.496875, 1.010, 0.703],
        [0.532812, 1.032, 0.674], [0.56875, 1.067, 0.648], [0.604687, 1.070, 0.622], [0.640625, 1.070, 0.596], [0.676562, 1.070, 0.569],
        [0.7125, 1.070, 0.538], [0.748437, 1.068, 0.500], [0.784375, 1.037, 0.443], [0.820312, 0.998, 0.394], [0.85625, 0.936, 0.350],
        [0.892187, 0.837, 0.261], [0.928125, 0.677, 0.250], [0.964062, 0.524, 0.227], [1, 0.200, 0.150],
      ],
    },
    // the photo's eye: 7 mm across with its rim, the iris dark brown; t puts it on the photo's eye (within 0.4 mm)
    eye: { radius: 0.003, t: 0.417, iris: '#3b2415' },
    wing: {
      // the tip on the photo's primary tips over the stern, 62 mm above the water; the chord runs forward level with
      // the top of the tertial panel to a wrist hidden in the head's feathers. In front of 31% of the chord the wing
      // is a line with no height: in life the flank and breast feathers cover it, and the builder's wing only follows
      // the body over the first 60% of the spine, so a panel there would stand off the narrowing breast. The panel
      // begins a column later (at 35%) and under a millimetre high: the builder sets a line with no height as far out
      // as the panel's first column, and where that column was a full one, the line stood 9-21 mm off the narrowing
      // breast and the strip between them showed as a fin over the shoulder
      wrist: [0.157, 0.0349], droop: -2.5,
      outline: [
        [0, 0], [0.31, 0], [0.35, 0.002], [0.385, 0.05], [0.41, 0.075], [0.48, 0.09], [0.63, 0.078], [0.75, 0.093], [0.785, 0.1],
        [0.823, 0.073], [0.862, 0.044], [0.9, 0.016], [0.96, 0.006], [1, 0.003],
      ],
    },
    // raised 6.7 degrees above the spine at the tail base, so the tip lands on the photo's, 36 mm above the water; at
    // 0 the tail follows the spine, which runs nearly level there, and its tip would sit 10 mm lower. Closed on the
    // water, it narrows to a point (52 mm wide at its root inside the body, 29 at the tip, the middle feathers longest:
    // 'wedge', as the traced drake's closed tail shows it, though spread in flight it is rounded), its outer feathers
    // folded down a quarter of its width below the middle ones: the white wedge along the stern of the traced drake,
    // 8-10 mm deep where it leaves the coverts, not a flat plate
    tail: { shape: 'wedge', angle: 6.7, width: 0.5, spread: 0.55, vault: 0.25 },
    feet: 'webbed',
    // the drake's curl: the two central uppertail coverts, loops about 20 mm high on the rump, one 7 mm ahead of the
    // other, top 53 mm above the water
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
