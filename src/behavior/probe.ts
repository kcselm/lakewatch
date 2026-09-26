import type { BehaviorContext, BehaviorController } from './types'
import { turnToward, approach, polygonOf } from './types'
import { randomPointInPolygon, clampToPolygon } from '../location/zones'
import type { PolygonZone } from '../location/schema'
import type { PoseState } from '../birds/model'
import type { Foraging } from '../birds/spec'

/**
 * How each foraging style moves, from docs/research/2026-09-25-killdeer-least-sandpiper.md, section 10, and for the
 * dowitcher docs/research/2026-09-25-long-billed-dowitcher-pectoral-sandpiper.md, section 11 (most values are
 * estimates from timed plovers and short videos; see there). A plover hunts by eye: it runs a short way, stops dead
 * with its head up, and now and then tips forward for a single dab. A sandpiper feels for food: it walks slowly with
 * its bill going down and up, stops for a few quick probes, and runs to keep up with its flock. A dowitcher stands
 * belly-deep, tipped forward, and stitches: its bill goes in and out of the mud three times a second while it creeps a
 * step or two at a time, and now and then it lifts its head to look.
 */
export const STYLES = {
  plover: {
    run: { speed: 0.6, distance: [0.3, 1.2] as [number, number] },
    look: { seconds: [1, 4] as [number, number], lean: -0.05, neckExtend: 0.55, peckChance: 0.5 },
    // a plover's short neck reaches the ground only with the body tipped well forward and the neck stretched
    peck: { seconds: 0.4, lean: 0.82, neckExtend: 1 },
  },
  sandpiper: {
    walk: { speed: 0.1, distance: [0.15, 0.6] as [number, number], pecksPerSecond: 2.5 },
    probe: { count: [2, 5] as [number, number], perSecond: 3, chance: 0.4 },
    peck: { lean: 0.3, neckExtend: 0.5 },
    run: { speed: 0.4, whenFarther: 2 },
    flock: { radius: 1.5, retargetSeconds: 45 },
  },
  dowitcher: {
    // tipped well forward, the bill rests on the mud at the top of a stroke (reach 0) and goes in to probeDepth at the bottom
    stitch: { seconds: [2, 5] as [number, number], perSecond: 3, high: 0, lean: 0.8, neckExtend: 1 },
    creep: { speed: 0.025, distance: [0.03, 0.1] as [number, number] },
    look: { chance: 0.4, seconds: [1.5, 3.5] as [number, number] },
    follow: { speed: 0.12, whenFarther: 1.5 },
    /** how long the head takes to go down into the water, or come up out of it */
    dip: { seconds: 0.4 },
    /** a small ring on the water, a bill going in, at most every `every` seconds, `ahead` metres in front of the bird */
    ripple: { every: 1, ahead: 0.12, size: 0.4 },
    /** the flock works one patch, then drifts a short way on to the next */
    flock: { radius: 1, retargetSeconds: 45, drift: 1.2 },
    /** the water it feeds in, shallowest to deepest, metres: up to its intertarsal joint at least, its wing kept dry */
    water: [0.035, 0.055] as [number, number],
  },
}

/** The pose at the bottom of each style's peck, for checking that the bill reaches the ground. */
export const PECK_BOTTOM: Record<Foraging, { lean: number; neckExtend: number; reach: number }> = {
  plover: { lean: STYLES.plover.peck.lean, neckExtend: STYLES.plover.peck.neckExtend, reach: 1 },
  sandpiper: { lean: STYLES.sandpiper.peck.lean, neckExtend: STYLES.sandpiper.peck.neckExtend, reach: 1 },
  dowitcher: { lean: STYLES.dowitcher.stitch.lean, neckExtend: STYLES.dowitcher.stitch.neckExtend, reach: 1 },
}

/** the fastest any style turns, rad/s */
export const TURN = 8
/** how fast the legs come up to a full stride when the bird sets off, and settle when it stops */
const GAIT_RISE = 30
const GAIT_FALL = 10

export function createProbe(ctx: BehaviorContext, startX: number, startZ: number): BehaviorController {
  switch (ctx.foraging ?? 'sandpiper') {
    case 'plover': return createPlover(ctx, startX, startZ)
    case 'dowitcher': return createDowitcher(ctx, startX, startZ)
    default: return createSandpiper(ctx, startX, startZ)
  }
}

const between = (rng: () => number, [lo, hi]: [number, number]) => lo + rng() * (hi - lo)
/** smoothstep: 0 to 1, starting and ending at zero speed */
const ease = (t: number) => t * t * (3 - 2 * t)

/**
 * A flock's shared target, which moves on now and then (anywhere in the zone, or, with `drift`, at most that many
 * metres), and spots near it for one bird.
 */
function createFlock(ctx: BehaviorContext, zone: PolygonZone, x: number, z: number, settings: { radius: number; retargetSeconds: number; drift?: number }) {
  const group = ctx.group ?? { targetX: x, targetZ: z, retargetAt: Infinity }
  return {
    group,
    /** a spot within `radius` of the shared target, moving the target on first if it is due */
    near(clock: number): [number, number] {
      if (clock >= group.retargetAt) {
        const [px, pz] = randomPointInPolygon(zone.points, ctx.rng)
        const d = Math.hypot(px - group.targetX, pz - group.targetZ)
        const k = settings.drift === undefined || d <= settings.drift ? 1 : settings.drift / d
        ;[group.targetX, group.targetZ] = [group.targetX + (px - group.targetX) * k, group.targetZ + (pz - group.targetZ) * k]
        group.retargetAt = clock + settings.retargetSeconds
      }
      const a = ctx.rng() * Math.PI * 2, r = ctx.rng() * settings.radius
      return clampToPolygon(group.targetX + Math.cos(a) * r, group.targetZ + Math.sin(a) * r, zone.points)
    },
    /** how far (px, pz) is from the shared target */
    distance(px: number, pz: number): number { return Math.hypot(group.targetX - px, group.targetZ - pz) },
  }
}

/** Position, heading, and the moves every style shares: walking the legs, standing still, ruffling in the wind. */
function createBody(ctx: BehaviorContext, x: number, z: number) {
  const zone = polygonOf(ctx)
  return {
    zone, x, z, heading: ctx.rng() * Math.PI * 2,
    /**
     * Move toward (tx, tz) at `speed`, inside the zone, walking the legs by exactly the ground covered. The pace
     * builds with the gait, so the body never outruns legs still easing into their stride. Returns the distance left.
     */
    moveToward(tx: number, tz: number, speed: number, dt: number, pose: PoseState): number {
      this.heading = turnToward(this.heading, Math.atan2(-(tz - this.z), tx - this.x), TURN * dt)
      pose.gait = approach(pose.gait, 1, GAIT_RISE, dt)
      const step = Math.min(speed * pose.gait * dt, Math.hypot(tx - this.x, tz - this.z))
      const [px, pz] = [this.x, this.z]
      ;[this.x, this.z] = clampToPolygon(this.x + Math.cos(this.heading) * step, this.z - Math.sin(this.heading) * step, zone.points)
      pose.strideDistance += Math.hypot(this.x - px, this.z - pz)
      pose.lean.z = approach(pose.lean.z, 0, 4, dt)
      return Math.hypot(tx - this.x, tz - this.z)
    },
    /** Stand: the legs settle, and a gust ruffles. */
    still(dt: number, pose: PoseState): void {
      pose.gait = approach(pose.gait, 0, GAIT_FALL, dt)
      pose.lean.z = approach(pose.lean.z, (ctx.wind().effective - 0.3) * 0.05, 2, dt)
    },
    /** Turn on the spot toward (tx, tz), no faster than TURN; true once facing it. */
    faceToward(tx: number, tz: number, dt: number): boolean {
      const want = Math.atan2(-(tz - this.z), tx - this.x)
      this.heading = turnToward(this.heading, want, TURN * dt)
      return Math.abs(Math.atan2(Math.sin(want - this.heading), Math.cos(want - this.heading))) < 0.05
    },
    /** A point `d` metres away, toward a random point in the zone. */
    pointAway(d: number): [number, number] {
      const [px, pz] = randomPointInPolygon(zone.points, ctx.rng)
      const len = Math.hypot(px - this.x, pz - this.z) || 1
      return clampToPolygon(this.x + ((px - this.x) / len) * d, this.z + ((pz - this.z) / len) * d, zone.points)
    },
  }
}

function createPlover(ctx: BehaviorContext, startX: number, startZ: number): BehaviorController {
  const S = STYLES.plover
  const b = createBody(ctx, startX, startZ)
  let state: 'run' | 'look' | 'peck' = 'look'
  let timer = between(ctx.rng, S.look.seconds)
  let [tx, tz] = [b.x, b.z]
  let facing = false

  function run(): void {
    state = 'run'
    facing = false                                              // a plover turns while it stands, then dashes straight
    ;[tx, tz] = b.pointAway(between(ctx.rng, S.run.distance))
    // a guard, in case the zone edge stops it short: time to turn round, run there, and get into its stride
    timer = Math.PI / TURN + Math.hypot(tx - b.x, tz - b.z) / S.run.speed + 1
  }
  function look(): void { state = 'look'; timer = between(ctx.rng, S.look.seconds) }

  return {
    name: 'probe',
    get state() { return state },
    get x() { return b.x }, get y() { return ctx.ground(b.x, b.z) }, get z() { return b.z }, get heading() { return b.heading },
    update(dt: number, pose: PoseState) {
      timer -= dt
      if (state === 'run') {
        pose.lean.x = approach(pose.lean.x, 0, 8, dt)
        pose.neckExtend = approach(pose.neckExtend, 0.5, 8, dt)
        pose.reach = approach(pose.reach, 0, 12, dt)
        if (!facing) { b.still(dt, pose); facing = b.faceToward(tx, tz, dt); if (timer <= 0) look() }
        else if (b.moveToward(tx, tz, S.run.speed, dt, pose) < 0.01 || timer <= 0) look()
      } else if (state === 'look') {
        b.still(dt, pose)
        pose.lean.x = approach(pose.lean.x, S.look.lean, 8, dt)
        pose.neckExtend = approach(pose.neckExtend, S.look.neckExtend, 6, dt)
        pose.reach = approach(pose.reach, 0, 12, dt)
        if (timer <= 0) {
          if (ctx.rng() < S.look.peckChance) { state = 'peck'; timer = S.peck.seconds }
          else run()
        }
      } else {
        b.still(dt, pose)
        // one tilt down and back, easing out of rest and into it again (sin^2, which starts and ends at zero speed);
        // the bottom, halfway through, is PECK_BOTTOM
        const down = Math.sin(Math.PI * Math.min(1, Math.max(0, 1 - timer / S.peck.seconds))) ** 2
        pose.lean.x = S.look.lean + (S.peck.lean - S.look.lean) * down
        pose.neckExtend = S.look.neckExtend + (S.peck.neckExtend - S.look.neckExtend) * down
        pose.reach = down
        if (timer <= 0) look()
      }
    },
  }
}

function createSandpiper(ctx: BehaviorContext, startX: number, startZ: number): BehaviorController {
  const S = STYLES.sandpiper
  const b = createBody(ctx, startX, startZ)
  const flock = createFlock(ctx, b.zone, startX, startZ, S.flock)
  let state: 'walk' | 'peck' | 'run' = 'walk'
  let timer = 0
  let clock = 0
  let phase = 0
  let [tx, tz] = [b.x, b.z]

  /** Walk a short way toward a spot near the flock, or run there if the flock has moved on. */
  function move(): void {
    const [nx, nz] = flock.near(clock)
    const far = flock.distance(b.x, b.z) > S.run.whenFarther
    // a run carries the bill level; back to walking, the next peck starts from rest rather than mid-way
    if (state === 'run' && !far) phase = Math.ceil(phase)
    state = far ? 'run' : 'walk'
    if (far) [tx, tz] = [nx, nz]
    else {
      const d = Math.hypot(nx - b.x, nz - b.z) || 1, len = Math.min(d, between(ctx.rng, S.walk.distance))
      ;[tx, tz] = [b.x + ((nx - b.x) / d) * len, b.z + ((nz - b.z) / d) * len]
    }
    timer = Math.hypot(tx - b.x, tz - b.z) / (far ? S.run.speed : S.walk.speed) + 1
  }
  /** a few quick probes on the spot; the peck phase carries on, so a peck under way doesn't snap */
  function probe(): void {
    state = 'peck'
    timer = Math.round(between(ctx.rng, S.probe.count)) / S.probe.perSecond
  }
  /**
   * the bill going down and up, `perSecond` times a second: down and back in the first half of each cycle (sin^2,
   * easing out of rest and into it again), resting for the second half
   */
  function pecking(perSecond: number, dt: number, pose: PoseState): void {
    phase += perSecond * dt
    const f = phase - Math.floor(phase)
    pose.reach = f < 0.5 ? Math.sin(2 * Math.PI * f) ** 2 : 0
    pose.lean.x = approach(pose.lean.x, S.peck.lean, 6, dt)
    pose.neckExtend = approach(pose.neckExtend, S.peck.neckExtend, 6, dt)
  }

  move()
  return {
    name: 'probe',
    get state() { return state },
    get x() { return b.x }, get y() { return ctx.ground(b.x, b.z) }, get z() { return b.z }, get heading() { return b.heading },
    update(dt: number, pose: PoseState) {
      clock += dt
      timer -= dt
      if (state === 'walk') {
        pecking(S.walk.pecksPerSecond, dt, pose)
        if (b.moveToward(tx, tz, S.walk.speed, dt, pose) < 0.01 || timer <= 0) {
          if (ctx.rng() < S.probe.chance) probe()
          else move()
        }
      } else if (state === 'peck') {
        b.still(dt, pose)
        pecking(S.probe.perSecond, dt, pose)
        if (timer <= 0) move()
      } else {
        pose.reach = approach(pose.reach, 0, 12, dt)
        pose.lean.x = approach(pose.lean.x, 0.1, 8, dt)
        pose.neckExtend = approach(pose.neckExtend, 0.5, 8, dt)
        if (b.moveToward(tx, tz, S.run.speed, dt, pose) < 0.01 || timer <= 0) move()
      }
    },
  }
}

function createDowitcher(ctx: BehaviorContext, startX: number, startZ: number): BehaviorController {
  const S = STYLES.dowitcher
  const b = createBody(ctx, startX, startZ)
  const flock = createFlock(ctx, b.zone, startX, startZ, S.flock)
  let state: 'stitch' | 'creep' | 'look' | 'follow' = 'stitch'
  let timer = between(ctx.rng, S.stitch.seconds)
  let clock = 0
  let phase = 0
  /** how far the head is down in the stitch posture, 0 (up, at rest) to 1 */
  let dip = 0
  let sinceRing = Infinity
  let facing = false
  let [tx, tz] = [b.x, b.z]

  function stitch(): void { state = 'stitch'; timer = between(ctx.rng, S.stitch.seconds) }
  function look(): void { state = 'look'; timer = between(ctx.rng, S.look.seconds) }
  /**
   * Creep a little way toward a spot near the flock, or follow it with the head up if it has moved on. Either way the
   * bird turns on the spot first and then goes straight, so in a convex zone it never strays out and needs the clamp.
   */
  function move(): void {
    const [nx, nz] = flock.near(clock)
    facing = false
    if (flock.distance(b.x, b.z) > S.follow.whenFarther) {
      state = 'follow'
      ;[tx, tz] = [nx, nz]
      timer = Math.PI / TURN + Math.hypot(tx - b.x, tz - b.z) / S.follow.speed + 1
    } else {
      state = 'creep'
      const d = Math.hypot(nx - b.x, nz - b.z) || 1, len = Math.min(d, between(ctx.rng, S.creep.distance))
      ;[tx, tz] = [b.x + ((nx - b.x) / d) * len, b.z + ((nz - b.z) / d) * len]
      timer = Math.PI / TURN + len / S.creep.speed + 1
    }
  }

  return {
    name: 'probe',
    get state() { return state },
    get x() { return b.x }, get y() { return ctx.ground(b.x, b.z) }, get z() { return b.z }, get heading() { return b.heading },
    update(dt: number, pose: PoseState) {
      clock += dt
      timer -= dt
      sinceRing += dt
      // the head goes down into the water to stitch and creep, and comes up to look and follow
      const down = state === 'stitch' || state === 'creep'
      dip = Math.min(1, Math.max(0, dip + (down ? dt : -dt) / S.dip.seconds))
      if (state === 'stitch') {
        b.still(dt, pose)
        if (timer <= 0) { if (ctx.rng() < S.look.chance) look(); else move() }
      } else if (state === 'look') {
        b.still(dt, pose)
        if (timer <= 0) stitch()
      } else {
        const speed = state === 'creep' ? S.creep.speed : S.follow.speed
        if (!facing) {
          b.still(dt, pose)
          facing = b.faceToward(tx, tz, dt)
          if (timer <= 0) stitch()
        } else if (b.moveToward(tx, tz, speed, dt, pose) < 0.01 || timer <= 0) stitch()
      }
      // The bill runs between the stitch's high point and the bottom, along sin^2, as far as the head is down. The
      // phase never resets, so a bout picks up where the last left off, and the head eases in and out (smoothstep).
      const before = phase - Math.floor(phase)
      phase += S.stitch.perSecond * dt
      const f = phase - Math.floor(phase)
      const k = ease(dip)
      pose.reach = k * (S.stitch.high + (1 - S.stitch.high) * Math.sin(Math.PI * f) ** 2)
      pose.lean.x = S.stitch.lean * k
      pose.neckExtend = 0.5 + (S.stitch.neckExtend - 0.5) * k
      // the bottom of a stroke (f crossing a half) rings the water where the bill goes in
      if (k > 0.99 && before < 0.5 && f >= 0.5 && sinceRing >= S.ripple.every) {
        sinceRing = 0
        ctx.onRipple?.(b.x + Math.cos(b.heading) * S.ripple.ahead, b.z - Math.sin(b.heading) * S.ripple.ahead, S.ripple.size)
      }
    },
  }
}
