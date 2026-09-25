import * as THREE from 'three'
import type { Location, Behavior, LaneZone, Vec3 } from '../location/schema'
import type { Rng } from '../catalog/types'
import { makeRng } from '../catalog/rng'
import { randomPointInPolygon } from '../location/zones'
import { BEHAVIORS, type BehaviorContext, type BehaviorController } from '../behavior'
import { createFlyover, type Formation, type FlyoverController } from '../behavior/flyover'
import { createBirdModel } from './factory'
import { buildPlaceholder } from './placeholder'
import { buildFlockModel, type FlockModel } from './flock'
import { getSpec, hasSpec } from './species'
import { defaultPose, type PoseState, type BirdModel } from './model'
import type { BirdRegistry } from './registry'
import type { Wind } from '../world/wind'
import type { RippleBuffer } from '../world/ripples'
import type { WorldModule } from '../world/scene'

/** Things the spawner reports outward (audio hooks); every callback is optional. */
export interface SpawnEvents {
  flockStart?(key: string, species: string): void
  flockMove?(key: string, x: number, y: number, z: number): void
  flockEnd?(key: string): void
  effect?(name: 'splash' | 'flap', x: number, y: number, z: number): void
}

export interface SpawnDeps {
  registry: BirdRegistry
  wind: Wind
  ground: (x: number, z: number) => number
  ripples: RippleBuffer
  seed: number
  events?: SpawnEvents
  /** world-space perch points by zone name; point zones not listed here perch at their own position */
  perches?: Record<string, Vec3>
}

export interface Individual { species: string; variant?: string; behavior: Behavior; zone: string; groupKey: string }
export interface FlockEntry { species: string; variant?: string; zone: string; count: number; everySeconds: [number, number]; formation: Formation; groupKey: string }

export const DEFAULT_FLOCK_EVERY: [number, number] = [120, 300]

function pickVariant(species: string, plumage: string | undefined, rng: Rng): string | undefined {
  const variants = hasSpec(species) ? Object.keys(getSpec(species).variants) : []
  if (plumage === 'mixed' && variants.length > 0) return variants[Math.floor(rng() * variants.length)]
  if (plumage && plumage !== 'mixed' && variants.includes(plumage)) return plumage
  return undefined
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
    for (let n = 0; n < entry.count; n++) {
      out.push({ species: entry.species, variant: pickVariant(entry.species, entry.plumage, rng), behavior: entry.behavior, zone: entry.zone, groupKey: `cast${i}` })
    }
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
    })
  })
  return out
}

const STANDING: Behavior[] = ['wade', 'probe']

interface LiveBird { controller: BehaviorController; pose: PoseState; model: BirdModel }
interface LiveFlock {
  key: string; species: string; variant?: string
  model: FlockModel; controller: FlyoverController; pose: PoseState
  /** registry ids and targeting proxies, present only while crossing */
  ids: number[]; proxies: THREE.Group[]
}

export function spawnCast(loc: Location, deps: SpawnDeps): WorldModule & { object: THREE.Group } {
  const object = new THREE.Group()
  const rng = makeRng(deps.seed)
  const groups = new Map<string, NonNullable<BehaviorContext['group']>>()
  const birds: LiveBird[] = []
  const flocks: LiveFlock[] = []

  for (const ind of expandCast(loc, rng)) {
    const zone = loc.zones[ind.zone]!
    const point = zone.kind === 'point'
    const perch: Vec3 | undefined = point ? (deps.perches?.[ind.zone] ?? zone.position) : undefined
    const model = hasSpec(ind.species)
      ? createBirdModel(getSpec(ind.species), ind.variant)
      : buildPlaceholder(ind.species, STANDING.includes(ind.behavior) ? 'standing' : point ? 'perched' : 'swimming')
    if (!groups.has(ind.groupKey)) groups.set(ind.groupKey, { targetX: 0, targetZ: 0, retargetAt: 0 })
    const ctx: BehaviorContext = {
      zone,
      rng: makeRng(Math.floor(rng() * 1e9)),
      wind: () => ({ dirX: deps.wind.state.dir.x, dirZ: deps.wind.state.dir.y, effective: deps.wind.effective() }),
      ground: deps.ground,
      onRipple: (x, z) => deps.ripples.spawn(x, z),
      group: ind.behavior === 'probe' ? groups.get(ind.groupKey) : undefined,
      perch,
      wingbeatHz: hasSpec(ind.species) ? getSpec(ind.species).wingbeatHz : 5,
      onEvent: (name, x, y, z) => deps.events?.effect?.(name, x, y, z),
    }
    const [sx, sz] = zone.kind === 'polygon' ? randomPointInPolygon(zone.points, rng) : [perch![0], perch![2]]
    const controller = BEHAVIORS[ind.behavior as keyof typeof BEHAVIORS](ctx, sx, sz)
    deps.registry.add({ species: ind.species, variant: ind.variant, model, behavior: ind.behavior })
    object.add(model.group)
    birds.push({ controller, pose: defaultPose(), model })
  }

  for (const fe of flockEntries(loc, rng)) {
    const lane = loc.zones[fe.zone] as LaneZone
    if (!hasSpec(fe.species)) { console.warn(`flock ${fe.species}: no species spec; skipped`); continue }
    const spec = getSpec(fe.species)
    const model = buildFlockModel(spec, fe.count, fe.variant)
    model.object.visible = false
    object.add(model.object)
    const controller = createFlyover(lane, makeRng(Math.floor(rng() * 1e9)), {
      count: fe.count, formation: fe.formation, everySeconds: fe.everySeconds, wingbeatHz: spec.wingbeatHz,
    })
    flocks.push({ key: fe.groupKey, species: fe.species, variant: fe.variant, model, controller, pose: defaultPose(), ids: [], proxies: [] })
  }

  function enter(f: LiveFlock): void {
    f.model.object.visible = true
    for (let i = 0; i < f.model.count; i++) {
      const proxy = new THREE.Group()
      const inst = deps.registry.add({
        species: f.species, variant: f.variant, behavior: 'flyover',
        model: { group: proxy, center: new THREE.Vector3(), radius: f.model.radius },
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
          f.pose.neckExtend = 1
          f.pose.lean.set(0, 0, 0)
          f.controller.members.forEach((m, i) => {
            f.pose.wingPhase = m.wingPhase
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
