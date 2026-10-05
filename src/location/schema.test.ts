import { parseLocation } from './schema'

const base = {
  id: 'test', name: 'Test', region: 'Nowhere', habitat: 'wetland',
  season: 'early-autumn', timeOfDay: 'morning',
  vantage: { position: [0, 1.6, 0], heading: 20 },
  wind: { direction: 240, strength: 0.35, gustiness: 0.5 },
  zones: {
    water: { kind: 'polygon', points: [[-10, -10], [10, -10], [10, 10], [-10, 10]] },
    snag: { kind: 'point', position: [5, 0, -30] },
    sky: { kind: 'lane', from: [-100, 0, -50], to: [100, 0, -50], altitude: [40, 80] },
  },
  cast: [{ species: 'y00475', behavior: 'swim', zone: 'water', count: 3 }],
  ambience: [],
}

describe('parseLocation', () => {
  it('accepts a valid location', () => {
    expect(parseLocation(base).id).toBe('test')
  })
  it('rejects a polygon zone with fewer than three points', () => {
    const bad = { ...base, zones: { ...base.zones, water: { kind: 'polygon', points: [[0, 0], [1, 1]] } } }
    expect(() => parseLocation(bad)).toThrow(/points/)
  })
  it('rejects an unknown behavior', () => {
    const bad = { ...base, cast: [{ ...base.cast[0], behavior: 'dance' }] }
    expect(() => parseLocation(bad)).toThrow()
  })
  it('rejects a count below one', () => {
    const bad = { ...base, cast: [{ ...base.cast[0], count: 0 }] }
    expect(() => parseLocation(bad)).toThrow()
  })
  it('takes plumage as one version, mixed, or a count of birds for each version', () => {
    for (const plumage of ['male', 'mixed', { male: 1, female: 2 }]) {
      expect(parseLocation({ ...base, cast: [{ ...base.cast[0], plumage }] }).cast[0]!.plumage).toEqual(plumage)
    }
  })
  it('rejects a version count that is not a whole number of birds', () => {
    for (const plumage of [{ male: 1.5 }, { male: 0 }, { male: -1 }, { male: 'two' }, ['male']]) {
      expect(() => parseLocation({ ...base, cast: [{ ...base.cast[0], plumage }] }), JSON.stringify(plumage)).toThrow(/plumage/)
    }
  })
  describe('a perches zone', () => {
    const snag = { name: 'snag', on: 'snag', position: [23.7, -48], height: 4.1, radius: 0.05, facing: 180 }
    const near = { name: 'near', on: 'branch', position: [-27, -17], height: 2.6, radius: 0.018, facing: 33 }
    const withPerches = (perches: unknown[]) => ({ ...base, zones: { ...base.zones, perches: { kind: 'perches', perches } } })
    it('takes named perches, each with its point, height, radius, facing, and what it is on', () => {
      const zone = parseLocation(withPerches([snag, near])).zones['perches']
      expect(zone).toEqual({ kind: 'perches', perches: [snag, near] })
    })
    it('rejects an empty list', () => {
      expect(() => parseLocation(withPerches([]))).toThrow(/at least one perch/)
    })
    it('rejects a perch with no height or radius, a facing outside 0..360, or on something unknown', () => {
      for (const bad of [{ height: 0 }, { radius: -0.01 }, { facing: 360 }, { facing: -10 }, { on: 'post' }, { name: '' }]) {
        expect(() => parseLocation(withPerches([{ ...near, ...bad }])), JSON.stringify(bad)).toThrow()
      }
    })
  })
  it('rejects wind strength outside 0..1', () => {
    const bad = { ...base, wind: { ...base.wind, strength: 1.5 } }
    expect(() => parseLocation(bad)).toThrow()
  })
})
