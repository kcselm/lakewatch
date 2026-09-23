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
  it('rejects wind strength outside 0..1', () => {
    const bad = { ...base, wind: { ...base.wind, strength: 1.5 } }
    expect(() => parseLocation(bad)).toThrow()
  })
})
