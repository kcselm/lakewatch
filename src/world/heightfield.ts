import { hash1 } from './noise'

export interface Heightfield {
  sample(x: number, z: number): number
  /** how much of the ground at (x, z) is lawn, 0..1, whatever its height: the geese's grazed flat. Unset, none */
  lawn?(x: number, z: number): number
}

function smooth(t: number) { return t * t * (3 - 2 * t) }

/**
 * A flat shelf under the water just past the shallows, where the dowitchers feed belly-deep: `depth` metres down over
 * [x0, x1] by [z0, z1], easing back into the lake bed over a metre. Its edges sit on the terrain mesh's 2 m grid (even
 * coordinates), so its top covers whole cells and renders flat.
 */
export const BENCH = { depth: 0.045, x: [18, 26], z: [-14, -12] } as const

/**
 * A shelf of lake bed along the far waterline, where the herons wade: over [x0, x1] it slopes evenly from `depth[0]`
 * metres under the water at its shore edge (z0) to `depth[1]` at its lake edge (z1), and eases back into the ground
 * within a metre. Its edges sit on the terrain mesh's 2 m grid, and a slope in one direction is what the mesh draws
 * between its vertices, so the rendered shelf is this same plane.
 */
export const SHELF = { x: [-16, 20], z: [-64, -60], depth: [0.05, 0.22] } as const

/**
 * A low grassy flat on the right shore past the mudflat, where the geese graze: over [x0, x1] by [z0, z1] its top is
 * `top` metres above the water, gently uneven by up to half `rough` either way, and on its lake side it slopes into the
 * water at `slope` (1 in 4) square to its shoreline, the line through `shore`'s two points (the basin's rim, where the
 * old bank stood a metre high), until it meets the lake bed. Its edges sit on the terrain mesh's 2 m grid. It eases
 * back into the ground within a metre on its lake sides (x0, z0), and within `back` metres on its land sides (x1, z1),
 * where the ground behind it stands a metre higher, so the bank there rises as a slope and not a wall.
 */
export const FLAT = { x: [30, 44], z: [-24, -8], shore: [[27.6, -10], [43.8, -26]], slope: 0.25, top: 0.3, rough: 0.08, back: 4 } as const

/** how far (x, z) lies landward of the flat's shoreline, metres (negative: out in the lake) */
export function flatShoreDistance(x: number, z: number): number {
  const [[ax, az], [bx, bz]] = FLAT.shore
  const [dx, dz] = [bx - ax, bz - az], len = Math.hypot(dx, dz)
  // the landward normal: +x, +z of the shore's line
  return ((x - ax) * -dz + (z - az) * dx) / len
}

/** the flat's surface: its gently uneven top, its slope down into the lake, and the lake bed where that lies higher */
function flatAt(x: number, z: number, under: number, seed: number): number {
  const top = FLAT.top + (valueNoise2(x * 0.25, z * 0.25, seed + 31) - 0.5) * FLAT.rough
  return Math.min(top, Math.max(flatShoreDistance(x, z) * FLAT.slope, Math.min(under, 0)))
}

/** the shelf's surface at z: its plane, held beyond its edges */
function shelfAt(z: number): number {
  const t = Math.min(1, Math.max(0, (z - SHELF.z[0]) / (SHELF.z[1] - SHELF.z[0])))
  return -(SHELF.depth[0] + (SHELF.depth[1] - SHELF.depth[0]) * t)
}

/** 1 over [a, b], easing to 0 within `margin` outside it below a and `beyond` outside it above b */
function plateau(v: number, a: number, b: number, margin = 1, beyond = margin): number {
  const rise = Math.min(1, Math.max(0, (v - (a - margin)) / margin))
  const fall = Math.min(1, Math.max(0, (b + beyond - v) / beyond))
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

/**
 * The lake's ground; `bench: false` leaves out the dowitchers' bench, `shelf: false` the herons' shelf, and `flat:
 * false` the geese's flat, to compare the ground around them.
 */
export function lakeHeightfield(seed: number, { bench: withBench = true, shelf: withShelf = true, flat: withFlat = true }: { bench?: boolean; shelf?: boolean; flat?: boolean } = {}): Heightfield {
  const flatShare = (x: number, z: number) => (withFlat ? plateau(x, FLAT.x[0], FLAT.x[1], 1, FLAT.back) * plateau(z, FLAT.z[0], FLAT.z[1], 1, FLAT.back) : 0)
  return {
    // the flat's dry ground is lawn
    lawn(x, z) { return flatShare(x, z) * Math.min(1, Math.max(0, flatShoreDistance(x, z) / 0.5)) },
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
      // Flat: blended the same way, over the basin's rim and the bank behind it
      const flat = flatShare(x, z)
      if (flat > 0) y = y * (1 - flat) + flatAt(x, z, y, seed) * flat
      // Far shore: rise beyond z = -62
      if (z < -62) y += Math.min(3, (-62 - z) * 0.35)
      // Shelf: blended last, over the far shore's rise, so its slope stays a plane
      const shelf = withShelf ? plateau(x, SHELF.x[0], SHELF.x[1]) * plateau(z, SHELF.z[0], SHELF.z[1]) : 0
      y = y * (1 - shelf) + shelfAt(z) * shelf
      return y
    },
  }
}

/**
 * The band of wet ground above the waterline (research 2026-09-30-lake-water.md section 6): mud darkens to 0.55 of dry
 * at the water and dries over 0.10 m of height, where capillary rise in silt keeps it damp; gravel darkens to 0.70 and
 * dries within 0.03 m. `gravel` is the slope's share of gravel in `terrainColor`, 0..1.
 */
export const WET = { mud: { height: 0.10, dark: 0.55 }, gravel: { height: 0.03, dark: 0.70 } } as const

function band(h: number, height: number, dark: number): number {
  if (h < 0 || h >= height) return 1
  return dark + (1 - dark) * smooth(h / height)
}

/** what the colour of ground `h` metres above the water is multiplied by: 1 below the water and above the band */
export function wetDarkening(h: number, gravel: number): number {
  return band(h, WET.mud.height, WET.mud.dark) * (1 - gravel) + band(h, WET.gravel.height, WET.gravel.dark) * gravel
}

/** `wetDarkening` in GLSL, for the terrain's fragment shader */
export const WET_GLSL = /* glsl */ `
float wetBand(float h, float height, float dark) {
  if (h < 0.0 || h >= height) return 1.0;
  float t = h / height;
  return dark + (1.0 - dark) * t * t * (3.0 - 2.0 * t);
}
float wetDarkening(float h, float gravel) {
  return mix(wetBand(h, ${WET.mud.height.toFixed(2)}, ${WET.mud.dark.toFixed(2)}), wetBand(h, ${WET.gravel.height.toFixed(2)}, ${WET.gravel.dark.toFixed(2)}), gravel);
}`

/** how much of the ground's colour is gravel at a slope, 0..1 */
export function gravelShare(slope: number): number { return Math.min(1, slope * 2.5) }

/** rgb 0..1 by height and slope: mud at the waterline, gravel where steep, grass above, and grass on a lawn's share. */
export function terrainColor(y: number, slope: number, lawn = 0): [number, number, number] {
  const mud: [number, number, number] = [0.36, 0.28, 0.20]
  const gravel: [number, number, number] = [0.52, 0.50, 0.46]
  const grass: [number, number, number] = [0.33, 0.42, 0.20]
  const dryGrass: [number, number, number] = [0.55, 0.50, 0.28]
  const t = Math.max(lawn, Math.min(1, Math.max(0, (y - 0.15) / 0.9)))
  const base = mud.map((m, i) => m * (1 - t) + grass[i]! * t) as [number, number, number]
  const dry = Math.min(1, Math.max(0, (y - 1.2) / 1.0)) * 0.5
  const g = base.map((b, i) => b * (1 - dry) + dryGrass[i]! * dry) as [number, number, number]
  const s = gravelShare(slope)
  return g.map((c, i) => c * (1 - s) + gravel[i]! * s) as [number, number, number]
}
