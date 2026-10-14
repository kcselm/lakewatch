import { createCallScheduler, CALL_SCHEDULES, MAX_SIMULTANEOUS_CALLS, ASKED_ONLY } from './calls'
import { makeRng } from '../catalog/rng'

const bird = (id: number, species: string, distance: number) => ({ id, species, distance })

describe('createCallScheduler', () => {
  it('respects a species\' minimum interval', () => {
    const s = createCallScheduler(makeRng(1))
    const heron = [bird(1, 'grbher3', 60)]
    const times: number[] = []
    for (let now = 0; now < 1200; now += 1) if (s.tick(now, heron, 0).length) times.push(now)
    expect(times.length).toBeGreaterThan(2)
    for (let i = 1; i < times.length; i++) expect(times[i]! - times[i - 1]!).toBeGreaterThanOrEqual(CALL_SCHEDULES['grbher3']!.every[0])
  })

  it('caps simultaneous calls and lets the nearest birds win', () => {
    const s = createCallScheduler(makeRng(2))
    const coots = [bird(1, 'y00475', 40), bird(2, 'y00475', 5), bird(3, 'y00475', 12), bird(4, 'y00475', 80), bird(5, 'y00475', 9)]
    s.tick(0, coots, 0)                    // first tick only staggers the schedule
    const out = s.tick(1e6, coots, 1)      // everything is overdue; one slot is taken
    expect(out).toHaveLength(MAX_SIMULTANEOUS_CALLS - 1)
    expect(out.map(r => r.id)).toEqual([2, 5])
  })

  it('a bird crowded out retries within a few seconds, not a full interval', () => {
    const s = createCallScheduler(makeRng(3), { max: 1 })
    const pair = [bird(1, 'y00475', 5), bird(2, 'y00475', 20)]
    s.tick(0, pair, 0)
    expect(s.tick(1e6, pair, 0).map(r => r.id)).toEqual([1])
    const retry: number[] = []
    for (let t = 1; t <= 8; t++) retry.push(...s.tick(1e6 + t, pair, 0).map(r => r.id))
    expect(retry).toContain(2)
  })

  it('carries the species preference and defaults unknown species', () => {
    const s = createCallScheduler(makeRng(4))
    const birds = [bird(1, 'marwre', 5), bird(2, 'zzz', 6)]
    s.tick(0, birds, 0)
    const out = s.tick(1e6, birds, 0)
    expect(out.find(r => r.id === 1)?.prefer).toBe('song')
    expect(out.find(r => r.id === 2)?.prefer).toBe('any')
  })

  describe('a species only ever asked for', () => {
    it('never times a red-winged blackbird: their checks and songs come only when their behaviour asks', () => {
      expect(ASKED_ONLY.has('rewbla')).toBe(true)
      expect(CALL_SCHEDULES['rewbla']).toBeUndefined()
      const s = createCallScheduler(makeRng(21))
      const bed = [bird(1, 'rewbla', 9), bird(2, 'rewbla', 11), bird(3, 'rewbla', 14), bird(4, 'rewbla', 7), bird(5, 'rewbla', 12)]
      const species = new Map<number, string>()
      for (let now = 0; now < 3600; now += 0.5) for (const r of s.tick(now, [...bed, bird(6, 'marwre', 20)], 0)) species.set(r.id, r.species)
      expect([...species.values()]).toEqual(['marwre'])    // the Marsh Wren keeps its timed song
    })
    it('plays its asks under the cap like any other: nearest first, the rest dropped', () => {
      const s = createCallScheduler(makeRng(22))
      const bed = [bird(1, 'rewbla', 9), bird(2, 'rewbla', 11), bird(3, 'rewbla', 14), bird(4, 'rewbla', 7), bird(5, 'rewbla', 12)]
      s.tick(0, bed, 0)
      for (const b of bed) s.ask(b.id)
      expect(s.tick(0.1, bed, 1).map(r => r.id)).toEqual([4, 1])         // two slots left of three
      expect(s.tick(0.2, bed, 0)).toEqual([])                            // the dropped asks are gone
      s.ask(3)
      expect(s.tick(0.3, bed, MAX_SIMULTANEOUS_CALLS)).toEqual([])       // no room: dropped
      s.ask(3)
      expect(s.tick(0.4, bed, 0).map(r => r.id)).toEqual([3])
    })
    it('is a setting: a scheduler told of none times the blackbirds, and one told of the wren never times it', () => {
      const birds = [bird(1, 'rewbla', 5), bird(2, 'marwre', 6)]
      const timed = createCallScheduler(makeRng(23), { askedOnly: new Set() })
      timed.tick(0, birds, 0)
      expect(timed.tick(1e6, birds, 0).map(r => r.id).sort()).toEqual([1, 2])
      const quietWren = createCallScheduler(makeRng(23), { askedOnly: new Set(['marwre', 'rewbla']) })
      for (let now = 0; now < 600; now += 1) expect(quietWren.tick(now, birds, 0)).toEqual([])
    })
  })

  it('the dowitcher and Pectoral prefer calls, so autumn never plays their breeding songs', () => {
    expect(CALL_SCHEDULES['lobdow']?.prefer).toBe('call')
    expect(CALL_SCHEDULES['pecsan']?.prefer).toBe('call')
    const s = createCallScheduler(makeRng(5))
    const birds = [bird(1, 'lobdow', 5), bird(2, 'pecsan', 6)]
    s.tick(0, birds, 0)
    const out = s.tick(1e6, birds, 0)
    expect(out.find(r => r.id === 1)?.prefer).toBe('call')
    expect(out.find(r => r.id === 2)?.prefer).toBe('call')
  })

  it('never has a pelican call: adults are silent away from their colonies', () => {
    const s = createCallScheduler(makeRng(5))
    const birds = [bird(1, 'amwpel', 5), bird(2, 'amwpel', 6), bird(3, 'killde', 50)]
    const ids = new Set<number>()
    for (let now = 0; now < 3600; now += 0.5) for (const r of s.tick(now, birds, 0)) ids.add(r.id)
    expect([...ids]).toEqual([3])
    expect(CALL_SCHEDULES['amwpel']).toBeUndefined()
    // and a scheduler told of no silent species lets it call, at the default cadence
    const loud = createCallScheduler(makeRng(5), { silent: new Set() })
    loud.tick(0, birds, 0)
    expect(loud.tick(1e6, birds, 0).map(r => r.id)).toContain(1)
  })

  describe('a call a behaviour asks for', () => {
    it('plays at once, ahead of the birds whose time has come, nearest first among those asked', () => {
      const s = createCallScheduler(makeRng(11))
      const coots = [bird(1, 'y00475', 5), bird(2, 'y00475', 8), bird(3, 'belkin1', 40), bird(4, 'belkin1', 30)]
      s.tick(0, coots, 0)
      s.ask(3); s.ask(4)
      expect(s.tick(1e6, coots, 1).map(r => r.id)).toEqual([4, 3])          // two slots: both asked, none timed
    })
    it("plays when nothing is due, with the species' preference", () => {
      const s = createCallScheduler(makeRng(12))
      const kf = [bird(3, 'belkin1', 40)]
      s.tick(0, kf, 0)
      s.ask(3)
      expect(s.tick(0.1, kf, 0)).toEqual([{ id: 3, species: 'belkin1', prefer: CALL_SCHEDULES['belkin1']!.prefer }])
    })
    it('is dropped, not kept for later, when the cap has no room: a call tied to a moment would be wrong late', () => {
      const s = createCallScheduler(makeRng(13))
      const kf = [bird(3, 'belkin1', 40)]
      s.tick(0, kf, 0)
      s.ask(3)
      expect(s.tick(0.1, kf, MAX_SIMULTANEOUS_CALLS)).toEqual([])
      expect(s.tick(0.2, kf, 0)).toEqual([])
    })
    it("puts the bird's next timed call off by a full interval", () => {
      const s = createCallScheduler(makeRng(14))
      const kf = [bird(3, 'belkin1', 40)]
      s.tick(0, kf, 0)
      s.ask(3)
      const at = 500
      expect(s.tick(at, kf, 0)).toHaveLength(1)
      for (let now = at + 1; now < at + CALL_SCHEDULES['belkin1']!.every[0]; now += 1) expect(s.tick(now, kf, 0)).toEqual([])
    })
    it('is not played for a bird not offered (out of sight) or of a species silent here', () => {
      const s = createCallScheduler(makeRng(15))
      const birds = [bird(1, 'amwpel', 5)]
      s.tick(0, birds, 0)
      s.ask(1); s.ask(9)
      expect(s.tick(0.1, birds, 0)).toEqual([])
      expect(s.tick(0.2, [...birds, bird(9, 'belkin1', 30)], 0).map(r => r.id)).toEqual([])   // the ask before it was offered is gone
    })
  })

  it('is deterministic per seed', () => {
    const run = (seed: number) => {
      const s = createCallScheduler(makeRng(seed))
      const birds = [bird(1, 'killde', 10), bird(2, 'mallar3', 20)]
      const log: string[] = []
      for (let now = 0; now < 300; now += 0.5) for (const r of s.tick(now, birds, 0)) log.push(`${now}:${r.id}`)
      return log
    }
    expect(run(9)).toEqual(run(9))
    expect(run(9)).not.toEqual(run(10))
  })
})
