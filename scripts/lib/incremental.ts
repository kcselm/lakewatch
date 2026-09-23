import type { AudioClip, Photo } from '../../src/catalog/types'

export interface PriorMedia {
  audio: AudioClip[]
  photo: Photo | null
}

export interface Reviews {
  accepted: string[]
  rejected: string[]
}

export function clipFile(speciesCode: string, xcId: string): string {
  return `media/audio/${speciesCode}-${xcId}.mp3`
}

/** Clips from the previous run that survive: not rejected, and still on disk. */
export function keepClips(
  prior: PriorMedia | undefined,
  rejected: ReadonlySet<string>,
  exists: (file: string) => boolean,
): AudioClip[] {
  return (prior?.audio ?? []).filter(c => !rejected.has(c.xcId) && exists(c.file))
}

export function keepPhoto(
  prior: PriorMedia | undefined,
  exists: (file: string) => boolean,
): Photo | null {
  const p = prior?.photo ?? null
  return p && exists(p.file) ? p : null
}
