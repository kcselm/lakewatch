import * as THREE from 'three'
import type { Station } from './spec'

/** Cross-sections are superellipses: 2 is an ellipse, higher is boxier. */
export const SQUARENESS = 2.2

export interface ProfileSample {
  /** spine point in the side view */
  point: THREE.Vector2
  /** unit tangent, pointing toward the bill end */
  tangent: THREE.Vector2
  /** unit normal: the tangent turned 90 degrees counter-clockwise, so "up" for a level spine and "back" for a rising neck */
  normal: THREE.Vector2
  /**
   * The direction the cross-section's upper side points: the normal, turned back by the stations' tilt (interpolated
   * along the spine) so the lower side swings forward. The same as the normal where nothing is tilted.
   */
  axis: THREE.Vector2
  up: number
  down: number
  halfWidth: number
}

export interface Profile {
  /** spine arclength, metres */
  readonly length: number
  /** u is the arclength fraction: 0 at the first (tail) station, 1 at the last (bill base) */
  sampleAt(u: number): ProfileSample
  /** u of a labelled station; throws on an unknown label */
  uOf(label: string): number
  /** the cross-section's perimeter from back midline to belly midline (one side), metres */
  halfPerimeter(u: number): number
}

/**
 * Offset of a cross-section point from the spine, for angle theta: 0 is the back midline, pi/2 the right side (+z),
 * pi the belly midline, 3pi/2 the left side. n is along the profile normal, z across the body.
 */
export function sectionOffset(theta: number, up: number, down: number, halfWidth: number): { n: number; z: number } {
  const e = 2 / SQUARENESS
  const c = Math.cos(theta), s = Math.sin(theta)
  const n = Math.sign(c) * Math.abs(c) ** e * (c >= 0 ? up : down)
  const z = Math.sign(s) * Math.abs(s) ** e * halfWidth
  return { n, z }
}

/** Uniform Catmull-Rom on scalars, with the same end extrapolation THREE.CatmullRomCurve3 uses. */
function scalarAt(values: number[], t: number): number {
  const l = values.length
  const p = (l - 1) * t
  let i = Math.floor(p)
  let w = p - i
  if (w === 0 && i === l - 1) { i = l - 2; w = 1 }
  const v1 = values[i]!, v2 = values[i + 1]!
  const v0 = i > 0 ? values[i - 1]! : 2 * v1 - v2
  const v3 = i + 2 < l ? values[i + 2]! : 2 * v2 - v1
  const w2 = w * w, w3 = w2 * w
  return 0.5 * (2 * v1 + (-v0 + v2) * w + (2 * v0 - 5 * v1 + 4 * v2 - v3) * w2 + (-v0 + 3 * v1 - 3 * v2 + v3) * w3)
}

const DIVISIONS = 400

export function createProfile(stations: readonly Station[]): Profile {
  if (stations.length < 4) throw new Error('a profile needs at least 4 stations')
  const curve = new THREE.CatmullRomCurve3(stations.map(s => new THREE.Vector3(s.x, s.y, 0)), false, 'centripetal')
  curve.arcLengthDivisions = DIVISIONS
  const lengths = curve.getLengths(DIVISIONS)
  const length = lengths[DIVISIONS]!
  const ups = stations.map(s => s.up), downs = stations.map(s => s.down), widths = stations.map(s => s.halfWidth)
  const tilts = stations.map(s => THREE.MathUtils.degToRad(s.tilt ?? 0))
  const tilted = tilts.some(a => a !== 0)
  const floor = Math.min(...ups, ...downs, ...widths) * 0.5

  const uAtT = (t: number): number => {
    const p = t * DIVISIONS
    const i = Math.min(Math.floor(p), DIVISIONS - 1)
    const w = p - i
    return (lengths[i]! * (1 - w) + lengths[i + 1]! * w) / length
  }
  const labels = new Map<string, number>()
  stations.forEach((s, i) => { if (s.label) labels.set(s.label, uAtT(i / (stations.length - 1))) })

  const p3 = new THREE.Vector3()
  function sampleAt(u: number): ProfileSample {
    // distance 0 is falsy, so three maps by the fraction u (the typings insist on a number)
    const t = curve.getUtoTmapping(THREE.MathUtils.clamp(u, 0, 1), 0)
    curve.getPoint(t, p3)
    const point = new THREE.Vector2(p3.x, p3.y)
    curve.getTangent(t, p3)
    const tangent = new THREE.Vector2(p3.x, p3.y).normalize()
    const normal = new THREE.Vector2(-tangent.y, tangent.x)
    const a = tilted ? scalarAt(tilts, t) : 0
    const axis = a === 0 ? normal.clone() : normal.clone().multiplyScalar(Math.cos(a)).addScaledVector(tangent, -Math.sin(a))
    return {
      point, tangent, normal, axis,
      up: Math.max(floor, scalarAt(ups, t)),
      down: Math.max(floor, scalarAt(downs, t)),
      halfWidth: Math.max(floor, scalarAt(widths, t)),
    }
  }

  return {
    length,
    sampleAt,
    uOf(label) {
      const u = labels.get(label)
      if (u === undefined) throw new Error(`unknown station label "${label}"`)
      return u
    },
    halfPerimeter(u) {
      const { up, down, halfWidth } = sampleAt(u)
      let sum = 0
      let prev = sectionOffset(0, up, down, halfWidth)
      for (let k = 1; k <= 24; k++) {
        const o = sectionOffset((k / 24) * Math.PI, up, down, halfWidth)
        sum += Math.hypot(o.n - prev.n, o.z - prev.z)
        prev = o
      }
      return sum
    },
  }
}
