import { createGrebe, GREBE, AWASH, gamma } from './grebe'
import { createSwim, companyOf } from './swim'
import { startSpot, mid, AVOID, DRIFT } from './swimmer'
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

interface Frame { t: number; states: string[]; xs: number[]; ys: number[]; zs: number[]; hs: number[]; lean: number; tail: number; reach: number; paddle: number; neck: number }
interface Ring { t: number; size: number }

/** Three grebes, started as the spawner starts them; every bird's place and heading, and bird 0's pose, every frame. */
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
    frames.push({ t, states, xs: birds.map(b => b.x), ys: birds.map(b => b.y), zs: birds.map(b => b.z), hs: birds.map(b => b.heading), lean: p.lean.x, tail: p.tailTilt, reach: p.reach, paddle: p.paddle, neck: p.neckExtend })
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
  /** every dive by every bird: how long under, how far it went and which way, how it started, and how it came up */
  const dives = hours.flatMap(h => [0, 1, 2].flatMap(k => runs(h.frames, underwater(k)).filter(r => r.start > 0 && r.end < h.frames.length - 1).map(r => {
    // from its first frame all the way under to its last, where it starts up (after that the wind has it again)
    const down = h.frames[r.start]!, up = h.frames[r.end - 1]!
    const dx = up.xs[k]! - down.xs[k]!, dz = up.zs[k]! - down.zs[k]!
    return { k, h, seconds: r.to - r.from, moved: Math.hypot(dx, dz), way: Math.atan2(-dz, dx), start: r.start, end: r.end }
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
  it('comes up facing the way it swam under water', () => {
    // a dive that goes a metre or more, homeward or not: as it starts up, within 60 degrees of the way it went
    const went = dives.filter(d => d.moved >= 1)
    expect(went.length).toBeGreaterThan(1000)
    for (const d of went) {
      const heading = d.h.frames[d.end]!.hs[d.k]!
      const off = Math.abs(Math.atan2(Math.sin(heading - d.way), Math.cos(heading - d.way)))
      if (off > Math.PI / 3) expect.fail(`bird ${d.k} came up ${((off * 180) / Math.PI).toFixed(0)} degrees off the way it went at ${d.h.frames[d.end]!.t.toFixed(1)} s`)
    }
  })
  it('once `extra` seconds past its time, stops looking for a clear spot and comes up where it is, facing the way it went', () => {
    // 4 s down, meaning to come up about where it went down, and a bird always beside it that it must keep 3 m from:
    // every spot it could come up at is taken by the time it gets there, so it swims about looking as long as it may
    const S = { ...GREBE, under: { ...GREBE.under, range: [4, 4] as const, distance: { ...GREBE.under.distance, mean: 0.01, sd: 0.01 } } }
    const me: BehaviorController[] = []
    const shadow = { get x() { return me[0]?.x ?? 2 }, get z() { return me[0]?.z ?? -33 }, heading: 0, state: 'shadow', spacing: 3, group: undefined }
    const c = createGrebe(ctx(5, { neighbours: () => [...me, shadow] }), 2, -33, S)
    me.push(c)
    const pose = defaultPose(), spells: number[] = []
    let down = -1, [fromX, fromZ] = [0, 0], [lastX, lastZ] = [0, 0], turned = 0
    for (let i = 0; i < 1800 * 10; i++) {
      c.update(0.1, pose)
      if (c.submerged && down < 0) { down = i; [fromX, fromZ] = [c.x, c.z] }
      else if (!c.submerged && down >= 0) {
        spells.push((i - down) / 10)
        down = -1
        // where it was on its last frame under, before the wind had it
        if (Math.hypot(lastX - fromX, lastZ - fromZ) >= 1) {
          turned++
          const way = Math.atan2(-(lastZ - fromZ), lastX - fromX)
          expect(Math.abs(Math.atan2(Math.sin(c.heading - way), Math.cos(c.heading - way)))).toBeLessThanOrEqual(Math.PI / 3)
        }
      }
      ;[lastX, lastZ] = [c.x, c.z]
    }
    expect(spells.length).toBeGreaterThan(20)
    expect(turned).toBeGreaterThan(20)
    // 4 s, then `extra` more, to within the frame it goes under and the frame it gives up in
    for (const s of spells) expect(s).toBeLessThanOrEqual(4 + GREBE.under.extra + 0.2 + 1e-9)
    expect(Math.max(...spells)).toBeGreaterThanOrEqual(4 + GREBE.under.extra)
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
    // once every 3-6 minutes of its time, bouts and all: 12 grebe-hours, 120-240 watches
    const minutes = (hours.length * 3 * 3600) / 60
    expect(watches).toBeGreaterThanOrEqual(minutes / 6)
    expect(watches).toBeLessThanOrEqual(minutes / 3)
  })
  it('dives in bouts of 3-12, pausing on the surface 2-10 s after each dive, 4 s on average', () => {
    const bouts: number[] = [], pauses: number[] = []
    for (const h of hours) {
      for (const k of [0, 1, 2]) {
        // a bout: the dives between spells of cruising, loafing, or sinking to watch (not the hour's first or last,
        // which may be cut short)
        let n = 0, begun = false
        h.frames.forEach((f, i) => {
          const s = f.states[k]
          if (s === 'cruise' || s === 'loaf' || s === 'sink') { if (begun && n > 0) bouts.push(n); n = 0; begun = true }
          else if (s === 'under' && i > 0 && h.frames[i - 1]!.states[k] !== 'under') n++
        })
        // on the surface from coming up to going on (to peer, dive, or rest): to within the frame it ends in
        for (const r of runs(h.frames, f => f.states[k] === 'resurface')) if (r.start > 0) pauses.push(r.to - r.from)
      }
    }
    const [fewest, most] = GREBE.bouts.dives
    expect(bouts.length).toBeGreaterThan(150)
    for (const n of bouts) {
      expect(n).toBeGreaterThanOrEqual(fewest)
      expect(n).toBeLessThanOrEqual(most)
    }
    expect(bouts).toContain(fewest)
    expect(bouts).toContain(most)
    expect(mean(bouts)).toBeGreaterThan(mid(GREBE.bouts.dives) - 1)
    expect(mean(bouts)).toBeLessThan(mid(GREBE.bouts.dives) + 1)
    const [shortest, longest] = GREBE.resurface.pause
    expect(pauses.length).toBeGreaterThan(1000)
    for (const p of pauses) {
      expect(p).toBeGreaterThanOrEqual(shortest - 1e-9)
      expect(p).toBeLessThanOrEqual(longest + 0.1 + 1e-9)
    }
    expect(Math.min(...pauses)).toBeLessThan(shortest + 0.2)
    expect(Math.max(...pauses)).toBeGreaterThan(longest - 0.5)
    expect(mean(pauses)).toBeGreaterThan(GREBE.resurface.pauseMean - 0.3)
    expect(mean(pauses)).toBeLessThan(GREBE.resurface.pauseMean + 0.3)
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
  it('rings the water once as it goes under and once as it comes up, every dive', () => {
    // Bird 0's rings, dive by dive: one of a roll's, a splash's, or a sink's after it last came up and by the frame it
    // is all the way under, and the coming-up ring on the frame it starts up. The roll's ring is the size of the
    // coming-up ring, so they are told apart by when they come.
    const going = [GREBE.rings.roll, GREBE.rings.splash, GREBE.rings.sink]
    let checked = 0
    for (const h of hours) {
      let since = -Infinity
      for (const r of runs(h.frames, underwater(0))) {
        const down = h.frames[r.start]!.t, up = h.frames[r.end - 1]!.t
        if (r.start > 0) {
          checked++
          const entry = h.rings.filter(g => g.t > since && g.t <= down && going.includes(g.size))
          if (entry.length !== 1) expect.fail(`${entry.length} rings going under at ${down.toFixed(1)} s`)
          const surfacing = h.rings.filter(g => g.t === up)
          if (surfacing.length !== 1 || surfacing[0]!.size !== GREBE.rings.up) expect.fail(`${surfacing.length} rings coming up at ${up.toFixed(1)} s`)
        }
        since = up
      }
    }
    expect(checked).toBeGreaterThan(400)
  })
})
