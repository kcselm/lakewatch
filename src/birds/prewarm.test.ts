import type { Location } from '../location/schema'
import { prewarmBirds } from './prewarm'
import { getSpec } from './species'
import { isPlaced } from './detail/wing'
import { TEST_SPEC } from './detail/fixture'
import { parseSpeciesSpec } from './spec'

const loc = (cast: Location['cast']): Location => ({
  id: 'l', name: 'L', region: '', habitat: 'wetland', season: 'early-autumn', timeOfDay: 'morning',
  vantage: { position: [0, 1.6, 0], heading: 0 }, wind: { direction: 0, strength: 0.3, gustiness: 0.5 },
  zones: { w: { kind: 'polygon', points: [[0, 0], [1, 0], [1, 1]] } },
  cast, ambience: [],
})

describe('prewarmBirds', () => {
  it('builds each detailed species in the cast once, yielding once between each pair, and reports progress once per species', async () => {
    const next = vi.fn(async () => {})
    const progress: [number, number][] = []
    await prewarmBirds(loc([
      { species: 'mallar3', behavior: 'swim', zone: 'w', count: 3, plumage: 'mixed' },
      { species: 'leasan', behavior: 'probe', zone: 'w', count: 5 },
      { species: 'grbher3', behavior: 'wade', zone: 'w', count: 1 },  // block species: no detail, skipped
    ]), { next, onProgress: (d, t) => progress.push([d, t]) })
    expect(next).toHaveBeenCalledTimes(1)                             // one gap, between the two detailed species
    expect(progress).toEqual([[1, 2], [2, 2]])
  })

  it('skips a cast of block species only: no yields, no progress, and it still resolves', async () => {
    const next = vi.fn(async () => {})
    const progress: [number, number][] = []
    await prewarmBirds(loc([{ species: 'grbher3', behavior: 'wade', zone: 'w', count: 2 }]), {
      next, onProgress: (d, t) => progress.push([d, t]),
    })
    expect(next).not.toHaveBeenCalled()
    expect(progress).toEqual([])
  })

  it('leaves the folded-wing cache warm, so spawnCast builds the same species with no fresh placement', async () => {
    // a species none of this file's other tests build, so its cache starts cold here
    const detail = getSpec('gadwal').detail!
    expect(isPlaced(detail)).toBe(false)
    await prewarmBirds(loc([{ species: 'gadwal', behavior: 'swim', zone: 'w', count: 1 }]))
    expect(isPlaced(detail)).toBe(true)
  })

  it('rejects when a build throws, as spawnCast would', async () => {
    // TEST_SPEC's detail block has no `float`, which buildDetailedBird requires of a swimming posture
    const broken = parseSpeciesSpec({ ...TEST_SPEC, code: 'broken', posture: 'swimming' })
    await expect(prewarmBirds(
      loc([{ species: 'broken', behavior: 'swim', zone: 'w', count: 1 }]),
      { specs: { broken } },
    )).rejects.toThrow(/waterline/)
  })
})
