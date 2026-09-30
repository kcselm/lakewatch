import type { SpeciesSpec } from '../spec'
import type { Layer } from '../detail/spec'

// One version: in late September the juveniles and the adults, their plumes shed, are alike (docs/research/
// 2026-09-27-great-egret.md, section 3). Colours are the research's words (section 4), picked for a field-guide plate
// from the credited photos: pure white, a cool light grey in shade. Skin t: 0 the back's midline (on the head, the
// middle of the crown), 0.5 the side (the eye sits at 0.5), 1 the belly and the foreneck.
const BASIC: Layer[] = [
  // white all over, the underside a little greyer in its own shade
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#f7f6f1', side: '#f1f0ea', bottom: '#e3e3de' },
  // the folded wing white, its feather edges just showing in shade
  { kind: 'fill', where: { part: 'wingFold' }, color: '#f4f3ee' },
  { kind: 'feathers', where: { part: 'wingFold', s: [0.05, 0.95] }, length: 34, width: 22, center: '#f4f3ee', edge: '#e2e2dd', edgeWidth: 1, soft: 4, opacity: 0.6 },
  { kind: 'fill', where: { part: 'tail' }, color: '#eeede8' },
  { kind: 'fill', where: { part: 'tailUnder' }, color: '#e6e6e1' },
  { kind: 'fill', where: { part: 'wingSpread' }, color: '#f5f4ef' },
  { kind: 'fill', where: { part: 'wingUnder' }, color: '#e8e8e3' },
  // the bare lores yellow in front of the eye, and the gape's yellow running back past it, to about 9 mm behind the
  // eye's centre and 10 mm below it (section 5.1): the mark that parts it from the smaller white egrets
  { kind: 'stripe', from: { at: 'eye', t: 0.5, dx: 2 }, to: { at: 'billBase', t: 0.5 }, width: 9, color: '#e3c63e', blur: 1 },
  { kind: 'stripe', from: { at: 'eye', t: 0.6, dx: -13 }, to: { at: 'billBase', t: 0.66 }, width: 12, color: '#e8c237', blur: 1 },
  // the orbital skin tinged green
  { kind: 'ring', at: { at: 'eye', t: 0.5 }, radius: 5.5, width: 2.5, color: '#b7c065', blur: 1 },
  // orange-yellow, deepest along the gonys; some show a dusky culmen near the tip
  { kind: 'fill', where: { part: 'bill' }, color: '#e9b632' },
  { kind: 'fill', where: { part: 'bill', t: [0.6, 1] }, color: '#e5a125', soft: 2 },
  { kind: 'fill', where: { part: 'bill', s: [0.85, 1], t: [0, 0.35] }, color: '#7d6531', soft: 2, opacity: 0.6 },
  // legs and feet black
  { kind: 'fill', where: { part: 'legs' }, color: '#1b1b1d' },
]

export const SPEC: SpeciesSpec = {
  code: 'greegr',
  commonName: 'Great Egret',
  length: 1.0,
  body: { length: 1, height: 0.48, width: 0.4 },
  neck: { length: 0.95, thickness: 0.12, angle: 72 },
  head: { size: 0.2 },
  bill: { length: 0.3, thickness: 0.07, shape: 'dagger' },
  legs: { length: 0.85, thickness: 0.03 },
  tail: { length: 0.1, angle: 0 },
  wing: { length: 0.9, width: 0.4 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#fbfaf5', cheek: '#fbfaf5', throat: '#f8f7f1', breast: '#f6f4ec', flank: '#f4f2e9',
    back: '#f7f5ee', wing: '#f4f2ea', speculum: null, rump: '#f4f2ea', tail: '#f2f0e7',
    bill: '#e9b93a', legs: '#2a2a2a', eye: '#e8d24a',
  },
  variants: {},
  marks: {
    size: 'very large and tall, a little smaller and slimmer than the Great Blue Heron: about 0.55 m tall hunting',
    bill: 'a long, straight, orange-yellow dagger bill; the yellow gape runs back past the eye',
    head: 'white, with yellow lores and a pale yellow eye; no plumes in autumn',
    body: 'pure white all over, slim and long-necked; wades slowly with the neck in an S, then strikes',
    legs: 'long black legs and black feet',
  },
  foraging: 'heron',
  wingbeatHz: 2.4,
  detail: {
    measurements: {
      length: 0.748, culmen: 0.11, billDepth: 0.019, billWidth: 0.013,
      tarsus: 0.149, tibia: 0.1, toe: 0.099, wingChord: 0.382, tail: 0.14,
    },
    // traced from Carrie E.'s egret (see sources; 1440 px, facing right, a crouched stalking S in water) at 0.965 mm
    // per pixel (the bill's axis, from the middle of its base to the tip, spans 114.0 px for the 110 mm culmen), hip at
    // (458, 713). The outline is the white bird's edge against the water, checked by eye on gridded crops, with the
    // legs and the white feathering hanging over the front leg cut away; the legs come from the measurements. The
    // head's stations were laid by hand: each ring spans a point on the crown's line and the matching point on the
    // throat's, both advancing steadily, so the neck turning square into the head doesn't pinch the throat; the lores
    // and the bill base sit on the bill's axis, so the bill points along the photo's (16 degrees below level). The rest
    // of the stations' up, down, and tilt, and the body's places, were fitted so that the loft's side view covers the
    // outline with the least area between them, the loft never folds and no ring's section crosses another's. The loft
    // lies within about 1 mm of the photo on average along the crown, the back of the neck, the throat and the
    // foreneck, and 2 mm along the back and the breast; at worst the ragged belly feathers hang 15 mm below it. The eye
    // lands on the photo's, the bill tip 1.1 mm from it
    profile: [
      { label: 'rear',     x: -0.2538, y: -0.1018, up: 0.0281, down: 0.0303, halfWidth: 0.0200 },
      { label: 'rump',     x: -0.1911, y: -0.0830, up: 0.0393, down: 0.0221, halfWidth: 0.0360 },
      { label: 'tailBase', x: -0.1428, y: -0.0569, up: 0.0452, down: 0.0536, halfWidth: 0.0500 },
      { label: 'hip',      x:  0.0000, y:  0.0000, up: 0.0978, down: 0.1052, halfWidth: 0.0580 },
      { label: 'flank',    x:  0.0758, y:  0.0068, up: 0.1103, down: 0.0754, halfWidth: 0.0560 },
      { label: 'breast',   x:  0.1631, y: -0.0077, up: 0.0652, down: 0.0230, halfWidth: 0.0470, tilt: 21 },
      { label: 'neckBase', x:  0.1891, y:  0.0000, up: 0.0436, down: 0.0222, halfWidth: 0.0320, tilt: -36 },
      { label: 'neckLow',  x:  0.2306, y:  0.0511, up: 0.0162, down: 0.0363, halfWidth: 0.0240, tilt: -1 },
      { label: 'neckRise', x:  0.2306, y:  0.0647, up: 0.0162, down: 0.0501, halfWidth: 0.0200, tilt: 16 },
      { label: 'kink',     x:  0.2248, y:  0.1028, up: 0.0389, down: 0.0352, halfWidth: 0.0180, tilt: 18 },
      { label: 'neckUp',   x:  0.2248, y:  0.1457, up: 0.0395, down: 0.0396, halfWidth: 0.0170, tilt: 8.6 },
      { label: 'nape',     x:  0.2316, y:  0.1626, up: 0.0404, down: 0.0404, halfWidth: 0.0170, tilt: 10.6 },
      { label: 'hindHead', x:  0.2395, y:  0.1760, up: 0.0427, down: 0.0427, halfWidth: 0.0170, tilt: 3.3 },
      { label: 'occiput',  x:  0.2473, y:  0.1884, up: 0.0426, down: 0.0463, halfWidth: 0.0170, tilt: -3.1 },
      { label: 'crown',    x:  0.2568, y:  0.2003, up: 0.0376, down: 0.0498, halfWidth: 0.0165, tilt: -0.2 },
      { label: 'forehead', x:  0.2697, y:  0.2085, up: 0.0318, down: 0.0518, halfWidth: 0.0160, tilt: 10.4 },
      { label: 'eye',      x:  0.2838, y:  0.2112, up: 0.0255, down: 0.0495, halfWidth: 0.0150, tilt: 17.8 },
      { label: 'lores',    x:  0.3020, y:  0.2117, up: 0.0147, down: 0.0443, halfWidth: 0.0110, tilt: 20.6 },
      { label: 'billBase', x:  0.3141, y:  0.2082, up: 0.0088, down: 0.0375, halfWidth: 0.0065, tilt: 18.5 },
    ],
    // The neck bends at six stations from the flank to the occiput. The chain starts at the flank, further back than
    // the Great Blue Heron's breast, because the stalking egret's S is coiled tighter: the traced neck runs only about
    // 260 mm from the breast to the occiput against the erect bird's 450 (research section 2.6), the rest drawn down
    // into the breast's plumage, and from the breast it can lift the crown no more than 191 mm above the back. The
    // second joint sits in the bottom bend of the S, so the erect neck can straighten it. The kink is 0.28 of the
    // neck's length down from the occiput (the research's about a third, the C6-C7 hinge)
    rig: {
      neckBase: 'flank', neckMid: 'neckLow', head: 'occiput', hip: 'hip', tailBase: 'tailBase',
      neck: ['flank', 'neckLow', 'kink', 'neckUp', 'nape', 'occiput'],
    },
    // Fitted to the research's measures (section 6: the crown above the back, the bill's angle) with the heron style's
    // body tilt for each, inside the neck guards. The hunch lays the neck low and forward, the crown 35 mm above the
    // back, the bill 17 degrees down: like the heron's, the loft can't sink the head into the shoulders as the photo's
    // egret does. Erect lifts the crown 315 mm above the back with the alert tilt, the most the traced neck reaches
    // there (the photo's 375), the bill 28 degrees up, so that the swallow (erect with the head tipped 0.4 rad and no
    // tilt) raises it 22 degrees. The strike needs only the lower neck drawn in: unbent, the reach folds its skin
    neckShapes: {
      hunch: [-19.5, -71, -12, -9, 34.5, 51],
      erect: [34.5, -66, 2.5, 21.5, 13.5, 10],
      strike: [0, -32.5, 0, 0, 0, 0],
    },
    // a straight dagger, the edges near parallel to about four-fifths, the culmen curving down a little at the tip
    bill: { taper: 1.2, curve: -0.01 },
    // the photo's eye, about 8 mm across; iris pale yellow
    eye: { radius: 0.004, t: 0.5, iris: '#efe6a2' },
    wing: {
      // the tip on the photo's primary tips at the rear, the chord from the bend of the wing drooping 17 degrees below
      // straight back to it; the wing hangs from the chord down to the photo's belly line, less 2 mm, short of the
      // tail's tip below the primaries, and its front shallow where the breast's feathers cover it: the breast rises
      // with the neck, chained from the flank, and at 0.19 of the chord deep there it pressed 5 mm into the wing alert
      wrist: [0.097, 0.0162], droop: 17,
      outline: [
        [0, 0.03], [0.05, 0.07], [0.1, 0.11], [0.15, 0.14], [0.2, 0.17], [0.3, 0.21], [0.4, 0.21], [0.46, 0.2],
        [0.5, 0.16], [0.6, 0.132], [0.7, 0.1], [0.8, 0.088], [0.85, 0.066], [0.9, 0.06], [0.95, 0.045], [1, 0.02],
      ],
    },
    // turned -4.2 degrees from the spine at the tail base, so the tip lies at the photo's, under the folded primaries
    tail: { shape: 'square', angle: -4.2 },
    plumage: BASIC,
    variants: {},
    sources: [
      'Herring et al. 2008 and Palmer 1962, via Birds of the World (culmen, tarsus, wing chord); Baird, Brewer & Ridgway 1884, Water Birds of North America vol. 1 pp. 22-26 (bill depth, bare tibia, middle toe; soft parts)',
      'Tobias et al. 2022, AVONET (tail; bill width at the nostril)',
      'Bent 1926, Bull. U.S. Natl. Mus. 135 pp. 139-144 (the plumes shed after breeding; juvenal plumage)',
      'Fleming & Black 2026 (the cervical regions; the kink at C6-C7)',
      'profile and gape traced from iNaturalist 236762404 (c) Carrie E., CC BY-NC, https://www.inaturalist.org/observations/236762404',
      'the erect shape from iNaturalist 400894312 (c) Ritch Pope, CC BY-NC, https://www.inaturalist.org/observations/400894312',
      'the hunch from iNaturalist 402552831 (c) zimmwisdom, CC BY-NC, https://www.inaturalist.org/observations/402552831',
      'the strike from iNaturalist 138580987 (c) Ron, CC BY-NC, https://www.inaturalist.org/observations/138580987',
      'the swallow from iNaturalist 18364928, CC0, https://www.inaturalist.org/observations/18364928',
      'colour from iNaturalist 320177240 (c) Alice Pence, CC BY-NC, https://www.inaturalist.org/observations/320177240',
      'numbers and marks: docs/research/2026-09-27-great-egret.md',
    ],
  },
}
