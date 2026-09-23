import { describe, it, expect } from 'vitest'
import { makeRng, shuffle, pickOne, sampleWithout } from './rng'

describe('makeRng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = makeRng(42), b = makeRng(42)
    const seqA = [a(), a(), a()], seqB = [b(), b(), b()]
    expect(seqA).toEqual(seqB)
  })

  it('produces different sequences for different seeds', () => {
    expect(makeRng(1)()).not.toBe(makeRng(2)())
  })

  it('stays within [0, 1)', () => {
    const rng = makeRng(7)
    for (let i = 0; i < 200; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('shuffle', () => {
  it('returns a permutation of the input', () => {
    const input = [1, 2, 3, 4, 5]
    expect([...shuffle(input, makeRng(3))].sort()).toEqual(input)
  })

  it('does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5]
    shuffle(input, makeRng(3))
    expect(input).toEqual([1, 2, 3, 4, 5])
  })

  it('is deterministic under the same seed', () => {
    expect(shuffle([1,2,3,4,5], makeRng(9))).toEqual(shuffle([1,2,3,4,5], makeRng(9)))
  })
})

describe('sampleWithout', () => {
  it('returns n distinct items', () => {
    const out = sampleWithout([1,2,3,4,5], 3, makeRng(4))
    expect(out).toHaveLength(3)
    expect(new Set(out).size).toBe(3)
  })

  it('caps at the pool size when n exceeds it', () => {
    expect(sampleWithout([1,2], 5, makeRng(4))).toHaveLength(2)
  })
})

describe('pickOne', () => {
  it('returns a member of the array', () => {
    expect([1,2,3]).toContain(pickOne([1,2,3], makeRng(11)))
  })
})
