import type { BehaviorContext } from './types'
import { randomPointInPolygon, clampToPolygon, pointInPolygon } from '../location/zones'
import type { PolygonZone } from '../location/schema'

/** How a flock holds together: its birds keep within `radius` of a target that moves on every `retargetSeconds`. */
export interface FlockSettings {
  radius: number
  retargetSeconds: number
  /** at most this many metres each time the target moves on; unset, it moves anywhere in the zone */
  drift?: number
}

/**
 * A flock's shared target, which moves on now and then (anywhere in the zone, or, with `drift`, at most that many
 * metres), and spots near it for one bird. A target outside the zone (the spawner seeds a probing flock's target at
 * the vantage) goes straight to a point in it: the drift is how a flock moves on within its patch, not how it finds
 * the patch.
 */
export function createFlock(ctx: BehaviorContext, zone: PolygonZone, x: number, z: number, settings: FlockSettings) {
  const group = ctx.group ?? { targetX: x, targetZ: z, retargetAt: Infinity }
  return {
    group,
    /** a spot within `radius` of the shared target, moving the target on first if it is due */
    near(clock: number): [number, number] {
      if (clock >= group.retargetAt) {
        const [px, pz] = randomPointInPolygon(zone.points, ctx.rng)
        const d = Math.hypot(px - group.targetX, pz - group.targetZ)
        if (settings.drift === undefined || d <= settings.drift || !pointInPolygon(group.targetX, group.targetZ, zone.points)) {
          ;[group.targetX, group.targetZ] = [px, pz]
        } else {
          const k = settings.drift / d
          ;[group.targetX, group.targetZ] = [group.targetX + (px - group.targetX) * k, group.targetZ + (pz - group.targetZ) * k]
        }
        group.retargetAt = clock + settings.retargetSeconds
      }
      const a = ctx.rng() * Math.PI * 2, r = ctx.rng() * settings.radius
      return clampToPolygon(group.targetX + Math.cos(a) * r, group.targetZ + Math.sin(a) * r, zone.points)
    },
    /** how far (px, pz) is from the shared target */
    distance(px: number, pz: number): number { return Math.hypot(group.targetX - px, group.targetZ - pz) },
  }
}
