/** a ring on the water; `size` (0..1) scales how fast it spreads, how long it lasts, and how many crests it has */
export interface Ripple { x: number; z: number; age: number; size: number }

/**
 * The whole cast's rings peak at 46-48 alive at once (research 2026-09-30-lake-water.md section 4 lifetimes; seeds 42
 * and 7), so 64 leaves room; the swimmers' wakes are drawn from their speed, not as rings.
 */
export const MAX_RIPPLES = 64

/**
 * How a ring of `size` spreads (research section 4): its leading crest runs out at 0.178 + 0.22 size^2 m/s (a dabble
 * 0.20, a heron's strike 0.26, a dive 0.40), its calm inner edge at c_g,min, 0.178 m/s, behind it; it lasts 2 + 4 size
 * seconds and carries 2 + round(4 size) crests. Speeds are computed from capillary-gravity dispersion; the lifetimes
 * and crest counts are estimates.
 */
export const RING = { innerSpeed: 0.178, speedBySize: 0.22, life: [2, 4], crests: [2, 4] } as const

export function ringSpeed(size: number): number { return RING.innerSpeed + RING.speedBySize * size * size }
export function ringLife(size: number): number { return RING.life[0] + RING.life[1] * size }
export function ringCrests(size: number): number { return RING.crests[0] + Math.round(RING.crests[1] * size) }
/** how far a ring's leading crest has run when it fades */
export function ringReach(size: number): number { return ringSpeed(size) * ringLife(size) }

/** the ring's shape in GLSL, for the water's fragment shader */
export const RING_GLSL = /* glsl */ `
float ringSpeed(float size) { return ${RING.innerSpeed.toFixed(3)} + ${RING.speedBySize.toFixed(2)} * size * size; }
float ringLife(float size) { return ${RING.life[0].toFixed(1)} + ${RING.life[1].toFixed(1)} * size; }
float ringCrests(float size) { return ${RING.crests[0].toFixed(1)} + floor(${RING.crests[1].toFixed(1)} * size + 0.5); }`

export class RippleBuffer {
  private list: Ripple[] = []
  constructor(readonly max: number = MAX_RIPPLES) {}

  get rings(): readonly Ripple[] { return this.list }

  /** Add a ring; when full, make room by dropping the one nearest the end of its own life (not simply the oldest). */
  spawn(x: number, z: number, size = 1): void {
    if (this.list.length >= this.max) {
      const used = (r: Ripple) => r.age / ringLife(r.size)
      let worn = 0
      this.list.forEach((r, i) => { if (used(r) > used(this.list[worn]!)) worn = i })
      this.list.splice(worn, 1)
    }
    this.list.push({ x, z, age: 0, size })
  }

  update(dt: number): void {
    for (const r of this.list) r.age += dt
    this.list = this.list.filter(r => r.age < ringLife(r.size))
  }

  pack(target: Float32Array): void {
    for (let i = 0; i < this.max; i++) {
      const r = this.list[i]
      target[i * 4] = r?.x ?? 0
      target[i * 4 + 1] = r?.z ?? 0
      target[i * 4 + 2] = r?.age ?? 99
      target[i * 4 + 3] = r?.size ?? 1
    }
  }
}
