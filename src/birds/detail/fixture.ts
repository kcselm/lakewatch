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
