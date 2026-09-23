import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import ffmpegPath from 'ffmpeg-static'
import { clipArgs, resizeArgs, assertFfmpegAvailable, clipAndTranscode } from './ffmpeg'
import { probeDurationSeconds } from './probe'
import { MIN_CLIP_SECONDS } from './clip-health'

describe('clipArgs', () => {
  const args = clipArgs('in.mp3', 'out.mp3', 10)

  it('reads the input and writes the output', () => {
    expect(args).toContain('in.mp3')
    expect(args[args.length - 1]).toBe('out.mp3')
  })

  it('strips leading silence', () => {
    expect(args.join(' ')).toContain('silenceremove=start_periods=1')
  })

  it('limits the duration', () => {
    expect(args[args.indexOf('-t') + 1]).toBe('10')
  })

  it('encodes mono 64k at 32kHz', () => {
    expect(args[args.indexOf('-ac') + 1]).toBe('1')
    expect(args[args.indexOf('-b:a') + 1]).toBe('64k')
    expect(args[args.indexOf('-ar') + 1]).toBe('32000')
  })

  it('overwrites without prompting', () => {
    expect(args).toContain('-y')
  })
})

describe('resizeArgs', () => {
  it('scales to the given width, preserving aspect', () => {
    expect(resizeArgs('in.jpg', 'out.jpg', 800).join(' ')).toContain('scale=800:-1')
  })
})

describe('assertFfmpegAvailable', () => {
  it('does not throw, since ffmpeg-static ships a binary', () => {
    expect(() => assertFfmpegAvailable()).not.toThrow()
  })

  it('confirms the resolved ffmpeg-static binary exists on disk', () => {
    expect(existsSync(ffmpegPath!)).toBe(true)
  })
})

describe('clipAndTranscode', () => {
  const run = promisify(execFile)
  let dir: string

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'birdsong-clip-'))
  })

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  /** A recording quiet enough that the -50dB silence filter strips all of it. */
  async function quietSource(name: string): Promise<string> {
    const file = join(dir, name)
    await run(ffmpegPath!, [
      '-nostdin', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=3',
      '-af', 'volume=-60dB', '-b:a', '64k', '-y', file,
    ])
    return file
  }

  it('produces a playable clip from a recording quieter than the silence filter', async () => {
    const input = await quietSource('quiet.mp3')
    const output = join(dir, 'quiet-clip.mp3')

    await clipAndTranscode(input, output, 10)

    const seconds = await probeDurationSeconds(output)
    expect(seconds).not.toBeNull()
    expect(seconds!).toBeGreaterThanOrEqual(MIN_CLIP_SECONDS)
  }, 30_000)

  it('still trims leading silence from a normal recording', async () => {
    const input = join(dir, 'padded.mp3')
    await run(ffmpegPath!, [
      '-nostdin', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=4',
      '-af', 'volume=enable=\'lt(t,2)\':volume=0', '-b:a', '64k', '-y', input,
    ])
    const output = join(dir, 'padded-clip.mp3')

    await clipAndTranscode(input, output, 10)

    // Four seconds in, two of them silent: the clip should be about two.
    expect((await probeDurationSeconds(output))!).toBeLessThan(3)
  }, 30_000)
})
