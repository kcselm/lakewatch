import { readFileSync } from 'node:fs'
import * as THREE from 'three'
import type { Location } from '../location/schema'
import { castModels, ensureAuthored, loadModels, type ModelLoader } from './models'
import { prepareBirds } from './prewarm'
import { authoredMaterial, authoredReady, parseGlb } from './detail/authored'
import { TEST_BIRD_GLB } from './detail/authored.testkit'
import { TEST_AUTHORED_SPEC } from './detail/fixture'
import { parseSpeciesSpec, type SpeciesSpec } from './spec'
import type { PaintWorker } from './paint/prepaint'

const loc = (cast: Location['cast']): Location => ({
  id: 'l', name: 'L', region: '', habitat: 'wetland', season: 'early-autumn', timeOfDay: 'morning',
  vantage: { position: [0, 1.6, 0], heading: 0 }, wind: { direction: 0, strength: 0.3, gustiness: 0.5 },
  zones: { w: { kind: 'polygon', points: [[0, 0], [1, 0], [1, 1]] } },
  cast, ambience: [],
})
/** the test bird under a code of its own, so each test loads it afresh (the loaded models are kept by code) */
const bird = (code: string): SpeciesSpec => parseSpeciesSpec({ ...TEST_AUTHORED_SPEC, code })
const glb = () => {
  const buf = readFileSync(TEST_BIRD_GLB)
  return parseGlb(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer)
}
/** a stand-in for the browser's loader: the test bird's model, and a blank texture for every map, each a tick later */
function stubLoader(log: string[] = []): ModelLoader {
  return {
    async model(spec) { log.push(`model ${spec.code}`); return glb() },
    async maps(spec, version) {
      log.push(`maps ${spec.code} ${version}`)
      const t = () => new THREE.Texture()
      return { map: t(), normalMap: t(), roughnessMap: t() }
    },
  }
}

describe('castModels', () => {
  it('names every authored species the cast needs, once each, and no lofted or block one', () => {
    const specs = { a1: bird('a1') }
    const got = castModels(loc([
      { species: 'a1', behavior: 'swim', zone: 'w', count: 1 },
      { species: 'a1', behavior: 'swim', zone: 'w', count: 2 },
      { species: 'pibgre', behavior: 'swim', zone: 'w', count: 1 },
      { species: 'rewbla', behavior: 'perch', zone: 'w', count: 1 },
    ]), { ...specs })
    expect(got.map(s => s.code)).toEqual(['a1'])
  })
})

describe('loadModels', () => {
  it('loads each model and each version\'s maps, counting each as it arrives, and keeps them for the builder', async () => {
    const spec = bird('a2'), log: string[] = [], counts: string[] = []
    await loadModels(loc([{ species: 'a2', behavior: 'swim', zone: 'w', count: 2 }]), {
      specs: { a2: spec }, loader: stubLoader(log), onProgress: (d, t) => counts.push(`${d} of ${t}`),
    })
    expect(log.sort()).toEqual(['maps a2 adult', 'maps a2 juvenile', 'model a2'])
    expect(counts).toEqual(['0 of 3', '1 of 3', '2 of 3', '3 of 3'])
    expect(authoredReady('a2')).toBe(true)
    expect(authoredMaterial(spec, 'juvenile').normalMap).toBeInstanceOf(THREE.Texture)
  })
  it('loads nothing for a species loaded already', async () => {
    const spec = bird('a3'), log: string[] = []
    await ensureAuthored(spec, stubLoader())
    await loadModels(loc([{ species: 'a3', behavior: 'swim', zone: 'w', count: 1 }]), { specs: { a3: spec }, loader: stubLoader(log) })
    expect(log).toEqual([])
  })
  it('rejects when a file fails', async () => {
    const failing: ModelLoader = { ...stubLoader(), async model() { throw new Error('404') } }
    await expect(loadModels(loc([{ species: 'a4', behavior: 'swim', zone: 'w', count: 1 }]), { specs: { a4: bird('a4') }, loader: failing })).rejects.toThrow(/404/)
  })
})

describe('prepareBirds with an authored bird', () => {
  const noWorker = (): PaintWorker => { throw new Error('no worker here') }
  it('counts its model and maps in the one count, and builds only once they have loaded', async () => {
    const spec = bird('a5'), counts: [number, number][] = []
    await prepareBirds(loc([{ species: 'a5', behavior: 'swim', zone: 'w', count: 1 }]), {
      specs: { a5: spec }, worker: noWorker, models: stubLoader(), next: async () => {},
      onProgress: (d, t) => counts.push([d, t]),
      build: () => expect(authoredReady('a5')).toBe(true),
    })
    // its model, its two versions' maps, and the build; no atlas and no fold for an authored bird
    expect(counts.every(([, t]) => t === 4)).toBe(true)
    expect(counts.at(-1)).toEqual([4, 4])
  })
})
