import { emptyLifeList, recordSighting, seenState, summary, JOURNAL_LIMIT } from './lifeList'

const base = { location: 'willow-lake', timeOfDay: 'morning', at: '2026-09-22T14:00:00Z' }

describe('recordSighting', () => {
  it('creates a species record on first sighting and does not mutate the input', () => {
    const d0 = emptyLifeList()
    const d1 = recordSighting(d0, { ...base, species: 'y00475', selfIdentified: true, wrongGuesses: 1 })
    expect(d0.species).toEqual({})
    expect(d1.species['y00475']).toEqual({ firstSeenAt: base.at, firstSeenLocation: 'willow-lake', selfIdentified: 1, revealed: 0, wrongGuesses: 1 })
    expect(d1.journal).toHaveLength(1)
  })
  it('accumulates counts and keeps the first-seen date', () => {
    let d = recordSighting(emptyLifeList(), { ...base, species: 'y00475', selfIdentified: false, wrongGuesses: 3 })
    d = recordSighting(d, { ...base, at: '2026-09-23T00:00:00Z', species: 'y00475', selfIdentified: true, wrongGuesses: 0 })
    expect(d.species['y00475']).toMatchObject({ firstSeenAt: base.at, selfIdentified: 1, revealed: 1, wrongGuesses: 3 })
  })
  it('caps the journal at the limit, dropping the oldest', () => {
    let d = emptyLifeList()
    for (let i = 0; i < JOURNAL_LIMIT + 5; i++) d = recordSighting(d, { ...base, at: String(i), species: 'y00475', selfIdentified: true, wrongGuesses: 0 })
    expect(d.journal).toHaveLength(JOURNAL_LIMIT)
    expect(d.journal[0]!.at).toBe('5')
  })
})

describe('seenState and summary', () => {
  it('marks self once any self-identification exists, otherwise revealed', () => {
    let d = recordSighting(emptyLifeList(), { ...base, species: 'a', selfIdentified: false, wrongGuesses: 3 })
    d = recordSighting(d, { ...base, species: 'b', selfIdentified: true, wrongGuesses: 0 })
    d = recordSighting(d, { ...base, species: 'a', selfIdentified: true, wrongGuesses: 0 })
    expect(seenState(d)).toEqual({ a: 'self', b: 'self' })
    const d2 = recordSighting(emptyLifeList(), { ...base, species: 'c', selfIdentified: false, wrongGuesses: 3 })
    expect(seenState(d2)).toEqual({ c: 'revealed' })
  })
  it('summarises seen count against the location list and accuracy', () => {
    let d = recordSighting(emptyLifeList(), { ...base, species: 'a', selfIdentified: true, wrongGuesses: 1 })
    d = recordSighting(d, { ...base, species: 'zz', selfIdentified: true, wrongGuesses: 0 })
    const s = summary(d, ['a', 'b', 'c'])
    expect(s).toEqual({ seen: 1, total: 3, accuracy: 2 / 3 })
    expect(summary(emptyLifeList(), ['a']).accuracy).toBeNull()
  })
})
