import * as THREE from 'three'
import { buildDetailedBird } from './build'
import { measure, billTipNow, billAngleNow } from './measure'
import { signedVolume } from './mesher'
import { BONE_NAMES } from './rig'
import { TEST_SPEC, TEST_DETAIL } from './fixture'
import { parseSpeciesSpec } from '../spec'
import { defaultPose, type PoseState } from '../model'
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
    const bones = () => m.mesh.skeleton.bones.map(b => [...b.position.toArray(), ...b.quaternion.toArray(), ...b.scale.toArray()])
    // over-range values must pose the bird exactly as their clamped equivalents do: no stretched neck, no
    // inside-out wings, no over-long stride
    const cases: [Partial<PoseState>, Partial<PoseState>][] = [
      [{ neckExtend: 3, wingSpread: -1, gait: 4, reach: 5 }, { neckExtend: 1, wingSpread: 0, gait: 1, reach: 1 }],
      [{ neckExtend: -2, wingSpread: 2.5, gait: -3, reach: -1 }, { neckExtend: 0, wingSpread: 1, gait: 0, reach: 0 }],
    ]
    for (const [wild, tame] of cases) {
      m.pose({ ...defaultPose(), strideDistance: 0.05, wingPhase: 0.2, ...wild })
      const got = bones()
      for (const v of got.flat()) expect(Number.isFinite(v)).toBe(true)
      m.pose({ ...defaultPose(), strideDistance: 0.05, wingPhase: 0.2, ...tame })
      const want = bones()
      got.forEach((row, i) => row.forEach((v, k) => expect(v, `${m.mesh.skeleton.bones[i]!.name}[${k}]`).toBeCloseTo(want[i]![k]!, 9)))
    }
  })
  it('reaches the bill tip to the ground at full reach, whenever the neck is long enough', () => {
    const m = buildDetailedBird(TEST_SPEC)
    for (const lean of [0.8, 1.0]) {
      const p = defaultPose(); p.lean.x = lean; p.reach = 1
      m.pose(p)
      expect(billTipNow(m).y, `lean ${lean}`).toBeCloseTo(0, 4)
    }
  })
  it('reaches down smoothly: the tip falls as reach rises, and a short neck leaves it above the ground', () => {
    const m = buildDetailedBird(TEST_SPEC)
    const ys = [0, 0.25, 0.5, 0.75, 1].map(reach => { m.pose({ ...defaultPose(), reach }); return billTipNow(m).y })
    for (let i = 1; i < ys.length; i++) expect(ys[i]!).toBeLessThan(ys[i - 1]!)
    expect(ys.at(-1)!).toBeGreaterThan(0)                    // standing upright, a yellowlegs can't reach its feet
  })
  it('never turns the bill past straight down, however far the neck reaches (the wade strike leans 0.5)', () => {
    const m = buildDetailedBird(TEST_SPEC)
    for (const lean of [0, 0.3, 0.5, 0.8, 1.0]) {
      for (const reach of [0.5, 0.8, 1]) {
        const p = defaultPose(); p.lean.x = lean; p.reach = reach
        m.pose(p)
        expect(billAngleNow(m), `lean ${lean} reach ${reach}`).toBeGreaterThanOrEqual(-Math.PI / 2 - 1e-6)
      }
    }
  })
  it('does nothing at reach 0: the rest pose is the traced bird', () => {
    const m = buildDetailedBird(TEST_SPEC)
    m.pose(defaultPose())
    expect(billTipNow(m).distanceTo(m.anatomy.billTip)).toBeLessThan(1e-9)
  })
  it('refuses what it cannot build', () => {
    expect(() => buildDetailedBird(parseSpeciesSpec({ ...TEST_SPEC, posture: 'swimming' }))).toThrow(/standing/)
    expect(() => buildDetailedBird(TEST_SPEC, 'male')).toThrow(/variant/)
    expect(() => buildDetailedBird(parseSpeciesSpec({ ...TEST_SPEC, detail: undefined }))).toThrow(/detail/)
  })
})
