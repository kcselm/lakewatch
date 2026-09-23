import { describe, it, expect } from 'vitest'
import { applyHabitatOverrides } from './habitat-overrides'

const bird = (speciesCode: string, habitats: string[]) => ({ speciesCode, habitats })

describe('applyHabitatOverrides', () => {
  it('adds a habitat the hotspot sample missed', () => {
    const out = applyHabitatOverrides(
      [bird('eursta', ['wetland', 'shoreline'])],
      { eursta: { add: ['urban'] } },
    )
    expect(out.birds[0]!.habitats).toEqual(['wetland', 'shoreline', 'urban'])
  })

  it('removes a habitat the sample only picked up as a site artifact', () => {
    const out = applyHabitatOverrides(
      [bird('norsho', ['wetland', 'forest'])],
      { norsho: { remove: ['forest'] } },
    )
    expect(out.birds[0]!.habitats).toEqual(['wetland'])
  })

  it('applies an add and a remove to the same species', () => {
    const out = applyHabitatOverrides(
      [bird('moudov', ['forest'])],
      { moudov: { add: ['urban'], remove: ['forest'] } },
    )
    expect(out.birds[0]!.habitats).toEqual(['urban'])
  })

  it('does not duplicate a habitat the species already has', () => {
    const out = applyHabitatOverrides(
      [bird('marwre', ['wetland'])],
      { marwre: { add: ['wetland'] } },
    )
    expect(out.birds[0]!.habitats).toEqual(['wetland'])
  })

  it('leaves species with no override untouched', () => {
    const birds = [bird('sonspa', ['wetland']), bird('norsho', ['forest'])]
    const out = applyHabitatOverrides(birds, { norsho: { remove: ['forest'] } })
    expect(out.birds[0]!.habitats).toEqual(['wetland'])
  })

  it('reports override keys that match no species, so a typo is not silent', () => {
    const out = applyHabitatOverrides([bird('sonspa', ['wetland'])], {
      sonspa: { add: ['urban'] },
      nosuchbird: { add: ['urban'] },
    })
    expect(out.unused).toEqual(['nosuchbird'])
  })

  it('does not mutate the input', () => {
    const birds = [bird('norsho', ['wetland', 'forest'])]
    applyHabitatOverrides(birds, { norsho: { remove: ['forest'] } })
    expect(birds[0]!.habitats).toEqual(['wetland', 'forest'])
  })
})
