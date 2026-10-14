import type { Zone, PolygonZone, Vec3 } from '../location/schema'
import type { Rng } from '../catalog/types'
import type { PoseState } from '../birds/model'
import type { Foraging } from '../birds/spec'
import type { GooseUnit } from './goose'
import type { SongCue } from '../audio/cues'

/**
 * What a behaviour asks its bird to say: its species' call as the catalog has it; or, played from a cue, the next song
 * (whose first note sounds `lead` seconds after onStart is called, the cue saying when its trill starts and it ends,
 * relative to that note) or a single check.
 */
export type CallAsk =
  | { kind: 'call' }
  | { kind: 'song'; onStart?: (lead: number, cue: SongCue) => void }
  | { kind: 'check'; onStart?: (lead: number) => void }

/** A flock's shared record: its target, and when the target next moves on. Flockmates hold the same object. */
export interface FlockGroup {
  targetX: number; targetZ: number; retargetAt: number
  /** two shovelers of the flock spinning together, if any are */
  spin?: Spin
  /** a flock of pelicans feeding in line, if it is */
  drive?: Drive
}

/**
 * A feeding bout for a whole flock, laid out once by the bird that calls it: a line abreast that gathers, sets off,
 * and dips together. Every bird of the flock reads it, and knows from it alone where to be and when to dip.
 */
export interface Drive {
  /** the birds, by their places along the line, left to right as it faces */
  readonly birds: readonly Neighbour[]
  /** the way the line swims, and where its middle is as it sets off */
  readonly heading: number
  readonly x: number
  readonly z: number
  /** m/s once it has set off, and the metres between birds along it */
  readonly speed: number
  readonly spacing: number
  /** the calling bird's clock when the line sets off, and when the bout is over */
  readonly startAt: number
  readonly endAt: number
  /** each dip: when each bird's bill starts down, seconds after the line sets off, by place; and whether that bird catches */
  readonly dips: readonly { readonly at: readonly number[]; readonly caught: readonly boolean[] }[]
}

/**
 * Two flockmates turning about their midpoint, nose to tail, `apart` metres between their centres. Both birds read it,
 * so the pair turns as one: the first advances the turn, and the second takes its place opposite.
 */
export interface Spin {
  readonly pair: readonly [Neighbour, Neighbour]
  /** the midpoint they turn about */
  readonly cx: number
  readonly cz: number
  readonly apart: number
  /** +1 counter-clockwise seen from above, -1 clockwise, for the whole bout */
  readonly dir: 1 | -1
  /** radians a second */
  readonly rate: number
  /** the first bird's bearing from the midpoint (0 = +x, counter-clockwise from above), and its clock when it set it */
  angle: number
  at: number
  /** the first bird's clock when the bout ends, or, while the two gather, when it gives up waiting */
  ends: number
  /** false while the two swim to their places on the circle; true once both are there and turning */
  spinning: boolean
}

/**
 * Another swimmer, as a swimmer sees it: where it is and faces, what it is doing, how close it lets others come, its
 * flock, and whether it is under the water (where it is no one's neighbour).
 */
export type Neighbour = Pick<BehaviorController, 'x' | 'z' | 'heading' | 'state' | 'spacing' | 'group' | 'submerged'>

/** A perch as a bird on it uses it: where its feet grip, the branch's radius there, and the way it faces the water. */
export interface Perch {
  readonly name: string
  /** world space, the top of the branch; the water is y = 0 */
  readonly position: Vec3
  /** metres */
  readonly radius: number
  /** radians, as a controller's heading (0 = +x, counter-clockwise seen from above): out over the water, across the branch */
  readonly heading: number
}

export interface BehaviorContext {
  zone: Zone
  rng: Rng
  wind: () => { dirX: number; dirZ: number; effective: number }
  ground: (x: number, z: number) => number
  /** a ring on the water at (x, z); `size` (0..1, default 1) for a smaller ring than a swimming bird's */
  onRipple?: (x: number, z: number, size?: number) => void
  /** spray where the bird goes into the water at (x, z); `size` 1, the default, is a kingfisher's plunge (src/world/splash.ts) */
  onSplash?: (x: number, z: number, size?: number) => void
  /**
   * asks for the bird's call now; the call scheduler plays it at once if the simultaneous-call cap allows, else drops
   * it. With no ask, the species' call (the kingfisher's rattle); a song or a check is played from one of its cues
   * (audio/cues.ts), and `onStart` hears, in the frame the sound is scheduled, how many seconds from now its first note
   * sounds. A dropped ask never calls back.
   */
  onCall?: (ask?: CallAsk) => void
  group?: FlockGroup
  /** world-space perch point for perch and kingfisher; the spawner takes it from the point zone, or a perches zone's first */
  perch?: Vec3
  /** a bird of a perches zone: every perch it may use, the first the one it starts on; the spawner fills it */
  perches?: readonly Perch[]
  /** for behaviors that flap; each behavior applies its own default when unset (perch 5) */
  wingbeatHz?: number
  /**
   * radians: the lean that flies a bird traced upright on its perch level (its detail's flight.pitch); 0 when unset.
   * The kingfisher leans from it: up to hover, down to plunge
   */
  flightPitch?: number
  /** how the bird feeds; probe treats a missing style as sandpiper, swim as dabbler */
  foraging?: Foraging
  /** the species' code, for a style whose settings differ by species (the dabbler's) */
  species?: string
  /**
   * swimmers: every swimmer on the water, of any species and in any zone, this bird's own controller included (it
   * knows itself by that); the spawner fills it
   */
  neighbours?: () => readonly Neighbour[]
  /** the goose style: the zone its family walks out to graze, across the shore from its own (the cast's `ashore`) */
  ashore?: Zone
  /** the goose style: its unit (a family, or a loose unit of adults, from the cast's `groups`) and its place in it */
  unit?: { unit: GooseUnit; place: number }
  onEvent?: (name: 'splash' | 'flap', x: number, y: number, z: number) => void
}

export interface BehaviorController {
  readonly name: string
  readonly state: string
  readonly x: number
  readonly y: number
  readonly z: number
  /** radians, 0 = +x, counter-clockwise seen from above */
  readonly heading: number
  /** swimmers: metres it keeps from any swimmer outside its flock */
  readonly spacing?: number
  /** swimmers: its flock's shared record, the same object as its flockmates' */
  readonly group?: FlockGroup
  /** divers: true while the whole bird is under the water; the spawner hides it then, and it can't be targeted */
  readonly submerged?: boolean
  update(dt: number, pose: PoseState): void
}

export type BehaviorFactory = (ctx: BehaviorContext, startX: number, startZ: number) => BehaviorController

export function polygonOf(ctx: BehaviorContext): PolygonZone {
  if (ctx.zone.kind !== 'polygon') throw new Error(`behavior needs a polygon zone, got ${ctx.zone.kind}`)
  return ctx.zone
}

export function perchOf(ctx: BehaviorContext): Vec3 {
  if (!ctx.perch) throw new Error('behavior needs a perch point')
  return ctx.perch
}

/** Shortest-path turn toward a target heading at a max rate. */
export function turnToward(current: number, target: number, maxDelta: number): number {
  let d = target - current
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return current + Math.max(-maxDelta, Math.min(maxDelta, d))
}

export function approach(current: number, target: number, rate: number, dt: number): number {
  return current + (target - current) * Math.min(1, rate * dt)
}

/** A uniform draw between lo and hi. */
export const between = (rng: () => number, [lo, hi]: readonly [number, number]) => lo + rng() * (hi - lo)
/** smoothstep: 0 to 1, starting and ending at zero speed */
export const ease = (t: number) => t * t * (3 - 2 * t)
/** An angle wrapped into -PI..PI. */
export const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
