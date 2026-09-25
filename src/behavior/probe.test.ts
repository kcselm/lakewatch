import { createProbe, STYLES, PECK_BOTTOM } from './probe'
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
function record(c: BehaviorController, seconds: number, pose: PoseState = defaultPose()): Frame[] {
  const frames: Frame[] = []
  let px = c.x, pz = c.z
  for (let i = 0; i < seconds * 30; i++) {
    const state = c.state
    c.update(1 / 30, pose)
    expect(pointInPolygon(c.x, c.z, zone.points)).toBe(true)
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

describe('probe, either style', () => {
  for (const foraging of ['plover', 'sandpiper'] as const) {
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
    it(`${foraging}: ruffles in a gust only while standing`, () => {
      const windy = ctx(3, { foraging, wind: () => ({ dirX: 0, dirZ: 0, effective: 1 }) })
      const frames = record(createProbe(windy, 5, 5), 90)
      const still = spells(frames).filter(s => s.frames.length > 20 && s.frames.every(f => f.moved === 0))
      expect(still.length).toBeGreaterThan(0)
      for (const s of still) expect(s.frames.at(-1)!.leanZ).toBeGreaterThan(0.015)
      for (const f of frames.filter(f => f.moved > 0)) expect(f.leanZ).toBeLessThan(0.035)
    })
  }
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
    for (let t = 0; t < 40; t += 1 / 30) { a.update(1 / 30, defaultPose()); b.update(1 / 30, defaultPose()) }
    expect(Math.hypot(a.x - group.targetX, a.z - group.targetZ)).toBeLessThan(4)
    expect(Math.hypot(b.x - group.targetX, b.z - group.targetZ)).toBeLessThan(4)
  })
})

describe('PECK_BOTTOM', () => {
  it('has a style for every foraging kind, each reaching all the way', () => {
    for (const k of ['plover', 'sandpiper'] as Foraging[]) expect(PECK_BOTTOM[k].reach).toBe(1)
  })
})
