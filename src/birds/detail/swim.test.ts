import * as THREE from 'three'
import { buildDetailedBird, type DetailedBirdModel } from './build'
import { measure, billTipNow, billAngleNow, tailTipNow } from './measure'
import { createProfile } from './profile'
import { worstFold } from './loft'
import { TEST_SPEC, TEST_SWIM_SPEC, TEST_SWIM_DETAIL } from './fixture'
import { parseSpeciesSpec } from '../spec'
import { defaultPose, type PoseState } from '../model'

const WATERLINE = TEST_SWIM_DETAIL.float!.waterline
const LEGS = ['legs', 'tibiaL', 'tarsusL', 'toesL', 'tibiaR', 'tarsusR', 'toesR']

const bone = (m: DetailedBirdModel, name: string) => m.mesh.skeleton.bones.find(b => b.name === name)!
const boneAt = (m: DetailedBirdModel, name: string) => { m.group.updateMatrixWorld(true); return bone(m, name).getWorldPosition(new THREE.Vector3()) }
const posed = (patch: Partial<Omit<PoseState, 'lean'>>, leanX = 0): PoseState => {
  const p = { ...defaultPose(), ...patch }
  p.lean.x = leanX
  return p
}

/** Every vertex whose heaviest bone is one of `names`, where the model's last pose() put it, group space. */
function skinned(m: DetailedBirdModel, names: string[]): THREE.Vector3[] {
  m.group.updateMatrixWorld(true)
  const want = new Set(names.map(n => m.mesh.skeleton.bones.indexOf(bone(m, n))))
  const index = m.mesh.geometry.getAttribute('skinIndex') as THREE.BufferAttribute
  const weight = m.mesh.geometry.getAttribute('skinWeight') as THREE.BufferAttribute
  const out: THREE.Vector3[] = []
  for (let i = 0; i < index.count; i++) {
    let best = 0, bw = -1
    for (let k = 0; k < 4; k++) { const w = weight.getComponent(i, k); if (w > bw) { bw = w; best = index.getComponent(i, k) } }
    if (want.has(best)) out.push(m.mesh.getVertexPosition(i, new THREE.Vector3()))
  }
  return out
}

describe('the swimming test duck', () => {
  it('lofts without a crease', () => {
    expect(worstFold(createProfile(TEST_SWIM_DETAIL.profile), TEST_SWIM_DETAIL.rig)).toBe(0)
  })
})

describe('buildDetailedBird, swimming', () => {
  it('floats with the traced waterline on y = 0', () => {
    const m = buildDetailedBird(TEST_SWIM_SPEC)
    const profile = createProfile(TEST_SWIM_DETAIL.profile)
    m.anatomy.spine.forEach((p, k) => expect(p.y - profile.sampleAt(k / 100).point.y).toBeCloseTo(-WATERLINE, 9))
  })
  it('pivots on the water under the middle of the body: midway between where the water meets the stern and the breast', () => {
    const m = buildDetailedBird(TEST_SWIM_SPEC)
    const { back, front } = m.anatomy.waterline
    expect(front - back).toBeGreaterThan(0.2)
    expect(back + front).toBeCloseTo(0, 9)
    expect(boneAt(m, 'body').length()).toBeLessThan(1e-12)
    // where the water meets the body is where the traced belly line crosses the waterline (the loft's midline section
    // is that line), within the loft's sampling
    const profile = createProfile(TEST_SWIM_DETAIL.profile)
    const belly = Array.from({ length: 1001 }, (_, k) => {
      const s = profile.sampleAt(k / 1000)
      return s.point.clone().addScaledVector(s.normal, -s.down)
    })
    const crossings: number[] = []
    for (let k = 1; k < belly.length; k++) {
      const a = belly[k - 1]!, b = belly[k]!
      if ((a.y < WATERLINE) !== (b.y < WATERLINE)) crossings.push(a.x + ((b.x - a.x) * (WATERLINE - a.y)) / (b.y - a.y))
    }
    expect(crossings).toHaveLength(2)
    const middle = (crossings[0]! + crossings[1]!) / 2
    expect(Math.abs(back - (crossings[0]! - middle))).toBeLessThan(0.002)
    expect(Math.abs(front - (crossings[1]! - middle))).toBeLessThan(0.002)
  })
  it('tips up about the pivot: it stays put as lean.x goes to 1.5, and the stern rises out of the water', () => {
    const m = buildDetailedBird(TEST_SWIM_SPEC)
    const rest = skinned(m, ['body'])
    const tailRest = tailTipNow(m).y
    m.pose(posed({ tailTilt: 0.3 }, 1.5))
    const tipped = skinned(m, ['body'])
    expect(rest.length).toBeGreaterThan(500)
    rest.forEach((p, i) => expect(tipped[i]!.length()).toBeCloseTo(p.length(), 9))      // turned rigidly about the origin
    expect(boneAt(m, 'body').length()).toBeLessThan(1e-12)
    // the stern, where the water met the body at the back, swings up nearly its whole distance from the pivot
    const stern = new THREE.Vector3(m.anatomy.waterline.back, 0, 0).applyMatrix4(bone(m, 'body').matrixWorld)
    expect(stern.y).toBeGreaterThan(-0.99 * m.anatomy.waterline.back)
    expect(tailTipNow(m).y).toBeGreaterThan(tailRest + 0.1)
    expect(billTipNow(m).y).toBeLessThan(-0.1)                                           // the head is under
  })
  it('hides the legs by bone scale at paddle 0, inside the body and under the water', () => {
    const m = buildDetailedBird(TEST_SWIM_SPEC)
    for (const lean of [0, 0.3]) {
      m.pose(posed({}, lean))
      expect(bone(m, 'legs').scale.x).toBeLessThan(0.01)
      const legs = skinned(m, LEGS)
      expect(legs.length).toBeGreaterThan(100)
      for (const v of legs) expect(v.y).toBeLessThan(0)
    }
  })
  it('shows them at paddle 1, folded back under the body', () => {
    const m = buildDetailedBird(TEST_SWIM_SPEC)
    m.pose(posed({ paddle: 1 }))
    expect(bone(m, 'legs').scale.x).toBe(1)
    expect(boneAt(m, 'tarsusR').distanceTo(boneAt(m, 'toesR'))).toBeCloseTo(TEST_SWIM_DETAIL.measurements.tarsus, 6)
    expect(boneAt(m, 'toesR').x).toBeLessThan(boneAt(m, 'tibiaR').x - 0.02)
    expect(boneAt(m, 'toesR').y).toBeLessThan(m.anatomy.bodyLowY)
  })
  it('paddles alternately with paddlePhase, and in a tip-up the feet paddle above the water', () => {
    const m = buildDetailedBird(TEST_SWIM_SPEC)
    const feet = (phase: number, lean = 0) => {
      m.pose(posed({ paddle: 1, paddlePhase: phase }, lean))
      return [boneAt(m, 'toesR'), boneAt(m, 'toesL')] as const
    }
    const [r0, l0] = feet(0)
    for (const phase of [0.25, 0.75]) {
      const [r, l] = feet(phase)
      const dr = r.x - r0.x, dl = l.x - l0.x
      expect(Math.abs(dr), `phase ${phase}`).toBeGreaterThan(0.01)
      expect(dr * dl, `phase ${phase}`).toBeLessThan(0)
    }
    // the left foot at one phase is where the right one was half a stroke earlier, mirrored
    const right = feet(0.25)[0], left = feet(0.75)[1]
    expect(left.x).toBeCloseTo(right.x, 9); expect(left.y).toBeCloseTo(right.y, 9); expect(left.z).toBeCloseTo(-right.z, 9)
    for (const phase of [0, 0.25, 0.5, 0.75]) for (const f of feet(phase, 1.5)) expect(f.y, `phase ${phase}`).toBeGreaterThan(0)
  })
  it('keeps out-of-range swimming values to their ranges', () => {
    const m = buildDetailedBird(TEST_SWIM_SPEC)
    const bones = () => m.mesh.skeleton.bones.map(b => [...b.position.toArray(), ...b.quaternion.toArray(), ...b.scale.toArray()])
    m.pose(posed({ paddle: 3, paddlePhase: 0.2, reach: 1, reachDepth: 0, reachAngle: 4 }))
    const wild = bones()
    m.pose(posed({ paddle: 1, paddlePhase: 0.2, reach: 1, reachDepth: 0, reachAngle: Math.PI / 2 }))
    const tame = bones()
    wild.forEach((row, i) => row.forEach((v, k) => expect(v).toBeCloseTo(tame[i]![k]!, 12)))
  })
})

describe('headBob', () => {
  // A coot's bill travels about 5 cm fore and aft in its head pump and 2-3 cm up and down, rising as it goes forward;
  // on the test duck, scaled from the coot's 0.31 m to its own length.
  const m = buildDetailedBird(TEST_SWIM_SPEC)
  const L = m.profile.length, scale = L / 0.31
  const tipAt = (headBob: number) => { m.pose(posed({ headBob })); m.group.updateMatrixWorld(true); return billTipNow(m).clone() }

  it('carries the bill forward and up by half as much: 2-3 cm for 5 cm on a coot-sized bird', () => {
    const rest = tipAt(0)
    for (const sign of [1, -1]) {
      const moved = tipAt((sign * 0.05) / 0.31).sub(rest)
      expect(moved.x * sign).toBeCloseTo(0.05 * scale, 3)
      expect(moved.y * sign).toBeGreaterThanOrEqual(0.02 * scale)
      expect(moved.y * sign).toBeLessThanOrEqual(0.03 * scale)
      expect(Math.abs(moved.z)).toBeLessThan(1e-9)
    }
  })
  it('changes nothing at 0: after a pump, headBob 0 puts every bone back where the rest pose has it', () => {
    const fresh = buildDetailedBird(TEST_SWIM_SPEC)
    fresh.pose(defaultPose()); fresh.group.updateMatrixWorld(true)
    m.pose(posed({ headBob: 0.085 })); m.pose(posed({ headBob: 0 })); m.group.updateMatrixWorld(true)
    for (const b of fresh.mesh.skeleton.bones) {
      const e = bone(m, b.name).matrixWorld.elements
      b.matrixWorld.elements.forEach((v, i) => expect(e[i]).toBeCloseTo(v, 12))
    }
  })
})

describe('reachDepth and reachAngle', () => {
  it('aim a reach reachDepth below the ground or the water: the bill tip goes down by its value', () => {
    const m = buildDetailedBird(TEST_SPEC)
    for (const d of [0.01, 0.02]) {
      m.pose(posed({ reach: 1, reachDepth: d }, 0.8))
      expect(billTipNow(m).y, `standing, ${d}`).toBeCloseTo(-d, 4)
    }
    // a head-dip, the body tipped forward a little: the neck swings the head down under the water until the bill
    // tip is that deep
    const duck = buildDetailedBird(TEST_SWIM_SPEC)
    for (const d of [0, 0.05, 0.1]) {
      duck.pose(posed({ reach: 1, neckExtend: 1, reachDepth: d }, 0.2))
      expect(billTipNow(duck).y, `swimming, ${d}`).toBeCloseTo(-d, 4)
    }
  })
  it('adds reachDepth to the species probeDepth', () => {
    const deep = buildDetailedBird(parseSpeciesSpec({ ...TEST_SPEC, detail: { ...TEST_SPEC.detail!, probeDepth: 0.01 } }))
    deep.pose(posed({ reach: 1, reachDepth: 0.01 }, 0.8))
    expect(billTipNow(deep).y).toBeCloseTo(-0.02, 4)
  })
  it('hold the bill no steeper than reachAngle below level, the neck swinging further to make up the depth', () => {
    const duck = buildDetailedBird(TEST_SWIM_SPEC)
    // a shoveler's skim: the bill about 25 degrees down and just under the water
    for (const reach of [0.3, 0.6, 0.8, 1]) {
      duck.pose(posed({ reach, neckExtend: 1, reachDepth: 0.005, reachAngle: 0.45 }))
      expect(billAngleNow(duck), `reach ${reach}`).toBeGreaterThanOrEqual(-0.45 - 1e-9)
    }
    expect(billTipNow(duck).y).toBeCloseTo(-0.005, 4)
    expect(billAngleNow(duck)).toBeCloseTo(-0.45, 6)
    // without the cap the same reach points the bill much more steeply
    duck.pose(posed({ reach: 1, neckExtend: 1, reachDepth: 0.005 }))
    expect(billAngleNow(duck)).toBeLessThan(-0.9)
  })
})

describe('measure, floating', () => {
  const m = buildDetailedBird(TEST_SWIM_SPEC)
  const r = measure(m)
  const stations = TEST_SWIM_DETAIL.profile
  const upTo = (label: string) => stations.slice(0, stations.findIndex(s => s.label === label) + 1)
  it('takes the back, crown, and draft from the traced outline, within the loft between stations', () => {
    expect(Math.abs(r.backAbove - (Math.max(...upTo('neckBase').map(s => s.y + s.up)) - WATERLINE))).toBeLessThan(0.002)
    expect(Math.abs(r.crownAbove - (Math.max(...stations.slice(9).map(s => s.y + s.up)) - WATERLINE))).toBeLessThan(0.002)
    expect(Math.abs(r.draft - (Math.max(...stations.map(s => s.down - s.y)) + WATERLINE))).toBeLessThan(0.002)
  })
  it('reads the tail tip, the wingtip, and the breast front off the built bird', () => {
    expect(r.tailTipAbove).toBe(m.anatomy.tailTip.y)
    expect(r.wingTipAbove).toBe(m.anatomy.wingTip.y)
    expect(r.breastFrontAbove).toBe(m.anatomy.breastFront.y)
    // the breast front is ahead of the neck base, low on the breast and above the water
    expect(m.anatomy.breastFront.x).toBeGreaterThan(m.anatomy.stations.find(s => s.label === 'neckBase')!.position.x)
    expect(r.breastFrontAbove).toBeGreaterThan(0)
    expect(r.breastFrontAbove).toBeLessThan(r.backAbove / 2)
  })
  it('measures the waterline length where the water meets the body, and none for a bird standing on the ground', () => {
    expect(r.waterlineLength).toBeCloseTo(m.anatomy.waterline.front - m.anatomy.waterline.back, 12)
    expect(r.waterlineLength).toBeGreaterThan(0.2)
    expect(measure(buildDetailedBird(TEST_SPEC)).waterlineLength).toBe(0)
  })
})
