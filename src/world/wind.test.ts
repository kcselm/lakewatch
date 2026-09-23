import { Wind, gustAt } from './wind'

describe('gustAt', () => {
  it('is deterministic for a seed', () => {
    expect(gustAt(12.5, 0.5, 42)).toBe(gustAt(12.5, 0.5, 42))
  })
  it('stays within 0..1', () => {
    for (let t = 0; t < 100; t += 0.37) {
      const g = gustAt(t, 1, 3)
      expect(g).toBeGreaterThanOrEqual(0)
      expect(g).toBeLessThanOrEqual(1)
    }
  })
  it('is flat when gustiness is zero', () => {
    expect(gustAt(0, 0, 1)).toBe(gustAt(50, 0, 1))
  })
})

describe('Wind', () => {
  it('converts a compass direction into a unit vector on the ground plane', () => {
    // direction 0 = wind blowing toward -z (from the north, toward the far shore); 90 = toward +x
    const w = new Wind({ direction: 90, strength: 0.5, gustiness: 0, seed: 1 })
    expect(w.state.dir.x).toBeCloseTo(1)
    expect(w.state.dir.y).toBeCloseTo(0)
  })
  it('advances time and refreshes uniforms on update', () => {
    const w = new Wind({ direction: 0, strength: 0.5, gustiness: 0.5, seed: 1 })
    w.update(0.5)
    expect(w.state.time).toBeCloseTo(0.5)
    expect(w.uniforms.uTime.value).toBeCloseTo(0.5)
    expect(w.uniforms.uWindGust.value).toBe(w.state.gust)
  })
})
