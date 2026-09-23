import type { AudioClip, Rng } from '../catalog/types'

export type ClipPreference = 'call' | 'song' | 'any'

/** A clip of the preferred type when the species has one, else any clip, else null. */
export function pickClip(bird: { audio: readonly AudioClip[] }, prefer: ClipPreference, rng: Rng): AudioClip | null {
  if (bird.audio.length === 0) return null
  const preferred = prefer === 'any' ? [] : bird.audio.filter(c => c.type === prefer)
  const pool = preferred.length > 0 ? preferred : bird.audio
  return pool[Math.floor(rng() * pool.length)] ?? null
}
