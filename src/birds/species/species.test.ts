import { SPECIES, getSpec, hasSpec } from './index'
import { buildBird } from '../procedural'
import { loadCatalog } from '../../catalog'
import { loadLocation } from '../../location'

describe('species specs', () => {
  it('has a spec for every species the lake casts', () => {
    for (const entry of loadLocation().cast) expect(hasSpec(entry.species), entry.species).toBe(true)
  })
  it('has specs for the birds that arrive with flyover, perch, and hover', () => {
    for (const code of ['cangoo', 'belkin1', 'rewbla', 'marwre']) expect(hasSpec(code), code).toBe(true)
  })
  it('every mark is a non-empty sentence fragment', () => {
    for (const spec of Object.values(SPECIES)) for (const [k, m] of Object.entries(spec.marks)) expect(m.length, `${spec.code}.${k}`).toBeGreaterThan(8)
  })
  it('every spec code exists in the catalog with the same common name', () => {
    const catalog = loadCatalog()
    for (const spec of Object.values(SPECIES)) {
      const bird = catalog.find(b => b.speciesCode === spec.code)
      expect(bird, spec.code).toBeDefined()
      expect(bird!.commonName).toBe(spec.commonName)
    }
  })
  it('every spec and variant builds without throwing', () => {
    for (const spec of Object.values(SPECIES)) {
      expect(() => buildBird(spec)).not.toThrow()
      for (const v of Object.keys(spec.variants)) expect(() => buildBird(spec, v)).not.toThrow()
    }
  })
  it('mallard has male and female variants', () => {
    expect(Object.keys(getSpec('mallar3').variants).sort()).toEqual(['female', 'male'])
  })
  it('heron stands taller than it is long', () => {
    const h = getSpec('grbher3')
    expect(h.legs.length + h.neck.length).toBeGreaterThan(h.body.length)
  })
})
