import { createPelican, PELICAN, NECK, placeOn, dipDown, dipSeconds, type PelicanSettings } from './pelican'
import { createSwim, companyOf } from './swim'
import { startSpot } from './swimmer'
import { defaultPose, type PoseState } from '../birds/model'
import { makeRng } from '../catalog/rng'
import { pointInPolygon } from '../location/zones'
import type { BehaviorContext, BehaviorController, Drive, FlockGroup } from './types'

type Pt = [number, number]
const lake = { kind: 'polygon' as const, points: [[0, 0], [60, 0], [60, 40], [0, 40]] as Pt[] }
const WIND = { dirX: 1, dirZ: 0, effective: 0.3 }
const ctx = (seed: number, more: Partial<BehaviorContext> = {}): BehaviorContext => ({
  zone: lake, rng: makeRng(seed), wind: () => WIND, ground: () => -2, foraging: 'pelican', ...more,
})
const FEEDING = ['gather', 'drive', 'dip', 'drain', 'swallow']

interface Frame { t: number; states: string[]; xs: number[]; zs: number[]; headings: number[]; poses: PoseState[]; drive?: Drive }
interface Ring { t: number; x: number; z: number; size: number }

/** A flock of pelicans, started as the spawner starts them, recorded every frame after every bird has updated. */
function flock(seed: number, seconds: number, fps: number, n = 5, S: PelicanSettings = PELICAN, zone = lake) {
  const rng = makeRng(seed), group: FlockGroup = { targetX: 30, targetZ: 20, retargetAt: PELICAN.flock.retargetSeconds }
  if (zone !== lake) { group.targetX = zone.points[0]![0] + 1; group.targetZ = zone.points[0]![1] + 1 }
  const birds: BehaviorController[] = [], rings: Ring[] = []
  let t = 0
  for (let k = 0; k < n; k++) {
    const [x, z] = startSpot(zone, rng, group, companyOf('pelican'), birds)
    birds.push(createPelican(ctx(seed * 10 + k, { zone, group, neighbours: () => birds, onRipple: (rx, rz, size) => rings.push({ t, x: rx, z: rz, size: size ?? 1 }) }), x, z, S))
  }
  const poses = birds.map(() => defaultPose()), frames: Frame[] = []
  for (let i = 0; i < seconds * fps; i++) {
    t = i / fps
    birds.forEach((b, k) => b.update(1 / fps, poses[k]!))
    frames.push({
      t, states: birds.map(b => b.state), xs: birds.map(b => b.x), zs: birds.map(b => b.z), headings: birds.map(b => b.heading),
      poses: poses.map(p => ({ ...p, lean: p.lean.clone() })), drive: group.drive,
    })
  }
  return { frames, rings, birds, group, fps, n }
}
type Flock = ReturnType<typeof flock>

/** Every drive a run saw, with the frames it was the flock's drive for. */
function drives(f: Flock): { d: Drive; frames: Frame[] }[] {
  const out: { d: Drive; frames: Frame[] }[] = []
  for (const fr of f.frames) {
    if (!fr.drive) continue
    const last = out[out.length - 1]
    if (last && last.d === fr.drive) last.frames.push(fr)
    else out.push({ d: fr.drive, frames: [fr] })
  }
  return out
}
/** A drive's frames once the line has set off, with the seconds since; the frames and the birds share a clock. */
const underWay = (f: Flock, x: { d: Drive; frames: Frame[] }) => {
  const t0 = x.frames[0]!.t
  // the drive was called on the frame before its first recorded one at the earliest, so its clock then was t0 + 1/fps
  return x.frames.map(fr => ({ fr, tau: fr.t + 1 / f.fps - x.d.startAt })).filter(e => e.tau >= 0 && e.fr.t >= t0)
}
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

describe('pelican', () => {
  // four flocks of five for an hour each, at 10 frames a second
  const hours = [1, 2, 3, 4].map(seed => flock(seed, 3600, 10))
  // one flock for fifteen minutes at 60 frames a second
  const fine = flock(7, 900, 60)

  it('is what swim gives a pelican', () => {
    const c = createSwim(ctx(1), 30, 20)
    const pose = defaultPose(), states = new Set<string>()
    for (let i = 0; i < 1800 * 10; i++) { c.update(0.1, pose); states.add(c.state) }
    expect(states).toContain('dip')
    expect(states).toContain('loaf')
    expect(companyOf('pelican').spacing).toEqual(PELICAN.spacing)
  })
  it('spends its time as its settings say: mostly loafing, some cruising, and feeding in bouts', () => {
    const all = hours.flatMap(h => h.frames.flatMap(f => f.states))
    const share = (names: string[]) => all.filter(s => names.includes(s)).length / all.length
    const total = PELICAN.loaf.share + PELICAN.cruising.share + PELICAN.alert.share + PELICAN.feed.share
    expect(share(['loaf'])).toBeGreaterThan(0.75 * PELICAN.loaf.share / total)
    expect(share(['loaf'])).toBeLessThan(1.25 * PELICAN.loaf.share / total)
    expect(share(['cruise'])).toBeGreaterThan(0.6 * PELICAN.cruising.share / total)
    expect(share(['cruise'])).toBeLessThan(1.6 * PELICAN.cruising.share / total)
    expect(share(FEEDING)).toBeGreaterThan(0.6 * PELICAN.feed.share / total)
    expect(share(FEEDING)).toBeLessThan(1.6 * PELICAN.feed.share / total)
  })
  it('feeds as a flock: a bout takes every bird, and lets every bird go when it is over', () => {
    for (const h of hours) {
      expect(drives(h).length).toBeGreaterThan(3)
      let amiss = 0
      for (const fr of h.frames) {
        const feeding = fr.states.filter(s => FEEDING.includes(s)).length
        // the frame a bout is called, the birds that updated before the caller join on the next
        if (fr.drive ? feeding < 1 : feeding > 0) amiss++
      }
      expect(amiss).toBe(0)
      for (const x of drives(h)) {
        expect(x.d.birds).toHaveLength(h.n)
        expect(new Set(x.d.birds).size).toBe(h.n)
        for (const fr of x.frames.slice(1)) expect(fr.states.every(s => FEEDING.includes(s))).toBe(true)
      }
    }
  })
  it('gathers on a line abreast and swims forward in line, each bird on its place and facing the way the line goes', () => {
    let checked = 0
    for (const x of drives(fine)) {
      for (const { fr, tau } of underWay(fine, x)) {
        x.d.birds.forEach((bird, k) => {
          const i = fine.birds.indexOf(bird as BehaviorController)
          const [px, pz] = placeOn(x.d, k, tau)
          expect(Math.hypot(fr.xs[i]! - px, fr.zs[i]! - pz), `place ${k} at ${tau.toFixed(1)} s`).toBeLessThan(0.2)
          expect(Math.abs(wrap(fr.headings[i]! - x.d.heading)), `heading ${k} at ${tau.toFixed(1)} s`).toBeLessThan(0.25)
          checked++
        })
        // abreast: neighbours along the line the spacing apart, give or take
        for (let k = 1; k < x.d.birds.length; k++) {
          const a = fine.birds.indexOf(x.d.birds[k - 1] as BehaviorController), c = fine.birds.indexOf(x.d.birds[k] as BehaviorController)
          const gap = Math.hypot(fr.xs[a]! - fr.xs[c]!, fr.zs[a]! - fr.zs[c]!)
          expect(gap).toBeGreaterThan(x.d.spacing - 0.3)
          expect(gap).toBeLessThan(x.d.spacing + 0.3)
        }
      }
    }
    expect(checked).toBeGreaterThan(1000)
  })
  it('dips together: every bill starts down within the window of the first, a few times a bout', () => {
    const all = hours.flatMap(h => drives(h))
    for (const { d } of all) {
      expect(d.dips.length).toBeGreaterThanOrEqual(PELICAN.feed.dips[0])
      expect(d.dips.length).toBeLessThanOrEqual(PELICAN.feed.dips[1])
      d.dips.forEach((dip, j) => {
        const first = Math.min(...dip.at), last = Math.max(...dip.at)
        expect(last - first).toBeLessThanOrEqual(PELICAN.feed.window)
        // no bird is still in its last dip, draining, or swallowing when the next begins
        if (j > 0) expect(first - Math.max(...d.dips[j - 1]!.at)).toBeGreaterThanOrEqual(dipSeconds(PELICAN, true))
      })
      expect(d.endAt - d.startAt).toBeGreaterThanOrEqual(Math.max(...d.dips.at(-1)!.at) + dipSeconds(PELICAN, true))
    }
    // a dip about every ten seconds a bird, as Anderson counted in groups of four or more
    const gaps = all.flatMap(({ d }) => d.dips.slice(1).map((dip, j) => dip.at[0]! - d.dips[j]!.at[0]!))
    const mean = gaps.reduce((a, c) => a + c, 0) / gaps.length
    expect(mean).toBeGreaterThan(9)
    expect(mean).toBeLessThan(11)
    // and not on the same frame: across the bouts, the birds' starts are spread through the window
    const spreads = all.flatMap(({ d }) => d.dips.map(dip => Math.max(...dip.at) - Math.min(...dip.at)))
    expect(spreads.reduce((a, c) => a + c, 0) / spreads.length).toBeGreaterThan(0.3 * PELICAN.feed.window)
  })
  it('in the pose: the bill goes under, comes up with the pouch full, and the pouch drains', () => {
    let dipsSeen = 0, longer = 0
    for (const x of drives(fine)) {
      const frames = underWay(fine, x)
      x.d.birds.forEach((bird, k) => {
        const i = fine.birds.indexOf(bird as BehaviorController)
        x.d.dips.forEach(dip => {
          const at = (u: number) => frames.find(e => e.tau >= dip.at[k]! + u)?.fr.poses[i]
          // a bird that catches keeps its bill under longer
          const caught = dip.caught[k]!, D = dipDown(PELICAN, caught)
          const under = at(D - PELICAN.dip.up - 0.1), full = at(D), drained = at(D + PELICAN.dip.drain + 0.02)
          if (!under || !full || !drained) return
          dipsSeen++
          if (caught) longer++
          expect(under.reach).toBeCloseTo(1, 5)
          expect(under.reachDepth).toBe(PELICAN.dip.depth)
          expect(under.reachAngle).toBe(PELICAN.dip.angle)
          expect(under.pouch).toBe(0)
          expect(under.lean.x).toBeCloseTo(PELICAN.dip.lean, 5)
          expect(full.reach).toBeLessThan(0.02)
          expect(full.pouch).toBeGreaterThan(0.95)
          expect(drained.pouch).toBe(0)
          expect(drained.reach).toBe(0)
        })
      })
    }
    expect(dipsSeen).toBeGreaterThan(20)
    expect(longer).toBeGreaterThan(0)
    expect(dipDown(PELICAN, true) - dipDown(PELICAN, false)).toBeCloseTo(PELICAN.dip.underCaught - PELICAN.dip.under, 9)
  })
  it('swallows only after a dip that caught, the neck up and the bill tipped, and catches about as often as its settings say', () => {
    let caught = 0, dips = 0
    for (const h of hours) {
      for (const x of drives(h)) {
        for (const dip of x.d.dips) { dips += dip.caught.length; caught += dip.caught.filter(Boolean).length }
      }
      let outOfTurn = 0, top = 0
      for (const fr of h.frames) {
        fr.states.forEach((s, i) => {
          if (fr.poses[i]!.headPitch > 0 && s !== 'swallow') outOfTurn++
          top = Math.max(top, fr.poses[i]!.headPitch)
        })
      }
      expect(outOfTurn).toBe(0)
      expect(top).toBeLessThanOrEqual(PELICAN.dip.pitch + 1e-9)
      expect(h.frames.some(fr => fr.states.includes('swallow'))).toBe(true)
      expect(h.frames.reduce((top, fr) => Math.max(top, ...fr.poses.map(p => p.headPitch)), 0)).toBeGreaterThan(0.95 * PELICAN.dip.pitch)
    }
    expect(dips).toBeGreaterThan(1000)
    expect(caught / dips).toBeGreaterThan(PELICAN.dip.catch - 0.04)
    expect(caught / dips).toBeLessThan(PELICAN.dip.catch + 0.04)
  })
  it('rings the water twice a bird a dip, as the bill goes in and, smaller, as it drains; and at no other time', () => {
    for (const h of hours) {
      // bouts that ran their whole length inside the run
      const whole = drives(h).filter(x => x.d.endAt < 3600 - 1)
      const expected = whole.reduce((s, x) => s + x.d.dips.length * h.n, 0)
      const inWhole = h.rings.filter(r => whole.some(x => r.t + 0.1 >= x.d.startAt && r.t + 0.1 <= x.d.endAt))
      expect(inWhole.filter(r => r.size === PELICAN.ring.size)).toHaveLength(expected)
      expect(inWhole.filter(r => r.size === PELICAN.ring.drain)).toHaveLength(expected)
      expect(h.rings.every(r => r.size === PELICAN.ring.size || r.size === PELICAN.ring.drain)).toBe(true)
      expect(h.rings.every(r => drives(h).some(x => r.t + 0.2 >= x.d.startAt && r.t <= x.d.endAt))).toBe(true)
    }
  })
  it('loafs with its neck in the S or its head sunk on its shoulders, about half and half', () => {
    let s = 0, sunk = 0
    for (const h of hours) {
      for (const fr of h.frames) {
        fr.states.forEach((state, i) => {
          if (state !== 'loaf') return
          const neck = fr.poses[i]!.neckExtend
          if (Math.abs(neck - NECK.loaf) < 0.02) s++
          else if (Math.abs(neck - NECK.sunk) < 0.02) sunk++
        })
      }
    }
    expect(sunk / (s + sunk)).toBeGreaterThan(PELICAN.loaf.sunk - 0.15)
    expect(sunk / (s + sunk)).toBeLessThan(PELICAN.loaf.sunk + 0.15)
  })
  it('never leaves its water, and keeps its distance from its flockmates, closing up only to feed', () => {
    for (const h of [...hours, fine]) {
      // in a bout the line closes up abreast; a minute after one, the birds are as far apart as they keep at other times
      let closest = Infinity, apart = Infinity, out = 0, lastDrive = -Infinity
      for (const fr of h.frames) {
        if (fr.drive) lastDrive = fr.t
        for (let i = 0; i < h.n; i++) {
          if (!pointInPolygon(fr.xs[i]!, fr.zs[i]!, lake.points)) out++
          for (let j = 0; j < i; j++) {
            const d = Math.hypot(fr.xs[i]! - fr.xs[j]!, fr.zs[i]! - fr.zs[j]!)
            closest = Math.min(closest, d)
            if (fr.t - lastDrive > 60) apart = Math.min(apart, d)
          }
        }
      }
      expect(out).toBe(0)
      expect(closest).toBeGreaterThan(PELICAN.feed.keep - 0.05)
      expect(apart).toBeGreaterThan(PELICAN.spacing.flock - 0.05)
    }
  })
  it('never snaps from one pose to the next', () => {
    const dt = 1 / fine.fps
    const most = { reach: 0, pouch: 0, headPitch: 0, neckExtend: 0, lean: 0 }
    for (let k = 1; k < fine.frames.length; k++) {
      for (let i = 0; i < fine.n; i++) {
        const a = fine.frames[k - 1]!.poses[i]!, b = fine.frames[k]!.poses[i]!
        most.reach = Math.max(most.reach, Math.abs(b.reach - a.reach))
        most.pouch = Math.max(most.pouch, Math.abs(b.pouch - a.pouch))
        most.headPitch = Math.max(most.headPitch, Math.abs(b.headPitch - a.headPitch))
        most.neckExtend = Math.max(most.neckExtend, Math.abs(b.neckExtend - a.neckExtend))
        most.lean = Math.max(most.lean, Math.abs(b.lean.x - a.lean.x))
      }
    }
    // smoothstep's steepest slope is 1.5 over its length
    expect(most.reach).toBeLessThan((1.5 / Math.min(PELICAN.dip.down, PELICAN.dip.up)) * dt + 1e-9)
    expect(most.pouch).toBeLessThan((1.5 / PELICAN.dip.up) * dt + 1e-9)
    expect(most.headPitch).toBeLessThan(PELICAN.dip.pitch * (1.5 / 0.4) * dt + 1e-9)
    // the neck: its own easing (3 a second of what is left, at most all of it) and the swallow's rise
    expect(most.neckExtend).toBeLessThan((3 + 1.5 / 0.4) * dt + 1e-9)
    expect(most.pouch).toBeGreaterThan(0)
    expect(most.lean).toBeLessThan(PELICAN.dip.lean * (1.5 / Math.min(PELICAN.dip.down, PELICAN.dip.up)) * dt + 1e-9)
    expect(most.reach).toBeGreaterThan(0)
  })
  it('a bird on its own feeds on its own, in the same way', () => {
    const solo = flock(3, 3600, 10, 1)
    expect(drives(solo).length).toBeGreaterThan(5)
    expect(drives(solo).every(x => x.d.birds.length === 1)).toBe(true)
    expect(solo.rings.length).toBeGreaterThan(30)
  })
  it('calls no bout where no line has room to swim', () => {
    const pond = { kind: 'polygon' as const, points: [[0, 0], [8, 0], [8, 8], [0, 8]] as Pt[] }
    const small = flock(2, 1800, 10, 5, PELICAN, pond)
    expect(drives(small)).toHaveLength(0)
    expect(small.frames.every(fr => fr.states.every(s => !FEEDING.includes(s)))).toBe(true)
  })
})
