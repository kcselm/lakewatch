import type { BehaviorContext, BehaviorController } from './types'
import { approach, between } from './types'
import { createSwimmer, pickByShare, mid, type SwimSettings } from './swimmer'
import type { PoseState } from '../birds/model'

/**
 * A dabbling duck's settings. The numbers are the Mallard's, from docs/research/2026-09-25-mallard.md, section 11
 * (and section 7): most are estimates from a few birds on video, and the time budget is winter's.
 */
export interface DabblerSettings extends SwimSettings {
  /** shares of the bird's time (Gray et al. 1996, open water; the 3% courting, fighting and flying left out) */
  loaf: { share: number; seconds: readonly [number, number] }
  preen: { share: number; seconds: readonly [number, number] }
  alert: { share: number; seconds: readonly [number, number] }
  /** cruising's share of the bird's time; how long a cruise lasts is `cruise.seconds` */
  cruising: { share: number }
}

export const MALLARD: DabblerSettings = {
  // 0.48 m/s sourced (Prange & Schmidt-Nielsen 1970); bouts of 4-14 s are the old swim's, an estimate
  cruise: { speed: 0.48, seconds: [4, 14] },
  // 0.8-1.2 rad/s estimated from video; the old swim's 1.2
  turn: 1.2,
  // a loose group of four within about 3-5 m, flock radius 2-3 m (estimates); the target drifting 3 m a minute is ours
  flock: { radius: 2.5, retargetSeconds: 60, drift: 3, whenFarther: 5 },
  // nearest neighbour 0.3-2 m while feeding: 0.4, just over the 0.36 m traced length, so two never overlap; 0.8 from
  // birds of other flocks, as the Gadwall's unpaired birds keep 0.3-1.2 m (gadwall section 7.6)
  spacing: { flock: 0.4, other: 0.8 },
  // the old swim's wake: a full-size ring every 0.9 s while under way
  wake: { every: 0.9, size: 1, above: 0.3 },
  cruising: { share: 0.311 },
  loaf: { share: 0.068, seconds: [5, 20] },
  preen: { share: 0.065, seconds: [5, 15] },
  alert: { share: 0.057, seconds: [1, 4] },
}

type State = 'cruise' | 'loaf' | 'preen' | 'alert'

/** neck extension for each state: loafing drawn in, alert stretched up */
const NECK: Record<State, number> = { cruise: 0.6, loaf: 0.15, preen: 0.3, alert: 1 }

/**
 * The `dabbler` style: cruise from spot to spot near the flock, loaf and drift with the wind, preen, and look about.
 * A bird that finds itself farther from the flock than `whenFarther` swims back to it first.
 */
export function createDabbler(ctx: BehaviorContext, startX: number, startZ: number, S: DabblerSettings = MALLARD): BehaviorController {
  const b = createSwimmer(ctx, startX, startZ, S)
  let state: State = 'loaf'
  let timer = 0
  let clock = 0
  let following = false
  let sinceWake = 0
  let preen = 0
  let [tx, tz] = [b.x, b.z]

  function next(): void {
    following = b.flock.distance(b.x, b.z) > S.flock.whenFarther
    if (following) {
      state = 'cruise'
      ;[tx, tz] = b.spot(clock)
      // a guard, in case a neighbour or the zone's edge keeps it from getting there
      timer = Math.hypot(tx - b.x, tz - b.z) / S.cruise.speed + 10
      return
    }
    state = pickByShare(ctx.rng, {
      cruise: { share: S.cruising.share, mean: mid(S.cruise.seconds) },
      loaf: { share: S.loaf.share, mean: mid(S.loaf.seconds) },
      preen: { share: S.preen.share, mean: mid(S.preen.seconds) },
      alert: { share: S.alert.share, mean: mid(S.alert.seconds) },
    })
    timer = between(ctx.rng, state === 'cruise' ? S.cruise.seconds : S[state].seconds)
    if (state === 'cruise') [tx, tz] = b.spot(clock)
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
      } else {
        b.float(dt)
        if (timer <= 0) next()
      }
      // the wake, while it is under way
      sinceWake += dt
      if (b.speed > S.wake.above && sinceWake >= S.wake.every) { sinceWake = 0; ctx.onRipple?.(b.x, b.z, S.wake.size) }
      // preening works one side and then the other: a slow roll, eased in and out with the state
      preen = approach(preen, state === 'preen' ? 1 : 0, 2, dt)
      pose.lean.z = preen * 0.1 * Math.sin(clock * Math.PI * 0.8)
      pose.neckExtend = approach(pose.neckExtend, NECK[state], 3, dt)
      pose.lean.x = approach(pose.lean.x, 0, 4, dt)
      pose.headBob = approach(pose.headBob, 0, 4, dt)
      pose.tailTilt = approach(pose.tailTilt, 0, 4, dt)
    },
  }
  b.self = self
  next()
  return self
}
