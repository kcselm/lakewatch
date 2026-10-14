import { z } from 'zod'
import raw from '../../data/cues.json'
import { audioClipSchema } from '../catalog/schema'
import type { Bird } from '../catalog/types'

/**
 * Cues marked by hand on clips, from their spectrograms: where each song of a song clip begins, where its trill starts
 * and where it ends; where each single check of a call clip begins and ends. Times are seconds into the clip file as
 * it ships. They live in data/cues.json, beside the catalog and not in the generated birds.json, so a catalog rebuild
 * keeps them.
 *
 * How they were marked: each shipped file decoded at 32 kHz, its spectrogram drawn (1024-point windows) and its energy
 * printed every 10 ms in bands (1-2.5, 2.5-4.5 and 4.5-8 kHz). `start` is the 10 ms frame before the first note's
 * rise; `trill` the frame before the jump at the trill's head (in these songs a loud slur down from about 4.3 kHz into
 * the 3-3.5 kHz buzz); `end` the frame where the song's last sound (the trill, then its terminal notes) is back in the
 * background. A check's `end` takes in the 4.2 kHz ring after the note. The file's own cues are in data/cues.json; the
 * species' `note` there says which songs were left out and why.
 *
 * The file also carries, per species, the clips cut for their cues (`clips`, credited as the catalog's are, and added
 * to the bird's audio when the catalog loads) and corrections to a harvested clip's type (`retype`).
 */

/** One song on a song clip: its first note, its trill's start, and its end, seconds into the clip. */
export interface SongCue {
  /** the clip, as the catalog names it (media/audio/....mp3) */
  file: string
  start: number
  trill: number
  end: number
}

/** One single check on a call clip, seconds into the clip. */
export interface CheckCue {
  file: string
  start: number
  end: number
}

const seconds = z.number().min(0)

const songCueSchema = z.object({ file: z.string().min(1), start: seconds, trill: seconds, end: seconds })
  .refine(c => c.start < c.trill && c.trill < c.end, { message: 'a song cue runs start < trill < end' })

const checkCueSchema = z.object({ file: z.string().min(1), start: seconds, end: seconds })
  .refine(c => c.start < c.end, { message: 'a check cue runs start < end' })

const speciesCuesSchema = z.object({
  /** how the cues were marked, and what was left out */
  note: z.string().optional(),
  /** clips cut for their cues rather than harvested, credited as the catalog's clips are */
  clips: z.array(audioClipSchema).default([]),
  /** a harvested clip's type corrected, by its xeno-canto id */
  retype: z.record(z.string(), z.enum(['song', 'call'])).default({}),
  songs: z.array(songCueSchema).default([]),
  checks: z.array(checkCueSchema).default([]),
})

export const cueFileSchema = z.record(z.string(), speciesCuesSchema)
export type SpeciesCues = z.infer<typeof speciesCuesSchema>
/** data/cues.json, by species code */
export type CueFile = z.infer<typeof cueFileSchema>

/** Throws with a precise path on any malformed entry, as the catalog's parse does. */
export function parseCues(data: unknown): CueFile {
  return cueFileSchema.parse(data)
}

let cache: CueFile | null = null

export function loadCues(): CueFile {
  if (!cache) cache = parseCues(raw)
  return cache
}

/** The cues a species' songs and checks are played from. The call player reads this; tests pass their own. */
export interface CueBook {
  songs(species: string): readonly SongCue[]
  checks(species: string): readonly CheckCue[]
}

export function cueBook(file: CueFile = loadCues()): CueBook {
  return {
    songs: species => file[species]?.songs ?? [],
    checks: species => file[species]?.checks ?? [],
  }
}

/** The species' song cues: what a song ask picks from, and nothing else. */
export function songCues(species: string): readonly SongCue[] {
  return loadCues()[species]?.songs ?? []
}

/** The species' single-check cues. */
export function checkCues(species: string): readonly CheckCue[] {
  return loadCues()[species]?.checks ?? []
}

/**
 * The catalog with the cue file's additions: each species' clips cut for cues appended to its audio, so the credits,
 * the field guide and the call player see them as they see the harvested clips; and a harvested clip of the wrong
 * type given its corrected one (the blackbird's XC469000, chatter filed as song).
 */
export function withCueClips(birds: Bird[], file: CueFile = loadCues()): Bird[] {
  return birds.map(b => {
    const s = file[b.speciesCode]
    if (!s) return b
    const audio = b.audio.map(c => {
      const type = s.retype[c.xcId]
      return type ? { ...c, type } : c
    })
    for (const c of s.clips) if (!audio.some(a => a.xcId === c.xcId)) audio.push(c)
    return { ...b, audio }
  })
}
