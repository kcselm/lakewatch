import * as THREE from 'three'
import { buildDetailedBird, type DetailedBirdModel } from './build'
import { detailSchema } from './spec'
import { billTipNow } from './measure'
import { RINGS, RADIAL } from './loft'
import { STANCE } from './gait'
import { TEST_GOOSE_DETAIL, TEST_GOOSE_SPEC, TEST_SPEC, TEST_SWIM_SPEC } from './fixture'
import { parseSpeciesSpec } from '../spec'
import { defaultPose, type PoseState } from '../model'

type Patch = Partial<Omit<PoseState, 'lean'>> & { leanX?: number; leanZ?: number }
function posed(patch: Patch = {}): PoseState {
  const { leanX = 0, leanZ = 0, ...rest } = patch
  const p: PoseState = { ...defaultPose(), ...rest }
  p.lean.set(leanX, 0, leanZ)
  return p
}

const LEGS = ['legs', 'tibiaL', 'tarsusL', 'toesL', 'tibiaR', 'tarsusR', 'toesR']
const bone = (m: DetailedBirdModel, name: string) => m.mesh.skeleton.bones.find(b => b.name === name)!
const boneAt = (m: DetailedBirdModel, name: string) => { m.group.updateMatrixWorld(true); return bone(m, name).getWorldPosition(new THREE.Vector3()) }
/** the loft's skin as the last pose() left it: the geometry's first RINGS x RADIAL vertices */
const loft = (m: DetailedBirdModel) => {
  m.group.updateMatrixWorld(true)
  return Array.from({ length: RINGS * RADIAL }, (_, i) => m.mesh.getVertexPosition(i, new THREE.Vector3()))
}
const maxApart = (a: THREE.Vector3[], b: THREE.Vector3[]) => Math.max(...a.map((v, i) => v.distanceTo(b[i]!)))

/** The test goose as a plain swimmer, and as a standing bird: the two builds an amphibious bird blends between. */
const FLOATING = parseSpeciesSpec({ ...TEST_GOOSE_SPEC, detail: { ...TEST_GOOSE_DETAIL, amphibious: false } })
const STANDING = parseSpeciesSpec({ ...TEST_GOOSE_SPEC, posture: 'standing', detail: { ...TEST_GOOSE_DETAIL, amphibious: false } })

describe('an amphibious bird in the schema', () => {
  it('accepts the test goose, and needs a waterline to float on', () => {
    expect(detailSchema.parse(TEST_GOOSE_DETAIL).amphibious).toBe(true)
    expect(() => detailSchema.parse({ ...TEST_GOOSE_DETAIL, float: undefined })).toThrow(/amphibious bird needs float/)
  })
  it('is built floating, so its posture is swimming', () => {
    expect(() => parseSpeciesSpec({ ...TEST_GOOSE_SPEC, posture: 'standing' })).toThrow(/amphibious bird is built floating/)
  })
  it('waddles no more than 20 degrees, and not at all unless it says so', () => {
    expect(() => detailSchema.parse({ ...TEST_GOOSE_DETAIL, waddle: 25 })).toThrow()
    expect(() => detailSchema.parse({ ...TEST_GOOSE_DETAIL, waddle: -1 })).toThrow()
    expect(detailSchema.parse(TEST_SPEC.detail!).waddle).toBeUndefined()
  })
})

describe('an amphibious bird afloat', () => {
  const FLOAT_POSES: Record<string, Patch> = {
    rest: {},
    loafing: { neckExtend: 0 },
    alert: { neckExtend: 1 },
    'head-dip': { reach: 1, neckExtend: 1, reachDepth: 0.2, leanX: 0.1 },
    'tip-up, paddling': { leanX: 1.36, tailTilt: 0.4, paddle: 1, paddlePhase: 0.3 },
    // a walk asked of a floating bird changes nothing: gait is ignored afloat
    'walking, ignored': { gait: 1, strideDistance: 0.1 },
  }
  it('is the floating build of the same bird: its body, its bill, and its legs\' joints where that bird has them', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC), f = buildDetailedBird(FLOATING)
    for (const [name, patch] of Object.entries(FLOAT_POSES)) {
      m.pose(posed(patch)); f.pose(posed(patch))
      expect(maxApart(loft(m), loft(f)), name).toBeLessThan(1e-9)
      expect(billTipNow(m).distanceTo(billTipNow(f)), name).toBeLessThan(1e-9)
      for (const b of LEGS) expect(boneAt(m, b).distanceTo(boneAt(f, b)), `${name}: ${b}`).toBeLessThan(1e-9)
      expect(bone(m, 'legs').scale.x, name).toBe(bone(f, 'legs').scale.x)
    }
  })
  it('hides its legs under the water while it floats with its feet still, and grows them back as it comes ashore', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    m.pose(posed())
    expect(bone(m, 'legs').scale.x).toBeLessThan(0.01)
    m.group.updateMatrixWorld(true)
    const index = m.mesh.geometry.getAttribute('skinIndex') as THREE.BufferAttribute
    const legBones = new Set(LEGS.map(n => m.mesh.skeleton.bones.indexOf(bone(m, n))))
    let legVerts = 0
    for (let i = 0; i < index.count; i++) {
      if (!legBones.has(index.getX(i))) continue
      legVerts++
      expect(m.mesh.getVertexPosition(i, new THREE.Vector3()).y).toBeLessThan(0)
    }
    expect(legVerts).toBeGreaterThan(100)
    for (const patch of [{ paddle: 0.5 }, { afloat: 0.75 }, { afloat: 0 }]) {
      m.pose(posed(patch))
      expect(bone(m, 'legs').scale.x, JSON.stringify(patch)).toBe(1)
    }
    // and in between they grow, still folded under the water, so nothing jumps as they appear
    m.pose(posed({ afloat: 0.9 }))
    expect(bone(m, 'legs').scale.x).toBeCloseTo(0.4, 9)
  })
})

describe('an amphibious bird on its feet', () => {
  const STAND_POSES: Record<string, Patch> = {
    rest: {},
    alert: { neckExtend: 1 },
    'walking, a stride in': { gait: 1, strideDistance: 0.07 },
    'easing into a walk': { gait: 0.4, strideDistance: 0.13 },
    grazing: { reach: 1, reachAngle: 1.2, leanX: 0.3 },
  }
  it('stands where the standing build of the same bird stands: the body, the bill, and the legs, walking and grazing', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC), s = buildDetailedBird(STANDING)
    for (const [name, patch] of Object.entries(STAND_POSES)) {
      m.pose(posed({ ...patch, afloat: 0 })); s.pose(posed(patch))
      // the skin is stored in float32, a different number for each build's frame: to a micrometre
      expect(maxApart(loft(m), loft(s)), name).toBeLessThan(1e-6)
      expect(billTipNow(m).distanceTo(billTipNow(s)), name).toBeLessThan(1e-6)
      for (const b of LEGS.slice(1)) expect(boneAt(m, b).distanceTo(boneAt(s, b)), `${name}: ${b}`).toBeLessThan(1e-6)
    }
  })
  it('plants its stance foot as it walks: the foot stays put in the world while the bird walks over it', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    const stride = 2 * TEST_GOOSE_DETAIL.stepLength! * (m.layout.tibia + m.layout.tarsus)
    m.pose(posed({ afloat: 0 }))
    const xs: number[] = []
    // the walk starts from the neutral phase: the right foot's whole stance is 0.2 to 0.8 of a stride
    for (const f of [0.22, 0.3, 0.4, 0.5, 0.58, 0.68, 0.78]) {
      m.group.position.x = f * stride
      m.pose(posed({ afloat: 0, gait: 1, strideDistance: f * stride }))
      xs.push(boneAt(m, 'toesR').x)
    }
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(1e-4)
  })
  it('has its feet on the origin\'s ground plane, the hips over the origin', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    m.pose(posed({ afloat: 0 }))
    for (const toes of ['toesL', 'toesR']) expect(boneAt(m, toes).y).toBeCloseTo(m.layout.footY, 6)
    expect(boneAt(m, 'tibiaR').x).toBeCloseTo(0, 9)
    // and the bill reaches the ground in a graze
    m.pose(posed({ afloat: 0, reach: 1, reachAngle: 1.2, leanX: 0.3 }))
    expect(billTipNow(m).y).toBeCloseTo(0, 3)
  })
})

describe('between afloat and on its feet', () => {
  /** every bone's place, and the bill tip's, at each of `steps` + 1 even steps of afloat from 1 to 0 */
  function sweep(steps: number, patch: Patch = {}): THREE.Vector3[][] {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    return Array.from({ length: steps + 1 }, (_, k) => {
      m.pose(posed({ ...patch, afloat: 1 - k / steps }))
      m.group.updateMatrixWorld(true)
      return [...m.mesh.skeleton.bones.map(b => b.getWorldPosition(new THREE.Vector3())), billTipNow(m)]
    })
  }
  /** the furthest any one point moves in a step */
  const worstStep = (frames: THREE.Vector3[][]) => Math.max(...frames.slice(1).map((f, k) => maxApart(f, frames[k]!)))

  for (const [name, patch] of Object.entries({ standing: {}, walking: { gait: 1, strideDistance: 0.05 }, alert: { neckExtend: 1 } } as Record<string, Patch>)) {
    it(`moves every bone smoothly, ${name}: no step of afloat moves anything more than its share of the way`, () => {
      const coarse = worstStep(sweep(100, patch)), fine = worstStep(sweep(200, patch))
      // the body rises about 0.15 m over the whole way, and the legs, 0.12 m long, grow out over its first quarter: a
      // hundredth of the way moves nothing more than a centimetre
      expect(coarse).toBeLessThan(0.01)
      // and half the step moves it half as far: a jump would move as far however fine the steps
      expect(fine).toBeLessThan(0.6 * coarse)
    })
  }
  it('raises the body from its float to its standing height in proportion to afloat', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    const hip = (afloat: number) => { m.pose(posed({ afloat })); return boneAt(m, 'body').y }
    const [afloat, half, ashore] = [hip(1), hip(0.5), hip(0)]
    expect(ashore - afloat).toBeGreaterThan(0.1)
    expect(half).toBeCloseTo((afloat + ashore) / 2, 9)
  })
  it('holds afloat to 0..1', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    const bones = () => m.mesh.skeleton.bones.map(b => [...b.position.toArray(), ...b.quaternion.toArray(), ...b.scale.toArray()])
    for (const [wild, tame] of [[3, 1], [-2, 0]]) {
      m.pose(posed({ afloat: wild, gait: 1, strideDistance: 0.03 })); const got = bones()
      m.pose(posed({ afloat: tame, gait: 1, strideDistance: 0.03 })); const want = bones()
      got.forEach((row, i) => row.forEach((v, k) => expect(v).toBeCloseTo(want[i]![k]!, 12)))
    }
  })
})

describe('the waddle', () => {
  const W = THREE.MathUtils.degToRad(TEST_GOOSE_DETAIL.waddle!)
  /** the body's roll and which foot is planted, every 1% of two strides of a full walk, from a quarter of one in */
  function walk(afloat: number) {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    const stride = 2 * TEST_GOOSE_DETAIL.stepLength! * (m.layout.tibia + m.layout.tarsus)
    m.pose(posed({ afloat }))                                 // standing still first: the walk starts from its neutral phase
    return Array.from({ length: 201 }, (_, k) => {
      m.pose(posed({ afloat, gait: 1, strideDistance: (0.25 + k / 100) * stride }))
      const [l, r] = [boneAt(m, 'toesL').y, boneAt(m, 'toesR').y]
      return { roll: bone(m, 'body').rotation.x, planted: Math.abs(l - r) < 1e-9 ? 0 : l < r ? -1 : 1 }
    })
  }
  it('rolls the body toward the planted foot at a full walk, peaking at the waddle once a step', () => {
    const frames = walk(0)
    expect(Math.max(...frames.map(f => f.roll))).toBeCloseTo(W, 3)
    expect(Math.min(...frames.map(f => f.roll))).toBeCloseTo(-W, 3)
    // positive rolls toward +z, the right foot: whenever it rolls more than half way, it rolls toward the foot on the ground
    for (const f of frames) if (Math.abs(f.roll) > W / 2) expect(Math.sign(f.roll)).toBe(f.planted)
    // two peaks a stride, so four over two strides
    let peaks = 0
    for (let k = 1; k < frames.length - 1; k++) {
      const [a, b, c] = [frames[k - 1]!.roll, frames[k]!.roll, frames[k + 1]!.roll].map(Math.abs)
      if (b! > W * 0.99 && b! >= a! && b! > c!) peaks++
    }
    expect(peaks).toBe(4)
  })
  it('rolls with the stride the legs keep: the left foot mid-stance at STANCE / 2 of it', () => {
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    const stride = 2 * TEST_GOOSE_DETAIL.stepLength! * (m.layout.tibia + m.layout.tarsus)
    m.pose(posed({ afloat: 0 }))
    // standing still re-anchors the stride at its neutral phase, STANCE / 2: the left foot mid-stance, rolled toward
    m.pose(posed({ afloat: 0, gait: 1, strideDistance: 0 }))
    expect(bone(m, 'body').rotation.x).toBeCloseTo(-W, 9)
    m.pose(posed({ afloat: 0, gait: 1, strideDistance: stride / 2 }))
    expect(bone(m, 'body').rotation.x).toBeCloseTo(W, 9)
    expect(STANCE / 2).toBeCloseTo(0.3, 9)
  })
  it('does not roll standing still or afloat, and rolls in proportion between', () => {
    expect(Math.max(...walk(1).map(f => Math.abs(f.roll)))).toBe(0)
    expect(Math.max(...walk(0.5).map(f => f.roll))).toBeCloseTo(W / 2, 3)
    const m = buildDetailedBird(TEST_GOOSE_SPEC)
    m.pose(posed({ afloat: 0, gait: 0, strideDistance: 0.1, leanZ: 0.05 }))
    expect(bone(m, 'body').rotation.x).toBe(0.05)
  })
  it('rolls a standing bird too, when its species says so', () => {
    const waddler = buildDetailedBird(parseSpeciesSpec({ ...TEST_SPEC, detail: { ...TEST_SPEC.detail!, waddle: 4 } }))
    waddler.pose(posed({ gait: 1, strideDistance: 0 }))
    expect(bone(waddler, 'body').rotation.x).toBeCloseTo(-THREE.MathUtils.degToRad(4), 9)
  })
})

describe('every other bird ignores afloat', () => {
  for (const [name, spec] of [['a standing bird', TEST_SPEC], ['a swimmer', TEST_SWIM_SPEC]] as const) {
    it(`${name} poses exactly as it did, whatever afloat says`, () => {
      const m = buildDetailedBird(spec)
      const bones = () => { m.group.updateMatrixWorld(true); return m.mesh.skeleton.bones.map(b => b.matrixWorld.clone()) }
      for (const patch of [{}, { gait: 1, strideDistance: 0.04 }, { reach: 1, leanX: 0.5 }, { paddle: 1, paddlePhase: 0.2 }] as Patch[]) {
        m.pose(posed(patch)); const as = bones()
        m.pose(posed({ ...patch, afloat: 0 })); const zero = bones()
        as.forEach((mat, i) => expect(mat.equals(zero[i]!), JSON.stringify(patch)).toBe(true))
      }
    })
  }
})
