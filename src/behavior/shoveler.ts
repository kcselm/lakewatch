import type { BehaviorContext, BehaviorController, Spin } from './types'
import { approach, between, ease, turnToward, wrap } from './types'
import { ACCEL, createSwimmer, pickByShare, mid, type SwimSettings } from './swimmer'
import { pointInPolygon } from '../location/zones'
import type { PoseState } from '../birds/model'

type Range = readonly [number, number]

/** The Northern Shoveler's settings. */
export interface ShovelerSettings extends SwimSettings {
  cruising: { share: number }
  loaf: { share: number; seconds: Range }
  preen: { share: number; seconds: Range }
  alert: { share: number; seconds: Range }
  /**
   * skimming, half of it travelling (head down the whole time, then up for `up` seconds) and half pottering nearly
   * on the spot (the face dipping for `down` seconds and raised for `raised`, the bill staying in the film while the
   * face is up, but for the `lookUp` share of raises that lift the head clear); the bill held `reachAngle` below
   * level, in the surface film (`film` metres under) or the face under to the eye (`face` metres); the heading
   * wandering `wander` radians either way at `wanderHz`, no side-to-side sweep; a small ring every `ringEvery` seconds
   */
  skim: {
    share: number; travelling: number
    travel: { speed: number; seconds: Range; up: number }
    potter: { speed: number; seconds: Range; down: Range; raised: Range; lookUp: number }
    reachAngle: number; film: number; face: number; ease: number
    wander: number; wanderHz: number
    ring: { every: number; size: number; ahead: number }
  }
  /**
   * a pair spinning nose to tail about their midpoint, `apart` metres between centres, once round every `revolution`
   * seconds, one direction a bout; a bout usually `seconds`, now and then `long`; a partner must be a flockmate within
   * `within` metres, feeding or resting; the pair swims `gather` m/s to its places first, and gives up after `wait` s;
   * once a spin ends the two feed side by side, pottering, for `after` seconds; `room` is the metres to spare beyond
   * what the pair keeps from every other swimmer, measured from the circle, to ask and start (`start`) and to go on
   * (`keep`): a swimmer that comes closer ends the spin, gathering or turning, as the pair would otherwise swing into it
   */
  circle: {
    share: number; apart: number; revolution: number; seconds: Range; long: Range; longChance: number; within: number
    gather: number; wait: number; room: { start: number; keep: number }; after: Range; ring: number
  }
  /** rare tip-ups while feeding: `perSecond` of feeding, `seconds` long, only `lean` radians nose-down */
  tipUp: { perSecond: number; seconds: Range; lean: number; tail: number; strokes: number; down: number; up: number; ring: number }
}

/**
 * From docs/research/2026-09-25-northern-shoveler.md, section 11 (section 7.3 for the video it rests on). Every number
 * is an estimate from video of a few birds, mostly in winter and spring, except the time budget, which is Webb &
 * Brotherson 1988's wintering drakes with feeding raised for a morning.
 */
export const SHOVELER: ShovelerSettings = {
  // cruising 0.45 m/s (0.36-0.6), as the old swim; bouts as the dabbler's
  cruise: { speed: 0.45, seconds: [4, 14] },
  turn: 1.2,
  // three birds within about 3 m: radius 1.5
  flock: { radius: 1.5, retargetSeconds: 60, drift: 3, whenFarther: 3 },
  // feeding 0.2-0.35 m centre to centre, the spinning pair 0.25; birds of other flocks as the dabbler's
  spacing: { flock: 0.25, other: 0.8 },
  // the dabbler's wake, but only above a travelling skim's 0.32 m/s: skimming leaves its own smaller ring
  wake: { every: 1.5, size: 1, above: 0.35 },
  // skim 38%, circle 5%, cruise 22%, loaf 34%; the loaf split between resting and preening as Webb & Brotherson's
  // 21.9% and 16.9%, and a little of it alert (scans of 1-2 s, Guillemain et al. 2001, in mallard section 11)
  cruising: { share: 0.22 },
  loaf: { share: 0.18, seconds: [10, 60] },
  preen: { share: 0.14, seconds: [5, 20] },
  alert: { share: 0.02, seconds: [1, 2] },
  skim: {
    share: 0.38, travelling: 0.5,
    // 0.32 m/s (0.28-0.37), the head down 30-60 s, then up about 2 s
    travel: { speed: 0.32, seconds: [30, 60], up: 2 },
    // 0.03 m/s (0.01-0.12), the face down 0.75-2.75 s and up 0.25-1.0 s; a bout of 20-60 s is ours. Raised is the
    // face coming up with the bill left in the film (bill only 22% of pottering); the head is right up only 2%, so
    // about one raise in twelve (a raise is about 26% of the dip cycle here) lifts the bill clear too
    potter: { speed: 0.03, seconds: [20, 60], down: [0.75, 2.75], raised: [0.25, 1], lookUp: 0.08 },
    // the bill 20-35 degrees to the surface, typically 25-30 (27 here); the travelling bird's bill in the surface film
    // (0.008 m, the contract's 0.005-0.01), the potterer's face under to the eye (the eye is 3-4 cm up in a skim)
    reachAngle: 0.47, film: 0.008, face: 0.035, ease: 0.2,
    // a yaw wander of 5-8 degrees either way (6.5 here) at 0.3-0.6 Hz (0.45)
    wander: 0.113, wanderHz: 0.45,
    // the ring a skimming bill trails is ours: half a wake, every 1.5 s
    ring: { every: 1.5, size: 0.5, ahead: 0.15 },
  },
  // two birds 0.25 m apart, 3.4 s a revolution (3.0-4.75), bouts of 4-8 s and now and then a minute or two (1 in 10
  // here is ours); a partner anywhere in the flock's 3 m, gathering at 0.15 m/s and giving up after 12 s, and the room
  // it wants, are ours; between bouts the pair feeds side by side, pottering, for 5-10 s
  circle: {
    share: 0.05, apart: 0.25, revolution: 3.4, seconds: [4, 8], long: [60, 120], longChance: 0.1, within: 3,
    gather: 0.15, wait: 12, room: { start: 0.1, keep: 0.05 }, after: [5, 10], ring: 0.6,
  },
  // about one per 10 minutes of feeding, 1-2.5 s, 50-60 degrees nose-down (55 here); the feet and tilt times as the
  // dabbler's
  tipUp: { perSecond: 1 / 600, seconds: [1, 2.5], lean: 0.96, tail: 0.4, strokes: 2.4, down: 0.35, up: 0.25, ring: 0.6 },
}

type State = 'cruise' | 'loaf' | 'preen' | 'alert' | 'skim' | 'circle' | 'tipUp'
export const NECK: Record<State, number> = { cruise: 0.3, loaf: 0.15, preen: 0.3, alert: 1, skim: 1, circle: 1, tipUp: 1 }
/** what a flockmate may be doing when asked to spin: feeding or resting, not under way or already spinning */
const FREE: readonly string[] = ['skim', 'loaf', 'preen', 'alert']
/** how far outside its place on the circle a gathering bird swims to, before gliding in onto it, metres */
const SETTLE = 0.03
const step = (v: number, want: number, by: number) => (v < want ? Math.min(want, v + by) : Math.max(want, v - by))

/**
 * The `shoveler` style: skim with the bill in the water (travelling, or pottering with the face dipping), spin in a
 * pair, now and then tip up a little way, cruise, loaf, preen, and look about.
 */
export function createShoveler(ctx: BehaviorContext, startX: number, startZ: number, S: ShovelerSettings = SHOVELER): BehaviorController {
  const b = createSwimmer(ctx, startX, startZ, S)
  const group = b.flock.group
  let state: State = 'loaf'
  let timer = 0
  let clock = 0
  let following = false
  let travelling = false
  /** pottering: the face is down; travelling: the head is down (not yet in its closing look up) */
  let down = false
  /** pottering, face raised: this raise lifts the bill clear of the water too */
  let lookUp = false
  let [tx, tz] = [b.x, b.z]
  let bill = 0, face = 0, tilt = 0, skimming = 0, preen = 0
  let sinceWake = 0, sinceRing = 0, paddlePhase = 0, lastRev = 0
  /** how long a pottering bout has left to run */
  let skimLeft = 0

  const TABLE = {
    cruise: { share: S.cruising.share, mean: mid(S.cruise.seconds) },
    loaf: { share: S.loaf.share, mean: mid(S.loaf.seconds) },
    preen: { share: S.preen.share, mean: mid(S.preen.seconds) },
    alert: { share: S.alert.share, mean: mid(S.alert.seconds) },
    skim: { share: S.skim.share, mean: S.skim.travelling * (mid(S.skim.travel.seconds) + S.skim.travel.up) + (1 - S.skim.travelling) * mid(S.skim.potter.seconds) },
    // each spin gives two birds their circling, so a bird starts one at half the share
    circle: { share: S.circle.share / 2, mean: (1 - S.circle.longChance) * mid(S.circle.seconds) + S.circle.longChance * mid(S.circle.long) },
  }
  const ring = (size: number, ahead: number) => ctx.onRipple?.(b.x + Math.cos(b.heading) * ahead, b.z - Math.sin(b.heading) * ahead, size)

  /** the spin of its flock this bird last looked at, to steer clear of: it looks again when another starts */
  let passed: Spin | undefined
  /**
   * true when swimming straight from here to (x, z) would take this bird, not one of the pair, nearer a spinning pair
   * of its flock than the room they ask to turn in, and nearer than it already is
   */
  function inTheWay(x: number, z: number): boolean {
    const s = group.spin
    if (!s || s.pair.includes(self)) return false
    // the nearest the straight way comes to the pair's midpoint
    const [dx, dz] = [x - b.x, z - b.z], len2 = dx * dx + dz * dz
    const u = len2 > 0 ? Math.max(0, Math.min(1, ((s.cx - b.x) * dx + (s.cz - b.z) * dz) / len2)) : 0
    const nearest = Math.hypot(b.x + dx * u - s.cx, b.z + dz * u - s.cz)
    return nearest < S.spacing.flock + s.apart / 2 + S.circle.room.start && nearest < Math.hypot(b.x - s.cx, b.z - s.cz) - 1e-9
  }
  /** a spot near the flock's target, the way to it clear of a spinning pair, if one of a few tries is */
  function spot(): [number, number] {
    let best = b.spot(clock)
    for (let i = 0; i < 8 && inTheWay(best[0], best[1]); i++) best = b.spot(clock)
    return best
  }

  function next(): void {
    following = b.flock.distance(b.x, b.z) > S.flock.whenFarther
    if (following) {
      state = 'cruise'
      ;[tx, tz] = spot()
      timer = Math.hypot(tx - b.x, tz - b.z) / S.cruise.speed + 10
      return
    }
    state = pickByShare(ctx.rng, TABLE)
    if (state === 'circle' && !invite()) state = 'skim'
    if (state === 'skim') skim(ctx.rng() < S.skim.travelling)
    else if (state !== 'circle') {
      timer = between(ctx.rng, state === 'cruise' ? S.cruise.seconds : S[state].seconds)
      if (state === 'cruise') [tx, tz] = spot()
    }
  }
  /** Start skimming, travelling or pottering; a pottering bout runs `seconds` */
  function skim(travel: boolean, seconds: Range = S.skim.potter.seconds): void {
    state = 'skim'
    travelling = travel
    down = true
    lookUp = false
    timer = travel ? between(ctx.rng, S.skim.travel.seconds) : between(ctx.rng, S.skim.potter.down)
    ;[tx, tz] = spot()
    skimLeft = travel ? 0 : between(ctx.rng, seconds)
  }

  /** Start a spin with the nearest flockmate that is feeding or resting close by, if the circle has room; true if one starts. */
  function invite(): boolean {
    if (group.spin) return false
    const partner = b.others()
      .filter(n => n.group === group && FREE.includes(n.state) && Math.hypot(n.x - b.x, n.z - b.z) <= S.circle.within)
      .sort((p, q) => Math.hypot(p.x - b.x, p.z - b.z) - Math.hypot(q.x - b.x, q.z - b.z))[0]
    if (!partner) return false
    const [cx, cz] = [(b.x + partner.x) / 2, (b.z + partner.z) / 2]
    const r = S.circle.apart / 2
    // room to turn: the circle in the zone, and no other swimmer inside what it keeps from either bird
    for (let k = 0; k < 8; k++) if (!pointInPolygon(cx + Math.cos((k * Math.PI) / 4) * (r + 0.05), cz + Math.sin((k * Math.PI) / 4) * (r + 0.05), b.zone.points)) return false
    if (!room(cx, cz, partner, S.circle.room.start)) return false
    bout = between(ctx.rng, ctx.rng() < S.circle.longChance ? S.circle.long : S.circle.seconds)
    group.spin = {
      pair: [self, partner], cx, cz, apart: S.circle.apart, dir: ctx.rng() < 0.5 ? 1 : -1, rate: (2 * Math.PI) / S.circle.revolution,
      angle: Math.atan2(-(b.z - cz), b.x - cx), at: clock, ends: clock + S.circle.wait, spinning: false,
    }
    state = 'circle'
    b.partner = partner
    lastRev = 0
    return true
  }
  /** the first bird's drawn length for the spin it has asked for */
  let bout = 0
  /**
   * true when no swimmer but `partner` is inside what this bird keeps from it, measured from the circle about (cx, cz),
   * with `extra` metres to spare
   */
  function room(cx: number, cz: number, partner: unknown, extra: number): boolean {
    const r = S.circle.apart / 2
    return b.others().every(n => n === partner || Math.hypot(n.x - cx, n.z - cz) >= b.spacingTo(n) + r + extra)
  }
  /** where this bird of the pair belongs on the circle now: its point, and the heading along it */
  function place(s: Spin): [number, number, number] {
    const first = s.pair[0] === self
    // The second bird takes the first's angle forward to its own clock, so the pair turns as one whichever updates
    // first; once the bout is up it stops where the first stopped, as the first no longer moves the angle on.
    const ahead = s.spinning && !first && clock < s.ends ? s.dir * s.rate * (clock - s.at) : 0
    const a = s.angle + ahead + (first ? 0 : Math.PI)
    const r = s.apart / 2
    return [s.cx + Math.cos(a) * r, s.cz - Math.sin(a) * r, a + (s.dir * Math.PI) / 2]
  }
  /**
   * One frame of a spin, for either bird: swim to its place, then turn with the other; false once the bout is over.
   * Only the first bird ends it, stopping where it is: when the bout is up, when the two can't gather in time, or when
   * another swimmer comes so close to the circle that the pair would swing into it, or be pressed together gathering.
   */
  function spin(s: Spin, dt: number): boolean {
    const first = s.pair[0] === self
    if (first && !room(s.cx, s.cz, s.pair[1], S.circle.room.keep)) return false
    if (first && s.spinning) {
      if (clock >= s.ends) return false
      s.angle += s.dir * s.rate * dt
      s.at = clock
      if (Math.floor(Math.abs(s.angle) / (2 * Math.PI)) !== lastRev) { lastRev = Math.floor(Math.abs(s.angle) / (2 * Math.PI)); ring(S.circle.ring, 0) }
    }
    const [px, pz, along] = place(s)
    if (!s.spinning) {
      // Swim as any swimmer swims, turning toward where it goes and going only as fast as it faces it, to a point just
      // outside its place on the line from the midpoint; from there glide in along that line, slowing to a stop on the
      // place, and there turn to face along the circle. Coming in from outside, it is never nearer its partner than
      // their places are apart; and the two start turning exactly on their places, so the turn's first step is only
      // its own. The zone and the other swimmers may shorten a step, but no neighbour pushes it aside.
      const r = s.apart / 2
      const [ux, uz] = [(px - s.cx) / r, (pz - s.cz) / r]
      const [qx, qz] = [px + ux * SETTLE, pz + uz * SETTLE]
      const d = Math.hypot(px - b.x, pz - b.z), on = d < 1e-9
      // in, when it is close to that point or already between it and its place
      const gliding = !on && (Math.hypot(qx - b.x, qz - b.z) < SETTLE / 3 || (d < SETTLE + 1e-9 && (b.x - px) * ux + (b.z - pz) * uz >= 0))
      const [gx, gz] = gliding || on ? [px, pz] : [qx, qz]
      const dg = Math.hypot(gx - b.x, gz - b.z), toward = Math.atan2(-(gz - b.z), gx - b.x)
      if (on) b.heading = turnToward(b.heading, along, S.turn * dt)
      else if (!gliding) b.heading = turnToward(b.heading, toward, S.turn * dt)
      const onto = gliding ? 1 : Math.max(0, Math.cos(wrap(toward - b.heading)))
      const want = Math.min(S.circle.gather * onto, Math.sqrt(2 * ACCEL * (gliding ? d : dg + SETTLE)))
      b.speed += Math.max(-ACCEL * dt, Math.min(ACCEL * dt, want - b.speed))
      if (gliding) {
        const k = Math.min(1, (b.speed * dt) / d)
        b.moveBy((px - b.x) * k, (pz - b.z) * k)
      } else if (!on) b.moveBy(Math.cos(b.heading) * b.speed * dt, -Math.sin(b.heading) * b.speed * dt)
      if (first) {
        const [ox, oz] = [s.cx * 2 - px, s.cz * 2 - pz]
        const other = s.pair[1]
        const facing = (h: number) => Math.abs(wrap(h - along)) < 0.05
        const there = on && Math.hypot(ox - other.x, oz - other.z) < 1e-9 && facing(b.heading) && Math.abs(wrap(other.heading - along - Math.PI)) < 0.05
        if (there && room(s.cx, s.cz, other, S.circle.room.start)) { s.spinning = true; s.at = clock; s.ends = clock + bout; ring(S.circle.ring, 0) }
        // a pair that can't get to their places in time, or find room to turn there: no spin after all
        else if (clock > s.ends) return false
      }
      return true
    }
    b.x = px
    b.z = pz
    b.speed = (s.rate * s.apart) / 2
    // the heading comes round to the circle's tangent, then turns with it
    b.heading = turnToward(b.heading, along, (s.rate + S.turn) * dt)
    return true
  }

  const self: BehaviorController = {
    name: 'swim',
    get state() { return state },
    get x() { return b.x }, get y() { return 0 }, get z() { return b.z },
    // a skimming bird's head wanders a few degrees either way as it paddles
    get heading() { return b.heading + ease(skimming) * S.skim.wander * Math.sin(2 * Math.PI * S.skim.wanderHz * clock) },
    spacing: S.spacing.other,
    group,
    update(dt: number, pose: PoseState) {
      clock += dt
      timer -= dt
      sinceRing += dt
      // a flockmate that has asked this bird to spin: it leaves whatever it was doing and joins
      if (group.spin && group.spin.pair[1] === self && state !== 'circle') { state = 'circle'; b.partner = group.spin.pair[0] }
      // two others of the flock have started a spin: a bird whose way lies through the room they turn in goes elsewhere
      if (group.spin !== passed) {
        passed = group.spin
        if ((state === 'cruise' || state === 'skim') && inTheWay(tx, tz)) [tx, tz] = spot()
      }
      if (state === 'circle') {
        // its spin, if the record is still its own: a partner that finished may already have cleared it and asked
        // another bird, and that spin is none of this bird's business
        const s = group.spin
        if (!s || !s.pair.includes(self) || !spin(s, dt)) {
          if (s && s.pair[0] === self) group.spin = undefined
          // after a spin the pair feeds side by side, pottering a little while, and keeps its distance again
          b.partner = null
          skim(false, S.circle.after)
        }
      } else if (state === 'cruise') {
        if (b.swimTo(tx, tz, S.cruise.speed, dt) < 0.05) {
          if (following || timer < 1) next()
          else [tx, tz] = spot()
        } else if (timer <= 0) next()
      } else if (state === 'skim') {
        const speed = travelling ? S.skim.travel.speed : S.skim.potter.speed
        if (b.swimTo(tx, tz, down || !travelling ? speed : 0, dt) < 0.05) [tx, tz] = spot()
        if (travelling && down && sinceRing >= S.skim.ring.every && b.speed > speed / 2) { sinceRing = 0; ring(S.skim.ring.size, S.skim.ring.ahead) }
        skimLeft -= dt
        if (timer <= 0) {
          if (travelling) {
            if (down) { down = false; timer = S.skim.travel.up }
            else next()
          } else if (down) {
            // the face comes up, the bill left in the surface film; now and then the whole head comes up
            down = false
            lookUp = ctx.rng() < S.skim.potter.lookUp
            timer = between(ctx.rng, S.skim.potter.raised)
          } else if (skimLeft <= 0) next()
          else { down = true; lookUp = false; timer = between(ctx.rng, S.skim.potter.down); ring(S.skim.ring.size * 0.6, S.skim.ring.ahead) }
        } else if (ctx.rng() < S.tipUp.perSecond * dt) {
          state = 'tipUp'
          timer = between(ctx.rng, S.tipUp.seconds) + (S.tipUp.down - S.tipUp.up) / 2
          ring(S.tipUp.ring, 0)
        }
      } else if (state === 'tipUp') {
        b.float(dt)
        if (timer <= 0) { ring(S.tipUp.ring, 0); skim(false) }
      } else {
        b.float(dt)
        if (timer <= 0) next()
      }
      sinceWake += dt
      if (b.speed > S.wake.above && sinceWake >= S.wake.every) { sinceWake = 0; ctx.onRipple?.(b.x, b.z, S.wake.size) }

      // posture, each part eased at a steady rate and shaped with smoothstep
      // the bill: in the water while spinning; skimming, the travelling head down until its closing look up, the
      // potterer's bill in the film through its dips and raises but for a raise that lifts the head clear
      const wantBill = state === 'circle' || (state === 'skim' && (travelling ? down : !lookUp)) ? 1 : 0
      const wantFace = (state === 'skim' && !travelling && down) || state === 'circle' ? 1 : 0
      const wantTilt = state === 'tipUp' ? 1 : 0
      bill = step(bill, wantBill, dt / S.skim.ease)
      face = step(face, wantFace, dt / S.skim.ease)
      tilt = step(tilt, wantTilt, dt / (wantTilt > tilt ? S.tipUp.down : S.tipUp.up))
      skimming = step(skimming, state === 'skim' ? 1 : 0, dt)
      const kBill = ease(bill), kFace = ease(face), kTilt = ease(tilt)
      pose.reach = kBill * (1 - kTilt)
      pose.reachDepth = S.skim.film + (S.skim.face - S.skim.film) * kFace
      pose.reachAngle = S.skim.reachAngle
      pose.lean.x = S.tipUp.lean * kTilt
      pose.tailTilt = S.tipUp.tail * kTilt
      pose.paddle = kTilt
      paddlePhase = (paddlePhase + S.tipUp.strokes * dt) % 1
      pose.paddlePhase = paddlePhase
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
