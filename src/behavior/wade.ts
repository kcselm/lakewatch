import type { BehaviorContext, BehaviorController } from './types'
import { turnToward, approach, polygonOf } from './types'
import { randomPointInPolygon, clampToPolygon } from '../location/zones'
import type { PoseState } from '../birds/model'

type State = 'still' | 'step' | 'strike'

const SPEED = 0.35
const TURN = 0.8
/** a strike eases all the way down over this long, then holds until STRIKE_HOLD before recovering, seconds */
const STRIKE_DOWN = 0.12
const STRIKE_HOLD = 0.25

const smoothstep = (w: number) => w * w * (3 - 2 * w)

/** the bottom of a strike: the body tipped `lean` forward, the neck stretched, the bill down at the water */
export const STRIKE = { lean: 0.5, neckExtend: 1, reach: 1 } as const

export function createWade(ctx: BehaviorContext, startX: number, startZ: number): BehaviorController {
  const zone = polygonOf(ctx)
  let x = startX, z = startZ, heading = ctx.rng() * Math.PI * 2
  let state: State = 'still'
  let timer = 6 + ctx.rng() * 14
  let [tx, tz] = [x, z]
  let strikeT = 0
  let from = { neck: 0, reach: 0, lean: 0 }          // the pose a strike starts from

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
        pose.reach = approach(pose.reach, 0, 3, dt)
        pose.lean.x = approach(pose.lean.x, 0.15, 3, dt)
      } else if (state === 'strike') {
        if (strikeT === 0) from = { neck: pose.neckExtend, reach: pose.reach, lean: pose.lean.x }
        strikeT += dt
        // down in STRIKE_DOWN along a smoothstep, so it builds over a few frames at any frame rate, held until
        // STRIKE_HOLD (wide enough that a single large-dt update still lands in it), then a slow recovery
        if (strikeT <= STRIKE_HOLD) {
          const k = smoothstep(Math.min(1, strikeT / STRIKE_DOWN))
          pose.neckExtend = from.neck + (STRIKE.neckExtend - from.neck) * k
          pose.reach = from.reach + (STRIKE.reach - from.reach) * k
          pose.lean.x = from.lean + (STRIKE.lean - from.lean) * k
        } else {
          pose.neckExtend = approach(pose.neckExtend, 0.3, 3, dt)
          pose.reach = approach(pose.reach, 0, 3, dt)
          pose.lean.x = approach(pose.lean.x, 0, 3, dt)
        }
        pose.gait = approach(pose.gait, 0, 8, dt)
      } else {
        pose.neckExtend = approach(pose.neckExtend, 0.3, 1.5, dt)
        pose.reach = approach(pose.reach, 0, 3, dt)
        pose.gait = approach(pose.gait, 0, 8, dt)
        pose.lean.x = approach(pose.lean.x, 0, 2, dt)
        // a gust ruffles: tiny roll
        pose.lean.z = approach(pose.lean.z, (ctx.wind().effective - 0.3) * 0.05, 2, dt)
      }
      ;[x, z] = clampToPolygon(x, z, zone.points)
    },
  }
}
