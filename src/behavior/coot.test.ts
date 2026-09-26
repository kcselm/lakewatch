import { createCoot, COOT, pumpWave, type CootSettings } from './coot'
import { createSwim, companyOf } from './swim'
import { startSpot, AVOID, DRIFT } from './swimmer'
import { defaultPose } from '../birds/model'
import { makeRng } from '../catalog/rng'
import { pointInPolygon } from '../location/zones'
import type { BehaviorContext, BehaviorController, FlockGroup } from './types'

type Pt = [number, number]
const pond = { kind: 'polygon' as const, points: [[0, 0], [20, 0], [20, 12], [0, 12]] as Pt[] }
const WIND = { dirX: 1, dirZ: 0, effective: 0.3 }
const ctx = (seed: number, more: Partial<BehaviorContext> = {}): BehaviorContext => ({
  zone: pond, rng: makeRng(seed), wind: () => WIND, ground: () => -2, foraging: 'coot', ...more,
})

interface Frame { t: number; state: string; states: string[]; x: number; y: number; z: number; lean: number; tail: number; reach: number; depth: number; paddle: number; bob: number; neck: number }
interface Ring { t: number; size: number }

/** A flock of six coots, started as the spawner starts them; bird 0 recorded every frame. */
function flock(seed: number, seconds: number, fps: number, S: CootSettings = COOT) {
  const rng = makeRng(seed), group: FlockGroup = { targetX: 10, targetZ: 6, retargetAt: 60 }
  const birds: BehaviorController[] = [], rings: Ring[] = []
  let t = 0
  for (let k = 0; k < 6; k++) {
    const [x, z] = startSpot(pond, rng, group, companyOf('coot'), birds)
    birds.push(createCoot(ctx(seed * 10 + k, { group, neighbours: () => birds, onRipple: k === 0 ? (_x, _z, size) => rings.push({ t, size: size ?? 1 }) : undefined }), x, z, S))
  }
  const poses = birds.map(() => defaultPose()), frames: Frame[] = []
  for (let i = 0; i < seconds * fps; i++) {
    t = i / fps
    const states = birds.map(b => b.state), state = states[0]!
    birds.forEach((b, k) => b.update(1 / fps, poses[k]!))
    const [b, p] = [birds[0]!, poses[0]!]
    frames.push({ t, state, states, x: b.x, y: b.y, z: b.z, lean: p.lean.x, tail: p.tailTilt, reach: p.reach, depth: p.reachDepth, paddle: p.paddle, bob: p.headBob, neck: p.neckExtend })
  }
  return { frames, rings, birds }
}

/** Runs of consecutive frames where `test` holds. */
function runs(frames: Frame[], test: (f: Frame, i: number) => boolean) {
  const out: { from: number; to: number; frames: Frame[]; start: number }[] = []
  let cur: Frame[] = [], start = 0
  frames.forEach((f, i) => {
    if (test(f, i)) { if (!cur.length) start = i; cur.push(f) }
    else if (cur.length) { out.push({ from: cur[0]!.t, to: f.t, frames: cur, start }); cur = [] }
  })
  return out
}
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

describe('coot', () => {
  // six coots for an hour, four times, at 10 frames a second; and for the motion itself, one flock for twenty minutes
  // at 60, diving and tipping up far more often than coots do, so that each shows up many times
  const hours = [1, 2, 3, 4].map(seed => flock(seed, 3600, 10))
  const busy: CootSettings = { ...COOT, dive: { ...COOT.dive, boutsPerSecond: 1 / 60 }, tipUp: { ...COOT.tipUp, perSecond: 1 / 30 } }
  const fine = flock(9, 1200, 60, busy)
  const under = (f: Frame) => f.y <= -COOT.dive.depth + 1e-9

  it('is what swim gives a coot', () => {
    const c = createSwim(ctx(1), 5, 5), pose = defaultPose(), states = new Set<string>()
    for (let i = 0; i < 600 * 10; i++) { c.update(0.1, pose); states.add(c.state) }
    expect(states).toContain('peck')
  })
  it('spends its time as the research says: pecking 40%, swimming to feed 15%, travelling 15%, loafing 10%, preening 10%', () => {
    // all six birds of each flock, 24 coot-hours
    const all = hours.flatMap(h => h.frames.flatMap(f => f.states))
    const share = (s: string) => all.filter(x => x === s).length / all.length
    for (const [s, w] of [['peck', 0.4], ['cruise', 0.15], ['travel', 0.15], ['loaf', 0.1], ['preen', 0.1]] as const) {
      expect(Math.abs(share(s) - w), s).toBeLessThan(0.04)
    }
    // head-dips, tip-ups, and dives together: a few percent, the research's 5% for dives and tip-ups and 5% for dips
    expect(share('headDip') + share('tipUp') + share('dive')).toBeGreaterThan(0.04)
    expect(share('headDip') + share('tipUp') + share('dive')).toBeLessThan(0.12)
  })
  it('pumps its head 2.2 times a second while it swims: held still against the water, then thrust', () => {
    const swims = runs(fine.frames, (f, i) => f.state === 'cruise' && i > 0 && Math.hypot(f.x - fine.frames[i - 1]!.x, f.z - fine.frames[i - 1]!.z) * 60 > 0.19)
      .filter(r => r.frames.length > 90)
    expect(swims.length).toBeGreaterThan(3)
    let thrusts = 0, falling = 0, frames = 0
    const drops: number[] = []
    for (const r of swims) {
      // clear of the run's ends, where the bird gathers way or slows
      const bob = r.frames.slice(15, -15).map(f => f.bob)
      // thrusts: the head turning from falling to rising, once a pump
      for (let i = 2; i < bob.length; i++) {
        if (bob[i - 1]! < bob[i - 2]! && bob[i]! >= bob[i - 1]!) thrusts++
        if (bob[i]! < bob[i - 1]!) { falling++; drops.push(bob[i - 1]! - bob[i]!) }
        frames++
      }
      expect(Math.max(...bob) - Math.min(...bob)).toBeCloseTo(COOT.pump.amplitude, 2)
    }
    expect(thrusts / (frames / 60)).toBeGreaterThan(COOT.pump.perSecond - 0.15)
    expect(thrusts / (frames / 60)).toBeLessThan(COOT.pump.perSecond + 0.15)
    // The hold is half of each pump (at 60 fps, 13 or 14 of its 27 frames), and in it the head goes back steadily.
    // The pure wave falls in 53% of frames (the frame that wraps from thrust to hold falls too); a bird still
    // gathering way or turning shrinks the pump a little, and a few more frames of its thrust count as falling.
    expect(falling / frames).toBeGreaterThan(0.45)
    expect(falling / frames).toBeLessThan(0.62)
    // held still against the water, the head goes back at the body's own steady pace: the drop from frame to frame
    // barely varies (a sine's would run from nothing to its most)
    drops.sort((a, b) => a - b)
    expect(drops[Math.floor(drops.length * 0.2)]! / drops[Math.floor(drops.length * 0.8)]!).toBeGreaterThan(0.8)
  })
  it('keeps its head still when it is not swimming', () => {
    for (const r of runs(fine.frames, f => f.state === 'loaf' || f.state === 'preen').filter(r => r.frames.length > 60)) {
      for (const f of r.frames.slice(30)) expect(Math.abs(f.bob)).toBeLessThan(0.002)
    }
  })
  it('has a pump that holds, then thrusts: falling steadily for the hold, rising smoothly after', () => {
    for (let k = 0; k < 9; k++) expect(pumpWave((k + 1) / 20, 0.5) - pumpWave(k / 20, 0.5)).toBeCloseTo(-0.2, 9)
    expect(pumpWave(0, 0.5)).toBe(1)
    expect(pumpWave(0.5, 0.5)).toBeCloseTo(-1, 9)
    expect(pumpWave(1 - 1e-9, 0.5)).toBeCloseTo(1, 6)
    for (let k = 50; k < 99; k++) expect(pumpWave((k + 1) / 100, 0.5)).toBeGreaterThan(pumpWave(k / 100, 0.5))
  })
  it('pecks at the surface 2.5 times a second in bouts of 2-8 s', () => {
    const bouts = runs(fine.frames, f => f.state === 'peck').filter(r => r.frames.length > 60)
    expect(bouts.length).toBeGreaterThan(5)
    for (const r of bouts) {
      // after the bill comes down, and before the frame that ends the bout (which may start a head-dip)
      const settled = r.frames.slice(20, -1)
      const lifts = settled.filter((f, i) => i > 0 && settled[i - 1]!.reach === 1 && f.reach < 1).length
      expect(lifts / (settled.at(-1)!.t - settled[0]!.t)).toBeCloseTo(COOT.peck.perSecond, 0)
      for (const f of settled) expect(f.depth).toBe(0)
      expect(r.to - r.from).toBeLessThanOrEqual(COOT.peck.seconds[1] + 0.05)
    }
  })
  it('dives for 1.3-5.5 s, 2.5 on average, and comes up within 1 m of where it went down', () => {
    const dives: number[] = [], moved: number[] = []
    for (const h of [...hours, fine]) {
      for (const r of runs(h.frames, under)) {
        if (r.start === 0 || r.to === h.frames.at(-1)!.t) continue
        dives.push(r.to - r.from)
        // from where it went under to where it is back at the surface
        const down = h.frames[r.start - 1]!
        const up = h.frames.slice(r.start).find(f => f.y === 0)!
        moved.push(Math.hypot(up.x - down.x, up.z - down.z))
      }
    }
    expect(dives.length).toBeGreaterThan(50)
    // at 10 frames a second a spell is measured to within 0.15 s
    for (const d of dives) { expect(d).toBeGreaterThanOrEqual(1.3 - 0.15); expect(d).toBeLessThanOrEqual(5.5 + 0.5) }
    expect(mean(dives)).toBeGreaterThan(2.2)
    expect(mean(dives)).toBeLessThan(2.9)
    for (const m of moved) expect(m).toBeLessThanOrEqual(COOT.dive.move + 1e-9)
    expect(mean(moved)).toBeLessThan(0.5)
  })
  it('dives in bouts, 10-25 s between surfacing and the next dive, a bout every 5-10 minutes', () => {
    let bouts = 0, total = 0
    for (const h of hours) {
      const downs = runs(h.frames, under).map(r => r.from)
      total += downs.length
      for (let i = 1; i < downs.length; i++) {
        const gap = downs[i]! - downs[i - 1]!
        expect(gap).toBeGreaterThan(10)
        if (gap > 120) bouts++
      }
      bouts++
    }
    // six coots' worth of hours would be 6 x 4 x 8 bouts; bird 0 alone had 4 hours: about 32 bouts, give or take
    expect(bouts).toBeGreaterThan(16)
    expect(bouts).toBeLessThan(56)
    expect(total / bouts).toBeGreaterThan(2)
    expect(total / bouts).toBeLessThan(5)
  })
  it('jumps in: the head down 0.2-0.3 s, then a lunge that arcs the body over, feet out, and under in 0.5 s', () => {
    const { frames: f } = fine
    let dives = 0
    for (const r of runs(f, x => x.state === 'dive')) {
      const i = r.start
      const lunge = f.slice(i).findIndex(x => x.y < 0)
      const gone = f.slice(i).findIndex(under)
      if (lunge < 0 || gone < 0) continue
      dives++
      expect((lunge - 1) / 60).toBeGreaterThanOrEqual(COOT.dive.dip[0] - 0.02)
      expect((lunge - 1) / 60).toBeLessThanOrEqual(COOT.dive.dip[1] + 0.02)
      expect(Math.max(...f.slice(i, i + lunge).map(x => x.reach))).toBeGreaterThan(0.9)
      expect((gone - lunge + 1) / 60).toBeCloseTo(COOT.dive.lunge, 1)
      const arc = f.slice(i + lunge, i + gone + 1)
      expect(Math.max(...arc.map(x => x.lean))).toBeGreaterThan(1.2)
      expect(Math.max(...arc.map(x => x.paddle))).toBeGreaterThan(0.9)
    }
    expect(dives).toBeGreaterThan(3)
  })
  it('moves smoothly: at 60 fps no part of the pose, nor its depth, jumps in a frame', () => {
    const most = { lean: 0.15, tail: 0.1, reach: 0.15, depth: 0.02, paddle: 0.1, bob: 0.03, neck: 0.1, y: 0.035 }
    const { frames: f } = fine
    for (let i = 1; i < f.length; i++) {
      for (const [k, limit] of Object.entries(most) as [keyof typeof most, number][]) {
        const d = Math.abs(f[i]![k] - f[i - 1]![k])
        if (d > limit) expect.fail(`${k} changed by ${d.toFixed(4)} at ${f[i]!.t.toFixed(2)} s (${f[i]!.state})`)
      }
    }
  })
  it('stays in its zone, and no frame moves it further than its pace, under water or on it', () => {
    const pace = (Math.max(COOT.travel.speed + AVOID, COOT.dive.swim) + DRIFT * WIND.effective) / 60 + 1e-9
    const { frames: f } = fine
    for (let i = 1; i < f.length; i++) {
      if (!pointInPolygon(f[i]!.x, f[i]!.z, pond.points)) expect.fail(`left the zone at ${f[i]!.t}`)
      const moved = Math.hypot(f[i]!.x - f[i - 1]!.x, f[i]!.z - f[i - 1]!.z)
      if (moved > pace) expect.fail(`moved ${moved.toFixed(4)} m at ${f[i]!.t.toFixed(2)} s (${f[i]!.state})`)
    }
  })
  it('rings the water as it dives and surfaces, as it dips its head, and faintly as it swims', () => {
    const sizes = hours.flatMap(h => h.rings.map(r => r.size))
    for (const size of [COOT.dive.ring, COOT.headDip.ring, COOT.pump.ring.size]) expect(sizes).toContain(size)
    const dives = hours.reduce((n, h) => n + runs(h.frames, under).length, 0)
    // one going down and one coming up for each dive (a dive cut by the end of the hour may miss its second)
    expect(sizes.filter(s => s === COOT.dive.ring).length).toBeGreaterThanOrEqual(2 * dives - 4)
  })
})
