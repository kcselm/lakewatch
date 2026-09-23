import { createSwim } from './swim'
import { defaultPose } from '../birds/model'
import { makeRng } from '../catalog/rng'
import { pointInPolygon } from '../location/zones'
import type { BehaviorContext } from './types'

const zone = { kind: 'polygon' as const, points: [[-10, -10], [10, -10], [10, 10], [-10, 10]] as [number, number][] }
const ctx = (seed: number, ripples: [number, number][] = []): BehaviorContext => ({
  zone, rng: makeRng(seed),
  wind: () => ({ dirX: 1, dirZ: 0, effective: 0.5 }),
  ground: () => -2,
  onRipple: (x, z) => ripples.push([x, z]),
})

function run(c: ReturnType<typeof createSwim>, seconds: number, step = 1 / 30) {
  const pose = defaultPose()
  const states = new Set<string>()
  for (let t = 0; t < seconds; t += step) { c.update(step, pose); states.add(c.state) }
  return { pose, states }
}

describe('swim', () => {
  it('stays inside the zone and on the water surface', () => {
    const c = createSwim(ctx(1), 0, 0)
    for (let i = 0; i < 3000; i++) {
      c.update(1 / 30, defaultPose())
      expect(pointInPolygon(c.x, c.z, zone.points)).toBe(true)
      expect(c.y).toBe(0)
    }
  })
  it('cycles through cruise, idle, and dabble over time', () => {
    const { states } = run(createSwim(ctx(2), 0, 0), 120)
    expect(states).toContain('cruise')
    expect(states).toContain('idle')
    expect(states).toContain('dabble')
  })
  it('spawns ripples while cruising', () => {
    const ripples: [number, number][] = []
    run(createSwim(ctx(3, ripples), 0, 0), 20)
    expect(ripples.length).toBeGreaterThan(3)
  })
  it('drifts downwind while idle', () => {
    const c = createSwim(ctx(4), 0, 0)
    // force idle by running until state is idle, then measure
    let guard = 0
    while (c.state !== 'idle' && guard++ < 20000) c.update(1 / 30, defaultPose())
    const x0 = c.x
    for (let i = 0; i < 30 && c.state === 'idle'; i++) c.update(1 / 30, defaultPose())
    expect(c.x).toBeGreaterThan(x0)
  })
  it('tips the body nose-down while dabbling', () => {
    const c = createSwim(ctx(5), 0, 0)
    const pose = defaultPose()
    let guard = 0
    while (c.state !== 'dabble' && guard++ < 50000) c.update(1 / 30, pose)
    c.update(0.3, pose)
    expect(pose.lean.x).toBeGreaterThan(0.3)
  })
  it('is deterministic per seed', () => {
    const a = createSwim(ctx(9), 1, 1), b = createSwim(ctx(9), 1, 1)
    for (let i = 0; i < 500; i++) { a.update(1 / 30, defaultPose()); b.update(1 / 30, defaultPose()) }
    expect([a.x, a.z, a.state]).toEqual([b.x, b.z, b.state])
  })
})
