import type { BehaviorContext, BehaviorController } from './types'
import { turnToward, approach } from './types'
import { randomPointInPolygon, clampToPolygon } from '../location/zones'
import type { PoseState } from '../birds/model'

type State = 'run' | 'peck'

const SPEED = 1.1
const TURN = 6
const GROUP_RADIUS = 3
const GROUP_RETARGET = 45   // seconds

export function createProbe(ctx: BehaviorContext, startX: number, startZ: number): BehaviorController {
  let x = startX, z = startZ, heading = ctx.rng() * Math.PI * 2
  let state: State = 'peck'
  let timer = 0.5 + ctx.rng()
  let tx = x, tz = z
  let clock = 0
  let peckPhase = 0

  function pickTarget(): void {
    const g = ctx.group
    if (g && clock >= g.retargetAt) {
      ;[g.targetX, g.targetZ] = randomPointInPolygon(ctx.zone.points, ctx.rng)
      g.retargetAt = clock + GROUP_RETARGET
    }
    const cx = g ? g.targetX : x, cz = g ? g.targetZ : z
    const a = ctx.rng() * Math.PI * 2, r = ctx.rng() * GROUP_RADIUS
    ;[tx, tz] = clampToPolygon(cx + Math.cos(a) * r, cz + Math.sin(a) * r, ctx.zone.points)
  }

  function next(): void {
    if (state === 'run') { state = 'peck'; timer = 0.8 + ctx.rng() * 2; peckPhase = 0 }
    else { state = 'run'; pickTarget(); timer = 4 }
  }

  return {
    name: 'probe',
    get state() { return state },
    get x() { return x }, get y() { return ctx.ground(x, z) }, get z() { return z }, get heading() { return heading },
    update(dt: number, pose: PoseState) {
      clock += dt
      timer -= dt
      if (timer <= 0) next()
      if (state === 'run') {
        const want = Math.atan2(-(tz - z), tx - x)
        heading = turnToward(heading, want, TURN * dt)
        x += Math.cos(heading) * SPEED * dt
        z -= Math.sin(heading) * SPEED * dt
        if (Math.hypot(tx - x, tz - z) < 0.2) next()
        pose.neckExtend = approach(pose.neckExtend, 0.8, 8, dt)
        pose.lean.x = approach(pose.lean.x, 0, 8, dt)
        pose.lean.z = approach(pose.lean.z, 0, 4, dt)
      } else {
        peckPhase += dt * 9
        const down = Math.max(0, Math.sin(peckPhase))
        pose.lean.x = 0.2 + down * 0.35
        pose.neckExtend = 0.5 + down * 0.4
        // a gust ruffles: tiny roll, same as wade
        pose.lean.z = approach(pose.lean.z, (ctx.wind().effective - 0.3) * 0.05, 2, dt)
      }
      ;[x, z] = clampToPolygon(x, z, ctx.zone.points)
    },
  }
}
