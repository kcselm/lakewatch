import * as THREE from 'three'
import { SPECIES } from '../species'
import { buildDetailedBird, type DetailedBirdModel } from './build'
import { billTipNow } from './measure'
import { defaultPose, type PoseState } from '../model'
import { paintAtlas } from '../paint/painter'
import { createProfile } from './profile'
import { layersFor } from './spec'

/**
 * FNV-1a over 32-bit integers. Every float is rounded to a micrometre (or a millionth of a texture) first, so the
 * print sees any real change to the geometry and none of the last-bit noise a different Math library might add.
 */
function hasher() {
  let h = 2166136261
  const int = (n: number) => {
    for (let k = 0; k < 4; k++) h = Math.imul(h ^ ((n >>> (k * 8)) & 0xff), 16777619)
  }
  return {
    int,
    float(v: number) { int(Math.round(v * 1e6)) },
    hex: () => (h >>> 0).toString(16).padStart(8, '0'),
  }
}

/** The rest-pose mesh: vertex positions, texture coordinates, bone indices and weights, and the triangles. */
function geometryPrint(m: DetailedBirdModel): string {
  const g = m.mesh.geometry
  const h = hasher()
  for (const name of ['position', 'uv', 'skinWeight']) for (const v of (g.getAttribute(name) as THREE.BufferAttribute).array) h.float(v)
  for (const v of (g.getAttribute('skinIndex') as THREE.BufferAttribute).array) h.int(v)
  for (const v of g.getIndex()!.array) h.int(v)
  return h.hex()
}

/**
 * Poses the game uses, one after another on the same bird as the game would: rest, walking, flying, pecks, probes. No
 * tailTilt: no behaviour gives a standing bird one, and the swimmers' round turns its sign round in the detailed
 * builder (Task 4), so that a positive tailTilt lifts the tail as PoseState says.
 */
type Patch = Partial<Omit<PoseState, 'lean'>> & { leanX?: number; leanZ?: number }
const POSES: Patch[] = [
  {},
  { gait: 1, strideDistance: 0.07 },
  { gait: 0.4, strideDistance: 0.13 },
  { wingSpread: 1, wingPhase: 0.3 },
  { neckExtend: 0, headBob: 0.1, leanZ: 0.2 },
  { neckExtend: 1, headBob: -0.05 },
  { reach: 1 },
  { reach: 0.3, leanX: 0.8 },
  { reach: 0.7, leanX: 0.8, leanZ: 0.1 },
  { reach: 1, leanX: 0.8 },
  { reach: 1, neckExtend: 1, leanX: 1 },
  { reach: 0.6, neckExtend: 0.9, leanX: 0.5 },
]

/** The bones every detailed bird has had since the builder began; a bone added later, with no skin of its own on these birds, is not in the print. */
const BONES = [
  'root', 'body', 'neck', 'neckMid', 'head', 'bill', 'tail', 'wingL', 'wingR', 'wingFoldL', 'wingFoldR',
  'legs', 'tibiaL', 'tarsusL', 'toesL', 'tibiaR', 'tarsusR', 'toesR',
]

/** Every bone's matrix and the bill tip, through POSES. */
function posePrint(m: DetailedBirdModel): string {
  const h = hasher()
  const bones = BONES.map(n => m.mesh.skeleton.bones.find(b => b.name === n)!)
  for (const patch of POSES) {
    const { leanX = 0, leanZ = 0, ...rest } = patch
    const p: PoseState = { ...defaultPose(), ...rest }
    p.lean.set(leanX, 0, leanZ)
    m.pose(p)
    m.group.updateMatrixWorld(true)
    for (const b of bones) for (const e of b.matrixWorld.elements) h.float(e)
    const tip = billTipNow(m)
    h.float(tip.x); h.float(tip.y); h.float(tip.z)
  }
  return h.hex()
}

// Prints taken on master at c588f75, before the swimmers round. A change to the builder that moves any shipped
// bird's mesh, its skinning, its texture layout, or any of its poses by a micrometre changes these. The changes
// since: the swimmers round retraced the dowitcher's throat with tilted sections (Task 5), so its prints are new; and
// every `poses` print moved, knowingly, when headBob gained the head pump's rise and fall (the head goes up half as far
// as it goes forward; Task 10 review). Only POSES' two headBob poses move: in the game only the coot sets a non-zero
// headBob, so no shipped bird moves differently. The geometry prints are untouched.
// Task 19b moved every geometry print, knowingly: the folded wing now stands GAP (1.5 mm) clear of the loft as it is
// meshed, along the wing's normal, everywhere on it, on 27 columns (it had 14, each now every other one). The pose
// prints moved with the folded wing's bone, which sits at the wrist, wherever the wrist moved; the yellowlegs' wrists
// lie off the body, where nothing moved, so their pose prints did not. The atlases are untouched. Then the wing kept
// further off skin that moves with the neck (wing.ts, FLARE): every geometry print but the grebe's moved again (its
// wing lies near no such skin), and the pose prints wherever the wrist moved (not the Mallard's, nor the Lesser
// Yellowlegs'). Then each column's rows were spaced along the skin, and the wing pulled back in close to it: every
// geometry print moved again, and the pose prints of the Killdeer, the Least Sandpiper, the Greater Yellowlegs and the
// Dowitcher, whose wrists moved.
const EXPECTED: Record<string, { geometry: string; poses: string }> = {
  killde: { geometry: '7c0165b2', poses: '1e8af947' },          // were f5d077d0, f8173f03 before Task 19b; poses 4d9550b0 before the head pump's arc
  leasan: { geometry: '08195eea', poses: '8da0f82d' },          // were 83eeff1f, cfa4b2d9; poses 0cd6b93e
  greyel: { geometry: '115716c3', poses: 'f5f09105' },          // geometry was 7671be05; poses 88449834
  lesyel: { geometry: '7d825b07', poses: 'b525d3d3' },          // geometry was 923592bf; poses e640b069
  pecsan: { geometry: '7973625f', poses: 'ff0f04c9' },          // were fc0011fe, 086a1105; poses bac5bab5
  lobdow: { geometry: 'fb46c144', poses: '2b3e77bf' },          // the throat retraced (Task 5); were bedf44dc, f52423c1; poses 449d38d8
  mallar3: { geometry: '3d92faa1', poses: 'e879d30e' },         // the Mallard, detailed (Task 14); were 0e8b620c, 9e4a41a2; poses 821985c4
  pibgre: { geometry: '3e8d46e5', poses: '87a95e1c' },          // the Pied-billed Grebe, detailed (Task 19); were 7aa2294d, 52b7741a; geometry bc526bd5 before the wing's last tenth flattened
  amewig: { geometry: 'bac74eba', poses: 'f90d45d9' },          // the American Wigeon, detailed (Task 16); were 23baa5a5, 8002ac5d
  norsho: { geometry: '43f8e74d', poses: '3a31c6da' },          // the Northern Shoveler, detailed (Task 17); were 457394f6, 24395fd5
  y00475: { geometry: '3d6eeba6', poses: 'eb57fa07' },          // the American Coot, detailed (Task 18); the chin refitted (review); were 5c786913, 6e241e2f
  gadwal: { geometry: '0ae3390b', poses: 'c200f85d' },          // the Gadwall, detailed (Task 15); were d4acba2f, 420e1f19; tail base back to 47 mm (19b)
  grbher3: { geometry: 'd5f4b4fb', poses: 'cf739662' },        // the Great Blue Heron, detailed (herons Task 6)
  greegr: { geometry: 'c45dff17', poses: 'c4409809' },         // the Great Egret, detailed (herons Task 7)
  amwpel: { geometry: '97b7e899', poses: '090f7a1e' },         // the American White Pelican, detailed (the pelican round)
  belkin1: { geometry: '08eb3202', poses: '91be1992' },        // the Belted Kingfisher, detailed and perched (the kingfisher round)
}

describe('the shipped detailed birds build exactly as before', () => {
  const detailed = Object.values(SPECIES).filter(s => s.detail)
  it('covers every detailed species', () => {
    expect(detailed.map(s => s.code).sort()).toEqual(Object.keys(EXPECTED).sort())
  })
  for (const spec of detailed) {
    it(`${spec.code}: the same mesh and the same poses`, () => {
      const m = buildDetailedBird(spec)
      expect({ geometry: geometryPrint(m), poses: posePrint(m) }).toEqual(EXPECTED[spec.code])
    })
  }
})

/** Every texel of a species' painted atlas, for one plumage. */
function atlasPrint(spec: (typeof SPECIES)[string], variant?: string): string {
  const d = spec.detail!
  const px = paintAtlas({ code: spec.code, detail: d, layers: layersFor(d, variant), profile: createProfile(d.profile) })
  const h = hasher()
  for (let i = 0; i < px.length; i += 4) h.int(px[i]! | (px[i + 1]! << 8) | (px[i + 2]! << 16))
  return h.hex()
}

// Painted on master at c588f75. New atlas regions go in free space, so every shipped bird's atlas stays texel for texel
// what it was. The dowitcher's is new: its retraced neck and head (Task 5) give its skin new lengths and girths.
const EXPECTED_ATLAS: Record<string, string> = {
  killde: '3e3455e3', leasan: 'e132a9b2', greyel: '27f746a6', lesyel: '4b6f7821', pecsan: '07f03e17', lobdow: 'e1e47f53',
  // new: the Mallard's three versions (Task 14); with no version it paints the drake's
  mallar3: '6fdb2766', 'mallar3:male': '6fdb2766', 'mallar3:maleMoult': '3f09c818', 'mallar3:female': 'f09b0574',
  // new: the Pied-billed Grebe's two versions (Task 19); with no version it paints the basic adult's
  pibgre: '85bc5af8', 'pibgre:basic': '85bc5af8', 'pibgre:juvenile': '302095eb',
  // new: the American Wigeon's three versions (Task 16); with no version it paints the female-type bird's
  amewig: '75dc9bbf', 'amewig:female': '75dc9bbf', 'amewig:eclipse': '5ca710c7', 'amewig:male': 'bd49e4d9',
  // new: the Northern Shoveler's two versions (Task 17); with no version it paints the female's
  norsho: 'd7db4d80', 'norsho:eclipse': '09744929', 'norsho:female': 'd7db4d80',
  // new: the Coot's two versions (Task 18); with no version it paints the adult's
  y00475: '6ea851ec', 'y00475:adult': '6ea851ec', 'y00475:juvenile': '0afe9995',
  // new: the Gadwall's two versions (Task 15); with no version it paints the female's. Task 19b put the tail base back to
  // 47 mm each side; the skin's girth there sets its atlas layout, so both versions' prints changed (were 423851a1 and
  // d6f3b199)
  gadwal: 'cf7aa4de', 'gadwal:male': '3fc0ff05', 'gadwal:female': 'cf7aa4de',
  // new: the Great Blue Heron's two versions (herons Task 6); with no version it paints the adult's
  grbher3: '9105d375', 'grbher3:adult': '9105d375', 'grbher3:juvenile': 'e21bad72',
  // new: the Great Egret, one version (herons Task 7)
  greegr: '434a6321',
  // new: the American White Pelican's two versions (the pelican round); with no version it paints the adult's
  amwpel: '1e4378fc', 'amwpel:adult': '1e4378fc', 'amwpel:juvenile': '72d8102c',
  // new: the Belted Kingfisher's two versions (the kingfisher round); with no version it paints the female's
  belkin1: 'd138ec16', 'belkin1:female': 'd138ec16', 'belkin1:male': 'bbf02c32',
}

describe('the shipped detailed birds paint exactly as before', () => {
  const atlases = Object.values(SPECIES).filter(s => s.detail).flatMap(s => [undefined, ...Object.keys(s.variants)].map(v => [s, v] as const))
  it('covers every detailed species and plumage', () => {
    expect(atlases.map(([s, v]) => (v ? `${s.code}:${v}` : s.code)).sort()).toEqual(Object.keys(EXPECTED_ATLAS).sort())
  })
  for (const [spec, variant] of atlases) {
    const key = variant ? `${spec.code}:${variant}` : spec.code
    it(`${key}: the same atlas`, () => expect(atlasPrint(spec, variant)).toBe(EXPECTED_ATLAS[key]))
  }
})
