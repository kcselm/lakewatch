import type { BehaviorContext, BehaviorController } from './types'
import { approach, between, ease } from './types'
import { createSwimmer, pickByShare, mid, type SwimSettings } from './swimmer'
import { pointInPolygon } from '../location/zones'
import type { PoseState } from '../birds/model'

type Range = readonly [number, number]

/** The American Coot's settings. */
export interface CootSettings extends SwimSettings {
  /** swimming across the zone, the head pumping, a wake behind: its share, speed, and bout */
  travel: { share: number; speed: number; seconds: Range }
  loaf: { share: number; seconds: Range }
  preen: { share: number; seconds: Range }
  /**
   * Between peck bouts: a pause of `seconds`, swimming to feed (`cruise.speed`, the head pumping) `swim` of the time,
   * and otherwise looking up (the `alert` state), the tail flicked up `tail` radians as the head comes up, showing
   * the white undertail, and down again over `flick` seconds.
   */
  pause: { seconds: Range; swim: number }
  alert: { tail: number; flick: number }
  /**
   * the head pump while under way: `perSecond` pumps, the head held still against the water for the first `hold` of
   * each, then thrust forward; `amplitude` is the whole fore-and-aft travel in body lengths at `cruise.speed` and over
   */
  pump: { perSecond: number; hold: number; amplitude: number; ring: { every: number; size: number } }
  /** peck bouts: `perSecond` pecks, the bill at the water for the first `bottom` of each and lifted `lift` of the reach between */
  peck: { share: number; seconds: Range; perSecond: number; bottom: number; lift: number }
  /** one peck bout in `every` ends with the head and neck `depth` metres under for `seconds`, the body tipped `lean` */
  headDip: { every: number; seconds: Range; depth: number; lean: number; ring: number }
  /** rare tip-ups while feeding: `perSecond` of pecking or swimming to feed */
  tipUp: { perSecond: number; seconds: Range; lean: number; tail: number; strokes: number; down: number; up: number }
  /**
   * jump-dives, in bouts of `count`, a bout starting `boutsPerSecond`: the head down for `dip` seconds, a lunge that
   * arcs the body to `lean` and takes it `depth` metres under in `lunge` seconds, `under` seconds under (drawn skewed
   * toward the short end, `skew`), `move` metres from where it went down, back up in `rise` seconds back first, then
   * eating on the surface for `eat` seconds; the next dive of the bout `gap` seconds after surfacing. Under water it
   * swims at most `swim` m/s, and stays down a little longer if it must go round to surface clear of another bird.
   */
  dive: {
    boutsPerSecond: number; count: Range; gap: Range
    dip: Range; lunge: number; lean: number; depth: number
    under: Range; skew: number; move: number; swim: number; rise: number; eat: Range; ring: number
  }
}

/**
 * From docs/research/2026-09-25-american-coot.md, section 11 (behaviour in section 7). Sourced: the dive durations
 * (Batulis & Bongiorno 1972, 1.3-3.5 s by depth; video 1.7-5.5 s), the surface intervals between dives (the same, 10-25 s),
 * and the travelling speed (Trenchard 2012, 0.5 m/s). The rest are estimates from video of a few birds, spring and
 * summer, and the time budget from the breeding budget of Ryan & Dinsmore 1979 and a winter snippet (McKnight 1998).
 */
export const COOT: CootSettings = {
  // the feeding swim at 0.2 m/s (0.15-0.3), 1-5 s between peck bouts; `seconds` is unused (a pause's length is `pause`)
  cruise: { speed: 0.2, seconds: [1, 5] },
  turn: 1.2,
  // six birds, nearest neighbours 0.4-0.9 m: a radius of 2 m gives about 0.7 m; spacing 0.4 m, over its 0.30-0.33 m length
  flock: { radius: 2, retargetSeconds: 60, drift: 3, whenFarther: 4 },
  spacing: { flock: 0.4, other: 0.8 },
  // the dabbler's wake, when it travels
  wake: { every: 1.5, size: 1, above: 0.3 },
  // feeding 0.65 (pecks 0.40, swimming to feed 0.15, head-dips and dives and tip-ups the rest), travel 0.15, loaf
  // 0.10, preen 0.10; travelling at 0.4-0.5 m/s (0.45 here) for the dabbler's cruise bouts
  travel: { share: 0.15, speed: 0.45, seconds: [4, 14] },
  loaf: { share: 0.1, seconds: [10, 60] },
  preen: { share: 0.1, seconds: [5, 20] },
  // Peck bouts separated by 1-5 s of swimming or looking up: 1-4 s here, swimming three times in four. With the
  // travelling, loafing, and preening and the 5% diving, the feeding cycle has 60% of the bird's time: pecking 5 s of
  // each 7.8 s cycle gives 38% (the budget's 40%), and swimming, 0.60 x 2.5 / 7.8 x 0.75 = 14% (the budget's 15%).
  pause: { seconds: [1, 4], swim: 0.75 },
  // an alarmed bird lifts its tail 30-45 degrees (37.5 here); a looking-up bird only flicks it, as a coot does when it
  // turns (the flick's 0.5 s is ours)
  alert: { tail: 0.65, flick: 0.5 },
  // 2.2 a second (1.8-2.6), hold then thrust, the head still for about half of each; the bill travels about 5 cm fore
  // and aft, 17% of the bill-to-tail length; a faint ring every 1-2 s while swimming (1.5 here)
  pump: { perSecond: 2.2, hold: 0.5, amplitude: 0.17, ring: { every: 1.5, size: 0.3 } },
  // bouts of 2-8 s at 2.5 pecks a second, each held 0.15-0.4 s at the bottom (0.2 s here, half the cycle), the head
  // rising 2-3 cm between: about a third of its 60-95 mm reach from rest to the water
  peck: { share: 0.4, seconds: [2, 8], perSecond: 2.5, bottom: 0.5, lift: 0.3 },
  // about one peck bout in 3-4 ends in a dip (3.5 here) of 0.8-1.5 s, the body 5-10 degrees nose-down (7.5); the head
  // and neck 0.1 m under is ours
  headDip: { every: 3.5, seconds: [0.8, 1.5], depth: 0.1, lean: 0.13, ring: 0.4 },
  // 1-2 s, 45-90 degrees nose-down (67.5 here), the tail up, the feet paddling; about once per bird in 5-10 minutes,
  // which is once in 5 minutes of the 55% of its time it spends pecking or swimming to feed; the paddle rate is the
  // Mallard's, and the tilt times the dabbler's
  tipUp: { perSecond: 1 / 300, seconds: [1, 2], lean: 1.18, tail: 0.5, strokes: 2.4, down: 0.35, up: 0.25 },
  dive: {
    // a bout about once in 5-10 minutes (7.5 here), 2-5 dives 10-25 s apart
    boutsPerSecond: 1 / 450, count: [2, 5], gap: [10, 25],
    // the head down 0.2-0.3 s, then a lunge that arcs the body near vertical (80 degrees here) and has it under in about
    // 0.5 s; 0.4 m down takes the whole bird, feet and tail, under the water (ours)
    dip: [0.2, 0.3], lunge: 0.5, lean: 1.4, depth: 0.4,
    // under 2.5 s on average (1.3-5.5): drawn as 1.3 + 4.2 u^2.5, whose mean is 2.5; moving 0-1 m, mostly under 0.5
    // (u^2 m, three in four under 0.5); up back first in 0.3 s (ours); eating what it brought up for 2-5 s
    under: [1.3, 5.5], skew: 2.5, move: 1, swim: 1, rise: 0.3, eat: [2, 5],
    // a ring of about 0.5-1 m on every dive, going down and coming up
    ring: 0.55,
  },
}

type State = 'travel' | 'cruise' | 'peck' | 'headDip' | 'tipUp' | 'dive' | 'loaf' | 'preen' | 'alert'
type DivePhase = 'dip' | 'lunge' | 'under' | 'rise' | 'eat'
const NECK: Record<State, number> = { travel: 0.6, cruise: 0.6, peck: 0.8, headDip: 1, tipUp: 1, dive: 1, loaf: 0.15, preen: 0.3, alert: 1 }
const step = (v: number, want: number, by: number) => (v < want ? Math.min(want, v + by) : Math.max(want, v - by))

/** The hold-then-thrust head pump at phase f (0..1): held still against the water while the body moves on, then thrust. */
export function pumpWave(f: number, hold: number): number {
  return f < hold ? 1 - (2 * f) / hold : -1 + 2 * ease((f - hold) / (1 - hold))
}

/**
 * The `coot` style: peck at the surface in bouts, between them swim to feed with the head pumping or look up with a
 * flick of the tail, now and then dip the head or tip up, jump-dive in bouts, travel, loaf, and preen.
 */
export function createCoot(ctx: BehaviorContext, startX: number, startZ: number, S: CootSettings = COOT): BehaviorController {
  const b = createSwimmer(ctx, startX, startZ, S)
  let state: State = 'loaf'
  let timer = 0
  let clock = 0
  let following = false
  let [tx, tz] = [b.x, b.z]
  // the head pump's and the peck's cycles, and the paddling feet's
  let pumpPhase = 0, peckPhase = 0, paddlePhase = 0
  // eased posture: the peck (0 head at rest .. 1 pecking), the head under, the tip-up, the dive's arc over and the
  // kick of its feet, and the head pump's reach
  let pecking = 0, under = 0, tilt = 0, arc = 0, kick = 0, pumpK = 0, preen = 0
  let sinceWake = 0, sinceRing = 0
  // the dive: its phase, how deep the bird is (0 afloat .. 1 all the way under), where it went down and comes up
  let phase: DivePhase = 'dip'
  let sink = 0
  let [dx0, dz0, ux, uz] = [0, 0, 0, 0]
  let underFor = 0
  let bout = { left: 0, nextAt: Infinity }

  // a feeding cycle is a peck bout, one time in `every` a head-dip, and a pause; it takes the pecks' share scaled up
  const cycle = mid(S.peck.seconds) + mid(S.headDip.seconds) / S.headDip.every + mid(S.pause.seconds)
  const TABLE = {
    travel: { share: S.travel.share, mean: mid(S.travel.seconds) },
    peck: { share: (S.peck.share * cycle) / mid(S.peck.seconds), mean: cycle },
    loaf: { share: S.loaf.share, mean: mid(S.loaf.seconds) },
    preen: { share: S.preen.share, mean: mid(S.preen.seconds) },
  }
  /** after a peck bout (and its dip): swim to feed, or look up */
  function pause(): void {
    state = ctx.rng() < S.pause.swim ? 'cruise' : 'alert'
    timer = between(ctx.rng, S.pause.seconds)
    looked = 0
    if (state === 'cruise') [tx, tz] = b.spot(clock)
  }
  let looked = 0
  const ring = (size: number, ahead = 0) => ctx.onRipple?.(b.x + Math.cos(b.heading) * ahead, b.z - Math.sin(b.heading) * ahead, size)

  function next(): void {
    following = b.flock.distance(b.x, b.z) > S.flock.whenFarther
    if (following) {
      state = 'travel'
      ;[tx, tz] = b.spot(clock)
      timer = Math.hypot(tx - b.x, tz - b.z) / S.travel.speed + 10
      return
    }
    // a dive bout under way: the next dive once its gap is up, from the surface
    if (bout.left > 0 && clock >= bout.nextAt) { dive(); return }
    state = pickByShare(ctx.rng, TABLE)
    timer = between(ctx.rng, state === 'travel' ? S.travel.seconds : S[state].seconds)
    if (state === 'travel') [tx, tz] = b.spot(clock)
  }
  function dive(): void {
    state = 'dive'
    phase = 'dip'
    timer = between(ctx.rng, S.dive.dip)
    bout.left--
  }
  /** Where it comes up: up to `move` metres from where it went down, about the way it faces, in the zone and clear of the others. */
  function surfacing(): void {
    ;[dx0, dz0] = [b.x, b.z]
    const d = S.dive.move * ctx.rng() ** 2
    const a = b.heading + (ctx.rng() - 0.5) * (Math.PI / 2)
    let len = d
    while (len > 0.01 && !pointInPolygon(b.x + Math.cos(a) * len, b.z - Math.sin(a) * len, b.zone.points)) len /= 2
    if (len <= 0.01) len = 0
    ;[ux, uz] = [b.x + Math.cos(a) * len, b.z - Math.sin(a) * len]
  }
  /**
   * A surfacing spot clear of the other swimmers, those under water too (they may come up there): the nearest to the
   * planned one within `move` of the dive, if needed.
   */
  function clearSpot(): void {
    if (b.clearAt(ux, uz, 0, true)) return
    let best: [number, number] | null = null
    for (let r = 0.25; r <= 1; r += 0.25) {
      for (let k = 0; k < 16; k++) {
        const a = (k * Math.PI) / 8
        const [px, pz] = [dx0 + Math.cos(a) * r * S.dive.move, dz0 - Math.sin(a) * r * S.dive.move]
        if (!pointInPolygon(px, pz, b.zone.points) || !b.clearAt(px, pz, 0, true)) continue
        if (!best || Math.hypot(px - ux, pz - uz) < Math.hypot(best[0] - ux, best[1] - uz)) best = [px, pz]
      }
    }
    if (best) [ux, uz] = best
  }
  let checked = false

  const self: BehaviorController = {
    name: 'swim',
    get state() { return state },
    get x() { return b.x }, get z() { return b.z }, get heading() { return b.heading },
    // afloat at the waterline; under water, the dive's depth
    get y() { return -S.dive.depth * ease(sink) },
    // all the way down, from the end of the lunge until it starts up
    get submerged() { return sink >= 1 },
    spacing: S.spacing.other,
    group: b.flock.group,
    update(dt: number, pose: PoseState) {
      clock += dt
      timer -= dt
      sinceRing += dt
      // a dive bout starts now and then, whatever the bird is doing on the surface; its first dive comes when it next
      // chooses what to do
      if (bout.left <= 0 && state !== 'dive' && ctx.rng() < S.dive.boutsPerSecond * dt) bout = { left: Math.floor(between(ctx.rng, [S.dive.count[0], S.dive.count[1] + 1])), nextAt: clock }
      const feeding = state === 'peck' || state === 'cruise'
      if (state === 'dive') {
        if (phase === 'dip' || phase === 'eat') b.float(dt)
        if (phase === 'dip' && timer <= 0) { phase = 'lunge'; timer = S.dive.lunge; ring(S.dive.ring, 0.1) }
        else if (phase === 'lunge') {
          sink = step(sink, 1, dt / S.dive.lunge)
          if (timer <= 0) {
            phase = 'under'
            underFor = S.dive.under[0] + (S.dive.under[1] - S.dive.under[0]) * ctx.rng() ** S.dive.skew
            timer = underFor
            checked = false
            surfacing()
          }
        } else if (phase === 'under') {
          // swimming under water toward where it will come up, evenly over the time it stays down; halfway, it makes
          // sure no one is floating on the spot, and goes round to a clear one if they are
          if (!checked && timer <= underFor / 2) { checked = true; clearSpot() }
          const left = Math.hypot(ux - b.x, uz - b.z)
          const by = Math.min(left, (left / Math.max(timer, dt)) * dt, S.dive.swim * dt)
          if (left > 1e-9) { b.x += ((ux - b.x) / left) * by; b.z += ((uz - b.z) / left) * by }
          if (timer <= 0 && left - by < 1e-9) { phase = 'rise'; timer = S.dive.rise; b.speed = 0 }
        } else if (phase === 'rise') {
          sink = step(sink, 0, dt / S.dive.rise)
          if (timer <= 0) { sink = 0; phase = 'eat'; timer = between(ctx.rng, S.dive.eat); ring(S.dive.ring) }
        } else if (phase === 'eat' && timer <= 0) {
          bout.nextAt = clock + between(ctx.rng, S.dive.gap)
          next()
        }
      } else if (state === 'travel' || state === 'cruise') {
        const speed = state === 'travel' ? S.travel.speed : S.cruise.speed
        if (b.swimTo(tx, tz, speed, dt) < 0.05) {
          if (following || timer < 1) next()
          else [tx, tz] = b.spot(clock)
        } else if (timer <= 0) next()
      } else if (state === 'peck') {
        b.float(dt)
        if (timer <= 0) {
          if (ctx.rng() < 1 / S.headDip.every) { state = 'headDip'; timer = between(ctx.rng, S.headDip.seconds); ring(S.headDip.ring, 0.1) }
          else pause()
        }
      } else if (state === 'headDip') {
        b.float(dt)
        if (timer <= 0) { ring(S.headDip.ring, 0.1); pause() }
      } else if (state === 'tipUp') {
        b.float(dt)
        if (timer <= 0) next()
      } else {
        b.float(dt)
        if (timer <= 0) next()
      }
      // a rare tip-up while feeding
      if (feeding && state !== 'dive' && ctx.rng() < S.tipUp.perSecond * dt) {
        state = 'tipUp'
        timer = between(ctx.rng, S.tipUp.seconds) + (S.tipUp.down - S.tipUp.up) / 2
      }
      sinceWake += dt
      if (b.speed > S.wake.above && sinceWake >= S.wake.every) { sinceWake = 0; ring(S.wake.size) }
      // the faint ring of the pump while it swims to feed (travelling, it leaves a wake instead)
      if (state === 'cruise' && b.speed > S.cruise.speed / 2 && sinceRing >= S.pump.ring.every) { sinceRing = 0; ring(S.pump.ring.size, 0.1) }

      // the head pump, only while it swims: its reach grows with the speed, up to the feeding swim's
      pumpPhase = (pumpPhase + S.pump.perSecond * dt) % 1
      pumpK = step(pumpK, state === 'dive' ? 0 : Math.min(1, b.speed / S.cruise.speed), dt / 0.2)
      pose.headBob = (pumpK * S.pump.amplitude * pumpWave(pumpPhase, S.pump.hold)) / 2
      // the peck: the bill at the water for the first part of each cycle, lifting a little between
      peckPhase += S.peck.perSecond * dt
      const f = peckPhase % 1
      const wave = f < S.peck.bottom ? 1 : 1 - S.peck.lift * Math.sin((Math.PI * (f - S.peck.bottom)) / (1 - S.peck.bottom)) ** 2
      pecking = step(pecking, state === 'peck' ? 1 : 0, dt / 0.3)
      under = step(under, state === 'headDip' || (state === 'dive' && phase === 'dip') ? 1 : 0, dt / 0.25)
      const wantTilt = state === 'tipUp' ? 1 : 0
      tilt = step(tilt, wantTilt, dt / (wantTilt > tilt ? S.tipUp.down : S.tipUp.up))
      const kPeck = ease(pecking), kUnder = ease(under), kTilt = ease(tilt)
      pose.reach = Math.max(kPeck * wave, kUnder)
      pose.reachDepth = kUnder * S.headDip.depth
      pose.reachAngle = Math.PI / 2
      // the lunge arcs the body over as it goes under, feet kicking; under water it levels to come up back first,
      // the nose a fifth of the way down
      const diving = state === 'dive'
      arc = step(arc, diving && phase === 'lunge' ? 1 : diving && (phase === 'under' || phase === 'rise') ? 0.2 : 0, dt / S.dive.lunge)
      kick = step(kick, diving && phase === 'lunge' ? 1 : 0, dt / 0.25)
      pose.lean.x = Math.max(kUnder * S.headDip.lean, kTilt * S.tipUp.lean, ease(arc) * S.dive.lean)
      // looking up, the tail flicks up and down again: a sin^2 over the flick's length
      looked += dt
      const flick = state === 'alert' && looked < S.alert.flick ? Math.sin((Math.PI * looked) / S.alert.flick) ** 2 : 0
      pose.tailTilt = approach(pose.tailTilt, Math.max(flick * S.alert.tail, kTilt * S.tipUp.tail, ease(kick) * S.tipUp.tail), 12, dt)
      // the feet show in a tip-up and as the lunge takes the bird under
      pose.paddle = Math.max(kTilt, ease(kick))
      paddlePhase = (paddlePhase + S.tipUp.strokes * dt) % 1
      pose.paddlePhase = paddlePhase
      preen = approach(preen, state === 'preen' ? 1 : 0, 2, dt)
      pose.lean.z = preen * 0.1 * Math.sin(clock * Math.PI * 0.8)
      pose.neckExtend = approach(pose.neckExtend, NECK[state], 3, dt)
    },
  }
  b.self = self
  next()
  return self
}
