import type { EnrichedSpecies } from './taxonomy'
import type { AudioClip, Photo } from '../../src/catalog/types'

export type MediaMap = Record<string, { audio: AudioClip[]; photo: Photo | null }>

export interface MergeOptions {
  dropEmpty?: boolean
}

export function mergeBirds(
  species: readonly EnrichedSpecies[],
  media: MediaMap,
  opts: MergeOptions = {},
): unknown[] {
  return species
    .map(sp => {
      const m = media[sp.speciesCode] ?? { audio: [], photo: null }
      return { ...sp, audio: m.audio, photo: m.photo }
    })
    .filter(b => !opts.dropEmpty || b.audio.length > 0 || b.photo !== null)
}
