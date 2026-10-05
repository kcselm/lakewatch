import { readFileSync } from 'node:fs'
import * as THREE from 'three'
import { authoredBuilt, authoredFor, authoredMaterial, parseGlb } from './authored'
import { loadAuthoredForTest, TEST_BIRD_GLB } from './authored.testkit'
import { buildDetailedBird, type DetailedBirdModel } from './build'
import { TEST_AUTHORED_SPEC, TEST_SPEC } from './fixture'
import { measure } from './measure'
import { BONE_NAMES } from './rig'
import { parseSpeciesSpec } from '../spec'
import { createBirdModel } from '../factory'
import { defaultPose, type PoseState } from '../model'

const S = TEST_AUTHORED_SPEC
const A = S.authored!
const fresh = async () => {
  const buf = readFileSync(TEST_BIRD_GLB)
  return parseGlb(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer)
}
const posed = (over: Partial<PoseState> = {}): PoseState => ({ ...defaultPose(), ...over })
/** every vertex of a part (anatomy.closed's run of its triangles), where the last pose put it */
function partNow(m: DetailedBirdModel, part: string): THREE.Vector3[] {
  m.group.updateMatrixWorld(true)
  const run = m.anatomy.closed.find(c => c.name === part)!
  const index = m.mesh.geometry.getIndex()!
  const seen = new Set<number>()
  for (let i = run.indexFirst; i < run.indexFirst + run.indexCount; i++) seen.add(index.getX(i))
  return [...seen].map(i => m.mesh.getVertexPosition(i, new THREE.Vector3()))
}

beforeAll(() => loadAuthoredForTest(S, TEST_BIRD_GLB))

describe('an authored bird in the schema', () => {
  it('accepts the test bird', () => {
    expect(A.model).toBe('testbird')
  })
  it('is lofted or authored, never both', () => {
    expect(() => parseSpeciesSpec({ ...S, detail: TEST_SPEC.detail })).toThrow(/not both/)
  })
  it('has textures for every variant, and each version is a variant', () => {
    expect(() => parseSpeciesSpec({ ...S, authored: { ...A, versions: ['adult'] } })).toThrow(/juvenile has no textures/)
    expect(() => parseSpeciesSpec({ ...S, authored: { ...A, versions: ['adult', 'juvenile', 'eclipse'] } })).toThrow(/eclipse/)
  })
  it('needs neckShapes, one bend per label, with a neck chain, and neither without one', () => {
    expect(() => parseSpeciesSpec({ ...S, authored: { ...A, neckShapes: undefined } })).toThrow(/neckShapes/)
    expect(() => parseSpeciesSpec({ ...S, authored: { ...A, neck: 6 } })).toThrow(/one bend per joint/)
    expect(() => parseSpeciesSpec({ ...S, authored: { ...A, neck: undefined } })).toThrow(/needs neck/)
  })
})

describe('the authored loader', () => {
  it('builds one skinned mesh on the builder\'s bones', () => {
    const m = buildDetailedBird(S)
    const meshes: THREE.Mesh[] = []
    m.group.traverse(o => { if (o instanceof THREE.Mesh) meshes.push(o) })
    expect(meshes).toEqual([m.mesh])
    expect(m.mesh.skeleton.bones.map(b => b.name)).toEqual([...BONE_NAMES])
    expect(m.profile).toBeNull()
  })
  it('is what the factory builds for an authored species', () => {
    expect((createBirdModel(S) as DetailedBirdModel).built).toBe(authoredFor(S))
  })
  it('puts each joint at its bone\'s head in the model, the bird\'s right on +z', () => {
    const j = authoredFor(S).joints
    expect(j.head.distanceTo(new THREE.Vector3(0.15, 0.17, 0))).toBeLessThan(1e-6)
    expect(j.tibiaR.distanceTo(new THREE.Vector3(0, -0.03, 0.03))).toBeLessThan(1e-6)
    expect(j.wingL.z).toBeLessThan(0)
  })
  it('weights every vertex to at most four bones, summing to 1', () => {
    const g = authoredFor(S).geometry
    const w = g.getAttribute('skinWeight')
    expect(w.itemSize).toBe(4)
    for (let i = 0; i < w.count; i++) expect(w.getX(i) + w.getY(i) + w.getZ(i) + w.getW(i)).toBeCloseTo(1, 5)
  })
  it('moves each part with its own bone: the skin\'s indices name the builder\'s bones', () => {
    const m = buildDetailedBird(S)
    const rest = partNow(m, 'bill').map(v => v.clone())
    m.pose(posed({ headPitch: 0.5 }))
    const moved = partNow(m, 'bill')
    expect(Math.max(...moved.map((v, k) => v.distanceTo(rest[k]!)))).toBeGreaterThan(0.01)
    // the wings open: both folded wings shrink to their wrists, and the flight wings reach out to their tips
    m.pose(posed({ wingSpread: 1, glide: 1 }))
    const j = authoredFor(S).joints
    for (const v of partNow(m, 'wingFold')) expect(Math.min(v.distanceTo(j.wingFoldL), v.distanceTo(j.wingFoldR))).toBeLessThan(0.001)
    const spread = partNow(m, 'wingSpread')
    expect(Math.max(...spread.map(v => Math.abs(v.z)))).toBeGreaterThan(0.3)
  })
  it('stands an amphibious bird on its feet at afloat 0: the soles on y = 0, the hips over the origin', () => {
    const m = buildDetailedBird(S)
    m.pose(posed({ afloat: 0 }))
    const legs = partNow(m, 'legs')
    expect(Math.min(...legs.map(v => v.y))).toBeCloseTo(0, 5)
    m.group.updateMatrixWorld(true)
    const hip = m.mesh.skeleton.bones.find(b => b.name === 'tibiaR')!.getWorldPosition(new THREE.Vector3())
    expect(hip.x).toBeCloseTo(0, 6)
    // afloat, as modelled: the legs hidden, gathered under the body
    m.pose(posed())
    expect(Math.min(...partNow(m, 'legs').map(v => v.y))).toBeGreaterThan(-0.06)
  })
  it('reads its anatomy from the landmarks and the parts', () => {
    const a = authoredFor(S).anatomy
    expect(a.billTip.distanceTo(new THREE.Vector3(0.23, 0.165, 0))).toBeLessThan(1e-6)
    expect(a.billBaseRing.length).toBeGreaterThan(3)
    expect(a.crown.length).toBeGreaterThan(0)
    // floating on y = 0: the water cuts the body's skin at both ends
    expect(a.waterline.back).toBeLessThan(-0.1)
    expect(a.waterline.front).toBeGreaterThan(0.1)
    expect(a.bodyLowY).toBeCloseTo(-0.06, 3)
    expect(a.flightWing!.tip.z).toBeGreaterThan(0.3)
  })
  it('measures as the model was made', () => {
    const r = measure(buildDetailedBird(S))
    expect(r.culmen).toBeCloseTo(Math.hypot(0.05, 0.005), 6)
    expect(r.tail).toBeCloseTo(Math.hypot(0.07, 0.01), 6)
    expect(r.tarsus).toBeCloseTo(Math.hypot(0.01, 0.07), 6)
    expect(r.draft).toBeCloseTo(0.06, 3)
  })
  it('shares one mesh between twins, and one material per version, the first version the default', () => {
    const a = buildDetailedBird(S, 'adult'), b = buildDetailedBird(S, 'juvenile', a)
    expect(b.mesh.geometry).toBe(a.mesh.geometry)
    expect(a.mesh.material).toBe(buildDetailedBird(S).mesh.material)
    expect(b.mesh.material).not.toBe(a.mesh.material)
    expect(authoredMaterial(S, 'juvenile')).toBe(b.mesh.material)
  })
  it('poses with the same code as a lofted bird: the neck chain bends and the head pumps', () => {
    const m = buildDetailedBird(S)
    m.pose(posed({ neckExtend: 0 }))
    m.group.updateMatrixWorld(true)
    const low = m.parts.head.getWorldPosition(new THREE.Vector3()).y
    m.pose(posed({ neckExtend: 1 }))
    m.group.updateMatrixWorld(true)
    expect(m.parts.head.getWorldPosition(new THREE.Vector3()).y).toBeGreaterThan(low)
  })
})

describe('the authored loader refuses a model that doesn\'t fit', () => {
  it('a neck chain other than authored.neck says', async () => {
    const short = parseSpeciesSpec({ ...S, authored: { ...A, neck: 6, neckShapes: { hunch: [0, 0, 0, 0, 0, 0], erect: [0, 0, 0, 0, 0, 0], strike: [0, 0, 0, 0, 0, 0] } } })
    expect(() => authoredBuilt(short, null as never)).toThrow()
    await expect(fresh().then(s => authoredBuilt(short, s))).rejects.toThrow(/neck6 has a length/)
  })
  it('a missing bone, or one under the wrong parent', async () => {
    const s1 = await fresh()
    s1.getObjectByName('plume')!.name = 'crest'
    expect(() => authoredBuilt(S, s1)).toThrow(/lacks plume/)
    const s2 = await fresh()
    s2.getObjectByName('wingL')!.attach(s2.getObjectByName('handR')!)
    expect(() => authoredBuilt(S, s2)).toThrow(/handR's parent is wingL/)
  })
  it('a missing landmark', async () => {
    const s = await fresh()
    s.getObjectByName('mark_tailTip')!.removeFromParent()
    expect(() => authoredBuilt(S, s)).toThrow(/mark_tailTip/)
  })
})
