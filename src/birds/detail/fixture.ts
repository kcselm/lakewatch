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
 * A test goose for the amphibious builder: about a Canada Goose's size (docs/research/2026-09-30-canada-goose.md,
 * sections 2 and 6: a 0.64 m bird floating with its back 0.13 m above the water, its crown about 0.25 m, a draft of
 * 0.06 m; tarsus 92 mm, toe 82 mm), its neck a five-joint chain in a short S, floating on its waterline 35 mm below the
 * traced spine and standing on webbed feet, with a waddle. Its shapes are set by eye for the builder's tests, not traced.
 */
export const TEST_GOOSE_DETAIL: DetailSpec = {
  measurements: {
    length: 0.69, culmen: 0.056, billDepth: 0.024, billWidth: 0.022,
    tarsus: 0.092, tibia: 0.015, toe: 0.082, wingChord: 0.489, tail: 0.151,
  },
  profile: [
    { label: 'rear',     x: -0.235, y: 0.050, up: 0.006, down: 0.020, halfWidth: 0.020 },
    { label: 'rump',     x: -0.220, y: 0.045, up: 0.028, down: 0.050, halfWidth: 0.055 },
    { label: 'tailBase', x: -0.195, y: 0.035, up: 0.050, down: 0.075, halfWidth: 0.085 },
    { label: 'hip',      x: -0.030, y: 0.000, up: 0.100, down: 0.095, halfWidth: 0.120 },
    { label: 'flank',    x: 0.080,  y: 0.000, up: 0.098, down: 0.095, halfWidth: 0.120 },
    { label: 'breast',   x: 0.155,  y: 0.010, up: 0.072, down: 0.088, halfWidth: 0.100, tilt: 6 },
    { label: 'neckBase', x: 0.215,  y: 0.062, up: 0.028, down: 0.058, halfWidth: 0.048, tilt: 10 },
    { label: 'neckLow',  x: 0.238,  y: 0.112, up: 0.025, down: 0.030, halfWidth: 0.030 },
    { label: 'neckUp',   x: 0.225,  y: 0.175, up: 0.024, down: 0.026, halfWidth: 0.025 },
    { label: 'nape',     x: 0.240,  y: 0.215, up: 0.022, down: 0.023, halfWidth: 0.023 },
    { label: 'occiput',  x: 0.262,  y: 0.226, up: 0.022, down: 0.020, halfWidth: 0.023 },
    { label: 'crown',    x: 0.277,  y: 0.229, up: 0.024, down: 0.020, halfWidth: 0.024 },
    { label: 'eye',      x: 0.291,  y: 0.226, up: 0.020, down: 0.020, halfWidth: 0.023 },
    { label: 'lores',    x: 0.304,  y: 0.219, up: 0.014, down: 0.016, halfWidth: 0.016 },
    { label: 'billBase', x: 0.312,  y: 0.215, up: 0.011, down: 0.012, halfWidth: 0.011 },
  ],
  rig: {
    neckBase: 'neckBase', neckMid: 'neckLow', head: 'occiput', hip: 'hip', tailBase: 'tailBase',
    neck: ['neckBase', 'neckLow', 'neckUp', 'nape', 'occiput'],
  },
  neckShapes: {
    hunch: [-10, 20, -15, 0, 5],
    erect: [25, -36, 32, 43, -43],
    strike: [-20, -37, 15, 30, -20],
  },
  bill: { taper: 0.8, curve: -0.01 },
  eye: { radius: 0.005, t: 0.4, iris: '#2a1c12' },
  wing: {
    wrist: [0.1, 0.05], droop: 8,
    outline: [[0, 0], [0.25, 0.05], [0.4, 0.09], [0.6, 0.09], [0.8, 0.06], [0.95, 0.02], [1, 0.005]],
  },
  tail: { shape: 'rounded', angle: 5 },
  feet: 'webbed',
  float: { waterline: -0.035 },
  amphibious: true,
  waddle: 5,
  // the longest step this leg (0.17 m from hip to foot) takes without its stance foot sliding: 0.11 m
  stepLength: 0.65,
  plumage: [
    { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#6b5d4c', side: '#8a7b66', bottom: '#d9d2c4' },
    { kind: 'fill', where: { part: 'skin', from: 'neckBase', to: 'billBase' }, color: '#161616' },
    { kind: 'fill', where: { part: 'wingFold' }, color: '#6a5e4e' },
    { kind: 'fill', where: { part: 'bill' }, color: '#141414' },
    { kind: 'fill', where: { part: 'legs' }, color: '#1a1a1a' },
  ],
  variants: {},
  sources: ['test fixture'],
}

export const TEST_GOOSE_SPEC: SpeciesSpec = parseSpeciesSpec({
  ...TEST_SPEC, code: 'testgoose', commonName: 'Test Goose', length: 0.69, posture: 'swimming', draft: 0.3, detail: TEST_GOOSE_DETAIL,
})

/**
 * A test bird made in Blender for the authored loader's tests: scripts/blender/testbird/build.py writes it, a small
 * swimmer of primitives (testbird.glb beside this file), floating with its legs standing, a six-joint neck chain, and a
 * flight wing. Each part is weighted wholly to one bone. Its numbers are the script's, not a species'.
 */
export const TEST_AUTHORED_SPEC: SpeciesSpec = parseSpeciesSpec({
  ...TEST_SPEC, detail: undefined, code: 'testauthored', commonName: 'Test Authored Bird', length: 0.45, posture: 'swimming', draft: 0.5,
  variants: { adult: {}, juvenile: {} },
  authored: {
    model: 'testbird',
    versions: ['adult', 'juvenile'],
    measurements: {
      length: 0.45, culmen: 0.05, billDepth: 0.016, billWidth: 0.016,
      tarsus: 0.07, tibia: 0.01, toe: 0.05, wingChord: 0.18, tail: 0.07,
    },
    neck: 7,
    neckShapes: { hunch: [-20, 10, 10, 0, 0, 0, 0], erect: [10, -5, -5, 0, 0, 0, 0], strike: [-30, -10, 0, 0, 0, 0, 0] },
    amphibious: true,
    flight: {
      beat: { shoulder: 40, lift: 5, hand: 20, lag: 0.1 }, glide: { shoulder: 3, hand: -5 },
      dry: { shoulder: 30, sweep: 25, hand: -60, handSweep: 20 },
    },
    sources: ['test fixture'],
  },
})
