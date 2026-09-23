import { parseSpeciesSpec, resolvePlumage } from './spec'
import { SPEC as coot } from './species/amecoo'

describe('parseSpeciesSpec', () => {
  it('accepts the coot spec', () => {
    expect(parseSpeciesSpec(coot).code).toBe('y00475')
  })
  it('rejects a plumage color that is not hex', () => {
    const bad = { ...coot, plumage: { ...coot.plumage, crown: 'black' } }
    expect(() => parseSpeciesSpec(bad)).toThrow(/crown/)
  })
  it('requires every field mark', () => {
    const { legs: _drop, ...marks } = coot.marks
    expect(() => parseSpeciesSpec({ ...coot, marks })).toThrow(/legs/)
  })
})

describe('resolvePlumage', () => {
  it('overlays a variant onto the base plumage', () => {
    const spec = parseSpeciesSpec({ ...coot, variants: { pale: { crown: '#ffffff' } } })
    expect(resolvePlumage(spec, 'pale').crown).toBe('#ffffff')
    expect(resolvePlumage(spec, 'pale').bill).toBe(coot.plumage.bill)
    expect(resolvePlumage(spec).crown).toBe(coot.plumage.crown)
  })
  it('throws on an unknown variant', () => {
    expect(() => resolvePlumage(parseSpeciesSpec(coot), 'nope')).toThrow(/variant/)
  })
})
