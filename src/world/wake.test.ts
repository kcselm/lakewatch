import { wakeAt, wakeStrength, transverseWavelength, WAKE } from './wake'

describe('wakeStrength', () => {
  it('makes no wake below c_min, 0.23 m/s, and a full one by 0.30', () => {
    expect(wakeStrength(0)).toBe(0)
    expect(wakeStrength(0.23)).toBe(0)
    expect(wakeStrength(0.26)).toBeGreaterThan(0)
    expect(wakeStrength(0.26)).toBeLessThan(1)
    expect(wakeStrength(0.3)).toBe(1)
    expect(wakeStrength(0.7)).toBe(1)
  })
})

describe('wakeAt', () => {
  const edge = (behind: number, deg: number) => behind * Math.tan(deg * Math.PI / 180)
  it('holds the Kelvin half-angle, 19.47 degrees, at its outer edge', () => {
    expect(wakeAt(1, edge(1, 19.37), 0.5)).toBeGreaterThan(0)
    expect(wakeAt(1, edge(1, 19.57), 0.5)).toBe(0)
    expect(wakeAt(2, -edge(2, 19.37), 0.5)).toBeGreaterThan(0)
  })
  it('is brightest on its arms, about 15 degrees out, and fainter on the centreline', () => {
    expect(wakeAt(1, edge(1, 15), 0.5)).toBeGreaterThan(wakeAt(1, 0, 0.5))
    expect(wakeAt(1, edge(1, 15), 0.5)).toBeGreaterThan(wakeAt(1, edge(1, 18), 0.5))
  })
  it('is nothing ahead of the bird, and at most 5% of its peak 5 m behind', () => {
    expect(wakeAt(-0.5, 0, 0.5)).toBe(0)
    const peak = wakeAt(0.01, edge(0.01, 15), 0.5)
    expect(wakeAt(4.99, edge(4.99, 15), 0.5)).toBeLessThanOrEqual(0.05 * peak)
    expect(wakeAt(5.01, 0, 0.5)).toBe(0)
  })
  it('is nothing behind a bird too slow to make waves: the grebe at its 0.15 m/s cruise', () => {
    expect(wakeAt(1, edge(1, 15), 0.15)).toBe(0)
  })
  it('matches its GLSL twin\'s constants', () => {
    expect(WAKE.halfAngle).toBeCloseTo(Math.asin(1 / 3), 3)
  })
})

describe('transverseWavelength', () => {
  it('is 8, 16, and 31 cm at 0.35, 0.5, and 0.7 m/s', () => {
    expect(transverseWavelength(0.35)).toBeCloseTo(0.078, 2)
    expect(transverseWavelength(0.5)).toBeCloseTo(0.16, 2)
    expect(transverseWavelength(0.7)).toBeCloseTo(0.314, 2)
  })
})
