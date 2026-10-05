import * as THREE from 'three'
import { createCormorant, createCormorantPerch, CORMORANT, CORMORANT_PERCH, NECK } from './cormorant'
import { createSwim, companyOf } from './swim'
import { createPerch } from './perch'
import { defaultPose, type PoseState } from '../birds/model'
import { makeRng } from '../catalog/rng'
import { pointInPolygon } from '../location/zones'
import type { BehaviorContext, BehaviorController } from './types'

type Pt = [number, number]
// the cormorant's water by the stumps
const water = { kind: 'polygon' as const, points: [[-22, -24], [-6, -24], [-6, -34], [-22, -34]] as Pt[] }
// the lake's wind: toward 240 degrees, a light breeze
const WIND = { dirX: Math.sin(THREE.MathUtils.degToRad(240)), dirZ: -Math.cos(THREE.MathUtils.degToRad(240)), effective: 0.35 }
const ctx = (seed: number, more: Partial<BehaviorContext> = {}): BehaviorContext => ({
  zone: water, rng: makeRng(seed), wind: () => WIND, ground: () => -2.6, foraging: 'cormorant', species: 'doccor', ...more,
})
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

interface Frame { t: number; state: string; x: number; y: number; z: number; h: number; under: boolean; pose: PoseState }
interface Ring { t: number; x: number; z: number; size: number }

/** One fisher, alone or among `others` (fixed swimmers it keeps clear of), for `seconds` at `fps`. */
function fish(seed: number, seconds: number, fps: number, others: BehaviorController[] = []) {
  const rings: Ring[] = [], frames: Frame[] = [], splashes: number[] = []
  let t = 0
  const birds: BehaviorController[] = [...others]
  const bird = createCormorant(ctx(seed, {
    neighbours: () => birds,
    onRipple: (x, z, size) => rings.push({ t, x, z, size: size ?? 1 }),
    onEvent: name => { if (name === 'splash') splashes.push(t) },
  }), -14, -29)
  birds.push(bird)
  const pose = defaultPose()
  for (let i = 0; i < seconds * fps; i++) {
    t = i / fps
    bird.update(1 / fps, pose)
    frames.push({ t, state: bird.state, x: bird.x, y: bird.y, z: bird.z, h: bird.heading, under: !!bird.submerged, pose: { ...pose, lean: pose.lean.clone() } })
  }
  return { frames, rings, splashes, bird }
}
/** runs of consecutive frames where `test` holds; one still going at the last frame ends there (its `end` is the length) */
function runs(frames: Frame[], test: (f: Frame) => boolean) {
  const out: { start: number; end: number; seconds: number }[] = []
  let s = -1
  frames.forEach((f, i) => {
    if (test(f)) { if (s < 0) s = i }
    else if (s >= 0) { out.push({ start: s, end: i, seconds: f.t - frames[s]!.t }); s = -1 }
  })
  if (s >= 0) out.push({ start: s, end: frames.length, seconds: frames.at(-1)!.t - frames[s]!.t })
  return out
}

describe('the cormorant style on swim', () => {
  // an hour each on four seeds at 10 frames a second; twenty minutes at 60
  const hours = [1, 2, 3, 4].map(seed => fish(seed, 3600, 10))
  const fine = fish(9, 1200, 60)
  const dives = hours.flatMap(h => runs(h.frames, f => f.under).filter(r => r.start > 0 && r.end < h.frames.length).map(r => ({ h, ...r })))

  it('is what swim gives a cormorant, and keeps no flock', () => {
    const c = createSwim(ctx(1), -14, -29), pose = defaultPose(), states = new Set<string>()
    for (let i = 0; i < 1800 * 10; i++) { c.update(0.1, pose); states.add(c.state) }
    expect(states).toContain('under')
    expect(companyOf('cormorant').radius).toBe(Infinity)
  })
  it('stays under 22 s on average, 15-30 (research 7.1), longer only to come up clear of another bird', () => {
    expect(dives.length).toBeGreaterThan(150)
    for (const d of dives) {
      expect(d.seconds).toBeGreaterThanOrEqual(15 - 0.25)
      expect(d.seconds).toBeLessThanOrEqual(30 + CORMORANT.under.extra + 0.25)
    }
    expect(mean(dives.map(d => d.seconds))).toBeGreaterThan(20.5)
    expect(mean(dives.map(d => d.seconds))).toBeLessThan(23.5)
  })
  it('pauses 8-20 s on the surface between the dives of a bout, about 12 on average, and fishes in bouts of 6-15', () => {
    const pauses: number[] = [], bouts: number[] = []
    for (const h of hours) {
      const ds = runs(h.frames, f => f.under)
      let n = 1
      for (let i = 1; i < ds.length; i++) {
        const gap = h.frames[ds[i]!.start]!.t - h.frames[ds[i - 1]!.end]!.t
        // a gap longer than any pause and swallow is a rest between bouts
        if (gap < 40) { n++; if (!h.frames.slice(ds[i - 1]!.end, ds[i]!.start).some(f => f.state === 'swallow')) pauses.push(gap) }
        else { bouts.push(n); n = 1 }
      }
    }
    // the pause counts the surfacing and the dive's slide in, about 1.5 s
    for (const p of pauses) { expect(p).toBeGreaterThan(8); expect(p).toBeLessThan(20 + 2) }
    expect(mean(pauses)).toBeGreaterThan(11)
    expect(mean(pauses)).toBeLessThan(15)
    // the first and last bout of an hour are cut short by the hour's ends
    for (const b of bouts.slice(1, -1)) { expect(b).toBeGreaterThanOrEqual(6); expect(b).toBeLessThanOrEqual(15) }
  })
  it('spends about two-fifths of its time under water: fishing in bouts, resting for minutes between', () => {
    for (const h of hours) {
      const share = h.frames.filter(f => f.under).length / h.frames.length
      expect(share).toBeGreaterThan(0.25)
      expect(share).toBeLessThan(0.55)
    }
  })
  it('is hidden only all the way under, and goes under head first, the body tipped forward', () => {
    for (const h of hours) for (const f of h.frames) {
      if (f.under) expect(f.y).toBeLessThanOrEqual(-CORMORANT.entry.depth + 1e-9)
      else expect(f.y).toBeGreaterThan(-CORMORANT.entry.depth)
    }
    // just before it is gone: the bill reaching down into the water and the body pitched nose down
    const h = hours[0]!
    for (const d of runs(h.frames, f => f.under).slice(0, 20)) {
      const before = h.frames[d.start - 2]!
      expect(before.pose.reach).toBeGreaterThan(0.8)
      expect(before.pose.lean.x).toBeGreaterThan(0.3)
    }
  })
  it('comes up 3-10 m from where it went down, in its water, clear of the other swimmers', () => {
    const still: BehaviorController = { name: 'swim', state: 'loaf', x: -14, y: 0, z: -29, heading: 0, spacing: 1.5, update() {} }
    const h = fish(5, 3600, 10, [still])
    for (const d of runs(h.frames, f => f.under).filter(r => r.start > 0 && r.end < h.frames.length)) {
      const down = h.frames[d.start]!, up = h.frames[d.end]!
      expect(Math.hypot(up.x - down.x, up.z - down.z)).toBeLessThanOrEqual(10 + CORMORANT.under.speed * CORMORANT.under.extra + 1e-6)
      expect(pointInPolygon(up.x, up.z, water.points)).toBe(true)
      expect(Math.hypot(up.x - still.x, up.z - still.z)).toBeGreaterThanOrEqual(1.5 - 1e-6)
    }
  })
  it('brings up a fish about one surfacing in six, swallows a small one at once and handles a large one for 3-15 s first', () => {
    let surfacings = 0, catches = 0, large = 0
    for (const h of hours) {
      const ds = runs(h.frames, f => f.under).filter(r => r.end < h.frames.length)
      surfacings += ds.length
      for (const s of runs(h.frames, f => f.state === 'swallow')) catches++
      for (const s of runs(h.frames, f => f.state === 'handle')) {
        large++
        expect(s.seconds).toBeGreaterThanOrEqual(3 - 0.15)
        expect(s.seconds).toBeLessThanOrEqual(15 + 0.15)
        // a swallow follows the handling
        expect(h.frames[s.end]!.state).toBe('swallow')
      }
    }
    expect(catches / surfacings).toBeGreaterThan(0.1)
    expect(catches / surfacings).toBeLessThan(0.25)
    expect(large / catches).toBeGreaterThan(0.08)
    expect(large / catches).toBeLessThan(0.35)
  })
  it('swallows in forward-upward jerks of the head: 1-2 for a small fish, 4-5 for a large one', () => {
    const jerks = (from: number, to: number) => {
      let n = 0
      for (let i = from + 1; i < to; i++) {
        const [a, b, c] = [fine.frames[i - 1]!, fine.frames[i]!, fine.frames[i + 1]!].map(f => f.pose.headPitch)
        if (b! > a! && b! >= c! && b! > CORMORANT.swallow.jerk * 0.5) n++
      }
      return n
    }
    const sw = runs(fine.frames, f => f.state === 'swallow')
    expect(sw.length).toBeGreaterThan(0)
    for (const s of sw) {
      const big = fine.frames[s.start - 1]!.state === 'handle'
      const n = jerks(s.start, s.end)
      if (big) { expect(n).toBeGreaterThanOrEqual(4); expect(n).toBeLessThanOrEqual(5) }
      else { expect(n).toBeGreaterThanOrEqual(1); expect(n).toBeLessThanOrEqual(2) }
    }
  })
  it('rings the water as it goes under and comes up, and splashes as it goes', () => {
    const h = hours[0]!
    const ds = runs(h.frames, f => f.under).filter(r => r.start > 0 && r.end < h.frames.length)
    for (const d of ds.slice(0, 10)) {
      const near = (t: number, x: number, z: number) => h.rings.some(r => Math.abs(r.t - t) < 1.5 && Math.hypot(r.x - x, r.z - z) < 0.5)
      expect(near(h.frames[d.start]!.t, h.frames[d.start]!.x, h.frames[d.start]!.z)).toBe(true)
      expect(near(h.frames[d.end]!.t, h.frames[d.end]!.x, h.frames[d.end]!.z)).toBe(true)
    }
    expect(h.splashes.length).toBeGreaterThanOrEqual(ds.length)
  })
  it('stays in its water', () => {
    for (const h of hours) for (const f of h.frames) expect(pointInPolygon(f.x, f.z, water.points)).toBe(true)
  })
  it('never jumps between frames at 60 fps: its place and every part of its pose move smoothly', () => {
    for (let i = 1; i < fine.frames.length; i++) {
      const a = fine.frames[i - 1]!, b = fine.frames[i]!
      // under water it is hidden, and may move faster than it shows
      if (!a.under && !b.under) expect(Math.hypot(b.x - a.x, b.z - a.z)).toBeLessThan(0.05)
      expect(Math.abs(b.pose.neckExtend - a.pose.neckExtend)).toBeLessThan(0.08)
      expect(Math.abs(b.pose.lean.x - a.pose.lean.x)).toBeLessThan(0.08)
      expect(Math.abs(b.pose.reach - a.pose.reach)).toBeLessThan(0.15)
      expect(Math.abs(b.pose.headPitch - a.pose.headPitch)).toBeLessThan(0.12)
      if (!a.under && !b.under) expect(Math.abs(b.y - a.y)).toBeLessThan(0.05)
    }
  })
  it('floats low with its neck upright and its bill raised while loafing', () => {
    const loaf = hours[0]!.frames.filter(f => f.state === 'loaf')
    expect(loaf.length).toBeGreaterThan(100)
    for (const f of loaf.slice(-50)) { expect(f.pose.neckExtend).toBeCloseTo(NECK.loaf, 1); expect(f.y).toBeCloseTo(0, 9) }
  })
})

describe('the cormorant style on perch', () => {
  const PERCH: [number, number, number] = [-14, 0.9, -30]
  const into = Math.atan2(WIND.dirZ, -WIND.dirX)
  /** one bird on its stump for `seconds` at `fps` */
  function sit(seed: number, seconds: number, fps: number) {
    const bird = createPerch(ctx(seed, { zone: { kind: 'point', position: PERCH }, perch: PERCH }), PERCH[0], PERCH[2])
    const pose = defaultPose()
    pose.afloat = 0
    const frames: Frame[] = []
    for (let i = 0; i < seconds * fps; i++) {
      bird.update(1 / fps, pose)
      frames.push({ t: i / fps, state: bird.state, x: bird.x, y: bird.y, z: bird.z, h: bird.heading, under: false, pose: { ...pose, lean: pose.lean.clone() } })
    }
    return { frames, bird }
  }
  const long = [11, 12, 13].map(seed => sit(seed, 3 * 3600, 5))
  const fine = sit(19, 900, 60)
  const sessions = (frames: Frame[]) => runs(frames, f => f.state === 'session' || f.state === 'spread' || f.state === 'fold')

  it('is what perch gives a cormorant', () => {
    expect(createPerch(ctx(1, { perch: PERCH }), 0, 0)).toBeDefined()
    expect(long[0]!.frames.some(f => f.state === 'spread')).toBe(true)
    expect(createCormorantPerch).toBeDefined()
  })
  it('never leaves its perch', () => {
    for (const s of long) for (const f of s.frames) { expect(f.x).toBe(PERCH[0]); expect(f.y).toBe(PERCH[1]); expect(f.z).toBe(PERCH[2]) }
  })
  it('stands upright on it, the body 35-45 degrees up and the tail propped', () => {
    for (const f of long[0]!.frames.slice(100)) {
      expect(-f.pose.lean.x).toBeGreaterThan(THREE.MathUtils.degToRad(33))
      expect(-f.pose.lean.x).toBeLessThan(THREE.MathUtils.degToRad(47))
      expect(f.pose.tailProp).toBeGreaterThan(0.9)
    }
  })
  it('dries its wings within the first ten minutes, then every 25-45 minutes, about four to five minutes a session', () => {
    for (const s of long) {
      const ss = sessions(s.frames)
      expect(s.frames[ss[0]!.start]!.t).toBeLessThan(600)
      for (let i = 1; i < ss.length; i++) {
        const gap = s.frames[ss[i]!.start]!.t - s.frames[ss[i - 1]!.start]!.t
        expect(gap).toBeGreaterThanOrEqual(CORMORANT_PERCH.every[0] * 60 - 1)
        expect(gap).toBeLessThanOrEqual(CORMORANT_PERCH.every[1] * 60 + CORMORANT_PERCH.session.max + 1)
      }
      // spread, 2-4 bouts of 0.5-3 minutes each
      for (const ses of ss.slice(0, -1)) {
        const frames = s.frames.slice(ses.start, ses.end)
        const bouts = runs(frames, f => f.state === 'spread')
        expect(bouts.length).toBeGreaterThanOrEqual(2)
        expect(bouts.length).toBeLessThanOrEqual(4)
        for (const b of bouts) { expect(b.seconds).toBeGreaterThanOrEqual(30 - 0.3); expect(b.seconds).toBeLessThanOrEqual(180 + 0.3) }
        const spread = bouts.reduce((a, b) => a + b.seconds, 0)
        expect(spread).toBeGreaterThan(150)
        expect(spread).toBeLessThan(CORMORANT_PERCH.session.max)
      }
    }
  })
  it('has about one bird in nine with its wings spread over a long visit', () => {
    const share = mean(long.map(s => s.frames.filter(f => f.pose.dry > 0.5).length / s.frames.length))
    expect(share).toBeGreaterThan(0.06)
    expect(share).toBeLessThan(0.16)
  })
  it('faces into the wind, within 20 degrees, while its wings are spread', () => {
    for (const s of long) for (const f of s.frames.filter(f => f.state === 'spread' && f.pose.dry > 0.9)) {
      const off = Math.atan2(Math.sin(f.h - into), Math.cos(f.h - into))
      expect(Math.abs(off)).toBeLessThan(THREE.MathUtils.degToRad(20))
    }
  })
  it('flaps the spread wings slowly now and then, and holds them still the rest', () => {
    const spread = long[0]!.frames.filter(f => f.state === 'spread')
    const flapping = spread.filter(f => f.pose.wingSpread > 0.05)
    expect(flapping.length).toBeGreaterThan(0)
    expect(flapping.length).toBeLessThan(spread.length * 0.3)
  })
  it('rests with its neck drawn in or erect, changing now and then', () => {
    const necks = long[0]!.frames.map(f => f.pose.neckExtend)
    expect(Math.min(...necks)).toBeLessThan(0.3)
    expect(Math.max(...necks)).toBeGreaterThan(0.7)
  })
  it('never jumps between frames at 60 fps', () => {
    for (let i = 1; i < fine.frames.length; i++) {
      const a = fine.frames[i - 1]!, b = fine.frames[i]!
      expect(Math.abs(Math.atan2(Math.sin(b.h - a.h), Math.cos(b.h - a.h)))).toBeLessThan(0.05)
      expect(Math.abs(b.pose.dry - a.pose.dry)).toBeLessThan(0.05)
      expect(Math.abs(b.pose.neckExtend - a.pose.neckExtend)).toBeLessThan(0.05)
      expect(Math.abs(b.pose.lean.x - a.pose.lean.x)).toBeLessThan(0.05)
    }
  })
})
