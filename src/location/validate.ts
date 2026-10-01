import type { Location } from './schema'
import type { Bird } from '../catalog/types'
import { isConvexPolygon } from './zones'
import { isProbeStyle, isSwimStyle, isWadeStyle, type SpeciesSpec } from '../birds/spec'
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
    // a feeding style belongs to one of swim, probe, and wade, and a species cast on another of them can't use it
    const style = spec?.foraging
    const home = isProbeStyle(style) ? 'probe' : isSwimStyle(style) ? 'swim' : isWadeStyle(style) ? 'wade' : undefined
    const kind = { probe: 'probing', swim: 'swimming', wade: 'wading' } as const
    if (home && entry.behavior !== home && (entry.behavior === 'swim' || entry.behavior === 'probe' || entry.behavior === 'wade')) {
      errors.push(`cast[${i}]: ${entry.species} feeds as a ${style}, a ${kind[home]} style, so it cannot ${entry.behavior}`)
    }
    errors.push(...checkGoose(loc, entry, i, style === 'goose' && entry.behavior === 'swim'))
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

/**
 * The goose style's fields: a goose entry names a polygon zone its family walks out to (`ashore`), and only a goose
 * entry names one or gives `groups`, which add up to its count, the first (the family) a pair and at least one young.
 */
function checkGoose(loc: Location, entry: Location['cast'][number], i: number, goose: boolean): string[] {
  const errors: string[] = []
  if (!goose) {
    if (entry.ashore !== undefined) errors.push(`cast[${i}]: only the goose style goes ashore; ${entry.species} has no use for ${entry.ashore}`)
    if (entry.groups !== undefined) errors.push(`cast[${i}]: only the goose style keeps groups; ${entry.species} swims in one flock`)
    return errors
  }
  if (entry.ashore === undefined) errors.push(`cast[${i}]: ${entry.species} feeds as a goose, so it needs an ashore zone to walk out to`)
  else {
    const zone = loc.zones[entry.ashore]
    if (!zone) errors.push(`cast[${i}]: ashore zone ${entry.ashore} does not exist`)
    else if (zone.kind !== 'polygon') errors.push(`cast[${i}]: ashore needs a polygon zone, ${entry.ashore} is ${zone.kind}`)
  }
  if (entry.groups) {
    const sum = entry.groups.reduce((a, b) => a + b, 0)
    if (sum !== entry.count) errors.push(`cast[${i}]: groups add up to ${sum}, not the count of ${entry.count}`)
    if (entry.groups[0]! < 3) errors.push(`cast[${i}]: the first group is a family, a pair and at least one young, not ${entry.groups[0]}`)
  }
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
