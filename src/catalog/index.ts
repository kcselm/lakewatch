import raw from '../../data/birds.json'
import { parseBirds } from './schema'
import type { Bird } from './types'

let cache: Bird[] | null = null

export function loadCatalog(): Bird[] {
  if (!cache) cache = parseBirds(raw)
  return cache
}

export function findBird(code: string, birds: Bird[] = loadCatalog()): Bird {
  const b = birds.find(x => x.speciesCode === code)
  if (!b) throw new Error(`Unknown species code: ${code}`)
  return b
}

export type { Bird, Habitat, AudioClip, Photo, Rng } from './types'
export { makeRng, pickOne, shuffle } from './rng'
