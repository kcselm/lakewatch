import * as THREE from 'three'
import { buildDetailedBird, type DetailedBirdModel } from './build'
import { measure } from './measure'
import { sizedDetail, sameSize } from './spec'
import { TEST_SINGER_SPEC, TEST_SINGER_DETAIL, TEST_PERCHER_SPEC } from './fixture'
import { defaultPose, type PoseState, type StemHold } from '../model'
import { SPECIES } from '../species'
import { GRIPS, gripPosition, holdOn, straddlePosition, type GripKind } from '../../behavior/grips'
import { GRADES } from '../../behavior/spread'

// The song spread's parts and the grips on stems, proven on the test singer (the test percher with a red-winged
// blackbird's display and a smaller version): docs/superpowers/specs/2026-10-13-red-winged-blackbird-design.md,
// "Perching on stems" and "The song spread"; numbers from docs/research/2026-10-13-blackbird-display-and-reeds.md.

const posed = (m: DetailedBirdModel, patch: Partial<PoseState> = {}, leanX = 0, leanZ = 0) => {
  const p = { ...defaultPose(), ...patch }
  p.lean.set(leanX, 0, leanZ)
  m.pose(p)
  m.group.updateMatrixWorld(true)
  return m
}
const within = (v: number, lo: number, hi: number, what = '') => {
  expect(v, what).toBeGreaterThanOrEqual(lo)
  expect(v, what).toBeLessThanOrEqual(hi)
}

/** every vertex of the mesh skinned mostly to one of `bones`, or of a part's range, posed, group space */
function vertices(m: DetailedBirdModel, range: { first: number; count: number }): THREE.Vector3[] {
  const out: THREE.Vector3[] = []
  for (let i = range.first; i < range.first + range.count; i++) out.push(m.mesh.getVertexPosition(i, new THREE.Vector3()))
  return out
}

/** whether p lies inside the posed loft (the skin's closed surface): a ray out from it crosses the skin an odd number of times */
function insideSkin(m: DetailedBirdModel): (p: THREE.Vector3) => boolean {
  const loft = m.anatomy.closed.find(c => c.name === 'loft')!
  const index = m.mesh.geometry.getIndex()!
  const P = new Map<number, THREE.Vector3>()
  const at = (i: number) => { let v = P.get(i); if (!v) P.set(i, (v = m.mesh.getVertexPosition(i, new THREE.Vector3()))); return v }
  const tris: [THREE.Vector3, THREE.Vector3, THREE.Vector3][] = []
  for (let k = loft.indexFirst; k < loft.indexFirst + loft.indexCount; k += 3) tris.push([at(index.getX(k)), at(index.getX(k + 1)), at(index.getX(k + 2))])
  const ray = new THREE.Ray(), hit = new THREE.Vector3()
  return p => {
    ray.set(p, new THREE.Vector3(0.31, 0.27, p.z >= 0 ? 1 : -1).normalize())
    let n = 0
    for (const [a, b, c] of tris) if (ray.intersectTriangle(a, b, c, false, hit)) n++
    return n % 2 === 1
  }
}

describe('a version of a size of its own', () => {
  it('is the traced bird scaled, with the measurements it gives outright; the same object every time', () => {
    const small = sizedDetail(TEST_SINGER_DETAIL, 'small')
    expect(sizedDetail(TEST_SINGER_DETAIL, 'small')).toBe(small)
    expect(small.measurements.wingChord).toBeCloseTo(TEST_SINGER_DETAIL.measurements.wingChord * 0.85, 12)
    expect(small.measurements.tarsus).toBe(0.0269)
    expect(small.profile[3]!.halfWidth).toBeCloseTo(TEST_SINGER_DETAIL.profile[3]!.halfWidth * 0.85, 12)
    expect(sameSize(TEST_SINGER_DETAIL, 'small', 'big')).toBe(false)
    expect(sameSize(TEST_SINGER_DETAIL, 'big', undefined)).toBe(true)
  })
  it('builds smaller, its lengths 0.85 of the other version and its tarsus its own', () => {
    const big = measure(buildDetailedBird(TEST_SINGER_SPEC, 'big')), small = measure(buildDetailedBird(TEST_SINGER_SPEC, 'small'))
    within(small.length / big.length, 0.84, 0.86)
    within(small.wingChord / big.wingChord, 0.84, 0.86)
    within(small.culmen / big.culmen, 0.84, 0.86)
    expect(small.tarsus).toBeCloseTo(0.0269, 9)
  })
  it('leaves every species without sizes as it was: their detail blocks are their own', () => {
    for (const spec of Object.values(SPECIES)) {
      if (!spec.detail || spec.detail.sizes) continue
      for (const v of [undefined, ...Object.keys(spec.variants)]) expect(sizedDetail(spec.detail, v), `${spec.code} ${v}`).toBe(spec.detail)
    }
  })
  it('never shares a mesh across sizes, and shares one within a size', () => {
    const big = buildDetailedBird(TEST_SINGER_SPEC, 'big')
    expect(buildDetailedBird(TEST_SINGER_SPEC, 'small', big).built).not.toBe(big.built)
    expect(buildDetailedBird(TEST_SINGER_SPEC, undefined, big).built).toBe(big.built)
  })
})

describe('the song spread at rest', () => {
  it('a bird without a display has none of its morph targets, nor a split bill', () => {
    const m = buildDetailedBird(TEST_PERCHER_SPEC)
    expect(Object.keys(m.mesh.morphTargetDictionary ?? {})).not.toContain('fluff')
    expect(m.mesh.geometry.getAttribute('position').count).toBe(buildDetailedBird(TEST_PERCHER_SPEC).mesh.geometry.getAttribute('position').count)
  })
  it('every value at 0 leaves the bird exactly as built', () => {
    const m = buildDetailedBird(TEST_SINGER_SPEC, 'big')
    posed(m, { epaulet: 0.6, epauletRaise: 1, fluff: 1, wingHold: 1, gape: 1 })
    posed(m)
    const rest = buildDetailedBird(TEST_SINGER_SPEC, 'big')
    posed(rest)
    const n = m.mesh.geometry.getAttribute('position').count
    for (let i = 0; i < n; i += 7) {
      expect(m.mesh.getVertexPosition(i, new THREE.Vector3()).distanceTo(rest.mesh.getVertexPosition(i, new THREE.Vector3()))).toBeLessThan(1e-9)
    }
  })
})

describe('the song spread', () => {
  const m = buildDetailedBird(TEST_SINGER_SPEC, 'big')
  const display = m.built.display!
  it('no vertex of the folded wings, the cover or the raised coverts goes inside the body, at any grade', () => {
    for (const grade of [0, 1, 2, 3] as const) {
      const g = GRADES[grade]
      posed(m, { epaulet: g.epaulet ?? 0.15, epauletRaise: g.epauletRaise, fluff: g.fluff, wingHold: g.wingHold, gape: g.gape })
      const inside = insideSkin(m)
      for (const range of [display.cover, display.coverts]) {
        const bad = vertices(m, range).filter(inside)
        expect(bad.length, `grade ${grade}`).toBe(0)
      }
    }
    // and sleeked, for a bill-tilt
    posed(m, { fluff: -0.3, epaulet: 0.6 })
    const inside = insideSkin(m)
    expect(vertices(m, display.cover).filter(inside).length).toBe(0)
  })
  it('the cover draws back off the patch as the epaulet goes from 0 to 0.6', () => {
    const coverArea = () => {
      const v = vertices(m, display.cover)
      const xs = v.map(p => p.x), ys = v.map(p => p.y)
      return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys))
    }
    posed(m, { epaulet: 0 })
    const covered = coverArea()
    posed(m, { epaulet: 0.6 })
    expect(coverArea()).toBeLessThan(covered * 0.35)
  })
  it('the gape drops the lower mandible about 30 degrees', () => {
    const jaw = m.mesh.skeleton.bones.find(b => b.name === 'jaw')!
    posed(m, { gape: 1 })
    expect(THREE.MathUtils.radToDeg(-jaw.rotation.z)).toBeCloseTo(30, 6)
    posed(m)
    expect(jaw.rotation.z).toBeCloseTo(0, 12)
  })
  it('wingHold 1 drops the folded wing\'s tip and swings it out from the body', () => {
    const tip = () => {
      const fold = m.mesh.skeleton.bones.find(b => b.name === 'wingFoldR')!
      return m.anatomy.wingTip.clone().sub(m.anatomy.wrist).applyMatrix4(fold.matrixWorld)
    }
    posed(m)
    const rest = tip()
    posed(m, { wingHold: 1 })
    const held = tip()
    expect(held.y).toBeLessThan(rest.y - 0.01)
    expect(held.z).toBeGreaterThan(rest.z + 0.03)
  })
})

describe('grips on stems', () => {
  const m = buildDetailedBird(TEST_SINGER_SPEC, 'big')
  /** a stem standing up from below the bird, its axis through (x, z), leaning `tilt` radians toward +x */
  const stem = (x: number, z: number, radius: number, tilt = 0) => ({
    at: (h: number) => new THREE.Vector3(x + h * Math.sin(tilt), h, z),
    axis: new THREE.Vector3(Math.sin(tilt), Math.cos(tilt), 0),
    radius,
  })
  /** every vertex of a foot's toes, group space */
  const toes = (side: 'right' | 'left') => {
    const prop = m.toes![side]
    const g = prop.geometry.getAttribute('position')
    const out: THREE.Vector3[] = []
    const toGroup = m.group.matrixWorld.clone().invert()
    for (let i = 0; i < g.count; i++) out.push(new THREE.Vector3().fromBufferAttribute(g, i).applyMatrix4(prop.matrixWorld).applyMatrix4(toGroup))
    return out
  }
  /** how far a point lies off a stem's surface (negative inside it) */
  const off = (p: THREE.Vector3, h: StemHold) => {
    const d = p.clone().sub(h.at)
    return d.sub(h.axis.clone().multiplyScalar(d.dot(h.axis))).length() - h.radius
  }
  const hold = (kind: GripKind, s: ReturnType<typeof stem>, mid: number, apart = GRIPS[kind].apart) => {
    const position = gripPosition(s.at(mid), 0, GRIPS[kind].ahead)
    m.group.position.copy(position)
    return {
      right: holdOn(s.at(mid + apart / 2), s.axis, s.radius, position, 0),
      left: holdOn(s.at(mid - apart / 2), s.axis, s.radius, position, 0),
    }
  }
  afterEach(() => m.group.position.set(0, 0, 0))
  for (const [kind, radius, tilt] of [['stalk', 0.004, 0], ['stalk', 0.004, 0.12], ['top', 0.00125, 0], ['tule', 0.005, -0.08]] as const) {
    it(`${kind} (radius ${radius * 1000} mm, leaning ${tilt}): each foot's toes round its stem, within 5 mm of its surface and never inside it`, () => {
      const s = stem(0.3, -0.2, radius, tilt)
      const feet = hold(kind, s, 1.5)
      posed(m, { feet }, GRIPS[kind].lean)
      for (const side of ['right', 'left'] as const) {
        const pts = toes(side)
        expect(pts.length).toBeGreaterThan(50)
        for (const p of pts) within(off(p, feet[side]), -0.0002, 0.005, side)
        // and the foot itself on it
        const foot = m.mesh.skeleton.bones.find(b => b.name === (side === 'right' ? 'toesR' : 'toesL'))!
        within(off(foot.getWorldPosition(new THREE.Vector3()).applyMatrix4(m.group.matrixWorld.clone().invert()), feet[side]), 0, 0.002, side)
      }
    })
  }
  it('straddling two stems 40-110 mm apart, a foot on each, the legs splayed', () => {
    for (const apart of [0.04, 0.08, 0.11]) {
      const a = stem(0, apart / 2, 0.005), b = stem(0, -apart / 2, 0.005)
      const at = straddlePosition(a.at(1.5), b.at(1.48))
      m.group.position.copy(at)
      const feet = { right: holdOn(a.at(1.5), a.axis, 0.005, at, 0), left: holdOn(b.at(1.48), b.axis, 0.005, at, 0) }
      posed(m, { feet }, GRIPS.straddle.lean)
      const R = m.mesh.skeleton.bones.find(x => x.name === 'toesR')!.getWorldPosition(new THREE.Vector3())
      const L = m.mesh.skeleton.bones.find(x => x.name === 'toesL')!.getWorldPosition(new THREE.Vector3())
      // each foot joint on its stem's side toward the bird: no further apart than the stems, no nearer than their
      // spacing less a stem's radius and a toe's each side
      const across = apart - 2 * (0.005 + m.layout.footY)
      within(R.distanceTo(L), Math.hypot(across, 0.02) - 0.001, Math.hypot(apart, 0.02), `${apart}`)
      for (const side of ['right', 'left'] as const) for (const p of toes(side)) within(off(p, feet[side]), -0.0002, 0.005, `${apart} ${side}`)
    }
  })
  it('with no stems the toes wrap its branch as built', () => {
    posed(m)
    const h = { at: new THREE.Vector3(0, -0.004, m.anatomy.foot.z), axis: new THREE.Vector3(0, 0, 1), radius: 0.004 }
    for (const p of toes('right')) within(off(p, h), -0.0002, 0.0015)
  })
})
