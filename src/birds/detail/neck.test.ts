import * as THREE from 'three'
import { detailSchema } from './spec'
import { buildDetailedBird, type DetailedBirdModel } from './build'
import { loftWeights, RINGS, RADIAL } from './loft'
import { createProfile } from './profile'
import { chainBones, NECK_BONES } from './rig'
import { billTipNow, billAngleNow } from './measure'
import { posedFold, passThrough } from './neck.testkit'
import { TEST_HERON_DETAIL, TEST_HERON_SPEC, TEST_SPEC } from './fixture'
import { defaultPose, type PoseState } from '../model'

type Patch = Partial<Omit<PoseState, 'lean'>> & { leanX?: number }
function posed(patch: Patch = {}): PoseState {
  const { leanX = 0, ...rest } = patch
  const p: PoseState = { ...defaultPose(), ...rest }
  p.lean.set(leanX, 0, 0)
  return p
}

const boneAt = (m: DetailedBirdModel, name: string) => {
  m.group.updateMatrixWorld(true)
  return m.mesh.skeleton.bones.find(b => b.name === name)!.getWorldPosition(new THREE.Vector3())
}
const CHAIN = chainBones(TEST_HERON_DETAIL.rig.neck!.length)
const SHAPES = TEST_HERON_DETAIL.neckShapes!

describe('a chained neck in the schema', () => {
  it('accepts the test heron', () => {
    expect(detailSchema.parse(TEST_HERON_DETAIL).rig.neck).toHaveLength(6)
  })
  it('runs from neckBase, through neckMid, to head', () => {
    const neck = ['neckLow', 'kink', 'neckUp', 'nape', 'occiput']
    expect(() => detailSchema.parse({ ...TEST_HERON_DETAIL, rig: { ...TEST_HERON_DETAIL.rig, neck } })).toThrow(/neckBase, neckMid/)
    const shortHead = ['neckBase', 'neckLow', 'kink', 'neckUp', 'nape']
    expect(() => detailSchema.parse({ ...TEST_HERON_DETAIL, rig: { ...TEST_HERON_DETAIL.rig, neck: shortHead } })).toThrow(/neckBase, neckMid/)
  })
  it('keeps its labels in order along the spine', () => {
    const neck = ['neckBase', 'neckLow', 'neckUp', 'kink', 'nape', 'occiput']
    expect(() => detailSchema.parse({ ...TEST_HERON_DETAIL, rig: { ...TEST_HERON_DETAIL.rig, neck } })).toThrow(/along the spine/)
  })
  it('names only stations the profile has', () => {
    const neck = ['neckBase', 'neckLow', 'bend', 'neckUp', 'nape', 'occiput']
    expect(() => detailSchema.parse({ ...TEST_HERON_DETAIL, rig: { ...TEST_HERON_DETAIL.rig, neck } })).toThrow(/label: bend/)
  })
  it('has at most seven joints', () => {
    const neck = ['neckBase', 'neckLow', 'kink', 'neckUp', 'nape', 'occiput', 'crown', 'eye']
    expect(() => detailSchema.parse({ ...TEST_HERON_DETAIL, rig: { ...TEST_HERON_DETAIL.rig, neck } })).toThrow()
  })
  it('needs its shapes, one bend per joint, and shapes need a chain', () => {
    expect(() => detailSchema.parse({ ...TEST_HERON_DETAIL, neckShapes: undefined })).toThrow(/needs neckShapes/)
    expect(() => detailSchema.parse({ ...TEST_HERON_DETAIL, neckShapes: { ...SHAPES, erect: [0, 0, 0] } })).toThrow(/neckShapes.erect needs one bend per joint \(6\)/)
    expect(() => detailSchema.parse({ ...TEST_SPEC.detail!, neckShapes: SHAPES })).toThrow(/neckShapes needs rig.neck/)
  })
})

describe('chainBones', () => {
  it('gives the first labels - 1 neck joints, then the head', () => {
    expect(chainBones(3)).toEqual(['neck', 'neckMid', 'head'])
    expect(chainBones(7)).toEqual([...NECK_BONES, 'head'])
    expect(() => chainBones(2)).toThrow()
    expect(() => chainBones(8)).toThrow()
  })
})

describe('the chained neck\'s skin', () => {
  const profile = createProfile(TEST_HERON_DETAIL.profile)
  const rig = TEST_HERON_DETAIL.rig
  it('hands off from each joint to the next along the chain, and always sums to 1', () => {
    for (let k = 0; k <= 200; k++) {
      const w = loftWeights(k / 200, profile, rig)
      expect(w.reduce((s, [, v]) => s + v, 0)).toBeCloseTo(1, 12)
    }
    const weightOf = (u: number, bone: string) => loftWeights(u, profile, rig).reduce((s, [b, v]) => s + (b === bone ? v : 0), 0)
    rig.neck!.forEach((label, i) => expect(weightOf(profile.uOf(label), CHAIN[i]!), label).toBeCloseTo(1, 12))
    const kink = profile.uOf('kink'), up = profile.uOf('neckUp')
    expect(weightOf((kink + up) / 2, 'neck3')).toBeCloseTo(0.5, 12)
    expect(weightOf((kink + up) / 2, 'neck4')).toBeCloseTo(0.5, 12)
  })
})

describe('the chained neck', () => {
  it('puts a joint at every label of the chain', () => {
    const m = buildDetailedBird(TEST_HERON_SPEC)
    const spine = (label: string) => m.anatomy.stations.find(s => s.label === label)!.position
    TEST_HERON_DETAIL.rig.neck!.forEach((label, i) => expect(boneAt(m, CHAIN[i]!).distanceTo(spine(label))).toBeLessThan(1e-9))
    // the joint it doesn't use sits at its last joint before the head
    expect(boneAt(m, 'neck6').distanceTo(boneAt(m, 'neck5'))).toBeLessThan(1e-12)
  })
  it('parks an unchained neck\'s spare joints at neckMid, so its head hangs from them as it did from neckMid', () => {
    const m = buildDetailedBird(TEST_SPEC)
    for (const b of ['neck3', 'neck4', 'neck5', 'neck6']) expect(boneAt(m, b).distanceTo(boneAt(m, 'neckMid'))).toBeLessThan(1e-12)
  })
  it('bends each joint into its shape: the hunch at 0, the trace at 0.5, erect at 1, and in between', () => {
    const m = buildDetailedBird(TEST_HERON_SPEC)
    const bends = () => CHAIN.map(n => THREE.MathUtils.radToDeg(m.mesh.skeleton.bones.find(b => b.name === n)!.rotation.z))
    const expectBends = (want: number[]) => bends().forEach((v, i) => expect(v).toBeCloseTo(want[i]!, 9))
    m.pose(posed({ neckExtend: 0 })); expectBends(SHAPES.hunch)
    m.pose(posed({ neckExtend: 0.5 })); expectBends(SHAPES.hunch.map(() => 0))
    m.pose(posed({ neckExtend: 1 })); expectBends(SHAPES.erect)
    m.pose(posed({ neckExtend: 0.25 })); expectBends(SHAPES.hunch.map(v => v / 2))
    m.pose(posed({ neckExtend: 0.75 })); expectBends(SHAPES.erect.map(v => v / 2))
    // out of range holds to the ends
    m.pose(posed({ neckExtend: -1 })); expectBends(SHAPES.hunch)
    m.pose(posed({ neckExtend: 2 })); expectBends(SHAPES.erect)
  })
  it('keeps the traced shape at 0.5: the loft as posed is the loft as built', () => {
    const m = buildDetailedBird(TEST_HERON_SPEC)
    m.pose(posed())
    m.group.updateMatrixWorld(true)
    const g = m.mesh.geometry.getAttribute('position') as THREE.BufferAttribute
    const v = new THREE.Vector3()
    // the loft's rings, the geometry's first vertices; to a micrometre, since the geometry is stored in float32
    for (let i = 0; i < RINGS * RADIAL; i++) expect(m.mesh.getVertexPosition(i, v).distanceTo(new THREE.Vector3().fromBufferAttribute(g, i))).toBeLessThan(1e-6)
  })
  it('keeps every segment\'s length in every shape and on the way between them', () => {
    const m = buildDetailedBird(TEST_HERON_SPEC)
    const lengths = () => CHAIN.slice(1).map((n, i) => boneAt(m, n).distanceTo(boneAt(m, CHAIN[i]!)))
    m.pose(posed())
    const rest = lengths()
    for (const patch of [
      ...[0, 0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9, 1].map(neckExtend => ({ neckExtend })),
      ...[0.25, 0.5, 0.75, 1].map(reach => ({ reach, leanX: 0.5 * reach })),
      { reach: 1, neckExtend: 0, leanX: 0.5 },
      { neckExtend: 1, headPitch: 0.9 },
    ]) {
      m.pose(posed(patch))
      lengths().forEach((l, i) => expect(Math.abs(l - rest[i]!), JSON.stringify(patch)).toBeLessThan(0.0001))
    }
  })
  it('folds no ring back over the one before it, and passes no skin through skin, in any shape or between them', () => {
    const m = buildDetailedBird(TEST_HERON_SPEC)
    for (const patch of [
      ...[0, 0.25, 0.5, 0.75, 1].map(neckExtend => ({ neckExtend })),
      ...[0.25, 0.5, 0.75, 1].map(reach => ({ reach, leanX: 0.5 * reach })),
      ...[0.25, 0.5, 1].map(reach => ({ reach, neckExtend: 0, leanX: 0.5 * reach })),
      { neckExtend: 1, headPitch: 0.9 },
    ]) {
      m.pose(posed(patch))
      expect(posedFold(m, 0.3) * 1000, JSON.stringify(patch)).toBeLessThan(0.1)
      expect(passThrough(m, 0.3).depth * 1000, JSON.stringify(patch)).toBeLessThan(3)
    }
  })
  it('reaches the bill tip to its mark: the ground, below it by reachDepth, or above it when reachDepth is negative', () => {
    const m = buildDetailedBird(TEST_HERON_SPEC)
    for (const reachDepth of [0, 0.02, -0.1, -0.2]) {
      m.pose(posed({ reach: 1, leanX: 0.5, reachDepth, reachAngle: 1.1 }))
      expect(billTipNow(m).y, `reachDepth ${reachDepth}`).toBeCloseTo(-reachDepth, 3)
    }
    // a neck of two joints too: a negative reachDepth no longer counts as 0
    const shorebird = buildDetailedBird(TEST_SPEC)
    for (const reachDepth of [0, -0.02]) {
      shorebird.pose(posed({ reach: 1, neckExtend: 1, leanX: 0.5, reachDepth }))   // wade's STRIKE
      expect(billTipNow(shorebird).y, `shorebird, reachDepth ${reachDepth}`).toBeCloseTo(-reachDepth, 3)
    }
  })
  it('never points the bill steeper than reachAngle in a reach', () => {
    const m = buildDetailedBird(TEST_HERON_SPEC)
    for (const reachAngle of [0.6, 1.1, Math.PI / 2]) {
      m.pose(posed({ reach: 1, leanX: 0.5, reachAngle }))
      expect(-billAngleNow(m), `reachAngle ${reachAngle}`).toBeLessThan(reachAngle + 1e-6)
    }
  })
})

describe('headPitch', () => {
  for (const [name, spec] of [['a chained neck', TEST_HERON_SPEC], ['a neck of two joints', TEST_SPEC]] as const) {
    it(`turns only the head, raising the bill, on ${name}`, () => {
      const m = buildDetailedBird(spec)
      const bones = () => m.mesh.skeleton.bones.map(b => b.matrixWorld.clone())
      m.pose(posed({ neckExtend: 0.8 })); m.group.updateMatrixWorld(true)
      const level = bones(), tip = billTipNow(m)
      m.pose(posed({ neckExtend: 0.8, headPitch: 0.6 })); m.group.updateMatrixWorld(true)
      const up = bones()
      expect(billTipNow(m).y).toBeGreaterThan(tip.y + 0.01)
      // the head and what hangs from it turn; nothing else moves
      const fromHead = (b: THREE.Object3D | null): boolean => !!b && (b.name === 'head' || fromHead(b.parent))
      m.mesh.skeleton.bones.forEach((b, i) => {
        if (fromHead(b)) return
        expect(up[i]!.equals(level[i]!), b.name).toBe(true)
      })
    })
  }
})
