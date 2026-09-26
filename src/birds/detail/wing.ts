import * as THREE from 'three'
import { SQUARENESS, type Profile, type ProfileSample } from './profile'
import type { DetailSpec } from './spec'
import type { Mesher } from './mesher'

const FOLD_S = 14
const FOLD_T = 5
const SPREAD_S = 10
const SPREAD_T = 4
/** gap between the folded wing and the flank, metres */
const GAP = 0.001
/** half the spacing between the two folded wings where they cross over the rump and tail, metres */
const MIN_Z = 0.003
/** the spread wing reaches this multiple of the wing chord out from the shoulder */
export const SPAN = 1.78
/** chord of the spread wing at its root, as a multiple of the wing chord */
export const ROOT_CHORD = 0.42

/** Folded-wing height (fraction of chord) at s, interpolated linearly through the outline. */
export function outlineAt(outline: readonly (readonly [number, number])[], s: number): number {
  if (s <= outline[0]![0]) return outline[0]![1]
  for (let i = 1; i < outline.length; i++) {
    const [s1, h1] = outline[i]!, [s0, h0] = outline[i - 1]!
    if (s <= s1) return h0 + ((h1 - h0) * (s - s0)) / (s1 - s0 || 1)
  }
  return outline[outline.length - 1]![1]
}

const tables = new WeakMap<Profile, ProfileSample[]>()

/** Spine samples over the body and lower neck (the wing never reaches the head), nearest in x to `x`. */
function nearestBodySample(profile: Profile, x: number): ProfileSample {
  let table = tables.get(profile)
  if (!table) {
    table = Array.from({ length: 121 }, (_, k) => profile.sampleAt((k / 120) * 0.6))
    tables.set(profile, table)
  }
  let best = table[0]!, bestD = Infinity
  for (const s of table) {
    const d = Math.abs(s.point.x - x)
    if (d < bestD) { bestD = d; best = s }
  }
  return best
}

/** Half-width of the body surface at side-view point (x, y), from the loft; 0 outside the body. */
export function bodySurfaceZ(profile: Profile, x: number, y: number): number {
  const best = nearestBodySample(profile, x)
  if (x < profile.sampleAt(0).point.x) return 0
  const dy = y - best.point.y
  const r = Math.abs(dy) / (dy >= 0 ? best.up : best.down)
  if (r >= 1) return 0
  return best.halfWidth * (1 - r ** SQUARENESS) ** (1 / SQUARENESS)
}

export interface FoldResult {
  /** right wing, profile frame */
  wrist: THREE.Vector3
  tip: THREE.Vector3
  /** the folded wing's lowest point, profile frame y */
  low: number
}

/**
 * Folded wings: a shell hugging each flank, hanging from the chord line (wrist to tip). The chord is
 * measurements.wingChord long and droops `droop` degrees below straight back; `outline` sets its height.
 */
export function buildFoldedWings(m: Mesher, detail: DetailSpec, profile: Profile): FoldResult {
  const chord = detail.measurements.wingChord
  const droop = THREE.MathUtils.degToRad(detail.wing.droop)
  const dir = new THREE.Vector2(-Math.cos(droop), -Math.sin(droop))
  const down = new THREE.Vector2(-dir.y, dir.x)
  const [wx, wy] = detail.wing.wrist
  const point = (s: number, t: number): THREE.Vector3 => {
    const h = outlineAt(detail.wing.outline, s) * chord
    const x = wx + dir.x * s * chord + down.x * t * h
    const y = wy + dir.y * s * chord + down.y * t * h
    return new THREE.Vector3(x, y, Math.max(bodySurfaceZ(profile, x, y) + GAP, MIN_Z))
  }
  let low = Infinity
  for (const side of [1, -1] as const) {
    const bone = side > 0 ? 'wingFoldR' : 'wingFoldL'
    const grid: number[][] = []
    for (let i = 0; i < FOLD_S; i++) {
      const row: number[] = []
      for (let j = 0; j < FOLD_T; j++) {
        const s = i / (FOLD_S - 1), t = j / (FOLD_T - 1)
        const p = point(s, t)
        low = Math.min(low, p.y)
        p.z *= side
        row.push(m.vertex(p, 'wingFold', s, t, [[bone, 1]]))
      }
      grid.push(row)
    }
    // s runs back, t runs down: (i,j) (i+1,j) (i+1,j+1) (i,j+1) faces +z; mirror for the left wing
    for (let i = 0; i < FOLD_S - 1; i++) {
      for (let j = 0; j < FOLD_T - 1; j++) {
        const a = grid[i]![j]!, b = grid[i + 1]![j]!, c = grid[i + 1]![j + 1]!, d = grid[i]![j + 1]!
        if (side > 0) m.quad(a, b, c, d)
        else m.quad(a, d, c, b)
      }
    }
  }
  return { wrist: point(0, 0), tip: point(1, 0), low }
}

/** Right shoulder joint for the spread wing (profile frame): above the flank, just behind the wrist. */
export function shoulderAt(detail: DetailSpec, profile: Profile): THREE.Vector3 {
  const best = nearestBodySample(profile, detail.wing.wrist[0])
  return new THREE.Vector3(best.point.x, best.point.y + best.up * 0.5, best.halfWidth * 0.8)
}

/**
 * Spread wings, basic this round: a swept, pointed planform in the shoulder's horizontal plane reaching
 * SPAN x chord out along +-z, upper face on 'wingSpread' and under face on 'wingUnder'.
 */
export function buildSpreadWings(m: Mesher, detail: DetailSpec, shoulder: THREE.Vector3): void {
  const c = detail.measurements.wingChord
  const span = SPAN * c, root = ROOT_CHORD * c
  for (const side of [1, -1] as const) {
    const bone = side > 0 ? 'wingR' : 'wingL'
    for (const face of ['wingSpread', 'wingUnder'] as const) {
      const dy = face === 'wingSpread' ? 0.0003 : -0.0003
      const grid: number[][] = []
      for (let i = 0; i < SPREAD_S; i++) {
        const s = i / (SPREAD_S - 1)
        const chord = root * (1 - 0.85 * s ** 1.3)
        const le = 0.25 * root - 0.35 * root * s ** 1.5
        const row: number[] = []
        for (let j = 0; j < SPREAD_T; j++) {
          const t = j / (SPREAD_T - 1)
          const p = new THREE.Vector3(shoulder.x + le - chord * t, shoulder.y + dy, side * (shoulder.z + s * span))
          row.push(m.vertex(p, face, s, t, [[bone, 1]]))
        }
        grid.push(row)
      }
      // s runs out along +-z, t runs back: pick the winding that faces up for the upper face, down for the under
      const up = face === 'wingSpread'
      for (let i = 0; i < SPREAD_S - 1; i++) {
        for (let j = 0; j < SPREAD_T - 1; j++) {
          const a = grid[i]![j]!, b = grid[i]![j + 1]!, cc = grid[i + 1]![j + 1]!, d = grid[i + 1]![j]!
          if ((side > 0) === up) m.quad(a, b, cc, d)
          else m.quad(a, d, cc, b)
        }
      }
    }
  }
}
