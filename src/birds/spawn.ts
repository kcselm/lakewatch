import * as THREE from 'three'
import type { Location, Behavior, LaneZone, Vec3, CastEntry, PerchesZone } from '../location/schema'
import type { Rng } from '../catalog/types'
import { makeRng } from '../catalog/rng'
import { randomPointInPolygon } from '../location/zones'
import { BEHAVIORS, type BehaviorContext, type BehaviorController, type CallAsk, type Perch } from '../behavior'
import { companyOf } from '../behavior/swim'
import { startSpot } from '../behavior/swimmer'
import { heronStart, heronFor } from '../behavior/heron'
import { gooseUnits, placeIn, type GooseUnit } from '../behavior/goose'
import { createFlyover, flightFor, type Formation, type FlyoverController } from '../behavior/flyover'
import { createBirdModel } from './factory'
import { buildPlaceholder } from './placeholder'
import { buildFlock, type FlockModel } from './flock'
import { getSpec, hasSpec } from './species'
import { defaultPose, type PoseState, type BirdModel } from './model'
import type { BirdRegistry } from './registry'
import type { Wind } from '../world/wind'
import type { RippleBuffer } from '../world/ripples'
import type { SplashBuffer } from '../world/splash'
import type { WorldModule } from '../world/scene'

/** Things the spawner reports outward (audio hooks); every callback is optional. */
export interface SpawnEvents {
  flockStart?(key: string, species: string): void
  flockMove?(key: string, x: number, y: number, z: number): void
  flockEnd?(key: string): void
  effect?(name: 'splash' | 'flap', x: number, y: number, z: number): void
  /** a bird's behaviour asks for its call now: the bird's registry id, and what it asks for (none: its species' call) */
  call?(id: number, ask?: CallAsk): void
}

export interface SpawnDeps {
  registry: BirdRegistry
  wind: Wind
  ground: (x: number, z: number) => number
  ripples: RippleBuffer
  /** where a bird's plunge throws up spray; without it, a plunge makes none */
  splashes?: SplashBuffer
  seed: number
  events?: SpawnEvents
  /**
   * world-space perch points by zone name: one, which every bird of the zone shares, or a list, from which each bird
   * of the zone takes the next of its own (the stumps'); point zones not listed here perch at their own position
   */
  perches?: Record<string, Vec3 | Vec3[]>
}

/**
 * One bird of the cast. A goose entry's birds also carry its `ashore` zone and its `groups` (without them, one family of
 * the whole entry), and each its `index` in the entry, which places it in its unit.
 */
export interface Individual {
  species: string; variant?: string; behavior: Behavior; zone: string; groupKey: string
  ashore?: string; groups?: number[]; index?: number
}
export interface FlockEntry {
  species: string; variant?: string; zone: string; count: number; everySeconds: [number, number]; formation: Formation; groupKey: string
  /** a version for each bird, where the entry gives counts per version (a detailed species' flock; validateCast allows no other) */
  versions?: (string | undefined)[]
}

export const DEFAULT_FLOCK_EVERY: [number, number] = [120, 300]

/** One version for a bird: the one named, a random pick for `mixed`, or none (counts per version are for versionsFor). */
function pickVariant(species: string, plumage: CastEntry['plumage'], rng: Rng): string | undefined {
  if (typeof plumage === 'object') return undefined
  const variants = hasSpec(species) ? Object.keys(getSpec(species).variants) : []
  if (plumage === 'mixed' && variants.length > 0) return variants[Math.floor(rng() * variants.length)]
  if (plumage && plumage !== 'mixed' && variants.includes(plumage)) return plumage
  return undefined
}

/**
 * A version for each bird of an entry. Counts per version are dealt out exactly, in a shuffled order, so no version
 * always lands on the same bird of the flock; a version the species doesn't have (validateCast names it) is none.
 */
function versionsFor(entry: CastEntry, rng: Rng): (string | undefined)[] {
  if (typeof entry.plumage !== 'object') return Array.from({ length: entry.count }, () => pickVariant(entry.species, entry.plumage, rng))
  const known = hasSpec(entry.species) ? Object.keys(getSpec(entry.species).variants) : []
  const deck = Object.entries(entry.plumage).flatMap(([v, n]) => Array.from({ length: n }, () => (known.includes(v) ? v : undefined)))
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return Array.from({ length: entry.count }, (_, n) => deck[n])
}

/** Per-bird behaviors, one record per individual. Flyovers are flocks: see flockEntries. */
export function expandCast(loc: Location, rng: Rng): Individual[] {
  const out: Individual[] = []
  loc.cast.forEach((entry, i) => {
    if (entry.behavior === 'flyover') return
    if (!(entry.behavior in BEHAVIORS)) {
      console.warn(`cast[${i}] ${entry.species}: behavior ${entry.behavior} is not implemented yet; skipped`)
      return
    }
    versionsFor(entry, rng).forEach((variant, index) => {
      const goose = entry.groups || entry.ashore ? { ashore: entry.ashore, groups: entry.groups ?? [entry.count], index } : {}
      out.push({ species: entry.species, variant, behavior: entry.behavior, zone: entry.zone, groupKey: `cast${i}`, ...goose })
    })
  })
  return out
}

/** Flyover entries, one record per flock. */
export function flockEntries(loc: Location, rng: Rng): FlockEntry[] {
  const out: FlockEntry[] = []
  loc.cast.forEach((entry, i) => {
    if (entry.behavior !== 'flyover') return
    out.push({
      species: entry.species, variant: pickVariant(entry.species, entry.plumage, rng), zone: entry.zone, count: entry.count,
      everySeconds: entry.everySeconds ?? DEFAULT_FLOCK_EVERY, formation: entry.formation ?? 'line', groupKey: `cast${i}`,
      ...(typeof entry.plumage === 'object' ? { versions: versionsFor(entry, rng) } : {}),
    })
  })
  return out
}

const STANDING: Behavior[] = ['wade', 'probe']

/**
 * A perches zone's perches as a bird uses them: each a world point (its height is above the water, y = 0), and its
 * facing, a compass bearing as the location gives it (0 toward -z, clockwise), turned into a controller's heading.
 */
export function perchesOf(zone: PerchesZone): Perch[] {
  return zone.perches.map(p => ({
    name: p.name,
    position: [p.position[0], p.height, p.position[1]] as Vec3,
    radius: p.radius,
    heading: Math.PI / 2 - (p.facing * Math.PI) / 180,
  }))
}

/**
 * What a species brings to its behavior: its code (for a style whose settings differ by species), its wingbeat, how
 * it feeds, and, for a bird with a flight wing traced upright on its perch, the lean that flies it level (radians, from
 * its flight.pitch). A species with no spec flaps at 5 Hz.
 */
export function speciesTraits(code: string): Pick<BehaviorContext, 'species' | 'wingbeatHz' | 'foraging' | 'flightPitch'> {
  if (!hasSpec(code)) return { species: code, wingbeatHz: 5 }
  const spec = getSpec(code)
  const pitch = spec.detail?.flight?.pitch
  return { species: code, wingbeatHz: spec.wingbeatHz, foraging: spec.foraging, ...(pitch !== undefined ? { flightPitch: (pitch * Math.PI) / 180 } : {}) }
}

interface LiveBird { controller: BehaviorController; pose: PoseState; model: BirdModel }
interface LiveFlock {
  key: string; species: string
  model: FlockModel; controller: FlyoverController; pose: PoseState
  /** registry ids and targeting proxies, present only while crossing */
  ids: number[]; proxies: THREE.Group[]
}

export function spawnCast(loc: Location, deps: SpawnDeps): WorldModule & { object: THREE.Group } {
  const object = new THREE.Group()
  const rng = makeRng(deps.seed)
  const groups = new Map<string, NonNullable<BehaviorContext['group']>>()
  /**
   * every swimmer on the water, which each keeps its distance from whatever their zones: zones overlap (the lake's near
   * and open water do), and each bird still swims only in its own
   */
  const swimmers: BehaviorController[] = []
  /** every heron in the cast, which each keeps its distance from */
  const herons: BehaviorController[] = []
  /** each goose entry's units, by its group key: its family and its loose units */
  const units = new Map<string, GooseUnit[]>()
  const birds: LiveBird[] = []
  const flocks: LiveFlock[] = []
  /** how many birds have taken a perch from each zone's list */
  const taken = new Map<string, number>()
  const perchFor = (name: string, fallback: Vec3): Vec3 => {
    const p = deps.perches?.[name]
    if (!p) return fallback
    if (!Array.isArray(p[0])) return p as Vec3
    const list = p as Vec3[], k = taken.get(name) ?? 0
    if (k >= list.length) throw new Error(`${name}: more birds than its ${list.length} perches`)
    taken.set(name, k + 1)
    return list[k]!
  }

  for (const ind of expandCast(loc, rng)) {
    const zone = loc.zones[ind.zone]!
    // a perching bird sits at its point zone (or takes the next of its perches there); a bird of a perches zone has
    // them all, and starts on the first
    const perches = zone.kind === 'perches' ? perchesOf(zone) : undefined
    const perch: Vec3 | undefined = zone.kind === 'point' ? perchFor(ind.zone, zone.position) : perches?.[0]?.position
    const model = hasSpec(ind.species)
      ? createBirdModel(getSpec(ind.species), ind.variant)
      : buildPlaceholder(ind.species, STANDING.includes(ind.behavior) ? 'standing' : perch ? 'perched' : 'swimming')
    const swim = ind.behavior === 'swim' && zone.kind === 'polygon'
    const traits = speciesTraits(ind.species)
    const company = swim ? companyOf(traits.foraging, ind.species) : undefined
    const heron = ind.behavior === 'wade' && traits.foraging === 'heron' && zone.kind === 'polygon'
    // herons share a group by species, not by cast entry, so each keeps its own species' spacing whatever entry it came from
    const key = heron ? `heron:${ind.species}` : ind.groupKey
    if (!groups.has(key)) {
      // A probing flock's target starts at the vantage and goes straight to its patch. A swimming flock starts formed,
      // round a point in its zone, and works that patch before it drifts on: otherwise every duck would spend the first
      // minute swimming to its flock, all of them making wakes.
      const [gx, gz] = swim && zone.kind === 'polygon' ? randomPointInPolygon(zone.points, rng) : [0, 0]
      groups.set(key, { targetX: gx, targetZ: gz, retargetAt: company?.retargetSeconds ?? 0 })
    }
    const group = groups.get(key)!
    let id = -1                                        // the bird's registry id, once it is added below
    const ctx: BehaviorContext = {
      zone,
      rng: makeRng(Math.floor(rng() * 1e9)),
      wind: () => ({ dirX: deps.wind.state.dir.x, dirZ: deps.wind.state.dir.y, effective: deps.wind.effective() }),
      ground: deps.ground,
      onRipple: (x, z, size) => deps.ripples.spawn(x, z, size),
      onSplash: (x, z, size) => deps.splashes?.spawn(x, z, size),
      onCall: ask => deps.events?.call?.(id, ask),
      // a probing or swimming flock's shared record; for herons, their species' group, so each keeps its own species' spacing
      group: ind.behavior === 'probe' || swim || heron ? group : undefined,
      perch,
      perches,
      neighbours: swim ? () => swimmers : heron ? () => herons : undefined,
      // a goose: the zone its family walks out to, and its unit and place in it
      ashore: swim && ind.ashore ? loc.zones[ind.ashore] : undefined,
      unit: swim && ind.index !== undefined ? unitOf(ind) : undefined,
      ...traits,
      onEvent: (name, x, y, z) => deps.events?.effect?.(name, x, y, z),
    }
    const [sx, sz] = company && zone.kind === 'polygon' ? startSpot(zone, rng, group, company, swimmers)
      : heron && zone.kind === 'polygon' ? heronStart(zone, rng, group, heronFor(ind.species).spacing, herons)
      : zone.kind === 'polygon' ? randomPointInPolygon(zone.points, rng) : [perch![0], perch![2]]
    const controller = BEHAVIORS[ind.behavior as keyof typeof BEHAVIORS](ctx, sx, sz)
    if (swim) swimmers.push(controller)
    if (heron) herons.push(controller)
    // a swimmer floats until its behaviour says otherwise (a goose ashore); every other bird stands
    const pose = defaultPose()
    if (ind.behavior !== 'swim') pose.afloat = 0
    id = deps.registry.add({ species: ind.species, variant: ind.variant, model, behavior: ind.behavior, pose }).id
    object.add(model.group)
    birds.push({ controller, pose, model })
  }

  function unitOf(ind: Individual): { unit: GooseUnit; place: number } {
    if (!units.has(ind.groupKey)) units.set(ind.groupKey, gooseUnits(ind.groups!))
    return placeIn(units.get(ind.groupKey)!, ind.index!)
  }

  for (const fe of flockEntries(loc, rng)) {
    const lane = loc.zones[fe.zone] as LaneZone
    if (!hasSpec(fe.species)) { console.warn(`flock ${fe.species}: no species spec; skipped`); continue }
    const spec = getSpec(fe.species)
    const model = buildFlock(spec, fe.versions ?? Array.from({ length: fe.count }, () => fe.variant))
    model.object.visible = false
    object.add(model.object)
    const controller = createFlyover(lane, makeRng(Math.floor(rng() * 1e9)), {
      count: fe.count, formation: fe.formation, everySeconds: fe.everySeconds, wingbeatHz: spec.wingbeatHz,
      speed: flightFor(fe.species).speed, spacing: flightFor(fe.species).spacing, bouts: flightFor(fe.species).bouts,
    })
    flocks.push({ key: fe.groupKey, species: fe.species, model, controller, pose: defaultPose(), ids: [], proxies: [] })
  }

  function enter(f: LiveFlock): void {
    f.model.object.visible = true
    for (let i = 0; i < f.model.count; i++) {
      // a skinned member is aimed at itself; an instanced one has no model of its own, so a proxy goes where it goes
      const proxy = new THREE.Group()
      const inst = deps.registry.add({
        species: f.species, variant: f.model.variants[i], behavior: 'flyover',
        model: f.model.target(i) ?? { group: proxy, center: new THREE.Vector3(), radius: f.model.radius },
      })
      f.ids.push(inst.id)
      f.proxies.push(proxy)
    }
    deps.events?.flockStart?.(f.key, f.species)
  }

  function exit(f: LiveFlock): void {
    f.model.object.visible = false
    for (const id of f.ids) deps.registry.remove(id)
    f.ids = []
    f.proxies = []
    deps.events?.flockEnd?.(f.key)
  }

  return {
    object,
    update(dt) {
      for (const b of birds) {
        b.controller.update(dt, b.pose)
        // a bird all the way under the water is out of sight, and so out of the targeting candidates
        b.model.group.visible = !b.controller.submerged
        b.model.group.position.set(b.controller.x, b.controller.y, b.controller.z)
        b.model.group.rotation.y = b.controller.heading
        b.model.pose(b.pose)
      }
      for (const f of flocks) {
        const was = f.controller.state
        f.controller.update(dt)
        if (f.controller.state === 'crossing') {
          if (was === 'waiting') enter(f)
          f.pose.wingSpread = 1
          f.pose.neckExtend = flightFor(f.species).neck
          f.pose.lean.set(0, 0, 0)
          f.controller.members.forEach((m, i) => {
            f.pose.wingPhase = m.wingPhase
            f.pose.glide = m.glide
            f.model.setMember(i, m.x, m.y, m.z, m.heading, f.pose)
            const p = f.proxies[i]!
            p.position.set(m.x, m.y, m.z)
            p.updateMatrixWorld()
          })
          f.model.commit()
          deps.events?.flockMove?.(f.key, f.controller.x, f.controller.y, f.controller.z)
        } else if (was === 'crossing') {
          exit(f)
        }
      }
    },
  }
}
