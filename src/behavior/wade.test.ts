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
  it('strikes: neck extends fast then returns', () => {
    const c = createWade(ctx(3), 0, 0)
    const pose = defaultPose()
    let guard = 0
    while (c.state !== 'strike' && guard++ < 100000) c.update(1 / 30, pose)
    expect(c.state).toBe('strike')
    c.update(0.15, pose)
    expect(pose.neckExtend).toBeGreaterThan(0.9)
  })
})
