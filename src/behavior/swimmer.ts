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
   * and one farther than `whenFarther` from it swims back; flockmates start at least `apart` metres apart (unset,
   * their spacing)
   */
  flock: FlockSettings & { drift: number; whenFarther: number; apart?: number }
  /** metres kept from a flockmate, and from any other swimmer */
  spacing: { flock: number; other: number }
  /** a ring on the water every `every` seconds while swimming faster than `above` m/s: the wake, as `swim` always made */
  wake: { every: number; size: number; above: number }
}

/**
 * How a swimmer keeps company, for placing it at the start: its flock's radius (Infinity: anywhere in the zone), how
 * long the flock stays on its first patch, and the spacings it keeps.
 */
export interface Company { radius: number; retargetSeconds: number; spacing: SwimSettings['spacing']; apart?: number }

/** how fast a swimmer gathers way or slows, m/s² */
export const ACCEL = 1
/** how fast a swimmer paddles away from a neighbour that is too close, at most, m/s */
export const AVOID = 0.12
/** wind drift while not swimming under way, m/s per unit of effective wind (as `swim` always drifted) */
export const DRIFT = 0.08
/** a neighbour this far beyond the spacing is close enough that the swimmer stops closing on it, metres */
const MARGIN = 0.1
/** the share of its speed a swimmer keeps going the long way round a neighbour, when the bank blocks the short way */
const ROUND = 0.5

/** A neighbour inside the spacing's margin: the unit direction from it to this bird, where it is, and how far off. */
interface Close { ux: number; uz: number; x: number; z: number; d: number }

/**
 * Position, heading, and the moves every swim style shares: swimming ahead or toward a spot, pivoting to turn about,
 * drifting with the wind, and keeping clear of the other swimmers. Every move goes through `swim`, which never takes
 * the bird out of its zone: a step that would leave it slides along the edge instead, so nothing is ever clamped.
 */
export function createSwimmer(ctx: BehaviorContext, x: number, z: number, S: SwimSettings) {
  const zone = polygonOf(ctx)
  const flock = createFlock(ctx, zone, x, z, S.flock)
  const edges = inwardEdges(zone.points)
  const body = {
    zone, flock, x, z, heading: ctx.rng() * Math.PI * 2,
    /**
     * forward speed, m/s: eased toward what the style asks for, and never more than the bird actually moved in its
     * last frame, so one held up by the bank or a neighbour loses way (and makes no wake) and gathers it again after
     */
    speed: 0,
    /** this bird's own controller, so it can tell itself from its neighbours; the style sets it */
    self: null as Neighbour | null,
    /** a neighbour it may come as close to as it likes: its partner in a shoveler's spin */
    partner: null as Neighbour | null,

    /** how close this bird lets `n` come: its flock spacing for a flockmate, else the larger of the two birds' own */
    spacingTo(n: Neighbour): number {
      return n.group !== undefined && n.group === flock.group ? S.spacing.flock : Math.max(S.spacing.other, n.spacing ?? 0)
    },
    /** the other swimmers on the water, whatever their zone, but for a partner, and any under the water */
    others(): Neighbour[] {
      return (ctx.neighbours?.() ?? []).filter(n => n !== body.self && n !== body.partner && !n.submerged)
    },
    /**
     * true when no other swimmer is closer to (px, pz) than this bird keeps, with `extra` metres to spare; with
     * `under`, the birds under the water count too, where they are now (a diver choosing where to come up)
     */
    clearAt(px: number, pz: number, extra = 0, under = false): boolean {
      const all = under ? (ctx.neighbours?.() ?? []).filter(n => n !== body.self && n !== body.partner) : body.others()
      return all.every(n => Math.hypot(n.x - px, n.z - pz) >= body.spacingTo(n) + extra)
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
     * the spacing's margin, steering round it the way the bank leaves room, and paddles away from one inside the
     * spacing.
     */
    swim(dt: number, want: number, aim: number | null, drift = false): void {
      const crowd = body.crowding()
      if (aim !== null && want > 0 && crowd.close.length) [aim, want] = body.steerRound(aim, want, crowd.close)
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
      const [x0, z0] = [body.x, body.z]
      body.moveBy(vx * dt, vz * dt)
      if (dt > 0) body.speed = Math.min(body.speed, Math.hypot(body.x - x0, body.z - z0) / dt)
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
    crowding(): { close: Close[]; px: number; pz: number } {
      let px = 0, pz = 0
      const close: Close[] = []
      for (const n of body.others()) {
        const s = body.spacingTo(n)
        const dx = body.x - n.x, dz = body.z - n.z, d = Math.hypot(dx, dz)
        if (d >= s + MARGIN) continue
        // right on top of each other (only ever at a hand-made start): part sideways
        const [ux, uz] = d > 1e-9 ? [dx / d, dz / d] : [Math.sin(body.heading), Math.cos(body.heading)]
        close.push({ ux, uz, x: n.x, z: n.z, d })
        if (d < s) { px += ux * (s - d) / s; pz += uz * (s - d) / s }
      }
      const p = Math.hypot(px, pz)
      const k = p > 0 ? (AVOID * Math.min(1, 4 * p)) / p : 0
      return { close, px: px * k, pz: pz * k }
    },
    /**
     * Steer round close neighbours: the aim turned the way that doesn't close on them, so it goes round rather than
     * crabbing, and the speed slower the more of its way they block. It goes round the one most in its way the short
     * way, unless the bank leaves no room there: the arc round that neighbour, as far from it as the bird is, until
     * its aim no longer closes on it, would leave the zone (as when both birds are against the bank). Then it goes
     * round the long way, at ROUND of its speed (by the rule above, all of its way is blocked); with no room either
     * way, it waits.
     */
    steerRound(aim: number, want: number, close: readonly Close[]): [number, number] {
      const ax = Math.cos(aim), az = -Math.sin(aim)
      let [dx, dz] = body.unclose(ax, az, close)
      let k = Math.hypot(dx, dz)
      let most = 0, n: Close | null = null
      for (const c of close) if (-(ax * c.ux + az * c.uz) > most) { most = -(ax * c.ux + az * c.uz); n = c }
      if (n) {
        // the short way round: +1 turning from the way away from it toward (-uz, ux), -1 the other; 0, dead ahead
        const across = az * n.ux - ax * n.uz
        const side = Math.sign(across)
        const short = Math.atan2(most, Math.abs(across))
        if (side === 0 || !body.roomRound(n, side, short)) {
          const other = [-1, 1].find(s => s !== side && body.roomRound(n, s, Math.PI - short))
          ;[dx, dz] = other === undefined ? [0, 0] : body.unclose(-other * n.uz, other * n.ux, close)
          k = ROUND * Math.hypot(dx, dz)
        }
      }
      return [k > 1e-3 ? Math.atan2(-dz, dx) : aim, want * k]
    },
    /** whether the arc round `n` (as in steerRound), `side` about, for `angle` radians, stays in the zone */
    roomRound(n: Close, side: number, angle: number): boolean {
      const steps = Math.ceil(angle / (Math.PI / 12))
      for (let q = 1; q <= steps; q++) {
        const c = Math.cos((q * angle) / steps), s = side * Math.sin((q * angle) / steps)
        if (!pointInPolygon(n.x + n.d * (n.ux * c - n.uz * s), n.z + n.d * (n.uz * c + n.ux * s), zone.points)) return false
      }
      return true
    },
    /** (vx, vz) with the part toward any close neighbour taken out */
    unclose(vx: number, vz: number, close: readonly { ux: number; uz: number }[]): [number, number] {
      for (let pass = 0; pass < 2; pass++) {
        for (const { ux, uz } of close) {
          const closing = -(vx * ux + vz * uz)
          if (closing > 0) { vx += closing * ux; vz += closing * uz }
        }
      }
      return [vx, vz]
    },
    /**
     * Move by (dx, dz), never out of the zone and never further inside a neighbour's spacing than it already is. A
     * step that would leave the zone loses the part that points out across the edge, so a bird against the bank slides
     * along it rather than stopping, keeping the part that runs along the bank or away from a neighbour; what is left
     * loses any part that closes on a neighbour it is already too close to (the two taken out by turns, as each can put
     * back some of the other). Each only takes away, so no step grows. Anything still amiss is shortened away. A bird
     * with nowhere left to go (stepping straight into the bank, into a corner, or into a neighbour it is too close to
     * already) waits.
     */
    moveBy(dx: number, dz: number): void {
      const others = body.others()
      // the way from each neighbour whose spacing it is inside, or that this step could take it inside
      const step = Math.hypot(dx, dz)
      const inside = others.flatMap(n => {
        const ox = body.x - n.x, oz = body.z - n.z, d = Math.hypot(ox, oz)
        return d < body.spacingTo(n) + step && d > 1e-9 ? [{ ux: ox / d, uz: oz / d }] : []
      })
      // each can put back some of what the other took out, so by turns, ending on the bank
      for (let pass = 0; pass < 4; pass++) {
        if (!pointInPolygon(body.x + dx, body.z + dz, zone.points)) [dx, dz] = body.slide(dx, dz)
        const [sx, sz] = [dx, dz]
        ;[dx, dz] = body.unclose(dx, dz, inside)
        if (dx === sx && dz === sz) break
      }
      if (!pointInPolygon(body.x + dx, body.z + dz, zone.points)) [dx, dz] = body.slide(dx, dz)
      const ok = (nx: number, nz: number) => pointInPolygon(nx, nz, zone.points) && others.every(n => {
        const now = Math.hypot(nx - n.x, nz - n.z)
        return now >= body.spacingTo(n) || now >= Math.hypot(body.x - n.x, body.z - n.z)
      })
      for (let k = 1; k > 1 / 64; k /= 2) {
        const nx = body.x + dx * k, nz = body.z + dz * k
        if (ok(nx, nz)) { body.x = nx; body.z = nz; return }
      }
    },
    /**
     * (dx, dz) with the part that would carry it across the zone's edge taken out: for each edge the step would cross,
     * the part along that edge's inward normal, so what is left runs along the bank (at a corner, along both banks,
     * which can leave nothing). In a convex zone what is left stays in; it never brings the bird nearer an edge it
     * would have crossed.
     */
    slide(dx: number, dz: number): [number, number] {
      // a few passes, as taking out one edge's part can turn a step in a corner across the other
      for (let pass = 0; pass < 4; pass++) {
        let crossed = false
        for (const e of edges) {
          const inward = dx * e.nx + dz * e.nz
          if (inward >= 0) continue
          // how far inside this edge's line the bird is now; a step that ends on the line counts as crossing it
          if ((body.x - e.ax) * e.nx + (body.z - e.az) * e.nz + inward > 0) continue
          dx -= inward * e.nx
          dz -= inward * e.nz
          crossed = true
        }
        if (!crossed) break
      }
      return [dx, dz]
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

/** Each edge of a polygon, either way round: a point on it and its unit normal pointing into the polygon. */
function inwardEdges(points: readonly (readonly [number, number])[]): { ax: number; az: number; nx: number; nz: number }[] {
  let twiceArea = 0
  points.forEach(([ax, az], i) => {
    const [bx, bz] = points[(i + 1) % points.length]!
    twiceArea += ax * bz - bx * az
  })
  const side = twiceArea > 0 ? 1 : -1
  return points.flatMap(([ax, az], i) => {
    const [bx, bz] = points[(i + 1) % points.length]!
    const len = Math.hypot(bx - ax, bz - az)
    return len > 0 ? [{ ax, az, nx: (-(bz - az) / len) * side, nz: ((bx - ax) / len) * side }] : []
  })
}

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
    const keep = (n: Neighbour) => (n.group === group ? (company.apart ?? company.spacing.flock) : Math.max(company.spacing.other, n.spacing ?? 0))
    if (placed.every(n => Math.hypot(n.x - sx, n.z - sz) >= keep(n) + MARGIN)) return spot
  }
  return spot
}
