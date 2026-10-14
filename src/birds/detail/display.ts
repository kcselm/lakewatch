import * as THREE from 'three'
import type { Profile } from './profile'
import type { DetailSpec } from './spec'
import type { Mesher } from './mesher'
import { foldSurface } from './wing'
import { RADIAL } from './loft'

/**
 * A song spread's parts and morphs (detail.display): the cover over the shoulder, which PoseState.epaulet draws up off
 * the patch; the coverts, which epauletRaise lifts and fans; and the contour feathers, which fluff raises over the body,
 * the nape and the crown, carrying the folded wings, the cover and the coverts and the eyes out with them.
 */

export type Display = NonNullable<DetailSpec['display']>

/** the cover's grid: columns along the wing, and rows down it */
const COVER_A = 10
const COVER_B = 8
/** the coverts' grid */
const COVERTS_A = 7
const COVERTS_B = 5
/** where the coverts lie between the folded wing and the cover, as a share of the cover's gap; their two faces apart */
const COVERTS_AT = 0.55
const COVERTS_FACES = 0.12

export interface PartRange { first: number; count: number; indexFirst: number; indexCount: number }

/** the wing patch (s, t ranges) widened by `margin` all round and kept on the wing */
function widen([s0, s1]: [number, number], [t0, t1]: [number, number], margin: number) {
  return { s0: Math.max(0, s0 - margin), s1: Math.min(1, s1 + margin), t0: Math.max(0, t0 - margin), t1: Math.min(1, t1 + margin) }
}

/**
 * Faces a grid quad (a, b, c, d, in order round it) away from `inside`, a point it must face away from: the folded
 * wing's grid faces out from the body, and this keeps a part that rides it facing the same way on both sides.
 */
function outQuad(m: Mesher, a: number, b: number, c: number, d: number, out: THREE.Vector3) {
  const pa = m.position(a), n = m.position(b).sub(pa).cross(m.position(d).sub(pa))
  if (n.dot(out) >= 0) m.quad(a, b, c, d)
  else m.quad(a, d, c, b)
}

/**
 * The cover over the shoulder, on each side: a shell `gap` off the folded wing over the patch and its margin, on the
 * folded wing's bone, painted as 'cover' (s along the wing, t down it). Its two morph targets draw it forward off the
 * patch from its rear edge (the patch's buff end), every column toward the front one, over the wrist: 'coverHalf'
 * halfway, 'coverFull' the rest of the way, each a chord of the wing's curve (one chord the whole way cut into the
 * wing where it curves round the body). Profile frame.
 */
export function buildCover(m: Mesher, detail: DetailSpec): PartRange {
  const D = detail.display!
  const surface = foldSurface(detail)
  const { s0, s1, t0, t1 } = widen(D.shoulder.s, D.shoulder.t, D.shoulder.margin)
  const first = m.count, indexFirst = m.indexCount
  const at = (a: number, b: number) => { const { p, n } = surface(a, b); return { p: p.addScaledVector(n, D.shoulder.gap), n } }
  for (const side of [1, -1] as const) {
    const bone = side > 0 ? 'wingFoldR' : 'wingFoldL'
    const grid: number[][] = []
    let out = new THREE.Vector3()
    for (let i = 0; i < COVER_A; i++) {
      const a = s0 + ((s1 - s0) * i) / (COVER_A - 1)
      const row: number[] = []
      for (let j = 0; j < COVER_B; j++) {
        const b = t0 + ((t1 - t0) * j) / (COVER_B - 1)
        const rest = at(a, b), half = at(s0 + (a - s0) / 2, b), top = at(s0, b)
        const mirror = (v: THREE.Vector3) => v.setZ(side * v.z)
        const v = m.vertex(mirror(rest.p.clone()), 'cover', i / (COVER_A - 1), j / (COVER_B - 1), [[bone, 1]])
        m.morph(v, mirror(half.p.clone()), 'coverHalf')
        // the second stage's target is relative to the first's: at both full weights the row lies on the top one
        m.morph(v, mirror(rest.p.clone().add(top.p).sub(half.p)), 'coverFull')
        out = mirror(rest.n.clone())
        row.push(v)
      }
      grid.push(row)
    }
    // facing out, and in (held out with the wing, its inside shows)
    for (let i = 0; i < COVER_A - 1; i++) {
      for (let j = 0; j < COVER_B - 1; j++) {
        outQuad(m, grid[i]![j]!, grid[i + 1]![j]!, grid[i + 1]![j + 1]!, grid[i]![j + 1]!, out)
        outQuad(m, grid[i]![j]!, grid[i + 1]![j]!, grid[i + 1]![j + 1]!, grid[i]![j + 1]!, out.clone().negate())
      }
    }
  }
  return { first, count: m.count - first, indexFirst, indexCount: m.indexCount - indexFirst }
}

/**
 * The coverts that rise from the shoulder (epauletRaise): on each side a thin shell over their part of the patch,
 * between the wing and the cover, on the folded wing's bone, its outer face and its inner face both painted as
 * 'coverts'. Its 'raise' morph target turns it `turn` degrees out about its front edge (its rear swinging out, so it
 * faces forward), lifts it `raise` degrees off the wing about its upper edge (the lower edge swinging out), grows it
 * by `grow` about its front upper corner, and moves it `forward` and `out`. Profile frame.
 */
export function buildCoverts(m: Mesher, detail: DetailSpec): PartRange {
  const D = detail.display!
  const C = D.coverts
  const surface = foldSurface(detail)
  const first = m.count, indexFirst = m.indexCount
  const at = (a: number, b: number, k: number) => { const { p, n } = surface(a, b); return { p: p.addScaledVector(n, D.shoulder.gap * k), n } }
  const [s0, s1] = C.s, [t0, t1] = C.t
  // a turn about an axis through `pivot`, its far side swinging out from the body (along the wing's normal there)
  const swing = (pivot: THREE.Vector3, axis: THREE.Vector3, far: { p: THREE.Vector3; n: THREE.Vector3 }, degrees: number) => {
    const probe = far.p.clone().sub(pivot).applyAxisAngle(axis, 0.1).sub(far.p.clone().sub(pivot))
    return new THREE.Quaternion().setFromAxisAngle(axis, THREE.MathUtils.degToRad(degrees) * (probe.dot(far.n) >= 0 ? 1 : -1))
  }
  // turned about the upright through its front edge's middle (the rear swinging out, so it faces forward), then lifted
  // about its upper edge as turned (the lower edge swinging out)
  const front = at(s0, (t0 + t1) / 2, COVERTS_AT).p
  const turn = swing(front, new THREE.Vector3(0, 1, 0), at(s1, (t0 + t1) / 2, COVERTS_AT), C.turn)
  const about = (p: THREE.Vector3, q: THREE.Quaternion, pivot: THREE.Vector3) => p.clone().sub(pivot).applyQuaternion(q).add(pivot)
  const topA = about(at(s0, t0, COVERTS_AT).p, turn, front), topB = about(at(s1, t0, COVERTS_AT).p, turn, front)
  const lowMid = at((s0 + s1) / 2, t1, COVERTS_AT)
  const lift = swing(topA, topB.clone().sub(topA).normalize(), { p: about(lowMid.p, turn, front), n: lowMid.n.clone().applyQuaternion(turn) }, C.raise)
  const raised = (p: THREE.Vector3) => about(about(p, turn, front), lift, topA).sub(topA).multiplyScalar(C.grow).add(topA).add(new THREE.Vector3(C.forward, 0, C.out))
  for (const side of [1, -1] as const) {
    const bone = side > 0 ? 'wingFoldR' : 'wingFoldL'
    for (const face of [1, -1] as const) {
      const grid: number[][] = []
      let out = new THREE.Vector3()
      for (let i = 0; i < COVERTS_A; i++) {
        const a = s0 + ((s1 - s0) * i) / (COVERTS_A - 1)
        // a rounded wedge: full height through its middle, narrowing round its ends
        const u = i / (COVERTS_A - 1)
        const across = 0.35 + 0.65 * Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 4))
        const row: number[] = []
        for (let j = 0; j < COVERTS_B; j++) {
          const b = (t0 + t1) / 2 + ((t1 - t0) * (j / (COVERTS_B - 1) - 0.5)) * across
          const { p, n } = at(a, b, COVERTS_AT - (face < 0 ? COVERTS_FACES : 0))
          const target = raised(p)
          const v = m.vertex(p.clone().setZ(side * p.z), 'coverts', i / (COVERTS_A - 1), j / (COVERTS_B - 1), [[bone, 1]])
          m.morph(v, target.setZ(side * target.z), 'raise')
          out = n.clone().setZ(side * n.z).multiplyScalar(face)
          row.push(v)
        }
        grid.push(row)
      }
      for (let i = 0; i < COVERTS_A - 1; i++) {
        for (let j = 0; j < COVERTS_B - 1; j++) outQuad(m, grid[i]![j]!, grid[i + 1]![j]!, grid[i + 1]![j + 1]!, grid[i]![j + 1]!, out)
      }
    }
  }
  return { first, count: m.count - first, indexFirst, indexCount: m.indexCount - indexFirst }
}

/**
 * How far the contour feathers stand out at fluff 1 at u along the spine: `body` from the tail's base to the neck's
 * (half of it at the rear), easing to `head` over the neck by the head's joint (the occiput), held over the crown, and
 * to nothing at the bill's base from the eye on.
 */
export function fluffAt(display: Display, profile: Profile, rig: DetailSpec['rig'], u: number): number {
  const { body, head } = display.fluff
  const uVent = profile.uOf(rig.tailBase), uNeck = profile.uOf(rig.neckBase), uOcc = profile.uOf(rig.head), uEye = profile.uOf('eye')
  const lerp = (a: number, b: number, k: number) => a + (b - a) * THREE.MathUtils.clamp(k, 0, 1)
  if (u <= uVent) return lerp(0.5 * body, body, u / uVent)
  if (u <= uNeck) return body
  if (u <= uOcc) return lerp(body, head, (u - uNeck) / (uOcc - uNeck))
  if (u <= uEye) return head
  return lerp(head, 0, (u - uEye) / (1 - uEye))
}

/**
 * The 'fluff' morph target: every vertex of the skin's loft (`first`, ring by ring, RADIAL a ring, then its two cap
 * points) out from its section's middle by fluffAt; and every vertex of `riders` (the folded wings, the cover, the
 * coverts, the eyes) by the same as the skin nearest it, so whatever lies on the skin stays as far off it. Profile
 * frame, before the builder moves the bird into place.
 */
export function fluffMorph(m: Mesher, display: Display, profile: Profile, rig: DetailSpec['rig'], loft: { first: number; ringU: number[] }, riders: readonly PartRange[]): void {
  const rings = loft.ringU.length
  const skin: { p: THREE.Vector3; d: THREE.Vector3 }[] = []
  for (let i = 0; i < rings; i++) {
    const s = profile.sampleAt(loft.ringU[i]!)
    const k = fluffAt(display, profile, rig, loft.ringU[i]!)
    const centre = new THREE.Vector3(s.point.x, s.point.y, 0)
    for (let j = 0; j < RADIAL; j++) {
      const v = loft.first + i * RADIAL + j
      const p = m.position(v)
      const d = p.clone().sub(centre)
      // out in the section's own plane, never along the spine
      const along = new THREE.Vector3(s.tangent.x, s.tangent.y, 0)
      d.addScaledVector(along, -d.dot(along))
      d.normalize().multiplyScalar(k)
      m.morph(v, p.clone().add(d), 'fluff')
      skin.push({ p, d })
    }
  }
  for (const r of riders) {
    for (let v = r.first; v < r.first + r.count; v++) {
      const p = m.position(v)
      // the three nearest skin vertices, weighted by nearness
      const near: { dist: number; d: THREE.Vector3 }[] = []
      for (const s of skin) {
        const dist = s.p.distanceToSquared(p)
        if (near.length < 3 || dist < near[2]!.dist) {
          near.push({ dist, d: s.d })
          near.sort((a, b) => a.dist - b.dist)
          if (near.length > 3) near.pop()
        }
      }
      const d = new THREE.Vector3()
      let w = 0
      for (const n of near) { const k = 1 / (Math.sqrt(n.dist) + 1e-4); d.addScaledVector(n.d, k); w += k }
      m.morph(v, p.clone().add(d.multiplyScalar(1 / w)), 'fluff')
    }
  }
}

/**
 * The cover's draw for an epaulet value: its two stages' weights. The cover's rear edge comes forward from beyond the
 * patch's buff end to the wrist as the draw goes from 0 to 1: the buff bar shows at 0.15 (draw 0.28), a red band
 * 6-10 mm beside it at 0.35 (0.5), the whole patch at 0.6 and above.
 */
export function coverDraw(epaulet: number): { half: number; full: number } {
  const e = THREE.MathUtils.clamp(epaulet, 0, 1)
  const k = e <= 0.15 ? (e / 0.15) * 0.28 : e <= 0.35 ? 0.28 + ((e - 0.15) / 0.2) * 0.22 : e <= 0.6 ? 0.5 + ((e - 0.35) / 0.25) * 0.5 : 1
  return { half: Math.min(1, 2 * k), full: Math.max(0, 2 * k - 1) }
}
