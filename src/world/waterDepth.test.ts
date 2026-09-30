import { bakeWaterDepth, waterAlpha, WATER_DEPTH_BOUNDS, VISIBILITY } from './waterDepth'
import { lakeHeightfield, BENCH, SHELF } from './heightfield'
import { terrainSurface } from './terrain'

const surface = terrainSurface(lakeHeightfield(7))
const baked = bakeWaterDepth(surface)

describe('bakeWaterDepth', () => {
  it('covers the basin at 10 cm a texel', () => {
    const [x0, x1, z0, z1] = WATER_DEPTH_BOUNDS
    expect(baked.width).toBe(Math.round((x1 - x0) / 0.1))
    expect(baked.height).toBe(Math.round((z1 - z0) / 0.1))
    expect(baked.data).toHaveLength(baked.width * baked.height)
  })
  it('is zero on land: the vantage, the mudflat, and the far bank', () => {
    expect(baked.at(0, -2.5)).toBe(0)
    expect(baked.at(20, -7)).toBe(0)
    expect(baked.at(0, -69)).toBe(0)
  })
  it('agrees with the rendered terrain wherever it samples', () => {
    for (const [x, z] of [[2, -36], [-20, -30], [10, -50], [22, -13], [0, -61.5], [15, -20]] as const) {
      expect(baked.at(x, z)).toBeCloseTo(Math.max(0, -surface.sample(x, z)), 2)
    }
  })
  it('reads the bench as 4.5 cm deep and the shelf as sloping from 5 to 22 cm', () => {
    expect(baked.at(22, -13)).toBeCloseTo(BENCH.depth, 2)
    expect(baked.at(0, SHELF.z[0] + 0.2)).toBeCloseTo(SHELF.depth[0] + (SHELF.depth[1] - SHELF.depth[0]) * 0.05, 2)
    expect(baked.at(0, SHELF.z[1] - 0.2)).toBeCloseTo(SHELF.depth[1] - (SHELF.depth[1] - SHELF.depth[0]) * 0.05, 2)
  })
  it('is deepest near the basin centre, over 2.5 m', () => {
    let deepest = 0, at: [number, number] = [0, 0]
    for (let z = -60; z <= -10; z += 1) for (let x = -35; x <= 40; x += 1) {
      const d = baked.at(x, z)
      if (d > deepest) { deepest = d; at = [x, z] }
    }
    expect(deepest).toBeGreaterThan(2.5)
    expect(Math.hypot(at[0] - 2, at[1] + 36)).toBeLessThan(12)
  })
  it('clamps outside its bounds to the edge texel', () => {
    expect(baked.at(-500, -500)).toBe(baked.at(WATER_DEPTH_BOUNDS[0], WATER_DEPTH_BOUNDS[2]))
  })
})

describe('waterAlpha', () => {
  // the research's thresholds (section 9): the bench shows its bed, the shelf fades out across its width, and the bed
  // is gone by 30 cm
  it('lets the bed show through the shallows and hides it by 30 cm', () => {
    expect(waterAlpha(0)).toBe(0)
    expect(waterAlpha(BENCH.depth)).toBeLessThanOrEqual(0.6)
    expect(waterAlpha(SHELF.depth[0])).toBeGreaterThanOrEqual(0.5)
    expect(waterAlpha(SHELF.depth[0])).toBeLessThanOrEqual(0.7)
    expect(waterAlpha(SHELF.depth[1])).toBeGreaterThanOrEqual(0.95)
    expect(waterAlpha(0.3)).toBeGreaterThanOrEqual(0.99)
  })
  it('rises with depth', () => {
    for (let d = 0; d < 0.5; d += 0.01) expect(waterAlpha(d + 0.01)).toBeGreaterThan(waterAlpha(d))
    expect(VISIBILITY).toBe(0.06)
  })
})
