import * as THREE from 'three'
import { buildDetailedBird } from './build'
import { measure } from './measure'
import { signedVolume } from './mesher'
import { BONE_NAMES } from './rig'
import { TEST_SPEC, TEST_DETAIL } from './fixture'
import { parseSpeciesSpec } from '../spec'
import { defaultPose } from '../model'
import { birdModelContract } from '../contract.testkit'

birdModelContract('detailed builder', () => buildDetailedBird(TEST_SPEC))

describe('buildDetailedBird', () => {
  it('is one skinned mesh: one draw call per bird', () => {
    const m = buildDetailedBird(TEST_SPEC)
    const meshes: THREE.Mesh[] = []
    m.group.traverse(o => { if (o instanceof THREE.Mesh) meshes.push(o) })
    expect(meshes).toHaveLength(1)
    expect(meshes[0]).toBe(m.mesh)
    expect(m.mesh.skeleton.bones.map(b => b.name)).toEqual([...BONE_NAMES])
  })
  it('records its spine in group space, through every labelled station', () => {
    const m = buildDetailedBird(TEST_SPEC)
    expect(m.anatomy.spine).toHaveLength(101)
    for (const st of m.anatomy.stations) {
      const nearest = Math.min(...m.anatomy.spine.map(p => p.distanceTo(st.position)))
      expect(nearest, st.label).toBeLessThan(0.004)
    }
  })
  it('builds closed, outward-facing body and bill', () => {
    const m = buildDetailedBird(TEST_SPEC)
    for (const c of m.anatomy.closed) expect(signedVolume(m.mesh.geometry, c.indexFirst, c.indexCount), c.name).toBeGreaterThan(0)
  })
  it('shares one painted material between birds of the same kind', () => {
    expect(buildDetailedBird(TEST_SPEC).mesh.material).toBe(buildDetailedBird(TEST_SPEC).mesh.material)
  })
  it('builds to its measurements', () => {
    const r = measure(buildDetailedBird(TEST_SPEC))
    const m = TEST_DETAIL.measurements
    expect(r.culmen).toBeCloseTo(m.culmen, 3)
    expect(r.billDepth).toBeCloseTo(m.billDepth, 3)
    expect(r.tarsus).toBeCloseTo(m.tarsus, 3)
    expect(r.wingChord).toBeCloseTo(m.wingChord, 3)
    expect(r.tail).toBeCloseTo(m.tail, 3)
    expect(Math.abs(r.tibia - m.tibia) / m.tibia).toBeLessThan(0.15)
    expect(Math.abs(r.length - m.length) / m.length).toBeLessThan(0.05)
  })
  it('swaps the folded wing for the spread one as the wings open', () => {
    const m = buildDetailedBird(TEST_SPEC)
    const bones = Object.fromEntries(m.mesh.skeleton.bones.map(b => [b.name, b]))
    m.pose({ ...defaultPose(), wingSpread: 0 })
    expect(bones.wingFoldL!.scale.x).toBe(1)
    expect(bones.wingL!.scale.x).toBeLessThan(0.01)
    m.pose({ ...defaultPose(), wingSpread: 1 })
    expect(bones.wingFoldL!.scale.x).toBeLessThan(0.01)
    expect(bones.wingL!.scale.x).toBe(1)
  })
  it('plants the stance foot: it stays put in the world while the bird walks over it', () => {
    const m = buildDetailedBird(TEST_SPEC)
    const toes = m.mesh.skeleton.bones.find(b => b.name === 'toesR')!
    const stride = 2 * 0.45 * (m.layout.tibia + m.layout.tarsus)
    const xs: number[] = []
    for (const f of [0.55, 0.65, 0.75, 0.85]) {              // the right foot is in stance for these
      const d = f * stride
      m.group.position.x = d                                 // heading 0 walks along +x
      m.pose({ ...defaultPose(), strideDistance: d, gait: 1 })
      m.group.updateMatrixWorld(true)
      xs.push(toes.getWorldPosition(new THREE.Vector3()).x)
    }
    for (const x of xs) expect(x).toBeCloseTo(xs[0]!, 4)
  })
  it('keeps the feet down and the ankles bent back while standing', () => {
    const m = buildDetailedBird(TEST_SPEC)
    m.pose(defaultPose())
    m.group.updateMatrixWorld(true)
    const at = (n: string) => m.mesh.skeleton.bones.find(b => b.name === n)!.getWorldPosition(new THREE.Vector3())
    expect(at('tarsusR').x).toBeLessThan(at('tibiaR').x)      // intertarsal joint behind the hip
    expect(at('toesR').y).toBeCloseTo(m.layout.footY, 4)
  })
  it('clamps out-of-range pose values instead of breaking the bird', () => {
    const m = buildDetailedBird(TEST_SPEC)
    m.pose({ ...defaultPose(), neckExtend: 3, wingSpread: -1, gait: 4, strideDistance: 0.05, tailTilt: 0.3 })
    m.group.updateMatrixWorld(true)
    for (const b of m.mesh.skeleton.bones) {
      for (const v of [...b.position.toArray(), ...b.quaternion.toArray(), ...b.scale.toArray()]) expect(Number.isFinite(v), b.name).toBe(true)
    }
    const fold = m.mesh.skeleton.bones.find(b => b.name === 'wingFoldR')!
    expect(fold.scale.x).toBe(1)                               // wingSpread -1 reads as folded
    expect(m.parts.head.getWorldScale(new THREE.Vector3()).x).toBeCloseTo(1, 6)
  })
  it('refuses what it cannot build', () => {
    expect(() => buildDetailedBird(parseSpeciesSpec({ ...TEST_SPEC, posture: 'swimming' }))).toThrow(/standing/)
    expect(() => buildDetailedBird(TEST_SPEC, 'male')).toThrow(/variant/)
    expect(() => buildDetailedBird(parseSpeciesSpec({ ...TEST_SPEC, detail: undefined }))).toThrow(/detail/)
  })
})
