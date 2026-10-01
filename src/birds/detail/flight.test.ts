import * as THREE from 'three'
import { buildDetailedBird, type DetailedBirdModel } from './build'
import { flightEdges, chordStrips, WRIST_BLEND, type FlightSpec } from './wing'
import { detailSchema, type DetailSpec } from './spec'
import { BONE_INDEX } from './rig'
import { TEST_SWIM_SPEC, TEST_SWIM_DETAIL } from './fixture'
import { parseSpeciesSpec } from '../spec'
import { defaultPose, type PoseState } from '../model'
import { partFrames } from '../paint/painter'
import { createProfile } from './profile'

/** A flight wing for the test duck: 0.4 m from shoulder to tip, bending at 0.45 of it, five fingers from 0.75. */
const FLIGHT: FlightSpec = {
  span: 0.4,
  outline: [[0, 0.05, -0.09], [0.45, 0.06, -0.08], [0.8, 0.03, -0.07], [1, -0.02, -0.04]],
  wrist: 0.45,
  fingers: { count: 5, from: 0.75, fill: 0.6 },
  beat: { shoulder: 35, lift: 5, hand: 25, lag: 0.15 },
  glide: { shoulder: 4, hand: -8 },
}
const detailWith = (flight?: FlightSpec): DetailSpec => ({ ...TEST_SWIM_DETAIL, flight })
const duck = (flight?: FlightSpec): DetailedBirdModel => buildDetailedBird(parseSpeciesSpec({ ...TEST_SWIM_SPEC, detail: detailWith(flight) }))
const flying = (patch: Partial<PoseState>): PoseState => ({ ...defaultPose(), wingSpread: 1, ...patch })

/** The flight wing's vertices where they are now, in group space, each with its texture s and whether it is on the right wing. */
function wingNow(m: DetailedBirdModel): { p: THREE.Vector3; right: boolean; hand: number }[] {
  const a = m.anatomy.flightWing!
  const g = m.mesh.geometry
  const skinIndex = g.getAttribute('skinIndex'), skinWeight = g.getAttribute('skinWeight')
  m.group.updateMatrixWorld(true)
  return Array.from({ length: a.count }, (_, k) => {
    const i = a.first + k
    let hand = 0
    for (let c = 0; c < 4; c++) {
      const bone = skinIndex.getComponent(i, c)
      if (bone === BONE_INDEX.handR || bone === BONE_INDEX.handL) hand += skinWeight.getComponent(i, c)
    }
    return { p: m.mesh.getVertexPosition(i, new THREE.Vector3()), right: (g.getAttribute('position') as THREE.BufferAttribute).getZ(i) > 0, hand }
  })
}
const tipOf = (m: DetailedBirdModel, right = true) => wingNow(m).filter(v => v.right === right).reduce((a, b) => (Math.abs(b.p.z) > Math.abs(a.p.z) ? b : a)).p

describe('a flight wing', () => {
  it('reads its outline between its points', () => {
    const e = flightEdges(FLIGHT, 0.225)
    expect(e.lead).toBeCloseTo(0.055, 9)
    expect(e.trail).toBeCloseTo(-0.085, 9)
    expect(flightEdges(FLIGHT, 1).lead).toBeCloseTo(-0.02, 9)
    expect(flightEdges(FLIGHT, 1).trail).toBeCloseTo(-0.04, 9)
  })
  it('spans what the species says, tip to tip, flat at rest', () => {
    const m = duck(FLIGHT)
    m.pose(flying({ glide: 1 }))
    const flat = duck({ ...FLIGHT, glide: { shoulder: 0, hand: 0 } })
    flat.pose(flying({ glide: 1 }))
    const right = tipOf(flat), left = tipOf(flat, false)
    // from each shoulder out: twice the span and the shoulders' distance apart
    expect(right.z - left.z).toBeCloseTo(2 * FLIGHT.span + 2 * flat.anatomy.flightWing!.wrist.z - 2 * FLIGHT.span * FLIGHT.wrist, 4)
    expect(right.y).toBeCloseTo(left.y, 6)
    const ys = wingNow(flat).map(v => v.p.y)
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(0.001)
    // the wrist sits at its fraction of the span, mid-chord
    const a = flat.anatomy.flightWing!
    expect((a.wrist.z - (a.tip.z - FLIGHT.span)) / FLIGHT.span).toBeCloseTo(FLIGHT.wrist, 6)
  })
  it('replaces the plain spread wing, and only on a species that asks', () => {
    const plain = duck(), m = duck(FLIGHT)
    expect(plain.anatomy.flightWing).toBeNull()
    const partsOf = (b: DetailedBirdModel) => b.mesh.geometry.getAttribute('position').count
    expect(partsOf(m)).not.toBe(partsOf(plain))
    // with no flight wing the hands sit on the shoulders and carry no skin
    const bone = (b: DetailedBirdModel, n: string) => b.mesh.skeleton.bones.find(x => x.name === n)!
    expect(bone(plain, 'handR').position.length()).toBe(0)
    expect(bone(m, 'handR').position.z).toBeCloseTo(FLIGHT.span * FLIGHT.wrist, 6)
    const skinIndex = plain.mesh.geometry.getAttribute('skinIndex'), skinWeight = plain.mesh.geometry.getAttribute('skinWeight')
    for (let i = 0; i < skinIndex.count; i++) {
      for (let c = 0; c < 4; c++) {
        if (skinWeight.getComponent(i, c) > 0) expect([BONE_INDEX.handL, BONE_INDEX.handR]).not.toContain(skinIndex.getComponent(i, c))
      }
    }
  })
  it('hands the skin from the inner wing to the hand across the wrist', () => {
    const m = duck(FLIGHT)
    const a = m.anatomy.flightWing!
    const root = a.tip.z - FLIGHT.span
    // measured on the wing as built: folded away at rest, it is scaled to nothing
    const built = m.mesh.geometry.getAttribute('position') as THREE.BufferAttribute
    for (const [k, v] of wingNow(m).entries()) {
      if (!v.right) continue
      const s = (built.getZ(a.first + k) - root) / FLIGHT.span
      const want = Math.min(1, Math.max(0, (s - (FLIGHT.wrist - WRIST_BLEND)) / (2 * WRIST_BLEND)))
      expect(v.hand).toBeCloseTo(want, 5)
    }
  })
  it('beats: the inner wing swings about its lift, and the hand follows behind it', () => {
    const m = duck(FLIGHT)
    const a = m.anatomy.flightWing!
    const angles = (phase: number) => {
      m.pose(flying({ wingPhase: phase }))
      m.group.updateMatrixWorld(true)
      const bone = (n: string) => m.mesh.skeleton.bones.find(x => x.name === n)!
      const shoulder = bone('wingR').getWorldPosition(new THREE.Vector3()), wrist = bone('handR').getWorldPosition(new THREE.Vector3())
      const tip = tipOf(m)
      const inner = Math.atan2(wrist.y - shoulder.y, wrist.z - shoulder.z)
      const outer = Math.atan2(tip.y - wrist.y, tip.z - wrist.z)
      return { inner: THREE.MathUtils.radToDeg(inner), hand: THREE.MathUtils.radToDeg(outer - inner) }
    }
    expect(angles(0).inner).toBeCloseTo(FLIGHT.beat.lift, 1)
    expect(angles(0.25).inner).toBeCloseTo(FLIGHT.beat.lift + FLIGHT.beat.shoulder, 1)
    expect(angles(0.75).inner).toBeCloseTo(FLIGHT.beat.lift - FLIGHT.beat.shoulder, 1)
    // the hand is at its highest a lag after the inner wing is
    expect(angles(0.25 + FLIGHT.beat.lag).hand).toBeCloseTo(FLIGHT.beat.hand, 0)
    expect(angles(0.75 + FLIGHT.beat.lag).hand).toBeCloseTo(-FLIGHT.beat.hand, 0)
    // both wings alike
    m.pose(flying({ wingPhase: 0.4 }))
    const r = tipOf(m), l = tipOf(m, false)
    expect(r.y).toBeCloseTo(l.y, 6)
    expect(r.z).toBeCloseTo(-l.z, 6)
    expect(a.count).toBeGreaterThan(0)
  })
  it('glides: the wing still at its glide angles, whatever the phase', () => {
    const m = duck(FLIGHT)
    m.pose(flying({ glide: 1, wingPhase: 0.1 }))
    const a = tipOf(m).clone()
    m.pose(flying({ glide: 1, wingPhase: 0.6 }))
    expect(tipOf(m).distanceTo(a)).toBeLessThan(1e-9)
    // the inner wing up a little, the hand drooped from it
    const bone = (n: string) => m.mesh.skeleton.bones.find(x => x.name === n)!
    const shoulder = bone('wingR').getWorldPosition(new THREE.Vector3()), wrist = bone('handR').getWorldPosition(new THREE.Vector3())
    const inner = THREE.MathUtils.radToDeg(Math.atan2(wrist.y - shoulder.y, wrist.z - shoulder.z))
    const outer = THREE.MathUtils.radToDeg(Math.atan2(a.y - wrist.y, a.z - wrist.z))
    expect(inner).toBeCloseTo(FLIGHT.glide.shoulder, 1)
    expect(outer - inner).toBeCloseTo(FLIGHT.glide.hand, 0)
    // half-way into a glide the beat is half as deep
    m.pose(flying({ glide: 0.5, wingPhase: 0.25 }))
    m.group.updateMatrixWorld(true)
    const w2 = bone('handR').getWorldPosition(new THREE.Vector3()), s2 = bone('wingR').getWorldPosition(new THREE.Vector3())
    expect(THREE.MathUtils.radToDeg(Math.atan2(w2.y - s2.y, w2.z - s2.z))).toBeCloseTo((FLIGHT.beat.lift + FLIGHT.beat.shoulder + FLIGHT.glide.shoulder) / 2, 1)
  })
  it('never creases at the wrist: through a whole beat the wing runs outward all along it', () => {
    const m = duck(FLIGHT)
    const rest = wingNow(m).map(v => v.p.z)
    for (let k = 0; k < 20; k++) {
      m.pose(flying({ wingPhase: k / 20 }))
      const now = wingNow(m)
      // by where they lie along the span at rest, the right wing's points stay in that order outward
      const order = now.map((v, i) => ({ v, z0: rest[i]! })).filter(x => x.v.right).sort((a, b) => a.z0 - b.z0)
      for (let i = 1; i < order.length; i++) {
        if (order[i]!.z0 - order[i - 1]!.z0 < 1e-6) continue
        expect(order[i]!.v.p.z, `phase ${k / 20}`).toBeGreaterThan(order[i - 1]!.v.p.z - 1e-6)
      }
    }
  })
  it('parts into fingers from where the species says, each keeping its share of the chord at the tip', () => {
    const at = (s: number) => chordStrips(FLIGHT, s)
    expect(at(0.5)).toHaveLength(5)
    // edge to edge up to `from`
    at(0.75).forEach(([a, b], k) => { expect(a).toBeCloseTo(k / 5, 9); expect(b).toBeCloseTo((k + 1) / 5, 9) })
    // at the tip each feather is `fill` of a fifth of the chord wide, centred in its fifth
    at(1).forEach(([a, b], k) => { expect(b - a).toBeCloseTo(0.6 / 5, 9); expect((a + b) / 2).toBeCloseTo((k + 0.5) / 5, 9) })
    // without fingers, strips edge to edge all the way
    const plain = chordStrips({ ...FLIGHT, fingers: undefined }, 1)
    plain.forEach(([a, b], k) => { if (k > 0) expect(a).toBe(plain[k - 1]![1]); expect(b).toBeGreaterThan(a) })
    expect(plain[0]![0]).toBe(0)
    expect(plain.at(-1)![1]).toBe(1)
  })
  it('folds away on the water and opens to fly, as the plain wing does', () => {
    const m = duck(FLIGHT)
    const bone = (n: string) => m.mesh.skeleton.bones.find(x => x.name === n)!
    m.pose(defaultPose())
    expect(bone('wingR').scale.x).toBeLessThan(0.001)
    expect(bone('wingFoldR').scale.x).toBe(1)
    m.pose(flying({}))
    expect(bone('wingR').scale.x).toBe(1)
    expect(bone('wingFoldR').scale.x).toBeLessThan(0.001)
  })
  it('is painted on the spread wing, by its own span and chord', () => {
    const detail = detailWith(FLIGHT)
    const f = partFrames(detail, createProfile(detail.profile))
    expect(f.wingSpread.lengthMm).toBeCloseTo(400, 6)
    expect(f.wingSpread.widthMm(0)).toBeCloseTo(140, 6)
    expect(f.wingUnder.widthMm(1)).toBeCloseTo(20, 6)
    // the plain wing's frame is what it was
    const plain = partFrames(TEST_SWIM_DETAIL, createProfile(TEST_SWIM_DETAIL.profile))
    expect(plain.wingSpread.lengthMm).toBeCloseTo(1.78 * 240, 6)
  })
  it('is refused with an outline out of order, short of the tip, or inside out', () => {
    const ok = (flight: FlightSpec) => detailSchema.safeParse(detailWith(flight)).success
    expect(ok(FLIGHT)).toBe(true)
    expect(ok({ ...FLIGHT, outline: [[0, 0.05, -0.09], [0.6, 0.06, -0.08], [0.5, 0.03, -0.07], [1, -0.02, -0.04]] })).toBe(false)
    expect(ok({ ...FLIGHT, outline: [[0, 0.05, -0.09], [0.5, 0.06, -0.08], [0.9, -0.02, -0.04]] })).toBe(false)
    expect(ok({ ...FLIGHT, outline: [[0, 0.05, -0.09], [0.5, -0.09, -0.08], [1, -0.02, -0.04]] })).toBe(false)
  })
})
