import type { Heightfield } from './heightfield'

/** [x0, x1, z0, z1]: the basin, the bench, and the shelf, with a margin of bank all round */
export const WATER_DEPTH_BOUNDS = [-44, 48, -70, -2] as const
const TEXEL = 0.1

/**
 * How deep the water's colour builds: alpha is 1 - exp(-depth / VISIBILITY). 0.06 m from a Secchi depth of 0.7 m seen
 * at the vantage's grazing angles (research, 2026-09-30-lake-water.md section 2), so the bed is gone by 0.3 m.
 */
export const VISIBILITY = 0.06

export function waterAlpha(depth: number): number {
  return depth <= 0 ? 0 : 1 - Math.exp(-depth / VISIBILITY)
}

export interface WaterDepth {
  /** depth in metres, row by row from z0, 0 on land */
  data: Float32Array
  width: number
  height: number
  bounds: typeof WATER_DEPTH_BOUNDS
  /** the depth at (x, z), filtered between texels as the shader reads it, clamped to the bounds */
  at(x: number, z: number): number
}

/**
 * The water's depth over the basin, baked once from the rendered terrain (`terrainSurface`), so the water's colour,
 * clarity, and shoreline meet the ground the player sees. The water's surface is y = 0.
 */
export function bakeWaterDepth(surface: Heightfield): WaterDepth {
  const [x0, x1, z0, z1] = WATER_DEPTH_BOUNDS
  const width = Math.round((x1 - x0) / TEXEL), height = Math.round((z1 - z0) / TEXEL)
  const data = new Float32Array(width * height)
  for (let j = 0; j < height; j++) {
    const z = z0 + (j + 0.5) * TEXEL
    for (let i = 0; i < width; i++) data[j * width + i] = Math.max(0, -surface.sample(x0 + (i + 0.5) * TEXEL, z))
  }
  return {
    data, width, height, bounds: WATER_DEPTH_BOUNDS,
    at(x, z) {
      // between the four nearest texel centres, as the GPU's linear filter reads the texture
      const gx = Math.min(width - 1, Math.max(0, (x - x0) / TEXEL - 0.5))
      const gz = Math.min(height - 1, Math.max(0, (z - z0) / TEXEL - 0.5))
      const i = Math.min(width - 2, Math.floor(gx)), j = Math.min(height - 2, Math.floor(gz))
      const u = gx - i, v = gz - j
      const d = (a: number, b: number) => data[b * width + a]!
      return (d(i, j) * (1 - u) + d(i + 1, j) * u) * (1 - v) + (d(i, j + 1) * (1 - u) + d(i + 1, j + 1) * u) * v
    },
  }
}
