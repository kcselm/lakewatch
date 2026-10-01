import type { BehaviorContext, BehaviorController, Drive, Neighbour } from './types'
import { approach, between, ease } from './types'
import { createSwimmer, pickByShare, mid, type SwimSettings } from './swimmer'
import { pointInPolygon, randomPointInPolygon } from '../location/zones'
import type { PoseState } from '../birds/model'

type Range = readonly [number, number]

/** The American White Pelican's settings. */
export interface PelicanSettings extends SwimSettings {
  /** shares of the bird's time; they need not sum to 1. How long a cruise lasts is `cruise.seconds`. */
  cruising: { share: number }
  /** loafing on the water; `sunk` of the spells with the head sunk on the shoulders and the bill laid on the breast */
  loaf: { share: number; seconds: Range; sunk: number }
  alert: { share: number; seconds: Range }
  /**
   * Feeding together, the whole flock in a line abreast, `spacing` metres between birds: they gather on the line
   * (`settle` seconds to spare once the farthest is there, and never longer than `gather`), then it sets off at
   * `speed` m/s and, `first` seconds on, they dip their bills: `dips` times a bout, `every` seconds apart, each bird's
   * bill starting down within `window` seconds of the first's. In a bout the birds let each other come as near as
   * `keep` metres, nearer than they keep at other times. `share` is the share of a bird's time spent in bouts.
   */
  feed: { share: number; spacing: number; keep: number; speed: number; settle: number; gather: number; first: number; dips: Range; every: Range; window: number }
  /**
   * One dip: the bill goes down and under in `down` seconds, `depth` metres under at `angle` radians below level, the
   * body tipped `lean` radians; stays under `under` seconds, or `underCaught` if it has caught something; and comes up
   * in `up`, the pouch full. The bird then holds its bill down while the pouch drains, `drain` seconds. `catch` of the
   * dips catch, and the bird swallows: the neck up and the bill tipped `pitch` radians above where the neck carries
   * it, for `swallow` seconds.
   */
  dip: { down: number; under: number; underCaught: number; up: number; depth: number; angle: number; lean: number; drain: number; catch: number; swallow: number; pitch: number }
  /** rings: where each bill goes in, and a smaller one under it as it drains; how far ahead of the bird's middle, metres */
  ring: { size: number; drain: number; ahead: number }
}

/**
 * The American White Pelican, from docs/research/2026-09-30-american-white-pelican.md, section 11.1 (behaviour in
 * section 7). Sourced: the dip's time under water and the swallow's (McMahon & Evans 1992, Table 1), the catch rate
 * (computed from the same table), a dip every 10 s in a group of four or more and the flock following the first bird
 * within 3 s (Anderson 1987). From video of a few birds, none in Oregon in September: the speeds, how long the bill
 * takes to go down and to drain, and the second or so within which the flock's bills go in. The rest are estimates,
 * marked where they stand.
 */
export const PELICAN: PelicanSettings = {
  // travelling 0.57 m/s (0.35-0.8, video); a cruise of 6-20 s is ours
  cruise: { speed: 0.57, seconds: [6, 20] },
  // no source; a big hull turns slower than a duck's 1.2
  turn: 0.8,
  // five birds as one group, within a few body lengths of each other; the patch drifting is ours
  flock: { radius: 2.5, retargetSeconds: 90, drift: 6, whenFarther: 6, apart: 1 },
  // travelling birds are 0.65-1.0 m centre to centre (photo, video): 0.9, as far as a bird is long from bill tip to
  // tail tip, so no two overlap however they lie; from other swimmers 1.5 m, an estimate (a pelican is three ducks long)
  spacing: { flock: 0.9, other: 1.5 },
  // a late-September morning, an estimate: forage 25%, travel 15%, and the rest loafing, preening and sleeping. No bird
  // turns its head back to preen or sleep yet, so those are loafing here, half of it with the head sunk
  cruising: { share: 0.15 },
  loaf: { share: 0.57, seconds: [20, 90], sunk: 0.5 },
  alert: { share: 0.03, seconds: [2, 5] },
  feed: {
    share: 0.25,
    // foraging birds are 0.4-0.65 m centre to centre, abreast, from touching to a body length apart (video, photo):
    // 0.6 along the line, and no nearer than 0.4, a body's width (0.32 m) and a little
    spacing: 0.6, keep: 0.4,
    // a foraging group drives forward at 0.3-0.4 m/s (video)
    speed: 0.3, settle: 5, gather: 40, first: 3,
    // a dip every 10 s a bird (8-12 here); bouts of 1-4 minutes: 5-9 dips, 50-90 s, the short end, so a line fits the
    // far water's length
    dips: [5, 9], every: [8, 12],
    // the flock follows the first bird within 0.25-1.0 s
    window: 1,
  },
  dip: {
    // 0.9 s to lower the bill (video); under 1.3 s, or 2.0 s with a catch (sourced); up again in 0.4 s (an estimate)
    down: 0.9, under: 1.3, underCaught: 2, up: 0.4,
    // the head under at least to the eye: the bill 60 degrees below level (25-60) and its tip 0.3 m under, deeper than
    // the shallow dips' 0.15-0.25 m, which at this angle would leave the head dry; the body's tip forward is ours
    depth: 0.3, angle: 1.05, lean: 0.1,
    // the bill hangs draining 1.0 s (video); 0.11 of dips catch; the swallow 1.2 s, the bill 15-50 degrees above level
    drain: 1, catch: 0.11, swallow: 1.2, pitch: 1.2,
  },
  // ring sizes are estimates: a head going in about a duck's tip-up, the draining bill half that
  ring: { size: 0.7, drain: 0.35, ahead: 0.45 },
}

type State = 'loaf' | 'cruise' | 'alert' | 'gather' | 'drive' | 'dip' | 'drain' | 'swallow'
/** neck extension out of a dip: the head sunk on the shoulders, the swimming S, and stretched up */
export const NECK = { sunk: 0.05, loaf: 0.5, cruise: 0.5, alert: 1, feed: 0.5, swallow: 1 } as const
/** how long the neck takes to rise for a swallow, and to settle after it, s */
const RISE = 0.4
/** a gathering bird this near its place on the line is on it, metres */
const ON_PLACE = 0.15
/** keeping station in a line: m/s faster or slower for each metre its place is ahead of it or behind */
const STATION = 0.8
/** and the metres ahead it aims, to close a metre's gap to the side: the longer, the less it turns off the line's heading */
const EDGE = 3
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
/** A whole number from lo to hi, each equally likely. */
const count = (rng: () => number, [lo, hi]: Range) => lo + Math.floor(rng() * (hi - lo + 1))

/** How long the bill is down, under, and coming up in one dip, s: longer under when it has caught. */
export const dipDown = (S: PelicanSettings, caught: boolean) => S.dip.down + (caught ? S.dip.underCaught : S.dip.under) + S.dip.up
/** How long one dip takes from the bill starting down to the pouch drained and any catch swallowed, s. */
export const dipSeconds = (S: PelicanSettings, caught: boolean) => dipDown(S, caught) + S.dip.drain + (caught ? S.dip.swallow : 0)

/** Where place `k` on a drive's line is, `tau` seconds after it set off (before that, where it gathers). */
export function placeOn(d: Drive, k: number, tau: number): [number, number] {
  const along = d.speed * Math.max(0, tau), across = (k - (d.birds.length - 1) / 2) * d.spacing
  const fx = Math.cos(d.heading), fz = -Math.sin(d.heading)     // forward
  const lx = Math.sin(d.heading), lz = Math.cos(d.heading)      // to the right
  return [d.x + fx * along + lx * across, d.z + fz * along + lz * across]
}

/**
 * The `pelican` style: loaf on the water, the neck in its S or the head sunk on the shoulders; cruise from spot to
 * spot near the flock; look about; and feed together. For a feeding bout the whole flock lines up abreast, swims
 * forward in line, and dips bills within a moment of each other, every ten seconds or so; each bird then drains its
 * pouch, and swallows if it caught. One bird calls the bout and lays it out on the flock's shared record (`Drive`):
 * the line, when it sets off, and when each bill goes in. Every bird of the flock reads the same record, so no two
 * need speak again.
 */
export function createPelican(ctx: BehaviorContext, startX: number, startZ: number, S: PelicanSettings = PELICAN): BehaviorController {
  const b = createSwimmer(ctx, startX, startZ, S)
  const group = b.flock.group
  // in a bout the birds of the line close up abreast, nearer than they otherwise keep
  const usual = b.spacingTo
  b.spacingTo = n => (drive && drive.birds.includes(n) ? S.feed.keep : usual(n))
  let state: State = 'loaf'
  let timer = 0
  let clock = 0
  let following = false
  let sunk = false
  let [tx, tz] = [b.x, b.z]
  /** the drive this bird is in, and how many rings it has made in it (two a dip) */
  let drive: Drive | null = null
  let rung = 0
  /** the neck's extension but for a swallow, eased from state to state */
  let neck = 0.5

  const flockmates = (): Neighbour[] => (ctx.neighbours?.() ?? [self]).filter(n => n.group === group)
  const TABLE = () => ({
    cruise: { share: S.cruising.share, mean: mid(S.cruise.seconds) },
    loaf: { share: S.loaf.share, mean: mid(S.loaf.seconds) },
    alert: { share: S.alert.share, mean: mid(S.alert.seconds) },
    // a bout gives every bird of the flock its feeding, so each calls one at its share of the share
    feed: { share: S.feed.share / flockmates().length, mean: S.feed.first + mid(S.feed.dips) * mid(S.feed.every) },
  })

  /**
   * Lay out a feeding bout for the whole flock, if there is water for it: a line abreast through where the flock is
   * now, swimming toward some point of the zone far enough off, all of the line in the zone all the way. False if no
   * point tried leaves it room.
   */
  function callDrive(): boolean {
    const birds = flockmates()
    const n = birds.length
    const cx = birds.reduce((s, m) => s + m.x, 0) / n, cz = birds.reduce((s, m) => s + m.z, 0) / n
    const dips = count(ctx.rng, S.feed.dips)
    const half = ((n - 1) / 2) * S.feed.spacing
    // when each dip starts, after the line sets off, and whether each bird catches
    const starts: number[] = []
    for (let j = 0, t = S.feed.first; j < dips; j++, t += between(ctx.rng, S.feed.every)) starts.push(t)
    const caught = starts.map(() => birds.map(() => ctx.rng() < S.dip.catch))
    const seconds = starts[starts.length - 1]! + S.feed.window + dipSeconds(S, true) + RISE
    const reach = S.feed.speed * seconds
    for (let tries = 0; tries < 40; tries++) {
      const [px, pz] = randomPointInPolygon(b.zone.points, ctx.rng)
      if (Math.hypot(px - cx, pz - cz) < reach) continue
      const heading = Math.atan2(-(pz - cz), px - cx)
      // both ends of the line in the zone, where it gathers and where it ends (the zone is convex: so is all between)
      const fx = Math.cos(heading), fz = -Math.sin(heading), lx = Math.sin(heading), lz = Math.cos(heading)
      const corners = [-half, half].flatMap(a => [0, reach].map(f => [cx + fx * f + lx * a, cz + fz * f + lz * a] as const))
      if (!corners.every(([x, z]) => pointInPolygon(x, z, b.zone.points))) continue
      // places by where each bird already is across the line, so none crosses another to reach its own
      const ordered = [...birds].sort((p, q) => (p.x * lx + p.z * lz) - (q.x * lx + q.z * lz))
      const line: Drive = { birds: ordered, heading, x: cx, z: cz, speed: S.feed.speed, spacing: S.feed.spacing, startAt: 0, endAt: 0, dips: [] }
      const farthest = Math.max(...ordered.map((m, k) => { const [qx, qz] = placeOn(line, k, 0); return Math.hypot(qx - m.x, qz - m.z) }))
      // time to turn about and swim to the farthest place, and then to turn to face along the line
      const startAt = clock + Math.min(S.feed.gather, Math.PI / S.turn + farthest / S.cruise.speed + S.feed.settle)
      group.drive = {
        ...line, startAt, endAt: startAt + seconds,
        // the first bill starts down on time, and the others within the window after it
        dips: starts.map((t, j) => {
          const first = Math.floor(ctx.rng() * n)
          return { at: ordered.map((_, k) => t + (k === first ? 0 : ctx.rng() * S.feed.window)), caught: ordered.map(m => caught[j]![birds.indexOf(m)]!) }
        }),
      }
      // the flock's patch goes where the line will end, so the birds stay there after it rather than swim back
      group.targetX = cx + fx * reach
      group.targetZ = cz + fz * reach
      group.retargetAt = Math.max(group.retargetAt, startAt + seconds + S.flock.retargetSeconds)
      return true
    }
    return false
  }

  function next(): void {
    drive = null
    following = b.flock.distance(b.x, b.z) > S.flock.whenFarther
    if (following) {
      state = 'cruise'
      ;[tx, tz] = b.spot(clock)
      timer = Math.hypot(tx - b.x, tz - b.z) / S.cruise.speed + 10
      return
    }
    const pick = pickByShare(ctx.rng, TABLE())
    if (pick === 'feed') {
      if (callDrive()) { join(group.drive!); return }
      state = 'loaf'
    } else state = pick
    timer = between(ctx.rng, state === 'cruise' ? S.cruise.seconds : S[state as 'loaf' | 'alert'].seconds)
    if (state === 'cruise') [tx, tz] = b.spot(clock)
    if (state === 'loaf') sunk = ctx.rng() < S.loaf.sunk
  }
  function join(d: Drive): void {
    drive = d
    rung = 0
    state = 'gather'
  }

  /** The dip of drive `d` this bird (at place `k`) is in or has last begun, `tau` seconds in: which, how far into it, and whether it catches. */
  function dipAt(d: Drive, k: number, tau: number): { j: number; u: number; caught: boolean } | null {
    let j = -1
    for (let i = 0; i < d.dips.length; i++) if (tau >= d.dips[i]!.at[k]!) j = i
    return j < 0 ? null : { j, u: tau - d.dips[j]!.at[k]!, caught: d.dips[j]!.caught[k]! }
  }

  /** One frame of a feeding bout: to its place on the line, then forward in line, dipping when its times come. */
  function feed(dt: number, d: Drive): void {
    const k = d.birds.indexOf(self)
    const tau = clock - d.startAt
    if (tau < 0) {
      state = 'gather'
      const [px, pz] = placeOn(d, k, 0)
      // on its place, it stops and turns to face the way the line will go
      if (Math.hypot(px - b.x, pz - b.z) < ON_PLACE) b.swim(dt, 0, d.heading)
      else b.swimTo(px, pz, S.cruise.speed, dt)
      return
    }
    // keeping station: it swims the line's way, faster or slower as its place is ahead of it or behind, and edges
    // across toward its place over a few metres rather than turning to face it
    const [px, pz] = placeOn(d, k, tau)
    const fx = Math.cos(d.heading), fz = -Math.sin(d.heading)
    const ahead = (px - b.x) * fx + (pz - b.z) * fz, right = (px - b.x) * Math.sin(d.heading) + (pz - b.z) * Math.cos(d.heading)
    b.swim(dt, Math.min(2 * d.speed, Math.max(0, d.speed + STATION * ahead)), d.heading - Math.atan2(right, EDGE))
    const dip = dipAt(d, k, tau)
    if (!dip) { state = 'drive'; return }
    const D = dipDown(S, dip.caught)
    state = dip.u < D ? 'dip' : dip.u < D + S.dip.drain ? 'drain' : dip.caught && dip.u < D + S.dip.drain + S.dip.swallow ? 'swallow' : 'drive'
    // a ring as the bill goes in, half-way down, and a smaller one under it as it starts to drain
    const due = 2 * dip.j + (dip.u >= D ? 2 : dip.u >= S.dip.down / 2 ? 1 : 0)
    while (rung < due) {
      rung++
      ctx.onRipple?.(b.x + Math.cos(b.heading) * S.ring.ahead, b.z - Math.sin(b.heading) * S.ring.ahead, rung % 2 === 1 ? S.ring.size : S.ring.drain)
    }
  }

  const self: BehaviorController = {
    name: 'swim',
    get state() { return state },
    get x() { return b.x }, get y() { return 0 }, get z() { return b.z }, get heading() { return b.heading },
    spacing: S.spacing.other,
    group,
    update(dt: number, pose: PoseState) {
      clock += dt
      timer -= dt
      // a bout called by any bird of the flock takes this one too; one that is over lets it go
      if (group.drive && group.drive !== drive && group.drive.birds.includes(self)) join(group.drive)
      if (drive) {
        if (clock >= drive.endAt) {
          if (group.drive === drive) group.drive = undefined
          next()
        } else feed(dt, drive)
      }
      if (!drive) {
        if (state === 'cruise') {
          if (b.swimTo(tx, tz, S.cruise.speed, dt) < 0.05) {
            if (following || timer < 1) next()
            else [tx, tz] = b.spot(clock)
          } else if (timer <= 0) next()
        } else {
          b.float(dt)
          if (timer <= 0) next()
        }
      }

      // posture. In a bout everything follows from how far into its dip the bird is, so nothing can drift out of step
      let reach = 0, pouch = 0, up = 0
      const dip = drive && clock >= drive.startAt ? dipAt(drive, drive.birds.indexOf(self), clock - drive.startAt) : null
      if (dip) {
        const D = dipDown(S, dip.caught)
        const rising = ease(clamp01((dip.u - (D - S.dip.up)) / S.dip.up))
        reach = ease(clamp01(dip.u / S.dip.down)) * (1 - rising)
        pouch = rising * (1 - clamp01((dip.u - D) / S.dip.drain))
        if (dip.caught) {
          const s = dip.u - D - S.dip.drain
          up = ease(clamp01(Math.min(s / RISE, (S.dip.swallow - s) / RISE)))
        }
      }
      pose.reach = reach
      pose.reachDepth = S.dip.depth
      pose.reachAngle = S.dip.angle
      pose.lean.x = reach * S.dip.lean
      pose.pouch = pouch
      pose.headPitch = up * S.dip.pitch
      neck = approach(neck, drive ? NECK.feed : state === 'loaf' && sunk ? NECK.sunk : NECK[state as 'loaf' | 'cruise' | 'alert'], 3, dt)
      pose.neckExtend = neck + (NECK.swallow - neck) * up
      pose.paddle = 0
    },
  }
  b.self = self
  next()
  return self
}
