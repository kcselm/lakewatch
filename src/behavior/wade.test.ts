import { createWade } from './wade'
import { defaultPose } from '../birds/model'
import { makeRng } from '../catalog/rng'
import { pointInPolygon } from '../location/zones'
import type { BehaviorContext } from './types'

const zone = { kind: 'polygon' as const, points: [[-10, -10], [10, -10], [10, 10], [-10, 10]] as [number, number][] }
const ctx = (seed: number): BehaviorContext => ({
  zone, rng: makeRng(seed), wind: () => ({ dirX: 0, dirZ: -1, effective: 0.3 }), ground: (x) => 0.1 + x * 0.01,
})

describe('wade', () => {
  it('stands on the ground height and stays in the zone', () => {
    const c = createWade(ctx(1), 2, 2)
    for (let i = 0; i < 2000; i++) {
      c.update(1 / 30, defaultPose())
      expect(pointInPolygon(c.x, c.z, zone.points)).toBe(true)
      expect(c.y).toBeCloseTo(0.1 + c.x * 0.01, 5)
    }
  })
  it('spends most of its time still', () => {
    const c = createWade(ctx(2), 0, 0)
    let still = 0, total = 0
    for (let t = 0; t < 180; t += 1 / 30) { c.update(1 / 30, defaultPose()); total++; if (c.state === 'still') still++ }
    expect(still / total).toBeGreaterThan(0.6)
  })
  it('walks: strideDistance grows by exactly the ground covered, and gait rises only while stepping', () => {
    const c = createWade(ctx(4), 0, 0)
    const pose = defaultPose()
    let walked = 0, px = c.x, pz = c.z, sawStep = false
    for (let i = 0; i < 3000; i++) {
      c.update(1 / 30, pose)
      walked += Math.hypot(c.x - px, c.z - pz)
      px = c.x; pz = c.z
      if (c.state === 'step') sawStep = true
      if (c.state === 'still' && i > 60) expect(pose.gait).toBeLessThan(1)
    }
    expect(sawStep).toBe(true)
    expect(pose.strideDistance).toBeCloseTo(walked, 9)
  })
  it('eases gait to 1 while stepping and back to 0 when still', () => {
    const c = createWade(ctx(5), 0, 0)
    const pose = defaultPose()
    let guard = 0
    while (c.state !== 'step' && guard++ < 100000) c.update(1 / 30, pose)
    for (let i = 0; i < 15 && c.state === 'step'; i++) c.update(1 / 30, pose)
    expect(pose.gait).toBeGreaterThan(0.9)
    while (c.state === 'step' && guard++ < 100000) c.update(1 / 30, pose)
    for (let i = 0; i < 30; i++) c.update(1 / 30, pose)
    expect(pose.gait).toBeLessThan(0.05)
  })
  it('strikes over a few frames, not in one: at 60 fps the first frame is barely begun, and it is all the way down by 0.15 s', () => {
    const c = createWade(ctx(3), 0, 0)
    const pose = defaultPose()
    let guard = 0
    while (c.state !== 'strike' && guard++ < 100000) c.update(1 / 60, pose)
    expect(pose.reach).toBeLessThan(0.3)                     // the frame that began the strike
    const first = pose.reach
    c.update(1 / 60, pose)
    expect(pose.reach).toBeLessThan(0.3)
    expect(pose.reach).toBeGreaterThan(first)
    for (let t = 2 / 60; t < 0.15; t += 1 / 60) c.update(1 / 60, pose)
    expect(pose.reach).toBeGreaterThan(0.99)
    expect(pose.neckExtend).toBeGreaterThan(0.99)
  })
  it('strikes: neck extends and reaches down fast, then returns', () => {
    const c = createWade(ctx(3), 0, 0)
    const pose = defaultPose()
    let guard = 0
    while (c.state !== 'strike' && guard++ < 100000) c.update(1 / 30, pose)
    expect(c.state).toBe('strike')
    c.update(0.15, pose)
    expect(pose.neckExtend).toBeGreaterThan(0.9)
    expect(pose.reach).toBeGreaterThan(0.9)
    while (c.state === 'strike' && guard++ < 100000) c.update(1 / 30, pose)
    for (let i = 0; i < 60; i++) c.update(1 / 30, pose)
    expect(pose.reach).toBeLessThan(0.05)
  })
})
