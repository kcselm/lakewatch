import type { SpeciesSpec } from '../spec'
import type { Layer } from '../detail/spec'

// Two late-September versions share one traced bird and differ only in paint: the plain basic adult (and the
// first-winter birds that have already lost their stripes) and the striped juvenile. Colours are the research's words
// (docs/research/2026-09-25-pied-billed-grebe.md, sections 4 and 9), picked for a field-guide plate from the credited
// photos, the basic in the overcast light of `pibgre-basic-fluffed.jpg`. Skin t: 0 the back's midline (the hindneck on
// the upright neck, the crown on the head), 1 the belly's (the foreneck and throat); along the body the water meets
// the flank at t 0.45, and the stern at 0.65 by the rump.

/** The spread wing, seen only in a stretch: brown, the secondaries' inner webs and tips white. */
const SPREAD: Layer[] = [
  { kind: 'fill', where: { part: 'wingSpread' }, color: '#6a5c4f' },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.08, 0.42], t: [0.6, 1] }, color: '#e6e1d7', soft: 2, opacity: 0.8 },
  { kind: 'fill', where: { part: 'wingUnder' }, color: '#dbd6cd' },
]

/** The back's pale feather edges, which give it its "hoary" look: fine streaks lying back along the body. */
const HOARY = { length: 6, width: 0.6, spacing: 1.7, blur: 0.4, soft: 3 }
/** The flank's mottling: short, broad streaks of the feathers' paler edges. */
const MOTTLE = { length: 4.5, width: 1.5, spacing: 2.6, blur: 0.5, soft: 3 }

/** Under the water: the belly silvery white, brownish toward the flanks and the stern. */
const BELLY: Layer[] = [
  { kind: 'fill', where: { part: 'skin', from: 'tailBase', to: 'chest', band: [0.6, 1] }, color: '#dcd6cb', soft: 5 },
]

const BASIC: Layer[] = [
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#3f352c', side: '#5f4a3b', bottom: '#dcd6cb' },
  // the back and scapulars dark grey-brown, their paler grey-brown edges giving the "hoary" look; they cover the upper
  // side down to a few millimetres over the water
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'chest', band: [0, 0.36] }, color: '#3d342b', soft: 3 },
  { kind: 'streaks', where: { part: 'skin', from: 'rump', to: 'chest', band: [0, 0.36] }, ...HOARY, color: '#7a6f62', opacity: 0.6 },
  // the flanks at the water: brown, mottled rufous-buff, pale buff showing here and there where the feathers part
  { kind: 'fill', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0.34, 0.55] }, color: '#5b4637', soft: 3 },
  { kind: 'streaks', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0.34, 0.55] }, ...MOTTLE, color: '#a57d5a', opacity: 0.75 },
  { kind: 'streaks', where: { part: 'skin', from: 'rump', to: 'flank', band: [0.36, 0.5] }, length: 4, width: 1, spacing: 5, blur: 0.5, soft: 3, color: '#d8c7aa', opacity: 0.6 },
  ...BELLY,
  // the white stern puff (the undertail coverts), 20-30 mm long, under the dark rump
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'tailBase', band: [0.3, 1] }, color: '#f3f0ea', soft: 2 },
  // the lower neck and breast tawny to rufous, strongest just above the water
  { kind: 'fill', where: { part: 'skin', from: 'breast', to: 'chest', band: [0.35, 0.62] }, color: '#8f6448', soft: 5 },
  { kind: 'fill', where: { part: 'skin', from: 'chest', to: 'neckMid', band: [0.4, 1] }, color: '#9c6a4a', soft: 4 },
  // the neck's sides buff-brown, its upper front buff
  { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'occiput', band: [0.25, 0.8] }, color: '#8c745e', soft: 4 },
  { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'nape', band: [0.75, 1] }, color: '#c7ab88', soft: 4 },
  // the hindneck dark down to the back
  { kind: 'fill', where: { part: 'skin', from: 'neckBase', to: 'occiput', band: [0, 0.28] }, color: '#3a3028', soft: 3 },
  // the face greyish-buff, paler than the crown
  { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'billBase', band: [0.34, 0.8] }, color: '#a28a72', soft: 2 },
  // the whitish chin and throat, from the lower mandible back about 25 mm
  { kind: 'fill', where: { part: 'skin', from: 'crown', to: 'billBase', band: [0.74, 1] }, color: '#ece6da', soft: 2 },
  { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'crown', band: [0.84, 1] }, color: '#e6dccb', soft: 3 },
  // the crown and nape darkest, the cap down to the top of the eye
  { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'billBase', band: [0, 0.35] }, color: '#342b23', soft: 1.5 },
  // at most a slightly darker line through the eye
  { kind: 'stripe', from: { at: 'lores', t: 0.5 }, to: { at: 'occiput', t: 0.42 }, width: 1.6, color: '#86705b', blur: 1.5, opacity: 0.5 },
  // the thin whitish eyelid ring
  { kind: 'ring', at: { at: 'eye', t: 0.44 }, radius: 3.6, width: 0.6, color: '#ebe5d8', blur: 0.3 },
  // the folded wing, under the scapulars: the back's colour and pattern, the primaries' wedge a little darker
  { kind: 'fill', where: { part: 'wingFold' }, color: '#3d342b' },
  { kind: 'streaks', where: { part: 'wingFold' }, ...HOARY, color: '#7a6f62', opacity: 0.6 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.8, 1] }, color: '#342c25', soft: 3, opacity: 0.5 },
  ...SPREAD,
  // pale yellowish horn, the lower mandible yellower, the culmen dusky from the base nearly to the tip
  { kind: 'fill', where: { part: 'bill' }, color: '#c4b890' },
  { kind: 'fill', where: { part: 'bill', t: [0.55, 1] }, color: '#d3c79b', soft: 1 },
  { kind: 'fill', where: { part: 'bill', s: [0, 0.92], t: [0, 0.2] }, color: '#5f574b', soft: 1 },
  // greenish slate, seen only as it kicks under
  { kind: 'fill', where: { part: 'legs' }, color: '#4b524a' },
]

const JUVENILE: Layer[] = [
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#2e251e', side: '#523e31', bottom: '#dcd6cb' },
  // the back blackish-brown, darker and plainer
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'chest', band: [0, 0.36] }, color: '#2d241e', soft: 3 },
  { kind: 'streaks', where: { part: 'skin', from: 'rump', to: 'chest', band: [0, 0.36] }, ...HOARY, color: '#54473c', opacity: 0.5 },
  // the flanks rather dark brown mixed with buff
  { kind: 'fill', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0.34, 0.55] }, color: '#4c392c', soft: 3 },
  { kind: 'streaks', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0.34, 0.55] }, ...MOTTLE, color: '#a08466', opacity: 0.7 },
  ...BELLY,
  // white too, but a smaller puff than the adult's
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'rump', band: [0.36, 1] }, color: '#f1eee8', soft: 1.5 },
  { kind: 'fill', where: { part: 'skin', from: 'rump', to: 'tailBase', band: [0.5, 1] }, color: '#ece8e0', soft: 3 },
  // the foreneck and breast buff to rufous-buff, mottled and streaked dark brown
  { kind: 'fill', where: { part: 'skin', from: 'breast', to: 'chest', band: [0.35, 0.62] }, color: '#8e6446', soft: 5 },
  { kind: 'fill', where: { part: 'skin', from: 'chest', to: 'neckMid', band: [0.4, 1] }, color: '#ae7f58', soft: 4 },
  { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'nape', band: [0.7, 1] }, color: '#c8a680', soft: 4 },
  { kind: 'spots', where: { part: 'skin', from: 'chest', to: 'nape', band: [0.45, 1] }, color: '#5c4232', size: 1.6, spacing: 2.8, blur: 0.4, soft: 3, opacity: 0.7 },
  // the sides of the neck pale, streaked and blotched dark brown on from the face
  { kind: 'fill', where: { part: 'skin', from: 'neckMid', to: 'occiput', band: [0.25, 0.72] }, color: '#b69b7c', soft: 4 },
  { kind: 'streaks', where: { part: 'skin', from: 'neckMid', to: 'occiput', band: [0.28, 0.72] }, color: '#3e2e24', length: 3, width: 1, spacing: 2, blur: 0.4, soft: 3, opacity: 0.8 },
  // the hindneck blackish
  { kind: 'fill', where: { part: 'skin', from: 'neckBase', to: 'occiput', band: [0, 0.28] }, color: '#2a221c', soft: 3 },
  // the face whitish-buff, streaked and blotched dark brown
  { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'billBase', band: [0.34, 0.8] }, color: '#dac8a6', soft: 2 },
  { kind: 'streaks', where: { part: 'skin', from: 'occiput', to: 'lores', band: [0.34, 0.8] }, color: '#3f2e23', length: 2.4, width: 1, spacing: 1.5, blur: 0.4, soft: 1.5, opacity: 0.9 },
  // dark brown behind the eye, between the two pale stripes
  { kind: 'stripe', from: { at: 'eye', t: 0.5, dx: -3 }, to: { at: 'occiput', t: 0.5, dx: 1 }, width: 3, color: '#3a2a20', blur: 0.8 },
  // the pale stripes, painted bold (3-4 mm) so they read through the telescope: from the gape back under the eye, and
  // from behind the eye back toward the nape
  { kind: 'stripe', from: { at: 'lores', t: 0.64, dx: 1.5 }, to: { at: 'crown', t: 0.57 }, width: 3.2, color: '#f1ebdf', blur: 0.6 },
  { kind: 'stripe', from: { at: 'eye', t: 0.43, dx: -4.5 }, to: { at: 'occiput', t: 0.42, dx: 3 }, width: 3, color: '#efe8da', blur: 0.6 },
  // the throat white
  { kind: 'fill', where: { part: 'skin', from: 'crown', to: 'billBase', band: [0.76, 1] }, color: '#f1ece2', soft: 2 },
  { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'crown', band: [0.86, 1] }, color: '#ebe3d4', soft: 3 },
  // the crown blackish-brown, down to the top of the eye
  { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'billBase', band: [0, 0.35] }, color: '#251e18', soft: 1.5 },
  { kind: 'fill', where: { part: 'wingFold' }, color: '#2d241e' },
  { kind: 'streaks', where: { part: 'wingFold' }, ...HOARY, color: '#54473c', opacity: 0.5 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.8, 1] }, color: '#241e19', soft: 3, opacity: 0.5 },
  ...SPREAD,
  // pinkish horn, the lower mandible pink-buff, the culmen dark brown
  { kind: 'fill', where: { part: 'bill' }, color: '#c7a288' },
  { kind: 'fill', where: { part: 'bill', t: [0.55, 1] }, color: '#d8b399', soft: 1 },
  { kind: 'fill', where: { part: 'bill', s: [0, 0.94], t: [0, 0.24] }, color: '#4d3d32', soft: 1 },
  { kind: 'fill', where: { part: 'legs' }, color: '#4b524a' },
]

export const SPEC: SpeciesSpec = {
  code: 'pibgre',
  commonName: 'Pied-billed Grebe',
  length: 0.33,
  body: { length: 1, height: 0.62, width: 0.5 },
  neck: { length: 0.32, thickness: 0.15, angle: 60 },
  head: { size: 0.3 },
  bill: { length: 0.1, thickness: 0.11, shape: 'pointed' },
  legs: { length: 0.15, thickness: 0.04 },
  tail: { length: 0.03, angle: 20 },
  wing: { length: 0.45, width: 0.25 },
  posture: 'swimming',
  draft: 0.5,
  plumage: {
    crown: '#4a3f33', cheek: '#7a6a56', throat: '#8c7c68', breast: '#a89684', flank: '#8b7a66',
    back: '#5a4d3f', wing: '#5f5245', speculum: null, rump: '#c8c0b0', tail: '#c8c0b0',
    bill: '#d8d0b8', legs: '#5a5a4a', eye: '#2a2a2a',
  },
  variants: {
    basic: {},
    juvenile: { crown: '#2a221c', cheek: '#d8c6a4', throat: '#f0ebe0', breast: '#b08058', back: '#30271f', bill: '#c9a48a' },
  },
  marks: {
    size: 'small and stocky, smaller than a coot: a compact, big-headed diver that rides low, with almost no tail',
    bill: 'a short, deep, chicken-like bill with a small hooked tip: pale horn with a dusky ridge, pinkish on juveniles; no black ring in autumn',
    head: 'adults plain brown, darkest on the crown and the back of the neck, with a whitish chin and a thin pale eye-ring; juveniles a dark cap over a whitish face striped and streaked dark brown',
    body: 'dark grey-brown above, tawny on the lower neck and breast, a fluffy white stern and no visible tail; sinks until only its head shows, and slips under without a splash',
    legs: 'lobed toes set far back, seen only as it kicks under',
  },
  wingbeatHz: 7,
  foraging: 'grebe',
  detail: {
    measurements: {
      length: 0.2045, culmen: 0.021, billDepth: 0.0115, billWidth: 0.0055,
      tarsus: 0.036, tibia: 0.004, toe: 0.046, wingChord: 0.125, tail: 0.03,
    },
    // traced from Patricia's basic adult (see sources; 1775 px, facing right) at 0.150 mm per pixel (the 21 mm culmen,
    // the mean of the sexes, spans 140 px), hip at (440, 780). The photo's outline was read by hand. The bird is wet
    // and sleek, just up from a dive, its back 20 mm above the water; at rest a sleek grebe carries it at 28, so the
    // back line from the stern to the neck is raised 8 mm and the stern tip set 9 mm up, as the research advises. Each
    // station's up, down, and tilt, and the neck and head stations' places, were fitted so that the loft's side view
    // (its own 64 rings) covers that outline with the least area between them, the loft never folds, and the eye lands
    // on the photo's eye. The chest station carries the breast's bulge in front of the upright neck. Under the water,
    // where no photo shows the hull, the outline is a keel 50 mm down, from where the water meets the stern to where it
    // meets the breast, so the hull displaces 0.37 L (the birds weigh 0.34-0.46 kg); the fit counts it at a third of the
    // traced bird. The loft lies on average within 0.1 mm of the outline over the back, the hindneck, the crown, the
    // chin and the stern (at worst 0.9 mm), within 0.8 mm along the foreneck and breast (2.8 mm short at the breast's
    // bulge), and 0.7 mm at the forehead, where it stands 2 mm proud over the bill's base
    profile: [
      { label: 'rear',     x: -0.0381, y: 0.0135,  up: 0.0040, down: 0.0019, halfWidth: 0.0120 },
      { label: 'rump',     x: -0.0300, y: 0.0097,  up: 0.0106, down: 0.0100, halfWidth: 0.0260 },
      { label: 'tailBase', x: -0.0180, y: 0.0045,  up: 0.0209, down: 0.0166, halfWidth: 0.0340 },
      { label: 'hip',      x: 0.0000,  y: 0.0000,  up: 0.0303, down: 0.0278, halfWidth: 0.0400 },
      { label: 'flank',    x: 0.0480,  y: -0.0008, up: 0.0329, down: 0.0453, halfWidth: 0.0430 },
      { label: 'breast',   x: 0.0840,  y: 0.0030,  up: 0.0226, down: 0.0376, halfWidth: 0.0360, tilt: -4.5 },
      { label: 'chest',    x: 0.0961,  y: 0.0143,  up: 0.0215, down: 0.0355, halfWidth: 0.0300 },
      { label: 'neckBase', x: 0.1002,  y: 0.0270,  up: 0.0149, down: 0.0143, halfWidth: 0.0160, tilt: 2.5 },
      { label: 'neckMid',  x: 0.0975,  y: 0.0370,  up: 0.0147, down: 0.0121, halfWidth: 0.0135, tilt: 1 },
      { label: 'nape',     x: 0.0948,  y: 0.0539,  up: 0.0163, down: 0.0162, halfWidth: 0.0135, tilt: -11 },
      { label: 'occiput',  x: 0.0976,  y: 0.0600,  up: 0.0180, down: 0.0167, halfWidth: 0.0140, tilt: 3.5 },
      { label: 'crown',    x: 0.1098,  y: 0.0661,  up: 0.0214, down: 0.0166, halfWidth: 0.0145, tilt: 12 },
      { label: 'eye',      x: 0.1268,  y: 0.0648,  up: 0.0180, down: 0.0131, halfWidth: 0.0130, tilt: 8 },
      { label: 'lores',    x: 0.1335,  y: 0.0637,  up: 0.0136, down: 0.0095, halfWidth: 0.0080 },
      { label: 'billBase', x: 0.1405,  y: 0.0625,  up: 0.0065, down: 0.0070, halfWidth: 0.0035 },
    ],
    rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
    bill: {
      // the top arches down to the tip while the lower edge runs nearly straight: the tube's axis droops a little over
      // the distal half, and the upper mandible's own tip hooks 1.2 mm below it, so the tip lands on the photo's
      curve: -0.05,
      hook: 0.0012,
      // depth from the two side-on photos (0.94, 0.81, 0.61, 0.36 of the base at 25, 50, 75, 90%), width from AVONET
      // at the base and the head-on photos along it; knife-edged at the tip
      profile: [[0, 1, 1], [0.25, 0.91, 0.94], [0.5, 0.73, 0.81], [0.75, 0.545, 0.61], [0.9, 0.27, 0.36], [1, 0.09, 0.08]],
    },
    // the photo's eye: 7 mm across, set high, level with the top of the bill's base; the iris dark brown
    eye: { radius: 0.0035, t: 0.435, iris: '#3a2416' },
    wing: {
      // folded into the flank feathers and under the scapulars, nothing of it shows on a floating bird. The chord runs
      // back along the top of the side, 3 mm under the back, to a tip on the rump over the tail base, 21 mm short of the
      // stern's end, so the stern cocks up (a loafing bird's puff, a roll-under) clear of it; the wrist, 125 mm ahead,
      // lies hidden in the base of the neck. It is a line with no height over its front half, and a strip no more than
      // 5 mm deep behind, painted as the back, where the primaries' wedge lies
      wrist: [0.1065, 0.0237], droop: 3.4,
      outline: [[0, 0], [0.5, 0], [0.6, 0.02], [0.75, 0.04], [0.9, 0.035], [1, 0.01]],
    },
    // no tail: the rectrices are a downy tuft hidden in the white undertail puff, which is the stern itself; cocking the
    // tail bone cocks the puff
    tail: { shape: 'none' },
    feet: 'lobed',
    // the lobes, the pair about 0.3 of the middle toe wide at their widest (an estimate; section 5.6)
    lobeWidth: 0.013,
    // where the water meets the photo's midline at the front of the breast (y = 747), where its crisp feathers end
    float: { waterline: 0.005 },
    plumage: BASIC,
    variants: { basic: BASIC, juvenile: JUVENILE },
    sources: [
      'Cramp & Simmons 1977 via Johnsgard 1987, Diving Birds of North America, p. 117 (wing, culmen, mass; the winter and juvenile plumages)',
      'Baird, Brewer & Ridgway 1884, Water Birds of North America vol. 2 pp. 440-442 (culmen, bill depth, tarsus, middle toe; plumages, bare parts)',
      'Tobias et al. 2022, AVONET (bill width and depth at the nostril, tarsus, wing)',
      'Bent 1919, Life Histories of North American Diving Birds pp. 39-47 (the young\'s stripes into October; sinking)',
      'profile, bill and basic colours traced from iNaturalist 62163037 (c) Patricia (insectology), CC BY-NC, https://www.inaturalist.org/observations/62163037',
      'the juvenile from iNaturalist 136620812 (c) Patricia (insectology), CC BY-NC, https://www.inaturalist.org/observations/136620812',
      'bill profile and the raised neck from iNaturalist 95211616 (c) Patricia (insectology), CC BY-NC, https://www.inaturalist.org/observations/95211616',
      'basic colours in flat light from iNaturalist 59927329 (c) Patricia (insectology), CC BY-NC, https://www.inaturalist.org/observations/59927329',
      'the fluffed rest posture and the hook from iNaturalist 60158565 (c) Phil Kahler, CC BY-NC, https://www.inaturalist.org/observations/60158565',
      'the bold juvenile from iNaturalist 314616598 (c) docprt, CC BY-NC, https://www.inaturalist.org/observations/314616598',
      'a juvenile afloat from iNaturalist 402640112 (c) Thomas Boe, CC BY, https://www.inaturalist.org/observations/402640112',
      'numbers and marks: docs/research/2026-09-25-pied-billed-grebe.md',
    ],
  },
}
