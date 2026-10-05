import * as THREE from 'three'
import { detailSchema } from './spec'
import { buildDetailedBird, type DetailedBirdModel } from './build'
import { loftWeights, RINGS, RADIAL } from './loft'
import { createProfile } from './profile'
import { chainBones, NECK_BONES } from './rig'
import { billTipNow, billAngleNow, crownNow, measure } from './measure'
import { posedFold, passThrough, posedCreases } from './neck.testkit'
import { TEST_HERON_DETAIL, TEST_HERON_SPEC, TEST_PERCHER_SPEC, TEST_SPEC } from './fixture'
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
const bone = (m: DetailedBirdModel, name: string) => m.mesh.skeleton.bones.find(b => b.name === name)!
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
  it('stretches only a chained neck, by 1 to 3', () => {
    expect(detailSchema.parse({ ...TEST_HERON_DETAIL, neckStretch: 1.3 }).neckStretch).toBe(1.3)
    expect(() => detailSchema.parse({ ...TEST_HERON_DETAIL, neckStretch: 0.9 })).toThrow()
    expect(() => detailSchema.parse({ ...TEST_HERON_DETAIL, neckStretch: 3.1 })).toThrow()
    expect(() => detailSchema.parse({ ...TEST_SPEC.detail!, neckStretch: 1.3 })).toThrow(/neckStretch needs rig.neck/)
    expect(detailSchema.parse({ ...TEST_HERON_DETAIL, reachStretch: 1.2 }).reachStretch).toBe(1.2)
    expect(() => detailSchema.parse({ ...TEST_HERON_DETAIL, reachStretch: 3.1 })).toThrow()
    expect(() => detailSchema.parse({ ...TEST_SPEC.detail!, reachStretch: 1.2 })).toThrow(/reachStretch needs rig.neck/)
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
  it('hands off from the body to the neck from rig.neckFrom when it names one, else over 0.08 of the spine', () => {
    const weightOf = (r: typeof rig, u: number, bone: string) => loftWeights(u, profile, r).reduce((s, [b, v]) => s + (b === bone ? v : 0), 0)
    const breast = profile.uOf('breast'), base = profile.uOf('neckBase')
    expect(weightOf(rig, base - 0.08, 'body')).toBeCloseTo(1, 12)
    expect(weightOf(rig, base - 0.04, 'body')).toBeCloseTo(0.5, 12)
    const late = { ...rig, neckFrom: 'breast' }
    expect(breast).toBeGreaterThan(base - 0.08)
    expect(weightOf(late, breast, 'body')).toBeCloseTo(1, 12)
    expect(weightOf(late, (breast + base) / 2, 'body')).toBeCloseTo(0.5, 12)
    expect(weightOf(late, (breast + base) / 2, 'neck')).toBeCloseTo(0.5, 12)
    expect(weightOf(late, base, 'neck')).toBeCloseTo(1, 12)
  })
  it('names a station before the neck base for rig.neckFrom', () => {
    const at = (neckFrom: string) => ({ ...TEST_HERON_DETAIL, rig: { ...TEST_HERON_DETAIL.rig, neckFrom } })
    expect(detailSchema.parse(at('breast')).rig.neckFrom).toBe('breast')
    expect(() => detailSchema.parse(at('neckBase'))).toThrow(/neckFrom/)
    expect(() => detailSchema.parse(at('nape'))).toThrow(/neckFrom/)
    expect(() => detailSchema.parse(at('chest'))).toThrow(/label: chest/)
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
  it('puts the neck\'s base joint below the spine by rig.neckBaseDepth of the section\'s depth, leaving the loft as built', () => {
    const detail = { ...TEST_HERON_DETAIL, rig: { ...TEST_HERON_DETAIL.rig, neckBaseDepth: 0.8 } }
    const m = buildDetailedBird({ ...TEST_HERON_SPEC, detail })
    const s = createProfile(detail.profile).sampleAt(createProfile(detail.profile).uOf('neckBase'))
    const spine = m.anatomy.stations.find(q => q.label === 'neckBase')!.position
    const want = spine.clone().sub(new THREE.Vector3(s.axis.x, s.axis.y, 0).multiplyScalar(0.8 * s.down))
    expect(boneAt(m, 'neck').distanceTo(want)).toBeLessThan(1e-9)
    // every other joint where it was
    for (const n of CHAIN.slice(1)) expect(boneAt(m, n).distanceTo(boneAt(buildDetailedBird(TEST_HERON_SPEC), n))).toBeLessThan(1e-9)
    m.pose(posed())
    m.group.updateMatrixWorld(true)
    const g = m.mesh.geometry.getAttribute('position') as THREE.BufferAttribute
    const v = new THREE.Vector3()
    for (let i = 0; i < RINGS * RADIAL; i++) expect(m.mesh.getVertexPosition(i, v).distanceTo(new THREE.Vector3().fromBufferAttribute(g, i))).toBeLessThan(1e-6)
    expect(() => detailSchema.parse({ ...detail, rig: { ...detail.rig, neckBaseDepth: 1.1 } })).toThrow()
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
  it('stretches by neckStretch going erect: every segment longer by the same share, all of it at 1, none at the trace or below', () => {
    const m = buildDetailedBird({ ...TEST_HERON_SPEC, detail: { ...TEST_HERON_DETAIL, neckStretch: 1.3 } })
    const lengths = () => CHAIN.slice(1).map((n, i) => boneAt(m, n).distanceTo(boneAt(m, CHAIN[i]!)))
    m.pose(posed())
    const rest = lengths()
    for (const [patch, k] of [
      [{ neckExtend: 0 }, 1], [{ neckExtend: 0.3 }, 1], [{ neckExtend: 0.75 }, 1.15], [{ neckExtend: 1 }, 1.3],
      [{ neckExtend: 1, reach: 1, leanX: 0.5 }, 1.3], [{ neckExtend: 2 }, 1.3],
      // a reach doesn't stretch it, unless the species gives a reach a stretch of its own
      [{ reach: 1, leanX: 0.5 }, 1], [{ neckExtend: 0.75, reach: 0.5, leanX: 0.25 }, 1.15],
    ] as const) {
      m.pose(posed(patch))
      lengths().forEach((l, i) => expect(l / rest[i]!, JSON.stringify(patch)).toBeCloseTo(k, 9))
    }
  })
  it('stretches by reachStretch as a reach goes in (smoothly), or by neckStretch, whichever is further', () => {
    const m = buildDetailedBird({ ...TEST_HERON_SPEC, detail: { ...TEST_HERON_DETAIL, neckStretch: 1.4, reachStretch: 1.2 } })
    const lengths = () => CHAIN.slice(1).map((n, i) => boneAt(m, n).distanceTo(boneAt(m, CHAIN[i]!)))
    m.pose(posed())
    const rest = lengths()
    for (const [patch, k] of [
      [{ reach: 1, leanX: 0.5 }, 1.2], [{ neckExtend: 0, reach: 1, leanX: 0.5 }, 1.2], [{ reach: 0.5, leanX: 0.25 }, 1.1],
      [{ neckExtend: 1, reach: 1, leanX: 0.5 }, 1.4], [{ neckExtend: 0.6, reach: 1, leanX: 0.5 }, 1.2],
    ] as const) {
      m.pose(posed(patch))
      lengths().forEach((l, i) => expect(l / rest[i]!, JSON.stringify(patch)).toBeCloseTo(k, 9))
    }
  })
  it('stretches along the spine wherever the base joint sits (rig.neckBaseDepth)', () => {
    const z = TEST_HERON_DETAIL.rig.neck!.map(() => 0)
    const flat = { ...TEST_HERON_DETAIL, neckShapes: { hunch: z, erect: z, strike: z }, neckStretch: 1.3 }
    const spine = (m: DetailedBirdModel, label: string) => m.anatomy.stations.find(s => s.label === label)!.position
    for (const neckBaseDepth of [0, 0.8]) {
      const m = buildDetailedBird({ ...TEST_HERON_SPEC, detail: { ...flat, rig: { ...flat.rig, neckBaseDepth } } })
      m.pose(posed({ neckExtend: 1 }))
      // unbent, each joint past the base lies on from the one before by 1.3 of their segment of the spine
      expect(boneAt(m, CHAIN[1]!).distanceTo(spine(m, 'neckLow').clone().addScaledVector(spine(m, 'neckLow').clone().sub(spine(m, 'neckBase')), 0.3)), `${neckBaseDepth}`).toBeLessThan(1e-9)
      CHAIN.slice(2).forEach((n, i) => {
        const seg = spine(m, TEST_HERON_DETAIL.rig.neck![i + 2]!).clone().sub(spine(m, TEST_HERON_DETAIL.rig.neck![i + 1]!))
        expect(boneAt(m, n).clone().sub(boneAt(m, CHAIN[i + 1]!)).distanceTo(seg.multiplyScalar(1.3)), `${neckBaseDepth} ${n}`).toBeLessThan(1e-9)
      })
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

describe('headYaw', () => {
  /** the neck's axis at the head as posed: from the joint the head hangs from to the head joint, group space */
  const neckAxis = (m: DetailedBirdModel) => boneAt(m, 'head').sub(boneAt(m, 'neck6')).normalize()
  for (const [name, spec] of [['a chained neck', TEST_HERON_SPEC], ['a neck of two joints', TEST_SPEC], ['a perched bird', TEST_PERCHER_SPEC]] as const) {
    it(`turns the head about the neck's axis, the bill to the bird's left, moving nothing below the neck, on ${name}`, () => {
      const m = buildDetailedBird(spec)
      const bones = () => m.mesh.skeleton.bones.map(b => b.matrixWorld.clone())
      m.pose(posed({ neckExtend: 0.7 })); m.group.updateMatrixWorld(true)
      const ahead = bones(), tip = billTipNow(m), head = boneAt(m, 'head'), axis = neckAxis(m)
      const facing = bone(m, 'head').getWorldQuaternion(new THREE.Quaternion())
      m.pose(posed({ neckExtend: 0.7, headYaw: 0.6 })); m.group.updateMatrixWorld(true)
      const turned = bones(), now = billTipNow(m)
      // the bird faces +x with its right side toward +z: its left is -z
      expect(now.z).toBeLessThan(tip.z - 0.01)
      // turned about the axis through the head joint: the tip keeps its place along the axis and its distance from it,
      // and has gone 0.6 rad round it
      const along = (p: THREE.Vector3) => p.clone().sub(head).dot(axis)
      const off = (p: THREE.Vector3) => p.clone().sub(head).addScaledVector(axis, -along(p))
      expect(along(now)).toBeCloseTo(along(tip), 9)
      expect(off(now).length()).toBeCloseTo(off(tip).length(), 9)
      expect(off(now).angleTo(off(tip))).toBeCloseTo(0.6, 6)
      // the head joint stays put, and the head is turned exactly that, whatever share of it the neck's joints took
      expect(boneAt(m, 'head').distanceTo(head)).toBeLessThan(1e-12)
      const turn = bone(m, 'head').getWorldQuaternion(new THREE.Quaternion()).multiply(facing.invert())
      expect(turn.angleTo(new THREE.Quaternion().setFromAxisAngle(axis, 0.6))).toBeLessThan(1e-9)
      // the neck twists with it; nothing below the neck moves
      const fromNeck = (b: THREE.Object3D | null): boolean => !!b && (b.name === 'neck' || fromNeck(b.parent))
      m.mesh.skeleton.bones.forEach((b, i) => {
        if (fromNeck(b)) return
        expect(turned[i]!.equals(ahead[i]!), b.name).toBe(true)
      })
    })
  }
  it('turns the head after headPitch: the pitched bill swings round the neck, keeping its pitch to the axis', () => {
    const m = buildDetailedBird(TEST_PERCHER_SPEC)
    m.pose(posed({ headPitch: -0.7 }))
    const head = boneAt(m, 'head'), axis = neckAxis(m)
    const tip = billTipNow(m).sub(head)
    m.pose(posed({ headPitch: -0.7, headYaw: -0.9 }))
    const now = billTipNow(m).sub(head)
    expect(now.z).toBeGreaterThan(tip.z + 0.01)
    expect(now.dot(axis)).toBeCloseTo(tip.dot(axis), 9)
  })
  // the research's head turn: "the head turned slowly 30-60° one way and back" (belted-kingfisher.md, section 6)
  const TURN = THREE.MathUtils.degToRad(60)
  for (const [name, spec] of [['a perched bird, a big head on a short neck', TEST_PERCHER_SPEC], ['a neck of two joints', TEST_SPEC]] as const) {
    it(`twists the neck's skin along it, with no crease where it meets the head, on ${name}`, { timeout: 60000 }, () => {
      const m = buildDetailedBird(spec)
      for (const pose of [{}, { neckExtend: 1, headPitch: 0.4 }, { neckExtend: 0.3 }]) {
        m.pose(posed(pose))
        const fold = posedFold(m), through = passThrough(m).depth, creases = posedCreases(m)
        for (const yaw of [0.6, -0.6, 1, -1, TURN, -TURN]) {
          m.pose(posed({ ...pose, headYaw: yaw }))
          // the skin no more folded or passed through than unturned, and nowhere bent more than 25° sharper; turned
          // all at the head joint, the perched bird's skin creased 46° sharper where the neck meets the head
          expect(posedFold(m), `${JSON.stringify(pose)} ${yaw}`).toBeLessThanOrEqual(fold + 1e-4)
          if (Math.abs(yaw) === TURN) expect(passThrough(m).depth, `${JSON.stringify(pose)} ${yaw}`).toBeLessThanOrEqual(through + 1e-4)
          posedCreases(m).forEach((c, i) => expect(c - creases[i]!, `${JSON.stringify(pose)} ${yaw} ring ${i}`).toBeLessThan(25))
        }
      }
    })
  }
  it('leaves nothing behind: posed back to headYaw 0, every bone is where it was, on every neck', () => {
    for (const spec of [TEST_HERON_SPEC, TEST_SPEC, TEST_PERCHER_SPEC]) {
      const fresh = buildDetailedBird(spec), m = buildDetailedBird(spec)
      for (const patch of [{ neckExtend: 0.3, reach: 0.6, headPitch: 0.2 }, {}]) {
        m.pose(posed({ ...patch, headYaw: 1.1 }))
        m.pose(posed(patch)); fresh.pose(posed(patch))
        m.group.updateMatrixWorld(true); fresh.group.updateMatrixWorld(true)
        m.mesh.skeleton.bones.forEach((b, i) => expect(b.matrixWorld.equals(fresh.mesh.skeleton.bones[i]!.matrixWorld), `${spec.code} ${b.name}`).toBe(true))
      }
    }
  })
})

describe('crownNow', () => {
  it('is the top of the head as posed: the crown at rest where the bird stands, lower hunched, higher erect', () => {
    const m = buildDetailedBird(TEST_HERON_SPEC)
    m.pose(posed())
    const rest = crownNow(m)
    expect(rest).toBeCloseTo(measure(m).crownAbove, 6)
    m.pose(posed({ neckExtend: 0 }))
    expect(crownNow(m)).toBeLessThan(rest - 0.03)
    m.pose(posed({ neckExtend: 1 }))
    expect(crownNow(m)).toBeGreaterThan(rest + 0.03)
  })
})
