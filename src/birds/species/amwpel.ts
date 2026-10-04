import type { SpeciesSpec } from '../spec'
import type { Layer } from '../detail/spec'

// The two late-September versions share one traced bird and differ only in paint: the adult out of breeding dress (no
// horn on the bill, no crest, no yellow on the breast), and the bird of the year, with scaled grey-brown wing coverts,
// a grey wash on the crown and hindneck, and a paler bill. Colours are the research's words
// (docs/research/2026-09-30-american-white-pelican.md, sections 4 and 9), picked for a field-guide plate from the
// credited photos. Skin t: 0 the back's midline, 0.5 the widest, 1 the belly.

const WHITE = '#f4f2ea', SHADE = '#dedbd0', BELLY = '#e9e6dc'
const BLACK = '#1b1a1a'

/**
 * The spread wing, seen in the flyover: s runs out along the span, t back from the leading edge. Black: every primary,
 * and the rear two-fifths of the chord along the secondaries, inward almost to the body; the coverts white. From above
 * the primary coverts and the alula are black too, and the secondaries are edged ashy white.
 */
const SPREAD: Layer[] = [
  { kind: 'fill', where: { part: 'wingUnder' }, color: '#eceae2' },
  { kind: 'fill', where: { part: 'wingUnder', s: [0.05, 1], t: [0.6, 1] }, color: BLACK, soft: 6 },
  { kind: 'fill', where: { part: 'wingUnder', s: [0.64, 1], t: [0.4, 1] }, color: BLACK, soft: 8 },
  { kind: 'fill', where: { part: 'wingUnder', s: [0.86, 1], t: [0.18, 1] }, color: BLACK, soft: 8 },
  { kind: 'fill', where: { part: 'wingSpread' }, color: WHITE },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.05, 0.3], t: [0.62, 1] }, color: '#6d6a66', soft: 10 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.25, 1], t: [0.58, 1] }, color: BLACK, soft: 6 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.5, 1], t: [0.2, 1] }, color: BLACK, soft: 8 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.84, 1], t: [0.06, 1] }, color: BLACK, soft: 8 },
  // the secondaries' ashy-white edges
  { kind: 'streaks', where: { part: 'wingSpread', s: [0.1, 0.5], t: [0.62, 1] }, color: '#b9b6ae', length: 90, width: 5, spacing: 34, blur: 2, opacity: 0.6 },
]

/** What the two versions share: the white bird, its black flight feathers, and the orange feet. */
const BIRD = (bill: string, ridge: string, pouch: string, pouchDeep: string, face: string, feet: string): Layer[] => [
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: WHITE, side: WHITE, bottom: BELLY },
  // the shaded underside of the body at the water, and under the chin
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'breast', band: [0.72, 1] }, color: SHADE, soft: 12, opacity: 0.6 },
  // the bare skin round the eye and down the lores to the bill
  { kind: 'ring', at: { at: 'eye', t: 0.3 }, radius: 7, width: 9, color: face, blur: 3 },
  { kind: 'stripe', from: { at: 'eye', t: 0.34, dx: 4 }, to: { at: 'billBase', t: 0.4 }, width: 14, color: face, blur: 4 },
  // the folded wing: white coverts, scapulars and tertials; the black primaries a dark line along its lower edge from
  // mid-body to the stern, and black tips under the tertials there
  { kind: 'fill', where: { part: 'wingFold' }, color: WHITE },
  { kind: 'fill', where: { part: 'wingFold', s: [0.42, 1], t: [0.9, 1] }, color: BLACK, soft: 2 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.86, 1], t: [0.55, 1] }, color: BLACK, soft: 6 },
  // the tertials' loose edges: faint grey lines down the rear of the wing
  { kind: 'streaks', where: { part: 'wingFold', s: [0.45, 0.9], t: [0.05, 0.8] }, color: '#cfccc2', length: 60, width: 2.5, spacing: 22, blur: 1.5, opacity: 0.55 },
  ...SPREAD,
  { kind: 'fill', where: { part: 'tail' }, color: WHITE },
  { kind: 'fill', where: { part: 'tailUnder' }, color: SHADE },
  // the upper mandible, paler along its ridge; the nail orange
  { kind: 'fill', where: { part: 'bill' }, color: bill },
  { kind: 'fill', where: { part: 'bill', t: [0, 0.2] }, color: ridge, soft: 2, opacity: 0.8 },
  // the lower jaw's rim takes the pouch's colour
  { kind: 'fill', where: { part: 'bill', t: [0.62, 1] }, color: pouch, soft: 2 },
  { kind: 'fill', where: { part: 'bill', s: [0.955, 1] }, color: '#e8862a', soft: 1.5 },
  // the pouch, deepest in colour at its base
  { kind: 'fill', where: { part: 'pouch' }, color: pouch },
  { kind: 'gradient', where: { part: 'pouch' }, axis: 's', from: 0, to: 0.5, colorA: pouchDeep, colorB: pouch, opacity: 0.9 },
  { kind: 'fill', where: { part: 'legs' }, color: feet },
]

/** The adult out of breeding dress: all white; the bill pink to pinkish-orange, the pouch yellow-orange, the feet orange. */
const ADULT: Layer[] = BIRD('#e9a58f', '#f0c4b4', '#eda44a', '#e58a2c', '#eeb24e', '#e8742a')

/**
 * The bird of the year: the lesser and median coverts grey-brown with pale fringes, scaled; the crown and hindneck
 * washed grey; the bill pale pink, the pouch and face pale pinkish-yellow, the feet duller.
 */
const JUVENILE: Layer[] = [
  ...BIRD('#ecbcae', '#f2d3c9', '#edc48e', '#e6b070', '#ecc9a0', '#d9914a'),
  // the scaled coverts: the upper side of the body from the shoulder to behind mid-body (the folded wing here is
  // only the band at the water; see `wing`)
  { kind: 'fill', where: { part: 'skin', from: 'hip', to: 'breast', band: [0.12, 0.42] }, color: '#cdc5b6', soft: 14, opacity: 0.8 },
  { kind: 'feathers', where: { part: 'skin', from: 'hip', to: 'breast', band: [0.12, 0.42] }, length: 30, width: 24, center: '#9c8f7c', edge: '#eeebe1', edgeWidth: 6, soft: 14, opacity: 0.85 },
  // the same coverts on the spread wing, above
  { kind: 'fill', where: { part: 'wingSpread', s: [0.04, 0.5], t: [0.05, 0.4] }, color: '#bdb3a2', soft: 14, opacity: 0.75 },
  // the grey wash on the crown and down the hindneck
  { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'eye', band: [0, 0.3] }, color: '#b9b4a8', soft: 10, opacity: 0.7 },
]

export const SPEC: SpeciesSpec = {
  code: 'amwpel',
  commonName: 'American White Pelican',
  length: 1.5,
  body: { length: 1, height: 0.5, width: 0.5 },
  neck: { length: 0.6, thickness: 0.18, angle: 60 },
  head: { size: 0.32 },
  bill: { length: 0.7, thickness: 0.14, shape: 'flat' },
  legs: { length: 0.25, thickness: 0.06 },
  tail: { length: 0.15, angle: 5 },
  wing: { length: 1.4, width: 0.45 },
  posture: 'swimming',
  draft: 0.35,
  plumage: {
    crown: '#fbfaf4', cheek: '#f9f8f2', throat: '#f6f4ec', breast: '#f7f5ee', flank: '#f6f4ec',
    back: '#f7f5ee', wing: '#f4f2ea', speculum: '#1a1a1a', rump: '#f6f4ec', tail: '#f0eee6',
    bill: '#f2a03a', legs: '#f2a03a', eye: '#2a2a2a',
  },
  variants: {
    adult: {},
    juvenile: { crown: '#c9c5ba', wing: '#cfc8ba', bill: '#ecbcae' },
  },
  marks: {
    size: 'huge: one of the largest birds in North America, three times a duck\'s length on the water and nine feet from wingtip to wingtip',
    bill: 'an enormous flat bill, pink to orange, with a yellow-orange pouch slung under it; carried slanting down in front of the neck; no horn on it in autumn',
    head: 'a white head on a thick white neck; in flight the neck folds back and the head rides on the shoulders; a young bird\'s crown and hindneck are washed grey',
    body: 'all white on the water, riding high; in flight the outer wing and the whole trailing edge are black; a young bird\'s wing coverts are scaled grey-brown. Feeds in a line, dipping bills together; flies in lines that flap and glide in turn; silent',
    legs: 'short orange legs and big webbed orange feet, hidden on the water and tucked under the tail in flight',
  },
  wingbeatHz: 2.7,
  foraging: 'pelican',
  detail: {
    measurements: {
      length: 0.85, culmen: 0.315, billDepth: 0.039, billWidth: 0.04,
      tarsus: 0.119, tibia: 0.02, toe: 0.101, wingChord: 0.583, tail: 0.15,
    },
    // Traced from Patricia's swimming bird (see sources; 2048 px, facing right) at 0.565 mm per pixel (the 315 mm
    // culmen, the mean of the sexes, spans 558 px). x runs from the middle of its waterline (pixel 1100) and y from the
    // water (pixel row 803), so the waterline is y = 0. The outline was read by hand on gridded enlargements. The back
    // is the folded wings' top, highest at mid-body, 145 mm above the water; the neck a thick column leaning back; the
    // bill slanting 34 degrees down in front of it. Under the water, where no photo shows the hull, the keel is 57 mm
    // down (the research's 55-60 mm of draft, from a 5.7 kg bird's displacement)
    profile: [
      { label: 'rear', x: -0.3, y: 0.03, up: 0.022, down: 0.02, halfWidth: 0.03 },
      { label: 'rump', x: -0.262, y: 0.038, up: 0.058, down: 0.048, halfWidth: 0.085 },
      { label: 'tailBase', x: -0.226, y: 0.04, up: 0.086, down: 0.078, halfWidth: 0.125 },
      { label: 'hip', x: -0.141, y: 0.043, up: 0.097, down: 0.098, halfWidth: 0.158 },
      { label: 'flank', x: -0.028, y: 0.039, up: 0.096, down: 0.096, halfWidth: 0.162 },
      { label: 'side', x: 0.085, y: 0.03, up: 0.085, down: 0.086, halfWidth: 0.152 },
      { label: 'breast', x: 0.186, y: 0.02, up: 0.055, down: 0.066, halfWidth: 0.125 },
      { label: 'chest', x: 0.222, y: 0.045, up: 0.028, down: 0.066, halfWidth: 0.085 },
      { label: 'neckBase', x: 0.222, y: 0.082, up: 0.022, down: 0.048, halfWidth: 0.05 },
      { label: 'neckMid', x: 0.2, y: 0.118, up: 0.026, down: 0.04, halfWidth: 0.042 },
      { label: 'neckUp', x: 0.176, y: 0.15, up: 0.03, down: 0.034, halfWidth: 0.04 },
      { label: 'nape', x: 0.145, y: 0.195, up: 0.036, down: 0.026, halfWidth: 0.038 },
      { label: 'occiput', x: 0.14, y: 0.228, up: 0.055, down: 0.012, halfWidth: 0.037 },
      { label: 'crown', x: 0.165, y: 0.238, up: 0.062, down: 0.014, halfWidth: 0.037 },
      { label: 'eye', x: 0.194, y: 0.24, up: 0.044, down: 0.026, halfWidth: 0.034 },
      { label: 'lores', x: 0.204, y: 0.24, up: 0.024, down: 0.024, halfWidth: 0.026 },
      { label: 'billBase', x: 0.215, y: 0.233, up: 0.0195, down: 0.0195, halfWidth: 0.02 },
    ],
    rig: {
      neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase',
      neck: ['neckBase', 'neckMid', 'neckUp', 'nape', 'occiput'],
    },
    // set by eye against the photos; see the sources
    neckShapes: {
      hunch: [35, 20, -45, -40, 29],
      erect: [-14, -6, 4, 6, 4],
      strike: [-80, -30, 5, 15, 20],
    },
    bill: {
      // the culmen is straight from the forehead to the nail, whose tip hooks 6 mm below the lower outline
      curve: 0,
      hook: 0.006,
      // depth photo-measured: 39 mm at the base, 20 at two-thirds, 17 at 0.85, 14 at the nail; width 40 mm at the
      // base (AVONET), and along the bill the research's estimate: parallel-sided to 0.85, then rounding in
      profile: [[0, 1, 1], [0.67, 1, 0.51], [0.85, 1, 0.44], [0.95, 0.63, 0.36], [1, 0, 0.2]],
      // slack, the pouch hangs deepest at its rear corner under the eye, 80 mm below the bill's axis there (bill and
      // pouch together 75 mm deep), and its lower edge runs nearly straight to the tip (photo-measured). Full, it is a
      // bag a bill's depth and more below the jaw over its middle: an estimate from the photos of stretched pouches
      pouch: [[-0.07, 0.05, 0.05], [0.03, 0.08, 0.095], [0.35, 0.046, 0.11], [0.73, 0.021, 0.06], [0.97, 0.005, 0.006]],
    },
    // the photo's eye: its dark disc 11 mm across, in bare yellow skin
    eye: { radius: 0.0055, t: 0.36, iris: '#2a1c14' },
    wing: {
      // All of the bird's side above the water is white, wing and body alike, so the folded wing here is only the band
      // along the flank where the primaries lie: its top edge the chord, level, 35 mm above the water, from a wrist
      // hidden in the breast's feathers to a tip a little past the tail's; its lower edge at the water, where the
      // black primaries show as a dark line from mid-body to the stern. The coverts, scapulars and tertials above it
      // are the body's own back
      wrist: [0.19, 0.035], droop: 0,
      outline: [[0, 0.03], [0.15, 0.07], [0.4, 0.075], [0.6, 0.07], [0.8, 0.06], [0.93, 0.04], [1, 0.02]],
    },
    tail: { shape: 'square', angle: 2 },
    feet: 'webbed',
    float: { waterline: 0 },
    // the wing carried at about 0.9 of its stretched 2.67 m: 2.5 m from tip to tip. Its chord 0.40 m over the inner
    // half, 0.27 m at three-quarters, fingered beyond 0.82 (photo-measured, one bird from below). The beat's and the
    // glide's angles are estimates from the side-on flight photos
    flight: {
      span: 1.12, rootX: 0.1,
      outline: [[0, 0.12, -0.26], [0.3, 0.15, -0.25], [0.5, 0.16, -0.24], [0.75, 0.11, -0.19], [0.9, 0.06, -0.2], [1, -0.02, -0.2]],
      wrist: 0.48,
      fingers: { count: 6, from: 0.8, fill: 0.55 },
      beat: { shoulder: 25, lift: 5, hand: 20, lag: 0.12 },
      glide: { shoulder: 3, hand: -6 },
    },
    plumage: ADULT,
    variants: { adult: ADULT, juvenile: JUVENILE },
    sources: [
      'Baird, Brewer & Ridgway 1884, Water Birds of North America vol. 2 pp. 132-137 (culmen, tarsus, toe, wing, tail; plumages; the pouch; lines in flight)',
      'Tobias et al. 2022, AVONET (bill width and depth at the nostril, tarsus, wing, tail)',
      'McMahon & Evans 1992 and Anderson 1987 (the dip, its timing and rate; feeding together)',
      'profile, bill, pouch and how it floats traced from iNaturalist 94475153 (c) Patricia, CC BY-NC, https://www.inaturalist.org/observations/94475153',
      'numbers, marks and the other reference photos: docs/research/2026-09-30-american-white-pelican.md, section 8',
    ],
  },
}
