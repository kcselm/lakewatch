import { existsSync } from 'node:fs'
import { parseCues, loadCues, songCues, checkCues, withCueClips } from './cues'
import { pickClip } from './clips'
import { loadCatalog, findBird } from '../catalog'
import { makeRng } from '../catalog/rng'
import { creditsFor } from '../game/credits'
import { assertFfmpegAvailable } from '../../scripts/lib/ffmpeg'
import { probeDurationSeconds } from '../../scripts/lib/probe'

/** the game-ready chain's fade at a clip's end (scripts/lib/ffmpeg.ts): a whole song ends before it */
const END_FADE = 0.25
/** recordings whose licence forbids trimming (CC BY-NC-ND), named in the design as not to be used */
const ND_RECORDINGS = ['XC159672', 'XC159674', 'XC159716']
const ND = /\bND\b/i

const cues = loadCues()
const allCues = Object.entries(cues).flatMap(([species, s]) => [...s.songs, ...s.checks].map(c => ({ species, ...c })))

describe('the cue file (data/cues.json)', () => {
  it('validates, and rejects a song out of order or a check that ends before it starts', () => {
    expect(Object.keys(cues)).toContain('rewbla')
    expect(songCues('rewbla').length).toBeGreaterThanOrEqual(3)
    expect(checkCues('rewbla').length).toBeGreaterThanOrEqual(3)
    expect(() => parseCues({ rewbla: { songs: [{ file: 'a.mp3', start: 1, trill: 0.5, end: 2 }] } })).toThrow()
    expect(() => parseCues({ rewbla: { songs: [{ file: 'a.mp3', start: 1, trill: 1.2, end: 1.1 }] } })).toThrow()
    expect(() => parseCues({ rewbla: { checks: [{ file: 'a.mp3', start: 1, end: 1 }] } })).toThrow()
    expect(() => parseCues({ rewbla: { clips: [{ file: 'a.mp3', type: 'song', xcId: 'XC1', recordist: 'r', license: 'l', sourceUrl: 'not a url' }] } })).toThrow()
    expect(parseCues({ rewbla: {} }).rewbla).toEqual({ clips: [], retype: {}, songs: [], checks: [] })
  })

  it("names only species in the catalog, and only clips that species has, on disk", () => {
    for (const [species, s] of Object.entries(cues)) {
      const files = new Set(findBird(species).audio.map(c => c.file))
      for (const c of [...s.songs, ...s.checks]) expect(files, `${species} ${c.file}`).toContain(c.file)
      for (const c of s.clips) expect(existsSync(`public/${c.file}`), c.file).toBe(true)
      const ids = new Set(findBird(species).audio.map(c => c.xcId))
      for (const xc of Object.keys(s.retype)) expect(ids, xc).toContain(xc)
    }
  })

  it('every cue lies inside its clip as the file ships, and every song is whole, clear of the fade at its end', async () => {
    assertFfmpegAvailable()
    const seconds = new Map<string, number | null>()
    for (const c of allCues) if (!seconds.has(c.file)) seconds.set(c.file, await probeDurationSeconds(`public/${c.file}`))
    for (const c of allCues) {
      const length = seconds.get(c.file)
      expect(length, c.file).not.toBeNull()
      expect(c.start, `${c.file} @${c.start}`).toBeGreaterThanOrEqual(0.05)          // past the fade at its start
      expect(c.end, `${c.file} @${c.start}`).toBeLessThanOrEqual(length! - END_FADE)
    }
  }, 30_000)

  it("songs run first note < trill < end, and are whole songs: 0.6-1.5 s, the trill 0.1-0.5 s after the first note", () => {
    for (const c of songCues('rewbla')) {
      expect(c.start).toBeLessThan(c.trill)
      expect(c.trill).toBeLessThan(c.end)
      expect(c.trill - c.start).toBeGreaterThanOrEqual(0.1)
      expect(c.trill - c.start).toBeLessThanOrEqual(0.5)
      expect(c.end - c.start).toBeGreaterThanOrEqual(0.6)
      expect(c.end - c.start).toBeLessThanOrEqual(1.5)
    }
  })

  it('checks are single notes with their ring: 0.1-0.35 s, clear of the songs on the same clip', () => {
    const songs = songCues('rewbla')
    const checks = checkCues('rewbla')
    for (const c of checks) {
      expect(c.end - c.start).toBeGreaterThanOrEqual(0.1)
      expect(c.end - c.start).toBeLessThanOrEqual(0.35)
      for (const s of songs.filter(s => s.file === c.file)) expect(c.end < s.start || c.start > s.end).toBe(true)
    }
  })

  it('never cues XC469000, chatter filed as song; the catalog has it as a call, so nothing picks it as a song', () => {
    for (const c of allCues) expect(c.file).not.toContain('XC469000')
    const rewbla = findBird('rewbla')
    expect(rewbla.audio.find(c => c.xcId === 'XC469000')?.type).toBe('call')
    for (let seed = 0; seed < 50; seed++) expect(pickClip(rewbla, 'song', makeRng(seed))?.xcId).not.toBe('XC469000')
  })

  it("adds its clips to the species' audio once, and they are credited", () => {
    const rewbla = findBird('rewbla')
    for (const c of cues['rewbla']!.clips) {
      expect(rewbla.audio.filter(a => a.xcId === c.xcId)).toHaveLength(1)
      const credit = creditsFor([rewbla], []).species[0]!.clips.find(k => k.xcId === c.xcId)
      expect(credit).toEqual({ xcId: c.xcId, type: c.type, recordist: c.recordist, license: c.license, sourceUrl: c.sourceUrl })
      expect(credit!.recordist.length).toBeGreaterThan(0)
    }
    // applying the file twice adds nothing more
    expect(withCueClips(loadCatalog()).find(b => b.speciesCode === 'rewbla')!.audio).toEqual(rewbla.audio)
  })

  it('every clip it adds may be trimmed: no ND licence, and none of the ND recordings', () => {
    for (const s of Object.values(cues)) {
      for (const c of s.clips) {
        expect(c.license, c.xcId).not.toMatch(ND)
        expect(ND_RECORDINGS).not.toContain(c.xcId)
      }
    }
  })

  it('and so may every clip in the catalog', () => {
    for (const b of loadCatalog()) {
      for (const c of b.audio) {
        expect(c.license, `${b.speciesCode} ${c.xcId}`).not.toMatch(ND)
        expect(ND_RECORDINGS).not.toContain(c.xcId)
      }
    }
  })
})
