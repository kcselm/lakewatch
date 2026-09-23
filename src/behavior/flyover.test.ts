import { formationOffsets, laneCrossing, createFlyover } from './flyover'
import { makeRng } from '../catalog/rng'
import type { LaneZone } from '../location/schema'

const lane: LaneZone = { kind: 'lane', from: [-160, 0, -90], to: [160, 0, -60], altitude: [40, 80] }

describe('formationOffsets', () => {
  it('line: the leader at the origin, each bird behind and beside the last', () => {
    const o = formationOffsets('line', 5, 2)
    expect(o[0]).toEqual({ forward: 0, lateral: 0, up: 0 })
    for (let i = 1; i < o.length; i++) {
      expect(o[i]!.forward).toBeLessThan(o[i - 1]!.forward)
      expect(o[i]!.lateral).toBeGreaterThan(o[i - 1]!.lateral)
    }
  })
  it('vee: the leader at the point, arms alternating left and right, symmetric', () => {
    const o = formationOffsets('vee', 7, 2)
    expect(o[0]).toEqual({ forward: 0, lateral: 0, up: 0 })
    expect(o.reduce((s, x) => s + x.lateral, 0)).toBeCloseTo(0, 9)
    expect(o[1]!.lateral).toBeCloseTo(-o[2]!.lateral, 9)
    expect(o[1]!.forward).toBe(o[2]!.forward)
    expect(o[3]!.forward).toBeLessThan(o[1]!.forward)
    expect(o.slice(1).every(x => x.forward < 0)).toBe(true)
  })
})

describe('laneCrossing', () => {
  it('runs from one end of the lane to the other at an altitude inside the band', () => {
    const ends = new Set<string>()
    for (let seed = 0; seed < 20; seed++) {
      const c = laneCrossing(lane, makeRng(seed))
      expect(c.start[1]).toBeGreaterThanOrEqual(40)
      expect(c.start[1]).toBeLessThanOrEqual(80)
      expect(c.end[1]).toBe(c.start[1])
      const pair = [c.start[0], c.end[0]].join(',')
      expect(['-160,160', '160,-160']).toContain(pair)
      ends.add(pair)
      expect(Math.sign(Math.cos(c.heading))).toBe(Math.sign(c.end[0] - c.start[0]))
      expect(c.length).toBeCloseTo(Math.hypot(320, 30), 6)
    }
    expect(ends.size).toBe(2)
  })
})

describe('createFlyover', () => {
  const opts = { count: 9, formation: 'vee' as const, everySeconds: [10, 20] as [number, number], wingbeatHz: 2.6 }

  function run(seed: number, seconds: number, dt = 0.1) {
    const c = createFlyover(lane, makeRng(seed), opts)
    const log: { t: number; state: string }[] = []
    for (let t = 0; t < seconds; t += dt) {
      c.update(dt)
      log.push({ t, state: c.state })
      if (c.state === 'crossing') {
        for (const m of c.members) {
          expect(m.y).toBeGreaterThanOrEqual(39)
          expect(m.y).toBeLessThanOrEqual(81)
          expect(Math.abs(m.x)).toBeLessThan(160 + 40)
          expect(m.wingPhase).toBeGreaterThanOrEqual(0)
          expect(m.wingPhase).toBeLessThan(1)
          expect(m.heading).toBe(c.heading)
        }
      }
    }
    return { c, log }
  }

  it('waits, crosses, and waits again within the configured interval', () => {
    const { log } = run(1, 200)
    const starts = log.filter((e, i) => e.state === 'crossing' && log[i - 1]?.state === 'waiting').map(e => e.t)
    const ends = log.filter((e, i) => e.state === 'waiting' && log[i - 1]?.state === 'crossing').map(e => e.t)
    expect(starts.length).toBeGreaterThanOrEqual(2)
    expect(ends.length).toBeGreaterThanOrEqual(1)
    const gap = starts[1]! - ends[0]!
    expect(gap).toBeGreaterThanOrEqual(10 - 0.2)
    expect(gap).toBeLessThanOrEqual(20 + 0.2)
  })

  it('members flap out of phase with each other and the flock advances along the lane', () => {
    const c = createFlyover(lane, makeRng(2), opts)
    let guard = 0
    while (c.state !== 'crossing' && guard++ < 10000) c.update(0.1)
    const x0 = c.x
    c.update(0.5)
    expect(Math.abs(c.x - x0)).toBeGreaterThan(5)
    expect(new Set(c.members.map(m => m.wingPhase.toFixed(3))).size).toBeGreaterThan(3)
  })

  it('is deterministic per seed', () => {
    const a = run(5, 60).log, b = run(5, 60).log
    expect(a).toEqual(b)
  })
})
