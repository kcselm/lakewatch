import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import ffmpegPath from 'ffmpeg-static'

const run = promisify(execFile)

/**
 * Decoding to the null muxer reads the entire stream, so the reported time is
 * what actually came out — not what the header claims. A truncated file whose
 * header still says ten seconds is exactly the case this has to catch.
 */
export function probeArgs(file: string): string[] {
  return ['-nostdin', '-v', 'quiet', '-stats', '-i', file, '-f', 'null', '-']
}

/** Reads the last `time=HH:MM:SS.ss` ffmpeg printed, in seconds. */
export function parseProbeDuration(stderr: string): number | null {
  const matches = [...stderr.matchAll(/time=(\d+):(\d\d):(\d\d(?:\.\d+)?)/g)]
  const last = matches[matches.length - 1]
  if (!last) return null
  return Number(last[1]) * 3600 + Number(last[2]) * 60 + Number(last[3])
}

/**
 * The clip's decoded length in seconds, or null if ffmpeg cannot read it.
 * Callers should have run `assertFfmpegAvailable` first: without a binary
 * every clip probes as null, which reads as "all audio is broken".
 */
export async function probeDurationSeconds(file: string): Promise<number | null> {
  try {
    const { stderr } = await run(ffmpegPath!, probeArgs(file))
    return parseProbeDuration(stderr)
  } catch {
    // Non-zero exit: unreadable, unparseable, or absent. All mean unusable.
    return null
  }
}
