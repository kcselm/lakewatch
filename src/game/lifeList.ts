export interface SpeciesRecord {
  firstSeenAt: string
  firstSeenLocation: string
  selfIdentified: number
  revealed: number
  wrongGuesses: number
}

export interface Sighting {
  species: string
  location: string
  timeOfDay: string
  selfIdentified: boolean
  at: string
}

export interface LifeListData {
  version: 1
  species: Record<string, SpeciesRecord>
  journal: Sighting[]
}

export const JOURNAL_LIMIT = 200

export function emptyLifeList(): LifeListData {
  return { version: 1, species: {}, journal: [] }
}

export function recordSighting(
  data: LifeListData,
  s: { species: string; location: string; timeOfDay: string; selfIdentified: boolean; wrongGuesses: number; at: string },
): LifeListData {
  const prev = data.species[s.species]
  const rec: SpeciesRecord = prev
    ? { ...prev }
    : { firstSeenAt: s.at, firstSeenLocation: s.location, selfIdentified: 0, revealed: 0, wrongGuesses: 0 }
  if (s.selfIdentified) rec.selfIdentified += 1
  else rec.revealed += 1
  rec.wrongGuesses += s.wrongGuesses
  const journal = [...data.journal, { species: s.species, location: s.location, timeOfDay: s.timeOfDay, selfIdentified: s.selfIdentified, at: s.at }]
  return {
    version: 1,
    species: { ...data.species, [s.species]: rec },
    journal: journal.slice(Math.max(0, journal.length - JOURNAL_LIMIT)),
  }
}

export function seenState(data: LifeListData): Record<string, 'self' | 'revealed'> {
  const out: Record<string, 'self' | 'revealed'> = {}
  for (const [code, r] of Object.entries(data.species)) out[code] = r.selfIdentified > 0 ? 'self' : 'revealed'
  return out
}

export function summary(data: LifeListData, locationSpecies: readonly string[]): { seen: number; total: number; accuracy: number | null } {
  const seen = locationSpecies.filter(c => c in data.species).length
  let right = 0, attempts = 0
  for (const r of Object.values(data.species)) {
    right += r.selfIdentified
    attempts += r.selfIdentified + r.wrongGuesses
  }
  return { seen, total: locationSpecies.length, accuracy: attempts === 0 ? null : right / attempts }
}
