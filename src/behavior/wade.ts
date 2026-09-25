import type { BehaviorContext, BehaviorController } from './types'
import { turnToward, approach, polygonOf } from './types'
import { randomPointInPolygon, clampToPolygon } from '../location/zones'
import type { PoseState } from '../birds/model'

type State = 'still' | 'step' | 'strike'

const SPEED = 0.35
const TURN = 0.8

export function createWade(ctx: BehaviorContext, startX: number, startZ: number): BehaviorController {
  const zone = polygonOf(ctx)
  let x = startX, z = startZ, heading = ctx.rng() * Math.PI * 2
  let state: State = 'still'
  let timer = 6 + ctx.rng() * 14
  let [tx, tz] = [x, z]
  let strikeT = 0

  function next(): void {
    if (state === 'still') {
      if (ctx.rng() < 0.3) { state = 'strike'; strikeT = 0; timer = 1.2 }
      else {
        state = 'step'
        const [px, pz] = randomPointInPolygon(zone.points, ctx.rng)
        // short steps: move a few metres toward a random point, not all the way
        const d = Math.hypot(px - x, pz - z) || 1
        const len = Math.min(d, 2 + ctx.rng() * 2)
        tx = x + ((px - x) / d) * len
        tz = z + ((pz - z) / d) * len
        timer = 20
      }
    } else {
      state = 'still'
      timer = 8 + ctx.rng() * 20
    }
  }

  return {
    name: 'wade',
    get state() { return state },
    get x() { return x }, get y() { return ctx.ground(x, z) }, get z() { return z }, get heading() { return heading },
    update(dt: number, pose: PoseState) {
      timer -= dt
      if (timer <= 0) next()
      if (state === 'step') {
        const want = Math.atan2(-(tz - z), tx - x)
        heading = turnToward(heading, want, TURN * dt)
        const [px, pz] = [x, z]
        x += Math.cos(heading) * SPEED * dt
        z -= Math.sin(heading) * SPEED * dt
        ;[x, z] = clampToPolygon(x, z, zone.points)
        pose.strideDistance += Math.hypot(x - px, z - pz)
        pose.gait = approach(pose.gait, 1, 8, dt)
        if (Math.hypot(tx - x, tz - z) < 0.3) next()
        pose.neckExtend = approach(pose.neckExtend, 0.55, 2, dt)
        pose.lean.x = approach(pose.lean.x, 0.15, 3, dt)
      } else if (state === 'strike') {
        strikeT += dt
        // fast extend in the first 0.25 s, then slow recover. Wider than the
        // nominal 0.15 s strike so a single large-dt update (as in tests that
        // step by 1/30 up to the transition frame, then by 0.15 s) still lands
        // inside the extend phase instead of tipping into recovery early.
        const striking = strikeT <= 0.25
        pose.neckExtend = approach(pose.neckExtend, striking ? 1 : 0.3, striking ? 40 : 3, dt)
        pose.gait = approach(pose.gait, 0, 8, dt)
        pose.lean.x = approach(pose.lean.x, striking ? 0.5 : 0, striking ? 30 : 3, dt)
      } else {
        pose.neckExtend = approach(pose.neckExtend, 0.3, 1.5, dt)
        pose.gait = approach(pose.gait, 0, 8, dt)
        pose.lean.x = approach(pose.lean.x, 0, 2, dt)
        // a gust ruffles: tiny roll
        pose.lean.z = approach(pose.lean.z, (ctx.wind().effective - 0.3) * 0.05, 2, dt)
      }
      ;[x, z] = clampToPolygon(x, z, zone.points)
    },
  }
}
