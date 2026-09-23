import type { Vec2 } from './schema'
import type { Rng } from '../catalog/types'

/** Ray-casting test. Points exactly on an edge may go either way; zones are padded so that never matters. */
export function pointInPolygon(x: number, z: number, points: readonly Vec2[]): boolean {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, zi] = points[i]!
    const [xj, zj] = points[j]!
    const crosses = zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi
    if (crosses) inside = !inside
  }
  return inside
}

function bounds(points: readonly Vec2[]): [number, number, number, number] {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const [x, z] of points) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z)
  }
  return [x0, x1, z0, z1]
}

/** Rejection sampling in the bounding box. Zones are validated convex at load time, so the centroid fallback always lies inside. */
export function randomPointInPolygon(points: readonly Vec2[], rng: Rng): Vec2 {
  const [x0, x1, z0, z1] = bounds(points)
  for (let i = 0; i < 1000; i++) {
    const x = x0 + rng() * (x1 - x0)
    const z = z0 + rng() * (z1 - z0)
    if (pointInPolygon(x, z, points)) return [x, z]
  }
  return polygonCentroid(points)
}

export function polygonCentroid(points: readonly Vec2[]): Vec2 {
  let sx = 0, sz = 0
  for (const [x, z] of points) { sx += x; sz += z }
  return [sx / points.length, sz / points.length]
}

/** Walk from the point toward the centroid until inside. Zones are validated convex at load time, so the centroid fallback always lies inside. */
export function clampToPolygon(x: number, z: number, points: readonly Vec2[]): Vec2 {
  if (pointInPolygon(x, z, points)) return [x, z]
  const [cx, cz] = polygonCentroid(points)
  for (let t = 0.05; t <= 1; t += 0.05) {
    const px = x + (cx - x) * t, pz = z + (cz - z) * t
    if (pointInPolygon(px, pz, points)) return [px, pz]
  }
  return [cx, cz]
}

/** True when every turn around the polygon has the same sign (no reflex vertices). Collinear runs are allowed. */
export function isConvexPolygon(points: readonly Vec2[]): boolean {
  const n = points.length
  if (n < 3) return false
  let sign = 0
  for (let i = 0; i < n; i++) {
    const [ax, az] = points[i]!
    const [bx, bz] = points[(i + 1) % n]!
    const [cx, cz] = points[(i + 2) % n]!
    const cross = (bx - ax) * (cz - bz) - (bz - az) * (cx - bx)
    if (cross === 0) continue
    const s = cross > 0 ? 1 : -1
    if (sign === 0) sign = s
    else if (s !== sign) return false
  }
  return true
}
