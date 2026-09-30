import { loadLocation } from '../location'
import { expandCast } from './spawn'
import { castAtlases } from './paint/prepaint'
import { makeRng } from '../catalog/rng'

// The lake's swimmers in the plumages the research's late-September tallies give (each species' research document,
// section 3): moulting and eclipse drakes, females and female-types, first-autumn coots, and striped grebes.
const MIX: Record<string, number> = {
  'mallar3:male': 1, 'mallar3:maleMoult': 1, 'mallar3:female': 2,
  'gadwal:male': 1, 'gadwal:female': 2,
  'amewig:female': 3, 'amewig:eclipse': 1, 'amewig:male': 1,
  'norsho:eclipse': 2, 'norsho:female': 1,
  'y00475:adult': 4, 'y00475:juvenile': 2,
  'pibgre:basic': 2, 'pibgre:juvenile': 1,
}

describe("the lake's late-September mix", () => {
  const lake = loadLocation()
  it('every seed spawns exactly the same mix of plumage versions', () => {
    for (const seed of [1, 2, 3]) {
      const got: Record<string, number> = {}
      for (const ind of expandCast(lake, makeRng(seed))) {
        const k = `${ind.species}:${ind.variant ?? ''}`
        got[k] = (got[k] ?? 0) + 1
      }
      for (const [k, n] of Object.entries(MIX)) expect(got[k], `${k}, seed ${seed}`).toBe(n)
    }
  })
  it('paints twenty-two atlases: the six shorebirds, fourteen swimmer versions, the Great Blue Heron, and the Great Egret', () => {
    expect(castAtlases(lake).length).toBe(22)
  })
})
