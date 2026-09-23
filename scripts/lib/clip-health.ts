/**
 * A clip that will not decode in a browser is worse than a missing one: the
 * question is built, promised on the start screen, and then skipped at
 * runtime, so the round is shorter than the count the user was shown.
 *
 * `silenceremove` in the transcode step can strip a quiet recording down to a
 * bare ID3 header while ffmpeg still exits 0, so existence is not proof of
 * playability. Everything here runs at build time, against the files on disk.
 */

/** Below this, whatever survived the silence filter is an artifact, not a bird. */
export const MIN_CLIP_SECONDS = 0.5

export interface DroppedClip {
  speciesCode: string
  file: string
  reason: string
}

interface AudioLike {
  file: string
}

interface BirdLike {
  speciesCode: string
  audio: AudioLike[]
  photo: unknown
}

/**
 * Removes audio that cannot be played, and any species that is left with
 * nothing to ask about. `durationOf` returns the clip's length in seconds, or
 * null when ffmpeg cannot decode it at all.
 */
export function pruneUnplayableAudio<T extends BirdLike>(
  birds: readonly T[],
  durationOf: (file: string) => number | null,
  minSeconds = MIN_CLIP_SECONDS,
): { birds: T[]; dropped: DroppedClip[] } {
  const dropped: DroppedClip[] = []

  const pruned = birds.map(bird => ({
    ...bird,
    audio: bird.audio.filter(clip => {
      const seconds = durationOf(clip.file)
      if (seconds === null) {
        dropped.push({ speciesCode: bird.speciesCode, file: clip.file, reason: 'does not decode' })
        return false
      }
      if (seconds < minSeconds) {
        dropped.push({
          speciesCode: bird.speciesCode,
          file: clip.file,
          reason: `${seconds}s is under the ${minSeconds}s floor`,
        })
        return false
      }
      return true
    }),
  }))

  return { birds: pruned.filter(b => b.audio.length > 0 || b.photo !== null), dropped }
}
