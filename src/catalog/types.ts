export type Habitat = 'wetland' | 'forest' | 'shoreline' | 'urban'
export type ClipType = 'song' | 'call'
export type Rng = () => number

export const HABITATS: readonly Habitat[] = ['wetland', 'forest', 'shoreline', 'urban']

export interface AudioClip {
  file: string
  type: ClipType
  xcId: string
  recordist: string
  license: string
  sourceUrl: string
}

export interface Photo {
  file: string
  attribution: string
  license: string
  sourceUrl: string
}

export interface Bird {
  speciesCode: string
  commonName: string
  scientificName: string
  family: string
  familyCommon: string
  habitats: Habitat[]
  frequency: number
  /** Share of sampled dates per calendar month (Jan..Dec) on which the species was reported. */
  monthly: number[]
  audio: AudioClip[]
  photo: Photo | null
}
