/** a ring on the water; `size` (0..1) scales how far it spreads, how long it lasts, and how bright it is */
export interface Ripple { x: number; z: number; age: number; size: number }

export const RIPPLE_LIFE = 2.5
export const MAX_RIPPLES = 32

export class RippleBuffer {
  private list: Ripple[] = []
  constructor(readonly max: number = MAX_RIPPLES) {}

  get rings(): readonly Ripple[] { return this.list }

  /** Add a ring; when full, make room by dropping the one nearest the end of its own life (not simply the oldest). */
  spawn(x: number, z: number, size = 1): void {
    if (this.list.length >= this.max) {
      const used = (r: Ripple) => r.age / (RIPPLE_LIFE * r.size)
      let worn = 0
      this.list.forEach((r, i) => { if (used(r) > used(this.list[worn]!)) worn = i })
      this.list.splice(worn, 1)
    }
    this.list.push({ x, z, age: 0, size })
  }

  update(dt: number): void {
    for (const r of this.list) r.age += dt
    this.list = this.list.filter(r => r.age < RIPPLE_LIFE * r.size)
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
