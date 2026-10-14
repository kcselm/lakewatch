import raw from '../../data/birds.json'
import { parseBirds } from './schema'
import { withCueClips } from '../audio/cues'
import type { Bird } from './types'

let cache: Bird[] | null = null

/**
 * The harvested catalog, with the cue file's clips added and its types corrected (data/cues.json): they are kept
 * apart from the generated birds.json so a rebuild keeps them, and joined here so every reader, the credits among
 * them, sees one list.
 */
export function loadCatalog(): Bird[] {
  if (!cache) cache = withCueClips(parseBirds(raw))
  return cache
}

export function findBird(code: string, birds: Bird[] = loadCatalog()): Bird {
  const b = birds.find(x => x.speciesCode === code)
  if (!b) throw new Error(`Unknown species code: ${code}`)
  return b
}

export type { Bird, Habitat, AudioClip, Photo, Rng } from './types'
export { makeRng, pickOne, shuffle } from './rng'
