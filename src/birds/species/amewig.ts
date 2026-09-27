import type { SpeciesSpec } from '../spec'
import type { Layer } from '../detail/spec'

// The three late-September versions share one traced bird and differ only in paint. Colours are the research's words
// (docs/research/2026-09-25-american-wigeon.md, sections 4 and 9), picked for a field-guide plate from the credited
// photos. The drake's photo was taken from about 15 degrees above, so its markings were carried onto the skin allowing
// for that: a mark on the near side shows in it 10-15 mm lower than it sits. Skin t: 0 the back's midline, about 0.22
// where the folded wing's top edge lies along the side, 0.37 the top of the flank below the wing, 0.56 the water along
// the flank (0.67 at the stern), 1 the belly. The neck meets the breast 4.5 mm in front of neckBase.

/** The spread wing's underside, seen only if it flies: pale ashy grey, the axillaries white. */
const UNDER: Layer[] = [
  { kind: 'fill', where: { part: 'wingUnder' }, color: '#d9d8d2' },
  { kind: 'fill', where: { part: 'wingUnder', s: [0, 0.25], t: [0.4, 1] }, color: '#f1f0ec', soft: 2 },
]

/** The bill of every version: pale blue-grey, the nail and a thin line round the base black, the lower mandible black. */
const bill = (color: string): Layer[] => [
  { kind: 'fill', where: { part: 'bill' }, color },
  { kind: 'fill', where: { part: 'bill', s: [0, 0.76], t: [0.74, 1] }, color: '#1c1c1d', soft: 0.5 },
  { kind: 'fill', where: { part: 'bill', s: [0, 0.035] }, color: '#161616', soft: 0.3 },
  { kind: 'fill', where: { part: 'bill', s: [0.76, 1] }, color: '#141414', soft: 0.5 },
]

/** Greyish-blue feet with dusky webs. */
const LEGS: Layer[] = [{ kind: 'fill', where: { part: 'legs' }, color: '#76848f' }]

/**
 * The adult drake, as the finished birds of late September and October show it: a white crown, a green patch from the
 * eye round the hind head, a speckled cream-buff face; the breast and sides vinaceous-pink, finely vermiculated on the
 * sides; a white patch at the rear of the flank before the velvety black undertail; long vermiculated scapulars over
 * black, white-edged tertials, and the white forewing showing as a bar between the scapulars and the flank.
 */
const MALE: Layer[] = [
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#9a8e88', side: '#bf968a', bottom: '#f1eee8' },
  // the sides and breast, vinaceous, down past the water to the white belly
  { kind: 'fill', where: { part: 'skin', from: 'rump', to: 'neckBase', band: [0.26, 0.82] }, color: '#bf958a', soft: 4 },
  { kind: 'fill', where: { part: 'skin', from: 'flank', to: 'neckBase', band: [0.1, 0.82] }, color: '#c49d91', soft: 6 },
  // the front of the breast, where the neck-base rings' underside faces forward above the water
  { kind: 'fill', where: { part: 'skin', from: 'breast', to: 'neckBase', band: [0.6, 1] }, color: '#c49d91', soft: 3 },
  // fine black vermiculation along the sides, clearest high on the flank under the scapulars
  { kind: 'bars', where: { part: 'skin', from: 'tailBase', to: 'breast', band: [0.2, 0.6] }, color: '#4c3a36', width: 0.35, spacing: 1.1, angle: 90, blur: 0.25, soft: 4, opacity: 0.4 },
  // the back and upper scapulars, pinkish grey, undulated with black
  { kind: 'fill', where: { part: 'skin', from: 'tailBase', to: 'neckBase', band: [0, 0.26] }, color: '#a19490', soft: 4 },
  { kind: 'bars', where: { part: 'skin', from: 'tailBase', to: 'neckBase', band: [0, 0.26] }, color: '#3e3634', width: 0.4, spacing: 1.2, angle: 90, blur: 0.25, soft: 3, opacity: 0.5 },
  // velvety black upper and under tail coverts, the undertail running forward under the water to the vent
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'rump' }, color: '#121212', soft: 3 },
  { kind: 'fill', where: { part: 'skin', from: 'rump', to: 'tailBase', band: [0.66, 1] }, color: '#121212', soft: 3 },
  // the white patch at the rear of the flank, about 13 mm across and 20 mm tall, just above the water
  { kind: 'stripe', from: { at: 'rump', t: 0.55, dx: 3.5 }, to: { at: 'rump', t: 0.55, dx: 12 }, width: 18, color: '#f4f3ef', blur: 1.5 },
  // the head and neck: cream-buff, thickly speckled black, soiled brown behind the cheek, the throat and foreneck greyer
  { kind: 'fill', where: { part: 'skin', from: 'neckBase', to: 'billBase' }, color: '#d5c8a4', soft: 3 },
  { kind: 'fill', where: { part: 'skin', from: 'neckBase', to: 'crown', band: [0.3, 0.85] }, color: '#b99c77', soft: 5, opacity: 0.55 },
  { kind: 'fill', where: { part: 'skin', from: 'neckBase', to: 'lores', band: [0.72, 1] }, color: '#b3aea2', soft: 4 },
  { kind: 'spots', where: { part: 'skin', from: 'neckBase', to: 'billBase' }, color: '#2a2621', size: 0.8, spacing: 1.3, blur: 0.3, soft: 2, opacity: 0.85 },
  { kind: 'stripe', from: { at: 'neckBase', t: 0.3, dx: 2 }, to: { at: 'neckBase', t: 1, dx: 2 }, width: 4.5, color: '#c49d91', blur: 1.5 },
  // the chin dusky
  { kind: 'fill', where: { part: 'skin', from: 'lores', to: 'billBase', band: [0.78, 1] }, color: '#3a3530', soft: 1.5 },
  // blackish green down the back of the neck and round the hind head, confluent with the patch behind the eye
  { kind: 'fill', where: { part: 'skin', from: 'neckBase', to: 'occiput', band: [0, 0.24] }, color: '#131913', soft: 2 },
  { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'crown', band: [0, 0.3] }, color: '#131913', soft: 1.5 },
  // the patch: black at its edges, iridescent green inside, from the eye back to the nape; the eye in a black surround
  { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'eye', band: [0.12, 0.47] }, color: '#141a14', soft: 1 },
  { kind: 'fill', where: { part: 'skin', from: 'nape', to: 'eye', band: [0.17, 0.42] }, color: '#1a5a2d', soft: 1.5 },
  { kind: 'fill', where: { part: 'skin', from: 'occiput', to: 'eye', band: [0.24, 0.38] }, color: '#267a3c', soft: 2, opacity: 0.7 },
  { kind: 'ring', at: { at: 'eye', t: 0.4 }, radius: 3.2, width: 3.5, color: '#121512', blur: 0.8 },
  // the white crown: from the forehead down to the bill's base, back along the middle of the crown to the hind head,
  // narrowing over the eye where the green meets it
  { kind: 'fill', where: { part: 'skin', from: 'eye', to: 'billBase', band: [0, 0.3] }, color: '#f3efe2', soft: 1.5 },
  { kind: 'fill', where: { part: 'skin', from: 'crown', to: 'eye', band: [0, 0.17] }, color: '#f3efe2', soft: 1.5 },
  { kind: 'stripe', from: { at: 'occiput', t: 0.02, dx: 2 }, to: { at: 'crown', t: 0.04, dx: 2 }, width: 5, color: '#f3efe2', blur: 1 },
  // the folded wing: long vermiculated scapulars, a sliver of the white forewing peeping out below them above the
  // flank, black tertials edged white (the lowest all white below), the primary tips dark grey
  { kind: 'fill', where: { part: 'wingFold' }, color: '#a8978d' },
  { kind: 'bars', where: { part: 'wingFold', s: [0, 0.72] }, color: '#2f2927', width: 0.45, spacing: 1.2, angle: 90, blur: 0.25, opacity: 0.6 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.4, 0.6], t: [0.54, 0.7] }, color: '#f5f4f0', soft: 1.5 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.3, 0.7], t: [0.72, 1] }, color: '#bf958a', soft: 1.5 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.7, 0.95] }, color: '#101010', soft: 1.5 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.72, 0.93], t: [0, 0.05] }, color: '#efefea', soft: 0.4 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.74, 0.93], t: [0.3, 0.35] }, color: '#efefea', soft: 0.4 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.76, 0.92], t: [0.6, 0.65] }, color: '#efefea', soft: 0.4 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.72, 0.9], t: [0.88, 1] }, color: '#f2f2ee', soft: 0.4 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.93, 1] }, color: '#3b3d40', soft: 2 },
  // the spread wing: grey-brown primaries, the coverts pure white, grey at their front and tipped black, the speculum
  // green in front and velvety black behind, the tertials black
  { kind: 'fill', where: { part: 'wingSpread' }, color: '#5f5d5b' },
  { kind: 'fill', where: { part: 'wingSpread', s: [0, 0.45], t: [0.08, 0.55] }, color: '#f4f3ef', soft: 1 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0, 0.45], t: [0.55, 0.6] }, color: '#141414', soft: 0.5 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.1, 0.45], t: [0.6, 0.94] }, color: '#1b5b3a', soft: 1 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.1, 0.45], t: [0.78, 0.94] }, color: '#101010', soft: 1 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0, 0.1], t: [0.6, 1] }, color: '#121212', soft: 1 },
  ...UNDER,
  // the tail dark grey, its long central feathers blackish; the under tail coverts black
  { kind: 'fill', where: { part: 'tail' }, color: '#4a4c4e' },
  { kind: 'fill', where: { part: 'tail', t: [0.3, 0.7] }, color: '#1e2022', soft: 2 },
  { kind: 'fill', where: { part: 'tailUnder' }, color: '#2a2b2c' },
  ...bill('#a3b8ca'),
  ...LEGS,
]

/**
 * The female-type bird, standing for adult females, the juveniles of both sexes, and eclipse drakes whose wing is
 * hidden: a cold grey, finely speckled head with a dark smudge round the eye, a warm brown breast, plain orange-rufous
 * flanks, scapulars dark brown with broad rusty fringes, dark tertials with thin white edges.
 */
const FEMALE: Layer[] = [
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#5e4a3c', side: '#b0704d', bottom: '#f0ede6' },
  // the flanks, orange-rufous and plain, the brightest part of the bird
  { kind: 'fill', where: { part: 'skin', from: 'rump', to: 'neckBase', band: [0.26, 0.82] }, color: '#b3714c', soft: 4 },
  // the back and scapulars: dark brown centres, broad rusty-buff fringes
  { kind: 'fill', where: { part: 'skin', from: 'tailBase', to: 'neckBase', band: [0, 0.27] }, color: '#5a4a40', soft: 3 },
  { kind: 'feathers', where: { part: 'skin', from: 'tailBase', to: 'neckBase', band: [0, 0.27] }, length: 14, width: 10, center: '#4f4038', edge: '#a98b6d', edgeWidth: 2, soft: 3 },
  // the breast warm brown, scalloped darker toward the water
  { kind: 'fill', where: { part: 'skin', from: 'flank', to: 'neckBase', band: [0.08, 0.82] }, color: '#9f7a64', soft: 6 },
  { kind: 'fill', where: { part: 'skin', from: 'breast', to: 'neckBase', band: [0.6, 1] }, color: '#9f7a64', soft: 3 },
  { kind: 'feathers', where: { part: 'skin', from: 'flank', to: 'neckBase', band: [0.3, 1] }, length: 7, width: 6, center: '#7a5846', edge: '#a88470', edgeWidth: 1.2, soft: 4, opacity: 0.8 },
  // the undertail white, barred brown; the rear flank rufous
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'rump', band: [0.35, 1] }, color: '#ece6dc', soft: 2 },
  { kind: 'bars', where: { part: 'skin', from: 'rear', to: 'rump', band: [0.35, 1] }, color: '#7a6250', width: 0.8, spacing: 2.4, angle: 10, blur: 0.4, soft: 2, opacity: 0.8 },
  // the head and neck: cold grey, speckled dark, a little paler on the forehead and lores, a dark smudge round and
  // behind the eye
  { kind: 'fill', where: { part: 'skin', from: 'neckBase', to: 'billBase' }, color: '#8d8884', soft: 3 },
  { kind: 'fill', where: { part: 'skin', from: 'eye', to: 'billBase', band: [0.1, 0.7] }, color: '#a19c97', soft: 3 },
  { kind: 'spots', where: { part: 'skin', from: 'neckBase', to: 'billBase' }, color: '#35312e', size: 0.7, spacing: 1.2, blur: 0.3, soft: 2, opacity: 0.8 },
  { kind: 'stripe', from: { at: 'neckBase', t: 0.3, dx: 2 }, to: { at: 'neckBase', t: 1, dx: 2 }, width: 4.5, color: '#9f7a64', blur: 1.5 },
  { kind: 'stripe', from: { at: 'eye', t: 0.42, dx: -9 }, to: { at: 'eye', t: 0.4, dx: 1 }, width: 9, color: '#4a4541', blur: 2.5, opacity: 0.8 },
  { kind: 'fill', where: { part: 'skin', from: 'lores', to: 'billBase', band: [0.8, 1] }, color: '#6f6a66', soft: 1.5 },
  // the folded wing: scapulars as on the back, the flank's top feathers over the lower edge, dark grey-brown tertials
  // with thin white edges, the primaries dark
  { kind: 'fill', where: { part: 'wingFold' }, color: '#5a4a40' },
  { kind: 'feathers', where: { part: 'wingFold', s: [0, 0.72], t: [0, 0.75] }, length: 16, width: 9, center: '#4f4038', edge: '#a98b6d', edgeWidth: 2, soft: 1 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.3, 0.7], t: [0.75, 1] }, color: '#b3714c', soft: 1.5 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.7, 0.95] }, color: '#3c3531', soft: 1.5 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.73, 0.93], t: [0.3, 0.34] }, color: '#e6e2da', soft: 0.4 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.75, 0.92], t: [0.62, 0.66] }, color: '#e6e2da', soft: 0.4 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.72, 0.9], t: [0.92, 1] }, color: '#e6e2da', soft: 0.4 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.93, 1] }, color: '#403b38', soft: 2 },
  // the spread wing: grey-brown, the coverts pale-edged, a white bar on the greater coverts before a dull black speculum
  { kind: 'fill', where: { part: 'wingSpread' }, color: '#6d625a' },
  { kind: 'fill', where: { part: 'wingSpread', s: [0, 0.45], t: [0.48, 0.58] }, color: '#ebe8e2', soft: 0.6 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.1, 0.45], t: [0.6, 0.94] }, color: '#1d1c1b', soft: 1 },
  ...UNDER,
  // the tail grey-brown, pointed, edged narrowly whitish
  { kind: 'fill', where: { part: 'tail' }, color: '#c8c0b4' },
  { kind: 'fill', where: { part: 'tail', t: [0.1, 0.9] }, color: '#6a5f56', soft: 1 },
  { kind: 'fill', where: { part: 'tailUnder' }, color: '#bdb2a4' },
  ...bill('#9eb1c2'),
  ...LEGS,
]

/**
 * A drake in eclipse or part-way out of it, the typical drake of late September: a grey-brown, speckled head with a
 * darker patch from the eye back over the ear; the breast and flanks rich chestnut, darker and redder than a female's;
 * the back dark brown, scalloped; black tertials sharply edged white; the white forewing a broad bar between the
 * scapulars and the flank; a whitish patch at the rear flank before a dark undertail.
 */
const ECLIPSE: Layer[] = [
  { kind: 'base', where: { part: 'skin', from: 'rear', to: 'billBase' }, top: '#4f3d33', side: '#8e4a2e', bottom: '#efece6' },
  { kind: 'fill', where: { part: 'skin', from: 'rump', to: 'neckBase', band: [0.26, 0.82] }, color: '#8e4a2d', soft: 4 },
  { kind: 'fill', where: { part: 'skin', from: 'flank', to: 'neckBase', band: [0.08, 0.82] }, color: '#86492f', soft: 6 },
  { kind: 'fill', where: { part: 'skin', from: 'breast', to: 'neckBase', band: [0.6, 1] }, color: '#86492f', soft: 3 },
  // a few vinaceous, vermiculated feathers coming through on the flank
  { kind: 'feathers', where: { part: 'skin', from: 'tailBase', to: 'flank', band: [0.3, 0.55] }, length: 9, width: 8, center: '#9a6f63', edge: '#8e4a2d', edgeWidth: 2, soft: 4, opacity: 0.35 },
  // the back and scapulars: dark brown, scalloped with rusty fringes, some grey vermiculated feathers
  { kind: 'fill', where: { part: 'skin', from: 'tailBase', to: 'neckBase', band: [0, 0.27] }, color: '#4b3a30', soft: 3 },
  { kind: 'feathers', where: { part: 'skin', from: 'tailBase', to: 'neckBase', band: [0, 0.27] }, length: 14, width: 10, center: '#3f3028', edge: '#9a6a4a', edgeWidth: 1.8, soft: 3 },
  // the stern: a dark undertail behind a smaller, duller whitish patch at the rear of the flank
  { kind: 'fill', where: { part: 'skin', from: 'rear', to: 'rump', band: [0.3, 1] }, color: '#2b2622', soft: 3 },
  { kind: 'fill', where: { part: 'skin', from: 'rump', to: 'tailBase', band: [0.66, 1] }, color: '#3a322c', soft: 3 },
  { kind: 'stripe', from: { at: 'rump', t: 0.56, dx: 4 }, to: { at: 'rump', t: 0.56, dx: 10 }, width: 14, color: '#dcd6cc', blur: 2 },
  // the head and neck grey-brown, finely speckled, a dark patch from the eye back over the ear with a faint green sheen
  { kind: 'fill', where: { part: 'skin', from: 'neckBase', to: 'billBase' }, color: '#7c7063', soft: 3 },
  { kind: 'spots', where: { part: 'skin', from: 'neckBase', to: 'billBase' }, color: '#302922', size: 0.7, spacing: 1.2, blur: 0.3, soft: 2, opacity: 0.8 },
  { kind: 'stripe', from: { at: 'neckBase', t: 0.3, dx: 2 }, to: { at: 'neckBase', t: 1, dx: 2 }, width: 4.5, color: '#86492f', blur: 1.5 },
  { kind: 'stripe', from: { at: 'occiput', t: 0.36, dx: -3 }, to: { at: 'eye', t: 0.4, dx: 1 }, width: 11, color: '#3b322b', blur: 3, opacity: 0.85 },
  { kind: 'stripe', from: { at: 'occiput', t: 0.34, dx: 0 }, to: { at: 'eye', t: 0.36, dx: -3 }, width: 5, color: '#2a5a38', blur: 2, opacity: 0.3 },
  { kind: 'fill', where: { part: 'skin', from: 'lores', to: 'billBase', band: [0.8, 1] }, color: '#4f4640', soft: 1.5 },
  // the folded wing: a brown scapular edge over a broad white forewing bar, the chestnut flank feathers over its lower
  // edge; black tertials edged white; the primaries dark
  { kind: 'fill', where: { part: 'wingFold' }, color: '#4b3a30' },
  { kind: 'feathers', where: { part: 'wingFold', s: [0, 0.72] }, length: 16, width: 9, center: '#3f3028', edge: '#9a6a4a', edgeWidth: 1.8, soft: 1 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.34, 0.66], t: [0.2, 0.8] }, color: '#f5f4f0', soft: 1 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.3, 0.7], t: [0.8, 1] }, color: '#8e4a2d', soft: 1.5 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.7, 0.95] }, color: '#141312', soft: 1.5 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.72, 0.93], t: [0, 0.05] }, color: '#ecebe6', soft: 0.4 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.74, 0.93], t: [0.3, 0.35] }, color: '#ecebe6', soft: 0.4 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.76, 0.92], t: [0.6, 0.65] }, color: '#ecebe6', soft: 0.4 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.72, 0.9], t: [0.88, 1] }, color: '#ecebe6', soft: 0.4 },
  { kind: 'fill', where: { part: 'wingFold', s: [0.93, 1] }, color: '#3a3836', soft: 2 },
  // the spread wing as the drake's: the white coverts in every plumage
  { kind: 'fill', where: { part: 'wingSpread' }, color: '#5f5a55' },
  { kind: 'fill', where: { part: 'wingSpread', s: [0, 0.45], t: [0.08, 0.55] }, color: '#f1f0ec', soft: 1 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0, 0.45], t: [0.55, 0.6] }, color: '#141414', soft: 0.5 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.1, 0.45], t: [0.6, 0.94] }, color: '#1b5b3a', soft: 1 },
  { kind: 'fill', where: { part: 'wingSpread', s: [0.1, 0.45], t: [0.78, 0.94] }, color: '#101010', soft: 1 },
  ...UNDER,
  { kind: 'fill', where: { part: 'tail' }, color: '#5a524c' },
  { kind: 'fill', where: { part: 'tail', t: [0.3, 0.7] }, color: '#302b27', soft: 2 },
  { kind: 'fill', where: { part: 'tailUnder' }, color: '#3a3430' },
  ...bill('#a0b4c6'),
  ...LEGS,
]

export const SPEC: SpeciesSpec = {
  code: 'amewig',
  commonName: 'American Wigeon',
  length: 0.5,
  body: { length: 1, height: 0.56, width: 0.5 },
  neck: { length: 0.28, thickness: 0.16, angle: 55 },
  head: { size: 0.3 },
  bill: { length: 0.14, thickness: 0.09, shape: 'flat' },
  legs: { length: 0.24, thickness: 0.045 },
  tail: { length: 0.16, angle: 12 },
  wing: { length: 0.6, width: 0.3 },
  posture: 'swimming',
  draft: 0.45,
  plumage: {
    crown: '#f1ead6', cheek: '#7f8a80', throat: '#8a8d86', breast: '#b48a7a', flank: '#b58c78',
    back: '#8e7f6a', wing: '#8a8073', speculum: '#2f7a55', rump: '#1e1e1e', tail: '#1a1a1a',
    bill: '#a9c5d1', legs: '#6b6b6b', eye: '#1a1a1a',
  },
  variants: {
    male: {},
    eclipse: {
      crown: '#7a6e62', cheek: '#7c7063', throat: '#857a6e', breast: '#8e4a2d', flank: '#8e4a2d',
      back: '#4b3a30', wing: '#5f5a55', rump: '#2b2622', tail: '#5a524c',
    },
    female: {
      crown: '#8a7d6c', cheek: '#8d8578', throat: '#9a9286', breast: '#a98a76', flank: '#a98a76',
      back: '#7a6a58', wing: '#7f7466', speculum: null, rump: '#6f6252', tail: '#6f6252',
    },
  },
  marks: {
    size: 'a compact, medium-sized duck with a round head and a short neck, riding high with its pointed tail cocked',
    bill: 'a short, small, pale blue-grey bill with a black tip and a thin black line round its base, in every plumage',
    head: 'most birds in late September: a cold grey, finely speckled head with a dark smudge round the eye; the drakes coming out of eclipse greyer-brown with a darker ear patch; a few finished drakes with a white crown and a green patch from the eye round the hind head',
    body: 'orange-rufous flanks on most; chestnut on the eclipse drakes, which often show a white bar along the top of the flank; pinkish on a finished drake, with a white patch before the black undertail. Picks at the surface and dips its head, seldom upending',
    legs: 'grey-blue feet, hidden on the water',
  },
  wingbeatHz: 5.5,
  foraging: 'dabbler',
  detail: {
    measurements: {
      length: 0.311, culmen: 0.036, billDepth: 0.0125, billWidth: 0.016,
      tarsus: 0.038, tibia: 0.005, toe: 0.042, wingChord: 0.252, tail: 0.092,
    },
    // traced from Patricia's drake (see sources; 2048 px, mirrored to face right) at 0.194 mm per pixel (the 36 mm
    // culmen, the mean of the sexes, spans 185 px). The photo's outline was read by hand; each station's up, down and
    // tilt, and the nape's and occiput's places, were fitted so that the loft's side view (its own 64 rings) covers the
    // outline with the least area between them, the loft never folds, and the eye lands on the photo's. The neck's spine
    // runs up the back of this short, thick neck, as a duck's vertebrae do: the neck then bends from near its back, and
    // the back can run level to where the neck rises without the loft folding on the inside of the turn. Under the
    // water, where no photo shows the hull, the outline is a keel 43 mm down from where the water meets the stern to
    // where it meets the breast, raking back under the breast so its front stays above the water. The loft lies within
    // 1.5 mm of the photo over the head and on average within 1.3 mm elsewhere; at worst the back dips 4 mm just behind
    // where the neck rises, the throat stands 4 mm proud, and the breast meets the water 5.5 mm short of the photo's
    // bow, its front 1.7 mm above the water
    profile: [
      { label: 'rear',       x: -0.1025, y: 0.0142, up: 0.0057, down: 0.0022, halfWidth: 0.0070 },
      { label: 'rump',       x: -0.0854, y: 0.0109, up: 0.0147, down: 0.0168, halfWidth: 0.0250 },
      { label: 'tailBase',   x: -0.0602, y: 0.0045, up: 0.0285, down: 0.0262, halfWidth: 0.0450 },
      { label: 'hip',        x: -0.0233, y: 0.0000, up: 0.0390, down: 0.0418, halfWidth: 0.0630 },
      { label: 'flank',      x:  0.0447, y: 0.0000, up: 0.0345, down: 0.0532, halfWidth: 0.0630, tilt: 4 },
      { label: 'breast',     x:  0.0670, y: 0.0035, up: 0.0260, down: 0.0510, halfWidth: 0.0560, tilt: -1 },
      { label: 'neckBase',   x:  0.0816, y: 0.0171, up: 0.0280, down: 0.0550, halfWidth: 0.0340, tilt: 3 },
      { label: 'neckMid',    x:  0.0854, y: 0.0326, up: 0.0205, down: 0.0403, halfWidth: 0.0280, tilt: -16 },
      { label: 'nape',       x:  0.0872, y: 0.0433, up: 0.0190, down: 0.0278, halfWidth: 0.0240, tilt: 4.5 },
      { label: 'occiput',    x:  0.0915, y: 0.0491, up: 0.0203, down: 0.0063, halfWidth: 0.0220, tilt: 29.5 },
      { label: 'crown',      x:  0.1068, y: 0.0511, up: 0.0307, down: 0.0163, halfWidth: 0.0200, tilt: 4 },
      { label: 'eye',        x:  0.1149, y: 0.0497, up: 0.0307, down: 0.0145, halfWidth: 0.0180, tilt: 28 },
      { label: 'lores',      x:  0.1243, y: 0.0427, up: 0.0253, down: 0.0135, halfWidth: 0.0130, tilt: 14 },
      { label: 'billBase',   x:  0.1346, y: 0.0351, up: 0.0070, down: 0.0227, halfWidth: 0.0085, tilt: -5 },
    ],
    rig: { neckBase: 'neckBase', neckMid: 'neckMid', head: 'occiput', hip: 'hip', tailBase: 'tailBase' },
    bill: {
      curve: 0,
      // the nail hooks slightly over the lower mandible's tip
      hook: 0.001,
      // width from the Skullsite skull's top view: parallel-sided to 12 mm behind the tip, then a rounded end (0.38 of
      // the full width 1.4 mm behind the tip); depth from the drake and the eclipse drake in side view, scaled to
      // AVONET's depth at the nostril, falling to about a third at the nail
      profile: [
        [0, 1, 1], [0.2, 1, 0.97], [0.3, 1, 0.88], [0.4, 1, 0.79], [0.5, 1, 0.7], [0.6, 1, 0.57],
        [0.68, 0.96, 0.48], [0.76, 0.9, 0.42], [0.84, 0.77, 0.39], [0.88, 0.68, 0.37], [0.92, 0.55, 0.35],
        [0.96, 0.38, 0.3], [1, 0.12, 0.2],
      ],
    },
    // the eye 8 mm across with its rim, the iris dark brown, the eyelid pale; placed where the photo shows it once the
    // camera's height is allowed for (it shows 6-7 mm lower on the side of the head from 15 degrees above)
    eye: { radius: 0.004, t: 0.4, iris: '#3b2415', lid: { color: '#d9d2c3', width: 0.0005 } },
    wing: {
      // the tip on the photo's primary tips over the stern, 52 mm above the water; the chord runs forward, a little
      // down, along the top of the scapulars to a wrist hidden in the breast feathers under the head. It can droop no
      // more: a wrist lower on the breast stands out from the side where the builder reads the body's width, and the
      // chord then measures over 2% long. In front of 29% of the chord the wing is a line with no height, where the
      // flank and breast feathers cover it; behind that its lower edge follows the top of the flank and the tertials'
      // lower edge, 25-28 mm above the water once the camera's height is allowed for
      wrist: [0.133, 0.0218], droop: -4.5,
      outline: [
        [0, 0], [0.29, 0], [0.336, 0.02], [0.375, 0.042], [0.452, 0.062], [0.529, 0.066], [0.607, 0.069],
        [0.684, 0.076], [0.761, 0.085], [0.838, 0.084], [0.878, 0.073], [0.916, 0.067], [0.955, 0.032], [1, 0.003],
      ],
    },
    // pointed, the middle pair longest; raised 7.9 degrees above the spine at the tail base so the tip lands on the
    // photo's, 44 mm above the water and 25 mm past the wingtips
    tail: { shape: 'wedge', angle: 7.9 },
    feet: 'webbed',
    // where the water meets the bird on the photo's midline, at the breast and under the white rear-flank patch
    // (y = 869); the near-side waterline dips 17 mm below it along the flank, the camera being 15 degrees up
    float: { waterline: -0.0099 },
    plumage: FEMALE,
    variants: { eclipse: ECLIPSE, male: MALE },
    sources: [
      'Baird, Brewer & Ridgway 1884, Water Birds of North America vol. 1 pp. 516-521 (bill, wing, culmen, tarsus, toe; plumages)',
      'Grinnell, Bryant & Storer 1918, The Game Birds of California pp. 106-107; Phillips 1923, A Natural History of the Ducks vol. 2 pp. 189-190 (measurements, plumages, the eclipse drake)',
      'Tobias et al. 2022, AVONET (bill width and depth at the nostril, tail)',
      'Kortright 1953, The Ducks, Geese and Swans of North America pp. 183-185, 383 (plumages, soft parts, field marks, masses)',
      'Cox & Barry 2005, Birding 37(2): 156-164 (the forewing on the water, head shape, the black line round the bill, the pale eyelid)',
      'Wishart 1985, Canadian Field-Naturalist 99: 172-178; Bent 1923 p. 93 (the drakes\' moult out of eclipse in late September)',
      'bill top view from the Skullsite skull of Anas americana, male (measured only)',
      'profile traced from iNaturalist photo 99559895 (observation 62160899) (c) Patricia (insectology), CC BY-NC, https://www.inaturalist.org/photos/99559895',
      'the drake\'s forewing from iNaturalist photo 99559428 (observation 62160899) (c) Patricia (insectology), CC BY-NC, https://www.inaturalist.org/photos/99559428',
      'female from iNaturalist photo 157036064 (observation 94650895) (c) Seymore Gulls, CC BY-NC, https://www.inaturalist.org/photos/157036064',
      'eclipse drake from iNaturalist photo 235207647 (observation 137691785) (c) Patricia (insectology), CC BY-NC, https://www.inaturalist.org/photos/235207647',
      'the forewing on the water and the bill in side view from iNaturalist photo 161503392 (observation 97146479) (c) Seymore Gulls, CC BY-NC, https://www.inaturalist.org/photos/161503392',
      'numbers and marks: docs/research/2026-09-25-american-wigeon.md',
    ],
  },
}
