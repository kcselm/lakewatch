import { validateCast } from './validate'
import type { Location } from './schema'
import type { Bird } from '../catalog/types'

const bird = (code: string, habitats: Bird['habitats']): Bird => ({
  speciesCode: code, commonName: code, scientificName: code, family: 'F', familyCommon: 'F',
  habitats, frequency: 0.5, monthly: Array(12).fill(0.5), audio: [], photo: null,
})

const loc: Location = {
  id: 'l', name: 'L', region: '', habitat: 'wetland', season: 'early-autumn', timeOfDay: 'morning',
  vantage: { position: [0, 1.6, 0], heading: 0 },
  wind: { direction: 0, strength: 0.3, gustiness: 0.5 },
  zones: { water: { kind: 'polygon', points: [[0, 0], [1, 0], [1, 1]] } },
  cast: [{ species: 'y00475', behavior: 'swim', zone: 'water', count: 2 }],
  ambience: [],
}

describe('validateCast', () => {
  it('passes when every species is tagged for the habitat and zones exist', () => {
    expect(validateCast(loc, [bird('y00475', ['wetland'])])).toEqual([])
  })
  it('names a species not in the catalog', () => {
    expect(validateCast(loc, [])).toEqual(['cast[0]: species y00475 is not in the catalog'])
  })
  it('names a species tagged only for another habitat', () => {
    expect(validateCast(loc, [bird('y00475', ['shoreline'])])).toEqual([
      'cast[0]: y00475 is not tagged for habitat wetland (has shoreline)',
    ])
  })
  it('names a missing zone', () => {
    const bad = { ...loc, cast: [{ ...loc.cast[0]!, zone: 'reeds' }] }
    expect(validateCast(bad, [bird('y00475', ['wetland'])])).toEqual(['cast[0]: zone reeds does not exist'])
  })
  it('requires flyover entries to use a lane zone', () => {
    const bad = { ...loc, cast: [{ ...loc.cast[0]!, behavior: 'flyover' as const }] }
    expect(validateCast(bad, [bird('y00475', ['wetland'])])).toEqual(['cast[0]: flyover needs a lane zone, water is polygon'])
  })
})

import { loadLocation } from './index'

describe('lake.json', () => {
  it('parses and passes the habitat cast check against the real catalog', () => {
    const loc = loadLocation()
    expect(loc.id).toBe('willow-lake')
    expect(loc.cast.length).toBeGreaterThan(0)
  })
})
