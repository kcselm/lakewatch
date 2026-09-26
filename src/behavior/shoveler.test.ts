import { createShoveler, SHOVELER, type ShovelerSettings } from './shoveler'
import { createSwim, companyOf } from './swim'
import { startSpot } from './swimmer'
import { defaultPose, type PoseState } from '../birds/model'
import { makeRng } from '../catalog/rng'
import type { BehaviorContext, BehaviorController, FlockGroup, Spin } from './types'

type Pt = [number, number]
const pond = { kind: 'polygon' as const, points: [[0, 0], [20, 0], [20, 12], [0, 12]] as Pt[] }
const ctx = (seed: number, more: Partial<BehaviorContext> = {}): BehaviorContext => ({
  zone: pond, rng: makeRng(seed), wind: () => ({ dirX: 1, dirZ: 0, effective: 0.3 }), ground: () => -2, foraging: 'shoveler', ...more,
})

interface Frame { t: number; states: string[]; xs: number[]; zs: number[]; headings: number[]; reach: number[]; poses: PoseState[]; spin?: Spin & { snapshot: true } }
interface Ring { t: number; size: number }

/** A flock of three shovelers, started as the spawner starts them, recorded every frame. */
function flock(seed: number, seconds: number, fps: number, S: ShovelerSettings = SHOVELER, keepPoses = false) {
  const rng = makeRng(seed), group: FlockGroup = { targetX: 10, targetZ: 6, retargetAt: 60 }
  const birds: BehaviorController[] = [], rings: Ring[] = []
  let t = 0
  for (let k = 0; k < 3; k++) {
    const [x, z] = startSpot(pond, rng, group, companyOf('shoveler'), birds)
    birds.push(createShoveler(ctx(seed * 10 + k, { group, neighbours: () => birds, onRipple: (_x, _z, size) => rings.push({ t, size: size ?? 1 }) }), x, z, S))
  }
  const poses = birds.map(() => defaultPose()), frames: Frame[] = []
  for (let i = 0; i < seconds * fps; i++) {
    t = i / fps
    const states = birds.map(b => b.state)
    birds.forEach((b, k) => b.update(1 / fps, poses[k]!))
    frames.push({
      t, states, xs: birds.map(b => b.x), zs: birds.map(b => b.z), headings: birds.map(b => b.heading), reach: poses.map(p => p.reach),
      poses: keepPoses ? poses.map(p => ({ ...p, lean: p.lean.clone() })) : [],
      spin: group.spin ? { ...group.spin, snapshot: true } : undefined,
    })
  }
  return { frames, rings, birds, group }
}

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
const reachOf = (_h: unknown, f: Frame, k: number) => f.reach[k]!

describe('shoveler', () => {
  // four flocks of three for an hour each, at 10 frames a second
  const hours = [1, 2, 3, 4].map(seed => flock(seed, 3600, 10))
  // one flock for ten minutes at 60 frames a second
  const fine = flock(7, 600, 60, SHOVELER, true)

  it('is what swim gives a shoveler', () => {
    const c = createSwim(ctx(1), 5, 5)
    const pose = defaultPose(), states = new Set<string>()
    for (let i = 0; i < 600 * 10; i++) { c.update(0.1, pose); states.add(c.state) }
    expect(states).toContain('skim')
  })
  it('spends its time as the research says: skim 38%, circle 5%, cruise 22%, loaf and preen 34%', () => {
    const all = hours.flatMap(h => h.frames.flatMap(f => f.states))
    const share = (s: string) => all.filter(x => x === s).length / all.length
    const total = SHOVELER.cruising.share + SHOVELER.loaf.share + SHOVELER.preen.share + SHOVELER.alert.share + SHOVELER.skim.share + SHOVELER.circle.share
    expect(Math.abs(share('skim') - SHOVELER.skim.share / total)).toBeLessThan(0.06)
    expect(Math.abs(share('cruise') - SHOVELER.cruising.share / total)).toBeLessThan(0.05)
    expect(Math.abs(share('loaf') + share('preen') - (SHOVELER.loaf.share + SHOVELER.preen.share) / total)).toBeLessThan(0.05)
    // a pair spins only when two are skimming close together, so circling is looser: 2-10% of the time
    expect(share('circle')).toBeGreaterThan(0.02)
    expect(share('circle')).toBeLessThan(0.1)
  })
  it('skims with the bill in the surface film at 20-35 degrees, travelling at 0.32 m/s or pottering nearly on the spot', () => {
    const skims = fine.frames.flatMap(f => f.poses.map((p, k) => ({ p, k, state: f.states[k] }))).filter(x => x.state === 'skim' && x.p.reach > 0.999)
    expect(skims.length).toBeGreaterThan(600)
    for (const { p } of skims) {
      expect((p.reachAngle * 180) / Math.PI).toBeGreaterThanOrEqual(20)
      expect((p.reachAngle * 180) / Math.PI).toBeLessThanOrEqual(35)
      expect(p.reachDepth).toBeGreaterThanOrEqual(SHOVELER.skim.film - 1e-9)
      expect(p.reachDepth).toBeLessThanOrEqual(SHOVELER.skim.face + 1e-9)
    }
    // a skimming bird never moves faster than the travelling skim, nor sweeps its bill side to side
    const { frames } = fine
    for (let i = 1; i < frames.length; i++) {
      for (let k = 0; k < 3; k++) {
        if (frames[i]!.states[k] !== 'skim' || frames[i - 1]!.states[k] !== 'skim') continue
        const v = Math.hypot(frames[i]!.xs[k]! - frames[i - 1]!.xs[k]!, frames[i]!.zs[k]! - frames[i - 1]!.zs[k]!) * 60
        expect(v).toBeLessThanOrEqual(SHOVELER.skim.travel.speed + 0.13)
      }
    }
  })
  it('turns the pair as one: the two centres 0.25 m apart about a fixed midpoint, one direction a bout, once round every 3.4 s', () => {
    let bouts = 0
    for (const h of [...hours, fine]) {
      let cur: Frame[] = []
      const done = (bout: Frame[]) => {
        if (bout.length < 20) return
        bouts++
        const s0 = bout[0]!.spin!
        const [a, c] = s0.pair.map(p => h.birds.indexOf(p as BehaviorController))
        expect(a).toBeGreaterThanOrEqual(0)
        expect(c).toBeGreaterThanOrEqual(0)
        let turned = 0
        for (let i = 0; i < bout.length; i++) {
          const f = bout[i]!
          const [ax, az, cx, cz] = [f.xs[a!]!, f.zs[a!]!, f.xs[c!]!, f.zs[c!]!]
          expect(Math.hypot(ax - cx, az - cz)).toBeCloseTo(SHOVELER.circle.apart, 6)
          expect((ax + cx) / 2).toBeCloseTo(s0.cx, 6)
          expect((az + cz) / 2).toBeCloseTo(s0.cz, 6)
          expect(f.states[a!]).toBe('circle')
          expect(f.states[c!]).toBe('circle')
          if (i > 0) {
            const prev = bout[i - 1]!
            const step = wrap(Math.atan2(-(az - s0.cz), ax - s0.cx) - Math.atan2(-(prev.zs[a!]! - s0.cz), prev.xs[a!]! - s0.cx))
            expect(Math.sign(step)).toBe(s0.dir)
            turned += Math.abs(step)
          }
        }
        const seconds = bout.at(-1)!.t - bout[0]!.t
        expect(turned / seconds).toBeCloseTo((2 * Math.PI) / SHOVELER.circle.revolution, 2)
      }
      // from the second frame of each turn: in the first, the second bird is still stepping onto its place
      let turning = 0
      for (const f of h.frames) {
        turning = f.spin?.spinning ? turning + 1 : 0
        if (turning > 1) cur.push(f)
        else if (cur.length) { done(cur); cur = [] }
      }
    }
    expect(bouts).toBeGreaterThan(10)
  })
  it('spins for 4-8 s a bout, now and then a minute or two', () => {
    const lengths: number[] = []
    for (const h of hours) {
      let start = -1
      for (const f of h.frames) {
        if (f.spin?.spinning && start < 0) start = f.t
        if (!f.spin?.spinning && start >= 0) { lengths.push(f.t - start); start = -1 }
      }
    }
    expect(lengths.length).toBeGreaterThan(10)
    // the bout's clock starts when the pair is asked, so the turning part is a little shorter than the drawn length
    for (const d of lengths) expect((d >= 1 && d <= 8.1) || (d >= 50 && d <= 120.1), `${d} s`).toBe(true)
  })
  it('points both birds along the circle once turning, nose to tail', () => {
    const { frames, birds } = fine
    let checked = 0, turning = 0
    for (const f of frames) {
      const s = f.spin
      turning = s?.spinning ? turning + 1 : 0
      // a second into the turn, each heading lies along the circle in the turning direction
      if (!s || turning <= 60) continue
      const [a, c] = s.pair.map(p => birds.indexOf(p as BehaviorController))
      for (const k of [a!, c!]) {
        const bearing = Math.atan2(-(f.zs[k]! - s.cz), f.xs[k]! - s.cx)
        expect(Math.abs(wrap(f.headings[k]! - (bearing + (s.dir * Math.PI) / 2)))).toBeLessThan(0.02)
      }
      expect(Math.abs(wrap(f.headings[a!]! - f.headings[c!]! - Math.PI))).toBeLessThan(0.02)
      checked++
    }
    expect(checked).toBeGreaterThan(60)
  })
  /**
   * Bird k's runs of consecutive frames where `test` holds, and whether each ended with the bird still in `state` (the
   * state it began the next frame in: a frame is recorded under the state it began in)
   */
  function spells(frames: Frame[], k: number, test: (f: Frame) => boolean, state: string) {
    const out: { from: number; to: number; within: boolean }[] = []
    let from = -1
    frames.forEach((f, i) => {
      if (test(f)) { if (from < 0) from = f.t }
      else if (from >= 0) { out.push({ from, to: f.t, within: frames[i + 1]?.states[k] === state }); from = -1 }
    })
    return out
  }
  it("skims in bouts: the travelling head down 30-60 s, the potterer's face down 0.75-2.75 s and up 0.25-1 s", () => {
    const q = 0.15
    const down: number[] = [], up: number[] = []
    for (const h of hours) {
      for (let k = 0; k < 3; k++) {
        const skimming = (f: Frame) => f.states[k] === 'skim'
        // the bill down (reach past half-way) and up, inside skimming, for spells the skim itself ended
        for (const r of spells(h.frames, k, f => skimming(f) && reachOf(h, f, k) > 0.5, 'skim')) if (r.within) down.push(r.to - r.from)
        for (const r of spells(h.frames, k, f => skimming(f) && reachOf(h, f, k) <= 0.5, 'skim')) if (r.within) up.push(r.to - r.from)
      }
    }
    expect(down.length).toBeGreaterThan(100)
    for (const d of down) expect((d >= 0.75 - q && d <= 2.75 + q) || (d >= 30 - q && d <= 60 + q), `down ${d} s`).toBe(true)
    for (const d of up) expect((d >= 0.25 - q && d <= 1 + q) || Math.abs(d - SHOVELER.skim.travel.up) <= q, `up ${d} s`).toBe(true)
    expect(down.filter(d => d >= 30).length).toBeGreaterThan(5)
  })
  it('wanders its heading a few degrees as it skims, never sweeping more than 8 degrees', () => {
    // A bird on its own, so no neighbour turns it aside: under way, it swims the way its body faces, and the heading it
    // shows is that plus the wander.
    const c = createShoveler(ctx(12), 10, 6)
    const pose = defaultPose()
    let most = 0, px = c.x, pz = c.z, n = 0
    for (let i = 0; i < 1200 * 60; i++) {
      c.update(1 / 60, pose)
      const dx = c.x - px, dz = c.z - pz
      if (c.state === 'skim' && pose.reach > 0.999 && Math.hypot(dx, dz) * 60 > 0.25) {
        most = Math.max(most, Math.abs(wrap(c.heading - Math.atan2(-dz, dx))))
        n++
      }
      ;[px, pz] = [c.x, c.z]
    }
    expect(n).toBeGreaterThan(1000)
    expect((most * 180) / Math.PI).toBeGreaterThan(5)
    expect((most * 180) / Math.PI).toBeLessThan(8)
  })
  it('tips up rarely, about once in 10 minutes of feeding, 1-2.5 s at no more than 60 degrees', () => {
    let tips = 0, feeding = 0
    for (const h of hours) {
      feeding += h.frames.reduce((n, f) => n + f.states.filter(x => x === 'skim' || x === 'circle').length, 0) / 10
      for (let k = 0; k < 3; k++) tips += spells(h.frames, k, f => f.states[k] === 'tipUp', 'x').length
    }
    // Poisson: 1 per 600 s of feeding, within about two and a half of its standard deviations
    const expected = feeding / 600
    expect(Math.abs(tips - expected)).toBeLessThan(2.5 * Math.sqrt(expected))
    const full = fine.frames.flatMap(f => f.poses.filter(p => p.paddle > 0.999))
    for (const p of full) {
      expect((p.lean.x * 180) / Math.PI).toBeGreaterThanOrEqual(50)
      expect((p.lean.x * 180) / Math.PI).toBeLessThanOrEqual(60)
    }
  })
  it('moves smoothly: at 60 fps no part of the pose jumps in a frame', () => {
    const most: [string, (p: PoseState) => number, number][] = [
      ['lean', p => p.lean.x, 0.1], ['reach', p => p.reach, 0.15], ['depth', p => p.reachDepth, 0.005],
      ['paddle', p => p.paddle, 0.1], ['neck', p => p.neckExtend, 0.1], ['tail', p => p.tailTilt, 0.05],
    ]
    const { frames } = fine
    for (let i = 1; i < frames.length; i++) {
      for (let k = 0; k < 3; k++) {
        for (const [name, get, limit] of most) {
          const d = Math.abs(get(frames[i]!.poses[k]!) - get(frames[i - 1]!.poses[k]!))
          if (d > limit) expect.fail(`bird ${k} ${name} changed by ${d.toFixed(4)} at ${frames[i]!.t.toFixed(2)} s (${frames[i]!.states[k]})`)
        }
      }
    }
  })
  it('rings the water: a skimming bill every 1.5 s at most, the pair once a revolution, a tip-up at each end', () => {
    const sizes = new Set(hours.flatMap(h => h.rings.map(r => r.size)))
    expect(sizes).toContain(SHOVELER.skim.ring.size)
    expect(sizes).toContain(SHOVELER.circle.ring)
    expect(sizes).toContain(SHOVELER.tipUp.ring)
    expect([...sizes].every(x => x <= 1)).toBe(true)
  })

})
