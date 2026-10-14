import { validateCast, validateAmbience } from './validate'
import { parseLocation, type Location, type CastEntry } from './schema'
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
  describe('perches', () => {
    const catalog = [bird('belkin1', ['wetland']), bird('rewbla', ['wetland'])]
    const perch = (name: string, on: 'snag' | 'branch' = 'branch') => ({ name, on, position: [0, -5] as [number, number], height: 3, radius: 0.02, facing: 0 })
    const withPerches = (perches: ReturnType<typeof perch>[], extra: Location['zones'] = {}, cast: Location['cast'] = [{ species: 'belkin1', behavior: 'kingfisher', zone: 'perches', count: 1 }]): Location => ({
      ...loc, zones: { ...loc.zones, ...extra, perches: { kind: 'perches', perches } }, cast,
    })
    it('passes a kingfisher on a perches zone', () => {
      expect(validateCast(withPerches([perch('near'), perch('far')]), catalog)).toEqual([])
    })
    it('requires kingfisher to use a perches zone, and perch a point zone', () => {
      const onPoint = withPerches([perch('near')], { reed: { kind: 'point', position: [0, 2, 0] } }, [
        { species: 'belkin1', behavior: 'kingfisher', zone: 'reed', count: 1 },
        { species: 'rewbla', behavior: 'perch', zone: 'perches', count: 1 },
      ])
      expect(validateCast(onPoint, catalog)).toEqual([
        'cast[0]: kingfisher needs a perches zone, reed is point',
        'cast[1]: perch needs a point zone, perches is perches',
      ])
    })
    it('names a perch given twice', () => {
      expect(validateCast(withPerches([perch('near'), perch('far'), perch('near')]), catalog)).toEqual(['zone perches: perch near is listed twice'])
    })
    it('needs a snag for a perch on it', () => {
      expect(validateCast(withPerches([perch('snag', 'snag')]), catalog)).toEqual(['zone perches: perch snag is on the snag, but there is no snag point zone'])
      expect(validateCast(withPerches([perch('snag', 'snag')], { snag: { kind: 'point', position: [0, 0, -5] } }), catalog)).toEqual([])
    })
  })
  it('rejects a concave polygon zone', () => {
    const bad = { ...loc, zones: { water: { kind: 'polygon' as const, points: [[0, 0], [4, 0], [4, 1], [1, 1], [1, 4], [0, 4]] as [number, number][] } } }
    expect(validateCast(bad, [bird('y00475', ['wetland'])])).toEqual(['zone water: polygon must be convex'])
  })
  it('rejects a probing style on a swimmer and a swimming style on a prober', () => {
    const specs = { killde: { variants: {}, foraging: 'plover' as const }, pibgre: { variants: {}, foraging: 'grebe' as const } }
    const catalog = [bird('killde', ['wetland']), bird('pibgre', ['wetland'])]
    const one = (species: string, behavior: 'swim' | 'probe'): Location => ({ ...loc, cast: [{ species, behavior, zone: 'water', count: 1 }] })
    expect(validateCast(one('killde', 'swim'), catalog, specs)).toEqual(['cast[0]: killde feeds as a plover, a probing style, so it cannot swim'])
    expect(validateCast(one('pibgre', 'probe'), catalog, specs)).toEqual(['cast[0]: pibgre feeds as a grebe, a swimming style, so it cannot probe'])
    expect(validateCast(one('killde', 'probe'), catalog, specs)).toEqual([])
    expect(validateCast(one('pibgre', 'swim'), catalog, specs)).toEqual([])
  })
  it('rejects a wading style anywhere but wade, and a probing or swimming style on wade', () => {
    const specs = { grbher3: { variants: {}, foraging: 'heron' as const }, killde: { variants: {}, foraging: 'plover' as const }, greyel: { variants: {} } }
    const catalog = [bird('grbher3', ['wetland']), bird('killde', ['wetland']), bird('greyel', ['wetland'])]
    const one = (species: string, behavior: 'swim' | 'probe' | 'wade'): Location => ({ ...loc, cast: [{ species, behavior, zone: 'water', count: 1 }] })
    expect(validateCast(one('grbher3', 'swim'), catalog, specs)).toEqual(['cast[0]: grbher3 feeds as a heron, a wading style, so it cannot swim'])
    expect(validateCast(one('grbher3', 'probe'), catalog, specs)).toEqual(['cast[0]: grbher3 feeds as a heron, a wading style, so it cannot probe'])
    expect(validateCast(one('killde', 'wade'), catalog, specs)).toEqual(['cast[0]: killde feeds as a plover, a probing style, so it cannot wade'])
    expect(validateCast(one('grbher3', 'wade'), catalog, specs)).toEqual([])
    // a wader with no style wades as wade always has
    expect(validateCast(one('greyel', 'wade'), catalog, specs)).toEqual([])
  })
  describe('the goose style', () => {
    const specs = { cangoo: { variants: {}, foraging: 'goose' as const }, mallar3: { variants: {}, foraging: 'dabbler' as const } }
    const catalog = [bird('cangoo', ['wetland']), bird('mallar3', ['wetland'])]
    const one = (entry: Partial<CastEntry>): Location => ({
      ...loc,
      zones: { ...loc.zones, flat: { kind: 'polygon', points: [[2, 0], [3, 0], [3, 1]] }, snag: { kind: 'point', position: [0, 0, 0] } },
      cast: [{ species: 'cangoo', behavior: 'swim', zone: 'water', count: 8, ashore: 'flat', groups: [5, 3], ...entry }],
    })
    it('passes a goose entry with a polygon to walk out to and groups that add up to its count', () => {
      expect(validateCast(one({}), catalog, specs)).toEqual([])
      expect(validateCast(one({ groups: undefined }), catalog, specs)).toEqual([])
    })
    it('needs a goose entry to name an ashore polygon that exists', () => {
      expect(validateCast(one({ ashore: undefined }), catalog, specs)).toEqual(['cast[0]: cangoo feeds as a goose, so it needs an ashore zone to walk out to'])
      expect(validateCast(one({ ashore: 'meadow' }), catalog, specs)).toEqual(['cast[0]: ashore zone meadow does not exist'])
      expect(validateCast(one({ ashore: 'snag' }), catalog, specs)).toEqual(['cast[0]: ashore needs a polygon zone, snag is point'])
    })
    it('needs groups to add up to the count, the first a family', () => {
      expect(validateCast(one({ groups: [5, 2] }), catalog, specs)).toEqual(['cast[0]: groups add up to 7, not the count of 8'])
      expect(validateCast(one({ groups: [2, 6] }), catalog, specs)).toEqual(['cast[0]: the first group is a family, a pair and at least one young, not 2'])
    })
    it('lets no other style go ashore or keep groups', () => {
      expect(validateCast(one({ species: 'mallar3', count: 8 }), catalog, specs)).toEqual([
        'cast[0]: only the goose style goes ashore; mallar3 has no use for flat',
        'cast[0]: only the goose style keeps groups; mallar3 swims in one flock',
      ])
    })
  })
  describe('plumage counts', () => {
    const catalog = [bird('mallar3', ['wetland']), bird('y00475', ['wetland']), bird('rewbla', ['wetland'])]
    const one = (entry: Partial<CastEntry>): Location => ({
      ...loc,
      zones: { ...loc.zones, sky: { kind: 'lane', from: [0, 0, 0], to: [1, 0, 0], altitude: [1, 2] } },
      cast: [{ species: 'mallar3', behavior: 'swim', zone: 'water', count: 3, ...entry }],
    })
    it("passes counts that name the species' versions and add up to the entry's count", () => {
      expect(validateCast(one({ plumage: { male: 1, female: 2 } }), catalog)).toEqual([])
    })
    it('names a version the species does not have', () => {
      expect(validateCast(one({ plumage: { male: 1, eclipse: 2 } }), catalog)).toEqual(['cast[0]: mallar3 has no plumage version eclipse'])
    })
    it('names counts that do not add up to the count', () => {
      expect(validateCast(one({ plumage: { male: 1, female: 1 } }), catalog)).toEqual(['cast[0]: plumage counts add up to 2, not the count of 3'])
    })
    it('rejects counts on a flyover of block birds: that flock is instances of one bird, in one version', () => {
      const block = { mallar3: { variants: { male: {}, female: {} } } }
      expect(validateCast(one({ behavior: 'flyover', zone: 'sky', plumage: { male: 1, female: 2 } }), catalog, block)).toEqual([
        'cast[0]: a flyover flock of block birds is one version; give plumage as a single version, not counts',
      ])
    })
    it('takes counts on a flyover of a detailed species, whose flock is a bird a member, and checks them as any others', () => {
      expect(validateCast(one({ behavior: 'flyover', zone: 'sky', plumage: { male: 1, female: 2 } }), catalog)).toEqual([])
      expect(validateCast(one({ behavior: 'flyover', zone: 'sky', plumage: { male: 1, female: 1 } }), catalog)).toEqual(['cast[0]: plumage counts add up to 2, not the count of 3'])
    })
    it('reports a malformed record without throwing: no versions, a species with none, a count that is not a number', () => {
      expect(validateCast(one({ plumage: {} }), catalog)).toEqual(['cast[0]: plumage counts add up to 0, not the count of 3'])
      expect(validateCast(one({ species: 'rewbla', plumage: { adult: 3 } }), catalog)).toEqual(['cast[0]: rewbla has no plumage version adult'])
      expect(validateCast(one({ species: 'nosuchbird', plumage: { male: 3 } }), catalog)).toEqual([
        'cast[0]: species nosuchbird is not in the catalog',
        'cast[0]: nosuchbird has no plumage version male',
      ])
      // a hand-built location skips the schema, so the counts themselves are checked too
      const bad = one({ plumage: { male: Number.NaN, female: 3 } as unknown as Record<string, number> })
      expect(() => validateCast(bad, catalog)).not.toThrow()
      expect(validateCast(bad, catalog)).toEqual(['cast[0]: plumage count for male must be a whole number of birds, not NaN'])
    })
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
