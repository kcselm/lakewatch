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

/**
 * Flapping and gliding by turns, the leader first: it flaps for a while, then glides for a while, and each bird behind
 * starts and stops `delay` seconds after the bird ahead of it, so a bout of flapping passes down the line.
 */
export interface Bouts {
  /** seconds the leader flaps, and then glides */
  flap: readonly [number, number]
  glide: readonly [number, number]
  /** seconds each bird follows the one ahead by */
  delay: number
  /** seconds a bird takes to settle into a glide, and to come out of one */
  ease: number
  /** metres a bird sinks through a glide; it regains them as it flaps again */
  sink: number
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
  /** unset, every bird flaps all the way across, each at its own phase (the geese) */
  bouts?: Bouts
}

/** How a species flies over, where it differs from the defaults: its speed, its spacing, its bouts, and how it holds its neck. */
export interface FlightStyle extends Pick<FlyoverOptions, 'speed' | 'spacing' | 'bouts'> {
  /** PoseState.neckExtend in flight: 1 stretched out ahead (a goose), 0 folded back on the shoulders (a pelican) */
  neck: number
}

const STRETCHED: FlightStyle = { neck: 1 }
/**
 * The American White Pelican's line, from docs/research/2026-09-30-american-white-pelican.md, section 11.2. The head
 * rides on the shoulders. Sourced: flapping 60-75% of the time, and each bird following the one ahead within half a
 * second (0.3 here). Estimates: 13 m/s (12-14); bouts of 6-9 beats (2.2-3.3 s at 2.7 Hz) and glides of 1-2 s, which
 * no clip showed a whole cycle of; 3.5 m between birds, 1.3 wingspans, from photos of lines; and the sink.
 */
export const PELICAN_FLIGHT: FlightStyle = {
  neck: 0, speed: 13, spacing: 3.5,
  bouts: { flap: [2.2, 3.3], glide: [1, 2], delay: 0.3, ease: 0.4, sink: 0.3 },
}
const FLIGHT: Readonly<Record<string, FlightStyle>> = { amwpel: PELICAN_FLIGHT }

/** How this species flies over: its own style, or a stretched neck and the defaults. */
export function flightFor(species?: string): FlightStyle {
  return species !== undefined && Object.hasOwn(FLIGHT, species) ? FLIGHT[species]! : STRETCHED
}

/** seconds a bird takes to regain, flapping, the height it lost in a glide */
const REGAIN = 2

export interface FlyoverMember {
  x: number; y: number; z: number; heading: number; wingPhase: number
  /** 0 flapping .. 1 gliding, easing between; always 0 for a flock with no bouts */
  glide: number
}

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
  const members: FlyoverMember[] = offsets.map(() => ({ x: 0, y: 0, z: 0, heading: 0, wingPhase: 0, glide: 0 }))
  // how far behind the centre the last bird flies, plus a margin, so the crossing ends once it is clear
  const tail = spacing - Math.min(...offsets.map(o => o.forward))
  const between = ([lo, hi]: readonly [number, number]) => lo + rng() * (hi - lo)

  let state: 'waiting' | 'crossing' = 'waiting'
  let timer = between(opts.everySeconds) * rng()      // the first flock may come early
  let crossing: Crossing | null = null
  let travelled = 0
  let t = 0
  let cx = 0, cy = 0, cz = 0, heading = 0
  /**
   * The leader's bouts this crossing: the times it changes over, from flapping (it starts flapping at 0) to gliding and
   * back, as far ahead as any bird has yet been asked about.
   */
  let edges: number[] = []

  /** Where a bird `tau` seconds into the leader's bouts is: its wingbeat's phase, how far into a glide it is, and how far it has sunk. */
  function bout(tau: number, B: Bouts): { phase: number; glide: number; sag: number } {
    const beat = (since: number) => (((since * opts.wingbeatHz) % 1) + 1) % 1
    // a bird behind the leader flaps until the leader's first bout reaches it
    if (tau < 0) return { phase: beat(tau), glide: 0, sag: 0 }
    while (edges.length === 0 || edges[edges.length - 1]! <= tau) {
      const last = edges[edges.length - 1] ?? 0
      edges.push(last + between(edges.length % 2 === 0 ? B.flap : B.glide))
    }
    const k = edges.findIndex(e => e > tau)
    const from = k === 0 ? 0 : edges[k - 1]!, to = edges[k]!
    if (k % 2 === 0) {
      // flapping, from wings level as the bout begins; regaining what the glide before lost
      const sag = k === 0 ? 0 : B.sink * Math.max(0, 1 - (tau - from) / Math.min(REGAIN, to - from))
      return { phase: beat(tau - from), glide: 0, sag }
    }
    const settle = Math.min(1, (tau - from) / B.ease, (to - tau) / B.ease)
    return { phase: 0, glide: settle * settle * (3 - 2 * settle), sag: B.sink * ((tau - from) / (to - from)) }
  }

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
      if (opts.bouts) {
        const b = bout(t - i * opts.bouts.delay, opts.bouts)
        m.wingPhase = b.phase
        m.glide = b.glide
        m.y -= b.sag
      } else m.wingPhase = (t * opts.wingbeatHz + phases[i]!) % 1
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
        edges = []
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
