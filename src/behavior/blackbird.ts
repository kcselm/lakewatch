import * as THREE from 'three'
import type { BehaviorContext, BehaviorController } from './types'
import { approach, between, ease, wrap } from './types'
import type { PoseState, StemHold } from '../birds/model'
import type { Stem, StemField } from '../world/stems'
import type { SongCue } from '../audio/cues'
import { GRIPS, STRADDLE_ROLL, gripPosition, holdOn, straddlePosition, toBird, type GripKind } from './grips'
import { spreadPose, spreadLength, TIMING, type Display, type Grade, type SongShape } from './spread'

type Range = readonly [number, number]

/** A red-winged blackbird's version, as its behaviour cares: an adult male, a first-year male, or a female. */
export type Version = 'male' | 'firstYearMale' | 'female'

/** The blackbird's settings: how it sits on its stems, idles, moves, sings, and checks. */
export interface BlackbirdSettings {
  /** kg, each version's: a stem bends under it (research, section 2.8: 65 and 42 g; Searcy's first-year males 70 g) */
  mass: Record<Version, number>
  /**
   * a perch bout's length, seconds; which grip a perch takes, by share; where on its stem: a cattail stalk's height,
   * a tule's (where it carries a blackbird), and how far above a cattail's spike the feet take its bare axis
   */
  perch: {
    seconds: Range
    grips: Record<GripKind, number>
    stalkAt: Range; tuleAt: Range; topAbove: Range
  }
  /** what a bout is spent doing, by share; feeding only on a cattail top (on any other grip it is alert instead) */
  idle: { alert: number; preen: number; feed: number; stretch: number }
  /** alert: head turns of `yaw` radians over `seconds`, every `every` seconds */
  turn: { yaw: Range; seconds: Range; every: Range }
  /** preening: a stroke at the breast, the flank, the back or under the wing, `stroke` seconds each, nibbling at `nibble` Hz */
  preen: { stroke: Range; nibble: number }
  /**
   * feeding at a cattail head: leaning over it `lean` radians (the body staying within the top's 45-60 degrees: 0.08 takes
   * its 50 to 45), the bill `bill` radians below level (48 degrees), thrust in and gaped `thrusts` times of `seconds`
   */
  feed: { lean: number; bill: number; thrusts: Range; seconds: Range }
  /** stretching: both wings up (`spread`), or a wing and a leg down (`hold`), for `seconds` */
  stretch: { seconds: Range; spread: number; hold: number }
  /** a tail flick: `tilt` radians up and back over `seconds`, every `every` seconds, every `settled` seconds for `settle` seconds after landing */
  flick: { tilt: Range; seconds: Range; every: Range; settled: Range; settle: number }
  /** on a cool morning a bout spent fluffed, by `chance`, at `value` */
  fluff: { chance: number; value: Range }
  /** after a bout: climb the stem, step or flutter within 2 m, flutter 2-5 m, or stay, by share */
  next: { climb: number; near: number; far: number; stay: number }
  /** climbing up or down the same stem: `metres`, at `speed` m/s, foot over foot, a step every `step` metres */
  climb: { metres: Range; speed: number; step: number }
  /** stepping to a stem within `reach` metres, straddling the two for `straddle` seconds on the way */
  step: { reach: number; straddle: Range }
  /**
   * a flutter: `near` and `far` metres; flying at `speed` m/s, `over` metres over the leaves' tips (`leaves` above
   * the bed); a wingbeat of `hz` (never more than a sixth of a beat a frame); turning no faster than `turn` rad/s;
   * arriving at `arrive` m/s, the legs down for the last `legs` seconds; the body levelled by `lean` radians
   */
  flutter: { near: Range; far: Range; speed: Range; over: number; leaves: number; hz: number; turn: number; arrive: Range; legs: number; lean: number }
  /** no stem nearer the player than `player` metres; neighbours `spacing` metres apart */
  player: number
  spacing: Range
  /** the singer's post: within `post` metres of it between songs and bouts */
  post: number
  /**
   * songs: the singer's bouts of `bout` songs, one every `every` seconds, `gap` seconds between bouts (`early` in the
   * first `earlyMinutes`); the other adult male `songs` songs every `male` seconds; the first-year male one song every
   * `firstYear` seconds at grade 0 or 1; the grades' shares; another male within `rival` metres raises the grade one;
   * a song not started within `wait` seconds of the ask was dropped
   */
  song: {
    bout: Range; every: Range; gap: Range; early: Range; earlyMinutes: number
    male: Range; songs: Range; firstYear: Range
    grades: readonly [number, number, number, number]; rival: number; wait: number
  }
  /** a male within `near` metres of another points his bill up for `seconds`, without song, a share `chance` of each `every` seconds */
  tilt: { near: number; seconds: Range; every: Range; chance: number }
  /** checks: every `settled` seconds when settled; every `excited` seconds for `excitedFor` after a flutter or a landing, and through the singer's bouts */
  check: { settled: Range; excited: Range; excitedFor: Range }
  /** the epaulet at rest: its values and their shares, a male's own, drawn again on landing and after each bout */
  epaulet: { values: readonly number[]; shares: readonly number[] }
  /**
   * riding the stem: the body takes up `counter` of the stem's swing about the feet, so the head moves a third as far
   * or less; the swing measured from where the stem would settle (StemField.restAt, which follows the bird's weight
   * and the wind's steady push), smoothed over `anchor` seconds; the head `head` metres from the feet (a male's, the
   * model's own: 0.105 m of head travel a radian of lean or roll)
   */
  ride: { counter: number; anchor: number; head: number }
}

/**
 * docs/research/2026-10-13-red-winged-blackbird.md, section 11, and docs/research/2026-10-13-blackbird-display-and-
 * reeds.md, section 10, through the spec (docs/superpowers/specs/2026-10-13-red-winged-blackbird-design.md, "The
 * blackbird behaviour"). Each number says where it comes from: sourced, computed, compressed for play, or an estimate
 * (most of them: no autumn time budget for the species exists).
 */
export const BLACKBIRD: BlackbirdSettings = {
  // 65 and 42 g (research 2.8); Searcy's captive first-year males 70 g (1979, through the display research 5.6)
  mass: { male: 0.065, firstYearMale: 0.065, female: 0.042 },
  perch: {
    // 20-120 s (estimate); the perch choice the spec's (estimate); on a stalk 1.2-1.6 m up, a tule 0.6-1.2 (where it
    // carries a blackbird, display research 5.6), the bare axis 8-20 mm above the spike (by eye on the photos)
    seconds: [20, 120],
    grips: { top: 0.5, stalk: 0.25, tule: 0.15, straddle: 0.1 },
    stalkAt: [1.2, 1.6], tuleAt: [0.6, 1.2], topAbove: [0.008, 0.02],
  },
  // research 11: alert 0.5, preening 0.25, feeding 0.2, stretching 0.05 (activities sourced, shares estimates)
  idle: { alert: 0.5, preen: 0.25, feed: 0.2, stretch: 0.05 },
  // 30-90 degrees over 0.2-0.5 s, every 2-6 s (estimate)
  turn: { yaw: [0.52, 1.57], seconds: [0.2, 0.5], every: [2, 6] },
  // strokes of 1-3 s, nibbling at 4 Hz (estimates: bouts of 10-60 s are the perch bout's own)
  preen: { stroke: [1, 3], nibble: 4 },
  // leaning far forward over the head, the bill 48 degrees below level (photo-measured, research 6); gaping 2-6 times,
  // 0.5-1 s each (estimate; Orians 1961's "gaping")
  feed: { lean: 0.08, bill: 0.84, thrusts: [2, 6], seconds: [0.5, 1] },
  stretch: { seconds: [1, 2], spread: 0.55, hold: 0.6 },
  // 15-30 degrees up in 0.2-0.3 s, every 10-40 s, more often just after landing (estimate)
  flick: { tilt: [0.26, 0.52], seconds: [0.2, 0.3], every: [10, 40], settled: [2, 6], settle: 10 },
  // fluffed 0.2-0.4 in long bouts on a cool morning (photo; estimate)
  fluff: { chance: 0.35, value: [0.2, 0.4] },
  // the spec's: climb 0.40, step or flutter within 2 m 0.35, flutter 2-5 m 0.20, stay 0.05 (estimate)
  next: { climb: 0.4, near: 0.35, far: 0.2, stay: 0.05 },
  // 0.1-0.5 m, foot over foot, 2-3 cm a step, about 3 steps a second (estimate, display research 6.4)
  climb: { metres: [0.1, 0.5], speed: 0.075, step: 0.025 },
  // to a stem within 0.12 m, straddling the two 0.2-0.5 s on the way (estimate, display research 6.4)
  step: { reach: 0.12, straddle: [0.2, 0.5] },
  // 0.5-2 and 2-5 m (the spec's flutters), 4-8 m/s low over the stems (research 11), a 10 Hz wingbeat (computed,
  // research 7.6), braking to 0.25-0.5 m/s at the stem (display research 6.5, estimate); the turn rate, the legs'
  // lowering and the height over the leaves ours
  flutter: { near: [0.5, 2], far: [2, 5], speed: [4, 8], over: 0.2, leaves: 1.95, hz: 10, turn: 8, arrive: [0.25, 0.5], legs: 0.2, lean: 0.55 },
  // none nearer the player than 5 m (research 7.7, an estimate); neighbours 1-6 m apart (research 11, estimate)
  player: 5,
  spacing: [1, 6],
  // the singer stays on or near his post between songs (the spec)
  post: 3,
  song: {
    // the spec's: bouts of 4-10 songs, one every 8-20 s, 3-8 min between bouts, more singing in the first part of the
    // visit (compressed from the research's 3-12 songs at 6-25 s, 2-15 min apart, more after sunrise: estimates)
    bout: [4, 10], every: [8, 20], gap: [180, 480], early: [60, 180], earlyMinutes: 15,
    // the other adult male one or two songs about once in 20-30 min; the first-year one about once in 30-60 min
    male: [1200, 1800], songs: [1, 2], firstYear: [1800, 3600],
    // 35/35/20/10 for play, against the research's late-September 60/30/8/2 (compressed); +1 for a male within 5 m
    grades: [0.35, 0.35, 0.2, 0.1], rival: 5, wait: 1.5,
  },
  // bill-tilting to a male within 2 m, 2-10 s, no song (Nero 1956a; times estimate)
  tilt: { near: 2, seconds: [2, 10], every: [15, 45], chance: 0.5 },
  // a check every 10-40 s settled, every 1-5 s for 10-30 s after a flutter or landing and around the singer's bouts
  // (estimates inside the recordings' 1-8 s)
  check: { settled: [10, 40], excited: [1, 5], excitedFor: [10, 30] },
  // the spec's: the buff bar only 40%, a narrow red band 25%, the whole patch 30%, nothing 5%
  epaulet: { values: [0.15, 0.35, 0.6, 0], shares: [0.4, 0.25, 0.3, 0.05] },
  // the head moves no more than a third as far as the feet (display research 6.5, estimate); the head about 100 mm over
  // the feet (research 6: the eye 93-103 mm over the perch)
  ride: { counter: 0.9, anchor: 0.5, head: 0.105 },
}

/**
 * How fast each pose value may change, a second: no state's easing moves it further in a frame than this times the
 * frame's length. Ours, set by the fastest motion each must make: a head turn of 90 degrees in 0.2 s; a tail flick of
 * 30 degrees in 0.1 s; the wings open in about 0.1 s for a flutter; the spread's build, about 0.4 s from rest to full.
 */
export const BLACKBIRD_RATES = {
  lean: 14, roll: 14, headPitch: 6, headYaw: 8, neck: 5, wingSpread: 12, legsUp: 8, tailSpread: 5, tailTilt: 7,
  epaulet: 5, epauletRaise: 5, fluff: 5, wingHold: 5, gape: 12,
} as const

type State = 'perch' | 'climb' | 'step' | 'flutter' | 'sing'
type Activity = 'alert' | 'preen' | 'feed' | 'stretch'

/** what each eased pose value is heading for this frame */
interface Target {
  lean: number; roll: number; headPitch: number; headYaw: number; neck: number; wingSpread: number; legsUp: number
  tailSpread: number; tailTilt: number; epaulet: number; epauletRaise: number; fluff: number; wingHold: number; gape: number
}

/** A place on the bed a blackbird holds: one stem (a grip) or two (a straddle), and how high up each. */
export interface Hold {
  grip: GripKind
  stems: [Stem] | [Stem, Stem]
  /** metres up each stem, the feet's middle on one stem; each foot's on a straddle */
  at: [number] | [number, number]
}

/**
 * What every blackbird of the bed shares: each bird's place, so they keep apart, never hold one stem, and know where
 * the singer is. The spawner makes one for each cast entry.
 */
export interface BlackbirdGroup {
  /** each bird: where it is, its version, the stems it holds (or flies to), whether it is the singer, singing a song, or in a bout of them */
  birds: { x: number; z: number; version: Version; singing: boolean; bout: boolean; stems: Set<number>; singer: boolean }[]
}
export const blackbirdGroup = (): BlackbirdGroup => ({ birds: [] })

/** the spawner's extras for a blackbird: the stems, the group, its version and size, the singer's post, and the player */
export interface BlackbirdContext extends BehaviorContext {
  stems?: StemField
  blackbirds?: BlackbirdGroup
  variant?: string
  /** the bird's size against the traced male's (a female's 0.85) */
  size?: number
  /** where the singer sings: the stalk nearest this point is his post */
  post?: readonly [number, number, number]
  /** where the player stands, world space */
  vantage?: readonly [number, number, number]
}

export interface BlackbirdController extends BehaviorController {
  readonly version: Version
  readonly singer: boolean
  /** what it holds now; null in the air */
  readonly hold: Hold | null
  /** the song it is singing, its grade, whether another male near raised it, and whether its spread is running */
  readonly song: { grade: Display; rival: boolean; spreading: boolean; number: number } | null
  readonly activity: Activity | null
  /** how many perch bouts it has begun */
  readonly bouts: number
}

const versionOf = (v: string | undefined): Version => (v === 'female' || v === 'firstYearMale' ? v : 'male')
const pick = <T extends string>(rng: () => number, shares: Record<T, number>): T => {
  const entries = Object.entries(shares) as [T, number][]
  let r = rng() * entries.reduce((a, [, w]) => a + w, 0)
  for (const [k, w] of entries) { if ((r -= w) <= 0) return k }
  return entries.at(-1)![0]
}
const count = (rng: () => number, [lo, hi]: Range) => lo + Math.floor(rng() * (hi - lo + 1))

/**
 * The `blackbird` style, in the reed bed: a red-winged blackbird clings to a cattail or tule stem, riding it as it sways
 * (its feet on the stem every frame, its body taking up most of the sway so its head stays steadier); it looks about,
 * preens, feeds at a cattail head, stretches, flicks its tail, fluffs; after a bout it climbs its stem, steps to one in
 * reach, or flutters to another on the generic spread wing, low over the leaves, landing with the stem's dip. It checks
 * now and then, more after a move. The singer, the first adult male, sings in bouts from his post, each song asked for
 * and its spread run against the sound once it plays; the other males sing rarely; the females never.
 */
export function createBlackbird(ctx0: BehaviorContext, startX: number, startZ: number, S: BlackbirdSettings = BLACKBIRD): BlackbirdController {
  const ctx = ctx0 as BlackbirdContext
  const field = ctx.stems
  if (!field) throw new Error('the blackbird needs the reed bed\'s stems')
  const rng = ctx.rng
  const version = versionOf(ctx.variant)
  const size = ctx.size ?? (version === 'female' ? 0.85 : 1)
  const mass = S.mass[version]
  const group = ctx.blackbirds ?? blackbirdGroup()
  const vantage = ctx.vantage ?? [0, 1.6, 0]
  const me = { x: startX, z: startZ, version, singing: false, bout: false, stems: new Set<number>(), singer: false }
  // the singer is the first adult male to join the group
  me.singer = version === 'male' && !group.birds.some(b => b.singer)
  group.birds.push(me)
  const others = () => group.birds.filter(b => b !== me)
  const post = me.singer && ctx.post ? field.near(ctx.post[0], ctx.post[2], 3).find(s => s.kind === 'cattail') ?? null : null

  // where the bird is, and what it holds
  const pos = new THREE.Vector3(startX, 0, startZ)
  let heading = rng() * Math.PI * 2
  let state: State = 'perch'
  let hold: Hold | null = null
  let handles: number[] = []
  let clock = 0, timer = 0
  let activity: Activity | null = null
  // eased pose values carried by the controller: the lean's ride (counter-rotation) on top of the grip's
  const anchor = new THREE.Vector3()
  let rideX = 0, rideZ = 0
  let restEpaulet = 0
  let fluffing = 0
  // idles
  let yawAim = 0, nextTurn = 0, turnFor = 0.3
  let flickAt = 0, flickT = -1, flickFor = 0.25, flickAmp = 0.3, settleUntil = 0
  let preenStrokes: { yaw: number; pitch: number; neck: number; hold: number; until: number }[] = []
  let feedThrusts: { from: number; to: number }[] = []
  let stretchKind: 'up' | 'down' = 'up', stretchUntil = 0
  // moving
  let climbTo = 0, climbFrom = 0
  let stepTo: Hold | null = null, stepPhase = 0, stepFor = 0.3
  let flight: { from: THREE.Vector3; to: Hold; s: number; speed: number; arrive: number; top: number; landHeading: number } | null = null
  const flightEnd = new THREE.Vector3()
  // singing
  let nextSongAt = 0, boutLeft = 0, nextBoutAt = 0, songs = 0
  let song: { grade: Display; rival: boolean; asked: number; start: number | null; shape: SongShape; hold: number; number: number } | null = null
  let tiltFrom = -Infinity, tiltFor = 0, nextTiltAt = 0
  // checks
  let nextCheckAt = 0, excitedUntil = 0, gapeUntil = 0, gapeFrom = 0
  // the pose's own feet, rewritten each frame
  const feet = { right: { at: new THREE.Vector3(), axis: new THREE.Vector3(), radius: 0 }, left: { at: new THREE.Vector3(), axis: new THREE.Vector3(), radius: 0 } }
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), axisA = new THREE.Vector3(), axisB = new THREE.Vector3()

  const drawEpaulet = () => {
    if (version === 'female') return 0
    let r = rng()
    for (let i = 0; i < S.epaulet.values.length; i++) if ((r -= S.epaulet.shares[i]!) <= 0) return S.epaulet.values[i]!
    return S.epaulet.values[0]!
  }

  // --- the bed: which stems a bird may take -------------------------------------------------------------------------
  const fromPlayer = (s: Stem) => Math.hypot(s.x - vantage[0], s.z - vantage[2])
  const taken = (s: Stem) => others().some(b => b.stems.has(s.index))
  /** a stem a bird may perch on: far enough from the player, no one else's, and not on top of another bird */
  const free = (s: Stem) => fromPlayer(s) >= S.player && !taken(s) && others().every(b => Math.hypot(b.x - s.x, b.z - s.z) >= S.spacing[0])
  const grouped = (s: Stem) => others().length === 0 || others().some(b => Math.hypot(b.x - s.x, b.z - s.z) <= S.spacing[1])

  /** where on a stem a grip takes it, metres up; null if the stem can't be held that way */
  function heightFor(grip: GripKind, s: Stem): number | null {
    if (grip === 'top') {
      if (!s.spike) return null
      return Math.min(s.spike.top + between(rng, S.perch.topAbove), s.spike.axisTop - 0.005)
    }
    if (grip === 'stalk') {
      if (!s.spike) return null
      const hi = Math.min(S.perch.stalkAt[1], s.spike.bottom - 0.08)
      return hi > S.perch.stalkAt[0] ? between(rng, [S.perch.stalkAt[0], hi]) : null
    }
    if (s.kind !== 'tule') return null
    const hi = Math.min(S.perch.tuleAt[1], s.height - 0.15)
    return hi > S.perch.tuleAt[0] ? between(rng, [S.perch.tuleAt[0], hi]) : null
  }

  /** a hold of `grip` on stems `lo`-`hi` metres from (x, z) (and near the post, for the singer), or null */
  function findHold(grip: GripKind, x: number, z: number, lo: number, hi: number, near?: Stem | null): Hold | null {
    const pool = field!.near(x, z, hi).filter(s => {
      const d = Math.hypot(s.x - x, s.z - z)
      return d >= lo && free(s) && (!near || Math.hypot(s.x - near.x, s.z - near.z) <= S.post)
    })
    // grouped stems first, in a shuffled order
    const order = pool.map(s => ({ s, k: (grouped(s) ? 0 : 1) + rng() })).sort((a, b) => a.k - b.k).map(o => o.s)
    for (const s of order) {
      if (grip === 'straddle') {
        if (s.kind !== 'tule') continue
        const mate = field!.near(s.x, s.z, 0.115).find(t => t !== s && t.kind === 'tule' && Math.hypot(t.x - s.x, t.z - s.z) >= 0.04 && free(t))
        if (!mate) continue
        const h = heightFor('tule', s), g = heightFor('tule', mate)
        if (h === null || g === null) continue
        // the feet near one height, up to 40 mm apart (display research 6.3)
        return { grip, stems: [s, mate], at: [h, Math.max(S.perch.tuleAt[0], Math.min(g, h + 0.04, mate.height - 0.15), h - 0.04)] }
      }
      const h = heightFor(grip, s)
      if (h !== null) return { grip, stems: [s], at: [h] }
    }
    return null
  }

  /** a hold of any grip, by the perch choice's shares, falling back through the others */
  function anyHold(x: number, z: number, lo: number, hi: number, near?: Stem | null): Hold | null {
    const first = pick(rng, S.perch.grips)
    for (const g of [first, ...(['top', 'stalk', 'tule', 'straddle'] as const).filter(k => k !== first)]) {
      const h = findHold(g, x, z, lo, hi, near)
      if (h) return h
    }
    return null
  }

  // --- riding a hold --------------------------------------------------------------------------------------------------
  /** the world point of the hold's middle (the feet's) now, and the stem axis there */
  function midOf(h: Hold, out: THREE.Vector3): THREE.Vector3 {
    if (h.stems.length === 2) {
      field!.pointAt(h.stems[0], h.at[0], tmpA)
      field!.pointAt(h.stems[1], h.at[1]!, tmpB)
      return out.copy(tmpA).add(tmpB).multiplyScalar(0.5)
    }
    return field!.pointAt(h.stems[0], h.at[0], out)
  }
  /** where the feet's middle would be with the stems' swing settled */
  function restOf(h: Hold, out: THREE.Vector3): THREE.Vector3 {
    if (h.stems.length === 2) {
      field!.restAt(h.stems[0], h.at[0], tmpA)
      field!.restAt(h.stems[1], h.at[1]!, tmpB)
      return out.copy(tmpA).add(tmpB).multiplyScalar(0.5)
    }
    return field!.restAt(h.stems[0], h.at[0], out)
  }
  /** where the bird stands for a hold, facing `heading` */
  function placeFor(h: Hold, hd: number, out: THREE.Vector3): THREE.Vector3 {
    if (h.stems.length === 2) {
      field!.pointAt(h.stems[0], h.at[0], tmpA)
      field!.pointAt(h.stems[1], h.at[1]!, tmpB)
      return straddlePosition(tmpA, tmpB, size, out)
    }
    return gripPosition(field!.pointAt(h.stems[0], h.at[0], tmpA), hd, GRIPS[h.grip].ahead * size, out)
  }
  /** each foot's hold on its stem, in the bird's frame, at the bird's place */
  function feetOn(h: Hold): { right: StemHold; left: StemHold } {
    if (h.stems.length === 2) {
      const [a, b] = h.stems
      // the right foot on the stem to the bird's right
      const ra = toBird(field!.pointAt(a, h.at[0], tmpA), pos, heading, axisA).z >= toBird(field!.pointAt(b, h.at[1]!, tmpB), pos, heading, axisB).z
      const [r, rh, l, lh] = ra ? [a, h.at[0], b, h.at[1]!] : [b, h.at[1]!, a, h.at[0]]
      holdOn(field!.pointAt(r, rh, tmpA), field!.axisAt(r, rh, axisA), r.radiusAt(rh), pos, heading, feet.right)
      holdOn(field!.pointAt(l, lh, tmpB), field!.axisAt(l, lh, axisB), l.radiusAt(lh), pos, heading, feet.left)
      return feet
    }
    const s = h.stems[0]
    const apart = GRIPS[h.grip].apart * size
    const radius = h.grip === 'top' ? s.spike!.axisRadius : s.radiusAt(h.at[0])
    // foot over foot when climbing: the feet take turns ahead
    const stagger = state === 'climb' ? Math.sin((Math.PI * (h.at[0] - climbFrom)) / S.climb.step) * S.climb.step * 0.5 : 0
    const up = h.at[0] + apart / 2 + stagger, down = h.at[0] - apart / 2 - stagger
    holdOn(field!.pointAt(s, up, tmpA), field!.axisAt(s, up, axisA), radius, pos, heading, feet.right)
    holdOn(field!.pointAt(s, down, tmpB), field!.axisAt(s, down, axisB), radius, pos, heading, feet.left)
    return feet
  }

  function take(h: Hold, vx = 0, vz = 0): void {
    hold = h
    me.stems.clear()
    for (const s of h.stems) me.stems.add(s.index)
    handles = h.stems.map((s, i) => field!.hold(s, mass / h.stems.length, h.at[i]!, vx, vz))
    restOf(h, anchor)
    rideX = 0; rideZ = 0
  }
  function letGo(vx = 0, vz = 0): void {
    for (const k of handles) field!.release(k, vx, vz)
    handles = []
    hold = null
  }

  // --- the bird's day ---------------------------------------------------------------------------------------------------
  let bouts = 0
  function beginBout(): void {
    bouts++
    state = 'perch'
    timer = between(rng, S.perch.seconds)
    let a = pick(rng, S.idle)
    if (a === 'feed' && hold?.grip !== 'top') a = 'alert'
    activity = a
    fluffing = rng() < S.fluff.chance ? between(rng, S.fluff.value) : 0
    preenStrokes = []
    feedThrusts = []
    if (a === 'stretch') { stretchKind = rng() < 0.5 ? 'up' : 'down'; stretchUntil = clock + between(rng, S.stretch.seconds) }
  }

  function settle(): void {
    settleUntil = clock + S.flick.settle
    flickAt = clock + between(rng, S.flick.settled)
    excitedUntil = clock + between(rng, S.check.excitedFor)
    nextCheckAt = clock + between(rng, [0.2, S.check.excited[1]])
    restEpaulet = drawEpaulet()
  }

  /** after a bout: climb, step or flutter near, flutter far, or stay */
  function decide(): void {
    const near = me.singer ? post : null
    const choice = pick(rng, S.next)
    if (choice === 'climb' && hold && hold.stems.length === 1 && hold.grip !== 'top') {
      const s = hold.stems[0]
      const [lo, hi] = s.kind === 'tule' ? [S.perch.tuleAt[0], Math.min(S.perch.tuleAt[1], s.height - 0.15)] : [S.perch.stalkAt[0], Math.min(S.perch.stalkAt[1], s.spike!.bottom - 0.08)]
      const d = between(rng, S.climb.metres) * (rng() < 0.5 ? -1 : 1)
      const to = THREE.MathUtils.clamp(hold.at[0] + d, lo, hi)
      if (Math.abs(to - hold.at[0]) > 0.05) { state = 'climb'; climbFrom = hold.at[0]; climbTo = to; return }
    }
    if (choice === 'near' || choice === 'climb') {
      // a stem in reach: a step; else a short flutter
      if (hold && hold.stems.length === 1) {
        const s = hold.stems[0]
        const g = s.kind === 'tule' ? 'tule' : 'stalk'
        const reach = field!.near(s.x, s.z, S.step.reach).filter(t => t !== s && free(t) && (!near || Math.hypot(t.x - near.x, t.z - near.z) <= S.post))
        for (const t of reach) {
          const h = heightFor(t.kind === 'tule' ? 'tule' : g, t)
          if (h !== null) { stepTo = { grip: t.kind === 'tule' ? 'tule' : 'stalk', stems: [t], at: [h] }; state = 'step'; stepPhase = 0; stepFor = between(rng, S.step.straddle); timer = stepFor; return }
        }
      }
      const h = anyHold(pos.x, pos.z, S.flutter.near[0], S.flutter.near[1], near)
      if (h) { flyTo(h); return }
    }
    if (choice === 'far') {
      const h = anyHold(pos.x, pos.z, S.flutter.far[0], S.flutter.far[1], near)
      if (h) { flyTo(h); return }
    }
    beginBout()
  }

  /**
   * Off its stems and away to another hold, low over the leaves: up from where it is to `over` above the leaves' tips
   * (the bed's ground under either end), and down onto the hold, landing facing the way it went, give or take.
   */
  function flyTo(to: Hold): void {
    const from = pos.clone()
    const end = placeFor(to, heading, flightEnd)
    const ground = Math.max(to.stems[0].base, hold?.stems[0].base ?? to.stems[0].base)
    const travel = Math.atan2(-(end.z - from.z), end.x - from.x)
    // springing off: the stem kicked back the way it leaves
    letGo(Math.cos(travel), -Math.sin(travel))
    me.stems.clear()
    for (const s of to.stems) me.stems.add(s.index)
    flight = {
      from, to, s: 0, speed: between(rng, S.flutter.speed), arrive: between(rng, S.flutter.arrive),
      top: Math.max(from.y, end.y, ground + S.flutter.leaves + S.flutter.over), landHeading: wrap(travel + (rng() - 0.5) * 1.2),
    }
    state = 'flutter'
    activity = null
    timer = 0
  }

  // --- songs ------------------------------------------------------------------------------------------------------------
  const songShape = (cue: SongCue): SongShape => ({ trill: cue.trill - cue.start, end: cue.end - cue.start })
  /** a song's grade, by the settings' shares, one higher for another male near (a first-year's no higher than 1) */
  function gradeOf(): { grade: Grade; rival: boolean } {
    let r = rng(), g = 0
    for (let i = 0; i < 4; i++) { if ((r -= S.song.grades[i]!) <= 0) { g = i; break } }
    const rival = others().some(b => b.version !== 'female' && Math.hypot(b.x - pos.x, b.z - pos.z) <= S.song.rival)
    if (rival) g = Math.min(3, g + 1)
    if (version === 'firstYearMale') g = Math.min(g, 1)
    return { grade: g as Grade, rival }
  }
  function sing(): void {
    if (!ctx.onCall) return
    const { grade, rival } = gradeOf()
    const s = { grade: grade as Display, rival, asked: clock, start: null as number | null, shape: { trill: 0.3, end: 0.9 }, hold: 0, number: ++songs }
    song = s
    me.singing = true
    state = 'sing'
    ctx.onCall({
      kind: 'song',
      onStart: (lead, cue) => {
        if (song !== s) return
        s.start = clock + lead
        s.shape = songShape(cue)
        s.hold = typeof grade === 'number' && grade >= 2 && rng() < 1 / TIMING.afterHold.every ? between(rng, TIMING.afterHold.seconds) : 0
      },
    })
  }
  function check(): void {
    ctx.onCall?.({ kind: 'check', onStart: lead => { gapeFrom = clock + lead; gapeUntil = gapeFrom + 0.2 } })
  }
  function scheduleSongs(): void {
    if (version === 'female') { nextBoutAt = Infinity; return }
    if (me.singer) nextBoutAt = between(rng, [20, 60])
    else nextBoutAt = between(rng, version === 'male' ? S.song.male : S.song.firstYear) * rng()
  }
  function nextBout(): void {
    if (me.singer) {
      const early = clock < S.song.earlyMinutes * 60
      nextBoutAt = clock + between(rng, early ? S.song.early : S.song.gap)
    } else nextBoutAt = clock + between(rng, version === 'male' ? S.song.male : S.song.firstYear)
  }

  // --- start: on a stem near its starting point, the singer on his post ------------------------------------------------
  {
    let h: Hold | null = null
    if (post && free(post)) h = { grip: 'top', stems: [post], at: [heightFor('top', post)!] }
    for (let r = 2; !h && r <= 12; r += 2) h = anyHold(startX, startZ, 0, r)
    if (!h) throw new Error('the blackbird found no stem to start on')
    heading = me.singer && ctx.post ? Math.atan2(vantage[2] - ctx.post[2], -(vantage[0] - ctx.post[0])) + Math.PI / 2 * (rng() < 0.5 ? 1 : -1) + (rng() - 0.5) * 0.6 : rng() * Math.PI * 2
    take(h)
    placeFor(h, heading, pos)
    me.x = pos.x; me.z = pos.z
    beginBout()
    timer *= rng()
    restEpaulet = drawEpaulet()
    nextCheckAt = between(rng, S.check.settled) * rng()
    flickAt = between(rng, S.flick.every) * rng()
    scheduleSongs()
    nextTiltAt = between(rng, S.tilt.every)
  }

  // --- each frame ---------------------------------------------------------------------------------------------------------
  function apply(pose: PoseState, T: Target, dt: number, quick: readonly (keyof Target)[] = []): void {
    const R = BLACKBIRD_RATES
    const to = (cur: number, target: number, rate: number, k: keyof Target) => {
      const eased = quick.includes(k) ? target : approach(cur, target, 14, dt)
      return cur + Math.max(-rate * dt, Math.min(rate * dt, eased - cur))
    }
    pose.lean.x = to(pose.lean.x, T.lean, R.lean, 'lean')
    pose.lean.z = to(pose.lean.z, T.roll, R.roll, 'roll')
    pose.headPitch = to(pose.headPitch, T.headPitch, R.headPitch, 'headPitch')
    pose.headYaw = to(pose.headYaw, T.headYaw, R.headYaw, 'headYaw')
    pose.neckExtend = to(pose.neckExtend, T.neck, R.neck, 'neck')
    pose.wingSpread = to(pose.wingSpread, T.wingSpread, R.wingSpread, 'wingSpread')
    pose.legsUp = to(pose.legsUp, T.legsUp, R.legsUp, 'legsUp')
    pose.tailSpread = to(pose.tailSpread, T.tailSpread, R.tailSpread, 'tailSpread')
    pose.tailTilt = to(pose.tailTilt, T.tailTilt, R.tailTilt, 'tailTilt')
    pose.epaulet = to(pose.epaulet, T.epaulet, R.epaulet, 'epaulet')
    pose.epauletRaise = to(pose.epauletRaise, T.epauletRaise, R.epauletRaise, 'epauletRaise')
    pose.fluff = to(pose.fluff, T.fluff, R.fluff, 'fluff')
    pose.wingHold = to(pose.wingHold, T.wingHold, R.wingHold, 'wingHold')
    pose.gape = to(pose.gape, T.gape, R.gape, 'gape')
  }

  /** the idles of a perch bout, this frame: the head's turns, preening, feeding, stretching, the tail's flicks */
  function idling(T: Target): void {
    if (activity === 'alert') {
      if (clock >= nextTurn) {
        yawAim = (rng() < 0.3 ? 0 : between(rng, S.turn.yaw) * (rng() < 0.5 ? -1 : 1))
        turnFor = between(rng, S.turn.seconds)
        nextTurn = clock + between(rng, S.turn.every)
      }
      T.headYaw = yawAim
    } else if (activity === 'preen') {
      if (preenStrokes.length === 0 || clock >= preenStrokes[0]!.until) {
        preenStrokes.shift()
        if (preenStrokes.length === 0) {
          // the breast, a flank, the back over the shoulder, under the wing: as far as the neck reaches
          const side = rng() < 0.5 ? 1 : -1
          const where = [
            { yaw: 0, pitch: -1.0, neck: 0.25, hold: 0 },
            { yaw: 1.2 * side, pitch: -0.55, neck: 0.35, hold: 0 },
            { yaw: 1.55 * side, pitch: -0.2, neck: 0.4, hold: 0 },
            { yaw: 0.9 * side, pitch: -0.9, neck: 0.3, hold: 0.3 },
          ][Math.floor(rng() * 4)]!
          preenStrokes.push({ ...where, until: clock + between(rng, S.preen.stroke) })
        }
      }
      const p = preenStrokes[0]
      if (p) {
        T.headYaw = p.yaw
        T.headPitch = p.pitch + 0.08 * Math.sin(clock * Math.PI * 2 * S.preen.nibble)
        T.neck = p.neck
        T.wingHold = p.hold
      }
    } else if (activity === 'feed') {
      if (feedThrusts.length === 0) {
        let t = clock + 0.6
        for (let i = 0, n = count(rng, S.feed.thrusts); i < n; i++) {
          const d = between(rng, S.feed.seconds)
          feedThrusts.push({ from: t, to: t + d })
          t += d + 0.5 + rng()
        }
      }
      T.lean += S.feed.lean
      // the bill toward its peer below the level, from where it rests on this grip (billRest 19 degrees down at lean 0)
      T.headPitch = BILL_REST + T.lean - S.feed.bill
      const th = feedThrusts.find(f => clock >= f.from && clock < f.to)
      if (th) { const u = (clock - th.from) / (th.to - th.from); T.neck = 0.5 + 0.35 * Math.sin(Math.PI * u); T.gape = 0.7 * Math.sin(Math.PI * u) }
      if (feedThrusts.length && clock > feedThrusts.at(-1)!.to + 1) feedThrusts = []
    } else if (activity === 'stretch') {
      if (clock < stretchUntil) {
        if (stretchKind === 'up') { T.wingSpread = S.stretch.spread; T.tailSpread = 0.4 }
        else { T.wingHold = S.stretch.hold; T.tailSpread = 0.3 }
      } else activity = 'alert'
    }
    // the tail's flick, more often for a while after landing
    if (flickT < 0 && clock >= flickAt) { flickT = 0; flickFor = between(rng, S.flick.seconds); flickAmp = between(rng, S.flick.tilt) }
    if (flickT >= 0) {
      T.tailTilt += flickAmp * Math.sin((Math.PI * flickT) / flickFor)
      if (flickT >= flickFor) { flickT = -1; flickAt = clock + between(rng, clock < settleUntil ? S.flick.settled : S.flick.every) }
    }
  }

  function update(dt: number, pose: PoseState): void {
    clock += dt
    if (flickT >= 0) flickT += dt
    const grip = hold ? GRIPS[hold.grip] : null
    const T: Target = {
      lean: grip?.lean ?? 0, roll: 0, headPitch: 0, headYaw: 0, neck: 0.5, wingSpread: 0, legsUp: 0, tailSpread: 0, tailTilt: 0,
      epaulet: restEpaulet, epauletRaise: 0, fluff: fluffing, wingHold: 0, gape: 0,
    }
    let quick: (keyof Target)[] = []
    me.singing = state === 'sing'
    me.bout = boutLeft > 0

    switch (state) {
      case 'perch': {
        timer -= dt
        idling(T)
        // songs: the singer's bouts, the others' rare ones
        if (version !== 'female' && clock >= nextBoutAt && (!me.singer || hold?.stems[0] === post || !post)) {
          if (boutLeft <= 0) boutLeft = me.singer ? count(rng, S.song.bout) : count(rng, S.song.songs)
          if (clock >= nextSongAt) { sing(); break }
        } else if (me.singer && post && clock >= nextBoutAt - 20 && hold?.stems[0] !== post && free(post)) {
          // back to his post for the next bout
          const h = heightFor('top', post)
          if (h !== null) { flyTo({ grip: 'top', stems: [post], at: [h] }); break }
        }
        // a male near another points his bill up now and then, without song
        if (version !== 'female' && clock >= nextTiltAt) {
          nextTiltAt = clock + between(rng, S.tilt.every)
          const near = others().some(b => b.version !== 'female' && Math.hypot(b.x - pos.x, b.z - pos.z) <= S.tilt.near)
          if (near && rng() < S.tilt.chance && clock - tiltFrom > tiltFor + 1) { tiltFrom = clock; tiltFor = between(rng, S.tilt.seconds) }
        }
        // the bill-tilt: built over the spread's onset, held, released
        const tilting = clock - tiltFrom
        if (tilting < tiltFor + TIMING.onset + TIMING.release) {
          const v = spreadPose('tilt', tilting - TIMING.onset, { trill: 0.05, end: tiltFor }, { epaulet: restEpaulet, tailTilt: 0, lean: T.lean })
          Object.assign(T, { epaulet: v.epaulet, fluff: v.fluff, neck: v.neckExtend, headPitch: v.headPitch, lean: v.lean, headYaw: 0 })
        }
        if (timer <= 0 && boutLeft <= 0 && tilting > tiltFor + TIMING.onset + TIMING.release) { activity = null; decide() }
        break
      }
      case 'sing': {
        const s = song!
        if (s.start === null) {
          // waiting for the sound: dropped if it never comes
          if (clock - s.asked > S.song.wait) endSong(false)
          break
        }
        const t = clock - s.start
        const v = spreadPose(s.grade, t, s.shape, { epaulet: restEpaulet, tailTilt: 0, lean: T.lean }, s.hold)
        Object.assign(T, {
          epaulet: v.epaulet, epauletRaise: v.epauletRaise, fluff: Math.max(fluffing, v.fluff), wingHold: v.wingHold, tailSpread: v.tailSpread,
          tailTilt: v.tailTilt, lean: v.lean, neck: v.neckExtend, headPitch: v.headPitch, gape: v.gape,
        })
        // the spread's own curves are smooth and slow enough; following them at once keeps it in time with the sound
        quick = ['epaulet', 'epauletRaise', 'fluff', 'wingHold', 'tailSpread', 'gape', 'neck', 'headPitch', 'tailTilt', 'lean']
        if (t > spreadLength(s.shape, s.hold) - TIMING.onset) endSong(true)
        break
      }
      case 'climb': {
        const h = hold!
        const dir = Math.sign(climbTo - h.at[0])
        const next = h.at[0] + dir * Math.min(Math.abs(climbTo - h.at[0]), S.climb.speed * dt)
        h.at[0] = next
        field!.move(handles[0]!, next)
        if (Math.abs(climbTo - next) < 1e-4) { restOf(h, anchor); beginBout() }
        break
      }
      case 'step': {
        // one foot onto the new stem, the bird between the two, then the other foot, then onto it
        timer -= dt
        stepPhase = 1 - Math.max(0, timer) / stepFor
        if (timer <= 0 && stepTo) {
          letGo()
          const to = stepTo
          stepTo = null
          take(to)
          settle()
          beginBout()
        }
        break
      }
      case 'flutter': {
        const f = flight!
        // along the path at its speed, braking to arrive at `arrive`
        const end = placeFor(f.to, f.landHeading, flightEnd)
        const L = Math.max(0.3, Math.hypot(end.x - f.from.x, end.z - f.from.z))
        // braking at 12 m/s/s (ours) to arrive at its landing speed
        const v = Math.min(f.speed, Math.sqrt(2 * 12 * (1 - f.s) * L) + f.arrive)
        f.s = Math.min(1, f.s + (v * dt) / L)
        const k = ease(f.s)
        const x = f.from.x + (end.x - f.from.x) * k, z = f.from.z + (end.z - f.from.z) * k
        const hop = Math.max(0, f.top - Math.max(f.from.y, end.y))
        const y = f.from.y + (end.y - f.from.y) * k + 4 * hop * f.s * (1 - f.s)
        const travel = Math.hypot(x - pos.x, z - pos.z) > 1e-6 ? Math.atan2(-(z - pos.z), x - pos.x) : heading
        pos.set(x, y, z)
        // turning no faster than the setting: toward the way it goes, then the way it lands
        const aim = f.s > 0.85 ? f.landHeading : travel
        const d = wrap(aim - heading)
        heading = wrap(heading + Math.max(-S.flutter.turn * dt, Math.min(S.flutter.turn * dt, d)))
        T.lean = S.flutter.lean
        T.wingSpread = 1
        T.legsUp = f.s < 1 - S.flutter.legs * v / L ? 1 : 0
        T.tailSpread = f.s > 0.7 ? 0.5 : 0.1
        pose.wingPhase = (pose.wingPhase + Math.min(S.flutter.hz * dt, 1 / 6)) % 1
        quick = ['wingSpread']
        if (f.s >= 1) {
          heading = f.landHeading
          const vx = Math.cos(travel) * v, vz = -Math.sin(travel) * v
          take(f.to, vx, vz)
          flight = null
          settle()
          beginBout()
        }
        break
      }
    }

    // on its stems: placed on them this frame, riding them, the feet holding them
    if (hold && state !== 'flutter') {
      placeFor(hold, heading, pos)
      // the stem's swing, measured from where it would settle (smoothed), taken up by the body about the feet
      anchor.lerp(restOf(hold, tmpA), Math.min(1, dt / S.ride.anchor))
      const mid = midOf(hold, tmpA)
      const off = toBird(tmpB.copy(mid).sub(anchor), null, heading, tmpB)
      const lever = S.ride.head * size
      rideX = -Math.asin(Math.max(-0.9, Math.min(0.9, S.ride.counter * off.x / lever)))
      rideZ = -Math.asin(Math.max(-0.9, Math.min(0.9, S.ride.counter * off.z / lever)))
      T.lean += rideX
      T.roll += rideZ
      if (hold.stems.length === 2) {
        // toward the lower foot, as the stems would settle (their swing is the ride's)
        const a = field!.restAt(hold.stems[0], hold.at[0], tmpA), b = field!.restAt(hold.stems[1], hold.at[1]!, axisA)
        const right = toBird(a, pos, heading, axisB).z > 0 ? a : b, left = right === a ? b : a
        T.roll += STRADDLE_ROLL * Math.atan2(left.y - right.y, Math.max(0.02, Math.hypot(left.x - right.x, left.z - right.z)))
      }
      // the lean's ride follows the stem at once (a smooth sway), within its rate
      quick.push('lean', 'roll')
      pose.feet = feetOn(hold)
      if (state === 'step' && stepTo) {
        // one foot already on the next stem
        const t = stepTo.stems[0], h = stepTo.at[0]
        if (stepPhase > 0.3) holdOn(field!.pointAt(t, h, tmpA), field!.axisAt(t, h, axisA), t.radiusAt(h), pos, heading, feet.right)
      }
      pose.wingPhase = 0
    } else pose.feet = null
    me.x = pos.x; me.z = pos.z

    // checks: settled, or excited after a move and around the singer's bouts
    const singerSinging = group.birds.some(b => b.singer && b.bout)
    if (clock >= nextCheckAt) {
      if (state !== 'sing') check()
      const excited = clock < excitedUntil || singerSinging
      nextCheckAt = clock + between(rng, excited ? S.check.excited : S.check.settled)
    }
    if (clock >= gapeFrom && clock < gapeUntil) T.gape = Math.max(T.gape, 0.4)
    apply(pose, T, dt, quick)
  }

  function endSong(sang: boolean): void {
    song = null
    me.singing = false
    state = 'perch'
    if (sang) boutLeft--
    if (boutLeft > 0) nextSongAt = clock + between(rng, S.song.every)
    else {
      boutLeft = 0
      nextSongAt = 0
      nextBout()
      // a bout ends: the epaulet at rest drawn again
      restEpaulet = drawEpaulet()
    }
    if (timer <= 0) timer = between(rng, [5, 15])
  }

  return {
    name: 'blackbird',
    get state() { return state },
    get x() { return pos.x }, get y() { return pos.y }, get z() { return pos.z }, get heading() { return heading },
    version,
    get singer() { return me.singer },
    get hold() { return hold },
    get song() { return song ? { grade: song.grade, rival: song.rival, spreading: song.start !== null, number: song.number } : null },
    get activity() { return activity },
    get bouts() { return bouts },
    update,
  }
}

/** the traced bill's angle below level at rest (rewbla's profile: 19 degrees), radians, for feeding's peer */
const BILL_REST = 0.34
