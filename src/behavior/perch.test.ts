import { createPerch, LOOP_SECONDS } from './perch'
import { defaultPose } from '../birds/model'
import { makeRng } from '../catalog/rng'
import type { BehaviorContext } from './types'

const PERCH: [number, number, number] = [6.7, 7.25, -7]
const ctx = (seed: number, events: string[] = []): BehaviorContext => ({
  zone: { kind: 'point', position: [5, 3, -7] }, perch: PERCH, rng: makeRng(seed), wingbeatHz: 7,
  wind: () => ({ dirX: 1, dirZ: 0, effective: 0.3 }), ground: () => 0,
  onEvent: name => events.push(name),
})

describe('perch', () => {
  it('sits exactly on the perch to begin with', () => {
    const c = createPerch(ctx(1), 0, 0)
    c.update(1 / 30, defaultPose())
    expect([c.x, c.y, c.z]).toEqual(PERCH)
    expect(c.state).toBe('sit')
  })
  it('visits every state over a long enough watch', () => {
    const c = createPerch(ctx(2), 0, 0)
    const states = new Set<string>()
    for (let t = 0; t < 900; t += 1 / 30) { c.update(1 / 30, defaultPose()); states.add(c.state) }
    expect(states).toEqual(new Set(['sit', 'shuffle', 'stretch', 'loop']))
  })
  it('a loop flight lifts off with wings spread, flaps, and lands back on the perch', () => {
    const events: string[] = []
    const c = createPerch(ctx(3, events), 0, 0)
    const pose = defaultPose()
    let guard = 0
    while (c.state !== 'loop' && guard++ < 100000) c.update(1 / 30, pose)
    expect(c.state).toBe('loop')
    let maxY = -Infinity, maxSpread = 0, far = 0
    const phases = new Set<number>()
    while (c.state === 'loop') {
      c.update(1 / 30, pose)
      maxY = Math.max(maxY, c.y); maxSpread = Math.max(maxSpread, pose.wingSpread)
      far = Math.max(far, Math.hypot(c.x - PERCH[0], c.z - PERCH[2]))
      phases.add(Math.round(pose.wingPhase * 10))
    }
    expect(maxY).toBeGreaterThan(PERCH[1] + 1.5)
    expect(maxSpread).toBeGreaterThan(0.95)
    expect(far).toBeGreaterThan(6)
    expect(phases.size).toBeGreaterThan(5)
    expect(c.state).toBe('sit')
    expect(c.x).toBeCloseTo(PERCH[0], 6)
    expect(c.y).toBeCloseTo(PERCH[1], 6)
    expect(c.z).toBeCloseTo(PERCH[2], 6)
    expect(events).toEqual(['flap'])
  })
  it('never leaves the perch while sitting, shuffling, or stretching', () => {
    const c = createPerch(ctx(4), 0, 0)
    for (let t = 0; t < 300; t += 1 / 30) {
      c.update(1 / 30, defaultPose())
      if (c.state !== 'loop') expect([c.x, c.y, c.z]).toEqual(PERCH)
    }
  })
  it('throws without a perch', () => {
    expect(() => createPerch({ ...ctx(5), perch: undefined }, 0, 0)).toThrow(/perch/)
  })
  it('is deterministic per seed', () => {
    const a = createPerch(ctx(6), 0, 0), b = createPerch(ctx(6), 0, 0)
    for (let i = 0; i < 3000; i++) { a.update(1 / 30, defaultPose()); b.update(1 / 30, defaultPose()) }
    expect([a.x, a.y, a.z, a.state]).toEqual([b.x, b.y, b.z, b.state])
  })
})

describe('LOOP_SECONDS', () => {
  it('is a few seconds', () => { expect(LOOP_SECONDS).toBeGreaterThan(3) })
})
