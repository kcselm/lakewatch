import { OPTICS, nextMode, swayOffset } from './optics'

describe('optics', () => {
  it('binoculars are 8x and the telescope 30x relative to 60°', () => {
    expect(OPTICS.eye.fov).toBe(60)
    expect(OPTICS.binoculars.fov).toBeCloseTo(7.5)
    expect(OPTICS.telescope.fov).toBeCloseTo(2)
  })
  it('the telescope has no hand sway and pans slower', () => {
    expect(OPTICS.telescope.sway).toBe(0)
    expect(OPTICS.binoculars.sway).toBeGreaterThan(0)
    expect(OPTICS.telescope.panScale).toBeLessThan(OPTICS.binoculars.panScale)
  })
  it('nextMode steps through the order and clamps at the ends', () => {
    expect(nextMode('eye', 1)).toBe('binoculars')
    expect(nextMode('binoculars', 1)).toBe('telescope')
    expect(nextMode('telescope', 1)).toBe('telescope')
    expect(nextMode('eye', -1)).toBe('eye')
  })
  it('sway is bounded by its amount and zero when amount is zero', () => {
    for (let t = 0; t < 20; t += 0.1) {
      const s = swayOffset(t, 0.002)
      expect(Math.abs(s.x)).toBeLessThanOrEqual(0.002 + 1e-9)
      expect(Math.abs(s.y)).toBeLessThanOrEqual(0.002 + 1e-9)
    }
    expect(swayOffset(3, 0)).toEqual({ x: 0, y: 0 })
  })
})
