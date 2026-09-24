import type { Bird } from '../catalog/types'
import type { AmbienceLayer } from '../audio/ambienceManifest'

export interface SpeciesCredit {
  code: string
  name: string
  photo: { attribution: string; license: string; sourceUrl: string } | null
  clips: { xcId: string; type: string; recordist: string; license: string; sourceUrl: string }[]
}
export interface AmbienceCredit { id: string; attribution: string; sourceUrl: string | null }
export interface Credits { species: SpeciesCredit[]; ambience: AmbienceCredit[] }

/** Every attribution the game owes, in guide order. */
export function creditsFor(guide: readonly Bird[], ambience: readonly AmbienceLayer[]): Credits {
  return {
    species: guide.map(b => ({
      code: b.speciesCode,
      name: b.commonName,
      photo: b.photo ? { attribution: b.photo.attribution, license: b.photo.license, sourceUrl: b.photo.sourceUrl } : null,
      clips: b.audio.map(c => ({ xcId: c.xcId, type: c.type, recordist: c.recordist, license: c.license, sourceUrl: c.sourceUrl })),
    })),
    ambience: ambience.map(l => ({ id: l.id, attribution: l.attribution, sourceUrl: l.source.kind === 'file' ? l.source.sourceUrl : null })),
  }
}
