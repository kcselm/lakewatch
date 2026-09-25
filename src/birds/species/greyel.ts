import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'greyel',
  commonName: 'Greater Yellowlegs',
  length: 0.31,
  body: { length: 1, height: 0.5, width: 0.42 },
  neck: { length: 0.32, thickness: 0.12, angle: 65 },
  head: { size: 0.26 },
  bill: { length: 0.36, thickness: 0.06, shape: 'pointed' },
  legs: { length: 0.75, thickness: 0.025 },
  tail: { length: 0.12, angle: 0 },
  wing: { length: 0.6, width: 0.28 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#6a6252', cheek: '#a8a292', throat: '#f2f0ea', breast: '#d8d2c4', flank: '#eeeae0',
    back: '#6a6454', wing: '#736c5c', speculum: null, rump: '#f2f0ea', tail: '#c8c2b2',
    bill: '#2a2a2a', legs: '#e8c22a', eye: '#111111',
  },
  variants: {},
  marks: {
    size: 'a tall, lanky shorebird, about twice the weight of a Lesser Yellowlegs',
    bill: 'a long, thick-based bill about one and a half times the length of the head, often faintly upturned, greyish at the base',
    head: 'a white eye-ring on a finely streaked grey head',
    body: 'spangled brown-grey above; crisp dark streaks on the neck and breast and barred flanks',
    legs: 'long bright yellow legs',
  },
  wingbeatHz: 5,
  detail: {
    measurements: {
      length: 0.31, culmen: 0.056, billDepth: 0.0065, billWidth: 0.005,
      tarsus: 0.061, tibia: 0.035, toe: 0.035, wingChord: 0.188, tail: 0.077,
    },
    // traced from public/media/photos/greyel.jpg at 0.68 mm per pixel (the 56 mm bill spans 82.5 px), hip at (270, 307);
    // occiput to billBase follow an even arc from the nape, since the photo's own head turn is tighter than the
    // throat is deep and would crease the chin (species.test.ts holds every species' worst fold at 0)
    profile: [
      { label: 'rear',     x: -0.0884, y: -0.0163, up: 0.0048, down: 0.0048, halfWidth: 0.0045 },
      { label: 'rump',     x: -0.0714, y: -0.0150, up: 0.0088, down: 0.0082, halfWidth: 0.0075 },
      { label: 'tailBase', x: -0.0442, y: -0.0102, up: 0.0184, down: 0.0170, halfWidth: 0.0150 },
      { label: 'hip',      x: 0,       y: 0,       up: 0.0333, down: 0.0333, halfWidth: 0.0220 },
      { label: 'flank',    x: 0.0306,  y: 0.0082,  up: 0.0360, down: 0.0374, halfWidth: 0.0235 },
      { label: 'breast',   x: 0.0544,  y: 0.0212,  up: 0.0278, down: 0.0306, halfWidth: 0.0210 },
      { label: 'neckBase', x: 0.0694,  y: 0.0456,  up: 0.0136, down: 0.0136, halfWidth: 0.0120 },
      { label: 'neckMid',  x: 0.0755,  y: 0.0728,  up: 0.0102, down: 0.0102, halfWidth: 0.0092 },
      { label: 'nape',     x: 0.0790,  y: 0.1020,  up: 0.0102, down: 0.0102, halfWidth: 0.0092 },
      { label: 'occiput',  x: 0.0851,  y: 0.1165,  up: 0.0109, down: 0.0095, halfWidth: 0.0105 },
      { label: 'crown',    x: 0.0911,  y: 0.1218,  up: 0.0136, down: 0.0122, halfWidth: 0.0112 },
      { label: 'eye',      x: 0.0964,  y: 0.1245,  up: 0.0129, down: 0.0122, halfWidth: 0.0110 },
      { label: 'lores',    x: 0.1092,  y: 0.1260,  up: 0.0082, down: 0.0068, halfWidth: 0.0068 },
      { label: 'billBase', x: 0.1160,  y: 0.1236,  up: 0.0033, down: 0.0033, halfWidth: 0.0025 },
    ],
    rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
    bill: { taper: 1.2, curve: 0.04 },
    eye: { radius: 0.0027, t: 0.45, iris: '#2a1f18' },
    wing: {
      wrist: [0.0496, 0.0483], droop: 19.4,
      outline: [[0, 0.05], [0.16, 0.17], [0.36, 0.18], [0.55, 0.16], [0.74, 0.094], [0.93, 0.036], [1, 0.01]],
    },
    tail: { shape: 'square' },
    // juvenile, late September
    plumage: [
      // grey-brown above, white below
      { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#5f5647', side: '#8f887a', bottom: '#f4f2ed' },
      { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'breast', band: [0.7, 1] }, color: '#f5f3ee', soft: 5 },
      // paler, greyer neck and head with a whitish throat
      { kind: 'base', where: { part: 'skin', from: 'neckBase', to: 'billBase' }, top: '#6c6455', side: '#b1ab9d', bottom: '#f1efe9', soft: 6 },
      // crisp dark streaks down the neck onto the upper breast
      { kind: 'streaks', where: { part: 'skin', from: 'breast', to: 'eye', band: [0.3, 0.85] }, color: '#3e382e', length: 3.2, width: 0.9, spacing: 2.2, blur: 0.2, soft: 3 },
      // dusky bars on the flanks
      { kind: 'bars', where: { part: 'skin', from: 'tailBase', to: 'flank', band: [0.52, 0.72] }, color: '#5d574b', width: 1.0, spacing: 4, angle: 12, blur: 0.4, soft: 5, opacity: 0.6 },
      // spangled back and scapulars: dark feathers, white notches
      { kind: 'feathers', where: { part: 'skin', from: 'rear', to: 'neckBase', band: [0, 0.4] }, length: 9, width: 6, center: '#4a4236', edge: '#857d6d', edgeWidth: 0.8, notch: { color: '#f2efe6', size: 1.4, count: 4 }, soft: 3 },
      // darker crown, finely streaked white
      { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'lores', band: [0, 0.22] }, color: '#51493b', soft: 2 },
      { kind: 'streaks', where: { part: 'skin', from: 'occiput', to: 'lores', band: [0, 0.22] }, color: '#e6e2d8', length: 2.2, width: 0.5, spacing: 1.6, blur: 0.2, soft: 2 },
      // pale supraloral over dark lores, white eye-ring
      { kind: 'stripe', from: { at: 'lores', t: 0.28 }, to: { at: 'eye', t: 0.3 }, width: 1.6, color: '#efece4', blur: 0.4 },
      { kind: 'stripe', from: { at: 'billBase', t: 0.5 }, to: { at: 'eye', t: 0.45 }, width: 1.2, color: '#5a5245', blur: 0.4 },
      { kind: 'ring', at: { at: 'eye', t: 0.45 }, radius: 3.3, width: 1.0, color: '#f7f6f2', blur: 0.2 },
      // folded wing: notched coverts and tertials, dark primaries
      { kind: 'fill', where: { part: 'wingFold' }, color: '#554c3e' },
      { kind: 'feathers', where: { part: 'wingFold', s: [0, 0.64] }, length: 12, width: 8, center: '#4a4236', edge: '#8a8272', edgeWidth: 0.8, notch: { color: '#f1eee5', size: 1.6, count: 5 }, soft: 2 },
      { kind: 'fill', where: { part: 'wingFold', s: [0.64, 1] }, color: '#2e2923', soft: 4 },
      // spread wing: plain dark above, pale grey below
      { kind: 'gradient', where: { part: 'wingSpread' }, axis: 's', from: 0.5, to: 1, colorA: '#4e463a', colorB: '#2c2721' },
      { kind: 'fill', where: { part: 'wingUnder' }, color: '#b9b4aa' },
      // white tail with dark bars
      { kind: 'fill', where: { part: 'tail' }, color: '#f3f1ec' },
      { kind: 'bars', where: { part: 'tail', s: [0.25, 1] }, color: '#6a6254', width: 1.6, spacing: 5, angle: 0, blur: 0.4 },
      { kind: 'fill', where: { part: 'tailUnder' }, color: '#eeece6' },
      // dark bill with a grey base to the lower mandible
      { kind: 'fill', where: { part: 'bill' }, color: '#26231f' },
      { kind: 'gradient', where: { part: 'bill', t: [0.5, 1] }, axis: 's', from: 0.05, to: 0.45, colorA: '#7e807a', colorB: '#26231f' },
      { kind: 'fill', where: { part: 'legs' }, color: '#e3c02a' },
    ],
    variants: {},
    sources: [
      'Ridgway 1919, Bull. U.S. Natl. Mus. 50(8) p. 332 (culmen, tarsus, toe, wing, tail)',
      'Ruthrauff et al. 2023, USGS adult shorebird measurements (culmen, total head, tarsus)',
      'Tobias et al. 2022, AVONET (bill depth and width)',
      'All About Birds, Greater Yellowlegs identification (length, field marks)',
      'Bent 1927, Bull. U.S. Natl. Mus. 142 p. 325 (juvenal plumage)',
      'profile traced from public/media/photos/greyel.jpg (c) Quinten Wiegersma, CC BY',
    ],
  },
}
