import { ease } from './types'

/**
 * The red-winged blackbird's song spread, graded and timed against its song: plain numbers, so the behaviour, the
 * viewer and the study screen run the same spread. From docs/research/2026-10-13-blackbird-display-and-reeds.md:
 * the grades' values are its section 8.2 (estimates shaped to the descriptions, tuned against the named photos), the
 * timing its sections 3.4 and 8.3 (two videos, four songs: a video estimate).
 */

/** A spread's grade: 0 song only, 1 low, 2 medium, 3 full; or 'tilt', the bill-tilt given without song. */
export type Grade = 0 | 1 | 2 | 3
export type Display = Grade | 'tilt'

/**
 * What a grade does to the pose. `epaulet` null keeps the bird's own resting value (grade 0); a number is at least that
 * much bared (grade 1 bares the patch if it isn't already). `tailTilt` and `lean` are added to the bird's own (radians:
 * tailTilt positive up, lean positive nose down); null leaves them.
 */
export interface SpreadPose {
  epaulet: number | null
  epauletRaise: number
  fluff: number
  wingHold: number
  tailSpread: number
  tailTilt: number | null
  lean: number | null
  neckExtend: number
  headPitch: number
  /** the gape through the trill */
  gape: number
}

export const REST: SpreadPose = {
  epaulet: null, epauletRaise: 0, fluff: 0, wingHold: 0, tailSpread: 0, tailTilt: null, lean: null, neckExtend: 0.5, headPitch: 0, gape: 0,
}

/** Research section 8.2, by grade, and the bill-tilt. */
export const GRADES: Record<Display, SpreadPose> = {
  0: { epaulet: null, epauletRaise: 0.1, fluff: 0.1, wingHold: 0, tailSpread: 0.05, tailTilt: null, lean: null, neckExtend: 0.6, headPitch: 0, gape: 1 },
  1: { epaulet: 0.6, epauletRaise: 0.5, fluff: 0.45, wingHold: 0.1, tailSpread: 0.2, tailTilt: -0.1, lean: 0.1, neckExtend: 0.7, headPitch: -0.15, gape: 1 },
  2: { epaulet: 1, epauletRaise: 0.8, fluff: 0.7, wingHold: 0.5, tailSpread: 0.5, tailTilt: -0.2, lean: 0.15, neckExtend: 0.75, headPitch: -0.05, gape: 1 },
  3: { epaulet: 1, epauletRaise: 1, fluff: 1, wingHold: 1, tailSpread: 0.95, tailTilt: -0.3, lean: 0.2, neckExtend: 0.8, headPitch: 0.1, gape: 1 },
  tilt: { epaulet: 0.6, epauletRaise: 0, fluff: -0.3, wingHold: 0, tailSpread: 0, tailTilt: null, lean: -0.1, neckExtend: 1, headPitch: 0.75, gape: 0 },
}

/** The envelope's times, seconds (research 8.3; Adopt where the research adopts one). */
export const TIMING = {
  /** the spread begins this long before the first note (0-0.5) */
  onset: 0.3,
  /** the head thrusts forward over this long, ending at the first note */
  thrust: 0.15,
  /** everything eases back over this long after the trill (0.2-0.9) */
  release: 0.45,
  /** the tail flicks up this far (radians, 20-25 degrees) for this long as it closes */
  flick: 0.4, flickSeconds: 0.2,
  /** the bill opens this far on the first notes, before the trill opens it fully (0.3-0.5) */
  intro: 0.4,
  /** at grade 2 or 3, one time in this many the raise, the wings and the fluff stay at this share for 1-3 s */
  afterHold: { every: 4, share: 0.7, seconds: [1, 3] as const },
} as const

/** A song's shape: its trill's start and its end, seconds after its first note. */
export interface SongShape { trill: number; end: number }

/**
 * How far into its grade each part of the spread is at `t` seconds after the song's first note (negative before it):
 * 0 at rest, 1 at the grade's value.
 * - Build, from TIMING.onset before the first note to the trill's start: the fluff and the epaulet over its first
 *   two-thirds, the raise, the wings and the tail over its last two-thirds, each eased (smoothstep), so each starts and
 *   arrives at rest speed. The head thrusts forward over TIMING.thrust, ending at the first note.
 * - Hold through the trill. The gape opens to TIMING.intro on the first notes, fully at the trill, and shuts at its end.
 * - Release over TIMING.release from the song's end, the tail flicking up (`flick`, radians) as it closes. With an
 *   after-song `hold` (seconds), the raise, the wings and the fluff ease to TIMING.afterHold.share and stay there, the
 *   epaulet bared, until the hold is over, then they release.
 * Every curve is continuous, so a spread never pops.
 */
export function envelope(t: number, song: SongShape, hold = 0) {
  const start = -TIMING.onset
  const span = Math.max(song.trill - start, 0.05)
  const ramp = (from: number, to: number) => ease(Math.min(1, Math.max(0, (t - from) / (to - from))))
  const out = (from: number) => 1 - ramp(from, from + TIMING.release)
  const end = song.end
  const buildEarly = ramp(start, start + (2 / 3) * span)
  const buildLate = ramp(start + span / 3, song.trill)
  // the held parts: full through the song, then down to the hold's share (over half a release), then out
  const share = TIMING.afterHold.share
  const kept = hold > 0 ? (t <= end + hold ? 1 - (1 - share) * ramp(end, end + TIMING.release / 2) : share * out(end + hold)) : out(end)
  const f = t - (end + hold)
  return {
    epaulet: Math.min(buildEarly, out(end + hold)),
    fluff: Math.min(buildEarly, kept),
    raise: Math.min(buildLate, kept),
    tail: Math.min(buildLate, out(end)),
    head: Math.min(ramp(-TIMING.thrust, 0), out(end)),
    gape: t < 0 ? 0 : t < song.trill
      ? TIMING.intro * ramp(0, Math.min(0.08, song.trill)) + (1 - TIMING.intro) * ramp(song.trill - 0.06, song.trill)
      : 1 - ramp(end - 0.08, end),
    flick: f > 0 && f < TIMING.flickSeconds ? TIMING.flick * Math.sin((Math.PI * f) / TIMING.flickSeconds) : 0,
  }
}

/** Seconds from the spread's onset until it is back at rest: the build, the song, any hold, and the release. */
export function spreadLength(song: SongShape, hold = 0): number {
  return TIMING.onset + song.end + hold + TIMING.release + 0.05
}

/**
 * The pose values a spread of `grade` asks for at `t` (envelope's), from the bird's own resting values: its resting
 * epaulet, tail tilt and lean, and a neck at 0.5. The bill-tilt, given without song, is `song` the length it is held:
 * its parts build over TIMING.onset before t = 0, hold, and release.
 */
export function spreadPose(grade: Display, t: number, song: SongShape, rest: { epaulet: number; tailTilt: number; lean: number }, hold = 0) {
  const g = GRADES[grade]
  const e = envelope(t, song, hold)
  const lerp = (a: number, b: number, k: number) => a + (b - a) * k
  const bared = g.epaulet === null ? rest.epaulet : Math.max(rest.epaulet, g.epaulet)
  const tilt = grade === 'tilt'
  return {
    epaulet: lerp(rest.epaulet, bared, e.epaulet),
    epauletRaise: g.epauletRaise * e.raise,
    fluff: g.fluff * e.fluff,
    wingHold: g.wingHold * e.raise,
    tailSpread: g.tailSpread * e.tail,
    tailTilt: rest.tailTilt + (g.tailTilt ?? 0) * e.tail + (tilt ? 0 : e.flick),
    lean: rest.lean + (g.lean ?? 0) * (tilt ? e.epaulet : e.tail),
    neckExtend: lerp(0.5, g.neckExtend, tilt ? e.epaulet : e.head),
    headPitch: g.headPitch * (tilt ? e.epaulet : e.head),
    gape: g.gape * e.gape,
  }
}
