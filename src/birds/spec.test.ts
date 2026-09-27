import { parseSpeciesSpec, resolvePlumage } from './spec'
import { SPEC as coot } from './species/amecoo'
import { SPEC as killdeer } from './species/killde'

describe('parseSpeciesSpec', () => {
  it('accepts the coot spec', () => {
    expect(parseSpeciesSpec(coot).code).toBe('y00475')
  })
  it('rejects a plumage color that is not hex', () => {
    const bad = { ...coot, plumage: { ...coot.plumage, crown: 'black' } }
    expect(() => parseSpeciesSpec(bad)).toThrow(/crown/)
  })
  it('takes a foraging style, and rejects one it does not know', () => {
    expect(parseSpeciesSpec({ ...coot, foraging: 'plover' }).foraging).toBe('plover')
    expect(parseSpeciesSpec({ ...coot, foraging: 'dowitcher' }).foraging).toBe('dowitcher')
    for (const style of ['dabbler', 'shoveler', 'coot', 'grebe'] as const) expect(parseSpeciesSpec({ ...coot, foraging: style }).foraging).toBe(style)
    expect(parseSpeciesSpec({ ...coot, foraging: undefined }).foraging).toBeUndefined()
    expect(() => parseSpeciesSpec({ ...coot, foraging: 'heron' })).toThrow(/foraging/)
  })
  it('requires every field mark', () => {
    const { legs: _drop, ...marks } = coot.marks
    expect(() => parseSpeciesSpec({ ...coot, marks })).toThrow(/legs/)
  })
  it('rejects a detail block the builder would refuse, naming the species: a swimmer with no waterline, a percher', () => {
    expect(() => parseSpeciesSpec({ ...coot, detail: { ...coot.detail!, float: undefined } })).toThrow(/y00475.*detail\.float/)
    expect(() => parseSpeciesSpec({ ...killdeer, posture: 'perched' })).toThrow(/killde.*perched/)
    // with no detail block, either posture is the block builder's, as ever
    expect(parseSpeciesSpec({ ...killdeer, posture: 'perched', detail: undefined }).posture).toBe('perched')
    expect(parseSpeciesSpec({ ...coot, detail: undefined }).posture).toBe('swimming')
  })
})

describe('resolvePlumage', () => {
  it('overlays a variant onto the base plumage', () => {
    const spec = parseSpeciesSpec({ ...coot, variants: { ...coot.variants, pale: { crown: '#ffffff' } } })
    expect(resolvePlumage(spec, 'pale').crown).toBe('#ffffff')
    expect(resolvePlumage(spec, 'pale').bill).toBe(coot.plumage.bill)
    expect(resolvePlumage(spec).crown).toBe(coot.plumage.crown)
  })
  it('throws on an unknown variant', () => {
    expect(() => resolvePlumage(parseSpeciesSpec(coot), 'nope')).toThrow(/variant/)
  })
})
