import type { BehaviorContext, BehaviorController } from './types'
import { turnToward, approach } from './types'
import { randomPointInPolygon, clampToPolygon } from '../location/zones'
import type { PoseState } from '../birds/model'

type State = 'cruise' | 'idle' | 'dabble'

const SPEED = 0.45          // m/s
const TURN = 1.2            // rad/s
const RIPPLE_EVERY = 0.9    // s while cruising
const DRIFT = 0.08          // m/s per unit effective wind while idle

export function createSwim(ctx: BehaviorContext, startX: number, startZ: number): BehaviorController {
  let x = startX, z = startZ, heading = ctx.rng() * Math.PI * 2
  let state: State = 'cruise'
  let timer = 2 + ctx.rng() * 6
  let [tx, tz] = randomPointInPolygon(ctx.zone.points, ctx.rng)
  let rippleClock = 0
  let bob = 0

  function next(): void {
    const r = ctx.rng()
    if (state === 'cruise') {
      state = r < 0.6 ? 'idle' : 'dabble'
      timer = state === 'idle' ? 3 + ctx.rng() * 8 : 1.5 + ctx.rng() * 2
    } else {
      state = 'cruise'
      ;[tx, tz] = randomPointInPolygon(ctx.zone.points, ctx.rng)
      timer = 4 + ctx.rng() * 10
    }
  }

  return {
    name: 'swim',
    get state() { return state },
    get x() { return x }, get y() { return 0 }, get z() { return z }, get heading() { return heading },
    update(dt: number, pose: PoseState) {
      timer -= dt
      if (timer <= 0) next()
      const w = ctx.wind()
      if (state === 'cruise') {
        const want = Math.atan2(-(tz - z), tx - x)
        heading = turnToward(heading, want, TURN * dt)
        x += Math.cos(heading) * SPEED * dt
        z -= Math.sin(heading) * SPEED * dt
        if (Math.hypot(tx - x, tz - z) < 0.6) next()
        rippleClock += dt
        if (rippleClock >= RIPPLE_EVERY) { rippleClock = 0; ctx.onRipple?.(x, z) }
        bob += dt * 6
        pose.headBob = Math.sin(bob) * 0.06        // coot-style pump; other species read it faintly
        pose.lean.x = approach(pose.lean.x, 0, 6, dt)
        pose.neckExtend = approach(pose.neckExtend, 0.6, 4, dt)
      } else if (state === 'idle') {
        x += w.dirX * DRIFT * w.effective * dt
        z += w.dirZ * DRIFT * w.effective * dt
        pose.headBob = approach(pose.headBob, 0, 4, dt)
        pose.lean.x = approach(pose.lean.x, 0, 6, dt)
        pose.neckExtend = approach(pose.neckExtend, 0.35, 2, dt)
      } else {
        // dabble: tip-up, tail in the air, head under
        pose.lean.x = approach(pose.lean.x, 0.9, 5, dt)
        pose.tailTilt = approach(pose.tailTilt, 0.4, 5, dt)
        pose.neckExtend = approach(pose.neckExtend, 1, 5, dt)
        if (ctx.rng() < dt * 0.8) ctx.onRipple?.(x, z)
      }
      if (state !== 'dabble') pose.tailTilt = approach(pose.tailTilt, 0, 5, dt)
      ;[x, z] = clampToPolygon(x, z, ctx.zone.points)
    },
  }
}
