import { SPECIES, getSpec, hasSpec } from './index'
import { buildBird } from '../procedural'
import { loadCatalog } from '../../catalog'

describe('species specs', () => {
  it('include the four milestone-1 birds', () => {
    for (const code of ['y00475', 'mallar3', 'grbher3', 'killde']) expect(hasSpec(code)).toBe(true)
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
