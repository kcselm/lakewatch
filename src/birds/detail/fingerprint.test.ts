import * as THREE from 'three'
import { SPECIES } from '../species'
import { buildDetailedBird, type DetailedBirdModel } from './build'
import { billTipNow } from './measure'
import { defaultPose, type PoseState } from '../model'

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
// bird's mesh, its skinning, its texture layout, or any of its poses by a micrometre changes these.
const EXPECTED: Record<string, { geometry: string; poses: string }> = {
  killde: { geometry: 'f5d077d0', poses: '4d9550b0' },
  leasan: { geometry: '83eeff1f', poses: '0cd6b93e' },
  greyel: { geometry: '7671be05', poses: '88449834' },
  lesyel: { geometry: '923592bf', poses: 'e640b069' },
  pecsan: { geometry: 'fc0011fe', poses: 'bac5bab5' },
  lobdow: { geometry: '2951d8a8', poses: 'be6320da' },
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
