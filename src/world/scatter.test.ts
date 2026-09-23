import { scatterInBand } from './scatter'
import type { Heightfield } from './heightfield'

const flat = (y: number): Heightfield => ({ sample: () => y })
const ramp: Heightfield = { sample: (x) => x / 10 }   // y rises with x

describe('scatterInBand', () => {
  it('returns only points whose ground height is within the band', () => {
    const pts = scatterInBand(ramp, { minY: 0, maxY: 1, bounds: [-20, 20, -20, 20], count: 200, seed: 1 })
    expect(pts.length).toBeGreaterThan(20)
    for (const p of pts) {
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(1)
      expect(p.x).toBeGreaterThanOrEqual(0)
    }
  })
  it('returns nothing when the band is empty', () => {
    expect(scatterInBand(flat(5), { minY: 0, maxY: 1, bounds: [-5, 5, -5, 5], count: 50, seed: 1 })).toEqual([])
  })
  it('is deterministic per seed and varies per point', () => {
    const a = scatterInBand(flat(0.5), { minY: 0, maxY: 1, bounds: [-5, 5, -5, 5], count: 10, seed: 9 })
    const b = scatterInBand(flat(0.5), { minY: 0, maxY: 1, bounds: [-5, 5, -5, 5], count: 10, seed: 9 })
    expect(a).toEqual(b)
    expect(new Set(a.map(p => p.phase)).size).toBeGreaterThan(5)
  })
})
