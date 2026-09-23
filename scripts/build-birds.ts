import { readFile, writeFile, access } from 'node:fs/promises'
import { mergeBirds, type MediaMap } from './lib/merge'
import { pruneUnplayableAudio } from './lib/clip-health'
import { applyHabitatOverrides, type HabitatOverrides } from './lib/habitat-overrides'
import { probeDurationSeconds } from './lib/probe'
import { assertFfmpegAvailable } from './lib/ffmpeg'
import { parseBirds } from '../src/catalog/schema'
import { HABITATS } from '../src/catalog/types'
import type { EnrichedSpecies } from './lib/taxonomy'

const species = JSON.parse(await readFile('data/raw/enriched.json', 'utf8')) as EnrichedSpecies[]
const media = JSON.parse(await readFile('data/raw/media.json', 'utf8')) as MediaMap

const merged = mergeBirds(species, media, { dropEmpty: true })

// The hotspot sample records where a bird was seen, not where it lives. This
// is the editorial correction, applied before validation so a bad habitat name
// in the overrides fails the build rather than reaching the app.
const overrides = JSON.parse(
  await readFile('data/habitat-overrides.json', 'utf8'),
) as HabitatOverrides
const corrected = applyHabitatOverrides(merged as { speciesCode: string; habitats: string[] }[], overrides)

if (corrected.unused.length > 0) {
  console.warn(`Habitat overrides matched no species: ${corrected.unused.join(', ')}`)
}

// Throws with a precise path on any schema violation.
const parsed = parseBirds(corrected.birds)

const missing: string[] = []
for (const bird of parsed) {
  for (const clip of bird.audio) {
    await access(`public/${clip.file}`).catch(() => missing.push(clip.file))
  }
  if (bird.photo) {
    await access(`public/${bird.photo.file}`).catch(() => missing.push(bird.photo!.file))
  }
}

if (missing.length > 0) {
  console.error(`${missing.length} referenced media files do not exist:`)
  for (const f of missing) console.error(`  ${f}`)
  throw new Error('Media manifest references files that were never written.')
}

// Existing on disk is not the same as playing in a browser. A clip the silence
// filter hollowed out still passes the check above, then fails at runtime and
// silently shortens the round below the count the start screen promised.
assertFfmpegAvailable()
const seconds = new Map<string, number | null>()
for (const bird of parsed) {
  for (const clip of bird.audio) {
    seconds.set(clip.file, await probeDurationSeconds(`public/${clip.file}`))
  }
}

const { birds, dropped } = pruneUnplayableAudio(parsed, f => seconds.get(f) ?? null)

if (dropped.length > 0) {
  console.warn(`\nDropped ${dropped.length} unplayable clip(s):`)
  for (const d of dropped) console.warn(`  ${d.speciesCode}  ${d.file} — ${d.reason}`)
  console.warn('Reject them in review.html and re-run harvest:media to replace them.\n')
}

// The app imports this file directly (Vite bundles JSON), so this is the
// only copy. Nothing needs to be placed under public/.
await writeFile('data/birds.json', JSON.stringify(birds, null, 2))
console.log(`Wrote ${birds.length} birds to data/birds.json`)
for (const h of HABITATS) {
  console.log(`  ${h}: ${birds.filter(b => b.habitats.includes(h)).length}`)
}
