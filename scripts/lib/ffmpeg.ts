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

/**
 * The chain every clip the game plays goes through: a gentle high-pass to
 * lose recording hiss and handling rumble, EBU R128 loudness to -18 LUFS so a
 * wren and a goose sit at the same level before distance attenuation, and short
 * fades. The fade-out is done by reversing so it needs no duration.
 */
export const GAME_READY_FILTER =
  'highpass=f=250,loudnorm=I=-18:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.05,areverse,afade=t=in:st=0:d=0.25,areverse'

const ENCODE = ['-ac', '1', '-b:a', '64k', '-ar', '32000', '-y']

export function clipArgs(input: string, output: string, seconds: number): string[] {
  return [
    '-i', input,
    '-af', `silenceremove=start_periods=1:start_duration=0.1:start_threshold=-50dB,atrim=0:${seconds},${GAME_READY_FILTER}`,
    ...ENCODE,
    output,
  ]
}

/** The same encode without the silence filter, for recordings it would eat whole. */
export function clipArgsKeepingSilence(input: string, output: string, seconds: number): string[] {
  return ['-i', input, '-af', `atrim=0:${seconds},${GAME_READY_FILTER}`, ...ENCODE, output]
}

/** Re-encode a clip that predates the game chain (the media copied from birdsong-quiz). */
export function processArgs(input: string, output: string): string[] {
  return ['-i', input, '-af', GAME_READY_FILTER, ...ENCODE, output]
}

export async function processClip(input: string, output: string): Promise<void> {
  assertFfmpegAvailable()
  await run(ffmpegPath!, processArgs(input, output))
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
