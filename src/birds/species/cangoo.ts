import type { SpeciesSpec } from '../spec'
import type { Layer } from '../detail/spec'

// One version, the adult, painted as the valley's resident Western Canada Goose (moffitti): in late September the young
// of the year are full grown and read as adults at 25-45 m (docs/research/2026-09-30-canada-goose.md, sections 3 and 4).
// Colours are the research's words, picked for a field-guide plate from the credited photos. Skin t: 0 the back's
// midline, 0.5 the side at the spine's level, 1 the belly and the foreneck. On the head and the breast the rings fan out
// from the throat and the shoulders (see the profile), so there the spine runs low and t 0.5 sits low on the side.
const ADULT: Layer[] = [
  // grey-brown above, brown-grey on the side, white below
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#5f4f40', side: '#97836f', bottom: '#f0eee8' },
  // the back and scapulars: each feather grey-brown, bordered with a paler shade, in neat rows of crescents
  { kind: 'feathers', where: { part: 'skin', from: 'rump', to: 'chest3', band: [0, 0.34] }, length: 22, width: 26, center: '#5c4c3e', edge: '#bba98f', edgeWidth: 2.5, soft: 6 },
  // the flanks brown-grey, barred pale with the feather edges, darker than the breast
  { kind: 'fill', where: { part: 'skin', from: 'tailBase', to: 's48', band: [0.3, 0.64] }, color: '#8d7a67', soft: 10 },
  { kind: 'feathers', where: { part: 'skin', from: 'tailBase', to: 's48', band: [0.3, 0.64] }, length: 16, width: 34, center: '#857260', edge: '#d3c5b0', edgeWidth: 2.2, soft: 8 },
  // the breast pale, silvery grey to near white at the front, met sharply by the black stocking
  { kind: 'fill', where: { part: 'skin', from: 's48', to: 'neckBase', band: [0.56, 1] }, color: '#ddd6ca', soft: 12 },
  { kind: 'fill', where: { part: 'skin', from: 's28', to: 'neckBase', band: [0.7, 1] }, color: '#e7e1d7', soft: 10 },
  // the belly, the vent and the undertail immaculate white, a bright band at the stern above the water
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 's48', band: [0.64, 1] }, color: '#f2f0ea', soft: 8 },
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'tailBase', band: [0.5, 1] }, color: '#f4f2ed', soft: 4 },
  // the rump blackish slate, and the white band of the uppertail coverts over the black tail
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'rump', band: [0, 0.45] }, color: '#2b2826', soft: 4 },
  { kind: 'stripe', from: { at: 'rump', t: 0.2, dx: -6 }, to: { at: 'rump', t: 0.48, dx: -6 }, width: 8, color: '#efede7', blur: 1.5 },
  // the stocking: head and neck deep black down to a clean line at the neck's base
  { kind: 'fill', where: { part: 'skin', from: 'neckBase', to: 'billBase' }, color: '#161616', soft: 1 },
  // the chinstrap: white from behind and a little above the eye, down and forward under the jaw, unbroken under the
  // chin; laid on the head's rings from the photo, about 20 mm wide behind the eye and 35 mm across the throat
  { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'h96', band: [0.6, 1] }, color: '#f1ede6', soft: 2 },
  { kind: 'fill', where: { part: 'skin', from: 'h66', to: 'eye', band: [0.46, 1] }, color: '#f1ede6', soft: 2 },
  { kind: 'fill', where: { part: 'skin', from: 'h66', to: 'h85', band: [0.31, 1] }, color: '#f1ede6', soft: 2 },
  { kind: 'fill', where: { part: 'skin', from: 'h96', to: 'billBase', band: [0.78, 1] }, color: '#f1ede6', soft: 2 },
  // the folded wing: grey-brown coverts and tertials with pale edges, the primaries plain dusky, nearly black at the tips
  { kind: 'fill', where: { part: 'wingFold' }, color: '#6e5d4c' },
  { kind: 'feathers', where: { part: 'wingFold', s: [0.2, 0.84] }, length: 26, width: 24, center: '#6a5948', edge: '#c6b59d', edgeWidth: 2.5, soft: 4 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.82, 1] }, color: '#2a2522', soft: 4 },
  // the spread wing, seen only if it flies: grey-brown, the primaries dusky; grey-brown below
  { kind: 'fill', where: { part: 'wingSpread' }, color: '#6f6152' },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.5, 1] }, color: '#3a332d', soft: 6 },
  { kind: 'fill', where: { part: 'wingUnder' }, color: '#80766a' },
  // the tail plain deep black
  { kind: 'fill', where: { part: 'tail' }, color: '#151515' },
  { kind: 'fill', where: { part: 'tailUnder' }, color: '#1d1d1d' },
  // bill, legs, and feet deep black
  { kind: 'fill', where: { part: 'bill' }, color: '#121212' },
  { kind: 'fill', where: { part: 'legs' }, color: '#1b1b1b' },
]

export const SPEC: SpeciesSpec = {
  code: 'cangoo',
  commonName: 'Canada Goose',
  length: 0.95,
  body: { length: 1, height: 0.55, width: 0.55 },
  neck: { length: 0.55, thickness: 0.16, angle: 65 },
  head: { size: 0.28 },
  bill: { length: 0.16, thickness: 0.1, shape: 'flat' },
  legs: { length: 0.3, thickness: 0.05 },
  tail: { length: 0.16, angle: 6 },
  wing: { length: 0.85, width: 0.4 },
  posture: 'swimming',
  draft: 0.4,
  plumage: {
    crown: '#141414', cheek: '#f2f0ea', throat: '#f2f0ea', breast: '#c9c0ad', flank: '#8b7f6a',
    back: '#6b6152', wing: '#6a5f50', speculum: null, rump: '#f1efe9', tail: '#1a1a1a',
    bill: '#111111', legs: '#1a1a1a', eye: '#111111',
  },
  variants: {},
  marks: {
    size: 'a very large waterfowl, the biggest bird on the water but the pelicans: nearly twice a Mallard\'s length, long-necked',
    bill: 'a short, black, wedge-shaped bill',
    head: 'a black head and long black neck (the stocking), a white chinstrap from behind the eye under the jaw to the throat',
    body: 'a pale silvery breast; a brown back and wings, each feather edged pale in rows; brown-grey flanks barred pale; a white undertail and a white band over the black tail. Families graze on the lawns and fields by the water; flies in a V',
    legs: 'black legs and webbed feet, seen when it walks and grazes',
  },
  wingbeatHz: 2.6,
  foraging: 'goose',
  detail: {
    measurements: {
      length: 0.663, culmen: 0.0564, billDepth: 0.024, billWidth: 0.022,
      tarsus: 0.092, tibia: 0.015, toe: 0.082, wingChord: 0.489, tail: 0.151,
    },
    // traced from Bernard Spragg's floating goose (see sources; 2400 px, facing right) at 0.39385 mm per pixel (the 56.4 mm
    // culmen spans 143 px), hip at (900, 845). The photo's goose is calling, its head raised and its bill near
    // level; at rest a goose carries its head lower and forward, the bill 17-26 degrees down (research 2.7), so the
    // hand-read outline's head was turned 15 degrees down about its middle and carried 25 px forward and 55 down, the
    // upper neck bending to carry it, and the throat's corner rounded; the square notch where the back meets the hindneck
    // was rounded too, as the feathers round it. Under the water the outline is a keel 60 mm down. Where the body turns
    // into the neck, and the neck into the head, the rings fan out from one point outside the skin (above the back
    // behind the hindneck, and below the throat), each ring the part of its line inside the outline, the spine an arc
    // about that point so the rings stand square to it: the rings there turn together and can't fold back over one
    // another. Between, the stations lie on straight runs (upright rings behind the shoulders, level ones up the neck).
    // The bill's base sits on its axis, 22 degrees below level, a culmen back from the photo's (turned) bill tip; the
    // rear stations' up and down were fitted so that the loft's side view covers the outline with the least area between
    // them. The loft lies within about 1 mm of the outline on average along the back, the hindneck and the crown, and
    // 2 mm along the face, the throat, the foreneck and the breast (at worst 6 mm, under the bill); the eye lands on the
    // photo's, the bill tip 4.6 mm from it
    profile: [
      { label: 'rear',     x: -0.2905, y:  0.0723, up: 0.0030, down: 0.0030, halfWidth: 0.0200 },
      { label: 'rump',     x: -0.2345, y:  0.0569, up: 0.0153, down: 0.0132, halfWidth: 0.0500 },
      { label: 'tailBase', x: -0.1631, y:  0.0471, up: 0.0409, down: 0.0829, halfWidth: 0.0850 },
      { label: 'hip',      x:  0.0000, y:  0.0000, up: 0.0942, down: 0.0898, halfWidth: 0.1200 },
      { label: 'back1',    x:  0.0492, y:  0.0000, up: 0.0920, down: 0.0985, halfWidth: 0.1200, tilt: -0.3 },
      { label: 'flank',    x:  0.1090, y:  0.0006, up: 0.0910, down: 0.1035, halfWidth: 0.1200, tilt: 1.3 },
      { label: 'side1',    x:  0.1193, y:  0.0022, up: 0.0908, down: 0.1064, halfWidth: 0.1200, tilt: 0.2 },
      { label: 's72',      x:  0.1295, y:  0.0049, up: 0.0905, down: 0.1107, halfWidth: 0.1190 },
      { label: 'side2',    x:  0.1393, y:  0.0087, up: 0.0899, down: 0.1166, halfWidth: 0.1180, tilt: -0.1 },
      { label: 's60',      x:  0.1487, y:  0.0135, up: 0.0892, down: 0.1242, halfWidth: 0.1160 },
      { label: 'side3',    x:  0.1575, y:  0.0192, up: 0.0882, down: 0.1336, halfWidth: 0.1140, tilt: 0.1 },
      { label: 's48',      x:  0.1657, y:  0.0258, up: 0.0870, down: 0.1449, halfWidth: 0.1110, tilt: 0.3 },
      { label: 'breast',   x:  0.1719, y:  0.0319, up: 0.0855, down: 0.1559, halfWidth: 0.1080, tilt: -0.1 },
      { label: 's38',      x:  0.1776, y:  0.0386, up: 0.0835, down: 0.1682, halfWidth: 0.1030 },
      { label: 'chest1',   x:  0.1827, y:  0.0457, up: 0.0809, down: 0.1801, halfWidth: 0.0980, tilt: 0.2 },
      { label: 's28',      x:  0.1872, y:  0.0533, up: 0.0770, down: 0.1792, halfWidth: 0.0920 },
      { label: 'chest2',   x:  0.1902, y:  0.0596, up: 0.0722, down: 0.1693, halfWidth: 0.0850, tilt: -0.4 },
      { label: 's20',      x:  0.1928, y:  0.0661, up: 0.0620, down: 0.1544, halfWidth: 0.0780, tilt: 0.3 },
      { label: 'chest3',   x:  0.1945, y:  0.0711, up: 0.0426, down: 0.1368, halfWidth: 0.0720 },
      { label: 'neckBase', x:  0.1964, y:  0.0781, up: 0.0377, down: 0.0906, halfWidth: 0.0600, tilt: 0.3 },
      { label: 's9',       x:  0.1977, y:  0.0847, up: 0.0365, down: 0.0719, halfWidth: 0.0520, tilt: -0.1 },
      { label: 'neck0',    x:  0.1983, y:  0.0899, up: 0.0364, down: 0.0589, halfWidth: 0.0480 },
      { label: 's3',       x:  0.1988, y:  0.0952, up: 0.0366, down: 0.0505, halfWidth: 0.0440, tilt: 0.2 },
      { label: 'neckLow',  x:  0.1989, y:  0.1004, up: 0.0366, down: 0.0463, halfWidth: 0.0400, tilt: 0.5 },
      { label: 'neckUp',   x:  0.1989, y:  0.1048, up: 0.0367, down: 0.0447, halfWidth: 0.0370, tilt: 3.4 },
      { label: 'h14',      x:  0.2009, y:  0.1215, up: 0.0408, down: 0.0415, halfWidth: 0.0360 },
      { label: 'nape',     x:  0.2070, y:  0.1373, up: 0.0436, down: 0.0345, halfWidth: 0.0340, tilt: -0.2 },
      { label: 'h41',      x:  0.2158, y:  0.1501, up: 0.0486, down: 0.0280, halfWidth: 0.0320, tilt: 0.3 },
      { label: 'occiput',  x:  0.2284, y:  0.1614, up: 0.0557, down: 0.0298, halfWidth: 0.0300, tilt: -0.7 },
      { label: 'h66',      x:  0.2399, y:  0.1679, up: 0.0589, down: 0.0331, halfWidth: 0.0280, tilt: 0.4 },
      { label: 'crown',    x:  0.2536, y:  0.1723, up: 0.0554, down: 0.0359, halfWidth: 0.0270, tilt: -1.4 },
      { label: 'h85',      x:  0.2619, y:  0.1736, up: 0.0517, down: 0.0373, halfWidth: 0.0260, tilt: 0.3 },
      { label: 'eye',      x:  0.2730, y:  0.1737, up: 0.0449, down: 0.0383, halfWidth: 0.0250, tilt: -1.9 },
      { label: 'h96',      x:  0.2752, y:  0.1735, up: 0.0432, down: 0.0384, halfWidth: 0.0220, tilt: 0.9 },
      { label: 'lores',    x:  0.2811, y:  0.1726, up: 0.0351, down: 0.0372, halfWidth: 0.0180, tilt: 1.7 },
      { label: 'billBase', x:  0.2938, y:  0.1688, up: 0.0120, down: 0.0119, halfWidth: 0.0110, tilt: -5.3 },
    ],
    rig: {
      neckBase: 'neckBase', neckMid: 'neckLow', head: 'occiput', hip: 'flank', tailBase: 'tailBase',
      neck: ['neckBase', 'neckLow', 'h14', 'nape', 'h41', 'occiput'],
      neckFrom: 'chest3',
      neckBaseDepth: 0.8,
    },
    // Fitted inside the neck guards to the research's measures (section 6.2) with the goose style's own poses. The hunch
    // draws the head down over the breast, the crown 115 mm above the back loafing (bill 25 degrees down). Erect stands
    // the neck straight up, the crown 269 mm above the back with the bill 3 degrees below level (photos 0.23-0.43 m).
    // The strike grazes as the photo does with the body tipped forward: the neck leaving the breast nearly level, then
    // bending down near the head, the bill on the grass 0.24 m ahead of the toes; it heads-dips with the same shape
    neckShapes: {
      hunch: [-35, -29, -0.5, 18, 21, 14],
      erect: [4, 4, 13, 11, 5, -23],
      strike: [0, -31.8, -12, 4.3, 28, 0],
    },
    // At rest the neck is drawn down into its feathers (the photo's is fluffed, its visible length about 0.09 m from the
    // body to the head); erect it stands 0.23-0.43 m (alert photos), which the traced chain's length can't reach:
    // erect it lengthens 2.4 times, and reaching to the grass 1.7 times
    neckStretch: 2.4, reachStretch: 1.7,
    // a wedge, deep at the base and tapering to a rounded nail; the culmen a little concave
    bill: { taper: 0.8, curve: -0.01, hook: 0.0015 },
    // the photo's eye, 10-12 mm across; iris dark brown
    eye: { radius: 0.005, t: 0.41, iris: '#2a1c12' },
    wing: {
      // the tip on the photo's primary tips over the stern, 116 mm above the water, about level with the tail's tip;
      // the chord runs forward level with the top of the folded wing to a wrist hidden in the breast's feathers at the
      // neck's base. In front of a fifth of the chord the wing has no height, under the side and breast feathers; behind,
      // the coverts and tertials hang to the flank feathers' line, deepest (93 mm) at 0.42 of the chord
      wrist: [0.2015, 0.0686], droop: -0.5,
      outline: [
        [0, 0], [0.2, 0], [0.28, 0.08], [0.36, 0.17], [0.42, 0.19], [0.5, 0.165], [0.6, 0.12],
        [0.7, 0.095], [0.78, 0.075], [0.9, 0.035], [0.96, 0.015], [1, 0.004],
      ],
    },
    // turned -0.9 degrees from the spine at the tail base, so the tip lies at the photo's, just past the primaries
    tail: { shape: 'rounded', angle: -0.9 },
    feet: 'webbed',
    // where the water meets the bird on the photo (y = 953): low on the breast, along the lower flank, under the stern
    float: { waterline: -0.0425 },
    amphibious: true,
    // about 6 degrees toward the planted foot on a rear three-quarter photo (research 7.7, low confidence), less than a
    // duck's: the legs are nearer the middle of the body
    waddle: 5,
    // the builder's leg runs from the hip inside the body; longer steps slide the stance foot (research 0.13-0.18 m)
    stepLength: 0.65,
    plumage: ADULT,
    variants: {},
    sources: [
      'Aldrich 1946, Auk 63 pp. 95-104 (culmen, wing chord, tail, tarsus, middle toe of adult moffitti); Baird, Brewer & Ridgway 1884, Water Birds of North America vol. 1 pp. 456-459 (bill depth and width; colours)',
      'Tobias et al. 2022, AVONET (bill depth and width at the nostrils); Kortright 1942, The Ducks, Geese and Swans of North America (lengths and weights)',
      'profile traced from Wikimedia Commons File:Canada goose (Branta canadensis) (8648145588).jpg, Bernard Spragg, CC0',
      'the head and the chinstrap from Wikimedia Commons File:Canada Goose Head Profile.jpg, AskALotl, CC BY-SA 4.0',
      'standing from Wikimedia Commons File:Canada Goose Standing.jpg, Joe Ravi, CC BY-SA 3.0; alert from File:Canada Goose at Marymoor Park.jpg, Dcoetzee, public domain, and File:Branta canadensis HM.jpg, Cephas, CC BY-SA 3.0',
      'grazing from Wikimedia Commons File:Branta canadensis(js)03.jpg, Jerzystrzelecki, CC BY 3.0; the tip-up from iNaturalist 281650946 (c) Anna Burack Wilson, CC BY-NC',
      'colour from iNaturalist 61157864 (c) insectology, CC BY-NC; 62372621 (c) nmrvelj, CC BY-NC; 186642470, sean579, CC0',
      'numbers and marks: docs/research/2026-09-30-canada-goose.md',
    ],
  },
}
