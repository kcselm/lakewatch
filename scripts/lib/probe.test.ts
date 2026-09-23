import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import ffmpegPath from 'ffmpeg-static'
import { probeArgs, parseProbeDuration, probeDurationSeconds } from './probe'

describe('probeArgs', () => {
  const args = probeArgs('clip.mp3')

  it('reads the file', () => {
    expect(args[args.indexOf('-i') + 1]).toBe('clip.mp3')
  })

  it('decodes to nowhere, so the whole stream is read without writing a file', () => {
    expect(args.slice(-3)).toEqual(['-f', 'null', '-'])
  })

  it('asks for the progress stats that carry the decoded duration', () => {
    expect(args).toContain('-stats')
  })
})

describe('parseProbeDuration', () => {
  it('reads the decoded duration out of the stats line', () => {
    expect(parseProbeDuration('size=N/A time=00:00:09.98 bitrate=N/A speed=200x')).toBe(9.98)
  })

  it('takes the last stats line, since ffmpeg reprints it as it decodes', () => {
    const out = 'size=0kB time=00:00:01.00 bitrate=N/A\rsize=N/A time=00:00:07.50 bitrate=N/A'
    expect(parseProbeDuration(out)).toBe(7.5)
  })

  it('counts minutes and hours', () => {
    expect(parseProbeDuration('time=01:02:03.00')).toBe(3723)
  })

  it('returns null when ffmpeg printed no duration at all', () => {
    expect(parseProbeDuration('Error opening input: Invalid argument')).toBeNull()
  })
})

describe('probeDurationSeconds', () => {
  const run = promisify(execFile)
  let dir: string
  let tone: string
  let garbage: string

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'birdsong-probe-'))
    tone = join(dir, 'tone.mp3')
    garbage = join(dir, 'garbage.mp3')
    await run(ffmpegPath!, ['-nostdin',
      '-f', 'lavfi', '-i', 'sine=frequency=440:duration=2', '-b:a', '64k', '-y', tone,
    ])
    // An ID3 header with no audio frames behind it — what silenceremove leaves
    // when it strips a whole quiet recording.
    await writeFile(garbage, Buffer.from('ID3\x04\x00\x00\x00\x00\x02C', 'binary'))
  }, 30_000)

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('returns the decoded length of a real clip', async () => {
    expect(await probeDurationSeconds(tone)).toBeCloseTo(2, 1)
  })

  it('returns null for a file ffmpeg cannot decode', async () => {
    expect(await probeDurationSeconds(garbage)).toBeNull()
  })

  it('returns null for a file that does not exist', async () => {
    expect(await probeDurationSeconds(join(dir, 'nope.mp3'))).toBeNull()
  })
})
