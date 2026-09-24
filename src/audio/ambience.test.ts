import { windLayerGain, windFilterHz, lappingGain, lappingWindScale } from './ambience'

describe('windLayerGain', () => {
  it('never falls silent and rises with the gust', () => {
    expect(windLayerGain(0, 0)).toBeCloseTo(0.25, 6)
    expect(windLayerGain(1, 1)).toBeCloseTo(1, 6)
    expect(windLayerGain(0.35, 0.9)).toBeGreaterThan(windLayerGain(0.35, 0.1))
  })
})

describe('windFilterHz', () => {
  it('sweeps between 500 and 1400 Hz and clamps outside 0..1', () => {
    expect(windFilterHz(0)).toBe(500)
    expect(windFilterHz(1)).toBe(1400)
    expect(windFilterHz(3)).toBe(1400)
  })
})

describe('lappingGain', () => {
  it('stays within 0.4..1 and is deterministic per seed', () => {
    for (let t = 0; t < 100; t += 0.7) {
      const g = lappingGain(t, 5)
      expect(g).toBeGreaterThanOrEqual(0.4)
      expect(g).toBeLessThanOrEqual(1)
    }
    expect(lappingGain(12.5, 5)).toBe(lappingGain(12.5, 5))
    expect(lappingGain(12.5, 5)).not.toBe(lappingGain(12.5, 6))
  })
})

describe('lappingWindScale', () => {
  it('is nearly silent on a still lake and full in a strong wind', () => {
    expect(lappingWindScale(0)).toBeCloseTo(0.1, 6)
    expect(lappingWindScale(1)).toBeCloseTo(1, 6)
    expect(lappingWindScale(2)).toBeCloseTo(1, 6)
    expect(lappingWindScale(0.3)).toBeLessThan(lappingWindScale(0.6))
  })
})
