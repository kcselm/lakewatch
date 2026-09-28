import * as THREE from 'three'
import type { DetailedBirdModel } from './build'
import { RINGS, RADIAL } from './loft'

/**
 * The loft's rings as the model's last pose() left them, group space: RINGS rows of RADIAL points, tail to bill base.
 * The loft is the first thing the builder meshes, so its rings are the geometry's first RINGS × RADIAL vertices.
 */
export function posedRings(m: DetailedBirdModel): THREE.Vector3[][] {
  if (m.anatomy.closed[0]?.name !== 'loft' || m.anatomy.closed[0].indexFirst !== 0) throw new Error('the loft is meshed first')
  m.group.updateMatrixWorld(true)
  return Array.from({ length: RINGS }, (_, i) =>
    Array.from({ length: RADIAL }, (_, j) => m.mesh.getVertexPosition(i * RADIAL + j, new THREE.Vector3())))
}

/** A ring's centre, and the normal of its best-fit plane (Newell's), turned to face along the spine toward the bill. */
function ringPlane(ring: THREE.Vector3[], toward: THREE.Vector3): { c: THREE.Vector3; n: THREE.Vector3 } {
  const c = new THREE.Vector3()
  for (const p of ring) c.add(p)
  c.divideScalar(ring.length)
  const n = new THREE.Vector3()
  ring.forEach((a, j) => {
    const b = ring[(j + 1) % ring.length]!
    n.x += (a.y - b.y) * (a.z + b.z); n.y += (a.z - b.z) * (a.x + b.x); n.z += (a.x - b.x) * (a.y + b.y)
  })
  n.normalize()
  if (n.dot(toward) < 0) n.negate()
  return { c, n }
}

/**
 * The furthest any posed ring from `fromU` on reaches back behind the plane of the ring before it, metres (0 when none
 * does): worstFold, on the skin as posed. A neck bent tighter than its girth allows creases here first.
 */
export function posedFold(m: DetailedBirdModel, fromU = 0): number {
  const rings = posedRings(m)
  let worst = 0
  for (let i = Math.max(1, Math.floor(fromU * (RINGS - 1))); i < RINGS - 1; i++) {
    const ahead = centre(rings[i + 1]!).sub(centre(rings[i - 1]!))
    const { n } = ringPlane(rings[i]!, ahead)
    for (let j = 0; j < RADIAL; j++) worst = Math.max(worst, -rings[i + 1]![j]!.clone().sub(rings[i]![j]!).dot(n))
  }
  return worst
}

function centre(ring: THREE.Vector3[]): THREE.Vector3 {
  const c = new THREE.Vector3()
  for (const p of ring) c.add(p)
  return c.divideScalar(ring.length)
}

/** where the ray from p along d crosses triangle (a, b, c), as a multiple of d; NaN if it misses or runs behind p */
function rayHit(p: THREE.Vector3, d: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): number {
  const e1 = b.clone().sub(a), e2 = c.clone().sub(a)
  const h = d.clone().cross(e2)
  const det = e1.dot(h)
  if (Math.abs(det) < 1e-18) return NaN
  const s = p.clone().sub(a)
  const u = s.dot(h) / det
  if (u < 0 || u > 1) return NaN
  const q = s.cross(e1)
  const v = d.dot(q) / det
  if (v < 0 || u + v > 1) return NaN
  const t = e2.dot(q) / det
  return t > 0 ? t : NaN
}

/** a direction no face of a bird's loft lies along */
const RAY = new THREE.Vector3(0.5773, 0.5812, 0.5735).normalize()

/**
 * How deep the posed loft's skin passes through itself, metres (0 when it doesn't), over the rings from `fromU` on:
 * each skin vertex is pushed `eps` out along its normal, and if that point lies inside the closed loft (an odd number
 * of crossings along a ray), the skin there has passed into another part of the body, as deep as the point lies from
 * the nearest face of the loft more than `skip` rings away. `ring` is the vertex's ring, `into` the ring it went into.
 * A neck folded into a hunch, or reaching down past the breast, shows here.
 */
export function passThrough(m: DetailedBirdModel, fromU = 0, eps = 0.0005, skip = 2): { depth: number; ring: number; into: number } {
  const loft = m.anatomy.closed.find(c => c.name === 'loft')!
  const index = m.mesh.geometry.getIndex()!.array
  m.group.updateMatrixWorld(true)
  const posed = new Map<number, THREE.Vector3>()
  const at = (i: number) => {
    let v = posed.get(i)
    if (!v) { v = m.mesh.getVertexPosition(i, new THREE.Vector3()); posed.set(i, v) }
    return v
  }
  const ringOf = (i: number) => (i < RINGS * RADIAL ? Math.floor(i / RADIAL) : i === RINGS * RADIAL ? 0 : RINGS - 1)
  const tris: { a: THREE.Vector3; b: THREE.Vector3; c: THREE.Vector3; ring: number }[] = []
  const normal = new Map<number, THREE.Vector3>()
  for (let f = loft.indexFirst; f < loft.indexFirst + loft.indexCount; f += 3) {
    const ia = index[f]!, ib = index[f + 1]!, ic = index[f + 2]!
    const a = at(ia), b = at(ib), c = at(ic)
    tris.push({ a, b, c, ring: Math.min(ringOf(ia), ringOf(ib), ringOf(ic)) })
    const n = b.clone().sub(a).cross(c.clone().sub(a))
    for (const i of [ia, ib, ic]) normal.set(i, (normal.get(i) ?? new THREE.Vector3()).add(n))
  }
  let worst = { depth: 0, ring: -1, into: -1 }
  for (let i = Math.floor(fromU * (RINGS - 1)) * RADIAL; i < RINGS * RADIAL; i++) {
    const n = normal.get(i)
    if (!n || n.lengthSq() === 0) continue
    const p = at(i).clone().addScaledVector(n.clone().normalize(), eps)
    let crossings = 0
    for (const t of tris) if (!Number.isNaN(rayHit(p, RAY, t.a, t.b, t.c))) crossings++
    if (crossings % 2 === 0) continue
    const ring = ringOf(i)
    let depth = Infinity, into = -1
    for (const t of tris) {
      if (Math.abs(t.ring - ring) <= skip) continue
      const d = new THREE.Triangle(t.a, t.b, t.c).closestPointToPoint(p, new THREE.Vector3()).distanceTo(p)
      if (d < depth) { depth = d; into = t.ring }
    }
    if (depth !== Infinity && depth > worst.depth) worst = { depth, ring, into }
  }
  return worst
}
