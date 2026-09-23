import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { promisify } from 'node:util'
import ffmpegPath from 'ffmpeg-static'
import { probeDurationSeconds } from './probe'
import { MIN_CLIP_SECONDS } from './clip-health'

const run = promisify(execFile)

export function assertFfmpegAvailable(): void {
  if (!ffmpegPath) {
    throw new Error(
      'ffmpeg-static did not resolve a binary. Run `npm install` and try again.',
    )
  }
  if (!existsSync(ffmpegPath)) {
    throw new Error(
      `ffmpeg binary not found at ${ffmpegPath} — reinstall with \`npm install\` (ffmpeg-static downloads it at install time)`,
    )
  }
}

export function clipArgs(input: string, output: string, seconds: number): string[] {
  return [
    '-i', input,
    '-af', 'silenceremove=start_periods=1:start_duration=0.1:start_threshold=-50dB',
    '-t', String(seconds),
    '-ac', '1',
    '-b:a', '64k',
    '-ar', '32000',
    '-y',
    output,
  ]
}

/** The same encode without the silence filter, for recordings it would eat whole. */
export function clipArgsKeepingSilence(input: string, output: string, seconds: number): string[] {
  return clipArgs(input, output, seconds).filter(
    (arg, i, all) => arg !== '-af' && all[i - 1] !== '-af',
  )
}

export function resizeArgs(input: string, output: string, width: number): string[] {
  return ['-i', input, '-vf', `scale=${width}:-1`, '-y', output]
}

/**
 * ffmpeg exits 0 after `silenceremove` has stripped an entire quiet recording,
 * leaving a bare ID3 header that no browser can decode. Such a clip is worse
 * than no clip: the round promises a question on the start screen and then
 * skips it at runtime. So the output is probed, and a recording the filter ate
 * is re-encoded with the silence left in.
 */
export async function clipAndTranscode(input: string, output: string, seconds = 10): Promise<void> {
  assertFfmpegAvailable()
  await run(ffmpegPath!, clipArgs(input, output, seconds))
  if (await isUsable(output)) return

  await run(ffmpegPath!, clipArgsKeepingSilence(input, output, seconds))
  if (await isUsable(output)) return

  throw new Error(
    `${input} produced no playable audio (under ${MIN_CLIP_SECONDS}s even with silence kept)`,
  )
}

async function isUsable(file: string): Promise<boolean> {
  const seconds = await probeDurationSeconds(file)
  return seconds !== null && seconds >= MIN_CLIP_SECONDS
}

export async function resizeImage(input: string, output: string, width = 800): Promise<void> {
  assertFfmpegAvailable()
  await run(ffmpegPath!, resizeArgs(input, output, width))
}
