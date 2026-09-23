import { paletteFor } from './palette'

describe('paletteFor', () => {
  it('gives a low warm sun on an early-autumn morning', () => {
    const p = paletteFor('early-autumn', 'morning')
    expect(p.sunElevation).toBeGreaterThan(10)
    expect(p.sunElevation).toBeLessThan(35)
    expect(p.sun).toMatch(/^#[0-9a-f]{6}$/)
  })
  it('puts the midday sun higher than the morning sun', () => {
    expect(paletteFor('summer', 'midday').sunElevation).toBeGreaterThan(paletteFor('summer', 'morning').sunElevation)
  })
})
