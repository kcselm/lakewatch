import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises'
import { createHttpClient, realSleep } from './lib/http'
import {
  createXenoCantoClient, licenseLabel, normalizeClipType, selectClips,
} from './lib/xenocanto'
import { createINatClient } from './lib/inaturalist'
import { assertFfmpegAvailable, clipAndTranscode, resizeImage } from './lib/ffmpeg'
import { clipFile, keepClips, keepPhoto, type PriorMedia, type Reviews } from './lib/incremental'
import type { EnrichedSpecies } from './lib/taxonomy'
import type { AudioClip, Photo } from '../src/catalog/types'

const CLIPS_PER_SPECIES = 3
const CLIP_SECONDS = 10
const PHOTO_WIDTH = 800

const AUDIO_DIR = 'public/media/audio'
const PHOTO_DIR = 'public/media/photos'
const TMP_DIR = 'data/raw/tmp'
const MEDIA_JSON = 'data/raw/media.json'

assertFfmpegAvailable()

const xcKey = process.env.XC_API_KEY
if (!xcKey) throw new Error('XC_API_KEY is not set. Copy .env.example to .env and fill it in.')

const http = createHttpClient({ fetcher: fetch, sleep: realSleep }, { throttleMs: 400 })
const xc = createXenoCantoClient(http, xcKey)
const inat = createINatClient(http)

const species = JSON.parse(await readFile('data/raw/enriched.json', 'utf8')) as EnrichedSpecies[]
const reviews = JSON.parse(await readFile('data/reviews.json', 'utf8')) as Reviews
const rejected = new Set(reviews.rejected)

// Previous run, if any. Its clips are reused wherever they survive review.
const prior: Record<string, PriorMedia> = await readFile(MEDIA_JSON, 'utf8')
  .then(s => JSON.parse(s) as Record<string, PriorMedia>)
  .catch(() => ({}))
const exists = (file: string) => existsSync(`public/${file}`)

for (const dir of [AUDIO_DIR, PHOTO_DIR, TMP_DIR]) await mkdir(dir, { recursive: true })

async function download(url: string, dest: string): Promise<void> {
  const res = await http(url)
  if (!res.ok) throw new Error(`download failed with status ${res.status}`)
  await writeFile(dest, Buffer.from(await res.arrayBuffer()))
}

const out: Record<string, PriorMedia> = {}
const noAudio: string[] = []
const noPhoto: string[] = []
const zeroResults: string[] = []
const errors: string[] = []
let reused = 0
let downloaded = 0

for (const [i, sp] of species.entries()) {
  const audio: AudioClip[] = keepClips(prior[sp.speciesCode], rejected, exists)
  let photo: Photo | null = keepPhoto(prior[sp.speciesCode], exists)
  reused += audio.length
  const need = CLIPS_PER_SPECIES - audio.length

  const cached = need <= 0 && photo !== null
  console.log(`[${i + 1}/${species.length}] ${sp.commonName}${cached ? ' (cached)' : ''}`)

  // --- audio: only the shortfall ---
  if (need > 0) {
    try {
      const found = await xc.search(sp.scientificName)
      if (found.length === 0) zeroResults.push(`${sp.speciesCode}  ${sp.scientificName}`)
      // Kept clips and rejected clips are both out of the running, so a re-run
      // pulls the next candidate down the ranked list in a reject's place.
      const exclude = new Set([...rejected, ...audio.map(c => c.xcId)])
      const usable = found.filter(r => !exclude.has(`XC${r.id}`))

      for (const r of selectClips(usable, need)) {
        const xcId = `XC${r.id}`
        const file = clipFile(sp.speciesCode, xcId)
        const tmp = `${TMP_DIR}/${sp.speciesCode}-${xcId}.raw`
        try {
          await download(r.file, tmp)
          await clipAndTranscode(tmp, `public/${file}`, CLIP_SECONDS)
          audio.push({
            file,
            type: normalizeClipType(r),
            xcId,
            recordist: r.rec,
            license: licenseLabel(r.lic),
            sourceUrl: r.url.startsWith('http') ? r.url : `https:${r.url}`,
          })
          downloaded++
        } catch (err) {
          errors.push(`${sp.commonName} ${xcId}: ${(err as Error).message}`)
          await unlink(`public/${file}`).catch(() => {})
        } finally {
          await unlink(tmp).catch(() => {})
        }
      }
    } catch (err) {
      errors.push(`${sp.commonName} audio search: ${(err as Error).message}`)
    }
  }

  // --- photo: only if missing ---
  if (photo === null) {
    try {
      const found = await inat.photoFor(sp.scientificName)
      if (found) {
        const tmp = `${TMP_DIR}/${sp.speciesCode}.raw`
        const file = `media/photos/${sp.speciesCode}.jpg`
        try {
          await download(found.url, tmp)
          await resizeImage(tmp, `public/${file}`, PHOTO_WIDTH)
          photo = {
            file,
            attribution: found.attribution,
            license: found.licenseCode,
            sourceUrl: found.sourceUrl,
          }
        } catch (err) {
          errors.push(`${sp.commonName} photo: ${(err as Error).message}`)
          await unlink(`public/${file}`).catch(() => {})
        } finally {
          await unlink(tmp).catch(() => {})
        }
      }
    } catch (err) {
      errors.push(`${sp.commonName} photo: ${(err as Error).message}`)
    }
  }

  if (audio.length === 0) noAudio.push(sp.commonName)
  if (photo === null) noPhoto.push(sp.commonName)
  out[sp.speciesCode] = { audio, photo }

  // Flush after every species so an interruption (Ctrl+C, a hang, an OOM)
  // never loses progress already made this run. Merged with `prior` here so
  // species not yet reached this run keep their last-known media instead of
  // vanishing from the manifest; the final write below drops that merge so a
  // completed run still prunes species that fell out of enriched.json.
  await writeFile(MEDIA_JSON, JSON.stringify({ ...prior, ...out }, null, 2))
}

await writeFile(MEDIA_JSON, JSON.stringify(out, null, 2))

console.log('\n=== HARVEST REPORT ===')
console.log(`species processed:  ${species.length}`)
console.log(`clips reused:       ${reused}`)
console.log(`clips downloaded:   ${downloaded}`)
console.log(`clips total:        ${Object.values(out).reduce((n, v) => n + v.audio.length, 0)}`)
console.log(`photos:             ${Object.values(out).filter(v => v.photo).length}`)
console.log(`\nno audio (${noAudio.length}): ${noAudio.join(', ') || 'none'}`)
console.log(`no photo (${noPhoto.length}): ${noPhoto.join(', ') || 'none'}`)
if (zeroResults.length) {
  console.log(`\nxeno-canto returned zero results (check data/name-overrides.json) (${zeroResults.length}):`)
  for (const z of zeroResults) console.log(`  ${z}`)
}
if (errors.length) {
  console.log(`\nerrors (${errors.length}):`)
  for (const e of errors) console.log(`  ${e}`)
}
