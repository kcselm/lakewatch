import type { SpeciesSpec } from '../spec'
import type { Layer } from '../detail/spec'

// The two late-September versions share one traced bird and differ only in paint: the male, blue-grey above, white
// below with one blue-grey breast band; and the female, who adds a rufous band below it, rufous flanks, and rufous
// underwing coverts. Colours are the research's words (docs/research/2026-09-30-belted-kingfisher.md, section 4, and
// docs/research/2026-09-30-kingfisher-flight-and-plunge.md, section 2.2), picked for a field-guide plate from the
// credited photos. Skin t: 0 the back's midline, 0.5 the widest, 1 the belly. The body is traced on a straight spine
// slanting 41° up from the tail base and curving level into the bill, so the collar and the bands, level across the
// bird in the photo, run across the stations: each is a chain of stripes through points read off the profile photo.

const BLUE = '#56687a', CROWN = '#3c4b5a', DARK = '#2c3742', WHITE = '#f3f3ee', SHADE = '#dcdbd3'
const SLATE = '#1f2328', RUFOUS = '#9a5530'

/** a chain of stripes through skin points, `width` mm at each */
const chain = (points: { at: string; t: number; dx?: number }[], widths: number[], color: string, blur = 3): Layer[] =>
  points.slice(1).map((to, i) => ({ kind: 'stripe', from: points[i]!, to, width: (widths[i]! + widths[i + 1]!) / 2, color, blur }))

/**
 * The spread wing, s out along the span, t back from the leading edge. Above: blue-grey coverts; the flight feathers
 * slate-black, the secondaries edged blue-grey; the white patch at the primaries' bases from 0.64 to 0.88 of the
 * half-span, from just behind the leading edge to two-thirds of the chord, made of bars on the inner webs; a thin pale
 * tip to the inner primaries. Below: the coverts white (the female's rufous at the wing's base), the flight feathers
 * barred grey and white, 11 mm apart.
 */
const SPREAD = (coverts: string): Layer[] => [
  { kind: 'fill', where: { part: 'wingSpread' }, color: BLUE },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.05, 0.62], t: [0.45, 1] }, color: DARK, soft: 6 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.55, 1], t: [0.1, 1] }, color: SLATE, soft: 6 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.64, 0.88], t: [0.08, 0.66] }, color: WHITE, soft: 4, opacity: 0.85 },
  { kind: 'bars', where: { part: 'wingSpread', s: [0.64, 0.88], t: [0.08, 0.66] }, color: SLATE, width: 4, spacing: 9, angle: 90, blur: 1.5, opacity: 0.6 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.4, 0.8], t: [0.94, 1] }, color: '#c9ccc8', soft: 2, opacity: 0.6 },
  { kind: 'fill', where: { part: 'wingUnder' }, color: '#dcdedb' },
  { kind: 'bars', where: { part: 'wingUnder', s: [0.05, 1], t: [0.4, 1] }, color: '#5e6670', width: 5, spacing: 11, angle: 90, blur: 1.5, opacity: 0.8 },
  { kind: 'fill', where: { part: 'wingUnder', s: [0.8, 1], t: [0, 1] }, color: SLATE, soft: 8, opacity: 0.85 },
  { kind: 'fill', where: { part: 'wingUnder', s: [0, 0.55], t: [0, 0.42] }, color: coverts, soft: 8 },
]

/** What both versions share: blue-grey above, the crest, the white collar and throat, the blue-grey band, the bill. */
const BIRD = (coverts: string): Layer[] => [
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: BLUE, side: BLUE, bottom: WHITE },
  // white below the wing's lower edge, from the vent to the breast; shaded toward the belly
  { kind: 'fill', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0.74, 1] }, color: WHITE, soft: 10 },
  { kind: 'fill', where: { part: 'skin', from: 'tailBase', to: 'hip', band: [0.92, 1] }, color: SHADE, soft: 8, opacity: 0.6 },
  // the crown and the sides of the head darker, the crest feathers with black shaft-streaks
  { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'lores', band: [0, 0.55] }, color: CROWN, soft: 8 },
  { kind: 'fill', where: { part: 'crest' }, color: CROWN },
  { kind: 'streaks', where: { part: 'crest' }, color: '#141a20', length: 12, width: 1, spacing: 3, blur: 0.8, opacity: 0.7 },
  // the throat and chin white, up to the gape; the dark of the head reaches down below the eye to it
  { kind: 'fill', where: { part: 'skin', from: 'eye', to: 'billBase', band: [0.8, 1] }, color: WHITE, soft: 4 },
  // the collar, broad at the throat and narrowing behind, meeting across the hindneck
  ...chain([
    { at: 'lores', t: 1, dx: -2.6 }, { at: 'crown', t: 0.66, dx: 1.1 }, { at: 'neckMid', t: 0.57, dx: -1 }, { at: 'flank', t: 0.5, dx: 4.5 },
    { at: 'hip', t: 0.36, dx: 1 }, { at: 'hip', t: 0.24, dx: -6.9 }, { at: 'hip', t: 0, dx: -9 },
  ], [16, 12, 12, 12, 10, 9, 8], WHITE),
  // the breast band, blue-grey, about 22 mm deep at the side, its rear under the wing
  ...chain([{ at: 'eye', t: 1, dx: -2 }, { at: 'eye', t: 0.89, dx: -2.1 }, { at: 'neckBase', t: 0.72, dx: -1.4 }, { at: 'flank', t: 0.64, dx: 2.6 }, { at: 'hip', t: 0.57, dx: 2.5 }],
    [26, 26, 24, 22, 20], BLUE),
  // the white spot before the eye, and the smaller one under it
  { kind: 'ring', at: { at: 'lores', t: 0.31, dx: 1.2 }, radius: 1, width: 3.5, color: WHITE, blur: 1 },
  { kind: 'ring', at: { at: 'eye', t: 0.45, dx: -1.2 }, radius: 0.5, width: 2.5, color: '#cfd3d4', blur: 1, opacity: 0.7 },
  // the folded wing: blue-grey coverts with minute white specks; the primaries slate-black past the coverts with a
  // white flash at their bases, the tips black
  { kind: 'fill', where: { part: 'wingFold' }, color: BLUE },
  { kind: 'spots', where: { part: 'wingFold', s: [0.05, 0.55], t: [0.05, 0.9] }, color: '#dfe4e6', size: 1, spacing: 7, jitter: 0.8, blur: 0.5, opacity: 0.35 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.55, 1], t: [0, 1] }, color: DARK, soft: 6 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.82, 1], t: [0, 1] }, color: SLATE, soft: 4 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.6, 0.72], t: [0.05, 0.35] }, color: WHITE, soft: 3, opacity: 0.85 },
  ...SPREAD(coverts),
  // the tail: blue-grey above, a black streak down the middle; below slate-black barred white, 8 mm apart
  { kind: 'fill', where: { part: 'tail' }, color: BLUE },
  { kind: 'fill', where: { part: 'tail', t: [0.42, 0.58] }, color: SLATE, soft: 2, opacity: 0.8 },
  { kind: 'spots', where: { part: 'tail', s: [0.1, 0.95] }, color: '#e6e9ea', size: 1.5, spacing: 8, jitter: 0.5, blur: 0.5, opacity: 0.5 },
  { kind: 'fill', where: { part: 'tailUnder' }, color: SLATE },
  { kind: 'bars', where: { part: 'tailUnder', s: [0.08, 1] }, color: '#e8eaea', width: 3, spacing: 8, angle: 90, blur: 1, opacity: 0.85 },
  // the bill black, the lower mandible's base pale grey-horn
  { kind: 'fill', where: { part: 'bill' }, color: '#1d1f21' },
  { kind: 'fill', where: { part: 'bill', s: [0, 0.4], t: [0.6, 1] }, color: '#a7a9a1', soft: 5, opacity: 0.85 },
  { kind: 'fill', where: { part: 'legs' }, color: '#5a5d60' },
]

/** The male: no rufous anywhere; the flanks blue-grey flecked with white under the wing. */
const MALE: Layer[] = [
  ...BIRD(WHITE),
  { kind: 'spots', where: { part: 'skin', from: 'thigh', to: 'hip', band: [0.6, 0.76] }, color: WHITE, size: 2, spacing: 6, jitter: 0.8, blur: 1, opacity: 0.5 },
]

/**
 * The female: a rufous band below the blue one, a white gap of 5-15 mm between them, as deep as the blue band at the
 * sides and narrowing to a break at the middle of the belly; the rufous flanks a long wedge below the folded wing from
 * the breast to the thighs; the axillars and inner underwing coverts rufous.
 */
const FEMALE: Layer[] = [
  ...BIRD(RUFOUS),
  ...chain([{ at: 'hip', t: 0.97, dx: 3 }, { at: 'hip', t: 0.93, dx: 2.2 }, { at: 'hip', t: 0.8, dx: -4.6 }, { at: 'foreBelly', t: 0.7, dx: 6 }, { at: 'foreBelly', t: 0.68, dx: -6.4 }],
    [5, 10, 13, 14, 14], RUFOUS),
  ...chain([{ at: 'foreBelly', t: 0.71, dx: -10 }, { at: 'belly', t: 0.69, dx: -7.6 }, { at: 'thigh', t: 0.68, dx: -5.6 }, { at: 'vent', t: 0.71, dx: -2.7 }, { at: 'tailBase', t: 0.71, dx: 2.3 }],
    [14, 13, 11, 8, 4], RUFOUS),
]

export const SPEC: SpeciesSpec = {
  code: 'belkin1',
  commonName: 'Belted Kingfisher',
  length: 0.319,
  body: { length: 1, height: 0.6, width: 0.5 },
  neck: { length: 0.12, thickness: 0.2, angle: 40 },
  head: { size: 0.42 },
  bill: { length: 0.24, thickness: 0.1, shape: 'dagger' },
  legs: { length: 0.08, thickness: 0.03 },
  tail: { length: 0.2, angle: 5 },
  wing: { length: 0.5, width: 0.25 },
  posture: 'perched',
  draft: 0,
  plumage: {
    crown: '#3c4b5a', cheek: '#3c4b5a', throat: '#f3f3ee', breast: '#f3f3ee', flank: '#f0eee8',
    back: '#56687a', wing: '#56687a', speculum: null, rump: '#56687a', tail: '#4a5a6a',
    bill: '#1d1f21', legs: '#5a5d60', eye: '#111111',
  },
  variants: {
    male: {},
    female: { flank: '#9a5530', breast: '#e8e0d4' },
  },
  marks: {
    size: 'pigeon-sized but top-heavy: a big head and a heavy bill on a short body; about 33 cm',
    bill: 'long, straight, heavy and pointed, black, pale at the base of the lower mandible',
    head: 'a shaggy, ragged double crest, raised and lowered; blue-grey with a small white spot in front of the eye; a white collar all round the neck',
    body: 'blue-grey above, white below with a broad blue-grey breast band; the female adds a rusty band below it and rusty flanks. In flight, a white patch in the outer wing. Perches still over water, bobbing its head and flicking its tail; hovers on fast wingbeats with the bill down, then plunges head first. A loud, dry, wooden rattle, mostly in flight',
    legs: 'tiny dark feet, almost hidden, gripping a branch, post or wire over the water',
  },
  wingbeatHz: 7,
  detail: {
    measurements: {
      length: 0.319, culmen: 0.0595, billDepth: 0.016, billWidth: 0.011,
      tarsus: 0.0114, tibia: 0.008, toe: 0.0158, wingChord: 0.164, tail: 0.093,
    },
    // Traced from Patricia's male (see sources; 2048 px, facing right) at 0.224 mm per pixel (the 59.5 mm culmen spans
    // 264 px). x runs from his feet (pixel 940) and y from the stump's top under them (pixel row 1110). The outline was
    // read by hand on gridded enlargements and the stations measured square to the spine: straight from the tail base
    // at 41° up through the body, then on an arc of 74 mm radius into the level bill, so no section crosses its
    // neighbour on the inside of a bend. The crest is a part of its own; the head here is the head sleeked. The
    // stations between the tail base and the hip follow the back and the belly along the slant. The widths are from the
    // front-on male (iNaturalist 95480431): the breast about 66 mm across and the head 45 mm, against his height
    profile: [
      { label: 'rear',      x: -0.0876, y: 0.0118, up: 0.008,  down: 0.01,   halfWidth: 0.009 },
      { label: 'rump',      x: -0.0842, y: 0.0147, up: 0.02,   down: 0.018,  halfWidth: 0.016 },
      { label: 'tailBase',  x: -0.08,   y: 0.0184, up: 0.0301, down: 0.0311, halfWidth: 0.022 },
      { label: 'vent',      x: -0.0638, y: 0.0323, up: 0.0311, down: 0.0417, halfWidth: 0.025 },
      { label: 'thigh',     x: -0.047,  y: 0.0468, up: 0.0279, down: 0.0561, halfWidth: 0.028 },
      { label: 'belly',     x: -0.0302, y: 0.0613, up: 0.0259, down: 0.0578, halfWidth: 0.031 },
      { label: 'foreBelly', x: -0.0146, y: 0.0749, up: 0.026,  down: 0.0586, halfWidth: 0.033 },
      { label: 'hip',       x: 0,       y: 0.0875, up: 0.0327, down: 0.056,  halfWidth: 0.034 },
      { label: 'flank',     x: 0.0074,  y: 0.0939, up: 0.0372, down: 0.0524, halfWidth: 0.035 },
      { label: 'breast',    x: 0.0148,  y: 0.1003, up: 0.0412, down: 0.0499, halfWidth: 0.034 },
      { label: 'neckBase',  x: 0.0184,  y: 0.1032, up: 0.0424, down: 0.0495, halfWidth: 0.032 },
      { label: 'neckMid',   x: 0.0222,  y: 0.1059, up: 0.0412, down: 0.049,  halfWidth: 0.029 },
      { label: 'nape',      x: 0.0262,  y: 0.1083, up: 0.0395, down: 0.0477, halfWidth: 0.026 },
      { label: 'occiput',   x: 0.0303,  y: 0.1105, up: 0.0377, down: 0.0462, halfWidth: 0.024 },
      { label: 'crown',     x: 0.0345,  y: 0.1125, up: 0.035,  down: 0.0445, halfWidth: 0.023 },
      { label: 'eye',       x: 0.0388,  y: 0.1141, up: 0.0327, down: 0.0418, halfWidth: 0.022 },
      { label: 'lores',     x: 0.0516,  y: 0.1174, up: 0.0201, down: 0.017,  halfWidth: 0.014 },
      { label: 'billBase',  x: 0.0632,  y: 0.1183, up: 0.008,  down: 0.008,  halfWidth: 0.0055 },
    ],
    rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
    // a straight dagger, the culmen within 4° of straight, the tip barely decurved (section 5.1)
    bill: { taper: 1, curve: -0.01 },
    // dark brown, 9 mm across as it shows; set round its section so it sits on the photo's eye
    eye: { radius: 0.0045, t: 0.38, iris: '#3a2618' },
    // the folded wing: its tip the black primaries a little past the tail's base (photo pixel 410, 1215), its chord
    // 164 mm up along the back to a wrist hidden under the shoulder's feathers; 0.2 of the chord deep at its widest
    // (photo)
    wing: {
      wrist: [-0.0022, 0.0941], droop: 42,
      outline: [[0, 0.05], [0.16, 0.17], [0.36, 0.2], [0.55, 0.17], [0.74, 0.1], [0.93, 0.036], [1, 0.01]],
    },
    // "truncate or very slightly rounded" (Ridgway); fanned to 140° at tailSpread 1, the braking bird's widest, so a
    // hover's 100° is about 0.7 (flight-and-plunge.md, sections 4.3 and 8.3). Angled to the photo's tail
    tail: { shape: 'square', angle: 2, fan: 140 },
    // a branch of 3.5 cm (belted-kingfisher.md, section 6); the photo's stump top under the feet
    perch: { radius: 0.0175, top: -0.0004 },
    // the double crest, a tuft at the crown and one at the occiput, lying back along the head and raised 35°
    // (section 5.2: 30-40°)
    parts: [{
      kind: 'crest',
      lobes: [{ at: 'crown', dx: 0.004, length: 0.024, lie: 8 }, { at: 'occiput', dx: -0.002, length: 0.028, lie: -25 }],
      raise: 35,
    }],
    // an 80 mm fish (section 7.1)
    fish: { length: 0.08 },
    // The spread wing, from the research's top-down trace (flight-and-plunge.md, section 2.3): a half-span of 1.47 ×
    // the wing chord, 0.241 m, the wrist at 0.37 of it (section 2.4), the outer five primaries parting over the last
    // 12% (slots 15-25 mm). The strokes are its estimates (sections 3.3, 4.3 and 8): a beat of 100°, a hover of 120°
    // sweeping about ±18° with its hand bent less, and a glide on half-closed wings. Its pitch is the trace's trunk,
    // tail base to neck base, 41° above level. The fold's turns lay the wing back along the flank, its upper face out
    flight: {
      span: 0.241,
      outline: [
        [0, 0, -0.0986], [0.1, -0.0034, -0.1054], [0.2, -0.0065, -0.1097], [0.3, -0.0065, -0.1114], [0.37, -0.0065, -0.1095],
        [0.5, -0.0002, -0.1032], [0.6, 0.0019, -0.0938], [0.7, 0.0031, -0.0832], [0.8, 0.0084, -0.0646], [0.9, 0.0118, -0.0485],
        [0.95, 0.013, -0.0345], [1, 0.0084, 0.0084],
      ],
      wrist: 0.37,
      fingers: { count: 5, from: 0.88, fill: 0.7 },
      pitch: 41,
      beat: { shoulder: 50, lift: 5, hand: 20, lag: 0.12 },
      hover: { shoulder: 60, lift: 0, hand: 10, lag: 0.1, sweep: 18 },
      glide: { shoulder: 3, hand: -3, sweep: { shoulder: -12, hand: -30 } },
      fold: { sweep: { shoulder: -90, hand: -10 }, twist: { shoulder: -90, hand: 0 } },
    },
    plumage: FEMALE,
    variants: { female: FEMALE, male: MALE },
    sources: [
      'Ridgway 1914, Birds of North and Middle America part 6 pp. 406-420 (culmen, tarsus, toe, wing, tail of caurina; plumages)',
      'Tobias et al. 2022, AVONET (bill depth and width at the nostril)',
      'Bent 1940, Life Histories of North American Cuckoos, Goatsuckers, Hummingbirds and Their Allies (behaviour, the crest, the tail flick)',
      'profile, eye, folded wing, tail and perch traced from iNaturalist 95479901 (c) Patricia, CC BY-NC, https://www.inaturalist.org/observations/95479901',
      'the female painted from iNaturalist 400639376 (c) Steve Foss, CC BY-NC, https://www.inaturalist.org/observations/400639376, and 144456268 (c) Owen Gross, CC BY-NC',
      'the spread wing traced from iNaturalist 333912529 (c) Dr. Liz Anna Kozik, CC BY-NC, https://www.inaturalist.org/observations/333912529',
      'numbers, marks and the other reference photos: docs/research/2026-09-30-belted-kingfisher.md (section 8) and docs/research/2026-09-30-kingfisher-flight-and-plunge.md (section 9)',
    ],
  },
}
