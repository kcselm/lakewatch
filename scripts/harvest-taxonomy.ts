import { readFile, writeFile } from 'node:fs/promises'
import { createHttpClient, realSleep } from './lib/http'
import { createEBirdClient } from './lib/ebird'
import { enrich, type CandidateRecord } from './lib/taxonomy'

const apiKey = process.env.EBIRD_API_KEY
if (!apiKey) throw new Error('EBIRD_API_KEY is not set.')

const http = createHttpClient({ fetcher: fetch, sleep: realSleep })
const ebird = createEBirdClient(http, apiKey)

const candidates = JSON.parse(
  await readFile('data/raw/candidates.json', 'utf8'),
) as CandidateRecord[]
const overrides = JSON.parse(
  await readFile('data/name-overrides.json', 'utf8'),
) as Record<string, string>

const taxa = await ebird.taxonomy(candidates.map(c => c.speciesCode))
const { species, dropped } = enrich(candidates, taxa, overrides)

if (dropped.length > 0) {
  console.warn(`${dropped.length} candidates dropped:`)
  for (const d of dropped) console.warn(`  ${d}`)
}

await writeFile('data/raw/enriched.json', JSON.stringify(species, null, 2))
console.log(`Wrote ${species.length} species to data/raw/enriched.json`)
