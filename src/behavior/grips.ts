import * as THREE from 'three'
import type { StemHold } from '../birds/model'

/**
 * How a red-winged blackbird holds stems (docs/research/2026-10-13-blackbird-display-and-reeds.md, section 6; by eye
 * on its photos, sizes estimates), as plain numbers for the bird's own frame (+x ahead, +y up, +z its right; the
 * origin its feet at rest), for a male; a smaller bird's are scaled by its size.
 * - `stalk`: both feet clasping one upright cattail stalk, one 1-3 cm above the other; the body 50-70 degrees from
 *   level, the tail hanging beside the stem.
 * - `top`: the feet clasping the bare axis just above a cattail's spike; the body 45-60 degrees.
 * - `tule`: as a stalk, on a tule culm held low (0.6-1.2 m, where it carries a blackbird).
 * - `straddle`: a foot on each of two stems 40-110 mm apart, the legs splayed, the body rolled toward the lower foot.
 */
export type GripKind = 'stalk' | 'top' | 'tule' | 'straddle'

export interface GripShape {
  /** the body's pitch from its traced rest (36.6 degrees, bill tip to tail tip), radians, negative nose up */
  lean: number
  /** where the stem's axis passes, ahead of the feet's rest point, metres */
  ahead: number
  /** how far apart along the stem the feet hold it, metres (the upper the right foot) */
  apart: number
}

export const GRIPS: Record<GripKind, GripShape> = {
  // the body 59 degrees from level, the stem 8 mm ahead of the feet's rest point so the breast sits 2-4 cm off it
  stalk: { lean: -0.39, ahead: 0.008, apart: 0.02 },
  // the body 50 degrees from level, on the bare axis 1.5 cm apart
  top: { lean: -0.23, ahead: 0.006, apart: 0.014 },
  tule: { lean: -0.36, ahead: 0.009, apart: 0.022 },
  // the body 45 degrees from level between its two stems
  straddle: { lean: -0.15, ahead: 0, apart: 0 },
}

/** How far the body rolls toward the lower foot of a straddle, as a share of the slope between the feet (by eye: half) */
export const STRADDLE_ROLL = 0.5
/**
 * How far below its holds a straddling bird sits, metres (a male's): its body sinks between the stems, so its legs,
 * reaching out to the sides, can take stems up to 110 mm apart (by eye: "one leg may stand out nearly horizontal")
 */
export const STRADDLE_DROP = 0.02

/**
 * Turns a world point or direction into the bird's frame: the bird at `position`, facing `heading` (radians, the
 * controllers' convention: 0 = +x, counter-clockwise seen from above, the group's rotation.y).
 */
export function toBird(world: THREE.Vector3, position: THREE.Vector3 | null, heading: number, out = new THREE.Vector3()): THREE.Vector3 {
  out.copy(world)
  if (position) out.sub(position)
  return out.applyAxisAngle(Y, -heading)
}
const Y = new THREE.Vector3(0, 1, 0)

/** A hold on a stem in the bird's frame, from the stem's axis point and direction in the world. */
export function holdOn(at: THREE.Vector3, axis: THREE.Vector3, radius: number, position: THREE.Vector3, heading: number, out?: StemHold): StemHold {
  const h = out ?? { at: new THREE.Vector3(), axis: new THREE.Vector3(), radius }
  toBird(at, position, heading, h.at)
  toBird(axis, null, heading, h.axis).normalize()
  h.radius = radius
  return h
}

/**
 * Where the bird stands for a one-stem grip: its feet's rest point `ahead` metres behind the stem's axis point at the
 * feet's middle height, facing `heading`.
 */
export function gripPosition(mid: THREE.Vector3, heading: number, ahead: number, out = new THREE.Vector3()): THREE.Vector3 {
  const x = mid.x, y = mid.y, z = mid.z
  return out.set(-ahead, 0, 0).applyAxisAngle(Y, heading).add(TMP.set(x, y, z))
}
const TMP = new THREE.Vector3()

/** Where the bird stands to straddle two stems: between its two holds, STRADDLE_DROP (times its size) below them. */
export function straddlePosition(a: THREE.Vector3, b: THREE.Vector3, size = 1, out = new THREE.Vector3()): THREE.Vector3 {
  return out.copy(a).add(b).multiplyScalar(0.5).add(new THREE.Vector3(0, -STRADDLE_DROP * size, 0))
}
