import type { BehaviorContext, BehaviorController, FlockGroup, Neighbour } from './types'
import { approach, between, ease, polygonOf, turnToward, wrap } from './types'
import { pointInPolygon, randomPointInPolygon } from '../location/zones'
import type { PoseState } from '../birds/model'
import type { PolygonZone } from '../location/schema'
import type { Rng } from '../catalog/types'

type Range = readonly [number, number]

/** A heron's settings: how it waits, stalks, strikes, and rests, and the room it keeps. */
export interface HeronSettings {
  /** standing still with the neck in the traced S, seconds; now and then it peers down, or turns slowly on the spot */
  wait: { seconds: Range; peer: { chance: number; seconds: Range; pitch: number }; turn: { chance: number; rate: number } }
  /** what ends a wait: shares of a strike, a stalk, and an alert (the rest, another wait) */
  next: { strike: number; stalk: number; alert: number }
  /** a stalk: a few slow steps toward a spot `metres` away, at `speed` m/s, the neck held at `neck` */
  stalk: { metres: Range; speed: number; neck: number }
  /**
   * a strike: the neck drawn back to `drawNeck` over `draw` seconds, then the reach eased all the way down over `down`
   * seconds, the bill `depth` metres under the water and no steeper than `reachAngle` below level, the body tipped
   * `lean`; held `hold` seconds, then it recovers. The bill goes in `ahead` metres in front of the feet, where the ring
   * of size `ring` starts.
   */
  strike: { draw: number; drawNeck: number; down: number; hold: number; depth: number; reachAngle: number; lean: number; ahead: number; ring: number }
  /** how often a strike catches, and the swallow after one: the neck erect and the bill tipped up `pitch` radians */
  swallow: { chance: number; seconds: Range; pitch: number }
  /** the neck erect, the bill level, the body tilted up by `lean` (negative: nose up), still */
  alert: { seconds: Range; lean: number }
  /** a feeding bout's length, then a rest hunched with the neck folded and the body tilted up by `lean`, seconds */
  bout: { seconds: Range }
  rest: { seconds: Range; lean: number }
  /** metres it keeps from a heron of its own species (`same`) and from any other heron (`other`) */
  spacing: { same: number; other: number }
}

type State = 'wait' | 'stalk' | 'strike' | 'swallow' | 'alert' | 'hunch'

/** how fast the neck, the head, and the lean ease toward what a state asks, per second */
const NECK_RATE = 2.5
const PITCH_RATE = 3
const LEAN_RATE = 3
/** how fast gait eases in and out, per second */
const GAIT_RATE = 8
/** the fastest it turns, rad/s */
const TURN = 0.8
/** a stalk ends this close to its spot, metres */
const ARRIVE = 0.1
/** a spot is clear of a neighbour by its spacing and this much more, metres */
const MARGIN = 0.2

/**
 * The Great Blue Heron, from docs/research/2026-09-27-great-blue-heron.md, section 11 (behaviour in section 7, the
 * poses in section 6). Sourced: the strike rate the shares and times give (0.2-0.3 a minute: Willard 1977, Bovino &
 * Burtt 1979), the catch rate (41%: Bovino & Burtt 1979), and the strike's bill angle (photo, 70-90 degrees). The
 * waits, the stalk's speed, the draw-back and strike times, the bouts and rests, the body's tilt at rest, and the
 * spacing are estimates the research marks as such. `strike.ahead` is where the built model's bill goes in (Task 6).
 */
export const GREAT_BLUE_HERON: HeronSettings = {
  wait: { seconds: [10, 60], peer: { chance: 0.33, seconds: [1, 3], pitch: 0.25 }, turn: { chance: 0.3, rate: 0.15 } },
  next: { strike: 0.3, stalk: 0.5, alert: 0.1 },
  stalk: { metres: [0.5, 2], speed: 0.04, neck: 0.55 },
  strike: { draw: 0.4, drawNeck: 0.35, down: 0.12, hold: 0.3, depth: 0.08, reachAngle: 1.4, lean: 0.45, ahead: 0.3, ring: 0.6 },
  swallow: { chance: 0.4, seconds: [1.5, 4], pitch: 0.6 },
  alert: { seconds: [4, 15], lean: -0.2 },
  bout: { seconds: [600, 1500] },
  rest: { seconds: [180, 600], lean: -0.35 },
  spacing: { same: 10, other: 3 },
}

/**
 * The Great Egret, from docs/research/2026-09-27-great-egret.md, section 11. Sourced: the stalk's speed (0.04-0.05
 * m/s: Brzorad et al. 2004, Mincey 2006), the strike rate the shares and times give (0.4-0.9 a minute: Mincey 2006,
 * Willard 1977), the catch rate (0.52-0.68: Moreno et al. 2005, Mincey 2006), and the strike's and swallow's bill
 * angles (photos). The rest are estimates the research marks as such.
 */
export const GREAT_EGRET: HeronSettings = {
  wait: { seconds: [4, 20], peer: { chance: 0.33, seconds: [1, 3], pitch: 0.25 }, turn: { chance: 0.3, rate: 0.2 } },
  next: { strike: 0.4, stalk: 0.5, alert: 0.05 },
  stalk: { metres: [0.3, 1.5], speed: 0.05, neck: 0.6 },
  strike: { draw: 0.3, drawNeck: 0.35, down: 0.1, hold: 0.25, depth: 0.06, reachAngle: 1.2, lean: 0.45, ahead: 0.3, ring: 0.5 },
  swallow: { chance: 0.5, seconds: [1, 3], pitch: 0.4 },
  alert: { seconds: [3, 10], lean: -0.2 },
  bout: { seconds: [300, 900] },
  rest: { seconds: [120, 480], lean: -0.45 },
  spacing: { same: 5, other: 3 },
}

const HERONS: Record<string, HeronSettings> = { grbher3: GREAT_BLUE_HERON, greegr: GREAT_EGRET }

/** The heron settings for a species; the Great Blue Heron's for any other. */
export function heronFor(species?: string): HeronSettings {
  return (species && HERONS[species]) || GREAT_BLUE_HERON
}

/**
 * The water the heron style stands in, metres deep: every point of a heron's zone lies in it (the zone-terrain test
 * holds that). Both herons most often feed 15-25 cm deep (Willard 1977); 22 cm is the deepest that leaves 25 mm of the
 * shorter-legged egret's bare tibia above the water (docs/research/2026-09-27-great-egret.md, section 6).
 */
export const HERON_WATER: Range = [0.05, 0.22]

/**
 * How close a heron lets another come: its own species' spacing for one of its own group (the spawner gives each
 * species' herons a group, as it does a flock), else the larger of the two birds' spacing for other herons.
 */
function keepFrom(n: Neighbour, group: FlockGroup | undefined, spacing: HeronSettings['spacing']): number {
  return group !== undefined && n.group === group ? spacing.same : Math.max(spacing.other, n.spacing ?? 0)
}

/**
 * The `heron` style on `wade`: it stands in the shallows with its neck coiled and waits, now and then stalking a few
 * slow steps, striking with a ring where the bill goes in, swallowing with its head tipped up after a catch, or
 * stretching up alert. Feeding bouts alternate with rests, hunched with the neck folded. It keeps its distance from the
 * other herons (ctx.neighbours), starting clear of them, choosing spots clear of them, and stopping short of them.
 */
export function createHeron(ctx: BehaviorContext, startX: number, startZ: number, S: HeronSettings = heronFor(ctx.species)): BehaviorController {
  const zone = polygonOf(ctx)
  let x = startX, z = startZ, heading = ctx.rng() * Math.PI * 2
  let state: State = 'wait'
  let timer = between(ctx.rng, S.wait.seconds)
  let bout = between(ctx.rng, S.bout.seconds)
  let tx = x, tz = z
  let strikeT = 0, rang = false, caught = false
  /** the neck and lean a strike's descent starts from */
  let from: { neck: number; lean: number } | null = null
  let peer = 0, turning = 0
  let reachDepth = 0
  const controller: BehaviorController & { spacing: number } = {
    name: 'wade',
    get state() { return state },
    get x() { return x }, get y() { return ctx.ground(x, z) }, get z() { return z }, get heading() { return heading },
    // what it keeps from herons of other species; its own species' spacing it reads from its settings
    spacing: S.spacing.other,
    group: ctx.group,
    update,
  }

  const others = (): Neighbour[] => (ctx.neighbours?.() ?? []).filter(n => n !== controller)
  const clearOf = (px: number, pz: number, extra: number) =>
    others().every(n => Math.hypot(n.x - px, n.z - pz) >= keepFrom(n, ctx.group, S.spacing) + extra)

  function begin(next: State): void {
    state = next
    switch (next) {
      case 'wait':
        timer = between(ctx.rng, S.wait.seconds)
        peer = ctx.rng() < S.wait.peer.chance ? between(ctx.rng, S.wait.peer.seconds) : 0
        turning = ctx.rng() < S.wait.turn.chance ? (ctx.rng() < 0.5 ? -1 : 1) : 0
        break
      case 'stalk': {
        // a spot a few metres off, in the zone and clear of the other herons, or wait again if none of a few tries is
        for (let i = 0; i < 12; i++) {
          const a = ctx.rng() * Math.PI * 2, d = between(ctx.rng, S.stalk.metres)
          const [px, pz] = [x + Math.cos(a) * d, z - Math.sin(a) * d]
          if (pointInPolygon(px, pz, zone.points) && clearOf(px, pz, MARGIN)) { tx = px; tz = pz; timer = 120; return }
        }
        begin('wait')
        break
      }
      case 'strike': {
        strikeT = 0; rang = false; from = null
        caught = ctx.rng() < S.swallow.chance
        // the bill aims `depth` under the surface (y = 0), from feet on the bed at ground(x, z) < 0, and never into the mud
        reachDepth = Math.min(0, ctx.ground(x, z) + S.strike.depth)
        timer = S.strike.draw + S.strike.down + S.strike.hold + 1
        break
      }
      case 'swallow': timer = between(ctx.rng, S.swallow.seconds); break
      case 'alert': timer = between(ctx.rng, S.alert.seconds); break
      case 'hunch': timer = between(ctx.rng, S.rest.seconds); break
    }
  }

  function next(): void {
    if (state === 'hunch') { bout = between(ctx.rng, S.bout.seconds); begin(ctx.rng() < 0.3 ? 'alert' : 'wait'); return }
    if (state === 'strike' && caught) { begin('swallow'); return }
    if (state !== 'wait') { begin('wait'); return }
    if (bout <= 0) { begin('hunch'); return }
    const r = ctx.rng()
    if (r < S.next.strike) begin('strike')
    else if (r < S.next.strike + S.next.stalk) begin('stalk')
    else if (r < S.next.strike + S.next.stalk + S.next.alert) begin('alert')
    else begin('wait')
  }

  function update(dt: number, pose: PoseState): void {
    timer -= dt
    if (state !== 'hunch') bout -= dt
    if (timer <= 0) next()
    let neck = 0.5, pitch = 0, lean = 0, gait = 0
    switch (state) {
      case 'wait': {
        if (peer > 0) { peer -= dt; pitch = -S.wait.peer.pitch }
        if (turning) heading = wrap(heading + turning * S.wait.turn.rate * dt)
        break
      }
      case 'stalk': {
        neck = S.stalk.neck
        gait = 1
        const want = Math.atan2(-(tz - z), tx - x)
        heading = turnToward(heading, want, TURN * dt)
        // it walks only once it faces the spot, and stops short of any heron it would come too close to
        const facing = Math.abs(wrap(want - heading)) < 0.3
        const step = facing ? S.stalk.speed * dt : 0
        const [nx, nz] = [x + Math.cos(heading) * step, z - Math.sin(heading) * step]
        if (step > 0 && pointInPolygon(nx, nz, zone.points) && clearOf(nx, nz, 0)) {
          pose.strideDistance += Math.hypot(nx - x, nz - z)
          x = nx; z = nz
        } else if (step > 0) begin('wait')
        if (Math.hypot(tx - x, tz - z) < ARRIVE) begin('wait')
        break
      }
      case 'strike': {
        strikeT += dt
        const { draw, drawNeck, down, hold } = S.strike
        pose.reachDepth = reachDepth
        pose.reachAngle = S.strike.reachAngle
        if (strikeT < draw) {
          neck = drawNeck
        } else if (strikeT < draw + hold + down) {
          // down along a smoothstep over `down`, so it builds over a few frames at any frame rate, then held
          from ??= { neck: pose.neckExtend, lean: pose.lean.x }
          const k = ease(Math.min(1, (strikeT - draw) / down))
          pose.reach = k
          pose.neckExtend = from.neck + (0.5 - from.neck) * k
          pose.lean.x = from.lean + (S.strike.lean - from.lean) * k
          if (k > 0.9 && !rang) { rang = true; ctx.onRipple?.(x + Math.cos(heading) * S.strike.ahead, z - Math.sin(heading) * S.strike.ahead, S.strike.ring) }
          pose.gait = approach(pose.gait, 0, GAIT_RATE, dt)
          pose.headPitch = approach(pose.headPitch, 0, PITCH_RATE, dt)
          return
        }
        break
      }
      case 'swallow': neck = 1; pitch = S.swallow.pitch; break
      case 'alert': neck = 1; lean = S.alert.lean; break
      case 'hunch': neck = 0; lean = S.rest.lean; break
    }
    pose.reach = approach(pose.reach, 0, 3, dt)
    pose.neckExtend = approach(pose.neckExtend, neck, NECK_RATE, dt)
    pose.headPitch = approach(pose.headPitch, pitch, PITCH_RATE, dt)
    pose.lean.x = approach(pose.lean.x, lean, LEAN_RATE, dt)
    pose.gait = approach(pose.gait, gait, GAIT_RATE, dt)
    if (state !== 'strike') { pose.reachDepth = 0; pose.reachAngle = Math.PI / 2 }
    // a gust ruffles: a tiny roll
    pose.lean.z = approach(pose.lean.z, (ctx.wind().effective - 0.3) * 0.02, 2, dt)
  }

  return controller
}

/**
 * Where a heron starts: anywhere in its zone, no closer to the herons already placed than it keeps from each (its own
 * species' spacing for one of its group, else the larger of the two birds' for another), if one of a few hundred tries
 * is. The spawner calls it with the cast's own random source, as it does startSpot for the swimmers.
 */
export function heronStart(zone: PolygonZone, rng: Rng, group: FlockGroup | undefined, spacing: HeronSettings['spacing'], placed: readonly Neighbour[]): [number, number] {
  let spot = randomPointInPolygon(zone.points, rng)
  for (let i = 0; i < 300; i++) {
    if (placed.every(n => Math.hypot(n.x - spot[0], n.z - spot[1]) >= keepFrom(n, group, spacing) + MARGIN)) return spot
    spot = randomPointInPolygon(zone.points, rng)
  }
  return spot
}
