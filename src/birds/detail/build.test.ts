import * as THREE from 'three'
import { buildDetailedBird } from './build'
import { measure, billTipNow, billAngleNow } from './measure'
import { signedVolume } from './mesher'
import { BONE_NAMES } from './rig'
import { TEST_SPEC, TEST_DETAIL, TEST_SWIM_SPEC, TEST_SWIM_DETAIL } from './fixture'
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
  it('hands the pose code what it reads from the loft in its Built: the body length, the neck, the crown', () => {
    const m = buildDetailedBird(TEST_SPEC)
    expect(m.built.bodyLength).toBe(m.profile!.length)
    // the test bird's neck has no chain
    expect(m.built.neckAlong).toBeNull()
    expect(m.anatomy.crown).toHaveLength(m.anatomy.head.length)
    const v = new THREE.Vector3()
    m.anatomy.crown.forEach((i, k) => expect(v.fromBufferAttribute(m.mesh.geometry.getAttribute('position') as THREE.BufferAttribute, i).distanceTo(m.anatomy.head[k]!)).toBeLessThan(1e-6))
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
  it('measures how high a wader stands: joint below belly below wing, the belly at its lowest point', () => {
    const m = buildDetailedBird(TEST_SPEC)
    const r = measure(m)
    expect(r.joint).toBeCloseTo(m.anatomy.knee.y, 9)
    expect(r.joint).toBeGreaterThan(0)
    expect(r.belly).toBeGreaterThan(r.joint)
    // the lowest point of the body, which a hunched bird carries forward of its hips; the loft's rings sample the
    // belly, so under the hips it may sit a fraction of a millimetre above the exact belly line
    expect(r.belly).toBeLessThanOrEqual(m.anatomy.bellyY + 0.001)
    expect(r.wingLow).toBeGreaterThan(r.belly)
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
    // built standing, the walk starts from the neutral phase, so the right foot is in stance from 0.2 to 0.8 of a stride
    for (const f of [0.25, 0.35, 0.45, 0.55]) {
      const d = f * stride
      m.group.position.x = d                                 // heading 0 walks along +x
      m.pose({ ...defaultPose(), strideDistance: d, gait: 1 })
      m.group.updateMatrixWorld(true)
      xs.push(toes.getWorldPosition(new THREE.Vector3()).x)
    }
    for (const x of xs) expect(x).toBeCloseTo(xs[0]!, 4)
  })
  it('steps off from standing without sliding a planted foot, whatever the stride phase it stopped at', () => {
    const m = buildDetailedBird(TEST_SPEC)
    const at = (n: string) => m.mesh.skeleton.bones.find(b => b.name === n)!.getWorldPosition(new THREE.Vector3())
    for (const d of [0.013, 0.037, 0.061]) {                 // wherever the last walk left off
      m.pose({ ...defaultPose(), strideDistance: d, gait: 0 })
      m.group.updateMatrixWorld(true)
      const before = [at('toesL'), at('toesR')]
      m.pose({ ...defaultPose(), strideDistance: d, gait: 0.5 })     // easing into the stride, not yet moved
      m.group.updateMatrixWorld(true)
      const after = [at('toesL'), at('toesR')]
      // one foot stays planted exactly where it stood; the other only lifts
      const planted = before.map((p, k) => Math.abs(after[k]!.x - p.x))
      expect(Math.min(...planted), `d ${d}`).toBeLessThan(1e-4)
      expect(Math.max(...planted), `d ${d}`).toBeLessThan(1e-4)
    }
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
  it('probes into the ground by probeDepth at full reach, and leaves the rest pose alone', () => {
    const deep = buildDetailedBird(parseSpeciesSpec({ ...TEST_SPEC, detail: { ...TEST_DETAIL, probeDepth: 0.02 } }))
    for (const lean of [0.8, 1.0]) {
      const p = defaultPose(); p.lean.x = lean; p.reach = 1
      deep.pose(p)
      expect(billTipNow(deep).y, `lean ${lean}`).toBeCloseTo(-0.02, 3)
      expect(billAngleNow(deep), `lean ${lean}`).toBeGreaterThanOrEqual(-Math.PI / 2 - 1e-6)
    }
    deep.pose(defaultPose())
    expect(billTipNow(deep).distanceTo(deep.anatomy.billTip)).toBeLessThan(1e-9)
  })
  it('takes probeDepth 0 to mean the ground itself: the same peck as no probeDepth at all', () => {
    const none = buildDetailedBird(TEST_SPEC)
    const zero = buildDetailedBird(parseSpeciesSpec({ ...TEST_SPEC, detail: { ...TEST_DETAIL, probeDepth: 0 } }))
    for (const reach of [0.3, 0.7, 1]) {
      const p = defaultPose(); p.lean.x = 0.8; p.reach = reach
      none.pose(p); zero.pose(p)
      expect(billTipNow(zero).distanceTo(billTipNow(none)), `reach ${reach}`).toBeLessThan(1e-12)
    }
  })
  it('does nothing at reach 0: the rest pose is the traced bird', () => {
    const m = buildDetailedBird(TEST_SPEC)
    m.pose(defaultPose())
    expect(billTipNow(m).distanceTo(m.anatomy.billTip)).toBeLessThan(1e-9)
  })
  it('refuses what it cannot build', () => {
    // the schema refuses these two at load (spec.test.ts); the builder still does, for a spec that never went through it
    expect(() => buildDetailedBird({ ...TEST_SPEC, posture: 'perched' })).toThrow(/testbird.*detail.perch/)
    expect(() => buildDetailedBird({ ...TEST_SPEC, posture: 'swimming' })).toThrow(/detail.float/)
    const sunk = { ...TEST_SWIM_DETAIL, float: { waterline: 1 } }
    expect(() => buildDetailedBird(parseSpeciesSpec({ ...TEST_SWIM_SPEC, detail: sunk }))).toThrow(/misses the body/)
    expect(() => buildDetailedBird(TEST_SPEC, 'male')).toThrow(/variant/)
    expect(() => buildDetailedBird(parseSpeciesSpec({ ...TEST_SPEC, detail: undefined }))).toThrow(/detail/)
  })
})

describe('a twin', () => {
  it('shares its twin\'s mesh and anatomy at rest, with bones and a pose of its own', () => {
    const a = buildDetailedBird(TEST_SPEC)
    const b = buildDetailedBird(TEST_SPEC, undefined, a)
    expect(b.mesh.geometry).toBe(a.mesh.geometry)
    expect(b.mesh.skeleton).not.toBe(a.mesh.skeleton)
    expect(b.anatomy.billTip.equals(a.anatomy.billTip)).toBe(true)
    expect(b.radius).toBe(a.radius)
    b.pose({ ...defaultPose(), neckExtend: 1 })
    const head = (m: typeof a) => m.mesh.skeleton.bones.find(x => x.name === 'head')!.position.y
    expect(head(b)).toBeGreaterThan(head(a))
    // posed alike, a twin is the same bird to the bone
    a.pose({ ...defaultPose(), neckExtend: 1 })
    a.group.updateMatrixWorld(true); b.group.updateMatrixWorld(true)
    a.mesh.skeleton.bones.forEach((bone, i) => expect(b.mesh.skeleton.bones[i]!.matrixWorld.equals(bone.matrixWorld), bone.name).toBe(true))
  })
  it('leaves the mesh to its twin to dispose of, and must be of its twin\'s species', () => {
    const a = buildDetailedBird(TEST_SPEC)
    let disposed = 0
    a.mesh.geometry.addEventListener('dispose', () => { disposed++ })
    buildDetailedBird(TEST_SPEC, undefined, a).dispose()
    expect(disposed).toBe(0)
    a.dispose()
    expect(disposed).toBe(1)
    expect(() => buildDetailedBird(TEST_SWIM_SPEC, undefined, a)).toThrow('a twin must be a bird of the same species')
  })
})
