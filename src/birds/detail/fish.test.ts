import * as THREE from 'three'
import { buildDetailedBird, type DetailedBirdModel } from './build'
import { billTipNow } from './measure'
import { FISH_DEPTH, FISH_GRIP, FISH_HOLD } from './fish'
import { TEST_PERCHER_SPEC, TEST_PERCHER_DETAIL, TEST_SPEC, TEST_HERON_SPEC, TEST_HERON_DETAIL } from './fixture'
import { parseSpeciesSpec } from '../spec'
import { defaultPose, type PoseState } from '../model'

const L = TEST_PERCHER_DETAIL.fish!.length
const M = TEST_PERCHER_DETAIL.measurements

const posed = (patch: Partial<Omit<PoseState, 'lean'>>, leanX = 0): PoseState => {
  const p = { ...defaultPose(), ...patch }
  p.lean.x = leanX
  return p
}
const bone = (m: DetailedBirdModel, name: string) => m.mesh.skeleton.bones.find(b => b.name === name)!

/** the fish as posed, group space: its head-to-tail line (unit, toward the head), its back (unit), and where the bill grips it */
function fishNow(m: DetailedBirdModel) {
  m.group.updateMatrixWorld(true)
  const fish = m.fish!
  const toGroup = m.group.matrixWorld.clone().invert().multiply(fish.matrixWorld)
  const head = new THREE.Vector3(1, 0, 0).transformDirection(toGroup)
  const back = new THREE.Vector3(0, 1, 0).transformDirection(toGroup)
  const grip = new THREE.Vector3(FISH_GRIP, 0, 0).applyMatrix4(toGroup)
  return { head, back, grip }
}
/** the bill as posed, group space: its tip, its direction at the base (unit), and its top (unit) */
function billNow(m: DetailedBirdModel) {
  m.group.updateMatrixWorld(true)
  const toGroup = m.group.matrixWorld.clone().invert().multiply(bone(m, 'bill').matrixWorld)
  return {
    tip: billTipNow(m),
    dir: m.anatomy.billDir.clone().transformDirection(toGroup),
    up: m.anatomy.billUp.clone().transformDirection(toGroup),
  }
}

describe('the fish: a prop held in the bill', () => {
  it("is held only by a bird that has one, and only while PoseState.fish is 1: hidden at 0", () => {
    const m = buildDetailedBird(TEST_PERCHER_SPEC)
    expect(m.fish).not.toBeNull()
    expect(m.fish!.visible).toBe(false)
    m.pose(posed({ fish: 1 }))
    expect(m.fish!.visible).toBe(true)
    m.pose(posed({}))
    expect(m.fish!.visible).toBe(false)
    expect(buildDetailedBird(TEST_SPEC).fish).toBeNull()
  })
  it("is the research's prop: 80 mm long and about 15 mm deep (belted-kingfisher.md, sections 7.1 and 9)", () => {
    const m = buildDetailedBird(TEST_PERCHER_SPEC)
    m.fish!.geometry.computeBoundingBox()
    const size = m.fish!.geometry.boundingBox!.getSize(new THREE.Vector3()).multiplyScalar(m.fish!.scale.x)
    expect(size.x).toBeCloseTo(L, 6)
    expect(size.y).toBeGreaterThan(0.013)
    expect(size.y).toBeLessThan(0.019)
    expect(FISH_DEPTH * L).toBeCloseTo(0.015, 6)
    // a fish is narrower than it is deep
    expect(size.z).toBeLessThan(0.7 * size.y)
  })
  it('shows its body from outside: every normal on the body points away from its axis', () => {
    const g = buildDetailedBird(TEST_PERCHER_SPEC).fish!.geometry
    const pos = g.getAttribute('position') as THREE.BufferAttribute, normal = g.getAttribute('normal') as THREE.BufferAttribute
    let body = 0
    for (let i = 0; i < pos.count; i++) {
      const out = new THREE.Vector3(0, pos.getY(i), pos.getZ(i))
      // the body's rings: off the axis, ahead of the tail fin (whose plates face sideways, and whose edges are open)
      if (out.length() < 0.01 || pos.getX(i) < -0.37) continue
      body++
      expect(new THREE.Vector3().fromBufferAttribute(normal, i).dot(out)).toBeGreaterThan(0)
    }
    expect(body).toBeGreaterThan(40)
  })
  it('is built once: every bird of every species that holds one shares its geometry and material', () => {
    const big = { ...TEST_HERON_DETAIL, fish: { length: 0.15 } }
    const heron = buildDetailedBird(parseSpeciesSpec({ ...TEST_HERON_SPEC, detail: big }))
    const a = buildDetailedBird(TEST_PERCHER_SPEC), b = buildDetailedBird(TEST_PERCHER_SPEC, undefined, a)
    for (const m of [b, heron]) {
      expect(m.fish!.geometry).toBe(a.fish!.geometry)
      expect(m.fish!.material).toBe(a.fish!.material)
    }
    expect(heron.fish!.scale.x).toBeCloseTo(0.15, 9)
    // and a bird's dispose leaves it for the others
    a.dispose()
    expect(b.fish!.geometry.getAttribute('position').count).toBeGreaterThan(0)
  })
  it('is held crosswise at fishTurn 0: square to the bill, its back up, gripped just behind the bill tip a little ahead of its middle', () => {
    const m = buildDetailedBird(TEST_PERCHER_SPEC)
    m.pose(posed({ fish: 1 }))
    const f = fishNow(m), b = billNow(m)
    expect(Math.abs(f.head.dot(b.dir))).toBeLessThan(1e-9)
    expect(Math.abs(f.head.dot(b.up))).toBeLessThan(1e-9)
    expect(f.back.dot(b.up)).toBeCloseTo(1, 9)
    const hold = b.tip.clone().addScaledVector(b.dir, -FISH_HOLD * M.culmen)
    expect(f.grip.distanceTo(hold)).toBeLessThan(1e-9)
    expect(FISH_GRIP).toBeGreaterThan(0)
    expect(FISH_GRIP).toBeLessThan(0.2)
  })
  it('swings about the bill\'s top to lengthwise, head first, at fishTurn 1, and keeps its grip', () => {
    const m = buildDetailedBird(TEST_PERCHER_SPEC)
    m.pose(posed({ fish: 1, fishTurn: 1 }))
    const f = fishNow(m), b = billNow(m)
    // head first: its head toward the bird's throat, along the bill
    expect(f.head.dot(b.dir)).toBeCloseTo(-1, 9)
    expect(f.back.dot(b.up)).toBeCloseTo(1, 9)
    expect(f.grip.distanceTo(b.tip.clone().addScaledVector(b.dir, -FISH_HOLD * M.culmen))).toBeLessThan(1e-9)
    m.pose(posed({ fish: 1, fishTurn: 0.5 }))
    const half = fishNow(m)
    expect(half.head.dot(b.dir)).toBeCloseTo(-Math.SQRT1_2, 9)
    expect(half.back.dot(b.up)).toBeCloseTo(1, 9)
  })
  it('goes wherever the bill goes: through the neck, a reach, headPitch, headYaw, and a lean', () => {
    const m = buildDetailedBird(TEST_PERCHER_SPEC)
    const inBill = () => {
      m.group.updateMatrixWorld(true)
      return bone(m, 'bill').matrixWorld.clone().invert().multiply(m.fish!.matrixWorld)
    }
    m.pose(posed({ fish: 1, fishTurn: 0.3 }))
    const rest = inBill(), at = fishNow(m).grip
    for (const patch of [{ neckExtend: 0 }, { neckExtend: 1, headPitch: 0.6 }, { headYaw: 0.9, headPitch: -0.4 }, { reach: 0.8 }]) {
      m.pose(posed({ fish: 1, fishTurn: 0.3, ...patch }, 0.5))
      expect(fishNow(m).grip.distanceTo(at), JSON.stringify(patch)).toBeGreaterThan(0.01)
      inBill().elements.forEach((e, i) => expect(e, JSON.stringify(patch)).toBeCloseTo(rest.elements[i]!, 9))
    }
  })
  it("doesn't count in the bird's bounds, which are the bird's own", () => {
    const { fish: _drop, ...without } = TEST_PERCHER_DETAIL
    const plain = buildDetailedBird(parseSpeciesSpec({ ...TEST_PERCHER_SPEC, detail: without }))
    const m = buildDetailedBird(TEST_PERCHER_SPEC)
    expect(m.radius).toBe(plain.radius)
    expect(m.center.equals(plain.center)).toBe(true)
  })
})
