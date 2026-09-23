import { guideSpecies } from './guideSpecies'
import { loadCatalog } from '../catalog'

describe('guideSpecies', () => {
  it('lists only wetland-tagged species, sorted by family then name', () => {
    const out = guideSpecies(loadCatalog(), 'wetland')
    expect(out.length).toBeGreaterThan(20)
    expect(out.every(b => b.habitats.includes('wetland'))).toBe(true)
    for (let i = 1; i < out.length; i++) {
      const a = out[i - 1]!, b = out[i]!
      expect(a.familyCommon < b.familyCommon || (a.familyCommon === b.familyCommon && a.commonName <= b.commonName)).toBe(true)
    }
  })
})
