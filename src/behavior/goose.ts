import type { BehaviorContext, BehaviorController } from './types'
import { approach, between, polygonOf, turnToward, wrap } from './types'
import { createSwimmer, type Swimmer } from './swimmer'
import { createDabbler, type DabblerSettings } from './dabbler'
import { pointInPolygon, randomPointInPolygon, clampToPolygon } from '../location/zones'
import type { PolygonZone } from '../location/schema'
import type { PoseState } from '../birds/model'
import type { Rng } from '../catalog/types'

type Range = readonly [number, number]
type Pt = [number, number]

/** A goose's place in its unit: in a family the gander, his mate, or one of their young; in a loose unit, an adult. */
export type GooseRole = 'gander' | 'goose' | 'young' | 'adult'
type Grazer = Exclude<GooseRole, 'adult'>

/**
 * A goose's settings: on the water a dabbler's, from its own numbers; then the family's trip ashore and back, its
 * grazing, and how it wades, walks, and stands.
 */
export interface GooseSettings extends DabblerSettings {
  /** ring sizes: a dabbler's, and the one ring a goose starts at its breast as it wades out or in */
  rings: DabblerSettings['rings'] & { wade: number }
  /**
   * How it meets the bed, metres of water: no deeper than `stand` it stands on its feet (afloat 0), and from `float`
   * down it floats (afloat 1); between, its feet leave the bed and fold as afloat rises with the depth. `stand` is the
   * built bird's float waterline above its feet, standing.
   */
  wade: { stand: number; float: number }
  /**
   * The family's trip: seconds on the water between trips, and grazing on each; who leads the file out and back (the
   * share of trips each leads); the file's gaps, metres; the stand on the bank after wading out, seconds, and the
   * chance of a shake; the walk's speed, m/s; where the family grazes, metres from the water; how far apart the birds
   * graze, metres; and the loaf on the water after wading back in, seconds
   */
  trip: {
    water: Range; grass: Range
    lead: Record<Grazer, number>
    file: Range
    stand: Range; shake: number
    walk: Range
    fromWater: Range
    spread: Range
    settle: Range
  }
  /**
   * Grazing: bites a second, each a dip of the bill `bite` metres into the sward; a slow step now and then, drifting
   * at `step.speed`; the body tipped `lean` and the bill no steeper than `reachAngle` below level; each role's
   * head-down and head-up bouts, seconds; and how much longer a bird on the edge of the group keeps its head up
   */
  graze: {
    bites: number; bite: number
    step: { every: Range; speed: Range }
    lean: number; reachAngle: number
    bouts: Record<Grazer, { down: Range; up: Range }>
    edge: number
  }
  /** neckExtend standing relaxed (between the trace and erect) and walking */
  neck: { stand: number; walk: number }
  /** the shore it will walk: the steepest rise, metres a metre, and the widest gap between the two zones, metres */
  shore: { slope: number; gap: number }
}

/**
 * The Canada Goose, from docs/research/2026-09-30-canada-goose.md, section 11 (behaviour in section 7). Sourced: the
 * water time budget's proportions (Zoghby 2013), that the gander's change of heading leads the family (Raveling 1969a),
 * the gander's and goose's head-down and head-up bout means (Sedinger & Raveling 1990), that no bird times its bouts
 * by another's (the same), and the bite rate (Heuermann et al. 2011, computed). Everything else is an estimate the
 * research marks as such: the feeding split, every length of time, the speeds, the spacings, the tip-up, the young's
 * bouts, the edge bird's longer looks, and the waddle's place in the walk.
 */
export const CANADA_GOOSE: GooseSettings = {
  // 0.5 m/s (0.4-0.6), the Mallard's by hull length; cruise bouts as the Mallard's (estimate)
  cruise: { speed: 0.5, seconds: [4, 14] },
  // slower to turn than the Mallard's 1.2 for a longer hull (estimate)
  turn: 0.8,
  // eight birds within about 3 m (estimate)
  flock: { radius: 3, retargetSeconds: 60, drift: 3, whenFarther: 6 },
  // 0.8 m in the flock, just over the 0.64 m length; 1.5 m from other birds (estimates: nothing measured)
  spacing: { flock: 0.8, other: 1.5 },
  // feeding 0.40, cruising 0.26, loafing 0.24, preening 0.06, alert 0.04: Zoghby 2013's daytime scans without flying
  // and walking (sourced in proportion)
  cruising: { share: 0.26 },
  loaf: { share: 0.24, seconds: [20, 120] },
  preen: { share: 0.06, seconds: [10, 40] },
  // mean alert bouts 5.6-8.0 s (Sedinger & Raveling 1990): 2-8 here, the neck erect
  alert: { share: 0.04, seconds: [2, 8] },
  // head-dips 0.6, tip-ups 0.25, at the surface 0.15 (estimate; the local photos showed head-dips and no tip-ups)
  feeding: { share: 0.4, split: { surface: 0.15, headDip: 0.6, tipUp: 0.25 } },
  // grazing the surface slowly, the bill about 30 degrees down (estimate)
  surface: { seconds: [5, 20], speed: 0.1, reachAngle: 0.5, lean: 0.05 },
  // 2-6 dips of 2-5 s, 1-3 s up between, the head and neck 0.30 m under (the erect neck's length), the body tipped 0.1
  // rad and the tail 0.1 (estimates)
  headDip: { dips: [2, 6], seconds: [2, 5], gap: [1, 3], depth: 0.3, lean: 0.1, tail: 0.1 },
  // 3-8 s (the Mallard's 4.2 s mean lengthened for a larger bird), 1-3 a bout, 3-10 s level between; 78 degrees (photo
  // 75-80); 2 strokes a second; 0.5 s over and 0.4 s back (estimates)
  tipUp: { count: [1, 3], seconds: [3, 8], gap: [3, 10], lean: 1.36, tail: 0.3, strokes: 2, down: 0.5, up: 0.4 },
  // ring sizes (estimates): a goose's swirls larger than a Mallard's; `ahead` is where the bill goes in, the built
  // bird's bill tip at the bottom of a head-dip, 0.341 m in front of the middle of the body
  rings: { tipUp: 0.8, headDip: 0.6, dabble: 0.3, dabbleEvery: [1, 2], ahead: 0.34, wade: 0.4 },
  // standing, the built bird's float waterline is 0.155 m above its feet (the root's rise ashore); it floats where the
  // water is as deep as the swim zones (0.2 m: the draft and the leg, 0.17) (estimate)
  wade: { stand: 0.155, float: 0.2 },
  trip: {
    // 5-20 min on the water, 20-60 min grazing (estimates; a family fed "for over an hour", Kortright 1942)
    water: [300, 1200], grass: [1200, 3600],
    // any bird may lead: the gander 0.4, the goose 0.3, a young bird 0.3 (estimates)
    lead: { gander: 0.4, goose: 0.3, young: 0.3 },
    // a loose file 1-2 body lengths apart (estimate)
    file: [0.6, 1.3],
    // standing 5-20 s on the bank, and half of them shake (estimates)
    stand: [5, 20], shake: 0.5,
    // 0.3-0.5 m/s (estimate), steps of 0.14-0.18 m at 2-3 a second (Nudds & Codd 2012, computed)
    walk: [0.3, 0.5],
    // within 5-20 m of the water (lawns by the water: Smith et al. 1999; broods within 5 m: Eberhardt 1987)
    fromWater: [5, 20],
    // 0.8-2 m apart grazing (estimate)
    spread: [0.8, 2],
    // a loaf on the water after coming back in (estimate)
    settle: [20, 90],
  },
  graze: {
    // 0.9 bites a second (0.8-1.0, computed for a 4 kg goose on a short lawn), each a small dip and pull of the bill
    bites: 0.9, bite: 0.012,
    // a slow step every 2-4 s, drifting 0.03-0.08 m/s (estimate)
    step: { every: [2, 4], speed: [0.03, 0.08] },
    // the body tipped well forward, the tail high, and the bill steeply down onto the grass, as on the grazing photo:
    // the built bird's bill tip then reaches the grass 0.24 m ahead of its toes (photo about 0.17)
    lean: 0.5, reachAngle: 1.5,
    // the gander's and the goose's means sourced (8.4 and 10.7 s down, 8.0 and 5.6 s up), their ranges and the young's
    // bouts estimates: head-up about 0.49 of the time, 0.34, and 0.07
    bouts: {
      gander: { down: [5, 12], up: [4, 12] },
      goose: { down: [7, 15], up: [3, 8] },
      young: { down: [15, 40], up: [1, 3] },
    },
    // edge birds look up for longer (Inglis & Lazarus 1981): 1.3 times (estimate)
    edge: 1.3,
  },
  // standing relaxed, the built bird's crown 0.227 m above its back (photo 0.23), between the trace (0.5) and erect
  // (1); walking a little lower, 0.199 m (estimate)
  neck: { stand: 0.85, walk: 0.75 },
  // banks over 0.5 m high and steeper than 60 degrees stop geese (Cooper 1998); this walks no steeper than 1 in 2,
  // across no more than 8 m of bank between its water and its grass
  shore: { slope: 0.5, gap: 8 },
}

/** The goose settings for a species: the Canada Goose's for every goose so far. */
export function gooseFor(_species?: string): GooseSettings {
  return CANADA_GOOSE
}

/** A straight way across the shore: from `water`, a spot in the water zone, to `land`, a spot in the ashore zone. */
export interface Crossing { water: Pt; land: Pt }

/**
 * A goose's unit, shared by its members: a family (the gander, his mate, and their young) that goes ashore together,
 * or a loose unit of adults that stays on the water. The family's trip is driven by its gander's clock.
 */
export interface GooseUnit {
  readonly family: boolean
  readonly size: number
  /** the members as they are made, by place */
  readonly members: GooseController[]
  /** the family on the water, ashore (walking out and grazing), or on the way back */
  stage: 'water' | 'out' | 'back'
  /** the gander's clock, and when the stage's time is up on it */
  clock: number
  until: number
  /** the trip's way across the shore, the order of the file (places), and where the family grazes */
  crossing: Crossing | null
  order: number[]
  graze: Pt | null
  /** where the family starts: decided by the first bird made, so a scene opens at a random point in the cycle */
  start: 'water' | 'grass' | null
}

/**
 * The units of a cast entry's `groups`: the first a family, each later one a loose unit of adults. A bird's place in
 * the entry picks its unit and its place in it (`placeIn`).
 */
export function gooseUnits(groups: readonly number[]): GooseUnit[] {
  return groups.map((size, i) => ({
    family: i === 0, size, members: [], stage: 'water', clock: 0, until: 0, crossing: null, order: [], graze: null, start: null,
  }))
}

/** The unit and place of the `index`th bird of an entry whose units are `units`. */
export function placeIn(units: readonly GooseUnit[], index: number): { unit: GooseUnit; place: number } {
  let i = index
  for (const unit of units) {
    if (i < unit.size) return { unit, place: i }
    i -= unit.size
  }
  throw new Error(`goose ${index} is past the entry's groups`)
}

/** A goose's role from its unit and place. */
export function roleOf(unit: GooseUnit | undefined, place: number): GooseRole {
  if (!unit?.family) return 'adult'
  return place === 0 ? 'gander' : place === 1 ? 'goose' : 'young'
}

/**
 * Where a goose meets the bed at ground height `ground` (the water's surface is y = 0): its y and afloat. No deeper
 * than `stand` it stands on the bed; from `float` down it floats on the surface; between, the body stays on the water
 * while the feet leave the bed, so y rises from the bed to the surface as afloat does, with no jump at either end.
 */
export function footing(ground: number, wade: GooseSettings['wade']): { y: number; afloat: number } {
  const depth = -ground
  if (depth <= wade.stand) return { y: ground, afloat: 0 }
  if (depth >= wade.float) return { y: 0, afloat: 1 }
  const afloat = (depth - wade.stand) / (wade.float - wade.stand)
  return { y: -(1 - afloat) * wade.stand, afloat }
}

/** how far inside its zone each end of a crossing lies, metres */
const INSET = 0.5
/** a crossing's bank is walked in steps this long, metres, to check its slope */
const STEP = 0.25

/**
 * A way across the shore between `water` and `ashore`: a spot just inside the water zone, deep enough to float, and
 * one just inside the ashore zone, dry, joined by a straight line no steeper than `shore.slope` at any step and no
 * longer than `shore.gap` outside the two zones. With `near`, the one whose land end is nearest it of a few tries;
 * else the first. Null if none of the tries is walkable.
 */
export function findCrossing(water: PolygonZone, ashore: PolygonZone, ground: (x: number, z: number) => number, S: GooseSettings, rng: Rng, near?: Pt): Crossing | null {
  let best: Crossing | null = null, bestD = Infinity
  for (let i = 0; i < 24; i++) {
    const t = randomPointInPolygon(ashore.points, rng)
    const edge = nearestIn(t[0], t[1], water.points)
    const d = Math.hypot(t[0] - edge[0], t[1] - edge[1])
    if (d < 1e-6) continue
    const ux = (t[0] - edge[0]) / d, uz = (t[1] - edge[1]) / d
    const w: Pt = [edge[0] - ux * INSET, edge[1] - uz * INSET]
    if (!pointInPolygon(w[0], w[1], water.points)) continue
    // where the line from the water's edge toward t enters the ashore zone
    let s = 0
    while (s < d && !pointInPolygon(edge[0] + ux * s, edge[1] + uz * s, ashore.points)) s += 0.05
    if (s > S.shore.gap) continue
    const land: Pt = [edge[0] + ux * (s + INSET), edge[1] + uz * (s + INSET)]
    if (!pointInPolygon(land[0], land[1], ashore.points)) continue
    if (!walkable(w, land, ground, S)) continue
    const c = { water: w, land }
    if (!near) return c
    const dn = Math.hypot(land[0] - near[0], land[1] - near[1])
    if (dn < bestD) { best = c; bestD = dn }
  }
  return best
}

/** the nearest point of a convex polygon to (x, z): the point itself if it lies inside */
export function nearestIn(x: number, z: number, points: PolygonZone['points']): Pt {
  if (pointInPolygon(x, z, points)) return [x, z]
  let best: Pt = [points[0]![0], points[0]![1]], bestD = Infinity
  points.forEach(([ax, az], i) => {
    const [bx, bz] = points[(i + 1) % points.length]!
    const [dx, dz] = [bx - ax, bz - az]
    const k = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)))
    const p: Pt = [ax + k * dx, az + k * dz]
    const d = Math.hypot(x - p[0], z - p[1])
    if (d < bestD) { best = p; bestD = d }
  })
  return best
}

/** whether the straight line from `w` (deep enough to float) to `l` (dry) rises no steeper than the shore allows */
function walkable(w: Pt, l: Pt, ground: (x: number, z: number) => number, S: GooseSettings): boolean {
  if (ground(w[0], w[1]) > -S.wade.float || ground(l[0], l[1]) <= 0) return false
  const len = Math.hypot(l[0] - w[0], l[1] - w[1])
  const n = Math.max(1, Math.ceil(len / STEP))
  let prev = ground(w[0], w[1])
  for (let k = 1; k <= n; k++) {
    const y = ground(w[0] + ((l[0] - w[0]) * k) / n, w[1] + ((l[1] - w[1]) * k) / n)
    if (Math.abs(y - prev) > S.shore.slope * (len / n)) return false
    prev = y
  }
  return true
}

/** A goose, as its unit and the tests see it: a swimmer's controller, its role, and what it is doing ashore. */
export interface GooseController extends BehaviorController {
  readonly role: GooseRole
  /** where it is in the family's trip: 'water' while it swims as a dabbler */
  readonly phase: Phase
  /** its own grazing spot, this trip */
  readonly spot: Pt
  /** the family's gander starts each bird on the trip out, and back */
  goOut(): void
  goBack(): void
}

type Phase = 'water' | 'file' | 'wadeOut' | 'stand' | 'walk' | 'graze' | 'walkBack' | 'wadeIn' | 'settle'

/** how fast the pose eases toward what a phase asks, per second */
const NECK_RATE = 2.5
const REACH_RATE = 3
const LEAN_RATE = 3
const GAIT_RATE = 6
/** the fastest it turns on its feet, rad/s, and how nearly it must face its way before it steps off */
const TURN_LAND = 1.5
const FACING = 0.3
/** a spot is reached this close, metres */
const ARRIVE = 0.05
/** a goose held up by another this long, seconds, walks on regardless */
const PATIENCE = 3
/** the nearest it ever walks up to one of its family, metres */
const HARD = 0.45
/** a shake on the bank: how long, seconds, as it settles to stand */
const SHAKE = 1

/**
 * The `goose` style on `swim`. On the water each bird swims as a dabbler, from the goose's own settings. A family (its
 * cast entry's first group) also goes ashore: after its time on the water its gander turns for the shore and holds the
 * heading, and the family follows in a loose file, wades up the bank (its y and afloat from the ground), stands a
 * while, walks out to graze, each bird keeping its own head-down and head-up rhythm by its role, and after its time on
 * the grass walks back in, in file, and loafs before swimming on. A loose unit stays on the water. Every goose stays in
 * the shared swimmers' list, so the other swimmers keep clear of it.
 */
export function createGoose(ctx: BehaviorContext, startX: number, startZ: number, S: GooseSettings = gooseFor(ctx.species)): GooseController {
  const water = polygonOf(ctx)
  const ashore = ctx.ashore?.kind === 'polygon' ? ctx.ashore : undefined
  const unit = ctx.unit?.unit
  const place = ctx.unit?.place ?? 0
  const role = roleOf(unit, place)
  const b: Swimmer = createSwimmer(ctx, startX, startZ, S)
  const family = unit?.family && ashore ? unit : undefined
  const gander = family !== undefined && place === 0

  let phase: Phase = 'water'
  let mind: BehaviorController | null = null
  let y = 0
  let afloat = 1
  let timer = 0
  /** a walk's spot, and the stand's; the bird's own grazing spot */
  let tx = b.x, tz = b.z
  let spot: Pt = [b.x, b.z]
  let walkSpeed = between(ctx.rng, S.trip.walk)
  let gap = between(ctx.rng, S.trip.file)
  let held = 0
  // grazing: whether the head is down, the bout's end, the next step, the bite's phase, and a step under way
  let down = true
  let boutLeft = 0
  let stepIn = 0
  let stepLeft = 0
  let biteAt = 0
  let shake = 0
  let paddlePhase = 0

  const controller: GooseController = {
    name: 'swim',
    get state() { return phase === 'water' ? mind!.state : phase === 'graze' ? (down ? 'headDown' : 'headUp') : phase },
    get phase() { return phase },
    get x() { return b.x }, get y() { return y }, get z() { return b.z }, get heading() { return b.heading },
    get spot() { return spot },
    spacing: S.spacing.other,
    group: b.flock.group,
    role,
    update,
    goOut() { phase = 'file'; gap = between(ctx.rng, S.trip.file); walkSpeed = between(ctx.rng, S.trip.walk) },
    goBack() { phase = 'walkBack'; gap = between(ctx.rng, S.trip.file); held = 0 },
  }
  b.self = controller
  unit?.members.push(controller)
  const members = () => (unit?.members ?? []).filter(m => m !== controller)

  /** the dabbler that swims this bird on the water, made again each time it comes back in */
  function swimAsDabbler(): void {
    mind = createDabbler(ctx, b.x, b.z, S, b)
    b.self = controller
    phase = 'water'
  }

  // where the family opens the scene: the first bird made decides, by the shares of the cycle's means
  if (family && family.start === null) {
    const w = (S.trip.water[0] + S.trip.water[1]) / 2, g = (S.trip.grass[0] + S.trip.grass[1]) / 2
    family.start = ctx.rng() < g / (w + g) ? 'grass' : 'water'
    if (family.start === 'grass') {
      family.stage = 'out'
      family.graze = grazeCentre()
      family.until = ctx.rng() * between(ctx.rng, S.trip.grass)
    } else family.until = ctx.rng() * between(ctx.rng, S.trip.water)
  }
  if (family?.start === 'grass') {
    spot = grazeSpot()
    ;[b.x, b.z] = spot
    phase = 'graze'
    startBout(ctx.rng() < 0.5)
    ;({ y, afloat } = footing(ctx.ground(b.x, b.z), S.wade))
  } else swimAsDabbler()

  /** a point in the ashore zone `fromWater` metres from the water zone, where the family grazes */
  function grazeCentre(): Pt {
    let best = randomPointInPolygon(ashore!.points, ctx.rng)
    for (let i = 0; i < 40; i++) {
      const p = randomPointInPolygon(ashore!.points, ctx.rng)
      const e = nearestIn(p[0], p[1], water.points)
      const d = Math.hypot(p[0] - e[0], p[1] - e[1])
      if (d >= S.trip.fromWater[0] && d <= S.trip.fromWater[1]) { best = p; break }
    }
    return best
  }
  /** this bird's own spot near the family's grazing centre, clear of the spots of those placed before it */
  function grazeSpot(): Pt {
    const c = family!.graze!
    const taken = members().map(m => m.spot)
    let best: Pt = clampToPolygon(c[0], c[1], ashore!.points)
    for (let i = 0; i < 60; i++) {
      const a = ctx.rng() * Math.PI * 2, r = Math.sqrt(ctx.rng()) * S.trip.spread[1] * 1.2
      const p = clampToPolygon(c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, ashore!.points)
      best = p
      if (taken.every(q => Math.hypot(q[0] - p[0], q[1] - p[1]) >= S.trip.spread[0] + 0.1)) break
    }
    return best
  }

  /**
   * The order of a file, by places: a leader by the lead shares, then the young, and the parents at the rear: when one
   * parent leads the other brings up the rear, and when a young bird leads, the goose and then the gander
   */
  function fileOrder(): number[] {
    const places = family!.members.map((_, i) => i)
    const young = places.filter(i => i >= 2)
    for (let i = young.length - 1; i > 0; i--) { const j = Math.floor(ctx.rng() * (i + 1)); [young[i], young[j]] = [young[j]!, young[i]!] }
    const r = ctx.rng() * (S.trip.lead.gander + S.trip.lead.goose + S.trip.lead.young)
    if (r < S.trip.lead.gander || young.length === 0 && r < S.trip.lead.gander + S.trip.lead.young) return [0, ...young, 1]
    if (r < S.trip.lead.gander + S.trip.lead.goose) return [1, ...young, 0]
    return [...young, 1, 0]
  }

  /** the gander's part: the family's clock, and when the trip starts, turns at the grass, and is over */
  function lead(): void {
    const f = family!
    const all = f.members
    if (f.stage === 'water') {
      if (f.clock < f.until || all.some(m => m.phase !== 'water')) return
      const c = findCrossing(water, ashore!, ctx.ground, S, ctx.rng)
      if (!c) { f.until = f.clock + between(ctx.rng, S.trip.water); return }
      f.stage = 'out'; f.crossing = c; f.order = fileOrder(); f.graze = grazeCentre(); f.until = Infinity
      for (const m of all) m.goOut()
    } else if (f.stage === 'out') {
      if (f.until === Infinity) {
        if (phase === 'graze') f.until = f.clock + between(ctx.rng, S.trip.grass)
        return
      }
      if (f.clock < f.until) return
      const c = findCrossing(water, ashore!, ctx.ground, S, ctx.rng, [b.x, b.z])
      if (!c) { f.until = f.clock + 60; return }
      f.stage = 'back'; f.crossing = c; f.order = fileOrder()
      for (const m of all) m.goBack()
    } else if (all.every(m => m.phase === 'water')) {
      f.stage = 'water'; f.until = f.clock + between(ctx.rng, S.trip.water)
    }
  }

  /** the bird ahead of this one in the file, if any */
  function ahead(): GooseController | undefined {
    const f = family!
    const k = f.order.indexOf(place)
    return k > 0 ? f.members[f.order[k - 1]!] : undefined
  }

  /** a file's place for this bird: its gap behind the bird ahead, on the far side of it from where the file is going */
  function behind(a: GooseController, to: Pt, zone: PolygonZone): Pt {
    const d = Math.hypot(to[0] - a.x, to[1] - a.z)
    return d < 1e-6 ? to : nearestIn(a.x - ((to[0] - a.x) / d) * gap, a.z - ((to[1] - a.z) / d) * gap, zone.points)
  }

  /**
   * One step on its feet toward (px, pz) at `speed`, straight for it, so a walk between two spots in a zone stays in
   * it: it turns first and steps off once it faces the way. It waits for a family member it would come within the
   * file's least gap of; after PATIENCE it walks on, though never within HARD of one, and after twice that it steps
   * aside. Returns the distance left.
   */
  function walkTo(px: number, pz: number, speed: number, dt: number, pose: PoseState, keepIn?: PolygonZone['points']): number {
    const d = Math.hypot(px - b.x, pz - b.z)
    if (d < ARRIVE) return d
    const want = Math.atan2(-(pz - b.z), px - b.x)
    b.heading = turnToward(b.heading, want, TURN_LAND * dt)
    if (Math.abs(wrap(want - b.heading)) > FACING) return d
    const step = Math.min(d, speed * dt)
    let nx = b.x + ((px - b.x) / d) * step, nz = b.z + ((pz - b.z) / d) * step
    const closing = (least: number) => members().some(m => {
      const now = Math.hypot(m.x - nx, m.z - nz)
      return now < least && now < Math.hypot(m.x - b.x, m.z - b.z)
    })
    if (closing(S.trip.file[0])) {
      held += dt
      if (held < PATIENCE) return d
      if (held > 2 * PATIENCE) {
        // aside, square to its way, on the side away from the nearest of the family
        const n = members().reduce((a, m) => (Math.hypot(m.x - b.x, m.z - b.z) < Math.hypot(a.x - b.x, a.z - b.z) ? m : a))
        const side = Math.sign((px - b.x) * (n.z - b.z) - (pz - b.z) * (n.x - b.x)) || 1
        nx = b.x + (side * (pz - b.z) / d) * step; nz = b.z - (side * (px - b.x) / d) * step
        if (keepIn && !pointInPolygon(nx, nz, keepIn)) return d
      }
      if (closing(HARD)) return d
    } else held = 0
    pose.strideDistance += Math.hypot(nx - b.x, nz - b.z)
    b.x = nx; b.z = nz
    return Math.hypot(px - b.x, pz - b.z)
  }

  /** set y and afloat from the ground under the bird, and ring the water at its breast as it wades out or in */
  function meetGround(): void {
    const was = afloat
    ;({ y, afloat } = footing(ctx.ground(b.x, b.z), S.wade))
    if ((was > 0.5) !== (afloat > 0.5)) ctx.onRipple?.(b.x + Math.cos(b.heading) * 0.2, b.z - Math.sin(b.heading) * 0.2, S.rings.wade)
  }

  function startBout(isDown: boolean): void {
    down = isDown
    const bouts = S.graze.bouts[role === 'adult' ? 'goose' : role]
    boutLeft = between(ctx.rng, down ? bouts.down : bouts.up)
    // a bird on the edge of the grazing group, furthest from its middle, looks up for longer
    if (!down && onEdge()) boutLeft *= S.graze.edge
    stepIn = between(ctx.rng, S.graze.step.every)
  }
  function onEdge(): boolean {
    const grazing = (family?.members ?? []).filter(m => m.phase === 'graze' || m === controller)
    if (grazing.length < 3) return false
    const cx = grazing.reduce((s, m) => s + m.x, 0) / grazing.length, cz = grazing.reduce((s, m) => s + m.z, 0) / grazing.length
    const far = (m: { x: number; z: number }) => Math.hypot(m.x - cx, m.z - cz)
    return grazing.every(m => far(m) <= far(controller))
  }

  /** a slow grazing step's way: on its heading, or toward the family if it has drifted off, or away from one too close */
  function stepWay(): Pt {
    const others = (family?.members ?? []).filter(m => m !== controller && m.phase === 'graze')
    let [dx, dz] = [Math.cos(b.heading + (ctx.rng() - 0.5)), -Math.sin(b.heading + (ctx.rng() - 0.5))]
    const nearest = others.reduce<GooseController | null>((n, m) => (!n || Math.hypot(m.x - b.x, m.z - b.z) < Math.hypot(n.x - b.x, n.z - b.z) ? m : n), null)
    if (nearest) {
      const d = Math.hypot(nearest.x - b.x, nearest.z - b.z)
      if (d > S.trip.spread[1]) [dx, dz] = [(nearest.x - b.x) / d, (nearest.z - b.z) / d]
      else if (d < S.trip.spread[0] + 0.1) [dx, dz] = [(b.x - nearest.x) / d, (b.z - nearest.z) / d]
    }
    return [b.x + dx, b.z + dz]
  }

  function update(dt: number, pose: PoseState): void {
    if (gander) { family!.clock += dt; lead() }
    if (phase === 'water') {
      mind!.update(dt, pose)
      y = 0; afloat = 1
      pose.afloat = 1
      pose.gait = approach(pose.gait, 0, GAIT_RATE, dt)
      return
    }
    let neck = S.neck.walk, reach = 0, lean = 0, gaitWant = 0
    const f = family!
    const c = f.crossing!
    switch (phase) {
      case 'file': {
        // on the water to the shore: the leader straight for the crossing, the rest each behind the bird ahead
        const a = ahead()
        const [px, pz] = a && a.phase === 'file' ? behind(a, c.water, water) : c.water
        const lag = a ? Math.hypot(a.x - b.x, a.z - b.z) : 0
        b.swimTo(px, pz, S.cruise.speed * (a && lag > gap * 1.5 ? 1.3 : 1), dt)
        neck = 0.6
        const clear = !a || (a.phase !== 'file' && Math.hypot(a.x - b.x, a.z - b.z) >= gap)
        if (Math.hypot(c.water[0] - b.x, c.water[1] - b.z) < 1 && clear) { phase = 'wadeOut'; held = 0 }
        break
      }
      case 'wadeOut': {
        const a = ahead()
        const tooClose = a && a.phase === 'wadeOut' && Math.hypot(a.x - b.x, a.z - b.z) < gap
        if (!tooClose) walkTo(c.land[0], c.land[1], walkSpeed, dt, pose)
        meetGround()
        neck = S.neck.walk
        gaitWant = tooClose ? 0 : 1 - afloat
        if (Math.hypot(c.land[0] - b.x, c.land[1] - b.z) < ARRIVE) {
          // it steps on up the bank to stand in the file, the leader furthest on
          const k = f.order.indexOf(place)
          const ux = c.land[0] - c.water[0], uz = c.land[1] - c.water[1], ul = Math.hypot(ux, uz)
          const on = 1 + (f.order.length - 1 - k) * 0.9
          ;[tx, tz] = clampToPolygon(c.land[0] + (ux / ul) * on, c.land[1] + (uz / ul) * on, ashore!.points)
          phase = 'stand'; timer = between(ctx.rng, S.trip.stand); shake = ctx.rng() < S.trip.shake ? SHAKE : 0
        }
        break
      }
      case 'stand': {
        const left = walkTo(tx, tz, walkSpeed, dt, pose, ashore!.points)
        meetGround()
        if (left < ARRIVE) {
          timer -= dt
          neck = S.neck.stand
          shake = Math.max(0, shake - dt)
          if (timer <= 0) { phase = 'walk'; spot = grazeSpot(); [tx, tz] = spot }
        } else { neck = S.neck.walk; gaitWant = 1 }
        break
      }
      case 'walk': {
        const left = walkTo(tx, tz, walkSpeed, dt, pose, ashore!.points)
        meetGround()
        gaitWant = 1
        if (left < ARRIVE) { phase = 'graze'; startBout(true) }
        break
      }
      case 'graze': {
        boutLeft -= dt
        if (boutLeft <= 0) startBout(!down)
        if (down) {
          neck = 0.5; reach = 1; lean = S.graze.lean
          // a slow step now and then
          stepIn -= dt
          if (stepIn <= 0 && stepLeft <= 0) { stepLeft = between(ctx.rng, S.graze.step.speed) * between(ctx.rng, S.graze.step.every); [tx, tz] = stepWay(); stepIn = between(ctx.rng, S.graze.step.every) }
        } else { neck = 1; stepLeft = 0 }
        if (stepLeft > 0) {
          const [px, pz] = nearestIn(tx, tz, ashore!.points)
          const x0 = b.x, z0 = b.z
          walkTo(px, pz, 0.25, dt, pose, ashore!.points)
          stepLeft -= Math.hypot(b.x - x0, b.z - z0) || dt * 0.25
          gaitWant = 1
        }
        meetGround()
        break
      }
      case 'walkBack': {
        const a = ahead()
        const [px, pz] = a && a.phase === 'walkBack' ? behind(a, c.land, ashore!) : c.land
        walkTo(px, pz, walkSpeed, dt, pose, ashore!.points)
        meetGround()
        gaitWant = 1
        const clear = !a || (a.phase !== 'walkBack' && Math.hypot(a.x - b.x, a.z - b.z) >= gap)
        if (Math.hypot(c.land[0] - b.x, c.land[1] - b.z) < 0.3 && clear) { phase = 'wadeIn'; held = 0 }
        break
      }
      case 'wadeIn': {
        const a = ahead()
        const tooClose = a && a.phase === 'wadeIn' && Math.hypot(a.x - b.x, a.z - b.z) < gap
        if (!tooClose) walkTo(c.water[0], c.water[1], walkSpeed, dt, pose)
        meetGround()
        gaitWant = tooClose ? 0 : 1 - afloat
        if (Math.hypot(c.water[0] - b.x, c.water[1] - b.z) < ARRIVE) {
          // out a little from the shore, then a loaf
          const ux = c.water[0] - c.land[0], uz = c.water[1] - c.land[1], ul = Math.hypot(ux, uz)
          ;[tx, tz] = clampToPolygon(b.x + (ux / ul) * 2.5, b.z + (uz / ul) * 2.5, water.points)
          phase = 'settle'; timer = between(ctx.rng, S.trip.settle)
        }
        break
      }
      case 'settle': {
        b.swimTo(tx, tz, S.cruise.speed * 0.6, dt)
        y = 0; afloat = 1
        neck = 0.15
        timer -= dt
        if (timer <= 0) { swimAsDabbler(); pose.afloat = 1; return }
        break
      }
    }
    // bites while the head is down: a quick dip and pull of the bill, `bites` a second
    biteAt = (biteAt + S.graze.bites * dt) % 1
    const bite = phase === 'graze' && down ? Math.max(0, Math.sin(biteAt * Math.PI * 2)) ** 4 * S.graze.bite : 0
    pose.afloat = afloat
    pose.neckExtend = approach(pose.neckExtend, neck, NECK_RATE, dt)
    pose.reach = approach(pose.reach, reach, REACH_RATE, dt)
    // a bite is quick; a head coming up out of the water, as the bird turns for the shore mid-dip, is not
    pose.reachDepth = approach(pose.reachDepth, bite, phase === 'graze' && down ? 30 : REACH_RATE, dt)
    pose.reachAngle = approach(pose.reachAngle, reach > 0 ? S.graze.reachAngle : Math.PI / 2, REACH_RATE, dt)
    pose.lean.x = approach(pose.lean.x, lean, LEAN_RATE, dt)
    // a shake: a quick roll from side to side
    pose.lean.z = approach(pose.lean.z, phase === 'stand' && shake > 0 && shake < SHAKE ? 0.12 * Math.sin(shake * Math.PI * 8) : 0, 12, dt)
    pose.tailTilt = approach(pose.tailTilt, 0, LEAN_RATE, dt)
    pose.paddle = approach(pose.paddle, 0, 4, dt)
    paddlePhase = (paddlePhase + S.tipUp.strokes * dt) % 1
    pose.paddlePhase = paddlePhase
    pose.headBob = approach(pose.headBob, 0, 4, dt)
    pose.gait = approach(pose.gait, gaitWant, GAIT_RATE, dt)
  }

  return controller
}
