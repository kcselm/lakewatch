import { createGrebe, GREBE, AWASH, gamma } from './grebe'
import { createSwim, companyOf } from './swim'
import { startSpot, AVOID, DRIFT } from './swimmer'
import { defaultPose } from '../birds/model'
import { makeRng } from '../catalog/rng'
import { pointInPolygon } from '../location/zones'
import type { BehaviorContext, BehaviorController, FlockGroup } from './types'

type Pt = [number, number]
// the lake's open water, where the grebes swim
const water = { kind: 'polygon' as const, points: [[-22, -15], [26, -15], [32, -52], [-28, -52]] as Pt[] }
const WIND = { dirX: 1, dirZ: 0, effective: 0.3 }
const ctx = (seed: number, more: Partial<BehaviorContext> = {}): BehaviorContext => ({
  zone: water, rng: makeRng(seed), wind: () => WIND, ground: () => -2, foraging: 'grebe', ...more,
})

interface Frame { t: number; states: string[]; xs: number[]; ys: number[]; zs: number[]; lean: number; tail: number; reach: number; paddle: number; neck: number }
interface Ring { t: number; size: number }

/** Three grebes, started as the spawner starts them; every bird's place, and bird 0's pose, every frame. */
function three(seed: number, seconds: number, fps: number) {
  const rng = makeRng(seed), group: FlockGroup = { targetX: 2, targetZ: -33, retargetAt: Infinity }
  const birds: BehaviorController[] = [], rings: Ring[] = []
  let t = 0
  for (let k = 0; k < 3; k++) {
    const [x, z] = startSpot(water, rng, group, companyOf('grebe'), birds)
    birds.push(createGrebe(ctx(seed * 10 + k, { group, neighbours: () => birds, onRipple: k === 0 ? (_x, _z, size) => rings.push({ t, size: size ?? 1 }) : undefined }), x, z))
  }
  const poses = birds.map(() => defaultPose()), frames: Frame[] = []
  for (let i = 0; i < seconds * fps; i++) {
    t = i / fps
    const states = birds.map(b => b.state)
    birds.forEach((b, k) => b.update(1 / fps, poses[k]!))
    const p = poses[0]!
    frames.push({ t, states, xs: birds.map(b => b.x), ys: birds.map(b => b.y), zs: birds.map(b => b.z), lean: p.lean.x, tail: p.tailTilt, reach: p.reach, paddle: p.paddle, neck: p.neckExtend })
  }
  return { frames, rings, birds }
}

/** Bird k's runs of consecutive frames where `test` holds, with the frame index each starts at. */
function runs(frames: Frame[], test: (f: Frame, i: number) => boolean) {
  const out: { from: number; to: number; start: number; end: number }[] = []
  let start = -1
  frames.forEach((f, i) => {
    if (test(f, i)) { if (start < 0) start = i }
    else if (start >= 0) { out.push({ from: frames[start]!.t, to: f.t, start, end: i }); start = -1 }
  })
  return out
}
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
const DEPTH = GREBE.entry.depth
const underwater = (k: number) => (f: Frame) => f.ys[k]! <= -DEPTH + 1e-9

describe('grebe', () => {
  // three grebes for an hour, four times, at 10 frames a second; and three for twenty minutes at 60
  const hours = [1, 2, 3, 4].map(seed => three(seed, 3600, 10))
  const fine = three(9, 1200, 60)
  /** every dive by every bird: how long under, how far it went, how it started */
  const dives = hours.flatMap(h => [0, 1, 2].flatMap(k => runs(h.frames, underwater(k)).filter(r => r.start > 0 && r.end < h.frames.length - 1).map(r => {
    // from its first frame all the way under to its last, where it starts up (after that the wind has it again)
    const down = h.frames[r.start]!, up = h.frames[r.end - 1]!
    return { k, h, seconds: r.to - r.from, moved: Math.hypot(up.xs[k]! - down.xs[k]!, up.zs[k]! - down.zs[k]!), start: r.start }
  })))

  it('is what swim gives a grebe', () => {
    const c = createSwim(ctx(1), 2, -33), pose = defaultPose(), states = new Set<string>()
    for (let i = 0; i < 1200 * 10; i++) { c.update(0.1, pose); states.add(c.state) }
    expect(states).toContain('under')
  })
  it('stays under 7.6 s on average (2-15), and comes up 3.7 m away on average (0-12)', () => {
    expect(dives.length).toBeGreaterThan(300)
    // At 10 frames a second a spell is measured to within 0.25 s (it takes in the frames it goes under and starts up).
    // A bird that must swim on to surface clear of another stays down up to `extra` seconds longer.
    for (const d of dives) {
      expect(d.seconds).toBeGreaterThanOrEqual(2 - 0.25)
      expect(d.seconds).toBeLessThanOrEqual(15 + GREBE.under.extra + 0.25)
      expect(d.moved).toBeLessThanOrEqual(12 + 1e-6)
    }
    expect(mean(dives.map(d => d.seconds))).toBeGreaterThan(7.0)
    expect(mean(dives.map(d => d.seconds))).toBeLessThan(8.2)
    expect(mean(dives.map(d => d.moved))).toBeGreaterThan(3.1)
    expect(mean(dives.map(d => d.moved))).toBeLessThan(4.3)
  })
  it('draws gamma times with the mean and spread asked for', () => {
    const rng = makeRng(3), xs = Array.from({ length: 20000 }, () => gamma(rng, 7.6, 3.1, [0, Infinity]))
    const m = mean(xs), sd = Math.sqrt(mean(xs.map(x => (x - m) ** 2)))
    expect(m).toBeCloseTo(7.6, 1)
    expect(sd).toBeCloseTo(3.1, 1)
  })
  it('starts its dives 70% rolling under, 15% with a splash, 15% sinking first', () => {
    // told apart by how it goes: a sink holds at back-awash first; a splash goes straight down, level, in a flash; a
    // roll tips the stern up as it goes
    const kinds = { roll: 0, splash: 0, sink: 0 }
    for (const d of dives.filter(d => d.k === 0)) {
      const before = d.h.frames.slice(Math.max(0, d.start - 30), d.start)
      if (before.filter(f => Math.abs(f.ys[0]! + AWASH) < 1e-6).length >= 10) kinds.sink++
      else if (Math.max(...before.map(f => f.lean)) > 0.3) kinds.roll++
      else kinds.splash++
    }
    const n = kinds.roll + kinds.splash + kinds.sink
    expect(n).toBeGreaterThan(100)
    expect(kinds.roll / n).toBeGreaterThan(0.6)
    expect(kinds.roll / n).toBeLessThan(0.8)
    expect(kinds.splash / n).toBeGreaterThan(0.08)
    expect(kinds.splash / n).toBeLessThan(0.22)
    expect(kinds.sink / n).toBeGreaterThan(0.08)
    expect(kinds.sink / n).toBeLessThan(0.25)
  })
  it('rolls under in 0.4-0.65 s, the stern tipped up 20-30 degrees, a kick of the feet; a splash goes down in 0.1 s', () => {
    const { frames: f } = fine
    let rolls = 0, splashes = 0
    for (const r of runs(f, x => x.states[0] === 'dive')) {
      const gone = f.slice(r.start).findIndex(underwater(0))
      if (gone < 0) continue
      const entry = f.slice(r.start, r.start + gone + 1)
      const lean = Math.max(...entry.map(x => x.lean))
      if (lean > 0.3) {
        rolls++
        expect((lean * 180) / Math.PI).toBeGreaterThanOrEqual(20)
        expect((lean * 180) / Math.PI).toBeLessThanOrEqual(30)
        expect(Math.max(...entry.map(x => x.paddle))).toBeGreaterThan(0.5)
        expect((gone + 1) / 60).toBeGreaterThanOrEqual(0.4 - 0.02)
        expect((gone + 1) / 60).toBeLessThanOrEqual(0.65 + 0.02)
      } else if (entry[0]!.ys[0] === 0 && !entry.some(x => Math.abs(x.ys[0]! + AWASH) < 1e-6)) {
        splashes++
        // from the first frame off the surface to gone: 0.1 s, the neck upright
        const off = entry.findIndex(x => x.ys[0]! < 0)
        expect((gone - off + 1) / 60).toBeCloseTo(GREBE.entry.splashTime, 1)
        expect(entry[off]!.neck).toBeGreaterThan(0.7)
      }
    }
    expect(rolls).toBeGreaterThan(20)
    expect(splashes).toBeGreaterThan(2)
  })
  it('sinks to watch with only its head and neck out, the back 45 mm under, for 5-30 s, every few minutes', () => {
    let watches = 0
    for (const h of hours) {
      for (const k of [0, 1, 2]) {
        for (const r of runs(h.frames, f => f.states[k] === 'sink' && Math.abs(f.ys[k]! + AWASH) < 1e-9)) {
          // a watch held at the periscope, as against the brief hold of a sinking dive
          if (r.to - r.from < 4) continue
          watches++
          expect(r.to - r.from).toBeGreaterThanOrEqual(5 - 0.15)
          expect(r.to - r.from).toBeLessThanOrEqual(30 + 0.15)
        }
      }
    }
    // once in 3-6 minutes of the time it isn't in a bout: 12 grebe-hours, half of them out of bouts
    expect(watches).toBeGreaterThan(40)
    expect(watches).toBeLessThan(160)
  })
  it('spends about a third of its time under water', () => {
    let under = 0, all = 0
    for (const h of hours) for (const f of h.frames) for (const y of f.ys) { all++; if (y <= -DEPTH + 1e-9) under++ }
    expect(under / all).toBeGreaterThan(0.25)
    expect(under / all).toBeLessThan(0.4)
  })
  it('keeps at least 10 m from the other grebes on the water, coming up clear of them too', () => {
    // one passing under another's patch is out of sight, and doesn't count
    let closest = Infinity
    for (const h of [...hours, fine]) {
      for (const f of h.frames) {
        for (const [a, c] of [[0, 1], [0, 2], [1, 2]] as const) {
          if (f.ys[a]! <= -DEPTH + 1e-9 || f.ys[c]! <= -DEPTH + 1e-9) continue
          closest = Math.min(closest, Math.hypot(f.xs[a]! - f.xs[c]!, f.zs[a]! - f.zs[c]!))
        }
      }
    }
    expect(closest).toBeGreaterThan(GREBE.spacing.flock - 0.01)
  })
  it('moves smoothly: at 60 fps no part of the pose jumps in a frame, and only a splash drops it fast', () => {
    const most = { lean: 0.1, tail: 0.1, reach: 0.15, paddle: 0.15, neck: 0.1 }
    const { frames: f } = fine
    for (let i = 1; i < f.length; i++) {
      for (const [k, limit] of Object.entries(most) as [keyof typeof most, number][]) {
        const d = Math.abs(f[i]![k] - f[i - 1]![k])
        if (d > limit) expect.fail(`${k} changed by ${d.toFixed(4)} at ${f[i]!.t.toFixed(2)} s (${f[i]!.states[0]})`)
      }
      // the splash's 0.1 s and the 0.1 s rise are the fastest: 0.4 m along smoothstep, 1.5 x 0.4 / 0.1 / 60 = 0.1 m a frame
      const dy = Math.abs(f[i]!.ys[0]! - f[i - 1]!.ys[0]!)
      if (dy > 0.1 + 1e-9) expect.fail(`y changed by ${dy.toFixed(4)} at ${f[i]!.t.toFixed(2)} s`)
    }
  })
  it('stays in its zone, and no frame moves it further than its pace, under water or on it', () => {
    const pace = (GREBE.under.speed + AVOID + DRIFT * WIND.effective) / 60 + 1e-9
    const { frames: f } = fine
    for (let i = 1; i < f.length; i++) {
      for (const k of [0, 1, 2]) {
        if (!pointInPolygon(f[i]!.xs[k]!, f[i]!.zs[k]!, water.points)) expect.fail(`bird ${k} left the zone at ${f[i]!.t}`)
        const moved = Math.hypot(f[i]!.xs[k]! - f[i - 1]!.xs[k]!, f[i]!.zs[k]! - f[i - 1]!.zs[k]!)
        if (moved > pace) expect.fail(`bird ${k} moved ${moved.toFixed(4)} m at ${f[i]!.t.toFixed(2)} s`)
      }
    }
  })
  it('rings the water as it goes under and as it comes up', () => {
    const h = hours[0]!
    const downs = runs(h.frames, underwater(0)).filter(r => r.start > 0 && r.end < h.frames.length - 1)
    const going = h.rings.filter(r => r.size === GREBE.rings.roll || r.size === GREBE.rings.splash || r.size === GREBE.rings.sink)
    const up = h.rings.filter(r => r.size === GREBE.rings.up)
    expect(going.length).toBeGreaterThanOrEqual(downs.length)
    expect(up.length).toBeGreaterThanOrEqual(downs.length)
  })
})
