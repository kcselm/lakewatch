import type { Location } from './schema'
import type { Bird } from '../catalog/types'

const ZONE_KIND_FOR_BEHAVIOR = {
  swim: 'polygon', wade: 'polygon', probe: 'polygon',
  perch: 'point', hover: 'point', flyover: 'lane',
} as const

export function validateCast(loc: Location, birds: readonly Bird[]): string[] {
  const errors: string[] = []
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
