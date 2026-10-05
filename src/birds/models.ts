import * as THREE from 'three'
import type { Location } from '../location/schema'
import { fliesDetailed, type SpeciesSpec } from './spec'
import { SPECIES } from './species'
import { expandCast } from './spawn'
import { makeRng } from '../catalog/rng'
import { authoredBuilt, authoredReady, parseGlb, storeAuthored, storeAuthoredMaps, type AuthoredMaps } from './detail/authored'

/** Where an authored bird's files are served from: public/models/<model>/ */
const modelUrl = (spec: SpeciesSpec, file: string) => `${import.meta.env?.BASE_URL ?? '/'}models/${spec.authored!.model}/${file}`

/** How an authored bird's files are fetched: the browser's own, or a test's stand-in. */
export interface ModelLoader {
  /** the parsed <model>.glb */
  model(spec: SpeciesSpec): Promise<THREE.Object3D>
  /** one version's colour, normal, and roughness maps */
  maps(spec: SpeciesSpec, version: string): Promise<AuthoredMaps>
}

/** Fetches a model and its maps from public/models/. The maps are laid out as glTF's UVs are (no flip). */
export const browserLoader: ModelLoader = {
  async model(spec) {
    const url = modelUrl(spec, `${spec.authored!.model}.glb`)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${spec.code}: ${url}: ${res.status}`)
    return parseGlb(await res.arrayBuffer())
  },
  async maps(spec, version) {
    const loader = new THREE.TextureLoader()
    const [map, normalMap, roughnessMap] = await Promise.all(['color', 'normal', 'rough'].map(k => loader.loadAsync(modelUrl(spec, `${version}.${k}.webp`))))
    for (const t of [map!, normalMap!, roughnessMap!]) { t.flipY = false; t.anisotropy = 4 }
    map!.colorSpace = THREE.SRGBColorSpace
    return { map: map!, normalMap: normalMap!, roughnessMap: roughnessMap! }
  },
}

/**
 * Every authored species the cast can need, once each, with all its versions: whatever `expandCast` would build, then
 * the flyover flocks' that fly as detailed birds. `specs` is the registry, or a test's own.
 */
export function castModels(loc: Location, specs: Record<string, SpeciesSpec> = SPECIES): SpeciesSpec[] {
  const seen = new Map<string, SpeciesSpec>()
  for (const ind of expandCast(loc, makeRng(1))) {
    const spec = specs[ind.species]
    if (spec?.authored) seen.set(spec.code, spec)
  }
  for (const entry of loc.cast) {
    const spec = specs[entry.species]
    if (entry.behavior === 'flyover' && spec?.authored && fliesDetailed(spec)) seen.set(spec.code, spec)
  }
  return [...seen.values()]
}

export interface LoadModelsOptions {
  specs?: Record<string, SpeciesSpec>
  loader?: ModelLoader
  /** called at the start and after each file set: a species' model, or one version's maps */
  onProgress?: (done: number, total: number) => void
}

/** How many steps loadModels counts for these species: each one's model, and each of its versions' maps. */
export const modelSteps = (species: SpeciesSpec[]): number =>
  species.filter(s => !authoredReady(s.code)).reduce((n, s) => n + 1 + s.authored!.versions.length, 0)

/**
 * Load every authored model the cast needs and each of its versions' maps, all at once, and keep them for the builder
 * (storeAuthored, storeAuthoredMaps), so building a bird loads nothing. Counts each model and each version's maps as
 * it arrives. A species loaded already is skipped. Rejects if any file fails.
 */
export async function loadModels(loc: Location, opts: LoadModelsOptions = {}): Promise<void> {
  const species = castModels(loc, opts.specs ?? SPECIES).filter(s => !authoredReady(s.code))
  await loadSpecies(species, opts)
}

/** Load one authored species (the viewer's, before it builds one), if it hasn't loaded. */
export async function ensureAuthored(spec: SpeciesSpec, loader: ModelLoader = browserLoader): Promise<void> {
  if (spec.authored && !authoredReady(spec.code)) await loadSpecies([spec], { loader })
}

async function loadSpecies(species: SpeciesSpec[], opts: LoadModelsOptions): Promise<void> {
  const loader = opts.loader ?? browserLoader
  const total = modelSteps(species)
  let done = 0
  opts.onProgress?.(done, total)
  const step = () => { done++; opts.onProgress?.(done, total) }
  await Promise.all(species.flatMap(spec => [
    loader.model(spec).then(scene => { storeAuthored(spec.code, authoredBuilt(spec, scene)); step() }),
    ...spec.authored!.versions.map(v => loader.maps(spec, v).then(m => { storeAuthoredMaps(spec.code, v, m); step() })),
  ]))
}
