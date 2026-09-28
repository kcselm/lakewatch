import type { V2 } from './gait'

/** the most the neck swings down to reach, radians */
export const MAX_NECK_SWING = 1.8

/** The neck at the moment of reaching, in group space: two segments from `base`, and what hangs off the end. */
export interface Neck {
  base: V2
  /** neck base to mid-neck, and mid-neck to the head joint: lengths and angles (radians, from +x) */
  l1: number; a1: number
  l2: number; a2: number
  /** head joint to bill tip, and that line's angle with the head tipped as far as it goes (the bill straight down) */
  reach: number; tipAngle: number
}

/**
 * How far to swing the neck down (radians) so the bill tip, with the head tipped as far as `tipAngle`, meets the
 * ground (y = 0): the neck makes up only what the head can't. The swing turns the first
 * segment by half of it and the second by all of it, so the neck bends evenly along its length. Returns 0 if the tip
 * already reaches the ground, and `max` if even the full swing leaves it above.
 */
export function neckSwing(n: Neck, max = MAX_NECK_SWING): number {
  return firstRoot(s => n.base.y + n.l1 * Math.sin(n.a1 - s / 2) + n.l2 * Math.sin(n.a2 - s) + n.reach * Math.sin(n.tipAngle), max)
}

/**
 * The least swing in [0, max] at which `y` (the bill tip's lowest reach, above the ground, for a swing) falls to 0
 * or below: 0 if it already does, and `max` if it never does.
 */
export function firstRoot(y: (s: number) => number, max = MAX_NECK_SWING): number {
  if (y(0) <= 0) return 0
  // the first swing that gets there: scan for the sign change, then halve the bracket
  const steps = 24
  let lo = 0
  for (let i = 1; i <= steps; i++) {
    const hi = (max * i) / steps
    if (y(hi) <= 0) {
      let a = lo, b = hi
      for (let k = 0; k < 30; k++) { const m = (a + b) / 2; if (y(m) > 0) a = m; else b = m }
      return (a + b) / 2
    }
    lo = hi
  }
  return max
}

/**
 * How far to pitch the head down (radians; negative lifts it) so the bill tip, now at `tip`, swings about the head
 * joint `head` onto the ground (y = 0): down when it is short, up when a deep lean would push it under. The
 * head-to-tip line never turns below `floor` (radians from +x): the caller sets it where the bill itself points
 * straight down, so when the ground is further than the tip can reach, the bill stops at vertical, short of it.
 */
export function headPitchToGround(head: V2, tip: V2, floor = -Infinity): number {
  const dx = tip.x - head.x, dy = tip.y - head.y
  const r = Math.hypot(dx, dy)
  if (r === 0) return 0
  const angle = Math.atan2(dy, dx)
  return angle - Math.max(floor, Math.asin(Math.min(1, Math.max(-1, -head.y / r))))
}
