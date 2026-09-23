import { judge, buildHint, fieldMarkFor, MAX_MISSES } from './identify'
import { SPECIES } from '../birds/species'

const names = (c: string) => ({ y00475: 'American Coot', mallar3: 'Mallard', grbher3: 'Great Blue Heron', gadwal: 'Gadwall' })[c] ?? c

describe('judge', () => {
  it('is correct when the guess matches', () => {
    expect(judge({ targetId: 1, species: 'y00475', misses: 0 }, 'y00475', SPECIES, names)).toEqual({ result: 'correct' })
  })
  it('counts a miss and returns a hint about the guessed species', () => {
    const j = judge({ targetId: 1, species: 'y00475', misses: 0 }, 'mallar3', SPECIES, names)
    expect(j.result).toBe('wrong')
    if (j.result !== 'wrong') return
    expect(j.session.misses).toBe(1)
    expect(j.hint).toContain('Mallard')
    expect(j.hint).not.toContain('Coot')
  })
  it('guessing the same wrong species twice counts two misses', () => {
    let s = { targetId: 1, species: 'y00475', misses: 0 }
    const a = judge(s, 'mallar3', SPECIES, names)
    if (a.result !== 'wrong') throw new Error()
    const b = judge(a.session, 'mallar3', SPECIES, names)
    if (b.result !== 'wrong') throw new Error()
    expect(b.session.misses).toBe(2)
    expect(b.hint).not.toBe(a.hint)
  })
  it('reveals on the third miss regardless of which species were guessed', () => {
    const s = { targetId: 1, species: 'y00475', misses: MAX_MISSES - 1 }
    expect(judge(s, 'grbher3', SPECIES, names)).toEqual({ result: 'revealed', species: 'y00475' })
  })
  it('falls back to a generic hint when a species has no spec', () => {
    const j = judge({ targetId: 1, species: 'gadwal', misses: 0 }, 'mallar3', SPECIES, names)
    if (j.result !== 'wrong') throw new Error()
    expect(j.hint).toMatch(/Look again/)
  })
})

describe('buildHint', () => {
  const coot = SPECIES['y00475']!.marks, mallard = SPECIES['mallar3']!.marks
  it('names the first differing mark, phrased about the guess', () => {
    expect(buildHint('Mallard', mallard, coot, 0)).toBe(`Not a Mallard. Check the size: a Mallard is ${mallard.size}.`)
  })
  it('moves to the next differing mark on later misses', () => {
    expect(buildHint('Mallard', mallard, coot, 1)).toBe(`Not a Mallard. Check the bill: a Mallard has ${mallard.bill}.`)
  })
})

describe('fieldMarkFor', () => {
  it('returns the bill mark for a known species and null otherwise', () => {
    expect(fieldMarkFor('y00475', SPECIES)).toBe(SPECIES['y00475']!.marks.bill)
    expect(fieldMarkFor('gadwal', SPECIES)).toBeNull()
  })
})
