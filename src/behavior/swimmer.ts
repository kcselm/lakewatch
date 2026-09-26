import type { BehaviorContext, FlockGroup, Neighbour } from './types'
import { turnToward, polygonOf, wrap } from './types'
import { createFlock, type FlockSettings } from './flock'
import { pointInPolygon, randomPointInPolygon } from '../location/zones'
import type { PolygonZone } from '../location/schema'
import type { Rng } from '../catalog/types'

/** What every swim style's settings share. */
export interface SwimSettings {
  /** swimming from spot to spot near the flock: speed in m/s, and how long a cruise lasts */
  cruise: { speed: number; seconds: readonly [number, number] }
  /** the fastest it turns, rad/s */
  turn: number
  /**
   * its flock: the birds keep within `radius` of a target that drifts at most `drift` metres every `retargetSeconds`,
   * and one farther than `whenFarther` from it swims back
   */
  flock: FlockSettings & { drift: number; whenFarther: number }
  /** metres kept from a flockmate, and from any other swimmer */
  spacing: { flock: number; other: number }
  /** a ring on the water every `every` seconds while swimming faster than `above` m/s: the wake, as `swim` always made */
  wake: { every: number; size: number; above: number }
}

/**
 * How a swimmer keeps company, for placing it at the start: its flock's radius (Infinity: anywhere in the zone), how
 * long the flock stays on its first patch, and the spacings it keeps.
 */
export interface Company { radius: number; retargetSeconds: number; spacing: SwimSettings['spacing'] }

/** how fast a swimmer gathers way or slows, m/s² */
export const ACCEL = 1
/** how fast a swimmer paddles away from a neighbour that is too close, at most, m/s */
export const AVOID = 0.12
/** wind drift while not swimming under way, m/s per unit of effective wind (as `swim` always drifted) */
export const DRIFT = 0.08
/** a neighbour this far beyond the spacing is close enough that the swimmer stops closing on it, metres */
const MARGIN = 0.1

/**
 * Position, heading, and the moves every swim style shares: swimming ahead or toward a spot, pivoting to turn about,
 * drifting with the wind, and keeping clear of the other swimmers. Every move goes through `swim`, which never takes
 * the bird out of its zone: a step that would leave it is shortened until it stays in, so nothing is ever clamped.
 */
export function createSwimmer(ctx: BehaviorContext, x: number, z: number, S: SwimSettings) {
  const zone = polygonOf(ctx)
  const flock = createFlock(ctx, zone, x, z, S.flock)
  const body = {
    zone, flock, x, z, heading: ctx.rng() * Math.PI * 2,
    /** forward speed, m/s, eased toward what the style asks for */
    speed: 0,
    /** this bird's own controller, so it can tell itself from its neighbours; the style sets it */
    self: null as Neighbour | null,
    /** a neighbour it may come as close to as it likes: its partner in a shoveler's spin */
    partner: null as Neighbour | null,

    /** how close this bird lets `n` come: its flock spacing for a flockmate, else the larger of the two birds' own */
    spacingTo(n: Neighbour): number {
      return n.group !== undefined && n.group === flock.group ? S.spacing.flock : Math.max(S.spacing.other, n.spacing ?? 0)
    },
    /** the other swimmers in the zone, but for a partner */
    others(): Neighbour[] {
      return (ctx.neighbours?.() ?? []).filter(n => n !== body.self && n !== body.partner)
    },
    /** true when no other swimmer is closer to (px, pz) than this bird keeps, with `extra` metres to spare */
    clearAt(px: number, pz: number, extra = 0): boolean {
      return body.others().every(n => Math.hypot(n.x - px, n.z - pz) >= body.spacingTo(n) + extra)
    },
    /** a spot near the flock's target, clear of the other swimmers if one of a few tries is */
    spot(clock: number): [number, number] {
      let best = flock.near(clock)
      for (let i = 0; i < 8 && !body.clearAt(best[0], best[1], MARGIN); i++) best = flock.near(clock)
      return best
    },

    /**
     * One frame: swim ahead at up to `want` m/s, turning toward `aim` (radians, or null to hold the heading) no faster
     * than the style turns. It swims slower the further round it still has to turn, so it pivots on the spot to turn
     * about. With `drift` the wind carries it. It keeps clear of its neighbours: it never swims closer to one inside
     * the spacing's margin, and paddles away from one inside the spacing.
     */
    swim(dt: number, want: number, aim: number | null, drift = false): void {
      const crowd = body.crowding()
      if (aim !== null && want > 0 && crowd.close.length) {
        // steer round a close neighbour: aim the way that doesn't close on it, slower the more of the way it blocks
        const [dx, dz] = body.unclose(Math.cos(aim), -Math.sin(aim), crowd.close)
        const len = Math.hypot(dx, dz)
        if (len > 1e-3) aim = Math.atan2(-dz, dx)
        want *= len
      }
      if (aim !== null) body.heading = turnToward(body.heading, aim, S.turn * dt)
      const off = aim === null ? 0 : Math.abs(wrap(aim - body.heading))
      const target = want * Math.max(0, Math.cos(off))
      body.speed += Math.max(-ACCEL * dt, Math.min(ACCEL * dt, target - body.speed))
      let vx = Math.cos(body.heading) * body.speed, vz = -Math.sin(body.heading) * body.speed
      if (drift) {
        const w = ctx.wind()
        vx += w.dirX * DRIFT * w.effective
        vz += w.dirZ * DRIFT * w.effective
      }
      ;[vx, vz] = body.unclose(vx + crowd.px, vz + crowd.pz, crowd.close)
      body.moveBy(vx * dt, vz * dt)
    },
    /** Swim toward (tx, tz) at up to `want` m/s; returns the distance left. */
    swimTo(tx: number, tz: number, want: number, dt: number): number {
      const d = Math.hypot(tx - body.x, tz - body.z)
      // slow into the spot rather than overshoot it
      body.swim(dt, Math.min(want, Math.sqrt(2 * ACCEL * d)), d > 1e-6 ? Math.atan2(-(tz - body.z), tx - body.x) : null)
      return Math.hypot(tx - body.x, tz - body.z)
    },
    /** Sit on the water: slow to a stop and drift with the wind. */
    float(dt: number): void { body.swim(dt, 0, null, true) },

    /**
     * The neighbours it is close to: the direction away from each one inside the spacing's margin, and the velocity of
     * a paddle away from any inside the spacing itself, the full AVOID a quarter of the spacing inside.
     */
    crowding(): { close: [number, number][]; px: number; pz: number } {
      let px = 0, pz = 0
      const close: [number, number][] = []
      for (const n of body.others()) {
        const s = body.spacingTo(n)
        const dx = body.x - n.x, dz = body.z - n.z, d = Math.hypot(dx, dz)
        if (d >= s + MARGIN) continue
        // right on top of each other (only ever at a hand-made start): part sideways
        const [ux, uz] = d > 1e-9 ? [dx / d, dz / d] : [Math.sin(body.heading), Math.cos(body.heading)]
        close.push([ux, uz])
        if (d < s) { px += ux * (s - d) / s; pz += uz * (s - d) / s }
      }
      const p = Math.hypot(px, pz)
      const k = p > 0 ? (AVOID * Math.min(1, 4 * p)) / p : 0
      return { close, px: px * k, pz: pz * k }
    },
    /** (vx, vz) with the part toward any close neighbour taken out */
    unclose(vx: number, vz: number, close: readonly [number, number][]): [number, number] {
      for (let pass = 0; pass < 2; pass++) {
        for (const [ux, uz] of close) {
          const closing = -(vx * ux + vz * uz)
          if (closing > 0) { vx += closing * ux; vz += closing * uz }
        }
      }
      return [vx, vz]
    },
    /**
     * Move by (dx, dz), shortened as far as it takes to stay in the zone and never to come inside a neighbour's spacing
     * any further than it already is. A convex zone always lets some of a step through; a crowd may not, and then it
     * waits.
     */
    moveBy(dx: number, dz: number): void {
      const others = body.others()
      const ok = (nx: number, nz: number) => pointInPolygon(nx, nz, zone.points) && others.every(n => {
        const now = Math.hypot(nx - n.x, nz - n.z)
        return now >= body.spacingTo(n) || now >= Math.hypot(body.x - n.x, body.z - n.z)
      })
      for (let k = 1; k > 1 / 64; k /= 2) {
        const nx = body.x + dx * k, nz = body.z + dz * k
        if (ok(nx, nz)) { body.x = nx; body.z = nz; return }
      }
    },
  }
  return body
}

/**
 * Pick the next activity so that over time each takes its `share` of the bird's time: a spell of mean length `mean`
 * seconds is chosen in proportion to share / mean. Shares need not sum to 1.
 */
export function pickByShare<K extends string>(rng: Rng, table: Readonly<Record<K, { share: number; mean: number }>>): K {
  const keys = Object.keys(table) as K[]
  const weights = keys.map(k => table[k].share / table[k].mean)
  let r = rng() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < keys.length; i++) {
    r -= weights[i]!
    if (r < 0) return keys[i]!
  }
  return keys.at(-1)!
}

/** The mean of a uniform range. */
export const mid = ([lo, hi]: readonly [number, number]) => (lo + hi) / 2

/**
 * Where a swimmer starts: near its flock's target (anywhere in the zone for a bird that keeps a patch of its own), and
 * no closer to the swimmers already placed than either keeps. The spawner calls it, so flocks start formed.
 */
export function startSpot(zone: PolygonZone, rng: Rng, group: FlockGroup, company: Company, placed: readonly Neighbour[]): [number, number] {
  // the target itself is in the zone (the spawner seeds it there), so it will do if nothing better turns up
  let spot: [number, number] = [group.targetX, group.targetZ]
  for (let i = 0; i < 200; i++) {
    let [sx, sz] = [0, 0]
    if (company.radius === Infinity) [sx, sz] = randomPointInPolygon(zone.points, rng)
    else {
      const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * company.radius
      ;[sx, sz] = [group.targetX + Math.cos(a) * r, group.targetZ + Math.sin(a) * r]
      if (!pointInPolygon(sx, sz, zone.points)) continue
    }
    spot = [sx, sz]
    const keep = (n: Neighbour) => (n.group === group ? company.spacing.flock : Math.max(company.spacing.other, n.spacing ?? 0))
    if (placed.every(n => Math.hypot(n.x - sx, n.z - sz) >= keep(n) + MARGIN)) return spot
  }
  return spot
}
