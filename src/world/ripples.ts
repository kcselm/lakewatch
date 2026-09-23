export interface Ripple { x: number; z: number; age: number }

export const RIPPLE_LIFE = 2.5
export const MAX_RIPPLES = 32

export class RippleBuffer {
  private list: Ripple[] = []
  constructor(readonly max: number = MAX_RIPPLES) {}

  get rings(): readonly Ripple[] { return this.list }

  spawn(x: number, z: number): void {
    if (this.list.length >= this.max) this.list.shift()
    this.list.push({ x, z, age: 0 })
  }

  update(dt: number): void {
    for (const r of this.list) r.age += dt
    this.list = this.list.filter(r => r.age < RIPPLE_LIFE)
  }

  pack(target: Float32Array): void {
    for (let i = 0; i < this.max; i++) {
      const r = this.list[i]
      target[i * 4] = r?.x ?? 0
      target[i * 4 + 1] = r?.z ?? 0
      target[i * 4 + 2] = r?.age ?? 99
      target[i * 4 + 3] = 0
    }
  }
}
