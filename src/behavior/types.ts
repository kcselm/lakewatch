import type { PolygonZone } from '../location/schema'
import type { Rng } from '../catalog/types'
import type { PoseState } from '../birds/model'

export interface BehaviorContext {
  zone: PolygonZone
  rng: Rng
  wind: () => { dirX: number; dirZ: number; effective: number }
  ground: (x: number, z: number) => number
  onRipple?: (x: number, z: number) => void
  group?: { targetX: number; targetZ: number; retargetAt: number }
}

export interface BehaviorController {
  readonly name: string
  readonly state: string
  readonly x: number
  readonly y: number
  readonly z: number
  /** radians, 0 = +x, counter-clockwise seen from above */
  readonly heading: number
  update(dt: number, pose: PoseState): void
}

export type BehaviorFactory = (ctx: BehaviorContext, startX: number, startZ: number) => BehaviorController

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
