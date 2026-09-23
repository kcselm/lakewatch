import { validateCast, validateAmbience } from './validate'
import { parseLocation, type Location } from './schema'
import type { Bird } from '../catalog/types'
import { loadAmbience } from '../audio/ambienceManifest'
import lakeRaw from '../../data/locations/lake.json'

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
  it('rejects a concave polygon zone', () => {
    const bad = { ...loc, zones: { water: { kind: 'polygon' as const, points: [[0, 0], [4, 0], [4, 1], [1, 1], [1, 4], [0, 4]] as [number, number][] } } }
    expect(validateCast(bad, [bird('y00475', ['wetland'])])).toEqual(['zone water: polygon must be convex'])
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

describe('validateAmbience', () => {
  const layers = [{ id: 'wind-reeds' }, { id: 'water-lapping' }]
  it('passes when every id is in the manifest', () => {
    expect(validateAmbience({ ambience: ['wind-reeds'] }, layers)).toEqual([])
  })
  it('names an id the manifest does not define', () => {
    expect(validateAmbience({ ambience: ['wind-reeds', 'thunder'] }, layers)).toEqual(['ambience[1]: layer thunder is not in data/ambience.json'])
  })
  it('rejects a layer listed twice', () => {
    expect(validateAmbience({ ambience: ['wind-reeds', 'wind-reeds'] }, layers)).toEqual(['ambience[1]: layer wind-reeds is listed twice'])
  })
  it('the lake only names layers the committed manifest defines', () => {
    expect(validateAmbience(parseLocation(lakeRaw), loadAmbience())).toEqual([])
  })
})
