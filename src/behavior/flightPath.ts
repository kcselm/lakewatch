/**
 * Flight paths of bounded turn: the shortest ways (Dubins paths) from one place and heading to another with no turn
 * tighter than a given radius, each two arcs joined by a straight or by a third arc. The heading never jumps along
 * one, and a bird flying one at speed v turns no faster than v / radius.
 *
 * Headings are a controller's: 0 toward +x, counter-clockwise seen from above, so a heading h moves along
 * (cos h, -sin h) in x and z. The paths are worked in (x, -z), where that is the usual counter-clockwise angle.
 */

export interface Pose2 { x: number; z: number; heading: number }

type Turn = 'L' | 'S' | 'R'
export interface Segment { readonly kind: Turn; readonly length: number }

export interface DubinsPath {
  readonly start: Pose2
  readonly radius: number
  readonly segments: readonly Segment[]
  /** metres along the ground */
  readonly length: number
}

const TWO_PI = Math.PI * 2
const mod = (a: number) => ((a % TWO_PI) + TWO_PI) % TWO_PI

/** The three turns (in radians, or the straight's length over the radius) of each word that joins, or null. */
function words(alpha: number, beta: number, d: number): [Turn[], number, number, number][] {
  const sa = Math.sin(alpha), sb = Math.sin(beta), ca = Math.cos(alpha), cb = Math.cos(beta), cab = Math.cos(alpha - beta)
  const out: [Turn[], number, number, number][] = []
  let p2 = 2 + d * d - 2 * cab + 2 * d * (sa - sb)
  if (p2 >= 0) {
    const t1 = Math.atan2(cb - ca, d + sa - sb)
    out.push([['L', 'S', 'L'], mod(t1 - alpha), Math.sqrt(p2), mod(beta - t1)])
  }
  p2 = 2 + d * d - 2 * cab + 2 * d * (sb - sa)
  if (p2 >= 0) {
    const t1 = Math.atan2(ca - cb, d - sa + sb)
    out.push([['R', 'S', 'R'], mod(alpha - t1), Math.sqrt(p2), mod(t1 - beta)])
  }
  p2 = -2 + d * d + 2 * cab + 2 * d * (sa + sb)
  if (p2 >= 0) {
    const p = Math.sqrt(p2)
    const t0 = Math.atan2(-ca - cb, d + sa + sb) - Math.atan2(-2, p)
    out.push([['L', 'S', 'R'], mod(t0 - alpha), p, mod(t0 - mod(beta))])
  }
  p2 = -2 + d * d + 2 * cab - 2 * d * (sa + sb)
  if (p2 >= 0) {
    const p = Math.sqrt(p2)
    const t0 = Math.atan2(ca + cb, d - sa - sb) - Math.atan2(2, p)
    out.push([['R', 'S', 'L'], mod(alpha - t0), p, mod(beta - t0)])
  }
  let c = (6 - d * d + 2 * cab + 2 * d * (sa - sb)) / 8
  if (Math.abs(c) <= 1) {
    const phi = Math.atan2(ca - cb, d - sa + sb)
    const p = mod(TWO_PI - Math.acos(c))
    const t = mod(alpha - phi + mod(p / 2))
    out.push([['R', 'L', 'R'], t, p, mod(alpha - beta - t + mod(p))])
  }
  c = (6 - d * d + 2 * cab + 2 * d * (sb - sa)) / 8
  if (Math.abs(c) <= 1) {
    const phi = Math.atan2(ca - cb, d + sa - sb)
    const p = mod(TWO_PI - Math.acos(c))
    const t = mod(-alpha - phi + p / 2)
    out.push([['L', 'R', 'L'], t, p, mod(mod(beta) - alpha - t + mod(p))])
  }
  return out
}

/** Where a path is `s` metres along, the way it faces, and its curvature there (1 / radius, positive turning left). */
export function pointAt(path: DubinsPath, s: number): Pose2 & { curvature: number } {
  const r = path.radius
  let X = path.start.x, Y = -path.start.z, th = path.start.heading
  let left = Math.min(Math.max(s, 0), path.length)
  let curvature = 0
  for (const seg of path.segments) {
    const l = Math.min(left, seg.length)
    if (seg.kind === 'S') {
      X += l * Math.cos(th); Y += l * Math.sin(th)
      curvature = 0
    } else {
      const k = seg.kind === 'L' ? 1 : -1
      const th1 = th + (k * l) / r
      X += k * r * (Math.sin(th1) - Math.sin(th))
      Y -= k * r * (Math.cos(th1) - Math.cos(th))
      th = th1
      curvature = k / r
    }
    left -= l
    if (left <= 0) break
  }
  return { x: X, z: -Y, heading: th, curvature }
}

/**
 * Every Dubins path from `a` to `b` turning no tighter than `radius`, shortest first. Each is checked to end where and
 * as it should (a word the formulas give for a case they don't fit is dropped).
 */
export function dubinsPaths(a: Pose2, b: Pose2, radius: number): DubinsPath[] {
  const dX = b.x - a.x, dY = -(b.z - a.z)
  const theta = mod(Math.atan2(dY, dX))
  const d = Math.hypot(dX, dY) / radius
  const alpha = mod(a.heading - theta), beta = mod(b.heading - theta)
  const out: DubinsPath[] = []
  for (const [kinds, t, p, q] of words(alpha, beta, d)) {
    const segments = kinds.map((kind, i) => ({ kind, length: [t, p, q][i]! * radius })).filter(s => s.length > 1e-9)
    const path: DubinsPath = { start: a, radius, segments, length: segments.reduce((n, s) => n + s.length, 0) }
    const end = pointAt(path, path.length)
    const dh = Math.atan2(Math.sin(end.heading - b.heading), Math.cos(end.heading - b.heading))
    if (Math.hypot(end.x - b.x, end.z - b.z) < 1e-6 * Math.max(1, radius) && Math.abs(dh) < 1e-6) out.push(path)
  }
  return out.sort((p, q) => p.length - q.length)
}
