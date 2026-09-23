import type { CandidateRecord } from './taxonomy'

export type Allowlist = Record<string, string[]>

/** Placeholder frequency for species the sample missed: the harvest's own floor. */
const ALLOWLIST_FREQUENCY = 0.15

export function mergeAllowlist(
  candidates: readonly CandidateRecord[],
  allowlist: Allowlist,
): CandidateRecord[] {
  const out = candidates.map(c => ({ ...c, habitats: [...c.habitats] }))
  for (const [code, habitats] of Object.entries(allowlist)) {
    const existing = out.find(c => c.speciesCode === code)
    if (existing) {
      for (const h of habitats) if (!existing.habitats.includes(h)) existing.habitats.push(h)
    } else {
      out.push({
        speciesCode: code,
        habitats: [...habitats],
        frequency: ALLOWLIST_FREQUENCY,
        monthly: Array(12).fill(ALLOWLIST_FREQUENCY),
      })
    }
  }
  return out
}
