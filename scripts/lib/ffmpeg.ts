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

const HIGHPASS = 'highpass=f=250'
const FADES = 'afade=t=in:st=0:d=0.05,areverse,afade=t=in:st=0:d=0.25,areverse'
const LOUDNORM_TARGET = 'I=-18:TP=-1.5:LRA=11'
const SILENCE_TRIM = 'silenceremove=start_periods=1:start_duration=0.1:start_threshold=-50dB'

export interface LoudnormMeasure {
  input_i: number
  input_tp: number
  input_lra: number
  input_thresh: number
  target_offset: number
}

/**
 * Parses the JSON block `loudnorm=...:print_format=json` prints to stderr,
 * e.g. `{"input_i": "-52.65", ...}`. Null if ffmpeg printed no such block, or
 * printed one with a non-numeric field (a measurement pass we cannot trust).
 */
export function parseLoudnorm(stderr: string): LoudnormMeasure | null {
  const match = stderr.match(/\{[^{}]*"input_i"[^{}]*\}/)
  if (!match) return null
  try {
    const raw = JSON.parse(match[0]) as Record<string, string>
    const measure: LoudnormMeasure = {
      input_i: Number(raw.input_i),
      input_tp: Number(raw.input_tp),
      input_lra: Number(raw.input_lra),
      input_thresh: Number(raw.input_thresh),
      target_offset: Number(raw.target_offset),
    }
    return Object.values(measure).every(Number.isFinite) ? measure : null
  } catch {
    return null
  }
}

/**
 * The chain every clip the game plays goes through: a gentle high-pass to
 * lose recording hiss and handling rumble, EBU R128 loudness to -18 LUFS so a
 * wren and a goose sit at the same level before distance attenuation, and short
 * fades. The fade-out is done by reversing so it needs no duration.
 *
 * Without a prior measurement, loudnorm's single-pass mode only *estimates*
 * the input's loudness while it streams through, which can miss the target by
 * several dB on a short or quiet clip. `measured` — a `measureLoudness` result
 * — switches loudnorm to linear mode against the real measured values, which
 * actually lands on -18 LUFS.
 */
export function gameReadyFilter(measured?: LoudnormMeasure): string {
  const loudnorm = measured
    ? `loudnorm=${LOUDNORM_TARGET}:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true`
    : `loudnorm=${LOUDNORM_TARGET}`
  return `${HIGHPASS},${loudnorm},${FADES}`
}

/** The single-pass fallback used when no measurement is available. */
export const GAME_READY_FILTER = gameReadyFilter()

const ENCODE = ['-ac', '1', '-b:a', '64k', '-ar', '32000', '-y']

/** Runs loudnorm's analysis pass through the same filters that will precede it at encode time. */
export function measureArgs(input: string, preFilter: string): string[] {
  return ['-i', input, '-af', `${preFilter},loudnorm=${LOUDNORM_TARGET}:print_format=json`, '-f', 'null', '-']
}

/** The clip's loudnorm measurement, or null if ffmpeg fails or prints nothing parseable. */
export async function measureLoudness(input: string, preFilter: string): Promise<LoudnormMeasure | null> {
  try {
    const { stderr } = await run(ffmpegPath!, measureArgs(input, preFilter))
    return parseLoudnorm(stderr)
  } catch {
    return null
  }
}

export function clipArgs(input: string, output: string, seconds: number, measured?: LoudnormMeasure): string[] {
  return [
    '-i', input,
    '-af', `${SILENCE_TRIM},atrim=0:${seconds},${gameReadyFilter(measured)}`,
    ...ENCODE,
    output,
  ]
}

/** The same encode without the silence filter, for recordings it would eat whole. */
export function clipArgsKeepingSilence(
  input: string, output: string, seconds: number, measured?: LoudnormMeasure,
): string[] {
  return ['-i', input, '-af', `atrim=0:${seconds},${gameReadyFilter(measured)}`, ...ENCODE, output]
}

/** Re-encode a clip that predates the game chain (the media copied from birdsong-quiz). */
export function processArgs(input: string, output: string, measured?: LoudnormMeasure): string[] {
  return ['-i', input, '-af', gameReadyFilter(measured), ...ENCODE, output]
}

/**
 * Measures loudness through the same pre-highpass chain that will run at
 * encode time, then re-encodes with those measured values so loudnorm lands
 * on -18 LUFS instead of estimating it. Falls back to the single-pass filter
 * (and warns) when the measurement pass itself fails.
 */
export async function processClip(input: string, output: string): Promise<void> {
  assertFfmpegAvailable()
  const measured = await measureLoudness(input, HIGHPASS)
  if (!measured) console.warn(`${input}: loudness measurement failed, using single-pass loudnorm`)
  await run(ffmpegPath!, processArgs(input, output, measured ?? undefined))
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

  const measured = await measureLoudness(
    input,
    `${SILENCE_TRIM},atrim=0:${seconds},${HIGHPASS}`,
  )
  if (!measured) console.warn(`${input}: loudness measurement failed, using single-pass loudnorm`)
  await run(ffmpegPath!, clipArgs(input, output, seconds, measured ?? undefined))
  if (await isUsable(output)) return

  const keepMeasured = await measureLoudness(input, `atrim=0:${seconds},${HIGHPASS}`)
  if (!keepMeasured) console.warn(`${input}: loudness measurement failed, using single-pass loudnorm`)
  await run(ffmpegPath!, clipArgsKeepingSilence(input, output, seconds, keepMeasured ?? undefined))
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
