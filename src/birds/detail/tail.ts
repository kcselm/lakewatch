import * as THREE from 'three'
import type { Profile } from './profile'
import type { DetailSpec } from './spec'
import type { Mesher } from './mesher'

const TAIL_S = 6
const TAIL_T = 7
/** tail width at the root, as a fraction of the body's full width at the tail base */
export const ROOT_WIDTH = 0.55
/** tail width at the tip, as a multiple of the root width */
export const TIP_SPREAD = 1.3

/** Extra length at the tip for t across the tail (0 = left edge, 1 = right edge), as a fraction of the tail length. */
export function tipShape(shape: DetailSpec['tail']['shape'], t: number): number {
  const c = 2 * t - 1
  switch (shape) {
    case 'rounded': return 0.08 * (1 - c * c)
    case 'wedge': return 0.15 * (1 - Math.abs(c))
    case 'notched': return -0.08 * (1 - c * c)
    default: return 0
  }
}

export interface TailResult {
  /** profile frame */
  root: THREE.Vector3
  /** middle of the tip edge */
  tip: THREE.Vector3
  width: number
}

/**
 * The tail: a thin, slightly cupped fan rooted at the tailBase station, measurements.tail long to its longest
 * feather (the middle of a rounded or wedge tail, the outer ones of a square or notched one), pointing
 * straight back along the spine, lifted by `angle` degrees. Upper face 'tail', under face 'tailUnder'.
 */
export function buildTail(m: Mesher, detail: DetailSpec, profile: Profile): TailResult {
  const base = profile.sampleAt(profile.uOf(detail.rig.tailBase))
  const L = detail.measurements.tail
  const a = THREE.MathUtils.degToRad(detail.tail.angle ?? 0)
  const back = new THREE.Vector2(-base.tangent.x, -base.tangent.y)
  back.set(back.x * Math.cos(a) + back.y * Math.sin(a), -back.x * Math.sin(a) + back.y * Math.cos(a))
  const up = new THREE.Vector2(back.y, -back.x)
  const rootW = base.halfWidth * 2 * ROOT_WIDTH
  // a tail is measured to its longest feather, so a rounded or wedge tail's middle is measurements.tail long
  const longest = 1 + Math.max(0, tipShape(detail.tail.shape, 0.5))
  const point = (s: number, t: number, lift: number) => {
    const w = rootW * (1 + (TIP_SPREAD - 1) * s)
    const along = (s * L * (1 + tipShape(detail.tail.shape, t))) / longest
    const cup = -0.12 * w * (2 * t - 1) ** 2 + lift
    return new THREE.Vector3(
      base.point.x + back.x * along + up.x * cup,
      base.point.y + back.y * along + up.y * cup,
      (t - 0.5) * w,
    )
  }
  for (const face of ['tail', 'tailUnder'] as const) {
    const grid: number[][] = []
    for (let i = 0; i < TAIL_S; i++) {
      const row: number[] = []
      for (let j = 0; j < TAIL_T; j++) {
        const s = i / (TAIL_S - 1), t = j / (TAIL_T - 1)
        row.push(m.vertex(point(s, t, face === 'tail' ? 0.0003 : -0.0003), face, s, t, [['tail', 1]]))
      }
      grid.push(row)
    }
    // s runs back, t runs toward +z: (i,j) (i+1,j) (i+1,j+1) (i,j+1) faces up
    for (let i = 0; i < TAIL_S - 1; i++) {
      for (let j = 0; j < TAIL_T - 1; j++) {
        const a_ = grid[i]![j]!, b = grid[i + 1]![j]!, c = grid[i + 1]![j + 1]!, d = grid[i]![j + 1]!
        if (face === 'tail') m.quad(a_, b, c, d)
        else m.quad(a_, d, c, b)
      }
    }
  }
  return { root: point(0, 0.5, 0), tip: point(1, 0.5, 0), width: rootW }
}
