import * as THREE from 'three'
import { sectionOffset, type Profile } from './profile'
import type { DetailSpec } from './spec'
import type { Mesher } from './mesher'
import { ringT } from './loft'

const RINGS = 16
const RADIAL = 12
/** the bill's root starts this fraction of its length inside the head */
const ROOT = 0.15

export interface BillResult {
  /** where the bill leaves the forehead (profile frame, z = 0) */
  base: THREE.Vector3
  tip: THREE.Vector3
  /** unit direction of the bill at its base, and the up normal of the side view */
  dir: THREE.Vector3
  up: THREE.Vector3
  /** the ring nearest sigma = 0, where the bill leaves the forehead */
  baseRing: THREE.Vector3[]
  indexFirst: number
  indexCount: number
}

/**
 * The bill's centreline in the side view for sigma in [-ROOT, 1] (0 = base, 1 = tip): straight along the
 * spine's final tangent, lifted over the distal half by `curve` x length at the tip.
 */
export function billCenter(detail: DetailSpec, profile: Profile, sigma: number): { p: THREE.Vector2; tangent: THREE.Vector2 } {
  const end = profile.sampleAt(1)
  const L = detail.measurements.culmen
  const k = detail.bill.curve * L
  const q = Math.max(0, (sigma - 0.5) / 0.5)
  const p = end.point.clone().addScaledVector(end.tangent, sigma * L).addScaledVector(end.normal, k * q * q)
  const dq = sigma > 0.5 ? (2 * q) / 0.5 : 0      // d(q^2)/dsigma
  const tangent = end.tangent.clone().multiplyScalar(L).addScaledVector(end.normal, k * dq).normalize()
  return { p, tangent }
}

export function buildBill(m: Mesher, detail: DetailSpec, profile: Profile): BillResult {
  const indexFirst = m.indexCount
  const { billDepth, billWidth } = detail.measurements
  const rings: number[][] = []
  for (let i = 0; i < RINGS; i++) {
    const sigma = -ROOT + ((1 + ROOT) * i) / RINGS         // the last ring stops short of the tip
    const { p, tangent } = billCenter(detail, profile, sigma)
    const normal = new THREE.Vector2(-tangent.y, tangent.x)
    const f = 1 - 0.85 * Math.max(0, sigma) ** detail.bill.taper
    const d = (billDepth / 2) * f, w = (billWidth / 2) * f
    const row: number[] = []
    for (let j = 0; j < RADIAL; j++) {
      const th = (j / RADIAL) * Math.PI * 2
      const n = Math.cos(th) * d, z = Math.sin(th) * w
      row.push(m.vertex(new THREE.Vector3(p.x + normal.x * n, p.y + normal.y * n, z), 'bill', Math.max(0, sigma), ringT(th), [['bill', 1]]))
    }
    rings.push(row)
  }
  for (let i = 0; i < RINGS - 1; i++) {
    for (let j = 0; j < RADIAL; j++) {
      const j1 = (j + 1) % RADIAL
      m.quad(rings[i]![j]!, rings[i]![j1]!, rings[i + 1]![j1]!, rings[i + 1]![j]!)
    }
  }
  const root = billCenter(detail, profile, -ROOT).p
  const tip2 = billCenter(detail, profile, 1).p
  const rootV = m.vertex(new THREE.Vector3(root.x, root.y, 0), 'bill', 0, 0.5, [['bill', 1]])
  const tipV = m.vertex(new THREE.Vector3(tip2.x, tip2.y, 0), 'bill', 1, 0.5, [['bill', 1]])
  for (let j = 0; j < RADIAL; j++) {
    const j1 = (j + 1) % RADIAL
    m.tri(rootV, rings[0]![j1]!, rings[0]![j]!)
    m.tri(tipV, rings[RINGS - 1]![j]!, rings[RINGS - 1]![j1]!)
  }
  const end = profile.sampleAt(1)
  const i0 = Math.round((ROOT * RINGS) / (1 + ROOT))
  return {
    baseRing: rings[i0]!.map(i => m.position(i)),
    base: new THREE.Vector3(end.point.x, end.point.y, 0),
    tip: new THREE.Vector3(tip2.x, tip2.y, 0),
    dir: new THREE.Vector3(end.tangent.x, end.tangent.y, 0),
    up: new THREE.Vector3(end.normal.x, end.normal.y, 0),
    indexFirst, indexCount: m.indexCount - indexFirst,
  }
}

/** Right-eye centre and outward direction (profile frame); the left eye mirrors z. */
export function eyePlacement(detail: DetailSpec, profile: Profile): { center: THREE.Vector3; outward: THREE.Vector3 } {
  const s = profile.sampleAt(profile.uOf('eye'))
  const { n, z } = sectionOffset(detail.eye.t * Math.PI, s.up, s.down, s.halfWidth)
  const surface = new THREE.Vector3(s.point.x + s.normal.x * n, s.point.y + s.normal.y * n, z)
  const ext = n >= 0 ? s.up : s.down
  const outward = new THREE.Vector3(s.normal.x * n / ext, s.normal.y * n / ext, z / s.halfWidth).normalize()
  return { center: surface.addScaledVector(outward, -detail.eye.radius * 0.35), outward }
}

/** Two eyes on the head bone; each maps its outward-facing hemisphere onto the eye region of the atlas. */
export function buildEyes(m: Mesher, detail: DetailSpec, profile: Profile): void {
  const r = detail.eye.radius
  const { center, outward } = eyePlacement(detail, profile)
  const e1 = new THREE.Vector3(1, 0, 0).addScaledVector(outward, -outward.x).normalize()
  const e2 = outward.clone().cross(e1)
  const sphere = new THREE.SphereGeometry(r, 12, 8)
  const pos = sphere.getAttribute('position') as THREE.BufferAttribute
  const idx = sphere.getIndex()!
  for (const side of [1, -1]) {
    const base = m.count
    for (let i = 0; i < pos.count; i++) {
      const q = new THREE.Vector3().fromBufferAttribute(pos, i)
      let a = q.dot(e1) / r, b = q.dot(e2) / r
      if (q.dot(outward) < 0) { const l = Math.hypot(a, b) || 1; a /= l; b /= l }
      const p = center.clone().add(q)
      if (side < 0) p.z = -p.z
      m.vertex(p, 'eye', 0.5 + 0.5 * a, 0.5 + 0.5 * b, [['head', 1]])
    }
    for (let i = 0; i < idx.count; i += 3) {
      const a = base + idx.getX(i), b = base + idx.getX(i + 1), c = base + idx.getX(i + 2)
      if (side > 0) m.tri(a, b, c)
      else m.tri(a, c, b)                 // mirroring z flips the winding
    }
  }
  sphere.dispose()
}
