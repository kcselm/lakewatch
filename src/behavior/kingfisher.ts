import type { BehaviorContext, BehaviorController, Perch } from './types'
import { approach, between, ease, wrap } from './types'
import { dubinsPaths, pointAt, type DubinsPath, type Pose2 } from './flightPath'
import { WIND_SPEED } from '../world/wind'
import type { PoseState } from '../birds/model'

type Range = readonly [number, number]

/** The kingfisher's settings: how it sits, hunts, flies, lands, deals with a catch, and rattles. */
export interface KingfisherSettings {
  /**
   * a perch bout, seconds, with idles; then a perch plunge, a flyout to hover, or a move to another perch, by these
   * shares, and the rest another bout
   */
  perch: { seconds: Range; next: { plunge: number; hover: number; move: number } }
  /**
   * now and then on a perch: a head bob (the head, `headAbove` metres over the perch, dipped `dip` metres and back), a
   * tail flick (`tilt` radians up and down), the crest up (`rise` seconds each way, held `hold`), the head turned
   * `yaw` radians and back; each every `every` seconds, taking `seconds`. For `settle` seconds after landing each
   * comes sooner.
   */
  idle: {
    bob: { every: Range; seconds: Range; dip: Range; headAbove: number }
    flick: { every: Range; seconds: Range; tilt: Range }
    crest: { every: Range; rise: number; hold: Range }
    turn: { every: Range; seconds: Range; yaw: Range }
    settle: number
  }
  /** the bill at rest, radians below level, as traced; the head turns from there */
  billRest: number
  /** peering down at the water before a perch plunge: how long, and the bill radians below level */
  peer: { seconds: Range; bill: Range }
  /**
   * a perch plunge: leaning out `lean` seconds, then off the branch head first with the wings half open (`spread`),
   * going in at `entry` m/s and `angle` radians below level, slowed by its wings to no more than that
   */
  perchPlunge: { lean: Range; leanTo: number; entry: Range; angle: Range; spread: number }
  /** a flyout to hover: the hover point `metres` from the perch, within `arc` radians of the way the perch faces */
  flyout: { metres: Range; arc: number }
  /**
   * a hover: `height` metres up, the body tilted up `body` radians from level flight, the tail fanned `tail`, the bill
   * `bill` radians below level; each hover `seconds`, `hovers` of them in a bout, each after the first a shift of
   * `metres` on a shallow U `dip` metres deep over `seconds`. `giveUp` of bouts end in a flight to a perch, not a plunge.
   */
  hover: { height: Range; body: number; tail: number; bill: number; seconds: Range; hovers: Range; giveUp: number; shift: { metres: Range; seconds: Range; dip: number } }
  /** a hover plunge: straight down at no more than `entry` m/s, drifting `drift` m/s along its heading, wings half open (`spread`) */
  hoverPlunge: { entry: Range; drift: Range; spread: number }
  /** both plunges: the wings fold over the last `fold` seconds; water at least `water` metres deep, by the depth bake */
  plunge: { fold: number; water: number }
  /** under the water, hidden: `seconds`, `depth` metres down; `catch` of plunges take a fish */
  under: { seconds: Range; depth: number }
  catch: number
  /**
   * coming up and off the water: `seconds` to rise `rise` metres and reach `speed` m/s, beating at `hz`, facing water
   * `fly.water` deep `ahead` metres on
   */
  emerge: { seconds: number; rise: number; speed: number; hz: number; ahead: number }
  /**
   * flight: `speed` m/s, `height` metres over the water between perches; turning no faster than `turn` rad/s nor
   * with more than `lateral` m/s/s sideways, on paths of these turn `radii`, a move between perches on none tighter
   * than `moveRadius`; speeding up at `accel`, braking at `brake`, leaving a perch at `leave` m/s; climbing no
   * steeper than `climb` (rise over run) and descending no steeper than `descend`. Paths keep `clear` metres off any
   * perch they don't start or end at, stay over water `water` deep but for `ends` metres at a perch, and that deep
   * `margin` metres either side. A path no longer than `detour` times the straight line and `loop` metres.
   */
  fly: {
    speed: Range; height: Range; turn: number; lateral: number; radii: readonly number[]; moveRadius: number
    accel: number; brake: number; leave: number; climb: number; descend: number
    clear: number; water: number; ends: number; margin: number; detour: number; loop: number
  }
  /**
   * landing: braking to `arrive` m/s with the hovering stroke, the body tilted up `body`, the tail fanned `tail` and
   * the feet reaching forward; folding over `fold` seconds; then turning about on the branch to face the water in `about`
   */
  land: { arrive: number; body: number; tail: Range; fold: Range; about: number }
  /**
   * after a catch, on the perch: beating the fish on the branch `beats` times over `beat` seconds (no more than
   * `beatHz` a second), the head swung `yaw` and dipped `dip`; turning it head first over `turn`; swallowing over
   * `swallow` with the bill tipped up `pitch` radians. `seconds` in all.
   */
  handle: { beats: Range; beat: Range; beatHz: number; yaw: number; dip: number; turn: Range; swallow: Range; pitch: Range; seconds: Range }
  /**
   * wingbeats, Hz: bouts of `bout` beats, the first `quickBeats` at `quick`, the rest at `slow`, then a glide of
   * `glide` seconds; a hover's beat `calm` in still air, falling `perWind` a metre a second of wind, within `range`
   */
  wingbeat: { quick: number; slow: number; quickBeats: number; bout: Range; glide: Range; hover: { calm: number; perWind: number; range: Range } }
  /** the chance of a rattle as it leaves for another perch, flies out to hover, lands, plunges, comes up with a fish; and once a `quiet` while on a perch */
  rattle: { move: number; flyout: number; land: number; plunge: number; catch: number; quiet: Range }
  /** ring sizes: going in, and coming up off the water */
  ring: { plunge: number; takeoff: number }
}

/**
 * The real pace, from a wintering bird on a Colorado river (Kelly 1998a, Table 2, through
 * docs/research/2026-09-30-belted-kingfisher.md, section 7.1): perch bouts of 5.7-15.7 minutes, 0.7-3.1 plunges an
 * hour, 4.1-7.2 flights an hour. A player would wait 20-60 minutes for a plunge at that rate, so the settings run about
 * four times faster (the spec's "Pace"); everything within a state keeps its real timing.
 */
export const REAL_PACE = { perchMinutes: [5.7, 15.7], plungesPerHour: [0.7, 3.1], flightsPerHour: [4.1, 7.2] } as const

/**
 * The Belted Kingfisher, from docs/research/2026-09-30-belted-kingfisher.md, section 11 (behaviour in 7.1, the perched
 * posture in 6), and docs/research/2026-09-30-kingfisher-flight-and-plunge.md (flight 3, hovering 4, take-off and
 * landing 5, the plunge 6, frames per beat 7, the poses 8.4). Each number says where it comes from: sourced, computed,
 * compressed (sped up about four times for play, with the real rate beside it), cross-species, or an estimate.
 */
export const KINGFISHER: KingfisherSettings = {
  // compressed about 4x: the real bouts are 5.7-15.7 min (Kelly 1998a). The shares are ours, tuned on long runs for
  // 10-15 plunges an hour (real 0.7-3.1), about 0.65 of them from the perch (no source counts them), and flights every
  // 2-4 minutes; the rest of the time another bout
  perch: { seconds: [60, 240], next: { plunge: 0.38, hover: 0.26, move: 0.28 } },
  idle: {
    // behaviour sourced (Bent 1940, p. 122: the tail tilted, the crest raised and lowered on landing); every size,
    // length, and rate here an estimate (species research, section 6). The eye is 124 mm over the perch (photo)
    bob: { every: [5, 20], seconds: [0.3, 0.5], dip: [0.010, 0.015], headAbove: 0.124 },
    flick: { every: [10, 30], seconds: [0.2, 0.4], tilt: [0.35, 0.52] },
    crest: { every: [20, 60], rise: 0.3, hold: [1, 5] },
    turn: { every: [10, 30], seconds: [1, 3], yaw: [0.52, 1.05] },
    settle: 5,
  },
  // 4 degrees below level, alert (photo)
  billRest: 0.07,
  // the bill 40-45 degrees down (photo, 44); 1-4 s an estimate
  peer: { seconds: [1, 4], bill: [0.70, 0.79] },
  // the lean 0.2-0.4 s (estimate); in at 5-8 m/s (estimate, flight research 6.1) and 45-70 degrees below level (the
  // flight research's 40-70, steepening along the path; the species research's 82-degree photo is the start of the
  // drop); the wings half open, steering (flight research 8.4: 0.5-0.6)
  perchPlunge: { lean: [0.2, 0.4], leanTo: 0.35, entry: [5, 8], angle: [0.79, 1.22], spread: 0.55 },
  // 15-40 m out (estimate: hovering fishes water beyond the 15 m fished from perches, Prose 1985); within 70 degrees
  // of the way the perch faces, ours
  flyout: { metres: [15, 40], arc: 1.22 },
  hover: {
    // the spec's 9-12 m, Bent's "30 or 40 feet" (the species research's table takes it down to 5, an estimate)
    height: [9, 12],
    // the body 55 degrees up (by eye 53; flight research 4.3), so 0.96 rad up from level flight; the tail fanned 100
    // degrees, 0.7 of the 140 at tailSpread 1 (by eye); the bill 75 degrees down (pied 76 +- 9, cross-species)
    body: 0.96, tail: 0.7, bill: 1.31,
    // 2-6 s a hover ("a few seconds": Audubon 1831, Bent 1940); up to two shifts of 2-5 m on a shallow U in 1-2 s (the
    // pied's U, cross-species; distances and the dip estimates); 0.3 give up (estimate)
    seconds: [2, 6], hovers: [1, 3], giveUp: 0.3, shift: { metres: [2, 5], seconds: [1, 2], dip: 0.5 },
  },
  // in at 7-10 m/s (estimate: wings open until the last moment, below free fall's 13-15 from 9-12 m); straight down
  // (Bent: "directly downward"), drifting 0.5-1.5 m/s, ours, so 78-88 degrees
  hoverPlunge: { entry: [7, 10], drift: [0.5, 1.5], spread: 0.55 },
  // the wings swept back over the last 0.1-0.2 s (by eye); 0.3 m of water at least (estimate from the top 15 cm where
  // fish are caught, Prose 1985, and the body)
  plunge: { fold: 0.15, water: 0.3 },
  // hidden 0.5-1.5 s ("emerge almost instantly", Gabrielson & Jewett 1940; "several seconds" at most, Bent), no deeper
  // than 0.3 m (estimate)
  under: { seconds: [0.5, 1.5], depth: 0.3 },
  // 0.34 (Booth et al. 2021) to 0.75-0.96 (Kelly 1998a, computed); an estimate inside them
  catch: 0.5,
  // 2-4 strong beats at about 8 Hz and level flight within about a second (by eye on photos; estimate); 8 m of deep water
  // ahead, ours, leaves room to turn for a perch without crossing the shallows
  emerge: { seconds: 0.6, rise: 0.6, speed: 3, hz: 8, ahead: 8 },
  fly: {
    // 9-13 m/s (estimate, below the 16-18 m/s of a travelling bird, Burland 1947); 0.3-1.5 m over the water (Carey
    // 1909, Bent 1940; heights estimate)
    speed: [9, 13], height: [0.3, 1.5],
    // no source: 2.5 rad/s and 12 m/s/s sideways (a bank of 50 degrees) are ours; a path of radius r is flown no faster
    // than either allows. Moves between perches sweep wide; a bird up from the water may loop tight back to its perch
    turn: 2.5, lateral: 12, radii: [14, 10, 7, 5, 3.5, 2.5], moveRadius: 7,
    // level flight within 0.5 s of leaving (flight research 5); braking 0.3-0.5 s from cruise (the same); dropping off
    // the branch at 1.5 m/s; climbs to 35 and descents to 45 degrees, ours
    accel: 15, brake: 20, leave: 1.5, climb: 0.7, descend: 1,
    // ours: the snag's trunk stands 1.7 m from its perch, so 4 m keeps a bird 2 m off it; 0.5 m of water keeps it off
    // the reed bed, which grows no deeper than that, and 3 m either side keeps it off the reeds and the banks' trees
    clear: 4, water: 0.5, ends: 3, margin: 3, detour: 1.6, loop: 30,
  },
  // braking 2-3 beats with the body 40-60 degrees up and the tail 100-140 degrees (by eye); the fold 0.2-0.3 s
  // (estimate); arriving at 1 m/s and the about-turn on the branch ours
  land: { arrive: 1, body: 0.87, tail: [0.7, 1], fold: [0.2, 0.3], about: 0.5 },
  // behaviour sourced (Salyer & Lagler 1946; Bent 1940; Forbush 1927); every time an estimate: 3-8 beats over 3-10 s,
  // turning 1-2 s, swallowing 1-3 s with the bill tipped up 0.4-0.6 rad, 8-20 s in all. The swing and dip are ours
  handle: { beats: [3, 8], beat: [3, 10], beatHz: 1.3, yaw: 0.6, dip: 0.3, turn: [1, 2], swallow: [1, 3], pitch: [0.4, 0.6], seconds: [8, 20] },
  wingbeat: {
    // 7 Hz (computed, Pennycuick); "three quick beats followed by two ... leisurely" (Grinnell & Storer 1924), the
    // leisurely ones 5 Hz (estimate); bouts of 5-6 beats (Audubon 1831, Bent 1940), glides of 0.3-0.8 s (estimate)
    quick: 7, slow: 5, quickBeats: 3, bout: [5, 6], glide: [0.3, 0.8],
    // 9 Hz in calm air, falling with the wind (cross-species, the pied: Katzir et al. 2018): 8.7 in the lake's 2.8 m/s
    hover: { calm: 9, perWind: 0.12, range: [6, 9.5] },
  },
  // contexts sourced (BBR 1874, p. 394; Bent 1940, pp. 111, 122; Dawson 1923, p. 1050); every rate an estimate. A plunge
  // 0.1 and a catch 0.2 make about one plunge in five, the spec's
  rattle: { move: 0.8, flyout: 0.3, land: 0.3, plunge: 0.1, catch: 0.2, quiet: [180, 480] },
  // flight research 6.5: 0.9 going in (crest at 0.356 m/s, 5.6 s), 0.6-0.7 coming up
  ring: { plunge: 0.9, takeoff: 0.65 },
}

/**
 * How fast each pose value may change, a second: the most any state's easing moves it in a frame is this times the
 * frame's length. Ours, set by the fastest motion each must make: the lean, 2.4 rad from a hover to head down in 0.3 s;
 * the wings open in 0.07-0.1 s (flight research 5); the stroke changes over 0.3 s (8.4); a tail flick of 30 degrees
 * in 0.2 s.
 */
export const KINGFISHER_RATES = {
  lean: 8, roll: 3, headPitch: 6, headYaw: 6, neck: 2, wingSpread: 14, wingStroke: 3.5, glide: 8, legsUp: 5, tailSpread: 5,
  tailTilt: 9, crestRaise: 6, fishTurn: 3,
} as const

/** A hover's wingbeat in a wind of `wind` m/s. */
export function hoverHz(S: KingfisherSettings, wind: number): number {
  const { calm, perWind, range } = S.wingbeat.hover
  return Math.min(range[1], Math.max(range[0], calm - perWind * wind))
}

type State = 'perch' | 'peer' | 'perchPlunge' | 'flyout' | 'hover' | 'shift' | 'hoverPlunge' | 'under' | 'emerge' | 'fly' | 'land' | 'handle'

/** what each pose value is easing toward this frame */
interface Target {
  lean: number; roll: number; headPitch: number; headYaw: number; neck: number; wingSpread: number; wingStroke: number
  glide: number; legsUp: number; tailSpread: number; tailTilt: number; crestRaise: number; fishTurn: number
}

/** A flight under way: its path, the height along it, its speeds, how far along it is, and where it ends. */
interface Flight {
  path: DubinsPath
  y: (s: number) => number
  cruise: number
  /** m/s at the end: 0 at a hover point, `land.arrive` at a perch */
  end: number
  s: number
  v: number
  /** the perch it lands on, or none for a hover point */
  to: Perch | null
}

const G = 9.81
/** how fast a pose value eases toward its target, a second, before the rate cap */
const EASE = 15
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const count = (rng: () => number, [lo, hi]: Range) => lo + Math.floor(rng() * (hi - lo + 1))
/** turns from a heading, the least first: straight on, then round to behind */
const TURNS = [0, ...[1, 2, 3, 4, 5, 6].flatMap(k => [(k * Math.PI) / 6, (-k * Math.PI) / 6]).slice(0, -1)]

/**
 * The `kingfisher` style, on a perches zone: it sits on a perch over the water watching, bobbing its head, flicking its
 * tail, raising its crest, turning its head; it peers down and plunges from the perch, or flies out, hovers into the
 * wind, maybe shifts and hovers again, and plunges; under the water a moment, it comes up, half the time with a fish,
 * and flies to the nearest perch, where it beats the fish on the branch, turns it, and swallows it. Now and then it
 * flies low over the water to another perch, rattling. Every flight is a path of bounded turn (flightPath.ts) over
 * deep water and clear of the perches, flapping in bouts with glides between.
 */
export function createKingfisher(ctx: BehaviorContext, _startX: number, _startZ: number, S: KingfisherSettings = KINGFISHER): BehaviorController {
  const perches: readonly Perch[] = ctx.perches ?? []
  if (perches.length === 0) throw new Error('the kingfisher needs perches')
  const rng = ctx.rng
  const pitch = ctx.flightPitch ?? 0
  const R = KINGFISHER_RATES
  const depthAt = (px: number, pz: number) => -ctx.ground(px, pz)

  let perch: Perch = perches[0]!
  let [x, y, z] = perch.position
  let heading = perch.heading
  let state: State = 'perch'
  let timer = between(rng, S.perch.seconds)
  let clock = 0
  let quiet = between(rng, S.rattle.quiet)
  let flight: Flight | null = null
  let speed = 0, curvature = 0, slope = 0, braking = false
  // a plunge: its speeds across and down, the most down, and the wings' spread as it drops
  let vh = 0, vy = 0, vyMax = 0, held = 0, leanFor = 0
  let caught = false, fish = 0
  // a hover bout: the point, how many hovers are left, whether it gives up, and a shift under way
  let hx = 0, hy = 0, hz = 0, hoverHeading = 0, hovers = 0, giveUp = false
  let shift = { fx: 0, fz: 0, tx: 0, tz: 0, seconds: 1 }
  // landing: arrived yet, the fold's length, and the about-turn from and by
  let arrived = false, fold = 0.25, aboutFrom = 0, aboutBy = 0, landTail = 0.85
  let peerBill = 0.75
  let handle = { beats: 3, beat: 3, turn: 1, swallow: 1, pitch: 0.5, seconds: 5 }
  // wingbeats: beats left in the bout, quick ones left, seconds of glide left
  let beatsLeft = 0, quickLeft = 0, gliding = 0
  // idles on the perch: each counts down to its next, then runs `t` of `dur` seconds, at `amp`
  const idle = (every: Range) => ({ every, next: between(rng, every), t: -1, dur: 1, amp: 0 })
  const idles = { bob: idle(S.idle.bob.every), flick: idle(S.idle.flick.every), crest: idle(S.idle.crest.every), turn: idle(S.idle.turn.every) }

  const call = (chance: number) => { if (rng() < chance) ctx.onCall?.() }
  const nearPerch = (px: number, pz: number, except: readonly Perch[]) =>
    perches.some(p => !except.includes(p) && Math.hypot(p.position[0] - px, p.position[2] - pz) < S.fly.clear)
  /** water deep enough to plunge into at (px, pz), off every perch but `own` */
  const plungeable = (px: number, pz: number, own: readonly Perch[] = []) => depthAt(px, pz) >= S.plunge.water && !nearPerch(px, pz, own)
  const intoWind = () => { const w = ctx.wind(); return Math.atan2(w.dirZ, -w.dirX) }

  /**
   * The height along a path of length L from y0 to y1, low over the water (`low`) between, eased at each end, or
   * straight from one to the other (`low` null, or no room to go down and come up again); null if it would climb or
   * descend steeper than the settings let it.
   */
  function profile(y0: number, y1: number, low: number | null, L: number): ((s: number) => number) | null {
    const limit = (dy: number) => (dy > 0 ? S.fly.climb : S.fly.descend)
    // a smoothstep's steepest slope is 1.5 times its average
    const run = (from: number, to: number) => (from === to ? 0 : (1.5 * Math.abs(to - from)) / limit(to - from))
    if (low !== null) {
      const d0 = run(y0, low), d1 = run(low, y1)
      if (d0 + d1 <= L) {
        return s => low + (y0 - low) * (1 - ease(d0 > 0 ? clamp01(s / d0) : 1)) + (y1 - low) * ease(d1 > 0 ? clamp01((s - (L - d1)) / d1) : 0)
      }
    }
    if (run(y0, y1) > L) return null
    return s => y0 + (y1 - y0) * ease(clamp01(s / L))
  }

  /** Whether a path keeps over deep water, above it, and off the perches it doesn't start or end at. */
  function clear(path: DubinsPath, h: (s: number) => number, from: Perch | null, to: Perch | null): boolean {
    const L = path.length
    // a path that starts beside a perch, as one up from the water may, is near it at first however it goes
    const start = pointAt(path, 0)
    const beside = perches.filter(p => Math.hypot(p.position[0] - start.x, p.position[2] - start.z) < S.fly.clear)
    if (from) beside.push(from)
    for (let s = 0; s <= L + 0.5; s += 1) {
      const at = Math.min(s, L)
      const p = pointAt(path, at)
      const nearStart = at <= S.fly.ends, nearEnd = L - at <= S.fly.ends
      const atPerch = (nearStart && from !== null) || (nearEnd && to !== null)
      // up from the water, it may start over water only deep enough to plunge into, with the first metres to get out
      const offWater = nearStart && from === null
      if (offWater && depthAt(p.x, p.z) < S.plunge.water) return false
      if (!atPerch && !offWater) {
        if (depthAt(p.x, p.z) < S.fly.water) return false
        for (let a = 0; a < 4; a++) {
          const b = p.heading + (a * Math.PI) / 2
          if (depthAt(p.x + Math.cos(b) * S.fly.margin, p.z - Math.sin(b) * S.fly.margin) < S.fly.water) return false
        }
      }
      if (!nearStart && !nearEnd && h(at) < 0.2) return false
      // off every perch, but the ones it starts beside and the one it lands on, while it is close to them along the path
      const exempt = [...(at <= S.fly.clear ? beside : []), ...(L - at <= S.fly.clear && to ? [to] : [])]
      if (nearPerch(p.x, p.z, exempt)) return false
    }
    return true
  }

  /**
   * A flight from `a` (at height y0, already flying at v0) to `b` (at y1), low over the water between if `low` is
   * given: the widest turns that make a clear path, each flown no faster than its turns allow; null if none does.
   */
  function plan(a: Pose2, y0: number, v0: number, b: Pose2, y1: number, low: number | null, from: Perch | null, to: Perch | null, minRadius = 0): Flight | null {
    const want = between(rng, S.fly.speed)
    const straight = Math.hypot(b.x - a.x, b.z - a.z)
    for (const r of S.fly.radii) {
      if (r < minRadius) continue
      const cruise = Math.min(want, S.fly.turn * r, Math.sqrt(S.fly.lateral * r))
      for (const path of dubinsPaths(a, b, r)) {
        if (path.length > S.fly.detour * straight + S.fly.loop) break
        const h = profile(y0, y1, low, path.length)
        if (h && clear(path, h, from, to)) return { path, y: h, cruise, end: to ? S.land.arrive : 0, s: 0, v: v0, to }
      }
    }
    return null
  }

  const perchPose = (p: Perch): Pose2 => ({ x: p.position[0], z: p.position[2], heading: p.heading })
  /** a perch to land on, faced from the water: arriving heading in toward the bank, to turn about on the branch */
  const arrival = (p: Perch): Pose2 => ({ x: p.position[0], z: p.position[2], heading: p.heading + Math.PI })

  /** Plans a flight to the first of `to` a clear path reaches, from where the bird is, and sets off; false if none does. */
  function flyTo(to: readonly Perch[], v0: number, from: Perch | null, minRadius = 0): boolean {
    for (const p of to) {
      const f = plan({ x, z, heading }, y, v0, arrival(p), p.position[1], between(rng, S.fly.height), from, p, minRadius)
      if (f) { setOff(f, 'fly'); return true }
    }
    return false
  }

  function setOff(f: Flight, next: 'fly' | 'flyout'): void {
    flight = f
    arrived = false
    speed = f.v
    state = next
    clock = 0
    beatsLeft = count(rng, S.wingbeat.bout)
    quickLeft = S.wingbeat.quickBeats
    gliding = 0
  }

  /** Up from the water: to the nearest perch a clear path reaches, with any fish; failing that, the nearest by its shortest way round. */
  function home(): void {
    const order = [...perches].sort((a, b) => Math.hypot(a.position[0] - x, a.position[2] - z) - Math.hypot(b.position[0] - x, b.position[2] - z))
    if (flyTo(order, S.emerge.speed, null)) return
    const p = order[0]!
    const path = dubinsPaths({ x, z, heading }, arrival(p), S.fly.radii.at(-1)!)[0]!
    setOff({ path, y: profile(y, p.position[1], null, path.length) ?? (s => y + (p.position[1] - y) * ease(s / path.length)), cruise: S.emerge.speed * 2, end: S.land.arrive, s: 0, v: S.emerge.speed, to: p }, 'fly')
  }

  /** The perch plunge from here, if its water is deep enough: its speeds, and where it goes in. */
  function perchDrop(): { vh: number; vyMax: number } | null {
    const entry = between(rng, S.perchPlunge.entry), angle = between(rng, S.perchPlunge.angle)
    const h = entry * Math.cos(angle), most = entry * Math.sin(angle)
    // where it goes in: falling from rest under gravity, no faster down than `most`
    let t = 0, fall = 0, v = 0
    while (fall < y && t < 5) { v = Math.min(most, v + G * 0.01); fall += v * 0.01; t += 0.01 }
    const d = h * t
    const ex = x + Math.cos(heading) * d, ez = z - Math.sin(heading) * d
    return plungeable(ex, ez, [perch]) ? { vh: h, vyMax: most } : null
  }

  /** The end of a perch bout: a plunge, a flyout, a move, or another bout, by the shares; one that can't be done is another bout. */
  function decide(): void {
    const { plunge, hover, move } = S.perch.next
    const r = rng()
    if (r < plunge) {
      const drop = perchDrop()
      if (drop) { vh = drop.vh; vyMax = drop.vyMax; begin('peer'); return }
    } else if (r < plunge + hover) {
      if (flyout()) return
    } else if (r < plunge + hover + move) {
      const others = perches.filter(p => p !== perch).sort(() => rng() - 0.5)
      if (flyTo(others, S.fly.leave, perch, S.fly.moveRadius)) { call(S.rattle.move); return }
    }
    begin('perch')
  }

  /** Flies out to a hover point over plunging water, if one of a few tries has a clear path; false if none. */
  function flyout(): boolean {
    for (let i = 0; i < 20; i++) {
      const a = perch.heading + (rng() * 2 - 1) * S.flyout.arc, d = between(rng, S.flyout.metres)
      const px = perch.position[0] + Math.cos(a) * d, pz = perch.position[2] - Math.sin(a) * d
      if (!plungeable(px, pz)) continue
      const py = between(rng, S.hover.height)
      const facing = intoWind()
      const f = plan(perchPose(perch), y, S.fly.leave, { x: px, z: pz, heading: facing }, py, null, perch, null)
      if (!f) continue
      ;[hx, hy, hz, hoverHeading] = [px, py, pz, facing]
      hovers = count(rng, S.hover.hovers)
      giveUp = rng() < S.hover.giveUp
      setOff(f, 'flyout')
      call(S.rattle.flyout)
      return true
    }
    return false
  }

  function begin(next: State): void {
    state = next
    clock = 0
    switch (next) {
      case 'perch': timer = between(rng, S.perch.seconds); break
      case 'peer': timer = between(rng, S.peer.seconds); peerBill = between(rng, S.peer.bill); break
      case 'perchPlunge': timer = between(rng, S.perchPlunge.lean); vy = 0; held = S.perchPlunge.spread; leanFor = timer; break
      case 'hover': timer = between(rng, S.hover.seconds); flight = null; speed = 0; break
      case 'under':
        timer = between(rng, S.under.seconds)
        caught = rng() < S.catch
        break
      case 'emerge': timer = S.emerge.seconds; break
      case 'handle': {
        const beats = count(rng, S.handle.beats)
        let beat = Math.max(between(rng, S.handle.beat), beats / S.handle.beatHz)
        const turn = between(rng, S.handle.turn), swallow = between(rng, S.handle.swallow)
        // 8-20 s in all: a short one beats the fish longer
        beat = Math.max(beat, S.handle.seconds[0] - turn - swallow)
        handle = { beats, beat, turn, swallow, pitch: between(rng, S.handle.pitch), seconds: beat + turn + swallow }
        timer = handle.seconds
        break
      }
    }
  }

  /** After a hover: a shift and another hover, a flight to a perch, or the plunge. */
  function afterHover(): void {
    hovers--
    if (hovers > 0) {
      for (let i = 0; i < 10; i++) {
        const a = rng() * Math.PI * 2, d = between(rng, S.hover.shift.metres)
        const tx = hx + Math.cos(a) * d, tz = hz - Math.sin(a) * d
        if (!plungeable(tx, tz)) continue
        shift = { fx: hx, fz: hz, tx, tz, seconds: between(rng, S.hover.shift.seconds) }
        state = 'shift'; clock = 0; timer = shift.seconds
        return
      }
    }
    if (giveUp) {
      const order = [...perches].sort(() => rng() - 0.5)
      if (flyTo(order, 0, null)) return
    }
    // where it goes in: speeding up at g to `most`, then on down at that; straight down if that is too shallow
    const most = between(rng, S.hoverPlunge.entry)
    let drift = between(rng, S.hoverPlunge.drift)
    const t = most / G + Math.max(0, hy - (most * most) / (2 * G)) / most
    if (!plungeable(hx + Math.cos(heading) * drift * t, hz - Math.sin(heading) * drift * t)) drift = 0
    vh = drift; vy = 0; vyMax = most; held = S.hoverPlunge.spread
    state = 'hoverPlunge'; clock = 0
    call(S.rattle.plunge)
  }

  /** Into the water at (x, z): the spray, the ring, the splash, and under. */
  function enter(): void {
    y = -S.under.depth
    ctx.onSplash?.(x, z, 1)
    ctx.onRipple?.(x, z, S.ring.plunge)
    ctx.onEvent?.('splash', x, 0, z)
    begin('under')
  }

  /** One frame along the flight: faster or slower as the path allows, and where that puts the bird. True on arrival. */
  function along(dt: number): boolean {
    const f = flight!
    const L = f.path.length
    const room = Math.sqrt(f.end * f.end + 2 * S.fly.brake * Math.max(0, L - f.s))
    f.v = Math.min(f.cruise, f.v + S.fly.accel * dt, room)
    braking = room < f.cruise - 1e-6 && f.s > L / 2
    // the speed is along the path in the air: up a slope it covers less ground
    slope = (f.y(Math.min(L, f.s + 0.05)) - f.y(Math.max(0, f.s - 0.05))) / 0.1
    f.s = Math.min(L, f.s + (f.v * dt) / Math.sqrt(1 + slope * slope))
    const p = pointAt(f.path, f.s)
    x = p.x; z = p.z; y = f.y(f.s)
    heading = wrap(p.heading)
    curvature = p.curvature
    speed = f.v
    return f.s >= L - 1e-9
  }

  /** A wingbeat: the phase on, no more than a sixth of a beat a frame. True as a beat ends, at the top of the stroke. */
  function beat(pose: PoseState, dt: number, hz: number): boolean {
    const next = pose.wingPhase + Math.min(hz * dt, 1 / 6)
    pose.wingPhase = next % 1
    return next >= 1
  }

  /** Flapping in bouts, with a glide after each if `mayGlide`; the glide to ease toward. */
  function flap(pose: PoseState, dt: number, mayGlide: boolean): number {
    if (gliding > 0) {
      gliding -= dt
      if (gliding > 0 && mayGlide) return 1
      gliding = 0
      beatsLeft = count(rng, S.wingbeat.bout)
      quickLeft = S.wingbeat.quickBeats
    }
    if (beat(pose, dt, quickLeft > 0 ? S.wingbeat.quick : S.wingbeat.slow)) {
      quickLeft--
      beatsLeft--
      if (beatsLeft <= 0) {
        if (mayGlide) gliding = between(rng, S.wingbeat.glide)
        else { beatsLeft = count(rng, S.wingbeat.bout); quickLeft = S.wingbeat.quickBeats }
      }
    }
    return 0
  }

  /** The idles on a perch, a frame on; and what they add: a dip of the lean, the tail up, the crest up, the head turned. */
  function idling(dt: number): { lean: number; tilt: number; crest: number; yaw: number } {
    const out = { lean: 0, tilt: 0, crest: 0, yaw: 0 }
    for (const [name, i] of Object.entries(idles) as [keyof typeof idles, (typeof idles)['bob']][]) {
      if (i.t < 0) {
        i.next -= dt
        if (i.next > 0) continue
        i.t = 0
        if (name === 'bob') { i.dur = between(rng, S.idle.bob.seconds); i.amp = between(rng, S.idle.bob.dip) / S.idle.bob.headAbove }
        if (name === 'flick') { i.dur = between(rng, S.idle.flick.seconds); i.amp = between(rng, S.idle.flick.tilt) }
        if (name === 'crest') { i.dur = 2 * S.idle.crest.rise + between(rng, S.idle.crest.hold); i.amp = 1 }
        if (name === 'turn') { i.dur = between(rng, S.idle.turn.seconds); i.amp = between(rng, S.idle.turn.yaw) * (rng() < 0.5 ? -1 : 1) }
      }
      i.t += dt
      if (i.t >= i.dur) { i.t = -1; i.next = between(rng, i.every); continue }
      const u = i.t / i.dur, wave = Math.sin(Math.PI * u)
      if (name === 'bob') out.lean = i.amp * wave
      if (name === 'flick') out.tilt = i.amp * wave
      if (name === 'crest') out.crest = i.t < i.dur - S.idle.crest.rise ? 1 : 0
      if (name === 'turn') out.yaw = i.amp * wave
    }
    return out
  }
  /** Just landed: every idle comes within the settling seconds. */
  function settle(): void {
    for (const i of Object.values(idles)) { i.t = -1; i.next = between(rng, [0.2, S.idle.settle]) }
  }
  function stopIdles(): void {
    for (const i of Object.values(idles)) if (i.t >= 0) { i.t = -1; i.next = between(rng, i.every) }
  }

  /** Each pose value eased toward its target, no faster than its rate; `quick` ones follow at once, still within it. */
  function apply(pose: PoseState, T: Target, dt: number, quick: readonly (keyof Target)[] = []): void {
    const to = (cur: number, target: number, rate: number, k: keyof Target) => {
      const eased = quick.includes(k) ? target : approach(cur, target, EASE, dt)
      return cur + Math.max(-rate * dt, Math.min(rate * dt, eased - cur))
    }
    pose.lean.x = to(pose.lean.x, T.lean, R.lean, 'lean')
    pose.lean.z = to(pose.lean.z, T.roll, R.roll, 'roll')
    pose.headPitch = to(pose.headPitch, T.headPitch, R.headPitch, 'headPitch')
    pose.headYaw = to(pose.headYaw, T.headYaw, R.headYaw, 'headYaw')
    pose.neckExtend = to(pose.neckExtend, T.neck, R.neck, 'neck')
    pose.wingSpread = to(pose.wingSpread, T.wingSpread, R.wingSpread, 'wingSpread')
    pose.wingStroke = to(pose.wingStroke, T.wingStroke, R.wingStroke, 'wingStroke')
    pose.glide = to(pose.glide, T.glide, R.glide, 'glide')
    pose.legsUp = to(pose.legsUp, T.legsUp, R.legsUp, 'legsUp')
    pose.tailSpread = to(pose.tailSpread, T.tailSpread, R.tailSpread, 'tailSpread')
    pose.tailTilt = to(pose.tailTilt, T.tailTilt, R.tailTilt, 'tailTilt')
    pose.crestRaise = to(pose.crestRaise, T.crestRaise, R.crestRaise, 'crestRaise')
    pose.fishTurn = to(pose.fishTurn, T.fishTurn, R.fishTurn, 'fishTurn')
  }

  /** the head pitched so the bill points `bill` radians below level, with the body at lean `lean` */
  const billAt = (lean: number, bill: number) => S.billRest + lean - bill

  function update(dt: number, pose: PoseState): void {
    clock += dt
    timer -= dt
    // on a perch, as traced: the wings folded, the feet down, the tail closed, a gust's ruffle
    const T: Target = {
      lean: 0, roll: (ctx.wind().effective - 0.3) * 0.02, headPitch: 0, headYaw: 0, neck: 0.5, wingSpread: 0, wingStroke: 0, glide: 0,
      legsUp: 0, tailSpread: 0, tailTilt: 0, crestRaise: 0, fishTurn: 0,
    }
    let quick: (keyof Target)[] = []
    /** in the air, along its path: the nose along it, banked into the turn, flapping in bouts */
    const flying = (mayGlide: boolean) => {
      const climb = Math.atan(slope)
      T.lean = pitch - climb
      T.roll = Math.max(-0.9, Math.min(0.9, -Math.atan((speed * speed * curvature) / G)))
      T.headPitch = billAt(T.lean, -climb)
      T.wingSpread = 1
      // the wings open before the legs tuck
      T.legsUp = pose.wingSpread > 0.9 ? 1 : 0
      T.tailSpread = 0.05
      T.glide = flap(pose, dt, mayGlide && Math.abs(slope) < 0.1)
    }
    /** braking with the hovering stroke, the body up and the tail fanned */
    const brake = (feetDown: boolean, body: number, tail: number) => {
      T.lean = pitch - body
      T.headPitch = billAt(T.lean, 0)
      T.wingSpread = 1
      T.wingStroke = 1
      T.legsUp = feetDown ? 0 : 1
      T.tailSpread = tail
      beat(pose, dt, hoverHz(S, ctx.wind().effective * WIND_SPEED))
    }

    switch (state) {
      case 'perch': {
        x = perch.position[0]; y = perch.position[1]; z = perch.position[2]
        const i = idling(dt)
        T.lean = i.lean; T.tailTilt = i.tilt; T.crestRaise = i.crest; T.headYaw = i.yaw
        quiet -= dt
        if (quiet <= 0) { quiet = between(rng, S.rattle.quiet); ctx.onCall?.() }
        if (timer <= 0) { stopIdles(); decide() }
        break
      }
      case 'peer':
        T.lean = 0.1
        T.headPitch = billAt(T.lean, peerBill)
        if (timer <= 0) begin('perchPlunge')
        break
      case 'perchPlunge': {
        T.headPitch = billAt(T.lean, peerBill)
        if (clock < leanFor) { T.lean = S.perchPlunge.leanTo; break }
        if (vy === 0) call(S.rattle.plunge)
        // off the branch and down, the wings half open and steering, swept back over the last of the drop
        vy = Math.min(vyMax, vy + G * dt)
        x += Math.cos(heading) * vh * dt
        z -= Math.sin(heading) * vh * dt
        y -= vy * dt
        const down = Math.atan2(vy, vh)
        T.lean = pitch + down
        T.headPitch = billAt(T.lean, down)
        T.glide = 1
        T.legsUp = 1
        T.wingSpread = held * clamp01((y / Math.max(vy, 1) - 0.03) / S.plunge.fold)
        quick = ['wingSpread']
        if (y <= 0) { y = 0; apply(pose, T, dt, quick); enter(); return }
        break
      }
      case 'flyout': {
        const there = along(dt)
        if (braking) brake(false, S.hover.body, S.hover.tail)
        else flying(true)
        if (clock < 0.5 && !braking) T.glide = 0
        if (there) { x = hx; y = hy; z = hz; heading = hoverHeading; begin('hover') }
        break
      }
      case 'hover':
      case 'shift': {
        if (state === 'shift') {
          // a shallow U to the next point, the heading held into the wind
          const u = clamp01(clock / shift.seconds), k = ease(u)
          x = shift.fx + (shift.tx - shift.fx) * k
          z = shift.fz + (shift.tz - shift.fz) * k
          y = hy - S.hover.shift.dip * Math.sin(Math.PI * u)
          T.lean = pitch - S.hover.body * 0.6
          T.wingStroke = 0.6
        } else {
          x = hx; y = hy; z = hz
          T.lean = pitch - S.hover.body
          T.wingStroke = 1
        }
        T.headPitch = billAt(T.lean, S.hover.bill)
        T.wingSpread = 1
        T.legsUp = 1
        T.tailSpread = S.hover.tail
        beat(pose, dt, hoverHz(S, ctx.wind().effective * WIND_SPEED))
        if (state === 'shift' && timer <= 0) { hx = shift.tx; hz = shift.tz; x = hx; y = hy; z = hz; begin('hover') }
        else if (state === 'hover' && timer <= 0) afterHover()
        break
      }
      case 'hoverPlunge': {
        // head down and straight in, the wings half open until the last moment
        vy = Math.min(vyMax, vy + G * dt)
        x += Math.cos(heading) * vh * dt
        z -= Math.sin(heading) * vh * dt
        y -= vy * dt
        const down = Math.atan2(vy, vh)
        T.lean = pitch + down
        T.headPitch = billAt(T.lean, down)
        T.glide = 1
        T.legsUp = 1
        T.wingSpread = held * clamp01((y / Math.max(vy, 1) - 0.03) / S.plunge.fold)
        quick = ['wingSpread']
        if (y <= 0) { y = 0; apply(pose, T, dt, quick); enter(); return }
        break
      }
      case 'under': {
        y = -S.under.depth
        if (caught) fish = 1
        if (timer <= 0) {
          // it comes up bill first, climbing, its wings coming clear of the water first; turned, while it was hidden,
          // to rise over deep water if it went in facing the shallows
          y = 0
          const reach = S.emerge.ahead
          const b = TURNS.map(t => heading + t).find(b => depthAt(x + Math.cos(b) * reach, z - Math.sin(b) * reach) >= S.fly.water)
          if (b !== undefined) heading = wrap(b)
          pose.lean.x = pitch - 0.35
          pose.lean.z = 0
          pose.headPitch = billAt(pose.lean.x, -0.35)
          pose.headYaw = 0
          pose.wingSpread = 0
          pose.wingStroke = 0
          pose.glide = 0
          pose.legsUp = 1
          pose.tailSpread = 0
          pose.tailTilt = 0
          pose.crestRaise = 0
          pose.fishTurn = 0
          pose.fish = fish
          ctx.onRipple?.(x, z, S.ring.takeoff)
          begin('emerge')
          if (caught) call(S.rattle.catch)
        }
        pose.fish = fish
        return
      }
      case 'emerge': {
        const u = clamp01(clock / S.emerge.seconds)
        const v = S.emerge.speed * u
        x += Math.cos(heading) * v * dt
        z -= Math.sin(heading) * v * dt
        y = S.emerge.rise * ease(u)
        T.lean = pitch - 0.35
        T.headPitch = billAt(T.lean, -0.35)
        T.wingSpread = 1
        T.legsUp = 1
        beat(pose, dt, S.emerge.hz)
        if (timer <= 0) home()
        break
      }
      case 'fly':
      case 'land': {
        const f = flight
        if (state === 'fly' || !arrived) {
          const there = along(dt)
          if (state === 'fly' && braking) { state = 'land'; clock = 0; arrived = false; landTail = between(rng, S.land.tail) }
          if (state === 'land') brake(true, S.land.body, landTail)
          else flying(true)
          if (state === 'fly' && f && f.s < 0.5 * f.cruise) T.glide = 0
          if (there) {
            state = 'land'
            arrived = true
            clock = 0
            perch = f!.to!
            ;[x, y, z] = perch.position
            fold = between(rng, S.land.fold)
            aboutFrom = heading
            aboutBy = wrap(perch.heading - heading)
            if (Math.abs(Math.abs(aboutBy) - Math.PI) < 1e-6) aboutBy = rng() < 0.5 ? Math.PI : -Math.PI
            call(S.rattle.land)
          }
          if (!arrived) break
        }
        // on the branch: the wings fold, then it turns about to face the water
        x = perch.position[0]; y = perch.position[1]; z = perch.position[2]
        const u = clamp01((clock - fold) / S.land.about)
        heading = wrap(aboutFrom + aboutBy * ease(u))
        if (clock < fold) T.tailSpread = landTail
        if (u >= 1) {
          heading = perch.heading
          flight = null
          settle()
          begin(fish > 0 ? 'handle' : 'perch')
        }
        break
      }
      case 'handle': {
        x = perch.position[0]; y = perch.position[1]; z = perch.position[2]
        const { beats, beat: b, turn, swallow } = handle
        if (clock < b) {
          // whacking it on the branch: the head swung side to side and down
          const w = 2 * Math.PI * beats * (clock / b)
          T.headYaw = S.handle.yaw * Math.sin(w)
          T.headPitch = -S.handle.dip * Math.sin(w) ** 2
        } else if (clock < b + turn) {
          const u = (clock - b) / turn
          T.fishTurn = 1
          T.headPitch = 0.2 * Math.sin(Math.PI * u)
        } else {
          const u = clamp01((clock - b - turn) / swallow)
          T.fishTurn = 1
          T.headPitch = handle.pitch * Math.sin(Math.PI * u)
          // down the throat, head first, with the bill up
          if (u >= 0.6) fish = 0
        }
        if (timer <= 0) { fish = 0; begin('perch') }
        break
      }
    }
    apply(pose, T, dt, quick)
    pose.fish = fish
  }

  return {
    name: 'kingfisher',
    get state() { return state },
    get x() { return x }, get y() { return y }, get z() { return z }, get heading() { return heading },
    get submerged() { return state === 'under' },
    update,
  }
}
