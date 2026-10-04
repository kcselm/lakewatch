import { formationOffsets, laneCrossing, createFlyover, flightFor, PELICAN_FLIGHT, type Bouts } from './flyover'
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

describe('flap and glide', () => {
  const bouts: Bouts = { flap: [3, 5], glide: [4, 8], delay: 0.4, ease: 0.5, sink: 0.6 }
  const opts = { count: 6, formation: 'line' as const, everySeconds: [1, 2] as [number, number], wingbeatHz: 2.5, bouts }
  const dt = 0.02

  /** One crossing, from its first frame to its last: each frame's time and every member's glide, phase and height. */
  function crossing(seed: number, o: Parameters<typeof createFlyover>[2] = opts) {
    const c = createFlyover(lane, makeRng(seed), o)
    while (c.state === 'waiting') c.update(dt)
    const frames: { t: number; glide: number[]; phase: number[]; y: number[] }[] = []
    for (let t = 0; c.state === 'crossing'; t += dt) {
      frames.push({ t, glide: c.members.map(m => m.glide), phase: c.members.map(m => m.wingPhase), y: c.members.map(m => m.y) })
      c.update(dt)
    }
    return frames
  }
  /** The times bird i goes from flapping into a glide. */
  const starts = (frames: ReturnType<typeof crossing>, i: number) =>
    frames.filter((f, k) => k > 0 && f.glide[i]! > 0 && frames[k - 1]!.glide[i] === 0).map(f => f.t)

  it('the leader flaps and glides by turns, each for as long as its bouts say', () => {
    const frames = crossing(3)
    const gliding = frames.map(f => f.glide[0]! > 0)
    expect(gliding[0]).toBe(false)
    const runs: { gliding: boolean; seconds: number }[] = []
    gliding.forEach(g => {
      const last = runs[runs.length - 1]
      if (last && last.gliding === g) last.seconds += dt
      else runs.push({ gliding: g, seconds: dt })
    })
    expect(runs.length).toBeGreaterThanOrEqual(4)
    // every bout but the last, which the crossing's end cuts short
    for (const r of runs.slice(0, -1)) {
      const [lo, hi] = r.gliding ? bouts.glide : bouts.flap
      expect(r.seconds).toBeGreaterThan(lo - 3 * dt)
      expect(r.seconds).toBeLessThan(hi + 3 * dt)
    }
  })
  it('each bird behind starts its glide the delay after the bird ahead, so the bout passes down the line', () => {
    const frames = crossing(4)
    const lead = starts(frames, 0)
    expect(lead.length).toBeGreaterThanOrEqual(2)
    for (let i = 1; i < opts.count; i++) {
      const mine = starts(frames, i)
      expect(mine[0]! - lead[0]!).toBeCloseTo(i * bouts.delay, 1)
      expect(mine[1]! - lead[1]!).toBeCloseTo(i * bouts.delay, 1)
    }
  })
  it('eases into a glide and out of it, and holds the wings still between', () => {
    const frames = crossing(5)
    for (let k = 1; k < frames.length; k++) {
      for (let i = 0; i < opts.count; i++) {
        const g = frames[k]!.glide[i]!
        expect(g).toBeGreaterThanOrEqual(0)
        expect(g).toBeLessThanOrEqual(1)
        // no jump: at most the smoothstep's steepest slope, 1.5 / ease, for a frame
        expect(Math.abs(g - frames[k - 1]!.glide[i]!)).toBeLessThan((1.5 / bouts.ease) * dt + 1e-9)
        if (g > 0) expect(frames[k]!.phase[i]).toBe(0)
      }
    }
    expect(Math.max(...frames.map(f => f.glide[0]!))).toBe(1)
  })
  it('starts each bout of flapping with the wings level, every bird in turn', () => {
    const frames = crossing(6)
    for (let i = 0; i < opts.count; i++) {
      const resumes = frames.filter((f, k) => k > 0 && f.glide[i] === 0 && frames[k - 1]!.glide[i]! > 0)
      expect(resumes.length).toBeGreaterThanOrEqual(1)
      for (const f of resumes) expect(f.phase[i]!).toBeLessThan(opts.wingbeatHz * dt + 1e-9)
    }
  })
  it('sinks through a glide and regains it flapping, never by more than the sink', () => {
    const still = crossing(7, { ...opts, bouts: { ...bouts, sink: 0 } })
    const frames = crossing(7)
    let deepest = 0
    frames.forEach((f, k) => {
      const sag = still[k]!.y[0]! - f.y[0]!
      expect(sag).toBeGreaterThanOrEqual(-1e-9)
      expect(sag).toBeLessThanOrEqual(bouts.sink + 1e-9)
      deepest = Math.max(deepest, sag)
    })
    expect(deepest).toBeGreaterThan(0.9 * bouts.sink)
    // back at its height before the next glide
    const k = frames.findIndex((f, j) => j > 0 && f.glide[0]! > 0 && frames[j - 1]!.glide[0] === 0 && f.t > bouts.flap[1] + bouts.glide[0])
    expect(still[k - 1]!.y[0]! - frames[k - 1]!.y[0]!).toBeCloseTo(0, 6)
  })
  it('leaves a flock with no bouts flapping all the way, each bird at its own phase, as it always has', () => {
    const o = { count: 9, formation: 'vee' as const, everySeconds: [10, 20] as [number, number], wingbeatHz: 2.6 }
    const a = createFlyover(lane, makeRng(2), o), b = createFlyover(lane, makeRng(2), { ...o, bouts: undefined })
    for (let k = 0; k < 400; k++) {
      a.update(0.1); b.update(0.1)
      expect(a.members.map(m => [m.x, m.y, m.z, m.wingPhase, m.glide])).toEqual(b.members.map(m => [m.x, m.y, m.z, m.wingPhase, m.glide]))
      expect(a.members.every(m => m.glide === 0)).toBe(true)
    }
    const c = createFlyover(lane, makeRng(2), o)
    while (c.state === 'waiting') c.update(0.1)
    expect(new Set(c.members.map(m => m.wingPhase.toFixed(3))).size).toBeGreaterThan(5)
  })
  it('a species with no style of its own flies with its neck stretched, at the defaults', () => {
    expect(flightFor('cangoo')).toEqual({ neck: 1 })
    expect(flightFor(undefined)).toEqual({ neck: 1 })
    expect(flightFor('toString')).toEqual({ neck: 1 })
  })
  it("the pelican's line: the head on the shoulders, a wingspan and more between birds, and flapping 60-75% of the way", () => {
    expect(flightFor('amwpel')).toBe(PELICAN_FLIGHT)
    expect(PELICAN_FLIGHT.neck).toBe(0)
    // 2.67 m from wingtip to wingtip: no two birds' wings overlap along the line
    expect(PELICAN_FLIGHT.spacing! * Math.hypot(0.9, 0.35)).toBeGreaterThan(2.67)
    const B = PELICAN_FLIGHT.bouts!
    // a glide is long enough to settle into and come out of
    expect(B.glide[0]).toBeGreaterThanOrEqual(2 * B.ease)
    let flapping = 0, all = 0
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const frames = crossing(seed, { count: 9, formation: 'line', everySeconds: [1, 2], wingbeatHz: 2.7, speed: PELICAN_FLIGHT.speed, spacing: PELICAN_FLIGHT.spacing, bouts: B })
      for (const f of frames) for (const g of f.glide) { all++; if (g === 0) flapping++ }
    }
    expect(flapping / all).toBeGreaterThan(0.6)
    expect(flapping / all).toBeLessThan(0.75)
  })
})
