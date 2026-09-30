import type { SpeciesSpec } from '../spec'
import type { Layer } from '../detail/spec'

// The two late-September versions share one traced bird and differ in paint (and the adult's plumes). Colours are the
// research's words (docs/research/2026-09-27-great-blue-heron.md, section 4), picked for a field-guide plate from the
// credited photos: the valley's ordinary mid blue-grey, not the dark coastal fannini (section 3.3). Skin t: 0 the back's
// midline (on the head, the middle of the crown), 0.5 the side (the eye sits at 0.5), 1 the belly and the foreneck.

/** What both versions share: the tail, the spread wing (seen only if it flies), the undertail, the plumes' colour. */
const SHARED: Layer[] = [
  // white undertail coverts
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'rump', band: [0.78, 1] }, color: '#e9e8e4', soft: 6 },
  { kind: 'fill', where: { part: 'tail' }, color: '#4f5967' },
  { kind: 'fill', where: { part: 'tailUnder' }, color: '#616874' },
  { kind: 'fill', where: { part: 'wingSpread' }, color: '#6a7888' },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.45, 1] }, color: '#2c313a', soft: 6 },
  { kind: 'fill', where: { part: 'wingUnder' }, color: '#7c8490' },
  { kind: 'fill', where: { part: 'plume' }, color: '#15171c' },
]

const ADULT: Layer[] = [
  // blue-grey above, the side a little paler, the belly dark
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#5c6a7c', side: '#75808f', bottom: '#40454e' },
  // the flanks and belly dark grey, streaked white
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'breast', band: [0.62, 1] }, color: '#3d424a', soft: 12 },
  { kind: 'streaks', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0.66, 1] }, color: '#d9dadc', length: 30, width: 2.5, spacing: 9, jitter: 0.5, blur: 1, soft: 8, opacity: 0.7 },
  // the long pale back plumes, pearl-grey, draping over the back and rump
  { kind: 'streaks', where: { part: 'skin', from: 'rear', to: 'breast', band: [0, 0.42] }, color: '#a7b2be', length: 70, width: 2, spacing: 7, jitter: 0.6, blur: 1, soft: 10, opacity: 0.8 },
  // rusty thighs, where the legs leave the body
  { kind: 'fill', where: { part: 'skin', from: 'tailBase', to: 'flank', band: [0.7, 1] }, color: '#94502e', soft: 30 },
  // the neck lavender-grey, lighter in front
  { kind: 'base', where: { part: 'skin', from: 'breast', to: 'occiput' }, top: '#737883', side: '#86848d', bottom: '#b3b0b5', soft: 25 },
  // the lower-neck plumes, pale and shaggy over the breast
  { kind: 'streaks', where: { part: 'skin', from: 'breast', to: 'neckLow', band: [0.55, 1] }, color: '#dddbdd', length: 45, width: 1.5, spacing: 5, jitter: 0.6, blur: 0.6, soft: 10, opacity: 0.8 },
  // the foreneck: a narrow stripe of black and rufous dashes on white, from the throat down onto the breast
  { kind: 'fill', where: { part: 'skin', from: 'breast', to: 'neckUp', band: [0.88, 1] }, color: '#ebe9e6', soft: 5 },
  { kind: 'streaks', where: { part: 'skin', from: 'breast', to: 'neckUp', band: [0.88, 1] }, color: '#1e1f24', length: 9, width: 2, spacing: 5, jitter: 0.6, blur: 0.5, soft: 3 },
  { kind: 'streaks', where: { part: 'skin', from: 'breast', to: 'kink', band: [0.9, 1] }, color: '#8a4a2c', length: 7, width: 1.6, spacing: 7, jitter: 0.8, blur: 0.5, soft: 3, opacity: 0.8 },
  // the black shoulder, at the side of the breast below the neck, chestnut at the bend of the wing
  { kind: 'fill', where: { part: 'skin', from: 'breast', to: 'neckBase', band: [0.32, 0.6] }, color: '#17181d', soft: 6 },
  // the head: white face, chin and throat, the cheeks a little greyer; white forehead and crown centre between broad
  // black stripes from above the eye back to the nape, where they run into the plumes
  { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'billBase' }, color: '#f2f1ec', soft: 4 },
  { kind: 'fill', where: { part: 'skin', from: 'neckUp', to: 'occiput', band: [0.7, 1] }, color: '#efeeea', soft: 8 },
  { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'eye', band: [0.45, 0.7] }, color: '#dcdcdc', soft: 5, opacity: 0.6 },
  { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'occiput', band: [0, 0.38] }, color: '#16181d', soft: 4 },
  { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'eye', band: [0.09, 0.4] }, color: '#16181d', soft: 1.5 },
  // the bare lores, yellowish-green after breeding
  { kind: 'stripe', from: { at: 'eye', t: 0.5, dx: -2 }, to: { at: 'billBase', t: 0.5 }, width: 6, color: '#b8b86c', blur: 1 },
  // the folded wing: blue-grey coverts, the primaries blackish slate, rufous along the bend
  { kind: 'fill', where: { part: 'wingFold' }, color: '#65748a' },
  { kind: 'feathers', where: { part: 'wingFold', s: [0.05, 0.7] }, length: 30, width: 22, center: '#637289', edge: '#74829a', edgeWidth: 1.2, soft: 4, opacity: 0.7 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.72, 1] }, color: '#343b47', soft: 12 },
  { kind: 'fill', where: { part: 'wingFold', s: [0, 0.05], t: [0, 0.4] }, color: '#7a4a36', soft: 4, opacity: 0.6 },
  ...SHARED,
  // olive above with a blackish culmen; the lower mandible and the cutting edges yellow
  { kind: 'fill', where: { part: 'bill' }, color: '#d8a933' },
  { kind: 'fill', where: { part: 'bill', t: [0, 0.42] }, color: '#4b4a3c', soft: 1.5 },
  { kind: 'fill', where: { part: 'bill', t: [0, 0.12] }, color: '#28282a', soft: 1 },
  { kind: 'fill', where: { part: 'legs' }, color: '#4f4a3c' },
]

const JUVENILE: Layer[] = [
  // slate-grey above, duller and browner than the adult; no back plumes
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#5b5f67', side: '#737479', bottom: '#5a5b60' },
  // the breast and belly striped dark grey and white in about equal amounts
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'breast', band: [0.62, 1] }, color: '#55575d', soft: 12 },
  { kind: 'streaks', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0.62, 1] }, color: '#d3d1cc', length: 26, width: 3, spacing: 8, jitter: 0.5, blur: 1, soft: 8, opacity: 0.75 },
  // paler rufous thighs
  { kind: 'fill', where: { part: 'skin', from: 'tailBase', to: 'flank', band: [0.7, 1] }, color: '#ad7654', soft: 30 },
  // the neck dull grey, spotted and washed buff and chestnut, streaked down the front
  { kind: 'base', where: { part: 'skin', from: 'breast', to: 'occiput' }, top: '#666769', side: '#77736f', bottom: '#a0998f', soft: 25 },
  { kind: 'spots', where: { part: 'skin', from: 'breast', to: 'neckUp', band: [0.3, 1] }, color: '#9c7552', size: 3, spacing: 9, jitter: 0.7, blur: 1, soft: 6, opacity: 0.7 },
  { kind: 'streaks', where: { part: 'skin', from: 'breast', to: 'neckUp', band: [0.86, 1] }, color: '#2a2a2e', length: 8, width: 2, spacing: 5, jitter: 0.6, blur: 0.5, soft: 3 },
  { kind: 'streaks', where: { part: 'skin', from: 'breast', to: 'kink', band: [0.8, 1] }, color: '#e4dfd6', length: 10, width: 2, spacing: 6, jitter: 0.7, blur: 0.5, soft: 3, opacity: 0.8 },
  // no black shoulder: the side of the breast grey striped white
  { kind: 'streaks', where: { part: 'skin', from: 'flank', to: 'neckBase', band: [0.3, 0.6] }, color: '#b9b8b6', length: 20, width: 2, spacing: 8, jitter: 0.5, blur: 0.8, soft: 6, opacity: 0.6 },
  // the head: the whole crown and the occiput blackish slate, a short dark crest; the cheeks grey; only the chin and
  // throat white
  { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'billBase' }, color: '#7f7c79', soft: 4 },
  { kind: 'fill', where: { part: 'skin', from: 'neckUp', to: 'billBase', band: [0.72, 1] }, color: '#efede8', soft: 6 },
  { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'billBase', band: [0, 0.4] }, color: '#27292e', soft: 2 },
  { kind: 'stripe', from: { at: 'eye', t: 0.5, dx: -2 }, to: { at: 'billBase', t: 0.5 }, width: 6, color: '#a9b36a', blur: 1 },
  // the folded wing: plain grey coverts, browner, edged rufous and buff; the primaries dark
  { kind: 'fill', where: { part: 'wingFold' }, color: '#5c5f67' },
  { kind: 'feathers', where: { part: 'wingFold', s: [0.03, 0.7] }, length: 26, width: 20, center: '#595c63', edge: '#94775c', edgeWidth: 1.6, soft: 4, opacity: 0.8 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.72, 1] }, color: '#30343b', soft: 12 },
  { kind: 'fill', where: { part: 'wingFold', s: [0, 0.06], t: [0, 0.5] }, color: '#c7b7a6', soft: 4 },
  ...SHARED,
  // darker: the upper mandible black, paler along the edge; the lower dull yellow, horn toward the tip
  { kind: 'fill', where: { part: 'bill' }, color: '#b79043' },
  { kind: 'fill', where: { part: 'bill', t: [0, 0.48] }, color: '#28282b', soft: 1.5 },
  { kind: 'fill', where: { part: 'legs' }, color: '#3d3a33' },
]

export const SPEC: SpeciesSpec = {
  code: 'grbher3',
  commonName: 'Great Blue Heron',
  length: 1.2,
  body: { length: 1, height: 0.5, width: 0.42 },
  neck: { length: 0.95, thickness: 0.13, angle: 70 },
  head: { size: 0.22 },
  bill: { length: 0.32, thickness: 0.08, shape: 'dagger' },
  legs: { length: 0.85, thickness: 0.035 },
  tail: { length: 0.12, angle: 0 },
  wing: { length: 0.95, width: 0.42 },
  posture: 'standing',
  draft: 0,
  plumage: {
    crown: '#f0efe8', cheek: '#e6e4de', throat: '#efeeea', breast: '#86848d', flank: '#4a5058',
    back: '#5c6a7c', wing: '#65748a', speculum: null, rump: '#5c6a7c', tail: '#4f5967',
    bill: '#d8a933', legs: '#4f4a3c', eye: '#e6c53a',
  },
  variants: {
    adult: {},
    juvenile: {
      crown: '#27292e', cheek: '#7f7c79', breast: '#77736f', flank: '#55575d',
      back: '#5b5f67', wing: '#5c5f67', rump: '#5b5f67', bill: '#6f5f3a', legs: '#3d3a33',
    },
  },
  marks: {
    size: 'very large and tall, the biggest bird on the lake: about 0.75 m tall hunting, a metre stretched up',
    bill: 'a long, heavy dagger bill, dusky above and yellow below after breeding; darker on juveniles',
    head: 'adults: a white face and crown centre between broad black stripes that run back into short black plumes; juveniles: the whole crown dark slate, no plumes',
    body: 'blue-grey, a grey neck streaked black and rufous down the front, rusty thighs; adults have a black shoulder patch and long pale back plumes, juveniles are duller and browner with rufous-edged wing coverts. Stands still for long spells with the neck in an S, then strikes',
    legs: 'very long, dull dark legs, wading knee-deep',
  },
  foraging: 'heron',
  wingbeatHz: 2.2,
  detail: {
    measurements: {
      length: 0.909, culmen: 0.135, billDepth: 0.0275, billWidth: 0.017,
      tarsus: 0.165, tibia: 0.105, toe: 0.102, wingChord: 0.477, tail: 0.184,
    },
    // traced from Ritch Pope's adult (see sources; 2048 px, facing left, hunting in its S, wading belly-deep) at
    // 0.628 mm per pixel (the bill's axis, from the middle of its base to the tip, spans 214.9 px for the 135 mm
    // culmen), hip at (1180, 840). The outline was read by hand; the water hides the legs, so they come from the
    // measurements, and the belly is taken at the water. Each station's up, down, and (on the neck and head) tilt, and
    // the stations' places but the hip's, the tail base's, the eye's and the bill base's, were fitted so that the
    // loft's side view (its own 64 rings) covers the outline with the least area between them, the loft never folds,
    // and the eye lands on the photo's eye. The eye and the bill base sit on the bill's axis, so the bill points
    // along the photo's (21.4 degrees below level). The tail base sits where the 184 mm tail reaches the photo's rear tip. The loft lies within
    // 1 mm of the photo on average along the back of the neck, the crown, the throat and the foreneck, and 1.3-1.4 mm
    // along the back, the breast and under the body; at worst the back stands 5.8 mm proud over a dip above the rump,
    // the breast falls 6.5 mm short where it meets the water, the hanging primaries 4.8 mm, and the forehead 3.7 mm
    // behind the culmen's base. The eye lands 0.6 mm from the photo's, the bill tip 1.3 mm
    profile: [
      { label: 'rear',     x: -0.2902, y: -0.1158, up: 0.0303, down: 0.0482, halfWidth: 0.0250 },
      { label: 'rump',     x: -0.2521, y: -0.0741, up: 0.0343, down: 0.0510, halfWidth: 0.0450 },
      { label: 'tailBase', x: -0.1256, y: -0.0346, up: 0.0876, down: 0.0813, halfWidth: 0.0600 },
      { label: 'hip',      x:  0.0000, y:  0.0000, up: 0.1123, down: 0.1151, halfWidth: 0.0680 },
      { label: 'flank',    x:  0.0711, y:  0.0097, up: 0.1149, down: 0.0979, halfWidth: 0.0660 },
      { label: 'breast',   x:  0.1341, y:  0.0251, up: 0.1033, down: 0.0566, halfWidth: 0.0560 },
      { label: 'neckBase', x:  0.1930, y:  0.0487, up: 0.0606, down: 0.0372, halfWidth: 0.0400 },
      { label: 'neckLow',  x:  0.2388, y:  0.0964, up: 0.0290, down: 0.0272, halfWidth: 0.0300, tilt: 25 },
      { label: 'neckRise', x:  0.2717, y:  0.1669, up: 0.0208, down: 0.0240, halfWidth: 0.0240, tilt: 21 },
      { label: 'kink',     x:  0.2730, y:  0.2333, up: 0.0215, down: 0.0193, halfWidth: 0.0220, tilt: -19 },
      { label: 'neckUp',   x:  0.2927, y:  0.2664, up: 0.0232, down: 0.0215, halfWidth: 0.0210, tilt: -10 },
      { label: 'nape',     x:  0.3191, y:  0.2896, up: 0.0241, down: 0.0225, halfWidth: 0.0200, tilt: 6.5 },
      { label: 'occiput',  x:  0.3459, y:  0.3047, up: 0.0273, down: 0.0270, halfWidth: 0.0190, tilt: -2 },
      { label: 'crown',    x:  0.3648, y:  0.3091, up: 0.0321, down: 0.0295, halfWidth: 0.0190 },
      { label: 'eye',      x:  0.4075, y:  0.3098, up: 0.0209, down: 0.0385, halfWidth: 0.0170, tilt: -18 },
      { label: 'billBase', x:  0.4134, y:  0.3075, up: 0.0200, down: 0.0401, halfWidth: 0.0085, tilt: 45 },
    ],
    // The neck bends at six stations from the breast to the occiput. The chain starts at the breast, not at the notch
    // where the neck meets the back (`neckBase`), because the lower neck lies coiled in the breast's plumage in the
    // hunting S and is drawn out of it when the heron stands erect: from the notch the traced neck lifts the crown
    // only about 300 mm above the back, against the erect photo's 456. The kink is where the photo's neck bends
    // hardest, 0.28 of the neck's length down from the occiput (the research's about a third, the C6-C7 hinge)
    rig: {
      neckBase: 'breast', neckMid: 'neckLow', head: 'occiput', hip: 'hip', tailBase: 'tailBase',
      neck: ['breast', 'neckLow', 'kink', 'neckUp', 'nape', 'occiput'],
    },
    // Fitted to the research's measures (section 6: the crown above the back, the bill's angle) with the heron style's
    // body tilt for each, inside the neck guards, and checked by eye against the photos. The hunch goes only as far as
    // the guards allow: the loft can't fold the neck away into the breast's plumage as the photo's heron does, so it
    // lays the neck low and forward, the crown 47 mm above the back. Erect lifts the crown 393 mm above the back, the
    // bill 21 degrees up with the alert tilt, so that the swallow (erect with the head tipped 0.6 rad and no tilt)
    // raises it 26 degrees. The strike loops the neck in front of the breast, as the photo's does; the head's own 5
    // degrees keep its fastest turn, through the 0.12 s strike, at 0.69 rad a frame (0 gave 0.70)
    neckShapes: {
      hunch: [-10.5, -96.5, 68, -5.5, 2.5, 23],
      erect: [27.5, -40.5, 15, 11, 23.5, -22.5],
      strike: [0, 56.5, -84.5, -32, 3, 5],
    },
    // a straight dagger, about 0.6 of its base depth at mid-length, the tip dropping a little (photo)
    bill: { taper: 1.2, curve: -0.012 },
    // the photo's eye, about 10-11 mm across; iris yellow
    eye: { radius: 0.005, t: 0.497, iris: '#e6c53a' },
    wing: {
      // the tip on the photo's primary tips over the rear, the chord from the bend of the wing at the shoulder
      // drooping 17 degrees below straight back to it; the wing hangs from the chord down to the photo's belly
      // line, less 2 mm, its front shallow where the breast's plumes cover it, and about 15 mm short of it over the
      // hip, where the rusty thighs show below it
      wrist: [0.1534, 0.0389], droop: 17,
      outline: [
        [0, 0.04], [0.1, 0.12], [0.2, 0.19], [0.26, 0.2], [0.3, 0.195], [0.4, 0.172], [0.46, 0.172],
        [0.5, 0.172], [0.6, 0.142], [0.7, 0.112], [0.8, 0.086], [0.9, 0.098], [0.95, 0.1], [1, 0.03],
      ],
    },
    // turned -6 degrees from the spine at the tail base, so the tip lies at the photo's rear tip, under the
    // folded primaries
    tail: { shape: 'square', angle: -6 },
    // the adult's occipital plumes, short in September as they regrow: about 100 mm, trailing 20 degrees below level
    parts: [{ kind: 'plume', at: 'occiput', length: 0.1, droop: 20, versions: ['adult'] }],
    plumage: ADULT,
    variants: { adult: ADULT, juvenile: JUVENILE },
    sources: [
      'Dickerman 2004, Bull. B.O.C. 124(4) pp. 242-251 (culmen, tarsus, wing chord, tail; the west-coast cline)',
      'Oberholser 1912, Proc. U.S. Natl. Mus. 43 pp. 531-559 (bill depth; the two Oregon skins; plumages)',
      'Baird, Brewer & Ridgway 1884, Water Birds of North America vol. 1 pp. 14-16 (bare tibia, middle toe; plumages, soft parts after breeding)',
      'Tobias et al. 2022, AVONET (bill width at the nostril)',
      'Bent 1926, Bull. U.S. Natl. Mus. 135 pp. 107-109 (juvenal plumage); Pyle & Howell 2004 (moult, the plumes\' regrowth)',
      'Fleming & Black 2026 (the cervical regions; the kink at C6-C7)',
      'profile traced from iNaturalist 400893943 (c) Ritch Pope, CC BY-NC, https://www.inaturalist.org/observations/400893943',
      'the upright shape and the adult\'s head from iNaturalist 135696252 (c) Andy Frank, CC BY-NC, https://www.inaturalist.org/observations/135696252',
      'the erect shape from iNaturalist 401129065 (c) Remy, CC BY-NC, https://www.inaturalist.org/observations/401129065',
      'the hunch from iNaturalist 60009500 (c) Andy Frank, CC BY-NC, https://www.inaturalist.org/observations/60009500',
      'the strike from iNaturalist 95479281 (c) Patricia, CC BY-NC, https://www.inaturalist.org/observations/95479281',
      'the adult\'s plumes and shoulder from iNaturalist 400053584 (c) axolotl233939, CC BY-NC, https://www.inaturalist.org/observations/400053584',
      'the juvenile from iNaturalist 103937006 (c) vllewis, CC BY-NC, https://www.inaturalist.org/observations/103937006, 320753708 (c) chatterton-blue, CC BY-NC, https://www.inaturalist.org/observations/320753708, and 205275325 (c) notfresco, CC BY-NC, https://www.inaturalist.org/observations/205275325',
      'numbers and marks: docs/research/2026-09-27-great-blue-heron.md',
    ],
  },
}
