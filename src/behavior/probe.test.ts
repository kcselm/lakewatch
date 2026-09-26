import { createProbe, STYLES, PECK_BOTTOM, TURN } from './probe'
import { defaultPose, type PoseState } from '../birds/model'
import { makeRng } from '../catalog/rng'
import { pointInPolygon } from '../location/zones'
import type { BehaviorContext, BehaviorController } from './types'
import type { Foraging } from '../birds/spec'

const zone = { kind: 'polygon' as const, points: [[0, 0], [20, 0], [20, 10], [0, 10]] as [number, number][] }
const makeGroup = () => ({ targetX: 10, targetZ: 5, retargetAt: 0 })
const ctx = (seed: number, more: Partial<BehaviorContext> = {}): BehaviorContext => ({
  zone, rng: makeRng(seed), wind: () => ({ dirX: 0, dirZ: 0, effective: 0 }), ground: () => 0.05, group: makeGroup(), ...more,
})

interface Frame { state: string; moved: number; leanX: number; leanZ: number; reach: number; gait: number }

/** Run a controller for `seconds` at 30 fps, one record per frame, under the state it was in as the frame began. */
function record(c: BehaviorController, seconds: number, pose: PoseState = defaultPose(), area = zone.points): Frame[] {
  const frames: Frame[] = []
  let px = c.x, pz = c.z
  for (let i = 0; i < seconds * 30; i++) {
    const state = c.state
    c.update(1 / 30, pose)
    expect(pointInPolygon(c.x, c.z, area)).toBe(true)
    frames.push({ state, moved: Math.hypot(c.x - px, c.z - pz), leanX: pose.lean.x, leanZ: pose.lean.z, reach: pose.reach, gait: pose.gait })
    px = c.x; pz = c.z
  }
  return frames
}

/** Consecutive frames in the same state. */
function spells(frames: Frame[]): { state: string; frames: Frame[] }[] {
  const out: { state: string; frames: Frame[] }[] = []
  for (const f of frames) {
    if (out.at(-1)?.state === f.state) out.at(-1)!.frames.push(f)
    else out.push({ state: f.state, frames: [f] })
  }
  return out
}

describe('probe, every style', () => {
  for (const foraging of ['plover', 'sandpiper', 'dowitcher'] as const) {
    it(`${foraging}: walks its legs by exactly the ground it covers`, () => {
      const c = createProbe(ctx(1, { foraging }), 5, 5)
      const pose = defaultPose()
      const frames = record(c, 90, pose)
      const walked = frames.reduce((s, f) => s + f.moved, 0)
      expect(walked).toBeGreaterThan(1)
      expect(pose.strideDistance).toBeCloseTo(walked, 9)
    })
    it(`${foraging}: gait rises while it moves and falls when it stops`, () => {
      const frames = record(createProbe(ctx(2, { foraging }), 5, 5), 90)
      for (const s of spells(frames)) {
        const last = s.frames.at(-1)!
        if (s.frames.length < 15) continue
        if (s.frames.every(f => f.moved > 0)) expect(last.gait, s.state).toBeGreaterThan(0.9)
        if (s.frames.every(f => f.moved === 0)) expect(last.gait, s.state).toBeLessThan(0.05)
      }
    })
    it(`${foraging}: turns at no more than TURN radians a second, never snapping round in a frame`, () => {
      const c = createProbe(ctx(13, { foraging }), 5, 5)
      let h = c.heading
      for (let i = 0; i < 90 * 30; i++) {
        c.update(1 / 30, defaultPose())
        const d = Math.atan2(Math.sin(c.heading - h), Math.cos(c.heading - h))
        expect(Math.abs(d)).toBeLessThanOrEqual(TURN / 30 + 1e-9)
        h = c.heading
      }
    })
    it(`${foraging}: ruffles in a gust only while standing`, () => {
      const windy = ctx(3, { foraging, wind: () => ({ dirX: 0, dirZ: 0, effective: 1 }) })
      const frames = record(createProbe(windy, 5, 5), 90)
      const still = spells(frames).filter(s => s.frames.length > 20 && s.frames.every(f => f.moved === 0))
      expect(still.length).toBeGreaterThan(0)
      for (const s of still) expect(s.frames.at(-1)!.leanZ).toBeGreaterThan(0.015)
      for (const f of frames.filter(f => f.moved > 0)) expect(f.leanZ).toBeLessThan(0.035)
    })
  }
  it('eases the bill into and out of every peck: at 60 fps its first frame barely lifts reach off zero', () => {
    for (const foraging of ['plover', 'sandpiper'] as const) {
      const c = createProbe(ctx(14, { foraging }), 5, 5)
      const pose = defaultPose()
      let prev = 0, starts = 0
      const dab: number[] = []
      for (let i = 0; i < 120 * 60; i++) {
        const state = c.state
        c.update(1 / 60, pose)
        if (foraging === 'plover') {
          // a dab is its own state: its first and last frames stay close to the rest pose
          if (state === 'peck') {
            if (!dab.length) { starts++; expect(pose.reach, `plover frame ${i}`).toBeLessThan(0.1) }
            dab.push(pose.reach)
          } else if (dab.length) { expect(dab.at(-1)!, `plover frame ${i}`).toBeLessThan(0.1); dab.length = 0 }
        } else if (prev === 0 && pose.reach > 0) {
          // a sandpiper's bill rests at exactly 0 between pecks
          starts++
          expect(pose.reach, `sandpiper frame ${i}`).toBeLessThan(0.1)
        }
        prev = pose.reach
      }
      expect(starts, foraging).toBeGreaterThan(10)
    }
  })
  it('moves the bill continuously: at 60 fps reach never changes by more than a smooth peck does in a frame', () => {
    // the fastest smooth peck is 3 a second along sin^2, at most 6 pi / 60 = 0.31 a frame
    for (const foraging of ['plover', 'sandpiper', 'dowitcher'] as const) {
      const c = createProbe(ctx(15, { foraging }), 5, 5)
      const pose = defaultPose()
      let prev = pose.reach
      for (let i = 0; i < 120 * 60; i++) {
        c.update(1 / 60, pose)
        expect(Math.abs(pose.reach - prev), `${foraging} frame ${i} (${c.state})`).toBeLessThan(0.35)
        prev = pose.reach
      }
    }
  })
  it('feeds as a sandpiper when the species has no style', () => {
    const states = new Set(record(createProbe(ctx(4), 5, 5), 60).map(f => f.state))
    expect([...states].every(s => ['walk', 'peck', 'run'].includes(s))).toBe(true)
  })
})

describe('probe, plover', () => {
  const S = STYLES.plover
  const frames = record(createProbe(ctx(5, { foraging: 'plover' }), 5, 5), 300)
  const all = spells(frames)

  it('runs, stops to look, and sometimes pecks', () => {
    expect(new Set(frames.map(f => f.state))).toEqual(new Set(['run', 'look', 'peck']))
  })
  it('runs a short dash each time', () => {
    const runs = all.filter(s => s.state === 'run').map(s => s.frames.reduce((d, f) => d + f.moved, 0))
    expect(runs.length).toBeGreaterThan(10)
    for (const d of runs) expect(d).toBeLessThanOrEqual(S.run.distance[1] + 1e-6)
    expect(runs.reduce((a, b) => a + b, 0) / runs.length).toBeGreaterThan(S.run.distance[0])
  })
  it('stands still and upright while it looks', () => {
    for (const s of all.filter(s => s.state === 'look')) {
      for (const f of s.frames) expect(f.moved).toBe(0)
      if (s.frames.length > 15) expect(s.frames.at(-1)!.leanX).toBeLessThanOrEqual(0)
    }
  })
  it('reaches the bottom of its peck halfway through', () => {
    const pecks = all.filter(s => s.state === 'peck')
    expect(pecks.length).toBeGreaterThan(3)
    for (const s of pecks) {
      const bottom = s.frames.reduce((a, f) => (f.reach > a.reach ? f : a))
      expect(bottom.reach).toBeGreaterThan(0.97)
      expect(bottom.leanX).toBeCloseTo(PECK_BOTTOM.plover.lean, 1)
      expect(s.frames.at(-1)!.reach).toBeLessThan(0.3)
    }
  })
  it('keeps feeding in a patch smaller than its dash: the edge ends a run, never traps it', () => {
    const patch = { kind: 'polygon' as const, points: [[0, 0], [0.4, 0], [0.4, 0.4], [0, 0.4]] as [number, number][] }
    const c = createProbe({ ...ctx(12, { foraging: 'plover' }), zone: patch }, 0.2, 0.2)
    const pose = defaultPose()
    const seen: string[] = []
    let walked = 0, px = c.x, pz = c.z
    for (let i = 0; i < 60 * 30; i++) {
      c.update(1 / 30, pose)
      expect(pointInPolygon(c.x, c.z, patch.points)).toBe(true)
      walked += Math.hypot(c.x - px, c.z - pz); px = c.x; pz = c.z
      if (seen.at(-1) !== c.state) seen.push(c.state)
    }
    expect(seen.filter(s => s === 'run').length).toBeGreaterThan(5)
    expect(pose.strideDistance).toBeCloseTo(walked, 9)
  })
  it('feeds on its own: it leaves the flock target alone', () => {
    const group = makeGroup()
    record(createProbe(ctx(6, { foraging: 'plover', group }), 5, 5), 120)
    expect(group).toEqual(makeGroup())
  })
})

describe('probe, sandpiper', () => {
  it('walks and pecks as it goes, and stops for a few probes', () => {
    const frames = record(createProbe(ctx(7, { foraging: 'sandpiper' }), 10, 5), 240)
    const walking = frames.filter(f => f.state === 'walk' && f.moved > 0)
    expect(walking.length).toBeGreaterThan(600)
    expect(Math.max(...walking.map(f => f.reach))).toBeGreaterThan(0.95)
    expect(Math.min(...walking.map(f => f.reach))).toBeLessThan(0.05)
    const probes = spells(frames).filter(s => s.state === 'peck')
    expect(probes.length).toBeGreaterThan(3)
    for (const s of probes) for (const f of s.frames) expect(f.moved).toBe(0)
  })
  it('pecks with its body tipped forward to the peck-bottom lean', () => {
    const frames = record(createProbe(ctx(8, { foraging: 'sandpiper' }), 10, 5), 60)
    const deep = frames.filter(f => f.reach > 0.97)
    expect(deep.length).toBeGreaterThan(0)
    for (const f of deep.slice(5)) expect(f.leanX).toBeCloseTo(PECK_BOTTOM.sandpiper.lean, 1)
  })
  it('runs to catch up when the flock is far off, then walks again', () => {
    const group = { targetX: 18, targetZ: 8, retargetAt: 1e9 }
    const frames = record(createProbe(ctx(9, { foraging: 'sandpiper', group }), 2, 2), 60)
    expect(frames[0]!.state).toBe('run')
    expect(frames.at(-1)!.state).not.toBe('run')
  })
  it('keeps with the flock: members converge on the shared target', () => {
    const group = makeGroup()
    const a = createProbe(ctx(10, { foraging: 'sandpiper', group }), 1, 1)
    const b = createProbe(ctx(11, { foraging: 'sandpiper', group }), 19, 9)
    const pa = defaultPose(), pb = defaultPose()            // each bird keeps its own pose, as the spawner does
    for (let t = 0; t < 40; t += 1 / 30) { a.update(1 / 30, pa); b.update(1 / 30, pb) }
    expect(Math.hypot(a.x - group.targetX, a.z - group.targetZ)).toBeLessThan(4)
    expect(Math.hypot(b.x - group.targetX, b.z - group.targetZ)).toBeLessThan(4)
  })
})

describe('probe, dowitcher', () => {
  const S = STYLES.dowitcher
  // a patch of water about the size of the lake's bench, with a flock of its own
  const strip = { kind: 'polygon' as const, points: [[0, 0], [6, 0], [6, 1], [0, 1]] as [number, number][] }
  const dctx = (seed: number, more: Partial<BehaviorContext> = {}): BehaviorContext =>
    ctx(seed, { foraging: 'dowitcher', zone: strip, group: { targetX: 3, targetZ: 0.5, retargetAt: 0 }, ...more })
  const frames = record(createProbe(dctx(16), 1, 0.5), 300, defaultPose(), strip.points)
  const all = spells(frames)

  it('stitches, creeps, looks up, and follows its flock', () => {
    expect(new Set(frames.map(f => f.state))).toEqual(new Set(['stitch', 'creep', 'look', 'follow']))
  })
  it('keeps its feet still while it stitches', () => {
    const bouts = all.filter(s => s.state === 'stitch')
    expect(bouts.length).toBeGreaterThan(10)
    for (const s of bouts) for (const f of s.frames) expect(f.moved).toBe(0)
  })
  it('stitches with its bill in the water: once its head is down, reach runs between the high point and the bottom', () => {
    // the head takes S.dip.seconds to come down; after that, every frame of a bout stays in the stitch band
    const settle = Math.ceil(S.dip.seconds * 30)
    const bouts = all.filter(s => s.state === 'stitch' && s.frames.length > settle + 30)
    expect(bouts.length).toBeGreaterThan(5)
    for (const s of bouts) {
      const settled = s.frames.slice(settle)
      for (const f of settled) expect(f.reach).toBeGreaterThanOrEqual(S.stitch.high - 1e-6)
      expect(Math.max(...settled.map(f => f.reach))).toBeGreaterThan(0.97)
      expect(Math.min(...settled.map(f => f.reach))).toBeLessThan(S.stitch.high + 0.05)
    }
  })
  it('stitches as it creeps: the bill keeps going while the feet step', () => {
    const creeping = frames.filter(f => f.state === 'creep' && f.moved > 0)
    expect(creeping.length).toBeGreaterThan(100)
    expect(Math.max(...creeping.map(f => f.reach))).toBeGreaterThan(0.97)
  })
  it('creeps only a short way each time', () => {
    const creeps = all.filter(s => s.state === 'creep').map(s => s.frames.reduce((d, f) => d + f.moved, 0))
    expect(creeps.length).toBeGreaterThan(10)
    for (const d of creeps) expect(d).toBeLessThanOrEqual(S.creep.distance[1] + 1e-6)
  })
  it('lifts its head clear of the water to look, then puts it back', () => {
    const looks = all.filter(s => s.state === 'look' && s.frames.length > S.dip.seconds * 30 + 5)
    expect(looks.length).toBeGreaterThan(2)
    for (const s of looks) {
      for (const f of s.frames) expect(f.moved).toBe(0)
      expect(s.frames.at(-1)!.reach).toBeLessThan(0.02)
    }
  })
  it('pecks with its body tipped forward to the peck-bottom lean', () => {
    const deep = frames.filter(f => f.state === 'stitch' && f.reach > 0.97)
    expect(deep.length).toBeGreaterThan(0)
    for (const f of deep) expect(f.leanX).toBeCloseTo(PECK_BOTTOM.dowitcher.lean, 1)
  })
  it('rings the water ahead of it at the bottom of a stroke, no more often than its ripple interval', () => {
    const rings: { t: number; x: number; z: number; size?: number }[] = []
    let t = 0
    const c = createProbe(dctx(17, { onRipple: (x, z, size) => rings.push({ t, x, z, size }) }), 3, 0.5)
    const pose = defaultPose()
    for (let i = 0; i < 120 * 60; i++) {
      t = i / 60
      c.update(1 / 60, pose)
      if (rings.at(-1)?.t === t) {
        const r = rings.at(-1)!
        expect(pose.reach).toBeGreaterThan(0.95)
        expect(r.size).toBe(S.ripple.size)          // a bill's small ring, not a duck's wake
        expect(Math.hypot(r.x - c.x, r.z - c.z)).toBeCloseTo(S.ripple.ahead, 6)
        // ahead is where the bird faces: +x at heading 0, counter-clockwise seen from above (-z)
        expect(r.x - c.x).toBeCloseTo(Math.cos(c.heading) * S.ripple.ahead, 6)
        expect(r.z - c.z).toBeCloseTo(-Math.sin(c.heading) * S.ripple.ahead, 6)
      }
    }
    expect(rings.length).toBeGreaterThan(30)
    for (let i = 1; i < rings.length; i++) expect(rings[i]!.t - rings[i - 1]!.t).toBeGreaterThanOrEqual(S.ripple.every - 1e-9)
  })
  it('turns slowly with its bill in the mud: while it creeps, at no more than 2 rad/s and never past 60 degrees', () => {
    // a spot behind it is left to follow, which lifts the head first
    const rate = 2, cone = Math.PI / 3
    const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
    for (let seed = 1; seed <= 6; seed++) {
      const c = createProbe(dctx(seed), 1, 0.5)
      const pose = defaultPose()
      let h = c.heading, start = NaN, creeps = 0
      for (let i = 0; i < 300 * 60; i++) {
        const state = c.state
        if (state !== 'creep') start = NaN
        else if (Number.isNaN(start)) { start = c.heading; creeps++ }
        c.update(1 / 60, pose)
        if (state === 'creep') {
          const turned = Math.abs(wrap(c.heading - h)), off = Math.abs(wrap(c.heading - start))
          if (turned > rate / 60 + 1e-9) expect.fail(`seed ${seed}, frame ${i}: turned ${turned.toFixed(4)} rad in a frame`)
          if (off > cone + 1e-9) expect.fail(`seed ${seed}, frame ${i}: ${((off * 180) / Math.PI).toFixed(1)} degrees off`)
        }
        h = c.heading
      }
      expect(creeps, `seed ${seed}`).toBeGreaterThan(10)
    }
  })
  it('never leans on the zone clamp in a strip 0.3 m wide: every frame moves it no further than its pace', () => {
    // Flock spots near the edge get clamped to just inside it, so a bird that curved round while walking would clip
    // the edge and the clamp would jump it several centimetres. Turning on the spot first, it never does.
    const thin = { kind: 'polygon' as const, points: [[0, 0], [5, 0], [5, 0.3], [0, 0.3]] as [number, number][] }
    const pace = Math.max(S.creep.speed, S.follow.speed) / 30
    for (let seed = 1; seed <= 20; seed++) {
      const c = createProbe(dctx(seed, { zone: thin, group: { targetX: 2.5, targetZ: 0.15, retargetAt: 0 } }), 0.3, 0.15)
      const pose = defaultPose()
      let px = c.x, pz = c.z
      for (let i = 0; i < 300 * 30; i++) {
        c.update(1 / 30, pose)
        expect(pointInPolygon(c.x, c.z, thin.points)).toBe(true)
        const moved = Math.hypot(c.x - px, c.z - pz)
        if (moved > pace + 1e-9) expect.fail(`seed ${seed}, frame ${i}: moved ${moved.toFixed(4)} m`)
        px = c.x; pz = c.z
      }
    }
  })
  it('works one patch, then drifts a short way on: the flock target never jumps further than its drift', () => {
    const group = { targetX: 3, targetZ: 0.5, retargetAt: 0 }
    const c = createProbe(dctx(21, { group }), 3, 0.5)
    const pose = defaultPose()
    let [gx, gz] = [group.targetX, group.targetZ], moves = 0
    for (let i = 0; i < 600 * 30; i++) {
      c.update(1 / 30, pose)
      const jump = Math.hypot(group.targetX - gx, group.targetZ - gz)
      if (jump > 0) { moves++; expect(jump).toBeLessThanOrEqual(S.flock.drift + 1e-9) }
      ;[gx, gz] = [group.targetX, group.targetZ]
    }
    expect(moves).toBeGreaterThan(10)
  })
  // the lake's bench zone, about 22 m from the vantage at the origin, where the spawner seeds every flock's target
  const bench = { kind: 'polygon' as const, points: [[18.5, -11.8], [25.5, -11.8], [25.5, -13.9], [18.5, -13.9]] as [number, number][] }
  it('moves a flock target that starts outside the zone straight into it: the drift limit holds only inside', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const group = { targetX: 0, targetZ: 0, retargetAt: 0 }
      const c = createProbe(ctx(seed, { foraging: 'dowitcher', zone: bench, group }), 22, -12.85)
      const pose = defaultPose()
      for (let i = 0; i < 30 * 30 && group.retargetAt === 0; i++) c.update(1 / 30, pose)
      expect(group.retargetAt, `seed ${seed}`).toBeGreaterThan(0)
      expect(pointInPolygon(group.targetX, group.targetZ, bench.points), `seed ${seed}`).toBe(true)
    }
  })
  it('spreads over its patch: six birds whose target starts at the vantage keep a mean nearest neighbour over 0.2 m', () => {
    // Seeded at the origin and held to its drift, the target took some 14 minutes to reach the bench, every bird
    // followed it, and the zone clamp piled them all within centimetres at the bench's near edge.
    let sum = 0, n = 0
    for (let seed = 1; seed <= 4; seed++) {
      const rng = makeRng(seed), group = { targetX: 0, targetZ: 0, retargetAt: 0 }
      const birds = Array.from({ length: 6 }, () => {
        const [sx, sz] = [18.5 + rng() * 7, -13.9 + rng() * 2.1]
        return { c: createProbe(ctx(Math.floor(rng() * 1e9), { foraging: 'dowitcher', zone: bench, group }), sx, sz), pose: defaultPose() }
      })
      for (let i = 0; i < 240 * 30; i++) {
        for (const b of birds) b.c.update(1 / 30, b.pose)
        if (i < 60 * 30 || i % 30) continue                  // minutes 1 to 4, once a second
        for (const a of birds) {
          sum += Math.min(...birds.filter(b => b !== a).map(b => Math.hypot(a.c.x - b.c.x, a.c.z - b.c.z))); n++
        }
      }
    }
    expect(sum / n).toBeGreaterThan(0.2)
  })
  it('keeps with the flock: members come to within the follow distance and flock radius of the shared target', () => {
    const group = { targetX: 10, targetZ: 5, retargetAt: 1e9 }
    const a = createProbe(ctx(19, { foraging: 'dowitcher', group }), 1, 1)
    const b = createProbe(ctx(20, { foraging: 'dowitcher', group }), 19, 9)
    const pa = defaultPose(), pb = defaultPose()
    // a first stitch bout of a few seconds, then about 10 m at a wading walk
    for (let t = 0; t < 150; t += 1 / 30) { a.update(1 / 30, pa); b.update(1 / 30, pb) }
    expect(Math.hypot(a.x - group.targetX, a.z - group.targetZ)).toBeLessThan(S.follow.whenFarther + S.flock.radius)
    expect(Math.hypot(b.x - group.targetX, b.z - group.targetZ)).toBeLessThan(S.follow.whenFarther + S.flock.radius)
  })
})

describe('PECK_BOTTOM', () => {
  it('has a style for every foraging kind, each reaching all the way', () => {
    for (const k of ['plover', 'sandpiper', 'dowitcher'] as Foraging[]) expect(PECK_BOTTOM[k].reach).toBe(1)
  })
})
