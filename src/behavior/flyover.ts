import type { LaneZone, Vec3 } from '../location/schema'
import type { Rng } from '../catalog/types'

export type Formation = 'line' | 'vee'
export interface FormationOffset { forward: number; lateral: number; up: number }

/** Flock-local offsets: forward along the heading, lateral to the right, up. The leader is bird 0 at the origin. */
export function formationOffsets(kind: Formation, n: number, spacing: number): FormationOffset[] {
  const out: FormationOffset[] = []
  for (let i = 0; i < n; i++) {
    if (kind === 'line') {
      // an echelon: each bird a little behind and beside the one ahead (pelicans)
      out.push({ forward: i === 0 ? 0 : -i * spacing * 0.9, lateral: i * spacing * 0.35, up: 0 })
    } else {
      // arms alternate right, left, right... each pair one step further back (geese)
      const k = Math.ceil(i / 2)
      const side = i % 2 === 1 ? 1 : -1
      out.push({ forward: i === 0 ? 0 : -k * spacing * 0.8, lateral: i === 0 ? 0 : side * k * spacing * 0.6, up: 0 })
    }
  }
  return out
}

export interface Crossing { start: Vec3; end: Vec3; heading: number; length: number }

/** One pass along the lane in either direction at a random altitude inside the band. */
export function laneCrossing(lane: LaneZone, rng: Rng): Crossing {
  const forward = rng() < 0.5
  const a = forward ? lane.from : lane.to
  const b = forward ? lane.to : lane.from
  const y = lane.altitude[0] + rng() * (lane.altitude[1] - lane.altitude[0])
  const start: Vec3 = [a[0], y, a[2]]
  const end: Vec3 = [b[0], y, b[2]]
  return {
    start, end,
    heading: Math.atan2(-(end[2] - start[2]), end[0] - start[0]),
    length: Math.hypot(end[0] - start[0], end[2] - start[2]),
  }
}

export interface FlyoverOptions {
  count: number
  formation: Formation
  everySeconds: [number, number]
  wingbeatHz: number
  /** m/s, default 14 */
  speed?: number
  /** m between birds, default 2.5 */
  spacing?: number
}

export interface FlyoverMember { x: number; y: number; z: number; heading: number; wingPhase: number }

export interface FlyoverController {
  readonly state: 'waiting' | 'crossing'
  /** flock centre (the leader's position) */
  readonly x: number
  readonly y: number
  readonly z: number
  readonly heading: number
  /** per-bird world positions, valid while crossing */
  readonly members: readonly FlyoverMember[]
  update(dt: number): void
}

/**
 * A flock that waits a random interval, enters at one end of the lane, crosses
 * in formation, exits past the other end, and waits again. Seeded and pure.
 */
export function createFlyover(lane: LaneZone, rng: Rng, opts: FlyoverOptions): FlyoverController {
  const speed = opts.speed ?? 14
  const spacing = opts.spacing ?? 2.5
  const offsets = formationOffsets(opts.formation, opts.count, spacing)
  const phases = offsets.map(() => rng())
  const members: FlyoverMember[] = offsets.map(() => ({ x: 0, y: 0, z: 0, heading: 0, wingPhase: 0 }))
  // how far behind the centre the last bird flies, plus a margin, so the crossing ends once it is clear
  const tail = spacing - Math.min(...offsets.map(o => o.forward))
  const between = ([lo, hi]: [number, number]) => lo + rng() * (hi - lo)

  let state: 'waiting' | 'crossing' = 'waiting'
  let timer = between(opts.everySeconds) * rng()      // the first flock may come early
  let crossing: Crossing | null = null
  let travelled = 0
  let t = 0
  let cx = 0, cy = 0, cz = 0, heading = 0

  function place(): void {
    const c = crossing!
    heading = c.heading
    cx = c.start[0] + Math.cos(heading) * travelled
    cy = c.start[1]
    cz = c.start[2] - Math.sin(heading) * travelled
    const fx = Math.cos(heading), fz = -Math.sin(heading)     // forward
    const lx = Math.sin(heading), lz = Math.cos(heading)      // lateral, to the right
    offsets.forEach((o, i) => {
      const m = members[i]!
      m.x = cx + fx * o.forward + lx * o.lateral
      m.z = cz + fz * o.forward + lz * o.lateral
      m.y = cy + o.up + Math.sin(t * 0.6 + phases[i]! * Math.PI * 2) * 0.4
      m.heading = heading
      m.wingPhase = (t * opts.wingbeatHz + phases[i]!) % 1
    })
  }

  return {
    get state() { return state },
    get x() { return cx }, get y() { return cy }, get z() { return cz }, get heading() { return heading },
    members,
    update(dt) {
      if (state === 'waiting') {
        timer -= dt
        if (timer > 0) return
        state = 'crossing'
        crossing = laneCrossing(lane, rng)
        travelled = 0
        t = 0
        place()
        return
      }
      travelled += speed * dt
      t += dt
      place()
      if (travelled >= crossing!.length + tail) {
        state = 'waiting'
        timer = between(opts.everySeconds)
      }
    },
  }
}
