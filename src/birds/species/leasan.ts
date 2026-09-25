import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'leasan',
  commonName: 'Least Sandpiper',
  length: 0.15,
  body: { length: 1, height: 0.55, width: 0.45 },
  neck: { length: 0.12, thickness: 0.16, angle: 45 },
  head: { size: 0.3 },
  bill: { length: 0.16, thickness: 0.05, shape: 'pointed' },
  legs: { length: 0.28, thickness: 0.02 },
  tail: { length: 0.15, angle: 0 },
  wing: { length: 0.4, width: 0.2 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#6e5a3a', cheek: '#a89070', throat: '#f0ece0', breast: '#c9b89a', flank: '#f0ece2',
    back: '#6a5636', wing: '#7a6440', speculum: null, rump: '#6a5636', tail: '#5a4830',
    bill: '#1f1f1f', legs: '#b8b03a', eye: '#111111',
  },
  variants: {},
  marks: {
    size: 'the smallest sandpiper, sparrow-sized',
    bill: 'a short thin bill with a slight droop',
    head: 'a brown head with a faint pale eyebrow',
    body: 'brown above with a streaked breast, crouched low',
    legs: 'yellow-green legs (the other small sandpipers have black legs)',
  },
  wingbeatHz: 9,
  foraging: 'sandpiper',
  detail: {
    measurements: {
      length: 0.13, culmen: 0.018, billDepth: 0.0034, billWidth: 0.0025,
      tarsus: 0.0185, tibia: 0.009, toe: 0.016, wingChord: 0.086, tail: 0.038,
    },
    // traced from public/media/photos/leasan.jpg (800 px) at 0.247 mm per pixel (the 18 mm culmen spans 73 px), hip
    // at (318, 258); the spine runs low through the short, hunched neck and the head, so the loft never creases
    profile: [
      { label: 'rear',     x: -0.0538, y: 0.0062, up: 0.0033, down: 0.0039, halfWidth: 0.0032 },
      { label: 'rump',     x: -0.0427, y: 0.0044, up: 0.0067, down: 0.0068, halfWidth: 0.0058 },
      { label: 'tailBase', x: -0.0217, y: 0.0015, up: 0.0126, down: 0.0113, halfWidth: 0.0096 },
      { label: 'hip',      x: 0.0000, y: 0.0000, up: 0.0171, down: 0.0162, halfWidth: 0.0110 },
      { label: 'flank',    x: 0.0128, y: 0.0000, up: 0.0178, down: 0.0176, halfWidth: 0.0117 },
      { label: 'breast',   x: 0.0227, y: 0.0010, up: 0.0175, down: 0.0143, halfWidth: 0.0111 },
      { label: 'neckBase', x: 0.0301, y: 0.0032, up: 0.0157, down: 0.0114, halfWidth: 0.0101 },
      { label: 'neckMid',  x: 0.0351, y: 0.0052, up: 0.0156, down: 0.0086, halfWidth: 0.0097 },
      { label: 'nape',     x: 0.0385, y: 0.0069, up: 0.0153, down: 0.0073, halfWidth: 0.0096 },
      { label: 'occiput',  x: 0.0410, y: 0.0079, up: 0.0145, down: 0.0072, halfWidth: 0.0092 },
      { label: 'crown',    x: 0.0435, y: 0.0084, up: 0.0135, down: 0.0067, halfWidth: 0.0083 },
      { label: 'eye',      x: 0.0459, y: 0.0086, up: 0.0111, down: 0.0064, halfWidth: 0.0072 },
      { label: 'lores',    x: 0.0487, y: 0.0082, up: 0.0054, down: 0.0055, halfWidth: 0.0044 },
      { label: 'billBase', x: 0.0511, y: 0.0072, up: 0.0015, down: 0.0015, halfWidth: 0.0011 },
    ],
    rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
    bill: { taper: 1.2, curve: -0.03 },
    eye: { radius: 0.0021, t: 0.38, iris: '#2a1c14' },
    wing: {
      wrist: [0.0264, 0.0131], droop: 4.1,
      outline: [[0, 0.06], [0.12, 0.2], [0.3, 0.23], [0.5, 0.2], [0.7, 0.12], [0.9, 0.045], [1, 0.01]],
    },
    tail: { shape: 'square' },
    stepLength: 0.7,
    plumage: [
      // dark above, white below
      { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#4e3b2a', side: '#a48c6c', bottom: '#f7f5ef' },
      { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'breast', band: [0.6, 1] }, color: '#f7f5ef', soft: 3 },
      // a buffy, indistinctly streaked breast band, ending cleanly against the white belly
      { kind: 'fill', where: { part: 'skin', from: 'breast', to: 'neckMid', band: [0.45, 1] }, color: '#cfb592', soft: 1.5 },
      { kind: 'streaks', where: { part: 'skin', from: 'breast', to: 'nape', band: [0.4, 0.95] }, color: '#8a7054', length: 1.6, width: 0.5, spacing: 1.4, blur: 0.5, soft: 1.5, opacity: 0.5 },
      // mantle and scapulars: blackish centres, bright rufous edges, some with white tips
      { kind: 'feathers', where: { part: 'skin', from: 'rump', to: 'neckBase', band: [0, 0.45] }, length: 7, width: 5.5, center: '#2e2219', edge: '#b96c33', edgeWidth: 1.3, notch: { color: '#efe9dd', size: 0.8, count: 1 }, soft: 2 },
      // the white tips line up into pale lines along the mantle
      { kind: 'stripe', from: { at: 'hip', t: 0.2 }, to: { at: 'neckBase', t: 0.16 }, width: 0.9, color: '#f0ebe0', blur: 0.4, opacity: 0.85 },
      // a dark cap streaked rufous
      { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'lores', band: [0, 0.24] }, color: '#3a2a1e', soft: 1.5 },
      { kind: 'streaks', where: { part: 'skin', from: 'nape', to: 'lores', band: [0, 0.24] }, color: '#b0662e', length: 1.4, width: 0.4, spacing: 1.0, blur: 0.2, soft: 1.5 },
      // pale supercilium, strongest in front; dark loral line; grey-brown cheek; pale throat
      { kind: 'stripe', from: { at: 'lores', t: 0.26 }, to: { at: 'occiput', t: 0.28 }, width: 1.4, color: '#e9e3d7', blur: 0.4 },
      { kind: 'stripe', from: { at: 'billBase', t: 0.5 }, to: { at: 'eye', t: 0.4 }, width: 0.8, color: '#4a3a2c', blur: 0.3 },
      { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'eye', band: [0.34, 0.55] }, color: '#9b8870', soft: 1.5 },
      { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'billBase', band: [0.7, 1] }, color: '#f1ede4', soft: 1.5 },
      // folded wing: coverts and tertials dark-centred with rufous-buff edges, blackish primaries
      { kind: 'fill', where: { part: 'wingFold' }, color: '#33271d' },
      { kind: 'feathers', where: { part: 'wingFold', s: [0, 0.75] }, length: 7, width: 5.5, center: '#33271d', edge: '#c69058', edgeWidth: 1.1, soft: 1.5 },
      { kind: 'fill', where: { part: 'wingFold', s: [0.8, 1] }, color: '#1f1915', soft: 3 },
      { kind: 'gradient', where: { part: 'wingSpread' }, axis: 's', from: 0.4, to: 1, colorA: '#5a4838', colorB: '#241d18' },
      { kind: 'fill', where: { part: 'wingUnder' }, color: '#ece8e0' },
      // tail: dusky down the middle, grey-brown outer feathers
      { kind: 'fill', where: { part: 'tail' }, color: '#8a7f72' },
      { kind: 'fill', where: { part: 'tail', t: [0.35, 0.65] }, color: '#3a3028', soft: 1 },
      { kind: 'fill', where: { part: 'tailUnder' }, color: '#d9d4cb' },
      { kind: 'fill', where: { part: 'bill' }, color: '#1c1a18' },
      { kind: 'fill', where: { part: 'legs' }, color: '#a09a3e' },
    ],
    variants: {},
    sources: [
      'Ridgway 1919, Bull. U.S. Natl. Mus. 50(8) p. 295 (culmen, tarsus, toe, wing, tail); p. 267 (bill and tail shape)',
      'Ruthrauff et al. 2023, USGS adult shorebird measurements (culmen, total head)',
      'Tobias et al. 2022, AVONET (bill depth and width)',
      'Bent 1927, Bull. U.S. Natl. Mus. 142 pp. 205-208 (juvenal plumage, leg colour)',
      'Cox 2008 (structure, feeding posture)',
      'profile traced from public/media/photos/leasan.jpg (c) Greg Lasley, CC BY-NC: a spring adult, traced for structure only',
      'juvenal plumage from "Least sandpiper (03342).jpg" (c) Rhododendrites, CC BY-SA 4.0, https://commons.wikimedia.org/wiki/File:Least_sandpiper_(03342).jpg',
      'numbers and marks: docs/research/2026-09-25-killdeer-least-sandpiper.md',
    ],
  },
}
