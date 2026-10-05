import { parseSpeciesSpec, type SpeciesSpec } from '../spec'
import type { DetailSpec } from './spec'

/**
 * A test shorebird for the builder's unit tests: the Greater Yellowlegs outline and measurements with a
 * plain plumage, frozen here so species tuning never breaks the builder's own tests.
 */
export const TEST_DETAIL: DetailSpec = {
  measurements: {
    length: 0.31, culmen: 0.056, billDepth: 0.0065, billWidth: 0.005,
    tarsus: 0.061, tibia: 0.035, toe: 0.035, wingChord: 0.188, tail: 0.077,
  },
  profile: [
    { label: 'rear',     x: -0.0884, y: -0.0163, up: 0.0048, down: 0.0048, halfWidth: 0.0045 },
    { label: 'rump',     x: -0.0714, y: -0.0150, up: 0.0088, down: 0.0082, halfWidth: 0.0075 },
    { label: 'tailBase', x: -0.0442, y: -0.0102, up: 0.0184, down: 0.0170, halfWidth: 0.0150 },
    { label: 'hip',      x: 0,       y: 0,       up: 0.0333, down: 0.0333, halfWidth: 0.0220 },
    { label: 'flank',    x: 0.0306,  y: 0.0082,  up: 0.0360, down: 0.0374, halfWidth: 0.0235 },
    { label: 'breast',   x: 0.0544,  y: 0.0212,  up: 0.0278, down: 0.0306, halfWidth: 0.0210 },
    { label: 'neckBase', x: 0.0694,  y: 0.0456,  up: 0.0136, down: 0.0136, halfWidth: 0.0120 },
    { label: 'neckMid',  x: 0.0755,  y: 0.0728,  up: 0.0102, down: 0.0102, halfWidth: 0.0092 },
    { label: 'nape',     x: 0.0802,  y: 0.0979,  up: 0.0102, down: 0.0102, halfWidth: 0.0092 },
    { label: 'occiput',  x: 0.0883,  y: 0.1126,  up: 0.0109, down: 0.0095, halfWidth: 0.0105 },
    { label: 'crown',    x: 0.0947,  y: 0.1173,  up: 0.0136, down: 0.0122, halfWidth: 0.0112 },
    { label: 'eye',      x: 0.1002,  y: 0.1196,  up: 0.0129, down: 0.0122, halfWidth: 0.0110 },
    { label: 'lores',    x: 0.1131,  y: 0.1204,  up: 0.0082, down: 0.0068, halfWidth: 0.0068 },
    { label: 'billBase', x: 0.1201,  y: 0.1183,  up: 0.0033, down: 0.0033, halfWidth: 0.0025 },
  ],
  rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
  bill: { taper: 1.2, curve: 0.04 },
  eye: { radius: 0.0027, t: 0.45, iris: '#2a1f18' },
  wing: {
    wrist: [0.0496, 0.0483], droop: 19.4,
    outline: [[0, 0.05], [0.16, 0.17], [0.36, 0.18], [0.55, 0.16], [0.74, 0.094], [0.93, 0.036], [1, 0.01]],
  },
  tail: { shape: 'square' },
  plumage: [
    { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#655b4b', side: '#9a9384', bottom: '#f3f1eb' },
    { kind: 'fill', where: { part: 'wingFold' }, color: '#5a5142' },
    { kind: 'fill', where: { part: 'bill' }, color: '#26231f' },
    { kind: 'fill', where: { part: 'legs' }, color: '#e3c02a' },
  ],
  variants: {},
  sources: ['test fixture'],
}

export const TEST_SPEC: SpeciesSpec = parseSpeciesSpec({
  code: 'testbird', commonName: 'Test Shorebird', length: 0.31,
  body: { length: 1, height: 0.5, width: 0.42 }, neck: { length: 0.32, thickness: 0.12, angle: 65 },
  head: { size: 0.26 }, bill: { length: 0.36, thickness: 0.06, shape: 'pointed' },
  legs: { length: 0.75, thickness: 0.025 }, tail: { length: 0.12, angle: 0 }, wing: { length: 0.6, width: 0.28 },
  posture: 'standing', draft: 0,
  plumage: {
    crown: '#6a6252', cheek: '#a8a292', throat: '#f2f0ea', breast: '#d8d2c4', flank: '#eeeae0',
    back: '#6a6454', wing: '#736c5c', speculum: null, rump: '#f2f0ea', tail: '#c8c2b2',
    bill: '#2a2a2a', legs: '#e8c22a', eye: '#111111',
  },
  variants: {},
  marks: { size: 'a test shorebird', bill: 'a long test bill', head: 'a test head', body: 'a test body', legs: 'long test legs' },
  wingbeatHz: 5,
  detail: TEST_DETAIL,
})

/**
 * A test duck for the swimming builder: a dabbler of about a Mallard's size (docs/research/2026-09-25-mallard.md,
 * sections 6 and 9: back 80 mm above the water, draft 55 mm, crown about 100 mm), floating with its waterline 22 mm
 * below the traced spine. Frozen here, like TEST_DETAIL, so the Mallard's own tracing never breaks the builder's tests.
 */
export const TEST_SWIM_DETAIL: DetailSpec = {
  measurements: {
    length: 0.39, culmen: 0.053, billDepth: 0.018, billWidth: 0.021,
    tarsus: 0.043, tibia: 0.01, toe: 0.051, wingChord: 0.24, tail: 0.087,
  },
  profile: [
    { label: 'rear',     x: -0.130, y: 0.004, up: 0.010, down: 0.010, halfWidth: 0.012 },
    { label: 'rump',     x: -0.110, y: 0.004, up: 0.024, down: 0.030, halfWidth: 0.032 },
    { label: 'tailBase', x: -0.088, y: 0.002, up: 0.040, down: 0.050, halfWidth: 0.048 },
    { label: 'hip',      x: -0.030, y: 0,     up: 0.056, down: 0.070, halfWidth: 0.064 },
    { label: 'flank',    x: 0.025,  y: 0,     up: 0.056, down: 0.072, halfWidth: 0.064 },
    { label: 'breast',   x: 0.070,  y: 0.006, up: 0.044, down: 0.060, halfWidth: 0.054 },
    { label: 'neckBase', x: 0.094,  y: 0.022, up: 0.026, down: 0.036, halfWidth: 0.032 },
    { label: 'neckMid',  x: 0.104,  y: 0.040, up: 0.019, down: 0.021, halfWidth: 0.021 },
    { label: 'nape',     x: 0.110,  y: 0.054, up: 0.017, down: 0.016, halfWidth: 0.019 },
    { label: 'occiput',  x: 0.120,  y: 0.064, up: 0.018, down: 0.013, halfWidth: 0.019 },
    { label: 'crown',    x: 0.132,  y: 0.069, up: 0.019, down: 0.015, halfWidth: 0.020 },
    { label: 'eye',      x: 0.145,  y: 0.070, up: 0.017, down: 0.015, halfWidth: 0.019 },
    { label: 'lores',    x: 0.158,  y: 0.067, up: 0.012, down: 0.011, halfWidth: 0.014 },
    { label: 'billBase', x: 0.166,  y: 0.064, up: 0.009, down: 0.009, halfWidth: 0.010 },
  ],
  rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
  bill: { taper: 0.9, curve: 0 },
  eye: { radius: 0.003, t: 0.4, iris: '#3a2616' },
  wing: {
    wrist: [0.07, 0.03], droop: 2,
    outline: [[0, 0.05], [0.2, 0.16], [0.5, 0.15], [0.8, 0.08], [1, 0.02]],
  },
  tail: { shape: 'rounded', angle: 5 },
  float: { waterline: -0.022 },
  plumage: [
    { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#5b4a39', side: '#8a735a', bottom: '#b9a58a' },
    { kind: 'fill', where: { part: 'wingFold' }, color: '#5a4a3a' },
    { kind: 'fill', where: { part: 'bill' }, color: '#d98a2b' },
    { kind: 'fill', where: { part: 'legs' }, color: '#e8742a' },
  ],
  variants: {},
  sources: ['test fixture'],
}

export const TEST_SWIM_SPEC: SpeciesSpec = parseSpeciesSpec({
  ...TEST_SPEC, code: 'testduck', commonName: 'Test Duck', posture: 'swimming', draft: 0.4, detail: TEST_SWIM_DETAIL,
})

/**
 * A test heron for the chained neck: about a Great Blue Heron's size, standing with its neck in a hunting S, jointed
 * at six stations from the neck base to the occiput. Its shapes are set by eye for the builder's tests, not traced:
 * the real heron's own tracing never breaks them.
 */
export const TEST_HERON_DETAIL: DetailSpec = {
  measurements: {
    length: 0.8, culmen: 0.135, billDepth: 0.03, billWidth: 0.02,
    tarsus: 0.18, tibia: 0.1, toe: 0.11, wingChord: 0.46, tail: 0.17,
  },
  profile: [
    { label: 'rear',     x: -0.240, y: -0.060, up: 0.012, down: 0.012, halfWidth: 0.020 },
    { label: 'rump',     x: -0.200, y: -0.045, up: 0.035, down: 0.035, halfWidth: 0.050 },
    { label: 'tailBase', x: -0.160, y: -0.030, up: 0.055, down: 0.055, halfWidth: 0.070 },
    { label: 'hip',      x: 0,      y: 0,      up: 0.085, down: 0.085, halfWidth: 0.090 },
    { label: 'flank',    x: 0.070,  y: 0.030,  up: 0.085, down: 0.090, halfWidth: 0.090 },
    { label: 'breast',   x: 0.140,  y: 0.070,  up: 0.070, down: 0.080, halfWidth: 0.080 },
    { label: 'neckBase', x: 0.180,  y: 0.120,  up: 0.040, down: 0.045, halfWidth: 0.045 },
    { label: 'neckLow',  x: 0.210,  y: 0.200,  up: 0.030, down: 0.032, halfWidth: 0.032 },
    { label: 'kink',     x: 0.200,  y: 0.300,  up: 0.026, down: 0.030, halfWidth: 0.028 },
    { label: 'neckUp',   x: 0.220,  y: 0.390,  up: 0.024, down: 0.026, halfWidth: 0.026 },
    { label: 'nape',     x: 0.270,  y: 0.450,  up: 0.024, down: 0.024, halfWidth: 0.025 },
    { label: 'occiput',  x: 0.310,  y: 0.470,  up: 0.028, down: 0.026, halfWidth: 0.028 },
    { label: 'crown',    x: 0.335,  y: 0.475,  up: 0.030, down: 0.026, halfWidth: 0.028 },
    { label: 'eye',      x: 0.355,  y: 0.472,  up: 0.026, down: 0.024, halfWidth: 0.026 },
    { label: 'lores',    x: 0.380,  y: 0.466,  up: 0.018, down: 0.016, halfWidth: 0.018 },
    { label: 'billBase', x: 0.390,  y: 0.462,  up: 0.014, down: 0.014, halfWidth: 0.012 },
  ],
  rig: {
    neckBase: 'neckBase', neckMid: 'neckLow', head: 'occiput', hip: 'hip', tailBase: 'tailBase',
    neck: ['neckBase', 'neckLow', 'kink', 'neckUp', 'nape', 'occiput'],
  },
  neckShapes: {
    hunch: [36, -86, 98, -58, -1, 12],
    erect: [11, -19, 19, 24, 18, -53],
    strike: [-39, -46, 8, 17, 19, 12],
  },
  bill: { taper: 1.5, curve: 0 },
  eye: { radius: 0.006, t: 0.4, iris: '#e8d24a' },
  wing: {
    wrist: [0.1, 0.05], droop: 12,
    outline: [[0, 0.05], [0.16, 0.17], [0.36, 0.18], [0.55, 0.16], [0.74, 0.094], [0.93, 0.036], [1, 0.01]],
  },
  tail: { shape: 'square' },
  plumage: [
    { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#5f6b7c', side: '#8a8e96', bottom: '#d8d6cc' },
    { kind: 'fill', where: { part: 'wingFold' }, color: '#566273' },
    { kind: 'fill', where: { part: 'bill' }, color: '#d9b23a' },
    { kind: 'fill', where: { part: 'legs' }, color: '#6b6650' },
  ],
  variants: {},
  sources: ['test fixture'],
}

export const TEST_HERON_SPEC: SpeciesSpec = parseSpeciesSpec({
  ...TEST_SPEC, code: 'testheron', commonName: 'Test Heron', length: 0.8, detail: TEST_HERON_DETAIL,
})

/**
 * A test percher for the perched posture: about a Belted Kingfisher's size (docs/research/2026-09-30-belted-kingfisher.md,
 * sections 2.6, 6 and 9: 325 mm bill tip to tail tip with the body 31° below level toward the tail, the eye 124 mm
 * above the perch's top, the tail tip 157 mm behind it and 47 mm below, the bill 4° below level), a big head on a short
 * neck, on a branch 35 mm across. Its outline is set by eye from those numbers for the builder's tests, not traced: the
 * kingfisher's own tracing never breaks them.
 */
export const TEST_PERCHER_DETAIL: DetailSpec = {
  measurements: {
    length: 0.325, culmen: 0.0595, billDepth: 0.016, billWidth: 0.011,
    tarsus: 0.0114, tibia: 0.008, toe: 0.0158, wingChord: 0.164, tail: 0.093,
  },
  profile: [
    { label: 'rear',     x: -0.092, y: -0.065, up: 0.005, down: 0.005, halfWidth: 0.006 },
    { label: 'rump',     x: -0.084, y: -0.059, up: 0.010, down: 0.010, halfWidth: 0.012 },
    { label: 'tailBase', x: -0.073, y: -0.051, up: 0.016, down: 0.016, halfWidth: 0.018 },
    { label: 'hip',      x: 0,      y: 0,      up: 0.030, down: 0.032, halfWidth: 0.026 },
    { label: 'flank',    x: 0.010,  y: 0.015,  up: 0.030, down: 0.033, halfWidth: 0.027 },
    { label: 'breast',   x: 0.018,  y: 0.030,  up: 0.027, down: 0.031, halfWidth: 0.025 },
    { label: 'neckBase', x: 0.022,  y: 0.045,  up: 0.020, down: 0.023, halfWidth: 0.020 },
    { label: 'neckMid',  x: 0.025,  y: 0.056,  up: 0.018, down: 0.020, halfWidth: 0.018 },
    { label: 'nape',     x: 0.028,  y: 0.064,  up: 0.019, down: 0.019, halfWidth: 0.019 },
    { label: 'occiput',  x: 0.033,  y: 0.071,  up: 0.020, down: 0.019, halfWidth: 0.020 },
    { label: 'crown',    x: 0.041,  y: 0.076,  up: 0.020, down: 0.019, halfWidth: 0.021 },
    { label: 'eye',      x: 0.051,  y: 0.079,  up: 0.018, down: 0.018, halfWidth: 0.020 },
    { label: 'lores',    x: 0.064,  y: 0.079,  up: 0.012, down: 0.012, halfWidth: 0.013 },
    { label: 'billBase', x: 0.072,  y: 0.078,  up: 0.008, down: 0.008, halfWidth: 0.0055 },
  ],
  rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
  bill: { taper: 1, curve: -0.01 },
  eye: { radius: 0.0045, t: 0.4, iris: '#3a2618' },
  wing: {
    wrist: [0.02, 0.03], droop: 40,
    outline: [[0, 0.05], [0.16, 0.17], [0.36, 0.18], [0.55, 0.16], [0.74, 0.094], [0.93, 0.036], [1, 0.01]],
  },
  // fanned to 140° at tailSpread 1, the braking bird's widest, so a hover's 100° is about 0.7
  // (kingfisher-flight-and-plunge.md, sections 4.3 and 8.3)
  tail: { shape: 'square', angle: 9, fan: 140 },
  perch: { radius: 0.0175 },
  // the research's double crest, a tuft at the crown and one at the occiput, lying back along the head and raised 35°
  // (belted-kingfisher.md, section 5.2: 30-40°), its top about 20 mm above the eye's centre lowered and 30 raised
  // (section 10); and its 80 mm fish (section 7.1). Lengths and lies set by eye to those numbers
  parts: [{
    kind: 'crest',
    lobes: [{ at: 'crown', dx: 0.004, length: 0.024, lie: 18 }, { at: 'occiput', dx: -0.002, length: 0.028, lie: -25 }],
    raise: 35,
  }],
  fish: { length: 0.08 },
  plumage: [
    { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#5a7a96', side: '#6f8ba3', bottom: '#f2f0ea' },
    { kind: 'fill', where: { part: 'wingFold' }, color: '#55728c' },
    { kind: 'fill', where: { part: 'bill' }, color: '#2a2a2c' },
    { kind: 'fill', where: { part: 'legs' }, color: '#5c5650' },
    { kind: 'fill', where: { part: 'crest' }, color: '#55728c' },
  ],
  variants: {},
  sources: ['test fixture'],
}

export const TEST_PERCHER_SPEC: SpeciesSpec = parseSpeciesSpec({
  ...TEST_SPEC, code: 'testpercher', commonName: 'Test Percher', length: 0.325, posture: 'perched', detail: TEST_PERCHER_DETAIL,
})

/**
 * The test percher with a wing to fly on: the Belted Kingfisher's planform, strokes and fold
 * (docs/research/2026-09-30-kingfisher-flight-and-plunge.md). The outline is the research's traced station table
 * (section 2.3) at its half-span of 1.47 × the wing chord, 0.241 m, the wrist at 0.37 of it (section 2.4), and the outer
 * five primaries parting over the last 12% (section 2.3: slots 15-25 mm). The strokes are its estimates (sections 3.3,
 * 4.3 and 8): a beat of 100° (+55° to −45°), a hover of 120° sweeping about ±18° (the hover table's −15° to +20°) with
 * its hand bent less, and a glide on half-closed wings (the inner wing back 12°, the hand back 30° more). Its pitch is
 * the fixture's trunk, tail base to neck base, 45° above level. The fold's turns are set by eye on the wing drawn
 * through its fold: the inner wing swept 90° back and twisted 90° leading edge down, so it lies back along the flank
 * with its upper face out, and the hand swept 10° further. A hand twisted with it, or an inner wing twisted less, held
 * the wing out in a tent over the back for the middle of the fold. Frozen here, so the kingfisher's own tracing never
 * breaks the builder's tests.
 */
export const TEST_FLIER_DETAIL: DetailSpec = {
  ...TEST_PERCHER_DETAIL,
  flight: {
    span: 0.241,
    outline: [
      [0, 0, -0.0986], [0.1, -0.0034, -0.1054], [0.2, -0.0065, -0.1097], [0.3, -0.0065, -0.1114], [0.37, -0.0065, -0.1095],
      [0.5, -0.0002, -0.1032], [0.6, 0.0019, -0.0938], [0.7, 0.0031, -0.0832], [0.8, 0.0084, -0.0646], [0.9, 0.0118, -0.0485],
      [0.95, 0.013, -0.0345], [1, 0.0084, 0.0084],
    ],
    wrist: 0.37,
    fingers: { count: 5, from: 0.88, fill: 0.7 },
    pitch: 45,
    beat: { shoulder: 50, lift: 5, hand: 20, lag: 0.12 },
    hover: { shoulder: 60, lift: 0, hand: 10, lag: 0.1, sweep: 18 },
    glide: { shoulder: 3, hand: -3, sweep: { shoulder: -12, hand: -30 } },
    fold: { sweep: { shoulder: -90, hand: -10 }, twist: { shoulder: -90, hand: 0 } },
  },
}

export const TEST_FLIER_SPEC: SpeciesSpec = parseSpeciesSpec({
  ...TEST_PERCHER_SPEC, code: 'testflier', commonName: 'Test Flier', detail: TEST_FLIER_DETAIL,
})
