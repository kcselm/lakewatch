import { hash1, valueNoise1 } from './noise'

describe('noise', () => {
  it('hash1 is deterministic and in 0..1', () => {
    expect(hash1(3, 7)).toBe(hash1(3, 7))
    for (let i = 0; i < 50; i++) {
      const v = hash1(i, 11)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
  it('valueNoise1 interpolates between integer lattice values', () => {
    const a = valueNoise1(2, 5)
    const b = valueNoise1(3, 5)
    const mid = valueNoise1(2.5, 5)
    expect(mid).toBeGreaterThanOrEqual(Math.min(a, b) - 1e-9)
    expect(mid).toBeLessThanOrEqual(Math.max(a, b) + 1e-9)
  })
  it('different seeds give different sequences', () => {
    expect(valueNoise1(1.3, 1)).not.toBe(valueNoise1(1.3, 2))
  })
})
