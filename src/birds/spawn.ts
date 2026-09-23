import * as THREE from 'three'
import type { Location, Behavior, PolygonZone } from '../location/schema'
import type { Rng } from '../catalog/types'
import { makeRng } from '../catalog/rng'
import { randomPointInPolygon } from '../location/zones'
import { BEHAVIORS, type BehaviorContext, type BehaviorController } from '../behavior'
import { buildBird } from './procedural'
import { buildPlaceholder } from './placeholder'
import { getSpec, hasSpec } from './species'
import { defaultPose, type PoseState } from './model'
import type { BirdRegistry } from './registry'
import type { Wind } from '../world/wind'
import type { RippleBuffer } from '../world/ripples'
import type { WorldModule } from '../world/scene'

export interface SpawnDeps {
  registry: BirdRegistry
  wind: Wind
  ground: (x: number, z: number) => number
  ripples: RippleBuffer
  seed: number
}

export interface Individual { species: string; variant?: string; behavior: Behavior; zone: string; groupKey: string }

export function expandCast(loc: Location, rng: Rng): Individual[] {
  const out: Individual[] = []
  loc.cast.forEach((entry, i) => {
    if (!(entry.behavior in BEHAVIORS)) {
      console.warn(`cast[${i}] ${entry.species}: behavior ${entry.behavior} is not implemented yet; skipped`)
      return
    }
    const variants = hasSpec(entry.species) ? Object.keys(getSpec(entry.species).variants) : []
    for (let n = 0; n < entry.count; n++) {
      let variant: string | undefined
      if (entry.plumage === 'mixed' && variants.length > 0) variant = variants[Math.floor(rng() * variants.length)]
      else if (entry.plumage && entry.plumage !== 'mixed' && variants.includes(entry.plumage)) variant = entry.plumage
      out.push({ species: entry.species, variant, behavior: entry.behavior, zone: entry.zone, groupKey: `cast${i}` })
    }
  })
  return out
}

const STANDING: Behavior[] = ['wade', 'probe']

export function spawnCast(loc: Location, deps: SpawnDeps): WorldModule & { object: THREE.Group } {
  const object = new THREE.Group()
  const rng = makeRng(deps.seed)
  const groups = new Map<string, NonNullable<BehaviorContext['group']>>()
  const live: { controller: BehaviorController; pose: PoseState; model: ReturnType<typeof buildBird>; wingHz: number; phase: number }[] = []

  for (const ind of expandCast(loc, rng)) {
    const zone = loc.zones[ind.zone] as PolygonZone
    const model = hasSpec(ind.species)
      ? buildBird(getSpec(ind.species), ind.variant)
      : buildPlaceholder(ind.species, STANDING.includes(ind.behavior) ? 'standing' : 'swimming')
    if (!groups.has(ind.groupKey)) groups.set(ind.groupKey, { targetX: 0, targetZ: 0, retargetAt: 0 })
    const ctx: BehaviorContext = {
      zone,
      rng: makeRng(Math.floor(rng() * 1e9)),
      wind: () => ({ dirX: deps.wind.state.dir.x, dirZ: deps.wind.state.dir.y, effective: deps.wind.effective() }),
      ground: deps.ground,
      onRipple: (x, z) => deps.ripples.spawn(x, z),
      group: ind.behavior === 'probe' ? groups.get(ind.groupKey) : undefined,
    }
    const [sx, sz] = randomPointInPolygon(zone.points, rng)
    const controller = BEHAVIORS[ind.behavior as keyof typeof BEHAVIORS](ctx, sx, sz)
    deps.registry.add({ species: ind.species, variant: ind.variant, model, behavior: ind.behavior })
    object.add(model.group)
    live.push({ controller, pose: defaultPose(), model, wingHz: hasSpec(ind.species) ? getSpec(ind.species).wingbeatHz : 5, phase: rng() })
  }

  return {
    object,
    update(dt) {
      for (const b of live) {
        b.controller.update(dt, b.pose)
        b.model.group.position.set(b.controller.x, b.controller.y, b.controller.z)
        b.model.group.rotation.y = b.controller.heading
        b.model.pose(b.pose)
      }
    },
  }
}
