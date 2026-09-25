import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'killde',
  commonName: 'Killdeer',
  length: 0.25,
  body: { length: 1, height: 0.5, width: 0.45 },
  neck: { length: 0.18, thickness: 0.2, angle: 60 },
  head: { size: 0.34 },
  bill: { length: 0.14, thickness: 0.06, shape: 'pointed' },
  legs: { length: 0.38, thickness: 0.03 },
  tail: { length: 0.3, angle: 5 },
  wing: { length: 0.55, width: 0.25 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#6b5638', cheek: '#f3efe6', throat: '#1c1c1c', breast: '#f6f3ea', flank: '#efe9dc',
    back: '#7a6444', wing: '#6f5a3c', speculum: null, rump: '#c9782e', tail: '#3a3025',
    bill: '#1a1a1a', legs: '#d9c39a', eye: '#1a1a1a',
  },
  variants: {},
  marks: {
    size: 'robin-sized plover on long legs',
    bill: 'short thin black bill',
    head: 'brown cap, white forehead and collar, with two black bands across the breast',
    body: 'brown back, white belly, rusty orange rump and a long tail',
    legs: 'pale long legs; runs in short bursts and stops',
  },
  wingbeatHz: 7,
  foraging: 'plover',
  detail: {
    measurements: {
      length: 0.22, culmen: 0.020, billDepth: 0.0044, billWidth: 0.0035,
      tarsus: 0.035, tibia: 0.017, toe: 0.0215, wingChord: 0.160, tail: 0.095,
    },
    // traced from the Homler photo (see sources), in a copy 1000 px wide, at 0.318 mm per pixel (the 20.3 mm culmen
    // spans 64 px), hip at (448, 375). The spine runs low through the neck and head, near the throat, so neither the
    // breast-to-neck turn nor the head-to-bill turn creases; the eye's and lores' depths run to the chin line, since
    // a plover's throat runs straight down into its neck
    profile: [
      { label: 'rear',     x: -0.0789, y: -0.0067, up: 0.0079, down: 0.0013, halfWidth: 0.0041 },
      { label: 'rump',     x: -0.0614, y: -0.0054, up: 0.0118, down: 0.0051, halfWidth: 0.0072 },
      { label: 'tailBase', x: -0.0353, y: -0.0035, up: 0.0183, down: 0.0173, halfWidth: 0.0142 },
      { label: 'hip',      x: 0.0000, y: 0.0000, up: 0.0250, down: 0.0283, halfWidth: 0.0176 },
      { label: 'flank',    x: 0.0172, y: 0.0045, up: 0.0252, down: 0.0292, halfWidth: 0.0180 },
      { label: 'breast',   x: 0.0273, y: 0.0102, up: 0.0240, down: 0.0241, halfWidth: 0.0168 },
      { label: 'neckBase', x: 0.0340, y: 0.0172, up: 0.0223, down: 0.0163, halfWidth: 0.0154 },
      { label: 'neckMid',  x: 0.0391, y: 0.0239, up: 0.0227, down: 0.0099, halfWidth: 0.0139 },
      { label: 'nape',     x: 0.0423, y: 0.0315, up: 0.0234, down: 0.0069, halfWidth: 0.0129 },
      { label: 'occiput',  x: 0.0445, y: 0.0388, up: 0.0242, down: 0.0069, halfWidth: 0.0132 },
      { label: 'crown',    x: 0.0467, y: 0.0448, up: 0.0241, down: 0.0087, halfWidth: 0.0135 },
      { label: 'eye',      x: 0.0496, y: 0.0493, up: 0.0191, down: 0.0076, halfWidth: 0.0107 },
      { label: 'lores',    x: 0.0541, y: 0.0512, up: 0.0090, down: 0.0051, halfWidth: 0.0053 },
      { label: 'billBase', x: 0.0591, y: 0.0490, up: 0.0022, down: 0.0022, halfWidth: 0.0016 },
    ],
    rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
    bill: { taper: 0.6, curve: 0 },
    // the visible eye is 7.5-7.7 mm across inside a 1 mm orange-red eyelid ring
    eye: { radius: 0.0051, t: 0.39, iris: '#2b1a10', lid: { color: '#e0452a', width: 0.001 } },
    wing: {
      wrist: [0.0388, 0.0137], droop: 7.2,
      outline: [[0, 0.03], [0.1, 0.07], [0.25, 0.085], [0.45, 0.075], [0.65, 0.05], [0.85, 0.022], [1, 0.005]],
    },
    tail: { shape: 'wedge' },
    stepLength: 0.7,
    plumage: [
      // grey-brown above, white below
      { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#74604a', side: '#86735c', bottom: '#f7f6f2' },
      { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'neckBase', band: [0.55, 1] }, color: '#f7f6f2', soft: 4 },
      // ochraceous rump, mostly hidden under the folded wings at rest
      { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'rump', band: [0, 0.2] }, color: '#c8782f', soft: 2 },
      // back and scapulars: grey-brown feathers with slightly paler fringes
      { kind: 'feathers', where: { part: 'skin', from: 'tailBase', to: 'neckBase', band: [0, 0.45] }, length: 11, width: 8, center: '#6f5b45', edge: '#7e6a52', edgeWidth: 0.7, soft: 3 },
      // head: grey-brown crown, nape and cheeks; white throat
      { kind: 'base', where: { part: 'skin', from: 'nape', to: 'billBase' }, top: '#6f5b45', side: '#6f5b45', bottom: '#f7f6f2', soft: 3 },
      { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'billBase', band: [0.62, 1] }, color: '#f7f6f2', soft: 2 },
      // a white collar round the hindneck, then the upper black band, a full ring, broader at the front
      { kind: 'stripe', from: { at: 'nape', t: 0, dx: 4.5 }, to: { at: 'nape', t: 1, dx: 4.5 }, width: 5, color: '#f7f6f2', blur: 0.4 },
      { kind: 'stripe', from: { at: 'neckMid', t: 0, dx: 6.7 }, to: { at: 'neckMid', t: 1, dx: 6.7 }, width: 5.5, color: '#161412', blur: 0.4 },
      { kind: 'stripe', from: { at: 'neckMid', t: 0.5, dx: 6.7 }, to: { at: 'neckMid', t: 1, dx: 6.7 }, width: 8, color: '#161412', blur: 0.4 },
      // below a white bar, the broader lower band across the chest only, ending at the bend of the wing
      { kind: 'stripe', from: { at: 'neckBase', t: 0.5, dx: 1.4 }, to: { at: 'neckBase', t: 1, dx: 1.4 }, width: 9, color: '#161412', blur: 0.4 },
      // face: white forehead, black bar across the forecrown, black loral line, white stripe behind the eye
      { kind: 'fill', where: { part: 'skin', from: 'lores', to: 'billBase', band: [0, 1] }, color: '#f7f6f2', soft: 1.5 },
      { kind: 'stripe', from: { at: 'eye', t: 0, dx: 2.5 }, to: { at: 'eye', t: 0.24, dx: 2.5 }, width: 3, color: '#161412', blur: 0.3 },
      { kind: 'stripe', from: { at: 'eye', t: 0.31, dx: -1 }, to: { at: 'eye', t: 0.28, dx: -7 }, width: 2.2, color: '#f7f6f2', blur: 0.4 },
      { kind: 'stripe', from: { at: 'billBase', t: 0.5 }, to: { at: 'eye', t: 0.36, dx: 3 }, width: 1.3, color: '#161412', blur: 0.3 },
      // folded wing: grey-brown coverts and tertials with paler fringes, blackish primaries
      { kind: 'fill', where: { part: 'wingFold' }, color: '#6f5b45' },
      { kind: 'feathers', where: { part: 'wingFold', s: [0, 0.6] }, length: 12, width: 8, center: '#6c5842', edge: '#7c6850', edgeWidth: 0.7, soft: 2 },
      { kind: 'fill', where: { part: 'wingFold', s: [0.62, 1] }, color: '#2a2520', soft: 4 },
      // spread wing: dark with a white stripe; white below
      { kind: 'gradient', where: { part: 'wingSpread' }, axis: 's', from: 0.4, to: 1, colorA: '#6a5640', colorB: '#2a2520' },
      { kind: 'fill', where: { part: 'wingSpread', s: [0.25, 0.9], t: [0.58, 0.68] }, color: '#f2efe8', soft: 1 },
      { kind: 'fill', where: { part: 'wingUnder' }, color: '#f0ede6' },
      // tail: ochraceous-buff fading paler at the sides, grey-brown down the middle, a black subterminal bar and white tips
      { kind: 'fill', where: { part: 'tail' }, color: '#c98a4a' },
      { kind: 'gradient', where: { part: 'tail', t: [0, 0.3] }, axis: 't', from: 0, to: 0.3, colorA: '#e8d6bc', colorB: '#c98a4a' },
      { kind: 'gradient', where: { part: 'tail', t: [0.7, 1] }, axis: 't', from: 0.7, to: 1, colorA: '#c98a4a', colorB: '#e8d6bc' },
      { kind: 'fill', where: { part: 'tail', s: [0, 0.7], t: [0.38, 0.62] }, color: '#76624c', soft: 1 },
      { kind: 'fill', where: { part: 'tail', s: [0.72, 0.88] }, color: '#1a1614', soft: 0.5 },
      { kind: 'fill', where: { part: 'tail', s: [0.88, 1] }, color: '#f2efe8', soft: 0.5 },
      { kind: 'fill', where: { part: 'tailUnder' }, color: '#e8e2d8' },
      { kind: 'fill', where: { part: 'bill' }, color: '#161412' },
      { kind: 'fill', where: { part: 'legs' }, color: '#c9b3a0' },
    ],
    variants: {},
    sources: [
      'Ridgway 1919, Bull. U.S. Natl. Mus. 50(8) p. 100 (culmen, tarsus, toe, wing, tail); pp. 98-99 (bill, tail, and leg shape)',
      'Tobias et al. 2022, AVONET (bill depth and width)',
      'All About Birds, Killdeer identification (length, field marks)',
      'Bent 1929, Bull. U.S. Natl. Mus. 146 pp. 209-212 (plumage, feeding)',
      'profile traced from "Killdeer Heislerville.png" (c) Charles Homler, CC BY-SA 4.0, https://commons.wikimedia.org/wiki/File:Killdeer_Heislerville.png',
      'numbers and marks: docs/research/2026-09-25-killdeer-least-sandpiper.md',
    ],
  },
}
