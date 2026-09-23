import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import ffmpegPath from 'ffmpeg-static'
import {
  clipArgs, clipArgsKeepingSilence, processArgs, resizeArgs, assertFfmpegAvailable,
  clipAndTranscode, processClip, GAME_READY_FILTER, gameReadyFilter, parseLoudnorm,
} from './ffmpeg'
import type { LoudnormMeasure } from './ffmpeg'
import { probeDurationSeconds } from './probe'
import { MIN_CLIP_SECONDS } from './clip-health'

describe('GAME_READY_FILTER', () => {
  it('high-passes, normalises loudness, and fades both ends', () => {
    expect(GAME_READY_FILTER).toContain('highpass=f=250')
    expect(GAME_READY_FILTER).toContain('loudnorm=I=-18')
    // fade in at the head; fade out via reverse/fade/reverse so no duration is needed
    expect(GAME_READY_FILTER).toMatch(/afade=t=in:st=0:d=0\.05,areverse,afade=t=in:st=0:d=0\.25,areverse$/)
  })
})

describe('parseLoudnorm', () => {
  // Captured verbatim from a real `loudnorm=...:print_format=json` run.
  const stderr = `
size=N/A time=00:00:00.00 bitrate=N/A speed=   0x
[Parsed_loudnorm_1 @ 0000021a510ef040]
{
\t"input_i" : "-52.65",
\t"input_tp" : "-48.50",
\t"input_lra" : "0.00",
\t"input_thresh" : "-62.65",
\t"output_i" : "-18.05",
\t"output_tp" : "-13.85",
\t"output_lra" : "0.00",
\t"output_thresh" : "-28.05",
\t"normalization_type" : "linear",
\t"target_offset" : "0.05"
}
`

  it('reads the measured fields out of the JSON block', () => {
    expect(parseLoudnorm(stderr)).toEqual({
      input_i: -52.65,
      input_tp: -48.5,
      input_lra: 0,
      input_thresh: -62.65,
      target_offset: 0.05,
    })
  })

  it('returns null when ffmpeg printed no JSON (measurement pass failed)', () => {
    expect(parseLoudnorm('some unrelated ffmpeg error output')).toBeNull()
  })
})

describe('gameReadyFilter', () => {
  const measured: LoudnormMeasure = {
    input_i: -30.1, input_tp: -15.3, input_lra: 4.2, input_thresh: -40.3, target_offset: 0.02,
  }

  it('without a measurement, matches the single-pass GAME_READY_FILTER fallback', () => {
    expect(gameReadyFilter()).toBe(GAME_READY_FILTER)
  })

  it('with a measurement, feeds every measured_ value into linear-mode loudnorm', () => {
    const filter = gameReadyFilter(measured)
    expect(filter).toContain('measured_I=-30.1')
    expect(filter).toContain('measured_TP=-15.3')
    expect(filter).toContain('measured_LRA=4.2')
    expect(filter).toContain('measured_thresh=-40.3')
    expect(filter).toContain('offset=0.02')
    expect(filter).toContain('linear=true')
  })

  it('still starts with the high-pass and ends with the fade chain', () => {
    const filter = gameReadyFilter(measured)
    expect(filter.startsWith('highpass=f=250,')).toBe(true)
    expect(filter).toMatch(/afade=t=in:st=0:d=0\.05,areverse,afade=t=in:st=0:d=0\.25,areverse$/)
  })
})

describe('clipArgs', () => {
  const args = clipArgs('in.mp3', 'out.mp3', 10)
  const filter = args[args.indexOf('-af') + 1]!

  it('reads the input and writes the output', () => {
    expect(args).toContain('in.mp3')
    expect(args[args.length - 1]).toBe('out.mp3')
  })

  it('strips leading silence, then trims to the requested seconds, then applies the game chain', () => {
    expect(filter.startsWith('silenceremove=start_periods=1')).toBe(true)
    expect(filter).toContain(',atrim=0:10,')
    expect(filter.endsWith(GAME_READY_FILTER)).toBe(true)
  })

  it('does not also pass -t (atrim owns the duration so the fade-out lands at the cut)', () => {
    expect(args).not.toContain('-t')
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

describe('clipArgsKeepingSilence', () => {
  it('drops only the silenceremove stage', () => {
    const filter = clipArgsKeepingSilence('in.mp3', 'out.mp3', 10)
    const f = filter[filter.indexOf('-af') + 1]!
    expect(f).not.toContain('silenceremove')
    expect(f.startsWith('atrim=0:10,')).toBe(true)
    expect(f.endsWith(GAME_READY_FILTER)).toBe(true)
  })
})

describe('processArgs', () => {
  it('re-encodes an existing clip through the game chain with the same codec settings', () => {
    const args = processArgs('a.mp3', 'b.mp3')
    expect(args[args.indexOf('-af') + 1]).toBe(GAME_READY_FILTER)
    expect(args[args.indexOf('-ar') + 1]).toBe('32000')
    expect(args[args.length - 1]).toBe('b.mp3')
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

describe('processClip (two-pass loudnorm)', () => {
  const run = promisify(execFile)
  let dir: string

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'birdsong-loudnorm-'))
  })

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('measures a quiet recording first so loudnorm actually lands on -18 LUFS', async () => {
    const input = join(dir, 'quiet.mp3')
    await run(ffmpegPath!, [
      '-nostdin', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=4',
      '-af', 'volume=-30dB', '-b:a', '64k', '-y', input,
    ])
    const output = join(dir, 'quiet-processed.mp3')

    await processClip(input, output)

    const { stderr } = await run(ffmpegPath!, ['-nostdin', '-i', output, '-af', 'ebur128', '-f', 'null', '-'])
    const match = stderr.match(/Integrated loudness:\s*\n\s*I:\s*(-?\d+(?:\.\d+)?) LUFS/)
    expect(match).not.toBeNull()
    const lufs = Number(match![1])
    expect(Math.abs(lufs - -18)).toBeLessThanOrEqual(1.5)
  }, 30_000)
})
