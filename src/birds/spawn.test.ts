import { expandCast } from './spawn'
import { makeRng } from '../catalog/rng'
import type { Location } from '../location/schema'

const loc = (cast: Location['cast']): Location => ({
  id: 'l', name: 'L', region: '', habitat: 'wetland', season: 'early-autumn', timeOfDay: 'morning',
  vantage: { position: [0, 1.6, 0], heading: 0 }, wind: { direction: 0, strength: 0.3, gustiness: 0.5 },
  zones: { w: { kind: 'polygon', points: [[0, 0], [1, 0], [1, 1]] }, sky: { kind: 'lane', from: [0, 0, 0], to: [1, 0, 0], altitude: [1, 2] } },
  cast, ambience: [],
})

describe('expandCast', () => {
  it('expands count into individuals', () => {
    const out = expandCast(loc([{ species: 'y00475', behavior: 'swim', zone: 'w', count: 3 }]), makeRng(1))
    expect(out).toHaveLength(3)
    expect(out.every(b => b.species === 'y00475' && b.variant === undefined)).toBe(true)
  })
  it('assigns male and female variants for mixed plumage', () => {
    const out = expandCast(loc([{ species: 'mallar3', behavior: 'swim', zone: 'w', count: 20, plumage: 'mixed' }]), makeRng(2))
    const variants = new Set(out.map(b => b.variant))
    expect(variants).toEqual(new Set(['male', 'female']))
  })
  it('uses the named variant when plumage is not mixed', () => {
    const out = expandCast(loc([{ species: 'mallar3', behavior: 'swim', zone: 'w', count: 2, plumage: 'female' }]), makeRng(3))
    expect(out.every(b => b.variant === 'female')).toBe(true)
  })
  it('skips behaviors that are not implemented yet', () => {
    const out = expandCast(loc([{ species: 'y00475', behavior: 'flyover', zone: 'sky', count: 5 }]), makeRng(4))
    expect(out).toEqual([])
  })
  it('gives each probe entry its own group key', () => {
    const out = expandCast(loc([
      { species: 'killde', behavior: 'probe', zone: 'w', count: 2 },
      { species: 'killde', behavior: 'probe', zone: 'w', count: 2 },
    ]), makeRng(5))
    expect(new Set(out.map(b => b.groupKey)).size).toBe(2)
  })
})
