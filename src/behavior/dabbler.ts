import type { BehaviorContext, BehaviorController } from './types'
import { approach, between, ease } from './types'
import { createSwimmer, pickByShare, mid, type SwimSettings } from './swimmer'
import type { PoseState } from '../birds/model'

type Range = readonly [number, number]

/** A dabbling duck's settings: the shared swimmer's, its time budget, and how it feeds. */
export interface DabblerSettings extends SwimSettings {
  /** shares of the bird's time; they need not sum to 1. How long a cruise lasts is `cruise.seconds`. */
  cruising: { share: number }
  loaf: { share: number; seconds: Range }
  preen: { share: number; seconds: Range }
  alert: { share: number; seconds: Range }
  /**
   * feeding's share of the bird's time, and how it splits between bouts of surface dabbling, head-dips, and tip-ups.
   * A bout's share counts its pauses: the level spells between tip-ups, the bill at the surface between head-dips.
   */
  feeding: { share: number; split: { surface: number; headDip: number; tipUp: number } }
  /** surface dabbling: the bill at the water, swimming slowly, a small ring every 1-2 s where the bill works */
  surface: { seconds: Range; speed: number; reachAngle: number; lean: number }
  /**
   * head-dips, in bouts of `dips`, each `seconds` long with the head and upper neck `depth` metres under, and `gap`
   * seconds with the bill back at the surface between them; the body tipped `lean` and the tail cocked `tail`
   */
  headDip: { dips: Range; seconds: Range; gap: Range; depth: number; lean: number; tail: number }
  /**
   * tip-ups, in bouts of `count`, each `seconds` long with the body past half-way up (`lean` radians nose-down at
   * full tilt, the tail cocked `tail`, the feet out and paddling `strokes` a second), `gap` seconds level between;
   * `down` and `up` are how long it takes to tilt over and to come back level, eased at both ends
   */
  tipUp: { count: Range; seconds: Range; gap: Range; lean: number; tail: number; strokes: number; down: number; up: number }
  /** ring sizes: at the start and end of each tip-up and head-dip, and while dabbling; `ahead` is where the bill works */
  rings: { tipUp: number; headDip: number; dabble: number; dabbleEvery: Range; ahead: number }
}

/**
 * The Mallard, from docs/research/2026-09-25-mallard.md, section 11 (behaviour in section 7). Sourced: the cruise
 * speed (Prange & Schmidt-Nielsen 1970), the time budget (Gray et al. 1996, open water, both sexes, winter; the 3%
 * courting, fighting, and flying left out), the feeding split (Szijj 1965: 42 / 44 / 7 in proportion), the tip-up's
 * 4.2 s mean and 5.8 s maximum (Szijj 1965) and near-vertical body, and the 2.4 strokes a second (Prange &
 * Schmidt-Nielsen 1970). The rest are estimates from a few birds on video.
 */
export const MALLARD: DabblerSettings = {
  // 0.48 m/s (0.45-0.51); cruise bouts of 4-14 s are the old swim's, an estimate
  cruise: { speed: 0.48, seconds: [4, 14] },
  // 0.8-1.2 rad/s estimated from video; the old swim's 1.2
  turn: 1.2,
  // a loose group of four within about 3-5 m, flock radius 2-3 m (estimates); the target drifting 3 m a minute is ours
  flock: { radius: 2.5, retargetSeconds: 60, drift: 3, whenFarther: 5 },
  // nearest neighbour 0.3-2 m while feeding: 0.4, just over the 0.36 m traced length, so two never overlap; 0.8 from
  // birds of other flocks, as the Gadwall's unpaired birds keep 0.3-1.2 m (gadwall section 7.6)
  spacing: { flock: 0.4, other: 0.8 },
  // a full-size ring while under way, as the old swim made, but every 1.5 s rather than 0.9: the grebe's measured wake
  // rhythm (pied-billed-grebe section 11), and what the ring buffer holds for 24 swimmers (Task 12)
  wake: { every: 1.5, size: 1, above: 0.3 },
  cruising: { share: 0.311 },
  loaf: { share: 0.068, seconds: [5, 20] },
  preen: { share: 0.065, seconds: [5, 15] },
  alert: { share: 0.057, seconds: [1, 4] },
  feeding: { share: 0.468, split: { surface: 0.1, headDip: 0.45, tipUp: 0.45 } },
  // bouts of 5-25 s (the lab's shallow feeding bouts were 22.2 s), swimming at 0.05-0.15 m/s; the bill about 30 degrees
  // down and the body tipped 5 degrees, from the Wigeon's measured surface-picking pose (american-wigeon section 11)
  surface: { seconds: [5, 25], speed: 0.1, reachAngle: 0.5, lean: 0.09 },
  // 0.5-3 s a dip, mean about 2 (so 1-3 here); the head and part of the neck under, the body level or tipped 0-15
  // degrees (7.5 here), the tail up about 10 degrees. Dips a bout and the pauses are the Gadwall's (gadwall section 11:
  // 3-8, about 1 s up), shortened to 2-6 for a bird that tips up as much as it dips. The head goes 0.15 m under, where
  // the Gadwall's head-dips find plants 10-30 cm down (gadwall section 7.3).
  headDip: { dips: [2, 6], seconds: [1, 3], gap: [0.5, 1.5], depth: 0.15, lean: 0.13, tail: 0.17 },
  // mean 4 s (1.5-6): 2-6 here; 2-4 in a bout with 1-5 s level between; 80-90 degrees (85 here, 1.48 rad); 0.2-0.5 s
  // over and 0.2-0.3 s back (0.35 and 0.25 here); the tail's cock at full tilt is an estimate
  tipUp: { count: [2, 4], seconds: [2, 6], gap: [1, 5], lean: 1.48, tail: 0.4, strokes: 2.4, down: 0.35, up: 0.25 },
  // ring sizes are estimates: a tip-up's swirl larger than a head-dip's, a dabbling bill's smaller than a dowitcher's
  rings: { tipUp: 0.7, headDip: 0.5, dabble: 0.3, dabbleEvery: [1, 2], ahead: 0.18 },
}

/**
 * The Gadwall, from docs/research/2026-09-25-gadwall.md, section 11: it dips and dabbles more and tips up less than
 * the Mallard, in shorter tip-ups. Its cruise speed and time budget are estimates (the budget from Paulus 1984's 44%
 * feeding in October and Gray et al. 1996); its tip-ups were timed on video (n = 23).
 */
export const GADWALL: DabblerSettings = {
  ...MALLARD,
  // 0.40 m/s (0.35-0.48), a smaller hull than the Mallard's
  cruise: { speed: 0.4, seconds: [4, 14] },
  // a pair plus one: the pair 0.1-0.45 m apart (0.35 here, over its 0.325 m length), others 0.3-1.2 m; radius 1.5 m
  // for three birds is ours
  flock: { radius: 1.5, retargetSeconds: 60, drift: 3, whenFarther: 3 },
  spacing: { flock: 0.35, other: 0.8 },
  cruising: { share: 0.2 },
  loaf: { share: 0.2, seconds: [10, 60] },
  alert: { share: 0.1, seconds: [1, 3] },
  preen: { share: 0.05, seconds: [5, 15] },
  feeding: { share: 0.45, split: { surface: 0.5, headDip: 0.38, tipUp: 0.12 } },
  // the bill and face in the water for 2-10 s at about 0.05 m/s
  surface: { seconds: [2, 10], speed: 0.05, reachAngle: 0.5, lean: 0.09 },
  // 1-3 s under, about 1 s up between, 3-8 in a bout; the body tipped 10-30 degrees (20 here), the tail not raised
  headDip: { dips: [3, 8], seconds: [1, 3], gap: [0.5, 1.5], depth: 0.15, lean: 0.35, tail: 0 },
  // 3.1 s (1.1-4.5, most 2-4): 1.7-4.5 here, mean 3.1; 5-15 in a row, 2-4 s level between; tilting in and out in
  // 0.25-0.5 s; about 2.5 strokes a second
  tipUp: { count: [5, 15], seconds: [1.7, 4.5], gap: [2, 4], lean: 1.48, tail: 0.4, strokes: 2.5, down: 0.35, up: 0.25 },
}

/**
 * The American Wigeon, from docs/research/2026-09-25-american-wigeon.md, section 11: a dabbler with its own settings.
 * Its open-water feeding is surface picking and head-dips, a dip about every 6 s (Knapton & Knudsen 1978, computed),
 * with rare tip-ups. Everything but the dip rate is an estimate.
 */
export const WIGEON: DabblerSettings = {
  ...MALLARD,
  // 0.4 m/s (0.3-0.5)
  cruise: { speed: 0.4, seconds: [4, 14] },
  // nearest neighbour 0.3-1.0 m (0.35 here, over its 0.33 m length); radius 1.5 m for five birds is ours
  flock: { radius: 1.5, retargetSeconds: 60, drift: 3, whenFarther: 3 },
  spacing: { flock: 0.35, other: 0.8 },
  // feed 50%, cruise 15-20% (17.5 here), loaf 25%, preen 10%, alert 2%
  cruising: { share: 0.175 },
  loaf: { share: 0.25, seconds: [10, 60] },
  preen: { share: 0.1, seconds: [5, 15] },
  alert: { share: 0.02, seconds: [1, 3] },
  // tip-ups at most 10% of feeding (8 here); the rest split evenly between surface picking and dip bouts, which the
  // research doesn't divide
  feeding: { share: 0.5, split: { surface: 0.46, headDip: 0.46, tipUp: 0.08 } },
  // surface picking in bouts of 5-20 s at 0.1-0.2 m/s, the body pitched 5-10 degrees bow-down
  surface: { seconds: [5, 20], speed: 0.15, reachAngle: 0.5, lean: 0.13 },
  // a dip of 1-2 s about every 6 s: 3-6 s of picking at the surface between; 3-8 in a bout (ours); the body pitched
  // 10-15 degrees
  headDip: { dips: [3, 8], seconds: [1, 2], gap: [3, 6], depth: 0.15, lean: 0.22, tail: 0 },
  // 2-4 s, 70-90 degrees (80 here, 1.40 rad); two or three together (ours), paddling as the Gadwall does
  tipUp: { count: [2, 3], seconds: [2, 4], gap: [1, 5], lean: 1.4, tail: 0.4, strokes: 2.5, down: 0.35, up: 0.25 },
}

/** A species' dabbler settings, keyed by its code; any other dabbler (or none named) swims as a Mallard. */
export const DABBLERS: Readonly<Record<string, DabblerSettings>> = { mallar3: MALLARD, gadwal: GADWALL, amewig: WIGEON }
export const dabblerFor = (species?: string): DabblerSettings => (species !== undefined && Object.hasOwn(DABBLERS, species) ? DABBLERS[species]! : MALLARD)

type State = 'cruise' | 'loaf' | 'preen' | 'alert' | 'surfaceDabble' | 'headDip' | 'tipUp'

/** neck extension for each state: loafing drawn in, alert and feeding stretched */
const NECK: Record<State, number> = { cruise: 0.6, loaf: 0.15, preen: 0.3, alert: 1, surfaceDabble: 0.8, headDip: 1, tipUp: 1 }
/** how long the head takes to go under, or come up, s */
const DIP = 0.3
/** A whole number from lo to hi, each equally likely. */
const count = (rng: () => number, [lo, hi]: Range) => lo + Math.floor(rng() * (hi - lo + 1))
/** Move `v` toward `want` by at most `by`. */
const step = (v: number, want: number, by: number) => (v < want ? Math.min(want, v + by) : Math.max(want, v - by))

/**
 * The `dabbler` style: cruise from spot to spot near the flock, loaf and drift with the wind, preen, look about, and
 * feed in bouts: dabbling at the surface as it swims slowly, dipping its head, or tipping up. A bird that finds itself
 * farther from the flock than `whenFarther` swims back to it first.
 */
export function createDabbler(ctx: BehaviorContext, startX: number, startZ: number, S: DabblerSettings = MALLARD): BehaviorController {
  const b = createSwimmer(ctx, startX, startZ, S)
  let state: State = 'loaf'
  let timer = 0
  let clock = 0
  let following = false
  let [tx, tz] = [b.x, b.z]
  // a feeding bout: how many dips or tip-ups are left, and whether the bird is in one (under or up) or between
  let left = 0
  let active = false
  // eased posture: how far the bill is toward the water (0 head up .. 1 at the surface), how far the head is under,
  // and how far the body is tipped up, each 0..1 moving at a steady rate and shaped with smoothstep
  let bill = 0, under = 0, tilt = 0
  let preen = 0
  let sinceWake = 0, nextDabble = 0
  let paddlePhase = 0

  const TABLE = {
    cruise: { share: S.cruising.share, mean: mid(S.cruise.seconds) },
    loaf: { share: S.loaf.share, mean: mid(S.loaf.seconds) },
    preen: { share: S.preen.share, mean: mid(S.preen.seconds) },
    alert: { share: S.alert.share, mean: mid(S.alert.seconds) },
    surfaceDabble: { share: S.feeding.share * S.feeding.split.surface, mean: mid(S.surface.seconds) },
    // a bout is a pause and a dip (or a tip-up), `dips` (or `count`) times over
    headDip: { share: S.feeding.share * S.feeding.split.headDip, mean: mid(S.headDip.dips) * (mid(S.headDip.seconds) + mid(S.headDip.gap)) },
    tipUp: { share: S.feeding.share * S.feeding.split.tipUp, mean: mid(S.tipUp.count) * (mid(S.tipUp.seconds) + mid(S.tipUp.gap)) },
  }

  const ring = (size: number, ahead: number) => ctx.onRipple?.(b.x + Math.cos(b.heading) * ahead, b.z - Math.sin(b.heading) * ahead, size)

  function next(): void {
    following = b.flock.distance(b.x, b.z) > S.flock.whenFarther
    if (following) {
      state = 'cruise'
      ;[tx, tz] = b.spot(clock)
      // a guard, in case a neighbour or the zone's edge keeps it from getting there
      timer = Math.hypot(tx - b.x, tz - b.z) / S.cruise.speed + 10
      return
    }
    state = pickByShare(ctx.rng, TABLE)
    // a bout opens with a pause, so a dip or tip-up never runs straight on from the last bout's
    if (state === 'headDip') { left = count(ctx.rng, S.headDip.dips); active = false; timer = between(ctx.rng, S.headDip.gap) }
    else if (state === 'tipUp') { left = count(ctx.rng, S.tipUp.count); active = false; timer = between(ctx.rng, S.tipUp.gap) }
    else if (state === 'surfaceDabble') { timer = between(ctx.rng, S.surface.seconds); [tx, tz] = b.spot(clock) }
    else {
      timer = between(ctx.rng, state === 'cruise' ? S.cruise.seconds : S[state].seconds)
      if (state === 'cruise') [tx, tz] = b.spot(clock)
    }
  }
  function startDip(): void {
    active = true; left--
    timer = between(ctx.rng, S.headDip.seconds)
    ring(S.rings.headDip, S.rings.ahead)
  }
  function startTip(): void {
    active = true; left--
    // the phase runs from starting over to starting back; the body is past half-way for exactly the drawn time
    timer = between(ctx.rng, S.tipUp.seconds) + (S.tipUp.down - S.tipUp.up) / 2
    ring(S.rings.tipUp, 0)
  }
  /** the end of a dip or tip-up: a ring, then the pause before the next, or the end of the bout */
  function endPhase(): void {
    active = false
    ring(state === 'tipUp' ? S.rings.tipUp : S.rings.headDip, state === 'tipUp' ? 0 : S.rings.ahead)
    if (left <= 0) next()
    else timer = between(ctx.rng, state === 'tipUp' ? S.tipUp.gap : S.headDip.gap)
  }

  const self: BehaviorController = {
    name: 'swim',
    get state() { return state },
    get x() { return b.x }, get y() { return 0 }, get z() { return b.z }, get heading() { return b.heading },
    spacing: S.spacing.other,
    group: b.flock.group,
    update(dt: number, pose: PoseState) {
      clock += dt
      timer -= dt
      if (state === 'cruise') {
        if (b.swimTo(tx, tz, S.cruise.speed, dt) < 0.05) {
          if (following || timer < 1) next()
          else [tx, tz] = b.spot(clock)
        } else if (timer <= 0) next()
      } else if (state === 'surfaceDabble') {
        // pottering toward a spot near the flock, the bill working the surface and ringing it every 1-2 s (the count
        // runs on from one dabbling bout into the next)
        if (b.swimTo(tx, tz, S.surface.speed, dt) < 0.05) [tx, tz] = b.spot(clock)
        nextDabble -= dt
        if (nextDabble <= 0 && bill > 0.99) { nextDabble = between(ctx.rng, S.rings.dabbleEvery); ring(S.rings.dabble, S.rings.ahead) }
        if (timer <= 0) next()
      } else if (state === 'headDip' || state === 'tipUp') {
        b.float(dt)
        if (timer <= 0) {
          if (active) endPhase()
          else if (state === 'headDip') startDip()
          else startTip()
        }
      } else {
        b.float(dt)
        if (timer <= 0) next()
      }
      // the wake, while it is under way
      sinceWake += dt
      if (b.speed > S.wake.above && sinceWake >= S.wake.every) { sinceWake = 0; ctx.onRipple?.(b.x, b.z, S.wake.size) }

      // posture: each part moves at a steady rate toward where this moment wants it, shaped with smoothstep
      const dipping = state === 'headDip'
      const wantBill = state === 'surfaceDabble' || dipping ? 1 : 0
      const wantUnder = dipping && active ? 1 : 0
      const wantTilt = state === 'tipUp' && active ? 1 : 0
      bill = step(bill, wantBill, dt / DIP)
      under = step(under, wantUnder, dt / DIP)
      tilt = step(tilt, wantTilt, dt / (wantTilt > tilt ? S.tipUp.down : S.tipUp.up))
      const kBill = ease(bill), kUnder = ease(under), kTilt = ease(tilt)
      // the head-dip's lean and tail, the surface pose's lean, blended as far as the bill is down
      const lean = kUnder * S.headDip.lean + (1 - kUnder) * kBill * S.surface.lean
      pose.lean.x = lean + (S.tipUp.lean - lean) * kTilt
      pose.tailTilt = kUnder * S.headDip.tail + (S.tipUp.tail - kUnder * S.headDip.tail) * kTilt
      // in a tip-up the body carries the head down; the reach is the head-dip's and the dabbling bill's
      pose.reach = kBill * (1 - kTilt)
      pose.reachDepth = kUnder * S.headDip.depth
      pose.reachAngle = S.surface.reachAngle + (Math.PI / 2 - S.surface.reachAngle) * kUnder
      pose.paddle = kTilt
      paddlePhase = (paddlePhase + S.tipUp.strokes * dt) % 1
      pose.paddlePhase = paddlePhase
      // preening works one side and then the other: a slow roll, eased in and out with the state
      preen = approach(preen, state === 'preen' ? 1 : 0, 2, dt)
      pose.lean.z = preen * 0.1 * Math.sin(clock * Math.PI * 0.8)
      pose.neckExtend = approach(pose.neckExtend, NECK[state], 3, dt)
      pose.headBob = approach(pose.headBob, 0, 4, dt)
    },
  }
  b.self = self
  next()
  return self
}
