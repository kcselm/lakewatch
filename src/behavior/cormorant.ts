import type { BehaviorContext, BehaviorController } from './types'
import { approach, between, ease, perchOf, turnToward, wrap } from './types'
import { createSwimmer, pickByShare, mid, type SwimSettings } from './swimmer'
import { pointInPolygon } from '../location/zones'
import type { PoseState } from '../birds/model'

type Range = readonly [number, number]

/** The Double-crested Cormorant's settings on the water. */
export interface CormorantSettings extends SwimSettings {
  /** its time: fishing bouts of `dives` dives; after a bout it rests (cruises or loafs) before it fishes again */
  bouts: { share: number; dives: Range }
  cruising: { share: number; range: Range; ring: { every: number; size: number } }
  loaf: { share: number; seconds: Range }
  /**
   * the dive: a smooth forward slide over `slide` seconds, the bill reaching forward into the water and the body
   * tipping nose down by `lean`, the tail last, until `depth` metres takes it all under; `leap` of the dives start
   * with a small leap, `leapHeight` up over `leapTime` seconds, before the slide
   */
  entry: { slide: number; lean: number; depth: number; leap: number; leapTime: number; leapHeight: number }
  /**
   * under water: `seconds`, uniform; coming up `distance` metres away (uniform), any way, in its water, swum at most
   * `speed` m/s; `tries` at a spot clear of the others. If another bird has come up near the spot meanwhile, it swims on
   * to the nearest clear one for up to `extra` seconds more, then comes up wherever it is.
   */
  under: { seconds: Range; distance: Range; speed: number; tries: number; extra: number }
  /** up head first in `rise` seconds; then on the surface `pause` seconds (mean `pauseMean`) before the next dive */
  resurface: { rise: number; pause: Range; pauseMean: number }
  /** how often a surfacing brings a fish, and how often a catch is a large one */
  catches: { share: number; large: number }
  /** a large fish held crosswise and worked into place for `seconds` before it is swallowed */
  handle: { seconds: Range }
  /** each forward-upward jerk of the head, `jerk` radians at its top over `each` seconds; how many for each size */
  swallow: { jerk: number; each: number; small: Range; large: Range }
  rings: { entry: number; up: number; swallow: number }
}

/**
 * From docs/research/2026-10-04-double-crested-cormorant.md, section 7.1 (the dives and the fish) and 6.2 (the swim).
 * Sourced: dives of 22 s (15-30), surface pauses of 12 s (8-20), bouts of 6-15 dives, one surfacing in six with a fish,
 * one catch in five a large one handled 3-15 s, small ones swallowed in 1-2 jerks and large ones in 4-5. The swim
 * speed (0.3-0.5 m/s), the distance under water, the shares, and the rest are estimates.
 */
export const CORMORANT: CormorantSettings = {
  cruise: { speed: 0.4, seconds: [10, 40] },
  turn: 1.0,
  // fishes alone (research 7.1: 20 of 21 swimming records single): no flock
  flock: { radius: Infinity, retargetSeconds: Infinity, drift: 0, whenFarther: Infinity, apart: 20 },
  spacing: { flock: 5, other: 1.5 },
  // the weights make about two-fifths of its time under water: a bout's dives are about three-fifths under, and it
  // rests about three and a half minutes between bouts (computed)
  bouts: { share: 0.6, dives: [6, 15] },
  cruising: { share: 0.12, range: [2, 6], ring: { every: 2, size: 0.35 } },
  loaf: { share: 0.28, seconds: [90, 240] },
  // a lone bird mostly slides under; a small leap now and then (research 7.1)
  entry: { slide: 1, lean: 0.6, depth: 0.5, leap: 0.2, leapTime: 0.5, leapHeight: 0.06 },
  under: { seconds: [15, 30], distance: [3, 10], speed: 1.5, tries: 24, extra: 5 },
  resurface: { rise: 0.4, pause: [8, 20], pauseMean: 12 },
  catches: { share: 1 / 6, large: 1 / 5 },
  handle: { seconds: [3, 15] },
  swallow: { jerk: 0.45, each: 0.5, small: [1, 2], large: [4, 5] },
  rings: { entry: 0.7, up: 0.5, swallow: 0.15 },
}

type State = 'loaf' | 'cruise' | 'dive' | 'under' | 'surface' | 'handle' | 'swallow' | 'pause'
/** the neck in each state: as modelled (upright, the bill 15 degrees up) loafing; up a little to look about */
export const NECK: Record<State, number> = { loaf: 0.5, cruise: 0.55, dive: 0.6, under: 0.6, surface: 0.7, handle: 0.6, swallow: 0.75, pause: 0.55 }
const step = (v: number, want: number, by: number) => (v < want ? Math.min(want, v + by) : Math.max(want, v - by))
const easeIn = (t: number) => t * t * t
/** a whole number between lo and hi, both included */
const count = (rng: () => number, [lo, hi]: Range) => Math.floor(between(rng, [lo, hi + 1]))

/**
 * The `cormorant` style on swim: a lone bird loafing low in the water, cruising, and fishing in bouts of dives. Each
 * dive is a slide forward and under, now and then after a small leap; it stays down about 22 s and comes up a few
 * metres on, head first, and sometimes with a fish: a small one swallowed at once in a jerk or two of the head, a large
 * one worked crosswise in the bill for seconds first, then swallowed in four or five.
 */
export function createCormorant(ctx: BehaviorContext, startX: number, startZ: number, S: CormorantSettings = CORMORANT): BehaviorController {
  const b = createSwimmer(ctx, startX, startZ, S)
  let state: State = 'loaf'
  let timer = 0, dives = 0, jerks = 0, onState = 0
  let [tx, tz] = [b.x, b.z]
  // how far down the bird is (negative: up, in a leap), easing from `from` to `to` over `over` seconds
  let depth = 0, from = 0, to = 0, over = 0, moved = 0, curve: (t: number) => number = ease
  let leaping = false
  let [ux, uz] = [0, 0], [wentX, wentZ] = [0, 0]
  let reach = 0, tip = 0, sinceRing = 0, clock = 0
  const ring = (size: number) => ctx.onRipple?.(b.x, b.z, size)
  const TABLE = {
    bout: { share: S.bouts.share, mean: mid(S.bouts.dives) * (mid(S.under.seconds) + S.resurface.pauseMean + 2) },
    cruise: { share: S.cruising.share, mean: mid(S.cruise.seconds) },
    loaf: { share: S.loaf.share, mean: mid(S.loaf.seconds) },
  }
  const REST = { cruise: TABLE.cruise, loaf: TABLE.loaf }
  function sinkTo(target: number, seconds: number, shape: (t: number) => number = ease): void {
    from = depth; to = target; over = seconds; moved = 0; curve = shape
  }
  const settled = () => moved >= over
  const go = (s: State, seconds = 0) => { state = s; timer = seconds; onState = 0 }

  function next(afterBout = false): void {
    const pick = afterBout ? pickByShare(ctx.rng, REST) : pickByShare(ctx.rng, TABLE)
    if (pick === 'bout') { dives = count(ctx.rng, S.bouts.dives); dive() }
    else if (pick === 'cruise') { go('cruise', between(ctx.rng, S.cruise.seconds)); [tx, tz] = spot() }
    else go('loaf', between(ctx.rng, S.loaf.seconds))
  }
  /** a spot a few metres off in its water, clear of the others if one of a few tries is */
  function spot(): [number, number] {
    let best: [number, number] = [b.x, b.z]
    for (let i = 0; i < 12; i++) {
      const a = ctx.rng() * Math.PI * 2, r = between(ctx.rng, S.cruising.range)
      const [px, pz] = [b.x + Math.cos(a) * r, b.z - Math.sin(a) * r]
      if (!pointInPolygon(px, pz, b.zone.points)) continue
      best = [px, pz]
      if (b.clearAt(px, pz, 0.5)) break
    }
    return best
  }
  function dive(): void {
    dives--
    go('dive')
    leaping = ctx.rng() < S.entry.leap
    if (leaping) sinkTo(-S.entry.leapHeight, S.entry.leapTime / 2)
    else { sinkTo(S.entry.depth, S.entry.slide, easeIn); ring(S.rings.entry); ctx.onEvent?.('splash', b.x, 0, b.z) }
  }
  function goUnder(): void {
    go('under', between(ctx.rng, S.under.seconds))
    ;[wentX, wentZ] = [b.x, b.z]
    ;[ux, uz] = surfacing()
    // a long way takes the time it takes
    timer = Math.max(timer, Math.hypot(ux - b.x, uz - b.z) / S.under.speed)
    if (Math.hypot(ux - b.x, uz - b.z) > 0.1) b.heading = Math.atan2(-(uz - b.z), ux - b.x)
  }
  /** where it will come up: as far as it draws, any way, in its water, and clear of the others if a try is */
  function surfacing(): [number, number] {
    let best: [number, number] = [b.x, b.z], bestRoom = -Infinity
    for (let i = 0; i < S.under.tries; i++) {
      const a = ctx.rng() * Math.PI * 2, d = between(ctx.rng, S.under.distance)
      const [px, pz] = [b.x + Math.cos(a) * d, b.z - Math.sin(a) * d]
      if (!pointInPolygon(px, pz, b.zone.points)) continue
      if (b.clearAt(px, pz, 1, true)) return [px, pz]
      const room = Math.min(...b.others().map(n => Math.hypot(n.x - px, n.z - pz) - b.spacingTo(n)))
      if (room > bestRoom) { bestRoom = room; best = [px, pz] }
    }
    return best
  }
  /** If the spot isn't clear any more, the nearest one that is and that it can still swim to in `seconds`. */
  function clearOfOthers(seconds: number): void {
    if (b.clearAt(ux, uz, 0, true)) return
    let best: [number, number] | null = null
    const reachable = S.under.speed * seconds
    for (let i = 1; i <= 12 && !best; i++) {
      const r = (reachable * i) / 12
      for (let k = 0; k < 16; k++) {
        const [px, pz] = [b.x + Math.cos((k * Math.PI) / 8) * r, b.z - Math.sin((k * Math.PI) / 8) * r]
        if (pointInPolygon(px, pz, b.zone.points) && b.clearAt(px, pz, 0.05, true) && (!best || Math.hypot(px - ux, pz - uz) < Math.hypot(best[0] - ux, best[1] - uz))) best = [px, pz]
      }
    }
    if (best) [ux, uz] = best
  }
  function resurface(): void {
    if (Math.hypot(b.x - wentX, b.z - wentZ) > 0.1) b.heading = Math.atan2(-(b.z - wentZ), b.x - wentX)
    go('surface')
    sinkTo(0, S.resurface.rise)
    ring(S.rings.up)
  }
  /** on the surface: a fish to deal with, or straight to the pause before the next dive */
  function afterSurfacing(): void {
    if (ctx.rng() < S.catches.share) {
      if (ctx.rng() < S.catches.large) { go('handle', between(ctx.rng, S.handle.seconds)); jerks = count(ctx.rng, S.swallow.large) }
      else { jerks = count(ctx.rng, S.swallow.small); go('swallow', jerks * S.swallow.each) }
    } else pause()
  }
  function pause(): void {
    // skewed toward the short end so its mean is `pauseMean`
    const [lo, hi] = S.resurface.pause
    go('pause', lo + (hi - lo) * ctx.rng() ** ((hi - S.resurface.pauseMean) / (S.resurface.pauseMean - lo)))
  }

  const self: BehaviorController = {
    name: 'swim',
    get state() { return state },
    get x() { return b.x }, get z() { return b.z }, get heading() { return b.heading },
    get y() { return -depth },
    get submerged() { return depth >= S.entry.depth },
    spacing: S.spacing.other,
    group: b.flock.group,
    update(dt: number, pose: PoseState) {
      clock += dt
      timer -= dt
      onState += dt
      moved += dt
      sinceRing += dt
      depth = settled() ? to : from + (to - from) * curve(moved / over)

      if (state === 'cruise') {
        b.swimTo(tx, tz, S.cruise.speed, dt)
        if (b.speed > 0.05 && sinceRing >= S.cruising.ring.every) { sinceRing = 0; ring(S.cruising.ring.size) }
        if (timer <= 0) next()
      } else if (state === 'loaf') {
        b.float(dt)
        if (timer <= 0) next()
      } else if (state === 'dive') {
        b.float(dt)
        // a leap: up, then down onto the water, then the slide
        if (leaping && settled() && to < 0) sinkTo(0, S.entry.leapTime / 2)
        else if (leaping && settled()) { leaping = false; sinkTo(S.entry.depth, S.entry.slide, easeIn); ring(S.rings.entry); ctx.onEvent?.('splash', b.x, 0, b.z) }
        else if (!leaping && settled()) goUnder()
      } else if (state === 'under') {
        const overdue = -timer
        const outOfTime = overdue >= S.under.extra
        if (overdue >= 0 && !outOfTime) clearOfOthers(S.under.extra - overdue)
        const left = Math.hypot(ux - b.x, uz - b.z)
        const by = Math.min(left, (left / Math.max(timer, dt)) * dt, S.under.speed * dt)
        if (left > 1e-9) { b.x += ((ux - b.x) / left) * by; b.z += ((uz - b.z) / left) * by }
        b.speed = 0
        if (outOfTime || (overdue >= 0 && left - by < 1e-9 && b.clearAt(ux, uz, 0, true))) resurface()
      } else if (state === 'surface') {
        b.float(dt)
        if (settled()) afterSurfacing()
      } else if (state === 'handle') {
        b.float(dt)
        if (timer <= 0) go('swallow', jerks * S.swallow.each)
      } else if (state === 'swallow') {
        b.float(dt)
        // a ring at the start of each jerk, the bill flicking at the water
        const k = Math.floor(onState / S.swallow.each), prev = Math.floor((onState - dt) / S.swallow.each)
        if (k !== prev && k < jerks) ring(S.rings.swallow)
        if (timer <= 0) pause()
      } else if (state === 'pause') {
        b.float(dt)
        if (timer <= 0) { if (dives > 0) dive(); else next(true) }
      }

      // posture, each part eased at a steady rate
      const diving = state === 'dive' && !leaping, down = state === 'under'
      // the bill reaches forward and down into the water as it slides under; under water it eases back, out of sight
      reach = step(reach, diving || (down && onState < 1) ? 1 : 0, dt / 0.4)
      tip = step(tip, diving ? 1 : 0, dt / (diving ? 0.5 : 1))
      const kReach = ease(reach)
      pose.reach = kReach
      pose.reachDepth = 0.15 * kReach
      pose.reachAngle = 0.7
      pose.lean.x = S.entry.lean * ease(tip)
      // the tail lies on the water, and goes in last
      pose.tailTilt = 0
      pose.paddle = 0
      // a swallow: forward-upward jerks of the head, each up and back over `each` seconds; a large fish worked in the
      // bill with small turns of the head first
      if (state === 'swallow') {
        const u = (onState % S.swallow.each) / S.swallow.each
        pose.headPitch = onState < jerks * S.swallow.each ? S.swallow.jerk * Math.sin(Math.PI * u) ** 2 : 0
      } else if (state === 'handle') pose.headPitch = 0.08 * Math.sin(clock * Math.PI * 3) * Math.min(1, onState)
      else pose.headPitch = approach(pose.headPitch, 0, 6, dt)
      pose.neckExtend = approach(pose.neckExtend, NECK[state], 3, dt)
      pose.headBob = 0
      pose.lean.z = 0
    },
  }
  b.self = self
  next()
  return self
}

/** A Double-crested Cormorant's settings on its perch. */
export interface CormorantPerchSettings {
  /** the body raised this far, radians (negative lean: nose up); the tail propped on the wood */
  lean: number
  /** minutes between the starts of its drying sessions; the first within `first` minutes of the visit */
  every: Range
  first: Range
  /**
   * a drying session: `settle` seconds standing first, then `bouts` bouts of spreading of `spread` seconds each,
   * `total` seconds of them in all, folded for `folded` seconds between; at most `max` seconds of spreading
   */
  session: { settle: number; bouts: Range; spread: Range; total: Range; folded: Range; max: number }
  /** while spread it faces into the wind within `wind` radians (each bird its own way, a little either side) */
  wind: number
  /** slow flaps of the spread wings: one bout every `every` seconds or so, `seconds` long, at `hz` */
  flaps: { every: Range; seconds: Range; hz: number; spread: number }
  /** resting, the neck drawn in (`low`) or erect (`high`), changing every `every` seconds */
  neck: { low: number; high: number; every: Range }
}

/**
 * From docs/research/2026-10-04-double-crested-cormorant.md, sections 7.2 and 7.3. Sourced: the body 35-45 degrees
 * up and the tail as a prop; bouts of 0.5-3 minutes, 2-4 of them, about 4-5 minutes in all; facing into the wind;
 * slow flaps now and then (Sellers 1995's Great Cormorants). The session's interval is the spec's: the birds on the
 * stumps don't fish this round, so they dry on a schedule, about one in nine spreading over a long visit.
 */
export const CORMORANT_PERCH: CormorantPerchSettings = {
  lean: -0.7,
  every: [25, 45],
  first: [0.5, 9],
  session: { settle: 60, bouts: [2, 4], spread: [30, 180], total: [240, 300], folded: [10, 60], max: 330 },
  wind: 0.17,
  flaps: { every: [20, 45], seconds: [2, 4], hz: 1.2, spread: 0.2 },
  neck: { low: 0.15, high: 0.85, every: [60, 300] },
}

type PerchState = 'rest' | 'session' | 'spread' | 'fold'

/**
 * The `cormorant` style on perch: stands upright on its stump, its tail propped, resting with its neck drawn in or
 * erect; in a drying session, a minute standing, then its wings held out, wrists up and hands hanging, facing into
 * the wind, in bouts with the wings folded between, now and then flapping them slowly. It never leaves the perch.
 */
export function createCormorantPerch(ctx: BehaviorContext, P: CormorantPerchSettings = CORMORANT_PERCH): BehaviorController {
  const [px, py, pz] = perchOf(ctx)
  let heading = ctx.rng() * Math.PI * 2
  let state: PerchState = 'rest'
  let timer = between(ctx.rng, P.first) * 60
  let nextSession = timer
  let clock = 0
  let bouts: number[] = [], bout = 0
  let neckWant = ctx.rng() < 0.5 ? P.neck.low : P.neck.high, neckIn = between(ctx.rng, P.neck.every)
  let flapIn = between(ctx.rng, P.flaps.every), flapping = 0, wingPhase = 0
  // each bird faces the wind its own way, a little either side of square into it
  const own = (ctx.rng() * 2 - 1) * P.wind * 0.5
  const into = () => { const w = ctx.wind(); return Math.atan2(w.dirZ, -w.dirX) + own }

  /** the session's bouts of spreading: `total` seconds split into 2-4, each within `spread` */
  function plan(): number[] {
    const n = count(ctx.rng, P.session.bouts), total = between(ctx.rng, P.session.total)
    const w = Array.from({ length: n }, () => 0.5 + ctx.rng())
    const sum = w.reduce((a, b) => a + b, 0)
    return w.map(x => Math.min(P.session.spread[1], Math.max(P.session.spread[0], (x / sum) * total)))
  }
  function go(s: PerchState, seconds: number): void { state = s; timer = seconds }

  return {
    name: 'perch',
    get state() { return state },
    get x() { return px }, get y() { return py }, get z() { return pz }, get heading() { return heading },
    update(dt: number, pose: PoseState) {
      clock += dt
      timer -= dt
      if (state === 'rest' && clock >= nextSession) {
        bouts = plan(); bout = 0
        nextSession = clock + between(ctx.rng, P.every) * 60
        go('session', P.session.settle)
      } else if (state === 'session' && timer <= 0) go('spread', bouts[bout]!)
      else if (state === 'spread' && timer <= 0) {
        bout++
        if (bout < bouts.length) go('fold', between(ctx.rng, P.session.folded))
        else go('rest', 0)
      } else if (state === 'fold' && timer <= 0) go('spread', bouts[bout]!)

      // turning: into the wind for a session (it squares up while it stands, before it spreads); now and then a shuffle
      // round while it rests
      if (state !== 'rest') heading = turnToward(heading, into(), 0.4 * dt)
      else heading = wrap(heading + Math.sin(clock * 0.05) * 0.02 * dt)

      // slow flaps of the spread wings, in short bouts
      const spread = state === 'spread'
      flapIn -= dt
      if (spread && flapIn <= 0 && flapping <= 0) { flapping = between(ctx.rng, P.flaps.seconds); flapIn = between(ctx.rng, P.flaps.every) }
      flapping -= dt
      const flap = spread && flapping > 0
      wingPhase = flap ? (wingPhase + P.flaps.hz * dt) % 1 : 0
      pose.wingPhase = wingPhase
      pose.wingSpread = flap ? P.flaps.spread : 0
      // the wings open or fold over a little over a second
      pose.dry = step(pose.dry, spread ? 1 : 0, dt / 1.2)

      // upright, the tail on the wood
      pose.lean.x = step(pose.lean.x, P.lean, dt * 0.5)
      pose.lean.z = approach(pose.lean.z, (ctx.wind().effective - 0.3) * 0.03, 2, dt)
      pose.tailProp = step(pose.tailProp, 1, dt)
      pose.tailTilt = 0
      // the neck: drawn in or erect at rest, changing now and then; in a loose S, the head up, while drying
      neckIn -= dt
      if (neckIn <= 0) { neckWant = neckWant === P.neck.low ? P.neck.high : P.neck.low; neckIn = between(ctx.rng, P.neck.every) }
      pose.neckExtend = step(pose.neckExtend, state === 'rest' ? neckWant : 0.6, dt * 0.5)
      pose.headPitch = 0
      pose.reach = 0
    },
  }
}
