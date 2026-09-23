import raw from '../../data/locations/lake.json'
import { parseLocation, type Location } from './schema'
import { validateCast } from './validate'
import { loadCatalog } from '../catalog'

export function loadLocation(): Location {
  const loc = parseLocation(raw)
  const errors = validateCast(loc, loadCatalog())
  if (errors.length > 0) throw new Error(`Invalid location ${loc.id}:\n  ${errors.join('\n  ')}`)
  return loc
}

export * from './schema'
export { validateCast } from './validate'
