import { describe, it, expect } from 'vitest'
import { pruneUnplayableAudio, MIN_CLIP_SECONDS } from './clip-health'

const clip = (file: string) => ({ file, type: 'song' as const })
const bird = (speciesCode: string, files: string[], photo: unknown = null) =>
  ({ speciesCode, audio: files.map(clip), photo })

/** Stands in for the ffmpeg probe: null means ffmpeg could not decode the file. */
const durations = (m: Record<string, number | null>) => (file: string) => m[file] ?? null

describe('pruneUnplayableAudio', () => {
  it('drops a clip ffmpeg cannot decode, keeping the rest', () => {
    const birds = [bird('spotow', ['a.mp3', 'broken.mp3', 'c.mp3'])]
    const out = pruneUnplayableAudio(birds, durations({ 'a.mp3': 9, 'broken.mp3': null, 'c.mp3': 8 }))

    expect(out.birds[0]!.audio.map(c => c.file)).toEqual(['a.mp3', 'c.mp3'])
  })

  it('drops a clip whose audio was stripped to almost nothing', () => {
    const birds = [bird('killde', ['a.mp3', 'stub.mp3'])]
    const out = pruneUnplayableAudio(birds, durations({ 'a.mp3': 9, 'stub.mp3': 0.28 }))

    expect(out.birds[0]!.audio.map(c => c.file)).toEqual(['a.mp3'])
  })

  it('keeps a short but usable clip', () => {
    const birds = [bird('daejun', ['short.mp3'])]
    const out = pruneUnplayableAudio(birds, durations({ 'short.mp3': 1 }))

    expect(out.birds[0]!.audio).toHaveLength(1)
  })

  it('reports every dropped clip with the species and the reason', () => {
    const birds = [bird('spotow', ['broken.mp3']), bird('killde', ['stub.mp3'])]
    const out = pruneUnplayableAudio(birds, durations({ 'broken.mp3': null, 'stub.mp3': 0.28 }))

    expect(out.dropped).toEqual([
      { speciesCode: 'spotow', file: 'broken.mp3', reason: 'does not decode' },
      { speciesCode: 'killde', file: 'stub.mp3', reason: '0.28s is under the 0.5s floor' },
    ])
  })

  it('leaves a species with no playable audio but a photo in place', () => {
    const birds = [bird('sonspa', ['broken.mp3'], { file: 'p.jpg' })]
    const out = pruneUnplayableAudio(birds, durations({ 'broken.mp3': null }))

    expect(out.birds).toHaveLength(1)
    expect(out.birds[0]!.audio).toEqual([])
  })

  it('drops a species left with neither playable audio nor a photo', () => {
    const birds = [bird('sonspa', ['broken.mp3'])]
    const out = pruneUnplayableAudio(birds, durations({ 'broken.mp3': null }))

    expect(out.birds).toEqual([])
  })

  it('does not mutate the input', () => {
    const birds = [bird('spotow', ['a.mp3', 'broken.mp3'])]
    pruneUnplayableAudio(birds, durations({ 'a.mp3': 9, 'broken.mp3': null }))

    expect(birds[0]!.audio).toHaveLength(2)
  })

  it('floors clips at half a second', () => {
    expect(MIN_CLIP_SECONDS).toBe(0.5)
  })
})
