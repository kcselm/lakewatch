import { lakeHeightfield, terrainColor } from './heightfield'

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
})
