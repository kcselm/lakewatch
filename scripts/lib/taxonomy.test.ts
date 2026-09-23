import { describe, it, expect } from 'vitest'
import { enrich } from './taxonomy'

const MONTHLY = Array(12).fill(0.5)
const cand = (speciesCode: string, over = {}) =>
  ({ speciesCode, habitats: ['urban'], frequency: 0.9, monthly: MONTHLY, ...over })

const taxa = [
  { speciesCode: 'sonspa', comName: 'Song Sparrow', sciName: 'Melospiza melodia',
    category: 'species', familyComName: 'New World Sparrows', familySciName: 'Passerellidae' },
  { speciesCode: 'gull1', comName: 'gull sp.', sciName: 'Larinae sp.',
    category: 'spuh', familyComName: 'Gulls, Terns, and Skimmers', familySciName: 'Laridae' },
]

describe('enrich', () => {
  it('joins candidates to taxonomy', () => {
    const { species } = enrich([cand('sonspa')], taxa, {})
    expect(species[0]).toEqual({
      speciesCode: 'sonspa', commonName: 'Song Sparrow', scientificName: 'Melospiza melodia',
      family: 'Passerellidae', familyCommon: 'New World Sparrows',
      habitats: ['urban'], frequency: 0.9, monthly: MONTHLY,
    })
  })

  it('applies a scientific name override', () => {
    const { species } = enrich([cand('sonspa')], taxa, { sonspa: 'Melospiza melodia morphna' })
    expect(species[0]!.scientificName).toBe('Melospiza melodia morphna')
  })

  it('drops candidates with no taxonomy match and reports them', () => {
    const out = enrich([cand('ghost')], taxa, {})
    expect(out.species).toEqual([])
    expect(out.dropped).toEqual(['ghost (no taxonomy match)'])
  })

  it('drops non-species categories and reports them', () => {
    const out = enrich([cand('gull1'), cand('sonspa')], taxa, {})
    expect(out.species.map(s => s.speciesCode)).toEqual(['sonspa'])
    expect(out.dropped).toEqual(['gull1 (spuh: gull sp.)'])
  })

  it('preserves habitats, frequency, and monthly verbatim', () => {
    const monthly = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]
    const { species } = enrich(
      [cand('sonspa', { habitats: ['urban', 'wetland'], frequency: 0.42, monthly })], taxa, {},
    )
    expect(species[0]!.habitats).toEqual(['urban', 'wetland'])
    expect(species[0]!.frequency).toBe(0.42)
    expect(species[0]!.monthly).toEqual(monthly)
  })
})
