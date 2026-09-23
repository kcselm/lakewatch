import { makeRng } from '../catalog/rng'
import type { Heightfield } from './heightfield'

export interface ScatterPoint { x: number; z: number; y: number; scale: number; tint: number; phase: number }

export interface ScatterOptions {
  minY: number
  maxY: number
  /** [minX, maxX, minZ, maxZ] */
  bounds: [number, number, number, number]
  /** candidate samples; the result has at most this many */
  count: number
  seed: number
}

export function scatterInBand(hf: Heightfield, o: ScatterOptions): ScatterPoint[] {
  const rng = makeRng(o.seed)
  const [x0, x1, z0, z1] = o.bounds
  const out: ScatterPoint[] = []
  for (let i = 0; i < o.count; i++) {
    const x = x0 + rng() * (x1 - x0)
    const z = z0 + rng() * (z1 - z0)
    const y = hf.sample(x, z)
    if (y < o.minY || y > o.maxY) continue
    out.push({ x, z, y, scale: 0.7 + rng() * 0.6, tint: rng(), phase: rng() * Math.PI * 2 })
  }
  return out
}
