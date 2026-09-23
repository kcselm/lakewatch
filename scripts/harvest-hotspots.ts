import { writeFile } from 'node:fs/promises'
import { createHttpClient, realSleep } from './lib/http'
import { createEBirdClient, matchAnchors, type EBirdHotspot } from './lib/ebird'
import { ANCHORS, SEARCH_CENTERS } from './hotspot-anchors'
import type { Habitat } from '../src/catalog/types'

const apiKey = process.env.EBIRD_API_KEY
if (!apiKey) throw new Error('EBIRD_API_KEY is not set. Copy .env.example to .env and fill it in.')

const http = createHttpClient({ fetcher: fetch, sleep: realSleep })
const ebird = createEBirdClient(http, apiKey)

const all: EBirdHotspot[] = []
for (const c of SEARCH_CENTERS) {
  const found = await ebird.hotspotsNear(c.lat, c.lng, c.distKm)
  console.log(`${c.name}: ${found.length} hotspots`)
  all.push(...found)
}

const result: Record<string, string[]> = {}
for (const [habitat, names] of Object.entries(ANCHORS) as [Habitat, string[]][]) {
  const matched = matchAnchors(all, names)
  result[habitat] = matched.map(h => h.locId)

  const missing = names.filter(
    n => !matched.some(h => h.locName.toLowerCase().includes(n.toLowerCase())),
  )
  console.log(`${habitat}: ${matched.length}/${names.length} anchors matched`)
  for (const h of matched) console.log(`  ${h.locId}  ${h.locName}  (${h.numSpeciesAllTime} spp)`)
  for (const m of missing) console.warn(`  UNMATCHED: ${m}`)
}

// Committed, not under data/raw/: the habitat definitions must be reproducible.
await writeFile('data/hotspots.json', JSON.stringify(result, null, 2))
console.log('\nWrote data/hotspots.json')
