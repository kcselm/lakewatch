import type { BehaviorContext, BehaviorController } from './types'
import { approach, between, ease } from './types'
import { createSwimmer, pickByShare, mid, type SwimSettings } from './swimmer'
import { pointInPolygon } from '../location/zones'
import type { PoseState } from '../birds/model'
import type { Rng } from '../catalog/types'

type Range = readonly [number, number]
type Start = 'roll' | 'splash' | 'sink'

/** The Pied-billed Grebe's settings. */
export interface GrebeSettings extends SwimSettings {
  /**
   * its time: foraging bouts of `dives` dives, cruising a few metres at a time, loafing with the stern puff cocked; a
   * bout is never followed straight on by another, so a run of dives is one bout
   */
  bouts: { share: number; dives: Range }
  /** it works a patch of its own: farther than `radius` metres from where it started, it heads back that way */
  patch: { radius: number }
  cruising: { share: number; range: Range; ring: { every: number; size: number } }
  loaf: { share: number; seconds: Range; tail: number }
  /** the face in the water for `seconds`, `depth` metres under: before `before` of dives, and now and then while cruising */
  peer: { seconds: Range; before: number; perSecond: number; depth: number }
  /** how often each start begins a dive */
  start: { roll: number; splash: number; sink: number }
  /**
   * a roll-under: the face in, the body pitched `rollLean` (the stern up), gone in `rollTime` seconds, a kick of the
   * feet at the stern; a splash: the stern puff up for `puff` seconds, then driven straight down in `splashTime`; a
   * sink: down to back-awash in `sinkDown`, held `sinkHold`, then under in `slide`. `depth` metres takes it all under.
   */
  entry: { rollTime: Range; rollLean: number; puff: Range; splashTime: number; sinkDown: number; sinkHold: number; slide: number; depth: number }
  /**
   * under water: a gamma-distributed time with its mean and sd, kept to `range`; a distance the same way, within
   * `turn` radians of the heading, swum at most `speed` m/s (a long way stays down longer); `tries` at a spot clear of
   * the others to come up. If another bird has come up near that spot meanwhile, it swims on under water to the
   * nearest clear one it can reach, for up to `extra` seconds more, and then comes up wherever it is. It turns under
   * water, out of sight, so it comes up facing the way it went.
   */
  under: { mean: number; sd: number; range: Range; distance: { mean: number; sd: number; range: Range }; speed: number; turn: number; tries: number; extra: number }
  /** up in `rise` seconds, the neck upright in `neck`; then on the surface, looking about, for `pause` seconds (mean `pauseMean`) */
  resurface: { rise: number; neck: number; pause: Range; pauseMean: number }
  /**
   * sink and watch, once every `every` seconds of the bird's time (the next drawn when one begins; one that comes due
   * in a bout of dives waits for the bout to end): settle to back-awash in `settle` seconds, hold `hold`, then rise in
   * `up`, or `slide` of the time dive
   */
  sink: { every: Range; settle: Range; hold: Range; up: Range; slide: number }
  rings: { roll: number; splash: number; sink: number; up: number }
}

/**
 * How far the grebe goes down to the periscope, to watch or to start a dive: the back from +0.028 m to about
 * -0.017 m (research section 6.3). The research's periscope has the back 40-50 mm under (0.073 m of sink), but that
 * assumes a live bird's raised neck (crown 106 mm up, section 6.1's alert photo). The traced bird can't raise its
 * neck that far: its neck extension in the sink state (`NECK.sink` = 1) lifts the crown only from 82.0 to 86.5 mm, so
 * at 0.073 m only a 13.5 mm dome of crown clears the water and the eye is 4.8 mm under - not the periscope. At
 * 0.045 m the traced bird's head, eye, bill, and chin are all out (crown 86.5 mm, eye 68.2, bill tip 56.2, chin 48.6,
 * the chin the closest with 3.6 mm to spare), which is as far as this model's neck can give the look; the back is
 * then about 15-20 mm under.
 */
export const AWASH = 0.045

/**
 * From docs/research/2026-09-25-pied-billed-grebe.md, section 11 (sections 6 and 7 for the depths and the video).
 * Sourced: the forage dives, 7.58 s (SD 3.07, 1-15) and 3.69 m (SD 3.02, 0-12) under water (Bleich 1975, n = 154), and
 * the surface pause from Bleich's dive/pause ratio of 2.3 (computed). The dive starts, the sink, and the surfacing are
 * from a few video clips; the shares, bout lengths, and cruising are estimates.
 */
export const GREBE: GrebeSettings = {
  // 0.15 m/s (0.05-0.3), 5-30 s at a time
  cruise: { speed: 0.15, seconds: [5, 30] },
  turn: 1.2,
  // no flock: each works its own patch, anywhere in the zone, the patches tens of metres apart (20 m at the start)
  flock: { radius: Infinity, retargetSeconds: Infinity, drift: 0, whenFarther: Infinity, apart: 20 },
  // at least 10 m from other grebes; from any other swimmer 1.5 m, as it swims away from ducks (ours)
  spacing: { flock: 10, other: 1.5 },
  // no duck's wake: a grebe leaves a small ring every 1.5 s as it swims (`cruising.ring`)
  wake: { every: 0.9, size: 1, above: Infinity },
  // foraging bouts of 3-12 dives; the rest cruising and loafing (the split is ours). Bleich's feeding birds were 70%
  // submerged within a bout; here about 60% of a bout is under water (the entry, the peer, and the look about on coming
  // up take the rest), so to be under water about 35% of the time, as the spec has it, a grebe spends nearly 60% of its
  // time in bouts. The shares are weights: 0.72 against the rest's 0.42 comes to that, as a bout never follows a bout
  // and sinking to watch takes 7% of its time.
  bouts: { share: 0.72, dives: [3, 12] },
  // each works its own patch; 6 m either way is ours: with the patches 20 m apart, 8 m of water lies between them
  patch: { radius: 6 },
  // a small ring about every 1.5 s as it swims; a cruise goes 1-5 m (ours)
  cruising: { share: 0.15, range: [1, 5], ring: { every: 1.5, size: 0.4 } },
  // 30-120 s, the stern puff cocked 20-40 degrees (30 here)
  loaf: { share: 0.27, seconds: [30, 120], tail: 0.52 },
  // 0.8-1.2 s, before about a third of dives, and now and then while cruising (one bird peered about 10 times in 18
  // minutes: once in 90 s of cruising here); the face just under (ours)
  peer: { seconds: [0.8, 1.2], before: 1 / 3, perSecond: 1 / 90, depth: 0.03 },
  // roll-under 70%, splash 15%, sink 15%; never a forward leap
  start: { roll: 0.7, splash: 0.15, sink: 0.15 },
  entry: {
    // gone 0.4-0.65 s after the face touches, the stern tipped up 20-30 degrees (25 here)
    rollTime: [0.4, 0.65], rollLean: 0.44,
    // the stern puff rises 0.2-0.3 s before, then the body goes straight down in under 0.1 s
    puff: [0.2, 0.3], splashTime: 0.1,
    // down to back-awash in 0.4 s, held about 1.5 s, then the head straight down (0.2 s here, ours)
    sinkDown: 0.4, sinkHold: 1.5, slide: 0.2,
    // 0.4 m takes the whole small bird under (ours)
    depth: 0.4,
  },
  under: {
    mean: 7.6, sd: 3.1, range: [2, 15],
    distance: { mean: 3.7, sd: 3.0, range: [0, 12] },
    // at most 1.5 m/s under water (ours: forage dives net 0.5 m/s, escape dives 1.1); within 60 degrees of the heading
    speed: 1.5, turn: Math.PI / 3, tries: 24, extra: 5,
  },
  // head and body up together within 0.1 s, the neck upright by 0.4 s; the pause between dives 2-10 s, mean about 4
  // (Bleich's ratio gives 3.3), drawn skewed toward the short end
  resurface: { rise: 0.1, neck: 0.4, pause: [2, 10], pauseMean: 4 },
  // once every 3-6 minutes; settle over 1-3 s, hold 5-30 s, rise over 2-4 s, or slide under into a dive (half the
  // time, ours)
  sink: { every: [180, 360], settle: [1, 3], hold: [5, 30], up: [2, 4], slide: 0.5 },
  // ring sizes are ours: a roll's ring, a splash's bigger one, a sink's swirl, and where it comes up
  rings: { roll: 0.5, splash: 0.7, sink: 0.3, up: 0.5 },
}

type State = 'cruise' | 'peer' | 'dive' | 'under' | 'resurface' | 'sink' | 'loaf'
export const NECK: Record<State, number> = { cruise: 0.8, peer: 1, dive: 1, under: 1, resurface: 0.9, sink: 1, loaf: 0.15 }
const step = (v: number, want: number, by: number) => (v < want ? Math.min(want, v + by) : Math.max(want, v - by))
/** cubic ease-in: slow to start, quickening toward the end (a roll-under's depth, section 7: shallow while the stern tips up, then under) */
const easeIn = (t: number) => t * t * t
/**
 * Seconds a roll-under's lean takes to reach `rollLean`. Even the shortest roll (`entry.rollTime` at its 0.4 s low
 * end) has this land by 37.5% of its own time, inside the 40% the stern-first look calls for (section 7); a longer
 * roll reaches it sooner still, relative to its own time.
 */
const ROLL_LEAN_RAMP = 0.15

/** A gamma draw with this mean and standard deviation (Marsaglia and Tsang's method), kept to the range. */
export function gamma(rng: Rng, mean: number, sd: number, [lo, hi]: Range): number {
  const draw = (shape: number): number => {
    if (shape < 1) return draw(shape + 1) * (1 - rng()) ** (1 / shape)
    const d = shape - 1 / 3, c = 1 / Math.sqrt(9 * d)
    for (;;) {
      let x = 0, v = 0
      do {
        // a standard normal, by Box-Muller
        x = Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng())
        v = 1 + c * x
      } while (v <= 0)
      v = v * v * v
      if (Math.log(1 - rng()) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v
    }
  }
  return Math.min(hi, Math.max(lo, draw((mean / sd) ** 2) * ((sd * sd) / mean)))
}

/**
 * The `grebe` style: foraging bouts of dives, each started by a roll-under, a splash, or a sink, under water for
 * seconds and metres, then up with a ring and a look about; cruising and peering between, sinking to watch now and
 * then, and loafing. It keeps at least 10 m from the other grebes.
 */
export function createGrebe(ctx: BehaviorContext, startX: number, startZ: number, S: GrebeSettings = GREBE): BehaviorController {
  const b = createSwimmer(ctx, startX, startZ, S)
  const home: [number, number] = [startX, startZ]
  let state: State = 'loaf'
  let timer = 0
  let clock = 0
  let [tx, tz] = [b.x, b.z]
  let dives = 0
  let start: Start = 'roll'
  // a dive's entry, or a sink-and-watch, goes in stages; how long it has been on this one
  let stage = 0, onStage = 0
  // how far down the bird is (0 afloat, AWASH at the periscope, entry.depth under), easing from `from` to `to` along
  // `curve` (smoothstep, unless a roll-under asks for cubic ease-in instead)
  let depth = 0, from = 0, to = 0, over = 0, moved = 0, curve: (t: number) => number = ease
  let [ux, uz] = [0, 0]
  let face = 0, puff = 0, roll = 0, kick = 0, preen = 0
  let sinceRing = 0, paddlePhase = 0
  // seconds until it next sinks to watch; the first comes at a random point of one spell, so the birds are out of step
  let watchIn = ctx.rng() * between(ctx.rng, S.sink.every)

  const TABLE = {
    bout: { share: S.bouts.share, mean: mid(S.bouts.dives) * (S.under.mean + S.resurface.pauseMean + 1) },
    cruise: { share: S.cruising.share, mean: mid(S.cruise.seconds) },
    loaf: { share: S.loaf.share, mean: mid(S.loaf.seconds) },
  }
  // after a bout, a rest: it cruises or loafs before the next
  const REST = { cruise: TABLE.cruise, loaf: TABLE.loaf }
  const ring = (size: number) => ctx.onRipple?.(b.x, b.z, size)
  /** Go from the depth it is at to `target` over `seconds`, along `shape` (smoothstep, unless told otherwise). */
  function sinkTo(target: number, seconds: number, shape: (t: number) => number = ease): void {
    from = depth; to = target; over = seconds; moved = 0; curve = shape
  }
  const settled = () => moved >= over
  const toStage = (n: number) => { stage = n; onStage = 0 }
  const boutLength = () => Math.floor(between(ctx.rng, [S.bouts.dives[0], S.bouts.dives[1] + 1]))

  /** the next spell: a bout, a cruise, or a loaf; straight after a bout, only a cruise or a loaf */
  function next(afterBout = false): void {
    const pick = afterBout ? pickByShare(ctx.rng, REST) : pickByShare(ctx.rng, TABLE)
    if (pick === 'bout') { dives = boutLength(); beforeDive() }
    else if (pick === 'cruise') cruise()
    else { state = 'loaf'; timer = between(ctx.rng, S.loaf.seconds) }
  }
  function cruise(): void {
    state = 'cruise'
    timer = between(ctx.rng, S.cruise.seconds)
    ;[tx, tz] = patch()
  }
  /** the way it faces, or, strayed from its patch, the way home */
  function bearing(): number {
    return Math.hypot(home[0] - b.x, home[1] - b.z) > S.patch.radius ? Math.atan2(-(home[1] - b.z), home[0] - b.x) : b.heading
  }
  /** a spot a few metres off (homeward, if it has strayed), in the zone, and clear of the other grebes if one of a few tries is */
  function patch(): [number, number] {
    let best: [number, number] = [b.x, b.z]
    const strayed = Math.hypot(home[0] - b.x, home[1] - b.z) > S.patch.radius
    for (let i = 0; i < 12; i++) {
      const a = strayed ? bearing() + (ctx.rng() * 2 - 1) * (Math.PI / 3) : ctx.rng() * Math.PI * 2, r = between(ctx.rng, S.cruising.range)
      const [px, pz] = [b.x + Math.cos(a) * r, b.z - Math.sin(a) * r]
      if (!pointInPolygon(px, pz, b.zone.points)) continue
      best = [px, pz]
      if (b.clearAt(px, pz, 0.5)) break
    }
    return best
  }
  /** settle to back-awash (stage 0), hold there watching (stage 1), then rise (stage 2) or slide into a dive */
  function sinkAndWatch(): void {
    state = 'sink'
    toStage(0)
    sinkTo(AWASH, between(ctx.rng, S.sink.settle))
    hold = between(ctx.rng, S.sink.hold)
    watchIn = between(ctx.rng, S.sink.every)
  }
  let hold = 0
  /** peer first, a third of the time, then dive */
  function beforeDive(): void {
    if (ctx.rng() < S.peer.before) { state = 'peer'; timer = between(ctx.rng, S.peer.seconds) }
    else dive()
  }
  function dive(): void {
    state = 'dive'
    dives--
    const r = ctx.rng()
    start = r < S.start.roll ? 'roll' : r < S.start.roll + S.start.splash ? 'splash' : 'sink'
    toStage(0)
    // the roll's own curve: cubic ease-in, so the body stays near the surface while the stern tips up, then goes
    // under quickly at the end (research section 7: "gone in 0.4-0.65 s, stern tipping up, no spring")
    if (start === 'roll') { sinkTo(S.entry.depth, between(ctx.rng, S.entry.rollTime), easeIn); ring(S.rings.roll) }
    else if (start === 'splash') timer = between(ctx.rng, S.entry.puff)
    else sinkTo(AWASH, S.entry.sinkDown)
  }
  function goUnder(): void {
    state = 'under'
    ;[wentX, wentZ] = [b.x, b.z]
    ;[ux, uz] = surfacing()
    faceTheWayTo(ux, uz)
    // a long way takes the time it takes: at most 12 m at `speed`, 8 s, inside the 2-15 s a dive may last
    timer = Math.max(gamma(ctx.rng, S.under.mean, S.under.sd, S.under.range), Math.hypot(ux - b.x, uz - b.z) / S.under.speed)
  }
  let [wentX, wentZ] = [0, 0]
  /**
   * Out of sight under water, it turns to face the way it goes, from where it went down toward (x, z), so it comes up
   * facing the way it swam (a way under 0.1 m has no direction to speak of, and it keeps the heading it had).
   */
  function faceTheWayTo(x: number, z: number): void {
    if (Math.hypot(x - wentX, z - wentZ) > 0.1) b.heading = Math.atan2(-(z - wentZ), x - wentX)
  }
  /**
   * If (ux, uz) isn't clear of the others, the nearest spot that is and that it can still swim to in `seconds` (of
   * those as near, the one nearest where it meant to come up), within the 12 m a dive may go. The birds still under
   * water count, where they are: they are about to come up too.
   */
  function clearOfOthers(seconds: number): void {
    if (b.clearAt(ux, uz, 0, true)) return
    let best: [number, number] | null = null
    const reach = S.under.speed * seconds
    for (let i = 1; i <= 12 && !best; i++) {
      const r = (reach * i) / 12
      for (let k = 0; k < 16; k++) {
        const [px, pz] = [b.x + Math.cos((k * Math.PI) / 8) * r, b.z - Math.sin((k * Math.PI) / 8) * r]
        const within = Math.hypot(px - wentX, pz - wentZ) <= S.under.distance.range[1]
        if (within && pointInPolygon(px, pz, b.zone.points) && b.clearAt(px, pz, 0.05, true) && (!best || Math.hypot(px - ux, pz - uz) < Math.hypot(best[0] - ux, best[1] - uz))) best = [px, pz]
      }
    }
    if (best) [ux, uz] = best
  }

  /**
   * Where it will come up: about the way it faces (homeward, if it has strayed from its patch), as far as it draws,
   * in the zone, and clear of the other swimmers. Where the zone's edge cuts a way short, or another bird is there,
   * it tries another way.
   */
  function surfacing(): [number, number] {
    let best: [number, number] = [b.x, b.z], bestRoom = -Infinity
    const d = gamma(ctx.rng, S.under.distance.mean, S.under.distance.sd, S.under.distance.range)
    const third = S.under.tries / 3
    for (let i = 0; i < S.under.tries; i++) {
      // a third of the tries about its bearing, the whole way; a third any way, the whole way; the last cut short by
      // the zone's edge as they must be
      const a = i < third ? bearing() + (ctx.rng() * 2 - 1) * S.under.turn : ctx.rng() * Math.PI * 2
      let len = d
      while (len > 0.01 && !pointInPolygon(b.x + Math.cos(a) * len, b.z - Math.sin(a) * len, b.zone.points)) len /= 2
      if (len <= 0.01) len = 0
      if (len < d && i < 2 * third) continue
      const [px, pz] = [b.x + Math.cos(a) * len, b.z - Math.sin(a) * len]
      // a metre to spare, as the others move on while it is down
      if (b.clearAt(px, pz, 1, true)) return [px, pz]
      // none clear yet: keep the one with the most room
      const room = Math.min(...b.others().map(n => Math.hypot(n.x - px, n.z - pz) - b.spacingTo(n)))
      if (room > bestRoom) { bestRoom = room; best = [px, pz] }
    }
    return best
  }
  function resurface(): void {
    state = 'resurface'
    // still out of sight this frame: square up to the way it went, should it have turned aside for a clear spot
    faceTheWayTo(b.x, b.z)
    sinkTo(0, S.resurface.rise)
    // the pause, skewed toward the short end so its mean is `pauseMean`
    const [lo, hi] = S.resurface.pause
    timer = lo + (hi - lo) * ctx.rng() ** ((hi - S.resurface.pauseMean) / (S.resurface.pauseMean - lo))
    ring(S.rings.up)
  }

  const self: BehaviorController = {
    name: 'swim',
    get state() { return state },
    get x() { return b.x }, get z() { return b.z }, get heading() { return b.heading },
    get y() { return -depth },
    // all the way down, from the end of the dive's entry until it starts up
    get submerged() { return depth >= S.entry.depth },
    spacing: S.spacing.other,
    group: b.flock.group,
    update(dt: number, pose: PoseState) {
      clock += dt
      timer -= dt
      onStage += dt
      sinceRing += dt
      moved += dt
      watchIn -= dt
      depth = settled() ? to : from + (to - from) * curve(moved / over)

      // a sink-and-watch comes when it is due, if the bird is cruising or loafing; in a bout, it waits for the end
      if (state === 'cruise') {
        b.swimTo(tx, tz, S.cruise.speed, dt)
        if (b.speed > 0.05 && sinceRing >= S.cruising.ring.every) { sinceRing = 0; ring(S.cruising.ring.size) }
        if (watchIn <= 0) sinkAndWatch()
        else if (timer <= 0) next()
        else if (ctx.rng() < S.peer.perSecond * dt) { state = 'peer'; timer = between(ctx.rng, S.peer.seconds); dives = 0 }
      } else if (state === 'loaf') {
        b.float(dt)
        if (watchIn <= 0) sinkAndWatch()
        else if (timer <= 0) next()
      } else if (state === 'peer') {
        b.float(dt)
        if (timer <= 0) { if (dives > 0) dive(); else cruise() }
      } else if (state === 'dive') {
        b.float(dt)
        if (start === 'roll' && settled()) goUnder()
        // a splash: the stern puff up first, then straight down
        else if (start === 'splash' && stage === 0 && timer <= 0) { toStage(1); sinkTo(S.entry.depth, S.entry.splashTime); ring(S.rings.splash) }
        else if (start === 'splash' && stage === 1 && settled()) goUnder()
        // a sink: down to back-awash, a pause, then the head straight down
        else if (start === 'sink' && stage === 0 && settled()) toStage(1)
        else if (start === 'sink' && stage === 1 && onStage >= S.entry.sinkHold) { toStage(2); sinkTo(S.entry.depth, S.entry.slide); ring(S.rings.sink) }
        else if (start === 'sink' && stage === 2 && settled()) goUnder()
      } else if (state === 'under') {
        // Time to come up, `overdue` seconds ago: if another bird is near the spot, afloat or about to come up itself,
        // it swims on to the nearest clear one it can still reach, checking every frame until it is up; once `extra`
        // seconds more have gone, it comes up wherever it is.
        const overdue = -timer
        const outOfTime = overdue >= S.under.extra
        if (overdue >= 0 && !outOfTime) clearOfOthers(S.under.extra - overdue)
        // swimming under water toward where it will come up, evenly over the time it stays down
        const left = Math.hypot(ux - b.x, uz - b.z)
        const by = Math.min(left, (left / Math.max(timer, dt)) * dt, S.under.speed * dt)
        if (left > 1e-9) { b.x += ((ux - b.x) / left) * by; b.z += ((uz - b.z) / left) * by }
        b.speed = 0
        const there = left - by < 1e-9
        if (outOfTime || (overdue >= 0 && there && b.clearAt(ux, uz, 0, true))) resurface()
      } else if (state === 'resurface') {
        b.float(dt)
        if (timer <= 0) { if (dives > 0) beforeDive(); else next(true) }
      } else if (state === 'sink') {
        b.float(dt)
        if (stage === 0 && settled()) toStage(1)
        // watched long enough: slide under into a bout of dives, or rise and carry on
        else if (stage === 1 && onStage >= hold) {
          if (ctx.rng() < S.sink.slide) { dives = boutLength() - 1; state = 'dive'; start = 'sink'; toStage(2); sinkTo(S.entry.depth, S.entry.slide); ring(S.rings.sink) }
          else { toStage(2); sinkTo(0, between(ctx.rng, S.sink.up)) }
        } else if (stage === 2 && settled()) next()
      }

      // posture, each part eased at a steady rate and shaped with smoothstep
      const rolling = state === 'dive' && start === 'roll'
      face = step(face, state === 'peer' || rolling ? 1 : 0, dt / 0.2)
      puff = step(puff, (state === 'dive' && start === 'splash') || state === 'loaf' ? 1 : 0, dt / 0.2)
      // the lean leads the sinking: it ramps up fast (`ROLL_LEAN_RAMP`), well ahead of the depth's slower cubic
      // ease-in, so the stern shows up while the body is still shallow; it settles back over 0.3 s once under
      roll = step(roll, rolling ? 1 : 0, dt / (rolling ? ROLL_LEAN_RAMP : 0.3))
      kick = step(kick, rolling && onStage > 0.15 ? 1 : 0, dt / 0.2)
      const kFace = ease(face), kPuff = ease(puff), kRoll = ease(roll)
      pose.reach = kFace
      pose.reachDepth = kFace * S.peer.depth
      pose.reachAngle = Math.PI / 2
      // the roll-under pitches the body nose-down, stern up, as a tip-up does
      pose.lean.x = S.entry.rollLean * kRoll
      pose.tailTilt = Math.max(kPuff, kRoll) * S.loaf.tail
      // the feet show only as the kick at the stern that takes it under
      pose.paddle = ease(kick)
      paddlePhase = (paddlePhase + 3 * dt) % 1
      pose.paddlePhase = paddlePhase
      preen = approach(preen, state === 'loaf' ? 1 : 0, 1, dt)
      pose.lean.z = preen * 0.05 * Math.sin(clock * Math.PI * 0.5)
      // the neck comes up quickly to dive, and by `resurface.neck` after coming up
      pose.neckExtend = approach(pose.neckExtend, NECK[state], state === 'resurface' ? 2 / S.resurface.neck : state === 'dive' ? 6 : 3, dt)
      pose.headBob = 0
    },
  }
  b.self = self
  next()
  return self
}
