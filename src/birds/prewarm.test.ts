import type { Location } from '../location/schema'
import { placeFolds, prepareBirds } from './prewarm'
import { getSpec } from './species'
import { isPlaced } from './detail/wing'
import { TEST_SPEC } from './detail/fixture'
import type { SpeciesSpec } from './spec'
import { atlasReady, paintStats, type AtlasJob, type PaintedAtlas } from './paint/painter'
import { ATLAS_SIZE } from './paint/atlas'
import { castAtlases, type PaintWorker } from './paint/prepaint'
import { expandCast } from './spawn'
import { loadLocation } from '../location'
import { makeRng } from '../catalog/rng'

const loc = (cast: Location['cast']): Location => ({
  id: 'l', name: 'L', region: '', habitat: 'wetland', season: 'early-autumn', timeOfDay: 'morning',
  vantage: { position: [0, 1.6, 0], heading: 0 }, wind: { direction: 0, strength: 0.3, gustiness: 0.5 },
  zones: { w: { kind: 'polygon', points: [[0, 0], [1, 0], [1, 1]] } },
  cast, ambience: [],
})

/** A stand-in paint worker: answers each job a tick later with a flat atlas, as prepaint.test.ts's does. */
function flatWorker(): PaintWorker {
  const w: PaintWorker = {
    onmessage: null,
    onerror: null,
    postMessage(job: AtlasJob) {
      setTimeout(() => w.onmessage?.({ data: { ...job, pixels: new Uint8ClampedArray(ATLAS_SIZE * ATLAS_SIZE * 4).fill(90), ms: 40 } } as MessageEvent<PaintedAtlas>), 0)
    },
    terminate() {},
  }
  return w
}

/** a species whose folded wing can't be placed: its profile has too few stations to loft */
const brokenFold = (): SpeciesSpec => {
  const detail = TEST_SPEC.detail!
  return { ...TEST_SPEC, code: 'broken', detail: { ...detail, profile: detail.profile.slice(0, 3) } }
}

// First in the file: every other test here builds or places birds, and this one needs the caches cold.
describe('placeFolds', () => {
  it('places the folded wing of every detailed species in the lake cast, and paints no atlas', async () => {
    const lake = loadLocation()
    const codes = [...new Set(expandCast(lake, makeRng(1)).map(b => b.species))].filter(c => getSpec(c).detail)
    expect(codes).toHaveLength(17)
    expect(codes.filter(c => isPlaced(getSpec(c).detail!))).toEqual([])
    const before = paintStats.atlases
    await placeFolds(lake, { next: async () => {} })
    expect(codes.filter(c => !isPlaced(getSpec(c).detail!))).toEqual([])
    expect(paintStats.atlases).toBe(before)
  }, 60_000)   // twelve first placements: about 2 s alone

  // a frame's animation callbacks run before it is drawn: two yields let a frame draw before the next piece of work
  it('yields two frames before the first species, so the title card draws first, and one between each pair; counts from 0 to its total', async () => {
    const events: string[] = []
    await placeFolds(loc([
      { species: 'mallar3', behavior: 'swim', zone: 'w', count: 3, plumage: 'mixed' },
      { species: 'leasan', behavior: 'probe', zone: 'w', count: 5 },
      { species: 'rewbla', behavior: 'wade', zone: 'w', count: 1 },  // block species: no detail, skipped
    ]), { next: async () => { events.push('yield') }, onProgress: (d, t) => events.push(`${d} of ${t}`) })
    expect(events).toEqual(['0 of 2', 'yield', 'yield', '1 of 2', 'yield', '2 of 2'])
  })

  it('places a detailed flyover flock\'s fold too, once, after the birds on the ground and water', async () => {
    const events: string[] = []
    await placeFolds(loc([
      { species: 'mallar3', behavior: 'flyover', zone: 'sky', count: 3 },
      { species: 'leasan', behavior: 'probe', zone: 'w', count: 5 },
      { species: 'cangoo', behavior: 'flyover', zone: 'sky', count: 3 },
    ]), { next: async () => {}, onProgress: (d, t) => events.push(`${d} of ${t}`) })
    expect(events).toEqual(['0 of 2', '1 of 2', '2 of 2'])
  })

  it('counts 0 of 0 for a cast of block species only, and resolves without yielding', async () => {
    const events: string[] = []
    await placeFolds(loc([{ species: 'rewbla', behavior: 'wade', zone: 'w', count: 2 }]), {
      next: async () => { events.push('yield') }, onProgress: (d, t) => events.push(`${d} of ${t}`),
    })
    expect(events).toEqual(['0 of 0'])
  })

  it('rejects when a species\' folded wing cannot be placed', async () => {
    await expect(placeFolds(loc([{ species: 'broken', behavior: 'probe', zone: 'w', count: 1 }]), {
      specs: { broken: brokenFold() }, next: async () => {},
    })).rejects.toThrow(/at least 4 stations/)
  })
})

describe('prepareBirds', () => {
  const cast = () => loc([
    { species: 'pibgre', behavior: 'swim', zone: 'w', count: 2, plumage: { basic: 1, juvenile: 1 } },
    { species: 'killde', behavior: 'probe', zone: 'w', count: 1 },
  ])

  it('paints the atlases and places the folds together, then builds the cast, in one count that keeps its total and reaches it once, at the end', async () => {
    const jobs = castAtlases(cast())
    const total = jobs.filter(j => !atlasReady(j)).length + 2 + 1
    expect(total).toBe(6)   // pibgre's two versions and killde's own, the two species' folds, and the cast
    const progress: [number, number][] = []
    const events: string[] = []
    const next = vi.fn(async () => { events.push('yield') })
    await prepareBirds(cast(), {
      worker: flatWorker, next,
      onProgress: (d, t) => { progress.push([d, t]); events.push(`${d} of ${t}`) },
      build: () => {
        // the cast is built only once every atlas is painted and every fold placed
        expect(jobs.every(atlasReady)).toBe(true)
        expect(isPlaced(getSpec('pibgre').detail!) && isPlaced(getSpec('killde').detail!)).toBe(true)
        events.push('build')
      },
    })
    expect(progress.every(([, t]) => t === total)).toBe(true)
    expect(progress.every(([d], i) => i === 0 || d >= progress[i - 1]![0])).toBe(true)
    expect(progress.filter(([d]) => d === total)).toHaveLength(1)
    // two frames before the build, which blocks, so one draws the count first: the last atlas can arrive between frames
    expect(events.slice(-5)).toEqual([`${total - 1} of ${total}`, 'yield', 'yield', 'build', `${total} of ${total}`])
    expect(next).toHaveBeenCalledTimes(5)   // two before the first species' fold, one before the second, two before the build
  })

  it("rejects, and never reaches its total, when the cast's build throws", async () => {
    const progress: [number, number][] = []
    await expect(prepareBirds(cast(), {
      worker: flatWorker, next: async () => {},
      onProgress: (d, t) => progress.push([d, t]),
      build: () => { throw new Error('the cast could not be built') },
    })).rejects.toThrow(/could not be built/)
    expect(progress.some(([d, t]) => d === t)).toBe(false)
  })

  it("rejects when a species' folded wing cannot be placed, and builds nothing", async () => {
    const build = vi.fn()
    await expect(prepareBirds(loc([{ species: 'broken', behavior: 'probe', zone: 'w', count: 1 }]), {
      worker: flatWorker, specs: { broken: brokenFold() }, next: async () => {}, build,
    })).rejects.toThrow(/at least 4 stations/)
    expect(build).not.toHaveBeenCalled()
  })
})
