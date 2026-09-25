import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'lesyel',
  commonName: 'Lesser Yellowlegs',
  length: 0.25,
  body: { length: 1, height: 0.48, width: 0.4 },
  neck: { length: 0.32, thickness: 0.11, angle: 65 },
  head: { size: 0.25 },
  bill: { length: 0.28, thickness: 0.045, shape: 'pointed' },
  legs: { length: 0.78, thickness: 0.022 },
  tail: { length: 0.12, angle: 0 },
  wing: { length: 0.62, width: 0.27 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#5e574a', cheek: '#aaa497', throat: '#f2f0ea', breast: '#d2ccbf', flank: '#f0ede5',
    back: '#655f50', wing: '#6e6758', speculum: null, rump: '#f2f0ea', tail: '#c8c2b2',
    bill: '#222020', legs: '#e8c22a', eye: '#111111',
  },
  variants: {},
  marks: {
    size: 'a slim, dainty shorebird, clearly smaller when it stands beside a Greater Yellowlegs',
    bill: 'a thin, straight, all-dark bill only a little longer than the head',
    head: 'a white eye-ring on a small head with a slightly capped look',
    body: 'finely spotted brown-grey above; fine, blurry streaks on the breast and plain white flanks',
    legs: 'long bright yellow legs, long for its size',
  },
  wingbeatHz: 6,
  detail: {
    measurements: {
      length: 0.25, culmen: 0.036, billDepth: 0.0043, billWidth: 0.003,
      tarsus: 0.051, tibia: 0.029, toe: 0.029, wingChord: 0.155, tail: 0.063,
    },
    // the Greater's traced outline at 0.81 (positions) and 0.79 (girth): Lesser is about a 1.2x scale-down
    // everywhere but the bill, and half the mass
    profile: [
      { label: 'rear',     x: -0.0716, y: -0.0132, up: 0.0038, down: 0.0038, halfWidth: 0.0036 },
      { label: 'rump',     x: -0.0578, y: -0.0122, up: 0.0070, down: 0.0065, halfWidth: 0.0059 },
      { label: 'tailBase', x: -0.0358, y: -0.0083, up: 0.0145, down: 0.0134, halfWidth: 0.0118 },
      { label: 'hip',      x: 0,       y: 0,       up: 0.0263, down: 0.0263, halfWidth: 0.0174 },
      { label: 'flank',    x: 0.0248, y: 0.0066, up: 0.0284, down: 0.0295, halfWidth: 0.0186 },
      { label: 'breast',   x: 0.0441, y: 0.0172, up: 0.0220, down: 0.0242, halfWidth: 0.0166 },
      { label: 'neckBase', x: 0.0562, y: 0.0369, up: 0.0107, down: 0.0107, halfWidth: 0.0095 },
      { label: 'neckMid',  x: 0.0612, y: 0.0590, up: 0.0081, down: 0.0081, halfWidth: 0.0073 },
      { label: 'nape',     x: 0.0640, y: 0.0826, up: 0.0081, down: 0.0081, halfWidth: 0.0073 },
      { label: 'occiput',  x: 0.0689, y: 0.0944, up: 0.0086, down: 0.0075, halfWidth: 0.0083 },
      { label: 'crown',    x: 0.0738, y: 0.0987, up: 0.0107, down: 0.0096, halfWidth: 0.0088 },
      { label: 'eye',      x: 0.0781, y: 0.1008, up: 0.0102, down: 0.0096, halfWidth: 0.0087 },
      { label: 'lores',    x: 0.0885, y: 0.1021, up: 0.0065, down: 0.0054, halfWidth: 0.0054 },
      { label: 'billBase', x: 0.0940, y: 0.1001, up: 0.0022, down: 0.0022, halfWidth: 0.0015 },
    ],
    rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
    bill: { taper: 0.9, curve: 0 },
    eye: { radius: 0.0023, t: 0.45, iris: '#2a1f18' },
    wing: {
      wrist: [0.0372, 0.0391], droop: 19.4,
      outline: [[0, 0.05], [0.16, 0.17], [0.36, 0.18], [0.55, 0.16], [0.74, 0.094], [0.93, 0.036], [1, 0.01]],
    },
    tail: { shape: 'square' },
    // juvenile, late September
    plumage: [
      { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#5c5546', side: '#958e80', bottom: '#f4f2ed' },
      { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'breast', band: [0.7, 1] }, color: '#f5f3ee', soft: 5 },
      { kind: 'base', where: { part: 'skin', from: 'neckBase', to: 'billBase' }, top: '#665f51', side: '#b7b1a4', bottom: '#f1efe9', soft: 6 },
      // a soft grey-brown wash on the breast, with fine, pale, blurry streaks
      { kind: 'fill', where: { part: 'skin', from: 'breast', to: 'neckMid', band: [0.4, 0.7] }, color: '#c9c3b6', soft: 5, opacity: 0.5 },
      { kind: 'streaks', where: { part: 'skin', from: 'breast', to: 'eye', band: [0.3, 0.8] }, color: '#80796b', length: 2.4, width: 0.6, spacing: 2.0, blur: 0.8, soft: 3, opacity: 0.6 },
      // finer, more regular spangling above
      { kind: 'feathers', where: { part: 'skin', from: 'rear', to: 'neckBase', band: [0, 0.4] }, length: 7, width: 5, center: '#4a4236', edge: '#857d6d', edgeWidth: 0.6, notch: { color: '#efe8da', size: 1.0, count: 5 }, soft: 3 },
      // a slightly darker cap, finely streaked
      { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'lores', band: [0, 0.26] }, color: '#4a4336', soft: 2 },
      { kind: 'streaks', where: { part: 'skin', from: 'occiput', to: 'lores', band: [0, 0.26] }, color: '#dcd7cc', length: 1.8, width: 0.4, spacing: 1.4, blur: 0.2, soft: 2, opacity: 0.8 },
      { kind: 'stripe', from: { at: 'lores', t: 0.28 }, to: { at: 'eye', t: 0.3 }, width: 1.3, color: '#efece4', blur: 0.4 },
      { kind: 'stripe', from: { at: 'billBase', t: 0.5 }, to: { at: 'eye', t: 0.45 }, width: 1.0, color: '#5a5245', blur: 0.4 },
      { kind: 'ring', at: { at: 'eye', t: 0.45 }, radius: 2.9, width: 0.9, color: '#f7f6f2', blur: 0.2 },
      { kind: 'fill', where: { part: 'wingFold' }, color: '#554c3e' },
      { kind: 'feathers', where: { part: 'wingFold', s: [0, 0.64] }, length: 9, width: 6.5, center: '#4a4236', edge: '#8a8272', edgeWidth: 0.6, notch: { color: '#eee8dc', size: 1.1, count: 6 }, soft: 2 },
      { kind: 'fill', where: { part: 'wingFold', s: [0.64, 1] }, color: '#2e2923', soft: 4 },
      { kind: 'gradient', where: { part: 'wingSpread' }, axis: 's', from: 0.5, to: 1, colorA: '#4e463a', colorB: '#2c2721' },
      { kind: 'fill', where: { part: 'wingUnder' }, color: '#b9b4aa' },
      { kind: 'fill', where: { part: 'tail' }, color: '#f3f1ec' },
      { kind: 'bars', where: { part: 'tail', s: [0.25, 1] }, color: '#6a6254', width: 1.3, spacing: 4, angle: 0, blur: 0.4 },
      { kind: 'fill', where: { part: 'tailUnder' }, color: '#eeece6' },
      // all-dark bill
      { kind: 'fill', where: { part: 'bill' }, color: '#221f1c' },
      { kind: 'fill', where: { part: 'legs' }, color: '#e6c22c' },
    ],
    variants: {},
    sources: [
      'Ridgway 1919, Bull. U.S. Natl. Mus. 50(8) p. 338 (culmen, tarsus, toe, wing, tail)',
      'Ruthrauff et al. 2023, USGS adult shorebird measurements (culmen, total head, tarsus)',
      'Tobias et al. 2022, AVONET (bill depth and width)',
      'All About Birds, Lesser Yellowlegs identification (length, field marks)',
      'Bent 1927, Bull. U.S. Natl. Mus. 142 p. 339 (juvenal plumage)',
      'outline scaled from the Greater Yellowlegs trace; body depth, body length, and head size checked within a few mm against public/media/photos/lesyel.jpg (c) Jonathan Irons, CC BY-NC; neck posture not traced (that bird walks with its head lowered)',
    ],
  },
}
