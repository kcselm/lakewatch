import * as THREE from 'three'
import { sectionOffset, SQUARENESS, type Profile } from './profile'
import type { DetailSpec } from './spec'
import type { Mesher } from './mesher'
import { ringT } from './loft'

const RINGS = 16
const RADIAL = 12
const SQUARE_RADIAL = 20
/** the bill's root starts this fraction of its length inside the head */
const ROOT = 0.15
/** a hook bends the last HOOK of the bill down */
const HOOK = 0.1
/** the shield's grid: along the forehead, and across it */
const SHIELD_S = 8
const SHIELD_T = 7
/** the shield's rim sits this far inside the head, so its edge never flickers against the skin */
const SHIELD_INSET = 0.0003
/** the pouch's grid: rings along it (besides one at each of its outline's points), and points round each ring's hang */
const POUCH_S = 24
const POUCH_T = 9
/** the pouch hangs from inside the bill's sides: this fraction of the bill's half-width out from its middle */
const POUCH_WIDTH = 0.9

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
 * A point of the bill's cross-section at angle th (0 the culmen, pi/2 the right side), `d` deep and `w` wide from its
 * centre: an ellipse, or with `section` a superellipse of that exponent, flat on top and squared at the sides.
 */
export function billOffset(th: number, d: number, w: number, section?: number): { n: number; z: number } {
  if (!section) return { n: Math.cos(th) * d, z: Math.sin(th) * w }
  const e = 2 / section, c = Math.cos(th), s = Math.sin(th)
  return { n: Math.sign(c) * Math.abs(c) ** e * d, z: Math.sign(s) * Math.abs(s) ** e * w }
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
  // a squared section needs more points round it to keep its corners
  const radial = detail.bill.section ? SQUARE_RADIAL : RADIAL
  for (const sigma of sigmas) {
    const { p, tangent } = billCenter(detail, profile, sigma)
    const normal = new THREE.Vector2(-tangent.y, tangent.x)
    const f = billScale(detail.bill, sigma)
    const d = (billDepth / 2) * f.depth, w = (billWidth / 2) * f.width
    const row: number[] = []
    for (let j = 0; j < radial; j++) {
      const th = (j / radial) * Math.PI * 2
      const { n, z } = billOffset(th, d, w, detail.bill.section)
      row.push(m.vertex(new THREE.Vector3(p.x + normal.x * n, p.y + normal.y * n, z), 'bill', Math.max(0, sigma), ringT(th), [['bill', 1]]))
    }
    rings.push(row)
  }
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < radial; j++) {
      const j1 = (j + 1) % radial
      m.quad(rings[i]![j]!, rings[i]![j1]!, rings[i + 1]![j1]!, rings[i + 1]![j]!)
    }
  }
  const root = billCenter(detail, profile, -ROOT).p
  const tip2 = billCenter(detail, profile, 1).p
  const rootV = m.vertex(new THREE.Vector3(root.x, root.y, 0), 'bill', 0, 0.5, [['bill', 1]])
  const tipV = m.vertex(new THREE.Vector3(tip2.x, tip2.y, 0), 'bill', 1, 0.5, [['bill', 1]])
  for (let j = 0; j < radial; j++) {
    const j1 = (j + 1) % radial
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

/** points round each mandible's outer arc, and across the flat of its cutting edge between them */
const MANDIBLE_ARC = 7
const MANDIBLE_FLAT = 4

/**
 * A bill that opens (detail.display's gape): the same cone as buildBill's, split along the cutting edges (the sides of
 * its section, at its middle's height) into two closed mandibles, the upper on the bill bone and the lower on the jaw,
 * which turns about the bill's base. Each mandible's outer arc is painted as the bill (t 0 to 0.5 the upper, 0.5 to 1
 * the lower, as buildBill's ring has them) and its flat cutting face, the inside of the mouth when it opens, as
 * 'mouth'. Closed, the two flats lie on each other inside the bill, and the outside is buildBill's.
 */
export function buildSplitBill(m: Mesher, detail: DetailSpec, profile: Profile): BillResult {
  const indexFirst = m.indexCount
  const { billDepth, billWidth } = detail.measurements
  const sigmas = ringSigmas(detail.bill)
  const sample = (sigma: number) => {
    const { p, tangent } = billCenter(detail, profile, sigma)
    const normal = new THREE.Vector2(-tangent.y, tangent.x)
    const f = billScale(detail.bill, sigma)
    return { p, normal, d: (billDepth / 2) * f.depth, w: (billWidth / 2) * f.width }
  }
  const at = (q: ReturnType<typeof sample>, n: number, z: number) => new THREE.Vector3(q.p.x + q.normal.x * n, q.p.y + q.normal.y * n, z)
  let baseRing: THREE.Vector3[] = []
  const i0 = sigmas.reduce((best, s, i) => (Math.abs(s) < Math.abs(sigmas[best]!) ? i : best), 0)
  for (const lower of [false, true]) {
    const bone = lower ? 'jaw' : 'bill'
    // the arc from one cutting edge round to the other: the upper's over the culmen, the lower's under the gonys
    const arcTh = (j: number) => (lower ? Math.PI / 2 : -Math.PI / 2) + (Math.PI * j) / (MANDIBLE_ARC - 1)
    const arcs: number[][] = [], flats: number[][] = []
    sigmas.forEach((sigma, i) => {
      const q = sample(sigma)
      const arc: number[] = [], flat: number[] = []
      for (let j = 0; j < MANDIBLE_ARC; j++) {
        const th = arcTh(j)
        const { n, z } = billOffset(th, q.d, q.w, detail.bill.section)
        const p = at(q, Math.abs(n) < 1e-12 ? 0 : n, z)
        arc.push(m.vertex(p, 'bill', Math.max(0, sigma), ringT((th + 2 * Math.PI) % (2 * Math.PI)), [[bone, 1]]))
        if (i === i0) baseRing.push(p)
      }
      // the flat runs back across from the arc's end to its start, on the cutting edges' plane
      const zEnd = billOffset(arcTh(MANDIBLE_ARC - 1), q.d, q.w, detail.bill.section).z
      const zStart = billOffset(arcTh(0), q.d, q.w, detail.bill.section).z
      for (let k = 0; k < MANDIBLE_FLAT; k++) {
        const z = zEnd + ((zStart - zEnd) * k) / (MANDIBLE_FLAT - 1)
        flat.push(m.vertex(at(q, 0, z), 'mouth', Math.max(0, sigma), k / (MANDIBLE_FLAT - 1), [[bone, 1]]))
      }
      arcs.push(arc); flats.push(flat)
    })
    // every face out from the mandible's own middle line
    const centreAt = (i: number) => { const q = sample(sigmas[i]!); return at(q, lower ? -q.d / 3 : q.d / 3, 0) }
    const face = (a: number, b: number, c: number, d: number, i: number) => {
      const pa = m.position(a), n = m.position(b).sub(pa).cross(m.position(d).sub(pa))
      const c0 = pa.clone().add(m.position(c)).multiplyScalar(0.5).sub(centreAt(i))
      if (n.dot(c0) >= 0) m.quad(a, b, c, d)
      else m.quad(a, d, c, b)
    }
    for (let i = 0; i < sigmas.length - 1; i++) {
      for (let j = 0; j < MANDIBLE_ARC - 1; j++) face(arcs[i]![j]!, arcs[i + 1]![j]!, arcs[i + 1]![j + 1]!, arcs[i]![j + 1]!, i)
      for (let k = 0; k < MANDIBLE_FLAT - 1; k++) face(flats[i]![k]!, flats[i + 1]![k]!, flats[i + 1]![k + 1]!, flats[i]![k + 1]!, i)
    }
    // caps: the root inside the head and the tip, a fan to a point on the cutting edges' plane, round arc and flat
    const root = billCenter(detail, profile, -ROOT).p, tip = billCenter(detail, profile, 1).p
    for (const [ring, flatRing, point, s, out] of [
      [arcs[0]!, flats[0]!, root, 0, -1], [arcs[arcs.length - 1]!, flats[flats.length - 1]!, tip, 1, 1],
    ] as const) {
      const c = m.vertex(new THREE.Vector3(point.x, point.y, 0), 'bill', s, lower ? 0.75 : 0.25, [[bone, 1]])
      const loop = [...ring, ...flatRing.slice(1, -1)]
      const along = billCenter(detail, profile, s === 0 ? -ROOT : 1).tangent
      const want = new THREE.Vector3(along.x, along.y, 0).multiplyScalar(out)
      for (let j = 0; j < loop.length; j++) {
        const a = loop[j]!, b = loop[(j + 1) % loop.length]!
        const n = m.position(a).sub(m.position(c)).cross(m.position(b).sub(m.position(c)))
        if (n.dot(want) >= 0) m.tri(c, a, b)
        else m.tri(c, b, a)
      }
    }
  }
  const end = profile.sampleAt(1)
  const tip2 = billCenter(detail, profile, 1).p
  // the base ring round the whole bill, in buildBill's order from the culmen: the upper's arc from its middle on, the
  // lower's, then the upper's first half
  const half = Math.floor(MANDIBLE_ARC / 2)
  const upper = baseRing.slice(0, MANDIBLE_ARC), lowerRing = baseRing.slice(MANDIBLE_ARC)
  baseRing = [...upper.slice(half), ...lowerRing.slice(1, -1), ...upper.slice(0, half)]
  return {
    baseRing,
    base: new THREE.Vector3(end.point.x, end.point.y, 0),
    tip: new THREE.Vector3(tip2.x, tip2.y, 0),
    dir: new THREE.Vector3(end.tangent.x, end.tangent.y, 0),
    up: new THREE.Vector3(end.normal.x, end.normal.y, 0),
    indexFirst, indexCount: m.indexCount - indexFirst,
  }
}

/** How far below the bill's axis the pouch hangs at sigma, slack and full, metres: its outline, linear between points. */
export function pouchDepth(pouch: NonNullable<DetailSpec['bill']['pouch']>, sigma: number): { rest: number; full: number } {
  if (sigma <= pouch[0]![0]) return { rest: pouch[0]![1], full: pouch[0]![2] }
  for (let i = 1; i < pouch.length; i++) {
    const [s1, r1, f1] = pouch[i]!, [s0, r0, f0] = pouch[i - 1]!
    if (sigma <= s1) { const k = (sigma - s0) / (s1 - s0); return { rest: r0 + (r1 - r0) * k, full: f0 + (f1 - f0) * k } }
  }
  const last = pouch[pouch.length - 1]!
  return { rest: last[1], full: last[2] }
}

/** The pouch's paint frame: its length along the bill, and the length of its hang across at s (0..1 along it), slack, mm. */
export function pouchFrame(detail: DetailSpec): { lengthMm: number; widthMm: (s: number) => number } {
  const pouch = detail.bill.pouch!
  const s0 = pouch[0]![0], s1 = pouch[pouch.length - 1]![0]
  const { culmen, billWidth } = detail.measurements
  return {
    lengthMm: (s1 - s0) * culmen * 1000,
    widthMm: s => {
      const sigma = s0 + s * (s1 - s0)
      const w = (billWidth / 2) * billScale(detail.bill, sigma).width * POUCH_WIDTH
      // half an ellipse's rim, across the bill and down to the pouch's depth
      return Math.max(1, Math.PI * Math.sqrt((w * w + pouchDepth(pouch, sigma).rest ** 2) / 2) * 1000)
    },
  }
}

export interface PouchResult {
  /** its vertices, in the geometry */
  first: number
  count: number
  indexFirst: number
  indexCount: number
}

/**
 * A pouch under the bill (`bill.pouch`): a closed keel hanging from inside the bill's sides, from the throat to near
 * the tip, as deep at each point as its slack outline says. Its full outline is the geometry's morph target, so
 * PoseState.pouch fills it without a bone. On the bill bone, painted as 'pouch': s runs along it, t across its hang.
 */
export function buildPouch(m: Mesher, detail: DetailSpec, profile: Profile): PouchResult | null {
  const pouch = detail.bill.pouch
  if (!pouch) return null
  const first = m.count, indexFirst = m.indexCount
  const s0 = pouch[0]![0], s1 = pouch[pouch.length - 1]![0]
  const even = Array.from({ length: POUCH_S }, (_, i) => s0 + ((s1 - s0) * i) / (POUCH_S - 1))
  const all = [...even, ...pouch.map(([s]) => s)].sort((a, b) => a - b)
  const sigmas = all.filter((s, i) => i === 0 || s - all[i - 1]! > 1e-6)
  const rings: number[][] = []
  const centres: THREE.Vector3[] = []
  for (const sigma of sigmas) {
    const { p, tangent } = billCenter(detail, profile, sigma)
    const normal = new THREE.Vector2(-tangent.y, tangent.x)
    const w = (detail.measurements.billWidth / 2) * billScale(detail.bill, sigma).width * POUCH_WIDTH
    const { rest, full } = pouchDepth(pouch, sigma)
    const row: number[] = []
    for (let j = 0; j < POUCH_T; j++) {
      const th = (j / (POUCH_T - 1)) * Math.PI
      const z = Math.cos(th) * w, hang = Math.sin(th)
      const at = (depth: number) => new THREE.Vector3(p.x - normal.x * hang * depth, p.y - normal.y * hang * depth, z)
      const v = m.vertex(at(rest), 'pouch', (sigma - s0) / (s1 - s0), j / (POUCH_T - 1), [['bill', 1]])
      m.morph(v, at(full))
      row.push(v)
    }
    rings.push(row)
    centres.push(new THREE.Vector3(p.x, p.y, 0))
  }
  for (let i = 0; i < rings.length - 1; i++) {
    const a = rings[i]!, b = rings[i + 1]!
    for (let j = 0; j < POUCH_T - 1; j++) m.quad(a[j]!, a[j + 1]!, b[j + 1]!, b[j]!)
    // the top, inside the bill
    m.quad(a[POUCH_T - 1]!, a[0]!, b[0]!, b[POUCH_T - 1]!)
  }
  const back = m.vertex(centres[0]!, 'pouch', 0, 0.5, [['bill', 1]])
  const front = m.vertex(centres[centres.length - 1]!, 'pouch', 1, 0.5, [['bill', 1]])
  for (let j = 0; j < POUCH_T - 1; j++) {
    m.tri(back, rings[0]![j]!, rings[0]![j + 1]!)
    m.tri(front, rings[rings.length - 1]![j + 1]!, rings[rings.length - 1]![j]!)
  }
  return { first, count: m.count - first, indexFirst, indexCount: m.indexCount - indexFirst }
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
