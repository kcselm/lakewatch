import { createHover, WATER_Y } from './hover'
import { defaultPose } from '../birds/model'
import { makeRng } from '../catalog/rng'
import type { BehaviorContext } from './types'

const PERCH: [number, number, number] = [23.7, 4.25, -48]
const ctx = (seed: number, events: string[] = [], ripples: number[] = []): BehaviorContext => ({
  zone: { kind: 'point', position: [22, 0, -48] }, perch: PERCH, rng: makeRng(seed), wingbeatHz: 6,
  wind: () => ({ dirX: 1, dirZ: 0, effective: 0.3 }), ground: () => -2,
  onEvent: name => events.push(name), onRipple: () => ripples.push(1),
})

describe('hover', () => {
  it('starts on the perch and cycles through every state', () => {
    const c = createHover(ctx(1), 0, 0)
    c.update(1 / 30, defaultPose())
    expect([c.x, c.y, c.z]).toEqual(PERCH)
    const states = new Set<string>()
    for (let t = 0; t < 900; t += 1 / 30) { c.update(1 / 30, defaultPose()); states.add(c.state) }
    expect(states).toEqual(new Set(['perch', 'flyout', 'hover', 'dive', 'surface', 'return']))
  })
  it('hovers within reach of the perch at a sensible height, then dives to the water', () => {
    const events: string[] = [], ripples: number[] = []
    const c = createHover(ctx(2, events, ripples), 0, 0)
    const pose = defaultPose()
    let guard = 0
    while (c.state !== 'hover' && guard++ < 100000) c.update(1 / 30, pose)
    const d = Math.hypot(c.x - PERCH[0], c.z - PERCH[2])
    expect(d).toBeGreaterThanOrEqual(5.5)
    expect(d).toBeLessThanOrEqual(12.5)
    expect(c.y).toBeGreaterThan(WATER_Y + 5.5)
    expect(c.y).toBeLessThan(WATER_Y + 9.5)
    expect(pose.wingSpread).toBeGreaterThan(0.95)
    const hx = c.x, hz = c.z
    let minY = Infinity
    while (c.state !== 'return' && guard++ < 100000) { c.update(1 / 30, pose); minY = Math.min(minY, c.y) }
    expect(minY).toBeCloseTo(WATER_Y, 6)
    expect(Math.hypot(c.x - hx, c.z - hz)).toBeLessThan(0.5)     // dives straight down
    expect(events).toEqual(['splash'])
    expect(ripples).toHaveLength(1)
  })
  it('returns to the exact perch point and sits again', () => {
    const c = createHover(ctx(3), 0, 0)
    let guard = 0
    while (c.state !== 'return' && guard++ < 100000) c.update(1 / 30, defaultPose())
    while (c.state === 'return' && guard++ < 100000) c.update(1 / 30, defaultPose())
    expect(c.state).toBe('perch')
    expect(c.x).toBeCloseTo(PERCH[0], 6)
    expect(c.y).toBeCloseTo(PERCH[1], 6)
    expect(c.z).toBeCloseTo(PERCH[2], 6)
  })
  it('never goes below the water', () => {
    const c = createHover(ctx(4), 0, 0)
    for (let t = 0; t < 600; t += 1 / 30) { c.update(1 / 30, defaultPose()); expect(c.y).toBeGreaterThanOrEqual(WATER_Y) }
  })
  it('throws without a perch', () => {
    expect(() => createHover({ ...ctx(5), perch: undefined }, 0, 0)).toThrow(/perch/)
  })
  it('is deterministic per seed', () => {
    const a = createHover(ctx(6), 0, 0), b = createHover(ctx(6), 0, 0)
    for (let i = 0; i < 6000; i++) { a.update(1 / 30, defaultPose()); b.update(1 / 30, defaultPose()) }
    expect([a.x, a.y, a.z, a.state]).toEqual([b.x, b.y, b.z, b.state])
  })
})
