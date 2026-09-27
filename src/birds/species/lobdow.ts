import type { SpeciesSpec } from '../spec'

export const SPEC: SpeciesSpec = {
  code: 'lobdow',
  commonName: 'Long-billed Dowitcher',
  length: 0.28,
  body: { length: 1, height: 0.6, width: 0.48 },
  neck: { length: 0.12, thickness: 0.2, angle: 50 },
  head: { size: 0.3 },
  bill: { length: 0.42, thickness: 0.05, shape: 'pointed' },
  legs: { length: 0.3, thickness: 0.025 },
  tail: { length: 0.18, angle: -10 },
  wing: { length: 0.5, width: 0.2 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#4f443a', cheek: '#948e86', throat: '#d6d2ca', breast: '#a39d95', flank: '#e6e2da',
    back: '#43362b', wing: '#665c52', speculum: null, rump: '#f2f0ea', tail: '#5a534c',
    bill: '#24221f', legs: '#9a9a48', eye: '#111111',
  },
  variants: {},
  marks: {
    size: 'a chunky shorebird, stockier than a yellowlegs, on short legs',
    bill: 'a very long, straight bill, about twice the length of the head',
    head: 'a dark cap and a long pale eyebrow',
    body: 'a plain grey neck and breast; dark above with narrow rusty edges; feeds with a sewing-machine motion',
    legs: 'short, greenish-yellow legs',
  },
  wingbeatHz: 6,
  foraging: 'dowitcher',
  detail: {
    measurements: {
      length: 0.22, culmen: 0.066, billDepth: 0.0072, billWidth: 0.0045,
      tarsus: 0.0385, tibia: 0.015, toe: 0.027, wingChord: 0.143, tail: 0.056,
    },
    // traced from Les Leighton's photo (see sources; 2048 px, facing right) at 0.145 mm per pixel (the 66 mm culmen
    // spans 456 px), hip at (760, 720); up and down measured along the spine normal to a hand-read silhouette, and the
    // fluffed back trimmed 10% for a bird in September. The foreneck and breast (the downs of neckMid, neckBase, and
    // breast) were retraced to the photo's silhouette. The throat under the resting head, from the chin to the breast,
    // is retraced with tilted sections (neckBase to lores): the front outline lies within 0.8 mm of the photo's from
    // 10 mm below the hip up the throat, and within 1.8 mm under the chin, the chin rising steadily to the bill; the
    // back of the neck and head stays within 1 mm of the earlier trace (measured 0.59 mm), and the eye within 0.4 mm
    // of the photo's; the nape moves 0.95 mm and the crown 1.3 mm. It fell 6.5-8.3 mm short before the sections could
    // tilt
    profile: [
      { label: 'rear',     x: -0.0638, y: -0.0254, up: 0.0066, down: 0.0058, halfWidth: 0.0055 },
      { label: 'rump',     x: -0.0479, y: -0.0217, up: 0.0099, down: 0.0129, halfWidth: 0.0098 },
      { label: 'tailBase', x: -0.0290, y: -0.0145, up: 0.0141, down: 0.0248, halfWidth: 0.0156 },
      { label: 'hip',      x: 0.0000, y: 0.0000, up: 0.0288, down: 0.0423, halfWidth: 0.0235 },
      { label: 'flank',    x: 0.0116, y: 0.0099, up: 0.0288, down: 0.0530, halfWidth: 0.0270 },
      { label: 'breast',   x: 0.0232, y: 0.0196, up: 0.0264, down: 0.0508, halfWidth: 0.0284 },
      { label: 'neckBase', x: 0.0326, y: 0.0276, up: 0.0232, down: 0.0506, halfWidth: 0.0278, tilt: -3.8 },
      { label: 'neckMid',  x: 0.0393, y: 0.0334, up: 0.0248, down: 0.0443, halfWidth: 0.0288, tilt: -2.3 },
      { label: 'nape',     x: 0.0438, y: 0.0380, up: 0.0233, down: 0.0382, halfWidth: 0.0263, tilt: 4.2 },
      { label: 'occiput',  x: 0.0494, y: 0.0428, up: 0.0193, down: 0.0313, halfWidth: 0.0131, tilt: 12.6 },
      { label: 'crown',    x: 0.0555, y: 0.0468, up: 0.0211, down: 0.0121, halfWidth: 0.0138, tilt: 12.7 },
      { label: 'eye',      x: 0.0596, y: 0.0479, up: 0.0228, down: 0.0084, halfWidth: 0.0144, tilt: 1.9 },
      { label: 'lores',    x: 0.0670, y: 0.0484, up: 0.0112, down: 0.0084, halfWidth: 0.0092, tilt: -12.6 },
      { label: 'billBase', x: 0.0711, y: 0.0467, up: 0.0034, down: 0.0034, halfWidth: 0.0022 },
    ],
    rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
    bill: { taper: 1.7, curve: -0.012 },
    eye: { radius: 0.0027, t: 0.38, iris: '#2a1c14' },
    wing: {
      // the folded wing runs the whole length of the body: the wrist sits at the front of the breast, under the head
      wrist: [0.055, 0.0252], droop: 21.6,
      // the front third is a sliver: on a hunched dowitcher the breast feathers cover the bend of the wing
      outline: [[0, 0.005], [0.22, 0.01], [0.34, 0.1], [0.5, 0.14], [0.7, 0.1], [0.85, 0.05], [1, 0.01]],
    },
    tail: { shape: 'rounded' },
    stepLength: 0.35,
    probeDepth: 0.027,
    plumage: [
      // dark above, white below
      { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#473a2f', side: '#8e877e', bottom: '#f2f0ea' },
      { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'flank', band: [0.62, 1] }, color: '#f3f1eb', soft: 3 },
      // a plain grey hood from the chin to the lower breast, fading softly into the white belly
      { kind: 'fill', where: { part: 'skin', from: 'flank', to: 'billBase', band: [0.4, 1] }, color: '#a19b93', soft: 4 },
      { kind: 'fill', where: { part: 'skin', from: 'flank', to: 'breast', band: [0.45, 0.8] }, color: '#b9a891', soft: 3, opacity: 0.4 },
      { kind: 'spots', where: { part: 'skin', from: 'flank', to: 'breast', band: [0.45, 0.85] }, color: '#665e56', size: 0.6, spacing: 2.6, blur: 0.3, soft: 2, opacity: 0.5 },
      // flanks spotted and short-barred, heaviest behind; undertail coverts barred boldly
      { kind: 'bars', where: { part: 'skin', from: 'tailBase', to: 'flank', band: [0.55, 0.8] }, color: '#5f5851', width: 0.7, spacing: 3.2, angle: 0, blur: 0.4, soft: 2, opacity: 0.45 },
      { kind: 'bars', where: { part: 'skin', from: 'rear', to: 'tailBase', band: [0.72, 1] }, color: '#27231f', width: 1, spacing: 2.6, angle: 0, blur: 0.3, soft: 1.5 },
      // mantle and upper scapulars: blackish centres with narrow rufous fringes; lower scapulars greyer, edged buff
      { kind: 'feathers', where: { part: 'skin', from: 'rump', to: 'neckBase', band: [0, 0.38] }, length: 9, width: 7, center: '#221a14', edge: '#8d5433', edgeWidth: 0.6, soft: 2 },
      { kind: 'feathers', where: { part: 'skin', from: 'rump', to: 'breast', band: [0.34, 0.5] }, length: 9, width: 7, center: '#4b423a', edge: '#c8b08a', edgeWidth: 0.8, soft: 2 },
      // a dark cap, a long whitish eyebrow brightest in front, a dark line through the eye, grey cheeks
      { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'lores', band: [0, 0.22] }, color: '#44392f', soft: 1.5 },
      { kind: 'streaks', where: { part: 'skin', from: 'nape', to: 'lores', band: [0, 0.22] }, color: '#28201a', length: 1.6, width: 0.45, spacing: 1.2, blur: 0.2, soft: 1.5 },
      { kind: 'stripe', from: { at: 'billBase', t: 0.34 }, to: { at: 'eye', t: 0.33 }, width: 1.8, color: '#ebe7df', blur: 0.5 },
      { kind: 'stripe', from: { at: 'eye', t: 0.33 }, to: { at: 'crown', t: 0.36, dx: -4 }, width: 1.3, color: '#dcd7cd', blur: 0.6, opacity: 0.6 },
      { kind: 'stripe', from: { at: 'billBase', t: 0.48 }, to: { at: 'eye', t: 0.42 }, width: 1.3, color: '#2c2622', blur: 0.4 },
      { kind: 'stripe', from: { at: 'eye', t: 0.42 }, to: { at: 'occiput', t: 0.45 }, width: 1.6, color: '#6a625a', blur: 0.6, opacity: 0.6 },
      { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'eye', band: [0.35, 0.6] }, color: '#8c867e', soft: 1.5 },
      // folded wing: grey-brown coverts with thin buff fringes; the tertials plain dark grey-brown with thin pale
      // edges and no bars (the Short-billed's are tiger-striped); they cover the primary tips
      { kind: 'fill', where: { part: 'wingFold' }, color: '#5c5249' },
      { kind: 'feathers', where: { part: 'wingFold', s: [0, 0.55] }, length: 9, width: 7, center: '#5c5249', edge: '#c9b99e', edgeWidth: 0.7, soft: 1.5 },
      { kind: 'fill', where: { part: 'wingFold', s: [0.55, 1] }, color: '#3c342e', soft: 2 },
      // the bend of the wing, under the breast feathers: grey like the breast
      { kind: 'gradient', where: { part: 'wingFold', s: [0, 0.35] }, axis: 's', from: 0.15, to: 0.35, colorA: '#a19b93', colorB: '#5c5249' },
      { kind: 'feathers', where: { part: 'wingFold', s: [0.55, 0.97] }, length: 16, width: 10, center: '#3c342e', edge: '#b8996e', edgeWidth: 0.6, soft: 1.5 },
      { kind: 'gradient', where: { part: 'wingSpread' }, axis: 's', from: 0.4, to: 1, colorA: '#5a5048', colorB: '#221d19' },
      { kind: 'fill', where: { part: 'wingUnder' }, color: '#e6e3dd' },
      // tail: white, barred blackish across its whole length, the dark bars wider than the white
      { kind: 'fill', where: { part: 'tail' }, color: '#efece6' },
      { kind: 'bars', where: { part: 'tail' }, color: '#1f1c19', width: 3.2, spacing: 4.8, angle: 0, blur: 0.3 },
      { kind: 'fill', where: { part: 'tailUnder' }, color: '#efece6' },
      { kind: 'bars', where: { part: 'tailUnder' }, color: '#1f1c19', width: 3.2, spacing: 4.8, angle: 0, blur: 0.3 },
      // bill blackish, olive at the base
      { kind: 'fill', where: { part: 'bill' }, color: '#1f1d1b' },
      { kind: 'fill', where: { part: 'bill', s: [0, 0.4] }, color: '#5c5a3c', soft: 3 },
      { kind: 'fill', where: { part: 'legs' }, color: '#999847' },
    ],
    variants: {},
    sources: [
      'Ridgway 1919, Bull. U.S. Natl. Mus. 50(8) pp. 196-201 (culmen, tarsus, toe, wing, tail; bill, tibia and tail shape; plumage)',
      'Ruthrauff et al. 2023, USGS shorebird measurements (September juveniles: culmen, total head)',
      'Tobias et al. 2022, AVONET (bill depth and width)',
      'Bent 1927, Bull. U.S. Natl. Mus. 142 pp. 110-120 (juvenal plumage, feeding)',
      'Lee & Birch 2006, Birding 38(4) pp. 34-42 (tertials, tail bars, structure)',
      'Burton 1972 (probe depth, bill angle while feeding)',
      'profile traced from iNaturalist photo 199669733 (c) Les Leighton, CC BY-NC, https://www.inaturalist.org/photos/199669733',
      'juvenal plumage from iNaturalist photo 431840531 (c) Christopher Lindsey, CC BY-NC, https://www.inaturalist.org/photos/431840531',
      'numbers and marks: docs/research/2026-09-25-long-billed-dowitcher-pectoral-sandpiper.md',
    ],
  },
}
