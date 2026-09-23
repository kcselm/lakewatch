import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHttpClient, realSleep } from './lib/http'
import { createEBirdClient } from './lib/ebird'
import { sampleDates, summarize, selectPerHabitat, type Sample, type SpeciesStats } from './lib/frequency'
import { mergeAllowlist, type Allowlist } from './lib/allowlist'

// Reported on at least this share of dates that had any checklist. A fixed
// top-n instead made each habitat's bar depend on how densely its hotspots
// were birded — see selectPerHabitat.
const MIN_FREQUENCY = 0.15
// Backstop only; the frequency floor is what decides membership.
const MAX_PER_HABITAT = 60
const SAMPLE_YEAR = new Date().getFullYear() - 1

const apiKey = process.env.EBIRD_API_KEY
if (!apiKey) throw new Error('EBIRD_API_KEY is not set.')

const http = createHttpClient({ fetcher: fetch, sleep: realSleep })
const ebird = createEBirdClient(http, apiKey)

const hotspots = JSON.parse(await readFile('data/hotspots.json', 'utf8')) as Record<string, string[]>
const dates = sampleDates(SAMPLE_YEAR)
const statsByHabitat: Record<string, Map<string, SpeciesStats>> = {}

for (const [habitat, locIds] of Object.entries(hotspots)) {
  console.log(`\n${habitat}: sampling ${locIds.length} hotspots x ${dates.length} dates`)
  const samples: Sample[] = []

  for (const locId of locIds) {
    for (const d of dates) {
      try {
        samples.push({ month: d.month, observed: await ebird.historicObs(locId, d.year, d.month, d.day) })
      } catch (err) {
        // A single failed date must not lose the rest of the sample. An empty
        // sample is excluded from the denominator by summarize().
        console.warn(`  ${locId} ${d.year}-${d.month}-${d.day}: ${(err as Error).message}`)
        samples.push({ month: d.month, observed: [] })
      }
    }
    process.stdout.write('.')
  }

  const reporting = samples.filter(s => s.observed.length > 0).length
  statsByHabitat[habitat] = summarize(samples)
  console.log(`\n  ${reporting}/${samples.length} dates had checklists; ${statsByHabitat[habitat]!.size} species`)
}

const candidates = selectPerHabitat(statsByHabitat, {
  minFrequency: MIN_FREQUENCY,
  maxPerHabitat: MAX_PER_HABITAT,
})
const out = [...candidates.entries()]
  .map(([speciesCode, c]) => ({ speciesCode, ...c }))
  .sort((a, b) => b.frequency - a.frequency)

const allowlist = JSON.parse(await readFile('data/species-allowlist.json', 'utf8')) as Allowlist
const withAllowlist = mergeAllowlist(out, allowlist)

await mkdir('data/raw', { recursive: true })
await writeFile('data/raw/candidates.json', JSON.stringify(withAllowlist, null, 2))
console.log(`\nWrote ${withAllowlist.length} unique species to data/raw/candidates.json`)
