/** Integer-lattice hash, 0..1. Pure and cheap; not cryptographic. */
export function hash1(x: number, seed: number): number {
  let h = (Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(seed | 0, 0x165667b1)) >>> 0
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

/** 1D value noise with smoothstep interpolation between lattice points. */
export function valueNoise1(t: number, seed: number): number {
  const i = Math.floor(t)
  const f = smoothstep(t - i)
  return hash1(i, seed) * (1 - f) + hash1(i + 1, seed) * f
}
