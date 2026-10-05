import type { BehaviorContext, BehaviorController } from './types'
import { turnToward, approach, perchOf } from './types'
import type { PoseState } from '../birds/model'
import { createCormorantPerch } from './cormorant'

type State = 'sit' | 'shuffle' | 'stretch' | 'loop'

export const LOOP_SECONDS = 6
const LOOP_RISE = 2.5
const TWO_PI = Math.PI * 2

/**
 * Sit on a perch; shuffle, stretch, and now and then fly a short loop and land back on it. A cormorant perches in its
 * own style: upright on its stump, drying its wings (cormorant.ts).
 */
export function createPerch(ctx: BehaviorContext, _startX: number, _startZ: number): BehaviorController {
  if (ctx.foraging === 'cormorant') return createCormorantPerch(ctx)
  const [px, py, pz] = perchOf(ctx)
  const hz = ctx.wingbeatHz ?? 5
  let x = px, y = py, z = pz, heading = ctx.rng() * TWO_PI
  let state: State = 'sit'
  let timer = 8 + ctx.rng() * 30
  let targetHeading = heading
  let loopT = 0, loopR = 5, loopDir: 1 | -1 = 1, cx = 0, cz = 0, a0 = 0

  function next(): void {
    if (state !== 'sit') {
      state = 'sit'; timer = 10 + ctx.rng() * 30
      x = px; y = py; z = pz
      return
    }
    const r = ctx.rng()
    if (r < 0.5) { state = 'shuffle'; timer = 1.5; targetHeading = heading + (ctx.rng() - 0.5) * 1.2 }
    else if (r < 0.8) { state = 'stretch'; timer = 2 }
    else {
      state = 'loop'; timer = LOOP_SECONDS; loopT = 0
      loopR = 4 + ctx.rng() * 4
      loopDir = ctx.rng() < 0.5 ? 1 : -1
      // the circle's centre sits off to one side, so the path starts and ends at the perch
      // and its first tangent points along the bird's heading
      cx = px + Math.sin(heading) * loopR * loopDir
      cz = pz + Math.cos(heading) * loopR * loopDir
      a0 = Math.atan2(pz - cz, px - cx)
      ctx.onEvent?.('flap', px, py, pz)
    }
  }

  return {
    name: 'perch',
    get state() { return state },
    get x() { return x }, get y() { return y }, get z() { return z }, get heading() { return heading },
    update(dt: number, pose: PoseState) {
      timer -= dt
      if (timer <= 0) next()
      if (state === 'loop') {
        loopT += dt
        const u = Math.min(1, loopT / LOOP_SECONDS)
        const a = a0 + loopDir * u * TWO_PI
        const nx = cx + Math.cos(a) * loopR, nz = cz + Math.sin(a) * loopR
        if (Math.hypot(nx - x, nz - z) > 1e-6) heading = Math.atan2(-(nz - z), nx - x)
        x = nx; z = nz
        y = py + Math.sin(u * Math.PI) * LOOP_RISE
        pose.wingSpread = approach(pose.wingSpread, 1, 10, dt)
        pose.wingPhase = (pose.wingPhase + dt * hz) % 1
        pose.neckExtend = approach(pose.neckExtend, 0.9, 6, dt)
        pose.lean.x = approach(pose.lean.x, 0, 6, dt)
        pose.tailTilt = approach(pose.tailTilt, 0, 6, dt)
        return
      }
      x = px; y = py; z = pz
      pose.wingPhase = 0
      if (state === 'shuffle') {
        heading = turnToward(heading, targetHeading, 2 * dt)
        pose.tailTilt = Math.sin(timer * 12) * 0.2
        pose.wingSpread = approach(pose.wingSpread, 0, 8, dt)
      } else if (state === 'stretch') {
        pose.wingSpread = approach(pose.wingSpread, timer > 1 ? 0.7 : 0, 6, dt)
        pose.tailTilt = approach(pose.tailTilt, 0, 6, dt)
      } else {
        pose.wingSpread = approach(pose.wingSpread, 0, 8, dt)
        pose.tailTilt = approach(pose.tailTilt, 0, 6, dt)
      }
      pose.neckExtend = approach(pose.neckExtend, 0.4, 2, dt)
      pose.lean.x = approach(pose.lean.x, 0, 3, dt)
      pose.lean.z = approach(pose.lean.z, (ctx.wind().effective - 0.3) * 0.05, 2, dt)
    },
  }
}
