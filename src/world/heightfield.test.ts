import { lakeHeightfield, terrainColor, valueNoise2 } from './heightfield'

describe('lakeHeightfield', () => {
  const hf = lakeHeightfield(1)
  it('is above water under the player and below water mid-lake', () => {
    expect(hf.sample(0, 0)).toBeGreaterThan(0.8)
    expect(hf.sample(0, -35)).toBeLessThan(-1)
  })
  it('keeps the mudflat just above water', () => {
    const y = hf.sample(20, -8)
    expect(y).toBeGreaterThan(0)
    expect(y).toBeLessThan(0.4)
  })
  it('rises on the far shore', () => {
    expect(hf.sample(0, -66)).toBeGreaterThan(0.5)
  })
  it('keeps the far ground low enough to sit under the sky', () => {
    expect(hf.sample(0, -300)).toBeLessThan(8)
  })
  it('is deterministic', () => {
    expect(lakeHeightfield(3).sample(4.2, -9.1)).toBe(lakeHeightfield(3).sample(4.2, -9.1))
  })
})

describe('terrainColor', () => {
  it('is mud brown at the waterline and green on high flat ground', () => {
    const [r, g, b] = terrainColor(0.05, 0)
    expect(r).toBeGreaterThan(g)
    expect(g).toBeGreaterThan(b)
    const [r2, g2] = terrainColor(1.5, 0)
    expect(g2).toBeGreaterThan(r2)
  })
  it('shifts toward gravel as slope increases', () => {
    const gravel: [number, number, number] = [0.52, 0.50, 0.46]
    const dist = (c: [number, number, number]) =>
      Math.hypot(c[0] - gravel[0], c[1] - gravel[1], c[2] - gravel[2])
    const y = 1.0
    const flat = terrainColor(y, 0)
    const steep = terrainColor(y, 1.0)
    expect(dist(steep)).toBeLessThan(dist(flat))
    // blue channel rises toward gravel's blue and the green/red gap narrows
    expect(steep[2]).toBeGreaterThan(flat[2])
    expect(Math.abs(steep[1] - steep[0])).toBeLessThan(Math.abs(flat[1] - flat[0]))
  })
})

describe('valueNoise2', () => {
  it('stays within 0..1 over a grid of sample points', () => {
    for (let x = -5; x <= 5; x += 0.37) {
      for (let z = -5; z <= 5; z += 0.53) {
        const v = valueNoise2(x, z, 2)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThan(1)
      }
    }
  })
  it('at a fractional point lies between the four surrounding lattice values', () => {
    const xi = 3, zi = -2
    const corners = [
      valueNoise2(xi, zi, 5),
      valueNoise2(xi + 1, zi, 5),
      valueNoise2(xi, zi + 1, 5),
      valueNoise2(xi + 1, zi + 1, 5),
    ]
    const lo = Math.min(...corners), hi = Math.max(...corners)
    const v = valueNoise2(xi + 0.5, zi + 0.5, 5)
    expect(v).toBeGreaterThanOrEqual(lo - 1e-9)
    expect(v).toBeLessThanOrEqual(hi + 1e-9)
  })
  it('different seeds give different values at the same point', () => {
    expect(valueNoise2(1.3, 4.2, 1)).not.toBe(valueNoise2(1.3, 4.2, 2))
  })
  it('is deterministic for the same inputs', () => {
    expect(valueNoise2(1.3, 4.2, 1)).toBe(valueNoise2(1.3, 4.2, 1))
  })
})
