import * as THREE from 'three'
import { atlasKey as key, atlasReady, materialFor, paintSpecies, paintStats, type AtlasJob, type PaintedAtlas } from './painter'
import { paintJob } from './job'
import { castAtlases, prepaint, type PaintWorker } from './prepaint'
import { ATLAS_SIZE } from './atlas'
import { TEST_SWIM_DETAIL, TEST_SPEC } from '../detail/fixture'
import { SPECIES, getSpec } from '../species'
import { parseSpeciesSpec } from '../spec'
import { expandCast } from '../spawn'
import { loadLocation } from '../../location'
import { makeRng } from '../../catalog/rng'

const pixelsOf = (m: THREE.MeshStandardMaterial) => (m.map as THREE.DataTexture).image.data
const flat = (v: number) => new Uint8ClampedArray(ATLAS_SIZE * ATLAS_SIZE * 4).fill(v)
// identity as a boolean: a failed toBe on two million-byte arrays makes vitest diff them, which never finishes
const same = (a: unknown, b: unknown) => a === b

/**
 * A stand-in for the paint worker: answers each job a tick later, as a real worker would, with `answer`'s pixels, or
 * fires an error instead where `answer` returns 'fail'. It records what was posted and whether it was terminated.
 */
function fakeWorker(answer: (job: AtlasJob) => Uint8ClampedArray | 'fail') {
  const posted: AtlasJob[] = []
  const state = { terminated: false }
  const w: PaintWorker = {
    onmessage: null,
    onerror: null,
    postMessage(job) {
      posted.push(job)
      setTimeout(() => {
        if (state.terminated) return
        const px = answer(job)
        if (px === 'fail') w.onerror?.({ message: 'boom' } as ErrorEvent)
        else w.onmessage?.({ data: { ...job, pixels: px, ms: 40 } } as MessageEvent<PaintedAtlas>)
      }, 0)
    },
    terminate() { state.terminated = true },
  }
  return { w, posted, state }
}

describe('paintJob, the worker\'s handler', () => {
  it('paints the atlas materialFor would, and says how long it took', () => {
    const r = paintJob({ code: 'leasan' })
    expect(r.code).toBe('leasan')
    expect(r.variant).toBeUndefined()
    expect(r.ms).toBeGreaterThan(0)
    expect(Buffer.from(r.pixels).equals(Buffer.from(paintSpecies(getSpec('leasan'))))).toBe(true)
  })
  it('owns its whole buffer, so posting it back transfers exactly the atlas', () => {
    const r = paintJob({ code: 'lobdow' })
    expect(r.pixels.byteOffset).toBe(0)
    expect(r.pixels.buffer.byteLength).toBe(ATLAS_SIZE * ATLAS_SIZE * 4)
  })
  it('fails loudly on a species with no spec', () => {
    expect(() => paintJob({ code: 'nosuchbird' })).toThrow(/nosuchbird/)
  })
})

describe('castAtlases', () => {
  const lake = loadLocation()
  it('covers every detailed bird the cast can make, whatever the seed, once each', () => {
    const jobs = castAtlases(lake)
    const keys = new Set(jobs.map(key))
    expect(keys.size).toBe(jobs.length)
    for (let seed = 1; seed <= 20; seed++) {
      for (const ind of expandCast(lake, makeRng(seed))) {
        if (getSpec(ind.species).detail) expect(keys.has(key({ code: ind.species, variant: ind.variant })), `${ind.species}:${ind.variant}`).toBe(true)
      }
    }
  })
  it('paints every version of a detailed species with versions, and nothing for block birds or flyovers', () => {
    // a Mallard with the test duck's detail block (a swimmer's has its waterline) and exactly two versions (the real
    // one has three), the shorebirds as they are
    const specs = { ...SPECIES, mallar3: parseSpeciesSpec({ ...getSpec('mallar3'), variants: { male: {}, female: {} }, detail: TEST_SWIM_DETAIL }) }
    const loc = {
      ...lake,
      cast: [
        { species: 'mallar3', behavior: 'swim' as const, zone: 'near-water', count: 1, plumage: 'mixed' as const },
        { species: 'leasan', behavior: 'probe' as const, zone: 'mudflat', count: 5 },
        { species: 'amwpel', behavior: 'wade' as const, zone: 'far-shallows', count: 1 },
        { species: 'cangoo', behavior: 'flyover' as const, zone: 'sky', count: 14 },
      ],
    }
    expect(castAtlases(loc, specs).map(key).sort()).toEqual(['leasan:', 'mallar3:female', 'mallar3:male'])
  })
})

describe('prepaint', () => {
  it('paints every atlas in the worker, reports progress, and counts each paint for the dev overlay', async () => {
    const before = { ...paintStats }
    const { w, posted, state } = fakeWorker(() => flat(200))
    const progress: [number, number][] = []
    const jobs: AtlasJob[] = [{ code: 'fake1' }, { code: 'fake2', variant: 'female' }, { code: 'fake2', variant: 'male' }, { code: 'fake1' }]
    await prepaint(jobs, { worker: () => w, onProgress: (d, t) => progress.push([d, t]) })
    expect(posted.map(key)).toEqual(['fake1:', 'fake2:female', 'fake2:male'])       // the duplicate is painted once
    expect(progress).toEqual([[0, 3], [1, 3], [2, 3], [3, 3]])
    for (const j of jobs) expect(atlasReady(j)).toBe(true)
    expect(state.terminated).toBe(true)
    expect(paintStats.atlases - before.atlases).toBe(3)
    expect(paintStats.ms - before.ms).toBeCloseTo(120, 9)                             // the worker's 40 ms each
    expect(paintStats.bytes - before.bytes).toBe(3 * Math.round(ATLAS_SIZE * ATLAS_SIZE * 4 * 4 / 3))
  })
  it('leaves materialFor nothing to paint: it finds the worker\'s pixels ready', async () => {
    const sent = flat(90)
    const { w } = fakeWorker(() => sent)
    await prepaint([{ code: TEST_SPEC.code }], { worker: () => w })
    const before = { ...paintStats }
    const mat = materialFor(TEST_SPEC)
    expect(paintStats).toEqual(before)
    expect(same(pixelsOf(mat), sent), 'pixels from the worker').toBe(true)
    expect(materialFor(TEST_SPEC)).toBe(mat)
  })
  it('skips atlases already painted, and makes no worker when there is nothing to paint', async () => {
    let made = 0
    const progress: [number, number][] = []
    await prepaint([{ code: TEST_SPEC.code }], { worker: () => { made++; return fakeWorker(() => flat(1)).w }, onProgress: (d, t) => progress.push([d, t]) })
    expect(made).toBe(0)
    expect(progress).toEqual([[0, 0]])
  })
  it('paints on the main thread when a worker can\'t be made', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const before = paintStats.atlases
    const progress: [number, number][] = []
    await prepaint([{ code: 'killde' }], { worker: () => { throw new Error('no workers here') }, onProgress: (d, t) => progress.push([d, t]) })
    expect(atlasReady({ code: 'killde' })).toBe(true)
    expect(progress).toEqual([[0, 1], [1, 1]])
    expect(paintStats.atlases - before).toBe(1)                                       // counted once, by paintAtlas
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })
  it('paints on the main thread when given no worker at all, one atlas per task so the page can redraw between them', async () => {
    const seen: string[] = []
    const tick = setInterval(() => seen.push('tick'), 0)
    await prepaint([{ code: 'pecsan' }, { code: 'lobdow' }], { onProgress: d => seen.push(`done ${d}`) })
    clearInterval(tick)
    expect(atlasReady({ code: 'pecsan' }) && atlasReady({ code: 'lobdow' })).toBe(true)
    const between = seen.slice(seen.indexOf('done 1'), seen.indexOf('done 2'))
    expect(between).toContain('tick')
  })
  it('keeps what the worker painted before it failed, and paints the rest on the main thread', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const sent = flat(30)
    const { w, state } = fakeWorker(j => j.code === 'lesyel' ? sent : 'fail')
    const progress: [number, number][] = []
    const before = paintStats.atlases
    await prepaint([{ code: 'lesyel' }, { code: 'greyel' }], { worker: () => w, onProgress: (d, t) => progress.push([d, t]) })
    expect(state.terminated).toBe(true)
    expect(progress).toEqual([[0, 2], [1, 2], [2, 2]])
    expect(paintStats.atlases - before).toBe(2)
    expect(same(pixelsOf(materialFor(getSpec('lesyel'))), sent), 'lesyel from the worker').toBe(true)
    expect(Buffer.from(pixelsOf(materialFor(getSpec('greyel'))) as Uint8ClampedArray).equals(Buffer.from(paintSpecies(getSpec('greyel'))))).toBe(true)
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })
})
