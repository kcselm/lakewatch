import * as THREE from 'three'
import { buildDetailedBird, SWAP, GATHER_FROM, type DetailedBirdModel } from './build'
import { wingFrame, type FlightSpec } from './wing'
import { detailSchema } from './spec'
import { TEST_FLIER_SPEC, TEST_FLIER_DETAIL, TEST_PERCHER_SPEC } from './fixture'
import { flightWingNow, foldedWingNow, posedTriangles, depthInside, farthestFrom } from './flight.testkit'
import { parseSpeciesSpec } from '../spec'
import { defaultPose, type PoseState } from '../model'
import { OPTICS } from '../../player/optics'

const F = TEST_FLIER_DETAIL.flight!
const rad = THREE.MathUtils.degToRad, deg = THREE.MathUtils.radToDeg
/** the lean that levels the flier's body: its trace stands 45° nose-up on the perch */
const LEVEL = rad(F.pitch!)
/**
 * A pixel at the near perch through the binoculars: 30 m (the spec's near perch, 30-35 m) across the binoculars'
 * vertical field (player/optics.ts) on a 1080-pixel-tall view, as the earlier rounds measured them. 3.64 mm.
 */
const PX = (2 * 30 * Math.tan(rad(OPTICS.binoculars.fov) / 2)) / 1080

const flierWith = (flight: Partial<FlightSpec>): DetailedBirdModel =>
  buildDetailedBird(parseSpeciesSpec({ ...TEST_FLIER_SPEC, detail: { ...TEST_FLIER_DETAIL, flight: { ...F, ...flight } } }))
const posed = (patch: Partial<Omit<PoseState, 'lean'>>, leanX = LEVEL): PoseState => {
  const p = { ...defaultPose(), ...patch }
  p.lean.x = leanX
  return p
}
const flying = (patch: Partial<Omit<PoseState, 'lean'>> = {}, leanX = LEVEL) => posed({ wingSpread: 1, legsUp: 1, ...patch }, leanX)
const bone = (m: DetailedBirdModel, n: string) => m.mesh.skeleton.bones.find(b => b.name === n)!
/** the wingSpread at which a wing that folds is `c` closed (0 open .. 1 closed, at the swap) */
const closedBy = (c: number) => 1 - c * (1 - SWAP)

/**
 * The right wing's bones' turns in the body's frame (the trace's, turned by the wing's pitch), degrees: each one's
 * sweep (forward +), raise (up +) and twist (leading edge up +), the hand's from the inner wing.
 */
function turns(m: DetailedBirdModel): { inner: { sweep: number; raise: number; twist: number }; hand: { sweep: number; raise: number; twist: number } } {
  m.group.updateMatrixWorld(true)
  const frame = wingFrame(F), unframe = frame.clone().invert()
  const body = bone(m, 'body').getWorldQuaternion(new THREE.Quaternion())
  const inner = bone(m, 'wingR').getWorldQuaternion(new THREE.Quaternion())
  const hand = bone(m, 'handR').getWorldQuaternion(new THREE.Quaternion())
  const read = (q: THREE.Quaternion) => {
    const e = new THREE.Euler().setFromQuaternion(unframe.clone().multiply(q).multiply(frame), 'YXZ')
    return { sweep: deg(e.y), raise: -deg(e.x), twist: deg(e.z) }
  }
  return { inner: read(body.clone().invert().multiply(inner)), hand: read(inner.clone().invert().multiply(hand)) }
}

describe("a flight wing's strokes", () => {
  const m = buildDetailedBird(TEST_FLIER_SPEC)
  it('beats at wingStroke 0 exactly as a wing without a hover does', () => {
    const plain = flierWith({ hover: undefined })
    for (const wingPhase of [0, 0.15, 0.4, 0.8]) {
      m.pose(flying({ wingPhase })); plain.pose(flying({ wingPhase }))
      const a = flightWingNow(m), b = flightWingNow(plain)
      a.forEach((v, k) => expect(v.p.distanceTo(b[k]!.p)).toBeLessThan(1e-12))
      const t = turns(m)
      expect(t.inner.raise).toBeCloseTo(F.beat.lift + F.beat.shoulder * Math.sin(wingPhase * 2 * Math.PI), 6)
      expect(t.inner.sweep).toBeCloseTo(0, 6)
      expect(t.hand.raise).toBeCloseTo(F.beat.hand * Math.sin((wingPhase - F.beat.lag) * 2 * Math.PI), 6)
    }
  })
  it('hovers at wingStroke 1: a wider stroke, the hand bent less, swept forward at the bottom and back at the top', () => {
    const H = F.hover!
    for (const wingPhase of [0, 0.25, 0.4, 0.75, 0.9]) {
      m.pose(flying({ wingPhase, wingStroke: 1 }))
      const t = turns(m), sin = Math.sin(wingPhase * 2 * Math.PI)
      expect(t.inner.raise).toBeCloseTo(H.lift + H.shoulder * sin, 6)
      expect(t.inner.sweep).toBeCloseTo(-H.sweep * sin, 6)
      expect(t.hand.raise).toBeCloseTo(H.hand * Math.sin((wingPhase - H.lag) * 2 * Math.PI), 6)
      expect(t.inner.twist).toBeCloseTo(0, 6)
    }
    // the research's 120° in all (flight-and-plunge.md, section 4.3), against the beat's 100°
    expect(2 * H.shoulder).toBe(120)
    // half-way from the one stroke to the other, every angle is half-way
    m.pose(flying({ wingPhase: 0.6, wingStroke: 0.5 }))
    const half = turns(m), sin = Math.sin(0.6 * 2 * Math.PI)
    expect(half.inner.raise).toBeCloseTo((F.beat.lift + F.beat.shoulder * sin + H.lift + H.shoulder * sin) / 2, 6)
    expect(half.inner.sweep).toBeCloseTo(-H.sweep * sin / 2, 6)
  })
  it('glides on half-closed wings, still whatever the phase or stroke', () => {
    m.pose(flying({ glide: 1, wingPhase: 0.1 }))
    const a = turns(m)
    expect(a.inner.raise).toBeCloseTo(F.glide.shoulder, 6)
    expect(a.hand.raise).toBeCloseTo(F.glide.hand, 6)
    expect(a.inner.sweep).toBeCloseTo(F.glide.sweep!.shoulder, 6)
    expect(a.hand.sweep).toBeCloseTo(F.glide.sweep!.hand, 6)
    const tip = flightWingNow(m).map(v => v.p)
    m.pose(flying({ glide: 1, wingPhase: 0.7, wingStroke: 0.6 }))
    flightWingNow(m).forEach((v, k) => expect(v.p.distanceTo(tip[k]!)).toBeLessThan(1e-9))
  })
  it("lies in the body's plane, tilted with it by the wing's pitch, and turns about the body's axes", () => {
    const flat = flierWith({ glide: { shoulder: 0, hand: 0 } })
    // the body levelled, the wing lies level, spanning out square to the body
    flat.pose(flying({ glide: 1 }))
    const ys = flightWingNow(flat).map(v => v.p.y)
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(0.001)
    // as traced on the perch, it rises 45° with the body, nose-up
    flat.pose(flying({ glide: 1 }, 0))
    const right = flightWingNow(flat).filter(v => v.right).map(v => v.p)
    const lead = right.reduce((a, b) => (b.x > a.x ? b : a)), trail = right.reduce((a, b) => (b.x < a.x ? b : a))
    expect(deg(Math.atan2(lead.y - trail.y, lead.x - trail.x))).toBeCloseTo(F.pitch!, 0)
  })
  it('keeps every bone its length, and the wing its shape until it gathers, in every stroke, the glide and the fold', () => {
    m.pose(flying({ glide: 1 }))
    const length = (a: string, b: string) => bone(m, a).getWorldPosition(new THREE.Vector3()).distanceTo(bone(m, b).getWorldPosition(new THREE.Vector3()))
    m.group.updateMatrixWorld(true)
    const arm = length('wingR', 'handR')
    const tip = () => flightWingNow(m).filter(v => v.right).reduce((a, b) => (b.p.distanceTo(bone(m, 'handR').getWorldPosition(new THREE.Vector3())) > a.p.distanceTo(bone(m, 'handR').getWorldPosition(new THREE.Vector3())) ? b : a))
    const hand = tip().p.distanceTo(bone(m, 'handR').getWorldPosition(new THREE.Vector3()))
    const poses: Partial<PoseState>[] = [
      ...[0, 0.2, 0.45, 0.7].flatMap(wingPhase => [{ wingPhase }, { wingPhase, wingStroke: 1 }, { wingPhase, wingStroke: 0.5 }]),
      { glide: 0.5, wingPhase: 0.3 },
      // the fold, up to where its feathers begin to gather
      { wingSpread: closedBy(GATHER_FROM / 3) }, { wingSpread: closedBy(GATHER_FROM / 2) }, { wingSpread: closedBy(GATHER_FROM) },
    ]
    for (const p of poses) {
      m.pose(flying(p))
      m.group.updateMatrixWorld(true)
      expect(length('wingR', 'handR')).toBeCloseTo(arm, 9)
      expect(tip().p.distanceTo(bone(m, 'handR').getWorldPosition(new THREE.Vector3()))).toBeCloseTo(hand, 9)
    }
  })
  it('never passes into the body: in either stroke, the glide, or the fold, no wing vertex outside the body goes in', () => {
    // The wing's root is inside the body, at the shoulder, and the rest of it starts outside. Within the body's own
    // width of the shoulder (a tenth of the span, as the research traced it: flight-and-plunge.md, section 2.3) the
    // wing turns about a hinge inside the body, and a closing wing's root dips a little under the skin of the back at
    // the top of a stroke, as a real one does under the scapulars: less than a pixel at the near perch through the
    // binoculars. Beyond it, nothing of the wing ever goes in.
    m.pose(flying({ glide: 1 }))
    const all = flightWingNow(m), rest = depthInside(posedTriangles(m, 'loft'), all.map(v => v.p))
    const built = m.mesh.geometry.getAttribute('position') as THREE.BufferAttribute
    const sOf = (i: number) => (Math.abs(built.getZ(i)) - m.built.joints.wingR.z) / F.span
    const outside = all.filter((_, k) => rest[k] === 0)
    expect(outside.length).toBeGreaterThan(0.9 * m.anatomy.flightWing!.count)
    const root = new Set(outside.filter(v => sOf(v.i) <= 0.1).map(v => v.i)), beyond = new Set(outside.filter(v => sOf(v.i) > 0.1).map(v => v.i))
    const poses: Partial<PoseState>[] = [
      ...Array.from({ length: 12 }, (_, k) => k / 12).flatMap(wingPhase => [{ wingPhase }, { wingPhase, wingStroke: 1 }, { wingPhase, wingStroke: 0.5 }]),
      { glide: 1 }, { glide: 0.5, wingPhase: 0.25 }, { glide: 1, wingSpread: 0.5 },
      // the fold, alone and while the wing still beats or hovers, at the top and bottom of the stroke
      ...[0.9, 0.75, 0.6, 0.45, 0.3, 0.2, 0.1, 0.06].flatMap(wingSpread =>
        [0, 0.5, 1].flatMap(wingStroke => [0.25, 0.75].map(wingPhase => ({ wingSpread, wingStroke, wingPhase })))),
    ]
    const worst = { root: 0, beyond: 0, pose: '' }
    for (const p of poses) {
      m.pose(flying(p))
      const loft = posedTriangles(m, 'loft'), wing = flightWingNow(m)
      const depth = (set: Set<number>) => Math.max(0, ...depthInside(loft, wing.filter(v => set.has(v.i)).map(v => v.p)))
      const b = depth(beyond)
      if (b > worst.beyond) worst.pose = JSON.stringify(p)
      worst.root = Math.max(worst.root, depth(root)); worst.beyond = Math.max(worst.beyond, b)
    }
    expect(worst.beyond, worst.pose).toBe(0)
    expect(worst.root).toBeLessThan(PX)
  })
})

describe('a flight wing that folds', () => {
  const m = buildDetailedBird(TEST_FLIER_SPEC)
  it('stays whole as it strokes and folds: its strips never part where they meet, and its upper face stays over its under', () => {
    // Each strip of the chord has its own vertices along its edges, and a neighbour's that meet them share their place
    // on the wing (s and t): they move together, whatever the bones and the gather do. (The fingers' slots, and the
    // tip, where the whole chord is one point that the gather spreads down the folded wing's last column, are other
    // places on the wing.)
    const a = m.anatomy.flightWing!, g = m.mesh.geometry, N = a.count / 4
    const built = g.getAttribute('position') as THREE.BufferAttribute, uv = g.getAttribute('uv') as THREE.BufferAttribute
    const place = (i: number) => [built.getX(i), built.getY(i), built.getZ(i), uv.getX(i), uv.getY(i)].map(v => Math.round(v * 1e8)).join()
    const together = new Map<string, number[]>()
    for (let i = a.first; i < a.first + a.count; i++) together.set(place(i), [...(together.get(place(i)) ?? []), i])
    const shared = [...together.values()].filter(list => list.length > 1)
    expect(shared.length).toBeGreaterThan(100)
    // the upper face's triangles (each side's wing is its upper face's N vertices, then its under face's, built alike)
    const index = g.getIndex()!.array, upper: number[][] = []
    for (let f = 0; f < index.length; f += 3) {
      const t = [index[f]!, index[f + 1]!, index[f + 2]!]
      if (t[0]! >= a.first && t[0]! < a.first + a.count && (t[0]! - a.first) % (2 * N) < N) upper.push(t)
    }
    const poses: Partial<PoseState>[] = [
      ...[0, 0.25, 0.5, 0.75].flatMap(wingPhase => [{ wingPhase }, { wingPhase, wingStroke: 1 }]),
      { glide: 1 }, ...[0.85, 0.55, 0.25, SWAP + 1e-4].map(wingSpread => ({ wingSpread, wingPhase: 0.25, wingStroke: 1 })),
    ]
    for (const p of poses) {
      m.pose(flying(p))
      const at = (i: number) => m.mesh.getVertexPosition(i, new THREE.Vector3())
      let gap = 0
      for (const [first, ...rest] of shared) for (const i of rest) gap = Math.max(gap, at(i).distanceTo(at(first!)))
      expect(gap, JSON.stringify(p)).toBeLessThan(1e-9)
      // each upper triangle faces away from its twin on the under face, which lies behind it
      let behind = 0
      for (const t of upper) {
        const [p0, p1, p2] = t.map(at) as [THREE.Vector3, THREE.Vector3, THREE.Vector3]
        const n = p1.clone().sub(p0).cross(p2.clone().sub(p0))
        if (n.lengthSq() < 1e-20) continue
        const under = t.map(i => at(i + N)).reduce((s, v) => s.add(v), new THREE.Vector3()).divideScalar(3)
        if (under.sub(p0.clone().add(p1).add(p2).divideScalar(3)).dot(n) >= 0) behind++
      }
      expect(behind, JSON.stringify(p)).toBe(0)
    }
  })
  it("swaps to the folded wing where the two coincide: the jump is under a pixel at the near perch through binoculars", () => {
    expect(PX * 1000).toBeCloseTo(3.64, 2)
    // whatever the stroke was, a closed wing lies on the folded wing's place, perched or in the air
    for (const [patch, lean] of [[{}, 0], [{ wingPhase: 0.3, wingStroke: 1, glide: 0.4 }, LEVEL]] as const) {
      m.pose(posed({ ...patch, wingSpread: SWAP + 1e-4 }, lean))
      const spread = flightWingNow(m), right = new Set(spread.filter(v => v.right).map(v => v.i))
      const spreadTris = posedTrianglesOf(m, i => right.has(i))
      m.pose(posed({ ...patch, wingSpread: SWAP }, lean))
      expect(bone(m, 'wingFoldR').scale.x).toBe(1)
      expect(bone(m, 'wingR').scale.x).toBeLessThan(0.001)
      const folded = foldedWingNow(m).filter(v => v.right).map(v => v.p)
      const foldedTris = posedTrianglesOf(m, i => isFoldR(m, i))
      // nothing of the spread wing goes where no folded wing appears, and nothing of the folded wing appears where
      // no spread wing was
      expect(farthestFrom(spread.filter(v => v.right).map(v => v.p), foldedTris)).toBeLessThan(PX)
      expect(farthestFrom(folded, spreadTris)).toBeLessThan(PX)
    }
  })
  it('sweeps back as it closes, wingSpread 1 to the swap, its feathers gathering only once it is part-way', () => {
    const fold = (spread: number) => { m.pose(flying({ wingSpread: spread })); return turns(m) }
    const open = fold(1), part = fold(closedBy(GATHER_FROM)), shut = fold(SWAP + 1e-4)
    expect(open.inner.sweep).toBeCloseTo(0, 6)
    expect(part.inner.sweep).toBeCloseTo(F.fold!.sweep.shoulder * GATHER_FROM, 6)
    expect(part.inner.twist).toBeCloseTo(F.fold!.twist.shoulder * GATHER_FROM, 6)
    expect(shut.inner.sweep).toBeCloseTo(F.fold!.sweep.shoulder, 1)
    expect(shut.hand.sweep).toBeCloseTo(F.fold!.sweep.hand, 1)
    expect(shut.inner.twist).toBeCloseTo(F.fold!.twist.shoulder, 1)
    m.pose(flying({ wingSpread: closedBy(GATHER_FROM) }))
    expect(m.mesh.morphTargetInfluences![m.mesh.morphTargetDictionary!.fold!]).toBe(0)
    m.pose(flying({ wingSpread: SWAP + 1e-4 }))
    expect(m.mesh.morphTargetInfluences![m.mesh.morphTargetDictionary!.fold!]).toBeGreaterThan(0.999)
    // the stroke eases off as it closes, and is gone by the swap
    m.pose(flying({ wingSpread: SWAP + 1e-4, wingPhase: 0.25 }))
    expect(Math.abs(turns(m).inner.raise)).toBeLessThan(0.01)
  })
  it('opens all at once without a fold, its stroke growing with wingSpread, and swaps at 0.05', () => {
    const plain = flierWith({ fold: undefined })
    expect(plain.mesh.morphTargetDictionary?.fold).toBeUndefined()
    plain.pose(flying({ wingSpread: 0.06, wingPhase: 0.25 }))
    expect(bone(plain, 'wingR').scale.x).toBe(1)
    expect(turns(plain).inner.raise).toBeCloseTo((F.beat.lift + F.beat.shoulder) * 0.06, 6)
    expect(turns(plain).inner.sweep).toBeCloseTo(0, 6)
    plain.pose(flying({ wingSpread: SWAP }))
    expect(bone(plain, 'wingR').scale.x).toBeLessThan(0.001)
  })
  it('turns its normals onto the folded wing as its feathers gather, so the light on it does not jump at the swap', () => {
    const g = m.mesh.geometry
    expect(g.morphAttributes.normal).toHaveLength(g.morphAttributes.position!.length)
    expect(g.morphAttributes.position!.map(a => a.name)).toEqual(['fold'])
  })
})

describe("a percher's legs in flight", () => {
  const m = buildDetailedBird(TEST_FLIER_SPEC)
  const legVerts = (b: DetailedBirdModel) => {
    const g = b.mesh.geometry
    const skinIndex = g.getAttribute('skinIndex')
    const legs = new Set(['tibiaL', 'tarsusL', 'toesL', 'tibiaR', 'tarsusR', 'toesR'].map(n => b.mesh.skeleton.bones.indexOf(bone(b, n))))
    b.group.updateMatrixWorld(true)
    const out: THREE.Vector3[] = []
    for (let i = 0; i < skinIndex.count; i++) if (legs.has(skinIndex.getComponent(i, 0))) out.push(b.mesh.getVertexPosition(i, new THREE.Vector3()))
    return out
  }
  it('stand on the branch at legsUp 0, as they always have', () => {
    const plain = buildDetailedBird(TEST_PERCHER_SPEC)
    for (const leanX of [0, 0.4]) {
      m.pose(posed({}, leanX)); plain.pose(posed({}, leanX))
      const a = legVerts(m), b = legVerts(plain)
      a.forEach((p, k) => expect(p.distanceTo(b[k]!)).toBeLessThan(1e-12))
    }
  })
  it('fold up under the belly at legsUp 1, the feet against its feathers', () => {
    for (const leanX of [0, LEVEL, LEVEL - 0.96]) {
      m.pose(posed({ legsUp: 1, wingSpread: 1 }, leanX))
      const loft = posedTriangles(m, 'loft')
      const legs = legVerts(m)
      const inside = depthInside(loft, legs)
      const out = legs.filter((_, k) => inside[k] === 0)
      // what still shows lies within a few mm of the belly: about a pixel at the near perch through the binoculars
      expect(farthestFrom(out, loft)).toBeLessThan(0.004)
    }
  })
  it('lower again smoothly: half-way up, the feet are part-way to the belly', () => {
    m.pose(posed({}, 0)); const down = legVerts(m)
    m.pose(posed({ legsUp: 0.5 }, 0)); const half = legVerts(m)
    m.pose(posed({ legsUp: 1 }, 0)); const up = legVerts(m)
    const lowest = (ps: THREE.Vector3[]) => Math.min(...ps.map(p => p.y))
    expect(lowest(half)).toBeGreaterThan(lowest(down))
    expect(lowest(half)).toBeLessThan(lowest(up))
  })
})

describe('the flight block in the schema', () => {
  const ok = (flight: Partial<FlightSpec>) => detailSchema.safeParse({ ...TEST_FLIER_DETAIL, flight: { ...F, ...flight } }).success
  it('takes a hover, a fold, a pitch and a swept glide, each optional', () => {
    expect(ok({})).toBe(true)
    expect(ok({ hover: undefined, fold: undefined, pitch: undefined, glide: { shoulder: 3, hand: -3 } })).toBe(true)
  })
  it('refuses a hand folded so far its skin would turn inside out across the wrist, and a pitch past 60°', () => {
    expect(ok({ fold: { sweep: { shoulder: -80, hand: -130 }, twist: F.fold!.twist } })).toBe(false)
    expect(ok({ pitch: 70 })).toBe(false)
    expect(ok({ hover: { ...F.hover!, sweep: 50 } })).toBe(false)
  })
})

/** a folded wing's vertex on the right: on wingFoldR alone */
function isFoldR(m: DetailedBirdModel, i: number): boolean {
  const g = m.mesh.geometry
  return g.getAttribute('skinWeight').getComponent(i, 0) === 1 && m.mesh.skeleton.bones[g.getAttribute('skinIndex').getComponent(i, 0)]!.name === 'wingFoldR'
}

/** The triangles all of whose corners `keep` keeps, as the model's last pose() left them, group space. */
function posedTrianglesOf(m: DetailedBirdModel, keep: (i: number) => boolean): THREE.Triangle[] {
  const index = m.mesh.geometry.getIndex()!.array
  m.group.updateMatrixWorld(true)
  const out: THREE.Triangle[] = []
  for (let f = 0; f < index.length; f += 3) {
    const a = index[f]!, b = index[f + 1]!, c = index[f + 2]!
    if (!keep(a) || !keep(b) || !keep(c)) continue
    out.push(new THREE.Triangle(...[a, b, c].map(i => m.mesh.getVertexPosition(i, new THREE.Vector3())) as [THREE.Vector3, THREE.Vector3, THREE.Vector3]))
  }
  return out
}
