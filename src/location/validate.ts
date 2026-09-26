import type { Location } from './schema'
import type { Bird } from '../catalog/types'
import { isConvexPolygon } from './zones'
import type { SpeciesSpec } from '../birds/spec'
import { SPECIES } from '../birds/species'

/** What validateCast reads from each species' spec: its plumage versions, and how it feeds. */
export type CastSpecs = Readonly<Record<string, Pick<SpeciesSpec, 'variants' | 'foraging'>>>

const ZONE_KIND_FOR_BEHAVIOR = {
  swim: 'polygon', wade: 'polygon', probe: 'polygon',
  perch: 'point', hover: 'point', flyover: 'lane',
} as const

export function validateCast(loc: Location, birds: readonly Bird[], specs: CastSpecs = SPECIES): string[] {
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
    const spec = Object.hasOwn(specs, entry.species) ? specs[entry.species] : undefined
    if (typeof entry.plumage === 'object') errors.push(...checkCounts(entry, i, spec))
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

/** Plumage given as counts per version: each a version the species has, each a whole number, adding up to the count. */
function checkCounts(entry: Location['cast'][number], i: number, spec: CastSpecs[string] | undefined): string[] {
  const counts = entry.plumage as Record<string, number>
  if (entry.behavior === 'flyover') return [`cast[${i}]: a flyover flock is one version; give plumage as a single version, not counts`]
  const errors: string[] = []
  const versions = spec ? Object.keys(spec.variants) : []
  let sum = 0
  for (const [version, n] of Object.entries(counts)) {
    if (!versions.includes(version)) errors.push(`cast[${i}]: ${entry.species} has no plumage version ${version}`)
    if (!Number.isInteger(n) || n < 1) errors.push(`cast[${i}]: plumage count for ${version} must be a whole number of birds, not ${n}`)
    else sum += n
  }
  if (errors.length === 0 && sum !== entry.count) errors.push(`cast[${i}]: plumage counts add up to ${sum}, not the count of ${entry.count}`)
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
