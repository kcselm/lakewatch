import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'pecsan',
  commonName: 'Pectoral Sandpiper',
  length: 0.22,
  body: { length: 1, height: 0.5, width: 0.42 },
  neck: { length: 0.2, thickness: 0.15, angle: 50 },
  head: { size: 0.26 },
  bill: { length: 0.2, thickness: 0.05, shape: 'pointed' },
  legs: { length: 0.32, thickness: 0.02 },
  tail: { length: 0.2, angle: 0 },
  wing: { length: 0.45, width: 0.2 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#7e4c26', cheek: '#b89a78', throat: '#f0e9dc', breast: '#cdb08c', flank: '#f4f1ea',
    back: '#5a4330', wing: '#6a4e36', speculum: null, rump: '#2e2620', tail: '#8e8274',
    bill: '#3a3026', legs: '#b3a84a', eye: '#111111',
  },
  variants: {},
  marks: {
    size: 'a medium sandpiper, half as long again as a Least',
    bill: 'a medium bill with a slight droop, dark at the tip and paler at the base',
    head: 'a rufous-streaked cap and a faint pale eyebrow',
    body: 'a finely streaked breast that stops in a sharp line against the white belly; white braces down the back',
    legs: 'dull yellow-olive legs',
  },
  wingbeatHz: 7,
  foraging: 'sandpiper',
  detail: {
    measurements: {
      length: 0.195, culmen: 0.0275, billDepth: 0.005, billWidth: 0.0034,
      tarsus: 0.027, tibia: 0.011, toe: 0.023, wingChord: 0.133, tail: 0.058,
    },
    // traced from "PectoralSandpiper-1OCT2016.jpg" (3823 px, facing left) at 0.090 mm per pixel (the 27.5 mm culmen
    // spans 305 px), hip at (2400, 1200); up and down measured along the spine normal to the bird's silhouette, the
    // spine low through the neck and head
    profile: [
      { label: 'rear',     x: -0.0846, y: 0.0081, up: 0.0029, down: 0.0031, halfWidth: 0.0026 },
      { label: 'rump',     x: -0.0684, y: 0.0063, up: 0.0064, down: 0.0048, halfWidth: 0.0048 },
      { label: 'tailBase', x: -0.0369, y: 0.0009, up: 0.0180, down: 0.0194, halfWidth: 0.0150 },
      { label: 'hip',      x: 0.0000, y: 0.0000, up: 0.0276, down: 0.0279, halfWidth: 0.0183 },
      { label: 'flank',    x: 0.0198, y: 0.0018, up: 0.0277, down: 0.0274, halfWidth: 0.0182 },
      { label: 'breast',   x: 0.0347, y: 0.0077, up: 0.0252, down: 0.0211, halfWidth: 0.0162 },
      { label: 'neckBase', x: 0.0461, y: 0.0153, up: 0.0209, down: 0.0135, halfWidth: 0.0127 },
      { label: 'neckMid',  x: 0.0529, y: 0.0234, up: 0.0158, down: 0.0103, halfWidth: 0.0104 },
      { label: 'nape',     x: 0.0565, y: 0.0306, up: 0.0107, down: 0.0100, halfWidth: 0.0087 },
      { label: 'occiput',  x: 0.0594, y: 0.0347, up: 0.0120, down: 0.0095, halfWidth: 0.0090 },
      { label: 'crown',    x: 0.0632, y: 0.0373, up: 0.0157, down: 0.0089, halfWidth: 0.0101 },
      { label: 'eye',      x: 0.0671, y: 0.0389, up: 0.0152, down: 0.0088, halfWidth: 0.0099 },
      { label: 'lores',    x: 0.0735, y: 0.0387, up: 0.0106, down: 0.0076, halfWidth: 0.0073 },
      { label: 'billBase', x: 0.0787, y: 0.0360, up: 0.0024, down: 0.0024, halfWidth: 0.0018 },
    ],
    rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
    bill: { taper: 1.2, curve: -0.02 },
    eye: { radius: 0.0025, t: 0.36, iris: '#2a1c14' },
    wing: {
      wrist: [0.0369, 0.0135], droop: 1.8,
      outline: [[0, 0.05], [0.12, 0.12], [0.3, 0.13], [0.5, 0.115], [0.7, 0.08], [0.85, 0.04], [1, 0.01]],
    },
    tail: { shape: 'rounded' },
    stepLength: 0.7,
    plumage: [
      // dark above, white below
      { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#57402c', side: '#b0916f', bottom: '#f6f4ee' },
      { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'flank', band: [0.55, 1] }, color: '#f6f4ee', soft: 2 },
      // the bib: buff, finely streaked in rows, stopping in a sharp line on the lower breast
      { kind: 'fill', where: { part: 'skin', from: 'flank', to: 'neckMid', band: [0.42, 1] }, color: '#d8c19e', soft: 0.5 },
      { kind: 'streaks', where: { part: 'skin', from: 'flank', to: 'nape', band: [0.4, 0.98] }, color: '#5a3e26', length: 1.8, width: 0.55, spacing: 1.3, blur: 0.2, soft: 0.5, opacity: 0.85 },
      { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'billBase', band: [0.72, 1] }, color: '#efe8da', soft: 1.2 },
      // mantle and scapulars: black centres, rufous fringes above, buff and white below
      { kind: 'feathers', where: { part: 'skin', from: 'rump', to: 'neckBase', band: [0, 0.34] }, length: 8, width: 6.5, center: '#23180f', edge: '#c0743a', edgeWidth: 1.4, soft: 2 },
      { kind: 'feathers', where: { part: 'skin', from: 'rump', to: 'breast', band: [0.3, 0.46] }, length: 8, width: 6.5, center: '#2a1d13', edge: '#d9c6a2', edgeWidth: 1.3, soft: 2 },
      // the white braces: outer scapular edges lining up into a V down each side of the mantle
      { kind: 'stripe', from: { at: 'tailBase', t: 0.2 }, to: { at: 'neckBase', t: 0.1 }, width: 1.4, color: '#f5f1e8', blur: 0.4 },
      // a rufous-brown cap streaked black
      { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'lores', band: [0, 0.24] }, color: '#83502a', soft: 1.5 },
      { kind: 'streaks', where: { part: 'skin', from: 'nape', to: 'lores', band: [0, 0.24] }, color: '#231710', length: 1.6, width: 0.45, spacing: 1.1, blur: 0.2, soft: 1.5 },
      // a faint pale eyebrow, dusky lores, streaked buff cheeks
      { kind: 'stripe', from: { at: 'lores', t: 0.3 }, to: { at: 'occiput', t: 0.32 }, width: 1.2, color: '#e6dccb', blur: 0.6, opacity: 0.55 },
      { kind: 'stripe', from: { at: 'billBase', t: 0.5 }, to: { at: 'eye', t: 0.42 }, width: 0.9, color: '#6a5440', blur: 0.3 },
      { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'eye', band: [0.34, 0.58] }, color: '#c3a47e', soft: 1.5 },
      { kind: 'streaks', where: { part: 'skin', from: 'occiput', to: 'lores', band: [0.34, 0.6] }, color: '#6b4d32', length: 1.2, width: 0.35, spacing: 1.1, blur: 0.2, soft: 1.5, opacity: 0.7 },
      // folded wing: coverts and tertials dark with rufous-buff fringes, blackish primaries
      { kind: 'fill', where: { part: 'wingFold' }, color: '#3a291b' },
      { kind: 'feathers', where: { part: 'wingFold', s: [0, 0.72] }, length: 9, width: 7, center: '#3a291b', edge: '#c78e5c', edgeWidth: 1.2, soft: 1.5 },
      { kind: 'fill', where: { part: 'wingFold', s: [0.76, 1] }, color: '#1d1611', soft: 3 },
      { kind: 'gradient', where: { part: 'wingSpread' }, axis: 's', from: 0.4, to: 1, colorA: '#5c4632', colorB: '#221a14' },
      { kind: 'fill', where: { part: 'wingUnder' }, color: '#ece8e0' },
      // tail: pale grey-brown, the pointed central pair dark
      { kind: 'fill', where: { part: 'tail' }, color: '#9a8e80' },
      { kind: 'fill', where: { part: 'tail', t: [0.35, 0.65] }, color: '#2b241e', soft: 1 },
      { kind: 'fill', where: { part: 'tailUnder' }, color: '#dfdad1' },
      // bill: blackish tip, paler olive-brown base
      { kind: 'fill', where: { part: 'bill' }, color: '#1c1a17' },
      { kind: 'fill', where: { part: 'bill', s: [0, 0.5] }, color: '#7d6c44', soft: 2 },
      { kind: 'fill', where: { part: 'legs' }, color: '#aea349' },
    ],
    variants: {},
    sources: [
      'Ridgway 1919, Bull. U.S. Natl. Mus. 50(8) pp. 267-270 (culmen, tarsus, toe, wing, tail; bill and tail shape; juvenal plumage)',
      'Ruthrauff et al. 2023, USGS adult shorebird measurements (culmen, total head)',
      'Tobias et al. 2022, AVONET (bill depth and width)',
      'Bent 1927, Bull. U.S. Natl. Mus. 142 pp. 175-176 (juvenal plumage, the bib edge, leg colour)',
      'profile traced from "PectoralSandpiper-1OCT2016.jpg" (c) ADJ82, CC BY-SA 4.0, https://commons.wikimedia.org/wiki/File:PectoralSandpiper-1OCT2016.jpg',
      'juvenal plumage from "Pectoral Sandpiper (Calidris melanotos) (29119997223).jpg" (c) Andrew C, CC BY 2.0, https://commons.wikimedia.org/wiki/File:Pectoral_Sandpiper_(Calidris_melanotos)_(29119997223).jpg',
      'numbers and marks: docs/research/2026-09-25-long-billed-dowitcher-pectoral-sandpiper.md',
    ],
  },
}
