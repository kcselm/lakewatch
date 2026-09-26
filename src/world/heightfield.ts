import { hash1 } from './noise'

export interface Heightfield {
  sample(x: number, z: number): number
}

function smooth(t: number) { return t * t * (3 - 2 * t) }

/**
 * A flat shelf under the water just past the shallows, where the dowitchers feed belly-deep: `depth` metres down over
 * [x0, x1] by [z0, z1], easing back into the lake bed over a metre. Its edges sit on the terrain mesh's 2 m grid (even
 * coordinates), so its top covers whole cells and renders flat.
 */
export const BENCH = { depth: 0.045, x: [18, 26], z: [-14, -12] } as const

/** 1 over [a, b], easing to 0 within `margin` outside it */
function plateau(v: number, a: number, b: number, margin = 1): number {
  const rise = Math.min(1, Math.max(0, (v - (a - margin)) / margin))
  const fall = Math.min(1, Math.max(0, (b + margin - v) / margin))
  return smooth(rise) * smooth(fall)
}

/** 2D value noise, 0..1. */
export function valueNoise2(x: number, z: number, seed: number): number {
  const xi = Math.floor(x), zi = Math.floor(z)
  const fx = smooth(x - xi), fz = smooth(z - zi)
  const h = (a: number, b: number) => hash1(a * 7919 + b, seed)
  const top = h(xi, zi) * (1 - fx) + h(xi + 1, zi) * fx
  const bot = h(xi, zi + 1) * (1 - fx) + h(xi + 1, zi + 1) * fx
  return top * (1 - fz) + bot * fz
}

function fbm(x: number, z: number, seed: number): number {
  return 0.6 * valueNoise2(x, z, seed) + 0.3 * valueNoise2(x * 2.1, z * 2.1, seed + 1) + 0.1 * valueNoise2(x * 4.3, z * 4.3, seed + 2)
}

/** The lake's ground; `bench: false` leaves out the dowitchers' bench, to compare the lake bed around it. */
export function lakeHeightfield(seed: number, { bench: withBench = true }: { bench?: boolean } = {}): Heightfield {
  return {
    sample(x, z) {
      // Basin: an ellipse centred at (2, -36), radii 44 x 32. Inside is below water.
      const ex = (x - 2) / 44, ez = (z + 36) / 32
      const r = Math.sqrt(ex * ex + ez * ez)         // 0 centre .. 1 rim
      let y = r < 1 ? -3.2 * (1 - r * r) : 1.0 + Math.min(3, (r - 1) * 2.0)
      // Bank under the player: a mound around (0,0)
      const dp = Math.hypot(x, z)
      y += 1.4 * Math.exp(-(dp * dp) / 80)
      // Detail
      y += (fbm(x * 0.15, z * 0.15, seed) - 0.5) * 0.35
      // Mudflat: a flat shelf at +0.08 on the right foreground, blended after the detail so it stays flat
      const mx = (x - 20) / 12, mz = (z + 8) / 6
      const mud = Math.exp(-(mx * mx + mz * mz))
      y = y * (1 - mud) + 0.08 * mud
      // Bench: blended the same way, so its top stays flat
      const bench = withBench ? plateau(x, BENCH.x[0], BENCH.x[1]) * plateau(z, BENCH.z[0], BENCH.z[1]) : 0
      y = y * (1 - bench) - BENCH.depth * bench
      // Far shore: rise beyond z = -62
      if (z < -62) y += Math.min(3, (-62 - z) * 0.35)
      return y
    },
  }
}

/** rgb 0..1 by height and slope: mud at the waterline, gravel where steep, grass above. */
export function terrainColor(y: number, slope: number): [number, number, number] {
  const mud: [number, number, number] = [0.36, 0.28, 0.20]
  const gravel: [number, number, number] = [0.52, 0.50, 0.46]
  const grass: [number, number, number] = [0.33, 0.42, 0.20]
  const dryGrass: [number, number, number] = [0.55, 0.50, 0.28]
  const t = Math.min(1, Math.max(0, (y - 0.15) / 0.9))
  const base = mud.map((m, i) => m * (1 - t) + grass[i]! * t) as [number, number, number]
  const dry = Math.min(1, Math.max(0, (y - 1.2) / 1.0)) * 0.5
  const g = base.map((b, i) => b * (1 - dry) + dryGrass[i]! * dry) as [number, number, number]
  const s = Math.min(1, slope * 2.5)
  return g.map((c, i) => c * (1 - s) + gravel[i]! * s) as [number, number, number]
}
