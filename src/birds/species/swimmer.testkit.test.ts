import { SPEC as GADWALL } from './gadwal'
import { atlas, built } from './swimmer.testkit'

describe('the swimmers test kit', () => {
  it("refuses a version the species doesn't have, as built() does, naming the species and the version", () => {
    expect(() => built(GADWALL, 'eclipse')).toThrow(/variant/)
    expect(() => atlas(GADWALL, 'eclipse')).toThrow(/gadwal.*eclipse/)
  })
  it("reads a version the species has but its detail block doesn't: the Gadwall's female wears the base plumage", () => {
    expect(GADWALL.detail!.variants.female).toBeUndefined()
    expect(atlas(GADWALL, 'female').px.length).toBeGreaterThan(0)
  })
})
