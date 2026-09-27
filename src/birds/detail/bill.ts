import * as THREE from 'three'
import { sectionOffset, SQUARENESS, type Profile } from './profile'
import type { DetailSpec } from './spec'
import type { Mesher } from './mesher'
import { ringT } from './loft'

const RINGS = 16
const RADIAL = 12
/** the bill's root starts this fraction of its length inside the head */
const ROOT = 0.15
/** a hook bends the last HOOK of the bill down */
const HOOK = 0.1
/** the shield's grid: along the forehead, and across it */
const SHIELD_S = 8
const SHIELD_T = 7
/** the shield's rim sits this far inside the head, so its edge never flickers against the skin */
const SHIELD_INSET = 0.0003

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
 * The bill's width and depth at sigma (0 base, 1 tip) as multiples of measurements.billWidth and billDepth: its
 * profile, linear between points, or 1 − 0.85 σ^taper. The root inside the head (sigma < 0) keeps the base's.
 */
export function billScale(bill: DetailSpec['bill'], sigma: number): { width: number; depth: number } {
  const s = Math.max(0, sigma)
  const p = bill.profile
  if (!p) {
    const f = 1 - 0.85 * s ** bill.taper!
    return { width: f, depth: f }
  }
  if (s <= p[0]![0]) return { width: p[0]![1], depth: p[0]![2] }
  for (let i = 1; i < p.length; i++) {
    const [s1, w1, d1] = p[i]!, [s0, w0, d0] = p[i - 1]!
    if (s <= s1) { const k = (s - s0) / (s1 - s0); return { width: w0 + (w1 - w0) * k, depth: d0 + (d1 - d0) * k } }
  }
  const last = p[p.length - 1]!
  return { width: last[1], depth: last[2] }
}

/**
 * The bill's centreline in the side view for sigma in [-ROOT, 1] (0 = base, 1 = tip): straight along the
 * spine's final tangent, lifted over the distal half by `curve` x length at the tip, and dropped over the last tenth
 * by `hook`.
 */
export function billCenter(detail: DetailSpec, profile: Profile, sigma: number): { p: THREE.Vector2; tangent: THREE.Vector2 } {
  const end = profile.sampleAt(1)
  const L = detail.measurements.culmen
  const k = detail.bill.curve * L
  const q = Math.max(0, (sigma - 0.5) / 0.5)
  const dq = sigma > 0.5 ? (2 * q) / 0.5 : 0      // d(q^2)/dsigma
  let lift = k * q * q, slope = k * dq
  const hook = detail.bill.hook
  if (hook) {
    const h = Math.max(0, (sigma - (1 - HOOK)) / HOOK)
    lift -= hook * h * h
    slope -= sigma > 1 - HOOK ? hook * ((2 * h) / HOOK) : 0
  }
  const p = end.point.clone().addScaledVector(end.tangent, sigma * L).addScaledVector(end.normal, lift)
  const tangent = end.tangent.clone().multiplyScalar(L).addScaledVector(end.normal, slope).normalize()
  return { p, tangent }
}

/**
 * Where the bill's rings sit, sigma from the root inside the head toward the tip (the tip itself is a point): evenly,
 * plus one at every profile point so the mesh follows the profile exactly, and closer over a hook's bend.
 */
function ringSigmas(bill: DetailSpec['bill']): number[] {
  const even = Array.from({ length: RINGS }, (_, i) => -ROOT + ((1 + ROOT) * i) / RINGS)   // the last stops short of the tip
  if (!bill.profile && !bill.hook) return even
  const extra = [...(bill.profile ?? []).map(([s]) => s), ...(bill.hook ? [0.9, 0.925, 0.95, 0.975] : [])]
  const all = [...even, ...extra.filter(s => s < 1)].sort((a, b) => a - b)
  return all.filter((s, i) => i === 0 || s - all[i - 1]! > 1e-6)
}

export function buildBill(m: Mesher, detail: DetailSpec, profile: Profile): BillResult {
  const indexFirst = m.indexCount
  const { billDepth, billWidth } = detail.measurements
  const rings: number[][] = []
  const sigmas = ringSigmas(detail.bill)
  for (const sigma of sigmas) {
    const { p, tangent } = billCenter(detail, profile, sigma)
    const normal = new THREE.Vector2(-tangent.y, tangent.x)
    const f = billScale(detail.bill, sigma)
    const d = (billDepth / 2) * f.depth, w = (billWidth / 2) * f.width
    const row: number[] = []
    for (let j = 0; j < RADIAL; j++) {
      const th = (j / RADIAL) * Math.PI * 2
      const n = Math.cos(th) * d, z = Math.sin(th) * w
      row.push(m.vertex(new THREE.Vector3(p.x + normal.x * n, p.y + normal.y * n, z), 'bill', Math.max(0, sigma), ringT(th), [['bill', 1]]))
    }
    rings.push(row)
  }
  for (let i = 0; i < rings.length - 1; i++) {
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
    m.tri(tipV, rings[rings.length - 1]![j]!, rings[rings.length - 1]![j1]!)
  }
  const end = profile.sampleAt(1)
  const i0 = sigmas.reduce((best, s, i) => (Math.abs(s) < Math.abs(sigmas[best]!) ? i : best), 0)
  return {
    baseRing: rings[i0]!.map(i => m.position(i)),
    base: new THREE.Vector3(end.point.x, end.point.y, 0),
    tip: new THREE.Vector3(tip2.x, tip2.y, 0),
    dir: new THREE.Vector3(end.tangent.x, end.tangent.y, 0),
    up: new THREE.Vector3(end.normal.x, end.normal.y, 0),
    indexFirst, indexCount: m.indexCount - indexFirst,
  }
}

export interface ShieldResult {
  /** where the shield leaves the top of the bill's base, and its top, on the midline (profile frame) */
  base: THREE.Vector3
  top: THREE.Vector3
  indexFirst: number
  indexCount: number
}

/**
 * A frontal shield (`bill.shield`): a lens-shaped plate on the forehead, from the top of the bill's base up and back
 * along the head's top outline for `length`, `width` across, standing `thickness` off the head at its middle and
 * thinning to nothing at its rim, which sits just inside the skin so it blends into the head. A closed mesh on the
 * head bone, painted as 'shield': s runs up the forehead, t across it.
 */
export function buildShield(m: Mesher, detail: DetailSpec, profile: Profile): ShieldResult | null {
  const sh = detail.bill.shield
  if (!sh) return null
  const indexFirst = m.indexCount
  // the head's top outline, from the bill base back over the forehead, and its arclength
  const N = 400
  const top = Array.from({ length: N + 1 }, (_, k) => {
    const s = profile.sampleAt(1 - (k / N) * 0.5)
    return { s, p: s.point.clone().addScaledVector(s.axis, s.up) }
  })
  const along = [0]
  for (let k = 1; k <= N; k++) along.push(along[k - 1]! + top[k]!.p.distanceTo(top[k - 1]!.p))
  if (along[N]! < sh.length) throw new Error(`the shield (${sh.length} m) is longer than the forehead`)
  /** the head's section where the outline is `a` metres from the bill base */
  const sectionAt = (a: number) => {
    let k = 1
    while (along[k]! < a) k++
    const w = (a - along[k - 1]!) / (along[k]! - along[k - 1]!)
    return profile.sampleAt(1 - ((k - 1 + w) / N) * 0.5)
  }
  const point = (a: number, b: number, lift: number) => {
    const s = sectionAt(a * sh.length)
    // on the head's surface at z across the top: the superellipse section's upper side
    const z = Math.min(Math.abs(b) * sh.width / 2, s.halfWidth * 0.95)
    const n = s.up * (1 - (z / s.halfWidth) ** SQUARENESS) ** (1 / SQUARENESS)
    return new THREE.Vector3(s.point.x + s.axis.x * (n + lift), s.point.y + s.axis.y * (n + lift), Math.sign(b) * z)
  }
  const faces: number[][][] = []
  for (const face of ['top', 'under'] as const) {
    const grid: number[][] = []
    for (let i = 0; i < SHIELD_S; i++) {
      const a = i / (SHIELD_S - 1)
      const row: number[] = []
      for (let j = 0; j < SHIELD_T; j++) {
        const b = (j / (SHIELD_T - 1)) * 2 - 1
        // a lens: thickest in the middle, nothing at the rim; rounded across and along
        const bulge = face === 'top' ? sh.thickness * Math.sqrt(Math.max(0, 1 - b * b)) * Math.sin(Math.PI * a) ** 0.6 : 0
        row.push(m.vertex(point(a, b, bulge - SHIELD_INSET), 'shield', a, (b + 1) / 2, [['head', 1]]))
      }
      grid.push(row)
    }
    faces.push(grid)
  }
  const [upper, under] = faces as [number[][], number[][]]
  // a runs up the forehead (back along the head), b toward +z; the upper face turns outward, the under face in
  for (let i = 0; i < SHIELD_S - 1; i++) {
    for (let j = 0; j < SHIELD_T - 1; j++) {
      m.quad(upper[i]![j]!, upper[i + 1]![j]!, upper[i + 1]![j + 1]!, upper[i]![j + 1]!)
      m.quad(under[i]![j]!, under[i]![j + 1]!, under[i + 1]![j + 1]!, under[i + 1]![j]!)
    }
  }
  return {
    base: point(0, 0, 0), top: point(1, 0, 0),
    indexFirst, indexCount: m.indexCount - indexFirst,
  }
}

/** Right-eye centre and outward direction (profile frame); the left eye mirrors z. */
export function eyePlacement(detail: DetailSpec, profile: Profile): { center: THREE.Vector3; outward: THREE.Vector3 } {
  const s = profile.sampleAt(profile.uOf('eye'))
  const { n, z } = sectionOffset(detail.eye.t * Math.PI, s.up, s.down, s.halfWidth)
  const surface = new THREE.Vector3(s.point.x + s.axis.x * n, s.point.y + s.axis.y * n, z)
  const ext = n >= 0 ? s.up : s.down
  const outward = new THREE.Vector3(s.axis.x * n / ext, s.axis.y * n / ext, z / s.halfWidth).normalize()
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
