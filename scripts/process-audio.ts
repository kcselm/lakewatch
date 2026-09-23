import { readdir, rename, unlink } from 'node:fs/promises'
import { processClip } from './lib/ffmpeg'
import { probeDurationSeconds } from './lib/probe'

// Re-encodes every clip under public/media/audio through GAME_READY_FILTER, in
// place. Run once after copying media that predates the chain. Clips the
// harvest writes from now on already come out game-ready, and re-running this
// on them is harmless (loudnorm and the fades are idempotent to the ear).
const DIR = 'public/media/audio'
const files = (await readdir(DIR)).filter(f => f.endsWith('.mp3')).sort()
let done = 0
const failed: string[] = []
for (const f of files) {
  const src = `${DIR}/${f}`
  const tmp = `${DIR}/${f}.processing.mp3`
  try {
    await processClip(src, tmp)
    const seconds = await probeDurationSeconds(tmp)
    if (seconds === null || seconds < 0.5) throw new Error(`output is ${seconds}s`)
    await rename(tmp, src)
    done++
    process.stdout.write('.')
  } catch (err) {
    failed.push(`${f}: ${(err as Error).message}`)
    await unlink(tmp).catch(() => {})
  }
}
console.log(`\nprocessed ${done}/${files.length} clips`)
if (failed.length) {
  console.error(`failed (${failed.length}):`)
  for (const f of failed) console.error(`  ${f}`)
  process.exitCode = 1
}
