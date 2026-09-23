import { createProbe } from './probe'
import { defaultPose } from '../birds/model'
import { makeRng } from '../catalog/rng'
import { pointInPolygon } from '../location/zones'
import type { BehaviorContext } from './types'

const zone = { kind: 'polygon' as const, points: [[0, 0], [20, 0], [20, 10], [0, 10]] as [number, number][] }
const makeGroup = () => ({ targetX: 10, targetZ: 5, retargetAt: 0 })
const ctx = (seed: number, group = makeGroup()): BehaviorContext => ({
  zone, rng: makeRng(seed), wind: () => ({ dirX: 0, dirZ: 0, effective: 0 }), ground: () => 0.05, group,
})

describe('probe', () => {
  it('alternates run and peck and stays in the zone', () => {
    const c = createProbe(ctx(1), 5, 5)
    const states = new Set<string>()
    for (let t = 0; t < 60; t += 1 / 30) {
      c.update(1 / 30, defaultPose()); states.add(c.state)
      expect(pointInPolygon(c.x, c.z, zone.points)).toBe(true)
    }
    expect(states).toContain('run')
    expect(states).toContain('peck')
  })
  it('members of a group converge toward the shared target', () => {
    const group = makeGroup()
    const a = createProbe(ctx(2, group), 1, 1), b = createProbe(ctx(3, group), 19, 9)
    for (let t = 0; t < 40; t += 1 / 30) { a.update(1 / 30, defaultPose()); b.update(1 / 30, defaultPose()) }
    const da = Math.hypot(a.x - group.targetX, a.z - group.targetZ)
    const db = Math.hypot(b.x - group.targetX, b.z - group.targetZ)
    expect(da).toBeLessThan(8)
    expect(db).toBeLessThan(8)
  })
  it('pecking pitches the body nose-down', () => {
    const c = createProbe(ctx(4), 5, 5)
    const pose = defaultPose()
    let guard = 0
    while (c.state !== 'peck' && guard++ < 10000) c.update(1 / 30, pose)
    c.update(0.2, pose)
    expect(pose.lean.x).toBeGreaterThan(0.2)
  })
  it('ruffles in a gust while pecking', () => {
    const leanZAfterPeck = (effective: number, seed: number) => {
      const windyCtx = (s: number): BehaviorContext => ({
        zone, rng: makeRng(s), wind: () => ({ dirX: 0, dirZ: 0, effective }), ground: () => 0.05, group: makeGroup(),
      })
      const c = createProbe(windyCtx(seed), 5, 5)
      const pose = defaultPose()
      let guard = 0
      while (c.state !== 'peck' && guard++ < 10000) c.update(1 / 30, pose)
      c.update(1, pose)
      return pose.lean.z
    }
    expect(leanZAfterPeck(1, 5)).toBeGreaterThan(0.02)
    expect(Math.abs(leanZAfterPeck(0.3, 6))).toBeLessThan(0.005)
  })
})
