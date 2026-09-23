import { describe, it, expect } from 'vitest'
import { sampleDates, summarize, selectPerHabitat } from './frequency'

describe('sampleDates', () => {
  it('returns the 1st and 15th of every month', () => {
    const dates = sampleDates(2025)
    expect(dates).toHaveLength(24)
    expect(dates[0]).toEqual({ year: 2025, month: 1, day: 1 })
    expect(dates[1]).toEqual({ year: 2025, month: 1, day: 15 })
    expect(dates[23]).toEqual({ year: 2025, month: 12, day: 15 })
  })
})

describe('summarize', () => {
  const s = (month: number, observed: string[]) => ({ month, observed })

  it('divides sightings by the number of dates with any report', () => {
    const out = summarize([s(1, ['a', 'b']), s(1, ['a']), s(2, ['a']), s(2, ['c'])])
    expect(out.get('a')!.frequency).toBe(0.75)
    expect(out.get('b')!.frequency).toBe(0.25)
    expect(out.get('c')!.frequency).toBe(0.25)
  })

  it('ignores dates with no checklists in the denominator', () => {
    // Two dates had reports, two had none. `a` was seen on both real dates.
    const out = summarize([s(1, ['a']), s(1, []), s(2, ['a']), s(2, [])])
    expect(out.get('a')!.frequency).toBe(1)
  })

  it('counts a species once per date even if listed twice', () => {
    expect(summarize([s(1, ['a', 'a']), s(1, ['b'])]).get('a')!.frequency).toBe(0.5)
  })

  it('computes per-month presence', () => {
    const out = summarize([s(1, ['a']), s(1, ['a']), s(6, ['b']), s(6, ['a'])])
    const m = out.get('a')!.monthly
    expect(m).toHaveLength(12)
    expect(m[0]).toBe(1)    // January: seen on 2 of 2 reporting dates
    expect(m[5]).toBe(0.5)  // June: 1 of 2
    expect(m[11]).toBe(0)   // December: no samples at all
  })

  it('returns an empty map for no samples', () => {
    expect(summarize([]).size).toBe(0)
  })
})

describe('selectPerHabitat', () => {
  const st = (frequency: number, monthly: number[] = Array(12).fill(frequency)) =>
    ({ frequency, monthly })
  const opts = { minFrequency: 0.25, maxPerHabitat: 50 }

  it('admits every species reported often enough', () => {
    const out = selectPerHabitat({
      forest: new Map([['a', st(0.9)], ['b', st(0.5)], ['c', st(0.1)]]),
    }, opts)
    expect([...out.keys()].sort()).toEqual(['a', 'b'])
  })

  it('holds a thin habitat to the same bar as a rich one', () => {
    // The old top-n rule admitted `thin`'s thirtieth-best bird at f=0.1 while
    // cutting `rich`'s at f=0.5. The bar is the frequency, not the ranking.
    const out = selectPerHabitat({
      rich: new Map([['a', st(0.9)], ['b', st(0.6)], ['c', st(0.3)]]),
      thin: new Map([['d', st(0.1)]]),
    }, opts)
    expect([...out.keys()].sort()).toEqual(['a', 'b', 'c'])
  })

  it('caps a habitat that would otherwise run away, keeping the most frequent', () => {
    const out = selectPerHabitat({
      forest: new Map([['a', st(0.9)], ['b', st(0.6)], ['c', st(0.4)]]),
    }, { minFrequency: 0.25, maxPerHabitat: 2 })
    expect([...out.keys()].sort()).toEqual(['a', 'b'])
  })

  it('merges habitats for a species present in several', () => {
    const out = selectPerHabitat({
      forest: new Map([['a', st(0.9)]]),
      wetland: new Map([['a', st(0.4)]]),
    }, opts)
    expect(out.get('a')!.habitats.sort()).toEqual(['forest', 'wetland'])
  })

  it('keeps the highest frequency and monthly values across habitats', () => {
    const out = selectPerHabitat({
      forest: new Map([['a', st(0.9, [0.9, 0, ...Array(10).fill(0)])]]),
      wetland: new Map([['a', st(0.4, [0, 0.4, ...Array(10).fill(0)])]]),
    }, opts)
    expect(out.get('a')!.frequency).toBe(0.9)
    expect(out.get('a')!.monthly.slice(0, 2)).toEqual([0.9, 0.4])
  })

  it('excludes a habitat where the species is too scarce', () => {
    const out = selectPerHabitat({
      forest: new Map([['a', st(0.8)], ['b', st(0.9)]]),
      wetland: new Map([['a', st(0.9)], ['b', st(0.1)]]),
    }, opts)
    expect(out.get('b')!.habitats).toEqual(['forest'])
  })
})
