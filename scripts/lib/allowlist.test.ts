import { mergeAllowlist } from './allowlist'
import type { CandidateRecord } from './taxonomy'

const sampled: CandidateRecord[] = [
  { speciesCode: 'mallar3', habitats: ['wetland'], frequency: 0.9, monthly: Array(12).fill(0.9) },
]

describe('mergeAllowlist', () => {
  it('appends species missing from the sample with the allow-listed habitats', () => {
    const out = mergeAllowlist(sampled, { amwpel: ['wetland'] })
    expect(out.map(c => c.speciesCode)).toEqual(['mallar3', 'amwpel'])
    expect(out[1]).toMatchObject({ habitats: ['wetland'], frequency: 0.15 })
    expect(out[1]!.monthly).toHaveLength(12)
  })

  it('adds habitats to a species already in the sample without duplicating it', () => {
    const out = mergeAllowlist(sampled, { mallar3: ['wetland', 'urban'] })
    expect(out).toHaveLength(1)
    expect(out[0]!.habitats).toEqual(['wetland', 'urban'])
    expect(out[0]!.frequency).toBe(0.9)
  })
})
