import { readFile, writeFile } from 'node:fs/promises'
import { mergeAllowlist, type Allowlist } from './lib/allowlist'
import type { CandidateRecord } from './lib/taxonomy'

// Folds data/species-allowlist.json into an existing data/raw/candidates.json
// so the taxonomy and media harvests pick the extra species up without
// re-sampling every hotspot (harvest:species does the same merge, at ~300 calls).
const candidates = JSON.parse(await readFile('data/raw/candidates.json', 'utf8')) as CandidateRecord[]
const allowlist = JSON.parse(await readFile('data/species-allowlist.json', 'utf8')) as Allowlist
const merged = mergeAllowlist(candidates, allowlist)
await writeFile('data/raw/candidates.json', JSON.stringify(merged, null, 2))
console.log(`${merged.length} candidates (${merged.length - candidates.length} added from the allow-list)`)
