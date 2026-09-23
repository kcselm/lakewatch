import type { Location } from './schema'
import type { Bird } from '../catalog/types'
import { isConvexPolygon } from './zones'

const ZONE_KIND_FOR_BEHAVIOR = {
  swim: 'polygon', wade: 'polygon', probe: 'polygon',
  perch: 'point', hover: 'point', flyover: 'lane',
} as const

export function validateCast(loc: Location, birds: readonly Bird[]): string[] {
  const errors: string[] = []

  for (const [name, zone] of Object.entries(loc.zones)) {
    if (zone.kind === 'polygon' && !isConvexPolygon(zone.points)) errors.push(`zone ${name}: polygon must be convex`)
  }

  const byCode = new Map(birds.map(b => [b.speciesCode, b]))
  loc.cast.forEach((entry, i) => {
    const bird = byCode.get(entry.species)
    if (!bird) {
      errors.push(`cast[${i}]: species ${entry.species} is not in the catalog`)
    } else if (!bird.habitats.includes(loc.habitat)) {
      errors.push(`cast[${i}]: ${entry.species} is not tagged for habitat ${loc.habitat} (has ${bird.habitats.join(', ')})`)
    }
    const zone = loc.zones[entry.zone]
    if (!zone) {
      errors.push(`cast[${i}]: zone ${entry.zone} does not exist`)
      return
    }
    const want = ZONE_KIND_FOR_BEHAVIOR[entry.behavior]
    if (zone.kind !== want) {
      errors.push(`cast[${i}]: ${entry.behavior} needs a ${want} zone, ${entry.zone} is ${zone.kind}`)
    }
  })
  return errors
}

/** Every ambience id the location names must be a layer in the manifest, once. */
export function validateAmbience(loc: Pick<Location, 'ambience'>, layers: readonly { id: string }[]): string[] {
  const known = new Set(layers.map(l => l.id))
  const errors: string[] = []
  const seen = new Set<string>()
  loc.ambience.forEach((id, i) => {
    if (!known.has(id)) errors.push(`ambience[${i}]: layer ${id} is not in data/ambience.json`)
    if (seen.has(id)) errors.push(`ambience[${i}]: layer ${id} is listed twice`)
    seen.add(id)
  })
  return errors
}
