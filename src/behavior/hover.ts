import type { BehaviorContext, BehaviorController } from './types'
import { turnToward, approach, perchOf } from './types'
import type { PoseState } from '../birds/model'

type State = 'perch' | 'flyout' | 'hover' | 'dive' | 'surface' | 'return'

/** the lake surface; the water mesh sits at y = 0 */
export const WATER_Y = 0
const HOVER_RADIUS: [number, number] = [6, 12]
const HOVER_ALT: [number, number] = [6, 9]
const FLY_SPEED = 7
const DIVE_SPEED = 14
const TWO_PI = Math.PI * 2

/** The kingfisher: perch, fly out over the water, hover, plunge, surface, and fly back to the perch. */
export function createHover(ctx: BehaviorContext, _startX: number, _startZ: number): BehaviorController {
  const [px, py, pz] = perchOf(ctx)
  const hz = ctx.wingbeatHz ?? 6
  let x = px, y = py, z = pz, heading = ctx.rng() * TWO_PI
  let state: State = 'perch'
  let timer = 20 + ctx.rng() * 50
  let tx = 0, ty = 0, tz = 0, bob = 0
  const between = ([lo, hi]: [number, number]) => lo + ctx.rng() * (hi - lo)

  /** Straight-line flight toward a point; true on arrival. */
  function flyToward(dt: number, gx: number, gy: number, gz: number, speed: number): boolean {
    const dx = gx - x, dy = gy - y, dz = gz - z
    const d = Math.hypot(dx, dy, dz)
    if (d < 0.3 || d <= speed * dt) { x = gx; y = gy; z = gz; return true }
    const k = (speed * dt) / d
    x += dx * k; y += dy * k; z += dz * k
    if (Math.hypot(dx, dz) > 1e-3) heading = turnToward(heading, Math.atan2(-dz, dx), 4 * dt)
    return false
  }

  function flapping(pose: PoseState, dt: number, rate = 1): void {
    pose.wingSpread = approach(pose.wingSpread, 1, 10, dt)
    pose.wingPhase = (pose.wingPhase + dt * hz * rate) % 1
  }

  return {
    name: 'hover',
    get state() { return state },
    get x() { return x }, get y() { return y }, get z() { return z }, get heading() { return heading },
    update(dt: number, pose: PoseState) {
      switch (state) {
        case 'perch': {
          timer -= dt
          x = px; y = py; z = pz
          pose.wingSpread = approach(pose.wingSpread, 0, 8, dt)
          pose.wingPhase = 0
          pose.neckExtend = approach(pose.neckExtend, 0.3, 2, dt)
          pose.lean.x = approach(pose.lean.x, 0, 3, dt)
          pose.lean.z = approach(pose.lean.z, (ctx.wind().effective - 0.3) * 0.05, 2, dt)
          if (timer <= 0) {
            const a = ctx.rng() * TWO_PI, r = between(HOVER_RADIUS)
            tx = px + Math.cos(a) * r
            tz = pz + Math.sin(a) * r
            ty = WATER_Y + between(HOVER_ALT)
            state = 'flyout'
          }
          return
        }
        case 'flyout':
          flapping(pose, dt)
          pose.neckExtend = approach(pose.neckExtend, 0.8, 6, dt)
          pose.lean.x = approach(pose.lean.x, 0, 4, dt)
          if (flyToward(dt, tx, ty, tz, FLY_SPEED)) { state = 'hover'; timer = 2 + ctx.rng() * 3; bob = 0 }
          return
        case 'hover':
          timer -= dt
          bob += dt
          y = ty + Math.sin(bob * 3) * 0.15
          flapping(pose, dt, 1.6)
          pose.neckExtend = approach(pose.neckExtend, 0.8, 6, dt)
          pose.lean.x = approach(pose.lean.x, 0.35, 4, dt)       // looking down
          if (timer <= 0) state = 'dive'
          return
        case 'dive':
          pose.wingSpread = approach(pose.wingSpread, 0, 12, dt)
          pose.wingPhase = 0
          pose.lean.x = approach(pose.lean.x, 1.3, 10, dt)       // head first
          pose.neckExtend = approach(pose.neckExtend, 1, 10, dt)
          y -= DIVE_SPEED * dt
          if (y <= WATER_Y) {
            y = WATER_Y
            ctx.onEvent?.('splash', x, WATER_Y, z)
            ctx.onRipple?.(x, z)
            ctx.onSplash?.(x, z, 1)
            state = 'surface'
            timer = 0.5
          }
          return
        case 'surface':
          timer -= dt
          y = WATER_Y
          pose.lean.x = approach(pose.lean.x, 0, 6, dt)
          flapping(pose, dt)
          if (timer <= 0) state = 'return'
          return
        case 'return':
          flapping(pose, dt)
          pose.neckExtend = approach(pose.neckExtend, 0.6, 4, dt)
          pose.lean.x = approach(pose.lean.x, -0.2, 4, dt)        // climbing
          if (flyToward(dt, px, py, pz, FLY_SPEED)) {
            state = 'perch'
            timer = 20 + ctx.rng() * 50
            heading = ctx.rng() * TWO_PI
          }
      }
    },
  }
}
