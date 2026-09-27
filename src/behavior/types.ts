import type { Zone, PolygonZone, Vec3 } from '../location/schema'
import type { Rng } from '../catalog/types'
import type { PoseState } from '../birds/model'
import type { Foraging } from '../birds/spec'

/** A flock's shared record: its target, and when the target next moves on. Flockmates hold the same object. */
export interface FlockGroup {
  targetX: number; targetZ: number; retargetAt: number
  /** two shovelers of the flock spinning together, if any are */
  spin?: Spin
}

/**
 * Two flockmates turning about their midpoint, nose to tail, `apart` metres between their centres. Both birds read it,
 * so the pair turns as one: the first advances the turn, and the second takes its place opposite.
 */
export interface Spin {
  readonly pair: readonly [Neighbour, Neighbour]
  /** the midpoint they turn about */
  readonly cx: number
  readonly cz: number
  readonly apart: number
  /** +1 counter-clockwise seen from above, -1 clockwise, for the whole bout */
  readonly dir: 1 | -1
  /** radians a second */
  readonly rate: number
  /** the first bird's bearing from the midpoint (0 = +x, counter-clockwise from above), and its clock when it set it */
  angle: number
  at: number
  /** the first bird's clock when the bout ends, or, while the two gather, when it gives up waiting */
  ends: number
  /** false while the two swim to their places on the circle; true once both are there and turning */
  spinning: boolean
}

/**
 * Another swimmer, as a swimmer sees it: where it is and faces, what it is doing, how close it lets others come, its
 * flock, and whether it is under the water (where it is no one's neighbour).
 */
export type Neighbour = Pick<BehaviorController, 'x' | 'z' | 'heading' | 'state' | 'spacing' | 'group' | 'submerged'>

export interface BehaviorContext {
  zone: Zone
  rng: Rng
  wind: () => { dirX: number; dirZ: number; effective: number }
  ground: (x: number, z: number) => number
  /** a ring on the water at (x, z); `size` (0..1, default 1) for a smaller ring than a swimming bird's */
  onRipple?: (x: number, z: number, size?: number) => void
  group?: FlockGroup
  /** world-space perch point for perch and hover; the spawner resolves it from the point zone */
  perch?: Vec3
  /** for behaviors that flap; each behavior applies its own default when unset (perch 5, hover 6) */
  wingbeatHz?: number
  /** how the bird feeds; probe treats a missing style as sandpiper, swim as dabbler */
  foraging?: Foraging
  /** the species' code, for a style whose settings differ by species (the dabbler's) */
  species?: string
  /**
   * swimmers: every swimmer on the water, of any species and in any zone, this bird's own controller included (it
   * knows itself by that); the spawner fills it
   */
  neighbours?: () => readonly Neighbour[]
  onEvent?: (name: 'splash' | 'flap', x: number, y: number, z: number) => void
}

export interface BehaviorController {
  readonly name: string
  readonly state: string
  readonly x: number
  readonly y: number
  readonly z: number
  /** radians, 0 = +x, counter-clockwise seen from above */
  readonly heading: number
  /** swimmers: metres it keeps from any swimmer outside its flock */
  readonly spacing?: number
  /** swimmers: its flock's shared record, the same object as its flockmates' */
  readonly group?: FlockGroup
  /** divers: true while the whole bird is under the water; the spawner hides it then, and it can't be targeted */
  readonly submerged?: boolean
  update(dt: number, pose: PoseState): void
}

export type BehaviorFactory = (ctx: BehaviorContext, startX: number, startZ: number) => BehaviorController

export function polygonOf(ctx: BehaviorContext): PolygonZone {
  if (ctx.zone.kind !== 'polygon') throw new Error(`behavior needs a polygon zone, got ${ctx.zone.kind}`)
  return ctx.zone
}

export function perchOf(ctx: BehaviorContext): Vec3 {
  if (!ctx.perch) throw new Error('behavior needs a perch point')
  return ctx.perch
}

/** Shortest-path turn toward a target heading at a max rate. */
export function turnToward(current: number, target: number, maxDelta: number): number {
  let d = target - current
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return current + Math.max(-maxDelta, Math.min(maxDelta, d))
}

export function approach(current: number, target: number, rate: number, dt: number): number {
  return current + (target - current) * Math.min(1, rate * dt)
}

/** A uniform draw between lo and hi. */
export const between = (rng: () => number, [lo, hi]: readonly [number, number]) => lo + rng() * (hi - lo)
/** smoothstep: 0 to 1, starting and ending at zero speed */
export const ease = (t: number) => t * t * (3 - 2 * t)
/** An angle wrapped into -PI..PI. */
export const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
