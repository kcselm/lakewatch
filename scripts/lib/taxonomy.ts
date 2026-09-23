import type { EBirdTaxon } from './ebird'

export interface CandidateRecord {
  speciesCode: string
  habitats: string[]
  frequency: number
  monthly: number[]
}

export interface EnrichedSpecies {
  speciesCode: string
  commonName: string
  scientificName: string
  family: string
  familyCommon: string
  habitats: string[]
  frequency: number
  monthly: number[]
}

export function enrich(
  candidates: readonly CandidateRecord[],
  taxa: readonly EBirdTaxon[],
  overrides: Record<string, string>,
): { species: EnrichedSpecies[]; dropped: string[] } {
  const byCode = new Map(taxa.map(t => [t.speciesCode, t]))
  const species: EnrichedSpecies[] = []
  const dropped: string[] = []

  for (const c of candidates) {
    const t = byCode.get(c.speciesCode)
    if (!t) {
      dropped.push(`${c.speciesCode} (no taxonomy match)`)
      continue
    }
    if (t.category !== 'species') {
      dropped.push(`${c.speciesCode} (${t.category}: ${t.comName})`)
      continue
    }
    species.push({
      speciesCode: c.speciesCode,
      commonName: t.comName,
      scientificName: overrides[c.speciesCode] ?? t.sciName,
      family: t.familySciName,
      familyCommon: t.familyComName,
      habitats: c.habitats,
      frequency: c.frequency,
      monthly: c.monthly,
    })
  }

  return { species, dropped }
}
